/**
 * src/buildings/hotel/scenes/HotelScene.tsx
 * 
 * Full 3-floor Hôtel scene assembled from reusable modules + registry.
 * 
 * - Exactly 3 floors, 10 rooms each (5 left/5 right)
 * - Reception volume in entry
 * - Protected stairwells at ends
 * - Aligned elevator shaft
 * - Roof + ground
 * - All data from HotelRegistry (stable IDs)
 * 
 * Anti-casse:
 * - Generated from modules
 * - No giant component coding rooms directly
 * - Separate from old hotel-ultra
 * - Feature flag gated at higher level
 */

import { memo } from 'react';
import { HOTEL_BUILDING, HOTEL_FLOORS, HOTEL_ROOMS, HOTEL_DOORS, HOTEL_RECEPTION, HOTEL_ELEVATOR_SHAFT } from '../core/HotelRegistry';
import { HotelFloorModule } from '../modules/floor/HotelFloorModule';
import type { RoomBase, DoorBase } from '../../shared/types';

interface HotelSceneProps {
  onRoomDoorClick?: (roomId: string) => void;
  showRoof?: boolean;
}

export const HotelScene = memo(function HotelScene({
  onRoomDoorClick,
  showRoof = true,
}: HotelSceneProps) {
  const { origin, architectural } = HOTEL_BUILDING;
  const floorHeight = architectural.height;

  // Group rooms + doors by floor for modules
  const roomsByFloor: Record<string, RoomBase[]> = {};
  const doorsByFloor: Record<string, DoorBase[]> = {};

  for (const floor of HOTEL_FLOORS) {
    roomsByFloor[floor.id] = HOTEL_ROOMS.filter((r) => r.floorId === floor.id);
    doorsByFloor[floor.id] = HOTEL_DOORS.filter((d) => 
      roomsByFloor[floor.id].some((r) => r.id === d.roomId)
    );
  }

  return (
    <group position={origin} userData={{ buildingId: 'hotel_main', type: 'hotel_building' }}>
      {/* Ground / foundation */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[architectural.width + 2, 0.2, architectural.depth + 2]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.85} />
      </mesh>

      {/* 3 Floors (stacked with same structural axes) */}
      {HOTEL_FLOORS.map((floor, idx) => (
        <HotelFloorModule
          key={floor.id}
          floor={floor}
          rooms={roomsByFloor[floor.id]}
          doors={doorsByFloor[floor.id]}
          position={[0, idx * floorHeight, 0]}
          onRoomDoorClick={onRoomDoorClick}
        />
      ))}

      {/* Reception volume (entry, not part of 30 rooms) */}
      <group position={HOTEL_RECEPTION.position}>
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 4.4, 6]} />
          <meshStandardMaterial color="#2a2a3e" roughness={0.75} />
        </mesh>
        {/* Reception desk (simple) */}
        <mesh position={[0, 1.1, 1.5]} castShadow>
          <boxGeometry args={[5, 1.1, 1.8]} />
          <meshStandardMaterial color="#3a2a22" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.7, 1.5]}>
          <boxGeometry args={[4.8, 0.08, 1.6]} />
          <meshStandardMaterial color="#c8c0b4" roughness={0.4} />
        </mesh>
      </group>

      {/* Roof */}
      {showRoof && (
        <group position={[0, 3 * floorHeight, 0]}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[architectural.width + 1.5, 0.3, architectural.depth + 1.5]} />
            <meshStandardMaterial color="#0f1419" roughness={0.7} />
          </mesh>
          {/* Cornice / mechanical units */}
          {[-6, 0, 6].map((x, i) => (
            <mesh key={i} position={[x, 0.7, -4]} castShadow>
              <boxGeometry args={[3.2, 1.2, 2.2]} />
              <meshStandardMaterial color="#4a4a55" roughness={0.6} />
            </mesh>
          ))}
        </group>
      )}

      {/* Aligned elevator/technical shaft (visible on all floors via module, plus roof cap) */}
      <group position={HOTEL_ELEVATOR_SHAFT.position}>
        <mesh position={[0, 3 * floorHeight + 0.8, 0]} castShadow>
          <boxGeometry args={[2.8, 1.5, 2.8]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.6} metalness={0.3} />
        </mesh>
      </group>

      {/* Basic exterior lighting for hotel (non-intrusive) */}
      <pointLight position={[0, 12, 12]} intensity={0.4} color="#fef3c7" distance={25} decay={2} />
    </group>
  );
});
