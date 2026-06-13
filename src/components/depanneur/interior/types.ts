/**
 * types.ts — Types partagés pour l'intérieur du dépanneur
 */

import type { Product } from '../storage/types'

// ─────────────────────────────────────────────
// INTERACTION
// ─────────────────────────────────────────────

export type InteractionType =
  | 'examine'       // Regarder un produit
  | 'pickup'        // Ramasser
  | 'purchase'      // Acheter (caisse)
  | 'talk'          // Parler à un NPC
  | 'use'           // Utiliser (café, slurpee)
  | 'open'          // Ouvrir (frigo, coffre)
  | 'read'          // Lire (magazine, affiche)
  | 'deposit'       // Déposer (coffre, caisse)
  | 'access'        // Accéder (zone restreinte)

export interface InteractionTarget {
  id:          string
  type:        InteractionType
  label:       string
  labelFr:     string
  position:    [number, number, number]
  radius:      number
  requiresItem?: string     // item requis pour interagir
  requiresRole?: string     // rôle requis
  cooldown?:   number       // ms entre interactions
  oneShot?:    boolean      // interaction unique
}

export interface InteractionResult {
  success:     boolean
  message?:    string
  messageFr?:  string
  product?:    Product
  xpGained?:   number
  moneyGained?: number
  moneySpent?:  number
}

// ─────────────────────────────────────────────
// JOUEUR INTÉRIEUR
// ─────────────────────────────────────────────

export interface PlayerInventoryItem {
  product:   Product
  quantity:  number
  pickedAt:  number
}

export interface PlayerInteriorState {
  inventory:          PlayerInventoryItem[]
  money:              number
  nearInteraction:    InteractionTarget | null
  activeInteraction:  InteractionTarget | null
  isAtCounter:        boolean
  isInRestrictedZone: boolean
  suspicion:          number      // 0-100, monte si comportement suspect
  lastPurchaseTime:   number | null
}

// ─────────────────────────────────────────────
// NPC
// ─────────────────────────────────────────────

export type NPCRole = 'cashier' | 'customer' | 'manager' | 'guard'

export type NPCMood = 'neutral' | 'happy' | 'suspicious' | 'angry' | 'busy'

export type NPCAction =
  | 'idle'
  | 'walking'
  | 'browsing'        // regarder les produits
  | 'checkout'        // passer à la caisse
  | 'working'         // caissier qui travaille
  | 'watching'        // surveiller (suspicious)
  | 'talking'         // parler au joueur

export interface NPCState {
  id:           string
  name:         string
  role:         NPCRole
  mood:         NPCMood
  action:       NPCAction
  position:     [number, number, number]
  rotation:     number      // Y axis
  targetPos?:   [number, number, number]
  dialogueId?:  string
  isAvailable:  boolean     // peut parler
  suspicionOf:  string[]    // entity IDs suspects
}

// ─────────────────────────────────────────────
// ZONES
// ─────────────────────────────────────────────

export type ZoneId =
  | 'entrance'
  | 'main_floor'
  | 'counter'
  | 'coffee_area'
  | 'snack_aisle'
  | 'drink_aisle'
  | 'back_fridges'
  | 'storage'
  | 'office'
  | 'restroom'

export interface InteriorZone {
  id:          ZoneId
  name:        string
  nameFr:      string
  bounds:      { min: [number, number, number]; max: [number, number, number] }
  restricted:  boolean
  npcOnly:     boolean
  interactions: InteractionTarget[]
}

// ─────────────────────────────────────────────
// AMBIANCE
// ─────────────────────────────────────────────

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export type WeatherOutside =
  | 'sunny'
  | 'cloudy'
  | 'raining'
  | 'snowing'
  | 'foggy'

export interface AmbientConfig {
  timeOfDay:     TimeOfDay
  weather:       WeatherOutside
  musicVolume:   number      // 0-1
  sfxVolume:     number      // 0-1
  lightIntensity: number     // multiplicateur
  customerCount: number      // NPCs actifs
}

// ─────────────────────────────────────────────
// RADIO
// ─────────────────────────────────────────────

export interface RadioStation {
  id:       string
  name:     string
  genre:    string
  url?:     string         // stream URL
  isOn:     boolean
  volume:   number
}

// ─────────────────────────────────────────────
// INTERIOR STATE
// ─────────────────────────────────────────────

export interface InteriorSceneState {
  isLoaded:      boolean
  playerState:   PlayerInteriorState
  npcs:          NPCState[]
  ambientConfig: AmbientConfig
  radio:         RadioStation
  zones:         InteriorZone[]
  showUI:        string[]   // UI panels visibles
}