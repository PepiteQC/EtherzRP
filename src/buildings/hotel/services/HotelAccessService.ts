/**
 * src/buildings/hotel/services/HotelAccessService.ts
 * Service d'accès hôtel temps réel.
 *
 * Browser/dev:
 * - utilise HotelRealtimeSecurity (BroadcastChannel + localStorage)
 *
 * Production future:
 * - mêmes payloads, mais proxy Cloud Functions/Firebase Admin.
 */

import type { DoorId, LockId, RoomId } from '../../shared/types'
import { makeAccessAttempt, hotelRealtimeSecurity } from '../security/HotelRealtimeSecurity'
import type { HotelAccessMethod, HotelAccessResult } from '../security/HotelSecurityTypes'

export interface HotelAccessRequest {
  roomId: RoomId
  doorId?: DoorId
  lockId?: LockId
  method: HotelAccessMethod
  actorId?: string
  code?: string
  cardUid?: string
}

export interface HotelAccessResponse {
  granted: boolean
  result: string
  message: string
  state: string
  updatedAt: number
}

export async function attemptRoomAccess(req: HotelAccessRequest): Promise<HotelAccessResponse> {
  const result: HotelAccessResult = await makeAccessAttempt({
    roomId: req.roomId,
    method: req.method,
    actorId: req.actorId,
    cardUid: req.cardUid,
    pin: req.code,
  })

  return {
    granted: result.granted,
    result: result.reason,
    message: result.message,
    state: result.state.state,
    updatedAt: result.state.updatedAt,
  }
}

export async function attemptRoomEntry(roomId: RoomId, actorId = 'player-local'): Promise<HotelAccessResponse> {
  return attemptRoomAccess({
    roomId,
    method: 'connected_app',
    actorId,
  })
}

export async function attemptRoomWithMagneticCard(roomId: RoomId, cardUid: string, actorId = 'player-local') {
  return attemptRoomAccess({
    roomId,
    method: 'magnetic_card',
    actorId,
    cardUid,
  })
}

export async function attemptRoomWithNumpad(roomId: RoomId, code: string, actorId = 'player-local') {
  return attemptRoomAccess({
    roomId,
    method: 'numpad',
    actorId,
    code,
  })
}

export function createHotelSecurityFirebaseSeed() {
  return hotelRealtimeSecurity.createFirebaseSeed()
}
