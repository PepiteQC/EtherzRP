// src/hotel3d/constants/ids.ts

export type BuildingId = 'hotel' | 'depanneur';
export type FloorType = 'rdc' | 'chamber';

export interface RoomId {
  building: BuildingId;
  floor: number;
  side: 'left' | 'right';
  position: number;
  readonly key: string;
}

export interface DoorId {
  room: string;
  type: 'entry' | 'bathroom' | 'closet' | 'connecting';
  readonly key: string;
}

export interface LockId {
  door: string;
  type: 'electronic' | 'mechanical' | 'deadbolt';
  readonly key: string;
}

export interface ServiceRoomId {
  building: BuildingId;
  floor: number;
  type: 'linen' | 'janitor' | 'network' | 'security' | 'luggage' | 'mechanical';
  readonly key: string;
}

export function makeRoomId(
  building: BuildingId,
  floor: number,
  side: 'left' | 'right',
  position: number
): RoomId {
  const key = `${building}_F${floor}_${side}_R${position}`;
  return { building, floor, side, position, key };
}

export function makeDoorId(roomKey: string, type: DoorId['type']): DoorId {
  return { room: roomKey, type, key: `${roomKey}_D_${type}` };
}

export function makeLockId(doorKey: string, type: LockId['type']): LockId {
  return { door: doorKey, type, key: `${doorKey}_L_${type}` };
}

export function makeServiceRoomId(
  building: BuildingId,
  floor: number,
  type: ServiceRoomId['type']
): ServiceRoomId {
  return { building, floor, type, key: `${building}_F${floor}_SVC_${type}` };
}

/**
 * Numéro d'affichage pour le client.
 * Étage 1 gauche pos 0 = "101"
 * Étage 1 droite pos 0 = "106"
 * Étage 2 gauche pos 3 = "204"
 * Étage 3 droite pos 4 = "310"
 */
export function roomDisplayNumber(
  floor: number,
  side: 'left' | 'right',
  position: number
): string {
  const roomNum = side === 'left' ? position + 1 : position + 6;
  return `${floor}${String(roomNum).padStart(2, '0')}`;
}

export function generateAllRoomIds(): RoomId[] {
  const rooms: RoomId[] = [];
  for (let floor = 1; floor <= 3; floor++) {
    for (const side of ['left', 'right'] as const) {
      for (let pos = 0; pos < 5; pos++) {
        rooms.push(makeRoomId('hotel', floor, side, pos));
      }
    }
  }
  return rooms;
}

export function generateAllDoorIds(): DoorId[] {
  return generateAllRoomIds().flatMap((room) => [
    makeDoorId(room.key, 'entry'),
    makeDoorId(room.key, 'bathroom'),
  ]);
}

export function generateAllLockIds(): LockId[] {
  return generateAllDoorIds()
    .filter((d) => d.type === 'entry')
    .flatMap((door) => [
      makeLockId(door.key, 'electronic'),
      makeLockId(door.key, 'mechanical'),
    ]);
}