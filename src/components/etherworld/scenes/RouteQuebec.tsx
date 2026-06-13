'use client'

import { useRef, useMemo, memo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES GLOBALES
// ════════════════════════════════════════════════════════════════════════════

const BLOCK_SIZE = 40
const ROAD_WIDTH = 12
const SPACING = BLOCK_SIZE + ROAD_WIDTH
const SIDEWALK_HEIGHT = 0.15
const CROSSWALK_WIDTH = 4

const COLORS = {
  asphalt: '#1e2024',
  asphaltWet: '#161820',
  sidewalk: '#8e96a4',
  sidewalkDark: '#6a7280',
  sidewalkCurb: '#5a6270',
  crosswalk: '#e8edf5',
  roadLine: '#fbbf24',
  roadLineWhite: '#d4d8e0',
  grass: '#3b5e2b',
  parkGrass: '#446e32',
  building: '#2a2a3e',
  window: '#1e3a5f',
  windowLit: '#fef3c7',
  concrete: '#9ca3af',
  metal: '#4b5563',
  brick: '#6b3a2a',
  darkMetal: '#374151',
}

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

function useAsphaltTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1e2024'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 4000; i++) {
      const s = 25 + Math.random() * 20
      ctx.fillStyle = `rgb(${s},${s + 1},${s + 2})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 0.8
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      let x = Math.random() * w, y = Math.random() * h
      ctx.moveTo(x, y)
      for (let j = 0; j < 6; j++) { x += (Math.random() - 0.5) * 70; y += (Math.random() - 0.5) * 70; ctx.lineTo(x, y) }
      ctx.stroke()
    }
    for (let i = 0; i < 3; i++) {
      const grad = ctx.createRadialGradient(Math.random() * w, Math.random() * h, 0, Math.random() * w, Math.random() * h, 15 + Math.random() * 10)
      grad.addColorStop(0, 'rgba(15,12,8,0.15)'); grad.addColorStop(1, 'rgba(15,12,8,0)')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
    }
  }, [8, 8]), [])
}

function useSidewalkTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#8a919e'
    ctx.fillRect(0, 0, w, h)
    const tileW = w / 4, tileH = h / 4
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = c * tileW, y = r * tileH, shade = 130 + Math.random() * 15
      ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 10})`
      ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2)
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, tileW, tileH)
    }
    for (let i = 0; i < 500; i++) { const s = 120 + Math.random() * 30; ctx.fillStyle = `rgba(${s},${s},${s},0.03)`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
  }, [4, 4]), [])
}

function useBrickTexture() {
  return useMemo(() => createCanvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#5a2a1a'; ctx.fillRect(0, 0, w, h)
    const bW = 40, bH = 18
    for (let row = 0; row < Math.ceil(h / bH); row++) {
      const off = (row % 2 === 0) ? 0 : bW / 2
      for (let col = -1; col < Math.ceil(w / bW) + 1; col++) {
        const x = col * bW + off, y = row * bH
        ctx.fillStyle = `rgb(${85 + Math.random() * 25},${35 + Math.random() * 15},${20 + Math.random() * 12})`
        ctx.fillRect(x + 1, y + 1, bW - 2, bH - 2)
      }
    }
    ctx.strokeStyle = 'rgba(120,100,80,0.4)'; ctx.lineWidth = 2
    for (let y = 0; y < h; y += bH) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
  }, [3, 3]), [])
}

function useConcreteTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c8c4bc'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 2000; i++) { const s = 180 + Math.random() * 30; ctx.fillStyle = `rgba(${s},${s - 2},${s - 5},0.04)`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
  }, [2, 2]), [])
}

function useGrassTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a5e2a'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 3000; i++) { const g = 50 + Math.random() * 50; ctx.fillStyle = `rgba(${20 + Math.random() * 20},${g},${10 + Math.random() * 15},0.08)`; ctx.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3) }
  }, [6, 6]), [])
}

function useWindowTexture() {
  return useMemo(() => createCanvasTexture(64, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2a2a3e'; ctx.fillRect(0, 0, w, h)
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1a3050'); grad.addColorStop(0.5, '#1e3a5f'); grad.addColorStop(1, '#152a45')
    ctx.fillStyle = grad; ctx.fillRect(3, 3, w - 6, h - 6)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(4, 4, w * 0.4, h * 0.6)
    ctx.fillStyle = '#2a2a3e'; ctx.fillRect(w / 2 - 1, 3, 2, h - 6); ctx.fillRect(3, h / 2 - 1, w - 6, 2)
  }), [])
}

// ═══ NOUVEAU — Textures route de campagne ═══

function useHighwayAsphaltTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 5000; i++) { const s = 45 + Math.random() * 25; ctx.fillStyle = `rgb(${s},${s},${s + 2})`; ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2) }
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.8
    for (let i = 0; i < 5; i++) { ctx.beginPath(); let x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y); for (let j = 0; j < 6; j++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; ctx.lineTo(x, y) }; ctx.stroke() }
    ctx.strokeStyle = 'rgba(30,28,22,0.04)'; ctx.lineWidth = 10
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(0, h * (0.3 + i * 0.4)); ctx.lineTo(w, h * (0.3 + i * 0.4) + (Math.random() - 0.5) * 6); ctx.stroke() }
  }, [14, 1]), [])
}

function useFieldGrassTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a5a28'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 4000; i++) { const g = 45 + Math.random() * 50; ctx.fillStyle = `rgba(${18 + Math.random() * 20},${g},${8 + Math.random() * 12},0.06)`; ctx.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 4) }
    for (let i = 0; i < 4; i++) { const grad = ctx.createRadialGradient(Math.random() * w, Math.random() * h, 0, Math.random() * w, Math.random() * h, 8); grad.addColorStop(0, 'rgba(60,45,25,0.06)'); grad.addColorStop(1, 'rgba(60,45,25,0)'); ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h) }
  }, [10, 10]), [])
}

function useGravelShoulderTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#6a6458'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 3000; i++) { const s = 80 + Math.random() * 40; ctx.fillStyle = `rgb(${s},${s - 4},${s - 10})`; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill() }
  }, [8, 1]), [])
}

// ════════════════════════════════════════════════════════════════════════════
// PARTICULES ATMOSPHÉRIQUES VILLE
// ════════════════════════════════════════════════════════════════════════════

const CityParticles = memo(function CityParticles({ timeOfDay }: { timeOfDay: number }) {
  const ref = useRef<THREE.Points>(null)
  const isNight = timeOfDay < 6 || timeOfDay >= 20
  const count = 500
  const positions = useMemo(() => { const pos = new Float32Array(count * 3); for (let i = 0; i < count; i++) { pos[i * 3] = (Math.random() - 0.5) * 200; pos[i * 3 + 1] = Math.random() * 30; pos[i * 3 + 2] = (Math.random() - 0.5) * 200 }; return pos }, [])
  useFrame((state) => { if (!ref.current) return; const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute; const t = state.clock.elapsedTime; for (let i = 0; i < count; i++) { attr.array[i * 3] += Math.sin(t * 0.1 + i) * 0.01; attr.array[i * 3 + 1] -= 0.005 + Math.random() * 0.005; attr.array[i * 3 + 2] += Math.cos(t * 0.08 + i * 0.5) * 0.008; if ((attr.array[i * 3 + 1] as number) < 0) (attr.array as Float32Array)[i * 3 + 1] = 25 + Math.random() * 5 }; attr.needsUpdate = true })
  return (<points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry><pointsMaterial size={isNight ? 0.08 : 0.04} color={isNight ? '#fef3c7' : '#c8d8e8'} transparent opacity={isNight ? 0.4 : 0.15} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} /></points>)
})

// ════════════════════════════════════════════════════════════════════════════
// LAMPADAIRE URBAIN
// ════════════════════════════════════════════════════════════════════════════

export const StreetLamp = memo(function StreetLamp({ position = [0, 0, 0] as [number, number, number], style = 'modern' as 'modern' | 'classic' | 'highway', timeOfDay = 20 }) {
  const lightRef = useRef<THREE.PointLight>(null)
  const isNight = timeOfDay < 6 || timeOfDay >= 19
  useFrame((state) => { if (lightRef.current && isNight) lightRef.current.intensity = 1.8 + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.15 })

  if (style === 'classic') return (
    <group position={position}>
      <mesh castShadow><cylinderGeometry args={[0.08, 0.12, 5, 8]} /><meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, -2.3, 0]} castShadow><cylinderGeometry args={[0.2, 0.25, 0.4, 8]} /><meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 2.6, 0.4]} rotation={[0.3, 0, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 1, 6]} /><meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} /></mesh>
      <group position={[0, 2.8, 0.7]}>
        <mesh castShadow><boxGeometry args={[0.3, 0.4, 0.3]} /><meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} /></mesh>
        <mesh><boxGeometry args={[0.25, 0.35, 0.25]} /><meshStandardMaterial color="#fef3c7" emissive={isNight ? '#fef3c7' : '#000'} emissiveIntensity={isNight ? 0.6 : 0} transparent opacity={0.8} /></mesh>
        <mesh position={[0, 0.25, 0]}><coneGeometry args={[0.22, 0.15, 4]} /><meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} /></mesh>
        {isNight && <pointLight ref={lightRef} position={[0, -0.1, 0]} intensity={1.8} color="#ffeedd" distance={18} decay={2} castShadow shadow-mapSize={[256, 256]} />}
      </group>
    </group>
  )

  return (
    <group position={position}>
      <mesh castShadow><cylinderGeometry args={[0.08, 0.12, 6, 8]} /><meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, -2.8, 0]}><boxGeometry args={[0.35, 0.15, 0.35]} /><meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[0, 3.2, 0.6]} rotation={[0.2, 0, 0]} castShadow><boxGeometry args={[0.06, 0.06, 1.2]} /><meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} /></mesh>
      <group position={[0, 3.1, 1.1]}>
        <mesh castShadow><boxGeometry args={[0.5, 0.08, 0.25]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[0, -0.03, 0]}><boxGeometry args={[0.45, 0.02, 0.2]} /><meshStandardMaterial color="#fef3c7" emissive={isNight ? '#fef3c7' : '#000'} emissiveIntensity={isNight ? 0.7 : 0} /></mesh>
        {isNight && <pointLight ref={lightRef} position={[0, -0.2, 0]} intensity={1.8} color="#ffeedd" distance={22} decay={2} castShadow shadow-mapSize={[256, 256]} />}
      </group>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// FEU DE CIRCULATION
// ════════════════════════════════════════════════════════════════════════════

const TrafficLight = memo(function TrafficLight({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const redRef = useRef<THREE.Mesh>(null); const yellowRef = useRef<THREE.Mesh>(null); const greenRef = useRef<THREE.Mesh>(null)
  useFrame((state) => { const cycle = state.clock.elapsedTime % 12; const setL = (ref: React.RefObject<THREE.Mesh | null>, active: boolean, color: string) => { if (ref.current) { const mat = ref.current.material as THREE.MeshStandardMaterial; mat.emissiveIntensity = active ? 1.2 : 0.05; mat.color.set(active ? color : '#1a1a1a') } }; setL(redRef, cycle < 5, '#ef4444'); setL(yellowRef, cycle >= 5 && cycle < 7, '#fbbf24'); setL(greenRef, cycle >= 7, '#22c55e') })
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow><cylinderGeometry args={[0.06, 0.08, 5, 6]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, 2.6, 0.8]} rotation={[0.05, 0, 0]} castShadow><boxGeometry args={[0.06, 0.06, 1.6]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} /></mesh>
      <group position={[0, 2.5, 1.5]}>
        <mesh castShadow><boxGeometry args={[0.25, 0.8, 0.18]} /><meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} /></mesh>
        <mesh position={[0, 0.25, 0.12]}><boxGeometry args={[0.2, 0.06, 0.12]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
        <mesh position={[0, 0, 0.12]}><boxGeometry args={[0.2, 0.06, 0.12]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
        <mesh position={[0, -0.25, 0.12]}><boxGeometry args={[0.2, 0.06, 0.12]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
        <mesh ref={redRef} position={[0, 0.25, 0.1]}><circleGeometry args={[0.06, 12]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} /></mesh>
        <mesh ref={yellowRef} position={[0, 0, 0.1]}><circleGeometry args={[0.06, 12]} /><meshStandardMaterial color="#1a1a1a" emissive="#fbbf24" emissiveIntensity={0.05} /></mesh>
        <mesh ref={greenRef} position={[0, -0.25, 0.1]}><circleGeometry args={[0.06, 12]} /><meshStandardMaterial color="#1a1a1a" emissive="#22c55e" emissiveIntensity={0.05} /></mesh>
      </group>
    </group>
  )
})

const StreetSign = memo(function StreetSign({ position, rotation = [0, 0, 0], text, color = '#2255aa' }: { position: [number, number, number]; rotation?: [number, number, number]; text: string; color?: string }) {
  return (<group position={position} rotation={rotation}><mesh castShadow><cylinderGeometry args={[0.04, 0.05, 3, 6]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh><mesh position={[0, 1.6, 0.06]} castShadow><boxGeometry args={[1.2, 0.3, 0.03]} /><meshStandardMaterial color={color} roughness={0.4} metalness={0.2} /></mesh><Text position={[0, 1.6, 0.08]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle">{text}</Text></group>)
})

const BusStop = memo(function BusStop({ position }: { position: [number, number, number] }) {
  return (<group position={position}><mesh position={[-1, 1.5, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 3, 6]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh><mesh position={[1, 1.5, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 3, 6]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh><mesh position={[0, 3, 0.15]} castShadow><boxGeometry args={[2.4, 0.06, 1.2]} /><meshStandardMaterial color="#2a3a5a" metalness={0.5} roughness={0.4} /></mesh><mesh position={[0, 1.8, -0.35]}><boxGeometry args={[2.3, 2.4, 0.04]} /><meshStandardMaterial color="#1a2a4a" transparent opacity={0.4} metalness={0.6} roughness={0.2} /></mesh><mesh position={[0, 0.5, -0.1]} castShadow><boxGeometry args={[1.8, 0.05, 0.4]} /><meshStandardMaterial color="#555" metalness={0.5} roughness={0.5} /></mesh>{[-0.7, 0.7].map((x, i) => (<mesh key={i} position={[x, 0.25, -0.1]}><cylinderGeometry args={[0.02, 0.02, 0.5, 6]} /><meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} /></mesh>))}<mesh position={[0, 2.8, 0.18]}><boxGeometry args={[0.8, 0.25, 0.02]} /><meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.15} /></mesh><Text position={[0, 2.8, 0.2]} fontSize={0.1} color="#ffffff" anchorX="center" anchorY="middle">RTC Québec</Text></group>)
})

const ParkBench = memo(function ParkBench({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (<group position={position} rotation={rotation}>{[-0.12, 0, 0.12].map((z, i) => (<mesh key={i} position={[0, 0.45, z]} castShadow><boxGeometry args={[1.6, 0.04, 0.1]} /><meshStandardMaterial color="#6b4423" roughness={0.7} /></mesh>))}{[-0.08, 0.08].map((off, i) => (<mesh key={`b-${i}`} position={[0, 0.7 + off * 1.5, -0.22]} castShadow><boxGeometry args={[1.6, 0.04, 0.08]} /><meshStandardMaterial color="#6b4423" roughness={0.7} /></mesh>))}{[-0.65, 0.65].map((x, i) => (<group key={i}><mesh position={[x, 0.22, 0]} castShadow><boxGeometry args={[0.06, 0.44, 0.35]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} /></mesh><mesh position={[x, 0.55, 0]}><boxGeometry args={[0.06, 0.06, 0.35]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} /></mesh></group>))}</group>)
})

const TrashBin = memo(function TrashBin({ position }: { position: [number, number, number] }) {
  return (<group position={position}><mesh castShadow><cylinderGeometry args={[0.2, 0.22, 0.8, 8]} /><meshStandardMaterial color="#2a4a2a" roughness={0.6} metalness={0.3} /></mesh><mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.22, 0.2, 0.04, 8]} /><meshStandardMaterial color="#1a3a1a" roughness={0.5} metalness={0.4} /></mesh><mesh position={[0, 0.44, 0.1]}><boxGeometry args={[0.15, 0.005, 0.06]} /><meshStandardMaterial color="#0a0a0a" /></mesh></group>)
})

const DetailedTree = memo(function DetailedTree({ position, scale = 1, type = 'deciduous' }: { position: [number, number, number]; scale?: number; type?: 'deciduous' | 'conifer' | 'birch' }) {
  const leavesRef = useRef<THREE.Group>(null)
  useFrame((state) => { if (leavesRef.current) { leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.01 * scale; leavesRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2 + position[2]) * 0.008 * scale } })
  const tc = type === 'birch' ? '#c8b898' : '#4a3525'; const lc = type === 'conifer' ? '#1a4a1a' : '#2d5a1e'
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 1.8, 0]} castShadow><cylinderGeometry args={[0.15 * scale, 0.25 * scale, 3.6, 8]} /><meshStandardMaterial color={tc} roughness={0.85} /></mesh>
      {[0, 120, 240].map((a, i) => (<mesh key={i} position={[Math.sin((a * Math.PI) / 180) * 0.2, 0.08, Math.cos((a * Math.PI) / 180) * 0.2]} rotation={[0, (a * Math.PI) / 180, 0.5]} castShadow><cylinderGeometry args={[0.04, 0.08, 0.5, 4]} /><meshStandardMaterial color={tc} roughness={0.9} /></mesh>))}
      <group ref={leavesRef}>
        {type === 'conifer' ? [0, 0.8, 1.6, 2.2].map((y, i) => (<mesh key={i} position={[0, 3 + y, 0]} castShadow><coneGeometry args={[1.5 - i * 0.3, 1.2, 8]} /><meshStandardMaterial color={lc} roughness={0.85} /></mesh>)) : (<>
          <mesh position={[0, 4.2, 0]} castShadow><sphereGeometry args={[1.8 * scale, 8, 8]} /><meshStandardMaterial color={lc} roughness={0.82} /></mesh>
          <mesh position={[-0.8, 3.8, 0.5]} castShadow><sphereGeometry args={[1.2 * scale, 6, 6]} /><meshStandardMaterial color="#347a22" roughness={0.85} /></mesh>
          <mesh position={[0.7, 3.5, -0.4]} castShadow><sphereGeometry args={[1.0 * scale, 6, 6]} /><meshStandardMaterial color="#2a5a18" roughness={0.85} /></mesh>
        </>)}
      </group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.5 * scale, 12]} /><meshBasicMaterial color="#000" transparent opacity={0.15} depthWrite={false} /></mesh>
    </group>
  )
})

const FireHydrant = memo(function FireHydrant({ position }: { position: [number, number, number] }) {
  return (<group position={position}><mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.1, 0.12, 0.6, 8]} /><meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.3} /></mesh><mesh position={[0, 0.65, 0]} castShadow><cylinderGeometry args={[0.12, 0.1, 0.1, 8]} /><meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.3} /></mesh>{[-1, 1].map((s, i) => (<mesh key={i} position={[s * 0.12, 0.35, 0]} rotation={[0, 0, s * Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 0.08, 6]} /><meshStandardMaterial color="#aa1818" roughness={0.5} metalness={0.4} /></mesh>))}<mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.04, 0.04, 0.06, 6]} /><meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} /></mesh></group>)
})

const Mailbox = memo(function Mailbox({ position }: { position: [number, number, number] }) {
  return (<group position={position}><mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 1, 6]} /><meshStandardMaterial color="#cc0000" roughness={0.5} metalness={0.3} /></mesh><mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[0.35, 0.45, 0.25]} /><meshStandardMaterial color="#cc0000" roughness={0.5} metalness={0.2} /></mesh><mesh position={[0, 1.35, 0]}><boxGeometry args={[0.37, 0.04, 0.27]} /><meshStandardMaterial color="#aa0000" roughness={0.4} metalness={0.3} /></mesh><mesh position={[0, 1.15, 0.13]}><boxGeometry args={[0.2, 0.02, 0.005]} /><meshStandardMaterial color="#1a1a1a" /></mesh><mesh position={[0, 1.25, 0.13]}><boxGeometry args={[0.15, 0.08, 0.003]} /><meshStandardMaterial color="#fff" roughness={0.8} /></mesh></group>)
})

// ════════════════════════════════════════════════════════════════════════════
// URBAN GRID, HOTEL, DEPANNEUR, GENERIC BUILDING, CENTRAL PARK
// (tout identique — je les garde exactement comme tu les avais)
// ════════════════════════════════════════════════════════════════════════════

export const UrbanGrid = memo(function UrbanGrid({ timeOfDay = 20 }: { timeOfDay?: number }) {
  const asphaltTex = useAsphaltTexture(); const sidewalkTex = useSidewalkTexture()
  const blocks = useMemo(() => { const r = []; for (let cx = -2; cx <= 2; cx++) for (let cz = -2; cz <= 2; cz++) r.push({ cx, cz }); return r }, [])
  return (<group>{blocks.map(({ cx, cz }) => { const x = cx * SPACING, z = cz * SPACING; return (<group key={`b-${cx}-${cz}`} position={[x, 0, z]}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><planeGeometry args={[SPACING, SPACING]} /><meshStandardMaterial map={asphaltTex} color={COLORS.asphalt} roughness={0.88} metalness={0.02} /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.1, 0.015, 0]}><planeGeometry args={[0.08, SPACING - BLOCK_SIZE]} /><meshStandardMaterial color={COLORS.roadLine} /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.015, 0]}><planeGeometry args={[0.08, SPACING - BLOCK_SIZE]} /><meshStandardMaterial color={COLORS.roadLine} /></mesh>{[-BLOCK_SIZE / 2 - 0.3, BLOCK_SIZE / 2 + 0.3].map((o, i) => (<mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[o, 0.015, 0]}><planeGeometry args={[0.06, SPACING - BLOCK_SIZE + 2]} /><meshStandardMaterial color={COLORS.roadLineWhite} transparent opacity={0.6} /></mesh>))}{[[-BLOCK_SIZE / 2, 0], [BLOCK_SIZE / 2, 0], [0, -BLOCK_SIZE / 2], [0, BLOCK_SIZE / 2]].map(([px, pz], i) => (<group key={`c-${i}`} position={[px, 0.016, pz]} rotation={[-Math.PI / 2, i < 2 ? 0 : Math.PI / 2, 0]}>{Array.from({ length: 8 }).map((_, j) => (<mesh key={j} position={[-CROSSWALK_WIDTH / 2 + 0.3 + j * 0.55, 0, 0]}><planeGeometry args={[0.35, ROAD_WIDTH - 1]} /><meshStandardMaterial color={COLORS.crosswalk} transparent opacity={0.8} /></mesh>))}</group>))}<mesh position={[0, SIDEWALK_HEIGHT / 2, 0]} receiveShadow castShadow><boxGeometry args={[BLOCK_SIZE, SIDEWALK_HEIGHT, BLOCK_SIZE]} /><meshStandardMaterial map={sidewalkTex} color={COLORS.sidewalk} roughness={0.75} /></mesh><mesh position={[0, SIDEWALK_HEIGHT / 2 - 0.02, 0]}><boxGeometry args={[BLOCK_SIZE + 0.4, SIDEWALK_HEIGHT + 0.04, BLOCK_SIZE + 0.4]} /><meshStandardMaterial color={COLORS.sidewalkCurb} roughness={0.7} /></mesh><StreetLamp position={[-BLOCK_SIZE / 2 + 2, SIDEWALK_HEIGHT, -BLOCK_SIZE / 2 - 2]} style="classic" timeOfDay={timeOfDay} /><StreetLamp position={[BLOCK_SIZE / 2 - 2, SIDEWALK_HEIGHT, -BLOCK_SIZE / 2 - 2]} style="modern" timeOfDay={timeOfDay} /><StreetLamp position={[-BLOCK_SIZE / 2 + 2, SIDEWALK_HEIGHT, BLOCK_SIZE / 2 + 2]} style="classic" timeOfDay={timeOfDay} /><StreetLamp position={[BLOCK_SIZE / 2 - 2, SIDEWALK_HEIGHT, BLOCK_SIZE / 2 + 2]} style="modern" timeOfDay={timeOfDay} /></group>) })}</group>)
})

export const HotelBuilding = memo(function HotelBuilding({ position = [0, 0, 0], onEnter, timeOfDay = 20 }: { position?: [number, number, number]; onEnter?: () => void; timeOfDay?: number }) {
  const signRef = useRef<THREE.PointLight>(null); const brickTex = useBrickTexture(); const concreteTex = useConcreteTexture(); const windowTex = useWindowTexture(); const isNight = timeOfDay < 6 || timeOfDay >= 19
  useFrame((state) => { if (signRef.current) signRef.current.intensity = isNight ? 2 + Math.sin(state.clock.elapsedTime * 2) * 0.5 : 0.3 })
  return (<group position={position}><mesh position={[0, 0.15, 0]} receiveShadow><boxGeometry args={[26, 0.3, 21]} /><meshStandardMaterial color="#2a2a3e" roughness={0.8} metalness={0.1} /></mesh><mesh position={[0, 8, 0]} castShadow receiveShadow><boxGeometry args={[24, 16, 19]} /><meshStandardMaterial map={brickTex} color="#3a2a22" roughness={0.85} /></mesh><mesh position={[0, 8, 9.6]} castShadow><boxGeometry args={[22, 15, 0.3]} /><meshStandardMaterial map={concreteTex} color="#c8c0b4" roughness={0.7} /></mesh>{[-10.5, -5, 0, 5, 10.5].map((x, i) => (<mesh key={i} position={[x, 8, 9.85]} castShadow><boxGeometry args={[0.4, 15.5, 0.2]} /><meshStandardMaterial color="#b0a898" roughness={0.6} metalness={0.1} /></mesh>))}<mesh position={[0, 15.8, 9.9]} castShadow><boxGeometry args={[23, 0.4, 0.5]} /><meshStandardMaterial color="#a89880" roughness={0.5} metalness={0.15} /></mesh>{[0, 1, 2, 3].map((fl) => [-8, -4, 0, 4, 8].map((x, i) => { const isLit = Math.sin(fl * 7 + i * 13) * 0.5 + 0.5 < (isNight ? 0.65 : 0.15); return (<group key={`w-${fl}-${i}`} position={[x, 2.5 + fl * 3.5, 9.82]}><mesh><boxGeometry args={[2.6, 2.2, 0.08]} /><meshStandardMaterial color="#2a2a3e" roughness={0.5} metalness={0.3} /></mesh><mesh position={[0, 0, 0.045]}><boxGeometry args={[2.4, 2.0, 0.02]} /><meshStandardMaterial map={windowTex} color={isLit ? '#fef3c7' : COLORS.window} emissive={isLit ? '#fef3c7' : '#000'} emissiveIntensity={isLit ? 0.4 : 0} transparent opacity={isLit ? 0.85 : 0.7} metalness={isLit ? 0.1 : 0.8} roughness={0.1} /></mesh><mesh position={[0, -1.15, 0.12]}><boxGeometry args={[2.7, 0.08, 0.2]} /><meshStandardMaterial color="#a89880" roughness={0.6} /></mesh>{isLit && isNight && <pointLight position={[0, 0, 0.5]} intensity={0.2} color="#fef3c7" distance={3} />}</group>) }))}<group position={[0, 0, 10]}><mesh position={[0, 3.5, 1.5]} castShadow><boxGeometry args={[6, 0.08, 3]} /><meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.3} /></mesh>{[-2.5, 2.5].map((x, i) => (<mesh key={i} position={[x, 1.8, 2.8]} castShadow><cylinderGeometry args={[0.06, 0.06, 3.5, 6]} /><meshStandardMaterial color={COLORS.darkMetal} metalness={0.6} roughness={0.3} /></mesh>))}{[-1.2, 1.2].map((x, i) => (<group key={i}><mesh position={[x, 1.6, 0.1]}><boxGeometry args={[2, 3.2, 0.06]} /><meshPhysicalMaterial color="#6366f1" transparent opacity={0.25} metalness={0.9} roughness={0.1} /></mesh><mesh position={[x + (i === 0 ? 0.8 : -0.8), 1.3, 0.18]}><boxGeometry args={[0.03, 0.4, 0.04]} /><meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} /></mesh></group>))}{[-2.3, 0, 2.3].map((x, i) => (<mesh key={i} position={[x, 1.6, 0.05]} castShadow><boxGeometry args={[0.1, 3.4, 0.15]} /><meshStandardMaterial color={COLORS.darkMetal} metalness={0.6} roughness={0.3} /></mesh>))}<mesh position={[0, 3.3, 0.05]} castShadow><boxGeometry args={[4.7, 0.1, 0.15]} /><meshStandardMaterial color={COLORS.darkMetal} metalness={0.6} roughness={0.3} /></mesh><mesh position={[0, 0.02, 1.5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.5, 2]} /><meshStandardMaterial color="#1a1010" roughness={0.95} /></mesh>{[0, 1].map((s, i) => (<mesh key={i} position={[0, 0.08 + i * 0.08, 2.5 + i * 0.4]} castShadow><boxGeometry args={[5, 0.08, 0.4]} /><meshStandardMaterial color="#8a8078" roughness={0.6} metalness={0.1} /></mesh>))}{isNight && <><spotLight position={[0, 3.4, 1.5]} angle={Math.PI / 3} penumbra={0.8} intensity={2} color="#fff8e0" castShadow shadow-mapSize={[512, 512]} />{[-2, 2].map((x, i) => (<pointLight key={i} position={[x, 2.5, 1]} intensity={0.6} color="#fef3c7" distance={5} decay={2} />))}</>}</group><group position={[0, 14.5, 9.95]}><mesh castShadow><boxGeometry args={[12, 1.8, 0.15]} /><meshStandardMaterial color="#0f1419" roughness={0.6} metalness={0.3} /></mesh><mesh position={[0, 0, 0.08]}><boxGeometry args={[11.8, 1.6, 0.005]} /><meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} /></mesh><mesh position={[0, 0, 0.09]}><boxGeometry args={[11.5, 1.3, 0.005]} /><meshStandardMaterial color="#0a0e14" roughness={0.5} /></mesh><Text position={[0, 0.15, 0.1]} fontSize={0.7} color="#f97316" anchorX="center" anchorY="middle">HÔTEL ETHERWORLD</Text><Text position={[0, -0.4, 0.1]} fontSize={0.22} color="#fef3c7" anchorX="center" anchorY="middle">★ ★ ★ ★ ★</Text><pointLight ref={signRef} position={[0, 0, 1.5]} intensity={isNight ? 2 : 0.3} color="#f97316" distance={12} /></group><mesh position={[0, 16.2, 0]} castShadow><boxGeometry args={[25, 0.3, 20]} /><meshStandardMaterial color="#0f1419" roughness={0.7} metalness={0.15} /></mesh>{[[-12.3, 0], [12.3, 0], [0, -9.8], [0, 9.8]].map(([px, pz], i) => (<mesh key={i} position={[px, 16.7, pz]} castShadow><boxGeometry args={[i < 2 ? 0.1 : 25, 0.6, i < 2 ? 20 : 0.1]} /><meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} /></mesh>))}{[-7, 0, 7].map((x, i) => (<group key={i} position={[x, 16.7, -5]}><mesh castShadow><boxGeometry args={[3, 1.2, 2.2]} /><meshStandardMaterial color="#555" metalness={0.4} roughness={0.6} /></mesh><mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.4, 0.4, 0.15, 12]} /><meshStandardMaterial color="#444" metalness={0.5} roughness={0.5} /></mesh></group>))}<HotelParking position={[0, 0, 20]} timeOfDay={timeOfDay} />{[-8, -5, 5, 8].map((x, i) => (<group key={i} position={[x, 0.2, 12]}><mesh castShadow><cylinderGeometry args={[0.03, 0.03, 5, 6]} /><meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} /></mesh><mesh position={[0.3, 2.4, 0]}><boxGeometry args={[0.6, 0.4, 0.01]} /><meshStandardMaterial color={['#cc0000', '#0044aa', '#ffffff', '#cc0000'][i]} roughness={0.7} /></mesh></group>))}</group>)
})

const HotelParking = memo(function HotelParking({ position, timeOfDay = 20 }: { position: [number, number, number]; timeOfDay?: number }) {
  const asphaltTex = useAsphaltTexture()
  return (<group position={position}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><planeGeometry args={[28, 14]} /><meshStandardMaterial map={asphaltTex} color={COLORS.asphalt} roughness={0.88} /></mesh>{[-10, -5, 0, 5, 10].map((x, i) => (<mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}><planeGeometry args={[0.08, 5.5]} /><meshStandardMaterial color="#fff" transparent opacity={0.6} /></mesh>))}{[-7.5, -2.5, 2.5, 7.5].map((x, i) => (<Text key={i} position={[x, 0.025, -2]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.5} color="rgba(255,255,255,0.2)">{`P${i + 1}`}</Text>))}<mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.02, 0]}><planeGeometry args={[3.5, 5.5]} /><meshStandardMaterial color="#2244aa" transparent opacity={0.2} roughness={0.9} /></mesh>{[-10, -5, 0, 5, 10].map((x, i) => (<mesh key={`b-${i}`} position={[x + 2.5, 0.06, -2.5]} castShadow><boxGeometry args={[2, 0.1, 0.12]} /><meshStandardMaterial color="#fbbf24" roughness={0.6} /></mesh>))}{[-12, 12].map((x, i) => (<StreetLamp key={i} position={[x, 0, 5]} style="modern" timeOfDay={timeOfDay} />))}{[-13.5, -12.5, 12.5, 13.5].map((x, i) => (<group key={i} position={[x, 0, -6]}><mesh castShadow><cylinderGeometry args={[0.06, 0.06, 0.7, 8]} /><meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.3} /></mesh><mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.065, 0.065, 0.08, 8]} /><meshStandardMaterial color="#fff" roughness={0.3} metalness={0.5} /></mesh></group>))}</group>)
})

export const Depanneur = memo(function Depanneur({ position = [0, 0, 0], onEnter, timeOfDay = 20 }: { position?: [number, number, number]; onEnter?: () => void; timeOfDay?: number }) {
  const concreteTex = useConcreteTexture(); const isNight = timeOfDay < 6 || timeOfDay >= 19; const signRef = useRef<THREE.PointLight>(null)
  useFrame((state) => { if (signRef.current) signRef.current.intensity = isNight ? 2.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.5 : 0.5 })
  return (<group position={position}><mesh position={[0, 3, 0]} castShadow receiveShadow><boxGeometry args={[16, 6, 14]} /><meshStandardMaterial map={concreteTex} color="#e2ddd4" roughness={0.6} /></mesh><mesh position={[0, 6.15, 0]} castShadow><boxGeometry args={[17, 0.3, 15]} /><meshStandardMaterial color="#cc0000" roughness={0.45} metalness={0.15} /></mesh><mesh position={[0, 5.5, 10]} castShadow><boxGeometry args={[18, 0.1, 4]} /><meshStandardMaterial color="#cc0000" roughness={0.45} metalness={0.15} /></mesh>{[-7, 7].map((x, i) => (<mesh key={i} position={[x, 3, 11.5]} castShadow><cylinderGeometry args={[0.08, 0.08, 5, 6]} /><meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} /></mesh>))}<mesh position={[0, 5.45, 12.05]}><boxGeometry args={[18, 0.5, 0.08]} /><meshStandardMaterial color="#cc0000" emissive={isNight ? '#cc0000' : '#000'} emissiveIntensity={isNight ? 0.2 : 0} /></mesh>{[-5.5, 5.5].map((x, i) => (<group key={i}><mesh position={[x, 2.8, 7.15]}><boxGeometry args={[4, 3.5, 0.06]} /><meshPhysicalMaterial color="#a8d8ff" transmission={0.7} thickness={0.02} roughness={0.05} transparent opacity={0.75} /></mesh><mesh position={[x, 2.8, 7.16]}><boxGeometry args={[4.1, 3.6, 0.02]} /><meshStandardMaterial color="#666" metalness={0.6} roughness={0.3} transparent opacity={0.4} /></mesh></group>))}<group position={[0, 0, 7]}><mesh position={[0, 1.6, 0.1]}><boxGeometry args={[2.5, 3.2, 0.06]} /><meshPhysicalMaterial color="#a8d8ff" transmission={0.85} thickness={0.03} roughness={0.05} transparent opacity={0.9} /></mesh>{[-1.35, 1.35].map((x, i) => (<mesh key={i} position={[x, 1.6, 0.08]} castShadow><boxGeometry args={[0.12, 3.4, 0.12]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh>))}<mesh position={[0, 3.35, 0.08]} castShadow><boxGeometry args={[2.8, 0.1, 0.12]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh><mesh position={[0, 3.45, 0.2]}><boxGeometry args={[0.25, 0.05, 0.06]} /><meshStandardMaterial color="#222" roughness={0.5} metalness={0.5} /></mesh></group><group position={[0, 8, 0]}><mesh castShadow><boxGeometry args={[0.15, 5, 0.15]} /><meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} /></mesh><group position={[0, 2.2, 0.5]}><mesh castShadow><boxGeometry args={[3.5, 2, 0.2]} /><meshStandardMaterial color="#cc0000" emissive={isNight ? '#cc0000' : '#000'} emissiveIntensity={isNight ? 0.25 : 0} /></mesh><mesh position={[0, 0, 0.105]}><boxGeometry args={[3.3, 1.8, 0.005]} /><meshStandardMaterial color="#fff" emissive={isNight ? '#fff' : '#000'} emissiveIntensity={isNight ? 0.1 : 0} /></mesh><mesh position={[-0.8, 0.2, 0.12]}><boxGeometry args={[0.5, 0.6, 0.02]} /><meshStandardMaterial color="#ffcc00" emissive={isNight ? '#ffcc00' : '#000'} emissiveIntensity={isNight ? 0.15 : 0} /></mesh><Text position={[0.4, 0.15, 0.13]} fontSize={0.28} color="#fff" anchorX="center" anchorY="middle">Couche-Tard</Text><Text position={[0.4, -0.2, 0.13]} fontSize={0.14} color="#ffcc00" anchorX="center" anchorY="middle">DÉPANNEUR</Text><Text position={[0, -0.6, 0.13]} fontSize={0.1} color="#22c55e" anchorX="center" anchorY="middle">OUVERT 24H</Text><pointLight ref={signRef} position={[0, 0, 1.5]} color="#ff3333" intensity={isNight ? 2.5 : 0.5} distance={12} /></group></group>{[-4, 4].map((x, i) => (<group key={i} position={[x, 0, 13]}><mesh position={[0, 1.2, 0]} castShadow><boxGeometry args={[0.9, 2.4, 0.7]} /><meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.5} /></mesh><mesh position={[0, 1.8, 0.36]}><boxGeometry args={[0.5, 0.5, 0.05]} /><meshStandardMaterial color="#111" /></mesh><mesh position={[0.45, 0.8, 0.2]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.02, 0.02, 1, 6]} /><meshStandardMaterial color="#111" roughness={0.8} /></mesh></group>))}<mesh position={[0, 4, 13]} castShadow><boxGeometry args={[12, 0.15, 6]} /><meshStandardMaterial color="#e0e0e0" roughness={0.4} metalness={0.3} /></mesh>{[[-5, 10.5], [-5, 15.5], [5, 10.5], [5, 15.5]].map(([x, z], i) => (<mesh key={i} position={[x, 2, z]} castShadow><cylinderGeometry args={[0.12, 0.12, 4, 8]} /><meshStandardMaterial color="#ddd" metalness={0.4} roughness={0.5} /></mesh>))}{isNight && [-3, 0, 3].map((x, i) => (<pointLight key={i} position={[x, 3.5, 13]} intensity={1} color="#fff8e0" distance={8} decay={2} />))}<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 11]} receiveShadow><planeGeometry args={[20, 10]} /><meshStandardMaterial color={COLORS.asphalt} roughness={0.88} /></mesh><TrashBin position={[-7.5, 0.2, 8]} /><TrashBin position={[7.5, 0.2, 8]} />{isNight && [-5, 0, 5].map((x, i) => (<pointLight key={i} position={[x, 5.3, 10]} intensity={0.7} color="#fff8e0" distance={6} decay={2} />))}</group>)
})

export const GenericBuilding = memo(function GenericBuilding({ position = [0, 0, 0], size = [12, 15, 10], color = '#2a2a3e', windowRows = 4, windowCols = 3, name = '', style = 'office', timeOfDay = 20 }: { position?: [number, number, number]; size?: [number, number, number]; color?: string; windowRows?: number; windowCols?: number; name?: string; style?: string; timeOfDay?: number }) {
  const brickTex = useBrickTexture(); const windowTex = useWindowTexture(); const isNight = timeOfDay < 6 || timeOfDay >= 19
  return (<group position={position}><mesh position={[0, 0.1, 0]}><boxGeometry args={[size[0] + 0.5, 0.2, size[2] + 0.5]} /><meshStandardMaterial color="#333" roughness={0.8} /></mesh><mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial map={style === 'residential' ? brickTex : undefined} color={color} roughness={0.82} /></mesh>{Array.from({ length: windowRows }).map((_, row) => Array.from({ length: windowCols }).map((_, col) => { const x = (col - (windowCols - 1) / 2) * (size[0] / (windowCols + 1)), y = 2.5 + row * ((size[1] - 3) / windowRows), isLit = isNight && Math.sin(row * 11 + col * 7) * 0.5 + 0.5 > 0.4; return (<group key={`w-${row}-${col}`} position={[x, y, size[2] / 2 + 0.1]}><mesh><boxGeometry args={[1.6, 1.3, 0.06]} /><meshStandardMaterial color="#2a2a3e" roughness={0.5} metalness={0.3} /></mesh><mesh position={[0, 0, 0.035]}><boxGeometry args={[1.4, 1.1, 0.02]} /><meshStandardMaterial map={windowTex} color={isLit ? '#fef3c7' : COLORS.window} emissive={isLit ? '#fef3c7' : '#000'} emissiveIntensity={isLit ? 0.35 : 0} transparent opacity={isLit ? 0.8 : 0.65} metalness={isLit ? 0.1 : 0.8} roughness={0.1} /></mesh><mesh position={[0, -0.7, 0.08]}><boxGeometry args={[1.7, 0.06, 0.12]} /><meshStandardMaterial color="#888" roughness={0.6} metalness={0.2} /></mesh></group>) }))}<mesh position={[0, size[1] + 0.15, 0]} castShadow><boxGeometry args={[size[0] + 0.5, 0.3, size[2] + 0.5]} /><meshStandardMaterial color="#0f1419" roughness={0.7} metalness={0.15} /></mesh><mesh position={[0, size[1] - 0.1, size[2] / 2 + 0.25]}><boxGeometry args={[size[0] + 0.3, 0.25, 0.15]} /><meshStandardMaterial color="#888" roughness={0.5} metalness={0.2} /></mesh>{name && (<group position={[0, size[1] - 1.5, size[2] / 2 + 0.2]}><mesh castShadow><boxGeometry args={[Math.min(size[0] * 0.7, 8), 1.2, 0.1]} /><meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.3} /></mesh><Text position={[0, 0, 0.08]} fontSize={0.45} color="#fef3c7" anchorX="center" anchorY="middle">{name}</Text>{isNight && <pointLight position={[0, 0, 1]} intensity={0.5} color="#fef3c7" distance={6} />}</group>)}<group position={[0, 0, size[2] / 2]}><mesh position={[0, 1.3, 0.1]}><boxGeometry args={[1.8, 2.6, 0.06]} /><meshPhysicalMaterial color="#6b8aaa" transparent opacity={0.35} metalness={0.8} roughness={0.1} /></mesh>{[-1, 1].map((s, i) => (<mesh key={i} position={[s * 1, 1.3, 0.08]} castShadow><boxGeometry args={[0.1, 2.8, 0.12]} /><meshStandardMaterial color={COLORS.darkMetal} metalness={0.6} roughness={0.3} /></mesh>))}</group><mesh position={[size[0] * 0.25, size[1] + 0.7, -size[2] * 0.2]} castShadow><boxGeometry args={[2, 0.8, 1.5]} /><meshStandardMaterial color="#555" metalness={0.4} roughness={0.6} /></mesh></group>)
})

export const CentralPark = memo(function CentralPark({ position = [0, 0, 0] as [number, number, number], timeOfDay = 20 }) {
  const grassTex = useGrassTexture(); const isNight = timeOfDay < 6 || timeOfDay >= 19
  return (<group position={position}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow><planeGeometry args={[BLOCK_SIZE - 2, BLOCK_SIZE - 2]} /><meshStandardMaterial map={grassTex} color={COLORS.parkGrass} roughness={0.88} /></mesh>{[0, Math.PI / 2].map((rot, i) => (<mesh key={i} rotation={[-Math.PI / 2, rot, 0]} position={[0, 0.06, 0]} receiveShadow><planeGeometry args={[2.5, BLOCK_SIZE - 4]} /><meshStandardMaterial color="#a89880" roughness={0.75} /></mesh>))}{[0, Math.PI / 2].map((rot, i) => (<group key={`b-${i}`}>{[-1.3, 1.3].map((o, j) => (<mesh key={j} position={[i === 0 ? o : 0, 0.08, i === 1 ? o : 0]} rotation={[0, rot, 0]}><boxGeometry args={[0.08, 0.06, BLOCK_SIZE - 4]} /><meshStandardMaterial color="#888" roughness={0.6} /></mesh>))}</group>))}<group position={[0, 0.1, 0]}><mesh castShadow><cylinderGeometry args={[5, 5.5, 0.5, 8]} /><meshStandardMaterial color="#7a7a8a" roughness={0.35} metalness={0.2} /></mesh><mesh position={[0, 0.3, 0]}><cylinderGeometry args={[4.5, 4.8, 0.15, 8]} /><meshStandardMaterial color="#6a6a7a" roughness={0.3} metalness={0.3} /></mesh><mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[4.3, 16]} /><meshStandardMaterial color="#2b5c8f" roughness={0.05} metalness={0.4} transparent opacity={0.5} /></mesh><mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.3, 0.5, 3.5, 12]} /><meshStandardMaterial color="#8a8a9a" roughness={0.3} metalness={0.3} /></mesh><mesh position={[0, 3.8, 0]} castShadow><cylinderGeometry args={[1.2, 0.5, 0.4, 12]} /><meshStandardMaterial color="#7a7a8a" roughness={0.3} metalness={0.3} /></mesh><mesh position={[0, 4.5, 0]}><cylinderGeometry args={[0.03, 0.01, 1.2, 6]} /><meshStandardMaterial color="#88ccff" transparent opacity={0.5} emissive="#4488cc" emissiveIntensity={0.15} /></mesh><pointLight position={[0, 1, 0]} intensity={isNight ? 0.6 : 0.2} color="#6bb3f0" distance={8} decay={2} /></group>{([ [-14, 14, 1.1, 'deciduous'], [14, 14, 0.9, 'birch'], [-14, -14, 1.0, 'deciduous'], [14, -14, 1.2, 'conifer'], [-8, 0, 0.8, 'deciduous'], [8, 0, 0.9, 'birch'], [0, -10, 1.0, 'conifer'], [0, 10, 0.85, 'deciduous'], [-10, 8, 0.7, 'birch'], [10, -8, 0.75, 'deciduous'] ] as [number, number, number, 'deciduous' | 'conifer' | 'birch'][]).map(([x, z, s, t], i) => (<DetailedTree key={i} position={[x, 0, z]} scale={s} type={t} />))}{([[-6, 7, 0], [6, 7, 0], [-6, -7, Math.PI], [6, -7, Math.PI], [7, -1, Math.PI / 2], [-7, 1, -Math.PI / 2]] as [number, number, number][]).map(([x, z, r], i) => (<ParkBench key={i} position={[x, 0.1, z]} rotation={[0, r, 0]} />))}<TrashBin position={[-7, 0.1, 5]} /><TrashBin position={[7, 0.1, -5]} /><TrashBin position={[-5, 0.1, -7]} /><TrashBin position={[5, 0.1, 7]} />{([[-8, 8], [8, 8], [-8, -8], [8, -8]] as [number, number][]).map(([x, z], i) => (<StreetLamp key={i} position={[x, 0.1, z]} style="classic" timeOfDay={timeOfDay} />))}<group position={[0, 0.1, -BLOCK_SIZE / 2 + 2]}><mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[2, 0.8, 0.08]} /><meshStandardMaterial color="#2a4a2a" roughness={0.5} metalness={0.2} /></mesh><mesh position={[-0.9, 0.4, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.8, 6]} /><meshStandardMaterial color="#4a3a2a" roughness={0.7} /></mesh><mesh position={[0.9, 0.4, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.8, 6]} /><meshStandardMaterial color="#4a3a2a" roughness={0.7} /></mesh><Text position={[0, 0.85, 0.05]} fontSize={0.15} color="#fef3c7" anchorX="center" anchorY="middle">Parc EtherWorld</Text><Text position={[0, 0.65, 0.05]} fontSize={0.08} color="#c8d8c8" anchorX="center" anchorY="middle">Ville de Québec</Text></group>{Array.from({ length: 20 }).map((_, i) => { const a = (i / 20) * Math.PI * 2, r = 6.5 + Math.sin(i * 3); return (<mesh key={i} position={[Math.cos(a) * r, 0.15, Math.sin(a) * r]}><sphereGeometry args={[0.08 + Math.random() * 0.05, 6, 6]} /><meshStandardMaterial color={['#ef4444', '#f59e0b', '#a855f7', '#ec4899', '#fff'][i % 5]} roughness={0.7} /></mesh>) })}</group>)
})

export const DynamicSky = memo(function DynamicSky({ timeOfDay }: { timeOfDay: number }) {
  const c = useMemo(() => { if (timeOfDay < 5 || timeOfDay >= 22) return '#020510'; if (timeOfDay < 6) return '#0a0a2a'; if (timeOfDay < 7) return '#2a1a4a'; if (timeOfDay < 8) return '#cc6644'; if (timeOfDay >= 20 && timeOfDay < 21) return '#cc5533'; if (timeOfDay >= 21) return '#1a1040'; if (timeOfDay >= 18) return '#aa5533'; return '#6aacde' }, [timeOfDay])
  return <color attach="background" args={[c]} />
})

export const SceneLighting = memo(function SceneLighting({ timeOfDay }: { timeOfDay: number }) {
  const isNight = timeOfDay < 6 || timeOfDay >= 20; const isTwi = (timeOfDay >= 6 && timeOfDay < 8) || (timeOfDay >= 18 && timeOfDay < 20)
  const sI = isNight ? 0.08 : isTwi ? 0.5 : 1.2; const aI = isNight ? 0.12 : isTwi ? 0.35 : 0.55; const sC = isNight ? '#4060a0' : isTwi ? '#ff8855' : '#fff8e8'; const aC = isNight ? '#2a3a5a' : isTwi ? '#ff9966' : '#fff'
  const sA = ((timeOfDay - 6) / 12) * Math.PI; const sX = Math.cos(sA) * 80; const sY = Math.sin(sA) * 60 + 10
  return (<><ambientLight intensity={aI} color={aC} /><directionalLight position={[sX, Math.max(sY, 5), 40]} intensity={sI} color={sC} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-near={0.1} shadow-camera-far={250} shadow-camera-left={-120} shadow-camera-right={120} shadow-camera-top={120} shadow-camera-bottom={-120} shadow-bias={-0.0003} /><hemisphereLight color={isNight ? '#2a3a6a' : '#c8d8f8'} groundColor={isNight ? '#020408' : '#3a5a2a'} intensity={isNight ? 0.15 : 0.35} /></>)
})

export const Ground = memo(function Ground({ timeOfDay = 20 }: { timeOfDay?: number }) {
  const isNight = timeOfDay < 6 || timeOfDay >= 20
  return (<group><gridHelper args={[1000, 200, '#1a3a2a', '#0f2a18']} position={[0, -0.15, 0]} /><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow><planeGeometry args={[1000, 1000]} /><meshStandardMaterial color={isNight ? '#020408' : '#0a1a0a'} roughness={0.95} /></mesh></group>)
})

// ════════════════════════════════════════════════════════════════════════════
// ═══ NOUVEAU — PIN DE CAMPAGNE ═══
// ════════════════════════════════════════════════════════════════════════════

const PineTree = memo(function PineTree({ position, scale = 1, variant = 0 }: { position: [number, number, number]; scale?: number; variant?: number }) {
  const lRef = useRef<THREE.Group>(null)
  useFrame((state) => { if (lRef.current) { lRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.25 + position[0] * 0.1) * 0.008 * scale; lRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.15 + position[2] * 0.1) * 0.005 * scale } })
  const tH = 2 + variant * 0.3; const tiers = 3 + (variant % 2)
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, tH / 2, 0]} castShadow><cylinderGeometry args={[0.12 * scale, 0.2 * scale, tH, 6]} /><meshStandardMaterial color="#5c3d1e" roughness={0.88} flatShading /></mesh>
      {[0, 120, 240].map((a, i) => (<mesh key={i} position={[Math.sin((a * Math.PI) / 180) * 0.18 * scale, 0.06, Math.cos((a * Math.PI) / 180) * 0.18 * scale]} rotation={[0, (a * Math.PI) / 180, 0.4]} castShadow><cylinderGeometry args={[0.03 * scale, 0.06 * scale, 0.4, 4]} /><meshStandardMaterial color="#4a2e14" roughness={0.9} flatShading /></mesh>))}
      <group ref={lRef}>{Array.from({ length: tiers }).map((_, i) => { const y = tH * 0.4 + i * (1.2 - i * 0.08), r = (1.8 - i * 0.35) * scale, h = 1.5 - i * 0.15, gs = 25 + i * 8 + variant * 3; return (<mesh key={i} position={[0, y, 0]} castShadow><coneGeometry args={[r, h, 6 + variant]} /><meshStandardMaterial color={`rgb(${gs + 10},${55 + gs},${gs})`} roughness={0.85} flatShading /></mesh>) })}</group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.2 * scale, 8]} /><meshBasicMaterial color="#000" transparent opacity={0.1} depthWrite={false} /></mesh>
    </group>
  )
})

// ═══ NOUVEAU — Arbre feuillu de campagne ═══

const CountrysideTree = memo(function CountrysideTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const lRef = useRef<THREE.Group>(null); const isBirch = Math.abs(position[0] + position[2]) % 5 < 2
  useFrame((state) => { if (lRef.current) lRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3 + position[0]) * 0.012 * scale })
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.12, 0.2, 4, 6]} /><meshStandardMaterial color={isBirch ? '#c8b898' : '#5c3d1e'} roughness={0.85} flatShading /></mesh>
      {[45, 135, 225, 315].map((a, i) => (<mesh key={i} position={[Math.sin((a * Math.PI) / 180) * 0.5, 2.8 + i * 0.3, Math.cos((a * Math.PI) / 180) * 0.5]} rotation={[0.5, (a * Math.PI) / 180, 0.6]} castShadow><cylinderGeometry args={[0.02, 0.04, 1.2, 4]} /><meshStandardMaterial color={isBirch ? '#b0a080' : '#4a3018'} roughness={0.9} flatShading /></mesh>))}
      <group ref={lRef}><mesh position={[0, 4.5, 0]} castShadow><sphereGeometry args={[2, 6, 6]} /><meshStandardMaterial color="#2d6a1e" roughness={0.82} flatShading /></mesh><mesh position={[-0.6, 4, 0.4]} castShadow><sphereGeometry args={[1.3, 5, 5]} /><meshStandardMaterial color="#347a22" roughness={0.85} flatShading /></mesh><mesh position={[0.5, 3.8, -0.3]} castShadow><sphereGeometry args={[1.1, 5, 5]} /><meshStandardMaterial color="#2a5a18" roughness={0.85} flatShading /></mesh></group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.8 * scale, 8]} /><meshBasicMaterial color="#000" transparent opacity={0.1} depthWrite={false} /></mesh>
    </group>
  )
})

// ═══ NOUVEAU — Panneau routier québécois ═══

const HighwaySign = memo(function HighwaySign({ position, rotation = [0, 0, 0] as [number, number, number], text, subText, type = 'direction', timeOfDay = 20 }: { position: [number, number, number]; rotation?: [number, number, number]; text: string; subText?: string; type?: 'direction' | 'speed' | 'info' | 'exit'; timeOfDay?: number }) {
  const isN = (timeOfDay || 20) < 6 || (timeOfDay || 20) >= 19
  const cfg = { direction: { c: '#1a6a2a', w: 3, h: 1.5, tc: '#fff', fs: 0.22 }, speed: { c: '#fff', w: 0.9, h: 1.1, tc: '#000', fs: 0.4 }, info: { c: '#0055aa', w: 2.5, h: 1.2, tc: '#fff', fs: 0.18 }, exit: { c: '#1a6a2a', w: 2.8, h: 1.3, tc: '#fff', fs: 0.2 } }[type]
  return (
    <group position={position} rotation={rotation}>
      {cfg.w > 1.5 ? (<><mesh position={[-cfg.w / 2 + 0.2, 2, 0]} castShadow><cylinderGeometry args={[0.05, 0.06, 4, 6]} /><meshStandardMaterial color="#888" metalness={0.6} roughness={0.35} /></mesh><mesh position={[cfg.w / 2 - 0.2, 2, 0]} castShadow><cylinderGeometry args={[0.05, 0.06, 4, 6]} /><meshStandardMaterial color="#888" metalness={0.6} roughness={0.35} /></mesh></>) : (<mesh position={[0, 2, 0]} castShadow><cylinderGeometry args={[0.04, 0.05, 4, 6]} /><meshStandardMaterial color="#888" metalness={0.6} roughness={0.35} /></mesh>)}
      <mesh position={[0, 4.2, 0]} castShadow><boxGeometry args={[cfg.w, cfg.h, 0.04]} /><meshStandardMaterial color={cfg.c} emissive={isN ? cfg.c : '#000'} emissiveIntensity={isN ? 0.06 : 0} roughness={0.4} metalness={0.15} /></mesh>
      <mesh position={[0, 4.2, -0.025]}><boxGeometry args={[cfg.w, cfg.h, 0.01]} /><meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.3} /></mesh>
      {type === 'speed' && <mesh position={[0, 4.2, 0.025]}><ringGeometry args={[0.35, 0.44, 16]} /><meshStandardMaterial color="#cc0000" /></mesh>}
      <Text position={[0, 4.2 + (subText ? 0.12 : 0), 0.03]} fontSize={cfg.fs} color={cfg.tc} anchorX="center" anchorY="middle" maxWidth={cfg.w - 0.3}>{text}</Text>
      {subText && <Text position={[0, 4.0, 0.03]} fontSize={cfg.fs * 0.6} color={cfg.tc} anchorX="center" anchorY="middle">{subText}</Text>}
    </group>
  )
})

// ═══ NOUVEAU — Lampadaire d'autoroute ═══

const HighwayLamp = memo(function HighwayLamp({ position, timeOfDay = 20 }: { position: [number, number, number]; timeOfDay?: number }) {
  const isN = timeOfDay < 6 || timeOfDay >= 19
  return (
    <group position={position}>
      <mesh position={[0, 4.5, 0]} castShadow><cylinderGeometry args={[0.06, 0.1, 9, 8]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.35, 0.08, 0.35]} /><meshStandardMaterial color="#666" metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[0, 9.1, 1.5]} rotation={[0.12, 0, 0]} castShadow><boxGeometry args={[0.06, 0.06, 3]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh>
      <group position={[0, 9, 2.8]}>
        <mesh castShadow><boxGeometry args={[0.6, 0.08, 0.3]} /><meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[0, -0.035, 0]}><boxGeometry args={[0.5, 0.015, 0.25]} /><meshStandardMaterial color="#fef3c7" emissive={isN ? '#fef3c7' : '#000'} emissiveIntensity={isN ? 0.5 : 0} /></mesh>
        {isN && <pointLight position={[0, -0.2, 0]} intensity={1.5} color="#fff5e0" distance={25} decay={2} castShadow shadow-mapSize={[256, 256]} />}
      </group>
    </group>
  )
})

// ═══ NOUVEAU — Borne kilométrique ═══

const KilometerMarker = memo(function KilometerMarker({ position, km }: { position: [number, number, number]; km: number }) {
  return (<group position={position}><mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.12, 0.6, 0.06]} /><meshStandardMaterial color="#1a6a2a" roughness={0.5} metalness={0.15} /></mesh><Text position={[0, 0.35, 0.035]} fontSize={0.08} color="#fff" anchorX="center" anchorY="middle">{`${km}`}</Text></group>)
})

// ═══ NOUVEAU — Borne d'urgence ═══

const EmergencyPhone = memo(function EmergencyPhone({ position }: { position: [number, number, number] }) {
  return (<group position={position}><mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.04, 0.05, 1.4, 6]} /><meshStandardMaterial color="#ff8800" roughness={0.5} metalness={0.3} /></mesh><mesh position={[0, 1.2, 0.06]} castShadow><boxGeometry args={[0.2, 0.3, 0.12]} /><meshStandardMaterial color="#ff6600" roughness={0.4} metalness={0.2} /></mesh><mesh position={[0, 1.55, 0]}><boxGeometry args={[0.22, 0.1, 0.04]} /><meshStandardMaterial color="#0055aa" roughness={0.4} /></mesh><Text position={[0, 1.55, 0.025]} fontSize={0.05} color="#fff" anchorX="center" anchorY="middle">SOS</Text><mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.055, 0.055, 0.08, 6]} /><meshStandardMaterial color="#fff" roughness={0.2} metalness={0.6} emissive="#fff" emissiveIntensity={0.04} /></mesh></group>)
})

// ═══ NOUVEAU — Rocher ═══

const Rock = memo(function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const rot = useMemo(() => Math.random() * Math.PI * 2, [])
  return (<mesh position={position} rotation={[0, rot, Math.random() * 0.3]} scale={[scale, scale * 0.6, scale * 0.8]} castShadow><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color={`rgb(${100 + Math.random() * 30},${95 + Math.random() * 25},${85 + Math.random() * 20})`} roughness={0.92} flatShading /></mesh>)
})

// ════════════════════════════════════════════════════════════════════════════
// ═══ NOUVEAU — ROUTE QUI SORT DE LA VILLE ═══
// ════════════════════════════════════════════════════════════════════════════

const CityExitRoad = memo(function CityExitRoad({ timeOfDay = 20 }: { timeOfDay?: number }) {
  const hwTex = useHighwayAsphaltTexture()
  const fieldTex = useFieldGrassTexture()
  const gravelTex = useGravelShoulderTexture()

  const ROAD_START = SPACING * 2.5
  const ROAD_LEN = 300
  const HW_WIDTH = 14
  const SHOULDER = 2
  const ROAD_END = ROAD_START + ROAD_LEN
  const CENTER = ROAD_START + ROAD_LEN / 2
  const TERRAIN = 60
  const signSide = HW_WIDTH / 2 + SHOULDER + 2

  const rand = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x) }

  const trees = useMemo(() => {
    const list: Array<{ pos: [number, number, number]; type: 'pine' | 'dec'; scale: number; variant: number }> = []
    for (let row = 0; row < 5; row++) {
      const baseOff = HW_WIDTH / 2 + SHOULDER + 5 + row * 10
      for (let i = 0; i < Math.floor(ROAD_LEN / 10); i++) {
        const s = row * 1000 + i; const z = ROAD_START + 8 + i * 10 + (rand(s) - 0.5) * 6
        const xOff = (rand(s + 1) - 0.5) * 5; const sc = 0.6 + rand(s + 2) * 0.7
        const isPine = rand(s + 3) > 0.25; const v = Math.floor(rand(s + 4) * 4)
        list.push({ pos: [-(baseOff + xOff), 0, z], type: isPine ? 'pine' : 'dec', scale: sc, variant: v })
        list.push({ pos: [baseOff + xOff + (rand(s + 5) - 0.5) * 3, 0, z], type: isPine ? 'pine' : 'dec', scale: sc * (0.85 + rand(s + 6) * 0.3), variant: (v + 1) % 4 })
      }
    }
    return list
  }, [])

  const rocks = useMemo(() => {
    const list: Array<{ pos: [number, number, number]; scale: number }> = []
    for (let i = 0; i < 20; i++) {
      const side = rand(i * 7) > 0.5 ? 1 : -1
      list.push({ pos: [side * (HW_WIDTH / 2 + SHOULDER + 3 + rand(i * 11) * 20), rand(i * 17) * 0.3, ROAD_START + rand(i * 13) * ROAD_LEN], scale: 0.4 + rand(i * 19) * 1 })
    }
    return list
  }, [])

  return (
    <group>
      {/* Transition ville → route */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, ROAD_START - 10]} receiveShadow>
        <planeGeometry args={[HW_WIDTH + SHOULDER * 2 + 4, 20]} />
        <meshStandardMaterial map={hwTex} color="#3a3a44" roughness={0.88} />
      </mesh>

      {/* Surface routière */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, CENTER]} receiveShadow>
        <planeGeometry args={[HW_WIDTH, ROAD_LEN]} />
        <meshStandardMaterial map={hwTex} color="#3a3a44" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Double ligne jaune */}
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={`y-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.018, CENTER]}>
          <planeGeometry args={[0.08, ROAD_LEN]} />
          <meshStandardMaterial color="#e8b820" roughness={0.6} />
        </mesh>
      ))}

      {/* Lignes blanches bord */}
      {[-HW_WIDTH / 2 + 0.15, HW_WIDTH / 2 - 0.15].map((x, i) => (
        <mesh key={`e-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.018, CENTER]}>
          <planeGeometry args={[0.1, ROAD_LEN]} />
          <meshStandardMaterial color="#d8dce4" roughness={0.6} transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Pointillés blancs voies */}
      {Array.from({ length: Math.floor(ROAD_LEN / 8) }).map((_, i) => {
        const z = ROAD_START + 4 + i * 8
        return (<group key={`d-${i}`}>{[-HW_WIDTH / 4, HW_WIDTH / 4].map((x, j) => (<mesh key={j} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.018, z]}><planeGeometry args={[0.08, 3.5]} /><meshStandardMaterial color="#d8dce4" roughness={0.6} transparent opacity={0.7} /></mesh>))}</group>)
      })}

      {/* Réflecteurs */}
      {Array.from({ length: Math.floor(ROAD_LEN / 12) }).map((_, i) => {
        const z = ROAD_START + 6 + i * 12
        return (<group key={`r-${i}`}><mesh position={[0, 0.025, z]}><boxGeometry args={[0.1, 0.018, 0.08]} /><meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.1} roughness={0.3} metalness={0.5} /></mesh>{[-HW_WIDTH / 2 + 0.15, HW_WIDTH / 2 - 0.15].map((x, j) => (<mesh key={j} position={[x, 0.025, z]}><boxGeometry args={[0.08, 0.015, 0.06]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.06} roughness={0.3} metalness={0.4} /></mesh>))}</group>)
      })}

      {/* Accotements gravier */}
      {[-1, 1].map((side, i) => (
        <group key={`sh-${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * (HW_WIDTH / 2 + SHOULDER / 2), 0.005, CENTER]} receiveShadow>
            <planeGeometry args={[SHOULDER, ROAD_LEN]} />
            <meshStandardMaterial map={gravelTex} color="#6a6458" roughness={0.92} />
          </mesh>
          <mesh position={[side * (HW_WIDTH / 2 + SHOULDER), 0.04, CENTER]}>
            <boxGeometry args={[0.15, 0.08, ROAD_LEN]} />
            <meshStandardMaterial color="#888078" roughness={0.7} metalness={0.05} />
          </mesh>
        </group>
      ))}

      {/* Glissières */}
      {[-1, 1].map((side, i) => {
        const xPos = side * (HW_WIDTH / 2 + SHOULDER - 0.3)
        return (
          <group key={`gr-${i}`}>
            <mesh position={[xPos, 0.55, CENTER]}><boxGeometry args={[0.04, 0.28, ROAD_LEN]} /><meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.25} /></mesh>
            <mesh position={[xPos, 0.38, CENTER]}><boxGeometry args={[0.03, 0.06, ROAD_LEN]} /><meshStandardMaterial color="#999" metalness={0.6} roughness={0.3} /></mesh>
            {Array.from({ length: Math.floor(ROAD_LEN / 8) }).map((_, j) => {
              const z = ROAD_START + 4 + j * 8
              return (<group key={`p-${i}-${j}`} position={[xPos, 0, z]}><mesh position={[0, 0.38, 0]} castShadow><boxGeometry args={[0.06, 0.76, 0.08]} /><meshStandardMaterial color="#888" metalness={0.6} roughness={0.35} /></mesh>{j % 3 === 0 && <mesh position={[side * 0.04, 0.55, 0]}><boxGeometry args={[0.008, 0.05, 0.035]} /><meshStandardMaterial color={side > 0 ? '#ff4444' : '#fff'} emissive={side > 0 ? '#ff4444' : '#fff'} emissiveIntensity={0.06} metalness={0.8} roughness={0.1} /></mesh>}</group>)
            })}
          </group>
        )
      })}

      {/* Terrain herbeux */}
      {[-1, 1].map((side, i) => (
        <mesh key={`t-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * (HW_WIDTH / 2 + SHOULDER + TERRAIN / 2), -0.02, CENTER]} receiveShadow>
          <planeGeometry args={[TERRAIN, ROAD_LEN + 40]} />
          <meshStandardMaterial map={fieldTex} color="#3a5a28" roughness={0.92} />
        </mesh>
      ))}

      {/* Fossés */}
      {[-1, 1].map((side, i) => (
        <mesh key={`di-${i}`} position={[side * (HW_WIDTH / 2 + SHOULDER + 1.5), -0.15, CENTER]}>
          <boxGeometry args={[2, 0.2, ROAD_LEN]} />
          <meshStandardMaterial color="#2a4018" roughness={0.95} />
        </mesh>
      ))}

      {/* Forêts */}
      {trees.map((tree, i) => (
        tree.type === 'pine'
          ? <PineTree key={`ft-${i}`} position={tree.pos} scale={tree.scale} variant={tree.variant} />
          : <CountrysideTree key={`ft-${i}`} position={tree.pos} scale={tree.scale} />
      ))}

      {/* Rochers */}
      {rocks.map((rock, i) => (<Rock key={`rk-${i}`} position={rock.pos} scale={rock.scale} />))}

      {/* Panneaux */}
      <HighwaySign position={[-signSide, 0, ROAD_START + 20]} text="Québec" subText="← 45 km" type="direction" timeOfDay={timeOfDay} />
      <HighwaySign position={[-signSide, 0, ROAD_START + 60]} text="100" type="speed" timeOfDay={timeOfDay} />
      <HighwaySign position={[-signSide, 0, ROAD_START + 100]} text="AUTOROUTE 20" subText="Route Trans-Canadienne" type="info" timeOfDay={timeOfDay} />
      <HighwaySign position={[-signSide, 0, ROAD_START + 150]} text="Montréal" subText="→ 250 km" type="direction" timeOfDay={timeOfDay} />
      <HighwaySign position={[-signSide, 0, ROAD_START + 200]} text="100" type="speed" timeOfDay={timeOfDay} />
      <HighwaySign position={[-signSide, 0, ROAD_START + 250]} text="SORTIE 312" subText="Sainte-Foy" type="exit" timeOfDay={timeOfDay} />
      <HighwaySign position={[signSide, 0, ROAD_START + 80]} rotation={[0, Math.PI, 0]} text="HALTE ROUTIÈRE" subText="2 km →" type="info" timeOfDay={timeOfDay} />

      {/* Bornes km */}
      {Array.from({ length: Math.floor(ROAD_LEN / 50) }).map((_, i) => (
        <KilometerMarker key={`km-${i}`} position={[-signSide + 0.5, 0, ROAD_START + 15 + i * 50]} km={310 + i * 5} />
      ))}

      {/* Bornes urgence */}
      <EmergencyPhone position={[signSide - 0.5, 0, ROAD_START + 70]} />
      <EmergencyPhone position={[signSide - 0.5, 0, ROAD_START + 180]} />

      {/* Lampadaires autoroute */}
      {Array.from({ length: Math.floor(ROAD_LEN / 40) }).map((_, i) => {
        const z = ROAD_START + 20 + i * 40; const side = i % 2 === 0 ? -1 : 1
        return <HighwayLamp key={`hl-${i}`} position={[side * (HW_WIDTH / 2 + SHOULDER + 0.5), 0, z]} timeOfDay={timeOfDay} />
      })}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// SCÈNE COMPLÈTE — avec route de sortie
// ════════════════════════════════════════════════════════════════════════════

interface CitySceneProps {
  timeOfDay?: number
  onEnterHotel?: () => void
  onEnterDepanneur?: () => void
}

export function CityScene({ timeOfDay = 20, onEnterHotel, onEnterDepanneur }: CitySceneProps) {
  return (
    <group>
      <DynamicSky timeOfDay={timeOfDay} />
      <SceneLighting timeOfDay={timeOfDay} />
      <fog attach="fog" args={[timeOfDay < 6 || timeOfDay >= 20 ? '#020510' : timeOfDay < 8 || timeOfDay >= 18 ? '#886644' : '#87CEEB', 60, 250]} />

      <Ground timeOfDay={timeOfDay} />
      <UrbanGrid timeOfDay={timeOfDay} />
      <CentralPark position={[0, 0.2, 0]} timeOfDay={timeOfDay} />
      <HotelBuilding position={[0, 0.2, -SPACING]} onEnter={onEnterHotel} timeOfDay={timeOfDay} />
      <Depanneur position={[-SPACING, 0.2, 0]} onEnter={onEnterDepanneur} timeOfDay={timeOfDay} />

      <GenericBuilding position={[SPACING, 0.2, 0]} size={[15, 22, 12]} color="#2a3a4e" name="HÔPITAL" windowRows={6} windowCols={4} style="office" timeOfDay={timeOfDay} />
      <GenericBuilding position={[0, 0.2, SPACING]} size={[18, 28, 14]} color="#3a2828" name="CATHÉDRALE" windowRows={5} windowCols={3} style="residential" timeOfDay={timeOfDay} />
      <GenericBuilding position={[-SPACING, 0.2, -SPACING]} size={[14, 20, 11]} color="#2a2a4a" name="RÉSIDENCES" windowRows={6} windowCols={4} style="residential" timeOfDay={timeOfDay} />
      <GenericBuilding position={[SPACING, 0.2, -SPACING]} size={[12, 8, 10]} color="#3a3a3a" name="GARAGE" windowRows={2} windowCols={3} style="industrial" timeOfDay={timeOfDay} />
      <GenericBuilding position={[-SPACING, 0.2, SPACING]} size={[20, 10, 15]} color="#4a4a3a" name="ENTREPÔT" windowRows={2} windowCols={5} style="industrial" timeOfDay={timeOfDay} />
      <GenericBuilding position={[SPACING, 0.2, SPACING]} size={[14, 12, 12]} color="#2a4a4a" name="PHARMACIE" windowRows={3} windowCols={3} style="commercial" timeOfDay={timeOfDay} />

      <TrafficLight position={[-BLOCK_SIZE / 2 - 1, SIDEWALK_HEIGHT, -BLOCK_SIZE / 2 - 1]} rotation={[0, Math.PI / 4, 0]} />
      <TrafficLight position={[BLOCK_SIZE / 2 + 1, SIDEWALK_HEIGHT, -BLOCK_SIZE / 2 - 1]} rotation={[0, -Math.PI / 4, 0]} />
      <TrafficLight position={[-BLOCK_SIZE / 2 - 1, SIDEWALK_HEIGHT, BLOCK_SIZE / 2 + 1]} rotation={[0, Math.PI * 0.75, 0]} />
      <TrafficLight position={[BLOCK_SIZE / 2 + 1, SIDEWALK_HEIGHT, BLOCK_SIZE / 2 + 1]} rotation={[0, -Math.PI * 0.75, 0]} />

      <StreetSign position={[-BLOCK_SIZE / 2, SIDEWALK_HEIGHT, -BLOCK_SIZE / 2 - 3]} text="RUE ÉTHERWORLD" color="#2255aa" />
      <StreetSign position={[BLOCK_SIZE / 2 + 3, SIDEWALK_HEIGHT, 0]} rotation={[0, -Math.PI / 2, 0]} text="AVE QUÉBEC" color="#2255aa" />
      <StreetSign position={[0, SIDEWALK_HEIGHT, BLOCK_SIZE / 2 + 3]} text="BOUL. PRINCIPAL" color="#22aa55" />

      <BusStop position={[-BLOCK_SIZE / 2 - 3, SIDEWALK_HEIGHT, 5]} />
      <BusStop position={[BLOCK_SIZE / 2 + 3, SIDEWALK_HEIGHT, -SPACING + 10]} />

      <FireHydrant position={[-BLOCK_SIZE / 2 + 3, SIDEWALK_HEIGHT, BLOCK_SIZE / 2 + 2]} />
      <FireHydrant position={[BLOCK_SIZE / 2 - 3, SIDEWALK_HEIGHT, -BLOCK_SIZE / 2 - 2]} />
      <FireHydrant position={[-SPACING + 5, SIDEWALK_HEIGHT, -3]} />

      <Mailbox position={[BLOCK_SIZE / 2 + 2, SIDEWALK_HEIGHT, 8]} />
      <Mailbox position={[-BLOCK_SIZE / 2 - 2, SIDEWALK_HEIGHT, -SPACING + 15]} />

      <TrashBin position={[-BLOCK_SIZE / 2 + 1, SIDEWALK_HEIGHT, -BLOCK_SIZE / 2 + 1]} />
      <TrashBin position={[BLOCK_SIZE / 2 - 1, SIDEWALK_HEIGHT, BLOCK_SIZE / 2 - 1]} />
      <TrashBin position={[-BLOCK_SIZE / 2 + 1, SIDEWALK_HEIGHT, BLOCK_SIZE / 2 - 1]} />
      <TrashBin position={[BLOCK_SIZE / 2 - 1, SIDEWALK_HEIGHT, -BLOCK_SIZE / 2 + 1]} />

      {([[-BLOCK_SIZE / 2 + 4, -5], [BLOCK_SIZE / 2 - 4, 5], [-5, -BLOCK_SIZE / 2 + 4], [5, BLOCK_SIZE / 2 - 4], [-SPACING + 8, 12], [SPACING - 8, -12]] as [number, number][]).map(([x, z], i) => (
        <DetailedTree key={`st-${i}`} position={[x, SIDEWALK_HEIGHT, z]} scale={0.6} type={i % 2 === 0 ? 'deciduous' : 'birch'} />
      ))}

      <CityParticles timeOfDay={timeOfDay} />

      {/* ═══ NOUVEAU — Route qui sort de la ville ═══ */}
      <CityExitRoad timeOfDay={timeOfDay} />
    </group>
  )
}