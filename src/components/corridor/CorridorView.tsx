'use client'

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useEtherWorldStore } from '@/lib/etherworld/store'
import { corridorGenerator } from '@/lib/etherworld/corridor-generator'
import { doorController } from '@/lib/etherworld/door-controller'
import { CustomPostProcessing } from '@/lib/three/postprocessing/CustomEffects'
import type { CorridorApartment } from '@/lib/etherworld/types'

// ============================================
// CONSTANTES GLOBALES — CORRIDOR DIMENSIONS
// ============================================
const CORRIDOR_WIDTH = 6
const CORRIDOR_HEIGHT = 3.5
const CORRIDOR_SEGMENT_LENGTH = 6
const CORRIDOR_COUNT = 12
const TOTAL_LENGTH = CORRIDOR_COUNT * CORRIDOR_SEGMENT_LENGTH

// ============================================
// UTILITAIRES TEXTURE PROCÉDURALE
// ============================================
function createProceduralTexture(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  drawFn(ctx, width, height)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  if (repeat) tex.repeat.set(repeat[0], repeat[1])
  tex.needsUpdate = true
  return tex
}

// Texture de sol carrelé cyberpunk
function useFloorTexture() {
  return useMemo(() => {
    return createProceduralTexture(512, 512, (ctx, w, h) => {
      // Base sombre
      ctx.fillStyle = '#0a0e1a'
      ctx.fillRect(0, 0, w, h)

      const tileW = w / 4
      const tileH = h / 4

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const x = col * tileW
          const y = row * tileH

          // Variation de teinte par carreau
          const brightness = 10 + Math.random() * 12
          const r = brightness
          const g = brightness + Math.random() * 8
          const b = brightness + 15 + Math.random() * 10
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4)

          // Effet de reflet subtil
          const gradient = ctx.createLinearGradient(x, y, x + tileW, y + tileH)
          gradient.addColorStop(0, 'rgba(255,255,255,0.03)')
          gradient.addColorStop(0.5, 'rgba(255,255,255,0.0)')
          gradient.addColorStop(1, 'rgba(255,255,255,0.02)')
          ctx.fillStyle = gradient
          ctx.fillRect(x + 2, y + 2, tileW - 4, tileH - 4)

          // Jointures
          ctx.fillStyle = 'rgba(0,0,0,0.8)'
          ctx.fillRect(x, y, tileW, 2)
          ctx.fillRect(x, y, 2, tileH)
        }
      }

      // Micro-rayures aléatoires
      ctx.strokeStyle = 'rgba(255,255,255,0.015)'
      ctx.lineWidth = 1
      for (let i = 0; i < 30; i++) {
        ctx.beginPath()
        ctx.moveTo(Math.random() * w, Math.random() * h)
        ctx.lineTo(Math.random() * w, Math.random() * h)
        ctx.stroke()
      }
    }, [6, CORRIDOR_COUNT * 1.5])
  }, [])
}

// Texture mur avec panneaux industriels
function useWallTexture() {
  return useMemo(() => {
    return createProceduralTexture(512, 512, (ctx, w, h) => {
      // Base
      ctx.fillStyle = '#12162a'
      ctx.fillRect(0, 0, w, h)

      const panelH = h / 6

      for (let i = 0; i < 6; i++) {
        const y = i * panelH
        const shade = 18 + Math.random() * 8
        ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 14})`
        ctx.fillRect(4, y + 3, w - 8, panelH - 6)

        // Bordure légère
        ctx.strokeStyle = 'rgba(100, 120, 200, 0.12)'
        ctx.lineWidth = 1
        ctx.strokeRect(4, y + 3, w - 8, panelH - 6)

        // Rivets / vis
        ctx.fillStyle = 'rgba(60, 80, 140, 0.3)'
        ctx.beginPath()
        ctx.arc(16, y + panelH / 2, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(w - 16, y + panelH / 2, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Rainures horizontales
      for (let i = 0; i < 20; i++) {
        const y = Math.random() * h
        ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.1})`
        ctx.fillRect(0, y, w, 1)
      }
    }, [1, 3])
  }, [])
}

// Texture plafond — panneaux acoustiques
function useCeilingTexture() {
  return useMemo(() => {
    return createProceduralTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#090c15'
      ctx.fillRect(0, 0, w, h)

      const gridSize = 64
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          const shade = 8 + Math.random() * 6
          ctx.fillStyle = `rgb(${shade},${shade + 1},${shade + 5})`
          ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4)

          // Motif perforé
          ctx.fillStyle = 'rgba(0,0,0,0.4)'
          for (let px = 0; px < 4; px++) {
            for (let py = 0; py < 4; py++) {
              ctx.beginPath()
              ctx.arc(
                x + 10 + px * 14,
                y + 10 + py * 14,
                2,
                0,
                Math.PI * 2
              )
              ctx.fill()
            }
          }
        }
      }
    }, [6, CORRIDOR_COUNT])
  }, [])
}

// Texture de porte métallique
function useDoorTexture() {
  return useMemo(() => {
    return createProceduralTexture(256, 512, (ctx, w, h) => {
      // Base acier brossé
      const gradient = ctx.createLinearGradient(0, 0, 0, h)
      gradient.addColorStop(0, '#1a2a4a')
      gradient.addColorStop(0.3, '#1e3454')
      gradient.addColorStop(0.7, '#162a48')
      gradient.addColorStop(1, '#0f1e38')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, w, h)

      // Rainures brossées horizontales
      for (let y = 0; y < h; y += 2) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`
        ctx.fillRect(0, y, w, 1)
      }

      // Panneau central
      ctx.strokeStyle = 'rgba(80, 140, 255, 0.15)'
      ctx.lineWidth = 2
      ctx.strokeRect(20, 40, w - 40, h - 80)

      // Panneau intérieur haut
      ctx.fillStyle = 'rgba(30, 60, 120, 0.3)'
      ctx.fillRect(30, 50, w - 60, h * 0.35)

      // Panneau intérieur bas
      ctx.fillStyle = 'rgba(25, 50, 100, 0.25)'
      ctx.fillRect(30, h * 0.5, w - 60, h * 0.35)

      // Charnières
      ctx.fillStyle = 'rgba(100, 130, 180, 0.3)'
      ctx.fillRect(5, 60, 12, 30)
      ctx.fillRect(5, h - 90, 12, 30)
    })
  }, [])
}

// Normal map procédurale pour détails
function useNormalMap() {
  return useMemo(() => {
    return createProceduralTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = 'rgb(128, 128, 255)'
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < 200; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        const r = 128 + (Math.random() - 0.5) * 20
        const g = 128 + (Math.random() - 0.5) * 20
        ctx.fillStyle = `rgb(${r},${g},255)`
        ctx.fillRect(x, y, 3, 3)
      }
    }, [4, 4])
  }, [])
}

// ============================================
// PARTICULES ATMOSPHÉRIQUES — POUSSIÈRE
// ============================================
function AtmosphericParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 600

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const vel = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * CORRIDOR_WIDTH * 0.9
      pos[i * 3 + 1] = Math.random() * CORRIDOR_HEIGHT
      pos[i * 3 + 2] = -Math.random() * TOTAL_LENGTH
      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015
    }
    return { positions: pos, velocities: vel }
  }, [])

  useFrame((state) => {
    if (!particlesRef.current) return
    const geo = particlesRef.current.geometry
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const time = state.clock.elapsedTime

    for (let i = 0; i < particleCount; i++) {
      posAttr.array[i * 3] += velocities[i * 3] + Math.sin(time * 0.3 + i) * 0.001
      posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] + Math.cos(time * 0.2 + i * 0.5) * 0.0005
      posAttr.array[i * 3 + 2] += velocities[i * 3 + 2]

      // Rebouclage
      if (posAttr.array[i * 3] > CORRIDOR_WIDTH / 2) posAttr.array[i * 3] = -CORRIDOR_WIDTH / 2
      if (posAttr.array[i * 3] < -CORRIDOR_WIDTH / 2) posAttr.array[i * 3] = CORRIDOR_WIDTH / 2
      if (posAttr.array[i * 3 + 1] > CORRIDOR_HEIGHT) posAttr.array[i * 3 + 1] = 0.1
      if (posAttr.array[i * 3 + 1] < 0) posAttr.array[i * 3 + 1] = CORRIDOR_HEIGHT
      if (posAttr.array[i * 3 + 2] > 2) posAttr.array[i * 3 + 2] = -TOTAL_LENGTH
      if (posAttr.array[i * 3 + 2] < -TOTAL_LENGTH) posAttr.array[i * 3 + 2] = 2
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#8b9cc7"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ============================================
// PARTICULES LUMINESCENTES — EFFETS NEON
// ============================================
function NeonParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const side = Math.random() > 0.5 ? 1 : -1
      pos[i * 3] = side * (CORRIDOR_WIDTH / 2 - 0.3 + Math.random() * 0.3)
      pos[i * 3 + 1] = 1.0 + Math.random() * 0.4
      pos[i * 3 + 2] = -Math.random() * TOTAL_LENGTH
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      if (positions[i * 3] < 0) {
        // Violet côté gauche
        col[i * 3] = 0.55
        col[i * 3 + 1] = 0.36
        col[i * 3 + 2] = 0.96
      } else {
        // Bleu côté droit
        col[i * 3] = 0.23
        col[i * 3 + 1] = 0.51
        col[i * 3 + 2] = 0.96
      }
    }
    return col
  }, [positions])

  useFrame((state) => {
    if (!particlesRef.current) return
    const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
    const t = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3 + 1] = 1.0 + Math.sin(t * 0.8 + i * 2.5) * 0.15
      posAttr.array[i * 3] += Math.sin(t * 0.3 + i) * 0.0003
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ============================================
// CORRIDOR ARCHITECTURE — AMÉLIORÉE
// ============================================
function CorridorArchitecture() {
  const floorTex = useFloorTexture()
  const wallTex = useWallTexture()
  const ceilTex = useCeilingTexture()
  const normalMap = useNormalMap()

  return (
    <group>
      {/* ====== SOL PRINCIPAL ====== */}
      <mesh position={[0, 0, -TOTAL_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CORRIDOR_WIDTH, TOTAL_LENGTH]} />
        <meshStandardMaterial
          map={floorTex}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.3, 0.3)}
          color="#111827"
          roughness={0.35}
          metalness={0.25}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Carrelage décoratif — bande centrale réfléchissante */}
      <mesh position={[0, 0.002, -TOTAL_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.8, TOTAL_LENGTH]} />
        <meshStandardMaterial
          color="#0c1525"
          roughness={0.15}
          metalness={0.6}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Lignes de sol luminescentes */}
      <mesh position={[-0.5, 0.003, -TOTAL_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.02, TOTAL_LENGTH]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.5, 0.003, -TOTAL_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.02, TOTAL_LENGTH]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.4} />
      </mesh>

      {/* Carreaux alternés — texture riche */}
      {Array.from({ length: CORRIDOR_COUNT * 3 }).map((_, i) => (
        <mesh
          key={`tile-${i}`}
          position={[0, 0.001, -i * 2]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[CORRIDOR_WIDTH - 0.1, 1.95]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#131928' : '#0e1520'}
            roughness={0.4}
            metalness={0.2}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      {/* ====== PLAFOND ====== */}
      <mesh position={[0, CORRIDOR_HEIGHT, -TOTAL_LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORRIDOR_WIDTH, TOTAL_LENGTH]} />
        <meshStandardMaterial
          map={ceilTex}
          color="#0d1117"
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>

      {/* Poutres de plafond transversales */}
      {Array.from({ length: CORRIDOR_COUNT + 1 }).map((_, i) => (
        <mesh
          key={`beam-${i}`}
          position={[0, CORRIDOR_HEIGHT - 0.08, -i * CORRIDOR_SEGMENT_LENGTH]}
          castShadow
        >
          <boxGeometry args={[CORRIDOR_WIDTH, 0.15, 0.12]} />
          <meshStandardMaterial color="#0e1425" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}

      {/* ====== MUR GAUCHE ====== */}
      <mesh
        position={[-CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, -TOTAL_LENGTH / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.15, CORRIDOR_HEIGHT, TOTAL_LENGTH]} />
        <meshStandardMaterial
          map={wallTex}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.2, 0.2)}
          color="#1a1a2e"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* ====== MUR DROIT ====== */}
      <mesh
        position={[CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, -TOTAL_LENGTH / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.15, CORRIDOR_HEIGHT, TOTAL_LENGTH]} />
        <meshStandardMaterial
          map={wallTex}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.2, 0.2)}
          color="#1a1a2e"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* ====== ÉCLAIRAGE PLAFOND — PANNEAUX LED AVANCÉS ====== */}
      {Array.from({ length: CORRIDOR_COUNT }).map((_, i) => (
        <group key={`light-${i}`} position={[0, CORRIDOR_HEIGHT - 0.05, -i * CORRIDOR_SEGMENT_LENGTH]}>
          {/* Boîtier luminaire */}
          <mesh>
            <boxGeometry args={[1.4, 0.06, 0.6]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Surface émissive */}
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[1.2, 0.02, 0.5]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fef3c7"
              emissiveIntensity={0.9 + Math.sin(i * 0.7) * 0.1}
            />
          </mesh>
          {/* Spot light */}
          <spotLight
            position={[0, 0, 0]}
            angle={Math.PI / 3}
            penumbra={0.6}
            intensity={2.5}
            color="#fff5e6"
            castShadow={i % 2 === 0}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.001}
          />
          {/* Lumière secondaire douce */}
          <pointLight
            position={[0, -0.5, 0]}
            intensity={0.5}
            color="#e8dcc8"
            distance={5}
            decay={2}
          />
        </group>
      ))}

      {/* ====== NÉONS MURAUX — AMÉLIORÉS ====== */}
      {/* Gauche — Violet */}
      <NeonStrip
        position={[-CORRIDOR_WIDTH / 2 + 0.05, 1.2, -TOTAL_LENGTH / 2]}
        length={TOTAL_LENGTH - 1}
        color="#8b5cf6"
        intensity={1.1}
      />
      {/* Droit — Bleu */}
      <NeonStrip
        position={[CORRIDOR_WIDTH / 2 - 0.05, 1.2, -TOTAL_LENGTH / 2]}
        length={TOTAL_LENGTH - 1}
        color="#3b82f6"
        intensity={1.1}
      />

      {/* Néons secondaires — haut des murs */}
      <NeonStrip
        position={[-CORRIDOR_WIDTH / 2 + 0.05, CORRIDOR_HEIGHT - 0.2, -TOTAL_LENGTH / 2]}
        length={TOTAL_LENGTH - 1}
        color="#6366f1"
        intensity={0.4}
        size={[0.02, 0.02]}
      />
      <NeonStrip
        position={[CORRIDOR_WIDTH / 2 - 0.05, CORRIDOR_HEIGHT - 0.2, -TOTAL_LENGTH / 2]}
        length={TOTAL_LENGTH - 1}
        color="#2563eb"
        intensity={0.4}
        size={[0.02, 0.02]}
      />

      {/* ====== PLINTHES ====== */}
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.08, 0.06, -TOTAL_LENGTH / 2]}>
        <boxGeometry args={[0.03, 0.12, TOTAL_LENGTH]} />
        <meshStandardMaterial color="#0a0e1a" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2 - 0.08, 0.06, -TOTAL_LENGTH / 2]}>
        <boxGeometry args={[0.03, 0.12, TOTAL_LENGTH]} />
        <meshStandardMaterial color="#0a0e1a" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Plinthe lumineuse au sol */}
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.08, 0.005, -TOTAL_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, TOTAL_LENGTH]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} transparent opacity={0.6} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2 - 0.08, 0.005, -TOTAL_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, TOTAL_LENGTH]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} transparent opacity={0.6} />
      </mesh>

      {/* ====== DÉTAILS ARCHITECTURAUX ====== */}
      <CorridorDetails />
    </group>
  )
}

// ============================================
// NÉON STRIP — COMPOSANT RÉUTILISABLE
// ============================================
function NeonStrip({
  position,
  length,
  color,
  intensity = 0.9,
  size = [0.03, 0.04],
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
    // Léger scintillement
    mat.emissiveIntensity = intensity + Math.sin(state.clock.elapsedTime * 3 + position[2]) * 0.05
  })

  return (
    <group>
      {/* Bande néon */}
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[size[0], size[1], length]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
        />
      </mesh>
      {/* Support métallique */}
      <mesh position={[position[0], position[1] + 0.04, position[2]]}>
        <boxGeometry args={[0.05, 0.02, length]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  )
}

// ============================================
// DÉTAILS DU CORRIDOR — Tuyaux, ventilation, câbles, etc.
// ============================================
function CorridorDetails() {
  return (
    <group>
      {/* ====== TUYAUX AU PLAFOND ====== */}
      {/* Tuyau principal gauche */}
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.5, CORRIDOR_HEIGHT - 0.18, -TOTAL_LENGTH / 2]}>
        <cylinderGeometry args={[0.04, 0.04, TOTAL_LENGTH, 8]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Rotation pour aligner horizontalement */}
      <mesh
        position={[-CORRIDOR_WIDTH / 2 + 0.5, CORRIDOR_HEIGHT - 0.18, -TOTAL_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.04, 0.04, TOTAL_LENGTH, 8]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Tuyau secondaire droit */}
      <mesh
        position={[CORRIDOR_WIDTH / 2 - 0.5, CORRIDOR_HEIGHT - 0.15, -TOTAL_LENGTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.03, 0.03, TOTAL_LENGTH, 8]} />
        <meshStandardMaterial color="#1e2940" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Supports de tuyaux */}
      {Array.from({ length: CORRIDOR_COUNT }).map((_, i) => (
        <group key={`pipe-support-${i}`}>
          {/* Support gauche */}
          <mesh position={[-CORRIDOR_WIDTH / 2 + 0.5, CORRIDOR_HEIGHT - 0.1, -i * CORRIDOR_SEGMENT_LENGTH - 1]}>
            <boxGeometry args={[0.15, 0.04, 0.04]} />
            <meshStandardMaterial color="#1a1e30" roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Support droit */}
          <mesh position={[CORRIDOR_WIDTH / 2 - 0.5, CORRIDOR_HEIGHT - 0.08, -i * CORRIDOR_SEGMENT_LENGTH - 1]}>
            <boxGeometry args={[0.12, 0.04, 0.04]} />
            <meshStandardMaterial color="#1a1e30" roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ====== GRILLES DE VENTILATION ====== */}
      {Array.from({ length: Math.floor(CORRIDOR_COUNT / 2) }).map((_, i) => (
        <VentGrill
          key={`vent-${i}`}
          position={[
            i % 2 === 0 ? -CORRIDOR_WIDTH / 2 + 0.09 : CORRIDOR_WIDTH / 2 - 0.09,
            2.8,
            -i * CORRIDOR_SEGMENT_LENGTH * 2 - 3,
          ]}
          side={i % 2 === 0 ? 'left' : 'right'}
        />
      ))}

      {/* ====== CÂBLES ÉLECTRIQUES ====== */}
      {Array.from({ length: 3 }).map((_, i) => (
        <group key={`cable-bundle-${i}`}>
          <mesh
            position={[
              -CORRIDOR_WIDTH / 2 + 0.3,
              CORRIDOR_HEIGHT - 0.25 - i * 0.04,
              -TOTAL_LENGTH / 2,
            ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.012, 0.012, TOTAL_LENGTH, 6]} />
            <meshStandardMaterial
              color={['#1a1a2e', '#2d1a3e', '#1a2e3e'][i]}
              roughness={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* ====== PANNEAUX MURAUX / NUMÉROTATION ====== */}
      {Array.from({ length: CORRIDOR_COUNT }).map((_, i) => (
        <group key={`wall-panel-${i}`}>
          {/* Panneau décoratif gauche */}
          <WallPanel
            position={[-CORRIDOR_WIDTH / 2 + 0.09, 2.0, -i * CORRIDOR_SEGMENT_LENGTH - 1.5]}
            side="left"
            index={i}
          />
          {/* Panneau décoratif droit */}
          <WallPanel
            position={[CORRIDOR_WIDTH / 2 - 0.09, 2.0, -i * CORRIDOR_SEGMENT_LENGTH - 4]}
            side="right"
            index={i}
          />
        </group>
      ))}

      {/* ====== EXTINCTEURS ====== */}
      {Array.from({ length: Math.floor(CORRIDOR_COUNT / 3) }).map((_, i) => (
        <FireExtinguisher
          key={`extinguisher-${i}`}
          position={[
            i % 2 === 0 ? -CORRIDOR_WIDTH / 2 + 0.15 : CORRIDOR_WIDTH / 2 - 0.15,
            0.8,
            -i * CORRIDOR_SEGMENT_LENGTH * 3 - 2,
          ]}
        />
      ))}

      {/* ====== CAMÉRAS DE SURVEILLANCE ====== */}
      {Array.from({ length: Math.floor(CORRIDOR_COUNT / 4) }).map((_, i) => (
        <SecurityCamera
          key={`cam-${i}`}
          position={[
            i % 2 === 0 ? -1.5 : 1.5,
            CORRIDOR_HEIGHT - 0.2,
            -i * CORRIDOR_SEGMENT_LENGTH * 4 - CORRIDOR_SEGMENT_LENGTH,
          ]}
          rotationDir={i % 2 === 0 ? 1 : -1}
        />
      ))}

      {/* ====== INDICATEURS D'ÉTAGE ====== */}
      <FloorIndicator position={[0, 2.5, 0.5]} />

      {/* ====== TAPIS DE COULOIR ====== */}
      <mesh position={[0, 0.003, -TOTAL_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, TOTAL_LENGTH - 2]} />
        <meshStandardMaterial
          color="#0d1225"
          roughness={0.95}
          metalness={0.0}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* ====== FOND DU CORRIDOR — MUR DE FIN ====== */}
      <CorridorEndWall />
    </group>
  )
}

// ============================================
// GRILLE DE VENTILATION
// ============================================
function VentGrill({ position, side }: { position: [number, number, number]; side: 'left' | 'right' }) {
  return (
    <group position={position}>
      {/* Cadre */}
      <mesh rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <boxGeometry args={[0.5, 0.25, 0.03]} />
        <meshStandardMaterial color="#1a1e30" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Lamelles */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, -0.1 + i * 0.05, 0]}
          rotation={[0.3, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <boxGeometry args={[0.45, 0.01, 0.02]} />
          <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// PANNEAU MURAL DÉCORATIF
// ============================================
function WallPanel({ position, side, index }: { position: [number, number, number]; side: 'left' | 'right'; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 0.5 + index * 1.2) * 0.1
  })

  return (
    <group position={position}>
      {/* Fond du panneau */}
      <mesh rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <boxGeometry args={[0.6, 0.35, 0.02]} />
        <meshStandardMaterial color="#0c1020" roughness={0.7} metalness={0.4} />
      </mesh>
      {/* Écran / indicateur */}
      <mesh
        ref={meshRef}
        position={[side === 'left' ? 0.005 : -0.005, 0, 0]}
        rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
      >
        <boxGeometry args={[0.5, 0.25, 0.005]} />
        <meshStandardMaterial
          color="#0e1a2e"
          emissive={index % 2 === 0 ? '#6366f1' : '#22d3ee'}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* LED d'état */}
      <mesh position={[side === 'left' ? 0.01 : -0.01, 0.14, 0.22]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.8}
        />
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
      {/* Corps */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.35, 8]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Poignée */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.03]} />
        <meshStandardMaterial color="#222222" roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Tuyau */}
      <mesh position={[0.04, 0.15, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.008, 0.008, 0.15, 6]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>
      {/* Support mural */}
      <mesh position={[0, 0.05, -0.04]}>
        <boxGeometry args={[0.12, 0.2, 0.02]} />
        <meshStandardMaterial color="#1a1e30" roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  )
}

// ============================================
// CAMÉRA DE SURVEILLANCE — ANIMÉE
// ============================================
function SecurityCamera({ position, rotationDir }: { position: [number, number, number]; rotationDir: number }) {
  const camRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (camRef.current) {
      camRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.6 * rotationDir
    }
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.3
    }
  })

  return (
    <group position={position}>
      {/* Bras de fixation */}
      <mesh>
        <boxGeometry args={[0.04, 0.15, 0.04]} />
        <meshStandardMaterial color="#1a1e30" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Tête de caméra — rotative */}
      <group ref={camRef} position={[0, -0.12, 0]}>
        <mesh rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.08, 0.06, 0.12]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Objectif */}
        <mesh position={[0, 0, 0.07]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.04, 8]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* LED d'enregistrement */}
        <mesh ref={ledRef} position={[0.035, 0.02, 0.06]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  )
}

// ============================================
// INDICATEUR D'ÉTAGE
// ============================================
function FloorIndicator({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.15
  })

  return (
    <group position={position}>
      {/* Panneau */}
      <mesh>
        <boxGeometry args={[1.0, 0.5, 0.06]} />
        <meshStandardMaterial color="#0c1020" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Écran lumineux */}
      <mesh ref={meshRef} position={[0, 0, 0.035]}>
        <boxGeometry args={[0.85, 0.35, 0.01]} />
        <meshStandardMaterial
          color="#0a1628"
          emissive="#6366f1"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Bordure lumineuse */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.92, 0.42, 0.005]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  )
}

// ============================================
// MUR DE FIN DE CORRIDOR
// ============================================
function CorridorEndWall() {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!glowRef.current) return
    const mat = glowRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime) * 0.15
  })

  return (
    <group position={[0, CORRIDOR_HEIGHT / 2, -TOTAL_LENGTH]}>
      {/* Mur principal */}
      <mesh>
        <boxGeometry args={[CORRIDOR_WIDTH, CORRIDOR_HEIGHT, 0.15]} />
        <meshStandardMaterial color="#0c1020" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Panneau décoratif central */}
      <mesh position={[0, 0.3, 0.08]}>
        <boxGeometry args={[2.0, 1.5, 0.02]} />
        <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Logo / symbole lumineux */}
      <mesh ref={glowRef} position={[0, 0.3, 0.1]}>
        <boxGeometry args={[0.8, 0.8, 0.01]} />
        <meshStandardMaterial
          color="#1a1040"
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Néon encadrant */}
      <mesh position={[0, 0.3, 0.12]}>
        <boxGeometry args={[2.1, 0.02, 0.01]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0.12]}>
        <boxGeometry args={[0.02, 1.55, 0.01]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.6} />
      </mesh>

      {/* Panneau "EXIT" ou info */}
      <mesh position={[0, 1.2, 0.1]}>
        <boxGeometry args={[0.6, 0.15, 0.02]} />
        <meshStandardMaterial color="#0a1628" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

// ============================================
// APARTMENT DOOR — AMÉLIORÉE (corridor version)
// ============================================
function ApartmentDoor({ apt }: { apt: CorridorApartment }) {
  const doorRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const animProgress = useRef(0)
  const [isOpen, setIsOpen] = useState(apt.doorState.isOpen)
  const [isHovered, setIsHovered] = useState(false)
  const doorTex = useDoorTexture()

  const { playerCard, showNotification } = useEtherWorldStore()

  useFrame((state, dt) => {
    const target = isOpen ? 1 : 0
    animProgress.current = THREE.MathUtils.lerp(animProgress.current, target, dt * 3)
    if (doorRef.current) {
      const dir = apt.side === 'left' ? 1 : -1
      doorRef.current.rotation.y = animProgress.current * (Math.PI / 2) * dir
    }
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.color.set(isOpen ? '#22c55e' : '#ef4444')
      mat.emissive.set(isOpen ? '#22c55e' : '#ef4444')
      mat.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      const hoverIntensity = isHovered ? 0.6 : 0.15
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        hoverIntensity + Math.sin(state.clock.elapsedTime * 2) * 0.05,
        dt * 5
      )
    }
  })

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation()
      const result = doorController.requestDoorInteraction(
        `door_${apt.id}`,
        playerCard,
        apt.id,
        apt.accessLevel
      )
      showNotification(result.reason, result.granted ? 'success' : 'error')
      if (result.granted) {
        setIsOpen(true)
        corridorGenerator.updateDoorState(apt.id, true)
        setTimeout(() => {
          setIsOpen(false)
          corridorGenerator.updateDoorState(apt.id, false)
        }, 5000)
      }
    },
    [apt, playerCard, showNotification]
  )

  const xOffset = apt.side === 'left' ? -CORRIDOR_WIDTH / 2 + 0.1 : CORRIDOR_WIDTH / 2 - 0.1

  return (
    <group position={[xOffset, 0, apt.position[2]]}>
      {/* ====== CADRE DE PORTE ====== */}
      {/* Montant supérieur */}
      <mesh position={[0, 2.55, 0]}>
        <boxGeometry args={[0.14, 0.1, 1.15]} />
        <meshStandardMaterial color="#0a1020" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Montants latéraux */}
      <mesh position={[0, 1.3, -0.55]}>
        <boxGeometry args={[0.12, 2.6, 0.06]} />
        <meshStandardMaterial color="#0a1020" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.3, 0.55]}>
        <boxGeometry args={[0.12, 2.6, 0.06]} />
        <meshStandardMaterial color="#0a1020" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Cadre lumineux */}
      <mesh ref={glowRef} position={[apt.side === 'left' ? 0.08 : -0.08, 1.3, 0]}>
        <boxGeometry args={[0.005, 2.5, 1.08]} />
        <meshStandardMaterial
          color="#1a1040"
          emissive={apt.forRent ? '#22c55e' : '#6366f1'}
          emissiveIntensity={0.15}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* ====== PORTE — PIVOT ====== */}
      <group position={[0, 0, -0.48]}>
        <group ref={doorRef}>
          {/* Panneau de porte principal */}
          <mesh
            position={[0, 1.25, 0.5]}
            castShadow
            onClick={handleClick}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
          >
            <boxGeometry args={[0.08, 2.45, 0.98]} />
            <meshStandardMaterial
              map={doorTex}
              color="#1e3a5f"
              metalness={0.45}
              roughness={0.35}
              envMapIntensity={0.4}
            />
          </mesh>

          {/* Accent néon de porte */}
          <mesh position={[apt.side === 'left' ? 0.045 : -0.045, 1.25, 0.5]}>
            <boxGeometry args={[0.005, 2.1, 0.75]} />
            <meshStandardMaterial
              color="#2563eb"
              emissive="#2563eb"
              emissiveIntensity={isHovered ? 0.6 : 0.3}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Ligne néon horizontale sur la porte */}
          <mesh position={[apt.side === 'left' ? 0.045 : -0.045, 1.8, 0.5]}>
            <boxGeometry args={[0.005, 0.015, 0.7]} />
            <meshStandardMaterial
              color="#8b5cf6"
              emissive="#8b5cf6"
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* Poignée de porte */}
          <group position={[apt.side === 'left' ? 0.05 : -0.05, 1.1, 0.75]}>
            {/* Base */}
            <mesh>
              <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
              <meshStandardMaterial color="#3a3a4e" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Barre */}
            <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.08, 6]} />
              <meshStandardMaterial color="#4a4a5e" roughness={0.3} metalness={0.8} />
            </mesh>
          </group>

          {/* Lecteur de carte */}
          <group position={[apt.side === 'left' ? 0.05 : -0.05, 1.3, 0.82]}>
            <mesh>
              <boxGeometry args={[0.015, 0.06, 0.04]} />
              <meshStandardMaterial color="#0a0e1a" roughness={0.4} metalness={0.6} />
            </mesh>
            {/* LED du lecteur */}
            <mesh position={[0.008, 0.02, 0]}>
              <sphereGeometry args={[0.005, 6, 6]} />
              <meshStandardMaterial
                color={isOpen ? '#22c55e' : '#ef4444'}
                emissive={isOpen ? '#22c55e' : '#ef4444'}
                emissiveIntensity={1.0}
              />
            </mesh>
          </group>
        </group>
      </group>

      {/* ====== LED D'ÉTAT ====== */}
      <mesh ref={ledRef} position={[apt.side === 'left' ? 0.08 : -0.08, 1.55, 0.55]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </mesh>

      {/* Halo de la LED */}
      <pointLight
        position={[apt.side === 'left' ? 0.15 : -0.15, 1.55, 0.55]}
        intensity={isOpen ? 0.3 : 0.15}
        color={isOpen ? '#22c55e' : '#ef4444'}
        distance={1.5}
        decay={2}
      />

      {/* ====== PLAQUE DE NUMÉRO ====== */}
      <group position={[apt.side === 'left' ? 0.09 : -0.09, 1.9, 0.55]}>
        {/* Fond plaque */}
        <mesh rotation={[0, apt.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <boxGeometry args={[0.25, 0.12, 0.01]} />
          <meshStandardMaterial color="#0a0e1a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Bordure lumineuse */}
        <mesh rotation={[0, apt.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]} position={[0, 0, -0.001]}>
          <boxGeometry args={[0.27, 0.14, 0.005]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#6366f1"
            emissiveIntensity={0.3}
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>

      {/* ====== INDICATEUR À LOUER ====== */}
      {apt.forRent && (
        <group position={[apt.side === 'left' ? 0.09 : -0.09, 0.5, 0.55]}>
          <mesh rotation={[0, apt.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <boxGeometry args={[0.22, 0.1, 0.01]} />
            <meshStandardMaterial
              color="#0a2010"
              emissive="#22c55e"
              emissiveIntensity={0.6}
            />
          </mesh>
          {/* Point lumineux */}
          <pointLight
            position={[apt.side === 'left' ? 0.05 : -0.05, 0, 0]}
            intensity={0.15}
            color="#22c55e"
            distance={1}
          />
        </group>
      )}

      {/* ====== PAILLASSON ====== */}
      <mesh
        position={[apt.side === 'left' ? 0.3 : -0.3, 0.005, apt.position[2] > 0 ? 0 : 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.6, 0.4]} />
        <meshStandardMaterial
          color="#1a1510"
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>
    </group>
  )
}

// ============================================
// CORRIDOR PLAYER — AMÉLIORÉ
// ============================================
function CorridorPlayer() {
  const groupRef = useRef<THREE.Group>(null)
  const velYRef = useRef(0)
  const keysRef = useRef<Record<string, boolean>>({})
  const camYaw = useRef(0)
  const camPitch = useRef(0)
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const bobPhase = useRef(0)
  const isMoving = useRef(false)
  const footstepPhase = useRef(0)
  const { camera } = useThree()

  useEffect(() => {
    const dn = (e: KeyboardEvent) => { keysRef.current[e.code] = true }
    const up = (e: KeyboardEvent) => { keysRef.current[e.code] = false }
    const md = (e: MouseEvent) => {
      if (e.button === 2) {
        isDragging.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
      }
    }
    const mu = () => { isDragging.current = false }
    const mm = (e: MouseEvent) => {
      if (!isDragging.current) return
      camYaw.current -= (e.clientX - lastMouse.current.x) * 0.005
      camPitch.current -= (e.clientY - lastMouse.current.y) * 0.003
      camPitch.current = THREE.MathUtils.clamp(camPitch.current, -0.5, 0.8)
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }
    const ctx = (e: Event) => e.preventDefault()
    // Zoom avec molette
    const wh = (e: WheelEvent) => {
      // Optionnel : ajuster le FOV ou la distance
    }

    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    window.addEventListener('mousedown', md)
    window.addEventListener('mouseup', mu)
    window.addEventListener('mousemove', mm)
    window.addEventListener('contextmenu', ctx)
    window.addEventListener('wheel', wh, { passive: false })
    return () => {
      window.removeEventListener('keydown', dn)
      window.removeEventListener('keyup', up)
      window.removeEventListener('mousedown', md)
      window.removeEventListener('mouseup', mu)
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('contextmenu', ctx)
      window.removeEventListener('wheel', wh)
    }
  }, [])

  useFrame((_, dt) => {
    const g = groupRef.current
    if (!g) return
    const keys = keysRef.current
    const sprint = keys['ShiftLeft'] || keys['ShiftRight']
    const speed = sprint ? 10 : 4.5
    const fwd = new THREE.Vector3(Math.sin(camYaw.current), 0, Math.cos(camYaw.current))
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize()
    const move = new THREE.Vector3()

    if (keys['KeyW']) move.addScaledVector(fwd, speed * dt)
    if (keys['KeyS']) move.addScaledVector(fwd, -speed * dt)
    if (keys['KeyA']) move.addScaledVector(right, -speed * dt)
    if (keys['KeyD']) move.addScaledVector(right, speed * dt)

    isMoving.current = move.length() > 0.001

    // Clamp to corridor
    g.position.add(move)
    g.position.x = THREE.MathUtils.clamp(g.position.x, -CORRIDOR_WIDTH / 2 + 0.5, CORRIDOR_WIDTH / 2 - 0.5)
    g.position.z = THREE.MathUtils.clamp(g.position.z, -TOTAL_LENGTH + 1, 2)

    // Jump
    if (keys['Space'] && g.position.y <= 0.01) velYRef.current = 5.5
    velYRef.current += -18 * dt
    g.position.y += velYRef.current * dt
    if (g.position.y < 0) { g.position.y = 0; velYRef.current = 0 }

    // Head bob
    if (isMoving.current && g.position.y < 0.05) {
      const bobSpeed = sprint ? 14 : 8
      bobPhase.current += dt * bobSpeed
      footstepPhase.current += dt * bobSpeed
    } else {
      bobPhase.current *= 0.9
    }
    const bobAmount = isMoving.current ? (sprint ? 0.06 : 0.03) : 0
    const headBob = Math.sin(bobPhase.current) * bobAmount

    // Camera
    const camDist = 5.5
    const camHeight = 3.5 + camPitch.current * 2
    const camPos = new THREE.Vector3(
      g.position.x - Math.sin(camYaw.current) * camDist,
      g.position.y + camHeight + headBob,
      g.position.z - Math.cos(camYaw.current) * camDist
    )
    camera.position.lerp(camPos, 0.12)
    camera.lookAt(new THREE.Vector3(g.position.x, g.position.y + 1.6, g.position.z))
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ====== PERSONNAGE COMPLET ====== */}

      {/* PIEDS */}
      <mesh castShadow position={[-0.12, 0.06, 0.05]}>
        <boxGeometry args={[0.16, 0.08, 0.26]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0.12, 0.06, 0.05]}>
        <boxGeometry args={[0.16, 0.08, 0.26]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* JAMBES */}
      <mesh castShadow position={[-0.13, 0.45, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color="#1e3055" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.13, 0.45, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.2]} />
        <meshStandardMaterial color="#1e3055" roughness={0.7} />
      </mesh>

      {/* CEINTURE */}
      <mesh castShadow position={[0, 0.82, 0]}>
        <boxGeometry args={[0.58, 0.06, 0.32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Boucle de ceinture */}
      <mesh position={[0, 0.82, 0.17]}>
        <boxGeometry args={[0.06, 0.04, 0.01]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* TORSE */}
      <mesh castShadow position={[0, 1.18, 0]}>
        <boxGeometry args={[0.6, 0.7, 0.35]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.6} />
      </mesh>

      {/* Détail veste — col */}
      <mesh position={[0, 1.52, 0.1]}>
        <boxGeometry args={[0.3, 0.05, 0.15]} />
        <meshStandardMaterial color="#333345" roughness={0.6} />
      </mesh>

      {/* Accent néon sur le torse */}
      <mesh position={[0, 1.1, 0.18]}>
        <boxGeometry args={[0.4, 0.015, 0.005]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 1.0, 0.18]}>
        <boxGeometry args={[0.35, 0.015, 0.005]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.4} />
      </mesh>

      {/* ÉPAULES */}
      <mesh castShadow position={[-0.36, 1.45, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.3]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0.36, 1.45, 0]}>
        <boxGeometry args={[0.14, 0.12, 0.3]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.6} />
      </mesh>

      {/* BRAS */}
      <mesh castShadow position={[-0.42, 1.15, 0]}>
        <boxGeometry args={[0.15, 0.55, 0.15]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0.42, 1.15, 0]}>
        <boxGeometry args={[0.15, 0.55, 0.15]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.6} />
      </mesh>

      {/* AVANT-BRAS */}
      <mesh castShadow position={[-0.42, 0.78, 0.05]}>
        <boxGeometry args={[0.13, 0.2, 0.13]} />
        <meshStandardMaterial color="#dbac83" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.42, 0.78, 0.05]}>
        <boxGeometry args={[0.13, 0.2, 0.13]} />
        <meshStandardMaterial color="#dbac83" roughness={0.7} />
      </mesh>

      {/* MAINS */}
      <mesh castShadow position={[-0.42, 0.65, 0.05]}>
        <boxGeometry args={[0.1, 0.08, 0.1]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.42, 0.65, 0.05]}>
        <boxGeometry args={[0.1, 0.08, 0.1]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* COU */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.12, 8]} />
        <meshStandardMaterial color="#dbac83" roughness={0.7} />
      </mesh>

      {/* TÊTE */}
      <mesh castShadow position={[0, 1.88, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color="#dbac83" roughness={0.6} />
      </mesh>

      {/* CHEVEUX */}
      <mesh castShadow position={[0, 2.08, -0.02]}>
        <boxGeometry args={[0.44, 0.12, 0.46]} />
        <meshStandardMaterial color="#1a1208" roughness={0.9} />
      </mesh>

      {/* YEUX */}
      <mesh position={[-0.1, 1.92, 0.215]}>
        <boxGeometry args={[0.06, 0.03, 0.01]} />
        <meshStandardMaterial color="#334155" emissive="#6366f1" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.1, 1.92, 0.215]}>
        <boxGeometry args={[0.06, 0.03, 0.01]} />
        <meshStandardMaterial color="#334155" emissive="#6366f1" emissiveIntensity={0.3} />
      </mesh>

      {/* Lumière personnage (subtile) */}
      <pointLight
        position={[0, 1.5, 0.3]}
        intensity={0.15}
        color="#6366f1"
        distance={2}
        decay={2}
      />

      {/* Ombre au sol */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// ============================================
// CORRIDOR LIGHTING — AMÉLIORÉ
// ============================================
function CorridorLighting() {
  return (
    <group>
      <ambientLight intensity={0.5} color="#1e1e3a" />
      <directionalLight
        position={[4, 5, 6]}
        intensity={0.35}
        color="#e8e0ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-near={0.1}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />
      <hemisphereLight color="#2a2a4e" groundColor="#080c18" intensity={0.35} />

      {/* Neon point lights along corridor — améliorés */}
      {Array.from({ length: CORRIDOR_COUNT }).map((_, i) => (
        <group key={`corridor-light-${i}`}>
          {/* Lumière violette gauche */}
          <pointLight
            position={[-CORRIDOR_WIDTH / 2 + 0.3, 1.2, -i * CORRIDOR_SEGMENT_LENGTH]}
            intensity={0.35}
            color="#8b5cf6"
            distance={6}
            decay={2}
          />
          {/* Lumière bleue droite */}
          <pointLight
            position={[CORRIDOR_WIDTH / 2 - 0.3, 1.2, -i * CORRIDOR_SEGMENT_LENGTH]}
            intensity={0.35}
            color="#3b82f6"
            distance={6}
            decay={2}
          />
        </group>
      ))}

      {/* Lumière d'ambiance au fond */}
      <pointLight
        position={[0, 2, -TOTAL_LENGTH + 2]}
        intensity={0.6}
        color="#6366f1"
        distance={12}
        decay={2}
      />

      {/* Lumière d'entrée */}
      <spotLight
        position={[0, CORRIDOR_HEIGHT - 0.3, 1]}
        angle={Math.PI / 4}
        penumbra={0.8}
        intensity={1.5}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </group>
  )
}

// ============================================
// CORRIDOR HUD — AMÉLIORÉ
// ============================================
function CorridorHUD({ onBackToRoom }: { onBackToRoom: () => void }) {
  const { playerCard, roomConfig } = useEtherWorldStore()
  const stats = corridorGenerator.getFloorStats(roomConfig.floor)
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* ====== TOP LEFT — Floor info ====== */}
      <div
        className="absolute top-4 left-4 pointer-events-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(106, 90, 205, 0.35), rgba(30, 58, 95, 0.4))',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          padding: '14px 18px',
          boxShadow: '0 0 25px rgba(106, 90, 205, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
          minWidth: '180px',
        }}
      >
        <div style={{ color: '#c4b5fd', fontSize: '10px', fontFamily: 'monospace', marginBottom: 6, letterSpacing: '2px' }}>
          ◈ ÉTAGE {roomConfig.floor}
        </div>
        <div style={{ color: '#ffffff', fontSize: '15px', fontFamily: 'monospace', fontWeight: 700 }}>
          🏢 COULOIR A
        </div>
        <div style={{
          color: '#94a3b8',
          fontSize: '11px',
          fontFamily: 'monospace',
          marginTop: 6,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          <span>🔑 {stats.occupied}/{stats.total}</span>
          <span>•</span>
          <span style={{ color: '#22c55e' }}>📋 {stats.forRent} disponibles</span>
        </div>
        <div style={{
          marginTop: 8,
          height: '3px',
          background: 'rgba(139, 92, 246, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(stats.occupied / stats.total) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
            borderRadius: '2px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ color: '#64748b', fontSize: '9px', fontFamily: 'monospace', marginTop: 4 }}>
          Occupation: {Math.round((stats.occupied / stats.total) * 100)}%
        </div>
      </div>

      {/* ====== TOP RIGHT — Player card & time ====== */}
      <div
        className="absolute top-4 right-4"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.4), rgba(106, 90, 205, 0.35))',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          padding: '14px 18px',
          boxShadow: '0 0 25px rgba(106, 90, 205, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
          textAlign: 'right',
          minWidth: '160px',
        }}
      >
        <div style={{ color: '#64748b', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '1px' }}>
          {time}
        </div>
        <div style={{
          color: '#c4b5fd',
          fontSize: '10px',
          fontFamily: 'monospace',
          marginTop: 4,
          letterSpacing: '1px',
        }}>
          🪪 {playerCard?.level?.toUpperCase()}
        </div>
        <div style={{ color: '#ffffff', fontSize: '13px', fontFamily: 'monospace', marginTop: 4, fontWeight: 600 }}>
          {playerCard?.name}
        </div>
        {/* Badge de niveau */}
        <div style={{
          marginTop: 6,
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '9px',
          fontFamily: 'monospace',
          background: playerCard?.level === 'admin'
            ? 'rgba(239, 68, 68, 0.2)'
            : playerCard?.level === 'resident'
              ? 'rgba(34, 197, 94, 0.2)'
              : 'rgba(59, 130, 246, 0.2)',
          color: playerCard?.level === 'admin'
            ? '#fca5a5'
            : playerCard?.level === 'resident'
              ? '#86efac'
              : '#93c5fd',
          border: `1px solid ${
            playerCard?.level === 'admin'
              ? 'rgba(239, 68, 68, 0.3)'
              : playerCard?.level === 'resident'
                ? 'rgba(34, 197, 94, 0.3)'
                : 'rgba(59, 130, 246, 0.3)'
          }`,
        }}>
          {playerCard?.level === 'admin' ? '⚡ ADMIN' : playerCard?.level === 'resident' ? '🏠 RÉSIDENT' : '👤 VISITEUR'}
        </div>
      </div>

      {/* ====== MINIMAP — TOP CENTER ====== */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2"
        style={{
          background: 'rgba(10, 14, 26, 0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: '10px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '8px',
          width: '200px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: '#6366f1', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '3px' }}>
          ETHERWORLD QC
        </div>
      </div>

      {/* ====== BOTTOM — Controls ====== */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        style={{
          background: 'linear-gradient(135deg, rgba(106, 90, 205, 0.2), rgba(30, 58, 95, 0.25))',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          padding: '10px 24px',
          boxShadow: '0 0 15px rgba(106, 90, 205, 0.15)',
        }}
      >
        <div style={{
          color: '#94a3b8',
          fontSize: '11px',
          fontFamily: 'monospace',
          textAlign: 'center',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>WASD</kbd> Déplacer</span>
          <span style={{ color: '#4a4a6e' }}>│</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>SHIFT</kbd> Sprint</span>
          <span style={{ color: '#4a4a6e' }}>│</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>SPACE</kbd> Sauter</span>
          <span style={{ color: '#4a4a6e' }}>│</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>RMB</kbd> Tourner</span>
          <span style={{ color: '#4a4a6e' }}>│</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>CLIC</kbd> Interagir</span>
        </div>
      </div>

      {/* ====== BACK BUTTON ====== */}
      <button
        className="absolute bottom-4 left-4 pointer-events-auto"
        onClick={onBackToRoom}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.85), rgba(15, 23, 42, 0.9))',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          padding: '12px 20px',
          color: '#93c5fd',
          fontSize: '12px',
          fontFamily: 'monospace',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
          transition: 'all 0.3s ease',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.7)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
        }}
      >
        ◄ Retour chambre
      </button>

      {/* ====== BOTTOM RIGHT — FPS / DEBUG ====== */}
      <div
        className="absolute bottom-4 right-4"
        style={{
          background: 'rgba(10, 14, 26, 0.5)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          padding: '6px 12px',
        }}
      >
        <div style={{ color: '#4a4a6e', fontSize: '9px', fontFamily: 'monospace' }}>
          ETHERWORLD v0.3 • QC
        </div>
      </div>
    </div>
  )
}

// ============================================
// CORRIDOR VIEW — EXPORT PRINCIPAL
// ============================================
export function CorridorView() {
  const { setCurrentView, roomConfig } = useEtherWorldStore()
  const [apartments, setApartments] = useState<CorridorApartment[]>([])

  useEffect(() => {
    const apts = corridorGenerator.generateApartments(roomConfig.floor, 20)
    setApartments(apts)
  }, [roomConfig.floor])

  const handleBackToRoom = useCallback(() => {
    setCurrentView('room')
  }, [setCurrentView])

  return (
    <div className="w-full h-screen bg-[#050510] relative overflow-hidden">
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(99, 102, 241, 0.03), transparent 70%)',
        }}
      />

      <Canvas
        shadows
        camera={{ position: [0, 3, 6], fov: 55, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          shadowMap: { enabled: true, type: THREE.PCFShadowMap },
          powerPreference: 'high-performance',
          alpha: false,
        } as any}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.3} />
          <fog attach="fog" args={['#06060f', 15, 50]} />

          <CorridorLighting />
          <CorridorArchitecture />

          {apartments.map((apt) => (
            <ApartmentDoor key={apt.id} apt={apt} />
          ))}

          <CorridorPlayer />
          <AtmosphericParticles />
          <NeonParticles />
          <CustomPostProcessing />
        </Suspense>
      </Canvas>

      <CorridorHUD onBackToRoom={handleBackToRoom} />
    </div>
  )
}
