'use client'

import { create } from 'zustand'
import type {
  InventoryItem,
  InventorySlot,
  InventoryConfig,
  PlayerCard,
  RoomConfig,
  Light,
  CardAccessLevel,
  PlacedObject,
  ContextAction,
  DragPreviewState,
  ComputerState,
  ShopItem,
} from './types'

interface EtherWorldStore {
  roomConfig: RoomConfig
  playerCard: PlayerCard | null

  lights: Record<string, Light>
  toggleLight: (id: string) => void

  showNotification: string | null
  setNotification: (msg: string | null) => void

  inventorySlots: InventorySlot[]
  inventoryConfig: InventoryConfig
  inventoryOpen: boolean
  setInventoryOpen: (open: boolean) => void
  selectedSlot: number | null
  selectSlot: (slotId: number | null) => void
  addItem: (item: InventoryItem) => boolean
  removeItem: (slotId: number) => boolean
  moveItem: (fromSlot: number, toSlot: number) => boolean
  getTotalWeight: () => number
  getCashAmount: () => number
  spendCash: (amount: number) => boolean

  editorMode: boolean
  toggleEditorMode: () => void
  placedObjects: PlacedObject[]
  addPlacedObject: (obj: PlacedObject) => void
  removePlacedObject: (id: string) => void
  updatePlacedObject: (id: string, updates: Partial<PlacedObject>) => void
  selectedObject: string | null
  setSelectedObject: (id: string | null) => void

  dragPreview: DragPreviewState
  setDragPreview: (preview: Partial<DragPreviewState>) => void
  clearDragPreview: () => void

  contextMenu: {
    visible: boolean
    x: number
    y: number
    objectId: string
    objectType: string
    actions: ContextAction[]
  } | null
  showContextMenu: (menu: NonNullable<EtherWorldStore['contextMenu']>) => void
  hideContextMenu: () => void

  playerAction: 'standing' | 'sitting' | 'lying' | 'leaning' | 'showering'
  setPlayerAction: (action: EtherWorldStore['playerAction']) => void

  computerState: ComputerState
  setComputerState: (state: Partial<ComputerState>) => void
  toggleComputer: () => void

  shopOpen: boolean
  setShopOpen: (open: boolean) => void
  shopCart: ShopItem[]
  addToCart: (item: ShopItem) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  purchaseCart: () => boolean

  showerActive: boolean
  setShowerActive: (active: boolean) => void

  windowsOpen: Record<string, boolean>
  toggleWindow: (id: string) => void
}

const createEmptyInventory = (): InventorySlot[] =>
  Array.from({ length: 32 }, (_, i) => ({
    slotId: i,
    item: null,
    locked: false,
  }))

export const useEtherWorldStore = create<EtherWorldStore>((set, get) => ({
  roomConfig: {
    roomNumber: 'A-1-01',
    floor: 1,
    type: 'SUITE',
  },

  playerCard: {
    id: 'card_001',
    level: 'admin' as CardAccessLevel,
    name: 'Super Admin',
    issueDate: Date.now(),
    expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
  },

  lights: {
    ceiling: { id: 'ceiling', isOn: true, intensity: 1.5, color: '#fff5e6' },
    desk: { id: 'desk', isOn: true, intensity: 0.8, color: '#fef3c7' },
    neon: { id: 'neon', isOn: true, intensity: 0.8, color: '#8b5cf6' },
    bathroom: { id: 'bathroom', isOn: true, intensity: 1, color: '#ffffff' },
    tv: { id: 'tv', isOn: false, intensity: 0.4, color: '#3b82f6' },
    bed: { id: 'bed', isOn: true, intensity: 0.4, color: '#8b5cf6' },
  },

  toggleLight: (id) =>
    set((state) => {
      const light = state.lights[id]
      if (!light) return state

      return {
        lights: {
          ...state.lights,
          [id]: { ...light, isOn: !light.isOn },
        },
      }
    }),

  showNotification: null,
  setNotification: (msg) => set({ showNotification: msg }),

  inventoryConfig: { maxSlots: 32, maxWeight: 50 },
  inventorySlots: createEmptyInventory(),
  inventoryOpen: false,
  setInventoryOpen: (open) => set({ inventoryOpen: open }),
  selectedSlot: null,
  selectSlot: (slotId) => set({ selectedSlot: slotId }),

  addItem: (item) => {
    const state = get()

    if (state.getTotalWeight() + item.weight * item.quantity > state.inventoryConfig.maxWeight) {
      return false
    }

    if (item.stackable) {
      const existingSlot = state.inventorySlots.find(
        (slot) => slot.item?.id === item.id && slot.item.quantity < item.maxStack
      )

      if (existingSlot?.item) {
        set((state) => ({
          inventorySlots: state.inventorySlots.map((slot) =>
            slot.slotId === existingSlot.slotId
              ? {
                  ...slot,
                  item: {
                    ...existingSlot.item!,
                    quantity: Math.min(
                      existingSlot.item!.quantity + item.quantity,
                      existingSlot.item!.maxStack
                    ),
                  },
                }
              : slot
          ),
        }))
        return true
      }
    }

    const emptySlot = state.inventorySlots.find((slot) => !slot.locked && !slot.item)
    if (!emptySlot) return false

    set((state) => ({
      inventorySlots: state.inventorySlots.map((slot) =>
        slot.slotId === emptySlot.slotId ? { ...slot, item } : slot
      ),
    }))

    return true
  },

  removeItem: (slotId) => {
    set((state) => ({
      inventorySlots: state.inventorySlots.map((slot) =>
        slot.slotId === slotId ? { ...slot, item: null } : slot
      ),
    }))
    return true
  },

  moveItem: (fromSlot, toSlot) => {
    const state = get()
    const from = state.inventorySlots.find((slot) => slot.slotId === fromSlot)
    const to = state.inventorySlots.find((slot) => slot.slotId === toSlot)

    if (!from || !to || from.locked || to.locked || !from.item) return false

    set((state) => ({
      inventorySlots: state.inventorySlots.map((slot) => {
        if (slot.slotId === fromSlot) return { ...slot, item: to.item }
        if (slot.slotId === toSlot) return { ...slot, item: from.item }
        return slot
      }),
    }))

    return true
  },

  getTotalWeight: () =>
    get().inventorySlots.reduce(
      (total, slot) => total + (slot.item ? slot.item.weight * slot.item.quantity : 0),
      0
    ),

  getCashAmount: () => {
    const cashSlot = get().inventorySlots.find((slot) => slot.item?.id === 'cash')
    return cashSlot?.item?.quantity ?? 0
  },

  spendCash: (amount) => {
    if (amount <= 0) return true
    if (get().getCashAmount() < amount) return false

    set((state) => ({
      inventorySlots: state.inventorySlots.map((slot) => {
        if (slot.item?.id !== 'cash') return slot

        const quantity = slot.item.quantity - amount
        return quantity <= 0
          ? { ...slot, item: null }
          : { ...slot, item: { ...slot.item, quantity } }
      }),
    }))

    return true
  },

  editorMode: false,
  toggleEditorMode: () => set((state) => ({ editorMode: !state.editorMode })),
  placedObjects: [],
  addPlacedObject: (obj) =>
    set((state) => ({ placedObjects: [...state.placedObjects, obj] })),
  removePlacedObject: (id) =>
    set((state) => ({
      placedObjects: state.placedObjects.filter((obj) => obj.id !== id),
    })),
  updatePlacedObject: (id, updates) =>
    set((state) => ({
      placedObjects: state.placedObjects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    })),
  selectedObject: null,
  setSelectedObject: (id) => set({ selectedObject: id }),

  dragPreview: {
    active: false,
    objectType: null,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    isValid: true,
  },
  setDragPreview: (preview) =>
    set((state) => ({ dragPreview: { ...state.dragPreview, ...preview } })),
  clearDragPreview: () =>
    set({
      dragPreview: {
        active: false,
        objectType: null,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isValid: true,
      },
    }),

  contextMenu: null,
  showContextMenu: (menu) => set({ contextMenu: menu }),
  hideContextMenu: () => set({ contextMenu: null }),

  playerAction: 'standing',
  setPlayerAction: (action) => set({ playerAction: action }),

  computerState: {
    isOn: false,
    currentApp: null,
    bootProgress: 0,
  },
  setComputerState: (state) =>
    set((current) => ({
      computerState: { ...current.computerState, ...state },
    })),
  toggleComputer: () => {
    const computer = get().computerState

    if (computer.isOn) {
      set({ computerState: { isOn: false, currentApp: null, bootProgress: 0 } })
      return
    }

    set({ computerState: { isOn: true, currentApp: null, bootProgress: 100 } })
    set((state) => ({
      computerState: { ...state.computerState, currentApp: 'desktop' },
    }))
  },

  shopOpen: false,
  setShopOpen: (open) => set({ shopOpen: open }),
  shopCart: [],
  addToCart: (item) => set((state) => ({ shopCart: [...state.shopCart, item] })),
  removeFromCart: (itemId) =>
    set((state) => ({
      shopCart: state.shopCart.filter((item) => item.id !== itemId),
    })),
  clearCart: () => set({ shopCart: [] }),
  purchaseCart: () => {
    const state = get()

    const total = state.shopCart.reduce((sum, item) => {
      const discount = item.discount ?? 0
      return sum + Math.floor(item.value * (1 - discount / 100))
    }, 0)

    if (!state.spendCash(total)) {
      state.setNotification('Fonds insuffisants!')
      return false
    }

    for (const shopItem of state.shopCart) {
      state.addItem({
        id: `${shopItem.id}_${crypto.randomUUID()}`,
        name: shopItem.name,
        description: shopItem.description,
        icon: shopItem.icon,
        category: shopItem.category,
        rarity: shopItem.rarity,
        stackable: shopItem.stackable,
        maxStack: shopItem.maxStack,
        quantity: shopItem.quantity,
        weight: shopItem.weight,
        value: shopItem.value,
        usable: shopItem.usable,
        tradeable: shopItem.tradeable,
      })
    }

    state.clearCart()
    state.setNotification('Achat effectué!')
    return true
  },

  showerActive: false,
  setShowerActive: (active) => set({ showerActive: active }),

  windowsOpen: { window1: false, window2: false },
  toggleWindow: (id) =>
    set((state) => ({
      windowsOpen: {
        ...state.windowsOpen,
        [id]: !(state.windowsOpen[id] ?? false),
      },
    })),
}))