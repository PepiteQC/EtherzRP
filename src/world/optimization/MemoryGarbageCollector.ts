/**
 * src/world/optimization/MemoryGarbageCollector.ts
 * 
 * Nettoyeur Automatisé de Mémoire GPU & WebGL (Garbage Collector).
 * Conçu pour éliminer les fuites de VRAM (textures, géométries orphelines et matériaux Three.js).
 * Fait chuter drastiquement la consommation mémoire lors de la navigation entre tuiles et intérieurs.
 */

import * as THREE from 'three';

export interface MemoryCleanupStats {
  disposedGeometries: number;
  disposedMaterials: number;
  disposedTextures: number;
  reclaimedRAM: string;
}

export class WebGLMemoryCleaner {
  /**
   * Traverse un objet Three.js (Scene, Group, Mesh) et dispose proprement de l'intégralité
   * des géométries, de ses buffers d'attributs, et de ses matériaux/textures associés.
   */
  static purgeObject3D(object: THREE.Object3D, cleanTextures = false): MemoryCleanupStats {
    let geometriesCount = 0;
    let materialsCount  = 0;
    let texturesCount   = 0;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
        // 1. Purge de la Géométrie
        if (child.geometry) {
          child.geometry.dispose();
          geometriesCount++;
        }

        // 2. Purge du ou des Matériaux
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          
          materials.forEach((mat) => {
            if (mat) {
              mat.dispose();
              materialsCount++;

              // 3. Purge des Textures associées (Maps) si autorisé
              if (cleanTextures) {
                const standardMat = mat as THREE.MeshStandardMaterial;
                const texMaps = [
                  standardMat.map,
                  standardMat.roughnessMap,
                  standardMat.metalnessMap,
                  standardMat.normalMap,
                  standardMat.emissiveMap,
                  standardMat.alphaMap,
                  standardMat.aoMap,
                ];

                texMaps.forEach((tex) => {
                  if (tex && tex instanceof THREE.Texture) {
                    tex.dispose();
                    texturesCount++;
                  }
                });
              }
            }
          });
        }
      }
    });

    // Estimation de la mémoire vive GPU libérée
    const reclaimedApprox = Math.round((geometriesCount * 0.05 + materialsCount * 0.02 + texturesCount * 0.2) * 10) / 10;
    const stats: MemoryCleanupStats = {
      disposedGeometries: geometriesCount,
      disposedMaterials: materialsCount,
      disposedTextures: texturesCount,
      reclaimedRAM: `~${reclaimedApprox} Mo VRAM GPU`,
    };

    if (geometriesCount > 0 || materialsCount > 0) {
      console.info(`[GarbageCollector] Purge réussie : ${geometriesCount} mailles, ${materialsCount} matériaux libérés (${stats.reclaimedRAM}).`);
    }

    return stats;
  }

  /**
   * Forcer la libération totale du contexte WebGL d'un conteneur
   */
  static disposeRenderer(renderer?: THREE.WebGLRenderer): void {
    if (!renderer) return;
    try {
      renderer.dispose();
      renderer.forceContextLoss();
      console.info("[GarbageCollector] Contexte WebGL Renderer intégralement libéré.");
    } catch (err) {
      console.warn("[GarbageCollector] Erreur lors de la purge du WebGL Renderer :", err);
    }
  }
}

export default WebGLMemoryCleaner;
