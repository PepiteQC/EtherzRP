/**
 * data.mjs — endpoints KV TROXT.
 *
 * Trois endpoints :
 *   - GET    /:key   → lit une clé (retourne la valeur sérialisée JSON ou null)
 *   - PUT    /:key   → écrit une clé (body = { value: any })
 *   - DELETE /:key   → supprime une clé
 *
 * Stockage : `paths.kv` (un seul fichier JSON).
 */

import express from 'express';
import { kvGet, kvSet, kvDelete, kvList } from './data-store.mjs';

export function createDataRouter(paths) {
  const router = express.Router();
  router.use(express.json({ limit: '5mb' }));

  router.get('/', async (_req, res) => {
    try {
      const list = await kvList(paths, '');
      res.json({ ok: true, data: list });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get('/:key', async (req, res) => {
    try {
      const value = await kvGet(paths, req.params.key);
      if (value === null) {
        return res.status(404).json({ ok: false, error: 'clé introuvable' });
      }
      res.json({ ok: true, data: { key: req.params.key, value } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.put('/:key', async (req, res) => {
    try {
      const { value } = req.body ?? {};
      if (value === undefined) {
        return res.status(400).json({ ok: false, error: 'body.value requis' });
      }
      await kvSet(paths, req.params.key, value);
      res.json({ ok: true, data: { key: req.params.key, value } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.delete('/:key', async (req, res) => {
    try {
      await kvDelete(paths, req.params.key);
      res.json({ ok: true, data: { key: req.params.key, deleted: true } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
}
