/**
 * AssetManifest — le contrat qu'un asset respecte avant d'être intégré
 * à la scène EtherWorld (mode ACTIVE).
 */

export type AssetStatus =
  | 'GENERATED'
  | 'VALIDATING'
  | 'PREVIEW_READY'
  | 'USER_APPROVED'
  | 'QUARANTINE'
  | 'GAME_TESTED'
  | 'ACTIVE'
  | 'REJECTED';

export interface AssetGeometry {
  triangles:    number;
  vertices:     number;
  openEdges:    number;     // 0 = manifold, >0 = trou
  lodCount:     number;     // ≥1
  hasRig:       boolean;
  hasCollider:  boolean;
  bboxMin:      [number, number, number];
  bboxMax:      [number, number, number];
}

export interface AssetTexture {
  resolution:   512 | 1024 | 2048 | 4096;
  materialCount: number;
  totalPixels:  number;
  formats:      Array<'png' | 'jpg' | 'ktx2' | 'webp'>;
}

export interface AssetGame {
  collider:     'cuboid' | 'convexHull' | 'trimesh' | 'none';
  category:     string;          // ex: 'hotel', 'street', 'character'
  defaultScale: number;
  defaultRotation?: [number, number, number];
  tags:         string[];
}

export interface AssetConfidence {
  shape:     number;       // 0..1
  materials: number;       // 0..1
  textures:  number;       // 0..1
  overall:   number;       // 0..1
}

export interface AssetManifest {
  id:          string;
  filename:    string;       // ex: hotel_chair_001.glb
  status:      AssetStatus;
  createdAt:   number;
  updatedAt:   number;
  version:     number;

  source: {
    type:       'photo' | 'photoset' | 'procedural';
    imageCount: number;
    images:     string[];      // chemins relatifs
  };

  reconstruction: {
    mode:       import('./ReconstructionMode').ReconstructionMode;
    subject:    import('./SubjectType').SubjectType;
    notes:      string[];
  };

  geometry:   AssetGeometry;
  textures:   AssetTexture;
  game:       AssetGame;
  confidence: AssetConfidence;

  history: Array<{
    at:     number;
    from:   AssetStatus;
    to:     AssetStatus;
    actor:  string;
    note?:  string;
  }>;
}

/**
 * Helper pour créer un manifest à partir d'un nom + mode.
 */
export function createEmptyManifest(
  id: string,
  filename: string,
  mode: import('./ReconstructionMode').ReconstructionMode,
  subject: import('./SubjectType').SubjectType,
): AssetManifest {
  const now = Date.now();
  return {
    id,
    filename,
    status: 'GENERATED',
    createdAt: now,
    updatedAt: now,
    version: 1,
    source: { type: 'photo', imageCount: 0, images: [] },
    reconstruction: { mode, subject, notes: [] },
    geometry: {
      triangles: 0, vertices: 0, openEdges: 0,
      lodCount: 1, hasRig: false, hasCollider: false,
      bboxMin: [0, 0, 0], bboxMax: [0, 0, 0],
    },
    textures: { resolution: 1024, materialCount: 0, totalPixels: 0, formats: [] },
    game: { collider: 'cuboid', category: 'misc', defaultScale: 1, tags: [] },
    confidence: { shape: 0, materials: 0, textures: 0, overall: 0 },
    history: [{ at: now, from: 'GENERATED', to: 'GENERATED', actor: 'system', note: 'created' }],
  };
}
