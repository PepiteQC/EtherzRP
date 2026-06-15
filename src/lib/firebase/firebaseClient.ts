/**
 * src/lib/firebase/firebaseClient.ts
 * 
 * Passerelle Client Officielle pour React / Vite.
 * Orchestre l'Authentification (login/register) et les snapshots de données ponctuels sans spammer Firestore.
 * Conçu pour injecter l'identité certifiée (JWT) dans les API React vers le Serveur Node Admin.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  type UserCredential,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  type DocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "./config";
import type {
  UserDocument,
  PlayerDocument,
  InventoryDocument,
  VehicleDocument,
  PropertyDocument,
  WorldStateDocument,
} from "./firestoreSchema";

/**
 * 1. Authentification Firebase unifiée
 */
export class FirebaseAuthClient {
  static async login(email: string, password: string): Promise<UserCredential> {
    return await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  static async register(email: string, password: string, displayName: string): Promise<UserCredential> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
      
      // Initialiser le document utilisateur de base users/{uid}
      const userDoc: UserDocument = {
        uid: cred.user.uid,
        email: cred.user.email!,
        displayName: displayName.trim(),
        createdAt: Date.now(),
        lastLogin: Date.now(),
        banned: false,
        role: 'player',
        clientPreferences: {
          graphicsQuality: 'high',
          audioVolume: 0.8,
          showDebugHUD: true,
        },
      };
      await setDoc(doc(db, "users", cred.user.uid), userDoc);
    }
    return cred;
  }

  static async logout(): Promise<void> {
    await firebaseSignOut(auth);
  }

  static async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
  }

  static getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

/**
 * 2. Connecteur au Cerveau Permanent Firestore
 */
export class FirebaseWorldClient {
  /**
   * Charger 1 seule fois le compte utilisateur
   */
  static async loadUserDocument(uid: string): Promise<UserDocument | null> {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return snap.data() as UserDocument;
  }

  /**
   * Charger 1 seule fois le joueur RP actif
   */
  static async loadPlayerDocument(uid: string): Promise<PlayerDocument | null> {
    const snap = await getDoc(doc(db, "players", uid));
    if (!snap.exists()) return null;
    return snap.data() as PlayerDocument;
  }

  /**
   * Snapshot ciblé sur l'inventaire
   */
  static subscribeToInventory(uid: string, callback: (inv: InventoryDocument) => void): (() => void) {
    return onSnapshot(doc(db, "inventories", uid), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as InventoryDocument);
      }
    });
  }

  /**
   * Snapshot ciblé sur l'état global du monde
   */
  static subscribeToWorldState(callback: (state: WorldStateDocument) => void): (() => void) {
    return onSnapshot(doc(db, "worldState", "global"), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as WorldStateDocument);
      }
    });
  }

  /**
   * Mise à jour purement UI des préférences
   */
  static async updateUserPreferences(uid: string, prefs: Partial<UserDocument['clientPreferences']>): Promise<void> {
    await updateDoc(doc(db, "users", uid), { clientPreferences: prefs });
  }
}
