<<<<<<< HEAD
import { useBox, usePlane } from "@react-three/cannon";
import { useMemo } from "react";
import * as THREE from "three";
import BUILDINGS from "../../../data/quebecBuildings";
import { PORTNEUF_ROADS } from "../../../utils/roadNetwork";
import { WORLD_COLLIDER } from "./physicsConfig";

interface DebugColliderProps {
  visible?: boolean;
  color?: string;
  opacity?: number;
}

function GroundCollider({ visible = false }: DebugColliderProps) {
  const [ref] = usePlane(() => ({
    type: "Static",
    position: [0, WORLD_COLLIDER.groundY, 0],
    rotation: [-Math.PI / 2, 0, 0],
    material: "groundMaterial",
  }));

  return (
    <mesh ref={ref} visible={visible} receiveShadow>
      <planeGeometry args={[WORLD_COLLIDER.groundSize, WORLD_COLLIDER.groundSize]} />
      <meshBasicMaterial color="#2dd36f" transparent opacity={0.08} depthWrite={false} />
    </mesh>
  );
=======
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
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
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
}

function RoadCollider({
  position,
  rotationY,
  width,
  length,
  visible = false,
}: {
<<<<<<< HEAD
  position: [number, number, number];
  rotationY: number;
  width: number;
  length: number;
  visible?: boolean;
}) {
  const [ref] = useBox(() => ({
    type: "Static",
    args: [width, WORLD_COLLIDER.roadHeight, length],
    position,
    rotation: [0, rotationY, 0],
    material: "asphaltMaterial",
  }));

  return (
    <mesh ref={ref} visible={visible} receiveShadow>
      <boxGeometry args={[width, WORLD_COLLIDER.roadHeight, length]} />
      <meshBasicMaterial color="#4aa3ff" transparent opacity={0.12} depthWrite={false} />
    </mesh>
  );
=======
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
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
}

function BuildingCollider({
  id,
  position,
  size,
  visible = false,
}: {
<<<<<<< HEAD
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  visible?: boolean;
}) {
  const [ref] = useBox(() => ({
    type: "Static",
    args: size,
    position,
    material: "buildingMaterial",
    userData: { id, kind: "building" },
  }));

  return (
    <mesh ref={ref} visible={visible} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#ff4fd8" transparent opacity={0.11} depthWrite={false} />
    </mesh>
  );
=======
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
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
}

function BuildingPhysicsColliders({ visible = false }: DebugColliderProps) {
  const colliders = useMemo(() => {
    return BUILDINGS.map((b) => {
<<<<<<< HEAD
      const [x, y, z] = b.pos;
      const [w, h, d] = b.size;
      const padding = WORLD_COLLIDER.buildingPadding;
      const safeHeight = Math.max(h, WORLD_COLLIDER.buildingMinHeight);
=======
      const [x, y, z] = b.pos
      const [w, h, d] = b.size
      const padding = WORLD_COLLIDER.buildingPadding
      const safeHeight = Math.max(h, WORLD_COLLIDER.buildingMinHeight)
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)

      return {
        id: b.id,
        name: b.name,
        position: [x, y + safeHeight / 2, z] as [number, number, number],
        size: [w + padding * 2, safeHeight, d + padding * 2] as [number, number, number],
<<<<<<< HEAD
      };
    });
  }, []);
=======
      }
    })
  }, [])
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)

  return (
    <group name="BuildingPhysicsColliders">
      {colliders.map((c) => (
<<<<<<< HEAD
        <BuildingCollider
          key={c.id}
          id={c.id}
          position={c.position}
          size={c.size}
          visible={visible}
        />
      ))}
    </group>
  );
=======
        <BuildingCollider key={c.id} id={c.id} position={c.position} size={c.size} visible={visible} />
      ))}
    </group>
  )
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
}

function RoadPhysicsColliders({ visible = false }: DebugColliderProps) {
  const colliders = useMemo(() => {
    return PORTNEUF_ROADS.map((road) => {
<<<<<<< HEAD
      const dx = road.end[0] - road.start[0];
      const dz = road.end[1] - road.start[1];
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);
      const midX = (road.start[0] + road.end[0]) / 2;
      const midZ = (road.start[1] + road.end[1]) / 2;
=======
      const dx = road.end[0] - road.start[0]
      const dz = road.end[1] - road.start[1]
      const length = Math.sqrt(dx * dx + dz * dz)
      const angle = Math.atan2(dx, dz)
      const midX = (road.start[0] + road.end[0]) / 2
      const midZ = (road.start[1] + road.end[1]) / 2
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)

      return {
        id: road.id,
        position: [midX, 0.015, midZ] as [number, number, number],
        rotationY: angle,
        width: road.width + 2,
        length: length + 2,
<<<<<<< HEAD
      };
    });
  }, []);
=======
      }
    })
  }, [])
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)

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
<<<<<<< HEAD
  );
}

function StaticQuebecPropColliders({ visible = false }: DebugColliderProps) {
  // Colliders simples pour quelques objets décoratifs récurrents ajoutés autour de la Route 138.
  // Ils sont petits et statiques: parfait pour commencer sans alourdir le monde.
  const props = useMemo(() => [
    { id: "sign-route-138", pos: [8, 0.7, -710] as [number, number, number], size: [1.0, 1.4, 0.55] as [number, number, number] },
    { id: "sign-donnacona", pos: [612, 0.7, -6] as [number, number, number], size: [1.0, 1.4, 0.55] as [number, number, number] },
    { id: "sign-batiscan", pos: [-992, 0.7, 31] as [number, number, number], size: [1.0, 1.4, 0.55] as [number, number, number] },
    { id: "stop-portneuf", pos: [8.5, 0.7, 33] as [number, number, number], size: [0.55, 1.4, 0.55] as [number, number, number] },
    { id: "stop-batiscan", pos: [-988, 0.7, 25] as [number, number, number], size: [0.55, 1.4, 0.55] as [number, number, number] },
  ], []);
=======
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
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)

  return (
    <group name="StaticQuebecPropColliders">
      {props.map((p) => (
        <BuildingCollider key={p.id} id={p.id} position={p.pos} size={p.size} visible={visible} />
      ))}
    </group>
<<<<<<< HEAD
  );
=======
  )
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
}

export default function WorldPhysicsColliders({ debug = false }: { debug?: boolean }) {
  return (
    <group name="WorldPhysicsColliders">
      <GroundCollider visible={debug} />
      <RoadPhysicsColliders visible={debug} />
      <BuildingPhysicsColliders visible={debug} />
      <StaticQuebecPropColliders visible={debug} />
    </group>
<<<<<<< HEAD
  );
=======
  )
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
}
