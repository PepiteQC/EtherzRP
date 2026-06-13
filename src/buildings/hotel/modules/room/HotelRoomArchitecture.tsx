'use client'

import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { RoomBase } from '../../../shared/types'

interface HotelRoomArchitectureProps {
  room: RoomBase
  roomW: number
  roomD: number
  roomH: number
}

const Lamp = memo(function Lamp({ position }: { position: [number, number, number] }) {
  const light = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    if (light.current) light.current.intensity = 0.45 + Math.sin(state.clock.elapsedTime * 1.6 + position[0]) * 0.05
  })
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.12, 0.18, 0.22, 12]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.35} />
      </mesh>
      <pointLight ref={light} position={[0, -0.1, 0]} color="#fef3c7" intensity={0.45} distance={5} decay={2} />
    </group>
  )
})

const SafeNumpad = memo(function SafeNumpad({ roomId }: { roomId: string }) {
  return (
    <group userData={{ type: 'hotel_room_safe', roomId, security: 'numpad' }}>
      <mesh castShadow>
        <boxGeometry args={[0.72, 0.62, 0.5]} />
        <meshStandardMaterial color="#2f343d" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.1, 0.265]}>
        <boxGeometry args={[0.34, 0.18, 0.025]} />
        <meshStandardMaterial color="#020617" emissive="#22c55e" emissiveIntensity={0.2} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-0.12 + (i % 3) * 0.12, -0.16 - Math.floor(i / 3) * 0.08, 0.28]}>
          <boxGeometry args={[0.06, 0.045, 0.02]} />
          <meshStandardMaterial color="#111827" metalness={0.35} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
})

export const HotelRoomArchitecture = memo(function HotelRoomArchitecture({
  room,
  roomW,
  roomD,
  roomH,
}: HotelRoomArchitectureProps) {
  const accent = room.side === 'left' ? '#22c55e' : '#38bdf8'
  const layout = useMemo(() => ({
    bedX: room.side === 'left' ? roomW * 0.18 : -roomW * 0.18,
    deskX: room.side === 'left' ? -roomW * 0.27 : roomW * 0.27,
  }), [room.side, roomW])

  return (
    <group userData={{ type: 'hotel_room_architecture', roomId: room.id }}>
      {/* Lit queen */}
      <group position={[layout.bedX, 0.42, -roomD * 0.18]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.35, 0.55, 2.55]} />
          <meshStandardMaterial color="#19151f" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.35, 0.05]} castShadow>
          <boxGeometry args={[2.22, 0.22, 2.28]} />
          <meshStandardMaterial color="#e5dfd2" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.55, -0.85]}>
          <boxGeometry args={[2.25, 0.36, 0.18]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.08} roughness={0.8} />
        </mesh>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.62, -0.72]} castShadow>
            <boxGeometry args={[0.65, 0.16, 0.45]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Bureau + terminal hôtel */}
      <group position={[layout.deskX, 0.75, roomD * 0.16]}>
        <mesh castShadow>
          <boxGeometry args={[1.55, 0.12, 0.75]} />
          <meshStandardMaterial color="#4a3326" roughness={0.55} />
        </mesh>
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, -0.35, 0.24]}>
            <boxGeometry args={[0.08, 0.7, 0.08]} />
            <meshStandardMaterial color="#2b211b" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0.25, 0.28, 0]}>
          <boxGeometry args={[0.55, 0.38, 0.035]} />
          <meshStandardMaterial color="#020617" emissive="#38bdf8" emissiveIntensity={0.18} />
        </mesh>
        <Text position={[0.25, 0.28, 0.03]} fontSize={0.055} color="#dff6ff" anchorX="center">
          ROOM OS
        </Text>
      </group>

      {/* Mini cuisine */}
      <group position={[-roomW * 0.32, 0.55, -roomD * 0.43]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.1, 0.52]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.45} metalness={0.25} />
        </mesh>
        <mesh position={[0.45, 0.65, 0.28]}>
          <boxGeometry args={[0.48, 0.16, 0.035]} />
          <meshStandardMaterial color="#020617" emissive="#f59e0b" emissiveIntensity={0.16} />
        </mesh>
      </group>

      {/* Salle de bain compact */}
      <group position={[roomW * 0.32, 0.02, roomD * 0.37]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[2.05, 2.4, 1.75]} />
          <meshStandardMaterial color="#e7e1d8" roughness={0.62} transparent opacity={0.32} />
        </mesh>
        <mesh position={[-0.55, 0.28, 0.25]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.5, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
        <mesh position={[0.55, 0.45, 0.25]} castShadow>
          <boxGeometry args={[0.64, 0.28, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
      </group>

      {/* Coffre-fort sécurisé */}
      {room.hasSafe && (
        <group position={[roomW * 0.38, 0.82, -roomD * 0.34]}>
          <SafeNumpad roomId={room.id} />
        </group>
      )}

      {/* Luminaires */}
      <Lamp position={[-roomW * 0.25, roomH - 0.28, 0]} />
      <Lamp position={[roomW * 0.25, roomH - 0.28, 0]} />

      {/* Plaque chambre */}
      <Text position={[0, roomH - 0.45, -roomD * 0.48]} fontSize={0.14} color={accent} anchorX="center">
        CHAMBRE {room.number} · NFC + NUMPAD
      </Text>
    </group>
  )
})
