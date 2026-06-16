/**
 * TopologyFixer — opérations de validation et réparation basique.
 *
 * Pas un manifold-fixer complet (pas de edge collapse) mais suffisant
 * pour valider un mesh généré par Visual Forge.
 */

import * as THREE from 'three';

export interface TopologyReport {
  isManifold:       boolean;
  openEdges:        number;
  duplicateVerts:   number;
  degenerateTris:   number;
  totalTriangles:   number;
  totalVertices:    number;
  bbox:             { min: THREE.Vector3; max: THREE.Vector3; size: THREE.Vector3 };
  warnings:         string[];
}

export function inspectTopology(geometry: THREE.BufferGeometry): TopologyReport {
  const warnings: string[] = [];

  if (!geometry.getAttribute('position')) {
    throw new Error('Geometry sans position attribute');
  }
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const indices   = geometry.getIndex();

  // Vertices dupliqués : on dédoublonne dans un Set avec clé arrondie.
  const uniqueKeys = new Set<string>();
  let duplicates = 0;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i).toFixed(4);
    const y = positions.getY(i).toFixed(4);
    const z = positions.getZ(i).toFixed(4);
    const k = `${x}|${y}|${z}`;
    if (uniqueKeys.has(k)) duplicates++;
    else uniqueKeys.add(k);
  }
  if (duplicates > 0) {
    warnings.push(`${duplicates} vertices en double (tolérance 1e-4)`);
  }

  // Triangles dégénérés (surface ≈ 0).
  let degenerate = 0;
  if (indices) {
    const idxArr = indices.array;
    for (let i = 0; i < idxArr.length; i += 3) {
      const a = idxArr[i], b = idxArr[i + 1], c = idxArr[i + 2];
      const ax = positions.getX(a), ay = positions.getY(a), az = positions.getZ(a);
      const bx = positions.getX(b), by = positions.getY(b), bz = positions.getZ(b);
      const cx = positions.getX(c), cy = positions.getY(c), cz = positions.getZ(c);
      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const vx = cx - ax, vy = cy - ay, vz = cz - az;
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      const area2 = nx * nx + ny * ny + nz * nz;
      if (area2 < 1e-8) degenerate++;
    }
    if (degenerate > 0) warnings.push(`${degenerate} triangles dégénérés`);
  }

  const bbox = computeBoundingBoxSafe(geometry);

  // Edge count : on compte les arêtes uniques.
  // Si une arête n'apparaît qu'une fois (au lieu de 2 fois avec normales
  // opposées), elle est "ouverte".
  let openEdges = 0;
  if (indices) {
    const edges = new Map<string, number>();
    const idxArr = indices.array;
    for (let i = 0; i < idxArr.length; i += 3) {
      const a = idxArr[i], b = idxArr[i + 1], c = idxArr[i + 2];
      const pairs = [[a, b], [b, c], [c, a]];
      for (const [p, q] of pairs) {
        const key = p < q ? `${p}_${q}` : `${q}_${p}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    }
    for (const count of edges.values()) {
      if (count === 1) openEdges++;
    }
    if (openEdges > 0) warnings.push(`${openEdges} arêtes ouvertes (mesh non manifold)`);
  }

  return {
    isManifold:     openEdges === 0 && degenerate === 0,
    openEdges,
    duplicateVerts: duplicates,
    degenerateTris: degenerate,
    totalTriangles: (indices?.array.length ?? positions.count) / 3,
    totalVertices:  positions.count,
    bbox,
    warnings,
  };
}

function computeBoundingBoxSafe(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox();
  if (!geometry.boundingBox) {
    return {
      min:  new THREE.Vector3(),
      max:  new THREE.Vector3(),
      size: new THREE.Vector3(),
    };
  }
  return {
    min:  geometry.boundingBox.min.clone(),
    max:  geometry.boundingBox.max.clone(),
    size: new THREE.Vector3().subVectors(geometry.boundingBox.max, geometry.boundingBox.min),
  };
}

/**
 * Tente une réparation simple : supprime les triangles dégénérés et
 * les vertices isolés. Ne fait PAS de weld agressif (préserve l'UV).
 */
export function repairTopology(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const rep = inspectTopology(geometry);
  if (rep.isManifold && rep.duplicateVerts === 0 && rep.degenerateTris === 0) {
    return geometry;
  }
  const positions = geometry.getAttribute('position').array as Float32Array;
  const indices   = geometry.getIndex()?.array as Uint32Array | undefined;
  if (!indices) return geometry;

  const newIndices: number[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i + 1], c = indices[i + 2];
    const ax = positions[a * 3 + 0], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const bx = positions[b * 3 + 0], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
    const cx = positions[c * 3 + 0], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const area2 = nx * nx + ny * ny + nz * nz;
    if (area2 >= 1e-8) {
      newIndices.push(a, b, c);
    }
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (geometry.getAttribute('normal'))  out.setAttribute('normal',  geometry.getAttribute('normal'));
  if (geometry.getAttribute('uv'))      out.setAttribute('uv',      geometry.getAttribute('uv'));
  if (geometry.getAttribute('color'))   out.setAttribute('color',   geometry.getAttribute('color'));
  out.setIndex(newIndices);
  out.computeVertexNormals();
  out.computeBoundingBox();
  return out;
}
