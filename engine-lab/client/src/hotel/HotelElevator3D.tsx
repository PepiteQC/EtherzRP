import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useHotelStore } from './HotelStore'

const FLOOR_HEIGHT = 4
const SHAFT_W = 3
const SHAFT_D = 3

interface HotelElevator3DProps {
  position?: [number, number, number]
}

export function HotelElevator3D({
  position = [0, 0, 0],
}: HotelElevator3DProps) {
  const elevator = useHotelStore((state) => state.elevator)
  const callElevator = useHotelStore((state) => state.callElevator)
  const moveElevator = useHotelStore((state) => state.moveElevator)

  const cabinRef = useRef<THREE.Group>(null)
  const leftDoorRef = useRef<THREE.Mesh>(null)
  const rightDoorRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    const cabin = cabinRef.current
    if (!cabin) return

    const targetY = elevator.targetFloor * FLOOR_HEIGHT + 0.15
    const diff = targetY - cabin.position.y

    if (Math.abs(diff) > 0.035) {
      cabin.position.y += diff * Math.min(1, delta * 2.2)
      moveElevator(cabin.position.y / FLOOR_HEIGHT)
    } else {
      cabin.position.y = targetY

      if (elevator.isMoving) {
        useHotelStore.setState((state) => ({
          elevator: {
            ...state.elevator,
            currentFloor: state.elevator.targetFloor,
            isMoving: false,
            doorsOpen: true,
          },
        }))
      }
    }

    const openOffset = elevator.doorsOpen ? 0.58 : 0

    if (leftDoorRef.current) {
      leftDoorRef.current.position.x +=
        (-openOffset - leftDoorRef.current.position.x) *
        Math.min(1, delta * 6)
    }

    if (rightDoorRef.current) {
      rightDoorRef.current.position.x +=
        (openOffset - rightDoorRef.current.position.x) *
        Math.min(1, delta * 6)
    }
  })

  return (
    <group position={position}>
      {/* Cage: RDC + étage 1 */}
      <mesh position={[0, FLOOR_HEIGHT, -SHAFT_D / 2]} castShadow>
        <boxGeometry args={[SHAFT_W, FLOOR_HEIGHT * 2, 0.16]} />
        <meshStandardMaterial color="#0a0f18" metalness={0.85} roughness={0.2} />
      </mesh>

      <mesh position={[-SHAFT_W / 2, FLOOR_HEIGHT, 0]}>
        <boxGeometry args={[0.08, FLOOR_HEIGHT * 2, SHAFT_D]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.14} roughness={0.03} />
      </mesh>

      <mesh position={[SHAFT_W / 2, FLOOR_HEIGHT, 0]}>
        <boxGeometry args={[0.08, FLOOR_HEIGHT * 2, SHAFT_D]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.14} roughness={0.03} />
      </mesh>

      {[-SHAFT_W / 2 - 0.05, SHAFT_W / 2 + 0.05].map((x) => (
        <mesh key={x} position={[x, FLOOR_HEIGHT, SHAFT_D / 2]}>
          <boxGeometry args={[0.06, FLOOR_HEIGHT * 2, 0.06]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.95} roughness={0.08} />
        </mesh>
      ))}

      {[0, 1].map((floor) => (
        <group key={floor} position={[0, floor * FLOOR_HEIGHT, SHAFT_D / 2]}>
          <mesh position={[-0.82, FLOOR_HEIGHT / 2, 0]} castShadow>
            <boxGeometry args={[0.08, FLOOR_HEIGHT * 0.85, 0.12]} />
            <meshStandardMaterial color="#374151" metalness={0.55} />
          </mesh>

          <mesh position={[0.82, FLOOR_HEIGHT / 2, 0]} castShadow>
            <boxGeometry args={[0.08, FLOOR_HEIGHT * 0.85, 0.12]} />
            <meshStandardMaterial color="#374151" metalness={0.55} />
          </mesh>

          <mesh position={[0, FLOOR_HEIGHT * 0.92, 0]}>
            <boxGeometry args={[1.72, 0.08, 0.12]} />
            <meshStandardMaterial color="#374151" metalness={0.55} />
          </mesh>

          <mesh
            position={[1.05, FLOOR_HEIGHT / 2, 0.09]}
            onClick={(event) => {
              event.stopPropagation()
              callElevator(floor)
            }}
          >
            <boxGeometry args={[0.18, 0.25, 0.06]} />
            <meshStandardMaterial
              color="#0b1020"
              emissive={Math.round(elevator.currentFloor) === floor ? '#22c55e' : '#c9a84c'}
              emissiveIntensity={0.8}
            />
          </mesh>

          <Text
            position={[0, FLOOR_HEIGHT * 0.98, 0.13]}
            fontSize={0.12}
            color="#22c55e"
            anchorX="center"
            anchorY="middle"
          >
            {floor === 0 ? 'RDC' : '1'}
          </Text>
        </group>
      ))}

      {/* Cabine */}
      <group ref={cabinRef} position={[0, 0.15, 0]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[SHAFT_W - 0.3, 0.1, SHAFT_D - 0.3]} />
          <meshStandardMaterial color="#c8b89a" roughness={0.12} metalness={0.15} />
        </mesh>

        <mesh position={[0, FLOOR_HEIGHT - 0.2, 0]}>
          <boxGeometry args={[SHAFT_W - 0.3, 0.08, SHAFT_D - 0.3]} />
          <meshStandardMaterial color="#1a2030" metalness={0.85} roughness={0.15} />
        </mesh>

        <mesh position={[0, FLOOR_HEIGHT - 0.25, 0]}>
          <boxGeometry args={[1.2, 0.03, 1.2]} />
          <meshStandardMaterial
            color="#fff0d0"
            emissive="#fff0d0"
            emissiveIntensity={0.8}
          />
        </mesh>

        <pointLight position={[0, FLOOR_HEIGHT - 0.35, 0]} intensity={0.8} color="#fff0d0" distance={5} />

        <mesh position={[0, FLOOR_HEIGHT / 2, -SHAFT_D / 2 + 0.2]}>
          <boxGeometry args={[SHAFT_W - 0.35, FLOOR_HEIGHT - 0.3, 0.08]} />
          <meshStandardMaterial color="#121820" roughness={0.15} metalness={0.9} />
        </mesh>

        <mesh position={[-SHAFT_W / 2 + 0.2, FLOOR_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.08, FLOOR_HEIGHT - 0.3, SHAFT_D - 0.35]} />
          <meshStandardMaterial color="#121820" roughness={0.15} metalness={0.9} />
        </mesh>

        <mesh position={[SHAFT_W / 2 - 0.2, FLOOR_HEIGHT / 2, 0]}>
          <boxGeometry args={[0.08, FLOOR_HEIGHT - 0.3, SHAFT_D - 0.35]} />
          <meshStandardMaterial color="#121820" roughness={0.15} metalness={0.9} />
        </mesh>

        <mesh position={[0, FLOOR_HEIGHT * 0.8, SHAFT_D / 2 - 0.15]}>
          <boxGeometry args={[SHAFT_W - 0.5, FLOOR_HEIGHT * 0.25, 0.06]} />
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.2} roughness={0.03} />
        </mesh>

        <mesh ref={leftDoorRef} position={[-0.58, FLOOR_HEIGHT * 0.4, SHAFT_D / 2 - 0.15]}>
          <boxGeometry args={[1, FLOOR_HEIGHT * 0.7, 0.06]} />
          <meshStandardMaterial color="#2a3040" metalness={0.8} roughness={0.2} />
        </mesh>

        <mesh ref={rightDoorRef} position={[0.58, FLOOR_HEIGHT * 0.4, SHAFT_D / 2 - 0.15]}>
          <boxGeometry args={[1, FLOOR_HEIGHT * 0.7, 0.06]} />
          <meshStandardMaterial color="#2a3040" metalness={0.8} roughness={0.2} />
        </mesh>

        {[0, 1].map((floor) => (
          <mesh
            key={floor}
            position={[SHAFT_W / 2 - 0.23, FLOOR_HEIGHT / 2 - 0.1 + floor * 0.2, 0.28]}
            rotation={[0, 0, Math.PI / 2]}
            onClick={(event) => {
              event.stopPropagation()
              callElevator(floor)
            }}
          >
            <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
            <meshStandardMaterial
              color={elevator.targetFloor === floor ? '#c9a84c' : '#6b7280'}
              emissive={elevator.targetFloor === floor ? '#ffd060' : '#000000'}
              emissiveIntensity={elevator.targetFloor === floor ? 0.8 : 0}
              metalness={0.8}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
