/**
 * HotelRestaurant3D.tsx
 * Restaurant de l'hôtel — salle à manger, cuisine ouverte, bar
 * Style: gastronomique québécois moderne
 */

import {
  useRef, useMemo, useState,
  useCallback, memo,
} from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Vec3 = [number, number, number]

// ─────────────────────────────────────────────
// TABLE DE RESTAURANT
// ─────────────────────────────────────────────

interface RestaurantTableProps {
  position:  Vec3
  seats:     number
  isOccupied?: boolean
  zone:      'window' | 'center' | 'bar' | 'booth'
}

const RestaurantTable = memo(function RestaurantTable({
  position, seats, isOccupied = false, zone,
}: RestaurantTableProps) {
  const isRound = zone === 'window' || seats <= 2
  const tableW  = seats <= 2 ? 0.7 : seats <= 4 ? 1.1 : 1.6

  return (
    <group position={position}>
      {/* Table */}
      {isRound ? (
        <group>
          <mesh position={[0, 0.76, 0]} castShadow>
            <cylinderGeometry args={[tableW / 2, tableW / 2, 0.04, 16]} />
            <meshStandardMaterial color="#f5f0e8" roughness={0.2} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.76, 8]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.04, 10]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ) : (
        <group>
          <mesh position={[0, 0.76, 0]} castShadow>
            <boxGeometry args={[tableW, 0.04, 0.85]} />
            <meshStandardMaterial color="#2a1a0a" roughness={0.35} metalness={0.1} />
          </mesh>
          {[[-tableW / 2 + 0.08, 0.38, -0.35], [tableW / 2 - 0.08, 0.38, -0.35],
            [-tableW / 2 + 0.08, 0.38,  0.35], [tableW / 2 - 0.08, 0.38,  0.35]].map(([px, py, pz], i) => (
            <mesh key={i} position={[px, py, pz]}>
              <cylinderGeometry args={[0.025, 0.025, 0.76, 6]} />
              <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      )}

      {/* Nappe blanche */}
      <mesh position={[0, 0.78, 0]}>
        {isRound
          ? <cylinderGeometry args={[tableW / 2 - 0.01, tableW / 2 - 0.01, 0.01, 16]} />
          : <boxGeometry args={[tableW - 0.02, 0.01, 0.83]} />
        }
        <meshStandardMaterial color="#faf8f5" roughness={0.9} />
      </mesh>

      {/* Setting: assiettes, couverts, verres */}
      {Array.from({ length: Math.min(seats, 4) }).map((_, i) => {
        const angle = isRound ? (i / Math.min(seats, 4)) * Math.PI * 2 : 0
        const sx = isRound ? Math.cos(angle) * (tableW / 2 - 0.12) : (i < 2 ? -0.25 : 0.25)
        const sz = isRound ? Math.sin(angle) * (tableW / 2 - 0.12) : (i % 2 === 0 ? -0.28 : 0.28)

        return (
          <group key={i} position={[sx, 0.79, sz]}>
            {/* Assiette */}
            <mesh>
              <cylinderGeometry args={[0.12, 0.12, 0.01, 14]} />
              <meshStandardMaterial color="#f8f6f0" roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Verre */}
            <mesh position={[0.15, 0.06, 0]}>
              <cylinderGeometry args={[0.03, 0.04, 0.13, 8]} />
              <meshPhysicalMaterial color="#88aacc" transmission={0.8} thickness={0.02} roughness={0.05} transparent opacity={0.6} />
            </mesh>
            {/* Couvert */}
            <mesh position={[-0.17, 0.005, 0]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[0.22, 0.005, 0.02]} />
              <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )
      })}

      {/* Bougie centre */}
      <group position={[0, 0.8, 0]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 0.1, 8]} />
          <meshStandardMaterial color="#f5f0d8" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#ff8800" emissive="#ff6600" emissiveIntensity={1.5} />
        </mesh>
        <pointLight position={[0, 0.12, 0]} intensity={0.4} color="#ff8844" distance={1.5} decay={2} />
      </group>

      {/* Chaises */}
      {Array.from({ length: Math.min(seats, 4) }).map((_, i) => {
        const angle = isRound
          ? (i / Math.min(seats, 4)) * Math.PI * 2
          : (i < 2 ? Math.PI : 0)
        const cx = isRound ? Math.cos(angle) * (tableW / 2 + 0.42) : (i < 2 ? -tableW / 2 - 0.35 : tableW / 2 + 0.35)
        const cz = isRound ? Math.sin(angle) * (tableW / 2 + 0.42) : (i % 2 === 0 ? -0.28 : 0.28)
        const rot = isRound ? angle + Math.PI : (i < 2 ? 0 : Math.PI)

        return (
          <group key={i} position={[cx, 0, cz]} rotation={[0, rot, 0]}>
            <mesh position={[0, 0.25, 0]} castShadow>
              <boxGeometry args={[0.48, 0.06, 0.48]} />
              <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.52, -0.22]} castShadow>
              <boxGeometry args={[0.48, 0.48, 0.06]} />
              <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
            </mesh>
            {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([lx, lz], j) => (
              <mesh key={j} position={[lx, 0.12, lz]}>
                <cylinderGeometry args={[0.018, 0.018, 0.25, 6]} />
                <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
              </mesh>
            ))}
            {/* Coussin */}
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.44, 0.06, 0.44]} />
              <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
            </mesh>
          </group>
        )
      })}

      {/* Indicateur occupé */}
      {isOccupied && (
        <pointLight position={[0, 0.9, 0]} intensity={0.1} color="#ffaa44" distance={1.5} decay={2} />
      )}
    </group>
  )
})

// ─────────────────────────────────────────────
// BAR
// ─────────────────────────────────────────────

const RestaurantBar = memo(function RestaurantBar({ position }: { position: Vec3 }) {
  const bottleRefs = useRef<THREE.Mesh[]>([])

  useFrame((state) => {
    bottleRefs.current.forEach((m, i) => {
      if (m) {
        const mat = m.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.1 + Math.sin(state.clock.elapsedTime * 0.5 + i * 0.8) * 0.05
      }
    })
  })

  const bottles = useMemo(() => [
    { color: '#228822', emissive: '#004400', h: 0.32, r: 0.03 },
    { color: '#cc4422', emissive: '#440000', h: 0.28, r: 0.028 },
    { color: '#f5e642', emissive: '#443300', h: 0.3, r: 0.025 },
    { color: '#2244cc', emissive: '#000044', h: 0.35, r: 0.032 },
    { color: '#884488', emissive: '#220022', h: 0.29, r: 0.027 },
    { color: '#cc8822', emissive: '#442200', h: 0.31, r: 0.03 },
    { color: '#228888', emissive: '#002244', h: 0.28, r: 0.026 },
    { color: '#cc2244', emissive: '#440011', h: 0.33, r: 0.031 },
  ], [])

  return (
    <group position={position}>
      {/* Plan de bar */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[5, 0.08, 0.8]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Bord bar (inox) */}
      <mesh position={[0, 1.1, 0.4]}>
        <boxGeometry args={[5, 0.04, 0.04]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Corps bar */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[5, 1.04, 0.78]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Panneau bois face avant */}
      <mesh position={[0, 0.52, 0.4]}>
        <boxGeometry args={[5, 1.0, 0.02]} />
        <meshStandardMaterial color="#5a3010" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Étagères bouteilles arrière */}
      {[0.55, 0.9, 1.25].map((y, i) => (
        <mesh key={i} position={[0, y, -0.3]}>
          <boxGeometry args={[5, 0.02, 0.25]} />
          <meshStandardMaterial color="#3a2010" roughness={0.5} metalness={0.1} />
        </mesh>
      ))}

      {/* Bouteilles */}
      {bottles.map((b, i) => (
        <mesh
          key={i}
          ref={el => { if (el) bottleRefs.current[i] = el }}
          position={[-2 + i * 0.58, 0.7 + (i % 3) * 0.38, -0.3]}
        >
          <cylinderGeometry args={[b.r, b.r * 1.1, b.h, 10]} />
          <meshStandardMaterial color={b.color} emissive={b.emissive} emissiveIntensity={0.1} roughness={0.2} metalness={0.1} />
        </mesh>
      ))}

      {/* Miroir derrière bar */}
      <mesh position={[0, 1.2, -0.42]}>
        <boxGeometry args={[4.8, 1.4, 0.02]} />
        <meshStandardMaterial color="#aaddee" metalness={0.95} roughness={0.02} />
      </mesh>

      {/* Éclairage LED sous étagères */}
      {[0.55, 0.9, 1.25].map((y, i) => (
        <pointLight key={i} position={[0, y + 0.05, -0.2]} intensity={0.3} color="#fff8d0" distance={3} decay={2} />
      ))}

      {/* Tabourets de bar */}
      {[-2, -1, 0, 1, 2].map((x, i) => (
        <group key={i} position={[x, 0, 0.8]}>
          {/* Assise */}
          <mesh position={[0, 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.06, 12]} />
            <meshStandardMaterial color="#1a1a2a" roughness={0.8} />
          </mesh>
          {/* Coussin */}
          <mesh position={[0, 0.76, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.04, 12]} />
            <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
          </mesh>
          {/* Piston */}
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.72, 6]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Base */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.04, 12]} />
            <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Repose-pied anneau */}
          <mesh position={[0, 0.28, 0]}>
            <torusGeometry args={[0.15, 0.015, 6, 16]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Verres sur le bar */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 1.1, 0.1]}>
          <cylinderGeometry args={[0.04, 0.05, 0.15, 10]} />
          <meshPhysicalMaterial color="#88aacc" transmission={0.85} thickness={0.02} roughness={0.05} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Tireuse à bière */}
      <group position={[2.2, 1.06, 0.05]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.05, 0.35, 8]} />
          <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.2, 0.03]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 6]} />
          <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.25, 0.08]}>
          <boxGeometry args={[0.06, 0.04, 0.06]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
})

// ─────────────────────────────────────────────
// OPEN KITCHEN
// ─────────────────────────────────────────────

const OpenKitchen = memo(function OpenKitchen({ position }: { position: Vec3 }) {
  const flameRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (flameRef.current) {
      const mat = flameRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 8) * 0.5
      flameRef.current.scale.y = 0.8 + Math.sin(state.clock.elapsedTime * 12) * 0.2
    }
  })

  return (
    <group position={position}>
      {/* Passe-plat comptoir */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[6, 0.08, 0.9]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[6, 0.96, 0.88]} />
        <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Hotte aspirante (inox) */}
      <mesh position={[0, 2.3, -0.5]}>
        <boxGeometry args={[4, 0.5, 1.2]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Plaques de cuisson */}
      <mesh position={[-1, 0.98, -0.3]}>
        <boxGeometry args={[1.5, 0.03, 0.8]} />
        <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.8} />
      </mesh>
      {[[-1.4, -0.1], [-0.8, -0.1], [-1.4, 0.1], [-0.8, 0.1]].map(([bx, bz], i) => (
        <mesh key={i} position={[bx, 1.0, -0.3 + bz]}>
          <cylinderGeometry args={[0.12, 0.12, 0.01, 10]} />
          <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}

      {/* Flammes */}
      <mesh ref={flameRef} position={[-1.4, 1.06, -0.4]}>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.5} transparent opacity={0.8} />
      </mesh>
      <pointLight position={[-1.4, 1.1, -0.4]} intensity={0.5} color="#ff8844" distance={1.5} decay={2} />

      {/* Four */}
      <mesh position={[1.2, 0.55, -0.3]} castShadow>
        <boxGeometry args={[0.7, 0.65, 0.7]} />
        <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[1.2, 0.55, -0.3 + 0.352]}>
        <boxGeometry args={[0.68, 0.63, 0.02]} />
        <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[1.2, 0.68, -0.3 + 0.36]}>
        <boxGeometry args={[0.3, 0.02, 0.04]} />
        <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Ustensiles suspendus */}
      <mesh position={[0, 1.8, -0.2]}>
        <cylinderGeometry args={[0.01, 0.01, 5, 4]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
      </mesh>
      {[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((x, i) => (
        <group key={i} position={[x, 1.75, -0.2]}>
          <mesh>
            <cylinderGeometry args={[0.005, 0.005, 0.15, 4]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.02, 0.015, 0.2, 6]} />
            <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Éclairage cuisine */}
      <pointLight position={[0, 2.0, -0.3]} intensity={1.5} color="#ffffff" distance={6} decay={2} />
    </group>
  )
})

// ─────────────────────────────────────────────
// WINE CELLAR DISPLAY
// ─────────────────────────────────────────────

const WineCellarDisplay = memo(function WineCellarDisplay({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Structure cave */}
      <mesh castShadow>
        <boxGeometry args={[2.5, 2.2, 0.5]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Grille avant (verre) */}
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[2.48, 2.18, 0.02]} />
        <meshPhysicalMaterial color="#88aacc" transmission={0.6} thickness={0.02} roughness={0.05} transparent opacity={0.5} />
      </mesh>

      {/* Casiers */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => (
          <group key={`${row}-${col}`} position={[-1.05 + col * 0.3, -0.8 + row * 0.38, 0.1]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.28, 8]} />
              <meshStandardMaterial
                color={`hsl(${(row * 8 + col) * 13 % 30 + 0}, 50%, ${20 + (row + col) % 3 * 5}%)`}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
          </group>
        ))
      )}

      {/* Éclairage */}
      <pointLight position={[0, 0, 0.3]} intensity={0.3} color="#fff8d0" distance={2} decay={2} />

      {/* Étiquette */}
      <mesh position={[0, 1.15, 0.27]}>
        <boxGeometry args={[1.2, 0.08, 0.01]} />
        <meshStandardMaterial color="#c8a84b" emissive="#c8a84b" emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// RESTAURANT ROOT
// ─────────────────────────────────────────────

interface HotelRestaurant3DProps {
  position?: Vec3
  timeOfDay?: 'breakfast' | 'lunch' | 'dinner'
}

export const HotelRestaurant3D = memo(function HotelRestaurant3D({
  position = [0, 0, 0],
  timeOfDay = 'dinner',
}: HotelRestaurant3DProps) {
  const tableLayout = useMemo(() => [
    // Tables fenêtre gauche (2 pers)
    { pos: [-7, 0, -4] as Vec3, seats: 2, zone: 'window' as const, occupied: false },
    { pos: [-7, 0, -1] as Vec3, seats: 2, zone: 'window' as const, occupied: true  },
    { pos: [-7, 0,  2] as Vec3, seats: 2, zone: 'window' as const, occupied: false },
    { pos: [-7, 0,  5] as Vec3, seats: 2, zone: 'window' as const, occupied: true  },
    // Tables fenêtre droite
    { pos: [7, 0, -4] as Vec3,  seats: 2, zone: 'window' as const, occupied: true  },
    { pos: [7, 0, -1] as Vec3,  seats: 2, zone: 'window' as const, occupied: false },
    { pos: [7, 0,  2] as Vec3,  seats: 2, zone: 'window' as const, occupied: true  },
    { pos: [7, 0,  5] as Vec3,  seats: 2, zone: 'window' as const, occupied: false },
    // Tables centre (4 pers)
    { pos: [-3.5, 0, -4] as Vec3, seats: 4, zone: 'center' as const, occupied: true  },
    { pos: [0,    0, -4] as Vec3, seats: 4, zone: 'center' as const, occupied: false },
    { pos: [3.5,  0, -4] as Vec3, seats: 4, zone: 'center' as const, occupied: true  },
    { pos: [-3.5, 0,  1] as Vec3, seats: 4, zone: 'center' as const, occupied: false },
    { pos: [0,    0,  1] as Vec3, seats: 4, zone: 'center' as const, occupied: true  },
    { pos: [3.5,  0,  1] as Vec3, seats: 4, zone: 'center' as const, occupied: true  },
  ], [])

  // Ambiance selon moment
  const lightColor   = timeOfDay === 'dinner' ? '#ff8844' : '#fff8d0'
  const lightIntensity = timeOfDay === 'dinner' ? 0.6 : 1.2

  return (
    <group position={position}>
      {/* ── STRUCTURE ── */}

      {/* Sol — parquet chêne */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color="#7a4a1a" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Lignes parquet */}
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-9 + i * 0.45, 0.002, 0]}>
          <planeGeometry args={[0.02, 20]} />
          <meshStandardMaterial color="#5a3a0a" roughness={0.8} />
        </mesh>
      ))}

      {/* Plafond */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.5, 0]}>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color="#f8f5f0" roughness={0.9} />
      </mesh>

      {/* Murs */}
      <mesh position={[0, 1.75, -9.95]}>
        <boxGeometry args={[18, 3.5, 0.1]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.85} />
      </mesh>

      {/* Fenêtres panoramiques (côtés) */}
      {[-1.5, 1.5, 4.5].map((z, i) => (
        <group key={`fw-l-${i}`}>
          {/* Fenêtre gauche */}
          <mesh position={[-8.95, 1.6, z]}>
            <boxGeometry args={[0.08, 2.2, 2.5]} />
            <meshPhysicalMaterial color="#a8d8ff" transmission={0.7} thickness={0.08} roughness={0.05} transparent opacity={0.6} />
          </mesh>
          {/* Fenêtre droite */}
          <mesh position={[8.95, 1.6, z]}>
            <boxGeometry args={[0.08, 2.2, 2.5]} />
            <meshPhysicalMaterial color="#a8d8ff" transmission={0.7} thickness={0.08} roughness={0.05} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* ── TABLES ── */}
      {tableLayout.map((t, i) => (
        <RestaurantTable
          key={i}
          position={t.pos}
          seats={t.seats}
          zone={t.zone}
          isOccupied={t.occupied}
        />
      ))}

      {/* ── BAR ── */}
      <RestaurantBar position={[0, 0, 8]} />

      {/* ── CUISINE OUVERTE ── */}
      <OpenKitchen position={[0, 0, -8.5]} />

      {/* ── CAVE À VINS ── */}
      <WineCellarDisplay position={[-7.5, 1.1, 8]} />

      {/* ── DÉCORATION ── */}

      {/* Cloisons séparatrices */}
      {[-5, 5].map((x, i) => (
        <group key={i} position={[x, 0, 3]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <boxGeometry args={[0.08, 3.0, 0.08]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 1.5, 1.5]} castShadow>
            <boxGeometry args={[0.08, 3.0, 0.08]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 2.8, 0.75]}>
            <boxGeometry args={[0.04, 0.04, 3.06]} />
            <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Grandes plantes */}
      {[[-6, 0, 6], [6, 0, 6], [-6, 0, -6], [6, 0, -6]].map(([px, py, pz], i) => (
        <group key={i} position={[px, py, pz]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.25, 0.5, 10]} />
            <meshStandardMaterial color="#8b6914" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.5, 10, 10]} />
            <meshStandardMaterial color="#2a6a2a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ── ÉCLAIRAGE ── */}

      {/* Pendants lumineux */}
      {[-4, 0, 4].map((x, i) =>
        [-4, 0, 4].map((z, j) => (
          <group key={`${i}-${j}`} position={[x, 3.3, z]}>
            <mesh>
              <cylinderGeometry args={[0.01, 0.01, 0.4, 4]} />
              <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.25, 0]}>
              <sphereGeometry args={[0.08, 10, 10]} />
              <meshStandardMaterial color="#ffffff" emissive="#fff8d0" emissiveIntensity={0.8} />
            </mesh>
            <pointLight
              position={[0, -0.35, 0]}
              intensity={lightIntensity}
              color={lightColor}
              distance={5}
              decay={2}
            />
          </group>
        ))
      )}

      <ambientLight intensity={timeOfDay === 'dinner' ? 0.2 : 0.5} color={lightColor} />
    </group>
  )
})