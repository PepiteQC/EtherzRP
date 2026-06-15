/**
 * src/buildings/hotel/core/HotelRegistry.ts
 * Registre stable de l'hôtel EtherWorld.
 *
 * - 3 étages
 * - 10 chambres par étage = 30 chambres
 * - IDs stables compatibles Firestore / userData Three.js
 * - Chambres, portes, locks et positions générées de manière déterministe
 * - Aucun NIP / carte / clé lisible stocké ici
 * - Pure registry only: aucun write Firebase dans ce fichier
 */

import type {
  BuildingBase,
  DoorBase,
  FloorBase,
  LockBase,
  RoomBase,
  RoomId,
} from '../../shared/types'

export const HOTEL_REGISTRY_VERSION = 'hotel_registry_v1' as const

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

export const HOTEL_STABLE_ID_REGEX = /^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/

export function isHotelStableId(id: string): boolean {
  return HOTEL_STABLE_ID_REGEX.test(id)
}

export function assertHotelStableId<T extends string>(id: T, label = 'id'): T {
  if (!isHotelStableId(id)) {
    throw new Error(
      `[HotelRegistry] Invalid ${label}: "${id}". Use stable lowercase IDs only. No slash, no spaces, max 64 chars.`
    )
  }

  return id
}

export const HOTEL_BUILDING: BuildingBase = {
  id: assertHotelStableId('hotel_main'),
  name: 'Hôtel EtherWorld — Accès Sécurisé',
  origin: [-72, 0, 872],
  architectural: {
    width: HOTEL_ARCH.totalWidth,
    depth: HOTEL_ARCH.totalDepth,
    height: HOTEL_ARCH.floorHeight * HOTEL_ARCH.floors,
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
  id: assertHotelStableId('hotel_main_reception'),
  position: [0, 0, HOTEL_ARCH.totalDepth / 2 + 6] as [number, number, number],
  size: [16, 4.4, 8] as [number, number, number],
}

export const HOTEL_ELEVATOR_SHAFT = {
  id: assertHotelStableId('hotel_main_elevator_shaft'),
  position: [HOTEL_ARCH.totalWidth / 2 - 4, 0, 0] as [number, number, number],
  size: [3, HOTEL_ARCH.floorHeight * HOTEL_ARCH.floors + 1.5, 3] as [
    number,
    number,
    number,
  ],
}

export const HOTEL_FLOORS: FloorBase[] = Array.from(
  { length: HOTEL_ARCH.floors },
  (_, level) => ({
    id: assertHotelStableId(`hotel_main_f${level}`),
    buildingId: HOTEL_BUILDING.id,
    level,
    roomCount: HOTEL_ARCH.roomsPerFloor,
    architectural: {
      height: HOTEL_ARCH.floorHeight,
      corridorWidth: HOTEL_ARCH.corridorWidth,
    },
    decorative: {
      floorColor: level === 0 ? '#d4c8b0' : '#b8afa3',
      trimColor: level === HOTEL_ARCH.floors - 1 ? '#f59e0b' : '#8b5cf6',
    },
  })
)

function roomNumberFor(level: number, index: number): number {
  return (level + 1) * 100 + index + 1
}

function getRoomColumnIndex(index: number): number {
  return index % HOTEL_ARCH.roomsPerSide
}

function getRoomSide(index: number): RoomBase['side'] {
  return index < HOTEL_ARCH.roomsPerSide ? 'left' : 'right'
}

function getRoomX(columnIndex: number): number {
  const totalRoomLineWidth = HOTEL_ARCH.roomWidth * HOTEL_ARCH.roomsPerSide
  const startX = -totalRoomLineWidth / 2 + HOTEL_ARCH.roomWidth / 2

  return startX + columnIndex * HOTEL_ARCH.roomWidth
}

function getRoomZ(side: RoomBase['side']): number {
  const corridorHalf = HOTEL_ARCH.corridorWidth / 2
  const roomHalf = HOTEL_ARCH.roomDepth / 2

  return side === 'left'
    ? -(corridorHalf + roomHalf)
    : corridorHalf + roomHalf
}

function getDoorZ(side: RoomBase['side']): number {
  const corridorHalf = HOTEL_ARCH.corridorWidth / 2
  const wallHalf = HOTEL_ARCH.wallThickness / 2

  return side === 'left'
    ? -(corridorHalf + wallHalf)
    : corridorHalf + wallHalf
}

function getFloorY(level: number): number {
  return level * HOTEL_ARCH.floorHeight
}

export function getHotelRoomLayoutByIndex(level: number, index: number) {
  const side = getRoomSide(index)
  const columnIndex = getRoomColumnIndex(index)

  const x = getRoomX(columnIndex)
  const y = getFloorY(level)
  const z = getRoomZ(side)

  const doorPosition: [number, number, number] = [x, y, getDoorZ(side)]
  const roomCenter: [number, number, number] = [x, y, z]

  return {
    level,
    index,
    side,
    columnIndex,
    roomCenter,
    doorPosition,
    doorRotationY: side === 'left' ? Math.PI / 2 : -Math.PI / 2,
  }
}

export function generateHotelRooms(): RoomBase[] {
  const rooms: RoomBase[] = []

  for (const floor of HOTEL_FLOORS) {
    for (let i = 0; i < HOTEL_ARCH.roomsPerFloor; i++) {
      const number = roomNumberFor(floor.level, i)
      const layout = getHotelRoomLayoutByIndex(floor.level, i)

      rooms.push({
        id: assertHotelStableId(`${floor.id}_r${number}`) as RoomId,
        floorId: floor.id,
        buildingId: HOTEL_BUILDING.id,
        number,
        side: layout.side,
        architectural: {
          roomWidth: HOTEL_ARCH.roomWidth,
          roomDepth: HOTEL_ARCH.roomDepth,
          height: HOTEL_ARCH.floorHeight,
        },
        hasSafe: true,
        decorative: {
          wallColor: layout.side === 'left' ? '#362b25' : '#2b2f3a',
          floorColor: '#c8c0b4',
          trimColor: floor.level === HOTEL_ARCH.floors - 1 ? '#f59e0b' : '#8b5cf6',
        },
      })
    }
  }

  return rooms
}

export const HOTEL_ROOMS: RoomBase[] = generateHotelRooms()

function getRoomIndexFromNumber(roomNumber: number): number {
  return (roomNumber % 100) - 1
}

export function getHotelRoomLayout(room: RoomBase) {
  const index = getRoomIndexFromNumber(room.number)
  const level = Math.floor(room.number / 100) - 1

  return getHotelRoomLayoutByIndex(level, index)
}

export function generateHotelDoorsAndLocks(): {
  doors: DoorBase[]
  locks: LockBase[]
} {
  const doors: DoorBase[] = []
  const locks: LockBase[] = []

  for (const room of HOTEL_ROOMS) {
    const layout = getHotelRoomLayout(room)

    const doorId = assertHotelStableId(`${room.id}_dmain`) as DoorBase['id']
    const lockId = assertHotelStableId(`${doorId}_lmain`) as LockBase['id']

    doors.push({
      id: doorId,
      roomId: room.id,
      buildingId: HOTEL_BUILDING.id,
      architectural: {
        doorWidth: HOTEL_ARCH.doorWidth,
        doorHeight: HOTEL_ARCH.doorHeight,
      },
      position: layout.doorPosition,
      rotationY: layout.doorRotationY,
      lockId,
      decorative: {
        trimColor: room.side === 'left' ? '#22c55e' : '#38bdf8',
      },
    })

    locks.push({
      id: lockId,
      doorId,
      buildingId: HOTEL_BUILDING.id,
      type: 'connected',
      simulatorOnly: true,
    })
  }

  return { doors, locks }
}

export const { doors: HOTEL_DOORS, locks: HOTEL_LOCKS } =
  generateHotelDoorsAndLocks()

/**
 * Sécurité:
 * Ne jamais remettre defaultPin/defaultCardUid/masterCardUid ici.
 * Les vrais credentials doivent être créés côté serveur, hashés, salés,
 * versionnés, et jamais exposés au client.
 */
export const HOTEL_SECURITY_DEFAULTS = {
  credentialMode: 'server_hash_only',
  pinPolicy: 'hash_only_no_plaintext',
  cardPolicy: 'hash_only_no_plaintext',
  lockoutMs: 15_000,
  autoRelockMs: 8_000,
  maxFailedAttempts: 5,
  auditEveryAttempt: true,
  appendOnlyEvents: true,
} as const

export const HOTEL_ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  LOCKED: 'locked',
  ARCHIVED: 'archived',
} as const

export const HOTEL_LOCK_STATUS = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  JAMMED: 'jammed',
  LOCKOUT: 'lockout',
  OFFLINE: 'offline',
  ARCHIVED: 'archived',
} as const

const HOTEL_ROOMS_BY_ID = new Map<RoomBase['id'], RoomBase>(
  HOTEL_ROOMS.map((room) => [room.id, room])
)

const HOTEL_ROOMS_BY_NUMBER = new Map<number, RoomBase>(
  HOTEL_ROOMS.map((room) => [room.number, room])
)

const HOTEL_DOORS_BY_ID = new Map<DoorBase['id'], DoorBase>(
  HOTEL_DOORS.map((door) => [door.id, door])
)

const HOTEL_DOORS_BY_ROOM_ID = new Map<RoomBase['id'], DoorBase>(
  HOTEL_DOORS.map((door) => [door.roomId, door])
)

const HOTEL_LOCKS_BY_ID = new Map<LockBase['id'], LockBase>(
  HOTEL_LOCKS.map((lock) => [lock.id, lock])
)

const HOTEL_LOCKS_BY_DOOR_ID = new Map<DoorBase['id'], LockBase>(
  HOTEL_LOCKS.map((lock) => [lock.doorId, lock])
)

const HOTEL_FLOORS_BY_LEVEL = new Map<number, FloorBase>(
  HOTEL_FLOORS.map((floor) => [floor.level, floor])
)

export function getHotelRoomById(id: string): RoomBase | undefined {
  return HOTEL_ROOMS_BY_ID.get(id as RoomBase['id'])
}

export function getHotelRoomByNumber(number: number): RoomBase | undefined {
  return HOTEL_ROOMS_BY_NUMBER.get(number)
}

export function getHotelDoorById(id: string): DoorBase | undefined {
  return HOTEL_DOORS_BY_ID.get(id as DoorBase['id'])
}

export function getHotelDoorByRoomId(roomId: string): DoorBase | undefined {
  return HOTEL_DOORS_BY_ROOM_ID.get(roomId as RoomBase['id'])
}

export function getHotelLockById(id: string): LockBase | undefined {
  return HOTEL_LOCKS_BY_ID.get(id as LockBase['id'])
}

export function getHotelLockByDoorId(doorId: string): LockBase | undefined {
  return HOTEL_LOCKS_BY_DOOR_ID.get(doorId as DoorBase['id'])
}

export function getHotelFloorByLevel(level: number): FloorBase | undefined {
  return HOTEL_FLOORS_BY_LEVEL.get(level)
}

export function getHotelDoorsByFloorLevel(level: number): DoorBase[] {
  return HOTEL_DOORS.filter((door) => {
    const room = getHotelRoomById(String(door.roomId))
    return room ? Math.floor(room.number / 100) - 1 === level : false
  })
}

export function getHotelRoomsByFloorLevel(level: number): RoomBase[] {
  return HOTEL_ROOMS.filter((room) => Math.floor(room.number / 100) - 1 === level)
}

export function getHotelRoomsBySide(side: RoomBase['side']): RoomBase[] {
  return HOTEL_ROOMS.filter((room) => room.side === side)
}

export const TOTAL_HOTEL_ROOMS = HOTEL_ROOMS.length
export const TOTAL_HOTEL_DOORS = HOTEL_DOORS.length
export const TOTAL_HOTEL_LOCKS = HOTEL_LOCKS.length

export function validateHotelRegistry(): string[] {
  const errors: string[] = []

  const expectedRooms = HOTEL_ARCH.floors * HOTEL_ARCH.roomsPerFloor

  if (TOTAL_HOTEL_ROOMS !== expectedRooms) {
    errors.push(
      `Expected ${expectedRooms} hotel rooms, got ${TOTAL_HOTEL_ROOMS}.`
    )
  }

  if (TOTAL_HOTEL_DOORS !== TOTAL_HOTEL_ROOMS) {
    errors.push(
      `Expected ${TOTAL_HOTEL_ROOMS} hotel doors, got ${TOTAL_HOTEL_DOORS}.`
    )
  }

  if (TOTAL_HOTEL_LOCKS !== TOTAL_HOTEL_DOORS) {
    errors.push(
      `Expected ${TOTAL_HOTEL_DOORS} hotel locks, got ${TOTAL_HOTEL_LOCKS}.`
    )
  }

  const allIds = [
    HOTEL_BUILDING.id,
    HOTEL_RECEPTION.id,
    HOTEL_ELEVATOR_SHAFT.id,
    ...HOTEL_FLOORS.map((floor) => floor.id),
    ...HOTEL_ROOMS.map((room) => room.id),
    ...HOTEL_DOORS.map((door) => door.id),
    ...HOTEL_LOCKS.map((lock) => lock.id),
  ]

  const seen = new Set<string>()

  for (const id of allIds) {
    if (!isHotelStableId(String(id))) {
      errors.push(`Invalid stable id: ${String(id)}`)
    }

    if (seen.has(String(id))) {
      errors.push(`Duplicate stable id: ${String(id)}`)
    }

    seen.add(String(id))
  }

  for (const room of HOTEL_ROOMS) {
    const door = getHotelDoorByRoomId(String(room.id))

    if (!door) {
      errors.push(`Missing door for room ${String(room.id)}.`)
      continue
    }

    const lock = getHotelLockByDoorId(String(door.id))

    if (!lock) {
      errors.push(`Missing lock for door ${String(door.id)}.`)
    }
  }

  for (const door of HOTEL_DOORS) {
    const [x, y, z] = door.position

    if (![x, y, z].every(Number.isFinite)) {
      errors.push(`Door ${String(door.id)} has invalid position.`)
    }
  }

  return errors
}

export function assertValidHotelRegistry(): void {
  const errors = validateHotelRegistry()

  if (errors.length > 0) {
    throw new Error(`[HotelRegistry] Invalid registry:\n- ${errors.join('\n- ')}`)
  }
}

assertValidHotelRegistry()

export const HotelRegistry = {
  version: HOTEL_REGISTRY_VERSION,

  building: HOTEL_BUILDING,
  floors: HOTEL_FLOORS,
  rooms: HOTEL_ROOMS,
  doors: HOTEL_DOORS,
  locks: HOTEL_LOCKS,

  reception: HOTEL_RECEPTION,
  elevatorShaft: HOTEL_ELEVATOR_SHAFT,

  security: HOTEL_SECURITY_DEFAULTS,
  roomStatus: HOTEL_ROOM_STATUS,
  lockStatus: HOTEL_LOCK_STATUS,

  totals: {
    rooms: TOTAL_HOTEL_ROOMS,
    doors: TOTAL_HOTEL_DOORS,
    locks: TOTAL_HOTEL_LOCKS,
    floors: HOTEL_ARCH.floors,
  },

  getRoomById: getHotelRoomById,
  getRoomByNumber: getHotelRoomByNumber,
  getDoorById: getHotelDoorById,
  getDoorByRoomId: getHotelDoorByRoomId,
  getLockById: getHotelLockById,
  getLockByDoorId: getHotelLockByDoorId,
  getFloorByLevel: getHotelFloorByLevel,
  getRoomsByFloorLevel: getHotelRoomsByFloorLevel,
  getRoomsBySide: getHotelRoomsBySide,
  getDoorsByFloorLevel: getHotelDoorsByFloorLevel,
  getRoomLayout: getHotelRoomLayout,

  validate: validateHotelRegistry,
  assertValid: assertValidHotelRegistry,

  toFirebaseSeed: () => ({
    version: HOTEL_REGISTRY_VERSION,
    building: HOTEL_BUILDING,
    floors: HOTEL_FLOORS,
    rooms: HOTEL_ROOMS,
    doors: HOTEL_DOORS,
    locks: HOTEL_LOCKS,
    security: HOTEL_SECURITY_DEFAULTS,
    generatedBy: 'etherworld_registry',
  }),
} as const