// src/hotel3d/hotel/ExteriorLighting.tsx

import React from 'react';
import { HOTEL, BUILDING } from '../constants/dimensions';

/**
 * Mise en lumière architecturale du bâtiment.
 * Uplights, downlights, accent lighting.
 */
export const ExteriorLighting: React.FC = React.memo(() => {
  const wingLength = BUILDING.chamberWingLength;
  const bW = BUILDING.width;
  const bH = HOTEL.totalHeight;

  return (
    <group>
      {/* ─── GROUND UPLIGHTS (facade) ──────── */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = -wingLength / 2 + (i + 0.5) * (wingLength / 8);
        return (
          <React.Fragment key={`uplight-${i}`}>
            {/* Front facade */}
            <pointLight
              position={[x, 0.1, bW / 2 + 0.8]}
              color={0xffd580}
              intensity={0.6}
              distance={12}
            />
            <mesh position={[x, 0.05, bW / 2 + 0.8]}>
              <cylinderGeometry args={[0.08, 0.1, 0.06, 10]} />
              <meshStandardMaterial
                color={0x333333}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
            {/* Back facade */}
            <pointLight
              position={[x, 0.1, -bW / 2 - 0.8]}
              color={0x7dd3fc}
              intensity={0.3}
              distance={8}
            />
          </React.Fragment>
        );
      })}

      {/* ─── CORNICE DOWNLIGHTS ────────────── */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = -wingLength / 2 + (i + 0.5) * (wingLength / 6);
        return (
          <pointLight
            key={`cornice-${i}`}
            position={[x, bH + 0.3, bW / 2 + 0.3]}
            color={0xfff0cc}
            intensity={0.4}
            distance={6}
          />
        );
      })}

      {/* ─── LOBBY ENTRANCE SPOTLIGHTS ─────── */}
      {[-3, 0, 3].map((x, i) => (
        <spotLight
          key={`entrance-spot-${i}`}
          position={[x, 8, bW / 2 + 12]}
          target-position={[x, 0, bW / 2 + 8]}
          color={0xfff0cc}
          intensity={2.0}
          distance={18}
          angle={0.4}
          penumbra={0.5}
          castShadow={i === 1}
        />
      ))}

      {/* ─── SIDE BUILDING ACCENT ──────────── */}
      {[-1, 1].map((side) => (
        <React.Fragment key={`side-accent-${side}`}>
          <pointLight
            position={[side * (wingLength / 2 + 2), bH * 0.3, 0]}
            color={0x7dd3fc}
            intensity={0.3}
            distance={8}
          />
          <pointLight
            position={[side * (wingLength / 2 + 2), bH * 0.7, 0]}
            color={0x7dd3fc}
            intensity={0.2}
            distance={6}
          />
        </React.Fragment>
      ))}

      {/* ─── ROOFTOP BEACON ────────────────── */}
      <pointLight
        position={[0, bH + 4, 0]}
        color={0xff4444}
        intensity={0.8}
        distance={20}
      />
      <mesh position={[0, bH + 4, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial
          color={0xff2222}
          emissive={0xff2222}
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* ─── PARKING AREA LIGHTS ───────────── */}
      {[-8, 8].map((x) => (
        <group key={`parking-light-${x}`}>
          <mesh position={[x, 4, bW / 2 + 16]}>
            <cylinderGeometry args={[0.05, 0.08, 8, 10]} />
            <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[x, 8.2, bW / 2 + 16]}>
            <boxGeometry args={[0.8, 0.15, 0.4]} />
            <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.3} />
          </mesh>
          <pointLight
            position={[x, 8, bW / 2 + 16]}
            color={0xfff5e0}
            intensity={2.5}
            distance={20}
            castShadow
          />
        </group>
      ))}
    </group>
  );
});

ExteriorLighting.displayName = 'ExteriorLighting';