import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

// ════════════════════════════════════════════════════════════════════════════
//  TYPES COMPLETS POUR ETHERWORLD RP — ENRICHIS
// ════════════════════════════════════════════════════════════════════════════

export type Weather = 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'hail' | 'blizzard'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type TimePhase = 'night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening'
export type GameMode = 'rp' | 'builder' | 'admin' | 'spectator'
export type ItemCategory = 'weapon' | 'clothing' | 'consumable' | 'key' | 'furniture' | 'misc' | 'currency' | 'quest' | 'tool' | 'vehicle'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
export type PlayerStatus = 'online' | 'away' | 'busy' | 'invisible'
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loot' | 'quest'

// ────────────────────────────────────────────────────────────────
// CHAT
// ────────────────────────────────────────────────────────────────

export type ChatChannel = 'global' | 'local' | 'team' | 'admin' | 'system' | 'trade' | 'rp'

export interface ChatMessage {
  id: string
  sender: string
  senderId?: string
  content: string
  type: 'chat' | 'system' | 'admin' | 'emote' | 'whisper' | 'announcement'
  channel: ChatChannel
  timestamp: number
  read: boolean
  replyTo?: string
}

// ────────────────────────────────────────────────────────────────
// BUILDER
// ────────────────────────────────────────────────────────────────

export interface PlacedObject {
  id: string
  type: string
  label: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
  metalness: number
  roughness: number
  opacity: number
  wireframe: boolean
  dim: string
  locked: boolean
  visible: boolean
  tags: string[]
  createdAt: number
  createdBy: string
  layer: number
}

export interface BuilderHistory {
  action: 'place' | 'move' | 'delete' | 'modify'
  objectId: string
  before: Partial<PlacedObject> | null
  after: Partial<PlacedObject> | null
  timestamp: number
}

// ────────────────────────────────────────────────────────────────
// INVENTORY
// ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string
  name: string
  description: string
  lore?: string
  icon: string
  category: ItemCategory
  rarity: ItemRarity
  stackable: boolean
  maxStack: number
  quantity: number
  weight: number
  value: number
  usable: boolean
  tradeable: boolean
  dropable: boolean
  questItem: boolean
  durability?: number
  maxDurability?: number
  stats?: Record<string, number>
  requiredLevel?: number
  tags?: string[]
  customData?: Record<string, unknown>
}

export interface InventorySlot {
  slotId: number
  item: InventoryItem | null
  locked: boolean
  favorite: boolean
  hotbar: boolean
}

export interface Equipment {
  head: InventoryItem | null
  chest: InventoryItem | null
  legs: InventoryItem | null
  feet: InventoryItem | null
  hands: InventoryItem | null
  mainHand: InventoryItem | null
  offHand: InventoryItem | null
  accessory1: InventoryItem | null
  accessory2: InventoryItem | null
}

// ────────────────────────────────────────────────────────────────
// PLAYER
// ────────────────────────────────────────────────────────────────

export interface PlayerStats {
  health: number
  maxHealth: number
  hunger: number
  maxHunger: number
  thirst: number
  maxThirst: number
  energy: number
  maxEnergy: number
  money: number
  bank: number
  experience: number
  level: number
  xpToNext: number
  reputation: number
  stress: number
  hygiene: number
  warmth: number
}

export interface PlayerSkills {
  cooking: number
  driving: number
  crafting: number
  trading: number
  stealth: number
  persuasion: number
  athletics: number
  medicine: number
}

export interface PlayerProfile {
  id: string
  name: string
  status: PlayerStatus
  joinedAt: number
  playtime: number
  lastSeen: number
  title: string
  badge: string
  bio: string
  isAdmin: boolean
  isModerator: boolean
  isVip: boolean
}

// ────────────────────────────────────────────────────────────────
// CONTEXT MENU
// ────────────────────────────────────────────────────────────────

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  objectId: string
  objectType: string
  targetPosition?: [number, number, number]
}

// ────────────────────────────────────────────────────────────────
// ADMIN
// ────────────────────────────────────────────────────────────────

export interface AdminEffect {
  id: string
  type: 'tp' | 'jail' | 'freeze' | 'storm' | 'spotlight' | 'explosion' | 'rain' | 'earthquake' | 'blackout'
  position: [number, number, number]
  target: string
  startTime: number
  duration: number
  intensity?: number
  radius?: number
  color?: string
}

export interface AdminAction {
  id: string
  action: string
  target: string
  details: string
  timestamp: number
  adminId: string
}

// ────────────────────────────────────────────────────────────────
// QUÊTES
// ────────────────────────────────────────────────────────────────

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed'
export type QuestObjectiveType = 'collect' | 'deliver' | 'talk' | 'kill' | 'explore' | 'craft'

export interface QuestObjective {
  id: string
  type: QuestObjectiveType
  description: string
  current: number
  target: number
  completed: boolean
}

export interface Quest {
  id: string
  title: string
  description: string
  giver: string
  status: QuestStatus
  objectives: QuestObjective[]
  rewards: { xp: number; money: number; items?: InventoryItem[] }
  startedAt?: number
  completedAt?: number
  timeLimit?: number
}

// ────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration: number
  timestamp: number
  read: boolean
  icon?: string
  action?: { label: string; callback: () => void }
}

// ────────────────────────────────────────────────────────────────
// MINI-MAP
// ────────────────────────────────────────────────────────────────

export interface MapMarker {
  id: string
  label: string
  position: [number, number, number]
  icon: string
  color: string
  visible: boolean
  category: 'poi' | 'player' | 'quest' | 'danger' | 'shop' | 'custom'
}

// ════════════════════════════════════════════════════════════════════════════
//  CONSTANTS — ENRICHIS
// ════════════════════════════════════════════════════════════════════════════

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ec4899',
}

export const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
  mythic: 'Mythique',
}

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  weapon: '🗡️',
  clothing: '👕',
  consumable: '🍎',
  key: '🔑',
  furniture: '🪑',
  misc: '📦',
  currency: '💰',
  quest: '📜',
  tool: '🔧',
  vehicle: '🚗',
}

export const WEATHER_LABELS: Record<Weather, string> = {
  clear: '☀️ Dégagé',
  rain: '🌧️ Pluie',
  snow: '❄️ Neige',
  fog: '🌫️ Brouillard',
  storm: '⛈️ Orage',
  hail: '🌨️ Grêle',
  blizzard: '🌬️ Blizzard',
}

export const TIME_PHASES: Record<TimePhase, { label: string; icon: string; color: string }> = {
  night: { label: 'Nuit', icon: '🌙', color: '#1a1040' },
  dawn: { label: 'Aube', icon: '🌅', color: '#f59e0b' },
  morning: { label: 'Matin', icon: '☀️', color: '#fbbf24' },
  noon: { label: 'Midi', icon: '🌤️', color: '#f97316' },
  afternoon: { label: 'Après-midi', icon: '⛅', color: '#fb923c' },
  dusk: { label: 'Crépuscule', icon: '🌆', color: '#a855f7' },
  evening: { label: 'Soir', icon: '🌃', color: '#6366f1' },
}

export const MAX_INVENTORY_WEIGHT = 50
export const MAX_CHAT_MESSAGES = 200
export const NOTIFICATION_DURATION_DEFAULT = 4000
export const XP_PER_LEVEL_BASE = 100

// ════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════════════

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now(): number {
  return Date.now()
}

function getTimePhase(timeOfDay: number): TimePhase {
  if (timeOfDay >= 0 && timeOfDay < 5) return 'night'
  if (timeOfDay >= 5 && timeOfDay < 7) return 'dawn'
  if (timeOfDay >= 7 && timeOfDay < 12) return 'morning'
  if (timeOfDay >= 12 && timeOfDay < 14) return 'noon'
  if (timeOfDay >= 14 && timeOfDay < 18) return 'afternoon'
  if (timeOfDay >= 18 && timeOfDay < 20) return 'dusk'
  if (timeOfDay >= 20 && timeOfDay < 24) return 'evening'
  return 'night'
}

function calcXpToNext(level: number): number {
  return Math.floor(XP_PER_LEVEL_BASE * Math.pow(1.15, level - 1))
}

// ════════════════════════════════════════════════════════════════════════════
//  ÉTAT PAR DÉFAUT
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_PLAYER_STATS: PlayerStats = {
  health: 100, maxHealth: 100,
  hunger: 80, maxHunger: 100,
  thirst: 75, maxThirst: 100,
  energy: 90, maxEnergy: 100,
  money: 2500, bank: 10000,
  experience: 0, level: 1,
  xpToNext: XP_PER_LEVEL_BASE,
  reputation: 50,
  stress: 20,
  hygiene: 85,
  warmth: 80,
}

const DEFAULT_PLAYER_SKILLS: PlayerSkills = {
  cooking: 1, driving: 1, crafting: 1, trading: 1,
  stealth: 1, persuasion: 1, athletics: 1, medicine: 1,
}

const DEFAULT_EQUIPMENT: Equipment = {
  head: null, chest: null, legs: null, feet: null, hands: null,
  mainHand: null, offHand: null, accessory1: null, accessory2: null,
}

const DEFAULT_PROFILE: PlayerProfile = {
  id: uid(), name: 'Joueur', status: 'online',
  joinedAt: now(), playtime: 0, lastSeen: now(),
  title: 'Citoyen', badge: '⭐', bio: '',
  isAdmin: false, isModerator: false, isVip: false,
}

// ════════════════════════════════════════════════════════════════════════════
//  INTERFACE DU STORE
// ════════════════════════════════════════════════════════════════════════════

interface GameState {
  // ── SESSION ──
  sessionStarted: boolean
  sessionId: string
  setSessionStarted: (v: boolean) => void

  // ── PROFIL JOUEUR ──
  playerProfile: PlayerProfile
  updateProfile: (patch: Partial<PlayerProfile>) => void

  // ── STATS JOUEUR ──
  playerStats: PlayerStats
  updateStats: (patch: Partial<PlayerStats>) => void
  addMoney: (amount: number) => void
  removeMoney: (amount: number) => boolean
  addXp: (amount: number) => void
  healPlayer: (amount: number) => void
  damagePlayer: (amount: number) => void
  feed: (hunger?: number, thirst?: number) => void
  rest: (energy: number) => void

  // ── COMPÉTENCES ──
  playerSkills: PlayerSkills
  increaseSkill: (skill: keyof PlayerSkills, amount?: number) => void

  // ── ÉQUIPEMENT ──
  equipment: Equipment
  equip: (slot: keyof Equipment, item: InventoryItem | null) => void

  // ── POSITION & MOUVEMENT ──
  playerPos: [number, number, number]
  playerRotation: number
  setPlayerPos: (pos: [number, number, number]) => void
  playerAction: string | null
  setPlayerAction: (action: string | null) => void
  isSprinting: boolean
  isCrouching: boolean
  isJumping: boolean
  setSprinting: (v: boolean) => void
  setCrouching: (v: boolean) => void

  // ── TEMPS & MÉTÉO ──
  timeOfDay: number
  timePhase: TimePhase
  weather: Weather
  season: Season
  setTimeOfDay: (t: number) => void
  setWeather: (w: Weather) => void
  setSeason: (s: Season) => void
  advanceTime: (hours?: number) => void

  // ── MODE JEUX ──
  gameMode: GameMode
  rpMode: boolean
  buildMode: boolean
  isGodMode: boolean
  flyMode: boolean
  isSpectator: boolean
  setGameMode: (mode: GameMode) => void
  toggleBuildMode: () => void
  toggleGodMode: () => void
  toggleFlyMode: () => void
  toggleSpectator: () => void

  // ── BUILDER ──
  selectedModelType: string | null
  movingPlacedId: string | null
  placedObjects: PlacedObject[]
  selectedPlacedId: string | null
  gridSnap: boolean
  snapSize: number
  isGizmoDragging: boolean
  builderHistory: BuilderHistory[]
  builderLayer: number
  placedCount: number
  selectModel: (type: string | null) => void
  selectPlaced: (id: string | null) => void
  placeObject: (obj: Omit<PlacedObject, 'id' | 'createdAt' | 'createdBy'>) => string
  updatePlaced: (id: string, patch: Partial<PlacedObject>) => void
  deletePlaced: (id: string) => void
  duplicatePlaced: (id: string) => void
  clearPlaced: () => void
  undoBuilder: () => void
  setGridSnap: (v: boolean) => void
  setSnapSize: (s: number) => void
  setBuilderLayer: (l: number) => void
  setIsGizmoDragging: (v: boolean) => void
  setMode: (mode: 'select' | 'place' | 'move') => void

  // ── CONTEXT MENU ──
  contextMenu: ContextMenuState | null
  showContextMenu: (ctx: ContextMenuState) => void
  hideContextMenu: () => void

  // ── CHAT ──
  chatOpen: boolean
  chatChannel: ChatChannel
  chatMessages: ChatMessage[]
  unreadCount: number
  setChatOpen: (open: boolean) => void
  setChatChannel: (ch: ChatChannel) => void
  addChatMessage: (sender: string, content: string, type?: ChatMessage['type'], channel?: ChatChannel) => void
  clearChat: () => void
  markChatRead: () => void

  // ── ADMIN ──
  adminOpen: boolean
  adminEffects: AdminEffect[]
  adminLog: AdminAction[]
  setAdminOpen: (open: boolean) => void
  addAdminEffect: (type: AdminEffect['type'], pos: [number, number, number], target: string, duration: number, opts?: Partial<AdminEffect>) => void
  removeAdminEffect: (id: string) => void
  logAdminAction: (action: string, target: string, details: string) => void

  // ── NOTIFICATIONS ──
  notification: string | null
  notifications: Notification[]
  setNotification: (msg: string | null, type?: NotificationType, duration?: number, icon?: string) => void
  addNotification: (msg: string, type?: NotificationType, duration?: number, icon?: string) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void

  // ── INVENTAIRE ──
  inventoryOpen: boolean
  inventorySlots: InventorySlot[]
  selectedSlot: number | null
  equipment_open: boolean
  hotbarSlots: number[]
  activeHotbar: number
  setInventoryOpen: (open: boolean) => void
  selectSlot: (slotId: number | null) => void
  addItem: (item: InventoryItem) => boolean
  removeItem: (slotId: number, quantity?: number) => boolean
  moveItem: (fromSlot: number, toSlot: number) => boolean
  useItem: (slotId: number) => boolean
  splitStack: (slotId: number, amount: number) => boolean
  favoriteSlot: (slotId: number) => void
  lockSlot: (slotId: number) => void
  clearInventory: () => void
  getTotalWeight: () => number
  sortInventory: (by: 'name' | 'rarity' | 'category' | 'weight' | 'value') => void
  searchInventory: (query: string) => InventorySlot[]
  getItemsByCategory: (cat: ItemCategory) => InventoryItem[]
  getItemCount: (itemId: string) => number
  hasItem: (itemId: string, quantity?: number) => boolean
  setActiveHotbar: (idx: number) => void

  // ── QUÊTES ──
  quests: Quest[]
  activeQuestId: string | null
  addQuest: (quest: Quest) => void
  updateQuest: (id: string, patch: Partial<Quest>) => void
  completeObjective: (questId: string, objectiveId: string) => void
  setActiveQuest: (id: string | null) => void
  getActiveQuests: () => Quest[]
  getCompletedQuests: () => Quest[]

  // ── MINI-MAP ──
  mapVisible: boolean
  mapMarkers: MapMarker[]
  setMapVisible: (v: boolean) => void
  addMapMarker: (marker: Omit<MapMarker, 'id'>) => string
  removeMapMarker: (id: string) => void
  updateMapMarker: (id: string, patch: Partial<MapMarker>) => void

  // ── MISC UI ──
  hudVisible: boolean
  crosshairVisible: boolean
  fpsVisible: boolean
  minimapVisible: boolean
  setHudVisible: (v: boolean) => void
  setCrosshairVisible: (v: boolean) => void
  setFpsVisible: (v: boolean) => void
  setMinimapVisible: (v: boolean) => void
}

// ════════════════════════════════════════════════════════════════════════════
//  STORE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export const useStore = create<GameState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ── SESSION ──
        sessionStarted: false,
        sessionId: uid(),
        setSessionStarted: (v) => set({ sessionStarted: v }),

        // ── PROFIL ──
        playerProfile: DEFAULT_PROFILE,
        updateProfile: (patch) => set(s => ({ playerProfile: { ...s.playerProfile, ...patch } })),

        // ── STATS ──
        playerStats: DEFAULT_PLAYER_STATS,
        updateStats: (patch) => set(s => ({ playerStats: { ...s.playerStats, ...patch } })),

        addMoney: (amount) => set(s => ({ playerStats: { ...s.playerStats, money: s.playerStats.money + amount } })),

        removeMoney: (amount) => {
          const state = get()
          if (state.playerStats.money < amount) {
            state.addNotification('Pas assez d\'argent!', 'error')
            return false
          }
          set(s => ({ playerStats: { ...s.playerStats, money: s.playerStats.money - amount } }))
          return true
        },

        addXp: (amount) => {
          const state = get()
          const stats = state.playerStats
          let newXp = stats.experience + amount
          let newLevel = stats.level
          let newXpToNext = stats.xpToNext

          while (newXp >= newXpToNext) {
            newXp -= newXpToNext
            newLevel++
            newXpToNext = calcXpToNext(newLevel)
            state.addNotification(`🎉 Niveau ${newLevel} atteint!`, 'success', 5000, '⭐')
          }

          set(s => ({
            playerStats: { ...s.playerStats, experience: newXp, level: newLevel, xpToNext: newXpToNext },
          }))
        },

        healPlayer: (amount) => set(s => ({
          playerStats: {
            ...s.playerStats,
            health: Math.min(s.playerStats.health + amount, s.playerStats.maxHealth),
          },
        })),

        damagePlayer: (amount) => {
          set(s => ({
            playerStats: {
              ...s.playerStats,
              health: Math.max(0, s.playerStats.health - amount),
            },
          }))
          if (get().playerStats.health <= 0) {
            get().addNotification('Vous êtes tombé!', 'error', 6000, '💀')
          }
        },

        feed: (hunger = 20, thirst = 15) => set(s => ({
          playerStats: {
            ...s.playerStats,
            hunger: Math.min(s.playerStats.hunger + hunger, s.playerStats.maxHunger),
            thirst: Math.min(s.playerStats.thirst + thirst, s.playerStats.maxThirst),
          },
        })),

        rest: (energy) => set(s => ({
          playerStats: {
            ...s.playerStats,
            energy: Math.min(s.playerStats.energy + energy, s.playerStats.maxEnergy),
          },
        })),

        // ── COMPÉTENCES ──
        playerSkills: DEFAULT_PLAYER_SKILLS,
        increaseSkill: (skill, amount = 1) => set(s => ({
          playerSkills: { ...s.playerSkills, [skill]: Math.min(100, s.playerSkills[skill] + amount) },
        })),

        // ── ÉQUIPEMENT ──
        equipment: DEFAULT_EQUIPMENT,
        equip: (slot, item) => set(s => ({ equipment: { ...s.equipment, [slot]: item } })),

        // ── POSITION ──
        playerPos: [0, 0, 0],
        playerRotation: 0,
        setPlayerPos: (pos) => set({ playerPos: pos }),
        playerAction: null,
        setPlayerAction: (action) => set({ playerAction: action }),
        isSprinting: false,
        isCrouching: false,
        isJumping: false,
        setSprinting: (v) => set({ isSprinting: v }),
        setCrouching: (v) => set({ isCrouching: v }),

        // ── TEMPS & MÉTÉO ──
        timeOfDay: 22,
        timePhase: 'evening',
        weather: 'clear',
        season: 'winter',

        setTimeOfDay: (t) => {
          const clamped = ((t % 24) + 24) % 24
          set({ timeOfDay: clamped, timePhase: getTimePhase(clamped) })
        },

        setWeather: (w) => {
          set({ weather: w })
          get().addNotification(`${WEATHER_LABELS[w]}`, 'info', 3000, '🌦️')
        },

        setSeason: (s) => set({ season: s }),

        advanceTime: (hours = 1) => {
          const current = get().timeOfDay
          get().setTimeOfDay(current + hours)
          // Dégradation naturelle des stats
          set(s => ({
            playerStats: {
              ...s.playerStats,
              hunger: Math.max(0, s.playerStats.hunger - hours * 2),
              thirst: Math.max(0, s.playerStats.thirst - hours * 3),
              energy: Math.max(0, s.playerStats.energy - hours * 1.5),
            },
          }))
        },

        // ── MODES ──
        gameMode: 'rp',
        rpMode: true,
        buildMode: false,
        isGodMode: false,
        flyMode: false,
        isSpectator: false,

        setGameMode: (mode) => {
          set({
            gameMode: mode,
            rpMode: mode === 'rp',
            buildMode: mode === 'builder',
            isSpectator: mode === 'spectator',
          })
          get().addNotification(`Mode: ${mode.toUpperCase()}`, 'info', 2000)
        },

        toggleBuildMode: () => {
          const current = get().buildMode
          get().setGameMode(current ? 'rp' : 'builder')
        },

        toggleGodMode: () => {
          const next = !get().isGodMode
          set({ isGodMode: next, flyMode: next })
          get().addNotification(next ? '⚡ Mode Dieu activé' : 'Mode Dieu désactivé', next ? 'warning' : 'info', 2000)
        },

        toggleFlyMode: () => {
          const next = !get().flyMode
          set({ flyMode: next })
          get().addNotification(next ? '✈️ Vol activé' : 'Vol désactivé', 'info', 2000)
        },

        toggleSpectator: () => {
          const current = get().isSpectator
          get().setGameMode(current ? 'rp' : 'spectator')
        },

        // ── BUILDER ──
        selectedModelType: null,
        movingPlacedId: null,
        placedObjects: [],
        selectedPlacedId: null,
        gridSnap: true,
        snapSize: 0.5,
        isGizmoDragging: false,
        builderHistory: [],
        builderLayer: 0,
        placedCount: 0,

        selectModel: (type) => set({ selectedModelType: type }),
        selectPlaced: (id) => set({ selectedPlacedId: id }),

        placeObject: (obj) => {
          const id = uid()
          const full: PlacedObject = {
            ...obj,
            id,
            locked: obj.locked ?? false,
            visible: obj.visible ?? true,
            tags: obj.tags ?? [],
            createdAt: now(),
            createdBy: get().playerProfile.name,
          }
          set(s => ({
            placedObjects: [...s.placedObjects, full],
            placedCount: s.placedCount + 1,
            builderHistory: [
              { action: 'place', objectId: id, before: null, after: full, timestamp: now() },
              ...s.builderHistory.slice(0, 49),
            ],
          }))
          return id
        },

        updatePlaced: (id, patch) => {
          const before = get().placedObjects.find(o => o.id === id)
          set(s => ({
            placedObjects: s.placedObjects.map(o => o.id === id ? { ...o, ...patch } : o),
            builderHistory: [
              { action: 'modify', objectId: id, before: before ?? null, after: { ...before, ...patch }, timestamp: now() },
              ...s.builderHistory.slice(0, 49),
            ],
          }))
        },

        deletePlaced: (id) => {
          const before = get().placedObjects.find(o => o.id === id)
          set(s => ({
            placedObjects: s.placedObjects.filter(o => o.id !== id),
            selectedPlacedId: s.selectedPlacedId === id ? null : s.selectedPlacedId,
            builderHistory: [
              { action: 'delete', objectId: id, before: before ?? null, after: null, timestamp: now() },
              ...s.builderHistory.slice(0, 49),
            ],
          }))
        },

        duplicatePlaced: (id) => {
          const obj = get().placedObjects.find(o => o.id === id)
          if (!obj) return
          const newObj = { ...obj, position: [obj.position[0] + 1, obj.position[1], obj.position[2]] as [number, number, number] }
          get().placeObject(newObj)
        },

        clearPlaced: () => set({ placedObjects: [], builderHistory: [] }),

        undoBuilder: () => {
          const state = get()
          const last = state.builderHistory[0]
          if (!last) return

          if (last.action === 'place') {
            set(s => ({ placedObjects: s.placedObjects.filter(o => o.id !== last.objectId) }))
          } else if (last.action === 'delete' && last.before) {
            set(s => ({ placedObjects: [...s.placedObjects, last.before as PlacedObject] }))
          } else if (last.action === 'modify' && last.before) {
            set(s => ({ placedObjects: s.placedObjects.map(o => o.id === last.objectId ? { ...o, ...last.before } : o) }))
          }

          set(s => ({ builderHistory: s.builderHistory.slice(1) }))
        },

        setGridSnap: (v) => set({ gridSnap: v }),
        setSnapSize: (s) => set({ snapSize: s }),
        setBuilderLayer: (l) => set({ builderLayer: l }),
        setIsGizmoDragging: (v) => set({ isGizmoDragging: v }),

        setMode: (mode) => {
          if (mode === 'place') set({ movingPlacedId: null })
          else if (mode === 'select') set({ selectedModelType: null, movingPlacedId: null })
        },

        // ── CONTEXT MENU ──
        contextMenu: null,
        showContextMenu: (ctx) => set({ contextMenu: ctx }),
        hideContextMenu: () => set({ contextMenu: null }),

        // ── CHAT ──
        chatOpen: false,
        chatChannel: 'local',
        chatMessages: [],
        unreadCount: 0,

        setChatOpen: (open) => {
          set({ chatOpen: open })
          if (open) get().markChatRead()
        },

        setChatChannel: (ch) => set({ chatChannel: ch }),

        addChatMessage: (sender, content, type = 'chat', channel = 'local') => {
          const msg: ChatMessage = {
            id: uid(), sender, content, type, channel,
            timestamp: now(), read: get().chatOpen,
          }
          set(s => ({
            chatMessages: [...s.chatMessages.slice(-(MAX_CHAT_MESSAGES - 1)), msg],
            unreadCount: s.chatOpen ? 0 : s.unreadCount + 1,
          }))
        },

        clearChat: () => set({ chatMessages: [], unreadCount: 0 }),
        markChatRead: () => set({ unreadCount: 0, chatMessages: get().chatMessages.map(m => ({ ...m, read: true })) }),

        // ── ADMIN ──
        adminOpen: false,
        adminEffects: [],
        adminLog: [],

        setAdminOpen: (open) => set({ adminOpen: open }),

        addAdminEffect: (type, pos, target, duration, opts = {}) => {
          const effect: AdminEffect = {
            id: uid(), type, position: pos, target,
            startTime: now(), duration, ...opts,
          }
          set(s => ({ adminEffects: [...s.adminEffects, effect] }))
          setTimeout(() => {
            set(s => ({ adminEffects: s.adminEffects.filter(e => e.id !== effect.id) }))
          }, duration)
        },

        removeAdminEffect: (id) => set(s => ({ adminEffects: s.adminEffects.filter(e => e.id !== id) })),

        logAdminAction: (action, target, details) => {
          const state = get()
          const entry: AdminAction = {
            id: uid(), action, target, details,
            timestamp: now(), adminId: state.playerProfile.id,
          }
          set(s => ({ adminLog: [entry, ...s.adminLog].slice(0, 100) }))
        },

        // ── NOTIFICATIONS ──
        notification: null,
        notifications: [],

        setNotification: (msg, type = 'info', duration = NOTIFICATION_DURATION_DEFAULT, icon) => {
          set({ notification: msg })
          if (msg) {
            get().addNotification(msg, type, duration, icon)
            setTimeout(() => set({ notification: null }), duration)
          }
        },

        addNotification: (msg, type = 'info', duration = NOTIFICATION_DURATION_DEFAULT, icon) => {
          const notif: Notification = {
            id: uid(), message: msg, type, duration, timestamp: now(), read: false, icon,
          }
          set(s => ({ notifications: [notif, ...s.notifications].slice(0, 30) }))
          if (duration > 0) {
            setTimeout(() => {
              set(s => ({ notifications: s.notifications.filter(n => n.id !== notif.id) }))
            }, duration)
          }
        },

        dismissNotification: (id) => set(s => ({
          notifications: s.notifications.filter(n => n.id !== id),
        })),

        clearNotifications: () => set({ notifications: [] }),

        // ── INVENTAIRE ──
        inventoryOpen: false,
        inventorySlots: Array.from({ length: 40 }, (_, i) => ({
          slotId: i, item: null, locked: false, favorite: false, hotbar: i < 8,
        })),
        selectedSlot: null,
        equipment_open: false,
        hotbarSlots: [0, 1, 2, 3, 4, 5, 6, 7],
        activeHotbar: 0,

        setInventoryOpen: (open) => set({ inventoryOpen: open }),
        selectSlot: (slotId) => set({ selectedSlot: slotId }),
        setActiveHotbar: (idx) => set({ activeHotbar: idx }),

        addItem: (item) => {
          const state = get()
          if (state.getTotalWeight() + item.weight * item.quantity > MAX_INVENTORY_WEIGHT) {
            state.addNotification('Inventaire trop lourd!', 'error', 3000, '⚖️')
            return false
          }

          // Empilage
          if (item.stackable) {
            const existingSlot = state.inventorySlots.find(
              s => s.item?.id === item.id && s.item.quantity < s.item.maxStack && !s.locked
            )
            if (existingSlot && existingSlot.item) {
              const spaceLeft = existingSlot.item.maxStack - existingSlot.item.quantity
              const toAdd = Math.min(spaceLeft, item.quantity)
              set(s => ({
                inventorySlots: s.inventorySlots.map(sl =>
                  sl.slotId === existingSlot.slotId
                    ? { ...sl, item: { ...sl.item!, quantity: sl.item!.quantity + toAdd } }
                    : sl
                ),
              }))
              if (toAdd < item.quantity) return get().addItem({ ...item, quantity: item.quantity - toAdd })
              state.addNotification(`+${item.quantity} ${item.name}`, 'loot', 3000, item.icon)
              return true
            }
          }

          // Slot vide
          const emptySlot = state.inventorySlots.find(s => s.item === null && !s.locked)
          if (!emptySlot) {
            state.addNotification('Inventaire plein!', 'error', 3000, '📦')
            return false
          }

          set(s => ({
            inventorySlots: s.inventorySlots.map(sl =>
              sl.slotId === emptySlot.slotId ? { ...sl, item } : sl
            ),
          }))

          state.addNotification(`+${item.quantity} ${item.name}`, 'loot', 3000, item.icon)
          return true
        },

        removeItem: (slotId, quantity = 1) => {
          const slot = get().inventorySlots.find(s => s.slotId === slotId)
          if (!slot?.item || slot.locked) return false
          if (slot.item.quantity <= quantity) {
            set(s => ({ inventorySlots: s.inventorySlots.map(sl => sl.slotId === slotId ? { ...sl, item: null } : sl) }))
          } else {
            set(s => ({
              inventorySlots: s.inventorySlots.map(sl =>
                sl.slotId === slotId ? { ...sl, item: { ...sl.item!, quantity: sl.item!.quantity - quantity } } : sl
              ),
            }))
          }
          return true
        },

        moveItem: (fromSlot, toSlot) => {
          const state = get()
          const from = state.inventorySlots.find(s => s.slotId === fromSlot)
          const to = state.inventorySlots.find(s => s.slotId === toSlot)
          if (!from || !to || from.locked || to.locked) return false

          // Empilage lors du move
          if (from.item && to.item && from.item.id === to.item.id && from.item.stackable) {
            const space = to.item.maxStack - to.item.quantity
            if (space > 0) {
              const toMove = Math.min(from.item.quantity, space)
              set(s => ({
                inventorySlots: s.inventorySlots.map(sl => {
                  if (sl.slotId === fromSlot) {
                    const remaining = sl.item!.quantity - toMove
                    return { ...sl, item: remaining > 0 ? { ...sl.item!, quantity: remaining } : null }
                  }
                  if (sl.slotId === toSlot) return { ...sl, item: { ...sl.item!, quantity: sl.item!.quantity + toMove } }
                  return sl
                }),
              }))
              return true
            }
          }

          set(s => ({
            inventorySlots: s.inventorySlots.map(sl => {
              if (sl.slotId === fromSlot) return { ...sl, item: to.item }
              if (sl.slotId === toSlot) return { ...sl, item: from.item }
              return sl
            }),
          }))
          return true
        },

        useItem: (slotId) => {
          const state = get()
          const slot = state.inventorySlots.find(s => s.slotId === slotId)
          if (!slot?.item?.usable) return false

          state.addNotification(`Utilise ${slot.item.name}`, 'info', 2000, slot.item.icon)

          if (slot.item.category === 'consumable') {
            if (slot.item.stats) {
              const stats = slot.item.stats
              if (stats.health) state.healPlayer(stats.health)
              if (stats.hunger) state.feed(stats.hunger, stats.thirst || 0)
              if (stats.energy) state.rest(stats.energy)
              if (stats.money) state.addMoney(stats.money)
            }
            state.removeItem(slotId, 1)
            state.increaseSkill('medicine', 0.1)
          }

          return true
        },

        splitStack: (slotId, amount) => {
          const state = get()
          const slot = state.inventorySlots.find(s => s.slotId === slotId)
          if (!slot?.item?.stackable || slot.item.quantity <= amount) return false

          const emptySlot = state.inventorySlots.find(s => s.item === null && !s.locked && s.slotId !== slotId)
          if (!emptySlot) return false

          set(s => ({
            inventorySlots: s.inventorySlots.map(sl => {
              if (sl.slotId === slotId) return { ...sl, item: { ...sl.item!, quantity: sl.item!.quantity - amount } }
              if (sl.slotId === emptySlot.slotId) return { ...sl, item: { ...slot.item!, quantity: amount } }
              return sl
            }),
          }))
          return true
        },

        favoriteSlot: (slotId) => set(s => ({
          inventorySlots: s.inventorySlots.map(sl =>
            sl.slotId === slotId ? { ...sl, favorite: !sl.favorite } : sl
          ),
        })),

        lockSlot: (slotId) => set(s => ({
          inventorySlots: s.inventorySlots.map(sl =>
            sl.slotId === slotId ? { ...sl, locked: !sl.locked } : sl
          ),
        })),

        clearInventory: () => set(s => ({
          inventorySlots: s.inventorySlots.map(sl => sl.locked ? sl : { ...sl, item: null }),
        })),

        getTotalWeight: () => get().inventorySlots.reduce((w, s) => {
          return w + (s.item ? s.item.weight * s.item.quantity : 0)
        }, 0),

        sortInventory: (by) => {
          const state = get()
          const rarityOrder: Record<ItemRarity, number> = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 }
          const unlocked = state.inventorySlots.filter(s => !s.locked)
          const locked = state.inventorySlots.filter(s => s.locked)
          const items = unlocked.filter(s => s.item !== null).map(s => s.item!)
          const empties = unlocked.filter(s => s.item === null).length

          items.sort((a, b) => {
            switch (by) {
              case 'name': return a.name.localeCompare(b.name, 'fr')
              case 'rarity': return rarityOrder[b.rarity] - rarityOrder[a.rarity]
              case 'category': return a.category.localeCompare(b.category, 'fr')
              case 'weight': return b.weight - a.weight
              case 'value': return b.value - a.value
              default: return 0
            }
          })

          const newSlots: InventorySlot[] = [
            ...unlocked.map((sl, i) => ({ ...sl, item: items[i] || null })),
            ...locked,
          ].sort((a, b) => a.slotId - b.slotId)

          set({ inventorySlots: newSlots })
        },

        searchInventory: (query) => {
          const q = query.toLowerCase()
          return get().inventorySlots.filter(s =>
            s.item && (
              s.item.name.toLowerCase().includes(q) ||
              s.item.description.toLowerCase().includes(q) ||
              s.item.category.toLowerCase().includes(q) ||
              s.item.tags?.some(t => t.toLowerCase().includes(q))
            )
          )
        },

        getItemsByCategory: (cat) =>
          get().inventorySlots.filter(s => s.item?.category === cat).map(s => s.item!),

        getItemCount: (itemId) =>
          get().inventorySlots.reduce((count, s) => {
            return count + (s.item?.id === itemId ? s.item.quantity : 0)
          }, 0),

        hasItem: (itemId, quantity = 1) => get().getItemCount(itemId) >= quantity,

        // ── QUÊTES ──
        quests: [],
        activeQuestId: null,

        addQuest: (quest) => {
          set(s => ({ quests: [...s.quests, quest] }))
          get().addNotification(`📜 Nouvelle quête: ${quest.title}`, 'quest', 5000)
        },

        updateQuest: (id, patch) => set(s => ({
          quests: s.quests.map(q => q.id === id ? { ...q, ...patch } : q),
        })),

        completeObjective: (questId, objectiveId) => {
          const state = get()
          const quest = state.quests.find(q => q.id === questId)
          if (!quest) return

          const newObjectives = quest.objectives.map(o =>
            o.id === objectiveId
              ? { ...o, current: Math.min(o.current + 1, o.target), completed: o.current + 1 >= o.target }
              : o
          )

          const allDone = newObjectives.every(o => o.completed)

          if (allDone) {
            state.addXp(quest.rewards.xp)
            state.addMoney(quest.rewards.money)
            if (quest.rewards.items) quest.rewards.items.forEach(item => state.addItem(item))
            state.addNotification(`✅ Quête terminée: ${quest.title}`, 'success', 6000)
          }

          state.updateQuest(questId, {
            objectives: newObjectives,
            status: allDone ? 'completed' : 'active',
            completedAt: allDone ? now() : undefined,
          })
        },

        setActiveQuest: (id) => set({ activeQuestId: id }),
        getActiveQuests: () => get().quests.filter(q => q.status === 'active'),
        getCompletedQuests: () => get().quests.filter(q => q.status === 'completed'),

        // ── MINI-MAP ──
        mapVisible: true,
        mapMarkers: [],
        setMapVisible: (v) => set({ mapVisible: v }),

        addMapMarker: (marker) => {
          const id = uid()
          set(s => ({ mapMarkers: [...s.mapMarkers, { ...marker, id }] }))
          return id
        },

        removeMapMarker: (id) => set(s => ({ mapMarkers: s.mapMarkers.filter(m => m.id !== id) })),
        updateMapMarker: (id, patch) => set(s => ({
          mapMarkers: s.mapMarkers.map(m => m.id === id ? { ...m, ...patch } : m),
        })),

        // ── MISC UI ──
        hudVisible: true,
        crosshairVisible: true,
        fpsVisible: false,
        minimapVisible: true,
        setHudVisible: (v) => set({ hudVisible: v }),
        setCrosshairVisible: (v) => set({ crosshairVisible: v }),
        setFpsVisible: (v) => set({ fpsVisible: v }),
        setMinimapVisible: (v) => set({ minimapVisible: v }),
      }),
      {
        name: 'etherworld-game-storage',
        partialize: (state) => ({
          playerProfile: state.playerProfile,
          playerStats: state.playerStats,
          playerSkills: state.playerSkills,
          equipment: state.equipment,
          inventorySlots: state.inventorySlots,
          quests: state.quests,
          placedObjects: state.placedObjects,
          timeOfDay: state.timeOfDay,
          weather: state.weather,
          season: state.season,
          mapMarkers: state.mapMarkers,
          hudVisible: state.hudVisible,
          minimapVisible: state.minimapVisible,
        }),
      }
    )
  )
)

// ════════════════════════════════════════════════════════════════════════════
//  EXPORTS UTILITAIRES — COMPATIBLES avec le code existant
// ════════════════════════════════════════════════════════════════════════════

export const useGameState = useStore

export const setGlobal = (patch: Partial<GameState>) => {
  useStore.setState(patch as any)
}

export const toggleBuild = () => useStore.getState().toggleBuildMode()
export const toggleGod = () => useStore.getState().toggleGodMode()
export const toggleFly = () => useStore.getState().toggleFlyMode()

export const setChatOpen = (open: boolean) => useStore.getState().setChatOpen(open)
export const setAdminOpen = (open: boolean) => useStore.getState().setAdminOpen(open)

export const addChat = (
  sender: string,
  content: string,
  type: ChatMessage['type'] = 'chat',
  channel: ChatChannel = 'local'
) => useStore.getState().addChatMessage(sender, content, type, channel)

export const addAdminEffect = (
  type: AdminEffect['type'],
  position: [number, number, number],
  target: string,
  duration: number,
  opts?: Partial<AdminEffect>
) => useStore.getState().addAdminEffect(type, position, target, duration, opts)

export const selectModel = (modelType: string | null) => useStore.getState().selectModel(modelType)
export const selectPlaced = (id: string | null) => useStore.getState().selectPlaced(id)

export const updatePlaced = (id: string, patch: Partial<PlacedObject>) =>
  useStore.getState().updatePlaced(id, patch)

// Sélecteurs dérivés optimisés
export const usePlayerStats = () => useStore(s => s.playerStats)
export const usePlayerSkills = () => useStore(s => s.playerSkills)
export const usePlayerProfile = () => useStore(s => s.playerProfile)
export const useInventory = () => useStore(s => s.inventorySlots)
export const useQuests = () => useStore(s => s.quests)
export const useBuilderObjects = () => useStore(s => s.placedObjects)
export const useChatMessages = () => useStore(s => s.chatMessages)
export const useNotifications = () => useStore(s => s.notifications)
export const useWeather = () => useStore(s => s.weather)
export const useTimeOfDay = () => useStore(s => s.timeOfDay)
export const useTimePhase = () => useStore(s => s.timePhase)
export const useMapMarkers = () => useStore(s => s.mapMarkers)
export const useGameMode = () => useStore(s => s.gameMode)
export const useAdminEffects = () => useStore(s => s.adminEffects)
export const useEquipment = () => useStore(s => s.equipment)