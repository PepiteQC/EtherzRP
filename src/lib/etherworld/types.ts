export type CardAccessLevel = 'guest' | 'resident' | 'vip' | 'admin'

export type ItemCategory =
  | 'weapon'
  | 'clothing'
  | 'consumable'
  | 'key'
  | 'furniture'
  | 'misc'
  | 'currency'
  | 'electronics'
  | 'vehicle'

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type ShopCategory = 'vehicles' | 'clothing' | 'furniture' | 'electronics'

export type InteractionType =
  | 'sit'
  | 'lie'
  | 'open'
  | 'close'
  | 'toggle_light'
  | 'use_computer'
  | 'watch_tv'
  | 'pickup'
  | 'drop'
  | 'use_shower'
  | 'open_window'
  | 'use_phone'
  | 'use_fridge'
  | 'use_safe'

export interface InventoryItem {
  id: string
  name: string
  description: string
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
}

export interface ShopItem extends InventoryItem {
  shopCategory: ShopCategory
  inStock: boolean
  discount?: number
  previewModel?: string
}

export interface InventorySlot {
  slotId: number
  item: InventoryItem | null
  locked: boolean
}

export interface InventoryConfig {
  maxSlots: number
  maxWeight: number
}

export interface PlayerCard {
  id: string
  level: CardAccessLevel
  name: string
  issueDate: number
  expiryDate: number
}

export interface RoomConfig {
  roomNumber: string
  floor: number
  type: string
}

export interface Light {
  id: string
  isOn: boolean
  intensity: number
  color: string
}

export interface PlacedObject {
  id: string
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale?: [number, number, number]
  props?: Record<string, unknown>
  interactable?: boolean
  interactionTypes?: InteractionType[]
}

export interface DragPreviewState {
  active: boolean
  objectType: string | null
  position: [number, number, number]
  rotation: [number, number, number]
  isValid: boolean
}

export interface ContextAction {
  id: string
  label: string
  icon: string
  interactionType?: InteractionType
  callback?: () => void
  disabled?: boolean
}

export interface ComputerState {
  isOn: boolean
  currentApp: 'desktop' | 'shop' | 'browser' | 'settings' | null
  bootProgress: number
}

export const CARD_COLORS: Record<CardAccessLevel, string> = {
  guest: '#FF9A3A',
  resident: '#00E0FF',
  vip: '#FFD700',
  admin: '#FF3AF2',
}