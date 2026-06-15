/**
 * src/lib/firebase/verifyFirebaseToken.ts
 * 
 * Intergiciel et helper pour vérifier l'identité d'un client sur le backend Node.js.
 * Utilise la méthode recommandée par Firebase : `adminAuth.verifyIdToken`.
 * Garantit que chaque requête sensible (argent, inventaire, portes) est authentifiée et autoritaire.
 */

import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "./firebaseAdmin";
import type { DecodedIdToken } from "firebase-admin/auth";

// Extension de l'interface Request d'Express pour inclure userToken
declare global {
  namespace Express {
    interface Request {
      userToken?: DecodedIdToken;
      uid?: string;
    }
  }
}

/**
 * Helper synchrone pour vérifier un idToken brut
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Token d'authentification manquant ou malformé.");
  }
  return await adminAuth.verifyIdToken(idToken.trim());
}

/**
 * Express Middleware pour protéger une route serveur
 * Récupère le jeton depuis le header `Authorization: Bearer <idToken>`
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Accès refusé. Jeton d'authentification manquant." });
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await verifyIdToken(idToken);
    req.userToken = decodedToken;
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error("[RequireAuth] Jeton invalide ou expiré :", error);
    res.status(403).json({ error: "Jeton d'authentification invalide ou expiré." });
  }
}

/**
 * Express Middleware pour protéger une route admin
 * Vérifie l'authenticité ET la présence du claim custom admin
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    const token = req.userToken;
    if (!token || (token.role !== "admin" && token.role !== "owner" && token.admin !== true)) {
      res.status(403).json({ error: "Privilèges administrateur requis." });
      return;
    }
    next();
  });
}
