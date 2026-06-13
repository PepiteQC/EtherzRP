export type CardAccessLevel = 'guest' | 'resident' | 'vip' | 'staff' | 'admin'

export interface ApartmentDoorConfig {
  id: string
  position: [number, number, number]
  rotation: [number, number, number]
  isLocked: boolean
  lightOn: boolean
  occupied: boolean
  number: string
  doorColor: string
}

export interface CorridorLightConfig {
  id: string
  position: [number, number, number]
  intensity: number
  color: string
}

export interface DecorItem {
  id: string
  type: 'plant' | 'bench'
  position: [number, number, number]
}

export const CARD_COLORS: Record<CardAccessLevel, string> = {
  guest: '#9ca3af',
  resident: '#22c55e',
  vip: '#a855f7',
  staff: '#3b82f6',
  admin: '#ef4444',
}

export type ExtendedCardAccessLevel = CardAccessLevel | 'guest' | 'vip'

export interface CorridorApartment {
  id: string
  number: string
  floor: number
  side: 'left' | 'right'
  position: [number, number, number]
  rotation: [number, number, number]
  accessLevel: ExtendedCardAccessLevel
  doorState: 'closed' | 'open' | 'locked'
  isLocked: boolean
  occupied: boolean
  forRent: boolean
  owner?: string
  rent?: number
  doorColor: string
  lightOn: boolean
}
