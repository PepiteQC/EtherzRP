/**
 * src/weapons/systems/DamageSystem.ts
 * Emplacement exact: /home/user/etherworld/src/weapons/systems/DamageSystem.ts
 * 
 * DamageSystem — le chaînon manquant maintenant que les armes tirent.
 * 
 * - Applique dégâts selon hitPart (head/torso/arms/legs)
 * - Multiplicateurs headshot / limbs
 * - Met à jour characterStore (health + state)
 * - Déclenche ragdoll via CharacterStateMachine quand nécessaire
 * - Retourne info pour HUD / feedback
 * - Prêt pour intégration Rapier hits (via Attachment ou WeaponFire)
 * 
 * Connecté à :
 * - useCharacterStore
 * - CharacterStateMachine (pour UNCONSCIOUS / STAGGER / FULL_RAGDOLL)
 * - PlayerRagdollRig (via setRagdollActive + applyImpulse)
 * - StaminaSystem (drain sur blessure)
 */

import { useCharacterStore } from '../../store/characterStore'
import { CharacterStateMachine } from '../../systems/character/CharacterStateMachine'
import { useStaminaStore } from '../../systems/combat/StaminaSystem'

interface DamageEvent {
  targetId: string
  weaponId: string
  damage: number
  hitPart: 'head' | 'torso' | 'arms' | 'legs'
  shooterId: string
  distance: number
  // Optionnel : pour ragdoll / impulse
  hitPosition?: [number, number, number]
  impulse?: [number, number, number]
}

const HEADSHOT_MULTIPLIER = 2.5
const LEGS_MULTIPLIER = 0.6
const ARMS_MULTIPLIER = 0.7
const TORSO_MULTIPLIER = 1.0

const DAMAGE_FALLBACK: Record<string, number> = {
  pistol_9mm: 25,
  revolver_357: 40,
  carabine_22: 22,
  fusil_308: 55,
  couteau: 35,
  batte: 30,
  glock19: 42,
  mossberg_500: 78,
  remington_700: 92,
  colt_c8: 52,
  kabar: 48,
  baseball_bat: 48,
}

let damageLog: any[] = []

export function getDamageLog() {
  return [...damageLog]
}

export function clearDamageLog() {
  damageLog = []
}

export function applyDamage(event: DamageEvent) {
  const { targetId, weaponId, damage: baseDamage, hitPart, shooterId, distance, hitPosition, impulse } = event

  const weaponDamage = baseDamage || DAMAGE_FALLBACK[weaponId] || 20

  let multiplier = TORSO_MULTIPLIER
  if (hitPart === 'head') multiplier = HEADSHOT_MULTIPLIER
  else if (hitPart === 'legs') multiplier = LEGS_MULTIPLIER
  else if (hitPart === 'arms') multiplier = ARMS_MULTIPLIER

  const finalDamage = Math.round(weaponDamage * multiplier)

  const store = useCharacterStore.getState()
  const target = store.getCharacter(targetId)

  if (!target) {
    console.warn('[DamageSystem] Target not found:', targetId)
    return { finalDamage: 0, hitPart, isFatal: false, reason: 'target not found' }
  }

  const newHealth = Math.max(0, target.health - finalDamage)
  store.updateCharacter(targetId, { health: newHealth })

  // Stamina drain sur blessure
  const staminaStore = useStaminaStore.getState()
  const staminaDrain = Math.min(25, Math.floor(finalDamage * 0.6))
  staminaStore.drain(targetId, staminaDrain)

  let isFatal = false
  let newState: any = target.state

  if (newHealth <= 0) {
    isFatal = true
    newState = 'UNCONSCIOUS'
    store.setCharacterState(targetId, 'UNCONSCIOUS')
    store.setRagdollActive(targetId, true)
  } else if (hitPart === 'head' && finalDamage > 45) {
    // Headshot non fatal → stagger + ragdoll léger
    newState = 'STAGGER'
    store.setCharacterState(targetId, 'STAGGER')
    store.setRagdollActive(targetId, true)
    // Petit impulse sur la tête si position fournie
    if (hitPosition && impulse) {
      // Le rig ragdoll est géré dans PlayerRagdollRig — on log pour l'instant
      console.log('[DamageSystem] Head impulse suggested on', targetId, hitPosition)
    }
  } else if (finalDamage > 35 && hitPart !== 'legs') {
    // Gros impact → stagger
    newState = 'STAGGER'
    store.setCharacterState(targetId, 'STAGGER')
  }

  // Log pour debug / HUD
  const logEntry = {
    timestamp: Date.now(),
    targetId,
    shooterId,
    weaponId,
    hitPart,
    damage: finalDamage,
    healthBefore: target.health,
    healthAfter: newHealth,
    distance: Math.round(distance * 10) / 10,
    fatal: isFatal,
  }
  damageLog.push(logEntry)
  if (damageLog.length > 50) damageLog.shift()

  console.log(
    `[DamageSystem] ${shooterId} → ${targetId} | ${weaponId} | ${hitPart.toUpperCase()} | ${finalDamage} dmg | HP ${target.health}→${newHealth} | ${isFatal ? 'FATAL' : ''}`
  )

  // Retour pour le HUD / feedback
  return {
    finalDamage,
    hitPart,
    isFatal,
    newHealth,
    newState,
    distance: Math.round(distance * 10) / 10,
  }
}

/**
 * Helper pour créer un DamageEvent depuis un hit Rapier.
 * À appeler depuis WeaponPlayerAttachment quand un tir touche.
 */
export function createDamageEventFromHit(
  hit: any,
  shooterId: string,
  weaponId: string,
  baseDamage: number,
  origin: [number, number, number]
): DamageEvent | null {
  if (!hit || !hit.collider) return null

  // Détection basique du hitPart (à enrichir avec tags sur les RigidBody du ragdoll)
  let hitPart: DamageEvent['hitPart'] = 'torso'

  const colliderName = (hit.collider.parent?.name || '').toLowerCase()
  if (colliderName.includes('head')) hitPart = 'head'
  else if (colliderName.includes('upperleg') || colliderName.includes('lowerleg')) hitPart = 'legs'
  else if (colliderName.includes('upperarm') || colliderName.includes('lowerarm')) hitPart = 'arms'
  else if (colliderName.includes('chest') || colliderName.includes('spine')) hitPart = 'torso'

  const targetId = hit.collider.parent?.name?.split('-')[0] || 'unknown_target'

  const distance = Math.sqrt(
    Math.pow(hit.point[0] - origin[0], 2) +
    Math.pow(hit.point[1] - origin[1], 2) +
    Math.pow(hit.point[2] - origin[2], 2)
  )

  return {
    targetId,
    weaponId,
    damage: baseDamage,
    hitPart,
    shooterId,
    distance,
    hitPosition: hit.point as [number, number, number],
    impulse: [hit.normal[0] * 12, hit.normal[1] * 8 + 4, hit.normal[2] * 12], // léger push
  }
}
