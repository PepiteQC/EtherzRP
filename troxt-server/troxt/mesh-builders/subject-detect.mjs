/**
 * subject-detect.mjs — détection du type de sujet depuis un buffer RGBA.
 *
 * Port Node-compatible de SubjectDetector côté client. Pas de DOM,
 * manipulation directe du buffer Uint8Array.
 */

const SKIN_MATCH = (r, g, b) =>
  r >= 95 && r <= 255 &&
  g >= 40 && g <= 220 &&
  b >= 20 && b <= 200 &&
  Math.abs(r - g) >= 15 &&
  Math.abs(r - g) <= 80 &&
  r > g && g > b;

const SKY_MATCH = (r, g, b) =>
  b > 130 && b > r && b > g && r < 220;

/**
 * @param {Uint8Array} rgba    buffer RGBA, length = w*h*4
 * @param {number}     width
 * @param {number}     height
 * @returns {{ type: string, confidence: number, skinRatio: number, skyRatio: number, edgeRatio: number, aspect: number, reason: string }}
 */
export function detectSubjectFromRGBA(rgba, width, height) {
  let skinPx = 0;
  let skyPx  = 0;
  let edgePx = 0;
  let sampled = 0;

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const idx = (y * width + x) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];

      if (SKIN_MATCH(r, g, b)) skinPx++;
      if (SKY_MATCH(r, g, b))  skyPx++;

      // Edge : différence luminance entre pixel et pixel droit + bas.
      const lum     = (r + g + b) / 3;
      const lumR    = y * width < height * width - width
        ? (rgba[idx + 4] + rgba[idx + 5] + rgba[idx + 6]) / 3
        : lum;
      const lumD    = (y + 1) < height
        ? (rgba[idx + width * 4] + rgba[idx + width * 4 + 1] + rgba[idx + width * 4 + 2]) / 3
        : lum;
      if (Math.abs(lum - lumR) + Math.abs(lum - lumD) > 60) edgePx++;

      sampled++;
    }
  }

  const skinRatio = skinPx / Math.max(1, sampled);
  const skyRatio  = skyPx  / Math.max(1, sampled);
  const edgeRatio = edgePx / Math.max(1, sampled);
  const aspect    = width / Math.max(1, height);

  if (skinRatio >= 0.15 && aspect < 1.2) {
    return { type: 'fullBody', confidence: 0.85, skinRatio, skyRatio, edgeRatio, aspect, reason: 'peau abondante + portrait vertical' };
  }
  if (skinRatio >= 0.05) {
    return { type: 'portrait', confidence: 0.80, skinRatio, skyRatio, edgeRatio, aspect, reason: 'tons peau détectés' };
  }
  if (skyRatio >= 0.30) {
    return { type: 'scene', confidence: 0.75, skinRatio, skyRatio, edgeRatio, aspect, reason: 'ciel dominant' };
  }
  if (edgeRatio >= 0.18 && aspect >= 0.9 && aspect <= 1.4) {
    return { type: 'building', confidence: 0.70, skinRatio, skyRatio, edgeRatio, aspect, reason: 'lignes droites denses' };
  }
  if (skinRatio < 0.02 && skyRatio < 0.30 && aspect >= 0.8) {
    return { type: 'product', confidence: 0.55, skinRatio, skyRatio, edgeRatio, aspect, reason: 'sujet centré sans peau ni ciel' };
  }
  return { type: 'object', confidence: 0.60, skinRatio, skyRatio, edgeRatio, aspect, reason: 'classification par défaut' };
}
