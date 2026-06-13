'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { DoorBase, RoomBase } from '../../shared/types'
import { HOTEL_SECURITY_DEFAULTS } from '../core/HotelRegistry'
import { useHotelSecurity } from './useHotelSecurity'
import type { HotelAccessMethod } from './HotelSecurityTypes'

interface HotelSecurityDoorProps {
  room: RoomBase
  door: DoorBase
  position?: [number, number, number]
  rotation?: [number, number, number]
  onGranted?: (roomId: string) => void
  onDenied?: (roomId: string, message: string) => void
}

const STATUS_COLORS = {
  locked: '#ef4444',
  unlocked: '#22c55e',
  open: '#38bdf8',
  alarm: '#f97316',
  lockout: '#a855f7',
} as const

function makeDoorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, '#1a1725')
  grad.addColorStop(0.5, '#201827')
  grad.addColorStop(1, '#120f18')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = 'rgba(255,255,255,.06)'
  ctx.strokeRect(16, 24, 96, 82)
  ctx.strokeRect(16, 132, 96, 82)
  for (let y = 0; y < canvas.height; y += 3) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.015})`
    ctx.fillRect(0, y, canvas.width, 1)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

const ReaderPanel = memo(function ReaderPanel({
  color,
  stateLabel,
  onCard,
  onPin,
}: {
  color: string
  stateLabel: string
  onCard: () => void
  onPin: (pin: string) => void
}) {
  const ledRef = useRef<THREE.Mesh>(null)
  const [pin, setPin] = useState('')

  useFrame((state) => {
    if (!ledRef.current) return
    const mat = ledRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.45 + Math.sin(state.clock.elapsedTime * 5) * 0.18
  })

  const press = useCallback((key: string) => {
    if (key === 'C') {
      setPin('')
      return
    }
    if (key === 'E') {
      onPin(pin)
      setPin('')
      return
    }
    setPin((p) => (p.length < 4 ? p + key : p))
  }, [onPin, pin])

  const keys = ['1','2','3','4','5','6','7','8','9','C','0','E']

  return (
    <group position={[0.78, 1.25, 0.08]}>
      <mesh castShadow>
        <boxGeometry args={[0.34, 0.72, 0.07]} />
        <meshStandardMaterial color="#111827" metalness={0.55} roughness={0.32} />
      </mesh>

      <mesh position={[0, 0.24, 0.045]} onClick={onCard} userData={{ interaction: 'magnetic_card' }}>
        <boxGeometry args={[0.24, 0.13, 0.012]} />
        <meshStandardMaterial color="#020617" emissive={color} emissiveIntensity={0.22} />
      </mesh>
      <Text position={[0, 0.24, 0.055]} fontSize={0.035} color="#e5e7eb" anchorX="center" anchorY="middle">
        CARD
      </Text>

      <mesh position={[0, 0.08, 0.046]}>
        <boxGeometry args={[0.24, 0.07, 0.012]} />
        <meshStandardMaterial color="#06111f" emissive={color} emissiveIntensity={0.16} />
      </mesh>
      <Text position={[0, 0.08, 0.057]} fontSize={0.032} color={color} anchorX="center" anchorY="middle">
        {pin ? '•'.repeat(pin.length) : stateLabel}
      </Text>

      <mesh ref={ledRef} position={[0.13, 0.325, 0.05]}>
        <sphereGeometry args={[0.018, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      <group position={[0, -0.18, 0.052]}>
        {keys.map((key, i) => {
          const x = -0.09 + (i % 3) * 0.09
          const y = 0.16 - Math.floor(i / 3) * 0.08
          const keyColor = key === 'E' ? '#22c55e' : key === 'C' ? '#ef4444' : '#334155'
          return (
            <group key={key} position={[x, y, 0]} onClick={() => press(key)} userData={{ interaction: 'numpad_key', key }}>
              <mesh>
                <boxGeometry args={[0.064, 0.052, 0.014]} />
                <meshStandardMaterial color={keyColor} emissive={keyColor} emissiveIntensity={0.08} />
              </mesh>
              <Text position={[0, 0, 0.012]} fontSize={0.028} color="#ffffff" anchorX="center" anchorY="middle">
                {key}
              </Text>
            </group>
          )
        })}
      </group>
    </group>
  )
})

export const HotelSecurityDoor = memo(function HotelSecurityDoor({
  room,
  door,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onGranted,
  onDenied,
}: HotelSecurityDoorProps) {
  const doorGroup = useRef<THREE.Group>(null)
  const panelRef = useRef<THREE.Mesh>(null)
  const { getDoorState, requestAccess, toggleOpen } = useHotelSecurity()
  const state = getDoorState(door.id)
  const [lastMessage, setLastMessage] = useState('PRÊT')

  const color = STATUS_COLORS[state?.state || 'locked']
  const roomNumber = String(room.number)

  const doorTexture = useMemo(() => makeDoorTexture(), [])

  useFrame((_, delta) => {
    if (doorGroup.current) {
      const target = state?.isOpen ? -Math.PI / 2 : 0
      doorGroup.current.rotation.y = THREE.MathUtils.damp(doorGroup.current.rotation.y, target, 10, delta)
    }
    if (panelRef.current) {
      const mat = panelRef.current.material as THREE.MeshStandardMaterial
      mat.emissive.set(color)
      mat.emissiveIntensity = state?.isLocked ? 0.06 : 0.22
    }
  })

  const attempt = useCallback(async (method: HotelAccessMethod, value?: string) => {
    const result = await requestAccess({
      roomId: room.id,
      doorId: door.id,
      lockId: door.lockId,
      method,
      actorId: 'player-local',
      cardUid: method === 'magnetic_card' ? (value || HOTEL_SECURITY_DEFAULTS.defaultCardUid) : undefined,
      pin: method === 'numpad' ? value : undefined,
    })
    setLastMessage(result.message.toUpperCase())
    if (result.granted) onGranted?.(room.id)
    else onDenied?.(room.id, result.message)
  }, [door.id, door.lockId, onDenied, onGranted, requestAccess, room.id])

  const clickDoor = useCallback(() => {
    if (!state || state.isLocked) {
      attempt('connected_app')
      return
    }
    toggleOpen(door.id)
  }, [attempt, door.id, state, toggleOpen])

  return (
    <group
      position={position}
      rotation={rotation}
      userData={{
        type: 'hotel_security_door',
        roomId: room.id,
        doorId: door.id,
        lockId: door.lockId,
        realtime: true,
        supports: ['magnetic_card', 'numpad', 'connected_app'],
      }}
    >
      {/* frame */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.36, 2.55, 0.16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.2, 0.09]}>
        <boxGeometry args={[1.16, 2.35, 0.05]} />
        <meshStandardMaterial color="#020617" emissive={color} emissiveIntensity={0.08} />
      </mesh>

      {/* hinge group */}
      <group ref={doorGroup} position={[-0.5, 0, 0.13]}>
        <mesh ref={panelRef} position={[0.5, 1.17, 0]} castShadow onClick={clickDoor}>
          <boxGeometry args={[1.0, 2.28, 0.085]} />
          <meshStandardMaterial map={doorTexture} color="#211827" metalness={0.38} roughness={0.58} />
        </mesh>
        <mesh position={[0.82, 1.05, 0.065]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.12} />
        </mesh>
      </group>

      <ReaderPanel
        color={color}
        stateLabel={(state?.state || 'locked').toUpperCase()}
        onCard={() => attempt('magnetic_card')}
        onPin={(pin) => attempt('numpad', pin)}
      />

      <Text position={[0, 2.65, 0.16]} fontSize={0.16} color="#f8fafc" anchorX="center" anchorY="middle">
        {roomNumber}
      </Text>
      <Text position={[0, 2.43, 0.16]} fontSize={0.07} color={color} anchorX="center" anchorY="middle">
        {lastMessage || state?.lastMessage || 'PRÊT'}
      </Text>

      <pointLight position={[0.35, 1.6, 0.6]} color={color} intensity={state?.isLocked ? 0.15 : 0.55} distance={3} />
    </group>
  )
})
