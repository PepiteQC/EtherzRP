'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const CORRIDOR_WIDTH = 6
const CORRIDOR_HEIGHT = 5
const CORRIDOR_LENGTH = 35
const DOOR_SPACING = 6
const NUM_DOORS_PER_SIDE = 5
const WALL_THICKNESS = 0.12
const CORRIDOR_START_Z = 5.2
const PLAYER_ROOM_DOOR_SIDE = 'left'
const PLAYER_ROOM_DOOR_INDEX = 4
export const PLAYER_DOOR_Z = CORRIDOR_START_Z + 3 + PLAYER_ROOM_DOOR_INDEX * DOOR_SPACING

// ════════════════════════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES
// ════════════════════════════════════════════════════════════════════════════

function createCanvasTexture(
  w: number, h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping
  if (repeat) tex.repeat.set(repeat[0], repeat[1])
  tex.needsUpdate = true
  return tex
}

function useFloorTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#22223a'
    ctx.fillRect(0, 0, w, h)
    const ts = w / 4
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = c * ts, y = r * ts
      const s = 30 + Math.random() * 8
      ctx.fillStyle = `rgb(${s + 4},${s},${s + 14})`
      ctx.fillRect(x + 1.5, y + 1.5, ts - 3, ts - 3)
      const grad = ctx.createLinearGradient(x, y, x + ts, y + ts)
      grad.addColorStop(0, 'rgba(255,255,255,0.02)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.fillRect(x + 1.5, y + 1.5, ts - 3, ts - 3)
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(x, y, ts, 1.5)
      ctx.fillRect(x, y, 1.5, ts)
    }
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${60 + Math.random() * 40},${40 + Math.random() * 30},${120 + Math.random() * 40},0.08)`
      ctx.lineWidth = 0.8
      ctx.beginPath()
      let x = Math.random() * w, y = Math.random() * h
      ctx.moveTo(x, y)
      for (let j = 0; j < 4; j++) { x += (Math.random() - 0.5) * 80; y += (Math.random() - 0.5) * 80; ctx.lineTo(x, y) }
      ctx.stroke()
    }
  }, [CORRIDOR_WIDTH * 1.5, CORRIDOR_LENGTH / 3]), [])
}

function useCarpetTexture() {
  return useMemo(() => createCanvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3a3a5e'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#5a5a8e'; ctx.lineWidth = 4; ctx.strokeRect(6, 6, w - 12, h - 12)
    ctx.strokeStyle = '#4a4a7e'; ctx.lineWidth = 2; ctx.strokeRect(12, 12, w - 24, h - 24)
    const pH = 35
    for (let y = 18; y < h - 18; y += pH) {
      ctx.fillStyle = 'rgba(100,80,180,0.25)'; ctx.save(); ctx.translate(w / 2, y + pH / 2); ctx.rotate(Math.PI / 4); ctx.fillRect(-8, -8, 16, 16); ctx.restore()
      for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
        ctx.fillStyle = 'rgba(140,120,220,0.2)'; ctx.beginPath(); ctx.arc(w / 2 + px * 15, y + pH / 2 + py * 10, 2.5, 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.strokeStyle = 'rgba(180,140,40,0.15)'; ctx.lineWidth = 0.8
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(w / 2, h / 2, 18 + i * 12, 0, Math.PI * 2); ctx.stroke() }
  }, [1, CORRIDOR_LENGTH / 4]), [])
}

function useWallTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#28284a'
    ctx.fillRect(0, 0, w, h)
    const pH = h / 4
    for (let i = 0; i < 4; i++) {
      const y = i * pH, s = 36 + Math.random() * 6
      ctx.fillStyle = `rgb(${s + 4},${s},${s + 24})`
      ctx.fillRect(3, y + 2, w - 6, pH - 4)
      ctx.strokeStyle = 'rgba(80,60,160,0.07)'; ctx.lineWidth = 0.8; ctx.strokeRect(3, y + 2, w - 6, pH - 4)
    }
    for (let i = 0; i < 800; i++) {
      const s = 32 + Math.random() * 8
      ctx.fillStyle = `rgba(${s},${s},${s + 10},0.03)`
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
  }, [1, 2]), [])
}

function useCeilingTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2a2a4a'
    ctx.fillRect(0, 0, w, h)
    const gs = 64
    for (let x = 0; x < w; x += gs) for (let y = 0; y < h; y += gs) {
      const s = 38 + Math.random() * 4
      ctx.fillStyle = `rgb(${s},${s},${s + 10})`
      ctx.fillRect(x + 2, y + 2, gs - 4, gs - 4)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      for (let px = 0; px < 3; px++) for (let py = 0; py < 3; py++) {
        ctx.beginPath(); ctx.arc(x + 14 + px * 16, y + 14 + py * 16, 1.5, 0, Math.PI * 2); ctx.fill()
      }
    }
  }, [CORRIDOR_WIDTH * 0.8, CORRIDOR_LENGTH / 4]), [])
}

function useDoorTexture() {
  return useMemo(() => createCanvasTexture(128, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#1a1525'); grad.addColorStop(0.5, '#1e1830'); grad.addColorStop(1, '#150e20')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 2) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.01})`; ctx.fillRect(0, y, w, 1) }
    ctx.strokeStyle = 'rgba(80,50,150,0.08)'; ctx.lineWidth = 1
    ctx.strokeRect(10, 14, w - 20, h * 0.36); ctx.strokeRect(10, h * 0.46, w - 20, h * 0.36)
  }), [])
}

// ════════════════════════════════════════════════════════════════════════════
// PARTICULES
// ════════════════════════════════════════════════════════════════════════════

const AtmosphericParticles = memo(function AtmosphericParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 250

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3), spd = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * CORRIDOR_WIDTH * 0.85
      pos[i * 3 + 1] = Math.random() * CORRIDOR_HEIGHT
      pos[i * 3 + 2] = CORRIDOR_START_Z + Math.random() * CORRIDOR_LENGTH
      spd[i * 3] = (Math.random() - 0.5) * 0.005; spd[i * 3 + 1] = (Math.random() - 0.5) * 0.003; spd[i * 3 + 2] = (Math.random() - 0.5) * 0.004
    }
    return { positions: pos, speeds: spd }
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      attr.array[i * 3] += speeds[i * 3] + Math.sin(t * 0.2 + i) * 0.0003
      attr.array[i * 3 + 1] += speeds[i * 3 + 1]
      attr.array[i * 3 + 2] += speeds[i * 3 + 2]
      if (Math.abs(attr.array[i * 3] as number) > CORRIDOR_WIDTH / 2) (attr.array as Float32Array)[i * 3] *= -0.9
      if ((attr.array[i * 3 + 1] as number) > CORRIDOR_HEIGHT || (attr.array[i * 3 + 1] as number) < 0) (attr.array as Float32Array)[i * 3 + 1] = Math.random() * CORRIDOR_HEIGHT
      if ((attr.array[i * 3 + 2] as number) > CORRIDOR_START_Z + CORRIDOR_LENGTH || (attr.array[i * 3 + 2] as number) < CORRIDOR_START_Z) (attr.array as Float32Array)[i * 3 + 2] = CORRIDOR_START_Z + Math.random() * CORRIDOR_LENGTH
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.012} color="#a78bfa" transparent opacity={0.22} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PORTE DE CORRIDOR — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

interface CorridorDoorProps {
  position: [number, number, number]
  rotation: [number, number, number]
  number: string
  isLocked: boolean
  isPlayerRoom: boolean
  side: 'left' | 'right'
}

const CorridorDoor = memo(function CorridorDoor({ position, rotation, number, isLocked, isPlayerRoom, side }: CorridorDoorProps) {
  const ledRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const doorTex = useDoorTexture()

  useFrame((state) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2.5) * 0.25
    }
    if (glowRef.current && isPlayerRoom) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.25 + Math.sin(state.clock.elapsedTime * 1.8) * 0.1
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* ══ CADRE ══ */}
      <mesh position={[0, 1.95, 0]}>
        <boxGeometry args={[1.85, 0.08, 0.16]} />
        <meshStandardMaterial color="#0a0a12" roughness={0.4} metalness={0.3} />
      </mesh>
      {[-0.9, 0.9].map((x, i) => (
        <mesh key={`jamb-${i}`} position={[x, 0.95, 0]}>
          <boxGeometry args={[0.07, 1.95, 0.16]} />
          <meshStandardMaterial color="#0a0a12" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}

      {/* Moulure dorée intérieure */}
      <mesh ref={glowRef} position={[0, 0.95, 0.045]}>
        <boxGeometry args={[1.72, 1.85, 0.003]} />
        <meshStandardMaterial
          color={isPlayerRoom ? '#0a1a10' : '#0a0a14'}
          emissive={isPlayerRoom ? '#8b5cf6' : '#4c1d95'}
          emissiveIntensity={isPlayerRoom ? 0.25 : 0.04}
          transparent opacity={0.7}
        />
      </mesh>

      {/* ══ PANNEAU DE PORTE ══ */}
      <mesh position={[0, 0.95, 0.055]} castShadow>
        <boxGeometry args={[1.68, 1.82, 0.06]} />
        <meshStandardMaterial
          map={doorTex}
          color={isPlayerRoom ? '#1a1a3e' : '#1f1f2e'}
          metalness={0.2} roughness={0.65}
        />
      </mesh>

      {/* Panneaux encastrés */}
      <mesh position={[0, 1.42, 0.088]}>
        <boxGeometry args={[1.2, 0.65, 0.008]} />
        <meshStandardMaterial color={isPlayerRoom ? '#14142e' : '#18181e'} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.52, 0.088]}>
        <boxGeometry args={[1.2, 0.65, 0.008]} />
        <meshStandardMaterial color={isPlayerRoom ? '#14142e' : '#18181e'} roughness={0.7} />
      </mesh>

      {/* Lignes décoratives */}
      <mesh position={[0, 1.78, 0.09]}>
        <boxGeometry args={[1.3, 0.025, 0.008]} />
        <meshStandardMaterial color="#2a2a4e" metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.12, 0.09]}>
        <boxGeometry args={[1.3, 0.025, 0.008]} />
        <meshStandardMaterial color="#2a2a4e" metalness={0.3} />
      </mesh>

      {/* Néon vertical */}
      <mesh position={[side === 'left' ? 0.72 : -0.72, 0.95, 0.09]}>
        <boxGeometry args={[0.005, 1.6, 0.004]} />
        <meshStandardMaterial
          color={isPlayerRoom ? '#8b5cf6' : '#4c1d95'}
          emissive={isPlayerRoom ? '#8b5cf6' : '#4c1d95'}
          emissiveIntensity={isPlayerRoom ? 0.5 : 0.2}
        />
      </mesh>

      {/* ══ POIGNÉE LEVIER ══ */}
      <group position={[side === 'left' ? 0.62 : -0.62, 0.85, 0.1]}>
        <mesh>
          <cylinderGeometry args={[0.022, 0.022, 0.02, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.06, 6]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.12} />
        </mesh>
        <mesh position={[0, -0.02, 0.06]}>
          <boxGeometry args={[0.014, 0.04, 0.02]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.12} />
        </mesh>
      </group>

      {/* ══ LECTEUR DE CARTE ══ */}
      <group position={[side === 'left' ? 0.62 : -0.62, 1.1, 0.09]}>
        <mesh castShadow>
          <boxGeometry args={[0.06, 0.1, 0.025]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh position={[0, -0.02, 0.015]}>
          <boxGeometry args={[0.04, 0.005, 0.005]} />
          <meshStandardMaterial color="#050508" />
        </mesh>
        <mesh ref={ledRef} position={[0, 0.03, 0.015]}>
          <sphereGeometry args={[0.007, 6, 6]} />
          <meshStandardMaterial
            color={isLocked ? '#ef4444' : '#22c55e'}
            emissive={isLocked ? '#ef4444' : '#22c55e'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* ══ JUDAS ══ */}
      <mesh position={[0, 1.55, 0.09]}>
        <cylinderGeometry args={[0.012, 0.012, 0.015, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#080810" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.55, 0.098]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.015, 0.003, 6, 12]} />
        <meshStandardMaterial color="#8b6914" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ══ PLAQUE NUMÉRO ══ */}
      <group position={[0, 1.72, 0.095]}>
        <mesh position={[0, 0, -0.002]}>
          <boxGeometry args={[0.34, 0.14, 0.006]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.32, 0.12, 0.008]} />
          <meshStandardMaterial
            color={isPlayerRoom ? '#1a1040' : '#0f0e18'}
            emissive={isPlayerRoom ? '#8b5cf6' : '#000000'}
            emissiveIntensity={isPlayerRoom ? 0.3 : 0}
            metalness={0.5} roughness={0.35}
          />
        </mesh>
        <Text position={[0, 0, 0.006]} fontSize={0.055} color="#fef3c7" anchorX="center" anchorY="middle">
          {number}
        </Text>
      </group>

      {/* ══ PAILLASSON ══ */}
      <mesh position={[0, 0.006, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.4]} />
        <meshStandardMaterial color="#1a1020" roughness={0.96} />
      </mesh>

      {/* ══ PLAYER ROOM GLOW ══ */}
      {isPlayerRoom && (
        <>
          <pointLight position={[0, 1.2, 0.35]} intensity={0.5} color="#8b5cf6" distance={3.5} decay={2} />
          <mesh position={[0, 0.008, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 0.08]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} transparent opacity={0.5} />
          </mesh>
        </>
      )}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// LUMIÈRE PLAFOND — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

const CorridorLight = memo(function CorridorLight({ position, index }: { position: [number, number, number]; index: number }) {
  const lightRef = useRef<THREE.PointLight>(null)
  const panelRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const flicker = Math.sin(state.clock.elapsedTime * 0.8 + index * 1.5) * 0.06
    if (lightRef.current) lightRef.current.intensity = 2.5 + flicker
    if (panelRef.current) {
      const mat = panelRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.85 + flicker
    }
  })

  return (
    <group position={position}>
      {/* Boîtier */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 0.06, 0.25]} />
        <meshStandardMaterial color="#1f2937" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* Panel LED */}
      <mesh ref={panelRef} position={[0, -0.025, 0]}>
        <boxGeometry args={[0.48, 0.015, 0.2]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.85} />
      </mesh>
      {/* Grille */}
      {[-0.14, 0, 0.14].map((x, i) => (
        <mesh key={i} position={[x, -0.032, 0]}>
          <boxGeometry args={[0.008, 0.005, 0.18]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {/* Main light */}
      <pointLight ref={lightRef} position={[0, -0.15, 0]} intensity={2.5} color="#fef3c7" distance={10} decay={2} castShadow={index % 2 === 0} shadow-mapSize={[512, 512]} shadow-bias={-0.001} />
      {/* Fill */}
      <pointLight position={[0, -0.3, 0]} intensity={1.2} color="#fef3c7" distance={7} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// APPLIQUES MURALES NÉON
// ════════════════════════════════════════════════════════════════════════════

const NeonWallSconce = memo(function NeonWallSconce({ position, side }: { position: [number, number, number]; side: 'left' | 'right' }) {
  const tubeRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.45 + Math.sin(state.clock.elapsedTime * 1.2 + position[2] * 0.3) * 0.12
    }
  })

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.04, 0.16, 0.04]} />
        <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[side === 'left' ? 0.04 : -0.04, 0, 0.05]} rotation={[0, 0, side === 'left' ? -0.2 : 0.2]}>
        <boxGeometry args={[0.03, 0.02, 0.08]} />
        <meshStandardMaterial color="#2a2830" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh ref={tubeRef} position={[side === 'left' ? 0.05 : -0.05, 0, 0.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.45} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[side === 'left' ? 0.06 : -0.06, 0, 0.14]} intensity={0.1} color="#8b5cf6" distance={2} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// APPLIQUE MURALE CHAUDE
// ════════════════════════════════════════════════════════════════════════════

const WallSconce = memo(function WallSconce({ position, side }: { position: [number, number, number]; side: 'left' | 'right' }) {
  const shadeRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (shadeRef.current) {
      const mat = shadeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.32 + Math.sin(state.clock.elapsedTime * 1.0 + position[2] * 0.4) * 0.06
    }
  })

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.06, 0.14, 0.04]} />
        <meshStandardMaterial color="#2a2840" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[side === 'left' ? 0.03 : -0.03, 0, 0.06]}>
        <boxGeometry args={[0.02, 0.02, 0.08]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={shadeRef} position={[side === 'left' ? 0.04 : -0.04, 0, 0.1]}>
        <boxGeometry args={[0.09, 0.12, 0.06]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.32} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[side === 'left' ? 0.05 : -0.05, 0, 0.12]} color="#fef3c7" intensity={0.14} distance={2} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// TABLEAU
// ════════════════════════════════════════════════════════════════════════════

const CorridorPainting = memo(function CorridorPainting({ position, rotation, index = 0 }: { position: [number, number, number]; rotation: [number, number, number]; index?: number }) {
  const tex = useMemo(() => createCanvasTexture(160, 120, (ctx, w, h) => {
    const bgColors = ['#2a1a4e', '#1a2a4e', '#1a1a3e', '#3a1a3e']
    const accColors = ['#8b5cf6', '#3b82f6', '#6366f1', '#a855f7']
    ctx.fillStyle = bgColors[index % bgColors.length]; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = `${accColors[index % accColors.length]}30`
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 20, 0, Math.PI * 2); ctx.fill() }
    ctx.strokeStyle = `${accColors[index % accColors.length]}35`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, 0); ctx.stroke()
  }), [index])

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.003]}>
        <boxGeometry args={[0.52, 0.42, 0.02]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.48, 0.38, 0.02]} />
        <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[0.44, 0.34, 0.006]} />
        <meshStandardMaterial map={tex} />
      </mesh>
      <mesh position={[0, 0.24, 0.04]}>
        <boxGeometry args={[0.28, 0.02, 0.04]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} />
      </mesh>
      <spotLight position={[0, 0.28, 0.12]} angle={Math.PI / 5} penumbra={0.7} intensity={0.2} color="#fef3c7" distance={1.2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// DÉCOR ENRICHI
// ════════════════════════════════════════════════════════════════════════════

const CorridorDecor = memo(function CorridorDecor({ position, type }: { position: [number, number, number]; type: 'plant' | 'bench' | 'ashtray' }) {
  const leavesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (leavesRef.current && type === 'plant') {
      leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + position[2]) * 0.015
    }
  })

  if (type === 'plant') {
    return (
      <group position={position}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.08, 8]} />
          <meshStandardMaterial color="#1e1b2e" roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.1, 0.2, 8]} />
          <meshStandardMaterial color="#2a2440" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.095, 0.095, 0.018, 8]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.085, 8]} />
          <meshStandardMaterial color="#1a1208" roughness={0.95} />
        </mesh>
        <group ref={leavesRef}>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.16, 6]} />
            <meshStandardMaterial color="#1a2a10" roughness={0.8} />
          </mesh>
          {[0, 55, 110, 165, 220, 290].map((angle, i) => (
            <mesh key={i} position={[Math.sin((angle * Math.PI) / 180) * 0.035, 0.35 + i * 0.02, Math.cos((angle * Math.PI) / 180) * 0.035]} rotation={[0.3, (angle * Math.PI) / 180, 0.12]} castShadow>
              <boxGeometry args={[0.04, 0.13, 0.01]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#166534' : '#15803d'} roughness={0.85} />
            </mesh>
          ))}
        </group>
      </group>
    )
  }

  if (type === 'bench') {
    return (
      <group position={position}>
        {[-0.12, 0, 0.12].map((z, i) => (
          <mesh key={i} position={[0, 0.47, z]} castShadow>
            <boxGeometry args={[1.3, 0.04, 0.1]} />
            <meshStandardMaterial color="#5a4423" roughness={0.7} />
          </mesh>
        ))}
        {[-0.08, 0.08].map((off, i) => (
          <mesh key={`back-${i}`} position={[0, 0.7 + off * 1.2, -0.2]} castShadow>
            <boxGeometry args={[1.3, 0.04, 0.06]} />
            <meshStandardMaterial color="#5a4423" roughness={0.7} />
          </mesh>
        ))}
        {[[-0.55, 0.23, 0], [0.55, 0.23, 0]].map((pos, i) => (
          <group key={i}>
            <mesh position={pos as [number, number, number]} castShadow>
              <boxGeometry args={[0.05, 0.46, 0.3]} />
              <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[pos[0], 0.56, pos[2]]}>
              <boxGeometry args={[0.05, 0.05, 0.3]} />
              <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.45, 0.18]}>
          <boxGeometry args={[1.1, 0.008, 0.003]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.25} />
        </mesh>
      </group>
    )
  }

  // Cendrier sur pied
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 8]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 6]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.1, 0.08, 8]} />
        <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 8]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.61, 0.06]}>
        <boxGeometry args={[0.1, 0.004, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EXTINCTEUR
// ════════════════════════════════════════════════════════════════════════════

const FireExtinguisher = memo(function FireExtinguisher({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, -0.04]}>
        <boxGeometry args={[0.1, 0.16, 0.015]} />
        <meshStandardMaterial color="#1a1e30" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.28, 8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.048, 0.048, 0.025, 8]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow>
        <boxGeometry args={[0.045, 0.05, 0.022]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.03, 0.1, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.006, 0.006, 0.1, 6]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// CAMÉRA DE SURVEILLANCE
// ════════════════════════════════════════════════════════════════════════════

const SecurityCamera = memo(function SecurityCamera({ position, rotDir = 1 }: { position: [number, number, number]; rotDir?: number }) {
  const headRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (headRef.current) headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.4 * rotDir
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 3.5) * 0.25
    }
  })

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.6} />
      </mesh>
      <group ref={headRef} position={[0, -0.05, 0]}>
        <mesh rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.05, 0.035, 0.08]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.045]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.025, 8]} />
          <meshStandardMaterial color="#060606" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh ref={ledRef} position={[0.02, 0.01, 0.035]}>
          <sphereGeometry args={[0.004, 6, 6]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.35} />
        </mesh>
      </group>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PANNEAU MURAL DÉCORATIF
// ════════════════════════════════════════════════════════════════════════════

const WallPanel = memo(function WallPanel({ position, rotation, index = 0 }: { position: [number, number, number]; rotation: [number, number, number]; index?: number }) {
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.12 + Math.sin(state.clock.elapsedTime * 0.5 + index * 1.8) * 0.05
    }
  })

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.4, 0.25, 0.015]} />
        <meshStandardMaterial color="#0c0c18" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh ref={screenRef} position={[0, 0, 0.009]}>
        <boxGeometry args={[0.34, 0.18, 0.004]} />
        <meshStandardMaterial color="#0a0818" emissive={index % 2 === 0 ? '#4c1d95' : '#1e3a5f'} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0.16, 0.1, 0.01]}>
        <sphereGeometry args={[0.006, 6, 6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PANNEAU EXIT
// ════════════════════════════════════════════════════════════════════════════

const ExitSign = memo(function ExitSign({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.35, 0.14, 0.04]} />
        <meshStandardMaterial color="#0f0f1a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0, 0.025]}>
        <boxGeometry args={[0.3, 0.09, 0.004]} />
        <meshStandardMaterial color="#0a2010" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
      <Text position={[0, 0, 0.03]} fontSize={0.04} color="#ffffff" anchorX="center" anchorY="middle">
        ◄ SORTIE ►
      </Text>
      <pointLight position={[0, 0, 0.08]} intensity={0.1} color="#22c55e" distance={1.2} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MUR DE FIN + ASCENSEUR — ENRICHI
// ════════════════════════════════════════════════════════════════════════════

const ElevatorEnd = memo(function ElevatorEnd({ position }: { position: [number, number, number] }) {
  const indicatorRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (indicatorRef.current) {
      const mat = indicatorRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.45 + Math.sin(state.clock.elapsedTime * 2) * 0.12
    }
  })

  return (
    <group position={position}>
      {/* Portes métalliques */}
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={`elev-door-${i}`} position={[x, 2, 0]} castShadow>
          <boxGeometry args={[1.6, 3.9, 0.06]} />
          <meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.18} />
        </mesh>
      ))}
      {/* Ligne jonction */}
      <mesh position={[0, 2, 0.035]}>
        <boxGeometry args={[0.015, 3.85, 0.008]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Reflet */}
      <mesh position={[-0.3, 2.5, 0.035]}>
        <boxGeometry args={[0.25, 0.8, 0.002]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.02} metalness={0.9} roughness={0.05} />
      </mesh>

      {/* Cadre */}
      <mesh position={[0, 2, -0.04]}>
        <boxGeometry args={[3.6, 4.2, 0.03]} />
        <meshStandardMaterial color="#1f2937" metalness={0.55} roughness={0.45} />
      </mesh>
      {[-1.75, 1.75].map((x, i) => (
        <mesh key={`frame-v-${i}`} position={[x, 2, 0.04]} castShadow>
          <boxGeometry args={[0.06, 4.25, 0.06]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 4.15, 0.04]} castShadow>
        <boxGeometry args={[3.55, 0.06, 0.06]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Moulure dorée */}
      {[-1.68, 1.68].map((x, i) => (
        <mesh key={`gold-v-${i}`} position={[x, 2, 0.07]}>
          <boxGeometry args={[0.012, 4.1, 0.01]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
        </mesh>
      ))}

      {/* Panneau d'appel */}
      <group position={[2.1, 1.9, 0.04]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.22, 0.03]} />
          <meshStandardMaterial color="#0f0f1a" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.04, 0.02]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#4b5563" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.04, 0.02]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Indicateur étage */}
      <group position={[0, 4.4, 0.04]}>
        <mesh>
          <boxGeometry args={[0.55, 0.22, 0.04]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh ref={indicatorRef} position={[0, 0, 0.025]}>
          <boxGeometry args={[0.42, 0.14, 0.005]} />
          <meshStandardMaterial color="#0a1410" emissive="#22c55e" emissiveIntensity={0.45} />
        </mesh>
      </group>

      {/* Panneau "ASCENSEUR" */}
      <group position={[0, 4.75, 0.04]}>
        <mesh>
          <boxGeometry args={[2, 0.3, 0.03]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.3} />
        </mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.1} color="#fef3c7" anchorX="center" anchorY="middle">
          ASCENSEUR
        </Text>
      </group>

      {/* Sol */}
      <mesh position={[0, 0.012, -0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 1.8]} />
        <meshStandardMaterial color="#2a2840" roughness={0.25} metalness={0.35} />
      </mesh>

      <pointLight position={[0, 2.5, 0.8]} intensity={0.6} color="#22c55e" distance={5} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — HotelCorridor3D
// ════════════════════════════════════════════════════════════════════════════

export function HotelCorridor3D({ playerRoomNumber = 'A-1-03' }: { playerRoomNumber?: string }) {
  const floorTex = useFloorTexture()
  const carpetTex = useCarpetTexture()
  const wallTex = useWallTexture()
  const ceilTex = useCeilingTexture()

  const halfLen = CORRIDOR_LENGTH / 2
  const centerZ = CORRIDOR_START_Z + halfLen

  // Génération des portes
  const doors = useMemo(() => {
    const list: Array<{
      id: string; number: string; position: [number, number, number]
      rotation: [number, number, number]; isLocked: boolean; isPlayerRoom: boolean; side: 'left' | 'right'
    }> = []
    for (let i = 0; i < NUM_DOORS_PER_SIDE; i++) {
      const zPos = CORRIDOR_START_Z + 3 + i * DOOR_SPACING;
      ['left', 'right'].forEach((side) => {
        const isLeft = side === 'left'
        const isPlayerRoom = side === PLAYER_ROOM_DOOR_SIDE && i === PLAYER_ROOM_DOOR_INDEX
        const num = `A-1-${String(i * 2 + (isLeft ? 1 : 2)).padStart(2, '0')}`
        list.push({
          id: `door-${side}-${i}`,
          number: num,
          position: [isLeft ? -CORRIDOR_WIDTH / 2 + 0.06 : CORRIDOR_WIDTH / 2 - 0.06, 0, zPos],
          rotation: [0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0],
          isLocked: !isPlayerRoom,
          isPlayerRoom,
          side: side as 'left' | 'right',
        })
      })
    }
    return list
  }, [])

  // Lumières de plafond
  const lights = useMemo(() => Array.from({ length: NUM_DOORS_PER_SIDE }, (_, i) => ({
    position: [0, CORRIDOR_HEIGHT - 0.05, CORRIDOR_START_Z + 3 + i * DOOR_SPACING] as [number, number, number],
    index: i,
  })), [])

  // Décor
  const decor = useMemo(() => [
    { position: [-CORRIDOR_WIDTH / 2 + 0.3, 0, CORRIDOR_START_Z + 1] as [number, number, number], type: 'plant' as const },
    { position: [CORRIDOR_WIDTH / 2 - 0.3, 0, CORRIDOR_START_Z + 1] as [number, number, number], type: 'plant' as const },
    { position: [-CORRIDOR_WIDTH / 2 + 0.3, 0, CORRIDOR_START_Z + CORRIDOR_LENGTH - 3] as [number, number, number], type: 'plant' as const },
    { position: [CORRIDOR_WIDTH / 2 - 0.3, 0, CORRIDOR_START_Z + CORRIDOR_LENGTH - 3] as [number, number, number], type: 'plant' as const },
    { position: [0, 0, CORRIDOR_START_Z + halfLen] as [number, number, number], type: 'bench' as const },
    { position: [CORRIDOR_WIDTH / 2 - 0.3, 0, CORRIDOR_START_Z + 20] as [number, number, number], type: 'ashtray' as const },
  ], [])

  return (
    <group>
      {/* ══════ SOL ══════ */}
      <mesh position={[0, 0.001, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CORRIDOR_WIDTH, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={floorTex} color="#22223a" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Bande centrale réfléchissante */}
      <mesh position={[0, 0.003, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.4, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#18162a" roughness={0.1} metalness={0.5} />
      </mesh>

      {/* Tapis */}
      <mesh position={[0, 0.005, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.5, CORRIDOR_LENGTH - 1]} />
        <meshStandardMaterial map={carpetTex} color="#3a3a5e" roughness={0.95} />
      </mesh>

      {/* Lignes dorées du tapis */}
      {[-0.78, 0.78].map((x, i) => (
        <mesh key={`gold-${i}`} position={[x, 0.006, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, CORRIDOR_LENGTH - 1.5]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
      ))}

      {/* ══════ PLAFOND ══════ */}
      <mesh position={[0, CORRIDOR_HEIGHT, centerZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORRIDOR_WIDTH, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={ceilTex} color="#2a2a4a" roughness={0.9} />
      </mesh>

      {/* Poutres transversales */}
      {Array.from({ length: Math.floor(CORRIDOR_LENGTH / 5) + 1 }).map((_, i) => (
        <mesh key={`beam-${i}`} position={[0, CORRIDOR_HEIGHT - 0.06, CORRIDOR_START_Z + i * 5]} castShadow>
          <boxGeometry args={[CORRIDOR_WIDTH, 0.08, 0.08]} />
          <meshStandardMaterial color="#1a1a30" roughness={0.65} metalness={0.2} />
        </mesh>
      ))}

      {/* ══════ MURS ══════ */}
      {/* Mur gauche — segmenté pour l'ouverture de la chambre */}
      <mesh position={[-CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, (CORRIDOR_START_Z + (PLAYER_DOOR_Z - 1)) / 2]}>
        <boxGeometry args={[WALL_THICKNESS, CORRIDOR_HEIGHT, (PLAYER_DOOR_Z - 1) - CORRIDOR_START_Z]} />
        <meshStandardMaterial map={wallTex} color="#28284a" roughness={0.82} />
      </mesh>
      <mesh position={[-CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, ((PLAYER_DOOR_Z + 1) + (CORRIDOR_START_Z + CORRIDOR_LENGTH)) / 2]}>
        <boxGeometry args={[WALL_THICKNESS, CORRIDOR_HEIGHT, (CORRIDOR_START_Z + CORRIDOR_LENGTH) - (PLAYER_DOOR_Z + 1)]} />
        <meshStandardMaterial map={wallTex} color="#28284a" roughness={0.82} />
      </mesh>
      <mesh position={[-CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT - 0.6, PLAYER_DOOR_Z]}>
        <boxGeometry args={[WALL_THICKNESS, 1.2, 2]} />
        <meshStandardMaterial map={wallTex} color="#28284a" roughness={0.82} />
      </mesh>

      {/* Mur droit */}
      <mesh position={[CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, centerZ]}>
        <boxGeometry args={[WALL_THICKNESS, CORRIDOR_HEIGHT, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={wallTex} color="#28284a" roughness={0.82} />
      </mesh>

      {/* Mur de fin */}
      <mesh position={[0, CORRIDOR_HEIGHT / 2, CORRIDOR_START_Z + CORRIDOR_LENGTH]}>
        <boxGeometry args={[CORRIDOR_WIDTH, CORRIDOR_HEIGHT, 0.15]} />
        <meshStandardMaterial map={wallTex} color="#25254a" roughness={0.85} />
      </mesh>

      {/* ══════ PLINTHES ══════ */}
      {[-1, 1].map((side, i) => (
        <group key={`baseboard-${i}`}>
          <mesh position={[side * (CORRIDOR_WIDTH / 2 - 0.04), 0.05, centerZ]}>
            <boxGeometry args={[0.025, 0.1, CORRIDOR_LENGTH]} />
            <meshStandardMaterial color="#0a0a14" roughness={0.65} metalness={0.1} />
          </mesh>
          {/* Néon sol */}
          <mesh position={[side * (CORRIDOR_WIDTH / 2 - 0.04), 0.003, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.025, CORRIDOR_LENGTH - 0.5]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.15} transparent opacity={0.4} />
          </mesh>
        </group>
      ))}

      {/* ══════ CORNICHE ══════ */}
      {[-1, 1].map((side, i) => (
        <group key={`crown-${i}`}>
          <mesh position={[side * (CORRIDOR_WIDTH / 2 - 0.04), CORRIDOR_HEIGHT - 0.05, centerZ]}>
            <boxGeometry args={[0.08, 0.1, CORRIDOR_LENGTH]} />
            <meshStandardMaterial color="#1f1f3a" roughness={0.6} metalness={0.15} />
          </mesh>
          <mesh position={[side * (CORRIDOR_WIDTH / 2 - 0.04), CORRIDOR_HEIGHT - 0.01, centerZ]}>
            <boxGeometry args={[0.012, 0.01, CORRIDOR_LENGTH]} />
            <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ══════ CIMAISE ══════ */}
      {[-1, 1].map((side, i) => (
        <mesh key={`cimaise-${i}`} position={[side * (CORRIDOR_WIDTH / 2 - 0.04), 2.5, centerZ]}>
          <boxGeometry args={[0.02, 0.025, CORRIDOR_LENGTH]} />
          <meshStandardMaterial color="#2a2a4e" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}

      {/* ══════ LED STRIP PLAFOND ══════ */}
      <mesh position={[0, CORRIDOR_HEIGHT - 0.02, centerZ]}>
        <boxGeometry args={[0.06, 0.015, CORRIDOR_LENGTH - 2]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.35} />
      </mesh>

      {/* ══════ ASCENSEUR ══════ */}
      <ElevatorEnd position={[0, 0, CORRIDOR_START_Z + CORRIDOR_LENGTH - 0.5]} />

      {/* ══════ PORTES (sauf chambre joueur) ══════ */}
      {doors.filter(d => !d.isPlayerRoom).map(door => (
        <CorridorDoor key={door.id} position={door.position} rotation={door.rotation} number={door.number} isLocked={door.isLocked} isPlayerRoom={door.isPlayerRoom} side={door.side} />
      ))}

      {/* ══════ LUMIÈRES PLAFOND ══════ */}
      {lights.map((l, i) => (
        <CorridorLight key={i} position={l.position} index={l.index} />
      ))}

      {/* ══════ APPLIQUES MURALES ══════ */}
      {[CORRIDOR_START_Z + 6, CORRIDOR_START_Z + 15, CORRIDOR_START_Z + 24].map((z, i) => (
        <group key={`sconce-pair-${i}`}>
          <WallSconce position={[-CORRIDOR_WIDTH / 2 + 0.1, 2.3, z]} side="left" />
          <WallSconce position={[CORRIDOR_WIDTH / 2 - 0.1, 2.3, z]} side="right" />
        </group>
      ))}

      {/* ══════ APPLIQUES NÉON ══════ */}
      {[CORRIDOR_START_Z + 10, CORRIDOR_START_Z + 20, CORRIDOR_START_Z + 30].map((z, i) => (
        <group key={`neon-pair-${i}`}>
          <NeonWallSconce position={[-CORRIDOR_WIDTH / 2 + 0.1, 1.5, z]} side="left" />
          <NeonWallSconce position={[CORRIDOR_WIDTH / 2 - 0.1, 1.5, z]} side="right" />
        </group>
      ))}

      {/* ══════ TABLEAUX ══════ */}
      {[CORRIDOR_START_Z + 8, CORRIDOR_START_Z + 18, CORRIDOR_START_Z + 28].map((z, i) => (
        <CorridorPainting key={`painting-l-${i}`} position={[-CORRIDOR_WIDTH / 2 + 0.1, 1.8, z]} rotation={[0, Math.PI / 2, 0]} index={i} />
      ))}
      {[CORRIDOR_START_Z + 12, CORRIDOR_START_Z + 22].map((z, i) => (
        <CorridorPainting key={`painting-r-${i}`} position={[CORRIDOR_WIDTH / 2 - 0.1, 1.8, z]} rotation={[0, -Math.PI / 2, 0]} index={i + 3} />
      ))}

      {/* ══════ PANNEAUX MURAUX ══════ */}
      {[CORRIDOR_START_Z + 5, CORRIDOR_START_Z + 14, CORRIDOR_START_Z + 26].map((z, i) => (
        <WallPanel key={`panel-${i}`} position={[CORRIDOR_WIDTH / 2 - 0.1, 1.4, z]} rotation={[0, -Math.PI / 2, 0]} index={i} />
      ))}

      {/* ══════ DÉCOR ══════ */}
      {decor.map((item, i) => (
        <CorridorDecor key={i} position={item.position} type={item.type} />
      ))}

      {/* ══════ EXTINCTEUR ══════ */}
      <FireExtinguisher position={[CORRIDOR_WIDTH / 2 - 0.12, 0.7, CORRIDOR_START_Z + 11]} />

      {/* ══════ CAMÉRA DE SURVEILLANCE ══════ */}
      <SecurityCamera position={[-0.2, CORRIDOR_HEIGHT - 0.1, CORRIDOR_START_Z + 7]} rotDir={1} />
      <SecurityCamera position={[0.2, CORRIDOR_HEIGHT - 0.1, CORRIDOR_START_Z + 22]} rotDir={-1} />

      {/* ══════ PANNEAUX EXIT ══════ */}
      <ExitSign position={[0, CORRIDOR_HEIGHT - 0.35, CORRIDOR_START_Z + 1.5]} />
      <ExitSign position={[0, CORRIDOR_HEIGHT - 0.35, CORRIDOR_START_Z + CORRIDOR_LENGTH - 3]} />

      {/* ══════ MARQUAGES SOL ══════ */}
      {[CORRIDOR_START_Z + 10, CORRIDOR_START_Z + 20, CORRIDOR_START_Z + 30].map((z, i) => (
        <mesh key={`mark-${i}`} position={[0, 0.007, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CORRIDOR_WIDTH - 0.3, 0.012]} />
          <meshStandardMaterial color="#4c1d95" emissive="#4c1d95" emissiveIntensity={0.08} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* ══════ PARTICULES ══════ */}
      <AtmosphericParticles />

      {/* ══════ ÉCLAIRAGE GLOBAL ══════ */}
      <ambientLight intensity={0.25} color="#1a1a2e" />
      <hemisphereLight intensity={0.18} color="#fef3c7" groundColor="#1a1a2e" />

      {/* Point lights principaux */}
      {[5, 15, 25, 35].map((offset, i) => (
        <pointLight key={`main-light-${i}`} position={[0, 2.5, CORRIDOR_START_Z + offset]} intensity={2.5} color="#fef3c7" distance={12} decay={2} />
      ))}

      {/* LED strip violet — ambient */}
      <pointLight position={[0, 2.8, centerZ]} intensity={1.5} color="#8b5cf6" distance={CORRIDOR_LENGTH} decay={2} />

      {/* Lumière d'entrée */}
      <spotLight position={[0, CORRIDOR_HEIGHT - 0.3, CORRIDOR_START_Z + 1]} angle={Math.PI / 4} penumbra={0.8} intensity={0.7} color="#fff8e0" castShadow shadow-mapSize={[512, 512]} />

      {/* Lumière de fond */}
      <pointLight position={[0, 1.5, CORRIDOR_START_Z + CORRIDOR_LENGTH - 3]} intensity={0.3} color="#22c55e" distance={6} decay={2} />
    </group>
  )
}