import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'

export type LabToolId =
  | 'select'
  | 'cube'
  | 'wall'
  | 'floor'
  | 'door'
  | 'light'
  | 'tree'
  | 'column'
  | 'platform'

export interface LabObject {
  id: string
  type: Exclude<LabToolId, 'select'>
  label: string
  color: string
  position: [number, number, number]
  rotationY: number
  scale: number
  createdFrom: 'manual' | 'troxt'
}

export interface SceneTemplate {
  type: Exclude<LabToolId, 'select'>
  label: string
  color: string
  size: [number, number, number]
}

export const SCENE_TEMPLATES: Record<Exclude<LabToolId, 'select'>, SceneTemplate> = {
  cube: {
    type: 'cube',
    label: 'Cube',
    color: '#d97706',
    size: [1, 1, 1],
  },
  wall: {
    type: 'wall',
    label: 'Wall',
    color: '#a16207',
    size: [2.6, 2.4, 0.2],
  },
  floor: {
    type: 'floor',
    label: 'Floor',
    color: '#7c5c46',
    size: [2.4, 0.16, 2.4],
  },
  door: {
    type: 'door',
    label: 'Door',
    color: '#b45309',
    size: [1, 2.1, 0.12],
  },
  light: {
    type: 'light',
    label: 'Light',
    color: '#facc15',
    size: [0.5, 0.5, 0.5],
  },
  tree: {
    type: 'tree',
    label: 'Tree',
    color: '#15803d',
    size: [1.2, 3.2, 1.2],
  },
  column: {
    type: 'column',
    label: 'Column',
    color: '#94a3b8',
    size: [0.8, 2.8, 0.8],
  },
  platform: {
    type: 'platform',
    label: 'Platform',
    color: '#0f766e',
    size: [3.2, 0.4, 3.2],
  },
}

function getScaledSize(object: LabObject) {
  const template = SCENE_TEMPLATES[object.type]
  return template.size.map((value) => value * object.scale) as [number, number, number]
}

function GroundPlane(props: {
  showGrid: boolean
  showAxes: boolean
  ghostPosition: [number, number, number] | null
  onHover: (point: [number, number, number]) => void
  onPlace: (point: [number, number, number]) => void
}) {
  return (
    <group>
      {props.showGrid ? <gridHelper args={[80, 80, '#5c6f64', '#24332d']} position={[0, 0.001, 0]} /> : null}
      {props.showAxes ? <axesHelper args={[6]} /> : null}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerMove={(event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation()
          props.onHover([event.point.x, 0, event.point.z])
        }}
        onClick={(event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation()
          props.onPlace([event.point.x, 0, event.point.z])
        }}
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#101917" roughness={0.98} metalness={0.02} />
      </mesh>

      {props.ghostPosition ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[props.ghostPosition[0], 0.02, props.ghostPosition[2]]}>
          <ringGeometry args={[0.3, 0.46, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.95} />
        </mesh>
      ) : null}
    </group>
  )
}

function ObjectShell(props: {
  object: LabObject
  selected: boolean
  showLabels: boolean
  onSelect: (id: string) => void
}) {
  const size = getScaledSize(props.object)
  const highlightSize = size.map((value) => value + 0.08) as [number, number, number]

  return (
    <group
      position={props.object.position}
      rotation={[0, props.object.rotationY, 0]}
      onClick={(event) => {
        event.stopPropagation()
        props.onSelect(props.object.id)
      }}
    >
      <ObjectMesh object={props.object} />

      {props.selected ? (
        <mesh position={[0, size[1] / 2 + 0.02, 0]}>
          <boxGeometry args={highlightSize} />
          <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.9} />
        </mesh>
      ) : null}

      {props.showLabels ? (
        <Html position={[0, size[1] + 0.32, 0]} center distanceFactor={16}>
          <div className="lab-scene-label">
            {props.object.label}
            <span>{props.object.createdFrom}</span>
          </div>
        </Html>
      ) : null}
    </group>
  )
}

function ObjectMesh({ object }: { object: LabObject }) {
  const size = getScaledSize(object)

  if (object.type === 'wall' || object.type === 'floor' || object.type === 'door' || object.type === 'platform') {
    return (
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={object.color} roughness={0.84} metalness={0.08} />
      </mesh>
    )
  }

  if (object.type === 'cube') {
    return (
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={object.color} roughness={0.46} metalness={0.18} />
      </mesh>
    )
  }

  if (object.type === 'column') {
    return (
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 24]} />
        <meshStandardMaterial color={object.color} roughness={0.34} metalness={0.18} />
      </mesh>
    )
  }

  if (object.type === 'light') {
    return (
      <group>
        <mesh castShadow position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 2.2, 18]} />
          <meshStandardMaterial color="#334155" roughness={0.42} metalness={0.45} />
        </mesh>
        <mesh castShadow position={[0, 1.45, 0]}>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={0.8} />
        </mesh>
        <pointLight position={[0, 1.45, 0]} intensity={6} distance={9} color={object.color} />
      </group>
    )
  }

  if (object.type === 'tree') {
    return (
      <group>
        <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.18, 0.24, 1.4, 16]} />
          <meshStandardMaterial color="#78350f" roughness={0.92} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 2.1, 0]}>
          <coneGeometry args={[0.95, 2.4, 18]} />
          <meshStandardMaterial color={object.color} roughness={0.88} />
        </mesh>
      </group>
    )
  }

  return null
}

function GhostObject(props: {
  activeTool: LabToolId
  ghostPosition: [number, number, number] | null
  rotationY: number
}) {
  const ghostObject = useMemo<LabObject | null>(() => {
    if (props.activeTool === 'select' || !props.ghostPosition) return null

    return {
      id: 'ghost',
      type: props.activeTool,
      label: 'Ghost',
      color: '#f59e0b',
      position: props.ghostPosition,
      rotationY: props.rotationY,
      scale: 1,
      createdFrom: 'manual',
    }
  }, [props.activeTool, props.ghostPosition, props.rotationY])

  if (!ghostObject) return null

  const size = getScaledSize(ghostObject)

  return (
    <group position={ghostObject.position} rotation={[0, ghostObject.rotationY, 0]}>
      {ghostObject.type === 'tree' || ghostObject.type === 'light' ? (
        <group scale={[1, 1, 1]}>
          <ObjectMesh object={ghostObject} />
          <mesh position={[0, size[1] / 2, 0]}>
            <boxGeometry args={size.map((value) => value + 0.06) as [number, number, number]} />
            <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.72} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, size[1] / 2, 0]}>
          <boxGeometry args={size} />
          <meshStandardMaterial color="#f59e0b" transparent opacity={0.4} roughness={0.72} />
        </mesh>
      )}
    </group>
  )
}

export function LabScene(props: {
  objects: LabObject[]
  selectedId: string | null
  showGrid: boolean
  showAxes: boolean
  showLabels: boolean
  activeTool: LabToolId
  ghostPosition: [number, number, number] | null
  ghostRotationY: number
  onHoverGround: (point: [number, number, number]) => void
  onPlaceAtPoint: (point: [number, number, number]) => void
  onSelectObject: (id: string | null) => void
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [16, 14, 16], fov: 44 }}
      onPointerMissed={() => props.onSelectObject(null)}
    >
      <color attach="background" args={['#06100f']} />
      <fog attach="fog" args={['#06100f', 24, 90]} />
      <ambientLight intensity={0.6} color="#d7efe4" />
      <hemisphereLight intensity={0.55} groundColor="#0d1312" color="#d8f3dc" />
      <directionalLight
        castShadow
        position={[12, 18, 8]}
        intensity={1.8}
        color="#fff5d6"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <GroundPlane
        showGrid={props.showGrid}
        showAxes={props.showAxes}
        ghostPosition={props.ghostPosition}
        onHover={props.onHoverGround}
        onPlace={props.onPlaceAtPoint}
      />

      {props.objects.map((object) => (
        <ObjectShell
          key={object.id}
          object={object}
          selected={object.id === props.selectedId}
          showLabels={props.showLabels}
          onSelect={props.onSelectObject}
        />
      ))}

      <GhostObject
        activeTool={props.activeTool}
        ghostPosition={props.ghostPosition}
        rotationY={props.ghostRotationY}
      />

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.05} />
    </Canvas>
  )
}
