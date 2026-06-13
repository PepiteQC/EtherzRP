/**
 * src/buildings/depanneur/core/DepanneurFirebase.ts
 * Helpers Firebase/Firestore pour le dépanneur.
 *
 * Important: aucune écriture client directe ici. Ces helpers donnent des chemins
 * et payloads seed pour Node.js/Firebase Admin ou Cloud Functions.
 */

import { BUILDINGS_COLLECTIONS } from '../../firebase/collections'
import { DepanneurRegistry } from './DepanneurRegistry'

export const DEPANNEUR_FIREBASE_PATHS = {
  root: 'buildings/depanneur_couche_tard',
  zones: BUILDINGS_COLLECTIONS.DEPANNEUR.ZONES,
  inventory: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY,
  sales: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES,
  securityEvents: BUILDINGS_COLLECTIONS.DEPANNEUR.SECURITY_EVENTS,
  deliveries: BUILDINGS_COLLECTIONS.DEPANNEUR.DELIVERIES,
  waste: BUILDINGS_COLLECTIONS.DEPANNEUR.WASTE,
  staff: BUILDINGS_COLLECTIONS.DEPANNEUR.STAFF,
} as const

export function getDepanneurDocumentPath(kind: keyof typeof DEPANNEUR_FIREBASE_PATHS, id: string): string {
  const collection = DEPANNEUR_FIREBASE_PATHS[kind]
  return `${collection}/${id}`
}

export function createDepanneurFirebaseSeed() {
  const seed = DepanneurRegistry.toFirebaseSeed()
  return {
    ...seed,
    paths: DEPANNEUR_FIREBASE_PATHS,
    auditPolicy: {
      appendOnly: true,
      clientWritesAllowed: false,
      readableSecretsStored: false,
      note: 'Écritures sensibles via Node.js/Firebase Admin ou Cloud Functions seulement.',
    },
  }
}

export function createInventoryPatch(itemId: string, deltaStock: number, actorId: string) {
  return {
    itemId,
    deltaStock,
    actorId,
    buildingId: DepanneurRegistry.buildingId,
    createdAt: new Date().toISOString(),
    collection: DEPANNEUR_FIREBASE_PATHS.inventory,
    auditCollection: DEPANNEUR_FIREBASE_PATHS.securityEvents,
  }
}

export function createSaleEvent(params: {
  saleId: string
  actorId: string
  items: Array<{ itemId: string; qty: number; unitPrice: number }>
}) {
  const total = params.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  return {
    ...params,
    buildingId: DepanneurRegistry.buildingId,
    total,
    currency: 'CAD',
    createdAt: new Date().toISOString(),
    collection: DEPANNEUR_FIREBASE_PATHS.sales,
  }
}
