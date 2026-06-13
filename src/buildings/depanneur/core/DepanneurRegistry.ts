/**
 * src/buildings/depanneur/core/DepanneurRegistry.ts
 *
 * Registre officiel du dépanneur indépendant.
 *
 * Design:
 * - IDs stables pour React Three userData + Firebase/Firestore.
 * - Le dépanneur vit seul: structure, zones, inventaire, sécurité, livraison.
 * - Aucune dépendance fonctionnelle à l'hôtel.
 * - Données 100% sérialisables côté Firebase.
 */

import type { BuildingBase } from '../../shared/types'
import { BUILDINGS_COLLECTIONS } from '../../firebase/collections'
import type {
  DepanneurFixture,
  DepanneurInventoryItem,
  DepanneurRegistryShape,
  DepanneurSecurityCamera,
  DepanneurZone,
} from './DepanneurTypes'

export const DEPANNEUR_BUILDING: BuildingBase = {
  id: 'depanneur_couche_tard',
  name: 'Dépanneur Couche-Tard — EtherWorld 24/7',
  origin: [80, 0, -60],
  architectural: {
    width: 18,
    depth: 16,
    height: 6.2,
    wallThickness: 0.18,
    doorWidth: 2.2,
    doorHeight: 2.8,
    corridorWidth: 0,
    roomWidth: 0,
    roomDepth: 0,
  },
  decorative: {
    wallColor: '#eee7dc',
    floorColor: '#ddd6c8',
    ceilingColor: '#d8d2c8',
    trimColor: '#cc1018',
    materialRoughness: 0.62,
    materialMetalness: 0.08,
    windowEmissiveIntensity: 0.25,
  },
}

export const DEPANNEUR_ZONES: DepanneurZone[] = [
  {
    id: 'depanneur_customer_floor',
    buildingId: 'depanneur_couche_tard',
    type: 'customer',
    label: 'Aire clients',
    position: [0, 0, 0],
    size: [14, 3, 10],
    access: 'public',
    firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.ZONES,
  },
  {
    id: 'depanneur_cash_zone',
    buildingId: 'depanneur_couche_tard',
    type: 'cash',
    label: 'Comptoir caisse',
    position: [0, 0, 5.35],
    size: [6, 2.2, 1.8],
    access: 'staff',
    firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES,
  },
  {
    id: 'depanneur_staff_room',
    buildingId: 'depanneur_couche_tard',
    type: 'staff',
    label: 'Arrière-boutique employés',
    position: [6.6, 0, -4.6],
    size: [3.2, 3, 4],
    access: 'staff',
    firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.STAFF,
  },
  {
    id: 'depanneur_delivery_zone',
    buildingId: 'depanneur_couche_tard',
    type: 'delivery',
    label: 'Livraison / quai arrière',
    position: [0, 0, -10.4],
    size: [12, 3, 4],
    access: 'staff',
    firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.DELIVERIES,
  },
  {
    id: 'depanneur_waste_zone',
    buildingId: 'depanneur_couche_tard',
    type: 'waste',
    label: 'Déchets / recyclage',
    position: [10.8, 0, -7.8],
    size: [4, 2, 4],
    access: 'staff',
    firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.WASTE,
  },
  {
    id: 'depanneur_parking_zone',
    buildingId: 'depanneur_couche_tard',
    type: 'parking',
    label: 'Stationnement clients',
    position: [0, 0, 14],
    size: [24, 1, 13],
    access: 'public',
    firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.ZONES,
  },
  {
    id: 'depanneur_fuel_zone',
    buildingId: 'depanneur_couche_tard',
    type: 'fuel',
    label: 'Pompes essence',
    position: [-13.5, 0, 10],
    size: [9, 5, 12],
    access: 'public',
    firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES,
  },
]

export const DEPANNEUR_FIXTURES: DepanneurFixture[] = [
  { id: 'fixture_counter_main', buildingId: 'depanneur_couche_tard', type: 'counter', label: 'Comptoir principal', position: [0, 0, 5.25], scale: [5.8, 1.05, 0.9], zoneId: 'depanneur_cash_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
  { id: 'fixture_register_01', buildingId: 'depanneur_couche_tard', type: 'cash_register', label: 'Caisse 01', position: [-1.55, 1.15, 5.15], zoneId: 'depanneur_cash_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
  { id: 'fixture_register_02', buildingId: 'depanneur_couche_tard', type: 'cash_register', label: 'Caisse 02', position: [1.55, 1.15, 5.15], zoneId: 'depanneur_cash_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
  { id: 'fixture_lottery', buildingId: 'depanneur_couche_tard', type: 'lottery', label: 'Loto-Québec', position: [0, 1.55, 5.55], zoneId: 'depanneur_cash_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
  { id: 'fixture_shelf_west', buildingId: 'depanneur_couche_tard', type: 'shelf', label: 'Rayon chips/snacks', position: [-4.8, 0, -0.5], rotationY: 0, scale: [0.7, 2.35, 5.6], zoneId: 'depanneur_customer_floor', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'fixture_shelf_east', buildingId: 'depanneur_couche_tard', type: 'shelf', label: 'Rayon produits rapides', position: [4.8, 0, -0.5], rotationY: 0, scale: [0.7, 2.35, 5.6], zoneId: 'depanneur_customer_floor', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'fixture_center_island', buildingId: 'depanneur_couche_tard', type: 'shelf', label: 'Îlot promotions', position: [0, 0, -0.8], scale: [2.6, 1, 4], zoneId: 'depanneur_customer_floor', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'fixture_fridge_wall', buildingId: 'depanneur_couche_tard', type: 'fridge', label: 'Frigos boissons', position: [0, 0, -7.55], scale: [8.6, 2.4, 0.8], zoneId: 'depanneur_customer_floor', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'fixture_coffee_station', buildingId: 'depanneur_couche_tard', type: 'coffee', label: 'Station café', position: [-7.25, 0.55, 3.0], zoneId: 'depanneur_customer_floor', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'fixture_slush_machine', buildingId: 'depanneur_couche_tard', type: 'slush', label: 'Machine sloche', position: [-7.25, 0.8, -3.2], zoneId: 'depanneur_customer_floor', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'fixture_hotdog_roller', buildingId: 'depanneur_couche_tard', type: 'hotdog', label: 'Rouleaux hot-dogs', position: [2.7, 1.22, 5.45], zoneId: 'depanneur_cash_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'fixture_atm', buildingId: 'depanneur_couche_tard', type: 'atm', label: 'ATM', position: [7.4, 0.82, 3.8], zoneId: 'depanneur_customer_floor', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
  { id: 'fixture_ice_cage', buildingId: 'depanneur_couche_tard', type: 'ice_cage', label: 'Glace / ICE', position: [8.7, 0.5, 9.2], zoneId: 'depanneur_parking_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'fixture_delivery_door', buildingId: 'depanneur_couche_tard', type: 'delivery_door', label: 'Porte livraison', position: [0, 1.35, -8.1], zoneId: 'depanneur_delivery_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.DELIVERIES },
  { id: 'fixture_fuel_pump_01', buildingId: 'depanneur_couche_tard', type: 'fuel_pump', label: 'Pompe 01', position: [-13.5, 0.9, 7.4], zoneId: 'depanneur_fuel_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
  { id: 'fixture_fuel_pump_02', buildingId: 'depanneur_couche_tard', type: 'fuel_pump', label: 'Pompe 02', position: [-13.5, 0.9, 12.4], zoneId: 'depanneur_fuel_zone', interactive: true, firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
]

export const DEPANNEUR_CAMERAS: DepanneurSecurityCamera[] = [
  { id: 'cam_dep_front', buildingId: 'depanneur_couche_tard', label: 'Caméra entrée', position: [-6.8, 5.85, 7.7], rotation: [0.35, -0.7, 0], coverageZoneIds: ['depanneur_customer_floor', 'depanneur_parking_zone'], eventCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SECURITY_EVENTS },
  { id: 'cam_dep_cash', buildingId: 'depanneur_couche_tard', label: 'Caméra caisse', position: [6.8, 5.65, 5.9], rotation: [0.45, -2.4, 0], coverageZoneIds: ['depanneur_cash_zone'], eventCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SECURITY_EVENTS },
  { id: 'cam_dep_back', buildingId: 'depanneur_couche_tard', label: 'Caméra livraison', position: [6.8, 5.2, -7.4], rotation: [0.35, Math.PI, 0], coverageZoneIds: ['depanneur_delivery_zone', 'depanneur_waste_zone'], eventCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SECURITY_EVENTS },
]

export const DEPANNEUR_INVENTORY: DepanneurInventoryItem[] = [
  { id: 'inv_chips_bbq', sku: 'EW-CHIPS-BBQ', label: 'Chips BBQ', category: 'snack', price: 3.49, stock: 84, zoneId: 'depanneur_customer_floor', fixtureId: 'fixture_shelf_west', firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'inv_cola_500', sku: 'EW-COLA-500', label: 'Cola 500ml', category: 'drink', price: 2.79, stock: 112, zoneId: 'depanneur_customer_floor', fixtureId: 'fixture_fridge_wall', firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'inv_water_1l', sku: 'EW-WATER-1L', label: 'Eau 1L', category: 'drink', price: 1.99, stock: 130, zoneId: 'depanneur_customer_floor', fixtureId: 'fixture_fridge_wall', firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'inv_coffee_large', sku: 'EW-COFFEE-L', label: 'Café grand', category: 'coffee', price: 2.25, stock: 999, zoneId: 'depanneur_customer_floor', fixtureId: 'fixture_coffee_station', firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'inv_hotdog', sku: 'EW-HOTDOG', label: 'Hot-dog', category: 'hot_food', price: 3.99, stock: 42, zoneId: 'depanneur_cash_zone', fixtureId: 'fixture_hotdog_roller', firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.INVENTORY },
  { id: 'inv_lotto', sku: 'EW-LOTO-01', label: 'Billet Loto', category: 'lottery', price: 5.0, stock: 300, zoneId: 'depanneur_cash_zone', fixtureId: 'fixture_lottery', firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
  { id: 'inv_fuel_regular', sku: 'EW-FUEL-REG', label: 'Essence régulière', category: 'fuel', price: 1.74, stock: 60000, zoneId: 'depanneur_fuel_zone', fixtureId: 'fixture_fuel_pump_01', firebaseCollection: BUILDINGS_COLLECTIONS.DEPANNEUR.SALES },
]

export const DEPANNEUR_HAS_ROOMS = false
export const DEPANNEUR_ROOMS: never[] = []
export const DEPANNEUR_DOORS: never[] = []
export const DEPANNEUR_LOCKS: never[] = []

export const DepanneurRegistry: DepanneurRegistryShape & {
  building: typeof DEPANNEUR_BUILDING
  getZone: (id: string) => DepanneurZone | undefined
  getFixture: (id: string) => DepanneurFixture | undefined
  getInventoryByFixture: (fixtureId: string) => DepanneurInventoryItem[]
  toFirebaseSeed: () => Record<string, unknown>
} = {
  buildingId: 'depanneur_couche_tard',
  version: '2026.06.depanneur-core.v1',
  building: DEPANNEUR_BUILDING,
  zones: DEPANNEUR_ZONES,
  fixtures: DEPANNEUR_FIXTURES,
  inventory: DEPANNEUR_INVENTORY,
  cameras: DEPANNEUR_CAMERAS,
  getZone: (id) => DEPANNEUR_ZONES.find((z) => z.id === id),
  getFixture: (id) => DEPANNEUR_FIXTURES.find((f) => f.id === id),
  getInventoryByFixture: (fixtureId) => DEPANNEUR_INVENTORY.filter((i) => i.fixtureId === fixtureId),
  toFirebaseSeed: () => ({
    meta: {
      buildingId: DEPANNEUR_BUILDING.id,
      version: '2026.06.depanneur-core.v1',
      generatedAt: new Date().toISOString(),
    },
    building: DEPANNEUR_BUILDING,
    zones: DEPANNEUR_ZONES,
    fixtures: DEPANNEUR_FIXTURES,
    inventory: DEPANNEUR_INVENTORY,
    cameras: DEPANNEUR_CAMERAS,
  }),
}

export function getDepanneurBuilding(): BuildingBase {
  return DEPANNEUR_BUILDING
}

export function getDepanneurZone(id: string): DepanneurZone | undefined {
  return DepanneurRegistry.getZone(id)
}

export function getDepanneurFixture(id: string): DepanneurFixture | undefined {
  return DepanneurRegistry.getFixture(id)
}
