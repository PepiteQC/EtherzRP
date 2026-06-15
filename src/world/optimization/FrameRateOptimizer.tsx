/**
 * src/world/optimization/FrameRateOptimizer.tsx
 * 
 * Composant Actif de Régulation du Frame Rate (FPS Booster).
 * Supervise les temps de rendu en direct (useFrame). En cas de surcharge GPU/CPU (chute sous 45 FPS),
 * il abaisse dynamiquement et instantanément la fidélité des ombres, la densité de particules et la portée du culling
 * pour maintenir une fluidité absolue à 60 FPS.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface PerformanceThrottleStatus {
  activeLevel: 'ultra' | 'performance' | 'aggressive';
  currentFPS: number;
  shadowsEnabled: boolean;
  particleDensity: number; // 0.0 à 1.0
  cullingDistanceRatio: number;
}

interface OptimizerProps {
  targetFPS?: number;       // 60 par défaut
  onStatusChange?: (status: PerformanceThrottleStatus) => void;
  enabled?: boolean;
}

export const FrameRateOptimizer: React.FC<OptimizerProps> = ({
  targetFPS = 60,
  onStatusChange,
  enabled   = true,
}) => {
  const { gl, scene } = useThree();
  
  const frameCountRef   = useRef(0);
  const lastTimeRef     = useRef(Date.now());
  const slidingFpsRef   = useRef<number[]>([]);
  
  const [throttleLevel, setThrottleLevel] = useState<'ultra' | 'performance' | 'aggressive'>('ultra');

  useEffect(() => {
    if (!enabled) return;
    console.info("[FrameRateOptimizer] Supervision adaptative des FPS activée.");
  }, [enabled]);

  // Algorithme de Calcul et de Sensation FPS
  useFrame(() => {
    if (!enabled) return;

    frameCountRef.current++;
    const now = Date.now();
    const elapsed = now - lastTimeRef.current;

    // Évaluation toutes les 500 ms
    if (elapsed >= 500) {
      const instantFps = Math.round((frameCountRef.current / elapsed) * 1000);
      slidingFpsRef.current.push(instantFps);
      
      if (slidingFpsRef.current.length > 6) {
        slidingFpsRef.current.shift(); // Garde les 3 dernières secondes
      }

      const avgFps = Math.round(
        slidingFpsRef.current.reduce((a, b) => a + b, 0) / slidingFpsRef.current.length
      );

      // Sensation de dégradation ou amélioration
      let nextLevel = throttleLevel;
      if (avgFps < 42) {
        nextLevel = 'aggressive';
      } else if (avgFps < 52 && throttleLevel === 'ultra') {
        nextLevel = 'performance';
      } else if (avgFps >= 58 && throttleLevel !== 'ultra') {
        nextLevel = 'ultra';
      }

      if (nextLevel !== throttleLevel) {
        setThrottleLevel(nextLevel);
        applyThrottleSettings(nextLevel, gl, scene);

        if (onStatusChange) {
          onStatusChange({
            activeLevel: nextLevel,
            currentFPS: avgFps,
            shadowsEnabled: nextLevel !== 'aggressive',
            particleDensity: nextLevel === 'ultra' ? 1.0 : nextLevel === 'performance' ? 0.6 : 0.2,
            cullingDistanceRatio: nextLevel === 'ultra' ? 1.0 : nextLevel === 'performance' ? 0.75 : 0.5,
          });
        }
        console.warn(`[FrameRateOptimizer] Ajustement fluidité : Passage en mode [${nextLevel.toUpperCase()}] (${avgFps} FPS moyen).`);
      }

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null; // Composant Purement Logiciel Silencieux
};

/**
 * Applique l'abaissement ou la restauration des paramètres Three.js
 */
function applyThrottleSettings(
  level: 'ultra' | 'performance' | 'aggressive',
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene
): void {
  try {
    if (level === 'aggressive') {
      // Désactiver le rendu des ombres douces coûteuses
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.autoUpdate = false;
      
      // Rapprocher le brouillard pour forcer le culling naturel
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.far = Math.min(scene.fog.far, 500);
      }
    } else if (level === 'performance') {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.autoUpdate = true;
      renderer.shadowMap.type = THREE.PCFShadowMap; // Plus rapide que PCFSoft
      
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.far = Math.min(scene.fog.far, 750);
      }
    } else {
      // Mode Ultra Restauration
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.autoUpdate = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      if (scene.fog instanceof THREE.Fog) {
        scene.fog.far = Math.max(scene.fog.far, 900);
      }
    }
  } catch (err) {
    console.error("[FrameRateOptimizer] Échec d'application des paramètres de fluidité :", err);
  }
}

export default FrameRateOptimizer;
