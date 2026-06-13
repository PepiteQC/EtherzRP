/**
 * src/buildings/hotel/modules/room/HotelRoomModule.tsx
 * Chambre 3D modulaire avec architecture + sécurité temps réel.
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'
import type { DoorBase, RoomBase } from '../../../shared/types'
import { HotelSecurityDoor } from '../../security/HotelSecurityDoor'
import { HotelRoomArchitecture } from './HotelRoomArchitecture'

interface HotelRoomModuleProps {
  room: RoomBase
  door?: DoorBase
  position?: [number, number, number]
  onDoorClick?: (roomId: string) => void
}

function createWallTexture(accent: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#332820'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 700; i++) {
    const v = 38 + Math.random() * 18
    ctx.fillStyle = `rgba(${v + 20},${v + 12},${v + 8},.045)`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2)
  }
  ctx.strokeStyle = accent + '22'
  ctx.strokeRect(8, 8, 240, 240)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 2)
  tex.needsUpdate = true
  return tex
}

export const HotelRoomModule = memo(function HotelRoomModule({
  room,
  door,
  position = [0, 0, 0],
  onDoorClick,
}: HotelRoomModuleProps) {
  const { architectural, id, side } = room
  const roomW = architectural.roomWidth
  const roomD = architectural.roomDepth
  const roomH = architectural.height
  const isLeft = side === 'left'
  const accent = isLeft ? '#22c55e' : '#38bdf8'

  const wallTex = useMemo(() => createWallTexture(accent), [accent])

  const doorPosition: [number, number, number] = [
    isLeft ? -roomW / 2 + 0.06 : roomW / 2 - 0.06,
    0,
    0,
  ]
  const doorRotation: [number, number, number] = [0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]

  return (
    <group
      position={position}
      userData={{
        roomId: id,
        buildingId: 'hotel_main',
        type: 'hotel_room',
        realtimeSecurity: !!door,
      }}
    >
      {/* Floor */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW, roomD]} />
        <meshStandardMaterial color="#c8c0b4" roughness={0.62} metalness={0.05} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, roomH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW, roomD]} />
        <meshStandardMaterial color="#171923" roughness={0.9} />
      </mesh>

      {/* Corridor wall */}
      <mesh
        position={[isLeft ? -roomW / 2 + 0.01 : roomW / 2 - 0.01, roomH / 2, 0]}
        rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[roomD, roomH]} />
        <meshStandardMaterial map={wallTex} color="#3a2a22" roughness={0.82} />
      </mesh>

      {/* Outer wall */}
      <mesh
        position={[isLeft ? roomW / 2 - 0.01 : -roomW / 2 + 0.01, roomH / 2, 0]}
        rotation={[0, isLeft ? -Math.PI / 2 : Math.PI / 2, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[roomD, roomH]} />
        <meshStandardMaterial map={wallTex} color="#302a2a" roughness={0.84} />
      </mesh>

      {/* Back/front walls */}
      {[-roomD / 2 + 0.01, roomD / 2 - 0.01].map((z) => (
        <mesh key={z} position={[0, roomH / 2, z]} castShadow receiveShadow>
          <planeGeometry args={[roomW, roomH]} />
          <meshStandardMaterial map={wallTex} color="#342b25" roughness={0.84} />
        </mesh>
      ))}

      {/* Window on outer wall */}
      <mesh position={[isLeft ? roomW / 2 - 0.03 : -roomW / 2 + 0.03, roomH / 2 + 0.25, roomD * 0.1]} rotation={[0, isLeft ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <boxGeometry args={[2.15, 1.25, 0.045]} />
        <meshStandardMaterial color="#1e3a5f" emissive="#38bdf8" emissiveIntensity={0.16} metalness={0.45} roughness={0.14} transparent opacity={0.74} />
      </mesh>

      <HotelRoomArchitecture room={room} roomW={roomW} roomD={roomD} roomH={roomH} />

      {door && (
        <HotelSecurityDoor
          room={room}
          door={door}
          position={doorPosition}
          rotation={doorRotation}
          onGranted={(roomId) => onDoorClick?.(roomId)}
          onDenied={(roomId) => console.warn(`[HotelRoomModule] Access denied: ${roomId}`)}
        />
      )}
    </group>
  )
})
