/**
 * FluidRevealMask.ts
 *
 * Effet de masque de révélation utilisant la densité du fluide.
 * Le fichier garde l'extension .ts pour préserver les imports existants;
 * le composant utilise React.createElement/null au lieu de JSX.
 */

import { useEffect, useMemo } from 'react'
import type { FC } from 'react'
import * as THREE from 'three'

export interface FluidRevealMaskProps {
  /** Texture de la couche supérieure (à masquer) */
  topTexture: THREE.Texture | null
  /** Texture de la couche inférieure (à révéler) */
  bottomTexture: THREE.Texture | null
  /** Texture de densité du fluide */
  densityTexture: THREE.Texture | null
  /** Intensité de la révélation (0-1) */
  revealIntensity?: number
  /** Facteur de lissage du masque */
  smoothness?: number
  /** Seuil de révélation */
  threshold?: number
}

export const revealMaskShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tTop: { value: null as THREE.Texture | null },
    tBottom: { value: null as THREE.Texture | null },
    tDensity: { value: null as THREE.Texture | null },
    revealIntensity: { value: 0.5 },
    smoothness: { value: 0.2 },
    threshold: { value: 0.1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tTop;
    uniform sampler2D tBottom;
    uniform sampler2D tDensity;
    uniform float revealIntensity;
    uniform float smoothness;
    uniform float threshold;
    varying vec2 vUv;

    void main() {
      vec4 topColor = texture2D(tTop, vUv);
      vec4 bottomColor = texture2D(tBottom, vUv);
      float density = texture2D(tDensity, vUv).b;
      float mask = smoothstep(threshold, threshold + smoothness, density) * revealIntensity;
      vec4 finalColor = mix(topColor, bottomColor, mask);
      gl_FragColor = finalColor;
    }
  `,
}

export function createFluidRevealMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'EtherWorldFluidRevealMaskMaterial',
    uniforms: THREE.UniformsUtils.clone(revealMaskShader.uniforms),
    vertexShader: revealMaskShader.vertexShader,
    fragmentShader: revealMaskShader.fragmentShader,
    transparent: true,
  })
}

/**
 * Composant de compatibilité pour les scènes R3F qui importent FluidRevealMask.
 * Il prépare le matériau et synchronise les uniforms; l'attachement à une scène
 * peut être fait par les intégrations plus spécialisées via createFluidRevealMaterial().
 */
export const FluidRevealMask: FC<FluidRevealMaskProps> = ({
  topTexture,
  bottomTexture,
  densityTexture,
  revealIntensity = 0.5,
  smoothness = 0.2,
  threshold = 0.1,
}) => {
  const material = useMemo(() => createFluidRevealMaterial(), [])

  useEffect(() => {
    material.uniforms.tTop.value = topTexture
    material.uniforms.tBottom.value = bottomTexture
    material.uniforms.tDensity.value = densityTexture
    material.uniforms.revealIntensity.value = revealIntensity
    material.uniforms.smoothness.value = smoothness
    material.uniforms.threshold.value = threshold
  }, [bottomTexture, densityTexture, material, revealIntensity, smoothness, threshold, topTexture])

  useEffect(() => () => material.dispose(), [material])

  return null
}

export default FluidRevealMask
