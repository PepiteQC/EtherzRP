/**
 * src/components/etherworld/graphics/HDVisualRig.tsx
 * 
 * Pipeline d'Ambiance Visuelle HD Cartoon et Gestion des Lumières Three.js.
 * Implémente le dôme coloré, le ToneMapping ACESFilmic et la gestion des ombres douces.
 */

import React, { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { resolveTimePhase, getAtmospherePalette, createSkyGradientTexture } from './visualAtmosphere';

interface VisualRigProps {
  lowEnd?: boolean;
  timeOfDay?: string | number;
  timePhase?: string;
  weather?: string;
}

export const HDVisualRig: React.FC<VisualRigProps> = ({
  lowEnd    = false,
  timeOfDay = 12,
  timePhase,
  weather   = 'clear',
}) => {
  const { gl, scene } = useThree();
  const activePhase   = resolveTimePhase(timeOfDay, timePhase);
  const palette       = useMemo(() => getAtmospherePalette(activePhase, weather), [activePhase, weather]);

  // Texture Dôme Linéaire
  const skyTexture = useMemo(() => createSkyGradientTexture(
    activePhase === 'night' ? '#020617' : activePhase === 'dawn' ? '#38bdf8' : activePhase === 'dusk' ? '#a855f7' : '#0284c7',
    palette.background
  ), [activePhase, palette.background]);

  // Configuration du Pipeline Rendu Shaders
  useEffect(() => {
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping      = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = activePhase === 'night' ? 1.15 : activePhase === 'dusk' ? 1.1 : 1.05;
    gl.shadowMap.enabled   = !lowEnd;
    gl.shadowMap.type      = THREE.PCFSoftShadowMap;
  }, [gl, activePhase, lowEnd]);

  useFrame(() => {
    const targetBg = new THREE.Color(palette.background);
    if (scene.background instanceof THREE.Color) scene.background.lerp(targetBg, 0.02);
    else scene.background = targetBg;

    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.lerp(new THREE.Color(palette.fog), 0.02);
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, palette.fogNear, 0.02);
      scene.fog.far  = THREE.MathUtils.lerp(scene.fog.far,  palette.fogFar,  0.02);
    } else {
      scene.fog = new THREE.Fog(palette.fog, palette.fogNear, palette.fogFar);
    }
  });

  return (
    <group name="HDVisualRigMasterGroup">
      {/* Dôme de ciel HD Cartoon */}
      <mesh scale={[1, 1, 1]}>
        <sphereGeometry args={[950, lowEnd ? 24 : 32, lowEnd ? 12 : 16]} />
        <meshBasicMaterial map={skyTexture} side={THREE.BackSide} fog={false} />
      </mesh>

      {/* Lumières Globales Institutionnelles */}
      <ambientLight color={palette.ambient} intensity={palette.ambientIntensity} />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]} />

      {/* Soleil / Lune Directionnel avec Ombres Douces */}
      <directionalLight
        position={activePhase === 'night' ? [-150, 200, -200] : [150, 250, -250]}
        color={palette.sun}
        intensity={palette.keyIntensity}
        castShadow={!lowEnd}
        shadow-mapSize-width={lowEnd ? 1024 : 2048}
        shadow-mapSize-height={lowEnd ? 1024 : 2048}
        shadow-camera-near={0.5}
        shadow-camera-far={800}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-bias={-0.00015}
        shadow-normalBias={0.04}
      />

      {/* Lumières de Détail (Fill & Rim Lights) pour détacher les entités de l'ombre */}
      <directionalLight position={[-180, 100, 150]} color={palette.fill} intensity={activePhase === 'night' ? 0.5 : 0.3} />
      <pointLight position={[0, 45, -150]} color={palette.rim} intensity={activePhase === 'night' ? 1.6 : 0.6} distance={350} decay={2} />
    </group>
  );
};

export default HDVisualRig;
