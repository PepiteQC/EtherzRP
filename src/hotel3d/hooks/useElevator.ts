// src/hotel3d/hooks/useElevator.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { HOTEL } from '../constants/dimensions';

export interface UseElevatorReturn {
  currentFloor: number;
  targetFloor: number;
  isMoving: boolean;
  goToFloor: (floor: number) => void;
  /** Floor display name */
  floorName: (floor: number) => string;
}

export function useElevator(): UseElevatorReturn {
  const [currentFloor, setCurrentFloor] = useState(0);
  const [targetFloor, setTargetFloor] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToFloor = useCallback((floor: number) => {
    // 0 = RDC, 1-3 = étages de chambres
    if (floor < 0 || floor >= HOTEL.totalLevels) return;
    setTargetFloor(floor);
  }, []);

  const floorName = useCallback((floor: number): string => {
    if (floor === 0) return 'RDC';
    return `É${floor}`;
  }, []);

  useEffect(() => {
    if (targetFloor === currentFloor) return;

    setIsMoving(true);

    if (animRef.current) clearInterval(animRef.current);

    animRef.current = setInterval(() => {
      setCurrentFloor((prev) => {
        const diff = targetFloor - prev;
        if (Math.abs(diff) < 0.02) {
          if (animRef.current) clearInterval(animRef.current);
          animRef.current = null;
          setIsMoving(false);
          return targetFloor;
        }
        return prev + diff * 0.055;
      });
    }, 16);

    return () => {
      if (animRef.current) {
        clearInterval(animRef.current);
        animRef.current = null;
      }
    };
  }, [targetFloor]);

  return { currentFloor, targetFloor, isMoving, goToFloor, floorName };
}