/**
 * characterStore.ts
 * Store Zustand central — état de tous les personnages en scène
 * Synchronisé avec Firebase en multi-joueur
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'
import type { CharacterState } from '../systems/character/CharacterStateMachine'
import type { GaitType } from '../systems/character/GaitController'
import type { BodyCondition } from '../systems/character/InjuryController'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface CharacterSnapshot {
  id:             string
  state:          CharacterState
  prevState:      CharacterState
  position:       [number, number, number]
  rotation:       number                    // Y axis
  velocity:       [number, number, number]
  gait:           GaitType
  health:         number                    // 0-100
  stamina:        number                    // 0-100
  bodyCondition:  BodyCondition | null
  controllerId:   string | null             // Qui contrôle ce perso
  isPlayer:       boolean
  role:           'civilian' | 'police' | 'gang' | 'medic'
  ragdollActive:  boolean
  grabSessionId:  string | null
  wantedLevel:    number                    // 0-5
  lastUpdated:    number
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

interface CharacterStore {
  characters:     Map<string, CharacterSnapshot>
  localPlayerId:  string | null

  // ── CRUD ──
  registerCharacter:   (id: string, isPlayer?: boolean, role?: CharacterSnapshot['role']) => void
  unregisterCharacter: (id: string) => void
  updateCharacter:     (id: string, updates: Partial<CharacterSnapshot>) => void
  getCharacter:        (id: string) => CharacterSnapshot | undefined
  getAllCharacters:     () => CharacterSnapshot[]
  getLocalPlayer:      () => CharacterSnapshot | undefined

  // ── Raccourcis état ──
  setCharacterState:   (id: string, state: CharacterState, controllerId?: string) => void
  setCharacterPos:     (id: string, pos: THREE.Vector3, rotY: number) => void
  setCharacterGait:    (id: string, gait: GaitType) => void
  setRagdollActive:    (id: string, active: boolean) => void
  setLocalPlayer:      (id: string) => void

  // ── Queries ──
  getCharactersNear:   (pos: THREE.Vector3, radius: number) => CharacterSnapshot[]
  getControlledBy:     (controllerId: string) => CharacterSnapshot | undefined
  getPoliceOfficers:   () => CharacterSnapshot[]
  getWantedPlayers:    () => CharacterSnapshot[]
}

// ─────────────────────────────────────────────
// DEFAULT
// ─────────────────────────────────────────────

function defaultSnapshot(id: string, isPlayer = false, role: CharacterSnapshot['role'] = 'civilian'): CharacterSnapshot {
  return {
    id,
    state:          'NORMAL',
    prevState:      'NORMAL',
    position:       [0, 0, 0],
    rotation:       0,
    velocity:       [0, 0, 0],
    gait:           'idle',
    health:         100,
    stamina:        100,
    bodyCondition:  null,
    controllerId:   null,
    isPlayer,
    role,
    ragdollActive:  false,
    grabSessionId:  null,
    wantedLevel:    0,
    lastUpdated:    Date.now(),
  }
}

const tmpPos = new THREE.Vector3()

// ─────────────────────────────────────────────
// STORE IMPLEMENTATION
// ─────────────────────────────────────────────

export const useCharacterStore = create<CharacterStore>()(
  subscribeWithSelector((set, get) => ({
    characters:    new Map(),
    localPlayerId: null,

    registerCharacter: (id, isPlayer = false, role = 'civilian') => {
      const chars = new Map(get().characters)
      if (!chars.has(id)) {
        chars.set(id, defaultSnapshot(id, isPlayer, role))
        set({ characters: chars })
      }
    },

    unregisterCharacter: (id) => {
      const chars = new Map(get().characters)
      chars.delete(id)
      set({ characters: chars })
    },

    updateCharacter: (id, updates) => {
      const chars = new Map(get().characters)
      const char  = chars.get(id)
      if (!char) return
      chars.set(id, { ...char, ...updates, lastUpdated: Date.now() })
      set({ characters: chars })
    },

    getCharacter: (id) => get().characters.get(id),

    getAllCharacters: () => Array.from(get().characters.values()),

    getLocalPlayer: () => {
      const { localPlayerId, characters } = get()
      return localPlayerId ? characters.get(localPlayerId) : undefined
    },

    setCharacterState: (id, state, controllerId) => {
      get().updateCharacter(id, {
        prevState:    get().characters.get(id)?.state ?? 'NORMAL',
        state,
        controllerId: controllerId ?? get().characters.get(id)?.controllerId ?? null,
        ragdollActive: ['SOFT_RAGDOLL', 'FULL_RAGDOLL', 'TASED', 'UNCONSCIOUS'].includes(state),
      })
    },

    setCharacterPos: (id, pos, rotY) => {
      get().updateCharacter(id, {
        position: [pos.x, pos.y, pos.z],
        rotation: rotY,
      })
    },

    setCharacterGait: (id, gait) => {
      get().updateCharacter(id, { gait })
    },

    setRagdollActive: (id, active) => {
      get().updateCharacter(id, { ragdollActive: active })
    },

    setLocalPlayer: (id) => {
      set({ localPlayerId: id })
    },

    getCharactersNear: (pos, radius) => {
      const result: CharacterSnapshot[] = []
      get().characters.forEach(char => {
        tmpPos.set(...char.position)
        if (tmpPos.distanceTo(pos) <= radius) result.push(char)
      })
      return result
    },

    getControlledBy: (controllerId) => {
      for (const char of get().characters.values()) {
        if (char.controllerId === controllerId) return char
      }
      return undefined
    },

    getPoliceOfficers: () =>
      Array.from(get().characters.values()).filter(c => c.role === 'police'),

    getWantedPlayers: () =>
      Array.from(get().characters.values()).filter(c => c.wantedLevel > 0),
  }))
)