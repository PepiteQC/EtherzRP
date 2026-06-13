/**
 * Customer.tsx
 * NPC client — low-poly, couleurs variées, déplacement
 */

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { NPCState } from '../types'

// Couleurs de vêtements variées
const SHIRT_COLORS  = ['#3366cc', '#cc6633', '#228844', '#884488', '#ccaa22', '#336688']
const PANTS_COLORS  = ['#222233', '#1a3a1a', '#2a1a1a', '#1a2a3a', '#333322', '#2a2a2a']
const SKIN_COLORS   = ['#f5d5b0', '#d4a574', '#8b5e3c', '#f0c080', '#c8956a', '#fde8c8']

interface CustomerProps {
  npc: NPCState
}

export const Customer = memo(function Customer({ npc }: CustomerProps) {
  const walkRef = useRef(0)
  const groupRef = useRef<THREE.Group>(null)

  // Couleurs déterministes selon l'ID
  const colors = useMemo(() => {
    const hash = npc.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return {
      shirt: SHIRT_COLORS[hash % SHIRT_COLORS.length],
      pants: PANTS_COLORS[(hash * 3) % PANTS_COLORS.length],
      skin:  SKIN_COLORS[(hash * 7) % SKIN_COLORS.length],
    }
  }, [npc.id])

  const isWalking = npc.action === 'walking'

  // Animation marche
  useFrame((state, dt) => {
    if (isWalking) {
      walkRef.current += dt * 4
    }
    if (groupRef.current) {
      groupRef.current.position.set(...npc.position)
      groupRef.current.rotation.y = npc.rotation
    }
  })

  return (
    <group ref={groupRef}>
      {/* Corps */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.45, 0.85, 0.28]} />
        <meshStandardMaterial color={colors.shirt} roughness={0.8} />
      </mesh>

      {/* Tête */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.32]} />
        <meshStandardMaterial color={colors.skin} roughness={0.8} />
      </mesh>

      {/* Yeux */}
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 1.52, 0.17]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      ))}

      {/* Jambes animées */}
      {[-0.11, 0.11].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0.25, 0]}
          rotation={[
            isWalking ? Math.sin(walkRef.current + i * Math.PI) * 0.3 : 0,
            0, 0,
          ]}
          castShadow
        >
          <boxGeometry args={[0.18, 0.5, 0.22]} />
          <meshStandardMaterial color={colors.pants} roughness={0.8} />
        </mesh>
      ))}

      {/* Bras animés */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh
          key={i}
          position={[x, 0.85, 0]}
          rotation={[
            isWalking ? Math.sin(walkRef.current + (i + 1) * Math.PI) * 0.25 : 0,
            0, 0,
          ]}
          castShadow
        >
          <boxGeometry args={[0.13, 0.65, 0.18]} />
          <meshStandardMaterial color={colors.shirt} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
})