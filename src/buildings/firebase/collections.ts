/**
 * src/buildings/firebase/collections.ts
 *
 * STRICT separation of Firebase collections for Hôtel vs Dépanneur.
 *
 * Anti-casse:
 * - Séparer leurs collections Firebase.
 * - Séparer leurs permissions.
 * - Jamais stocker de NIP/carte/clé lisible.
 * - Journal immuable: append-only via audit logs / event logs.
 * - Statuts archivés au lieu de suppressions.
 * - Stable IDs only.
 *
 * Important:
 * - Pure definitions only.
 * - No Firestore writes here.
 * - Server-only collections must be written by backend / Cloud Functions only.
 */

import type { BuildingId } from '../shared/types';

type Values<T> = T[keyof T];

export const BUILDING_IDS = {
  HOTEL_MAIN: 'hotel_main',
  DEPANNEUR_COUCHE_TARD: 'depanneur_couche_tard',
} as const;

export type KnownBuildingId = Values<typeof BUILDING_IDS>;

export const BUILDINGS_COLLECTIONS = {
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
    ACCESS_CREDENTIALS: 'hotel_access_credentials',
    LOCK_EVENTS: 'hotel_lock_events',
    MAINTENANCE: 'hotel_maintenance',
    CLEANING: 'hotel_cleaning',
  },

  DEPANNEUR: {
    ZONES: 'depanneur_zones',
    INVENTORY: 'depanneur_inventory',
    SALES: 'depanneur_sales',
    SECURITY_EVENTS: 'depanneur_security_events',
    DELIVERIES: 'depanneur_deliveries',
    WASTE: 'depanneur_waste_logs',
    STAFF: 'depanneur_staff',
  },

  AUDIT: 'buildings_audit_logs',
  LOCK_COMMANDS: 'buildings_lock_commands',
} as const;

export type HotelCollectionKey = keyof typeof BUILDINGS_COLLECTIONS.HOTEL;
export type DepanneurCollectionKey = keyof typeof BUILDINGS_COLLECTIONS.DEPANNEUR;

export type HotelCollectionName = Values<typeof BUILDINGS_COLLECTIONS.HOTEL>;
export type DepanneurCollectionName = Values<typeof BUILDINGS_COLLECTIONS.DEPANNEUR>;

export type BuildingCollectionKey = HotelCollectionKey | DepanneurCollectionKey;
export type BuildingCollectionName =
  | HotelCollectionName
  | DepanneurCollectionName
  | typeof BUILDINGS_COLLECTIONS.AUDIT
  | typeof BUILDINGS_COLLECTIONS.LOCK_COMMANDS;

export type HotelCollectionInput = HotelCollectionKey | HotelCollectionName;
export type DepanneurCollectionInput = DepanneurCollectionKey | DepanneurCollectionName;
export type BuildingCollectionInput = HotelCollectionInput | DepanneurCollectionInput;

export const BUILDING_COLLECTION_GROUPS = {
  [BUILDING_IDS.HOTEL_MAIN]: BUILDINGS_COLLECTIONS.HOTEL,
  [BUILDING_IDS.DEPANNEUR_COUCHE_TARD]: BUILDINGS_COLLECTIONS.DEPANNEUR,
} as const;

export const RECORD_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const;

export type RecordStatus = Values<typeof RECORD_STATUS>;

export const BUILDING_PERMISSION_SCOPES = {
  HOTEL: {
    ROOM_READ: 'hotel.room.read',
    ROOM_WRITE: 'hotel.room.write',
    DOOR_READ: 'hotel.door.read',
    DOOR_CONTROL: 'hotel.door.control',
    LOCK_READ: 'hotel.lock.read',
    LOCK_CONTROL: 'hotel.lock.control',
    SAFE_CONTROL: 'hotel.safe.control',
    OWNER_MANAGE: 'hotel.owner.manage',
    RESERVATION_MANAGE: 'hotel.reservation.manage',
    ACCESS_GRANT_MANAGE: 'hotel.accessGrant.manage',
    MAINTENANCE_MANAGE: 'hotel.maintenance.manage',
    CLEANING_MANAGE: 'hotel.cleaning.manage',
  },

  DEPANNEUR: {
    ZONE_READ: 'depanneur.zone.read',
    ZONE_WRITE: 'depanneur.zone.write',
    INVENTORY_READ: 'depanneur.inventory.read',
    INVENTORY_WRITE: 'depanneur.inventory.write',
    SALE_CREATE: 'depanneur.sale.create',
    DELIVERY_MANAGE: 'depanneur.delivery.manage',
    WASTE_MANAGE: 'depanneur.waste.manage',
    STAFF_MANAGE: 'depanneur.staff.manage',
    SECURITY_READ: 'depanneur.security.read',
    SECURITY_CONTROL: 'depanneur.security.control',
  },

  SERVER_ONLY: {
    AUDIT_APPEND: 'buildings.audit.append',
    LOCK_COMMAND_CREATE: 'buildings.lockCommand.create',
    IMMUTABLE_EVENT_APPEND: 'buildings.immutableEvent.append',
  },
} as const;

export const SECRET_FIELD_POLICY = {
  NEVER_STORE_READABLE_FIELDS: [
    'pin',
    'nip',
    'code',
    'password',
    'cardNumber',
    'key',
    'secret',
    'token',
    'plainText',
    'credentialValue',
  ],

  HASH_ONLY_FIELDS: [
    'pinHash',
    'nipHash',
    'cardHash',
    'keyHash',
    'credentialHash',
    'secretHash',
  ],

  PUBLIC_SAFE_CREDENTIAL_FIELDS: [
    'credentialId',
    'credentialKind',
    'ownerUid',
    'buildingId',
    'scope',
    'status',
    'last4',
    'hashVersion',
    'createdAt',
    'updatedAt',
    'revokedAt',
  ],
} as const;

export const APPEND_ONLY_COLLECTIONS = [
  BUILDINGS_COLLECTIONS.HOTEL.LOCK_EVENTS,
  BUILDINGS_COLLECTIONS.DEPANNEUR.SECURITY_EVENTS,
  BUILDINGS_COLLECTIONS.AUDIT,
] as const;

export type AppendOnlyCollectionName = typeof APPEND_ONLY_COLLECTIONS[number];

export const SERVER_ONLY_COLLECTIONS = [
  BUILDINGS_COLLECTIONS.AUDIT,
  BUILDINGS_COLLECTIONS.LOCK_COMMANDS,
  BUILDINGS_COLLECTIONS.HOTEL.ACCESS_CREDENTIALS,
  BUILDINGS_COLLECTIONS.HOTEL.LOCK_EVENTS,
  BUILDINGS_COLLECTIONS.DEPANNEUR.SECURITY_EVENTS,
] as const;

export type ServerOnlyCollectionName = typeof SERVER_ONLY_COLLECTIONS[number];

export const HOTEL_COLLECTION_NAMES = Object.values(
  BUILDINGS_COLLECTIONS.HOTEL
) as HotelCollectionName[];

export const DEPANNEUR_COLLECTION_NAMES = Object.values(
  BUILDINGS_COLLECTIONS.DEPANNEUR
) as DepanneurCollectionName[];

export const STABLE_ID_REGEX = /^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/;

export function isStableId(id: string): boolean {
  return STABLE_ID_REGEX.test(id);
}

export function assertStableId<T extends string>(id: T, label = 'id'): T {
  if (!isStableId(id)) {
    throw new Error(
      `[buildings/firebase/collections] Invalid ${label}: "${id}". Use stable lowercase IDs only: a-z, 0-9, "_" or "-", max 64 chars, no slash.`
    );
  }

  return id;
}

function hasOwn<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function resolveCollectionFromGroup<T extends Record<string, string>>(
  group: T,
  collection: string
): Values<T> | null {
  if (hasOwn(group, collection)) {
    return group[collection] as Values<T>;
  }

  const values = Object.values(group) as Array<Values<T>>;

  if (values.includes(collection as Values<T>)) {
    return collection as Values<T>;
  }

  return null;
}

export function isHotelCollection(collection: string): collection is HotelCollectionName {
  return HOTEL_COLLECTION_NAMES.includes(collection as HotelCollectionName);
}

export function isDepanneurCollection(collection: string): collection is DepanneurCollectionName {
  return DEPANNEUR_COLLECTION_NAMES.includes(collection as DepanneurCollectionName);
}

export function isAppendOnlyCollection(
  collection: string
): collection is AppendOnlyCollectionName {
  return (APPEND_ONLY_COLLECTIONS as readonly string[]).includes(collection);
}

export function isServerOnlyCollection(
  collection: string
): collection is ServerOnlyCollectionName {
  return (SERVER_ONLY_COLLECTIONS as readonly string[]).includes(collection);
}

export function tryGetCollectionForBuilding(
  buildingId: BuildingId,
  collection: BuildingCollectionInput | string
): BuildingCollectionName | null {
  const id = String(buildingId);

  if (id === BUILDING_IDS.HOTEL_MAIN) {
    return resolveCollectionFromGroup(BUILDINGS_COLLECTIONS.HOTEL, collection);
  }

  if (id === BUILDING_IDS.DEPANNEUR_COUCHE_TARD) {
    return resolveCollectionFromGroup(BUILDINGS_COLLECTIONS.DEPANNEUR, collection);
  }

  return null;
}

export function getCollectionForBuilding(
  buildingId: BuildingId,
  collection: BuildingCollectionInput | string
): BuildingCollectionName {
  const resolved = tryGetCollectionForBuilding(buildingId, collection);

  if (!resolved) {
    throw new Error(
      `[buildings/firebase/collections] Invalid collection "${collection}" for building "${String(
        buildingId
      )}". Hôtel and Dépanneur collections are strictly separated.`
    );
  }

  return resolved;
}

export function docPath(collection: BuildingCollectionName, docId: string): string {
  return `${collection}/${assertStableId(docId, 'docId')}`;
}

export function getBuildingDocPath(
  buildingId: BuildingId,
  collection: BuildingCollectionInput | string,
  docId: string
): string {
  return docPath(getCollectionForBuilding(buildingId, collection), docId);
}

// Hôtel paths

export const getHotelRoomPath = (roomId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.ROOMS, roomId);

export const getHotelDoorPath = (doorId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.DOORS, doorId);

export const getHotelLockPath = (lockId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.LOCKS, lockId);

export const getHotelSafePath = (safeId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.SAFES, safeId);

export const getHotelOwnerPath = (ownerId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.OWNERS, ownerId);

export const getHotelOwnershipPath = (ownershipId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.OWNERSHIPS, ownershipId);

export const getHotelReservationPath = (reservationId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.RESERVATIONS, reservationId);

export const getHotelStayPath = (stayId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.STAYS, stayId);

export const getHotelAccessGrantPath = (grantId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.ACCESS_GRANTS, grantId);

export const getHotelAccessCredentialPath = (credentialId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.ACCESS_CREDENTIALS, credentialId);

export const getHotelLockEventPath = (eventId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.LOCK_EVENTS, eventId);

export const getHotelMaintenancePath = (maintenanceId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.MAINTENANCE, maintenanceId);

export const getHotelCleaningPath = (cleaningId: string) =>
  docPath(BUILDINGS_COLLECTIONS.HOTEL.CLEANING, cleaningId);

// Dépanneur paths

export const getDepanneurZonePath = (zoneId: string) =>
  docPath(BUILDINGS_COLLECTIONS.DEPANNEUR.ZONES, zoneId);

export const getDepanneurInventoryItemPath = (itemId: string) =>
  docPath(BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY, itemId);

export const getDepanneurSalePath = (saleId: string) =>
  docPath(BUILDINGS_COLLECTIONS.DEPANNEUR.SALES, saleId);

export const getDepanneurSecurityEventPath = (eventId: string) =>
  docPath(BUILDINGS_COLLECTIONS.DEPANNEUR.SECURITY_EVENTS, eventId);

export const getDepanneurDeliveryPath = (deliveryId: string) =>
  docPath(BUILDINGS_COLLECTIONS.DEPANNEUR.DELIVERIES, deliveryId);

export const getDepanneurWasteLogPath = (wasteLogId: string) =>
  docPath(BUILDINGS_COLLECTIONS.DEPANNEUR.WASTE, wasteLogId);

export const getDepanneurStaffPath = (staffId: string) =>
  docPath(BUILDINGS_COLLECTIONS.DEPANNEUR.STAFF, staffId);

// Shared server-only paths

export const getBuildingAuditLogPath = (auditLogId: string) =>
  docPath(BUILDINGS_COLLECTIONS.AUDIT, auditLogId);

export const getBuildingLockCommandPath = (commandId: string) =>
  docPath(BUILDINGS_COLLECTIONS.LOCK_COMMANDS, commandId);