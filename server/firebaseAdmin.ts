/**
 * server/firebaseAdmin.ts
 * 
 * Initialisation Privilégiée du SDK Firebase Admin pour le Serveur Node.js Autoritaire.
 * - S'occupe de vérifier les identités (tokens JWT) pour bloquer la triche
 * - Connecte le serveur aux 7 collections de référence de Cloud Firestore
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'etherworld-production',
  });
  console.info("[Server FirebaseAdmin] SDK Initialisé avec succès.");
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
