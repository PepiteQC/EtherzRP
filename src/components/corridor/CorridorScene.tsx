'use client'

import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CORRIDOR_DEFAULTS, FLOOR_HEIGHT } from '@/lib/etherworld/corridor-generator'

// ============================================
// CONSTANTES GLOBALES
// ============================================
const CORRIDOR_WIDTH = 5.5
const CORRIDOR_LENGTH = 80
const CORRIDOR_HEIGHT = FLOOR_HEIGHT || 3.5
const DOOR_SPACING = 7.5 // Espacement généreux entre chaque porte
const DOOR_WIDTH = 0.95
const DOOR_HEIGHT = 2.2
const WALL_THICKNESS = 0.2
const APARTMENTS_PER_SIDE = 8 // 8 de chaque côté = 16 total, bien espacés
const TOTAL_APARTMENTS = APARTMENTS_PER_SIDE * 2

// Couleurs de portes cyberpunk variées
const DOOR_PALETTE = [
  '#1e3a5f', '#2a1a4e', '#1a3040', '#2d2040',
  '#1a2840', '#322a48', '#1e2e50', '#28203e',
  '#1a3548', '#2e1e45', '#1c2e42', '#241838',
]

// ============================================
// TEXTURES PROCÉDURALES
// ============================================
function createCanvasTexture(
  w: number,
  h: number,
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

// Sol — carrelage industriel cyberpunk
function useFloorTexture() {
  return useMemo(() => {
    return createCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#090d18'
      ctx.fillRect(0, 0, w, h)

      const cols = 8
      const rows = 8
      const tw = w / cols
      const th = h / rows

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * tw
          const y = r * th
          const base = 10 + Math.random() * 10
          const tint = (r + c) % 2 === 0 ? 4 : 0
          ctx.fillStyle = `rgb(${base + tint}, ${base + tint + 2}, ${base + tint + 12})`
          ctx.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3)

          // Reflet subtil
          const grad = ctx.createLinearGradient(x, y, x + tw, y + th)
          grad.addColorStop(0, 'rgba(255,255,255,0.025)')
          grad.addColorStop(0.5, 'rgba(255,255,255,0)')
          grad.addColorStop(1, 'rgba(255,255,255,0.015)')
          ctx.fillStyle = grad
          ctx.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3)

          // Jointures
          ctx.fillStyle = 'rgba(0,0,0,0.7)'
          ctx.fillRect(x, y, tw, 1.5)
          ctx.fillRect(x, y, 1.5, th)
        }
      }

      // Micro-rayures
      ctx.strokeStyle = 'rgba(255,255,255,0.012)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < 40; i++) {
        ctx.beginPath()
        ctx.moveTo(Math.random() * w, Math.random() * h)
        ctx.lineTo(Math.random() * w, Math.random() * h)
        ctx.stroke()
      }
    }, [CORRIDOR_WIDTH * 1.5, CORRIDOR_LENGTH / 4])
  }, [])
}

// Murs — panneaux métalliques industriels
function useWallTexture() {
  return useMemo(() => {
    return createCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#101628'
      ctx.fillRect(0, 0, w, h)

      const panelH = h / 5
      for (let i = 0; i < 5; i++) {
        const y = i * panelH
        const shade = 16 + Math.random() * 8
        ctx.fillStyle = `rgb(${shade}, ${shade + 1}, ${shade + 12})`
        ctx.fillRect(3, y + 2, w - 6, panelH - 4)

        // Bordure
        ctx.strokeStyle = 'rgba(80, 100, 180, 0.1)'
        ctx.lineWidth = 0.8
        ctx.strokeRect(3, y + 2, w - 6, panelH - 4)

        // Rivets
        ctx.fillStyle = 'rgba(50, 70, 130, 0.25)'
        for (const px of [14, w - 14]) {
          ctx.beginPath()
          ctx.arc(px, y + panelH / 2, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Rainures
      for (let i = 0; i < 15; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.08})`
        ctx.fillRect(0, Math.random() * h, w, 0.8)
      }
    }, [1, 4])
  }, [])
}

// Plafond — panneaux acoustiques perforés
function useCeilingTexture() {
  return useMemo(() => {
    return createCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#080b14'
      ctx.fillRect(0, 0, w, h)
      const gs = 64
      for (let x = 0; x < w; x += gs) {
        for (let y = 0; y < h; y += gs) {
          const s = 7 + Math.random() * 5
          ctx.fillStyle = `rgb(${s},${s + 1},${s + 4})`
          ctx.fillRect(x + 2, y + 2, gs - 4, gs - 4)
          ctx.fillStyle = 'rgba(0,0,0,0.35)'
          for (let px = 0; px < 4; px++) {
            for (let py = 0; py < 4; py++) {
              ctx.beginPath()
              ctx.arc(x + 10 + px * 13, y + 10 + py * 13, 1.8, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }
    }, [CORRIDOR_WIDTH, CORRIDOR_LENGTH / 5])
  }, [])
}

// Porte — acier brossé avec panneaux
function useDoorTexture() {
  return useMemo(() => {
    return createCanvasTexture(256, 512, (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#1a2a4a')
      grad.addColorStop(0.4, '#1e3454')
      grad.addColorStop(0.6, '#162a48')
      grad.addColorStop(1, '#0f1e38')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Brossage horizontal
      for (let y = 0; y < h; y += 2) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.018})`
        ctx.fillRect(0, y, w, 1)
      }

      // Panneau extérieur
      ctx.strokeStyle = 'rgba(80, 140, 255, 0.12)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(18, 35, w - 36, h - 70)

      // Panneau haut
      ctx.fillStyle = 'rgba(30, 60, 120, 0.25)'
      ctx.fillRect(26, 45, w - 52, h * 0.3)

      // Panneau bas
      ctx.fillStyle = 'rgba(25, 50, 100, 0.2)'
      ctx.fillRect(26, h * 0.52, w - 52, h * 0.32)

      // Charnières
      ctx.fillStyle = 'rgba(100, 130, 180, 0.25)'
      ctx.fillRect(4, 55, 10, 25)
      ctx.fillRect(4, h - 80, 10, 25)
    })
  }, [])
}

// Normal map
function useNormalMap() {
  return useMemo(() => {
    return createCanvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = 'rgb(128, 128, 255)'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 150; i++) {
        const r = 128 + (Math.random() - 0.5) * 18
        const g = 128 + (Math.random() - 0.5) * 18
        ctx.fillStyle = `rgb(${r},${g},255)`
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
      }
    }, [3, 3])
  }, [])
}

// ============================================
// PARTICULES ATMOSPHÉRIQUES — POUSSIÈRE
// ============================================
function AtmosphericDust() {
  const ref = useRef<THREE.Points>(null)
  const count = 500

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * CORRIDOR_WIDTH * 0.85
      pos[i * 3 + 1] = Math.random() * CORRIDOR_HEIGHT
      pos[i * 3 + 2] = Math.random() * CORRIDOR_LENGTH
      spd[i * 3] = (Math.random() - 0.5) * 0.015
      spd[i * 3 + 1] = (Math.random() - 0.5) * 0.008
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.01
    }
    return { positions: pos, speeds: spd }
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      attr.array[i * 3] += speeds[i * 3] + Math.sin(t * 0.25 + i) * 0.0008
      attr.array[i * 3 + 1] += speeds[i * 3 + 1] + Math.cos(t * 0.15 + i * 0.4) * 0.0004
      attr.array[i * 3 + 2] += speeds[i * 3 + 2]
      // Rebouclage
      if (Math.abs(attr.array[i * 3]) > CORRIDOR_WIDTH / 2) attr.array[i * 3] *= -0.9
      if (attr.array[i * 3 + 1] > CORRIDOR_HEIGHT || attr.array[i * 3 + 1] < 0)
        attr.array[i * 3 + 1] = Math.random() * CORRIDOR_HEIGHT
      if (attr.array[i * 3 + 2] > CORRIDOR_LENGTH || attr.array[i * 3 + 2] < 0)
        attr.array[i * 3 + 2] = Math.random() * CORRIDOR_LENGTH
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.014}
        color="#8899bb"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Particules néon
function NeonMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 160

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const left = Math.random() > 0.5
      pos[i * 3] = (left ? -1 : 1) * (CORRIDOR_WIDTH / 2 - 0.2 + Math.random() * 0.25)
      pos[i * 3 + 1] = 0.8 + Math.random() * 0.8
      pos[i * 3 + 2] = Math.random() * CORRIDOR_LENGTH
      if (left) { col[i * 3] = 0.55; col[i * 3 + 1] = 0.36; col[i * 3 + 2] = 0.96 }
      else { col[i * 3] = 0.23; col[i * 3 + 1] = 0.51; col[i * 3 + 2] = 0.96 }
    }
    return { positions: pos, colors: col }
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      attr.array[i * 3 + 1] = 0.8 + Math.sin(t * 0.6 + i * 2) * 0.12
      attr.array[i * 3] += Math.sin(t * 0.2 + i) * 0.0002
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ============================================
// ARCHITECTURE DU CORRIDOR — ENRICHIE
// ============================================
function CorridorArchitecture() {
  const floorTex = useFloorTexture()
  const wallTex = useWallTexture()
  const ceilTex = useCeilingTexture()
  const normalMap = useNormalMap()

  return (
    <group>
      {/* ====== SOL ====== */}
      <mesh position={[0, 0, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CORRIDOR_WIDTH + 0.5, CORRIDOR_LENGTH]} />
        <meshStandardMaterial
          map={floorTex}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.25, 0.25)}
          color="#0f0f1a"
          roughness={0.35}
          metalness={0.2}
          envMapIntensity={0.4}
        />
      </mesh>

      {/* Bande centrale réfléchissante */}
      <mesh position={[0, 0.002, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.7, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#0b1220" roughness={0.12} metalness={0.65} envMapIntensity={0.7} />
      </mesh>

      {/* Lignes directrices au sol */}
      <mesh position={[-0.45, 0.003, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.015, CORRIDOR_LENGTH - 1]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0.45, 0.003, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.015, CORRIDOR_LENGTH - 1]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.35} />
      </mesh>

      {/* Tapis de couloir */}
      <mesh position={[0, 0.004, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, CORRIDOR_LENGTH - 3]} />
        <meshStandardMaterial color="#0c101e" roughness={0.95} metalness={0} transparent opacity={0.35} />
      </mesh>

      {/* ====== PLAFOND ====== */}
      <mesh position={[0, CORRIDOR_HEIGHT, CORRIDOR_LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORRIDOR_WIDTH + 0.5, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={ceilTex} color="#0d1117" roughness={0.92} metalness={0.05} />
      </mesh>

      {/* Poutres transversales */}
      {Array.from({ length: Math.floor(CORRIDOR_LENGTH / 5) + 1 }).map((_, i) => (
        <mesh key={`beam-${i}`} position={[0, CORRIDOR_HEIGHT - 0.07, i * 5]} castShadow>
          <boxGeometry args={[CORRIDOR_WIDTH + 0.5, 0.12, 0.1]} />
          <meshStandardMaterial color="#0d1422" roughness={0.65} metalness={0.35} />
        </mesh>
      ))}

      {/* ====== MUR GAUCHE ====== */}
      <mesh position={[-CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, CORRIDOR_LENGTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, CORRIDOR_HEIGHT, CORRIDOR_LENGTH]} />
        <meshStandardMaterial
          map={wallTex}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.2, 0.2)}
          color="#111827"
          roughness={0.82}
          metalness={0.08}
        />
      </mesh>

      {/* ====== MUR DROIT ====== */}
      <mesh position={[CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, CORRIDOR_LENGTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, CORRIDOR_HEIGHT, CORRIDOR_LENGTH]} />
        <meshStandardMaterial
          map={wallTex}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.2, 0.2)}
          color="#111827"
          roughness={0.82}
          metalness={0.08}
        />
      </mesh>

      {/* ====== MUR DU FOND (début) ====== */}
      <mesh position={[0, CORRIDOR_HEIGHT / 2, -0.5]}>
        <boxGeometry args={[CORRIDOR_WIDTH + 0.5, CORRIDOR_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* ====== MUR DE FIN ====== */}
      <CorridorEndWall position={[0, CORRIDOR_HEIGHT / 2, CORRIDOR_LENGTH + 0.1]} />

      {/* ====== NÉONS MURAUX ====== */}
      {/* Gauche — violet */}
      <NeonStrip
        position={[-CORRIDOR_WIDTH / 2 + 0.06, 1.2, CORRIDOR_LENGTH / 2]}
        length={CORRIDOR_LENGTH - 1}
        color="#8b5cf6"
        intensity={1.0}
      />
      {/* Droit — bleu */}
      <NeonStrip
        position={[CORRIDOR_WIDTH / 2 - 0.06, 1.2, CORRIDOR_LENGTH / 2]}
        length={CORRIDOR_LENGTH - 1}
        color="#3b82f6"
        intensity={1.0}
      />
      {/* Haut gauche */}
      <NeonStrip
        position={[-CORRIDOR_WIDTH / 2 + 0.06, CORRIDOR_HEIGHT - 0.18, CORRIDOR_LENGTH / 2]}
        length={CORRIDOR_LENGTH - 1}
        color="#6366f1"
        intensity={0.35}
        size={[0.018, 0.018]}
      />
      {/* Haut droit */}
      <NeonStrip
        position={[CORRIDOR_WIDTH / 2 - 0.06, CORRIDOR_HEIGHT - 0.18, CORRIDOR_LENGTH / 2]}
        length={CORRIDOR_LENGTH - 1}
        color="#2563eb"
        intensity={0.35}
        size={[0.018, 0.018]}
      />

      {/* ====== PLINTHES ====== */}
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.07, 0.06, CORRIDOR_LENGTH / 2]}>
        <boxGeometry args={[0.025, 0.12, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#0a0e1a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2 - 0.07, 0.06, CORRIDOR_LENGTH / 2]}>
        <boxGeometry args={[0.025, 0.12, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#0a0e1a" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Plinthes lumineuses */}
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.07, 0.004, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.25} transparent opacity={0.5} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2 - 0.07, 0.004, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.25} transparent opacity={0.5} />
      </mesh>

      {/* ====== ÉCLAIRAGE PLAFOND ====== */}
      <CeilingLightArray />

      {/* ====== DÉTAILS ARCHITECTURAUX ====== */}
      <CeilingPipes />
      <WallCables />
      <VentilationGrills />
      <WallPanelsDecorative />
      <SecurityCameras />
      <FloorMarkings />
    </group>
  )
}

// ============================================
// NÉON STRIP RÉUTILISABLE
// ============================================
function NeonStrip({
  position,
  length,
  color,
  intensity = 0.9,
  size = [0.025, 0.035],
}: {
  position: [number, number, number]
  length: number
  color: string
  intensity?: number
  size?: [number, number]
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = intensity + Math.sin(state.clock.elapsedTime * 2.5 + position[2] * 0.1) * 0.04
  })

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[size[0], size[1], length]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} />
      </mesh>
      {/* Support */}
      <mesh position={[position[0], position[1] + 0.035, position[2]]}>
        <boxGeometry args={[0.04, 0.015, length]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  )
}

// ============================================
// TABLEAU DE LUMIÈRES AU PLAFOND
// ============================================
function CeilingLightArray() {
  const lightCount = Math.floor(CORRIDOR_LENGTH / DOOR_SPACING) + 1

  return (
    <group>
      {Array.from({ length: lightCount }).map((_, i) => {
        const z = i * DOOR_SPACING + DOOR_SPACING / 2
        if (z > CORRIDOR_LENGTH) return null
        return (
          <group key={`ceil-light-${i}`} position={[0, CORRIDOR_HEIGHT - 0.04, z]}>
            {/* Boîtier */}
            <mesh>
              <boxGeometry args={[1.3, 0.05, 0.55]} />
              <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.6} />
            </mesh>
            {/* Surface LED */}
            <mesh position={[0, -0.018, 0]}>
              <boxGeometry args={[1.1, 0.015, 0.45]} />
              <meshStandardMaterial
                color="#fef3c7"
                emissive="#fef3c7"
                emissiveIntensity={0.85 + Math.sin(i * 0.8) * 0.1}
              />
            </mesh>
            {/* SpotLight */}
            <spotLight
              position={[0, 0, 0]}
              angle={Math.PI / 3}
              penumbra={0.65}
              intensity={2.2}
              color="#fff5e6"
              castShadow={i % 2 === 0}
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.001}
            />
            {/* Lumière douce secondaire */}
            <pointLight position={[0, -0.4, 0]} intensity={0.4} color="#e8dcc8" distance={4.5} decay={2} />
          </group>
        )
      })}
    </group>
  )
}

// ============================================
// TUYAUX AU PLAFOND
// ============================================
function CeilingPipes() {
  return (
    <group>
      {/* Tuyau principal gauche */}
      <mesh
        position={[-CORRIDOR_WIDTH / 2 + 0.45, CORRIDOR_HEIGHT - 0.15, CORRIDOR_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.035, 0.035, CORRIDOR_LENGTH, 8]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Tuyau secondaire droit */}
      <mesh
        position={[CORRIDOR_WIDTH / 2 - 0.45, CORRIDOR_HEIGHT - 0.12, CORRIDOR_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.025, 0.025, CORRIDOR_LENGTH, 8]} />
        <meshStandardMaterial color="#1e2940" roughness={0.45} metalness={0.65} />
      </mesh>

      {/* Tuyau fin au centre */}
      <mesh
        position={[-0.8, CORRIDOR_HEIGHT - 0.08, CORRIDOR_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.015, 0.015, CORRIDOR_LENGTH, 6]} />
        <meshStandardMaterial color="#1a2035" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Supports de tuyaux */}
      {Array.from({ length: Math.floor(CORRIDOR_LENGTH / 6) }).map((_, i) => (
        <group key={`pipe-sup-${i}`}>
          <mesh position={[-CORRIDOR_WIDTH / 2 + 0.45, CORRIDOR_HEIGHT - 0.08, i * 6 + 3]}>
            <boxGeometry args={[0.12, 0.03, 0.03]} />
            <meshStandardMaterial color="#1a1e30" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[CORRIDOR_WIDTH / 2 - 0.45, CORRIDOR_HEIGHT - 0.06, i * 6 + 3]}>
            <boxGeometry args={[0.1, 0.03, 0.03]} />
            <meshStandardMaterial color="#1a1e30" roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ============================================
// CÂBLES MURAUX
// ============================================
function WallCables() {
  return (
    <group>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh
          key={`cable-${i}`}
          position={[
            -CORRIDOR_WIDTH / 2 + 0.28,
            CORRIDOR_HEIGHT - 0.22 - i * 0.03,
            CORRIDOR_LENGTH / 2,
          ]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.01, 0.01, CORRIDOR_LENGTH, 6]} />
          <meshStandardMaterial
            color={['#1a1a2e', '#2d1a3e', '#1a2e3e', '#1e1a2e'][i]}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// GRILLES DE VENTILATION
// ============================================
function VentilationGrills() {
  const ventPositions = useMemo(() => {
    const vents: Array<{ pos: [number, number, number]; side: 'left' | 'right' }> = []
    for (let i = 0; i < Math.floor(CORRIDOR_LENGTH / 15); i++) {
      vents.push({
        pos: [
          i % 2 === 0 ? -CORRIDOR_WIDTH / 2 + WALL_THICKNESS / 2 + 0.01 : CORRIDOR_WIDTH / 2 - WALL_THICKNESS / 2 - 0.01,
          2.8,
          i * 15 + 7,
        ],
        side: i % 2 === 0 ? 'left' : 'right',
      })
    }
    return vents
  }, [])

  return (
    <group>
      {ventPositions.map((v, i) => (
        <group key={`vent-${i}`} position={v.pos}>
          {/* Cadre */}
          <mesh rotation={[0, v.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <boxGeometry args={[0.45, 0.22, 0.025]} />
            <meshStandardMaterial color="#1a1e30" roughness={0.5} metalness={0.7} />
          </mesh>
          {/* Lamelles */}
          {Array.from({ length: 5 }).map((_, j) => (
            <mesh
              key={j}
              position={[0, -0.08 + j * 0.04, 0]}
              rotation={[0.25, v.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
            >
              <boxGeometry args={[0.4, 0.008, 0.018]} />
              <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ============================================
// PANNEAUX MURAUX DÉCORATIFS AVEC ANIMATION
// ============================================
function WallPanelsDecorative() {
  const panelPositions = useMemo(() => {
    const panels: Array<{ pos: [number, number, number]; side: 'left' | 'right'; idx: number }> = []
    // Placer des panneaux entre les portes, pas devant
    for (let i = 0; i < APARTMENTS_PER_SIDE; i++) {
      const z = i * DOOR_SPACING + DOOR_SPACING / 2 + DOOR_SPACING * 0.6
      if (z < CORRIDOR_LENGTH - 2) {
        panels.push({
          pos: [-CORRIDOR_WIDTH / 2 + WALL_THICKNESS / 2 + 0.01, 2.0, z],
          side: 'left',
          idx: i,
        })
      }
      const z2 = i * DOOR_SPACING + DOOR_SPACING / 2 + DOOR_SPACING * 0.35
      if (z2 < CORRIDOR_LENGTH - 2) {
        panels.push({
          pos: [CORRIDOR_WIDTH / 2 - WALL_THICKNESS / 2 - 0.01, 2.0, z2],
          side: 'right',
          idx: i + APARTMENTS_PER_SIDE,
        })
      }
    }
    return panels
  }, [])

  return (
    <group>
      {panelPositions.map((p, i) => (
        <WallPanel key={`wpanel-${i}`} position={p.pos} side={p.side} index={p.idx} />
      ))}
    </group>
  )
}

function WallPanel({
  position,
  side,
  index,
}: {
  position: [number, number, number]
  side: 'left' | 'right'
  index: number
}) {
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!screenRef.current) return
    const mat = screenRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.18 + Math.sin(state.clock.elapsedTime * 0.4 + index * 1.3) * 0.08
  })

  return (
    <group position={position}>
      {/* Fond */}
      <mesh rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <boxGeometry args={[0.55, 0.3, 0.018]} />
        <meshStandardMaterial color="#0c1020" roughness={0.7} metalness={0.4} />
      </mesh>
      {/* Écran */}
      <mesh
        ref={screenRef}
        position={[side === 'left' ? 0.004 : -0.004, 0, 0]}
        rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
      >
        <boxGeometry args={[0.45, 0.2, 0.004]} />
        <meshStandardMaterial
          color="#0e1a2e"
          emissive={index % 3 === 0 ? '#22d3ee' : index % 3 === 1 ? '#6366f1' : '#8b5cf6'}
          emissiveIntensity={0.18}
        />
      </mesh>
      {/* LED état */}
      <mesh position={[side === 'left' ? 0.008 : -0.008, 0.12, 0.2]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.7} />
      </mesh>
    </group>
  )
}

// ============================================
// CAMÉRAS DE SURVEILLANCE
// ============================================
function SecurityCameras() {
  const camPositions = useMemo(() => {
    const cams: Array<{ pos: [number, number, number]; dir: number }> = []
    const spacing = CORRIDOR_LENGTH / 4
    for (let i = 0; i < 3; i++) {
      cams.push({
        pos: [i % 2 === 0 ? -1.2 : 1.2, CORRIDOR_HEIGHT - 0.15, spacing * (i + 1)],
        dir: i % 2 === 0 ? 1 : -1,
      })
    }
    return cams
  }, [])

  return (
    <group>
      {camPositions.map((c, i) => (
        <SecurityCamera key={`secam-${i}`} position={c.pos} rotationDir={c.dir} />
      ))}
    </group>
  )
}

function SecurityCamera({
  position,
  rotationDir,
}: {
  position: [number, number, number]
  rotationDir: number
}) {
  const headRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.5 * rotationDir
    }
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 3.5) * 0.3
    }
  })

  return (
    <group position={position}>
      {/* Bras */}
      <mesh>
        <boxGeometry args={[0.035, 0.12, 0.035]} />
        <meshStandardMaterial color="#1a1e30" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Tête rotative */}
      <group ref={headRef} position={[0, -0.1, 0]}>
        <mesh rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.07, 0.05, 0.1]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Objectif */}
        <mesh position={[0, 0, 0.06]} rotation={[0.25, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.035, 8]} />
          <meshStandardMaterial color="#080808" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* LED */}
        <mesh ref={ledRef} position={[0.03, 0.015, 0.05]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  )
}

// ============================================
// MARQUAGES AU SOL
// ============================================
function FloorMarkings() {
  return (
    <group>
      {/* Marquages de zone tous les 3 segments */}
      {Array.from({ length: Math.floor(CORRIDOR_LENGTH / 20) }).map((_, i) => {
        const z = i * 20 + 10
        return (
          <group key={`marking-${i}`}>
            {/* Ligne transversale */}
            <mesh position={[0, 0.003, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[CORRIDOR_WIDTH - 0.5, 0.02]} />
              <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.2} transparent opacity={0.4} />
            </mesh>
            {/* Flèches directionnelles */}
            <mesh position={[0, 0.003, z + 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.15, 0.3]} />
              <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.15} transparent opacity={0.3} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// ============================================
// MUR DE FIN DE CORRIDOR
// ============================================
function CorridorEndWall({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!glowRef.current) return
    const mat = glowRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.25 + Math.sin(state.clock.elapsedTime * 0.8) * 0.12
  })

  return (
    <group position={position}>
      {/* Mur */}
      <mesh>
        <boxGeometry args={[CORRIDOR_WIDTH + 0.5, CORRIDOR_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#0c1020" roughness={0.8} metalness={0.15} />
      </mesh>

      {/* Panneau décoratif */}
      <mesh position={[0, 0.3, -0.12]}>
        <boxGeometry args={[1.8, 1.4, 0.015]} />
        <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Logo lumineux */}
      <mesh ref={glowRef} position={[0, 0.3, -0.14]}>
        <boxGeometry args={[0.7, 0.7, 0.008]} />
        <meshStandardMaterial color="#1a1040" emissive="#8b5cf6" emissiveIntensity={0.25} />
      </mesh>

      {/* Cadre néon */}
      {/* Haut */}
      <mesh position={[0, 1.05, -0.13]}>
        <boxGeometry args={[1.85, 0.015, 0.008]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
      </mesh>
      {/* Bas */}
      <mesh position={[0, -0.42, -0.13]}>
        <boxGeometry args={[1.85, 0.015, 0.008]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
      </mesh>
      {/* Gauche */}
      <mesh position={[-0.92, 0.3, -0.13]}>
        <boxGeometry args={[0.015, 1.5, 0.008]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
      </mesh>
      {/* Droite */}
      <mesh position={[0.92, 0.3, -0.13]}>
        <boxGeometry args={[0.015, 1.5, 0.008]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.5} />
      </mesh>

      {/* Panneau EXIT */}
      <mesh position={[0, 1.3, -0.13]}>
        <boxGeometry args={[0.55, 0.13, 0.015]} />
        <meshStandardMaterial color="#0a1628" emissive="#22c55e" emissiveIntensity={0.45} />
      </mesh>

      {/* Lumière d'ambiance */}
      <pointLight position={[0, 0, -0.5]} intensity={0.5} color="#6366f1" distance={8} decay={2} />
    </group>
  )
}

// ============================================
// PORTE D'APPARTEMENT — ENRICHIE
// ============================================
function ApartmentDoor({
  position,
  rotation,
  isLocked,
  lightOn,
  doorColor,
  aptNumber,
  forRent,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  isLocked: boolean
  lightOn: boolean
  doorColor: string
  aptNumber: string
  forRent: boolean
}) {
  const doorRef = useRef<THREE.Mesh>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const doorTex = useDoorTexture()

  useFrame((state) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2.5) * 0.25
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      const target = hovered ? 0.5 : 0.12
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        target + Math.sin(state.clock.elapsedTime * 1.5) * 0.04,
        0.05
      )
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* ====== CADRE COMPLET ====== */}
      {/* Montant supérieur */}
      <mesh position={[0, DOOR_HEIGHT / 2 + 0.06, 0]}>
        <boxGeometry args={[DOOR_WIDTH + 0.12, 0.08, 0.1]} />
        <meshStandardMaterial color="#0a1020" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Montant gauche */}
      <mesh position={[-(DOOR_WIDTH / 2 + 0.03), 0, 0]}>
        <boxGeometry args={[0.06, DOOR_HEIGHT + 0.12, 0.1]} />
        <meshStandardMaterial color="#0a1020" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Montant droit */}
      <mesh position={[(DOOR_WIDTH / 2 + 0.03), 0, 0]}>
        <boxGeometry args={[0.06, DOOR_HEIGHT + 0.12, 0.1]} />
        <meshStandardMaterial color="#0a1020" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Cadre lumineux */}
      <mesh ref={glowRef} position={[0, 0, 0.05]}>
        <boxGeometry args={[DOOR_WIDTH + 0.06, DOOR_HEIGHT + 0.06, 0.004]} />
        <meshStandardMaterial
          color="#1a1040"
          emissive={forRent ? '#22c55e' : '#6366f1'}
          emissiveIntensity={0.12}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* ====== PANNEAU DE PORTE ====== */}
      <mesh
        ref={doorRef}
        position={[0, 0, 0.025]}
        castShadow
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, 0.05]} />
        <meshStandardMaterial
          map={doorTex}
          color={doorColor}
          metalness={0.4}
          roughness={0.35}
          envMapIntensity={0.35}
        />
      </mesh>

      {/* Accent néon vertical */}
      <mesh position={[DOOR_WIDTH / 2 - 0.12, 0, 0.055]}>
        <boxGeometry args={[0.005, DOOR_HEIGHT * 0.85, 0.004]} />
        <meshStandardMaterial
          color="#2563eb"
          emissive="#2563eb"
          emissiveIntensity={hovered ? 0.6 : 0.25}
        />
      </mesh>

      {/* Accent néon horizontal */}
      <mesh position={[0, DOOR_HEIGHT * 0.25, 0.055]}>
        <boxGeometry args={[DOOR_WIDTH * 0.75, 0.012, 0.004]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.4} />
      </mesh>

      {/* ====== POIGNÉE ====== */}
      <group position={[-DOOR_WIDTH / 2 + 0.12, 0, 0.055]}>
        {/* Base */}
        <mesh>
          <cylinderGeometry args={[0.018, 0.018, 0.025, 8]} />
          <meshStandardMaterial color="#3a3a4e" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Barre */}
        <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.07, 6]} />
          <meshStandardMaterial color="#4a4a5e" roughness={0.3} metalness={0.85} />
        </mesh>
      </group>

      {/* ====== LECTEUR DE CARTE ====== */}
      <group position={[-DOOR_WIDTH / 2 + 0.12, 0.22, 0.055]}>
        <mesh>
          <boxGeometry args={[0.04, 0.055, 0.012]} />
          <meshStandardMaterial color="#0a0e1a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* LED lecteur */}
        <mesh position={[0.015, 0.02, 0.006]}>
          <sphereGeometry args={[0.004, 6, 6]} />
          <meshStandardMaterial
            color={isLocked ? '#ef4444' : '#22c55e'}
            emissive={isLocked ? '#ef4444' : '#22c55e'}
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>

      {/* ====== JUDAS ====== */}
      <mesh position={[0, DOOR_HEIGHT * 0.18, 0.055]}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 8]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Anneau */}
      <mesh position={[0, DOOR_HEIGHT * 0.18, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.016, 0.003, 6, 16]} />
        <meshStandardMaterial color="#3a3a4e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ====== LED D'ÉTAT ====== */}
      <mesh ref={ledRef} position={[DOOR_WIDTH / 2 - 0.08, 0.25, 0.06]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial
          color={isLocked ? '#ef4444' : '#22c55e'}
          emissive={isLocked ? '#ef4444' : '#22c55e'}
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* Halo LED */}
      <pointLight
        position={[DOOR_WIDTH / 2 - 0.08, 0.25, 0.15]}
        intensity={0.12}
        color={isLocked ? '#ef4444' : '#22c55e'}
        distance={1.2}
        decay={2}
      />

      {/* ====== PLAQUE DE NUMÉRO ====== */}
      <group position={[0.12, DOOR_HEIGHT * 0.35, 0.06]}>
        {/* Fond */}
        <mesh>
          <boxGeometry args={[0.22, 0.1, 0.008]} />
          <meshStandardMaterial color="#0a0e1a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Bordure lumineuse */}
        <mesh position={[0, 0, -0.002]}>
          <boxGeometry args={[0.24, 0.12, 0.003]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#6366f1"
            emissiveIntensity={0.2}
            transparent
            opacity={0.4}
          />
        </mesh>
        {/* Numéro — petit indicateur lumineux */}
        <mesh position={[0, 0, 0.005]}>
          <boxGeometry args={[0.18, 0.06, 0.002]} />
          <meshStandardMaterial
            color="#0e1628"
            emissive="#e2e8f0"
            emissiveIntensity={0.15}
          />
        </mesh>
      </group>

      {/* ====== INDICATEUR À LOUER ====== */}
      {forRent && (
        <group position={[0, -DOOR_HEIGHT * 0.32, 0.06]}>
          <mesh>
            <boxGeometry args={[0.2, 0.08, 0.008]} />
            <meshStandardMaterial color="#0a2010" emissive="#22c55e" emissiveIntensity={0.5} />
          </mesh>
          <pointLight position={[0, 0, 0.08]} intensity={0.1} color="#22c55e" distance={0.8} />
        </group>
      )}

      {/* ====== PAILLASSON ====== */}
      <mesh position={[0, -DOOR_HEIGHT / 2 + 0.003, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.55, 0.35]} />
        <meshStandardMaterial color="#1a1510" roughness={0.95} metalness={0} />
      </mesh>

      {/* ====== LUMIÈRE INTÉRIEURE ====== */}
      {lightOn && (
        <>
          {/* Fuite de lumière sous la porte */}
          <mesh position={[0, -DOOR_HEIGHT / 2 + 0.005, -0.03]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[DOOR_WIDTH - 0.1, 0.08]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fef3c7"
              emissiveIntensity={0.4}
              transparent
              opacity={0.6}
            />
          </mesh>
          <pointLight position={[0, 0, -0.35]} intensity={0.25} color="#fef3c7" distance={1.8} />
        </>
      )}
    </group>
  )
}

// ============================================
// ÉCLAIRAGE DU CORRIDOR
// ============================================
function CorridorLight({
  position,
  intensity,
  color,
}: {
  position: [number, number, number]
  intensity: number
  color: string
}) {
  const bulbRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!bulbRef.current) return
    const mat = bulbRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 1.5 + position[2] * 0.3) * 0.15
  })

  return (
    <group position={position}>
      {/* Fixation plafond */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.03, 0.04, 8]} />
        <meshStandardMaterial color="#1a1e30" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Tige */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Corps du luminaire */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 0.05, 8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Ampoule */}
      <mesh ref={bulbRef} position={[0, -0.16, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0, -0.2, 0]} intensity={intensity} color={color} distance={5.5} decay={2} />
    </group>
  )
}

// ============================================
// PLANTE DÉCORATIVE — ENRICHIE
// ============================================
function CorridorPlant({ position }: { position: [number, number, number] }) {
  const leavesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!leavesRef.current) return
    // Léger balancement
    leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[2]) * 0.02
  })

  return (
    <group position={position}>
      {/* Pot — base */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.08, 8]} />
        <meshStandardMaterial color="#2a2520" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Pot — corps */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.22, 8]} />
        <meshStandardMaterial color="#374151" roughness={0.8} metalness={0.15} />
      </mesh>
      {/* Terre */}
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.09, 8]} />
        <meshStandardMaterial color="#2a1e14" roughness={0.95} />
      </mesh>
      {/* Feuilles */}
      <group ref={leavesRef}>
        {[0, 55, 110, 165, 220, 290].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.sin((angle * Math.PI) / 180) * 0.04,
              0.38 + i * 0.025,
              Math.cos((angle * Math.PI) / 180) * 0.04,
            ]}
            rotation={[0.3 + i * 0.05, (angle * Math.PI) / 180, 0.15]}
          >
            <boxGeometry args={[0.055, 0.14, 0.012]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#15803d' : '#166534'} roughness={0.88} />
          </mesh>
        ))}
        {/* Tiges */}
        {[0, 120, 240].map((angle, i) => (
          <mesh
            key={`stem-${i}`}
            position={[
              Math.sin((angle * Math.PI) / 180) * 0.02,
              0.35,
              Math.cos((angle * Math.PI) / 180) * 0.02,
            ]}
          >
            <cylinderGeometry args={[0.004, 0.004, 0.12, 4]} />
            <meshStandardMaterial color="#1a5c2e" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ============================================
// BANC — ENRICHI
// ============================================
function CorridorBench({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Assise */}
      <mesh position={[0, 0.27, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.04, 0.38]} />
        <meshStandardMaterial color="#1e2530" metalness={0.35} roughness={0.65} />
      </mesh>
      {/* Bord arrondi de l'assise */}
      <mesh position={[0, 0.27, 0.2]}>
        <boxGeometry args={[0.85, 0.035, 0.02]} />
        <meshStandardMaterial color="#2a3040" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Pieds */}
      {[
        [-0.37, 0.13, 0.14],
        [0.37, 0.13, 0.14],
        [-0.37, 0.13, -0.14],
        [0.37, 0.13, -0.14],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.018, 0.018, 0.26, 6]} />
          <meshStandardMaterial color="#374151" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}
      {/* Barre de renfort */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.7, 0.015, 0.015]} />
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Accent néon sous l'assise */}
      <mesh position={[0, 0.245, 0.19]}>
        <boxGeometry args={[0.75, 0.008, 0.004]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

// ============================================
// EXTINCTEUR
// ============================================
function FireExtinguisher({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Support mural */}
      <mesh position={[0, 0.05, -0.035]}>
        <boxGeometry args={[0.1, 0.18, 0.015]} />
        <meshStandardMaterial color="#1a1e30" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Corps */}
      <mesh>
        <cylinderGeometry args={[0.045, 0.045, 0.32, 8]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Bande */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.047, 0.047, 0.03, 8]} />
        <meshStandardMaterial color="#aa1818" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Poignée */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.06, 0.025]} />
        <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Tuyau */}
      <mesh position={[0.035, 0.13, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.006, 0.006, 0.12, 6]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
    </group>
  )
}

// ============================================
// PANNEAU DE SIGNALÉTIQUE
// ============================================
function DirectionalSign({ position, text }: { position: [number, number, number]; text?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 1.8) * 0.15
  })

  return (
    <group position={position}>
      {/* Panneau */}
      <mesh>
        <boxGeometry args={[1.2, 0.25, 0.02]} />
        <meshStandardMaterial color="#0c1020" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Surface lumineuse */}
      <mesh ref={meshRef} position={[0, 0, 0.012]}>
        <boxGeometry args={[1.1, 0.18, 0.005]} />
        <meshStandardMaterial color="#0a1628" emissive="#8b5cf6" emissiveIntensity={0.6} />
      </mesh>
      {/* Supports */}
      <mesh position={[-0.5, 0.15, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 4]} />
        <meshStandardMaterial color="#1a1e30" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 0.15, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 4]} />
        <meshStandardMaterial color="#1a1e30" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ============================================
// INDICATEUR D'ÉTAGE — ENTRÉE DU CORRIDOR
// ============================================
function FloorIndicator({ position }: { position: [number, number, number] }) {
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!screenRef.current) return
    const mat = screenRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 1.6) * 0.12
  })

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.9, 0.45, 0.05]} />
        <meshStandardMaterial color="#0c1020" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh ref={screenRef} position={[0, 0, 0.03]}>
        <boxGeometry args={[0.75, 0.3, 0.008]} />
        <meshStandardMaterial color="#0a1628" emissive="#6366f1" emissiveIntensity={0.35} />
      </mesh>
      {/* Bordure */}
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[0.82, 0.37, 0.004]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.25}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  )
}

// ============================================
// SCÈNE PRINCIPALE — EXPORT
// ============================================
export function CorridorScene() {
  // Génération procédurale des appartements — bien espacés
  const corridorApartments = useMemo(() => {
    const apartments: Array<{
      id: string
      number: string
      position: [number, number, number]
      rotation: [number, number, number]
      isLocked: boolean
      lightOn: boolean
      doorColor: string
      forRent: boolean
    }> = []

    // Seed déterministe pour consistance
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280
      return x - Math.floor(x)
    }

    let aptIndex = 0

    for (let side = 0; side < 2; side++) {
      const isLeft = side === 0
      const xPos = isLeft ? -CORRIDOR_WIDTH / 2 + WALL_THICKNESS / 2 + 0.01 : CORRIDOR_WIDTH / 2 - WALL_THICKNESS / 2 - 0.01

      for (let i = 0; i < APARTMENTS_PER_SIDE; i++) {
        // Espacement : première porte à DOOR_SPACING, puis chaque DOOR_SPACING
        // Décalage entre côtés pour éviter vis-à-vis exact
        const offset = isLeft ? 0 : DOOR_SPACING * 0.45
        const zPos = DOOR_SPACING + i * DOOR_SPACING + offset

        // Ne pas placer si trop proche de la fin
        if (zPos > CORRIDOR_LENGTH - 3) continue

        // Quelques emplacements laissés vides pour variation (2 par côté)
        const skipSeed = seededRandom(aptIndex * 13 + side * 7)
        if ((i === 2 || i === 6) && side === 0) {
          aptIndex++
          continue // Espace vide côté gauche — peut accueillir décor
        }
        if ((i === 4 || i === 7) && side === 1) {
          aptIndex++
          continue // Espace vide côté droit
        }

        const seed = aptIndex * 17 + side * 31
        const locked = seededRandom(seed + 1) > 0.3
        const light = seededRandom(seed + 2) > 0.45
        const rent = seededRandom(seed + 3) > 0.75
        const colorIdx = Math.floor(seededRandom(seed + 4) * DOOR_PALETTE.length)

        apartments.push({
          id: `apt-${side}-${i}`,
          number: `${(side === 0 ? 100 : 200) + i + 1}`,
          position: [xPos, FLOOR_HEIGHT / 2, zPos],
          rotation: [0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0],
          isLocked: locked,
          lightOn: light,
          doorColor: DOOR_PALETTE[colorIdx],
          forRent: rent,
        })

        aptIndex++
      }
    }

    return apartments
  }, [])

  // Lumières de corridor — entre chaque paire de portes
  const lights = useMemo(() => {
    const result: Array<{
      id: string
      position: [number, number, number]
      intensity: number
      color: string
    }> = []

    const numLights = Math.floor(CORRIDOR_LENGTH / (DOOR_SPACING * 0.75))
    for (let i = 0; i < numLights; i++) {
      const zPos = DOOR_SPACING * 0.5 + i * (DOOR_SPACING * 0.75)
      if (zPos > CORRIDOR_LENGTH - 2) break

      const side = i % 2 === 0 ? -1 : 1
      result.push({
        id: `light-${i}`,
        position: [
          side * (CORRIDOR_WIDTH / 2 - 0.7),
          CORRIDOR_HEIGHT - 0.15,
          zPos,
        ],
        intensity: 0.7 + (i % 3) * 0.15,
        color: '#fef3c7',
      })
    }
    return result
  }, [])

  // Décor — plantes, bancs, extincteurs, panneaux
  const decor = useMemo(() => {
    const items: Array<{
      id: string
      type: 'plant' | 'bench' | 'extinguisher' | 'sign' | 'floorIndicator'
      position: [number, number, number]
    }> = []

    // Plantes — dans les espaces vides laissés par les portes manquantes
    // Côté gauche : emplacements 2 et 6 sont vides
    items.push({
      id: 'plant-l2',
      type: 'plant',
      position: [-CORRIDOR_WIDTH / 2 + 0.4, 0, DOOR_SPACING + 2 * DOOR_SPACING],
    })
    items.push({
      id: 'plant-l6',
      type: 'plant',
      position: [-CORRIDOR_WIDTH / 2 + 0.4, 0, DOOR_SPACING + 6 * DOOR_SPACING],
    })
    // Côté droit : emplacements 4 et 7
    items.push({
      id: 'plant-r4',
      type: 'plant',
      position: [CORRIDOR_WIDTH / 2 - 0.4, 0, DOOR_SPACING + 4 * DOOR_SPACING + DOOR_SPACING * 0.45],
    })
    items.push({
      id: 'plant-r7',
      type: 'plant',
      position: [CORRIDOR_WIDTH / 2 - 0.4, 0, DOOR_SPACING + 7 * DOOR_SPACING + DOOR_SPACING * 0.45],
    })

    // Plantes supplémentaires le long du corridor
    for (let i = 0; i < 3; i++) {
      items.push({
        id: `plant-extra-${i}`,
        type: 'plant',
        position: [
          i % 2 === 0 ? -CORRIDOR_WIDTH / 2 + 0.35 : CORRIDOR_WIDTH / 2 - 0.35,
          0,
          15 + i * 18,
        ],
      })
    }

    // Bancs — au milieu du corridor dans les zones dégagées
    items.push({ id: 'bench-1', type: 'bench', position: [0, 0, 12] })
    items.push({ id: 'bench-2', type: 'bench', position: [0, 0, 35] })
    items.push({ id: 'bench-3', type: 'bench', position: [0, 0, 58] })

    // Extincteurs
    items.push({
      id: 'ext-1',
      type: 'extinguisher',
      position: [-CORRIDOR_WIDTH / 2 + 0.18, 0.8, 8],
    })
    items.push({
      id: 'ext-2',
      type: 'extinguisher',
      position: [CORRIDOR_WIDTH / 2 - 0.18, 0.8, 28],
    })
    items.push({
      id: 'ext-3',
      type: 'extinguisher',
      position: [-CORRIDOR_WIDTH / 2 + 0.18, 0.8, 50],
    })

    // Panneaux de signalétique
    items.push({
      id: 'sign-1',
      type: 'sign',
      position: [0, 2.8, 1],
    })
    items.push({
      id: 'sign-2',
      type: 'sign',
      position: [0, 2.8, CORRIDOR_LENGTH / 2],
    })

    // Indicateur d'étage à l'entrée
    items.push({
      id: 'floorInd',
      type: 'floorIndicator',
      position: [0, 2.5, 0.3],
    })

    return items
  }, [])

  // Lumières néon le long du corridor
  const neonLights = useMemo(() => {
    const result: Array<{ pos: [number, number, number]; color: string }> = []
    const count = Math.floor(CORRIDOR_LENGTH / 6)
    for (let i = 0; i < count; i++) {
      // Gauche — violet
      result.push({
        pos: [-CORRIDOR_WIDTH / 2 + 0.25, 1.2, i * 6 + 3],
        color: '#8b5cf6',
      })
      // Droit — bleu
      result.push({
        pos: [CORRIDOR_WIDTH / 2 - 0.25, 1.2, i * 6 + 3],
        color: '#3b82f6',
      })
    }
    return result
  }, [])

  return (
    <>
      {/* ====== ARCHITECTURE ====== */}
      <CorridorArchitecture />

      {/* ====== PORTES D'APPARTEMENTS ====== */}
      {corridorApartments.map((door) => (
        <ApartmentDoor
          key={door.id}
          position={door.position}
          rotation={door.rotation}
          isLocked={door.isLocked}
          lightOn={door.lightOn}
          doorColor={door.doorColor}
          aptNumber={door.number}
          forRent={door.forRent}
        />
      ))}

      {/* ====== LUMIÈRES DU CORRIDOR ====== */}
      {lights.map((light) => (
        <CorridorLight
          key={light.id}
          position={light.position}
          intensity={light.intensity}
          color={light.color}
        />
      ))}

      {/* ====== LUMIÈRES NÉON — point lights ====== */}
      {neonLights.map((nl, i) => (
        <pointLight
          key={`neon-pl-${i}`}
          position={nl.pos}
          intensity={0.3}
          color={nl.color}
          distance={5}
          decay={2}
        />
      ))}

      {/* ====== DÉCOR ====== */}
      {decor.map((item) => {
        switch (item.type) {
          case 'plant':
            return <CorridorPlant key={item.id} position={item.position} />
          case 'bench':
            return <CorridorBench key={item.id} position={item.position} />
          case 'extinguisher':
            return <FireExtinguisher key={item.id} position={item.position} />
          case 'sign':
            return <DirectionalSign key={item.id} position={item.position} />
          case 'floorIndicator':
            return <FloorIndicator key={item.id} position={item.position} />
          default:
            return null
        }
      })}

      {/* ====== PARTICULES ATMOSPHÉRIQUES ====== */}
      <AtmosphericDust />
      <NeonMotes />

      {/* ====== ÉCLAIRAGE GLOBAL ====== */}
      <ambientLight intensity={0.45} color="#1e1e3a" />
      <directionalLight
        position={[3, 5, CORRIDOR_LENGTH / 2]}
        intensity={0.3}
        color="#e8e0ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-near={0.1}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
      />
      <hemisphereLight color="#2a2a4e" groundColor="#080c18" intensity={0.3} />

      {/* Lumière d'entrée */}
      <spotLight
        position={[0, CORRIDOR_HEIGHT - 0.2, 1]}
        angle={Math.PI / 4}
        penumbra={0.8}
        intensity={1.3}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Lumière de fond */}
      <pointLight
        position={[0, 2, CORRIDOR_LENGTH - 2]}
        intensity={0.5}
        color="#6366f1"
        distance={10}
        decay={2}
      />

      {/* ====== PANNEAU PRINCIPAL — "ROOM 404" → ETHERWORLD ====== */}
      <group position={[0, 2.85, 0.5]}>
        <mesh>
          <boxGeometry args={[1.8, 0.35, 0.025]} />
          <meshStandardMaterial color="#0c1020" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[1.65, 0.25, 0.008]} />
          <meshStandardMaterial color="#0a1628" emissive="#8b5cf6" emissiveIntensity={0.7} />
        </mesh>
        {/* Bordure néon */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[1.75, 0.3, 0.003]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#6366f1"
            emissiveIntensity={0.35}
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>
    </>
  )
}