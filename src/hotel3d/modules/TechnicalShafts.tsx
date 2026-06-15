// src/hotel3d/modules/TechnicalShafts.tsx

import React, { useMemo } from 'react';
import { HOTEL, BUILDING, ROOM, CORRIDOR, BATHROOM } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

/**
 * Gaines techniques alignées verticalement entre les étages.
 * - Plomberie (alignée avec les salles de bain)
 * - Électricité
 * - Ventilation / CVAC
 */
export const TechnicalShafts: React.FC = React.memo(() => {
  const M = useMemo(() => getMaterialSet(), []);

  const totalH = HOTEL.totalHeight + 1;
  const wingLength = BUILDING.chamberWingLength;

  // Plumbing risers: one per pair of back-to-back bathrooms
  // Bathrooms are at the corridor-side back corner of each room
  // 5 vertical stacks per side
  const plumbingPositions = useMemo(() => {
    const positions: Array<[number, number]> = [];
    for (let pos = 0; pos < HOTEL.roomsPerSide; pos++) {
      const x = -wingLength / 2 + ROOM.width / 2 + pos * ROOM.width;
      // Left side bathroom backs onto corridor
      const zLeft = CORRIDOR.width / 2 + ROOM.depth - BATHROOM.width / 2;
      // Right side same
      const zRight = -(CORRIDOR.width / 2 + ROOM.depth - BATHROOM.width / 2);
      positions.push([x, zLeft]);
      positions.push([x, zRight]);
    }
    return positions;
  }, [wingLength]);

  // Electrical risers: 2 per side of corridor
  const electricalPositions: Array<[number, number]> = [
    [-wingLength / 4, CORRIDOR.width / 2 + 0.3],
    [wingLength / 4, CORRIDOR.width / 2 + 0.3],
    [-wingLength / 4, -(CORRIDOR.width / 2 + 0.3)],
    [wingLength / 4, -(CORRIDOR.width / 2 + 0.3)],
  ];

  // Ventilation ducts: main trunk along corridor ceiling
  const ventTrunkLength = wingLength + 2;

  return (
    <group>
      {/* ─── PLUMBING RISERS ───────────────── */}
      {plumbingPositions.map(([x, z], i) => (
        <group key={`plumb-${i}`}>
          {/* Main riser pipe */}
          <mesh position={[x + ROOM.width / 2 - 0.15, totalH / 2, z]}>
            <cylinderGeometry args={[0.06, 0.06, totalH, 10]} />
            <meshStandardMaterial color={0x4a6070} roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Hot water pipe */}
          <mesh position={[x + ROOM.width / 2 - 0.25, totalH / 2, z + 0.08]}>
            <cylinderGeometry args={[0.03, 0.03, totalH, 8]} />
            <meshStandardMaterial color={0xcc4444} roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Waste pipe */}
          <mesh position={[x + ROOM.width / 2 - 0.15, totalH / 2, z - 0.1]}>
            <cylinderGeometry args={[0.05, 0.05, totalH, 10]} />
            <meshStandardMaterial color={0x333333} roughness={0.7} metalness={0.3} />
          </mesh>
          {/* Chase enclosure */}
          <mesh position={[x + ROOM.width / 2 - 0.18, totalH / 2, z]}>
            <boxGeometry args={[0.35, totalH, 0.35]} />
            <meshStandardMaterial
              color={0x888888}
              roughness={0.8}
              transparent
              opacity={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* ─── ELECTRICAL RISERS ─────────────── */}
      {electricalPositions.map(([x, z], i) => (
        <group key={`elec-${i}`}>
          {/* Conduit */}
          <mesh position={[x, totalH / 2, z]}>
            <cylinderGeometry args={[0.04, 0.04, totalH, 8]} />
            <meshStandardMaterial color={0x666666} roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Junction box at each floor */}
          {Array.from({ length: HOTEL.totalLevels }, (_, level) => (
            <mesh
              key={`jbox-${i}-${level}`}
              position={[x, level * HOTEL.levelHeight + 1.5, z]}
            >
              <boxGeometry args={[0.12, 0.12, 0.08]} />
              <meshStandardMaterial color={0x555555} roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ─── VENTILATION TRUNK ─────────────── */}
      {/* Main horizontal duct along corridor ceiling */}
      {Array.from({ length: HOTEL.chamberFloors }, (_, fi) => {
        const floor = fi + 1;
        const ductY = floor * HOTEL.levelHeight + HOTEL.slabThickness / 2 + CORRIDOR.height - 0.18;
        return (
          <group key={`vent-trunk-${floor}`}>
            {/* Main trunk */}
            <mesh position={[0, ductY, 0]}>
              <boxGeometry args={[ventTrunkLength, 0.3, 0.5]} />
              <meshStandardMaterial color={0x888888} roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Branch ducts to each room */}
            {Array.from({ length: HOTEL.roomsPerSide }, (_, pos) => {
              const x = -wingLength / 2 + ROOM.width / 2 + pos * ROOM.width;
              return (
                <React.Fragment key={`branch-${floor}-${pos}`}>
                  {/* Left side branch */}
                  <mesh position={[x, ductY, CORRIDOR.width / 2 + 1]}>
                    <boxGeometry args={[0.2, 0.15, 2]} />
                    <meshStandardMaterial color={0x888888} roughness={0.4} metalness={0.5} />
                  </mesh>
                  {/* Right side branch */}
                  <mesh position={[x, ductY, -(CORRIDOR.width / 2 + 1)]}>
                    <boxGeometry args={[0.2, 0.15, 2]} />
                    <meshStandardMaterial color={0x888888} roughness={0.4} metalness={0.5} />
                  </mesh>
                  {/* Diffuser grilles */}
                  {[CORRIDOR.width / 2 + 2.5, -(CORRIDOR.width / 2 + 2.5)].map((gz, gi) => (
                    <mesh key={`diffuser-${floor}-${pos}-${gi}`} position={[x, ductY - 0.16, gz]}>
                      <boxGeometry args={[0.25, 0.02, 0.25]} />
                      <meshStandardMaterial color={0xdddddd} roughness={0.3} metalness={0.4} />
                    </mesh>
                  ))}
                </React.Fragment>
              );
            })}
          </group>
        );
      })}

      {/* ─── MAIN VERTICAL SHAFT ───────────── */}
      {/* Central mechanical shaft for main HVAC riser */}
      <mesh position={[-wingLength / 2 - 1, totalH / 2, 0]}>
        <boxGeometry args={[0.8, totalH, 1.2]} />
        <meshStandardMaterial color={0x555555} roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
});

TechnicalShafts.displayName = 'TechnicalShafts';