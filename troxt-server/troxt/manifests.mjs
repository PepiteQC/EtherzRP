/**
 * manifests.mjs — endpoints asset manifests TROXT.
 *
 * - PUT    /:id   upsert (merge du nouveau manifest)
 * - GET    /:id   lecture
 * - DELETE /:id   suppression
 * - GET    /       liste
 */

import express from 'express';
import {
  manifestGet,
  manifestPut,
  manifestDelete,
  manifestList,
} from './data-store.mjs';

export function createManifestsRouter(paths, io) {
  const router = express.Router();
  router.use(express.json({ limit: '2mb' }));

  router.get('/', async (_req, res) => {
    try {
      const list = await manifestList(paths);
      res.json({ ok: true, data: list });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const m = await manifestGet(paths, req.params.id);
      if (!m) return res.status(404).json({ ok: false, error: 'introuvable' });
      res.json({ ok: true, data: m });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const incoming = req.body ?? {};
      if (!incoming.id) incoming.id = req.params.id;
      if (incoming.id !== req.params.id) {
        return res.status(400).json({ ok: false, error: 'id mismatch' });
      }
      if (!incoming.filename) {
        return res.status(400).json({ ok: false, error: 'filename requis' });
      }
      const merged = await manifestPut(paths, incoming);
      if (io) io.emit('troxt:manifest:updated', { id: merged.id, status: merged.status });
      res.json({ ok: true, data: merged });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const ok = await manifestDelete(paths, req.params.id);
      res.json({ ok: true, data: { deleted: ok } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
}
