/**
 * GaitController.ts
 * Contrôle de la démarche selon état + blessures
 * Détermine l'animation à jouer
 */

import type { CharacterState } from './CharacterStateMachine'
import type { BodyCondition } from './InjuryController'

// ─────────────────────────────────────────────
// DÉMARCHES DISPONIBLES
// ─────────────────────────────────────────────

export type GaitType =
  | 'idle'
  | 'walk_normal'
  | 'walk_injured_left'
  | 'walk_injured_right'
  | 'walk_handcuffed'
  | 'walk_hands_up'
  | 'walk_exhausted'
  | 'walk_combat'
  | 'walk_sneaking'
  | 'walk_police_escort'
  | 'run_normal'
  | 'run_injured'
  | 'run_sprint'
  | 'stagger'
  | 'stumble'
  | 'recovering'
  | 'dragged_pose'
  | 'carried_pose'
  | 'seated'
  | 'hands_up_stand'
  | 'surrendered_kneel'
  | 'unconscious'
  | 'dead'

export interface GaitConfig {
  gait:         GaitType
  speedMult:    number       // multiplicateur vitesse
  canStrafe:    boolean      // déplacements latéraux
  canSprint:    boolean
  canJump:      boolean
  headBobAmp:   number       // amplitude head bob 0-1
  bodyLean:     number       // inclinaison corps -1 à 1
  armSwing:     number       // amplitude bras 0-1
}

// ─────────────────────────────────────────────
// PROFILS DE DÉMARCHE
// ─────────────────────────────────────────────

const GAIT_CONFIGS: Record<GaitType, Omit<GaitConfig, 'gait'>> = {
  idle:                { speedMult: 0,    canStrafe: true,  canSprint: false, canJump: true,  headBobAmp: 0,    bodyLean: 0,    armSwing: 0 },
  walk_normal:         { speedMult: 1.0,  canStrafe: true,  canSprint: true,  canJump: true,  headBobAmp: 0.6,  bodyLean: 0,    armSwing: 0.7 },
  walk_injured_left:   { speedMult: 0.55, canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.9,  bodyLean: 0.3,  armSwing: 0.5 },
  walk_injured_right:  { speedMult: 0.55, canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.9,  bodyLean: -0.3, armSwing: 0.5 },
  walk_handcuffed:     { speedMult: 0.55, canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.4,  bodyLean: 0.1,  armSwing: 0 },
  walk_hands_up:       { speedMult: 0.4,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.3,  bodyLean: 0,    armSwing: 0 },
  walk_exhausted:      { speedMult: 0.5,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 1.0,  bodyLean: 0.15, armSwing: 0.4 },
  walk_combat:         { speedMult: 0.75, canStrafe: true,  canSprint: true,  canJump: true,  headBobAmp: 0.4,  bodyLean: -0.2, armSwing: 0.3 },
  walk_sneaking:       { speedMult: 0.45, canStrafe: true,  canSprint: false, canJump: false, headBobAmp: 0.2,  bodyLean: -0.3, armSwing: 0.2 },
  walk_police_escort:  { speedMult: 0.55, canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.4,  bodyLean: 0.1,  armSwing: 0 },
  run_normal:          { speedMult: 2.2,  canStrafe: true,  canSprint: true,  canJump: true,  headBobAmp: 0.8,  bodyLean: -0.2, armSwing: 1.0 },
  run_injured:         { speedMult: 1.3,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 1.2,  bodyLean: 0.2,  armSwing: 0.7 },
  run_sprint:          { speedMult: 3.0,  canStrafe: false, canSprint: true,  canJump: true,  headBobAmp: 1.0,  bodyLean: -0.4, armSwing: 1.2 },
  stagger:             { speedMult: 0.3,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 1.5,  bodyLean: 0.4,  armSwing: 0.8 },
  stumble:             { speedMult: 0.1,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 2.0,  bodyLean: 0.6,  armSwing: 1.0 },
  recovering:          { speedMult: 0.2,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.8,  bodyLean: 0.2,  armSwing: 0.5 },
  dragged_pose:        { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 1.0,  armSwing: 0 },
  carried_pose:        { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 0.8,  armSwing: 0 },
  seated:              { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.1,  bodyLean: 0,    armSwing: 0 },
  hands_up_stand:      { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.05, bodyLean: 0,    armSwing: 0 },
  surrendered_kneel:   { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 0,    armSwing: 0 },
  unconscious:         { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 1.0,  armSwing: 0 },
  dead:                { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 1.0,  armSwing: 0 },
}

// ─────────────────────────────────────────────
// RÉSOLUTION DE DÉMARCHE
// ─────────────────────────────────────────────

export class GaitController {
  resolveGait(
    charState: CharacterState,
    bodyCondition: BodyCondition,
    isMoving: boolean,
    isSprinting: boolean,
    hasWeapon: boolean,
    isSneaking: boolean
  ): GaitConfig {
    const gaitType = this.selectGait(
      charState, bodyCondition, isMoving, isSprinting, hasWeapon, isSneaking
    )

    const config = GAIT_CONFIGS[gaitType]

    // Appliquer modificateurs blessure
    const finalSpeedMult = config.speedMult * bodyCondition.moveSpeedMult

    return {
      gait: gaitType,
      ...config,
      speedMult: finalSpeedMult,
      canSprint: config.canSprint && bodyCondition.canRun,
      canJump:   config.canJump && bodyCondition.moveSpeedMult > 0.5,
    }
  }

  private selectGait(
    charState: CharacterState,
    body: BodyCondition,
    isMoving: boolean,
    isSprinting: boolean,
    hasWeapon: boolean,
    isSneaking: boolean
  ): GaitType {
    // États forcés
    switch (charState) {
      case 'DEAD':           return 'dead'
      case 'UNCONSCIOUS':    return 'unconscious'
      case 'DRAGGED':        return 'dragged_pose'
      case 'CARRIED':        return 'carried_pose'
      case 'VEHICLE_SEATED': return 'seated'
      case 'RESTRAINED':
        return isMoving ? 'walk_handcuffed' : 'hands_up_stand'
      case 'HANDS_UP':       return 'hands_up_stand'
      case 'SURRENDERED':    return 'surrendered_kneel'
      case 'STAGGER':        return 'stagger'
      case 'STUMBLE':        return 'stumble'
      case 'RECOVERING':     return 'recovering'
    }

    if (!isMoving) return 'idle'

    // Blessures graves
    if (!body.canRun && body.moveSpeedMult < 0.5) {
      return body.limp === 'left'  ? 'walk_injured_left'
           : body.limp === 'right' ? 'walk_injured_right'
           : 'walk_exhausted'
    }

    // Sprint
    if (isSprinting && body.canRun) {
      return body.isLimping ? 'run_injured' : 'run_sprint'
    }

    // Course
    if (isSprinting && !body.canRun) {
      return body.isLimping ? 'walk_injured_left' : 'walk_exhausted'
    }

    // Course normale
    if (!isSprinting && body.canRun && !body.isLimping) {
      if (isSneaking) return 'walk_sneaking'
      if (hasWeapon)  return 'walk_combat'
      return 'walk_normal'
    }

    // Boiterie
    if (body.limp === 'left')  return 'walk_injured_left'
    if (body.limp === 'right') return 'walk_injured_right'

    return 'walk_normal'
  }
}

export const gaitController = new GaitController()