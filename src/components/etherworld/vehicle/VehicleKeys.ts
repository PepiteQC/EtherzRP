import { useStore as useGameStore, type InventoryItem } from '@/lib/etherworld/game-store'
import { useGarageStore } from '../garage'

export const VEHICLE_KEY_TAG = 'vehicle-key'
export const STARTER_KEY_FLAG = 'etherzrp-starter-vehicle-key-created'

export function getVehicleKeyId(plate = useGarageStore.getState().vehiclePlate) {
  return `vehicle_key_${plate.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
}

export function createVehicleKeyItem(plate = useGarageStore.getState().vehiclePlate): InventoryItem {
  return {
    id: getVehicleKeyId(plate),
    name: `Clé véhicule ${plate}`,
    description: `Clé électronique liée au véhicule immatriculé ${plate}.`,
    lore: 'Une clé RP EtherzRP. Elle permet de verrouiller, déverrouiller et accéder au coffre du véhicule.',
    icon: '🔑',
    category: 'key',
    rarity: 'rare',
    stackable: false,
    maxStack: 1,
    quantity: 1,
    weight: 0.08,
    value: 250,
    usable: true,
    tradeable: true,
    dropable: true,
    questItem: false,
    tags: [VEHICLE_KEY_TAG, plate],
    customData: {
      plate,
      vehicleId: 'player-main-vehicle',
      type: VEHICLE_KEY_TAG,
    },
  }
}

export function hasVehicleKey(plate = useGarageStore.getState().vehiclePlate) {
  const keyId = getVehicleKeyId(plate)
  const slots = useGameStore.getState().inventorySlots ?? []
  return slots.some(slot => {
    const item = slot.item
    if (!item) return false
    if (item.id === keyId) return true
    if (item.tags?.includes(VEHICLE_KEY_TAG) && item.customData?.plate === plate) return true
    return false
  })
}

export function giveVehicleKey(plate = useGarageStore.getState().vehiclePlate) {
  if (hasVehicleKey(plate)) return true
  return useGameStore.getState().addItem(createVehicleKeyItem(plate))
}

export function ensureStarterVehicleKey() {
  if (typeof localStorage !== 'undefined' && localStorage.getItem(STARTER_KEY_FLAG) === '1') {
    return hasVehicleKey() || giveVehicleKey()
  }

  const ok = giveVehicleKey()
  if (ok && typeof localStorage !== 'undefined') localStorage.setItem(STARTER_KEY_FLAG, '1')
  return ok
}

export function notifyKeyRequired() {
  window.dispatchEvent(new CustomEvent('hud-notification', {
    detail: { message: 'Tu dois avoir la clé du véhicule.', duration: 2600 },
  }))
}
