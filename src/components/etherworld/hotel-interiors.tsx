'use client'

import { memo, useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const LOBBY_WIDTH = 24
const LOBBY_DEPTH = 18
const LOBBY_HEIGHT = 5
const WALL_THICKNESS = 0.2
const CORRIDOR_WIDTH = 3.5
const CORRIDOR_LENGTH = 24
const ROOMS_PER_SIDE = 6
const ROOM_SPACING = 3.2

// ════════════════════════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES
// ════════════════════════════════════════════════════════════════════════════

function createCanvasTexture(
  w: number, h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  if (repeat) tex.repeat.set(repeat[0], repeat[1])
  tex.needsUpdate = true
  return tex
}

// Sol marbre du lobby
function useLobbyFloorTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    // Base marbre crème
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#d4c8b0')
    grad.addColorStop(0.3, '#c8bca4')
    grad.addColorStop(0.6, '#d0c4ac')
    grad.addColorStop(1, '#c4b898')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Veines de marbre
    ctx.strokeStyle = 'rgba(180,170,150,0.15)'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 12; i++) {
      ctx.beginPath()
      let x = Math.random() * w
      let y = Math.random() * h
      ctx.moveTo(x, y)
      for (let j = 0; j < 6; j++) {
        x += (Math.random() - 0.5) * 80
        y += (Math.random() - 0.5) * 80
        ctx.quadraticCurveTo(
          x + (Math.random() - 0.5) * 40,
          y + (Math.random() - 0.5) * 40,
          x, y
        )
      }
      ctx.stroke()
    }

    // Carrelage (joints)
    const tileSize = w / 4
    ctx.strokeStyle = 'rgba(160,145,120,0.2)'
    ctx.lineWidth = 2
    for (let x = 0; x < w; x += tileSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 0; y < h; y += tileSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    // Reflets subtils
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 3 + Math.random() * 8)
    }
  }, [6, 4.5]), [])
}

// Mur intérieur — stuc texturé
function useWallTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2e2e42'
    ctx.fillRect(0, 0, w, h)

    // Texture stucco
    for (let i = 0; i < 1500; i++) {
      const shade = 42 + Math.random() * 10
      ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 12})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3)
    }

    // Moulure horizontale subtile
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.fillRect(0, h * 0.3, w, 3)
    ctx.fillRect(0, h * 0.7, w, 3)
  }, [2, 2]), [])
}

// Tapis — motif persan
function useCarpetTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#4a1a1a'
    ctx.fillRect(0, 0, w, h)

    // Bordure
    ctx.strokeStyle = '#8b6914'
    ctx.lineWidth = 8
    ctx.strokeRect(20, 20, w - 40, h - 40)
    ctx.strokeStyle = '#6b3020'
    ctx.lineWidth = 4
    ctx.strokeRect(30, 30, w - 60, h - 60)

    // Motif central
    ctx.fillStyle = '#7a2820'
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const x = 60 + i * 68
        const y = 60 + j * 68
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.PI / 4)
        ctx.fillRect(-12, -12, 24, 24)
        ctx.restore()
      }
    }

    // Filigrane doré
    ctx.strokeStyle = 'rgba(180,140,40,0.3)'
    ctx.lineWidth = 1
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, 40 + i * 25, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Points décoratifs
    ctx.fillStyle = '#8b6914'
    for (let i = 0; i < 30; i++) {
      ctx.beginPath()
      ctx.arc(40 + Math.random() * (w - 80), 40 + Math.random() * (h - 80), 2 + Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [3, 5]), [])
}

// Plafond — panneaux décoratifs
function useCeilingTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1a1a2a'
    ctx.fillRect(0, 0, w, h)
    const panelSize = 128
    for (let x = 0; x < w; x += panelSize) {
      for (let y = 0; y < h; y += panelSize) {
        const shade = 22 + Math.random() * 5
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 8})`
        ctx.fillRect(x + 2, y + 2, panelSize - 4, panelSize - 4)
        // Moulure
        ctx.strokeStyle = 'rgba(255,255,255,0.04)'
        ctx.lineWidth = 1
        ctx.strokeRect(x + 4, y + 4, panelSize - 8, panelSize - 8)
      }
    }
  }, [4, 3]), [])
}

// Texture bois pour comptoir/meubles
function useWoodTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, 0)
    grad.addColorStop(0, '#2a1a0e')
    grad.addColorStop(0.3, '#3a2818')
    grad.addColorStop(0.6, '#2e1c10')
    grad.addColorStop(1, '#382414')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(${60 + Math.random() * 20},${40 + Math.random() * 15},${20 + Math.random() * 10},${0.04 + Math.random() * 0.06})`
      ctx.fillRect(0, y, w, 1.5)
    }
  }), [])
}

// ════════════════════════════════════════════════════════════════════════════
// PARTICULES ATMOSPHÉRIQUES
// ════════════════════════════════════════════════════════════════════════════

function LobbyDustParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 300

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * LOBBY_WIDTH * 0.9
      pos[i * 3 + 1] = Math.random() * LOBBY_HEIGHT
      pos[i * 3 + 2] = (Math.random() - 0.5) * LOBBY_DEPTH * 0.9
      spd[i * 3] = (Math.random() - 0.5) * 0.008
      spd[i * 3 + 1] = (Math.random() - 0.5) * 0.004
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.006
    }
    return { positions: pos, speeds: spd }
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      attr.array[i * 3] += speeds[i * 3] + Math.sin(t * 0.2 + i) * 0.0004
      attr.array[i * 3 + 1] += speeds[i * 3 + 1] + Math.cos(t * 0.15 + i * 0.3) * 0.0002
      attr.array[i * 3 + 2] += speeds[i * 3 + 2]
      if (Math.abs(attr.array[i * 3]) > LOBBY_WIDTH / 2) attr.array[i * 3] *= -0.95
      if (attr.array[i * 3 + 1] > LOBBY_HEIGHT || attr.array[i * 3 + 1] < 0) attr.array[i * 3 + 1] = Math.random() * LOBBY_HEIGHT
      if (Math.abs(attr.array[i * 3 + 2]) > LOBBY_DEPTH / 2) attr.array[i * 3 + 2] *= -0.95
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#fef3c7" transparent opacity={0.2} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// FONTAINE DÉCORATIVE
// ════════════════════════════════════════════════════════════════════════════

const LobbyFountain = memo(function LobbyFountain({ position }: { position: [number, number, number] }) {
  const waterRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const waterParticles = useMemo(() => {
    const count = 80
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 0.3
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = Math.random() * 0.8
      pos[i * 3 + 2] = Math.sin(angle) * radius
    }
    return pos
  }, [])

  useFrame((state) => {
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
    if (particlesRef.current) {
      const attr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
      const t = state.clock.elapsedTime
      for (let i = 0; i < 80; i++) {
        attr.array[i * 3 + 1] = (Math.sin(t * 3 + i * 0.5) * 0.5 + 0.5) * 0.6 + 0.3
        const angle = t * 0.5 + i * 0.3
        attr.array[i * 3] = Math.cos(angle) * (0.1 + Math.sin(t + i) * 0.15)
        attr.array[i * 3 + 2] = Math.sin(angle) * (0.1 + Math.cos(t + i) * 0.15)
      }
      attr.needsUpdate = true
    }
  })

  return (
    <group position={position}>
      {/* Base octogonale */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 0.3, 8]} />
        <meshStandardMaterial color="#4a4a5e" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Bassin */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[1.1, 1.2, 0.1, 8]} />
        <meshStandardMaterial color="#3a3a4e" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Eau du bassin */}
      <mesh ref={waterRef} position={[0, 0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 16]} />
        <meshStandardMaterial color="#2a5a8a" transparent opacity={0.4} roughness={0.1} metalness={0.3} />
      </mesh>

      {/* Colonne centrale */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.7, 8]} />
        <meshStandardMaterial color="#5a5a6e" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Vasque supérieure */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.15, 0.15, 8]} />
        <meshStandardMaterial color="#4a4a5e" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Jet central */}
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.02, 0.01, 0.3, 6]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.6} emissive="#4488cc" emissiveIntensity={0.2} />
      </mesh>

      {/* Particules d'eau */}
      <points ref={particlesRef} position={[0, 0.6, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={80} array={waterParticles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.02} color="#88ccff" transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Lumière d'ambiance */}
      <pointLight position={[0, 0.5, 0]} intensity={0.4} color="#4488cc" distance={4} decay={2} />

      {/* Inscription */}
      <Text position={[0, 0.02, 1.35]} fontSize={0.08} color="#8a7a6a" anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>
        ETHERWORLD QC
      </Text>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COLONNE DÉCORATIVE
// ════════════════════════════════════════════════════════════════════════════

const DecorativeColumn = memo(function DecorativeColumn({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshStandardMaterial color="#3a3a4e" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Base moulure */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.55, 0.04, 0.55]} />
        <meshStandardMaterial color="#4a4a5e" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Fût */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 3.6, 12]} />
        <meshStandardMaterial color="#d4c8b0" roughness={0.45} metalness={0.15} />
      </mesh>

      {/* Rainures de colonne */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={`flute-${i}`}
            position={[Math.cos(angle) * 0.21, 2.3, Math.sin(angle) * 0.21]}
          >
            <boxGeometry args={[0.02, 3.5, 0.015]} />
            <meshStandardMaterial color="#c4b8a0" roughness={0.5} />
          </mesh>
        )
      })}

      {/* Chapiteau */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[0.55, 0.15, 0.55]} />
        <meshStandardMaterial color="#4a4a5e" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 4.12, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.2, 0.1, 12]} />
        <meshStandardMaterial color="#d4c8b0" roughness={0.4} metalness={0.2} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// TABLEAU / PEINTURE MURALE
// ════════════════════════════════════════════════════════════════════════════

const WallPainting = memo(function WallPainting({
  position, rotation = [0, 0, 0], size = [1.2, 0.8]
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  size?: [number, number]
}) {
  const paintingTex = useMemo(() => createCanvasTexture(256, 180, (ctx, w, h) => {
    // Paysage abstrait
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6)
    skyGrad.addColorStop(0, '#1a0a2e')
    skyGrad.addColorStop(0.5, '#2a1a4e')
    skyGrad.addColorStop(1, '#4a2a6e')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, h * 0.6)

    // Montagnes
    ctx.fillStyle = '#1a1a2e'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.5)
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, h * 0.4 + Math.sin(x * 0.05) * 30 + Math.random() * 10)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()

    // Lune
    ctx.fillStyle = '#fef3c7'
    ctx.beginPath()
    ctx.arc(w * 0.7, h * 0.2, 15, 0, Math.PI * 2)
    ctx.fill()

    // Étoiles
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h * 0.5, 1, 1)
    }
  }), [])

  return (
    <group position={position} rotation={rotation}>
      {/* Cadre */}
      <mesh castShadow>
        <boxGeometry args={[size[0] + 0.1, size[1] + 0.1, 0.04]} />
        <meshStandardMaterial color="#8b6914" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Cadre intérieur */}
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[size[0] + 0.04, size[1] + 0.04, 0.02]} />
        <meshStandardMaterial color="#6b4914" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Toile */}
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[size[0], size[1], 0.005]} />
        <meshStandardMaterial map={paintingTex} />
      </mesh>
      {/* Éclairage de tableau */}
      <mesh position={[0, size[1] / 2 + 0.12, 0.08]}>
        <boxGeometry args={[0.4, 0.03, 0.06]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.4} />
      </mesh>
      <spotLight
        position={[0, size[1] / 2 + 0.15, 0.2]}
        angle={Math.PI / 4}
        penumbra={0.8}
        intensity={0.5}
        color="#fef3c7"
        distance={2}
      />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PLANTE LUXUEUSE
// ════════════════════════════════════════════════════════════════════════════

const LobbyPlant = memo(function LobbyPlant({ position = [0, 0, 0] as [number, number, number] }) {
  const leavesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.015
    }
  })

  return (
    <group position={position}>
      {/* Pot — base décorative */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.38, 0.1, 8]} />
        <meshStandardMaterial color="#2a2520" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Pot — corps */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.45, 8]} />
        <meshStandardMaterial color="#4a4050" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Pot — anneau décoratif */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.04, 8]} />
        <meshStandardMaterial color="#8b6914" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Terre */}
      <mesh position={[0, 0.56, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 8]} />
        <meshStandardMaterial color="#2a1e14" roughness={0.95} />
      </mesh>

      {/* Feuillage */}
      <group ref={leavesRef}>
        {/* Tronc */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
          <meshStandardMaterial color="#3a2a18" roughness={0.8} />
        </mesh>

        {/* Feuilles — plusieurs niveaux */}
        {[0, 50, 100, 150, 200, 250, 310].map((angle, i) => (
          <mesh
            key={`leaf-${i}`}
            position={[
              Math.sin((angle * Math.PI) / 180) * 0.06,
              0.85 + i * 0.06,
              Math.cos((angle * Math.PI) / 180) * 0.06,
            ]}
            rotation={[0.3 + i * 0.04, (angle * Math.PI) / 180, 0.15]}
            castShadow
          >
            <boxGeometry args={[0.06, 0.2, 0.015]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#1a6b3a' : '#15803d'} roughness={0.85} />
          </mesh>
        ))}

        {/* Feuilles grandes (palmier) */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <mesh
            key={`bigleaf-${i}`}
            position={[
              Math.sin((angle * Math.PI) / 180) * 0.15,
              1.1 + Math.sin(i) * 0.05,
              Math.cos((angle * Math.PI) / 180) * 0.15,
            ]}
            rotation={[0.5 + Math.random() * 0.3, (angle * Math.PI) / 180, 0.2]}
            castShadow
          >
            <boxGeometry args={[0.08, 0.35, 0.012]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#166534' : '#15803d'} roughness={0.88} />
          </mesh>
        ))}
      </group>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// LUSTRE / CHANDELIER
// ════════════════════════════════════════════════════════════════════════════

const Chandelier = memo(function Chandelier({ position = [0, 0, 0] as [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  const crystalsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.03
    }
    if (crystalsRef.current) {
      crystalsRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.y = state.clock.elapsedTime * 0.3 + i * 0.5
        }
      })
    }
  })

  return (
    <group position={position} ref={ref}>
      {/* Rosace de plafond */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
        <meshStandardMaterial color="#8b6914" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Rosace décor */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.02, 16]} />
        <meshStandardMaterial color="#6b4914" metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Chaîne */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`chain-${i}`} position={[0, 0.15 - i * 0.08, 0]}>
          <torusGeometry args={[0.02, 0.005, 4, 8]} />
          <meshStandardMaterial color="#8b6914" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Corps central */}
      <mesh castShadow position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.08, 0.15, 0.2, 12]} />
        <meshStandardMaterial color="#8b6914" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Disque principal */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.55, 0.04, 16]} />
        <meshStandardMaterial color="#8b6914" metalness={0.85} roughness={0.12} />
      </mesh>

      {/* Bras et lumières — 8 branches */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <group key={`arm-${i}`} rotation={[0, angle, 0]}>
            {/* Bras courbe */}
            <mesh position={[0.45, -0.45, 0]} rotation={[0, 0, Math.PI / 8]} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 0.55, 6]} />
              <meshStandardMaterial color="#8b6914" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Support bougie */}
            <mesh position={[0.65, -0.55, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.03, 0.04, 8]} />
              <meshStandardMaterial color="#8b6914" metalness={0.85} roughness={0.12} />
            </mesh>
            {/* Bougie */}
            <mesh position={[0.65, -0.45, 0]} castShadow>
              <cylinderGeometry args={[0.015, 0.02, 0.15, 6]} />
              <meshStandardMaterial color="#f5f0e0" roughness={0.6} />
            </mesh>
            {/* Flamme */}
            <mesh position={[0.65, -0.35, 0]}>
              <coneGeometry args={[0.02, 0.05, 6]} />
              <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={1.2} transparent opacity={0.9} />
            </mesh>
            {/* Lumière */}
            <pointLight
              position={[0.65, -0.35, 0]}
              intensity={0.25}
              color="#fef3c7"
              distance={3}
              decay={2}
            />
          </group>
        )
      })}

      {/* Cristaux pendants */}
      <group ref={crystalsRef}>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const radius = 0.35 + (i % 2) * 0.15
          return (
            <mesh
              key={`crystal-${i}`}
              position={[Math.cos(angle) * radius, -0.55 - Math.random() * 0.15, Math.sin(angle) * radius]}
            >
              <octahedronGeometry args={[0.02, 0]} />
              <meshStandardMaterial
                color="#ffffff"
                transparent
                opacity={0.6}
                roughness={0.05}
                metalness={0.3}
                emissive="#fef3c7"
                emissiveIntensity={0.15}
              />
            </mesh>
          )
        })}
      </group>

      {/* Lumière principale */}
      <pointLight position={[0, -0.3, 0]} intensity={1.5} color="#fef3c7" distance={8} decay={2} castShadow shadow-mapSize={[1024, 1024]} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// RECEPTION DESK — ENRICHI
// ════════════════════════════════════════════════════════════════════════════

const ReceptionDesk = memo(function ReceptionDesk({ position = [0, 0, 0] as [number, number, number] }) {
  const woodTex = useWoodTexture()
  const screenRef1 = useRef<THREE.Mesh>(null)
  const screenRef2 = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    [screenRef1, screenRef2].forEach((ref) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08
      }
    })
  })

  return (
    <group position={position}>
      {/* Comptoir principal — forme en L */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[6, 1.0, 1.2]} />
        <meshStandardMaterial map={woodTex} color="#2a1a0e" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Face avant — panneau décoratif */}
      <mesh position={[0, 0.5, 0.61]} castShadow>
        <boxGeometry args={[5.9, 0.95, 0.02]} />
        <meshStandardMaterial color="#1a1020" roughness={0.6} metalness={0.15} />
      </mesh>
      {/* Moulure dorée */}
      <mesh position={[0, 0.98, 0.62]}>
        <boxGeometry args={[5.95, 0.03, 0.01]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.04, 0.62]}>
        <boxGeometry args={[5.95, 0.03, 0.01]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Dessus du comptoir — marbre */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[6.1, 0.05, 1.35]} />
        <meshStandardMaterial color="#d4c8b0" roughness={0.2} metalness={0.35} />
      </mesh>

      {/* Partie arrière surélevée */}
      <mesh position={[0, 0.35, -0.7]} castShadow>
        <boxGeometry args={[5.8, 0.7, 0.4]} />
        <meshStandardMaterial map={woodTex} color="#2a1a0e" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Moniteurs — 3 écrans */}
      {[-2, 0, 2].map((x, i) => (
        <group key={`computer-${i}`} position={[x, 1.35, -0.3]}>
          {/* Écran */}
          <mesh castShadow>
            <boxGeometry args={[0.65, 0.45, 0.03]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Écran lumineux */}
          <mesh ref={i === 0 ? screenRef1 : i === 1 ? screenRef2 : undefined} position={[0, 0, 0.018]}>
            <boxGeometry args={[0.58, 0.38, 0.005]} />
            <meshStandardMaterial
              color="#0a1628"
              emissive={i === 1 ? '#3b82f6' : '#22c55e'}
              emissiveIntensity={0.4}
            />
          </mesh>
          {/* Bezel */}
          <mesh position={[0, 0, 0.016]}>
            <boxGeometry args={[0.62, 0.42, 0.002]} />
            <meshStandardMaterial color="#111827" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Pied */}
          <mesh position={[0, -0.3, 0.1]} castShadow>
            <boxGeometry args={[0.06, 0.15, 0.06]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Base */}
          <mesh position={[0, -0.38, 0.1]}>
            <boxGeometry args={[0.2, 0.02, 0.15]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Clavier */}
          <mesh position={[0, -0.35, 0.3]}>
            <boxGeometry args={[0.35, 0.015, 0.12]} />
            <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* Souris */}
          <mesh position={[0.25, -0.35, 0.3]}>
            <boxGeometry args={[0.05, 0.015, 0.08]} />
            <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Clochette de réception */}
      <mesh position={[0, 1.1, 0.35]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.06, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Bouton de clochette */}
      <mesh position={[0, 1.15, 0.35]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#c8a020" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Porte-stylos */}
      <mesh position={[-1, 1.08, 0.35]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Stylos */}
      {[-0.01, 0, 0.01].map((off, i) => (
        <mesh key={`pen-${i}`} position={[-1 + off, 1.17, 0.35 + off]} rotation={[0.05 * i, 0, 0.1 * (i - 1)]}>
          <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
          <meshStandardMaterial color={['#1a1a1a', '#0044aa', '#aa0000'][i]} roughness={0.4} />
        </mesh>
      ))}

      {/* Brochures / dépliants */}
      <mesh position={[1.5, 1.06, 0.3]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.15, 0.03, 0.22]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      <mesh position={[1.5, 1.08, 0.3]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.15, 0.03, 0.22]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.8} />
      </mesh>

      {/* Panneau "RÉCEPTION" */}
      <mesh position={[0, 1.65, 0.5]}>
        <boxGeometry args={[1.4, 0.35, 0.05]} />
        <meshStandardMaterial color="#1a1020" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.65, 0.528]}>
        <boxGeometry args={[1.3, 0.25, 0.005]} />
        <meshStandardMaterial color="#8b6914" emissive="#8b6914" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0, 1.65, 0.54]} fontSize={0.12} color="#fef3c7" anchorX="center" anchorY="middle" font="/fonts/inter-bold.woff">
        RÉCEPTION
      </Text>

      {/* Éclairage du comptoir */}
      <pointLight position={[0, 2, 0]} intensity={0.8} color="#fef3c7" distance={4} decay={2} />
      <pointLight position={[-2, 1.5, 0]} intensity={0.3} color="#3b82f6" distance={2} decay={2} />
      <pointLight position={[2, 1.5, 0]} intensity={0.3} color="#3b82f6" distance={2} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// ZONE ASCENSEUR — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

interface ElevatorAreaProps {
  position?: [number, number, number]
  onSelectFloor?: (floor: number) => void
}

const ElevatorArea = memo(function ElevatorArea({ position = [0, 0, 0], onSelectFloor }: ElevatorAreaProps) {
  const indicatorRef = useRef<THREE.Mesh>(null)
  const [currentFloor] = useState(1)

  useFrame((state) => {
    if (indicatorRef.current) {
      const mat = indicatorRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.15
    }
  })

  return (
    <group position={position}>
      {/* ═══ PORTES D'ASCENSEUR ═══ */}
      {/* Panneau gauche */}
      <mesh position={[-0.52, 1.4, 0]} castShadow>
        <boxGeometry args={[0.98, 2.7, 0.06]} />
        <meshStandardMaterial color="#5a5a6e" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Panneau droit */}
      <mesh position={[0.52, 1.4, 0]} castShadow>
        <boxGeometry args={[0.98, 2.7, 0.06]} />
        <meshStandardMaterial color="#5a5a6e" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Ligne de jonction */}
      <mesh position={[0, 1.4, 0.035]}>
        <boxGeometry args={[0.015, 2.65, 0.01]} />
        <meshStandardMaterial color="#3a3a4e" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Reflet sur portes */}
      <mesh position={[-0.3, 1.8, 0.035]}>
        <boxGeometry args={[0.3, 0.8, 0.002]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.03} metalness={0.9} roughness={0.05} />
      </mesh>

      {/* ═══ CADRE ═══ */}
      {/* Montant gauche */}
      <mesh position={[-1.15, 1.4, 0]} castShadow>
        <boxGeometry args={[0.2, 2.9, 0.2]} />
        <meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Montant droit */}
      <mesh position={[1.15, 1.4, 0]} castShadow>
        <boxGeometry args={[0.2, 2.9, 0.2]} />
        <meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Linteau */}
      <mesh position={[0, 2.95, 0]} castShadow>
        <boxGeometry args={[2.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Moulure dorée du cadre */}
      <mesh position={[-1.05, 1.4, 0.1]}>
        <boxGeometry args={[0.015, 2.8, 0.015]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
      </mesh>
      <mesh position={[1.05, 1.4, 0.1]}>
        <boxGeometry args={[0.015, 2.8, 0.015]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* ═══ INDICATEUR D'ÉTAGE ═══ */}
      <group position={[0, 3.25, 0.1]}>
        {/* Boîtier */}
        <mesh>
          <boxGeometry args={[0.6, 0.3, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Écran */}
        <mesh ref={indicatorRef} position={[0, 0, 0.035]}>
          <boxGeometry args={[0.5, 0.2, 0.005]} />
          <meshStandardMaterial color="#0a1628" emissive="#22c55e" emissiveIntensity={0.6} />
        </mesh>
        {/* Flèches directionnelles */}
        <mesh position={[-0.2, 0.05, 0.04]}>
          <boxGeometry args={[0.04, 0.06, 0.002]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ═══ PANNEAU D'APPEL ═══ */}
      <group position={[1.5, 1.2, 0.1]}>
        {/* Boîtier */}
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.35, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Cadre */}
        <mesh position={[0, 0, 0.032]}>
          <boxGeometry args={[0.16, 0.33, 0.005]} />
          <meshStandardMaterial color="#2a2a3e" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Bouton haut */}
        <mesh position={[0, 0.08, 0.04]}>
          <cylinderGeometry args={[0.03, 0.03, 0.015, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Flèche haut */}
        <mesh position={[0, 0.08, 0.05]}>
          <boxGeometry args={[0.015, 0.02, 0.002]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        {/* Bouton bas */}
        <mesh position={[0, -0.08, 0.04]}>
          <cylinderGeometry args={[0.03, 0.03, 0.015, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* ═══ SIGNALÉTIQUE ═══ */}
      <Text position={[0, 3.6, 0.1]} fontSize={0.15} color="#fef3c7" anchorX="center" anchorY="middle">
        ASCENSEUR
      </Text>

      {/* Sol devant ascenseur — marbre distinct */}
      <mesh position={[0, 0.005, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 2]} />
        <meshStandardMaterial color="#3a3a4e" roughness={0.2} metalness={0.4} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// ZONE DE REPOS — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

const SeatingArea = memo(function SeatingArea({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position}>
      {/* ═══ SOFAS ═══ */}
      {[-1.8, 1.8].map((z, i) => (
        <group key={`sofa-${i}`} position={[0, 0, z]} rotation={[0, i === 0 ? 0 : Math.PI, 0]}>
          {/* Assise */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[2.2, 0.2, 0.85]} />
            <meshStandardMaterial color="#1e293b" roughness={0.75} />
          </mesh>
          {/* Coussin d'assise */}
          <mesh position={[0, 0.4, 0.05]} castShadow>
            <boxGeometry args={[2.0, 0.08, 0.7]} />
            <meshStandardMaterial color="#2d3a5c" roughness={0.85} />
          </mesh>
          {/* Dossier */}
          <mesh position={[0, 0.6, -0.38]} castShadow>
            <boxGeometry args={[2.2, 0.65, 0.1]} />
            <meshStandardMaterial color="#1e293b" roughness={0.75} />
          </mesh>
          {/* Coussins de dossier */}
          {[-0.5, 0.5].map((xOff, ci) => (
            <mesh key={`cushion-${ci}`} position={[xOff, 0.6, -0.3]} castShadow>
              <boxGeometry args={[0.6, 0.5, 0.08]} />
              <meshStandardMaterial color="#334155" roughness={0.85} />
            </mesh>
          ))}
          {/* Accoudoirs */}
          <mesh position={[-1.05, 0.42, 0]} castShadow>
            <boxGeometry args={[0.1, 0.35, 0.85]} />
            <meshStandardMaterial color="#1e293b" roughness={0.75} />
          </mesh>
          <mesh position={[1.05, 0.42, 0]} castShadow>
            <boxGeometry args={[0.1, 0.35, 0.85]} />
            <meshStandardMaterial color="#1e293b" roughness={0.75} />
          </mesh>
          {/* Pieds */}
          {[[-0.9, -0.3], [-0.9, 0.3], [0.9, -0.3], [0.9, 0.3]].map(([x, zz], pi) => (
            <mesh key={`sleg-${pi}`} position={[x, 0.08, zz]}>
              <boxGeometry args={[0.04, 0.16, 0.04]} />
              <meshStandardMaterial color="#8b6914" roughness={0.3} metalness={0.6} />
            </mesh>
          ))}
          {/* Coussin décoratif */}
          <mesh position={[0.7, 0.55, 0.1]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.08]} />
            <meshStandardMaterial color="#f97316" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ═══ TABLE BASSE ═══ */}
      <group position={[0, 0, 0]}>
        {/* Plateau — verre */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[1.4, 0.03, 0.9]} />
          <meshPhysicalMaterial color="#a8c8d8" transmission={0.3} thickness={0.02} roughness={0.05} transparent opacity={0.7} metalness={0.1} />
        </mesh>
        {/* Cadre du plateau */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[1.42, 0.035, 0.02]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.02, 0.035, 0.9]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
        {/* Structure métallique */}
        {[[-0.6, -0.35], [-0.6, 0.35], [0.6, -0.35], [0.6, 0.35]].map(([x, z], i) => (
          <mesh key={`tleg-${i}`} position={[x, 0.15, z]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
          </mesh>
        ))}

        {/* Objets sur la table */}
        {/* Vase */}
        <mesh position={[-0.3, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.04, 0.18, 8]} />
          <meshStandardMaterial color="#2a4a6a" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Fleur */}
        <mesh position={[-0.3, 0.55, 0]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#ef4444" roughness={0.7} />
        </mesh>
        {/* Tige */}
        <mesh position={[-0.3, 0.48, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>

        {/* Magazines */}
        <mesh position={[0.25, 0.35, 0.05]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.18, 0.015, 0.25]} />
          <meshStandardMaterial color="#ef4444" roughness={0.7} />
        </mesh>
        <mesh position={[0.22, 0.37, 0.02]} rotation={[0, -0.15, 0]}>
          <boxGeometry args={[0.18, 0.015, 0.25]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.7} />
        </mesh>

        {/* Sous-verres */}
        <mesh position={[0.4, 0.34, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 8]} />
          <meshStandardMaterial color="#8b6914" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      {/* ═══ LAMPE DE TABLE ═══ */}
      <group position={[1.5, 0, 0]}>
        {/* Guéridon */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.04, 8]} />
          <meshStandardMaterial color="#2a1a0e" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 6]} />
          <meshStandardMaterial color="#8b6914" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Lampe */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
          <meshStandardMaterial color="#8b6914" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <coneGeometry args={[0.15, 0.2, 8, 1, true]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 0.65, 0]} intensity={0.4} color="#fef3c7" distance={3} decay={2} />
      </group>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PORTES D'ENTRÉE — ENRICHIES
// ════════════════════════════════════════════════════════════════════════════

interface EntranceDoorsProps {
  position?: [number, number, number]
  onExit?: () => void
}

const EntranceDoors = memo(function EntranceDoors({ position = [0, 0, 0], onExit }: EntranceDoorsProps) {
  return (
    <group position={position}>
      {/* ═══ PANNEAUX VITRÉS ═══ */}
      {[-1.5, 1.5].map((x, i) => (
        <group key={`door-${i}`}>
          {/* Verre */}
          <mesh position={[x, 1.6, 0]}>
            <boxGeometry args={[2.8, 3.1, 0.06]} />
            <meshPhysicalMaterial color="#88aacc" transmission={0.85} thickness={0.03} roughness={0.05} transparent opacity={0.25} metalness={0.8} ior={1.5} />
          </mesh>
          {/* Cadre */}
          <mesh position={[x, 1.6, 0]}>
            <boxGeometry args={[2.85, 3.15, 0.02]} />
            <meshStandardMaterial color="#4a4a5e" metalness={0.7} roughness={0.2} transparent opacity={0.3} />
          </mesh>
          {/* Barre de poussée */}
          <mesh position={[x + (i === 0 ? 0.8 : -0.8), 1.3, 0.06]}>
            <boxGeometry args={[0.03, 0.5, 0.04]} />
            <meshStandardMaterial color="#8b8b9e" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* ═══ CADRE PRINCIPAL ═══ */}
      {/* Montants */}
      {[-3, 0, 3].map((x, i) => (
        <mesh key={`frame-v-${i}`} position={[x, 1.6, 0]} castShadow>
          <boxGeometry args={[0.12, 3.3, 0.15]} />
          <meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Linteau */}
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[6.2, 0.15, 0.15]} />
        <meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ═══ CAPTEUR AUTOMATIQUE ═══ */}
      <mesh position={[0, 3.5, 0.15]}>
        <boxGeometry args={[0.3, 0.06, 0.08]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 3.48, 0.2]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />
      </mesh>

      {/* ═══ PANNEAU SORTIE ═══ */}
      <mesh position={[0, 3.6, 0]}>
        <boxGeometry args={[1.5, 0.4, 0.08]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 3.6, 0.045]}>
        <boxGeometry args={[1.4, 0.3, 0.005]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />
      </mesh>
      <Text position={[0, 3.6, 0.055]} fontSize={0.14} color="#ffffff" anchorX="center" anchorY="middle">
        ◄ SORTIE / EXIT ►
      </Text>

      {/* ═══ TAPIS D'ENTRÉE ═══ */}
      <mesh position={[0, 0.005, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.95} />
      </mesh>

      {/* Lumière d'entrée */}
      <spotLight position={[0, 3.8, 1]} angle={Math.PI / 4} penumbra={0.7} intensity={1.5} color="#fff8e0" castShadow shadow-mapSize={[512, 512]} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// HOTEL LOBBY — COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

interface HotelLobbyProps {
  onExitToCity?: () => void
  onGoToFloor?: (floor: number) => void
}

export const HotelLobby = memo(function HotelLobby({ onExitToCity, onGoToFloor }: HotelLobbyProps) {
  const floorTex = useLobbyFloorTexture()
  const wallTex = useWallTexture()
  const carpetTex = useCarpetTexture()
  const ceilingTex = useCeilingTexture()

  return (
    <group>
      {/* ══════ SOL ══════ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[LOBBY_WIDTH, LOBBY_DEPTH]} />
        <meshStandardMaterial map={floorTex} color="#c8bca4" roughness={0.25} metalness={0.25} envMapIntensity={0.4} />
      </mesh>

      {/* Bande centrale réfléchissante */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <planeGeometry args={[1, LOBBY_DEPTH - 2]} />
        <meshStandardMaterial color="#b8a888" roughness={0.1} metalness={0.5} />
      </mesh>

      {/* Motif de sol — médaillon central */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
        <circleGeometry args={[2.5, 24]} />
        <meshStandardMaterial color="#a89878" roughness={0.2} metalness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.017, 0]}>
        <ringGeometry args={[2.3, 2.5, 24]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Tapis persan — zone séjour */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0.012, 0]} receiveShadow>
        <planeGeometry args={[5, 6]} />
        <meshStandardMaterial map={carpetTex} color="#4a1a1a" roughness={0.9} />
      </mesh>

      {/* ══════ MURS ══════ */}
      {/* Mur arrière */}
      <mesh position={[0, LOBBY_HEIGHT / 2, -LOBBY_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[LOBBY_WIDTH, LOBBY_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial map={wallTex} color="#2a2a3e" roughness={0.85} />
      </mesh>
      {/* Mur gauche */}
      <mesh position={[-LOBBY_WIDTH / 2, LOBBY_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, LOBBY_HEIGHT, LOBBY_DEPTH]} />
        <meshStandardMaterial map={wallTex} color="#2a2a3e" roughness={0.85} />
      </mesh>
      {/* Mur droit */}
      <mesh position={[LOBBY_WIDTH / 2, LOBBY_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, LOBBY_HEIGHT, LOBBY_DEPTH]} />
        <meshStandardMaterial map={wallTex} color="#2a2a3e" roughness={0.85} />
      </mesh>
      {/* Mur avant — avec ouverture */}
      <mesh position={[-8, LOBBY_HEIGHT / 2, LOBBY_DEPTH / 2]} castShadow>
        <boxGeometry args={[8, LOBBY_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial map={wallTex} color="#2a2a3e" roughness={0.85} />
      </mesh>
      <mesh position={[8, LOBBY_HEIGHT / 2, LOBBY_DEPTH / 2]} castShadow>
        <boxGeometry args={[8, LOBBY_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial map={wallTex} color="#2a2a3e" roughness={0.85} />
      </mesh>
      <mesh position={[0, LOBBY_HEIGHT - 0.5, LOBBY_DEPTH / 2]} castShadow>
        <boxGeometry args={[8, 1, WALL_THICKNESS]} />
        <meshStandardMaterial map={wallTex} color="#2a2a3e" roughness={0.85} />
      </mesh>

      {/* Moulures murales (cimaise) */}
      {[
        [0, 3.5, -LOBBY_DEPTH / 2 + 0.12],
        [-LOBBY_WIDTH / 2 + 0.12, 3.5, 0],
        [LOBBY_WIDTH / 2 - 0.12, 3.5, 0],
      ].map((pos, i) => (
        <mesh key={`moulure-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[i === 0 ? LOBBY_WIDTH : 0.03, 0.04, i === 0 ? 0.03 : LOBBY_DEPTH]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
        </mesh>
      ))}
      {/* Moulure basse (plinthe) */}
      {[
        [0, 0.06, -LOBBY_DEPTH / 2 + 0.12],
        [-LOBBY_WIDTH / 2 + 0.12, 0.06, 0],
        [LOBBY_WIDTH / 2 - 0.12, 0.06, 0],
      ].map((pos, i) => (
        <mesh key={`plinthe-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[i === 0 ? LOBBY_WIDTH : 0.04, 0.12, i === 0 ? 0.04 : LOBBY_DEPTH]} />
          <meshStandardMaterial color="#1a1020" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}

      {/* ══════ PLAFOND ══════ */}
      <mesh position={[0, LOBBY_HEIGHT, 0]}>
        <boxGeometry args={[LOBBY_WIDTH, 0.15, LOBBY_DEPTH]} />
        <meshStandardMaterial map={ceilingTex} color="#1a1a2a" roughness={0.9} />
      </mesh>

      {/* Corniche de plafond */}
      {[
        [0, LOBBY_HEIGHT - 0.08, -LOBBY_DEPTH / 2 + 0.2],
        [0, LOBBY_HEIGHT - 0.08, LOBBY_DEPTH / 2 - 0.2],
        [-LOBBY_WIDTH / 2 + 0.2, LOBBY_HEIGHT - 0.08, 0],
        [LOBBY_WIDTH / 2 - 0.2, LOBBY_HEIGHT - 0.08, 0],
      ].map((pos, i) => (
        <mesh key={`corniche-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[i < 2 ? LOBBY_WIDTH : 0.15, 0.15, i < 2 ? 0.15 : LOBBY_DEPTH]} />
          <meshStandardMaterial color="#3a3a4e" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* ══════ COLONNES ══════ */}
      <DecorativeColumn position={[-6, 0, -3]} />
      <DecorativeColumn position={[6, 0, -3]} />
      <DecorativeColumn position={[-6, 0, 4]} />
      <DecorativeColumn position={[6, 0, 4]} />

      {/* ══════ COMPOSANTS PRINCIPAUX ══════ */}
      <ReceptionDesk position={[0, 0, -6]} />
      <ElevatorArea position={[-9.5, 0, -2]} onSelectFloor={onGoToFloor} />
      <SeatingArea position={[6, 0, 0]} />
      <EntranceDoors position={[0, 0, LOBBY_DEPTH / 2 - 0.1]} onExit={onExitToCity} />

      {/* ══════ FONTAINE ══════ */}
      <LobbyFountain position={[0, 0, 1]} />

      {/* ══════ PLANTES ══════ */}
      <LobbyPlant position={[-9, 0, 6]} />
      <LobbyPlant position={[9, 0, 6]} />
      <LobbyPlant position={[-9, 0, -6]} />
      <LobbyPlant position={[9, 0, -6]} />
      <LobbyPlant position={[-3, 0, -3]} />
      <LobbyPlant position={[3, 0, -3]} />

      {/* ══════ TABLEAUX ══════ */}
      <WallPainting position={[-4, 2.5, -LOBBY_DEPTH / 2 + 0.15]} size={[1.5, 1.0]} />
      <WallPainting position={[4, 2.5, -LOBBY_DEPTH / 2 + 0.15]} size={[1.5, 1.0]} />
      <WallPainting position={[-LOBBY_WIDTH / 2 + 0.15, 2.5, -4]} rotation={[0, Math.PI / 2, 0]} size={[1.2, 0.8]} />
      <WallPainting position={[LOBBY_WIDTH / 2 - 0.15, 2.5, -4]} rotation={[0, -Math.PI / 2, 0]} size={[1.2, 0.8]} />

      {/* ══════ LUSTRE PRINCIPAL ══════ */}
      <Chandelier position={[0, LOBBY_HEIGHT - 0.2, 0]} />

      {/* ══════ PANNEAU DE BIENVENUE ══════ */}
      <group position={[0, 3.5, -LOBBY_DEPTH / 2 + 0.15]}>
        <mesh>
          <boxGeometry args={[7, 0.9, 0.08]} />
          <meshStandardMaterial color="#0f1419" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Bordure dorée */}
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[6.9, 0.85, 0.005]} />
          <meshStandardMaterial color="#1a1020" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.048]}>
          <boxGeometry args={[7.05, 0.02, 0.003]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.44, 0.048]}>
          <boxGeometry args={[7.05, 0.02, 0.003]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.44, 0.048]}>
          <boxGeometry args={[7.05, 0.02, 0.003]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
        <Text position={[0, 0.12, 0.06]} fontSize={0.3} color="#f97316" anchorX="center" anchorY="middle">
          HÔTEL ETHERWORLD
        </Text>
        <Text position={[0, -0.18, 0.06]} fontSize={0.12} color="#fef3c7" anchorX="center" anchorY="middle">
          BIENVENUE • WELCOME • BIENVENIDO
        </Text>
      </group>

      {/* ══════ PARTICULES ATMOSPHÉRIQUES ══════ */}
      <LobbyDustParticles />

      {/* ══════ ÉCLAIRAGE ══════ */}
      <ambientLight intensity={0.25} color="#fef3c7" />
      <directionalLight
        position={[5, LOBBY_HEIGHT + 2, 5]}
        intensity={0.3}
        color="#fff8e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={30}
        shadow-camera-near={0.1}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0003}
      />
      <hemisphereLight color="#fef3c7" groundColor="#1a1020" intensity={0.2} />

      {/* Spots d'accent */}
      {[
        [-6, LOBBY_HEIGHT - 0.5, -3],
        [6, LOBBY_HEIGHT - 0.5, -3],
        [-6, LOBBY_HEIGHT - 0.5, 4],
        [6, LOBBY_HEIGHT - 0.5, 4],
      ].map((pos, i) => (
        <pointLight key={`accent-${i}`} position={pos as [number, number, number]} intensity={0.4} color="#fef3c7" distance={6} decay={2} />
      ))}

      {/* Spots de la réception */}
      <spotLight position={[0, LOBBY_HEIGHT - 0.5, -5]} angle={Math.PI / 5} penumbra={0.6} intensity={1.2} color="#fef3c7" castShadow shadow-mapSize={[512, 512]} />

      {/* Lumière d'entrée (lumière du jour) */}
      <spotLight position={[0, LOBBY_HEIGHT, LOBBY_DEPTH / 2 + 2]} angle={Math.PI / 3} penumbra={0.8} intensity={0.8} color="#e8e0d0" />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// HOTEL CORRIDOR SCENE — ENRICHI
// ════════════════════════════════════════════════════════════════════════════

interface HotelCorridorSceneProps {
  floor?: number
  onEnterRoom?: (roomId: string) => void
  onGoToLobby?: () => void
}

export const HotelCorridorScene = memo(function HotelCorridorScene({
  floor = 1,
  onEnterRoom,
  onGoToLobby
}: HotelCorridorSceneProps) {
  const wallTex = useWallTexture()
  const carpetTex = useCarpetTexture()

  const occupiedRooms = useMemo(() => ['101', '103', '105', '107', '109', '112'], [])
  const lockedRooms = useMemo(() => ['102', '106', '110'], [])

  const rooms = useMemo(() => {
    const result: Array<{
      number: string
      side: 'left' | 'right'
      z: number
      occupied: boolean
      locked: boolean
    }> = []

    for (let i = 0; i < ROOMS_PER_SIDE; i++) {
      const leftNum = `${floor}${String(i * 2 + 1).padStart(2, '0')}`
      const rightNum = `${floor}${String(i * 2 + 2).padStart(2, '0')}`
      const z = -CORRIDOR_LENGTH / 2 + 2 + i * ROOM_SPACING

      results.push({
        number: leftNum,
        side: 'left',
        z,
        occupied: occupiedRooms.includes(leftNum),
        locked: lockedRooms.includes(leftNum),
      })
      result.push({
        number: rightNum,
        side: 'right',
        z: z + ROOM_SPACING * 0.4,
        occupied: occupiedRooms.includes(rightNum),
        locked: lockedRooms.includes(rightNum),
      })
    }
    return result
  }, [floor, occupiedRooms, lockedRooms])

  return (
    <group>
      {/* ══════ SOL ══════ */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[CORRIDOR_WIDTH, 0.1, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Tapis de couloir */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.02, CORRIDOR_LENGTH - 1]} />
        <meshStandardMaterial map={carpetTex} color="#4a1a1a" roughness={0.92} />
      </mesh>

      {/* Lignes de sol */}
      <mesh position={[-0.05, 0.065, 0]}>
        <boxGeometry args={[0.02, 0.005, CORRIDOR_LENGTH - 1.5]} />
        <meshStandardMaterial color="#8b6914" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0.05, 0.065, 0]}>
        <boxGeometry args={[0.02, 0.005, CORRIDOR_LENGTH - 1.5]} />
        <meshStandardMaterial color="#8b6914" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* ══════ MURS ══════ */}
      <mesh position={[-CORRIDOR_WIDTH / 2, 1.5, 0]} castShadow>
        <boxGeometry args={[WALL_THICKNESS, 3, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={wallTex} color="#2a2a3e" roughness={0.85} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2, 1.5, 0]} castShadow>
        <boxGeometry args={[WALL_THICKNESS, 3, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={wallTex} color="#2a2a3e" roughness={0.85} />
      </mesh>

      {/* Plinthes */}
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.08, 0.06, 0]}>
        <boxGeometry args={[0.03, 0.12, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#1a1020" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2 - 0.08, 0.06, 0]}>
        <boxGeometry args={[0.03, 0.12, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#1a1020" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Cimaise */}
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.08, 2.2, 0]}>
        <boxGeometry args={[0.02, 0.03, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2 - 0.08, 2.2, 0]}>
        <boxGeometry args={[0.02, 0.03, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* ══════ PLAFOND ══════ */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[CORRIDOR_WIDTH, 0.1, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
      </mesh>

      {/* ══════ LUMIÈRES AU PLAFOND ══════ */}
      {Array.from({ length: Math.floor(CORRIDOR_LENGTH / 4) }).map((_, i) => {
        const z = -CORRIDOR_LENGTH / 2 + 2 + i * 4
        return (
          <group key={`clight-${i}`} position={[0, 2.92, z]}>
            {/* Boîtier */}
            <mesh>
              <boxGeometry args={[0.6, 0.06, 0.3]} />
              <meshStandardMaterial color="#2a2a3e" roughness={0.5} metalness={0.4} />
            </mesh>
            {/* Surface lumineuse */}
            <mesh position={[0, -0.02, 0]}>
              <boxGeometry args={[0.5, 0.015, 0.25]} />
              <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.7} />
            </mesh>
            <pointLight position={[0, -0.15, 0]} intensity={0.7} color="#fff5e6" distance={4} decay={2} />
          </group>
        )
      })}

      {/* ══════ PORTES DE CHAMBRES ══════ */}
      {rooms.map(room => (
        <RoomDoor
          key={room.number}
          position={[
            room.side === 'left' ? -CORRIDOR_WIDTH / 2 + WALL_THICKNESS / 2 + 0.01 : CORRIDOR_WIDTH / 2 - WALL_THICKNESS / 2 - 0.01,
            0,
            room.z,
          ]}
          rotation={[0, room.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
          roomNumber={room.number}
          isOccupied={room.occupied}
          isLocked={room.locked}
          onEnter={() => onEnterRoom?.(room.number)}
        />
      ))}

      {/* ══════ EXTINCTEUR ══════ */}
      <group position={[-CORRIDOR_WIDTH / 2 + 0.15, 0.8, 2]}>
        <mesh position={[0, 0.05, -0.035]}>
          <boxGeometry args={[0.1, 0.18, 0.015]} />
          <meshStandardMaterial color="#1a1e30" roughness={0.6} metalness={0.5} />
        </mesh>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
          <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.05, 0.06, 0.025]} />
          <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.5} />
        </mesh>
      </group>

      {/* ══════ TABLEAUX DANS LE COULOIR ══════ */}
      {Array.from({ length: 3 }).map((_, i) => (
        <WallPainting
          key={`corridor-painting-${i}`}
          position={[
            i % 2 === 0 ? -CORRIDOR_WIDTH / 2 + 0.15 : CORRIDOR_WIDTH / 2 - 0.15,
            2.0,
            -6 + i * 6,
          ]}
          rotation={[0, i % 2 === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
          size={[0.8, 0.6]}
        />
      ))}

      {/* ══════ PANNEAU SORTIE ══════ */}
      <mesh position={[0, 2.6, CORRIDOR_LENGTH / 2 - 0.5]}>
        <boxGeometry args={[0.6, 0.25, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.6, CORRIDOR_LENGTH / 2 - 0.47]}>
        <boxGeometry args={[0.5, 0.18, 0.01]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.7} />
      </mesh>

      {/* ══════ ASCENSEUR AU DÉBUT ══════ */}
      <group position={[0, 0, -CORRIDOR_LENGTH / 2 + 0.5]}>
        {/* Portes */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[1.8, 2.7, 0.06]} />
          <meshStandardMaterial color="#5a5a6e" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.4, 0.035]}>
          <boxGeometry args={[0.015, 2.6, 0.01]} />
          <meshStandardMaterial color="#3a3a4e" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Cadre */}
        <mesh position={[-1.05, 1.4, 0]} castShadow>
          <boxGeometry args={[0.15, 2.9, 0.15]} />
          <meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[1.05, 1.4, 0]} castShadow>
          <boxGeometry args={[0.15, 2.9, 0.15]} />
          <meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.9, 0]} castShadow>
          <boxGeometry args={[2.25, 0.15, 0.15]} />
          <meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} />
        </mesh>

        <Text position={[0, 3.15, 0.1]} fontSize={0.14} color="#fef3c7" anchorX="center" anchorY="middle">
          ÉTAGE {floor}
        </Text>

        {/* Indicateur */}
        <mesh position={[0, 3.05, 0.1]}>
          <boxGeometry args={[0.5, 0.2, 0.04]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 3.05, 0.125]}>
          <boxGeometry args={[0.4, 0.12, 0.005]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* ══════ ÉCLAIRAGE ══════ */}
      <ambientLight intensity={0.15} color="#fef3c7" />
      <hemisphereLight color="#fef3c7" groundColor="#1a1020" intensity={0.12} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// ROOM DOOR — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

interface RoomDoorProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  roomNumber: string
  isOccupied?: boolean
  isLocked?: boolean
  onEnter?: () => void
}

const RoomDoor = memo(function RoomDoor({
  position,
  rotation = [0, 0, 0],
  roomNumber,
  isOccupied = false,
  isLocked = false,
  onEnter
}: RoomDoorProps) {
  const ledRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const woodTex = useWoodTexture()

  useFrame((state) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2.5) * 0.2
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.08 + Math.sin(state.clock.elapsedTime * 1.2 + parseInt(roomNumber) * 0.5) * 0.03
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* ═══ CADRE ═══ */}
      {/* Montant supérieur */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[1.0, 0.08, 0.1]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Montants latéraux */}
      <mesh position={[-0.48, 1.1, 0]} castShadow>
        <boxGeometry args={[0.06, 2.2, 0.1]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0.48, 1.1, 0]} castShadow>
        <boxGeometry args={[0.06, 2.2, 0.1]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Cadre doré intérieur */}
      <mesh ref={glowRef} position={[0, 1.1, 0.04]}>
        <boxGeometry args={[0.88, 2.1, 0.003]} />
        <meshStandardMaterial color="#1a1020" emissive="#8b6914" emissiveIntensity={0.08} transparent opacity={0.6} />
      </mesh>

      {/* ═══ PORTE ═══ */}
      <mesh position={[0, 1.1, 0.05]} castShadow>
        <boxGeometry args={[0.85, 2.05, 0.05]} />
        <meshStandardMaterial
          map={woodTex}
          color={isLocked ? '#2a1a1a' : '#1e1820'}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>

      {/* Panneaux de porte */}
      <mesh position={[0, 1.55, 0.078]}>
        <boxGeometry args={[0.6, 0.7, 0.005]} />
        <meshStandardMaterial color={isLocked ? '#251518' : '#16121e'} roughness={0.65} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.65, 0.078]}>
        <boxGeometry args={[0.6, 0.7, 0.005]} />
        <meshStandardMaterial color={isLocked ? '#251518' : '#16121e'} roughness={0.65} metalness={0.15} />
      </mesh>

      {/* ═══ POIGNÉE ═══ */}
      <group position={[0.3, 1.05, 0.09]}>
        {/* Rosace */}
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.015, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#8b6914" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Poignée */}
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
          <meshStandardMaterial color="#8b6914" metalness={0.85} roughness={0.12} />
        </mesh>
        {/* Bec de poignée */}
        <mesh position={[0, -0.02, 0.06]}>
          <boxGeometry args={[0.015, 0.04, 0.02]} />
          <meshStandardMaterial color="#8b6914" metalness={0.85} roughness={0.12} />
        </mesh>
      </group>

      {/* ═══ SERRURE / LECTEUR DE CARTE ═══ */}
      <group position={[0.3, 1.25, 0.09]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.1, 0.025]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Fente carte */}
        <mesh position={[0, -0.02, 0.014]}>
          <boxGeometry args={[0.04, 0.005, 0.005]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
        {/* LED du lecteur */}
        <mesh ref={ledRef} position={[0, 0.03, 0.014]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial
            color={isLocked ? '#ef4444' : '#22c55e'}
            emissive={isLocked ? '#ef4444' : '#22c55e'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* ═══ JUDAS ═══ */}
      <mesh position={[0, 1.7, 0.08]}>
        <cylinderGeometry args={[0.01, 0.01, 0.015, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.7, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.013, 0.002, 6, 12]} />
        <meshStandardMaterial color="#8b6914" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* ═══ PLAQUE DE NUMÉRO ═══ */}
      <group position={[0, 1.9, 0.09]}>
        <mesh>
          <boxGeometry args={[0.22, 0.12, 0.01]} />
          <meshStandardMaterial color="#0f1419" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Bordure dorée */}
        <mesh position={[0, 0, -0.001]}>
          <boxGeometry args={[0.24, 0.14, 0.005]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
        <Text position={[0, 0, 0.008]} fontSize={0.06} color="#fef3c7" anchorX="center" anchorY="middle">
          {roomNumber}
        </Text>
      </group>

      {/* ═══ INDICATEUR D'OCCUPATION ═══ */}
      <mesh position={[-0.35, 1.9, 0.09]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial
          color={isOccupied ? '#ef4444' : '#22c55e'}
          emissive={isOccupied ? '#ef4444' : '#22c55e'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Halo LED */}
      <pointLight
        position={[0.3, 1.25, 0.2]}
        intensity={0.08}
        color={isLocked ? '#ef4444' : '#22c55e'}
        distance={0.8}
        decay={2}
      />

      {/* ═══ PAILLASSON ═══ */}
      <mesh position={[0, 0.005, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 0.35]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.95} />
      </mesh>

      {/* Lumière fuite sous porte (si occupé) */}
      {isOccupied && !isLocked && (
        <>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.75, 0.05]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} transparent opacity={0.5} />
          </mesh>
          <pointLight position={[0, 0.1, -0.2]} intensity={0.15} color="#fef3c7" distance={1} />
        </>
      )}
    </group>
  )
})