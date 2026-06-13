import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ═══════════════════════════════════════════════════════════════
// HOTEL STORE — État centralisé de tout l'hôtel EtherWorld
// ═══════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────
// TYPES — Niveaux d'accès
// ────────────────────────────────────────────────────────────────

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

export const CARD_LABELS: Record<CardLevel, string> = {
  none: 'Aucune',
  guest: 'Invité',
  resident: 'Résident',
  vip: 'VIP',
  admin: 'Administrateur',
}

export const CARD_DESCRIPTIONS: Record<CardLevel, string> = {
  none: 'Aucun accès',
  guest: 'Accès aux zones publiques uniquement',
  resident: 'Accès à votre chambre et zones communes',
  vip: 'Accès premium, zones exclusives et services prioritaires',
  admin: 'Accès total à toutes les zones et systèmes',
}

// ────────────────────────────────────────────────────────────────
// TYPES — Porte
// ────────────────────────────────────────────────────────────────

export type DoorType = 'room' | 'lobby' | 'staff' | 'service' | 'emergency' | 'elevator' | 'exterior'

export interface HotelDoor {
  id: string
  roomNumber: string
  floor: number
  type: DoorType
  isLocked: boolean
  isOpen: boolean
  requiredLevel: CardLevel
  accessCode: string
  failedAttempts: number
  alarmTriggered: boolean
  lastAccess: number
  autoCloseDelay: number // ms — 0 = pas de fermeture auto
  isEmergencyExit: boolean
  label: string
}

// ────────────────────────────────────────────────────────────────
// TYPES — Chambre
// ────────────────────────────────────────────────────────────────

export type RoomType = 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'service'

export interface HotelRoom {
  id: string
  number: string
  floor: number
  side: 'left' | 'right'
  type: RoomType
  isOccupied: boolean
  occupantName: string
  lightOn: boolean
  tvOn: boolean
  curtainsOpen: boolean
  bathroomLightOn: boolean
  doNotDisturb: boolean
  cleaningRequested: boolean
  temperature: number // °C
  doorId: string
  rentPerNight: number
  checkInDate: number
  checkOutDate: number
}

// ────────────────────────────────────────────────────────────────
// TYPES — Ascenseur
// ────────────────────────────────────────────────────────────────

export interface ElevatorState {
  currentFloor: number
  targetFloor: number
  isMoving: boolean
  doorsOpen: boolean
  direction: 'up' | 'down' | 'idle'
  queue: number[] // files de demandes
  isEmergencyStopped: boolean
  weight: number // kg — max 800
  maxWeight: number
  lastMoveTime: number
}

// ────────────────────────────────────────────────────────────────
// TYPES — Sécurité
// ────────────────────────────────────────────────────────────────

export type SecurityEvent =
  | 'access_granted'
  | 'access_denied'
  | 'alarm'
  | 'code_entered'
  | 'code_failed'
  | 'door_forced'
  | 'door_locked'
  | 'door_unlocked'
  | 'card_expired'
  | 'card_disabled'
  | 'elevator_call'
  | 'elevator_emergency'
  | 'fire_alarm'
  | 'intrusion'
  | 'system_reset'
  | 'bell_ring'
  | 'room_service'
  | 'maintenance'

export interface SecurityLog {
  id: string
  time: number
  doorId: string
  event: SecurityEvent
  details: string
  severity: 'info' | 'warning' | 'critical'
  actorName: string
  floor: number
}

// ────────────────────────────────────────────────────────────────
// TYPES — Carte du joueur
// ────────────────────────────────────────────────────────────────

export interface PlayerCard {
  id: string
  level: CardLevel
  ownerName: string
  allowedRooms: string[]
  expiresAt: number
  isActive: boolean
  isLost: boolean
  pin: string // code PIN 4 chiffres
  lastUsed: number
  usageCount: number
}

// ────────────────────────────────────────────────────────────────
// TYPES — Lobby / Services
// ────────────────────────────────────────────────────────────────

export interface LobbyState {
  lightsOn: boolean
  musicPlaying: boolean
  musicVolume: number // 0-1
  fountainOn: boolean
  receptionBellRung: boolean
  receptionistPresent: boolean
  guestCount: number
  fireAlarmActive: boolean
  emergencyLightsOn: boolean
  hvacMode: 'heating' | 'cooling' | 'auto' | 'off'
  currentTemperature: number
  targetTemperature: number
}

// ────────────────────────────────────────────────────────────────
// TYPES — Room Service
// ────────────────────────────────────────────────────────────────

export type ServiceType = 'cleaning' | 'room_service' | 'maintenance' | 'laundry' | 'wake_up' | 'taxi'

export interface ServiceRequest {
  id: string
  type: ServiceType
  roomNumber: string
  requestTime: number
  estimatedTime: number // minutes
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  details: string
  cost: number
}

// ────────────────────────────────────────────────────────────────
// TYPES — Notifications
// ────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface HotelNotification {
  id: string
  message: string
  type: NotificationType
  time: number
  duration: number // ms
  read: boolean
  icon?: string
}

// ────────────────────────────────────────────────────────────────
// STORE PRINCIPAL
// ────────────────────────────────────────────────────────────────

interface HotelState {
  // Configuration
  hotelName: string
  floors: number
  roomsPerFloor: number
  playerRoomNumber: string

  // Données
  rooms: HotelRoom[]
  doors: Record<string, HotelDoor>
  elevator: ElevatorState
  playerCard: PlayerCard
  playerFloor: number
  playerPosition: [number, number, number]

  // Sécurité
  securityLogs: SecurityLog[]
  masterAlarm: boolean
  alarmSilenceUntil: number
  lockdownActive: boolean
  lockdownReason: string

  // Lobby / Services
  lobby: LobbyState
  serviceRequests: ServiceRequest[]
  notifications: HotelNotification[]

  // Statistiques
  totalAccessAttempts: number
  totalSuccessfulAccess: number
  totalDeniedAccess: number
  totalAlarms: number

  // ── Actions — Portes ──
  tryAccessDoor: (doorId: string) => { success: boolean; message: string; level?: CardLevel }
  tryCodeAccess: (doorId: string, code: string) => { success: boolean; message: string }
  tryPinAccess: (doorId: string, pin: string) => { success: boolean; message: string }
  forceOpenDoor: (doorId: string) => void
  lockDoor: (doorId: string) => void
  unlockDoor: (doorId: string) => void
  toggleDoor: (doorId: string) => void
  setDoorAutoClose: (doorId: string, delay: number) => void

  // ── Actions — Chambres ──
  toggleRoomLight: (roomId: string) => void
  toggleRoomTV: (roomId: string) => void
  toggleRoomCurtains: (roomId: string) => void
  toggleBathroomLight: (roomId: string) => void
  setDoNotDisturb: (roomId: string, value: boolean) => void
  requestCleaning: (roomId: string) => void
  setRoomTemperature: (roomId: string, temp: number) => void
  checkIn: (roomNumber: string, guestName: string, nights: number) => void
  checkOut: (roomNumber: string) => void

  // ── Actions — Ascenseur ──
  callElevator: (floor: number) => void
  moveElevator: (floor: number) => void
  toggleElevatorDoors: () => void
  emergencyStopElevator: () => void
  resetElevator: () => void
  processElevatorQueue: () => void

  // ── Actions — Sécurité ──
  triggerAlarm: (doorId: string, details: string, severity?: SecurityLog['severity']) => void
  silenceAlarm: (duration: number) => void
  resetAlarm: () => void
  activateLockdown: (reason: string) => void
  deactivateLockdown: () => void
  triggerFireAlarm: () => void
  resetFireAlarm: () => void
  addSecurityLog: (doorId: string, event: SecurityEvent, details: string, severity?: SecurityLog['severity']) => void
  clearSecurityLogs: () => void

  // ── Actions — Lobby ──
  ringBell: () => void
  toggleLobbyMusic: () => void
  setLobbyMusicVolume: (volume: number) => void
  toggleFountain: () => void
  setHVACMode: (mode: LobbyState['hvacMode']) => void
  setTargetTemperature: (temp: number) => void

  // ── Actions — Services ──
  requestService: (type: ServiceType, roomNumber: string, details?: string) => void
  cancelService: (requestId: string) => void
  completeService: (requestId: string) => void

  // ── Actions — Carte ──
  upgradeCard: (newLevel: CardLevel) => void
  deactivateCard: () => void
  reactivateCard: () => void
  reportLostCard: () => void
  replaceCard: () => void
  changePin: (newPin: string) => void
  addAllowedRoom: (roomNumber: string) => void
  removeAllowedRoom: (roomNumber: string) => void

  // ── Actions — Notifications ──
  addNotification: (message: string, type?: NotificationType, icon?: string, duration?: number) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void

  // ── Getters ──
  getDoorById: (doorId: string) => HotelDoor | undefined
  getRoomByNumber: (number: string) => HotelRoom | undefined
  getRoomsByFloor: (floor: number) => HotelRoom[]
  getOccupiedRooms: () => HotelRoom[]
  getAvailableRooms: () => HotelRoom[]
  getActiveAlarms: () => HotelDoor[]
  getRecentLogs: (count?: number) => SecurityLog[]
  getPendingServices: () => ServiceRequest[]
  getUnreadNotifications: () => HotelNotification[]
  isPlayerRoom: (doorId: string) => boolean
  canAccess: (doorId: string) => boolean
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now(): number {
  return Date.now()
}

const ROOM_TYPES: RoomType[] = ['standard', 'standard', 'standard', 'deluxe', 'deluxe', 'suite', 'standard', 'standard', 'deluxe', 'standard']
const ROOM_PRICES: Record<RoomType, number> = { standard: 120, deluxe: 220, suite: 450, penthouse: 1200, service: 0 }
const GUEST_NAMES = ['Jean Tremblay', 'Marie Bouchard', 'Pierre Gagnon', 'Sophie Roy', 'Luc Côté', 'Isabelle Morin', 'André Lavoie', 'Nathalie Fortin', 'Martin Gauthier', 'Julie Ouellet', 'Yves Pelletier', 'Chantal Bergeron', 'Denis Simard', 'Sylvie Thibault', 'Alain Girard']
const AUTO_CLOSE_DEFAULT = 8000 // 8 secondes

// ────────────────────────────────────────────────────────────────
// GÉNÉRATION DES CHAMBRES
// ────────────────────────────────────────────────────────────────

function generateRooms(floors: number, perFloor: number, playerRoom: string): {
  rooms: HotelRoom[]
  doors: Record<string, HotelDoor>
} {
  const rooms: HotelRoom[] = []
  const doors: Record<string, HotelDoor> = {}

  // Seed déterministe
  const seeded = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280
    return x - Math.floor(x)
  }

  for (let f = 1; f <= floors; f++) {
    for (let i = 0; i < perFloor; i++) {
      const num = `${f}${String(i + 1).padStart(2, '0')}`
      const doorId = `door-${num}`
      const isPlayer = num === playerRoom
      const seed = f * 100 + i
      const roomType = f === floors && i >= perFloor - 2 ? 'suite' : ROOM_TYPES[i % ROOM_TYPES.length]
      const isOccupied = isPlayer || seeded(seed + 1) > 0.35
      const guestName = isPlayer ? 'Joueur' : GUEST_NAMES[Math.floor(seeded(seed + 2) * GUEST_NAMES.length)]

      const checkInDays = Math.floor(seeded(seed + 10) * 5)
      const stayDays = 1 + Math.floor(seeded(seed + 11) * 7)

      rooms.push({
        id: `room-${num}`,
        number: num,
        floor: f,
        side: i % 2 === 0 ? 'left' : 'right',
        type: roomType,
        isOccupied,
        occupantName: isOccupied ? guestName : '',
        lightOn: isOccupied && seeded(seed + 3) > 0.4,
        tvOn: isOccupied && seeded(seed + 4) > 0.65,
        curtainsOpen: seeded(seed + 5) > 0.3,
        bathroomLightOn: isOccupied && seeded(seed + 6) > 0.8,
        doNotDisturb: isOccupied && seeded(seed + 7) > 0.85,
        cleaningRequested: isOccupied && seeded(seed + 8) > 0.9,
        temperature: 20 + Math.round(seeded(seed + 9) * 4),
        doorId,
        rentPerNight: ROOM_PRICES[roomType],
        checkInDate: isOccupied ? now() - checkInDays * 86400000 : 0,
        checkOutDate: isOccupied ? now() + stayDays * 86400000 : 0,
      })

      doors[doorId] = {
        id: doorId,
        roomNumber: num,
        floor: f,
        type: 'room',
        isLocked: !isPlayer,
        isOpen: false,
        requiredLevel: 'resident',
        accessCode: isPlayer ? '4042' : `${1000 + Math.floor(seeded(seed + 20) * 9000)}`,
        failedAttempts: 0,
        alarmTriggered: false,
        lastAccess: 0,
        autoCloseDelay: AUTO_CLOSE_DEFAULT,
        isEmergencyExit: false,
        label: `Chambre ${num}`,
      }
    }
  }

  // ── PORTES SPÉCIALES ──

  // Entrée principale du lobby
  doors['door-lobby-main'] = {
    id: 'door-lobby-main', roomNumber: 'LOBBY', floor: 0, type: 'lobby',
    isLocked: false, isOpen: true, requiredLevel: 'none', accessCode: '',
    failedAttempts: 0, alarmTriggered: false, lastAccess: now(),
    autoCloseDelay: 0, isEmergencyExit: true, label: 'Entrée Principale',
  }

  // Porte arrière staff
  doors['door-lobby-back'] = {
    id: 'door-lobby-back', roomNumber: 'STAFF', floor: 0, type: 'staff',
    isLocked: true, isOpen: false, requiredLevel: 'admin', accessCode: '9999',
    failedAttempts: 0, alarmTriggered: false, lastAccess: 0,
    autoCloseDelay: 5000, isEmergencyExit: false, label: 'Accès Personnel',
  }

  // Porte de service
  doors['door-service'] = {
    id: 'door-service', roomNumber: 'SERVICE', floor: 0, type: 'service',
    isLocked: true, isOpen: false, requiredLevel: 'vip', accessCode: '7777',
    failedAttempts: 0, alarmTriggered: false, lastAccess: 0,
    autoCloseDelay: 5000, isEmergencyExit: false, label: 'Zone de Service',
  }

  // Sortie d'urgence
  doors['door-emergency'] = {
    id: 'door-emergency', roomNumber: 'URGENCE', floor: 0, type: 'emergency',
    isLocked: false, isOpen: false, requiredLevel: 'none', accessCode: '',
    failedAttempts: 0, alarmTriggered: false, lastAccess: 0,
    autoCloseDelay: 3000, isEmergencyExit: true, label: 'Sortie de Secours',
  }

  // Portes d'ascenseur par étage
  for (let f = 0; f <= floors; f++) {
    doors[`door-elevator-${f}`] = {
      id: `door-elevator-${f}`, roomNumber: `ELEV-${f}`, floor: f, type: 'elevator',
      isLocked: false, isOpen: false, requiredLevel: 'guest', accessCode: '',
      failedAttempts: 0, alarmTriggered: false, lastAccess: 0,
      autoCloseDelay: 4000, isEmergencyExit: false, label: `Ascenseur Étage ${f}`,
    }
  }

  // Porte extérieure parking
  doors['door-parking'] = {
    id: 'door-parking', roomNumber: 'PARKING', floor: 0, type: 'exterior',
    isLocked: false, isOpen: false, requiredLevel: 'none', accessCode: '',
    failedAttempts: 0, alarmTriggered: false, lastAccess: 0,
    autoCloseDelay: 0, isEmergencyExit: true, label: 'Accès Parking',
  }

  return { rooms, doors }
}

// ────────────────────────────────────────────────────────────────
// CRÉATION DU STORE
// ────────────────────────────────────────────────────────────────

const PLAYER_ROOM = '404'
const HOTEL_FLOORS = 4
const ROOMS_PER_FLOOR = 10

const { rooms: initRooms, doors: initDoors } = generateRooms(HOTEL_FLOORS, ROOMS_PER_FLOOR, PLAYER_ROOM)

export const useHotelStore = create<HotelState>()(
  persist(
    (set, get) => ({
      // ── Configuration ──
      hotelName: 'Hôtel EtherWorld',
      floors: HOTEL_FLOORS,
      roomsPerFloor: ROOMS_PER_FLOOR,
      playerRoomNumber: PLAYER_ROOM,

      // ── Données ──
      rooms: initRooms,
      doors: initDoors,

      elevator: {
        currentFloor: 0,
        targetFloor: 0,
        isMoving: false,
        doorsOpen: true,
        direction: 'idle',
        queue: [],
        isEmergencyStopped: false,
        weight: 0,
        maxWeight: 800,
        lastMoveTime: now(),
      },

      playerCard: {
        id: 'card-player-001',
        level: 'resident',
        ownerName: 'Joueur',
        allowedRooms: [PLAYER_ROOM],
        expiresAt: now() + 365 * 24 * 3600000,
        isActive: true,
        isLost: false,
        pin: '1234',
        lastUsed: now(),
        usageCount: 0,
      },

      playerFloor: 0,
      playerPosition: [0, 0, 0],

      // ── Sécurité ──
      securityLogs: [],
      masterAlarm: false,
      alarmSilenceUntil: 0,
      lockdownActive: false,
      lockdownReason: '',

      // ── Lobby ──
      lobby: {
        lightsOn: true,
        musicPlaying: true,
        musicVolume: 0.3,
        fountainOn: true,
        receptionBellRung: false,
        receptionistPresent: true,
        guestCount: 12,
        fireAlarmActive: false,
        emergencyLightsOn: false,
        hvacMode: 'auto',
        currentTemperature: 22,
        targetTemperature: 22,
      },

      serviceRequests: [],
      notifications: [],

      // ── Statistiques ──
      totalAccessAttempts: 0,
      totalSuccessfulAccess: 0,
      totalDeniedAccess: 0,
      totalAlarms: 0,

      // ══════════════════════════════════════════════════════
      // ACTIONS — PORTES
      // ══════════════════════════════════════════════════════

      tryAccessDoor: (doorId) => {
        const state = get()
        const door = state.doors[doorId]
        if (!door) return { success: false, message: 'Porte introuvable' }

        set({ totalAccessAttempts: state.totalAccessAttempts + 1 })

        // Lockdown bloque tout sauf urgence
        if (state.lockdownActive && !door.isEmergencyExit) {
          state.addSecurityLog(doorId, 'access_denied', 'Confinement actif — accès bloqué', 'warning')
          return { success: false, message: '🔒 Confinement actif — accès bloqué' }
        }

        // Porte non verrouillée
        if (!door.isLocked) {
          const newOpen = !door.isOpen
          set({
            doors: { ...state.doors, [doorId]: { ...door, isOpen: newOpen, lastAccess: now() } },
            totalSuccessfulAccess: state.totalSuccessfulAccess + 1,
          })
          state.addSecurityLog(doorId, newOpen ? 'access_granted' : 'door_locked', newOpen ? 'Porte ouverte (non verrouillée)' : 'Porte fermée')

          // Auto-close
          if (newOpen && door.autoCloseDelay > 0) {
            setTimeout(() => {
              const current = get().doors[doorId]
              if (current?.isOpen) {
                set(s => ({ doors: { ...s.doors, [doorId]: { ...current, isOpen: false } } }))
              }
            }, door.autoCloseDelay)
          }

          return { success: true, message: newOpen ? '🚪 Porte ouverte' : '🚪 Porte fermée' }
        }

        // Vérification de la carte
        const card = state.playerCard

        if (card.isLost) {
          state.addSecurityLog(doorId, 'card_disabled', 'Carte signalée perdue', 'warning')
          return { success: false, message: '⚠️ Carte signalée perdue — contactez la réception' }
        }

        if (!card.isActive) {
          state.addSecurityLog(doorId, 'card_disabled', 'Carte désactivée')
          set({ totalDeniedAccess: state.totalDeniedAccess + 1 })
          return { success: false, message: '❌ Carte désactivée' }
        }

        if (card.expiresAt < now()) {
          state.addSecurityLog(doorId, 'card_expired', `Carte expirée depuis ${Math.floor((now() - card.expiresAt) / 86400000)} jours`, 'warning')
          set({ totalDeniedAccess: state.totalDeniedAccess + 1 })
          return { success: false, message: '⏰ Carte expirée — renouvelez à la réception' }
        }

        // Vérification du niveau d'accès
        if (CARD_HIERARCHY[card.level] < CARD_HIERARCHY[door.requiredLevel]) {
          state.addSecurityLog(doorId, 'access_denied', `Niveau insuffisant: ${CARD_LABELS[card.level]} < ${CARD_LABELS[door.requiredLevel]}`)
          const newAttempts = door.failedAttempts + 1

          set({
            doors: { ...state.doors, [doorId]: { ...door, failedAttempts: newAttempts } },
            totalDeniedAccess: state.totalDeniedAccess + 1,
          })

          if (newAttempts >= 3) {
            state.triggerAlarm(doorId, `3 tentatives échouées sur ${door.label}`, 'critical')
          }

          return {
            success: false,
            message: `🔒 Accès refusé — niveau ${CARD_LABELS[door.requiredLevel]} requis`,
            level: door.requiredLevel,
          }
        }

        // Vérification chambre spécifique pour les résidents
        if (card.level === 'resident' && door.type === 'room' && !card.allowedRooms.includes(door.roomNumber)) {
          state.addSecurityLog(doorId, 'access_denied', `Chambre ${door.roomNumber} non autorisée pour ${card.ownerName}`)
          set({ totalDeniedAccess: state.totalDeniedAccess + 1 })
          return { success: false, message: `🔒 Chambre ${door.roomNumber} non autorisée` }
        }

        // ACCÈS ACCORDÉ
        set({
          doors: {
            ...state.doors,
            [doorId]: { ...door, isOpen: true, isLocked: false, failedAttempts: 0, lastAccess: now() },
          },
          playerCard: { ...card, lastUsed: now(), usageCount: card.usageCount + 1 },
          totalSuccessfulAccess: state.totalSuccessfulAccess + 1,
        })

        state.addSecurityLog(doorId, 'access_granted', `Carte ${CARD_LABELS[card.level]}: ${card.ownerName}`)
        state.addNotification(`Accès autorisé — ${door.label}`, 'success', '✓')

        // Auto-close
        if (door.autoCloseDelay > 0) {
          setTimeout(() => {
            const current = get().doors[doorId]
            if (current?.isOpen) {
              set(s => ({
                doors: { ...s.doors, [doorId]: { ...current, isOpen: false, isLocked: true } },
              }))
            }
          }, door.autoCloseDelay)
        }

        return { success: true, message: '✅ Accès autorisé' }
      },

      tryCodeAccess: (doorId, code) => {
        const state = get()
        const door = state.doors[doorId]
        if (!door) return { success: false, message: 'Porte introuvable' }

        set({ totalAccessAttempts: state.totalAccessAttempts + 1 })

        if (code === door.accessCode) {
          set({
            doors: { ...state.doors, [doorId]: { ...door, isOpen: true, isLocked: false, failedAttempts: 0, lastAccess: now() } },
            totalSuccessfulAccess: state.totalSuccessfulAccess + 1,
          })
          state.addSecurityLog(doorId, 'code_entered', 'Code correct')
          state.addNotification(`Code accepté — ${door.label}`, 'success', '🔓')
          return { success: true, message: '✅ Code accepté' }
        }

        const newAttempts = door.failedAttempts + 1
        state.addSecurityLog(doorId, 'code_failed', `Code incorrect (${newAttempts}/3)`, newAttempts >= 3 ? 'critical' : 'warning')

        if (newAttempts >= 3) {
          state.triggerAlarm(doorId, `3 codes incorrects sur ${door.label}`, 'critical')
        }

        set({
          doors: { ...state.doors, [doorId]: { ...door, failedAttempts: newAttempts } },
          totalDeniedAccess: state.totalDeniedAccess + 1,
        })

        return { success: false, message: `❌ Code incorrect (${newAttempts}/3)` }
      },

      tryPinAccess: (doorId, pin) => {
        const state = get()
        if (pin === state.playerCard.pin) {
          return state.tryAccessDoor(doorId)
        }
        state.addSecurityLog(doorId, 'access_denied', 'PIN incorrect', 'warning')
        return { success: false, message: '❌ PIN incorrect' }
      },

      forceOpenDoor: (doorId) => {
        const state = get()
        const door = state.doors[doorId]
        if (!door) return
        state.triggerAlarm(doorId, `Porte forcée: ${door.label}`, 'critical')
        set({ doors: { ...state.doors, [doorId]: { ...door, isOpen: true, isLocked: false, lastAccess: now() } } })
      },

      lockDoor: (doorId) => {
        const state = get()
        const door = state.doors[doorId]
        if (!door) return
        set({ doors: { ...state.doors, [doorId]: { ...door, isOpen: false, isLocked: true, lastAccess: now() } } })
        state.addSecurityLog(doorId, 'door_locked', `${door.label} verrouillée`)
      },

      unlockDoor: (doorId) => {
        const state = get()
        const door = state.doors[doorId]
        if (!door) return
        set({ doors: { ...state.doors, [doorId]: { ...door, isLocked: false, lastAccess: now() } } })
        state.addSecurityLog(doorId, 'door_unlocked', `${door.label} déverrouillée`)
      },

      toggleDoor: (doorId) => {
        const state = get()
        const door = state.doors[doorId]
        if (!door) return
        if (door.isLocked) {
          state.tryAccessDoor(doorId)
        } else {
          set({ doors: { ...state.doors, [doorId]: { ...door, isOpen: !door.isOpen, lastAccess: now() } } })
        }
      },

      setDoorAutoClose: (doorId, delay) => {
        const state = get()
        const door = state.doors[doorId]
        if (!door) return
        set({ doors: { ...state.doors, [doorId]: { ...door, autoCloseDelay: delay } } })
      },

      // ══════════════════════════════════════════════════════
      // ACTIONS — CHAMBRES
      // ══════════════════════════════════════════════════════

      toggleRoomLight: (roomId) => set(s => ({
        rooms: s.rooms.map(r => r.id === roomId ? { ...r, lightOn: !r.lightOn } : r),
      })),

      toggleRoomTV: (roomId) => set(s => ({
        rooms: s.rooms.map(r => r.id === roomId ? { ...r, tvOn: !r.tvOn } : r),
      })),

      toggleRoomCurtains: (roomId) => set(s => ({
        rooms: s.rooms.map(r => r.id === roomId ? { ...r, curtainsOpen: !r.curtainsOpen } : r),
      })),

      toggleBathroomLight: (roomId) => set(s => ({
        rooms: s.rooms.map(r => r.id === roomId ? { ...r, bathroomLightOn: !r.bathroomLightOn } : r),
      })),

      setDoNotDisturb: (roomId, value) => set(s => ({
        rooms: s.rooms.map(r => r.id === roomId ? { ...r, doNotDisturb: value } : r),
      })),

      requestCleaning: (roomId) => {
        set(s => ({ rooms: s.rooms.map(r => r.id === roomId ? { ...r, cleaningRequested: true } : r) }))
        const room = get().rooms.find(r => r.id === roomId)
        if (room) get().requestService('cleaning', room.number)
      },

      setRoomTemperature: (roomId, temp) => set(s => ({
        rooms: s.rooms.map(r => r.id === roomId ? { ...r, temperature: Math.max(16, Math.min(28, temp)) } : r),
      })),

      checkIn: (roomNumber, guestName, nights) => {
        set(s => ({
          rooms: s.rooms.map(r => r.number === roomNumber ? {
            ...r,
            isOccupied: true,
            occupantName: guestName,
            checkInDate: now(),
            checkOutDate: now() + nights * 86400000,
            lightOn: true,
          } : r),
        }))
        get().addNotification(`Check-in: ${guestName} → Chambre ${roomNumber}`, 'info', '🏨')
        get().addSecurityLog(`door-${roomNumber}`, 'access_granted', `Check-in: ${guestName} (${nights} nuits)`)
      },

      checkOut: (roomNumber) => {
        const room = get().rooms.find(r => r.number === roomNumber)
        if (!room) return
        set(s => ({
          rooms: s.rooms.map(r => r.number === roomNumber ? {
            ...r,
            isOccupied: false,
            occupantName: '',
            lightOn: false,
            tvOn: false,
            doNotDisturb: false,
            cleaningRequested: true,
            checkInDate: 0,
            checkOutDate: 0,
          } : r),
        }))
        // Re-verrouiller la porte
        const doorId = `door-${roomNumber}`
        const door = get().doors[doorId]
        if (door) {
          set(s => ({ doors: { ...s.doors, [doorId]: { ...door, isLocked: true, isOpen: false } } }))
        }
        get().addNotification(`Check-out: Chambre ${roomNumber}`, 'info', '👋')
        get().requestService('cleaning', roomNumber, 'Nettoyage après check-out')
      },

      // ══════════════════════════════════════════════════════
      // ACTIONS — ASCENSEUR
      // ══════════════════════════════════════════════════════

      callElevator: (floor) => {
        const state = get()
        if (state.elevator.isEmergencyStopped) return
        if (state.elevator.currentFloor === floor && !state.elevator.isMoving) {
          set({ elevator: { ...state.elevator, doorsOpen: true } })
          return
        }

        const newQueue = [...state.elevator.queue]
        if (!newQueue.includes(floor)) newQueue.push(floor)

        set({
          elevator: {
            ...state.elevator,
            queue: newQueue,
            targetFloor: state.elevator.isMoving ? state.elevator.targetFloor : floor,
            isMoving: true,
            doorsOpen: false,
            direction: floor > state.elevator.currentFloor ? 'up' : 'down',
          },
        })

        state.addSecurityLog(`door-elevator-${floor}`, 'elevator_call', `Ascenseur appelé à l'étage ${floor}`)
      },

      moveElevator: (floor) => set(s => ({
        elevator: {
          ...s.elevator,
          currentFloor: floor,
          lastMoveTime: now(),
        },
      })),

      toggleElevatorDoors: () => set(s => ({
        elevator: { ...s.elevator, doorsOpen: !s.elevator.doorsOpen },
      })),

      emergencyStopElevator: () => {
        set(s => ({
          elevator: { ...s.elevator, isEmergencyStopped: true, isMoving: false, doorsOpen: true, queue: [] },
        }))
        get().addSecurityLog('elevator', 'elevator_emergency', 'Arrêt d\'urgence activé', 'critical')
        get().addNotification('⚠️ Ascenseur — Arrêt d\'urgence activé', 'error', '🛑')
      },

      resetElevator: () => {
        set(s => ({
          elevator: { ...s.elevator, isEmergencyStopped: false, isMoving: false, direction: 'idle', queue: [] },
        }))
        get().addSecurityLog('elevator', 'system_reset', 'Ascenseur réinitialisé')
      },

      processElevatorQueue: () => {
        const state = get()
        const elev = state.elevator
        if (elev.isEmergencyStopped || elev.queue.length === 0) return

        const nextFloor = elev.queue[0]
        const newQueue = elev.queue.slice(1)

        set({
          elevator: {
            ...elev,
            targetFloor: nextFloor,
            isMoving: true,
            doorsOpen: false,
            direction: nextFloor > elev.currentFloor ? 'up' : 'down',
            queue: newQueue,
          },
        })
      },

      // ══════════════════════════════════════════════════════
      // ACTIONS — SÉCURITÉ
      // ══════════════════════════════════════════════════════

      triggerAlarm: (doorId, details, severity = 'critical') => {
        const state = get()
        state.addSecurityLog(doorId, 'alarm', details, severity)
        const door = state.doors[doorId]

        set({
          doors: door ? { ...state.doors, [doorId]: { ...door, alarmTriggered: true } } : state.doors,
          masterAlarm: true,
          totalAlarms: state.totalAlarms + 1,
        })

        state.addNotification(`🚨 ALARME: ${details}`, 'error', '🚨', 10000)
      },

      silenceAlarm: (duration) => {
        set({ alarmSilenceUntil: now() + duration })
        get().addNotification(`Alarme silencée pour ${Math.round(duration / 60000)} minutes`, 'warning', '🔇')
      },

      resetAlarm: () => {
        const state = get()
        const newDoors = { ...state.doors }
        Object.keys(newDoors).forEach(k => {
          newDoors[k] = { ...newDoors[k], alarmTriggered: false, failedAttempts: 0 }
        })
        set({ doors: newDoors, masterAlarm: false, alarmSilenceUntil: 0 })
        state.addSecurityLog('system', 'system_reset', 'Toutes les alarmes réinitialisées')
        state.addNotification('Système d\'alarme réinitialisé', 'info', '✓')
      },

      activateLockdown: (reason) => {
        set({ lockdownActive: true, lockdownReason: reason })
        const state = get()
        // Verrouiller toutes les portes non-urgence
        const newDoors = { ...state.doors }
        Object.keys(newDoors).forEach(k => {
          if (!newDoors[k].isEmergencyExit) {
            newDoors[k] = { ...newDoors[k], isLocked: true, isOpen: false }
          }
        })
        set({ doors: newDoors })
        state.addSecurityLog('system', 'alarm', `CONFINEMENT ACTIVÉ: ${reason}`, 'critical')
        state.addNotification(`🔒 CONFINEMENT: ${reason}`, 'error', '🔒', 0)
      },

      deactivateLockdown: () => {
        set({ lockdownActive: false, lockdownReason: '' })
        get().addSecurityLog('system', 'system_reset', 'Confinement désactivé')
        get().addNotification('Confinement désactivé', 'success', '🔓')
      },

      triggerFireAlarm: () => {
        set(s => ({
          lobby: { ...s.lobby, fireAlarmActive: true, emergencyLightsOn: true },
        }))
        // Déverrouiller toutes les sorties d'urgence
        const state = get()
        const newDoors = { ...state.doors }
        Object.keys(newDoors).forEach(k => {
          if (newDoors[k].isEmergencyExit) {
            newDoors[k] = { ...newDoors[k], isLocked: false, isOpen: true }
          }
        })
        set({ doors: newDoors })
        state.addSecurityLog('system', 'fire_alarm', 'ALARME INCENDIE DÉCLENCHÉE', 'critical')
        state.addNotification('🔥 ALARME INCENDIE — Évacuation immédiate', 'error', '🔥', 0)
      },

      resetFireAlarm: () => {
        set(s => ({ lobby: { ...s.lobby, fireAlarmActive: false, emergencyLightsOn: false } }))
        get().addSecurityLog('system', 'system_reset', 'Alarme incendie réinitialisée')
      },

      addSecurityLog: (doorId, event, details, severity = 'info') => {
        const state = get()
        const door = state.doors[doorId]
        set({
          securityLogs: [{
            id: uid(),
            time: now(),
            doorId,
            event,
            details,
            severity,
            actorName: state.playerCard.ownerName,
            floor: door?.floor ?? 0,
          }, ...state.securityLogs].slice(0, 100),
        })
      },

      clearSecurityLogs: () => set({ securityLogs: [] }),

      // ══════════════════════════════════════════════════════
      // ACTIONS — LOBBY
      // ══════════════════════════════════════════════════════

      ringBell: () => {
        set(s => ({ lobby: { ...s.lobby, receptionBellRung: true } }))
        setTimeout(() => set(s => ({ lobby: { ...s.lobby, receptionBellRung: false } })), 2000)
        get().addSecurityLog('door-lobby-main', 'bell_ring', 'Clochette de réception sonnée')
      },

      toggleLobbyMusic: () => set(s => ({ lobby: { ...s.lobby, musicPlaying: !s.lobby.musicPlaying } })),
      setLobbyMusicVolume: (volume) => set(s => ({ lobby: { ...s.lobby, musicVolume: Math.max(0, Math.min(1, volume)) } })),
      toggleFountain: () => set(s => ({ lobby: { ...s.lobby, fountainOn: !s.lobby.fountainOn } })),
      setHVACMode: (mode) => set(s => ({ lobby: { ...s.lobby, hvacMode: mode } })),
      setTargetTemperature: (temp) => set(s => ({ lobby: { ...s.lobby, targetTemperature: Math.max(16, Math.min(28, temp)) } })),

      // ══════════════════════════════════════════════════════
      // ACTIONS — SERVICES
      // ══════════════════════════════════════════════════════

      requestService: (type, roomNumber, details = '') => {
        const estimatedTimes: Record<ServiceType, number> = {
          cleaning: 30, room_service: 15, maintenance: 45, laundry: 60, wake_up: 0, taxi: 10,
        }
        const costs: Record<ServiceType, number> = {
          cleaning: 0, room_service: 35, maintenance: 0, laundry: 25, wake_up: 0, taxi: 15,
        }
        const labels: Record<ServiceType, string> = {
          cleaning: 'Nettoyage', room_service: 'Service d\'étage', maintenance: 'Maintenance',
          laundry: 'Blanchisserie', wake_up: 'Réveil', taxi: 'Taxi',
        }

        const request: ServiceRequest = {
          id: uid(),
          type,
          roomNumber,
          requestTime: now(),
          estimatedTime: estimatedTimes[type],
          status: 'pending',
          details: details || `${labels[type]} demandé pour chambre ${roomNumber}`,
          cost: costs[type],
        }

        set(s => ({ serviceRequests: [request, ...s.serviceRequests].slice(0, 20) }))
        get().addSecurityLog(`door-${roomNumber}`, 'room_service', `${labels[type]} demandé`)
        get().addNotification(`${labels[type]} demandé — Chambre ${roomNumber}`, 'info', '🛎️')
      },

      cancelService: (requestId) => set(s => ({
        serviceRequests: s.serviceRequests.map(r => r.id === requestId ? { ...r, status: 'cancelled' } : r),
      })),

      completeService: (requestId) => set(s => ({
        serviceRequests: s.serviceRequests.map(r => r.id === requestId ? { ...r, status: 'completed' } : r),
      })),

      // ══════════════════════════════════════════════════════
      // ACTIONS — CARTE
      // ══════════════════════════════════════════════════════

      upgradeCard: (newLevel) => {
        set(s => ({ playerCard: { ...s.playerCard, level: newLevel } }))
        get().addNotification(`Carte améliorée → ${CARD_LABELS[newLevel]}`, 'success', '⬆️')
        get().addSecurityLog('system', 'system_reset', `Carte joueur améliorée: ${CARD_LABELS[newLevel]}`)
      },

      deactivateCard: () => set(s => ({ playerCard: { ...s.playerCard, isActive: false } })),
      reactivateCard: () => set(s => ({ playerCard: { ...s.playerCard, isActive: true } })),
      reportLostCard: () => {
        set(s => ({ playerCard: { ...s.playerCard, isLost: true, isActive: false } }))
        get().addNotification('Carte signalée perdue — contactez la réception', 'warning', '⚠️')
      },

      replaceCard: () => {
        set(s => ({
          playerCard: {
            ...s.playerCard,
            id: `card-player-${uid()}`,
            isLost: false,
            isActive: true,
            lastUsed: now(),
            usageCount: 0,
          },
        }))
        get().addNotification('Nouvelle carte émise', 'success', '🪪')
      },

      changePin: (newPin) => {
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) return
        set(s => ({ playerCard: { ...s.playerCard, pin: newPin } }))
        get().addNotification('Code PIN modifié', 'success', '🔢')
      },

      addAllowedRoom: (roomNumber) => set(s => ({
        playerCard: {
          ...s.playerCard,
          allowedRooms: [...new Set([...s.playerCard.allowedRooms, roomNumber])],
        },
      })),

      removeAllowedRoom: (roomNumber) => set(s => ({
        playerCard: {
          ...s.playerCard,
          allowedRooms: s.playerCard.allowedRooms.filter(r => r !== roomNumber),
        },
      })),

      // ══════════════════════════════════════════════════════
      // ACTIONS — NOTIFICATIONS
      // ══════════════════════════════════════════════════════

      addNotification: (message, type = 'info', icon = '', duration = 5000) => {
        const notif: HotelNotification = {
          id: uid(),
          message,
          type,
          time: now(),
          duration,
          read: false,
          icon,
        }
        set(s => ({ notifications: [notif, ...s.notifications].slice(0, 30) }))

        if (duration > 0) {
          setTimeout(() => {
            set(s => ({ notifications: s.notifications.filter(n => n.id !== notif.id) }))
          }, duration)
        }
      },

      dismissNotification: (id) => set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),

      clearNotifications: () => set({ notifications: [] }),

      // ══════════════════════════════════════════════════════
      // GETTERS
      // ══════════════════════════════════════════════════════

      getDoorById: (doorId) => get().doors[doorId],
      getRoomByNumber: (number) => get().rooms.find(r => r.number === number),
      getRoomsByFloor: (floor) => get().rooms.filter(r => r.floor === floor),
      getOccupiedRooms: () => get().rooms.filter(r => r.isOccupied),
      getAvailableRooms: () => get().rooms.filter(r => !r.isOccupied),
      getActiveAlarms: () => Object.values(get().doors).filter(d => d.alarmTriggered),
      getRecentLogs: (count = 20) => get().securityLogs.slice(0, count),
      getPendingServices: () => get().serviceRequests.filter(r => r.status === 'pending' || r.status === 'in_progress'),
      getUnreadNotifications: () => get().notifications.filter(n => !n.read),
      isPlayerRoom: (doorId) => {
        const door = get().doors[doorId]
        return door?.roomNumber === get().playerRoomNumber
      },
      canAccess: (doorId) => {
        const state = get()
        const door = state.doors[doorId]
        if (!door) return false
        if (!door.isLocked) return true
        const card = state.playerCard
        if (!card.isActive || card.isLost || card.expiresAt < now()) return false
        if (CARD_HIERARCHY[card.level] < CARD_HIERARCHY[door.requiredLevel]) return false
        if (card.level === 'resident' && door.type === 'room' && !card.allowedRooms.includes(door.roomNumber)) return false
        return true
      },
    }),
    {
      name: 'etherworld-hotel-storage',
      partialize: (state) => ({
        playerCard: state.playerCard,
        playerFloor: state.playerFloor,
        playerRoomNumber: state.playerRoomNumber,
        totalAccessAttempts: state.totalAccessAttempts,
        totalSuccessfulAccess: state.totalSuccessfulAccess,
        totalDeniedAccess: state.totalDeniedAccess,
        totalAlarms: state.totalAlarms,
      }),
    }
  )
)