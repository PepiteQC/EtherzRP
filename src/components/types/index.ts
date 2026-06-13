/**
 * TYPES COMPLÈTES - Utilisées partout dans l'app
 * Fusionné depuis 5+ versions différentes
 */

export type Vec3 = [number, number, number]
export type Vec4 = [number, number, number, number]

// Game World
export interface WorldEntity {
  id: string
  type: 'building' | 'prop' | 'vehicle' | 'npc'
  position: Vec3
  rotation: Vec3
  scale: Vec3
}

export interface Building extends WorldEntity {
  type: 'building'
  name: string
  model: string
  rooms?: Room[]
  interior?: InteriorLayout
}

export interface Room {
  id: string
  name: string
  position: Vec3
  size: Vec3
  furniture: string[]
  lights: Light[]
}

export interface InteriorLayout {
  entryPoint: Vec3
  exitPoint: Vec3
  doors: Door[]
  corridors: Corridor[]
}

export interface Door {
  id: string
  position: Vec3
  locked: boolean
  accessLevel: CardAccessLevel
  targetRoom?: string
}

export interface Corridor {
  id: string
  name: string
  apartments: CorridorApartment[]
  length: number
}

export interface CorridorApartment {
  id: string
  number: string
  position: Vec3
  isLocked: boolean
  lightOn: boolean
  doorColor: string
}

export type CardAccessLevel = 'resident' | 'staff' | 'admin'

// Lighting System
export interface Light {
  id: string
  type: 'ambient' | 'directional' | 'point' | 'spot'
  position?: Vec3
  color: string
  intensity: number
  distance?: number
  angle?: number
}

export interface LightStates {
  ceiling: boolean
  desk: boolean
  neon: boolean
  bathroom: boolean
  tv: boolean
  bed: boolean
}

// Materials & Textures
export interface Material {
  id: string
  name: string
  color: string
  metalness?: number
  roughness?: number
  texture?: string
  normalMap?: string
}

export interface PolyTexture extends Material {
  polyCount: number
  edges: boolean
  faceted: boolean
}

// Road/Street System
export interface RoadSegment {
  id: string
  startPos: Vec3
  endPos: Vec3
  width: number
  texture: PolyTexture
  markings: 'center' | 'sides' | 'both' | 'none'
  intersections: string[]
}

export interface Intersection {
  id: string
  position: Vec3
  type: 'cross' | 't-junction' | 'roundabout'
  connectedRoads: string[]
}

// Vehicle System
export interface Vehicle extends WorldEntity {
  type: 'vehicle'
  model: 'car' | 'truck' | 'bike' | 'taxi'
  color: string
  owner?: string
  locked: boolean
  fuel: number
}

// NPC System
export interface NPC extends WorldEntity {
  type: 'npc'
  name: string
  model: string
  role: 'vendor' | 'staff' | 'customer' | 'resident'
  schedule?: Schedule[]
  dialogue?: DialogNode[]
}

export interface Schedule {
  time: number
  location: Vec3
  action: string
}

export interface DialogNode {
  id: string
  text: string
  options: DialogOption[]
  reward?: Reward
}

export interface DialogOption {
  text: string
  nextNodeId: string
}

export interface Reward {
  money?: number
  xp?: number
  items?: string[]
}

// Economy System
export interface TransactionRecord {
  id: string
  playerId: string
  type: 'deposit' | 'withdraw' | 'transfer' | 'purchase'
  amount: number
  timestamp: number
  description: string
}

// Player/User
export interface Player {
  id: string
  name: string
  position: Vec3
  rotation: Vec3
  level: number
  experience: number
  money: number
  inventory: InventoryItem[]
  properties: string[] // Property IDs
  job?: JobRecord
  stats: PlayerStats
}

export interface PlayerStats {
  health: number
  hunger: number
  thirst: number
  energy: number
  stress: number
}

export interface JobRecord {
  jobId: string
  title: string
  salary: number
  startDate: number
  performance: number
}

// Inventory System
export interface InventoryItem {
  id: string
  name: string
  category: ItemCategory
  rarity: ItemRarity
  weight: number
  value: number
  stackable: boolean
  usable: boolean
  tradeable: boolean
  quantity?: number
}

export type ItemCategory =
  | 'weapon'
  | 'clothing'
  | 'food'
  | 'drink'
  | 'tool'
  | 'accessory'
  | 'document'
  | 'collectible'

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// Property/Real Estate
export interface Property {
  id: string
  name: string
  address: string
  position: Vec3
  owner: string
  type: 'house' | 'apartment' | 'commercial' | 'warehouse'
  price: number
  forSale: boolean
  interior: InteriorLayout
}

// Chat & Communication
export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
  channel: 'global' | 'local' | 'job' | 'private'
  type: 'chat' | 'system' | 'admin'
}

// Server Events (WebSocket)
export interface ServerEvent {
  type: string
  data: unknown
  timestamp: number
}

export interface PlayerMovedEvent extends ServerEvent {
  type: 'player_moved'
  data: {
    playerId: string
    position: Vec3
    rotation: Vec3
  }
}

export interface PlayerChatEvent extends ServerEvent {
  type: 'player_chat'
  data: ChatMessage
}

export interface ObjectPlacedEvent extends ServerEvent {
  type: 'object_placed'
  data: {
    object: any
    playerId: string
  }
}

// Game Settings
export interface GameSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  voiceVolume: number
  brightness: number
  fov: number
  renderDistance: number
  shadowQuality: 'low' | 'medium' | 'high'
  particleQuality: 'low' | 'medium' | 'high'
  mouseSensitivity: number
  invertMouse: boolean
}
