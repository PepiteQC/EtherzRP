import express from "express";
import cors from "cors";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 4101);
const DATA_DIR = path.join(__dirname, "data");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5174", "http://127.0.0.1:5174"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const defaultWorld = {
  id: "etherworld_local_lab",
  name: "EtherWorld Local Engine Lab",
  version: 1,
  mode: "local",
  gravity: [0, -24, 0],
  spawn: [0, 3, 8],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const defaultPlatforms = [
  {
    id: "spawn_base",
    name: "Spawn Base",
    type: "platform",
    position: [0, 0.25, 0],
    rotation: [0, 0, 0],
    size: [12, 0.5, 12],
    color: "#283447",
    material: "asphalt",
    collider: "cuboid",
    locked: true
  },
  {
    id: "jump_test_01",
    name: "Jump Test 01",
    type: "platform",
    position: [8, 1.25, -4],
    rotation: [0, 0, 0],
    size: [5, 0.5, 5],
    color: "#7f8794",
    material: "concrete",
    collider: "cuboid",
    locked: false
  },
  {
    id: "bridge_test_01",
    name: "Bridge Test 01",
    type: "platform",
    position: [-7, 2.2, -8],
    rotation: [0, 0.25, 0],
    size: [10, 0.35, 2],
    color: "#4a5568",
    material: "metal",
    collider: "cuboid",
    locked: false
  }
];

const defaultBuildings = [];

let world = defaultWorld;
let platforms = [];
let buildings = [];
let performanceSamples = [];

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  world = await readOrCreateJson("world.local.json", defaultWorld);
  platforms = await readOrCreateJson("platforms.local.json", defaultPlatforms);
  buildings = await readOrCreateJson("buildings.local.json", defaultBuildings);
}

async function readOrCreateJson(fileName, fallback) {
  const filePath = path.join(DATA_DIR, fileName);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
    return structuredClone(fallback);
  }
}

async function writeJson(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function cleanId(value, prefix = "obj") {
  return String(value || `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9999)}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
}

function cleanText(value, fallback, max = 120) {
  return String(value || fallback).slice(0, max);
}

function cleanVec3(value, fallback, min, max) {
  return [
    clamp(value?.[0], min, max, fallback[0]),
    clamp(value?.[1], min, max, fallback[1]),
    clamp(value?.[2], min, max, fallback[2])
  ];
}

function sanitizePlatform(input) {
  return {
    id: cleanId(input?.id, "platform"),
    name: cleanText(input?.name, "Nouvelle plateforme"),
    type: "platform",
    position: cleanVec3(input?.position, [0, 0.25, 0], -1000, 1000),
    rotation: cleanVec3(input?.rotation, [0, 0, 0], -6.28, 6.28),
    size: [
      clamp(input?.size?.[0], 0.25, 100, 4),
      clamp(input?.size?.[1], 0.1, 20, 0.5),
      clamp(input?.size?.[2], 0.25, 100, 4)
    ],
    color: /^#[0-9a-fA-F]{6}$/.test(input?.color || "") ? input.color : "#00aaff",
    material: cleanText(input?.material, "painted", 40),
    collider: "cuboid",
    locked: Boolean(input?.locked ?? false),
    createdAt: input?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "etherworld-local-engine-lab",
    port: PORT,
    mode: "local",
    realtime: "socket.io",
    uptimeSeconds: Math.round(process.uptime())
  });
});

app.get("/api/world", (_req, res) => {
  res.json({ ok: true, world });
});

app.get("/api/platforms", (_req, res) => {
  res.json({ ok: true, count: platforms.length, platforms });
});

app.get("/api/buildings", (_req, res) => {
  res.json({ ok: true, count: buildings.length, buildings });
});

app.get("/api/performance", (_req, res) => {
  const last = performanceSamples.at(-1) || null;

  res.json({
    ok: true,
    last,
    sampleCount: performanceSamples.length,
    server: {
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  });
});

io.on("connection", (socket) => {
  console.log("[SOCKET_CONNECTED]", socket.id);

  socket.emit("world:init", {
    world,
    platforms,
    buildings
  });

  socket.on("platform:create", async (draft, ack) => {
    try {
      const platform = sanitizePlatform(draft);

      if (platforms.some((p) => p.id === platform.id)) {
        ack?.({ ok: false, error: "PLATFORM_ID_ALREADY_EXISTS" });
        return;
      }

      platforms.push(platform);
      await writeJson("platforms.local.json", platforms);

      io.emit("platform:created", platform);

      console.log("[PLATFORM_CREATED]", platform.id);

      ack?.({ ok: true, platform });
    } catch (error) {
      console.error("[PLATFORM_CREATE_ERROR]", error);
      ack?.({ ok: false, error: "PLATFORM_CREATE_FAILED" });
    }
  });

  socket.on("platform:update", async ({ id, patch }, ack) => {
    try {
      const index = platforms.findIndex((p) => p.id === id);

      if (index === -1) {
        ack?.({ ok: false, error: "PLATFORM_NOT_FOUND" });
        return;
      }

      if (platforms[index].locked) {
        ack?.({ ok: false, error: "PLATFORM_LOCKED" });
        return;
      }

      const next = sanitizePlatform({
        ...platforms[index],
        ...patch,
        id: platforms[index].id,
        locked: platforms[index].locked,
        createdAt: platforms[index].createdAt
      });

      platforms[index] = next;

      await writeJson("platforms.local.json", platforms);

      io.emit("platform:updated", next);

      console.log("[PLATFORM_UPDATED]", next.id);

      ack?.({ ok: true, platform: next });
    } catch (error) {
      console.error("[PLATFORM_UPDATE_ERROR]", error);
      ack?.({ ok: false, error: "PLATFORM_UPDATE_FAILED" });
    }
  });

  socket.on("platform:delete", async (id, ack) => {
    try {
      const index = platforms.findIndex((p) => p.id === id);

      if (index === -1) {
        ack?.({ ok: false, error: "PLATFORM_NOT_FOUND" });
        return;
      }

      if (platforms[index].locked) {
        ack?.({ ok: false, error: "PLATFORM_LOCKED" });
        return;
      }

      const [removed] = platforms.splice(index, 1);

      await writeJson("platforms.local.json", platforms);

      io.emit("platform:deleted", removed.id);

      console.log("[PLATFORM_DELETED]", removed.id);

      ack?.({ ok: true, removedId: removed.id });
    } catch (error) {
      console.error("[PLATFORM_DELETE_ERROR]", error);
      ack?.({ ok: false, error: "PLATFORM_DELETE_FAILED" });
    }
  });

  socket.on("performance:sample", (sample) => {
    const clean = {
      at: new Date().toISOString(),
      fps: clamp(sample?.fps, 0, 500, 0),
      objects: clamp(sample?.objects, 0, 100000, 0),
      triangles: clamp(sample?.triangles, 0, 100000000, 0),
      calls: clamp(sample?.calls, 0, 100000, 0)
    };

    performanceSamples.push(clean);

    if (performanceSamples.length > 120) {
      performanceSamples = performanceSamples.slice(-120);
    }
  });

  socket.on("disconnect", () => {
    console.log("[SOCKET_DISCONNECTED]", socket.id);
  });
});

await ensureDataFiles();

server.listen(PORT, () => {
  console.log("");
  console.log("================================================");
  console.log(" ETHERWORLD LOCAL ENGINE LAB");
  console.log("================================================");
  console.log(` Server: http://localhost:${PORT}`);
  console.log(` API:    http://localhost:${PORT}/api/world`);
  console.log(` Data:   ${DATA_DIR}`);
  console.log(" Client: http://localhost:5174");
  console.log("================================================");
  console.log("");
});
