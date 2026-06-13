'use client'

import { useRef, useMemo, memo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

const CORRIDOR_LENGTH = 22
const CORRIDOR_WIDTH = 3.2
const CORRIDOR_HEIGHT = 3.2
const WALL_THICKNESS = 0.15

// ════════════════════════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES
// ════════════════════════════════════════════════════════════════════════════

function createCanvasTexture(
  w: number, h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  if (repeat) tex.repeat.set(repeat[0], repeat[1])
  tex.needsUpdate = true
  return tex
}

// Sol marbre sombre
function useFloorTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    // Base sombre
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1a1828')
    grad.addColorStop(0.4, '#16141e')
    grad.addColorStop(0.8, '#1c1a2c')
    grad.addColorStop(1, '#141220')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Veines de marbre subtiles violettes
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = `rgba(${80 + Math.random() * 40}, ${40 + Math.random() * 30}, ${140 + Math.random() * 60}, 0.12)`
      ctx.lineWidth = 0.8 + Math.random() * 1.5
      ctx.beginPath()
      let x = Math.random() * w, y = Math.random() * h
      ctx.moveTo(x, y)
      for (let j = 0; j < 5; j++) {
        x += (Math.random() - 0.5) * 100
        y += (Math.random() - 0.5) * 100
        ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50, x, y)
      }
      ctx.stroke()
    }

    // Carrelage 4×4
    const tileW = w / 4, tileH = h / 4
    ctx.strokeStyle = 'rgba(30,20,60,0.3)'
    ctx.lineWidth = 2
    for (let x = 0; x <= w; x += tileW) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y <= h; y += tileH) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }

    // Reflets
    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`
      ctx.fillRect(Math.random() * w, Math.random() * h, 4 + Math.random() * 10, 2 + Math.random() * 4)
    }
  }, [CORRIDOR_WIDTH * 1.5, CORRIDOR_LENGTH / 4]), [])
}

// Tapis persan violet/bordeaux
function useCarpetTexture() {
  return useMemo(() => createCanvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#4c1d95'
    ctx.fillRect(0, 0, w, h)

    // Bordures
    ctx.strokeStyle = '#6d28d9'
    ctx.lineWidth = 5
    ctx.strokeRect(8, 8, w - 16, h - 16)
    ctx.strokeStyle = '#7c3aed'
    ctx.lineWidth = 2
    ctx.strokeRect(14, 14, w - 28, h - 28)

    // Motifs géométriques répétés
    const patternH = 40
    for (let y = 20; y < h - 20; y += patternH) {
      // Losange central
      ctx.fillStyle = 'rgba(124,58,237,0.4)'
      ctx.save()
      ctx.translate(w / 2, y + patternH / 2)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-10, -10, 20, 20)
      ctx.restore()

      // Points aux coins
      for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
        ctx.fillStyle = 'rgba(167,139,250,0.35)'
        ctx.beginPath()
        ctx.arc(w / 2 + px * 18, y + patternH / 2 + py * 12, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Filigrane doré
    ctx.strokeStyle = 'rgba(180,130,30,0.2)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, 20 + i * 15, 0, Math.PI * 2)
      ctx.stroke()
    }
  }, [1, CORRIDOR_LENGTH / 5]), [])
}

// Mur — panneaux industriels/hôtel
function useWallTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1e1b4b'
    ctx.fillRect(0, 0, w, h)

    // Panneaux
    const panelH = h / 4
    for (let i = 0; i < 4; i++) {
      const y = i * panelH
      const shade = 28 + Math.random() * 6
      ctx.fillStyle = `rgb(${shade + 4},${shade},${shade + 30})`
      ctx.fillRect(3, y + 3, w - 6, panelH - 6)
      ctx.strokeStyle = 'rgba(100,80,200,0.08)'
      ctx.lineWidth = 1
      ctx.strokeRect(3, y + 3, w - 6, panelH - 6)
    }

    // Stucco subtil
    for (let i = 0; i < 1000; i++) {
      const s = 24 + Math.random() * 8
      ctx.fillStyle = `rgba(${s},${s - 2},${s + 15},0.04)`
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
  }, [1, 3]), [])
}

// Plafond — panneaux acoustiques perforés
function useCeilingTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(0, 0, w, h)
    const gs = 64
    for (let x = 0; x < w; x += gs) {
      for (let y = 0; y < h; y += gs) {
        const s = 12 + Math.random() * 4
        ctx.fillStyle = `rgb(${s},${s},${s + 6})`
        ctx.fillRect(x + 2, y + 2, gs - 4, gs - 4)
        ctx.fillStyle = 'rgba(0,0,0,0.4)'
        for (let px = 0; px < 4; px++)
          for (let py = 0; py < 4; py++) {
            ctx.beginPath()
            ctx.arc(x + 10 + px * 12, y + 10 + py * 12, 1.5, 0, Math.PI * 2)
            ctx.fill()
          }
      }
    }
  }, [CORRIDOR_WIDTH, CORRIDOR_LENGTH / 5]), [])
}

// Texture porte — bois foncé brossé
function useDoorTexture() {
  return useMemo(() => createCanvasTexture(128, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#1a1520')
    grad.addColorStop(0.5, '#1e1828')
    grad.addColorStop(1, '#160e1e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Grain bois
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.012})`
      ctx.fillRect(0, y, w, 1)
    }

    // Panneaux
    ctx.strokeStyle = 'rgba(100,60,180,0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(10, 15, w - 20, h * 0.38)
    ctx.strokeRect(10, h * 0.45, w - 20, h * 0.38)
  }), [])
}

// ════════════════════════════════════════════════════════════════════════════
// PARTICULES ATMOSPHÉRIQUES
// ════════════════════════════════════════════════════════════════════════════

const AtmosphericParticles = memo(function AtmosphericParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * CORRIDOR_WIDTH * 0.85
      pos[i * 3 + 1] = Math.random() * CORRIDOR_HEIGHT
      pos[i * 3 + 2] = Math.random() * CORRIDOR_LENGTH
      spd[i * 3] = (Math.random() - 0.5) * 0.006
      spd[i * 3 + 1] = (Math.random() - 0.5) * 0.003
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.005
    }
    return { positions: pos, speeds: spd }
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      attr.array[i * 3] += speeds[i * 3] + Math.sin(t * 0.2 + i) * 0.0003
      attr.array[i * 3 + 1] += speeds[i * 3 + 1]
      attr.array[i * 3 + 2] += speeds[i * 3 + 2]
      if (Math.abs(attr.array[i * 3] as number) > CORRIDOR_WIDTH / 2) (attr.array as Float32Array)[i * 3] *= -0.9
      if ((attr.array[i * 3 + 1] as number) > CORRIDOR_HEIGHT || (attr.array[i * 3 + 1] as number) < 0)
        (attr.array as Float32Array)[i * 3 + 1] = Math.random() * CORRIDOR_HEIGHT
      if ((attr.array[i * 3 + 2] as number) > CORRIDOR_LENGTH || (attr.array[i * 3 + 2] as number) < 0)
        (attr.array as Float32Array)[i * 3 + 2] = Math.random() * CORRIDOR_LENGTH
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.012} color="#a78bfa" transparent opacity={0.25}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// STRUCTURE DU CORRIDOR — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

const CorridorStructure = memo(function CorridorStructure() {
  const floorTex = useFloorTexture()
  const carpetTex = useCarpetTexture()
  const wallTex = useWallTexture()
  const ceilTex = useCeilingTexture()

  return (
    <group>
      {/* ══ SOL MARBRE ══ */}
      <mesh position={[0, 0.01, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CORRIDOR_WIDTH, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={floorTex} color="#1a1828" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Bande centrale réfléchissante */}
      <mesh position={[0, 0.015, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, CORRIDOR_LENGTH]} />
        <meshStandardMaterial color="#120e20" roughness={0.1} metalness={0.5} />
      </mesh>

      {/* Tapis persan */}
      <mesh position={[0, 0.022, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.2, CORRIDOR_LENGTH - 1.5]} />
        <meshStandardMaterial map={carpetTex} color="#4c1d95" roughness={0.95} />
      </mesh>

      {/* Lignes dorées encadrant le tapis */}
      {[-0.62, 0.62].map((x, i) => (
        <mesh key={`gold-line-${i}`} position={[x, 0.023, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.015, CORRIDOR_LENGTH - 2]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
        </mesh>
      ))}

      {/* Rayures décoratives du tapis */}
      {Array.from({ length: Math.floor(CORRIDOR_LENGTH / 2) }).map((_, i) => (
        <mesh key={`stripe-${i}`} position={[0, 0.025, 1.5 + i * 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.0, 0.08]} />
          <meshStandardMaterial color="#6d28d9" roughness={0.9} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* ══ PLAFOND ══ */}
      <mesh position={[0, CORRIDOR_HEIGHT, CORRIDOR_LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORRIDOR_WIDTH, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={ceilTex} color="#0f0f1a" roughness={0.95} />
      </mesh>

      {/* Poutres transversales de plafond */}
      {Array.from({ length: Math.floor(CORRIDOR_LENGTH / 3.5) + 1 }).map((_, i) => (
        <mesh key={`beam-${i}`} position={[0, CORRIDOR_HEIGHT - 0.07, i * 3.5]} castShadow>
          <boxGeometry args={[CORRIDOR_WIDTH, 0.1, 0.08]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}

      {/* ══ MUR GAUCHE ══ */}
      <mesh position={[-CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, CORRIDOR_LENGTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, CORRIDOR_HEIGHT, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={wallTex} color="#1e1b4b" roughness={0.82} />
      </mesh>

      {/* ══ MUR DROIT ══ */}
      <mesh position={[CORRIDOR_WIDTH / 2, CORRIDOR_HEIGHT / 2, CORRIDOR_LENGTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, CORRIDOR_HEIGHT, CORRIDOR_LENGTH]} />
        <meshStandardMaterial map={wallTex} color="#1e1b4b" roughness={0.82} />
      </mesh>

      {/* ══ MUR DU FOND ══ */}
      <mesh position={[0, CORRIDOR_HEIGHT / 2, CORRIDOR_LENGTH + WALL_THICKNESS / 2]}>
        <boxGeometry args={[CORRIDOR_WIDTH, CORRIDOR_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial map={wallTex} color="#1e1b4b" roughness={0.85} />
      </mesh>

      {/* ══ PLINTHES ══ */}
      {[-1, 1].map((side, i) => (
        <group key={`baseboard-${i}`}>
          <mesh position={[side * (CORRIDOR_WIDTH / 2 - 0.04), 0.07, CORRIDOR_LENGTH / 2]}>
            <boxGeometry args={[0.04, 0.14, CORRIDOR_LENGTH]} />
            <meshStandardMaterial color="#0f0a1e" roughness={0.65} metalness={0.1} />
          </mesh>
          {/* Moulure lumineuse basse */}
          <mesh position={[side * (CORRIDOR_WIDTH / 2 - 0.04), 0.005, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.04, CORRIDOR_LENGTH]} />
            <meshStandardMaterial color="#4c1d95" emissive="#4c1d95" emissiveIntensity={0.2} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      {/* ══ CORNICHE ══ */}
      {[-1, 1].map((side, i) => (
        <group key={`crown-${i}`}>
          <mesh position={[side * (CORRIDOR_WIDTH / 2 - 0.04), CORRIDOR_HEIGHT - 0.06, CORRIDOR_LENGTH / 2]}>
            <boxGeometry args={[0.09, 0.12, CORRIDOR_LENGTH]} />
            <meshStandardMaterial color="#1f1f3a" roughness={0.6} metalness={0.15} />
          </mesh>
          {/* Liseré doré haut */}
          <mesh position={[side * (CORRIDOR_WIDTH / 2 - 0.04), CORRIDOR_HEIGHT - 0.01, CORRIDOR_LENGTH / 2]}>
            <boxGeometry args={[0.015, 0.012, CORRIDOR_LENGTH]} />
            <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* ══ CIMAISE ══ */}
      {[-1, 1].map((side, i) => (
        <mesh key={`cimaise-${i}`} position={[side * (CORRIDOR_WIDTH / 2 - 0.04), 2.1, CORRIDOR_LENGTH / 2]}>
          <boxGeometry args={[0.025, 0.03, CORRIDOR_LENGTH]} />
          <meshStandardMaterial color="#2d2a4e" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}

      {/* ══ NÉON SOL (effet cyberpunk subtil) ══ */}
      {[-1, 1].map((side, i) => (
        <mesh key={`neon-floor-${i}`} position={[side * (CORRIDOR_WIDTH / 2 - 0.05), 0.002, CORRIDOR_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.025, CORRIDOR_LENGTH - 0.5]} />
          <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.15} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PORTES DU CORRIDOR — ENRICHIES
// ════════════════════════════════════════════════════════════════════════════

const DOOR_CONFIG = [
  { z: 2,  side: 'left',  number: '101', isPlayerRoom: false, occupied: true  },
  { z: 2,  side: 'right', number: '102', isPlayerRoom: false, occupied: false },
  { z: 5,  side: 'left',  number: '103', isPlayerRoom: false, occupied: true  },
  { z: 5,  side: 'right', number: '104', isPlayerRoom: false, occupied: false },
  { z: 8,  side: 'left',  number: '105', isPlayerRoom: true,  occupied: true  },
  { z: 8,  side: 'right', number: '106', isPlayerRoom: false, occupied: true  },
  { z: 11, side: 'left',  number: '107', isPlayerRoom: false, occupied: false },
  { z: 11, side: 'right', number: '108', isPlayerRoom: false, occupied: true  },
  { z: 14, side: 'left',  number: '109', isPlayerRoom: false, occupied: false },
  { z: 14, side: 'right', number: '110', isPlayerRoom: false, occupied: false },
  { z: 17, side: 'left',  number: '111', isPlayerRoom: false, occupied: true  },
  { z: 17, side: 'right', number: '112', isPlayerRoom: false, occupied: false },
] as const

const CorridorDoors = memo(function CorridorDoors() {
  return (
    <group>
      {DOOR_CONFIG.map((door, i) => (
        <CorridorDoor
          key={i}
          position={[door.side === 'left' ? -CORRIDOR_WIDTH / 2 + WALL_THICKNESS / 2 + 0.01 : CORRIDOR_WIDTH / 2 - WALL_THICKNESS / 2 - 0.01, 0, door.z]}
          rotation={[0, door.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
          roomNumber={door.number}
          isPlayerRoom={door.isPlayerRoom}
          occupied={door.occupied}
        />
      ))}
    </group>
  )
})

interface CorridorDoorProps {
  position: [number, number, number]
  rotation: [number, number, number]
  roomNumber: string
  isPlayerRoom: boolean
  occupied?: boolean
}

const CorridorDoor = memo(function CorridorDoor({ position, rotation, roomNumber, isPlayerRoom, occupied = false }: CorridorDoorProps) {
  const ledRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const doorTex = useDoorTexture()

  useFrame((state) => {
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      if (isPlayerRoom) {
        mat.color.setHex(0x22c55e)
        mat.emissive.setHex(0x22c55e)
        mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
      } else if (occupied) {
        mat.color.setHex(0xef4444)
        mat.emissive.setHex(0xef4444)
        mat.emissiveIntensity = 0.4
      } else {
        mat.color.setHex(0x22c55e)
        mat.emissive.setHex(0x22c55e)
        mat.emissiveIntensity = 0.35
      }
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isPlayerRoom
        ? 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1
        : 0.05
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* ══ CADRE PORTE ══ */}
      {/* Montant supérieur */}
      <mesh position={[0, 2.22, 0]} castShadow>
        <boxGeometry args={[1.02, 0.08, 0.1]} />
        <meshStandardMaterial color="#12101e" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Montants latéraux */}
      {[-0.49, 0.49].map((x, i) => (
        <mesh key={`jamb-${i}`} position={[x, 1.1, 0]} castShadow>
          <boxGeometry args={[0.07, 2.24, 0.1]} />
          <meshStandardMaterial color="#12101e" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}

      {/* Cadre intérieur lumineux */}
      <mesh ref={glowRef} position={[0, 1.1, 0.04]}>
        <boxGeometry args={[0.9, 2.12, 0.003]} />
        <meshStandardMaterial
          color={isPlayerRoom ? '#064e3b' : '#0f0a1e'}
          emissive={isPlayerRoom ? '#22c55e' : '#4c1d95'}
          emissiveIntensity={isPlayerRoom ? 0.3 : 0.05}
          transparent opacity={0.7}
        />
      </mesh>

      {/* ══ PANNEAU DE PORTE ══ */}
      <mesh position={[0, 1.1, 0.05]} castShadow>
        <boxGeometry args={[0.88, 2.1, 0.05]} />
        <meshStandardMaterial
          map={doorTex}
          color={isPlayerRoom ? '#0f2a1e' : '#100e1a'}
          metalness={0.2} roughness={0.65}
        />
      </mesh>

      {/* Panneau supérieur */}
      <mesh position={[0, 1.65, 0.078]}>
        <boxGeometry args={[0.65, 0.65, 0.008]} />
        <meshStandardMaterial color={isPlayerRoom ? '#0c1f18' : '#0d0b16'} roughness={0.7} />
      </mesh>
      {/* Panneau inférieur */}
      <mesh position={[0, 0.5, 0.078]}>
        <boxGeometry args={[0.65, 0.65, 0.008]} />
        <meshStandardMaterial color={isPlayerRoom ? '#0c1f18' : '#0d0b16'} roughness={0.7} />
      </mesh>

      {/* Ligne néon décorative sur la porte */}
      <mesh position={[0.38, 1.1, 0.08]}>
        <boxGeometry args={[0.005, 1.8, 0.003]} />
        <meshStandardMaterial
          color={isPlayerRoom ? '#22c55e' : '#7c3aed'}
          emissive={isPlayerRoom ? '#22c55e' : '#7c3aed'}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* ══ POIGNÉE ══ */}
      <group position={[0.33, 1.05, 0.09]}>
        {/* Rosace */}
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Levier */}
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.055, 6]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.12} />
        </mesh>
        <mesh position={[0, -0.018, 0.055]}>
          <boxGeometry args={[0.012, 0.036, 0.018]} />
          <meshStandardMaterial color="#6b7280" metalness={0.85} roughness={0.12} />
        </mesh>
      </group>

      {/* ══ LECTEUR DE CARTE ══ */}
      <group position={[0.5, 1.18, 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[0.055, 0.1, 0.022]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Fente carte */}
        <mesh position={[0, -0.02, 0.013]}>
          <boxGeometry args={[0.035, 0.005, 0.004]} />
          <meshStandardMaterial color="#050508" />
        </mesh>
        {/* LED */}
        <mesh ref={ledRef} position={[0, 0.03, 0.014]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* ══ JUDAS ══ */}
      <mesh position={[0, 1.75, 0.08]}>
        <cylinderGeometry args={[0.009, 0.009, 0.014, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#080810" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.75, 0.087]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.012, 0.002, 6, 12]} />
        <meshStandardMaterial color="#8b6914" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ══ PLAQUE NUMÉRO ══ */}
      <group position={[0, 1.95, 0.09]}>
        {/* Fond doré */}
        <mesh position={[0, 0, -0.001]}>
          <boxGeometry args={[0.2, 0.1, 0.005]} />
          <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
        </mesh>
        {/* Plaque */}
        <mesh>
          <boxGeometry args={[0.18, 0.085, 0.008]} />
          <meshStandardMaterial color="#0f0e18" metalness={0.5} roughness={0.35} />
        </mesh>
        <Text position={[0, 0, 0.006]} fontSize={0.045} color="#fef3c7" anchorX="center" anchorY="middle">
          {roomNumber}
        </Text>
      </group>

      {/* ══ INDICATEUR LED ══ */}
      <mesh position={[-0.38, 1.95, 0.09]}>
        <sphereGeometry args={[0.014, 8, 8]} />
        <meshStandardMaterial
          color={isPlayerRoom || !occupied ? '#22c55e' : '#ef4444'}
          emissive={isPlayerRoom || !occupied ? '#22c55e' : '#ef4444'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* ══ PAILLASSON ══ */}
      <mesh position={[0, 0.006, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.65, 0.35]} />
        <meshStandardMaterial color="#1a1020" roughness={0.96} />
      </mesh>

      {/* ══ FUITE DE LUMIÈRE (chambre occupée) ══ */}
      {occupied && (
        <>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.72, 0.04]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.25} transparent opacity={0.45} />
          </mesh>
          <pointLight position={[0, 0.08, -0.15]} intensity={0.12} color="#fef3c7" distance={0.9} />
        </>
      )}

      {/* ══ HALO CHAMBRE DU JOUEUR ══ */}
      {isPlayerRoom && (
        <>
          <pointLight position={[0, 1.5, 0.25]} color="#22c55e" intensity={0.35} distance={2.5} decay={2} />
          {/* Étoile LED verte au sol */}
          <mesh position={[0, 0.007, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.06, 0.06]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} transparent opacity={0.5} />
          </mesh>
        </>
      )}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// LUMIÈRES AU PLAFOND — ENRICHIES
// ════════════════════════════════════════════════════════════════════════════

const CorridorLights = memo(function CorridorLights() {
  const positions = [2, 5, 8, 11, 14, 17, 20]
  return (
    <group>
      {positions.map((z, i) => (
        <CorridorCeilingLight key={i} position={[0, CORRIDOR_HEIGHT - 0.04, z]} index={i} />
      ))}
      {/* Lumières néon murales */}
      {[3, 9, 15].map((z, i) => (
        <group key={`wall-lights-${i}`}>
          <NeonWallLight position={[-CORRIDOR_WIDTH / 2 + 0.1, 1.8, z]} side="left" />
          <NeonWallLight position={[CORRIDOR_WIDTH / 2 - 0.1, 1.8, z]} side="right" />
        </group>
      ))}
    </group>
  )
})

const CorridorCeilingLight = memo(function CorridorCeilingLight({ position, index }: { position: [number, number, number]; index: number }) {
  const lightRef = useRef<THREE.PointLight>(null)
  const panelRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.65 + Math.sin(state.clock.elapsedTime * 0.8 + position[2] * 0.4) * 0.06
    }
    if (panelRef.current) {
      const mat = panelRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.75 + Math.sin(state.clock.elapsedTime * 0.8 + position[2] * 0.4) * 0.06
    }
  })

  return (
    <group position={position}>
      {/* Boîtier */}
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.055, 0.22]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Surface LED */}
      <mesh ref={panelRef} position={[0, -0.02, 0]}>
        <boxGeometry args={[0.38, 0.015, 0.16]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.75} />
      </mesh>
      {/* Grille diffuseur */}
      {[-0.12, 0, 0.12].map((x, i) => (
        <mesh key={`grid-${i}`} position={[x, -0.027, 0]}>
          <boxGeometry args={[0.008, 0.005, 0.14]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      {/* Point light */}
      <pointLight
        ref={lightRef}
        position={[0, -0.12, 0]}
        color="#fff5e6"
        intensity={0.65}
        distance={5.5}
        decay={2}
        castShadow={index % 2 === 0}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.001}
      />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// APPLIQUE NÉON MURALE
// ════════════════════════════════════════════════════════════════════════════

const NeonWallLight = memo(function NeonWallLight({ position, side }: { position: [number, number, number]; side: 'left' | 'right' }) {
  const tubeRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 1.5 + position[2]) * 0.15
    }
  })

  return (
    <group position={position}>
      {/* Support mural */}
      <mesh>
        <boxGeometry args={[0.04, 0.18, 0.04]} />
        <meshStandardMaterial color="#1a1820" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Bras */}
      <mesh position={[side === 'left' ? 0.04 : -0.04, 0, 0.04]} rotation={[0, 0, side === 'left' ? -0.3 : 0.3]}>
        <boxGeometry args={[0.04, 0.02, 0.08]} />
        <meshStandardMaterial color="#2a2830" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Tube néon */}
      <mesh ref={tubeRef} position={[side === 'left' ? 0.05 : -0.05, 0, 0.1]}>
        <cylinderGeometry args={[0.018, 0.018, 0.14, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.5} transparent opacity={0.9} />
      </mesh>
      {/* Point light */}
      <pointLight position={[side === 'left' ? 0.06 : -0.06, 0, 0.15]} intensity={0.12} color="#7c3aed" distance={2} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// DÉCORATION — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

const CorridorDecorations = memo(function CorridorDecorations() {
  return (
    <group>
      {/* ══ TABLEAUX ══ */}
      {([
        [4, 'left', '#4c1d95', '#7c3aed'],
        [10, 'left', '#1e3a5f', '#3b82f6'],
        [16, 'left', '#3b0764', '#a855f7'],
        [7, 'right', '#1a1a2e', '#6366f1'],
        [13, 'right', '#0f2a1e', '#22c55e'],
      ] as const).map(([z, side, bg, accent], i) => (
        <CorridorPainting
          key={`painting-${i}`}
          position={[side === 'left' ? -CORRIDOR_WIDTH / 2 + 0.1 : CORRIDOR_WIDTH / 2 - 0.1, 1.6, z]}
          rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
          bgColor={bg}
          accentColor={accent}
          index={i}
        />
      ))}

      {/* ══ PLANTES DÉCORATIVES ══ */}
      <CorridorPlant position={[-CORRIDOR_WIDTH / 2 + 0.3, 0, 1]} />
      <CorridorPlant position={[CORRIDOR_WIDTH / 2 - 0.3, 0, 18]} />

      {/* ══ APPLIQUES MURALES ══ */}
      {[3.5, 9.5, 15.5].map((z, i) => (
        <group key={`sconce-pair-${i}`}>
          <WallSconce position={[-CORRIDOR_WIDTH / 2 + 0.12, 2.05, z]} rotation={[0, Math.PI / 2, 0]} />
          <WallSconce position={[CORRIDOR_WIDTH / 2 - 0.12, 2.05, z]} rotation={[0, -Math.PI / 2, 0]} />
        </group>
      ))}

      {/* ══ TABLE AVEC VASE (alcôve) ══ */}
      <SmallSideTable position={[-CORRIDOR_WIDTH / 2 + 0.25, 0, 12.5]} />

      {/* ══ PANNEAUX MURAUX DÉCORATIFS ══ */}
      {[6, 12, 18].map((z, i) => (
        <WallPanel
          key={`panel-${i}`}
          position={[CORRIDOR_WIDTH / 2 - 0.1, 1.5, z]}
          rotation={[0, -Math.PI / 2, 0]}
          index={i}
        />
      ))}

      {/* ══ PANNEAUX SORTIE ══ */}
      <ExitSign position={[0, CORRIDOR_HEIGHT - 0.4, 0.8]} />
      <ExitSign position={[0, CORRIDOR_HEIGHT - 0.4, CORRIDOR_LENGTH - 0.8]} />

      {/* ══ EXTINCTEUR ══ */}
      <FireExtinguisher position={[CORRIDOR_WIDTH / 2 - 0.15, 0.7, 6.5]} />

      {/* ══ BOÎTE D'URGENCE ══ */}
      <EmergencyBox position={[-CORRIDOR_WIDTH / 2 + 0.1, 1.4, 9.5]} rotation={[0, Math.PI / 2, 0]} />

      {/* ══ CAMÉRA DE SURVEILLANCE ══ */}
      <SecurityCamera position={[-0.2, CORRIDOR_HEIGHT - 0.12, 4]} rotDir={1} />
      <SecurityCamera position={[0.2, CORRIDOR_HEIGHT - 0.12, 12]} rotDir={-1} />

      {/* ══ MARQUAGES AU SOL ══ */}
      {[5, 10, 15].map((z, i) => (
        <mesh key={`floor-mark-${i}`} position={[0, 0.026, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CORRIDOR_WIDTH - 0.3, 0.015]} />
          <meshStandardMaterial color="#4c1d95" emissive="#4c1d95" emissiveIntensity={0.1} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* ══ ASCENSEUR AU FOND ══ */}
      <ElevatorDoors position={[0, 0, CORRIDOR_LENGTH + 0.1]} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// TABLEAU DÉCORATIF — ENRICHI
// ════════════════════════════════════════════════════════════════════════════

const CorridorPainting = memo(function CorridorPainting({
  position, rotation, bgColor, accentColor, index
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  bgColor: string
  accentColor: string
  index: number
}) {
  const canvasTex = useMemo(() => createCanvasTexture(160, 120, (ctx, w, h) => {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)

    // Composition abstraite
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `${accentColor}${Math.floor((0.1 + Math.random() * 0.15) * 255).toString(16).padStart(2, '0')}`
      ctx.beginPath()
      ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 25, 0, Math.PI * 2)
      ctx.fill()
    }

    // Ligne diagonale
    ctx.strokeStyle = accentColor + '40'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(w, 0)
    ctx.stroke()

    // Étoile centrale
    ctx.fillStyle = accentColor + '30'
    ctx.save()
    ctx.translate(w * 0.6, h * 0.4)
    ctx.rotate(Math.PI / 4)
    ctx.fillRect(-8, -8, 16, 16)
    ctx.restore()
  }), [bgColor, accentColor])

  return (
    <group position={position} rotation={rotation}>
      {/* Cadre extérieur doré */}
      <mesh castShadow position={[0, 0, -0.002]}>
        <boxGeometry args={[0.56, 0.46, 0.025]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Cadre intérieur sombre */}
      <mesh>
        <boxGeometry args={[0.52, 0.42, 0.025]} />
        <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Toile */}
      <mesh position={[0, 0, 0.014]}>
        <boxGeometry args={[0.48, 0.38, 0.008]} />
        <meshStandardMaterial map={canvasTex} />
      </mesh>
      {/* Éclairage de tableau */}
      <mesh position={[0, 0.26, 0.04]}>
        <boxGeometry args={[0.3, 0.025, 0.05]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.35} />
      </mesh>
      <spotLight
        position={[0, 0.3, 0.15]}
        angle={Math.PI / 5}
        penumbra={0.7}
        intensity={0.25}
        color="#fef3c7"
        distance={1.5}
      />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PLANTE DÉCORATIVE DU COULOIR
// ════════════════════════════════════════════════════════════════════════════

const CorridorPlant = memo(function CorridorPlant({ position }: { position: [number, number, number] }) {
  const leavesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[2]) * 0.018
    }
  })

  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.08, 8]} />
        <meshStandardMaterial color="#1e1b2e" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.2, 8]} />
        <meshStandardMaterial color="#2a2440" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Anneau doré */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.095, 0.095, 0.018, 8]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Terre */}
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.085, 8]} />
        <meshStandardMaterial color="#1a1208" roughness={0.95} />
      </mesh>
      {/* Feuillage */}
      <group ref={leavesRef}>
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.18, 6]} />
          <meshStandardMaterial color="#1a2a10" roughness={0.8} />
        </mesh>
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.sin((angle * Math.PI) / 180) * 0.035,
              0.36 + i * 0.022,
              Math.cos((angle * Math.PI) / 180) * 0.035,
            ]}
            rotation={[0.35, (angle * Math.PI) / 180, 0.12]}
            castShadow
          >
            <boxGeometry args={[0.04, 0.14, 0.01]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#166534' : '#15803d'} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// APPLIQUE MURALE
// ════════════════════════════════════════════════════════════════════════════

const WallSconce = memo(function WallSconce({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const shadeRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (shadeRef.current) {
      const mat = shadeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 1.2 + position[2]) * 0.08
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Fixation murale */}
      <mesh>
        <boxGeometry args={[0.06, 0.16, 0.04]} />
        <meshStandardMaterial color="#2a2840" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Bras */}
      <mesh position={[0, 0, 0.06]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.02, 0.02, 0.1]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Abat-jour */}
      <mesh ref={shadeRef} position={[0, 0, 0.1]}>
        <boxGeometry args={[0.1, 0.14, 0.07]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.35} transparent opacity={0.88} />
      </mesh>
      {/* Ampoule */}
      <mesh position={[0, 0, 0.1]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#fffde7" emissive="#fffde7" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0, 0, 0.14]} color="#fef3c7" intensity={0.18} distance={2.2} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PETITE TABLE D'APPOINT
// ════════════════════════════════════════════════════════════════════════════

const SmallSideTable = memo(function SmallSideTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Plateau */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 8]} />
        <meshStandardMaterial color="#1a1020" roughness={0.3} metalness={0.35} />
      </mesh>
      {/* Rebord doré */}
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.185, 0.185, 0.01, 8]} />
        <meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Pied */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.65, 8]} />
        <meshStandardMaterial color="#6b4914" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 8]} />
        <meshStandardMaterial color="#4a3010" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Vase */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.035, 0.16, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.3} />
      </mesh>
      {/* Fleur violette */}
      <mesh position={[0, 0.89, 0]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.2} roughness={0.7} />
      </mesh>
      {/* Tige */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.1, 4]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PANNEAU MURAL DÉCORATIF
// ════════════════════════════════════════════════════════════════════════════

const WallPanel = memo(function WallPanel({ position, rotation, index }: { position: [number, number, number]; rotation: [number, number, number]; index: number }) {
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime * 0.6 + index * 1.5) * 0.06
    }
  })

  return (
    <group position={position} rotation={rotation}>
      {/* Fond */}
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.28, 0.018]} />
        <meshStandardMaterial color="#0e0c18" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Écran */}
      <mesh ref={screenRef} position={[0, 0, 0.01]}>
        <boxGeometry args={[0.38, 0.2, 0.005]} />
        <meshStandardMaterial
          color="#0a0818"
          emissive={index % 2 === 0 ? '#4c1d95' : '#1e3a5f'}
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* LED état */}
      <mesh position={[0.18, 0.1, 0.012]}>
        <sphereGeometry args={[0.007, 6, 6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PANNEAU EXIT
// ════════════════════════════════════════════════════════════════════════════

const ExitSign = memo(function ExitSign({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Boîtier */}
      <mesh>
        <boxGeometry args={[0.38, 0.16, 0.05]} />
        <meshStandardMaterial color="#0f0f1a" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Surface émissive */}
      <mesh ref={glowRef} position={[0, 0, 0.028]}>
        <boxGeometry args={[0.32, 0.1, 0.005]} />
        <meshStandardMaterial color="#0a2010" emissive="#22c55e" emissiveIntensity={0.55} />
      </mesh>
      {/* Bordure */}
      <mesh position={[0, 0, 0.026]}>
        <boxGeometry args={[0.36, 0.14, 0.003]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.2} transparent opacity={0.3} />
      </mesh>
      <Text position={[0, 0, 0.032]} fontSize={0.055} color="#ffffff" anchorX="center" anchorY="middle">
        ◄ SORTIE / EXIT ►
      </Text>
      <pointLight position={[0, 0, 0.1]} intensity={0.12} color="#22c55e" distance={1.5} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EXTINCTEUR
// ════════════════════════════════════════════════════════════════════════════

const FireExtinguisher = memo(function FireExtinguisher({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Support mural */}
      <mesh position={[0, 0.05, -0.04]}>
        <boxGeometry args={[0.1, 0.18, 0.015]} />
        <meshStandardMaterial color="#1a1e30" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Corps */}
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#ef4444" roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Bande blanche */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.052, 0.052, 0.025, 8]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Poignée */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.05, 0.06, 0.025]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Tuyau */}
      <mesh position={[0.03, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.007, 0.007, 0.12, 6]} />
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      {/* Buse */}
      <mesh position={[0.06, 0.04, 0]}>
        <coneGeometry args={[0.01, 0.03, 6]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// BOÎTIER D'URGENCE
// ════════════════════════════════════════════════════════════════════════════

const EmergencyBox = memo(function EmergencyBox({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.18, 0.08]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Croix */}
      <mesh position={[0, 0, 0.042]}>
        <boxGeometry args={[0.12, 0.03, 0.005]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <boxGeometry args={[0.03, 0.12, 0.005]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// CAMÉRA DE SURVEILLANCE
// ════════════════════════════════════════════════════════════════════════════

const SecurityCamera = memo(function SecurityCamera({ position, rotDir }: { position: [number, number, number]; rotDir: number }) {
  const headRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (headRef.current) headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.45 * rotDir
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 4) * 0.3
    }
  })

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.045, 0.05, 0.045]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.6} />
      </mesh>
      <group ref={headRef} position={[0, -0.06, 0]}>
        <mesh rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.055, 0.038, 0.09]} />
          <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.05]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.013, 0.016, 0.028, 8]} />
          <meshStandardMaterial color="#060606" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh ref={ledRef} position={[0.022, 0.012, 0.04]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PORTES D'ASCENSEUR — ENRICHIES
// ════════════════════════════════════════════════════════════════════════════

const ElevatorDoors = memo(function ElevatorDoors({ position }: { position: [number, number, number] }) {
  const indicatorRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (indicatorRef.current) {
      const mat = indicatorRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.15
    }
  })

  return (
    <group position={position}>
      {/* ══ CADRE ══ */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[1.6, 2.6, 0.12]} />
        <meshStandardMaterial color="#1f1f2e" metalness={0.65} roughness={0.35} />
      </mesh>
      {/* Moulures cadre */}
      {[-0.82, 0.82].map((x, i) => (
        <mesh key={`elev-frame-${i}`} position={[x, 1.3, 0.06]} castShadow>
          <boxGeometry args={[0.05, 2.65, 0.06]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 2.64, 0.06]} castShadow>
        <boxGeometry args={[1.7, 0.05, 0.06]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ══ PORTES ══ */}
      {[-0.38, 0.38].map((x, i) => (
        <mesh key={`elev-door-${i}`} position={[x, 1.25, 0.065]} castShadow>
          <boxGeometry args={[0.72, 2.4, 0.035]} />
          <meshStandardMaterial color="#374151" metalness={0.82} roughness={0.18} />
        </mesh>
      ))}
      {/* Ligne de jonction */}
      <mesh position={[0, 1.25, 0.09]}>
        <boxGeometry args={[0.018, 2.4, 0.008]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {/* Reflet */}
      <mesh position={[-0.2, 1.6, 0.085]}>
        <boxGeometry args={[0.22, 0.7, 0.002]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.02} metalness={0.9} roughness={0.05} />
      </mesh>

      {/* ══ PANNEAU D'APPEL ══ */}
      <group position={[1.0, 1.25, 0.07]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.18, 0.025]} />
          <meshStandardMaterial color="#0f0f1a" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Bouton haut */}
        <mesh position={[0, 0.04, 0.016]}>
          <cylinderGeometry args={[0.018, 0.018, 0.01, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Flèche haut */}
        <mesh position={[0, 0.04, 0.022]}>
          <boxGeometry args={[0.01, 0.015, 0.002]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
        </mesh>
        {/* Bouton bas */}
        <mesh position={[0, -0.04, 0.016]}>
          <cylinderGeometry args={[0.018, 0.018, 0.01, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ══ INDICATEUR D'ÉTAGE ══ */}
      <group position={[0, 2.78, 0.07]}>
        <mesh>
          <boxGeometry args={[0.45, 0.2, 0.04]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh ref={indicatorRef} position={[0, 0, 0.025]}>
          <boxGeometry args={[0.36, 0.12, 0.005]} />
          <meshStandardMaterial color="#0a1410" emissive="#22c55e" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* ══ SOL DEVANT ASCENSEUR ══ */}
      <mesh position={[0, 0.012, -0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshStandardMaterial color="#2a2840" roughness={0.25} metalness={0.35} />
      </mesh>

      {/* Lumière */}
      <pointLight position={[0, 0.5, -0.5]} intensity={0.3} color="#22c55e" distance={3} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT RACINE
// ════════════════════════════════════════════════════════════════════════════

export function HotelCorridor3D() {
  return (
    <group position={[0, 0, 5.1]}>
      {/* Structure principale */}
      <CorridorStructure />

      {/* Portes de chambres */}
      <CorridorDoors />

      {/* Éclairage plafond + appliques néon */}
      <CorridorLights />

      {/* Décorations & mobilier */}
      <CorridorDecorations />

      {/* Particules atmosphériques */}
      <AtmosphericParticles />

      {/* Brouillard de profondeur */}
      <fog attach="fog" args={['#0f0f1a', 12, 28]} />

      {/* Éclairage global du couloir */}
      <ambientLight intensity={0.12} color="#c4b5fd" />
      <hemisphereLight color="#4c1d95" groundColor="#0f0a1e" intensity={0.18} />

      {/* Lumière d'entrée */}
      <spotLight
        position={[0, CORRIDOR_HEIGHT - 0.3, 0.8]}
        angle={Math.PI / 4}
        penumbra={0.8}
        intensity={0.8}
        color="#fff8e0"
        castShadow
        shadow-mapSize={[512, 512]}
      />

      {/* Lumière de fond */}
      <pointLight
        position={[0, 1.5, CORRIDOR_LENGTH - 2]}
        intensity={0.35}
        color="#4c1d95"
        distance={8}
        decay={2}
      />
    </group>
  )
}