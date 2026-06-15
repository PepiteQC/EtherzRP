/**
 * server/server.ts
 * 
 * Serveur Maître Autoritaire & Live World (Production) pour EtherWorld RP.
 * Fait la passerelle complète :
 * 1. Node.js Express API pour la gestion autoritaire des entités Firestore (players, inventories, vehicles, properties)
 * 2. Socket.IO WebSockets pour la synchronisation à 60 FPS du gameplay sans spammer la facturation Google Cloud.
 */

import http from "http";
import express from "express";
import { Server, type Socket } from "socket.io";
import playerRoutes from "./routes/player.routes";

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
// 1. Montage des Routes Autoritaires /api et /api/player
// ─────────────────────────────────────────────────────────────────────────────

app.use("/api/player", playerRoutes);
app.use("/api",        playerRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Gestionnaire WebSockets Live (Socket.IO) pour Mouvement & Ping (0 $ sur Firestore)
// ─────────────────────────────────────────────────────────────────────────────

interface LivePlayerInfo {
  uid: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  zone: string;
  mode: 'walking' | 'driving' | 'spectator';
  lastPing: number;
}

const livePlayersPool = new Map<string, LivePlayerInfo>();

io.on("connection", (socket: Socket) => {
  console.info(`[Socket.IO] Nouveau citoyen connecté : ${socket.id}`);

  // Connexion initiale In-Character
  socket.on("auth_join", (data: { uid: string; name: string; zone?: string }) => {
    const { uid, name, zone = "Route 138" } = data;
    if (!uid) return;

    socket.data.uid  = uid;
    socket.data.name = name || "Citoyen";
    socket.data.zone = zone;

    socket.join(zone); // Regroupement par tuile/quartier

    livePlayersPool.set(uid, {
      uid,
      name: name || "Citoyen",
      x: 0, y: 2, z: 0,
      rotY: 0,
      zone,
      mode: 'walking',
      lastPing: Date.now(),
    });

    socket.to(zone).emit("player_joined", { uid, name, zone });
    console.info(`[LiveWorld] ${name} (${uid}) est actif dans le quartier : ${zone}`);
  });

  // Déplacement ultra-rapide 30-60 FPS en RAM WebSockets
  socket.on("player_move", (pos: { x: number; y: number; z: number; rotY: number; zone: string; mode?: 'walking' | 'driving' }) => {
    const uid = socket.data.uid;
    if (!uid) return;

    const p = livePlayersPool.get(uid);
    if (p) {
      p.x = pos.x; p.y = pos.y; p.z = pos.z;
      p.rotY = pos.rotY; p.zone = pos.zone;
      if (pos.mode) p.mode = pos.mode;
      p.lastPing = Date.now();

      // Broadcast aux citoyens à proximité
      socket.to(pos.zone).emit("players_update", [{
        uid,
        name: p.name,
        x: pos.x, y: pos.y, z: pos.z,
        rotY: pos.rotY,
        mode: p.mode,
      }]);
    }
  });

  socket.on("disconnect", () => {
    const uid = socket.data.uid;
    if (uid) {
      const p = livePlayersPool.get(uid);
      livePlayersPool.delete(uid);
      io.emit("player_left", { uid });
      console.info(`[LiveWorld] Citoyen ${p?.name || uid} s'est déconnecté.`);
    }
  });
});

// Purge des sessions fantômes en mémoire toutes les minutes
setInterval(() => {
  const now = Date.now();
  livePlayersPool.forEach((p, uid) => {
    if (now - p.lastPing > 45000) {
      livePlayersPool.delete(uid);
      io.emit("player_left", { uid });
    }
  });
}, 60000);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Démarrage du Backend
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => {
  console.info(`[EtherWorld Node] 🚀 Serveur Autoritaire Live démarré sur le port ${PORT}`);
});

export { app, server, io };
export default server;
