/**
 * src/buildings/hotel/modules/floor/HotelFloorModule.tsx
 * 
 * Reusable floor module for Hôtel.
 * 
 * - Central corridor
 * - 5 rooms left + 5 rooms right (from registry)
 * - Protected stairwells at both ends (visual + structural)
 * - Elevator/technical shaft aligned (placeholder position)
 * - Uses HotelRoomModule for each room
 * - All rooms generated from stable registry data
 * 
 * Anti-casse:
 * - Reusable module, not giant component
 * - No direct room coding
 * - Architectural only for structure
 * - Decorative separate
 */

import { memo } from 'react';
import type { FloorBase, RoomBase, DoorBase } from '../../../shared/types';
import { HotelRoomModule } from '../room/HotelRoomModule';
import { HOTEL_ARCH } from '../../core/HotelRegistry';

interface HotelFloorModuleProps {
  floor: FloorBase;
  rooms: RoomBase[];
  doors: DoorBase[];
  position?: [number, number, number];
  onRoomDoorClick?: (roomId: string) => void;
}

export const HotelFloorModule = memo(function HotelFloorModule({
  floor,
  rooms,
  doors,
  position = [0, 0, 0],
  onRoomDoorClick,
}: HotelFloorModuleProps) {
  const { level, id: floorId } = floor;

  const corridorW = HOTEL_ARCH.corridorWidth;
  const roomW = HOTEL_ARCH.roomWidth;
  const totalW = HOTEL_ARCH.totalWidth;
  const totalD = HOTEL_ARCH.totalDepth;
  const floorH = HOTEL_ARCH.floorHeight;

  // Split rooms by side
  const leftRooms = rooms.filter((r) => r.side === 'left').sort((a, b) => a.number - b.number);
  const rightRooms = rooms.filter((r) => r.side === 'right').sort((a, b) => a.number - b.number);

  // Stairwell positions (protected at ends)
  const stairX = totalW / 2 - 2.2;

  return (
    <group position={position} userData={{ floorId, level, buildingId: 'hotel_main', type: 'hotel_floor' }}>
      {/* Central corridor floor */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[corridorW, totalD - 1.2]} />
        <meshStandardMaterial color="#8a8078" roughness={0.75} />
      </mesh>

      {/* Corridor walls (simple) */}
      <mesh position={[-corridorW / 2 - 0.01, floorH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, floorH, totalD - 1.2]} />
        <meshStandardMaterial color="#2a2520" roughness={0.82} />
      </mesh>
      <mesh position={[corridorW / 2 + 0.01, floorH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, floorH, totalD - 1.2]} />
        <meshStandardMaterial color="#2a2520" roughness={0.82} />
      </mesh>

      {/* Left rooms (5) */}
      {leftRooms.map((room, i) => {
        const door = doors.find((d) => d.roomId === room.id);
        const roomX = -corridorW / 2 - roomW / 2;
        const roomZ = -totalD / 2 + 2.5 + i * (room.architectural.roomDepth + 0.6);
        return (
          <HotelRoomModule
            key={room.id}
            room={room}
            door={door}
            position={[roomX, 0, roomZ]}
            onDoorClick={onRoomDoorClick}
          />
        );
      })}

      {/* Right rooms (5) */}
      {rightRooms.map((room, i) => {
        const door = doors.find((d) => d.roomId === room.id);
        const roomX = corridorW / 2 + roomW / 2;
        const roomZ = -totalD / 2 + 2.5 + i * (room.architectural.roomDepth + 0.6);
        return (
          <HotelRoomModule
            key={room.id}
            room={room}
            door={door}
            position={[roomX, 0, roomZ]}
            onDoorClick={onRoomDoorClick}
          />
        );
      })}

      {/* Protected stairwells (visual structure at ends) */}
      {[-1, 1].map((side, si) => (
        <group key={`stair-${si}`} position={[side * stairX, 0, 0]}>
          {/* Stair shaft walls */}
          <mesh position={[0, floorH / 2, -totalD / 2 + 1.8]} castShadow>
            <boxGeometry args={[3.2, floorH, 0.3]} />
            <meshStandardMaterial color="#2a2520" roughness={0.8} />
          </mesh>
          <mesh position={[0, floorH / 2, totalD / 2 - 1.8]} castShadow>
            <boxGeometry args={[3.2, floorH, 0.3]} />
            <meshStandardMaterial color="#2a2520" roughness={0.8} />
          </mesh>
          {/* Simple stair steps (decorative) */}
          {Array.from({ length: 6 }).map((_, step) => (
            <mesh
              key={step}
              position={[side * 0.4, 0.3 + step * 0.55, -totalD / 2 + 2.5 + step * 0.35]}
              castShadow
            >
              <boxGeometry args={[2.8, 0.12, 0.9]} />
              <meshStandardMaterial color="#555" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Elevator / technical shaft (aligned vertically, placeholder) */}
      <group position={[totalW / 2 - 4, 0, 0]} userData={{ type: 'hotel_elevator_shaft', floor: level }}>
        <mesh position={[0, floorH / 2, 0]} castShadow>
          <boxGeometry args={[2.6, floorH, 2.6]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Door visual */}
        <mesh position={[-1.35, floorH / 2, 0]} castShadow>
          <boxGeometry args={[0.1, 2.2, 1.8]} />
          <meshStandardMaterial color="#333" roughness={0.5} />
        </mesh>
      </group>

      {/* Floor label (for debug / future UI) */}
      <mesh position={[0, floorH + 0.1, totalD / 2 - 1]}>
        <planeGeometry args={[4, 0.6]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.15} />
      </mesh>
    </group>
  );
});
