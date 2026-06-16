/**
 * storage.mjs — endpoints storage TROXT.
 *
 * Deux endpoints :
 *   - POST /upload (multipart/form-data, champ "file")
 *   - DELETE /:id
 *
 * Le fichier est stocké dans `paths.uploads/`. On ne purge jamais
 * automatiquement (l'utilisateur décide via DELETE).
 *
 * Parser multipart : on utilise busboy (peer dep). Si absent, on retourne
 * une erreur claire.
 */

import express from 'express';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { generateId, safeFilename } from './data-store.mjs';

let busboy;
async function loadBusboy() {
  if (busboy !== undefined) return busboy;
  try {
    const mod = await import('busboy');
    busboy = mod.default ?? mod;
    return busboy;
  } catch {
    busboy = null;
    return null;
  }
}

/**
 * Parse un multipart en streaming sans dépendre de multer.
 * Retourne { fields, files: [{ fieldName, filename, mime, size, tempPath }] }
 */
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers, limits: { fileSize: 50 * 1024 * 1024 } });
    const fields = {};
    const files = [];

    bb.on('field', (name, value) => { fields[name] = value; });
    bb.on('file', (fieldName, fileStream, info) => {
      const { filename, mimeType } = info;
      const safeName = safeFilename(filename ?? 'upload.bin');
      const id = generateId('file');
      const tempPath = path.join(paths.uploads, `${id}__${safeName}`);

      const writeStream = fs.createWriteStream(tempPath);
      let size = 0;
      fileStream.on('data', (chunk) => { size += chunk.length; });
      fileStream.on('limit', () => {
        writeStream.destroy();
        fsp.unlink(tempPath).catch(() => {});
        reject(new Error('Fichier trop volumineux (max 50 MB)'));
      });
      fileStream.pipe(writeStream);
      writeStream.on('finish', () => {
        files.push({ fieldName, id, filename: safeName, mime: mimeType, size, tempPath });
      });
      writeStream.on('error', reject);
    });
    bb.on('error', reject);
    bb.on('close', () => resolve({ fields, files }));
    req.pipe(bb);
  });
}

// Variable globale pour `paths` (cf. signature de parseMultipart).
let paths;

export function createStorageRouter(_paths) {
  paths = _paths;
  const router = express.Router();

  router.post('/upload', async (req, res) => {
    const bb = await loadBusboy();
    if (!bb) {
      return res.status(500).json({
        ok: false,
        error: 'busboy non installé. `npm install busboy` dans engine-lab.',
      });
    }
    try {
      const { files } = await parseMultipart(req);
      if (files.length === 0) {
        return res.status(400).json({ ok: false, error: 'Aucun fichier reçu (champ "file")' });
      }
      const f = files[0];
      const finalId = f.id;
      const finalPath = path.join(paths.uploads, `${finalId}__${f.filename}`);
      // Le fichier est déjà écrit à tempPath = `${id}__${filename}`. On confirme.
      return res.json({
        ok: true,
        data: {
          id:         finalId,
          filename:   f.filename,
          mime:       f.mime,
          size:       f.size,
          url:        `/api/troxt/storage/file/${finalId}`,
          uploadedAt: Date.now(),
        },
      });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  });

  router.get('/file/:id', async (req, res) => {
    const id = req.params.id;
    try {
      const entries = await fsp.readdir(paths.uploads);
      const match = entries.find((e) => e.startsWith(`${id}__`));
      if (!match) return res.status(404).json({ ok: false, error: 'introuvable' });
      const filePath = path.join(paths.uploads, match);
      const stat = await fsp.stat(filePath);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Type', guessMime(match));
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    try {
      const entries = await fsp.readdir(paths.uploads);
      const matches = entries.filter((e) => e.startsWith(`${id}__`));
      if (matches.length === 0) {
        return res.status(404).json({ ok: false, error: 'introuvable' });
      }
      for (const m of matches) {
        await fsp.unlink(path.join(paths.uploads, m));
      }
      return res.json({ ok: true, data: { deleted: matches.length } });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Endpoint pour les placeholders AI stub (renvoie une image 1×1 PNG).
  router.get('/placeholder/:name.png', async (req, res) => {
    const label = decodeURIComponent(req.params.name).slice(0, 64);
    const png = makePlaceholderPng(label);
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  });

  return router;
}

function guessMime(filename) {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',  webp: 'image/webp',
    gif: 'image/gif',  bmp: 'image/bmp',
    glb: 'model/gltf-binary',
    obj: 'text/plain',
    json: 'application/json',
  };
  return map[ext] ?? 'application/octet-stream';
}

/**
 * Génère un PNG 256×256 avec le label centré (pour les placeholders AI).
 * Sans dépendance externe : on encode à la main un PNG minimal.
 */
function makePlaceholderPng(label) {
  // PNG signature + IHDR + IDAT (zlib d'un bitmap 256×256 RGB uniforme)
  // + IEND. Pour rester simple : bitmap uniforme gris foncé.
  const W = 256, H = 256;
  const r = 32, g = 32, b = 48;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter type none
    for (let x = 0; x < W; x++) {
      const o = y * (1 + W * 3) + 1 + x * 3;
      raw[o]     = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const zlib = require('node:zlib');
  const compressed = zlib.deflateSync(raw);
  const crc32 = require('node:zlib').crc32 ?? null;
  // CRC32 simple via table si pas dispo.
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable.push(c >>> 0);
  }
  function crc32fn(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = (crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)) >>> 0;
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),       // signature
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return png;

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcInput = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32fn(crcInput), 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
}
