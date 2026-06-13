import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import * as THREE from 'three'
import { DynamicTerrain } from './DynamicTerrain'

// Admin systems
import { useEditorStore } from '../admin/EtherWorld-Editor/useEditorStore'
import { useAgentStore } from '../admin/EtherWorld-Agent/useAgentStore'

interface GameSceneProps {
  children: React.ReactNode
}

export function GameScene({ children }: GameSceneProps) {
  const { scene, camera } = useThree()
  const groupRef = useRef<THREE.Group>(null!)

  const { objects: editorObjects } = useEditorStore()
  const { activeAgents } = useAgentStore()

  const [timeOfDay, setTimeOfDay] = useState(0.3)
  const [worldSeed] = useState(424242)

  // Lighting + Stars setup
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.008)
    scene.background = new THREE.Color(0x05080f)

    const hemiLight = new THREE.HemisphereLight(0x4477aa, 0x112233, 0.6)
    scene.add(hemiLight)

    // Star field
    const starsGeo = new THREE.BufferGeometry()
    const starCount = 8000
    const positions = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 800 + Math.random() * 400
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i]     = radius * Math.sin(phi) * Math.cos(theta)
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta) + 120
      positions[i + 2] = radius * Math.cos(phi)
    }

    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })

    const stars = new THREE.Points(starsGeo, starsMat)
    scene.add(stars)

    return () => {
      scene.remove(stars)
      scene.remove(hemiLight)
    }
  }, [scene])

  // Time of day cycle
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.008) % 1
    setTimeOfDay(t)

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = THREE.MathUtils.lerp(
        0.012, 0.006,
        Math.sin(t * Math.PI)
      )
    }
  })

  // Arcane events listener
  useEffect(() => {
    const handleTreeExplosion = () => {
      console.log('%c[Arcane] Tree explosion', 'color:#a0f')
    }
    window.addEventListener('arcane-tree-explosion', handleTreeExplosion)
    return () => window.removeEventListener('arcane-tree-explosion', handleTreeExplosion)
  }, [])

  return (
    <group ref={groupRef}>
      <Physics
        gravity={[0, -28, 0]}
        broadphase="SAP"
        allowSleep
        iterations={12}
        tolerance={0.001}
      >
        {/* Terrain */}
        <DynamicTerrain
          seed={worldSeed}
          size={280}
          segments={128}
          heightScale={22}
          quality={2}
        />

        {/* Editor objects (live sync) */}
        {editorObjects.map((obj, i) => (
          <primitive
            key={obj.id || i}
            object={obj.mesh}
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
          />
        ))}

        {/* Agent entities */}
        {activeAgents.map((agent, i) => (
          <group key={i} position={agent.position}>
            <mesh>
              <sphereGeometry args={[0.6]} />
              <meshStandardMaterial
                color={agent.color || '#00ffaa'}
                emissive={agent.color || '#00ffaa'}
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ))}

        {/* Game children (Player, Vehicles, etc.) */}
        {children}
      </Physics>
    </group>
  )
}