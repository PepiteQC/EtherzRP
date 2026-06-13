'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface DoorData {
  id: number;
  aptId: number;
  aptNumber: string;
  tx: number;
  ty: number;
  side: 'left' | 'right';
  isLocked: boolean;
  ownerName: string | null;
  ownerId: number | null;
  rentPrice: number;
  isForRent: boolean;
  hasActivity: boolean;
  justChanged: boolean;
  furnitureLevel: number; // 0=vide, 1=basique, 2=meublé, 3=luxe
  securityLevel: number; // 0=aucune, 1=base, 2=avancée
}

interface AlertData {
  id: number;
  msg: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

interface FloorStats {
  unlocked: number;
  forRent: number;
  occupied: number;
  totalValue: number;
}

interface FloorAPIData {
  floorNumber?: number;
  apartments?: Array<{
    id: number;
    door_id: number;
    apt_number: string;
    door_locked: boolean;
    owner_name: string | null;
    owner_id: number | null;
    rent_price: number;
    is_for_rent: boolean;
    furniture_level?: number;
    security_level?: number;
  }>;
}

interface AvatarPosition {
  tx: number;
  ty: number;
}

interface DragState {
  active: boolean;
  startX: number;
  startCam: number;
}

interface TouchState {
  x: number;
  y: number;
  time: number;
  moved: boolean;
}

interface DrawCall {
  z: number;
  fn: () => void;
}

// ═══════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

// Tile dimensions
const TW = 72;
const TH = 36;
const WH = 96;
const DW = 28;
const DH = 72;

const TOTAL_DOORS = 20;
const DOORS_PER_SIDE = 10;
const CORRIDOR_LEN = 22;
const CORRIDOR_W = 6;
const CAM_MIN = -500;
const CAM_MAX = 500;
const HIT_RADIUS = 40;
const ALERT_DURATION_MS = 5000;
const ALERT_MAX = 4;
const CHANGE_FLASH_MS = 2000;
const DOUBLE_TAP_MS = 300;
const DRAG_THRESHOLD = 8;

// Decoration positions for corridor objects
const FIRE_EXTINGUISHER_POSITIONS = [3, 11, 19] as const;
const PLANT_POSITIONS = [1, 7, 13, 19] as const;
const PAINTING_POSITIONS = [2, 6, 10, 14, 18] as const;
const CARPET_COLORS = ['#1A0528', '#0A1528', '#15082A'] as const;
const FLOOR_SIGN_POSITIONS = [0, CORRIDOR_LEN - 1] as const;

const C = {
  bg: '#08080E',
  floor1: '#0E1018',
  floor2: '#111420',
  wall_L: '#141826',
  wall_R: '#0C0E18',
  violet: '#4A3AFF',
  cyan: '#00E0FF',
  magenta: '#FF3AF2',
  green: '#00FF9D',
  red: '#FF3A3A',
  orange: '#FF9A3A',
  yellow: '#FFD700',
  gold: '#C9A84C',
  light: '#F2F2F2',
  dim: 'rgba(242,242,242,0.4)',
  dimHex: '#9A9A9A',
  smoke: 'rgba(255,255,255,0.03)',
  darkPanel: 'rgba(6,6,14,0.97)',
} as const;

// Security level labels
const SECURITY_LABELS = ['Aucune', 'Serrure +', 'Blindée', 'Coffre-fort'] as const;
const FURNITURE_LABELS = ['Vide', 'Basique', 'Meublé', 'Luxe'] as const;

// ═══════════════════════════════════════════════════════════════
//  MATH ISO
// ═══════════════════════════════════════════════════════════════

function isoX(tx: number, ty: number, ox: number): number {
  return (tx - ty) * (TW / 2) + ox;
}

function isoY(tx: number, ty: number, oy: number): number {
  return (tx + ty) * (TH / 2) + oy;
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Deterministic pseudo-random from seed
function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function floorLabel(n: number): string {
  if (n === 0) return 'REZ-DE-CHAUSSÉE';
  if (n === 4) return 'PENTHOUSE';
  if (n === 1) return '1ER ÉTAGE';
  return `${n}E ÉTAGE`;
}

// ═══════════════════════════════════════════════════════════════
//  DOOR GENERATION
// ═══════════════════════════════════════════════════════════════

function generateDoors(floorData: FloorAPIData = {}): DoorData[] {
  return Array.from({ length: TOTAL_DOORS }, (_, i) => {
    const side: 'left' | 'right' = i < DOORS_PER_SIDE ? 'left' : 'right';
    const idx = i < DOORS_PER_SIDE ? i : i - DOORS_PER_SIDE;
    const ty = 1 + idx * 2;
    const tx = side === 'left' ? 0 : CORRIDOR_W - 1;
    const aptNum = `A-${floorData.floorNumber ?? 1}-${String(i + 1).padStart(2, '0')}`;
    const apt = floorData.apartments?.[i];

    return {
      id: apt?.door_id ?? i + 1,
      aptId: apt?.id ?? i + 1,
      aptNumber: apt?.apt_number ?? aptNum,
      tx,
      ty,
      side,
      isLocked: apt?.door_locked ?? true,
      ownerName: apt?.owner_name ?? null,
      ownerId: apt?.owner_id ?? null,
      rentPrice: apt?.rent_price ?? 600,
      isForRent: apt?.is_for_rent ?? true,
      hasActivity: false,
      justChanged: false,
      furnitureLevel: apt?.furniture_level ?? Math.floor(seededRand(i + 42) * 4),
      securityLevel: apt?.security_level ?? Math.floor(seededRand(i + 99) * 3),
    };
  });
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — FLOOR TILE
// ═══════════════════════════════════════════════════════════════

function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  col1: string,
  col2: string,
  alpha: number = 1
): void {
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x, y - TH / 2);
  ctx.lineTo(x + TW / 2, y);
  ctx.lineTo(x, y + TH / 2);
  ctx.lineTo(x - TW / 2, y);
  ctx.closePath();

  const g = ctx.createLinearGradient(x - TW / 2, y, x + TW / 2, y);
  g.addColorStop(0, col1);
  g.addColorStop(1, col2);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.strokeStyle = 'rgba(74,58,255,0.12)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — CARPET TILE (colored center strip)
// ═══════════════════════════════════════════════════════════════

function drawCarpetTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(x, y - TH / 4);
  ctx.lineTo(x + TW / 4, y);
  ctx.lineTo(x, y + TH / 4);
  ctx.lineTo(x - TW / 4, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — LEFT WALL
// ═══════════════════════════════════════════════════════════════

function drawWallLeft(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number = WH
): void {
  ctx.beginPath();
  ctx.moveTo(x - TW / 2, y);
  ctx.lineTo(x, y + TH / 2);
  ctx.lineTo(x, y + TH / 2 - h);
  ctx.lineTo(x - TW / 2, y - h);
  ctx.closePath();

  const g = ctx.createLinearGradient(x - TW / 2, y, x, y);
  g.addColorStop(0, '#191C2E');
  g.addColorStop(1, '#141826');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.strokeStyle = 'rgba(74,58,255,0.1)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Top trim accent line
  ctx.beginPath();
  ctx.moveTo(x - TW / 2, y - h + 5);
  ctx.lineTo(x, y + TH / 2 - h + 5);
  ctx.strokeStyle = 'rgba(74,58,255,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bottom baseboard
  ctx.beginPath();
  ctx.moveTo(x - TW / 2, y - 2);
  ctx.lineTo(x, y + TH / 2 - 2);
  ctx.lineTo(x, y + TH / 2);
  ctx.lineTo(x - TW / 2, y);
  ctx.closePath();
  ctx.fillStyle = '#0D0F1A';
  ctx.fill();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — RIGHT WALL
// ═══════════════════════════════════════════════════════════════

function drawWallRight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number = WH
): void {
  ctx.beginPath();
  ctx.moveTo(x + TW / 2, y);
  ctx.lineTo(x, y + TH / 2);
  ctx.lineTo(x, y + TH / 2 - h);
  ctx.lineTo(x + TW / 2, y - h);
  ctx.closePath();

  const g = ctx.createLinearGradient(x, y, x + TW / 2, y);
  g.addColorStop(0, '#0C0E18');
  g.addColorStop(1, '#0A0C14');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,224,255,0.06)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Top trim
  ctx.beginPath();
  ctx.moveTo(x, y + TH / 2 - h + 5);
  ctx.lineTo(x + TW / 2, y - h + 5);
  ctx.strokeStyle = 'rgba(0,224,255,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Bottom baseboard
  ctx.beginPath();
  ctx.moveTo(x, y + TH / 2 - 2);
  ctx.lineTo(x + TW / 2, y - 2);
  ctx.lineTo(x + TW / 2, y);
  ctx.lineTo(x, y + TH / 2);
  ctx.closePath();
  ctx.fillStyle = '#080A12';
  ctx.fill();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — DOOR IN WALL (unified left/right)
// ═══════════════════════════════════════════════════════════════

function drawDoorInWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  door: DoorData,
  t: number,
  hovered: boolean
): void {
  const { isLocked, side, justChanged, hasActivity, ownerName, isForRent, aptNumber, securityLevel } = door;
  const lockColor = isLocked ? C.red : C.green;
  const pulse = Math.sin(t * 0.004) * 0.4;
  const urgPulse = justChanged ? Math.abs(Math.sin(t * 0.01)) : 0;
  const isLeft = side === 'left';
  const sign = isLeft ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);

  // Door recess shadow
  ctx.beginPath();
  ctx.moveTo(sign * (DW + 4), -DH - TH / 2);
  ctx.lineTo(0, -DH - TH / 2 + DW * 0.3);
  ctx.lineTo(0, -TH / 2 + DW * 0.3);
  ctx.lineTo(sign * (DW + 4), -TH / 2);
  ctx.closePath();
  ctx.fillStyle = '#050508';
  ctx.fill();

  // Door panel
  ctx.beginPath();
  ctx.moveTo(sign * DW, -DH - TH / 2 + 4);
  ctx.lineTo(0, -DH - TH / 2 + 4 + DW * 0.28);
  ctx.lineTo(0, -TH / 2 + DW * 0.28);
  ctx.lineTo(sign * DW, -TH / 2 + 4);
  ctx.closePath();

  const pg = ctx.createLinearGradient(isLeft ? -DW : 0, -DH, isLeft ? 0 : DW, -DH);
  pg.addColorStop(0, isLocked ? '#1A0505' : '#051A10');
  pg.addColorStop(1, isLocked ? '#2A0808' : '#0A2A18');
  ctx.fillStyle = pg;
  ctx.fill();

  // Door panel decorative lines (wooden look)
  ctx.strokeStyle = isLocked ? 'rgba(255,58,58,0.08)' : 'rgba(0,255,157,0.08)';
  ctx.lineWidth = 0.5;
  for (let i = 1; i <= 3; i++) {
    const frac = i / 4;
    const yLine = -DH - TH / 2 + 4 + (DH - 4) * frac;
    ctx.beginPath();
    ctx.moveTo(sign * DW * 0.2, yLine + DW * 0.28 * (1 - frac));
    ctx.lineTo(sign * DW * 0.8, yLine + 4 * (1 - frac));
    ctx.stroke();
  }

  // Glowing border
  ctx.shadowColor = lockColor;
  ctx.shadowBlur = 8 + pulse * 6 + urgPulse * 12;
  ctx.strokeStyle = lockColor + (hovered ? 'EE' : '88');
  ctx.lineWidth = hovered ? 2.5 : 1;
  ctx.beginPath();
  ctx.moveTo(sign * DW, -DH - TH / 2 + 4);
  ctx.lineTo(0, -DH - TH / 2 + 4 + DW * 0.28);
  ctx.lineTo(0, -TH / 2 + DW * 0.28);
  ctx.lineTo(sign * DW, -TH / 2 + 4);
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Handle dot
  ctx.fillStyle = lockColor;
  ctx.shadowColor = lockColor;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(sign * 5, -TH / 2 - 14, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Peephole
  ctx.fillStyle = '#030308';
  ctx.beginPath();
  ctx.arc(sign * DW * 0.4, -DH / 2 - TH / 2 + 5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Security indicator (small shield icon based on level)
  if (securityLevel > 0) {
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = securityLevel >= 2 ? C.gold : C.dimHex;
    ctx.fillText('🛡'.repeat(Math.min(securityLevel, 3)), sign * DW * 0.5, -TH / 2 + DW * 0.28 - 6);
  }

  // Apartment number
  if (isLeft) {
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = hovered ? lockColor : C.dim;
    ctx.textAlign = 'center';
    ctx.fillText(aptNumber, -DW / 2 - 2, -DH / 2 - TH / 2 - 8);
  } else {
    ctx.save();
    ctx.rotate(0.27);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = hovered ? lockColor : C.dim;
    ctx.textAlign = 'center';
    ctx.fillText(aptNumber, DW / 2 + 2, -DH / 2 - TH / 2 - 8);
    ctx.restore();
  }

  // Lock icon
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = lockColor;
  ctx.shadowBlur = 8 + urgPulse * 10;
  ctx.fillStyle = lockColor;
  ctx.fillText(isLocked ? '🔒' : '🔓', sign * DW / 2, -DH - TH / 2 - 2);
  ctx.shadowBlur = 0;

  // Floor highlight on hover
  if (hovered) {
    ctx.beginPath();
    ctx.ellipse(0, 4, TW / 3, TH / 4, 0, 0, Math.PI * 2);
    const hg = ctx.createRadialGradient(0, 4, 0, 0, 4, TW / 3);
    hg.addColorStop(0, lockColor + '30');
    hg.addColorStop(1, 'transparent');
    ctx.fillStyle = hg;
    ctx.fill();
  }

  // "À LOUER" tag
  if (!ownerName && isForRent) {
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = C.yellow;
    ctx.shadowColor = C.yellow;
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText('À LOUER', sign * DW / 2, -WH + 8);
    ctx.shadowBlur = 0;
  }

  // Activity indicator
  if (hasActivity) {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👣', sign * DW / 2, -WH + 20);
  }

  // Owner name plate (small)
  if (ownerName) {
    ctx.font = '7px monospace';
    ctx.fillStyle = C.cyan + '88';
    ctx.textAlign = 'center';
    ctx.fillText(ownerName.slice(0, 10), sign * DW / 2, -TH / 2 + DW * 0.28 + 10);
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — CEILING LIGHT
// ═══════════════════════════════════════════════════════════════

function drawCeilingLight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  idx: number
): void {
  const phase = t * 0.003 + idx * 1.2;
  const bright = 0.6 + Math.sin(phase) * 0.2;

  ctx.save();
  ctx.translate(x, y - WH + 6);

  // Neon tube
  const neonG = ctx.createLinearGradient(-18, 0, 18, 0);
  neonG.addColorStop(0, 'rgba(0,224,255,0)');
  neonG.addColorStop(0.3, `rgba(0,224,255,${bright})`);
  neonG.addColorStop(0.7, `rgba(0,224,255,${bright})`);
  neonG.addColorStop(1, 'rgba(0,224,255,0)');
  ctx.fillStyle = neonG;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 14;
  ctx.fillRect(-18, -2, 36, 3);
  ctx.shadowBlur = 0;

  // Mounting bracket
  ctx.fillStyle = '#333';
  ctx.fillRect(-2, -4, 4, 3);

  // Floor light pool
  const floorG = ctx.createRadialGradient(0, WH - 10, 0, 0, WH - 10, 40);
  floorG.addColorStop(0, `rgba(0,224,255,${bright * 0.08})`);
  floorG.addColorStop(1, 'transparent');
  ctx.fillStyle = floorG;
  ctx.beginPath();
  ctx.ellipse(0, WH - 10, 40, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — FIRE EXTINGUISHER (wall decoration)
// ═══════════════════════════════════════════════════════════════

function drawFireExtinguisher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: 'left' | 'right'
): void {
  const sign = side === 'left' ? -1 : 1;
  ctx.save();
  ctx.translate(x, y);

  // Bracket
  ctx.fillStyle = '#333';
  ctx.fillRect(sign * 6 - 2, -WH + 30, 4, 2);

  // Cylinder body
  const bodyG = ctx.createLinearGradient(sign * 4, 0, sign * 8, 0);
  bodyG.addColorStop(0, '#CC1111');
  bodyG.addColorStop(1, '#881111');
  ctx.fillStyle = bodyG;

  ctx.beginPath();
  ctx.roundRect(sign * 4, -WH + 32, sign * 4, 18, 1);
  ctx.fill();

  // Nozzle
  ctx.fillStyle = '#222';
  ctx.fillRect(sign * 5, -WH + 30, sign * 2, 3);

  // Label
  ctx.fillStyle = '#FF3333';
  ctx.font = '5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧯', sign * 6, -WH + 55);

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — POTTED PLANT (wall decoration)
// ═══════════════════════════════════════════════════════════════

function drawPottedPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: 'left' | 'right',
  t: number,
  seed: number
): void {
  const sign = side === 'left' ? -1 : 1;
  const sway = Math.sin(t * 0.001 + seed) * 1.5;

  ctx.save();
  ctx.translate(x, y);

  // Pot
  ctx.fillStyle = '#2A1A0E';
  ctx.beginPath();
  ctx.moveTo(sign * 3, -2);
  ctx.lineTo(sign * 8, -2);
  ctx.lineTo(sign * 7, -12);
  ctx.lineTo(sign * 4, -12);
  ctx.closePath();
  ctx.fill();

  // Soil
  ctx.fillStyle = '#1A1008';
  ctx.fillRect(sign * 4, -13, sign * 3, 2);

  // Leaves
  const leafColors = ['#1A5A1A', '#2D6A1E', '#1A4A18'];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI - Math.PI / 2 + sway * 0.05;
    const len = 6 + seededRand(seed + i) * 4;
    const lx = sign * 5.5 + Math.cos(angle) * len * 0.3;
    const ly = -14 + Math.sin(angle) * len * 0.5 - len * 0.3;

    ctx.fillStyle = leafColors[i % leafColors.length];
    ctx.beginPath();
    ctx.ellipse(lx, ly, 2.5, 1.2, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — WALL PAINTING (wall decoration)
// ═══════════════════════════════════════════════════════════════

function drawWallPainting(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: 'left' | 'right',
  seed: number
): void {
  const sign = side === 'left' ? -1 : 1;
  const hue = (seed * 67) % 360;

  ctx.save();
  ctx.translate(x, y);

  // Frame
  ctx.strokeStyle = C.gold + '88';
  ctx.lineWidth = 1;
  ctx.strokeRect(sign * 3, -WH + 25, sign * 14, 16);

  // Canvas
  const artG = ctx.createLinearGradient(sign * 4, -WH + 26, sign * 16, -WH + 40);
  artG.addColorStop(0, `hsla(${hue}, 40%, 15%, 0.8)`);
  artG.addColorStop(0.5, `hsla(${(hue + 30) % 360}, 50%, 20%, 0.6)`);
  artG.addColorStop(1, `hsla(${(hue + 60) % 360}, 30%, 12%, 0.8)`);
  ctx.fillStyle = artG;
  ctx.fillRect(sign * 4, -WH + 26, sign * 12, 14);

  // Abstract shapes
  ctx.fillStyle = `hsla(${hue}, 60%, 50%, 0.3)`;
  ctx.beginPath();
  ctx.arc(sign * 8, -WH + 33, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsla(${(hue + 120) % 360}, 50%, 40%, 0.2)`;
  ctx.beginPath();
  ctx.arc(sign * 12, -WH + 35, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — FLOOR NUMBER SIGN
// ═══════════════════════════════════════════════════════════════

function drawFloorSign(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  floorNumber: number
): void {
  ctx.save();
  ctx.translate(x, y);

  // Sign background
  ctx.fillStyle = 'rgba(10,10,20,0.9)';
  ctx.strokeStyle = C.violet + '66';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-20, -WH + 15, 40, 18, 3);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = C.cyan;
  ctx.textAlign = 'center';
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 4;
  ctx.fillText(`ÉT. ${floorNumber}`, 0, -WH + 27);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — EMERGENCY EXIT SIGN
// ═══════════════════════════════════════════════════════════════

function drawExitSign(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  const blink = Math.sin(t * 0.005) > 0 ? 1 : 0.7;
  ctx.save();
  ctx.translate(x, y);

  ctx.globalAlpha = blink;
  ctx.fillStyle = '#004400';
  ctx.beginPath();
  ctx.roundRect(-14, -WH + 10, 28, 12, 2);
  ctx.fill();

  ctx.font = 'bold 7px monospace';
  ctx.fillStyle = C.green;
  ctx.textAlign = 'center';
  ctx.shadowColor = C.green;
  ctx.shadowBlur = 6;
  ctx.fillText('SORTIE →', 0, -WH + 19);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — SECURITY CAMERA
// ═══════════════════════════════════════════════════════════════

function drawSecurityCamera(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  side: 'left' | 'right'
): void {
  const sign = side === 'left' ? -1 : 1;
  const rotAngle = Math.sin(t * 0.0008) * 0.3;

  ctx.save();
  ctx.translate(x, y);

  // Mount
  ctx.fillStyle = '#333';
  ctx.fillRect(sign * 2 - 1, -WH + 8, 2, 4);

  // Camera body
  ctx.save();
  ctx.translate(sign * 2, -WH + 12);
  ctx.rotate(rotAngle * sign);

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.roundRect(-3, -2, 6, 4, 1);
  ctx.fill();

  // Lens
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(sign * 3, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // LED
  const ledOn = Math.sin(t * 0.003) > 0.5;
  ctx.fillStyle = ledOn ? C.red : '#440000';
  ctx.shadowColor = ledOn ? C.red : 'transparent';
  ctx.shadowBlur = ledOn ? 4 : 0;
  ctx.beginPath();
  ctx.arc(sign * -2, -1.5, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — CORRIDOR AVATAR
// ═══════════════════════════════════════════════════════════════

function drawCorridorAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  name: string = 'Toi'
): void {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(t * 0.007) * 1.5;
  const breathe = Math.sin(t * 0.004) * 0.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feet with walk animation
  const walkL = Math.sin(t * 0.007) * 1;
  const walkR = -walkL;
  ctx.fillStyle = '#0A0D15';
  ctx.fillRect(-6, -3 + bob, 4, 3);
  ctx.fillRect(2, -3 + bob, 4, 3);

  // Legs
  ctx.fillStyle = '#0D1020';
  ctx.fillRect(-5, -12 + bob + walkL, 4, 12);
  ctx.fillRect(1, -12 + bob + walkR, 4, 12);

  // Body
  const bodyG = ctx.createLinearGradient(0, -25 + bob, 0, -10 + bob);
  bodyG.addColorStop(0, '#1E2564');
  bodyG.addColorStop(1, '#141840');
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.roundRect(-6 - breathe, -25 + bob, 12 + breathe * 2, 14, 3);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = C.violet;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Belt
  ctx.fillStyle = '#0A0A20';
  ctx.fillRect(-6, -13 + bob, 12, 2);

  // Belt buckle
  ctx.fillStyle = C.gold;
  ctx.fillRect(-1.5, -13 + bob, 3, 2);

  // Arms
  const armSwing = Math.sin(t * 0.007) * 2;
  ctx.fillStyle = '#1A2050';
  ctx.save();
  ctx.translate(-7, -22 + bob);
  ctx.rotate(armSwing * 0.05);
  ctx.fillRect(-1, 0, 3, 10);
  ctx.restore();
  ctx.save();
  ctx.translate(7, -22 + bob);
  ctx.rotate(-armSwing * 0.05);
  ctx.fillRect(-2, 0, 3, 10);
  ctx.restore();

  // Hands
  ctx.fillStyle = '#E0C0A8';
  ctx.beginPath();
  ctx.arc(-7, -12 + bob + armSwing * 0.3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -12 + bob - armSwing * 0.3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headG = ctx.createRadialGradient(0, -31 + bob, 1, 0, -31 + bob, 6);
  headG.addColorStop(0, '#F5D8C5');
  headG.addColorStop(1, '#E0C0A8');
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.arc(0, -31 + bob, 6, 0, Math.PI * 2);
  ctx.fill();

  // Hair / hat
  ctx.fillStyle = C.violet;
  ctx.shadowColor = C.violet;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.ellipse(0, -35 + bob, 7, 4.5, 0, Math.PI, 2 * Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Hat brim
  ctx.fillStyle = '#3A2AEE';
  ctx.beginPath();
  ctx.ellipse(0, -34 + bob, 8, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = C.cyan;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.arc(-2, -31 + bob, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2, -31 + bob, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Mouth
  ctx.strokeStyle = '#C09080';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(0, -28 + bob, 2, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Name tag
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = C.cyan;
  ctx.textAlign = 'center';
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 6;
  ctx.fillText(name, 0, -42 + bob);
  ctx.shadowBlur = 0;

  // Magnetic card icon
  ctx.font = '8px sans-serif';
  ctx.fillText('💳', 10, -22 + bob);

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — OTHER PLAYER / NPC AVATAR
// ═══════════════════════════════════════════════════════════════

function drawNPCAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  name: string,
  color: string,
  seed: number
): void {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(t * 0.005 + seed) * 1;
  const idle = Math.sin(t * 0.002 + seed * 2) * 0.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#0D0D18';
  ctx.fillRect(-4, -10 + bob, 3, 10);
  ctx.fillRect(1, -10 + bob, 3, 10);

  // Body
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.roundRect(-5, -22 + bob, 10, 12, 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Head
  ctx.fillStyle = '#E0C0A8';
  ctx.beginPath();
  ctx.arc(0, -27 + bob, 5, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(-1.5, -27 + bob, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1.5, -27 + bob, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Name
  ctx.font = '7px monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.7;
  ctx.fillText(name, 0, -35 + bob);
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

interface DoorActionBtnProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

const DoorActionBtn = memo(function DoorActionBtn({
  icon,
  label,
  color,
  onPress,
  disabled = false,
}: DoorActionBtnProps) {
  const handleClick = useCallback(() => {
    if (!disabled) onPress();
  }, [disabled, onPress]);

  return (
    <button
      onClick={handleClick}
      style={{
        background: disabled ? C.smoke : `rgba(${hexToRgb(color)},0.14)`,
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : color + '55'}`,
        borderRadius: 12,
        padding: '10px 16px',
        color: disabled ? 'rgba(255,255,255,0.25)' : C.light,
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.15s',
        boxShadow: !disabled ? `0 0 10px ${color}22` : 'none',
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 11 }}>{label}</span>
    </button>
  );
});

interface LegendDotProps {
  color: string;
  label: string;
}

const LegendDot = memo(function LegendDot({ color, label }: LegendDotProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 5px ${color}`,
        }}
      />
      <span style={{ fontSize: 10, color: 'rgba(242,242,242,0.5)' }}>{label}</span>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface EtherWorldCorridorProps {
  floorId?: number;
  floorNumber?: number;
  buildingName?: string;
  characterId?: number;
  characterName?: string;
  hasMagneticCard?: boolean;
  onEnterApartment?: ((aptId: number) => void) | null;
}

export default function EtherWorldCorridor({
  floorId = 1,
  floorNumber = 1,
  buildingName = 'EtherWorld Tower',
  characterId = 1,
  characterName = 'Toi',
  hasMagneticCard = true,
  onEnterApartment = null,
}: EtherWorldCorridorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [doors, setDoors] = useState<DoorData[]>(() => generateDoors({ floorNumber }));
  const doorsRef = useRef(doors);
  useEffect(() => {
    doorsRef.current = doors;
  }, [doors]);

  const [camOffset, setCamOffset] = useState(0);
  const camRef = useRef(0);
  const dragCam = useRef<DragState>({ active: false, startX: 0, startCam: 0 });

  const [hoveredDoor, setHoveredDoor] = useState<DoorData | null>(null);
  const [selectedDoor, setSelectedDoor] = useState<DoorData | null>(null);
  const hoveredRef = useRef<DoorData | null>(null);
  const selectedRef = useRef<DoorData | null>(null);
  useEffect(() => {
    hoveredRef.current = hoveredDoor;
  }, [hoveredDoor]);
  useEffect(() => {
    selectedRef.current = selectedDoor;
  }, [selectedDoor]);

  const [avatarPos, setAvatarPos] = useState<AvatarPosition>({
    tx: CORRIDOR_W / 2,
    ty: 5,
  });
  const avatarRef = useRef<AvatarPosition>({ tx: CORRIDOR_W / 2, ty: 5 });
  useEffect(() => {
    avatarRef.current = avatarPos;
  }, [avatarPos]);

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const alertTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const addAlert = useCallback((msg: string, type: AlertData['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setAlerts((prev) => [...prev.slice(-(ALERT_MAX - 1)), { id, msg, type }]);
    const timer = setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      alertTimers.current.delete(timer);
    }, ALERT_DURATION_MS);
    alertTimers.current.add(timer);
  }, []);

  // Cleanup alert timers on unmount
  useEffect(() => {
    const timers = alertTimers.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const stats = useMemo<FloorStats>(
    () => ({
      unlocked: doors.filter((d) => !d.isLocked).length,
      forRent: doors.filter((d) => d.isForRent && !d.ownerName).length,
      occupied: doors.filter((d) => !!d.ownerName).length,
      totalValue: doors.reduce((sum, d) => sum + (d.ownerName ? d.rentPrice : 0), 0),
    }),
    [doors]
  );

  // NPC positions — deterministic decoration NPCs
  const npcData = useMemo(
    () => [
      { name: 'Concierge', tx: CORRIDOR_W / 2, ty: 2, color: '#445599', seed: 1 },
      { name: 'Voisin', tx: CORRIDOR_W / 2 - 1, ty: 12, color: '#995544', seed: 2 },
      { name: 'Livreur', tx: CORRIDOR_W / 2 + 1, ty: 18, color: '#449944', seed: 3 },
    ],
    []
  );

  // ── API: fetch floor data ──
  useEffect(() => {
    fetch(`${API_URL}/buildings/floor/${floorId}`)
      .then((r) => r.json())
      .then((data: FloorAPIData) => {
        if (data.apartments) {
          setDoors(generateDoors({ floorNumber, apartments: data.apartments }));
        }
      })
      .catch(() => {
        /* offline — keep generated doors */
      });
  }, [floorId, floorNumber]);

  // ── WebSocket realtime ──
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'AUTH', characterId }));
        ws.send(JSON.stringify({ type: 'JOIN_FLOOR', floorId }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === 'DOOR_STATE_CHANGED') {
            setDoors((prev) =>
              prev.map((d) =>
                d.aptId === msg.apartmentId
                  ? { ...d, isLocked: msg.isLocked, justChanged: true }
                  : d
              )
            );
            const clearTimer = setTimeout(() => {
              setDoors((prev) =>
                prev.map((d) =>
                  d.aptId === msg.apartmentId ? { ...d, justChanged: false } : d
                )
              );
            }, CHANGE_FLASH_MS);
            alertTimers.current.add(clearTimer);
            addAlert(
              `${msg.isLocked ? '🔒' : '🔓'} Porte ${msg.apartmentId} ${msg.isLocked ? 'barrée' : 'débarrée'}`,
              msg.isLocked ? 'success' : 'warning'
            );
          }

          if (msg.type === 'DOOR_UNLOCKED_ALERT') {
            addAlert(`⚠️ Apt ${msg.apartmentId} ouvert — étage ${floorNumber}`, 'warning');
            setDoors((prev) =>
              prev.map((d) =>
                d.aptId === msg.apartmentId ? { ...d, hasActivity: true } : d
              )
            );
          }

          if (msg.type === 'DOOR_FORCED') {
            addAlert(`🚨 PORTE FORCÉE — Apt ${msg.apartmentId} !`, 'danger');
            setDoors((prev) =>
              prev.map((d) =>
                d.aptId === msg.apartmentId
                  ? { ...d, isLocked: false, justChanged: true, hasActivity: true }
                  : d
              )
            );
          }
        } catch {
          /* malformed message */
        }
      };

      ws.onclose = () => {
        // Auto-reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [floorId, floorNumber, characterId, addAlert]);

  // ── Camera ref sync ──
  useEffect(() => {
    camRef.current = camOffset;
  }, [camOffset]);

  // ── Canvas resize ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Keyboard camera + avatar ──
  useEffect(() => {
    const keys = new Set<string>();

    const onDown = (e: KeyboardEvent) => {
      keys.add(e.key);
    };
    const onUp = (e: KeyboardEvent) => {
      keys.delete(e.key);
    };

    const tick = setInterval(() => {
      const step = 0.15;
      let moved = false;

      if (keys.has('ArrowLeft') || keys.has('a')) {
        setAvatarPos((p) => ({ ...p, tx: Math.max(0, p.tx - step) }));
        moved = true;
      }
      if (keys.has('ArrowRight') || keys.has('d')) {
        setAvatarPos((p) => ({ ...p, tx: Math.min(CORRIDOR_W - 1, p.tx + step) }));
        moved = true;
      }
      if (keys.has('ArrowUp') || keys.has('w')) {
        setAvatarPos((p) => ({ ...p, ty: Math.max(0, p.ty - step) }));
        moved = true;
      }
      if (keys.has('ArrowDown') || keys.has('s')) {
        setAvatarPos((p) => ({ ...p, ty: Math.min(CORRIDOR_LEN - 1, p.ty + step) }));
        moved = true;
      }

      // Camera follows avatar
      if (moved) {
        setCamOffset((prev) => {
          const canvas = canvasRef.current;
          if (!canvas) return prev;
          const dpr = window.devicePixelRatio || 1;
          const W = canvas.width / dpr;
          const targetX = isoX(avatarRef.current.tx, avatarRef.current.ty, W / 2) - W / 2;
          return clamp(prev + (0 - targetX - prev) * 0.1, CAM_MIN, CAM_MAX);
        });
      }
    }, 33);

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      clearInterval(tick);
    };
  }, []);

  // ── Render loop ──
  const getBaseOffset = useCallback(
    (canvas: HTMLCanvasElement) => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const ox = W / 2 + camRef.current;
      const oy = H * 0.45;
      return { ox, oy, W, H };
    },
    []
  );

  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { ox, oy, W, H } = getBaseOffset(canvas);
    const t = timeRef.current;
    const drs = doorsRef.current;
    const hov = hoveredRef.current;
    const av = avatarRef.current;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05050A');
    bg.addColorStop(1, '#0A0A14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const drawCalls: DrawCall[] = [];

    // ── Floor tiles ──
    for (let tx = 0; tx < CORRIDOR_W; tx++) {
      for (let ty = 0; ty < CORRIDOR_LEN; ty++) {
        const x = isoX(tx, ty, ox);
        const y = isoY(tx, ty, oy);
        const z = tx + ty;
        const even = (tx + ty) % 2 === 0;

        drawCalls.push({
          z,
          fn: () => {
            drawTile(
              ctx,
              x,
              y,
              even ? '#0E1018' : '#111420',
              even ? '#12151E' : '#141820'
            );

            // Central carpet strip
            if (tx >= 2 && tx <= 3) {
              const carpetIdx = ty % CARPET_COLORS.length;
              drawCarpetTile(ctx, x, y, CARPET_COLORS[carpetIdx]);
            }
          },
        });
      }
    }

    // ── Left walls ──
    for (let ty = 0; ty < CORRIDOR_LEN; ty++) {
      const x = isoX(0, ty, ox);
      const y = isoY(0, ty, oy);
      drawCalls.push({
        z: ty - 0.5,
        fn: () => drawWallLeft(ctx, x, y),
      });
    }

    // ── Right walls ──
    for (let ty = 0; ty < CORRIDOR_LEN; ty++) {
      const x = isoX(CORRIDOR_W - 1, ty, ox);
      const y = isoY(CORRIDOR_W - 1, ty, oy);
      drawCalls.push({
        z: CORRIDOR_W - 1 + ty - 0.3,
        fn: () => drawWallRight(ctx, x, y),
      });
    }

    // ── Ceiling lights ──
    for (let ty = 2; ty < CORRIDOR_LEN; ty += 4) {
      const cx = CORRIDOR_W / 2 - 0.5;
      const x = isoX(cx, ty, ox);
      const y = isoY(cx, ty, oy);
      drawCalls.push({
        z: cx + ty - 0.1,
        fn: () => drawCeilingLight(ctx, x, y, t, ty),
      });
    }

    // ── Fire extinguishers ──
    for (const fePos of FIRE_EXTINGUISHER_POSITIONS) {
      if (fePos < CORRIDOR_LEN) {
        // Left wall
        const xlf = isoX(0, fePos, ox);
        const ylf = isoY(0, fePos, oy);
        drawCalls.push({
          z: fePos - 0.3,
          fn: () => drawFireExtinguisher(ctx, xlf, ylf, 'left'),
        });
      }
    }

    // ── Potted plants ──
    for (const ppIdx of PLANT_POSITIONS) {
      if (ppIdx < CORRIDOR_LEN) {
        const side: 'left' | 'right' = ppIdx % 2 === 0 ? 'right' : 'left';
        const ppTx = side === 'left' ? 0 : CORRIDOR_W - 1;
        const xp = isoX(ppTx, ppIdx, ox);
        const yp = isoY(ppTx, ppIdx, oy);
        drawCalls.push({
          z: ppTx + ppIdx - 0.2,
          fn: () => drawPottedPlant(ctx, xp, yp, side, t, ppIdx),
        });
      }
    }

    // ── Wall paintings ──
    for (const paintIdx of PAINTING_POSITIONS) {
      if (paintIdx < CORRIDOR_LEN) {
        const side: 'left' | 'right' = paintIdx % 2 === 0 ? 'left' : 'right';
        const ptTx = side === 'left' ? 0 : CORRIDOR_W - 1;
        const xpaint = isoX(ptTx, paintIdx, ox);
        const ypaint = isoY(ptTx, paintIdx, oy);
        drawCalls.push({
          z: ptTx + paintIdx - 0.35,
          fn: () => drawWallPainting(ctx, xpaint, ypaint, side, paintIdx),
        });
      }
    }

    // ── Floor signs ──
    for (const signPos of FLOOR_SIGN_POSITIONS) {
      const cx = CORRIDOR_W / 2 - 0.5;
      const xs = isoX(cx, signPos, ox);
      const ys = isoY(cx, signPos, oy);
      drawCalls.push({
        z: cx + signPos - 0.15,
        fn: () => drawFloorSign(ctx, xs, ys, floorNumber),
      });
    }

    // ── Exit sign (end of corridor) ──
    {
      const exTy = CORRIDOR_LEN - 1;
      const cx = CORRIDOR_W / 2 - 0.5;
      const xe = isoX(cx, exTy, ox);
      const ye = isoY(cx, exTy, oy);
      drawCalls.push({
        z: cx + exTy - 0.15,
        fn: () => drawExitSign(ctx, xe, ye, t),
      });
    }

    // ── Security cameras (near entrance and mid-corridor) ──
    for (const camPos of [1, CORRIDOR_LEN - 2]) {
      const side: 'left' | 'right' = camPos < CORRIDOR_LEN / 2 ? 'left' : 'right';
      const camTx = side === 'left' ? 0 : CORRIDOR_W - 1;
      const xc = isoX(camTx, camPos, ox);
      const yc = isoY(camTx, camPos, oy);
      drawCalls.push({
        z: camTx + camPos - 0.4,
        fn: () => drawSecurityCamera(ctx, xc, yc, t, side),
      });
    }

    // ── Doors ──
    for (const door of drs) {
      const x = isoX(door.tx, door.ty, ox);
      const y = isoY(door.tx, door.ty, oy);
      const z = door.tx + door.ty + (door.side === 'left' ? -0.4 : 0.4);
      drawCalls.push({
        z,
        fn: () => drawDoorInWall(ctx, x, y, door, t, hov?.id === door.id),
      });
    }

    // ── NPC avatars ──
    for (const npc of npcData) {
      const xn = isoX(npc.tx, npc.ty, ox);
      const yn = isoY(npc.tx, npc.ty, oy);
      drawCalls.push({
        z: npc.tx + npc.ty + 0.3,
        fn: () => drawNPCAvatar(ctx, xn, yn, t, npc.name, npc.color, npc.seed),
      });
    }

    // ── Player avatar ──
    const ax = isoX(av.tx, av.ty, ox);
    const ay = isoY(av.tx, av.ty, oy);
    drawCalls.push({
      z: av.tx + av.ty + 0.5,
      fn: () => drawCorridorAvatar(ctx, ax, ay, t, characterName),
    });

    // Sort by depth and render
    drawCalls.sort((a, b) => a.z - b.z);
    for (const dc of drawCalls) dc.fn();

    // ── Vignette overlay ──
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // ── Scanline effect (subtle) ──
    ctx.globalAlpha = 0.015;
    for (let sy = 0; sy < H; sy += 3) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, sy, W, 1);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }, [getBaseOffset, floorNumber, npcData, characterName]);

  // ── Animation loop ──
  useEffect(() => {
    const loop = (ts: number) => {
      timeRef.current = ts;
      renderScene();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [renderScene]);

  // ── Hit test ──
  const hitTestDoor = useCallback(
    (clientX: number, clientY: number): DoorData | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const { ox, oy } = getBaseOffset(canvas);

      let closest: DoorData | null = null;
      let minDist = HIT_RADIUS;

      for (const door of doorsRef.current) {
        const x = isoX(door.tx, door.ty, ox);
        const y = isoY(door.tx, door.ty, oy);
        const dist = Math.hypot(sx - x, sy - y);
        if (dist < minDist) {
          minDist = dist;
          closest = door;
        }
      }
      return closest;
    },
    [getBaseOffset]
  );

  // ── Door actions ──
  const handleDoorAction = useCallback(
    async (door: DoorData, action: 'enter' | 'toggle' | 'lockpick' | 'rent') => {
      if (action === 'enter') {
        if (door.isLocked && door.ownerId !== characterId) {
          addAlert('❌ Porte verrouillée — vous n\'avez pas accès', 'danger');
          return;
        }
        onEnterApartment?.(door.aptId);
        return;
      }

      if (action === 'rent') {
        try {
          const res = await fetch(`${API_URL}/buildings/apartment/${door.aptId}/rent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterId }),
          });
          const data = await res.json();
          if (data.success) {
            addAlert(`✅ Appart ${door.aptNumber} loué ! Carte: ${data.cardUid}`, 'success');
            setSelectedDoor(null);
          } else {
            addAlert('❌ ' + data.error, 'danger');
          }
        } catch {
          addAlert('❌ Impossible de louer (hors-ligne)', 'danger');
        }
        return;
      }

      if (action === 'lockpick') {
        if (!hasMagneticCard) {
          addAlert('❌ Outils de crochetage requis', 'danger');
          return;
        }
        addAlert('🔧 Crochetage en cours...', 'warning');
        try {
          const res = await fetch(`${API_URL}/doors/${door.id}/lockpick`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterId }),
          });
          const data = await res.json();
          if (data.success) {
            setDoors((prev) =>
              prev.map((d) => (d.id === door.id ? { ...d, isLocked: false, justChanged: true } : d))
            );
            addAlert('✅ Crochetage réussi !', 'success');
          } else {
            addAlert('❌ Crochetage échoué — serrure trop résistante', 'danger');
          }
        } catch {
          // Offline fallback — random success
          const success = seededRand(Date.now()) > 0.4;
          if (success) {
            setDoors((prev) =>
              prev.map((d) => (d.id === door.id ? { ...d, isLocked: false, justChanged: true } : d))
            );
          }
          addAlert(success ? '✅ Crochetage réussi (local) !' : '❌ Crochetage échoué !', 'warning');
        }
        const timer = setTimeout(() => {
          setDoors((prev) =>
            prev.map((d) => (d.id === door.id ? { ...d, justChanged: false } : d))
          );
        }, CHANGE_FLASH_MS);
        alertTimers.current.add(timer);
        return;
      }

      // Toggle lock
      if (!hasMagneticCard && door.ownerId !== characterId) {
        addAlert('❌ Pas de carte magnétique pour cet appart', 'danger');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/doors/${door.id}/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId, action: door.isLocked ? 'unlock' : 'lock' }),
        });
        const data = await res.json();
        if (data.success) {
          setDoors((prev) =>
            prev.map((d) =>
              d.id === door.id ? { ...d, isLocked: data.isLocked, justChanged: true } : d
            )
          );
          addAlert(data.isLocked ? '🔒 Porte barrée' : '🔓 Porte débarrée', 'success');
        }
      } catch {
        // Offline toggle
        setDoors((prev) =>
          prev.map((d) =>
            d.id === door.id ? { ...d, isLocked: !d.isLocked, justChanged: true } : d
          )
        );
        addAlert('🔓 Porte (mode hors-ligne)', 'warning');
      }

      const timer = setTimeout(() => {
        setDoors((prev) =>
          prev.map((d) => (d.id === door.id ? { ...d, justChanged: false } : d))
        );
      }, CHANGE_FLASH_MS);
      alertTimers.current.add(timer);
    },
    [hasMagneticCard, characterId, addAlert, onEnterApartment]
  );

  // ── Touch handling ──
  const touchStart = useRef<TouchState>({ x: 0, y: 0, time: 0, moved: false });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), moved: false };
      dragCam.current = { active: true, startX: touch.clientX, startCam: camRef.current };
      const door = hitTestDoor(touch.clientX, touch.clientY);
      setHoveredDoor(door);
    },
    [hitTestDoor]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStart.current.x;
      if (Math.abs(dx) > DRAG_THRESHOLD) touchStart.current.moved = true;
      if (dragCam.current.active) {
        const newCam = dragCam.current.startCam + (touch.clientX - dragCam.current.startX);
        setCamOffset(clamp(newCam, CAM_MIN, CAM_MAX));
      }
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      dragCam.current.active = false;
      if (touchStart.current.moved) return;

      const touch = e.changedTouches[0];
      const elapsed = Date.now() - touchStart.current.time;
      const door = hitTestDoor(touch.clientX, touch.clientY);

      if (door) {
        // Double-tap to toggle lock directly
        if (
          elapsed < DOUBLE_TAP_MS &&
          selectedRef.current?.id === door.id &&
          door.ownerId === characterId
        ) {
          handleDoorAction(door, 'toggle');
        } else {
          setSelectedDoor(door);
        }
      } else {
        setSelectedDoor(null);
      }
    },
    [hitTestDoor, characterId, handleDoorAction]
  );

  // ── Mouse handling ──
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragCam.current.active) {
        const newCam = dragCam.current.startCam + (e.clientX - dragCam.current.startX);
        setCamOffset(clamp(newCam, CAM_MIN, CAM_MAX));
        return;
      }
      const door = hitTestDoor(e.clientX, e.clientY);
      setHoveredDoor(door);
    },
    [hitTestDoor]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragCam.current = { active: true, startX: e.clientX, startCam: camRef.current };
  }, []);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const wasDragging =
        dragCam.current.active &&
        Math.abs(e.clientX - dragCam.current.startX) > DRAG_THRESHOLD;
      dragCam.current.active = false;

      if (wasDragging) return;

      const door = hitTestDoor(e.clientX, e.clientY);
      if (door) setSelectedDoor(door);
      else setSelectedDoor(null);
    },
    [hitTestDoor]
  );

  // ── Mouse wheel scroll ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    setCamOffset((prev) => clamp(prev - e.deltaX - e.deltaY * 0.5, CAM_MIN, CAM_MAX));
  }, []);

  const sel = selectedDoor;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: C.bg,
        fontFamily: "'Segoe UI', monospace",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ═══ HEADER ═══ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'linear-gradient(180deg,rgba(5,5,10,0.98) 0%,transparent 100%)',
          padding: '12px 16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg,${C.violet},${C.cyan})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: `0 0 14px ${C.violet}66`,
            }}
          >
            🏢
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: C.light,
                letterSpacing: '0.04em',
              }}
            >
              {buildingName}
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.cyan,
                letterSpacing: '0.18em',
                marginTop: 1,
              }}
            >
              {floorLabel(floorNumber)} — COULOIR
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            {
              label: '🔓 OUVERTES',
              val: stats.unlocked,
              c: stats.unlocked > 0 ? C.orange : C.dim,
            },
            { label: '🏠 OCCUPÉS', val: stats.occupied, c: C.cyan },
            { label: '🔑 À LOUER', val: stats.forRent, c: C.yellow },
            { label: '💰 REVENUS', val: `${stats.totalValue}$`, c: C.gold },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                padding: '4px 8px',
                textAlign: 'center',
                minWidth: 52,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: s.c }}>{s.val}</div>
              <div style={{ fontSize: 7, color: C.dim, letterSpacing: '0.08em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CANVAS ═══ */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: hoveredDoor ? 'pointer' : dragCam.current.active ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      />

      {/* ═══ SCROLL HINTS ═══ */}
      {!sel && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 12,
              transform: 'translateY(-50%)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              opacity: 0.4,
            }}
          >
            <div style={{ fontSize: 18, color: C.cyan }}>◀</div>
            <div
              style={{
                fontSize: 8,
                color: C.dim,
                writingMode: 'vertical-rl',
                letterSpacing: '0.15em',
              }}
            >
              DÉFILER
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: 12,
              transform: 'translateY(-50%)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              opacity: 0.4,
            }}
          >
            <div style={{ fontSize: 18, color: C.cyan }}>▶</div>
            <div
              style={{
                fontSize: 8,
                color: C.dim,
                writingMode: 'vertical-rl',
                letterSpacing: '0.15em',
              }}
            >
              DÉFILER
            </div>
          </div>
        </>
      )}

      {/* ═══ CONTROLS HINT ═══ */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 12,
          zIndex: 15,
          background: 'rgba(6,6,14,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '6px 10px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ fontSize: 8, color: C.dim, letterSpacing: '0.1em' }}>
          WASD / ← → ↑ ↓ = Déplacer
        </div>
        <div style={{ fontSize: 8, color: C.dim, letterSpacing: '0.1em' }}>
          Glisser / Molette = Caméra
        </div>
        <div style={{ fontSize: 8, color: C.dim, letterSpacing: '0.1em' }}>
          Clic porte = Interagir
        </div>
      </div>

      {/* ═══ REAL-TIME ALERTS ═══ */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 12,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          maxWidth: 260,
        }}
      >
        {alerts.map((a) => {
          const alertColors = {
            danger: { bg: 'rgba(255,58,58,0.15)', border: C.red },
            warning: { bg: 'rgba(255,154,58,0.15)', border: C.orange },
            success: { bg: 'rgba(0,255,157,0.1)', border: C.green },
            info: { bg: 'rgba(0,224,255,0.1)', border: C.cyan },
          };
          const ac = alertColors[a.type];

          return (
            <div
              key={a.id}
              style={{
                background: ac.bg,
                border: `1px solid ${ac.border}55`,
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 11,
                color: C.light,
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                animation: 'slideIn 0.3s ease',
              }}
            >
              {a.msg}
            </div>
          );
        })}
      </div>

      {/* ═══ SELECTED DOOR PANEL ═══ */}
      {sel && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: C.darkPanel,
            borderTop: `1px solid ${sel.isLocked ? C.red : C.green}44`,
            borderRadius: '20px 20px 0 0',
            padding: '18px 20px 30px',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Pull handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.12)',
              }}
            />
          </div>

          {/* Door info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 28 }}>{sel.isLocked ? '🔒' : '🔓'}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.light }}>
                    {sel.aptNumber}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: sel.isLocked ? C.red : C.green,
                      marginTop: 2,
                    }}
                  >
                    {sel.isLocked ? 'VERROUILLÉ' : '⚠️ DÉVERROUILLÉ — ATTENTION'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: C.dim }}>
                  👤 {sel.ownerName ?? 'Inoccupé'} &nbsp;·&nbsp; 💰 {sel.rentPrice}$/mois
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: sel.isForRent && !sel.ownerName ? C.yellow : C.dim,
                  }}
                >
                  {sel.isForRent && !sel.ownerName
                    ? '🔑 Disponible à la location'
                    : sel.ownerName
                    ? '🏠 Occupé'
                    : '🚫 Non disponible'}
                </div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>
                  🛡️ Sécurité: {SECURITY_LABELS[sel.securityLevel]} &nbsp;·&nbsp;
                  🪑 Mobilier: {FURNITURE_LABELS[sel.furnitureLevel]}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedDoor(null)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '8px 12px',
                color: C.dim,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <DoorActionBtn
              icon="🚪"
              label="Entrer"
              color={C.cyan}
              disabled={sel.isLocked && sel.ownerId !== characterId}
              onPress={() => handleDoorAction(sel, 'enter')}
            />

            {sel.ownerId === characterId && (
              <DoorActionBtn
                icon={sel.isLocked ? '🔓' : '🔒'}
                label={sel.isLocked ? 'Débarrer' : 'Barrer'}
                color={sel.isLocked ? C.green : C.red}
                onPress={() => handleDoorAction(sel, 'toggle')}
              />
            )}

            {sel.isForRent && !sel.ownerName && (
              <DoorActionBtn
                icon="🔑"
                label={`Louer — ${sel.rentPrice}$`}
                color={C.yellow}
                onPress={() => handleDoorAction(sel, 'rent')}
              />
            )}

            {sel.isLocked && sel.ownerId !== characterId && (
              <DoorActionBtn
                icon="🔧"
                label="Crocheter"
                color={C.magenta}
                onPress={() => handleDoorAction(sel, 'lockpick')}
              />
            )}

            {sel.ownerId === characterId && (
              <DoorActionBtn
                icon="🛡️"
                label="Sécurité +"
                color={C.gold}
                onPress={() => {
                  setDoors((prev) =>
                    prev.map((d) =>
                      d.id === sel.id
                        ? { ...d, securityLevel: Math.min(3, d.securityLevel + 1) }
                        : d
                    )
                  );
                  addAlert('🛡️ Sécurité améliorée !', 'success');
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ═══ LEGEND ═══ */}
      {!sel && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 30,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            background: 'rgba(6,6,14,0.85)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            padding: '8px 18px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <LegendDot color={C.red} label="Barré" />
          <LegendDot color={C.green} label="Ouvert ⚠️" />
          <LegendDot color={C.yellow} label="À louer" />
          <LegendDot color={C.cyan} label="Occupé" />
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: 10, color: C.dim }}>← Glisser →</div>
        </div>
      )}

      {/* ═══ MINIMAP ═══ */}
      <div
        style={{
          position: 'absolute',
          bottom: sel ? 240 : 70,
          right: 12,
          zIndex: 30,
          background: 'rgba(6,6,14,0.9)',
          border: `1px solid ${C.violet}33`,
          borderRadius: 12,
          padding: '8px',
          backdropFilter: 'blur(10px)',
          transition: 'bottom 0.3s ease',
        }}
      >
        <div
          style={{
            fontSize: 8,
            color: C.dim,
            letterSpacing: '0.12em',
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          PLAN ÉTAGE {floorNumber}
        </div>

        {/* Two rows: left doors top, right doors bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <div
              style={{ fontSize: 6, color: C.dim, width: 12, textAlign: 'right', marginRight: 2 }}
            >
              G
            </div>
            {doors
              .filter((d) => d.side === 'left')
              .map((door) => (
                <div
                  key={door.id}
                  title={`${door.aptNumber} — ${door.isLocked ? 'Barré' : 'Ouvert'}`}
                  onClick={() => setSelectedDoor(door)}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: door.isLocked
                      ? door.ownerName
                        ? C.cyan + '88'
                        : door.isForRent
                        ? C.yellow + '66'
                        : C.dim + '44'
                      : C.green + 'CC',
                    border:
                      sel?.id === door.id
                        ? `1px solid ${C.light}`
                        : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: !door.isLocked ? `0 0 4px ${C.green}` : 'none',
                  }}
                />
              ))}
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <div
              style={{ fontSize: 6, color: C.dim, width: 12, textAlign: 'right', marginRight: 2 }}
            >
              D
            </div>
            {doors
              .filter((d) => d.side === 'right')
              .map((door) => (
                <div
                  key={door.id}
                  title={`${door.aptNumber} — ${door.isLocked ? 'Barré' : 'Ouvert'}`}
                  onClick={() => setSelectedDoor(door)}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: door.isLocked
                      ? door.ownerName
                        ? C.cyan + '88'
                        : door.isForRent
                        ? C.yellow + '66'
                        : C.dim + '44'
                      : C.green + 'CC',
                    border:
                      sel?.id === door.id
                        ? `1px solid ${C.light}`
                        : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: !door.isLocked ? `0 0 4px ${C.green}` : 'none',
                  }}
                />
              ))}
          </div>
        </div>

        <div
          style={{ fontSize: 7, color: C.dim, marginTop: 5, textAlign: 'center' }}
        >
          {stats.unlocked} ouvertes · {stats.occupied} occupées · {stats.forRent} à louer
        </div>
      </div>

      {/* ═══ ANIMATIONS ═══ */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}