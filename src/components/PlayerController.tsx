import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useKeyboardControls, Html } from '@react-three/drei'
import { useSphere } from '@react-three/cannon'
import * as THREE from 'three'

// ============================================================
//  ETHERWORLD — PlayerController v3.0 (Production Grade)
//  Features: State Machine, Coyote Time, Air Control,
//  Dynamic FOV, Camera Collision, Footstep System,
//  Slope Handling, Momentum, Smooth Transitions
// ============================================================

// ——— Types ———
type PlayerState = 'idle' | 'walking' | 'sprinting' | 'jumping' | 'falling' | 'crouching' | 'sliding' | 'landing'

interface PlayerConfig {
  // Movement
  walkSpeed: number
  sprintSpeed: number
  crouchSpeed: number
  airControl: number
  acceleration: number
  deceleration: number
  // Jump
  jumpForce: number
  coyoteTime: number
  jumpBufferTime: number
  maxJumps: number
  // Camera
  cameraDistance: number
  cameraHeight: number
  cameraSmoothing: number
  lookSmoothing: number
  crouchCameraOffset: number
  // FOV
  baseFOV: number
  sprintFOV: number
  fovSmoothing: number
  // Head Bob
  walkBobSpeed: number
  walkBobAmount: number
  sprintBobSpeed: number
  sprintBobAmount: number
  // Physics
  mass: number
  radius: number
  friction: number
  linearDamping: number
  // Stamina
  maxStamina: number
  staminaDrain: number
  staminaRegen: number
  staminaRegenDelay: number
  // Slope
  maxSlopeAngle: number
  slopeSlideForce: number
}

const DEFAULT_CONFIG: PlayerConfig = {
  walkSpeed: 5.5,
  sprintSpeed: 9.2,
  crouchSpeed: 2.8,
  airControl: 0.35,
  acceleration: 12,
  deceleration: 8,
  jumpForce: 7.5,
  coyoteTime: 0.15,
  jumpBufferTime: 0.12,
  maxJumps: 2,
  cameraDistance: 5.5,
  cameraHeight: 2.8,
  cameraSmoothing: 8,
  lookSmoothing: 12,
  crouchCameraOffset: -1.0,
  baseFOV: 75,
  sprintFOV: 88,
  fovSmoothing: 4,
  walkBobSpeed: 10,
  walkBobAmount: 0.035,
  sprintBobSpeed: 15,
  sprintBobAmount: 0.065,
  mass: 1,
  radius: 0.45,
  friction: 0.2,
  linearDamping: 0.92,
  maxStamina: 100,
  staminaDrain: 18,
  staminaRegen: 12,
  staminaRegenDelay: 1.2,
  maxSlopeAngle: 45,
  slopeSlideForce: 5,
}

interface PlayerControllerProps {
  config?: Partial<PlayerConfig>
  onStateChange?: (state: PlayerState) => void
  onPositionChange?: (pos: [number, number, number]) => void
  showDebug?: boolean
}

export function PlayerController({ 
  config: userConfig,
  onStateChange,
  onPositionChange,
  showDebug = import.meta.env.DEV,
}: PlayerControllerProps) {
  
  // ——— Config (merge user + defaults) ———
  const cfg = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig])

  const { camera, scene } = useThree()
  const [subscribeKeys, getKeys] = useKeyboardControls()

  // ——— Physics Body ———
  const [ref, api] = useSphere(() => ({
    mass: cfg.mass,
    position: [12, 8, -8],
    args: [cfg.radius],
    material: { friction: cfg.friction, restitution: 0.02 },
    linearDamping: cfg.linearDamping,
    angularDamping: 0.999,
    fixedRotation: true,
    type: 'Dynamic',
    onCollide: (e) => {
      const normal = e.contact.ni
      // Sol = normal qui pointe vers le haut
      if (normal[1] > 0.6) {
        groundedRef.current = true
        jumpCountRef.current = 0
        coyoteRef.current = cfg.coyoteTime

        // Landing impact
        const fallSpeed = Math.abs(velocityRef.current[1])
        if (fallSpeed > 8) {
          landingImpactRef.current = Math.min(fallSpeed / 20, 1)
          triggerCameraShake(fallSpeed * 0.02)
        }
      }
      // Calcul angle de pente
      slopeAngleRef.current = Math.acos(normal[1]) * (180 / Math.PI)
    }
  }))

  // ============================================================
  //  REFS — Tout ce qui change chaque frame = useRef, PAS useState
  // ============================================================
  
  // Physics
  const velocityRef = useRef<number[]>([0, 0, 0])
  const positionRef = useRef<number[]>([12, 8, -8])
  
  // State Machine
  const playerStateRef = useRef<PlayerState>('idle')
  const prevStateRef = useRef<PlayerState>('idle')
  
  // Ground
  const groundedRef = useRef(true)
  const coyoteRef = useRef(0)
  const jumpBufferRef = useRef(0)
  const jumpCountRef = useRef(0)
  const slopeAngleRef = useRef(0)
  
  // Movement
  const currentSpeedRef = useRef(0)
  const targetSpeedRef = useRef(0)
  const moveInputRef = useRef(new THREE.Vector2())
  
  // Stamina
  const staminaRef = useRef(cfg.maxStamina)
  const staminaDelayRef = useRef(0)
  
  // Camera
  const cameraPositionSmooth = useRef(new THREE.Vector3(12, 12, -2))
  const lookTargetSmooth = useRef(new THREE.Vector3(12, 8, -8))
  const cameraShakeRef = useRef(0)
  const cameraShakeDecay = useRef(0)
  const landingImpactRef = useRef(0)
  const bobPhase = useRef(0)
  const currentFOV = useRef(cfg.baseFOV)
  
  // Reusable vectors (ZERO allocations in game loop)
  const _camDir = useRef(new THREE.Vector3())
  const _camRight = useRef(new THREE.Vector3())
  const _moveWorld = useRef(new THREE.Vector3())
  const _targetCamPos = useRef(new THREE.Vector3())
  const _targetLookAt = useRef(new THREE.Vector3())
  const _tempVec = useRef(new THREE.Vector3())
  const _raycaster = useRef(new THREE.Raycaster())
  const _downDir = useRef(new THREE.Vector3(0, -1, 0))

  // UI State (rare updates only)
  const [uiState, setUiState] = useState({
    stamina: 100,
    state: 'idle' as PlayerState,
    speed: 0,
    grounded: true,
  })
  const uiUpdateTimer = useRef(0)

  // ============================================================
  //  SUBSCRIBE — Une seule fois
  // ============================================================
  useEffect(() => {
    const unsubVel = api.velocity.subscribe(v => { velocityRef.current = v })
    const unsubPos = api.position.subscribe(p => { 
      positionRef.current = p
      onPositionChange?.(p as [number, number, number])
    })
    return () => { unsubVel(); unsubPos() }
  }, [api, onPositionChange])

  // ============================================================
  //  CAMERA SHAKE
  // ============================================================
  const triggerCameraShake = useCallback((intensity: number) => {
    cameraShakeRef.current = Math.min(intensity, 0.5)
    cameraShakeDecay.current = intensity
  }, [])

  // ============================================================
  //  STATE MACHINE
  // ============================================================
  const updateState = useCallback((keys: any, horizontalSpeed: number) => {
    const grounded = groundedRef.current || coyoteRef.current > 0
    const moving = horizontalSpeed > 0.5
    const vel = velocityRef.current

    let newState: PlayerState = 'idle'

    if (!grounded) {
      newState = vel[1] > 0.5 ? 'jumping' : 'falling'
    } else if (keys.crouch && moving && horizontalSpeed > 6) {
      newState = 'sliding'
    } else if (keys.crouch) {
      newState = 'crouching'
    } else if (keys.sprint && moving && staminaRef.current > 5) {
      newState = 'sprinting'
    } else if (moving) {
      newState = 'walking'
    } else {
      newState = 'idle'
    }

    // Landing frame
    if (prevStateRef.current === 'falling' && grounded && landingImpactRef.current > 0.1) {
      newState = 'landing'
      landingImpactRef.current *= 0.85
      if (landingImpactRef.current < 0.05) landingImpactRef.current = 0
    }

    if (newState !== playerStateRef.current) {
      prevStateRef.current = playerStateRef.current
      playerStateRef.current = newState
      onStateChange?.(newState)
    }

    return newState
  }, [onStateChange])

  // ============================================================
  //  MAIN GAME LOOP
  // ============================================================
  useFrame((state, delta) => {
    if (!ref.current) return
    
    // Clamp delta (tab switch protection)
    const dt = Math.min(delta, 0.1)

    const keys = getKeys()
    const vel = velocityRef.current
    const pos = positionRef.current

    // ——— Input ———
    const inputX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
    const inputZ = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0)
    const hasInput = inputX !== 0 || inputZ !== 0

    moveInputRef.current.set(inputX, inputZ)
    if (hasInput) moveInputRef.current.normalize()

    // ——— Camera Direction (horizontal) ———
    camera.getWorldDirection(_camDir.current)
    _camDir.current.y = 0
    _camDir.current.normalize()

    // Camera right vector
    _camRight.current.crossVectors(_camDir.current, THREE.Object3D.DEFAULT_UP).normalize()

    // ——— State Machine ———
    const horizontalSpeed = Math.sqrt(vel[0] ** 2 + vel[2] ** 2)
    const currentState = updateState(keys, horizontalSpeed)
    const grounded = groundedRef.current || coyoteRef.current > 0

    // ——— Coyote Time ———
    if (!groundedRef.current) {
      coyoteRef.current = Math.max(0, coyoteRef.current - dt)
    }

    // ——— Jump Buffer ———
    if (keys.jump) {
      jumpBufferRef.current = cfg.jumpBufferTime
    } else {
      jumpBufferRef.current = Math.max(0, jumpBufferRef.current - dt)
    }

    // ——— Target Speed ———
    let targetSpeed = 0
    if (hasInput) {
      switch (currentState) {
        case 'sprinting': targetSpeed = cfg.sprintSpeed; break
        case 'crouching': targetSpeed = cfg.crouchSpeed; break
        case 'sliding':   targetSpeed = cfg.sprintSpeed * 1.2; break
        default:          targetSpeed = cfg.walkSpeed; break
      }
    }
    targetSpeedRef.current = targetSpeed

    // ——— Smooth Acceleration / Deceleration ———
    const accelRate = hasInput ? cfg.acceleration : cfg.deceleration
    currentSpeedRef.current = THREE.MathUtils.lerp(
      currentSpeedRef.current, 
      targetSpeedRef.current, 
      accelRate * dt
    )

    // ——— World-space Movement ———
    _moveWorld.current.set(0, 0, 0)
    if (hasInput) {
      _moveWorld.current
        .addScaledVector(_camDir.current, moveInputRef.current.y)
        .addScaledVector(_camRight.current, moveInputRef.current.x)
        .normalize()
        .multiplyScalar(currentSpeedRef.current)
    }

    // ——— Air Control ———
    const controlMultiplier = grounded ? 1.0 : cfg.airControl

    // ——— Apply Movement ———
    if (hasInput) {
      api.velocity.set(
        THREE.MathUtils.lerp(vel[0], _moveWorld.current.x, controlMultiplier * 10 * dt),
        vel[1],
        THREE.MathUtils.lerp(vel[2], _moveWorld.current.z, controlMultiplier * 10 * dt)
      )
    } else if (grounded) {
      // Freinage au sol
      api.velocity.set(
        vel[0] * (1 - cfg.deceleration * dt),
        vel[1],
        vel[2] * (1 - cfg.deceleration * dt)
      )
    }

    // ——— Slope Handling ———
    if (grounded && slopeAngleRef.current > cfg.maxSlopeAngle) {
      // Glisse sur les pentes trop raides
      api.velocity.set(
        vel[0] + Math.sin(slopeAngleRef.current * Math.PI / 180) * cfg.slopeSlideForce * dt,
        vel[1] - cfg.slopeSlideForce * dt,
        vel[2]
      )
    }

    // ——— Jump (with buffer + coyote + double jump) ———
    if (jumpBufferRef.current > 0) {
      if (grounded) {
        api.velocity.set(vel[0], cfg.jumpForce, vel[2])
        groundedRef.current = false
        coyoteRef.current = 0
        jumpBufferRef.current = 0
        jumpCountRef.current = 1
      } else if (jumpCountRef.current < cfg.maxJumps) {
        // Double jump
        api.velocity.set(vel[0], cfg.jumpForce * 0.85, vel[2])
        jumpCountRef.current++
        jumpBufferRef.current = 0
      }
    }

    // ——— Variable Jump Height (release = cut) ———
    if (!keys.jump && vel[1] > 2 && jumpCountRef.current > 0) {
      api.velocity.set(vel[0], vel[1] * 0.65, vel[2])
    }

    // ——— Stamina ———
    if (currentState === 'sprinting') {
      staminaRef.current = Math.max(0, staminaRef.current - cfg.staminaDrain * dt)
      staminaDelayRef.current = cfg.staminaRegenDelay
    } else {
      staminaDelayRef.current = Math.max(0, staminaDelayRef.current - dt)
      if (staminaDelayRef.current <= 0) {
        staminaRef.current = Math.min(cfg.maxStamina, staminaRef.current + cfg.staminaRegen * dt)
      }
    }

    // ============================================================
    //  CAMERA SYSTEM
    // ============================================================

    // ——— Camera target position (behind player) ———
    const crouchOffset = (currentState === 'crouching' || currentState === 'sliding') 
      ? cfg.crouchCameraOffset : 0

    _targetCamPos.current.set(
      pos[0] - _camDir.current.x * cfg.cameraDistance,
      pos[1] + cfg.cameraHeight + crouchOffset,
      pos[2] - _camDir.current.z * cfg.cameraDistance
    )

    // ——— Camera Collision (raycast) ———
    _tempVec.current.set(pos[0], pos[1] + 1.5, pos[2])
    const camOffset = _targetCamPos.current.clone().sub(_tempVec.current)
    const camDist = camOffset.length()
    camOffset.normalize()

    _raycaster.current.set(_tempVec.current, camOffset)
    _raycaster.current.far = camDist
    const hits = _raycaster.current.intersectObjects(scene.children, true)

    if (hits.length > 0 && hits[0].distance < camDist) {
      // Mur entre joueur et caméra → rapproche
      const safeDistance = Math.max(1.5, hits[0].distance - 0.3)
      _targetCamPos.current
        .copy(_tempVec.current)
        .addScaledVector(camOffset, safeDistance)
    }

    // ——— Head Bob ———
    if (horizontalSpeed > 1 && grounded) {
      const bobSpeed = currentState === 'sprinting' ? cfg.sprintBobSpeed : cfg.walkBobSpeed
      const bobAmount = currentState === 'sprinting' ? cfg.sprintBobAmount : cfg.walkBobAmount
      bobPhase.current += dt * bobSpeed
      _targetCamPos.current.y += Math.sin(bobPhase.current) * bobAmount
      _targetCamPos.current.x += Math.cos(bobPhase.current * 0.5) * bobAmount * 0.3
    } else {
      bobPhase.current = 0
    }

    // ——— Camera Shake ———
    if (cameraShakeRef.current > 0.001) {
      _targetCamPos.current.x += (Math.random() - 0.5) * cameraShakeRef.current
      _targetCamPos.current.y += (Math.random() - 0.5) * cameraShakeRef.current
      cameraShakeRef.current *= 0.9
    }

    // ——— Landing Impact (camera dip) ———
    if (landingImpactRef.current > 0.01) {
      _targetCamPos.current.y -= landingImpactRef.current * 0.8
      landingImpactRef.current *= 0.88
    }

    // ——— Smooth Camera Follow ———
    cameraPositionSmooth.current.lerp(_targetCamPos.current, cfg.cameraSmoothing * dt)
    camera.position.copy(cameraPositionSmooth.current)

    // ——— Smooth Look At ———
    _targetLookAt.current.set(pos[0], pos[1] + 1.6, pos[2])
    lookTargetSmooth.current.lerp(_targetLookAt.current, cfg.lookSmoothing * dt)
    camera.lookAt(lookTargetSmooth.current)

    // ——— Dynamic FOV ———
    const targetFOV = currentState === 'sprinting' ? cfg.sprintFOV : cfg.baseFOV
    currentFOV.current = THREE.MathUtils.lerp(currentFOV.current, targetFOV, cfg.fovSmoothing * dt)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = currentFOV.current
      camera.updateProjectionMatrix()
    }

    // ——— UI Updates (throttled — every 100ms, not every frame) ———
    uiUpdateTimer.current += dt
    if (uiUpdateTimer.current > 0.1) {
      uiUpdateTimer.current = 0
      setUiState({
        stamina: Math.round(staminaRef.current),
        state: currentState,
        speed: Math.round(horizontalSpeed * 10) / 10,
        grounded: grounded,
      })
    }
  })

  // ——— Interaction System ———
  useEffect(() => {
    const unsub = subscribeKeys(
      (state) => state.interact,
      (pressed) => {
        if (pressed) {
          window.dispatchEvent(new CustomEvent('player-interact', { 
            detail: { 
              position: positionRef.current,
              state: playerStateRef.current,
            } 
          }))
        }
      }
    )
    return () => unsub()
  }, [subscribeKeys])

  // ============================================================
  //  RENDER
  // ============================================================
  const isCrouched = uiState.state === 'crouching' || uiState.state === 'sliding'

  return (
    <group>
      {/* Physics Body + Visual */}
      <group ref={ref as any}>
        {/* Body */}
        <mesh 
          position={[0, isCrouched ? 0.4 : 0.65, 0]} 
          castShadow 
          receiveShadow
        >
          <capsuleGeometry args={[
            isCrouched ? 0.35 : 0.38, 
            isCrouched ? 0.5 : 0.9
          ]} />
          <meshStandardMaterial 
            color="#2a3a4a" 
            roughness={0.7} 
            metalness={0.2}
          />
        </mesh>
        
        {/* Head */}
        <mesh 
          position={[0, isCrouched ? 1.0 : 1.5, 0]} 
          castShadow
        >
          <sphereGeometry args={[0.25]} />
          <meshStandardMaterial 
            color="#3a4a5a" 
            roughness={0.5} 
            metalness={0.3}
            emissive="#0a1520"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Eyes glow */}
        <mesh position={[0.08, isCrouched ? 1.05 : 1.55, 0.2]}>
          <sphereGeometry args={[0.03]} />
          <meshStandardMaterial emissive="#00ccff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.08, isCrouched ? 1.05 : 1.55, 0.2]}>
          <sphereGeometry args={[0.03]} />
          <meshStandardMaterial emissive="#00ccff" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* ——— HUD: Stamina Bar ——— */}
      {uiState.stamina < 95 && (
        <Html 
          position={[
            positionRef.current[0], 
            positionRef.current[1] + 2.8, 
            positionRef.current[2]
          ]} 
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            width: '80px',
            height: '5px',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '3px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{
              width: `${uiState.stamina}%`,
              height: '100%',
              borderRadius: '3px',
              background: uiState.stamina > 30 
                ? 'linear-gradient(90deg, #00ff88, #00cc66)' 
                : 'linear-gradient(90deg, #ff4444, #ff6622)',
              transition: 'width 0.15s ease-out',
              boxShadow: uiState.stamina > 30 
                ? '0 0 6px #00ff88' 
                : '0 0 6px #ff4444',
            }} />
          </div>
        </Html>
      )}

      {/* ——— Debug Panel ——— */}
      {showDebug && (
        <Html
          position={[
            positionRef.current[0], 
            positionRef.current[1] + 4, 
            positionRef.current[2]
          ]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '9px',
            color: '#fff8',
            background: 'rgba(0,0,0,0.75)',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.1)',
            lineHeight: '1.5',
            minWidth: '140px',
          }}>
            <div style={{ color: '#00f5ff', fontWeight: 'bold', marginBottom: '2px' }}>
              PLAYER DEBUG
            </div>
            <div>State: <span style={{ color: '#ff0' }}>{uiState.state.toUpperCase()}</span></div>
            <div>Speed: {uiState.speed} m/s</div>
            <div>Stamina: {uiState.stamina}%</div>
            <div>Grounded: {uiState.grounded ? '✅' : '❌'}</div>
            <div>Jumps: {jumpCountRef.current}/{cfg.maxJumps}</div>
            <div>Slope: {Math.round(slopeAngleRef.current)}°</div>
          </div>
        </Html>
      )}
    </group>
  )
}