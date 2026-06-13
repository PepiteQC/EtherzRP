/**
 * InjuryController.ts
 * Gestion des blessures par zone corporelle
 * Effets sur démarche, capacités, animations
 */

import { create } from 'zustand'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type BodyZone =
  | 'head' | 'neck' | 'chest' | 'stomach' | 'back' | 'spine'
  | 'upper_arm' | 'lower_arm' | 'hand'
  | 'pelvis' | 'upper_leg' | 'lower_leg' | 'foot'

export type InjurySeverity = 'none' | 'minor' | 'moderate' | 'severe' | 'critical'

export type LimbSide = 'left' | 'right' | 'center'

export interface ZoneInjury {
  zone:       BodyZone
  severity:   InjurySeverity
  injuryType: string
  timestamp:  number
  treated:    boolean
  bleeding:   boolean
  side?:      LimbSide
}

export interface BodyCondition {
  // Zones blessées
  injuries:       ZoneInjury[]

  // Effets globaux calculés
  moveSpeedMult:  number        // 0-1
  aimAccuracy:    number        // 0-1
  canRun:         boolean
  canFight:       boolean
  canHoldWeapon:  boolean
  isLimping:      boolean
  limp:           'none' | 'left' | 'right'
  isBleeding:     boolean
  bleedRate:      number        // HP/s

  // Tête/conscience
  isBlurryVision: boolean
  isDizzy:        boolean
  isConcussed:    boolean
}

// ─────────────────────────────────────────────
// EFFETS DES BLESSURES SUR LE GAMEPLAY
// ─────────────────────────────────────────────

const ZONE_EFFECTS: Record<BodyZone, Partial<BodyCondition>> = {
  head:       { isDizzy: true, isBlurryVision: true, isConcussed: true, aimAccuracy: 0.4 },
  neck:       { isBlurryVision: true, aimAccuracy: 0.6 },
  chest:      { moveSpeedMult: 0.7, canRun: false },
  stomach:    { moveSpeedMult: 0.6, canRun: false, canFight: false },
  back:       { moveSpeedMult: 0.7, canRun: false },
  spine:      { moveSpeedMult: 0.3, canRun: false, canFight: false },
  pelvis:     { moveSpeedMult: 0.5, canRun: false, isLimping: true },
  upper_arm:  { aimAccuracy: 0.5, canHoldWeapon: false },
  lower_arm:  { aimAccuracy: 0.6, canHoldWeapon: false },
  hand:       { canHoldWeapon: false, aimAccuracy: 0.4 },
  upper_leg:  { isLimping: true, moveSpeedMult: 0.55, canRun: false },
  lower_leg:  { isLimping: true, moveSpeedMult: 0.6 },
  foot:       { isLimping: true, moveSpeedMult: 0.65 },
}

// ─────────────────────────────────────────────
// INJURY CONTROLLER
// ─────────────────────────────────────────────

export class InjuryController {
  private injuries: Map<BodyZone, ZoneInjury> = new Map()
  private listeners: Set<(condition: BodyCondition) => void> = new Set()

  addInjury(zone: BodyZone, type: string, severity: InjurySeverity, side?: LimbSide): void {
    const existing = this.injuries.get(zone)

    // Aggraver si déjà blessé
    const newSeverity = existing
      ? this.escalateSeverity(existing.severity, severity)
      : severity

    this.injuries.set(zone, {
      zone,
      severity:   newSeverity,
      injuryType: type,
      timestamp:  Date.now(),
      treated:    false,
      bleeding:   newSeverity === 'severe' || newSeverity === 'critical',
      side:        side ?? existing?.side ?? this.inferSide(zone),
    })

    this.notify()
  }

  treatInjury(zone: BodyZone, healAmount: number): void {
    const injury = this.injuries.get(zone)
    if (!injury) return

    const newSeverity = this.reduceSeverity(injury.severity, healAmount)
    if (newSeverity === 'none') {
      this.injuries.delete(zone)
    } else {
      this.injuries.set(zone, {
        ...injury,
        severity: newSeverity,
        treated:  true,
        bleeding: false,
      })
    }

    this.notify()
  }

  getCondition(): BodyCondition {
    let condition: BodyCondition = {
      injuries:       Array.from(this.injuries.values()),
      moveSpeedMult:  1.0,
      aimAccuracy:    1.0,
      canRun:         true,
      canFight:       true,
      canHoldWeapon:  true,
      isLimping:      false,
      limp:           'none',
      isBleeding:     false,
      bleedRate:      0,
      isBlurryVision: false,
      isDizzy:        false,
      isConcussed:    false,
    }

    this.injuries.forEach((injury, zone) => {
      if (injury.severity === 'none') return

      const severityMult = {
        minor:    0.25,
        moderate: 0.6,
        severe:   1.0,
        critical: 1.5,
        none:     0,
      }[injury.severity]

      const effects = ZONE_EFFECTS[zone]

      // Appliquer effets selon sévérité
      if (effects.moveSpeedMult !== undefined) {
        condition.moveSpeedMult = Math.min(
          condition.moveSpeedMult,
          1 - (1 - effects.moveSpeedMult) * severityMult
        )
      }
      if (effects.canRun === false && severityMult >= 0.6)    condition.canRun = false
      if (effects.canFight === false && severityMult >= 0.6)   condition.canFight = false
      if (effects.canHoldWeapon === false && severityMult >= 0.25) condition.canHoldWeapon = false
      if (effects.isDizzy)         condition.isDizzy = true
      if (effects.isBlurryVision)  condition.isBlurryVision = true
      if (effects.isConcussed)     condition.isConcussed = true
      if (effects.isLimping)       condition.isLimping = true

      // Saignement
      if (injury.bleeding) {
        condition.isBleeding = true
        condition.bleedRate += {
          minor: 0.5, moderate: 1.5, severe: 3.0, critical: 5.0, none: 0,
        }[injury.severity]
      }

      // Déterminer côté boiterie.
      // Ancien code: zone.includes('_L') ne pouvait pas marcher avec BodyZone = 'upper_leg' | 'foot'.
      // On respecte maintenant le côté optionnel de l'injury, avec fallback stable.
      if (effects.isLimping) {
        const side = injury.side ?? this.inferSide(zone)
        condition.limp = side === 'left' ? 'left' : side === 'right' ? 'right' : condition.limp
      }
    })

    condition.aimAccuracy = Math.max(0.1, condition.aimAccuracy)
    condition.moveSpeedMult = Math.max(0.15, condition.moveSpeedMult)

    return condition
  }

  private inferSide(zone: BodyZone): LimbSide {
    // Les BodyZone historiques ne contiennent pas encore gauche/droite.
    // Pour compatibilité: zones de jambes/pieds sans side explicite = right.
    // Les nouveaux appels peuvent passer addInjury('lower_leg', 'fracture', 'severe', 'left').
    if (zone.includes('leg') || zone === 'foot') return 'right'
    if (zone.includes('arm') || zone === 'hand') return 'right'
    return 'center'
  }

  private escalateSeverity(current: InjurySeverity, incoming: InjurySeverity): InjurySeverity {
    const levels: InjurySeverity[] = ['none', 'minor', 'moderate', 'severe', 'critical']
    const ci = levels.indexOf(current)
    const ii = levels.indexOf(incoming)
    return levels[Math.min(4, Math.max(ci, ii) + (ci === ii ? 1 : 0))]
  }

  private reduceSeverity(current: InjurySeverity, amount: number): InjurySeverity {
    const levels: InjurySeverity[] = ['none', 'minor', 'moderate', 'severe', 'critical']
    const ci = levels.indexOf(current)
    return levels[Math.max(0, ci - Math.floor(amount / 25))]
  }

  private notify(): void {
    const condition = this.getCondition()
    this.listeners.forEach(fn => fn(condition))
  }

  subscribe(fn: (condition: BodyCondition) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  clearAll(): void {
    this.injuries.clear()
    this.notify()
  }
}