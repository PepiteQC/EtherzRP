/**
 * Système de Chunking spatial pour optimiser le rendu de grandes cartes
 * Divise le monde en tuiles et gère leur chargement/déchargement
 */

import { BuildingConfig, Building3D, MaterialLibrary } from './BuildingSystem';

export interface Chunk {
  x: number;
  z: number;
  key: string;
  buildings: Building3D[];
  terrain?: THREE.Mesh;
  roads?: THREE.Mesh[];
  isLoaded: boolean;
  isVisible: boolean;
  lastAccessed: number;
}

export interface ChunkConfig {
  size: number; // Taille d'une tuile en unités de jeu
  loadDistance: number; // Distance de chargement à partir de la caméra
  unloadDistance: number; // Distance de déchargement
  maxChunksInMemory: number; // Nombre max de chunks en mémoire
}

export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  size: 256, // 256 unités = 1 chunk
  loadDistance: 768, // Charger les chunks dans un rayon de 768 unités
  unloadDistance: 1024, // Décharger les chunks au-delà de 1024 unités
  maxChunksInMemory: 9, // Garder au max 9 chunks (3x3 grid)
};

/**
 * Gestionnaire de chunks pour le world
 */
export class ChunkManager {
  private chunks = new Map<string, Chunk>();
  private config: ChunkConfig;
  private materialLib: MaterialLibrary;
  private buildingDataMap = new Map<string, BuildingConfig[]>();
  private activeChunkCoords = new Set<string>();

  constructor(config: Partial<ChunkConfig> = {}, materialLib: MaterialLibrary) {
    this.config = { ...DEFAULT_CHUNK_CONFIG, ...config };
    this.materialLib = materialLib;
  }

  /**
   * Enregistrer les bâtiments pour un chunk spécifique
   */
  registerBuildingData(chunkKey: string, buildings: BuildingConfig[]): void {
    this.buildingDataMap.set(chunkKey, buildings);
  }

  /**
   * Obtenir les coordonnées de chunk pour une position dans le monde
   */
  getChunkCoords(worldX: number, worldZ: number): { x: number; z: number } {
    return {
      x: Math.floor(worldX / this.config.size),
      z: Math.floor(worldZ / this.config.size),
    };
  }

  /**
   * Générer une clé de chunk unique
   */
  private getChunkKey(x: number, z: number): string {
    return `chunk_${x}_${z}`;
  }

  /**
   * Charger un chunk
   */
  loadChunk(x: number, z: number): Chunk {
    const key = this.getChunkKey(x, z);

    if (this.chunks.has(key)) {
      const chunk = this.chunks.get(key)!;
      chunk.lastAccessed = Date.now();
      return chunk;
    }

    const chunk: Chunk = {
      x,
      z,
      key,
      buildings: [],
      roads: [],
      isLoaded: false,
      isVisible: false,
      lastAccessed: Date.now(),
    };

    // Charger les bâtiments depuis le registre
    const buildingConfigs = this.buildingDataMap.get(key) || [];
    chunk.buildings = buildingConfigs.map((config) => {
      const building = new Building3D(config, this.materialLib);
      building.createMesh();
      return building;
    });

    chunk.isLoaded = true;
    this.chunks.set(key, chunk);
    this.activeChunkCoords.add(key);

    // Gestion de la mémoire: décharger les chunks les plus anciens si trop en mémoire
    if (this.chunks.size > this.config.maxChunksInMemory) {
      this.unloadOldestChunk();
    }

    return chunk;
  }

  /**
   * Décharger un chunk
   */
  unloadChunk(x: number, z: number): void {
    const key = this.getChunkKey(x, z);
    const chunk = this.chunks.get(key);

    if (chunk) {
      chunk.buildings.forEach((building) => building.dispose());
      chunk.roads?.forEach((road) => {
        road.geometry.dispose();
        if (Array.isArray(road.material)) {
          road.material.forEach((m) => m.dispose());
        } else {
          road.material.dispose();
        }
      });

      this.chunks.delete(key);
      this.activeChunkCoords.delete(key);
    }
  }

  /**
   * Décharger le chunk le plus ancien
   */
  private unloadOldestChunk(): void {
    let oldest: { key: string; chunk: Chunk } | null = null;

    this.chunks.forEach((chunk, key) => {
      if (!oldest || chunk.lastAccessed < oldest.chunk.lastAccessed) {
        oldest = { key, chunk };
      }
    });

    if (oldest) {
      const coords = this.parseChunkKey(oldest.key);
      if (coords) {
        this.unloadChunk(coords.x, coords.z);
      }
    }
  }

  /**
   * Parser une clé de chunk pour en extraire les coordonnées
   */
  private parseChunkKey(key: string): { x: number; z: number } | null {
    const match = key.match(/chunk_(-?\d+)_(-?\d+)/);
    if (match) {
      return { x: parseInt(match[1], 10), z: parseInt(match[2], 10) };
    }
    return null;
  }

  /**
   * Obtenir tous les chunks actifs
   */
  getActiveChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Mettre à jour la visibilité des chunks basée sur la position caméra
   */
  updateVisibility(cameraX: number, cameraZ: number): void {
    const cameraCoordsKey = this.getChunkKey(cameraX, cameraZ);
    const centerCoords = this.parseChunkKey(cameraCoordsKey);

    if (!centerCoords) return;

    // Calculer les chunks à charger basées sur la distance de chargement
    const chunksToLoad: Array<{ x: number; z: number }> = [];
    const maxChunkDistance = Math.ceil(this.config.loadDistance / this.config.size);

    for (let dx = -maxChunkDistance; dx <= maxChunkDistance; dx++) {
      for (let dz = -maxChunkDistance; dz <= maxChunkDistance; dz++) {
        const chunkX = centerCoords.x + dx;
        const chunkZ = centerCoords.z + dz;
        const distance = Math.sqrt(dx * dx + dz * dz) * this.config.size;

        if (distance <= this.config.loadDistance) {
          chunksToLoad.push({ x: chunkX, z: chunkZ });
        }
      }
    }

    // Charger les nouveaux chunks
    chunksToLoad.forEach(({ x, z }) => {
      const key = this.getChunkKey(x, z);
      if (!this.chunks.has(key)) {
        this.loadChunk(x, z);
      }
      const chunk = this.chunks.get(key);
      if (chunk) {
        chunk.isVisible = true;
      }
    });

    // Marquer les chunks comme non visibles
    this.chunks.forEach((chunk) => {
      const distance =
        Math.sqrt(
          Math.pow(chunk.x - centerCoords.x, 2) + Math.pow(chunk.z - centerCoords.z, 2)
        ) * this.config.size;
      chunk.isVisible = distance <= this.config.loadDistance;

      if (distance > this.config.unloadDistance) {
        this.unloadChunk(chunk.x, chunk.z);
      }
    });
  }

  /**
   * Obtenir un chunk spécifique
   */
  getChunk(x: number, z: number): Chunk | null {
    const key = this.getChunkKey(x, z);
    return this.chunks.get(key) || null;
  }

  /**
   * Effacer tous les chunks
   */
  clear(): void {
    this.chunks.forEach((chunk, key) => {
      const coords = this.parseChunkKey(key);
      if (coords) {
        this.unloadChunk(coords.x, coords.z);
      }
    });
  }

  /**
   * Obtenir les statistiques du gestionnaire
   */
  getStats(): {
    totalChunks: number;
    loadedChunks: number;
    visibleChunks: number;
    totalBuildings: number;
  } {
    let totalBuildings = 0;
    let visibleChunks = 0;

    this.chunks.forEach((chunk) => {
      totalBuildings += chunk.buildings.length;
      if (chunk.isVisible) visibleChunks++;
    });

    return {
      totalChunks: this.chunks.size,
      loadedChunks: this.chunks.size,
      visibleChunks,
      totalBuildings,
    };
  }
}

export default ChunkManager;
