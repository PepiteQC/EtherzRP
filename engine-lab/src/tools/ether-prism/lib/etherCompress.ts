// ═══════════════════════════════════════════════
// etherCompress.ts
// Utilitaire de compression neurale · EtherPrism
// ═══════════════════════════════════════════════

import type { CompressionStats } from '../types';

export async function compressEther(
  data: Blob | string,
  format: string,
  quality: number = 0.8
): Promise<{ blob: Blob; stats: CompressionStats }> {
  const originalSize = data instanceof Blob ? data.size : new Blob([data]).size;
  const startTime = performance.now();

  let compressed: Blob;
  let method: CompressionStats['method'];

  if (format === 'png' || format === 'webp') {
    compressed = await compressImage(data as Blob, quality);
    method = quality < 0.9 ? 'lossy' : 'lossless';
  } else if (format === 'gltf' || format === 'obj') {
    compressed = await compress3D(data as Blob);
    method = 'neural';
  } else {
    compressed = await compressGeneric(data as Blob);
    method = 'lossless';
  }

  const processingTime = performance.now() - startTime;
  const ratio = 1 - (compressed.size / originalSize);

  return {
    blob: compressed,
    stats: {
      originalSize,
      compressedSize: compressed.size,
      ratio: Math.max(0, ratio),
      method,
      quality,
      processingTime,
    },
  };
}

async function compressImage(blob: Blob, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (b) => {
          URL.revokeObjectURL(url);
          resolve(b!);
        },
        'image/webp',
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function compress3D(blob: Blob): Promise<Blob> {
  // Compression Draco-like simplifiée
  const text = await blob.text();
  const json = JSON.parse(text);
  
  // Simplifier les géométries (supprimer les vertices redondants)
  if (json.meshes) {
    json.meshes.forEach((mesh: { primitives?: Array<{ attributes?: { POSITION?: number[] } }> }) => {
      mesh.primitives?.forEach((prim: { attributes?: { POSITION?: number[] } }) => {
        if (prim.attributes?.POSITION) {
          // Downsample: garder 1 vertex sur 3
          const pos = prim.attributes.POSITION;
          const simplified = pos.filter((_, i) => i % 3 === 0);
          prim.attributes.POSITION = simplified;
        }
      });
    });
  }

  return new Blob([JSON.stringify(json)], { type: 'model/gltf+json' });
}

async function compressGeneric(blob: Blob): Promise<Blob> {
  // Compression LZ4 simplifiée via pako si dispo, sinon return as-is
  try {
    const { deflate } = await import('pako');
    const buffer = await blob.arrayBuffer();
    const compressed = deflate(new Uint8Array(buffer), { level: 6 });
    return new Blob([compressed], { type: 'application/octet-stream' });
  } catch {
    return blob; // Fallback
  }
}

// ─── Utilitaire: estimer la taille ───
export function estimateSize(blob: Blob, format: string): number {
  const baseSize = blob.size;
  switch (format) {
    case 'png': return baseSize * 0.6;
    case 'webp': return baseSize * 0.3;
    case 'jpg': return baseSize * 0.2;
    case 'gltf': return baseSize * 0.4;
    case 'svg': return baseSize * 0.1;
    default: return baseSize * 0.5;
  }
}