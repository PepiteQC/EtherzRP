/**
 * cartoonTokens.ts — EtherWorld QC · Design System "Low-Poly Cartoon"
 * ------------------------------------------------------------------
 * Source UNIQUE de vérité pour les couleurs / matériaux / effets.
 * Utilisé à la fois par la 3D (Three.js) ET l'UI (React/CSS).
 *
 * Direction artistique : low-poly flat-shaded, palette chaude québécoise,
 * ombres douces, accents cartoon. Cohérent avec le lapin-fusée 🐰🥕.
 *
 * Aucune dépendance. À copier dans : src/ui/theme/cartoonTokens.ts
 */

// ── PALETTE (hex string pour l'UI, number pour Three.js) ──────────
export const PALETTE = {
  // Fonds / ciel
  skyTop:      '#8ecae6', // bleu ciel doux
  skyBottom:   '#e9f5ff', // horizon clair
  skyNight:    '#1b2a4a', // ciel de nuit cartoon

  // Sol / nature (Québec : verts, terres, eau)
  grass:       '#7cb342', // gazon vif
  grassDark:   '#558b2f',
  ground:      '#a1887f', // terre / trottoir
  road:        '#5d5d6e', // asphalte doux (pas noir pur)
  water:       '#4fb0c6', // fleuve / lac

  // Bâtiments (couleurs franches façon maquette)
  brick:       '#c1583c', // brique québécoise
  wood:        '#8d5524',
  wall:        '#f2e8cf', // crème
  roof:        '#3d5a80', // bleu ardoise

  // Accents de marque (chauds + un froid)
  primary:     '#ff8c42', // orange carotte 🥕 (signature)
  secondary:   '#ffd166', // jaune doux
  accent:      '#06b6d4', // cyan ponctuel
  pink:        '#ef476f', // rose lapin
  green:       '#06d6a0', // menthe (succès)

  // Neutres UI
  ink:         '#26233a', // texte foncé chaud (pas noir pur)
  paper:       '#fffaf0', // blanc crème (UI claire)
  cloud:       '#ffffff',
  shadow:      '#2b2440', // teinte d'ombre (chaude, pas grise)
} as const

// Version numérique pour Three.js (0xRRGGBB)
export const HEX = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, parseInt(v.slice(1), 16)]),
) as Record<keyof typeof PALETTE, number>

// ── ÉCHELLE TYPO / RAYONS / OMBRES (UI) ───────────────────────────
export const UI = {
  font: "'Baloo 2', 'Nunito', 'Segoe UI', system-ui, sans-serif", // rondeurs cartoon
  radius: { sm: 8, md: 14, lg: 22, pill: 999 },
  // Ombres "stickers" : décalées, colorées, douces
  shadow: {
    sticker: `0 6px 0 0 ${PALETTE.shadow}22, 0 10px 24px -8px ${PALETTE.shadow}55`,
    card:    `0 4px 0 0 ${PALETTE.shadow}1a, 0 12px 30px -10px ${PALETTE.shadow}40`,
    pop:     `0 0 0 3px ${PALETTE.primary}33, 0 8px 24px -6px ${PALETTE.primary}66`,
  },
  border: `2px solid ${PALETTE.ink}14`,
} as const

// ── PARAMÈTRES DE RENDU 3D (cohérence garantie) ───────────────────
export const RENDER = {
  // Lumière directionnelle "soleil cartoon"
  sun: { color: HEX.cloud, intensity: 1.15, position: [12, 18, 8] as [number, number, number] },
  // Lumière d'appoint (rebond du ciel) — évite les ombres noires
  fill: { skyColor: HEX.skyTop, groundColor: HEX.grass, intensity: 0.7 },
  ambient: { color: HEX.skyBottom, intensity: 0.35 },
  // Brouillard doux pour fondre les lointains (perf + style)
  fog: { color: PALETTE.skyBottom, near: 35, far: 140 },
  // tone mapping doux + exposition cartoon
  toneMappingExposure: 1.05,
} as const

export default PALETTE
