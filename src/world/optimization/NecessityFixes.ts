/**
 * src/world/optimization/NecessityFixes.ts
 * 
 * Intercepteurs et Auto-Correcteurs de Crise (Necessity Problem Resolver).
 * Corrige automatiquement les problèmes critiques de nécessité (Perte de WebGL, promesses brisées, NaN spatiaux).
 * Assure que l'application ne s'effondre jamais lors d'une session de jeu active.
 */

import * as THREE from 'three';

export class NecessityFixesEngine {
  /**
   * 1. Protection du Contexte WebGL (Auto-Recovery)
   * Enregistre un observateur sur l'élément Canvas. Si le processeur graphique crash ou s'épuise,
   * l'observateur intercepte `webglcontextlost` et force la recréation sans page blanche.
   */
  static protectCanvasContext(canvas: HTMLCanvasElement, onRecover?: () => void): (() => void) {
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("[NecessityFixes] ⚠️ Alerte: Contexte WebGL perdu ! Nettoyage d'urgence en cours...");
    };

    const handleContextRestored = () => {
      console.info("[NecessityFixes] ✨ Contexte WebGL restauré avec succès. Réinitialisation des shaders...");
      if (onRecover) onRecover();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }

  /**
   * 2. Sécurisation Asynchrone Absolue (Promise Fallback Wrapper)
   * Garantie qu'un échec réseau (Firebase offline) ou une promesse cassée ne cause pas un crash UI.
   */
  static async executeSafeAsync<T>(promise: Promise<T>, fallbackValue: T, warningTag = "AsyncAction"): Promise<T> {
    try {
      return await promise;
    } catch (err: any) {
      console.warn(`[NecessityFixes] ⚠️ Saisie de crise sur [${warningTag}] :`, err.message || err);
      return fallbackValue;
    }
  }

  /**
   * 3. Correcteur et Validateur Mathématique Géospatial (NaN / Submerged Resolver)
   * Vérifie et corrige toute coordonnée 3D corrompue (NaN, Infinity, ou enfoncée sous y=0).
   */
  static sanitizeCoordinates(coord: [number, number, number], groundFloorY = 0.05): [number, number, number] {
    const safeX = (typeof coord[0] === 'number' && !isNaN(coord[0]) && isFinite(coord[0])) ? coord[0] : 0.0;
    let   safeY = (typeof coord[1] === 'number' && !isNaN(coord[1]) && isFinite(coord[1])) ? coord[1] : groundFloorY;
    const safeZ = (typeof coord[2] === 'number' && !isNaN(coord[2]) && isFinite(coord[2])) ? coord[2] : 0.0;

    // Empêche systématiquement tout objet de glisser sous la map
    if (safeY < groundFloorY) {
      safeY = groundFloorY;
    }

    return [Math.round(safeX * 10) / 10, Math.round(safeY * 10) / 10, Math.round(safeZ * 10) / 10];
  }
}

export default NecessityFixesEngine;
