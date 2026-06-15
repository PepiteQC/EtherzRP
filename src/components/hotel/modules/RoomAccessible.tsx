// src/components/hotel/modules/RoomAccessible.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  ROOM_ACCESSIBLE, BATHROOM, WINDOW, DOOR, FURNITURE,
} from '../constants/dimensions';
import { getMaterialSet, LIGHT_ON, LIGHT_OFF } from '../constants/materials';
import type { RoomId } from '../constants/ids';
import { roomDisplayNumber } from '../constants/ids';

/**
 * Chambre accessible — conforme aux normes.
 * - Porte 0.92m minimum
 * - Dégagement 0.90m autour du lit
 * - Barres d'appui salle de bain
 * - Douche de plain-pied (pas de rebord)
 * - Lavabo accessible (hauteur réduite)
 * - Miroir inclinable
 * - Interrupteurs à hauteur fauteuil
 * - Judas à double hauteur
 * - Thermostat accessible
 */

const GrabBar: React.FC<{
  position: [number, number, number];
  length: number;
  vertical?: boolean;
}> = React.memo(({ position, length, vertical = false }) => (
  <mesh
    position={position}
    rotation={vertical ? [0, 0, Math.PI / 2] : [0, 0, 0]}
    castShadow
  >
    <cylinderGeometry args={[0.018, 0.018, length, 10]} />
    <meshStandardMaterial color={0xdddddd} metalness={0.85} roughness={0.15} />
  </mesh>
));
GrabBar.displayName = 'GrabBar';

const AccessibleBathroom: React.FC<{
  width: number;
  depth: number;
  height: number;
  offsetX: number;
  offsetZ: number;
}> = React.memo(({ width, depth, height, offsetX, offsetZ }) => (
  <group position={[offsetX, 0, offsetZ]}>
    {/* Floor — non-slip tile */}
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={0xddd8cc} roughness={0.35} metalness={0.05} />
    </mesh>

    {/* Toilet — raised height */}
    <mesh position={[-width / 3, 0.25, -depth / 2 + 0.35]} castShadow>
      <boxGeometry args={[0.42, 0.50, 0.58]} />
      <meshStandardMaterial color={0xf5f5f5} roughness={0.1} metalness={0.05} />
    </mesh>

    {/* Grab bars around toilet */}
    <GrabBar position={[-width / 3 - 0.3, 0.45, -depth / 2 + 0.35]} length={0.5} vertical />
    <GrabBar position={[-width / 3 + 0.3, 0.45, -depth / 2 + 0.35]} length={0.5} vertical />
    <GrabBar position={[-width / 3, 0.7, -depth / 2 + 0.1]} length={0.5} />

    {/* Sink — lowered, open underneath for wheelchair */}
    <mesh position={[width / 4, 0.55, -depth / 2 + 0.3]} castShadow>
      <boxGeometry args={[0.55, 0.06, 0.45]} />
      <meshStandardMaterial color={0xf5f5f5} roughness={0.08} metalness={0.08} />
    </mesh>
    {/* Sink bracket (no pedestal — wheelchair clearance) */}
    <mesh position={[width / 4 - 0.22, 0.35, -depth / 2 + 0.08]}>
      <boxGeometry args={[0.04, 0.4, 0.04]} />
      <meshStandardMaterial color={0xdddddd} metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[width / 4 + 0.22, 0.35, -depth / 2 + 0.08]}>
      <boxGeometry args={[0.04, 0.4, 0.04]} />
      <meshStandardMaterial color={0xdddddd} metalness={0.8} roughness={0.2} />
    </mesh>

    {/* Mirror — tilted for seated user */}
    <mesh position={[width / 4, 0.90, -depth / 2 + 0.04]} rotation={[0.12, 0, 0]}>
      <boxGeometry args={[0.55, 0.70, 0.02]} />
      <meshStandardMaterial color={0xddeeff} roughness={0.01} metalness={0.95} />
    </mesh>

    {/* Roll-in shower — NO curb */}
    <mesh position={[0, 0.003, depth / 2 - 0.6]} receiveShadow>
      <planeGeometry args={[width - 0.2, 1.2]} />
      <meshStandardMaterial color={0xe8e4dc} roughness={0.12} />
    </mesh>
    {/* Shower seat (fold-down) */}
    <mesh position={[-width / 4, 0.48, depth / 2 - 0.5]} castShadow>
      <boxGeometry args={[0.45, 0.04, 0.35]} />
      <meshStandardMaterial color={0xf0f0f0} roughness={0.3} />
    </mesh>
    {/* Shower seat bracket */}
    <mesh position={[-width / 4, 0.35, depth / 2 - 0.3]}>
      <boxGeometry args={[0.04, 0.25, 0.04]} />
      <meshStandardMaterial color={0xdddddd} metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Shower grab bars */}
    <GrabBar position={[-width / 2 + 0.08, 0.85, depth / 2 - 0.6]} length={1.0} vertical />
    <GrabBar position={[0, 0.85, depth / 2 - 0.15]} length={width - 0.4} />
    {/* Handheld showerhead on vertical rail */}
    <mesh position={[width / 4, 0.9, depth / 2 - 0.18]}>
      <cylinderGeometry args={[0.012, 0.012, 0.8, 8]} />
      <meshStandardMaterial color={0xdddddd} metalness={0.85} roughness={0.15} />
    </mesh>

    {/* Towel rack — lower height */}
    <GrabBar position={[-width / 2 + 0.08, 0.55, 0]} length={0.55} />

    {/* Emergency pull cord */}
    <mesh position={[-width / 3, 0.15, -depth / 2 + 0.5]}>
      <cylinderGeometry args={[0.008, 0.008, 1.5, 6]} />
      <meshStandardMaterial color={0xcc2222} roughness={0.5} />
    </mesh>
    {/* Pull handle */}
    <mesh position={[-width / 3, 0.05, -depth / 2 + 0.5]}>
      <boxGeometry args={[0.04, 0.06, 0.02]} />
      <meshStandardMaterial color={0xcc2222} roughness={0.4} />
    </mesh>
  </group>
));
AccessibleBathroom.displayName = 'AccessibleBathroom';

export interface RoomAccessibleProps {
  positionX: number;
  positionY: number;
  positionZ: number;
  facingDirection: 1 | -1;
  roomId: RoomId;
  lit: boolean;
  onWindowClick?: (roomId: RoomId) => void;
}

export const RoomAccessible: React.FC<RoomAccessibleProps> = React.memo(({
  positionX, positionY, positionZ,
  facingDirection, roomId, lit, onWindowClick,
}) => {
  const M = useMemo(() => getMaterialSet(), []);

  const W = ROOM_ACCESSIBLE.width;
  const D = ROOM_ACCESSIBLE.depth;
  const H = ROOM_ACCESSIBLE.width > 0 ? 3.0 : 3.0;
  const clearance = ROOM_ACCESSIBLE.bedClearance;

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

  const wallZ = D / 2 * facingDirection;
  const f = facingDirection;

  return (
    <group position={[positionX, positionY, positionZ]}>
      {/* ─── FLOOR ─────────────────────────── */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        {/* Hard floor instead of carpet for wheelchair */}
        <meshStandardMaterial color={0xc8b898} roughness={0.15} metalness={0.08} />
      </mesh>

      {/* ─── CEILING ───────────────────────── */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow material={M.ceiling}>
        <planeGeometry args={[W, D]} />
      </mesh>

      {/* ─── WALLS ─────────────────────────── */}
      <mesh position={[0, H / 2, wallZ]} material={M.concreteMain} castShadow>
        <boxGeometry args={[W, H, 0.25]} />
      </mesh>
      <mesh position={[-W / 2 + 0.075, H / 2, 0]} material={M.wallInterior} castShadow>
        <boxGeometry args={[0.15, H, D]} />
      </mesh>
      <mesh position={[W / 2 - 0.075, H / 2, 0]} material={M.wallInterior} castShadow>
        <boxGeometry args={[0.15, H, D]} />
      </mesh>
      <mesh position={[0, H / 2, -wallZ]} material={M.wallInterior} castShadow>
        <boxGeometry args={[W, H, 0.15]} />
      </mesh>

      {/* ─── WIDER DOOR (0.92m) ────────────── */}
      <group position={[0, 0, -wallZ + 0.01 * -f]}>
        <mesh position={[0, DOOR.accessible.height / 2, 0]} material={M.doorMetal} castShadow>
          <boxGeometry args={[DOOR.accessible.width + 0.16, DOOR.accessible.height + 0.08, 0.10]} />
        </mesh>
        <mesh position={[0, DOOR.accessible.height / 2, 0.04 * -f]} material={M.doorFace} castShadow>
          <boxGeometry args={[DOOR.accessible.width, DOOR.accessible.height, DOOR.accessible.thickness]} />
        </mesh>
        {/* Electronic lock */}
        <mesh position={[DOOR.accessible.width / 2 - 0.12, DOOR.accessible.height * 0.48, 0.06 * -f]}>
          <boxGeometry args={[0.07, 0.16, 0.03]} />
          <meshStandardMaterial color={0x1a1a1a} roughness={0.1} metalness={0.85} />
        </mesh>
        {/* Card reader LED */}
        <mesh position={[DOOR.accessible.width / 2 - 0.12, DOOR.accessible.height * 0.52, 0.08 * -f]}>
          <boxGeometry args={[0.04, 0.005, 0.005]} />
          <meshStandardMaterial color={0x00ff44} emissive={0x00ff44} emissiveIntensity={0.6} />
        </mesh>
        {/* Lever handle (not knob — accessible) */}
        <mesh position={[DOOR.accessible.width / 2 - 0.08, DOOR.accessible.height * 0.44, 0.06 * -f]} material={M.gold}>
          <boxGeometry args={[0.14, 0.025, 0.04]} />
        </mesh>
        {/* Peephole — dual height */}
        <mesh position={[0, DOOR.accessible.height * 0.72, 0.05 * -f]}>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 10]} />
          <meshStandardMaterial color={0x222222} metalness={0.9} roughness={0.05} />
        </mesh>
        <mesh position={[0, DOOR.accessible.height * 0.52, 0.05 * -f]}>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 10]} />
          <meshStandardMaterial color={0x222222} metalness={0.9} roughness={0.05} />
        </mesh>
        {/* Number plate */}
        <mesh position={[0, DOOR.accessible.height * 0.85, 0.06 * -f]} material={M.gold}>
          <boxGeometry args={[0.16, 0.10, 0.015]} />
        </mesh>
        {/* Accessibility symbol */}
        <mesh position={[-DOOR.accessible.width / 2 - 0.15, DOOR.accessible.height * 0.5, 0.02 * -f]}>
          <boxGeometry args={[0.10, 0.10, 0.01]} />
          <meshStandardMaterial color={0x2266cc} roughness={0.4} />
        </mesh>
      </group>

      {/* ─── WINDOW (same as standard) ─────── */}
      <mesh
        position={[0, WINDOW.sillHeight + WINDOW.height / 2, wallZ + 0.01 * f]}
        material={windowMat}
        onClick={(e: any) => { e.stopPropagation(); onWindowClick?.(roomId); }}
        userData={{
          type: 'window',
          roomId: roomId.key,
          floor: roomId.floor,
          side: roomId.side,
          position: roomId.position,
          displayNum,
          accessible: true,
        }}
        castShadow
      >
        <boxGeometry args={[WINDOW.width, WINDOW.height, WINDOW.glassThickness]} />
      </mesh>
      {/* Window frame */}
      {[
        { pos: [0, WINDOW.sillHeight + WINDOW.height + 0.03, wallZ] as [number, number, number], size: [WINDOW.width + 0.12, 0.06, 0.04] as [number, number, number] },
        { pos: [0, WINDOW.sillHeight - 0.03, wallZ] as [number, number, number], size: [WINDOW.width + 0.12, 0.06, 0.04] as [number, number, number] },
        { pos: [-WINDOW.width / 2 - 0.03, WINDOW.sillHeight + WINDOW.height / 2, wallZ] as [number, number, number], size: [0.06, WINDOW.height + 0.12, 0.04] as [number, number, number] },
        { pos: [WINDOW.width / 2 + 0.03, WINDOW.sillHeight + WINDOW.height / 2, wallZ] as [number, number, number], size: [0.06, WINDOW.height + 0.12, 0.04] as [number, number, number] },
      ].map(({ pos, size }, i) => (
        <mesh key={`wf-${i}`} position={pos} material={M.frame}>
          <boxGeometry args={size} />
        </mesh>
      ))}

      {/* ─── WINDOW SILL (lower for seated view) */}
      <mesh position={[0, WINDOW.sillHeight - 0.06, wallZ + 0.04 * f]} material={M.metal} castShadow>
        <boxGeometry args={[WINDOW.width + 0.2, 0.04, 0.14]} />
      </mesh>

      {/* ─── CURTAINS (motorized rod) ──────── */}
      <group position={[0, 0, wallZ - 0.15 * f]}>
        <mesh position={[0, WINDOW.sillHeight + WINDOW.height + 0.25, 0]}>
          <boxGeometry args={[WINDOW.width + 0.8, 0.04, 0.04]} />
          <meshStandardMaterial color={0xc9a84c} metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Motor housing */}
        <mesh position={[WINDOW.width / 2 + 0.35, WINDOW.sillHeight + WINDOW.height + 0.25, 0]}>
          <boxGeometry args={[0.08, 0.06, 0.06]} />
          <meshStandardMaterial color={0x333333} roughness={0.3} metalness={0.7} />
        </mesh>
        {[-WINDOW.width / 2 - 0.15, WINDOW.width / 2 + 0.15].map((cx, i) => (
          <mesh key={`curtain-${i}`} position={[cx, WINDOW.sillHeight + WINDOW.height / 2 + 0.1, 0]}>
            <boxGeometry args={[0.5, WINDOW.height + 0.5, 0.03]} />
            <meshStandardMaterial color={0x1a1520} roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* ─── BED (King, centered, clearance all sides) ── */}
      <group position={[0, 0, -D * 0.15 * f]}>
        {/* Frame */}
        <mesh position={[0, FURNITURE.bed.king.height / 2, 0]} castShadow>
          <boxGeometry args={[FURNITURE.bed.king.width + 0.1, FURNITURE.bed.king.height, FURNITURE.bed.king.depth + 0.1]} />
          <meshStandardMaterial color={0x2a1e14} roughness={0.7} metalness={0.1} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, FURNITURE.bed.king.height + 0.1, 0]} castShadow>
          <boxGeometry args={[FURNITURE.bed.king.width, 0.22, FURNITURE.bed.king.depth]} />
          <meshStandardMaterial color={0xf5f0e8} roughness={0.95} />
        </mesh>
        {/* Pillows */}
        {[-FURNITURE.bed.king.width / 4, FURNITURE.bed.king.width / 4].map((px, i) => (
          <mesh key={`pillow-${i}`} position={[px, FURNITURE.bed.king.height + 0.28, -FURNITURE.bed.king.depth / 2 + 0.3]} castShadow>
            <boxGeometry args={[FURNITURE.bed.king.width / 2.5, 0.08, 0.4]} />
            <meshStandardMaterial color={0xfaf8f0} roughness={0.9} />
          </mesh>
        ))}
        {/* Headboard */}
        <mesh position={[0, FURNITURE.bed.king.height + 0.5, -FURNITURE.bed.king.depth / 2 - 0.04]} castShadow>
          <boxGeometry args={[FURNITURE.bed.king.width + 0.15, 0.8, 0.08]} />
          <meshStandardMaterial color={0x1a1208} roughness={0.6} metalness={0.15} />
        </mesh>
      </group>

      {/* ─── NIGHTSTANDS ───────────────────── */}
      {[-FURNITURE.bed.king.width / 2 - 0.55, FURNITURE.bed.king.width / 2 + 0.55].map((nx, i) => (
        <group key={`ns-${i}`} position={[nx, 0, -D * 0.15 * f]}>
          <mesh position={[0, 0.275, 0]} castShadow>
            <boxGeometry args={[0.45, 0.55, 0.40]} />
            <meshStandardMaterial color={0x2a1e14} roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Lamp */}
          <mesh position={[0, 0.55 + 0.15, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.3, 12]} />
            <meshStandardMaterial color={0xc9a84c} metalness={0.8} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.55 + 0.38, 0]}>
            <cylinderGeometry args={[0.12, 0.08, 0.16, 12]} />
            <meshStandardMaterial color={0xf5ead0} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ─── DESK (wheelchair accessible — open underneath) */}
      <group position={[-W / 2 + 0.9, 0, D * 0.2 * f]}>
        {/* Top */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[1.2, 0.04, 0.65]} />
          <meshStandardMaterial color={0x2a1e14} roughness={0.65} metalness={0.12} />
        </mesh>
        {/* Single back support (open front for wheelchair) */}
        <mesh position={[0, 0.375, -0.3]}>
          <boxGeometry args={[1.18, 0.75, 0.04]} />
          <meshStandardMaterial color={0x22180e} roughness={0.7} />
        </mesh>
        {/* Side supports */}
        {[-0.58, 0.58].map((sx, i) => (
          <mesh key={`desk-side-${i}`} position={[sx, 0.375, 0]}>
            <boxGeometry args={[0.04, 0.75, 0.6]} />
            <meshStandardMaterial color={0x22180e} roughness={0.7} />
          </mesh>
        ))}
        {/* USB-C outlet on desk */}
        <mesh position={[-0.3, 0.755, 0.1]}>
          <boxGeometry args={[0.08, 0.01, 0.04]} />
          <meshStandardMaterial color={0x333333} roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* ─── WARDROBE (lower rod, reachable) */}
      <group position={[W / 2 - 0.75, 0, D * 0.2 * f]}>
        <mesh position={[0, 1.05, 0]} castShadow>
          <boxGeometry args={[1.2, 2.1, 0.60]} />
          <meshStandardMaterial color={0x22180e} roughness={0.65} metalness={0.1} />
        </mesh>
        {/* Lower hanging rod */}
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.1, 8]} />
          <meshStandardMaterial color={0xdddddd} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ─── MINIBAR (lower position) ──────── */}
      <mesh position={[-W / 2 + 0.35, 0.2, D / 4 * f]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.45]} />
        <meshStandardMaterial color={0x1a1a1a} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* ─── SAFE (lower position, easy reach) */}
      <group position={[-W / 2 + 0.35, 0, D / 4 * f - 0.5 * f]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.42, 0.30, 0.35]} />
          <meshStandardMaterial color={0x2a2a2a} roughness={0.2} metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.22, 0.18]}>
          <boxGeometry args={[0.1, 0.08, 0.01]} />
          <meshStandardMaterial color={0x003322} emissive={0x003322} emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ─── LUGGAGE RACK ──────────────────── */}
      <group position={[W / 4, 0, D / 3 * f]}>
        {[-0.23, 0, 0.23].map((bx, i) => (
          <mesh key={`lr-bar-${i}`} position={[bx, 0.5, 0]}>
            <boxGeometry args={[0.03, 0.03, 0.5]} />
            <meshStandardMaterial color={0x1a1a1a} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {[[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]].map(([lx, lz], i) => (
          <mesh key={`lr-leg-${i}`} position={[lx, 0.25, lz]}>
            <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
            <meshStandardMaterial color={0x1a1a1a} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ─── ACCESSIBLE BATHROOM ───────────── */}
      {(() => {
        const bathW = BATHROOM.width + 0.4; // Wider for accessibility
        const bathD = BATHROOM.depth + 0.3;
        const bathX = W / 2 - bathW / 2;
        const bathZ = (-D / 2 + bathD / 2) * f;

        return (
          <>
            {/* Wider bathroom partition */}
            <mesh position={[bathX - bathW / 2, H / 2, bathZ]} material={M.wallInterior}>
              <boxGeometry args={[0.15, H, bathD]} />
            </mesh>
            <mesh position={[bathX, H / 2, bathZ + bathD / 2 * f]} material={M.wallInterior}>
              <boxGeometry args={[bathW, H, 0.15]} />
            </mesh>
            {/* Wider bathroom door (0.92m) */}
            <mesh position={[bathX - bathW / 2 - 0.03, DOOR.accessible.height / 2, bathZ]} material={M.doorFace}>
              <boxGeometry args={[0.04, DOOR.accessible.height, DOOR.accessible.width]} />
            </mesh>
            <AccessibleBathroom
              width={bathW}
              depth={bathD}
              height={H}
              offsetX={bathX}
              offsetZ={bathZ}
            />
          </>
        );
      })()}

      {/* ─── SWITCHES AT WHEELCHAIR HEIGHT ─── */}
      {/* Light switches at 0.90m */}
      <mesh position={[-W / 2 + 0.03, 0.90, D / 3 * f]}>
        <boxGeometry args={[0.01, 0.08, 0.05]} />
        <meshStandardMaterial color={0xf0f0f0} roughness={0.5} />
      </mesh>
      {/* Thermostat at 0.90m */}
      <mesh position={[-W / 2 + 0.03, 0.90, 0]}>
        <boxGeometry args={[0.01, 0.12, 0.08]} />
        <meshStandardMaterial color={0xf0f0f0} roughness={0.5} />
      </mesh>
      <mesh position={[-W / 2 + 0.04, 0.90, 0]}>
        <boxGeometry args={[0.005, 0.04, 0.04]} />
        <meshStandardMaterial color={0x112233} emissive={0x224466} emissiveIntensity={0.3} />
      </mesh>

      {/* ─── OUTLETS AT WHEELCHAIR HEIGHT ──── */}
      {[
        [-W / 4, 0.45, -D / 2 + 0.02],
        [W / 4, 0.45, -D / 2 + 0.02],
        [W / 2 - 0.02, 0.45, 0],
        [-W / 2 + 0.02, 0.45, D / 4 * f],
      ].map(([ox, oy, oz], i) => (
        <mesh key={`outlet-a-${i}`} position={[ox, oy, oz]}>
          <boxGeometry args={[0.04, 0.06, 0.015]} />
          <meshStandardMaterial color={0xf0f0f0} roughness={0.5} />
        </mesh>
      ))}

      {/* ─── SMOKE DETECTOR ────────────────── */}
      <mesh position={[0, H - 0.015, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
        <meshStandardMaterial color={0xf0f0f0} roughness={0.8} />
      </mesh>

      {/* ─── WINDOW OPEN DETECTOR ──────────── */}
      <mesh position={[WINDOW.width / 2 + 0.08, WINDOW.sillHeight + WINDOW.height - 0.05, wallZ]}>
        <boxGeometry args={[0.025, 0.04, 0.015]} />
        <meshStandardMaterial color={0xf0f0f0} roughness={0.5} />
      </mesh>

      {/* ─── LIGHTING ──────────────────────── */}
      <mesh position={[0, H - 0.02, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
        <meshStandardMaterial color={0xfff8e0} emissive={0xfff8e0} emissiveIntensity={lit ? 0.6 : 0} roughness={0.3} />
      </mesh>
      <pointLight position={[0, H - 0.1, 0]} color={LIGHT_ON} intensity={lit ? 0.9 : 0} distance={7} />

      {/* Reading lights */}
      {[-FURNITURE.bed.king.width / 2 - 0.5, FURNITURE.bed.king.width / 2 + 0.5].map((rx, i) => (
        <group key={`reader-a-${i}`}>
          <mesh position={[rx, H * 0.6, -D * 0.15 * f - FURNITURE.bed.king.depth / 2]}>
            <boxGeometry args={[0.08, 0.06, 0.12]} />
            <meshStandardMaterial color={0xc9a84c} metalness={0.85} roughness={0.15} />
          </mesh>
          <pointLight
            position={[rx, H * 0.55, -D * 0.15 * f - FURNITURE.bed.king.depth / 2 + 0.1]}
            color={0xfff0cc}
            intensity={lit ? 0.25 : 0}
            distance={2.5}
          />
        </group>
      ))}

      {/* Night light */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.3, 0.03, 0.02]} />
        <meshStandardMaterial color={0xff9944} emissive={0xff9944} emissiveIntensity={lit ? 0.15 : 0} />
      </mesh>

      {/* ─── ROOM LIGHT (exterior window glow) */}
      <pointLight
        position={[0, H / 2, wallZ - 1.5 * f]}
        color={LIGHT_ON}
        intensity={lit ? 0.8 : 0}
        distance={6}
      />
    </group>
  );
});

RoomAccessible.displayName = 'RoomAccessible';