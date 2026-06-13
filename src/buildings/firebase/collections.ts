/**
 * src/buildings/firebase/collections.ts
 * 
 * STRICT separation of Firebase collections for Hôtel vs Dépanneur.
 * 
 * Anti-casse (verbatim):
 * - Séparer leurs collections Firebase.
 * - Séparer leurs permissions.
 * - Jamais stocker de NIP/carte/clé lisible.
 * - Journal immuable (append-only via auditLogs or separate events).
 * - Statuts archivés au lieu de suppressions.
 * - Stable IDs only.
 * 
 * Future: these will map to Firestore paths with security rules per building.
 * For now: pure type + path definitions (no direct writes from client).
 */

import type { BuildingId } from '../shared/types';

export const BUILDINGS_COLLECTIONS = {
  // Hôtel (30 rooms, ownership, access, etc.)
  HOTEL: {
    ROOMS: 'hotel_rooms',
    DOORS: 'hotel_doors',
    LOCKS: 'hotel_locks',
    SAFES: 'hotel_safes',
    OWNERS: 'hotel_owners',
    OWNERSHIPS: 'hotel_ownerships',
    OWNERSHIP_TRANSFERS: 'hotel_ownership_transfers',
    RESERVATIONS: 'hotel_reservations',
    STAYS: 'hotel_stays',
    ACCESS_GRANTS: 'hotel_access_grants',
    ACCESS_CREDENTIALS: 'hotel_access_credentials', // NEVER readable secrets here
    LOCK_EVENTS: 'hotel_lock_events',               // immutable journal
    MAINTENANCE: 'hotel_maintenance',
    CLEANING: 'hotel_cleaning',
  },

  // Dépanneur (completely independent)
  DEPANNEUR: {
    ZONES: 'depanneur_zones',
    INVENTORY: 'depanneur_inventory',
    SALES: 'depanneur_sales',
    SECURITY_EVENTS: 'depanneur_security_events',   // immutable
    DELIVERIES: 'depanneur_deliveries',
    WASTE: 'depanneur_waste_logs',
    STAFF: 'depanneur_staff',
  },

  // Shared but namespaced audit (append-only, never client-write directly)
  AUDIT: 'buildings_audit_logs',

  // Future feature-flagged real hardware commands (server only)
  LOCK_COMMANDS: 'buildings_lock_commands', // only via Cloud Functions
} as const;

export function getCollectionForBuilding(
  buildingId: BuildingId,
  collection: string
): string {
  if (buildingId === 'hotel_main') {
    return `hotel_${collection}`;
  }
  if (buildingId === 'depanneur_couche_tard') {
    return `depanneur_${collection}`;
  }
  return collection;
}

// Type-safe path helpers (for future use)
export const getHotelRoomPath = (roomId: string) => `${BUILDINGS_COLLECTIONS.HOTEL.ROOMS}/${roomId}`;
export const getDepanneurZonePath = (zoneId: string) => `${BUILDINGS_COLLECTIONS.DEPANNEUR.ZONES}/${zoneId}`;
