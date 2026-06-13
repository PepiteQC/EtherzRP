// ════════════════════════════════════════════════════════════════════════════
//  ETHERWORLD — TYPES COMPLETS
//  Chambre d'hôtel RP — EtherWorld Québec
// ════════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────
// CARTE D'ACCÈS
// ────────────────────────────────────────────────────────────────

export type CardAccessLevel = 'none' | 'guest' | 'resident' | 'vip' | 'admin'

export const ACCESS_LEVELS: Record<CardAccessLevel, number> = {
  none:     0,
  guest:    1,
  resident: 2,
  vip:      3,
  admin:    4,
}

export const CARD_COLORS: Record<CardAccessLevel, string> = {
  none:     '#374151',
  guest:    '#6b7280',
  resident: '#3b82f6',
  vip:      '#f59e0b',
  admin:    '#ef4444',
}

export const CARD_LABELS: Record<CardAccessLevel, string> = {
  none:     'Aucune',
  guest:    'Invité',
  resident: 'Résident',
  vip:      'VIP',
  admin:    'Administrateur',
}

export const CARD_DESCRIPTIONS: Record<CardAccessLevel, string> = {
  none:     'Aucun accès autorisé',
  guest:    'Accès aux zones communes et votre chambre',
  resident: 'Accès complet à votre étage et services',
  vip:      'Accès premium, services exclusifs et lounge',
  admin:    'Accès total à tout le bâtiment',
}

export const CARD_EMISSIVE: Record<CardAccessLevel, string> = {
  none:     '#1f2937',
  guest:    '#374151',
  resident: '#1d4ed8',
  vip:      '#b45309',
  admin:    '#b91c1c',
}

export interface KeyCard {
  id: string
  level: CardAccessLevel
  name: string
  color: string
  issuedAt: number
  expiresAt: number        // timestamp, 0 = jamais
  isActive: boolean
  isLost: boolean
  pin?: string             // code PIN 4 chiffres
  allowedRooms?: string[]  // chambres spécifiques autorisées
  accessCount: number      // nombre d'utilisations
  lastUsedAt: number
  notes?: string
}

// Helper: créer une carte
export function createKeyCard(
  id: string,
  level: CardAccessLevel,
  name: string,
  opts: Partial<KeyCard> = {}
): KeyCard {
  return {
    id,
    level,
    name,
    color: CARD_COLORS[level],
    issuedAt: Date.now(),
    expiresAt: 0,
    isActive: true,
    isLost: false,
    accessCount: 0,
    lastUsedAt: 0,
    ...opts,
  }
}

// Helper: vérifier si une carte peut accéder
export function canCardAccess(card: KeyCard | null, requiredLevel: CardAccessLevel): {
  granted: boolean
  reason: string
} {
  if (!card) return { granted: false, reason: 'Aucune carte présentée' }
  if (card.isLost) return { granted: false, reason: 'Carte signalée perdue' }
  if (!card.isActive) return { granted: false, reason: 'Carte désactivée' }
  if (card.expiresAt > 0 && Date.now() > card.expiresAt) return { granted: false, reason: 'Carte expirée' }
  if (ACCESS_LEVELS[card.level] < ACCESS_LEVELS[requiredLevel]) {
    return { granted: false, reason: `Niveau ${CARD_LABELS[requiredLevel]} requis` }
  }
  return { granted: true, reason: 'Accès autorisé' }
}

// ────────────────────────────────────────────────────────────────
// PORTE
// ────────────────────────────────────────────────────────────────

export type DoorId = 'main' | 'bathroom' | 'balcony' | 'closet' | 'safe_room' | 'service'

export type DoorSoundEffect = 'standard' | 'heavy' | 'squeaky' | 'electronic' | 'vault'

export interface DoorState {
  id: DoorId
  label: string
  isOpen: boolean
  isLocked: boolean
  isJammed: boolean
  requiredLevel: CardAccessLevel
  lastAccessTime: number
  accessDenied: boolean
  failedAttempts: number     // tentatives échouées
  alarmTriggered: boolean    // alarme déclenchée
  autoCloseDelay: number     // ms, 0 = pas de fermeture auto
  openAngle: number          // 0-90 degrés
  knockCount: number
  lastKnockTime: number
  soundEffect: DoorSoundEffect
  isEmergencyExit: boolean
  requiresPin: boolean       // nécessite un code PIN en plus
}

export function createDoorState(
  id: DoorId,
  label: string,
  requiredLevel: CardAccessLevel,
  opts: Partial<DoorState> = {}
): DoorState {
  return {
    id,
    label,
    isOpen: false,
    isLocked: false,
    isJammed: false,
    requiredLevel,
    lastAccessTime: 0,
    accessDenied: false,
    failedAttempts: 0,
    alarmTriggered: false,
    autoCloseDelay: 0,
    openAngle: 90,
    knockCount: 0,
    lastKnockTime: 0,
    soundEffect: 'standard',
    isEmergencyExit: false,
    requiresPin: false,
    ...opts,
  }
}

// ────────────────────────────────────────────────────────────────
// LUMIÈRES
// ────────────────────────────────────────────────────────────────

export type LightId =
  | 'ceiling'
  | 'desk'
  | 'bathroom'
  | 'ambient'
  | 'tv'
  | 'neon'
  | 'floor'
  | 'bedside'
  | 'balcony'
  | 'closet'
  | 'mirror'
  | 'entrance'

export type LightGroupId = 'main' | 'work' | 'sleep' | 'ambient' | 'bathroom' | 'decor'

export type LightScene =
  | 'day'
  | 'night'
  | 'cinema'
  | 'romance'
  | 'work'
  | 'sleep'
  | 'party'
  | 'relax'
  | 'morning'
  | 'energize'

export const LIGHT_SCENE_LABELS: Record<LightScene, { label: string; icon: string }> = {
  day:      { label: 'Journée',      icon: '☀️' },
  night:    { label: 'Nuit',         icon: '🌙' },
  cinema:   { label: 'Cinéma',       icon: '🎬' },
  romance:  { label: 'Romance',      icon: '🌹' },
  work:     { label: 'Travail',      icon: '💼' },
  sleep:    { label: 'Sommeil',      icon: '😴' },
  party:    { label: 'Fête',         icon: '🎉' },
  relax:    { label: 'Détente',      icon: '🛋️' },
  morning:  { label: 'Matin',        icon: '🌅' },
  energize: { label: 'Dynamique',    icon: '⚡' },
}

export interface LightState {
  id: LightId
  label: string
  isOn: boolean
  intensity: number          // 0-1
  color: string              // hex
  colorTemp: number          // Kelvins 2700-6500
  dimmable: boolean
  groupId?: LightGroupId
  flicker: boolean           // scintillement (bougie, etc.)
  motionSensor: boolean      // détection de mouvement
  schedule?: {               // allumage/extinction programmé
    onAt: number             // heure (0-23)
    offAt: number
  }
  lastChangedAt: number
}

export function createLightState(
  id: LightId,
  label: string,
  opts: Partial<LightState> = {}
): LightState {
  return {
    id,
    label,
    isOn: false,
    intensity: 0.7,
    color: '#fff5e6',
    colorTemp: 3000,
    dimmable: true,
    flicker: false,
    motionSensor: false,
    lastChangedAt: 0,
    ...opts,
  }
}

// Conversion température de couleur → hex approximatif
export function kelvinToHex(kelvin: number): string {
  const temp = Math.max(2700, Math.min(6500, kelvin))
  const warm = (6500 - temp) / 3800
  const r = 255
  const g = Math.round(210 + warm * 30)
  const b = Math.round(255 - warm * 200)
  const clamp = (v: number) => Math.max(0, Math.min(255, v))
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`
}

// ────────────────────────────────────────────────────────────────
// OBJETS INTERACTIFS
// ────────────────────────────────────────────────────────────────

export type InteractableType =
  | 'tv'
  | 'arcade'
  | 'drawer'
  | 'curtain'
  | 'fridge'
  | 'safe'
  | 'phone'
  | 'coffee'
  | 'radio'
  | 'thermostat'
  | 'blinds'
  | 'shower'
  | 'bathtub'
  | 'minibar'
  | 'mirror'
  | 'alarm_clock'
  | 'laptop'
  | 'speaker'
  | 'lamp'
  | 'door_bell'

export type InteractableAction =
  | 'toggle'
  | 'open'
  | 'close'
  | 'increase'
  | 'decrease'
  | 'unlock'
  | 'lock'
  | 'use'
  | 'inspect'
  | 'clean'
  | 'fill'

export interface InteractableState {
  id: string
  type: InteractableType
  label: string
  description?: string
  isActive: boolean
  value?: number | string     // valeur générique (volume, température, chaîne, etc.)
  isLocked: boolean
  lockCode?: string
  lastInteractionTime: number
  interactionCount: number
  durability?: number         // 0-100
  battery?: number            // 0-100
  temperature?: number        // °C (frigo, four, etc.)
  volume?: number             // 0-100
  channel?: number            // TV/Radio
  customData?: Record<string, unknown>
}

export function createInteractable(
  id: string,
  type: InteractableType,
  label: string,
  opts: Partial<InteractableState> = {}
): InteractableState {
  return {
    id,
    type,
    label,
    isActive: false,
    isLocked: false,
    lastInteractionTime: 0,
    interactionCount: 0,
    ...opts,
  }
}

// ────────────────────────────────────────────────────────────────
// CONFIGURATION DE LA CHAMBRE
// ────────────────────────────────────────────────────────────────

export type RoomType = 'studio' | 'standard' | 'deluxe' | 'suite' | 'penthouse' | 'junior_suite'

export type RoomView = 'city' | 'garden' | 'pool' | 'river' | 'courtyard' | 'mountain'

export type BedType = 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed'

export interface RoomAmenities {
  hasBalcony: boolean
  hasBathtub: boolean
  hasShower: boolean
  hasKitchenette: boolean
  hasMinibar: boolean
  hasSafe: boolean
  hasJacuzzi: boolean
  hasFireplace: boolean
  hasPrinter: boolean
  hasAirConditioning: boolean
  smokingAllowed: boolean
  petsAllowed: boolean
  wheelchairAccessible: boolean
}

export interface RoomConfig {
  roomNumber: string
  floor: number
  type: RoomType
  view: RoomView
  bedType: BedType
  maxOccupancy: number
  pricePerNight: number        // CAD
  squareMeters: number
  amenities: RoomAmenities
  checkInDate?: Date
  checkOutDate?: Date
  occupantName?: string
  specialRequests?: string
  cleaningStatus: 'clean' | 'needs_cleaning' | 'in_progress' | 'inspecting'
  doNotDisturb: boolean
  extraBlanketRequested: boolean
}

export function createRoomConfig(
  roomNumber: string,
  floor: number,
  type: RoomType = 'standard',
  opts: Partial<RoomConfig> = {}
): RoomConfig {
  const prices: Record<RoomType, number> = {
    studio: 120, standard: 160, deluxe: 220,
    junior_suite: 320, suite: 480, penthouse: 1200,
  }
  const sizes: Record<RoomType, number> = {
    studio: 25, standard: 32, deluxe: 45,
    junior_suite: 55, suite: 80, penthouse: 180,
  }

  return {
    roomNumber,
    floor,
    type,
    view: 'city',
    bedType: type === 'penthouse' || type === 'suite' ? 'king' : 'queen',
    maxOccupancy: type === 'penthouse' ? 6 : type === 'suite' ? 4 : 2,
    pricePerNight: prices[type],
    squareMeters: sizes[type],
    amenities: {
      hasBalcony: ['suite', 'penthouse', 'deluxe', 'junior_suite'].includes(type),
      hasBathtub: ['suite', 'penthouse', 'junior_suite'].includes(type),
      hasShower: true,
      hasKitchenette: ['studio', 'suite', 'penthouse'].includes(type),
      hasMinibar: true,
      hasSafe: true,
      hasJacuzzi: type === 'penthouse',
      hasFireplace: type === 'penthouse',
      hasPrinter: ['suite', 'penthouse'].includes(type),
      hasAirConditioning: true,
      smokingAllowed: false,
      petsAllowed: false,
      wheelchairAccessible: floor === 1,
    },
    cleaningStatus: 'clean',
    doNotDisturb: false,
    extraBlanketRequested: false,
    ...opts,
  }
}

// ────────────────────────────────────────────────────────────────
// TEMPS & ENVIRONNEMENT
// ────────────────────────────────────────────────────────────────

export type Weather = 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'hail' | 'blizzard' | 'cloudy'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type TimePhase = 'night' | 'deep_night' | 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening'

export const WEATHER_LABELS: Record<Weather, { label: string; icon: string }> = {
  clear:    { label: 'Dégagé',     icon: '☀️' },
  cloudy:   { label: 'Nuageux',    icon: '☁️' },
  rain:     { label: 'Pluie',      icon: '🌧️' },
  snow:     { label: 'Neige',      icon: '❄️' },
  fog:      { label: 'Brouillard', icon: '🌫️' },
  storm:    { label: 'Orage',      icon: '⛈️' },
  hail:     { label: 'Grêle',      icon: '🌨️' },
  blizzard: { label: 'Blizzard',   icon: '🌬️' },
}

export const SEASON_LABELS: Record<Season, { label: string; icon: string; tempRange: [number, number] }> = {
  spring:  { label: 'Printemps', icon: '🌸', tempRange: [2, 18] },
  summer:  { label: 'Été',       icon: '🌞', tempRange: [18, 32] },
  autumn:  { label: 'Automne',   icon: '🍂', tempRange: [-2, 16] },
  winter:  { label: 'Hiver',     icon: '🌨️', tempRange: [-25, 2] },
}

export const TIME_PHASES: Record<TimePhase, { label: string; icon: string; skyColor: string; hours: [number, number] }> = {
  deep_night: { label: 'Nuit profonde', icon: '🌑', skyColor: '#020508', hours: [0, 4] },
  night:      { label: 'Nuit',          icon: '🌙', skyColor: '#050a1a', hours: [22, 24] },
  dawn:       { label: 'Aube',          icon: '🌅', skyColor: '#3d1a0a', hours: [4, 6] },
  morning:    { label: 'Matin',         icon: '🌤️', skyColor: '#87ceeb', hours: [6, 12] },
  noon:       { label: 'Midi',          icon: '☀️', skyColor: '#5ba8d4', hours: [12, 14] },
  afternoon:  { label: 'Après-midi',   icon: '⛅', skyColor: '#76b8d4', hours: [14, 18] },
  dusk:       { label: 'Crépuscule',    icon: '🌆', skyColor: '#cc5533', hours: [18, 20] },
  evening:    { label: 'Soir',          icon: '🌃', skyColor: '#1a1040', hours: [20, 22] },
}

export function getTimePhase(hour: number): TimePhase {
  if (hour >= 0 && hour < 4)  return 'deep_night'
  if (hour >= 4 && hour < 6)  return 'dawn'
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 14) return 'noon'
  if (hour >= 14 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 20) return 'dusk'
  if (hour >= 20 && hour < 22) return 'evening'
  return 'night'
}

export function getSkyColor(phase: TimePhase): string {
  return TIME_PHASES[phase].skyColor
}

// ────────────────────────────────────────────────────────────────
// STATISTIQUES DE LA CHAMBRE
// ────────────────────────────────────────────────────────────────

export interface RoomStats {
  temperature: number       // °C
  targetTemperature: number
  humidity: number          // %
  noiseLevel: number        // dB
  co2Level: number          // ppm
  brightness: number        // lux
  powerUsage: number        // watts
  waterTemp: number         // °C (chauffe-eau)
  airQuality: 'excellent' | 'good' | 'moderate' | 'poor'
}

export function createDefaultRoomStats(): RoomStats {
  return {
    temperature: 20,
    targetTemperature: 22,
    humidity: 45,
    noiseLevel: 28,
    co2Level: 420,
    brightness: 350,
    powerUsage: 145,
    waterTemp: 55,
    airQuality: 'good',
  }
}

// ────────────────────────────────────────────────────────────────
// THERMOSTAT
// ────────────────────────────────────────────────────────────────

export type ThermostatMode = 'heat' | 'cool' | 'auto' | 'off' | 'fan_only'
export type FanSpeed = 'off' | 'low' | 'medium' | 'high' | 'auto'

export interface ThermostatScheduleEntry {
  hour: number
  minute: number
  targetTemp: number
  mode: ThermostatMode
}

export interface ThermostatState {
  isOn: boolean
  targetTemp: number         // 16-28°C
  currentTemp: number
  mode: ThermostatMode
  fanSpeed: FanSpeed
  schedule: ThermostatScheduleEntry[]
  ecoMode: boolean           // mode économie d'énergie
  sleepMode: boolean
  childLock: boolean
  filterLife: number         // 0-100% (vie du filtre)
}

export function createDefaultThermostat(): ThermostatState {
  return {
    isOn: true,
    targetTemp: 22,
    currentTemp: 20,
    mode: 'auto',
    fanSpeed: 'auto',
    schedule: [
      { hour: 7, minute: 0, targetTemp: 22, mode: 'auto' },
      { hour: 9, minute: 0, targetTemp: 20, mode: 'auto' },
      { hour: 18, minute: 0, targetTemp: 22, mode: 'auto' },
      { hour: 23, minute: 0, targetTemp: 19, mode: 'auto' },
    ],
    ecoMode: false,
    sleepMode: false,
    childLock: false,
    filterLife: 85,
  }
}

// ────────────────────────────────────────────────────────────────
// TÉLÉVISION
// ────────────────────────────────────────────────────────────────

export interface TVChannel {
  number: number
  name: string
  category: 'news' | 'sport' | 'entertainment' | 'movie' | 'kids' | 'music' | 'streaming' | 'local'
  language: string
  isHD: boolean
  is4K: boolean
}

export interface TVState {
  isOn: boolean
  channel: number
  volume: number             // 0-100
  isMuted: boolean
  brightness: number         // 0-100
  contrast: number
  subtitles: boolean
  subtitleLanguage: string
  channels: TVChannel[]
  hdmiInput: number | null   // 1-3, null = TV
  sleepTimer: number         // minutes, 0 = off
}

export const DEFAULT_TV_CHANNELS: TVChannel[] = [
  { number: 1, name: 'CBC Québec', category: 'local', language: 'fr', isHD: true, is4K: false },
  { number: 2, name: 'TVA', category: 'entertainment', language: 'fr', isHD: true, is4K: false },
  { number: 3, name: 'RDS', category: 'sport', language: 'fr', isHD: true, is4K: false },
  { number: 4, name: 'Canal D', category: 'entertainment', language: 'fr', isHD: false, is4K: false },
  { number: 5, name: 'LCN Infos', category: 'news', language: 'fr', isHD: true, is4K: false },
  { number: 6, name: 'Netflix', category: 'streaming', language: 'fr', isHD: true, is4K: true },
  { number: 7, name: 'Disney+', category: 'streaming', language: 'fr', isHD: true, is4K: true },
  { number: 8, name: 'EtherWorld TV', category: 'entertainment', language: 'fr', isHD: true, is4K: true },
  { number: 9, name: 'Météo Média', category: 'news', language: 'fr', isHD: false, is4K: false },
  { number: 10, name: 'MusiMax', category: 'music', language: 'fr', isHD: true, is4K: false },
]

export function createDefaultTVState(): TVState {
  return {
    isOn: false,
    channel: 1,
    volume: 40,
    isMuted: false,
    brightness: 80,
    contrast: 60,
    subtitles: false,
    subtitleLanguage: 'fr',
    channels: DEFAULT_TV_CHANNELS,
    hdmiInput: null,
    sleepTimer: 0,
  }
}

// ────────────────────────────────────────────────────────────────
// MINIBAR
// ────────────────────────────────────────────────────────────────

export type MinibarItemCategory = 'drink' | 'alcohol' | 'snack' | 'hot_drink' | 'water'

export interface MinibarItem {
  key: string
  name: string
  category: MinibarItemCategory
  icon: string
  price: number              // CAD
  initialStock: number
  currentStock: number
  consumed: number
  isRefrigerated: boolean
  calories?: number
  alcoholContent?: number    // % (0 si non-alcoolisé)
}

export const DEFAULT_MINIBAR: Record<string, MinibarItem> = {
  water_still:    { key: 'water_still',   name: 'Eau plate 500ml',    category: 'water',     icon: '💧', price: 4,  initialStock: 4, currentStock: 4, consumed: 0, isRefrigerated: true,  calories: 0 },
  water_sparkling: { key: 'water_sparkling', name: 'Eau pétillante 500ml', category: 'water', icon: '🫧', price: 5, initialStock: 2, currentStock: 2, consumed: 0, isRefrigerated: true, calories: 0 },
  beer_local:     { key: 'beer_local',    name: 'Bière Québec 355ml', category: 'alcohol',   icon: '🍺', price: 9,  initialStock: 3, currentStock: 3, consumed: 0, isRefrigerated: true,  calories: 145, alcoholContent: 5 },
  wine_red:       { key: 'wine_red',      name: 'Vin rouge 187ml',    category: 'alcohol',   icon: '🍷', price: 18, initialStock: 2, currentStock: 2, consumed: 0, isRefrigerated: false, calories: 160, alcoholContent: 13 },
  wine_white:     { key: 'wine_white',    name: 'Vin blanc 187ml',    category: 'alcohol',   icon: '🥂', price: 18, initialStock: 1, currentStock: 1, consumed: 0, isRefrigerated: true,  calories: 125, alcoholContent: 12 },
  juice_orange:   { key: 'juice_orange',  name: 'Jus d\'orange 250ml', category: 'drink',   icon: '🍊', price: 6,  initialStock: 2, currentStock: 2, consumed: 0, isRefrigerated: true,  calories: 110 },
  soda_cola:      { key: 'soda_cola',     name: 'Cola 355ml',          category: 'drink',    icon: '🥤', price: 5,  initialStock: 3, currentStock: 3, consumed: 0, isRefrigerated: true,  calories: 140 },
  coffee_pod:     { key: 'coffee_pod',    name: 'Capsule café',        category: 'hot_drink', icon: '☕', price: 4, initialStock: 6, currentStock: 6, consumed: 0, isRefrigerated: false, calories: 2 },
  tea_assorted:   { key: 'tea_assorted',  name: 'Thé assorti',         category: 'hot_drink', icon: '🍵', price: 3, initialStock: 6, currentStock: 6, consumed: 0, isRefrigerated: false, calories: 0 },
  chips:          { key: 'chips',         name: 'Chips BBQ 40g',       category: 'snack',     icon: '🍟', price: 5, initialStock: 2, currentStock: 2, consumed: 0, isRefrigerated: false, calories: 200 },
  chocolate:      { key: 'chocolate',     name: 'Chocolat noir 50g',   category: 'snack',     icon: '🍫', price: 6, initialStock: 3, currentStock: 3, consumed: 0, isRefrigerated: false, calories: 270 },
  nuts:           { key: 'nuts',          name: 'Noix de cajou 40g',   category: 'snack',     icon: '🥜', price: 7, initialStock: 2, currentStock: 2, consumed: 0, isRefrigerated: false, calories: 220 },
  granola_bar:    { key: 'granola_bar',   name: 'Barre granola',       category: 'snack',     icon: '🍪', price: 4, initialStock: 3, currentStock: 3, consumed: 0, isRefrigerated: false, calories: 190 },
}

export function getMinibarTotal(minibar: Record<string, MinibarItem>): number {
  return Object.values(minibar).reduce((sum, item) => sum + item.consumed * item.price, 0)
}

// ────────────────────────────────────────────────────────────────
// ROOM SERVICE
// ────────────────────────────────────────────────────────────────

export type ServiceType =
  | 'cleaning'
  | 'turndown'
  | 'towels'
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'minibar_restock'
  | 'laundry'
  | 'taxi'
  | 'wake_up_call'
  | 'maintenance'
  | 'extra_pillows'
  | 'baby_cot'
  | 'iron'
  | 'spa'

export type ServiceStatus = 'pending' | 'confirmed' | 'en_route' | 'delivered' | 'cancelled'

export const SERVICE_CONFIG: Record<ServiceType, {
  label: string
  icon: string
  estimatedMinutes: number
  cost: number
  requiresApproval: boolean
}> = {
  cleaning:        { label: 'Nettoyage',             icon: '🧹', estimatedMinutes: 30,  cost: 0,   requiresApproval: false },
  turndown:        { label: 'Service couverture',    icon: '🛏️', estimatedMinutes: 15,  cost: 0,   requiresApproval: false },
  towels:          { label: 'Serviettes',             icon: '🛁', estimatedMinutes: 10,  cost: 0,   requiresApproval: false },
  breakfast:       { label: 'Petit-déjeuner',         icon: '🥐', estimatedMinutes: 25,  cost: 28,  requiresApproval: false },
  lunch:           { label: 'Déjeuner',               icon: '🥗', estimatedMinutes: 30,  cost: 38,  requiresApproval: false },
  dinner:          { label: 'Dîner',                  icon: '🍽️', estimatedMinutes: 40,  cost: 55,  requiresApproval: false },
  minibar_restock: { label: 'Réapprovisionnement',    icon: '🍾', estimatedMinutes: 8,   cost: 0,   requiresApproval: false },
  laundry:         { label: 'Blanchisserie',           icon: '👔', estimatedMinutes: 120, cost: 45,  requiresApproval: false },
  taxi:            { label: 'Taxi',                   icon: '🚕', estimatedMinutes: 8,   cost: 15,  requiresApproval: false },
  wake_up_call:    { label: 'Réveil',                 icon: '⏰', estimatedMinutes: 0,   cost: 0,   requiresApproval: false },
  maintenance:     { label: 'Maintenance',            icon: '🔧', estimatedMinutes: 45,  cost: 0,   requiresApproval: true  },
  extra_pillows:   { label: 'Oreillers supplémentaires', icon: '🛏️', estimatedMinutes: 10, cost: 0, requiresApproval: false },
  baby_cot:        { label: 'Lit bébé',               icon: '👶', estimatedMinutes: 20,  cost: 25,  requiresApproval: true  },
  iron:            { label: 'Fer à repasser',         icon: '👕', estimatedMinutes: 10,  cost: 0,   requiresApproval: false },
  spa:             { label: 'Soins spa',              icon: '💆', estimatedMinutes: 60,  cost: 120, requiresApproval: true  },
}

export interface ServiceRequest {
  id: string
  type: ServiceType
  status: ServiceStatus
  requestTime: number
  estimatedArrival: number   // timestamp
  deliveredAt?: number
  notes?: string
  cost: number
  guestName?: string
  roomNumber?: string
}

export function createServiceRequest(type: ServiceType, opts: Partial<ServiceRequest> = {}): ServiceRequest {
  const config = SERVICE_CONFIG[type]
  return {
    id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    status: 'pending',
    requestTime: Date.now(),
    estimatedArrival: Date.now() + config.estimatedMinutes * 60000,
    cost: config.cost,
    ...opts,
  }
}

// ────────────────────────────────────────────────────────────────
// SÉCURITÉ / LOGS
// ────────────────────────────────────────────────────────────────

export type SecurityEventType =
  | 'access_granted'
  | 'access_denied'
  | 'door_opened'
  | 'door_closed'
  | 'door_locked'
  | 'door_unlocked'
  | 'door_knocked'
  | 'door_jammed'
  | 'alarm_triggered'
  | 'alarm_silenced'
  | 'card_changed'
  | 'card_lost'
  | 'card_replaced'
  | 'light_on'
  | 'light_off'
  | 'scene_applied'
  | 'service_requested'
  | 'minibar_consumed'
  | 'safe_accessed'
  | 'system_reset'

export const SECURITY_EVENT_SEVERITY: Record<SecurityEventType, 'info' | 'warning' | 'critical'> = {
  access_granted:   'info',
  access_denied:    'warning',
  door_opened:      'info',
  door_closed:      'info',
  door_locked:      'info',
  door_unlocked:    'info',
  door_knocked:     'info',
  door_jammed:      'warning',
  alarm_triggered:  'critical',
  alarm_silenced:   'warning',
  card_changed:     'info',
  card_lost:        'critical',
  card_replaced:    'info',
  light_on:         'info',
  light_off:        'info',
  scene_applied:    'info',
  service_requested: 'info',
  minibar_consumed: 'info',
  safe_accessed:    'warning',
  system_reset:     'warning',
}

export interface SecurityLog {
  id: string
  timestamp: number
  event: SecurityEventType
  severity: 'info' | 'warning' | 'critical'
  doorId?: DoorId
  lightId?: LightId
  cardLevel?: CardAccessLevel
  details: string
  actorName?: string
  ipAddress?: string
}

export function createSecurityLog(
  event: SecurityEventType,
  details: string,
  opts: Partial<SecurityLog> = {}
): SecurityLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    timestamp: Date.now(),
    event,
    severity: SECURITY_EVENT_SEVERITY[event],
    details,
    ...opts,
  }
}

// ────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'access' | 'system' | 'service'

export const NOTIFICATION_COLORS: Record<NotificationType, { bg: string; border: string; text: string }> = {
  success: { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.4)',   text: '#86efac' },
  error:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   text: '#fca5a5' },
  warning: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)',  text: '#fcd34d' },
  info:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.4)',  text: '#93c5fd' },
  access:  { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.4)', text: '#c4b5fd' },
  system:  { bg: 'rgba(107,114,128,0.12)',border: 'rgba(107,114,128,0.4)',text: '#d1d5db' },
  service: { bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.4)', text: '#99f6e4' },
}

export interface Notification {
  id: string
  message: string
  type: NotificationType
  timestamp: number
  duration: number           // ms, 0 = permanent
  read: boolean
  icon?: string
  actions?: Array<{ label: string; action: string }>
}

export function createNotification(
  message: string,
  type: NotificationType = 'info',
  opts: Partial<Notification> = {}
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    message,
    type,
    timestamp: Date.now(),
    duration: 4000,
    read: false,
    ...opts,
  }
}

// ────────────────────────────────────────────────────────────────
// VUES / NAVIGATION
// ────────────────────────────────────────────────────────────────

export type CurrentView = 'room' | 'corridor' | 'lobby' | 'city' | 'exterior' | 'parking' | 'rooftop'

export const VIEW_LABELS: Record<CurrentView, { label: string; icon: string }> = {
  room:     { label: 'Chambre',    icon: '🛏️' },
  corridor: { label: 'Corridor',   icon: '🚪' },
  lobby:    { label: 'Lobby',      icon: '🏨' },
  city:     { label: 'Ville',      icon: '🏙️' },
  exterior: { label: 'Extérieur',  icon: '🌆' },
  parking:  { label: 'Parking',    icon: '🅿️' },
  rooftop:  { label: 'Toiture',    icon: '🏙️' },
}

// ────────────────────────────────────────────────────────────────
// EXPORTS DE COMPATIBILITÉ (inchangés)
// ────────────────────────────────────────────────────────────────

// Réexport pour compatibilité avec le code existant
export type { KeyCard as IKeyCard }