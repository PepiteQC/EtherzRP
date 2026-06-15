/**
 * src/server/server.ts
 * 
 * Serveur Backend Autoritaire (Node.js + Express + Socket.IO) pour EtherWorld RP.
 * Fait respecter la règle d'or : 
 * - Firebase = cerveau permanent (Firestore, Admin logs, schémas lents)
 * - Node / Socket.IO = monde vivant temps réel (positions, ping, synchronisation)
 */

import http from "http";
import express, { type Request, type Response } from "express";
import { Server, type Socket } from "socket.io";
import { adminDb } from "../lib/firebase/firebaseAdmin";
import { requireAuth, requireAdmin } from "../lib/firebase/verifyFirebaseToken";
import type { PlayerData, InventoryData, AccessLog, AdminLog } from "../lib/firebase/firestoreSchema";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dictionnaire en mémoire des joueurs actifs (Temps Réel Rapide)
// ─────────────────────────────────────────────────────────────────────────────

interface LivePlayerState {
  uid: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  zone: string;
  mode: 'walking' | 'driving' | 'spectator';
  vehicleId?: string;
  lastPing: number;
}

const livePlayers = new Map<string, LivePlayerState>();

// ─────────────────────────────────────────────────────────────────────────────
// 2. Live World avec Socket.IO (Ne spam pas Firestore !)
// ─────────────────────────────────────────────────────────────────────────────

io.on("connection", (socket: Socket) => {
  console.info(`[Socket.IO] Client connecté : ${socket.id}`);

  // Identification initiale par le client avec son idToken ou UID
  socket.on("auth_join", async (data: { uid: string; name: string; zone?: string }) => {
    const { uid, name, zone = "Route 138" } = data;
    if (!uid) return;

    socket.data.uid = uid;
    socket.join(zone); // Séparation par tuile/zone pour optimiser la bande passante

    livePlayers.set(uid, {
      uid,
      name: name || "Citoyen",
      x: 0,
      y: 0.5,
      z: 0,
      rotationY: 0,
      zone,
      mode: 'walking',
      lastPing: Date.now(),
    });

    console.info(`[LiveWorld] Joueur ${name} (${uid}) a rejoint ${zone}`);
    socket.to(zone).emit("player_joined", { uid, name, zone });
  });

  // Boucle de position envoyée par le client à 15-30 FPS (purement Socket.IO)
  socket.on("player_move", (pos: { x: number; y: number; z: number; rotY: number; zone: string; mode?: 'walking' | 'driving' }) => {
    const uid = socket.data.uid;
    if (!uid) return;

    const player = livePlayers.get(uid);
    if (player) {
      player.x = pos.x;
      player.y = pos.y;
      player.z = pos.z;
      player.rotationY = pos.rotY;
      player.zone = pos.zone;
      if (pos.mode) player.mode = pos.mode;
      player.lastPing = Date.now();

      // Diffuse immédiatement aux autres joueurs de la même zone
      socket.to(pos.zone).emit("players_update", [{
        uid,
        name: player.name,
        x: pos.x, y: pos.y, z: pos.z,
        rotY: pos.rotY,
        mode: player.mode,
      }]);
    }
  });

  // Déconnexion
  socket.on("disconnect", () => {
    const uid = socket.data.uid;
    if (uid) {
      const player = livePlayers.get(uid);
      livePlayers.delete(uid);
      console.info(`[LiveWorld] Joueur ${player?.name || uid} déconnecté.`);
      io.emit("player_left", { uid });
    }
  });
});

// Nettoyage périodique des fantômes en mémoire toutes les 60 secondes
setInterval(() => {
  const now = Date.now();
  livePlayers.forEach((player, uid) => {
    if (now - player.lastPing > 45000) {
      livePlayers.delete(uid);
      io.emit("player_left", { uid });
    }
  });
}, 60000);

// ─────────────────────────────────────────────────────────────────────────────
// 3. ROUTES SERVEUR EXPRESS SÉCURISÉES (Autoritaires)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/player/me
 * Charge le profil complet et l'inventaire
 */
app.get("/api/player/me", requireAuth, async (req: Request, res: Response) => {
  const uid = req.uid!;
  try {
    const [playerSnap, invSnap] = await Promise.all([
      adminDb.collection("players").doc(uid).get(),
      adminDb.collection("inventories").doc(uid).get(),
    ]);

    res.json({
      player: playerSnap.exists ? playerSnap.data() : null,
      inventory: invSnap.exists ? invSnap.data() : null,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur lors de la lecture des données." });
  }
});

/**
 * POST /api/player/save-position
 * Sauvegarde lente et permanente de la position dans Firestore (Toutes les 10-30s par le client)
 */
app.post("/api/player/save-position", requireAuth, async (req: Request, res: Response) => {
  const uid = req.uid!;
  const { position, cash, mode } = req.body;

  if (!position) {
    res.status(400).json({ error: "Position manquante." });
    return;
  }

  try {
    await adminDb.collection("players").doc(uid).set({
      position,
      ...(typeof cash === "number" && { cash }),
      ...(mode && { mode }),
      lastSavedAt: Date.now(),
    }, { merge: true });

    res.json({ status: "success", savedAt: Date.now() });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la persistance Firestore." });
  }
});

/**
 * POST /api/inventory/use
 * Action autoritaire : utilisation d'un objet (consommable, clé)
 */
app.post("/api/inventory/use", requireAuth, async (req: Request, res: Response) => {
  const uid = req.uid!;
  const { itemId, targetId } = req.body;

  if (!itemId) {
    res.status(400).json({ error: "Identifiant de l'objet requis." });
    return;
  }

  try {
    const invRef = adminDb.collection("inventories").doc(uid);
    await adminDb.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(invRef);
      if (!docSnap.exists) throw new Error("Inventaire introuvable.");

      const inv = docSnap.data() as InventoryData;
      const itemIndex = inv.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1 || inv.items[itemIndex].quantity <= 0) {
        throw new Error("Objet épuisé ou inexistant.");
      }

      const item = inv.items[itemIndex];
      item.quantity -= 1;
      if (item.quantity === 0) {
        inv.items.splice(itemIndex, 1);
      }

      transaction.update(invRef, {
        items: inv.items,
        updatedAt: Date.now(),
      });
    });

    res.json({ status: "success", message: `Objet ${itemId} utilisé avec succès.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Erreur de transaction." });
  }
});

/**
 * POST /api/door/interact
 * Ouverture ou fermeture autoritaire d'une porte verrouillée
 */
app.post("/api/door/interact", requireAuth, async (req: Request, res: Response) => {
  const uid = req.uid!;
  const { doorId, action, zone } = req.body; // action: 'lock' | 'unlock'

  if (!doorId || !action) {
    res.status(400).json({ error: "doorId et action requis." });
    return;
  }

  try {
    // Exécute la journalisation d'accès (Access Logs) de manière sécurisée
    const logDoc: AccessLog = {
      logId: `door_${doorId}_${Date.now()}`,
      uid,
      playerName: req.userToken?.name || "Citoyen",
      entityType: "door",
      entityId: doorId,
      action,
      createdAt: Date.now(),
      zone: zone || "Québec",
    };

    await Promise.all([
      adminDb.collection("accessLogs").doc(logDoc.logId).set(logDoc),
      adminDb.collection("properties").doc("quebec_doors").set({
        [doorId]: { state: action === "unlock" ? "open" : "locked", updatedAt: Date.now() },
      }, { merge: true }),
    ]);

    // Diffuse le changement en live
    io.emit("door_state_changed", { doorId, state: action === "unlock" ? "open" : "locked" });

    res.json({ status: "success", new_state: action === "unlock" ? "open" : "locked" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'interaction avec la porte." });
  }
});

/**
 * POST /api/admin/action
 * Route sensible modération — accessible uniquement aux rôles administrateurs
 */
app.post("/api/admin/action", requireAdmin, async (req: Request, res: Response) => {
  const adminUid = req.uid!;
  const { targetUid, targetAction, value, reason } = req.body;

  if (!targetAction || !reason) {
    res.status(400).json({ error: "targetAction et reason requis pour l'audit." });
    return;
  }

  try {
    const adminLog: AdminLog = {
      logId: `adm_${Date.now()}_${adminUid}`,
      adminUid,
      adminName: req.userToken?.name || "Admin",
      targetUid,
      action: targetAction,
      reason,
      details: { value },
      createdAt: Date.now(),
    };

    await adminDb.collection("adminLogs").doc(adminLog.logId).set(adminLog);

    if (targetUid && targetAction === "set_money") {
      await adminDb.collection("players").doc(targetUid).update({ money: value });
    }

    res.json({ status: "success", auditId: adminLog.logId });
  } catch (err) {
    res.status(500).json({ error: "Échec de l'exécution de la commande admin." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Lancement du serveur
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => {
  console.info(`[EtherWorld Server] 🚀 Backend Live & Autoritaire lancé sur le port ${PORT}`);
});

export { app, server, io };
export default server;
