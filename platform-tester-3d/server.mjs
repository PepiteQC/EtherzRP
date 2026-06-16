import express from "express";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 4100);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use(express.static(path.join(__dirname, "public")));

const platforms = [
  {
    id: "spawn_platform",
    name: "Spawn Platform",
    type: "spawn",
    position: [0, 0, 0],
    size: [8, 0.5, 8],
    color: "#2d3748",
    material: "asphalt",
    safe: true
  }
];

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sanitizePlatform(input) {
  const id = String(input?.id || `platform_${Date.now()}_${Math.floor(Math.random() * 9999)}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);

  const name = String(input?.name || "Nouvelle plateforme").slice(0, 80);

  const position = [
    clampNumber(input?.position?.[0], -500, 500, 0),
    clampNumber(input?.position?.[1], -20, 120, 1),
    clampNumber(input?.position?.[2], -500, 500, 0)
  ];

  const size = [
    clampNumber(input?.size?.[0], 0.2, 80, 4),
    clampNumber(input?.size?.[1], 0.1, 20, 0.5),
    clampNumber(input?.size?.[2], 0.2, 80, 4)
  ];

  const color = /^#[0-9a-fA-F]{6}$/.test(input?.color || "")
    ? input.color
    : "#00aaff";

  return {
    id,
    name,
    type: String(input?.type || "custom").slice(0, 40),
    position,
    size,
    color,
    material: String(input?.material || "painted").slice(0, 40),
    safe: Boolean(input?.safe ?? true),
    createdAt: new Date().toISOString()
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "etherworld-platform-tester-3d",
    port: PORT,
    live: true,
    realtime: "socket.io"
  });
});

app.get("/api/platforms", (_req, res) => {
  res.json({
    ok: true,
    count: platforms.length,
    platforms
  });
});

io.on("connection", (socket) => {
  console.log("[SOCKET_CONNECTED]", socket.id);

  socket.emit("platforms:init", platforms);

  socket.on("platform:create", (draft, ack) => {
    try {
      const platform = sanitizePlatform(draft);

      if (platforms.some((p) => p.id === platform.id)) {
        ack?.({ ok: false, error: "ID_PLATFORM_ALREADY_EXISTS" });
        return;
      }

      platforms.push(platform);

      io.emit("platform:created", platform);

      console.log("[PLATFORM_CREATED]", platform.id, platform.position, platform.size);

      ack?.({
        ok: true,
        platform
      });
    } catch (error) {
      ack?.({
        ok: false,
        error: "CREATE_PLATFORM_FAILED"
      });
    }
  });

  socket.on("platform:delete", (id, ack) => {
    const cleanId = String(id || "");
    const index = platforms.findIndex((p) => p.id === cleanId);

    if (index === -1) {
      ack?.({ ok: false, error: "PLATFORM_NOT_FOUND" });
      return;
    }

    const [removed] = platforms.splice(index, 1);

    io.emit("platform:deleted", removed.id);

    console.log("[PLATFORM_DELETED]", removed.id);

    ack?.({
      ok: true,
      removedId: removed.id
    });
  });

  socket.on("disconnect", () => {
    console.log("[SOCKET_DISCONNECTED]", socket.id);
  });
});

server.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log(" EtherWorld Platform Tester 3D LIVE");
  console.log("========================================");
  console.log(` Local: http://localhost:${PORT}`);
  console.log(` API:   http://localhost:${PORT}/api/platforms`);
  console.log(` Live:  Socket.IO enabled`);
  console.log("========================================");
  console.log("");
});
