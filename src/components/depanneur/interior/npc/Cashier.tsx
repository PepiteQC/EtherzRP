/**
 * Cashier.tsx
 * NPC caissier — visuel 3D simple low-poly + dialogue
 */

import { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { NPCState } from '../types'

// ─────────────────────────────────────────────
// HEAD BOB UTILITY
// ─────────────────────────────────────────────

function useHeadBob(active: boolean, speed = 1.5, amp = 0.03) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current && active) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * speed) * amp
    }
  })
  return ref
}

// ─────────────────────────────────────────────
// CASHIER COMPONENT
// ─────────────────────────────────────────────

interface CashierProps {
  npc:       NPCState
  onTalkClick?: (npcId: string) => void
}

export const Cashier = memo(function Cashier({ npc, onTalkClick }: CashierProps) {
  const groupRef   = useRef<THREE.Group>(null)
  const headRef    = useHeadBob(npc.action === 'working')
  const armRef     = useRef<THREE.Mesh>(null)

  const isWorking = npc.action === 'working'
  const isTalking = npc.action === 'talking'

  // Bras qui bougent quand travaille
  useFrame((state) => {
    if (armRef.current && isWorking) {
      armRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  // Couleur selon mood
  const shirtColor = {
    neutral:    '#cc0000',  // rouge Couche-Tard
    happy:      '#cc3300',
    suspicious: '#886600',
    angry:      '#440000',
    busy:       '#cc0000',
  }[npc.mood]

  return (
    <group
      ref={groupRef}
      position={npc.position}
      rotation={[0, npc.rotation, 0]}
    >
      {/* Corps */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.3]} />
        <meshStandardMaterial color={shirtColor} roughness={0.8} />
      </mesh>

      {/* Tête */}
      <group ref={headRef} position={[0, 1.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.38, 0.35]} />
          <meshStandardMaterial color="#f5d5b0" roughness={0.8} />
        </mesh>

        {/* Yeux */}
        <mesh position={[-0.08, 0.05, 0.18]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0.08, 0.05, 0.18]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>

        {/* Badge employé */}
        <mesh position={[0, -0.3, 0.16]}>
          <boxGeometry args={[0.12, 0.08, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      </group>

      {/* Jambes */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.25]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
        </mesh>
      ))}

      {/* Bras */}
      <mesh ref={armRef} position={[0.32, 0.8, 0]} castShadow>
        <boxGeometry args={[0.14, 0.7, 0.2]} />
        <meshStandardMaterial color={shirtColor} roughness={0.8} />
      </mesh>
      <mesh position={[-0.32, 0.8, 0]} castShadow>
        <boxGeometry args={[0.14, 0.7, 0.2]} />
        <meshStandardMaterial color={shirtColor} roughness={0.8} />
      </mesh>

      {/* Bubble dialogue si disponible */}
      {npc.isAvailable && (
        <mesh
          position={[0, 2.1, 0]}
          onClick={() => onTalkClick?.(npc.id)}
        >
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#aaddff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* Suspicion indicator */}
      {npc.mood === 'suspicious' && (
        <mesh position={[0, 2.3, 0]}>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
          <meshStandardMaterial
            color="#ffaa00"
            emissive="#ffaa00"
            emissiveIntensity={1}
          />
        </mesh>
      )}
    </group>
  )
})