// src/hotel3d/modules/Floor.tsx

import React, { useMemo } from 'react';
import { HOTEL, ROOM, CORRIDOR, BUILDING, SERVICE } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';
import { makeRoomId, type RoomId } from '../constants/ids';
import { Room } from './Room';
import { Corridor } from './Corridor';

export interface FloorProps {
  floor: number;
  litStates: boolean[];
  onWindowClick?: (roomId: RoomId) => void;
  accessibleRooms?: number[];
}

export const Floor: React.FC<FloorProps> = React.memo(({
  floor, litStates, onWindowClick, accessibleRooms = [],
}) => {
  const M = useMemo(() => getMaterialSet(), []);
  const baseY = floor * HOTEL.levelHeight;
  const corridorLength = HOTEL.roomsPerSide * ROOM.width;

  const rooms = useMemo(() => {
    const result: Array<{
      roomId: RoomId;
      x: number; y: number; z: number;
      facing: 1 | -1;
      litIdx: number;
      accessible: boolean;
    }> = [];

    for (let side = 0; side < 2; side++) {
      const sideKey = side === 0 ? 'left' as const : 'right' as const;
      const facing = side === 0 ? 1 as const : -1 as const;

      for (let pos = 0; pos < HOTEL.roomsPerSide; pos++) {
        const litIdx = side * HOTEL.roomsPerSide + pos;
        result.push({
          roomId: makeRoomId('hotel', floor, sideKey, pos),
          x: (CORRIDOR.width / 2 + ROOM.depth / 2) * facing,
          y: baseY,
          z: -corridorLength / 2 + ROOM.width / 2 + pos * ROOM.width,
          facing,
          litIdx,
          accessible: accessibleRooms.includes(litIdx),
        });
      }
    }
    return result;
  }, [floor, baseY, accessibleRooms]);

  return (
    <group>
      {/* STRUCTURAL SLAB */}
      <mesh position={[0, baseY, 0]} material={M.slab} receiveShadow>
        <boxGeometry args={[BUILDING.width, HOTEL.slabThickness, corridorLength + ROOM.extWallThickness * 2]} />
      </mesh>

      {/* CORRIDOR */}
      <Corridor positionY={baseY + HOTEL.slabThickness / 2} floor={floor} />

      {/* ROOMS */}
      {rooms.map((r) => (
        <Room
          key={r.roomId.key}
          positionX={r.x}
          positionY={r.y + HOTEL.slabThickness / 2}
          positionZ={r.z}
          facingDirection={r.facing}
          roomId={r.roomId}
          lit={litStates[r.litIdx] ?? false}
          onWindowClick={onWindowClick}
          accessible={r.accessible}
        />
      ))}

      {/* SERVICE: Linen room */}
      <mesh position={[0, baseY + HOTEL.slabThickness / 2 + ROOM.wallHeight / 2,
        corridorLength / 2 + SERVICE.linenRoom.depth / 2 + 0.3]}
        material={M.concretePanel} castShadow
      >
        <boxGeometry args={[SERVICE.linenRoom.width, ROOM.wallHeight, SERVICE.linenRoom.depth]} />
      </mesh>

      {/* SERVICE: Janitor closet */}
      <mesh position={[0, baseY + HOTEL.slabThickness / 2 + ROOM.wallHeight / 2,
        -corridorLength / 2 - SERVICE.janitorCloset.depth / 2 - 0.3]}
        material={M.concretePanel} castShadow
      >
        <boxGeometry args={[SERVICE.janitorCloset.width, ROOM.wallHeight, SERVICE.janitorCloset.depth]} />
      </mesh>

      {/* FIRE DOORS at corridor ends */}
      {[-1, 1].map((s) => (
        <mesh key={`fire-${floor}-${s}`}
          position={[0, baseY + HOTEL.slabThickness / 2 + 1.05, s * (corridorLength / 2 + 0.15)]}
          material={M.doorMetal} castShadow
        >
          <boxGeometry args={[CORRIDOR.width, 2.1, 0.06]} />
        </mesh>
      ))}
    </group>
  );
});

Floor.displayName = 'Floor';