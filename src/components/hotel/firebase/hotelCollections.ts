// src/components/hotel/firebase/hotelCollections.ts

/**
 * Collections Firebase dédiées à l'hôtel.
 * Anti-casse #3: collections Firebase séparées.
 * Anti-casse #4: permissions séparées.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type Firestore,
  type DocumentReference,
  type CollectionReference,
} from 'firebase/firestore';

// ─── COLLECTION NAMES ────────────────────────────────────────────────────────

export const HOTEL_COLLECTIONS = {
  /** Chambres: état, propriétaire, locataire, configuration */
  rooms: 'hotel_rooms',
  /** Accès: qui a accès à quelle chambre, avec quelles permissions */
  access: 'hotel_access',
  /** Serrures: état des serrures (verrouillée, déverrouillée, batterie) */
  locks: 'hotel_locks',
  /** Coffres-forts: état et configuration */
  safes: 'hotel_safes',
  /** Propriétés: titres de propriété (jamais supprimés, archivés) */
  properties: 'hotel_properties',
  /** Journal d'accès: log immuable de tous les accès et changements */
  accessLogs: 'hotel_access_logs',
  /** Réservations */
  reservations: 'hotel_reservations',
  /** Configuration de l'ascenseur */
  elevator: 'hotel_elevator',
  /** Configuration du bâtiment */
  config: 'hotel_config',
} as const;

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface HotelRoom {
  roomId: string;
  displayNumber: string;
  floor: number;
  side: 'left' | 'right';
  position: number;
  status: 'vacant' | 'occupied' | 'maintenance' | 'reserved';
  ownerUid: string | null;
  currentOccupantUid: string | null;
  isAccessible: boolean;
  lightOn: boolean;
  thermostatTemp: number;
  doNotDisturb: boolean;
  cleaningRequested: boolean;
  lastCleanedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HotelAccess {
  accessId: string;
  roomId: string;
  uid: string;
  type: 'owner' | 'tenant' | 'guest' | 'staff' | 'maintenance';
  grantedBy: string;
  validFrom: Timestamp;
  validUntil: Timestamp | null;
  keycard: string | null;
  pin: string | null; // JAMAIS en clair — hash uniquement
  active: boolean;
  createdAt: Timestamp;
  revokedAt: Timestamp | null;
}

export interface HotelLock {
  lockId: string;
  roomId: string;
  doorType: 'entry' | 'bathroom' | 'connecting';
  locked: boolean;
  deadboltEngaged: boolean;
  batteryLevel: number; // 0-100
  batteryReplacedAt: Timestamp | null;
  lastAccessAt: Timestamp | null;
  lastAccessUid: string | null;
  lastAccessMethod: 'keycard' | 'pin' | 'mechanical' | 'override' | null;
  firmwareVersion: string;
  updatedAt: Timestamp;
}

export interface HotelSafe {
  safeId: string;
  roomId: string;
  locked: boolean;
  /** Hash du code — JAMAIS en clair (anti-casse #19) */
  codeHash: string | null;
  attemptsRemaining: number;
  lockedOutUntil: Timestamp | null;
  lastAccessAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HotelProperty {
  propertyId: string;
  roomId: string;
  ownerUid: string;
  acquisitionType: 'purchase' | 'transfer' | 'admin_grant';
  acquisitionDate: Timestamp;
  price: number | null;
  /** Statut archivé plutôt que supprimé (anti-casse #21-22) */
  status: 'active' | 'archived' | 'disputed';
  previousOwnerUid: string | null;
  transferHistory: Array<{
    fromUid: string;
    toUid: string;
    date: Timestamp;
    type: 'sale' | 'transfer' | 'admin';
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HotelAccessLog {
  logId: string;
  roomId: string;
  uid: string;
  action:
    | 'door_unlock'
    | 'door_lock'
    | 'door_denied'
    | 'safe_open'
    | 'safe_close'
    | 'safe_denied'
    | 'keycard_issued'
    | 'keycard_revoked'
    | 'pin_changed'
    | 'property_acquired'
    | 'property_transferred'
    | 'property_archived'
    | 'access_granted'
    | 'access_revoked'
    | 'light_toggle'
    | 'thermostat_change'
    | 'maintenance_entry'
    | 'emergency_override';
  method: 'keycard' | 'pin' | 'mechanical' | 'override' | 'system' | null;
  result: 'success' | 'denied' | 'failed' | 'timeout';
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  /** Timestamp serveur — immuable (anti-casse #20) */
  createdAt: Timestamp;
}

export interface HotelReservation {
  reservationId: string;
  roomId: string;
  guestUid: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  price: number;
  paidAt: Timestamp | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

export function getHotelCollection(
  db: Firestore,
  collectionName: keyof typeof HOTEL_COLLECTIONS
): CollectionReference {
  return collection(db, HOTEL_COLLECTIONS[collectionName]);
}

export function getHotelDoc(
  db: Firestore,
  collectionName: keyof typeof HOTEL_COLLECTIONS,
  docId: string
): DocumentReference {
  return doc(db, HOTEL_COLLECTIONS[collectionName], docId);
}