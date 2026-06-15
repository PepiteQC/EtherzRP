// src/hotel3d/modules/Corridor.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CORRIDOR, ROOM, HOTEL, BUILDING, DOOR } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';
import { createConcreteTexture } from '../textures/ProceduralTextureFactory';

export interface CorridorProps {
  positionY: number;
  floor: number;
}

const FloorNumberSign: React.FC<{
  floor: number;
  x: number;
  y: number;
  z: number;
  faceZ: number;
}> = React.memo(({ floor, x, y, z, faceZ }) => (
  <group position={[x, y, z]}>
    {/* Plate background */}
    <mesh position={[0, 0, faceZ * 0.01]}>
      <boxGeometry args={[0.35, 0.25, 0.02]} />
      <meshStandardMaterial color={0x0a0f1a} roughness={0.2} metalness={0.7} />
    </mesh>
    {/* Number indicator light */}
    <mesh position={[0, 0, faceZ * 0.025]}>
      <boxGeometry args={[0.22, 0.12, 0.005]} />
      <meshStandardMaterial
        color={0x7dd3fc}
        emissive={0x7dd3fc}
        emissiveIntensity={0.8}
      />
    </mesh>
  </group>
));
FloorNumberSign.displayName = 'FloorNumberSign';

const FireExtinguisher: React.FC<{
  x: number; y: number; z: number;
}> = React.memo(({ x, y, z }) => (
  <group position={[x, y, z]}>
    {/* Cabinet */}
    <mesh castShadow>
      <boxGeometry args={[0.30, 0.50, 0.15]} />
      <meshStandardMaterial color={0xcc2222} roughness={0.4} metalness={0.3} />
    </mesh>
    {/* Glass front */}
    <mesh position={[0, 0, 0.08]}>
      <boxGeometry args={[0.24, 0.44, 0.01]} />
      <meshStandardMaterial
        color={0xaaddff}
        transparent
        opacity={0.3}
        roughness={0.02}
      />
    </mesh>
    {/* Extinguisher inside */}
    <mesh position={[0, -0.05, 0]}>
      <cylinderGeometry args={[0.05, 0.05, 0.35, 10]} />
      <meshStandardMaterial color={0xee3333} roughness={0.3} metalness={0.5} />
    </mesh>
  </group>
));
FireExtinguisher.displayName = 'FireExtinguisher';

const CeilingLight: React.FC<{
  x: number; y: number; z: number;
}> = React.memo(({ x, y, z }) => (
  <group position={[x, y, z]}>
    {/* Fixture housing */}
    <mesh>
      <boxGeometry args={[0.4, 0.04, 0.15]} />
      <meshStandardMaterial color={0xf0f0f0} roughness={0.5} metalness={0.3} />
    </mesh>
    {/* Light panel */}
    <mesh position={[0, -0.025, 0]}>
      <boxGeometry args={[0.35, 0.01, 0.12]} />
      <meshStandardMaterial
        color={0xfff8e8}
        emissive={0xfff8e8}
        emissiveIntensity={0.7}
      />
    </mesh>
    <pointLight
      position={[0, -0.1, 0]}
      color={0xfff0dd}
      intensity={0.5}
      distance={6}
    />
  </group>
));
CeilingLight.displayName = 'CeilingLight';

const Sprinkler: React.FC<{
  x: number; y: number; z: number;
}> = React.memo(({ x, y, z }) => (
  <group position={[x, y, z]}>
    <mesh>
      <cylinderGeometry args={[0.015, 0.012, 0.04, 8]} />
      <meshStandardMaterial color={0xcc3333} roughness={0.3} metalness={0.7} />
    </mesh>
    <mesh position={[0, -0.025, 0]}>
      <cylinderGeometry args={[0.025, 0.015, 0.01, 8]} />
      <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
    </mesh>
  </group>
));
Sprinkler.displayName = 'Sprinkler';

const EmergencyLight: React.FC<{
  x: number; y: number; z: number; faceZ: number;
}> = React.memo(({ x, y, z, faceZ }) => (
  <group position={[x, y, z]}>
    <mesh>
      <boxGeometry args={[0.22, 0.08, 0.06]} />
      <meshStandardMaterial color={0xf0f0f0} roughness={0.5} />
    </mesh>
    {/* Twin lamp heads */}
    {[-0.08, 0.08].map((lx, i) => (
      <mesh key={`em-${i}`} position={[lx, -0.02, faceZ * 0.05]}>
        <boxGeometry args={[0.04, 0.04, 0.06]} />
        <meshStandardMaterial
          color={0xffffff}
          emissive={0xffffff}
          emissiveIntensity={0.15}
        />
      </mesh>
    ))}
  </group>
));
EmergencyLight.displayName = 'EmergencyLight';

const ExitSign: React.FC<{
  x: number; y: number; z: number;
}> = React.memo(({ x, y, z }) => (
  <group position={[x, y, z]}>
    <mesh>
      <boxGeometry args={[0.30, 0.12, 0.03]} />
      <meshStandardMaterial
        color={0x00ff44}
        emissive={0x00ff44}
        emissiveIntensity={1.8}
      />
    </mesh>
    {/* Arrow */}
    <mesh position={[0.1, -0.01, 0.018]}>
      <boxGeometry args={[0.08, 0.03, 0.005]} />
      <meshStandardMaterial
        color={0xffffff}
        emissive={0xffffff}
        emissiveIntensity={1.0}
      />
    </mesh>
  </group>
));
ExitSign.displayName = 'ExitSign';

const SmokeDetector: React.FC<{
  x: number; y: number; z: number;
}> = React.memo(({ x, y, z }) => (
  <group position={[x, y, z]}>
    <mesh>
      <cylinderGeometry args={[0.045, 0.045, 0.025, 14]} />
      <meshStandardMaterial color={0xf0f0f0} roughness={0.8} />
    </mesh>
    {/* LED indicator */}
    <mesh position={[0.02, -0.015, 0]}>
      <sphereGeometry args={[0.005, 6, 6]} />
      <meshStandardMaterial
        color={0xff0000}
        emissive={0xff0000}
        emissiveIntensity={0.4}
      />
    </mesh>
  </group>
));
SmokeDetector.displayName = 'SmokeDetector';

const CarpetRunner: React.FC<{
  width: number; length: number; y: number;
}> = React.memo(({ width, length, y }) => {
  const rugMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1520,
      roughness: 0.95,
      metalness: 0.0,
    });
    return mat;
  }, []);

  return (
    <group>
      {/* Main runner */}
      <mesh position={[0, y + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={rugMat}>
        <planeGeometry args={[width * 0.65, length - 1]} />
      </mesh>
      {/* Gold edge strips */}
      {[-width * 0.325 - 0.02, width * 0.325 + 0.02].map((x, i) => (
        <mesh key={`runner-edge-${i}`} position={[x, y + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, length - 1]} />
          <meshStandardMaterial color={0xc9a84c} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
});
CarpetRunner.displayName = 'CarpetRunner';

const WallPanel: React.FC<{
  x: number; y: number; z: number;
  width: number; height: number;
  side: 'left' | 'right';
}> = React.memo(({ x, y, z, width, height, side }) => {
  const M = useMemo(() => getMaterialSet(), []);

  return (
    <group position={[x, y, z]}>
      {/* Lower wainscoting */}
      <mesh position={[0, -height / 2 + 0.5, 0]} material={M.concreteDark}>
        <boxGeometry args={[width, 1.0, 0.03]} />
      </mesh>
      {/* Chair rail */}
      <mesh position={[0, -height / 2 + 1.02, 0]}>
        <boxGeometry args={[width, 0.04, 0.05]} />
        <meshStandardMaterial color={0xc9a84c} metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Upper wall */}
      <mesh position={[0, 0.2, 0]} material={M.concretePanel}>
        <boxGeometry args={[width, height - 1.2, 0.02]} />
      </mesh>
    </group>
  );
});
WallPanel.displayName = 'WallPanel';

export const Corridor: React.FC<CorridorProps> = React.memo(({ positionY, floor }) => {
  const M = useMemo(() => getMaterialSet(), []);

  const corridorLength = HOTEL.roomsPerSide * ROOM.width;
  const H = CORRIDOR.height;
  const W = CORRIDOR.width;

  return (
    <group position={[0, positionY, 0]}>
      {/* ─── CORRIDOR FLOOR ────────────────── */}
      <mesh
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={M.slab}
      >
        <planeGeometry args={[W, corridorLength]} />
      </mesh>

      {/* ─── CARPET RUNNER ─────────────────── */}
      <CarpetRunner width={W} length={corridorLength} y={0} />

      {/* ─── CORRIDOR CEILING ──────────────── */}
      <mesh
        position={[0, H, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
        material={M.ceiling}
      >
        <planeGeometry args={[W + 0.3, corridorLength + 0.3]} />
      </mesh>

      {/* ─── CEILING COVE ──────────────────── */}
      {[-W / 2, W / 2].map((cx, i) => (
        <mesh key={`cove-${i}`} position={[cx, H - 0.06, 0]}>
          <boxGeometry args={[0.12, 0.12, corridorLength]} />
          <meshStandardMaterial color={0xddd8cc} roughness={0.7} />
        </mesh>
      ))}

      {/* ─── WALL PANELS (both sides) ──────── */}
      {Array.from({ length: HOTEL.roomsPerSide }, (_, i) => {
        const z = -corridorLength / 2 + ROOM.width / 2 + i * ROOM.width;
        return (
          <React.Fragment key={`panels-${i}`}>
            <WallPanel
              x={-W / 2 + 0.015}
              y={H / 2}
              z={z}
              width={ROOM.width - DOOR.standard.width - 0.4}
              height={H}
              side="left"
            />
            <WallPanel
              x={W / 2 - 0.015}
              y={H / 2}
              z={z}
              width={ROOM.width - DOOR.standard.width - 0.4}
              height={H}
              side="right"
            />
          </React.Fragment>
        );
      })}

      {/* ─── LED ACCENT STRIP (ceiling) ────── */}
      <mesh position={[0, H - 0.02, 0]}>
        <boxGeometry args={[W * 0.5, 0.015, corridorLength - 1.5]} />
        <meshStandardMaterial
          color={0x7dd3fc}
          emissive={0x7dd3fc}
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* ─── CEILING LIGHTS ────────────────── */}
      {Array.from({ length: HOTEL.roomsPerSide }, (_, i) => {
        const z = -corridorLength / 2 + ROOM.width / 2 + i * ROOM.width;
        return (
          <CeilingLight
            key={`ceiling-light-${floor}-${i}`}
            x={0}
            y={H - 0.03}
            z={z}
          />
        );
      })}

      {/* ─── EMERGENCY LIGHTS ──────────────── */}
      {[-1, 1].map((side, i) => (
        <EmergencyLight
          key={`emergency-${floor}-${i}`}
          x={side * (W / 2 - 0.06)}
          y={H - 0.06}
          z={side * (corridorLength / 3)}
          faceZ={-side}
        />
      ))}

      {/* ─── EXIT SIGNS (both ends) ────────── */}
      {[-1, 1].map((side) => (
        <ExitSign
          key={`exit-${side}`}
          x={0}
          y={H - 0.08}
          z={side * (corridorLength / 2 - 0.4)}
        />
      ))}

      {/* ─── SMOKE DETECTORS ───────────────── */}
      {Array.from({ length: 4 }, (_, i) => {
        const z = -corridorLength / 2 + corridorLength * (i + 0.5) / 4;
        return (
          <SmokeDetector
            key={`smoke-${floor}-${i}`}
            x={(i % 2 === 0 ? -1 : 1) * (W / 4)}
            y={H - 0.012}
            z={z}
          />
        );
      })}

      {/* ─── SPRINKLERS ────────────────────── */}
      {Array.from({ length: 5 }, (_, i) => {
        const z = -corridorLength / 2 + corridorLength * (i + 0.5) / 5;
        return (
          <Sprinkler
            key={`sprinkler-${floor}-${i}`}
            x={0}
            y={H - 0.015}
            z={z}
          />
        );
      })}

      {/* ─── FIRE EXTINGUISHERS ────────────── */}
      {[-1, 1].map((side) => (
        <FireExtinguisher
          key={`extinguisher-${floor}-${side}`}
          x={side * (W / 2 - 0.1)}
          y={1.2}
          z={0}
        />
      ))}

      {/* ─── FLOOR LEVEL SIGNS ─────────────── */}
      {[-1, 1].map((side) => (
        <FloorNumberSign
          key={`floor-sign-${floor}-${side}`}
          floor={floor}
          x={0}
          y={H - 0.35}
          z={side * (corridorLength / 2 - 0.5)}
          faceZ={-side}
        />
      ))}

      {/* ─── HANDRAIL ──────────────────────── */}
      {[-W / 2 + 0.06, W / 2 - 0.06].map((hx, i) => (
        <mesh key={`handrail-${i}`} position={[hx, 0.92, 0]}>
          <boxGeometry args={[0.04, 0.04, corridorLength - 2]} />
          <meshStandardMaterial color={0xc9a84c} metalness={0.88} roughness={0.12} />
        </mesh>
      ))}

      {/* ─── BASEBOARD ─────────────────────── */}
      {[-W / 2 + 0.01, W / 2 - 0.01].map((bx, i) => (
        <mesh key={`baseboard-${i}`} position={[bx, 0.05, 0]}>
          <boxGeometry args={[0.02, 0.1, corridorLength]} />
          <meshStandardMaterial color={0x2a1e14} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}

      {/* ─── ROOM NUMBER SIGNS ─────────────── */}
      {Array.from({ length: HOTEL.roomsPerSide }, (_, pos) => {
        const z = -corridorLength / 2 + ROOM.width / 2 + pos * ROOM.width;
        return (
          <React.Fragment key={`room-signs-${pos}`}>
            {/* Left side room number */}
            <group position={[-W / 2 + 0.02, DOOR.standard.height + 0.15, z]}>
              <mesh>
                <boxGeometry args={[0.14, 0.09, 0.015]} />
                <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
            {/* Right side room number */}
            <group position={[W / 2 - 0.02, DOOR.standard.height + 0.15, z]}>
              <mesh>
                <boxGeometry args={[0.14, 0.09, 0.015]} />
                <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          </React.Fragment>
        );
      })}
    </group>
  );
});

Corridor.displayName = 'Corridor';