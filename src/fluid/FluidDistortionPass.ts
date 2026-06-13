/**
 * FluidDistortionPass.ts
 *
 * Pass de distorsion compatible avec EffectComposer.
 * Cette version garde l'API publique existante et reconnecte le module FluidEffects.
 */

import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

export interface FluidDistortionPassOptions {
  type?: 'simple' | 'chromatic' | 'rgbShift' | 'water' | 'waterCaustics'
  intensity?: number
  radius?: number
  blendFactor?: number
  chromaticOffset?: number
  animationSpeed?: number
  waveFrequency?: number
}

const DEFAULT_OPTIONS: Required<FluidDistortionPassOptions> = {
  type: 'simple',
  intensity: 1.0,
  radius: 0.02,
  blendFactor: 0.5,
  chromaticOffset: 0.003,
  animationSpeed: 0.5,
  waveFrequency: 2.0,
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D tVelocity;
  uniform sampler2D tDensity;
  uniform float intensity;
  uniform float radius;
  uniform float blendFactor;
  uniform float chromaticOffset;
  uniform float time;
  uniform float waveFrequency;
  uniform int distortionMode;
  varying vec2 vUv;

  void main() {
    vec2 velocity = texture2D(tVelocity, vUv).xy * 2.0 - 1.0;
    float density = texture2D(tDensity, vUv).b;

    vec2 wave = vec2(
      sin((vUv.y + time) * waveFrequency * 6.28318),
      cos((vUv.x + time) * waveFrequency * 6.28318)
    ) * 0.25;

    vec2 distortion = velocity * radius * intensity;

    if (distortionMode >= 3) {
      distortion += wave * radius * intensity;
    }

    vec2 uv = vUv + distortion;

    vec4 original = texture2D(tDiffuse, vUv);
    vec4 distorted = texture2D(tDiffuse, uv);

    if (distortionMode == 1 || distortionMode == 2) {
      vec2 chroma = normalize(velocity + vec2(0.0001)) * chromaticOffset * intensity;
      distorted.r = texture2D(tDiffuse, uv + chroma).r;
      distorted.b = texture2D(tDiffuse, uv - chroma).b;
    }

    if (distortionMode == 4) {
      distorted.rgb += density * vec3(0.08, 0.16, 0.22) * intensity;
    } else {
      distorted.rgb += density * 0.08 * intensity;
    }

    gl_FragColor = mix(original, distorted, blendFactor);
  }
`

function modeFromType(type: Required<FluidDistortionPassOptions>['type']): number {
  switch (type) {
    case 'chromatic':
      return 1
    case 'rgbShift':
      return 2
    case 'water':
      return 3
    case 'waterCaustics':
      return 4
    case 'simple':
    default:
      return 0
  }
}

/**
 * Pass de post-processing pour appliquer une distorsion basée sur les textures
 * velocity/density d'une simulation fluide.
 */
export class FluidDistortionPass extends Pass {
  readonly material: THREE.ShaderMaterial
  readonly fsQuad: FullScreenQuad
  options: Required<FluidDistortionPassOptions>

  constructor(
    velocityTexture: THREE.Texture | null = null,
    densityTexture: THREE.Texture | null = null,
    options: FluidDistortionPassOptions = {},
  ) {
    super()

    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.material = new THREE.ShaderMaterial({
      name: 'EtherWorldFluidDistortionPass',
      uniforms: {
        tDiffuse: { value: null },
        tVelocity: { value: velocityTexture },
        tDensity: { value: densityTexture },
        intensity: { value: this.options.intensity },
        radius: { value: this.options.radius },
        blendFactor: { value: this.options.blendFactor },
        chromaticOffset: { value: this.options.chromaticOffset },
        time: { value: 0 },
        waveFrequency: { value: this.options.waveFrequency },
        distortionMode: { value: modeFromType(this.options.type) },
      },
      vertexShader,
      fragmentShader,
    })

    this.fsQuad = new FullScreenQuad(this.material)
  }

  setVelocityTexture(texture: THREE.Texture | null): void {
    this.material.uniforms.tVelocity.value = texture
  }

  setDensityTexture(texture: THREE.Texture | null): void {
    this.material.uniforms.tDensity.value = texture
  }

  setOptions(options: FluidDistortionPassOptions): void {
    this.options = { ...this.options, ...options }
    this.material.uniforms.intensity.value = this.options.intensity
    this.material.uniforms.radius.value = this.options.radius
    this.material.uniforms.blendFactor.value = this.options.blendFactor
    this.material.uniforms.chromaticOffset.value = this.options.chromaticOffset
    this.material.uniforms.waveFrequency.value = this.options.waveFrequency
    this.material.uniforms.distortionMode.value = modeFromType(this.options.type)
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
  ): void {
    this.material.uniforms.tDiffuse.value = readBuffer.texture
    this.material.uniforms.time.value += 0.016 * this.options.animationSpeed

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
      this.fsQuad.render(renderer)
      return
    }

    renderer.setRenderTarget(writeBuffer)
    if (this.clear) renderer.clear()
    this.fsQuad.render(renderer)
  }

  dispose(): void {
    this.material.dispose()
    this.fsQuad.dispose()
  }
}

export default FluidDistortionPass
