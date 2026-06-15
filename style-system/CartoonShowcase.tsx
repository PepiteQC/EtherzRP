/**
 * CartoonShowcase.tsx — Scène VITRINE du design system low-poly cartoon.
 * Montre lumière, matériaux, ombres douces et Bloom ensemble.
 * Monte-la en plein écran pour démontrer le style.
 *
 *   import CartoonShowcase from '@/lib/three/cartoon/CartoonShowcase'
 *   <CartoonShowcase />
 */

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import { useMemo } from 'react'
import CartoonStage from './CartoonStage'
import CartoonPostFX from './CartoonPostFX'
import { cartoonMat, glowMat } from './cartoonMaterials'

function Village() {
  // Petite rangée de maisons low-poly + arbres
  const houses = useMemo(
    () => [-6, -3, 0, 3, 6].map((x, i) => ({ x, h: 1.6 + (i % 3) * 0.5, c: i % 2 ? 'brick' : 'wall' as const })),
    [],
  )
  return (
    <group>
      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={cartoonMat('grass')}>
        <planeGeometry args={[60, 60]} />
      </mesh>
      {/* Route */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 3.5]} receiveShadow material={cartoonMat('road')}>
        <planeGeometry args={[60, 3]} />
      </mesh>

      {/* Maisons */}
      {houses.map((hs, i) => (
        <group key={i} position={[hs.x, 0, 0]}>
          <mesh position={[0, hs.h / 2, 0]} castShadow receiveShadow material={cartoonMat(hs.c as 'brick')}>
            <boxGeometry args={[2, hs.h, 2]} />
          </mesh>
          {/* Toit (cône = low-poly pyramide) */}
          <mesh position={[0, hs.h + 0.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow material={cartoonMat('roof')}>
            <coneGeometry args={[1.7, 1.2, 4]} />
          </mesh>
          {/* Fenêtre qui brille (Bloom) */}
          <mesh position={[0, hs.h / 2, 1.01]} material={glowMat('secondary', 1.2)}>
            <planeGeometry args={[0.5, 0.5]} />
          </mesh>
        </group>
      ))}

      {/* Arbres low-poly */}
      {[-8, -1, 5, 8].map((x, i) => (
        <group key={i} position={[x, 0, -4]}>
          <mesh position={[0, 0.6, 0]} castShadow material={cartoonMat('wood')}>
            <cylinderGeometry args={[0.18, 0.25, 1.2, 6]} />
          </mesh>
          <mesh position={[0, 1.7, 0]} castShadow material={cartoonMat('green')}>
            <icosahedronGeometry args={[0.9, 0]} />
          </mesh>
        </group>
      ))}

      {/* Élément signature flottant : un "soleil/orbe" orange qui brille */}
      <Float speed={2} rotationIntensity={0.4} floatIntensity={1.2}>
        <mesh position={[0, 4, -2]} material={glowMat('primary', 1.6)}>
          <icosahedronGeometry args={[0.8, 0]} />
        </mesh>
      </Float>
    </group>
  )
}

export default function CartoonShowcase() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [10, 7, 14], fov: 48 }}>
        <CartoonStage night={false} softShadows sky>
          <Village />
        </CartoonStage>
        <CartoonPostFX quality="auto" bloomStrength={0.7} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} minDistance={8} maxDistance={28} />
      </Canvas>
    </div>
  )
}
