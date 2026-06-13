/**
 * employeeStore.ts
 * Gestion employés et shifts
 * - CRUD employés
 * - Gestion shifts (début/fin)
 * - Calcul heures & paie
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Employee, EmployeeRole, Shift } from './types'
import { useStoreStateStore } from './storeStateStore'

// ─────────────────────────────────────────────
// EMPLOYÉS PAR DÉFAUT
// ─────────────────────────────────────────────

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id:         'emp_001',
    name:       'Jean-François Tremblay',
    role:       'manager',
    hourlyRate: 22.00,
    active:     true,
    pin:        '0000',
  },
  {
    id:         'emp_002',
    name:       'Marie-Ève Bouchard',
    role:       'cashier',
    hourlyRate: 16.25,
    active:     true,
    pin:        '1111',
  },
  {
    id:         'emp_003',
    name:       'Kevin Lapointe',
    role:       'cashier',
    hourlyRate: 15.75,
    active:     true,
    pin:        '2222',
  },
  {
    id:         'emp_004',
    name:       'Amélie Côté',
    role:       'stock_clerk',
    hourlyRate: 15.75,
    active:     true,
    pin:        '3333',
  },
]

function generateShiftId(): string {
  return `shift_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// ─────────────────────────────────────────────
// INTERFACE
// ─────────────────────────────────────────────

interface EmployeeStore {
  employees:    Employee[]
  shifts:       Shift[]
  activeShifts: Map<string, Shift>  // employeeId → Shift actif

  // ── Employés ──
  getEmployee:      (id: string) => Employee | undefined
  getByRole:        (role: EmployeeRole) => Employee[]
  addEmployee:      (employee: Omit<Employee, 'id'>) => Employee
  updateEmployee:   (id: string, changes: Partial<Employee>) => void
  deactivate:       (id: string) => void
  validatePin:      (id: string, pin: string) => boolean

  // ── Shifts ──
  startShift:       (employeeId: string, register: 1 | 2) => Shift | null
  endShift:         (employeeId: string, notes?: string) => Shift | null
  getActiveShift:   (employeeId: string) => Shift | undefined
  getShiftsForDay:  (date?: string) => Shift[]

  // ── Paie ──
  calcEarnings:     (shiftId: string) => number
  getWeeklyPayroll: () => Array<{ employee: Employee; hours: number; total: number }>
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set, get) => ({
      employees:    [...DEFAULT_EMPLOYEES],
      shifts:       [],
      activeShifts: new Map(),

      // ── Employés ──
      getEmployee: (id) => get().employees.find(e => e.id === id),

      getByRole: (role) => get().employees.filter(e => e.role === role && e.active),

      addEmployee: (data) => {
        const employee: Employee = {
          ...data,
          id: `emp_${Date.now()}`,
        }
        set(s => ({ employees: [...s.employees, employee] }))
        return employee
      },

      updateEmployee: (id, changes) => {
        set(s => ({
          employees: s.employees.map(e =>
            e.id === id ? { ...e, ...changes } : e
          ),
        }))
      },

      deactivate: (id) => {
        get().updateEmployee(id, { active: false })
      },

      validatePin: (id, pin) => {
        const emp = get().getEmployee(id)
        return emp?.pin === pin && emp.active
      },

      // ── Shifts ──
      startShift: (employeeId, register) => {
        const { employees, activeShifts } = get()
        const employee = employees.find(e => e.id === employeeId)
        if (!employee || !employee.active) return null
        if (activeShifts.has(employeeId)) return null  // déjà en shift

        const shift: Shift = {
          id:         generateShiftId(),
          employeeId,
          startTime:  Date.now(),
          register,
        }

        const newActiveShifts = new Map(activeShifts)
        newActiveShifts.set(employeeId, shift)

        set(s => ({
          shifts:       [...s.shifts, shift],
          activeShifts: newActiveShifts,
        }))

        useStoreStateStore.getState().setCurrentShift(shift.id)
        return shift
      },

      endShift: (employeeId, notes) => {
        const { activeShifts, shifts } = get()
        const activeShift = activeShifts.get(employeeId)
        if (!activeShift) return null

        const endTime    = Date.now()
        const hoursWorked = Math.round(
          ((endTime - activeShift.startTime) / 3_600_000) * 100
        ) / 100
        const employee   = get().getEmployee(employeeId)
        const earnings   = employee
          ? Math.round(hoursWorked * employee.hourlyRate * 100) / 100
          : 0

        const completedShift: Shift = {
          ...activeShift,
          endTime,
          hoursWorked,
          earnings,
          notes,
        }

        const newActiveShifts = new Map(activeShifts)
        newActiveShifts.delete(employeeId)

        set({
          shifts: shifts.map(s => s.id === completedShift.id ? completedShift : s),
          activeShifts: newActiveShifts,
        })

        return completedShift
      },

      getActiveShift: (employeeId) => get().activeShifts.get(employeeId),

      getShiftsForDay: (date) => {
        const targetDate = date ?? new Date().toISOString().slice(0, 10)
        const startMs    = new Date(targetDate).setHours(0, 0, 0, 0)
        const endMs      = new Date(targetDate).setHours(23, 59, 59, 999)
        return get().shifts.filter(
          s => s.startTime >= startMs && s.startTime <= endMs
        )
      },

      // ── Paie ──
      calcEarnings: (shiftId) => {
        const shift = get().shifts.find(s => s.id === shiftId)
        if (!shift?.hoursWorked || !shift.earnings) return 0
        return shift.earnings
      },

      getWeeklyPayroll: () => {
        const monday = new Date()
        monday.setDate(monday.getDate() - monday.getDay() + 1)
        monday.setHours(0, 0, 0, 0)

        const weekShifts = get().shifts.filter(s => s.startTime >= monday.getTime())

        return get().employees
          .filter(e => e.active)
          .map(employee => {
            const empShifts = weekShifts.filter(s => s.employeeId === employee.id)
            const hours  = empShifts.reduce((s, sh) => s + (sh.hoursWorked ?? 0), 0)
            const total  = empShifts.reduce((s, sh) => s + (sh.earnings ?? 0), 0)
            return { employee, hours: Math.round(hours * 100) / 100, total: Math.round(total * 100) / 100 }
          })
      },
    }),
    {
      name:    'depanneur-employees',
      version: 1,
      // Ne pas persister activeShifts (Map non-sérialisable)
      partialize: (s) => ({
        employees: s.employees,
        shifts:    s.shifts,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.activeShifts = new Map()
      },
    }
  )
)