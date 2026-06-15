// src/hotel3d/modules/ElevatorCar.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ELEVATOR, HOTEL } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

export interface ElevatorCarProps {
  currentFloor: number;
  positionX: number;
  positionZ: number;
}

const ButtonPanel: React.FC<{ height: number }> = React.memo(({ height }) => {
  const M = useMemo(() => getMaterialSet(), []);

  return (
    <group position={[ELEVATOR.carWidth / 2 - 0.12, height * 0.4, -ELEVATOR.carDepth / 2 + 0.15]}>
      {/* Panel background */}
      <mesh material={M.metal}>
        <boxGeometry args={[0.12, 0.35, 0.03]} />
      </mesh>
      {/* Buttons */}
      {Array.from({ length: HOTEL.totalLevels }, (_, i) => (
        <mesh
          key={`btn-${i}`}
          position={[0, 0.12 - i * 0.07, 0.02]}
          material={M.gold}
        >
          <cylinderGeometry args={[0.015, 0.015, 0.01, 10]} />
        </mesh>
      ))}
      {/* Emergency button */}
      <mesh position={[0, -0.14, 0.02]}>
        <cylinderGeometry args={[0.018, 0.018, 0.01, 10]} />
        <meshStandardMaterial color={0xcc2222} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Display screen */}
      <mesh position={[0, 0.2, 0.02]}>
        <boxGeometry args={[0.08, 0.04, 0.005]} />
        <meshStandardMaterial
          color={0x7dd3fc}
          emissive={0x7dd3fc}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
});
ButtonPanel.displayName = 'ButtonPanel';

export const ElevatorCar: React.FC<ElevatorCarProps> = React.memo(({
  currentFloor,
  positionX,
  positionZ,
}) => {
  const M = useMemo(() => getMaterialSet(), []);

  const W = ELEVATOR.carWidth;
  const D = ELEVATOR.carDepth;
  const H = ELEVATOR.carHeight;
  const y = currentFloor * HOTEL.levelHeight + HOTEL.slabThickness;

  return (
    <group position={[positionX, y, positionZ]}>
      {/* ─── FLOOR (marble) ────────────────── */}
      <mesh position={[0, 0.04, 0]} material={M.marble} receiveShadow>
        <boxGeometry args={[W, 0.08, D, 4, 1, 4]} />
      </mesh>

      {/* ─── CEILING ───────────────────────── */}
      <mesh position={[0, H, 0]} material={M.metal}>
        <boxGeometry args={[W, 0.08, D, 4, 1, 4]} />
      </mesh>

      {/* ─── BACK WALL ─────────────────────── */}
      <mesh position={[0, H / 2, -D / 2 + 0.04]} material={M.metal}>
        <boxGeometry args={[W, H, 0.08]} />
      </mesh>

      {/* ─── SIDE WALLS ────────────────────── */}
      <mesh position={[-W / 2 + 0.04, H / 2, 0]} material={M.metal}>
        <boxGeometry args={[0.08, H, D]} />
      </mesh>
      <mesh position={[W / 2 - 0.04, H / 2, 0]} material={M.metal}>
        <boxGeometry args={[0.08, H, D]} />
      </mesh>

      {/* ─── MIRROR (back wall) ────────────── */}
      <mesh position={[0, H * 0.55, -D / 2 + 0.09]}>
        <boxGeometry args={[W * 0.7, H * 0.45, 0.01]} />
        <meshStandardMaterial
          color={0xddeeff}
          roughness={0.01}
          metalness={0.95}
        />
      </mesh>

      {/* ─── FRONT GLASS PANEL ─────────────── */}
      <mesh position={[0, H * 0.48, D / 2 - 0.03]} material={M.glass}>
        <boxGeometry args={[W * 0.88, H * 0.72, 0.04]} />
      </mesh>

      {/* ─── DOOR FRAME (gold) ─────────────── */}
      {/* Top */}
      <mesh position={[0, H * 0.88, D / 2 - 0.01]} material={M.gold}>
        <boxGeometry args={[W + 0.06, 0.06, 0.08]} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, 0.1, D / 2 - 0.01]} material={M.gold}>
        <boxGeometry args={[W + 0.06, 0.06, 0.08]} />
      </mesh>
      {/* Sides */}
      {[-W / 2 - 0.01, W / 2 + 0.01].map((x, i) => (
        <mesh key={`frame-v-${i}`} position={[x, H / 2, D / 2 - 0.01]} material={M.gold}>
          <boxGeometry args={[0.06, H, 0.08]} />
        </mesh>
      ))}

      {/* ─── HANDRAILS ─────────────────────── */}
      {/* Back rail */}
      <mesh position={[0, 0.92, -D / 2 + 0.12]} material={M.gold}>
        <boxGeometry args={[W * 0.85, 0.04, 0.04]} />
      </mesh>
      {/* Side rails */}
      {[-1, 1].map((side, i) => (
        <mesh key={`side-rail-${i}`} position={[side * (W / 2 - 0.12), 0.92, 0]} material={M.gold}>
          <boxGeometry args={[0.04, 0.04, D * 0.85]} />
        </mesh>
      ))}
      {/* Rail brackets */}
      {[-W * 0.35, 0, W * 0.35].map((bx, i) => (
        <mesh key={`bracket-${i}`} position={[bx, 0.92, -D / 2 + 0.1]} material={M.gold}>
          <boxGeometry args={[0.03, 0.12, 0.06]} />
        </mesh>
      ))}

      {/* ─── BUTTON PANEL ──────────────────── */}
      <ButtonPanel height={H} />

      {/* ─── CEILING LIGHT ─────────────────── */}
      <mesh position={[0, H - 0.05, 0]}>
        <boxGeometry args={[W * 0.65, 0.02, D * 0.65]} />
        <meshStandardMaterial
          color={0xfff0d0}
          emissive={0xfff0d0}
          emissiveIntensity={0.85}
        />
      </mesh>
      {/* Accent ring */}
      <mesh position={[0, H - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[W * 0.3, 0.015, 6, 24]} />
        <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Interior light */}
      <pointLight
        position={[0, H * 0.8, 0]}
        color={0xfff0d0}
        intensity={1.2}
        distance={5}
      />

      {/* ─── VENTILATION GRILLE (ceiling) ──── */}
      <mesh position={[W / 3, H - 0.04, -D / 3]}>
        <boxGeometry args={[0.15, 0.01, 0.15]} />
        <meshStandardMaterial color={0xaaaaaa} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* ─── WEIGHT CAPACITY PLATE ─────────── */}
      <mesh position={[-W / 2 + 0.08, 0.5, -D / 2 + 0.09]}>
        <boxGeometry args={[0.08, 0.05, 0.005]} />
        <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ─── EMERGENCY PHONE ───────────────── */}
      <mesh position={[W / 2 - 0.1, 1.0, -D / 2 + 0.09]}>
        <boxGeometry args={[0.06, 0.08, 0.03]} />
        <meshStandardMaterial color={0xcc2222} roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
});

ElevatorCar.displayName = 'ElevatorCar';