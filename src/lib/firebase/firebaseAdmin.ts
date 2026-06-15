/**
 * src/lib/firebase/firebaseAdmin.ts
 * 
 * Initialisation de Firebase Admin SDK pour le serveur autoritaire Node.js.
 * Fournit l'accès privilégié à Firestore (adminDb) et Firebase Auth (adminAuth)
 * pour valider les jetons, contourner les Security Rules côté serveur, et journaliser de manière sécurisée.
 */

import * as admin from "firebase-admin";

// Initialisation unique du singleton Admin
if (!admin.apps.length) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID ?? "etherworld-local";
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
      console.info("[Firebase Admin] Initialisé avec clé de compte de service.");
    } catch (e) {
      console.warn("[Firebase Admin] Erreur lors du parsing de FIREBASE_SERVICE_ACCOUNT, fallback sur Application Default Credentials.");
      admin.initializeApp({ projectId });
    }
  } else {
    // Mode dev / émulateur ou Application Default Credentials
    admin.initializeApp({ projectId });
    console.info(`[Firebase Admin] Initialisé avec Project ID: ${projectId}`);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

export default admin;
