/**
 * src/buildings/shared/types.ts
 * 
 * Shared stable types for modular Hôtel + Dépanneur architecture.
 * 
 * Anti-casse compliance:
 * - Stable unique IDs for every building/floor/room/door/lock
 * - Architectural dimensions kept SEPARATE from decorative params
 * - Strict TypeScript
 * - No mixing of hôtel/dépanneur
 * - Immutable journal patterns for access (see AccessControlTypes)
 */

import type { Vector3Tuple } from 'three';

// ═══════════════════════════════════════════════════════════════
// STABLE ID TYPES (never change once assigned; used in Firestore keys, userData, etc.)
// ═══════════════════════════════════════════════════════════════

export type BuildingId = 'hotel_main' | 'depanneur_couche_tard';
export type FloorId = `${BuildingId}_f${number}`;           // e.g. hotel_main_f00
export type RoomId = `${FloorId}_r${number}`;               // e.g. hotel_main_f00_r101
export type DoorId = `${RoomId}_d${string}`;                // e.g. hotel_main_f00_r101_d01
export type LockId = `${DoorId}_l${string}`;                // e.g. hotel_main_f00_r101_d01_l01
export type SafeId = `${RoomId}_s${string}`;

// ═══════════════════════════════════════════════════════════════
// ARCHITECTURAL (real-world dimensions in meters — source of truth for structure)
// ═══════════════════════════════════════════════════════════════

export interface ArchitecturalDimensions {
  width: number;      // m
  depth: number;      // m
  height: number;     // m per floor
  wallThickness: number;
  doorWidth: number;
  doorHeight: number;
  corridorWidth: number;
  roomWidth: number;
  roomDepth: number;
}

// ═══════════════════════════════════════════════════════════════
// DECORATIVE (visual only — can change freely without affecting logic/IDs)
// ═══════════════════════════════════════════════════════════════

export interface DecorativeParams {
  wallColor: string;
  floorColor: string;
  ceilingColor: string;
  windowEmissiveIntensity: number;
  trimColor: string;
  materialRoughness: number;
  materialMetalness: number;
  // Future: texture keys, LOD levels, etc. — never used for collision or access logic
}

// ═══════════════════════════════════════════════════════════════
// BASE ENTITIES (immutable core + optional visual overrides)
// ═══════════════════════════════════════════════════════════════

export interface BuildingBase {
  id: BuildingId;
  name: string;
  origin: Vector3Tuple;           // world position of building root
  architectural: ArchitecturalDimensions;
  decorative?: Partial<DecorativeParams>;
  // No functional dependency on the other building
}

export interface FloorBase {
  id: FloorId;
  buildingId: BuildingId;
  level: number;                  // 0, 1, 2
  architectural: Pick<ArchitecturalDimensions, 'height' | 'corridorWidth'>;
  roomCount: number;              // must be 10 for hotel
  decorative?: Partial<DecorativeParams>;
}

export interface RoomBase {
  id: RoomId;
  floorId: FloorId;
  buildingId: BuildingId;
  number: number;                 // 101-110 per floor for hotel
  side: 'left' | 'right';
  architectural: Pick<ArchitecturalDimensions, 'roomWidth' | 'roomDepth' | 'height'>;
  hasSafe: boolean;
  decorative?: Partial<DecorativeParams>;
}

export interface DoorBase {
  id: DoorId;
  roomId: RoomId;
  buildingId: BuildingId;
  architectural: Pick<ArchitecturalDimensions, 'doorWidth' | 'doorHeight'>;
  position: Vector3Tuple;         // relative to room
  rotationY: number;
  lockId: LockId;
  decorative?: Partial<DecorativeParams>;
}

export interface LockBase {
  id: LockId;
  doorId: DoorId;
  buildingId: BuildingId;
  type: 'keycard' | 'keypad' | 'connected' | 'mechanical';
  // Never store readable NIP/card/key here (anti-casse)
  // Real state lives in simulator or secure backend
  simulatorOnly: boolean;         // must be true until Phase 5
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE TYPE GUARDS
// ═══════════════════════════════════════════════════════════════

export function isHotelBuilding(id: BuildingId): id is 'hotel_main' {
  return id === 'hotel_main';
}

export function isDepanneurBuilding(id: BuildingId): id is 'depanneur_couche_tard' {
  return id === 'depanneur_couche_tard';
}
