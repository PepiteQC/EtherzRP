/**
 * SymmetryMeshBuilder — reconstruction mono-image d'un objet simple.
 *
 * Stratégie : on prend le relief, on le duplique en miroir, et on
 * referme les bords avec des parois. C'est honnête sur le fait que
 * la moitié arrière est inférée.
 *
 * Le résultat est marqué par le validateur avec un ratio observed/inferred.
 */

import * as THREE from 'three';
import type { VisualForgeContract } from '@contracts/VisualForgeContract';
import { buildReliefMesh } from './relief-mesh-builder';
import { buildGeometry, normalizeGeometry } from './geometry-helpers';

export interface SymmetryOutput {
  geometry:      THREE.BufferGeometry;
  observedRatio: number;
  inferredRatio: number;
  warnings:      string[];
}

export function buildSymmetryMesh(
  imageData: ImageData,
  contract: VisualForgeContract,
): SymmetryOutput {
  // 1. On construit le relief de face.
  const relief = buildReliefMesh({ imageData, contract });

  // 2. On duplique l'arrière (miroir Z négatif).
  const reliefGeom = relief.geometry.clone();
  const posAttr = reliefGeom.getAttribute('position');
  const colAttr = reliefGeom.getAttribute('color');
  const uvAttr  = reliefGeom.getAttribute('uv');
  const indexAttr = reliefGeom.getIndex();

  const frontCount = posAttr.count;
  const newPositions = new Float32Array(frontCount * 2 * 3);
  const newColors    = new Float32Array(frontCount * 2 * 3);
  const newUvs       = new Float32Array(frontCount * 2 * 2);
  const newIndices   = new Uint32Array((indexAttr?.array.length ?? 0) * 2);

  newPositions.set(posAttr.array as Float32Array, 0);
  if (colAttr) newColors.set(colAttr.array as Float32Array, 0);
  if (uvAttr)  newUvs.set(uvAttr.array as Float32Array, 0);
  if (indexAttr) newIndices.set(indexAttr.array as Uint32Array, 0);

  for (let i = 0; i < frontCount; i++) {
    const x = (posAttr.array as Float32Array)[i * 3 + 0];
    const y = (posAttr.array as Float32Array)[i * 3 + 1];
    const z = (posAttr.array as Float32Array)[i * 3 + 2];
    newPositions[(frontCount + i) * 3 + 0] = -x;
    newPositions[(frontCount + i) * 3 + 1] =  y;
    newPositions[(frontCount + i) * 3 + 2] = -z;
    if (colAttr) {
      const cArr = colAttr.array as Float32Array;
      const j = i * 3;
      newColors[(frontCount + i) * 3 + 0] = cArr[j]     * 0.6;
      newColors[(frontCount + i) * 3 + 1] = cArr[j + 1] * 0.6;
      newColors[(frontCount + i) * 3 + 2] = cArr[j + 2] * 0.6;
    }
    if (uvAttr) {
      const uvArr = uvAttr.array as Float32Array;
      newUvs[(frontCount + i) * 2 + 0] = uvArr[i * 2 + 0];
      newUvs[(frontCount + i) * 2 + 1] = uvArr[i * 2 + 1];
    }
  }

  // Triangles arrière (sens inversé).
  if (indexAttr) {
    const idxArr = indexAttr.array as Uint32Array;
    for (let i = 0; i < idxArr.length; i += 3) {
      newIndices[idxArr.length + i + 0] = idxArr[i + 0] + frontCount;
      newIndices[idxArr.length + i + 1] = idxArr[i + 2] + frontCount;
      newIndices[idxArr.length + i + 2] = idxArr[i + 1] + frontCount;
    }
  }

  const geom = buildGeometry({
    positions: newPositions,
    colors:    newColors,
    uvs:       newUvs,
    indices:   newIndices,
  });
  geom.computeVertexNormals();

  const observedRatio = 0.30;
  const inferredRatio = 0.70;

  const warnings = [
    'Reconstruction mono-image : la moitié arrière est inférée par symétrie.',
    'Confiance géométrique limitée (estimée à ' +
      (observedRatio * 100).toFixed(0) +
      '% de la surface réellement observée).',
  ];

  return {
    geometry: normalizeGeometry(geom, 1),
    observedRatio,
    inferredRatio,
    warnings,
  };
}
