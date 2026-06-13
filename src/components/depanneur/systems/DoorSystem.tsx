/**
 * DoorSystem.tsx
 * Porte coulissante automatique + clavier numérique
 * - KeypadButton: bouton individuel
 * - KeypadPad: ensemble du clavier avec validation
 * - SlidingDoor: porte vitrée avec sensor, blocker, LED
 */

import { useRef, useState, useCallback, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

type Vec3 = [number, number, number]

const CORRECT_CODE = '1234'
const DOOR_OPEN_DURATION = 5000
const DOOR_CLOSE_DELAY = 2000
const DOOR_OPEN_THRESHOLD = 0.15
const DOOR_SLIDE_DISTANCE = 1.1
const DOOR_DAMPING = 12

// Couleurs LED réutilisables (évite allocations par frame)
const COLOR_GREEN = new THREE.Color('#00ff60')
const COLOR_GREEN_EMISSIVE = new THREE.Color('#00cc50')
const COLOR_RED = new THREE.Color('#ff3333')
const COLOR_RED_EMISSIVE = new THREE.Color('#ff0000')

// ─────────────────────────────────────────────
// KEYPAD BUTTON
// ─────────────────────────────────────────────

interface KeypadButtonProps {
  keyLabel: string
  position: Vec3
  onPress: (key: string) => void
}

const KeypadButton = memo(function KeypadButton({
  keyLabel,
  position,
  onPress,
}: KeypadButtonProps) {
  const [pressed, setPressed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(() => {
    onPress(keyLabel)
    setPressed(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setPressed(false), 100)
  }, [onPress, keyLabel])

  const color =
    keyLabel === 'E' ? '#00aa00' : keyLabel === 'C' ? '#ff4444' : '#3a3a4a'
  const pressedColor =
    keyLabel === 'E' ? '#00cc00' : keyLabel === 'C' ? '#ff6666' : '#5a5a6a'

  return (
    <mesh
      position={[position[0], position[1], position[2] + (pressed ? -0.005 : 0)]}
      onClick={handleClick}
      castShadow
    >
      <boxGeometry args={[0.06, 0.06, pressed ? 0.015 : 0.02]} />
      <meshStandardMaterial
        color={pressed ? pressedColor : color}
        metalness={0.5}
        roughness={0.4}
        emissive={pressed ? pressedColor : '#000000'}
        emissiveIntensity={pressed ? 0.3 : 0}
      />
    </mesh>
  )
})

// ─────────────────────────────────────────────
// KEYPAD LAYOUT
// ─────────────────────────────────────────────

const KEYPAD_LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', 'E'],
] as const

interface KeypadPadProps {
  position: Vec3
  onCodeAccepted: () => void
}

const KeypadPad = memo(function KeypadPad({ position, onCodeAccepted }: KeypadPadProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearErrorTimer = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
  }, [])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (key === 'C') {
        setCode('')
        setError(false)
        setSuccess(false)
        clearErrorTimer()
        return
      }

      if (key === 'E') {
        if (code === CORRECT_CODE) {
          setSuccess(true)
          onCodeAccepted()
          setCode('')
          setError(false)
          if (successTimerRef.current) clearTimeout(successTimerRef.current)
          successTimerRef.current = setTimeout(() => setSuccess(false), 1500)
        } else {
          setError(true)
          clearErrorTimer()
          errorTimerRef.current = setTimeout(() => {
            setError(false)
            setCode('')
            errorTimerRef.current = null
          }, 800)
        }
        return
      }

      setCode(prev => (prev.length < 4 ? prev + key : prev))
    },
    [code, onCodeAccepted, clearErrorTimer]
  )

  const buttons = useMemo(
    () =>
      KEYPAD_LAYOUT.flatMap((row, ri) =>
        row.map((key, ci) => ({
          key,
          id: `${ri}-${ci}`,
          position: [-0.08 + ci * 0.08, 1.15 - ri * 0.08, 0.08] as Vec3,
        }))
      ),
    []
  )

  const displayColor = error ? '#ff3333' : success ? '#00ff88' : '#00ff00'

  return (
    <group position={position}>
      {/* Housing */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.4, 0.55, 0.16]} />
        <meshStandardMaterial color="#222233" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Housing bevel */}
      <mesh position={[0, 1.2, 0.082]}>
        <boxGeometry args={[0.38, 0.53, 0.005]} />
        <meshStandardMaterial color="#2a2a3a" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Display screen */}
      <mesh position={[0, 1.38, 0.085]}>
        <boxGeometry args={[0.3, 0.08, 0.015]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Display frame */}
      <mesh position={[0, 1.38, 0.083]}>
        <boxGeometry args={[0.32, 0.1, 0.01]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Code dots */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`dot-${i}`} position={[-0.06 + i * 0.04, 1.34, 0.09]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial
            color={i < code.length ? '#00ff00' : '#333344'}
            emissive={i < code.length ? '#00ff00' : '#000000'}
            emissiveIntensity={i < code.length ? 0.8 : 0}
          />
        </mesh>
      ))}

      {/* Brand label */}
      <mesh position={[0, 1.44, 0.085]}>
        <boxGeometry args={[0.15, 0.02, 0.005]} />
        <meshStandardMaterial color="#444455" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Buttons */}
      {buttons.map(({ key, id, position: btnPos }) => (
        <KeypadButton key={id} keyLabel={key} position={btnPos} onPress={handleKeyPress} />
      ))}

      {/* Keypad glow */}
      <pointLight
        position={[0, 1.35, 0.2]}
        intensity={0.15}
        color={displayColor}
        distance={1}
        decay={2}
      />
    </group>
  )
})

// ─────────────────────────────────────────────
// SLIDING DOOR
// ─────────────────────────────────────────────

interface SlidingDoorProps {
  position: Vec3
  onOpen?: () => void
}

export const SlidingDoor = memo(function SlidingDoor({ position, onOpen }: SlidingDoorProps) {
  const leftRef = useRef<THREE.Mesh>(null)
  const rightRef = useRef<THREE.Mesh>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  const blockerRef = useRef<RapierRigidBody>(null)

  const nearRef = useRef(false)
  const unlockedRef = useRef(false)
  const open01 = useRef(0)

  const [isUnlocked, setIsUnlocked] = useState(false)

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null }
    if (lockTimerRef.current) { clearTimeout(lockTimerRef.current); lockTimerRef.current = null }
  }, [])

  useFrame((_, dt) => {
    const target = nearRef.current && unlockedRef.current ? 1 : 0
    open01.current = THREE.MathUtils.damp(open01.current, target, DOOR_DAMPING, dt)

    const slide = open01.current * DOOR_SLIDE_DISTANCE
    if (leftRef.current) leftRef.current.position.x = -0.75 - slide
    if (rightRef.current) rightRef.current.position.x = 0.75 + slide

    // LED couleur
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      if (unlockedRef.current) {
        mat.color.copy(COLOR_GREEN)
        mat.emissive.copy(COLOR_GREEN_EMISSIVE)
        mat.emissiveIntensity = 1.8
      } else {
        mat.color.copy(COLOR_RED)
        mat.emissive.copy(COLOR_RED_EMISSIVE)
        mat.emissiveIntensity = 1.2
      }
    }

    // Blocker toggle
    if (blockerRef.current) {
      const shouldBlock = open01.current < DOOR_OPEN_THRESHOLD
      if (shouldBlock !== blockerRef.current.isEnabled()) {
        blockerRef.current.setEnabled(shouldBlock)
      }
    }
  })

  const handleCodeAccepted = useCallback(() => {
    clearTimers()
    unlockedRef.current = true
    nearRef.current = true
    setIsUnlocked(true)
    onOpen?.()

    closeTimerRef.current = setTimeout(() => {
      nearRef.current = false
      lockTimerRef.current = setTimeout(() => {
        unlockedRef.current = false
        setIsUnlocked(false)
      }, DOOR_CLOSE_DELAY)
    }, DOOR_OPEN_DURATION)
  }, [onOpen, clearTimers])

  const handleSensorEnter = useCallback(() => { nearRef.current = true }, [])
  const handleSensorExit = useCallback(() => { nearRef.current = false }, [])

  const glassMat = useMemo(() => ({
    color: '#a8d8ff' as const,
    transmission: 0.88,
    thickness: 0.03,
    roughness: 0.05,
    metalness: 0,
    ior: 1.5,
    transparent: true,
    opacity: 0.92,
  }), [])

  return (
    <group position={position}>
      {/* Proximity sensor */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          sensor
          args={[2.5, 2.0, 2.5]}
          position={[0, 0, 2.0]}
          onIntersectionEnter={handleSensorEnter}
          onIntersectionExit={handleSensorExit}
        />
      </RigidBody>

      {/* Blocker */}
      <RigidBody type="fixed" colliders={false} ref={blockerRef}>
        <CuboidCollider args={[1.6, 1.6, 0.15]} position={[0, 0, 0.1]} />
      </RigidBody>

      {/* Top frame */}
      <mesh castShadow position={[0, 1.75, 0.08]}>
        <boxGeometry args={[3.5, 0.3, 0.25]} />
        <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Side rails */}
      {[-1.75, 1.75].map(x => (
        <mesh key={`rail-${x}`} position={[x, 0, 0.08]} castShadow>
          <boxGeometry args={[0.06, 3.5, 0.22]} />
          <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}

      {/* Bottom & top tracks */}
      {[-1.58, 1.58].map(y => (
        <mesh key={`track-${y}`} position={[0, y, 0.08]}>
          <boxGeometry args={[3.5, 0.04, 0.18]} />
          <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Left glass panel */}
      <mesh ref={leftRef} position={[-0.75, 0, 0.12]} castShadow>
        <boxGeometry args={[1.5, 3.2, 0.06]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Right glass panel */}
      <mesh ref={rightRef} position={[0.75, 0, 0.12]} castShadow>
        <boxGeometry args={[1.5, 3.2, 0.06]} />
        <meshPhysicalMaterial {...glassMat} />
      </mesh>

      {/* Handle strips */}
      {[-0.15, 0.15].map(x => (
        <mesh key={`handle-${x}`} position={[x, 0, 0.16]}>
          <boxGeometry args={[0.04, 0.6, 0.02]} />
          <meshStandardMaterial color="#888899" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* "PUSH" sticker */}
      <mesh position={[0.5, 0.2, 0.16]}>
        <boxGeometry args={[0.25, 0.06, 0.002]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} />
      </mesh>

      {/* Auto door sensor (top) */}
      <mesh position={[0, 1.85, 0.2]}>
        <boxGeometry args={[0.3, 0.06, 0.08]} />
        <meshStandardMaterial color="#222233" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.82, 0.25]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>

      {/* LED status */}
      <mesh ref={ledRef} position={[1.85, 1.1, 0.15]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial
          color={isUnlocked ? '#00ff60' : '#ff3333'}
          emissive={isUnlocked ? '#00cc50' : '#ff0000'}
          emissiveIntensity={1}
        />
      </mesh>

      {/* LED glow */}
      <pointLight
        position={[1.85, 1.1, 0.3]}
        intensity={0.3}
        color={isUnlocked ? '#00ff60' : '#ff3333'}
        distance={2}
        decay={2}
      />

      {/* Welcome mat */}
      <mesh position={[0, -1.59, 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 1.2]} />
        <meshStandardMaterial color="#2a2518" roughness={0.95} />
      </mesh>

      {/* Keypad */}
      <KeypadPad position={[2.2, 0, 0.15]} onCodeAccepted={handleCodeAccepted} />
    </group>
  )
})

// ─────────────────────────────────────────────
// SYSTEM EXPORT
// ─────────────────────────────────────────────

interface DoorSystemProps {
  position: Vec3
  onOpen?: () => void
}

export const DoorSystem = memo(function DoorSystem({ position, onOpen }: DoorSystemProps) {
  return <SlidingDoor position={position} onOpen={onOpen} />
})