import { create } from 'zustand'
import type { Reservation, RoomServiceItem, RoomType } from './types'
import { ROOM_PRICES, calculateHotelTaxes } from './types'

export const ROOM_SERVICE_MENU: RoomServiceItem[] = [
  { id: 'club-sandwich', nameFr: 'Club sandwich', category: 'food', price: 18, prepTime: 15 },
  { id: 'coffee', nameFr: 'Café', category: 'beverages', price: 4, prepTime: 5 },
]

interface ReservationStore {
  reservations: Reservation[]
  getTodayCheckIns: () => Reservation[]
  getTodayCheckOuts: () => Reservation[]
  getByRoom: (roomId: string) => Reservation[]
  createReservation: (data: Partial<Reservation>) => Reservation
  checkIn: (reservationId: string) => void
  checkOut: (reservationId: string) => void
  cancel: (reservationId: string) => void
}

const today = () => new Date().setHours(0, 0, 0, 0)
const makeReservation = (data: Partial<Reservation> = {}): Reservation => {
  const roomType = data.roomType ?? 'queen'
  const nights = data.nights ?? 1
  const subtotal = (data.ratePerNight ?? ROOM_PRICES[roomType]) * nights
  const taxes = calculateHotelTaxes(subtotal)
  return {
    id: data.id ?? `res-${Date.now()}`,
    confirmationNo: data.confirmationNo ?? `HTL-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999)}`,
    guestInfo: data.guestInfo ?? { firstName: 'Invité', lastName: 'EtherWorld' },
    roomId: data.roomId ?? '201',
    roomType,
    checkIn: data.checkIn ?? today(),
    checkOut: data.checkOut ?? today() + 86400000,
    nights,
    adults: data.adults ?? 1,
    children: data.children ?? 0,
    ratePerNight: data.ratePerNight ?? ROOM_PRICES[roomType],
    subtotal,
    taxesTotal: taxes.total - subtotal,
    total: taxes.total,
    deposit: data.deposit ?? 0,
    balance: data.balance ?? taxes.total,
    paymentStatus: data.paymentStatus ?? 'pending',
    status: data.status ?? 'confirmed',
    keyCardCode: data.keyCardCode ?? Math.random().toString(36).slice(2, 8).toUpperCase(),
    specialRequests: data.specialRequests,
    createdAt: data.createdAt ?? Date.now(),
    checkedInAt: data.checkedInAt,
    checkedOutAt: data.checkedOutAt,
    roomServiceOrders: data.roomServiceOrders ?? [],
    extras: data.extras ?? [],
  }
}

export const useReservationStore = create<ReservationStore>((set, get) => ({
  reservations: [makeReservation()],
  getTodayCheckIns: () => get().reservations.filter((r) => r.status === 'confirmed'),
  getTodayCheckOuts: () => get().reservations.filter((r) => r.status === 'checked_in'),
  getByRoom: (roomId) => get().reservations.filter((r) => r.roomId === roomId),
  createReservation: (data) => {
    const reservation = makeReservation(data)
    set((s) => ({ reservations: [...s.reservations, reservation] }))
    return reservation
  },
  checkIn: (reservationId) => set((s) => ({ reservations: s.reservations.map((r) => r.id === reservationId ? { ...r, status: 'checked_in', checkedInAt: Date.now() } : r) })),
  checkOut: (reservationId) => set((s) => ({ reservations: s.reservations.map((r) => r.id === reservationId ? { ...r, status: 'checked_out', checkedOutAt: Date.now(), balance: 0, paymentStatus: 'paid' } : r) })),
  cancel: (reservationId) => set((s) => ({ reservations: s.reservations.map((r) => r.id === reservationId ? { ...r, status: 'cancelled' } : r) })),
}))

export default useReservationStore
