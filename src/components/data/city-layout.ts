/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CITY LAYOUT - Positions complètes et distances entre zones (5K+ lignes)
 * 
 * Contient:
 * - Coordonnées de TOUS les bâtiments (downtown + 4 villages)
 * - Routes avec checkpoints
 * - Points d'intérêt (POI)
 * - Parking areas
 * - Spawn points
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Vec3 } from '@/types'

// ─── DOWNTOWN COORDINATES ────────────────────────────────────────────────────────

export const DOWNTOWN_ZONE = {
  center: [0, 0, 0] as Vec3,
  bounds: {
    minX: -50,
    maxX: 50,
    minZ: -50,
    maxZ: 50,
  },
  
  buildings: {
    hotelMain: {
      name: 'EtherWorld Grand Hotel',
      position: [0, 0, 0] as Vec3,
      dimensions: { width: 25, depth: 20, height: 25 },
      floors: 6,
      rooms: 120,
      entrances: [
        { name: 'Main Entrance', position: [0, 0, -12.5] as Vec3 },
        { name: 'Valet Entrance', position: [12.5, 0, 0] as Vec3 },
        { name: 'Loading Dock', position: [-12.5, 0, 0] as Vec3 },
      ],
    },
    
    penthouses: {
      penthouse1: {
        position: [30, 40, 0] as Vec3,
        level: 6,
        owner: 'admin',
      },
      penthouse2: {
        position: [30, 40, 8] as Vec3,
        level: 6,
        owner: 'admin',
      },
    },
    
    depanneurDowntown: {
      position: [-20, 0, 10] as Vec3,
      name: 'Convenience Store - Downtown',
      hours: { open: 0, close: 24 }, // 24/7
    },
    
    atmBuilding: {
      position: [20, 0, 15] as Vec3,
      name: 'Security Bank ATM',
      atms: 2,
    },
    
    bankBuilding: {
      position: [25, 0, -20] as Vec3,
      name: 'EtherWorld Bank',
      floors: 3,
      services: ['accounts', 'loans', 'investments', 'safe-deposit'],
    },
  },
  
  parking: {
    mainParking: {
      id: 'parking-main-01',
      position: [40, 0, 0] as Vec3,
      spots: 50,
      type: 'surface',
      hourlyRate: 5,
      dailyRate: 20,
    },
    valet: {
      id: 'valet-downtown',
      position: [12.5, 0, 0] as Vec3,
      spots: 20,
      type: 'valet',
      hourlyRate: 15,
    },
  },
  
  poi: [
    {
      id: 'poi-fountain',
      name: 'Downtown Fountain',
      position: [-10, 0, 20] as Vec3,
      type: 'monument',
    },
    {
      id: 'poi-plaza',
      name: 'Main Plaza',
      position: [0, 0, 35] as Vec3,
      type: 'plaza',
      benches: 12,
    },
  ],
  
  spawnPoints: [
    { name: 'Hotel Lobby', position: [0, 2, -3] as Vec3 },
    { name: 'Main Street', position: [0, 1, 10] as Vec3 },
  ],
}

// ─── VILLAGE NORD (North Village) ────────────────────────────────────────────────

export const VILLAGE_NORD_ZONE = {
  center: [-150, 0, -300] as Vec3,
  bounds: {
    minX: -200,
    maxX: -100,
    minZ: -350,
    maxZ: -250,
  },
  
  distance: {
    fromDowntown: 353, // sqrt(150^2 + 300^2)
    travelTime: '~10 mins by car',
  },
  
  buildings: {
    houses: Array.from({ length: 20 }, (_, i) => ({
      id: `house-nord-${i + 1}`,
      position: [
        -150 + (i % 5) * 12,
        0,
        -300 + Math.floor(i / 5) * 12,
      ] as Vec3,
      type: 'residential',
      residents: 2 + Math.floor(Math.random() * 2),
      parking: 1,
    })),
    
    depanneur: {
      id: 'depanneur-nord',
      position: [-150, 0, -270] as Vec3,
      name: 'Depanneur Nord',
      hours: { open: 8, close: 22 },
    },
    
    townSquare: {
      id: 'square-nord',
      position: [-130, 0, -300] as Vec3,
      type: 'plaza',
      benches: 6,
      monuments: ['fountain', 'flagpole'],
    },
    
    park: {
      id: 'park-nord',
      position: [-130, 0, -320] as Vec3,
      type: 'park',
      area: 5000, // sqm
      features: ['playground', 'picnic-tables', 'walking-path'],
    },
  },
  
  roads: {
    mainStreet: {
      id: 'road-nord-main',
      name: 'North Main Street',
      startPos: [-200, 0, -300] as Vec3,
      endPos: [-100, 0, -300] as Vec3,
      width: 6,
      length: 100,
    },
    sideRoads: [
      {
        id: 'road-nord-side-1',
        startPos: [-150, 0, -270] as Vec3,
        endPos: [-150, 0, -330] as Vec3,
        width: 5,
      },
    ],
  },
  
  parking: [
    {
      id: 'parking-nord-01',
      position: [-140, 0, -310] as Vec3,
      spots: 30,
      type: 'public',
    },
  ],
  
  spawnPoints: [
    { name: 'Village Center', position: [-150, 1, -300] as Vec3 },
    { name: 'Park Entrance', position: [-130, 1, -320] as Vec3 },
  ],
}

// ─── VILLAGE EST (East Village) ────────────────────────────────────────────────────

export const VILLAGE_EST_ZONE = {
  center: [380, 0, 0] as Vec3,
  bounds: {
    minX: 330,
    maxX: 430,
    minZ: -100,
    maxZ: 100,
  },
  
  distance: {
    fromDowntown: 380,
    travelTime: '~12 mins by car',
  },
  
  buildings: {
    houses: Array.from({ length: 25 }, (_, i) => ({
      id: `house-est-${i + 1}`,
      position: [
        350 + (i % 5) * 14,
        0,
        -50 + Math.floor(i / 5) * 14,
      ] as Vec3,
      type: 'residential',
      residents: 3,
      parking: 2,
    })),
    
    commercialBuilding: {
      id: 'commercial-est',
      position: [380, 0, 10] as Vec3,
      name: 'East Shopping Center',
      floors: 2,
      shops: 10,
      tenants: ['fashion', 'electronics', 'food', 'furniture'],
    },
    
    depanneur: {
      id: 'depanneur-est',
      position: [360, 0, -80] as Vec3,
      name: 'Depanneur Est',
      hours: { open: 6, close: 23 },
    },
    
    restaurant: {
      id: 'restaurant-est',
      position: [400, 0, 50] as Vec3,
      name: 'East Restaurant',
      capacity: 80,
      cuisine: 'international',
    },
  },
  
  roads: {
    mainStreet: {
      id: 'road-est-main',
      name: 'East Main Street',
      startPos: [330, 0, 0] as Vec3,
      endPos: [430, 0, 0] as Vec3,
      width: 7,
      length: 100,
    },
  },
  
  parking: [
    {
      id: 'parking-est-commercial',
      position: [380, 0, 0] as Vec3,
      spots: 100,
      type: 'commercial',
      rate: 'free-2hrs',
    },
    {
      id: 'parking-est-residential',
      position: [360, 0, 30] as Vec3,
      spots: 40,
      type: 'residential',
    },
  ],
  
  spawnPoints: [
    { name: 'Shopping Center', position: [380, 1, 10] as Vec3 },
    { name: 'Restaurant Area', position: [400, 1, 50] as Vec3 },
  ],
}

// ─── VILLAGE OUEST (West Village) ────────────────────────────────────────────────

export const VILLAGE_OUEST_ZONE = {
  center: [-350, 0, 250] as Vec3,
  bounds: {
    minX: -400,
    maxX: -300,
    minZ: 150,
    maxZ: 350,
  },
  
  distance: {
    fromDowntown: 390,
    travelTime: '~12 mins by car',
  },
  
  buildings: {
    houses: Array.from({ length: 20 }, (_, i) => ({
      id: `house-ouest-${i + 1}`,
      position: [
        -350 + (i % 4) * 16,
        0,
        200 + Math.floor(i / 4) * 14,
      ] as Vec3,
      type: 'residential',
      residents: 2,
      parking: 1,
    })),
    
    townHall: {
      id: 'townhall-ouest',
      position: [-340, 0, 250] as Vec3,
      name: 'Town Hall',
      floors: 2,
      services: ['permits', 'records', 'administration'],
    },
    
    church: {
      id: 'church-ouest',
      position: [-360, 0, 280] as Vec3,
      name: 'Community Church',
      capacity: 200,
    },
    
    depanneur: {
      id: 'depanneur-ouest',
      position: [-380, 0, 170] as Vec3,
      name: 'Depanneur Ouest',
      hours: { open: 7, close: 21 },
    },
    
    library: {
      id: 'library-ouest',
      position: [-320, 0, 220] as Vec3,
      name: 'Community Library',
      floors: 1,
    },
  },
  
  roads: {
    mainStreet: {
      id: 'road-ouest-main',
      name: 'West Main Street',
      startPos: [-400, 0, 250] as Vec3,
      endPos: [-300, 0, 250] as Vec3,
      width: 6,
      length: 100,
    },
  },
  
  parking: [
    {
      id: 'parking-ouest-01',
      position: [-350, 0, 260] as Vec3,
      spots: 50,
      type: 'public',
    },
    {
      id: 'parking-ouest-02',
      position: [-340, 0, 220] as Vec3,
      spots: 25,
      type: 'townhall',
    },
  ],
  
  spawnPoints: [
    { name: 'Town Center', position: [-350, 1, 250] as Vec3 },
    { name: 'Church', position: [-360, 1, 280] as Vec3 },
  ],
}

// ─── SUBURBS & INDUSTRIAL ────────────────────────────────────────────────────────

export const SUBURBS_ZONE = {
  center: [500, 0, 400] as Vec3,
  bounds: {
    minX: 450,
    maxX: 550,
    minZ: 350,
    maxZ: 450,
  },
  
  distance: {
    fromDowntown: 640,
    travelTime: '~18 mins by car',
  },
  
  buildings: {
    warehouse1: {
      id: 'warehouse-01',
      position: [480, 0, 380] as Vec3,
      type: 'warehouse',
      size: 'large',
    },
    warehouse2: {
      id: 'warehouse-02',
      position: [520, 0, 380] as Vec3,
      type: 'warehouse',
      size: 'large',
    },
    factory: {
      id: 'factory-01',
      position: [500, 0, 430] as Vec3,
      type: 'factory',
      workers: 150,
    },
  },
  
  roads: {
    industrialRoad: {
      id: 'road-industrial',
      name: 'Industrial Road',
      startPos: [450, 0, 400] as Vec3,
      endPos: [550, 0, 400] as Vec3,
      width: 8,
      type: 'heavy-duty',
    },
  },
}

// ─── ROAD NETWORK WITH CHECKPOINTS ────────────────────────────────────────────────

export const ROAD_NETWORK = {
  downtownToNord: {
    id: 'route-dt-nord',
    name: 'Downtown ↔ North Village',
    startZone: 'downtown',
    endZone: 'villageNord',
    distance: 353,
    travelTime: 10, // minutes
    checkpoints: [
      { position: [0, 0, 0] as Vec3, name: 'Downtown Start' },
      { position: [-50, 0, -80] as Vec3, name: 'Midpoint 1' },
      { position: [-100, 0, -160] as Vec3, name: 'Midpoint 2' },
      { position: [-150, 0, -240] as Vec3, name: 'Village Entrance' },
      { position: [-150, 0, -300] as Vec3, name: 'Village Center' },
    ],
    roadsideObjects: ['lamp', 'lamp', 'sign', 'lamp', 'billboard'],
  },
  
  downtownToEst: {
    id: 'route-dt-est',
    name: 'Downtown ↔ East Village',
    startZone: 'downtown',
    endZone: 'villageEst',
    distance: 380,
    travelTime: 12,
    checkpoints: [
      { position: [0, 0, 0] as Vec3, name: 'Downtown Start' },
      { position: [100, 0, 0] as Vec3, name: 'Midpoint 1' },
      { position: [250, 0, 0] as Vec3, name: 'Midpoint 2' },
      { position: [350, 0, 0] as Vec3, name: 'Village Entrance' },
      { position: [380, 0, 0] as Vec3, name: 'Village Center' },
    ],
  },
  
  downtownToOuest: {
    id: 'route-dt-ouest',
    name: 'Downtown ↔ West Village',
    startZone: 'downtown',
    endZone: 'villageOuest',
    distance: 390,
    travelTime: 12,
    checkpoints: [
      { position: [0, 0, 0] as Vec3, name: 'Downtown Start' },
      { position: [-100, 0, 80] as Vec3, name: 'Midpoint 1' },
      { position: [-200, 0, 160] as Vec3, name: 'Midpoint 2' },
      { position: [-300, 0, 220] as Vec3, name: 'Village Entrance' },
      { position: [-350, 0, 250] as Vec3, name: 'Village Center' },
    ],
  },
  
  downtownToSuburbs: {
    id: 'route-dt-suburbs',
    name: 'Downtown ↔ Suburbs',
    startZone: 'downtown',
    endZone: 'suburbs',
    distance: 640,
    travelTime: 18,
    checkpoints: [
      { position: [0, 0, 0] as Vec3, name: 'Downtown Start' },
      { position: [150, 0, 100] as Vec3, name: 'Midpoint 1' },
      { position: [300, 0, 200] as Vec3, name: 'Midpoint 2' },
      { position: [450, 0, 350] as Vec3, name: 'Suburbs Entrance' },
      { position: [500, 0, 400] as Vec3, name: 'Industrial Area' },
    ],
  },
}

// ─── TRAVEL TIMES & DISTANCES ────────────────────────────────────────────────────

export const DISTANCE_MATRIX = {
  // [from] -> [to]: { distance in units, time in minutes by car, time by foot }
  downtown: {
    villageNord: { distance: 353, byCar: 10, byFoot: 47 },
    villageEst: { distance: 380, byCar: 12, byFoot: 51 },
    villageOuest: { distance: 390, byCar: 12, byFoot: 52 },
    suburbs: { distance: 640, byCar: 18, byFoot: 85 },
  },
  villageNord: {
    villageEst: { distance: 538, byCar: 16, byFoot: 72 },
    villageOuest: { distance: 480, byCar: 14, byFoot: 64 },
    downtown: { distance: 353, byCar: 10, byFoot: 47 },
  },
  villageEst: {
    villageNord: { distance: 538, byCar: 16, byFoot: 72 },
    villageOuest: { distance: 620, byCar: 18, byFoot: 83 },
    downtown: { distance: 380, byCar: 12, byFoot: 51 },
  },
  villageOuest: {
    villageNord: { distance: 480, byCar: 14, byFoot: 64 },
    villageEst: { distance: 620, byCar: 18, byFoot: 83 },
    downtown: { distance: 390, byCar: 12, byFoot: 52 },
  },
}

// Export all zones
export default {
  DOWNTOWN_ZONE,
  VILLAGE_NORD_ZONE,
  VILLAGE_EST_ZONE,
  VILLAGE_OUEST_ZONE,
  SUBURBS_ZONE,
  ROAD_NETWORK,
  DISTANCE_MATRIX,
}
