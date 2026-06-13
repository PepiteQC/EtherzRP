/**
 * LightingSystem.tsx
 * Éclairage intérieur (plafonniers avec scintillement)
 * + éclairage global du dépanneur
 */

import { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────
// CEILING LIGHT (individuel)
// ─────────────────────────────────────────────

const CeilingLight = memo(function CeilingLight({ x, z = 0 }: { x: number; z?: number }) {
  const flickerRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (flickerRef.current && Math.abs(x) > 2) {
      flickerRef.current.intensity =
        1.4 + Math.sin(state.clock.elapsedTime * 8 + x * 3) * 0.08
    }
  })

  return (
    <group position={[x, 5.6, z]}>
      {/* Housing */}
      <mesh>
        <boxGeometry args={[0.9, 0.1, 0.35]} />
        <meshStandardMaterial color="#dddddd" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Light panel */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.8, 0.03, 0.3]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={0.9} />
      </mesh>

      {/* Diffuser grid */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[-0.25 + i * 0.25, -0.055, 0]}>
          <boxGeometry args={[0.01, 0.005, 0.28]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      ))}

      <pointLight
        ref={flickerRef}
        position={[0, -0.2, 0]}
        color="#fff8e0"
        intensity={1.5}
        distance={8}
        decay={2}
        castShadow
        shadow-mapSize={[512, 512]}
      />
    </group>
  )
})

// ─────────────────────────────────────────────
// LIGHTING GRID
// ─────────────────────────────────────────────

const LIGHT_GRID_X = [-5, -2, 1, 4] as const
const LIGHT_GRID_Z = [-4, 0, 4] as const

// ─────────────────────────────────────────────
// SYSTEM EXPORT
// ─────────────────────────────────────────────

export const LightingSystem = memo(function LightingSystem() {
  return (
    <>
      {/* Grille de plafonniers */}
      {LIGHT_GRID_X.map(x =>
        LIGHT_GRID_Z.map(z => (
          <CeilingLight key={`light-${x}-${z}`} x={x} z={z} />
        ))
      )}

      {/* Ambient global */}
      <ambientLight intensity={0.15} color="#ffffff" />

      {/* Entrance spotlight */}
      <spotLight
        position={[0, 5, 8]}
        angle={Math.PI / 5}
        penumbra={0.7}
        intensity={2}
        color="#fff8e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
    </>
  )
})