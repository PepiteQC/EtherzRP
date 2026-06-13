/**
 * RadioSystem.tsx
 * Radio du dépanneur — stations, volume, contrôle
 * (Simulation — pas de vrai audio stream pour éviter coûts)
 */

import { useRef, useState, useCallback, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { RadioStation } from '../types'

// ─────────────────────────────────────────────
// STATIONS
// ─────────────────────────────────────────────

const STATIONS: RadioStation[] = [
  { id: 'rythme',  name: 'Rythme FM 105.7',  genre: 'Pop/Adulte',    isOn: true,  volume: 0.4 },
  { id: 'rouge',   name: 'Rouge FM 97.1',     genre: 'Country/Pop',   isOn: false, volume: 0.4 },
  { id: 'cjmf',    name: 'CJMF 93.3',         genre: 'Classique rock', isOn: false, volume: 0.4 },
  { id: 'energie', name: 'Énergie 94.3',       genre: 'Dance/Électro',  isOn: false, volume: 0.4 },
  { id: 'noel',    name: 'Noël FM 100.3',      genre: 'Noël',          isOn: false, volume: 0.4 },
]

// ─────────────────────────────────────────────
// RADIO VISUAL (transistor radio sur le comptoir)
// ─────────────────────────────────────────────

interface RadioSystemProps {
  position:   [number, number, number]
  onStation?: (station: RadioStation) => void
}

export const RadioSystem = memo(function RadioSystem({
  position,
  onStation,
}: RadioSystemProps) {
  const [currentStation, setCurrentStation] = useState(0)
  const [isOn, setIsOn] = useState(true)
  const antennaRef = useRef<THREE.Mesh>(null)
  const displayRef = useRef<THREE.Mesh>(null)

  // Antenne qui vibre légèrement
  useFrame((state) => {
    if (antennaRef.current && isOn) {
      antennaRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 8) * 0.01
    }
    if (displayRef.current) {
      const mat = displayRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isOn
        ? 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.05
        : 0
    }
  })

  const nextStation = useCallback(() => {
    const next = (currentStation + 1) % STATIONS.length
    setCurrentStation(next)
    onStation?.(STATIONS[next])
  }, [currentStation, onStation])

  const togglePower = useCallback(() => {
    setIsOn(prev => !prev)
  }, [])

  const activeStation = STATIONS[currentStation]

  return (
    <group position={position}>
      {/* Boîtier radio */}
      <mesh castShadow onClick={togglePower}>
        <boxGeometry args={[0.35, 0.18, 0.2]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Haut-parleur grille */}
      <mesh position={[-0.1, 0, 0.101]}>
        <boxGeometry args={[0.1, 0.12, 0.005]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      {/* Display LCD */}
      <mesh ref={displayRef} position={[0.05, 0.02, 0.101]}>
        <boxGeometry args={[0.14, 0.06, 0.005]} />
        <meshStandardMaterial
          color={isOn ? '#00cc00' : '#001100'}
          emissive={isOn ? '#00cc00' : '#000000'}
          emissiveIntensity={isOn ? 0.4 : 0}
        />
      </mesh>

      {/* Boutons */}
      <mesh position={[0.14, -0.04, 0.101]} onClick={nextStation}>
        <boxGeometry args={[0.04, 0.03, 0.005]} />
        <meshStandardMaterial color="#555566" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Antenne */}
      <mesh
        ref={antennaRef}
        position={[0.15, 0.18, 0]}
        rotation={[0, 0, 0.15]}
      >
        <cylinderGeometry args={[0.003, 0.005, 0.3, 4]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Lumière émise si allumée */}
      {isOn && (
        <pointLight
          position={[0, 0, 0.2]}
          intensity={0.05}
          color="#00cc00"
          distance={1}
          decay={2}
        />
      )}
    </group>
  )
})