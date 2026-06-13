/**
 * src/buildings/hotel/core/HotelRegistry.ts
 * Registre stable de l'hôtel EtherWorld.
 *
 * - 3 étages
 * - 10 chambres par étage = 30 chambres
 * - IDs stables compatibles Firestore / userData Three.js
 * - Portes + locks générées pour carte magnétique et numpad
 */

import type { BuildingBase, DoorBase, FloorBase, LockBase, RoomBase, RoomId } from '../../shared/types'

export const HOTEL_ARCH = {
  totalWidth: 48,
  totalDepth: 48,
  floorHeight: 3.6,
  floors: 3,
  roomsPerFloor: 10,
  roomsPerSide: 5,
  corridorWidth: 4,
  roomWidth: 7.2,
  roomDepth: 7.4,
  wallThickness: 0.22,
  doorWidth: 1.05,
  doorHeight: 2.35,
} as const

export const HOTEL_BUILDING: BuildingBase = {
  id: 'hotel_main',
  name: 'Hôtel EtherWorld — Accès Sécurisé',
  origin: [-72, 0, 872],
  architectural: {
    width: HOTEL_ARCH.totalWidth,
    depth: HOTEL_ARCH.totalDepth,
    height: HOTEL_ARCH.floorHeight,
    wallThickness: HOTEL_ARCH.wallThickness,
    doorWidth: HOTEL_ARCH.doorWidth,
    doorHeight: HOTEL_ARCH.doorHeight,
    corridorWidth: HOTEL_ARCH.corridorWidth,
    roomWidth: HOTEL_ARCH.roomWidth,
    roomDepth: HOTEL_ARCH.roomDepth,
  },
  decorative: {
    wallColor: '#2d313a',
    floorColor: '#c8c0b4',
    ceilingColor: '#171923',
    trimColor: '#8b5cf6',
    windowEmissiveIntensity: 0.38,
    materialRoughness: 0.72,
    materialMetalness: 0.12,
  },
}

export const HOTEL_RECEPTION = {
  id: 'hotel_main_reception',
  position: [0, 0, HOTEL_ARCH.totalDepth / 2 + 6] as [number, number, number],
  size: [16, 4.4, 8] as [number, number, number],
}

export const HOTEL_ELEVATOR_SHAFT = {
  id: 'hotel_main_elevator_shaft',
  position: [HOTEL_ARCH.totalWidth / 2 - 4, 0, 0] as [number, number, number],
  size: [3, HOTEL_ARCH.floorHeight * HOTEL_ARCH.floors + 1.5, 3] as [number, number, number],
}

export const HOTEL_FLOORS: FloorBase[] = Array.from({ length: HOTEL_ARCH.floors }, (_, level) => ({
  id: `hotel_main_f${level}`,
  buildingId: 'hotel_main',
  level,
  roomCount: HOTEL_ARCH.roomsPerFloor,
  architectural: {
    height: HOTEL_ARCH.floorHeight,
    corridorWidth: HOTEL_ARCH.corridorWidth,
  },
  decorative: {
    floorColor: level === 0 ? '#d4c8b0' : '#b8afa3',
    trimColor: level === 0 ? '#f59e0b' : '#8b5cf6',
  },
}))

function roomNumberFor(level: number, index: number): number {
  return (level + 1) * 100 + index + 1
}

export function generateHotelRooms(): RoomBase[] {
  const rooms: RoomBase[] = []

  for (const floor of HOTEL_FLOORS) {
    for (let i = 0; i < HOTEL_ARCH.roomsPerFloor; i++) {
      const number = roomNumberFor(floor.level, i)
      const side = i < HOTEL_ARCH.roomsPerSide ? 'left' : 'right'
      rooms.push({
        id: `${floor.id}_r${number}` as RoomId,
        floorId: floor.id,
        buildingId: 'hotel_main',
        number,
        side,
        architectural: {
          roomWidth: HOTEL_ARCH.roomWidth,
          roomDepth: HOTEL_ARCH.roomDepth,
          height: HOTEL_ARCH.floorHeight,
        },
        hasSafe: true,
        decorative: {
          wallColor: side === 'left' ? '#362b25' : '#2b2f3a',
          floorColor: '#c8c0b4',
          trimColor: floor.level === 2 ? '#f59e0b' : '#8b5cf6',
        },
      })
    }
  }

  return rooms
}

export const HOTEL_ROOMS: RoomBase[] = generateHotelRooms()

export function generateHotelDoorsAndLocks(): { doors: DoorBase[]; locks: LockBase[] } {
  const doors: DoorBase[] = []
  const locks: LockBase[] = []

  for (const room of HOTEL_ROOMS) {
    const doorId = `${room.id}_dmain` as DoorBase['id']
    const lockId = `${doorId}_lmain` as LockBase['id']
    const isLeft = room.side === 'left'

    doors.push({
      id: doorId,
      roomId: room.id,
      buildingId: 'hotel_main',
      architectural: {
        doorWidth: HOTEL_ARCH.doorWidth,
        doorHeight: HOTEL_ARCH.doorHeight,
      },
      position: [0, 0, 0],
      rotationY: isLeft ? Math.PI / 2 : -Math.PI / 2,
      lockId,
      decorative: {
        trimColor: room.side === 'left' ? '#22c55e' : '#38bdf8',
      },
    })

    locks.push({
      id: lockId,
      doorId,
      buildingId: 'hotel_main',
      type: 'connected',
      simulatorOnly: true,
    })
  }

  return { doors, locks }
}

export const { doors: HOTEL_DOORS, locks: HOTEL_LOCKS } = generateHotelDoorsAndLocks()

export const HOTEL_SECURITY_DEFAULTS = {
  defaultPin: '2026',
  defaultCardUid: 'EW-GUEST-2026',
  masterCardUid: 'EW-MASTER-0001',
  lockoutMs: 15_000,
  autoRelockMs: 8_000,
} as const

export function getHotelRoomById(id: string): RoomBase | undefined {
  return HOTEL_ROOMS.find((room) => room.id === id)
}

export function getHotelDoorByRoomId(roomId: string): DoorBase | undefined {
  return HOTEL_DOORS.find((door) => door.roomId === roomId)
}

export function getHotelLockByDoorId(doorId: string): LockBase | undefined {
  return HOTEL_LOCKS.find((lock) => lock.doorId === doorId)
}

export function getHotelFloorByLevel(level: number): FloorBase | undefined {
  return HOTEL_FLOORS.find((floor) => floor.level === level)
}

export const TOTAL_HOTEL_ROOMS = HOTEL_ROOMS.length

export const HotelRegistry = {
  building: HOTEL_BUILDING,
  floors: HOTEL_FLOORS,
  rooms: HOTEL_ROOMS,
  doors: HOTEL_DOORS,
  locks: HOTEL_LOCKS,
  security: HOTEL_SECURITY_DEFAULTS,
  getRoomById: getHotelRoomById,
  getDoorByRoomId: getHotelDoorByRoomId,
  getLockByDoorId: getHotelLockByDoorId,
  getFloorByLevel: getHotelFloorByLevel,
  toFirebaseSeed: () => ({
    building: HOTEL_BUILDING,
    floors: HOTEL_FLOORS,
    rooms: HOTEL_ROOMS,
    doors: HOTEL_DOORS,
    locks: HOTEL_LOCKS,
    security: HOTEL_SECURITY_DEFAULTS,
    generatedAt: new Date().toISOString(),
  }),
}
