/**
 * hotel/index.ts — Barrel export complet
 */

// ── Types ──
export type {
  RoomType,
  RoomStatus,
  RoomFloor,
  HotelRoom,
  RoomAmenity,
  Reservation,
  GuestInfo,
  ReservationStatus,
  PaymentStatus,
  Extra,
  ExtraType,
  RoomServiceItem,
  RoomServiceOrder,
  HotelStaff,
  HotelStaffRole,
  RestaurantTable,
  MenuItem,
  ParkingSpot,
  ParkingSpotType,
  PoolZone,
  HotelStats,
} from './storage/types'

export {
  ROOM_PRICES,
  ROOM_TYPE_LABELS,
  ROOM_AMENITIES,
  HOTEL_TAX_RATES,
  calculateHotelTaxes,
} from './storage/types'

// ── Storage ──
export { useRoomStore }         from './storage/roomStore'
export { useReservationStore, ROOM_SERVICE_MENU } from './storage/reservationStore'

// ── Systems (3D) ──
export { LobbySystem }     from './systems/LobbySystem'
export { ElevatorSystem }  from './systems/ElevatorSystem'
export { PoolSystem }      from './systems/PoolSystem'

// ── Existants ──
// HotelBuilding, BathroomFixtures, SecurityDoor, WindowWithCurtains
// → importés directement depuis leurs fichiers

// ── Jobs ──
export { useHousekeepingJob, HousekeepingJobUI } from './jobs/HousekeepingJob'

// ── UI ──
export { ReceptionUI } from './ui/ReceptionUI'