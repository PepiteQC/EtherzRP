/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ETHERWORLD - COMPLETE WORLD INDEX & IMPORTER
 * 
 * Ce fichier EST la source de TOUTE la configuration du monde EtherWorld
 * Il réference TOUS les modèles (770+), bâtiments, routes, NPCs, etc.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Export all models from models.ts
export * from './models'

// ════════════════════════════════════════════════════════════════════════════════
// CITY ARCHITECTURE DÉFINITION
// ════════════════════════════════════════════════════════════════════════════════

export const CITY_LAYOUT = {
  // DOWNTOWN CENTER
  downtown: {
    center: [0, 0, 0],
    bounds: { minX: -50, maxX: 50, minZ: -50, maxZ: 50 },
    buildings: {
      hotelMain: { id: 'hotel-main-001', name: 'EtherWorld Grand Hotel', position: [0, 0, 0], model: 'hotel', floors: 6, rooms: 120 },
      penthouse: { id: 'penthouse-001', name: 'Penthouse Suite', position: [30, 40, 0], model: 'apartment', suites: 5 },
      depanneur: { id: 'depan-downtown', name: 'Depanneur Downtown', position: [-20, 0, 10], model: 'depan' },
      atm: { id: 'atm-downtown', name: 'ATM Building', position: [20, 0, 15], model: 'atm' },
      bank: { id: 'bank-downtown', name: 'Bank', position: [25, 0, -20], model: 'garage' },
    },
    parking: {
      mainLot: { id: 'parking-main', position: [40, 0, 0], spots: 50 },
    },
  },

  // VILLAGE NORD (North Village)
  villageNord: {
    center: [-150, 0, -300],
    bounds: { minX: -200, maxX: -100, minZ: -350, maxZ: -250 },
    buildings: {
      houses: Array.from({ length: 20 }, (_, i) => ({
        id: `house-nord-${i + 1}`,
        name: `House North-${i + 1}`,
        position: [-150 + (i % 5) * 12, 0, -300 + Math.floor(i / 5) * 12],
        model: 'fw',
        residents: 2 + Math.floor(Math.random() * 2),
      })),
      depanneur: { id: 'depan-nord', name: 'Depanneur Nord', position: [-150, 0, -270], model: 'depan' },
      park: { id: 'park-nord', name: 'Park', position: [-130, 0, -320], model: 'fgrass' },
    },
  },

  // VILLAGE EST (East Village)
  villageEst: {
    center: [380, 0, 0],
    bounds: { minX: 330, maxX: 430, minZ: -100, maxZ: 100 },
    buildings: {
      houses: Array.from({ length: 25 }, (_, i) => ({
        id: `house-est-${i + 1}`,
        name: `House East-${i + 1}`,
        position: [350 + (i % 5) * 14, 0, -50 + Math.floor(i / 5) * 14],
        model: 'fw',
        residents: 3,
      })),
      commercial: { id: 'commercial-est', name: 'Shopping Center', position: [380, 0, 10], model: 'warehouse' },
      depanneur: { id: 'depan-est', name: 'Depanneur Est', position: [360, 0, -80], model: 'depan' },
      restaurant: { id: 'restaurant-est', name: 'Restaurant', position: [400, 0, 50], model: 'restau' },
    },
  },

  // VILLAGE OUEST (West Village)
  villageOuest: {
    center: [-350, 0, 250],
    bounds: { minX: -400, maxX: -300, minZ: 150, maxZ: 350 },
    buildings: {
      houses: Array.from({ length: 20 }, (_, i) => ({
        id: `house-ouest-${i + 1}`,
        name: `House West-${i + 1}`,
        position: [-350 + (i % 4) * 16, 0, 200 + Math.floor(i / 4) * 14],
        model: 'fw',
        residents: 2,
      })),
      townhall: { id: 'townhall-ouest', name: 'Town Hall', position: [-340, 0, 250], model: 'garage' },
      church: { id: 'church-ouest', name: 'Church', position: [-360, 0, 280], model: 'church' },
      depanneur: { id: 'depan-ouest', name: 'Depanneur Ouest', position: [-380, 0, 170], model: 'depan' },
    },
  },

  // SUBURBS & INDUSTRIAL
  suburbs: {
    center: [500, 0, 400],
    bounds: { minX: 450, maxX: 550, minZ: 350, maxZ: 450 },
    buildings: {
      warehouse1: { id: 'warehouse-01', name: 'Warehouse 1', position: [480, 0, 380], model: 'warehouse' },
      warehouse2: { id: 'warehouse-02', name: 'Warehouse 2', position: [520, 0, 380], model: 'warehouse' },
      factory: { id: 'factory-01', name: 'Factory', position: [500, 0, 430], model: 'warehouse' },
    },
  },

  // ROUTES RÉSEAU
  roads: [
    { id: 'road-main', name: 'Main Street', startPos: [-100, 0, 0], endPos: [100, 0, 0], width: 8, type: 'highway' },
    { id: 'road-to-nord', name: 'To Nord', startPos: [0, 0, 0], endPos: [-150, 0, -300], width: 6, type: 'rural' },
    { id: 'road-to-est', name: 'To Est', startPos: [0, 0, 0], endPos: [380, 0, 0], width: 7, type: 'highway' },
    { id: 'road-to-ouest', name: 'To Ouest', startPos: [0, 0, 0], endPos: [-350, 0, 250], width: 6, type: 'rural' },
    { id: 'road-to-suburbs', name: 'To Suburbs', startPos: [0, 0, 0], endPos: [500, 0, 400], width: 8, type: 'highway' },
  ],

  // DISTANCES ENTRE ZONES
  distances: {
    'downtown-nord': 353,
    'downtown-est': 380,
    'downtown-ouest': 390,
    'downtown-suburbs': 640,
    'nord-est': 538,
    'nord-ouest': 480,
    'est-ouest': 620,
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT COMPLET POUR LE JEU
// ════════════════════════════════════════════════════════════════════════════════

export const WORLD_CONFIG = {
  CITY_LAYOUT,
  SPAWN_POINTS: [
    { name: 'Hotel Lobby', pos: [0, 2, -3] },
    { name: 'Main Street', pos: [0, 1, 10] },
    { name: 'Village Nord', pos: [-150, 1, -300] },
    { name: 'Village Est', pos: [380, 1, 0] },
    { name: 'Village Ouest', pos: [-350, 1, 250] },
  ],
  WORLD_BOUNDS: {
    minX: -500,
    maxX: 600,
    minZ: -400,
    maxZ: 500,
  },
  TOTAL_MODELS: 770,
  TOTAL_BUILDINGS: 85,
  TOTAL_ROADS: 5,
  TOTAL_HOUSES: 85,
  TOTAL_NPCS_AVAILABLE: 50,
  TOTAL_JOBS_AVAILABLE: 20,
  VERSION: '5.0.0-OFFICIAL-FUSION',
}
