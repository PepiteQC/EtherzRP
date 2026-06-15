// server/routes/hotel.routes.ts

import { Router } from 'express';
import { z } from 'zod';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as crypto from 'crypto';

const router = Router();
const adminDb = getFirestore();

// ─── SCHEMAS ─────────────────────────────────────────────────────────────────

const roomIdSchema = z.string().regex(/^hotel_F[1-3]_(left|right)_R[0-4]$/);

const lockKeycardSchema = z.object({
  roomId: roomIdSchema,
});

const lockPinSchema = z.object({
  roomId: roomIdSchema,
  pin: z.string().min(4).max(8),
});

const lockEngageSchema = z.object({
  roomId: roomIdSchema,
});

const lockDeadboltSchema = z.object({
  roomId: roomIdSchema,
  engaged: z.boolean(),
});

const safeSetCodeSchema = z.object({
  roomId: roomIdSchema,
  code: z.string().min(4).max(8),
});

const safeUnlockSchema = z.object({
  roomId: roomIdSchema,
  code: z.string().min(4).max(8),
});

const safeLockSchema = z.object({
  roomId: roomIdSchema,
});

const lightToggleSchema = z.object({
  roomId: roomIdSchema,
});

const thermostatSchema = z.object({
  roomId: roomIdSchema,
  temp: z.number().int().min(16).max(28),
});

const acquireRoomSchema = z.object({
  roomId: roomIdSchema,
  price: z.number().min(0),
});

const grantAccessSchema = z.object({
  roomId: roomIdSchema,
  targetUid: z.string().min(1),
  type: z.enum(['tenant', 'guest', 'staff', 'maintenance']),
  pin: z.string().min(4).max(8).optional(),
  validUntilHours: z.number().min(1).max(8760).optional(), // max 1 year
});

const revokeAccessSchema = z.object({
  accessId: z.string().min(1),
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function hashPin(pin: string): string {
  const salt = 'etherzrp_hotel_pin_salt_v1';
  return crypto.createHash('sha256').update(salt + pin).digest('hex');
}

function generateKeycardToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

async function writeAuditLog(params: {
  roomId: string;
  uid: string;
  action: string;
  method: string | null;
  result: 'success' | 'denied' | 'failed';
  reason?: string;
}): Promise<void> {
  const now = Date.now();
  const logId = `${params.action}_${params.uid}_${params.roomId}_${now}`;

  await adminDb.collection('hotel_access_logs').doc(logId).set({
    logId,
    roomId: params.roomId,
    uid: params.uid,
    action: params.action,
    method: params.method,
    result: params.result,
    reason: params.reason ?? null,
    ipAddress: null,
    userAgent: null,
    createdAt: new Date(),
  });
}

async function checkUserAccess(
  uid: string,
  roomId: string
): Promise<{ hasAccess: boolean; type: string | null }> {
  const snap = await adminDb
    .collection('hotel_access')
    .where('roomId', '==', roomId)
    .where('uid', '==', uid)
    .where('active', '==', true)
    .limit(1)
    .get();

  if (snap.empty) return { hasAccess: false, type: null };

  const access = snap.docs[0].data();
  const now = new Date();

  if (access.validUntil && access.validUntil.toDate() < now) {
    await snap.docs[0].ref.update({ active: false, revokedAt: new Date() });
    return { hasAccess: false, type: null };
  }

  return { hasAccess: true, type: access.type };
}

// ─── LOCK ROUTES ─────────────────────────────────────────────────────────────

/**
 * POST /api/hotel/lock/keycard
 * Tente un déverrouillage par carte d'accès.
 * Anti-casse #18: le navigateur ne commande JAMAIS la serrure directement.
 */
router.post('/lock/keycard', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId } = lockKeycardSchema.parse(req.body);
    const uid = (req as any).uid;

    const { hasAccess, type } = await checkUserAccess(uid, roomId);

    if (!hasAccess) {
      await writeAuditLog({
        roomId,
        uid,
        action: 'door_denied',
        method: 'keycard',
        result: 'denied',
        reason: 'No active access',
      });
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    // Vérifier que le verrou de sécurité n'est pas engagé
    const lockSnap = await adminDb.collection('hotel_locks').doc(`${roomId}_Dentry`).get();
    if (lockSnap.exists()) {
      const lockData = lockSnap.data()!;
      if (lockData.deadboltEngaged) {
        await writeAuditLog({
          roomId,
          uid,
          action: 'door_denied',
          method: 'keycard',
          result: 'denied',
          reason: 'Deadbolt engaged',
        });
        return res.status(403).json({
          success: false,
          error: 'Verrou de sécurité engagé depuis l\'intérieur',
        });
      }
    }

    // Déverrouiller
    await adminDb.collection('hotel_locks').doc(`${roomId}_Dentry`).set(
      {
        lockId: `${roomId}_Dentry`,
        roomId,
        doorType: 'entry',
        locked: false,
        lastAccessAt: new Date(),
        lastAccessUid: uid,
        lastAccessMethod: 'keycard',
        updatedAt: new Date(),
      },
      { merge: true }
    );

    await writeAuditLog({
      roomId,
      uid,
      action: 'door_unlock',
      method: 'keycard',
      result: 'success',
    });

    // Auto-relock après 5 secondes
    setTimeout(async () => {
      await adminDb.collection('hotel_locks').doc(`${roomId}_Dentry`).update({
        locked: true,
        updatedAt: new Date(),
      });
      await writeAuditLog({
        roomId,
        uid,
        action: 'door_lock',
        method: 'system',
        result: 'success',
        reason: 'Auto-relock after 5s',
      });
    }, 5000);

    return res.json({ success: true, accessType: type });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/lock/pin
 * Tente un déverrouillage par code PIN.
 */
router.post('/lock/pin', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId, pin } = lockPinSchema.parse(req.body);
    const uid = (req as any).uid;

    const { hasAccess, type } = await checkUserAccess(uid, roomId);
    if (!hasAccess) {
      await writeAuditLog({
        roomId,
        uid,
        action: 'door_denied',
        method: 'pin',
        result: 'denied',
      });
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    // Vérifier le PIN
    const accessSnap = await adminDb
      .collection('hotel_access')
      .where('roomId', '==', roomId)
      .where('uid', '==', uid)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (accessSnap.empty) {
      return res.status(403).json({ success: false, error: 'Accès non trouvé' });
    }

    const access = accessSnap.docs[0].data();
    if (access.pin && hashPin(pin) !== access.pin) {
      await writeAuditLog({
        roomId,
        uid,
        action: 'door_denied',
        method: 'pin',
        result: 'denied',
        reason: 'Invalid PIN',
      });
      return res.status(403).json({ success: false, error: 'Code incorrect' });
    }

    // Déverrouiller
    await adminDb.collection('hotel_locks').doc(`${roomId}_Dentry`).set(
      {
        locked: false,
        lastAccessAt: new Date(),
        lastAccessUid: uid,
        lastAccessMethod: 'pin',
        updatedAt: new Date(),
      },
      { merge: true }
    );

    await writeAuditLog({
      roomId,
      uid,
      action: 'door_unlock',
      method: 'pin',
      result: 'success',
    });

    return res.json({ success: true, accessType: type });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/lock/engage
 * Verrouille la porte.
 */
router.post('/lock/engage', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId } = lockEngageSchema.parse(req.body);
    const uid = (req as any).uid;

    await adminDb.collection('hotel_locks').doc(`${roomId}_Dentry`).set(
      {
        locked: true,
        lastAccessUid: uid,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    await writeAuditLog({
      roomId,
      uid,
      action: 'door_lock',
      method: 'keycard',
      result: 'success',
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/lock/deadbolt
 * Engage/désengage le verrou de sécurité.
 */
router.post('/lock/deadbolt', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId, engaged } = lockDeadboltSchema.parse(req.body);
    const uid = (req as any).uid;

    // Vérifier que l'utilisateur est dans la chambre (a un accès actif)
    const { hasAccess } = await checkUserAccess(uid, roomId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    await adminDb.collection('hotel_locks').doc(`${roomId}_Dentry`).set(
      {
        deadboltEngaged: engaged,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return res.json({ success: true, deadboltEngaged: engaged });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ─── SAFE ROUTES ─────────────────────────────────────────────────────────────

/**
 * POST /api/hotel/safe/set-code
 */
router.post('/safe/set-code', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId, code } = safeSetCodeSchema.parse(req.body);
    const uid = (req as any).uid;

    const { hasAccess } = await checkUserAccess(uid, roomId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    await adminDb.collection('hotel_safes').doc(roomId).set(
      {
        safeId: roomId,
        roomId,
        locked: true,
        codeHash: hashPin(code),
        attemptsRemaining: 5,
        lockedOutUntil: null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    await writeAuditLog({
      roomId,
      uid,
      action: 'safe_close',
      method: 'pin',
      result: 'success',
      reason: 'Code set',
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/safe/unlock
 */
router.post('/safe/unlock', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId, code } = safeUnlockSchema.parse(req.body);
    const uid = (req as any).uid;

    const safeRef = adminDb.collection('hotel_safes').doc(roomId);
    const safeSnap = await safeRef.get();

    if (!safeSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Coffre non configuré' });
    }

    const safe = safeSnap.data()!;

    // Lockout check
    if (safe.lockedOutUntil && safe.lockedOutUntil.toDate() > new Date()) {
      return res.status(429).json({
        success: false,
        error: 'Coffre verrouillé temporairement',
        lockedOut: true,
        attemptsRemaining: 0,
      });
    }

    // Verify code
    if (hashPin(code) !== safe.codeHash) {
      const remaining = Math.max(0, (safe.attemptsRemaining ?? 5) - 1);
      const lockedOut = remaining === 0;

      await safeRef.update({
        attemptsRemaining: remaining,
        lockedOutUntil: lockedOut ? new Date(Date.now() + 15 * 60 * 1000) : null,
        updatedAt: new Date(),
      });

      await writeAuditLog({
        roomId,
        uid,
        action: 'safe_denied',
        method: 'pin',
        result: 'denied',
        reason: `Invalid code. ${remaining} attempts remaining`,
      });

      return res.status(403).json({
        success: false,
        error: 'Code incorrect',
        attemptsRemaining: remaining,
        lockedOut,
      });
    }

    // Success
    await safeRef.update({
      locked: false,
      attemptsRemaining: 5,
      lockedOutUntil: null,
      lastAccessAt: new Date(),
      updatedAt: new Date(),
    });

    await writeAuditLog({
      roomId,
      uid,
      action: 'safe_open',
      method: 'pin',
      result: 'success',
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/safe/lock
 */
router.post('/safe/lock', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId } = safeLockSchema.parse(req.body);
    const uid = (req as any).uid;

    await adminDb.collection('hotel_safes').doc(roomId).update({
      locked: true,
      updatedAt: new Date(),
    });

    await writeAuditLog({
      roomId,
      uid,
      action: 'safe_close',
      method: 'system',
      result: 'success',
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/safe/staff-override
 * Override du coffre par le personnel autorisé.
 * Anti-casse: Nécessite claims admin.
 */
router.post('/safe/staff-override', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId } = safeLockSchema.parse(req.body);
    const uid = (req as any).uid;

    // Vérifier les claims admin
    const user = await getAuth().getUser(uid);
    if (!user.customClaims?.admin && !user.customClaims?.staff) {
      await writeAuditLog({
        roomId,
        uid,
        action: 'safe_denied',
        method: 'override',
        result: 'denied',
        reason: 'Not admin/staff',
      });
      return res.status(403).json({ success: false, error: 'Autorisation insuffisante' });
    }

    await adminDb.collection('hotel_safes').doc(roomId).update({
      locked: false,
      attemptsRemaining: 5,
      lockedOutUntil: null,
      lastAccessAt: new Date(),
      updatedAt: new Date(),
    });

    await writeAuditLog({
      roomId,
      uid,
      action: 'safe_open',
      method: 'override',
      result: 'success',
      reason: 'Staff override',
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ─── ROOM ROUTES ─────────────────────────────────────────────────────────────

/**
 * POST /api/hotel/room/light
 */
router.post('/room/light', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId } = lightToggleSchema.parse(req.body);
    const uid = (req as any).uid;

    const { hasAccess } = await checkUserAccess(uid, roomId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    const roomRef = adminDb.collection('hotel_rooms').doc(roomId);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Chambre inexistante' });
    }

    const room = roomSnap.data()!;
    const newState = !room.lightOn;

    await roomRef.update({
      lightOn: newState,
      updatedAt: new Date(),
    });

    await writeAuditLog({
      roomId,
      uid,
      action: 'light_toggle',
      method: 'system',
      result: 'success',
    });

    return res.json({ success: true, lightOn: newState });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/room/thermostat
 */
router.post('/room/thermostat', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId, temp } = thermostatSchema.parse(req.body);
    const uid = (req as any).uid;

    const { hasAccess } = await checkUserAccess(uid, roomId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    await adminDb.collection('hotel_rooms').doc(roomId).update({
      thermostatTemp: temp,
      updatedAt: new Date(),
    });

    await writeAuditLog({
      roomId,
      uid,
      action: 'thermostat_change',
      method: 'system',
      result: 'success',
    });

    return res.json({ success: true, temp });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ─── PROPERTY ROUTES ─────────────────────────────────────────────────────────

/**
 * POST /api/hotel/property/acquire
 * Acquérir une chambre.
 * Anti-casse: la création de propriété est protégée et auditable.
 */
router.post('/property/acquire', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId, price } = acquireRoomSchema.parse(req.body);
    const uid = (req as any).uid;

    // Vérifier que la chambre existe
    const roomRef = adminDb.collection('hotel_rooms').doc(roomId);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Chambre inexistante' });
    }

    const room = roomSnap.data()!;

    if (room.ownerUid) {
      return res.status(409).json({ success: false, error: 'Chambre déjà possédée' });
    }

    // Vérifier les fonds du joueur
    const playerRef = adminDb.collection('players').doc(uid);
    const playerSnap = await playerRef.get();

    if (!playerSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Joueur inexistant' });
    }

    const player = playerSnap.data()!;
    if ((player.bank ?? 0) < price) {
      return res.status(402).json({ success: false, error: 'Fonds insuffisants' });
    }

    // Transaction
    const propertyId = `prop_${roomId}_${uid}_${Date.now()}`;

    await adminDb.runTransaction(async (transaction) => {
      // Débit
      transaction.update(playerRef, {
        bank: (player.bank ?? 0) - price,
      });

      // Créer le titre
      transaction.set(adminDb.collection('hotel_properties').doc(propertyId), {
        propertyId,
        roomId,
        ownerUid: uid,
        acquisitionType: 'purchase',
        acquisitionDate: new Date(),
        price,
        status: 'active',
        previousOwnerUid: null,
        transferHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mettre à jour la chambre
      transaction.update(roomRef, {
        ownerUid: uid,
        status: 'occupied',
        updatedAt: new Date(),
      });

      // Accorder l'accès propriétaire
      const accessId = `access_${roomId}_${uid}_${Date.now()}`;
      transaction.set(adminDb.collection('hotel_access').doc(accessId), {
        accessId,
        roomId,
        uid,
        type: 'owner',
        grantedBy: 'system',
        validFrom: new Date(),
        validUntil: null,
        keycard: generateKeycardToken(),
        pin: null,
        active: true,
        createdAt: new Date(),
        revokedAt: null,
      });
    });

    await writeAuditLog({
      roomId,
      uid,
      action: 'property_acquired',
      method: 'system',
      result: 'success',
      reason: `Purchased for ${price}`,
    });

    return res.json({ success: true, propertyId });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/access/grant
 * Accorder un accès temporaire.
 */
router.post('/access/grant', verifyFirebaseToken, async (req, res) => {
  try {
    const { roomId, targetUid, type, pin, validUntilHours } = grantAccessSchema.parse(req.body);
    const uid = (req as any).uid;

    // Vérifier que le demandeur est propriétaire ou staff
    const { hasAccess, type: callerType } = await checkUserAccess(uid, roomId);
    if (!hasAccess || (callerType !== 'owner' && callerType !== 'staff')) {
      return res.status(403).json({ success: false, error: 'Seul le propriétaire ou le personnel peut accorder des accès' });
    }

    const accessId = `access_${roomId}_${targetUid}_${Date.now()}`;
    const validUntil = validUntilHours
      ? new Date(Date.now() + validUntilHours * 3600 * 1000)
      : null;

    await adminDb.collection('hotel_access').doc(accessId).set({
      accessId,
      roomId,
      uid: targetUid,
      type,
      grantedBy: uid,
      validFrom: new Date(),
      validUntil,
      keycard: generateKeycardToken(),
      pin: pin ? hashPin(pin) : null,
      active: true,
      createdAt: new Date(),
      revokedAt: null,
    });

    await writeAuditLog({
      roomId,
      uid,
      action: 'access_granted',
      method: 'system',
      result: 'success',
      reason: `Granted ${type} access to ${targetUid}`,
    });

    return res.json({ success: true, accessId });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hotel/access/revoke
 */
router.post('/access/revoke', verifyFirebaseToken, async (req, res) => {
  try {
    const { accessId } = revokeAccessSchema.parse(req.body);
    const uid = (req as any).uid;

    const accessRef = adminDb.collection('hotel_access').doc(accessId);
    const accessSnap = await accessRef.get();

    if (!accessSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Accès inexistant' });
    }

    const access = accessSnap.data()!;

    // Vérifier que le demandeur peut révoquer
    const { hasAccess, type: callerType } = await checkUserAccess(uid, access.roomId);
    if (
      !hasAccess ||
      (callerType !== 'owner' && callerType !== 'staff' && uid !== access.grantedBy)
    ) {
      return res.status(403).json({ success: false, error: 'Autorisation insuffisante' });
    }

    await accessRef.update({
      active: false,
      revokedAt: new Date(),
    });

    await writeAuditLog({
      roomId: access.roomId,
      uid,
      action: 'access_revoked',
      method: 'system',
      result: 'success',
      reason: `Revoked access ${accessId} for user ${access.uid}`,
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

export default router;