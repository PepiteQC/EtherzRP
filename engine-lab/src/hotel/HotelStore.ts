import { create } from 'zustand'

export type CardLevel = 'none' | 'guest' | 'resident' | 'vip' | 'admin'

export const CARD_HIERARCHY: Record<CardLevel, number> = {
  none: 0,
  guest: 1,
  resident: 2,
  vip: 3,
  admin: 4,
}

export const CARD_COLORS: Record<CardLevel, string> = {
  none: '#666666',
  guest: '#6b7280',
  resident: '#3b82f6',
  vip: '#f59e0b',
  admin: '#ef4444',
}

export interface HotelDoor {
  id: string
  roomNumber: string
  floor: number
  isLocked: boolean
  isOpen: boolean
  requiredLevel: CardLevel
  accessCode: string
  failedAttempts: number
  alarmTriggered: boolean
  lastAccess: number
}

export interface HotelRoom {
  id: string
  number: string
  floor: number
  side: 'left' | 'right'
  isOccupied: boolean
  lightOn: boolean
  tvOn: boolean
  doorId: string
}

export interface ElevatorState {
  currentFloor: number
  targetFloor: number
  isMoving: boolean
  doorsOpen: boolean
}

export interface SecurityLog {
  id: string
  time: number
  doorId: string
  event:
    | 'access_granted'
    | 'access_denied'
    | 'alarm'
    | 'code_entered'
    | 'door_forced'
  details: string
}

export interface PlayerCard {
  id: string
  level: CardLevel
  ownerName: string
  allowedRooms: string[]
  expiresAt: number
  isActive: boolean
}

interface HotelState {
  floors: number
  roomsPerFloor: number
  rooms: HotelRoom[]
  doors: Record<string, HotelDoor>
  elevator: ElevatorState
  playerCard: PlayerCard
  playerFloor: number
  securityLogs: SecurityLog[]
  masterAlarm: boolean
  alarmSilenceUntil: number
  lobbyLightsOn: boolean
  receptionBellRung: boolean

  tryAccessDoor: (doorId: string) => {
    success: boolean
    message: string
  }

  tryCodeAccess: (
    doorId: string,
    code: string
  ) => {
    success: boolean
    message: string
  }

  forceOpenDoor: (doorId: string) => void
  lockDoor: (doorId: string) => void
  toggleRoomLight: (roomId: string) => void
  toggleRoomTV: (roomId: string) => void
  callElevator: (floor: number) => void
  moveElevator: (floor: number) => void
  toggleElevatorDoors: () => void
  triggerAlarm: (doorId: string, details: string) => void
  silenceAlarm: (duration: number) => void
  resetAlarm: () => void

  addSecurityLog: (
    doorId: string,
    event: SecurityLog['event'],
    details: string
  ) => void

  ringBell: () => void
}

const uid = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const now = () => Date.now()

function generateRooms() {
  const rooms: HotelRoom[] = []
  const doors: Record<string, HotelDoor> = {}

  for (let i = 0; i < 10; i += 1) {
    const number = `1${String(i + 1).padStart(2, '0')}`
    const doorId = `door-${number}`
    const isPlayerRoom = number === '104'

    rooms.push({
      id: `room-${number}`,
      number,
      floor: 1,
      side: i < 5 ? 'left' : 'right',
      isOccupied: isPlayerRoom || i % 3 !== 0,
      lightOn: isPlayerRoom || i % 2 === 0,
      tvOn: i % 4 === 0,
      doorId,
    })

    doors[doorId] = {
      id: doorId,
      roomNumber: number,
      floor: 1,
      isLocked: !isPlayerRoom,
      isOpen: false,
      requiredLevel: 'resident',
      accessCode: isPlayerRoom ? '1042' : `${1101 + i}`,
      failedAttempts: 0,
      alarmTriggered: false,
      lastAccess: 0,
    }
  }

  return { rooms, doors }
}

const initial = generateRooms()

export const useHotelStore = create<HotelState>((set, get) => ({
  floors: 1,
  roomsPerFloor: 10,
  rooms: initial.rooms,
  doors: initial.doors,

  elevator: {
    currentFloor: 0,
    targetFloor: 0,
    isMoving: false,
    doorsOpen: true,
  },

  playerCard: {
    id: 'card-player',
    level: 'resident',
    ownerName: 'Joueur',
    allowedRooms: ['104'],
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    isActive: true,
  },

  playerFloor: 0,
  securityLogs: [],
  masterAlarm: false,
  alarmSilenceUntil: 0,
  lobbyLightsOn: true,
  receptionBellRung: false,

  tryAccessDoor: (doorId) => {
    const state = get()
    const door = state.doors[doorId]

    if (!door) {
      return {
        success: false,
        message: 'Porte introuvable',
      }
    }

    if (!door.isLocked) {
      const isOpen = !door.isOpen

      set({
        doors: {
          ...state.doors,
          [doorId]: {
            ...door,
            isOpen,
            lastAccess: now(),
          },
        },
      })

      state.addSecurityLog(
        doorId,
        'access_granted',
        isOpen ? 'Porte ouverte' : 'Porte fermée'
      )

      return {
        success: true,
        message: isOpen ? 'Porte ouverte' : 'Porte fermée',
      }
    }

    const card = state.playerCard

    if (!card.isActive) {
      return {
        success: false,
        message: 'Carte désactivée',
      }
    }

    if (card.expiresAt < now()) {
      return {
        success: false,
        message: 'Carte expirée',
      }
    }

    if (
      CARD_HIERARCHY[card.level] <
      CARD_HIERARCHY[door.requiredLevel]
    ) {
      const failedAttempts = door.failedAttempts + 1

      set({
        doors: {
          ...state.doors,
          [doorId]: {
            ...door,
            failedAttempts,
          },
        },
      })

      state.addSecurityLog(
        doorId,
        'access_denied',
        `Niveau insuffisant: ${card.level}`
      )

      if (failedAttempts >= 3) {
        state.triggerAlarm(
          doorId,
          `3 tentatives échouées sur ${door.roomNumber}`
        )
      }

      return {
        success: false,
        message: `Accès refusé — niveau ${door.requiredLevel} requis`,
      }
    }

    if (
      card.level === 'resident' &&
      door.requiredLevel === 'resident' &&
      !card.allowedRooms.includes(door.roomNumber)
    ) {
      const failedAttempts = door.failedAttempts + 1

      set({
        doors: {
          ...state.doors,
          [doorId]: {
            ...door,
            failedAttempts,
          },
        },
      })

      state.addSecurityLog(
        doorId,
        'access_denied',
        `Chambre ${door.roomNumber} non autorisée`
      )

      if (failedAttempts >= 3) {
        state.triggerAlarm(
          doorId,
          `3 tentatives échouées sur ${door.roomNumber}`
        )
      }

      return {
        success: false,
        message: `Accès refusé — chambre ${door.roomNumber} non autorisée`,
      }
    }

    set({
      doors: {
        ...state.doors,
        [doorId]: {
          ...door,
          isOpen: true,
          isLocked: false,
          failedAttempts: 0,
          lastAccess: now(),
        },
      },
    })

    state.addSecurityLog(
      doorId,
      'access_granted',
      `Accès carte ${card.level}: ${card.ownerName}`
    )

    return {
      success: true,
      message: 'Accès autorisé ✓',
    }
  },

  tryCodeAccess: (doorId, code) => {
    const state = get()
    const door = state.doors[doorId]

    if (!door) {
      return {
        success: false,
        message: 'Porte introuvable',
      }
    }

    if (code === door.accessCode) {
      set({
        doors: {
          ...state.doors,
          [doorId]: {
            ...door,
            isOpen: true,
            isLocked: false,
            failedAttempts: 0,
            lastAccess: now(),
          },
        },
      })

      state.addSecurityLog(
        doorId,
        'code_entered',
        'Code correct'
      )

      return {
        success: true,
        message: 'Code accepté ✓',
      }
    }

    const failedAttempts = door.failedAttempts + 1

    set({
      doors: {
        ...state.doors,
        [doorId]: {
          ...door,
          failedAttempts,
        },
      },
    })

    state.addSecurityLog(
      doorId,
      'access_denied',
      `Code incorrect (${failedAttempts}/3)`
    )

    if (failedAttempts >= 3) {
      state.triggerAlarm(
        doorId,
        `3 codes incorrects sur ${door.roomNumber}`
      )
    }

    return {
      success: false,
      message: `Code incorrect (${failedAttempts}/3)`,
    }
  },

  forceOpenDoor: (doorId) => {
    const state = get()
    const door = state.doors[doorId]

    if (!door) return

    state.triggerAlarm(
      doorId,
      `Porte forcée: ${door.roomNumber}`
    )

    set({
      doors: {
        ...state.doors,
        [doorId]: {
          ...door,
          isOpen: true,
          isLocked: false,
          lastAccess: now(),
        },
      },
    })
  },

  lockDoor: (doorId) => {
    const state = get()
    const door = state.doors[doorId]

    if (!door) return

    set({
      doors: {
        ...state.doors,
        [doorId]: {
          ...door,
          isOpen: false,
          isLocked: true,
          lastAccess: now(),
        },
      },
    })

    state.addSecurityLog(
      doorId,
      'access_granted',
      'Porte verrouillée'
    )
  },

  toggleRoomLight: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              lightOn: !room.lightOn,
            }
          : room
      ),
    })),

  toggleRoomTV: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              tvOn: !room.tvOn,
            }
          : room
      ),
    })),

  callElevator: (floor) => {
    const state = get()

    if (state.elevator.isMoving) return

    const targetFloor = Math.max(
      0,
      Math.min(1, Math.round(floor))
    )

    set({
      elevator: {
        ...state.elevator,
        targetFloor,
        isMoving: true,
        doorsOpen: false,
      },
    })
  },

  moveElevator: (floor) =>
    set((state) => ({
      elevator: {
        ...state.elevator,
        currentFloor: floor,
      },
    })),

  toggleElevatorDoors: () =>
    set((state) => ({
      elevator: {
        ...state.elevator,
        doorsOpen: !state.elevator.doorsOpen,
      },
    })),

  triggerAlarm: (doorId, details) => {
    const state = get()
    const door = state.doors[doorId]

    state.addSecurityLog(
      doorId,
      'alarm',
      details
    )

    if (!door) {
      set({
        masterAlarm: true,
      })

      return
    }

    set({
      doors: {
        ...state.doors,
        [doorId]: {
          ...door,
          alarmTriggered: true,
        },
      },
      masterAlarm: true,
    })
  },

  silenceAlarm: (duration) =>
    set({
      alarmSilenceUntil: now() + duration,
    }),

  resetAlarm: () => {
    const state = get()

    const doors = Object.fromEntries(
      Object.entries(state.doors).map(
        ([key, door]) => [
          key,
          {
            ...door,
            alarmTriggered: false,
            failedAttempts: 0,
          },
        ]
      )
    )

    set({
      doors,
      masterAlarm: false,
      alarmSilenceUntil: 0,
    })

    state.addSecurityLog(
      'system',
      'alarm',
      'Alarme réinitialisée'
    )
  },

  addSecurityLog: (
    doorId,
    event,
    details
  ) =>
    set((state) => ({
      securityLogs: [
        {
          id: uid(),
          time: now(),
          doorId,
          event,
          details,
        },
        ...state.securityLogs,
      ].slice(0, 50),
    })),

  ringBell: () => {
    set({
      receptionBellRung: true,
    })

    window.setTimeout(
      () =>
        set({
          receptionBellRung: false,
        }),
      2000
    )
  },
}))