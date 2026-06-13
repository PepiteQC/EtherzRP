import { Canvas } from '@react-three/fiber'
import CarrotRocket, { PassingStars } from './CarrotRocket'

function Cloud({ x, y, z, scale = 1 }: { x: number; y: number; z: number; scale?: number }) {
  return (
    <group position={[x, y, z]} scale={scale}>
      <mesh position={[0, 0, 0]}><sphereGeometry args={[0.72, 8, 6]} /><meshPhongMaterial color="#fff7e8" flatShading /></mesh>
      <mesh position={[0.55, -0.08, 0.08]}><sphereGeometry args={[0.48, 8, 6]} /><meshPhongMaterial color="#fff7e8" flatShading /></mesh>
      <mesh position={[-0.58, -0.13, -0.02]}><sphereGeometry args={[0.55, 8, 6]} /><meshPhongMaterial color="#fff7e8" flatShading /></mesh>
      <mesh position={[0.08, 0.28, -0.04]}><sphereGeometry args={[0.42, 8, 6]} /><meshPhongMaterial color="#fff7e8" flatShading /></mesh>
    </group>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#79c8f2']} />
      <ambientLight intensity={1.9} color="#ffe8c8" />
      <directionalLight position={[5, 8, 8]} intensity={2.2} color="#fff7dc" />
      <pointLight position={[-4, 4, 4]} intensity={1.1} color="#ffd3a6" />
      <mesh position={[0, 0, -22]} scale={[60, 32, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#f8c98f" />
      </mesh>
      <PassingStars />
      <Cloud x={-8.5} y={5.6} z={-6} scale={0.95} />
      <Cloud x={5.8} y={6.5} z={-8} scale={1.2} />
      <Cloud x={10.5} y={4.8} z={-6} scale={0.72} />
      <CarrotRocket behindLogo />
    </>
  )
}

export default function CartoonConnectionScene() {
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.16) 70%, rgba(0,0,0,0.28))' }} />
    </div>
  )
}
