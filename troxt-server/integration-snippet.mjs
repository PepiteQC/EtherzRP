/**
 * integration-snippet.mjs — snippet à ajouter à engine-lab/server/index.mjs.
 *
 * Copier-coller ces lignes dans index.mjs (voir emplacements marqués
 * [TROXT] ci-dessous). AUCUNE autre modification du fichier existant.
 */

// ════════════════════════════════════════════════════════════════
// [TROXT] AJOUT 1 : import en haut du fichier, avec les autres imports.
// (Engine-lab utilise déjà `import { Server } from "socket.io";` plus bas.)
// ════════════════════════════════════════════════════════════════
// import { setupTroxt } from './troxt/router.mjs';


// ════════════════════════════════════════════════════════════════
// [TROXT] AJOUT 2 : juste après `const io = new Server(server, {...});`
// (et après `app.use(cors());` et `app.use(express.json({limit: "1mb"}));`)
// ════════════════════════════════════════════════════════════════
// const __filename = fileURLToPath(import.meta.url);
// const __dirname  = path.dirname(__filename);
// const __troxt    = await setupTroxt({
//   dataDir: path.join(__dirname, 'data'),
//   io,
//   // Optionnel : brancher un vrai provider AI local
//   // aiProvider: { name: 'my-local-model', generateImage: async ({prompt}) => [...] },
// });
// app.use('/api/troxt', __troxt.router);


// ════════════════════════════════════════════════════════════════
// [TROXT] AJOUT 3 : logger le sous-endpoint dans la bannière de démarrage.
// (Dans le `server.listen(PORT, () => { console.log(...) })` existant)
// ════════════════════════════════════════════════════════════════
// console.log(` TROXT:    http://localhost:${PORT}/api/troxt/health`);
// console.log(` TROXT UI: http://localhost:5174  (Vite client)`);


/**
 * ────────────────────────────────────────────────────────────────
 * Exemple d'intégration complète dans engine-lab/server/index.mjs
 * ────────────────────────────────────────────────────────────────
 *
 * Tu peux soit copier-coller les 3 AJOUTS ci-dessus, soit remplacer
 * ton fichier par la version ci-dessous. Les seules différences par
 * rapport à l'original engine-lab/server/index.mjs sont les lignes
 * marquées // [TROXT].
 *
 * Le contenu suivant est un EXEMPLE — adapte selon ton index.mjs réel.
 */

/*
// ─── Début de engine-lab/server/index.mjs ───

import express from "express";
import cors from "cors";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
// [TROXT] AJOUT 1 — décommente la ligne suivante :
// import { setupTroxt } from "./troxt/router.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT = Number(process.env.PORT || 4101);
const DATA_DIR = path.join(__dirname, "data");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5174", "http://127.0.0.1:5174"],
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ── ton code engine-lab existant (defaultWorld, defaultPlatforms, etc.) ──
// ... (inchangé) ...

// [TROXT] AJOUT 2 — décommente les lignes suivantes, après app.use(express.json) :
// const __troxt = await setupTroxt({
//   dataDir: DATA_DIR,
//   io,
// });
// app.use("/api/troxt", __troxt.router);

// ── tes handlers Socket.IO existants ──
// ... (inchangé) ...

server.listen(PORT, () => {
  console.log("");
  console.log("================================================");
  console.log(" ETHERWORLD LOCAL ENGINE LAB");
  console.log("================================================");
  console.log(` Server: http://localhost:${PORT}`);
  console.log(` API: http://localhost:${PORT}/api/world`);
  console.log(` Data: ${DATA_DIR}`);
  console.log(` Client: http://localhost:5174`);
  // [TROXT] AJOUT 3 — décommente :
  // console.log(` TROXT: http://localhost:${PORT}/api/troxt/health`);
  console.log("================================================");
  console.log("");
});

// ─── Fin de engine-lab/server/index.mjs ───
*/
