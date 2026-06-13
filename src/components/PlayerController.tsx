import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useSphere } from '@react-three/cannon'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

// Enriched Player from both repos + Real-shit features
interface PlayerControllerProps {
  speed?: number
  jumpForce?: number
  sprintMultiplier?: number
}

export function PlayerController({ 
  speed = 42, 
  jumpForce = 28, 
  sprintMultiplier = 1.85 
}: PlayerControllerProps) {
  const { camera } = useThree()
  const [subscribeKeys, getKeys] = useKeyboardControls()
  
  // Physics body (sphere for smooth movement)
  const [ref, api] = useSphere(() => ({
    mass: 1.8,
    position: [12, 18, -8],
    args: [0.85],
    material: { friction: 0.4, restitution: 0.15 },
    linearDamping: 0.88,
    angularDamping: 0.95,
    fixedRotation: true,
    type: 'Dynamic'
  }))

  // Player state
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const frontVector = useRef(new THREE.Vector3())
  const sideVector = useRef(new THREE.Vector3())
  const [isGrounded, setIsGrounded] = useState(true)
  const [isSprinting, setIsSprinting] = useState(false)
  const [isCrouching, setIsCrouching] = useState(false)
  const [health, setHealth] = useState(100)
  const [stamina, setStamina] = useState(100)

  // Camera offset & bob
  const cameraTarget = useRef(new THREE.Vector3())
  const bobTime = useRef(0)
  const lastPosition = useRef(new THREE.Vector3())

  // Interaction raycaster
  const raycaster = useRef(new THREE.Raycaster())
  const [interactable, setInteractable] = useState<string | null>(null)

  // Enhanced movement + controls
  useFrame((state, delta) => {
    const keys = getKeys()
    
    // Movement vectors
    frontVector.current.set(0, 0, (keys.backward ? 1 : 0) - (keys.forward ? 1 : 0))
    sideVector.current.set((keys.left ? 1 : 0) - (keys.right ? 1 : 0), 0, 0)
    
    direction.current
      .subVectors(frontVector.current, sideVector.current)
      .normalize()
      .multiplyScalar(speed * (keys.sprint ? sprintMultiplier : 1))
    
    // Apply velocity
    api.velocity.subscribe((v) => velocity.current.set(v[0], v[1], v[2]))
    
    const currentSpeed = Math.sqrt(velocity.current.x ** 2 + velocity.current.z ** 2)
    setIsSprinting(keys.sprint && currentSpeed > 8)
    setIsCrouching(keys.crouch)
    
    // Apply movement relative to camera
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    cameraDirection.y = 0
    cameraDirection.normalize()
    
    const moveX = direction.current.x * cameraDirection.z - direction.current.z * cameraDirection.x
    const moveZ = direction.current.x * cameraDirection.x + direction.current.z * cameraDirection.z
    
    api.velocity.set(
      moveX * (isCrouching ? 0.55 : 1),
      velocity.current.y,
      moveZ * (isCrouching ? 0.55 : 1)
    )
    
    // Jumping (only if grounded)
    if (keys.jump && isGrounded) {
      api.velocity.set(velocity.current.x, jumpForce, velocity.current.z)
      setIsGrounded(false)
    }
    
    // Update camera position (third person + head bob)
    const playerPos = ref.current?.position || { x: 0, y: 18, z: 0 }
    
    const targetX = playerPos.x - cameraDirection.x * 8.5
    const targetZ = playerPos.z - cameraDirection.z * 8.5
    const targetY = playerPos.y + 4.2 + (isCrouching ? -1.2 : 0)
    
    cameraTarget.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.12)
    camera.position.lerp(cameraTarget.current, 0.18)
    
    // Head bob when moving
    if (currentSpeed > 3) {
      bobTime.current += delta * (isSprinting ? 18 : 11)
      const bobAmount = Math.sin(bobTime.current) * (isSprinting ? 0.12 : 0.07)
      camera.position.y += bobAmount
    }
    
    camera.lookAt(playerPos.x, playerPos.y + 2.8, playerPos.z)
    
    // Interaction detection
    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera)
    // In real implementation: check for hotels, depanneur, vehicles, etc.
    
    // Stamina system
    if (isSprinting) {
      setStamina(s => Math.max(0, s - delta * 22))
    } else {
      setStamina(s => Math.min(100, s + delta * 18))
    }
    
    // Ground check (simplified)
    if (velocity.current.y < -1) setIsGrounded(false)
    if (velocity.current.y > -0.1 && velocity.current.y < 1) setIsGrounded(true)
  })

  // Interaction handler
  const handleInteract = () => {
    console.log('%c[Player] Interaction triggered', 'color:#0f0')
    // Dispatch event for nearby objects (hotel door, vehicle enter, etc.)
    window.dispatchEvent(new CustomEvent('player-interact', { 
      detail: { position: ref.current?.position } 
    }))
  }

  // Keyboard interaction
  useEffect(() => {
    const unsub = subscribeKeys(
      (state) => state.interact,
      (pressed) => {
        if (pressed) handleInteract()
      }
    )
    return () => unsub()
  }, [subscribeKeys])

  return (
    <group>
      {/* Player Mesh (invisible physics body) */}
      <group ref={ref as any}>
        {/* Visual player model placeholder - replace with real GLTF later */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.7, 1.4]} />
          <meshLambertMaterial color="#334455" />
        </mesh>
        
        {/* Head indicator */}
        <mesh position={[0, 2.1, 0]}>
          <sphereGeometry args={[0.45]} />
          <meshLambertMaterial color="#445566" emissive="#112233" />
        </mesh>
      </group>
      
      {/* Interaction Prompt */}
      {interactable && (
        <Html position={[0, 3.5, 0]} style={{ pointerEvents: 'none' }}>
          <div className="px-4 py-1.5 bg-black/70 text-white text-sm rounded-full border border-white/30 flex items-center gap-2">
            <span>Press <strong>E</strong> to {interactable}</span>
          </div>
        </Html>
      )}
      
      {/* Debug Info (dev) */}
      {import.meta.env.DEV && (
        <Html position={[0, 6, 0]} style={{ fontSize: '10px', color: '#fff4', fontFamily: 'monospace' }}>
          Speed: {Math.round(Math.sqrt(velocity.current.x**2 + velocity.current.z**2))} | Stamina: {Math.floor(stamina)}
        </Html>
      )}
    </group>
  )
}
