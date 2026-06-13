import React, { useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

// Systems from both repos merged & enriched
import { ArcaneShaderTree } from './ArcaneShaderTree'
import { DynamicTerrain } from './DynamicTerrain'
import { InteractiveObjects } from './InteractiveObjects'
import { ParticleSystem } from './ParticleSystem'
import { AudioManager } from './AudioManager'

// Admin systems integration
import { useEditorStore } from '../admin/EtherWorld-Editor/useEditorStore'
import { useAgentStore } from '../admin/EtherWorld-Agent/useAgentStore'

// Types
interface GameSceneProps {
  children: React.ReactNode
}

export function GameScene({ children }: GameSceneProps) {
  const { scene, camera, gl } = useThree()
  const groupRef = useRef<THREE.Group>(null!)
  
  // Global stores
  const { objects: editorObjects, selectedObject } = useEditorStore()
  const { activeAgents } = useAgentStore()
  
  // Scene state
  const [timeOfDay, setTimeOfDay] = useState(0.3) // 0-1 (night to day)
  const [worldSeed] = useState(424242)
  
  // Performance & quality settings
  const quality = 2 // 0=low, 1=medium, 2=high, 3=ultra
  
  // Enhanced lighting setup (merged from both repos)
  useEffect(() => {
    // Fog for atmosphere
    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.008)
    
    // Background color
    scene.background = new THREE.Color(0x05080f)
    
    // Add subtle global illumination
    const hemiLight = new THREE.HemisphereLight(0x4477aa, 0x112233, 0.6)
    scene.add(hemiLight)
    
    // Star field for night
    const starsGeometry = new THREE.BufferGeometry()
    const starCount = 8000
    const positions = new Float32Array(starCount * 3)
    
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 800 + Math.random() * 400
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta) + 120
      positions[i + 2] = radius * Math.cos(phi)
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    })
    
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)
    
    return () => {
      scene.remove(stars)
      scene.remove(hemiLight)
    }
  }, [scene])
  
  // Dynamic time of day cycle
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.008) % 1
    setTimeOfDay(t)
    
    // Update fog density based on time
    if (scene.fog instanceof THREE.FogExp2) {
      const nightFog = 0.012
      const dayFog = 0.006
      scene.fog.density = THREE.MathUtils.lerp(nightFog, dayFog, Math.sin(t * Math.PI))
    }
    
    // Gentle camera sway for immersion (optional)
    if (camera.position.y < 15) {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 8 + Math.sin(state.clock.elapsedTime * 0.4) * 0.3, 0.01)
    }
  })
  
  // Listen for arcane events from Real-shit
  useEffect(() => {
    const handleTreeExplosion = () => {
      console.log('%c[Arcane] Tree explosion triggered in GameScene', 'color:#a0f')
      // Spawn particle burst at random locations
      if (groupRef.current) {
        const explosionPos = new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          12,
          (Math.random() - 0.5) * 80
        )
        // This would trigger the ParticleSystem
      }
    }
    
    window.addEventListener('arcane-tree-explosion', handleTreeExplosion)
    return () => window.removeEventListener('arcane-tree-explosion', handleTreeExplosion)
  }, [])
  
  return (
    <group ref={groupRef}>
      {/* Physics World - Extremely important */}
      <Physics 
        gravity={[0, -28, 0]} 
        broadphase="SAP"
        allowSleep={true}
        iterations={12}
        tolerance={0.001}
      >
        {/* Dynamic Procedural Terrain (enriched) */}
        <DynamicTerrain 
          seed={worldSeed} 
          size={280} 
          segments={128}
          heightScale={22}
          quality={quality}
        />
        
        {/* Arcane Shader Trees - From Real-shit arcane system */}
        <ArcaneShaderTree 
          count={68} 
          spread={240}
          enableExplosion={true}
          quality={quality}
        />
        
        {/* Interactive World Objects */}
        <InteractiveObjects 
          density={42}
          includeHotels={true}
          includeDepanneur={true}
          includeGasStations={true}
        />
        
        {/* Particle Systems (weather + effects) */}
        <ParticleSystem 
          type="leaves"
          count={280}
          intensity={0.7}
        />
        
        {/* Audio Spatial System */}
        <AudioManager />
        
        {/* Editor-placed objects (live sync) */}
        {editorObjects.map((obj, index) => (
          <primitive 
            key={obj.id || index} 
            object={obj.mesh} 
            position={obj.position}
            rotation={obj.rotation}
            scale={obj.scale}
          />
        ))}
        
        {/* Agent-spawned entities */}
        {activeAgents.map((agent, idx) => (
          <group key={idx} position={agent.position}>
            {/* Agent visual representation */}
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
        
        {/* Main Game Children (Player, Vehicles, etc.) */}
        {children}
        
        {/* Route 138 Quebec Elements (integrated into physics) */}
        {/* This is handled in the Route138Quebec component */}
      </Physics>
      
      {/* Post-processing & Effects Layer */}
      <Html 
        position={[0, 60, -120]} 
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ 
          color: '#ffffff22', 
          fontSize: '9px', 
          fontFamily: 'monospace',
          transform: 'rotate(-12deg)'
        }}>
          ETHERWORLD v2.0 • FUSION RÉELLE
        </div>
      </Html>
    </group>
  )
}
