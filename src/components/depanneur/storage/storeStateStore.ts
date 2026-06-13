/**
 * storeStateStore.ts
 * État opérationnel du dépanneur
 * - Statut ouvert/fermé
 * - Caisses & coffre
 * - Alarme, caméras
 * - Température frigos
 */

import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import type { StoreState, StoreStatus } from './types'

// ─────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────

const DEFAULT_STATE: StoreState = {
  status:           'open',
  doorCode:         '1234',
  doorUnlocked:     false,
  alarmArmed:       false,
  currentShiftId:   null,
  lastOpenedAt:     Date.now(),
  lastClosedAt:     null,
  register1Balance: 200.00,    // $ en caisse à l'ouverture
  register2Balance: 200.00,
  safeBalance:      1500.00,
  temperature:      4,         // °C frigos
  cameraOnline:     true,
}

// ─────────────────────────────────────────────
// INTERFACE
// ─────────────────────────────────────────────

interface StoreStateStore {
  state: StoreState

  // ── Statut ──
  openStore:          () => void
  closeStore:         () => void
  setStatus:          (status: StoreStatus) => void

  // ── Porte / alarme ──
  unlockDoor:         (code: string) => boolean
  lockDoor:           () => void
  changeCode:         (oldCode: string, newCode: string) => boolean
  armAlarm:           () => void
  disarmAlarm:        (code: string) => boolean

  // ── Caisses ──
  addToRegister:      (register: 1 | 2, amount: number) => void
  removeFromRegister: (register: 1 | 2, amount: number) => boolean
  transferToSafe:     (register: 1 | 2, amount: number) => boolean
  getRegisterBalance: (register: 1 | 2) => number

  // ── Équipements ──
  setTemperature:     (celsius: number) => void
  setCameraOnline:    (online: boolean) => void

  // ── Shift ──
  setCurrentShift:    (shiftId: string | null) => void

  // ── Reset ──
  reset:              () => void
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useStoreStateStore = create<StoreStateStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        state: { ...DEFAULT_STATE },

        // ── Statut ──
        openStore: () => {
          set(s => ({
            state: {
              ...s.state,
              status: 'open',
              doorUnlocked: false,
              lastOpenedAt: Date.now(),
            },
          }))
        },

        closeStore: () => {
          set(s => ({
            state: {
              ...s.state,
              status: 'closed',
              doorUnlocked: false,
              alarmArmed: true,
              lastClosedAt: Date.now(),
            },
          }))
        },

        setStatus: (status) => {
          set(s => ({ state: { ...s.state, status } }))
        },

        // ── Porte ──
        unlockDoor: (code) => {
          const { state } = get()
          if (code !== state.doorCode) return false
          set(s => ({ state: { ...s.state, doorUnlocked: true } }))
          return true
        },

        lockDoor: () => {
          set(s => ({ state: { ...s.state, doorUnlocked: false } }))
        },

        changeCode: (oldCode, newCode) => {
          const { state } = get()
          if (oldCode !== state.doorCode) return false
          if (newCode.length !== 4 || !/^\d{4}$/.test(newCode)) return false
          set(s => ({ state: { ...s.state, doorCode: newCode } }))
          return true
        },

        armAlarm: () => {
          set(s => ({ state: { ...s.state, alarmArmed: true } }))
        },

        disarmAlarm: (code) => {
          const { state } = get()
          if (code !== state.doorCode) return false
          set(s => ({ state: { ...s.state, alarmArmed: false } }))
          return true
        },

        // ── Caisses ──
        addToRegister: (register, amount) => {
          set(s => ({
            state: {
              ...s.state,
              register1Balance: register === 1
                ? s.state.register1Balance + amount
                : s.state.register1Balance,
              register2Balance: register === 2
                ? s.state.register2Balance + amount
                : s.state.register2Balance,
            },
          }))
        },

        removeFromRegister: (register, amount) => {
          const { state } = get()
          const balance = register === 1 ? state.register1Balance : state.register2Balance
          if (balance < amount) return false

          set(s => ({
            state: {
              ...s.state,
              register1Balance: register === 1
                ? s.state.register1Balance - amount
                : s.state.register1Balance,
              register2Balance: register === 2
                ? s.state.register2Balance - amount
                : s.state.register2Balance,
            },
          }))
          return true
        },

        transferToSafe: (register, amount) => {
          const { removeFromRegister, state } = get()
          if (!removeFromRegister(register, amount)) return false
          set(s => ({ state: { ...s.state, safeBalance: s.state.safeBalance + amount } }))
          return true
        },

        getRegisterBalance: (register) => {
          const { state } = get()
          return register === 1 ? state.register1Balance : state.register2Balance
        },

        // ── Équipements ──
        setTemperature: (celsius) => {
          set(s => ({ state: { ...s.state, temperature: celsius } }))
        },

        setCameraOnline: (online) => {
          set(s => ({ state: { ...s.state, cameraOnline: online } }))
        },

        // ── Shift ──
        setCurrentShift: (shiftId) => {
          set(s => ({ state: { ...s.state, currentShiftId: shiftId } }))
        },

        // ── Reset ──
        reset: () => {
          set({ state: { ...DEFAULT_STATE, lastOpenedAt: Date.now() } })
        },
      }),
      {
        name:    'depanneur-store-state',
        version: 1,
        partialize: (s) => ({
          state: {
            ...s.state,
            // Ne pas persister l'état de la porte (sécurité)
            doorUnlocked: false,
            alarmArmed:   false,
          },
        }),
      }
    )
  )
)