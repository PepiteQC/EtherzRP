import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Grid, OrbitControls } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ObjectCreatorConfig, ObjectPartDef } from './types'
import { createGeometry, createMaterial } from './objectFactory'

function AnimatedPart({ part }: { part: ObjectPartDef }) {
  const ref = useRef<THREE.Mesh>(null!)
  const geo = useMemo(() => createGeometry(part.geometry), [part.geometry])
  const mat = useMemo(() => createMaterial(part.material), [part.material])
  const basePos = useMemo(() => new THREE.Vector3(...part.position), [part.position])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    if (part.animate === 'spin') ref.current.rotation.y += part.animSpeed * 0.018
    if (part.animate === 'float') ref.current.position.y = basePos.y + Math.sin(t * part.animSpeed * 2) * 0.18
    if (part.animate === 'pulse') {
      const s = 1 + Math.sin(t * part.animSpeed * 3) * 0.08
      ref.current.scale.set(part.scale[0] * s, part.scale[1] * s, part.scale[2] * s)
    }
    if (part.animate === 'wave') {
      ref.current.position.y = basePos.y + Math.sin(t * part.animSpeed * 2) * 0.22
      ref.current.rotation.z = Math.sin(t * part.animSpeed) * 0.18
    }
    if (part.animate === 'breathe') {
      const s = 1 + Math.sin(t * part.animSpeed * 2) * 0.12
      ref.current.scale.set(part.scale[0] * s, part.scale[1] * s, part.scale[2] * s)
    }
  })

  return <mesh ref={ref} geometry={geo} material={mat} position={part.position} rotation={part.rotation} scale={part.scale} castShadow receiveShadow />
}

function Scene({ config }: { config: ObjectCreatorConfig }) {
  const group = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.12 + clock.elapsedTime * 0.06
  })

  return (
    <>
      <color attach="background" args={[config.lighting.background]} />
      {config.lighting.fog && <fog attach="fog" args={[config.lighting.fog, 8, 24]} />}
      <ambientLight color={config.lighting.ambient} intensity={1.25} />
      <directionalLight position={[4, 8, 6]} color={config.lighting.key} intensity={2.4} castShadow />
      <pointLight position={[-5, 3, -4]} color={config.lighting.fill} intensity={4.5} distance={18} />
      <Environment preset="city" />
      <group ref={group}>
        {config.parts.map((p) => <AnimatedPart key={p.id} part={p} />)}
      </group>
      <Grid position={[0, -1.85, 0]} args={[18, 18]} cellSize={0.7} cellColor="#24114a" sectionSize={3.5} sectionColor="#6d28d9" fadeDistance={22} fadeStrength={2} infiniteGrid />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} autoRotate autoRotateSpeed={0.35} />
    </>
  )
}

export default function ObjectPreview3D({ config }: { config: ObjectCreatorConfig | null }) {
  return (
    <div className="w-full h-full min-h-[480px] rounded-2xl overflow-hidden bg-[#060010] border border-white/10">
      {config ? (
        <Canvas shadows camera={{ position: [4, 3, 6], fov: 48 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Scene config={config} />
        </Canvas>
      ) : (
        <div className="h-full min-h-[480px] grid place-items-center text-center text-white/20 font-mono">
          <div>
            <div className="text-5xl mb-4">⬡</div>
            <div className="uppercase tracking-[0.25em] text-xs">Décris un objet</div>
            <div className="text-[10px] mt-2 opacity-50">Le modeleur intelligent attend ton prompt.</div>
          </div>
        </div>
      )}
    </div>
  )
}
