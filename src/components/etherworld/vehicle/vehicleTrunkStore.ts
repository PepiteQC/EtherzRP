import { create } from 'zustand'
import type { InventoryItem, InventorySlot } from '@/lib/etherworld/game-store'

const TRUNK_SLOT_COUNT = 24
const TRUNK_MAX_WEIGHT = 90

interface VehicleTrunkState {
  slots: InventorySlot[]
  maxWeight: number
  selectedTrunkSlot: number | null
  setSelectedTrunkSlot: (slotId: number | null) => void
  addToTrunk: (item: InventoryItem) => boolean
  removeFromTrunk: (slotId: number, quantity?: number) => InventoryItem | null
  moveTrunkItem: (fromSlot: number, toSlot: number) => boolean
  clearTrunk: () => void
  getTrunkWeight: () => number
  getUsedSlots: () => number
}

function createTrunkSlots(): InventorySlot[] {
  return Array.from({ length: TRUNK_SLOT_COUNT }, (_, i) => ({
    slotId: i,
    item: null,
    locked: false,
    favorite: false,
    hotbar: false,
  } as InventorySlot))
}

function itemWeight(item: InventoryItem) {
  return item.weight * item.quantity
}

export const useVehicleTrunkStore = create<VehicleTrunkState>((set, get) => ({
  slots: createTrunkSlots(),
  maxWeight: TRUNK_MAX_WEIGHT,
  selectedTrunkSlot: null,

  setSelectedTrunkSlot: (slotId) => set({ selectedTrunkSlot: slotId }),

  getTrunkWeight: () => get().slots.reduce((sum, slot) => {
    return sum + (slot.item ? itemWeight(slot.item) : 0)
  }, 0),

  getUsedSlots: () => get().slots.filter(slot => slot.item !== null).length,

  addToTrunk: (item) => {
    const state = get()
    if (state.getTrunkWeight() + itemWeight(item) > state.maxWeight) return false

    if (item.stackable) {
      const existing = state.slots.find(slot =>
        slot.item?.id === item.id &&
        slot.item.quantity < slot.item.maxStack &&
        !slot.locked
      )

      if (existing?.item) {
        const spaceLeft = existing.item.maxStack - existing.item.quantity
        const toAdd = Math.min(spaceLeft, item.quantity)
        set(s => ({
          slots: s.slots.map(slot =>
            slot.slotId === existing.slotId
              ? { ...slot, item: { ...slot.item!, quantity: slot.item!.quantity + toAdd } }
              : slot
          ),
        }))

        if (toAdd < item.quantity) {
          return get().addToTrunk({ ...item, quantity: item.quantity - toAdd })
        }
        return true
      }
    }

    const empty = state.slots.find(slot => slot.item === null && !slot.locked)
    if (!empty) return false

    set(s => ({
      slots: s.slots.map(slot =>
        slot.slotId === empty.slotId ? { ...slot, item: { ...item } } : slot
      ),
    }))
    return true
  },

  removeFromTrunk: (slotId, quantity = 1) => {
    const slot = get().slots.find(s => s.slotId === slotId)
    if (!slot?.item || slot.locked) return null

    const removedQuantity = Math.min(quantity, slot.item.quantity)
    const removedItem: InventoryItem = { ...slot.item, quantity: removedQuantity }

    if (slot.item.quantity <= quantity) {
      set(s => ({
        slots: s.slots.map(sl => sl.slotId === slotId ? { ...sl, item: null } : sl),
      }))
    } else {
      set(s => ({
        slots: s.slots.map(sl =>
          sl.slotId === slotId
            ? { ...sl, item: { ...sl.item!, quantity: sl.item!.quantity - removedQuantity } }
            : sl
        ),
      }))
    }

    return removedItem
  },

  moveTrunkItem: (fromSlot, toSlot) => {
    const state = get()
    const from = state.slots.find(s => s.slotId === fromSlot)
    const to = state.slots.find(s => s.slotId === toSlot)
    if (!from || !to || from.locked || to.locked) return false

    if (from.item && to.item && from.item.id === to.item.id && from.item.stackable) {
      const space = to.item.maxStack - to.item.quantity
      if (space > 0) {
        const toMove = Math.min(from.item.quantity, space)
        set(s => ({
          slots: s.slots.map(sl => {
            if (sl.slotId === fromSlot) {
              const remaining = sl.item!.quantity - toMove
              return { ...sl, item: remaining > 0 ? { ...sl.item!, quantity: remaining } : null }
            }
            if (sl.slotId === toSlot) return { ...sl, item: { ...sl.item!, quantity: sl.item!.quantity + toMove } }
            return sl
          }),
        }))
        return true
      }
    }

    set(s => ({
      slots: s.slots.map(slot => {
        if (slot.slotId === fromSlot) return { ...slot, item: to.item }
        if (slot.slotId === toSlot) return { ...slot, item: from.item }
        return slot
      }),
    }))
    return true
  },

  clearTrunk: () => set({ slots: createTrunkSlots(), selectedTrunkSlot: null }),
}))

export default useVehicleTrunkStore
