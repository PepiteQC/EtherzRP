import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import RabbitPilot from './RabbitPilot'

const COLORS = {
  carrot: '#d95d2b',
  carrotLight: '#ff8a3d',
  leaf: '#379351',
  leafLight: '#48aa62',
  wing: '#5c2c22',
  smoke: '#fff3dd',
  star: '#ffe7a3',
}

function mat(color: string) {
  return <meshPhongMaterial color={color} flatShading shininess={12} />
}

function SmokeTrail() {
  const smoke = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      x: 3.4 + i * 0.55,
      y: Math.sin(i * 1.7) * 0.22,
      z: Math.cos(i * 1.2) * 0.08,
      s: 0.22 + i * 0.035,
      phase: i * 0.45,
    }))
  }, [])

  return (
    <group name="SmokeTrail">
      {smoke.map((p, i) => (
        <SmokePuff key={i} {...p} />
      ))}
    </group>
  )
}

function SmokePuff({ x, y, z, s, phase }: { x: number; y: number; z: number; s: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime + phase
    const pulse = 1 + Math.sin(t * 2.4) * 0.12
    ref.current.scale.setScalar(s * pulse)
    const mat = ref.current.material as THREE.MeshPhongMaterial
    mat.opacity = 0.42 + Math.sin(t * 1.8) * 0.08
  })
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshPhongMaterial color={COLORS.smoke} transparent opacity={0.42} flatShading depthWrite={false} />
    </mesh>
  )
}

export function PassingStars() {
  const stars = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: -13 + i * 1.55,
    y: 2.6 + Math.sin(i * 2.1) * 2.8,
    z: -4 - (i % 4),
    s: 0.045 + (i % 3) * 0.018,
    speed: 0.35 + (i % 4) * 0.08,
  })), [])

  return (
    <group name="PassingStars">
      {stars.map((star, i) => <Star key={i} {...star} />)}
    </group>
  )
}

function Star({ x, y, z, s, speed }: { x: number; y: number; z: number; s: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }, delta) => {
    if (!ref.current) return
    ref.current.position.x -= delta * speed
    if (ref.current.position.x < -14) ref.current.position.x = 14
    const pulse = 1 + Math.sin(clock.elapsedTime * 3 + x) * 0.35
    ref.current.scale.setScalar(s * pulse)
  })
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color={COLORS.star} transparent opacity={0.75} depthWrite={false} />
    </mesh>
  )
}

export default function CarrotRocket({ behindLogo = false }: { behindLogo?: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const leafRef = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!ref.current) return
    ref.current.position.x = ((t * 1.35) % 30) - 15
    ref.current.position.y = 4.15 + Math.sin(t * 2.1) * 0.32
    ref.current.position.z = behindLogo ? -4.5 : -2.2
    ref.current.rotation.z = -Math.PI / 2 + Math.sin(t * 2.1) * 0.08
    if (leafRef.current) leafRef.current.rotation.y += 0.55
  })

  return (
    <group ref={ref} position={[-14, 4.15, -2.2]} rotation={[0, 0, -Math.PI / 2]} scale={0.16}>
      <SmokeTrail />
      <mesh castShadow>
        <cylinderGeometry args={[5, 2, 25, 8]} />
        {mat(COLORS.carrot)}
      </mesh>
      <mesh position={[0, 0, 0.1]} scale={[0.82, 0.82, 0.82]}>
        <cylinderGeometry args={[4.7, 1.8, 24.4, 8]} />
        {mat(COLORS.carrotLight)}
      </mesh>
      <mesh position={[6, 2, 1]} castShadow>
        <boxGeometry args={[7, 7, 0.5]} />
        {mat(COLORS.wing)}
      </mesh>
      <mesh position={[-6, 2, 1]} castShadow>
        <boxGeometry args={[7, 7, 0.5]} />
        {mat(COLORS.wing)}
      </mesh>
      <group ref={leafRef} position={[0, 14.5, 0]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[1.5, 1, 5, 4]} />
          {mat(COLORS.leaf)}
        </mesh>
        <mesh position={[-1.8, 0.5, 0]} rotation={[0, 0, 0.45]}>
          <cylinderGeometry args={[1.2, 0.8, 4.2, 4]} />
          {mat(COLORS.leafLight)}
        </mesh>
        <mesh position={[1.8, 0.5, 0]} rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[1.2, 0.8, 4.2, 4]} />
          {mat(COLORS.leafLight)}
        </mesh>
      </group>
      <RabbitPilot />
    </group>
  )
}
