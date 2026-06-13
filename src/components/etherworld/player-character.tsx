import { memo, useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useWorldStore, INTERACTION_ZONES } from "./world-store"

// ═══════════════════════════════════════════════════════════
// PHYSICS & MOVEMENT CONSTANTS
// ═══════════════════════════════════════════════════════════

const GRAVITY = -22
const JUMP_FORCE = 9.0
const WALK_SPEED = 5.0
const RUN_SPEED = 10.0
const CROUCH_SPEED = 2.5
const CROUCH_HEIGHT_SCALE = 0.7

// ═══════════════════════════════════════════════════════════
// CAMERA CONSTANTS
// ═══════════════════════════════════════════════════════════

const CAM_MIN_DIST = 3
const CAM_MAX_DIST = 22
const CAM_MIN_PITCH = 0.05
const CAM_MAX_PITCH = 1.4
const CAM_SENSITIVITY = 0.003
const CAM_LOOK_HEIGHT = 1.5
const CAM_SMOOTH_FACTOR = 0.9
const CAM_COLLISION_OFFSET = 0.3

// ═══════════════════════════════════════════════════════════
// ANIMATION CONSTANTS
// ═══════════════════════════════════════════════════════════

const BLINK_INTERVAL_MIN = 2.0
const BLINK_INTERVAL_MAX = 5.0
const BLINK_DURATION = 0.12
const IDLE_SWAY_SPEED = 0.8
const IDLE_SWAY_AMOUNT = 0.015
const BREATH_SPEED = 1.6
const BREATH_AMOUNT = 0.007
const HEAD_BOB_RUN = 0.025
const HEAD_BOB_WALK = 0.012
const LANDING_SQUASH_DECAY = 8
const SPRINT_PARTICLE_INTERVAL = 0.08

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface InputState {
  keys: Record<string, boolean>
  camYaw: number
  camPitch: number
  camDist: number
  isDragging: boolean
  lastX: number
  lastY: number
}

interface PhysicsState {
  vy: number
  grounded: boolean
  coyote: number
  impact: number
  wasGrounded: boolean
  airTime: number
  crouching: boolean
}

interface AnimationState {
  t: number
  spd: number
  breath: number
  bob: number
  blinkTimer: number
  blinkNextAt: number
  isBlinking: boolean
  idleTimer: number
  idlePhase: number
  headTilt: number
  targetHeadTilt: number
  sprintTime: number
  lastSprintParticle: number
  footstepPhase: number
  lastFootstep: boolean
  emotionTimer: number
  lookAtOffset: number
}

// ═══════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function createInput(): InputState {
  return {
    keys: {},
    camYaw: Math.PI,
    camPitch: 0.32,
    camDist: 9,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  }
}

function createPhysics(): PhysicsState {
  return {
    vy: 0,
    grounded: true,
    coyote: 0,
    impact: 0,
    wasGrounded: true,
    airTime: 0,
    crouching: false,
  }
}

function createAnimation(): AnimationState {
  return {
    t: 0,
    spd: 0,
    breath: 0,
    bob: 0,
    blinkTimer: 0,
    blinkNextAt: BLINK_INTERVAL_MIN + Math.random() * (BLINK_INTERVAL_MAX - BLINK_INTERVAL_MIN),
    isBlinking: false,
    idleTimer: 0,
    idlePhase: 0,
    headTilt: 0,
    targetHeadTilt: 0,
    sprintTime: 0,
    lastSprintParticle: 0,
    footstepPhase: 0,
    lastFootstep: false,
    emotionTimer: 0,
    lookAtOffset: 0,
  }
}

function nextBlinkInterval(): number {
  return BLINK_INTERVAL_MIN + Math.random() * (BLINK_INTERVAL_MAX - BLINK_INTERVAL_MIN)
}

// ═══════════════════════════════════════════════════════════
// INPUT HOOK
// ═══════════════════════════════════════════════════════════

function useInput(ref: React.MutableRefObject<InputState>) {
  useEffect(() => {
    const inp = ref.current

    const kd = (event: KeyboardEvent) => {
      inp.keys[event.code] = true
    }

    const ku = (event: KeyboardEvent) => {
      inp.keys[event.code] = false
    }

    const md = (event: MouseEvent) => {
      if (event.button === 2 || event.button === 1) {
        inp.isDragging = true
        inp.lastX = event.clientX
        inp.lastY = event.clientY
      }
    }

    const mu = (event: MouseEvent) => {
      if (event.button === 2 || event.button === 1) inp.isDragging = false
    }

    const mm = (event: MouseEvent) => {
      if (!inp.isDragging) return

      inp.camYaw -= (event.clientX - inp.lastX) * CAM_SENSITIVITY
      inp.camPitch = THREE.MathUtils.clamp(
        inp.camPitch + (event.clientY - inp.lastY) * CAM_SENSITIVITY * 0.75,
        CAM_MIN_PITCH,
        CAM_MAX_PITCH
      )

      inp.lastX = event.clientX
      inp.lastY = event.clientY
    }

    const wh = (event: WheelEvent) => {
      inp.camDist = THREE.MathUtils.clamp(
        inp.camDist + event.deltaY * 0.007,
        CAM_MIN_DIST,
        CAM_MAX_DIST
      )
    }

    const preventContextMenu = (event: MouseEvent) => event.preventDefault()

    window.addEventListener("keydown", kd)
    window.addEventListener("keyup", ku)
    window.addEventListener("mousedown", md)
    window.addEventListener("mouseup", mu)
    window.addEventListener("mousemove", mm)
    window.addEventListener("wheel", wh, { passive: true })
    window.addEventListener("contextmenu", preventContextMenu)

    return () => {
      window.removeEventListener("keydown", kd)
      window.removeEventListener("keyup", ku)
      window.removeEventListener("mousedown", md)
      window.removeEventListener("mouseup", mu)
      window.removeEventListener("mousemove", mm)
      window.removeEventListener("wheel", wh)
      window.removeEventListener("contextmenu", preventContextMenu)
    }
  }, [ref])
}

// ═══════════════════════════════════════════════════════════
// SHARED GEOMETRIES — ENRICHED
// ═══════════════════════════════════════════════════════════

const GEO = {
  // Tête et visage
  head: new THREE.BoxGeometry(0.5, 0.5, 0.5),
  neck: new THREE.CylinderGeometry(0.08, 0.1, 0.12, 8),
  ear: new THREE.BoxGeometry(0.06, 0.12, 0.06),
  nose: new THREE.BoxGeometry(0.06, 0.06, 0.06),
  eyebrow: new THREE.BoxGeometry(0.1, 0.02, 0.015),
  eyelid: new THREE.BoxGeometry(0.115, 0.045, 0.012),

  // Cheveux
  hairTop: new THREE.BoxGeometry(0.52, 0.12, 0.52),
  hairBack: new THREE.BoxGeometry(0.52, 0.3, 0.08),
  hairSideL: new THREE.BoxGeometry(0.06, 0.25, 0.48),
  hairSideR: new THREE.BoxGeometry(0.06, 0.25, 0.48),
  hairFringe: new THREE.BoxGeometry(0.4, 0.06, 0.08),

  // Corps
  torso: new THREE.BoxGeometry(0.68, 0.8, 0.36),
  torsoCollar: new THREE.BoxGeometry(0.5, 0.08, 0.3),
  shoulderPad: new THREE.BoxGeometry(0.15, 0.08, 0.22),

  // Bras
  upperArm: new THREE.BoxGeometry(0.2, 0.48, 0.2),
  forearm: new THREE.BoxGeometry(0.17, 0.3, 0.17),
  hand: new THREE.BoxGeometry(0.12, 0.1, 0.12),
  thumb: new THREE.BoxGeometry(0.04, 0.06, 0.04),
  finger: new THREE.BoxGeometry(0.03, 0.07, 0.03),
  wristband: new THREE.BoxGeometry(0.19, 0.04, 0.19),

  // Jambes
  upperLeg: new THREE.BoxGeometry(0.24, 0.42, 0.24),
  lowerLeg: new THREE.BoxGeometry(0.22, 0.36, 0.22),
  knee: new THREE.BoxGeometry(0.18, 0.06, 0.2),
  shoe: new THREE.BoxGeometry(0.26, 0.09, 0.34),
  shoeDetail: new THREE.BoxGeometry(0.24, 0.03, 0.18),
  shoeSole: new THREE.BoxGeometry(0.27, 0.03, 0.36),
  shoeLace: new THREE.BoxGeometry(0.12, 0.015, 0.15),

  // Chapeau
  hatTop: new THREE.CylinderGeometry(0.26, 0.3, 0.2, 12),
  hatBrim: new THREE.CylinderGeometry(0.4, 0.4, 0.04, 16),
  hatButton: new THREE.SphereGeometry(0.03, 8, 8),
  hatBand: new THREE.CylinderGeometry(0.305, 0.305, 0.04, 12),

  // Ceinture
  belt: new THREE.BoxGeometry(0.7, 0.07, 0.38),
  beltBuckle: new THREE.BoxGeometry(0.08, 0.06, 0.04),

  // Accessoires
  watchFace: new THREE.BoxGeometry(0.06, 0.06, 0.025),
  watchBand: new THREE.BoxGeometry(0.04, 0.12, 0.02),
  backpackBody: new THREE.BoxGeometry(0.4, 0.5, 0.2),
  backpackFlap: new THREE.BoxGeometry(0.38, 0.15, 0.04),
  backpackStrap: new THREE.BoxGeometry(0.04, 0.4, 0.02),
  backpackPocket: new THREE.BoxGeometry(0.3, 0.15, 0.04),

  // Détails vestimentaires
  pocket: new THREE.BoxGeometry(0.12, 0.1, 0.015),
  buttonSmall: new THREE.CylinderGeometry(0.012, 0.012, 0.01, 6),
  zipperLine: new THREE.BoxGeometry(0.015, 0.55, 0.012),
  collarFlap: new THREE.BoxGeometry(0.18, 0.06, 0.08),

  // Ombre et effets
  shadow: new THREE.CircleGeometry(0.55, 24),
  footprintL: new THREE.BoxGeometry(0.18, 0.002, 0.28),
  footprintR: new THREE.BoxGeometry(0.18, 0.002, 0.28),
  sprintDust: new THREE.SphereGeometry(0.04, 6, 6),
}

// Temporary vectors — avoid allocations
const _v3A = new THREE.Vector3()
const _v3B = new THREE.Vector3()
const _v3C = new THREE.Vector3()
const _v3D = new THREE.Vector3()

// ═══════════════════════════════════════════════════════════
// SPRINT DUST PARTICLES
// ═══════════════════════════════════════════════════════════

function SprintDustParticles() {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<
    Array<{
      mesh: THREE.Mesh
      vel: THREE.Vector3
      life: number
      maxLife: number
    }>
  >([])

  const dustMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#8b7355",
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    []
  )

  useFrame((_, dt) => {
    if (!groupRef.current) return
    const toRemove: number[] = []

    particlesRef.current.forEach((p, i) => {
      p.life -= dt
      if (p.life <= 0) {
        toRemove.push(i)
        groupRef.current!.remove(p.mesh)
        return
      }

      const alpha = p.life / p.maxLife
      const mat = p.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = alpha * 0.3

      p.mesh.position.addScaledVector(p.vel, dt)
      p.vel.y += 0.5 * dt
      p.mesh.scale.setScalar(1 + (1 - alpha) * 2)
    })

    // Remove dead particles (reverse order)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      particlesRef.current.splice(toRemove[i], 1)
    }
  })

  // Expose spawn function via ref data
  const spawnParticle = useMemo(
    () => (worldPos: THREE.Vector3) => {
      if (!groupRef.current || particlesRef.current.length > 20) return

      const mesh = new THREE.Mesh(GEO.sprintDust, dustMat.clone())
      mesh.position.copy(worldPos)
      mesh.position.y = 0.05
      mesh.position.x += (Math.random() - 0.5) * 0.3
      mesh.position.z += (Math.random() - 0.5) * 0.3

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        0.3 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.8
      )

      const maxLife = 0.4 + Math.random() * 0.3
      groupRef.current.add(mesh)
      particlesRef.current.push({ mesh, vel, life: maxLife, maxLife })
    },
    [dustMat]
  )

  // Attach spawn function to group userData for parent access
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData.spawnParticle = spawnParticle
    }
  }, [spawnParticle])

  return <group ref={groupRef} />
}

// ═══════════════════════════════════════════════════════════
// FOOTPRINT SYSTEM
// ═══════════════════════════════════════════════════════════

function FootprintTrail() {
  const groupRef = useRef<THREE.Group>(null)
  const footprintsRef = useRef<Array<{ mesh: THREE.Mesh; life: number }>>([])

  const fpMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#1a1a1a",
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      }),
    []
  )

  useFrame((_, dt) => {
    if (!groupRef.current) return

    const toRemove: number[] = []
    footprintsRef.current.forEach((fp, i) => {
      fp.life -= dt * 0.3
      if (fp.life <= 0) {
        toRemove.push(i)
        groupRef.current!.remove(fp.mesh)
        return
      }
      const mat = fp.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = fp.life * 0.08
    })

    for (let i = toRemove.length - 1; i >= 0; i--) {
      footprintsRef.current.splice(toRemove[i], 1)
    }
  })

  const spawnFootprint = useMemo(
    () => (worldPos: THREE.Vector3, rotation: number, isLeft: boolean) => {
      if (!groupRef.current || footprintsRef.current.length > 30) return

      const geo = isLeft ? GEO.footprintL : GEO.footprintR
      const mesh = new THREE.Mesh(geo, fpMat.clone())
      mesh.position.set(worldPos.x, 0.003, worldPos.z)
      mesh.rotation.y = rotation
      mesh.position.x += (isLeft ? -0.12 : 0.12) * Math.cos(rotation)
      mesh.position.z += (isLeft ? 0.12 : -0.12) * Math.sin(rotation)

      groupRef.current.add(mesh)
      footprintsRef.current.push({ mesh, life: 1 })
    },
    [fpMat]
  )

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData.spawnFootprint = spawnFootprint
    }
  }, [spawnFootprint])

  return <group ref={groupRef} />
}

// ═══════════════════════════════════════════════════════════
// PLAYER CHARACTER — MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export const PlayerCharacter = memo(function PlayerCharacter() {
  // ─── REFS ───
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const shadowRef = useRef<THREE.Mesh>(null)
  const neckRef = useRef<THREE.Group>(null)

  // Limbs
  const legLRef = useRef<THREE.Group>(null)
  const legRRef = useRef<THREE.Group>(null)
  const armLRef = useRef<THREE.Group>(null)
  const armRRef = useRef<THREE.Group>(null)
  const foreLRef = useRef<THREE.Group>(null)
  const foreRRef = useRef<THREE.Group>(null)
  const lLowRef = useRef<THREE.Group>(null)
  const lLowRRef = useRef<THREE.Group>(null)
  const handLRef = useRef<THREE.Group>(null)
  const handRRef = useRef<THREE.Group>(null)

  // Face
  const eyelidLRef = useRef<THREE.Mesh>(null)
  const eyelidRRef = useRef<THREE.Mesh>(null)
  const eyebrowLRef = useRef<THREE.Mesh>(null)
  const eyebrowRRef = useRef<THREE.Mesh>(null)
  const mouthRef = useRef<THREE.Mesh>(null)

  // Accessories
  const backpackRef = useRef<THREE.Group>(null)
  const watchRef = useRef<THREE.Group>(null)

  // Effects
  const dustRef = useRef<THREE.Group>(null)
  const trailRef = useRef<THREE.Group>(null)

  // State
  const inputRef = useRef<InputState>(createInput())
  const physRef = useRef<PhysicsState>(createPhysics())
  const animRef = useRef<AnimationState>(createAnimation())
  const initializedRef = useRef(false)

  const { camera } = useThree()

  useInput(inputRef)

  // Initialize position from store on mount
  useEffect(() => {
    if (groupRef.current && !initializedRef.current) {
      const { playerPosition } = useWorldStore.getState()
      groupRef.current.position.set(
        playerPosition[0],
        playerPosition[1],
        playerPosition[2]
      )
      initializedRef.current = true
    }
  }, [])

  // ─── MATERIALS — ENRICHED ───
  const mat = useMemo(
    () => ({
      // Skin
      skin: new THREE.MeshStandardMaterial({
        color: "#e0b48a",
        roughness: 0.5,
        metalness: 0.02,
      }),
      skinDark: new THREE.MeshStandardMaterial({
        color: "#c89870",
        roughness: 0.55,
      }),

      // Hair
      hair: new THREE.MeshStandardMaterial({
        color: "#2a1808",
        roughness: 0.85,
        metalness: 0.05,
      }),
      hairHighlight: new THREE.MeshStandardMaterial({
        color: "#3d2812",
        roughness: 0.8,
      }),

      // Shirt / jacket
      shirt: new THREE.MeshStandardMaterial({
        color: "#2d3a5c",
        roughness: 0.6,
        metalness: 0.05,
      }),
      shirtDark: new THREE.MeshStandardMaterial({
        color: "#1e2a44",
        roughness: 0.65,
      }),
      shirtAccent: new THREE.MeshStandardMaterial({
        color: "#4a5a8c",
        roughness: 0.55,
      }),
      shirtInner: new THREE.MeshStandardMaterial({
        color: "#333840",
        roughness: 0.7,
      }),

      // Neon accents (cyberpunk)
      neonBlue: new THREE.MeshStandardMaterial({
        color: "#3b82f6",
        emissive: "#3b82f6",
        emissiveIntensity: 0.4,
        roughness: 0.3,
      }),
      neonPurple: new THREE.MeshStandardMaterial({
        color: "#8b5cf6",
        emissive: "#8b5cf6",
        emissiveIntensity: 0.3,
        roughness: 0.3,
      }),

      // Pants
      pants: new THREE.MeshStandardMaterial({
        color: "#1a3a2a",
        roughness: 0.55,
      }),
      pantsDk: new THREE.MeshStandardMaterial({
        color: "#122a1e",
        roughness: 0.6,
      }),
      pantsSeam: new THREE.MeshStandardMaterial({
        color: "#0e2218",
        roughness: 0.7,
      }),

      // Hat
      hat: new THREE.MeshStandardMaterial({
        color: "#cc2222",
        roughness: 0.4,
        metalness: 0.08,
      }),
      hatBrim: new THREE.MeshStandardMaterial({
        color: "#aa1818",
        roughness: 0.45,
      }),
      hatBand: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.5,
      }),
      hatButton: new THREE.MeshStandardMaterial({
        color: "#cc2222",
        roughness: 0.3,
      }),

      // Shoes
      shoe: new THREE.MeshStandardMaterial({
        color: "#1a1a1a",
        roughness: 0.75,
        metalness: 0.05,
      }),
      shoeSole: new THREE.MeshStandardMaterial({
        color: "#f0f0f0",
        roughness: 0.7,
      }),
      shoeAccent: new THREE.MeshStandardMaterial({
        color: "#cc2222",
        roughness: 0.5,
      }),
      shoeLace: new THREE.MeshStandardMaterial({
        color: "#f0f0f0",
        roughness: 0.8,
      }),

      // Belt
      belt: new THREE.MeshStandardMaterial({
        color: "#2a1a0a",
        roughness: 0.6,
        metalness: 0.1,
      }),
      beltBuckle: new THREE.MeshStandardMaterial({
        color: "#888888",
        roughness: 0.2,
        metalness: 0.8,
      }),

      // Watch
      watchFace: new THREE.MeshStandardMaterial({
        color: "#0a1628",
        emissive: "#3b82f6",
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.5,
      }),
      watchBand: new THREE.MeshStandardMaterial({
        color: "#1a1a1a",
        roughness: 0.5,
        metalness: 0.3,
      }),
      watchCase: new THREE.MeshStandardMaterial({
        color: "#888899",
        roughness: 0.2,
        metalness: 0.8,
      }),

      // Backpack
      backpack: new THREE.MeshStandardMaterial({
        color: "#2a2a3a",
        roughness: 0.65,
        metalness: 0.05,
      }),
      backpackAccent: new THREE.MeshStandardMaterial({
        color: "#444455",
        roughness: 0.6,
      }),
      backpackStrap: new THREE.MeshStandardMaterial({
        color: "#333340",
        roughness: 0.6,
      }),
      backpackBuckle: new THREE.MeshStandardMaterial({
        color: "#888888",
        roughness: 0.2,
        metalness: 0.8,
      }),

      // Face
      eye: new THREE.MeshBasicMaterial({ color: "#1a0a00" }),
      eyeW: new THREE.MeshBasicMaterial({ color: "#f0f0f0" }),
      eyeIris: new THREE.MeshBasicMaterial({ color: "#3a6644" }),
      eyeHighlight: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      eyelid: new THREE.MeshStandardMaterial({
        color: "#d4a070",
        roughness: 0.6,
      }),
      eyebrow: new THREE.MeshStandardMaterial({
        color: "#2a1808",
        roughness: 0.9,
      }),
      mouth: new THREE.MeshBasicMaterial({ color: "#7a4030" }),
      teeth: new THREE.MeshBasicMaterial({ color: "#f5f0e8" }),
      lip: new THREE.MeshStandardMaterial({
        color: "#c47058",
        roughness: 0.6,
      }),

      // Shadow
      shadow: new THREE.MeshBasicMaterial({
        color: "#000000",
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    }),
    []
  )

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(mat).forEach((material) => material.dispose())
    }
  }, [mat])

  // ═══════════════════════════════════════════════════════════
  // MAIN FRAME LOOP
  // ═══════════════════════════════════════════════════════════

  useFrame((_state, dt) => {
    const g = groupRef.current
    if (!g) return

    const cdt = Math.min(dt, 0.05)
    const inp = inputRef.current
    const phys = physRef.current
    const anim = animRef.current

    // ─── INPUT HANDLING ───
    const activeElement = document.activeElement
    const isTyping =
      activeElement?.tagName === "INPUT" ||
      activeElement?.tagName === "TEXTAREA" ||
      activeElement?.getAttribute("contenteditable") === "true"

    const keys = isTyping ? {} : inp.keys
    const run = keys["ShiftLeft"] || keys["ShiftRight"]
    const crouch = keys["ControlLeft"] || keys["KeyC"]

    // Update crouch state
    if (!phys.crouching && crouch && phys.grounded) {
      phys.crouching = true
    } else if (phys.crouching && !crouch) {
      phys.crouching = false
    }

    const spd = phys.crouching ? CROUCH_SPEED : run ? RUN_SPEED : WALK_SPEED

    // ─── MOVEMENT CALCULATION ───
    _v3A.set(Math.sin(inp.camYaw), 0, Math.cos(inp.camYaw)).normalize()
    _v3B.crossVectors(_v3A, THREE.Object3D.DEFAULT_UP).normalize()
    _v3C.set(0, 0, 0)

    if (keys["KeyW"] || keys["ArrowUp"]) _v3C.addScaledVector(_v3A, spd * cdt)
    if (keys["KeyS"] || keys["ArrowDown"])
      _v3C.addScaledVector(_v3A, -spd * cdt)
    if (keys["KeyA"] || keys["ArrowLeft"])
      _v3C.addScaledVector(_v3B, -spd * cdt)
    if (keys["KeyD"] || keys["ArrowRight"])
      _v3C.addScaledVector(_v3B, spd * cdt)

    const hLen = Math.sqrt(_v3C.x * _v3C.x + _v3C.z * _v3C.z)
    const maxStep = spd * cdt

    if (hLen > maxStep) {
      _v3C.multiplyScalar(maxStep / hLen)
    }

    // ─── STORE STATE ───
    const {
      isGodMode,
      flyMode,
      setPlayerPosition,
      currentLocation,
      setNearbyZone,
      nearbyZone,
      interact,
    } = useWorldStore.getState()

    // ─── PHYSICS ───
    phys.wasGrounded = phys.grounded

    if (flyMode || isGodMode) {
      if (keys["Space"]) g.position.y += RUN_SPEED * cdt
      if (keys["ControlLeft"] || keys["ControlRight"])
        g.position.y -= RUN_SPEED * cdt
      phys.vy = 0
      phys.grounded = false
      phys.airTime += cdt
    } else {
      if (phys.grounded) phys.coyote = 0.1
      else phys.coyote = Math.max(0, phys.coyote - cdt)

      if (keys["Space"] && (phys.grounded || phys.coyote > 0)) {
        phys.vy = JUMP_FORCE
        phys.grounded = false
        phys.coyote = 0
      }

      phys.vy += GRAVITY * cdt
      g.position.y += phys.vy * cdt

      if (g.position.y <= 0) {
        if (!phys.grounded && phys.vy < -3) {
          phys.impact = Math.min(1, Math.abs(phys.vy) * 0.04)
        }
        g.position.y = 0
        phys.vy = 0
        phys.grounded = true
        phys.airTime = 0
      } else if (g.position.y > 0.1) {
        phys.grounded = false
        phys.airTime += cdt
      }
    }

    g.position.x += _v3C.x
    g.position.z += _v3C.z

    phys.impact *= Math.exp(-cdt * LANDING_SQUASH_DECAY)

    setPlayerPosition([g.position.x, g.position.y, g.position.z])

    // ─── INTERACTION ZONES ───
    const zones = INTERACTION_ZONES[currentLocation] || []
    let closestZone = null
    let closestDist = 4

    for (const zone of zones) {
      const dx = g.position.x - zone.position[0]
      const dz = g.position.z - zone.position[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < closestDist) {
        closestDist = dist
        closestZone = zone
      }
    }

    if (closestZone !== nearbyZone) {
      setNearbyZone(closestZone)
    }

    if (keys["KeyE"] && closestZone && !inp.keys["_ePressedLastFrame"]) {
      interact()
      if (
        closestZone.type === "elevator" ||
        closestZone.type === "portal"
      ) {
        const targetPos = closestZone.targetPosition
        g.position.set(targetPos[0], targetPos[1], targetPos[2])
        initializedRef.current = true
      }
    }
    inp.keys["_ePressedLastFrame"] = keys["KeyE"] || false

    // ═══════════════════════════════════════════════════
    // ANIMATION SYSTEM
    // ═══════════════════════════════════════════════════

    const moving = hLen > 0.001
    const tgtSpd = moving ? (run ? 1.0 : phys.crouching ? 0.3 : 0.55) : 0

    anim.spd = THREE.MathUtils.lerp(
      anim.spd,
      tgtSpd,
      1 - Math.exp(-cdt * 12)
    )
    anim.breath += cdt * BREATH_SPEED

    const breathOff = Math.sin(anim.breath) * BREATH_AMOUNT
    const decay = Math.exp(-cdt * 6)

    // ─── BLINK ANIMATION ───
    anim.blinkTimer += cdt
    if (anim.isBlinking) {
      if (anim.blinkTimer >= BLINK_DURATION) {
        anim.isBlinking = false
        anim.blinkTimer = 0
        anim.blinkNextAt = nextBlinkInterval()
      }
    } else if (anim.blinkTimer >= anim.blinkNextAt) {
      anim.isBlinking = true
      anim.blinkTimer = 0
    }

    // Eyelids
    if (eyelidLRef.current && eyelidRRef.current) {
      const blinkScale = anim.isBlinking ? 1 : 0
      eyelidLRef.current.scale.y = THREE.MathUtils.lerp(
        eyelidLRef.current.scale.y,
        blinkScale,
        0.3
      )
      eyelidRRef.current.scale.y = THREE.MathUtils.lerp(
        eyelidRRef.current.scale.y,
        blinkScale,
        0.3
      )
      eyelidLRef.current.visible = eyelidLRef.current.scale.y > 0.1
      eyelidRRef.current.visible = eyelidRRef.current.scale.y > 0.1
    }

    // ─── EYEBROW ANIMATION ───
    if (eyebrowLRef.current && eyebrowRRef.current) {
      const baseY = 0.095
      const expressionY = moving
        ? run
          ? 0.015
          : 0.005
        : Math.sin(anim.idleTimer * 0.3) * 0.003
      eyebrowLRef.current.position.y = baseY + expressionY
      eyebrowRRef.current.position.y = baseY + expressionY

      // Slight rotation for expression
      const tilt = run ? -0.05 : phys.crouching ? 0.05 : 0
      eyebrowLRef.current.rotation.z = tilt
      eyebrowRRef.current.rotation.z = -tilt
    }

    // ─── MOUTH ANIMATION ───
    if (mouthRef.current) {
      const breathMouth =
        Math.sin(anim.breath * 0.5) * 0.003 + (run ? 0.006 : 0)
      mouthRef.current.scale.x = 1 + breathMouth * 2
      mouthRef.current.scale.y = 1 + breathMouth
    }

    // ─── IDLE ANIMATION ───
    if (!moving) {
      anim.idleTimer += cdt
      anim.idlePhase += cdt * IDLE_SWAY_SPEED

      // Body sway
      if (bodyRef.current) {
        bodyRef.current.rotation.z =
          Math.sin(anim.idlePhase) * IDLE_SWAY_AMOUNT
        bodyRef.current.rotation.x =
          Math.sin(anim.idlePhase * 0.7) * IDLE_SWAY_AMOUNT * 0.5
      }

      // Head look-around in idle
      if (anim.idleTimer > 3 && headRef.current) {
        anim.lookAtOffset =
          Math.sin(anim.idleTimer * 0.4) * 0.12
        headRef.current.rotation.y = anim.lookAtOffset
      }

      // Subtle arm movement in idle
      if (armLRef.current) {
        armLRef.current.rotation.x =
          Math.sin(anim.idlePhase * 0.5) * 0.02
        armLRef.current.rotation.z = 0.04
      }
      if (armRRef.current) {
        armRRef.current.rotation.x =
          Math.sin(anim.idlePhase * 0.5 + 1) * 0.02
        armRRef.current.rotation.z = -0.04
      }

      // Weight shift on legs
      if (legLRef.current) {
        legLRef.current.rotation.x *= decay
        legLRef.current.rotation.z =
          Math.sin(anim.idlePhase * 0.3) * 0.008
      }
      if (legRRef.current) {
        legRRef.current.rotation.x *= decay
        legRRef.current.rotation.z =
          -Math.sin(anim.idlePhase * 0.3) * 0.008
      }
    } else {
      anim.idleTimer = 0
      anim.idlePhase = 0
      if (bodyRef.current) {
        bodyRef.current.rotation.z *= decay
        bodyRef.current.rotation.x *= decay
      }
      if (headRef.current) {
        headRef.current.rotation.y *= decay * 0.95
      }
    }

    // ─── WALK / RUN ANIMATION ───
    if (moving && !flyMode) {
      const tgt = Math.atan2(_v3C.x, _v3C.z)
      let diff =
        ((tgt - g.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI
      if (diff < -Math.PI) diff += Math.PI * 2
      g.rotation.y += diff * 0.14

      const animSpeed = run ? 14.0 : phys.crouching ? 6.0 : 9.0
      anim.t += cdt * animSpeed

      const swingAmount = phys.crouching
        ? 0.25
        : run
          ? 0.7
          : 0.48
      const sw = Math.sin(anim.t) * swingAmount * anim.spd
      const co = Math.cos(anim.t)

      // Legs
      if (legLRef.current) {
        legLRef.current.rotation.x = sw
        legLRef.current.rotation.z = 0
      }
      if (legRRef.current) {
        legRRef.current.rotation.x = -sw
        legRRef.current.rotation.z = 0
      }
      if (lLowRef.current)
        lLowRef.current.rotation.x =
          Math.max(0, -co) * 0.45 * anim.spd
      if (lLowRRef.current)
        lLowRRef.current.rotation.x =
          Math.max(0, co) * 0.45 * anim.spd

      // Arms
      if (armLRef.current) {
        armLRef.current.rotation.x = -sw * 0.8
        armLRef.current.rotation.z = 0.02 + Math.abs(sw) * 0.03
      }
      if (armRRef.current) {
        armRRef.current.rotation.x = sw * 0.8
        armRRef.current.rotation.z = -(0.02 + Math.abs(sw) * 0.03)
      }
      if (foreLRef.current)
        foreLRef.current.rotation.x =
          -0.12 - Math.max(0, co) * 0.28 * anim.spd
      if (foreRRef.current)
        foreRRef.current.rotation.x =
          -0.12 - Math.max(0, -co) * 0.28 * anim.spd

      // Hand curl while running
      if (handLRef.current) {
        handLRef.current.rotation.x = run ? -0.3 : -0.1
      }
      if (handRRef.current) {
        handRRef.current.rotation.x = run ? -0.3 : -0.1
      }

      // Head bob
      anim.bob =
        Math.sin(anim.t * 2) *
        (run ? HEAD_BOB_RUN : HEAD_BOB_WALK) *
        anim.spd

      // Body lean forward when running
      if (bodyRef.current) {
        const leanTarget = run ? 0.08 : phys.crouching ? 0.12 : 0.03
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(
          bodyRef.current.rotation.x,
          leanTarget * anim.spd,
          0.1
        )
        // Torso twist
        bodyRef.current.rotation.y = Math.sin(anim.t) * 0.03 * anim.spd
      }

      // Neck / head stability
      if (neckRef.current) {
        neckRef.current.rotation.x = -Math.sin(anim.t * 2) * 0.02 * anim.spd
      }

      // ─── FOOTSTEP TRACKING ───
      const footPhase = Math.sin(anim.t)
      const currentFoot = footPhase > 0
      if (currentFoot !== anim.lastFootstep && phys.grounded) {
        anim.lastFootstep = currentFoot
        // Spawn footprint
        if (trailRef.current?.userData.spawnFootprint) {
          trailRef.current.userData.spawnFootprint(
            g.position,
            g.rotation.y,
            currentFoot
          )
        }
      }

      // ─── SPRINT DUST ───
      if (run && phys.grounded) {
        anim.sprintTime += cdt
        if (
          anim.sprintTime - anim.lastSprintParticle >
          SPRINT_PARTICLE_INTERVAL
        ) {
          anim.lastSprintParticle = anim.sprintTime
          if (dustRef.current?.userData.spawnParticle) {
            dustRef.current.userData.spawnParticle(g.position)
          }
        }
      }
    } else {
      // Decay all limb rotations
      if (legLRef.current) legLRef.current.rotation.x *= decay
      if (legRRef.current) legRRef.current.rotation.x *= decay
      if (armLRef.current) {
        armLRef.current.rotation.x *= decay
      }
      if (armRRef.current) {
        armRRef.current.rotation.x *= decay
      }
      if (lLowRef.current) lLowRef.current.rotation.x *= decay
      if (lLowRRef.current) lLowRRef.current.rotation.x *= decay
      if (foreLRef.current)
        foreLRef.current.rotation.x = THREE.MathUtils.lerp(
          foreLRef.current.rotation.x,
          -0.07,
          1 - decay
        )
      if (foreRRef.current)
        foreRRef.current.rotation.x = THREE.MathUtils.lerp(
          foreRRef.current.rotation.x,
          -0.07,
          1 - decay
        )
      if (handLRef.current) {
        handLRef.current.rotation.x = THREE.MathUtils.lerp(
          handLRef.current.rotation.x,
          0,
          1 - decay
        )
      }
      if (handRRef.current) {
        handRRef.current.rotation.x = THREE.MathUtils.lerp(
          handRRef.current.rotation.x,
          0,
          1 - decay
        )
      }

      anim.bob *= decay

      if (!isTyping) {
        const tgt = Math.atan2(_v3A.x, _v3A.z)
        let diff =
          ((tgt - g.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI
        if (diff < -Math.PI) diff += Math.PI * 2
        g.rotation.y += diff * 0.05
      }
    }

    // ─── JUMP ANIMATION ───
    if (!phys.grounded && !flyMode) {
      // Tuck legs in air
      if (legLRef.current)
        legLRef.current.rotation.x = THREE.MathUtils.lerp(
          legLRef.current.rotation.x,
          -0.3,
          0.08
        )
      if (legRRef.current)
        legRRef.current.rotation.x = THREE.MathUtils.lerp(
          legRRef.current.rotation.x,
          -0.2,
          0.08
        )
      if (lLowRef.current)
        lLowRef.current.rotation.x = THREE.MathUtils.lerp(
          lLowRef.current.rotation.x,
          0.4,
          0.08
        )
      if (lLowRRef.current)
        lLowRRef.current.rotation.x = THREE.MathUtils.lerp(
          lLowRRef.current.rotation.x,
          0.3,
          0.08
        )

      // Arms up
      if (armLRef.current)
        armLRef.current.rotation.x = THREE.MathUtils.lerp(
          armLRef.current.rotation.x,
          -0.5,
          0.06
        )
      if (armRRef.current)
        armRRef.current.rotation.x = THREE.MathUtils.lerp(
          armRRef.current.rotation.x,
          -0.5,
          0.06
        )
    }

    // ─── CROUCH VISUAL ───
    if (bodyRef.current) {
      const crouchTarget = phys.crouching ? CROUCH_HEIGHT_SCALE : 1
      const sq = (1 - phys.impact * 0.28) * crouchTarget
      const st = 1 + phys.impact * 0.14
      bodyRef.current.scale.set(st, sq, st)
      bodyRef.current.position.y = breathOff + (phys.crouching ? -0.25 : 0)
    }

    // ─── HEAD POSITION ───
    if (headRef.current) {
      headRef.current.position.y =
        1.88 +
        breathOff * 1.4 +
        anim.bob +
        (phys.crouching ? -0.2 : 0)
    }

    // ─── BACKPACK SWAY ───
    if (backpackRef.current) {
      backpackRef.current.rotation.x =
        Math.sin(anim.t * 0.5) * 0.02 * anim.spd + breathOff * 2
    }

    // ─── WATCH GLOW ───
    if (watchRef.current) {
      const watchMat = watchRef.current.children[0]
        ?.material as THREE.MeshStandardMaterial
      if (watchMat?.emissiveIntensity !== undefined) {
        watchMat.emissiveIntensity =
          0.3 + Math.sin(_state.clock.elapsedTime * 2) * 0.1
      }
    }

    // ─── SHADOW ───
    if (shadowRef.current) {
      const h = g.position.y
      const sc = Math.max(0.3, 1 - h * 0.07)
      const shadowMat =
        shadowRef.current.material as THREE.MeshBasicMaterial

      shadowMat.opacity = Math.max(0.05, 0.28 - h * 0.025)
      shadowRef.current.scale.setScalar(sc)
      shadowRef.current.position.y = -g.position.y + 0.004
    }

    // ─── CAMERA ───
    const dist = inp.camDist
    const pitch = inp.camPitch

    _v3D.set(
      g.position.x -
        Math.sin(inp.camYaw) * Math.cos(pitch) * dist,
      g.position.y + Math.sin(pitch) * dist + 0.8,
      g.position.z -
        Math.cos(inp.camYaw) * Math.cos(pitch) * dist
    )

    // Ensure camera doesn't go below ground
    if (_v3D.y < 0.5) _v3D.y = 0.5

    const lerp = 1 - Math.exp(-cdt * 10 * CAM_SMOOTH_FACTOR)
    camera.position.lerp(_v3D, lerp)
    camera.lookAt(
      g.position.x,
      g.position.y + CAM_LOOK_HEIGHT + (phys.crouching ? -0.3 : 0),
      g.position.z
    )
  })

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <group ref={groupRef}>
      {/* ═══ EFFECTS ═══ */}
      <SprintDustParticles />
      <FootprintTrail />
      <group ref={dustRef} />
      <group ref={trailRef} />

      {/* ═══ SHADOW ═══ */}
      <mesh
        ref={shadowRef}
        rotation-x={-Math.PI / 2}
        position-y={0.004}
        material={mat.shadow}
      >
        <primitive object={GEO.shadow} attach="geometry" />
      </mesh>

      {/* ═══ BODY GROUP ═══ */}
      <group ref={bodyRef}>
        {/* ────────── LEFT LEG ────────── */}
        <group ref={legLRef} position={[-0.16, 0.56, 0]}>
          {/* Upper leg */}
          <mesh castShadow position={[0, -0.09, 0]} material={mat.pants}>
            <primitive object={GEO.upperLeg} attach="geometry" />
          </mesh>
          {/* Knee detail */}
          <mesh position={[0, -0.28, 0.1]} material={mat.pantsSeam}>
            <primitive object={GEO.knee} attach="geometry" />
          </mesh>
          {/* Seam line */}
          <mesh position={[0.12, -0.15, 0]}>
            <boxGeometry args={[0.008, 0.35, 0.008]} />
            <primitive object={mat.pantsSeam} attach="material" />
          </mesh>

          <group ref={lLowRef} position={[0, -0.33, 0]}>
            {/* Lower leg */}
            <mesh castShadow position={[0, -0.09, 0]} material={mat.pantsDk}>
              <primitive object={GEO.lowerLeg} attach="geometry" />
            </mesh>
            {/* Cuff */}
            <mesh position={[0, -0.24, 0]}>
              <boxGeometry args={[0.23, 0.04, 0.23]} />
              <primitive object={mat.pantsSeam} attach="material" />
            </mesh>
            {/* Shoe */}
            <mesh
              castShadow
              position={[0, -0.28, 0.04]}
              material={mat.shoe}
            >
              <primitive object={GEO.shoe} attach="geometry" />
            </mesh>
            {/* Sole */}
            <mesh position={[0, -0.325, 0.04]} material={mat.shoeSole}>
              <primitive object={GEO.shoeSole} attach="geometry" />
            </mesh>
            {/* Shoe accent stripe */}
            <mesh position={[0, -0.26, 0.12]} material={mat.shoeAccent}>
              <primitive object={GEO.shoeDetail} attach="geometry" />
            </mesh>
            {/* Laces */}
            <mesh position={[0, -0.24, 0.1]} material={mat.shoeLace}>
              <primitive object={GEO.shoeLace} attach="geometry" />
            </mesh>
          </group>
        </group>

        {/* ────────── RIGHT LEG ────────── */}
        <group ref={legRRef} position={[0.16, 0.56, 0]}>
          <mesh castShadow position={[0, -0.09, 0]} material={mat.pants}>
            <primitive object={GEO.upperLeg} attach="geometry" />
          </mesh>
          <mesh position={[0, -0.28, 0.1]} material={mat.pantsSeam}>
            <primitive object={GEO.knee} attach="geometry" />
          </mesh>
          <mesh position={[-0.12, -0.15, 0]}>
            <boxGeometry args={[0.008, 0.35, 0.008]} />
            <primitive object={mat.pantsSeam} attach="material" />
          </mesh>

          <group ref={lLowRRef} position={[0, -0.33, 0]}>
            <mesh castShadow position={[0, -0.09, 0]} material={mat.pantsDk}>
              <primitive object={GEO.lowerLeg} attach="geometry" />
            </mesh>
            <mesh position={[0, -0.24, 0]}>
              <boxGeometry args={[0.23, 0.04, 0.23]} />
              <primitive object={mat.pantsSeam} attach="material" />
            </mesh>
            <mesh castShadow position={[0, -0.28, 0.04]} material={mat.shoe}>
              <primitive object={GEO.shoe} attach="geometry" />
            </mesh>
            <mesh position={[0, -0.325, 0.04]} material={mat.shoeSole}>
              <primitive object={GEO.shoeSole} attach="geometry" />
            </mesh>
            <mesh position={[0, -0.26, 0.12]} material={mat.shoeAccent}>
              <primitive object={GEO.shoeDetail} attach="geometry" />
            </mesh>
            <mesh position={[0, -0.24, 0.1]} material={mat.shoeLace}>
              <primitive object={GEO.shoeLace} attach="geometry" />
            </mesh>
          </group>
        </group>

        {/* ────────── TORSO ────────── */}
        <mesh castShadow position={[0, 1.12, 0]} material={mat.shirt}>
          <primitive object={GEO.torso} attach="geometry" />
        </mesh>

        {/* Collar */}
        <mesh position={[0, 1.5, 0.03]} material={mat.shirtInner}>
          <primitive object={GEO.torsoCollar} attach="geometry" />
        </mesh>

        {/* Collar flaps (open collar) */}
        <mesh position={[-0.1, 1.5, 0.15]} rotation={[0.2, 0.15, 0]} material={mat.shirt}>
          <primitive object={GEO.collarFlap} attach="geometry" />
        </mesh>
        <mesh position={[0.1, 1.5, 0.15]} rotation={[0.2, -0.15, 0]} material={mat.shirt}>
          <primitive object={GEO.collarFlap} attach="geometry" />
        </mesh>

        {/* Zipper line */}
        <mesh position={[0, 1.12, 0.185]} material={mat.beltBuckle}>
          <primitive object={GEO.zipperLine} attach="geometry" />
        </mesh>

        {/* Chest pockets */}
        <mesh position={[-0.18, 1.2, 0.185]} material={mat.shirtDark}>
          <primitive object={GEO.pocket} attach="geometry" />
        </mesh>
        <mesh position={[0.18, 1.2, 0.185]} material={mat.shirtDark}>
          <primitive object={GEO.pocket} attach="geometry" />
        </mesh>

        {/* Pocket flaps */}
        <mesh position={[-0.18, 1.25, 0.19]}>
          <boxGeometry args={[0.13, 0.02, 0.015]} />
          <primitive object={mat.shirtAccent} attach="material" />
        </mesh>
        <mesh position={[0.18, 1.25, 0.19]}>
          <boxGeometry args={[0.13, 0.02, 0.015]} />
          <primitive object={mat.shirtAccent} attach="material" />
        </mesh>

        {/* Buttons */}
        {[1.35, 1.22, 1.09, 0.96].map((y, i) => (
          <mesh
            key={`btn-${i}`}
            position={[0, y, 0.19]}
            rotation={[Math.PI / 2, 0, 0]}
            material={mat.beltBuckle}
          >
            <primitive object={GEO.buttonSmall} attach="geometry" />
          </mesh>
        ))}

        {/* Neon accent lines (cyberpunk touch) */}
        <mesh position={[0.32, 1.15, 0.1]} material={mat.neonBlue}>
          <boxGeometry args={[0.008, 0.4, 0.008]} />
        </mesh>
        <mesh position={[-0.32, 1.15, 0.1]} material={mat.neonPurple}>
          <boxGeometry args={[0.008, 0.4, 0.008]} />
        </mesh>
        <mesh position={[0, 0.78, 0.185]} material={mat.neonBlue}>
          <boxGeometry args={[0.5, 0.008, 0.008]} />
        </mesh>

        {/* Shoulder pads / seams */}
        <mesh position={[-0.38, 1.45, 0]} material={mat.shirtAccent}>
          <primitive object={GEO.shoulderPad} attach="geometry" />
        </mesh>
        <mesh position={[0.38, 1.45, 0]} material={mat.shirtAccent}>
          <primitive object={GEO.shoulderPad} attach="geometry" />
        </mesh>

        {/* ────────── BELT ────────── */}
        <mesh castShadow position={[0, 0.74, 0]} material={mat.belt}>
          <primitive object={GEO.belt} attach="geometry" />
        </mesh>
        {/* Belt buckle */}
        <mesh position={[0, 0.74, 0.2]} material={mat.beltBuckle}>
          <primitive object={GEO.beltBuckle} attach="geometry" />
        </mesh>
        {/* Belt loops */}
        {[-0.2, -0.08, 0.08, 0.2].map((x, i) => (
          <mesh key={`loop-${i}`} position={[x, 0.77, 0.17]}>
            <boxGeometry args={[0.03, 0.06, 0.015]} />
            <primitive object={mat.belt} attach="material" />
          </mesh>
        ))}

        {/* ────────── LEFT ARM ────────── */}
        <group ref={armLRef} position={[-0.48, 1.3, 0]}>
          {/* Upper arm */}
          <mesh castShadow position={[0, -0.12, 0]} material={mat.shirt}>
            <primitive object={GEO.upperArm} attach="geometry" />
          </mesh>
          {/* Shoulder seam */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.22, 0.015, 0.22]} />
            <primitive object={mat.shirtAccent} attach="material" />
          </mesh>

          <group ref={foreLRef} position={[0, -0.36, 0]}>
            {/* Forearm */}
            <mesh
              castShadow
              position={[0, -0.07, 0]}
              material={mat.shirtDark}
            >
              <primitive object={GEO.forearm} attach="geometry" />
            </mesh>
            {/* Cuff */}
            <mesh position={[0, 0.06, 0]}>
              <boxGeometry args={[0.18, 0.03, 0.18]} />
              <primitive object={mat.shirtAccent} attach="material" />
            </mesh>
            {/* Wristband */}
            <mesh position={[0, -0.2, 0]} material={mat.shirtDark}>
              <primitive object={GEO.wristband} attach="geometry" />
            </mesh>

            {/* Watch (left arm) */}
            <group ref={watchRef} position={[0.08, -0.18, 0]}>
              {/* Watch case */}
              <mesh material={mat.watchCase}>
                <boxGeometry args={[0.07, 0.065, 0.03]} />
              </mesh>
              {/* Watch face */}
              <mesh position={[0, 0, 0.016]} material={mat.watchFace}>
                <primitive object={GEO.watchFace} attach="geometry" />
              </mesh>
              {/* Watch band */}
              <mesh position={[0, 0.05, 0]} material={mat.watchBand}>
                <primitive object={GEO.watchBand} attach="geometry" />
              </mesh>
              <mesh position={[0, -0.05, 0]} material={mat.watchBand}>
                <primitive object={GEO.watchBand} attach="geometry" />
              </mesh>
            </group>

            {/* Hand */}
            <group ref={handLRef} position={[0, -0.24, 0]}>
              <mesh castShadow material={mat.skin}>
                <primitive object={GEO.hand} attach="geometry" />
              </mesh>
              {/* Fingers */}
              {[[-0.035, -0.08, 0], [0, -0.09, 0], [0.035, -0.08, 0]].map(
                (pos, i) => (
                  <mesh
                    key={`fl-${i}`}
                    position={pos as [number, number, number]}
                    material={mat.skin}
                  >
                    <primitive object={GEO.finger} attach="geometry" />
                  </mesh>
                )
              )}
              {/* Thumb */}
              <mesh
                position={[0.06, -0.02, 0.04]}
                rotation={[0, 0, -0.3]}
                material={mat.skin}
              >
                <primitive object={GEO.thumb} attach="geometry" />
              </mesh>
            </group>
          </group>
        </group>

        {/* ────────── RIGHT ARM ────────── */}
        <group ref={armRRef} position={[0.48, 1.3, 0]}>
          <mesh castShadow position={[0, -0.12, 0]} material={mat.shirt}>
            <primitive object={GEO.upperArm} attach="geometry" />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.22, 0.015, 0.22]} />
            <primitive object={mat.shirtAccent} attach="material" />
          </mesh>

          <group ref={foreRRef} position={[0, -0.36, 0]}>
            <mesh
              castShadow
              position={[0, -0.07, 0]}
              material={mat.shirtDark}
            >
              <primitive object={GEO.forearm} attach="geometry" />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <boxGeometry args={[0.18, 0.03, 0.18]} />
              <primitive object={mat.shirtAccent} attach="material" />
            </mesh>
            <mesh position={[0, -0.2, 0]} material={mat.shirtDark}>
              <primitive object={GEO.wristband} attach="geometry" />
            </mesh>

            <group ref={handRRef} position={[0, -0.24, 0]}>
              <mesh castShadow material={mat.skin}>
                <primitive object={GEO.hand} attach="geometry" />
              </mesh>
              {[[-0.035, -0.08, 0], [0, -0.09, 0], [0.035, -0.08, 0]].map(
                (pos, i) => (
                  <mesh
                    key={`fr-${i}`}
                    position={pos as [number, number, number]}
                    material={mat.skin}
                  >
                    <primitive object={GEO.finger} attach="geometry" />
                  </mesh>
                )
              )}
              <mesh
                position={[-0.06, -0.02, 0.04]}
                rotation={[0, 0, 0.3]}
                material={mat.skin}
              >
                <primitive object={GEO.thumb} attach="geometry" />
              </mesh>
            </group>
          </group>
        </group>

        {/* ────────── BACKPACK ────────── */}
        <group ref={backpackRef} position={[0, 1.15, -0.28]}>
          {/* Body */}
          <mesh castShadow material={mat.backpack}>
            <primitive object={GEO.backpackBody} attach="geometry" />
          </mesh>
          {/* Flap */}
          <mesh position={[0, 0.28, 0.02]} material={mat.backpackAccent}>
            <primitive object={GEO.backpackFlap} attach="geometry" />
          </mesh>
          {/* Front pocket */}
          <mesh position={[0, -0.1, 0.11]} material={mat.backpackAccent}>
            <primitive object={GEO.backpackPocket} attach="geometry" />
          </mesh>
          {/* Pocket zipper */}
          <mesh position={[0, -0.03, 0.13]}>
            <boxGeometry args={[0.25, 0.01, 0.005]} />
            <primitive object={mat.beltBuckle} attach="material" />
          </mesh>
          {/* Straps */}
          <mesh position={[-0.15, 0.05, 0.11]} material={mat.backpackStrap}>
            <primitive object={GEO.backpackStrap} attach="geometry" />
          </mesh>
          <mesh position={[0.15, 0.05, 0.11]} material={mat.backpackStrap}>
            <primitive object={GEO.backpackStrap} attach="geometry" />
          </mesh>
          {/* Strap buckles */}
          <mesh position={[-0.15, -0.12, 0.12]} material={mat.backpackBuckle}>
            <boxGeometry args={[0.04, 0.03, 0.015]} />
          </mesh>
          <mesh position={[0.15, -0.12, 0.12]} material={mat.backpackBuckle}>
            <boxGeometry args={[0.04, 0.03, 0.015]} />
          </mesh>
          {/* Neon accent on backpack */}
          <mesh position={[0, 0, 0.105]} material={mat.neonPurple}>
            <boxGeometry args={[0.3, 0.008, 0.005]} />
          </mesh>
          {/* Loop handle */}
          <mesh position={[0, 0.3, -0.05]}>
            <boxGeometry args={[0.08, 0.04, 0.06]} />
            <primitive object={mat.backpackStrap} attach="material" />
          </mesh>
        </group>

        {/* ────────── NECK ────────── */}
        <group ref={neckRef} position={[0, 1.58, 0]}>
          <mesh castShadow material={mat.skin}>
            <primitive object={GEO.neck} attach="geometry" />
          </mesh>
        </group>

        {/* ────────── HEAD ────────── */}
        <group ref={headRef} position={[0, 1.88, 0]}>
          {/* Head base */}
          <mesh castShadow material={mat.skin}>
            <primitive object={GEO.head} attach="geometry" />
          </mesh>

          {/* ─── HAIR ─── */}
          {/* Top */}
          <mesh position={[0, 0.28, -0.02]} material={mat.hair}>
            <primitive object={GEO.hairTop} attach="geometry" />
          </mesh>
          {/* Back */}
          <mesh position={[0, 0.1, -0.26]} material={mat.hair}>
            <primitive object={GEO.hairBack} attach="geometry" />
          </mesh>
          {/* Sides */}
          <mesh position={[-0.27, 0.1, -0.02]} material={mat.hair}>
            <primitive object={GEO.hairSideL} attach="geometry" />
          </mesh>
          <mesh position={[0.27, 0.1, -0.02]} material={mat.hair}>
            <primitive object={GEO.hairSideR} attach="geometry" />
          </mesh>
          {/* Fringe (bangs under hat) */}
          <mesh position={[0, 0.18, 0.22]} material={mat.hairHighlight}>
            <primitive object={GEO.hairFringe} attach="geometry" />
          </mesh>

          {/* ─── EARS ─── */}
          <mesh position={[-0.27, -0.02, 0]} material={mat.skinDark}>
            <primitive object={GEO.ear} attach="geometry" />
          </mesh>
          <mesh position={[0.27, -0.02, 0]} material={mat.skinDark}>
            <primitive object={GEO.ear} attach="geometry" />
          </mesh>

          {/* ─── FACE DETAILS ─── */}
          {/* Eye whites */}
          <mesh position={[0.12, 0.04, 0.26]} material={mat.eyeW}>
            <boxGeometry args={[0.11, 0.085, 0.01]} />
          </mesh>
          <mesh position={[-0.12, 0.04, 0.26]} material={mat.eyeW}>
            <boxGeometry args={[0.11, 0.085, 0.01]} />
          </mesh>

          {/* Irises */}
          <mesh position={[0.12, 0.04, 0.266]} material={mat.eyeIris}>
            <boxGeometry args={[0.07, 0.06, 0.008]} />
          </mesh>
          <mesh position={[-0.12, 0.04, 0.266]} material={mat.eyeIris}>
            <boxGeometry args={[0.07, 0.06, 0.008]} />
          </mesh>

          {/* Pupils */}
          <mesh position={[0.12, 0.04, 0.271]} material={mat.eye}>
            <boxGeometry args={[0.04, 0.045, 0.008]} />
          </mesh>
          <mesh position={[-0.12, 0.04, 0.271]} material={mat.eye}>
            <boxGeometry args={[0.04, 0.045, 0.008]} />
          </mesh>

          {/* Eye highlights */}
          <mesh position={[0.14, 0.05, 0.275]} material={mat.eyeHighlight}>
            <boxGeometry args={[0.015, 0.015, 0.004]} />
          </mesh>
          <mesh position={[-0.1, 0.05, 0.275]} material={mat.eyeHighlight}>
            <boxGeometry args={[0.015, 0.015, 0.004]} />
          </mesh>

          {/* Eyelids (for blinking) */}
          <mesh
            ref={eyelidLRef}
            position={[-0.12, 0.065, 0.268]}
            material={mat.eyelid}
            visible={false}
          >
            <primitive object={GEO.eyelid} attach="geometry" />
          </mesh>
          <mesh
            ref={eyelidRRef}
            position={[0.12, 0.065, 0.268]}
            material={mat.eyelid}
            visible={false}
          >
            <primitive object={GEO.eyelid} attach="geometry" />
          </mesh>

          {/* Eyebrows */}
          <mesh
            ref={eyebrowLRef}
            position={[-0.12, 0.095, 0.265]}
            material={mat.eyebrow}
          >
            <primitive object={GEO.eyebrow} attach="geometry" />
          </mesh>
          <mesh
            ref={eyebrowRRef}
            position={[0.12, 0.095, 0.265]}
            material={mat.eyebrow}
          >
            <primitive object={GEO.eyebrow} attach="geometry" />
          </mesh>

          {/* Nose */}
          <mesh position={[0, -0.02, 0.27]} material={mat.skinDark}>
            <primitive object={GEO.nose} attach="geometry" />
          </mesh>
          {/* Nose bridge */}
          <mesh position={[0, 0.02, 0.265]}>
            <boxGeometry args={[0.03, 0.06, 0.03]} />
            <primitive object={mat.skin} attach="material" />
          </mesh>

          {/* Mouth */}
          <mesh
            ref={mouthRef}
            position={[0, -0.1, 0.265]}
            material={mat.mouth}
          >
            <boxGeometry args={[0.13, 0.028, 0.01]} />
          </mesh>
          {/* Upper lip */}
          <mesh position={[0, -0.085, 0.268]} material={mat.lip}>
            <boxGeometry args={[0.14, 0.012, 0.008]} />
          </mesh>
          {/* Lower lip */}
          <mesh position={[0, -0.115, 0.266]} material={mat.lip}>
            <boxGeometry args={[0.12, 0.015, 0.008]} />
          </mesh>

          {/* Chin definition */}
          <mesh position={[0, -0.2, 0.18]}>
            <boxGeometry args={[0.25, 0.06, 0.12]} />
            <primitive object={mat.skinDark} attach="material" />
          </mesh>

          {/* ─── HAT ─── */}
          <mesh castShadow position={[0, 0.32, 0]} material={mat.hat}>
            <primitive object={GEO.hatTop} attach="geometry" />
          </mesh>

          {/* Hat band */}
          <mesh position={[0, 0.23, 0]} material={mat.hatBand}>
            <primitive object={GEO.hatBand} attach="geometry" />
          </mesh>

          {/* Hat brim */}
          <mesh
            castShadow
            position={[0, 0.21, 0.05]}
            material={mat.hatBrim}
          >
            <primitive object={GEO.hatBrim} attach="geometry" />
          </mesh>

          {/* Hat button on top */}
          <mesh position={[0, 0.43, 0]} material={mat.hatButton}>
            <primitive object={GEO.hatButton} attach="geometry" />
          </mesh>

          {/* Hat logo area (front) */}
          <mesh position={[0, 0.32, 0.28]}>
            <boxGeometry args={[0.12, 0.1, 0.005]} />
            <primitive object={mat.hatBand} attach="material" />
          </mesh>

          {/* Hat stitching detail */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <mesh
              key={`stitch-${i}`}
              position={[
                Math.sin((angle * Math.PI) / 180) * 0.28,
                0.32,
                Math.cos((angle * Math.PI) / 180) * 0.28,
              ]}
            >
              <boxGeometry args={[0.005, 0.15, 0.005]} />
              <primitive object={mat.hatBrim} attach="material" />
            </mesh>
          ))}
        </group>
      </group>

      {/* ═══ PLAYER LIGHT (subtle) ═══ */}
      <pointLight
        position={[0, 1.5, 0.3]}
        intensity={0.08}
        color="#6366f1"
        distance={2}
        decay={2}
      />
    </group>
  )
})