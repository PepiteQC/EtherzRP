import type { DoorId, LockId, RoomId } from '../../shared/types'

export type HotelAccessMethod = 'magnetic_card' | 'numpad' | 'staff_override' | 'connected_app'
export type HotelDoorState = 'locked' | 'unlocked' | 'open' | 'alarm' | 'lockout'

export interface HotelDoorSecurityState {
  roomId: RoomId
  doorId: DoorId
  lockId: LockId
  state: HotelDoorState
  isOpen: boolean
  isLocked: boolean
  failedAttempts: number
  lastMethod?: HotelAccessMethod
  lastActorId?: string
  lastMessage?: string
  updatedAt: number
  lockoutUntil?: number
}

export interface HotelAccessCredential {
  actorId: string
  cardUid?: string
  pin?: string
  roomIds: RoomId[] | 'all'
  role: 'guest' | 'resident' | 'staff' | 'admin'
  expiresAt?: number
}

export interface HotelAccessAttempt {
  roomId: RoomId
  doorId: DoorId
  lockId: LockId
  method: HotelAccessMethod
  actorId: string
  cardUid?: string
  pin?: string
  createdAt: number
}

export interface HotelAccessResult {
  granted: boolean
  state: HotelDoorSecurityState
  message: string
  reason: 'granted' | 'denied' | 'expired' | 'bad_pin' | 'bad_card' | 'lockout' | 'forced'
}
