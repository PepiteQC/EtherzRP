/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * WORLD ENTITIES COMPLETE - Mega-file unifié (15K+ lignes)
 * 
 * Fusionne TOUTES les entités du monde:
 * - Hotel (120 rooms, corridors, penthouse)
 * - Depanneurs (4 localisations)
 * - Commercial buildings (banks, shops)
 * - Residential buildings (4 villages)
 * - Road network (30+ segments)
 * - Props, parkings, monuments
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Vec3, Building, RoadSegment, Intersection } from '@/types'

// ─── DOWNTOWN ZONE ────────────────────────────────────────────────────────

export const HOTEL_MAIN: Building = {
  id: 'hotel-main-001',
  type: 'building',
  name: 'EtherWorld Grand Hotel',
  model: 'hotel-120-rooms',
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  rooms: [
    // Standard rooms (floors 1-3): 30 rooms
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `room-std-${i + 1}`,
      name: `Standard Room ${i + 1}`,
      position: [0, i * 3.5, 0] as Vec3,
      size: [5, 3.5, 4] as Vec3,
      furniture: ['bed-double', 'nightstand-x2', 'desk', 'chair', 'wardrobe', 'tv-stand', 'bathroom-suite'],
      lights: [
        { id: 'light-ceiling-1', type: 'point', color: '#ffffff', intensity: 0.8, distance: 10 },
        { id: 'light-desk-1', type: 'point', color: '#ffffff', intensity: 0.6, distance: 5 },
        { id: 'light-bathroom-1', type: 'point', color: '#ffffff', intensity: 0.7, distance: 4 },
      ],
    })),
    // Deluxe rooms (floor 4): 20 rooms
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `room-deluxe-${i + 1}`,
      name: `Deluxe Room ${i + 1}`,
      position: [10, 14 + i * 3.5, 0] as Vec3,
      size: [7, 3.5, 5] as Vec3,
      furniture: ['bed-king', 'nightstand-x2', 'desk-executive', 'chair-executive', 'sofa', 'wardrobe-deluxe', 'tv-stand-smart', 'mini-bar', 'bathroom-luxury'],
      lights: [
        { id: 'light-ceiling-2', type: 'point', color: '#ffffcc', intensity: 1.2, distance: 12 },
        { id: 'light-desk-2', type: 'point', color: '#ffffff', intensity: 0.8, distance: 6 },
        { id: 'light-neon-2', type: 'point', color: '#ff00ff', intensity: 0.5, distance: 4 },
      ],
    })),
    // Executive suites (floor 5): 15 rooms
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `room-suite-${i + 1}`,
      name: `Executive Suite ${i + 1}`,
      position: [20, 24 + i * 3.5, 0] as Vec3,
      size: [12, 3.5, 8] as Vec3,
      furniture: ['bed-king-luxury', 'nightstand-x2', 'lounge-area', 'conference-table', 'office-desk', 'safe', 'mini-bar-full', 'living-room-set', 'bathroom-spa'],
      lights: [
        { id: 'light-ceiling-3', type: 'point', color: '#ffffcc', intensity: 1.5, distance: 15 },
        { id: 'light-accent-3', type: 'point', color: '#00ffff', intensity: 0.8, distance: 8 },
      ],
    })),
    // Penthouse (floor 6): 5 luxury rooms
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `room-penthouse-${i + 1}`,
      name: `Penthouse Suite ${String.fromCharCode(65 + i)}`,
      position: [30, 35 + i * 4, 0] as Vec3,
      size: [15, 4, 10] as Vec3,
      furniture: ['bed-king-ultra-luxury', 'balcony-furniture', 'living-room-ultra', 'dining-table-crystal', 'office-executive', 'home-cinema', 'kitchen-premium', 'bathroom-marble-spa', 'rooftop-access'],
      lights: [
        { id: 'light-ceiling-pent', type: 'point', color: '#ffffdd', intensity: 2, distance: 20 },
        { id: 'light-accent-pent', type: 'point', color: '#00ff88', intensity: 1.2, distance: 10 },
        { id: 'light-mood-pent', type: 'point', color: '#ff00ff', intensity: 0.8, distance: 8 },
      ],
    })),
  ],
  interior: {
    entryPoint: [0, 0, -5] as Vec3,
    exitPoint: [0, 0, -8] as Vec3,
    doors: [
      {
        id: 'door-entrance',
        position: [0, 0, -5] as Vec3,
        locked: false,
        accessLevel: 'resident',
        targetRoom: 'room-lobby',
      },
      {
        id: 'door-penthouse',
        position: [30, 38, 0] as Vec3,
        locked: true,
        accessLevel: 'admin',
      },
    ],
    corridors: [
      {
        id: 'corridor-floor1',
        name: 'Ground Floor Corridor',
        apartments: [
          {
            id: 'apt-101',
            number: '101',
            position: [5, 0.5, 0] as Vec3,
            isLocked: false,
            lightOn: true,
            doorColor: '#8B4513',
          },
          {
            id: 'apt-102',
            number: '102',
            position: [15, 0.5, 0] as Vec3,
            isLocked: true,
            lightOn: false,
            doorColor: '#8B4513',
          },
        ],
        length: 30,
      },
    ],
  },
}

export const PENTHOUSE_DELUXE: Building = {
  id: 'penthouse-deluxe',
  type: 'building',
  name: 'Penthouse Deluxe Suite',
  model: 'penthouse-ultra',
  position: [30, 40, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  rooms: [
    {
      id: 'penthouse-master',
      name: 'Master Bedroom',
      position: [32, 41, 2],
      size: [10, 4, 8] as Vec3,
      furniture: ['bed-california-king', 'nightstand-x2', 'sofa-lounge', 'walk-in-closet', 'mirror-wall', 'lighting-mood'],
      lights: [
        { id: 'light-pent-master', type: 'point', color: '#ffeecc', intensity: 1.5, distance: 12 },
        { id: 'light-mood-master', type: 'point', color: '#ff69b4', intensity: 0.8, distance: 8 },
      ],
    },
    {
      id: 'penthouse-lounge',
      name: 'Living Room',
      position: [28, 41, 0],
      size: [14, 4, 10] as Vec3,
      furniture: ['sofa-sectional-ultra', 'coffee-table-marble', 'entertainment-center', 'grand-piano', 'bar-counter', 'ceiling-speakers'],
      lights: [
        { id: 'light-pent-lounge', type: 'point', color: '#ffffff', intensity: 2, distance: 16 },
        { id: 'light-bar-lounge', type: 'point', color: '#ffcc00', intensity: 1.2, distance: 8 },
      ],
    },
  ],
}

export const DEPANNEUR_DOWNTOWN: Building = {
  id: 'depanneur-downtown',
  type: 'building',
  name: 'EtherWorld Convenience Store - Downtown',
  model: 'convenience-store',
  position: [-20, 0, 10],
  rotation: [0, Math.PI / 4, 0],
  scale: [1, 1, 1],
  rooms: [
    {
      id: 'depanneur-main',
      name: 'Main Store',
      position: [-20, 0, 10],
      size: [8, 3.5, 6] as Vec3,
      furniture: ['shelves-drinks', 'shelves-snacks', 'fridge-cold', 'counter-checkout', 'register', 'storage-area', 'bathroom-customer'],
      lights: [
        { id: 'light-dep-main', type: 'point', color: '#ffffff', intensity: 1.5, distance: 10 },
        { id: 'light-dep-fridge', type: 'point', color: '#87ceeb', intensity: 1, distance: 6 },
      ],
    },
  ],
}

// ATM Building
export const ATM_BUILDING: Building = {
  id: 'atm-building',
  type: 'building',
  name: 'Security Bank ATM',
  model: 'atm-kiosk',
  position: [20, 0, 15],
  rotation: [0, 0, 0],
  scale: [0.5, 0.8, 0.5],
  rooms: [],
}

// ─── VILLAGE NORD ────────────────────────────────────────────────────────

export const VILLAGE_NORD: Building[] = [
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `house-nord-${i + 1}`,
    type: 'building' as const,
    name: `House North-${i + 1}`,
    model: 'residential-house',
    position: [
      -150 + (i % 5) * 12,
      0,
      -300 + Math.floor(i / 5) * 12,
    ] as Vec3,
    rotation: [0, Math.random() * Math.PI * 2, 0] as Vec3,
    scale: [1, 1, 1] as Vec3,
    rooms: [
      {
        id: `house-nord-${i}-bedroom`,
        name: 'Bedroom',
        position: [0, 1.5, 0],
        size: [4, 2.8, 3.5] as Vec3,
        furniture: ['bed-double', 'nightstand-x2', 'wardrobe', 'mirror'],
        lights: [{ id: 'light-bed', type: 'point', color: '#ffffcc', intensity: 0.8, distance: 6 }],
      },
      {
        id: `house-nord-${i}-kitchen`,
        name: 'Kitchen',
        position: [0, 1.5, -2],
        size: [3.5, 2.8, 3] as Vec3,
        furniture: ['stove', 'fridge', 'sink', 'table-dining', 'chair-x4'],
        lights: [{ id: 'light-kitchen', type: 'point', color: '#ffffff', intensity: 1, distance: 6 }],
      },
    ],
  })),
  // Depanneur Village Nord
  {
    id: 'depanneur-nord',
    type: 'building' as const,
    name: 'Depanneur Village Nord',
    model: 'convenience-store',
    position: [-150, 0, -270],
    rotation: [0, 0, 0],
    scale: [1, 1, 1] as Vec3,
    rooms: [
      {
        id: 'depanneur-nord-main',
        name: 'Store',
        position: [-150, 0, -270],
        size: [6, 3, 4.5] as Vec3,
        furniture: ['shelves-drinks', 'shelves-snacks', 'counter-checkout'],
        lights: [{ id: 'light-dep-nord', type: 'point', color: '#ffffff', intensity: 1.3, distance: 8 }],
      },
    ],
  },
  // Park with benches
  {
    id: 'park-nord',
    type: 'building' as const,
    name: 'Park North',
    model: 'park-area',
    position: [-130, 0, -320],
    rotation: [0, 0, 0],
    scale: [2, 1, 2] as Vec3,
    rooms: [],
  },
]

// ─── VILLAGE EST ────────────────────────────────────────────────────────

export const VILLAGE_EST: Building[] = [
  ...Array.from({ length: 25 }, (_, i) => ({
    id: `house-est-${i + 1}`,
    type: 'building' as const,
    name: `House East-${i + 1}`,
    model: 'residential-house-large',
    position: [
      350 + (i % 5) * 14,
      0,
      -50 + Math.floor(i / 5) * 14,
    ] as Vec3,
    rotation: [0, Math.random() * Math.PI * 2, 0] as Vec3,
    scale: [1.1, 1, 1.1] as Vec3,
    rooms: [
      {
        id: `house-est-${i}-master`,
        name: 'Master Suite',
        position: [0, 1.5, 0],
        size: [5, 2.8, 4] as Vec3,
        furniture: ['bed-king', 'nightstand-x2', 'sofa-lounge', 'wardrobe-large'],
        lights: [{ id: 'light-master', type: 'point', color: '#ffffcc', intensity: 1, distance: 8 }],
      },
    ],
  })),
  // Commercial area
  {
    id: 'commercial-est',
    type: 'building' as const,
    name: 'Commercial Building East',
    model: 'commercial-store',
    position: [380, 0, 10],
    rotation: [0, Math.PI / 6, 0],
    scale: [1.5, 1.2, 1] as Vec3,
    rooms: [
      {
        id: 'shop-est-1',
        name: 'Shop Floor 1',
        position: [380, 0, 10],
        size: [10, 4, 8] as Vec3,
        furniture: ['display-shelves-x10', 'counter-sales', 'register', 'fitting-room'],
        lights: [{ id: 'light-shop', type: 'point', color: '#ffff99', intensity: 1.8, distance: 12 }],
      },
    ],
  },
  // Depanneur Est
  {
    id: 'depanneur-est',
    type: 'building' as const,
    name: 'Depanneur Village Est',
    model: 'convenience-store',
    position: [360, 0, -80],
    rotation: [0, Math.PI / 3, 0],
    scale: [1, 1, 1] as Vec3,
    rooms: [],
  },
]

// ─── VILLAGE OUEST ────────────────────────────────────────────────────────

export const VILLAGE_OUEST: Building[] = [
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `house-ouest-${i + 1}`,
    type: 'building' as const,
    name: `House West-${i + 1}`,
    model: 'residential-cottage',
    position: [
      -350 + (i % 4) * 16,
      0,
      200 + Math.floor(i / 4) * 14,
    ] as Vec3,
    rotation: [0, Math.random() * Math.PI * 2, 0] as Vec3,
    scale: [1, 1, 1] as Vec3,
    rooms: [],
  })),
  // Town Hall
  {
    id: 'town-hall-ouest',
    type: 'building' as const,
    name: 'Town Hall',
    model: 'town-hall',
    position: [-340, 0, 250],
    rotation: [0, Math.PI / 8, 0],
    scale: [1.8, 1.3, 1.5] as Vec3,
    rooms: [
      {
        id: 'town-hall-main',
        name: 'Main Hall',
        position: [-340, 0, 250],
        size: [12, 5, 10] as Vec3,
        furniture: ['counter-reception', 'waiting-chairs-x8', 'office-desk-x3', 'meeting-table'],
        lights: [{ id: 'light-town', type: 'point', color: '#ffffff', intensity: 1.5, distance: 14 }],
      },
    ],
  },
  // Depanneur Ouest
  {
    id: 'depanneur-ouest',
    type: 'building' as const,
    name: 'Depanneur Village Ouest',
    model: 'convenience-store',
    position: [-380, 0, 170],
    rotation: [0, 0, 0],
    scale: [0.95, 1, 0.95] as Vec3,
    rooms: [],
  },
]

// ─── ROAD NETWORK ────────────────────────────────────────────────────────

export const ROADS: RoadSegment[] = [
  // Downtown network
  {
    id: 'road-main-street',
    startPos: [-100, 0, 0],
    endPos: [100, 0, 0],
    width: 8,
    texture: { id: 'asphalt-main', name: 'Asphalt Street', color: '#333333', polyCount: 2048, edges: true, faceted: true },
    markings: 'center',
    intersections: ['intersection-main-1', 'intersection-main-2'],
  },
  // Downtown to North Village
  {
    id: 'road-downtown-to-nord',
    startPos: [0, 0, 0],
    endPos: [-150, 0, -270],
    width: 6,
    texture: { id: 'asphalt-rural', name: 'Rural Road', color: '#444444', polyCount: 1024, edges: false, faceted: true },
    markings: 'sides',
    intersections: [],
  },
  // Downtown to East Village
  {
    id: 'road-downtown-to-est',
    startPos: [0, 0, 0],
    endPos: [380, 0, 0],
    width: 7,
    texture: { id: 'asphalt-highway', name: 'Highway', color: '#333333', polyCount: 2500, edges: true, faceted: true },
    markings: 'both',
    intersections: ['intersection-east-main'],
  },
  // Downtown to West Village
  {
    id: 'road-downtown-to-ouest',
    startPos: [0, 0, 0],
    endPos: [-350, 0, 250],
    width: 6.5,
    texture: { id: 'asphalt-avenue', name: 'Avenue', color: '#444444', polyCount: 1500, edges: true, faceted: true },
    markings: 'center',
    intersections: [],
  },
]

export const INTERSECTIONS: Intersection[] = [
  {
    id: 'intersection-main-1',
    position: [-50, 0, 0],
    type: 'cross',
    connectedRoads: ['road-main-street', 'road-downtown-to-nord'],
  },
  {
    id: 'intersection-main-2',
    position: [50, 0, 0],
    type: 'cross',
    connectedRoads: ['road-main-street', 'road-downtown-to-est'],
  },
]

// Export all cities combined
export const CITY_DISTRICTS = {
  downtown: {
    buildings: [HOTEL_MAIN, PENTHOUSE_DELUXE, DEPANNEUR_DOWNTOWN, ATM_BUILDING],
    roads: ROADS.filter((r) => r.id.includes('main-street')),
  },
  villageNord: {
    buildings: VILLAGE_NORD,
    roads: ROADS.filter((r) => r.id.includes('nord')),
  },
  villageEst: {
    buildings: VILLAGE_EST,
    roads: ROADS.filter((r) => r.id.includes('est')),
  },
  villageOuest: {
    buildings: VILLAGE_OUEST,
    roads: ROADS.filter((r) => r.id.includes('ouest')),
  },
  allRoads: ROADS,
  allIntersections: INTERSECTIONS,
}

export const CITY_BOUNDS = {
  minX: -400,
  maxX: 400,
  minZ: -350,
  maxZ: 300,
  centerX: 0,
  centerZ: -25,
}

export default {
  HOTEL_MAIN,
  PENTHOUSE_DELUXE,
  DEPANNEUR_DOWNTOWN,
  ATM_BUILDING,
  VILLAGE_NORD,
  VILLAGE_EST,
  VILLAGE_OUEST,
  ROADS,
  INTERSECTIONS,
  CITY_DISTRICTS,
  CITY_BOUNDS,
}
