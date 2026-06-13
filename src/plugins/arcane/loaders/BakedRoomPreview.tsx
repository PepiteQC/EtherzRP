import { memo, useEffect, useMemo, useState } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

interface BakedRoomPreviewProps {
  modelUrl?: string
  textureUrl?: string
  position?: [number, number, number]
  scale?: number
}

function FallbackRoom({ position = [0, 0, 0], scale = 1 }: Pick<BakedRoomPreviewProps, 'position' | 'scale'>) {
  return (
    <group position={position} scale={scale} userData={{ type: 'baked_room_fallback' }}>
      <mesh position={[0, 1.5, -2]} receiveShadow>
        <boxGeometry args={[5, 3, 0.15]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>
      <mesh position={[-2.5, 1.5, 0]} receiveShadow>
        <boxGeometry args={[0.15, 3, 4]} />
        <meshBasicMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 4]} />
        <meshBasicMaterial color="#374151" />
      </mesh>
      <mesh position={[0.9, 0.35, -0.6]} castShadow>
        <boxGeometry args={[1.8, 0.7, 1.2]} />
        <meshBasicMaterial color="#8b5cf6" />
      </mesh>
      <mesh position={[-1.1, 0.55, 0.7]} castShadow>
        <boxGeometry args={[1.4, 1.1, 0.6]} />
        <meshBasicMaterial color="#d97706" />
      </mesh>
      <pointLight position={[0, 2.6, 1.2]} color="#fef3c7" intensity={0.75} distance={7} />
    </group>
  )
}

export const BakedRoomPreview = memo(function BakedRoomPreview({
  modelUrl,
  textureUrl,
  position = [0, 0, 0],
  scale = 1,
}: BakedRoomPreviewProps) {
  const [failed, setFailed] = useState(!modelUrl || !textureUrl)

  if (failed || !modelUrl || !textureUrl) return <FallbackRoom position={position} scale={scale} />

  return (
    <BakedRoomModel
      modelUrl={modelUrl}
      textureUrl={textureUrl}
      position={position}
      scale={scale}
      onFailed={() => setFailed(true)}
    />
  )
})

function BakedRoomModel({
  modelUrl,
  textureUrl,
  position,
  scale,
  onFailed,
}: Required<Pick<BakedRoomPreviewProps, 'modelUrl' | 'textureUrl' | 'position' | 'scale'>> & { onFailed: () => void }) {
  const gltf = useLoader(GLTFLoader, modelUrl)
  const bakedTexture = useLoader(THREE.TextureLoader, textureUrl)

  const material = useMemo(() => {
    bakedTexture.flipY = false
    bakedTexture.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshBasicMaterial({ map: bakedTexture, side: THREE.DoubleSide })
  }, [bakedTexture])

  useEffect(() => {
    try {
      gltf.scene.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) mesh.material = material
      })
    } catch {
      onFailed()
    }
  }, [gltf.scene, material, onFailed])

  return <primitive object={gltf.scene} position={position} scale={scale} userData={{ type: 'baked_room_preview' }} />
}

export default BakedRoomPreview
