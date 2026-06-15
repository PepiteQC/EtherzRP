/**
 * server/routes/player.routes.ts
 * 
 * Routes Express Autoritaires de Production pour EtherWorld RP.
 * C'est ici que réside la véritable protection des règles du monde :
 * Le client demande, le backend vérifie l'intégrité de la transaction et met à jour Cloud Firestore.
 */

import { Router, type Request, type Response } from 'express';
import { adminDb } from '../firebaseAdmin';
import { verifyFirebaseToken, requireAdminRole } from '../middleware/verifyFirebaseToken';
import type { PlayerDocument, InventoryDocument, VehicleDocument, AccessLogDocument } from '../../src/lib/firebase/firestoreSchema';

const router = Router();

/**
 * 1. POST /api/player/save-position
 * Sauvegarde en tuiles RP persistantes (Position, orientation et zone active)
 */
router.post('/save-position', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { position, rotation, currentZone } = req.body;

  if (!position || !rotation || !currentZone) {
    res.status(400).json({ error: "Paramètres géospatiaux (position, rotation, currentZone) requis." });
    return;
  }

  try {
    const docRef = adminDb.collection('players').doc(uid);
    await docRef.set({
      position,
      rotation,
      currentZone,
      lastSeen: Date.now(),
    }, { merge: true });

    res.json({ status: "success", savedAt: Date.now() });
  } catch (err) {
    res.status(500).json({ error: "Échec de la persistance spatiale Firestore." });
  }
});

/**
 * 2. POST /api/player/update-status
 * Synchronisation autoritaire des compteurs vitaux de survie
 */
router.post('/update-status', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: "Objet status requis." });
    return;
  }

  try {
    // Nettoyage de sécurité : interdire la modification malveillante du cash ou bank via cet endpoint
    const safeStatus: Partial<PlayerDocument> = {
      ...(typeof status.health === 'number' && { health: Math.min(100, Math.max(0, status.health)) }),
      ...(typeof status.armor === 'number'  && { armor:  Math.min(100, Math.max(0, status.armor)) }),
      ...(typeof status.hunger === 'number' && { hunger: Math.min(100, Math.max(0, status.hunger)) }),
      ...(typeof status.thirst === 'number' && { thirst: Math.min(100, Math.max(0, status.thirst)) }),
      ...(typeof status.stamina === 'number'&& { stamina:Math.min(100, Math.max(0, status.stamina)) }),
      ...(typeof status.stress === 'number' && { stress: Math.min(100, Math.max(0, status.stress)) }),
      lastSeen: Date.now(),
    };

    await adminDb.collection('players').doc(uid).set(safeStatus, { merge: true });
    res.json({ status: "success", updatedAt: Date.now() });
  } catch (err) {
    res.status(500).json({ error: "Erreur de mise à jour des métriques de survie." });
  }
});

/**
 * 3. POST /api/inventory/move-item
 */
router.post('/inventory/move-item', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { fromIndex, toIndex } = req.body;

  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
    res.status(400).json({ error: "Indices de déplacement fromIndex et toIndex requis." });
    return;
  }

  try {
    const invRef = adminDb.collection('inventories').doc(uid);
    await adminDb.runTransaction(async (t) => {
      const snap = await t.get(invRef);
      if (!snap.exists) throw new Error("Inventaire inexistant.");

      const data = snap.data() as InventoryDocument;
      if (fromIndex < 0 || fromIndex >= 40 || toIndex < 0 || toIndex >= 40) {
        throw new Error("Index hors limites (0-39).");
      }

      // Permutation atomique des slots
      const temp = data.slots[fromIndex];
      data.slots[fromIndex] = data.slots[toIndex];
      data.slots[toIndex] = temp;

      t.update(invRef, { slots: data.slots, updatedAt: Date.now() });
    });

    res.json({ status: "success" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 4. POST /api/inventory/use-item
 */
router.post('/inventory/use-item', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { itemId, targetEntityId } = req.body;

  if (!itemId) {
    res.status(400).json({ error: "Identifiant de l'objet (itemId) requis." });
    return;
  }

  try {
    let usedItemName = "";
    const invRef = adminDb.collection('inventories').doc(uid);
    
    await adminDb.runTransaction(async (t) => {
      const snap = await t.get(invRef);
      if (!snap.exists) throw new Error("Inventaire introuvable.");

      const data = snap.data() as InventoryDocument;
      const idx = data.slots.findIndex(s => s && s.id === itemId);
      
      if (idx === -1 || !data.slots[idx] || data.slots[idx]!.quantity <= 0) {
        throw new Error("Objet épuisé ou absent de l'inventaire.");
      }

      const item = data.slots[idx]!;
      usedItemName = item.name;
      item.quantity -= 1;
      
      if (item.quantity <= 0) {
        data.slots[idx] = null;
      }

      // Calcul du nouveau poids
      const newWeight = data.slots.reduce((sum, current) => sum + (current ? current.weight * current.quantity : 0), 0);

      t.update(invRef, {
        slots: data.slots,
        currentWeight: Math.round(newWeight * 10) / 10,
        updatedAt: Date.now(),
      });
    });

    res.json({ status: "success", message: `Vous avez consommé / utilisé : ${usedItemName}` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * 4b. POST /api/inventory/buy
 * Guichet Autoritaire d'Achat en Ligne dans les Magasins Réflectifs
 */
router.post('/inventory/buy', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { itemId, name, price, weight, definitionId } = req.body;

  if (!itemId || typeof price !== 'number' || typeof weight !== 'number') {
    res.status(400).json({ error: "Spécifications de l'objet (itemId, price, weight) requises." });
    return;
  }

  try {
    let nextCash = 0;
    const playerRef = adminDb.collection('players').doc(uid);
    const invRef    = adminDb.collection('inventories').doc(uid);

    await adminDb.runTransaction(async (t) => {
      const [playerSnap, invSnap] = await Promise.all([
        t.get(playerRef),
        t.get(invRef),
      ]);

      if (!playerSnap.exists || !invSnap.exists) {
        throw new Error("Dossier citoyen ou inventaire introuvable.");
      }

      const pData = playerSnap.data() as PlayerDocument;
      const iData = invSnap.data() as InventoryDocument;

      // 1. Audit Financier
      if (pData.cash < price) {
        throw new Error("Fonds en liquide insuffisants pour régler cet achat.");
      }
      nextCash = pData.cash - price;

      // 2. Audit de l'encombrement
      const newTotalWeight = iData.currentWeight + weight;
      if (newTotalWeight > iData.maxWeight) {
        throw new Error(`Surcharge ! Encombrement estimé (${Math.round(newTotalWeight * 10) / 10} kg) supérieur à votre capacité réglementaire (${iData.maxWeight} kg). Équipez un Sac à Dos Tactique.`);
      }

      // 3. Stockage dans les emplacements (Slots)
      const existingIdx = iData.slots.findIndex(s => s && s.definitionId === definitionId);
      if (existingIdx !== -1 && iData.slots[existingIdx]) {
        iData.slots[existingIdx]!.quantity += 1;
      } else {
        const emptyIdx = iData.slots.findIndex(s => s === null);
        if (emptyIdx === -1) {
          throw new Error("Paquetage plein. Impossible de trouver un emplacement vide.");
        }
        iData.slots[emptyIdx] = {
          id: `item_${definitionId}_${Date.now()}`,
          definitionId: definitionId || 'conso',
          name: name || itemId,
          quantity: 1,
          weight,
        };
      }

      // 4. Mises à jour Atomiques
      t.update(playerRef, { cash: nextCash, lastSeen: Date.now() });
      t.update(invRef, {
        slots: iData.slots,
        currentWeight: Math.round(newTotalWeight * 10) / 10,
        updatedAt: Date.now(),
      });
    });

    res.json({ status: "success", newCash: nextCash, itemPurchased: name });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Échec de l'achat en magasin." });
  }
});

/**
 * 5. POST /api/vehicle/spawn
 */
router.post('/vehicle/spawn', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { model, spawnPos } = req.body;

  if (!model || !spawnPos) {
    res.status(400).json({ error: "Modèle et position de spawn requis." });
    return;
  }

  try {
    const vehicleId = `veh_${model}_${Date.now()}`;
    const vehicleDoc: VehicleDocument = {
      vehicleId,
      ownerUid: uid,
      plate: `QC-${Math.floor(100 + Math.random() * 899)}-RP`,
      model,
      color: "#dc2626",
      fuel: 100,
      engineHealth: 100,
      bodyHealth: 100,
      locked: false,
      position: spawnPos,
      rotationY: 0,
      impounded: false,
    };

    await adminDb.collection('vehicles').doc(vehicleId).set(vehicleDoc);
    res.json({ status: "success", vehicle: vehicleDoc });
  } catch (err) {
    res.status(500).json({ error: "Impossible d'instancier le véhicule." });
  }
});

/**
 * 6. POST /api/vehicle/save
 */
router.post('/vehicle/save', verifyFirebaseToken, async (req: Request, res: Response) => {
  const { vehicleId, updates } = req.body;
  if (!vehicleId || !updates) {
    res.status(400).json({ error: "vehicleId et updates requis." });
    return;
  }

  try {
    await adminDb.collection('vehicles').doc(vehicleId).set(updates, { merge: true });
    res.json({ status: "success" });
  } catch (err) {
    res.status(500).json({ error: "Erreur d'enregistrement véhicule." });
  }
});

/**
 * 7. POST /api/property/lock
 */
router.post('/property/lock', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { propertyId, lockState } = req.body;

  if (!propertyId || typeof lockState !== 'boolean') {
    res.status(400).json({ error: "propertyId et lockState requis." });
    return;
  }

  try {
    const propRef = adminDb.collection('properties').doc(propertyId);
    const snap = await propRef.get();
    
    if (!snap.exists) {
      // Instanciation de la propriété si inexistante en base
      await propRef.set({
        propertyId,
        ownerUid: uid,
        type: 'motel_room',
        address: `Chambre ${propertyId}`,
        locked: lockState,
        tenants: [],
        accessList: [uid],
      });
    } else {
      const data = snap.data() as PropertyDocument;
      if (data.ownerUid !== uid && !data.accessList.includes(uid)) {
        res.status(403).json({ error: "Accès refusé. Vous ne possédez pas les clés de cette propriété." });
        return;
      }
      await propRef.update({ locked: lockState });
    }

    res.json({ status: "success", new_state: lockState });
  } catch (err) {
    res.status(500).json({ error: "Erreur d'action sur la serrure." });
  }
});

/**
 * 8. POST /api/job/pay
 * Versement Autoritaire de Prime / Salaire
 */
router.post('/job/pay', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { job } = req.body;

  if (!job) {
    res.status(400).json({ error: "Métier (job) requis." });
    return;
  }

  try {
    // Calcul de la prime selon le corps de métier
    const SALARIES: Record<string, number> = {
      police: 350,
      medic: 320,
      mecano: 280,
      travailleur: 250,
      restaurateur: 220,
      civil: 150,
    };
    const amount = SALARIES[job] || 150;

    let newBank = 0;
    const playerRef = adminDb.collection('players').doc(uid);

    await adminDb.runTransaction(async (t) => {
      const snap = await t.get(playerRef);
      if (!snap.exists) throw new Error("Dossier joueur absent.");

      const data = snap.data() as PlayerDocument;
      newBank = data.bank + amount;

      t.update(playerRef, {
        bank: newBank,
        lastSeen: Date.now(),
      });
    });

    res.json({ status: "success", amountPaid: amount, newBank });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Erreur de paiement." });
  }
});

/**
 * 9. POST /api/admin/ban
 */
router.post('/admin/ban', requireAdminRole, async (req: Request, res: Response) => {
  const adminUid = (req as any).uid;
  const { targetUid, reason } = req.body;

  if (!targetUid || !reason) {
    res.status(400).json({ error: "targetUid et reason requis pour l'audit de bannissement." });
    return;
  }

  try {
    const logDoc: AccessLogDocument = {
      logId: `ban_${targetUid}_${Date.now()}`,
      uid: adminUid,
      action: 'duty_change',
      target: targetUid,
      result: 'denied',
      createdAt: Date.now(),
      ipHash: "admin_console",
      zone: "Global",
    };

    await Promise.all([
      adminDb.collection('users').doc(targetUid).update({ banned: true, banReason: reason }),
      adminDb.collection('accessLogs').doc(logDoc.logId).set(logDoc),
    ]);

    res.json({ status: "success", auditId: logDoc.logId });
  } catch (err) {
    res.status(500).json({ error: "Échec du bannissement." });
  }
});

/**
 * 10. POST /api/player/bank/transfer
 * Opérations Autoritaires de Guichet Automatique (ATMs) et Virements Fédéraux
 */
router.post('/bank/transfer', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { action, amount, targetUid } = req.body; // action: 'deposit' | 'withdraw' | 'transfer'

  if (!action || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: "Paramètres de transaction (action, amount) invalides ou négatifs." });
    return;
  }

  try {
    let finalCash = 0;
    let finalBank = 0;
    const playerRef = adminDb.collection('players').doc(uid);

    await adminDb.runTransaction(async (t) => {
      const snap = await t.get(playerRef);
      if (!snap.exists) throw new Error("Dossier citoyen introuvable.");

      const pData = snap.data() as PlayerDocument;
      finalCash = pData.cash;
      finalBank = pData.bank;

      if (action === 'deposit') {
        if (pData.cash < amount) throw new Error("Montant en argent liquide insuffisant pour ce dépôt.");
        finalCash -= amount;
        finalBank += amount;
      } else if (action === 'withdraw') {
        if (pData.bank < amount) throw new Error("Provisions bancaires insuffisantes pour ce retrait en espèces.");
        finalBank -= amount;
        finalCash += amount;
      } else if (action === 'transfer') {
        if (!targetUid) throw new Error("Compte destinataire (targetUid) manquant pour le virement.");
        if (pData.bank < amount) throw new Error("Provisions bancaires insuffisantes pour émettre ce virement.");
        
        const targetRef = adminDb.collection('players').doc(targetUid);
        const tSnap = await t.get(targetRef);
        if (!tSnap.exists) throw new Error("Citoyen destinataire introuvable dans la municipalité.");

        const tData = tSnap.data() as PlayerDocument;
        finalBank -= amount;
        t.update(targetRef, { bank: tData.bank + amount, lastSeen: Date.now() });

        // Enregistre un audit de transaction
        const logRef = adminDb.collection('accessLogs').doc(`tx_${uid}_${targetUid}_${Date.now()}`);
        t.set(logRef, {
          logId: `tx_${uid}_${targetUid}_${Date.now()}`,
          uid, action: 'atm_withdraw', target: targetUid,
          result: 'success', createdAt: Date.now(), ipHash: 'bank_wire', zone: 'Fédéral',
        });
      }

      t.update(playerRef, { cash: finalCash, bank: finalBank, lastSeen: Date.now() });
    });

    res.json({ status: "success", newCash: finalCash, newBank: finalBank });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Opération bancaire rejetée." });
  }
});

/**
 * 11. POST /api/player/market/trade
 * Négociation de Bourse et Échange de Marchandises
 */
router.post('/market/trade', verifyFirebaseToken, async (req: Request, res: Response) => {
  const uid = (req as any).uid;
  const { tradeType, resourceName, totalValue } = req.body; // tradeType: 'buy' | 'sell'

  if (!tradeType || !resourceName || typeof totalValue !== 'number' || totalValue <= 0) {
    res.status(400).json({ error: "Spécifications boursières invalides." });
    return;
  }

  try {
    let nextBank = 0;
    const playerRef = adminDb.collection('players').doc(uid);

    await adminDb.runTransaction(async (t) => {
      const snap = await t.get(playerRef);
      if (!snap.exists) throw new Error("Citoyen introuvable.");

      const data = snap.data() as PlayerDocument;
      if (tradeType === 'buy') {
        if (data.bank < totalValue) throw new Error("Provisions bancaires insuffisantes.");
        nextBank = data.bank - totalValue;
      } else {
        nextBank = data.bank + totalValue;
      }

      t.update(playerRef, { bank: nextBank, lastSeen: Date.now() });
    });

    res.json({ status: "success", newBank: nextBank });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Transaction boursière bloquée." });
  }
});

export default router;
