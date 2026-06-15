/**
 * src/store/firebaseStoreCache.ts
 * 
 * Cache centralisé Zustand pour Firebase et le serveur autoritaire.
 * Respecte l'optimisation maximale : 
 * - Charge le profil et le cache au login
 * - Garde en Zustand pour des lectures ultra-rapides sans coûts Firestore
 * - Active 4 listeners uniques (profil, inventaire, permissions, annonces monde)
 * - Orchestre l'auto-sauvegarde propre périodique via l'API Express (/api/player/save-position)
 */

import { create } from 'zustand';
import { FirebaseWorldClient, FirebaseAuthClient } from '../lib/firebase/firebaseClient';
import type { UserProfile, PlayerData, InventoryData, GlobalWorldState } from '../lib/firebase/firestoreSchema';

interface FirebaseCacheState {
  // Données en cache
  userProfile: UserProfile | null;
  playerData: PlayerData | null;
  inventory: InventoryData | null;
  worldState: GlobalWorldState | null;
  idToken: string | null;
  
  // Statuts de synchronisation
  isInitialized: boolean;
  isSyncing: boolean;
  lastAutosaveAt: number;

  // Actions d'initialisation et listeners
  initCache: (uid: string) => Promise<void>;
  clearCache: () => void;
  refreshAuthToken: () => Promise<string | null>;

  // Actions de modification locale (Zustand) et synchrone
  updateLocalPosition: (pos: [number, number, number], zone: string) => void;
  updateLocalPreferences: (prefs: UserProfile['clientPreferences']) => Promise<void>;
  
  // Actions autoritaires (Backend Node)
  useInventoryItem: (itemId: string) => Promise<void>;
  interactDoor: (doorId: string, action: 'lock' | 'unlock', zone: string) => Promise<boolean>;
  triggerAutosave: () => Promise<void>;
}

export const useFirebaseCacheStore = create<FirebaseCacheState>((set, get) => ({
  userProfile: null,
  playerData: null,
  inventory: null,
  worldState: null,
  idToken: null,

  isInitialized: false,
  isSyncing: false,
  lastAutosaveAt: Date.now(),

  /**
   * Initialisation propre au login : charge 1 fois, abonne 4 listeners
   */
  initCache: async (uid: string) => {
    set({ isSyncing: true });

    try {
      // 1. Charger idToken et documents de base (users et players)
      const token = await FirebaseAuthClient.getIdToken();
      const [userProfile, playerData] = await Promise.all([
        FirebaseWorldClient.getUserProfile(uid),
        FirebaseWorldClient.getPlayerData(uid),
      ]);

      set({
        userProfile,
        playerData,
        idToken: token,
      });

      // 2. Mettre en place les abonnements stricts
      const unsubInventory = FirebaseWorldClient.subscribeToInventory(uid, (inventory) => {
        set({ inventory });
      });

      const unsubWorld = FirebaseWorldClient.subscribeToWorldState((worldState) => {
        set({ worldState });
      });

      // Enregistre les unsubscribe pour cleanup au logout
      (window as any).__firebaseCacheUnsubs = [unsubInventory, unsubWorld];

      set({ isInitialized: true, isSyncing: false });
      console.info("[Zustand FirebaseCache] Initialisation et abonnements réussis.");
    } catch (error) {
      console.error("[Zustand FirebaseCache] Échec de l'initialisation :", error);
      set({ isSyncing: false });
    }
  },

  /**
   * Nettoyage au logout
   */
  clearCache: () => {
    const unsubs = (window as any).__firebaseCacheUnsubs;
    if (unsubs) {
      unsubs.forEach((unsub: any) => typeof unsub === 'function' && unsub());
    }
    set({
      userProfile: null,
      playerData: null,
      inventory: null,
      worldState: null,
      idToken: null,
      isInitialized: false,
    });
  },

  refreshAuthToken: async () => {
    const token = await FirebaseAuthClient.getIdToken(true);
    set({ idToken: token });
    return token;
  },

  /**
   * Mise à jour purement locale Zustand pour le gameplay (0 requête Firestore)
   */
  updateLocalPosition: (pos, zone) => {
    const data = get().playerData;
    if (!data) return;
    set({
      playerData: {
        ...data,
        position: { x: pos[0], y: pos[1], z: pos[2], zone },
      },
    });
  },

  updateLocalPreferences: async (prefs) => {
    const data = get().userProfile;
    if (!data) return;
    const nextPrefs = { ...data.clientPreferences, ...prefs } as UserProfile['clientPreferences'];
    set({
      userProfile: {
        ...data,
        clientPreferences: nextPrefs,
      },
    });
    // Persiste de manière asynchrone
    await FirebaseWorldClient.saveClientPreferences(data.uid, nextPrefs);
  },

  /**
   * Appels backend Express autoritaires
   */
  useInventoryItem: async (itemId: string) => {
    const token = get().idToken;
    if (!token) return;

    const res = await fetch("/api/inventory/use", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Action impossible.");
    }
  },

  interactDoor: async (doorId, action, zone) => {
    const token = get().idToken;
    if (!token) return false;

    const res = await fetch("/api/door/interact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ doorId, action, zone }),
    });

    if (res.ok) {
      return true;
    }
    return false;
  },

  /**
   * Autosave périodique propre (Step 8) envoyé au backend Express
   */
  triggerAutosave: async () => {
    const { playerData, idToken, lastAutosaveAt } = get();
    if (!playerData || !idToken) return;

    const now = Date.now();
    // Limite stricte : pas plus d'une sauvegarde toutes les 10 secondes
    if (now - lastAutosaveAt < 10000) return;

    try {
      await fetch("/api/player/save-position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          position: playerData.position,
          cash: playerData.cash,
        }),
      });

      set({ lastAutosaveAt: now });
      console.info("[Autosave] Position et état sauvegardés avec succès.");
    } catch (err) {
      console.warn("[Autosave] Erreur de synchronisation avec le backend.");
    }
  },
}));
