// src/components/hotel/constants/ids.ts — AJOUTS

export interface BuildingInstanceId {
  type: 'hotel' | 'depanneur';
  instance: string;
  readonly key: string;
}

export interface FloorId {
  building: BuildingId;
  level: number;
  type: FloorType;
  readonly key: string;
}

export interface ShaftId {
  building: BuildingId;
  type: 'plumbing' | 'electrical' | 'ventilation' | 'elevator';
  index: number;
  readonly key: string;
}

export function makeBuildingId(type: BuildingId, instance = 'main'): BuildingInstanceId {
  return { type, instance, key: `bld_${type}_${instance}` };
}

export function makeFloorId(building: BuildingId, level: number, type: FloorType): FloorId {
  return { building, level, type, key: `${building}_floor_${level}_${type}` };
}

export function makeShaftId(
  building: BuildingId,
  type: ShaftId['type'],
  index: number
): ShaftId {
  return { building, type, index, key: `${building}_shaft_${type}_${index}` };
}

// Building IDs
export const HOTEL_BUILDING_ID = makeBuildingId('hotel');
export const DEPANNEUR_BUILDING_ID = makeBuildingId('depanneur');

// Floor IDs
export const HOTEL_FLOOR_IDS = {
  rdc: makeFloorId('hotel', 0, 'rdc'),
  etage1: makeFloorId('hotel', 1, 'chamber'),
  etage2: makeFloorId('hotel', 2, 'chamber'),
  etage3: makeFloorId('hotel', 3, 'chamber'),
} as const;