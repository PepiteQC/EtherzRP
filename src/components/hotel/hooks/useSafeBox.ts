// src/components/hotel/hooks/useSafeBox.ts

import { useState, useCallback } from 'react';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getFirestore,
} from 'firebase/firestore';
import { HOTEL_COLLECTIONS, type HotelSafe } from '../firebase/hotelCollections';

/**
 * Hook pour la gestion du coffre-fort.
 * Le code n'est JAMAIS stocké en clair (anti-casse #19).
 */

export interface UseSafeBoxReturn {
  isLocked: boolean;
  attemptsRemaining: number;
  isLockedOut: boolean;
  setCode: (roomId: string, uid: string, code: string) => Promise<void>;
  unlock: (roomId: string, uid: string, code: string) => Promise<boolean>;
  lock: (roomId: string, uid: string) => Promise<void>;
  /** Staff override — nécessite claims admin (anti-casse) */
  staffOverride: (roomId: string, staffUid: string) => Promise<void>;
}

// NE PAS utiliser côté client en production
// Cette logique doit être sur le serveur
// Ici c'est le hook qui APPELLE le serveur

export function useSafeBox(): UseSafeBoxReturn {
  const [isLocked, setIsLocked] = useState(true);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLockedOut, setIsLockedOut] = useState(false);

  const setCode = useCallback(async (roomId: string, uid: string, code: string) => {
    // Appel serveur — ne jamais hasher côté client
    const response = await fetch('/api/hotel/safe/set-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, code }),
    });

    if (!response.ok) {
      throw new Error('Échec de la définition du code');
    }

    setIsLocked(true);
    setAttemptsRemaining(5);
  }, []);

  const unlock = useCallback(async (roomId: string, uid: string, code: string): Promise<boolean> => {
    const response = await fetch('/api/hotel/safe/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, code }),
    });

    const result = await response.json();

    if (result.success) {
      setIsLocked(false);
      setAttemptsRemaining(5);
      return true;
    } else {
      setAttemptsRemaining(result.attemptsRemaining ?? 0);
      setIsLockedOut(result.lockedOut ?? false);
      return false;
    }
  }, []);

  const lock = useCallback(async (roomId: string, uid: string) => {
    await fetch('/api/hotel/safe/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
    });

    setIsLocked(true);
  }, []);

  const staffOverride = useCallback(async (roomId: string, staffUid: string) => {
    const response = await fetch('/api/hotel/safe/staff-override', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId }),
    });

    if (!response.ok) {
      throw new Error('Override refusé');
    }

    setIsLocked(false);
    setAttemptsRemaining(5);
    setIsLockedOut(false);
  }, []);

  return {
    isLocked,
    attemptsRemaining,
    isLockedOut,
    setCode,
    unlock,
    lock,
    staffOverride,
  };
}