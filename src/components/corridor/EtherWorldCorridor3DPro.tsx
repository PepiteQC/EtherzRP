'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, KeyboardControls, Text, useKeyboardControls } from '@react-three/drei'
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import {
  buildDefaultNpcData,
  canEnterDoor,
  canRentDoor,
  canToggleDoor,
  computeFloorStats,
  CORRIDOR_3D,
  CORRIDOR_COLORS,
  CORRIDOR_GRID,
  CORRIDOR_PROPS,
  corridorThemeForFloor,
  doorWorldTransform,
  floorLabel,
  formatMoneyCAD,
  generateDoors,
  getCorridorEnv,
  getDoorStatusColor,
  SECURITY_LABELS,
  FURNITURE_LABELS,
  tileToWorld,
  type AlertData,
  type DoorAction,
  type DoorData,
  type FloorAPIData,
} from './corridorDomain'

// ═══════════════════════════════════════════════════════════════════════════════
// EtherWorldCorridor3DPro
// Nouvelle couche 3D officielle. Ne supprime pas le corridor canvas.
// Objectif: parité fonctionnelle avec EtherWorldCorridor.tsx + rendu R3F/Rapier.
// ═══════════════════════════════════════════════════════════════════════════════

interface EtherWorldCorridor3DProProps {
  floorId?: number
  floorNumber?: number
  buildingName?: string
  characterId?: number
  characterName?: string
  hasMagneticCard?: boolean
  onEnterApartment?: ((aptId: number) => void) | null
  debugPhysics?: boolean
}

type CorridorControls = 'forward' | 'back' | 'left' | 'right' | 'interact'

const keyMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'back', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'interact', keys: ['KeyE', 'Enter'] },
] as const

const ALERT_MAX = 4
const ALERT_DURATION_MS = 5000
const CHANGE_FLASH_MS = 2000
const WS_RECONNECT_MS = 3000

function hexToRgb(hex: string): string {
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`
}

function makeNoiseTexture(base: string, speckle: string, repeat: [number, number]) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = speckle
    ctx.globalAlpha = Math.random() * 0.16
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 3)
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat[0], repeat[1])
  tex.needsUpdate = true
  return tex
}

function useCorridorMaterials(theme: ReturnType<typeof corridorThemeForFloor>) {
  return useMemo(() => {
    const premium = theme === 'premium' || theme === 'penthouse'
    const floor = makeNoiseTexture(premium ? '#151225' : '#111420', 'rgba(140,110,255,0.45)', [2.2, 11])
    const wall = makeNoiseTexture(premium ? '#191633' : '#141826', 'rgba(0,224,255,0.22)', [1, 5])
    const carpet = makeNoiseTexture(theme === 'penthouse' ? '#301047' : '#1A0528', 'rgba(255,215,0,0.22)', [1, 9])
    const door = makeNoiseTexture('#1a1018', 'rgba(255,255,255,0.10)', [1, 1])
    return { floor, wall, carpet, door }
  }, [theme])
}

const CorridorShell3D = memo(function CorridorShell3D({ theme, debugPhysics = false }: { theme: ReturnType<typeof corridorThemeForFloor>; debugPhysics?: boolean }) {
  const mats = useCorridorMaterials(theme)
  const premium = theme === 'premium' || theme === 'penthouse'

  return (
    <group name="CorridorShell3D">
      {/* Sol physique */}
      <RigidBody type="fixed" colliders={false} name="hotel-corridor-floor-collider">
        <CuboidCollider args={[CORRIDOR_3D.width / 2, CORRIDOR_3D.floorThickness / 2, CORRIDOR_3D.length / 2]} position={[0, -CORRIDOR_3D.floorThickness / 2, CORRIDOR_3D.length / 2]} friction={1.15} restitution={0.02} />
        {debugPhysics && (
          <mesh position={[0, 0.01, CORRIDOR_3D.length / 2]}>
            <boxGeometry args={[CORRIDOR_3D.width, 0.04, CORRIDOR_3D.length]} />
            <meshBasicMaterial color="#00ff9d" transparent opacity={0.08} />
          </mesh>
        )}
      </RigidBody>

      {/* Sol visible */}
      <mesh position={[0, 0.002, CORRIDOR_3D.length / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CORRIDOR_3D.width, CORRIDOR_3D.length]} />
        <meshStandardMaterial map={mats.floor} color={premium ? '#1a1730' : '#111420'} roughness={premium ? 0.28 : 0.55} metalness={premium ? 0.18 : 0.05} />
      </mesh>

      {/* Tapis central */}
      <mesh position={[0, 0.012, CORRIDOR_3D.length / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.25, CORRIDOR_3D.length - 1.3]} />
        <meshStandardMaterial map={mats.carpet} color={theme === 'penthouse' ? '#301047' : '#1A0528'} roughness={0.96} />
      </mesh>

      {/* Bordures dorées */}
      {[-0.69, 0.69].map((x) => (
        <mesh key={`carpet-gold-${x}`} position={[x, 0.018, CORRIDOR_3D.length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.035, CORRIDOR_3D.length - 1.5]} />
          <meshStandardMaterial color="#C9A84C" metalness={0.7} roughness={0.25} emissive="#5a4310" emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* Murs + colliders */}
      {[-1, 1].map((side) => (
        <RigidBody key={`wall-rb-${side}`} type="fixed" colliders={false} name={`hotel-corridor-wall-${side}`}>
          <CuboidCollider args={[CORRIDOR_3D.wallThickness / 2, CORRIDOR_3D.height / 2, CORRIDOR_3D.length / 2]} position={[side * CORRIDOR_3D.width / 2, CORRIDOR_3D.height / 2, CORRIDOR_3D.length / 2]} friction={0.9} restitution={0.01} />
          <mesh position={[side * CORRIDOR_3D.width / 2, CORRIDOR_3D.height / 2, CORRIDOR_3D.length / 2]} castShadow receiveShadow>
            <boxGeometry args={[CORRIDOR_3D.wallThickness, CORRIDOR_3D.height, CORRIDOR_3D.length]} />
            <meshStandardMaterial map={mats.wall} color={side < 0 ? CORRIDOR_COLORS.wallLeft : CORRIDOR_COLORS.wallRight} roughness={0.82} metalness={0.08} />
          </mesh>
          {debugPhysics && (
            <mesh position={[side * CORRIDOR_3D.width / 2, CORRIDOR_3D.height / 2, CORRIDOR_3D.length / 2]}>
              <boxGeometry args={[CORRIDOR_3D.wallThickness + 0.02, CORRIDOR_3D.height, CORRIDOR_3D.length]} />
              <meshBasicMaterial color="#ff3af2" transparent opacity={0.1} />
            </mesh>
          )}
        </RigidBody>
      ))}

      {/* Mur de fond */}
      <RigidBody type="fixed" colliders={false} name="hotel-corridor-end-wall">
        <CuboidCollider args={[CORRIDOR_3D.width / 2, CORRIDOR_3D.height / 2, CORRIDOR_3D.wallThickness / 2]} position={[0, CORRIDOR_3D.height / 2, CORRIDOR_3D.length + CORRIDOR_3D.wallThickness / 2]} />
        <mesh position={[0, CORRIDOR_3D.height / 2, CORRIDOR_3D.length + CORRIDOR_3D.wallThickness / 2]} receiveShadow>
          <boxGeometry args={[CORRIDOR_3D.width, CORRIDOR_3D.height, CORRIDOR_3D.wallThickness]} />
          <meshStandardMaterial map={mats.wall} color="#111827" roughness={0.84} />
        </mesh>
      </RigidBody>

      {/* Plafond */}
      <mesh position={[0, CORRIDOR_3D.height, CORRIDOR_3D.length / 2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CORRIDOR_3D.width, CORRIDOR_3D.length]} />
        <meshStandardMaterial color="#090a12" roughness={0.95} />
      </mesh>

      {/* Plinthes + néons bas */}
      {[-1, 1].map((side) => (
        <group key={`baseboard-${side}`}>
          <mesh position={[side * (CORRIDOR_3D.width / 2 - 0.08), 0.12, CORRIDOR_3D.length / 2]}>
            <boxGeometry args={[0.08, 0.24, CORRIDOR_3D.length]} />
            <meshStandardMaterial color="#0d0a18" roughness={0.55} metalness={0.15} />
          </mesh>
          <mesh position={[side * (CORRIDOR_3D.width / 2 - 0.11), 0.035, CORRIDOR_3D.length / 2]}>
            <boxGeometry args={[0.025, 0.035, CORRIDOR_3D.length - 0.6]} />
            <meshStandardMaterial color={premium ? '#00E0FF' : '#4A3AFF'} emissive={premium ? '#00E0FF' : '#4A3AFF'} emissiveIntensity={premium ? 0.55 : 0.28} />
          </mesh>
        </group>
      ))}
    </group>
  )
})

const CeilingLights3D = memo(function CeilingLights3D({ theme }: { theme: ReturnType<typeof corridorThemeForFloor> }) {
  const lightColor = theme === 'penthouse' ? '#C9A84C' : '#00E0FF'
  return (
    <group name="CeilingLights3D">
      {Array.from({ length: 6 }).map((_, i) => {
        const z = 2.4 + i * CORRIDOR_PROPS.lightsEvery
        return (
          <group key={`light-${i}`} position={[0, CORRIDOR_3D.height - 0.16, z]}>
            <mesh>
              <boxGeometry args={[1.2, 0.045, 0.16]} />
              <meshStandardMaterial color="#dbeafe" emissive={lightColor} emissiveIntensity={0.9} />
            </mesh>
            <pointLight color={lightColor} intensity={1.15} distance={5.2} decay={2} castShadow={i % 2 === 0} />
          </group>
        )
      })}
    </group>
  )
})

const HotelDoor3D = memo(function HotelDoor3D({
  door,
  characterId,
  hovered,
  selected,
  onSelect,
  onHover,
}: {
  door: DoorData
  characterId: number
  hovered: boolean
  selected: boolean
  onSelect: (door: DoorData) => void
  onHover: (door: DoorData | null) => void
}) {
  const transform = doorWorldTransform(door)
  const panelRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  const statusColor = getDoorStatusColor(door)
  const canOpen = canEnterDoor(door, characterId)
  const openAngle = canOpen && !door.isLocked ? 0.2 : 0

  useFrame((state, delta) => {
    if (panelRef.current) {
      panelRef.current.rotation.y = THREE.MathUtils.lerp(panelRef.current.rotation.y, openAngle, Math.min(1, delta * 7))
    }
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.45 + Math.sin(state.clock.elapsedTime * (door.justChanged ? 9 : 3)) * (door.justChanged ? 0.45 : 0.12)
    }
  })

  return (
    <group position={transform.position} rotation={transform.rotation} name={`HotelDoor3D:${door.aptNumber}`}>
      {/* Cadre */}
      <mesh position={[0, 1.18, 0]} castShadow onClick={(e) => { e.stopPropagation(); onSelect(door) }} onPointerOver={(e) => { e.stopPropagation(); onHover(door) }} onPointerOut={(e) => { e.stopPropagation(); onHover(null) }}>
        <boxGeometry args={[1.18, 2.42, 0.08]} />
        <meshStandardMaterial color={selected ? '#241047' : '#0b0b13'} roughness={0.44} metalness={0.28} emissive={selected ? '#4A3AFF' : '#000000'} emissiveIntensity={selected ? 0.16 : 0} />
      </mesh>

      {/* Panneau porte */}
      <group ref={panelRef} position={[0, 1.18, 0.055]}>
        <mesh castShadow receiveShadow onClick={(e) => { e.stopPropagation(); onSelect(door) }} onPointerOver={(e) => { e.stopPropagation(); onHover(door) }} onPointerOut={(e) => { e.stopPropagation(); onHover(null) }}>
          <boxGeometry args={[0.95, 2.2, CORRIDOR_3D.doorDepth]} />
          <meshStandardMaterial color={door.isLocked ? '#250b0b' : '#092015'} roughness={0.62} metalness={0.08} emissive={selected || hovered ? statusColor : '#000000'} emissiveIntensity={selected ? 0.18 : hovered ? 0.08 : 0} />
        </mesh>

        {/* Panneaux décoratifs */}
        {[0.56, -0.28].map((y) => (
          <mesh key={`panel-${y}`} position={[0, y, 0.048]}>
            <boxGeometry args={[0.68, 0.54, 0.012]} />
            <meshStandardMaterial color="#130d17" roughness={0.7} metalness={0.05} />
          </mesh>
        ))}

        {/* Poignée */}
        <mesh position={[0.33, -0.1, 0.09]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color="#C9A84C" roughness={0.25} metalness={0.8} />
        </mesh>
      </group>

      {/* Lecteur carte / LED */}
      <mesh ref={ledRef} position={[0.68, 1.25, 0.11]} castShadow onClick={(e) => { e.stopPropagation(); onSelect(door) }}>
        <boxGeometry args={[0.18, 0.28, 0.05]} />
        <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.5} roughness={0.18} />
      </mesh>

      {/* Plaque numéro */}
      <mesh position={[0, 2.48, 0.08]}>
        <boxGeometry args={[0.64, 0.18, 0.025]} />
        <meshStandardMaterial color="#101827" roughness={0.4} metalness={0.4} emissive={selected ? '#00E0FF' : '#000000'} emissiveIntensity={selected ? 0.2 : 0} />
      </mesh>
      <Text position={[0, 2.485, 0.105]} fontSize={0.105} color={selected || hovered ? statusColor : '#E5E7EB'} anchorX="center" anchorY="middle">
        {door.aptNumber}
      </Text>

      {/* Tag location / propriétaire */}
      {!door.ownerName && door.isForRent && (
        <Text position={[0, 2.72, 0.105]} fontSize={0.09} color="#FFD700" anchorX="center" anchorY="middle">
          À LOUER
        </Text>
      )}
      {door.ownerName && (
        <Text position={[0, 0.18, 0.105]} fontSize={0.075} color="#00E0FF" anchorX="center" anchorY="middle">
          {door.ownerName.slice(0, 12)}
        </Text>
      )}

      {/* Icône sécurité 3D simple */}
      {door.securityLevel > 0 && (
        <Text position={[-0.43, 2.14, 0.105]} fontSize={0.08} color={door.securityLevel >= 2 ? '#C9A84C' : '#9CA3AF'} anchorX="center" anchorY="middle">
          {'◆'.repeat(Math.min(door.securityLevel, 3))}
        </Text>
      )}

      {/* Halo au sol */}
      {(hovered || selected || door.justChanged) && (
        <mesh position={[0, 0.025, 0.62]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.46, 32]} />
          <meshBasicMaterial color={statusColor} transparent opacity={selected ? 0.22 : 0.12} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
})

const CorridorDecor3D = memo(function CorridorDecor3D({ floorNumber }: { floorNumber: number }) {
  const theme = corridorThemeForFloor(floorNumber)
  const premium = theme === 'premium' || theme === 'penthouse'

  return (
    <group name="CorridorDecor3D">
      {/* Extincteurs */}
      {CORRIDOR_PROPS.fireExtinguishers.map((ty, i) => {
        const z = 0.9 + ty * CORRIDOR_3D.tileWorldZ
        const side = i % 2 === 0 ? -1 : 1
        return (
          <group key={`ext-${ty}`} position={[side * (CORRIDOR_3D.width / 2 - 0.18), 0.55, z]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh position={[0, 0.28, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.08, 0.52, 14]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.32} metalness={0.15} />
            </mesh>
            <mesh position={[0, 0.58, 0]}>
              <boxGeometry args={[0.16, 0.07, 0.05]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
          </group>
        )
      })}

      {/* Plantes */}
      {CORRIDOR_PROPS.plants.map((ty, i) => {
        const [xBase, , z] = tileToWorld(i % 2 === 0 ? 1 : CORRIDOR_GRID.widthTiles - 2, ty)
        return (
          <group key={`plant-${ty}`} position={[xBase, 0, z]}>
            <mesh position={[0, 0.16, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 0.32, 16]} />
              <meshStandardMaterial color="#3b2514" roughness={0.8} />
            </mesh>
            {Array.from({ length: premium ? 9 : 6 }).map((_, leaf) => (
              <mesh key={leaf} position={[Math.sin(leaf) * 0.12, 0.42 + leaf * 0.025, Math.cos(leaf * 1.7) * 0.12]} rotation={[Math.random() * 0.5, leaf, Math.random() * 0.4]} castShadow>
                <coneGeometry args={[0.075, 0.38, 6]} />
                <meshStandardMaterial color={leaf % 2 ? '#166534' : '#15803d'} roughness={0.88} />
              </mesh>
            ))}
          </group>
        )
      })}

      {/* Cadres muraux */}
      {CORRIDOR_PROPS.paintings.map((ty, i) => {
        const side = i % 2 === 0 ? -1 : 1
        const z = 0.9 + ty * CORRIDOR_3D.tileWorldZ
        return (
          <group key={`painting-${ty}`} position={[side * (CORRIDOR_3D.width / 2 - 0.095), 1.85, z]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh>
              <boxGeometry args={[0.72, 0.46, 0.035]} />
              <meshStandardMaterial color="#C9A84C" roughness={0.28} metalness={0.65} />
            </mesh>
            <mesh position={[0, 0, 0.025]}>
              <boxGeometry args={[0.62, 0.36, 0.02]} />
              <meshStandardMaterial color={i % 2 ? '#112a46' : '#2a1646'} emissive={i % 2 ? '#00E0FF' : '#4A3AFF'} emissiveIntensity={0.08} />
            </mesh>
          </group>
        )
      })}

      {/* Caméras */}
      {CORRIDOR_PROPS.cameras.map((ty, i) => {
        const side = i % 2 === 0 ? -1 : 1
        const z = 0.9 + ty * CORRIDOR_3D.tileWorldZ
        return (
          <group key={`cam-${ty}`} position={[side * (CORRIDOR_3D.width / 2 - 0.18), 2.85, z]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.16, 0.18]} />
              <meshStandardMaterial color="#111827" roughness={0.38} metalness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.12]}>
              <sphereGeometry args={[0.055, 16, 16]} />
              <meshStandardMaterial color="#020617" emissive="#FF3A3A" emissiveIntensity={0.45} />
            </mesh>
          </group>
        )
      })}

      {/* Panneaux étage / sortie */}
      <group position={[0, 2.8, 0.55]}>
        <mesh>
          <boxGeometry args={[1.2, 0.32, 0.035]} />
          <meshStandardMaterial color="#050814" emissive="#00E0FF" emissiveIntensity={0.14} />
        </mesh>
        <Text position={[0, 0, 0.03]} fontSize={0.13} color="#00E0FF" anchorX="center" anchorY="middle">
          {floorLabel(floorNumber)}
        </Text>
      </group>

      <group position={[0, 2.75, CORRIDOR_3D.length - 0.38]}>
        <mesh>
          <boxGeometry args={[1.15, 0.3, 0.035]} />
          <meshStandardMaterial color="#032e16" emissive="#00FF9D" emissiveIntensity={0.28} />
        </mesh>
        <Text position={[0, 0, 0.03]} fontSize={0.12} color="#00FF9D" anchorX="center" anchorY="middle">
          SORTIE →
        </Text>
      </group>
    </group>
  )
})

const CorridorNpc3D = memo(function CorridorNpc3D({ npc }: { npc: ReturnType<typeof buildDefaultNpcData>[number] }) {
  const ref = useRef<THREE.Group>(null)
  const [x, , z] = tileToWorld(npc.tx, npc.ty)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.4 + npc.seed) * 0.025
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35 + npc.seed) * 0.25
  })

  return (
    <group ref={ref} position={[x, 0, z]} name={`NPC:${npc.id}`}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.55, 4, 10]} />
        <meshStandardMaterial color={npc.color} roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#e0c0a8" roughness={0.72} />
      </mesh>
      <Text position={[0, 1.35, 0]} fontSize={0.12} color={npc.color} anchorX="center" anchorY="middle">
        {npc.name}
      </Text>
    </group>
  )
})

function PlayerController3D({
  characterName,
  onMove,
  onInteract,
}: {
  characterName: string
  onMove: (pos: THREE.Vector3) => void
  onInteract: () => void
}) {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const [, getKeys] = useKeyboardControls<CorridorControls>()
  const interactLock = useRef(false)

  useFrame((state, delta) => {
    const rb = body.current
    if (!rb) return

    const keys = getKeys()
    const current = rb.translation()
    const dir = new THREE.Vector3(
      (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
      0,
      (keys.back ? 1 : 0) - (keys.forward ? 1 : 0)
    )

    if (dir.lengthSq() > 0) dir.normalize()
    const speed = 2.55
    const next = new THREE.Vector3(
      THREE.MathUtils.clamp(current.x + dir.x * speed * delta, -CORRIDOR_3D.width / 2 + 0.55, CORRIDOR_3D.width / 2 - 0.55),
      0.82,
      THREE.MathUtils.clamp(current.z + dir.z * speed * delta, 0.7, CORRIDOR_3D.length - 0.75)
    )

    rb.setNextKinematicTranslation(next)
    onMove(next)

    if (visual.current) {
      if (dir.lengthSq() > 0) visual.current.rotation.y = Math.atan2(dir.x, dir.z)
      visual.current.position.y = Math.sin(state.clock.elapsedTime * 8) * (dir.lengthSq() > 0 ? 0.035 : 0.01)
    }

    const desiredCam = new THREE.Vector3(next.x, CORRIDOR_3D.cameraUp, next.z + CORRIDOR_3D.cameraBack)
    camera.position.lerp(desiredCam, 1 - Math.exp(-delta * 6))
    camera.lookAt(next.x, 1.25, next.z - 1.4)

    if (keys.interact && !interactLock.current) {
      interactLock.current = true
      onInteract()
    }
    if (!keys.interact) interactLock.current = false
  })

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[0, 0.82, 5.8]} enabledRotations={[false, false, false]} name="hotel-corridor-player">
      <CuboidCollider args={[CORRIDOR_3D.playerRadius, CORRIDOR_3D.playerHeight / 2, CORRIDOR_3D.playerRadius]} friction={0.8} />
      <group ref={visual}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <capsuleGeometry args={[0.24, 0.78, 6, 12]} />
          <meshStandardMaterial color="#1E2564" roughness={0.48} emissive="#4A3AFF" emissiveIntensity={0.05} />
        </mesh>
        <mesh position={[0, 0.36, 0]} castShadow>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshStandardMaterial color="#f0c7aa" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.56, 0]} castShadow>
          <boxGeometry args={[0.46, 0.08, 0.32]} />
          <meshStandardMaterial color="#4A3AFF" emissive="#4A3AFF" emissiveIntensity={0.18} />
        </mesh>
        <Text position={[0, 0.88, 0]} fontSize={0.13} color="#00E0FF" anchorX="center" anchorY="middle">
          {characterName}
        </Text>
      </group>
    </RigidBody>
  )
}

function CorridorScene3D({
  doors,
  floorNumber,
  characterId,
  characterName,
  hoveredDoor,
  selectedDoor,
  onHoverDoor,
  onSelectDoor,
  onMovePlayer,
  onInteractNearest,
  debugPhysics,
}: {
  doors: DoorData[]
  floorNumber: number
  characterId: number
  characterName: string
  hoveredDoor: DoorData | null
  selectedDoor: DoorData | null
  onHoverDoor: (door: DoorData | null) => void
  onSelectDoor: (door: DoorData) => void
  onMovePlayer: (pos: THREE.Vector3) => void
  onInteractNearest: () => void
  debugPhysics?: boolean
}) {
  const theme = corridorThemeForFloor(floorNumber)
  const npcs = useMemo(() => buildDefaultNpcData(), [])

  return (
    <>
      <color attach="background" args={[CORRIDOR_COLORS.bg]} />
      <fog attach="fog" args={[CORRIDOR_COLORS.bg, 8, 34]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 8, 4]} intensity={0.75} castShadow shadow-mapSize={[1024, 1024]} />

      <Physics gravity={[0, -9.81, 0]}>
        <CorridorShell3D theme={theme} debugPhysics={debugPhysics} />
        <CeilingLights3D theme={theme} />
        <CorridorDecor3D floorNumber={floorNumber} />

        {doors.map((door) => (
          <HotelDoor3D
            key={door.id}
            door={door}
            characterId={characterId}
            hovered={hoveredDoor?.id === door.id}
            selected={selectedDoor?.id === door.id}
            onSelect={onSelectDoor}
            onHover={onHoverDoor}
          />
        ))}

        {npcs.map((npc) => <CorridorNpc3D key={npc.id} npc={npc} />)}

        <PlayerController3D characterName={characterName} onMove={onMovePlayer} onInteract={onInteractNearest} />
      </Physics>
    </>
  )
}

function AlertsOverlay({ alerts }: { alerts: AlertData[] }) {
  return (
    <div style={{ position: 'absolute', top: 88, right: 16, zIndex: 30, display: 'grid', gap: 8, width: 360, pointerEvents: 'none' }}>
      {alerts.map((a) => {
        const color = a.type === 'danger' ? CORRIDOR_COLORS.red : a.type === 'warning' ? CORRIDOR_COLORS.orange : a.type === 'success' ? CORRIDOR_COLORS.green : CORRIDOR_COLORS.cyan
        return (
          <div key={a.id} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(6,6,14,0.92)', border: `1px solid ${color}66`, color: CORRIDOR_COLORS.light, boxShadow: `0 0 18px ${color}22`, fontSize: 13, fontWeight: 800 }}>
            {a.msg}
          </div>
        )
      })}
    </div>
  )
}

function DoorPanel({
  door,
  characterId,
  hasMagneticCard,
  onAction,
}: {
  door: DoorData | null
  characterId: number
  hasMagneticCard: boolean
  onAction: (door: DoorData, action: DoorAction) => void
}) {
  if (!door) return null
  const statusColor = getDoorStatusColor(door)
  const canEnter = canEnterDoor(door, characterId)
  const canToggle = canToggleDoor(door, characterId, hasMagneticCard)
  const canRent = canRentDoor(door)

  const btn = (label: string, action: DoorAction, disabled = false) => (
    <button disabled={disabled} onClick={() => onAction(door, action)} style={{ border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : statusColor + '66'}`, background: disabled ? 'rgba(255,255,255,0.04)' : `rgba(${hexToRgb(statusColor)},0.13)`, color: disabled ? 'rgba(255,255,255,0.28)' : '#F2F2F2', borderRadius: 12, padding: '10px 12px', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 900, fontSize: 12 }}>
      {label}
    </button>
  )

  return (
    <div style={{ position: 'absolute', right: 16, bottom: 18, width: 390, zIndex: 25, color: CORRIDOR_COLORS.light, background: 'linear-gradient(180deg,rgba(8,8,14,0.97),rgba(6,6,12,0.94))', border: `1px solid ${statusColor}55`, borderRadius: 22, boxShadow: `0 0 34px ${statusColor}22`, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 12, color: statusColor, fontWeight: 900, letterSpacing: '0.16em' }}>PORTE SÉLECTIONNÉE</div>
          <div style={{ fontSize: 24, fontWeight: 950, marginTop: 4 }}>{door.aptNumber}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: statusColor, fontWeight: 900 }}>{door.isLocked ? '🔒 BARRÉE' : '🔓 OUVERTE'}</div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10 }}>Proprio<br /><b>{door.ownerName ?? 'Aucun'}</b></div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10 }}>Loyer<br /><b>{formatMoneyCAD(door.rentPrice)}</b></div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10 }}>Sécurité<br /><b>{SECURITY_LABELS[door.securityLevel] ?? 'N/A'}</b></div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10 }}>Mobilier<br /><b>{FURNITURE_LABELS[door.furnitureLevel] ?? 'N/A'}</b></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        {btn('Entrer', 'enter', !canEnter)}
        {btn(door.isLocked ? 'Débarrer' : 'Barrer', 'toggle', !canToggle)}
        {btn('Crocheter', 'lockpick', !door.isLocked)}
        {btn('Louer', 'rent', !canRent)}
      </div>
    </div>
  )
}

function MiniMap({ doors, selectedDoor, nearDoor }: { doors: DoorData[]; selectedDoor: DoorData | null; nearDoor: DoorData | null }) {
  return (
    <div style={{ position: 'absolute', left: 16, bottom: 18, width: 240, zIndex: 25, color: '#F2F2F2', background: 'rgba(6,6,14,0.90)', border: '1px solid rgba(0,224,255,0.22)', borderRadius: 18, padding: 12 }}>
      <div style={{ fontSize: 11, color: CORRIDOR_COLORS.cyan, fontWeight: 900, letterSpacing: '0.14em', marginBottom: 8 }}>MINIMAP COULOIR</div>
      <div style={{ position: 'relative', height: 170, borderRadius: 12, background: 'linear-gradient(180deg,rgba(74,58,255,0.12),rgba(0,224,255,0.05))', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ position: 'absolute', left: '48%', top: 8, bottom: 8, width: 6, borderRadius: 999, background: 'rgba(255,255,255,0.12)' }} />
        {doors.map((d) => {
          const top = 8 + (d.ty / CORRIDOR_GRID.lengthTiles) * 150
          const color = getDoorStatusColor(d)
          const active = selectedDoor?.id === d.id || nearDoor?.id === d.id
          return <div key={d.id} title={d.aptNumber} style={{ position: 'absolute', top, left: d.side === 'left' ? 36 : 188, width: active ? 13 : 9, height: active ? 13 : 9, borderRadius: 3, background: color, boxShadow: `0 0 ${active ? 12 : 5}px ${color}` }} />
        })}
      </div>
    </div>
  )
}

function HeaderOverlay({ buildingName, floorNumber, stats, wsLive }: { buildingName: string; floorNumber: number; stats: ReturnType<typeof computeFloorStats>; wsLive: boolean }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '14px 16px 34px', background: 'linear-gradient(180deg,rgba(5,5,10,0.98),rgba(5,5,10,0))', color: '#F2F2F2', display: 'flex', justifyContent: 'space-between', alignItems: 'start', pointerEvents: 'none' }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 950 }}>{buildingName}</div>
        <div style={{ fontSize: 11, color: CORRIDOR_COLORS.cyan, fontWeight: 900, letterSpacing: '0.18em', marginTop: 4 }}>{floorLabel(floorNumber)} — COULOIR 3D RAPIER</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, fontWeight: 900 }}>
        {[`Libres ${stats.forRent}`, `Occupés ${stats.occupied}`, `Ouvertes ${stats.unlocked}`, `${formatMoneyCAD(stats.totalValue)}/mois`].map((s) => (
          <div key={s} style={{ padding: '9px 11px', borderRadius: 12, background: 'rgba(6,6,14,0.72)', border: '1px solid rgba(255,255,255,0.08)' }}>{s}</div>
        ))}
        <div style={{ padding: '9px 11px', borderRadius: 12, background: wsLive ? 'rgba(0,255,157,0.12)' : 'rgba(255,154,58,0.12)', border: `1px solid ${wsLive ? CORRIDOR_COLORS.green : CORRIDOR_COLORS.orange}55`, color: wsLive ? CORRIDOR_COLORS.green : CORRIDOR_COLORS.orange }}>
          {wsLive ? 'WS LIVE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  )
}

export default function EtherWorldCorridor3DPro({
  floorId = 1,
  floorNumber = 1,
  buildingName = 'EtherWorld Tower',
  characterId = 1,
  characterName = 'Toi',
  hasMagneticCard = true,
  onEnterApartment = null,
  debugPhysics = false,
}: EtherWorldCorridor3DProProps) {
  const env = useMemo(() => getCorridorEnv(), [])
  const [doors, setDoors] = useState<DoorData[]>(() => generateDoors({ floorNumber }))
  const doorsRef = useRef(doors)
  const [hoveredDoor, setHoveredDoor] = useState<DoorData | null>(null)
  const [selectedDoor, setSelectedDoor] = useState<DoorData | null>(null)
  const [nearDoor, setNearDoor] = useState<DoorData | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [wsLive, setWsLive] = useState(false)
  const alertTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  useEffect(() => { doorsRef.current = doors }, [doors])

  const addAlert = useCallback((msg: string, type: AlertData['type'] = 'info') => {
    const id = Date.now() + Math.random()
    setAlerts((prev) => [...prev.slice(-(ALERT_MAX - 1)), { id, msg, type }])
    const timer = setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id))
      alertTimers.current.delete(timer)
    }, ALERT_DURATION_MS)
    alertTimers.current.add(timer)
  }, [])

  useEffect(() => {
    const timers = alertTimers.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const stats = useMemo(() => computeFloorStats(doors), [doors])

  useEffect(() => {
    fetch(`${env.apiUrl}/buildings/floor/${floorId}`)
      .then((r) => r.json())
      .then((data: FloorAPIData) => {
        if (data.apartments) setDoors(generateDoors({ floorNumber, apartments: data.apartments }))
      })
      .catch(() => addAlert('Mode local: données étage générées hors-ligne', 'warning'))
  }, [env.apiUrl, floorId, floorNumber, addAlert])

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let closedByUnmount = false

    const connect = () => {
      ws = new WebSocket(env.wsUrl)
      ws.onopen = () => {
        setWsLive(true)
        ws?.send(JSON.stringify({ type: 'AUTH', characterId }))
        ws?.send(JSON.stringify({ type: 'JOIN_FLOOR', floorId }))
      }
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'DOOR_STATE_CHANGED') {
            setDoors((prev) => prev.map((d) => d.aptId === msg.apartmentId ? { ...d, isLocked: msg.isLocked, justChanged: true } : d))
            const clearTimer = setTimeout(() => setDoors((prev) => prev.map((d) => d.aptId === msg.apartmentId ? { ...d, justChanged: false } : d)), CHANGE_FLASH_MS)
            alertTimers.current.add(clearTimer)
            addAlert(`${msg.isLocked ? '🔒' : '🔓'} Porte ${msg.apartmentId} ${msg.isLocked ? 'barrée' : 'débarrée'}`, msg.isLocked ? 'success' : 'warning')
          }
          if (msg.type === 'DOOR_UNLOCKED_ALERT') {
            addAlert(`⚠️ Apt ${msg.apartmentId} ouvert — étage ${floorNumber}`, 'warning')
            setDoors((prev) => prev.map((d) => d.aptId === msg.apartmentId ? { ...d, hasActivity: true } : d))
          }
          if (msg.type === 'DOOR_FORCED') {
            addAlert(`🚨 PORTE FORCÉE — Apt ${msg.apartmentId} !`, 'danger')
            setDoors((prev) => prev.map((d) => d.aptId === msg.apartmentId ? { ...d, isLocked: false, justChanged: true, hasActivity: true } : d))
          }
        } catch {
          // message inconnu ignoré
        }
      }
      ws.onclose = () => {
        setWsLive(false)
        if (!closedByUnmount) reconnectTimer = setTimeout(connect, WS_RECONNECT_MS)
      }
      ws.onerror = () => ws?.close()
    }

    connect()
    return () => {
      closedByUnmount = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [env.wsUrl, floorId, floorNumber, characterId, addAlert])

  const handleMovePlayer = useCallback((pos: THREE.Vector3) => {
    let nearest: DoorData | null = null
    let nearestDist = CORRIDOR_3D.interactionRadius
    for (const door of doorsRef.current) {
      const target = doorWorldTransform(door).interactionPosition
      const dist = Math.hypot(pos.x - target[0], pos.z - target[2])
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = door
      }
    }
    setNearDoor((prev) => prev?.id === nearest?.id ? prev : nearest)
  }, [])

  const markDoorFlashClear = useCallback((doorId: number) => {
    const timer = setTimeout(() => {
      setDoors((prev) => prev.map((d) => d.id === doorId ? { ...d, justChanged: false } : d))
    }, CHANGE_FLASH_MS)
    alertTimers.current.add(timer)
  }, [])

  const handleDoorAction = useCallback(async (door: DoorData, action: DoorAction) => {
    if (action === 'enter') {
      if (!canEnterDoor(door, characterId)) {
        addAlert('❌ Porte verrouillée — accès refusé', 'danger')
        return
      }
      addAlert(`🚪 Entrée appartement ${door.aptNumber}`, 'success')
      onEnterApartment?.(door.aptId)
      return
    }

    if (action === 'rent') {
      if (!canRentDoor(door)) {
        addAlert('❌ Appartement déjà occupé ou non disponible', 'danger')
        return
      }
      try {
        const res = await fetch(`${env.apiUrl}/buildings/apartment/${door.aptId}/rent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId }),
        })
        const data = await res.json()
        if (data.success) {
          setDoors((prev) => prev.map((d) => d.id === door.id ? { ...d, ownerId: characterId, ownerName: characterName, isForRent: false, justChanged: true } : d))
          addAlert(`✅ Appart ${door.aptNumber} loué ! Carte: ${data.cardUid ?? 'locale'}`, 'success')
          markDoorFlashClear(door.id)
        } else addAlert('❌ ' + (data.error ?? 'Location refusée'), 'danger')
      } catch {
        setDoors((prev) => prev.map((d) => d.id === door.id ? { ...d, ownerId: characterId, ownerName: characterName, isForRent: false, justChanged: true } : d))
        addAlert(`✅ Location locale ${door.aptNumber}`, 'warning')
        markDoorFlashClear(door.id)
      }
      return
    }

    if (action === 'lockpick') {
      if (!door.isLocked) {
        addAlert('Déjà ouvert', 'info')
        return
      }
      if (!hasMagneticCard) {
        addAlert('❌ Outils/carte magnétique requis', 'danger')
        return
      }
      addAlert('🔧 Crochetage en cours...', 'warning')
      try {
        const res = await fetch(`${env.apiUrl}/doors/${door.id}/lockpick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characterId }),
        })
        const data = await res.json()
        if (data.success) {
          setDoors((prev) => prev.map((d) => d.id === door.id ? { ...d, isLocked: false, justChanged: true, hasActivity: true } : d))
          addAlert('✅ Crochetage réussi', 'success')
        } else addAlert('❌ Crochetage échoué — serrure résistante', 'danger')
      } catch {
        setDoors((prev) => prev.map((d) => d.id === door.id ? { ...d, isLocked: false, justChanged: true, hasActivity: true } : d))
        addAlert('⚠️ Crochetage local réussi', 'warning')
      }
      markDoorFlashClear(door.id)
      return
    }

    if (!canToggleDoor(door, characterId, hasMagneticCard)) {
      addAlert('❌ Pas de carte magnétique pour cette porte', 'danger')
      return
    }

    try {
      const res = await fetch(`${env.apiUrl}/doors/${door.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId, action: door.isLocked ? 'unlock' : 'lock' }),
      })
      const data = await res.json()
      if (data.success) {
        setDoors((prev) => prev.map((d) => d.id === door.id ? { ...d, isLocked: data.isLocked, justChanged: true } : d))
        addAlert(data.isLocked ? '🔒 Porte barrée' : '🔓 Porte débarrée', 'success')
      } else addAlert('❌ Action refusée par serveur', 'danger')
    } catch {
      setDoors((prev) => prev.map((d) => d.id === door.id ? { ...d, isLocked: !d.isLocked, justChanged: true } : d))
      addAlert('⚠️ Toggle local hors-ligne', 'warning')
    }
    markDoorFlashClear(door.id)
  }, [addAlert, characterId, characterName, env.apiUrl, hasMagneticCard, markDoorFlashClear, onEnterApartment])

  const interactNearest = useCallback(() => {
    const target = nearDoor ?? selectedDoor
    if (!target) {
      addAlert('Aucune porte à proximité', 'info')
      return
    }
    setSelectedDoor(target)
  }, [nearDoor, selectedDoor, addAlert])

  return (
    <div style={{ position: 'fixed', inset: 0, background: CORRIDOR_COLORS.bg, overflow: 'hidden', fontFamily: 'Segoe UI, system-ui, monospace' }}>
      <KeyboardControls map={keyMap as any}>
        <Canvas
          shadows
          camera={{ position: [0, CORRIDOR_3D.cameraUp, 8], fov: 62, near: 0.1, far: 80 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          onPointerMissed={() => setSelectedDoor(null)}
        >
          <CorridorScene3D
            doors={doors}
            floorNumber={floorNumber}
            characterId={characterId}
            characterName={characterName}
            hoveredDoor={hoveredDoor}
            selectedDoor={selectedDoor}
            onHoverDoor={setHoveredDoor}
            onSelectDoor={setSelectedDoor}
            onMovePlayer={handleMovePlayer}
            onInteractNearest={interactNearest}
            debugPhysics={debugPhysics}
          />
          {nearDoor && !selectedDoor && (
            <Html position={doorWorldTransform(nearDoor).interactionPosition} center distanceFactor={7}>
              <div style={{ background: 'rgba(6,6,14,0.92)', border: `1px solid ${getDoorStatusColor(nearDoor)}66`, color: '#F2F2F2', padding: '8px 10px', borderRadius: 12, fontSize: 12, fontWeight: 900, whiteSpace: 'nowrap' }}>
                E — {nearDoor.aptNumber}
              </div>
            </Html>
          )}
        </Canvas>
      </KeyboardControls>

      <HeaderOverlay buildingName={buildingName} floorNumber={floorNumber} stats={stats} wsLive={wsLive} />
      <AlertsOverlay alerts={alerts} />
      <DoorPanel door={selectedDoor} characterId={characterId} hasMagneticCard={hasMagneticCard} onAction={handleDoorAction} />
      <MiniMap doors={doors} selectedDoor={selectedDoor} nearDoor={nearDoor} />

      <div style={{ position: 'absolute', left: 280, bottom: 18, zIndex: 25, color: 'rgba(242,242,242,0.66)', fontSize: 12, background: 'rgba(6,6,14,0.72)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 12px' }}>
        WASD/Flèches marcher · E sélectionner porte proche · clic sur porte · collisions Rapier actives
      </div>
    </div>
  )
}
