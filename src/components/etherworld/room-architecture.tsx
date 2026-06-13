'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useEtherWorldStore } from '@/lib/etherworld/store'

// Room dimensions
const ROOM_WIDTH = 8
const ROOM_DEPTH = 10
const ROOM_HEIGHT = 3
const WALL_THICKNESS = 0.15
const BATHROOM_WIDTH = 2.5
const BATHROOM_DEPTH = 3

export function RoomArchitecture() {
  return (
    <group>
      {/* Main Floor - Parquet */}
      <Floor />
      
      {/* Ceiling */}
      <Ceiling />
      
      {/* Walls */}
      <Walls />
      
      {/* Bathroom partition */}
      <BathroomPartition />
    </group>
  )
}

function Floor() {
  const { lights } = useEtherWorldStore()
  
  return (
    <group>
      {/* Main room floor - lighter parquet */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#3d3530" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Parquet pattern overlay */}
      {[...Array(10)].map((_, row) => (
        [...Array(8)].map((_, col) => (
          <mesh 
            key={`${row}-${col}`}
            position={[
              -ROOM_WIDTH / 2 + 0.5 + col * 1,
              0.001,
              -ROOM_DEPTH / 2 + 0.5 + row * 1
            ]}
            rotation={[-Math.PI / 2, 0, (row + col) % 2 === 0 ? 0 : Math.PI / 2]}
            receiveShadow
          >
            <planeGeometry args={[0.95, 0.2]} />
            <meshStandardMaterial 
              color={(row + col) % 2 === 0 ? "#4a413a" : "#554b42"} 
              roughness={0.6} 
            />
          </mesh>
        ))
      ))}
      
      {/* Bathroom floor - tiles */}
      <mesh 
        position={[-ROOM_WIDTH / 2 + BATHROOM_WIDTH / 2 + WALL_THICKNESS, 0.002, -ROOM_DEPTH / 2 + BATHROOM_DEPTH / 2 + WALL_THICKNESS]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[BATHROOM_WIDTH - 0.1, BATHROOM_DEPTH - 0.1]} />
        <meshStandardMaterial color="#5b6572" roughness={0.3} metalness={0.2} />
      </mesh>
      
      {/* Tile grid for bathroom */}
      {[...Array(6)].map((_, row) => (
        [...Array(5)].map((_, col) => (
          <mesh 
            key={`bath-${row}-${col}`}
            position={[
              -ROOM_WIDTH / 2 + 0.4 + col * 0.5,
              0.003,
              -ROOM_DEPTH / 2 + 0.4 + row * 0.5
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.48, 0.48]} />
            <meshStandardMaterial color="#6b7583" roughness={0.2} />
          </mesh>
        ))
      ))}
    </group>
  )
}

function Ceiling() {
  return (
    <group>
      {/* Main ceiling */}
      <mesh position={[0, ROOM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>
      
      {/* Recessed lighting track */}
      <mesh position={[0, ROOM_HEIGHT - 0.02, 0]}>
        <boxGeometry args={[0.1, 0.04, ROOM_DEPTH - 1]} />
        <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Ceiling spots */}
      {[-2, 0, 2].map((z, i) => (
        <CeilingSpot key={i} position={[0, ROOM_HEIGHT - 0.05, z]} />
      ))}
      
      {/* AC unit */}
      <mesh position={[2, ROOM_HEIGHT - 0.15, -3]}>
        <boxGeometry args={[1.2, 0.25, 0.35]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
      </mesh>
      <mesh position={[2, ROOM_HEIGHT - 0.28, -3]}>
        <boxGeometry args={[1, 0.02, 0.2]} />
        <meshStandardMaterial color="#e5e5e5" roughness={0.5} />
      </mesh>
    </group>
  )
}

function CeilingSpot({ position }: { position: [number, number, number] }) {
  const { lights } = useEtherWorldStore()
  const isOn = lights.ceiling?.isOn ?? true
  
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.08, 0.1, 0.05, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
        <meshStandardMaterial 
          color={isOn ? "#fef3c7" : "#374151"} 
          emissive={isOn ? "#fef3c7" : "#000000"}
          emissiveIntensity={isOn ? 0.8 : 0}
        />
      </mesh>
    </group>
  )
}

function Walls() {
  return (
    <group>
      {/* Back wall (with window) */}
      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
      </mesh>
      
      {/* Front wall (with main door) - left part */}
      <mesh position={[-ROOM_WIDTH / 2 + 1.5, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[3, ROOM_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
      </mesh>
      
      {/* Front wall - right part */}
      <mesh position={[ROOM_WIDTH / 2 - 1.5, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[3, ROOM_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
      </mesh>
      
      {/* Front wall - above door */}
      <mesh position={[0, ROOM_HEIGHT - 0.35, ROOM_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.7, WALL_THICKNESS]} />
        <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, ROOM_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
      </mesh>
      
      {/* Baseboard trim */}
      <Baseboards />
      
      {/* Crown molding */}
      <CrownMolding />
    </group>
  )
}

function Baseboards() {
  const baseboardHeight = 0.1
  const baseboardDepth = 0.02
  
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, baseboardHeight / 2, -ROOM_DEPTH / 2 + WALL_THICKNESS / 2 + baseboardDepth / 2]}>
        <boxGeometry args={[ROOM_WIDTH - WALL_THICKNESS * 2, baseboardHeight, baseboardDepth]} />
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-ROOM_WIDTH / 2 + WALL_THICKNESS / 2 + baseboardDepth / 2, baseboardHeight / 2, 0]}>
        <boxGeometry args={[baseboardDepth, baseboardHeight, ROOM_DEPTH - WALL_THICKNESS * 2]} />
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[ROOM_WIDTH / 2 - WALL_THICKNESS / 2 - baseboardDepth / 2, baseboardHeight / 2, 0]}>
        <boxGeometry args={[baseboardDepth, baseboardHeight, ROOM_DEPTH - WALL_THICKNESS * 2]} />
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>
    </group>
  )
}

function CrownMolding() {
  const moldingSize = 0.08
  
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, ROOM_HEIGHT - moldingSize / 2, -ROOM_DEPTH / 2 + WALL_THICKNESS / 2 + moldingSize / 2]}>
        <boxGeometry args={[ROOM_WIDTH, moldingSize, moldingSize]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-ROOM_WIDTH / 2 + WALL_THICKNESS / 2 + moldingSize / 2, ROOM_HEIGHT - moldingSize / 2, 0]}>
        <boxGeometry args={[moldingSize, moldingSize, ROOM_DEPTH]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[ROOM_WIDTH / 2 - WALL_THICKNESS / 2 - moldingSize / 2, ROOM_HEIGHT - moldingSize / 2, 0]}>
        <boxGeometry args={[moldingSize, moldingSize, ROOM_DEPTH]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
      </mesh>
    </group>
  )
}

function BathroomPartition() {
  const doorWidth = 0.8
  const wallStartX = -ROOM_WIDTH / 2 + WALL_THICKNESS
  const wallEndX = wallStartX + BATHROOM_WIDTH
  const wallZ = -ROOM_DEPTH / 2 + BATHROOM_DEPTH + WALL_THICKNESS
  
  return (
    <group>
      {/* Partition wall - left of door */}
      <mesh position={[wallStartX + 0.5, ROOM_HEIGHT / 2, wallZ]} castShadow receiveShadow>
        <boxGeometry args={[1, ROOM_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#1f2937" roughness={0.85} />
      </mesh>
      
      {/* Partition wall - right of door */}
      <mesh position={[wallEndX - 0.5, ROOM_HEIGHT / 2, wallZ]} castShadow receiveShadow>
        <boxGeometry args={[1, ROOM_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#1f2937" roughness={0.85} />
      </mesh>
      
      {/* Above door */}
      <mesh position={[wallStartX + BATHROOM_WIDTH / 2, ROOM_HEIGHT - 0.35, wallZ]} castShadow receiveShadow>
        <boxGeometry args={[doorWidth + 0.2, 0.7, WALL_THICKNESS]} />
        <meshStandardMaterial color="#1f2937" roughness={0.85} />
      </mesh>
      
      {/* Back bathroom wall (partial, for depth) */}
      <mesh position={[wallStartX + BATHROOM_WIDTH / 2, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2 + WALL_THICKNESS]}>
        <boxGeometry args={[BATHROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#374151" roughness={0.4} />
      </mesh>
    </group>
  )
}

// ============================================
// LIGHTING SYSTEM
// ============================================

export function RoomLighting() {
  const { lights } = useEtherWorldStore()
  
  return (
    <group>
      {/* AMBIENT - reduit pour laisser les lumieres refleter */}
      <ambientLight intensity={0.4} color="#1a1a2e" />
      
      {/* Hemisphere - eclairage subtil */}
      <hemisphereLight intensity={0.3} color="#fef3c7" groundColor="#1a1a2e" />
      
      {/* DIRECTIONAL PRINCIPALE - avec ombres */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        color="#fef3c7"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />
      
      {/* SPOT CENTRAL - avec ombre */}
      <spotLight
        position={[0, 2.9, 0]}
        angle={Math.PI / 2}
        penumbra={0.5}
        intensity={4}
        color="#fef3c7"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* SPOTS SECONDAIRES - sans ombre */}
      <spotLight
        position={[0, 2.9, -3]}
        angle={Math.PI / 2}
        penumbra={0.5}
        intensity={3}
        color="#fef3c7"
      />
      <spotLight
        position={[0, 2.9, 3]}
        angle={Math.PI / 2}
        penumbra={0.5}
        intensity={3}
        color="#fef3c7"
      />
      
      {/* POINT LIGHTS - fill reduit */}
      <pointLight position={[-3, 2, -3]} intensity={2} color="#fef3c7" distance={10} />
      <pointLight position={[3, 2, -3]} intensity={2} color="#fef3c7" distance={10} />
      <pointLight position={[-3, 2, 3]} intensity={2} color="#fef3c7" distance={10} />
      <pointLight position={[3, 2, 3]} intensity={2} color="#fef3c7" distance={10} />
      
      {/* Desk lamp */}
      {lights.desk?.isOn && (
        <pointLight
          position={[3.2, 1.5, 2]}
          intensity={3}
          color="#fef3c7"
          distance={5}
        />
      )}
      
      {/* Bathroom light */}
      {lights.bathroom?.isOn && (
        <pointLight
          position={[-2.5, 2.5, -3.5]}
          intensity={3}
          color="#ffffff"
          distance={6}
        />
      )}
      
      {/* TV glow */}
      {lights.tv?.isOn && (
        <pointLight
          position={[-2.5, 1.2, -1.5]}
          intensity={2}
          color="#3b82f6"
          distance={6}
        />
      )}
      
      {/* Neon violet - accent */}
      <pointLight
        position={[3.8, 2.2, -3]}
        intensity={3}
        color="#8b5cf6"
        distance={8}
      />
      
      {/* Window - lumiere ville */}
      <pointLight
        position={[0, 2, -6]}
        intensity={1.5}
        color="#6366f1"
        distance={10}
      />
    </group>
  )
}

// ============================================
// SPAWN PARTICLES
// ============================================

export function SpawnParticles({ active }: { active: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 100
  
  const positions = useRef<Float32Array>(
    new Float32Array(particleCount * 3).map((_, i) => {
      const idx = i % 3
      if (idx === 0) return (Math.random() - 0.5) * 3 // x
      if (idx === 1) return Math.random() * 2 + 0.5 // y
      return (Math.random() - 0.5) * 3 // z
    })
  )
  
  useFrame((state) => {
    if (particlesRef.current && active) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        positions[i3 + 1] += 0.01 + Math.sin(state.clock.elapsedTime + i) * 0.005
        
        if (positions[i3 + 1] > 3) {
          positions[i3 + 1] = 0.5
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.rotation.y += 0.001
    }
  })
  
  if (!active) return null
  
  return (
    <points ref={particlesRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#8b5cf6"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}
