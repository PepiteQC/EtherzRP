// src/lib/firebase/config.ts
//
// ════════════════════════════════════════════════════════════════
//  ETHERWORLD QC RP — Firebase v12 configuration
//  Exporte : app, db, auth, storage
//  + helpers : onAuthChange, getCurrentUser, signOut, isAdmin
// ════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

import {
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  connectAuthEmulator,
  type Auth,
  type User,
} from "firebase/auth";

import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from "firebase/storage";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Validation des variables d'environnement
//    → Crash explicite au démarrage si une clé est manquante,
//      plutôt qu'un "permission denied" cryptique de Firebase.
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

for (const key of REQUIRED_ENV) {
  if (!import.meta.env[key]) {
    throw new Error(
      `[EtherWorld Firebase] Variable manquante : ${key}\n` +
      `→ Copie .env.example en .env.local et remplis tes clés Firebase.`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Config Firebase
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Init — singleton (évite le double-init en HMR Vite)
// ─────────────────────────────────────────────────────────────────────────────

const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// ─────────────────────────────────────────────────────────────────────────────
// 4. Services
// ─────────────────────────────────────────────────────────────────────────────

export const db:      Firestore       = getFirestore(app);
export const auth:    Auth            = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Persistence offline (Firestore)
//    Permet au jeu de continuer même si la connexion coupe.
//    → Les données sont mises en cache IndexedDB localement.
// ─────────────────────────────────────────────────────────────────────────────

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // Plusieurs onglets ouverts — la persistence ne peut être activée que dans un seul
    console.warn("[EtherWorld Firebase] Persistence désactivée : plusieurs onglets détectés.");
  } else if (err.code === "unimplemented") {
    // Navigateur trop vieux
    console.warn("[EtherWorld Firebase] Persistence non supportée par ce navigateur.");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Émulateurs locaux (dev uniquement)
//    Lance : firebase emulators:start
//    Met VITE_USE_EMULATOR=true dans .env.local pour activer
// ─────────────────────────────────────────────────────────────────────────────

if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth,       "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db,    "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  console.info("[EtherWorld Firebase] 🔧 Mode émulateur actif.");
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Helpers Auth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * S'abonne aux changements d'état d'authentification.
 * Retourne le unsubscribe — appelle-le dans useEffect cleanup.
 *
 * @example
 * useEffect(() => {
 *   return onAuthChange((user) => {
 *     if (user) console.log("Connecté :", user.uid);
 *     else console.log("Déconnecté");
 *   });
 * }, []);
 */
export const onAuthChange = (
  callback: (user: User | null) => void
): (() => void) => onAuthStateChanged(auth, callback);

/**
 * Retourne l'utilisateur courant ou null.
 * Synchrone — ne pas utiliser pour l'état initial (utilise onAuthChange).
 */
export const getCurrentUser = (): User | null => auth.currentUser;

/**
 * Déconnecte l'utilisateur courant.
 */
export const signOutUser = (): Promise<void> => firebaseSignOut(auth);

/**
 * Vérifie si le user a le claim admin dans ses custom claims Firebase.
 * Nécessite que l'admin soit défini côté Cloud Functions avec setCustomUserClaims.
 */
export const isAdmin = async (user: User): Promise<boolean> => {
  const token = await user.getIdTokenResult();
  return token.claims["role"] === "admin" || token.claims["admin"] === true;
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Collections Firestore — noms centralisés
//    → Utilise toujours ces constantes au lieu de strings en dur partout.
//    → Si tu renommes une collection, tu changes juste ici.
// ─────────────────────────────────────────────────────────────────────────────

export const COLLECTIONS = {
  // Joueurs
  PLAYERS:        "players",
  CHARACTERS:     "characters",

  // Monde
  PROPERTIES:     "properties",
  HOTEL_ROOMS:    "hotel_rooms",
  HOTEL_BOOKINGS: "hotel_bookings",

  // Économie
  TRANSACTIONS:   "transactions",
  INVENTORY:      "inventory",
  MARKET:         "market_listings",

  // Social
  TRADES:         "trades",
  MESSAGES:       "messages",
  CHAT_ROOMS:     "chat_rooms",

  // Admin
  ADMIN_LOGS:     "admin_logs",
  BANS:           "bans",
  REPORTS:        "reports",

  // Jeu
  SESSIONS:       "sessions",
  WORLD_EVENTS:   "world_events",
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// ─────────────────────────────────────────────────────────────────────────────
// 9. Storage paths — chemins centralisés
// ─────────────────────────────────────────────────────────────────────────────

export const STORAGE_PATHS = {
  avatars:    (uid: string)  => `avatars/${uid}/avatar.jpg`,
  banners:    (uid: string)  => `banners/${uid}/banner.jpg`,
  properties: (id: string)   => `properties/${id}/`,
  world:                        "world/",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 10. Export app (au cas où un service l'aurait besoin directement)
// ─────────────────────────────────────────────────────────────────────────────

export { app };
export default app;