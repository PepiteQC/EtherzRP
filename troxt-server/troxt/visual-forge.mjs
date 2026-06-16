/**
 * visual-forge.mjs — endpoints jobs Visual Forge TROXT.
 *
 * - POST   /jobs                  : crée un job + le planifie
 * - GET    /jobs                  : liste tous les jobs
 * - GET    /jobs/:id              : status détaillé d'un job
 * - POST   /jobs/:id/approve      : transition USER_APPROVED
 * - POST   /jobs/:id/reject       : transition REJECTED
 * - GET    /jobs/:id/manifest     : manifeste lié au job
 * - GET    /jobs/:id/download     : download du .glb produit
 */

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  jobGet,
  jobPut,
  jobList,
  manifestGet,
  generateId,
} from './data-store.mjs';
import { scheduleJob } from './job-runner.mjs';

const VALID_STATUSES = [
  'GENERATED', 'VALIDATING', 'PREVIEW_READY', 'USER_APPROVED',
  'QUARANTINE', 'GAME_TESTED', 'ACTIVE', 'REJECTED',
];

export function createVisualForgeRouter(paths, io) {
  const router = express.Router();
  router.use(express.json({ limit: '5mb' }));

  // ── Submit job
  router.post('/jobs', async (req, res) => {
    try {
      const { contract, inputPaths, outputFilename, manifestId, gameCategory } = req.body ?? {};
      if (!contract || typeof contract !== 'object') {
        return res.status(400).json({ ok: false, error: 'contract requis (objet)' });
      }
      if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
        return res.status(400).json({ ok: false, error: 'inputPaths (tableau non vide) requis' });
      }

      const jobId = generateId('job');
      const job = {
        id: jobId,
        status: 'PENDING',
        createdAt: Date.now(),
        contract,
        inputPaths,
        outputFilename,
        manifestId: manifestId ?? generateId('asset'),
        gameCategory: gameCategory ?? 'misc',
      };
      await jobPut(paths, job);

      // Planifier l'exécution (asynchrone, ne bloque pas la réponse).
      scheduleJob(paths, io, job, console.log);

      if (io) io.emit('troxt:job:created', { jobId, status: 'PENDING' });

      res.status(202).json({ ok: true, data: { jobId, status: 'PENDING' } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Liste jobs
  router.get('/jobs', async (_req, res) => {
    try {
      const list = await jobList(paths);
      res.json({ ok: true, data: list });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Status job
  router.get('/jobs/:id', async (req, res) => {
    try {
      const job = await jobGet(paths, req.params.id);
      if (!job) return res.status(404).json({ ok: false, error: 'job introuvable' });
      res.json({ ok: true, data: {
        jobId:    job.id,
        status:   job.status,
        progress: computeProgress(job),
        manifestId: job.manifestId ?? null,
        error:    job.error ?? null,
        result:   job.result ?? null,
        createdAt: job.createdAt,
        startedAt: job.startedAt ?? null,
        finishedAt: job.finishedAt ?? null,
      }});
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Approve
  router.post('/jobs/:id/approve', async (req, res) => {
    try {
      const job = await jobGet(paths, req.params.id);
      if (!job) return res.status(404).json({ ok: false, error: 'job introuvable' });
      if (job.status !== 'DONE') {
        return res.status(400).json({ ok: false, error: `job status=${job.status}, approve requiert DONE` });
      }

      // Update job.
      job.status = 'APPROVED';
      job.approvedAt = Date.now();
      await jobPut(paths, job);

      // Update manifest associé.
      if (job.manifestId) {
        const m = await manifestGet(paths, job.manifestId);
        if (m) {
          m.status = 'USER_APPROVED';
          m.history.push({ at: Date.now(), from: 'PREVIEW_READY', to: 'USER_APPROVED', actor: 'api', note: `job ${job.id}` });
          m.updatedAt = Date.now();
          m.version = (m.version ?? 0) + 1;
          await jobPut(paths, job); // no-op (idem)
          // Note : manifestPut importe un module, on l'appelle directement :
          const { manifestPut } = await import('./data-store.mjs');
          await manifestPut(paths, m);
          if (io) io.emit('troxt:manifest:updated', { id: m.id, status: 'USER_APPROVED' });
        }
      }

      if (io) io.emit('troxt:job:approved', { jobId: job.id });
      res.json({ ok: true, data: { jobId: job.id, status: 'APPROVED' } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Reject
  router.post('/jobs/:id/reject', async (req, res) => {
    try {
      const { reason } = req.body ?? {};
      const job = await jobGet(paths, req.params.id);
      if (!job) return res.status(404).json({ ok: false, error: 'job introuvable' });

      job.status = 'REJECTED';
      job.rejectedAt = Date.now();
      job.rejectReason = reason ?? 'no reason given';
      await jobPut(paths, job);

      if (job.manifestId) {
        const m = await manifestGet(paths, job.manifestId);
        if (m) {
          m.status = 'REJECTED';
          m.history.push({ at: Date.now(), from: m.status, to: 'REJECTED', actor: 'api', note: reason ?? 'rejected' });
          const { manifestPut } = await import('./data-store.mjs');
          await manifestPut(paths, m);
          if (io) io.emit('troxt:manifest:updated', { id: m.id, status: 'REJECTED' });
        }
      }

      if (io) io.emit('troxt:job:rejected', { jobId: job.id, reason: reason ?? null });
      res.json({ ok: true, data: { jobId: job.id, status: 'REJECTED' } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Manifest lié
  router.get('/jobs/:id/manifest', async (req, res) => {
    try {
      const job = await jobGet(paths, req.params.id);
      if (!job || !job.manifestId) {
        return res.status(404).json({ ok: false, error: 'manifest introuvable pour ce job' });
      }
      const m = await manifestGet(paths, job.manifestId);
      if (!m) return res.status(404).json({ ok: false, error: 'manifest introuvable' });
      res.json({ ok: true, data: m });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ── Download GLB
  router.get('/jobs/:id/download', async (req, res) => {
    try {
      const job = await jobGet(paths, req.params.id);
      if (!job || !job.outputFilename) {
        return res.status(404).json({ ok: false, error: 'GLB non disponible' });
      }
      const filePath = path.join(paths.generated, job.outputFilename);
      const stat = await fs.promises.stat(filePath);
      res.setHeader('Content-Type', 'model/gltf-binary');
      res.setHeader('Content-Disposition', `attachment; filename="${job.outputFilename}"`);
      res.setHeader('Content-Length', stat.size);
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
}

/**
 * Mappe le status du job sur un pourcentage 0-100 (pour l'UI).
 */
function computeProgress(job) {
  switch (job.status) {
    case 'PENDING':  return 0;
    case 'RUNNING':  return 50;
    case 'DONE':     return 100;
    case 'FAILED':   return 100;
    case 'APPROVED': return 100;
    case 'REJECTED': return 100;
    default:         return 0;
  }
}
