// src/hotel3d/hotel/HotelRoof.tsx

import React, { useMemo } from 'react';
import { HOTEL, BUILDING, ELEVATOR } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

export const HotelRoof: React.FC = React.memo(() => {
  const M = useMemo(() => getMaterialSet(), []);

  const wingLength = BUILDING.chamberWingLength;
  const bW = BUILDING.width;
  const bH = HOTEL.totalHeight;
  const totalLength = wingLength + 8;

  return (
    <group>
      {/* ─── MAIN ROOF SLAB ────────────────── */}
      <mesh position={[0, bH + 0.15, 0]} material={M.slab} receiveShadow>
        <boxGeometry args={[totalLength + 1.5, 0.35, bW + 1.5]} />
      </mesh>

      {/* ─── WATERPROOFING MEMBRANE (visual) ─ */}
      <mesh position={[0, bH + 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[totalLength + 1, bW + 1]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.95} />
      </mesh>

      {/* ─── PARAPET ───────────────────────── */}
      {[
        [totalLength + 1.5, 1.0, 0.4, 0, bH + 0.85, bW / 2 + 0.65],
        [totalLength + 1.5, 1.0, 0.4, 0, bH + 0.85, -bW / 2 - 0.65],
        [0.4, 1.0, bW + 1.5, totalLength / 2 + 0.65, bH + 0.85, 0],
        [0.4, 1.0, bW + 1.5, -totalLength / 2 - 0.65, bH + 0.85, 0],
      ].map(([w, h, d, x, y, z], i) => (
        <mesh key={`parapet-${i}`} position={[x, y, z]} material={M.concreteMain} castShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* ─── PARAPET COPING (metal cap) ────── */}
      {[
        [totalLength + 1.6, 0.06, 0.5, 0, bH + 1.38, bW / 2 + 0.65],
        [totalLength + 1.6, 0.06, 0.5, 0, bH + 1.38, -bW / 2 - 0.65],
        [0.5, 0.06, bW + 1.6, totalLength / 2 + 0.65, bH + 1.38, 0],
        [0.5, 0.06, bW + 1.6, -totalLength / 2 - 0.65, bH + 1.38, 0],
      ].map(([w, h, d, x, y, z], i) => (
        <mesh key={`coping-${i}`} position={[x, y, z]} material={M.metal}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* ─── HVAC MAIN UNIT ────────────────── */}
      <group position={[-4, bH + 0.35, 0]}>
        <mesh position={[0, 1.6, 0]} material={M.concretePanel} castShadow>
          <boxGeometry args={[6.5, 3.0, 4.5]} />
        </mesh>
        <mesh position={[0, 3.25, 0]} material={M.slab}>
          <boxGeometry args={[6.8, 0.22, 4.8]} />
        </mesh>
        {/* Intake grilles */}
        {[-2.5, 2.5].map((gx, i) => (
          <mesh key={`hvac-grille-${i}`} position={[gx, 1.6, 2.28]}>
            <boxGeometry args={[1.5, 1.8, 0.06]} />
            <meshStandardMaterial color={0x555555} roughness={0.3} metalness={0.6} />
          </mesh>
        ))}
        {/* Condenser fans (top) */}
        {[-1.5, 1.5].map((fx, i) => (
          <mesh key={`fan-${i}`} position={[fx, 3.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.15, 16]} />
            <meshStandardMaterial color={0x444444} roughness={0.3} metalness={0.7} />
          </mesh>
        ))}
        {/* Concrete pad */}
        <mesh position={[0, 0, 0]} material={M.slab}>
          <boxGeometry args={[7.0, 0.15, 5.0]} />
        </mesh>
      </group>

      {/* ─── VENTILATION STACK ─────────────── */}
      <group position={[5, bH + 0.35, -2]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.75, 0.9, 2.8, 18]} />
          <meshStandardMaterial color={0x3a4050} roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 3.0, 0]}>
          <coneGeometry args={[1.0, 1.3, 18]} />
          <meshStandardMaterial color={0x2a3040} roughness={0.35} metalness={0.55} />
        </mesh>
        {/* Rain cap */}
        <mesh position={[0, 3.8, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 0.08, 18]} />
          <meshStandardMaterial color={0x2a3040} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ─── SECONDARY EXHAUST VENTS ───────── */}
      {[[2, 3], [7, -1], [3, -3]].map(([vx, vz], i) => (
        <group key={`exhaust-${i}`} position={[vx, bH + 0.35, vz]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.35, 0.9, 12]} />
            <meshStandardMaterial color={0x444444} roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.06, 12]} />
            <meshStandardMaterial color={0x444444} metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ─── ELEVATOR MACHINERY ROOM ───────── */}
      <group position={[0, bH + 0.35, BUILDING.width / 4]}>
        <mesh position={[0, 1.5, 0]} material={M.concretePanel} castShadow>
          <boxGeometry args={[ELEVATOR.shaftWidth + 1.2, 2.8, ELEVATOR.shaftDepth + 1.2]} />
        </mesh>
        <mesh position={[0, 3.0, 0]} material={M.slab}>
          <boxGeometry args={[ELEVATOR.shaftWidth + 1.5, 0.2, ELEVATOR.shaftDepth + 1.5]} />
        </mesh>
        {/* Access door */}
        <mesh position={[ELEVATOR.shaftWidth / 2 + 0.62, 1.05, 0]} material={M.doorMetal}>
          <boxGeometry args={[0.04, 2.1, 0.85]} />
        </mesh>
      </group>

      {/* ─── NETWORK / TELECOM CABINET ─────── */}
      <group position={[7, bH + 0.35, 2]}>
        <mesh position={[0, 1.0, 0]} material={M.metal} castShadow>
          <boxGeometry args={[2.5, 2.0, 1.8]} />
        </mesh>
        {/* Antenna */}
        <mesh position={[0.8, 2.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
          <meshStandardMaterial color={0x666666} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Satellite dish */}
        <mesh position={[-0.6, 2.2, 0]} rotation={[0.3, 0.5, 0]}>
          <cylinderGeometry args={[0.4, 0.45, 0.08, 16]} />
          <meshStandardMaterial color={0xcccccc} roughness={0.2} metalness={0.6} />
        </mesh>
      </group>

      {/* ─── ROOFTOP ACCESS HATCH ──────────── */}
      <group position={[-8, bH + 0.35, 0]}>
        <mesh position={[0, 0.4, 0]} material={M.concretePanel} castShadow>
          <boxGeometry args={[1.5, 0.8, 1.5]} />
        </mesh>
        <mesh position={[0, 0.82, 0]} material={M.metal}>
          <boxGeometry args={[1.0, 0.04, 1.0]} />
        </mesh>
        {/* Hatch handle */}
        <mesh position={[0, 0.88, 0]} material={M.gold}>
          <boxGeometry args={[0.3, 0.04, 0.04]} />
        </mesh>
      </group>

      {/* ─── LIGHTNING ROD ─────────────────── */}
      <mesh position={[0, bH + 4.5, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 4, 8]} />
        <meshStandardMaterial color={0xaaaaaa} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, bH + 6.5, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={0xdddddd} metalness={0.95} roughness={0.05} />
      </mesh>

      {/* ─── ROOF DRAINS ───────────────────── */}
      {[
        [-totalLength / 3, bW / 2 + 0.3],
        [0, bW / 2 + 0.3],
        [totalLength / 3, bW / 2 + 0.3],
        [-totalLength / 3, -bW / 2 - 0.3],
        [totalLength / 3, -bW / 2 - 0.3],
      ].map(([dx, dz], i) => (
        <mesh key={`drain-${i}`} position={[dx, bH + 0.36, dz]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 10]} />
          <meshStandardMaterial color={0x333333} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ─── SOLAR PANEL ARRAY (optional) ──── */}
      <group position={[3, bH + 0.5, -bW / 4]}>
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => (
            <mesh
              key={`solar-${row}-${col}`}
              position={[col * 1.8, 0.3, row * 1.2]}
              rotation={[-0.35, 0, 0]}
            >
              <boxGeometry args={[1.7, 0.04, 1.1]} />
              <meshStandardMaterial
                color={0x1a2244}
                roughness={0.15}
                metalness={0.3}
              />
            </mesh>
          ))
        )}
        {/* Support frames */}
        {Array.from({ length: 4 }, (_, col) => (
          <mesh key={`solar-frame-${col}`} position={[col * 1.8, 0.15, 1.2]}>
            <boxGeometry args={[0.04, 0.3, 3.8]} />
            <meshStandardMaterial color={0x888888} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ─── AVIATION WARNING LIGHT ────────── */}
      <pointLight
        position={[0, bH + 6.5, 0]}
        color={0xff0000}
        intensity={0.5}
        distance={30}
      />
    </group>
  );
});

HotelRoof.displayName = 'HotelRoof';