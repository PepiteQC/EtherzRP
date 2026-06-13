/**
 * FluidDistortionPass.ts
 * 
 * Pass de distorsion de fluide compatible avec EffectComposer de three.js.
 * Permet d'appliquer différentes distorsions UV basées sur le champ de
 * vitesse de la simulation de fluides.
 * 
 * @author PepiteQC / EtherWorld Team
 * @date 2026-06-11
 */

import { Pass, FullScreenQuad } from 'three-stdlib'
import * as THREE from 'three'

export interface FluidDistortionPassOptions {
  /** Type de distorsion */
  type?: 'simple' | 'chromatic' | 'rgbShift' | 'water' | 'waterCaustics'
  /** Intensité de la distorsion (0-2) */
  intensity?: number
  /** Rayon de distorsion UV */
  radius?: number
  /** Facteur de mélange */
  blendFactor?: number
  /** Décalage chromatique (pour chromatic uniquement) */
  chromaticOffset?: number
  /** Vitesse de l'animation (pour water/waterCaustics) */
  animationSpeed?: number
  /** Fréquence des vagues (pour water/waterCaustics) */
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

/**
 * Shader pour la distorsion UV simple
 */
const simpleDistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    tVelocity: { value: null },
    tDensity: { value: null },
    intensity: { value: 1.0 },
    radius: { value: 0.02 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tVelocity;
    uniform sampler2D tDensity;
    uniform float intensity;
    uniform float radius;
    varying vec2 vUv;

    void main() {
      vec2 velocity = texture2D(tVelocity, vUv).xy;
      float density = texture2D(tDensity, vUv).b;
      
      vec2 distortion = velocity * radius * intensity;
      vec2 distortedUv = vUv + distortion;
      
      vec4 color = texture2D(tDiffuse, distortedUv);
      color.rgb += density * intensity * 0.1;
      
      gl_FragColor = color;
    }
  `,
}

/**
 * Shader pour la distorsion chromatique
 */
const chromaticDistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    tVelocity: { value: null },
    tDensity: { value: null },
    intensity: { value: 1.0 },
    radius: { value: 0.02 },
    chromaticOffset: { value: 0.003 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tVelocity;
    uniform sampler2D tDensity;
    uniform float intensity;
    uniform float radius;
    uniform float chromaticOffset;
    varying vec2 vUv;

    void main() {
      vec2 velocity = texture2D(tVelocity, vUv).xy;
      float speed = length(velocity) * intensity;
      
      vec2 offsetR = velocity * radius * (1.0 + chromaticOffset * 100.0 * speed);
      vec2 offsetG = velocity * radius;
      vec2 offsetB = velocity * radius * (1.0 - chromaticOffset * 100.0 * speed);
      
      float r = texture2D(tDiffuse, vUv + offsetR).r;
      float g = texture2D(tDiffuse, vUv + offsetG).g;
      float b = texture2D(tDiffuse, vUv + offsetB).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
}

/**
 * Shader pour le décalage RGB
 */
const rgbShiftDistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    tVelocity: { value: null },
    tDensity: { value: null },
    intensity: { value: 1.0 },
    radius: { value: 0.02 },
    chromaticOffset: { value: 0.003 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tVelocity;
    uniform sampler2D tDensity;
    uniform float intensity;
    uniform float radius;
    uniform float chromaticOffset;
    varying vec2 vUv;

    void main() {
      vec2 velocity = texture2D(tVelocity, vUv).xy;
      float density = texture2D(tDensity, vUv).b;
      
      vec2 dir = normalize(velocity + vec2(0.0001));
      float amount = chromaticOffset * intensity * (1.0 + density * 2.0);
      
      float r = texture2D(tDiffuse, vUv + dir * amount).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - dir * amount).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
}

/**
 * Shader pour la distorsion d'eau
 */
const waterDistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    tVelocity: { value: null },
    tDensity: { value: null },
    intensity: { value: 1.0 },
    radius: { value: 0.02 },
    time: { value: 0.0 },
    animationSpeed: { value: 0.5 },
    waveFrequency: { value: 2.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tVelocity;
    uniform sampler2D tDensity;
    uniform float intensity;
    uniform float radius;
    uniform float time;
    uniform float animationSpeed;
    uniform float waveFrequency;
    varying vec2 vUv;

    void main() {
      vec2 velocity = texture2D(tVelocity, vUv).xy;
      float density = texture2D(tDensity, vUv).b;
      float t = time * animationSpeed;
      
      vec2 wave = vec2(
        sin(vUv.y * waveFrequency * 10.0 + t) * 0.5,
        cos(vUv.x * waveFrequency * 10.0 + t * 0.8) * 0.5
      );
      
      vec2 distortion = (velocity + wave * density) * radius * intensity;
      vec4 color = texture2D(tDiffuse, vUv + distortion);
      
      gl_FragColor = color;
    }
  `,
}

/**
 * Shader pour les caustiques d'eau
 */
const waterCausticsDistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    tVelocity: { value: null },
    tDensity: { value: null },
    intensity: { value: 1.0 },
    radius: { value: 0.02 },
    time: { value: 0.0 },
    animationSpeed: { value: 0.5 },
    waveFrequency: { value: 2.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tVelocity;
    uniform sampler2D tDensity;
    uniform float intensity;
    uniform float radius;
    uniform float time;
    uniform float animationSpeed;
    uniform float waveFrequency;
    varying vec2 vUv;

    float caustic(vec2 uv, float t) {
      vec2 p = mod(uv * 6.28318 * waveFrequency, 6.28318) - 250.0;
      vec2 i = vec2(p);
      float c = 1.0;
      float inten = 0.005;
      for (int n = 0; n < 4; n++) {
        float tt = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
      }
      c /= 4.0;
      c = 1.17 - pow(c, 1.4);
      return pow(abs(c), 8.0);
    }

    void main() {
      vec2 velocity = texture2D(tVelocity, vUv).xy;
      float density = texture2D(tDensity, vUv).b;
      float t = time * animationSpeed;
      
      vec2 distortion = velocity * radius * intensity;
      vec4 color = texture2D(tDiffuse, vUv + distortion);
      
      float c = caustic(vUv + distortion, t);
      color.rgb += vec3(c) * density * intensity * 0.5;
      
      gl_FragColor = color;
    }
  `,
}

const SHADERS: Record<string, typeof simpleDistortionShader> = {
  simple: simpleDistortionShader,
  chromatic: chromaticDistortionShader,
  rgbShift: rgbShiftDistortionShader,
  water: waterDistortionShader,
  waterCaustics: waterCausticsDistortionShader,
}

/**
 * FluidDistortionPass — Pass EffectComposer appliquant la distorsion fluide
 */
export class FluidDistortionPass extends Pass {
  private fsQuad: FullScreenQuad
  private material: THREE.ShaderMaterial
  private options: Required<FluidDistortionPassOptions>
  private clock = new THREE.Clock()

  constructor(options: FluidDistortionPassOptions = {}) {
    super()
    this.options = { ...DEFAULT_OPTIONS, ...options }

    const shader = SHADERS[this.options.type] ?? simpleDistortionShader
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(shader.uniforms),
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    })

    this.applyOptions()
    this.fsQuad = new FullScreenQuad(this.material)
  }

  private applyOptions() {
    const u = this.material.uniforms
    if (u.intensity) u.intensity.value = this.options.intensity
    if (u.radius) u.radius.value = this.options.radius
    if (u.chromaticOffset) u.chromaticOffset.value = this.options.chromaticOffset
    if (u.animationSpeed) u.animationSpeed.value = this.options.animationSpeed
    if (u.waveFrequency) u.waveFrequency.value = this.options.waveFrequency
  }

  /** Met à jour les textures de la simulation de fluides */
  setFluidTextures(velocity: THREE.Texture | null, density: THREE.Texture | null) {
    this.material.uniforms.tVelocity.value = velocity
    this.material.uniforms.tDensity.value = density
  }

  /** Change l'intensité dynamiquement */
  setIntensity(value: number) {
    this.options.intensity = value
    if (this.material.uniforms.intensity) this.material.uniforms.intensity.value = value
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
    this.material.uniforms.tDiffuse.value = readBuffer.texture
    if (this.material.uniforms.time) {
      this.material.uniforms.time.value = this.clock.getElapsedTime()
    }

    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
      this.fsQuad.render(renderer)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
      this.fsQuad.render(renderer)
    }
  }

  dispose() {
    this.material.dispose()
    this.fsQuad.dispose()
  }
}