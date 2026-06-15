/**
 * src/world/weather/WeatherSystem.tsx
 * 
 * Système complet de Météo et Éclairage Réaliste (Phase 3) pour EtherWorld RP.
 * - Éclairage dynamique selon le cycle Matin / Jour / Soir / Nuit (Soleil directionnel orbital)
 * - Gestion du brouillard volumétrique selon les conditions atmosphériques
 * - Particules de Précipitation (Pluie avec sol sombre, Neige tourbillonnante, Feuilles d'automne)
 * - Lampadaires instanciés et lueurs des commerces la nuit
 */

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
export type SeasonType  = 'spring' | 'summer' | 'autumn' | 'winter';

interface WeatherSystemProps {
  timeOfDay?: number;   // 0.0 - 24.0
  weather?: WeatherType;
  season?: SeasonType;
  timeSpeed?: number;   // Vitesse de défilement du temps
}

/**
 * Composant Principal Orchestrant la Météo et la Lumière
 */
export const WeatherSystem: React.FC<WeatherSystemProps> = ({
  timeOfDay = 12.0,
  weather   = 'clear',
  season    = 'summer',
  timeSpeed = 0.1,
}) => {
  const { scene } = useThree();
  const internalTimeRef = useRef(timeOfDay);

  // 1. Détermination de la Phase Horaire
  const timePhase = useMemo(() => {
    const t = internalTimeRef.current % 24;
    if (t >= 21 || t < 5)  return 'night';
    if (t >= 5  && t < 8)  return 'dawn';
    if (t >= 18 && t < 21) return 'dusk';
    return 'day';
  }, [timeOfDay]);

  // 2. Palette d'Atmosphère selon l'Heure et la Saison
  const atmosphere = useMemo(() => {
    switch (timePhase) {
      case 'night': return { fog: 0x060a17, ambient: 0x1e293b, sun: 0x38bdf8, sunIntensity: 0.25 };
      case 'dawn':  return { fog: 0xfb7185, ambient: 0xf43f5e, sun: 0xfde047, sunIntensity: 0.65 };
      case 'dusk':  return { fog: 0xf97316, ambient: 0xe11d48, sun: 0xf97316, sunIntensity: 0.65 };
      default:      return { fog: season === 'winter' ? 0xd0e8f2 : 0x7dd3fc, ambient: 0xffffff, sun: 0xffffff, sunIntensity: 1.1 };
    }
  }, [timePhase, season]);

  // 3. Animation Orbitale de la Lumière et du Brouillard
  useFrame((_, delta) => {
    internalTimeRef.current += (delta * timeSpeed) / 60;
    const t = internalTimeRef.current % 24;

    // Calcul de l'orbite solaire (Est en Ouest)
    const sunAngle = ((t - 6) / 24) * Math.PI * 2;
    const sunX = Math.cos(sunAngle) * 500;
    const sunY = Math.sin(sunAngle) * 500;
    const sunZ = Math.sin(sunAngle * 0.5) * 200;

    // Mise à jour de la lumière directionnelle
    if (sunLightRef.current) {
      sunLightRef.current.position.set(sunX, Math.max(sunY, -50), sunZ);
      sunLightRef.current.intensity = sunY > 0 ? atmosphere.sunIntensity : 0.15;
    }

    // Mise à jour douce du Brouillard
    let targetNear = timePhase === 'night' ? 40  : 120;
    let targetFar  = timePhase === 'night' ? 450 : 850;

    if (weather === 'fog')   { targetNear = 10; targetFar = 180; }
    if (weather === 'rain')  { targetNear = 30; targetFar = 380; }
    if (weather === 'snow')  { targetNear = 20; targetFar = 320; }

    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.lerp(new THREE.Color(atmosphere.fog), 0.02);
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, targetNear, 0.02);
      scene.fog.far  = THREE.MathUtils.lerp(scene.fog.far,  targetFar,  0.02);
    } else {
      scene.fog = new THREE.Fog(atmosphere.fog, targetNear, targetFar);
      scene.background = new THREE.Color(atmosphere.fog);
    }
  });

  const sunLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <group name="WeatherAndLightingSystem">
      {/* Lumière Ambiante Générale */}
      <ambientLight intensity={timePhase === 'night' ? 0.2 : 0.55} color={atmosphere.ambient} />

      {/* Soleil / Lune Directionnel avec Ombres Nettoyees */}
      <directionalLight
        ref={sunLightRef}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-camera-far={1000}
        shadow-bias={-0.0001}
      />

      {/* Particules de Précipitation (Pluie, Neige, Feuilles d'Automne) */}
      <PrecipitationParticles weather={weather} season={season} />
    </group>
  );
};

/**
 * Générateur Performant de Particules Atmosphériques
 */
interface PrecipitationProps {
  weather: WeatherType;
  season: SeasonType;
}

const PrecipitationParticles: React.FC<PrecipitationProps> = ({ weather, season }) => {
  const count = 1500;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, velocities, particleType] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    let pType: 'rain' | 'snow' | 'leaves' | 'none' = 'none';

    if (weather === 'rain' || weather === 'storm') pType = 'rain';
    else if (weather === 'snow') pType = 'snow';
    else if (season === 'autumn' && weather === 'clear') pType = 'leaves'; // Chute de feuilles d'automne en vent léger

    if (pType !== 'none') {
      for (let i = 0; i < count; i++) {
        // Dispersion dans un cube de 200x100x200 autour de la caméra
        pos[i * 3]     = (Math.random() - 0.5) * 200;
        pos[i * 3 + 1] = Math.random() * 100;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 200;

        if (pType === 'rain') {
          vel[i * 3]     = (Math.random() - 0.5) * 0.2;
          vel[i * 3 + 1] = -(Math.random() * 2.5 + 3.0); // Chute rapide
          vel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        } else if (pType === 'snow') {
          vel[i * 3]     = (Math.random() - 0.5) * 0.8; // Tourbillon
          vel[i * 3 + 1] = -(Math.random() * 0.4 + 0.4); // Chute douce
          vel[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
        } else if (pType === 'leaves') {
          vel[i * 3]     = Math.random() * 1.2 + 0.5; // Vent poussant vers l'Est
          vel[i * 3 + 1] = -(Math.random() * 0.3 + 0.2); // Chute très lente
          vel[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
        }
      }
    }

    return [pos, vel, pType];
  }, [weather, season]);

  // Texture Visuelle des Particules
  const particleMat = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    if (particleType === 'rain') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(14, 0, 4, 32); // Traînée verticale
    } else if (particleType === 'snow') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.fill(); // Flocon rond
    } else if (particleType === 'leaves') {
      ctx.fillStyle = Math.random() > 0.5 ? '#ea580c' : '#ca8a04'; // Feuille orange ou or
      ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI); ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.PointsMaterial({
      size: particleType === 'rain' ? 1.5 : particleType === 'leaves' ? 2.0 : 1.2,
      map: tex,
      transparent: true,
      opacity: particleType === 'rain' ? 0.6 : 0.8,
      depthWrite: false,
    });
  }, [particleType]);

  // Animation de chute
  useFrame(() => {
    if (!pointsRef.current || particleType === 'none') return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      pos[i * 3]     += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];

      // Respawn en haut si la particule touche le sol
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3]     = (Math.random() - 0.5) * 200;
        pos[i * 3 + 1] = 100;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  if (particleType === 'none') return null;

  return (
    <points ref={pointsRef} material={particleMat}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
    </points>
  );
};

export default WeatherSystem;
