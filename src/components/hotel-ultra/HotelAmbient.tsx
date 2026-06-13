/**
 * HotelAmbient.tsx
 * Ambiance de l'hôtel — éclairage dynamique, particules, effets
 */

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────
// DUST PARTICLES (lobby)
// ─────────────────────────────────────────────

const DustParticles = memo(function DustParticles() {
  const count = 60
  const meshRef = useRef<THREE.Points>(null)

  const { positions, velocities } = useMemo(() => {
    const positions  = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 16
      positions[i * 3 + 1] = Math.random() * 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 18
      velocities[i * 3]     = (Math.random() - 0.5) * 0.005
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.003
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005
    }
    return { positions, velocities }
  }, [])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [positions])

  useFrame(() => {
    if (!meshRef.current) return
    const pos = (meshRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array

    for (let i = 0; i < count; i++) {
      pos[i * 3]     += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]

      // Rebond bounds
      if (Math.abs(pos[i * 3]) > 8)     velocities[i * 3]     *= -1
      if (pos[i * 3 + 1] > 5 || pos[i * 3 + 1] < 0) velocities[i * 3 + 1] *= -1
      if (Math.abs(pos[i * 3 + 2]) > 9) velocities[i * 3 + 2] *= -1
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef} geometry={geo}>
      <pointsMaterial color="#fff8e0" size={0.04} transparent opacity={0.3} sizeAttenuation />
    </points>
  )
})

// ─────────────────────────────────────────────
// DYNAMIC LIGHTING
// ─────────────────────────────────────────────

interface DynamicLightingProps {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  floor:     number
}

const DynamicLighting = memo(function DynamicLighting({
  timeOfDay, floor,
}: DynamicLightingProps) {
  const sunRef = useRef<THREE.DirectionalLight>(null)

  const { sunColor, sunIntensity, ambientColor, ambientIntensity } = useMemo(() => {
    switch (timeOfDay) {
      case 'morning':   return { sunColor: '#ffd8a0', sunIntensity: 1.5, ambientColor: '#b8c8e8', ambientIntensity: 0.5 }
      case 'afternoon': return { sunColor: '#fff8e0', sunIntensity: 2.0, ambientColor: '#d0e0f0', ambientIntensity: 0.6 }
      case 'evening':   return { sunColor: '#ff8844', sunIntensity: 1.0, ambientColor: '#604030', ambientIntensity: 0.3 }
      case 'night':     return { sunColor: '#2244aa', sunIntensity: 0.1, ambientColor: '#101828', ambientIntensity: 0.15 }
    }
  }, [timeOfDay])

  useFrame((state) => {
    if (sunRef.current) {
      const t = state.clock.elapsedTime * 0.05
      sunRef.current.position.set(
        Math.cos(t) * 50,
        Math.abs(Math.sin(t)) * 40 + 10,
        -30,
      )
    }
  })

  return (
    <>
      <directionalLight
        ref={sunRef}
        color={sunColor}
        intensity={sunIntensity}
        castShadow={floor <= 1}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={300}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0003}
      />
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
      <hemisphereLight
        args={[
          timeOfDay === 'night' ? '#101828' : '#87ceeb',
          '#2a1a0a',
          timeOfDay === 'night' ? 0.1 : 0.3,
        ]}
      />
    </>
  )
})

// ─────────────────────────────────────────────
// WINDOW GLOW (depuis les fenêtres)
// ─────────────────────────────────────────────

const WindowGlow = memo(function WindowGlow({
  timeOfDay,
}: {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
}) {
  const color = timeOfDay === 'night' ? '#aaddff'
    : timeOfDay === 'evening' ? '#ff8844'
    : '#fff8d0'

  const intensity = timeOfDay === 'night' ? 0.3
    : timeOfDay === 'evening' ? 0.8
    : 1.5

  return (
    <>
      {/* Lumière depuis les grandes baies du lobby */}
      <pointLight position={[-9, 2.5, 0]} intensity={intensity} color={color} distance={8} decay={2} />
      <pointLight position={[9, 2.5, 0]} intensity={intensity} color={color} distance={8} decay={2} />
      {timeOfDay === 'evening' && (
        <pointLight position={[0, 3, 8]} intensity={0.5} color="#ff6622" distance={5} decay={2} />
      )}
    </>
  )
})

// ─────────────────────────────────────────────
// HOTEL AMBIENT ROOT
// ─────────────────────────────────────────────

interface HotelAmbientProps {
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  floor?:     number
  showDust?:  boolean
}

export const HotelAmbient = memo(function HotelAmbient({
  timeOfDay = 'afternoon',
  floor = 1,
  showDust = true,
}: HotelAmbientProps) {
  return (
    <>
      <DynamicLighting timeOfDay={timeOfDay} floor={floor} />
      <WindowGlow timeOfDay={timeOfDay} />
      {showDust && floor === 1 && <DustParticles />}

      {/* Fog adaptatif */}
      {floor >= 5 ? (
        // Étages supérieurs — brume légère vue de haut
        <fog attach="fog" args={['#c8d8e8', 20, 120]} />
      ) : floor <= 0 ? (
        // Sous-sol / parking — brume dense
        <fog attach="fog" args={['#1a1a1a', 5, 40]} />
      ) : (
        // Étages intermédiaires
        <fog attach="fog" args={['#f0ece4', 15, 80]} />
      )}
    </>
  )
})