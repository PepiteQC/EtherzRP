import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { HotelBuilding } from '../hotel/HotelBuilding'
import { QuebecRoad } from '../roads/QuebecRoad'

// ════════════════════════════════════════════════════════════════
// WORLD BEEF — connective layer
// Branche les composants 3D secondaires dans le monde principal.
// Objectif: aucun mini-jeu à côté; seulement du beef visuel utile au monde RP.
// ════════════════════════════════════════════════════════════════

const CITY_Z = 900

type Vec3 = [number, number, number]

function seeded(seed: number) {
  const x = Math.sin(seed * 91.37 + 17.13) * 43758.5453
  return x - Math.floor(x)
}

const NeonBillboard = memo(function NeonBillboard({
  position,
  rotation = [0, 0, 0],
  title,
  subtitle,
  color = '#58e6ff',
}: {
  position: Vec3
  rotation?: Vec3
  title: string
  subtitle: string
  color?: string
}) {
  const glow = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!glow.current) return
    const mat = glow.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.55 + Math.sin(state.clock.elapsedTime * 2.0 + position[0]) * 0.18
  })

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[0.18, 5, 0.18]} />
        <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 5.2, 0]} castShadow>
        <boxGeometry args={[7.5, 2.5, 0.24]} />
        <meshStandardMaterial color="#050816" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh ref={glow} position={[0, 5.2, 0.14]}>
        <boxGeometry args={[7.15, 2.15, 0.035]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} roughness={0.18} />
      </mesh>
      <Text position={[0, 5.48, 0.22]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
        {title}
      </Text>
      <Text position={[0, 4.86, 0.22]} fontSize={0.18} color="#07111f" anchorX="center" anchorY="middle">
        {subtitle}
      </Text>
      <pointLight position={[0, 5.2, 1.2]} color={color} intensity={1.8} distance={20} decay={2} />
    </group>
  )
})

const EtherCoreTower = memo(function EtherCoreTower({ position }: { position: Vec3 }) {
  const ringRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.45
    if (coreRef.current) {
      coreRef.current.position.y = 18 + Math.sin(state.clock.elapsedTime * 1.4) * 0.28
      const mat = coreRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.1 + Math.sin(state.clock.elapsedTime * 2.7) * 0.35
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.6, 6.5, 24, 8]} />
        <meshStandardMaterial color="#101827" metalness={0.25} roughness={0.55} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[0, 3 + i * 3.2, 4.64]}>
          <boxGeometry args={[6.8, 0.12, 0.08]} />
          <meshStandardMaterial color="#58e6ff" emissive="#58e6ff" emissiveIntensity={0.35 + i * 0.03} />
        </mesh>
      ))}
      <group ref={ringRef} position={[0, 24.8, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[5.2, 0.08, 8, 80]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.9} />
        </mesh>
        <mesh rotation={[Math.PI / 2, Math.PI / 2, 0]}>
          <torusGeometry args={[3.8, 0.06, 8, 80]} />
          <meshStandardMaterial color="#58e6ff" emissive="#58e6ff" emissiveIntensity={0.85} />
        </mesh>
      </group>
      <mesh ref={coreRef} position={[0, 18, 0]}>
        <octahedronGeometry args={[1.35, 0]} />
        <meshStandardMaterial color="#58e6ff" emissive="#58e6ff" emissiveIntensity={1.2} metalness={0.1} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 21, 0]} color="#58e6ff" intensity={2.6} distance={65} />
      <Text position={[0, 9.5, 4.9]} fontSize={0.5} color="#dffbff" anchorX="center">
        ETHERCORE
      </Text>
    </group>
  )
})

const ConstructionCrane = memo(function ConstructionCrane({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  const hookRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (hookRef.current) hookRef.current.position.x = 3 + Math.sin(state.clock.elapsedTime * 0.55) * 3.8
  })

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 8, 0]} castShadow>
        <boxGeometry args={[0.42, 16, 0.42]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.45} metalness={0.25} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, 2 + i * 2.3, 0]} rotation={[0, 0, i % 2 ? 0.75 : -0.75]}>
          <boxGeometry args={[0.12, 2.6, 0.12]} />
          <meshStandardMaterial color="#d97706" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[5, 16.5, 0]} castShadow>
        <boxGeometry args={[14, 0.24, 0.32]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.35} metalness={0.3} />
      </mesh>
      <mesh position={[-3.8, 16.5, 0]} castShadow>
        <boxGeometry args={[3, 0.32, 0.45]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.6} metalness={0.2} />
      </mesh>
      <group ref={hookRef} position={[5, 16.1, 0]}>
        <mesh position={[0, -1.4, 0]}>
          <boxGeometry args={[0.035, 2.8, 0.035]} />
          <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -2.95, 0]}>
          <torusGeometry args={[0.22, 0.035, 6, 18]} />
          <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )
})

const PatrolDrone = memo(function PatrolDrone({ seed: droneSeed }: { seed: number }) {
  const ref = useRef<THREE.Group>(null)
  const base = useMemo(() => ({
    x: -35 + seeded(droneSeed) * 70,
    y: 10 + seeded(droneSeed + 4) * 9,
    z: -60 + seeded(droneSeed + 9) * 120,
    phase: seeded(droneSeed + 99) * Math.PI * 2,
  }), [droneSeed])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * 0.35 + base.phase
    ref.current.position.set(base.x + Math.sin(t) * 7, base.y + Math.sin(t * 1.7) * 0.7, base.z + Math.cos(t) * 8)
    ref.current.rotation.y = t + Math.PI / 2
  })

  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[0.75, 0.18, 0.45]} />
        <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.28} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.22, 0.02, 6, 24]} />
          <meshStandardMaterial color="#58e6ff" emissive="#58e6ff" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <pointLight position={[0, -0.2, 0]} color="#58e6ff" intensity={0.55} distance={6} />
    </group>
  )
})

const PowerConnectorLines = memo(function PowerConnectorLines() {
  const towers = useMemo<Vec3[]>(() => [
    [-55, 0, -120], [-58, 0, -40], [-54, 0, 40], [-52, 0, 120],
  ], [])

  return (
    <group>
      {towers.map((p, i) => (
        <group key={`tower-${i}`} position={p}>
          <mesh position={[0, 7, 0]}>
            <boxGeometry args={[0.26, 14, 0.26]} />
            <meshStandardMaterial color="#8792a2" metalness={0.5} roughness={0.45} />
          </mesh>
          <mesh position={[0, 12.5, 0]}>
            <boxGeometry args={[6, 0.16, 0.16]} />
            <meshStandardMaterial color="#8792a2" metalness={0.5} roughness={0.45} />
          </mesh>
          {[-2.5, 0, 2.5].map((x) => (
            <mesh key={x} position={[x, 12.3, 0]}>
              <sphereGeometry args={[0.14, 6, 6]} />
              <meshStandardMaterial color="#d1d5db" roughness={0.3} metalness={0.2} />
            </mesh>
          ))}
        </group>
      ))}
      {towers.slice(0, -1).map((a, i) => {
        const b = towers[i + 1]
        const mid: Vec3 = [(a[0] + b[0]) / 2, 12.15, (a[2] + b[2]) / 2]
        const dz = b[2] - a[2]
        return [-2.5, 0, 2.5].map((x) => (
          <mesh key={`line-${i}-${x}`} position={[mid[0] + x, mid[1], mid[2]]}>
            <boxGeometry args={[0.035, 0.035, Math.abs(dz)]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.35} roughness={0.4} />
          </mesh>
        ))
      })}
    </group>
  )
})


const CommunityPark = memo(function CommunityPark({ position }: { position: Vec3 }) {
  const treeRef = useRef<THREE.InstancedMesh>(null)
  const benchRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const treePositions = useMemo<Vec3[]>(() => [
    [-12, 0, -8], [-8, 0, 7], [-3, 0, -11], [4, 0, 9], [9, 0, -6], [13, 0, 5],
    [-15, 0, 2], [15, 0, -1], [-6, 0, 13], [7, 0, -13],
  ], [])

  const benchPositions = useMemo<Vec3[]>(() => [
    [-5, 0, 0], [5, 0, 0], [0, 0, -7], [0, 0, 7],
  ], [])

  useEffect(() => {
    if (treeRef.current) {
      treePositions.forEach((pos, i) => {
        dummy.position.set(pos[0], 1.15, pos[2])
        dummy.rotation.set(0, seeded(i + 80) * Math.PI * 2, 0)
        dummy.scale.setScalar(0.85 + seeded(i + 11) * 0.55)
        dummy.updateMatrix()
        treeRef.current!.setMatrixAt(i, dummy.matrix)
      })
      treeRef.current.instanceMatrix.needsUpdate = true
    }
    if (benchRef.current) {
      benchPositions.forEach((pos, i) => {
        dummy.position.set(pos[0], 0.35, pos[2])
        dummy.rotation.set(0, i < 2 ? 0 : Math.PI / 2, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        benchRef.current!.setMatrixAt(i, dummy.matrix)
      })
      benchRef.current.instanceMatrix.needsUpdate = true
    }
  }, [benchPositions, dummy, treePositions])

  return (
    <group position={position} userData={{ type: 'community_park', performance: 'instanced' }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} receiveShadow>
        <circleGeometry args={[18, 32]} />
        <meshStandardMaterial color="#2f6b2f" roughness={0.92} />
      </mesh>

      {/* Sentiers croisés */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} receiveShadow>
        <boxGeometry args={[3.2, 20, 0.04]} />
        <meshStandardMaterial color="#9a8f7a" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.047, 0]} receiveShadow>
        <boxGeometry args={[3.2, 20, 0.04]} />
        <meshStandardMaterial color="#9a8f7a" roughness={0.85} />
      </mesh>

      {/* Fontaine centrale */}
      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.2, 2.5, 0.5, 24]} />
        <meshStandardMaterial color="#8b8f96" roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[1.85, 1.95, 0.16, 24]} />
        <meshStandardMaterial color="#2f82b7" roughness={0.2} metalness={0.35} />
      </mesh>
      <pointLight position={[0, 1.1, 0]} color="#7dd3fc" intensity={0.45} distance={8} />

      {/* Arbres optimisés: une instance = tronc+feuillage stylisé simple */}
      <instancedMesh ref={treeRef} args={[undefined as any, undefined as any, treePositions.length]} castShadow receiveShadow>
        <coneGeometry args={[0.9, 2.3, 7]} />
        <meshStandardMaterial color="#1f7a36" roughness={0.9} />
      </instancedMesh>
      {treePositions.map((pos, i) => (
        <mesh key={`trunk-${i}`} position={[pos[0], 0.55, pos[2]]} castShadow>
          <cylinderGeometry args={[0.12, 0.18, 1.1, 6]} />
          <meshStandardMaterial color="#5b3928" roughness={0.85} />
        </mesh>
      ))}

      <instancedMesh ref={benchRef} args={[undefined as any, undefined as any, benchPositions.length]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.22, 0.62]} />
        <meshStandardMaterial color="#6b4423" roughness={0.75} />
      </instancedMesh>

      <Text position={[0, 0.08, -18.8]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.1} color="#d9f99d" anchorX="center">
        PARC MUNICIPAL
      </Text>
    </group>
  )
})

const Cemetery = memo(function Cemetery({ position }: { position: Vec3 }) {
  const graveRef = useRef<THREE.InstancedMesh>(null)
  const crossRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const graves = useMemo<Vec3[]>(() => {
    const list: Vec3[] = []
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        list.push([-12 + col * 4 + (row % 2) * 0.35, 0, -8 + row * 3.8])
      }
    }
    return list
  }, [])

  useEffect(() => {
    if (graveRef.current) {
      graves.forEach((pos, i) => {
        dummy.position.set(pos[0], 0.48, pos[2])
        dummy.rotation.set(0, (seeded(i + 140) - 0.5) * 0.12, 0)
        dummy.scale.setScalar(0.85 + seeded(i + 15) * 0.25)
        dummy.updateMatrix()
        graveRef.current!.setMatrixAt(i, dummy.matrix)
      })
      graveRef.current.instanceMatrix.needsUpdate = true
    }
    if (crossRef.current) {
      graves.filter((_, i) => i % 4 === 0).forEach((pos, i) => {
        dummy.position.set(pos[0], 1.05, pos[2] - 0.08)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(0.85)
        dummy.updateMatrix()
        crossRef.current!.setMatrixAt(i, dummy.matrix)
      })
      crossRef.current.instanceMatrix.needsUpdate = true
    }
  }, [dummy, graves])

  return (
    <group position={position} userData={{ type: 'cemetery', performance: 'instanced', rpZone: true }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
        <planeGeometry args={[34, 28]} />
        <meshStandardMaterial color="#263326" roughness={0.96} />
      </mesh>

      {/* Clôture simple */}
      {[[-17, 0, 0, 0.18, 1.1, 28], [17, 0, 0, 0.18, 1.1, 28], [0, 0, -14, 34, 1.1, 0.18], [0, 0, 14, 34, 1.1, 0.18]].map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y + 0.55, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#1f2937" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* Tombes instanciées */}
      <instancedMesh ref={graveRef} args={[undefined as any, undefined as any, graves.length]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.95, 0.22]} />
        <meshStandardMaterial color="#737373" roughness={0.86} />
      </instancedMesh>

      {/* Croix instanciées */}
      <instancedMesh ref={crossRef} args={[undefined as any, undefined as any, Math.ceil(graves.length / 4)]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 1.2, 0.18]} />
        <meshStandardMaterial color="#8a8a8a" roughness={0.8} />
      </instancedMesh>
      {graves.filter((_, i) => i % 4 === 0).map((pos, i) => (
        <mesh key={`crossbar-${i}`} position={[pos[0], 1.25, pos[2] - 0.08]} castShadow>
          <boxGeometry args={[0.72, 0.14, 0.14]} />
          <meshStandardMaterial color="#8a8a8a" roughness={0.8} />
        </mesh>
      ))}

      {/* Mausolée / chapelle */}
      <group position={[0, 0, 10.2]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.8, 2.4, 4.2]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.72} />
        </mesh>
        <mesh position={[0, 2.75, 0]} castShadow>
          <coneGeometry args={[3.8, 1.6, 4]} />
          <meshStandardMaterial color="#18181b" roughness={0.68} />
        </mesh>
        <mesh position={[0, 1.05, -2.16]}>
          <boxGeometry args={[1.2, 1.9, 0.08]} />
          <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.35} />
        </mesh>
      </group>

      {/* Ambiance discrète */}
      <pointLight position={[0, 3.8, 10]} color="#a7f3d0" intensity={0.35} distance={18} />
      <Text position={[0, 0.08, -15.8]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.0} color="#cbd5e1" anchorX="center">
        CIMETIÈRE SAINT-ÉTHER
      </Text>
    </group>
  )
})

export default memo(function WorldBeef() {
  return (
    <group>
      {/* Connexion du composant route secondaire dans la ville principale */}
      <group position={[0, 0.045, CITY_Z]}>
        <QuebecRoad length={230} />
      </group>

      {/* Connexion du composant hôtel secondaire en district premium, sans remplacer la ville actuelle */}
      <group position={[0, 0, CITY_Z]}>
        <HotelBuilding position={[-72, 0, -28]} rotation={[0, Math.PI / 2.7, 0]} />
        <EtherCoreTower position={[70, 0, -8]} />
        <ConstructionCrane position={[38, 0, -58]} rotationY={-0.35} />
        <PowerConnectorLines />

        <NeonBillboard
          position={[-18, 0, -105]}
          rotation={[0, 0, 0]}
          title="ETHERWORLD CITY"
          subtitle="RP QUÉBEC · CONNECTÉ"
          color="#58e6ff"
        />
        <NeonBillboard
          position={[54, 0, 42]}
          rotation={[0, -Math.PI / 2.6, 0]}
          title="ADMIN CORE"
          subtitle="SÉCURITÉ · JOBS · ÉCONOMIE"
          color="#a855f7"
        />
        <NeonBillboard
          position={[-54, 0, 54]}
          rotation={[0, Math.PI / 2.5, 0]}
          title="HÔTEL ONLINE"
          subtitle="LOBBY · CHAMBRES · RP"
          color="#f59e0b"
        />

        {/* Zones RP sobres et utiles — performance optimized avec instances */}
        <CommunityPark position={[18, 0, 68]} />
        <Cemetery position={[-26, 0, 78]} />

        {Array.from({ length: 5 }).map((_, i) => <PatrolDrone key={i} seed={i + 1} />)}
      </group>
    </group>
  )
})
