// ═══════════════════════════════════════════════════════════════════════════════
// EtherWorld RP Québec — Corridor hôtel domain
// Source commune pour le corridor canvas existant + futur corridor 3D R3F/Rapier.
// Ne rend rien. Ne supprime rien. Sert de contrat stable pour éviter les V2/V3 inutiles.
// ═══════════════════════════════════════════════════════════════════════════════

export type DoorSide = 'left' | 'right'
export type DoorAction = 'enter' | 'toggle' | 'lockpick' | 'rent'
export type AlertType = 'info' | 'success' | 'warning' | 'danger'
export type CorridorTheme = 'standard' | 'premium' | 'penthouse' | 'maintenance'

export interface DoorData {
  id: number
  aptId: number
  aptNumber: string
  tx: number
  ty: number
  side: DoorSide
  isLocked: boolean
  ownerName: string | null
  ownerId: number | null
  rentPrice: number
  isForRent: boolean
  hasActivity: boolean
  justChanged: boolean
  furnitureLevel: number // 0=vide, 1=basique, 2=meublé, 3=luxe
  securityLevel: number // 0=aucune, 1=base, 2=avancée, 3=blindée/coffre
}

export interface AlertData {
  id: number
  msg: string
  type: AlertType
}

export interface FloorStats {
  unlocked: number
  locked: number
  forRent: number
  occupied: number
  totalValue: number
  avgSecurityLevel: number
  avgFurnitureLevel: number
}

export interface FloorAPIData {
  floorNumber?: number
  apartments?: Array<{
    id: number
    door_id: number
    apt_number: string
    door_locked: boolean
    owner_name: string | null
    owner_id: number | null
    rent_price: number
    is_for_rent: boolean
    furniture_level?: number
    security_level?: number
  }>
}

export interface AvatarPosition {
  tx: number
  ty: number
}

export interface CorridorNpc {
  id: string
  name: string
  tx: number
  ty: number
  color: string
  role: 'concierge' | 'resident' | 'delivery' | 'security' | 'maintenance'
  seed: number
}

export interface DoorWorldTransform {
  position: [number, number, number]
  rotation: [number, number, number]
  labelPosition: [number, number, number]
  interactionPosition: [number, number, number]
}

export interface CorridorEnv {
  apiUrl: string
  wsUrl: string
}

export const CORRIDOR_GRID = {
  totalDoors: 20,
  doorsPerSide: 10,
  lengthTiles: 22,
  widthTiles: 6,
  playerStart: { tx: 3, ty: 5 } satisfies AvatarPosition,
} as const

export const CORRIDOR_3D = {
  width: 4.8,
  length: 25.5,
  height: 3.55,
  wallThickness: 0.18,
  floorThickness: 0.12,
  doorWidth: 1.05,
  doorHeight: 2.28,
  doorDepth: 0.08,
  tileWorldZ: 1.1,
  playerRadius: 0.33,
  playerHeight: 1.72,
  interactionRadius: 1.35,
  cameraBack: 6.8,
  cameraUp: 4.15,
} as const

export const CORRIDOR_PROPS = {
  fireExtinguishers: [3, 11, 19],
  plants: [1, 7, 13, 19],
  paintings: [2, 6, 10, 14, 18],
  cameras: [1, 11, 20],
  floorSigns: [0, CORRIDOR_GRID.lengthTiles - 1],
  lightsEvery: 4,
} as const

export const CORRIDOR_COLORS = {
  bg: '#08080E',
  floor1: '#0E1018',
  floor2: '#111420',
  wallLeft: '#141826',
  wallRight: '#0C0E18',
  violet: '#4A3AFF',
  cyan: '#00E0FF',
  magenta: '#FF3AF2',
  green: '#00FF9D',
  red: '#FF3A3A',
  orange: '#FF9A3A',
  yellow: '#FFD700',
  gold: '#C9A84C',
  light: '#F2F2F2',
  dimHex: '#9A9A9A',
  darkPanel: 'rgba(6,6,14,0.97)',
} as const

export const SECURITY_LABELS = ['Aucune', 'Serrure +', 'Blindée', 'Coffre-fort'] as const
export const FURNITURE_LABELS = ['Vide', 'Basique', 'Meublé', 'Luxe'] as const

export function getCorridorEnv(): CorridorEnv {
  const env = import.meta.env as Record<string, string | undefined>
  return {
    apiUrl: env.VITE_API_URL || env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    wsUrl: env.VITE_WS_URL || env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
  }
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function floorLabel(n: number): string {
  if (n === 0) return 'REZ-DE-CHAUSSÉE'
  if (n === 1) return '1ER ÉTAGE'
  if (n === 4) return 'PENTHOUSE'
  return `${n}E ÉTAGE`
}

export function corridorThemeForFloor(floorNumber: number): CorridorTheme {
  if (floorNumber === 4) return 'penthouse'
  if (floorNumber >= 3) return 'premium'
  if (floorNumber === 0) return 'maintenance'
  return 'standard'
}

export function generateDoors(floorData: FloorAPIData = {}): DoorData[] {
  return Array.from({ length: CORRIDOR_GRID.totalDoors }, (_, i) => {
    const side: DoorSide = i < CORRIDOR_GRID.doorsPerSide ? 'left' : 'right'
    const idx = i < CORRIDOR_GRID.doorsPerSide ? i : i - CORRIDOR_GRID.doorsPerSide
    const ty = 1 + idx * 2
    const tx = side === 'left' ? 0 : CORRIDOR_GRID.widthTiles - 1
    const aptNum = `A-${floorData.floorNumber ?? 1}-${String(i + 1).padStart(2, '0')}`
    const apt = floorData.apartments?.[i]

    return {
      id: apt?.door_id ?? i + 1,
      aptId: apt?.id ?? i + 1,
      aptNumber: apt?.apt_number ?? aptNum,
      tx,
      ty,
      side,
      isLocked: apt?.door_locked ?? true,
      ownerName: apt?.owner_name ?? null,
      ownerId: apt?.owner_id ?? null,
      rentPrice: apt?.rent_price ?? 600,
      isForRent: apt?.is_for_rent ?? true,
      hasActivity: false,
      justChanged: false,
      furnitureLevel: clamp(
        apt?.furniture_level ?? Math.floor(seededRand(i + 42) * 4),
        0,
        3
      ),
      securityLevel: clamp(
        apt?.security_level ?? Math.floor(seededRand(i + 99) * 3),
        0,
        3
      ),
    }
  })
}

export function computeFloorStats(doors: DoorData[]): FloorStats {
  const occupied = doors.filter((d) => Boolean(d.ownerName)).length
  const unlocked = doors.filter((d) => !d.isLocked).length
  const securitySum = doors.reduce((sum, d) => sum + d.securityLevel, 0)
  const furnitureSum = doors.reduce((sum, d) => sum + d.furnitureLevel, 0)

  return {
    unlocked,
    locked: doors.length - unlocked,
    forRent: doors.filter((d) => d.isForRent && !d.ownerName).length,
    occupied,
    totalValue: doors.reduce((sum, d) => sum + (d.ownerName ? d.rentPrice : 0), 0),
    avgSecurityLevel: doors.length ? securitySum / doors.length : 0,
    avgFurnitureLevel: doors.length ? furnitureSum / doors.length : 0,
  }
}

export function tileToWorld(tx: number, ty: number): [number, number, number] {
  const xRatio = tx / Math.max(1, CORRIDOR_GRID.widthTiles - 1)
  const x = (xRatio - 0.5) * (CORRIDOR_3D.width - 0.8)
  const z = 0.9 + ty * CORRIDOR_3D.tileWorldZ
  return [x, 0, z]
}

export function doorWorldTransform(door: DoorData): DoorWorldTransform {
  const isLeft = door.side === 'left'
  const wallX = isLeft
    ? -CORRIDOR_3D.width / 2 + CORRIDOR_3D.wallThickness / 2 + 0.018
    : CORRIDOR_3D.width / 2 - CORRIDOR_3D.wallThickness / 2 - 0.018
  const z = 0.9 + door.ty * CORRIDOR_3D.tileWorldZ
  const rotationY = isLeft ? Math.PI / 2 : -Math.PI / 2
  const sign = isLeft ? 1 : -1

  return {
    position: [wallX, 0, z],
    rotation: [0, rotationY, 0],
    labelPosition: [wallX + sign * 0.04, 2.45, z],
    interactionPosition: [wallX + sign * 0.85, 0.9, z],
  }
}

export function getDoorStatusColor(door: DoorData): string {
  if (door.justChanged) return CORRIDOR_COLORS.orange
  if (door.isLocked) return CORRIDOR_COLORS.red
  if (!door.ownerName && door.isForRent) return CORRIDOR_COLORS.yellow
  return CORRIDOR_COLORS.green
}

export function canEnterDoor(door: DoorData, characterId: number): boolean {
  return !door.isLocked || door.ownerId === characterId
}

export function canToggleDoor(door: DoorData, characterId: number, hasMagneticCard: boolean): boolean {
  return hasMagneticCard || door.ownerId === characterId
}

export function canRentDoor(door: DoorData): boolean {
  return door.isForRent && !door.ownerName
}

export function buildDefaultNpcData(): CorridorNpc[] {
  return [
    { id: 'concierge-main', name: 'Concierge', tx: CORRIDOR_GRID.widthTiles / 2, ty: 2, color: '#445599', role: 'concierge', seed: 1 },
    { id: 'resident-12', name: 'Voisin', tx: CORRIDOR_GRID.widthTiles / 2 - 1, ty: 12, color: '#995544', role: 'resident', seed: 2 },
    { id: 'delivery-18', name: 'Livreur', tx: CORRIDOR_GRID.widthTiles / 2 + 1, ty: 18, color: '#449944', role: 'delivery', seed: 3 },
    { id: 'security-entrance', name: 'Sécurité', tx: CORRIDOR_GRID.widthTiles / 2 + 0.7, ty: 4, color: '#b45309', role: 'security', seed: 4 },
  ]
}

export function formatMoneyCAD(value: number): string {
  return `${value.toLocaleString('fr-CA')}$`
}
