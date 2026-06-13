import { memo, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { MODEL_DEFS, type ModelDef } from '../../../data/ObjectModels'

interface ObjectModelRendererProps {
  modelId: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  doorOpen?: number
  name?: string
  onClick?: (model: ModelDef) => void
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh) {
      mesh.geometry?.dispose?.()
      const mat = mesh.material
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.())
      else mat?.dispose?.()
    }
  })
}

export function getObjectModel(modelId: string): ModelDef | undefined {
  return MODEL_DEFS.find((m) => m.id === modelId)
}

export const ObjectModelRenderer = memo(function ObjectModelRenderer({
  modelId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  doorOpen = 0,
  name,
  onClick,
}: ObjectModelRendererProps) {
  const groupRef = useRef<THREE.Group>(null)
  const model = useMemo(() => getObjectModel(modelId), [modelId])
  const object = useMemo(() => {
    if (!model) return null
    const built = model.build(doorOpen)
    built.userData = {
      ...built.userData,
      type: 'object_model_registry_instance',
      modelId: model.id,
      modelName: model.name,
      category: model.category,
      collision: model.collision,
      walkable: model.walkable,
      isDoor: model.isDoor,
    }
    return built
  }, [doorOpen, model])

  useEffect(() => () => { if (object) disposeObject(object) }, [object])

  if (!model || !object) return null

  const s: [number, number, number] = Array.isArray(scale) ? scale : [scale, scale, scale]

  return (
    <group
      ref={groupRef}
      name={name ?? model.id}
      position={position}
      rotation={rotation}
      scale={s}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(model)
      }}
      userData={{
        type: 'object_model_renderer',
        modelId: model.id,
        modelName: model.name,
        category: model.category,
      }}
    >
      <primitive object={object} />
    </group>
  )
})

export default ObjectModelRenderer
