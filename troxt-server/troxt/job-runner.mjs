/**
 * job-runner.mjs — exécuteur de jobs Visual Forge côté serveur.
 *
 * Reçoit un job de la queue (dans visual-forge.mjs), exécute le pipeline :
 *   1. Charge l'image source (sharp → buffer RGBA)
 *   2. Détecte le sujet (subject-detect.mjs)
 *   3. Génère le mesh relief (relief-mesh.mjs)
 *   4. Inspecte la topologie (topology.mjs)
 *   5. Exporte en GLB (GLTFExporter de three)
 *   6. Écrit le fichier .glb + manifest
 *   7. Met à jour le statut du job
 *
 * Concurrence limitée via un sémaphore in-memory. Pas de dépendance
 * externe (pas de redis/bull) — suffit pour le dev local EtherWorld.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';

// Import dynamique de GLTFExporter (node-compatible via three/examples/jsm).
async function loadGltfExporter() {
  const mod = await import('three/examples/jsm/exporters/GLTFExporter.js');
  return new mod.GLTFExporter();
}

// Import dynamique de sharp (optionnel — si absent, on retourne un
// buffer RGBA "à la main" via lecture PNG basique).
async function loadSharp() {
  try { return (await import('sharp')).default; }
  catch { return null; }
}

import { buildReliefMeshFromRGBA } from './mesh-builders/relief-mesh.mjs';
import { detectSubjectFromRGBA } from './mesh-builders/subject-detect.mjs';
import { inspectTopology, repairTopology } from './mesh-builders/topology.mjs';
import {
  jobPatch,
  manifestPut,
} from './data-store.mjs';
import { generateId } from './data-store.mjs';

const MAX_CONCURRENCY = 1;
const activeJobs = new Set();

/**
 * Planifie l'exécution d'un job. Renvoie immédiatement, le job tourne
 * en arrière-plan.
 */
export function scheduleJob(paths, io, job, onLog = () => {}) {
  if (activeJobs.size >= MAX_CONCURRENCY) {
    // Pour l'instant FIFO simple : on attend qu'une place se libère.
    const interval = setInterval(() => {
      if (activeJobs.size < MAX_CONCURRENCY) {
        clearInterval(interval);
        void runJob(paths, io, job, onLog);
      }
    }, 100);
    return { scheduled: true, waiting: true };
  }
  void runJob(paths, io, job, onLog);
  return { scheduled: true, waiting: false };
}

/**
 * Exécute le job de bout en bout. En cas d'erreur, met à jour le job
 * avec status='FAILED'.
 */
export async function runJob(paths, io, job, onLog = console.log) {
  const jobId = job.id;
  activeJobs.add(jobId);

  try {
    onLog(`[troxt.runner] start ${jobId}`);
    await jobPatch(paths, jobId, { status: 'RUNNING', startedAt: Date.now() });
    emitProgress(io, jobId, 'ingest', 5);

    // ── 1. Chargement image source.
    const inputs = job.inputPaths;
    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new Error('Aucun fichier d\'entrée');
    }
    const firstImagePath = inputs[0];
    let rgba, width, height;

    const sharp = await loadSharp();
    if (sharp) {
      // Voie rapide : sharp → raw RGBA.
      const pipeline = sharp(firstImagePath).ensureAlpha();
      const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
      rgba   = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      width  = info.width;
      height = info.height;
    } else {
      // Fallback : si pas de sharp, on refuse (sharp est listé en peer).
      throw new Error(
        'sharp non disponible. Installe `npm install sharp` dans engine-lab.',
      );
    }

    emitProgress(io, jobId, 'recognize', 20);

    // ── 2. Détection sujet.
    const subject = detectSubjectFromRGBA(rgba, width, height);
    onLog(`[troxt.runner] ${jobId} subject=${subject.type} conf=${subject.confidence.toFixed(2)}`);

    emitProgress(io, jobId, 'plan', 40);

    // ── 3. Mode de reconstruction (très simple : relief par défaut).
    const mode = job.contract?.reconstructionMode ?? 'relief';
    if (mode !== 'relief') {
      onLog(`[troxt.runner] mode=${mode} non supporté côté serveur, fallback relief.`);
    }

    emitProgress(io, jobId, 'mesh', 55);

    // ── 4. Génération du mesh.
    const contract = job.contract ?? {};
    // Merge avec défauts minimaux.
    contract.quality      ??= 'standard';
    contract.subjectType  ??= subject.type;
    contract.detailLevel  ??= 70;
    contract.target       ??= { polygonBudget: 8000, textureResolution: 1024 };

    const relief = buildReliefMeshFromRGBA({ rgba, width, height, contract });

    emitProgress(io, jobId, 'topology', 70);

    // ── 5. Topologie.
    repairTopology(relief.geometry);
    const topology = inspectTopology(relief.geometry);

    emitProgress(io, jobId, 'export', 82);

    // ── 6. Export GLB.
    const GLTFExporter = await loadGltfExporter();
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(relief.geometry, relief.material));

    const glbBuffer = await new Promise((resolve, reject) => {
      GLTFExporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(Buffer.from(result));
          } else {
            reject(new Error('GLTFExporter a renvoyé du JSON au lieu de ArrayBuffer'));
          }
        },
        (err) => reject(new Error(`GLTF parse failed: ${String(err?.message ?? err)}`)),
        { binary: true, embedImages: true, onlyVisible: true },
      );
    });

    const filename = job.outputFilename ?? `model_${Date.now()}.glb`;
    const safeName = filename.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const glbPath  = path.join(paths.generated, safeName);
    await fs.writeFile(glbPath, glbBuffer);

    emitProgress(io, jobId, 'manifest', 92);

    // ── 7. Construction du manifest.
    const manifestId = job.manifestId ?? generateId('asset');
    const manifest = {
      id: manifestId,
      filename: safeName,
      status: 'PREVIEW_READY',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      source: {
        type: 'photo',
        imageCount: inputs.length,
        images: inputs,
      },
      reconstruction: {
        mode: 'relief',
        subject: subject.type,
        notes: [
          `Sujet détecté: ${subject.type} (confiance ${subject.confidence.toFixed(2)})`,
          `Image: ${width}×${height}, ${rgba.length} bytes RGBA`,
          `Open edges: ${topology.openEdges} (silhouette)`,
        ],
      },
      geometry: {
        triangles: topology.totalTriangles,
        vertices:  topology.totalVertices,
        openEdges: topology.openEdges,
        lodCount:  1,
        hasRig:    false,
        hasCollider: false,
        bboxMin: topology.bbox.min,
        bboxMax: topology.bbox.max,
      },
      textures: {
        resolution: contract.target.textureResolution ?? 1024,
        materialCount: 1,
        totalPixels: width * height,
        formats: [],
      },
      game: {
        collider: 'cuboid',
        category: job.gameCategory ?? 'misc',
        defaultScale: 1,
        tags: [subject.type],
      },
      confidence: {
        shape: subject.confidence,
        materials: 0.5,
        textures: 0.7,
        overall: subject.confidence * 0.7 + 0.2,
      },
      history: [
        { at: Date.now(), from: 'GENERATED', to: 'PREVIEW_READY', actor: 'job-runner', note: `job ${jobId}` },
      ],
    };

    await manifestPut(paths, manifest);

    emitProgress(io, jobId, 'done', 100);

    // ── 8. Update job final.
    await jobPatch(paths, jobId, {
      status: 'DONE',
      finishedAt: Date.now(),
      manifestId,
      outputFilename: safeName,
      glbSizeBytes: glbBuffer.length,
      result: {
        manifestId,
        filename: safeName,
        sizeBytes: glbBuffer.length,
        triangles: topology.totalTriangles,
        openEdges: topology.openEdges,
        subject: subject.type,
      },
    });

    // ── 9. Socket.IO notify.
    if (io) {
      io.emit('troxt:job:done', {
        jobId,
        manifestId,
        glbFilename: safeName,
        sizeBytes: glbBuffer.length,
      });
      io.emit('troxt:manifest:updated', {
        id: manifestId,
        status: 'PREVIEW_READY',
      });
    }

    onLog(`[troxt.runner] done ${jobId} → ${safeName} (${glbBuffer.length} bytes)`);
    return { manifestId, filename: safeName, sizeBytes: glbBuffer.length };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onLog(`[troxt.runner] FAILED ${jobId}: ${msg}`);
    await jobPatch(paths, jobId, {
      status: 'FAILED',
      finishedAt: Date.now(),
      error: msg,
    }).catch(() => {});
    if (io) {
      io.emit('troxt:job:failed', { jobId, error: msg });
    }
    throw err;
  } finally {
    activeJobs.delete(jobId);
  }
}

function emitProgress(io, jobId, stage, pct) {
  if (io) io.emit('troxt:job:progress', { jobId, stage, pct });
}
