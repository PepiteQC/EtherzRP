// src/components/hotel/hooks/useRoomAccess.ts

import { useState, useCallback, useEffect } from 'react';
import type { RoomId } from '../constants/ids';

/**
 * Hook de gestion des accès chambre.
 * Carte d'accès, clavier numérique, serrure connectée.
 * Anti-casse #17: simulateur avant connexion réelle.
 * Anti-casse #18: ne jamais commander une serrure depuis le navigateur.
 */

export interface AccessState {
  hasAccess: boolean;
  accessType: 'owner' | 'tenant' | 'guest' | 'staff' | 'maintenance' | null;
  doorLocked: boolean;
  deadboltEngaged: boolean;
  batteryLevel: number;
}

export interface UseRoomAccessReturn {
  state: AccessState;
  /** Tente un déverrouillage via carte */
  tryKeycard: (roomId: string) => Promise<boolean>;
  /** Tente un déverrouillage via PIN */
  tryPin: (roomId: string, pin: string) => Promise<boolean>;
  /** Verrouille la porte */
  lockDoor: (roomId: string) => Promise<void>;
  /** Engage le verrou de sécurité (intérieur seulement) */
  engageDeadbolt: (roomId: string) => Promise<void>;
  /** Désactive le verrou de sécurité */
  disengageDeadbolt: (roomId: string) => Promise<void>;
  /** Erreur courante */
  error: string | null;
}

export function useRoomAccess(uid: string | null): UseRoomAccessReturn {
  const [state, setState] = useState<AccessState>({
    hasAccess: false,
    accessType: null,
    doorLocked: true,
    deadboltEngaged: false,
    batteryLevel: 100,
  });
  const [error, setError] = useState<string | null>(null);

  const tryKeycard = useCallback(async (roomId: string): Promise<boolean> => {
    if (!uid) {
      setError('Non authentifié');
      return false;
    }

    try {
      const response = await fetch('/api/hotel/lock/keycard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });

      const result = await response.json();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          hasAccess: true,
          accessType: result.accessType,
          doorLocked: false,
        }));
        setError(null);
        return true;
      } else {
        setError(result.error || 'Accès refusé');
        return false;
      }
    } catch (err) {
      setError('Erreur de communication avec la serrure');
      return false;
    }
  }, [uid]);

  const tryPin = useCallback(async (roomId: string, pin: string): Promise<boolean> => {
    if (!uid) {
      setError('Non authentifié');
      return false;
    }

    try {
      const response = await fetch('/api/hotel/lock/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, pin }),
      });

      const result = await response.json();

      if (result.success) {
        setState((prev) => ({
          ...prev,
          hasAccess: true,
          accessType: result.accessType,
          doorLocked: false,
        }));
        setError(null);
        return true;
      } else {
        setError(result.error || 'Code incorrect');
        return false;
      }
    } catch (err) {
      setError('Erreur de communication');
      return false;
    }
  }, [uid]);

  const lockDoor = useCallback(async (roomId: string) => {
    try {
      await fetch('/api/hotel/lock/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });

      setState((prev) => ({ ...prev, doorLocked: true }));
      setError(null);
    } catch (err) {
      setError('Erreur de verrouillage');
    }
  }, []);

  const engageDeadbolt = useCallback(async (roomId: string) => {
    try {
      await fetch('/api/hotel/lock/deadbolt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, engaged: true }),
      });

      setState((prev) => ({ ...prev, deadboltEngaged: true }));
    } catch (err) {
      setError('Erreur du verrou de sécurité');
    }
  }, []);

  const disengageDeadbolt = useCallback(async (roomId: string) => {
    try {
      await fetch('/api/hotel/lock/deadbolt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, engaged: false }),
      });

      setState((prev) => ({ ...prev, deadboltEngaged: false }));
    } catch (err) {
      setError('Erreur du verrou de sécurité');
    }
  }, []);

  return {
    state,
    tryKeycard,
    tryPin,
    lockDoor,
    engageDeadbolt,
    disengageDeadbolt,
    error,
  };
}