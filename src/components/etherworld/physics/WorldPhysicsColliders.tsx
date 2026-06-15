import React, { useMemo } from 'react'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import BUILDINGS from '../../../data/quebecBuildings'
import { PORTNEUF_ROADS } from '../../../utils/roadNetwork'
import { WORLD_COLLIDER } from './physicsConfig'

interface DebugColliderProps {
  visible?: boolean
}

function DebugBox({
  size,
  color,
  opacity = 0.12,
}: {
  size: [number, number, number]
  color: string
  opacity?: number
}) {
  return (
    <mesh visible>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

function GroundCollider({ visible = false }: DebugColliderProps) {
  const size: [number, number, number] = [
    WORLD_COLLIDER.groundSize,
    WORLD_COLLIDER.groundThickness,
    WORLD_COLLIDER.groundSize,
  ]

  return (
    <RigidBody type="fixed" colliders={false} position={[0, WORLD_COLLIDER.groundY, 0]} name="GroundCollider">
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} friction={1.05} restitution={0.02} />
      {visible && <DebugBox size={size} color="#2dd36f" opacity={0.08} />}
    </RigidBody>
  )
}

function RoadCollider({
  position,
  rotationY,
  width,
  length,
  visible = false,
}: {
  position: [number, number, number]
  rotationY: number
  width: number
  length: number
  visible?: boolean
}) {
  const size: [number, number, number] = [width, WORLD_COLLIDER.roadHeight, length]

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]} name="RoadCollider">
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} friction={1.25} restitution={0.015} />
      {visible && <DebugBox size={size} color="#4aa3ff" opacity={0.12} />}
    </RigidBody>
  )
}

function BuildingCollider({
  id,
  position,
  size,
  visible = false,
}: {
  id: string
  position: [number, number, number]
  size: [number, number, number]
  visible?: boolean
}) {
  return (
    <RigidBody type="fixed" colliders={false} position={position} name={`BuildingCollider:${id}`} userData={{ id, kind: 'building' }}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} friction={0.95} restitution={0.04} />
      {visible && <DebugBox size={size} color="#ff4fd8" opacity={0.11} />}
    </RigidBody>
  )
}

function BuildingPhysicsColliders({ visible = false }: DebugColliderProps) {
  const colliders = useMemo(() => {
    return BUILDINGS.map((b) => {
      const [x, y, z] = b.pos
      const [w, h, d] = b.size
      const padding = WORLD_COLLIDER.buildingPadding
      const safeHeight = Math.max(h, WORLD_COLLIDER.buildingMinHeight)

      return {
        id: b.id,
        name: b.name,
        position: [x, y + safeHeight / 2, z] as [number, number, number],
        size: [w + padding * 2, safeHeight, d + padding * 2] as [number, number, number],
      }
    })
  }, [])

  return (
    <group name="BuildingPhysicsColliders">
      {colliders.map((c) => (
        <BuildingCollider key={c.id} id={c.id} position={c.position} size={c.size} visible={visible} />
      ))}
    </group>
  )
}

function RoadPhysicsColliders({ visible = false }: DebugColliderProps) {
  const colliders = useMemo(() => {
    return PORTNEUF_ROADS.map((road) => {
      const dx = road.end[0] - road.start[0]
      const dz = road.end[1] - road.start[1]
      const length = Math.sqrt(dx * dx + dz * dz)
      const angle = Math.atan2(dx, dz)
      const midX = (road.start[0] + road.end[0]) / 2
      const midZ = (road.start[1] + road.end[1]) / 2

      return {
        id: road.id,
        position: [midX, 0.015, midZ] as [number, number, number],
        rotationY: angle,
        width: road.width + 2,
        length: length + 2,
      }
    })
  }, [])

  return (
    <group name="RoadPhysicsColliders">
      {colliders.map((c) => (
        <RoadCollider
          key={c.id}
          position={c.position}
          rotationY={c.rotationY}
          width={c.width}
          length={c.length}
          visible={visible}
        />
      ))}
    </group>
  )
}

function StaticQuebecPropColliders({ visible = false }: DebugColliderProps) {
  const props = useMemo(() => [
    { id: 'sign-route-138', pos: [8, 0.7, -710] as [number, number, number], size: [1.0, 1.4, 0.55] as [number, number, number] },
    { id: 'sign-donnacona', pos: [612, 0.7, -6] as [number, number, number], size: [1.0, 1.4, 0.55] as [number, number, number] },
    { id: 'sign-batiscan', pos: [-992, 0.7, 31] as [number, number, number], size: [1.0, 1.4, 0.55] as [number, number, number] },
    { id: 'stop-portneuf', pos: [8.5, 0.7, 33] as [number, number, number], size: [0.55, 1.4, 0.55] as [number, number, number] },
    { id: 'stop-batiscan', pos: [-988, 0.7, 25] as [number, number, number], size: [0.55, 1.4, 0.55] as [number, number, number] },
  ], [])

  return (
    <group name="StaticQuebecPropColliders">
      {props.map((p) => (
        <BuildingCollider key={p.id} id={p.id} position={p.pos} size={p.size} visible={visible} />
      ))}
    </group>
  )
}

export default function WorldPhysicsColliders({ debug = false }: { debug?: boolean }) {
  return (
    <group name="WorldPhysicsColliders">
      <GroundCollider visible={debug} />
      <RoadPhysicsColliders visible={debug} />
      <BuildingPhysicsColliders visible={debug} />
      <StaticQuebecPropColliders visible={debug} />
    </group>
  )
}
