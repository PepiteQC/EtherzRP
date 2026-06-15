import { useMemo } from 'react'
import { Text } from '@react-three/drei'

export type Vec3 = [number, number, number]

type BuildingKind = 'house' | 'duplex' | 'store' | 'garage' | 'church' | 'barn' | 'motel'

interface SaintMarcProps {
  position?: Vec3
  rotationY?: number
  scale?: number
  showLabel?: boolean
  debug?: boolean
}

interface BuildingPlot {
  id: string
  kind: BuildingKind
  position: Vec3
  size: Vec3
  roofHeight: number
  wallColor: string
  roofColor: string
  accentColor: string
  rotationY: number
}

interface TreePlot {
  id: string
  position: Vec3
  height: number
  radius: number
  color: string
}

const HOUSE_WALLS = ['#d6c8b3', '#c8b6a0', '#b8c0c8', '#e5ddcf', '#a8b4a3', '#c9b69a'] as const
const HOUSE_ROOFS = ['#7c2d12', '#92400e', '#334155', '#78350f', '#4b5563', '#581c87'] as const
const ACCENTS = ['#1e3a8a', '#0f766e', '#7c2d12', '#334155', '#854d0e'] as const

function seeded(seed: number): number {
  const x = Math.sin(seed * 91.17 + 13.7) * 43758.5453
  return x - Math.floor(x)
}

function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.floor(seeded(seed) * items.length) % items.length]
}

function BuildingBlock({ plot }: { plot: BuildingPlot }) {
  const [w, h, d] = plot.size
  const isChurch = plot.kind === 'church'
  const isStore = plot.kind === 'store'
  const isGarage = plot.kind === 'garage'
  const isMotel = plot.kind === 'motel'

  return (
    <group position={plot.position} rotation={[0, plot.rotationY, 0]} name={`SaintMarc-${plot.kind}-${plot.id}`}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[w + 0.35, 0.16, d + 0.35]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>

      <mesh position={[0, h / 2 + 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={plot.wallColor} roughness={0.78} metalness={0.02} />
      </mesh>

      <mesh position={[0, h + plot.roofHeight / 2 + 0.16, 0]} castShadow>
        <boxGeometry args={[w + 0.45, plot.roofHeight, d + 0.55]} />
        <meshStandardMaterial color={plot.roofColor} roughness={0.62} metalness={0.06} />
      </mesh>
      <mesh position={[0, h + plot.roofHeight + plot.roofHeight * 0.58 + 0.16, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[Math.max(w, d) * 0.55, plot.roofHeight * 1.16, 4]} />
        <meshStandardMaterial color={plot.roofColor} roughness={0.64} metalness={0.05} />
      </mesh>

      {isStore ? (
        <>
          <mesh position={[0, 1.45, d / 2 + 0.012]}>
            <planeGeometry args={[w * 0.72, 1.35]} />
            <meshPhysicalMaterial color="#9bd7f0" roughness={0.05} metalness={0.02} transparent opacity={0.72} clearcoat={0.5} />
          </mesh>
          <mesh position={[0, 2.45, d / 2 + 0.03]}>
            <boxGeometry args={[w * 0.88, 0.42, 0.06]} />
            <meshStandardMaterial color={plot.accentColor} emissive={plot.accentColor} emissiveIntensity={0.08} />
          </mesh>
          <Text position={[0, 2.46, d / 2 + 0.07]} fontSize={0.22} color="#fff7ed" anchorX="center" anchorY="middle">
            DÉPANNEUR ST-MARC
          </Text>
        </>
      ) : isGarage ? (
        <>
          <mesh position={[0, 1.05, d / 2 + 0.025]}>
            <boxGeometry args={[w * 0.72, 1.45, 0.08]} />
            <meshStandardMaterial color="#475569" roughness={0.55} metalness={0.22} />
          </mesh>
          <mesh position={[0, 2.0, d / 2 + 0.08]}>
            <boxGeometry args={[w * 0.75, 0.08, 0.04]} />
            <meshStandardMaterial color="#111827" emissive="#f97316" emissiveIntensity={0.18} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.95, d / 2 + 0.025]}>
            <boxGeometry args={[0.52, 1.35, 0.07]} />
            <meshStandardMaterial color={plot.accentColor} roughness={0.52} metalness={0.08} />
          </mesh>
          {[-0.82, 0.82].map((x, i) => (
            <mesh key={`front-window-${i}`} position={[x * Math.min(1.1, w / 3.4), 1.65, d / 2 + 0.03]}>
              <planeGeometry args={[0.48, 0.42]} />
              <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.12} roughness={0.15} transparent opacity={0.82} />
            </mesh>
          ))}
        </>
      )}

      {!isGarage && !isChurch && [-1, 1].map((side) => (
        <mesh key={`side-window-${side}`} position={[side * (w / 2 + 0.015), 1.55, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[d * 0.32, 0.45]} />
          <meshStandardMaterial color="#bfdbfe" emissive="#60a5fa" emissiveIntensity={0.08} transparent opacity={0.76} roughness={0.1} />
        </mesh>
      ))}

      {isChurch && (
        <group position={[0, h + 1.2, d * 0.28]}>
          <mesh position={[0, 1.8, 0]} castShadow>
            <boxGeometry args={[1.1, 3.6, 1.1]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.68} />
          </mesh>
          <mesh position={[0, 4.15, 0]} castShadow>
            <coneGeometry args={[0.85, 1.6, 4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.46} metalness={0.18} />
          </mesh>
          <mesh position={[0, 5.1, 0]}>
            <boxGeometry args={[0.08, 0.9, 0.08]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.5} roughness={0.35} />
          </mesh>
          <mesh position={[0, 5.32, 0]}>
            <boxGeometry args={[0.52, 0.08, 0.08]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      )}

      {!isChurch && !isGarage && !isMotel && (
        <group position={[0, 0.72, d / 2 + 0.38]}>
          <mesh receiveShadow>
            <boxGeometry args={[w * 0.86, 0.08, 0.58]} />
            <meshStandardMaterial color="#7c5f3c" roughness={0.78} />
          </mesh>
          {[-0.42, -0.18, 0.18, 0.42].map((nx) => (
            <mesh key={nx} position={[nx * w, 0.42, 0.22]}>
              <boxGeometry args={[0.06, 0.82, 0.06]} />
              <meshStandardMaterial color="#6b4f2a" roughness={0.7} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

function RoadSegment({ position, size, rotationY = 0 }: { position: Vec3; size: Vec3; rotationY?: number }) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#1f2933" roughness={0.93} metalness={0.02} />
    </mesh>
  )
}

function StreetLight({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.055, 2.9, 10]} />
        <meshStandardMaterial color="#64748b" metalness={0.48} roughness={0.38} />
      </mesh>
      <mesh position={[0.28, 2.82, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 10]} />
        <meshStandardMaterial color="#64748b" metalness={0.48} roughness={0.38} />
      </mesh>
      <mesh position={[0.58, 2.82, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.45} />
      </mesh>
      <pointLight position={[0.58, 2.75, 0]} color="#fde68a" intensity={0.55} distance={8} />
    </group>
  )
}

function Tree({ tree }: { tree: TreePlot }) {
  return (
    <group position={tree.position} name={`SaintMarc-tree-${tree.id}`}>
      <mesh position={[0, tree.height * 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, tree.height * 0.56, 8]} />
        <meshStandardMaterial color="#6b4423" roughness={0.88} />
      </mesh>
      <mesh position={[0, tree.height * 0.72, 0]} castShadow>
        <coneGeometry args={[tree.radius, tree.height * 0.85, 9]} />
        <meshStandardMaterial color={tree.color} roughness={0.94} />
      </mesh>
      <mesh position={[0, tree.height * 1.02, 0]} castShadow>
        <coneGeometry args={[tree.radius * 0.72, tree.height * 0.62, 9]} />
        <meshStandardMaterial color={tree.color} roughness={0.94} />
      </mesh>
    </group>
  )
}

function VillageSign() {
  return (
    <group position={[-4.2, 0, -13.8]} rotation={[0, 0.18, 0]} name="SaintMarc-entry-sign">
      <mesh position={[0, 0.6, -0.02]}>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
        <meshStandardMaterial color="#4b5563" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[2.8, 0.82, 0.12]} />
        <meshStandardMaterial color="#0f766e" roughness={0.55} metalness={0.05} />
      </mesh>
      <Text position={[0, 1.54, 0.08]} fontSize={0.22} color="#ecfeff" anchorX="center" anchorY="middle">
        Saint-Marc
      </Text>
      <Text position={[0, 1.25, 0.08]} fontSize={0.105} color="#ccfbf1" anchorX="center" anchorY="middle">
        Village riverain • Route 138
      </Text>
    </group>
  )
}

export function SaintMarc({
  position = [-55, 0, 190],
  rotationY = -0.08,
  scale = 1,
  showLabel = true,
  debug = false,
}: SaintMarcProps) {
  const buildings = useMemo<BuildingPlot[]>(() => {
    const layout: Array<[BuildingKind, number, number, number, number]> = [
      ['house', -10, -6, 0.04, 1.0],
      ['duplex', -4, -7.5, -0.08, 1.08],
      ['store', 3.5, -8, 0.02, 1.12],
      ['garage', 10, -5.5, 0.1, 0.95],
      ['church', -8, 4.5, 0.12, 1.18],
      ['house', -1.5, 5.5, -0.06, 1.0],
      ['motel', 5.5, 4.2, 0.04, 1.08],
      ['barn', 12, 5.8, -0.18, 1.18],
      ['house', -13, 11.5, 0.18, 0.95],
      ['house', 0.5, 12.5, -0.1, 1.02],
      ['duplex', 9.5, 12, 0.08, 1.05],
    ]

    return layout.map(([kind, x, z, rot, s], i) => {
      const isChurch = kind === 'church'
      const isStore = kind === 'store'
      const isGarage = kind === 'garage'
      const isBarn = kind === 'barn'
      const isMotel = kind === 'motel'
      const baseW = isChurch ? 5.2 : isStore ? 6.8 : isGarage ? 5.8 : isBarn ? 6.4 : isMotel ? 8.8 : kind === 'duplex' ? 5.4 : 4.1
      const baseH = isChurch ? 5.6 : isStore ? 3.2 : isGarage ? 2.9 : isBarn ? 4.2 : isMotel ? 2.8 : kind === 'duplex' ? 3.9 : 3.3
      const baseD = isChurch ? 8.5 : isStore ? 5.8 : isGarage ? 5.5 : isBarn ? 7.2 : isMotel ? 4.4 : kind === 'duplex' ? 5.5 : 4.4
      return {
        id: `${kind}-${i}`,
        kind,
        position: [x, 0, z],
        size: [baseW * s, baseH * s, baseD * s],
        roofHeight: (isGarage ? 0.55 : isStore ? 0.72 : isMotel ? 0.55 : 1.0) * s,
        wallColor: isChurch ? '#f8fafc' : isStore ? '#fef3c7' : isGarage ? '#cbd5e1' : isBarn ? '#9a3412' : pick(HOUSE_WALLS, i + 3),
        roofColor: isChurch ? '#1e293b' : isStore ? '#dc2626' : isGarage ? '#334155' : isBarn ? '#7c2d12' : pick(HOUSE_ROOFS, i + 11),
        accentColor: pick(ACCENTS, i + 21),
        rotationY: rot,
      }
    })
  }, [])

  const trees = useMemo<TreePlot[]>(() => {
    const positions: Vec3[] = [
      [-16, 0, -11], [-13, 0, -1], [-15, 0, 8], [-16, 0, 17],
      [15, 0, -10], [17, 0, -1], [16, 0, 8], [15, 0, 17],
      [-5, 0, -14], [7, 0, -14], [-4, 0, 17], [6, 0, 18],
    ]
    return positions.map((p, i) => ({
      id: String(i),
      position: p,
      height: 2.7 + seeded(i + 44) * 1.5,
      radius: 0.75 + seeded(i + 72) * 0.45,
      color: i % 3 === 0 ? '#14532d' : i % 3 === 1 ? '#166534' : '#0f5132',
    }))
  }, [])

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale} name="Village-Saint-Marc">
      <mesh position={[0, -0.015, 2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[39, 39]} />
        <meshStandardMaterial color="#315b35" roughness={0.98} />
      </mesh>

      <RoadSegment position={[0, 0.025, 2]} size={[3.4, 0.05, 33]} rotationY={0.03} />
      <RoadSegment position={[0, 0.03, -6.5]} size={[26, 0.045, 2.6]} rotationY={0.05} />
      <RoadSegment position={[0, 0.03, 8.5]} size={[28, 0.045, 2.4]} rotationY={-0.04} />
      <RoadSegment position={[-8.5, 0.035, 2.5]} size={[2.1, 0.04, 18]} rotationY={-0.1} />
      <RoadSegment position={[10.5, 0.035, 3.5]} size={[2.1, 0.04, 18]} rotationY={0.08} />

      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={`line-${i}`} position={[0, 0.063, -11 + i * 4.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 1.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
      ))}

      {buildings.map((plot) => <BuildingBlock key={plot.id} plot={plot} />)}

      <mesh position={[4.2, 0.052, -12.3]} receiveShadow>
        <boxGeometry args={[9.8, 0.04, 3.4]} />
        <meshStandardMaterial color="#263238" roughness={0.92} />
      </mesh>
      {[-2.6, -0.9, 0.9, 2.6].map((x) => (
        <mesh key={`parking-line-${x}`} position={[4.2 + x, 0.08, -12.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 2.6]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.55} />
        </mesh>
      ))}

      <mesh position={[-3.8, 0.05, 0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.4, 28]} />
        <meshStandardMaterial color="#3f7a3f" roughness={0.96} />
      </mesh>
      <mesh position={[-3.8, 0.22, 0.8]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.34, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>
      <mesh position={[-3.8, 0.55, 0.8]} castShadow>
        <sphereGeometry args={[0.44, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.08} roughness={0.18} transparent opacity={0.76} />
      </mesh>

      {[[-1.9, 0, -9.8], [1.9, 0, -3.2], [-1.9, 0, 4.2], [1.9, 0, 10.8], [-9.8, 0, 8.2], [11.8, 0, 8.6]].map((p, i) => (
        <StreetLight key={`lamp-${i}`} position={p as Vec3} />
      ))}

      {trees.map((tree) => <Tree key={tree.id} tree={tree} />)}

      <VillageSign />

      {showLabel && (
        <Text position={[0, 8.8, 0]} fontSize={1.15} color="#dbeafe" anchorX="center" anchorY="middle" outlineWidth={0.035} outlineColor="#0f172a">
          Saint-Marc
        </Text>
      )}

      {debug && (
        <mesh position={[0, 0.08, 2.5]}>
          <boxGeometry args={[39, 0.08, 39]} />
          <meshBasicMaterial color="#00e0ff" transparent opacity={0.08} wireframe />
        </mesh>
      )}
    </group>
  )
}

export default SaintMarc
