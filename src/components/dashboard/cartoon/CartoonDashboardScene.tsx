import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const COLORS = {
  skyTop: '#79c8f2',
  skyBottom: '#f8c98f',
  grass: '#4f9d54',
  grassDark: '#2f6f3a',
  hillBack: '#6dbb73',
  hillFront: '#4c9b5b',
  trunk: '#754c2f',
  pine1: '#1f6b3b',
  pine2: '#2f8a4e',
  cloud: '#fff7e8',
  carrot: '#d95d2b',
  carrotLight: '#ff8a3d',
  carrotLeaf: '#379351',
  rabbit: '#b9b9b9',
  rabbitLight: '#d8d8d8',
  rabbitPink: '#d66b91',
  roofRed: '#b7513c',
  roofBlue: '#365b8c',
  wallCream: '#f2dfbd',
  wallBlue: '#9cc8d9',
  wallGreen: '#b6d58d',
  path: '#c89f67',
}

function mat(color: string) {
  return <meshPhongMaterial color={color} flatShading shininess={12} />
}

function SkyGradient() {
  return (
    <mesh position={[0, 0, -22]} scale={[60, 32, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={COLORS.skyBottom} />
    </mesh>
  )
}

function SunMoon() {
  const ref = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.15) * 0.04
  })
  return (
    <group ref={ref} position={[9.5, 6.8, -8]}>
      <mesh>
        <sphereGeometry args={[0.75, 16, 12]} />
        <meshBasicMaterial color="#ffe7a3" />
      </mesh>
      <mesh scale={[1.55, 1.55, 1.55]}>
        <sphereGeometry args={[0.75, 16, 12]} />
        <meshBasicMaterial color="#ffd47a" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

function CartoonCloud({ x, y, z, speed, scale = 1 }: { x: number; y: number; z: number; speed: number; scale?: number }) {
  const ref = useRef<THREE.Group>(null!)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.position.x -= delta * speed
    if (ref.current.position.x < -14) ref.current.position.x = 14
  })
  return (
    <group ref={ref} position={[x, y, z]} scale={scale}>
      <mesh position={[0, 0, 0]}>{/* centre */}<sphereGeometry args={[0.72, 8, 6]} />{mat(COLORS.cloud)}</mesh>
      <mesh position={[0.55, -0.08, 0.08]}><sphereGeometry args={[0.48, 8, 6]} />{mat(COLORS.cloud)}</mesh>
      <mesh position={[-0.58, -0.13, -0.02]}><sphereGeometry args={[0.55, 8, 6]} />{mat(COLORS.cloud)}</mesh>
      <mesh position={[0.08, 0.28, -0.04]}><sphereGeometry args={[0.42, 8, 6]} />{mat(COLORS.cloud)}</mesh>
    </group>
  )
}

function CloudLayer() {
  const clouds = useMemo(() => [
    { x: -9, y: 5.8, z: -7, speed: 0.22, scale: 0.9 },
    { x: -1.5, y: 6.7, z: -8, speed: 0.16, scale: 1.15 },
    { x: 7, y: 5.4, z: -6, speed: 0.25, scale: 0.8 },
    { x: 11, y: 7.1, z: -9, speed: 0.13, scale: 1.0 },
  ], [])
  return <>{clouds.map((c, i) => <CartoonCloud key={i} {...c} />)}</>
}

function Hills() {
  return (
    <group>
      <mesh position={[-6, -2.25, -9]} scale={[10, 3.2, 1]}>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {mat(COLORS.hillBack)}
      </mesh>
      <mesh position={[5, -2.0, -8.5]} scale={[9, 2.8, 1]}>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {mat('#7bc77a')}
      </mesh>
      <mesh position={[0, -2.7, -6.2]} scale={[12, 2.6, 1]}>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {mat(COLORS.hillFront)}
      </mesh>
    </group>
  )
}

function Ground() {
  return (
    <group>
      <mesh position={[0, -3.2, -1]} rotation={[-Math.PI / 2, 0, 0]} scale={[26, 14, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshPhongMaterial color={COLORS.grass} flatShading />
      </mesh>
      {/* Petit chemin cartoon sans texte ni numéro */}
      <mesh position={[0, -3.08, 1.4]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.8, 10, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshPhongMaterial color={COLORS.path} flatShading />
      </mesh>
      <mesh position={[0, -3.06, 1.4]} rotation={[-Math.PI / 2, 0, 0]} scale={[3.7, 10, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshPhongMaterial color="#d7b47a" flatShading />
      </mesh>
    </group>
  )
}

function PineTree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, -2.85, z]} scale={s}>
      <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.09, 0.14, 0.9, 5]} />{mat(COLORS.trunk)}</mesh>
      <mesh position={[0, 1.08, 0]}><coneGeometry args={[0.52, 1.0, 6]} />{mat(COLORS.pine1)}</mesh>
      <mesh position={[0, 1.55, 0]}><coneGeometry args={[0.42, 0.82, 6]} />{mat(COLORS.pine2)}</mesh>
      <mesh position={[0, 1.95, 0]}><coneGeometry args={[0.28, 0.62, 6]} />{mat(COLORS.pine1)}</mesh>
    </group>
  )
}

function Trees() {
  const trees = useMemo(() => [
    [-10.5, -2.2, 0.95], [-9.1, -4.2, 0.72], [-7.7, -1.4, 0.82], [-6.2, -5.4, 0.68],
    [7.1, -2.6, 0.86], [8.4, -4.8, 0.72], [10.2, -1.4, 1.05], [11.3, -5.2, 0.7],
    [-4.2, -6.2, 0.52], [4.4, -6.1, 0.52],
  ] as Array<[number, number, number]>, [])
  return <>{trees.map((t, i) => <PineTree key={i} x={t[0]} z={t[1]} s={t[2]} />)}</>
}

function House({ x, z, wall, roof, scale = 1 }: { x: number; z: number; wall: string; roof: string; scale?: number }) {
  return (
    <group position={[x, -2.75, z]} scale={scale}>
      <mesh position={[0, 0.55, 0]}><boxGeometry args={[1.25, 1.05, 1.0]} />{mat(wall)}</mesh>
      <mesh position={[0, 1.33, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.98, 0.72, 4]} />{mat(roof)}</mesh>
      <mesh position={[0, 0.25, -0.52]}><boxGeometry args={[0.28, 0.48, 0.06]} />{mat('#74402a')}</mesh>
      <mesh position={[-0.35, 0.65, -0.53]}><boxGeometry args={[0.23, 0.23, 0.04]} />{mat('#c9f0ff')}</mesh>
      <mesh position={[0.35, 0.65, -0.53]}><boxGeometry args={[0.23, 0.23, 0.04]} />{mat('#c9f0ff')}</mesh>
    </group>
  )
}

function TinyTown() {
  return (
    <group name="TinyTown">
      <House x={-3.6} z={-2.6} wall={COLORS.wallCream} roof={COLORS.roofRed} scale={0.92} />
      <House x={-1.75} z={-2.95} wall={COLORS.wallBlue} roof={COLORS.roofBlue} scale={0.78} />
      <House x={2.0} z={-2.8} wall={COLORS.wallGreen} roof={COLORS.roofRed} scale={0.86} />
      <House x={3.9} z={-3.25} wall="#f0cfa2" roof="#8c3f2b" scale={0.72} />
      {/* Petit commerce cute, sans enseigne texte */}
      <group position={[0.1, -2.72, -3.35]} scale={0.82}>
        <mesh position={[0, 0.48, 0]}><boxGeometry args={[1.6, 0.95, 1.0]} />{mat('#f7e3c0')}</mesh>
        <mesh position={[0, 1.02, -0.02]}><boxGeometry args={[1.8, 0.22, 1.1]} />{mat('#e7663f')}</mesh>
        <mesh position={[0, 0.38, -0.53]}><boxGeometry args={[0.42, 0.52, 0.06]} />{mat('#5c2c22')}</mesh>
        <mesh position={[-0.52, 0.58, -0.54]}><boxGeometry args={[0.34, 0.26, 0.04]} />{mat('#d7f7ff')}</mesh>
        <mesh position={[0.52, 0.58, -0.54]}><boxGeometry args={[0.34, 0.26, 0.04]} />{mat('#d7f7ff')}</mesh>
      </group>
    </group>
  )
}

function RabbitPilot() {
  return (
    <group name="RabbitPilot" position={[0, 0.42, 0.1]} scale={0.12} rotation={[1.45, 0, 0]}>
      <mesh position={[0, 0.5, 2.0]}><boxGeometry args={[5, 5, 5]} />{mat(COLORS.rabbit)}</mesh>
      <mesh position={[-1.5, 5.2, 2.1]} rotation={[-0.55, 0, -0.08]}><boxGeometry args={[1.2, 5.2, 0.55]} />{mat(COLORS.rabbitLight)}</mesh>
      <mesh position={[1.5, 5.2, 2.1]} rotation={[-0.5, 0, 0.08]}><boxGeometry args={[1.2, 5.2, 0.55]} />{mat(COLORS.rabbitLight)}</mesh>
      <mesh position={[-1.5, 5.2, 2.45]} rotation={[-0.55, 0, -0.08]}><boxGeometry args={[0.55, 3.3, 0.16]} />{mat(COLORS.rabbitPink)}</mesh>
      <mesh position={[1.5, 5.2, 2.45]} rotation={[-0.5, 0, 0.08]}><boxGeometry args={[0.55, 3.3, 0.16]} />{mat(COLORS.rabbitPink)}</mesh>
      <mesh position={[-1.0, 1.0, 4.6]}><boxGeometry args={[0.55, 0.8, 0.25]} />{mat('#333')}</mesh>
      <mesh position={[1.0, 1.0, 4.6]}><boxGeometry args={[0.55, 0.8, 0.25]} />{mat('#333')}</mesh>
      <mesh position={[0, -0.15, 4.65]}><boxGeometry args={[0.55, 0.45, 0.25]} />{mat(COLORS.rabbitPink)}</mesh>
    </group>
  )
}

function CarrotRocket() {
  const ref = useRef<THREE.Group>(null!)
  const leafRef = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!ref.current) return
    ref.current.position.x = ((t * 1.25) % 28) - 14
    ref.current.position.y = 4.8 + Math.sin(t * 2.1) * 0.28
    ref.current.rotation.z = Math.sin(t * 2.1) * 0.08
    if (leafRef.current) leafRef.current.rotation.y += 0.42
  })
  return (
    <group ref={ref} position={[-12, 4.8, -2]} rotation={[0, 0, -Math.PI / 2]} scale={0.16}>
      <mesh><cylinderGeometry args={[5, 2, 25, 8]} />{mat(COLORS.carrot)}</mesh>
      <mesh position={[0, 0, 0.1]} scale={[0.82, 0.82, 0.82]}><cylinderGeometry args={[4.7, 1.8, 24.4, 8]} />{mat(COLORS.carrotLight)}</mesh>
      <mesh position={[6, 2, 1]}><boxGeometry args={[7, 7, 0.5]} />{mat('#5c2c22')}</mesh>
      <mesh position={[-6, 2, 1]}><boxGeometry args={[7, 7, 0.5]} />{mat('#5c2c22')}</mesh>
      <group ref={leafRef} position={[0, 14.5, 0]}>
        <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[1.5, 1, 5, 4]} />{mat(COLORS.carrotLeaf)}</mesh>
        <mesh position={[-1.8, 0.5, 0]} rotation={[0, 0, 0.45]}><cylinderGeometry args={[1.2, 0.8, 4.2, 4]} />{mat('#48aa62')}</mesh>
        <mesh position={[1.8, 0.5, 0]} rotation={[0, 0, -0.45]}><cylinderGeometry args={[1.2, 0.8, 4.2, 4]} />{mat('#48aa62')}</mesh>
      </group>
      <RabbitPilot />
    </group>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={[COLORS.skyTop]} />
      <ambientLight intensity={1.85} color="#ffe8c8" />
      <directionalLight position={[5, 8, 8]} intensity={2.4} color="#fff7dc" />
      <pointLight position={[-4, 4, 4]} intensity={1.2} color="#ffd3a6" />
      <SkyGradient />
      <SunMoon />
      <CloudLayer />
      <Hills />
      <Ground />
      <TinyTown />
      <Trees />
      <CarrotRocket />
    </>
  )
}

export default function CartoonDashboardScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        orthographic
        camera={{ position: [0, 1.2, 12], zoom: 58, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Scene />
      </Canvas>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.12) 65%, rgba(0,0,0,0.35))' }} />
    </div>
  )
}
