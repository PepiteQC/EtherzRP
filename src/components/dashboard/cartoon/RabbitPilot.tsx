import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

const COLORS = {
  rabbit: '#b9b9b9',
  rabbitLight: '#dedede',
  pink: '#d66b91',
  dark: '#333333',
}

function mat(color: string) {
  return <meshPhongMaterial color={color} flatShading shininess={10} />
}

export default function RabbitPilot() {
  const leftEar = useRef<THREE.Mesh>(null!)
  const rightEar = useRef<THREE.Mesh>(null!)
  const leftInner = useRef<THREE.Mesh>(null!)
  const rightInner = useRef<THREE.Mesh>(null!)
  const leftEye = useRef<THREE.Mesh>(null!)
  const rightEye = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const flap = Math.sin(t * 13) * 0.28
    if (leftEar.current) leftEar.current.rotation.x = -0.62 + flap
    if (rightEar.current) rightEar.current.rotation.x = -0.5 - flap * 0.85
    if (leftInner.current) leftInner.current.rotation.x = -0.62 + flap
    if (rightInner.current) rightInner.current.rotation.x = -0.5 - flap * 0.85

    const blink = Math.sin(t * 1.3) > 0.982 ? 0.12 : 1
    if (leftEye.current) leftEye.current.scale.y = THREE.MathUtils.lerp(leftEye.current.scale.y, blink, 0.35)
    if (rightEye.current) rightEye.current.scale.y = THREE.MathUtils.lerp(rightEye.current.scale.y, blink, 0.35)
  })

  return (
    <group name="RabbitPilot" position={[0, 0.42, 0.1]} scale={0.12} rotation={[1.45, 0, 0]}>
      <mesh position={[0, 0.5, 2.0]} castShadow>
        <boxGeometry args={[5, 5, 5]} />
        {mat(COLORS.rabbit)}
      </mesh>

      <mesh ref={leftEar} position={[-1.5, 5.2, 2.1]} rotation={[-0.62, 0, -0.08]} castShadow>
        <boxGeometry args={[1.2, 5.2, 0.55]} />
        {mat(COLORS.rabbitLight)}
      </mesh>
      <mesh ref={rightEar} position={[1.5, 5.2, 2.1]} rotation={[-0.5, 0, 0.08]} castShadow>
        <boxGeometry args={[1.2, 5.2, 0.55]} />
        {mat(COLORS.rabbitLight)}
      </mesh>
      <mesh ref={leftInner} position={[-1.5, 5.2, 2.45]} rotation={[-0.62, 0, -0.08]}>
        <boxGeometry args={[0.55, 3.3, 0.16]} />
        {mat(COLORS.pink)}
      </mesh>
      <mesh ref={rightInner} position={[1.5, 5.2, 2.45]} rotation={[-0.5, 0, 0.08]}>
        <boxGeometry args={[0.55, 3.3, 0.16]} />
        {mat(COLORS.pink)}
      </mesh>

      <mesh ref={leftEye} position={[-1.0, 1.0, 4.6]}>
        <boxGeometry args={[0.55, 0.8, 0.25]} />
        {mat(COLORS.dark)}
      </mesh>
      <mesh ref={rightEye} position={[1.0, 1.0, 4.6]}>
        <boxGeometry args={[0.55, 0.8, 0.25]} />
        {mat(COLORS.dark)}
      </mesh>
      <mesh position={[0, -0.15, 4.65]}>
        <boxGeometry args={[0.55, 0.45, 0.25]} />
        {mat(COLORS.pink)}
      </mesh>
    </group>
  )
}
