/**
 * src/store/authStore.ts
 * 
 * Magasin d'Authentification et d'Identité Unifié pour React / Three.js (Zustand).
 * Orchestre l'Étape 6 de la TODO de Production :
 * - Maintient l'état utilisateur (userDoc), l'avatar IC (playerDoc), et le jeton JWT certifié.
 * - S'occupe d'hydrater la RAM Zustand au démarrage pour un rendu fluide.
 */

import { create } from 'zustand';
import { FirebaseAuthClient, FirebaseWorldClient } from '../lib/firebase/firebaseClient';
import { EtherNodeApiClient } from '../api/etherApi';
import type { UserDocument, PlayerDocument, InventoryDocument, VehicleDocument, Role } from '../lib/firebase/firestoreSchema';

interface AuthStoreState {
  // Contrat d'Identité
  user: UserDocument | null;
  player: PlayerDocument | null;
  inventory: InventoryDocument | null;
  activeVehicle: VehicleDocument | null;
  idToken: string | null;
  role: Role;
  
  // Connectivité
  isAuthenticated: boolean;
  isHydrating: boolean;
  authError: string | null;

  // Actions de Gestion du Compte
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string, charFirstName: string, charLastName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Action d'Hydratation lors du passage dans /world
  hydrateWorld: (uid: string) => Promise<void>;
  
  // Règle du sac à dos 3D
  toggleBackpack: () => void;
  
  // Action de Magasin Accessible
  buyItemFromShop: (spec: { itemId: string; name: string; price: number; weight: number; definitionId: string }) => Promise<string>;
  
  // Opérations Financières
  executeBankingTx: (spec: { action: 'deposit' | 'withdraw' | 'transfer'; amount: number; targetUid?: string }) => Promise<string>;
  executeMarketTx:  (spec: { tradeType: 'buy' | 'sell'; resourceName: string; totalValue: number }) => Promise<string>;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  player: null,
  inventory: null,
  activeVehicle: null,
  idToken: null,
  role: 'player',

  isAuthenticated: false,
  isHydrating: false,
  authError: null,

  login: async (email, password) => {
    set({ authError: null, isHydrating: true });
    try {
      const cred = await FirebaseAuthClient.login(email, password);
      const token = await cred.user.getIdToken();
      
      // Chargement immédiat du profil
      await get().hydrateWorld(cred.user.uid);
      set({ idToken: token, isAuthenticated: true, isHydrating: false });
      return true;
    } catch (err: any) {
      set({ authError: err.message || "Identifiants invalides.", isHydrating: false, isAuthenticated: false });
      return false;
    }
  },

  register: async (email, password, username, firstName, lastName) => {
    set({ authError: null, isHydrating: true });
    try {
      const cred = await FirebaseAuthClient.register(email, password, username);
      const token = await cred.user.getIdToken();
      const uid = cred.user.uid;

      // Création autoritaire du premier document PlayerDocument In-Character RP
      const initialPlayer: PlayerDocument = {
        uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        cash: 500, // 500 $ en liquide de départ
        bank: 2500, // 2500 $ à la banque
        health: 100, armor: 0, hunger: 100, thirst: 100, stamina: 100, stress: 0,
        wantedLevel: 0,
        job: 'civil',
        licenses: { driver: true, weapon: false, hunting: false, business: false },
        position: [0, 2, 0],
        rotation: [0, 0, 0],
        currentZone: 'Route 138',
        spawnPoint: 'last_position',
        equippedBackpack: true,
        lastSeen: Date.now(),
      };

      // Persistance de base
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase/config");
      await setDoc(doc(db, "players", uid), initialPlayer);

      // Hydratation Ram
      set({
        player: initialPlayer,
        idToken: token,
        role: 'player',
        isAuthenticated: true,
        isHydrating: false,
      });

      console.info("[AuthStore] Inscription In-Character réussie.");
      return true;
    } catch (err: any) {
      set({ authError: err.message || "Impossible de créer le compte.", isHydrating: false, isAuthenticated: false });
      return false;
    }
  },

  logout: async () => {
    await FirebaseAuthClient.logout();
    set({
      user: null, player: null, inventory: null, activeVehicle: null,
      idToken: null, role: 'player', isAuthenticated: false,
    });
  },

  hydrateWorld: async (uid: string) => {
    set({ isHydrating: true });
    try {
      const [userDoc, playerDoc] = await Promise.all([
        FirebaseWorldClient.loadUserDocument(uid),
        FirebaseWorldClient.loadPlayerDocument(uid),
      ]);

      set({
        user: userDoc,
        player: playerDoc,
        role: userDoc?.role || 'player',
      });

      // Lancement de l'abonnement en arrière-plan à l'inventaire
      FirebaseWorldClient.subscribeToInventory(uid, (inventory) => {
        set({ inventory });
      });

      set({ isHydrating: false });
      console.info("[AuthStore] Hydratation complète du monde réussie.");
    } catch (err) {
      console.warn("[AuthStore] Erreur pendant l'hydratation Firestore :", err);
      set({ isHydrating: false });
    }
  },

  toggleBackpack: () => {
    const { player, inventory } = get();
    if (!player || !inventory) return;

    const nextEquipped = !player.equippedBackpack;
    const nextMaxWeight = nextEquipped ? 35.0 : 15.0; // 35 kg avec sac, 15 kg poche

    set({
      player: { ...player, equippedBackpack: nextEquipped },
      inventory: { ...inventory, hasBackpack: nextEquipped, maxWeight: nextMaxWeight },
    });

    console.info(`[AuthStore] Sac à dos basculé en mode : ${nextEquipped ? 'Équipé (35 kg)' : 'Poche (15 kg)'}`);
  },

  buyItemFromShop: async (spec) => {
    try {
      const res = await EtherNodeApiClient.buyShopItem(spec);
      const { player } = get();
      if (player) {
        set({ player: { ...player, cash: res.newCash } });
      }
      return `✓ Vous avez acquis : ${res.itemPurchased} !`;
    } catch (err: any) {
      throw new Error(err.message || "Achats bloqués.");
    }
  },

  executeBankingTx: async (spec) => {
    try {
      const res = await EtherNodeApiClient.executeBankOperation(spec);
      const { player } = get();
      if (player) {
        set({ player: { ...player, cash: res.newCash, bank: res.newBank } });
      }
      return `✓ Opération bancaire (${spec.action.toUpperCase()}) confirmée. Base synchronisée en live.`;
    } catch (err: any) {
      throw new Error(err.message || "Opération bancaire bloquée par le Trésor.");
    }
  },

  executeMarketTx: async (spec) => {
    try {
      const res = await EtherNodeApiClient.executeMarketTrade(spec);
      const { player } = get();
      if (player) {
        set({ player: { ...player, bank: res.newBank } });
      }
      return `✓ Négociation boursière (${spec.tradeType.toUpperCase()}) confirmée sur le titre [${spec.resourceName}].`;
    } catch (err: any) {
      throw new Error(err.message || "Transaction boursière rejetée.");
    }
  },
}));
