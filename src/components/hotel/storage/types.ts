/**
 * types.ts — Types du système hôtel
 */

// ─────────────────────────────────────────────
// CHAMBRES
// ─────────────────────────────────────────────

export type RoomType =
  | 'standard_single'    // 1 lit simple — 89$/nuit
  | 'standard_double'    // 1 lit double — 109$/nuit
  | 'double_double'      // 2 lits doubles — 129$/nuit
  | 'queen'              // lit queen — 149$/nuit
  | 'king'               // lit king — 179$/nuit
  | 'junior_suite'       // suite junior — 229$/nuit
  | 'suite'              // suite — 329$/nuit
  | 'penthouse'          // penthouse — 599$/nuit

export type RoomStatus =
  | 'available'          // disponible
  | 'occupied'           // occupée
  | 'cleaning'           // en nettoyage
  | 'maintenance'        // en réparation
  | 'reserved'           // réservée (pas encore check-in)
  | 'do_not_disturb'     // Ne pas déranger

export type RoomFloor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface RoomAmenity {
  id:     string
  nameFr: string
  icon:   string
}

export const ROOM_AMENITIES: Record<string, RoomAmenity> = {
  wifi:        { id: 'wifi',        nameFr: 'WiFi gratuit',         icon: '📶' },
  tv:          { id: 'tv',          nameFr: 'Télévision HD',        icon: '📺' },
  minibar:     { id: 'minibar',     nameFr: 'Mini-bar',             icon: '🍷' },
  safe:        { id: 'safe',        nameFr: 'Coffre-fort',          icon: '🔒' },
  bathtub:     { id: 'bathtub',     nameFr: 'Bain sur pattes',      icon: '🛁' },
  jacuzzi:     { id: 'jacuzzi',     nameFr: 'Bain à remous',        icon: '♨️' },
  balcony:     { id: 'balcony',     nameFr: 'Balcon',               icon: '🏙️' },
  river_view:  { id: 'river_view',  nameFr: 'Vue sur le fleuve',    icon: '🌊' },
  city_view:   { id: 'city_view',   nameFr: 'Vue sur la ville',     icon: '🏙️' },
  kitchen:     { id: 'kitchen',     nameFr: 'Cuisine',              icon: '🍳' },
  sofa:        { id: 'sofa',        nameFr: 'Salon séparé',         icon: '🛋️' },
  breakfast:   { id: 'breakfast',   nameFr: 'Déjeuner inclus',      icon: '🍳' },
}

export interface HotelRoom {
  id:          string          // ex: '301', '502'
  number:      string
  floor:       RoomFloor
  type:        RoomType
  status:      RoomStatus
  pricePerNight: number
  amenities:   string[]        // keys de ROOM_AMENITIES
  maxOccupancy: number
  position:    [number, number, number]  // position 3D dans le bâtiment
  isSmokingRoom: boolean
  isAccessible:  boolean       // PMR accessible
  lastCleaned:  number | null  // timestamp
  notes?:      string
}

// ─────────────────────────────────────────────
// RÉSERVATIONS
// ─────────────────────────────────────────────

export type ReservationStatus =
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'no_show'

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'

export interface GuestInfo {
  firstName:  string
  lastName:   string
  email?:     string
  phone?:     string
  idType?:    'passport' | 'drivers_license' | 'provincial_id'
  idNumber?:  string
}

export interface Reservation {
  id:            string
  confirmationNo: string         // ex: 'HTL-2025-04821'
  guestInfo:     GuestInfo
  roomId:        string
  roomType:      RoomType
  checkIn:       number          // timestamp minuit
  checkOut:      number          // timestamp minuit
  nights:        number
  adults:        number
  children:      number
  ratePerNight:  number
  subtotal:      number
  taxesTotal:    number          // TPS + TVQ + taxe hébergement 3.5%
  total:         number
  deposit:       number          // montant déjà payé
  balance:       number          // reste à payer
  paymentStatus: PaymentStatus
  status:        ReservationStatus
  keyCardCode:   string          // code pour SecurityDoor
  specialRequests?: string
  createdAt:     number
  checkedInAt?:  number
  checkedOutAt?: number
  roomServiceOrders: RoomServiceOrder[]
  extras:        Extra[]
}

// ─────────────────────────────────────────────
// EXTRAS & ROOM SERVICE
// ─────────────────────────────────────────────

export type ExtraType =
  | 'parking'          // 15$/nuit
  | 'breakfast'        // 18$/personne
  | 'late_checkout'    // 35$
  | 'early_checkin'    // 35$
  | 'extra_bed'        // 25$/nuit
  | 'pet_fee'          // 40$/nuit
  | 'airport_shuttle'  // 45$/trajet

export interface Extra {
  type:   ExtraType
  price:  number
  qty:    number
  total:  number
}

export type RoomServiceCategory = 'food' | 'beverages' | 'amenities' | 'laundry'

export interface RoomServiceItem {
  id:       string
  nameFr:   string
  category: RoomServiceCategory
  price:    number
  prepTime: number   // minutes
}

export interface RoomServiceOrder {
  id:          string
  items:       Array<{ item: RoomServiceItem; qty: number }>
  total:       number
  orderedAt:   number
  deliveredAt?: number
  status:      'pending' | 'preparing' | 'delivered' | 'cancelled'
  notes?:      string
}

// ─────────────────────────────────────────────
// EMPLOYÉS HÔTEL
// ─────────────────────────────────────────────

export type HotelStaffRole =
  | 'receptionist'
  | 'concierge'
  | 'bellhop'
  | 'housekeeper'
  | 'security'
  | 'chef'
  | 'waiter'
  | 'pool_attendant'
  | 'manager'

export interface HotelStaff {
  id:         string
  name:       string
  role:       HotelStaffRole
  hourlyRate: number
  floor?:     RoomFloor        // pour housekeeping
  onDuty:     boolean
  position:   [number, number, number]
}

// ─────────────────────────────────────────────
// TAXES HÉBERGEMENT QUÉBEC
// ─────────────────────────────────────────────

export const HOTEL_TAX_RATES = {
  tps:         0.05,      // Taxe fédérale
  tvq:         0.09975,   // Taxe provinciale QC
  lodging:     0.035,     // Taxe spécifique hébergement QC
} as const

export function calculateHotelTaxes(subtotal: number) {
  const tps     = Math.round(subtotal * HOTEL_TAX_RATES.tps * 100) / 100
  const tvq     = Math.round(subtotal * HOTEL_TAX_RATES.tvq * 100) / 100
  const lodging = Math.round(subtotal * HOTEL_TAX_RATES.lodging * 100) / 100
  const total   = Math.round((subtotal + tps + tvq + lodging) * 100) / 100
  return { tps, tvq, lodging, total }
}

// ─────────────────────────────────────────────
// PRIX PAR TYPE
// ─────────────────────────────────────────────

export const ROOM_PRICES: Record<RoomType, number> = {
  standard_single: 89,
  standard_double: 109,
  double_double:   129,
  queen:           149,
  king:            179,
  junior_suite:    229,
  suite:           329,
  penthouse:       599,
}

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  standard_single: 'Chambre Standard Simple',
  standard_double: 'Chambre Standard Double',
  double_double:   'Chambre Deux Doubles',
  queen:           'Chambre Queen',
  king:            'Chambre King',
  junior_suite:    'Suite Junior',
  suite:           'Suite Deluxe',
  penthouse:       'Penthouse',
}

// ─────────────────────────────────────────────
// PISCINE / SPA
// ─────────────────────────────────────────────

export type PoolZone = 'main_pool' | 'jacuzzi' | 'sauna' | 'steam_room' | 'fitness'

export interface PoolReservation {
  id:          string
  guestId:     string
  zone:        PoolZone
  date:        string    // YYYY-MM-DD
  timeSlot:    string    // 'HH:mm'
  duration:    number    // minutes
  partySize:   number
}

// ─────────────────────────────────────────────
// RESTAURANT
// ─────────────────────────────────────────────

export interface RestaurantTable {
  id:       string
  number:   number
  seats:    number
  zone:     'window' | 'center' | 'bar' | 'terrace'
  status:   'available' | 'occupied' | 'reserved'
  position: [number, number, number]
}

export interface MenuItem {
  id:       string
  nameFr:   string
  category: 'entree' | 'plat' | 'dessert' | 'boisson' | 'petit_dejeuner'
  price:    number
  description: string
  isVegetarian: boolean
  allergens: string[]
}

// ─────────────────────────────────────────────
// PARKING
// ─────────────────────────────────────────────

export type ParkingSpotType = 'standard' | 'compact' | 'accessible' | 'electric' | 'valet'

export interface ParkingSpot {
  id:        string
  number:    string       // ex: 'B-12'
  type:      ParkingSpotType
  level:     'B1' | 'B2'
  occupied:  boolean
  guestId?:  string
  licensePlate?: string
  enteredAt?: number
  pricePerNight: number
}

// ─────────────────────────────────────────────
// ÉTAT GLOBAL HÔTEL
// ─────────────────────────────────────────────

export interface HotelStats {
  occupancyRate:    number      // %
  totalRevenue:     number
  todayCheckIns:    number
  todayCheckOuts:   number
  avgRating:        number
  totalRooms:       number
  availableRooms:   number
}