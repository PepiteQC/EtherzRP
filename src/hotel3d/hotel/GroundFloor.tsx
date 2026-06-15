// src/hotel3d/hotel/GroundFloor.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HOTEL, BUILDING, HALL, LOBBY, CORRIDOR, SERVICE, ELEVATOR } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

/**
 * REZ-DE-CHAUSSÉE — HALL CENTRAL
 * 
 * Pas de chambres au RDC.
 * Hall central élargi qui relie le lobby à l'ascenseur et aux escaliers.
 * Locaux de service regroupés ici.
 */
export const GroundFloor: React.FC = React.memo(() => {
  const M = useMemo(() => getMaterialSet(), []);
  const bW = BUILDING.width;
  const bD = BUILDING.depth;
  const hallW = HALL.width;
  const hallD = HALL.depth;
  const hallH = HALL.height;

  return (
    <group>
      {/* ─── HALL FLOOR (marble) ───────────── */}
      <mesh position={[0, 0.08, 0]} material={M.marbleFloor} receiveShadow>
        <boxGeometry args={[hallW + 2, 0.15, hallD]} />
      </mesh>

      {/* ─── HALL CEILING ──────────────────── */}
      <mesh position={[0, hallH, 0]} material={M.ceiling} receiveShadow>
        <boxGeometry args={[hallW + 2, 0.15, hallD]} />
      </mesh>

      {/* ─── HALL WALLS ────────────────────── */}
      {/* Left wall */}
      <mesh position={[-(hallW / 2 + 1), hallH / 2, 0]} material={M.wallpaper} castShadow>
        <boxGeometry args={[0.15, hallH, hallD]} />
      </mesh>
      {/* Right wall */}
      <mesh position={[(hallW / 2 + 1), hallH / 2, 0]} material={M.wallpaper} castShadow>
        <boxGeometry args={[0.15, hallH, hallD]} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, hallH / 2, -hallD / 2]} material={M.wallpaper} castShadow>
        <boxGeometry args={[hallW + 2, hallH, 0.15]} />
      </mesh>

      {/* ─── SERVICE ROOMS ─────────────────── */}
      {/* Linen room — left side */}
      <ServiceRoom
        label="LINGE"
        width={SERVICE.linenRoom.width}
        depth={SERVICE.linenRoom.depth}
        height={hallH}
        position={[-(hallW / 2 + 1) + SERVICE.linenRoom.width / 2 + 0.2,
          0, -hallD / 2 + SERVICE.linenRoom.depth / 2 + 0.5]}
        material={M.concretePanel}
        doorMaterial={M.doorMetal}
      />

      {/* Janitor closet — left side */}
      <ServiceRoom
        label="ENTRETIEN"
        width={SERVICE.janitorCloset.width}
        depth={SERVICE.janitorCloset.depth}
        height={hallH}
        position={[-(hallW / 2 + 1) + SERVICE.janitorCloset.width / 2 + 0.2,
          0, -hallD / 2 + SERVICE.linenRoom.depth + SERVICE.janitorCloset.depth / 2 + 1.0]}
        material={M.concretePanel}
        doorMaterial={M.doorMetal}
      />

      {/* Network room — right side */}
      <ServiceRoom
        label="RÉSEAU"
        width={SERVICE.networkRoom.width}
        depth={SERVICE.networkRoom.depth}
        height={hallH}
        position={[(hallW / 2 + 1) - SERVICE.networkRoom.width / 2 - 0.2,
          0, -hallD / 2 + SERVICE.networkRoom.depth / 2 + 0.5]}
        material={M.concretePanel}
        doorMaterial={M.doorMetal}
      />

      {/* Security room — right side */}
      <ServiceRoom
        label="SÉCURITÉ"
        width={SERVICE.securityRoom.width}
        depth={SERVICE.securityRoom.depth}
        height={hallH}
        position={[(hallW / 2 + 1) - SERVICE.securityRoom.width / 2 - 0.2,
          0, -hallD / 2 + SERVICE.networkRoom.depth + SERVICE.securityRoom.depth / 2 + 1.0]}
        material={M.concretePanel}
        doorMaterial={M.doorMetal}
      />

      {/* ─── HALL LIGHTING ─────────────────── */}
      {Array.from({ length: 4 }, (_, i) => {
        const z = -hallD / 2 + hallD * (i + 0.5) / 4;
        return (
          <group key={`hall-light-${i}`}>
            {/* Recessed ceiling light */}
            <mesh position={[0, hallH - 0.02, z]}>
              <cylinderGeometry args={[0.15, 0.15, 0.025, 14]} />
              <meshStandardMaterial color={0xfff0d0} emissive={new THREE.Color(0xfff0d0)} emissiveIntensity={0.7} />
            </mesh>
            <pointLight position={[0, hallH - 0.15, z]} color={0xffeedd} intensity={0.8} distance={10} />
          </group>
        );
      })}

      {/* ─── LED STRIP along ceiling ──────── */}
      <mesh position={[0, hallH - 0.05, 0]} material={M.ledStrip}>
        <boxGeometry args={[hallW, 0.02, hallD - 1]} />
      </mesh>

      {/* ─── DIRECTIONAL SIGNS ─────────────── */}
      {/* "CHAMBRES →" sign */}
      <mesh position={[0, hallH - 0.3, hallD / 2 - 0.5]}>
        <boxGeometry args={[1.0, 0.2, 0.02]} />
        <meshStandardMaterial color={0x1a2535} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* "ASCENSEUR" sign */}
      <mesh position={[ELEVATOR.positionX, hallH - 0.3, ELEVATOR.positionZ - ELEVATOR.shaftDepth / 2 - 0.5]}>
        <boxGeometry args={[0.8, 0.15, 0.02]} />
        <meshStandardMaterial color={0x1a2535} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* ─── FLOOR SLAB ───────────────────── */}
      <mesh position={[0, -0.01, 0]} material={M.slab} receiveShadow>
        <boxGeometry args={[bW, HOTEL.slabThickness, bD]} />
      </mesh>

      {/* ─── EXIT SIGNS ───────────────────── */}
      {[-1, 1].map((s) => (
        <mesh key={`exit-gf-${s}`}
          position={[0, hallH - 0.12, s * (hallD / 2 - 0.3)]}
          material={M.exitSign}
        >
          <boxGeometry args={[0.28, 0.09, 0.015]} />
        </mesh>
      ))}

      {/* ─── SMOKE DETECTORS ──────────────── */}
      {Array.from({ length: 3 }, (_, i) => (
        <mesh key={`smoke-gf-${i}`}
          position={[(i - 1) * (hallW / 3), hallH - 0.015, 0]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
          <meshStandardMaterial color={0xf0f0f0} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
});

GroundFloor.displayName = 'GroundFloor';

// ─── SERVICE ROOM SUB-COMPONENT ──────────────────────────────────────────────

interface ServiceRoomProps {
  label: string;
  width: number;
  depth: number;
  height: number;
  position: [number, number, number];
  material: THREE.MeshStandardMaterial;
  doorMaterial: THREE.MeshStandardMaterial;
}

const ServiceRoom: React.FC<ServiceRoomProps> = React.memo(({
  label, width, depth, height, position: pos, material, doorMaterial,
}) => {
  const M = useMemo(() => getMaterialSet(), []);
  const [px, py, pz] = pos;

  return (
    <group position={[px, py, pz]}>
      {/* Walls */}
      <mesh position={[0, height / 2, -depth / 2]} material={material} castShadow>
        <boxGeometry args={[width, height, 0.12]} />
      </mesh>
      <mesh position={[0, height / 2, depth / 2]} material={material} castShadow>
        <boxGeometry args={[width, height, 0.12]} />
      </mesh>
      <mesh position={[-width / 2, height / 2, 0]} material={material} castShadow>
        <boxGeometry args={[0.12, height, depth]} />
      </mesh>
      <mesh position={[width / 2, height / 2, 0]} material={material} castShadow>
        <boxGeometry args={[0.12, height, depth]} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 1.05, depth / 2 + 0.065]} material={doorMaterial}>
        <boxGeometry args={[0.85, 2.1, 0.05]} />
      </mesh>

      {/* Label plate */}
      <mesh position={[0, 2.3, depth / 2 + 0.08]} material={M.gold}>
        <boxGeometry args={[0.6, 0.12, 0.015]} />
      </mesh>
    </group>
  );
});

ServiceRoom.displayName = 'ServiceRoom';