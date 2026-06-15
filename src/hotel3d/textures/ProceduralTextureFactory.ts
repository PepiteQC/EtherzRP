// src/hotel3d/textures/ProceduralTextureFactory.ts

import * as THREE from 'three';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function createCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  return [cv, cv.getContext('2d')!];
}

function smoothNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  scale: number,
  alpha: number,
  color: [number, number, number]
): void {
  const step = Math.max(1, Math.floor(size / scale));
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const v = Math.random();
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${v * alpha})`;
      ctx.fillRect(x, y, step + 1, step + 1);
    }
  }
}

function applyGrain(ctx: CanvasRenderingContext2D, size: number, amount: number): void {
  const id = ctx.getImageData(0, 0, size, size);
  const px = id.data;
  for (let i = 0; i < px.length; i += 4) {
    const n = (Math.random() - 0.5) * amount * 2;
    px[i] = Math.min(255, Math.max(0, px[i] + n));
    px[i + 1] = Math.min(255, Math.max(0, px[i + 1] + n));
    px[i + 2] = Math.min(255, Math.max(0, px[i + 2] + n));
  }
  ctx.putImageData(id, 0, 0);
}

function wrap(cv: HTMLCanvasElement, rx: number, ry: number, aniso = 16): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = aniso;
  return tex;
}

// ─── CONCRETE ────────────────────────────────────────────────────────────────

export interface ConcreteOpts {
  baseR?: number; baseG?: number; baseB?: number;
  grain?: number; cracks?: number; stains?: number;
  formwork?: number; aoVar?: number; repeat?: number;
  size?: number;
}

export function createConcreteTexture(o: ConcreteOpts = {}): THREE.CanvasTexture {
  const {
    baseR = 68, baseG = 72, baseB = 80,
    grain = 3, cracks = 32, stains = 22,
    formwork = 12, aoVar = 28, repeat = 2,
    size = 1024,
  } = o;

  const [cv, c] = createCanvas(size);

  c.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
  c.fillRect(0, 0, size, size);

  for (let i = 0; i < 14; i++) {
    const bx = Math.random() * size, by = Math.random() * size;
    const br = 80 + Math.random() * 200;
    const g = c.createRadialGradient(bx, by, 0, bx, by, br);
    const d = (Math.random() - 0.5) * aoVar;
    const ch = d > 0 ? 255 : 0;
    g.addColorStop(0, `rgba(${ch},${ch},${ch},${(Math.abs(d) / 255) * 0.55})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(bx - br, by - br, br * 2, br * 2);
  }

  smoothNoise(c, size, 64, 0.06, [200, 195, 180]);
  smoothNoise(c, size, 32, 0.04, [0, 0, 0]);
  smoothNoise(c, size, 16, 0.025, [255, 255, 240]);
  applyGrain(c, size, grain);

  for (let b = 0; b < formwork; b++) {
    c.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.07})`;
    c.fillRect(0, (b / formwork) * size, size, 1.5 + Math.random() * 3);
  }

  for (let v = 0; v < 6; v++) {
    c.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.05})`;
    c.fillRect(Math.random() * size, 0, 1 + Math.random() * 1.5, size);
  }

  for (let s = 0; s < stains; s++) {
    const sx = Math.random() * size, sy = Math.random() * size * 0.6;
    const sw = 2 + Math.random() * 8, sh = 30 + Math.random() * 120;
    const sg = c.createLinearGradient(sx, sy, sx, sy + sh);
    sg.addColorStop(0, `rgba(0,0,0,${0.06 + Math.random() * 0.12})`);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg;
    c.fillRect(sx - sw / 2, sy, sw, sh);
  }

  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (let cr = 0; cr < cracks; cr++) {
    c.beginPath();
    let cx = Math.random() * size, cy = Math.random() * size;
    c.moveTo(cx, cy);
    const steps = 5 + Math.floor(Math.random() * 10);
    for (let st = 0; st < steps; st++) {
      cx += (Math.random() - 0.5) * 28;
      cy += (Math.random() - 0.5) * 28;
      c.lineTo(cx, cy);
    }
    c.strokeStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.14})`;
    c.lineWidth = 0.3 + Math.random() * 0.9;
    c.stroke();
  }

  for (let e = 0; e < 8; e++) {
    const ex = Math.random() * size, ey = Math.random() * size;
    const er = 5 + Math.random() * 20;
    const eg = c.createRadialGradient(ex, ey, 0, ex, ey, er);
    eg.addColorStop(0, `rgba(255,255,248,${0.06 + Math.random() * 0.1})`);
    eg.addColorStop(1, 'rgba(255,255,248,0)');
    c.fillStyle = eg;
    c.fillRect(ex - er, ey - er, er * 2, er * 2);
  }

  return wrap(cv, repeat, repeat);
}

// ─── NORMAL MAP ──────────────────────────────────────────────────────────────

export function createNormalTexture(size = 1024, strength = 1.6, repeat = 2): THREE.CanvasTexture {
  const [hcv, hc] = createCanvas(size);
  hc.fillStyle = 'black';
  hc.fillRect(0, 0, size, size);
  smoothNoise(hc, size, 48, 0.18, [255, 255, 255]);
  smoothNoise(hc, size, 20, 0.10, [200, 200, 200]);
  smoothNoise(hc, size, 8, 0.06, [180, 180, 180]);

  hc.lineCap = 'round';
  for (let cr = 0; cr < 20; cr++) {
    hc.beginPath();
    let cx = Math.random() * size, cy = Math.random() * size;
    hc.moveTo(cx, cy);
    for (let st = 0; st < 8; st++) {
      cx += (Math.random() - 0.5) * 25;
      cy += (Math.random() - 0.5) * 25;
      hc.lineTo(cx, cy);
    }
    hc.strokeStyle = 'rgba(0,0,0,0.3)';
    hc.lineWidth = 1 + Math.random() * 2;
    hc.stroke();
  }

  const hid = hc.getImageData(0, 0, size, size);
  const hpx = hid.data;
  const [ncv, nc] = createCanvas(size);
  const nid = nc.createImageData(size, size);
  const npx = nid.data;

  const getH = (x: number, y: number): number => {
    const xi = ((x % size) + size) % size;
    const yi = ((y % size) + size) % size;
    return hpx[(yi * size + xi) * 4] / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = getH(x + 1, y) - getH(x - 1, y);
      const dy = getH(x, y + 1) - getH(x, y - 1);
      const nx = -dx * strength, ny = -dy * strength, nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const idx = (y * size + x) * 4;
      npx[idx] = Math.floor((nx / len * 0.5 + 0.5) * 255);
      npx[idx + 1] = Math.floor((ny / len * 0.5 + 0.5) * 255);
      npx[idx + 2] = Math.floor((nz / len * 0.5 + 0.5) * 255);
      npx[idx + 3] = 255;
    }
  }
  nc.putImageData(nid, 0, 0);
  return wrap(ncv, repeat, repeat);
}

// ─── ROUGHNESS MAP ───────────────────────────────────────────────────────────

export function createRoughnessTexture(size = 1024, base = 0.78, repeat = 2): THREE.CanvasTexture {
  const [cv, c] = createCanvas(size);
  const b = Math.floor(base * 255);
  c.fillStyle = `rgb(${b},${b},${b})`;
  c.fillRect(0, 0, size, size);
  smoothNoise(c, size, 64, 0.12, [255, 255, 255]);
  smoothNoise(c, size, 16, 0.08, [0, 0, 0]);

  c.lineCap = 'round';
  for (let cr = 0; cr < 24; cr++) {
    c.beginPath();
    let cx = Math.random() * size, cy = Math.random() * size;
    c.moveTo(cx, cy);
    for (let s = 0; s < 7; s++) {
      cx += (Math.random() - 0.5) * 25;
      cy += (Math.random() - 0.5) * 25;
      c.lineTo(cx, cy);
    }
    c.strokeStyle = 'rgba(80,80,80,0.35)';
    c.lineWidth = 1.5;
    c.stroke();
  }
  return wrap(cv, repeat, repeat);
}

// ─── MARBLE ──────────────────────────────────────────────────────────────────

export function createMarbleTexture(size = 1024): THREE.CanvasTexture {
  const [cv, c] = createCanvas(size);
  c.fillStyle = '#c8b89a';
  c.fillRect(0, 0, size, size);
  smoothNoise(c, size, 120, 0.12, [255, 245, 220]);
  smoothNoise(c, size, 60, 0.08, [180, 155, 110]);

  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (let v = 0; v < 60; v++) {
    c.beginPath();
    let vx = Math.random() * size * 1.2 - size * 0.1;
    let vy = Math.random() * size;
    c.moveTo(vx, vy);
    for (let s = 0; s < 8 + Math.floor(Math.random() * 14); s++) {
      vx += (Math.random() - 0.3) * 40;
      vy += (Math.random() - 0.5) * 20;
      c.lineTo(vx, vy);
    }
    const a = 0.04 + Math.random() * 0.13;
    c.strokeStyle = Math.random() > 0.4 ? `rgba(80,60,40,${a})` : `rgba(255,245,220,${a * 0.6})`;
    c.lineWidth = 0.4 + Math.random() * 2.2;
    c.stroke();
  }

  const ts = size / 8;
  c.strokeStyle = 'rgba(100,85,65,0.35)';
  c.lineWidth = 2.5;
  for (let t = 0; t <= 8; t++) {
    c.beginPath(); c.moveTo(t * ts, 0); c.lineTo(t * ts, size); c.stroke();
    c.beginPath(); c.moveTo(0, t * ts); c.lineTo(size, t * ts); c.stroke();
  }
  applyGrain(c, size, 3);
  return wrap(cv, 3, 1.5);
}

// ─── ASPHALT ─────────────────────────────────────────────────────────────────

export function createAsphaltTexture(size = 1024): THREE.CanvasTexture {
  const [cv, c] = createCanvas(size);
  c.fillStyle = 'rgb(20,21,25)';
  c.fillRect(0, 0, size, size);
  smoothNoise(c, size, 8, 0.06, [60, 55, 50]);
  smoothNoise(c, size, 3, 0.04, [80, 75, 65]);

  for (let p = 0; p < 2000; p++) {
    const px = Math.random() * size, py = Math.random() * size;
    const pr = 0.5 + Math.random() * 2.5;
    const pg = c.createRadialGradient(px, py, 0, px, py, pr);
    const pv = 35 + Math.random() * 45;
    pg.addColorStop(0, `rgb(${pv},${pv - 2},${pv - 5})`);
    pg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = pg;
    c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }

  c.lineCap = 'round';
  for (let cr = 0; cr < 20; cr++) {
    c.beginPath();
    let cx = Math.random() * size, cy = Math.random() * size;
    c.moveTo(cx, cy);
    for (let s = 0; s < 6; s++) {
      cx += (Math.random() - 0.5) * 40;
      cy += (Math.random() - 0.5) * 40;
      c.lineTo(cx, cy);
    }
    c.strokeStyle = 'rgba(0,0,0,0.4)';
    c.lineWidth = 0.5 + Math.random();
    c.stroke();
  }
  return wrap(cv, 8, 8);
}

// ─── GLASS ───────────────────────────────────────────────────────────────────

export function createGlassTexture(size = 512): THREE.CanvasTexture {
  const [cv, c] = createCanvas(size);
  const g = c.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, 'rgba(80,130,180,0.25)');
  g.addColorStop(0.5, 'rgba(100,160,210,0.18)');
  g.addColorStop(1, 'rgba(60,100,150,0.28)');
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);

  for (let s = 0; s < 30; s++) {
    c.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.04})`;
    c.fillRect(Math.random() * size, 0, 1 + Math.random() * 3, size);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

// ─── METAL ───────────────────────────────────────────────────────────────────

export function createMetalTexture(size = 512): THREE.CanvasTexture {
  const [cv, c] = createCanvas(size);
  c.fillStyle = 'rgb(38,42,50)';
  c.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const v = 35 + Math.random() * 18;
    c.fillStyle = `rgba(${v},${v},${v + 4},0.5)`;
    c.fillRect(0, y, size, 1);
  }
  smoothNoise(c, size, 4, 0.05, [255, 255, 255]);
  return wrap(cv, 2, 2, 8);
}

// ─── WOOD ────────────────────────────────────────────────────────────────────

export function createWoodTexture(size = 1024): THREE.CanvasTexture {
  const [cv, c] = createCanvas(size);
  c.fillStyle = 'rgb(90,55,30)';
  c.fillRect(0, 0, size, size);

  for (let ring = 0; ring < 40; ring++) {
    const y = (ring / 40) * size;
    const h = size / 40;
    const v = 70 + Math.random() * 40;
    c.fillStyle = `rgba(${v},${v * 0.6},${v * 0.3},0.3)`;
    c.fillRect(0, y, size, h);
  }

  smoothNoise(c, size, 32, 0.08, [120, 80, 40]);
  smoothNoise(c, size, 8, 0.04, [60, 40, 20]);

  for (let k = 0; k < 8; k++) {
    const kx = Math.random() * size;
    const ky = Math.random() * size;
    const kr = 3 + Math.random() * 8;
    c.beginPath();
    c.arc(kx, ky, kr, 0, Math.PI * 2);
    c.fillStyle = `rgba(40,25,15,${0.3 + Math.random() * 0.3})`;
    c.fill();
  }

  applyGrain(c, size, 2);
  return wrap(cv, 2, 4);
}

// ─── CARPET ──────────────────────────────────────────────────────────────────

export function createCarpetTexture(size = 1024): THREE.CanvasTexture {
  const [cv, c] = createCanvas(size);
  c.fillStyle = 'rgb(35,30,28)';
  c.fillRect(0, 0, size, size);

  smoothNoise(c, size, 4, 0.08, [50, 45, 40]);
  smoothNoise(c, size, 2, 0.05, [30, 25, 22]);

  for (let y = 0; y < size; y += 2) {
    c.fillStyle = `rgba(${25 + Math.random() * 15},${20 + Math.random() * 12},${18 + Math.random() * 10},0.15)`;
    c.fillRect(0, y, size, 2);
  }

  applyGrain(c, size, 1.5);
  return wrap(cv, 4, 4);
}

// ─── LOBBY RUG ───────────────────────────────────────────────────────────────

export function createLobbyRugTexture(): THREE.CanvasTexture {
  const [cv, c] = createCanvas(512);

  c.fillStyle = '#14101a';
  c.fillRect(0, 0, 512, 512);

  c.strokeStyle = '#c9a84c'; c.lineWidth = 8;
  c.strokeRect(12, 12, 488, 488);
  c.strokeStyle = '#a07830'; c.lineWidth = 3;
  c.strokeRect(22, 22, 468, 468);
  c.strokeStyle = '#c9a84c'; c.lineWidth = 1.5;
  c.strokeRect(30, 30, 452, 452);

  c.strokeStyle = 'rgba(180,130,50,0.18)'; c.lineWidth = 1;
  for (let i = 50; i < 462; i += 40) {
    c.beginPath(); c.moveTo(i, 35); c.lineTo(i, 477); c.stroke();
    c.beginPath(); c.moveTo(35, i); c.lineTo(477, i); c.stroke();
  }

  c.strokeStyle = 'rgba(201,168,76,0.6)'; c.lineWidth = 2;
  c.beginPath(); c.arc(256, 256, 90, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(256, 256, 60, 0, Math.PI * 2); c.stroke();

  for (let p = 0; p < 8; p++) {
    const pa = (p / 8) * Math.PI * 2;
    c.beginPath();
    c.moveTo(256, 256);
    c.quadraticCurveTo(256 + Math.cos(pa + 0.4) * 80, 256 + Math.sin(pa + 0.4) * 80,
      256 + Math.cos(pa) * 90, 256 + Math.sin(pa) * 90);
    c.quadraticCurveTo(256 + Math.cos(pa - 0.4) * 80, 256 + Math.sin(pa - 0.4) * 80, 256, 256);
    c.fillStyle = 'rgba(160,110,30,0.25)'; c.fill();
    c.strokeStyle = 'rgba(201,168,76,0.5)'; c.lineWidth = 1; c.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

// ─── WALLPAPER ───────────────────────────────────────────────────────────────

export function createWallpaperTexture(size = 512): THREE.CanvasTexture {
  const [cv, c] = createCanvas(size);
  c.fillStyle = 'rgb(240,236,228)';
  c.fillRect(0, 0, size, size);

  c.strokeStyle = 'rgba(200,195,185,0.3)';
  c.lineWidth = 1;
  const stripe = size / 16;
  for (let i = 0; i < 16; i++) {
    c.beginPath(); c.moveTo(i * stripe, 0); c.lineTo(i * stripe, size); c.stroke();
  }

  smoothNoise(c, size, 32, 0.03, [210, 205, 195]);
  applyGrain(c, size, 1);
  return wrap(cv, 2, 2);
}

// ─── TEXTURE CACHE ───────────────────────────────────────────────────────────

export interface TextureSet {
  concreteMain: THREE.CanvasTexture;
  concreteDark: THREE.CanvasTexture;
  concreteLight: THREE.CanvasTexture;
  concretePanel: THREE.CanvasTexture;
  normalMain: THREE.CanvasTexture;
  normalPanel: THREE.CanvasTexture;
  roughMain: THREE.CanvasTexture;
  roughSmooth: THREE.CanvasTexture;
  marble: THREE.CanvasTexture;
  asphalt: THREE.CanvasTexture;
  glass: THREE.CanvasTexture;
  metal: THREE.CanvasTexture;
  wood: THREE.CanvasTexture;
  carpet: THREE.CanvasTexture;
  lobbyRug: THREE.CanvasTexture;
  wallpaper: THREE.CanvasTexture;
}

let _cache: TextureSet | null = null;

export function getTextureSet(): TextureSet {
  if (!_cache) {
    _cache = {
      concreteMain: createConcreteTexture({ baseR: 65, baseG: 70, baseB: 78, repeat: 3 }),
      concreteDark: createConcreteTexture({ baseR: 40, baseG: 45, baseB: 52, repeat: 2 }),
      concreteLight: createConcreteTexture({ baseR: 90, baseG: 93, baseB: 100, grain: 2, cracks: 16, repeat: 3 }),
      concretePanel: createConcreteTexture({ baseR: 72, baseG: 76, baseB: 84, formwork: 20, cracks: 10, repeat: 4 }),
      normalMain: createNormalTexture(1024, 2.0, 3),
      normalPanel: createNormalTexture(1024, 1.4, 4),
      roughMain: createRoughnessTexture(1024, 0.82, 3),
      roughSmooth: createRoughnessTexture(1024, 0.45, 2),
      marble: createMarbleTexture(1024),
      asphalt: createAsphaltTexture(1024),
      glass: createGlassTexture(512),
      metal: createMetalTexture(512),
      wood: createWoodTexture(1024),
      carpet: createCarpetTexture(1024),
      lobbyRug: createLobbyRugTexture(),
      wallpaper: createWallpaperTexture(512),
    };
  }
  return _cache;
}

export function disposeTextureSet(): void {
  if (_cache) {
    Object.values(_cache).forEach((t) => (t as THREE.CanvasTexture).dispose());
    _cache = null;
  }
}