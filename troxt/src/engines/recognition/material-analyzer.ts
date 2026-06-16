/**
 * MaterialAnalyzer — analyse des propriétés PBR par région d'image.
 *
 * Pas de TF.js requis : on segmente grossièrement l'image en régions
 * (haut, centre, bas) et on devine le matériau d'après la couleur et la
 * variance.
 *
 * Si la reconnaissance visuelle avec TF.js est activée, les bounding boxes
 * de VisualRecognitionEngine sont passées en argument et remplacent les
 * régions par défaut.
 */

import type { RecognizedElement } from './visual-recognition-engine';

export type MaterialType =
  | 'skin' | 'fabric' | 'metal' | 'plastic' | 'glass'
  | 'organic' | 'wood' | 'stone' | 'unknown';

export interface MaterialProperties {
  reflective:           boolean;
  transparent:          boolean;
  subsurfaceScattering: boolean;
  emissive:             boolean;
}

export interface MaterialAnalysis {
  region:      string;
  type:        MaterialType;
  color:       string;             // hex
  roughness:   number;             // 0..1
  metalness:   number;             // 0..1
  confidence:  number;             // 0..1
  properties:  MaterialProperties;
}

interface RegionStats {
  region:    string;
  pixels:    number;
  avgR:      number;
  avgG:      number;
  avgB:      number;
  varR:      number;
  varG:      number;
  varB:      number;
  maxChan:   number;
}

function sampleRegion(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  rx: number, ry: number, rw: number, rh: number,
  regionName: string,
): RegionStats {
  let sumR = 0, sumG = 0, sumB = 0;
  let sumR2 = 0, sumG2 = 0, sumB2 = 0;
  let maxChan = 0;
  let n = 0;
  const startX = Math.max(0, Math.floor(rx * w));
  const endX   = Math.min(w, Math.floor((rx + rw) * w));
  const startY = Math.max(0, Math.floor(ry * h));
  const endY   = Math.min(h, Math.floor((ry + rh) * h));
  for (let y = startY; y < endY; y += 2) {
    for (let x = startX; x < endX; x += 2) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      sumR += r; sumG += g; sumB += b;
      sumR2 += r*r; sumG2 += g*g; sumB2 += b*b;
      maxChan = Math.max(maxChan, r, g, b);
      n++;
    }
  }
  if (n === 0) {
    return { region: regionName, pixels: 0, avgR:0,avgG:0,avgB:0, varR:0,varG:0,varB:0, maxChan:0 };
  }
  const avgR = sumR / n, avgG = sumG / n, avgB = sumB / n;
  return {
    region: regionName, pixels: n,
    avgR, avgG, avgB,
    varR: sumR2 / n - avgR * avgR,
    varG: sumG2 / n - avgG * avgG,
    varB: sumB2 / n - avgB * avgB,
    maxChan,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function classify(stats: RegionStats): {
  type: MaterialType;
  roughness: number;
  metalness: number;
  properties: MaterialProperties;
  confidence: number;
} {
  const { avgR, avgG, avgB } = stats;
  const brightness = (avgR + avgG + avgB) / 3;
  const variance = (stats.varR + stats.varG + stats.varB) / 3;

  // 1. Peau : tons chair, RGB écartés mais proches.
  const isSkin =
    avgR > 130 && avgR < 255 &&
    avgG > 80 && avgG < 220 &&
    avgB > 60 && avgB < 200 &&
    avgR > avgG && avgG > avgB &&
    Math.abs(avgR - avgG) < 50;
  if (isSkin) {
    return {
      type: 'skin',
      roughness: 0.45,
      metalness: 0.0,
      properties: { reflective: false, transparent: false, subsurfaceScattering: true, emissive: false },
      confidence: 0.75,
    };
  }

  // 2. Métal : haute luminance, variance faible, équilibré RGB.
  const isMetal =
    brightness > 180 &&
    Math.abs(avgR - avgG) < 20 && Math.abs(avgG - avgB) < 20 &&
    variance < 600;
  if (isMetal) {
    return {
      type: 'metal',
      roughness: 0.2,
      metalness: 0.9,
      properties: { reflective: true, transparent: false, subsurfaceScattering: false, emissive: false },
      confidence: 0.8,
    };
  }

  // 3. Verre : luminance élevée, peu saturé, edge regions brillantes.
  const isGlass =
    brightness > 200 && Math.abs(avgR - avgG) < 25 && Math.abs(avgG - avgB) < 25
    && variance > 400;
  if (isGlass) {
    return {
      type: 'glass',
      roughness: 0.05,
      metalness: 0.0,
      properties: { reflective: true, transparent: true, subsurfaceScattering: false, emissive: false },
      confidence: 0.65,
    };
  }

  // 4. Bois : rouge dominant, vert moyen.
  const isWood =
    avgR > avgG && avgG > avgB && avgR - avgB > 30 && avgR < 200;
  if (isWood) {
    return {
      type: 'wood',
      roughness: 0.75,
      metalness: 0.0,
      properties: { reflective: false, transparent: false, subsurfaceScattering: false, emissive: false },
      confidence: 0.6,
    };
  }

  // 5. Pierre : gris + faible saturation.
  const isStone =
    Math.abs(avgR - avgG) < 15 && Math.abs(avgG - avgB) < 15 &&
    brightness > 80 && brightness < 200 && variance < 1200;
  if (isStone) {
    return {
      type: 'stone',
      roughness: 0.85,
      metalness: 0.0,
      properties: { reflective: false, transparent: false, subsurfaceScattering: false, emissive: false },
      confidence: 0.55,
    };
  }

  // 6. Plastique : brillant, homogène, saturé.
  const isPlastic =
    variance < 800 && brightness > 100 && brightness < 220;
  if (isPlastic) {
    return {
      type: 'plastic',
      roughness: 0.35,
      metalness: 0.1,
      properties: { reflective: true, transparent: false, subsurfaceScattering: false, emissive: false },
      confidence: 0.5,
    };
  }

  // 7. Tissu par défaut.
  return {
    type: 'fabric',
    roughness: 0.75,
    metalness: 0.0,
    properties: { reflective: false, transparent: false, subsurfaceScattering: false, emissive: false },
    confidence: 0.4,
  };
}

export function analyzeMaterials(
  imageData: ImageData,
  recognizedElements?: RecognizedElement[],
): MaterialAnalysis[] {
  const { data, width, height } = imageData;

  // Si on a des bounding boxes de reconnaissance, on les utilise.
  if (recognizedElements && recognizedElements.length > 0) {
    return recognizedElements.map((el) => {
      const bx = el.boundingBox.x / width;
      const by = el.boundingBox.y / height;
      const bw = el.boundingBox.width / width;
      const bh = el.boundingBox.height / height;
      const stats = sampleRegion(data, width, height, bx, by, bw, bh, el.type);
      const cls = classify(stats);
      return {
        region: el.type,
        type: cls.type,
        color: rgbToHex(stats.avgR, stats.avgG, stats.avgB),
        roughness: cls.roughness,
        metalness: cls.metalness,
        confidence: Math.min(cls.confidence, el.confidence ?? cls.confidence),
        properties: cls.properties,
      };
    });
  }

  // Sinon, segmentation grossière en 4 régions.
  const regions = [
    { name: 'head',   rx: 0.30, ry: 0.05, rw: 0.40, rh: 0.25 },
    { name: 'torso',  rx: 0.25, ry: 0.30, rw: 0.50, rh: 0.35 },
    { name: 'hands',  rx: 0.10, ry: 0.40, rw: 0.30, rh: 0.30 },
    { name: 'legs',   rx: 0.30, ry: 0.65, rw: 0.40, rh: 0.35 },
  ];
  return regions.map((r) => {
    const stats = sampleRegion(data, width, height, r.rx, r.ry, r.rw, r.rh, r.name);
    const cls = classify(stats);
    return {
      region: r.name,
      type: cls.type,
      color: rgbToHex(stats.avgR, stats.avgG, stats.avgB),
      roughness: cls.roughness,
      metalness: cls.metalness,
      confidence: cls.confidence,
      properties: cls.properties,
    };
  });
}
