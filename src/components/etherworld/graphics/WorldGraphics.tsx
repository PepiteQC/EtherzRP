import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/lib/etherworld/game-store'
import { PORTNEUF_ROADS } from '@/utils/roadNetwork'

type TimeValue = string | number

type TimePhase = 'night' | 'dawn' | 'day' | 'dusk'

function resolveTimePhase(time: TimeValue, explicitPhase?: string): TimePhase {
  if (explicitPhase === 'night' || explicitPhase === 'dawn' || explicitPhase === 'dusk') return explicitPhase
  if (typeof time === 'string') {
    if (time === 'night' || time === 'dawn' || time === 'dusk') return time
    return 'day'
  }
  if (time >= 21 || time < 5) return 'night'
  if (time >= 5 && time < 8) return 'dawn'
  if (time >= 18 && time < 21) return 'dusk'
  return 'day'
}

function phaseColors(phase: TimePhase) {
  switch (phase) {
    case 'night': return { lamp: '#ffcc66', glow: '#224d8a', reflector: '#f8fbff' }
    case 'dawn': return { lamp: '#ffd28a', glow: '#ff8855', reflector: '#fff4d6' }
    case 'dusk': return { lamp: '#ffb35a', glow: '#ff6633', reflector: '#fff0cf' }
    default: return { lamp: '#fff3bd', glow: '#9ed8ff', reflector: '#f7fbff' }
  }
}

function RouteStreetLights() {
  const timeOfDay = useStore(s => s.timeOfDay) as TimeValue
  const timePhase = useStore(s => s.timePhase)
  const phase = resolveTimePhase(timeOfDay, timePhase)
  const isLit = phase !== 'day'
  const colors = phaseColors(phase)

  const lights = useMemo(() => {
    const arr: Array<{ x: number; z: number; side: 1 | -1; cast: boolean }> = []
    for (let z = -860, i = 0; z <= 840; z += 85, i++) {
      arr.push({ x: 11.8, z, side: 1, cast: i % 7 === 0 })
      arr.push({ x: -11.8, z: z + 38, side: -1, cast: i % 8 === 0 })
    }
    return arr
  }, [])

  return (
    <group name="HDStreetLights">
      {lights.map((l, i) => {
        const armDir = l.side === 1 ? -1 : 1
        return (
          <group key={i} position={[l.x, 0, l.z]}>
            <mesh position={[0, 3.15, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.1, 6.3, 8]} />
              <meshStandardMaterial color="#555b61" metalness={0.65} roughness={0.32} />
            </mesh>
            <mesh position={[armDir * 1.1, 6.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 2.35, 8]} />
              <meshStandardMaterial color="#555b61" metalness={0.65} roughness={0.32} />
            </mesh>
            <mesh position={[armDir * 2.3, 5.96, 0]}>
              <sphereGeometry args={[0.24, 14, 10]} />
              <meshStandardMaterial
                color={isLit ? colors.lamp : '#3a3a3a'}
                emissive={isLit ? colors.lamp : '#000000'}
                emissiveIntensity={isLit ? 2.2 : 0}
                roughness={0.16}
              />
            </mesh>
            {isLit && (
              <>
                <pointLight
                  position={[armDir * 2.3, 5.72, 0]}
                  color={colors.lamp}
                  intensity={1.55}
                  distance={32}
                  decay={2}
                  castShadow={l.cast}
                />
                <mesh position={[armDir * 2.3, 5.65, 0]}>
                  <sphereGeometry args={[0.9, 16, 10]} />
                  <meshBasicMaterial color={colors.lamp} transparent opacity={0.13} depthWrite={false} fog={false} />
                </mesh>
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

function RoadReflectors() {
  const timeOfDay = useStore(s => s.timeOfDay) as TimeValue
  const timePhase = useStore(s => s.timePhase)
  const phase = resolveTimePhase(timeOfDay, timePhase)
  const colors = phaseColors(phase)
  const emissive = phase === 'day' ? 0.15 : 0.55

  const reflectors = useMemo(() => {
    const arr: Array<{ x: number; z: number; color: string; sx: number; sz: number }> = []
    for (let z = -920; z <= 920; z += 32) {
      arr.push({ x: -5.9, z, color: '#e5e7eb', sx: 0.16, sz: 0.52 })
      arr.push({ x: 5.9, z, color: '#e5e7eb', sx: 0.16, sz: 0.52 })
      if (z % 64 === 0) arr.push({ x: 0, z, color: '#d4a017', sx: 0.18, sz: 0.55 })
    }
    return arr
  }, [])

  return (
    <group name="HDRoadReflectors">
      {reflectors.map((r, i) => (
        <mesh key={i} position={[r.x, 0.048, r.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[r.sx, r.sz]} />
          <meshStandardMaterial color={r.color} emissive={r.color === '#e5e7eb' ? colors.reflector : r.color} emissiveIntensity={emissive} roughness={0.24} metalness={0.05} />
        </mesh>
      ))}
    </group>
  )
}

function RoadSheen() {
  const weather = useStore(s => s.weather)
  const timeOfDay = useStore(s => s.timeOfDay) as TimeValue
  const timePhase = useStore(s => s.timePhase)
  const phase = resolveTimePhase(timeOfDay, timePhase)
  const wet = weather === 'rain' || weather === 'storm'
  const night = phase !== 'day'
  const opacity = wet ? 0.22 : night ? 0.085 : 0.035

  const roadPlanes = useMemo(() => PORTNEUF_ROADS.map((road) => {
    const dx = road.end[0] - road.start[0]
    const dz = road.end[1] - road.start[1]
    const length = Math.sqrt(dx * dx + dz * dz)
    const angle = Math.atan2(dx, dz)
    const midX = (road.start[0] + road.end[0]) / 2
    const midZ = (road.start[1] + road.end[1]) / 2
    return { id: road.id, position: [midX, 0.052, midZ] as [number, number, number], rotationY: angle, width: road.width * 0.92, length }
  }), [])

  return (
    <group name="HDRoadSheen">
      {roadPlanes.map(p => (
        <mesh key={p.id} position={p.position} rotation={[-Math.PI / 2, 0, p.rotationY]}>
          <planeGeometry args={[p.width, p.length]} />
          <meshPhysicalMaterial color="#9fc7df" transparent opacity={opacity} roughness={wet ? 0.18 : 0.34} metalness={0.0} clearcoat={wet ? 0.8 : 0.35} clearcoatRoughness={wet ? 0.08 : 0.22} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function DistantCityGlow() {
  const timeOfDay = useStore(s => s.timeOfDay) as TimeValue
  const timePhase = useStore(s => s.timePhase)
  const phase = resolveTimePhase(timeOfDay, timePhase)
  const visible = phase !== 'day'
  const colors = phaseColors(phase)

  if (!visible) return null

  return (
    <group name="DistantCityGlow" position={[0, 0, 900]}>
      <mesh position={[0, 42, 0]}>
        <sphereGeometry args={[145, 24, 12]} />
        <meshBasicMaterial color={colors.glow} transparent opacity={0.065} depthWrite={false} fog={false} />
      </mesh>
      <pointLight position={[0, 38, 0]} color={colors.glow} intensity={1.35} distance={275} />
    </group>
  )
}

function HydroLineGlow() {
  const points = useMemo(() => {
    return [-800, -400, 0, 400, 800].map(z => new THREE.Vector3(-35, 19, z))
  }, [])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#d7e4ee" transparent opacity={0.42} />
    </line>
  )
}

function AtmosphericDepthBands() {
  return (
    <group name="AtmosphericDepthBands">
      <mesh position={[0, 28, -620]} scale={[360, 50, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#d8f3ff" transparent opacity={0.035} depthWrite={false} fog={false} />
      </mesh>
      <mesh position={[0, 12, 760]} scale={[520, 80, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.025} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}

export default function WorldGraphics() {
  return (
    <group name="WorldGraphicsHDCartoon">
      <RoadSheen />
      <RouteStreetLights />
      <RoadReflectors />
      <DistantCityGlow />
      <HydroLineGlow />
      <AtmosphericDepthBands />
    </group>
  )
}
