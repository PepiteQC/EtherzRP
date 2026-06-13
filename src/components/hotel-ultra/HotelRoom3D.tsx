/**
 * HotelRoom3D.tsx
 * Chambre d'hôtel ultra-détaillée — interactive, personnalisable
 * Supporte: standard, queen, king, suite, penthouse
 */

import {
  useRef, useState, useMemo, useCallback, memo, useEffect,
} from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import type { RoomType } from './HotelStore'

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const ROOM_W = 8      // largeur standard
const ROOM_D = 10     // profondeur standard
const ROOM_H = 3.2    // hauteur plafond

type Vec3 = [number, number, number]

// ═══════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES
// ═══════════════════════════════════════════════════════════

function useWallpaperTexture(color1: string, color2: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = color1
    ctx.fillRect(0, 0, 512, 512)

    // Motif damassé subtil
    ctx.strokeStyle = color2
    ctx.lineWidth = 0.5
    ctx.globalAlpha = 0.15
    for (let y = 0; y < 512; y += 32) {
      for (let x = 0; x < 512; x += 32) {
        ctx.beginPath()
        ctx.moveTo(x + 8, y)
        ctx.bezierCurveTo(x + 16, y + 8, x + 16, y + 24, x + 8, y + 32)
        ctx.bezierCurveTo(x, y + 24, x, y + 8, x + 8, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x + 8, y + 16, 5, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1

    // Rayures horizontales très subtiles
    for (let y = 0; y < 512; y += 4) {
      ctx.fillStyle = `rgba(0,0,0,${0.01 + Math.random() * 0.02})`
      ctx.fillRect(0, y, 512, 1)
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(3, 2)
    return tex
  }, [color1, color2])
}

function useCarpetTexture(baseColor: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 256, 256)

    // Texture velours/moquette
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const brightness = 0.7 + Math.random() * 0.3
      ctx.fillStyle = `rgba(${
        parseInt(baseColor.slice(1, 3), 16) * brightness
      },${
        parseInt(baseColor.slice(3, 5), 16) * brightness
      },${
        parseInt(baseColor.slice(5, 7), 16) * brightness
      },0.6)`
      ctx.fillRect(x, y, 1, 1 + Math.random() * 2)
    }

    // Pattern géométrique discret
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 0.5
    for (let y = 0; y < 256; y += 16) {
      for (let x = 0; x < 256; x += 16) {
        ctx.strokeRect(x + 2, y + 2, 12, 12)
      }
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(4, 5)
    return tex
  }, [baseColor])
}

function useWoodTexture(dark = false) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    const baseColor = dark ? '#3a2010' : '#8b5e3c'
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, 256, 512)

    // Grain du bois
    for (let i = 0; i < 30; i++) {
      const y = Math.random() * 512
      const width = 0.5 + Math.random() * 2
      const alpha = 0.05 + Math.random() * 0.15
      ctx.strokeStyle = `rgba(${dark ? '20,10,0' : '100,60,20'},${alpha})`
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x < 256; x += 20) {
        ctx.lineTo(x + 20, y + (Math.random() - 0.5) * 8)
      }
      ctx.stroke()
    }

    // Nœuds
    for (let i = 0; i < 2; i++) {
      const cx = Math.random() * 256
      const cy = Math.random() * 512
      for (let r = 15; r > 0; r -= 2) {
        ctx.strokeStyle = `rgba(${dark ? '15,8,0' : '80,45,15'},${0.05 + r * 0.01})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(cx, cy, r * 1.5, r, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 2)
    return tex
  }, [dark])
}

// ═══════════════════════════════════════════════════════════
// BED COMPONENT
// ═══════════════════════════════════════════════════════════

interface BedProps {
  size:     'single' | 'double' | 'queen' | 'king'
  position: Vec3
  rotation?: number
  isOccupied?: boolean
}

const Bed = memo(function Bed({ size, position, rotation = 0, isOccupied }: BedProps) {
  const woodTex = useWoodTexture(true)

  const dims = {
    single: [1.0, 2.0],
    double: [1.4, 2.0],
    queen:  [1.6, 2.05],
    king:   [1.93, 2.05],
  }[size] as [number, number]

  const [w, d] = dims

  // Couleurs literie selon si occupé
  const sheetColor  = isOccupied ? '#e8e0d0' : '#f5f0e8'
  const pilowColor  = '#f8f4ee'
  const coverColor  = '#2a3a4a'

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Cadre de lit */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.08, 0.36, d + 0.08]} />
        <meshStandardMaterial map={woodTex} color="#5a3010" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Tête de lit */}
      <mesh position={[0, 0.7, -(d / 2 + 0.04)]} castShadow>
        <boxGeometry args={[w + 0.08, 1.0, 0.12]} />
        <meshStandardMaterial map={woodTex} color="#5a3010" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Panneau tête de lit rembourré */}
      <mesh position={[0, 0.72, -(d / 2 + 0.04) + 0.07]}>
        <boxGeometry args={[w - 0.1, 0.85, 0.06]} />
        <meshStandardMaterial color={coverColor} roughness={0.9} />
      </mesh>

      {/* Pied de lit */}
      <mesh position={[0, 0.45, d / 2 + 0.04]} castShadow>
        <boxGeometry args={[w + 0.08, 0.5, 0.1]} />
        <meshStandardMaterial map={woodTex} color="#5a3010" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Pieds */}
      {[
        [-w / 2 + 0.05, -(d / 2 - 0.1)],
        [ w / 2 - 0.05, -(d / 2 - 0.1)],
        [-w / 2 + 0.05,  (d / 2 - 0.1)],
        [ w / 2 - 0.05,  (d / 2 - 0.1)],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.04, pz]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#3a2010" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      {/* Matelas */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[w, 0.22, d]} />
        <meshStandardMaterial color="#e8e4d8" roughness={0.85} />
      </mesh>

      {/* Drap de dessous */}
      <mesh position={[0, 0.535, 0]}>
        <boxGeometry args={[w - 0.02, 0.01, d - 0.02]} />
        <meshStandardMaterial color={sheetColor} roughness={0.9} />
      </mesh>

      {/* Couverture repliée */}
      <mesh position={[0, 0.555, 0.3]}>
        <boxGeometry args={[w - 0.02, 0.08, d - 0.8]} />
        <meshStandardMaterial color={coverColor} roughness={0.85} />
      </mesh>

      {/* Rebord couverture */}
      <mesh position={[0, 0.595, -(d / 2 - 0.7)]}>
        <boxGeometry args={[w - 0.02, 0.04, 0.2]} />
        <meshStandardMaterial color={sheetColor} roughness={0.9} />
      </mesh>

      {/* Oreillers */}
      {size === 'king' ? (
        // 2 oreillers pour king
        [-0.42, 0.42].map((ox, i) => (
          <group key={i} position={[ox, 0.56, -(d / 2 - 0.38)]}>
            <mesh castShadow>
              <boxGeometry args={[0.65, 0.14, 0.5]} />
              <meshStandardMaterial color={pilowColor} roughness={0.85} />
            </mesh>
            {/* Fond d'oreiller */}
            <mesh position={[0, 0.075, 0.05]}>
              <boxGeometry args={[0.6, 0.01, 0.4]} />
              <meshStandardMaterial color={sheetColor} roughness={0.9} />
            </mesh>
          </group>
        ))
      ) : (
        <mesh position={[0, 0.56, -(d / 2 - 0.38)]} castShadow>
          <boxGeometry args={[w - 0.2, 0.14, 0.5]} />
          <meshStandardMaterial color={pilowColor} roughness={0.85} />
        </mesh>
      )}

      {/* Coussin décoratif */}
      <mesh position={[0, 0.62, -(d / 2 - 0.38)]} castShadow>
        <boxGeometry args={[0.35, 0.12, 0.35]} />
        <meshStandardMaterial color="#c8a84b" roughness={0.7} />
      </mesh>

      {/* Bed runner */}
      <mesh position={[0, 0.54, d / 2 - 0.35]}>
        <boxGeometry args={[w - 0.05, 0.015, 0.7]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.8} />
      </mesh>

      {/* Tables de chevet */}
      {(size === 'king' || size === 'queen' ? [-1, 1] : [-0.8]).map((side, i) => (
        <group key={i} position={[(w / 2 + 0.22) * side, 0, -(d / 2 - 0.5)]}>
          {/* Corps table */}
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.65, 0.35]} />
            <meshStandardMaterial map={woodTex} color="#5a3010" roughness={0.6} />
          </mesh>
          {/* Dessus */}
          <mesh position={[0, 0.33, 0]}>
            <boxGeometry args={[0.4, 0.02, 0.37]} />
            <meshStandardMaterial color="#4a2810" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Tiroir */}
          <mesh position={[0, 0.1, 0.175]}>
            <boxGeometry args={[0.32, 0.12, 0.01]} />
            <meshStandardMaterial color="#4a2810" roughness={0.5} />
          </mesh>
          {/* Poignée */}
          <mesh position={[0, 0.1, 0.182]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Lampe de chevet */}
          <group position={[0, 0.35, 0]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.06, 0.35, 8]} />
              <meshStandardMaterial color="#4a2810" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.12, 0.08, 0.18, 8, 1, true]} />
              <meshStandardMaterial color="#f5e6c8" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            <pointLight position={[0, 0.2, 0]} intensity={0.4} color="#ffcc88" distance={2.5} decay={2} />
          </group>
          {/* Téléphone */}
          <mesh position={[0.1, 0.36, 0.05]} rotation={[0, 0.3, 0]}>
            <boxGeometry args={[0.1, 0.02, 0.16]} />
            <meshStandardMaterial color="#222222" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
})

// ═══════════════════════════════════════════════════════════
// TV + MEUBLE TV
// ═══════════════════════════════════════════════════════════

const TVUnit = memo(function TVUnit({ position }: { position: Vec3 }) {
  const screenRef = useRef<THREE.Mesh>(null)
  const woodTex   = useWoodTexture()

  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      // Simuler image TV qui change
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 0.8) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Meuble TV */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.6, 0.6, 0.4]} />
        <meshStandardMaterial map={woodTex} color="#5a3010" roughness={0.6} />
      </mesh>
      {/* Dessus */}
      <mesh position={[0, 0.61, 0]}>
        <boxGeometry args={[1.62, 0.02, 0.42]} />
        <meshStandardMaterial color="#4a2810" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Portes meuble */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 0.28, 0.205]}>
          <boxGeometry args={[0.74, 0.54, 0.01]} />
          <meshStandardMaterial map={woodTex} color="#5a3010" roughness={0.6} />
        </mesh>
      ))}

      {/* TV */}
      <group position={[0, 1.02, 0.05]}>
        {/* Cadre TV */}
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.7, 0.05]} />
          <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Écran */}
        <mesh ref={screenRef} position={[0, 0, 0.028]}>
          <boxGeometry args={[1.14, 0.64, 0.01]} />
          <meshStandardMaterial
            color="#001122"
            emissive="#0066aa"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Pied TV */}
        <mesh position={[0, -0.42, 0.04]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Contenu simulé TV */}
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[-0.4 + i * 0.28, 0.1 - (i % 2) * 0.2, 0.03]}>
            <boxGeometry args={[0.22, 0.15, 0.001]} />
            <meshStandardMaterial
              color={`hsl(${i * 60 + 180}, 70%, 40%)`}
              emissive={`hsl(${i * 60 + 180}, 70%, 40%)`}
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* Lecteur Blu-ray/box */}
      <mesh position={[0.4, 0.62, -0.05]}>
        <boxGeometry args={[0.3, 0.04, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0.35, 0.625, 0.055]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════
// MINIBAR
// ═══════════════════════════════════════════════════════════

const Minibar = memo(function Minibar({ position }: { position: Vec3 }) {
  const woodTex = useWoodTexture()

  return (
    <group position={position}>
      {/* Corps minibar */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.85, 0.55]} />
        <meshStandardMaterial map={woodTex} color="#4a3020" roughness={0.6} />
      </mesh>

      {/* Porte vitrée */}
      <mesh position={[0, 0, 0.278]}>
        <boxGeometry args={[0.52, 0.82, 0.02]} />
        <meshPhysicalMaterial
          color="#a8ccdd"
          transmission={0.6}
          thickness={0.02}
          roughness={0.05}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Poignée */}
      <mesh position={[0.18, 0, 0.295]}>
        <boxGeometry args={[0.02, 0.2, 0.015]} />
        <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Intérieur — étagères */}
      {[-0.15, 0.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.5, 0.01, 0.5]} />
          <meshStandardMaterial color="#888888" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Bouteilles */}
      {[
        [-0.15, 0.15, 0],
        [0, 0.15, 0],
        [0.15, 0.15, 0],
        [-0.1, -0.1, 0],
        [0.1, -0.1, 0],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.03, 0.18, 8]} />
            <meshStandardMaterial
              color={['#88aa44', '#cc4422', '#2244cc', '#cc8800', '#442288'][i]}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          {/* Capsule */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.025, 6]} />
            <meshStandardMaterial color="#dddddd" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Canettes */}
      {[-0.15, 0, 0.15].map((x, i) => (
        <mesh key={i} position={[x, -0.28, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.12, 8]} />
          <meshStandardMaterial
            color={['#cc0000', '#0044cc', '#00aa44'][i]}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* Lumière intérieure */}
      <pointLight position={[0, 0.2, 0]} intensity={0.2} color="#ccddff" distance={1} decay={2} />

      {/* Dessus minibar */}
      <mesh position={[0, 0.43, 0]}>
        <boxGeometry args={[0.57, 0.02, 0.57]} />
        <meshStandardMaterial color="#4a3020" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Ice bucket sur le dessus */}
      <group position={[0, 0.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.065, 0.14, 10]} />
          <meshStandardMaterial color="#c8c8c8" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Glace */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.06, 10]} />
          <meshStandardMaterial color="#e8f4ff" transparent opacity={0.7} roughness={0.1} />
        </mesh>
      </group>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════
// DESK / BUREAU
// ═══════════════════════════════════════════════════════════

const WorkDesk = memo(function WorkDesk({ position }: { position: Vec3 }) {
  const woodTex    = useWoodTexture()
  const screenRef  = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 1.2) * 0.08
    }
  })

  return (
    <group position={position}>
      {/* Plateau bureau */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.2, 0.04, 0.55]} />
        <meshStandardMaterial map={woodTex} color="#7a5030" roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Pieds */}
      {[[-0.55, -0.22], [0.55, -0.22], [-0.55, 0.22], [0.55, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Traverses */}
      {[[-0.22], [0.22]].map(([z], i) => (
        <mesh key={i} position={[0, 0.15, z]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.1, 0.03, 0.03]} />
          <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Écran */}
      <group position={[0, 1.08, -0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.32, 0.03]} />
          <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh ref={screenRef} position={[0, 0, 0.016]}>
          <boxGeometry args={[0.46, 0.28, 0.005]} />
          <meshStandardMaterial color="#001a33" emissive="#003366" emissiveIntensity={0.3} />
        </mesh>
        {/* Pied écran */}
        <mesh position={[0, -0.2, 0.02]}>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, -0.22, 0.04]}>
          <boxGeometry args={[0.15, 0.02, 0.12]} />
          <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      {/* Clavier */}
      <mesh position={[0, 0.79, 0.12]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[0.35, 0.015, 0.13]} />
        <meshStandardMaterial color="#333344" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Souris */}
      <mesh position={[0.22, 0.775, 0.12]}>
        <boxGeometry args={[0.06, 0.015, 0.1]} />
        <meshStandardMaterial color="#222233" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Bloc-notes + stylo */}
      <mesh position={[-0.3, 0.77, 0.1]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.15, 0.008, 0.2]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.8} />
      </mesh>
      <mesh position={[-0.18, 0.77, 0.05]} rotation={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.15, 6]} />
        <meshStandardMaterial color="#1a1a8a" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Chaise de bureau */}
      <group position={[0, 0, 0.52]}>
        {/* Assise */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.48]} />
          <meshStandardMaterial color="#1a2a3a" roughness={0.8} />
        </mesh>
        {/* Dossier */}
        <mesh position={[0, 0.82, -0.22]} castShadow>
          <boxGeometry args={[0.48, 0.55, 0.06]} />
          <meshStandardMaterial color="#1a2a3a" roughness={0.8} />
        </mesh>
        {/* Pied central */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Base étoile */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh
            key={i}
            position={[Math.cos(i * Math.PI * 2 / 5) * 0.22, 0.03, Math.sin(i * Math.PI * 2 / 5) * 0.22]}
            rotation={[0, i * Math.PI * 2 / 5, 0]}
          >
            <boxGeometry args={[0.22, 0.02, 0.04]} />
            <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* Roulettes */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh
            key={i}
            position={[Math.cos(i * Math.PI * 2 / 5) * 0.22, 0.02, Math.sin(i * Math.PI * 2 / 5) * 0.22]}
          >
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#333333" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════
// ARMOIRE / CLOSET
// ═══════════════════════════════════════════════════════════

const Wardrobe = memo(function Wardrobe({ position }: { position: Vec3 }) {
  const woodTex = useWoodTexture()
  const [isOpen, setIsOpen] = useState(false)
  const doorAngle = useRef(0)
  const doorRef   = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    const target = isOpen ? -Math.PI / 2 : 0
    doorAngle.current = THREE.MathUtils.damp(doorAngle.current, target, 6, dt)
    if (doorRef.current) {
      doorRef.current.rotation.y = doorAngle.current
    }
  })

  return (
    <group position={position}>
      {/* Corps armoire */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 2.2, 0.6]} />
        <meshStandardMaterial map={woodTex} color="#5a3010" roughness={0.6} />
      </mesh>

      {/* Miroir sur le côté gauche */}
      <mesh position={[-0.3, 0, 0.305]}>
        <boxGeometry args={[0.56, 2.0, 0.01]} />
        <meshStandardMaterial color="#aaddee" metalness={0.95} roughness={0.02} />
      </mesh>

      {/* Porte droite (interactive) */}
      <group position={[0.3, 0, 0.3]}>
        <mesh
          ref={doorRef}
          position={[-0.3, 0, 0]}
          onClick={() => setIsOpen(prev => !prev)}
          castShadow
        >
          <boxGeometry args={[0.56, 2.15, 0.02]} />
          <meshStandardMaterial map={woodTex} color="#6a3a18" roughness={0.55} />
        </mesh>
      </group>

      {/* Intérieur visible */}
      {isOpen && (
        <>
          {/* Tringle */}
          <mesh position={[0.15, 0.7, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.5, 6]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#c8c8c8" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Cintres */}
          {Array.from({ length: 3 }).map((_, i) => (
            <group key={i} position={[0, 0.7, 0]}>
              <mesh rotation={[0, i * 0.3 - 0.3, 0]}>
                <torusGeometry args={[0.06, 0.005, 6, 12, Math.PI * 1.5]} />
                <meshStandardMaterial color="#c8c8c8" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          ))}
          {/* Étagère chaussures */}
          <mesh position={[0.15, -0.8, 0]}>
            <boxGeometry args={[0.5, 0.01, 0.5]} />
            <meshStandardMaterial color="#7a5030" roughness={0.6} />
          </mesh>
        </>
      )}

      {/* Dessus armoire */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[1.22, 0.04, 0.62]} />
        <meshStandardMaterial color="#4a2810" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Poignées */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.31]}>
          <boxGeometry args={[0.02, 0.12, 0.01]} />
          <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
})

// ═══════════════════════════════════════════════════════════
// ROOM CONTROLS (thermostat, lumières, DND)
// ═══════════════════════════════════════════════════════════

interface RoomControlsProps {
  position:      Vec3
  onLightChange?: (on: boolean) => void
  onDNDChange?:  (dnd: boolean) => void
}

const RoomControls = memo(function RoomControls({
  position,
  onLightChange,
  onDNDChange,
}: RoomControlsProps) {
  const [lightsOn, setLightsOn]   = useState(true)
  const [dnd, setDND]             = useState(false)
  const [temp, setTemp]           = useState(21)
  const displayRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (displayRef.current) {
      const mat = displayRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })

  return (
    <group position={position}>
      {/* Panneau mural */}
      <mesh>
        <boxGeometry args={[0.22, 0.32, 0.025]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Écran thermostat */}
      <mesh ref={displayRef} position={[0, 0.07, 0.014]}>
        <boxGeometry args={[0.16, 0.08, 0.005]} />
        <meshStandardMaterial color="#001122" emissive="#003366" emissiveIntensity={0.4} />
      </mesh>

      {/* Bouton lumière */}
      <mesh
        position={[-0.06, -0.06, 0.014]}
        onClick={() => { setLightsOn(p => { onLightChange?.(!p); return !p }) }}
      >
        <cylinderGeometry args={[0.025, 0.025, 0.01, 10]} />
        <meshStandardMaterial
          color={lightsOn ? '#ffdd00' : '#444444'}
          emissive={lightsOn ? '#ffaa00' : '#000000'}
          emissiveIntensity={lightsOn ? 0.5 : 0}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Bouton DND */}
      <mesh
        position={[0.06, -0.06, 0.014]}
        onClick={() => { setDND(p => { onDNDChange?.(!p); return !p }) }}
      >
        <cylinderGeometry args={[0.025, 0.025, 0.01, 10]} />
        <meshStandardMaterial
          color={dnd ? '#ff4444' : '#444444'}
          emissive={dnd ? '#cc0000' : '#000000'}
          emissiveIntensity={dnd ? 0.5 : 0}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* +/- Température */}
      {[-0.05, 0.05].map((x, i) => (
        <mesh
          key={i}
          position={[x, -0.1, 0.014]}
          onClick={() => setTemp(p => Math.max(16, Math.min(28, p + (i === 1 ? 1 : -1))))}
        >
          <boxGeometry args={[0.03, 0.03, 0.008]} />
          <meshStandardMaterial color="#888888" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
})

// ═══════════════════════════════════════════════════════════
// ROOM LIGHTING
// ═══════════════════════════════════════════════════════════

interface RoomLightingProps {
  isOn:     boolean
  roomType: RoomType
}

const RoomLighting = memo(function RoomLighting({ isOn, roomType }: RoomLightingProps) {
  const isSuite = roomType === 'suite' || roomType === 'penthouse' || roomType === 'junior_suite'

  return (
    <>
      {/* Lumière principale plafond */}
      <pointLight
        position={[0, ROOM_H - 0.1, 0]}
        intensity={isOn ? (isSuite ? 1.5 : 1.2) : 0}
        color="#fff8e0"
        distance={10}
        decay={2}
        castShadow={isOn}
        shadow-mapSize={[512, 512]}
      />

      {/* Spot d'accentuation */}
      {isSuite && (
        <>
          <spotLight
            position={[-2, ROOM_H - 0.1, -3]}
            angle={Math.PI / 6}
            penumbra={0.5}
            intensity={isOn ? 0.8 : 0}
            color="#fff8e0"
            castShadow={false}
          />
          <spotLight
            position={[2, ROOM_H - 0.1, -3]}
            angle={Math.PI / 6}
            penumbra={0.5}
            intensity={isOn ? 0.8 : 0}
            color="#fff8e0"
            castShadow={false}
          />
        </>
      )}

      {/* Ambient room */}
      <ambientLight intensity={isOn ? 0.35 : 0.05} color="#fff8e0" />

      {/* Lumière depuis les fenêtres (jour) */}
      <pointLight
        position={[0, ROOM_H / 2, ROOM_D / 2 - 0.2]}
        intensity={0.6}
        color="#fff8d0"
        distance={8}
        decay={2}
      />
    </>
  )
})

// ═══════════════════════════════════════════════════════════
// HOTEL ROOM 3D — ROOT COMPONENT
// ═══════════════════════════════════════════════════════════

interface HotelRoom3DProps {
  roomType:       RoomType
  position?:      Vec3
  isOccupied?:    boolean
  isDND?:         boolean
  playerRef?:     React.MutableRefObject<THREE.Vector3>
  onInteract?:    (action: string) => void
}

export const HotelRoom3D = memo(function HotelRoom3D({
  roomType,
  position = [0, 0, 0],
  isOccupied = false,
  isDND = false,
  playerRef,
  onInteract,
}: HotelRoom3DProps) {
  const [lightsOn, setLightsOn] = useState(true)
  const [dndActive, setDND]     = useState(isDND)

  const isSuite     = roomType === 'suite' || roomType === 'penthouse'
  const isJrSuite   = roomType === 'junior_suite'
  const bedSize     = roomType === 'king' || roomType === 'penthouse' ? 'king'
                    : roomType === 'queen' || roomType === 'suite' ? 'queen'
                    : roomType === 'standard_single' ? 'single'
                    : 'double'

  // Couleurs selon type de chambre
  const wallColor1   = isSuite     ? '#f5f0e0' : '#e8e4d8'
  const wallColor2   = isSuite     ? '#d4c8a0' : '#c8c0a8'
  const carpetColor  = isSuite     ? '#8b6a3a' : '#6a5a4a'

  const wallTex   = useWallpaperTexture(wallColor1, wallColor2)
  const carpetTex = useCarpetTexture(carpetColor)

  const effectiveW = isSuite ? ROOM_W * 1.5 : ROOM_W
  const effectiveD = isSuite ? ROOM_D * 1.3 : ROOM_D

  return (
    <group position={position}>
      {/* ══ STRUCTURE ══ */}

      {/* Sol moquette */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[effectiveW, effectiveD]} />
        <meshStandardMaterial map={carpetTex} color={carpetColor} roughness={0.9} />
      </mesh>

      {/* Plafond */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[effectiveW, effectiveD]} />
        <meshStandardMaterial color="#f8f5f0" roughness={0.9} />
      </mesh>

      {/* Moulure plafond */}
      {[
        [0, ROOM_H - 0.05,  effectiveD / 2, [effectiveW, 0.1, 0.08], 0],
        [0, ROOM_H - 0.05, -effectiveD / 2, [effectiveW, 0.1, 0.08], 0],
        [ effectiveW / 2, ROOM_H - 0.05, 0, [0.08, 0.1, effectiveD], 0],
        [-effectiveW / 2, ROOM_H - 0.05, 0, [0.08, 0.1, effectiveD], 0],
      ].map(([x, y, z, dims, _], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <boxGeometry args={dims as [number, number, number]} />
          <meshStandardMaterial color="#f0ece4" roughness={0.8} />
        </mesh>
      ))}

      {/* Mur derrière (tête de lit) */}
      <mesh position={[0, ROOM_H / 2, -effectiveD / 2]}>
        <boxGeometry args={[effectiveW, ROOM_H, 0.12]} />
        <meshStandardMaterial map={wallTex} color={wallColor1} roughness={0.85} />
      </mesh>

      {/* Accent wall — papier peint foncé derrière lit */}
      <mesh position={[0, ROOM_H / 2, -effectiveD / 2 + 0.07]}>
        <boxGeometry args={[effectiveW * 0.6, ROOM_H, 0.01]} />
        <meshStandardMaterial color={isSuite ? '#2a1a0a' : '#3a2a1a'} roughness={0.7} />
      </mesh>

      {/* Murs latéraux */}
      {[-effectiveW / 2, effectiveW / 2].map((x, i) => (
        <mesh key={i} position={[x, ROOM_H / 2, 0]}>
          <boxGeometry args={[0.12, ROOM_H, effectiveD]} />
          <meshStandardMaterial map={wallTex} color={wallColor1} roughness={0.85} />
        </mesh>
      ))}

      {/* Mur avant (porte) */}
      <mesh position={[0, ROOM_H / 2, effectiveD / 2]}>
        <boxGeometry args={[effectiveW, ROOM_H, 0.12]} />
        <meshStandardMaterial map={wallTex} color={wallColor1} roughness={0.85} />
      </mesh>

      {/* Plinthe */}
      {[
        [0, 0.04, effectiveD / 2],
        [0, 0.04, -effectiveD / 2],
        [effectiveW / 2, 0.04, 0],
        [-effectiveW / 2, 0.04, 0],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[
            i < 2 ? effectiveW : 0.12,
            0.08,
            i < 2 ? 0.06 : effectiveD,
          ]} />
          <meshStandardMaterial color="#f0ece4" roughness={0.7} />
        </mesh>
      ))}

      {/* ══ MOBILIER ══ */}

      {/* Lit */}
      <Bed
        size={bedSize}
        position={[0, 0, -(effectiveD / 2 - 1.4)]}
        isOccupied={isOccupied}
      />

      {/* TV + Meuble TV */}
      <TVUnit position={[0, 0, -(effectiveD / 2 - 0.3)]} />

      {/* Minibar */}
      <Minibar position={[effectiveW / 2 - 0.35, 0.42, -(effectiveD / 2 - 0.5)]} />

      {/* Bureau */}
      <WorkDesk position={[effectiveW / 2 - 0.7, 0, 0.5]} />

      {/* Armoire */}
      <Wardrobe position={[-effectiveW / 2 + 0.65, 1.1, effectiveD / 2 - 0.35]} />

      {/* Panneau de contrôle de chambre */}
      <RoomControls
        position={[effectiveW / 2 - 0.04, 1.2, effectiveD / 2 - 0.5]}
        onLightChange={setLightsOn}
        onDNDChange={setDND}
      />

      {/* DND Sign sur la porte */}
      {dndActive && (
        <mesh position={[-effectiveW / 2 + 0.05, 1.3, effectiveD / 2 - 0.12]}>
          <boxGeometry args={[0.005, 0.12, 0.2]} />
          <meshStandardMaterial color="#ff4444" emissive="#cc0000" emissiveIntensity={0.4} />
        </mesh>
      )}

      {/* ══ SUITE EXTRAS ══ */}
      {isSuite && (
        <>
          {/* Sofa */}
          <group position={[0, 0, 1.5]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[2.2, 0.2, 0.9]} />
              <meshStandardMaterial color="#2a3a4a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.55, -0.43]} castShadow>
              <boxGeometry args={[2.2, 0.5, 0.08]} />
              <meshStandardMaterial color="#2a3a4a" roughness={0.8} />
            </mesh>
            {[-1.05, 1.05].map((x, i) => (
              <mesh key={i} position={[x, 0.42, -0.18]}>
                <boxGeometry args={[0.08, 0.35, 0.54]} />
                <meshStandardMaterial color="#1a2a3a" roughness={0.8} />
              </mesh>
            ))}
          </group>

          {/* Table basse */}
          <mesh position={[0, 0.26, 2.8]} castShadow>
            <boxGeometry args={[0.9, 0.04, 0.5]} />
            <meshStandardMaterial color="#6a4020" roughness={0.4} metalness={0.1} />
          </mesh>

          {/* Coupe de fruits */}
          <group position={[0, 0.3, 2.8]}>
            <mesh>
              <cylinderGeometry args={[0.1, 0.08, 0.04, 10]} />
              <meshStandardMaterial color="#c8a84b" metalness={0.7} roughness={0.3} />
            </mesh>
            {Array.from({ length: 4 }).map((_, i) => (
              <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.05, 0.03, Math.sin(i * Math.PI / 2) * 0.05]}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshStandardMaterial color={['#ff4444', '#ff8800', '#ffdd00', '#44cc44'][i]} roughness={0.5} />
              </mesh>
            ))}
          </group>
        </>
      )}

      {/* ══ PENTHOUSE EXTRAS ══ */}
      {roomType === 'penthouse' && (
        <>
          {/* Jacuzzi intégré */}
          <group position={[-effectiveW / 2 + 2, 0, -effectiveD / 2 + 2]}>
            <mesh>
              <cylinderGeometry args={[1.0, 1.1, 0.6, 14]} />
              <meshStandardMaterial color="#e8e4d8" roughness={0.3} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.95, 0.95, 0.01, 14]} />
              <meshPhysicalMaterial color="#4488bb" transmission={0.4} roughness={0.05} transparent opacity={0.8} />
            </mesh>
            <pointLight position={[0, 0.1, 0]} intensity={0.4} color="#44aaff" distance={2} decay={2} />
          </group>

          {/* Bar */}
          <group position={[effectiveW / 2 - 1.5, 0, -effectiveD / 2 + 1.5]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[1.8, 1.1, 0.5]} />
              <meshStandardMaterial color="#2a1a0a" roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[0, 1.12, 0]}>
              <boxGeometry args={[1.85, 0.04, 0.55]} />
              <meshStandardMaterial color="#c8a84b" metalness={0.7} roughness={0.2} />
            </mesh>
            {/* Bouteilles derrière le bar */}
            {Array.from({ length: 6 }).map((_, i) => (
              <group key={i} position={[-0.6 + i * 0.24, 0.65, -0.18]}>
                <mesh>
                  <cylinderGeometry args={[0.03, 0.035, 0.3, 8]} />
                  <meshStandardMaterial
                    color={`hsl(${i * 40 + 10}, 60%, 35%)`}
                    roughness={0.2}
                    metalness={0.1}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </>
      )}

      {/* ══ ÉCLAIRAGE ══ */}
      <RoomLighting isOn={lightsOn} roomType={roomType} />

      {/* Lumière de couloir sous la porte */}
      <pointLight
        position={[0, 0.02, effectiveD / 2 - 0.05]}
        intensity={0.1}
        color="#fff8e0"
        distance={0.5}
        decay={2}
      />

      {/* ══ COLLIDERS ══ */}
      <RigidBody type="fixed" colliders={false} name="room-colliders">
        {/* Sol */}
        <CuboidCollider args={[effectiveW / 2, 0.1, effectiveD / 2]} position={[0, -0.1, 0]} />
        {/* Murs */}
        <CuboidCollider args={[effectiveW / 2, ROOM_H / 2, 0.06]} position={[0, ROOM_H / 2, effectiveD / 2]} />
        <CuboidCollider args={[effectiveW / 2, ROOM_H / 2, 0.06]} position={[0, ROOM_H / 2, -effectiveD / 2]} />
        <CuboidCollider args={[0.06, ROOM_H / 2, effectiveD / 2]} position={[effectiveW / 2, ROOM_H / 2, 0]} />
        <CuboidCollider args={[0.06, ROOM_H / 2, effectiveD / 2]} position={[-effectiveW / 2, ROOM_H / 2, 0]} />
        {/* Lit */}
        <CuboidCollider args={[1.0, 0.4, 1.1]} position={[0, 0.4, -(effectiveD / 2 - 1.4)]} />
        {/* Meuble TV */}
        <CuboidCollider args={[0.82, 0.35, 0.22]} position={[0, 0.35, -(effectiveD / 2 - 0.3)]} />
      </RigidBody>
    </group>
  )
})