/**
 * IntelligentMeshBuilder — construit un mesh 3D à partir d'une analyse
 * de reconnaissance visuelle (VisualRecognitionEngine).
 *
 * Si la pose est détectée, on utilise les bounding boxes pour placer
 * des primitives (sphère, cylindre, box). Sinon, fallback sur un relief
 * 2.5D + matériaux PBR détectés par région.
 */

import * as THREE from 'three';
import type { ImageAnalysis } from '../recognition/visual-recognition-engine';
import type { VisualForgeContract } from '@contracts/VisualForgeContract';
import { buildReliefMesh } from './relief-mesh-builder';
import {
  buildGeometry,
  buildStandardMaterial,
  normalizeGeometry,
  computeBoundingBox,
} from './geometry-helpers';

export interface IntelligentMeshOutput {
  geometry:  THREE.BufferGeometry;
  materials: THREE.Material[];
  elements:  Array<{
    name: string;
    mesh: THREE.Mesh;
  }>;
  warnings:  string[];
}

export function buildIntelligentMesh(
  analysis: ImageAnalysis,
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  contract: VisualForgeContract,
): IntelligentMeshOutput {
  const warnings: string[] = [];

  // Si on a des éléments reconnus, on construit un group avec primitives.
  if (analysis.elements.length > 0) {
    const group = new THREE.Group();
    const materials: THREE.Material[] = [];

    for (const el of analysis.elements) {
      const matInfo = analysis.materials.find((m) => m.region === el.type)
        ?? analysis.materials[0];

      const geom = primitiveForElement(el, sourceImage);
      const mat = buildStandardMaterial({
        color:      matInfo?.color ?? '#cccccc',
        roughness:  matInfo?.roughness ?? 0.6,
        metalness:  matInfo?.metalness ?? 0.0,
        vertexColors: false,
        side: THREE.DoubleSide,
      });
      materials.push(mat);

      const mesh = new THREE.Mesh(geom, mat);
      const sx = el.boundingBox.width / 100;
      const sy = el.boundingBox.height / 100;
      const sz = el.estimatedDepth;
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(
        (el.boundingBox.x - analysis.width / 2) / 100,
        -(el.boundingBox.y - analysis.height / 2) / 100,
        el.estimatedDepth,
      );
      group.add(mesh);
    }

    // On aplatit le group en un seul BufferGeometry.
    const flat = mergeGroupToGeometry(group);
    return {
      geometry: normalizeGeometry(flat, 1),
      materials,
      elements: group.children
        .filter((c): c is THREE.Mesh => c instanceof THREE.Mesh)
        .map((m, i) => ({ name: analysis.elements[i]?.type ?? `part_${i}`, mesh: m })),
      warnings,
    };
  }

  // Fallback : relief intelligent avec matériaux par région.
  warnings.push('Aucun élément reconnu : fallback en relief 2.5D.');

  // On reconstruit une ImageData à partir de l'image source.
  const ctx = ensureContext(sourceImage);
  const imageData = ctx.getImageData(0, 0, analysis.width, analysis.height);
  const relief = buildReliefMesh({ imageData, contract });

  // On re-tint le matériau du relief en fonction de l'analyse de matériau
  // (le matériau du relief utilise vertexColors : on les multiplie par la
  // couleur dominante détectée).
  const dominant = analysis.materials[0];
  const material = buildStandardMaterial({
    color:     dominant?.color ?? '#cccccc',
    roughness: dominant?.roughness ?? 0.7,
    metalness: dominant?.metalness ?? 0.0,
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  return {
    geometry: normalizeGeometry(relief.geometry, 1),
    materials: [material],
    elements: [],
    warnings,
  };
}

function primitiveForElement(
  el: ImageAnalysis['elements'][number],
  source: HTMLImageElement | HTMLCanvasElement,
): THREE.BufferGeometry {
  switch (el.shape) {
    case 'sphere':
      return new THREE.SphereGeometry(Math.max(0.1, el.boundingBox.width / 200), 24, 24);
    case 'cylinder':
      return new THREE.CylinderGeometry(
        Math.max(0.05, el.boundingBox.width / 400),
        Math.max(0.05, el.boundingBox.width / 400),
        Math.max(0.1, el.boundingBox.height / 100),
        16,
      );
    case 'box':
      return new THREE.BoxGeometry(
        Math.max(0.1, el.boundingBox.width / 100),
        Math.max(0.1, el.boundingBox.height / 100),
        Math.max(0.1, el.estimatedDepth),
      );
    default:
      return extractSubImageMesh(el, source);
  }
}

/**
 * Fallback : on extrait la bounding box et on en fait un mini relief.
 */
function extractSubImageMesh(
  el: ImageAnalysis['elements'][number],
  source: HTMLImageElement | HTMLCanvasElement,
): THREE.BufferGeometry {
  const w = Math.max(8, Math.floor(el.boundingBox.width));
  const h = Math.max(8, Math.floor(el.boundingBox.height));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.PlaneGeometry(1, 1);

  if (source instanceof HTMLCanvasElement) {
    ctx.drawImage(source,
      el.boundingBox.x, el.boundingBox.y, w, h,
      0, 0, w, h);
  } else {
    ctx.drawImage(source,
      el.boundingBox.x, el.boundingBox.y, w, h,
      0, 0, w, h);
  }

  const imageData = ctx.getImageData(0, 0, w, h);
  const subContract = {
    ...{ jobId: 'sub', createdAt: 0, sourceCount: 1, subjectType: 'object' as const,
         reconstructionMode: 'relief' as const, quality: 'preview' as const,
         symmetry: false, detailLevel: 60, autoDetect: false,
         target: { polygonBudget: 1500, textureResolution: 512 as 512,
                   rigRequired: false, colliderRequired: false, lodRequired: false, lodLevels: 1 },
         acceptance: { maximumFileSizeMb: 5, minimumConfidence: 0.4,
                       maximumOpenEdges: 0, maximumMaterialCount: 1,
                       mustLoadInThreeJs: true, mustExportGlb: true } };
  const relief = buildReliefMesh({ imageData, contract: subContract });
  return relief.geometry;
}

function ensureContext(source: HTMLImageElement | HTMLCanvasElement): CanvasRenderingContext2D {
  if (source instanceof HTMLCanvasElement) {
    const ctx = source.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible');
    return ctx;
  }
  const canvas = document.createElement('canvas');
  canvas.width  = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible');
  ctx.drawImage(source, 0, 0);
  return ctx;
}

/**
 * Merge toutes les geometries enfants d'un Group en une seule.
 * Implémentation simple : on concatène positions + colors + indices.
 */
function mergeGroupToGeometry(group: THREE.Group): THREE.BufferGeometry {
  let totalVerts = 0;
  let totalIndices = 0;
  for (const child of group.children) {
    if (!(child instanceof THREE.Mesh)) continue;
    child.geometry.computeVertexNormals();
    totalVerts += child.geometry.getAttribute('position').count;
    totalIndices += child.geometry.getIndex()?.array.length ?? 0;
  }
  const positions = new Float32Array(totalVerts * 3);
  const normals   = new Float32Array(totalVerts * 3);
  const uvs       = new Float32Array(totalVerts * 2);
  const indices   = new Uint32Array(totalIndices);

  let pOff = 0, iOff = 0, vOff = 0;
  for (const child of group.children) {
    if (!(child instanceof THREE.Mesh)) continue;
    const g = child.geometry;
    const posAttr = g.getAttribute('position');
    const norAttr = g.getAttribute('normal');
    const uvAttr  = g.getAttribute('uv');
    const idxAttr = g.getIndex();

    child.updateMatrixWorld(true);
    const matrix = child.matrixWorld;
    const v3 = new THREE.Vector3();
    const n3 = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      v3.fromBufferAttribute(posAttr, i).applyMatrix4(matrix);
      positions[(pOff + i) * 3 + 0] = v3.x;
      positions[(pOff + i) * 3 + 1] = v3.y;
      positions[(pOff + i) * 3 + 2] = v3.z;
      if (norAttr) {
        n3.fromBufferAttribute(norAttr, i).transformDirection(matrix).normalize();
        normals[(pOff + i) * 3 + 0] = n3.x;
        normals[(pOff + i) * 3 + 1] = n3.y;
        normals[(pOff + i) * 3 + 2] = n3.z;
      }
      if (uvAttr) {
        uvs[(pOff + i) * 2 + 0] = uvAttr.getX(i);
        uvs[(pOff + i) * 2 + 1] = uvAttr.getY(i);
      }
    }
    pOff += posAttr.count;

    if (idxAttr) {
      const arr = idxAttr.array as Uint32Array;
      for (let i = 0; i < arr.length; i++) {
        indices[iOff + i] = arr[i] + vOff;
      }
      iOff += arr.length;
    }
    vOff += posAttr.count;
  }

  const merged = buildGeometry({ positions, normals, uvs, indices });
  merged.computeBoundingBox();
  return merged;
}
