// ═══════════════════════════════════════════════════════════════
// src/lib/firebase/config.ts — EtherWorld QC RP
// Singleton Firebase v12, HMR-safe, branché sur .env.local
// ═══════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

// Pattern HMR-safe — évite "Firebase: App named '[DEFAULT]' already exists"
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp()

export const db:      Firestore      = getFirestore(app)
export const auth:    Auth           = getAuth(app)
export const storage: FirebaseStorage = getStorage(app)
export default app