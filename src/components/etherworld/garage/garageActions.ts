import { useStore as useGameStore } from '@/lib/etherworld/game-store'
import { useGarageStore } from './garageStore'
import { giveVehicleKey, hasVehicleKey } from '../vehicle/VehicleKeys'

export type GarageActionResult = {
  ok: boolean
  message: string
  cost?: number
}

const PALETTE = [
  '#164a98', // bleu EtherzRP
  '#111827', // noir graphite
  '#b91c1c', // rouge
  '#f8fafc', // blanc
  '#166534', // vert
  '#f59e0b', // jaune/or
  '#6d28d9', // mauve
]

function notify(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', icon = '🔧') {
  const game = useGameStore.getState() as any
  if (game.addNotification) game.addNotification(message, type, 3200, icon)
  else if (game.setNotification) game.setNotification(message, type, 3200, icon)

  window.dispatchEvent(new CustomEvent('hud-notification', {
    detail: { message, duration: 2800 },
  }))
}

function charge(cost: number): boolean {
  const game = useGameStore.getState() as any
  if (cost <= 0) return true

  if (typeof game.removeMoney === 'function') return game.removeMoney(cost)

  const money = game.playerStats?.money ?? game.playerProfile?.cash ?? 0
  if (money < cost) return false

  if (game.playerStats) {
    useGameStore.setState({ playerStats: { ...game.playerStats, money: money - cost } } as any)
    return true
  }
  if (game.playerProfile) {
    useGameStore.setState({ playerProfile: { ...game.playerProfile, cash: money - cost } } as any)
    return true
  }
  return false
}

export function getRepairCost() {
  const s = useGarageStore.getState()
  const damage = Math.ceil(s.vehicleDamage)
  if (damage <= 0) return 0
  return Math.ceil(s.prices.repairBase + damage * s.prices.repairPerDamage)
}

export function getRefuelCost() {
  const s = useGarageStore.getState()
  const missing = Math.ceil(100 - s.vehicleFuel)
  if (missing <= 0) return 0
  return Math.ceil(missing * s.prices.refuelPerPercent)
}

export function repairVehicle(): GarageActionResult {
  const store = useGarageStore.getState()
  const cost = getRepairCost()

  if (store.vehicleDamage <= 0.5) {
    const message = 'Le véhicule est déjà en bon état.'
    notify(message, 'info', '✅')
    return { ok: true, message, cost: 0 }
  }

  if (!charge(cost)) {
    const message = `Pas assez d'argent pour réparer (${cost}$).`
    notify(message, 'error', '💸')
    return { ok: false, message, cost }
  }

  store.applyVehicleService({ vehicleDamage: 0 })
  const message = `Véhicule réparé pour ${cost}$.`
  notify(message, 'success', '🔧')
  return { ok: true, message, cost }
}

export function refuelVehicle(): GarageActionResult {
  const store = useGarageStore.getState()
  const cost = getRefuelCost()

  if (store.vehicleFuel >= 99.5) {
    const message = 'Le réservoir est déjà plein.'
    notify(message, 'info', '⛽')
    return { ok: true, message, cost: 0 }
  }

  if (!charge(cost)) {
    const message = `Pas assez d'argent pour faire le plein (${cost}$).`
    notify(message, 'error', '💸')
    return { ok: false, message, cost }
  }

  store.applyVehicleService({ vehicleFuel: 100 })
  const message = `Plein complété pour ${cost}$.`
  notify(message, 'success', '⛽')
  return { ok: true, message, cost }
}

export function repaintVehicle(color?: string): GarageActionResult {
  const store = useGarageStore.getState()
  const cost = store.prices.repaint
  const current = store.vehiclePaintColor
  const next = color ?? PALETTE[(PALETTE.indexOf(current) + 1 + PALETTE.length) % PALETTE.length]

  if (next === current) {
    const message = 'Cette couleur est déjà appliquée.'
    notify(message, 'info', '🎨')
    return { ok: true, message, cost: 0 }
  }

  if (!charge(cost)) {
    const message = `Pas assez d'argent pour la peinture (${cost}$).`
    notify(message, 'error', '💸')
    return { ok: false, message, cost }
  }

  store.applyVehicleService({ vehiclePaintColor: next })
  const message = `Peinture appliquée pour ${cost}$.`
  notify(message, 'success', '🎨')
  return { ok: true, message, cost }
}

export function makeVehicleKey(): GarageActionResult {
  const store = useGarageStore.getState()
  const cost = 75

  if (hasVehicleKey(store.vehiclePlate)) {
    const message = 'Tu as déjà la clé de ce véhicule.'
    notify(message, 'info', '🔑')
    return { ok: true, message, cost: 0 }
  }

  if (!charge(cost)) {
    const message = `Pas assez d'argent pour refaire une clé (${cost}$).`
    notify(message, 'error', '💸')
    return { ok: false, message, cost }
  }

  if (!giveVehicleKey(store.vehiclePlate)) {
    const message = 'Inventaire plein — impossible de recevoir la clé.'
    notify(message, 'error', '🎒')
    return { ok: false, message, cost }
  }

  const message = `Nouvelle clé créée pour ${store.vehiclePlate}.`
  notify(message, 'success', '🔑')
  return { ok: true, message, cost }
}

export function changePlate(plate?: string): GarageActionResult {
  const store = useGarageStore.getState()
  const cost = store.prices.plateChange
  const next = (plate || `QC-${Math.floor(100 + Math.random() * 899)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`).toUpperCase().slice(0, 10)

  if (!charge(cost)) {
    const message = `Pas assez d'argent pour changer la plaque (${cost}$).`
    notify(message, 'error', '💸')
    return { ok: false, message, cost }
  }

  store.applyVehicleService({ vehiclePlate: next })
  const message = `Plaque changée: ${next}.`
  notify(message, 'success', '🔖')
  return { ok: true, message, cost }
}

export function getGaragePalette() {
  return PALETTE
}
