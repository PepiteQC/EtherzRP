/**
 * FluidFullscreenEffect.tsx
 *
 * Shim React Three Fiber: composant <Effect> plein écran.
 * (Les fichiers fluid importaient `Effect` depuis three-stdlib /
 * three/examples, qui n'exportent pas de composant React — ce shim
 * fournit l'équivalent: un quad plein écran avec ShaderMaterial,
 * rendu par-dessus la scène.)
 *
 * @author PepiteQC / EtherWorld Team (reconstruit)
 */

import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'

export interface EffectProps {
  fragmentShader: string
  vertexShader?: string
  uniforms: Record<string, THREE.IUniform>
  /** Ordre de rendu (par défaut très élevé = par-dessus tout) */
  renderOrder?: number
  transparent?: boolean
}

const DEFAULT_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

/**
 * Quad plein écran avec shader custom — équivalent d'un pass de
 * post-processing léger, utilisable directement dans <Canvas>.
 */
export const Effect = forwardRef<THREE.Mesh, EffectProps>(function Effect(
  { fragmentShader, vertexShader = DEFAULT_VERTEX, uniforms, renderOrder = 9999, transparent = true },
  ref
) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        fragmentShader,
        vertexShader,
        uniforms,
        transparent,
        depthTest: false,
        depthWrite: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fragmentShader, vertexShader]
  )

  return (
    <mesh ref={ref} renderOrder={renderOrder} frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
})

export default Effect
