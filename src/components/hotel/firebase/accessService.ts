// src/components/hotel/firebase/accessService.ts

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  collection,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import {
  HOTEL_COLLECTIONS,
  type HotelAccess,
  type HotelAccessLog,
} from './hotelCollections';
import * as crypto from 'crypto';

/**
 * Service de gestion des accès.
 * Carte d'accès, clavier numérique, serrure connectée.
 * Anti-casse #18: ne jamais autoriser le navigateur à commander directement une serrure.
 * Anti-casse #19: ne jamais conserver un NIP ou une carte sous forme lisible.
 */

export class AccessService {
  constructor(private db: Firestore) {}

  /**
   * Vérifie si un utilisateur a accès à une chambre.
   */
  async checkAccess(uid: string, roomId: string): Promise<{
    hasAccess: boolean;
    accessType: HotelAccess['type'] | null;
    accessId: string | null;
  }> {
    const q = query(
      collection(this.db, HOTEL_COLLECTIONS.access),
      where('roomId', '==', roomId),
      where('uid', '==', uid),
      where('active', '==', true)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return { hasAccess: false, accessType: null, accessId: null };
    }

    const access = snap.docs[0].data() as HotelAccess;

    // Vérifier la validité temporelle
    const now = new Date();
    const validFrom = access.validFrom.toDate();
    const validUntil = access.validUntil?.toDate();

    if (now < validFrom) {
      return { hasAccess: false, accessType: null, accessId: null };
    }

    if (validUntil && now > validUntil) {
      // Accès expiré — le désactiver
      await updateDoc(doc(this.db, HOTEL_COLLECTIONS.access, access.accessId), {
        active: false,
        revokedAt: serverTimestamp(),
      });
      return { hasAccess: false, accessType: null, accessId: null };
    }

    return {
      hasAccess: true,
      accessType: access.type,
      accessId: access.accessId,
    };
  }

  /**
   * Accorde un accès à une chambre.
   * Doit être appelé depuis le serveur uniquement.
   */
  async grantAccess(params: {
    roomId: string;
    uid: string;
    type: HotelAccess['type'];
    grantedBy: string;
    validFrom?: Date;
    validUntil?: Date | null;
    pin?: string; // Sera hashé
  }): Promise<string> {
    const accessId = `access_${params.roomId}_${params.uid}_${Date.now()}`;

    // Hash du PIN si fourni (anti-casse #19)
    let pinHash: string | null = null;
    if (params.pin) {
      pinHash = this.hashPin(params.pin);
    }

    const accessData: Omit<HotelAccess, 'createdAt' | 'revokedAt'> & {
      createdAt: any;
      revokedAt: any;
    } = {
      accessId,
      roomId: params.roomId,
      uid: params.uid,
      type: params.type,
      grantedBy: params.grantedBy,
      validFrom: params.validFrom
        ? { seconds: Math.floor(params.validFrom.getTime() / 1000), nanoseconds: 0 } as any
        : serverTimestamp(),
      validUntil: params.validUntil
        ? { seconds: Math.floor(params.validUntil.getTime() / 1000), nanoseconds: 0 } as any
        : null,
      keycard: this.generateKeycardToken(),
      pin: pinHash,
      active: true,
      createdAt: serverTimestamp(),
      revokedAt: null,
    };

    await setDoc(doc(this.db, HOTEL_COLLECTIONS.access, accessId), accessData);

    return accessId;
  }

  /**
   * Révoque un accès.
   */
  async revokeAccess(accessId: string, revokedBy: string): Promise<void> {
    const docRef = doc(this.db, HOTEL_COLLECTIONS.access, accessId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) throw new Error('Accès inexistant');

    await updateDoc(docRef, {
      active: false,
      revokedAt: serverTimestamp(),
    });

    const access = snap.data() as HotelAccess;

    // Log
    const logId = `access_revoked_${revokedBy}_${access.roomId}_${Date.now()}`;
    await setDoc(doc(this.db, HOTEL_COLLECTIONS.accessLogs, logId), {
      logId,
      roomId: access.roomId,
      uid: revokedBy,
      action: 'access_revoked',
      method: 'system',
      result: 'success',
      reason: `Access ${accessId} revoked for user ${access.uid}`,
      ipAddress: null,
      userAgent: null,
      createdAt: serverTimestamp(),
    });
  }

  /**
   * Vérifie un PIN (comparaison de hash).
   */
  async verifyPin(roomId: string, uid: string, pin: string): Promise<boolean> {
    const q = query(
      collection(this.db, HOTEL_COLLECTIONS.access),
      where('roomId', '==', roomId),
      where('uid', '==', uid),
      where('active', '==', true)
    );

    const snap = await getDocs(q);
    if (snap.empty) return false;

    const access = snap.docs[0].data() as HotelAccess;
    if (!access.pin) return false;

    return this.hashPin(pin) === access.pin;
  }

  /**
   * Hash un PIN de façon sécurisée.
   */
  private hashPin(pin: string): string {
    // SHA-256 avec sel statique (en production: bcrypt ou argon2)
    const salt = 'etherzrp_hotel_pin_salt_v1';
    return crypto
      .createHash('sha256')
      .update(salt + pin)
      .digest('hex');
  }

  /**
   * Génère un token de carte d'accès unique.
   */
  private generateKeycardToken(): string {
    const bytes = crypto.randomBytes(16);
    return bytes.toString('hex');
  }
}