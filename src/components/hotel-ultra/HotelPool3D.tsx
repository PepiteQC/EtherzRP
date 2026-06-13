/**
 * HotelPool3D.tsx
 * Piscine intérieure + spa + fitness — ultra-détaillé
 */

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Vec3 = [number, number, number]

// ─────────────────────────────────────────────
// WATER SHADER SIMULÉ
// ─────────────────────────────────────────────

const AnimatedPool = memo(function AnimatedPool({
  width, depth, position,
}: {
  width: number; depth: number; position: Vec3
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1a6088'),
    transmission: 0.4,
    thickness: 2.5,
    roughness: 0.06,
    metalness: 0,
    ior: 1.33,
    transparent: true,
    opacity: 0.88,
  }), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    mat.color.setRGB(
      0.08 + Math.sin(t * 0.4) * 0.02,
      0.36 + Math.sin(t * 0.25 + 1) * 0.04,
      0.53 + Math.cos(t * 0.3) * 0.05,
    )
  })

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth, 20, 20]} />
      <primitive object={mat} />
    </mesh>
  )
})

// ─────────────────────────────────────────────
// LOUNGE CHAIR POOL
// ─────────────────────────────────────────────

const PoolChair = memo(function PoolChair({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Châssis aluminium */}
      {[[-0.32, 0], [0.32, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.18, 0]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.04, 0.05, 1.85]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Lattes assise */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 0.22, -0.6 + i * 0.22]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.6, 0.025, 0.18]} />
          <meshStandardMaterial color="#f5e6c8" roughness={0.6} />
        </mesh>
      ))}

      {/* Dossier inclinable */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 0.42, -0.62 + i * 0.18]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[0.6, 0.025, 0.15]} />
          <meshStandardMaterial color="#f5e6c8" roughness={0.6} />
        </mesh>
      ))}

      {/* Roulettes */}
      {[[-0.32, -0.88], [0.32, -0.88]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.04, z]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#888888" roughness={0.6} />
        </mesh>
      ))}

      {/* Serviette */}
      <mesh position={[0, 0.24, 0.1]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.52, 0.02, 0.85]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// SAUNA CABIN
// ─────────────────────────────────────────────

const SaunaCabin = memo(function SaunaCabin({ position }: { position: Vec3 }) {
  const rockRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (rockRef.current) {
      const mat = rockRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.15
    }
  })

  return (
    <group position={position}>
      {/* Parois bois */}
      <mesh castShadow>
        <boxGeometry args={[3.5, 2.4, 3.5]} />
        <meshStandardMaterial color="#6b4423" roughness={0.75} metalness={0.05} />
      </mesh>
      {/* Intérieur */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.3, 2.3, 3.3]} />
        <meshStandardMaterial color="#5a3818" roughness={0.85} />
      </mesh>

      {/* Porte vitrée */}
      <mesh position={[0, 0, 1.76]}>
        <boxGeometry args={[1.0, 2.1, 0.05]} />
        <meshPhysicalMaterial color="#88bbcc" transmission={0.5} thickness={0.05} roughness={0.1} transparent opacity={0.6} />
      </mesh>
      {/* Poignée porte */}
      <mesh position={[0.42, 0, 1.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
        <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bancs (2 niveaux) */}
      {[0.45, 0.9].map((y, i) => (
        <mesh key={i} position={[0, y, -1.4]} castShadow>
          <boxGeometry args={[3.0, 0.06, 0.7]} />
          <meshStandardMaterial color="#7a5230" roughness={0.7} />
        </mesh>
      ))}

      {/* Poêle sauna */}
      <group position={[-1.2, 0.1, -1.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.7, 0.5]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Pierres */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={i}
            ref={i === 0 ? rockRef : undefined}
            position={[
              (Math.random() - 0.5) * 0.3,
              0.37 + i * 0.03,
              (Math.random() - 0.5) * 0.3,
            ]}
          >
            <sphereGeometry args={[0.05 + Math.random() * 0.03, 5, 5]} />
            <meshStandardMaterial
              color="#444444"
              roughness={0.9}
              emissive="#221100"
              emissiveIntensity={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Seau & louche */}
      <mesh position={[-1.3, 0.55, 0.8]}>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 10]} />
        <meshStandardMaterial color="#7a5230" roughness={0.8} />
      </mesh>

      {/* Chaleur lumière */}
      <pointLight position={[-1.2, 0.5, -1.2]} intensity={0.6} color="#ff6622" distance={3} decay={2} />
      <pointLight position={[0, 1.5, 0]} intensity={0.2} color="#ff8844" distance={4} decay={2} />
    </group>
  )
})

// ─────────────────────────────────────────────
// FITNESS AREA
// ─────────────────────────────────────────────

const FitnessArea = memo(function FitnessArea({ position }: { position: Vec3 }) {
  const treadRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (treadRef.current) {
      treadRef.current.rotation.x = state.clock.elapsedTime * 3
    }
  })

  return (
    <group position={position}>
      {/* Sol fitness — caoutchouc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#1a1a2a" roughness={0.9} />
      </mesh>

      {/* Tapis roulants */}
      {[-2.5, 0, 2.5].map((x, i) => (
        <group key={i} position={[x, 0, -1.5]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.18, 1.8]} />
            <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Tapis animé */}
          <mesh ref={i === 0 ? treadRef : undefined} position={[0, 0.1, 0]}>
            <boxGeometry args={[0.75, 0.02, 1.6]} />
            <meshStandardMaterial color="#333333" roughness={0.8} />
          </mesh>
          {/* Handlebars */}
          <mesh position={[0, 0.8, -0.7]}>
            <boxGeometry args={[0.7, 0.04, 0.04]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.85, -0.7]}>
            <boxGeometry args={[0.04, 0.08, 0.04]} />
            <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Screen */}
          <mesh position={[0, 1.0, -0.7]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.3, 0.2, 0.02]} />
            <meshStandardMaterial color="#003366" emissive="#0044aa" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}

      {/* Haltères */}
      <group position={[3, 0.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.3, 0.35]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.5} />
        </mesh>
        {[5, 10, 15, 20, 25, 30].map((w, i) => (
          <group key={i} position={[-0.7 + (i % 3) * 0.7, 0.22, i < 3 ? -0.05 : 0.05]}>
            {/* Barre */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.015, 0.25, 6]} />
              <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Disques */}
            {[-0.1, 0.1].map((dx, j) => (
              <mesh key={j} position={[dx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.05 + w * 0.003, 0.05 + w * 0.003, 0.04, 10]} />
                <meshStandardMaterial color="#cc4422" roughness={0.6} metalness={0.2} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Miroirs mur */}
      <mesh position={[0, 1.5, -2.9]}>
        <boxGeometry args={[7.5, 3.0, 0.02]} />
        <meshStandardMaterial color="#aaddee" metalness={0.95} roughness={0.02} />
      </mesh>

      {/* Éclairage fitness */}
      {[-3, 0, 3].map((x, i) => (
        <pointLight key={i} position={[x, 3, 0]} intensity={1.5} color="#ffffff" distance={8} decay={2} />
      ))}
    </group>
  )
})

// ─────────────────────────────────────────────
// POOL 3D ROOT
// ─────────────────────────────────────────────

interface HotelPool3DProps {
  position?: Vec3
}

export const HotelPool3D = memo(function HotelPool3D({
  position = [0, 0, 0],
}: HotelPool3DProps) {
  return (
    <group position={position}>
      {/* ── SOL CARRELAGE ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 28]} />
        <meshStandardMaterial color="#e0ddd8" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Lignes carrelage */}
      {Array.from({ length: 15 }).map((_, i) =>
        Array.from({ length: 14 }).map((_, j) => (
          <mesh key={`${i}-${j}`} rotation={[-Math.PI / 2, 0, 0]} position={[-14 + i * 2, 0.001, -13 + j * 2]}>
            <planeGeometry args={[1.98, 1.98]} />
            <meshStandardMaterial color={`hsl(40, 10%, ${88 + ((i + j) % 2) * 4}%)`} roughness={0.4} />
          </mesh>
        ))
      )}

      {/* ── PISCINE PRINCIPALE ── */}

      {/* Structure béton */}
      <mesh position={[0, -0.75, -2]}>
        <boxGeometry args={[14, 1.5, 10]} />
        <meshStandardMaterial color="#d8d8e8" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Carreaux bleus intérieur */}
      <mesh position={[0, -0.72, -2]}>
        <boxGeometry args={[13.6, 1.46, 9.6]} />
        <meshStandardMaterial color="#3a88bb" roughness={0.3} metalness={0.15} />
      </mesh>

      {/* Eau */}
      <AnimatedPool width={13.4} depth={9.4} position={[0, 0.02, -2]} />

      {/* Lignes de couloir */}
      {[-4, -2, 0, 2, 4].map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.0, -2]}>
          <planeGeometry args={[0.06, 9.4]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#ff6600' : '#0066ff'} roughness={0.8} />
        </mesh>
      ))}

      {/* Bordures piscine */}
      {[
        [0, 0.06, 2.8, 14.4, 0.12, 0.3],
        [0, 0.06, -6.8, 14.4, 0.12, 0.3],
        [7.2, 0.06, -2, 0.3, 0.12, 9.8],
        [-7.2, 0.06, -2, 0.3, 0.12, 9.8],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#f0eee8" roughness={0.4} metalness={0.1} />
        </mesh>
      ))}

      {/* Échelles */}
      {[[-6.8, 0, 2.2], [6.8, 0, 2.2]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          {[-0.12, 0.12].map((ox, j) => (
            <mesh key={j} position={[ox, -0.5, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          {[0, -0.3, -0.6, -0.9].map((oy, j) => (
            <mesh key={j} position={[0, oy, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.015, 0.28, 6]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── JACUZZI ── */}
      <group position={[10, 0, -2]}>
        <mesh>
          <cylinderGeometry args={[2.2, 2.4, 0.85, 18]} />
          <meshStandardMaterial color="#e8e4d8" roughness={0.4} metalness={0.15} />
        </mesh>
        <AnimatedPool width={4} depth={4} position={[0, 0.43, 0]} />
        {/* Jets */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[
            Math.cos(i * Math.PI / 4) * 1.8,
            0.2,
            Math.sin(i * Math.PI / 4) * 1.8,
          ]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        ))}
        <pointLight position={[0, -0.2, 0]} intensity={0.5} color="#44aaff" distance={4} decay={2} />
      </group>

      {/* ── SAUNA ── */}
      <SaunaCabin position={[-10, 1.2, 8]} />

      {/* ── FITNESS ── */}
      <FitnessArea position={[8, 0, 9]} />

      {/* ── CHAISES LONGUES ── */}
      {[
        [0, 0.14, 5], [2.2, 0.14, 5], [4.4, 0.14, 5],
        [-2.2, 0.14, 5], [-4.4, 0.14, 5],
        [0, 0.14, -8.5], [2.2, 0.14, -8.5], [-2.2, 0.14, -8.5],
      ].map(([x, y, z], i) => (
        <PoolChair
          key={i}
          position={[x, y, z]}
          rotation={z > 0 ? 0 : Math.PI}
        />
      ))}

      {/* ── ÉCLAIRAGE PISCINE ── */}
      <ambientLight intensity={0.5} color="#88ccff" />
      {[-6, 0, 6].map((x, i) => (
        <pointLight key={i}
          position={[x, 5, 0]}
          intensity={2}
          color="#ffffff"
          distance={16}
          decay={2}
          castShadow
          shadow-mapSize={[512, 512]}
        />
      ))}
      {/* Lumière sous l'eau */}
      {[-4, 0, 4].map((x, i) => (
        <pointLight key={i} position={[x, -0.3, -2]} intensity={0.6} color="#44aaff" distance={6} decay={2} />
      ))}

      {/* ── MURS / PLAFOND ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.5, 0]}>
        <planeGeometry args={[30, 28]} />
        <meshStandardMaterial color="#f0f0f8" roughness={0.8} />
      </mesh>
      {/* Puits de lumière (skylights) */}
      {[-8, 0, 8].map((x, i) => (
        <mesh key={i} position={[x, 5.4, -2]}>
          <boxGeometry args={[3, 0.1, 3]} />
          <meshStandardMaterial color="#aaddff" emissive="#88ccff" emissiveIntensity={0.3} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
})