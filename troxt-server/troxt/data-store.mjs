/**
 * data-store.mjs — couche de persistance TROXT.
 *
 * Responsabilités :
 *   1. Écriture atomique (write to .tmp + rename) pour tous les JSON.
 *   2. KV store : `data/kv.local.json` (objet clé → valeur).
 *   3. Manifests : `data/manifests/{id}.json` (un fichier par manifest).
 *   4. Jobs : `data/jobs/{id}.json` (un fichier par job).
 *
 * Toutes les opérations sont synchrones-async (fs/promises) et lock-safe
 * via un mutex par fichier (sérialisation des écritures concurrentes).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Calcule les chemins de stockage TROXT à partir du répertoire data/.
 */
export function makePaths(dataDir) {
  return {
    dataDir,
    kv:         path.join(dataDir, 'kv.local.json'),
    manifests:  path.join(dataDir, 'manifests'),
    jobs:       path.join(dataDir, 'jobs'),
    uploads:    path.join(dataDir, 'uploads'),
    generated:  path.join(dataDir, 'generated'),
  };
}

/**
 * Crée tous les sous-dossiers nécessaires. Idempotent.
 */
export async function ensureDirs(paths) {
  await fs.mkdir(paths.manifests, { recursive: true });
  await fs.mkdir(paths.jobs,      { recursive: true });
  await fs.mkdir(paths.uploads,   { recursive: true });
  await fs.mkdir(paths.generated, { recursive: true });
}

/**
 * Mutex léger par fichier : sérialise les écritures concurrentes sur la
 * même clé. Évite les corruptions si deux requêtes PUT arrivent en
 * parallèle sur la même clé KV.
 */
const writeLocks = new Map();
async function withWriteLock(key, fn) {
  const prev = writeLocks.get(key) ?? Promise.resolve();
  let release;
  const next = new Promise((resolve) => { release = resolve; });
  writeLocks.set(key, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (writeLocks.get(key) === next) writeLocks.delete(key);
  }
}

/**
 * Lecture JSON safe : retourne `fallback` si le fichier n'existe pas ou
 * est corrompu. NE JETTE PAS.
 */
export async function readJsonSafe(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === 'ENOENT') return structuredClone(fallback);
    console.warn(`[troxt.data-store] lecture ${filePath} échouée:`, err);
    return structuredClone(fallback);
  }
}

/**
 * Écriture atomique : écrit dans `${filePath}.tmp`, puis rename.
 * Garantit qu'on ne lit jamais un fichier à moitié écrit.
 */
export async function writeJsonAtomic(filePath, data) {
  await withWriteLock(filePath, async () => {
    const tmp = `${filePath}.tmp`;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, filePath);
  });
}

// ════════════════════════════════════════════════════════════════════
// KV STORE
// ════════════════════════════════════════════════════════════════════

const KV_LOCK_KEY = '__kv__';

export async function kvGet(paths, key) {
  const all = await readJsonSafe(paths.kv, {});
  return key in all ? all[key] : null;
}

export async function kvSet(paths, key, value) {
  await withWriteLock(KV_LOCK_KEY, async () => {
    const all = await readJsonSafe(paths.kv, {});
    all[key] = value;
    all[`${key}:updatedAt`] = Date.now();
    await writeJsonAtomic(paths.kv, all);
  });
}

export async function kvDelete(paths, key) {
  await withWriteLock(KV_LOCK_KEY, async () => {
    const all = await readJsonSafe(paths.kv, {});
    delete all[key];
    delete all[`${key}:updatedAt`];
    await writeJsonAtomic(paths.kv, all);
  });
}

export async function kvList(paths, prefix = '') {
  const all = await readJsonSafe(paths.kv, {});
  return Object.keys(all)
    .filter((k) => !k.endsWith(':updatedAt'))
    .filter((k) => k.startsWith(prefix))
    .map((k) => ({ key: k, value: all[k], updatedAt: all[`${k}:updatedAt`] ?? null }));
}

// ════════════════════════════════════════════════════════════════════
// MANIFESTS
// ════════════════════════════════════════════════════════════════════

export async function manifestGet(paths, id) {
  const file = path.join(paths.manifests, `${safeId(id)}.json`);
  return await readJsonSafe(file, null);
}

export async function manifestPut(paths, manifest) {
  if (!manifest.id) throw new Error('manifest.id requis');
  const file = path.join(paths.manifests, `${safeId(manifest.id)}.json`);
  manifest.updatedAt = Date.now();
  manifest.version  = (manifest.version ?? 0) + 1;
  await writeJsonAtomic(file, manifest);
  return manifest;
}

export async function manifestDelete(paths, id) {
  const file = path.join(paths.manifests, `${safeId(id)}.json`);
  try { await fs.unlink(file); return true; }
  catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

export async function manifestList(paths) {
  try {
    const files = await fs.readdir(paths.manifests);
    const out = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const m = await readJsonSafe(path.join(paths.manifests, f), null);
      if (m) out.push(m);
    }
    return out;
  } catch { return []; }
}

// ════════════════════════════════════════════════════════════════════
// JOBS
// ════════════════════════════════════════════════════════════════════

export async function jobGet(paths, id) {
  const file = path.join(paths.jobs, `${safeId(id)}.json`);
  return await readJsonSafe(file, null);
}

export async function jobPut(paths, job) {
  if (!job.id) throw new Error('job.id requis');
  const file = path.join(paths.jobs, `${safeId(job.id)}.json`);
  await writeJsonAtomic(file, job);
  return job;
}

export async function jobPatch(paths, id, patch) {
  const cur = await jobGet(paths, id);
  if (!cur) throw new Error(`job ${id} introuvable`);
  const next = { ...cur, ...patch, updatedAt: Date.now() };
  await jobPut(paths, next);
  return next;
}

export async function jobDelete(paths, id) {
  const file = path.join(paths.jobs, `${safeId(id)}.json`);
  try { await fs.unlink(file); return true; }
  catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

export async function jobList(paths) {
  try {
    const files = await fs.readdir(paths.jobs);
    const out = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const j = await readJsonSafe(path.join(paths.jobs, f), null);
      if (j) out.push(j);
    }
    // Tri : du plus récent au plus ancien.
    out.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return out;
  } catch { return []; }
}

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

/**
 * Nettoie un ID pour qu'il soit utilisable comme nom de fichier.
 */
export function safeId(id) {
  return String(id ?? '').replace(/[^a-zA-Z0-9_\-:.]/g, '_').slice(0, 200);
}

/**
 * Génère un ID unique (job, asset, upload).
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Sanitize un nom de fichier pour éviter path traversal.
 */
export function safeFilename(name) {
  return String(name ?? 'file')
    .replace(/[/\\]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/[^a-zA-Z0-9_\-.]/g, '_')
    .slice(0, 200);
}
