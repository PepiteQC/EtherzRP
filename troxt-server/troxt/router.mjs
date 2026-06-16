/**
 * router.mjs — entrée principale du backend TROXT.
 *
 * Crée un sous-router Express qui monte tous les endpoints sous /troxt/*.
 * À brancher dans engine-lab/server/index.mjs en 3 lignes (voir
 * integration-snippet.mjs).
 */

import express from 'express';
import { makePaths, ensureDirs } from './data-store.mjs';
import { createAiRouter } from './ai.mjs';
import { createStorageRouter } from './storage.mjs';
import { createDataRouter } from './data.mjs';
import { createFunctionsRouter } from './functions.mjs';
import { createManifestsRouter } from './manifests.mjs';
import { createVisualForgeRouter } from './visual-forge.mjs';
import { registerTroxtSocketHandlers } from './socket-events.mjs';

/**
 * Crée et initialise le router TROXT.
 *
 * @param {Object}   opts
 * @param {string}   opts.dataDir  Chemin vers engine-lab/server/data/
 * @param {Server}   opts.io       Instance Socket.IO (depuis index.mjs)
 * @param {Object}   opts.aiProvider  Optionnel : { name, generateImage }
 * @returns {express.Router}
 */
export function createTroxtRouter({ dataDir, io, aiProvider }) {
  const paths = makePaths(dataDir);

  // Initialisation async (sous-dossiers) — appelé une seule fois au boot
  // par setupTroxt(). On documente la fonction ici pour visibilité.
  const router = express.Router();

  router.get('/health', async (_req, res) => {
    res.json({
      ok: true,
      at: Date.now(),
      paths: {
        kv:        paths.kv,
        manifests: paths.manifests,
        jobs:      paths.jobs,
        uploads:   paths.uploads,
        generated: paths.generated,
      },
    });
  });

  router.use('/ai',            createAiRouter(paths, { aiProvider: aiProvider ?? 'stub' }));
  router.use('/storage',       createStorageRouter(paths));
  router.use('/data',          createDataRouter(paths));
  router.use('/functions',     createFunctionsRouter(paths));
  router.use('/manifests',     createManifestsRouter(paths, io));
  router.use('/visual-forge',  createVisualForgeRouter(paths, io));

  return { router, paths };
}

/**
 * À appeler une fois au démarrage du serveur, après création de `io`.
 * Crée les sous-dossiers et enregistre les handlers Socket.IO.
 */
export async function setupTroxt({ dataDir, io, aiProvider }) {
  const { router, paths } = createTroxtRouter({ dataDir, io, aiProvider });
  await ensureDirs(paths);
  if (io) registerTroxtSocketHandlers(io, paths);
  console.log('[troxt] backend initialized');
  console.log(`[troxt] data dir: ${dataDir}`);
  console.log(`[troxt] uploads:  ${paths.uploads}`);
  console.log(`[troxt] generated: ${paths.generated}`);
  return { router, paths };
}
