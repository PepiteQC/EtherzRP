// src/components/hotel/hooks/useHotelSync.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { getFirestore } from 'firebase/firestore';
import { RoomService } from '../firebase/roomService';
import { HOTEL } from '../constants/dimensions';
import type { RoomId } from '../constants/ids';
import { makeRoomId } from '../constants/ids';

/**
 * Hook de synchronisation entre Firebase et la scène 3D.
 * Anti-casse: startFirebaseSync idempotent avec cleanup.
 */

interface HotelSyncState {
  litStates: boolean[][];
  roomStatuses: Map<string, string>;
  connected: boolean;
  error: string | null;
}

export function useHotelSync() {
  const [state, setState] = useState<HotelSyncState>({
    litStates: Array.from({ length: HOTEL.chamberFloors }, () =>
      Array.from({ length: HOTEL.roomsPerFloor }, () => false)
    ),
    roomStatuses: new Map(),
    connected: false,
    error: null,
  });

  const serviceRef = useRef<RoomService | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const startedRef = useRef(false);

  const start = useCallback(() => {
    // Idempotence (anti-casse)
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      const db = getFirestore();
      const service = new RoomService(db);
      serviceRef.current = service;

      const unsub = service.subscribeToAllLights((lightsMap) => {
        const newLitStates = Array.from({ length: HOTEL.chamberFloors }, (_, fi) => {
          const floor = fi + 1;
          return Array.from({ length: HOTEL.roomsPerFloor }, (_, roomIdx) => {
            const side = roomIdx < 5 ? 'left' : 'right' as const;
            const pos = roomIdx < 5 ? roomIdx : roomIdx - 5;
            const roomId = makeRoomId('hotel', floor, side, pos);
            return lightsMap.get(roomId.key) ?? false;
          });
        });

        setState((prev) => ({
          ...prev,
          litStates: newLitStates,
          connected: true,
          error: null,
        }));
      });

      unsubRef.current = unsub;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        connected: false,
        error: err instanceof Error ? err.message : 'Erreur de connexion',
      }));
    }
  }, []);

  const stop = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    startedRef.current = false;
    serviceRef.current = null;
    setState((prev) => ({ ...prev, connected: false }));
  }, []);

  const toggleLight = useCallback(async (roomId: RoomId, uid: string) => {
    if (!serviceRef.current) return;
    try {
      await serviceRef.current.toggleLight(roomId.key, uid);
    } catch (err) {
      console.error('Failed to toggle light:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ...state,
    start,
    stop,
    toggleLight,
    service: serviceRef.current,
  };
}