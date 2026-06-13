import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/lib/etherworld/game-store'

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
    case 'night': return { fog: '#070a18', lamp: '#ffcc66', glow: '#224d8a' }
    case 'dawn': return { fog: '#37496a', lamp: '#ffd28a', glow: '#ff8855' }
    case 'dusk': return { fog: '#26142f', lamp: '#ffb35a', glow: '#ff6633' }
    default: return { fog: '#78b7df', lamp: '#fff3bd', glow: '#9ed8ff' }
  }
}

function DynamicFog() {
  const timeOfDay = useStore(s => s.timeOfDay) as TimeValue
  const timePhase = useStore(s => s.timePhase)
  const weather = useStore(s => s.weather)

  useFrame(({ scene }) => {
    const phase = resolveTimePhase(timeOfDay, timePhase)
    const colors = phaseColors(phase)

    let near = phase === 'night' ? 42 : phase === 'day' ? 145 : 70
    let far = phase === 'night' ? 520 : phase === 'day' ? 860 : 680

    if (weather === 'fog') { near = 12; far = 190 }
    if (weather === 'rain' || weather === 'storm') { near = 34; far = 360 }
    if (weather === 'snow' || weather === 'blizzard') { near = 24; far = 300 }

    const current = scene.fog instanceof THREE.Fog ? scene.fog : null
    if (!current) {
      scene.fog = new THREE.Fog(colors.fog, near, far)
      return
    }

    current.color.lerp(new THREE.Color(colors.fog), 0.025)
    current.near = THREE.MathUtils.lerp(current.near, near, 0.025)
    current.far = THREE.MathUtils.lerp(current.far, far, 0.025)
  })

  return null
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
    <group name="Route138StreetLights">
      {lights.map((l, i) => {
        const armDir = l.side === 1 ? -1 : 1
        const lampX = l.x + armDir * 2.3
        return (
          <group key={i} position={[l.x, 0, l.z]}>
            <mesh position={[0, 3.15, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.1, 6.3, 8]} />
              <meshStandardMaterial color="#555b61" metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh position={[armDir * 1.1, 6.15, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 2.35, 8]} />
              <meshStandardMaterial color="#555b61" metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh position={[armDir * 2.3, 5.96, 0]}>
              <sphereGeometry args={[0.22, 12, 8]} />
              <meshStandardMaterial
                color={isLit ? colors.lamp : '#3a3a3a'}
                emissive={isLit ? colors.lamp : '#000000'}
                emissiveIntensity={isLit ? 1.8 : 0}
                roughness={0.2}
              />
            </mesh>
            {isLit && (
              <>
                <pointLight
                  position={[armDir * 2.3, 5.72, 0]}
                  color={colors.lamp}
                  intensity={1.2}
                  distance={28}
                  decay={2}
                  castShadow={l.cast}
                />
                <mesh position={[armDir * 2.3, 5.65, 0]}>
                  <sphereGeometry args={[0.72, 12, 8]} />
                  <meshBasicMaterial color={colors.lamp} transparent opacity={0.12} depthWrite={false} />
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
  const reflectors = useMemo(() => {
    const arr: Array<{ x: number; z: number; color: string }> = []
    for (let z = -920; z <= 920; z += 32) {
      arr.push({ x: -5.9, z, color: '#e5e7eb' })
      arr.push({ x: 5.9, z, color: '#e5e7eb' })
      if (z % 64 === 0) arr.push({ x: 0, z, color: '#d4a017' })
    }
    return arr
  }, [])

  return (
    <group name="RouteReflectors">
      {reflectors.map((r, i) => (
        <mesh key={i} position={[r.x, 0.045, r.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 0.55]} />
          <meshStandardMaterial color={r.color} emissive={r.color} emissiveIntensity={0.18} roughness={0.35} />
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
        <meshBasicMaterial color={colors.glow} transparent opacity={0.06} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 38, 0]} color={colors.glow} intensity={1.2} distance={260} />
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
      <lineBasicMaterial color="#b7c4cc" transparent opacity={0.38} />
    </line>
  )
}

/**
 * Couche graphique additionnelle inspirée du World Scene fourni.
 * Ne contient PAS de personnage, PAS de contrôleur joueur, PAS de véhicule joueur.
 * Elle ajoute seulement ambiance, lumières, brouillard, réflecteurs et glow.
 */
export default function WorldGraphics() {
  return (
    <group name="WorldGraphics">
      <DynamicFog />
      <RouteStreetLights />
      <RoadReflectors />
      <DistantCityGlow />
      <HydroLineGlow />
    </group>
  )
}
