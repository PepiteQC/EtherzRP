// src/hotel3d/modules/Room.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  ROOM, BATHROOM, WINDOW, DOOR, FURNITURE,
} from '../constants/dimensions';
import { getMaterialSet, LIGHT_ON, LIGHT_OFF } from '../constants/materials';
import type { RoomId } from '../constants/ids';
import { roomDisplayNumber } from '../constants/ids';

export interface RoomProps {
  positionX: number;
  positionY: number;
  positionZ: number;
  facingDirection: 1 | -1;
  roomId: RoomId;
  lit: boolean;
  onWindowClick?: (roomId: RoomId) => void;
  accessible?: boolean;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const Bed: React.FC<{
  x: number; z: number; type: 'queen' | 'king' | 'single';
}> = React.memo(({ x, z, type }) => {
  const dim = FURNITURE.bed[type];
  return (
    <group position={[x, 0, z]}>
      {/* Frame */}
      <mesh position={[0, dim.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[dim.width + 0.1, dim.height, dim.depth + 0.1]} />
        <meshStandardMaterial color={0x2a1e14} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, dim.height + 0.1, 0]} castShadow>
        <boxGeometry args={[dim.width, 0.22, dim.depth]} />
        <meshStandardMaterial color={0xf5f0e8} roughness={0.95} />
      </mesh>
      {/* Pillows */}
      {[-dim.width / 4, dim.width / 4].map((px, i) => (
        <mesh key={`pillow-${i}`} position={[px, dim.height + 0.28, -dim.depth / 2 + 0.3]} castShadow>
          <boxGeometry args={[dim.width / 2.5, 0.08, 0.4]} />
          <meshStandardMaterial color={0xfaf8f0} roughness={0.9} />
        </mesh>
      ))}
      {/* Duvet */}
      <mesh position={[0, dim.height + 0.24, 0.2]} castShadow>
        <boxGeometry args={[dim.width - 0.05, 0.06, dim.depth * 0.65]} />
        <meshStandardMaterial color={0xd4c8b0} roughness={0.92} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, dim.height + 0.5, -dim.depth / 2 - 0.04]} castShadow>
        <boxGeometry args={[dim.width + 0.15, 0.8, 0.08]} />
        <meshStandardMaterial color={0x1a1208} roughness={0.6} metalness={0.15} />
      </mesh>
    </group>
  );
});
Bed.displayName = 'Bed';

const Nightstand: React.FC<{ x: number; z: number }> = React.memo(({ x, z }) => {
  const ns = FURNITURE.nightstand;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, ns.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[ns.width, ns.height, ns.depth]} />
        <meshStandardMaterial color={0x2a1e14} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Drawer handle */}
      <mesh position={[0, ns.height * 0.4, ns.depth / 2 + 0.01]}>
        <boxGeometry args={[0.12, 0.025, 0.02]} />
        <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Lamp */}
      <mesh position={[0, ns.height + 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 12]} />
        <meshStandardMaterial color={0xc9a84c} metalness={0.8} roughness={0.15} />
      </mesh>
      <mesh position={[0, ns.height + 0.38, 0]}>
        <cylinderGeometry args={[0.12, 0.08, 0.16, 12]} />
        <meshStandardMaterial color={0xf5ead0} roughness={0.9} />
      </mesh>
    </group>
  );
});
Nightstand.displayName = 'Nightstand';

const Desk: React.FC<{ x: number; z: number; rotY?: number }> = React.memo(
  ({ x, z, rotY = 0 }) => {
    const d = FURNITURE.desk;
    return (
      <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
        {/* Top */}
        <mesh position={[0, d.height, 0]} castShadow receiveShadow>
          <boxGeometry args={[d.width, 0.04, d.depth]} />
          <meshStandardMaterial color={0x2a1e14} roughness={0.65} metalness={0.12} />
        </mesh>
        {/* Legs */}
        {[
          [-d.width / 2 + 0.05, -d.depth / 2 + 0.05],
          [d.width / 2 - 0.05, -d.depth / 2 + 0.05],
          [-d.width / 2 + 0.05, d.depth / 2 - 0.05],
          [d.width / 2 - 0.05, d.depth / 2 - 0.05],
        ].map(([lx, lz], i) => (
          <mesh key={`dleg-${i}`} position={[lx, d.height / 2, lz]} castShadow>
            <boxGeometry args={[0.04, d.height, 0.04]} />
            <meshStandardMaterial color={0x1a1410} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* Drawer */}
        <mesh position={[d.width / 4, d.height - 0.12, 0]} castShadow>
          <boxGeometry args={[d.width / 2 - 0.06, 0.16, d.depth - 0.08]} />
          <meshStandardMaterial color={0x22180e} roughness={0.7} />
        </mesh>
        {/* USB-C outlets on desk surface */}
        <mesh position={[-d.width / 3, d.height + 0.005, 0]}>
          <boxGeometry args={[0.08, 0.01, 0.04]} />
          <meshStandardMaterial color={0x333333} roughness={0.1} metalness={0.9} />
        </mesh>
      </group>
    );
  }
);
Desk.displayName = 'Desk';

const DeskChair: React.FC<{ x: number; z: number; rotY?: number }> = React.memo(
  ({ x, z, rotY = 0 }) => {
    const ch = FURNITURE.chair;
    return (
      <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
        {/* Seat */}
        <mesh position={[0, ch.height * 0.5, 0]} castShadow>
          <boxGeometry args={[ch.width, 0.06, ch.depth]} />
          <meshStandardMaterial color={0x1a1410} roughness={0.8} />
        </mesh>
        {/* Back */}
        <mesh position={[0, ch.height * 0.75, -ch.depth / 2 + 0.03]} castShadow>
          <boxGeometry args={[ch.width - 0.04, ch.height * 0.45, 0.04]} />
          <meshStandardMaterial color={0x1a1410} roughness={0.8} />
        </mesh>
        {/* Legs */}
        {[
          [-ch.width / 2 + 0.04, -ch.depth / 2 + 0.04],
          [ch.width / 2 - 0.04, -ch.depth / 2 + 0.04],
          [-ch.width / 2 + 0.04, ch.depth / 2 - 0.04],
          [ch.width / 2 - 0.04, ch.depth / 2 - 0.04],
        ].map(([lx, lz], i) => (
          <mesh key={`cleg-${i}`} position={[lx, ch.height * 0.25, lz]}>
            <cylinderGeometry args={[0.015, 0.015, ch.height * 0.5, 8]} />
            <meshStandardMaterial color={0xc9a84c} metalness={0.85} roughness={0.15} />
          </mesh>
        ))}
      </group>
    );
  }
);
DeskChair.displayName = 'DeskChair';

const Wardrobe: React.FC<{ x: number; z: number }> = React.memo(({ x, z }) => {
  const w = FURNITURE.wardrobe;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, w.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w.width, w.height, w.depth]} />
        <meshStandardMaterial color={0x22180e} roughness={0.65} metalness={0.1} />
      </mesh>
      {/* Door line */}
      <mesh position={[0, w.height / 2, w.depth / 2 + 0.005]}>
        <boxGeometry args={[0.01, w.height - 0.1, 0.01]} />
        <meshStandardMaterial color={0x111111} roughness={0.2} />
      </mesh>
      {/* Handles */}
      {[-0.08, 0.08].map((hx, i) => (
        <mesh key={`wh-${i}`} position={[hx, w.height / 2, w.depth / 2 + 0.02]}>
          <boxGeometry args={[0.02, 0.12, 0.02]} />
          <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
});
Wardrobe.displayName = 'Wardrobe';

const Minibar: React.FC<{ x: number; z: number }> = React.memo(({ x, z }) => {
  const mb = FURNITURE.minibar;
  return (
    <mesh position={[x, mb.height / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[mb.width, mb.height, mb.depth]} />
      <meshStandardMaterial color={0x1a1a1a} roughness={0.3} metalness={0.7} />
    </mesh>
  );
});
Minibar.displayName = 'Minibar';

const Safe: React.FC<{ x: number; z: number }> = React.memo(({ x, z }) => {
  const s = FURNITURE.safe;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, s.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[s.width, s.height, s.depth]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Keypad */}
      <mesh position={[0, s.height * 0.65, s.depth / 2 + 0.005]}>
        <boxGeometry args={[0.1, 0.08, 0.01]} />
        <meshStandardMaterial color={0x003322} emissive={0x003322} emissiveIntensity={0.4} />
      </mesh>
      {/* Handle */}
      <mesh position={[s.width / 4, s.height / 2, s.depth / 2 + 0.015]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
});
Safe.displayName = 'Safe';

const LuggageRack: React.FC<{ x: number; z: number }> = React.memo(({ x, z }) => {
  const lr = FURNITURE.luggageRack;
  return (
    <group position={[x, 0, z]}>
      {/* Top bars */}
      {[-lr.width / 3, 0, lr.width / 3].map((bx, i) => (
        <mesh key={`lrbar-${i}`} position={[bx, lr.height, 0]}>
          <boxGeometry args={[0.03, 0.03, lr.depth]} />
          <meshStandardMaterial color={0x1a1a1a} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Legs */}
      {[
        [-lr.width / 2, -lr.depth / 2],
        [lr.width / 2, -lr.depth / 2],
        [-lr.width / 2, lr.depth / 2],
        [lr.width / 2, lr.depth / 2],
      ].map(([lx, lz], i) => (
        <mesh key={`lrleg-${i}`} position={[lx, lr.height / 2, lz]}>
          <cylinderGeometry args={[0.015, 0.015, lr.height, 8]} />
          <meshStandardMaterial color={0x1a1a1a} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
});
LuggageRack.displayName = 'LuggageRack';

const Thermostat: React.FC<{ x: number; y: number; z: number }> = React.memo(({ x, y, z }) => (
  <group position={[x, y, z]}>
    <mesh castShadow>
      <boxGeometry args={[0.08, 0.12, 0.025]} />
      <meshStandardMaterial color={0xf0f0f0} roughness={0.5} />
    </mesh>
    <mesh position={[0, 0, 0.015]}>
      <boxGeometry args={[0.05, 0.04, 0.005]} />
      <meshStandardMaterial color={0x112233} emissive={0x224466} emissiveIntensity={0.3} />
    </mesh>
  </group>
));
Thermostat.displayName = 'Thermostat';

const RoomDoor: React.FC<{
  x: number; z: number; facing: number;
  accessible: boolean; displayNum: string;
}> = React.memo(({ x, z, facing, accessible, displayNum }) => {
  const M = useMemo(() => getMaterialSet(), []);
  const door = accessible ? DOOR.accessible : DOOR.standard;

  return (
    <group position={[x, 0, z]}>
      {/* Frame */}
      <mesh position={[0, door.height / 2, 0]} material={M.doorMetal} castShadow>
        <boxGeometry args={[door.width + 0.14, door.height + 0.08, 0.10]} />
      </mesh>
      {/* Panel */}
      <mesh position={[0, door.height / 2, 0.04 * facing]} material={M.doorFace} castShadow>
        <boxGeometry args={[door.width, door.height, door.thickness]} />
      </mesh>
      {/* Peephole */}
      <mesh position={[0, door.height * 0.72, 0.05 * facing]}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 10]} />
        <meshStandardMaterial color={0x222222} metalness={0.9} roughness={0.05} />
      </mesh>
      {/* Electronic lock */}
      <mesh position={[door.width / 2 - 0.12, door.height * 0.48, 0.06 * facing]}>
        <boxGeometry args={[0.07, 0.16, 0.03]} />
        <meshStandardMaterial color={0x1a1a1a} roughness={0.1} metalness={0.85} />
      </mesh>
      {/* Card reader slot */}
      <mesh position={[door.width / 2 - 0.12, door.height * 0.52, 0.08 * facing]}>
        <boxGeometry args={[0.04, 0.005, 0.005]} />
        <meshStandardMaterial color={0x00ff44} emissive={0x00ff44} emissiveIntensity={0.6} />
      </mesh>
      {/* Handle */}
      <mesh position={[door.width / 2 - 0.08, door.height * 0.44, 0.06 * facing]} material={M.gold}>
        <boxGeometry args={[0.12, 0.025, 0.04]} />
      </mesh>
      {/* Number plate */}
      <mesh position={[0, door.height * 0.85, 0.06 * facing]} material={M.gold}>
        <boxGeometry args={[0.16, 0.10, 0.015]} />
      </mesh>
      {/* Deadbolt indicator */}
      <mesh position={[door.width / 2 - 0.12, door.height * 0.38, 0.06 * facing]}>
        <cylinderGeometry args={[0.015, 0.015, 0.02, 10]} />
        <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
});
RoomDoor.displayName = 'RoomDoor';

const BathroomInterior: React.FC<{
  width: number; depth: number; height: number;
  offsetX: number; offsetZ: number;
}> = React.memo(({ width, depth, height, offsetX, offsetZ }) => (
  <group position={[offsetX, 0, offsetZ]}>
    {/* Floor tile */}
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={0xe8e4dc} roughness={0.15} metalness={0.08} />
    </mesh>
    {/* Toilet */}
    <mesh position={[-width / 3, 0.22, -depth / 2 + 0.3]} castShadow>
      <boxGeometry args={[0.40, 0.44, 0.55]} />
      <meshStandardMaterial color={0xf5f5f5} roughness={0.1} metalness={0.05} />
    </mesh>
    {/* Sink */}
    <mesh position={[width / 4, 0.4, -depth / 2 + 0.25]} castShadow>
      <boxGeometry args={[0.50, 0.08, 0.40]} />
      <meshStandardMaterial color={0xf5f5f5} roughness={0.08} metalness={0.08} />
    </mesh>
    {/* Mirror */}
    <mesh position={[width / 4, 0.95, -depth / 2 + 0.02]}>
      <boxGeometry args={[0.55, 0.65, 0.02]} />
      <meshStandardMaterial color={0xddeeff} roughness={0.01} metalness={0.95} />
    </mesh>
    {/* Shower/tub area */}
    <mesh position={[0, 0.05, depth / 2 - 0.5]} receiveShadow>
      <boxGeometry args={[width - 0.1, 0.1, 0.9]} />
      <meshStandardMaterial color={0xf0ece6} roughness={0.08} metalness={0.05} />
    </mesh>
    {/* Shower glass */}
    <mesh position={[width / 4, height / 2, depth / 2 - 0.9]}>
      <boxGeometry args={[0.02, height - 0.4, 0.8]} />
      <meshStandardMaterial color={0xaaddff} transparent opacity={0.15} roughness={0.02} />
    </mesh>
    {/* Towel rack */}
    <mesh position={[-width / 2 + 0.05, 0.7, 0]}>
      <boxGeometry args={[0.03, 0.03, 0.5]} />
      <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.1} />
    </mesh>
  </group>
));
BathroomInterior.displayName = 'BathroomInterior';

// ─── ELECTRICAL ──────────────────────────────────────────────────────────────

const WallOutlets: React.FC<{
  roomWidth: number; roomDepth: number; wallHeight: number;
}> = React.memo(({ roomWidth, roomDepth, wallHeight }) => {
  const outletPositions = [
    // Bed sides
    [-roomWidth / 4, 0.35, -roomDepth / 2 + 0.02],
    [roomWidth / 4, 0.35, -roomDepth / 2 + 0.02],
    // Desk area
    [roomWidth / 2 - 0.02, 0.35, 0],
    [roomWidth / 2 - 0.02, 0.75, 0],
    // Near door
    [-roomWidth / 2 + 0.02, 0.35, roomDepth / 3],
  ];

  return (
    <>
      {outletPositions.map(([x, y, z], i) => (
        <mesh key={`outlet-${i}`} position={[x, y, z]}>
          <boxGeometry args={[0.04, 0.06, 0.015]} />
          <meshStandardMaterial color={0xf0f0f0} roughness={0.5} />
        </mesh>
      ))}
    </>
  );
});
WallOutlets.displayName = 'WallOutlets';

// ─── LIGHTING FIXTURES ───────────────────────────────────────────────────────

const RoomLighting: React.FC<{
  width: number; height: number; lit: boolean;
}> = React.memo(({ width, height, lit }) => (
  <>
    {/* Main ceiling light */}
    <mesh position={[0, height - 0.02, 0]}>
      <cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
      <meshStandardMaterial
        color={0xfff8e0}
        emissive={0xfff8e0}
        emissiveIntensity={lit ? 0.6 : 0}
        roughness={0.3}
      />
    </mesh>
    <pointLight
      position={[0, height - 0.1, 0]}
      color={LIGHT_ON}
      intensity={lit ? 0.9 : 0}
      distance={7}
    />

    {/* Reading lights (sconces above bed) */}
    {[-width / 4, width / 4].map((x, i) => (
      <group key={`reader-${i}`}>
        <mesh position={[x, height * 0.6, -3.2]}>
          <boxGeometry args={[0.08, 0.06, 0.12]} />
          <meshStandardMaterial color={0xc9a84c} metalness={0.85} roughness={0.15} />
        </mesh>
        <pointLight
          position={[x, height * 0.55, -3.1]}
          color={0xfff0cc}
          intensity={lit ? 0.25 : 0}
          distance={2.5}
        />
      </group>
    ))}

    {/* Night light (baseboard, soft) */}
    <mesh position={[0, 0.06, 0]}>
      <boxGeometry args={[0.3, 0.03, 0.02]} />
      <meshStandardMaterial
        color={0xff9944}
        emissive={0xff9944}
        emissiveIntensity={lit ? 0.15 : 0}
      />
    </mesh>
  </>
));
RoomLighting.displayName = 'RoomLighting';

// ─── CURTAINS ────────────────────────────────────────────────────────────────

const Curtains: React.FC<{
  windowWidth: number; windowHeight: number;
  sillHeight: number; z: number; facing: number;
}> = React.memo(({ windowWidth, windowHeight, sillHeight, z, facing }) => {
  const curtainHeight = windowHeight + 0.4;
  const curtainTop = sillHeight + windowHeight + 0.2;

  return (
    <group position={[0, 0, z - 0.15 * facing]}>
      {/* Rail */}
      <mesh position={[0, curtainTop + 0.05, 0]}>
        <boxGeometry args={[windowWidth + 0.8, 0.03, 0.03]} />
        <meshStandardMaterial color={0xc9a84c} metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Left panel (blackout) */}
      <mesh position={[-windowWidth / 2 - 0.15, curtainTop - curtainHeight / 2, 0]}>
        <boxGeometry args={[0.5, curtainHeight, 0.03]} />
        <meshStandardMaterial color={0x1a1520} roughness={0.95} />
      </mesh>
      {/* Right panel (blackout) */}
      <mesh position={[windowWidth / 2 + 0.15, curtainTop - curtainHeight / 2, 0]}>
        <boxGeometry args={[0.5, curtainHeight, 0.03]} />
        <meshStandardMaterial color={0x1a1520} roughness={0.95} />
      </mesh>
    </group>
  );
});
Curtains.displayName = 'Curtains';

// ─── SMOKE DETECTOR ──────────────────────────────────────────────────────────

const SmokeDetector: React.FC<{ height: number }> = React.memo(({ height }) => (
  <mesh position={[0, height - 0.015, 0]}>
    <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
    <meshStandardMaterial color={0xf0f0f0} roughness={0.8} />
  </mesh>
));
SmokeDetector.displayName = 'SmokeDetector';

// ─── MAIN ROOM COMPONENT ────────────────────────────────────────────────────

export const Room: React.FC<RoomProps> = React.memo(({
  positionX,
  positionY,
  positionZ,
  facingDirection,
  roomId,
  lit,
  onWindowClick,
  accessible = false,
}) => {
  const M = useMemo(() => getMaterialSet(), []);

  const W = accessible ? 4.8 : ROOM.width;
  const D = ROOM.depth;
  const H = ROOM.wallHeight;
  const WT = ROOM.wallThickness;

  const displayNum = roomDisplayNumber(roomId.floor, roomId.side, roomId.position);

  const windowMat = useMemo(() => {
    const mat = M.glass.clone();
    mat.color.setHex(lit ? LIGHT_ON : 0x7dd3fc);
    mat.emissive = new THREE.Color(lit ? LIGHT_ON : LIGHT_OFF);
    mat.emissiveIntensity = lit ? 0.65 : 0;
    mat.transparent = true;
    mat.opacity = 0.85;
    return mat;
  }, [lit, M.glass]);

  const handleWindowClick = (e: any) => {
    e.stopPropagation();
    onWindowClick?.(roomId);
  };

  const wallZ = D / 2 * facingDirection;

  // Bathroom position: back corner nearest corridor
  const bathX = W / 2 - BATHROOM.width / 2;
  const bathZ = (-D / 2 + BATHROOM.depth / 2) * facingDirection;

  // Furniture positions (mirrored based on facing)
  const f = facingDirection;
  const bedZ = -D * 0.15 * f;
  const deskX = -W / 2 + FURNITURE.desk.width / 2 + 0.3;
  const deskZ = D * 0.15 * f;
  const wardrobeX = W / 2 - FURNITURE.wardrobe.width / 2 - BATHROOM.width - 0.3;
  const wardrobeZ = -D / 2 * f + (BATHROOM.depth + 0.5) * f;

  return (
    <group position={[positionX, positionY, positionZ]}>
      {/* ─── FLOOR ─────────────────────────── */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={M.floorCarpet}>
        <planeGeometry args={[W, D]} />
      </mesh>

      {/* ─── CEILING ───────────────────────── */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow material={M.ceiling}>
        <planeGeometry args={[W, D]} />
      </mesh>

      {/* ─── EXTERIOR WALL ─────────────────── */}
      <mesh position={[0, H / 2, wallZ]} material={M.concreteMain} castShadow receiveShadow>
        <boxGeometry args={[W, H, ROOM.extWallThickness]} />
      </mesh>

      {/* ─── WINDOW ────────────────────────── */}
      <mesh
        position={[0, WINDOW.sillHeight + WINDOW.height / 2, wallZ + 0.01 * facingDirection]}
        material={windowMat}
        onClick={handleWindowClick}
        userData={{
          type: 'window',
          roomId: roomId.key,
          floor: roomId.floor,
          side: roomId.side,
          position: roomId.position,
          displayNum,
        }}
        castShadow
      >
        <boxGeometry args={[WINDOW.width, WINDOW.height, WINDOW.glassThickness]} />
      </mesh>

      {/* ─── WINDOW FRAME ──────────────────── */}
      {[
        { pos: [0, WINDOW.sillHeight + WINDOW.height + 0.03, wallZ], size: [WINDOW.width + 0.12, 0.06, 0.04] },
        { pos: [0, WINDOW.sillHeight - 0.03, wallZ], size: [WINDOW.width + 0.12, 0.06, 0.04] },
        { pos: [-WINDOW.width / 2 - 0.03, WINDOW.sillHeight + WINDOW.height / 2, wallZ], size: [0.06, WINDOW.height + 0.12, 0.04] },
        { pos: [WINDOW.width / 2 + 0.03, WINDOW.sillHeight + WINDOW.height / 2, wallZ], size: [0.06, WINDOW.height + 0.12, 0.04] },
      ].map(({ pos, size }, i) => (
        <mesh key={`wf-${i}`} position={pos as [number, number, number]} material={M.frame}>
          <boxGeometry args={size as [number, number, number]} />
        </mesh>
      ))}

      {/* ─── WINDOW SILL ──────────────────── */}
      <mesh position={[0, WINDOW.sillHeight - 0.06, wallZ + 0.04 * facingDirection]} material={M.metal} castShadow>
        <boxGeometry args={[WINDOW.width + 0.2, 0.04, 0.14]} />
      </mesh>

      {/* ─── CURTAINS ──────────────────────── */}
      <Curtains
        windowWidth={WINDOW.width}
        windowHeight={WINDOW.height}
        sillHeight={WINDOW.sillHeight}
        z={wallZ}
        facing={facingDirection}
      />

      {/* ─── SIDE WALLS ───────────────────── */}
      <mesh position={[-W / 2 + WT / 2, H / 2, 0]} material={M.wallInterior} castShadow receiveShadow>
        <boxGeometry args={[WT, H, D]} />
      </mesh>
      <mesh position={[W / 2 - WT / 2, H / 2, 0]} material={M.wallInterior} castShadow receiveShadow>
        <boxGeometry args={[WT, H, D]} />
      </mesh>

      {/* ─── CORRIDOR WALL ─────────────────── */}
      <mesh position={[0, H / 2, -wallZ]} material={M.wallInterior} castShadow receiveShadow>
        <boxGeometry args={[W, H, WT]} />
      </mesh>

      {/* ─── DOOR ──────────────────────────── */}
      <RoomDoor
        x={0}
        z={-wallZ + 0.01 * -facingDirection}
        facing={-facingDirection}
        accessible={accessible}
        displayNum={displayNum}
      />

      {/* ─── BATHROOM ──────────────────────── */}
      {/* Partition walls */}
      <mesh position={[bathX - BATHROOM.width / 2, H / 2, bathZ]} material={M.wallInterior}>
        <boxGeometry args={[WT, H, BATHROOM.depth]} />
      </mesh>
      <mesh position={[bathX, H / 2, bathZ + BATHROOM.depth / 2 * facingDirection]} material={M.wallInterior}>
        <boxGeometry args={[BATHROOM.width, H, WT]} />
      </mesh>
      {/* Bathroom door */}
      <mesh
        position={[bathX - BATHROOM.width / 2 - 0.03, DOOR.standard.height / 2, bathZ]}
        material={M.doorFace}
      >
        <boxGeometry args={[0.04, DOOR.standard.height, DOOR.standard.width]} />
      </mesh>
      <BathroomInterior
        width={BATHROOM.width}
        depth={BATHROOM.depth}
        height={H}
        offsetX={bathX}
        offsetZ={bathZ}
      />

      {/* ─── FURNITURE ─────────────────────── */}
      <Bed x={0} z={bedZ} type={accessible ? 'king' : 'queen'} />
      <Nightstand
        x={-FURNITURE.bed.queen.width / 2 - FURNITURE.nightstand.width / 2 - 0.1}
        z={bedZ}
      />
      <Nightstand
        x={FURNITURE.bed.queen.width / 2 + FURNITURE.nightstand.width / 2 + 0.1}
        z={bedZ}
      />
      <Desk x={deskX} z={deskZ} rotY={Math.PI / 2 * facingDirection} />
      <DeskChair x={deskX + 0.5 * -facingDirection} z={deskZ} rotY={Math.PI / 2 * -facingDirection} />
      <Wardrobe x={wardrobeX} z={wardrobeZ} />
      <Minibar x={-W / 2 + FURNITURE.minibar.width / 2 + 0.2} z={D / 3 * f} />
      <Safe x={-W / 2 + FURNITURE.safe.width / 2 + 0.15} z={D / 3 * f - 0.5 * f} />
      <LuggageRack x={W / 4} z={D / 3 * f} />

      {/* ─── ELECTRICAL ────────────────────── */}
      <WallOutlets roomWidth={W} roomDepth={D} wallHeight={H} />
      <Thermostat x={-W / 2 + 0.03} y={H * 0.45} z={0} />
      <SmokeDetector height={H} />

      {/* ─── LIGHTING ──────────────────────── */}
      <RoomLighting width={W} height={H} lit={lit} />

      {/* ─── ACOUSTIC INSULATION (visual cue) */}
      {/* Double-layered wall edge strips */}
      {[-W / 2, W / 2].map((sx, i) => (
        <mesh key={`acoustic-${i}`} position={[sx, H / 2, 0]}>
          <boxGeometry args={[0.01, H, D]} />
          <meshStandardMaterial color={0x444444} roughness={0.95} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* ─── WINDOW OPEN DETECTOR (IoT) ──── */}
      <mesh position={[WINDOW.width / 2 + 0.08, WINDOW.sillHeight + WINDOW.height - 0.05, wallZ]}>
        <boxGeometry args={[0.025, 0.04, 0.015]} />
        <meshStandardMaterial color={0xf0f0f0} roughness={0.5} />
      </mesh>
    </group>
  );
});

Room.displayName = 'Room';