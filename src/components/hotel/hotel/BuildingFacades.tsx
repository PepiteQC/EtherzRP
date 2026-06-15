// src/components/hotel/hotel/BuildingFacades.tsx

import React, { useMemo } from 'react';
import { HOTEL, BUILDING, ROOM, CORRIDOR, WINDOW, STAIRWELL } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

/**
 * Façades détaillées du bâtiment :
 * - Fenêtres côté arrière (chambres droite)
 * - Murs latéraux
 * - Détails architecturaux
 */
export const BuildingFacades: React.FC<{
  litStates: boolean[][];
}> = React.memo(({ litStates }) => {
  const M = useMemo(() => getMaterialSet(), []);

  const wingLength = BUILDING.chamberWingLength;
  const bW = BUILDING.width;
  const bH = HOTEL.totalHeight;

  return (
    <group>
      {/* ─── REAR FACADE (côté droit = fenêtres arrière) ── */}
      {Array.from({ length: HOTEL.chamberFloors }, (_, fi) => {
        const floor = fi + 1;
        const fy = floor * HOTEL.levelHeight + HOTEL.slabThickness / 2;

        return Array.from({ length: HOTEL.roomsPerSide }, (_, pos) => {
          const x = -wingLength / 2 + ROOM.width / 2 + pos * ROOM.width;
          const z = -bW / 2;
          const lit = litStates[fi]?.[pos + 5] ?? false; // Right side rooms

          return (
            <React.Fragment key={`rear-window-${floor}-${pos}`}>
              {/* Window reveal */}
              <mesh position={[x, fy + ROOM.wallHeight / 2, z - 0.08]} material={M.concreteDark}>
                <boxGeometry args={[WINDOW.width + 0.2, WINDOW.height + 0.2, 0.2]} />
              </mesh>

              {/* Window glass */}
              <mesh position={[x, fy + WINDOW.sillHeight + WINDOW.height / 2, z - 0.14]}>
                <boxGeometry args={[WINDOW.width, WINDOW.height, WINDOW.glassThickness]} />
                <meshStandardMaterial
                  color={lit ? 0xffd580 : 0x7dd3fc}
                  emissive={lit ? 0xffd580 : 0x0a0e1a}
                  emissiveIntensity={lit ? 0.5 : 0}
                  transparent
                  opacity={0.8}
                  roughness={0.04}
                  metalness={0.08}
                />
              </mesh>

              {/* Window frame */}
              <mesh position={[x, fy + WINDOW.sillHeight + WINDOW.height + 0.03, z - 0.14]} material={M.frame}>
                <boxGeometry args={[WINDOW.width + 0.12, 0.06, 0.04]} />
              </mesh>
              <mesh position={[x, fy + WINDOW.sillHeight - 0.03, z - 0.14]} material={M.frame}>
                <boxGeometry args={[WINDOW.width + 0.12, 0.06, 0.04]} />
              </mesh>
              {[-WINDOW.width / 2 - 0.03, WINDOW.width / 2 + 0.03].map((fx, fi2) => (
                <mesh key={`rear-frame-v-${fi2}`} position={[x + fx, fy + WINDOW.sillHeight + WINDOW.height / 2, z - 0.14]} material={M.frame}>
                  <boxGeometry args={[0.06, WINDOW.height + 0.12, 0.04]} />
                </mesh>
              ))}

              {/* Sill */}
              <mesh position={[x, fy + WINDOW.sillHeight - 0.06, z - 0.18]} material={M.metal}>
                <boxGeometry args={[WINDOW.width + 0.2, 0.04, 0.12]} />
              </mesh>

              {/* Spandrel below */}
              <mesh position={[x, fy + HOTEL.levelHeight * 0.12, z - 0.06]} material={M.concretePanel}>
                <boxGeometry args={[ROOM.width - 0.4, HOTEL.levelHeight * 0.2, 0.12]} />
              </mesh>

              {/* Light glow */}
              {lit && (
                <pointLight
                  position={[x, fy + ROOM.wallHeight / 2, z - 1]}
                  color={0xffd580}
                  intensity={0.4}
                  distance={5}
                />
              )}
            </React.Fragment>
          );
        });
      })}

      {/* ─── REAR VERTICAL RIBS ────────────── */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = -wingLength / 2 + (i + 0.5) * (wingLength / 6);
        return (
          <mesh key={`rear-rib-${i}`} position={[x, bH / 2, -bW / 2 - 0.2]} material={M.concreteDark} castShadow>
            <boxGeometry args={[0.3, bH, 0.3, 2, 10, 2]} />
          </mesh>
        );
      })}

      {/* ─── SIDE WALLS (east and west) ────── */}
      {[-1, 1].map((side) => {
        const xPos = side * (wingLength / 2 + STAIRWELL.width + ROOM.extWallThickness);

        return (
          <React.Fragment key={`side-${side}`}>
            {/* Main side wall */}
            <mesh position={[xPos, bH / 2, 0]} material={M.concreteMain} castShadow>
              <boxGeometry args={[0.3, bH, bW + 0.5]} />
            </mesh>

            {/* Stairwell windows on side wall */}
            {Array.from({ length: HOTEL.totalLevels }, (_, level) => {
              const wy = level * HOTEL.levelHeight + HOTEL.levelHeight / 2;
              return (
                <React.Fragment key={`side-window-${side}-${level}`}>
                  <mesh position={[xPos + side * 0.02, wy, 0]} material={M.glass}>
                    <boxGeometry args={[0.04, 1.2, 0.8]} />
                  </mesh>
                  <mesh position={[xPos + side * 0.02, wy + 0.62, 0]} material={M.frame}>
                    <boxGeometry args={[0.06, 0.04, 0.86]} />
                  </mesh>
                  <mesh position={[xPos + side * 0.02, wy - 0.62, 0]} material={M.frame}>
                    <boxGeometry args={[0.06, 0.04, 0.86]} />
                  </mesh>
                </React.Fragment>
              );
            })}

            {/* Corner detail */}
            <mesh position={[xPos, bH / 2, bW / 2 + 0.1]} material={M.concreteDark} castShadow>
              <boxGeometry args={[0.5, bH, 0.5]} />
            </mesh>
            <mesh position={[xPos, bH / 2, -bW / 2 - 0.1]} material={M.concreteDark} castShadow>
              <boxGeometry args={[0.5, bH, 0.5]} />
            </mesh>
          </React.Fragment>
        );
      })}

      {/* ─── RDC FACADE (ground floor — no room windows) */}
      {/* Front */}
      <mesh position={[0, HOTEL.levelHeight / 2, bW / 2 + 0.08]} material={M.concretePanel} castShadow>
        <boxGeometry args={[wingLength, HOTEL.levelHeight, 0.15]} />
      </mesh>
      {/* RDC service windows */}
      {[-wingLength / 4, wingLength / 4].map((wx, i) => (
        <mesh key={`rdc-window-${i}`} position={[wx, HOTEL.levelHeight * 0.45, bW / 2 + 0.16]} material={M.glass}>
          <boxGeometry args={[2.0, 1.2, 0.06]} />
        </mesh>
      ))}

      {/* Rear */}
      <mesh position={[0, HOTEL.levelHeight / 2, -bW / 2 - 0.08]} material={M.concretePanel} castShadow>
        <boxGeometry args={[wingLength, HOTEL.levelHeight, 0.15]} />
      </mesh>

      {/* ─── BUILDING NAME / ADDRESS ───────── */}
      <mesh position={[0, bH * 0.92, bW / 2 + 0.28]}>
        <boxGeometry args={[6, 0.4, 0.06]} />
        <meshStandardMaterial
          color={0xc9a84c}
          emissive={0xc9a84c}
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>

      {/* ─── DRIP EDGES at each slab ───────── */}
      {Array.from({ length: HOTEL.totalLevels + 1 }, (_, level) => {
        const y = level * HOTEL.levelHeight;
        return (
          <React.Fragment key={`drip-${level}`}>
            <mesh position={[0, y - 0.06, bW / 2 + 0.3]} material={M.concreteDark}>
              <boxGeometry args={[wingLength + 2, 0.06, 0.08]} />
            </mesh>
            <mesh position={[0, y - 0.06, -bW / 2 - 0.3]} material={M.concreteDark}>
              <boxGeometry args={[wingLength + 2, 0.06, 0.08]} />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
});

BuildingFacades.displayName = 'BuildingFacades';