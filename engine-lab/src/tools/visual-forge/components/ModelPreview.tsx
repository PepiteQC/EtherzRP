import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Grid, OrbitControls } from '@react-three/drei'
import { useVisualForgeStore } from '../VisualForgeStore'

function ReliefMesh() {
  const model = useVisualForgeStore((state) => state.model)
  const analysis = useVisualForgeStore((state) => state.analysis)

  const geometry = useMemo(() => {
    if (!model) return null

    const field = model.heightField
    const next = new THREE.PlaneGeometry(
      model.width,
      model.height,
      field.width - 1,
      field.height - 1
    )

    const positions = next.attributes.position as THREE.BufferAttribute

    for (let index = 0; index < positions.count; index += 1) {
      positions.setZ(index, (field.samples[index] ?? 0) * model.depth)
    }

    positions.needsUpdate = true
    next.computeVertexNormals()
    return next
  }, [model])

  useEffect(() => () => geometry?.dispose(), [geometry])

  if (!geometry) return null

  return (
    <mesh geometry={geometry} rotation={[-0.2, 0, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        color={analysis?.averageColor ?? '#4f8cff'}
        roughness={0.62}
        metalness={0.08}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function ModelPreview() {
  const model = useVisualForgeStore((state) => state.model)

  return (
    <section className="vf-preview">
      <Canvas
        shadows
        camera={{ position: [5.5, 4.5, 7], fov: 45 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#060914']} />
        <ambientLight intensity={0.65} />
        <directionalLight castShadow position={[5, 8, 5]} intensity={2} />

        <ReliefMesh />

        <Grid
          position={[0, -2.6, 0]}
          args={[18, 18]}
          cellSize={0.5}
          sectionSize={2}
          fadeDistance={18}
          infiniteGrid
        />

        <ContactShadows
          position={[0, -2.55, 0]}
          opacity={0.45}
          scale={12}
          blur={2.5}
          far={7}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={16}
        />
      </Canvas>

      {!model && (
        <div className="vf-preview__empty">
          <strong>Aperçu 3D</strong>
          <span>Le modèle apparaîtra après la génération.</span>
        </div>
      )}
    </section>
  )
}
