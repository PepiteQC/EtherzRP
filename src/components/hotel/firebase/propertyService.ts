// src/components/hotel/firebase/propertyService.ts

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
  type HotelProperty,
  type HotelRoom,
} from './hotelCollections';

/**
 * Service de gestion des propriétés.
 * Anti-casse #21: ne jamais supprimer définitivement un titre de propriété.
 * Anti-casse #22: utiliser des statuts archivés.
 */

export class PropertyService {
  constructor(private db: Firestore) {}

  /**
   * Acquérir une chambre (achat permanent).
   * Doit être appelé depuis le serveur avec validation complète.
   */
  async acquireRoom(params: {
    roomId: string;
    buyerUid: string;
    price: number;
    type: 'purchase' | 'admin_grant';
    grantedBy: string;
  }): Promise<string> {
    // Vérifier que la chambre existe
    const roomRef = doc(this.db, HOTEL_COLLECTIONS.rooms, params.roomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Chambre inexistante');

    const room = roomSnap.data() as HotelRoom;

    // Vérifier qu'elle n'est pas déjà possédée
    if (room.ownerUid) {
      throw new Error('Cette chambre a déjà un propriétaire');
    }

    // Vérifier qu'il n'y a pas de propriété active
    const existingQ = query(
      collection(this.db, HOTEL_COLLECTIONS.properties),
      where('roomId', '==', params.roomId),
      where('status', '==', 'active')
    );
    const existing = await getDocs(existingQ);
    if (!existing.empty) {
      throw new Error('Un titre de propriété actif existe déjà pour cette chambre');
    }

    // Créer le titre de propriété
    const propertyId = `prop_${params.roomId}_${params.buyerUid}_${Date.now()}`;
    const propertyData = {
      propertyId,
      roomId: params.roomId,
      ownerUid: params.buyerUid,
      acquisitionType: params.type,
      acquisitionDate: serverTimestamp(),
      price: params.price,
      status: 'active' as const,
      previousOwnerUid: null,
      transferHistory: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(this.db, HOTEL_COLLECTIONS.properties, propertyId), propertyData);

    // Mettre à jour la chambre
    await updateDoc(roomRef, {
      ownerUid: params.buyerUid,
      status: 'occupied',
      updatedAt: serverTimestamp(),
    });

    // Log
    await setDoc(
      doc(
        this.db,
        HOTEL_COLLECTIONS.accessLogs,
        `property_acquired_${params.buyerUid}_${params.roomId}_${Date.now()}`
      ),
      {
        logId: `property_acquired_${params.buyerUid}_${params.roomId}_${Date.now()}`,
        roomId: params.roomId,
        uid: params.buyerUid,
        action: 'property_acquired',
        method: 'system',
        result: 'success',
        reason: `Room acquired via ${params.type} for ${params.price}`,
        ipAddress: null,
        userAgent: null,
        createdAt: serverTimestamp(),
      }
    );

    return propertyId;
  }

  /**
   * Transférer la propriété d'une chambre.
   */
  async transferProperty(params: {
    propertyId: string;
    fromUid: string;
    toUid: string;
    price: number | null;
    authorizedBy: string;
  }): Promise<void> {
    const propRef = doc(this.db, HOTEL_COLLECTIONS.properties, params.propertyId);
    const propSnap = await getDoc(propRef);

    if (!propSnap.exists()) throw new Error('Titre de propriété inexistant');

    const prop = propSnap.data() as HotelProperty;

    if (prop.status !== 'active') {
      throw new Error('Ce titre de propriété n\'est plus actif');
    }

    if (prop.ownerUid !== params.fromUid) {
      throw new Error('Le vendeur n\'est pas le propriétaire');
    }

    // Archiver l'ancien titre
    await updateDoc(propRef, {
      status: 'archived',
      updatedAt: serverTimestamp(),
    });

    // Créer un nouveau titre
    const newPropertyId = `prop_${prop.roomId}_${params.toUid}_${Date.now()}`;
    await setDoc(doc(this.db, HOTEL_COLLECTIONS.properties, newPropertyId), {
      propertyId: newPropertyId,
      roomId: prop.roomId,
      ownerUid: params.toUid,
      acquisitionType: 'transfer',
      acquisitionDate: serverTimestamp(),
      price: params.price,
      status: 'active',
      previousOwnerUid: params.fromUid,
      transferHistory: [
        ...prop.transferHistory,
        {
          fromUid: params.fromUid,
          toUid: params.toUid,
          date: serverTimestamp(),
          type: params.price ? 'sale' : 'transfer',
        },
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Mettre à jour la chambre
    const roomRef = doc(this.db, HOTEL_COLLECTIONS.rooms, prop.roomId);
    await updateDoc(roomRef, {
      ownerUid: params.toUid,
      updatedAt: serverTimestamp(),
    });

    // Log
    await setDoc(
      doc(
        this.db,
        HOTEL_COLLECTIONS.accessLogs,
        `property_transferred_${params.fromUid}_${prop.roomId}_${Date.now()}`
      ),
      {
        logId: `property_transferred_${params.fromUid}_${prop.roomId}_${Date.now()}`,
        roomId: prop.roomId,
        uid: params.authorizedBy,
        action: 'property_transferred',
        method: 'system',
        result: 'success',
        reason: `Transfer from ${params.fromUid} to ${params.toUid}`,
        ipAddress: null,
        userAgent: null,
        createdAt: serverTimestamp(),
      }
    );
  }
}