// src/hotel3d/modules/Stairwell.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { STAIRWELL, HOTEL, DOOR } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

export interface StairwellProps {
  positionX: number;
  positionZ: number;
  side: 'north' | 'south';
}

const StairFlight: React.FC<{
  baseY: number;
  targetY: number;
  startZ: number;
  direction: 1 | -1;
  width: number;
  material: THREE.MeshStandardMaterial;
}> = React.memo(({ baseY, targetY, startZ, direction, width, material }) => {
  const rise = targetY - baseY;
  const stepsCount = 12;
  const stepH = rise / stepsCount;
  const run = (STAIRWELL.depth - 1.2) / stepsCount;

  return (
    <>
      {Array.from({ length: stepsCount }, (_, step) => (
        <mesh
          key={`step-${step}`}
          position={[
            0,
            baseY + step * stepH + stepH / 2,
            startZ + direction * step * run + direction * run / 2,
          ]}
          material={material}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width, stepH, run]} />
        </mesh>
      ))}
      {/* Nosing strip per step */}
      {Array.from({ length: stepsCount }, (_, step) => (
        <mesh
          key={`nosing-${step}`}
          position={[
            0,
            baseY + (step + 1) * stepH - 0.005,
            startZ + direction * step * run + direction * run / 2,
          ]}
        >
          <boxGeometry args={[width + 0.02, 0.01, 0.03]} />
          <meshStandardMaterial
            color={0xffd580}
            emissive={0xffd580}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </>
  );
});
StairFlight.displayName = 'StairFlight';

export const Stairwell: React.FC<StairwellProps> = React.memo(({
  positionX,
  positionZ,
  side,
}) => {
  const M = useMemo(() => getMaterialSet(), []);

  const totalH = HOTEL.totalHeight + 0.5;
  const W = STAIRWELL.width;
  const D = STAIRWELL.depth;
  const FWT = STAIRWELL.fireWallThickness;

  const fireWallMat = useMemo(() => {
    const mat = M.concreteDark.clone();
    mat.color.setHex(0x555a64);
    return mat;
  }, [M]);

  const flightWidth = W / 2 - 0.25;

  return (
    <group position={[positionX, 0, positionZ]}>
      {/* ─── FIRE-RATED ENCLOSURE ──────────── */}
      {/* Front */}
      <mesh position={[0, totalH / 2, D / 2]} material={fireWallMat} castShadow>
        <boxGeometry args={[W, totalH, FWT]} />
      </mesh>
      {/* Back */}
      <mesh position={[0, totalH / 2, -D / 2]} material={fireWallMat} castShadow>
        <boxGeometry args={[W, totalH, FWT]} />
      </mesh>
      {/* Left */}
      <mesh position={[-W / 2, totalH / 2, 0]} material={fireWallMat} castShadow>
        <boxGeometry args={[FWT, totalH, D]} />
      </mesh>
      {/* Right */}
      <mesh position={[W / 2, totalH / 2, 0]} material={fireWallMat} castShadow>
        <boxGeometry args={[FWT, totalH, D]} />
      </mesh>

      {/* ─── CENTRAL DIVIDER WALL ──────────── */}
      <mesh position={[0, totalH / 2, 0]} material={fireWallMat}>
        <boxGeometry args={[0.12, totalH, D * 0.3]} />
      </mesh>

      {/* ─── STAIRS: RDC to É3 ─────────────── */}
      {Array.from({ length: HOTEL.totalLevels - 1 }, (_, levelIdx) => {
        const baseY = levelIdx * HOTEL.levelHeight;
        const midY = baseY + HOTEL.levelHeight / 2;
        const topY = baseY + HOTEL.levelHeight;

        return (
          <group key={`stair-level-${side}-${levelIdx}`}>
            {/* Landing at midpoint */}
            <mesh
              position={[0, midY, 0]}
              material={M.slab}
              receiveShadow
            >
              <boxGeometry args={[W - 0.6, 0.15, 1.4]} />
            </mesh>

            {/* Landing at top */}
            <mesh
              position={[0, topY, 0]}
              material={M.slab}
              receiveShadow
            >
              <boxGeometry args={[W - 0.6, 0.15, D - 0.6]} />
            </mesh>

            {/* First flight (up from base to mid) */}
            <group position={[-flightWidth / 2 - 0.05, 0, 0]}>
              <StairFlight
                baseY={baseY}
                targetY={midY}
                startZ={-D / 2 + 0.4}
                direction={1}
                width={flightWidth}
                material={M.slab}
              />
            </group>

            {/* Second flight (up from mid to top) */}
            <group position={[flightWidth / 2 + 0.05, 0, 0]}>
              <StairFlight
                baseY={midY}
                targetY={topY}
                startZ={D / 2 - 0.4}
                direction={-1}
                width={flightWidth}
                material={M.slab}
              />
            </group>

            {/* ─── HANDRAILS ───────────────────── */}
            {/* Center rail - first flight */}
            <mesh
              position={[-0.06, (baseY + midY) / 2 + 0.5, 0]}
              rotation={[Math.atan2(HOTEL.levelHeight / 2, D - 1.2), 0, 0]}
            >
              <boxGeometry args={[0.04, 0.04, D - 0.8]} />
              <meshStandardMaterial color={0xc9a84c} metalness={0.88} roughness={0.12} />
            </mesh>
            {/* Center rail - second flight */}
            <mesh
              position={[0.06, (midY + topY) / 2 + 0.5, 0]}
              rotation={[-Math.atan2(HOTEL.levelHeight / 2, D - 1.2), 0, 0]}
            >
              <boxGeometry args={[0.04, 0.04, D - 0.8]} />
              <meshStandardMaterial color={0xc9a84c} metalness={0.88} roughness={0.12} />
            </mesh>
            {/* Wall rails */}
            {[-W / 2 + 0.25, W / 2 - 0.25].map((rx, ri) => (
              <mesh
                key={`wall-rail-${ri}`}
                position={[rx, midY + 0.5, 0]}
              >
                <boxGeometry args={[0.04, 0.04, D - 1.0]} />
                <meshStandardMaterial color={0xc9a84c} metalness={0.88} roughness={0.12} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* ─── FIRE DOORS at each level ──────── */}
      {Array.from({ length: HOTEL.totalLevels }, (_, levelIdx) => {
        const doorY = levelIdx * HOTEL.levelHeight + DOOR.fireDoor.height / 2;
        return (
          <group key={`fire-door-stair-${side}-${levelIdx}`}>
            {/* Door frame */}
            <mesh
              position={[0, doorY, D / 2 - FWT / 2]}
              material={M.doorMetal}
              castShadow
            >
              <boxGeometry args={[DOOR.fireDoor.width + 0.12, DOOR.fireDoor.height + 0.08, DOOR.fireDoor.thickness]} />
            </mesh>
            {/* Door panel */}
            <mesh
              position={[0, doorY, D / 2 - FWT / 2 + 0.04]}
              castShadow
            >
              <boxGeometry args={[DOOR.fireDoor.width, DOOR.fireDoor.height, DOOR.fireDoor.thickness]} />
              <meshStandardMaterial color={0x556677} roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Push bar */}
            <mesh position={[0, doorY, D / 2 - FWT / 2 + 0.08]}>
              <boxGeometry args={[DOOR.fireDoor.width * 0.7, 0.04, 0.03]} />
              <meshStandardMaterial color={0xdddddd} metalness={0.7} roughness={0.2} />
            </mesh>
            {/* "SORTIE" label */}
            <mesh position={[0, doorY + DOOR.fireDoor.height / 2 + 0.15, D / 2 - FWT / 2 + 0.05]}>
              <boxGeometry args={[0.30, 0.10, 0.015]} />
              <meshStandardMaterial
                color={0x00ff44}
                emissive={0x00ff44}
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>
        );
      })}

      {/* ─── EMERGENCY LIGHTING per level ──── */}
      {Array.from({ length: HOTEL.totalLevels }, (_, levelIdx) => {
        const lightY = levelIdx * HOTEL.levelHeight + HOTEL.floorHeight - 0.2;
        return (
          <group key={`stair-emergency-${side}-${levelIdx}`}>
            <pointLight
              position={[0, lightY, 0]}
              color={0xfff8e0}
              intensity={0.45}
              distance={5}
            />
            {/* Fixture */}
            <mesh position={[0, lightY + 0.1, 0]}>
              <boxGeometry args={[0.3, 0.04, 0.15]} />
              <meshStandardMaterial
                color={0xfff8e0}
                emissive={0xfff8e0}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        );
      })}

      {/* ─── FLOOR LEVEL NUMBERS ───────────── */}
      {Array.from({ length: HOTEL.totalLevels }, (_, levelIdx) => {
        const signY = levelIdx * HOTEL.levelHeight + 1.5;
        return (
          <group key={`level-num-${side}-${levelIdx}`} position={[W / 2 - FWT - 0.02, signY, 0]}>
            <mesh>
              <boxGeometry args={[0.01, 0.30, 0.22]} />
              <meshStandardMaterial
                color={0x7dd3fc}
                emissive={0x7dd3fc}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        );
      })}

      {/* ─── SMOKE DETECTORS ───────────────── */}
      {Array.from({ length: HOTEL.totalLevels }, (_, levelIdx) => (
        <mesh
          key={`smoke-stair-${side}-${levelIdx}`}
          position={[0, levelIdx * HOTEL.levelHeight + HOTEL.floorHeight - 0.015, D / 4]}
        >
          <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
          <meshStandardMaterial color={0xf0f0f0} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
});

Stairwell.displayName = 'Stairwell';