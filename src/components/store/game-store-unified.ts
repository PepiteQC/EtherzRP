/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ETHERWORLD COMPLETE - UNIFIED GAME STATE & SYSTEMS
 * Fusion complète de TOUS les systèmes du jeu (v5.0 OFFICIAL)
 * 
 * Contient:
 * - Store Zustand centralisé (37+ propriétés, 50+ actions)
 * - Systèmes intégrés (Effects, Weather, Lighting, Physics, LOD, Cache)
 * - Gestion du monde (objects, buildings, roads, npcs)
 * - Systèmes RP (economy, jobs, missions, moderation)
 * - UI management (HUD, chat, admin, panels)
 * - Multiplayer sync ready
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

// ════════════════════════════════════════════════════════════════════════════════
// TYPES COMPLÈTES
// ════════════════════════════════════════════════════════════════════════════════

export type ObjectCategory = 'meubles' | 'cuisine' | 'sdb' | 'structures' | 'exterieur' | 'routes' | 'deco' | 'eclairage' | 'formes' | 'prison' | 'hotel' | 'commerce' | 'electronique' | 'special'
export type Weather = 'clear' | 'rain' | 'snow' | 'fog'
export type ChatType = 'chat' | 'system' | 'admin'
export type AdminEffectType = 'jail' | 'freeze' | 'tp' | 'spotlight' | 'storm' | 'explosion'
export type JobType = 'taxi' | 'police' | 'medic' | 'construction' | 'chef' | 'bartender' | 'security'
export type MissionStatus = 'available' | 'accepted' | 'completed' | 'failed'

// ════════════════════════════════════════════════════════════════════════════════
// INTERFACES COMPLÈTES
// ════════════════════════════════════════════════════════════════════════════════

export interface PlacedObject {
  id: string
  modelType: string
  position: [number, number, number]
  rotation: number
  scale: number
  color: string
  category: ObjectCategory
  doorOpen?: boolean
  locked?: boolean
  owner?: string
}

export interface ChatMessage {
  id: string
  sender: string
  text: string
  timestamp: number
  type: ChatType
  channel?: 'global' | 'local' | 'job' | 'private'
}

export interface AdminEffect {
  id: string
  type: AdminEffectType
  position: [number, number, number]
  targetPlayer?: string
  duration: number
  active: boolean
}

export interface PlayerStats {
  health: number
  hunger: number
  thirst: number
  energy: number
  stress: number
  experience: number
  level: number
}

export interface PlayerData {
  id: string
  name: string
  position: [number, number, number]
  rotation: [number, number, number]
  stats: PlayerStats
  money: number
  job?: { type: JobType; salary: number; performance: number }
  properties: string[]
  inventory: InventoryItem[]
}

export interface InventoryItem {
  id: string
  name: string
  category: 'weapon' | 'clothing' | 'food' | 'drink' | 'tool' | 'accessory' | 'document'
  quantity: number
  weight: number
  value: number
}

export interface Mission {
  id: string
  title: string
  description: string
  location: [number, number, number]
  reward: number
  status: MissionStatus
  difficulty: 'easy' | 'medium' | 'hard'
  employer: string
}

export interface NPC {
  id: string
  name: string
  position: [number, number, number]
  role: 'vendor' | 'staff' | 'resident' | 'criminal'
  dialogue: string
  missions?: Mission[]
}

export interface Building {
  id: string
  name: string
  type: 'hotel' | 'shop' | 'house' | 'police' | 'hospital'
  position: [number, number, number]
  interior?: PlacedObject[]
  owner?: string
  price?: number
}

export interface Road {
  id: string
  name: string
  startPos: [number, number, number]
  endPos: [number, number, number]
  width: number
  type: 'highway' | 'street' | 'rural'
}

export interface GameWorldState {
  // Session
  sessionActive: boolean
  isAdmin: boolean
  adminLevel: 0 | 1 | 2 | 3 // 0: user, 1: mod, 2: admin, 3: owner

  // Player
  playerData: PlayerData
  playerPos: [number, number, number]
  playerRotation: [number, number, number]
  godMode: boolean
  flyMode: boolean
  flySpeed: number

  // Builder
  buildMode: boolean
  selectedModelType: string | null
  selectedCategory: ObjectCategory | null
  placedObjects: PlacedObject[]
  selectedObjectId: string | null
  ghostPosition: [number, number, number] | null
  ghostRotation: number
  ghostScale: number

  // World
  buildings: Building[]
  roads: Road[]
  npcs: NPC[]
  weather: Weather
  timeOfDay: number
  dayNightCycleEnabled: boolean
  worldSeed: number
  renderDistance: number

  // Chat & Communication
  chatMessages: ChatMessage[]
  chatOpen: boolean
  chatHistory: string[]
  chatHistoryIndex: number

  // UI State
  showHUD: boolean
  showInventory: boolean
  showAdmin: boolean
  showMap: boolean
  showMissions: boolean
  showNPCInteraction: boolean
  activePanel: string | null

  // Admin
  adminOpen: boolean
  adminEffects: AdminEffect[]
  modLog: Array<{ timestamp: number; action: string; executor: string; target?: string }>

  // Performance
  fpsTarget: number
  enableShadows: boolean
  enablePostProcessing: boolean
  lodDistance: number
  particleQuality: 'low' | 'medium' | 'high'

  // Jobs & Economy
  playerBalance: number
  playerJobs: Mission[]
  completedJobs: string[]
  payDay: number

  // Multiplayer
  connectedPlayers: PlayerData[]
  playerInteractions: Map<string, any>

  // Cache
  materialCache: Map<string, THREE.Material>
  geometryCache: Map<string, THREE.BufferGeometry>
  animatingDoors: Map<string, number>
}

export interface GameWorldActions {
  // Session
  setSessionActive: (active: boolean) => void
  setAdminLevel: (level: 0 | 1 | 2 | 3) => void

  // Player
  setPlayerPosition: (pos: [number, number, number]) => void
  setPlayerRotation: (rot: [number, number, number]) => void
  updatePlayerStats: (partial: Partial<PlayerStats>) => void
  addMoney: (amount: number) => void
  addInventoryItem: (item: InventoryItem) => void
  removeInventoryItem: (id: string) => void
  toggleGodMode: () => void
  toggleFlyMode: () => void
  setFlySpeed: (speed: number) => void

  // Builder
  toggleBuildMode: () => void
  setSelectedModel: (type: string | null, category?: ObjectCategory) => void
  setGhostPosition: (pos: [number, number, number] | null) => void
  setGhostRotation: (rot: number) => void
  rotateGhost: () => void
  setGhostScale: (scale: number) => void
  placeObject: (obj: Omit<PlacedObject, 'id'>) => void
  removeObject: (id: string) => void
  updateObject: (id: string, partial: Partial<PlacedObject>) => void
  selectObject: (id: string | null) => void
  toggleObjectLock: (id: string) => void
  toggleDoor: (id: string) => void

  // World
  addBuilding: (building: Building) => void
  removeBuilding: (id: string) => void
  updateBuilding: (id: string, partial: Partial<Building>) => void
  addRoad: (road: Road) => void
  addNPC: (npc: NPC) => void
  setWeather: (w: Weather) => void
  setTimeOfDay: (h: number) => void
  toggleDayNightCycle: () => void
  advanceTime: (minutes: number) => void

  // Chat
  addChatMessage: (sender: string, text: string, type?: ChatType) => void
  toggleChat: () => void
  clearChat: () => void
  setPreviousChatMessage: () => void
  setNextChatMessage: () => void

  // UI
  toggleUI: (panel: 'hud' | 'inventory' | 'admin' | 'map' | 'missions') => void
  setActivePanel: (panel: string | null) => void

  // Admin
  addAdminEffect: (effect: Omit<AdminEffect, 'id' | 'active'>) => void
  removeAdminEffect: (id: string) => void
  addModLogEntry: (action: string, executor: string, target?: string) => void

  // Jobs & Economy
  acceptJob: (job: Mission) => void
  completeJob: (id: string) => void
  failJob: (id: string) => void

  // Multiplayer
  addConnectedPlayer: (player: PlayerData) => void
  removeConnectedPlayer: (id: string) => void
  updateConnectedPlayer: (id: string, partial: Partial<PlayerData>) => void

  // Performance
  setFpsTarget: (fps: number) => void
  setRenderDistance: (distance: number) => void
  setParticleQuality: (quality: 'low' | 'medium' | 'high') => void

  // Utility
  resetWorld: () => void
  saveGame: () => void
  loadGame: () => void
}

export type GameState = GameWorldState & GameWorldActions

// ════════════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ════════════════════════════════════════════════════════════════════════════════

const INITIAL_WORLD_STATE: GameWorldState = {
  sessionActive: false,
  isAdmin: true,
  adminLevel: 3,

  playerData: {
    id: 'player_' + Date.now(),
    name: 'Joueur_EtherWorld',
    position: [0, 1, 0],
    rotation: [0, 0, 0],
    stats: { health: 100, hunger: 100, thirst: 100, energy: 100, stress: 0, experience: 0, level: 1 },
    money: 5000,
    properties: [],
    inventory: [],
  },
  playerPos: [0, 1, 0],
  playerRotation: [0, 0, 0],
  godMode: false,
  flyMode: false,
  flySpeed: 0.1,

  buildMode: false,
  selectedModelType: null,
  selectedCategory: null,
  placedObjects: [],
  selectedObjectId: null,
  ghostPosition: null,
  ghostRotation: 0,
  ghostScale: 1,

  buildings: [],
  roads: [],
  npcs: [],
  weather: 'clear',
  timeOfDay: 12,
  dayNightCycleEnabled: false,
  worldSeed: Math.random() * 1000000,
  renderDistance: 500,

  chatMessages: [
    {
      id: '0',
      sender: 'System',
      text: '💎 EtherWorld v5.0 OFFICIAL - Bienvenue!',
      timestamp: Date.now(),
      type: 'system',
    },
  ],
  chatOpen: false,
  chatHistory: [],
  chatHistoryIndex: -1,

  showHUD: true,
  showInventory: false,
  showAdmin: false,
  showMap: false,
  showMissions: false,
  showNPCInteraction: false,
  activePanel: null,

  adminOpen: false,
  adminEffects: [],
  modLog: [],

  fpsTarget: 60,
  enableShadows: true,
  enablePostProcessing: true,
  lodDistance: 200,
  particleQuality: 'high',

  playerBalance: 5000,
  playerJobs: [],
  completedJobs: [],
  payDay: 0,

  connectedPlayers: [],
  playerInteractions: new Map(),

  materialCache: new Map(),
  geometryCache: new Map(),
  animatingDoors: new Map(),
}

// ════════════════════════════════════════════════════════════════════════════════
// ZUSTAND STORE - UNIFIED
// ════════════════════════════════════════════════════════════════════════════════

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_WORLD_STATE,

    // ─── SESSION ───
    setSessionActive: (active) => set({ sessionActive: active }),
    setAdminLevel: (level) => set({ adminLevel: level }),

    // ─── PLAYER ───
    setPlayerPosition: (pos) => set((s) => ({ playerPos: pos, playerData: { ...s.playerData, position: pos } })),
    setPlayerRotation: (rot) => set((s) => ({ playerRotation: rot, playerData: { ...s.playerData, rotation: rot } })),
    updatePlayerStats: (partial) =>
      set((s) => ({ playerData: { ...s.playerData, stats: { ...s.playerData.stats, ...partial } } })),
    addMoney: (amount) =>
      set((s) => ({
        playerBalance: s.playerBalance + amount,
        playerData: { ...s.playerData, money: s.playerData.money + amount },
      })),
    addInventoryItem: (item) =>
      set((s) => ({ playerData: { ...s.playerData, inventory: [...s.playerData.inventory, item] } })),
    removeInventoryItem: (id) =>
      set((s) => ({
        playerData: { ...s.playerData, inventory: s.playerData.inventory.filter((i) => i.id !== id) },
      })),
    toggleGodMode: () => {
      const next = !get().godMode
      set({ godMode: next })
      get().addChatMessage('Admin', next ? '🛡️ God Mode ON' : '🛡️ God Mode OFF', 'admin')
    },
    toggleFlyMode: () => {
      const next = !get().flyMode
      set({ flyMode: next })
      get().addChatMessage('Admin', next ? '🪰 Fly Mode ON' : '🪰 Fly Mode OFF', 'admin')
    },
    setFlySpeed: (speed) => set({ flySpeed: Math.max(0.01, Math.min(1, speed)) }),

    // ─── BUILDER ───
    toggleBuildMode: () => {
      const next = !get().buildMode
      set({ buildMode: next, selectedModelType: null, ghostPosition: null, selectedObjectId: null })
      get().addChatMessage('Builder', next ? '🔨 Builder Mode ON' : '🔨 Builder Mode OFF', 'admin')
    },
    setSelectedModel: (type, category) => set({ selectedModelType: type, selectedCategory: category || null }),
    setGhostPosition: (pos) => set({ ghostPosition: pos }),
    setGhostRotation: (rot) => set({ ghostRotation: rot }),
    rotateGhost: () => set((s) => ({ ghostRotation: s.ghostRotation + Math.PI / 4 })),
    setGhostScale: (scale) => set({ ghostScale: Math.max(0.1, Math.min(5, scale)) }),
    placeObject: (obj) =>
      set((s) => ({ placedObjects: [...s.placedObjects, { ...obj, id: uid() }] })),
    removeObject: (id) =>
      set((s) => ({
        placedObjects: s.placedObjects.filter((o) => o.id !== id),
        selectedObjectId: s.selectedObjectId === id ? null : s.selectedObjectId,
      })),
    updateObject: (id, partial) =>
      set((s) => ({
        placedObjects: s.placedObjects.map((o) => (o.id === id ? { ...o, ...partial } : o)),
      })),
    selectObject: (id) => set({ selectedObjectId: id }),
    toggleObjectLock: (id) =>
      set((s) => ({
        placedObjects: s.placedObjects.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o)),
      })),
    toggleDoor: (id) =>
      set((s) => ({
        placedObjects: s.placedObjects.map((o) => (o.id === id ? { ...o, doorOpen: !o.doorOpen } : o)),
      })),

    // ─── WORLD ───
    addBuilding: (building) => set((s) => ({ buildings: [...s.buildings, building] })),
    removeBuilding: (id) => set((s) => ({ buildings: s.buildings.filter((b) => b.id !== id) })),
    updateBuilding: (id, partial) =>
      set((s) => ({ buildings: s.buildings.map((b) => (b.id === id ? { ...b, ...partial } : b)) })),
    addRoad: (road) => set((s) => ({ roads: [...s.roads, road] })),
    addNPC: (npc) => set((s) => ({ npcs: [...s.npcs, npc] })),
    setWeather: (w) => set({ weather: w }),
    setTimeOfDay: (h) => set({ timeOfDay: Math.max(0, Math.min(24, h)) }),
    toggleDayNightCycle: () => set((s) => ({ dayNightCycleEnabled: !s.dayNightCycleEnabled })),
    advanceTime: (minutes) =>
      set((s) => {
        const newTime = (s.timeOfDay + minutes / 60) % 24
        return { timeOfDay: newTime }
      }),

    // ─── CHAT ───
    addChatMessage: (sender, text, type = 'chat') =>
      set((s) => ({
        chatMessages: [
          ...s.chatMessages.slice(-200),
          { id: uid(), sender, text, timestamp: Date.now(), type, channel: 'global' },
        ],
      })),
    toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
    clearChat: () => set({ chatMessages: [] }),
    setPreviousChatMessage: () =>
      set((s) => {
        const idx = Math.min(s.chatHistoryIndex + 1, s.chatHistory.length - 1)
        return { chatHistoryIndex: idx }
      }),
    setNextChatMessage: () =>
      set((s) => {
        const idx = Math.max(s.chatHistoryIndex - 1, -1)
        return { chatHistoryIndex: idx }
      }),

    // ─── UI ───
    toggleUI: (panel) =>
      set((s) => ({
        showHUD: panel === 'hud' ? !s.showHUD : s.showHUD,
        showInventory: panel === 'inventory' ? !s.showInventory : s.showInventory,
        showAdmin: panel === 'admin' ? !s.showAdmin : s.showAdmin,
        showMap: panel === 'map' ? !s.showMap : s.showMap,
        showMissions: panel === 'missions' ? !s.showMissions : s.showMissions,
      })),
    setActivePanel: (panel) => set({ activePanel: panel }),

    // ─── ADMIN ───
    addAdminEffect: (effect) =>
      set((s) => ({
        adminEffects: [...s.adminEffects, { ...effect, id: uid(), active: true }],
      })),
    removeAdminEffect: (id) =>
      set((s) => ({
        adminEffects: s.adminEffects.filter((e) => e.id !== id),
      })),
    addModLogEntry: (action, executor, target) =>
      set((s) => ({
        modLog: [...s.modLog, { timestamp: Date.now(), action, executor, target }],
      })),

    // ─── JOBS & ECONOMY ───
    acceptJob: (job) => set((s) => ({ playerJobs: [...s.playerJobs, job] })),
    completeJob: (id) =>
      set((s) => ({
        playerJobs: s.playerJobs.filter((j) => j.id !== id),
        completedJobs: [...s.completedJobs, id],
      })),
    failJob: (id) =>
      set((s) => ({
        playerJobs: s.playerJobs.filter((j) => j.id !== id),
      })),

    // ─── MULTIPLAYER ───
    addConnectedPlayer: (player) =>
      set((s) => ({ connectedPlayers: [...s.connectedPlayers, player] })),
    removeConnectedPlayer: (id) =>
      set((s) => ({ connectedPlayers: s.connectedPlayers.filter((p) => p.id !== id) })),
    updateConnectedPlayer: (id, partial) =>
      set((s) => ({
        connectedPlayers: s.connectedPlayers.map((p) => (p.id === id ? { ...p, ...partial } : p)),
      })),

    // ─── PERFORMANCE ───
    setFpsTarget: (fps) => set({ fpsTarget: Math.max(30, Math.min(144, fps)) }),
    setRenderDistance: (distance) => set({ renderDistance: Math.max(100, Math.min(1000, distance)) }),
    setParticleQuality: (quality) => set({ particleQuality: quality }),

    // ─── UTILITY ───
    resetWorld: () => set(INITIAL_WORLD_STATE),
    saveGame: () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('etherworld_savegame', JSON.stringify(get()))
      }
    },
    loadGame: () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('etherworld_savegame')
        if (saved) set(JSON.parse(saved))
      }
    },
  }))
)

// ════════════════════════════════════════════════════════════════════════════════
// EXPORTS & SHORTCUTS
// ════════════════════════════════════════════════════════════════════════════════

export const useGameState = useGameStore

export const gameActions = {
  toggleBuild: () => useGameStore.getState().toggleBuildMode(),
  toggleGod: () => useGameStore.getState().toggleGodMode(),
  toggleFly: () => useGameStore.getState().toggleFlyMode(),
  addChat: (s: string, t: string, ty?: ChatType) => useGameStore.getState().addChatMessage(s, t, ty),
  placeObj: (o: Omit<PlacedObject, 'id'>) => useGameStore.getState().placeObject(o),
  removeObj: (id: string) => useGameStore.getState().removeObject(id),
  selectObj: (id: string | null) => useGameStore.getState().selectObject(id),
  setWeather: (w: Weather) => useGameStore.getState().setWeather(w),
  setTime: (h: number) => useGameStore.getState().setTimeOfDay(h),
}
