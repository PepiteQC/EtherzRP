import { create } from 'zustand'

export interface GaragePrices {
  repairBase: number
  repairPerDamage: number
  refuelPerPercent: number
  repaint: number
  plateChange: number
}

interface GarageState {
  menuOpen: boolean
  inZone: boolean
  activeGarageId: string | null
  activeGarageName: string | null

  vehicleFuel: number
  vehicleDamage: number
  vehiclePaintColor: string
  vehiclePlate: string
  vehicleLocked: boolean
  trunkOpen: boolean
  engineOn: boolean

  // Changements demandés par le garage. Le véhicule lit cette revision et se synchronise.
  externalRevision: number
  telemetryRevision: number

  prices: GaragePrices

  setInZone: (inZone: boolean, garageId?: string | null, garageName?: string | null) => void
  openMenu: (garageId?: string | null, garageName?: string | null) => void
  closeMenu: () => void
  toggleMenu: () => void

  setVehicleTelemetry: (payload: Partial<Pick<GarageState, 'vehicleFuel' | 'vehicleDamage' | 'engineOn'>>) => void
  applyVehicleService: (payload: Partial<Pick<GarageState, 'vehicleFuel' | 'vehicleDamage' | 'vehiclePaintColor' | 'vehiclePlate' | 'vehicleLocked' | 'trunkOpen'>>) => void
  toggleVehicleLock: () => void
  toggleTrunk: () => void
}

export const useGarageStore = create<GarageState>((set, get) => ({
  menuOpen: false,
  inZone: false,
  activeGarageId: null,
  activeGarageName: null,

  vehicleFuel: 100,
  vehicleDamage: 0,
  vehiclePaintColor: '#164a98',
  vehiclePlate: 'QC-RP-138',
  vehicleLocked: false,
  trunkOpen: false,
  engineOn: true,

  externalRevision: 0,
  telemetryRevision: 0,

  prices: {
    repairBase: 85,
    repairPerDamage: 12,
    refuelPerPercent: 2.35,
    repaint: 450,
    plateChange: 180,
  },

  setInZone: (inZone, garageId = null, garageName = null) => set((s) => ({
    inZone,
    activeGarageId: inZone ? garageId : null,
    activeGarageName: inZone ? garageName : null,
    menuOpen: inZone ? s.menuOpen : false,
  })),

  openMenu: (garageId = get().activeGarageId, garageName = get().activeGarageName) => set({
    menuOpen: true,
    activeGarageId: garageId,
    activeGarageName: garageName,
  }),

  closeMenu: () => set({ menuOpen: false }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),

  setVehicleTelemetry: (payload) => set((s) => ({
    ...payload,
    telemetryRevision: s.telemetryRevision + 1,
  })),

  applyVehicleService: (payload) => set((s) => ({
    ...payload,
    externalRevision: s.externalRevision + 1,
  })),

  toggleVehicleLock: () => set((s) => ({
    vehicleLocked: !s.vehicleLocked,
    externalRevision: s.externalRevision + 1,
  })),

  toggleTrunk: () => set((s) => ({
    trunkOpen: !s.trunkOpen,
    externalRevision: s.externalRevision + 1,
  })),
}))

export default useGarageStore
