/**
 * server/middleware/verifyFirebaseToken.ts
 * 
 * Intergiciel de Sécurité Express validant le jeton `idToken` issu de Firebase Auth.
 * Fait respecter la règle "Le client ne décide de rien en direct".
 */

import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../firebaseAdmin';

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: "Authentification refusée. Header Authorization manquant ou invalide." });
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    (req as any).userToken = decoded;
    (req as any).uid = decoded.uid;
    next();
  } catch (error) {
    console.warn("[Security Middleware] Token expiré ou falsifié :", error);
    res.status(403).json({ error: "Jeton d'authentification Firebase invalide, expiré ou révoqué." });
  }
}

export async function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  await verifyFirebaseToken(req, res, () => {
    const u = (req as any).userToken;
    if (!u || (u.role !== 'admin' && u.role !== 'owner' && u.admin !== true)) {
      res.status(403).json({ error: "Violation de privilèges. Commande réservée aux administrateurs autorisés." });
      return;
    }
    next();
  });
}
