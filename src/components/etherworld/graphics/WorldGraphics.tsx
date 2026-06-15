/**
 * src/components/etherworld/graphics/WorldGraphics.tsx
 * 
 * Couche Visuelle Additionnelle et Accessoires Réflectifs Nocturnes.
 * - Lampadaires sur la Route 138 avec lueurs jaunes
 * - Reflets lisses d'accotements (RoadSheen) et Réflecteurs de chaussée
 * - Lueurs lointaines (DistantCityGlow et HydroLineGlow)
 */

import React, { useMemo } from 'react';
import { useStore } from '@/lib/etherworld/game-store';
import { PORTNEUF_ROADS } from '@/utils/roadNetwork';
import { resolveTimePhase, getAtmospherePalette, type TimePhase } from './visualAtmosphere';

interface WorldGraphicsProps {
  timeOfDay?: string | number;
  timePhase?: string;
  weather?: string;
}

export const WorldGraphics: React.FC<WorldGraphicsProps> = ({
  timeOfDay,
  timePhase,
  weather = 'clear',
}) => {
  // Récupération souple des props ou du Store Zustand Legacy
  const storeTimeOfDay = useStore(s => s.timeOfDay) as (string | number);
  const storeTimePhase = useStore(s => s.timePhase);
  const storeWeather   = useStore(s => s.weather);

  const finalTime    = timeOfDay !== undefined ? timeOfDay : storeTimeOfDay;
  const finalPhase   = timePhase !== undefined ? timePhase : storeTimePhase;
  const finalWeather = weather   !== undefined ? weather   : storeWeather;

  const activePhase = resolveTimePhase(finalTime, finalPhase);
  const palette     = useMemo(() => getAtmospherePalette(activePhase, finalWeather), [activePhase, finalWeather]);
  const isNight     = activePhase !== 'day';

  return (
    <group name="WorldGraphicsAccessoryGroup">
      {/* 1. FLUIDITÉ CHAUSSÉE (RoadSheen & Réflecteurs) */}
      <RoadSheen opacity={finalWeather === 'rain' ? 0.25 : isNight ? 0.12 : 0.04} />
      <RoadReflectors emissiveIntensity={isNight ? 0.8 : 0.2} reflectorColor={palette.reflector} />

      {/* 2. LAMPADAIRES INSTANCIÉS ROUTE 138 */}
      <RouteStreetLights isLit={isNight} lampColor={palette.lamp} />

      {/* 3. EFFETS LOINTAINS */}
      {isNight && <DistantCityGlow cityGlowColor={palette.cityGlow} />}
      <HydroLineGlow />
      <AtmosphericDepthBands />
    </group>
  );
};

const RouteStreetLights: React.FC<{ isLit: boolean; lampColor: string }> = ({ isLit, lampColor }) => {
  const lights = useMemo(() => {
    const arr: Array<{ x: number; z: number; side: 1 | -1; cast: boolean }> = [];
    for (let z = -900, i = 0; z <= 900; z += 90, i++) {
      arr.push({ x: 12.5, z, side: 1, cast: i % 6 === 0 });
      arr.push({ x: -12.5, z: z + 45, side: -1, cast: i % 7 === 0 });
    }
    return arr;
  }, []);

  return (
    <group name="InstancedStreetLights138">
      {lights.map((l, i) => {
        const armDir = l.side === 1 ? -1 : 1;
        return (
          <group key={i} position={[l.x, 0, l.z]}>
            <mesh position={[0, 3.5, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.12, 7, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[armDir * 1.2, 6.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Lampe halogène */}
            <mesh position={[armDir * 2.4, 6.6, 0]}>
              <sphereGeometry args={[0.25, 12, 12]} />
              <meshStandardMaterial
                color={isLit ? lampColor : '#475569'}
                emissive={isLit ? lampColor : '#000000'}
                emissiveIntensity={isLit ? 2.5 : 0}
              />
            </mesh>
            {isLit && (
              <>
                <pointLight
                  position={[armDir * 2.4, 6.3, 0]}
                  color={lampColor}
                  intensity={2.8}
                  distance={38}
                  decay={2}
                  castShadow={l.cast}
                />
                <mesh position={[armDir * 2.4, 6.2, 0]}>
                  <sphereGeometry args={[1.1, 16, 16]} />
                  <meshBasicMaterial color={lampColor} transparent opacity={0.12} depthWrite={false} fog={false} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
};

const RoadReflectors: React.FC<{ emissiveIntensity: number; reflectorColor: string }> = ({ emissiveIntensity, reflectorColor }) => {
  const reflectors = useMemo(() => {
    const arr: Array<{ x: number; z: number; color: string; isCenter: boolean }> = [];
    for (let z = -1000; z <= 1000; z += 30) {
      arr.push({ x: -6.2, z, color: '#f8fafc', isCenter: false });
      arr.push({ x: 6.2,  z, color: '#f8fafc', isCenter: false });
      if (z % 60 === 0) arr.push({ x: 0, z, color: '#facc15', isCenter: true });
    }
    return arr;
  }, []);

  return (
    <group name="HDRoadReflectorsGroup">
      {reflectors.map((r, i) => (
        <mesh key={i} position={[r.x, 0.05, r.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 0.55]} />
          <meshStandardMaterial
            color={r.color}
            emissive={r.isCenter ? '#d97706' : reflectorColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

const RoadSheen: React.FC<{ opacity: number }> = ({ opacity }) => {
  const roadPlanes = useMemo(() => PORTNEUF_ROADS.map((road) => {
    const dx = road.end[0] - road.start[0];
    const dz = road.end[1] - road.start[1];
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle  = Math.atan2(dx, dz);
    const midX   = (road.start[0] + road.end[0]) / 2;
    const midZ   = (road.start[1] + road.end[1]) / 2;
    return { id: road.id, position: [midX, 0.055, midZ] as [number, number, number], rotationY: angle, width: road.width * 0.92, length };
  }), []);

  return (
    <group name="HDRoadSheenClearcoat">
      {roadPlanes.map(p => (
        <mesh key={p.id} position={p.position} rotation={[-Math.PI / 2, 0, p.rotationY]}>
          <planeGeometry args={[p.width, p.length]} />
          <meshPhysicalMaterial color="#bae6fd" transparent opacity={opacity} roughness={0.2} clearcoat={0.9} clearcoatRoughness={0.1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

const DistantCityGlow: React.FC<{ cityGlowColor: string }> = ({ cityGlowColor }) => {
  return (
    <group name="DistantCityGlowGroup" position={[0, 0, 1000]}>
      <mesh position={[0, 50, 0]}>
        <sphereGeometry args={[160, 24, 16]} />
        <meshBasicMaterial color={cityGlowColor} transparent opacity={0.08} depthWrite={false} fog={false} />
      </mesh>
      <pointLight position={[0, 45, 0]} color={cityGlowColor} intensity={2.5} distance={350} />
    </group>
  );
};

const HydroLineGlow: React.FC = () => {
  const points = useMemo(() => [-900, -450, 0, 450, 900].map(z => new THREE.Vector3(-38, 22, z)), []);
  const geo    = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={geo}>
      <lineBasicMaterial color="#e2e8f0" transparent opacity={0.45} />
    </line>
  );
};

const AtmosphericDepthBands: React.FC = () => {
  return (
    <group name="AtmosphericDepthBandsGroup">
      <mesh position={[0, 35, -700]} scale={[400, 60, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.04} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, 15, 800]} scale={[600, 90, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.03} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
};

export default WorldGraphics;
