/**
 * CartoonStage.tsx — Décor lumineux "low-poly cartoon" clé-en-main
 * ------------------------------------------------------------------
 * Pose en une ligne : ciel dégradé, soleil cartoon, lumière de rebond,
 * brouillard doux et ombres douces — tout cohérent avec cartoonTokens.
 *
 * Dépendances : @react-three/fiber, @react-three/drei, three (déjà là)
 * À copier dans : src/lib/three/CartoonStage.tsx
 *
 * Usage :
 *   <Canvas shadows camera={{ position: [8, 6, 12], fov: 50 }}>
 *     <CartoonStage night={false}>
 *       <MaScene />
 *     </CartoonStage>
 *     <CartoonPostFX />
 *     <AdaptiveDpr pixelated />
 *   </Canvas>
 */

import { type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Sky, SoftShadows, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { HEX, PALETTE, RENDER } from './cartoonTokens'

interface CartoonStageProps {
  children: ReactNode
  /** Mode nuit (ciel sombre, soleil bleuté). */
  night?: boolean
  /** Active les ombres douces (coûteux ; off sur machines faibles). */
  softShadows?: boolean
  /** Active le ciel procédural drei (sinon fond uni). */
  sky?: boolean
}

export default function CartoonStage({
  children,
  night = false,
  softShadows = true,
  sky = true,
}: CartoonStageProps) {
  const { gl, scene } = useThree()

  // Configure le renderer + fog au montage
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = RENDER.toneMappingExposure
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap

    scene.background = new THREE.Color(night ? PALETTE.skyNight : PALETTE.skyBottom)
    scene.fog = new THREE.Fog(
      night ? PALETTE.skyNight : RENDER.fog.color,
      RENDER.fog.near,
      RENDER.fog.far,
    )
    return () => { scene.fog = null }
  }, [gl, scene, night])

  const sunPos = RENDER.sun.position
  const sunColor = night ? 0x9fb8ff : RENDER.sun.color
  const sunIntensity = night ? 0.5 : RENDER.sun.intensity

  return (
    <>
      {/* Ombres douces low-poly (drei) */}
      {softShadows && <SoftShadows size={28} samples={12} focus={0.85} />}

      {/* Ciel cartoon */}
      {sky && !night && (
        <Sky distance={450000} sunPosition={sunPos} turbidity={2} rayleigh={0.5} mieCoefficient={0.004} />
      )}

      {/* Lumière d'ambiance (jamais d'ombre 100 % noire) */}
      <ambientLight color={HEX.skyBottom} intensity={RENDER.ambient.intensity} />

      {/* Rebond ciel/sol — donne le volume cartoon */}
      <hemisphereLight
        color={night ? HEX.skyNight : RENDER.fill.skyColor}
        groundColor={RENDER.fill.groundColor}
        intensity={RENDER.fill.intensity}
      />

      {/* Soleil directionnel avec ombre douce */}
      <directionalLight
        color={sunColor}
        intensity={sunIntensity}
        position={sunPos}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0004}
      />

      {/* Optimisation runtime */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {children}
    </>
  )
}
