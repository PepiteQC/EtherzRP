import { create } from 'zustand'

export type ItemCategory = 'weapon' | 'clothing' | 'food' | 'drink' | 'tool' | 'accessory' | 'document' | 'key' | 'misc' | 'consumable' | 'currency'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface InventoryItem {
  id: string
  name: string
  description?: string
  icon?: string
  category: ItemCategory
  rarity: ItemRarity
  stackable?: boolean
  maxStack?: number
  quantity: number
  weight: number
  value: number
  usable?: boolean
  tradeable?: boolean
  metadata?: Record<string, unknown>
}

export interface InventorySlot {
  slotId: number
  item: InventoryItem | null
}

export interface PlayerProfile {
  id: string
  name: string
  job?: string
  cash?: number
  bank?: number
}

export interface PlayerStats {
  health: number
  hunger: number
  thirst: number
  energy: number
  stress: number
  xp: number
  level: number
}

export interface PlayerSkills {
  driving: number
  shooting: number
  strength: number
  stamina: number
  hacking: number
}

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  objectType: string
  objectId?: string
}

export interface AdminEffectState {
  id: string
  type: string
  position: [number, number, number]
  target?: string
  duration: number
}

export interface EtherWorldGameStore {
  adminOpen: boolean
  inventoryOpen: boolean
  selectedSlot: number | null
  inventorySlots: InventorySlot[]
  playerPos: [number, number, number]
  isGodMode: boolean
  flyMode: boolean
  timeOfDay: number
  weather: string
  season: string
  playerProfile: PlayerProfile
  playerStats: PlayerStats
  playerSkills: PlayerSkills
  contextMenu: ContextMenuState | null
  adminEffects: AdminEffectState[]
  notifications: Array<{ id: string; message: string; type?: string; icon?: string }>

  set: (partial: Partial<EtherWorldGameStore>) => void
  setInventoryOpen: (open: boolean) => void
  selectSlot: (slotId: number | null) => void
  addItem: (item: InventoryItem) => boolean
  removeItem: (slotId: number) => void
  moveItem: (fromSlot: number, toSlot: number) => void
  useItem: (slotId: number) => void
  clearInventory: () => void
  getTotalWeight: () => number
  sortInventory: (by: 'name' | 'rarity' | 'value' | 'weight') => void
  addMoney: (amount: number) => void
  addXp: (amount: number) => void
  updateStats: (stats: Partial<PlayerStats>) => void
  healPlayer: (amount?: number) => void
  feed: (hunger?: number, thirst?: number) => void
  rest: (energy?: number) => void
  setTimeOfDay: (hour: number) => void
  setWeather: (weather: string) => void
  setSeason: (season: string) => void
  setNotification: (message: string, type?: string, duration?: number, icon?: string) => void
  addAdminEffect: (effect: AdminEffectState) => void
  hideContextMenu: () => void
  setPlayerAction: (action: string | null) => void
}

const createSlots = (count = 40): InventorySlot[] =>
  Array.from({ length: count }, (_, i) => ({ slotId: i, item: null }))

const rarityRank: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
}

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  weapon: '🔫',
  clothing: '👕',
  food: '🍔',
  drink: '🥤',
  tool: '🛠️',
  accessory: '💍',
  document: '📄',
  key: '🔑',
  misc: '📦',
  consumable: '🍫',
  currency: '💵',
}

export const useStore = create<EtherWorldGameStore>((set, get) => ({
  adminOpen: false,
  inventoryOpen: false,
  selectedSlot: null,
  inventorySlots: createSlots(),
  playerPos: [0, 1, 0],
  isGodMode: false,
  flyMode: false,
  timeOfDay: 12,
  weather: 'clear',
  season: 'summer',
  playerProfile: { id: 'local-player', name: 'Joueur EtherWorld', cash: 2500, bank: 10000 },
  playerStats: { health: 100, hunger: 100, thirst: 100, energy: 100, stress: 0, xp: 0, level: 1 },
  playerSkills: { driving: 1, shooting: 1, strength: 1, stamina: 1, hacking: 1 },
  contextMenu: null,
  adminEffects: [],
  notifications: [],

  set: (partial) => set(partial),
  setInventoryOpen: (open) => set({ inventoryOpen: open }),
  selectSlot: (slotId) => set({ selectedSlot: slotId }),
  addItem: (item) => {
    const slots = get().inventorySlots
    const emptyIndex = slots.findIndex((slot) => slot.item === null)
    if (emptyIndex < 0) return false
    const next = [...slots]
    next[emptyIndex] = { ...next[emptyIndex], item }
    set({ inventorySlots: next })
    return true
  },
  removeItem: (slotId) => set((s) => ({ inventorySlots: s.inventorySlots.map((slot) => slot.slotId === slotId ? { ...slot, item: null } : slot) })),
  moveItem: (fromSlot, toSlot) => set((s) => {
    const next = [...s.inventorySlots]
    const from = next.findIndex((slot) => slot.slotId === fromSlot)
    const to = next.findIndex((slot) => slot.slotId === toSlot)
    if (from < 0 || to < 0) return s
    const item = next[from].item
    next[from] = { ...next[from], item: next[to].item }
    next[to] = { ...next[to], item }
    return { inventorySlots: next }
  }),
  useItem: (slotId) => {
    const slot = get().inventorySlots.find((s) => s.slotId === slotId)
    if (slot?.item) get().setNotification(`${slot.item.name} utilisé`, 'success', 2500, slot.item.icon)
  },
  clearInventory: () => set({ inventorySlots: createSlots() }),
  getTotalWeight: () => get().inventorySlots.reduce((sum, slot) => sum + ((slot.item?.weight ?? 0) * (slot.item?.quantity ?? 1)), 0),
  sortInventory: (by) => set((s) => {
    const filled = s.inventorySlots.map((slot) => slot.item).filter(Boolean) as InventoryItem[]
    filled.sort((a, b) => {
      if (by === 'rarity') return rarityRank[b.rarity] - rarityRank[a.rarity]
      if (by === 'value') return b.value - a.value
      if (by === 'weight') return b.weight - a.weight
      return a.name.localeCompare(b.name)
    })
    const slots = createSlots(s.inventorySlots.length)
    filled.forEach((item, i) => { slots[i] = { slotId: i, item } })
    return { inventorySlots: slots }
  }),
  addMoney: (amount) => set((s) => ({ playerProfile: { ...s.playerProfile, cash: (s.playerProfile.cash ?? 0) + amount } })),
  addXp: (amount) => set((s) => ({ playerStats: { ...s.playerStats, xp: s.playerStats.xp + amount } })),
  updateStats: (stats) => set((s) => ({ playerStats: { ...s.playerStats, ...stats } })),
  healPlayer: (amount = 100) => set((s) => ({ playerStats: { ...s.playerStats, health: Math.min(100, amount) } })),
  feed: (hunger = 100, thirst = 100) => set((s) => ({ playerStats: { ...s.playerStats, hunger, thirst } })),
  rest: (energy = 100) => set((s) => ({ playerStats: { ...s.playerStats, energy } })),
  setTimeOfDay: (hour) => set({ timeOfDay: Math.max(0, Math.min(24, hour)) }),
  setWeather: (weather) => set({ weather }),
  setSeason: (season) => set({ season }),
  setNotification: (message, type, _duration, icon) => set((s) => ({ notifications: [...s.notifications.slice(-5), { id: `${Date.now()}`, message, type, icon }] })),
  addAdminEffect: (effect) => set((s) => ({ adminEffects: [...s.adminEffects, effect] })),
  hideContextMenu: () => set({ contextMenu: null }),
  setPlayerAction: () => undefined,
}))

export const useGameState = useStore
export const setGlobal = (partial: Partial<EtherWorldGameStore>) => useStore.getState().set(partial)
export const addChat = (_sender: string, text: string) => useStore.getState().setNotification(text, 'info')
export const toggleGod = () => useStore.setState((s) => ({ isGodMode: !s.isGodMode }))
export const toggleFly = () => useStore.setState((s) => ({ flyMode: !s.flyMode }))
export const addAdminEffect = (type: string, position: [number, number, number], target = 'world', duration = 3000) => {
  useStore.getState().addAdminEffect({ id: `${Date.now()}`, type, position, target, duration })
}

export default useStore
