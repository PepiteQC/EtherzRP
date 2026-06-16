/**
 * ai.mjs — endpoints AI de TROXT.
 *
 * Trois endpoints :
 *   - POST /generate-image : génération d'image (placeholder par défaut)
 *   - POST /remove-background : suppression de fond
 *   - POST /depth : estimation profondeur
 *
 * ⚠️ Ces endpoints sont volontairement **stubbés** par défaut.
 * Pour brancher un vrai modèle local (ONNX, llama.cpp, ComfyUI local…),
 * remplace le corps des fonctions en gardant la même signature.
 *
 * Convention : tous les endpoints acceptent un body JSON avec soit
 *   `{ prompt: string, ... }`   (texte seul)
 *   `{ image: dataURL | URL }`  (image de référence)
 * et renvoient
 *   `{ urls: string[], metadata?: {...} }`  pour generate-image
 *   `{ url: string }`                        pour remove-background / depth
 */

import express from 'express';
import { generateId } from './data-store.mjs';

export function createAiRouter(paths, opts = {}) {
  const router = express.Router();
  router.use(express.json({ limit: '20mb' }));

  /**
   * POST /generate-image
   * Body: { prompt: string, image?: string, n?: number, size?: string }
   * Returns: { urls: string[], metadata?: any }
   */
  router.post('/generate-image', async (req, res) => {
    const { prompt, image, n = 1, size = '1024x1024' } = req.body ?? {};
    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'prompt requis' });
    }

    if (opts.aiProvider === 'stub') {
      // Stub : on log et on renvoie un placeholder.
      console.log(`[troxt.ai] generate-image stub: "${prompt.slice(0, 80)}…"`);
      const placeholderUrl = `/api/troxt/storage/placeholder/${encodeURIComponent(prompt.slice(0, 32))}.png`;
      return res.json({
        ok: true,
        data: {
          urls: Array.from({ length: n }, () => placeholderUrl),
          metadata: { stub: true, size, note: 'AI non configuré — branche ton modèle dans ai.mjs' },
        },
      });
    }

    // Provider custom : déléguer à opts.aiProvider.generateImage().
    try {
      const urls = await opts.aiProvider.generateImage({ prompt, image, n, size });
      return res.json({ ok: true, data: { urls, metadata: { provider: opts.aiProvider.name } } });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  /**
   * POST /remove-background
   * Body: { image: dataURL | URL }
   * Returns: { url: string }
   */
  router.post('/remove-background', async (req, res) => {
    const { image } = req.body ?? {};
    if (!image) {
      return res.status(400).json({ ok: false, error: 'image requise' });
    }
    console.log('[troxt.ai] remove-background stub (image length=' + image.length + ')');
    return res.json({
      ok: true,
      data: { url: image, metadata: { stub: true } },
    });
  });

  /**
   * POST /depth
   * Body: { image: dataURL | URL }
   * Returns: { depthMapUrl: string }
   */
  router.post('/depth', async (req, res) => {
    const { image } = req.body ?? {};
    if (!image) {
      return res.status(400).json({ ok: false, error: 'image requise' });
    }
    console.log('[troxt.ai] depth stub');
    return res.json({
      ok: true,
      data: { depthMapUrl: image, metadata: { stub: true } },
    });
  });

  return router;
}
