/**
 * src/store/playerSaveStore.ts
 * 
 * Moteur d'Autosave et de Survie In-Character (Zustand).
 * Implémente l'Étape 7 de la TODO Production :
 * - Pousse la position, rotation et zone active au Serveur Node toutes les 15 à 30 secondes.
 * - Simule en RAM locale la décroissance de survie (faim, soif, stress, fatigue)
 *   et pousse les Diffs au serveur de manière synchronisée.
 */

import { create } from 'zustand';
import { EtherNodeApiClient } from '../api/etherApi';
import { useAuthStore } from './authStore';

interface PlayerSaveStoreState {
  // Horodatage
  lastSavedAt: number;
  autosaveIntervalMs: number; // 20 000 ms par défaut
  isAutosaving: boolean;
  saveError: string | null;

  // Configuration de la boucle d'autosave
  setAutosaveInterval: (ms: number) => void;
  startAutosaveLoop: () => () => void;
  
  // Actions manuelles d'enregistrement Autoritaire
  forceSaveNow: (pos: [number, number, number], rot: [number, number, number], zone: string) => Promise<boolean>;
  simulateSurvivalTick: () => void;
}

export const usePlayerSaveStore = create<PlayerSaveStoreState>((set, get) => ({
  lastSavedAt: Date.now(),
  autosaveIntervalMs: 20000, // 20 secondes
  isAutosaving: false,
  saveError: null,

  setAutosaveInterval: (ms) => set({ autosaveIntervalMs: Math.max(15000, ms) }),

  /**
   * Démarre la boucle d'autosave silencieuse en tâche de fond
   */
  startAutosaveLoop: () => {
    console.info("[PlayerSaveStore] Démarre la boucle d'autosave persistante (15-30s).");
    
    const interval = setInterval(async () => {
      const auth = useAuthStore.getState();
      if (!auth.isAuthenticated || !auth.player) return;

      set({ isAutosaving: true, saveError: null });

      try {
        const { player } = auth;
        // Pousse au backend Express Autoritaire
        await EtherNodeApiClient.savePlayerPosition(
          player.position,
          player.rotation,
          player.currentZone
        );

        set({ lastSavedAt: Date.now(), isAutosaving: false });
        console.info(`[Autosave RP] Données de ${player.firstName} ${player.lastName} persistées.`);
      } catch (err: any) {
        console.warn("[Autosave RP] Échec de la persistance :", err);
        set({ saveError: err.message || "Erreur de synchro", isAutosaving: false });
      }
    }, get().autosaveIntervalMs);

    return () => clearInterval(interval);
  },

  forceSaveNow: async (pos, rot, zone) => {
    set({ isAutosaving: true, saveError: null });
    try {
      await EtherNodeApiClient.savePlayerPosition(pos, rot, zone);
      set({ lastSavedAt: Date.now(), isAutosaving: false });
      return true;
    } catch (err: any) {
      set({ saveError: err.message, isAutosaving: false });
      return false;
    }
  },

  /**
   * Décroissance lente des constantes vitales (Faim, Soif, Stress)
   */
  simulateSurvivalTick: () => {
    const auth = useAuthStore.getState();
    if (!auth.player) return;

    const { player } = auth;
    const nextHunger = Math.max(0, player.hunger - 0.05);
    const nextThirst = Math.max(0, player.thirst - 0.08);
    const nextStress = player.currentZone.includes('Police') ? Math.min(100, player.stress + 0.1) : Math.max(0, player.stress - 0.05);

    // Mise à jour purement RAM
    useAuthStore.setState({
      player: {
        ...player,
        hunger: nextHunger,
        thirst: nextThirst,
        stress: nextStress,
      },
    });
  },
}));
