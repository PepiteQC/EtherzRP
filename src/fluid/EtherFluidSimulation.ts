/**
 * FluidSimulation.ts
 * 
 * Encapsulation de three-fluid-fx pour EtherWorld QC RP.
 * Gère le cycle de vie, le redimensionnement, et les paramètres
 * de simulation de fluides pour les effets visuels.
 * 
 * @author PepiteQC / EtherWorld Team
 * @date 2026-06-11
 */

import { WebGLRenderer, Texture } from 'three'
import type { FluidSimulationOptions } from 'three-fluid-fx'

export type FluidProfile = 'performance' | 'balanced' | 'quality'

export interface FluidConfig extends Omit<FluidSimulationOptions, 'profile'> {
  /**
   * Profil de qualité : 'performance' | 'balanced' | 'quality'
   */
  profile: FluidProfile
  /**
   * Activation de la simulation (peut être désactivée pour économiser GPU)
   */
  enabled: boolean
  /**
   * Couche de distorsion UV appliquée sur la scène
   */
  enableDistortion: boolean
  /**
   * Intensité de la distorsion UV (0 = aucune, 2 = maximum)
   */
  distortionIntensity: number
  /**
   * Couche overlay pour les effets de couleur/traînée
   */
  enableOverlay: boolean
  /**
   * Type d'overlay à utiliser
   */
  overlayType: OverlayType
  /**
   * Opacité de l'overlay (0 = transparent, 1 = opaque)
   */
  overlayOpacity: number
}

export type OverlayType =
  | 'default'
  | 'artInk'
  | 'oil'
  | 'rainbowFish'
  | 'velocity'
  | 'glaze'
  | 'smoke'
  | 'colorWater'
  | 'liquidLens'
  | 'densityTint'

export type DistortionType =
  | 'simple'
  | 'chromatic'
  | 'rgbShift'
  | 'water'
  | 'waterCaustics'

export interface FluidState {
  /** Textures de sortie pour lecture directe */
  velocityTexture: Texture | null
  densityTexture: Texture | null
  dyeTexture: Texture | null
  /** Indique si la simulation est active */
  isInitialized: boolean
  /** Résolution actuelle du FBO */
  resolution: { width: number; height: number }
  /** Compteurs de performance */
  frameCount: number
  lastStepTime: number
}

/**
 * Configuration par défaut pour EtherWorld QC RP
 * Optimisée pour desktop avec possibilité de dégradation gracieuse
 */
export const DEFAULT_FLUID_CONFIG: FluidConfig = {
  profile: 'balanced',
  enabled: true,
  enableDistortion: true,
  distortionIntensity: 1.0,
  enableOverlay: true,
  overlayType: 'artInk',
  overlayOpacity: 0.7,
  curlStrength: 0.55,
  velocityDissipation: 0.985,
  densityDissipation: 0.91,
  pressureDissipation: 0.8,
  splatRadius: 0.00042,
  splatForce: 6,
  reflectWalls: true,
  enableDye: true,
  bfec: true,
}

/**
 * Mapping des profils vers les paramètres de résolution/itération
 */
export const FLUID_PROFILE_PARAMS: Record<FluidProfile, { pressureIterations: number }> = {
  performance: { pressureIterations: 6 },
  balanced: { pressureIterations: 12 },
  quality: { pressureIterations: 20 },
}

/**
 * Service singleton de simulation de fluides pour EtherWorld QC RP
 */
export class EtherFluidSimulation {
  private _renderer: WebGLRenderer | null = null
  private _fluid: any = null
  private _state: FluidState = {
    velocityTexture: null,
    densityTexture: null,
    dyeTexture: null,
    isInitialized: false,
    resolution: { width: 0, height: 0 },
    frameCount: 0,
    lastStepTime: 0,
  }
  private _config: FluidConfig = { ...DEFAULT_FLUID_CONFIG }
  private _splatQueue: Array<{
    x01: number
    y01: number
    dx: number
    dy: number
    options?: { radius?: number; color?: [number, number, number]; dyeColor?: [number, number, number] }
  }> = []
  private _teardownPointer: (() => void) | null = null
  private _listeners: Array<() => void> = []

  get state(): Readonly<FluidState> {
    return this._state
  }

  get config(): Readonly<FluidConfig> {
    return this._config
  }

  get fluid(): any {
    return this._fluid
  }

  /**
   * Initialiser la simulation avec un renderer Three.js
   */
  async init(renderer: WebGLRenderer, config?: Partial<FluidConfig>): Promise<boolean> {
    try {
      this._config = { ...DEFAULT_FLUID_CONFIG, ...config }
      this._renderer = renderer

      // Import dynamique de three-fluid-fx pour tree-shaking
      const { FluidSimulation, attachPointerSplats } = await import('three-fluid-fx')

      const profileParams = FLUID_PROFILE_PARAMS[this._config.profile]

      this._fluid = new FluidSimulation(renderer, {
        profile: this._config.profile as any,
        curlStrength: this._config.curlStrength,
        velocityDissipation: this._config.velocityDissipation,
        densityDissipation: this._config.densityDissipation,
        pressureDissipation: this._config.pressureDissipation,
        splatRadius: this._config.splatRadius,
        splatForce: this._config.splatForce,
        reflectWalls: this._config.reflectWalls,
        enableDye: this._config.enableDye,
        bfec: this._config.bfec,
        pressureIterations: profileParams.pressureIterations,
      })

      // Appliquer la configuration initiale
      this._applyConfig()

      // Attacher les écouteurs de pointeur
      this._teardownPointer = attachPointerSplats(renderer.domElement, this._fluid, {
        coloredStrokes: this._config.enableDye,
      })

      this._state.isInitialized = true
      this._updateTextures()

      console.log('[EtherFluid] Simulation initialisée avec profil:', this._config.profile)
      return true
    } catch (error) {
      console.error('[EtherFluid] Erreur d\'initialisation:', error)
      return false
    }
  }

  /**
   * Étape de simulation - appeler dans la boucle d'animation
   */
  step(deltaSeconds: number): void {
    if (!this._state.isInitialized || !this._config.enabled) return

    // Vider la queue de splats
    while (this._splatQueue.length > 0) {
      const splat = this._splatQueue.shift()!
      this._fluid.addSplat(splat.x01, splat.y01, splat.dx, splat.dy, splat.options)
    }

    this._fluid.step(deltaSeconds)
    this._state.frameCount++
    this._state.lastStepTime = performance.now()
    this._updateTextures()
  }

  /**
   * Redimensionner la simulation pour correspondre au viewport
   */
  resize(width: number, height: number): void {
    if (!this._fluid) return
    this._fluid.resize(width, height)
    this._state.resolution = { width, height }
  }

  /**
   * Ajouter un éclaboussement (splat) de fluide
   */
  addSplat(
    x01: number,
    y01: number,
    dx: number,
    dy: number,
    options?: {
      radius?: number
      color?: [number, number, number]
      dyeColor?: [number, number, number]
    }
  ): void {
    if (!this._state.isInitialized) return

    this._splatQueue.push({ x01, y01, dx, dy, options })
  }

  /**
   * Ajouter un éclaboussement depuis les coordonnées de la souris
   */
  addSplatFromMouse(
    mouseX: number,
    mouseY: number,
    prevMouseX: number,
    prevMouseY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    if (!this._state.isInitialized) return

    // Convertir en coordonnées UV (0-1)
    const x01 = mouseX / viewportWidth
    const y01 = 1.0 - mouseY / viewportHeight

    // Calculer le vecteur de vélocité normalisé
    const dx = (mouseX - prevMouseX) / viewportWidth * this._config.splatForce
    const dy = -(mouseY - prevMouseY) / viewportHeight * this._config.splatForce

    this.addSplat(x01, y01, dx, dy)
  }

  /**
   * Mettre à jour la configuration en temps réel
   */
  updateConfig(updates: Partial<FluidConfig>): void {
    this._config = { ...this._config, ...updates }
    if (this._state.isInitialized) {
      this._applyConfig()
      this._notifyListeners()
    }
  }

  /**
   * Obtenir les textures de sortie pour utilisation dans des shaders personnalisés
   */
  getTextures(): {
    velocity: Texture | null
    density: Texture | null
    dye: Texture | null
  } {
    return {
      velocity: this._state.velocityTexture,
      density: this._state.densityTexture,
      dye: this._state.dyeTexture,
    }
  }

  /**
   * Nettoyer et libérer les ressources
   */
  dispose(): void {
    if (this._teardownPointer) {
      this._teardownPointer()
      this._teardownPointer = null
    }
    if (this._fluid) {
      this._fluid.dispose?.()
      this._fluid = null
    }
    this._state = {
      velocityTexture: null,
      densityTexture: null,
      dyeTexture: null,
      isInitialized: false,
      resolution: { width: 0, height: 0 },
      frameCount: 0,
      lastStepTime: 0,
    }
    this._listeners = []
  }

  /**
   * S'abonner aux changements de la simulation
   */
  subscribe(listener: () => void): () => void {
    this._listeners.push(listener)
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener)
    }
  }

  /**
   * Obtenir les statistiques de la simulation
   */
  getStats(): {
    fps: number
    frameCount: number
    isInitialized: boolean
    profile: FluidProfile
    config: FluidConfig
  } {
    const now = performance.now()
    const elapsed = now - this._state.lastStepTime
    const fps = elapsed > 0 ? 1000 / Math.max(elapsed, 16.67) : 0

    return {
      fps,
      frameCount: this._state.frameCount,
      isInitialized: this._state.isInitialized,
      profile: this._config.profile,
      config: { ...this._config },
    }
  }

  /**
   * Appliquer la configuration au solveur
   */
  private _applyConfig(): void {
    if (!this._fluid) return

    this._fluid.curlStrength = this._config.curlStrength
    this._fluid.velocityDissipation = this._config.velocityDissipation
    this._fluid.densityDissipation = this._config.densityDissipation
    this._fluid.pressureDissipation = this._config.pressureDissipation
    this._fluid.splatRadius = this._config.splatRadius
    this._fluid.splatForce = this._config.splatForce
    this._fluid.reflectWalls = this._config.reflectWalls
    this._fluid.enableDye = this._config.enableDye
    this._fluid.enableVorticity = this._config.curlStrength > 0
  }

  /**
   * Mettre à jour les références de textures
   */
  private _updateTextures(): void {
    if (!this._fluid) return

    this._state.velocityTexture = this._fluid.velocityTexture
    this._state.densityTexture = this._fluid.densityTexture
    this._state.dyeTexture = this._fluid.dyeTexture
  }

  /**
   * Notifier les abonnés des changements
   */
  private _notifyListeners(): void {
    this._listeners.forEach((listener) => listener())
  }
}

/**
 * Instance singleton pour partage à travers l'application
 */
export const etherFluid = new EtherFluidSimulation()

export default etherFluid
