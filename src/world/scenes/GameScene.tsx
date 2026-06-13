/**
 * GameScene.tsx - Composant principal de rendu du monde 3D
 * Utilise le système LOD et Chunking pour des performances optimales
 * Intègre React Three Fiber avec Firebase pour la gestion d'état
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { KeyboardControls, AdaptiveDpr, AdaptiveEvents, Fog } from '@react-three/drei';
import * as THREE from 'three';
import { ChunkManager } from '../optimization/ChunkManager';
import { MaterialLibrary } from '../buildings/BuildingSystem';
import { WorldDataManager } from '../data/WorldDataManager';
import RoadFactory from '../roads/RoadFactory';

interface GameSceneProps {
  playerPosition?: [number, number, number];
  onPositionChange?: (pos: [number, number, number]) => void;
}

/**
 * Composant de gestion du monde 3D optimisé
 */
export const GameWorldManager: React.FC<GameSceneProps> = ({
  playerPosition = [0, 0.5, -100],
  onPositionChange,
}) => {
  const materialLibRef = useRef<MaterialLibrary | null>(null);
  const chunkManagerRef = useRef<ChunkManager | null>(null);
  const worldDataManagerRef = useRef<WorldDataManager | null>(null);
  const roadFactoryRef = useRef<RoadFactory | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [stats, setStats] = useState({ chunks: 0, buildings: 0, fps: 0 });

  // Initialiser les managers
  useEffect(() => {
    materialLibRef.current = new MaterialLibrary();
    worldDataManagerRef.current = new WorldDataManager();
    chunkManagerRef.current = new ChunkManager({}, materialLibRef.current);
    roadFactoryRef.current = new RoadFactory();

    return () => {
      materialLibRef.current?.dispose();
      chunkManagerRef.current?.clear();
      roadFactoryRef.current?.dispose();
    };
  }, []);

  // Composant Three.js interne pour gérer le rendu
  const InnerGameScene = useCallback(() => {
    const { scene, camera } = useThree();
    const frameCountRef = useRef(0);
    const lastUpdateRef = useRef(Date.now());
    const chunksGroupRef = useRef(new THREE.Group());
    const roadsGroupRef = useRef(new THREE.Group());

    sceneRef.current = scene;

    useEffect(() => {
      scene.add(chunksGroupRef.current);
      scene.add(roadsGroupRef.current);

      // Configurer le fog
      scene.fog = new THREE.Fog(0x87ceeb, 200, 900);
      scene.background = new THREE.Color(0x87ceeb);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(100, 200, 100);
      directionalLight.shadow.camera.left = -1000;
      directionalLight.shadow.camera.right = 1000;
      directionalLight.shadow.camera.top = 1000;
      directionalLight.shadow.camera.bottom = -1000;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      return () => {
        scene.remove(chunksGroupRef.current);
        scene.remove(roadsGroupRef.current);
        ambientLight.dispose();
        directionalLight.dispose();
      };
    }, [scene]);

    useFrame(() => {
      frameCountRef.current++;
      const now = Date.now();

      // Mettre à jour tous les 500ms
      if (now - lastUpdateRef.current > 500) {
        if (playerPosition && chunkManagerRef.current) {
          // Mettre à jour la visibilité des chunks
          chunkManagerRef.current.updateVisibility(playerPosition[0], playerPosition[2]);

          // Mettre à jour les mailles visibles
          const activeChunks = chunkManagerRef.current.getActiveChunks();
          chunksGroupRef.current.clear();

          activeChunks.forEach((chunk) => {
            if (chunk.isVisible && chunk.buildings.length > 0) {
              chunk.buildings.forEach((building) => {
                if (building.mesh) {
                  chunksGroupRef.current.add(building.mesh);
                }
              });
            }
          });

          // Mettre à jour les stats
          const chunkStats = chunkManagerRef.current.getStats();
          setStats({
            chunks: chunkStats.loadedChunks,
            buildings: chunkStats.totalBuildings,
            fps: frameCountRef.current,
          });
          frameCountRef.current = 0;
        }

        lastUpdateRef.current = now;
      }

      // Appeler le callback de position si fourni
      if (onPositionChange) {
        const cameraPos = camera.position;
        onPositionChange([cameraPos.x, cameraPos.y, cameraPos.z]);
      }
    });

    return (
      <>
        {/* Le contenu 3D sera rendu par le système de chunks */}
      </>
    );
  }, [playerPosition, onPositionChange]);

  return (
    <div className="relative w-full h-screen">
      <Canvas
        camera={{
          position: playerPosition,
          fov: 75,
          near: 0.1,
          far: 900,
        }}
        dpr={[1, window.devicePixelRatio > 2 ? 2 : 1]}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <KeyboardControls
          map={[
            { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
            { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
            { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
            { name: 'right', keys: ['ArrowRight', 'KeyD'] },
            { name: 'jump', keys: ['Space'] },
          ]}
        >
          <InnerGameScene />
        </KeyboardControls>
      </Canvas>

      {/* HUD Stats - Development */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded text-xs font-mono">
        <div>Chunks: {stats.chunks}</div>
        <div>Buildings: {stats.buildings}</div>
        <div>FPS: {stats.fps}</div>
      </div>
    </div>
  );
};

export default GameWorldManager;
