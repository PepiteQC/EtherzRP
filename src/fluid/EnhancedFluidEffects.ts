/**
 * Enhanced FluidEffects module for EtherWorld (v2).
 *
 * Ce module regroupe et améliore la configuration de simulation de fluides
 * en fournissant des profils supplémentaires, de nouveaux types de superpositions
 * et de distorsions, ainsi qu'un utilitaire pour créer des configurations
 * personnalisées. Toutes les exportations d'origine sont réexportées pour
 * préserver la compatibilité avec l'API existante. Un export par défaut
 * fournit un accès agrégé aux fonctionnalités enrichies.
 *
 * @author PepiteQC / EtherWorld Team
 * @date 2026‑06‑15
 */

// Importations originales (placeholders pour montrer l'intention ;
// ajustez les chemins en fonction de votre arborescence de fichiers réelle).
// Ces importations permettent de réexporter les API d'origine afin de
// préserver la compatibilité avec le module existant.
import {
  EtherFluidSimulation,
  etherFluid,
  DEFAULT_FLUID_CONFIG,
  type FluidConfig,
  type FluidProfile,
  type FluidState,
  type OverlayType,
  type DistortionType,
} from './EtherFluidSimulation'
import {
  FluidDistortionPass,
  type FluidDistortionPassOptions,
} from './FluidDistortionPass'
import {
  FluidParticleSystem,
  type FluidParticleProps,
} from './FluidParticleSystem'
import {
  FluidRevealMask,
  type FluidRevealMaskProps,
} from './FluidRevealMask'
import {
  FluidScene,
  FluidSceneWrapper,
  useEtherFluid,
} from './FluidIntegrationExample'

// ============================================================================
//  BASE CONSTANTS
// ============================================================================
/**
 * Profils de fluides de base tels que définis dans le module original.
 * Chaque profil indique la résolution de la grille et le nombre
 * d'itérations de la simulation, ainsi qu'une estimation de coût relative.
 */
export const FLUID_PROFILES_BASE = {
  performance: { resolution: '128²', iterations: 6, cost: '1×' },
  balanced: { resolution: '256²', iterations: 12, cost: '~6×' },
  quality: { resolution: '384²', iterations: 20, cost: '~25×' },
} as const

/**
 * Types de superpositions de base appliqués au rendu du fluide.
 */
export const OVERLAY_TYPES_BASE = [
  'default',
  'artInk',
  'oil',
  'rainbowFish',
  'velocity',
  'glaze',
  'smoke',
  'colorWater',
  'liquidLens',
  'densityTint',
] as const

/**
 * Types de distorsion de base appliqués en post‑traitement.
 */
export const DISTORTION_TYPES_BASE = [
  'simple',
  'chromatic',
  'rgbShift',
  'water',
  'waterCaustics',
] as const

// ============================================================================
//  EXTENSIONS
// ============================================================================
/**
 * Profils supplémentaires offrant des options d'économie (eco), cinématiques
 * (cinematic) et haute définition (ultrahd). Ces profils utilisent des
 * résolutions plus grandes ou plus petites et modifient le nombre
 * d'itérations pour répondre à différents besoins de performances.
 */
export const FLUID_PROFILES_EXTENDED = {
  ...FLUID_PROFILES_BASE,
  eco: { resolution: '64²', iterations: 4, cost: '0.5×' },
  cinematic: { resolution: '512²', iterations: 30, cost: '~80×' },
  ultrahd: { resolution: '768²', iterations: 45, cost: '~180×' },
} as const

/**
 * Nouvelle énumération de superpositions incluant des effets supplémentaires
 * comme plasma, marble, electric et cosmic. Ces options offrent des
 * variations visuelles spectaculaires adaptées à des effets de gameplay
 * ou à des rendus artistiques.
 */
export const OVERLAY_TYPES_EXTENDED = [
  ...OVERLAY_TYPES_BASE,
  'plasma',
  'marble',
  'electric',
  'cosmic',
] as const

/**
 * Nouvelle énumération de distorsions ajoutant des effets comme wave,
 * kaleidoscope, vortex et turbulent. Ces distorsions fournissent des
 * effets visuels dynamiques supplémentaires pour varier les rendus.
 */
export const DISTORTION_TYPES_EXTENDED = [
  ...DISTORTION_TYPES_BASE,
  'wave',
  'kaleidoscope',
  'vortex',
  'turbulent',
] as const

// ============================================================================
//  TYPES EXTENDUS
// ============================================================================
/**
 * Type de superposition étendu combinant les superpositions originales et
 * nouvelles. Permet d'utiliser les nouveaux effets dans les configurations.
 */
export type OverlayTypeExtended = OverlayType | (typeof OVERLAY_TYPES_EXTENDED)[number]

/**
 * Type de distorsion étendu combinant les distorsions originales et
 * nouvelles. Permet d'utiliser les nouveaux effets dans les configurations.
 */
export type DistortionTypeExtended = DistortionType | (typeof DISTORTION_TYPES_EXTENDED)[number]

// ============================================================================
//  UTILITAIRES
// ============================================================================
/**
 * Construit une configuration de fluide personnalisée en fusionnant la
 * configuration par défaut avec des valeurs spécifiques. Utile pour
 * initialiser une simulation avec des paramètres ajustés rapidement.
 *
 * @param config - Les valeurs à remplacer dans la configuration.
 * @returns Une nouvelle configuration de fluide prête à l'emploi.
 */
export function createFluidConfig(config: Partial<FluidConfig> = {}): FluidConfig {
  return {
    ...DEFAULT_FLUID_CONFIG,
    ...config,
  }
}

// ============================================================================
//  RÉEXPORTATIONS ORIGINALES
// ============================================================================
// Ces exportations garantissent la compatibilité avec le module originel.
export {
  EtherFluidSimulation,
  etherFluid,
  DEFAULT_FLUID_CONFIG,
  FluidDistortionPass,
  FluidParticleSystem,
  FluidRevealMask,
  FluidScene,
  FluidSceneWrapper,
  useEtherFluid,
}

export type {
  FluidConfig,
  FluidProfile,
  FluidState,
  OverlayType,
  DistortionType,
  FluidDistortionPassOptions,
  FluidParticleProps,
  FluidRevealMaskProps,
}

// ============================================================================
//  EXPORT AGGRÉGÉ PAR DÉFAUT
// ============================================================================
/**
 * Objet par défaut facilitant l'accès aux fonctionnalités enrichies du
 * système de fluides. Il fournit des références aux classes principales,
 * aux profils étendus, aux types de superpositions et de distorsions,
 * ainsi qu'à un utilitaire de création de configuration.
 */
const FluidEffectsEnhanced = {
  Simulation: EtherFluidSimulation,
  instance: etherFluid,
  defaultConfig: DEFAULT_FLUID_CONFIG,
  profiles: FLUID_PROFILES_EXTENDED,
  overlays: OVERLAY_TYPES_EXTENDED,
  distortions: DISTORTION_TYPES_EXTENDED,
  createConfig: createFluidConfig,
}

export default FluidEffectsEnhanced