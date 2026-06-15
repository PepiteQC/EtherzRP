// src/hotel3d/hooks/useRoomLights.ts

import { useState, useCallback, useMemo } from 'react';
import { HOTEL } from '../constants/dimensions';
import type { RoomId } from '../constants/ids';

export interface UseRoomLightsReturn {
  /** litStates[floorIndex][roomIndex] — floorIndex 0..2 maps to floor 1..3 */
  litStates: boolean[][];
  toggleLight: (roomId: RoomId) => void;
  setLight: (roomId: RoomId, on: boolean) => void;
  litCount: number;
  totalRooms: number;
}

function roomIdToIndex(roomId: RoomId): { floorIdx: number; roomIdx: number } {
  // floor 1 -> index 0, floor 2 -> index 1, floor 3 -> index 2
  const floorIdx = roomId.floor - 1;
  const sideOffset = roomId.side === 'left' ? 0 : HOTEL.roomsPerSide;
  return {
    floorIdx,
    roomIdx: sideOffset + roomId.position,
  };
}

export function useRoomLights(): UseRoomLightsReturn {
  const [litStates, setLitStates] = useState<boolean[][]>(() =>
    Array.from({ length: HOTEL.chamberFloors }, () =>
      Array.from({ length: HOTEL.roomsPerFloor }, () => Math.random() > 0.35)
    )
  );

  const toggleLight = useCallback((roomId: RoomId) => {
    const { floorIdx, roomIdx } = roomIdToIndex(roomId);
    if (floorIdx < 0 || floorIdx >= HOTEL.chamberFloors) return;
    setLitStates((prev) => {
      const next = prev.map((row) => [...row]);
      next[floorIdx][roomIdx] = !next[floorIdx][roomIdx];
      return next;
    });
  }, []);

  const setLight = useCallback((roomId: RoomId, on: boolean) => {
    const { floorIdx, roomIdx } = roomIdToIndex(roomId);
    if (floorIdx < 0 || floorIdx >= HOTEL.chamberFloors) return;
    setLitStates((prev) => {
      const next = prev.map((row) => [...row]);
      next[floorIdx][roomIdx] = on;
      return next;
    });
  }, []);

  const litCount = useMemo(
    () => litStates.flat().filter(Boolean).length,
    [litStates]
  );

  return {
    litStates,
    toggleLight,
    setLight,
    litCount,
    totalRooms: HOTEL.chamberFloors * HOTEL.roomsPerFloor,
  };
}