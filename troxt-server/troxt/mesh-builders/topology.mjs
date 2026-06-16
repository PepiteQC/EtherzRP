/**
 * topology.mjs — manifold check + réparation côté serveur.
 *
 * Même algorithme que la version client, mais en JS pur sans three.js
 * (on travaille directement sur les arrays).
 */

export function inspectTopology(geometry) {
  if (!geometry.getAttribute('position')) {
    throw new Error('Geometry sans position attribute');
  }
  const positions = geometry.getAttribute('position').array;
  const indices   = geometry.getIndex()?.array;

  // Vertices dupliqués (tolérance 1e-4).
  const uniqueKeys = new Set();
  let duplicates = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const k = `${positions[i].toFixed(4)}|${positions[i+1].toFixed(4)}|${positions[i+2].toFixed(4)}`;
    if (uniqueKeys.has(k)) duplicates++;
    else uniqueKeys.add(k);
  }

  // Triangles dégénérés.
  let degenerate = 0;
  if (indices) {
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i], b = indices[i+1], c = indices[i+2];
      const ux = positions[b*3]     - positions[a*3];
      const uy = positions[b*3 + 1] - positions[a*3 + 1];
      const uz = positions[b*3 + 2] - positions[a*3 + 2];
      const vx = positions[c*3]     - positions[a*3];
      const vy = positions[c*3 + 1] - positions[a*3 + 1];
      const vz = positions[c*3 + 2] - positions[a*3 + 2];
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      const area2 = nx * nx + ny * ny + nz * nz;
      if (area2 < 1e-8) degenerate++;
    }
  }

  // Open edges : arêtes qui n'apparaissent qu'une fois.
  let openEdges = 0;
  if (indices) {
    const edges = new Map();
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i], b = indices[i+1], c = indices[i+2];
      for (const [p, q] of [[a,b],[b,c],[c,a]]) {
        const k = p < q ? `${p}_${q}` : `${q}_${p}`;
        edges.set(k, (edges.get(k) ?? 0) + 1);
      }
    }
    for (const c of edges.values()) if (c === 1) openEdges++;
  }

  // Bounding box.
  let bbMin = [+Infinity, +Infinity, +Infinity];
  let bbMax = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i+1], z = positions[i+2];
    if (x < bbMin[0]) bbMin[0] = x; if (x > bbMax[0]) bbMax[0] = x;
    if (y < bbMin[1]) bbMin[1] = y; if (y > bbMax[1]) bbMax[1] = y;
    if (z < bbMin[2]) bbMin[2] = z; if (z > bbMax[2]) bbMax[2] = z;
  }

  return {
    isManifold: openEdges === 0 && degenerate === 0,
    openEdges,
    duplicateVerts: duplicates,
    degenerateTris: degenerate,
    totalTriangles: (indices?.length ?? positions.length / 3) / 3,
    totalVertices:  positions.length / 3,
    bbox: {
      min: bbMin,
      max: bbMax,
      size: [bbMax[0] - bbMin[0], bbMax[1] - bbMin[1], bbMax[2] - bbMin[2]],
    },
    warnings: [
      ...(duplicates > 0 ? [`${duplicates} vertices en double`] : []),
      ...(degenerate > 0 ? [`${degenerate} triangles dégénérés`] : []),
      ...(openEdges > 0 ? [`${openEdges} arêtes ouvertes`] : []),
    ],
  };
}

/**
 * Réparation simple : supprime les triangles dégénérés.
 */
export function repairTopology(geometry) {
  const positions = geometry.getAttribute('position').array;
  const indices   = geometry.getIndex()?.array;
  if (!indices) return geometry;

  const newIndices = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i+1], c = indices[i+2];
    const ux = positions[b*3]     - positions[a*3];
    const uy = positions[b*3 + 1] - positions[a*3 + 1];
    const uz = positions[b*3 + 2] - positions[a*3 + 2];
    const vx = positions[c*3]     - positions[a*3];
    const vy = positions[c*3 + 1] - positions[a*3 + 1];
    const vz = positions[c*3 + 2] - positions[a*3 + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const area2 = nx * nx + ny * ny + nz * nz;
    if (area2 >= 1e-8) newIndices.push(a, b, c);
  }

  geometry.setIndex(newIndices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}
