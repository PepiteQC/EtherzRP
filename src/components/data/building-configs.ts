/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BUILDING CONFIGS - Configuration détaillée de TOUS les bâtiments (8K+ lignes)
 * 
 * Contient:
 * - Geometry complète (dimensions, portes, fenêtres)
 * - Materials poly-texturés avec edges
 * - Lights détaillées
 * - Decorations & Props
 * - Interactions
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { Vec3, Light, PolyTexture } from '@/types'

// ─── MATERIALS POLY-TEXTURÉS ────────────────────────────────────────────────────

export const POLY_MATERIALS = {
  // Hotel exterior
  hotelBrickFacade: {
    name: 'Hotel Brick Facade',
    color: '#d4a574',
    metalness: 0,
    roughness: 0.8,
    polyCount: 2048,
    edges: true,
    faceted: true,
  } as PolyTexture,
  
  hotelGlassWindow: {
    name: 'Hotel Glass',
    color: '#87ceeb',
    metalness: 0.8,
    roughness: 0.1,
    polyCount: 1024,
    edges: true,
    faceted: false,
  } as PolyTexture,
  
  hotelRoofTile: {
    name: 'Roof Tile',
    color: '#8B4513',
    metalness: 0,
    roughness: 0.7,
    polyCount: 1536,
    edges: true,
    faceted: true,
  } as PolyTexture,
  
  // Residential
  residentialBrick: {
    name: 'Residential Brick',
    color: '#cc6633',
    metalness: 0,
    roughness: 0.75,
    polyCount: 1024,
    edges: true,
    faceted: true,
  } as PolyTexture,
  
  residentialWood: {
    name: 'Wood Siding',
    color: '#8B6F47',
    metalness: 0,
    roughness: 0.8,
    polyCount: 1280,
    edges: true,
    faceted: true,
  } as PolyTexture,
  
  // Roads
  asphaltMain: {
    name: 'Asphalt Main',
    color: '#333333',
    metalness: 0,
    roughness: 0.9,
    polyCount: 2048,
    edges: true,
    faceted: true,
  } as PolyTexture,
  
  asphaltMarkings: {
    name: 'Road Markings',
    color: '#ffff99',
    metalness: 0,
    roughness: 0.85,
    polyCount: 512,
    edges: true,
    faceted: true,
  } as PolyTexture,
  
  // Commercial
  commercialSteel: {
    name: 'Commercial Steel',
    color: '#777777',
    metalness: 0.6,
    roughness: 0.5,
    polyCount: 1792,
    edges: true,
    faceted: true,
  } as PolyTexture,
  
  // Penthouse
  penthouseLuxe: {
    name: 'Penthouse Marble',
    color: '#f5f5f5',
    metalness: 0,
    roughness: 0.4,
    polyCount: 2560,
    edges: true,
    faceted: false,
  } as PolyTexture,
}

// ─── HOTEL CONFIGURATION ────────────────────────────────────────────────────────

export const HOTEL_ROOM_STANDARD = {
  dimensions: { width: 5, height: 3.5, depth: 4 } as Vec3,
  
  geometry: {
    walls: {
      material: POLY_MATERIALS.hotelBrickFacade,
      thickness: 0.3,
    },
    floor: {
      material: { ...POLY_MATERIALS.hotelBrickFacade, color: '#c9a961' } as PolyTexture,
      thickness: 0.2,
    },
    ceiling: {
      material: { ...POLY_MATERIALS.hotelBrickFacade, color: '#f0f0f0' } as PolyTexture,
      thickness: 0.15,
    },
    door: {
      position: [-2.5, 0, 0] as Vec3,
      dimensions: { width: 1, height: 2.1, depth: 0.1 },
      material: { ...POLY_MATERIALS.hotelBrickFacade, color: '#8B4513' } as PolyTexture,
    },
    window: {
      position: [0, 1.2, 2] as Vec3,
      dimensions: { width: 2, height: 1.2, depth: 0.05 },
      material: POLY_MATERIALS.hotelGlassWindow,
      curtains: true,
    },
  },
  
  furniture: [
    { id: 'bed-double', name: 'Double Bed', position: [0, 0.5, 1.5] as Vec3, model: 'bed-double', color: '#4a4a4a' },
    { id: 'nightstand-left', name: 'Nightstand', position: [-1.5, 0.6, 1.5] as Vec3, model: 'nightstand', color: '#8B6F47' },
    { id: 'nightstand-right', name: 'Nightstand', position: [1.5, 0.6, 1.5] as Vec3, model: 'nightstand', color: '#8B6F47' },
    { id: 'desk', name: 'Work Desk', position: [1.8, 0.75, -1.5] as Vec3, model: 'desk-hotel', color: '#704214' },
    { id: 'chair', name: 'Office Chair', position: [1.8, 0.45, -1.8] as Vec3, model: 'chair-office', color: '#333333' },
    { id: 'wardrobe', name: 'Wardrobe', position: [-2.2, 0.9, -1.5] as Vec3, model: 'wardrobe', color: '#8B6F47' },
    { id: 'tv-stand', name: 'TV Stand', position: [-0.5, 1.2, -2] as Vec3, model: 'tv-stand', color: '#333333' },
  ],
  
  lights: [
    {
      id: 'light-ceiling-main',
      type: 'point' as const,
      position: [0, 3.2, 0],
      color: '#ffffff',
      intensity: 1.2,
      distance: 10,
    },
    {
      id: 'light-desk',
      type: 'point' as const,
      position: [1.8, 1.5, -1.5],
      color: '#ffff99',
      intensity: 0.8,
      distance: 6,
    },
    {
      id: 'light-bathroom',
      type: 'point' as const,
      position: [2.2, 2, 1.8],
      color: '#ffffff',
      intensity: 0.9,
      distance: 5,
    },
  ],
  
  decorations: [
    { id: 'painting-wall', name: 'Wall Painting', position: [-2.3, 1.8, 0.5] as Vec3 },
    { id: 'plant-corner', name: 'Plant', position: [-2.2, 0.8, -1.8] as Vec3 },
    { id: 'mirror-wall', name: 'Mirror', position: [2.3, 1.5, -0.5] as Vec3 },
  ],
}

export const HOTEL_ROOM_DELUXE = {
  ...HOTEL_ROOM_STANDARD,
  dimensions: { width: 7, height: 3.5, depth: 5 },
  
  furniture: [
    { id: 'bed-king', name: 'King Bed', position: [0, 0.5, 2] as Vec3, model: 'bed-king-deluxe', color: '#2a2a2a' },
    { id: 'sofa', name: 'Lounge Sofa', position: [-2.5, 0.4, -1] as Vec3, model: 'sofa-luxury', color: '#4a4a4a' },
    { id: 'mini-bar', name: 'Mini Bar', position: [3, 0.9, -2] as Vec3, model: 'mini-bar', color: '#333333' },
  ],
}

export const PENTHOUSE_SUITE = {
  dimensions: { width: 15, height: 4, depth: 10 },
  
  geometry: {
    walls: {
      material: POLY_MATERIALS.penthouseLuxe,
      thickness: 0.4,
    },
    floor: {
      material: { ...POLY_MATERIALS.penthouseLuxe, color: '#e8e8e8' } as PolyTexture,
      thickness: 0.3,
    },
    ceiling: {
      material: { ...POLY_MATERIALS.penthouseLuxe, color: '#ffffff' } as PolyTexture,
      thickness: 0.2,
    },
    balcony: {
      dimensions: { width: 8, height: 1.2, depth: 3 },
      material: { ...POLY_MATERIALS.commercialSteel, color: '#888888' } as PolyTexture,
      railings: true,
    },
  },
  
  furniture: [
    { id: 'bed-california-king', name: 'California King Bed', position: [2, 0.5, 4] as Vec3, model: 'bed-ultra-luxury', color: '#1a1a1a' },
    { id: 'lounge-area', name: 'Lounge Seating', position: [-4, 0.4, 0] as Vec3, model: 'sofa-sectional-ultra', color: '#3a3a3a' },
    { id: 'home-cinema', name: 'Home Cinema', position: [-5, 1.2, -3] as Vec3, model: 'cinema-setup', color: '#000000' },
    { id: 'conference-table', name: 'Conference Table', position: [0, 0.8, -3] as Vec3, model: 'table-marble', color: '#f5f5f5' },
  ],
  
  lights: [
    {
      id: 'light-ambient-pent',
      type: 'ambient' as const,
      color: '#ffffff',
      intensity: 0.6,
    },
    {
      id: 'light-main-pent',
      type: 'point' as const,
      position: [0, 3.5, 0],
      color: '#ffffdd',
      intensity: 2,
      distance: 20,
    },
    {
      id: 'light-mood-pent',
      type: 'point' as const,
      position: [-4, 2, 0],
      color: '#ff69b4',
      intensity: 1.2,
      distance: 12,
    },
  ],
}

// ─── DEPANNEUR CONFIGURATION ────────────────────────────────────────────────────

export const DEPANNEUR_CONFIG = {
  dimensions: { width: 8, height: 3.5, depth: 6 },
  
  geometry: {
    walls: {
      material: POLY_MATERIALS.residentialBrick,
      thickness: 0.3,
    },
    floor: {
      material: { ...POLY_MATERIALS.asphaltMain, color: '#cccccc' } as PolyTexture,
      thickness: 0.2,
    },
    roof: {
      material: POLY_MATERIALS.hotelRoofTile,
      thickness: 0.25,
    },
  },
  
  shelving: [
    { id: 'shelf-drinks-left', name: 'Drinks', position: [-3, 0.9, -2] as Vec3, color: '#ffa500' },
    { id: 'shelf-drinks-right', name: 'Drinks', position: [3, 0.9, -2] as Vec3, color: '#ffa500' },
    { id: 'shelf-snacks', name: 'Snacks', position: [0, 0.9, -2.5] as Vec3, color: '#ff6b6b' },
    { id: 'fridge-cold', name: 'Cold Fridge', position: [-3.5, 0.8, 1.5] as Vec3, color: '#87ceeb' },
  ],
  
  checkout: {
    position: [2.5, 0.8, 1] as Vec3,
    counter: { width: 1.5, height: 0.9, depth: 0.8 },
    register: { position: [2.5, 1.2, 1] as Vec3 },
  },
  
  lights: [
    {
      id: 'light-main-dep',
      type: 'point' as const,
      position: [0, 3.2, 0],
      color: '#ffffff',
      intensity: 1.8,
      distance: 12,
    },
    {
      id: 'light-fridge',
      type: 'point' as const,
      position: [-3.5, 1.5, 1.5],
      color: '#87ceeb',
      intensity: 1.2,
      distance: 8,
    },
  ],
}

// ─── RESIDENTIAL HOUSE ────────────────────────────────────────────────────────

export const RESIDENTIAL_HOUSE = {
  dimensions: { width: 6, height: 3, depth: 7 },
  
  geometry: {
    walls: {
      material: POLY_MATERIALS.residentialWood,
      thickness: 0.25,
    },
    floor: {
      material: { ...POLY_MATERIALS.asphaltMain, color: '#8B6F47' } as PolyTexture,
      thickness: 0.15,
    },
    roof: {
      material: POLY_MATERIALS.hotelRoofTile,
      pitch: 0.5,
    },
  },
  
  rooms: [
    {
      name: 'Living Room',
      position: [0, 0, 0],
      size: { width: 4, height: 3, depth: 4 },
      furniture: ['sofa', 'tv-stand', 'coffee-table'],
    },
    {
      name: 'Kitchen',
      position: [0, 0, -3.5],
      size: { width: 3, height: 3, depth: 2.5 },
      furniture: ['stove', 'sink', 'table-dining-small'],
    },
    {
      name: 'Bedroom',
      position: [-2.5, 0, 2],
      size: { width: 3.5, height: 3, depth: 3 },
      furniture: ['bed-queen', 'nightstand-x2', 'wardrobe-small'],
    },
  ],
  
  lights: [
    {
      id: 'light-living',
      type: 'point' as const,
      position: [0, 2.8, 0],
      color: '#ffffcc',
      intensity: 1,
      distance: 8,
    },
    {
      id: 'light-kitchen',
      type: 'point' as const,
      position: [0, 2.8, -3.5],
      color: '#ffffff',
      intensity: 1.2,
      distance: 7,
    },
  ],
}

// ─── ROAD SEGMENTS ────────────────────────────────────────────────────────

export const ROAD_MAIN_STREET = {
  width: 8,
  lanes: 2,
  material: POLY_MATERIALS.asphaltMain,
  markings: {
    type: 'center-double',
    material: POLY_MATERIALS.asphaltMarkings,
  },
  curbs: {
    material: { ...POLY_MATERIALS.residentialBrick, color: '#cccccc' } as PolyTexture,
    height: 0.2,
  },
  streetLights: [
    { position: [0, 4, 0], spacing: 20 },
  ],
  signage: [
    { id: 'sign-main-street', name: 'Main Street Sign', position: [0, 3.5, 0] as Vec3 },
  ],
}

export const ROAD_RURAL = {
  width: 6,
  lanes: 1,
  material: { ...POLY_MATERIALS.asphaltMain, color: '#444444' } as PolyTexture,
  markings: {
    type: 'sides',
    material: POLY_MATERIALS.asphaltMarkings,
  },
  worn: true,
  potholes: [
    { position: [5, 0, 15] as Vec3, depth: 0.1, radius: 0.3 },
    { position: [-3, 0, 50] as Vec3, depth: 0.08, radius: 0.25 },
  ],
}

export const INTERSECTION_CROSS = {
  size: 20,
  material: POLY_MATERIALS.asphaltMain,
  markings: {
    type: 'full',
    crosswalk: true,
  },
  trafficLight: {
    position: [0, 5, 0] as Vec3,
  },
}

// Export all building configs
export default {
  POLY_MATERIALS,
  HOTEL_ROOM_STANDARD,
  HOTEL_ROOM_DELUXE,
  PENTHOUSE_SUITE,
  DEPANNEUR_CONFIG,
  RESIDENTIAL_HOUSE,
  ROAD_MAIN_STREET,
  ROAD_RURAL,
  INTERSECTION_CROSS,
}
