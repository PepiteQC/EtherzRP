/**
 * Système de Level of Detail (LOD) pour optimiser les performances
 * Réduit la complexité géométrique basée sur la distance à la caméra
 */

export interface LODConfig {
  high: number; // distance maximum pour LOD haute
  medium: number; // distance maximum pour LOD moyenne
  low: number; // distance maximum pour LOD basse
  veryLow: number; // distance maximum pour LOD très basse (ou culling)
}

export interface LODGeometry {
  high: BufferGeometry;
  medium: BufferGeometry;
  low: BufferGeometry;
  veryLow?: BufferGeometry;
}

// Configuration par défaut pour les distances LOD
export const DEFAULT_LOD_CONFIG: LODConfig = {
  high: 50, // 50m: géométrie complète
  medium: 150, // 150m: géométrie simplifiée
  low: 300, // 300m: géométrie très simplifiée
  veryLow: 800, // 800m: billboards ou culling
};

/**
 * Crée des géométries simplifiées pour différents niveaux de détail
 */
export class SimplificationEngine {
  static simplifyGeometry(geometry: BufferGeometry, ratio: number): BufferGeometry {
    // Simplifie une géométrie en réduisant les vertex
    const positionAttribute = geometry.getAttribute('position');
    if (!positionAttribute) return geometry;

    const positions = positionAttribute.array as Float32Array;
    const targetVertexCount = Math.floor(positions.length / 3 * ratio);

    // Utiliser une simple décimation basée sur l'index
    const newIndices: number[] = [];
    const step = Math.ceil(positions.length / 3 / targetVertexCount);

    for (let i = 0; i < positions.length / 3; i += step) {
      newIndices.push(i);
    }

    const simplified = geometry.clone();
    if (geometry.index) {
      const newIndex = new Uint32Array(newIndices);
      simplified.setIndex(new THREE.BufferAttribute(newIndex, 1));
    }

    return simplified;
  }

  static createBillboard(width: number, height: number): BufferGeometry {
    // Crée un simple quad pour représenter un bâtiment éloigné
    return new THREE.PlaneGeometry(width, height);
  }
}

/**
 * Gestionnaire d'instances LOD pour réutiliser les géométries
 */
export class LODInstanceManager {
  private lodCache = new Map<string, LODGeometry>();
  private lodConfig: LODConfig;

  constructor(config: Partial<LODConfig> = {}) {
    this.lodConfig = { ...DEFAULT_LOD_CONFIG, ...config };
  }

  getLODGeometry(key: string, baseGeometry: BufferGeometry): LODGeometry {
    if (this.lodCache.has(key)) {
      return this.lodCache.get(key)!;
    }

    const lodGeo: LODGeometry = {
      high: baseGeometry,
      medium: SimplificationEngine.simplifyGeometry(baseGeometry, 0.5),
      low: SimplificationEngine.simplifyGeometry(baseGeometry, 0.25),
    };

    this.lodCache.set(key, lodGeo);
    return lodGeo;
  }

  getConfig(): LODConfig {
    return this.lodConfig;
  }

  clear(): void {
    this.lodCache.forEach((lod) => {
      lod.high.dispose();
      lod.medium.dispose();
      lod.low.dispose();
      lod.veryLow?.dispose();
    });
    this.lodCache.clear();
  }
}

export default LODInstanceManager;
