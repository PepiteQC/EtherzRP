'use client'

import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Plane, PositionalAudio } from '@react-three/drei'
import * as THREE from 'three'
import type { RoomBase } from '../../../shared/types'

// 1. On récupère exactement tes variables SCSS
const palette = {
  bg1: 'hsl(250, 28%, 11%)',
  bg2: '#161426', 
  white1: '#FBFAFE',
  white2: '#9E99C1',
  white3: '#383358',
  white4: '#282347',
  black1: '#1f2158',
  black2: '#12143a',
  black3: '#080a22',
  neon1: 'hsl(220, 95%, 65%)', // Bleu Néon
  neon2: 'hsl(210, 68%, 49%)', // Bleu Foncé Néon
  cuadro1: '#D51E24', // Rouge
  cuadro2: '#0F1110', // Sombre
}

interface JarlanRoomProps {
  room: RoomBase
}

// 2. Le composant R3F
export const HotelRoomNeonJarlan = memo(function HotelRoomNeonJarlan({ room }: JarlanRoomProps) {
  const tvLightRef = useRef<THREE.PointLight>(null)

  // Effet de scintillement pour l'écran TV (animation "pantalla-tv" de ton CSS)
  useFrame(({ clock }) => {
    if (tvLightRef.current) {
      tvLightRef.current.intensity = 0.5 + Math.sin(clock.elapsedTime * 10) * 0.1
    }
  })

  return (
    <group userData={{ type: 'hotel_room_jarlan', roomId: room?.id }}>
      {/* --- ÉCLAIRAGE (H-Lights de ton design) --- */}
      <ambientLight intensity={0.4} color={palette.neon1} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow color={palette.white1} />
      {/* Lumière Néon d'ambiance bas de scène */}
      <pointLight position={[-2, 1, 2]} color={palette.neon1} intensity={2} distance={8} />
      
      {/* --- MURS & SOL (alt, alb, arb, blt, blb) --- */}
      {/* Sol */}
      <Box args={[6, 0.2, 6]} position={[0, -0.1, 0]} receiveShadow>
        <meshStandardMaterial color={palette.white3} roughness={0.8} />
      </Box>
      {/* Mur Gauche */}
      <Box args={[0.2, 4, 6]} position={[-3.1, 2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={palette.white2} roughness={0.9} />
      </Box>
      {/* Mur Arrière */}
      <Box args={[6, 4, 0.2]} position={[0, 2, -3.1]} receiveShadow castShadow>
        <meshStandardMaterial color={palette.white3} roughness={0.9} />
      </Box>

      {/* --- PORTE (puerta) --- */}
      <group position={[-1.5, 1.5, -3]}>
        <Box args={[1.6, 3, 0.3]} castShadow>
          <meshStandardMaterial color={palette.black2} metalness={0.5} />
        </Box>
        {/* Numpad/Keycard Reader sur la porte */}
        <Box args={[0.2, 0.4, 0.05]} position={[0.6, 0, 0.16]}>
          <meshStandardMaterial color={palette.black3} emissive={palette.neon1} emissiveIntensity={0.5} />
        </Box>
      </group>

      {/* --- TABLE & TV (mesa-c, tv) --- */}
      <group position={[-2, 0.6, 1.5]}>
        {/* Table */}
        <Box args={[1.5, 0.2, 2.5]} castShadow receiveShadow>
          <meshStandardMaterial color={palette.black2} roughness={0.4} />
        </Box>
        <Box args={[0.2, 1, 0.2]} position={[-0.5, -0.6, -1]} castShadow>
          <meshStandardMaterial color={palette.black3} />
        </Box>
        <Box args={[0.2, 1, 0.2]} position={[0.5, -0.6, -1]} castShadow>
          <meshStandardMaterial color={palette.black3} />
        </Box>
        
        {/* TV Écran */}
        <Box args={[0.2, 1.8, 2.2]} position={[-0.5, 1, 0]} castShadow>
          <meshStandardMaterial color="#000" />
        </Box>
        {/* L'écran lumineux lui-même */}
        <Plane args={[1.8, 2]} position={[-0.39, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
          <meshBasicMaterial color={palette.neon1} />
        </Plane>
        {/* Lumière TV */}
        <pointLight ref={tvLightRef} position={[0, 1, 0]} color={palette.neon1} distance={4} />
      </group>

      {/* --- CANAPÉ / SILLON (sillon-c, sillon-b) --- */}
      <group position={[1.5, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Assise */}
        <Box args={[2.5, 0.5, 1.2]} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={palette.black3} roughness={0.9} />
        </Box>
        {/* Dossier */}
        <Box args={[2.5, 1, 0.4]} position={[0, 0.75, -0.4]} castShadow receiveShadow>
          <meshStandardMaterial color={palette.black2} roughness={0.9} />
        </Box>
        {/* Accoudoirs */}
        <Box args={[0.4, 0.8, 1.2]} position={[-1.45, 0.3, 0]} castShadow>
          <meshStandardMaterial color={palette.black1} />
        </Box>
        <Box args={[0.4, 0.8, 1.2]} position={[1.45, 0.3, 0]} castShadow>
          <meshStandardMaterial color={palette.black1} />
        </Box>
      </group>

      {/* --- DÉCORATION (cuadro-l, cuadro-r, repisas) --- */}
      {/* Tableau Rouge */}
      <Plane args={[1.5, 2]} position={[-3, 2, -1.5]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color={palette.cuadro1} emissive={palette.cuadro1} emissiveIntensity={0.2} />
      </Plane>
      {/* Tableau Noir */}
      <Plane args={[1.5, 2]} position={[1.5, 2, -3]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={palette.cuadro2} metalness={0.8} roughness={0.2} />
      </Plane>
    </group>
  )
})