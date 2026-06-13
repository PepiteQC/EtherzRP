import * as THREE from 'three';
import type { ObjectCategory } from '../lib/etherworld/store';

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

type MaterialOptions = Partial<THREE.MeshStandardMaterialParameters>;

type WallOptions = {
  door?: boolean;
  window?: boolean;
  arched?: boolean;
};

type ColladedBuilding = {
  id: string;
  name: string;
  category: ObjectCategory;
  icon: string;
  collision?: [number, number, number];
  walkable?: boolean;
  isDoor?: boolean;
  build: (doorOpen?: number) => THREE.Group;
};

export interface ModelDef {
  id: string;
  name: string;
  category: ObjectCategory;
  icon: string;
  collision?: [number, number, number];
  walkable?: boolean;
  isDoor?: boolean;
  build: (doorOpen?: number) => THREE.Group;
}

// ═══════════════════════════════════════════════════════════════
//  MATERIAL CACHE
// ═══════════════════════════════════════════════════════════════

const _matCache = new Map<string, THREE.MeshStandardMaterial>();

function M(color: string, opts?: MaterialOptions): THREE.MeshStandardMaterial {
  const key = `${color}_${JSON.stringify(opts ?? {})}`;
  if (_matCache.has(key)) return _matCache.get(key)!;
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.1,
    ...opts,
  });
  _matCache.set(key, mat);
  return mat;
}

// ═══════════════════════════════════════════════════════════════
//  MATERIAL PRESETS
// ═══════════════════════════════════════════════════════════════

const gls = (op = 0.3) =>
  M('#88ccee', { transparent: true, opacity: op, roughness: 0.05, metalness: 0.3 });

const wd  = (c = '#8B6914') => M(c, { roughness: 0.72 });
const wd2 = (c = '#5c3a1e') => M(c, { roughness: 0.75 });
const mt  = (c = '#666')    => M(c, { roughness: 0.25, metalness: 0.7 });
const mt2 = (c = '#aaa')    => M(c, { roughness: 0.15, metalness: 0.85 });
const cc  = (c = '#b0b0b0') => M(c, { roughness: 0.92 });
const br  = (c = '#b06040') => M(c, { roughness: 0.88 });
const dw  = (c = '#e8e0d0') => M(c, { roughness: 0.82 });
const fb  = (c = '#555')    => M(c, { roughness: 0.95 });
const cr  = (c = '#f0f0f0') => M(c, { roughness: 0.3, metalness: 0.05 });
const lr  = (c = '#4a3020') => M(c, { roughness: 0.4, metalness: 0.02 });
const em  = (c: string, i = 1) => M(c, { emissive: c, emissiveIntensity: i });
const pl2 = (c: string, i = 2, d = 6) =>
  Object.assign(new THREE.PointLight(c, i, d), {});

// ═══════════════════════════════════════════════════════════════
//  GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════

function bx(
  w: number, h: number, d: number,
  mat: THREE.Material,
  px = 0, py = 0, pz = 0,
  castShadow = true, receiveShadow = true
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(px, py, pz);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  return mesh;
}

function cy(
  rt: number, rb: number, h: number, s: number,
  mat: THREE.Material,
  px = 0, py = 0, pz = 0
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat);
  mesh.position.set(px, py, pz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function sp(r: number, mat: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), mat);
  mesh.position.set(px, py, pz);
  mesh.castShadow = true;
  return mesh;
}

function cn(
  r: number, h: number, s: number,
  mat: THREE.Material,
  px = 0, py = 0, pz = 0
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, s), mat);
  mesh.position.set(px, py, pz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tor(r: number, tube: number, mat: THREE.Material, px = 0, py = 0, pz = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 24), mat);
  mesh.position.set(px, py, pz);
  mesh.castShadow = true;
  return mesh;
}

function pl(c: string, i = 2, d = 6): THREE.PointLight {
  return new THREE.PointLight(c, i, d);
}

function grp(...children: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

// ═══════════════════════════════════════════════════════════════
//  WALL BUILDER
// ═══════════════════════════════════════════════════════════════

function mkWall(
  w: number, h: number, d: number,
  color: string,
  opts: WallOptions = {}
): THREE.Group {
  const g = new THREE.Group();
  const wm = dw(color);

  if (opts.door) {
    const dw2 = 1.05, dh = 2.15;
    const sw = (w - dw2) / 2;
    if (sw > 0.01) {
      g.add(bx(sw, h, d, wm, -(dw2 / 2 + sw / 2), h / 2, 0));
      g.add(bx(sw, h, d, wm, (dw2 / 2 + sw / 2), h / 2, 0));
    }
    const th = h - dh;
    if (th > 0.01) g.add(bx(dw2, th, d, wm, 0, dh + th / 2, 0));

    // Door frame
    const fm = wd2('#4a2a12');
    g.add(bx(0.06, dh + 0.06, d + 0.04, fm, -(dw2 / 2 + 0.03), dh / 2, 0));
    g.add(bx(0.06, dh + 0.06, d + 0.04, fm, (dw2 / 2 + 0.03), dh / 2, 0));
    g.add(bx(dw2 + 0.12, 0.06, d + 0.04, fm, 0, dh + 0.03, 0));

  } else if (opts.window) {
    const ww = 1.0, wh = 1.0, wy = 1.4;
    const sw = (w - ww) / 2;

    g.add(bx(w, wy - wh / 2, d, wm, 0, (wy - wh / 2) / 2, 0));
    const ts = wy + wh / 2, th = h - ts;
    if (th > 0.01) g.add(bx(w, th, d, wm, 0, ts + th / 2, 0));
    if (sw > 0.01) {
      g.add(bx(sw, wh, d, wm, -(ww / 2 + sw / 2), wy, 0));
      g.add(bx(sw, wh, d, wm, (ww / 2 + sw / 2), wy, 0));
    }

    // Window frame
    const fm = M('#e8e8e8');
    g.add(bx(ww + 0.08, 0.04, d + 0.03, fm, 0, wy - wh / 2 - 0.02, 0));
    g.add(bx(ww + 0.08, 0.04, d + 0.03, fm, 0, wy + wh / 2 + 0.02, 0));
    g.add(bx(0.04, wh, d + 0.03, fm, -(ww / 2 + 0.02), wy, 0));
    g.add(bx(0.04, wh, d + 0.03, fm, (ww / 2 + 0.02), wy, 0));
    // Mullion cross
    g.add(bx(ww, 0.03, d + 0.03, fm, 0, wy, 0));
    // Glass
    g.add(bx(ww - 0.04, wh - 0.04, 0.015, gls(0.25), 0, wy, d / 2 + 0.01, false, false));

  } else {
    // Solid wall
    g.add(bx(w, h, d, wm, 0, h / 2, 0));

    // Brick/concrete texture lines
    if (color === '#b06040' || color === '#9a9a9a') {
      const lm = M(color === '#b06040' ? '#9a522d' : '#8a8a8a', { roughness: 0.95 });
      const rows = Math.floor(h / 0.12);
      for (let r = 0; r < rows; r++) {
        const yp = 0.06 + r * 0.12;
        if (yp > h) break;
        g.add(bx(w, 0.008, 0.002, lm, 0, yp, d / 2 + 0.001, false, false));
        const off = r % 2 === 0 ? 0 : 0.12;
        for (let x = -w / 2 + off; x < w / 2; x += 0.24) {
          g.add(bx(0.008, 0.11, 0.002, lm, x, yp + 0.055, d / 2 + 0.001, false, false));
        }
      }
    }

    // Baseboard + top trim
    const tm = M(
      color === '#b06040' ? '#8a4a30' : color === '#9a9a9a' ? '#7a7a7a' : '#ccc8b8'
    );
    g.add(bx(w + 0.02, 0.08, d + 0.02, tm, 0, 0.04, 0, false, false));
    g.add(bx(w + 0.02, 0.04, d + 0.02, tm, 0, h - 0.02, 0, false, false));
  }

  return g;
}

// ═══════════════════════════════════════════════════════════════
//  DOOR BUILDERS
// ═══════════════════════════════════════════════════════════════

function mkDoor(open = 0): THREE.Group {
  const g = new THREE.Group();
  const fm = wd2('#4a2a12');

  // Frame
  g.add(bx(0.07, 2.25, 0.14, fm, -0.53, 1.125, 0));
  g.add(bx(0.07, 2.25, 0.14, fm, 0.53, 1.125, 0));
  g.add(bx(1.13, 0.07, 0.14, fm, 0, 2.22, 0));

  // Door panel (pivots from left edge)
  const dg = new THREE.Group();
  dg.position.set(-0.5, 0, 0);
  dg.rotation.y = open * (-Math.PI / 2);

  const panel = bx(0.96, 2.12, 0.045, wd('#9a7030'), 0.48, 1.06, 0);
  dg.add(panel);

  // Panel details
  dg.add(bx(0.88, 0.85, 0.01, wd('#a07828'), 0.48, 0.55, 0.025, false, false));
  dg.add(bx(0.88, 0.85, 0.01, wd('#a07828'), 0.48, 1.6, 0.025, false, false));

  // Handle
  const handle = cy(0.012, 0.012, 0.12, 8, mt2('#ccc'), 0.82, 1.05, 0.035);
  handle.rotation.z = Math.PI / 2;
  dg.add(handle);
  dg.add(cy(0.02, 0.02, 0.015, 8, mt2('#bbb'), 0.82, 1.05, 0.028));

  g.add(dg);
  return g;
}

function mkGlassDoor(open = 0): THREE.Group {
  const g = new THREE.Group();
  const fm = mt('#999');

  g.add(bx(0.05, 2.25, 0.08, fm, -0.47, 1.125, 0));
  g.add(bx(0.05, 2.25, 0.08, fm, 0.47, 1.125, 0));
  g.add(bx(0.99, 0.05, 0.08, fm, 0, 2.2, 0));
  g.add(bx(0.99, 0.05, 0.08, fm, 0, 0.025, 0));

  const dg = new THREE.Group();
  dg.position.set(-0.45, 0, 0);
  dg.rotation.y = open * (-Math.PI / 2);
  dg.add(bx(0.78, 2.0, 0.012, gls(0.3), 0.65, 1.08, 0));

  // Horizontal bars
  dg.add(bx(0.74, 0.03, 0.015, mt('#aaa'), 0.65, 1.0, 0));
  dg.add(bx(0.74, 0.03, 0.015, mt('#aaa'), 0.65, 1.5, 0));

  // Pull handle
  const ph = cy(0.01, 0.01, 0.16, 8, mt2('#ccc'), 1.1, 1.05, 0.01);
  ph.rotation.z = Math.PI / 2;
  dg.add(ph);

  g.add(dg);
  return g;
}

function mkSlidingDoor(open = 0): THREE.Group {
  const g = new THREE.Group();
  const fm = mt('#888');

  // Frame
  g.add(bx(0.04, 2.4, 0.06, fm, -1.0, 1.2, 0));
  g.add(bx(0.04, 2.4, 0.06, fm, 1.0, 1.2, 0));
  g.add(bx(2.08, 0.06, 0.06, fm, 0, 2.43, 0));
  g.add(bx(2.08, 0.06, 0.06, fm, 0, 0, 0));

  // Rail
  g.add(bx(2.0, 0.02, 0.04, mt('#aaa'), 0, 2.35, 0));

  // Left panel
  const lp = new THREE.Group();
  lp.position.set(-open * 0.9, 0, 0);
  lp.add(bx(0.95, 2.25, 0.015, gls(0.3), -0.48, 1.2, 0));
  lp.add(bx(0.93, 0.03, 0.018, mt('#aaa'), -0.48, 1.5, 0));
  lp.add(bx(0.93, 0.03, 0.018, mt('#aaa'), -0.48, 0.9, 0));
  g.add(lp);

  // Right panel
  const rp = new THREE.Group();
  rp.position.set(open * 0.9, 0, 0);
  rp.add(bx(0.95, 2.25, 0.015, gls(0.3), 0.48, 1.2, 0));
  rp.add(bx(0.93, 0.03, 0.018, mt('#aaa'), 0.48, 1.5, 0));
  rp.add(bx(0.93, 0.03, 0.018, mt('#aaa'), 0.48, 0.9, 0));
  g.add(rp);

  return g;
}

// ═══════════════════════════════════════════════════════════════
//  STAIR BUILDER
// ═══════════════════════════════════════════════════════════════

function mkStairs(
  w: number, steps: number,
  sh: number, sd: number,
  mat: THREE.Material,
  hasRailing = false
): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < steps; i++) {
    const y = sh / 2 + i * sh;
    const z = -((steps - 1) * sd) / 2 + i * sd;
    g.add(bx(w, sh, sd + 0.02, mat, 0, y, z));

    // Nosing
    g.add(bx(w, 0.015, 0.025, M('#888', { roughness: 0.4 }), 0, y + sh / 2 + 0.005, z - sd / 2 - 0.01, false, false));
  }

  if (hasRailing) {
    const rm = mt('#888');
    // Left post every 2 steps
    for (let i = 0; i < steps; i += 2) {
      const y = i * sh;
      const z = -((steps - 1) * sd) / 2 + i * sd;
      g.add(bx(0.04, 0.9, 0.04, rm, -w / 2 + 0.05, y + 0.45, z));
    }
    // Handrail
    const railLen = Math.sqrt(Math.pow(steps * sd, 2) + Math.pow(steps * sh, 2));
    const rail = bx(w * 0.02, 0.04, railLen, rm, -w / 2 + 0.05, 0, 0);
    rail.rotation.x = Math.atan2(steps * sh, steps * sd);
    rail.position.set(-w / 2 + 0.05, steps * sh * 0.5 + 0.9, 0);
    g.add(rail);
  }

  return g;
}

// ═══════════════════════════════════════════════════════════════
//  REGISTRY
// ═══════════════════════════════════════════════════════════════

const O: Record<string, ModelDef> = {};

function A(
  id: string,
  name: string,
  cat: ObjectCategory,
  icon: string,
  collision: [number, number, number] | undefined,
  build: () => THREE.Group,
  walkable = false,
  isDoor = false
): void {
  O[id] = { id, name, category: cat, icon, collision, walkable, isDoor, build: () => build() };
}

function Ad(
  id: string,
  name: string,
  cat: ObjectCategory,
  icon: string,
  collision: [number, number, number] | undefined,
  build: (open?: number) => THREE.Group
): void {
  O[id] = { id, name, category: cat, icon, collision, isDoor: true, build };
}

// ═══════════════════════════════════════════════════════════════
//  ═══ WALLS ═══
// ═══════════════════════════════════════════════════════════════

const WALL_SIZES = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const WALL_COLORS: Array<[string, string, string]> = [
  ['', 'Blanc', '#e8e4dc'],
  ['b', 'Brique', '#b06040'],
  ['g', 'Gris', '#9a9a9a'],
  ['c', 'Crème', '#f0e8d8'],
  ['d', 'Sombre', '#2a2a3a'],
];

for (const [sfx, lab, c] of WALL_COLORS) {
  for (const s of WALL_SIZES) {
    A(`w${sfx}${s}`, `Mur ${lab} ${s}m`, 'structures', '🧱', [s, 2.8, 0.15],
      () => mkWall(s, 2.8, 0.15, c));
  }
  for (const s of [3, 4]) {
    A(`w${sfx}d${s}`, `Mur ${lab}+Porte ${s}m`, 'structures', '🚪', [s, 2.8, 0.15],
      () => mkWall(s, 2.8, 0.15, c, { door: true }));
    A(`w${sfx}w${s}`, `Mur ${lab}+Fenêtre ${s}m`, 'structures', '🪟', [s, 2.8, 0.15],
      () => mkWall(s, 2.8, 0.15, c, { window: true }));
  }
}

A('wt3', 'Mur Haut 3m', 'structures', '🧱', [3, 4, 0.15], () => mkWall(3, 4, 0.15, '#e8e4dc'));
A('wt5', 'Mur Haut 5m', 'structures', '🧱', [5, 5, 0.15], () => mkWall(5, 5, 0.15, '#e8e4dc'));
A('wh2', 'Demi-Mur 2m', 'structures', '🧱', [2, 1.1, 0.15], () => mkWall(2, 1.1, 0.15, '#e8e4dc'));
A('wh4', 'Demi-Mur 4m', 'structures', '🧱', [4, 1.2, 0.15], () => mkWall(4, 1.2, 0.15, '#e8e4dc'));

A('corner', 'Coin de Mur', 'structures', '📐', [3, 2.8, 3], () => {
  const g = new THREE.Group();
  const w1 = mkWall(3, 2.8, 0.15, '#e8e4dc');
  w1.position.set(0, 0, -1.425);
  g.add(w1);
  const w2 = mkWall(3, 2.8, 0.15, '#e8e4dc');
  w2.position.set(-1.425, 0, 0);
  w2.rotation.y = Math.PI / 2;
  g.add(w2);
  return g;
});

A('corner_b', 'Coin Brique', 'structures', '📐', [3, 2.8, 3], () => {
  const g = new THREE.Group();
  const w1 = mkWall(3, 2.8, 0.15, '#b06040');
  w1.position.set(0, 0, -1.425);
  g.add(w1);
  const w2 = mkWall(3, 2.8, 0.15, '#b06040');
  w2.position.set(-1.425, 0, 0);
  w2.rotation.y = Math.PI / 2;
  g.add(w2);
  return g;
});

// ═══════════════════════════════════════════════════════════════
//  ═══ FLOORS ═══
// ═══════════════════════════════════════════════════════════════

A('ft', 'Carrelage 3x3', 'structures', '⬜', undefined, () => {
  const g = new THREE.Group();
  const ta = M('#e8e0d0', { roughness: 0.3 });
  const tb = M('#d4c5a9', { roughness: 0.3 });
  for (let x = 0; x < 6; x++) {
    for (let z = 0; z < 6; z++) {
      g.add(bx(0.49, 0.04, 0.49, (x + z) % 2 === 0 ? ta : tb, -1.25 + x * 0.5, 0.02, -1.25 + z * 0.5, false, true));
    }
  }
  return g;
}, true);

A('fw', 'Plancher Bois 3x3', 'structures', '🟫', undefined, () => {
  const g = new THREE.Group();
  const planks = [M('#a0784c', { roughness: 0.7 }), M('#956e42', { roughness: 0.72 }), M('#b0845c', { roughness: 0.68 })];
  for (let i = 0; i < 6; i++) {
    g.add(bx(3, 0.06, 0.48, planks[i % 3], 0, 0.03, -1.25 + i * 0.5, false, true));
  }
  return g;
}, true);

A('fc', 'Béton 3x3', 'structures', '⬛', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(3, 0.1, 3, cc('#888'), 0, 0.05, 0, false, true));
  // Concrete joint lines
  g.add(bx(3, 0.002, 0.002, M('#666', { roughness: 0.98 }), 0, 0.11, 0, false, false));
  g.add(bx(0.002, 0.002, 3, M('#666', { roughness: 0.98 }), 0, 0.11, 0, false, false));
  return g;
}, true);

A('fmar', 'Marbre 3x3', 'structures', '⬜', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(3, 0.06, 3, M('#f5f0e8', { roughness: 0.1, metalness: 0.1 }), 0, 0.03, 0, false, true));
  // Veining
  g.add(bx(3, 0.001, 0.005, M('#e0dcd2', { roughness: 0.1 }), 0, 0.065, 0.3, false, false));
  g.add(bx(1.5, 0.001, 0.005, M('#e0dcd2', { roughness: 0.1 }), -0.5, 0.065, -0.7, false, false));
  return g;
}, true);

A('fmetal', 'Sol Métal Grillé', 'structures', '🔲', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(3, 0.06, 3, mt('#555'), 0, 0.03, 0, false, true));
  const gm = M('#666', { roughness: 0.3, metalness: 0.8 });
  for (let i = 0; i < 7; i++) g.add(bx(3, 0.02, 0.025, gm, 0, 0.065, -1.5 + i * 0.5, false, false));
  for (let i = 0; i < 7; i++) g.add(bx(0.025, 0.02, 3, gm, -1.5 + i * 0.5, 0.065, 0, false, false));
  return g;
}, true);

A('fgrass', 'Pelouse 4x4', 'exterieur', '🟩', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(4, 0.05, 4, M('#2d7d32', { roughness: 0.95 }), 0, 0.025, 0, false, true));
  return g;
}, true);

A('fdirt', 'Terre 4x4', 'exterieur', '🟫', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(4, 0.08, 4, M('#5a3a1a', { roughness: 0.98 }), 0, 0.04, 0, false, true));
  return g;
}, true);

A('fsand', 'Sable 4x4', 'exterieur', '🏜️', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(4, 0.06, 4, M('#c8a86c', { roughness: 0.97 }), 0, 0.03, 0, false, true));
  return g;
}, true);

for (const s of [2, 4, 6, 8]) {
  A(`f${s}x${s}`, `Plancher ${s}x${s}`, 'structures', '⬜', undefined,
    () => { const g = new THREE.Group(); g.add(bx(s, 0.06, s, wd('#a0784c'), 0, 0.03, 0, false, true)); return g; }, true);
  A(`fcar${s}`, `Carrelage ${s}x${s}`, 'structures', '⬜', undefined,
    () => { const g = new THREE.Group(); g.add(bx(s, 0.06, s, M('#e8e0d0', { roughness: 0.3 }), 0, 0.03, 0, false, true)); return g; }, true);
}

// ═══════════════════════════════════════════════════════════════
//  ═══ STAIRS ═══
// ═══════════════════════════════════════════════════════════════

A('st',   'Escalier Bois',      'structures', '🪜', [1.2, 1.4, 2.1], () => mkStairs(1.2, 7, 0.2, 0.28, wd('#a0784c'), true), true);
A('stw',  'Escalier Large',     'structures', '🪵', [1.6, 1.6, 2.4], () => mkStairs(1.6, 8, 0.2, 0.3, wd('#8B6914'), true), true);
A('stp',  'Escalier Pierre',    'structures', '🪨', [1.5, 1.4, 2.1], () => mkStairs(1.5, 7, 0.2, 0.3, cc('#888')), true);
A('stm',  'Escalier Métal',     'structures', '🔩', [1.4, 1.4, 2.1], () => mkStairs(1.4, 7, 0.2, 0.28, mt('#666'), true), true);
A('stsp', 'Escalier Colimaçon', 'structures', '🌀', [1.4, 2.8, 1.4], () => {
  const g = new THREE.Group();
  g.add(cy(0.06, 0.06, 2.8, 12, mt('#555'), 0, 1.4, 0));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const y = 0.12 + i * (2.8 / 12);
    const s = bx(0.7, 0.04, 0.28, wd('#8B6914'));
    s.position.set(Math.cos(a) * 0.35, y, Math.sin(a) * 0.35);
    s.rotation.y = -a + Math.PI / 2;
    g.add(s);
  }
  return g;
}, true);

// ═══════════════════════════════════════════════════════════════
//  ═══ ROOFS ═══
// ═══════════════════════════════════════════════════════════════

A('rflat', 'Toit Plat 4x4', 'structures', '🏠', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(4, 0.15, 4, cc('#555'), 0, 2.9, 0));
  // Parapet
  g.add(bx(4.1, 0.2, 0.1, cc('#444'), 0, 3.07, 2.05));
  g.add(bx(4.1, 0.2, 0.1, cc('#444'), 0, 3.07, -2.05));
  g.add(bx(0.1, 0.2, 4.1, cc('#444'), 2.05, 3.07, 0));
  g.add(bx(0.1, 0.2, 4.1, cc('#444'), -2.05, 3.07, 0));
  return g;
});

A('rpitch', 'Toit Pente', 'structures', '🏠', undefined, () => {
  const g = new THREE.Group();
  const rm = M('#8B4513', { roughness: 0.8 });
  const l = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 3.5), rm);
  l.position.set(-0.95, 2.65, 0);
  l.rotation.z = 0.45;
  l.castShadow = true;
  g.add(l);
  const r = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 3.5), rm);
  r.position.set(0.95, 2.65, 0);
  r.rotation.z = -0.45;
  r.castShadow = true;
  g.add(r);
  g.add(bx(0.12, 0.12, 3.6, wd2('#5c3a1e'), 0, 3.05, 0));
  // Fascia boards
  g.add(bx(3.6, 0.08, 0.06, wd2('#6b4423'), 0, 2.35, 1.76));
  g.add(bx(3.6, 0.08, 0.06, wd2('#6b4423'), 0, 2.35, -1.76));
  return g;
});

A('rgar', 'Toit Garage', 'structures', '🏠', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(5, 0.15, 4, cc('#444'), 0, 3, 0));
  return g;
});

A('rtar', 'Toit Terrasse', 'structures', '🏠', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(6, 0.15, 6, cc('#555'), 0, 2.9, 0));
  // Railing
  for (let i = -2.5; i <= 2.5; i += 1) {
    g.add(bx(0.04, 0.9, 0.04, mt('#888'), i, 3.35, 3.0));
    g.add(bx(0.04, 0.9, 0.04, mt('#888'), i, 3.35, -3.0));
    g.add(bx(0.04, 0.9, 0.04, mt('#888'), 3.0, 3.35, i));
    g.add(bx(0.04, 0.9, 0.04, mt('#888'), -3.0, 3.35, i));
  }
  g.add(bx(6.1, 0.04, 0.04, mt('#aaa'), 0, 3.82, 3.0));
  g.add(bx(6.1, 0.04, 0.04, mt('#aaa'), 0, 3.82, -3.0));
  g.add(bx(0.04, 0.04, 6.1, mt('#aaa'), 3.0, 3.82, 0));
  g.add(bx(0.04, 0.04, 6.1, mt('#aaa'), -3.0, 3.82, 0));
  return g;
});

// ═══════════════════════════════════════════════════════════════
//  ═══ DOORS ═══
// ═══════════════════════════════════════════════════════════════

Ad('dwood',  'Porte Bois',      'structures', '🚪', [1.1, 2.25, 0.14], (open = 0) => mkDoor(open));
Ad('dglass', 'Porte Vitrée',    'structures', '🚪', [1.0, 2.25, 0.1],  (open = 0) => mkGlassDoor(open));
Ad('dslide', 'Porte Coulissante','structures', '🚪', [2.0, 2.4,  0.06], (open = 0) => mkSlidingDoor(open));

A('ddouble', 'Porte Double', 'structures', '🚪', [2.2, 2.4, 0.14], () => {
  const g = new THREE.Group();
  const fm = wd2('#4a2a12');
  g.add(bx(0.06, 2.35, 0.14, fm, -1.03, 1.175, 0));
  g.add(bx(0.06, 2.35, 0.14, fm, 1.03, 1.175, 0));
  g.add(bx(2.12, 0.06, 0.14, fm, 0, 2.33, 0));
  g.add(bx(0.97, 2.28, 0.04, wd('#9a7030'), -0.5, 1.14, 0));
  g.add(bx(0.97, 2.28, 0.04, wd('#9a7030'), 0.5, 1.14, 0));
  // Handles
  g.add(bx(0.04, 0.12, 0.03, mt2('#ccc'), 0.08, 1.15, 0.05));
  g.add(bx(0.04, 0.12, 0.03, mt2('#ccc'), -0.08, 1.15, 0.05));
  return g;
});

A('dgar', 'Porte Garage', 'structures', '🏗️', [3, 2.5, 0.08], () => {
  const g = new THREE.Group();
  g.add(bx(3, 2.5, 0.06, mt('#ccc'), 0, 1.25, 0));
  for (let i = 0; i < 5; i++) g.add(bx(2.9, 0.04, 0.07, mt('#bbb'), 0, 0.3 + i * 0.5, 0.02));
  g.add(bx(2.9, 0.03, 0.08, M('#888', { metalness: 0.6 }), 0, 0.5, 0.04));
  return g;
});

A('dsec', 'Porte Sécurité', 'structures', '🔒', [1.1, 2.3, 0.08], () => {
  const g = new THREE.Group();
  g.add(bx(1.1, 2.3, 0.07, mt('#555'), 0, 1.15, 0));
  g.add(bx(1.05, 2.25, 0.04, mt('#444'), 0, 1.15, 0.04));
  // Reinforcement bars
  for (let y = 0.5; y < 2.3; y += 0.5) g.add(bx(1.0, 0.04, 0.08, mt('#666'), 0, y, 0));
  // Electronic lock
  g.add(bx(0.1, 0.15, 0.05, M('#1a2a4a'), 0.4, 1.2, 0.06));
  g.add(bx(0.08, 0.06, 0.015, M('#22c55e', { emissive: '#22c55e', emissiveIntensity: 0.6 }), 0.4, 1.2, 0.09, false, false));
  return g;
});

// ═══════════════════════════════════════════════════════════════
//  ═══ WINDOWS ═══
// ═══════════════════════════════════════════════════════════════

A('wins', 'Petite Fenêtre', 'structures', '🪟', undefined, () => {
  const g = new THREE.Group();
  const fm = M('#f0f0f0');
  g.add(bx(0.82, 0.82, 0.06, fm, 0, 0, 0));
  g.add(bx(0.36, 0.72, 0.015, gls(0.25), -0.18, 0, 0.03, false, false));
  g.add(bx(0.36, 0.72, 0.015, gls(0.25), 0.18, 0, 0.03, false, false));
  g.add(bx(0.72, 0.03, 0.02, fm, 0, 0, 0.03, false, false));
  return g;
});

A('winl', 'Grande Fenêtre', 'structures', '🪟', undefined, () => {
  const g = new THREE.Group();
  const fm = M('#f0f0f0');
  g.add(bx(1.52, 1.22, 0.06, fm, 0, 0, 0));
  g.add(bx(0.7, 1.12, 0.015, gls(0.25), -0.35, 0, 0.03, false, false));
  g.add(bx(0.7, 1.12, 0.015, gls(0.25), 0.35, 0, 0.03, false, false));
  g.add(bx(1.38, 0.03, 0.02, fm, 0, 0, 0.03, false, false));
  return g;
});

A('winb', 'Baie Vitrée', 'structures', '🏢', undefined, () => {
  const g = new THREE.Group();
  const fm = mt('#555');
  g.add(bx(3, 2.4, 0.04, gls(0.18), 0, 0, 0, false, false));
  g.add(bx(0.035, 2.4, 0.05, fm, -1, 0, 0));
  g.add(bx(0.035, 2.4, 0.05, fm, 0, 0, 0));
  g.add(bx(0.035, 2.4, 0.05, fm, 1, 0, 0));
  g.add(bx(3.04, 0.05, 0.06, fm, 0, 1.2, 0));
  g.add(bx(3.04, 0.05, 0.06, fm, 0, -1.2, 0));
  return g;
});

A('winsk', 'Fenêtre de Toit', 'structures', '🪟', undefined, () => {
  const g = new THREE.Group();
  const fm = M('#e8e8e8');
  g.add(bx(0.9, 0.06, 0.72, fm, 0, 0, 0));
  g.add(bx(0.82, 0.02, 0.64, gls(0.3), 0, 0.04, 0, false, false));
  return g;
});

// ═══════════════════════════════════════════════════════════════
//  ═══ PILLARS ═══
// ═══════════════════════════════════════════════════════════════

A('pil', 'Pilier Béton', 'structures', '🏛️', [0.4, 3, 0.4], () => {
  const g = new THREE.Group();
  g.add(cy(0.18, 0.2, 2.8, 12, cc()));
  g.add(bx(0.5, 0.1, 0.5, cc(), 0, -1.35, 0));
  g.add(bx(0.5, 0.1, 0.5, cc(), 0, 1.45, 0));
  return g;
});

A('pilor', 'Pilier Orné', 'structures', '🏛️', [0.5, 3.5, 0.5], () => {
  const g = new THREE.Group();
  g.add(cy(0.2, 0.22, 2.6, 16, cc('#ddd'), 0, 1.5, 0));
  g.add(bx(0.55, 0.12, 0.55, cc('#eee'), 0, 0.06, 0));
  g.add(cy(0.28, 0.22, 0.15, 16, cc('#eee'), 0, 2.88, 0));
  // Fluting
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(cy(0.015, 0.015, 2.5, 4, cc('#ccc'), Math.cos(a) * 0.19, 1.5, Math.sin(a) * 0.19));
  }
  return g;
});

A('pilw', 'Pilier Bois', 'structures', '🪵', [0.25, 2.8, 0.25], () => {
  const g = new THREE.Group();
  g.add(bx(0.25, 2.8, 0.25, wd(), 0, 1.4, 0));
  g.add(bx(0.32, 0.06, 0.32, wd('#7a5a30'), 0, 0.03, 0));
  g.add(bx(0.32, 0.06, 0.32, wd('#7a5a30'), 0, 2.77, 0));
  return g;
});

A('pilm', 'Pilier Métal', 'structures', '🔩', [0.2, 3, 0.2], () => {
  const g = new THREE.Group();
  g.add(cy(0.1, 0.1, 3, 8, mt(), 0, 1.5, 0));
  g.add(bx(0.22, 0.04, 0.22, mt('#555'), 0, 0.02, 0));
  g.add(bx(0.22, 0.04, 0.22, mt('#555'), 0, 3.0, 0));
  return g;
});

// ═══════════════════════════════════════════════════════════════
//  ═══ BATHROOM ═══
// ═══════════════════════════════════════════════════════════════

A('toilet', 'Toilettes', 'sdb', '🚽', undefined, () => {
  const g = new THREE.Group();
  const m = cr('#f8f8f8');
  g.add(bx(0.36, 0.35, 0.14, m, 0, 0.38, -0.2));
  g.add(bx(0.38, 0.03, 0.16, m, 0, 0.57, -0.2));
  g.add(bx(0.38, 0.18, 0.42, m, 0, 0.09, 0.04));
  g.add(cy(0.17, 0.19, 0.05, 16, m, 0, 0.2, 0.08));
  g.add(cy(0.16, 0.18, 0.025, 16, M('#e8e8e8', { roughness: 0.3 }), 0, 0.23, 0.08));
  // Flush button
  g.add(cy(0.03, 0.03, 0.015, 8, M('#ccc', { metalness: 0.5 }), 0, 0.585, -0.25));
  return g;
});

A('batht', 'Baignoire', 'sdb', '🛁', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.7, 0.55, 0.75, cr('#f5f5f5'), 0, 0.275, 0));
  g.add(bx(1.5, 0.3, 0.55, M('#87CEEB', { transparent: true, opacity: 0.6 }), 0, 0.42, 0, false, false));
  // Taps
  g.add(cy(0.015, 0.015, 0.14, 6, mt2('#ccc'), -0.6, 0.6, 0.35));
  g.add(cy(0.015, 0.015, 0.14, 6, mt2('#ccc'), -0.5, 0.6, 0.35));
  g.add(bx(0.12, 0.025, 0.025, mt2('#ccc'), -0.55, 0.68, 0.35));
  // Feet
  for (const [fx, fz] of [[-0.78, -0.32], [0.78, -0.32], [-0.78, 0.32], [0.78, 0.32]]) {
    g.add(cy(0.03, 0.04, 0.08, 6, mt2('#ccc'), fx, 0.04, fz));
  }
  return g;
});

A('showr', 'Douche', 'sdb', '🚿', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.0, 0.06, 1.0, cr('#e8e8e8'), 0, 0.03, 0));
  g.add(bx(1.0, 2.2, 0.04, cr('#ddd'), 0, 1.16, -0.48));
  g.add(bx(0.04, 2.2, 1.0, cr('#ddd'), -0.48, 1.16, 0));
  g.add(bx(0.02, 2.0, 0.96, gls(0.15), 0.49, 1.06, 0, false, false));
  g.add(bx(0.96, 2.0, 0.02, gls(0.15), 0, 1.06, 0.49, false, false));
  // Shower head
  g.add(cy(0.015, 0.015, 0.5, 6, mt2('#ccc'), -0.35, 1.8, -0.4));
  g.add(cy(0.08, 0.09, 0.02, 8, mt2('#ccc'), -0.35, 2.05, -0.4));
  return g;
});

A('bsink', 'Lavabo', 'sdb', '🪥', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(0.7, 0.65, 0.45, M('#f5f5f5'), 0, 0.325, 0));
  g.add(bx(0.74, 0.04, 0.48, M('#e8e0d0', { roughness: 0.3 }), 0, 0.67, 0));
  g.add(cy(0.18, 0.22, 0.12, 16, cr(), 0, 0.64, 0.02));
  g.add(cy(0.015, 0.015, 0.18, 8, mt2('#ccc'), 0, 0.78, -0.12));
  g.add(bx(0.6, 0.8, 0.03, M('#888', { metalness: 0.9, roughness: 0.05 }), 0, 1.3, -0.2));
  // Faucet knobs
  g.add(cy(0.02, 0.02, 0.04, 8, M('#e74c3c', { metalness: 0.4 }), -0.07, 0.8, -0.15));
  g.add(cy(0.02, 0.02, 0.04, 8, M('#3b82f6', { metalness: 0.4 }), 0.07, 0.8, -0.15));
  return g;
});

A('bidet',    'Bidet',     'sdb', '🚿', undefined, () => { const g = new THREE.Group(); g.add(bx(0.35, 0.3, 0.45, cr('#f8f8f8'), 0, 0.15, 0)); g.add(cy(0.14, 0.16, 0.05, 16, cr('#f8f8f8'), 0, 0.32, 0.02)); return g; });
A('washmach', 'Laveuse',   'sdb', '🫧', undefined, () => { const g = new THREE.Group(); g.add(bx(0.6, 0.85, 0.6, M('#e8e8e8'), 0, 0.425, 0)); g.add(cy(0.2, 0.2, 0.02, 24, M('#ccc'), 0, 0.42, 0.3)); g.add(cy(0.16, 0.16, 0.01, 24, gls(0.2), 0, 0.42, 0.31, false, false)); return g; });
A('dryer',    'Sécheuse',  'sdb', '🌀', undefined, () => { const g = new THREE.Group(); g.add(bx(0.6, 0.85, 0.6, M('#e8e8e8'), 0, 0.425, 0)); g.add(cy(0.2, 0.2, 0.02, 24, M('#ccc'), 0, 0.42, 0.3)); return g; });
A('towel',    'Porte-Serviette', 'sdb', '🧻', undefined, () => { const g = new THREE.Group(); const b = cy(0.015, 0.015, 0.6, 8, mt2('#ccc'), 0, 1.0, 0); b.rotation.z = Math.PI / 2; g.add(b); g.add(bx(0.5, 0.5, 0.02, fb('#f0f0f0'), 0, 0.75, 0.08, false, false)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ LIVING ROOM ═══
// ═══════════════════════════════════════════════════════════════

A('sofa', 'Canapé', 'meubles', '🛋️', undefined, () => {
  const g = new THREE.Group();
  const m = fb('#4a5568');
  g.add(bx(2.0, 0.2, 0.85, m, 0, 0.35, 0));
  g.add(bx(2.0, 0.5, 0.12, m, 0, 0.6, -0.38));
  g.add(bx(0.12, 0.3, 0.85, m, -0.94, 0.5, 0));
  g.add(bx(0.12, 0.3, 0.85, m, 0.94, 0.5, 0));
  // Cushions
  g.add(bx(0.88, 0.12, 0.7, M('#3d4a5c'), -0.55, 0.48, 0.05));
  g.add(bx(0.88, 0.12, 0.7, M('#3d4a5c'), 0.55, 0.48, 0.05));
  // Legs
  for (const [lx, lz] of [[-0.9, -0.38], [0.9, -0.38], [-0.9, 0.38], [0.9, 0.38]]) {
    g.add(bx(0.07, 0.14, 0.07, M('#333'), lx, 0.07, lz));
  }
  return g;
});

A('sofaL', 'Canapé Angle', 'meubles', '🛋️', undefined, () => {
  const g = new THREE.Group();
  const m = fb('#3b5998');
  g.add(bx(2.2, 0.2, 0.9, m, 0, 0.35, 0));
  g.add(bx(0.9, 0.2, 1.2, m, 0.65, 0.35, 0.6));
  g.add(bx(2.2, 0.5, 0.12, m, 0, 0.6, -0.38));
  return g;
});

A('sofa2', 'Canapé Cuir', 'meubles', '🛋️', undefined, () => {
  const g = new THREE.Group();
  const m = lr('#1a1a1a');
  g.add(bx(2.2, 0.22, 0.9, m, 0, 0.33, 0));
  g.add(bx(2.2, 0.45, 0.12, m, 0, 0.58, -0.38));
  g.add(bx(0.12, 0.3, 0.9, m, -1.04, 0.48, 0));
  g.add(bx(0.12, 0.3, 0.9, m, 1.04, 0.48, 0));
  // Buttons
  for (let i = -0.7; i <= 0.7; i += 0.35) {
    g.add(cy(0.015, 0.015, 0.01, 8, mt2('#333'), i, 0.45, 0.38));
  }
  return g;
});

A('armch', 'Fauteuil', 'meubles', '💺', undefined, () => {
  const g = new THREE.Group();
  const m = fb('#8B4513');
  g.add(bx(0.85, 0.2, 0.8, m, 0, 0.3, 0));
  g.add(bx(0.85, 0.5, 0.12, m, 0, 0.58, -0.33));
  g.add(bx(0.12, 0.28, 0.8, m, -0.36, 0.46, 0));
  g.add(bx(0.12, 0.28, 0.8, m, 0.36, 0.46, 0));
  return g;
});

A('recline', 'Fauteuil Relax', 'meubles', '💺', undefined, () => {
  const g = new THREE.Group();
  const m = lr('#8B3A1A');
  g.add(bx(0.9, 0.22, 0.85, m, 0, 0.3, 0));
  g.add(bx(0.9, 0.55, 0.1, m, 0, 0.62, -0.37));
  g.add(bx(0.12, 0.3, 0.85, m, -0.39, 0.47, 0));
  g.add(bx(0.12, 0.3, 0.85, m, 0.39, 0.47, 0));
  g.add(bx(0.8, 0.04, 0.45, m, 0, 0.55, 0.22));
  return g;
});

A('ottom',  'Pouf',                 'meubles', '🟤', undefined, () => { const g = new THREE.Group(); g.add(cy(0.35, 0.35, 0.35, 16, fb('#8B4513'), 0, 0.2, 0)); g.add(cy(0.36, 0.36, 0.04, 16, M('#a0522d'), 0, 0.4, 0)); return g; });
A('ctblw',  'Table Basse Bois',     'meubles', '🪵', undefined, () => { const g = new THREE.Group(); g.add(bx(1.2, 0.05, 0.6, wd('#a0784c'), 0, 0.44, 0)); for (const [lx, lz] of [[-0.52, -0.24], [-0.52, 0.24], [0.52, -0.24], [0.52, 0.24]]) g.add(bx(0.05, 0.42, 0.05, wd('#8a6535'), lx, 0.21, lz)); return g; });
A('ctbl',   'Table Basse Verre',    'meubles', '☕', undefined, () => { const g = new THREE.Group(); g.add(cy(0.45, 0.45, 0.03, 32, gls(0.3), 0, 0.4, 0)); g.add(cy(0.04, 0.06, 0.38, 8, mt2('#ccc'), 0, 0.2, 0)); g.add(cy(0.12, 0.12, 0.02, 16, mt2('#999'), 0, 0.01, 0)); return g; });
A('dintbl', 'Table à Manger',       'meubles', '🍽️', undefined, () => { const g = new THREE.Group(); g.add(bx(1.6, 0.05, 0.9, wd('#a0784c'), 0, 0.75, 0)); for (const [lx, lz] of [[-0.7, -0.38], [-0.7, 0.38], [0.7, -0.38], [0.7, 0.38]]) g.add(bx(0.06, 0.65, 0.06, wd('#8a6535'), lx, 0.325, lz)); return g; });
A('tabrnd', 'Table Ronde',          'meubles', '🍽️', undefined, () => { const g = new THREE.Group(); g.add(cy(0.55, 0.55, 0.04, 32, wd('#a0784c'), 0, 0.74, 0)); g.add(cy(0.05, 0.05, 0.72, 8, wd('#8a6535'), 0, 0.36, 0)); return g; });
A('chair',  'Chaise',               'meubles', '🪑', undefined, () => { const g = new THREE.Group(); const m = wd('#a0522d'); g.add(bx(0.42, 0.04, 0.42, m, 0, 0.45, 0)); g.add(bx(0.42, 0.45, 0.04, m, 0, 0.7, -0.19)); for (const [lx, lz] of [[-0.17, -0.17], [-0.17, 0.17], [0.17, -0.17], [0.17, 0.17]]) g.add(bx(0.035, 0.43, 0.035, m, lx, 0.215, lz)); return g; });
A('chair2', 'Chaise Bureau',        'meubles', '💺', undefined, () => { const g = new THREE.Group(); g.add(bx(0.48, 0.05, 0.48, fb('#333'), 0, 0.48, 0)); g.add(bx(0.46, 0.4, 0.04, fb('#333'), 0, 0.73, -0.21)); g.add(cy(0.025, 0.025, 0.45, 8, mt2('#888'), 0, 0.23, 0)); return g; });
A('bstool', 'Tabouret Bar',         'meubles', '🪑', undefined, () => { const g = new THREE.Group(); g.add(cy(0.16, 0.16, 0.04, 16, lr('#c0392b'), 0, 0.72, 0)); g.add(cy(0.02, 0.04, 0.7, 8, mt2('#888'), 0, 0.36, 0)); return g; });
A('bench',  'Banc',                 'meubles', '🪑', undefined, () => { const g = new THREE.Group(); g.add(bx(1.8, 0.05, 0.45, wd('#a0522d'), 0, 0.45, 0)); g.add(bx(1.8, 0.35, 0.04, wd('#a0522d'), 0, 0.67, -0.2)); g.add(bx(0.04, 0.43, 0.45, mt('#555'), -0.8, 0.22, 0)); g.add(bx(0.04, 0.43, 0.45, mt('#555'), 0.8, 0.22, 0)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ BEDS ═══
// ═══════════════════════════════════════════════════════════════

A('bed', 'Lit Double', 'meubles', '🛏️', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.8, 0.2, 2.2, wd('#8B6914'), 0, 0.15, 0));
  g.add(bx(1.8, 0.75, 0.08, wd('#8B6914'), 0, 0.52, -1.04));
  g.add(bx(1.8, 0.25, 0.06, wd('#7a5a30'), 0, 0.35, 1.04));
  g.add(bx(1.7, 0.18, 2.0, M('#f5f5f0'), 0, 0.34, 0.02));
  g.add(bx(0.5, 0.1, 0.3, M('#ffffff'), -0.4, 0.5, -0.75));
  g.add(bx(0.5, 0.1, 0.3, M('#ffffff'), 0.4, 0.5, -0.75));
  g.add(bx(1.65, 0.05, 1.2, M('#c0392b'), 0, 0.48, 0.35));
  return g;
});

A('beds', 'Lit Simple', 'meubles', '🛏️', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.0, 0.2, 2.0, wd('#a0784c'), 0, 0.15, 0));
  g.add(bx(1.0, 0.6, 0.06, wd('#a0784c'), 0, 0.45, -0.95));
  g.add(bx(0.9, 0.15, 1.8, M('#f5f5f0'), 0, 0.32, 0.02));
  g.add(bx(0.35, 0.08, 0.25, M('#ffffff'), 0, 0.44, -0.72));
  g.add(bx(0.85, 0.04, 0.9, M('#2980b9'), 0, 0.44, 0.4));
  return g;
});

A('bunk', 'Lits Superposés', 'meubles', '🛏️', undefined, () => {
  const g = new THREE.Group();
  const fm = mt('#666');
  // Vertical posts
  for (const [px, pz] of [[-0.49, -1.0], [0.49, -1.0], [-0.49, 1.0], [0.49, 1.0]]) {
    g.add(cy(0.03, 0.03, 2.2, 8, fm, px, 1.1, pz));
  }
  // Bottom bed
  g.add(bx(1.0, 0.1, 2.0, mt('#555'), 0, 0.4, 0));
  g.add(bx(0.92, 0.1, 1.85, M('#f0e8d8'), 0, 0.5, 0));
  g.add(bx(0.88, 0.04, 0.8, M('#2980b9'), 0, 0.56, 0.35));
  // Top bed
  g.add(bx(1.0, 0.1, 2.0, mt('#555'), 0, 1.5, 0));
  g.add(bx(0.92, 0.1, 1.85, M('#f0e8d8'), 0, 1.6, 0));
  g.add(bx(0.88, 0.04, 0.8, M('#e74c3c'), 0, 1.66, 0.35));
  // Safety rail
  g.add(bx(0.55, 0.15, 0.03, fm, 0.2, 1.65, 1.0));
  return g;
});

// ═══════════════════════════════════════════════════════════════
//  ═══ STORAGE ═══
// ═══════════════════════════════════════════════════════════════

A('ward',    'Armoire',          'meubles', '🚪', undefined, () => { const g = new THREE.Group(); g.add(bx(1.6, 2.2, 0.58, wd2('#5c3a1e'), 0, 1.1, 0)); g.add(bx(0.77, 2.1, 0.025, wd('#6b4423'), -0.38, 1.1, 0.28)); g.add(bx(0.77, 2.1, 0.025, wd('#6b4423'), 0.38, 1.1, 0.28)); return g; });
A('dress',   'Commode',          'meubles', '🗄️', undefined, () => { const g = new THREE.Group(); g.add(bx(1.2, 0.85, 0.5, wd('#8B6914'), 0, 0.425, 0)); for (let i = 0; i < 3; i++) { g.add(bx(1.1, 0.24, 0.48, wd('#7a5a30'), 0, 0.14 + i * 0.28, 0)); g.add(cy(0.02, 0.02, 0.03, 6, mt2('#ccc'), 0, 0.14 + i * 0.28, 0.27)); } return g; });
A('night',   'Table de Nuit',    'meubles', '🔲', undefined, () => { const g = new THREE.Group(); g.add(bx(0.5, 0.52, 0.4, wd('#8B6914'), 0, 0.26, 0)); g.add(bx(0.48, 0.24, 0.38, wd('#7a5830'), 0, 0.14, 0)); return g; });
A('book',    'Bibliothèque',     'meubles', '📚', undefined, () => { const g = new THREE.Group(); const m = wd('#654321'); g.add(bx(1.0, 2.0, 0.03, m, 0, 1.0, -0.15)); g.add(bx(0.03, 2.0, 0.33, m, -0.485, 1.0, 0)); g.add(bx(0.03, 2.0, 0.33, m, 0.485, 1.0, 0)); for (const sy of [0.02, 0.5, 1.0, 1.5, 2.0]) g.add(bx(0.94, 0.025, 0.3, m, 0, sy, 0.02)); const bc = ['#e74c3c','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444']; for (let i = 0; i < 6; i++) g.add(bx(0.08, 0.22, 0.04, M(bc[i]), -0.4 + i * 0.14, 0.27, -0.11)); return g; });
A('shelf',   'Étagère Murale',   'deco',    '📚', undefined, () => { const g = new THREE.Group(); const m = wd('#deb887'); for (let i = 0; i < 3; i++) g.add(bx(1.2, 0.03, 0.25, m, 0, 0.5 + i * 0.5, 0)); return g; });
A('filecab', 'Classeur',         'meubles', '🗄️', undefined, () => { const g = new THREE.Group(); g.add(bx(0.5, 1.2, 0.6, M('#777'), 0, 0.6, 0)); for (let i = 0; i < 4; i++) { g.add(bx(0.48, 0.26, 0.58, M('#888'), 0, 0.16 + i * 0.3, 0)); g.add(bx(0.3, 0.03, 0.04, mt2('#ccc'), 0, 0.16 + i * 0.3, 0.32)); } return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ OFFICE ═══
// ═══════════════════════════════════════════════════════════════

A('desk', 'Bureau', 'meubles', '🖥️', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.4, 0.04, 0.7, wd('#5c3a1e'), 0, 0.72, 0));
  g.add(bx(1.35, 0.65, 0.03, wd('#5c3a1e'), 0, 0.37, -0.33));
  // Monitor
  g.add(bx(0.55, 0.35, 0.025, M('#1a1a1a'), -0.1, 1.0, -0.15));
  g.add(bx(0.5, 0.3, 0.01, M('#1a2a4a', { emissive: '#1a2a4a', emissiveIntensity: 0.15 }), -0.1, 1.0, -0.13, false, false));
  g.add(bx(0.08, 0.15, 0.1, M('#1a1a1a'), -0.1, 0.82, -0.15));
  g.add(bx(0.2, 0.02, 0.1, M('#222'), -0.1, 0.74, -0.15));
  // Keyboard
  g.add(bx(0.38, 0.015, 0.14, M('#333'), -0.1, 0.74, 0.08));
  // Mouse
  g.add(bx(0.07, 0.025, 0.12, M('#2a2a2a'), 0.3, 0.74, 0.08));
  return g;
});

A('deskL', 'Bureau en L', 'meubles', '🖥️', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.6, 0.05, 0.8, wd('#5c3a1e'), 0, 0.72, 0));
  g.add(bx(0.8, 0.05, 0.8, wd('#5c3a1e'), 0.8, 0.72, 0));
  g.add(bx(1.55, 0.69, 0.04, wd('#5c3a1e'), 0, 0.37, -0.38));
  return g;
});

A('deskglass', 'Bureau Verre', 'meubles', '🖥️', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.4, 0.04, 0.7, gls(0.4), 0, 0.72, 0));
  for (const [lx, lz] of [[-0.62, -0.3], [-0.62, 0.3], [0.62, -0.3], [0.62, 0.3]]) {
    g.add(cy(0.025, 0.025, 0.7, 6, mt2('#ccc'), lx, 0.35, lz));
  }
  return g;
});

// ═══════════════════════════════════════════════════════════════
//  ═══ KITCHEN ═══
// ═══════════════════════════════════════════════════════════════

A('kcnt',   'Plan Cuisine',      'cuisine', '🍳',  undefined, () => { const g = new THREE.Group(); g.add(bx(1.2, 0.82, 0.6, M('#f5f5f5'), 0, 0.41, 0)); g.add(bx(1.24, 0.04, 0.64, M('#bdc3c7', { roughness: 0.3 }), 0, 0.84, 0)); return g; });
A('stove',  'Cuisinière',        'cuisine', '🔥',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.6, 0.82, 0.6, M('#e8e8e8'), 0, 0.41, 0)); g.add(bx(0.58, 0.03, 0.58, M('#1a1a1a'), 0, 0.84, 0)); for (const [bx2, bz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) { g.add(cy(0.05, 0.05, 0.01, 8, M('#222'), bx2, 0.86, bz)); } g.add(bx(0.5, 0.35, 0.03, M('#333'), 0, 0.62, 0.31)); g.add(bx(0.48, 0.1, 0.01, gls(0.2), 0, 0.62, 0.32, false, false)); return g; });
A('fridge', 'Réfrigérateur',     'cuisine', '🧊',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.7, 1.8, 0.65, M('#f0f0f0'), 0, 0.9, 0)); g.add(bx(0.65, 0.55, 0.02, M('#e8e8e8'), 0, 1.52, 0.32)); g.add(bx(0.65, 1.05, 0.02, M('#e8e8e8'), 0, 0.7, 0.32)); g.add(bx(0.05, 0.25, 0.04, mt2('#ccc'), 0.3, 1.52, 0.35)); g.add(bx(0.05, 0.45, 0.04, mt2('#ccc'), 0.3, 0.7, 0.35)); return g; });
A('sink',   'Évier',             'cuisine', '🚰',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.6, 0.82, 0.5, M('#f5f5f5'), 0, 0.41, 0)); g.add(bx(0.62, 0.04, 0.52, M('#bdc3c7', { roughness: 0.3 }), 0, 0.84, 0)); g.add(bx(0.45, 0.12, 0.35, mt2('#d0d0d0'), 0, 0.82, 0.02)); g.add(cy(0.015, 0.015, 0.22, 8, mt2('#ccc'), 0, 0.97, -0.15)); return g; });
A('micro',  'Micro-ondes',       'cuisine', '📟',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.5, 0.3, 0.35, M('#333'), 0, 0.15, 0)); g.add(bx(0.28, 0.22, 0.01, M('#1a1a2e'), -0.05, 0.17, 0.17, false, false)); g.add(bx(0.06, 0.22, 0.01, M('#222'), 0.2, 0.17, 0.17, false, false)); return g; });
A('dishw',  'Lave-Vaisselle',    'cuisine', '🫧',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.6, 0.82, 0.6, M('#e8e8e8'), 0, 0.41, 0)); g.add(bx(0.58, 0.03, 0.58, M('#ddd'), 0, 0.84, 0)); return g; });
A('kisland','Îlot Central',      'cuisine', '🏝️', undefined, () => { const g = new THREE.Group(); g.add(bx(1.8, 0.85, 0.8, M('#f5f5f5'), 0, 0.425, 0)); g.add(bx(1.85, 0.04, 0.85, M('#bdc3c7', { roughness: 0.3 }), 0, 0.87, 0)); return g; });
A('barc',   'Comptoir Bar',      'cuisine', '🍺',  undefined, () => { const g = new THREE.Group(); g.add(bx(3, 1.0, 0.6, wd('#5c3a1e'), 0, 0.5, 0)); g.add(bx(3.1, 0.05, 0.7, wd('#8B6914'), 0, 1.025, 0)); return g; });
A('cabh',   'Armoire Haute',     'cuisine', '🗄️', undefined, () => { const g = new THREE.Group(); g.add(bx(0.8, 0.8, 0.35, M('#f5f5f5'), 0, 0, 0)); return g; });
A('rangehood','Hotte Cuisine',   'cuisine', '💨',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.65, 0.35, 0.45, mt('#aaa'), 0, 0.175, 0)); g.add(bx(0.55, 0.03, 0.35, M('#bbb', { metalness: 0.5 }), 0, 0.365, 0)); const l = pl('#fffce0', 0.8, 3); l.position.set(0, -0.15, 0.15); g.add(l); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ EXTERIOR ═══
// ═══════════════════════════════════════════════════════════════

A('tree',   'Arbre',         'exterieur', '🌳', undefined, () => { const g = new THREE.Group(); g.add(cy(0.1, 0.16, 1.8, 8, wd('#6B4423'), 0, 0.9, 0)); g.add(sp(0.75, M('#228B22'), 0, 2.3, 0)); g.add(sp(0.6, M('#2E8B57'), -0.3, 2.6, 0.2)); g.add(sp(0.5, M('#1a7a1a'), 0.25, 2.8, -0.15)); return g; });
A('pine',   'Sapin',         'exterieur', '🌲', undefined, () => { const g = new THREE.Group(); g.add(cy(0.08, 0.13, 1.2, 8, wd('#5a3a1a'), 0, 0.6, 0)); for (let i = 0; i < 5; i++) g.add(cn(0.8 - i * 0.14, 0.7, 8, M('#1a5c1a'), 0, 1.4 + i * 0.55, 0)); return g; });
A('palm',   'Palmier',       'exterieur', '🌴', undefined, () => { const g = new THREE.Group(); g.add(cy(0.08, 0.15, 3, 8, M('#a0824c'), 0, 1.5, 0)); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 1.5), M('#228B22')); l.position.set(Math.cos(a) * 0.5, 3, Math.sin(a) * 0.5); l.rotation.y = a; g.add(l); } return g; });
A('bush',   'Buisson',       'exterieur', '🌿', undefined, () => { const g = new THREE.Group(); g.add(sp(0.4, M('#2E8B57'), 0, 0.35, 0)); g.add(sp(0.32, M('#228B22'), -0.25, 0.28, 0.15)); return g; });
A('flower', 'Plate-bande',   'exterieur', '🌺', undefined, () => { const g = new THREE.Group(); g.add(bx(1.2, 0.15, 0.5, M('#6B4423'), 0, 0.075, 0)); const cols = ['#ff69b4', '#ff1493', '#ff6347', '#ffd700', '#ff4500']; for (let i = 0; i < 5; i++) { const xi = -0.4 + i * 0.16; const rv = (i * 0.373 + 0.1) * 0.15; g.add(cy(0.008, 0.008, 0.15 + rv, 4, M('#228B22'), xi, 0.22, (i * 0.317 - 0.1) * 0.2)); g.add(sp(0.04, M(cols[i]), xi, 0.32 + rv * 0.3, (i * 0.317 - 0.1) * 0.2)); } return g; });
A('lpost',  'Lampadaire',    'exterieur', '🏮', undefined, () => { const g = new THREE.Group(); g.add(cy(0.06, 0.1, 3.5, 12, mt('#444'), 0, 1.75, 0)); g.add(sp(0.1, em('#ffe4b5', 0.8), 0, 3.3, 0)); const l = pl('#ffe4b5', 3, 10); l.position.set(0, 3.1, 0); g.add(l); return g; });
A('fence',  'Clôture Bois',  'exterieur', '🏗️', undefined, () => { const g = new THREE.Group(); const m = wd('#a0784c'); for (let i = 0; i < 3; i++) g.add(bx(0.08, 1.1, 0.08, m, -0.9 + i * 0.9, 0.55, 0)); g.add(bx(1.8, 0.06, 0.04, m, 0, 0.85, 0)); g.add(bx(1.8, 0.06, 0.04, m, 0, 0.4, 0)); return g; });
A('fencem', 'Clôture Métal', 'exterieur', '⛓️', undefined, () => { const g = new THREE.Group(); for (let i = 0; i < 5; i++) { g.add(cy(0.015, 0.015, 1, 6, mt('#555'), -1 + i * 0.5, 0.5, 0)); } g.add(bx(2, 0.03, 0.03, mt('#666'), 0, 0.8, 0)); g.add(bx(2, 0.03, 0.03, mt('#666'), 0, 0.3, 0)); return g; });
A('trash',  'Poubelle',      'exterieur', '🗑️', undefined, () => { const g = new THREE.Group(); g.add(cy(0.18, 0.2, 0.8, 12, M('#2d7d32'), 0, 0.4, 0)); return g; });
A('hydr',   'Bouche Incendie','exterieur','🚒', undefined, () => { const g = new THREE.Group(); const r = M('#e74c3c'); g.add(cy(0.08, 0.1, 0.5, 8, r, 0, 0.25, 0)); g.add(cy(0.1, 0.08, 0.08, 8, r, 0, 0.54, 0)); return g; });
A('rock',   'Rocher',        'exterieur', '🪨', undefined, () => { const g = new THREE.Group(); const s = sp(0.4, M('#808080', { roughness: 0.95 }), 0, 0.25, 0); s.scale.set(1.2, 0.65, 0.9); g.add(s); return g; });
A('cone',   'Cône Chantier', 'exterieur', '🔶', undefined, () => { const g = new THREE.Group(); g.add(bx(0.32, 0.04, 0.32, M('#e67e22'), 0, 0.02, 0)); g.add(cn(0.13, 0.55, 8, M('#e67e22'), 0, 0.32, 0)); return g; });
A('barr',   'Barrière',      'exterieur', '🚧', undefined, () => { const g = new THREE.Group(); g.add(bx(2, 0.1, 0.1, M('#f39c12'), 0, 0.4, 0)); g.add(bx(0.08, 0.8, 0.08, mt('#555'), -0.9, 0.4, 0)); g.add(bx(0.08, 0.8, 0.08, mt('#555'), 0.9, 0.4, 0)); return g; });
A('dump',   'Conteneur',     'exterieur', '♻️', undefined, () => { const g = new THREE.Group(); g.add(bx(1.5, 1.1, 1, M('#27ae60'), 0, 0.55, 0)); return g; });
A('mailb',  'Boîte aux Lettres','exterieur','📮',undefined, () => { const g = new THREE.Group(); g.add(cy(0.03, 0.03, 1.2, 6, mt('#888'), 0, 0.6, 0)); g.add(bx(0.3, 0.2, 0.15, M('#2c3e50'), 0, 1.3, 0)); return g; });
A('utpole', 'Pôle Électrique','exterieur', '⚡', undefined, () => { const g = new THREE.Group(); g.add(cy(0.1, 0.15, 6, 8, wd('#8B6914'), 0, 3, 0)); g.add(bx(2, 0.08, 0.08, wd('#8B6914'), 0, 5.5, 0)); return g; });
A('transf', 'Transformateur', 'exterieur', '🔌', undefined, () => { const g = new THREE.Group(); g.add(bx(0.6, 0.8, 0.4, M('#4a5568'), 0, 0.4, 0)); return g; });
A('ac',     'Clim Extérieure','exterieur', '❄️', undefined, () => { const g = new THREE.Group(); g.add(bx(0.8, 0.6, 0.3, M('#ddd'), 0, 0.3, 0)); return g; });
A('scaf',   'Échafaudage',   'exterieur', '🏗️', undefined, () => { const g = new THREE.Group(); for (let x = 0; x < 3; x++) g.add(cy(0.03, 0.03, 4, 6, mt('#888'), -2 + x * 2, 2, 0)); for (let y = 0; y < 4; y++) g.add(bx(4, 0.03, 0.03, mt('#888'), 0, 0.5 + y, 0)); return g; });
A('bench2', 'Banc de Parc',  'exterieur', '🪑', undefined, () => { const g = new THREE.Group(); g.add(bx(1.8, 0.05, 0.45, wd('#a0784c'), 0, 0.45, 0)); for (const [px, pz] of [[-0.75, -0.2], [0.75, -0.2]]) { g.add(bx(0.06, 0.55, 0.45, wd('#8a6535'), px, 0.275, pz)); } g.add(bx(1.8, 0.35, 0.04, wd('#a0784c'), 0, 0.67, -0.19)); return g; });
A('fountain','Fontaine',     'exterieur', '⛲', undefined, () => { const g = new THREE.Group(); g.add(cy(1.2, 1.4, 0.4, cc('#888'), 0, 0.2, 0)); g.add(cy(0.05, 0.05, 0.8, 8, mt('#555'), 0, 0.8, 0)); g.add(cy(0.3, 0.3, 0.1, 16, M('#7dd3fc', { transparent: true, opacity: 0.7 }), 0, 1.25, 0)); const l = pl('#7dd3fc', 0.5, 5); l.position.set(0, 0.3, 0); g.add(l); return g; });
A('oak',    'Chêne',         'exterieur', '🌳', undefined, () => { const g = new THREE.Group(); g.add(cy(0.15, 0.2, 2, 8, wd('#5a3a1a'), 0, 1, 0)); g.add(sp(0.9, M('#1a6b1a'), 0, 2.5, 0)); g.add(sp(0.7, M('#228B22'), -0.4, 2.8, 0.3)); g.add(sp(0.6, M('#2E8B57'), 0.3, 3.0, -0.2)); return g; });
A('birch',  'Bouleau',       'exterieur', '🪵', undefined, () => { const g = new THREE.Group(); g.add(cy(0.08, 0.12, 2.5, 8, M('#f0e8d8'), 0, 1.25, 0)); g.add(sp(0.5, M('#4a8c4a'), 0, 2.8, 0)); g.add(sp(0.4, M('#5aa05a'), -0.2, 3.0, 0.15)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ ROADS ═══
// ═══════════════════════════════════════════════════════════════

A('road',   'Route Droite', 'routes', '🛣️', undefined, () => { const g = new THREE.Group(); g.add(bx(4, 0.08, 8, M('#2a2a2a'), 0, 0.04, 0, false, true)); for (let z = -3.5; z < 4; z += 1.5) g.add(bx(0.1, 0.005, 0.8, M('#f1c40f'), 0, 0.085, z, false, false)); g.add(bx(0.08, 0.005, 7.9, M('#ffffff'), -1.85, 0.085, 0, false, false)); g.add(bx(0.08, 0.005, 7.9, M('#ffffff'), 1.85, 0.085, 0, false, false)); return g; }, true);
A('roadi',  'Carrefour',    'routes', '✚',  undefined, () => { const g = new THREE.Group(); g.add(bx(8, 0.08, 8, M('#2a2a2a'), 0, 0.04, 0, false, true)); return g; }, true);
A('swalk',  'Trottoir',     'routes', '🚶', undefined, () => { const g = new THREE.Group(); g.add(bx(1.2, 0.12, 4, cc('#bbb'), 0, 0.06, 0, false, true)); return g; }, true);
A('cross',  'Passage Piéton','routes','🦓', undefined, () => { const g = new THREE.Group(); g.add(bx(4, 0.02, 3, M('#444'), 0, 0.01, 0, false, true)); for (let z = -1.1; z <= 1.1; z += 0.4) g.add(bx(4, 0.005, 0.2, M('#fff'), 0, 0.025, z, false, false)); return g; }, true);
A('park',   'Place Parking', 'routes', '🅿️', undefined, () => { const g = new THREE.Group(); g.add(bx(2.5, 0.08, 5, M('#2a2a2a'), 0, 0.04, 0, false, true)); g.add(bx(0.08, 0.005, 3, M('#ffffff'), -1.2, 0.085, 0, false, false)); g.add(bx(0.08, 0.005, 3, M('#ffffff'), 1.2, 0.085, 0, false, false)); return g; }, true);
A('tlight', 'Feu Circulation','routes','🚦', undefined, () => { const g = new THREE.Group(); g.add(cy(0.04, 0.04, 3.0, 12, mt('#444'), 0, 1.5, 0)); g.add(bx(0.22, 0.65, 0.12, M('#222'), 0, 2.8, 0.06)); g.add(sp(0.055, em('#e74c3c', 0.8), 0, 2.98, 0.12)); g.add(sp(0.055, em('#f39c12', 0.4), 0, 2.78, 0.12)); g.add(sp(0.055, em('#27ae60', 0.8), 0, 2.58, 0.12)); return g; });
A('ssign',  'Panneau Rue',  'routes', '🪧', undefined, () => { const g = new THREE.Group(); g.add(cy(0.025, 0.025, 2.3, 6, mt('#888'), 0, 1.15, 0)); g.add(bx(0.5, 0.25, 0.03, M('#2980b9'), 0, 2.3, 0)); return g; });
A('stop',   'STOP',         'routes', '🛑', undefined, () => { const g = new THREE.Group(); g.add(cy(0.025, 0.025, 2, 6, mt('#888'), 0, 1, 0)); g.add(bx(0.5, 0.5, 0.03, M('#e74c3c'), 0, 2.1, 0)); return g; });
A('speedb', 'Dos d\'Âne',   'routes', '🛣️', undefined, () => { const g = new THREE.Group(); g.add(bx(4, 0.08, 8, M('#2a2a2a'), 0, 0.04, 0, false, true)); const hump = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.12, 16, 1, false, 0, Math.PI), M('#333')); hump.rotation.z = Math.PI / 2; hump.position.set(0, 0.08, 0); g.add(hump); return g; }, true);

// ═══════════════════════════════════════════════════════════════
//  ═══ DECORATION ═══
// ═══════════════════════════════════════════════════════════════

A('plant',    'Plante Int.',     'deco', '🪴', undefined, () => { const g = new THREE.Group(); g.add(cy(0.16, 0.12, 0.28, 12, M('#a0522d'), 0, 0.14, 0)); g.add(sp(0.28, M('#228B22'), 0, 0.55, 0)); g.add(sp(0.2, M('#2E8B57'), -0.12, 0.65, 0.08)); return g; });
A('lplant',   'Grande Plante',  'deco', '🌿', undefined, () => { const g = new THREE.Group(); g.add(cy(0.25, 0.2, 0.5, 8, M('#8B4513'), 0, 0.25, 0)); g.add(sp(0.5, M('#228B22'), 0, 1, 0)); return g; });
A('fpot',     'Pot de Fleurs',  'deco', '🌺', undefined, () => { const g = new THREE.Group(); g.add(cy(0.12, 0.09, 0.2, 8, M('#CD853F'), 0, 0.1, 0)); g.add(sp(0.08, M('#ff69b4'), 0, 0.45, 0)); return g; });
A('neon',     'Néon Violet',    'deco', '💜', undefined, () => { const g = new THREE.Group(); g.add(bx(1, 0.04, 0.04, em('#8b5cf6', 1.5), 0, 0, 0)); g.add(bx(1.1, 0.08, 0.08, M('#8b5cf6', { transparent: true, opacity: 0.15 }), 0, 0, 0, false, false)); const l = pl('#8b5cf6', 1.5, 5); l.position.set(0, 0, 0.5); g.add(l); return g; });
A('neongreen','Néon Vert',      'deco', '💚', undefined, () => { const g = new THREE.Group(); g.add(bx(1, 0.04, 0.04, em('#22c55e', 1.5), 0, 0, 0)); const l = pl('#22c55e', 1.5, 5); l.position.set(0, 0, 0.5); g.add(l); return g; });
A('neonred',  'Néon Rouge',     'deco', '❤️', undefined, () => { const g = new THREE.Group(); g.add(bx(1, 0.04, 0.04, em('#e74c3c', 1.5), 0, 0, 0)); const l = pl('#e74c3c', 1.5, 5); l.position.set(0, 0, 0.5); g.add(l); return g; });
A('neonblue', 'Néon Bleu',      'deco', '💙', undefined, () => { const g = new THREE.Group(); g.add(bx(1, 0.04, 0.04, em('#3b82f6', 1.5), 0, 0, 0)); const l = pl('#3b82f6', 1.5, 5); l.position.set(0, 0, 0.5); g.add(l); return g; });
A('paint',    'Tableau',        'deco', '🖼️', undefined, () => { const g = new THREE.Group(); g.add(bx(0.92, 0.72, 0.025, wd2('#5c3a1e'), 0, 0, 0)); g.add(bx(0.82, 0.62, 0.01, M('#2c5f8a'), 0, 0, 0.015, false, false)); return g; });
A('mirr',     'Miroir',         'deco', '🪞', undefined, () => { const g = new THREE.Group(); g.add(bx(0.82, 1.22, 0.04, M('#5c3a1e'), 0, 0, 0)); g.add(bx(0.74, 1.14, 0.01, M('#c0c8d0', { metalness: 0.95, roughness: 0.02 }), 0, 0, 0.025, false, false)); return g; });
A('candle',   'Bougie',         'deco', '🕯️', undefined, () => { const g = new THREE.Group(); g.add(cy(0.04, 0.04, 0.15, 12, M('#f5f5dc'), 0, 0.075, 0)); g.add(sp(0.02, em('#ff8c00', 1.2), 0, 0.18, 0)); const l = pl('#ff8c00', 0.5, 3); l.position.set(0, 0.2, 0); g.add(l); return g; });
A('vase',     'Vase',           'deco', '🏺', undefined, () => { const g = new THREE.Group(); g.add(cy(0.06, 0.1, 0.3, 12, M('#e74c3c'), 0, 0.15, 0)); g.add(cy(0.04, 0.06, 0.08, 12, M('#c0392b'), 0, 0.34, 0)); return g; });
A('clock',    'Horloge',        'deco', '🕐', undefined, () => { const g = new THREE.Group(); g.add(cy(0.18, 0.18, 0.025, 32, M('#2c3e50'), 0, 0, 0)); g.add(cy(0.165, 0.165, 0.01, 32, M('#ecf0f1'), 0, 0, 0.015)); return g; });
A('cbox',     'Boîte Carton',   'deco', '📦', undefined, () => { const g = new THREE.Group(); g.add(bx(0.5, 0.5, 0.5, M('#c4a35a'), 0, 0.25, 0)); return g; });
A('barrel',   'Baril',          'deco', '🛢️', undefined, () => { const g = new THREE.Group(); g.add(cy(0.22, 0.25, 0.9, 16, M('#2c5f8a'), 0, 0.45, 0)); return g; });
A('crate',    'Caisse Bois',    'deco', '📦', undefined, () => { const g = new THREE.Group(); g.add(bx(0.8, 0.8, 0.8, wd('#a0784c'), 0, 0.4, 0)); return g; });
A('ladder',   'Échelle',        'deco', '🪜', undefined, () => { const g = new THREE.Group(); const m = wd('#a0784c'); g.add(bx(0.05, 3, 0.05, m, -0.3, 1.5, 0)); g.add(bx(0.05, 3, 0.05, m, 0.3, 1.5, 0)); for (let i = 0; i < 10; i++) g.add(bx(0.6, 0.04, 0.04, m, 0, 0.3 + i * 0.28, 0)); return g; });
A('rug',      'Tapis',          'meubles','🟫', undefined, () => { const g = new THREE.Group(); g.add(bx(2.5, 0.015, 1.8, fb('#8B4513'), 0, 0.008, 0, false, true)); return g; }, true);
A('curtain',  'Rideau',         'deco', '🪟', undefined, () => { const g = new THREE.Group(); const r = cy(0.015, 0.015, 1.6, 8, mt2('#888'), 0, 2.5, 0); r.rotation.z = Math.PI / 2; g.add(r); g.add(bx(0.5, 2.3, 0.02, fb('#8B4513'), -0.4, 1.35, 0)); g.add(bx(0.5, 2.3, 0.02, fb('#8B4513'), 0.4, 1.35, 0)); return g; });
A('picframe', 'Cadre Photo',    'deco', '🖼️', undefined, () => { const g = new THREE.Group(); g.add(bx(0.4, 0.5, 0.03, wd('#5c3a1e'), 0, 0, 0)); g.add(bx(0.35, 0.45, 0.01, M('#f5f5dc'), 0, 0, 0.02)); return g; });
A('tvwall',   'TV Murale',      'meubles','📺', undefined, () => { const g = new THREE.Group(); g.add(bx(1.6, 0.9, 0.04, M('#111'), 0, 1.5, 0)); g.add(bx(1.5, 0.8, 0.02, M('#1a3a5c'), 0, 1.5, 0.03)); return g; });
A('tvst',     'Meuble TV',      'meubles','📺', undefined, () => { const g = new THREE.Group(); g.add(bx(1.6, 0.45, 0.45, M('#1a1a1a'), 0, 0.225, 0)); g.add(bx(1.3, 0.75, 0.035, M('#111'), 0, 0.85, -0.08)); g.add(bx(1.24, 0.68, 0.01, M('#1a2a4a'), 0, 0.85, -0.06, false, false)); const l = pl('#4488ff', 0.4, 5); l.position.set(0, 0.85, 0.5); g.add(l); return g; });
A('lamp',     'Lampadaire',     'meubles','💡', undefined, () => { const g = new THREE.Group(); g.add(cy(0.15, 0.18, 0.025, 16, mt('#333'), 0, 0.012, 0)); g.add(cy(0.015, 0.015, 1.5, 8, mt('#555'), 0, 0.77, 0)); g.add(cy(0.06, 0.18, 0.28, 12, M('#f5deb3', { transparent: true, opacity: 0.9 }), 0, 1.56, 0)); const l = pl('#ffe4b5', 1.5, 6); l.position.set(0, 1.4, 0); g.add(l); return g; });
A('dlamp',    'Lampe Bureau',   'meubles','💡', undefined, () => { const g = new THREE.Group(); g.add(cy(0.08, 0.1, 0.02, 12, mt('#333'), 0, 0.01, 0)); g.add(cy(0.012, 0.012, 0.35, 6, mt('#555'), 0, 0.19, 0)); return g; });
A('piano',    'Piano',          'meubles','🎹', undefined, () => { const g = new THREE.Group(); g.add(bx(1.5, 0.7, 0.6, M('#1a1a1a'), 0, 0.35, 0)); g.add(bx(1.5, 0.6, 0.05, M('#1a1a1a'), 0, 0.7, -0.28)); g.add(bx(1.2, 0.05, 0.3, M('#f0f0f0'), 0, 0.72, 0.15)); return g; });
A('guitar',   'Guitare',        'deco', '🎸', undefined, () => { const g = new THREE.Group(); g.add(cy(0.12, 0.15, 0.5, 8, wd('#8B4513'), 0, 0.5, 0)); g.add(bx(0.3, 0.4, 0.05, wd('#8B4513'), 0, 0.1, 0)); return g; });
A('trophy',   'Trophée',        'deco', '🏆', undefined, () => { const g = new THREE.Group(); g.add(cy(0.08, 0.1, 0.08, 8, M('#d4a843'), 0, 0.04, 0)); g.add(cy(0.02, 0.02, 0.15, 6, M('#d4a843'), 0, 0.16, 0)); g.add(cy(0.12, 0.1, 0.15, 12, M('#d4a843'), 0, 0.31, 0)); return g; });
A('aquarium', 'Aquarium',       'deco', '🐠', undefined, () => { const g = new THREE.Group(); g.add(bx(0.8, 0.5, 0.35, gls(0.25), 0, 0.25, 0, false, false)); g.add(bx(0.78, 0.48, 0.33, M('#1a4a6a', { transparent: true, opacity: 0.5 }), 0, 0.25, 0, false, false)); const l = pl('#00aaff', 0.3, 2); l.position.set(0, 0.6, 0); g.add(l); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ BUILDINGS ═══
// ═══════════════════════════════════════════════════════════════

A('couche',   'Couche-Tard',    'structures','🏪', [12,6,12],  () => { const g = new THREE.Group(); g.add(bx(12,4.5,10,M('#e8e0d0'),0,2.25,0)); g.add(bx(14,0.15,12,cc('#555'),0,5,0)); g.add(bx(12.1,0.8,10.1,M('#ED1C24'),0,4.9,0)); g.add(bx(4,3.8,0.06,gls(0.35),0,2.1,4.97,false,false)); return g; });
A('hotel',    'Hôtel',          'structures','🏨', [20,16,30], () => { const g = new THREE.Group(); g.add(bx(20,16,30,M('#1a1a2e'),0,8,0)); g.add(bx(20.2,0.5,30.2,M('#0f1419'),0,16.25,0)); for(let f=0;f<4;f++){ g.add(bx(20.3,0.3,30.3,M('#14161c'),0,1+f*4,0)); for(let w=-8;w<=8;w+=4) g.add(bx(2.5,2.5,0.1,M('#1e3a5f',{transparent:true,opacity:0.6,emissive:'#ffd580',emissiveIntensity:0.15}),w,2.4+f*4,15.01,false,false));} return g; });
A('pharm',    'Pharmacie',      'structures','💊', [10,4,8],   () => { const g = new THREE.Group(); g.add(bx(10,3.5,8,M('#f0f0f0'),0,1.75,0)); g.add(bx(10.2,0.4,8.2,M('#00563f'),0,3.7,0)); g.add(bx(3,3,0.1,gls(0.4),0,1.75,4.01)); return g; });
A('depan',    'Dépanneur',      'structures','🏪', [8,4,6],    () => { const g = new THREE.Group(); g.add(bx(8,3.5,6,M('#ddd'),0,1.75,0)); g.add(bx(8.2,0.4,6.2,M('#e74c3c'),0,3.7,0)); g.add(bx(2,3,0.1,gls(0.4),0,1.5,3.01)); return g; });
A('restau',   'Restaurant',     'structures','🍽️',[12,5,10],  () => { const g = new THREE.Group(); g.add(bx(12,4.5,10,br('#a0522d'),0,2.25,0)); g.add(bx(12.2,0.4,10.2,wd('#5c3a1e'),0,4.7,0)); g.add(bx(6,3.5,0.1,gls(0.3),0,1.75,5.01)); return g; });
A('garage',   'Garage Auto',    'structures','🔧', [10,4,8],   () => { const g = new THREE.Group(); g.add(bx(10,4,8,M('#555'),0,2,0)); g.add(bx(10.2,0.3,8.2,M('#333'),0,4.15,0)); g.add(bx(5,3.5,0.1,M('#333'),0,1.75,4.01)); return g; });
A('church',   'Église',         'structures','⛪', [12,14,18], () => { const g = new THREE.Group(); g.add(bx(12,8,18,M('#ccc'),0,4,0)); g.add(cy(1.5,2,6,8,M('#ccc'),0,11,0)); g.add(cy(0.3,0.3,3,6,M('#d4a843'),0,15.5,0)); return g; });
A('station',  'Poste Police',   'structures','🚔', [10,4,8],   () => { const g = new THREE.Group(); g.add(bx(10,3.5,8,M('#3b82f6'),0,1.75,0)); g.add(bx(10.2,0.3,8.2,M('#1e3a8a'),0,3.65,0)); g.add(bx(2,3,0.1,gls(0.4),0,1.5,4.01)); return g; });
A('hospital', 'Hôpital',        'structures','🏥', [16,10,14], () => { const g = new THREE.Group(); g.add(bx(16,9,14,M('#f0f0f0'),0,4.5,0)); g.add(bx(16.2,0.3,14.2,M('#ddd'),0,9.15,0)); g.add(bx(4,3,0.1,gls(0.3),0,3,7.01)); return g; });
A('bar',      'Bar/Club',       'structures','🍺', [8,4,6],    () => { const g = new THREE.Group(); g.add(bx(8,3.5,6,M('#2c2c2c'),0,1.75,0)); g.add(bx(8.2,0.3,6.2,M('#111'),0,3.65,0)); g.add(bx(3,3,0.1,M('#111'),0,1.5,3.01)); const l=pl('#8b5cf6',2,6); l.position.set(0,3,0); g.add(l); return g; });
A('gym',      'Gym',            'structures','💪', [14,5,10],  () => { const g = new THREE.Group(); g.add(bx(14,4.5,10,cc('#888'),0,2.25,0)); g.add(bx(14.2,0.3,10.2,M('#666'),0,4.65,0)); g.add(bx(8,3.5,0.1,gls(0.3),0,1.75,5.01)); return g; });
A('warehouse','Entrepôt',       'structures','🏭', [20,6,15],  () => { const g = new THREE.Group(); g.add(bx(20,5,15,cc('#777'),0,2.5,0)); g.add(bx(20.2,0.3,15.2,M('#555'),0,5.15,0)); g.add(bx(5,4,0.1,mt('#555'),0,2,7.51)); return g; });
A('school',   'École',          'structures','🏫', [18,6,14],  () => { const g = new THREE.Group(); g.add(bx(18,5.5,14,M('#e8c860'),0,2.75,0)); g.add(bx(18.2,0.25,14.2,M('#d4a820'),0,5.625,0)); for(let w=-6;w<=6;w+=3) g.add(bx(2,3.5,0.1,gls(0.3),w,2,7.01)); return g; });
A('bank',     'Banque',         'structures','🏦', [14,6,12],  () => { const g = new THREE.Group(); g.add(bx(14,5.5,12,M('#f0ede0'),0,2.75,0)); g.add(bx(14.2,0.25,12.2,M('#ccc'),0,5.625,0)); for(let i=0;i<4;i++) g.add(cy(0.2,0.25,5,8,cc('#ddd'),-5+i*3.3,2.75,6.05)); return g; });
A('apart',    'Immeuble Appart','structures','🏢', [16,24,14], () => { const g = new THREE.Group(); g.add(bx(16,22,14,M('#2a2a4a'),0,11,0)); g.add(bx(16.2,0.3,14.2,M('#1a1a3e'),0,22.15,0)); for(let f=0;f<6;f++) for(let w=-5;w<=5;w+=4) g.add(bx(2.5,2.5,0.1,M('#1e3a5f',{transparent:true,opacity:0.7,emissive:'#ffd580',emissiveIntensity:0.2}),w,2.5+f*3.5,7.01,false,false)); return g; });
A('tower',    'Tour de Bureau', 'structures','🏢', [20,40,20], () => { const g = new THREE.Group(); g.add(bx(20,40,20,M('#1a2a3a',{metalness:0.3}),0,20,0)); for(let f=0;f<10;f++) for(let w=-8;w<=8;w+=4) { g.add(bx(3,2.5,0.1,gls(0.35),w,3+f*4,10.05,false,false)); g.add(bx(3,2.5,0.1,gls(0.35),w,3+f*4,-10.05,false,false)); } return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ CEILINGS ═══
// ═══════════════════════════════════════════════════════════════

for (const s of [4, 6, 8, 10]) {
  A(`ceil${s}`, `Plafond ${s}x${s}`, 'structures', '⬜', undefined, () => {
    const g = new THREE.Group();
    g.add(bx(s, 0.12, s, cc('#ddd'), 0, 2.85, 0));
    return g;
  });
}

// ═══════════════════════════════════════════════════════════════
//  ═══ LIGHTING ═══
// ═══════════════════════════════════════════════════════════════

A('ceillamp',   'Plafonnier',     'eclairage','💡', undefined, () => { const g = new THREE.Group(); g.add(cy(0.25,0.25,0.04,16,M('#fff',{emissive:'#ffe4b5',emissiveIntensity:0.5}),0,0,0)); const l=pl('#ffe4b5',2,8); l.position.set(0,-0.3,0); g.add(l); return g; });
A('chandelier', 'Lustre',         'eclairage','✨', undefined, () => { const g = new THREE.Group(); g.add(cy(0.02,0.02,0.4,6,mt('#888'),0,0.2,0)); g.add(cy(0.4,0.35,0.08,16,M('#d4a843'),0,0,0)); for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2; g.add(cy(0.03,0.03,0.15,6,M('#f5f5dc'),Math.cos(a)*0.25,-0.1,Math.sin(a)*0.25)); g.add(sp(0.02,em('#ff8c00',1.0),Math.cos(a)*0.25,-0.02,Math.sin(a)*0.25));} const l=pl('#ffe4b5',3,10); l.position.set(0,-0.2,0); g.add(l); return g; });
A('neonsign',   'Néon Sign',      'eclairage','💫', undefined, () => { const g = new THREE.Group(); g.add(bx(0.8,0.3,0.04,em('#ff00ff',1.5),0,0,0)); g.add(bx(0.9,0.4,0.08,M('#ff00ff',{transparent:true,opacity:0.1}),0,0,0,false,false)); const l=pl('#ff00ff',2,5); l.position.set(0,0,0.5); g.add(l); return g; });
A('spotlamp',   'Spot Lumineux',  'eclairage','🔦', undefined, () => { const g = new THREE.Group(); g.add(cy(0.08,0.05,0.12,8,M('#333'),0,0,0)); const l=pl('#ffffff',2,6); l.position.set(0,-0.3,0); g.add(l); return g; });
A('walllamp',   'Applique Murale','eclairage','💡', undefined, () => { const g = new THREE.Group(); g.add(bx(0.15,0.2,0.1,mt('#555'),0,0,0)); g.add(cy(0.06,0.1,0.12,8,M('#f5deb3',{transparent:true,opacity:0.8}),0,-0.05,0.06)); const l=pl('#ffe4b5',1,4); l.position.set(0,0,0.2); g.add(l); return g; });
A('ledstrip',   'Bande LED',      'eclairage','🌈', undefined, () => { const g = new THREE.Group(); g.add(bx(2,0.02,0.02,em('#00e0ff',2),0,0,0)); g.add(bx(2.1,0.06,0.06,M('#00e0ff',{transparent:true,opacity:0.1}),0,0,0,false,false)); const l=pl('#00e0ff',1,4); l.position.set(0,-0.2,0); g.add(l); return g; });
A('ledrg',      'Bande LED RGB',  'eclairage','🌈', undefined, () => { const g = new THREE.Group(); g.add(bx(2,0.02,0.02,em('#ff3af2',2),0,0,0)); const l=pl('#ff3af2',1,4); l.position.set(0,-0.2,0); g.add(l); return g; });
A('floodlight', 'Projecteur',     'eclairage','🔦', undefined, () => { const g = new THREE.Group(); g.add(bx(0.15,0.1,0.3,M('#333'),0,0,0)); g.add(cy(0.07,0.04,0.12,8,M('#888'),0,0,0.18)); const l=new THREE.SpotLight('#ffffff',3,15,Math.PI/6,0.3); l.position.set(0,0,0.3); g.add(l); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ PRIMITIVE SHAPES ═══
// ═══════════════════════════════════════════════════════════════

A('cube',       'Cube',           'formes','🟦', undefined, () => { const g = new THREE.Group(); g.add(bx(1,1,1,M('#3b82f6'),0,0.5,0)); return g; });
A('sphere',     'Sphère',         'formes','⚪', undefined, () => { const g = new THREE.Group(); g.add(sp(0.5,M('#8b5cf6'),0,0.5,0)); return g; });
A('cylinder',   'Cylindre',       'formes','🥫', undefined, () => { const g = new THREE.Group(); g.add(cy(0.5,0.5,1,16,M('#22c55e'),0,0.5,0)); return g; });
A('coneShape',  'Cône',           'formes','🔺', undefined, () => { const g = new THREE.Group(); g.add(cn(0.5,1,12,M('#f59e0b'),0,0.5,0)); return g; });
A('torusShape', 'Tore',           'formes','🍩', undefined, () => { const g = new THREE.Group(); g.add(tor(0.4,0.15,M('#e74c3c'),0,0.5,0)); return g; });
A('planeShape', 'Plan',           'formes','⬜', undefined, () => { const g = new THREE.Group(); g.add(bx(2,0.02,2,M('#aaa'),0,0.01,0,false,true)); return g; }, true);
A('ramp',       'Rampe',          'formes','📐', undefined, () => { const g = new THREE.Group(); const r = bx(1.5,0.08,3,cc()); r.position.set(0,0.5,0); r.rotation.x=-0.2; r.receiveShadow=true; g.add(r); return g; }, true);
A('arch',       'Arche',          'formes','🏛️',undefined, () => { const g = new THREE.Group(); g.add(bx(0.3,2,0.3,cc(),-1,1,0)); g.add(bx(0.3,2,0.3,cc(),1,1,0)); const a=new THREE.Mesh(new THREE.TorusGeometry(1,0.15,8,16,Math.PI),cc()); a.position.set(0,2,0); a.rotation.z=Math.PI; a.castShadow=true; g.add(a); return g; });
A('halfpipe',   'Demi-Cylindre',  'formes','🌓', undefined, () => { const g = new THREE.Group(); const hp=new THREE.Mesh(new THREE.CylinderGeometry(1,1,2,16,1,false,0,Math.PI),M('#555')); hp.rotation.z=Math.PI/2; hp.position.set(0,0,0); hp.castShadow=true; g.add(hp); return g; });
A('wedge',      'Coin Géométrique','formes','📐',undefined, () => { const g = new THREE.Group(); g.add(bx(1,0.5,1,M('#f59e0b'),0,0.25,0)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ PRISON ═══
// ═══════════════════════════════════════════════════════════════

A('bunkprison',    'Lit Prison',        'prison','🛏️', undefined, () => { const g = new THREE.Group(); g.add(bx(1,0.08,2,mt('#555'),0,0.4,0)); g.add(bx(1,0.08,2,mt('#555'),0,1.4,0)); g.add(bx(0.04,2,0.04,mt('#666'),-0.48,1,0.96)); g.add(bx(0.04,2,0.04,mt('#666'),0.48,1,0.96)); g.add(bx(0.04,2,0.04,mt('#666'),-0.48,1,-0.96)); g.add(bx(0.04,2,0.04,mt('#666'),0.48,1,-0.96)); return g; });
A('metaltoilet',   'Toilette Acier',    'prison','🚽', undefined, () => { const g = new THREE.Group(); g.add(bx(0.4,0.4,0.55,mt('#888'),0,0.2,0)); g.add(cy(0.18,0.2,0.06,12,mt('#999'),0,0.42,0.05)); return g; });
A('celldoor',      'Porte Cellule',     'prison','⛓️',[1.2,2.4,0.1], () => { const g = new THREE.Group(); g.add(bx(1.2,2.4,0.04,mt('#444'),0,1.2,0)); for(let i=0;i<5;i++) g.add(cy(0.02,0.02,2.4,6,mt('#666'),-0.4+i*0.2,1.2,0.03)); return g; });
A('benchpress',    'Banc Développé',    'prison','💪', undefined, () => { const g = new THREE.Group(); g.add(bx(1.2,0.35,0.4,mt('#555'),0,0.175,0)); g.add(bx(0.04,1,0.04,mt('#666'),-0.58,0.5,0)); g.add(bx(0.04,1,0.04,mt('#666'),0.58,0.5,0)); g.add(bx(1.3,0.04,0.04,mt('#777'),0,0.95,0)); return g; });
A('cctvscreen',    'Mur Écrans CCTV',   'prison','📺', undefined, () => { const g = new THREE.Group(); for(let r=0;r<2;r++) for(let c=0;c<3;c++){g.add(bx(0.5,0.35,0.03,M('#111'),-0.55+c*0.55,0.2+r*0.4,0));g.add(bx(0.45,0.3,0.01,M('#1a3a5c'),-0.55+c*0.55,0.2+r*0.4,0.02,false,false));} return g; });
A('ctrlpanel',     'Pupitre Contrôle',  'prison','🎛️', undefined, () => { const g = new THREE.Group(); g.add(bx(1.2,0.8,0.5,mt('#444'),0,0.4,0)); g.add(bx(1.15,0.04,0.45,mt('#333'),0,0.82,0)); for(let i=0;i<4;i++) g.add(cy(0.03,0.03,0.02,8,M(i<2?'#e74c3c':'#22c55e'),-0.3+i*0.2,0.85,0.1)); return g; });
A('exerciseyard',  'Cour de Promenade', 'prison','🏃', undefined, () => { const g = new THREE.Group(); g.add(bx(8,0.06,8,cc('#888'),0,0.03,0,false,true)); for(let i=0;i<4;i++){g.add(cy(0.04,0.04,3,8,mt('#555'),-3.8+i*2.5,1.5,-3.8));g.add(cy(0.04,0.04,3,8,mt('#555'),-3.8+i*2.5,1.5,3.8));} g.add(bx(8,0.1,0.05,mt('#666'),0,2.5,-3.8)); g.add(bx(8,0.1,0.05,mt('#666'),0,2.5,3.8)); return g; });
A('prisonwall',    'Mur Prison',        'prison','🧱',[4,4,0.2],  () => { const g = new THREE.Group(); g.add(bx(4,4,0.2,cc('#666'),0,2,0)); g.add(bx(4.1,0.15,0.25,cc('#555'),0,4.075,0)); return g; });
A('barbed',        'Fil Barbelé',       'prison','⚡', undefined, () => { const g = new THREE.Group(); const bwire = cy(0.01,0.01,3,4,mt('#888'),0,0,0); bwire.rotation.z=Math.PI/2; g.add(bwire); for(let i=0;i<12;i++) g.add(bx(0.02,0.04,0.01,mt('#888'),-1.4+i*0.25,0.02,(i%2)*0.02,false,false)); return g; });
A('watchtower',    'Tour de Garde',     'prison','🗼',[2,6,2],    () => { const g = new THREE.Group(); const pm=mt('#555'); g.add(bx(0.15,5,0.15,pm,-0.9,2.5,-0.9)); g.add(bx(0.15,5,0.15,pm,0.9,2.5,-0.9)); g.add(bx(0.15,5,0.15,pm,-0.9,2.5,0.9)); g.add(bx(0.15,5,0.15,pm,0.9,2.5,0.9)); g.add(bx(2.2,0.1,2.2,cc('#666'),0,5,0)); g.add(bx(2,1.5,2,gls(0.2),0,5.8,0,false,false)); g.add(bx(2.2,0.1,2.2,cc('#666'),0,6.6,0)); return g; });
A('prisonbed',     'Lit Cellule',       'prison','🛏️', undefined, () => { const g = new THREE.Group(); g.add(bx(0.9,0.06,2,mt('#555'),0,0.38,0)); g.add(bx(0.88,0.08,1.85,M('#888888'),0,0.45,0.02)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ HOTEL ═══
// ═══════════════════════════════════════════════════════════════

A('hoteldoor',    'Porte Hôtel',       'hotel','🚪',[1.1,2.3,0.1],  () => { const g = new THREE.Group(); g.add(bx(1.1,2.3,0.06,wd('#5c3a1e'),0,1.15,0)); g.add(bx(0.15,0.06,0.04,mt('#888'),0.4,1.1,0.05)); g.add(bx(0.08,0.12,0.03,M('#22c55e',{emissive:'#22c55e',emissiveIntensity:0.5}),0.45,1.3,0.05,false,false)); return g; });
A('hotelbed',     'Lit King Hôtel',    'hotel','🛏️', undefined,      () => { const g = new THREE.Group(); g.add(bx(2.2,0.25,2.4,M('#1a1a2e',{metalness:0.3}),0,0.15,0)); g.add(bx(2.2,1.2,0.1,M('#1a1a2e',{metalness:0.2}),0,0.9,-1.15)); g.add(bx(2,0.25,2.2,M('#f5f5f5'),0,0.4,0)); g.add(bx(0.5,0.15,0.4,M('#e8e8e8'),-0.6,0.6,-0.85)); g.add(bx(0.5,0.15,0.4,M('#e8e8e8'),0.6,0.6,-0.85)); g.add(bx(1.9,0.08,1.4,M('#2d3748'),0,0.55,0.3)); g.add(bx(2,0.02,2.2,M('#8b5cf6',{emissive:'#8b5cf6',emissiveIntensity:0.4,transparent:true,opacity:0.5}),0,0.03,0,false,false)); return g; });
A('reception',    'Comptoir Réception','hotel','🛎️', undefined,      () => { const g = new THREE.Group(); g.add(bx(3,1.1,0.8,M('#1a1a2e',{metalness:0.2}),0,0.55,0)); g.add(bx(3.05,0.05,0.85,M('#1f2937',{metalness:0.4}),0,1.1,0)); g.add(bx(0.4,0.3,0.03,M('#1e3a5f',{emissive:'#3b82f6',emissiveIntensity:0.3}),1,0.95,-0.15)); return g; });
A('minibar',      'Mini-Bar',          'hotel','🍷', undefined,      () => { const g = new THREE.Group(); g.add(bx(0.8,1,0.6,M('#111827',{metalness:0.3}),0,0.5,0)); g.add(bx(0.02,0.8,0.5,M('#1f2937',{metalness:0.5}),0.41,0.5,0)); g.add(bx(0.02,0.3,0.03,M('#aaa',{metalness:0.9}),0.42,0.5,0)); return g; });
A('safebox',      'Coffre-Fort',       'hotel','🔒', undefined,      () => { const g = new THREE.Group(); g.add(bx(0.45,0.4,0.4,M('#1f2937',{metalness:0.5}),0,0.2,0)); g.add(bx(0.02,0.2,0.02,M('#aaa',{metalness:0.9}),0.23,0.2,0)); g.add(bx(0.12,0.12,0.01,M('#00ff00',{emissive:'#00ff00',emissiveIntensity:0.3}),0.15,0.28,0.21,false,false)); return g; });
A('hotelluggage', 'Chariot Bagages',   'hotel','🧳', undefined,      () => { const g = new THREE.Group(); g.add(bx(0.8,0.8,0.5,M('#d4a843'),0,0.4,0)); g.add(bx(0.04,1,0.04,M('#d4a843'),-0.38,0.5,-0.23)); g.add(bx(0.04,1,0.04,M('#d4a843'),0.38,0.5,-0.23)); g.add(bx(0.8,0.04,0.04,M('#d4a843'),0,1,0.23)); return g; });
A('hotelsign',    'Enseigne Hôtel',    'hotel','🏨', undefined,      () => { const g = new THREE.Group(); g.add(bx(3,0.8,0.1,M('#1a1a2e'),0,0,0)); g.add(bx(2.8,0.6,0.05,M('#ff6a00',{emissive:'#ff6a00',emissiveIntensity:1}),0,0,0.06,false,false)); const l=pl('#ff6a00',2,8); l.position.set(0,0,1); g.add(l); return g; });
A('bellhop',      'Cloche Réception',  'hotel','🛎️', undefined,      () => { const g = new THREE.Group(); g.add(cy(0.1,0.12,0.02,16,M('#d4a843'),0,0.01,0)); g.add(cy(0.08,0.01,0.06,12,M('#d4a843'),0,0.05,0)); return g; });
A('hotelcarpet',  'Tapis Hôtel',       'hotel','🟫', undefined,      () => { const g = new THREE.Group(); g.add(bx(3,0.015,2,M('#1a1a2a'),0,0.008,0,false,true)); g.add(bx(2.8,0.018,1.8,M('#2d1a3a'),0,0.012,0,false,true)); return g; }, true);
A('hotelsofa',    'Canapé Hôtel',      'hotel','🛋️', undefined,      () => { const g = new THREE.Group(); const m=lr('#1a0a05'); g.add(bx(2.2,0.22,0.9,m,0,0.33,0)); g.add(bx(2.2,0.5,0.1,m,0,0.6,-0.4)); g.add(bx(0.12,0.35,0.9,m,-1.04,0.5,0)); g.add(bx(0.12,0.35,0.9,m,1.04,0.5,0)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ COMMERCE ═══
// ═══════════════════════════════════════════════════════════════

A('atm',          'Guichet ATM',          'commerce','🏧', undefined, () => { const g = new THREE.Group(); g.add(bx(0.6,1.5,0.4,M('#1a365d'),0,0.75,0)); g.add(bx(0.45,0.35,0.02,M('#1e3a5f',{emissive:'#3b82f6',emissiveIntensity:0.3}),0,1.1,0.2,false,false)); g.add(bx(0.35,0.15,0.01,M('#333'),0,0.75,0.2,false,false)); return g; });
A('cashregister', 'Caisse Enregistreuse', 'commerce','💰', undefined, () => { const g = new THREE.Group(); g.add(bx(0.4,0.25,0.35,M('#333'),0,0.125,0)); g.add(bx(0.35,0.2,0.02,M('#1a3a5c',{emissive:'#3b82f6',emissiveIntensity:0.2}),0,0.28,0.15,false,false)); g.add(bx(0.38,0.04,0.2,M('#444'),0,0.02,0.2)); return g; });
A('shopshelf',    'Étagère Magasin',      'commerce','🛒', undefined, () => { const g = new THREE.Group(); const s=mt('#888'); g.add(bx(1.5,2,0.04,s,0,1,-0.18)); g.add(bx(0.04,2,0.4,s,-0.73,1,0)); g.add(bx(0.04,2,0.4,s,0.73,1,0)); for(const y of[0.4,0.8,1.2,1.6]) g.add(bx(1.42,0.03,0.36,s,0,y,0)); return g; });
A('vending',      'Distributeur',         'commerce','🥤', undefined, () => { const g = new THREE.Group(); g.add(bx(0.8,1.8,0.6,M('#e74c3c'),0,0.9,0)); g.add(bx(0.65,1,0.02,gls(0.3),0,1.1,0.3,false,false)); g.add(bx(0.7,0.3,0.03,M('#fff'),0,0.3,0.3,false,false)); return g; });
A('gaspump',      'Pompe Essence',        'commerce','⛽', undefined, () => { const g = new THREE.Group(); g.add(bx(0.5,1.3,0.35,M('#f5f5f5'),0,0.65,0)); g.add(bx(0.4,0.3,0.02,M('#1a1a1a'),0,1.05,0.17,false,false)); g.add(cy(0.015,0.015,0.5,6,M('#333'),0.3,0.8,0.1)); return g; });
A('busstop',      'Arrêt de Bus',         'commerce','🚏', undefined, () => { const g = new THREE.Group(); g.add(cy(0.05,0.05,2.5,8,mt('#555'),0.8,1.25,0)); g.add(cy(0.05,0.05,2.5,8,mt('#555'),-0.8,1.25,0)); g.add(bx(1.8,0.08,1,gls(0.2),0,2.5,0)); g.add(bx(1.8,2,0.02,gls(0.15),0,1.25,-0.48,false,false)); g.add(bx(1.2,0.06,0.4,mt('#555'),0,0.5,0)); return g; });
A('neonopen',     'Néon OPEN',            'commerce','💫', undefined, () => { const g = new THREE.Group(); g.add(bx(0.6,0.25,0.03,M('#111'),0,0,0)); g.add(bx(0.5,0.15,0.01,M('#22c55e',{emissive:'#22c55e',emissiveIntensity:1.5}),0,0,0.02,false,false)); const l=pl('#22c55e',1,4); l.position.set(0,0,0.5); g.add(l); return g; });
A('shopsign',     'Enseigne Magasin',     'commerce','🪧', undefined, () => { const g = new THREE.Group(); g.add(bx(2,0.6,0.08,M('#2980b9'),0,0,0)); g.add(bx(1.8,0.4,0.02,M('#fff'),0,0,0.05,false,false)); return g; });
A('cart',         'Chariot Courses',      'commerce','🛒', undefined, () => { const g = new THREE.Group(); g.add(bx(0.5,0.5,0.8,mt('#888'),0,0.6,0)); for(const [px,pz] of [[-0.23,-.38],[0.23,-.38],[-0.23,.38],[0.23,.38]]) g.add(bx(0.04,0.3,0.04,mt('#888'),px,0.3,pz)); return g; });
A('icecream',     'Congélateur Glaces',   'commerce','🍦', undefined, () => { const g = new THREE.Group(); g.add(bx(1.2,0.9,0.7,M('#fff'),0,0.45,0)); g.add(bx(1.1,0.02,0.6,gls(0.3),0,0.92,0,false,false)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ FOOD / PROPS ═══
// ═══════════════════════════════════════════════════════════════

A('pizzabox',   'Boîte Pizza',      'deco','🍕', undefined, () => { const g = new THREE.Group(); g.add(bx(0.35,0.04,0.35,M('#c4a35a'),0,0.02,0)); return g; });
A('burger',     'Burger',           'deco','🍔', undefined, () => { const g = new THREE.Group(); g.add(cy(0.08,0.1,0.04,12,M('#D2691E'),0,0.02,0)); g.add(cy(0.09,0.09,0.03,12,M('#8B4513'),0,0.055,0)); g.add(cy(0.08,0.08,0.02,12,M('#228B22'),0,0.075,0)); g.add(cy(0.1,0.08,0.04,12,M('#D2691E'),0,0.1,0)); return g; });
A('coffeecup',  'Café Tim Hortons', 'deco','☕', undefined, () => { const g = new THREE.Group(); g.add(cy(0.04,0.035,0.1,12,M('#8B4513'),0,0.05,0)); g.add(cy(0.042,0.042,0.01,12,M('#f5f5f5'),0,0.105,0)); return g; });
A('beerbottle', 'Bière',            'deco','🍺', undefined, () => { const g = new THREE.Group(); g.add(cy(0.035,0.04,0.2,8,M('#1a5c1a'),0,0.1,0)); g.add(cy(0.015,0.015,0.08,6,M('#1a5c1a'),0,0.24,0)); return g; });
A('donuts',     'Boîte Donuts',     'deco','🍩', undefined, () => { const g = new THREE.Group(); g.add(bx(0.3,0.08,0.3,M('#f5c6a0'),0,0.04,0)); return g; });
A('hotdog',     'Hot Dog',          'deco','🌭', undefined, () => { const g = new THREE.Group(); g.add(bx(0.15,0.04,0.06,M('#D2691E'),0,0.02,0)); const hw=cy(0.02,0.02,0.12,8,M('#c0392b'),0,0.05,0); hw.rotation.z=Math.PI/2; g.add(hw); return g; });
A('fries',      'Frites',           'deco','🍟', undefined, () => { const g = new THREE.Group(); g.add(bx(0.08,0.12,0.06,M('#e74c3c'),0,0.06,0)); for(let i=0;i<5;i++) g.add(bx(0.01,0.1,0.01,M('#f1c40f'),-0.02+i*0.01,0.14,0,false,false)); return g; });
A('wineglass',  'Verre à Vin',      'deco','🍷', undefined, () => { const g = new THREE.Group(); g.add(cy(0.04,0.06,0.14,12,gls(0.4),0,0.07,0)); g.add(cy(0.005,0.005,0.12,6,gls(0.3),0,0.2,0)); g.add(cy(0.045,0.045,0.015,12,gls(0.3),0,0.255,0)); return g; });
A('plate',      'Assiette',         'deco','🍽️', undefined, () => { const g = new THREE.Group(); g.add(cy(0.12,0.13,0.02,24,M('#f5f5f5'),0,0.01,0)); g.add(cy(0.1,0.1,0.015,24,M('#eeeeee'),0,0.02,0)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ ELECTRONICS ═══
// ═══════════════════════════════════════════════════════════════

A('tv65',     'TV 65" 4K',         'electronique','📺', undefined, () => { const g = new THREE.Group(); g.add(bx(1.8,1,0.04,M('#111'),0,1.5,0)); g.add(bx(1.7,0.9,0.02,M('#0a1628',{emissive:'#3b82f6',emissiveIntensity:0.2}),0,1.5,0.03,false,false)); g.add(bx(0.15,0.4,0.15,M('#111'),0,0.8,0)); g.add(bx(0.4,0.02,0.25,M('#111'),0,0.6,0)); return g; });
A('gamingpc', 'PC Gamer',          'electronique','🖥️', undefined, () => { const g = new THREE.Group(); g.add(bx(0.22,0.5,0.45,M('#111'),0,0.25,0)); g.add(bx(0.2,0.48,0.02,gls(0.2),0.11,0.26,0,false,false)); g.add(bx(0.18,0.02,0.43,M('#8b5cf6',{emissive:'#8b5cf6',emissiveIntensity:0.5}),0,0.02,0,false,false)); return g; });
A('speaker',  'Enceinte JBL',      'electronique','🔊', undefined, () => { const g = new THREE.Group(); g.add(cy(0.1,0.12,0.25,16,M('#222'),0,0.125,0)); g.add(cy(0.08,0.08,0.02,16,M('#333'),0,0.25,0)); return g; });
A('laptop',   'Laptop',            'electronique','💻', undefined, () => { const g = new THREE.Group(); g.add(bx(0.35,0.015,0.25,M('#333'),0,0.008,0)); const screen=bx(0.34,0.23,0.01,M('#222'),0,0.13,-0.12); screen.rotation.x=-0.2; g.add(screen); g.add(bx(0.3,0.18,0.005,M('#1a2a4a',{emissive:'#3b82f6',emissiveIntensity:0.15}),0,0.14,-0.115,false,false)); return g; });
A('phone',    'Téléphone',         'electronique','📱', undefined, () => { const g = new THREE.Group(); g.add(bx(0.07,0.14,0.008,M('#222'),0,0.07,0)); g.add(bx(0.06,0.12,0.003,M('#1a1a2e',{emissive:'#3b82f6',emissiveIntensity:0.1}),0,0.07,0.005,false,false)); return g; });
A('printer',  'Imprimante',        'electronique','🖨️', undefined, () => { const g = new THREE.Group(); g.add(bx(0.4,0.2,0.35,M('#e8e8e8'),0,0.1,0)); g.add(bx(0.35,0.05,0.2,M('#ddd'),0,0.22,0.05)); return g; });
A('router',   'Routeur WiFi',      'electronique','📶', undefined, () => { const g = new THREE.Group(); g.add(bx(0.2,0.04,0.15,M('#222'),0,0.02,0)); g.add(cy(0.005,0.005,0.15,4,M('#333'),0.06,0.1,0)); g.add(cy(0.005,0.005,0.15,4,M('#333'),-0.06,0.1,0)); g.add(sp(0.01,M('#22c55e',{emissive:'#22c55e',emissiveIntensity:0.8}),0.05,0.02,0.06)); return g; });
A('camera',   'Caméra CCTV',       'electronique','📹', undefined, () => { const g = new THREE.Group(); g.add(bx(0.08,0.06,0.12,M('#333'),0,0,0)); g.add(cy(0.03,0.04,0.08,8,M('#222'),0,0,0.08)); g.add(bx(0.06,0.04,0.04,mt('#555'),0,0.04,-0.06)); return g; });
A('console',  'Console Gaming',    'electronique','🎮', undefined, () => { const g = new THREE.Group(); g.add(bx(0.35,0.06,0.25,M('#222'),0,0.03,0)); g.add(bx(0.3,0.02,0.2,M('#333'),0,0.07,0)); g.add(cy(0.02,0.02,0.015,8,em('#8b5cf6',0.8),0.1,0.075,0)); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ SPECIAL ═══
// ═══════════════════════════════════════════════════════════════

A('spawnpoint',  'Point de Spawn',    'special','🎯', undefined, () => { const g = new THREE.Group(); g.add(cy(0.5,0.5,0.02,32,M('#22c55e',{emissive:'#22c55e',emissiveIntensity:0.5,transparent:true,opacity:0.4}),0,0.01,0)); g.add(cy(0.3,0.3,0.02,32,M('#22c55e',{emissive:'#22c55e',emissiveIntensity:0.8,transparent:true,opacity:0.6}),0,0.03,0)); const l=pl('#22c55e',1,5); l.position.set(0,0.5,0); g.add(l); return g; });
A('teleporter',  'Téléporteur',       'special','🌀', undefined, () => { const g = new THREE.Group(); g.add(cy(0.6,0.6,0.04,32,M('#8b5cf6',{emissive:'#8b5cf6',emissiveIntensity:0.8,transparent:true,opacity:0.5}),0,0.02,0)); g.add(cy(0.4,0.4,0.04,32,M('#a78bfa',{emissive:'#a78bfa',emissiveIntensity:1,transparent:true,opacity:0.7}),0,0.06,0)); const l=pl('#8b5cf6',2,6); l.position.set(0,0.5,0); g.add(l); return g; });
A('jobmarker',   'Marqueur Emploi',   'special','💼', undefined, () => { const g = new THREE.Group(); g.add(cy(0.4,0.4,0.02,32,M('#f59e0b',{emissive:'#f59e0b',emissiveIntensity:0.5,transparent:true,opacity:0.4}),0,0.01,0)); g.add(bx(0.3,0.4,0.02,M('#f59e0b',{emissive:'#f59e0b',emissiveIntensity:0.8}),0,0.8,0)); const l=pl('#f59e0b',1,4); l.position.set(0,0.5,0); g.add(l); return g; });
A('shopmarker',  'Marqueur Magasin',  'special','🛍️', undefined, () => { const g = new THREE.Group(); g.add(cy(0.4,0.4,0.02,32,M('#3b82f6',{emissive:'#3b82f6',emissiveIntensity:0.5,transparent:true,opacity:0.4}),0,0.01,0)); g.add(bx(0.25,0.35,0.02,M('#3b82f6',{emissive:'#3b82f6',emissiveIntensity:0.8}),0,0.8,0)); const l=pl('#3b82f6',1,4); l.position.set(0,0.5,0); g.add(l); return g; });
A('campfire',    'Feu de Camp',       'special','🔥', undefined, () => { const g = new THREE.Group(); for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2; g.add(bx(0.15,0.12,0.12,M('#6b6b6b',{roughness:0.95}),Math.cos(a)*0.4,0.06,Math.sin(a)*0.4));} g.add(cn(0.2,0.6,6,M('#ff6b1a',{emissive:'#ff6b1a',emissiveIntensity:1,transparent:true,opacity:0.85}),0,0.55,0)); g.add(cn(0.12,0.4,6,M('#fbbf24',{emissive:'#fbbf24',emissiveIntensity:1.2,transparent:true,opacity:0.9}),0,0.48,0)); const l=pl('#ff8833',3,10); l.position.set(0,0.7,0); g.add(l); return g; });
A('flag',        'Drapeau Québec',    'special','🏳️', undefined, () => { const g = new THREE.Group(); g.add(cy(0.03,0.03,3,8,mt('#888'),0,1.5,0)); g.add(bx(1,0.6,0.01,M('#003DA5'),0.5,2.7,0)); return g; });
A('flagcanada',  'Drapeau Canada',    'special','🍁',  undefined, () => { const g = new THREE.Group(); g.add(cy(0.03,0.03,3,8,mt('#888'),0,1.5,0)); g.add(bx(1,0.6,0.01,M('#FF0000'),0.5,2.7,0)); return g; });
A('tent',        'Tente',             'special','⛺',  undefined, () => { const g = new THREE.Group(); const tm=M('#27ae60'); const tl=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.04,2),tm); tl.position.set(-0.5,0.9,0); tl.rotation.z=0.6; tl.castShadow=true; g.add(tl); const tr=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.04,2),tm); tr.position.set(0.5,0.9,0); tr.rotation.z=-0.6; tr.castShadow=true; g.add(tr); return g; });
A('barrel2',     'Baril Explosif',    'special','💣',  undefined, () => { const g = new THREE.Group(); g.add(cy(0.25,0.25,0.9,16,M('#e74c3c'),0,0.45,0)); g.add(cy(0.26,0.26,0.03,16,mt('#555'),0,0.1,0)); g.add(cy(0.26,0.26,0.03,16,mt('#555'),0,0.8,0)); return g; });
A('toolbox',     'Boîte à Outils',   'special','🧰',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.4,0.2,0.2,M('#e74c3c'),0,0.1,0)); g.add(bx(0.2,0.06,0.04,mt('#888'),0,0.23,0)); return g; });
A('medkit',      'Kit Médical',       'special','🏥',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.3,0.2,0.1,M('#fff'),0,0.1,0)); g.add(bx(0.1,0.01,0.06,M('#e74c3c'),0,0.21,0,false,false)); g.add(bx(0.03,0.01,0.06,M('#e74c3c'),0,0.21,0,false,false)); return g; });
A('generator',   'Génératrice',       'special','⚡',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.8,0.5,0.45,M('#3a3a3a'),0,0.25,0)); g.add(bx(0.6,0.4,0.4,M('#444'),0,0.3,0)); g.add(cy(0.04,0.04,0.3,6,M('#888'),0.35,0.5,0.15)); return g; });
A('cctvcam',     'Caméra Murale',     'special','📷',  undefined, () => { const g = new THREE.Group(); g.add(bx(0.12,0.08,0.2,M('#222'),0,0,0)); g.add(cy(0.03,0.04,0.1,8,M('#111'),0,0,0.12)); g.add(bx(0.1,0.06,0.05,mt('#444'),0,0.05,-0.1)); const l=new THREE.PointLight('#ff0000',0.2,2); l.position.set(0,0,-0.05); g.add(l); return g; });

// ═══════════════════════════════════════════════════════════════
//  ═══ GARAGE / ATELIER ═══
// ═══════════════════════════════════════════════════════════════

A('toolrack',  'Râtelier Outils', 'special', '🔧', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.5, 1.2, 0.04, M('#444'), 0, 0.6, 0));
  for (const [tx, ty] of [[-0.5, 0.9], [0, 0.9], [0.5, 0.9], [-0.5, 0.55], [0.5, 0.55]]) {
    g.add(bx(0.02, 0.3, 0.1, mt('#888'), tx, ty, 0.06));
  }
  return g;
});

A('workbench', 'Établi', 'special', '🔨', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(1.8, 0.08, 0.8, wd('#5c3a1e'), 0, 0.9, 0));
  for (const [px, pz] of [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]]) {
    g.add(bx(0.07, 0.9, 0.07, wd('#4a2a12'), px, 0.45, pz));
  }
  g.add(bx(1.8, 0.4, 0.78, M('#555'), 0, 0.2, 0));
  return g;
});

A('carjack', 'Cric Auto', 'special', '🚗', undefined, () => {
  const g = new THREE.Group();
  g.add(bx(0.3, 0.08, 0.4, mt('#666'), 0, 0.04, 0));
  g.add(bx(0.06, 0.25, 0.06, mt('#555'), 0, 0.165, 0));
  g.add(bx(0.2, 0.04, 0.2, mt('#777'), 0, 0.29, 0));
  return g;
});

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

export const MODEL_DEFS: ModelDef[] = Object.values(O);

export const CATEGORIES: { key: ObjectCategory; label: string; icon: string }[] = [
  { key: 'structures',   label: 'Structures',    icon: '🏗️' },
  { key: 'meubles',      label: 'Meubles',       icon: '🛋️' },
  { key: 'cuisine',      label: 'Cuisine',       icon: '🍳' },
  { key: 'sdb',          label: 'Salle de Bain', icon: '🚿' },
  { key: 'exterieur',    label: 'Extérieur',     icon: '🌳' },
  { key: 'routes',       label: 'Routes',        icon: '🛣️' },
  { key: 'deco',         label: 'Décoration',    icon: '✨' },
  { key: 'eclairage',    label: 'Éclairage',     icon: '💡' },
  { key: 'formes',       label: 'Formes',        icon: '⚪' },
  { key: 'prison',       label: 'Prison',        icon: '⛓️' },
  { key: 'hotel',        label: 'Hôtel',         icon: '🏨' },
  { key: 'commerce',     label: 'Commerce',      icon: '🛒' },
  { key: 'electronique', label: 'Électronique',  icon: '💻' },
  { key: 'special',      label: 'Spécial',       icon: '🎯' },
];