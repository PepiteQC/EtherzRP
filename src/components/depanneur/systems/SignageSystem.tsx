/**
 * SignageSystem.tsx
 * Enseignes, caméras de sécurité, panneau OUVERT, posters
 */

import { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Vec3 = [number, number, number]

const FACADE_Z = 6.92

// ─────────────────────────────────────────────
// SECURITY CAMERA
// ─────────────────────────────────────────────

const SecurityCamera = memo(function SecurityCamera({
  position,
  rotation = [0, 0, 0],
}: {
  position: Vec3
  rotation?: Vec3
}) {
  const headRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (headRef.current) headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.4
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.3
    }
  })

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, -0.08, 0.06]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.03, 0.12, 0.03]} />
        <meshStandardMaterial color="#dddddd" metalness={0.6} roughness={0.3} />
      </mesh>
      <group ref={headRef} position={[0, -0.15, 0.1]}>
        <mesh rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.1]} />
          <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.055]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.018, 0.03, 8]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh ref={ledRef} position={[0.025, 0.015, 0.045]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  )
})

// ─────────────────────────────────────────────
// OPEN SIGN
// ─────────────────────────────────────────────

const OpenSign = memo(function OpenSign({ position }: { position: Vec3 }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.6, 0.25, 0.03]} />
        <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh ref={meshRef} position={[0, 0, 0.018]}>
        <boxGeometry args={[0.5, 0.15, 0.005]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.6} />
      </mesh>
      <pointLight position={[0, 0, 0.1]} intensity={0.3} color="#00ff00" distance={2} decay={2} />
    </group>
  )
})

// ─────────────────────────────────────────────
// COUCHE-TARD SIGN
// ─────────────────────────────────────────────

const CoucheTardSign = memo(function CoucheTardSign({ position }: { position: Vec3 }) {
  const signGlowRef = useRef<THREE.Mesh>(null)
  const eyeLeftRef = useRef<THREE.Mesh>(null)
  const eyeRightRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (signGlowRef.current) {
      const mat = signGlowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 0.5) * 0.08
    }
    if (eyeLeftRef.current && eyeRightRef.current) {
      const blink = Math.sin(state.clock.elapsedTime * 0.8)
      const scale = blink > 0.95 ? 0.1 : 1
      eyeLeftRef.current.scale.y = scale
      eyeRightRef.current.scale.y = scale
    }
  })

  return (
    <group position={position}>
      {/* Pole */}
      <mesh castShadow>
        <boxGeometry args={[0.2, 4, 0.2]} />
        <meshStandardMaterial color="#444455" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.8, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#555566" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Sign body */}
      <group position={[0, 2, 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[3.5, 1.8, 0.22]} />
          <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.115]}>
          <boxGeometry args={[3.4, 1.7, 0.005]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
        </mesh>
        <mesh ref={signGlowRef} position={[0, 0, 0.12]}>
          <boxGeometry args={[3.2, 1.5, 0.01]} />
          <meshStandardMaterial color="#cc0000" emissive="#ff0000" emissiveIntensity={0.35} />
        </mesh>

        {/* Owl logo */}
        <group position={[-1.0, 0.2, 0.14]}>
          <mesh>
            <boxGeometry args={[0.5, 0.6, 0.02]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.2} />
          </mesh>
          <mesh ref={eyeLeftRef} position={[-0.1, 0.15, 0.015]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
          <mesh ref={eyeRightRef} position={[0.1, 0.15, 0.015]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[-0.1, 0.15, 0.035]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          <mesh position={[0.1, 0.15, 0.035]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
        </group>

        {/* "Couche-Tard" text */}
        <mesh position={[0.5, 0.2, 0.13]}>
          <boxGeometry args={[1.8, 0.35, 0.005]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} />
        </mesh>
        {/* "DÉPANNEUR" */}
        <mesh position={[0.5, -0.15, 0.13]}>
          <boxGeometry args={[1.2, 0.15, 0.005]} />
          <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.2} />
        </mesh>
        {/* "OUVERT 24H" */}
        <mesh position={[0, -0.55, 0.13]}>
          <boxGeometry args={[1.5, 0.12, 0.005]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Sign lights */}
      <pointLight position={[0, 2, 1.5]} color="#ff3333" intensity={2.5} distance={12} decay={2} />
      <pointLight position={[0, 2, -0.5]} color="#ff3333" intensity={1.0} distance={8} decay={2} />
      <spotLight
        position={[0, 4, 0.5]}
        angle={Math.PI / 4}
        penumbra={0.5}
        intensity={1.5}
        color="#ffeecc"
        castShadow
        shadow-mapSize={[512, 512]}
      />
    </group>
  )
})

// ─────────────────────────────────────────────
// SYSTEM EXPORT
// ─────────────────────────────────────────────

export const SignageSystem = memo(function SignageSystem() {
  return (
    <>
      {/* Couche-Tard sign */}
      <CoucheTardSign position={[0, 7.2, -4]} />

      {/* OPEN sign */}
      <OpenSign position={[-5.5, 2.8, FACADE_Z + 0.12]} />

      {/* Security cameras */}
      <SecurityCamera position={[-6, 5.5, 5]} rotation={[0, Math.PI / 4, 0]} />
      <SecurityCamera position={[6, 5.5, 5]} rotation={[0, -Math.PI / 4, 0]} />
      <SecurityCamera position={[0, 5.5, -6]} rotation={[0, Math.PI, 0]} />

      {/* Promo poster */}
      <mesh position={[5.5, 2.0, FACADE_Z + 0.1]}>
        <boxGeometry args={[1.2, 1.5, 0.005]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={0.08} />
      </mesh>
    </>
  )
})