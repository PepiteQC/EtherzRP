/**
 * src/world/data/WorldDataManager.ts
 * 
 * Moteur Maître d'Urbanisme AAA et de Requêtes Tuilées pour la Route 138 (Production AAA).
 * Relie notre Cadastre In-Character (AuthenticQuebecHighway138Layout) avec le ChunkManager React Three Fiber.
 * Préserve 100% de la fluidité 60 FPS en ne chargeant que les structures de la tuile active.
 */

import { BuildingConfig } from '../buildings/BuildingSystem';
import AuthenticQuebecHighway138Layout from './AuthenticQuebecHighway138Layout';
import type { PortneufRoad } from './PortneufGeographicData';

/**
 * Pôles Majeurs pour notre Navigation GPS et HUD de Diagnostic
 */
export const GEO_POINTS = {
  QUEBEC_WEST:    { x: 0,     z: 0 },
  NEUVIlLE:       { x: -1500, z: -200 },
  DONNACONA:      { x: -2800, z: -300 },
  CAP_SANTE:      { x: -3600, z: -350 },
  PORTNEUF_DOCKS: { x: -4600, z: -400 },
  DESCHAMBAUlT:   { x: -5800, z: -450 },
  GRONDINES:      { x: -6900, z: -500 },
  TROIS_RIVIERES: { x: -8500, z: -600 },
};

export interface CityChunkData {
  chunkKey: string;
  buildings: BuildingConfig[];
  roads: PortneufRoad[];
}

export class WorldDataManager {
  private chunkCache = new Map<string, CityChunkData>();
  private allArchitecturalPool: BuildingConfig[];
  private allRoadsPool: PortneufRoad[];

  constructor() {
    // Initialisation synchrone du pool maître authentique
    this.allArchitecturalPool = AuthenticQuebecHighway138Layout.getAllMasterEntities();
    this.allRoadsPool         = AuthenticQuebecHighway138Layout.getCoherentHighwayNetwork();
  }

  /**
   * Moteur de requête de tuiles spatiales (256 x 256 unités)
   */
  getWorldData(worldX: number, worldZ: number): CityChunkData {
    const chunkX = Math.floor(worldX / 256);
    const chunkZ = Math.floor(worldZ / 256);
    const cacheKey = `chunk_${chunkX}_${chunkZ}`;

    if (this.chunkCache.has(cacheKey)) {
      return this.chunkCache.get(cacheKey)!;
    }

    // Calcul du centre de la tuile 3x3 courante
    const chunkCenterX = chunkX * 256 + 128;
    const chunkCenterZ = chunkZ * 256 + 128;

    // Filtration stricte des structures situées dans le rayon d'affichage actif (380 unités)
    const activeBuildings = this.allArchitecturalPool.filter((entity) => {
      const dist = Math.sqrt(
        Math.pow(entity.position[0] - chunkCenterX, 2) + Math.pow(entity.position[2] - chunkCenterZ, 2)
      );
      return dist < 380;
    });

    const data: CityChunkData = {
      chunkKey: cacheKey,
      buildings: activeBuildings,
      roads: this.allRoadsPool, // Renvoie le réseau CatmullRom Bézier authentique de 10 km
    };

    this.chunkCache.set(cacheKey, data);
    return data;
  }

  getEntityById(id: string): BuildingConfig | undefined {
    return this.allArchitecturalPool.find(e => e.id === id);
  }
}

export default WorldDataManager;
