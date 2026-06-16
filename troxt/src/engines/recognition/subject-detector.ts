/**
 * SubjectDetector — détermine le type de sujet présent dans une image.
 *
 * Utilisable côté client sans TF.js : on se base sur la distribution des
 * pixels (tons peau, ciel, edge density, ratio d'aspect). C'est une première
 * passe ; VisualRecognitionEngine peut ensuite raffiner avec pose / seg.
 */

import type { SubjectType } from '@contracts/SubjectType';

export interface SubjectDetection {
  type:       SubjectType;
  confidence: number;        // 0..1
  skinRatio:  number;
  skyRatio:   number;
  edgeRatio:  number;
  aspect:     number;
  reason:     string;
}

export interface DetectionThresholds {
  skinPortrait:     number;  // 0.05 par défaut
  skyScene:         number;  // 0.30
  edgeBuilding:     number;  // 0.18
  skinFullBody:     number;  // 0.15
  productCentered:  number;  // 0.02 (peu de peau + peu de ciel)
}

export const DEFAULT_THRESHOLDS: DetectionThresholds = {
  skinPortrait:     0.05,
  skyScene:         0.30,
  edgeBuilding:     0.18,
  skinFullBody:     0.15,
  productCentered:  0.02,
};

/**
 * Heuristique : un pixel est "peau" si ses composantes RGB correspondent
 * à un teint moyen. C'est grossier mais rapide.
 */
function isSkin(r: number, g: number, b: number): boolean {
  return (
    r >= 95 && r <= 255 &&
    g >= 40 && g <= 220 &&
    b >= 20 && b <= 200 &&
    Math.abs(r - g) >= 15 &&
    Math.abs(r - g) <= 80 &&
    r > g && g > b
  );
}

function isSky(r: number, g: number, b: number): boolean {
  return b > 130 && b > r && b > g && r < 220;
}

/**
 * Détecte les contours via un gradient Sobel simplifié (3×3).
 */
function edgeScore(data: Uint8ClampedArray, w: number, h: number, idx: number): number {
  const lum = (i: number) =>
    (data[i] + data[i + 1] + data[i + 2]) / 3;
  const center = lum(idx);
  const right  = lum(idx + 4);
  const bottom = lum(idx + w * 4);
  return Math.abs(center - right) + Math.abs(center - bottom);
}

export function detectSubject(
  imageData: ImageData,
  thresholds: DetectionThresholds = DEFAULT_THRESHOLDS,
): SubjectDetection {
  const { data, width, height } = imageData;
  const total = width * height;

  let skinPx = 0;
  let skyPx  = 0;
  let edgePx = 0;
  let sampled = 0;

  // On échantillonne 1 pixel sur 8 pour rester rapide (CPU friendly).
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (isSkin(r, g, b)) skinPx++;
      if (isSky(r, g, b))  skyPx++;
      if (edgeScore(data, width, height, idx) > 60) edgePx++;
      sampled++;
    }
  }

  const skinRatio = skinPx / Math.max(1, sampled);
  const skyRatio  = skyPx  / Math.max(1, sampled);
  const edgeRatio = edgePx / Math.max(1, sampled);
  const aspect    = width / Math.max(1, height);

  // Décision.
  if (skinRatio >= thresholds.skinFullBody && aspect < 1.2) {
    return {
      type: 'fullBody', confidence: 0.85,
      skinRatio, skyRatio, edgeRatio, aspect,
      reason: 'peau abondante + portrait vertical',
    };
  }
  if (skinRatio >= thresholds.skinPortrait) {
    return {
      type: 'portrait', confidence: 0.80,
      skinRatio, skyRatio, edgeRatio, aspect,
      reason: 'tons peau détectés',
    };
  }
  if (skyRatio >= thresholds.skyScene) {
    return {
      type: 'scene', confidence: 0.75,
      skinRatio, skyRatio, edgeRatio, aspect,
      reason: 'ciel dominant',
    };
  }
  if (edgeRatio >= thresholds.edgeBuilding && aspect >= 0.9 && aspect <= 1.4) {
    return {
      type: 'building', confidence: 0.70,
      skinRatio, skyRatio, edgeRatio, aspect,
      reason: 'lignes droites denses (architecture probable)',
    };
  }
  if (skinRatio < thresholds.productCentered && skyRatio < thresholds.skyScene && aspect >= 0.8) {
    return {
      type: 'product', confidence: 0.55,
      skinRatio, skyRatio, edgeRatio, aspect,
      reason: 'peu de peau/peu de ciel, sujet centré',
    };
  }
  return {
    type: 'object', confidence: 0.60,
    skinRatio, skyRatio, edgeRatio, aspect,
    reason: 'classification par défaut',
  };
}
