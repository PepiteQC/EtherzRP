/**
 * interior/index.ts — Barrel export
 */

// ── Types ──
export type {
  InteractionType,
  InteractionTarget,
  InteractionResult,
  PlayerInventoryItem,
  PlayerInteriorState,
  NPCRole,
  NPCMood,
  NPCAction,
  NPCState,
  ZoneId,
  InteriorZone,
  TimeOfDay,
  WeatherOutside,
  AmbientConfig,
  RadioStation,
  InteriorSceneState,
} from './types'

// ── Scene root ──
export { InteriorScene } from './InteriorScene'

// ── Controller ──
export { useInteriorController } from './InteriorController'

// ── Zones ──
export { InteractionZone } from './zones/InteractionZone'
export { CheckoutZone } from './zones/CheckoutZone'
export { ShelfZone } from './zones/ShelfZone'
export { CoffeeZone } from './zones/CoffeeZone'

// ── NPCs ──
export { Cashier } from './npc/Cashier'
export { Customer } from './npc/Customer'
export { useNPCStore } from './npc/npcStore'

// ── UI ──
export { InteriorHUD } from './ui/InteriorHUD'
export { CheckoutUI } from './ui/CheckoutUI'
export { InteractionPrompt } from './ui/InteractionPrompt'

// ── Ambient ──
export { RadioSystem } from './ambient/RadioSystem'
export { WeatherEffect } from './ambient/WeatherEffect'