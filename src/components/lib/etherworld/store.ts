import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import type {
  KeyCard,
  DoorState,
  LightState,
  InteractableState,
  RoomConfig,
  CardAccessLevel,
} from './types'
import { ACCESS_LEVELS } from './types'

// ════════════════════════════════════════════════════════════════════════════
// TYPES ENRICHIS
// ════════════════════════════════════════════════════════════════════════════

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'access' | 'system'
export type DoorId = 'main' | 'bathroom' | 'balcony' | 'closet'
export type LightScene = 'day' | 'night' | 'cinema' | 'romance' | 'work' | 'sleep' | 'party'
export type CurrentView = 'room' | 'corridor' | 'lobby' | 'city' | 'exterior'

// ────────────────────────────────────────────────────────────────
// Notification enrichie
// ────────────────────────────────────────────────────────────────

export interface RichNotification {
  id: string
  message: string
  type: NotificationType
  timestamp: number
  duration: number
  icon?: string
  read: boolean
}

// ────────────────────────────────────────────────────────────────
// Door enrichi
// ────────────────────────────────────────────────────────────────

export interface DoorStateExtended extends DoorState {
  label: string
  knockCount: number
  lastKnockTime: number
  isJammed: boolean
  autoCloseDelay: number // ms, 0 = pas de fermeture auto
  openAngle: number // 0-90 degrés
}

// ────────────────────────────────────────────────────────────────
// Lumière enrichie
// ────────────────────────────────────────────────────────────────

export interface LightStateExtended extends LightState {
  label: string
  colorTemp: number // Kelvins (2700-6500)
  dimmable: boolean
  groupId?: string
  schedule?: { onAt: number; offAt: number } // heures
  flicker?: boolean
  motion?: boolean // lumière à détection de mouvement
}

// ────────────────────────────────────────────────────────────────
// Interactable enrichi
// ────────────────────────────────────────────────────────────────

export interface InteractableExtended extends InteractableState {
  label: string
  description?: string
  isLocked?: boolean
  lockCode?: string
  lastInteractionTime?: number
  interactionCount?: number
  temperature?: number // frigo, four
  volume?: number // tv, radio
  channel?: number // tv
  battery?: number // télécommande, etc.
}

// ────────────────────────────────────────────────────────────────
// Log de sécurité
// ────────────────────────────────────────────────────────────────

export interface SecurityLog {
  id: string
  timestamp: number
  event: 'access_granted' | 'access_denied' | 'door_opened' | 'door_closed' | 'door_knocked' | 'alarm' | 'light_on' | 'light_off' | 'card_changed'
  doorId?: DoorId
  cardLevel?: CardAccessLevel
  details: string
}

// ────────────────────────────────────────────────────────────────
// Stats de la chambre
// ────────────────────────────────────────────────────────────────

export interface RoomStats {
  temperature: number   // °C
  humidity: number      // %
  noiseLevel: number    // dB
  co2Level: number      // ppm
  brightness: number    // lux (calculé auto)
  powerUsage: number    // watts
}

// ────────────────────────────────────────────────────────────────
// État TV / Entertainment
// ────────────────────────────────────────────────────────────────

export interface TVState {
  isOn: boolean
  channel: number
  volume: number // 0-100
  isMuted: boolean
  channelNames: Record<number, string>
  brightness: number
  subtitles: boolean
}

// ────────────────────────────────────────────────────────────────
// État Thermostat
// ────────────────────────────────────────────────────────────────

export interface ThermostatState {
  targetTemp: number
  currentTemp: number
  mode: 'heat' | 'cool' | 'auto' | 'off'
  isOn: boolean
  fanSpeed: 'low' | 'medium' | 'high' | 'auto'
  schedule: Array<{ hour: number; temp: number }>
}

// ────────────────────────────────────────────────────────────────
// Room Service
// ────────────────────────────────────────────────────────────────

export type ServiceType = 'cleaning' | 'towels' | 'breakfast' | 'dinner' | 'minibar' | 'laundry' | 'taxi' | 'wake_up'

export interface ServiceRequest {
  id: string
  type: ServiceType
  requestTime: number
  estimatedArrival: number // minutes
  status: 'pending' | 'confirmed' | 'en_route' | 'delivered' | 'cancelled'
  notes?: string
  cost: number
}

// ════════════════════════════════════════════════════════════════════════════
// INTERFACE DU STORE
// ════════════════════════════════════════════════════════════════════════════

interface EtherWorldState {
  // ── ROOM CONFIG ──
  roomConfig: RoomConfig
  currentView: CurrentView
  setCurrentView: (view: CurrentView) => void

  // ── PLAYER CARD ──
  playerCard: KeyCard | null
  setPlayerCard: (card: KeyCard | null) => void
  cardHistory: Array<{ card: KeyCard | null; changedAt: number }>

  // ── DOORS ──
  doors: Record<DoorId, DoorStateExtended>
  attemptDoorAccess: (doorId: DoorId, card: KeyCard | null) => { granted: boolean; reason: string }
  setDoorOpen: (doorId: DoorId, isOpen: boolean) => void
  lockDoor: (doorId: DoorId) => void
  unlockDoor: (doorId: DoorId) => void
  knockDoor: (doorId: DoorId) => void
  jammDoor: (doorId: DoorId) => void
  setDoorAutoClose: (doorId: DoorId, delay: number) => void
  closeAllDoors: () => void
  openAllDoors: () => void

  // ── LIGHTS ──
  lights: Record<string, LightStateExtended>
  toggleLight: (id: string) => void
  setLightIntensity: (id: string, intensity: number) => void
  setLightColor: (id: string, color: string) => void
  setLightColorTemp: (id: string, kelvin: number) => void
  turnAllLightsOn: () => void
  turnAllLightsOff: () => void
  applyLightScene: (scene: LightScene) => void
  toggleLightGroup: (groupId: string) => void
  currentLightScene: LightScene | null

  // ── INTERACTABLES ──
  interactables: Record<string, InteractableExtended>
  toggleInteractable: (id: string) => void
  setInteractableValue: (id: string, value: number | string) => void
  lockInteractable: (id: string, code?: string) => void
  unlockInteractable: (id: string, code?: string) => boolean
  interactWithObject: (id: string, action: string) => { success: boolean; message: string }

  // ── TV ──
  tv: TVState
  setTVOn: (on: boolean) => void
  setTVChannel: (ch: number) => void
  setTVVolume: (vol: number) => void
  toggleTVMute: () => void
  nextChannel: () => void
  prevChannel: () => void

  // ── THERMOSTAT ──
  thermostat: ThermostatState
  setThermostatTarget: (temp: number) => void
  setThermostatMode: (mode: ThermostatState['mode']) => void
  setThermostatOn: (on: boolean) => void
  setFanSpeed: (speed: ThermostatState['fanSpeed']) => void

  // ── ROOM STATS ──
  roomStats: RoomStats
  updateRoomStats: (patch: Partial<RoomStats>) => void

  // ── TIME ──
  gameTime: Date
  setGameTime: (time: Date) => void
  advanceGameTime: (minutes: number) => void
  isNight: () => boolean
  isDaytime: () => boolean

  // ── SECURITY ──
  securityLogs: SecurityLog[]
  alarmActive: boolean
  addSecurityLog: (event: SecurityLog['event'], details: string, doorId?: DoorId) => void
  triggerAlarm: (reason: string) => void
  silenceAlarm: () => void
  clearSecurityLogs: () => void
  getRecentLogs: (count?: number) => SecurityLog[]

  // ── ROOM SERVICE ──
  serviceRequests: ServiceRequest[]
  requestService: (type: ServiceType, notes?: string) => ServiceRequest
  cancelService: (id: string) => void
  getActiveServices: () => ServiceRequest[]

  // ── NOTIFICATIONS ──
  showNotification: string | null
  notifications: RichNotification[]
  notify: (message: string, type?: NotificationType, duration?: number, icon?: string) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
  getUnreadCount: () => number

  // ── DO NOT DISTURB ──
  doNotDisturb: boolean
  toggleDoNotDisturb: () => void

  // ── CURTAINS ──
  curtainsOpen: number // 0-1
  setCurtains: (value: number) => void
  toggleCurtains: () => void

  // ── MINIBAR ──
  minibar: Record<string, { name: string; count: number; price: number; consumed: number }>
  consumeMinibarItem: (key: string) => void
  restockMinibar: () => void

  // ── SESSION ──
  sessionStart: Date
  checkoutDate: Date
  getStayDuration: () => number // jours
  getRemainingTime: () => number // heures
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createDoor(
  partial: Partial<DoorStateExtended> & { requiredLevel: CardAccessLevel; label: string }
): DoorStateExtended {
  return {
    isOpen: false,
    isLocked: false,
    lastAccessTime: 0,
    accessDenied: false,
    knockCount: 0,
    lastKnockTime: 0,
    isJammed: false,
    autoCloseDelay: 0,
    openAngle: 90,
    ...partial,
  }
}

function createLight(
  partial: Partial<LightStateExtended> & { id: string; label: string }
): LightStateExtended {
  return {
    isOn: false,
    intensity: 0.7,
    color: '#fff5e6',
    colorTemp: 3000,
    dimmable: true,
    flicker: false,
    motion: false,
    ...partial,
  }
}

// Scènes d'éclairage prédéfinies
const LIGHT_SCENES: Record<LightScene, (lights: Record<string, LightStateExtended>) => Record<string, Partial<LightStateExtended>>> = {
  day: () => ({
    ceiling: { isOn: true, intensity: 0.9, color: '#fff8f0', colorTemp: 5500 },
    desk: { isOn: true, intensity: 0.7, color: '#fff8f0', colorTemp: 5000 },
    bathroom: { isOn: false },
    ambient: { isOn: true, intensity: 0.2, color: '#e8f4fd' },
    tv: { isOn: false },
    neon: { isOn: false },
    floor: { isOn: true, intensity: 0.3, color: '#fff5e6' },
    bedside: { isOn: false },
  }),
  night: () => ({
    ceiling: { isOn: false },
    desk: { isOn: false },
    bathroom: { isOn: false },
    ambient: { isOn: true, intensity: 0.1, color: '#1a1040' },
    tv: { isOn: false },
    neon: { isOn: true, intensity: 0.3, color: '#8b5cf6' },
    floor: { isOn: false },
    bedside: { isOn: true, intensity: 0.2, color: '#ff9060' },
  }),
  cinema: () => ({
    ceiling: { isOn: false },
    desk: { isOn: false },
    bathroom: { isOn: false },
    ambient: { isOn: true, intensity: 0.05, color: '#0a0014' },
    tv: { isOn: true, intensity: 0.8, color: '#60a5fa' },
    neon: { isOn: false },
    floor: { isOn: true, intensity: 0.08, color: '#1a0a30' },
    bedside: { isOn: false },
  }),
  romance: () => ({
    ceiling: { isOn: false },
    desk: { isOn: false },
    bathroom: { isOn: true, intensity: 0.2, color: '#ff6b6b' },
    ambient: { isOn: true, intensity: 0.15, color: '#3d0014' },
    tv: { isOn: false },
    neon: { isOn: true, intensity: 0.4, color: '#ff4080' },
    floor: { isOn: true, intensity: 0.15, color: '#cc2244' },
    bedside: { isOn: true, intensity: 0.3, color: '#ff6040' },
  }),
  work: () => ({
    ceiling: { isOn: true, intensity: 0.95, color: '#f8f8ff', colorTemp: 6000 },
    desk: { isOn: true, intensity: 1.0, color: '#f0f8ff', colorTemp: 6500 },
    bathroom: { isOn: false },
    ambient: { isOn: true, intensity: 0.25, color: '#e8f0f8' },
    tv: { isOn: false },
    neon: { isOn: false },
    floor: { isOn: false },
    bedside: { isOn: false },
  }),
  sleep: () => ({
    ceiling: { isOn: false },
    desk: { isOn: false },
    bathroom: { isOn: false },
    ambient: { isOn: true, intensity: 0.02, color: '#0a0a14' },
    tv: { isOn: false },
    neon: { isOn: false },
    floor: { isOn: false },
    bedside: { isOn: false },
  }),
  party: () => ({
    ceiling: { isOn: true, intensity: 0.3, color: '#ff00ff', colorTemp: 2700 },
    desk: { isOn: true, intensity: 0.6, color: '#00ffff' },
    bathroom: { isOn: false },
    ambient: { isOn: true, intensity: 0.4, color: '#ff8800' },
    tv: { isOn: false },
    neon: { isOn: true, intensity: 1.0, color: '#00ff80' },
    floor: { isOn: true, intensity: 0.5, color: '#8000ff' },
    bedside: { isOn: true, intensity: 0.4, color: '#ff4000' },
  }),
}

const SERVICE_COSTS: Record<ServiceType, number> = {
  cleaning: 0, towels: 0, breakfast: 25, dinner: 45,
  minibar: 0, laundry: 35, taxi: 20, wake_up: 0,
}

const SERVICE_TIMES: Record<ServiceType, number> = {
  cleaning: 30, towels: 10, breakfast: 25, dinner: 35,
  minibar: 5, laundry: 90, taxi: 8, wake_up: 0,
}

const INITIAL_MINIBAR: EtherWorldState['minibar'] = {
  water: { name: 'Eau minérale', count: 4, price: 4, consumed: 0 },
  beer: { name: 'Bière', count: 3, price: 8, consumed: 0 },
  wine: { name: 'Vin rouge', count: 2, price: 18, consumed: 0 },
  juice: { name: 'Jus d\'orange', count: 2, price: 6, consumed: 0 },
  chips: { name: 'Chips', count: 2, price: 5, consumed: 0 },
  chocolate: { name: 'Chocolat', count: 3, price: 4, consumed: 0 },
  nuts: { name: 'Noix de cajou', count: 2, price: 7, consumed: 0 },
  soda: { name: 'Soda', count: 4, price: 5, consumed: 0 },
}

// ════════════════════════════════════════════════════════════════════════════
// STORE
// ════════════════════════════════════════════════════════════════════════════

export const useEtherWorldStore = create<EtherWorldState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ── ROOM CONFIG ──
        roomConfig: { roomNumber: '1247', floor: 12, type: 'studio' },
        currentView: 'room',
        setCurrentView: (view) => set({ currentView: view }),

        // ── PLAYER CARD ──
        playerCard: {
          id: 'card-001',
          level: 'resident',
          name: 'Player Card',
          color: '#3b82f6',
        },
        cardHistory: [],

        setPlayerCard: (card) => {
          const state = get()
          set({
            playerCard: card,
            cardHistory: [{ card, changedAt: Date.now() }, ...state.cardHistory].slice(0, 20),
          })
          state.addSecurityLog('card_changed', `Carte changée: ${card?.level ?? 'aucune'}`)
        },

        // ── DOORS ──
        doors: {
          main: createDoor({
            label: 'Porte principale',
            requiredLevel: 'resident',
            isOpen: true,
            autoCloseDelay: 8000,
          }),
          bathroom: createDoor({
            label: 'Salle de bain',
            requiredLevel: 'guest',
            autoCloseDelay: 5000,
          }),
          balcony: createDoor({
            label: 'Balcon',
            requiredLevel: 'guest',
            autoCloseDelay: 0,
          }),
          closet: createDoor({
            label: 'Placard',
            requiredLevel: 'guest',
            isLocked: false,
            autoCloseDelay: 0,
          }),
        },

        attemptDoorAccess: (doorId, card) => {
          const state = get()
          const door = state.doors[doorId]
          if (!door) return { granted: false, reason: 'Porte introuvable' }

          if (door.isJammed) {
            state.notify('Porte coincée — appelez la maintenance', 'error', 4000, '🔧')
            return { granted: false, reason: 'Porte coincée' }
          }

          if (!door.isLocked) {
            const newOpen = !door.isOpen
            set(s => ({
              doors: {
                ...s.doors,
                [doorId]: { ...s.doors[doorId], isOpen: newOpen, lastAccessTime: Date.now() },
              },
            }))
            state.addSecurityLog(newOpen ? 'door_opened' : 'door_closed', `${door.label} ${newOpen ? 'ouverte' : 'fermée'}`, doorId)

            if (newOpen && door.autoCloseDelay > 0) {
              setTimeout(() => {
                set(s => ({ doors: { ...s.doors, [doorId]: { ...s.doors[doorId], isOpen: false } } }))
              }, door.autoCloseDelay)
            }

            return { granted: true, reason: newOpen ? 'Porte ouverte' : 'Porte fermée' }
          }

          if (!card) {
            set(s => ({
              doors: { ...s.doors, [doorId]: { ...s.doors[doorId], accessDenied: true, lastAccessTime: Date.now() } },
            }))
            setTimeout(() => set(s => ({ doors: { ...s.doors, [doorId]: { ...s.doors[doorId], accessDenied: false } } })), 1500)
            state.addSecurityLog('access_denied', `Tentative sans carte: ${door.label}`, doorId)
            state.notify('Carte requise', 'error', 2500, '🔒')
            return { granted: false, reason: 'Carte requise' }
          }

          const cardLevel = ACCESS_LEVELS[card.level]
          const requiredLevel = ACCESS_LEVELS[door.requiredLevel]

          if (cardLevel >= requiredLevel) {
            const newOpen = !door.isOpen
            set(s => ({
              doors: {
                ...s.doors,
                [doorId]: { ...s.doors[doorId], isOpen: newOpen, accessDenied: false, lastAccessTime: Date.now() },
              },
            }))
            state.addSecurityLog(newOpen ? 'access_granted' : 'door_closed', `${card.level} → ${door.label}`, doorId)
            state.notify(newOpen ? '✓ Accès autorisé' : 'Porte verrouillée', 'access', 2000, '🔓')

            if (newOpen && door.autoCloseDelay > 0) {
              setTimeout(() => {
                set(s => ({ doors: { ...s.doors, [doorId]: { ...s.doors[doorId], isOpen: false } } }))
              }, door.autoCloseDelay)
            }

            return { granted: true, reason: newOpen ? 'Accès autorisé' : 'Porte fermée' }
          } else {
            set(s => ({
              doors: { ...s.doors, [doorId]: { ...s.doors[doorId], accessDenied: true, lastAccessTime: Date.now() } },
            }))
            setTimeout(() => set(s => ({ doors: { ...s.doors, [doorId]: { ...s.doors[doorId], accessDenied: false } } })), 1500)
            state.addSecurityLog('access_denied', `Niveau insuffisant: ${card.level} < ${door.requiredLevel}`, doorId)
            state.notify('Accès refusé — niveau insuffisant', 'error', 2500, '🚫')
            return { granted: false, reason: `Niveau ${door.requiredLevel} requis` }
          }
        },

        setDoorOpen: (doorId, isOpen) => set(s => ({
          doors: { ...s.doors, [doorId]: { ...s.doors[doorId], isOpen } },
        })),

        lockDoor: (doorId) => {
          set(s => ({ doors: { ...s.doors, [doorId]: { ...s.doors[doorId], isLocked: true, isOpen: false } } }))
          get().addSecurityLog('door_closed', `${get().doors[doorId]?.label} verrouillée`, doorId)
        },

        unlockDoor: (doorId) => {
          set(s => ({ doors: { ...s.doors, [doorId]: { ...s.doors[doorId], isLocked: false } } }))
          get().addSecurityLog('access_granted', `${get().doors[doorId]?.label} déverrouillée`, doorId)
        },

        knockDoor: (doorId) => {
          const door = get().doors[doorId]
          set(s => ({
            doors: {
              ...s.doors,
              [doorId]: { ...s.doors[doorId], knockCount: door.knockCount + 1, lastKnockTime: Date.now() },
            },
          }))
          get().addSecurityLog('door_knocked', `Toc toc sur ${door.label}`, doorId)
          get().notify('Toc toc ! ✊', 'info', 2000)
        },

        jammDoor: (doorId) => set(s => ({
          doors: { ...s.doors, [doorId]: { ...s.doors[doorId], isJammed: true } },
        })),

        setDoorAutoClose: (doorId, delay) => set(s => ({
          doors: { ...s.doors, [doorId]: { ...s.doors[doorId], autoCloseDelay: delay } },
        })),

        closeAllDoors: () => set(s => ({
          doors: Object.fromEntries(
            Object.entries(s.doors).map(([k, v]) => [k, { ...v, isOpen: false }])
          ) as Record<DoorId, DoorStateExtended>,
        })),

        openAllDoors: () => {
          const state = get()
          if (!state.playerCard || ACCESS_LEVELS[state.playerCard.level] < ACCESS_LEVELS['admin']) {
            state.notify('Niveau admin requis', 'error', 2000, '🔒')
            return
          }
          set(s => ({
            doors: Object.fromEntries(
              Object.entries(s.doors).map(([k, v]) => [k, { ...v, isOpen: true }])
            ) as Record<DoorId, DoorStateExtended>,
          }))
        },

        // ── LIGHTS ──
        lights: {
          ceiling: createLight({ id: 'ceiling', label: 'Plafonnier', isOn: true, intensity: 0.8, color: '#fff5e6', colorTemp: 3200, groupId: 'main' }),
          desk: createLight({ id: 'desk', label: 'Lampe bureau', isOn: false, intensity: 0.6, color: '#ffd700', colorTemp: 4000, groupId: 'work' }),
          bathroom: createLight({ id: 'bathroom', label: 'Salle de bain', isOn: false, intensity: 0.7, color: '#ffffff', colorTemp: 5000 }),
          ambient: createLight({ id: 'ambient', label: 'Lumière ambiante', isOn: true, intensity: 0.3, color: '#4a5568', dimmable: true }),
          tv: createLight({ id: 'tv', label: 'Rétroéclairage TV', isOn: false, intensity: 0.4, color: '#60a5fa', colorTemp: 6500 }),
          neon: createLight({ id: 'neon', label: 'Néon déco', isOn: true, intensity: 0.5, color: '#8b5cf6', dimmable: true }),
          floor: createLight({ id: 'floor', label: 'Lampadaire', isOn: false, intensity: 0.4, color: '#ffe5a0', colorTemp: 2700, groupId: 'main' }),
          bedside: createLight({ id: 'bedside', label: 'Chevet', isOn: false, intensity: 0.3, color: '#ff9060', colorTemp: 2200, groupId: 'sleep' }),
        },

        currentLightScene: null,

        toggleLight: (id) => {
          const state = get()
          const light = state.lights[id]
          if (!light) return
          set(s => ({
            lights: { ...s.lights, [id]: { ...s.lights[id], isOn: !s.lights[id].isOn } },
            currentLightScene: null,
          }))
          state.addSecurityLog(
            !light.isOn ? 'light_on' : 'light_off',
            `${light.label} ${!light.isOn ? 'allumée' : 'éteinte'}`
          )
        },

        setLightIntensity: (id, intensity) => set(s => ({
          lights: { ...s.lights, [id]: { ...s.lights[id], intensity: Math.max(0, Math.min(1, intensity)) } },
        })),

        setLightColor: (id, color) => set(s => ({
          lights: { ...s.lights, [id]: { ...s.lights[id], color } },
        })),

        setLightColorTemp: (id, kelvin) => {
          const temp = Math.max(2700, Math.min(6500, kelvin))
          // Convertir Kelvin en couleur approximative
          const warm = Math.max(0, (6500 - temp) / 3800)
          const r = Math.round(255)
          const g = Math.round(220 + warm * 20)
          const b = Math.round(255 - warm * 180)
          const color = `rgb(${r},${g},${b})`
          set(s => ({ lights: { ...s.lights, [id]: { ...s.lights[id], colorTemp: temp, color } } }))
        },

        turnAllLightsOn: () => set(s => ({
          lights: Object.fromEntries(Object.entries(s.lights).map(([k, v]) => [k, { ...v, isOn: true }])),
        })),

        turnAllLightsOff: () => set(s => ({
          lights: Object.fromEntries(Object.entries(s.lights).map(([k, v]) => [k, { ...v, isOn: false }])),
          currentLightScene: null,
        })),

        applyLightScene: (scene) => {
          const state = get()
          const sceneConfig = LIGHT_SCENES[scene](state.lights)
          set(s => ({
            lights: Object.fromEntries(
              Object.entries(s.lights).map(([k, v]) => [k, { ...v, ...(sceneConfig[k] || {}) }])
            ),
            currentLightScene: scene,
          }))
          state.notify(`Scène: ${scene.charAt(0).toUpperCase() + scene.slice(1)}`, 'info', 2500, '💡')
        },

        toggleLightGroup: (groupId) => {
          const state = get()
          const groupLights = Object.values(state.lights).filter(l => l.groupId === groupId)
          const anyOn = groupLights.some(l => l.isOn)
          set(s => ({
            lights: Object.fromEntries(
              Object.entries(s.lights).map(([k, v]) => [
                k,
                v.groupId === groupId ? { ...v, isOn: !anyOn } : v,
              ])
            ),
          }))
        },

        // ── INTERACTABLES ──
        interactables: {
          tv: { id: 'tv', type: 'tv', label: 'Télévision', isActive: false, value: 1, description: 'TV 55" 4K OLED', interactionCount: 0 },
          arcade: { id: 'arcade', type: 'arcade', label: 'Borne Arcade', isActive: true, value: 0, description: 'Arcade EtherWorld', interactionCount: 0 },
          drawer1: { id: 'drawer1', type: 'drawer', label: 'Tiroir bureau', isActive: false, description: 'Tiroir du bureau', interactionCount: 0 },
          drawer2: { id: 'drawer2', type: 'drawer', label: 'Tiroir chevet', isActive: false, description: 'Tiroir de chevet', interactionCount: 0 },
          curtain: { id: 'curtain', type: 'curtain', label: 'Rideaux', isActive: false, value: 0, description: 'Rideaux occultants', interactionCount: 0 },
          fridge: { id: 'fridge', type: 'fridge', label: 'Réfrigérateur', isActive: false, temperature: 4, description: 'Frigo 2°C', interactionCount: 0 },
          safe: { id: 'safe', type: 'safe', label: 'Coffre-fort', isActive: false, isLocked: true, lockCode: '1234', description: 'Coffre numérique', interactionCount: 0 },
          phone: { id: 'phone', type: 'phone', label: 'Téléphone chambre', isActive: false, description: 'Ligne directe réception', interactionCount: 0 },
          coffee: { id: 'coffee', type: 'coffee', label: 'Machine à café', isActive: false, description: 'Nespresso', interactionCount: 0 },
          radio: { id: 'radio', type: 'radio', label: 'Radio', isActive: false, value: 0, volume: 30, description: 'Radio FM', interactionCount: 0 },
        },

        toggleInteractable: (id) => set(s => ({
          interactables: {
            ...s.interactables,
            [id]: {
              ...s.interactables[id],
              isActive: !s.interactables[id]?.isActive,
              lastInteractionTime: Date.now(),
              interactionCount: (s.interactables[id]?.interactionCount || 0) + 1,
            },
          },
        })),

        setInteractableValue: (id, value) => set(s => ({
          interactables: {
            ...s.interactables,
            [id]: { ...s.interactables[id], value, lastInteractionTime: Date.now() },
          },
        })),

        lockInteractable: (id, code) => set(s => ({
          interactables: { ...s.interactables, [id]: { ...s.interactables[id], isLocked: true, lockCode: code } },
        })),

        unlockInteractable: (id, code) => {
          const obj = get().interactables[id]
          if (!obj?.isLocked) return true
          if (obj.lockCode && code !== obj.lockCode) {
            get().notify('Code incorrect', 'error', 2000, '🔒')
            return false
          }
          set(s => ({ interactables: { ...s.interactables, [id]: { ...s.interactables[id], isLocked: false } } }))
          get().notify('Déverrouillé!', 'success', 2000, '🔓')
          return true
        },

        interactWithObject: (id, action) => {
          const state = get()
          const obj = state.interactables[id]
          if (!obj) return { success: false, message: 'Objet introuvable' }

          if (obj.isLocked && action !== 'unlock') {
            return { success: false, message: `${obj.label} est verrouillé` }
          }

          let message = ''

          switch (obj.type) {
            case 'tv':
              state.toggleInteractable(id)
              message = obj.isActive ? 'TV éteinte' : 'TV allumée'
              break
            case 'coffee':
              state.toggleInteractable(id)
              message = obj.isActive ? 'Machine éteinte' : '☕ Café en préparation...'
              setTimeout(() => {
                set(s => ({ interactables: { ...s.interactables, [id]: { ...s.interactables[id], isActive: false } } }))
                state.notify('☕ Café prêt!', 'success', 3000)
              }, 5000)
              break
            case 'fridge':
              state.toggleInteractable(id)
              message = obj.isActive ? 'Frigo fermé' : 'Frigo ouvert — ' + Object.values(get().minibar).filter(i => i.count > 0).map(i => i.name).slice(0, 3).join(', ')
              break
            case 'curtain':
              const newVal = (typeof obj.value === 'number') ? (obj.value > 0.5 ? 0 : 1) : 0
              state.setInteractableValue(id, newVal)
              state.setCurtains(newVal)
              message = newVal > 0.5 ? 'Rideaux ouverts' : 'Rideaux fermés'
              break
            default:
              state.toggleInteractable(id)
              message = `${obj.label} ${!obj.isActive ? 'activé' : 'désactivé'}`
          }

          set(s => ({
            interactables: {
              ...s.interactables,
              [id]: {
                ...s.interactables[id],
                lastInteractionTime: Date.now(),
                interactionCount: (s.interactables[id].interactionCount || 0) + 1,
              },
            },
          }))

          state.notify(message, 'info', 2000)
          return { success: true, message }
        },

        // ── TV ──
        tv: {
          isOn: false, channel: 1, volume: 40, isMuted: false,
          brightness: 80, subtitles: false,
          channelNames: {
            1: 'CBC', 2: 'TVA', 3: 'RDS', 4: 'Canal D',
            5: 'Netflix', 6: 'EtherWorld TV', 7: 'Infos 24h',
          },
        },

        setTVOn: (on) => {
          set(s => ({ tv: { ...s.tv, isOn: on } }))
          get().toggleLight('tv')
        },

        setTVChannel: (ch) => set(s => ({
          tv: { ...s.tv, channel: Math.max(1, Math.min(99, ch)) },
        })),

        setTVVolume: (vol) => set(s => ({
          tv: { ...s.tv, volume: Math.max(0, Math.min(100, vol)), isMuted: false },
        })),

        toggleTVMute: () => set(s => ({ tv: { ...s.tv, isMuted: !s.tv.isMuted } })),
        nextChannel: () => set(s => ({ tv: { ...s.tv, channel: (s.tv.channel % 99) + 1 } })),
        prevChannel: () => set(s => ({ tv: { ...s.tv, channel: s.tv.channel <= 1 ? 99 : s.tv.channel - 1 } })),

        // ── THERMOSTAT ──
        thermostat: {
          targetTemp: 22,
          currentTemp: 20,
          mode: 'auto',
          isOn: true,
          fanSpeed: 'auto',
          schedule: [
            { hour: 7, temp: 22 }, { hour: 9, temp: 20 },
            { hour: 18, temp: 22 }, { hour: 23, temp: 19 },
          ],
        },

        setThermostatTarget: (temp) => {
          const clamped = Math.max(16, Math.min(28, temp))
          set(s => ({ thermostat: { ...s.thermostat, targetTemp: clamped } }))
          get().notify(`🌡️ Température cible: ${clamped}°C`, 'info', 2000)
        },

        setThermostatMode: (mode) => set(s => ({ thermostat: { ...s.thermostat, mode } })),
        setThermostatOn: (on) => set(s => ({ thermostat: { ...s.thermostat, isOn: on } })),
        setFanSpeed: (speed) => set(s => ({ thermostat: { ...s.thermostat, fanSpeed: speed } })),

        // ── ROOM STATS ──
        roomStats: {
          temperature: 20, humidity: 45, noiseLevel: 28,
          co2Level: 420, brightness: 350, powerUsage: 145,
        },

        updateRoomStats: (patch) => set(s => ({ roomStats: { ...s.roomStats, ...patch } })),

        // ── TIME ──
        gameTime: new Date(2024, 0, 1, 22, 0),
        setGameTime: (time) => set({ gameTime: time }),

        advanceGameTime: (minutes) => {
          const state = get()
          const newTime = new Date(state.gameTime.getTime() + minutes * 60000)
          set({ gameTime: newTime })
        },

        isNight: () => {
          const h = get().gameTime.getHours()
          return h >= 22 || h < 6
        },

        isDaytime: () => {
          const h = get().gameTime.getHours()
          return h >= 8 && h < 20
        },

        // ── SECURITY ──
        securityLogs: [],
        alarmActive: false,

        addSecurityLog: (event, details, doorId) => {
          const log: SecurityLog = {
            id: uid(), timestamp: Date.now(), event, details, doorId,
            cardLevel: get().playerCard?.level,
          }
          set(s => ({ securityLogs: [log, ...s.securityLogs].slice(0, 100) }))
        },

        triggerAlarm: (reason) => {
          set({ alarmActive: true })
          get().addSecurityLog('alarm', reason)
          get().notify(`🚨 ALARME: ${reason}`, 'error', 0)
        },

        silenceAlarm: () => {
          set({ alarmActive: false })
          get().notify('Alarme silencée', 'warning', 3000)
        },

        clearSecurityLogs: () => set({ securityLogs: [] }),

        getRecentLogs: (count = 20) => get().securityLogs.slice(0, count),

        // ── ROOM SERVICE ──
        serviceRequests: [],

        requestService: (type, notes) => {
          const req: ServiceRequest = {
            id: uid(),
            type,
            requestTime: Date.now(),
            estimatedArrival: SERVICE_TIMES[type],
            status: 'pending',
            notes,
            cost: SERVICE_COSTS[type],
          }
          set(s => ({ serviceRequests: [req, ...s.serviceRequests].slice(0, 20) }))

          const labels: Record<ServiceType, string> = {
            cleaning: '🧹 Ménage', towels: '🛁 Serviettes', breakfast: '🥐 Petit-déj',
            dinner: '🍽️ Dîner', minibar: '🍾 Minibar', laundry: '👔 Blanchisserie',
            taxi: '🚕 Taxi', wake_up: '⏰ Réveil',
          }

          get().notify(
            `${labels[type]} demandé — ${SERVICE_TIMES[type]} min`,
            'success', 4000, '🛎️'
          )

          return req
        },

        cancelService: (id) => {
          set(s => ({
            serviceRequests: s.serviceRequests.map(r =>
              r.id === id ? { ...r, status: 'cancelled' } : r
            ),
          }))
          get().notify('Service annulé', 'warning', 2000)
        },

        getActiveServices: () =>
          get().serviceRequests.filter(r => r.status === 'pending' || r.status === 'confirmed' || r.status === 'en_route'),

        // ── NOTIFICATIONS ──
        showNotification: null,
        notifications: [],

        notify: (message, type = 'info', duration = 3000, icon) => {
          const notif: RichNotification = {
            id: uid(), message, type, timestamp: Date.now(), duration, icon, read: false,
          }
          set(s => ({
            showNotification: message,
            notifications: [notif, ...s.notifications].slice(0, 25),
          }))
          if (duration > 0) {
            setTimeout(() => set({ showNotification: null }), duration)
          }
        },

        dismissNotification: (id) => set(s => ({
          notifications: s.notifications.filter(n => n.id !== id),
        })),

        clearNotifications: () => set({ notifications: [], showNotification: null }),

        getUnreadCount: () => get().notifications.filter(n => !n.read).length,

        // ── DO NOT DISTURB ──
        doNotDisturb: false,
        toggleDoNotDisturb: () => {
          const next = !get().doNotDisturb
          set({ doNotDisturb: next })
          get().notify(next ? '🔕 Ne pas déranger activé' : '🔔 Ne pas déranger désactivé', 'info', 2500)
        },

        // ── CURTAINS ──
        curtainsOpen: 0.5,
        setCurtains: (value) => set({ curtainsOpen: Math.max(0, Math.min(1, value)) }),
        toggleCurtains: () => set(s => ({ curtainsOpen: s.curtainsOpen > 0.5 ? 0 : 1 })),

        // ── MINIBAR ──
        minibar: INITIAL_MINIBAR,

        consumeMinibarItem: (key) => {
          const state = get()
          const item = state.minibar[key]
          if (!item || item.count === 0) {
            state.notify('Article épuisé', 'warning', 2000, '😕')
            return
          }
          set(s => ({
            minibar: {
              ...s.minibar,
              [key]: { ...s.minibar[key], count: s.minibar[key].count - 1, consumed: s.minibar[key].consumed + 1 },
            },
          }))
          state.notify(`${item.name} consommé — ${item.price}$`, 'info', 2500, '🍾')
        },

        restockMinibar: () => {
          set({ minibar: INITIAL_MINIBAR })
          get().notify('Minibar réapprovisionné', 'success', 2500, '🛒')
        },

        // ── SESSION ──
        sessionStart: new Date(),
        checkoutDate: new Date(Date.now() + 2 * 24 * 3600000),

        getStayDuration: () => {
          const state = get()
          return Math.ceil((state.checkoutDate.getTime() - state.sessionStart.getTime()) / (24 * 3600000))
        },

        getRemainingTime: () => {
          const state = get()
          return Math.max(0, (state.checkoutDate.getTime() - Date.now()) / 3600000)
        },
      }),
      {
        name: 'etherworld-room-storage',
        partialize: (state) => ({
          roomConfig: state.roomConfig,
          playerCard: state.playerCard,
          lights: state.lights,
          interactables: state.interactables,
          thermostat: state.thermostat,
          doNotDisturb: state.doNotDisturb,
          curtainsOpen: state.curtainsOpen,
          tv: state.tv,
          minibar: state.minibar,
          currentLightScene: state.currentLightScene,
        }),
      }
    )
  )
)

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS UTILITAIRES — Rétrocompatibles
// ════════════════════════════════════════════════════════════════════════════

// Sélecteurs dérivés optimisés
export const useDoors = () => useEtherWorldStore(s => s.doors)
export const useLights = () => useEtherWorldStore(s => s.lights)
export const useInteractables = () => useEtherWorldStore(s => s.interactables)
export const usePlayerCard = () => useEtherWorldStore(s => s.playerCard)
export const useRoomStats = () => useEtherWorldStore(s => s.roomStats)
export const useThermostat = () => useEtherWorldStore(s => s.thermostat)
export const useTV = () => useEtherWorldStore(s => s.tv)
export const useNotifications = () => useEtherWorldStore(s => s.notifications)
export const useSecurityLogs = () => useEtherWorldStore(s => s.securityLogs)
export const useMinibar = () => useEtherWorldStore(s => s.minibar)
export const useServiceRequests = () => useEtherWorldStore(s => s.serviceRequests)
export const useLightScene = () => useEtherWorldStore(s => s.currentLightScene)
export const useGameTime = () => useEtherWorldStore(s => s.gameTime)
export const useDoNotDisturb = () => useEtherWorldStore(s => s.doNotDisturb)
export const useCurtains = () => useEtherWorldStore(s => s.curtainsOpen)
export const useAlarm = () => useEtherWorldStore(s => s.alarmActive)
export const useCurrentView = () => useEtherWorldStore(s => s.currentView)