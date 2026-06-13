import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/game-store-unified'

/**
 * ADMIN EFFECTS - Tous les effets admin unifiés
 * Fusionne 5 versions précédentes + toutes les features
 */

interface AdminEffectProps {
  effect: { id: string; type: string; position: [number, number, number]; duration?: number }
  key?: React.Key
}

// JAIL EFFECT - Cage avec électricité
function JailEffect({ effect }: AdminEffectProps) {
  const cageRef = useRef<THREE.Mesh>(null)
  const barsRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (cageRef.current) {
      cageRef.current.rotation.y += 0.005
    }
  })

  return (
    <group position={effect.position}>
      {/* Main cage */}
      <mesh ref={cageRef}>
        <boxGeometry args={[3, 4, 3]} />
        <meshBasicMaterial color="#ff0044" wireframe transparent opacity={0.4} />
      </mesh>

      {/* Corner bars */}
      <group ref={barsRef}>
        {[
          [-1.4, -1.4],
          [-1.4, 1.4],
          [1.4, -1.4],
          [1.4, 1.4],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0, z]}>
            <boxGeometry args={[0.1, 4, 0.1]} />
            <meshStandardMaterial
              color="#ff3366"
              emissive="#ff3366"
              emissiveIntensity={3}
            />
          </mesh>
        ))}
      </group>

      {/* Lightning effect */}
      <pointLight
        color="#ff3366"
        intensity={5}
        distance={12}
        castShadow
      />
    </group>
  )
}

// FREEZE EFFECT - Glaçon tournoyant
function FreezeEffect({ effect }: AdminEffectProps) {
  const iceRef = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (iceRef.current) {
      iceRef.current.rotation.y += dt * 2
      iceRef.current.rotation.x += dt * 0.5
    }
  })

  return (
    <group position={effect.position}>
      <mesh ref={iceRef}>
        <icosahedronGeometry args={[2, 4]} />
        <meshStandardMaterial
          color="#00ffff"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Ice particles */}
      <pointLight
        color="#00ffff"
        intensity={10}
        distance={15}
        castShadow
      />
    </group>
  )
}

// TP EFFECT - Portail téléportation
function TpEffect({ effect }: AdminEffectProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const count = 1000

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 2
      p[i * 3 + 1] = Math.random() * 8
      p[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    return p
  }, [])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.position.y += 0.08
      if (pointsRef.current.position.y > 3) pointsRef.current.position.y = 0
    }
  })

  return (
    <group position={effect.position}>
      {/* Cylinder vortex */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[1, 1.2, 8, 32, 1, true]} />
        <meshBasicMaterial
          color="#3399ff"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Particle stream */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          transparent
          color="#00ffff"
          size={0.08}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <pointLight
        color="#3399ff"
        intensity={20}
        distance={20}
        castShadow
      />
    </group>
  )
}

// SPOTLIGHT EFFECT - Projecteur scanning
function SpotlightEffect({ effect }: AdminEffectProps) {
  const lightRef = useRef<THREE.SpotLight>(null)

  useFrame(({ clock }) => {
    if (lightRef.current?.target) {
      const angle = clock.elapsedTime * 1.5
      lightRef.current.target.position.x = effect.position[0] + Math.cos(angle) * 5
      lightRef.current.target.position.z = effect.position[2] + Math.sin(angle) * 5
      lightRef.current.target.updateMatrixWorld()
    }
  })

  return (
    <group position={[effect.position[0], 15, effect.position[2]]}>
      <spotLight
        ref={lightRef}
        distance={30}
        angle={0.4}
        penumbra={0.5}
        color="#ffffaa"
        intensity={40}
        castShadow
      />
    </group>
  )
}

// STORM EFFECT - Orage avec éclairs
function StormEffect() {
  const lightRef = useRef<THREE.DirectionalLight>(null)

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.elapsedTime
      const flash = Math.sin(t * 8) > 0.95 && Math.random() > 0.7
      lightRef.current.intensity = flash ? 15 : 0.2
    }
  })

  const rainPositions = useMemo(() => {
    const count = 3000
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 100
      p[i * 3 + 1] = Math.random() * 40
      p[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    return p
  }, [])

  return (
    <>
      <directionalLight
        ref={lightRef}
        position={[0, 30, 0]}
        color="#ffffff"
      />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rainPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#aaccff"
          size={0.08}
          transparent
          opacity={0.5}
          sizeAttenuation
        />
      </points>
    </>
  )
}

// EXPLOSION EFFECT - Nouveau!
function ExplosionEffect({ effect }: AdminEffectProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const elapsed = clock.elapsedTime % 2
      if (elapsed < 0.5) {
        const scale = 1 + elapsed * 2
        groupRef.current.scale.set(scale, scale, scale)
      }
    }
  })

  return (
    <group ref={groupRef} position={effect.position}>
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight color="#ff6600" intensity={50} distance={30} castShadow />
    </group>
  )
}

// MANAGER
export function AdminEffects() {
  const effects = useGameStore((s) => s.adminEffects)
  const weather = useGameStore((s) => s.weather)

  return (
    <group>
      {effects.map((effect) => {
        switch (effect.type) {
          case 'jail':
            return <JailEffect key={effect.id} effect={effect} />
          case 'freeze':
            return <FreezeEffect key={effect.id} effect={effect} />
          case 'tp':
            return <TpEffect key={effect.id} effect={effect} />
          case 'spotlight':
            return <SpotlightEffect key={effect.id} effect={effect} />
          case 'explosion':
            return <ExplosionEffect key={effect.id} effect={effect} />
          default:
            return null
        }
      })}
      {(weather === 'rain' || effects.some((e) => e.type === 'storm')) && (
        <StormEffect />
      )}
    </group>
  )
}
