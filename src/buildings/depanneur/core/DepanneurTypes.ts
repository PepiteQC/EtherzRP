/**
 * src/buildings/depanneur/core/DepanneurTypes.ts
 * Types stricts du dépanneur indépendant.
 *
 * Objectif: Three.js/React pour la scène, Firebase-ready pour les données,
 * aucune dépendance fonctionnelle à l'hôtel.
 */

import type { Vector3Tuple } from 'three'
import type { BuildingId } from '../../shared/types'

export type DepanneurId = Extract<BuildingId, 'depanneur_couche_tard'>

export type DepanneurZoneType =
  | 'customer'
  | 'staff'
  | 'security'
  | 'delivery'
  | 'waste'
  | 'parking'
  | 'fuel'
  | 'inventory'
  | 'cash'

export type DepanneurFixtureType =
  | 'shelf'
  | 'fridge'
  | 'counter'
  | 'cash_register'
  | 'atm'
  | 'coffee'
  | 'slush'
  | 'hotdog'
  | 'lottery'
  | 'security_camera'
  | 'fuel_pump'
  | 'ice_cage'
  | 'waste_bin'
  | 'delivery_door'
  | 'neon_sign'

export interface DepanneurZone {
  id: string
  buildingId: DepanneurId
  type: DepanneurZoneType
  label: string
  position: Vector3Tuple
  size: Vector3Tuple
  access: 'public' | 'staff' | 'manager' | 'security'
  firebaseCollection: string
}

export interface DepanneurFixture {
  id: string
  buildingId: DepanneurId
  type: DepanneurFixtureType
  label: string
  position: Vector3Tuple
  rotationY?: number
  scale?: Vector3Tuple
  zoneId: string
  firebaseCollection?: string
  interactive?: boolean
}

export interface DepanneurInventoryItem {
  id: string
  sku: string
  label: string
  category: 'snack' | 'drink' | 'coffee' | 'hot_food' | 'lottery' | 'utility' | 'fuel'
  price: number
  stock: number
  zoneId: string
  fixtureId: string
  firebaseCollection: string
}

export interface DepanneurSecurityCamera {
  id: string
  buildingId: DepanneurId
  label: string
  position: Vector3Tuple
  rotation: Vector3Tuple
  coverageZoneIds: string[]
  eventCollection: string
}

export interface DepanneurRegistryShape {
  buildingId: DepanneurId
  version: string
  zones: DepanneurZone[]
  fixtures: DepanneurFixture[]
  inventory: DepanneurInventoryItem[]
  cameras: DepanneurSecurityCamera[]
}
