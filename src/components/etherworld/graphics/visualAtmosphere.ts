/**
 * src/components/etherworld/graphics/visualAtmosphere.ts
 * 
 * Noyau Graphique Central d'EtherWorld (Québec RP).
 * Unifie la résolution horaire, la gestion des palettes atmosphériques et les shaders Three.js.
 * Élimine toute redondance entre HDVisualRig et WorldGraphics.
 */

import * as THREE from 'three';

export type TimePhase = 'night' | 'dawn' | 'day' | 'dusk';

/**
 * Calcule la phase atmosphérique active selon une heure (0-24) ou une chaîne explicite
 */
export function resolveTimePhase(time: string | number, explicitPhase?: string): TimePhase {
  if (explicitPhase === 'night' || explicitPhase === 'dawn' || explicitPhase === 'dusk') return explicitPhase;
  if (typeof time === 'string') {
    if (time === 'night' || time === 'dawn' || time === 'dusk') return time;
    return 'day';
  }
  const t = typeof time === 'number' ? time % 24 : 12;
  if (t >= 21 || t < 5)  return 'night';
  if (t >= 5  && t < 8)  return 'dawn';
  if (t >= 18 && t < 21) return 'dusk';
  return 'day';
}

export interface AtmospherePalette {
  background: string;
  fog: string;
  ambient: string;
  hemiSky: string;
  hemiGround: string;
  sun: string;
  fill: string;
  rim: string;
  lamp: string;
  reflector: string;
  cityGlow: string;
  keyIntensity: number;
  ambientIntensity: number;
  hemiIntensity: number;
  fogNear: number;
  fogFar: number;
}

/**
 * Palette de couleurs institutionnelles et HD selon la phase et la météo
 */
export function getAtmospherePalette(phase: TimePhase, weather: string): AtmospherePalette {
  const rainy = weather === 'rain' || weather === 'storm';
  const snowy = weather === 'snow' || weather === 'blizzard';
  const foggy = weather === 'fog';

  if (phase === 'night') {
    return {
      background: '#040712',      // Nuit profonde municipale
      fog: rainy ? '#08101a' : snowy ? '#121e30' : '#060a16',
      ambient: '#1e293b',         // Gris ardoise institutionnel
      hemiSky: '#12203b',
      hemiGround: '#0a0f18',
      sun: '#38bdf8',             // Reflet lunaire percutant
      fill: '#0284c7',
      rim: '#93c5fd',
      lamp: '#fde047',            // Jaune halogène d'éclairage de rue
      reflector: '#facc15',
      cityGlow: '#0284c7',
      keyIntensity: 0.55,
      ambientIntensity: 0.35,
      hemiIntensity: 0.6,
      fogNear: foggy ? 10 : 35,
      fogFar: foggy ? 180 : rainy ? 350 : snowy ? 300 : 700,
    };
  }

  if (phase === 'dawn') {
    return {
      background: '#7ea4c4',
      fog: snowy ? '#cbd6e0' : rainy ? '#6b8294' : '#a2b9c7',
      ambient: '#fcd34d',
      hemiSky: '#bae6fd',
      hemiGround: '#334155',
      sun: '#f97316',
      fill: '#38bdf8',
      rim: '#fef08a',
      lamp: '#ffd28a',
      reflector: '#facc15',
      cityGlow: '#f97316',
      keyIntensity: 1.25,
      ambientIntensity: 0.45,
      hemiIntensity: 0.7,
      fogNear: foggy ? 10 : 50,
      fogFar: foggy ? 180 : rainy ? 380 : snowy ? 340 : 750,
    };
  }

  if (phase === 'dusk') {
    return {
      background: '#475569',
      fog: snowy ? '#818cf8' : rainy ? '#334155' : '#475569',
      ambient: '#f43f5e',
      hemiSky: '#a855f7',
      hemiGround: '#1e293b',
      sun: '#ea580c',
      fill: '#0284c7',
      rim: '#fcd34d',
      lamp: '#facc15',
      reflector: '#f59e0b',
      cityGlow: '#f43f5e',
      keyIntensity: 1.05,
      ambientIntensity: 0.4,
      hemiIntensity: 0.65,
      fogNear: foggy ? 10 : 45,
      fogFar: foggy ? 170 : rainy ? 350 : snowy ? 320 : 680,
    };
  }

  // Plein Jour (Day)
  return {
    background: rainy ? '#64748b' : snowy ? '#e2e8f0' : '#38bdf8',
    fog: rainy ? '#64748b' : snowy ? '#f1f5f9' : '#7dd3fc',
    ambient: '#f8fafc',
    hemiSky: '#e0f2fe',
    hemiGround: '#1e293b',
    sun: '#ffffff',
    fill: '#7dd3fc',
    rim: '#ffffff',
    lamp: '#fff3bd',
    reflector: '#ffffff',
    cityGlow: '#38bdf8',
    keyIntensity: rainy ? 0.9 : snowy ? 1.2 : 1.6,
    ambientIntensity: rainy ? 0.5 : 0.65,
    hemiIntensity: rainy ? 0.65 : 0.8,
    fogNear: foggy ? 12 : rainy ? 40 : snowy ? 35 : 140,
    fogFar: foggy ? 190 : rainy ? 380 : snowy ? 350 : 950,
  };
}

/**
 * Crée un dôme texture linéaire propre
 */
export function createSkyGradientTexture(topColor: string, bottomColor: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 2; canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, topColor);
  g.addColorStop(0.6, bottomColor);
  g.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
