// src/components/hotel/firebase/roomService.ts

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  collection,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  HOTEL_COLLECTIONS,
  type HotelRoom,
  type HotelAccessLog,
} from './hotelCollections';
import { generateAllRoomIds, roomDisplayNumber, type RoomId } from '../constants/ids';
import { HOTEL } from '../constants/dimensions';

/**
 * Service de gestion des chambres.
 * Toutes les opérations sensibles passent par le serveur (anti-casse #18).
 */

export class RoomService {
  constructor(private db: Firestore) {}

  /**
   * Initialise toutes les chambres dans Firestore.
   * À exécuter une seule fois lors du setup initial.
   */
  async seedRooms(): Promise<void> {
    const allRooms = generateAllRoomIds();

    for (const roomId of allRooms) {
      const docRef = doc(this.db, HOTEL_COLLECTIONS.rooms, roomId.key);
      const existing = await getDoc(docRef);

      if (!existing.exists()) {
        const roomData: Omit<HotelRoom, 'createdAt' | 'updatedAt'> & {
          createdAt: any;
          updatedAt: any;
        } = {
          roomId: roomId.key,
          displayNumber: roomDisplayNumber(roomId.floor, roomId.side, roomId.position),
          floor: roomId.floor,
          side: roomId.side,
          position: roomId.position,
          status: 'vacant',
          ownerUid: null,
          currentOccupantUid: null,
          isAccessible: roomId.position === 0, // First room each side is accessible
          lightOn: false,
          thermostatTemp: 21,
          doNotDisturb: false,
          cleaningRequested: false,
          lastCleanedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(docRef, roomData);
      }
    }
  }

  /**
   * Écoute les changements d'une chambre en temps réel.
   */
  subscribeToRoom(
    roomId: string,
    callback: (room: HotelRoom | null) => void
  ): Unsubscribe {
    const docRef = doc(this.db, HOTEL_COLLECTIONS.rooms, roomId);
    return onSnapshot(docRef, (snap) => {
      callback(snap.exists() ? (snap.data() as HotelRoom) : null);
    });
  }

  /**
   * Écoute les changements de toutes les chambres d'un étage.
   */
  subscribeToFloor(
    floor: number,
    callback: (rooms: HotelRoom[]) => void
  ): Unsubscribe {
    const q = query(
      collection(this.db, HOTEL_COLLECTIONS.rooms),
      where('floor', '==', floor)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => d.data() as HotelRoom));
    });
  }

  /**
   * Écoute toutes les lumières (pour la vue 3D).
   */
  subscribeToAllLights(
    callback: (lights: Map<string, boolean>) => void
  ): Unsubscribe {
    const q = query(collection(this.db, HOTEL_COLLECTIONS.rooms));
    return onSnapshot(q, (snap) => {
      const map = new Map<string, boolean>();
      snap.docs.forEach((d) => {
        const data = d.data() as HotelRoom;
        map.set(data.roomId, data.lightOn);
      });
      callback(map);
    });
  }

  /**
   * Toggle la lumière d'une chambre.
   * Peut être fait côté client si l'utilisateur a accès.
   */
  async toggleLight(roomId: string, uid: string): Promise<void> {
    const docRef = doc(this.db, HOTEL_COLLECTIONS.rooms, roomId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) throw new Error('Chambre inexistante');

    const room = snap.data() as HotelRoom;
    const newState = !room.lightOn;

    await updateDoc(docRef, {
      lightOn: newState,
      updatedAt: serverTimestamp(),
    });

    // Log
    await this.writeAccessLog(roomId, uid, 'light_toggle', 'system', 'success');
  }

  /**
   * Change le thermostat.
   */
  async setThermostat(roomId: string, uid: string, temp: number): Promise<void> {
    if (temp < 16 || temp > 28) throw new Error('Température hors limites (16-28°C)');

    const docRef = doc(this.db, HOTEL_COLLECTIONS.rooms, roomId);
    await updateDoc(docRef, {
      thermostatTemp: temp,
      updatedAt: serverTimestamp(),
    });

    await this.writeAccessLog(roomId, uid, 'thermostat_change', 'system', 'success');
  }

  /**
   * Écrit un log d'accès immuable.
   */
  private async writeAccessLog(
    roomId: string,
    uid: string,
    action: HotelAccessLog['action'],
    method: HotelAccessLog['method'],
    result: HotelAccessLog['result'],
    reason?: string
  ): Promise<void> {
    const now = Date.now();
    const logId = `${action}_${uid}_${roomId}_${now}`;
    const logRef = doc(this.db, HOTEL_COLLECTIONS.accessLogs, logId);

    await setDoc(logRef, {
      logId,
      roomId,
      uid,
      action,
      method,
      result,
      reason: reason ?? null,
      ipAddress: null, // Set by server
      userAgent: null, // Set by server
      createdAt: serverTimestamp(),
    });
  }
}