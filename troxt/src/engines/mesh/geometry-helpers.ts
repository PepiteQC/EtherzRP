/**
 * Helpers géométriques partagés entre tous les mesh builders.
 *
 * But : éviter la duplication de logique entre ReliefMeshBuilder,
 * SymmetryMeshBuilder et IntelligentMeshBuilder.
 */

import * as THREE from 'three';

/**
 * Calcule la bounding box d'une géométrie three.js.
 */
export function computeBoundingBox(geometry: THREE.BufferGeometry): {
  min: THREE.Vector3;
  max: THREE.Vector3;
  size: THREE.Vector3;
} {
  geometry.computeBoundingBox();
  const min = geometry.boundingBox?.min.clone() ?? new THREE.Vector3();
  const max = geometry.boundingBox?.max.clone() ?? new THREE.Vector3();
  const size = new THREE.Vector3().subVectors(max, min);
  return { min, max, size };
}

/**
 * Centre la géométrie à l'origine et la normalise à une taille cible.
 * Renvoie un clone (n'altère pas la géométrie source).
 */
export function normalizeGeometry(
  geometry: THREE.BufferGeometry,
  targetSize: number = 1,
): THREE.BufferGeometry {
  const geom = geometry.clone();
  geom.computeBoundingBox();
  if (!geom.boundingBox) return geom;
  const center = new THREE.Vector3();
  geom.boundingBox.getCenter(center);
  geom.translate(-center.x, -center.y, -center.z);
  geom.computeBoundingBox();
  const size = new THREE.Vector3();
  geom.boundingBox!.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;
  geom.scale(scale, scale, scale);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Convertit une liste de faces (triangles indexés) en un BufferGeometry three.js.
 *
 * Accepte soit `indices` (table d'indices), soit génération auto si absent.
 */
export interface RawMeshData {
  positions: Float32Array;
  normals?:  Float32Array;
  uvs?:      Float32Array;
  colors?:   Float32Array;
  indices?:  Uint32Array;
}

export function buildGeometry(raw: RawMeshData): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(raw.positions, 3));
  if (raw.normals)  geom.setAttribute('normal',   new THREE.BufferAttribute(raw.normals, 3));
  if (raw.uvs)      geom.setAttribute('uv',       new THREE.BufferAttribute(raw.uvs, 2));
  if (raw.colors)   geom.setAttribute('color',    new THREE.BufferAttribute(raw.colors, 3));
  if (raw.indices)  geom.setIndex(new THREE.BufferAttribute(raw.indices, 1));
  if (!raw.normals) geom.computeVertexNormals();
  return geom;
}

/**
 * Construit un matériau PBR three.js à partir d'une analyse de matériau.
 */
export interface PBRMaterialInput {
  color?:       string;
  map?:         THREE.Texture;
  roughness?:   number;
  metalness?:   number;
  transparent?: boolean;
  side?:        THREE.Side;
  vertexColors?: boolean;
}

export function buildStandardMaterial(input: PBRMaterialInput): THREE.Material {
  const mat = new THREE.MeshStandardMaterial({
    color:       input.color       ? new THREE.Color(input.color) : 0xffffff,
    map:         input.map,
    roughness:   input.roughness   ?? 0.6,
    metalness:   input.metalness   ?? 0.0,
    transparent: input.transparent ?? false,
    side:        input.side        ?? THREE.DoubleSide,
    vertexColors: input.vertexColors ?? false,
  });
  return mat;
}

/**
 * Crée une texture canvas à partir d'une ImageData et applique un
 * nearest-neighbour par défaut (pas de blur).
 */
export function imageDataToTexture(
  imageData: ImageData,
  options: { flipY?: boolean } = {},
): THREE.Texture {
  if (typeof document === 'undefined') {
    throw new Error('imageDataToTexture requiert un navigateur');
  }
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible');
  ctx.putImageData(imageData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = options.flipY ?? false;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Décimation simple par sous-échantillonnage uniforme des vertices.
 * Pour un vrai simplifier, intégrer meshoptimizer côté WASM.
 */
export function decimateIndices(
  indices: Uint32Array,
  positions: Float32Array,
  stride: number = 2,
): Uint32Array {
  if (stride <= 1) return indices;
  const out: number[] = [];
  for (let i = 0; i < indices.length; i++) {
    if (i % stride === 0) out.push(indices[i]);
    else out.push(indices[i - (i % stride)]);
  }
  return new Uint32Array(out);
}
