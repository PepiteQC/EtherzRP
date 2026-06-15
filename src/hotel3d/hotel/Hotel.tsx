// src/hotel3d/hotel/Hotel.tsx

import React, { useMemo } from 'react';
import { HOTEL, BUILDING, ROOM, CORRIDOR, ELEVATOR, STAIRWELL } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';
import { Floor } from '../modules/Floor';
import { Stairwell } from '../modules/Stairwell';
import { ElevatorShaft } from '../modules/ElevatorShaft';
import { ElevatorCar } from '../modules/ElevatorCar';
import { GroundFloor } from './GroundFloor';
import { HotelLobby } from './HotelLobby';
import type { RoomId } from '../constants/ids';

export interface HotelProps {
  litStates: boolean[][];
  elevatorFloor: number;
  onWindowClick?: (roomId: RoomId) => void;
}

export const Hotel: React.FC<HotelProps> = React.memo(({
  litStates, elevatorFloor, onWindowClick,
}) => {
  const M = useMemo(() => getMaterialSet(), []);

  const corridorLength = HOTEL.roomsPerSide * ROOM.width;
  const bW = BUILDING.width;
  const bD = BUILDING.depth;
  const bH = HOTEL.totalHeight;

  const stairOffset = corridorLength / 2 + STAIRWELL.width / 2 + 0.5;

  // Accessible rooms: room 0 (left side first) and room 5 (right side first)
  const accessibleRooms = [0, 5];

  return (
    <group>
      {/* ─── EXTERIOR SHELL ────────────────── */}
      <mesh position={[0, bH / 2, 0]} material={M.concreteMain} castShadow receiveShadow>
        <boxGeometry args={[bW + 0.5, bH, bD + STAIRWELL.width * 2 + 1.5, 6, 8, 4]} />
      </mesh>

      {/* ─── ROOF SLAB ────────────────────── */}
      <mesh position={[0, bH + 0.15, 0]} material={M.slab} receiveShadow>
        <boxGeometry args={[bW + 1.0, 0.30, bD + STAIRWELL.width * 2 + 2.0]} />
      </mesh>

      {/* ─── ROOF PARAPET ──────────────────── */}
      {[
        [bW + 1.0, 0.8, 0.3, 0, bH + 0.7, bD / 2 + STAIRWELL.width + 1],
        [bW + 1.0, 0.8, 0.3, 0, bH + 0.7, -(bD / 2 + STAIRWELL.width + 1)],
        [0.3, 0.8, bD + STAIRWELL.width * 2 + 2, bW / 2 + 0.5, bH + 0.7, 0],
        [0.3, 0.8, bD + STAIRWELL.width * 2 + 2, -(bW / 2 + 0.5), bH + 0.7, 0],
      ].map(([w, h, d, x, y, z], i) => (
        <mesh key={`parapet-${i}`} position={[x, y, z]} material={M.concreteMain} castShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* ─── FACADE RIBS ───────────────────── */}
      {Array.from({ length: 6 }, (_, i) => {
        const z = -corridorLength / 2 + (i + 0.5) * (corridorLength / 6);
        return (
          <React.Fragment key={`rib-${i}`}>
            <mesh position={[bW / 2 + 0.2, bH / 2, z]} material={M.concreteLight} castShadow>
              <boxGeometry args={[0.4, bH, 0.4, 2, 8, 2]} />
            </mesh>
            <mesh position={[-(bW / 2 + 0.2), bH / 2, z]} material={M.concreteDark} castShadow>
              <boxGeometry args={[0.3, bH, 0.3, 2, 8, 2]} />
            </mesh>
          </React.Fragment>
        );
      })}

      {/* ─── SPANDREL PANELS ───────────────── */}
      {Array.from({ length: HOTEL.roomFloors }, (_, f) => {
        const fy = (f + 1) * HOTEL.levelHeight;
        return Array.from({ length: HOTEL.roomsPerSide }, (_, pos) => {
          const z = -corridorLength / 2 + ROOM.width / 2 + pos * ROOM.width;
          return (
            <React.Fragment key={`spandrel-${f}-${pos}`}>
              <mesh position={[bW / 2 + 0.08, fy + HOTEL.levelHeight * 0.15, z]} material={M.concretePanel}>
                <boxGeometry args={[0.18, HOTEL.levelHeight * 0.25, ROOM.width - 0.3]} />
              </mesh>
              <mesh position={[bW / 2 + 0.08, fy + HOTEL.levelHeight * 0.85, z]} material={M.concretePanel}>
                <boxGeometry args={[0.18, HOTEL.levelHeight * 0.18, ROOM.width - 0.3]} />
              </mesh>
            </React.Fragment>
          );
        });
      })}

      {/* ─── GROUND FLOOR (hall central, services) ── */}
      <GroundFloor />

      {/* ─── LOBBY / ACCUEIL ───────────────── */}
      <HotelLobby />

      {/* ─── ROOM FLOORS (étages 1, 2, 3) ── */}
      {Array.from({ length: HOTEL.roomFloors }, (_, f) => {
        const actualFloor = f + 1;
        return (
          <Floor
            key={`floor-${actualFloor}`}
            floor={actualFloor}
            litStates={litStates[f] ?? Array(HOTEL.roomsPerFloor).fill(false)}
            onWindowClick={onWindowClick}
            accessibleRooms={accessibleRooms}
          />
        );
      })}

      {/* ─── STAIRWELLS ────────────────────── */}
      <Stairwell positionX={0} positionZ={-stairOffset} side="north" />
      <Stairwell positionX={0} positionZ={stairOffset} side="south" />

      {/* ─── ELEVATOR ──────────────────────── */}
      <ElevatorShaft positionX={ELEVATOR.positionX} positionZ={ELEVATOR.positionZ} />
      <ElevatorCar
        currentFloor={elevatorFloor}
        positionX={ELEVATOR.positionX}
        positionZ={ELEVATOR.positionZ}
      />

      {/* ─── ROOFTOP MECHANICAL ────────────── */}
      <mesh position={[-3, bH + 1.5, 0]} material={M.concretePanel} castShadow>
        <boxGeometry args={[5, 2.5, 3.5]} />
      </mesh>
      <mesh position={[4, bH + 1.2, -2]} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 2.0, 16]} />
        <meshStandardMaterial color={0x3a4050} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[5, bH + 0.8, 2]} material={M.metal} castShadow>
        <boxGeometry args={[2.0, 1.5, 1.5]} />
      </mesh>
      <mesh position={[-5, bH + 1.0, 3]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 1.5, 12]} />
        <meshStandardMaterial color={0x2a3040} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
});

Hotel.displayName = 'Hotel';