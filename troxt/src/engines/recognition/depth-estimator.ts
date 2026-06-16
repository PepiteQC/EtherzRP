/**
 * DepthEstimator — produit une carte de profondeur (Float32Array normalisée 0..1).
 *
 * Deux stratégies, en fonction de la disponibilité de TF.js :
 *
 *   1. estimateFromBrightness : pur CPU, basé sur la luminance + un flou
 *      gaussien léger. Rapide, qualité médiocre. Pour relief 2.5D.
 *
 *   2. estimateWithModel : appelle le backend TROXT (modèle MiDaS ou
 *      depth-anything). Retourne l'URL d'une depthMap persistée.
 *
 * On n'importe PAS TF.js ici : c'est le VisualRecognitionEngine (optionnel)
 * qui s'en charge si le bundle le supporte.
 */

export type DepthStrategy = 'brightness' | 'model';

export interface DepthResult {
  strategy: DepthStrategy;
  width:    number;
  height:   number;
  /** 0..1 normalisé. Plus grand = plus proche (convention MiDaS inversée). */
  map:      Float32Array;
}

export interface DepthOptions {
  strategy?:   DepthStrategy;
  blurRadius?: number;
  invert?:     boolean;          // true : sombre = proche
}

/**
 * Box blur rapide pour lisser la carte de profondeur.
 */
function blur(
  map: Float32Array,
  w: number,
  h: number,
  radius: number,
): Float32Array {
  if (radius <= 0) return map;
  const out = new Float32Array(w * h);
  const r = Math.floor(radius);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          sum += map[yy * w + xx];
          count++;
        }
      }
      out[y * w + x] = sum / Math.max(1, count);
    }
  }
  return out;
}

export function estimateFromBrightness(
  imageData: ImageData,
  options: DepthOptions = {},
): DepthResult {
  const { width, height, data } = imageData;
  const radius = options.blurRadius ?? 3;
  const invert = options.invert ?? false;
  const map = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Luminance perçue (BT.601).
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;
    lum /= 255;
    if (invert) lum = 1 - lum;
    map[i] = lum;
  }
  const blurred = blur(map, width, height, radius);
  return { strategy: 'brightness', width, height, map: blurred };
}

/**
 * Variante qui combine luminance + chrominance : les zones saturées
 * (peau, métal, ciel) sont "rabotées" pour éviter les artefacts.
 */
export function estimateFromLuminanceAndSaturation(
  imageData: ImageData,
  options: DepthOptions = {},
): DepthResult {
  const { width, height, data } = imageData;
  const radius = options.blurRadius ?? 4;
  const invert = options.invert ?? false;
  const map = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const r = data[idx]   / 255;
    const g = data[idx+1] / 255;
    const b = data[idx+2] / 255;
    const lum  = 0.299 * r + 0.587 * g + 0.114 * b;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const sat  = maxC === 0 ? 0 : (maxC - minC) / maxC;
    // Luminance atténuée par la saturation : zone très colorée = moins fiable.
    let depth = lum * (1 - sat * 0.4);
    if (invert) depth = 1 - depth;
    map[i] = depth;
  }
  const blurred = blur(map, width, height, radius);
  return { strategy: 'brightness', width, height, map: blurred };
}

/**
 * Convertit une depthMap Float32Array en PNG 16-bit grayscale via canvas.
 * Utile pour transmettre au backend sans perdre la précision.
 */
export async function depthMapToPng(depth: DepthResult): Promise<Blob> {
  if (typeof document === 'undefined') {
    throw new Error('depthMapToPng requires a browser environment');
  }
  const canvas = document.createElement('canvas');
  canvas.width = depth.width;
  canvas.height = depth.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponible');
  const img = ctx.createImageData(depth.width, depth.height);
  for (let i = 0; i < depth.width * depth.height; i++) {
    const v = Math.max(0, Math.min(255, Math.round(depth.map[i] * 255)));
    img.data[i * 4 + 0] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas → Blob impossible'));
    }, 'image/png');
  });
}
