import type { CardAccessLevel } from './types'

export interface DoorInteractionResult {
  granted: boolean
  reason: string
  doorId: string
}

const accessRank: Record<string, number> = {
  guest: 0,
  resident: 1,
  vip: 2,
  staff: 3,
  admin: 4,
}

export const doorController = {
  requestDoorInteraction(
    doorId: string,
    playerCard?: CardAccessLevel | string | null,
    apartmentId?: string,
    requiredLevel: CardAccessLevel | string = 'resident',
  ): DoorInteractionResult {
    const current = accessRank[String(playerCard ?? 'guest')] ?? 0
    const required = accessRank[String(requiredLevel)] ?? 1
    const granted = current >= required
    return {
      granted,
      doorId,
      reason: granted
        ? `Accès autorisé${apartmentId ? ` — ${apartmentId}` : ''}`
        : `Accès refusé — carte ${requiredLevel} requise`,
    }
  },
  canOpen(playerCard?: CardAccessLevel | string | null, requiredLevel: CardAccessLevel | string = 'resident') {
    return (accessRank[String(playerCard ?? 'guest')] ?? 0) >= (accessRank[String(requiredLevel)] ?? 1)
  },
}

export default doorController
