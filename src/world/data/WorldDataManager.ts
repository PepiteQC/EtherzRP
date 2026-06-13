/**
 * Données géospatiales pour EtherWorld RP
 * Coordonnées calibrées pour Québec, Trois-Rivières, Route 138 et villages de Portneuf
 * 
 * Système de coordonnées:
 * - 1 unité = ~10 mètres réels
 * - Origine (0, 0) = Centre-ville de Québec
 * - X = Ouest (-) / Est (+)
 * - Z = Sud (-) / Nord (+)
 */

import { BuildingConfig, BuildingType, TextureStyle } from '../buildings/BuildingSystem';

/**
 * Points d'intérêt géographiques
 */
export const GEO_POINTS = {
  // Centre de Québec
  QUEBEC_CENTER: { x: 0, z: 0 },

  // Trois-Rivières (environ 140 km au nord-est)
  TROIS_RIVIERES_CENTER: { x: 14, z: 140 },

  // Route 138 (axe nord-sud)
  ROUTE_138_START: { x: 10, z: -100 },
  ROUTE_138_END: { x: 10, z: 500 },

  // Villages du comté de Portneuf (nord de Québec)
  PORTNEUF: { x: -30, z: 80 },
  SAINT_RAYMOND: { x: -40, z: 100 },
  SAINT_GABRIEL_DE_VALCARTIER: { x: -20, z: 50 },
  STONEHAM_TEWKESBURY: { x: 10, z: 60 },
  DONNACONA: { x: 40, z: 50 },
  NEUVILLE: { x: 50, z: 30 },
};

/**
 * Configuration d'un chunk de ville
 */
export interface CityChunkData {
  chunkKey: string;
  buildings: BuildingConfig[];
  roads: RoadConfig[];
}

export interface RoadConfig {
  name: string;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  width: number;
  type: 'highway' | 'street' | 'road';
  lanes?: number;
}

/**
 * Générateur procédural de bâtiments pour les chunks
 */
class BuildingGenerator {
  private buildingCounter = 0;

  generateResidentialBlock(
    centerX: number,
    centerZ: number,
    blockSize: number,
    density: number
  ): BuildingConfig[] {
    const buildings: BuildingConfig[] = [];
    const buildingsPerRow = Math.floor(density * 3);
    const spacing = blockSize / (buildingsPerRow + 1);

    for (let i = 0; i < buildingsPerRow; i++) {
      for (let j = 0; j < buildingsPerRow; j++) {
        const x = centerX - blockSize / 2 + spacing * (i + 1);
        const z = centerZ - blockSize / 2 + spacing * (j + 1);

        buildings.push({
          id: `building_res_${this.buildingCounter++}`,
          type: BuildingType.RESIDENTIAL,
          position: [x, 0, z],
          rotation: [0, Math.random() * Math.PI * 2, 0],
          scale: [1, 1, 1],
          height: 8 + Math.random() * 8, // 8-16 unités (80-160m)
          width: 10,
          depth: 12,
          textures: [
            TextureStyle.BRICK,
            TextureStyle.CONCRETE,
            TextureStyle.WOOD,
          ][Math.floor(Math.random() * 3)] as TextureStyle,
          roofType: ['flat', 'pitched'][Math.floor(Math.random() * 2)] as any,
          windowCount: {
            x: 3 + Math.floor(Math.random() * 2),
            y: 2 + Math.floor(Math.random() * 2),
          },
          doorCount: 1,
          metadata: {
            district: 'residential',
            builtYear: 1980 + Math.floor(Math.random() * 40),
          },
        });
      }
    }

    return buildings;
  }

  generateCommercialStrip(
    centerX: number,
    centerZ: number,
    length: number
  ): BuildingConfig[] {
    const buildings: BuildingConfig[] = [];
    const spacing = 25;
    const count = Math.floor(length / spacing);

    for (let i = 0; i < count; i++) {
      const x = centerX + spacing * i - length / 2;
      const z = centerZ;

      buildings.push({
        id: `building_com_${this.buildingCounter++}`,
        type: BuildingType.COMMERCIAL,
        position: [x, 0, z],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        height: 10 + Math.random() * 5,
        width: 15,
        depth: 20,
        textures: [TextureStyle.GLASS, TextureStyle.CONCRETE][Math.floor(Math.random() * 2)] as TextureStyle,
        roofType: 'flat',
        windowCount: { x: 4, y: 2 },
        doorCount: 2,
        metadata: {
          district: 'commercial',
          businessTypes: ['retail', 'restaurant', 'office'],
        },
      });
    }

    return buildings;
  }

  generateIndustrialZone(
    centerX: number,
    centerZ: number,
    areaSize: number
  ): BuildingConfig[] {
    const buildings: BuildingConfig[] = [];
    const count = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const radius = (areaSize / 2) * 0.7;
      const x = centerX + Math.cos(angle) * radius;
      const z = centerZ + Math.sin(angle) * radius;

      buildings.push({
        id: `building_ind_${this.buildingCounter++}`,
        type: BuildingType.INDUSTRIAL,
        position: [x, 0, z],
        rotation: [0, Math.random() * Math.PI * 2, 0],
        scale: [1, 1, 1],
        height: 8,
        width: 30 + Math.random() * 20,
        depth: 40 + Math.random() * 20,
        textures: [TextureStyle.CONCRETE, TextureStyle.METAL][Math.floor(Math.random() * 2)] as TextureStyle,
        roofType: 'flat',
        windowCount: { x: 2, y: 1 },
        metadata: {
          district: 'industrial',
          type: ['factory', 'warehouse', 'storage'][Math.floor(Math.random() * 3)],
        },
      });
    }

    return buildings;
  }
}

/**
 * Gestionnaire des données de monde pour EtherWorld RP
 */
export class WorldDataManager {
  private generator = new BuildingGenerator();
  private chunkCache = new Map<string, CityChunkData>();

  /**
   * Générer les données pour un chunk de Québec
   */
  generateQuebecChunk(chunkX: number, chunkZ: number): CityChunkData {
    const cacheKey = `quebec_${chunkX}_${chunkZ}`;

    if (this.chunkCache.has(cacheKey)) {
      return this.chunkCache.get(cacheKey)!;
    }

    const chunkCenterX = chunkX * 256 + 128;
    const chunkCenterZ = chunkZ * 256 + 128;
    const buildings: BuildingConfig[] = [];

    // Districtcivique (centre-ville)
    if (chunkX === 0 && chunkZ === 0) {
      buildings.push(
        ...this.generator.generateCommercialStrip(chunkCenterX, chunkCenterZ, 100)
      );
    }

    // Quartiers résidentiels
    if (Math.abs(chunkX) <= 1 && Math.abs(chunkZ) <= 1) {
      buildings.push(
        ...this.generator.generateResidentialBlock(chunkCenterX, chunkCenterZ, 150, 0.8)
      );
    }

    // Zones industrielles
    if (chunkX < -1 || chunkZ < -1) {
      buildings.push(
        ...this.generator.generateIndustrialZone(chunkCenterX, chunkCenterZ, 200)
      );
    }

    const data: CityChunkData = {
      chunkKey: cacheKey,
      buildings,
      roads: [
        {
          name: 'Main Street',
          startX: chunkCenterX - 128,
          startZ: chunkCenterZ,
          endX: chunkCenterX + 128,
          endZ: chunkCenterZ,
          width: 15,
          type: 'street',
          lanes: 2,
        },
      ],
    };

    this.chunkCache.set(cacheKey, data);
    return data;
  }

  /**
   * Générer les données pour un chunk de Trois-Rivières
   */
  generateTroisRivieresChunk(chunkX: number, chunkZ: number): CityChunkData {
    const cacheKey = `trois_rivieres_${chunkX}_${chunkZ}`;

    if (this.chunkCache.has(cacheKey)) {
      return this.chunkCache.get(cacheKey)!;
    }

    const chunkCenterX = GEO_POINTS.TROIS_RIVIERES_CENTER.x + chunkX * 256 + 128;
    const chunkCenterZ = GEO_POINTS.TROIS_RIVIERES_CENTER.z + chunkZ * 256 + 128;
    const buildings: BuildingConfig[] = [];

    // Centre-ville de Trois-Rivières
    if (chunkX === 0 && chunkZ === 0) {
      buildings.push(
        ...this.generator.generateCommercialStrip(chunkCenterX, chunkCenterZ, 80)
      );
    }

    // Banlieue
    buildings.push(
      ...this.generator.generateResidentialBlock(chunkCenterX, chunkCenterZ, 120, 0.6)
    );

    const data: CityChunkData = {
      chunkKey: cacheKey,
      buildings,
      roads: [],
    };

    this.chunkCache.set(cacheKey, data);
    return data;
  }

  /**
   * Générer les données pour la Route 138
   */
  generateRoute138Segment(segmentIndex: number): CityChunkData {
    const cacheKey = `route_138_${segmentIndex}`;

    if (this.chunkCache.has(cacheKey)) {
      return this.chunkCache.get(cacheKey)!;
    }

    const startX = GEO_POINTS.ROUTE_138_START.x;
    const startZ = GEO_POINTS.ROUTE_138_START.z + segmentIndex * 256;
    const chunkCenterX = startX;
    const chunkCenterZ = startZ + 128;

    const buildings: BuildingConfig[] = [];

    // Ajouter des petits villages le long de la route
    if (segmentIndex % 3 === 0) {
      buildings.push(
        ...this.generator.generateCommercialStrip(
          chunkCenterX + 30,
          chunkCenterZ,
          60
        )
      );
    }

    // Petits bâtiments résidentiels
    buildings.push(
      ...this.generator.generateResidentialBlock(
        chunkCenterX - 40,
        chunkCenterZ,
        80,
        0.3
      )
    );

    const data: CityChunkData = {
      chunkKey: cacheKey,
      buildings,
      roads: [
        {
          name: 'Route 138',
          startX: chunkCenterX - 10,
          startZ: chunkCenterZ - 128,
          endX: chunkCenterX - 10,
          endZ: chunkCenterZ + 128,
          width: 20,
          type: 'highway',
          lanes: 4,
        },
      ],
    };

    this.chunkCache.set(cacheKey, data);
    return data;
  }

  /**
   * Générer les données pour les villages de Portneuf
   */
  generatePortneufVillage(villageKey: string): CityChunkData {
    const cacheKey = `portneuf_${villageKey}`;

    if (this.chunkCache.has(cacheKey)) {
      return this.chunkCache.get(cacheKey)!;
    }

    const centerX = GEO_POINTS[villageKey as keyof typeof GEO_POINTS]?.x || 0;
    const centerZ = GEO_POINTS[villageKey as keyof typeof GEO_POINTS]?.z || 0;

    const buildings: BuildingConfig[] = [];

    // Centre du village
    buildings.push(
      ...this.generator.generateCommercialStrip(centerX, centerZ, 40)
    );

    // Maisons autour
    buildings.push(
      ...this.generator.generateResidentialBlock(centerX, centerZ - 60, 100, 0.5)
    );

    const data: CityChunkData = {
      chunkKey: cacheKey,
      buildings,
      roads: [
        {
          name: `Main Road - ${villageKey}`,
          startX: centerX - 50,
          startZ: centerZ,
          endX: centerX + 50,
          endZ: centerZ,
          width: 12,
          type: 'road',
          lanes: 2,
        },
      ],
    };

    this.chunkCache.set(cacheKey, data);
    return data;
  }

  /**
   * Obtenir les données pour une région du monde
   */
  getWorldData(
    worldX: number,
    worldZ: number
  ): CityChunkData {
    const chunkX = Math.floor(worldX / 256);
    const chunkZ = Math.floor(worldZ / 256);

    // Déterminer quelle région/ville
    const distToQuebec = Math.sqrt(chunkX * chunkX + chunkZ * chunkZ);
    const distToTroisRivieres = Math.sqrt(
      Math.pow(chunkX - GEO_POINTS.TROIS_RIVIERES_CENTER.x / 256, 2) +
        Math.pow(chunkZ - GEO_POINTS.TROIS_RIVIERES_CENTER.z / 256, 2)
    );

    if (distToQuebec < 5) {
      return this.generateQuebecChunk(chunkX, chunkZ);
    } else if (distToTroisRivieres < 3) {
      return this.generateTroisRivieresChunk(chunkX, chunkZ);
    } else if (
      worldX > GEO_POINTS.ROUTE_138_START.x - 100 &&
      worldX < GEO_POINTS.ROUTE_138_START.x + 100 &&
      worldZ > GEO_POINTS.ROUTE_138_START.z &&
      worldZ < GEO_POINTS.ROUTE_138_END.z
    ) {
      const segmentIndex = Math.floor((worldZ - GEO_POINTS.ROUTE_138_START.z) / 256);
      return this.generateRoute138Segment(segmentIndex);
    }

    // Vérifier si on est près d'un village Portneuf
    for (const [villageKey, coords] of Object.entries(GEO_POINTS)) {
      if (villageKey.includes('PORTNEUF') || villageKey.includes('SAINT') || villageKey.includes('STONEHAM') || villageKey.includes('DONNACONA') || villageKey.includes('NEUVILLE')) {
        const dist = Math.sqrt(
          Math.pow(worldX - coords.x, 2) + Math.pow(worldZ - coords.z, 2)
        );
        if (dist < 150) {
          return this.generatePortneufVillage(villageKey);
        }
      }
    }

    // Région rurale/forêt par défaut
    return {
      chunkKey: `rural_${chunkX}_${chunkZ}`,
      buildings: [],
      roads: [],
    };
  }
}

export default WorldDataManager;
