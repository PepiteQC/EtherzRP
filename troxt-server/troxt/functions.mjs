/**
 * functions.mjs — dispatcher de fonctions TROXT.
 *
 * Endpoint unique :
 *   POST /:name   → invoque une fonction serveur par son nom
 *
 * Fonctions intégrées :
 *   - echo         : renvoie input tel quel (test round-trip)
 *   - health       : état du serveur
 *   - ping         : timestamp serveur
 *   - validate-manifest : valide un manifest contre un contrat
 *
 * Tu peux enregistrer tes propres fonctions via register().
 */

import express from 'express';

const registry = new Map();

export function register(name, handler) {
  registry.set(name, handler);
}

export function createFunctionsRouter(paths) {
  const router = express.Router();
  router.use(express.json({ limit: '5mb' }));

  // Built-ins.
  register('echo', async (input) => input);
  register('ping', async () => ({ pong: true, at: Date.now() }));
  register('health', async () => ({
    ok: true,
    at: Date.now(),
    uptime: process.uptime(),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    jobRunnerActive: true,
  }));
  register('list', async () => [...registry.keys()]);

  router.post('/:name', async (req, res) => {
    const name = req.params.name;
    const handler = registry.get(name);
    if (!handler) {
      return res.status(404).json({ ok: false, error: `fonction "${name}" inconnue` });
    }
    try {
      const input  = req.body ?? {};
      const output = await handler(input, { paths, req, res });
      res.json({ ok: true, data: output });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
}
