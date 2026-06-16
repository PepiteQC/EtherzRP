/**
 * socket-events.mjs — pont Socket.IO pour TROXT.
 *
 * Côté serveur : on expose un helper pour broadcaster les events TROXT
 * (les routes le reçoivent via `io`). Côté client : on liste les events
 * que le front doit écouter.
 *
 * Events émis par le serveur :
 *   - troxt:job:created      { jobId, status }
 *   - troxt:job:progress     { jobId, stage, pct, note? }
 *   - troxt:job:done         { jobId, manifestId, glbFilename, sizeBytes }
 *   - troxt:job:failed       { jobId, error }
 *   - troxt:job:approved     { jobId }
 *   - troxt:job:rejected     { jobId, reason }
 *   - troxt:manifest:updated { id, status }
 *
 * Events que le client peut émettre :
 *   - troxt:subscribe { jobId }   → serveur commence à émettre les updates
 *   - troxt:unsubscribe { jobId }
 *
 * Côté serveur, on n'a PAS besoin d'un join/leave par job : on émet
 * en global et le client filtre par jobId. Plus simple.
 */

import { jobGet } from './data-store.mjs';

/**
 * À appeler une fois dans index.mjs après création de `io`.
 * Enregistre les handlers `socket.on('troxt:...')`.
 */
export function registerTroxtSocketHandlers(io, paths) {
  io.on('connection', (socket) => {
    console.log(`[troxt.socket] client connected: ${socket.id}`);

    // Subscribe à un job : renvoie l'état courant immédiatement.
    socket.on('troxt:subscribe', async ({ jobId } = {}) => {
      if (!jobId) return;
      const job = await jobGet(paths, jobId);
      if (job) {
        socket.emit('troxt:job:state', { jobId, status: job.status, job });
      }
    });

    socket.on('troxt:unsubscribe', ({ jobId } = {}) => {
      // Rien à faire côté serveur (pas de room par job).
      void jobId;
    });

    socket.on('disconnect', () => {
      console.log(`[troxt.socket] client disconnected: ${socket.id}`);
    });
  });
}
