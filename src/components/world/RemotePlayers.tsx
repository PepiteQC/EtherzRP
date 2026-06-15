import React, { memo, useMemo, useRef } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEtherServerContext } from '../../context/EtherServerContext'
import type { OnlineSocketPlayer } from '../../types/etherServer'

type RemotePlayersProps = {
  enabled?: boolean
  localUid?: string | null
  localSocketId?: string | null
  showNameTags?: boolean
  showDebugRing?: boolean
  maxDistance?: number
}

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getPlayerColor(seed: string) {
  let hash = 0

  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 80%, 62%)`
}

function getPlayerInitial(name: string) {
  return (name || 'C').trim().charAt(0).toUpperCase() || 'C'
}

const RemotePlayerAvatar = memo(function RemotePlayerAvatar({
  player,
  showNameTags,
  showDebugRing,
}: {
  player: OnlineSocketPlayer
  showNameTags: boolean
  showDebugRing: boolean
}) {
  const groupRef = useRef<THREE.Group | null>(null)

  const targetPosition = useRef(
    new THREE.Vector3(
      safeNumber(player.position?.x),
      safeNumber(player.position?.y, 1),
      safeNumber(player.position?.z)
    )
  )

  const color = useMemo(
    () => getPlayerColor(player.uid || player.socketId || player.name),
    [player.uid, player.socketId, player.name]
  )

  const initial = useMemo(
    () => getPlayerInitial(player.name),
    [player.name]
  )

  useFrame(() => {
    if (!groupRef.current) return

    targetPosition.current.set(
      safeNumber(player.position?.x),
      safeNumber(player.position?.y, 1),
      safeNumber(player.position?.z)
    )

    groupRef.current.position.lerp(targetPosition.current, 0.18)

    if (player.rotation) {
      const targetY = safeNumber(player.rotation.y, groupRef.current.rotation.y)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetY,
        0.18
      )
    }
  })

  return (
    <group
      ref={groupRef}
      position={[
        safeNumber(player.position?.x),
        safeNumber(player.position?.y, 1),
        safeNumber(player.position?.z),
      ]}
      name={`remote-player-${player.uid || player.socketId}`}
    >
      {/* Ombre / présence au sol */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <circleGeometry args={[0.48, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {showDebugRing && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.04, 0]}
        >
          <ringGeometry args={[0.55, 0.6, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Corps low-poly */}
      <group position={[0, 0.05, 0]}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.28, 0.78, 6, 12]} />
          <meshStandardMaterial
            color={color}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>

        <mesh castShadow position={[0, 1.18, 0]}>
          <sphereGeometry args={[0.25, 18, 18]} />
          <meshStandardMaterial
            color="#f2c7a0"
            roughness={0.7}
            metalness={0}
          />
        </mesh>

        {/* Visière / face */}
        <mesh position={[0, 1.2, -0.21]}>
          <boxGeometry args={[0.28, 0.08, 0.035]} />
          <meshStandardMaterial
            color="#10131f"
            roughness={0.35}
            metalness={0.15}
          />
        </mesh>

        {/* Torse badge RP */}
        <mesh position={[0, 0.7, -0.285]}>
          <boxGeometry args={[0.22, 0.12, 0.025]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.4}
            metalness={0}
          />
        </mesh>

        {/* Bras */}
        <mesh castShadow position={[-0.36, 0.6, 0]} rotation={[0, 0, 0.18]}>
          <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>

        <mesh castShadow position={[0.36, 0.6, 0]} rotation={[0, 0, -0.18]}>
          <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>

        {/* Jambes */}
        <mesh castShadow position={[-0.13, 0.12, 0]}>
          <capsuleGeometry args={[0.08, 0.42, 4, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>

        <mesh castShadow position={[0.13, 0.12, 0]}>
          <capsuleGeometry args={[0.08, 0.42, 4, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
      </group>

      {/* Initiale au-dessus */}
      <Billboard position={[0, 1.72, 0]}>
        <mesh>
          <circleGeometry args={[0.18, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.92}
            depthWrite={false}
          />
        </mesh>

        <Text
          position={[0, 0, 0.01]}
          fontSize={0.18}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
        >
          {initial}
        </Text>
      </Billboard>

      {/* Name tag */}
      {showNameTags && (
        <Billboard position={[0, 2.05, 0]}>
          <group>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[1.85, 0.34]} />
              <meshBasicMaterial
                color="#050816"
                transparent
                opacity={0.72}
                depthWrite={false}
              />
            </mesh>

            <Text
              position={[0, 0.045, 0]}
              fontSize={0.13}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.006}
              outlineColor="#000000"
            >
              {player.name || 'Citoyen'}
            </Text>

            <Text
              position={[0, -0.105, 0]}
              fontSize={0.075}
              color="#9ca3af"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.004}
              outlineColor="#000000"
            >
              {player.zone || 'Quebec'}
            </Text>
          </group>
        </Billboard>
      )}
    </group>
  )
})

export function RemotePlayers({
  enabled = true,
  localUid = null,
  localSocketId = null,
  showNameTags = true,
  showDebugRing = false,
  maxDistance = 0,
}: RemotePlayersProps) {
  const ether = useEtherServerContext()

  const remotePlayers = useMemo(() => {
    if (!enabled) return []

    return ether.onlinePlayers.filter((player) => {
      if (!player) return false

      if (localUid && player.uid === localUid) return false
      if (localSocketId && player.socketId === localSocketId) return false

      if (player.uid === 'local-dev' && localUid === 'local-dev') return false

      if (maxDistance > 0) {
        const x = safeNumber(player.position?.x)
        const y = safeNumber(player.position?.y)
        const z = safeNumber(player.position?.z)
        const distance = Math.sqrt(x * x + y * y + z * z)

        if (distance > maxDistance) return false
      }

      return true
    })
  }, [
    enabled,
    ether.onlinePlayers,
    localUid,
    localSocketId,
    maxDistance,
  ])

  if (!enabled) return null
  if (remotePlayers.length <= 0) return null

  return (
    <group name="remote-players">
      {remotePlayers.map((player) => (
        <RemotePlayerAvatar
          key={player.socketId || player.uid}
          player={player}
          showNameTags={showNameTags}
          showDebugRing={showDebugRing}
        />
      ))}
    </group>
  )
}
