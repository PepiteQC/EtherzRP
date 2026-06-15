// src/hotel3d/modules/ElevatorShaft.tsx

import React, { useMemo } from 'react';
import { ELEVATOR, HOTEL, DOOR } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

export interface ElevatorShaftProps {
  positionX: number;
  positionZ: number;
}

export const ElevatorShaft: React.FC<ElevatorShaftProps> = React.memo(({
  positionX,
  positionZ,
}) => {
  const M = useMemo(() => getMaterialSet(), []);
  const totalH = HOTEL.totalHeight + 3.5;
  const SW = ELEVATOR.shaftWidth;
  const SD = ELEVATOR.shaftDepth;

  return (
    <group position={[positionX, 0, positionZ]}>
      {/* ─── SHAFT CASING ──────────────────── */}
      <mesh position={[0, totalH / 2, 0]} material={M.metal} castShadow>
        <boxGeometry args={[SW + 0.5, totalH, SD + 0.5, 4, 12, 4]} />
      </mesh>

      {/* ─── SHAFT INTERIOR ────────────────── */}
      <mesh position={[0, totalH / 2, 0]}>
        <boxGeometry args={[SW, totalH - 0.1, SD]} />
        <meshStandardMaterial color={0x040810} roughness={0.05} metalness={0.9} />
      </mesh>

      {/* ─── GUIDE RAILS ───────────────────── */}
      {[-SW / 2 + 0.08, SW / 2 - 0.08].map((rx, i) => (
        <mesh key={`rail-${i}`} position={[rx, totalH / 2, 0]}>
          <boxGeometry args={[0.08, totalH - 0.5, 0.08]} />
          <meshStandardMaterial color={0x3a4050} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* ─── DOOR ASSEMBLIES at each level ─── */}
      {Array.from({ length: HOTEL.totalLevels }, (_, levelIdx) => {
        const doorCenterY = levelIdx * HOTEL.levelHeight + HOTEL.slabThickness / 2 + DOOR.entrance.height / 2;
        const doorFrontZ = -SD / 2 - 0.08;

        return (
          <group key={`elev-door-assembly-${levelIdx}`}>
            {/* Door frame - outer */}
            <mesh position={[0, doorCenterY, doorFrontZ]} material={M.frame}>
              <boxGeometry args={[1.5, DOOR.entrance.height + 0.15, 0.1]} />
            </mesh>

            {/* Door panels (closed) */}
            {[-0.35, 0.35].map((dx, di) => (
              <mesh key={`door-panel-${di}`} position={[dx, doorCenterY, doorFrontZ - 0.02]} material={M.metal}>
                <boxGeometry args={[0.65, DOOR.entrance.height - 0.1, 0.04]} />
              </mesh>
            ))}

            {/* Gold trim top */}
            <mesh position={[0, doorCenterY + DOOR.entrance.height / 2 + 0.06, doorFrontZ]} material={M.gold}>
              <boxGeometry args={[1.55, 0.08, 0.06]} />
            </mesh>

            {/* Gold trim sides */}
            {[-0.76, 0.76].map((tx, ti) => (
              <mesh key={`trim-${ti}`} position={[tx, doorCenterY, doorFrontZ]} material={M.gold}>
                <boxGeometry args={[0.06, DOOR.entrance.height + 0.15, 0.06]} />
              </mesh>
            ))}

            {/* Floor indicator panel */}
            <mesh position={[0, doorCenterY + DOOR.entrance.height / 2 + 0.35, doorFrontZ - 0.02]}>
              <boxGeometry args={[0.28, 0.22, 0.04]} />
              <meshStandardMaterial color={0x050a10} roughness={0.05} metalness={0.9} />
            </mesh>
            {/* LED display */}
            <mesh position={[0, doorCenterY + DOOR.entrance.height / 2 + 0.35, doorFrontZ - 0.045]}>
              <boxGeometry args={[0.18, 0.10, 0.005]} />
              <meshStandardMaterial
                color={0x7dd3fc}
                emissive={0x7dd3fc}
                emissiveIntensity={0.6}
              />
            </mesh>

            {/* Call buttons */}
            <group position={[1.0, doorCenterY - 0.15, doorFrontZ - 0.02]}>
              {/* Up button */}
              {levelIdx < HOTEL.totalLevels - 1 && (
                <mesh position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.02, 10]} />
                  <meshStandardMaterial
                    color={0xc9a84c}
                    emissive={0xc9a84c}
                    emissiveIntensity={0.3}
                    metalness={0.9}
                    roughness={0.1}
                  />
                </mesh>
              )}
              {/* Down button */}
              {levelIdx > 0 && (
                <mesh position={[0, -0.08, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.02, 10]} />
                  <meshStandardMaterial
                    color={0xc9a84c}
                    emissive={0xc9a84c}
                    emissiveIntensity={0.3}
                    metalness={0.9}
                    roughness={0.1}
                  />
                </mesh>
              )}
              {/* Button plate */}
              <mesh position={[0, 0, 0.01]}>
                <boxGeometry args={[0.08, 0.28, 0.015]} />
                <meshStandardMaterial color={0x1a1a1a} roughness={0.1} metalness={0.85} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* ─── SHAFT PIT ─────────────────────── */}
      <mesh position={[0, -0.3, 0]} material={M.slab}>
        <boxGeometry args={[SW + 0.2, 0.6, SD + 0.2]} />
      </mesh>

      {/* ─── COUNTERWEIGHT GUIDE ───────────── */}
      <mesh position={[SW / 2 - 0.15, totalH / 2, SD / 2 - 0.1]}>
        <boxGeometry args={[0.2, totalH - 1, 0.12]} />
        <meshStandardMaterial color={0x2a3040} metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
});

ElevatorShaft.displayName = 'ElevatorShaft';