/**
 * roomStore.ts — État et gestion des chambres
 */

import { create } from 'zustand'
import { subscribeWithSelector, persist } from 'zustand/middleware'
import type {
  HotelRoom,
  RoomType,
  RoomStatus,
  RoomFloor,
} from './types'
import { ROOM_PRICES } from './types'

// ─────────────────────────────────────────────
// GÉNÉRATION DES CHAMBRES
// ─────────────────────────────────────────────

function generateRooms(): HotelRoom[] {
  const rooms: HotelRoom[] = []

  // Structure: 8 étages, 10 chambres par étage (sauf penthouse)
  const floorLayouts: Record<RoomFloor, RoomType[]> = {
    1: [], // Lobby — pas de chambres
    2: ['standard_single', 'standard_single', 'standard_double', 'standard_double', 'queen', 'queen', 'standard_single', 'standard_double', 'queen', 'double_double'],
    3: ['standard_single', 'standard_double', 'queen', 'queen', 'king', 'king', 'standard_double', 'double_double', 'queen', 'king'],
    4: ['queen', 'queen', 'king', 'king', 'junior_suite', 'king', 'queen', 'king', 'junior_suite', 'king'],
    5: ['king', 'king', 'junior_suite', 'junior_suite', 'suite', 'king', 'junior_suite', 'suite', 'king', 'junior_suite'],
    6: ['junior_suite', 'suite', 'suite', 'junior_suite', 'suite', 'junior_suite', 'suite', 'suite', 'junior_suite', 'suite'],
    7: ['suite', 'suite', 'suite', 'suite', 'suite', 'suite', 'suite', 'suite', 'suite', 'suite'],
    8: ['penthouse', 'penthouse'], // 2 penthouses au dernier étage
  }

  const amenitiesByType: Record<RoomType, string[]> = {
    standard_single:  ['wifi', 'tv'],
    standard_double:  ['wifi', 'tv', 'safe'],
    double_double:    ['wifi', 'tv', 'safe'],
    queen:            ['wifi', 'tv', 'safe', 'minibar'],
    king:             ['wifi', 'tv', 'safe', 'minibar', 'bathtub'],
    junior_suite:     ['wifi', 'tv', 'safe', 'minibar', 'bathtub', 'balcony', 'city_view'],
    suite:            ['wifi', 'tv', 'safe', 'minibar', 'bathtub', 'jacuzzi', 'balcony', 'river_view', 'sofa', 'kitchen'],
    penthouse:        ['wifi', 'tv', 'safe', 'minibar', 'bathtub', 'jacuzzi', 'balcony', 'river_view', 'sofa', 'kitchen', 'breakfast'],
  }

  const maxOccupancy: Record<RoomType, number> = {
    standard_single: 1,
    standard_double: 2,
    double_double:   4,
    queen:           2,
    king:            2,
    junior_suite:    3,
    suite:           4,
    penthouse:       6,
  }

  ;([2, 3, 4, 5, 6, 7, 8] as RoomFloor[]).forEach((floor) => {
    const layout = floorLayouts[floor]
    layout.forEach((type, i) => {
      const roomNum = `${floor}${String(i + 1).padStart(2, '0')}`
      rooms.push({
        id:            roomNum,
        number:        roomNum,
        floor,
        type,
        status:        'available',
        pricePerNight: ROOM_PRICES[type],
        amenities:     amenitiesByType[type],
        maxOccupancy:  maxOccupancy[type],
        position:      [-20 + i * 4.5, (floor - 1) * 3.5, -8],
        isSmokingRoom: false,
        isAccessible:  i === 0, // première chambre de chaque étage
        lastCleaned:   null,
        notes:         undefined,
      })
    })
  })

  return rooms
}

// ─────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────

interface RoomStore {
  rooms:           HotelRoom[]
  selectedRoomId:  string | null

  // ── Getters ──
  getRoom:              (id: string) => HotelRoom | undefined
  getByFloor:           (floor: RoomFloor) => HotelRoom[]
  getByType:            (type: RoomType) => HotelRoom[]
  getAvailable:         (type?: RoomType) => HotelRoom[]
  getByStatus:          (status: RoomStatus) => HotelRoom[]

  // ── Mutations ──
  setRoomStatus:        (id: string, status: RoomStatus) => void
  assignGuest:          (roomId: string, guestName: string) => void
  markCleaned:          (id: string) => void
  setNotes:             (id: string, notes: string) => void
  selectRoom:           (id: string | null) => void

  // ── Stats ──
  getOccupancyRate:     () => number
  getRevenueCapacity:   () => number
  getTotalByStatus:     () => Record<RoomStatus, number>
}

// ─────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────

export const useRoomStore = create<RoomStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        rooms:          generateRooms(),
        selectedRoomId: null,

        // ── Getters ──
        getRoom: (id) => get().rooms.find(r => r.id === id),

        getByFloor: (floor) => get().rooms.filter(r => r.floor === floor),

        getByType: (type) => get().rooms.filter(r => r.type === type),

        getAvailable: (type) =>
          get().rooms.filter(r =>
            r.status === 'available' && (!type || r.type === type)
          ),

        getByStatus: (status) => get().rooms.filter(r => r.status === status),

        // ── Mutations ──
        setRoomStatus: (id, status) => {
          set(s => ({
            rooms: s.rooms.map(r => r.id === id ? { ...r, status } : r),
          }))
        },

        assignGuest: (roomId, guestName) => {
          set(s => ({
            rooms: s.rooms.map(r =>
              r.id === roomId
                ? { ...r, status: 'occupied', notes: `Occupée par: ${guestName}` }
                : r
            ),
          }))
        },

        markCleaned: (id) => {
          set(s => ({
            rooms: s.rooms.map(r =>
              r.id === id
                ? { ...r, lastCleaned: Date.now(), status: 'available' }
                : r
            ),
          }))
        },

        setNotes: (id, notes) => {
          set(s => ({
            rooms: s.rooms.map(r => r.id === id ? { ...r, notes } : r),
          }))
        },

        selectRoom: (id) => set({ selectedRoomId: id }),

        // ── Stats ──
        getOccupancyRate: () => {
          const { rooms } = get()
          const occupied = rooms.filter(r => r.status === 'occupied').length
          return rooms.length > 0
            ? Math.round((occupied / rooms.length) * 100)
            : 0
        },

        getRevenueCapacity: () =>
          get().rooms.reduce((s, r) => s + r.pricePerNight, 0),

        getTotalByStatus: () => {
          const counts: Record<RoomStatus, number> = {
            available: 0, occupied: 0, cleaning: 0,
            maintenance: 0, reserved: 0, do_not_disturb: 0,
          }
          get().rooms.forEach(r => counts[r.status]++)
          return counts
        },
      }),
      {
        name:       'hotel-rooms',
        version:    1,
        partialize: (s) => ({ rooms: s.rooms }),
      }
    )
  )
)