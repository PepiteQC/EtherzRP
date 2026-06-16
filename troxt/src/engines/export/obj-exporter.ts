/**
 * ObjExporter — wrapper autour de three/examples OBJExporter.
 *
 * Format texte uniquement. Renvoie un string prêt à écrire ou un Blob.
 */

import * as THREE from 'three';

export interface ObjExportInput {
  object:    THREE.Object3D;
  filename:  string;
  /** Index du matériau dans le .mtl généré (optionnel). */
  mtlName?:  string;
}

export interface ObjExportOutput {
  content:   string;
  blob:      Blob;
  filename:  string;
  sizeBytes: number;
}

export async function exportObj(input: ObjExportInput): Promise<ObjExportOutput> {
  if (typeof window === 'undefined') {
    throw new Error('exportObj requiert un environnement navigateur');
  }

  let OBJExporterMod: any;
  try {
    OBJExporterMod = await import('three/examples/jsm/exporters/OBJExporter.js');
  } catch (err) {
    throw new Error(
      `OBJExporter indisponible : ${(err as Error).message}`,
    );
  }
  const exporter = new OBJExporterMod.OBJExporter();
  const content: string = exporter.parse(input.object);
  const blob = new Blob([content], { type: 'text/plain' });
  return {
    content,
    blob,
    filename: input.filename,
    sizeBytes: blob.size,
  };
}
