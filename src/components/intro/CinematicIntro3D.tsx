// ============================================================
//  EtherWorld QC RP — CINEMATIC INTRO 3D  (v2.0 "WOW")
//  Remplace l'ancienne intro gradient/emoji par une vraie
//  séquence 3D : survol nocturne d'une ville néon québécoise,
//  brouillard volumétrique, pluie, néons, voiture qui passe,
//  puis logo qui s'assemble.
//
//  Dépendances (déjà dans ton package.json) :
//    three, @react-three/fiber, @react-three/drei, framer-motion
//
//  Intégration : voir docs/INTEGRATION_INTRO.md
//  Usage :
//    <CinematicIntro3D onDone={() => setIntroDone(true)} />
// ============================================================

import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import RabbitScene from './RabbitScene'

// ────────────────────────────────────────────────────────────
//  CONFIG
// ────────────────────────────────────────────────────────────
const CITY_BLOCKS = 14          // nombre de pâtés de maisons (par axe)
const BLOCK_SIZE = 8
const NEON_COLORS = [0x00e5ff, 0xff2e93, 0x7c4dff, 0x00ff9d, 0xffb300]
const TOTAL_DURATION = 9200     // ms avant onDone auto

// ────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ────────────────────────────────────────────────────────────
//  BUILDING — un immeuble avec fenêtres émissives
// ────────────────────────────────────────────────────────────
interface BuildingData {
  position: [number, number, number]
  size: [number, number, number]
  windowColor: number
  litRatio: number
}

function Buildings({ data }: { data: BuildingData[] }) {
  // Corps des immeubles : un seul matériau gris foncé, instancié
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!meshRef.current) return
    data.forEach((b, i) => {
      dummy.position.set(b.position[0], b.size[1] / 2, b.position[2])
      dummy.scale.set(b.size[0], b.size[1], b.size[2])
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [data, dummy])

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0d1320" roughness={0.85} metalness={0.25} />
      </instancedMesh>
      {/* Fenêtres émissives — points lumineux sur les façades */}
      <WindowsLayer data={data} />
    </>
  )
}

function WindowsLayer({ data }: { data: BuildingData[] }) {
  const ref = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const pos: number[] = []
    const col: number[] = []
    const c = new THREE.Color()
    data.forEach((b) => {
      const [bx, , bz] = b.position
      const [sx, sy, sz] = b.size
      const floors = Math.max(2, Math.floor(sy / 1.4))
      const perRow = Math.max(2, Math.floor(sx / 1.2))
      for (let f = 1; f < floors; f++) {
        for (let w = 0; w < perRow; w++) {
          if (Math.random() > b.litRatio) continue
          const y = (f / floors) * sy
          const offset = (w / (perRow - 1) - 0.5) * (sx * 0.8)
          // 4 façades
          const face = Math.floor(Math.random() * 4)
          let x = bx, z = bz
          if (face === 0) { x = bx + offset; z = bz + sz / 2 }
          if (face === 1) { x = bx + offset; z = bz - sz / 2 }
          if (face === 2) { x = bx + sx / 2; z = bz + offset }
          if (face === 3) { x = bx - sx / 2; z = bz + offset }
          pos.push(x, y, z)
          c.setHex(Math.random() > 0.82 ? b.windowColor : 0xffd27f)
          col.push(c.r, c.g, c.b)
        }
      }
    })
    return { positions: new Float32Array(pos), colors: new Float32Array(col) }
  }, [data])

  // Léger scintillement des fenêtres
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.material as THREE.PointsMaterial
      m.opacity = 0.78 + Math.sin(clock.elapsedTime * 2) * 0.08
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.42}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ────────────────────────────────────────────────────────────
//  NEON SIGNS — enseignes flottantes colorées
// ────────────────────────────────────────────────────────────
function NeonSigns({ data }: { data: BuildingData[] }) {
  const signs = useMemo(() => {
    return data
      .filter(() => Math.random() > 0.6)
      .slice(0, 40)
      .map((b) => ({
        position: [b.position[0], b.size[1] + rand(0.5, 3), b.position[2]] as [number, number, number],
        color: pick(NEON_COLORS),
        scale: rand(0.6, 1.6),
      }))
  }, [data])

  return (
    <>
      {signs.map((s, i) => (
        <mesh key={i} position={s.position}>
          <planeGeometry args={[s.scale, s.scale * 0.5]} />
          <meshBasicMaterial
            color={s.color}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}

// ────────────────────────────────────────────────────────────
//  RAIN — pluie québécoise
// ────────────────────────────────────────────────────────────
function Rain({ count = 1800 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = rand(-60, 60)
      arr[i * 3 + 1] = rand(0, 60)
      arr[i * 3 + 2] = rand(-60, 60)
    }
    return arr
  }, [count])

  useFrame(() => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - 0.9
      if (y < 0) y = 60
      pos.setY(i, y)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#9fc7ff" transparent opacity={0.35} depthWrite={false} />
    </points>
  )
}

// ────────────────────────────────────────────────────────────
//  CAR — voiture aux phares qui traverse la rue
// ────────────────────────────────────────────────────────────
function FlyingCar({ z, speed, color }: { z: number; speed: number; color: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!ref.current) return
    ref.current.position.x += speed
    if (ref.current.position.x > 60) ref.current.position.x = -60
    if (ref.current.position.x < -60) ref.current.position.x = 60
  })
  return (
    <group ref={ref} position={[rand(-50, 50), 0.4, z]}>
      <mesh>
        <boxGeometry args={[1.6, 0.5, 0.8]} />
        <meshStandardMaterial color="#10151f" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* phares */}
      <pointLight color={color} intensity={3} distance={8} position={[speed > 0 ? 1 : -1, 0, 0]} />
      <mesh position={[speed > 0 ? 0.85 : -0.85, 0.05, 0.25]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[speed > 0 ? 0.85 : -0.85, 0.05, -0.25]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

// ────────────────────────────────────────────────────────────
//  GROUND — sol mouillé réfléchissant (rues + grille néon)
// ────────────────────────────────────────────────────────────
function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#05080f" roughness={0.25} metalness={0.7} />
      </mesh>
      {/* Grille néon au sol pour le style synthwave */}
      <gridHelper args={[200, 80, 0x1b3a5c, 0x0c1a2c]} position={[0, 0.02, 0]} />
    </>
  )
}

// ────────────────────────────────────────────────────────────
//  CAMERA RIG — survol cinématique scripté
// ────────────────────────────────────────────────────────────
function CameraRig({ start }: { start: number }) {
  const { camera } = useThree()
  useFrame(() => {
    const t = Math.min(1, (performance.now() - start) / TOTAL_DURATION)
    // Trajectoire : descend depuis le ciel, avance dans la ville, se stabilise
    const ease = 1 - Math.pow(1 - t, 3) // easeOutCubic
    const x = Math.sin(ease * Math.PI * 0.5) * 18
    const y = THREE.MathUtils.lerp(48, 9, ease)
    const z = THREE.MathUtils.lerp(60, 16, ease)
    camera.position.set(x, y, z)
    camera.lookAt(Math.sin(ease * Math.PI) * 6, 6, -10)
  })
  return null
}

// ────────────────────────────────────────────────────────────
//  SCENE
// ────────────────────────────────────────────────────────────
function CityScene() {
  const start = useMemo(() => performance.now(), [])

  const buildings = useMemo<BuildingData[]>(() => {
    const arr: BuildingData[] = []
    const half = (CITY_BLOCKS * BLOCK_SIZE) / 2
    for (let i = 0; i < CITY_BLOCKS; i++) {
      for (let j = 0; j < CITY_BLOCKS; j++) {
        // laisser des rues : on saute certaines cases
        if (Math.random() > 0.82) continue
        const x = i * BLOCK_SIZE - half + rand(-1, 1)
        const z = j * BLOCK_SIZE - half + rand(-1, 1)
        const h = rand(4, 22) * (1 - Math.min(1, Math.hypot(x, z) / 70) * 0.5)
        arr.push({
          position: [x, 0, z],
          size: [rand(3, 5.5), Math.max(3, h), rand(3, 5.5)],
          windowColor: pick(NEON_COLORS),
          litRatio: rand(0.25, 0.7),
        })
      }
    }
    return arr
  }, [])

  return (
    <>
      <fog attach="fog" args={[0x070b14, 18, 95]} />
      <color attach="background" args={[0x05080f]} />

      {/* Lumières d'ambiance nuit */}
      <ambientLight intensity={0.18} color={0x2a3a6a} />
      <directionalLight position={[20, 40, 10]} intensity={0.35} color={0x4060a0} castShadow />
      {/* Halo néon central (style lampadaire géant) */}
      <pointLight position={[0, 25, 0]} intensity={1.2} color={0x00e5ff} distance={120} />
      <pointLight position={[-30, 12, -20]} intensity={0.8} color={0xff2e93} distance={80} />
      <pointLight position={[30, 12, 20]} intensity={0.8} color={0x7c4dff} distance={80} />

      <Ground />
      <Buildings data={buildings} />
      <NeonSigns data={buildings} />
      <Rain />

      <FlyingCar z={6} speed={0.5} color={0xfff3c0} />
      <FlyingCar z={-4} speed={-0.6} color={0xff4d4d} />
      <FlyingCar z={14} speed={0.4} color={0xfff3c0} />

      <CameraRig start={start} />
    </>
  )
}

// ────────────────────────────────────────────────────────────
//  OVERLAY UI — titre, sous-titre, bouton, skip
// ────────────────────────────────────────────────────────────
interface OverlayProps {
  showTitle: boolean
  onEnter: () => void
  onSkip: () => void
}

function Overlay({ showTitle, onEnter, onSkip }: OverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(3,5,10,0.85) 100%)',
        }}
      />

      {/* Skip */}
      <button
        onClick={onSkip}
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          pointerEvents: 'auto',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(0,229,255,0.4)',
          color: '#bfe9ff',
          padding: '8px 18px',
          borderRadius: 999,
          fontSize: 13,
          letterSpacing: 1,
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
        }}
      >
        PASSER ▸
      </button>

      <AnimatePresence>
        {showTitle && (
          <motion.div
            key="title"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ textAlign: 'center', zIndex: 2 }}
          >
            <motion.h1
              initial={{ letterSpacing: '0.6em', opacity: 0 }}
              animate={{ letterSpacing: '0.14em', opacity: 1 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                margin: 0,
                fontSize: 'clamp(2.4rem, 8vw, 6rem)',
                fontWeight: 800,
                color: '#fff',
                textShadow:
                  '0 0 18px rgba(0,229,255,0.9), 0 0 48px rgba(124,77,255,0.6)',
              }}
            >
              etherzRP
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              style={{
                margin: '6px 0 0',
                fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)',
                letterSpacing: '0.4em',
                color: '#ff2e93',
                textShadow: '0 0 12px rgba(255,46,147,0.8)',
              }}
            >
              QUÉBEC&nbsp;·&nbsp;RP
            </motion.p>

            <motion.button
              onClick={onEnter}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              whileHover={{ scale: 1.06, boxShadow: '0 0 30px rgba(0,229,255,0.7)' }}
              style={{
                pointerEvents: 'auto',
                marginTop: 38,
                padding: '14px 46px',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#05080f',
                background: 'linear-gradient(90deg,#00e5ff,#7c4dff)',
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
              }}
            >
              ENTRER DANS LA VILLE
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bas : tagline qui défile pendant le survol */}
      {!showTitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, times: [0, 0.2, 0.8, 1] }}
          style={{
            position: 'absolute',
            bottom: 60,
            color: '#bfe9ff',
            fontSize: 'clamp(0.9rem,2.5vw,1.3rem)',
            letterSpacing: '0.3em',
            textShadow: '0 0 10px rgba(0,229,255,0.6)',
          }}
        >
          QUÉBEC CITY · LA NUIT
        </motion.p>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ────────────────────────────────────────────────────────────
interface CinematicIntro3DProps {
  onDone: () => void
}

export default function CinematicIntro3D({ onDone }: CinematicIntro3DProps) {
  const [showTitle, setShowTitle] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Le titre apparaît vers la fin du survol
    const tTitle = setTimeout(() => setShowTitle(true), TOTAL_DURATION - 2800)
    return () => clearTimeout(tTitle)
  }, [])

  const finish = () => {
    if (exiting) return
    setExiting(true)
    setTimeout(onDone, 700)
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.7 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#05080f' }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 48, 60], fov: 55, near: 0.1, far: 300 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <CityScene />
        </Suspense>
      </Canvas>

      {/* ── Lapin-fusée + nuages (RabbitScene) qui survole la ville ── */}
      {/* Canvas transparent autonome, pointer-events-none : ne touche à rien. */}
      <RabbitScene />

      <Overlay showTitle={showTitle} onEnter={finish} onSkip={finish} />
    </motion.div>
  )
}
