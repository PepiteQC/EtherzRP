/**
 * EquipmentSystem.tsx
 * Équipement du dépanneur: café, slurpee, ATM, hotdog, caisse, loterie, cigarettes
 */

import { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Vec3 = [number, number, number]

// ─────────────────────────────────────────────
// COFFEE STATION
// ─────────────────────────────────────────────

export const CoffeeStation = memo(function CoffeeStation({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Counter body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.4, 1.0, 0.8]} />
        <meshStandardMaterial color="#3a3028" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[2.5, 0.04, 0.85]} />
        <meshStandardMaterial color="#888078" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Coffee machines */}
      {[-0.7, 0, 0.7].map((xOff, i) => (
        <group key={`coffee-${i}`} position={[xOff, 1.05, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.55, 0.4]} />
            <meshStandardMaterial
              color={['#222222', '#1a1a2a', '#2a1a1a'][i]}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, -0.2, 0.22]}>
            <cylinderGeometry args={[0.03, 0.04, 0.08, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.15, 0.21]}>
            <boxGeometry args={[0.2, 0.06, 0.005]} />
            <meshStandardMaterial color="#00cc00" emissive="#00cc00" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0.05, 0.21]}>
            <boxGeometry args={[0.3, 0.08, 0.003]} />
            <meshStandardMaterial color="#cc8800" emissive="#cc8800" emissiveIntensity={0.1} />
          </mesh>
        </group>
      ))}

      {/* Cup dispenser */}
      <mesh position={[1.4, 1.35, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.35, 8]} />
        <meshStandardMaterial color="#dddddd" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[1.4, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 8]} />
        <meshStandardMaterial color="#f5f0e5" roughness={0.8} />
      </mesh>

      {/* Lid dispenser */}
      <mesh position={[-1.3, 1.2, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.2]} />
        <meshStandardMaterial color="#dddddd" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Stirrers */}
      <mesh position={[-1.3, 1.08, 0.15]}>
        <boxGeometry args={[0.08, 0.08, 0.06]} />
        <meshStandardMaterial color="#8b7355" roughness={0.9} />
      </mesh>

      {/* Condiments */}
      {[-0.4, -0.2, 0, 0.2].map((xOff, i) => (
        <mesh key={`cond-${i}`} position={[xOff, 1.08, -0.3]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 6]} />
          <meshStandardMaterial
            color={['#ffffff', '#f5e6c8', '#6b4423', '#dddddd'][i]}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  )
})

// ─────────────────────────────────────────────
// SLURPEE MACHINE
// ─────────────────────────────────────────────

export const SlurpeeMachine = memo(function SlurpeeMachine({ position }: { position: Vec3 }) {
  const bowl1 = useRef<THREE.Mesh>(null)
  const bowl2 = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.5
    if (bowl1.current) bowl1.current.rotation.y = t
    if (bowl2.current) bowl2.current.rotation.y = -t
  })

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.2, 1.6, 0.8]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.6} />
      </mesh>

      <mesh position={[0, 0.4, 0.41]}>
        <boxGeometry args={[1.1, 0.5, 0.02]} />
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.2} />
      </mesh>

      {/* Bowls */}
      {[
        { ref: bowl1, x: -0.3, color: '#ff4444', content: '#ff2222' },
        { ref: bowl2, x: 0.3, color: '#4444ff', content: '#2222ff' },
      ].map(({ ref, x, color, content }) => (
        <group key={`bowl-${x}`} position={[x, 0.5, 0]}>
          <mesh ref={ref}>
            <cylinderGeometry args={[0.18, 0.15, 0.5, 12]} />
            <meshPhysicalMaterial
              color={color}
              transmission={0.5}
              thickness={0.05}
              roughness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.16, 0.13, 0.35, 12]} />
            <meshStandardMaterial color={content} roughness={0.6} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Nozzles */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={`nozzle-${i}`} position={[x, -0.15, 0.35]}>
          <cylinderGeometry args={[0.025, 0.03, 0.12, 6]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Drip tray */}
      <mesh position={[0, -0.6, 0.3]}>
        <boxGeometry args={[0.8, 0.04, 0.2]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// ATM MACHINE
// ─────────────────────────────────────────────

export const ATMMachine = memo(function ATMMachine({ position }: { position: Vec3 }) {
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 1.6, 0.6]} />
        <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh position={[0, 0.1, 0.31]}>
        <boxGeometry args={[0.65, 1.4, 0.02]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh ref={screenRef} position={[0, 0.35, 0.33]}>
        <boxGeometry args={[0.4, 0.3, 0.01]} />
        <meshStandardMaterial color="#0044aa" emissive="#0066cc" emissiveIntensity={0.6} />
      </mesh>

      <mesh position={[0, 0.35, 0.325]}>
        <boxGeometry args={[0.44, 0.34, 0.01]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Keypad */}
      <mesh position={[0, -0.15, 0.33]}>
        <boxGeometry args={[0.25, 0.2, 0.02]} />
        <meshStandardMaterial color="#444455" metalness={0.6} roughness={0.3} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`atm-btn-${i}`}
          position={[-0.06 + (i % 3) * 0.06, -0.08 + Math.floor(i / 3) * -0.04, 0.345]}
        >
          <boxGeometry args={[0.04, 0.025, 0.008]} />
          <meshStandardMaterial color="#555566" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Card slot */}
      <mesh position={[0, -0.4, 0.33]}>
        <boxGeometry args={[0.12, 0.005, 0.02]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      <mesh position={[0.08, -0.4, 0.34]}>
        <sphereGeometry args={[0.006, 6, 6]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>

      {/* Cash dispenser */}
      <mesh position={[0, -0.55, 0.33]}>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Receipt */}
      <mesh position={[0.2, -0.3, 0.33]}>
        <boxGeometry args={[0.06, 0.04, 0.02]} />
        <meshStandardMaterial color="#222222" roughness={0.7} />
      </mesh>

      {/* Bank logo */}
      <mesh position={[0, 0.6, 0.33]}>
        <boxGeometry args={[0.3, 0.08, 0.005]} />
        <meshStandardMaterial color="#006600" emissive="#008800" emissiveIntensity={0.2} />
      </mesh>

      <pointLight position={[0, 0.35, 0.5]} intensity={0.2} color="#0066cc" distance={1.5} decay={2} />
    </group>
  )
})

// ─────────────────────────────────────────────
// HOT DOG ROLLER
// ─────────────────────────────────────────────

export const HotDogRoller = memo(function HotDogRoller({ position }: { position: Vec3 }) {
  const rollersRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (rollersRef.current) {
      rollersRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.z = state.clock.elapsedTime * 1.5 + i * 0.2
        }
      })
    }
  })

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.35, 0.55]} />
        <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Glass shield */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.88, 0.2, 0.53]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.8}
          thickness={0.02}
          roughness={0.05}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Rollers */}
      <group ref={rollersRef}>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={`r-${i}`} position={[-0.3 + i * 0.1, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Hot dogs */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`hd-${i}`} position={[-0.25 + i * 0.12, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.35, 6]} />
          <meshStandardMaterial color="#c47030" roughness={0.7} />
        </mesh>
      ))}

      <pointLight position={[0, 0.15, 0]} intensity={0.3} color="#ff8844" distance={1.5} decay={2} />

      <mesh position={[0.35, 0.12, 0.28]}>
        <boxGeometry args={[0.12, 0.04, 0.005]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// CASH REGISTER
// ─────────────────────────────────────────────

export const CashRegister = memo(function CashRegister({ position }: { position: Vec3 }) {
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.12, 0.35]} />
        <meshStandardMaterial color="#222233" metalness={0.5} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.2, -0.1]}>
        <boxGeometry args={[0.05, 0.28, 0.05]} />
        <meshStandardMaterial color="#333344" metalness={0.6} roughness={0.3} />
      </mesh>

      <mesh ref={screenRef} position={[0, 0.38, -0.08]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.35, 0.25, 0.02]} />
        <meshStandardMaterial color="#003366" emissive="#0055aa" emissiveIntensity={0.5} />
      </mesh>

      <mesh position={[0, 0.38, -0.09]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.38, 0.28, 0.015]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </mesh>

      <mesh position={[0, 0.07, 0.08]}>
        <boxGeometry args={[0.3, 0.02, 0.15]} />
        <meshStandardMaterial color="#444455" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Scanner */}
      <mesh position={[0.25, 0.1, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.15]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0.25, 0.06, 0.08]}>
        <boxGeometry args={[0.05, 0.005, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>

      {/* Cash drawer */}
      <mesh position={[0, -0.08, 0.05]}>
        <boxGeometry args={[0.38, 0.06, 0.32]} />
        <meshStandardMaterial color="#333344" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// LOTTERY DISPLAY
// ─────────────────────────────────────────────

export const LotteryDisplay = memo(function LotteryDisplay({ position }: { position: Vec3 }) {
  const ledRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2
    }
  })

  const TICKET_COLORS = [
    '#ff4444', '#44ff44', '#ffaa00', '#4444ff',
    '#ff44ff', '#44ffff', '#ffff44', '#ff8844',
  ]

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.6, 0.12]} />
        <meshStandardMaterial color="#222233" roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[0.75, 0.55, 0.01]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.85}
          thickness={0.01}
          roughness={0.05}
          transparent
          opacity={0.9}
        />
      </mesh>

      {TICKET_COLORS.map((color, i) => (
        <mesh
          key={`ticket-${i}`}
          position={[-0.28 + (i % 4) * 0.18, 0.12 - Math.floor(i / 4) * 0.22, 0.03]}
        >
          <boxGeometry args={[0.15, 0.08, 0.005]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}

      <mesh ref={ledRef} position={[0, 0.35, 0.07]}>
        <boxGeometry args={[0.6, 0.06, 0.005]} />
        <meshStandardMaterial color="#0066ff" emissive="#0088ff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// CIGARETTE DISPLAY
// ─────────────────────────────────────────────

export const CigaretteDisplay = memo(function CigaretteDisplay({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[2.5, 1.8, 0.25]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
      </mesh>

      <mesh position={[0, 0, 0.13]}>
        <boxGeometry args={[2.45, 1.75, 0.02]} />
        <meshStandardMaterial color="#333344" roughness={0.4} metalness={0.5} />
      </mesh>

      {Array.from({ length: 5 }).map((_, col) =>
        Array.from({ length: 4 }).map((_, row) => (
          <mesh key={`cig-${col}-${row}`} position={[-0.9 + col * 0.45, 0.55 - row * 0.4, 0.05]}>
            <boxGeometry args={[0.38, 0.3, 0.12]} />
            <meshStandardMaterial
              color={`hsl(${(col * 50 + row * 30) % 360}, 20%, ${25 + row * 5}%)`}
              roughness={0.7}
            />
          </mesh>
        ))
      )}

      <mesh position={[0, 0.95, 0.15]}>
        <boxGeometry args={[1.5, 0.06, 0.005]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// SYSTEM EXPORT
// ─────────────────────────────────────────────

export const EquipmentSystem = memo(function EquipmentSystem() {
  return (
    <>
      <CoffeeStation position={[-5.5, 0, 3]} />
      <SlurpeeMachine position={[-5.5, 0.8, -2]} />
      <ATMMachine position={[5.8, 0, 4]} />
      <HotDogRoller position={[2.5, 1.16, 4.5]} />
      <CigaretteDisplay position={[0, 3.5, 3.5]} />
    </>
  )
})