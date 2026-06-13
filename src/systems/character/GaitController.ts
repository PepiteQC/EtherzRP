/**
 * GaitController.ts
 * Contrôle de la démarche selon état + blessures.
 *
 * Objectif EtherzRP:
 * - garder une logique RP claire: menotté, mains en l'air, blessé, inconscient, etc.;
 * - retourner une config exploitable par Walker / PlayerController / animations GLB plus tard;
 * - ne pas dépendre d'un modèle 3D précis: si les clips n'existent pas encore,
 *   le contrôleur fournit quand même vitesse, head bob, lean, permissions.
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

export type GaitPosture = 'standing' | 'crouched' | 'kneeling' | 'seated' | 'ground' | 'carried'
export type GaitMood = 'neutral' | 'alert' | 'combat' | 'injured' | 'restrained' | 'downed'

export interface GaitConfig {
  gait:         GaitType
  speedMult:    number       // multiplicateur vitesse finale
  canStrafe:    boolean      // déplacements latéraux
  canSprint:    boolean
  canJump:      boolean
  headBobAmp:   number       // amplitude head bob 0-1+ selon urgence/blessure
  bodyLean:     number       // inclinaison corps -1 à 1
  armSwing:     number       // amplitude bras 0-1+

  // Extensions propres au runtime EtherzRP
  animation:    string       // nom clip cible futur: GLB/Mixamo/custom
  blendTime:    number       // temps de blend animation en secondes
  turnMult:     number       // vitesse de rotation
  accelMult:    number       // douceur accélération/décélération
  posture:      GaitPosture
  mood:         GaitMood
  stepInterval: number       // intervalle pas en ms, utile pour footsteps
  noiseRadius:  number       // furtivité / IA police plus tard
  canInteract:  boolean
  canEnterVehicle: boolean
}

export interface GaitResolveInput {
  charState: CharacterState
  bodyCondition: BodyCondition
  isMoving: boolean
  isSprinting: boolean
  hasWeapon: boolean
  isSneaking: boolean
  isEscorted?: boolean
  stamina01?: number
  surface?: 'asphalt' | 'concrete' | 'grass' | 'snow' | 'ice' | 'interior'
}

// ─────────────────────────────────────────────
// DEFAULT BODY CONDITION — utile pour composants qui ne sont pas encore branchés au InjuryController
// ─────────────────────────────────────────────

export const DEFAULT_BODY_CONDITION: BodyCondition = {
  injuries: [],
  moveSpeedMult: 1,
  aimAccuracy: 1,
  canRun: true,
  canFight: true,
  canHoldWeapon: true,
  isLimping: false,
  limp: 'none',
  isBleeding: false,
  bleedRate: 0,
  isBlurryVision: false,
  isDizzy: false,
  isConcussed: false,
}

// ─────────────────────────────────────────────
// PROFILS DE DÉMARCHE
// ─────────────────────────────────────────────

type GaitProfile = Omit<GaitConfig, 'gait'>

const GAIT_CONFIGS: Record<GaitType, GaitProfile> = {
  idle:                { speedMult: 0,    canStrafe: true,  canSprint: false, canJump: true,  headBobAmp: 0,    bodyLean: 0,    armSwing: 0,   animation: 'Idle',               blendTime: 0.18, turnMult: 1.0, accelMult: 1.0, posture: 'standing', mood: 'neutral',    stepInterval: 0,    noiseRadius: 0.4,  canInteract: true,  canEnterVehicle: true },
  walk_normal:         { speedMult: 1.0,  canStrafe: true,  canSprint: true,  canJump: true,  headBobAmp: 0.6,  bodyLean: 0,    armSwing: 0.7, animation: 'Walk',               blendTime: 0.16, turnMult: 1.0, accelMult: 1.0, posture: 'standing', mood: 'neutral',    stepInterval: 520,  noiseRadius: 4.0,  canInteract: true,  canEnterVehicle: true },
  walk_injured_left:   { speedMult: 0.55, canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.9,  bodyLean: 0.3,  armSwing: 0.5, animation: 'Walk_Injured_L',     blendTime: 0.20, turnMult: 0.62, accelMult: 0.45, posture: 'standing', mood: 'injured',    stepInterval: 780,  noiseRadius: 3.0,  canInteract: true,  canEnterVehicle: true },
  walk_injured_right:  { speedMult: 0.55, canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.9,  bodyLean: -0.3, armSwing: 0.5, animation: 'Walk_Injured_R',     blendTime: 0.20, turnMult: 0.62, accelMult: 0.45, posture: 'standing', mood: 'injured',    stepInterval: 780,  noiseRadius: 3.0,  canInteract: true,  canEnterVehicle: true },
  walk_handcuffed:     { speedMult: 0.55, canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.4,  bodyLean: 0.1,  armSwing: 0,   animation: 'Walk_Handcuffed',    blendTime: 0.18, turnMult: 0.55, accelMult: 0.55, posture: 'standing', mood: 'restrained', stepInterval: 740,  noiseRadius: 2.6,  canInteract: false, canEnterVehicle: true },
  walk_hands_up:       { speedMult: 0.4,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.3,  bodyLean: 0,    armSwing: 0,   animation: 'Walk_Hands_Up',     blendTime: 0.18, turnMult: 0.50, accelMult: 0.50, posture: 'standing', mood: 'restrained', stepInterval: 820,  noiseRadius: 2.2,  canInteract: false, canEnterVehicle: false },
  walk_exhausted:      { speedMult: 0.5,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 1.0,  bodyLean: 0.15, armSwing: 0.4, animation: 'Walk_Exhausted',    blendTime: 0.20, turnMult: 0.70, accelMult: 0.42, posture: 'standing', mood: 'injured',    stepInterval: 860,  noiseRadius: 3.4,  canInteract: true,  canEnterVehicle: true },
  walk_combat:         { speedMult: 0.75, canStrafe: true,  canSprint: true,  canJump: true,  headBobAmp: 0.4,  bodyLean: -0.2, armSwing: 0.3, animation: 'Walk_Combat',       blendTime: 0.14, turnMult: 1.18, accelMult: 0.85, posture: 'standing', mood: 'combat',     stepInterval: 560,  noiseRadius: 5.5,  canInteract: true,  canEnterVehicle: true },
  walk_sneaking:       { speedMult: 0.45, canStrafe: true,  canSprint: false, canJump: false, headBobAmp: 0.2,  bodyLean: -0.3, armSwing: 0.2, animation: 'Walk_Sneak',        blendTime: 0.22, turnMult: 0.85, accelMult: 0.70, posture: 'crouched', mood: 'alert',      stepInterval: 980,  noiseRadius: 1.1,  canInteract: true,  canEnterVehicle: false },
  walk_police_escort:  { speedMult: 0.55, canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.4,  bodyLean: 0.1,  armSwing: 0,   animation: 'Walk_Escorted',     blendTime: 0.18, turnMult: 0.50, accelMult: 0.50, posture: 'standing', mood: 'restrained', stepInterval: 740,  noiseRadius: 2.6,  canInteract: false, canEnterVehicle: true },
  run_normal:          { speedMult: 2.2,  canStrafe: true,  canSprint: true,  canJump: true,  headBobAmp: 0.8,  bodyLean: -0.2, armSwing: 1.0, animation: 'Run',                blendTime: 0.12, turnMult: 1.05, accelMult: 1.20, posture: 'standing', mood: 'neutral',    stepInterval: 330,  noiseRadius: 9.0,  canInteract: true,  canEnterVehicle: true },
  run_injured:         { speedMult: 1.3,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 1.2,  bodyLean: 0.2,  armSwing: 0.7, animation: 'Run_Injured',        blendTime: 0.16, turnMult: 0.70, accelMult: 0.65, posture: 'standing', mood: 'injured',    stepInterval: 470,  noiseRadius: 7.0,  canInteract: true,  canEnterVehicle: true },
  run_sprint:          { speedMult: 3.0,  canStrafe: false, canSprint: true,  canJump: true,  headBobAmp: 1.0,  bodyLean: -0.4, armSwing: 1.2, animation: 'Sprint',             blendTime: 0.10, turnMult: 0.82, accelMult: 1.35, posture: 'standing', mood: 'alert',      stepInterval: 250,  noiseRadius: 13.0, canInteract: false, canEnterVehicle: false },
  stagger:             { speedMult: 0.3,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 1.5,  bodyLean: 0.4,  armSwing: 0.8, animation: 'Stagger',            blendTime: 0.08, turnMult: 0.35, accelMult: 0.30, posture: 'standing', mood: 'injured',    stepInterval: 900,  noiseRadius: 5.0,  canInteract: false, canEnterVehicle: false },
  stumble:             { speedMult: 0.1,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 2.0,  bodyLean: 0.6,  armSwing: 1.0, animation: 'Stumble',            blendTime: 0.06, turnMult: 0.20, accelMult: 0.20, posture: 'standing', mood: 'injured',    stepInterval: 1000, noiseRadius: 6.0,  canInteract: false, canEnterVehicle: false },
  recovering:          { speedMult: 0.2,  canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.8,  bodyLean: 0.2,  armSwing: 0.5, animation: 'Recovering',         blendTime: 0.10, turnMult: 0.25, accelMult: 0.25, posture: 'ground',   mood: 'downed',     stepInterval: 0,    noiseRadius: 1.0,  canInteract: false, canEnterVehicle: false },
  dragged_pose:        { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 1.0,  armSwing: 0,   animation: 'Dragged_Pose',      blendTime: 0.12, turnMult: 0,    accelMult: 0,    posture: 'ground',   mood: 'downed',     stepInterval: 0,    noiseRadius: 0,    canInteract: false, canEnterVehicle: false },
  carried_pose:        { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 0.8,  armSwing: 0,   animation: 'Carried_Pose',      blendTime: 0.12, turnMult: 0,    accelMult: 0,    posture: 'carried',  mood: 'downed',     stepInterval: 0,    noiseRadius: 0,    canInteract: false, canEnterVehicle: false },
  seated:              { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.1,  bodyLean: 0,    armSwing: 0,   animation: 'Vehicle_Seated',    blendTime: 0.14, turnMult: 0,    accelMult: 0,    posture: 'seated',   mood: 'neutral',    stepInterval: 0,    noiseRadius: 0,    canInteract: false, canEnterVehicle: false },
  hands_up_stand:      { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0.05, bodyLean: 0,    armSwing: 0,   animation: 'Hands_Up_Stand',    blendTime: 0.12, turnMult: 0.20, accelMult: 0.20, posture: 'standing', mood: 'restrained', stepInterval: 0,    noiseRadius: 0.5,  canInteract: false, canEnterVehicle: false },
  surrendered_kneel:   { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 0,    armSwing: 0,   animation: 'Surrender_Kneel',   blendTime: 0.12, turnMult: 0,    accelMult: 0,    posture: 'kneeling', mood: 'restrained', stepInterval: 0,    noiseRadius: 0,    canInteract: false, canEnterVehicle: false },
  unconscious:         { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 1.0,  armSwing: 0,   animation: 'Unconscious',       blendTime: 0.18, turnMult: 0,    accelMult: 0,    posture: 'ground',   mood: 'downed',     stepInterval: 0,    noiseRadius: 0,    canInteract: false, canEnterVehicle: false },
  dead:                { speedMult: 0,    canStrafe: false, canSprint: false, canJump: false, headBobAmp: 0,    bodyLean: 1.0,  armSwing: 0,   animation: 'Dead',              blendTime: 0.18, turnMult: 0,    accelMult: 0,    posture: 'ground',   mood: 'downed',     stepInterval: 0,    noiseRadius: 0,    canInteract: false, canEnterVehicle: false },
}

const SURFACE_SPEED_MULT: Record<NonNullable<GaitResolveInput['surface']>, number> = {
  asphalt: 1,
  concrete: 1,
  grass: 0.92,
  snow: 0.78,
  ice: 0.68,
  interior: 0.95,
}

const SURFACE_HEADBOB_MULT: Record<NonNullable<GaitResolveInput['surface']>, number> = {
  asphalt: 1,
  concrete: 0.95,
  grass: 1.08,
  snow: 1.22,
  ice: 0.88,
  interior: 0.82,
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

// ─────────────────────────────────────────────
// RÉSOLUTION DE DÉMARCHE
// ─────────────────────────────────────────────

export class GaitController {
  resolve(input: GaitResolveInput): GaitConfig {
    return this.resolveGait(
      input.charState,
      input.bodyCondition,
      input.isMoving,
      input.isSprinting,
      input.hasWeapon,
      input.isSneaking,
      {
        isEscorted: input.isEscorted,
        stamina01: input.stamina01,
        surface: input.surface,
      }
    )
  }

  resolveGait(
    charState: CharacterState,
    bodyCondition: BodyCondition,
    isMoving: boolean,
    isSprinting: boolean,
    hasWeapon: boolean,
    isSneaking: boolean,
    opts: Pick<GaitResolveInput, 'isEscorted' | 'stamina01' | 'surface'> = {}
  ): GaitConfig {
    const gaitType = this.selectGait(
      charState,
      bodyCondition,
      isMoving,
      isSprinting,
      hasWeapon,
      isSneaking,
      opts.isEscorted ?? false,
      opts.stamina01 ?? 1
    )

    const config = GAIT_CONFIGS[gaitType]
    const stamina01 = clamp01(opts.stamina01 ?? 1)
    const surface = opts.surface ?? 'asphalt'
    const surfaceSpeed = SURFACE_SPEED_MULT[surface]
    const surfaceBob = SURFACE_HEADBOB_MULT[surface]

    // Si le joueur est exténué, la marche reste possible mais le sprint se coupe.
    const staminaSpeedPenalty = stamina01 < 0.18 && config.speedMult > 1
      ? 0.55
      : stamina01 < 0.32 && config.speedMult > 1
        ? 0.75
        : 1

    const finalSpeedMult = config.speedMult * bodyCondition.moveSpeedMult * surfaceSpeed * staminaSpeedPenalty

    return {
      gait: gaitType,
      ...config,
      speedMult: finalSpeedMult,
      canSprint: config.canSprint && bodyCondition.canRun && stamina01 > 0.18,
      canJump: config.canJump && bodyCondition.moveSpeedMult > 0.5 && stamina01 > 0.12,
      canInteract: config.canInteract && charState !== 'STAGGER' && charState !== 'STUMBLE',
      headBobAmp: config.headBobAmp * surfaceBob,
      noiseRadius: config.noiseRadius * (surface === 'snow' ? 0.72 : 1),
    }
  }

  getProfile(gait: GaitType): GaitConfig {
    return { gait, ...GAIT_CONFIGS[gait] }
  }

  isImmobilized(gait: GaitType): boolean {
    return GAIT_CONFIGS[gait].speedMult <= 0
  }

  describe(config: GaitConfig): string {
    const labels: Record<GaitMood, string> = {
      neutral: 'normal',
      alert: 'alerte',
      combat: 'combat',
      injured: 'blessé',
      restrained: 'restreint',
      downed: 'au sol',
    }
    return `${config.gait} · ${labels[config.mood]} · vitesse x${config.speedMult.toFixed(2)}`
  }

  private selectGait(
    charState: CharacterState,
    body: BodyCondition,
    isMoving: boolean,
    isSprinting: boolean,
    hasWeapon: boolean,
    isSneaking: boolean,
    isEscorted: boolean,
    stamina01: number
  ): GaitType {
    // États forcés: priorité absolue sur input.
    switch (charState) {
      case 'DEAD':           return 'dead'
      case 'UNCONSCIOUS':    return 'unconscious'
      case 'DRAGGED':        return 'dragged_pose'
      case 'CARRIED':        return 'carried_pose'
      case 'VEHICLE_SEATED': return 'seated'
      case 'RESTRAINED':
        if (isEscorted && isMoving) return 'walk_police_escort'
        return isMoving ? 'walk_handcuffed' : 'hands_up_stand'
      case 'HANDS_UP':       return isMoving ? 'walk_hands_up' : 'hands_up_stand'
      case 'SURRENDERED':    return 'surrendered_kneel'
      case 'STAGGER':        return 'stagger'
      case 'STUMBLE':        return 'stumble'
      case 'RECOVERING':     return 'recovering'
      case 'FULL_RAGDOLL':   return 'unconscious'
      case 'SOFT_RAGDOLL':   return 'recovering'
      case 'KNOCKDOWN':      return 'recovering'
      case 'TASED':          return 'stagger'
      case 'GRABBED':        return isMoving ? 'walk_police_escort' : 'hands_up_stand'
      case 'NORMAL':
        break
    }

    if (!isMoving) return 'idle'

    if (isSneaking) return 'walk_sneaking'

    // Blessures graves / fatigue.
    if (!body.canRun && body.moveSpeedMult < 0.5) {
      return body.limp === 'left'  ? 'walk_injured_left'
           : body.limp === 'right' ? 'walk_injured_right'
           : 'walk_exhausted'
    }

    if (stamina01 < 0.12) return body.isLimping ? 'run_injured' : 'walk_exhausted'

    // Sprint demandé.
    if (isSprinting) {
      if (!body.canRun) return body.isLimping ? this.limpGait(body) : 'walk_exhausted'
      return body.isLimping ? 'run_injured' : 'run_sprint'
    }

    if (hasWeapon && body.canHoldWeapon) return 'walk_combat'

    if (body.isLimping) return this.limpGait(body)

    return 'walk_normal'
  }

  private limpGait(body: BodyCondition): GaitType {
    if (body.limp === 'left') return 'walk_injured_left'
    if (body.limp === 'right') return 'walk_injured_right'
    return 'walk_exhausted'
  }
}

export const gaitController = new GaitController()
