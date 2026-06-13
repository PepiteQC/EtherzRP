/**
 * HotelNPC3D.tsx
 * NPCs ultra-détaillés: réceptionniste, clients, staff, concierge
 */

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Vec3 = [number, number, number]

// ─────────────────────────────────────────────
// BASE NPC
// ─────────────────────────────────────────────

interface NPCAppearance {
  skinColor:   string
  hairColor:   string
  topColor:    string
  bottomColor: string
  shoeColor:   string
  height:      number
}

function useNPCAppearance(seed: string): NPCAppearance {
  return useMemo(() => {
    const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const skins  = ['#f5d5b0', '#d4a574', '#8b5e3c', '#f0c080', '#c8956a']
    const hairs  = ['#1a0a00', '#8b6914', '#cc4422', '#2a2a2a', '#c8c8c8', '#f5e0a0']
    const tops   = ['#cc0000', '#002244', '#2a5a2a', '#442200', '#1a1a4a', '#4a1a1a']
    const bots   = ['#222233', '#1a2a1a', '#1a1a1a', '#2a2a3a', '#1a0a00', '#3a3a2a']

    return {
      skinColor:   skins[hash % skins.length],
      hairColor:   hairs[(hash * 3) % hairs.length],
      topColor:    tops[(hash * 7) % tops.length],
      bottomColor: bots[(hash * 11) % bots.length],
      shoeColor:   '#1a1a1a',
      height:      1.55 + (hash % 20) * 0.01,
    }
  }, [seed])
}

// ─────────────────────────────────────────────
// RECEPTIONIST
// ─────────────────────────────────────────────

interface ReceptionistProps {
  position:  Vec3
  name?:     string
  isTyping?: boolean
  onTalk?:   () => void
}

export const HotelReceptionist = memo(function HotelReceptionist({
  position,
  name = 'Sophie',
  isTyping = true,
  onTalk,
}: ReceptionistProps) {
  const app    = useNPCAppearance(name)
  const armRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Group>(null)
  const eyeL   = useRef<THREE.Mesh>(null)
  const eyeR   = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Bras qui tape au clavier
    if (armRef.current && isTyping) {
      armRef.current.rotation.x = Math.sin(t * 4) * 0.15 - 0.3
    }

    // Tête qui bouge légèrement
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5) * 0.15
      headRef.current.position.y = Math.sin(t * 0.8) * 0.005
    }

    // Clignement des yeux
    if (eyeL.current && eyeR.current) {
      const blink = Math.sin(t * 0.6)
      const scale = blink > 0.97 ? 0.1 : 1
      eyeL.current.scale.y = scale
      eyeR.current.scale.y = scale
    }
  })

  const s = app.height / 1.7

  return (
    <group position={position} onClick={onTalk}>
      {/* Jambes */}
      {[-0.1 * s, 0.1 * s].map((x, i) => (
        <mesh key={i} position={[x, 0.22 * s, 0]} castShadow>
          <boxGeometry args={[0.18 * s, 0.44 * s, 0.2 * s]} />
          <meshStandardMaterial color={app.bottomColor} roughness={0.8} />
        </mesh>
      ))}

      {/* Chaussures */}
      {[-0.1 * s, 0.1 * s].map((x, i) => (
        <mesh key={i} position={[x, 0.04 * s, 0.03 * s]}>
          <boxGeometry args={[0.17 * s, 0.08 * s, 0.26 * s]} />
          <meshStandardMaterial color={app.shoeColor} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}

      {/* Corps (uniforme) */}
      <mesh position={[0, 0.75 * s, 0]} castShadow>
        <boxGeometry args={[0.46 * s, 0.62 * s, 0.27 * s]} />
        <meshStandardMaterial color={app.topColor} roughness={0.8} />
      </mesh>

      {/* Col blanc */}
      <mesh position={[0, 1.01 * s, 0.12 * s]}>
        <boxGeometry args={[0.18 * s, 0.08 * s, 0.04 * s]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      {/* Badge employé */}
      <mesh position={[-0.18 * s, 0.82 * s, 0.14 * s]}>
        <boxGeometry args={[0.1 * s, 0.07 * s, 0.01 * s]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.6} />
      </mesh>

      {/* Bras */}
      <mesh position={[-0.29 * s, 0.75 * s, 0]} castShadow>
        <boxGeometry args={[0.14 * s, 0.58 * s, 0.2 * s]} />
        <meshStandardMaterial color={app.topColor} roughness={0.8} />
      </mesh>
      <mesh ref={armRef} position={[0.29 * s, 0.75 * s, 0]} castShadow>
        <boxGeometry args={[0.14 * s, 0.58 * s, 0.2 * s]} />
        <meshStandardMaterial color={app.topColor} roughness={0.8} />
      </mesh>

      {/* Cou */}
      <mesh position={[0, 1.09 * s, 0]}>
        <cylinderGeometry args={[0.06 * s, 0.07 * s, 0.1 * s, 8]} />
        <meshStandardMaterial color={app.skinColor} roughness={0.8} />
      </mesh>

      {/* Tête */}
      <group ref={headRef} position={[0, 1.22 * s, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.34 * s, 0.36 * s, 0.32 * s]} />
          <meshStandardMaterial color={app.skinColor} roughness={0.8} />
        </mesh>

        {/* Cheveux */}
        <mesh position={[0, 0.19 * s, -0.02 * s]}>
          <boxGeometry args={[0.36 * s, 0.12 * s, 0.34 * s]} />
          <meshStandardMaterial color={app.hairColor} roughness={0.9} />
        </mesh>

        {/* Yeux */}
        <mesh ref={eyeL} position={[-0.09 * s, 0.04 * s, 0.165 * s]}>
          <sphereGeometry args={[0.035 * s, 8, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh ref={eyeR} position={[0.09 * s, 0.04 * s, 0.165 * s]}>
          <sphereGeometry args={[0.035 * s, 8, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>

        {/* Iris */}
        {[[-0.09, 0.04], [0.09, 0.04]].map(([ex, ey], i) => (
          <mesh key={i} position={[ex * s, ey * s, 0.175 * s]}>
            <sphereGeometry args={[0.018 * s, 6, 6]} />
            <meshStandardMaterial color="#4a3a2a" />
          </mesh>
        ))}

        {/* Sourire */}
        <mesh position={[0, -0.06 * s, 0.165 * s]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.12 * s, 0.01 * s, 0.005 * s]} />
          <meshStandardMaterial color="#cc8888" roughness={0.8} />
        </mesh>

        {/* Bulle dialogue */}
        {onTalk && (
          <mesh position={[0.3 * s, 0.3 * s, 0]}>
            <sphereGeometry args={[0.1 * s, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#aaddff" emissiveIntensity={0.3} transparent opacity={0.85} />
          </mesh>
        )}
      </group>
    </group>
  )
})

// ─────────────────────────────────────────────
// HOTEL GUEST
// ─────────────────────────────────────────────

interface GuestProps {
  position:   Vec3
  name:       string
  isWalking?: boolean
  hasBaggage?: boolean
  targetPos?: Vec3
}

export const HotelGuest = memo(function HotelGuest({
  position, name, isWalking = false, hasBaggage = false,
}: GuestProps) {
  const app     = useNPCAppearance(name)
  const groupRef = useRef<THREE.Group>(null)
  const walkRef  = useRef(0)
  const legLRef  = useRef<THREE.Mesh>(null)
  const legRRef  = useRef<THREE.Mesh>(null)
  const armLRef  = useRef<THREE.Mesh>(null)
  const armRRef  = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (isWalking) walkRef.current += dt * 3

    if (legLRef.current) legLRef.current.rotation.x = isWalking ? Math.sin(walkRef.current) * 0.35 : 0
    if (legRRef.current) legRRef.current.rotation.x = isWalking ? -Math.sin(walkRef.current) * 0.35 : 0
    if (armLRef.current) armLRef.current.rotation.x = isWalking ? -Math.sin(walkRef.current) * 0.25 : 0
    if (armRRef.current) armRRef.current.rotation.x = isWalking ? Math.sin(walkRef.current) * 0.25 : 0
  })

  const s = app.height / 1.7

  return (
    <group ref={groupRef} position={position}>
      {/* Jambes */}
      <mesh ref={legLRef} position={[-0.1 * s, 0.22 * s, 0]} castShadow>
        <boxGeometry args={[0.17 * s, 0.44 * s, 0.2 * s]} />
        <meshStandardMaterial color={app.bottomColor} roughness={0.8} />
      </mesh>
      <mesh ref={legRRef} position={[0.1 * s, 0.22 * s, 0]} castShadow>
        <boxGeometry args={[0.17 * s, 0.44 * s, 0.2 * s]} />
        <meshStandardMaterial color={app.bottomColor} roughness={0.8} />
      </mesh>

      {/* Chaussures */}
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={i} position={[x * s, 0.04 * s, 0.03 * s]}>
          <boxGeometry args={[0.16 * s, 0.08 * s, 0.25 * s]} />
          <meshStandardMaterial color={app.shoeColor} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}

      {/* Corps */}
      <mesh position={[0, 0.75 * s, 0]} castShadow>
        <boxGeometry args={[0.44 * s, 0.6 * s, 0.26 * s]} />
        <meshStandardMaterial color={app.topColor} roughness={0.8} />
      </mesh>

      {/* Bras */}
      <mesh ref={armLRef} position={[-0.28 * s, 0.75 * s, 0]} castShadow>
        <boxGeometry args={[0.13 * s, 0.56 * s, 0.19 * s]} />
        <meshStandardMaterial color={app.topColor} roughness={0.8} />
      </mesh>
      <mesh ref={armRRef} position={[0.28 * s, 0.75 * s, 0]} castShadow>
        <boxGeometry args={[0.13 * s, 0.56 * s, 0.19 * s]} />
        <meshStandardMaterial color={app.topColor} roughness={0.8} />
      </mesh>

      {/* Tête */}
      <mesh position={[0, 1.22 * s, 0]} castShadow>
        <boxGeometry args={[0.33 * s, 0.35 * s, 0.31 * s]} />
        <meshStandardMaterial color={app.skinColor} roughness={0.8} />
      </mesh>
      {/* Cheveux */}
      <mesh position={[0, 1.38 * s, -0.01 * s]}>
        <boxGeometry args={[0.35 * s, 0.12 * s, 0.33 * s]} />
        <meshStandardMaterial color={app.hairColor} roughness={0.9} />
      </mesh>
      {/* Yeux */}
      {[-0.09, 0.09].map((ex, i) => (
        <mesh key={i} position={[ex * s, 1.26 * s, 0.16 * s]}>
          <sphereGeometry args={[0.032 * s, 6, 6]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      ))}

      {/* Valise */}
      {hasBaggage && (
        <group position={[0.42 * s, 0.35 * s, 0]}>
          {/* Corps valise */}
          <mesh castShadow>
            <boxGeometry args={[0.35 * s, 0.45 * s, 0.18 * s]} />
            <meshStandardMaterial color="#cc2244" roughness={0.5} metalness={0.2} />
          </mesh>
          {/* Poignée */}
          <mesh position={[0, 0.28 * s, 0]}>
            <boxGeometry args={[0.12 * s, 0.03 * s, 0.06 * s]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Roulettes */}
          {[[-0.08, -0.08], [0.08, -0.08]].map(([wx, wz], i) => (
            <mesh key={i} position={[wx * s, -0.24 * s, 0]}>
              <cylinderGeometry args={[0.025 * s, 0.025 * s, 0.04 * s, 8]} />
              <meshStandardMaterial color="#333333" roughness={0.6} />
            </mesh>
          ))}
          {/* Zip horizontal */}
          <mesh position={[0, 0, 0.09 * s]}>
            <boxGeometry args={[0.33 * s, 0.01 * s, 0.01 * s]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  )
})

// ─────────────────────────────────────────────
// CONCIERGE
// ─────────────────────────────────────────────

export const HotelConcierge = memo(function HotelConcierge({
  position,
}: {
  position: Vec3
}) {
  const app = useNPCAppearance('concierge')

  return (
    <group position={position}>
      {/* Réutilise base HotelReceptionist avec uniforme différent */}
      <HotelReceptionist
        position={[0, 0, 0]}
        name="Pierre"
        isTyping={false}
      />
      {/* Chapeau concierge (distinctive) */}
      <group position={[0, 1.48, 0]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.22, 0.08, 10]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.15, 0.18, 0.12, 10]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Bande dorée */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.205, 0.205, 0.02, 10]} />
          <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  )
})

// ─────────────────────────────────────────────
// BELLHOP (Groom)
// ─────────────────────────────────────────────

export const HotelBellhop = memo(function HotelBellhop({
  position,
  hasTrolley = false,
}: {
  position:    Vec3
  hasTrolley?: boolean
}) {
  const app      = useNPCAppearance('bellhop')
  const trolleyRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (trolleyRef.current) {
      trolleyRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
  })

  return (
    <group position={position}>
      <HotelReceptionist position={[0, 0, 0]} name="Marc" isTyping={false} />

      {/* Chariot à bagages */}
      {hasTrolley && (
        <group ref={trolleyRef} position={[0.8, 0, 0]}>
          {/* Châssis */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.6, 0.04, 0.4]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Étagère basse */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.58, 0.03, 0.38]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Montants */}
          {[[-0.27, -0.17], [0.27, -0.17], [-0.27, 0.17], [0.27, 0.17]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.6, z]}>
              <cylinderGeometry args={[0.015, 0.015, 1.2, 6]} />
              <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* Barre sup */}
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.58, 0.03, 0.02]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Poignée */}
          <mesh position={[0, 1.2, -0.22]}>
            <boxGeometry args={[0.5, 0.03, 0.04]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Roulettes */}
          {[[-0.25, -0.15], [0.25, -0.15], [-0.25, 0.15], [0.25, 0.15]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.04, z]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#222222" roughness={0.6} />
            </mesh>
          ))}
          {/* Valises sur le chariot */}
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[0.4, 0.3, 0.25]} />
            <meshStandardMaterial color="#cc4422" roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.96, 0]} castShadow>
            <boxGeometry args={[0.35, 0.28, 0.22]} />
            <meshStandardMaterial color="#2244cc" roughness={0.5} metalness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  )
})