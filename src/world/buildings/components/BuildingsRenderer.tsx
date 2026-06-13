/**
 * BuildingsRenderer.tsx - Composant optimisé de rendu des bâtiments
 * Utilise le système Building3D avec LOD et matériaux partagés
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Building3D, MaterialLibrary, BuildingType } from '../BuildingSystem';
import { WorldDataManager } from '../data/WorldDataManager';

interface BuildingsRendererProps {
  centerX?: number;
  centerZ?: number;
  viewDistance?: number;
  onBuildingClick?: (buildingId: string) => void;
}

/**
 * Composant de rendu des bâtiments polytexturés
 */
export const BuildingsRenderer: React.FC<BuildingsRendererProps> = ({
  centerX = 0,
  centerZ = 0,
  viewDistance = 500,
  onBuildingClick,
}) => {
  const { scene } = useThree();
  const groupRef = useRef(new THREE.Group());
  const materialLibRef = useRef<MaterialLibrary>(new MaterialLibrary());
  const worldDataRef = useRef<WorldDataManager>(new WorldDataManager());
  const renderedBuildingsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const lastPositionRef = useRef({ x: centerX, z: centerZ });

  useEffect(() => {
    scene.add(groupRef.current);

    return () => {
      scene.remove(groupRef.current);
      materialLibRef.current.dispose();
    };
  }, [scene]);

  // Mettre à jour les bâtiments visibles quand la position change
  useFrame(({ camera }) => {
    const camX = camera.position.x;
    const camZ = camera.position.z;

    // Mettre à jour seulement tous les 500ms pour éviter les calculs trop fréquents
    const dist = Math.sqrt(
      Math.pow(camX - lastPositionRef.current.x, 2) +
        Math.pow(camZ - lastPositionRef.current.z, 2)
    );

    if (dist > 50) {
      // Charger les bâtiments du chunk actuel
      const worldData = worldDataRef.current.getWorldData(camX, camZ);

      // Effacer les anciens bâtiments
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Group) {
          child.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              if (Array.isArray(obj.material)) {
                obj.material.forEach((m) => m.dispose());
              } else {
                obj.material.dispose();
              }
            }
          });
        }
      });
      groupRef.current.clear();
      renderedBuildingsRef.current.clear();

      // Ajouter les nouveaux bâtiments du chunk
      worldData.buildings.forEach((buildingConfig) => {
        // Vérifier si le bâtiment est à portée
        const dist = Math.sqrt(
          Math.pow(buildingConfig.position[0] - camX, 2) +
            Math.pow(buildingConfig.position[2] - camZ, 2)
        );

        if (dist < viewDistance) {
          const building = new Building3D(buildingConfig, materialLibRef.current);
          const mesh = building.createMesh();

          // Ajouter un callback de clic si fourni
          if (onBuildingClick) {
            (mesh as any).__buildingId = buildingConfig.id;
          }

          groupRef.current.add(mesh);
          renderedBuildingsRef.current.set(buildingConfig.id, mesh);
        }
      });

      lastPositionRef.current = { x: camX, z: camZ };
    }
  });

  return null; // Le rendu est géré via useFrame et refs
};

/**
 * Composant legacy pour compatibilité - utilise le nouveau système
 */
export const OptimizedBuildingsRenderer: React.FC<BuildingsRendererProps> = (props) => {
  return <BuildingsRenderer {...props} />;
};

export default BuildingsRenderer;
