import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { CARD_COLORS, type HotelRoom, useHotelStore } from './HotelStore'
import { HotelElevator3D } from './HotelElevator3D'

const FLOOR_Y = 4
const ROOM_W = 6
const ROOM_D = 7
const ROOM_H = 3.4
const CORRIDOR_W = 4
const ROOMS_PER_SIDE = 5
const CORRIDOR_LENGTH = ROOM_W * ROOMS_PER_SIDE + 2
const DOOR_W = 1.2
const DOOR_H = 2.35
const WALL_T = 0.18

type Vec3 = [number, number, number]

interface HotelOneFloor3DProps {
  position?: Vec3
}

function HotelDoor3D({
  room,
  onNotice,
}: {
  room: HotelRoom
  onNotice: (message: string) => void
}) {
  const door = useHotelStore((state) => state.doors[room.doorId])
  const playerCard = useHotelStore((state) => state.playerCard)
  const tryAccessDoor = useHotelStore((state) => state.tryAccessDoor)
  const lockDoor = useHotelStore((state) => state.lockDoor)
  const pivotRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!pivotRef.current || !door) return
    const target = door.isOpen ? -Math.PI * 0.48 : 0
    pivotRef.current.rotation.y +=
      (target - pivotRef.current.rotation.y) * Math.min(1, delta * 7)
  })

  if (!door) return null

  const readerColor = door.alarmTriggered
    ? '#ef4444'
    : door.isLocked
      ? CARD_COLORS[door.requiredLevel]
      : '#22c55e'

  return (
    <group position={[-DOOR_W / 2, 0, ROOM_D / 2 + 0.03]}>
      <group ref={pivotRef}>
        <mesh
          position={[DOOR_W / 2, DOOR_H / 2, 0]}
          castShadow
          onClick={(event) => {
            event.stopPropagation()
            const result = tryAccessDoor(room.doorId)
            onNotice(`${room.number}: ${result.message}`)
          }}
          onDoubleClick={(event) => {
            event.stopPropagation()
            lockDoor(room.doorId)
            onNotice(`${room.number}: porte verrouillée`)
          }}
        >
          <boxGeometry args={[DOOR_W, DOOR_H, 0.12]} />
          <meshStandardMaterial
            color="#10172a"
            roughness={0.24}
            metalness={0.45}
            emissive={door.isOpen ? '#1d4ed8' : '#050816'}
            emissiveIntensity={door.isOpen ? 0.24 : 0.06}
          />
        </mesh>

        <mesh position={[DOOR_W - 0.12, DOOR_H / 2, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.11, 12]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {!door.isOpen && (
        <CuboidCollider
          args={[DOOR_W / 2, DOOR_H / 2, 0.07]}
          position={[DOOR_W / 2, DOOR_H / 2, 0]}
        />
      )}

      <mesh
        position={[DOOR_W + 0.28, 1.25, 0.1]}
        onClick={(event) => {
          event.stopPropagation()
          const result = tryAccessDoor(room.doorId)
          onNotice(`${room.number}: ${result.message}`)
        }}
      >
        <boxGeometry args={[0.18, 0.28, 0.07]} />
        <meshStandardMaterial color="#0b1020" emissive={readerColor} emissiveIntensity={0.85} />
      </mesh>

      <Text
        position={[DOOR_W / 2, DOOR_H + 0.25, 0.09]}
        fontSize={0.26}
        color={room.number === '104' ? '#7dd3fc' : '#f8fafc'}
        anchorX="center"
        anchorY="middle"
      >
        {room.number}
      </Text>

      <Text
        position={[DOOR_W + 0.28, 0.9, 0.1]}
        fontSize={0.08}
        color={CARD_COLORS[playerCard.level]}
        anchorX="center"
      >
        {door.isLocked ? 'LOCK' : 'OPEN'}
      </Text>
    </group>
  )
}

function RoomFurniture({ room }: { room: HotelRoom }) {
  const toggleLight = useHotelStore((state) => state.toggleRoomLight)
  const toggleTV = useHotelStore((state) => state.toggleRoomTV)
  const neon = room.number === '104' ? '#60a5fa' : '#3b82f6'

  return (
    <>
      {/* Rug */}
      <mesh position={[0, 0.08, -0.15]} receiveShadow>
        <boxGeometry args={[4.8, 0.05, 3.7]} />
        <meshStandardMaterial color="#14182f" roughness={0.95} />
      </mesh>

      {/* Bed */}
      <mesh position={[1.45, 0.35, -1.9]} castShadow>
        <boxGeometry args={[2.45, 0.35, 3.15]} />
        <meshStandardMaterial color="#211f3d" roughness={0.82} />
      </mesh>
      <mesh position={[1.45, 0.62, -2.45]} castShadow>
        <boxGeometry args={[2.2, 0.22, 1.9]} />
        <meshStandardMaterial color="#9e99c1" roughness={0.7} />
      </mesh>
      <mesh position={[1.45, 0.76, -2.95]} castShadow>
        <boxGeometry args={[2.15, 0.16, 0.75]} />
        <meshStandardMaterial color="#fbfafe" roughness={0.5} />
      </mesh>

      {/* TV */}
      <mesh
        position={[-2.83, 1.65, -0.55]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={(event) => {
          event.stopPropagation()
          toggleTV(room.id)
        }}
      >
        <boxGeometry args={[1.65, 0.92, 0.08]} />
        <meshStandardMaterial
          color={room.tvOn ? '#93c5fd' : '#050816'}
          emissive={room.tvOn ? neon : '#000000'}
          emissiveIntensity={room.tvOn ? 1.2 : 0}
          roughness={0.08}
          metalness={0.4}
        />
      </mesh>

      {/* Speakers */}
      {[-2.0, 0.9].map((z) => (
        <mesh key={z} position={[-2.78, 0.82, z]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.72, 1.5, 0.55]} />
          <meshStandardMaterial color="#111327" roughness={0.36} metalness={0.25} />
        </mesh>
      ))}

      {/* Sofa */}
      <group position={[0.2, 0.52, 1.45]}>
        <mesh castShadow>
          <boxGeometry args={[2.55, 0.42, 0.95]} />
          <meshStandardMaterial color="#1f2158" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.72, 0.4]} castShadow>
          <boxGeometry args={[2.55, 1.15, 0.25]} />
          <meshStandardMaterial color="#1f2158" roughness={0.86} />
        </mesh>
        <mesh position={[-1.16, 0.35, 0]} castShadow>
          <boxGeometry args={[0.25, 0.7, 1.05]} />
          <meshStandardMaterial color="#282347" roughness={0.8} />
        </mesh>
        <mesh position={[1.16, 0.35, 0]} castShadow>
          <boxGeometry args={[0.25, 0.7, 1.05]} />
          <meshStandardMaterial color="#282347" roughness={0.8} />
        </mesh>
      </group>

      {/* Coffee table + tablet */}
      <group position={[0.2, 0.42, 0.15]}>
        <mesh castShadow>
          <boxGeometry args={[1.75, 0.12, 0.9]} />
          <meshStandardMaterial color="#14152f" roughness={0.28} metalness={0.45} />
        </mesh>
        {[
          [-0.72, -0.34],
          [0.72, -0.34],
          [-0.72, 0.34],
          [0.72, 0.34],
        ].map(([x, z], index) => (
          <mesh key={index} position={[x, -0.34, z]}>
            <boxGeometry args={[0.08, 0.68, 0.08]} />
            <meshStandardMaterial color="#383358" metalness={0.72} roughness={0.24} />
          </mesh>
        ))}
        <mesh position={[0.2, 0.1, 0]}>
          <boxGeometry args={[0.62, 0.04, 0.42]} />
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#3b82f6"
            emissiveIntensity={0.35}
            roughness={0.1}
            metalness={0.35}
          />
        </mesh>
      </group>

      {/* Shelf + books */}
      <group position={[2.55, 1.2, 0.05]}>
        <mesh>
          <boxGeometry args={[0.22, 2.2, 2.5]} />
          <meshStandardMaterial color="#383358" roughness={0.52} />
        </mesh>

        {[-0.65, 0, 0.65].map((z, index) => (
          <mesh key={index} position={[-0.28, -0.65 + index * 0.65, z]}>
            <boxGeometry args={[0.65, 0.08, 0.55]} />
            <meshStandardMaterial color="#9e99c1" roughness={0.48} />
          </mesh>
        ))}

        {Array.from({ length: 6 }, (_, index) => (
          <mesh
            key={index}
            position={[
              -0.56,
              -0.55 + (index % 3) * 0.65,
              -0.62 + Math.floor(index / 3) * 1.25,
            ]}
            rotation={[0, 0, (index - 2) * 0.04]}
          >
            <boxGeometry args={[0.22, 0.46, 0.16]} />
            <meshStandardMaterial
              color={['#60a5fa', '#9e99c1', '#d51e24'][index % 3]}
              roughness={0.7}
            />
          </mesh>
        ))}
      </group>

      {/* Neon and wall art */}
      <mesh position={[0, 2.15, -3.4]}>
        <boxGeometry args={[3.7, 0.08, 0.08]} />
        <meshStandardMaterial color={neon} emissive={neon} emissiveIntensity={1.35} />
      </mesh>
      <mesh position={[0, 2.05, -3.38]}>
        <boxGeometry args={[1.1, 0.8, 0.04]} />
        <meshStandardMaterial color="#0f1110" emissive="#1d4ed8" emissiveIntensity={0.15} />
      </mesh>

      {/* Ceiling light */}
      <mesh
        position={[0, 2.72, -0.5]}
        onClick={(event) => {
          event.stopPropagation()
          toggleLight(room.id)
        }}
      >
        <boxGeometry args={[1.45, 0.08, 0.35]} />
        <meshStandardMaterial
          color={room.lightOn ? '#fff7df' : '#374151'}
          emissive={room.lightOn ? '#fff0d0' : '#000000'}
          emissiveIntensity={room.lightOn ? 1 : 0}
        />
      </mesh>

      {room.lightOn && (
        <pointLight
          position={[0, 2.55, -0.5]}
          color={room.number === '104' ? '#dbeafe' : '#fff0d0'}
          intensity={1.55}
          distance={8}
          decay={2}
        />
      )}
    </>
  )
}

function HotelRoomModule({
  room,
  position,
  rotationY,
  onNotice,
}: {
  room: HotelRoom
  position: Vec3
  rotationY: number
  onNotice: (message: string) => void
}) {
  const frontSegmentW = (ROOM_W - DOOR_W) / 2

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={[0, rotationY, 0]}
    >
      {/* Floor */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[ROOM_W, 0.2, ROOM_D]} />
        <meshStandardMaterial color="#1a1c34" roughness={0.92} />
      </mesh>
      <CuboidCollider args={[ROOM_W / 2, 0.1, ROOM_D / 2]} position={[0, 0.1, 0]} />

      {/* Back wall */}
      <mesh position={[0, ROOM_H / 2, -ROOM_D / 2]} castShadow>
        <boxGeometry args={[ROOM_W, ROOM_H, WALL_T]} />
        <meshStandardMaterial color="#282347" roughness={0.8} />
      </mesh>
      <CuboidCollider
        args={[ROOM_W / 2, ROOM_H / 2, WALL_T / 2]}
        position={[0, ROOM_H / 2, -ROOM_D / 2]}
      />

      {/* Side walls */}
      {[-ROOM_W / 2, ROOM_W / 2].map((x) => (
        <group key={x}>
          <mesh position={[x, ROOM_H / 2, 0]} castShadow>
            <boxGeometry args={[WALL_T, ROOM_H, ROOM_D]} />
            <meshStandardMaterial color="#383358" roughness={0.82} />
          </mesh>
          <CuboidCollider
            args={[WALL_T / 2, ROOM_H / 2, ROOM_D / 2]}
            position={[x, ROOM_H / 2, 0]}
          />
        </group>
      ))}

      {/* Front wall split around door */}
      {[-1, 1].map((side) => {
        const x = side * (DOOR_W / 2 + frontSegmentW / 2)
        return (
          <group key={side}>
            <mesh position={[x, ROOM_H / 2, ROOM_D / 2]} castShadow>
              <boxGeometry args={[frontSegmentW, ROOM_H, WALL_T]} />
              <meshStandardMaterial color="#383358" roughness={0.82} />
            </mesh>
            <CuboidCollider
              args={[frontSegmentW / 2, ROOM_H / 2, WALL_T / 2]}
              position={[x, ROOM_H / 2, ROOM_D / 2]}
            />
          </group>
        )
      })}

      <mesh position={[0, DOOR_H + (ROOM_H - DOOR_H) / 2, ROOM_D / 2]} castShadow>
        <boxGeometry args={[DOOR_W, ROOM_H - DOOR_H, WALL_T]} />
        <meshStandardMaterial color="#383358" roughness={0.82} />
      </mesh>
      <CuboidCollider
        args={[DOOR_W / 2, (ROOM_H - DOOR_H) / 2, WALL_T / 2]}
        position={[0, DOOR_H + (ROOM_H - DOOR_H) / 2, ROOM_D / 2]}
      />

      <RoomFurniture room={room} />
      <HotelDoor3D room={room} onNotice={onNotice} />
    </RigidBody>
  )
}

function HotelRamp() {
  const angle = -Math.atan2(FLOOR_Y, 11)
  const length = Math.sqrt(11 * 11 + FLOOR_Y * FLOOR_Y)

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[-CORRIDOR_LENGTH / 2 - 6, FLOOR_Y / 2, 0]}
      rotation={[0, 0, angle]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, 0.28, 2.8]} />
        <meshStandardMaterial color="#30374a" roughness={0.86} />
      </mesh>
      <CuboidCollider args={[length / 2, 0.14, 1.4]} />
    </RigidBody>
  )
}

export function HotelOneFloor3D({
  position = [32, 0, -24],
}: HotelOneFloor3DProps) {
  const rooms = useHotelStore((state) => state.rooms)
  const masterAlarm = useHotelStore((state) => state.masterAlarm)
  const resetAlarm = useHotelStore((state) => state.resetAlarm)
  const [notice, setNotice] = useState('Chambre joueur 104 · code 1042')

  const leftRooms = rooms.filter((room) => room.side === 'left')
  const rightRooms = rooms.filter((room) => room.side === 'right')

  return (
    <group position={position}>
      {/* Corridor and small lobby pad */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, FLOOR_Y - 0.03, 0]} receiveShadow>
          <boxGeometry args={[CORRIDOR_LENGTH, 0.18, CORRIDOR_W]} />
          <meshStandardMaterial color="#161a2c" roughness={0.86} metalness={0.08} />
        </mesh>
        <CuboidCollider
          args={[CORRIDOR_LENGTH / 2, 0.09, CORRIDOR_W / 2]}
          position={[0, FLOOR_Y - 0.03, 0]}
        />

        <mesh position={[0, FLOOR_Y + 0.04, 0]} receiveShadow>
          <boxGeometry args={[CORRIDOR_LENGTH - 1, 0.04, CORRIDOR_W - 0.55]} />
          <meshStandardMaterial color="#2a2d4b" roughness={0.92} />
        </mesh>

        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[10, 0.16, 8]} />
          <meshStandardMaterial color="#20263a" roughness={0.9} />
        </mesh>
        <CuboidCollider args={[5, 0.08, 4]} position={[0, 0.08, 0]} />
      </RigidBody>

      {/* Corridor lighting */}
      {Array.from({ length: 8 }, (_, index) => {
        const x =
          -CORRIDOR_LENGTH / 2 +
          2.4 +
          index * ((CORRIDOR_LENGTH - 4.8) / 7)

        return (
          <group key={index} position={[x, FLOOR_Y + 2.9, 0]}>
            <mesh>
              <boxGeometry args={[1.2, 0.07, 0.28]} />
              <meshStandardMaterial
                color="#fff0d0"
                emissive="#fff0d0"
                emissiveIntensity={0.9}
              />
            </mesh>
            <pointLight intensity={0.55} color="#fff0d0" distance={7} />
          </group>
        )
      })}

      {leftRooms.map((room, index) => {
        const x = (index - (ROOMS_PER_SIDE - 1) / 2) * ROOM_W
        return (
          <HotelRoomModule
            key={room.id}
            room={room}
            position={[x, FLOOR_Y, -(CORRIDOR_W / 2 + ROOM_D / 2)]}
            rotationY={0}
            onNotice={setNotice}
          />
        )
      })}

      {rightRooms.map((room, index) => {
        const x = (index - (ROOMS_PER_SIDE - 1) / 2) * ROOM_W
        return (
          <HotelRoomModule
            key={room.id}
            room={room}
            position={[x, FLOOR_Y, CORRIDOR_W / 2 + ROOM_D / 2]}
            rotationY={Math.PI}
            onNotice={setNotice}
          />
        )
      })}

      <HotelElevator3D position={[CORRIDOR_LENGTH / 2 + 2.4, 0, -1.5]} />
      <HotelRamp />

      <Text
        position={[0, FLOOR_Y + 3.65, -0.2]}
        fontSize={0.42}
        color={masterAlarm ? '#ef4444' : '#7dd3fc'}
        anchorX="center"
        anchorY="middle"
      >
        ETHERWORLD HOTEL — ÉTAGE 1
      </Text>

      <Text
        position={[0, FLOOR_Y + 3.25, -0.2]}
        fontSize={0.18}
        color="#cbd5e1"
        anchorX="center"
        anchorY="middle"
      >
        {notice}
      </Text>

      {masterAlarm && (
        <group position={[0, FLOOR_Y + 3, CORRIDOR_W / 2 - 0.2]}>
          <mesh
            onClick={(event) => {
              event.stopPropagation()
              resetAlarm()
              setNotice('Alarme hôtel réinitialisée')
            }}
          >
            <boxGeometry args={[2.8, 0.36, 0.12]} />
            <meshStandardMaterial color="#3f0a12" emissive="#ef4444" emissiveIntensity={1.2} />
          </mesh>
          <Text
            position={[0, 0, 0.08]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            ALARME — CLIQUER POUR RESET
          </Text>
        </group>
      )}
    </group>
  )
}
