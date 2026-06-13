/**
 * WantedSystem.ts
 * Système de niveau recherché — 0 à 5 étoiles
 * Québec RP — police, gangs, civil
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type WantedLevel = 0 | 1 | 2 | 3 | 4 | 5

export type CrimeType =
  | 'jaywalking'           // Niveau 0→1
  | 'trespassing'          // +0.5
  | 'theft_minor'          // +1
  | 'theft_major'          // +2
  | 'assault'              // +1.5
  | 'assault_officer'      // +3
  | 'robbery'              // +2.5
  | 'vehicle_theft'        // +1.5
  | 'drug_possession'      // +1
  | 'drug_trafficking'     // +2
  | 'weapon_illegal'       // +2
  | 'weapon_use'           // +2.5
  | 'manslaughter'         // +4
  | 'murder'               // +5
  | 'officer_killed'       // +5 + permanent flag
  | 'evading_police'       // +1 par évasion
  | 'resisting_arrest'     // +1

export interface WantedRecord {
  characterId:  string
  level:        WantedLevel
  points:       number          // Points internes (ex. 3.5 → niveau 2)
  activeWarrant: boolean
  crimes:       CrimeRecord[]
  lastSighting: number | null   // timestamp
  lastCrime:    number | null
  isInCustody:  boolean
  isFugitive:   boolean
}

export interface CrimeRecord {
  type:       CrimeType
  timestamp:  number
  location:   string
  witnesses:  number
  cleared:    boolean
}

// ─────────────────────────────────────────────
// POINTS PAR CRIME
// ─────────────────────────────────────────────

const CRIME_POINTS: Record<CrimeType, number> = {
  jaywalking:         0.25,
  trespassing:        0.5,
  theft_minor:        1.0,
  theft_major:        2.0,
  assault:            1.5,
  assault_officer:    3.0,
  robbery:            2.5,
  vehicle_theft:      1.5,
  drug_possession:    1.0,
  drug_trafficking:   2.0,
  weapon_illegal:     2.0,
  weapon_use:         2.5,
  manslaughter:       4.0,
  murder:             5.0,
  officer_killed:     5.0,
  evading_police:     1.0,
  resisting_arrest:   1.0,
}

// ─────────────────────────────────────────────
// NIVEAU SELON POINTS
// ─────────────────────────────────────────────

function pointsToLevel(points: number): WantedLevel {
  if (points <= 0)   return 0
  if (points < 1.5)  return 1
  if (points < 3.5)  return 2
  if (points < 6.0)  return 3
  if (points < 9.0)  return 4
  return 5
}

// ─────────────────────────────────────────────
// WANTED STORE
// ─────────────────────────────────────────────

interface WantedStore {
  records: Map<string, WantedRecord>

  getRecord:       (charId: string) => WantedRecord
  getLevel:        (charId: string) => WantedLevel
  addCrime:        (charId: string, crime: CrimeType, location: string, witnesses?: number) => void
  decreaseWanted:  (charId: string, amount: number) => void
  clearRecord:     (charId: string) => void
  setInCustody:    (charId: string, inCustody: boolean) => void
  serveSentence:   (charId: string, timeServedMs: number) => void
  isWanted:        (charId: string) => boolean
}

const defaultRecord = (charId: string): WantedRecord => ({
  characterId:   charId,
  level:         0,
  points:        0,
  activeWarrant: false,
  crimes:        [],
  lastSighting:  null,
  lastCrime:     null,
  isInCustody:   false,
  isFugitive:    false,
})

export const useWantedStore = create<WantedStore>()(
  subscribeWithSelector((set, get) => ({
    records: new Map(),

    getRecord: (charId) =>
      get().records.get(charId) ?? defaultRecord(charId),

    getLevel: (charId) =>
      get().records.get(charId)?.level ?? 0,

    addCrime: (charId, crime, location, witnesses = 1) => {
      const records = new Map(get().records)
      const record  = records.get(charId) ?? defaultRecord(charId)

      // Pas de crime si en garde à vue
      if (record.isInCustody) return

      const crimePoints = CRIME_POINTS[crime] * Math.max(0.5, witnesses * 0.3)
      const newPoints   = Math.min(10, record.points + crimePoints)
      const newLevel    = pointsToLevel(newPoints)

      const crimeRecord: CrimeRecord = {
        type:      crime,
        timestamp: Date.now(),
        location,
        witnesses,
        cleared:   false,
      }

      records.set(charId, {
        ...record,
        points:        newPoints,
        level:         newLevel,
        activeWarrant: newLevel >= 2,
        isFugitive:    newLevel >= 3,
        crimes:        [...record.crimes, crimeRecord],
        lastCrime:     Date.now(),
        lastSighting:  Date.now(),
      })

      set({ records })

      // Log
      if (import.meta.env.DEV) {
        console.log(`[WantedSystem] ${charId} — Crime: ${crime} (+${crimePoints.toFixed(2)} pts) → Level ${newLevel}`)
      }
    },

    decreaseWanted: (charId, amount) => {
      const records = new Map(get().records)
      const record  = records.get(charId) ?? defaultRecord(charId)
      const newPoints = Math.max(0, record.points - amount)
      const newLevel  = pointsToLevel(newPoints)

      records.set(charId, {
        ...record,
        points:        newPoints,
        level:         newLevel,
        activeWarrant: newLevel >= 2,
        isFugitive:    newLevel >= 3,
      })

      set({ records })
    },

    clearRecord: (charId) => {
      const records = new Map(get().records)
      records.set(charId, defaultRecord(charId))
      set({ records })
    },

    setInCustody: (charId, inCustody) => {
      const records = new Map(get().records)
      const record  = records.get(charId) ?? defaultRecord(charId)
      records.set(charId, { ...record, isInCustody: inCustody, isFugitive: false })
      set({ records })
    },

    serveSentence: (charId, timeServedMs) => {
      // Réduction selon temps purgé
      const reductionRate = 0.5 / 60000  // 0.5 points par minute
      const reduction     = timeServedMs * reductionRate
      get().decreaseWanted(charId, reduction)
      get().setInCustody(charId, false)
    },

    isWanted: (charId) =>
      (get().records.get(charId)?.level ?? 0) > 0,
  }))
)