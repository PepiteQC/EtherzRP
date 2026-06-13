'use client'

import { useMemo } from 'react'
import { Box, Cylinder, Sphere } from '@react-three/drei'

interface CharacterProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  type?: 'homer' | 'police'
}

export function HomerModel({ position = [0, 0, 0], rotation = [0, 0, 0], type = 'homer' }: CharacterProps) {
  const colors = {
    skin: '#FFD90F',
    muzzle: '#D1B271',
    eyes: '#FFFFFF',
    shirt: '#FFFFFF',
    pants: '#4F76DF',
    shoes: '#111111',
    belt: '#1A1A1A',
    badge: '#E6B325',
    policeBlue: '#001A33',
  }

  const isPolice = type === 'police'
  const shirtColor = isPolice ? colors.policeBlue : colors.shirt
  const pantsColor = isPolice ? colors.policeBlue : colors.pants

  return (
    <group position={position} rotation={rotation}>
      {/* Feet & Legs */}
      <group position={[0, 0, 0]}>
        <Box args={[0.35, 0.2, 0.5]} position={[-0.2, 0.1, 0.1]}>
          <meshStandardMaterial color={colors.shoes} flatShading />
        </Box>
        <Box args={[0.35, 0.2, 0.5]} position={[0.2, 0.1, 0.1]}>
          <meshStandardMaterial color={colors.shoes} flatShading />
        </Box>
        <Box args={[0.3, 0.9, 0.3]} position={[-0.2, 0.55, 0]}>
          <meshStandardMaterial color={pantsColor} flatShading />
        </Box>
        <Box args={[0.3, 0.9, 0.3]} position={[0.2, 0.55, 0]}>
          <meshStandardMaterial color={pantsColor} flatShading />
        </Box>
      </group>

      {/* Torso */}
      <group position={[0, 1.4, 0]}>
        <Sphere args={[0.5, 8, 8]} position={[0, -0.1, 0]} scale={[1, 1.2, 0.8]}>
          <meshStandardMaterial color={shirtColor} flatShading />
        </Sphere>
        <Box args={[0.8, 0.8, 0.5]} position={[0, 0.2, 0]}>
          <meshStandardMaterial color={shirtColor} flatShading />
        </Box>
      </group>

      {/* Arms */}
      <group position={[0, 1.8, 0]}>
        <group position={[-0.5, -0.2, 0]} rotation={[0, 0, 0.2]}>
          <Box args={[0.22, 0.4, 0.22]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color={shirtColor} flatShading />
          </Box>
          <Box args={[0.2, 0.5, 0.2]} position={[0, -0.3, 0]}>
            <meshStandardMaterial color={colors.skin} flatShading />
          </Box>
        </group>
        <group position={[0.5, -0.2, 0]} rotation={[0, 0, -0.2]}>
          <Box args={[0.22, 0.4, 0.22]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color={shirtColor} flatShading />
          </Box>
          <Box args={[0.2, 0.5, 0.2]} position={[0, -0.3, 0]}>
            <meshStandardMaterial color={colors.skin} flatShading />
          </Box>
        </group>
      </group>

      {/* Head */}
      <group position={[0, 2.2, 0]}>
        <Sphere args={[0.35, 8, 8]} position={[0, 0.2, 0]} scale={[1, 1.5, 1]}>
          <meshStandardMaterial color={colors.skin} flatShading />
        </Sphere>
        <Sphere args={[0.28, 8, 8]} position={[0, 0.05, 0.15]} scale={[1, 0.8, 1.1]}>
          <meshStandardMaterial color={colors.muzzle} flatShading />
        </Sphere>
        {/* Eyes */}
        <Sphere args={[0.15, 8, 8]} position={[-0.15, 0.4, 0.25]}>
          <meshStandardMaterial color={colors.eyes} flatShading />
        </Sphere>
        <Sphere args={[0.15, 8, 8]} position={[0.15, 0.4, 0.25]}>
          <meshStandardMaterial color={colors.eyes} flatShading />
        </Sphere>
        {/* Pupils */}
        <Sphere args={[0.02, 4, 4]} position={[-0.15, 0.4, 0.39]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        <Sphere args={[0.02, 4, 4]} position={[0.15, 0.4, 0.39]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        {/* Hair strands */}
        <Box args={[0.02, 0.1, 0.1]} position={[-0.36, 0.3, 0]} rotation={[0, 0, 0.5]}>
          <meshStandardMaterial color="#000000" />
        </Box>
        <Box args={[0.02, 0.1, 0.1]} position={[-0.36, 0.4, 0]} rotation={[0, 0, 0.5]}>
          <meshStandardMaterial color="#000000" />
        </Box>

        {/* Police hat */}
        {isPolice && (
          <group position={[0, 0.7, 0]}>
            <Cylinder args={[0.45, 0.4, 0.2, 8]} position={[0, 0, 0]}>
              <meshStandardMaterial color={colors.policeBlue} flatShading />
            </Cylinder>
            <Box args={[0.6, 0.05, 0.3]} position={[0, -0.08, 0.2]} rotation={[0.2, 0, 0]}>
              <meshStandardMaterial color="#111111" flatShading />
            </Box>
            <Box args={[0.1, 0.1, 0.02]} position={[0, 0, 0.41]}>
              <meshStandardMaterial color={colors.badge} flatShading />
            </Box>
          </group>
        )}
      </group>

      {/* Police belt & badge */}
      {isPolice && (
        <group position={[0, 1, 0]}>
          <Box args={[0.85, 0.1, 0.55]} position={[0, -0.1, 0]}>
            <meshStandardMaterial color={colors.belt} flatShading />
          </Box>
          <Box args={[0.1, 0.2, 0.08]} position={[-0.3, -0.1, 0.2]}>
            <meshStandardMaterial color="#222222" flatShading />
          </Box>
          <Box args={[0.15, 0.18, 0.05]} position={[0.2, 0.8, 0.26]}>
            <meshStandardMaterial color={colors.badge} flatShading />
          </Box>
        </group>
      )}
    </group>
  )
}

// Simple player avatar (alternative to Homer)
export function PlayerAvatar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.9, 12]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color="#f1c27d" roughness={0.9} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.45, 0.9, 0]} rotation={[0, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.12, 0.7, 8]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.8} />
      </mesh>
      <mesh position={[0.45, 0.9, 0]} rotation={[0, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.12, 0.7, 8]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.8} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.18, 0.35, 0]} rotation={[0.1, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.13, 0.7, 8]} />
        <meshStandardMaterial color="#1e2937" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, 0.35, 0]} rotation={[-0.1, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.13, 0.7, 8]} />
        <meshStandardMaterial color="#1e2937" roughness={0.9} />
      </mesh>
    </group>
  )
}

// Character component (alias)
export function Character({ position = [0, 0, 0], rotation = [0, 0, 0], type = 'homer' }: CharacterProps) {
  return <HomerModel position={position} rotation={rotation} type={type} />
}
