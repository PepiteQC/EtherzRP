// src/hotel3d/constants/dimensions.ts

/**
 * PLAN DIRECTEUR — Dimensions architecturales définitives.
 * 
 * Hôtel : 3 étages × 10 chambres = 30 chambres
 * 5 chambres par côté d'un corridor central
 * RDC = lobby/accueil + hall central élargi
 * Étages 1-2-3 = chambres
 * Escaliers protégés aux extrémités
 * Ascenseur aligné verticalement au centre
 * Dépanneur 100% séparé
 */

// ─── HÔTEL ───────────────────────────────────────────────────────────────────

export const HOTEL = {
  /** Nombre d'étages de chambres (au-dessus du RDC) */
  chamberFloors: 3,
  /** Le RDC est un étage de services (lobby, hall, réception) */
  totalLevels: 4, // RDC + 3 étages
  roomsPerFloor: 10,
  roomsPerSide: 5,
  totalRooms: 30,
  /** Hauteur libre d'un étage */
  floorHeight: 3.2,
  /** Épaisseur de la dalle */
  slabThickness: 0.30,
  /** Hauteur d'un niveau complet */
  get levelHeight(): number {
    return this.floorHeight + this.slabThickness;
  },
  /** Hauteur totale du bâtiment */
  get totalHeight(): number {
    return this.totalLevels * this.levelHeight + this.slabThickness;
  },
  /** Y de base du premier étage de chambres (au-dessus du RDC) */
  get firstChamberY(): number {
    return this.levelHeight; // un niveau au-dessus du sol
  },
} as const;

// ─── CHAMBRE ─────────────────────────────────────────────────────────────────

export const ROOM = {
  width: 4.2,
  depth: 7.0,
  wallHeight: 3.0,
  wallThickness: 0.15,
  extWallThickness: 0.25,
} as const;

export const ROOM_ACCESSIBLE = {
  ...ROOM,
  width: 4.8,
  bedClearance: 0.90,
  doorWidth: 0.92,
} as const;

// ─── SALLE DE BAIN ───────────────────────────────────────────────────────────

export const BATHROOM = {
  width: 2.4,
  depth: 2.8,
  offsetFromBack: 0.0,
} as const;

// ─── CORRIDOR ────────────────────────────────────────────────────────────────

export const CORRIDOR = {
  /** Largeur du corridor dans les étages de chambres */
  width: 2.4,
  height: 2.8,
} as const;

// ─── HALL CENTRAL (RDC) ──────────────────────────────────────────────────────

export const HALL = {
  /** Largeur du hall central au RDC — plus généreux que le corridor */
  width: 4.5,
  /** Profondeur du hall (relie le lobby au noyau vertical) */
  depth: 8.0,
  /** Hauteur du hall (même que le RDC) */
  height: 3.2,
} as const;

// ─── BÂTIMENT PRINCIPAL ──────────────────────────────────────────────────────

export const BUILDING = {
  /** Longueur = 5 chambres × largeur + murs + escaliers */
  get length(): number {
    return HOTEL.roomsPerSide * ROOM.width
      + 2 * ROOM.extWallThickness
      + 2 * STAIRWELL.width;
  },
  /** Profondeur = corridor + 2 × profondeur chambre + murs */
  get width(): number {
    return CORRIDOR.width + 2 * ROOM.depth + 2 * ROOM.extWallThickness;
  },
  get height(): number {
    return HOTEL.totalHeight;
  },
  /** Longueur de l'aile de chambres seulement */
  get chamberWingLength(): number {
    return HOTEL.roomsPerSide * ROOM.width;
  },
} as const;

// ─── ESCALIERS ───────────────────────────────────────────────────────────────

export const STAIRWELL = {
  width: 3.0,
  depth: 3.5,
  fireWallThickness: 0.20,
} as const;

// ─── ASCENSEUR ───────────────────────────────────────────────────────────────

export const ELEVATOR = {
  shaftWidth: 2.4,
  shaftDepth: 2.4,
  carWidth: 2.0,
  carDepth: 2.0,
  carHeight: 2.7,
  /** Distance par rapport à la chambre la plus proche */
  bufferFromRoom: 1.0,
} as const;

// ─── LOBBY ───────────────────────────────────────────────────────────────────

export const LOBBY = {
  /** Largeur = même que le bâtiment principal */
  get width(): number {
    return BUILDING.width + 2.0;
  },
  depth: 12.0,
  /** Hauteur du lobby (1.5× un étage pour l'effet grand volume) */
  get height(): number {
    return HOTEL.floorHeight * 1.5;
  },
  /** Position Z du lobby (devant le bâtiment) */
  get offsetZ(): number {
    return BUILDING.width / 2 + this.depth / 2;
  },
} as const;

// ─── LOCAUX TECHNIQUES ───────────────────────────────────────────────────────

export const SERVICE = {
  linenRoom: { width: 2.8, depth: 2.4 },
  janitorCloset: { width: 1.8, depth: 1.6 },
  networkRoom: { width: 2.0, depth: 1.6 },
  securityRoom: { width: 2.4, depth: 2.0 },
  luggageRoom: { width: 2.0, depth: 2.0 },
} as const;

// ─── FENÊTRES ────────────────────────────────────────────────────────────────

export const WINDOW = {
  width: 1.4,
  height: 1.6,
  sillHeight: 0.85,
  frameThickness: 0.06,
  glassThickness: 0.02,
} as const;

// ─── PORTES ──────────────────────────────────────────────────────────────────

export const DOOR = {
  standard: { width: 0.85, height: 2.10, thickness: 0.045 },
  accessible: { width: 0.92, height: 2.10, thickness: 0.045 },
  fireDoor: { width: 0.90, height: 2.10, thickness: 0.055 },
  entrance: { width: 1.80, height: 2.40, thickness: 0.06 },
  lobby: { width: 3.0, height: 2.60, thickness: 0.08 },
} as const;

// ─── DÉPANNEUR (100% séparé) ─────────────────────────────────────────────────

export const DEPANNEUR = {
  width: 14.0,
  depth: 10.0,
  height: 4.5,
  wallThickness: 0.22,
  separationFromHotel: 8.0,
  get positionX(): number {
    return BUILDING.length / 2 + this.separationFromHotel + this.width / 2;
  },
  positionZ: 0,
} as const;

// ─── PARKING ─────────────────────────────────────────────────────────────────

export const PARKING = {
  spotWidth: 2.7,
  spotDepth: 5.5,
  accessibleSpotWidth: 3.8,
  aisleWidth: 6.0,
} as const;

// ─── MOBILIER CHAMBRE ────────────────────────────────────────────────────────

export const FURNITURE = {
  bed: {
    queen: { width: 1.60, depth: 2.10, height: 0.55 },
    king: { width: 1.93, depth: 2.10, height: 0.55 },
    single: { width: 0.90, depth: 2.10, height: 0.55 },
  },
  desk: { width: 1.20, depth: 0.60, height: 0.75 },
  chair: { width: 0.50, depth: 0.50, height: 0.85 },
  wardrobe: { width: 1.20, depth: 0.60, height: 2.10 },
  luggageRack: { width: 0.70, depth: 0.50, height: 0.50 },
  minibar: { width: 0.50, depth: 0.45, height: 0.55 },
  safe: { width: 0.42, depth: 0.35, height: 0.30 },
  nightstand: { width: 0.45, depth: 0.40, height: 0.55 },
} as const;