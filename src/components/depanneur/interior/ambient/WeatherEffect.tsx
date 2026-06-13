/**
 * WeatherEffect.tsx
 * Effets météo visibles depuis les fenêtres
 * Pluie, neige, soleil
 */

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { WeatherOutside } from '../types'

// ─────────────────────────────────────────────
// RAIN DROPS
// ─────────────────────────────────────────────

const RainEffect = memo(function RainEffect() {
  const count = 80
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const positions = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 20,
      y: Math.random() * 8,
      z: 8 + Math.random() * 5,   // Devant les fenêtres (extérieur)
      speed: 3 + Math.random() * 2,
    }))
  }, [])

  useFrame((_, dt) => {
    if (!meshRef.current) return
    positions.forEach((p, i) => {
      p.y -= p.speed * dt
      if (p.y < -1) {
        p.y = 8
        p.x = (Math.random() - 0.5) * 20
      }
      dummy.position.set(p.x, p.y, p.z)
      dummy.scale.set(0.02, 0.18, 0.02)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#88aacc"
        transparent
        opacity={0.4}
      />
    </instancedMesh>
  )
})

// ─────────────────────────────────────────────
// SNOW FLAKES
// ─────────────────────────────────────────────

const SnowEffect = memo(function SnowEffect() {
  const count = 60
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const flakes = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 20,
    y: Math.random() * 8,
    z: 8 + Math.random() * 5,
    speed:  0.5 + Math.random() * 0.5,
    drift:  (Math.random() - 0.5) * 0.3,
    rot:    Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 2,
  })), [])

  useFrame((_, dt) => {
    if (!meshRef.current) return
    flakes.forEach((f, i) => {
      f.y -= f.speed * dt
      f.x += f.drift * dt
      f.rot += f.rotSpeed * dt
      if (f.y < -1) {
        f.y = 8
        f.x = (Math.random() - 0.5) * 20
      }
      dummy.position.set(f.x, f.y, f.z)
      dummy.rotation.set(0, 0, f.rot)
      dummy.scale.setScalar(0.08)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 0.1]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
    </instancedMesh>
  )
})

// ─────────────────────────────────────────────
// WEATHER EFFECT ROOT
// ─────────────────────────────────────────────

interface WeatherEffectProps {
  weather: WeatherOutside
}

export const WeatherEffect = memo(function WeatherEffect({ weather }: WeatherEffectProps) {
  if (weather === 'raining') return <RainEffect />
  if (weather === 'snowing') return <SnowEffect />

  // Lumière soleil depuis fenêtres
  if (weather === 'sunny') {
    return (
      <>
        <pointLight
          position={[-5.5, 2.5, 7]}
          intensity={1.2}
          color="#fff8d0"
          distance={6}
          decay={2}
        />
        <pointLight
          position={[5.5, 2.5, 7]}
          intensity={1.2}
          color="#fff8d0"
          distance={6}
          decay={2}
        />
      </>
    )
  }

  // Cloudy / foggy — lumière diffuse
  return (
    <pointLight
      position={[0, 3, 7]}
      intensity={0.4}
      color="#b0c8e8"
      distance={8}
      decay={2}
    />
  )
})