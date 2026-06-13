/**
 * src/buildings/depanneur/scenes/DepanneurScene.tsx
 *
 * Scène 3D React Three Fiber du dépanneur indépendant.
 * - Structure extérieure + intérieur visible
 * - Zones clients/staff/livraison/déchets/stationnement/pompes
 * - Fixtures basées sur DepanneurRegistry
 * - Firebase-ready via userData: buildingId, fixtureId, zoneId, collection
 */

import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import {
  DEPANNEUR_BUILDING,
  DEPANNEUR_CAMERAS,
  DEPANNEUR_FIXTURES,
  DEPANNEUR_INVENTORY,
  DEPANNEUR_ZONES,
} from '../core/DepanneurRegistry'
import type { DepanneurFixture, DepanneurZone } from '../core/DepanneurTypes'

type Vec3 = [number, number, number]

interface DepanneurSceneProps {
  onEnter?: () => void
  onFixtureClick?: (fixture: DepanneurFixture) => void
  onZoneClick?: (zone: DepanneurZone) => void
  showDebugZones?: boolean
}

function seeded(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

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

function useTileTexture() {
  return useMemo(
    () => createCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#ddd6c8'
      ctx.fillRect(0, 0, w, h)
      const cells = 8
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          const n = 210 + seeded(x * 13 + y * 29) * 22
          ctx.fillStyle = `rgb(${n},${n - 6},${n - 14})`
          ctx.fillRect(x * w / cells + 1, y * h / cells + 1, w / cells - 2, h / cells - 2)
        }
      }
      ctx.strokeStyle = 'rgba(0,0,0,.09)'
      for (let i = 0; i <= cells; i++) {
        ctx.beginPath(); ctx.moveTo(i * w / cells, 0); ctx.lineTo(i * w / cells, h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i * h / cells); ctx.lineTo(w, i * h / cells); ctx.stroke()
      }
    }, [4, 4]),
    []
  )
}

function useAsphaltTexture() {
  return useMemo(
    () => createCanvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#24252a'
      ctx.fillRect(0, 0, w, h)
      for (let i = 0; i < 2400; i++) {
        const n = 28 + seeded(i) * 34
        ctx.fillStyle = `rgba(${n},${n},${n + 2},.45)`
        ctx.fillRect(seeded(i + 7) * w, seeded(i + 13) * h, 1 + seeded(i + 19) * 2, 1 + seeded(i + 23) * 2)
      }
    }, [5, 5]),
    []
  )
}

const NeonSign = memo(function NeonSign({ position, title, subtitle, color = '#ff2028' }: { position: Vec3; title: string; subtitle: string; color?: string }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    if (light.current) light.current.intensity = 1.25 + Math.sin(state.clock.elapsedTime * 2.2) * 0.35
  })
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[7.2, 1.55, 0.18]} />
        <meshStandardMaterial color="#10070a" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[6.8, 1.18, 0.025]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} />
      </mesh>
      <Text position={[0, 0.2, 0.16]} fontSize={0.34} color="#fff7ed" anchorX="center" anchorY="middle">
        {title}
      </Text>
      <Text position={[0, -0.32, 0.16]} fontSize={0.16} color="#ffe08a" anchorX="center" anchorY="middle">
        {subtitle}
      </Text>
      <pointLight ref={light} position={[0, 0, 1.2]} color={color} intensity={1.4} distance={18} decay={2} />
    </group>
  )
})

const SlidingDoorVisual = memo(function SlidingDoorVisual({ onEnter }: { onEnter?: () => void }) {
  const left = useRef<THREE.Mesh>(null)
  const right = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const open = (Math.sin(state.clock.elapsedTime * 0.8) + 1) * 0.5
    if (left.current) left.current.position.x = -0.62 - open * 0.45
    if (right.current) right.current.position.x = 0.62 + open * 0.45
  })
  return (
    <group position={[0, 1.55, 8.08]} userData={{ zoneId: 'depanneur_customer_floor', interaction: 'enter' }}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.8, 3.35, 0.16]} />
        <meshStandardMaterial color="#555566" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh ref={left} position={[-0.62, 0, 0.12]} onClick={onEnter}>
        <boxGeometry args={[1.25, 3.05, 0.055]} />
        <meshPhysicalMaterial color="#a8d8ff" transmission={0.85} thickness={0.025} roughness={0.05} transparent opacity={0.82} />
      </mesh>
      <mesh ref={right} position={[0.62, 0, 0.12]} onClick={onEnter}>
        <boxGeometry args={[1.25, 3.05, 0.055]} />
        <meshPhysicalMaterial color="#a8d8ff" transmission={0.85} thickness={0.025} roughness={0.05} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 1.86, 0.2]}>
        <boxGeometry args={[0.42, 0.08, 0.1]} />
        <meshStandardMaterial color="#1f2937" emissive="#22c55e" emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
})

const Shelf = memo(function Shelf({ fixture, onClick }: { fixture: DepanneurFixture; onClick?: () => void }) {
  const products = useMemo(() => Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: -0.22 + (i % 3) * 0.22,
    y: 0.28 + Math.floor(i / 9) * 0.5,
    z: -2.2 + (i % 9) * 0.55,
    color: ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#facc15'][i % 6],
  })), [])
  return (
    <group position={fixture.position} rotation={[0, fixture.rotationY ?? 0, 0]} userData={{ fixtureId: fixture.id, zoneId: fixture.zoneId, collection: fixture.firebaseCollection }} onClick={onClick}>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.55, 2.3, 5.8]} />
        <meshStandardMaterial color="#7a6755" roughness={0.75} />
      </mesh>
      {[0.32, 0.82, 1.32, 1.82, 2.28].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <boxGeometry args={[0.7, 0.06, 5.7]} />
          <meshStandardMaterial color="#9a8268" roughness={0.7} />
        </mesh>
      ))}
      {products.map((p) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]} castShadow>
          <boxGeometry args={[0.14, 0.24, 0.18]} />
          <meshStandardMaterial color={p.color} roughness={0.55} />
        </mesh>
      ))}
    </group>
  )
})

const FridgeWall = memo(function FridgeWall({ fixture, onClick }: { fixture: DepanneurFixture; onClick?: () => void }) {
  return (
    <group position={fixture.position} userData={{ fixtureId: fixture.id, zoneId: fixture.zoneId, collection: fixture.firebaseCollection }} onClick={onClick}>
      {[-3.2, -1.6, 0, 1.6, 3.2].map((x, i) => (
        <group key={x} position={[x, 1.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.45, 2.4, 0.72]} />
            <meshStandardMaterial color="#dbe4ee" metalness={0.6} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.39]}>
            <boxGeometry args={[1.3, 2.2, 0.035]} />
            <meshPhysicalMaterial color="#bde7ff" transmission={0.7} roughness={0.05} transparent opacity={0.58} />
          </mesh>
          {[0.45, 0, -0.45].map((y, yi) => (
            <mesh key={yi} position={[0, y, 0.44]}>
              <boxGeometry args={[1.12, 0.05, 0.06]} />
              <meshStandardMaterial color={['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316'][(i + yi) % 5]} emissiveIntensity={0.2} />
            </mesh>
          ))}
          <pointLight position={[0, 0.6, 0.55]} color="#dff6ff" intensity={0.22} distance={2.5} />
        </group>
      ))}
    </group>
  )
})

const CounterFixture = memo(function CounterFixture({ fixture, onClick }: { fixture: DepanneurFixture; onClick?: () => void }) {
  return (
    <group position={fixture.position} userData={{ fixtureId: fixture.id, zoneId: fixture.zoneId, collection: fixture.firebaseCollection }} onClick={onClick}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={fixture.scale ?? [5.8, 1.05, 0.9]} />
        <meshStandardMaterial color="#b28b4b" roughness={0.52} metalness={0.08} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[6.05, 0.08, 1.05]} />
        <meshStandardMaterial color="#e8dcc6" roughness={0.22} metalness={0.2} />
      </mesh>
    </group>
  )
})

const SmallMachine = memo(function SmallMachine({ fixture, onClick }: { fixture: DepanneurFixture; onClick?: () => void }) {
  const ref = useRef<THREE.Mesh>(null)
  const color = fixture.type === 'atm' ? '#2563eb' : fixture.type === 'slush' ? '#ef4444' : fixture.type === 'coffee' ? '#78350f' : fixture.type === 'hotdog' ? '#f97316' : '#22c55e'
  useFrame((state) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.25 + Math.sin(state.clock.elapsedTime * 2 + fixture.position[0]) * 0.08
    }
  })
  return (
    <group position={fixture.position} userData={{ fixtureId: fixture.id, zoneId: fixture.zoneId, collection: fixture.firebaseCollection }} onClick={onClick}>
      <mesh castShadow>
        <boxGeometry args={fixture.type === 'hotdog' ? [1.1, 0.42, 0.55] : [0.9, 1.45, 0.7]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.45} roughness={0.28} />
      </mesh>
      <mesh ref={ref} position={[0, fixture.type === 'hotdog' ? 0.13 : 0.28, 0.37]}>
        <boxGeometry args={fixture.type === 'hotdog' ? [0.82, 0.12, 0.035] : [0.58, 0.34, 0.035]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <Text position={[0, fixture.type === 'hotdog' ? 0.46 : 0.95, 0.42]} fontSize={0.12} color="#111827" anchorX="center">
        {fixture.label.toUpperCase()}
      </Text>
    </group>
  )
})

const FuelPump = memo(function FuelPump({ fixture, onClick }: { fixture: DepanneurFixture; onClick?: () => void }) {
  return (
    <group position={fixture.position} userData={{ fixtureId: fixture.id, zoneId: fixture.zoneId, collection: fixture.firebaseCollection }} onClick={onClick}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 1.8, 0.58]} />
        <meshStandardMaterial color="#efefea" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.42, 0.31]}>
        <boxGeometry args={[0.5, 0.42, 0.035]} />
        <meshStandardMaterial color="#111827" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.48, -0.25, 0.05]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.06, 0.82, 0.06]} />
        <meshStandardMaterial color="#111827" roughness={0.6} />
      </mesh>
      <Text position={[0, 1.15, 0.34]} fontSize={0.12} color="#cc1018" anchorX="center">
        ESSENCE
      </Text>
    </group>
  )
})

const SecurityCamera = memo(function SecurityCamera({ position, rotation }: { position: Vec3; rotation: Vec3 }) {
  const head = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (head.current) head.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.32
  })
  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={[0.12, 0.09, 0.12]} /><meshStandardMaterial color="#f8fafc" metalness={0.4} /></mesh>
      <group ref={head} position={[0, -0.12, 0.12]}>
        <mesh><boxGeometry args={[0.18, 0.12, 0.28]} /><meshStandardMaterial color="#111827" metalness={0.55} roughness={0.25} /></mesh>
        <mesh position={[0, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.05, 0.06, 0.05, 12]} /><meshStandardMaterial color="#020617" /></mesh>
      </group>
      <pointLight position={[0, -0.12, 0.3]} color="#ef4444" intensity={0.15} distance={3} />
    </group>
  )
})

const DebugZones = memo(function DebugZones({ onZoneClick }: { onZoneClick?: (zone: DepanneurZone) => void }) {
  return (
    <group>
      {DEPANNEUR_ZONES.map((zone) => (
        <mesh key={zone.id} position={[zone.position[0], 0.035, zone.position[2]]} onClick={() => onZoneClick?.(zone)} userData={{ zoneId: zone.id, firebaseCollection: zone.firebaseCollection }}>
          <boxGeometry args={[zone.size[0], 0.04, zone.size[2]]} />
          <meshBasicMaterial color={zone.access === 'public' ? '#22c55e' : '#f97316'} transparent opacity={0.12} />
        </mesh>
      ))}
    </group>
  )
})

function renderFixture(fixture: DepanneurFixture, onFixtureClick?: (fixture: DepanneurFixture) => void) {
  const onClick = () => onFixtureClick?.(fixture)
  if (fixture.type === 'shelf') return <Shelf key={fixture.id} fixture={fixture} onClick={onClick} />
  if (fixture.type === 'fridge') return <FridgeWall key={fixture.id} fixture={fixture} onClick={onClick} />
  if (fixture.type === 'counter') return <CounterFixture key={fixture.id} fixture={fixture} onClick={onClick} />
  if (fixture.type === 'fuel_pump') return <FuelPump key={fixture.id} fixture={fixture} onClick={onClick} />
  return <SmallMachine key={fixture.id} fixture={fixture} onClick={onClick} />
}

export const DepanneurScene = memo(function DepanneurScene({
  onEnter,
  onFixtureClick,
  onZoneClick,
  showDebugZones = false,
}: DepanneurSceneProps) {
  const tileTex = useTileTexture()
  const asphaltTex = useAsphaltTexture()
  const { origin, architectural } = DEPANNEUR_BUILDING

  const inventoryValue = useMemo(
    () => DEPANNEUR_INVENTORY.reduce((sum, item) => sum + item.price * item.stock, 0),
    []
  )

  return (
    <group position={origin} userData={{ buildingId: DEPANNEUR_BUILDING.id, type: 'depanneur_building', firebaseReady: true }}>
      {/* Fondation + stationnement */}
      <mesh position={[0, -0.16, 2]} receiveShadow>
        <boxGeometry args={[32, 0.32, 34]} />
        <meshStandardMaterial map={asphaltTex} color="#2a2a2e" roughness={0.92} />
      </mesh>

      {/* Peinture stationnement */}
      {[-8, -4, 0, 4, 8].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, 14]}>
          <planeGeometry args={[0.08, 9]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.08} />
        </mesh>
      ))}

      {/* Auvent pompes indépendant */}
      <group position={[-13.5, 0, 10]}>
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[8.5, 0.32, 11.5]} />
          <meshStandardMaterial color="#cc1018" roughness={0.32} metalness={0.18} />
        </mesh>
        {[-3.6, 3.6].map((x) => [-4.8, 4.8].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 2.05, z]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, 4.1, 8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.65} roughness={0.28} />
          </mesh>
        )))}
        <pointLight position={[0, 3.9, 0]} color="#fff7d6" intensity={1.1} distance={15} />
      </group>

      {/* Bâtiment: sol/plafond/murs séparés pour intérieur visible */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[architectural.width, architectural.depth]} />
        <meshStandardMaterial map={tileTex} color="#ddd6c8" roughness={0.5} />
      </mesh>
      <mesh position={[0, architectural.height, 0]}>
        <boxGeometry args={[architectural.width, 0.16, architectural.depth]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.85} />
      </mesh>
      <mesh position={[0, architectural.height / 2, -architectural.depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[architectural.width, architectural.height, architectural.wallThickness]} />
        <meshStandardMaterial color="#eee7dc" roughness={0.68} />
      </mesh>
      <mesh position={[-architectural.width / 2, architectural.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[architectural.wallThickness, architectural.height, architectural.depth]} />
        <meshStandardMaterial color="#eee7dc" roughness={0.68} />
      </mesh>
      <mesh position={[architectural.width / 2, architectural.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[architectural.wallThickness, architectural.height, architectural.depth]} />
        <meshStandardMaterial color="#eee7dc" roughness={0.68} />
      </mesh>
      <mesh position={[-5.5, architectural.height / 2, architectural.depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[5.8, architectural.height, architectural.wallThickness]} />
        <meshStandardMaterial color="#eee7dc" roughness={0.68} />
      </mesh>
      <mesh position={[5.5, architectural.height / 2, architectural.depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[5.8, architectural.height, architectural.wallThickness]} />
        <meshStandardMaterial color="#eee7dc" roughness={0.68} />
      </mesh>

      {/* Vitrines */}
      {[-5.5, 5.5].map((x) => (
        <mesh key={x} position={[x, 2.65, architectural.depth / 2 + 0.08]}>
          <boxGeometry args={[3.6, 2.85, 0.05]} />
          <meshPhysicalMaterial color="#bde7ff" transmission={0.75} roughness={0.04} transparent opacity={0.55} />
        </mesh>
      ))}

      <SlidingDoorVisual onEnter={onEnter} />
      <NeonSign position={[0, 7.35, 8.18]} title="COUCHE-TARD" subtitle="OUVERT 24H · ETHERWORLD" />
      <NeonSign position={[0, 4.45, -8.18]} title="LIVRAISON" subtitle="STAFF ONLY · FIREBASE LOG" color="#f97316" />

      {/* Fixtures registry-driven */}
      {DEPANNEUR_FIXTURES.map((fixture) => renderFixture(fixture, onFixtureClick))}

      {/* Caméras registry-driven */}
      {DEPANNEUR_CAMERAS.map((cam) => (
        <SecurityCamera key={cam.id} position={cam.position as Vec3} rotation={cam.rotation as Vec3} />
      ))}

      {/* Déchets / recyclage */}
      <group position={[10.8, 0, -7.8]} userData={{ zoneId: 'depanneur_waste_zone' }}>
        {['#333333', '#2563eb', '#16a34a'].map((color, i) => (
          <mesh key={color} position={[-0.9 + i * 0.9, 0.55, 0]} castShadow>
            <boxGeometry args={[0.7, 1.1, 0.7]} />
            <meshStandardMaterial color={color} roughness={0.55} metalness={0.22} />
          </mesh>
        ))}
      </group>

      {/* Lumières intérieures néon */}
      {[-5.5, -2, 1.5, 5].map((x) => [-3.5, 1.5, 5].map((z) => (
        <group key={`${x}-${z}`} position={[x, architectural.height - 0.35, z]}>
          <mesh>
            <boxGeometry args={[1.25, 0.06, 0.38]} />
            <meshStandardMaterial color="#fff8e0" emissive="#fff8e0" emissiveIntensity={0.75} />
          </mesh>
          <pointLight position={[0, -0.15, 0]} color="#fff8e0" intensity={0.55} distance={7} />
        </group>
      )))}

      {/* Étiquettes RP / Firebase */}
      <Text position={[0, 1.8, 8.75]} fontSize={0.22} color="#86efac" anchorX="center">
        E — Entrer / Acheter / Travailler
      </Text>
      <Text position={[0, 6.2, 0]} fontSize={0.16} color="#38bdf8" anchorX="center">
        Inventaire Firebase estimé: {Math.round(inventoryValue).toLocaleString('fr-CA')}$
      </Text>

      {showDebugZones && <DebugZones onZoneClick={onZoneClick} />}

      <ambientLight intensity={0.16} color="#fff8e0" />
      <pointLight position={[0, 6, 8]} intensity={1.8} color="#fff4cc" distance={22} />
      <pointLight position={[-12, 4, 12]} intensity={1.2} color="#fff4cc" distance={18} />
    </group>
  )
})
