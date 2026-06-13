/**
 * characterStore.ts v3.0 — Production Grade
 * Features: Firebase sync, History, Combat, 
 * Interpolation, Events, Performance optimisé
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../lib/firebase/config'
import type { CharacterState } from '../systems/character/CharacterStateMachine'
import type { GaitType } from '../systems/character/GaitController'
import type { BodyCondition } from '../systems/character/InjuryController'

// ============================================================
//  TYPES
// ============================================================

export type CharacterRole = 'civilian' | 'police' | 'gang' | 'medic' | 'admin'

export interface CharacterSnapshot {
  id:             string
  // State Machine
  state:          CharacterState
  prevState:      CharacterState
  stateEnteredAt: number
  // Transform
  position:       [number, number, number]
  rotation:       number
  velocity:       [number, number, number]
  // Animation
  gait:           GaitType
  // Stats
  health:         number       // 0-100
  maxHealth:      number
  stamina:        number       // 0-100
  armor:          number       // 0-100
  // Condition
  bodyCondition:  BodyCondition | null
  injuries:       string[]
  // Control
  controllerId:   string | null
  isPlayer:       boolean
  isLocal:        boolean
  role:           CharacterRole
  // Physics
  ragdollActive:  boolean
  ragdollTimer:   number
  // Grab / Arrest
  grabSessionId:  string | null
  isGrabbed:      boolean
  grabbedById:    string | null
  // Law
  wantedLevel:    number       // 0-5
  wantedSince:    number | null
  crimePoints:    number
  // Combat
  isInCombat:     boolean
  lastAttacker:   string | null
  lastDamageAt:   number | null
  killCount:      number
  deathCount:     number
  // Interpolation
  targetPosition: [number, number, number]
  targetRotation: number
  // Meta
  lastUpdated:    number
  spawnedAt:      number
  sessionId:      string
}

export interface CharacterEvent {
  type:       'damage' | 'death' | 'spawn' | 'arrest' | 'heal' | 'state_change' | 'grab'
  characterId: string
  data:       Record<string, unknown>
  timestamp:  number
}

export interface CharacterFilter {
  role?:         CharacterRole
  minHealth?:    number
  maxHealth?:    number
  wantedLevel?:  number
  isPlayer?:     boolean
  inCombat?:     boolean
  state?:        CharacterState
}

// ============================================================
//  UTILS
// ============================================================

function defaultSnapshot(
  id: string,
  isPlayer = false,
  role: CharacterRole = 'civilian',
  isLocal = false,
): CharacterSnapshot {
  const now = Date.now()
  return {
    id,
    state:          'NORMAL',
    prevState:      'NORMAL',
    stateEnteredAt: now,
    position:       [0, 0, 0],
    targetPosition: [0, 0, 0],
    rotation:       0,
    targetRotation: 0,
    velocity:       [0, 0, 0],
    gait:           'idle',
    health:         100,
    maxHealth:      100,
    stamina:        100,
    armor:          0,
    bodyCondition:  null,
    injuries:       [],
    controllerId:   null,
    isPlayer,
    isLocal,
    role,
    ragdollActive:  false,
    ragdollTimer:   0,
    grabSessionId:  null,
    isGrabbed:      false,
    grabbedById:    null,
    wantedLevel:    0,
    wantedSince:    null,
    crimePoints:    0,
    isInCombat:     false,
    lastAttacker:   null,
    lastDamageAt:   null,
    killCount:      0,
    deathCount:     0,
    lastUpdated:    now,
    spawnedAt:      now,
    sessionId:      `${id}-${now}`,
  }
}

// Vecteurs réutilisables — zero allocation
const _tmpA = new THREE.Vector3()
const _tmpB = new THREE.Vector3()

// ============================================================
//  STORE INTERFACE
// ============================================================

interface CharacterStore {
  characters:     Map<string, CharacterSnapshot>
  localPlayerId:  string | null
  events:         CharacterEvent[]
  firebaseUnsub:  Unsubscribe | null

  // ── CRUD ──
  registerCharacter:   (id: string, opts?: {
    isPlayer?: boolean
    role?: CharacterRole
    isLocal?: boolean
    position?: [number, number, number]
  }) => CharacterSnapshot
  unregisterCharacter: (id: string) => void
  updateCharacter:     (id: string, updates: Partial<CharacterSnapshot>) => void
  getCharacter:        (id: string) => CharacterSnapshot | undefined
  getAllCharacters:     () => CharacterSnapshot[]
  getLocalPlayer:      () => CharacterSnapshot | undefined

  // ── State ──
  setCharacterState:   (id: string, state: CharacterState, opts?: { controllerId?: string; force?: boolean }) => void
  setCharacterPos:     (id: string, pos: THREE.Vector3, rotY: number, velocity?: THREE.Vector3) => void
  setCharacterGait:    (id: string, gait: GaitType) => void
  setRagdollActive:    (id: string, active: boolean, duration?: number) => void
  setLocalPlayer:      (id: string) => void

  // ── Stats ──
  applyDamage:         (id: string, amount: number, attackerId?: string) => boolean
  heal:                (id: string, amount: number) => void
  addArmor:            (id: string, amount: number) => void
  killCharacter:       (id: string, killerId?: string) => void
  respawnCharacter:    (id: string, pos: [number, number, number]) => void

  // ── Law ──
  addCrimePoints:      (id: string, points: number) => void
  clearWanted:         (id: string) => void
  arrest:              (id: string, officerId: string) => void

  // ── Grab ──
  startGrab:           (grabberId: string, targetId: string) => string | null
  releaseGrab:         (sessionId: string) => void

  // ── Queries ──
  getCharactersNear:   (pos: THREE.Vector3, radius: number, filter?: CharacterFilter) => CharacterSnapshot[]
  getControlledBy:     (controllerId: string) => CharacterSnapshot | undefined
  getByRole:           (role: CharacterRole) => CharacterSnapshot[]
  getWantedPlayers:    () => CharacterSnapshot[]
  getInCombat:         () => CharacterSnapshot[]
  query:               (filter: CharacterFilter) => CharacterSnapshot[]

  // ── Events ──
  pushEvent:           (event: Omit<CharacterEvent, 'timestamp'>) => void
  clearEvents:         () => void

  // ── Firebase ──
  startFirebaseSync:   (sessionId: string) => void
  stopFirebaseSync:    () => void
  pushToFirebase:      (id: string) => Promise<void>

  // ── Interpolation ──
  interpolateRemotes:  (delta: number) => void
}

// ============================================================
//  STORE
// ============================================================

export const useCharacterStore = create<CharacterStore>()(
  subscribeWithSelector((set, get) => ({
    characters:    new Map(),
    localPlayerId: null,
    events:        [],
    firebaseUnsub: null,

    // ──────────────────────────────────────
    //  CRUD
    // ──────────────────────────────────────

    registerCharacter: (id, opts = {}) => {
      const { isPlayer = false, role = 'civilian', isLocal = false, position } = opts
      const chars = new Map(get().characters)

      if (chars.has(id)) return chars.get(id)!

      const snap = defaultSnapshot(id, isPlayer, role, isLocal)
      if (position) {
        snap.position       = position
        snap.targetPosition = position
      }

      chars.set(id, snap)
      set({ characters: chars })

      get().pushEvent({ type: 'spawn', characterId: id, data: { role, isPlayer } })
      return snap
    },

    unregisterCharacter: (id) => {
      const chars = new Map(get().characters)
      chars.delete(id)
      set({ characters: chars })

      // Nettoie Firebase
      if (db) {
        deleteDoc(doc(db, 'characters', id)).catch(console.error)
      }
    },

    updateCharacter: (id, updates) => {
      const chars = new Map(get().characters)
      const char  = chars.get(id)
      if (!char) return
      chars.set(id, { ...char, ...updates, lastUpdated: Date.now() })
      set({ characters: chars })
    },

    getCharacter:    (id) => get().characters.get(id),
    getAllCharacters: () => Array.from(get().characters.values()),

    getLocalPlayer: () => {
      const { localPlayerId, characters } = get()
      return localPlayerId ? characters.get(localPlayerId) : undefined
    },

    // ──────────────────────────────────────
    //  STATE MACHINE
    // ──────────────────────────────────────

    setCharacterState: (id, state, opts = {}) => {
      const char = get().characters.get(id)
      if (!char) return

      // Pas de transition si même état (sauf force)
      if (char.state === state && !opts.force) return

      const ragdollStates: CharacterState[] = [
        'SOFT_RAGDOLL', 'FULL_RAGDOLL', 'TASED', 'UNCONSCIOUS'
      ]

      get().updateCharacter(id, {
        prevState:      char.state,
        state,
        stateEnteredAt: Date.now(),
        controllerId:   opts.controllerId ?? char.controllerId,
        ragdollActive:  ragdollStates.includes(state),
      })

      get().pushEvent({
        type:        'state_change',
        characterId: id,
        data:        { from: char.state, to: state },
      })
    },

    setCharacterPos: (id, pos, rotY, velocity) => {
      const char = get().characters.get(id)
      if (!char) return

      // Perso local → position directe
      // Perso distant → position cible (interpolation)
      if (char.isLocal) {
        get().updateCharacter(id, {
          position:  [pos.x, pos.y, pos.z],
          rotation:  rotY,
          velocity:  velocity ? [velocity.x, velocity.y, velocity.z] : char.velocity,
        })
      } else {
        get().updateCharacter(id, {
          targetPosition: [pos.x, pos.y, pos.z],
          targetRotation: rotY,
          velocity:       velocity ? [velocity.x, velocity.y, velocity.z] : char.velocity,
        })
      }
    },

    setCharacterGait: (id, gait) => get().updateCharacter(id, { gait }),

    setRagdollActive: (id, active, duration = 0) => {
      get().updateCharacter(id, {
        ragdollActive: active,
        ragdollTimer:  active && duration > 0 ? Date.now() + duration : 0,
      })
    },

    setLocalPlayer: (id) => {
      set({ localPlayerId: id })
      get().updateCharacter(id, { isLocal: true })
    },

    // ──────────────────────────────────────
    //  STATS / COMBAT
    // ──────────────────────────────────────

    applyDamage: (id, amount, attackerId) => {
      const char = get().characters.get(id)
      if (!char || char.health <= 0) return false

      // L'armure absorbe d'abord
      let remainingDmg = amount
      if (char.armor > 0) {
        const armorAbsorb = Math.min(char.armor, remainingDmg * 0.7)
        remainingDmg -= armorAbsorb
        get().updateCharacter(id, { armor: Math.max(0, char.armor - armorAbsorb) })
      }

      const newHealth = Math.max(0, char.health - remainingDmg)

      get().updateCharacter(id, {
        health:       newHealth,
        isInCombat:   true,
        lastAttacker: attackerId ?? char.lastAttacker,
        lastDamageAt: Date.now(),
      })

      get().pushEvent({
        type:        'damage',
        characterId: id,
        data:        { amount: remainingDmg, attackerId, newHealth },
      })

      // Auto-mort si health = 0
      if (newHealth <= 0) {
        get().killCharacter(id, attackerId)
        return true
      }

      // Auto-ragdoll si santé critique
      if (newHealth < 20 && !char.ragdollActive) {
        get().setRagdollActive(id, true, 3000)
        get().setCharacterState(id, 'SOFT_RAGDOLL')
      }

      return false // pas mort
    },

    heal: (id, amount) => {
      const char = get().characters.get(id)
      if (!char) return
      const newHealth = Math.min(char.maxHealth, char.health + amount)
      get().updateCharacter(id, { health: newHealth, isInCombat: false })
      get().pushEvent({ type: 'heal', characterId: id, data: { amount, newHealth } })
    },

    addArmor: (id, amount) => {
      const char = get().characters.get(id)
      if (!char) return
      get().updateCharacter(id, { armor: Math.min(100, char.armor + amount) })
    },

    killCharacter: (id, killerId) => {
      const char = get().characters.get(id)
      if (!char) return

      get().updateCharacter(id, {
        health:       0,
        isInCombat:   false,
        ragdollActive: true,
        deathCount:   char.deathCount + 1,
      })
      get().setCharacterState(id, 'FULL_RAGDOLL')

      // Créditer le kill
      if (killerId) {
        const killer = get().characters.get(killerId)
        if (killer) get().updateCharacter(killerId, { killCount: killer.killCount + 1 })
      }

      get().pushEvent({
        type:        'death',
        characterId: id,
        data:        { killerId, deathCount: char.deathCount + 1 },
      })
    },

    respawnCharacter: (id, pos) => {
      get().updateCharacter(id, {
        health:        100,
        stamina:       100,
        armor:         0,
        injuries:      [],
        bodyCondition: null,
        ragdollActive: false,
        isInCombat:    false,
        wantedLevel:   0,
        crimePoints:   0,
        wantedSince:   null,
        position:      pos,
        targetPosition: pos,
      })
      get().setCharacterState(id, 'NORMAL', { force: true })
      get().pushEvent({ type: 'spawn', characterId: id, data: { position: pos } })
    },

    // ──────────────────────────────────────
    //  LAW SYSTEM
    // ──────────────────────────────────────

    addCrimePoints: (id, points) => {
      const char = get().characters.get(id)
      if (!char) return

      const newPoints  = char.crimePoints + points
      const newWanted  = Math.min(5, Math.floor(newPoints / 20))
      const wasWanted  = char.wantedLevel > 0

      get().updateCharacter(id, {
        crimePoints:  newPoints,
        wantedLevel:  newWanted,
        wantedSince:  !wasWanted && newWanted > 0 ? Date.now() : char.wantedSince,
      })
    },

    clearWanted: (id) => {
      get().updateCharacter(id, {
        wantedLevel: 0,
        crimePoints: 0,
        wantedSince: null,
      })
    },

    arrest: (id, officerId) => {
      get().setCharacterState(id, 'HANDCUFFED', { controllerId: officerId })
      get().clearWanted(id)
      get().pushEvent({
        type:        'arrest',
        characterId: id,
        data:        { officerId },
      })
    },

    // ──────────────────────────────────────
    //  GRAB SYSTEM
    // ──────────────────────────────────────

    startGrab: (grabberId, targetId) => {
      const target = get().characters.get(targetId)
      if (!target || target.isGrabbed) return null

      const sessionId = `grab-${grabberId}-${targetId}-${Date.now()}`

      get().updateCharacter(targetId, {
        isGrabbed:    true,
        grabbedById:  grabberId,
        grabSessionId: sessionId,
      })
      get().updateCharacter(grabberId, { grabSessionId: sessionId })

      get().pushEvent({ type: 'grab', characterId: targetId, data: { grabberId, sessionId } })
      return sessionId
    },

    releaseGrab: (sessionId) => {
      get().characters.forEach((char, id) => {
        if (char.grabSessionId === sessionId) {
          get().updateCharacter(id, {
            isGrabbed:    false,
            grabbedById:  null,
            grabSessionId: null,
          })
        }
      })
    },

    // ──────────────────────────────────────
    //  QUERIES
    // ──────────────────────────────────────

    getCharactersNear: (pos, radius, filter = {}) => {
      const result: CharacterSnapshot[] = []
      _tmpA.copy(pos)

      get().characters.forEach(char => {
        _tmpB.set(...char.position)
        if (_tmpA.distanceTo(_tmpB) > radius) return

        // Applique le filtre optionnel
        if (filter.role       && char.role         !== filter.role)       return
        if (filter.isPlayer   !== undefined && char.isPlayer !== filter.isPlayer) return
        if (filter.inCombat   !== undefined && char.isInCombat !== filter.inCombat) return
        if (filter.minHealth  !== undefined && char.health < filter.minHealth) return
        if (filter.maxHealth  !== undefined && char.health > filter.maxHealth) return
        if (filter.wantedLevel !== undefined && char.wantedLevel < filter.wantedLevel) return

        result.push(char)
      })

      return result
    },

    getControlledBy: (controllerId) => {
      for (const char of get().characters.values()) {
        if (char.controllerId === controllerId) return char
      }
      return undefined
    },

    getByRole: (role) =>
      Array.from(get().characters.values()).filter(c => c.role === role),

    getWantedPlayers: () =>
      Array.from(get().characters.values()).filter(c => c.wantedLevel > 0),

    getInCombat: () =>
      Array.from(get().characters.values()).filter(c => c.isInCombat),

    query: (filter) => {
      return Array.from(get().characters.values()).filter(char => {
        if (filter.role         && char.role       !== filter.role)       return false
        if (filter.isPlayer     !== undefined && char.isPlayer !== filter.isPlayer) return false
        if (filter.inCombat     !== undefined && char.isInCombat !== filter.inCombat) return false
        if (filter.minHealth    !== undefined && char.health < filter.minHealth) return false
        if (filter.maxHealth    !== undefined && char.health > filter.maxHealth) return false
        if (filter.wantedLevel  !== undefined && char.wantedLevel < filter.wantedLevel) return false
        if (filter.state        && char.state !== filter.state) return false
        return true
      })
    },

    // ──────────────────────────────────────
    //  EVENTS
    // ──────────────────────────────────────

    pushEvent: (event) => {
      const full: CharacterEvent = { ...event, timestamp: Date.now() }
      set(s => ({
        events: [...s.events.slice(-99), full]  // max 100 events
      }))

      // Dispatch global pour les autres systèmes
      window.dispatchEvent(new CustomEvent('character-event', { detail: full }))
    },

    clearEvents: () => set({ events: [] }),

    // ──────────────────────────────────────
    //  FIREBASE SYNC (Multijoueur)
    // ──────────────────────────────────────

    startFirebaseSync: (sessionId) => {
      if (!db) return

      const ref = collection(db, 'sessions', sessionId, 'characters')

      const unsub = onSnapshot(ref, (snap) => {
        snap.docChanges().forEach(change => {
          const data = change.doc.data() as CharacterSnapshot
          const localId = get().localPlayerId

          // Ne pas écraser le joueur local avec les données Firebase
          if (data.id === localId) return

          if (change.type === 'removed') {
            get().unregisterCharacter(data.id)
          } else {
            const existing = get().characters.get(data.id)
            if (!existing) {
              get().registerCharacter(data.id, {
                isPlayer: true,
                role:     data.role,
                isLocal:  false,
              })
            }
            // Pour les persos distants: cible d'interpolation
            get().updateCharacter(data.id, {
              ...data,
              isLocal:        false,
              targetPosition: data.position,
              targetRotation: data.rotation,
            })
          }
        })
      })

      set({ firebaseUnsub: unsub })
    },

    stopFirebaseSync: () => {
      const unsub = get().firebaseUnsub
      if (unsub) {
        unsub()
        set({ firebaseUnsub: null })
      }
    },

    pushToFirebase: async (id) => {
      if (!db) return
      const char = get().characters.get(id)
      if (!char) return

      // Envoie seulement les données essentielles (pas targetPosition, etc.)
      const { targetPosition, targetRotation, isLocal, ...data } = char

      try {
        await setDoc(
          doc(db, 'characters', id),
          { ...data, _serverTs: serverTimestamp() },
          { merge: true }
        )
      } catch (err) {
        console.error('[CharacterStore] Firebase push erreur:', err)
      }
    },

    // ──────────────────────────────────────
    //  INTERPOLATION (appeler dans useFrame)
    // ──────────────────────────────────────

    interpolateRemotes: (delta) => {
      const LERP_SPEED = 10
      const chars      = new Map(get().characters)
      let   changed    = false

      chars.forEach((char, id) => {
        if (char.isLocal) return   // Pas d'interpolation pour le local

        _tmpA.set(...char.position)
        _tmpB.set(...char.targetPosition)

        if (_tmpA.distanceTo(_tmpB) < 0.001) return

        const t = Math.min(1, LERP_SPEED * delta)
        _tmpA.lerp(_tmpB, t)

        const newRot = THREE.MathUtils.lerp(char.rotation, char.targetRotation, t)

        chars.set(id, {
          ...char,
          position: [_tmpA.x, _tmpA.y, _tmpA.z],
          rotation: newRot,
        })
        changed = true
      })

      if (changed) set({ characters: chars })
    },
  }))
)

// ============================================================
//  SELECTORS (optimisés — évite re-renders inutiles)
// ============================================================

export const selectLocalPlayer = (s: CharacterStore) =>
  s.localPlayerId ? s.characters.get(s.localPlayerId) : undefined

export const selectCharacter = (id: string) =>
  (s: CharacterStore) => s.characters.get(id)

export const selectAllCharacters = (s: CharacterStore) =>
  Array.from(s.characters.values())

export const selectWanted = (s: CharacterStore) =>
  Array.from(s.characters.values()).filter(c => c.wantedLevel > 0)

export const selectPolice = (s: CharacterStore) =>
  Array.from(s.characters.values()).filter(c => c.role === 'police')

export const selectInCombat = (s: CharacterStore) =>
  Array.from(s.characters.values()).filter(c => c.isInCombat)

export const selectEvents = (s: CharacterStore) => s.events