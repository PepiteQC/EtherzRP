/**
 * StaminaSystem.ts
 * Système d'endurance — combat, course, résistance
 * Affecte directement la vulnérabilité aux grabs et ragdolls
 */

import { create } from 'zustand'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface StaminaState {
  current:     number    // 0-100
  max:         number    // Habituellement 100
  regenRate:   number    // par seconde au repos
  drainRates:  StaminaDrainRates
  isExhausted: boolean   // current < 15
  isRecovering: boolean  // repos actif
}

export interface StaminaDrainRates {
  running:     number    // /s en courant
  sprinting:   number    // /s en sprint
  fighting:    number    // /frappe
  blocking:    number    // /impact bloqué
  struggling:  number    // /s en se débattant
  grabbing:    number    // /s en tenant qqun
}

const DEFAULT_DRAIN_RATES: StaminaDrainRates = {
  running:    8,
  sprinting:  18,
  fighting:   12,
  blocking:   6,
  struggling: 15,
  grabbing:   5,
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

interface StaminaStore {
  characters: Map<string, StaminaState>

  getStamina:    (charId: string) => StaminaState
  initCharacter: (charId: string, max?: number) => void
  drain:         (charId: string, amount: number) => void
  restore:       (charId: string, amount: number) => void
  tick:          (charId: string, dt: number, isRunning: boolean, isSprinting: boolean, isFighting: boolean, isGrabbing: boolean, isStruggling: boolean) => void
  isExhausted:   (charId: string) => boolean
}

const DEFAULT_STATE: StaminaState = {
  current:      100,
  max:          100,
  regenRate:    12,
  drainRates:   DEFAULT_DRAIN_RATES,
  isExhausted:  false,
  isRecovering: false,
}

export const useStaminaStore = create<StaminaStore>((set, get) => ({
  characters: new Map(),

  getStamina: (charId) =>
    get().characters.get(charId) ?? { ...DEFAULT_STATE },

  initCharacter: (charId, max = 100) => {
    const chars = new Map(get().characters)
    chars.set(charId, { ...DEFAULT_STATE, max, current: max })
    set({ characters: chars })
  },

  drain: (charId, amount) => {
    const chars = new Map(get().characters)
    const state = chars.get(charId) ?? { ...DEFAULT_STATE }
    const newCurrent = Math.max(0, state.current - amount)
    chars.set(charId, {
      ...state,
      current:      newCurrent,
      isExhausted:  newCurrent < 15,
      isRecovering: false,
    })
    set({ characters: chars })
  },

  restore: (charId, amount) => {
    const chars = new Map(get().characters)
    const state = chars.get(charId) ?? { ...DEFAULT_STATE }
    const newCurrent = Math.min(state.max, state.current + amount)
    chars.set(charId, {
      ...state,
      current:      newCurrent,
      isExhausted:  newCurrent < 15,
      isRecovering: true,
    })
    set({ characters: chars })
  },

  tick: (charId, dt, isRunning, isSprinting, isFighting, isGrabbing, isStruggling) => {
    const chars = new Map(get().characters)
    const state = chars.get(charId) ?? { ...DEFAULT_STATE }
    const rates = state.drainRates

    let drain = 0
    let regen = 0

    if (isSprinting)   drain += rates.sprinting * dt
    else if (isRunning) drain += rates.running * dt
    if (isGrabbing)    drain += rates.grabbing * dt
    if (isStruggling)  drain += rates.struggling * dt

    // Régénération si repos
    const isResting = !isRunning && !isFighting && !isGrabbing && !isStruggling
    if (isResting) regen = state.regenRate * dt

    const newCurrent = Math.min(
      state.max,
      Math.max(0, state.current - drain + regen)
    )

    chars.set(charId, {
      ...state,
      current:      newCurrent,
      isExhausted:  newCurrent < 15,
      isRecovering: isResting && newCurrent < state.max,
    })
    set({ characters: chars })
  },

  isExhausted: (charId) =>
    (get().characters.get(charId)?.current ?? 100) < 15,
}))