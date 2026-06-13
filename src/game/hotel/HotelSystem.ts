// src/game/hotel/HotelSystem.ts
// SYSTÈME HÔTELIER ULTRA-RÉALISTE

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as THREE from 'three';
import { useSecurityStore, type CardLevel } from '../systems/SecuritySystem';

// ═══════════════════════════════════════════════════════════════
//  TYPES — ENUMS
// ═══════════════════════════════════════════════════════════════

export type HotelName = 'HOTEL_ETHERWORLD';

export type RoomType =
  | 'standard'
  | 'deluxe'
  | 'suite'
  | 'executive'
  | 'penthouse'
  | 'presidential';

export type RoomStatus =
  | 'available'
  | 'sold'
  | 'rented'
  | 'maintenance'
  | 'locked';

export type InteriorStyle =
  | 'modern'
  | 'classic'
  | 'minimalist'
  | 'luxury'
  | 'industrial'
  | 'scandinavian'
  | 'gaming';

export type LockType = 'numpad' | 'card' | 'biometric' | 'key' | 'remote';

export type AccessAction = 'enter' | 'exit' | 'attempt' | 'knock' | 'doorbell';

export type RoomEvent =
  | 'purchased'
  | 'sold'
  | 'rented'
  | 'renovated'
  | 'burglarized'
  | 'visited';

export type StorageType = 'wardrobe' | 'safe' | 'fridge' | 'cabinet';

export type ItemType =
  | 'clothing'
  | 'weapon'
  | 'food'
  | 'document'
  | 'valuable'
  | 'other';

export type LightingType = 'warm' | 'cool' | 'neutral' | 'rgb';

export type AmenityType =
  | 'gym'
  | 'pool'
  | 'spa'
  | 'restaurant'
  | 'bar'
  | 'laundry'
  | 'parking';

export type StaffRole =
  | 'concierge'
  | 'security'
  | 'cleaner'
  | 'manager'
  | 'valet';

export type UpgradeType = 'security' | 'interior' | 'storage' | 'technology';

export type UpgradeVariant = 'wallpaper' | 'flooring' | 'lighting' | 'window' | 'ceiling';

// ═══════════════════════════════════════════════════════════════
//  TYPES — INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface HotelConfig {
  id: string;
  name: HotelName;
  location: THREE.Vector3;
  floors: Floor[];
  elevators: Elevator[];
  lobby: LobbyConfig;
  amenities: Amenity[];
  staff: StaffConfig[];
  policies: HotelPolicy[];
  stats: HotelStats;
}

export interface Floor {
  id: string;
  /** 0 = RDC (lobby), 1–4 = étages */
  level: number;
  name: string;
  rooms: HotelRoom[];
  corridorLength: number;
  corridorWidth: number;
  lighting: FloorLighting;
  securityLevel: number;
  /** Pour le culling — false = non rendu */
  isActive: boolean;
}

export interface HotelRoom {
  id: string;
  /** ex: "A-1-01" */
  number: string;
  floor: number;
  /** Position dans le couloir (0–4) */
  position: number;
  type: RoomType;
  status: RoomStatus;
  owner: string | null;
  price: number;
  rentPrice: number;
  size: RoomSize;
  door: DoorSystem;
  interior: RoomInterior;
  storage: StorageSystem;
  security: RoomSecuritySystem;
  history: RoomHistory[];
  upgrades: RoomUpgrade[];
}

export interface DoorSystem {
  id: string;
  isLocked: boolean;
  lockType: LockType;
  numpadCode: string;
  requiredCard: CardLevel;
  isAlarmArmed: boolean;
  alarmCode: string;
  lastAccessed: Date | null;
  accessLog: AccessLogEntry[];
  knockEnabled: boolean;
  peepholeEnabled: boolean;
  doorbellEnabled: boolean;
}

export interface AccessLogEntry {
  timestamp: Date;
  userId: string;
  action: AccessAction;
  success: boolean;
}

export interface RoomSize {
  width: number;
  depth: number;
  height: number;
  squareFootage: number;
}

export interface RoomInterior {
  style: InteriorStyle;
  furniture: PlacedFurniture[];
  customizations: Customization[];
  lighting: RoomLighting;
}

export interface RoomLighting {
  ceiling: boolean;
  lamps: number;
  led: boolean;
  intensity: number;
}

export interface PlacedFurniture {
  id: string;
  type: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  isInteractive: boolean;
  storage?: StorageContainer;
}

export interface StorageSystem {
  wardrobe: StorageContainer;
  safe: StorageContainer;
  fridge: StorageContainer;
  cabinets: StorageContainer[];
}

export interface StorageContainer {
  id: string;
  name: string;
  type: StorageType;
  capacity: number;
  items: StoredItem[];
  isLocked: boolean;
  lockCode?: string;
}

export interface StoredItem {
  id: string;
  name: string;
  type: ItemType;
  quantity: number;
  value: number;
  icon: string;
  description: string;
}

export interface RoomSecuritySystem {
  alarmArmed: boolean;
  alarmCode: string;
  cameras: SecurityCamera[];
  motionSensors: boolean;
  glassBreak: boolean;
  panicButton: boolean;
}

export interface SecurityCamera {
  id: string;
  position: THREE.Vector3;
  angle: number;
  isActive: boolean;
  recording: boolean;
}

export interface RoomHistory {
  date: Date;
  event: RoomEvent;
  details: string;
}

export interface RoomUpgrade {
  id: string;
  name: string;
  type: UpgradeType;
  level: number;
  price: number;
  installed: boolean;
}

export interface Elevator {
  id: string;
  currentFloor: number;
  targetFloor: number;
  isMoving: boolean;
  /** Secondes par étage */
  speed: number;
  capacity: number;
  requiresCard: boolean;
  cardLevel: CardLevel;
  interior: ElevatorInterior;
  /** Un bouton par étage */
  callButtons: boolean[];
}

export interface ElevatorInterior {
  music: boolean;
  mirror: boolean;
  flooring: string;
  lighting: string;
}

export interface LobbyConfig {
  reception: boolean;
  securityGuard: boolean;
  concierge: boolean;
  seating: number;
  decoration: string;
  music: string;
}

export interface Amenity {
  id: string;
  name: string;
  floor: number;
  type: AmenityType;
  requiresReservation: boolean;
  price: number;
  hours: { open: number; close: number };
}

export interface StaffConfig {
  id: string;
  name: string;
  role: StaffRole;
  shift: { start: number; end: number };
  salary: number;
}

export interface HotelPolicy {
  id: string;
  rule: string;
  penalty: number;
  enforced: boolean;
}

export interface HotelStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  monthlyRevenue: number;
  rating: number;
  complaints: number;
}

export interface FloorLighting {
  type: LightingType;
  intensity: number;
  motionSensor: boolean;
  emergencyLighting: boolean;
}

export interface Customization {
  id: string;
  type: UpgradeVariant;
  style: string;
  color: string;
  installed: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  TYPES — RÉSULTATS D'ACTIONS
// ═══════════════════════════════════════════════════════════════

export interface RobberyResult {
  success: boolean;
  message: string;
  loot?: StoredItem[];
  alarmTriggered?: boolean;
  policeNotified?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  amountSpent?: number;
}

export interface CorridorRoomSummary {
  id: string;
  number: string;
  status: RoomStatus;
  isLocked: boolean;
  hasOwner: boolean;
  lightOn: boolean;
}

export interface CorridorState {
  floor: number;
  rooms: CorridorRoomSummary[];
  lighting: FloorLighting;
}

// ═══════════════════════════════════════════════════════════════
//  TYPES — STORE
// ═══════════════════════════════════════════════════════════════

interface HotelState {
  hotel: HotelConfig | null;
  /** Floors actuellement chargés (chunk system) */
  loadedFloors: Set<number>;

  // ── Hôtel ──────────────────────────────────────────────────
  initializeHotel: () => void;
  loadFloor: (floor: number) => void;
  unloadFloor: (floor: number) => void;

  // ── Chambre ────────────────────────────────────────────────
  buyRoom: (roomId: string, playerId: string) => PurchaseResult;
  rentRoom: (roomId: string, playerId: string, months: number) => PurchaseResult;
  sellRoom: (roomId: string, playerId: string) => PurchaseResult;
  renovateRoom: (roomId: string, upgrade: RoomUpgrade) => boolean;

  // ── Porte ──────────────────────────────────────────────────
  lockDoor: (roomId: string, actorId: string) => void;
  unlockDoor: (roomId: string, actorId: string) => void;
  setNumpadCode: (roomId: string, code: string) => boolean;
  setCardAccess: (roomId: string, level: CardLevel) => void;
  armAlarm: (roomId: string) => void;
  disarmAlarm: (roomId: string, code: string) => boolean;
  knockOnDoor: (roomId: string, userId: string) => void;
  ringDoorbell: (roomId: string, userId: string) => void;

  // ── Stockage ───────────────────────────────────────────────
  storeItem: (roomId: string, containerId: string, item: StoredItem) => boolean;
  retrieveItem: (roomId: string, containerId: string, itemId: string) => StoredItem | null;
  lockContainer: (roomId: string, containerId: string, code: string) => void;
  unlockContainer: (roomId: string, containerId: string, code: string) => boolean;

  // ── Ascenseur ──────────────────────────────────────────────
  callElevator: (elevatorId: string, floor: number) => void;
  selectFloor: (elevatorId: string, floor: number) => void;

  // ── Criminalité ────────────────────────────────────────────
  attemptRobbery: (roomId: string, userId: string) => RobberyResult;

  // ── Utilitaires ────────────────────────────────────────────
  getRoomByNumber: (number: string) => HotelRoom | null;
  getRoomsOnFloor: (floor: number) => HotelRoom[];
  isRoomAccessible: (roomId: string, userId: string) => boolean;
  getCorridorState: (floor: number) => CorridorState;
}

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const HOTEL_ID = 'HOTEL_ETHERWORLD' as const;
const FLOORS_COUNT = 4;
const ROOMS_PER_FLOOR = 5;
const SELL_PRICE_RATIO = 0.9;
const RENT_PRICE_RATIO = 0.008;
const DEFAULT_ALARM_CODE = '9110';
const DEFAULT_SAFE_CODE = '6969';
const NUMPAD_CODE_LENGTH = 4;
const CORRIDOR_LENGTH = 25;
const CORRIDOR_WIDTH = 3;

const DEFAULT_FLOOR_LIGHTING: FloorLighting = {
  type: 'neutral',
  intensity: 0.7,
  motionSensor: false,
  emergencyLighting: false,
};

const ROOM_TYPES_BY_POSITION: Readonly<RoomType[]> = [
  'standard',
  'deluxe',
  'suite',
  'executive',
  'presidential',
];

// ═══════════════════════════════════════════════════════════════
//  PURE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getRoomPrice(type: RoomType): number {
  const prices: Record<RoomType, number> = {
    standard:     50_000,
    deluxe:      100_000,
    suite:       200_000,
    executive:   350_000,
    penthouse:   500_000,
    presidential: 1_000_000,
  };
  return prices[type];
}

function getRoomSize(type: RoomType): RoomSize {
  const sizes: Record<RoomType, RoomSize> = {
    standard:     { width: 4,  depth: 5,  height: 3,   squareFootage: 200  },
    deluxe:       { width: 5,  depth: 6,  height: 3,   squareFootage: 300  },
    suite:        { width: 6,  depth: 8,  height: 3.5, squareFootage: 480  },
    executive:    { width: 7,  depth: 9,  height: 3.5, squareFootage: 630  },
    penthouse:    { width: 10, depth: 12, height: 4,   squareFootage: 1200 },
    presidential: { width: 12, depth: 15, height: 4.5, squareFootage: 1800 },
  };
  return sizes[type];
}

function getFloorName(floor: number): string {
  const names: Record<number, string> = {
    1: 'Étage Standard',
    2: 'Étage Deluxe',
    3: 'Étage Suite',
    4: 'Étage Penthouse',
  };
  return names[floor] ?? `Étage ${floor}`;
}

/** Génère un code PIN numérique déterministe à partir d'un seed */
function generateDefaultCode(seed: number): string {
  // Déterministe — pas de Math.random() dans les builders
  const base = (seed * 7919 + 1234) % 9000;
  return String(1000 + base).padStart(NUMPAD_CODE_LENGTH, '0');
}

function validateNumpadCode(code: string): boolean {
  return /^\d{4,8}$/.test(code);
}

function makeAccessEntry(
  userId: string,
  action: AccessAction,
  success: boolean
): AccessLogEntry {
  return { timestamp: new Date(), userId, action, success };
}

function makeHistoryEntry(event: RoomEvent, details: string): RoomHistory {
  return { date: new Date(), event, details };
}

// ═══════════════════════════════════════════════════════════════
//  IMMUTABLE ROOM/HOTEL UPDATERS
// ═══════════════════════════════════════════════════════════════

function findRoom(hotel: HotelConfig, roomId: string): HotelRoom | null {
  for (const floor of hotel.floors) {
    const room = floor.rooms.find((r) => r.id === roomId);
    if (room) return room;
  }
  return null;
}

function findRoomByNumber(hotel: HotelConfig, number: string): HotelRoom | null {
  for (const floor of hotel.floors) {
    const room = floor.rooms.find((r) => r.number === number);
    if (room) return room;
  }
  return null;
}

function findContainer(
  storage: StorageSystem,
  containerId: string
): StorageContainer | null {
  if (storage.wardrobe.id === containerId) return storage.wardrobe;
  if (storage.safe.id === containerId) return storage.safe;
  if (storage.fridge.id === containerId) return storage.fridge;
  return storage.cabinets.find((c) => c.id === containerId) ?? null;
}

function updateRoom(
  hotel: HotelConfig,
  roomId: string,
  updates: Partial<HotelRoom>
): HotelConfig {
  return {
    ...hotel,
    floors: hotel.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) =>
        room.id === roomId ? { ...room, ...updates } : room
      ),
    })),
  };
}

function updateRoomContainer(
  hotel: HotelConfig,
  roomId: string,
  containerId: string,
  updates: Partial<StorageContainer>
): HotelConfig {
  return {
    ...hotel,
    floors: hotel.floors.map((floor) => ({
      ...floor,
      rooms: floor.rooms.map((room) => {
        if (room.id !== roomId) return room;

        const s = room.storage;
        const updatedStorage: StorageSystem = {
          wardrobe:  s.wardrobe.id === containerId  ? { ...s.wardrobe,  ...updates } : s.wardrobe,
          safe:      s.safe.id === containerId       ? { ...s.safe,      ...updates } : s.safe,
          fridge:    s.fridge.id === containerId     ? { ...s.fridge,    ...updates } : s.fridge,
          cabinets:  s.cabinets.map((c) =>
            c.id === containerId ? { ...c, ...updates } : c
          ),
        };

        return { ...room, storage: updatedStorage };
      }),
    })),
  };
}

function setFloorActive(
  hotel: HotelConfig,
  floorLevel: number,
  isActive: boolean
): HotelConfig {
  return {
    ...hotel,
    floors: hotel.floors.map((f) =>
      f.level === floorLevel ? { ...f, isActive } : f
    ),
  };
}

// ═══════════════════════════════════════════════════════════════
//  ROOM FACTORY
// ═══════════════════════════════════════════════════════════════

function createRoom(floor: number, position: number): HotelRoom {
  const num = String(position + 1).padStart(2, '0');
  const roomNumber = `A-${floor}-${num}`;
  const type: RoomType = ROOM_TYPES_BY_POSITION[Math.min(position, ROOM_TYPES_BY_POSITION.length - 1)];
  const price = getRoomPrice(type);

  return {
    id: `room_${roomNumber}`,
    number: roomNumber,
    floor,
    position,
    type,
    status: 'available',
    owner: null,
    price,
    rentPrice: Math.floor(price * RENT_PRICE_RATIO),
    size: getRoomSize(type),
    door: {
      id: `door_${roomNumber}`,
      isLocked: true,
      lockType: position < 3 ? 'numpad' : 'card',
      numpadCode: generateDefaultCode(floor * 100 + position),
      requiredCard: 'resident',
      isAlarmArmed: false,
      alarmCode: DEFAULT_ALARM_CODE,
      lastAccessed: null,
      accessLog: [],
      knockEnabled: true,
      peepholeEnabled: true,
      doorbellEnabled: true,
    },
    interior: {
      style: 'modern',
      furniture: [],
      customizations: [],
      lighting: {
        ceiling: true,
        lamps: 2,
        led: false,
        intensity: 0.8,
      },
    },
    storage: {
      wardrobe: {
        id: `wardrobe_${roomNumber}`,
        name: 'Garde-robe',
        type: 'wardrobe',
        capacity: 50,
        items: [],
        isLocked: false,
      },
      safe: {
        id: `safe_${roomNumber}`,
        name: 'Coffre-fort',
        type: 'safe',
        capacity: 20,
        items: [],
        isLocked: false,
        lockCode: DEFAULT_SAFE_CODE,
      },
      fridge: {
        id: `fridge_${roomNumber}`,
        name: 'Mini-frigo',
        type: 'fridge',
        capacity: 15,
        items: [],
        isLocked: false,
      },
      cabinets: [
        {
          id: `cabinet_${roomNumber}_1`,
          name: 'Armoire',
          type: 'cabinet',
          capacity: 30,
          items: [],
          isLocked: false,
        },
      ],
    },
    security: {
      alarmArmed: false,
      alarmCode: '4321',
      cameras: [],
      motionSensors: false,
      glassBreak: false,
      panicButton: false,
    },
    history: [],
    upgrades: [],
  };
}

function createFloor(level: number): Floor {
  const rooms = Array.from({ length: ROOMS_PER_FLOOR }, (_, i) =>
    createRoom(level, i)
  );

  return {
    id: `floor_${level}`,
    level,
    name: getFloorName(level),
    rooms,
    corridorLength: CORRIDOR_LENGTH,
    corridorWidth: CORRIDOR_WIDTH,
    lighting: {
      type: level % 2 === 0 ? 'warm' : 'neutral',
      intensity: 0.7,
      motionSensor: true,
      emergencyLighting: true,
    },
    securityLevel: level,
    isActive: false,
  };
}

// ═══════════════════════════════════════════════════════════════
//  HOTEL FACTORY
// ═══════════════════════════════════════════════════════════════

function createHotelConfig(): HotelConfig {
  const floors = Array.from({ length: FLOORS_COUNT }, (_, i) =>
    createFloor(i + 1)
  );

  const totalRooms = floors.reduce((sum, f) => sum + f.rooms.length, 0);

  return {
    id: HOTEL_ID,
    name: HOTEL_ID,
    location: new THREE.Vector3(0, 0, 0),
    floors,
    elevators: [
      {
        id: 'elevator_standard',
        currentFloor: 0,
        targetFloor: 0,
        isMoving: false,
        speed: 2,
        capacity: 8,
        requiresCard: true,
        cardLevel: 'resident',
        interior: {
          music: true,
          mirror: true,
          flooring: 'Marbre noir',
          lighting: 'LED RGB',
        },
        callButtons: Array.from({ length: FLOORS_COUNT + 1 }, () => true),
      },
      {
        id: 'elevator_vip',
        currentFloor: 0,
        targetFloor: 0,
        isMoving: false,
        speed: 1.5,
        capacity: 6,
        requiresCard: true,
        cardLevel: 'vip',
        interior: {
          music: true,
          mirror: true,
          flooring: 'Bois acajou',
          lighting: 'Cristal',
        },
        callButtons: Array.from({ length: FLOORS_COUNT + 1 }, () => true),
      },
    ],
    lobby: {
      reception: true,
      securityGuard: true,
      concierge: true,
      seating: 12,
      decoration: 'Art déco luxueux',
      music: 'Jazz lounge',
    },
    amenities: [
      {
        id: 'gym',
        name: 'Salle de sport',
        floor: 0,
        type: 'gym',
        requiresReservation: false,
        price: 0,
        hours: { open: 6, close: 23 },
      },
      {
        id: 'pool',
        name: 'Piscine intérieure',
        floor: 0,
        type: 'pool',
        requiresReservation: true,
        price: 10,
        hours: { open: 7, close: 22 },
      },
      {
        id: 'spa',
        name: 'Spa & Sauna',
        floor: 0,
        type: 'spa',
        requiresReservation: true,
        price: 50,
        hours: { open: 9, close: 21 },
      },
      {
        id: 'restaurant',
        name: 'Restaurant Le Luxe',
        floor: 0,
        type: 'restaurant',
        requiresReservation: true,
        price: 100,
        hours: { open: 7, close: 23 },
      },
      {
        id: 'bar',
        name: 'Bar Le Penthouse',
        floor: FLOORS_COUNT,
        type: 'bar',
        requiresReservation: false,
        price: 15,
        hours: { open: 17, close: 2 },
      },
      {
        id: 'laundry',
        name: 'Buanderie',
        floor: 1,
        type: 'laundry',
        requiresReservation: false,
        price: 5,
        hours: { open: 8, close: 22 },
      },
      {
        id: 'parking',
        name: 'Parking souterrain',
        floor: -1,
        type: 'parking',
        requiresReservation: false,
        price: 20,
        hours: { open: 0, close: 24 },
      },
    ],
    staff: [
      {
        id: 'concierge_1',
        name: 'Jean-Pierre',
        role: 'concierge',
        shift: { start: 7, end: 23 },
        salary: 25,
      },
      {
        id: 'security_1',
        name: 'Mike',
        role: 'security',
        shift: { start: 0, end: 24 },
        salary: 30,
      },
      {
        id: 'cleaner_1',
        name: 'Marie',
        role: 'cleaner',
        shift: { start: 8, end: 16 },
        salary: 20,
      },
      {
        id: 'manager_1',
        name: 'Élisabeth Tremblay',
        role: 'manager',
        shift: { start: 9, end: 18 },
        salary: 45,
      },
      {
        id: 'valet_1',
        name: 'Carlos',
        role: 'valet',
        shift: { start: 7, end: 23 },
        salary: 22,
      },
    ],
    policies: [
      {
        id: 'noise',
        rule: 'Pas de bruit après 22h',
        penalty: 500,
        enforced: true,
      },
      {
        id: 'smoking',
        rule: 'Non-fumeur — interdiction totale',
        penalty: 1000,
        enforced: true,
      },
      {
        id: 'pets',
        rule: 'Animaux acceptés avec dépôt de garantie',
        penalty: 300,
        enforced: true,
      },
      {
        id: 'visitors',
        rule: 'Visiteurs après 23h interdits sans approbation',
        penalty: 200,
        enforced: true,
      },
    ],
    stats: {
      totalRooms,
      occupiedRooms: 0,
      availableRooms: totalRooms,
      monthlyRevenue: 0,
      rating: 4.5,
      complaints: 0,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
//  STORE
// ═══════════════════════════════════════════════════════════════

export const useHotelStore = create<HotelState>()(
  persist(
    (set, get) => ({
      hotel: null,
      loadedFloors: new Set<number>(),

      // ── Initialisation ──────────────────────────────────────

      initializeHotel: () => {
        set({ hotel: createHotelConfig() });
      },

      // ── Chunk system ────────────────────────────────────────

      loadFloor: (floor) => {
        set((state) => ({
          loadedFloors: new Set([...state.loadedFloors, floor]),
          hotel: state.hotel ? setFloorActive(state.hotel, floor, true) : null,
        }));
      },

      unloadFloor: (floor) => {
        set((state) => {
          const next = new Set(state.loadedFloors);
          next.delete(floor);
          return {
            loadedFloors: next,
            hotel: state.hotel ? setFloorActive(state.hotel, floor, false) : null,
          };
        });
      },

      // ── Achat / location / vente ────────────────────────────

      buyRoom: (roomId, playerId) => {
        const { hotel } = get();
        if (!hotel) return { success: false, message: 'Hôtel non initialisé' };

        const room = findRoom(hotel, roomId);
        if (!room) return { success: false, message: 'Chambre introuvable' };
        if (room.status !== 'available') {
          return { success: false, message: 'Chambre non disponible' };
        }

        // NOTE: Brancher ici votre système économique réel
        // const economy = useEconomyStore.getState();
        // if (economy.getBalance() < room.price) { ... }

        set((state) => ({
          hotel: updateRoom(state.hotel!, roomId, {
            status: 'sold',
            owner: playerId,
            door: { ...room.door, isLocked: false },
            history: [
              ...room.history,
              makeHistoryEntry(
                'purchased',
                `Achetée par ${playerId} pour ${room.price.toLocaleString('fr-CA')}$`
              ),
            ],
          }),
        }));

        return {
          success: true,
          message: `Chambre ${room.number} achetée avec succès`,
          amountSpent: room.price,
        };
      },

      rentRoom: (roomId, playerId, months) => {
        const { hotel } = get();
        if (!hotel) return { success: false, message: 'Hôtel non initialisé' };

        const room = findRoom(hotel, roomId);
        if (!room) return { success: false, message: 'Chambre introuvable' };
        if (room.status !== 'available') {
          return { success: false, message: 'Chambre non disponible' };
        }
        if (months < 1 || months > 12) {
          return { success: false, message: 'Durée invalide (1–12 mois)' };
        }

        const totalRent = room.rentPrice * months;

        set((state) => ({
          hotel: updateRoom(state.hotel!, roomId, {
            status: 'rented',
            owner: playerId,
            door: { ...room.door, isLocked: false },
            history: [
              ...room.history,
              makeHistoryEntry(
                'rented',
                `Louée par ${playerId} pour ${months} mois à ${room.rentPrice.toLocaleString('fr-CA')}$/mois`
              ),
            ],
          }),
        }));

        return {
          success: true,
          message: `Chambre ${room.number} louée pour ${months} mois`,
          amountSpent: totalRent,
        };
      },

      sellRoom: (roomId, playerId) => {
        const { hotel } = get();
        if (!hotel) return { success: false, message: 'Hôtel non initialisé' };

        const room = findRoom(hotel, roomId);
        if (!room) return { success: false, message: 'Chambre introuvable' };
        if (room.owner !== playerId) {
          return { success: false, message: "Vous n'êtes pas propriétaire de cette chambre" };
        }

        const sellPrice = Math.floor(room.price * SELL_PRICE_RATIO);

        set((state) => ({
          hotel: updateRoom(state.hotel!, roomId, {
            status: 'available',
            owner: null,
            door: { ...room.door, isLocked: true },
            storage: {
              wardrobe:  { ...room.storage.wardrobe,  items: [] },
              safe:      { ...room.storage.safe,      items: [] },
              fridge:    { ...room.storage.fridge,    items: [] },
              cabinets:  room.storage.cabinets.map((c) => ({ ...c, items: [] })),
            },
            history: [
              ...room.history,
              makeHistoryEntry(
                'sold',
                `Revendue par ${playerId} pour ${sellPrice.toLocaleString('fr-CA')}$`
              ),
            ],
          }),
        }));

        return {
          success: true,
          message: `Chambre ${room.number} vendue pour ${sellPrice.toLocaleString('fr-CA')}$`,
          amountSpent: -sellPrice, // négatif = gain
        };
      },

      renovateRoom: (roomId, upgrade) => {
        const { hotel } = get();
        if (!hotel) return false;

        const room = findRoom(hotel, roomId);
        if (!room) return false;

        const alreadyInstalled = room.upgrades.some((u) => u.id === upgrade.id);
        if (alreadyInstalled) return false;

        set((state) => ({
          hotel: updateRoom(state.hotel!, roomId, {
            upgrades: [...room.upgrades, { ...upgrade, installed: true }],
            history: [
              ...room.history,
              makeHistoryEntry('renovated', `Amélioration installée: ${upgrade.name}`),
            ],
          }),
        }));

        return true;
      },

      // ── Porte ───────────────────────────────────────────────

      lockDoor: (roomId, actorId) => {
        set((state) => {
          const room = findRoom(state.hotel!, roomId);
          if (!room) return state;
          return {
            hotel: updateRoom(state.hotel!, roomId, {
              door: {
                ...room.door,
                isLocked: true,
                lastAccessed: new Date(),
                accessLog: [
                  ...room.door.accessLog,
                  makeAccessEntry(actorId, 'attempt', true),
                ],
              },
            }),
          };
        });
      },

      unlockDoor: (roomId, actorId) => {
        set((state) => {
          const room = findRoom(state.hotel!, roomId);
          if (!room) return state;
          return {
            hotel: updateRoom(state.hotel!, roomId, {
              door: {
                ...room.door,
                isLocked: false,
                lastAccessed: new Date(),
                accessLog: [
                  ...room.door.accessLog,
                  makeAccessEntry(actorId, 'attempt', true),
                ],
              },
            }),
          };
        });
      },

      setNumpadCode: (roomId, code) => {
        if (!validateNumpadCode(code)) return false;

        set((state) => {
          const room = findRoom(state.hotel!, roomId);
          if (!room) return state;
          return {
            hotel: updateRoom(state.hotel!, roomId, {
              door: { ...room.door, numpadCode: code },
            }),
          };
        });
        return true;
      },

      setCardAccess: (roomId, level) => {
        set((state) => {
          const room = findRoom(state.hotel!, roomId);
          if (!room) return state;
          return {
            hotel: updateRoom(state.hotel!, roomId, {
              door: { ...room.door, requiredCard: level },
            }),
          };
        });
      },

      armAlarm: (roomId) => {
        set((state) => {
          const room = findRoom(state.hotel!, roomId);
          if (!room) return state;
          return {
            hotel: updateRoom(state.hotel!, roomId, {
              door:     { ...room.door,     isAlarmArmed: true },
              security: { ...room.security, alarmArmed: true  },
            }),
          };
        });
      },

      disarmAlarm: (roomId, code) => {
        const { hotel } = get();
        if (!hotel) return false;

        const room = findRoom(hotel, roomId);
        if (!room) return false;
        if (room.door.alarmCode !== code) return false;

        set((state) => ({
          hotel: updateRoom(state.hotel!, roomId, {
            door:     { ...room.door,     isAlarmArmed: false },
            security: { ...room.security, alarmArmed: false  },
          }),
        }));

        return true;
      },

      knockOnDoor: (roomId, userId) => {
        set((state) => {
          const room = findRoom(state.hotel!, roomId);
          if (!room || !room.door.knockEnabled) return state;

          return {
            hotel: updateRoom(state.hotel!, roomId, {
              door: {
                ...room.door,
                accessLog: [
                  ...room.door.accessLog,
                  makeAccessEntry(userId, 'knock', true),
                ],
              },
            }),
          };
        });
      },

      ringDoorbell: (roomId, userId) => {
        set((state) => {
          const room = findRoom(state.hotel!, roomId);
          if (!room || !room.door.doorbellEnabled) return state;

          return {
            hotel: updateRoom(state.hotel!, roomId, {
              door: {
                ...room.door,
                accessLog: [
                  ...room.door.accessLog,
                  makeAccessEntry(userId, 'doorbell', true),
                ],
              },
            }),
          };
        });
      },

      // ── Stockage ────────────────────────────────────────────

      storeItem: (roomId, containerId, item) => {
        const { hotel } = get();
        if (!hotel) return false;

        const room = findRoom(hotel, roomId);
        if (!room) return false;

        const container = findContainer(room.storage, containerId);
        if (!container) return false;
        if (container.isLocked) return false;
        if (container.items.length >= container.capacity) return false;

        // Empiler les items identiques si possible
        const existingIdx = container.items.findIndex((i) => i.id === item.id);

        set((state) => {
          const updatedItems =
            existingIdx >= 0
              ? container.items.map((i, idx) =>
                  idx === existingIdx
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
                )
              : [...container.items, item];

          return {
            hotel: updateRoomContainer(state.hotel!, roomId, containerId, {
              items: updatedItems,
            }),
          };
        });

        return true;
      },

      retrieveItem: (roomId, containerId, itemId) => {
        const { hotel } = get();
        if (!hotel) return null;

        const room = findRoom(hotel, roomId);
        if (!room) return null;

        const container = findContainer(room.storage, containerId);
        if (!container || container.isLocked) return null;

        const item = container.items.find((i) => i.id === itemId);
        if (!item) return null;

        set((state) => ({
          hotel: updateRoomContainer(state.hotel!, roomId, containerId, {
            items: container.items.filter((i) => i.id !== itemId),
          }),
        }));

        return item;
      },

      lockContainer: (roomId, containerId, code) => {
        if (!validateNumpadCode(code)) return;

        set((state) => ({
          hotel: updateRoomContainer(state.hotel!, roomId, containerId, {
            isLocked: true,
            lockCode: code,
          }),
        }));
      },

      unlockContainer: (roomId, containerId, code) => {
        const { hotel } = get();
        if (!hotel) return false;

        const room = findRoom(hotel, roomId);
        if (!room) return false;

        const container = findContainer(room.storage, containerId);
        if (!container) return false;
        if (container.lockCode !== code) return false;

        set((state) => ({
          hotel: updateRoomContainer(state.hotel!, roomId, containerId, {
            isLocked: false,
          }),
        }));

        return true;
      },

      // ── Ascenseur ───────────────────────────────────────────

      callElevator: (elevatorId, floor) => {
        const { hotel } = get();
        if (!hotel) return;

        const elevator = hotel.elevators.find((e) => e.id === elevatorId);
        if (!elevator) return;
        if (elevator.targetFloor === floor) return; // Déjà à cet étage

        const floorsToTravel = Math.abs(floor - elevator.currentFloor);
        const travelTime = floorsToTravel * elevator.speed * 1000;

        // Marquer comme en mouvement
        set((state) => ({
          hotel: state.hotel
            ? {
                ...state.hotel,
                elevators: state.hotel.elevators.map((e) =>
                  e.id === elevatorId
                    ? { ...e, targetFloor: floor, isMoving: true }
                    : e
                ),
              }
            : null,
        }));

        // Arrivée à destination
        setTimeout(() => {
          set((state) => ({
            hotel: state.hotel
              ? {
                  ...state.hotel,
                  elevators: state.hotel.elevators.map((e) =>
                    e.id === elevatorId
                      ? { ...e, currentFloor: floor, isMoving: false }
                      : e
                  ),
                }
              : null,
          }));
        }, travelTime);
      },

      selectFloor: (elevatorId, floor) => {
        get().callElevator(elevatorId, floor);
      },

      // ── Braquage ────────────────────────────────────────────

      attemptRobbery: (roomId, userId) => {
        const { hotel } = get();
        if (!hotel) {
          return { success: false, message: 'Hôtel non initialisé' };
        }

        const room = findRoom(hotel, roomId);
        if (!room) {
          return { success: false, message: 'Chambre introuvable' };
        }

        // Enregistrer la tentative
        const logEntry = makeAccessEntry(userId, 'attempt', false);

        // PORTE VERROUILLÉE → impossible
        if (room.door.isLocked) {
          set((state) => ({
            hotel: updateRoom(state.hotel!, roomId, {
              door: {
                ...room.door,
                accessLog: [...room.door.accessLog, logEntry],
              },
            }),
          }));

          return {
            success: false,
            message: '❌ Porte verrouillée — braquage impossible.',
            alarmTriggered: room.door.isAlarmArmed,
            policeNotified: room.door.isAlarmArmed,
          };
        }

        // ALARME ARMÉE → déclenchée
        if (room.door.isAlarmArmed || room.security.alarmArmed) {
          set((state) => ({
            hotel: updateRoom(state.hotel!, roomId, {
              door: {
                ...room.door,
                accessLog: [...room.door.accessLog, logEntry],
              },
            }),
          }));

          return {
            success: false,
            message: '🚨 ALARME DÉCLENCHÉE ! La police a été notifiée !',
            alarmTriggered: true,
            policeNotified: true,
          };
        }

        // BRAQUAGE RÉUSSI
        const loot: StoredItem[] = [];
        const updatedStorage = { ...room.storage };

        // Coffre-fort déverrouillé
        if (!room.storage.safe.isLocked) {
          loot.push(...room.storage.safe.items);
          updatedStorage.safe = { ...room.storage.safe, items: [] };
        }

        // Garde-robe déverrouillée (vol partiel)
        if (!room.storage.wardrobe.isLocked) {
          const stolenCount = Math.min(5, room.storage.wardrobe.items.length);
          const stolen = room.storage.wardrobe.items.slice(0, stolenCount);
          loot.push(...stolen);
          updatedStorage.wardrobe = {
            ...room.storage.wardrobe,
            items: room.storage.wardrobe.items.slice(stolenCount),
          };
        }

        // Frigo déverrouillé (vol partiel)
        if (!room.storage.fridge.isLocked && room.storage.fridge.items.length > 0) {
          const stolenFood = room.storage.fridge.items.slice(0, 3);
          loot.push(...stolenFood);
          updatedStorage.fridge = {
            ...room.storage.fridge,
            items: room.storage.fridge.items.slice(3),
          };
        }

        const successEntry: AccessLogEntry = {
          ...logEntry,
          success: true,
        };

        set((state) => ({
          hotel: updateRoom(state.hotel!, roomId, {
            storage: updatedStorage,
            door: {
              ...room.door,
              accessLog: [...room.door.accessLog, successEntry],
            },
            history: [
              ...room.history,
              makeHistoryEntry(
                'burglarized',
                `Cambriolée par ${userId} — ${loot.length} objet(s) volé(s)`
              ),
            ],
          }),
        }));

        return {
          success: true,
          message: `💰 Braquage réussi ! ${loot.length} objet(s) volé(s).`,
          loot,
          alarmTriggered: false,
          policeNotified: false,
        };
      },

      // ── Utilitaires ─────────────────────────────────────────

      getRoomByNumber: (number) => {
        const { hotel } = get();
        if (!hotel) return null;
        return findRoomByNumber(hotel, number);
      },

      getRoomsOnFloor: (floor) => {
        const { hotel } = get();
        if (!hotel) return [];
        return hotel.floors.find((f) => f.level === floor)?.rooms ?? [];
      },

      isRoomAccessible: (roomId, userId) => {
        const { hotel } = get();
        if (!hotel) return false;

        const room = findRoom(hotel, roomId);
        if (!room) return false;

        // Le propriétaire a toujours accès
        if (room.owner === userId) return true;

        // Porte verrouillée = accès refusé
        if (room.door.isLocked) return false;

        // Porte déverrouillée = intrusion possible
        return true;
      },

      getCorridorState: (floor) => {
        const { hotel } = get();
        const fallback: CorridorState = {
          floor,
          rooms: [],
          lighting: DEFAULT_FLOOR_LIGHTING,
        };

        if (!hotel) return fallback;

        const floorData = hotel.floors.find((f) => f.level === floor);
        if (!floorData) return fallback;

        return {
          floor,
          rooms: floorData.rooms.map((r) => ({
            id: r.id,
            number: r.number,
            status: r.status,
            isLocked: r.door.isLocked,
            hasOwner: r.owner !== null,
            lightOn: r.interior.lighting.ceiling,
          })),
          lighting: floorData.lighting,
        };
      },
    }),
    {
      name: 'etherworld-hotel',
      version: 2,
      // Ne pas persister les Set (non sérialisables par défaut)
      partialize: (state) => ({
        hotel: state.hotel,
      }),
    }
  )
);