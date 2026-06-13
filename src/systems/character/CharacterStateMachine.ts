/**
 * CharacterStateMachine.ts
 * Machine d'états du personnage — cœur du système
 *
 * États:
 * NORMAL → STAGGER → SOFT_RAGDOLL → FULL_RAGDOLL
 *                  ↘ RESTRAINED → DRAGGED / CARRIED
 *                  ↘ VEHICLE_SEATED
 *
 * Règles anti-abus:
 * - Transitions validées côté serveur
 * - Cooldowns par état
 * - Conditions requises strictes
 */

// ─────────────────────────────────────────────
// ÉTATS
// ─────────────────────────────────────────────

export type CharacterState =
  | 'NORMAL'
  | 'STAGGER'           // Perte d'équilibre légère
  | 'STUMBLE'           // Trébuchement + animation
  | 'SOFT_RAGDOLL'      // Corps semi-mou, contrôle réduit
  | 'FULL_RAGDOLL'      // Corps complètement mou
  | 'KNOCKDOWN'         // Au sol, peut se relever
  | 'RESTRAINED'        // Menotté / immobilisé
  | 'GRABBED'           // Tenu par quelqu'un
  | 'DRAGGED'           // Traîné au sol
  | 'CARRIED'           // Porté sur épaule/bras
  | 'VEHICLE_SEATED'    // Dans véhicule
  | 'RECOVERING'        // Se relève
  | 'TASED'             // Tasé — spasmes
  | 'UNCONSCIOUS'       // Inconscient (RP)
  | 'DEAD'              // Mort (RP)
  | 'HANDS_UP'          // Mains en l'air
  | 'SURRENDERED'       // Rendu volontairement

// ─────────────────────────────────────────────
// TRANSITIONS AUTORISÉES
// Anti-abus: on ne peut pas aller n'importe où
// ─────────────────────────────────────────────

const VALID_TRANSITIONS: Record<CharacterState, CharacterState[]> = {
  NORMAL:         ['STAGGER', 'STUMBLE', 'SOFT_RAGDOLL', 'FULL_RAGDOLL', 'KNOCKDOWN', 'GRABBED', 'VEHICLE_SEATED', 'TASED', 'HANDS_UP', 'SURRENDERED', 'DEAD'],
  STAGGER:        ['NORMAL', 'STUMBLE', 'SOFT_RAGDOLL', 'FULL_RAGDOLL', 'KNOCKDOWN', 'GRABBED', 'RECOVERING'],
  STUMBLE:        ['NORMAL', 'STAGGER', 'KNOCKDOWN', 'FULL_RAGDOLL', 'RECOVERING'],
  SOFT_RAGDOLL:   ['FULL_RAGDOLL', 'KNOCKDOWN', 'RECOVERING', 'RESTRAINED'],
  FULL_RAGDOLL:   ['KNOCKDOWN', 'UNCONSCIOUS', 'DEAD', 'RESTRAINED', 'DRAGGED'],
  KNOCKDOWN:      ['RECOVERING', 'RESTRAINED', 'DRAGGED', 'UNCONSCIOUS', 'DEAD'],
  RESTRAINED:     ['DRAGGED', 'CARRIED', 'VEHICLE_SEATED', 'RECOVERING', 'SURRENDERED'],
  GRABBED:        ['DRAGGED', 'CARRIED', 'RESTRAINED', 'STAGGER', 'NORMAL'],
  DRAGGED:        ['RESTRAINED', 'VEHICLE_SEATED', 'KNOCKDOWN', 'GRABBED'],
  CARRIED:        ['RESTRAINED', 'VEHICLE_SEATED', 'KNOCKDOWN', 'GRABBED'],
  VEHICLE_SEATED: ['NORMAL', 'FULL_RAGDOLL', 'RESTRAINED'],
  RECOVERING:     ['NORMAL', 'STAGGER', 'KNOCKDOWN'],
  TASED:          ['FULL_RAGDOLL', 'KNOCKDOWN', 'RESTRAINED', 'UNCONSCIOUS'],
  UNCONSCIOUS:    ['RECOVERING', 'DEAD', 'RESTRAINED', 'DRAGGED'],
  DEAD:           [],  // Aucune transition — reset RP seulement
  HANDS_UP:       ['NORMAL', 'RESTRAINED', 'SURRENDERED', 'FULL_RAGDOLL'],
  SURRENDERED:    ['RESTRAINED', 'NORMAL', 'VEHICLE_SEATED'],
}

// ─────────────────────────────────────────────
// DURÉES DES ÉTATS (ms)
// ─────────────────────────────────────────────

export const STATE_DURATIONS: Partial<Record<CharacterState, number>> = {
  STAGGER:      600,
  STUMBLE:      900,
  SOFT_RAGDOLL: 1500,
  FULL_RAGDOLL: 2500,
  KNOCKDOWN:    3000,
  TASED:        4000,
  RECOVERING:   2000,
}

// ─────────────────────────────────────────────
// CONDITIONS REQUISES pour certaines transitions
// ─────────────────────────────────────────────

export interface TransitionConditions {
  fromState:    CharacterState
  toState:      CharacterState
  actorId?:     string     // Qui initie
  targetId?:    string     // La cible
  force?:       number     // Force d'impact
  distance?:    number     // Distance entre acteurs
  targetStamina?: number   // Stamina de la cible
  targetState?: CharacterState
  actorRole?:   'police' | 'gang' | 'civilian'
  hasHandcuffs?: boolean
  hasTaser?:    boolean
}

export interface TransitionResult {
  allowed:   boolean
  reason?:   string
  newState:  CharacterState
}

// ─────────────────────────────────────────────
// MACHINE D'ÉTATS
// ─────────────────────────────────────────────

export class CharacterStateMachine {
  private currentState:   CharacterState = 'NORMAL'
  private previousState:  CharacterState = 'NORMAL'
  private stateStartTime: number = Date.now()
  private stateTimer:     ReturnType<typeof setTimeout> | null = null
  private listeners:      Set<(state: CharacterState, prev: CharacterState) => void> = new Set()
  private controllerId:   string | null = null // Qui contrôle (police, gang...)

  constructor(
    private readonly characterId: string,
    private readonly onStateChange?: (state: CharacterState) => void
  ) {}

  // ── Getters ──────────────────────────────────

  get state(): CharacterState { return this.currentState }
  get prevState(): CharacterState { return this.previousState }
  get timeInState(): number { return Date.now() - this.stateStartTime }
  get isPhysicsControlled(): boolean {
    return ['SOFT_RAGDOLL', 'FULL_RAGDOLL', 'TASED', 'UNCONSCIOUS'].includes(this.currentState)
  }
  get isImmobilized(): boolean {
    return ['RESTRAINED', 'VEHICLE_SEATED', 'UNCONSCIOUS', 'DEAD'].includes(this.currentState)
  }
  get canReceiveInput(): boolean {
    return ['NORMAL', 'STAGGER', 'HANDS_UP', 'SURRENDERED'].includes(this.currentState)
  }
  get controlledBy(): string | null { return this.controllerId }

  // ── Transition ────────────────────────────────

  tryTransition(conditions: TransitionConditions): TransitionResult {
    const { fromState, toState } = conditions

    // Vérifier cohérence
    if (fromState !== this.currentState) {
      return {
        allowed:  false,
        reason:   `State mismatch: expected ${this.currentState}, got ${fromState}`,
        newState: this.currentState,
      }
    }

    // Vérifier transition valide
    if (!VALID_TRANSITIONS[fromState].includes(toState)) {
      return {
        allowed:  false,
        reason:   `Invalid transition: ${fromState} → ${toState}`,
        newState: this.currentState,
      }
    }

    // Vérifier conditions spécifiques
    const check = this.checkConditions(conditions)
    if (!check.allowed) {
      return { ...check, newState: this.currentState }
    }

    // Appliquer la transition
    this.applyTransition(toState, conditions.actorId ?? null)
    return { allowed: true, newState: toState }
  }

  private checkConditions(cond: TransitionConditions): { allowed: boolean; reason?: string } {
    const { toState, force, distance, targetStamina, actorRole, hasHandcuffs, hasTaser } = cond

    // GRABBED — doit être proche et cible vulnérable
    if (toState === 'GRABBED') {
      if ((distance ?? 999) > 2.0) return { allowed: false, reason: 'Too far to grab (max 2m)' }
      if (!['STAGGER', 'STUMBLE', 'KNOCKDOWN', 'SOFT_RAGDOLL', 'FULL_RAGDOLL', 'TASED', 'UNCONSCIOUS', 'HANDS_UP', 'SURRENDERED'].includes(cond.targetState ?? 'NORMAL')) {
        if ((targetStamina ?? 100) > 30) return { allowed: false, reason: 'Target stamina too high to grab' }
      }
    }

    // RESTRAINED — police ou conditions strictes
    if (toState === 'RESTRAINED') {
      if (!hasHandcuffs && actorRole !== 'police') {
        return { allowed: false, reason: 'Need handcuffs or police role to restrain' }
      }
      if (!['GRABBED', 'KNOCKDOWN', 'SOFT_RAGDOLL', 'FULL_RAGDOLL', 'TASED', 'UNCONSCIOUS', 'HANDS_UP', 'SURRENDERED'].includes(cond.targetState ?? 'NORMAL')) {
        return { allowed: false, reason: 'Target must be vulnerable to restrain' }
      }
    }

    // FULL_RAGDOLL — force suffisante requise
    if (toState === 'FULL_RAGDOLL' && (force ?? 0) < 12) {
      return { allowed: false, reason: 'Impact force too low for full ragdoll (min 12)' }
    }

    // TASED — équipement requis
    if (toState === 'TASED' && !hasTaser) {
      return { allowed: false, reason: 'No taser equipped' }
    }

    return { allowed: true }
  }

  private applyTransition(newState: CharacterState, actorId: string | null): void {
    if (this.stateTimer) {
      clearTimeout(this.stateTimer)
      this.stateTimer = null
    }

    this.previousState = this.currentState
    this.currentState  = newState
    this.stateStartTime = Date.now()
    this.controllerId  = actorId

    // Notifier
    this.onStateChange?.(newState)
    this.listeners.forEach(fn => fn(newState, this.previousState))

    // Auto-transition après durée
    const duration = STATE_DURATIONS[newState]
    if (duration) {
      this.stateTimer = setTimeout(() => {
        this.autoResolve(newState)
      }, duration)
    }
  }

  private autoResolve(fromState: CharacterState): void {
    const autoNext: Partial<Record<CharacterState, CharacterState>> = {
      STAGGER:      'NORMAL',
      STUMBLE:      'NORMAL',
      TASED:        'KNOCKDOWN',
      SOFT_RAGDOLL: 'KNOCKDOWN',
      FULL_RAGDOLL: 'KNOCKDOWN',
      KNOCKDOWN:    'RECOVERING',
      RECOVERING:   'NORMAL',
    }
    const next = autoNext[fromState]
    if (next) this.applyTransition(next, null)
  }

  // ── API Publique ──────────────────────────────

  forceState(state: CharacterState, reason = 'forced'): void {
    this.applyTransition(state, null)
  }

  release(fromActorId: string): boolean {
    if (this.controllerId !== fromActorId) return false
    this.controllerId = null
    if (['GRABBED', 'DRAGGED', 'CARRIED'].includes(this.currentState)) {
      this.applyTransition('KNOCKDOWN', null)
    }
    return true
  }

  subscribe(fn: (state: CharacterState, prev: CharacterState) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  destroy(): void {
    if (this.stateTimer) clearTimeout(this.stateTimer)
    this.listeners.clear()
  }
}