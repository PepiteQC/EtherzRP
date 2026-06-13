/**
 * ImpactCalculator.ts
 * Calcule l'effet d'un impact selon la physique, l'arme, l'armure
 * Détermine la transition d'état appropriée
 */

import type { CharacterState } from './CharacterStateMachine'
import type { BodyZone } from './InjuryController'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ImpactSource =
  | 'fist'           // Poing
  | 'kick'           // Pied
  | 'baton'          // Bâton / matraque
  | 'bat'            // Batte de baseball
  | 'knife'          // Couteau
  | 'gun_9mm'        // Pistolet
  | 'gun_rifle'      // Fusil
  | 'shotgun'        // Shotgun
  | 'taser'          // Taser
  | 'vehicle_slow'   // Véhicule lent < 30km/h
  | 'vehicle_medium' // Véhicule 30-80km/h
  | 'vehicle_fast'   // Véhicule 80+km/h
  | 'explosion'      // Explosion
  | 'fall'           // Chute

export interface ImpactEvent {
  source:        ImpactSource
  force:         number        // Newtons/unités physiques
  velocity?:     number        // m/s si véhicule
  zone:          BodyZone
  attackerRole?: 'police' | 'gang' | 'civilian'
  targetArmor?:  number        // 0-100 niveau armure
  targetStamina: number        // 0-100
  targetState:   CharacterState
  isBackAttack?: boolean
  isSurpriseAttack?: boolean
}

export interface ImpactResult {
  nextState:       CharacterState
  ragdollForce:    number        // Force appliquée au ragdoll
  ragdollDirection: [number, number, number]
  injuryType:      InjuryType
  stunDuration:    number        // ms
  staminaDrain:    number        // Points stamina perdus
  healthDamage:    number        // Points vie perdus
  isTased:         boolean
  isKnocked:       boolean
}

export type InjuryType =
  | 'none'
  | 'bruise'
  | 'cut'
  | 'fracture'
  | 'gunshot'
  | 'concussion'
  | 'sprain'

// ─────────────────────────────────────────────
// SEUILS D'IMPACT → ÉTAT
// ─────────────────────────────────────────────

const FORCE_THRESHOLDS = {
  NOTHING:      0,
  HIT_REACTION: 2,
  STAGGER:      5,
  STUMBLE:      8,
  SOFT_RAGDOLL: 12,
  FULL_RAGDOLL: 20,
  KNOCKDOWN:    25,
} as const

// ─────────────────────────────────────────────
// PROFILS D'ARMES
// ─────────────────────────────────────────────

const WEAPON_PROFILES: Record<ImpactSource, {
  baseDamage:    number
  baseForce:     number
  stunMs:        number
  injuryType:    InjuryType
  armorPenetration: number  // 0-1
}> = {
  fist:           { baseDamage: 8,   baseForce: 4,   stunMs: 200,  injuryType: 'bruise',    armorPenetration: 0.0 },
  kick:           { baseDamage: 12,  baseForce: 6,   stunMs: 300,  injuryType: 'bruise',    armorPenetration: 0.0 },
  baton:          { baseDamage: 18,  baseForce: 9,   stunMs: 600,  injuryType: 'bruise',    armorPenetration: 0.2 },
  bat:            { baseDamage: 25,  baseForce: 14,  stunMs: 800,  injuryType: 'fracture',  armorPenetration: 0.1 },
  knife:          { baseDamage: 30,  baseForce: 3,   stunMs: 400,  injuryType: 'cut',       armorPenetration: 0.5 },
  gun_9mm:        { baseDamage: 35,  baseForce: 8,   stunMs: 500,  injuryType: 'gunshot',   armorPenetration: 0.6 },
  gun_rifle:      { baseDamage: 55,  baseForce: 15,  stunMs: 700,  injuryType: 'gunshot',   armorPenetration: 0.8 },
  shotgun:        { baseDamage: 65,  baseForce: 22,  stunMs: 900,  injuryType: 'gunshot',   armorPenetration: 0.7 },
  taser:          { baseDamage: 0,   baseForce: 0,   stunMs: 4000, injuryType: 'none',      armorPenetration: 0.9 },
  vehicle_slow:   { baseDamage: 15,  baseForce: 10,  stunMs: 600,  injuryType: 'bruise',    armorPenetration: 1.0 },
  vehicle_medium: { baseDamage: 45,  baseForce: 28,  stunMs: 1200, injuryType: 'fracture',  armorPenetration: 1.0 },
  vehicle_fast:   { baseDamage: 80,  baseForce: 55,  stunMs: 2000, injuryType: 'fracture',  armorPenetration: 1.0 },
  explosion:      { baseDamage: 70,  baseForce: 40,  stunMs: 1500, injuryType: 'bruise',    armorPenetration: 1.0 },
  fall:           { baseDamage: 20,  baseForce: 18,  stunMs: 800,  injuryType: 'sprain',    armorPenetration: 1.0 },
}

// ─────────────────────────────────────────────
// MODIFICATEURS ZONES
// ─────────────────────────────────────────────

const ZONE_MODIFIERS: Record<BodyZone, {
  damageMultiplier: number
  forceMultiplier:  number
  specialEffect?:   string
}> = {
  head:       { damageMultiplier: 2.0, forceMultiplier: 1.8, specialEffect: 'concussion' },
  neck:       { damageMultiplier: 1.8, forceMultiplier: 1.5, specialEffect: 'choke' },
  chest:      { damageMultiplier: 1.0, forceMultiplier: 1.0 },
  stomach:    { damageMultiplier: 0.9, forceMultiplier: 0.8, specialEffect: 'wind_knocked' },
  pelvis:     { damageMultiplier: 0.8, forceMultiplier: 0.9 },
  upper_arm:  { damageMultiplier: 0.7, forceMultiplier: 0.6 },
  lower_arm:  { damageMultiplier: 0.6, forceMultiplier: 0.5 },
  hand:       { damageMultiplier: 0.5, forceMultiplier: 0.4, specialEffect: 'weapon_drop' },
  upper_leg:  { damageMultiplier: 0.8, forceMultiplier: 0.7, specialEffect: 'limp' },
  lower_leg:  { damageMultiplier: 0.7, forceMultiplier: 0.6, specialEffect: 'limp' },
  foot:       { damageMultiplier: 0.5, forceMultiplier: 0.4, specialEffect: 'limp' },
  back:       { damageMultiplier: 1.1, forceMultiplier: 1.3, specialEffect: 'forward_fall' },
  spine:      { damageMultiplier: 1.5, forceMultiplier: 1.4 },
}

// ─────────────────────────────────────────────
// CALCULATEUR
// ─────────────────────────────────────────────

export class ImpactCalculator {
  calculate(event: ImpactEvent): ImpactResult {
    const profile  = WEAPON_PROFILES[event.source]
    const zoneMod  = ZONE_MODIFIERS[event.zone]
    const armor    = event.targetArmor ?? 0
    const stamina  = event.targetStamina

    // Calcul armure effective
    const armorReduction = armor * (1 - profile.armorPenetration) / 100

    // Force effective
    const effectiveForce = profile.baseForce
      * zoneMod.forceMultiplier
      * (1 - armorReduction)
      * (event.isBackAttack ? 1.3 : 1.0)
      * (event.isSurpriseAttack ? 1.5 : 1.0)
      * this.getStaminaModifier(stamina)

    // Dommages effectifs
    const effectiveDamage = profile.baseDamage
      * zoneMod.damageMultiplier
      * (1 - armorReduction * 0.5)

    // Déterminer le prochain état
    const nextState = this.resolveState(
      effectiveForce,
      event.source,
      event.targetState,
      zoneMod.specialEffect
    )

    // Direction du ragdoll
    const ragdollDir = this.computeRagdollDirection(
      event.zone,
      event.isBackAttack ?? false
    )

    return {
      nextState,
      ragdollForce:     effectiveForce * 2.5,
      ragdollDirection: ragdollDir,
      injuryType:       this.resolveInjury(profile.injuryType, effectiveDamage, event.zone),
      stunDuration:     profile.stunMs * (1 + (1 - stamina / 100) * 0.5),
      staminaDrain:     effectiveForce * 3,
      healthDamage:     effectiveDamage,
      isTased:          event.source === 'taser',
      isKnocked:        effectiveForce >= FORCE_THRESHOLDS.KNOCKDOWN,
    }
  }

  private getStaminaModifier(stamina: number): number {
    // Stamina basse = plus vulnérable
    if (stamina > 80) return 0.85
    if (stamina > 60) return 1.00
    if (stamina > 40) return 1.15
    if (stamina > 20) return 1.30
    return 1.50
  }

  private resolveState(
    force: number,
    source: ImpactSource,
    currentState: CharacterState,
    specialEffect?: string
  ): CharacterState {
    // Taser → toujours TASED
    if (source === 'taser') return 'TASED'

    // Véhicule rapide → toujours FULL_RAGDOLL
    if (source === 'vehicle_fast' || source === 'explosion') return 'FULL_RAGDOLL'

    // Coup à la tête → concussion
    if (specialEffect === 'concussion' && force > 10) return 'FULL_RAGDOLL'

    // Seuils de force
    if (force >= FORCE_THRESHOLDS.FULL_RAGDOLL)  return 'FULL_RAGDOLL'
    if (force >= FORCE_THRESHOLDS.SOFT_RAGDOLL)  return 'SOFT_RAGDOLL'
    if (force >= FORCE_THRESHOLDS.STUMBLE)        return 'STUMBLE'
    if (force >= FORCE_THRESHOLDS.STAGGER)        return 'STAGGER'

    return currentState // Pas de changement
  }

  private resolveInjury(base: InjuryType, damage: number, zone: BodyZone): InjuryType {
    if (damage > 50 && base === 'gunshot')  return 'gunshot'
    if (damage > 40 && zone === 'head')     return 'concussion'
    if (damage > 35 && base !== 'none')     return 'fracture'
    return base
  }

  private computeRagdollDirection(zone: BodyZone, isBackAttack: boolean): [number, number, number] {
    const directions: Record<BodyZone, [number, number, number]> = {
      head:       [0,  0.3, isBackAttack ? 1 : -1],
      chest:      [0,  0.1, isBackAttack ? 1 : -1],
      back:       [0,  0.1, 1],
      stomach:    [0, -0.1, -1],
      pelvis:     [0, -0.2, -1],
      upper_leg:  [0, -0.3,  0],
      lower_leg:  [0, -0.4,  0],
      foot:       [0, -0.4,  0],
      upper_arm:  [isBackAttack ? -1 : 1, 0.1, 0],
      lower_arm:  [isBackAttack ? -1 : 1, 0,   0],
      hand:       [isBackAttack ? -1 : 1, 0,   0],
      neck:       [0, 0.4, -1],
      spine:      [0, 0.2, -1],
    }
    return directions[zone] ?? [0, 0.2, -1]
  }
}

export const impactCalculator = new ImpactCalculator()