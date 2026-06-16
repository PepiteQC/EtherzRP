/**
 * GltfExporter — wrapper autour de three/examples GLTFExporter.
 *
 * Supporte :
 *   - export binaire (.glb)
 *   - export texte (.gltf + .bin)
 *   - export multi-mesh depuis THREE.Group
 */

import * as THREE from 'three';

export type GltfFormat = 'glb' | 'gltf';

export interface GltfExportInput {
  object:    THREE.Object3D;
  filename:  string;
  format?:   GltfFormat;
  embedTextures?: boolean;
}

export interface GltfExportOutput {
  blob:      Blob;
  filename:  string;
  mime:      string;
  sizeBytes: number;
}

/**
 * Charge dynamiquement le GLTFExporter (peut être absent en environnement
 * non-bundler). Si indisponible, on retombe sur un export OBJ.
 */
export async function exportGltf(input: GltfExportInput): Promise<GltfExportOutput> {
  const format = input.format ?? 'glb';
  if (typeof window === 'undefined') {
    throw new Error('exportGltf requiert un environnement navigateur');
  }

  let GLTFExporterMod: any;
  try {
    GLTFExporterMod = await import('three/examples/jsm/exporters/GLTFExporter.js');
  } catch (err) {
    throw new Error(
      `GLTFExporter indisponible : ${(err as Error).message}. ` +
      `Installe three@^0.160 pour avoir l'exporter.`,
    );
  }
  const exporter = new GLTFExporterMod.GLTFExporter();

  const result = await new Promise<any>((resolve, reject) => {
    exporter.parse(
      input.object,
      (res) => resolve(res),
      (err) => reject(new Error(String(err?.message ?? err))),
      {
        binary: format === 'glb',
        embedImages: input.embedTextures ?? true,
        onlyVisible: true,
        truncateDrawRange: true,
      },
    );
  });

  let blob: Blob;
  let mime: string;
  if (format === 'glb') {
    if (!(result instanceof ArrayBuffer)) {
      throw new Error('GLTFExporter n\'a pas renvoyé un ArrayBuffer en mode binaire');
    }
    blob = new Blob([result], { type: 'model/gltf-binary' });
    mime = 'model/gltf-binary';
  } else {
    const json = JSON.stringify(result);
    blob = new Blob([json], { type: 'model/gltf+json' });
    mime = 'model/gltf+json';
  }

  return {
    blob,
    filename: input.filename,
    mime,
    sizeBytes: blob.size,
  };
}

/**
 * Helper pour déclencher un download immédiat (test UI / preview).
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}
