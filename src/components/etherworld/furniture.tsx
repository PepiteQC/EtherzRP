'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useEtherWorldStore } from '@/lib/etherworld/store'

// ============================================
// BEDROOM FURNITURE
// ============================================

export function LuxuryBed({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base/Frame */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.3, 2.4]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Mattress */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[2, 0.25, 2.2]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
      </mesh>
      
      {/* Pillows */}
      <mesh position={[-0.5, 0.6, -0.85]} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.4]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.95} />
      </mesh>
      <mesh position={[0.5, 0.6, -0.85]} castShadow>
        <boxGeometry args={[0.5, 0.15, 0.4]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.95} />
      </mesh>
      
      {/* Blanket */}
      <mesh position={[0, 0.55, 0.3]} castShadow>
        <boxGeometry args={[1.9, 0.08, 1.4]} />
        <meshStandardMaterial color="#2d3748" roughness={0.85} />
      </mesh>
      
      {/* Headboard */}
      <mesh position={[0, 0.9, -1.15]} castShadow>
        <boxGeometry args={[2.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.6} />
      </mesh>
      
      {/* Headboard LED strip */}
      <mesh position={[0, 0.35, -1.1]}>
        <boxGeometry args={[2, 0.02, 0.02]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

export function Nightstand({ position = [0, 0, 0] as [number, number, number], side = 'left' }: { position?: [number, number, number], side?: 'left' | 'right' }) {
  const { interactables, toggleInteractable } = useEtherWorldStore()
  const drawerId = side === 'left' ? 'drawer1' : 'drawer2'
  const isOpen = interactables[drawerId]?.isActive || false
  
  return (
    <group position={position}>
      {/* Main body */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.5, 0.4]} />
        <meshStandardMaterial color="#1f2937" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Drawer */}
      <mesh 
        position={[0, 0.25, isOpen ? 0.25 : 0.18]} 
        castShadow
        onClick={() => toggleInteractable(drawerId)}
      >
        <boxGeometry args={[0.44, 0.18, 0.1]} />
        <meshStandardMaterial color="#374151" metalness={0.2} roughness={0.7} />
      </mesh>
      
      {/* Handle */}
      <mesh position={[0, 0.25, isOpen ? 0.32 : 0.25]}>
        <boxGeometry args={[0.15, 0.02, 0.02]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Lamp */}
      <group position={[0, 0.5, 0]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.2, 8]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.12, 0.08, 0.25, 8]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  )
}

// ============================================
// LIVING AREA FURNITURE
// ============================================

export function ModernSofa({ position = [0, 0, 0] as [number, number, number], rotation = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.15, 0.9]} />
        <meshStandardMaterial color="#111827" metalness={0.1} roughness={0.9} />
      </mesh>
      
      {/* Seat cushions */}
      <mesh position={[-0.5, 0.35, 0.05]} castShadow>
        <boxGeometry args={[0.9, 0.2, 0.7]} />
        <meshStandardMaterial color="#1f2937" roughness={0.95} />
      </mesh>
      <mesh position={[0.5, 0.35, 0.05]} castShadow>
        <boxGeometry args={[0.9, 0.2, 0.7]} />
        <meshStandardMaterial color="#1f2937" roughness={0.95} />
      </mesh>
      
      {/* Back */}
      <mesh position={[0, 0.55, -0.35]} castShadow>
        <boxGeometry args={[2, 0.5, 0.2]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      
      {/* Armrests */}
      <mesh position={[-0.95, 0.4, 0]} castShadow>
        <boxGeometry args={[0.1, 0.35, 0.8]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      <mesh position={[0.95, 0.4, 0]} castShadow>
        <boxGeometry args={[0.1, 0.35, 0.8]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      
      {/* Metal legs */}
      {[[-0.85, 0.05, 0.3], [0.85, 0.05, 0.3], [-0.85, 0.05, -0.3], [0.85, 0.05, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          <meshStandardMaterial color="#4b5563" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
    </group>
  )
}

export function CoffeeTable({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position}>
      {/* Glass top */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1, 0.03, 0.6]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.7} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Metal frame */}
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.9, 0.02, 0.5]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Legs */}
      {[[-0.4, 0.17, 0.2], [0.4, 0.17, 0.2], [-0.4, 0.17, -0.2], [0.4, 0.17, -0.2]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.03, 0.34, 0.03]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      
      {/* Magazines/Items on table */}
      <mesh position={[-0.2, 0.38, 0]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.15]} />
        <meshStandardMaterial color="#ef4444" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.38, 0.1]}>
        <cylinderGeometry args={[0.04, 0.03, 0.12, 8]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

export function TVStand({ position = [0, 0, 0] as [number, number, number] }) {
  const { interactables, toggleInteractable, lights, toggleLight } = useEtherWorldStore()
  const tvOn = interactables.tv?.isActive || false
  const tvRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (tvOn && tvRef.current) {
      const material = tvRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })
  
  const handleTVClick = () => {
    toggleInteractable('tv')
    toggleLight('tv')
  }
  
  return (
    <group position={position}>
      {/* TV Unit */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.4, 0.5]} />
        <meshStandardMaterial color="#111827" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Shelves */}
      <mesh position={[0, 0.45, 0.1]}>
        <boxGeometry args={[2.3, 0.02, 0.3]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* TV Screen */}
      <mesh 
        ref={tvRef}
        position={[0, 1.1, 0.15]} 
        castShadow
        onClick={handleTVClick}
      >
        <boxGeometry args={[2, 1.2, 0.05]} />
        <meshStandardMaterial 
          color={tvOn ? "#1e3a5f" : "#0a0a0a"} 
          emissive={tvOn ? "#3b82f6" : "#000000"}
          emissiveIntensity={tvOn ? 0.5 : 0}
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
      
      {/* TV Frame */}
      <mesh position={[0, 1.1, 0.12]}>
        <boxGeometry args={[2.1, 1.3, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* TV Stand/Mount */}
      <mesh position={[0, 0.45, 0.2]}>
        <boxGeometry args={[0.4, 0.08, 0.15]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* LED strip under TV */}
      <mesh position={[0, 0.42, 0.26]}>
        <boxGeometry args={[1.8, 0.02, 0.02]} />
        <meshStandardMaterial 
          color={tvOn ? "#8b5cf6" : "#1f2937"} 
          emissive={tvOn ? "#8b5cf6" : "#000000"} 
          emissiveIntensity={tvOn ? 1 : 0} 
        />
      </mesh>
      
      {/* Gaming console */}
      <mesh position={[-0.6, 0.47, 0.1]}>
        <boxGeometry args={[0.3, 0.08, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* Soundbar */}
      <mesh position={[0, 0.47, 0.2]}>
        <boxGeometry args={[1, 0.06, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

// ============================================
// DESK & GAMING SETUP
// ============================================

export function GamingDesk({ position = [0, 0, 0] as [number, number, number], rotation = [0, 0, 0] as [number, number, number] }) {
  const { lights } = useEtherWorldStore()
  const deskLightOn = lights.desk?.isOn || false
  
  return (
    <group position={position} rotation={rotation}>
      {/* Desktop */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.04, 0.8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* RGB edge */}
      <mesh position={[0, 0.73, 0.39]}>
        <boxGeometry args={[1.6, 0.02, 0.02]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.7, 0.37, 0]} castShadow>
        <boxGeometry args={[0.05, 0.74, 0.7]} />
        <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.7, 0.37, 0]} castShadow>
        <boxGeometry args={[0.05, 0.74, 0.7]} />
        <meshStandardMaterial color="#111827" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Monitor */}
      <mesh position={[0, 1.15, -0.2]} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.03]} />
        <meshStandardMaterial color="#0f172a" emissive="#3b82f6" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.15, -0.22]}>
        <boxGeometry args={[0.95, 0.55, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.85, -0.2]}>
        <boxGeometry args={[0.15, 0.1, 0.1]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Keyboard */}
      <mesh position={[0, 0.78, 0.15]}>
        <boxGeometry args={[0.45, 0.02, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.79, 0.15]}>
        <boxGeometry args={[0.43, 0.01, 0.13]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Mouse */}
      <mesh position={[0.35, 0.78, 0.15]}>
        <boxGeometry args={[0.06, 0.02, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Mousepad */}
      <mesh position={[0.3, 0.77, 0.15]}>
        <boxGeometry args={[0.3, 0.005, 0.25]} />
        <meshStandardMaterial color="#1f2937" roughness={0.95} />
      </mesh>
      
      {/* Desk lamp */}
      <group position={[-0.6, 0.77, -0.25]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.1, 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
          <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.2, 0.35, 0]}>
          <coneGeometry args={[0.08, 0.12, 8]} />
          <meshStandardMaterial 
            color={deskLightOn ? "#fef3c7" : "#4b5563"} 
            emissive={deskLightOn ? "#fef3c7" : "#000000"}
            emissiveIntensity={deskLightOn ? 0.5 : 0}
          />
        </mesh>
      </group>
      
      {/* Gaming chair placeholder position */}
    </group>
  )
}

export function GamingChair({ position = [0, 0, 0] as [number, number, number], rotation = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Pole */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Seat */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      
      {/* Back */}
      <mesh position={[0, 0.9, -0.2]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.08]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      
      {/* Headrest */}
      <mesh position={[0, 1.35, -0.18]} castShadow>
        <boxGeometry args={[0.25, 0.15, 0.1]} />
        <meshStandardMaterial color="#1f2937" roughness={0.9} />
      </mesh>
      
      {/* RGB strips on sides */}
      <mesh position={[0.24, 0.9, -0.16]}>
        <boxGeometry args={[0.02, 0.5, 0.02]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-0.24, 0.9, -0.16]}>
        <boxGeometry args={[0.02, 0.5, 0.02]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
      
      {/* Armrests */}
      <mesh position={[0.3, 0.65, 0.05]}>
        <boxGeometry args={[0.08, 0.2, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.3, 0.65, 0.05]}>
        <boxGeometry args={[0.08, 0.2, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

// ============================================
// ARCADE MACHINE
// ============================================

export function ArcadeMachine({ position = [0, 0, 0] as [number, number, number], rotation = [0, 0, 0] as [number, number, number] }) {
  const { interactables } = useEtherWorldStore()
  const isActive = interactables.arcade?.isActive || false
  const screenRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (isActive && screenRef.current) {
      const material = screenRef.current.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 4) * 0.2
    }
  })
  
  return (
    <group position={position} rotation={rotation}>
      {/* Main cabinet */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 1.8, 0.7]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Screen bezel */}
      <mesh position={[0, 1.2, 0.32]}>
        <boxGeometry args={[0.55, 0.5, 0.08]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 1.2, 0.35]}>
        <boxGeometry args={[0.48, 0.4, 0.02]} />
        <meshStandardMaterial 
          color={isActive ? "#1e40af" : "#0a0a0a"} 
          emissive={isActive ? "#3b82f6" : "#000000"}
          emissiveIntensity={isActive ? 0.6 : 0}
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
      
      {/* Control panel */}
      <mesh position={[0, 0.6, 0.4]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.6, 0.3, 0.15]} />
        <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Joystick */}
      <mesh position={[-0.15, 0.7, 0.42]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
        <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.15, 0.77, 0.42]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ef4444" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* Buttons */}
      {[[0.05, '#22c55e'], [0.15, '#3b82f6'], [0.25, '#eab308']].map(([x, color], i) => (
        <mesh key={i} position={[x as number, 0.72, 0.42]}>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
          <meshStandardMaterial color={color as string} emissive={color as string} emissiveIntensity={0.3} />
        </mesh>
      ))}
      
      {/* Coin slot */}
      <mesh position={[0, 0.3, 0.36]}>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Marquee light */}
      <mesh position={[0, 1.7, 0.32]}>
        <boxGeometry args={[0.55, 0.15, 0.08]} />
        <meshStandardMaterial 
          color="#8b5cf6" 
          emissive="#8b5cf6" 
          emissiveIntensity={isActive ? 1 : 0.3} 
        />
      </mesh>
      
      {/* Side art panels */}
      <mesh position={[0.34, 0.9, 0]}>
        <boxGeometry args={[0.02, 1.4, 0.5]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[-0.34, 0.9, 0]}>
        <boxGeometry args={[0.02, 1.4, 0.5]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  )
}

// ============================================
// MINI BAR & KITCHEN
// ============================================

export function MiniBar({ position = [0, 0, 0] as [number, number, number] }) {
  const { interactables, toggleInteractable } = useEtherWorldStore()
  const fridgeOpen = interactables.fridge?.isActive || false
  
  return (
    <group position={position}>
      {/* Counter */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.05, 0.6]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.6} />
      </mesh>
      
      {/* Cabinet base */}
      <mesh position={[0, 0.43, 0]} castShadow>
        <boxGeometry args={[1.5, 0.86, 0.55]} />
        <meshStandardMaterial color="#111827" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Mini fridge door */}
      <mesh 
        position={fridgeOpen ? [-0.35, 0.43, 0.45] : [-0.35, 0.43, 0.28]}
        rotation={fridgeOpen ? [0, -Math.PI / 3, 0] : [0, 0, 0]}
        castShadow
        onClick={() => toggleInteractable('fridge')}
      >
        <boxGeometry args={[0.7, 0.8, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Fridge handle */}
      <mesh position={fridgeOpen ? [-0.1, 0.43, 0.65] : [0, 0.43, 0.32]} rotation={fridgeOpen ? [0, -Math.PI / 3, 0] : [0, 0, 0]}>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Fridge interior light (when open) */}
      {fridgeOpen && (
        <pointLight position={[-0.35, 0.43, 0.1]} intensity={0.3} color="#e0f2fe" distance={1} />
      )}
      
      {/* Microwave */}
      <mesh position={[0.45, 1.15, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.35, 1.15, 0.21]}>
        <boxGeometry args={[0.25, 0.2, 0.01]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Coffee machine */}
      <mesh position={[-0.5, 0.97, 0]}>
        <boxGeometry args={[0.25, 0.35, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.5, 1.17, -0.1]}>
        <boxGeometry args={[0.2, 0.08, 0.08]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Bottles on counter */}
      {[[-0.15, '#22c55e'], [0, '#60a5fa'], [0.15, '#f59e0b']].map(([x, color], i) => (
        <group key={i} position={[x as number, 1.05, 0.15]}>
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
            <meshStandardMaterial color={color as string} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.05, 8]} />
            <meshStandardMaterial color="#374151" metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ============================================
// CLOSET & STORAGE
// ============================================

export function Wardrobe({ position = [0, 0, 0] as [number, number, number], rotation = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main body */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2.2, 0.6]} />
        <meshStandardMaterial color="#1f2937" metalness={0.1} roughness={0.85} />
      </mesh>
      
      {/* Doors */}
      <mesh position={[-0.28, 1.1, 0.28]} castShadow>
        <boxGeometry args={[0.55, 2.1, 0.04]} />
        <meshStandardMaterial color="#111827" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[0.28, 1.1, 0.28]} castShadow>
        <boxGeometry args={[0.55, 2.1, 0.04]} />
        <meshStandardMaterial color="#111827" metalness={0.2} roughness={0.8} />
      </mesh>
      
      {/* Handles */}
      <mesh position={[-0.05, 1.1, 0.32]}>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.05, 1.1, 0.32]}>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Mirror on door */}
      <mesh position={[-0.28, 1.3, 0.305]}>
        <boxGeometry args={[0.35, 0.8, 0.01]} />
        <meshStandardMaterial color="#94a3b8" metalness={1} roughness={0} />
      </mesh>
    </group>
  )
}

export function Safe({ position = [0, 0, 0] as [number, number, number] }) {
  const { interactables, toggleInteractable } = useEtherWorldStore()
  const isOpen = interactables.safe?.isActive || false
  
  return (
    <group position={position}>
      {/* Safe body */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.35]} />
        <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Door */}
      <mesh 
        position={isOpen ? [-0.15, 0.2, 0.25] : [0, 0.2, 0.16]}
        rotation={isOpen ? [0, -Math.PI / 2.5, 0] : [0, 0, 0]}
        castShadow
        onClick={() => toggleInteractable('safe')}
      >
        <boxGeometry args={[0.35, 0.35, 0.04]} />
        <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Keypad */}
      <mesh position={isOpen ? [-0.05, 0.2, 0.35] : [0.08, 0.2, 0.19]} rotation={isOpen ? [0, -Math.PI / 2.5, 0] : [0, 0, 0]}>
        <boxGeometry args={[0.1, 0.12, 0.02]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* LED indicator */}
      <mesh position={isOpen ? [-0.12, 0.28, 0.32] : [0.08, 0.28, 0.19]} rotation={isOpen ? [0, -Math.PI / 2.5, 0] : [0, 0, 0]}>
        <boxGeometry args={[0.015, 0.015, 0.01]} />
        <meshStandardMaterial 
          color={isOpen ? "#22c55e" : "#ef4444"} 
          emissive={isOpen ? "#22c55e" : "#ef4444"} 
          emissiveIntensity={0.8} 
        />
      </mesh>
    </group>
  )
}

// ============================================
// DECORATIVE ELEMENTS
// ============================================

export function WallArt({ position = [0, 0, 0] as [number, number, number], size = [1, 0.6] as [number, number] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[size[0] + 0.05, size[1] + 0.05, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* Canvas */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[size[0], size[1], 0.01]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.9} />
      </mesh>
      
      {/* Abstract art elements */}
      <mesh position={[-0.2, 0.1, 0.03]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.8} />
      </mesh>
      <mesh position={[0.15, -0.05, 0.03]}>
        <boxGeometry args={[0.2, 0.15, 0.005]} />
        <meshStandardMaterial color="#8b5cf6" roughness={0.8} />
      </mesh>
    </group>
  )
}

export function Plant({ position = [0, 0, 0] as [number, number, number], size = 1 }) {
  return (
    <group position={position} scale={size}>
      {/* Pot */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.24, 8]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>
      
      {/* Soil */}
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
        <meshStandardMaterial color="#1c1917" roughness={1} />
      </mesh>
      
      {/* Plant leaves */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh 
          key={i} 
          position={[
            Math.sin(angle * Math.PI / 180) * 0.05,
            0.35 + i * 0.02,
            Math.cos(angle * Math.PI / 180) * 0.05
          ]}
          rotation={[0.3, angle * Math.PI / 180, 0.2]}
        >
          <boxGeometry args={[0.08, 0.2, 0.02]} />
          <meshStandardMaterial color="#15803d" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

export function Rug({ position = [0, 0, 0] as [number, number, number], size = [2, 1.5] as [number, number] }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#1f2937" roughness={0.95} />
    </mesh>
  )
}

export function CeilingLight({ position = [0, 0, 0] as [number, number, number] }) {
  const { lights } = useEtherWorldStore()
  const isOn = lights.ceiling?.isOn || false
  
  return (
    <group position={position}>
      {/* Fixture */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.2, 0.08, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Bulb area */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
        <meshStandardMaterial 
          color={isOn ? "#fef3c7" : "#374151"} 
          emissive={isOn ? "#fef3c7" : "#000000"}
          emissiveIntensity={isOn ? 1 : 0}
          transparent
          opacity={isOn ? 0.9 : 1}
        />
      </mesh>
      
      {/* Spot light */}
      {isOn && (
        <spotLight
          position={[0, -0.1, 0]}
          angle={Math.PI / 4}
          penumbra={0.5}
          intensity={2}
          color="#fff5e6"
          castShadow
          shadow-mapSize={[512, 512]}
        />
      )}
    </group>
  )
}

export function NeonSign({ position = [0, 0, 0] as [number, number, number], text = "ETHER", color = "#8b5cf6" }: { position?: [number, number, number]; text?: string; color?: string }) {
  const { lights } = useEtherWorldStore()
  const isOn = lights.neon?.isOn ?? true
  
  return (
    <group position={position}>
      {/* Backing plate */}
      <mesh>
        <boxGeometry args={[1.2, 0.4, 0.02]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      
      {/* Neon tubes (simplified as boxes) */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1, 0.15, 0.02]} />
        <meshStandardMaterial 
          color={isOn ? "#8b5cf6" : "#374151"} 
          emissive={isOn ? "#8b5cf6" : "#000000"}
          emissiveIntensity={isOn ? 2 : 0}
        />
      </mesh>
      
      {isOn && (
        <pointLight position={[0, 0, 0.2]} intensity={0.5} color="#8b5cf6" distance={3} />
      )}
    </group>
  )
}

// Additional room furniture compatibility primitives.
type FurnitureCompatProps = {
  position?: [number, number, number]
  rotation?: [number, number, number]
  size?: number | [number, number] | [number, number, number]
  width?: number
  text?: string
  color?: string
}

function CompatBox({ position = [0, 0, 0], rotation = [0, 0, 0], color = '#334155', size = [0.8, 0.8, 0.8] }: FurnitureCompatProps) {
  const args = Array.isArray(size) ? (size.length === 2 ? [size[0], 0.08, size[1]] : size) : [size, size, size]
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={args as [number, number, number]} />
        <meshStandardMaterial color={color} roughness={0.75} metalness={0.1} />
      </mesh>
    </group>
  )
}

export const FloorLamp = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]}><mesh position={[0,0.75,0]}><cylinderGeometry args={[0.035,0.035,1.5,12]} /><meshStandardMaterial color="#64748b" metalness={0.6} /></mesh><mesh position={[0,1.55,0]}><sphereGeometry args={[0.18,16,16]} /><meshStandardMaterial color="#fde68a" emissive="#fde68a" emissiveIntensity={0.7} /></mesh><pointLight position={[0,1.6,0]} intensity={0.6} distance={4} /></group>
export const DeskLamp = FloorLamp
export const Bookshelf = (props: FurnitureCompatProps) => <CompatBox {...props} size={[0.9, 1.7, 0.28]} color="#3f2d20" />
export const DiningTable = (props: FurnitureCompatProps) => <CompatBox {...props} size={[1.6, 0.12, 1]} color="#5b3a24" />
export const KitchenIsland = (props: FurnitureCompatProps) => <CompatBox {...props} size={[1.8, 0.9, 0.8]} color="#475569" />
export const Refrigerator = (props: FurnitureCompatProps) => <CompatBox {...props} size={[0.7, 1.8, 0.7]} color="#e5e7eb" />
export const OvenStove = (props: FurnitureCompatProps) => <CompatBox {...props} size={[0.7, 0.9, 0.65]} color="#111827" />
export const KitchenSink = (props: FurnitureCompatProps) => <CompatBox {...props} size={[0.7, 0.85, 0.55]} color="#cbd5e1" />
export const BarStool = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]} rotation={props.rotation ?? [0,0,0]}><mesh position={[0,0.45,0]}><cylinderGeometry args={[0.18,0.18,0.08,16]} /><meshStandardMaterial color="#1f2937" /></mesh><mesh position={[0,0.22,0]}><cylinderGeometry args={[0.035,0.035,0.45,8]} /><meshStandardMaterial color="#64748b" metalness={0.8} /></mesh></group>
export const WineRack = (props: FurnitureCompatProps) => <CompatBox {...props} size={[0.7, 0.8, 0.25]} color="#4c1d1d" />
export const Dishwasher = (props: FurnitureCompatProps) => <CompatBox {...props} size={[0.65, 0.75, 0.6]} color="#94a3b8" />
export const OutdoorLounge = (props: FurnitureCompatProps) => <CompatBox {...props} size={[1.8, 0.35, 0.8]} color="#334155" />
export const HotTub = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]}><mesh position={[0,0.35,0]}><cylinderGeometry args={[0.8,0.8,0.45,32]} /><meshStandardMaterial color="#0f766e" /></mesh><pointLight position={[0,0.75,0]} color="#67e8f9" intensity={0.4} /></group>
export const GardenTable = (props: FurnitureCompatProps) => <CompatBox {...props} size={[0.9, 0.08, 0.9]} color="#4b5563" />
export const PottedTree = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]} scale={typeof props.size === 'number' ? props.size : 1}><mesh position={[0,0.25,0]}><cylinderGeometry args={[0.18,0.14,0.35,12]} /><meshStandardMaterial color="#78350f" /></mesh><mesh position={[0,1.0,0]}><sphereGeometry args={[0.45,16,16]} /><meshStandardMaterial color="#166534" /></mesh></group>
export const FirePit = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]}><mesh><cylinderGeometry args={[0.45,0.45,0.15,24]} /><meshStandardMaterial color="#292524" /></mesh><pointLight position={[0,0.35,0]} color="#fb923c" intensity={0.8} distance={3} /></group>
export const OutdoorLamp = FloorLamp
export const BalconyRailing = (props: FurnitureCompatProps) => <CompatBox {...props} size={Array.isArray(props.size) ? [props.size[0], props.size[1] ?? 1, 0.08] : [2, 1, 0.08]} color="#94a3b8" />
export const SunLounger = (props: FurnitureCompatProps) => <CompatBox {...props} size={[1.4, 0.18, 0.55]} color="#e2e8f0" />
export const CandleSet = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]}>{[-0.08,0,0.08].map((x,i)=><mesh key={i} position={[x,0.08,0]}><cylinderGeometry args={[0.025,0.025,0.16,8]} /><meshStandardMaterial color="#fff7ed" emissive="#fdba74" emissiveIntensity={0.4} /></mesh>)}</group>
export const Sculpture = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]} rotation={props.rotation ?? [0,0,0]}><mesh position={[0,0.35,0]}><torusKnotGeometry args={[0.18,0.05,48,8]} /><meshStandardMaterial color="#a78bfa" metalness={0.5} roughness={0.25} /></mesh></group>
export const VaseFlowers = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]}><mesh position={[0,0.12,0]}><cylinderGeometry args={[0.09,0.12,0.24,12]} /><meshStandardMaterial color="#2563eb" /></mesh><mesh position={[0,0.35,0]}><sphereGeometry args={[0.16,12,12]} /><meshStandardMaterial color="#f472b6" /></mesh></group>
export const Clock = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]} rotation={props.rotation ?? [0,0,0]}><mesh><circleGeometry args={[0.22,32]} /><meshStandardMaterial color="#f8fafc" /></mesh></group>
export const Mirror = (props: FurnitureCompatProps) => <CompatBox {...props} size={Array.isArray(props.size) ? [props.size[0], props.size[1], 0.03] : [0.7, 1.2, 0.03]} color="#bae6fd" />
export const CurtainSet = (props: FurnitureCompatProps) => <group position={props.position ?? [0,0,0]} rotation={props.rotation ?? [0,0,0]}><mesh position={[-(props.width ?? 2)/4,0,0]}><boxGeometry args={[(props.width ?? 2)/2,1.2,0.04]} /><meshStandardMaterial color="#312e81" /></mesh><mesh position={[(props.width ?? 2)/4,0,0]}><boxGeometry args={[(props.width ?? 2)/2,1.2,0.04]} /><meshStandardMaterial color="#312e81" /></mesh></group>
