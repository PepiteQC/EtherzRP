
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
  securityLevel: number;
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

interface AvatarPos {
  tx: number;
  ty: number;
}

interface DragState {
  active: boolean;
  startX: number;
  startCam: number;
  moved: boolean;
}

interface DrawCall {
  z: number;
  fn: () => void;
}

// ═══════════════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════════════

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
const WS_URL = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3000';

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
const HIT_RADIUS = 42;
const DRAG_THRESHOLD = 6;
const ALERT_MAX = 4;
const ALERT_DURATION = 5000;
const CHANGE_FLASH_MS = 2000;
const AVATAR_SPEED = 0.12;
const WS_RECONNECT_MS = 3000;

// Decoration placement
const LIGHT_INTERVAL = 4;
const PLANT_POSITIONS = [1, 5, 9, 13, 17] as const;
const EXTINGUISHER_POSITIONS = [3, 11, 19] as const;
const PAINTING_POSITIONS = [2, 6, 10, 14, 18] as const;
const CAMERA_POSITIONS = [1, 11, 20] as const;
const CARPET_COLORS = ['#1A0528', '#120A28', '#0A1528'] as const;

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
  panel: 'rgba(6,6,14,0.97)',
} as const;

const SECURITY_LABELS = ['Aucune', 'Standard', 'Renforcée', 'Blindée'] as const;

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function isoX(tx: number, ty: number, ox: number): number {
  return (tx - ty) * (TW / 2) + ox;
}

function isoY(tx: number, ty: number, oy: number): number {
  return (tx + ty) * (TH / 2) + oy;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): string {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function floorLabel(n: number): string {
  if (n === 0) return 'REZ-DE-CHAUSSÉE';
  if (n === 1) return '1ER ÉTAGE';
  if (n === 4) return 'PENTHOUSE';
  return `${n}E ÉTAGE`;
}

// ═══════════════════════════════════════════════════════════════
//  DOOR GENERATION
// ═══════════════════════════════════════════════════════════════

function generateDoors(floorData: any = {}): DoorData[] {
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
      securityLevel: apt?.security_level ?? Math.floor(seededRand(i + 42) * 3),
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
  alpha = 1
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
//  DRAW — CARPET STRIP
// ═══════════════════════════════════════════════════════════════

function drawCarpet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y - TH / 4);
  ctx.lineTo(x + TW / 4, y);
  ctx.lineTo(x, y + TH / 4);
  ctx.lineTo(x - TW / 4, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Carpet pattern — subtle diagonal lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 4, y - TH / 4);
    ctx.lineTo(x + i * 4 + TW / 8, y + TH / 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — WALLS
// ═══════════════════════════════════════════════════════════════

function drawWallLeft(ctx: CanvasRenderingContext2D, x: number, y: number, h = WH): void {
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

  ctx.strokeStyle = 'rgba(74,58,255,0.08)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Top molding
  ctx.beginPath();
  ctx.moveTo(x - TW / 2, y - h + 4);
  ctx.lineTo(x, y + TH / 2 - h + 4);
  ctx.strokeStyle = 'rgba(74,58,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mid wainscoting line
  ctx.beginPath();
  ctx.moveTo(x - TW / 2, y - h * 0.4);
  ctx.lineTo(x, y + TH / 2 - h * 0.4);
  ctx.strokeStyle = 'rgba(74,58,255,0.06)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Baseboard
  ctx.beginPath();
  ctx.moveTo(x - TW / 2, y - 2);
  ctx.lineTo(x, y + TH / 2 - 2);
  ctx.lineTo(x, y + TH / 2);
  ctx.lineTo(x - TW / 2, y);
  ctx.closePath();
  ctx.fillStyle = '#0D0F1A';
  ctx.fill();
}

function drawWallRight(ctx: CanvasRenderingContext2D, x: number, y: number, h = WH): void {
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

  ctx.strokeStyle = 'rgba(0,224,255,0.05)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Top molding
  ctx.beginPath();
  ctx.moveTo(x, y + TH / 2 - h + 4);
  ctx.lineTo(x + TW / 2, y - h + 4);
  ctx.strokeStyle = 'rgba(0,224,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mid wainscoting
  ctx.beginPath();
  ctx.moveTo(x, y + TH / 2 - h * 0.4);
  ctx.lineTo(x + TW / 2, y - h * 0.4);
  ctx.strokeStyle = 'rgba(0,224,255,0.04)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Baseboard
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
//  DRAW — DOOR (unified left/right)
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
  const sx = side === 'left' ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);

  // Door recess shadow
  ctx.beginPath();
  ctx.moveTo(sx * (DW + 4), -DH - TH / 2);
  ctx.lineTo(0, -DH - TH / 2 + DW * 0.3);
  ctx.lineTo(0, -TH / 2 + DW * 0.3);
  ctx.lineTo(sx * (DW + 4), -TH / 2);
  ctx.closePath();
  ctx.fillStyle = '#050508';
  ctx.fill();

  // Door panel body
  ctx.beginPath();
  ctx.moveTo(sx * DW, -DH - TH / 2 + 4);
  ctx.lineTo(0, -DH - TH / 2 + 4 + DW * 0.28);
  ctx.lineTo(0, -TH / 2 + DW * 0.28);
  ctx.lineTo(sx * DW, -TH / 2 + 4);
  ctx.closePath();

  const pg = ctx.createLinearGradient(side === 'left' ? -DW : 0, -DH, side === 'left' ? 0 : DW, -DH);
  pg.addColorStop(0, isLocked ? '#1A0505' : '#051A10');
  pg.addColorStop(1, isLocked ? '#2A0808' : '#0A2A18');
  ctx.fillStyle = pg;
  ctx.fill();

  // Door panel wood lines
  ctx.strokeStyle = isLocked ? 'rgba(255,58,58,0.06)' : 'rgba(0,255,157,0.06)';
  ctx.lineWidth = 0.4;
  for (let i = 1; i <= 4; i++) {
    const frac = i / 5;
    const yLine = -DH - TH / 2 + 4 + (DH - 4) * frac;
    ctx.beginPath();
    ctx.moveTo(sx * DW * 0.15, yLine + DW * 0.28 * (1 - frac));
    ctx.lineTo(sx * DW * 0.85, yLine + 4 * (1 - frac));
    ctx.stroke();
  }

  // Door panel decorative inset rectangle
  ctx.strokeStyle = isLocked ? 'rgba(255,58,58,0.08)' : 'rgba(0,255,157,0.08)';
  ctx.lineWidth = 0.5;
  const insetW = DW * 0.6;
  const insetH = DH * 0.3;
  const insetY = -DH / 2 - TH / 2;
  ctx.strokeRect(sx * DW * 0.2, insetY - insetH / 2, sx * insetW, insetH);

  // Glowing outline
  ctx.shadowColor = lockColor;
  ctx.shadowBlur = 8 + pulse * 6 + urgPulse * 14;
  ctx.strokeStyle = lockColor + (hovered ? 'EE' : '88');
  ctx.lineWidth = hovered ? 2.5 : 1;
  ctx.beginPath();
  ctx.moveTo(sx * DW, -DH - TH / 2 + 4);
  ctx.lineTo(0, -DH - TH / 2 + 4 + DW * 0.28);
  ctx.lineTo(0, -TH / 2 + DW * 0.28);
  ctx.lineTo(sx * DW, -TH / 2 + 4);
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Handle
  ctx.fillStyle = '#888';
  ctx.shadowColor = lockColor;
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.roundRect(sx * 4 - 2, -TH / 2 - 18, 4, 8, 1);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Lock indicator dot
  ctx.fillStyle = lockColor;
  ctx.shadowColor = lockColor;
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.arc(sx * 5, -TH / 2 - 10, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Peephole
  ctx.fillStyle = '#020208';
  ctx.beginPath();
  ctx.arc(sx * DW * 0.4, -DH * 0.65 - TH / 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Security icons
  if (securityLevel > 0) {
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = securityLevel >= 2 ? C.gold : C.dimHex;
    const shields = '🛡'.repeat(Math.min(securityLevel, 3));
    ctx.fillText(shields, sx * DW * 0.5, -TH / 2 + DW * 0.28 - 4);
  }

  // Lock icon
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = lockColor;
  ctx.shadowBlur = 8 + urgPulse * 12;
  ctx.fillStyle = lockColor;
  ctx.fillText(isLocked ? '🔒' : '🔓', sx * DW / 2, -DH - TH / 2 - 2);
  ctx.shadowBlur = 0;

  // Apartment number
  if (side === 'left') {
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = hovered ? lockColor : C.dim;
    ctx.textAlign = 'center';
    ctx.fillText(aptNumber, -DW / 2 - 2, -DH / 2 - TH / 2 - 10);
  } else {
    ctx.save();
    ctx.rotate(0.25);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = hovered ? lockColor : C.dim;
    ctx.textAlign = 'center';
    ctx.fillText(aptNumber, DW / 2 + 2, -DH / 2 - TH / 2 - 10);
    ctx.restore();
  }

  // "À LOUER" tag
  if (!ownerName && isForRent) {
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = C.yellow;
    ctx.shadowColor = C.yellow;
    ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText('À LOUER', sx * DW / 2, -WH + 8);
    ctx.shadowBlur = 0;
  }

  // Owner name plate
  if (ownerName) {
    ctx.font = '7px monospace';
    ctx.fillStyle = C.cyan + '88';
    ctx.textAlign = 'center';
    ctx.fillText(ownerName.slice(0, 12), sx * DW / 2, -TH / 2 + DW * 0.28 + 12);
  }

  // Activity indicator
  if (hasActivity) {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👣', sx * DW / 2, -WH + 22);
  }

  // Floor hover glow
  if (hovered) {
    ctx.beginPath();
    ctx.ellipse(0, 4, TW / 3, TH / 4, 0, 0, Math.PI * 2);
    const hg = ctx.createRadialGradient(0, 4, 0, 0, 4, TW / 3);
    hg.addColorStop(0, lockColor + '30');
    hg.addColorStop(1, 'transparent');
    ctx.fillStyle = hg;
    ctx.fill();
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
  const flicker = Math.sin(t * 0.05 + idx * 7) > 0.97 ? 0.3 : 0;

  ctx.save();
  ctx.translate(x, y - WH + 6);

  // Mounting bracket
  ctx.fillStyle = '#2A2A3A';
  ctx.fillRect(-3, -5, 6, 4);

  // Neon tube glow
  const neonG = ctx.createLinearGradient(-20, 0, 20, 0);
  neonG.addColorStop(0, 'rgba(0,224,255,0)');
  neonG.addColorStop(0.2, `rgba(0,224,255,${bright - flicker})`);
  neonG.addColorStop(0.8, `rgba(0,224,255,${bright - flicker})`);
  neonG.addColorStop(1, 'rgba(0,224,255,0)');
  ctx.fillStyle = neonG;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 16;
  ctx.fillRect(-20, -2, 40, 3);

  // White core
  ctx.fillStyle = `rgba(255,255,255,${bright * 0.4})`;
  ctx.fillRect(-14, -1, 28, 1);
  ctx.shadowBlur = 0;

  // Floor light pool
  const floorG = ctx.createRadialGradient(0, WH - 10, 0, 0, WH - 10, 45);
  floorG.addColorStop(0, `rgba(0,224,255,${bright * 0.07})`);
  floorG.addColorStop(1, 'transparent');
  ctx.fillStyle = floorG;
  ctx.beginPath();
  ctx.ellipse(0, WH - 10, 45, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ceiling light cone (downward rays)
  ctx.globalAlpha = 0.02;
  ctx.fillStyle = C.cyan;
  ctx.beginPath();
  ctx.moveTo(-5, 2);
  ctx.lineTo(-30, WH - 15);
  ctx.lineTo(30, WH - 15);
  ctx.lineTo(5, 2);
  ctx.closePath();
  ctx.fill();
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
  const s = side === 'left' ? -1 : 1;
  const sweep = Math.sin(t * 0.0008) * 0.3;

  ctx.save();
  ctx.translate(x, y);

  // Ceiling mount
  ctx.fillStyle = '#333';
  ctx.fillRect(s * 2 - 1.5, -WH + 6, 3, 5);

  // Camera body
  ctx.save();
  ctx.translate(s * 2, -WH + 11);
  ctx.rotate(sweep * s);

  ctx.fillStyle = '#1A1A2A';
  ctx.beginPath();
  ctx.roundRect(-4, -2.5, 8, 5, 1.5);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Lens
  ctx.fillStyle = '#0A0A15';
  ctx.beginPath();
  ctx.arc(s * 4, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  // Lens reflection
  ctx.fillStyle = 'rgba(0,224,255,0.2)';
  ctx.beginPath();
  ctx.arc(s * 3.5, -0.5, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // LED
  const ledOn = Math.sin(t * 0.004) > 0.6;
  ctx.fillStyle = ledOn ? C.red : '#330000';
  ctx.shadowColor = ledOn ? C.red : 'transparent';
  ctx.shadowBlur = ledOn ? 6 : 0;
  ctx.beginPath();
  ctx.arc(s * -2, -2, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — POTTED PLANT
// ═══════════════════════════════════════════════════════════════

function drawPottedPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  seed: number,
  side: 'left' | 'right'
): void {
  const s = side === 'left' ? -1 : 1;
  const sway = Math.sin(t * 0.001 + seed * 3) * 1.5;

  ctx.save();
  ctx.translate(x, y);

  // Pot
  const potG = ctx.createLinearGradient(s * 3, 0, s * 9, 0);
  potG.addColorStop(0, '#3A2210');
  potG.addColorStop(1, '#2A1A0C');
  ctx.fillStyle = potG;
  ctx.beginPath();
  ctx.moveTo(s * 3, -2);
  ctx.lineTo(s * 9, -2);
  ctx.lineTo(s * 8, -14);
  ctx.lineTo(s * 4, -14);
  ctx.closePath();
  ctx.fill();

  // Pot rim
  ctx.fillStyle = '#4A3018';
  ctx.fillRect(s * 3.5, -14.5, s * 5, 1.5);

  // Soil
  ctx.fillStyle = '#1A0E05';
  ctx.beginPath();
  ctx.ellipse(s * 6, -14, 2, 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leaves
  const leafColors = ['#1A6A1A', '#2D7A1E', '#1A5518', '#228822'];
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 1.5 - Math.PI * 0.75 + sway * 0.04;
    const len = 5 + seededRand(seed + i) * 5;
    const lx = s * 6 + Math.cos(angle) * len * 0.3;
    const ly = -15 - len * 0.4 + Math.sin(angle + Math.PI / 2) * 2;

    ctx.fillStyle = leafColors[i % leafColors.length];
    ctx.beginPath();
    ctx.ellipse(lx, ly, 3, 1.5, angle * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Small flower on some
  if (seededRand(seed + 100) > 0.6) {
    ctx.fillStyle = seededRand(seed) > 0.5 ? '#FF6699' : '#FFCC44';
    ctx.beginPath();
    ctx.arc(s * 6 + sway * 0.3, -22, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — FIRE EXTINGUISHER
// ═══════════════════════════════════════════════════════════════

function drawExtinguisher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: 'left' | 'right'
): void {
  const s = side === 'left' ? -1 : 1;
  ctx.save();
  ctx.translate(x, y);

  // Wall bracket
  ctx.fillStyle = '#444';
  ctx.fillRect(s * 5 - 1.5, -WH + 28, 3, 2);
  ctx.fillRect(s * 5 - 1.5, -WH + 46, 3, 2);

  // Cylinder
  const cylG = ctx.createLinearGradient(s * 3, 0, s * 8, 0);
  cylG.addColorStop(0, '#DD2222');
  cylG.addColorStop(1, '#991111');
  ctx.fillStyle = cylG;
  ctx.beginPath();
  ctx.roundRect(s * 3, -WH + 30, s * 5, 18, 1.5);
  ctx.fill();

  // Label band
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.3;
  ctx.fillRect(s * 3.5, -WH + 36, s * 4, 4);
  ctx.globalAlpha = 1;

  // Nozzle
  ctx.fillStyle = '#222';
  ctx.fillRect(s * 4.5, -WH + 27, s * 2, 4);

  // Handle
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(s * 5.5, -WH + 26, 2.5, Math.PI, 0);
  ctx.stroke();

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — WALL PAINTING
// ═══════════════════════════════════════════════════════════════

function drawPainting(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  side: 'left' | 'right',
  seed: number
): void {
  const s = side === 'left' ? -1 : 1;
  const hue = (seed * 67) % 360;
  const size = 12 + seededRand(seed + 7) * 4;

  ctx.save();
  ctx.translate(x, y);

  // Frame shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(s * 2 + 1, -WH + 24 + 1, s * size + 2, size + 2);

  // Frame
  ctx.strokeStyle = C.gold + '99';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(s * 2, -WH + 24, s * size, size);

  // Inner frame line
  ctx.strokeStyle = C.gold + '44';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(s * 3, -WH + 25, s * (size - 2), size - 2);

  // Canvas
  const artG = ctx.createLinearGradient(s * 3, -WH + 25, s * (2 + size), -WH + 24 + size);
  artG.addColorStop(0, `hsla(${hue}, 35%, 12%, 0.9)`);
  artG.addColorStop(0.5, `hsla(${(hue + 40) % 360}, 45%, 18%, 0.7)`);
  artG.addColorStop(1, `hsla(${(hue + 80) % 360}, 30%, 10%, 0.9)`);
  ctx.fillStyle = artG;
  ctx.fillRect(s * 3, -WH + 25, s * (size - 2), size - 2);

  // Abstract art shapes
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = `hsla(${hue}, 60%, 50%, 0.5)`;
  ctx.beginPath();
  ctx.arc(s * (2 + size * 0.3), -WH + 24 + size * 0.4, size * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsla(${(hue + 120) % 360}, 50%, 45%, 0.4)`;
  ctx.beginPath();
  ctx.arc(s * (2 + size * 0.65), -WH + 24 + size * 0.6, size * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Abstract line
  ctx.strokeStyle = `hsla(${(hue + 200) % 360}, 40%, 60%, 0.3)`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(s * (2 + size * 0.2), -WH + 24 + size * 0.7);
  ctx.quadraticCurveTo(s * (2 + size * 0.5), -WH + 24 + size * 0.2, s * (2 + size * 0.8), -WH + 24 + size * 0.5);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — FLOOR SIGN
// ═══════════════════════════════════════════════════════════════

function drawFloorSign(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  floorNumber: number,
  isEntrance: boolean
): void {
  ctx.save();
  ctx.translate(x, y);

  // Sign backplate
  ctx.fillStyle = 'rgba(8,8,20,0.9)';
  ctx.strokeStyle = C.violet + '66';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-22, -WH + 14, 44, 20, 4);
  ctx.fill();
  ctx.stroke();

  // LED dots on corners
  ctx.fillStyle = C.violet;
  ctx.beginPath();
  ctx.arc(-18, -WH + 16, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(18, -WH + 16, 1, 0, Math.PI * 2);
  ctx.fill();

  // Text
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = C.cyan;
  ctx.textAlign = 'center';
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 4;
  ctx.fillText(isEntrance ? `ÉT. ${floorNumber}` : 'SORTIE →', 0, -WH + 27);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — EXIT SIGN
// ═══════════════════════════════════════════════════════════════

function drawExitSign(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number
): void {
  const blink = Math.sin(t * 0.005) > 0 ? 1 : 0.65;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = blink;

  ctx.fillStyle = '#003300';
  ctx.beginPath();
  ctx.roundRect(-16, -WH + 8, 32, 14, 2);
  ctx.fill();

  ctx.strokeStyle = C.green + '44';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.font = 'bold 7px monospace';
  ctx.fillStyle = C.green;
  ctx.textAlign = 'center';
  ctx.shadowColor = C.green;
  ctx.shadowBlur = 8;
  ctx.fillText('SORTIE ⇒', 0, -WH + 18);
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — NPC
// ═══════════════════════════════════════════════════════════════

function drawNPC(
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

  const bob = Math.sin(t * 0.005 + seed * 2) * 1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#0D0D18';
  ctx.fillRect(-3.5, -10 + bob, 3, 10);
  ctx.fillRect(0.5, -10 + bob, 3, 10);

  // Body
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
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
  const blink = Math.sin(t * 0.002 + seed) > 0.95 ? 0 : 1;
  ctx.globalAlpha = blink;
  ctx.beginPath();
  ctx.arc(-1.5, -27 + bob, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1.5, -27 + bob, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Name
  ctx.font = '7px monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.65;
  ctx.fillText(name, 0, -35 + bob);
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — PLAYER AVATAR
// ═══════════════════════════════════════════════════════════════

function drawCorridorAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
  name: string
): void {
  ctx.save();
  ctx.translate(x, y);

  const bob = Math.sin(t * 0.007) * 1.5;
  const breathe = Math.sin(t * 0.004) * 0.4;
  const armSwing = Math.sin(t * 0.007) * 2;

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feet
  ctx.fillStyle = '#0A0D15';
  ctx.fillRect(-6, -3 + bob, 4, 3);
  ctx.fillRect(2, -3 + bob, 4, 3);

  // Legs
  const walkL = Math.sin(t * 0.007) * 0.8;
  ctx.fillStyle = '#0D1020';
  ctx.fillRect(-5, -12 + bob + walkL, 4, 12);
  ctx.fillRect(1, -12 + bob - walkL, 4, 12);

  // Body
  const bodyG = ctx.createLinearGradient(0, -26 + bob, 0, -11 + bob);
  bodyG.addColorStop(0, '#1E2564');
  bodyG.addColorStop(1, '#141840');
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.roundRect(-6 - breathe, -26 + bob, 12 + breathe * 2, 15, 3);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = C.violet;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Belt
  ctx.fillStyle = '#0A0A20';
  ctx.fillRect(-6, -13 + bob, 12, 2);
  ctx.fillStyle = C.gold;
  ctx.fillRect(-1.5, -13 + bob, 3, 2);

  // Arms
  ctx.fillStyle = '#1A2050';
  ctx.save();
  ctx.translate(-7, -23 + bob);
  ctx.rotate(armSwing * 0.04);
  ctx.fillRect(-1, 0, 3, 10);
  ctx.restore();
  ctx.save();
  ctx.translate(7, -23 + bob);
  ctx.rotate(-armSwing * 0.04);
  ctx.fillRect(-2, 0, 3, 10);
  ctx.restore();

  // Hands
  ctx.fillStyle = '#E0C0A8';
  ctx.beginPath();
  ctx.arc(-7, -13 + bob + armSwing * 0.2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -13 + bob - armSwing * 0.2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headG = ctx.createRadialGradient(0, -32 + bob, 1, 0, -32 + bob, 6);
  headG.addColorStop(0, '#F5D8C5');
  headG.addColorStop(1, '#E0C0A8');
  ctx.fillStyle = headG;
  ctx.beginPath();
  ctx.arc(0, -32 + bob, 6, 0, Math.PI * 2);
  ctx.fill();

  // Hair / hat
  ctx.fillStyle = C.violet;
  ctx.shadowColor = C.violet;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.ellipse(0, -36 + bob, 7, 4.5, 0, Math.PI, 2 * Math.PI);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Hat brim
  ctx.fillStyle = '#3A2AEE';
  ctx.beginPath();
  ctx.ellipse(0, -35 + bob, 8, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = C.cyan;
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.arc(-2, -32 + bob, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2, -32 + bob, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Mouth
  ctx.strokeStyle = '#C09080';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(0, -29 + bob, 2, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Name tag
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = C.cyan;
  ctx.textAlign = 'center';
  ctx.shadowColor = C.cyan;
  ctx.shadowBlur = 6;
  ctx.fillText(name, 0, -44 + bob);
  ctx.shadowBlur = 0;

  // Card icon
  ctx.font = '8px sans-serif';
  ctx.fillText('💳', 10, -23 + bob);

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW — ROOM NUMBER ON FLOOR (carpet pattern)
// ═══════════════════════════════════════════════════════════════

function drawFloorNumber(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  num: string
): void {
  ctx.save();
  ctx.font = 'bold 6px monospace';
  ctx.fillStyle = 'rgba(74,58,255,0.15)';
  ctx.textAlign = 'center';
  ctx.fillText(num, x, y + 2);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

interface ActionBtnProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

const ActionBtn = memo(function ActionBtn({ icon, label, color, onPress, disabled = false }: ActionBtnProps) {
  return (
    <button
      onClick={disabled ? undefined : onPress}
      style={{
        background: disabled ? 'rgba(255,255,255,0.03)' : `rgba(${hexToRgb(color)},0.14)`,
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
        boxShadow: disabled ? 'none' : `0 0 10px ${color}22`,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 11 }}>{label}</span>
    </button>
  );
});

const LegendDot = memo(function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />
      <span style={{ fontSize: 10, color: 'rgba(242,242,242,0.5)' }}>{label}</span>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CorridorProps {
  floorId?: number;
  floorNumber?: number;
  buildingName?: string;
  characterId?: number;
  characterName?: string;
  hasMagneticCard?: boolean;
  onEnterApartment?: ((aptId: number) => void) | null;
}

export default function EtherWorldCorridorCanvas({
  floorId = 1,
  floorNumber = 1,
  buildingName = 'EtherWorld Tower',
  characterId = 1,
  characterName = 'Toi',
  hasMagneticCard = true,
  onEnterApartment = null,
}: CorridorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);

  // ── State ──
  const [doors, setDoors] = useState<DoorData[]>(() => generateDoors({ floorNumber }));
  const doorsRef = useRef(doors);
  useEffect(() => { doorsRef.current = doors; }, [doors]);

  const [camOffset, setCamOffset] = useState(0);
  const camRef = useRef(0);
  useEffect(() => { camRef.current = camOffset; }, [camOffset]);

  const dragRef = useRef<DragState>({ active: false, startX: 0, startCam: 0, moved: false });

  const [hoveredDoor, setHoveredDoor] = useState<DoorData | null>(null);
  const [selectedDoor, setSelectedDoor] = useState<DoorData | null>(null);
  const hoveredRef = useRef<DoorData | null>(null);
  useEffect(() => { hoveredRef.current = hoveredDoor; }, [hoveredDoor]);

  const avatarRef = useRef<AvatarPos>({ tx: CORRIDOR_W / 2, ty: 5 });
  const [avatarPos, setAvatarPos] = useState<AvatarPos>({ tx: CORRIDOR_W / 2, ty: 5 });
  useEffect(() => { avatarRef.current = avatarPos; }, [avatarPos]);

  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const addAlert = useCallback((msg: string, type: AlertData['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setAlerts(prev => [...prev.slice(-(ALERT_MAX - 1)), { id, msg, type }]);
    const timer = setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
      timersRef.current.delete(timer);
    }, ALERT_DURATION);
    timersRef.current.add(timer);
  }, []);

  // Cleanup timers
  useEffect(() => {
    const timers = timersRef.current;
    return () => { timers.forEach(clearTimeout); };
  }, []);

  const stats = useMemo<FloorStats>(() => ({
    unlocked: doors.filter(d => !d.isLocked).length,
    forRent: doors.filter(d => d.isForRent && !d.ownerName).length,
    occupied: doors.filter(d => !!d.ownerName).length,
    totalValue: doors.reduce((s, d) => s + (d.ownerName ? d.rentPrice : 0), 0),
  }), [doors]);

  // NPCs
  const npcs = useMemo(() => [
    { name: 'Concierge', tx: CORRIDOR_W / 2, ty: 2, color: '#445599', seed: 1 },
    { name: 'Voisin', tx: CORRIDOR_W / 2 - 1, ty: 12, color: '#995544', seed: 2 },
    { name: 'Livreur', tx: CORRIDOR_W / 2 + 1, ty: 18, color: '#449944', seed: 3 },
  ], []);

  // ── API fetch ──
  useEffect(() => {
    fetch(`${API_URL}/buildings/floor/${floorId}`)
      .then(r => r.json())
      .then(data => {
        if (data.apartments) setDoors(generateDoors({ floorNumber, apartments: data.apartments }));
      })
      .catch(() => { /* offline */ });
  }, [floorId, floorNumber]);

  // ── WebSocket ──
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
            setDoors(prev => prev.map(d =>
              d.aptId === msg.apartmentId ? { ...d, isLocked: msg.isLocked, justChanged: true } : d
            ));
            const t = setTimeout(() => {
              setDoors(prev => prev.map(d =>
                d.aptId === msg.apartmentId ? { ...d, justChanged: false } : d
              ));
            }, CHANGE_FLASH_MS);
            timersRef.current.add(t);
            addAlert(
              `${msg.isLocked ? '🔒' : '🔓'} Porte ${msg.apartmentId} ${msg.isLocked ? 'barrée' : 'débarrée'}`,
              msg.isLocked ? 'success' : 'warning'
            );
          }
          if (msg.type === 'DOOR_UNLOCKED_ALERT') {
            addAlert(`⚠️ Apt ${msg.apartmentId} ouvert — ét. ${floorNumber}`, 'warning');
            setDoors(prev => prev.map(d =>
              d.aptId === msg.apartmentId ? { ...d, hasActivity: true } : d
            ));
          }
          if (msg.type === 'DOOR_FORCED') {
            addAlert(`🚨 PORTE FORCÉE — Apt ${msg.apartmentId} !`, 'danger');
            setDoors(prev => prev.map(d =>
              d.aptId === msg.apartmentId ? { ...d, isLocked: false, justChanged: true, hasActivity: true } : d
            ));
          }
        } catch { /* malformed */ }
      };
      ws.onclose = () => { reconnectTimer = setTimeout(connect, WS_RECONNECT_MS); };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => { clearTimeout(reconnectTimer); ws?.close(); };
  }, [floorId, floorNumber, characterId, addAlert]);

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

  // ── Keyboard movement ──
  useEffect(() => {
    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    const tick = setInterval(() => {
      const active = document.activeElement?.tagName;
      if (active === 'INPUT' || active === 'TEXTAREA') return;

      let moved = false;
      if (keys.has('arrowleft') || keys.has('a')) {
        setAvatarPos(p => ({ ...p, tx: Math.max(0, p.tx - AVATAR_SPEED) }));
        moved = true;
      }
      if (keys.has('arrowright') || keys.has('d')) {
        setAvatarPos(p => ({ ...p, tx: Math.min(CORRIDOR_W - 1, p.tx + AVATAR_SPEED) }));
        moved = true;
      }
      if (keys.has('arrowup') || keys.has('w')) {
        setAvatarPos(p => ({ ...p, ty: Math.max(0, p.ty - AVATAR_SPEED) }));
        moved = true;
      }
      if (keys.has('arrowdown') || keys.has('s')) {
        setAvatarPos(p => ({ ...p, ty: Math.min(CORRIDOR_LEN - 1, p.ty + AVATAR_SPEED) }));
        moved = true;
      }

      if (moved) {
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = window.devicePixelRatio || 1;
          const W = canvas.width / dpr;
          const av = avatarRef.current;
          const targetX = isoX(av.tx, av.ty, W / 2) - W / 2;
          setCamOffset(prev => clamp(prev + (0 - targetX - prev) * 0.08, CAM_MIN, CAM_MAX));
        }
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

  // ── Render helpers ──
  const getBaseOffset = useCallback((canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    return { ox: W / 2 + camRef.current, oy: H * 0.45, W, H };
  }, []);

  // ── RENDER SCENE ──
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

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#04040A');
    bg.addColorStop(0.5, '#08081A');
    bg.addColorStop(1, '#06060F');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const calls: DrawCall[] = [];

    // ── Floor tiles + carpet ──
    for (let tx = 0; tx < CORRIDOR_W; tx++) {
      for (let ty = 0; ty < CORRIDOR_LEN; ty++) {
        const x = isoX(tx, ty, ox);
        const y = isoY(tx, ty, oy);
        const even = (tx + ty) % 2 === 0;

        calls.push({
          z: tx + ty,
          fn: () => {
            drawTile(ctx, x, y, even ? '#0E1018' : '#111420', even ? '#12151E' : '#141820');
            // Central carpet
            if (tx >= 2 && tx <= 3) {
              drawCarpet(ctx, x, y, CARPET_COLORS[ty % CARPET_COLORS.length]);
            }
          },
        });
      }
    }

    // ── Left walls ──
    for (let ty = 0; ty < CORRIDOR_LEN; ty++) {
      const x = isoX(0, ty, ox);
      const y = isoY(0, ty, oy);
      calls.push({ z: ty - 0.5, fn: () => drawWallLeft(ctx, x, y) });
    }

    // ── Right walls ──
    for (let ty = 0; ty < CORRIDOR_LEN; ty++) {
      const x = isoX(CORRIDOR_W - 1, ty, ox);
      const y = isoY(CORRIDOR_W - 1, ty, oy);
      calls.push({ z: CORRIDOR_W - 1 + ty - 0.3, fn: () => drawWallRight(ctx, x, y) });
    }

    // ── Ceiling lights ──
    for (let ty = 2; ty < CORRIDOR_LEN; ty += LIGHT_INTERVAL) {
      const cx = CORRIDOR_W / 2 - 0.5;
      const x = isoX(cx, ty, ox);
      const y = isoY(cx, ty, oy);
      calls.push({ z: cx + ty - 0.1, fn: () => drawCeilingLight(ctx, x, y, t, ty) });
    }

    // ── Potted plants ──
    for (const pp of PLANT_POSITIONS) {
      if (pp >= CORRIDOR_LEN) continue;
      const side: 'left' | 'right' = pp % 2 === 0 ? 'right' : 'left';
      const ptx = side === 'left' ? 0 : CORRIDOR_W - 1;
      const px = isoX(ptx, pp, ox);
      const py = isoY(ptx, pp, oy);
      calls.push({ z: ptx + pp - 0.2, fn: () => drawPottedPlant(ctx, px, py, t, pp, side) });
    }

    // ── Fire extinguishers ──
    for (const fe of EXTINGUISHER_POSITIONS) {
      if (fe >= CORRIDOR_LEN) continue;
      const side: 'left' | 'right' = fe % 2 === 0 ? 'left' : 'right';
      const ftx = side === 'left' ? 0 : CORRIDOR_W - 1;
      const fx = isoX(ftx, fe, ox);
      const fy = isoY(ftx, fe, oy);
      calls.push({ z: ftx + fe - 0.3, fn: () => drawExtinguisher(ctx, fx, fy, side) });
    }

    // ── Wall paintings ──
    for (const wp of PAINTING_POSITIONS) {
      if (wp >= CORRIDOR_LEN) continue;
      const side: 'left' | 'right' = wp % 2 === 0 ? 'left' : 'right';
      const wtx = side === 'left' ? 0 : CORRIDOR_W - 1;
      const wx = isoX(wtx, wp, ox);
      const wy = isoY(wtx, wp, oy);
      calls.push({ z: wtx + wp - 0.35, fn: () => drawPainting(ctx, wx, wy, side, wp) });
    }

    // ── Security cameras ──
    for (const cp of CAMERA_POSITIONS) {
      if (cp >= CORRIDOR_LEN) continue;
      const side: 'left' | 'right' = cp < CORRIDOR_LEN / 2 ? 'left' : 'right';
      const ctx2 = side === 'left' ? 0 : CORRIDOR_W - 1;
      const cx2 = isoX(ctx2, cp, ox);
      const cy2 = isoY(ctx2, cp, oy);
      calls.push({ z: ctx2 + cp - 0.4, fn: () => drawSecurityCamera(ctx, cx2, cy2, t, side) });
    }

    // ── Floor signs ──
    {
      const cx1 = CORRIDOR_W / 2 - 0.5;
      // Entrance
      const x1 = isoX(cx1, 0, ox);
      const y1 = isoY(cx1, 0, oy);
      calls.push({ z: cx1 - 0.15, fn: () => drawFloorSign(ctx, x1, y1, floorNumber, true) });
      // Exit
      const x2 = isoX(cx1, CORRIDOR_LEN - 1, ox);
      const y2 = isoY(cx1, CORRIDOR_LEN - 1, oy);
      calls.push({ z: cx1 + CORRIDOR_LEN - 1 - 0.15, fn: () => drawExitSign(ctx, x2, y2, t) });
    }

    // ── Floor door numbers (subtle floor markers) ──
    for (const door of drs) {
      const fx = isoX(CORRIDOR_W / 2 - 0.5, door.ty, ox);
      const fy = isoY(CORRIDOR_W / 2 - 0.5, door.ty, oy);
      calls.push({ z: CORRIDOR_W / 2 + door.ty - 0.6, fn: () => drawFloorNumber(ctx, fx, fy, door.aptNumber) });
    }

    // ── Doors ──
    for (const door of drs) {
      const dx = isoX(door.tx, door.ty, ox);
      const dy = isoY(door.tx, door.ty, oy);
      calls.push({
        z: door.tx + door.ty + (door.side === 'left' ? -0.4 : 0.4),
        fn: () => drawDoorInWall(ctx, dx, dy, door, t, hov?.id === door.id),
      });
    }

    // ── NPCs ──
    for (const npc of npcs) {
      const nx = isoX(npc.tx, npc.ty, ox);
      const ny = isoY(npc.tx, npc.ty, oy);
      calls.push({ z: npc.tx + npc.ty + 0.3, fn: () => drawNPC(ctx, nx, ny, t, npc.name, npc.color, npc.seed) });
    }

    // ── Player avatar ──
    const ax = isoX(av.tx, av.ty, ox);
    const ay = isoY(av.tx, av.ty, oy);
    calls.push({ z: av.tx + av.ty + 0.5, fn: () => drawCorridorAvatar(ctx, ax, ay, t, characterName) });

    // ── Sort & render ──
    calls.sort((a, b) => a.z - b.z);
    for (const c of calls) c.fn();

    // ── Vignette ──
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.12, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // ── Scanlines ──
    ctx.globalAlpha = 0.012;
    for (let sy = 0; sy < H; sy += 3) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, sy, W, 1);
    }
    ctx.globalAlpha = 1;

    // ── Ambient particles (dust motes) ──
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 15; i++) {
      const px = ((t * 0.01 + i * 137) % W);
      const py = ((t * 0.005 + i * 89) % H);
      const sz = 0.5 + seededRand(i + 777) * 1.5;
      ctx.fillStyle = C.cyan;
      ctx.beginPath();
      ctx.arc(px, py, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }, [getBaseOffset, floorNumber, npcs, characterName]);

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
  const hitTestDoor = useCallback((cx: number, cy: number): DoorData | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = cx - rect.left;
    const sy = cy - rect.top;
    const { ox, oy } = getBaseOffset(canvas);
    let closest: DoorData | null = null;
    let minDist = HIT_RADIUS;
    for (const door of doorsRef.current) {
      const x = isoX(door.tx, door.ty, ox);
      const y = isoY(door.tx, door.ty, oy);
      const dist = Math.hypot(sx - x, sy - y);
      if (dist < minDist) { minDist = dist; closest = door; }
    }
    return closest;
  }, [getBaseOffset]);

  // ── Door actions ──
  const handleDoorAction = useCallback(async (door: DoorData, action: string) => {
    if (action === 'enter') {
      if (door.isLocked && door.ownerId !== characterId) {
        addAlert('❌ Porte verrouillée — pas d\'accès', 'danger');
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
          addAlert(`✅ ${door.aptNumber} loué ! Carte: ${data.cardUid}`, 'success');
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
      addAlert('🔧 Crochetage en cours...', 'warning');
      try {
        const res = await fetch(`${API_URL}/doors/${door.id}/lockpick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId }),
        });
        const data = await res.json();
        if (data.success) {
          setDoors(prev => prev.map(d => d.id === door.id ? { ...d, isLocked: false, justChanged: true } : d));
          addAlert('✅ Crochetage réussi !', 'success');
        } else {
          addAlert('❌ Crochetage échoué — serrure trop résistante', 'danger');
        }
      } catch {
        const success = seededRand(Date.now()) > 0.4;
        if (success) {
          setDoors(prev => prev.map(d => d.id === door.id ? { ...d, isLocked: false, justChanged: true } : d));
        }
        addAlert(success ? '✅ Crochetage réussi (local)' : '❌ Crochetage échoué', 'warning');
      }
      const timer = setTimeout(() => {
        setDoors(prev => prev.map(d => d.id === door.id ? { ...d, justChanged: false } : d));
      }, CHANGE_FLASH_MS);
      timersRef.current.add(timer);
      return;
    }

    // Toggle lock
    if (!hasMagneticCard && door.ownerId !== characterId) {
      addAlert('❌ Pas de carte magnétique', 'danger');
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
        setDoors(prev => prev.map(d =>
          d.id === door.id ? { ...d, isLocked: data.isLocked, justChanged: true } : d
        ));
        addAlert(data.isLocked ? '🔒 Porte barrée' : '🔓 Porte débarrée', 'success');
      }
    } catch {
      setDoors(prev => prev.map(d =>
        d.id === door.id ? { ...d, isLocked: !d.isLocked, justChanged: true } : d
      ));
      addAlert('🔓 Porte (mode hors-ligne)', 'warning');
    }

    const timer = setTimeout(() => {
      setDoors(prev => prev.map(d => d.id === door.id ? { ...d, justChanged: false } : d));
    }, CHANGE_FLASH_MS);
    timersRef.current.add(timer);
  }, [hasMagneticCard, characterId, addAlert, onEnterApartment]);

  // ── Mouse handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startCam: camRef.current, moved: false };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (drag.active) {
      if (Math.abs(e.clientX - drag.startX) > DRAG_THRESHOLD) drag.moved = true;
      setCamOffset(clamp(drag.startCam + (e.clientX - drag.startX), CAM_MIN, CAM_MAX));
    }
    setHoveredDoor(hitTestDoor(e.clientX, e.clientY));
  }, [hitTestDoor]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const wasDrag = dragRef.current.moved;
    dragRef.current.active = false;
    if (!wasDrag) {
      const door = hitTestDoor(e.clientX, e.clientY);
      setSelectedDoor(door);
    }
  }, [hitTestDoor]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    setCamOffset(prev => clamp(prev - e.deltaY * 0.5, CAM_MIN, CAM_MAX));
  }, []);

  // ── Touch handlers ──
  const touchRef = useRef({ x: 0, moved: false });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = { x: touch.clientX, moved: false };
    dragRef.current = { active: true, startX: touch.clientX, startCam: camRef.current, moved: false };
    setHoveredDoor(hitTestDoor(touch.clientX, touch.clientY));
  }, [hitTestDoor]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (Math.abs(touch.clientX - touchRef.current.x) > DRAG_THRESHOLD) touchRef.current.moved = true;
    if (dragRef.current.active) {
      dragRef.current.moved = touchRef.current.moved;
      setCamOffset(clamp(dragRef.current.startCam + (touch.clientX - dragRef.current.startX), CAM_MIN, CAM_MAX));
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    dragRef.current.active = false;
    if (!touchRef.current.moved) {
      const touch = e.changedTouches[0];
      setSelectedDoor(hitTestDoor(touch.clientX, touch.clientY));
    }
  }, [hitTestDoor]);

  const sel = selectedDoor;

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.bg,
      fontFamily: "'Segoe UI', monospace",
      overflow: 'hidden', userSelect: 'none',
    }}>

      {/* ═══ HEADER ═══ */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        background: 'linear-gradient(180deg,rgba(5,5,10,0.98) 0%,transparent 100%)',
        padding: '12px 16px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg,${C.violet},${C.cyan})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: `0 0 14px ${C.violet}66`,
          }}>🏢</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.light, letterSpacing: '0.04em' }}>{buildingName}</div>
            <div style={{ fontSize: 10, color: C.cyan, letterSpacing: '0.18em', marginTop: 1 }}>
              {floorLabel(floorNumber)} — COULOIR
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { l: '🔓', v: stats.unlocked, c: stats.unlocked > 0 ? C.orange : C.dim, t: 'OUVERTES' },
            { l: '🏠', v: stats.occupied, c: C.cyan, t: 'OCCUPÉS' },
            { l: '🔑', v: stats.forRent, c: C.yellow, t: 'À LOUER' },
            { l: '💰', v: `${stats.totalValue}$`, c: C.gold, t: 'REVENUS' },
          ].map(s => (
            <div key={s.t} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '4px 8px', textAlign: 'center', minWidth: 48,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 7, color: C.dim, letterSpacing: '0.06em' }}>{s.l} {s.t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CONTROLS HINT ═══ */}
      <div style={{
        position: 'absolute', top: 76, left: 12, zIndex: 15,
        background: 'rgba(6,6,14,0.7)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, padding: '5px 10px', backdropFilter: 'blur(8px)',
      }}>
        {['WASD / ← → ↑ ↓ = Déplacer', 'Glisser / Molette = Caméra', 'Clic porte = Interagir'].map(t => (
          <div key={t} style={{ fontSize: 8, color: C.dim, letterSpacing: '0.08em' }}>{t}</div>
        ))}
      </div>

      {/* ═══ CANVAS ═══ */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          cursor: hoveredDoor ? 'pointer' : dragRef.current.active ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* ═══ SCROLL HINTS ═══ */}
      {!sel && (
        <>
          {['left', 'right'].map(side => (
            <div key={side} style={{
              position: 'absolute', top: '50%',
              [side]: 12, transform: 'translateY(-50%)',
              zIndex: 10, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, opacity: 0.35,
            }}>
              <div style={{ fontSize: 18, color: C.cyan }}>{side === 'left' ? '◀' : '▶'}</div>
              <div style={{ fontSize: 8, color: C.dim, writingMode: 'vertical-rl', letterSpacing: '0.15em' }}>DÉFILER</div>
            </div>
          ))}
        </>
      )}

      {/* ═══ ALERTS ═══ */}
      <div style={{
        position: 'absolute', top: 76, right: 12, zIndex: 50,
        display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 260,
      }}>
        {alerts.map(a => {
          const colors = {
            danger: { bg: 'rgba(255,58,58,0.15)', border: C.red },
            warning: { bg: 'rgba(255,154,58,0.15)', border: C.orange },
            success: { bg: 'rgba(0,255,157,0.1)', border: C.green },
            info: { bg: 'rgba(0,224,255,0.1)', border: C.cyan },
          };
          const ac = colors[a.type];
          return (
            <div key={a.id} style={{
              background: ac.bg, border: `1px solid ${ac.border}55`,
              borderRadius: 10, padding: '8px 12px', fontSize: 11,
              color: C.light, fontWeight: 600, backdropFilter: 'blur(10px)',
              animation: 'slideIn 0.3s ease',
            }}>{a.msg}</div>
          );
        })}
      </div>

      {/* ═══ SELECTED DOOR PANEL ═══ */}
      {sel && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: C.panel,
          borderTop: `1px solid ${sel.isLocked ? C.red : C.green}44`,
          borderRadius: '20px 20px 0 0',
          padding: '18px 20px 30px', backdropFilter: 'blur(20px)',
        }}>
          {/* Pull handle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 28 }}>{sel.isLocked ? '🔒' : '🔓'}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.light }}>{sel.aptNumber}</div>
                  <div style={{ fontSize: 11, color: sel.isLocked ? C.red : C.green, marginTop: 2 }}>
                    {sel.isLocked ? 'VERROUILLÉ' : '⚠️ DÉVERROUILLÉ'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: C.dim }}>
                  👤 {sel.ownerName ?? 'Inoccupé'} · 💰 {sel.rentPrice}$/mois
                </div>
                <div style={{ fontSize: 11, color: sel.isForRent && !sel.ownerName ? C.yellow : C.dim }}>
                  {sel.isForRent && !sel.ownerName ? '🔑 Disponible' : sel.ownerName ? '🏠 Occupé' : '🚫 Indisponible'}
                </div>
                <div style={{ fontSize: 10, color: C.dim }}>
                  🛡️ {SECURITY_LABELS[sel.securityLevel]}
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedDoor(null)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '8px 12px', color: C.dim, fontSize: 13, cursor: 'pointer',
            }}>✕</button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionBtn
              icon="🚪" label="Entrer" color={C.cyan}
              disabled={sel.isLocked && sel.ownerId !== characterId}
              onPress={() => handleDoorAction(sel, 'enter')}
            />
            {sel.ownerId === characterId && (
              <ActionBtn
                icon={sel.isLocked ? '🔓' : '🔒'}
                label={sel.isLocked ? 'Débarrer' : 'Barrer'}
                color={sel.isLocked ? C.green : C.red}
                onPress={() => handleDoorAction(sel, 'toggle')}
              />
            )}
            {sel.isForRent && !sel.ownerName && (
              <ActionBtn
                icon="🔑" label={`Louer — ${sel.rentPrice}$`}
                color={C.yellow}
                onPress={() => handleDoorAction(sel, 'rent')}
              />
            )}
            {sel.isLocked && sel.ownerId !== characterId && (
              <ActionBtn
                icon="🔧" label="Crocheter" color={C.magenta}
                onPress={() => handleDoorAction(sel, 'lockpick')}
              />
            )}
            {sel.ownerId === characterId && (
              <ActionBtn
                icon="🛡️" label="Sécurité +" color={C.gold}
                onPress={() => {
                  setDoors(prev => prev.map(d =>
                    d.id === sel.id ? { ...d, securityLevel: Math.min(3, d.securityLevel + 1) } : d
                  ));
                  addAlert('🛡️ Sécurité améliorée !', 'success');
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ═══ LEGEND ═══ */}
      {!sel && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, display: 'flex', gap: 12, alignItems: 'center',
          background: 'rgba(6,6,14,0.85)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '8px 18px', backdropFilter: 'blur(12px)',
        }}>
          <LegendDot color={C.red} label="Barré" />
          <LegendDot color={C.green} label="Ouvert" />
          <LegendDot color={C.yellow} label="À louer" />
          <LegendDot color={C.cyan} label="Occupé" />
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: 10, color: C.dim }}>← Glisser →</div>
        </div>
      )}

      {/* ═══ MINIMAP ═══ */}
      <div style={{
        position: 'absolute', bottom: sel ? 240 : 65, right: 12, zIndex: 30,
        background: 'rgba(6,6,14,0.9)', border: `1px solid ${C.violet}33`,
        borderRadius: 12, padding: '8px', backdropFilter: 'blur(10px)',
        transition: 'bottom 0.3s ease',
      }}>
        <div style={{ fontSize: 8, color: C.dim, letterSpacing: '0.12em', marginBottom: 6, textAlign: 'center' }}>
          PLAN — ÉT. {floorNumber}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {['left', 'right'].map(side => (
            <div key={side} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <div style={{ fontSize: 6, color: C.dim, width: 10, textAlign: 'right', marginRight: 2 }}>
                {side === 'left' ? 'G' : 'D'}
              </div>
              {doors.filter(d => d.side === side).map(door => {
                const bg = door.isLocked
                  ? (door.ownerName ? C.cyan + '88' : door.isForRent ? C.yellow + '66' : C.dim + '44')
                  : C.green + 'CC';
                return (
                  <div
                    key={door.id}
                    title={`${door.aptNumber} — ${door.isLocked ? 'Barré' : 'Ouvert'}`}
                    onClick={() => setSelectedDoor(door)}
                    style={{
                      width: 10, height: 10, borderRadius: 2, background: bg,
                      border: sel?.id === door.id ? `1px solid ${C.light}` : '1px solid transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: !door.isLocked ? `0 0 4px ${C.green}` : 'none',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 7, color: C.dim, marginTop: 5, textAlign: 'center' }}>
          {stats.unlocked} ouvertes · {stats.occupied} occupées
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}