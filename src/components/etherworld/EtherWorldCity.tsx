// ════════════════════════════════════════════════════════════════
// ETHERWORLD CITY — Intégrée à la Route 138
// Positionnée à z = +900 (bout de Trois-Rivières)
// ════════════════════════════════════════════════════════════════

import { memo, useMemo, useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Décalage Z de toute la ville par rapport à la route
const CITY_Z = 900

// ── Utilitaire de couleurs aléatoires déterministes ──
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// ════════════════════════════════════════════════════════════════
// SOL DE LA VILLE + ROUTES INTERNES
// ════════════════════════════════════════════════════════════════

const CityGround = memo(function CityGround() {
  const lampPositions = useMemo(
    () => Array.from({ length: 10 }, (_, i) => -40 + i * 10),
    []
  )

  return (
    <group>
      {/* Sol principal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.95} />
      </mesh>

      {/* Route principale traversant la ville (Z-axis) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[14, 220]} />
        <meshStandardMaterial color="#333333" roughness={0.9} />
      </mesh>

      {/* Lignes jaunes centrales */}
      {[0.3, -0.3].map((z, i) => (
        <mesh key={`cl-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]}>
          <planeGeometry args={[220, 0.15]} />
          <meshStandardMaterial color="#ffdd00" emissive="#ffdd00" emissiveIntensity={0.2} />
        </mesh>
      ))}

      {/* Lignes blanches de rive */}
      {[-5.8, 5.8].map((z, i) => (
        <mesh key={`el-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]}>
          <planeGeometry args={[220, 0.2]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.15} />
        </mesh>
      ))}

      {/* Trottoirs */}
      {[-8, 8].map((z, i) => (
        <mesh key={`sw-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, z]} receiveShadow>
          <planeGeometry args={[220, 3]} />
          <meshStandardMaterial color="#555555" roughness={0.85} />
        </mesh>
      ))}

      {/* Lampadaires */}
      {lampPositions.map((x) => (
        <group key={`lamp-${x}`} position={[x, 0, 7]}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.12, 6, 8]} />
            <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[1, 5.8, 0]}>
            <boxGeometry args={[1.5, 0.08, 0.08]} />
            <meshStandardMaterial color="#555" metalness={0.8} />
          </mesh>
          <mesh position={[1.7, 5.6, 0]}>
            <boxGeometry args={[0.6, 0.15, 0.3]} />
            <meshStandardMaterial color="#ffffee" emissive="#ffffee" emissiveIntensity={0.4} />
          </mesh>
          <pointLight position={[1.7, 5.4, 0]} intensity={0.6} color="#fff8e0" distance={18} />
        </group>
      ))}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// PANNEAU D'ENTRÉE DE VILLE
// ════════════════════════════════════════════════════════════════

const CityEntranceSign = memo(function CityEntranceSign() {
  return (
    <group position={[0, 0, -95]}>
      {/* Poteaux */}
      {[-3, 3].map((x, i) => (
        <mesh key={i} position={[x, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 5, 8]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Panneau */}
      <mesh position={[0, 5.2, 0]} castShadow>
        <boxGeometry args={[8, 1.8, 0.2]} />
        <meshStandardMaterial color="#003087" roughness={0.5} />
      </mesh>
      <Text
        position={[0, 5.2, 0.12]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        ETHERWORLD — VILLE
      </Text>
      <Text
        position={[0, 4.5, 0.12]}
        fontSize={0.22}
        color="#aad4ff"
        anchorX="center"
        anchorY="middle"
      >
        Bienvenue · Population 12 847
      </Text>
      <pointLight position={[0, 5.5, 1]} intensity={1} color="#aad4ff" distance={10} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// HÔTEL EXTÉRIEUR
// ════════════════════════════════════════════════════════════════

const HOTEL_FLOORS = 4
const HOTEL_FLOOR_HEIGHT = 3.6
const HOTEL_WIDTH = 20
const HOTEL_DEPTH = 12
const HOTEL_TOTAL_HEIGHT = HOTEL_FLOORS * HOTEL_FLOOR_HEIGHT

const WINDOW_COLORS = ['#ffd97d', '#ffecb3', '#ffe0b2', '#80deea', '#ffcc80', '#b2dfdb']
const WINDOW_X_POSITIONS = [-8, -5, -2, 2, 5, 8]

const HotelExterior = memo(function HotelExterior() {
  return (
    <group position={[0, 0, -20]}>
      <mesh position={[0, HOTEL_TOTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[HOTEL_WIDTH, HOTEL_TOTAL_HEIGHT, HOTEL_DEPTH]} />
        <meshStandardMaterial color="#2d313a" roughness={0.92} />
      </mesh>

      {/* Séparateurs d'étages */}
      {Array.from({ length: HOTEL_FLOORS }, (_, f) => (
        <mesh key={`sep-${f}`} position={[0, f * HOTEL_FLOOR_HEIGHT, 0]}>
          <boxGeometry args={[HOTEL_WIDTH + 0.4, 0.25, HOTEL_DEPTH + 0.4]} />
          <meshStandardMaterial color="#1e2024" roughness={0.9} />
        </mesh>
      ))}

      {/* Piliers latéraux */}
      {[-HOTEL_WIDTH / 2 - 0.1, HOTEL_WIDTH / 2 + 0.1].map((x, i) => (
        <mesh key={`pillar-${i}`} position={[x, HOTEL_TOTAL_HEIGHT / 2, 0]} castShadow>
          <boxGeometry args={[0.3, HOTEL_TOTAL_HEIGHT, HOTEL_DEPTH + 0.1]} />
          <meshStandardMaterial color="#8b251e" roughness={0.8} />
        </mesh>
      ))}

      {/* Fenêtres */}
      {Array.from({ length: HOTEL_FLOORS }, (_, floor) =>
        floor > 0 &&
        WINDOW_X_POSITIONS.map((x, wi) => {
          const y = floor * HOTEL_FLOOR_HEIGHT + HOTEL_FLOOR_HEIGHT / 2
          const glowColor = WINDOW_COLORS[wi]
          const isOff = (floor === 1 && wi === 4) || (floor === 3 && wi === 2)
          return (
            <group key={`w-${floor}-${wi}`}>
              <mesh position={[x, y, HOTEL_DEPTH / 2 + 0.02]}>
                <boxGeometry args={[1.8, 1.8, 0.05]} />
                <meshStandardMaterial
                  color={isOff ? '#0f1115' : glowColor}
                  emissive={isOff ? '#000' : glowColor}
                  emissiveIntensity={isOff ? 0 : 0.4}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
          )
        })
      )}

      {/* Enseigne HOTEL */}
      <mesh position={[0, HOTEL_TOTAL_HEIGHT + 0.8, HOTEL_DEPTH / 2 + 0.1]}>
        <boxGeometry args={[4.4, 1.2, 0.25]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.9} />
      </mesh>
      <mesh position={[0, HOTEL_TOTAL_HEIGHT + 0.8, HOTEL_DEPTH / 2 + 0.25]}>
        <boxGeometry args={[3.8, 0.8, 0.05]} />
        <meshStandardMaterial color="#ff2233" emissive="#ff0022" emissiveIntensity={1.5} />
      </mesh>
      <Text
        position={[0, HOTEL_TOTAL_HEIGHT + 0.8, HOTEL_DEPTH / 2 + 0.35]}
        fontSize={0.5}
        color="#ff4444"
        anchorX="center"
      >
        HOTEL
      </Text>
      <pointLight
        position={[0, HOTEL_TOTAL_HEIGHT + 1.5, HOTEL_DEPTH / 2 + 1]}
        color="#ff1133"
        intensity={2}
        distance={10}
      />

      {/* Auvent d'entrée */}
      <mesh position={[0, 3.3, HOTEL_DEPTH / 2 + 2.5]} castShadow>
        <boxGeometry args={[7, 0.25, 5]} />
        <meshStandardMaterial color="#2d3436" roughness={0.8} />
      </mesh>
      <pointLight position={[0, 3, HOTEL_DEPTH / 2 + 2.5]} color="#fff8e0" intensity={1} distance={8} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// DÉPANNEUR
// ════════════════════════════════════════════════════════════════

const DepanneurCity = memo(function DepanneurCity() {
  return (
    <group position={[-30, 0, 15]}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[8, 0.2, 6]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 6]} />
        <meshStandardMaterial color="#d8d0c3" roughness={0.65} />
      </mesh>
      <mesh position={[0, 4.25, 0]} castShadow>
        <boxGeometry args={[8.4, 0.5, 6.4]} />
        <meshStandardMaterial color="#cc0000" roughness={0.55} />
      </mesh>
      {/* Vitrine */}
      <mesh position={[0, 2, -3.04]}>
        <boxGeometry args={[1.8, 2.8, 0.08]} />
        <meshStandardMaterial color="#9fd8ff" roughness={0.05} transparent opacity={0.45} />
      </mesh>
      {/* Enseigne */}
      <mesh position={[0, 4.7, -3.1]}>
        <boxGeometry args={[6, 0.8, 0.12]} />
        <meshStandardMaterial color="#c1121f" emissive="#5c0000" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0, 4.75, -3.25]} fontSize={0.3} color="#cc0000" anchorX="center">
        DÉPANNEUR
      </Text>
      <pointLight position={[0, 5, -3]} intensity={1.6} color="#ffdd88" distance={12} />
      <pointLight position={[0, 2.5, 0]} intensity={1} color="#fff8e0" distance={8} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// BÂTIMENTS GÉNÉRIQUES DE LA VILLE
// ════════════════════════════════════════════════════════════════

interface BuildingData {
  x: number; z: number; w: number; d: number; h: number; color: string
}

const CITY_BUILDINGS: BuildingData[] = [
  { x: -30, z: -25, w: 10, d: 8,  h: 12, color: '#2a2a3a' },
  { x:  30, z: -30, w: 12, d: 10, h: 18, color: '#3a2a2a' },
  { x: -25, z:  20, w: 8,  d: 8,  h: 8,  color: '#2a3a2a' },
  { x:  35, z:  15, w: 14, d: 8,  h: 14, color: '#3a3a2a' },
  { x: -40, z: -10, w: 6,  d: 6,  h: 6,  color: '#333'    },
  { x:  50, z: -20, w: 10, d: 12, h: 22, color: '#2a2a40' },
  { x: -50, z:  30, w: 12, d: 8,  h: 16, color: '#3a2a3a' },
  { x:  45, z:  40, w: 8,  d: 8,  h: 10, color: '#2a3a3a' },
]

const GenericBuilding = memo(function GenericBuilding({
  b, index,
}: {
  b: BuildingData; index: number
}) {
  const windowRows = Math.floor(b.h / 3)
  const windowCols = Math.floor(b.w / 2.5)

  return (
    <group position={[b.x, 0, b.z]}>
      <mesh position={[0, b.h / 2, 0]} castShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial color={b.color} roughness={0.9} />
      </mesh>
      {Array.from({ length: windowRows }, (_, f) =>
        Array.from({ length: windowCols }, (_, wi) => {
          const seed = index * 1000 + f * 100 + wi
          const isLit = seededRandom(seed) > 0.3
          return (
            <mesh
              key={`bw-${f}-${wi}`}
              position={[-b.w / 2 + 1.5 + wi * 2.5, 2 + f * 3, b.d / 2 + 0.02]}
            >
              <boxGeometry args={[1, 1.2, 0.02]} />
              <meshStandardMaterial
                color={isLit ? '#ffd97d' : '#111'}
                emissive={isLit ? '#ffd97d' : '#000'}
                emissiveIntensity={0.3}
              />
            </mesh>
          )
        })
      )}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// HÔPITAL
// ════════════════════════════════════════════════════════════════

const Hospital = memo(function Hospital() {
  return (
    <group position={[45, 0, 15]}>
      <mesh position={[0, 10, 0]} castShadow>
        <boxGeometry args={[15, 20, 12]} />
        <meshStandardMaterial color="#2a3a4e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 20.2, 0]} castShadow>
        <boxGeometry args={[15.5, 0.3, 12.5]} />
        <meshStandardMaterial color="#0f1419" />
      </mesh>
      <mesh position={[0, 19, 6.2]}>
        <boxGeometry args={[8, 1, 0.1]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <Text position={[0, 19, 6.3]} fontSize={0.5} color="#ef4444" anchorX="center">
        HÔPITAL
      </Text>
      <pointLight position={[0, 19, 7]} color="#ef4444" intensity={1} distance={8} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// ÉGLISE
// ════════════════════════════════════════════════════════════════

const Church = memo(function Church() {
  return (
    <group position={[-45, 0, -40]}>
      <mesh position={[0, 8, 0]} castShadow>
        <boxGeometry args={[12, 16, 18]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 20, -6]} castShadow>
        <boxGeometry args={[4, 8, 4]} />
        <meshStandardMaterial color="#7a6a5a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 26, -6]} castShadow>
        <coneGeometry args={[2.5, 6, 4]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.7} />
      </mesh>
      {/* Croix */}
      <mesh position={[0, 30, -6]}>
        <boxGeometry args={[0.15, 1.5, 0.15]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 30.5, -6]}>
        <boxGeometry args={[0.8, 0.15, 0.15]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>
      <Text position={[0, 6, 9.2]} fontSize={0.4} color="#fef3c7" anchorX="center">
        ÉGLISE ST-MARC
      </Text>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// PHARMACIE
// ════════════════════════════════════════════════════════════════

const Pharmacy = memo(function Pharmacy() {
  return (
    <group position={[40, 0, 30]}>
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[14, 10, 12]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
      </mesh>
      <mesh position={[0, 10.1, 0]} castShadow>
        <boxGeometry args={[14.5, 0.2, 12.5]} />
        <meshStandardMaterial color="#22c55e" roughness={0.5} />
      </mesh>
      <Text position={[0, 8.5, 6.2]} fontSize={0.5} color="#22c55e" anchorX="center">
        PHARMACIE
      </Text>
      <pointLight position={[0, 8.5, 7]} color="#22c55e" intensity={1} distance={8} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// IMMEUBLE D'APPARTEMENTS
// ════════════════════════════════════════════════════════════════

const ApartmentBlock = memo(function ApartmentBlock() {
  return (
    <group position={[-40, 0, 30]}>
      <mesh position={[0, 12, 0]} castShadow>
        <boxGeometry args={[16, 24, 14]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.88} />
      </mesh>
      {Array.from({ length: 7 }, (_, f) =>
        [-5, -2, 1, 4].map((x, wi) => {
          const isLit = seededRandom(f * 100 + wi + 500) > 0.4
          return (
            <mesh key={`aw-${f}-${wi}`} position={[x, 2 + f * 3, 7.1]}>
              <boxGeometry args={[1.8, 1.2, 0.05]} />
              <meshStandardMaterial
                color={isLit ? '#ffd97d' : '#111'}
                emissive={isLit ? '#ffd97d' : '#000'}
                emissiveIntensity={0.3}
                transparent opacity={0.8}
              />
            </mesh>
          )
        })
      )}
      <Text position={[0, 22, 7.2]} fontSize={0.4} color="#fef3c7" anchorX="center">
        APPARTEMENTS
      </Text>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// STATION D'ESSENCE
// ════════════════════════════════════════════════════════════════

const GasStation = memo(function GasStation() {
  return (
    <group position={[20, 0, 40]}>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[8, 6, 6]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
      </mesh>
      <mesh position={[0, 6.1, 0]}>
        <boxGeometry args={[8.5, 0.2, 6.5]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
      {/* Auvent pompes */}
      <mesh position={[0, 4.5, 10]}>
        <boxGeometry args={[14, 0.2, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Pompes */}
      {[-3, 0, 3].map((x, i) => (
        <group key={`pump-${i}`} position={[x, 0, 10]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[0.6, 1.6, 0.5]} />
            <meshStandardMaterial color="#cc0000" />
          </mesh>
        </group>
      ))}
      <Text position={[0, 5, 3.1]} fontSize={0.4} color="#cc0000" anchorX="center">
        ULTRAMAR
      </Text>
      <pointLight position={[0, 4.3, 10]} intensity={1.5} color="#fff8e0" distance={15} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// PARC CENTRAL
// ════════════════════════════════════════════════════════════════

const CentralPark = memo(function CentralPark() {
  const treePositions: [number, number, number][] = useMemo(
    () => [
      [-8, 0, -8], [8, 0, -8], [-8, 0, 8], [8, 0, 8],
      [-5, 0, 0],  [5, 0, 0],  [0, 0, -6], [0, 0, 6],
    ],
    []
  )

  return (
    <group position={[0, 0, 60]}>
      {/* Pelouse */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.95} />
      </mesh>
      {/* Fontaine */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[3, 3.5, 0.6, 24]} />
        <meshStandardMaterial color="#888" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.15, 24]} />
        <meshStandardMaterial color="#2b5c8f" roughness={0.1} metalness={0.8} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} intensity={0.5} color="#6bb3f0" distance={8} />
      {/* Arbres */}
      {treePositions.map(([x, , z], i) => (
        <group key={`pt-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
            <meshStandardMaterial color="#4a3525" roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow>
            <sphereGeometry args={[1.5, 8, 8]} />
            <meshStandardMaterial color="#2d5a1e" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// NPCs HOMER-STYLE
// ════════════════════════════════════════════════════════════════

interface HomerProps {
  position: [number, number, number]
  color?: string
  isPolice?: boolean
}

const HomerNPC = memo(function HomerNPC({
  position,
  color = '#FFD90F',
  isPolice = false,
}: HomerProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.03
    }
  })

  const shirtColor = isPolice ? '#001A33' : '#FFFFFF'
  const pantsColor = isPolice ? '#001A33' : '#4F76DF'

  return (
    <group ref={groupRef} position={position}>
      {/* Jambes */}
      {[-0.12, 0.12].map((x) => (
        <mesh key={`leg-${x}`} position={[x, 0.35, 0]} castShadow>
          <boxGeometry args={[0.18, 0.5, 0.18]} />
          <meshStandardMaterial color={pantsColor} flatShading />
        </mesh>
      ))}
      {/* Corps */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.5, 0.55, 0.3]} />
        <meshStandardMaterial color={shirtColor} flatShading />
      </mesh>
      {/* Tête */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      {/* Yeux */}
      {[-0.08, 0.08].map((x) => (
        <mesh key={`eye-${x}`} position={[x, 1.4, 0.2]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#fff" flatShading />
        </mesh>
      ))}
      <Text
        position={[0, 1.7, 0]}
        fontSize={0.08}
        color="#fef3c7"
        anchorX="center"
      >
        {isPolice ? 'Agent Wiggum' : 'Homer'}
      </Text>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// RÉSIDENCE ÉTHER (simplifiée)
// ════════════════════════════════════════════════════════════════

const RESIDENCE_FLOORS = 3
const RESIDENCE_FLOOR_HEIGHT = 4
const RESIDENCE_WIDTH = 22
const RESIDENCE_DEPTH = 14
const RESIDENCE_TOTAL_HEIGHT = RESIDENCE_FLOORS * RESIDENCE_FLOOR_HEIGHT

const ResidenceEther = memo(function ResidenceEther() {
  const signRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (signRef.current) {
      signRef.current.intensity = 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.4
    }
  })

  const windowLighting = useMemo(
    () =>
      Array.from({ length: RESIDENCE_FLOORS }, (_, floor) =>
        [-7.5, -2.5, 2.5, 7.5].map((_, wi) => seededRandom(floor * 100 + wi + 777) > 0.35)
      ),
    []
  )

  return (
    <group position={[60, 0, -60]}>
      {/* Corps principal */}
      <mesh position={[0, RESIDENCE_TOTAL_HEIGHT / 2, -RESIDENCE_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[RESIDENCE_WIDTH, RESIDENCE_TOTAL_HEIGHT, 0.4]} />
        <meshStandardMaterial color="#2a2e38" roughness={0.88} />
      </mesh>
      {/* Murs latéraux */}
      {[-RESIDENCE_WIDTH / 2, RESIDENCE_WIDTH / 2].map((x, i) => (
        <mesh key={`sidewall-${i}`} position={[x, RESIDENCE_TOTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, RESIDENCE_TOTAL_HEIGHT, RESIDENCE_DEPTH]} />
          <meshStandardMaterial color="#252830" roughness={0.88} />
        </mesh>
      ))}

      {/* Fenêtres */}
      {Array.from({ length: RESIDENCE_FLOORS }, (_, floor) =>
        [-7.5, -2.5, 2.5, 7.5].map((x, wi) => {
          const y = floor * RESIDENCE_FLOOR_HEIGHT + RESIDENCE_FLOOR_HEIGHT / 2
          const lit = windowLighting[floor][wi]
          const glowColor = lit ? '#ffd580' : '#0a0e1a'
          return (
            <mesh key={`rw-${floor}-${wi}`} position={[x, y, RESIDENCE_DEPTH / 2 + 0.45]}>
              <boxGeometry args={[3.2, RESIDENCE_FLOOR_HEIGHT * 0.42, 0.08]} />
              <meshStandardMaterial
                color={glowColor}
                emissive={glowColor}
                emissiveIntensity={lit ? 0.5 : 0}
                transparent opacity={0.8}
              />
            </mesh>
          )
        })
      )}

      {/* Enseigne */}
      <Text
        position={[0, RESIDENCE_TOTAL_HEIGHT + 0.8, RESIDENCE_DEPTH / 2 + 0.25]}
        fontSize={0.6}
        color="#c9a84c"
        anchorX="center"
      >
        RÉSIDENCE ÉTHER
      </Text>
      <pointLight
        ref={signRef}
        position={[0, RESIDENCE_TOTAL_HEIGHT + 1.5, RESIDENCE_DEPTH / 2 + 1]}
        color="#c9a84c"
        intensity={1.2}
        distance={12}
      />

      {/* Toit */}
      <mesh position={[0, RESIDENCE_TOTAL_HEIGHT + 0.2, 0]} castShadow>
        <boxGeometry args={[RESIDENCE_WIDTH + 1.5, 0.3, RESIDENCE_DEPTH + 1.5]} />
        <meshStandardMaterial color="#0f1419" roughness={0.8} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// LUNE
// ════════════════════════════════════════════════════════════════

const Moon = memo(function Moon() {
  return (
    <>
      <mesh position={[50, 60, -80]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshStandardMaterial color="#e0e8f0" emissive="#c0d0e0" emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[50, 60, -80]} intensity={0.3} color="#c0d0e0" distance={200} />
    </>
  )
})

// ════════════════════════════════════════════════════════════════
// ARBRES DE LA VILLE
// ════════════════════════════════════════════════════════════════

const CityTrees = memo(function CityTrees() {
  const treePositions = useMemo(
    () => Array.from({ length: 8 }, (_, i) => -30 + i * 8),
    []
  )

  return (
    <group>
      {treePositions.map((x) => (
        <group key={`tree-${x}`} position={[x, 0, 12]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 2.4, 6]} />
            <meshStandardMaterial color="#4a3020" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshStandardMaterial color="#1a5a1a" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — ETHERWORLD CITY
// ════════════════════════════════════════════════════════════════

export default memo(function EtherWorldCity() {
  return (
    <group position={[0, 0, CITY_Z]}>

      {/* ── Panneau d'entrée (visible depuis la route) ── */}
      <CityEntranceSign />

      {/* ── Sol et routes internes ── */}
      <CityGround />

      {/* ── Bâtiments principaux ── */}
      <HotelExterior />
      <DepanneurCity />
      <ResidenceEther />
      <Hospital />
      <Church />
      <Pharmacy />
      <ApartmentBlock />
      <GasStation />
      <CentralPark />
      <CityTrees />

      {/* ── Bâtiments génériques ── */}
      {CITY_BUILDINGS.map((b, i) => (
        <GenericBuilding key={`cb-${i}`} b={b} index={i} />
      ))}

      {/* ── NPCs ── */}
      <HomerNPC position={[-15, 0, 5]} />
      <HomerNPC position={[25, 0, -10]} isPolice />
      <HomerNPC position={[5, 0, 38]} />
      <HomerNPC position={[-35, 0, 18]} />

      {/* ── Lune ── */}
      <Moon />

      {/* ── Éclairage ambiant de la ville ── */}
      <ambientLight intensity={0.12} color="#1a1a2e" />
      <pointLight position={[0, 25, 0]} intensity={0.4} color="#4466aa" distance={120} />
    </group>
  )
})