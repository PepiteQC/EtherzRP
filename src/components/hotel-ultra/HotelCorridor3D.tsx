import { useRef, useMemo, memo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useHotelStore, CARD_COLORS, type CardLevel } from './HotelStore'

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const CW = 4.2   // corridor width (élargi)
const CH = 3.8   // corridor height (élargi)
const DOOR_W = 0.85
const DOOR_H = 2.2

// ═══════════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES
// ═══════════════════════════════════════════════════════════════

function createCanvasTexture(
  w: number, h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping
  if (repeat) tex.repeat.set(repeat[0], repeat[1])
  tex.needsUpdate = true
  return tex
}

function useCorridorFloorTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#0f0f1a'; ctx.fillRect(0, 0, w, h)
    const ts = w / 4
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = c * ts, y = r * ts, s = 14 + Math.random() * 6
      ctx.fillStyle = `rgb(${s + 2},${s},${s + 10})`
      ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2)
      const grad = ctx.createLinearGradient(x, y, x + ts, y + ts)
      grad.addColorStop(0, 'rgba(255,255,255,0.015)'); grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad; ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2)
    }
    ctx.strokeStyle = 'rgba(30,20,50,0.25)'; ctx.lineWidth = 1.5
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * ts, 0); ctx.lineTo(i * ts, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * ts); ctx.lineTo(w, i * ts); ctx.stroke() }
    for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(${50 + Math.random() * 30},${30 + Math.random() * 20},${80 + Math.random() * 40},0.06)`; ctx.lineWidth = 0.6; ctx.beginPath(); let x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y); for (let j = 0; j < 3; j++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; ctx.lineTo(x, y) }; ctx.stroke() }
  }, [CW * 1.2, 6]), [])
}

function useCarpetTexture() {
  return useMemo(() => createCanvasTexture(128, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2a0a3e'; ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#3a1a5e'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, w - 8, h - 8)
    ctx.strokeStyle = '#4a2a6e'; ctx.lineWidth = 1.5; ctx.strokeRect(8, 8, w - 16, h - 16)
    const pH = 28
    for (let y = 14; y < h - 14; y += pH) {
      ctx.fillStyle = 'rgba(124,58,237,0.2)'; ctx.save(); ctx.translate(w / 2, y + pH / 2); ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.restore()
      for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { ctx.fillStyle = 'rgba(140,100,220,0.15)'; ctx.beginPath(); ctx.arc(w / 2 + px * 12, y + pH / 2 + py * 8, 2, 0, Math.PI * 2); ctx.fill() }
    }
    ctx.strokeStyle = 'rgba(180,140,40,0.1)'; ctx.lineWidth = 0.5
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(w / 2, h / 2, 12 + i * 10, 0, Math.PI * 2); ctx.stroke() }
  }, [1, 4]), [])
}

function useWallTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, w, h)
    const pH = h / 3
    for (let i = 0; i < 3; i++) { const y = i * pH, s = 28 + Math.random() * 4; ctx.fillStyle = `rgb(${s + 4},${s},${s + 22})`; ctx.fillRect(2, y + 2, w - 4, pH - 4); ctx.strokeStyle = 'rgba(60,40,120,0.06)'; ctx.lineWidth = 0.6; ctx.strokeRect(2, y + 2, w - 4, pH - 4) }
    for (let i = 0; i < 600; i++) { const s = 26 + Math.random() * 6; ctx.fillStyle = `rgba(${s},${s},${s + 8},0.02)`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
  }, [1, 2]), [])
}

function useDoorTexture() {
  return useMemo(() => createCanvasTexture(96, 192, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#1a1828'); grad.addColorStop(0.5, '#1e1c2a'); grad.addColorStop(1, '#14121c')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 2) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.008})`; ctx.fillRect(0, y, w, 1) }
    ctx.strokeStyle = 'rgba(60,40,120,0.06)'; ctx.lineWidth = 0.8
    ctx.strokeRect(8, 12, w - 16, h * 0.34); ctx.strokeRect(8, h * 0.44, w - 16, h * 0.34)
  }), [])
}

function useCeilingTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, w, h)
    const gs = 64
    for (let x = 0; x < w; x += gs) for (let y = 0; y < h; y += gs) {
      const s = 14 + Math.random() * 4; ctx.fillStyle = `rgb(${s},${s + 2},${s + 8})`;ctx.fillRect(x + 1.5, y + 1.5, gs - 3, gs - 3)
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; for (let px = 0; px < 3; px++) for (let py = 0; py < 3; py++) { ctx.beginPath(); ctx.arc(x + 12 + px * 16, y + 12 + py * 16, 1.2, 0, Math.PI * 2); ctx.fill() }
    }
  }, [CW * 0.8, 4]), [])
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — CORRIDOR
// ═══════════════════════════════════════════════════════════════

export function HotelCorridor3D({ floor, position = [0, 0, 0] as [number, number, number] }: { floor: number; position?: [number, number, number] }) {
  const { rooms, doors, tryAccessDoor } = useHotelStore()
  const floorRooms = useMemo(() => rooms.filter(r => r.floor === floor), [rooms, floor])
  const CL = floorRooms.length * 2.8 + 6

  const floorTex = useCorridorFloorTexture()
  const carpetTex = useCarpetTexture()
  const wallTex = useWallTexture()
  const ceilTex = useCeilingTexture()

  const handleAccess = useCallback((doorId: string) => { tryAccessDoor(doorId) }, [tryAccessDoor])

  return (
    <group position={position}>
      {/* ═══════════════════════════════════════
          SOL
         ═══════════════════════════════════════ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, CL / 2]} receiveShadow>
        <planeGeometry args={[CW, CL]} />
        <meshStandardMaterial map={floorTex} color="#0f0f1a" roughness={0.3} metalness={0.15} />
      </mesh>

      {/* Bande centrale réfléchissante */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, CL / 2]}>
        <planeGeometry args={[0.4, CL - 1]} />
        <meshStandardMaterial color="#0a0814" roughness={0.08} metalness={0.4} />
      </mesh>

      {/* Tapis persan */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, CL / 2]} receiveShadow>
        <planeGeometry args={[1.5, CL - 2.5]} />
        <meshStandardMaterial map={carpetTex} color="#2a0a3e" roughness={0.95} />
      </mesh>

      {/* Lignes dorées encadrant le tapis */}
      {[-0.78, 0.78].map((x, i) => (
        <mesh key={`gold-line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.016, CL / 2]}>
          <planeGeometry args={[0.012, CL - 3]} />
          <meshStandardMaterial color="#c9a84c" roughness={0.15} metalness={0.6} />
        </mesh>
      ))}

      {/* Rayures décoratives du tapis */}
      {Array.from({ length: Math.floor(CL / 2) }, (_, i) => (
        <mesh key={`cs-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 2 + i * 2]}>
          <planeGeometry args={[1.2, 0.06]} />
          <meshStandardMaterial color="#7c3aed" roughness={0.9} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════
          PLAFOND
         ═══════════════════════════════════════ */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CH, CL / 2]}>
        <planeGeometry args={[CW, CL]} />
        <meshStandardMaterial map={ceilTex} color="#111827" roughness={0.9} />
      </mesh>

      {/* Poutres transversales */}
      {Array.from({ length: Math.floor(CL / 4) + 1 }).map((_, i) => (
        <mesh key={`beam-${i}`} position={[0, CH - 0.05, i * 4]} castShadow>
          <boxGeometry args={[CW, 0.08, 0.06]} />
          <meshStandardMaterial color="#0a0a16" roughness={0.65} metalness={0.15} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════
          LED STRIPS
         ═══════════════════════════════════════ */}
      {/* Centre */}
      <mesh position={[0, CH - 0.02, CL / 2]}>
        <boxGeometry args={[0.05, 0.01, CL - 1.5]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.6} />
      </mesh>
      {/* Support LED */}
      <mesh position={[0, CH - 0.015, CL / 2]}>
        <boxGeometry args={[0.08, 0.015, CL - 1]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Néons latéraux */}
      {[-CW / 2 + 0.12, CW / 2 - 0.12].map((x, i) => (
        <group key={`side-neon-${i}`}>
          <mesh position={[x, CH - 0.04, CL / 2]}>
            <boxGeometry args={[0.03, 0.006, CL - 2.5]} />
            <meshStandardMaterial color="#00e0ff" emissive="#00e0ff" emissiveIntensity={0.25} />
          </mesh>
          {/* Support */}
          <mesh position={[x, CH - 0.035, CL / 2]}>
            <boxGeometry args={[0.05, 0.012, CL - 2]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Néons sol */}
      {[-CW / 2 + 0.08, CW / 2 - 0.08].map((x, i) => (
        <mesh key={`floor-neon-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.003, CL / 2]}>
          <planeGeometry args={[0.02, CL - 1.5]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.12} transparent opacity={0.35} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════
          MURS
         ═══════════════════════════════════════ */}
      {/* Gauche */}
      <mesh position={[-CW / 2, CH / 2, CL / 2]} castShadow>
        <boxGeometry args={[0.15, CH, CL]} />
        <meshStandardMaterial map={wallTex} color="#1e1b4b" roughness={0.82} />
      </mesh>
      {/* Droit */}
      <mesh position={[CW / 2, CH / 2, CL / 2]} castShadow>
        <boxGeometry args={[0.15, CH, CL]} />
        <meshStandardMaterial map={wallTex} color="#1e1b4b" roughness={0.82} />
      </mesh>
      {/* Fond */}
      <mesh position={[0, CH / 2, CL]}>
        <boxGeometry args={[CW, CH, 0.15]} />
        <meshStandardMaterial map={wallTex} color="#1e1b4b" roughness={0.85} />
      </mesh>

      {/* Plinthes */}
      {[-CW / 2 + 0.06, CW / 2 - 0.06].map((x, i) => (
        <mesh key={`bb-${i}`} position={[x, 0.055, CL / 2]}>
          <boxGeometry args={[0.035, 0.11, CL]} />
          <meshStandardMaterial color="#0f0a1e" roughness={0.65} metalness={0.08} />
        </mesh>
      ))}

      {/* Corniche */}
      {[-CW / 2 + 0.06, CW / 2 - 0.06].map((x, i) => (
        <group key={`crown-${i}`}>
          <mesh position={[x, CH - 0.04, CL / 2]}>
            <boxGeometry args={[0.06, 0.08, CL]} />
            <meshStandardMaterial color="#1f1f3a" roughness={0.55} metalness={0.12} />
          </mesh>
          <mesh position={[x, CH - 0.01, CL / 2]}>
            <boxGeometry args={[0.01, 0.008, CL]} />
            <meshStandardMaterial color="#c9a84c" roughness={0.1} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Cimaise */}
      {[-CW / 2 + 0.06, CW / 2 - 0.06].map((x, i) => (
        <mesh key={`cimaise-${i}`} position={[x, CH * 0.55, CL / 2]}>
          <boxGeometry args={[0.02, 0.02, CL]} />
          <meshStandardMaterial color="#2a2a4e" roughness={0.4} metalness={0.2} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════
          LUMIÈRES PLAFOND
         ═══════════════════════════════════════ */}
      {Array.from({ length: Math.floor(CL / 3) }, (_, i) => (
        <CeilingLightUnit key={`light-${i}`} position={[0, CH - 0.04, 2.5 + i * 3]} index={i} />
      ))}

      {/* ═══════════════════════════════════════
          APPLIQUES MURALES
         ═══════════════════════════════════════ */}
      {Array.from({ length: Math.floor(CL / 5) }, (_, i) => {
        const z = 3 + i * 5
        return (
          <group key={`sconce-pair-${i}`}>
            <WallSconce position={[-CW / 2 + 0.1, CH * 0.5, z]} side="left" />
            <WallSconce position={[CW / 2 - 0.1, CH * 0.5, z]} side="right" />
          </group>
        )
      })}

      {/* ═══════════════════════════════════════
          PANNEAU D'ÉTAGE
         ═══════════════════════════════════════ */}
      <FloorSign position={[0, CH * 0.72, 0.5]} floor={floor} />

      {/* ═══════════════════════════════════════
          PANNEAUX SORTIE
         ═══════════════════════════════════════ */}
      <ExitSign position={[0, CH - 0.25, 1]} />
      <ExitSign position={[0, CH - 0.25, CL - 0.5]} />

      {/* ═══════════════════════════════════════
          EXTINCTEUR
         ═══════════════════════════════════════ */}
      <FireExtinguisher position={[CW / 2 - 0.12, 0.65, CL / 2]} />

      {/* ═══════════════════════════════════════
          BOÎTIER D'URGENCE
         ═══════════════════════════════════════ */}
      <EmergencyBox position={[-CW / 2 + 0.1, 1.4, CL * 0.35]} side="left" />

      {/* ═══════════════════════════════════════
          TABLEAUX
         ═══════════════════════════════════════ */}
      {Array.from({ length: Math.floor(CL / 7) }, (_, i) => (
        <CorridorPainting key={`paint-${i}`} position={[-CW / 2 + 0.1, CH * 0.42, 4 + i * 7]} side="left" variant={i} />
      ))}
      {Array.from({ length: Math.floor(CL / 9) }, (_, i) => (
        <CorridorPainting key={`paint-r-${i}`} position={[CW / 2 - 0.1, CH * 0.42, 6 + i * 9]} side="right" variant={i + 3} />
      ))}

      {/* ═══════════════════════════════════════
          PANNEAUX MURAUX DÉCORATIFS
         ═══════════════════════════════════════ */}
      {Array.from({ length: Math.floor(CL / 8) }, (_, i) => (
        <WallPanel key={`panel-${i}`} position={[CW / 2 - 0.1, CH * 0.38, 5 + i * 8]} side="right" index={i} />
      ))}

      {/* ═══════════════════════════════════════
          PLANTES
         ═══════════════════════════════════════ */}
      <CorridorPlant position={[-CW / 2 + 0.3, 0, 1.5]} />
      <CorridorPlant position={[CW / 2 - 0.3, 0, CL - 1.5]} />

      {/* ═══════════════════════════════════════
          CAMÉRAS DE SURVEILLANCE
         ═══════════════════════════════════════ */}
      <SecurityCamera position={[-0.2, CH - 0.1, CL * 0.25]} rotDir={1} />
      <SecurityCamera position={[0.2, CH - 0.1, CL * 0.75]} rotDir={-1} />

      {/* ═══════════════════════════════════════
          MARQUAGES AU SOL
         ═══════════════════════════════════════ */}
      {Array.from({ length: Math.floor(CL / 8) }).map((_, i) => (
        <mesh key={`mark-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 4 + i * 8]}>
          <planeGeometry args={[CW - 0.3, 0.01]} />
          <meshStandardMaterial color="#4c1d95" emissive="#4c1d95" emissiveIntensity={0.06} transparent opacity={0.25} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════
          PORTES DE CHAMBRES
         ═══════════════════════════════════════ */}
      {floorRooms.map((room, i) => {
        const door = doors[room.doorId]
        if (!door) return null
        const z = 3 + i * 2.8
        const x = room.side === 'left' ? -CW / 2 + 0.1 : CW / 2 - 0.1
        const rot: [number, number, number] = [0, room.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]
        return (
          <SecureDoor3D
            key={room.id}
            door={door}
            room={room}
            position={[x, 0, z]}
            rotation={rot}
            onAccess={() => handleAccess(door.id)}
          />
        )
      })}

      {/* ═══════════════════════════════════════
          ÉCLAIRAGE AMBIANT
         ═══════════════════════════════════════ */}
      <ambientLight intensity={0.12} color="#1a1a2e" />
      <hemisphereLight intensity={0.08} color="#fef3c7" groundColor="#0a0a14" />

      {/* Point lights principaux */}
      {Array.from({ length: Math.floor(CL / 6) }).map((_, i) => (
        <pointLight key={`main-pl-${i}`} position={[0, CH * 0.65, 3 + i * 6]} intensity={0.4} color="#fef3c7" distance={6} decay={2} />
      ))}

      {/* LED violet ambiant */}
      <pointLight position={[0, CH * 0.7, CL / 2]} intensity={0.3} color="#8b5cf6" distance={CL * 0.6} decay={2} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════
// LUMINAIRE PLAFOND
// ═══════════════════════════════════════════════════════════════

const CeilingLightUnit = memo(function CeilingLightUnit({ position, index }: { position: [number, number, number]; index: number }) {
  const panelRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (panelRef.current) {
      const mat = panelRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.7 + Math.sin(state.clock.elapsedTime * 0.6 + index * 1.2) * 0.05
    }
  })

  return (
    <group position={position}>
      {/* Boîtier */}
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.04, 0.18]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.55} roughness={0.4} />
      </mesh>
      {/* Panel LED */}
      <mesh ref={panelRef} position={[0, -0.018, 0]}>
        <boxGeometry args={[0.35, 0.012, 0.14]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.7} />
      </mesh>
      {/* Grille diffuseur */}
      {[-0.1, 0, 0.1].map((x, i) => (
        <mesh key={i} position={[x, -0.025, 0]}>
          <boxGeometry args={[0.006, 0.004, 0.12]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
      <pointLight position={[0, -0.1, 0]} intensity={0.45} color="#fef3c7" distance={4.5} decay={2} castShadow={index % 2 === 0} shadow-mapSize={[256, 256]} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// APPLIQUE MURALE
// ═══════════════════════════════════════════════════════════════

const WallSconce = memo(function WallSconce({ position, side }: { position: [number, number, number]; side: 'left' | 'right' }) {
  const shadeRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (shadeRef.current) {
      const mat = shadeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 0.8 + position[2] * 0.3) * 0.06
    }
  })

  const dir = side === 'left' ? 1 : -1

  return (
    <group position={position}>
      {/* Support */}
      <mesh>
        <boxGeometry args={[0.04, 0.14, 0.06]} />
        <meshStandardMaterial color="#2a2840" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Bras */}
      <mesh position={[dir * 0.04, 0, 0.05]}>
        <boxGeometry args={[0.02, 0.02, 0.08]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Abat-jour */}
      <mesh ref={shadeRef} position={[dir * 0.05, 0, 0.1]}>
        <boxGeometry args={[0.08, 0.12, 0.05]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} transparent opacity={0.85} />
      </mesh>
      {/* Ampoule */}
      <mesh position={[dir * 0.05, 0, 0.1]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#fffde7" emissive="#fffde7" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[dir * 0.06, 0, 0.12]} color="#fef3c7" intensity={0.12} distance={2} decay={2} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PANNEAU D'ÉTAGE
// ═══════════════════════════════════════════════════════════════

const FloorSign = memo(function FloorSign({ position, floor }: { position: [number, number, number]; floor: number }) {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.5, 0.45, 0.04]} />
        <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0, 0.025]}>
        <boxGeometry args={[1.4, 0.35, 0.005]} />
        <meshStandardMaterial color="#1a0a2e" emissive="#8b5cf6" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[1.45, 0.4, 0.003]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.15} transparent opacity={0.3} />
      </mesh>
      <Text position={[0, 0, 0.035]} fontSize={0.16} color="#ffffff" anchorX="center" anchorY="middle">
        ÉTAGE {floor}
      </Text>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PANNEAU EXIT
// ═══════════════════════════════════════════════════════════════

const ExitSign = memo(function ExitSign({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => { if (ref.current) { const m = ref.current.material as THREE.MeshStandardMaterial; m.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.08 } })

  return (
    <group position={position}>
      <mesh><boxGeometry args={[0.35, 0.14, 0.04]} /><meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.3} /></mesh>
      <mesh ref={ref} position={[0, 0, 0.025]}><boxGeometry args={[0.3, 0.09, 0.004]} /><meshStandardMaterial color="#0a2010" emissive="#22c55e" emissiveIntensity={0.5} /></mesh>
      <Text position={[0, 0, 0.03]} fontSize={0.045} color="#ffffff" anchorX="center" anchorY="middle">◄ SORTIE ►</Text>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// EXTINCTEUR
// ═══════════════════════════════════════════════════════════════

const FireExtinguisher = memo(function FireExtinguisher({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, -0.03]}><boxGeometry args={[0.08, 0.15, 0.012]} /><meshStandardMaterial color="#1a1e30" roughness={0.6} metalness={0.5} /></mesh>
      <mesh castShadow><cylinderGeometry args={[0.04, 0.04, 0.28, 8]} /><meshStandardMaterial color="#ef4444" roughness={0.45} metalness={0.3} /></mesh>
      <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.042, 0.042, 0.02, 8]} /><meshStandardMaterial color="#f0f0f0" roughness={0.6} /></mesh>
      <mesh position={[0, 0.16, 0]} castShadow><boxGeometry args={[0.04, 0.05, 0.02]} /><meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0.025, 0.1, 0]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.005, 0.005, 0.08, 4]} /><meshStandardMaterial color="#111" roughness={0.8} /></mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// BOÎTIER D'URGENCE
// ═══════════════════════════════════════════════════════════════

const EmergencyBox = memo(function EmergencyBox({ position, side }: { position: [number, number, number]; side: 'left' | 'right' }) {
  return (
    <group position={position} rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh castShadow><boxGeometry args={[0.2, 0.16, 0.06]} /><meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.2} /></mesh>
      <mesh position={[0, 0, 0.032]}><boxGeometry args={[0.1, 0.025, 0.004]} /><meshStandardMaterial color="#fff" roughness={0.6} /></mesh>
      <mesh position={[0, 0, 0.032]}><boxGeometry args={[0.025, 0.1, 0.004]} /><meshStandardMaterial color="#fff" roughness={0.6} /></mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// TABLEAU DÉCORATIF
// ═══════════════════════════════════════════════════════════════

const CorridorPainting = memo(function CorridorPainting({ position, side, variant = 0 }: { position: [number, number, number]; side: 'left' | 'right'; variant?: number }) {
  const tex = useMemo(() => createCanvasTexture(128, 96, (ctx, w, h) => {
    const bgs = ['#1a0a2e', '#0a1a2e', '#2a1a1e', '#0a2a1a']
    const accs = ['#8b5cf6', '#3b82f6', '#ef4444', '#22c55e']
    ctx.fillStyle = bgs[variant % 4]; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 3; i++) { ctx.fillStyle = `${accs[variant % 4]}20`; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 15, 0, Math.PI * 2); ctx.fill() }
    ctx.strokeStyle = `${accs[variant % 4]}25`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, 0); ctx.stroke()
  }), [variant])

  return (
    <group position={position} rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh position={[0, 0, -0.004]} castShadow><boxGeometry args={[0.48, 0.38, 0.02]} /><meshStandardMaterial color="#c9a84c" roughness={0.15} metalness={0.6} /></mesh>
      <mesh><boxGeometry args={[0.44, 0.34, 0.018]} /><meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 0, 0.01]}><boxGeometry args={[0.4, 0.3, 0.005]} /><meshStandardMaterial map={tex} /></mesh>
      <mesh position={[0, 0.22, 0.03]}><boxGeometry args={[0.25, 0.015, 0.03]} /><meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.25} /></mesh>
      <spotLight position={[0, 0.25, 0.1]} angle={Math.PI / 5} penumbra={0.7} intensity={0.15} color="#fef3c7" distance={1.2} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PANNEAU MURAL DÉCORATIF
// ═══════════════════════════════════════════════════════════════

const WallPanel = memo(function WallPanel({ position, side, index = 0 }: { position: [number, number, number]; side: 'left' | 'right'; index?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => { if (ref.current) { const m = ref.current.material as THREE.MeshStandardMaterial; m.emissiveIntensity = 0.1 + Math.sin(state.clock.elapsedTime * 0.4 + index * 1.5) * 0.04 } })

  return (
    <group position={position} rotation={[0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <mesh><boxGeometry args={[0.38, 0.22, 0.015]} /><meshStandardMaterial color="#0c0c18" roughness={0.5} metalness={0.4} /></mesh>
      <mesh ref={ref} position={[0, 0, 0.008]}><boxGeometry args={[0.32, 0.16, 0.003]} /><meshStandardMaterial color="#0a0818" emissive={index % 2 === 0 ? '#4c1d95' : '#1e3a5f'} emissiveIntensity={0.1} /></mesh>
      <mesh position={[0.14, 0.08, 0.01]}><sphereGeometry args={[0.005, 4, 4]} /><meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} /></mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PLANTE DE COULOIR
// ═══════════════════════════════════════════════════════════════

const CorridorPlant = memo(function CorridorPlant({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => { if (ref.current) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + position[2]) * 0.012 })

  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]} castShadow><cylinderGeometry args={[0.08, 0.1, 0.06, 8]} /><meshStandardMaterial color="#1e1b2e" roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.07, 0.08, 0.15, 8]} /><meshStandardMaterial color="#2a2440" roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.075, 0.075, 0.015, 8]} /><meshStandardMaterial color="#c9a84c" roughness={0.15} metalness={0.6} /></mesh>
      <group ref={ref}>
        <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.012, 0.016, 0.12, 4]} /><meshStandardMaterial color="#1a2a10" roughness={0.8} /></mesh>
        {[0, 60, 120, 180, 240, 310].map((a, i) => (<mesh key={i} position={[Math.sin((a * Math.PI) / 180) * 0.03, 0.26 + i * 0.015, Math.cos((a * Math.PI) / 180) * 0.03]} rotation={[0.3, (a * Math.PI) / 180, 0.1]} castShadow><boxGeometry args={[0.035, 0.1, 0.008]} /><meshStandardMaterial color={i % 2 === 0 ? '#166534' : '#15803d'} roughness={0.85} /></mesh>))}
      </group>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// CAMÉRA DE SURVEILLANCE
// ═══════════════════════════════════════════════════════════════

const SecurityCamera = memo(function SecurityCamera({ position, rotDir = 1 }: { position: [number, number, number]; rotDir?: number }) {
  const headRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  useFrame((state) => { if (headRef.current) headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.4 * rotDir; if (ledRef.current) { const m = ledRef.current.material as THREE.MeshStandardMaterial; m.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3.5) * 0.2 } })

  return (
    <group position={position}>
      <mesh><boxGeometry args={[0.035, 0.035, 0.035]} /><meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.6} /></mesh>
      <group ref={headRef} position={[0, -0.04, 0]}>
        <mesh rotation={[0.2, 0, 0]}><boxGeometry args={[0.045, 0.03, 0.07]} /><meshStandardMaterial color="#111827" roughness={0.4} metalness={0.6} /></mesh>
        <mesh position={[0, 0, 0.04]} rotation={[0.2, 0, 0]}><cylinderGeometry args={[0.01, 0.012, 0.02, 6]} /><meshStandardMaterial color="#060606" roughness={0.2} metalness={0.9} /></mesh>
        <mesh ref={ledRef} position={[0.018, 0.008, 0.03]}><sphereGeometry args={[0.004, 4, 4]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} /></mesh>
      </group>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PORTE SÉCURISÉE — ENRICHIE
// ═══════════════════════════════════════════════════════════════

const SecureDoor3D = memo(function SecureDoor3D({ door, room, position, rotation, onAccess }: {
  door: any; room: any; position: [number, number, number]; rotation: [number, number, number]; onAccess: () => void
}) {
  const doorRef = useRef<THREE.Group>(null)
  const ledRef = useRef<THREE.Mesh>(null)
  const scanLineRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const doorTex = useDoorTexture()
  const isPlayerRoom = room.number === '404'

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (doorRef.current) {
      const target = door.isOpen ? -Math.PI / 2 : 0
      doorRef.current.rotation.y += (target - doorRef.current.rotation.y) * 0.06
    }

    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      if (door.alarmTriggered) {
        mat.color.setHex(0xef4444); mat.emissive.setHex(0xef4444)
        mat.emissiveIntensity = 0.5 + Math.sin(t * 15) * 0.5
      } else if (door.isOpen) {
        mat.color.setHex(0x22c55e); mat.emissive.setHex(0x22c55e)
        mat.emissiveIntensity = 0.7
      } else {
        mat.color.setHex(0xef4444); mat.emissive.setHex(0xef4444)
        mat.emissiveIntensity = 0.35 + Math.sin(t * 2) * 0.15
      }
    }

    if (scanLineRef.current) scanLineRef.current.position.y = 0.035 * Math.sin(t * 3)

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isPlayerRoom ? 0.2 + Math.sin(t * 1.5) * 0.08 : 0.03
    }
  })

  const accessColor = CARD_COLORS[door.requiredLevel as CardLevel] || '#6b7280'

  return (
    <group position={position} rotation={rotation}>
      {/* ══ CADRE ══ */}
      <mesh position={[0, DOOR_H / 2 + 0.08, 0]} castShadow>
        <boxGeometry args={[DOOR_W + 0.12, 0.06, 0.14]} />
        <meshStandardMaterial color="#0e1018" metalness={0.35} roughness={0.6} />
      </mesh>
      {[-DOOR_W / 2 - 0.04, DOOR_W / 2 + 0.04].map((x, i) => (
        <mesh key={`jamb-${i}`} position={[x, DOOR_H / 2, 0]} castShadow>
          <boxGeometry args={[0.06, DOOR_H + 0.12, 0.14]} />
          <meshStandardMaterial color="#0e1018" metalness={0.35} roughness={0.6} />
        </mesh>
      ))}

      {/* Moulure dorée intérieure du cadre */}
      {[-DOOR_W / 2 - 0.01, DOOR_W / 2 + 0.01].map((x, i) => (
        <mesh key={`gold-j-${i}`} position={[x, DOOR_H / 2, 0.06]}>
          <boxGeometry args={[0.008, DOOR_H, 0.008]} />
          <meshStandardMaterial color="#c9a84c" roughness={0.1} metalness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, DOOR_H + 0.04, 0.06]}>
        <boxGeometry args={[DOOR_W + 0.02, 0.008, 0.008]} />
        <meshStandardMaterial color="#c9a84c" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* Cadre lumineux */}
      <mesh ref={glowRef} position={[0, DOOR_H / 2, 0.04]}>
        <boxGeometry args={[DOOR_W + 0.02, DOOR_H + 0.02, 0.003]} />
        <meshStandardMaterial
          color={isPlayerRoom ? '#0a1a10' : '#0a0a14'}
          emissive={isPlayerRoom ? '#8b5cf6' : accessColor}
          emissiveIntensity={isPlayerRoom ? 0.2 : 0.03}
          transparent opacity={0.6}
        />
      </mesh>

      {/* ══ PANNEAU DE PORTE (animé) ══ */}
      <group ref={doorRef} position={[-DOOR_W / 2, 0, 0]}>
        <mesh position={[DOOR_W / 2, DOOR_H / 2, 0.02]} castShadow onClick={onAccess}>
          <boxGeometry args={[DOOR_W, DOOR_H, 0.05]} />
          <meshStandardMaterial map={doorTex} color={isPlayerRoom ? '#1a1a3e' : '#1f2937'} metalness={0.3} roughness={0.55} />
        </mesh>

        {/* Panneaux encastrés */}
        <mesh position={[DOOR_W / 2, DOOR_H * 0.72, 0.048]}>
          <boxGeometry args={[DOOR_W * 0.7, DOOR_H * 0.28, 0.006]} />
          <meshStandardMaterial color={isPlayerRoom ? '#14142e' : '#181e28'} roughness={0.6} metalness={0.12} />
        </mesh>
        <mesh position={[DOOR_W / 2, DOOR_H * 0.28, 0.048]}>
          <boxGeometry args={[DOOR_W * 0.7, DOOR_H * 0.28, 0.006]} />
          <meshStandardMaterial color={isPlayerRoom ? '#14142e' : '#181e28'} roughness={0.6} metalness={0.12} />
        </mesh>

        {/* Néon vertical */}
        <mesh position={[DOOR_W * 0.88, DOOR_H / 2, 0.05]}>
          <boxGeometry args={[0.004, DOOR_H * 0.78, 0.003]} />
          <meshStandardMaterial
            color={isPlayerRoom ? '#8b5cf6' : accessColor}
            emissive={isPlayerRoom ? '#8b5cf6' : accessColor}
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Poignée */}
        <group position={[DOOR_W * 0.82, DOOR_H * 0.47, 0.05]}>
          <mesh><cylinderGeometry args={[0.018, 0.018, 0.015, 8]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} /></mesh>
          <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.008, 0.008, 0.05, 6]} /><meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} /></mesh>
          <mesh position={[0, -0.015, 0.055]}><boxGeometry args={[0.012, 0.03, 0.015]} /><meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} /></mesh>
        </group>

        {/* Judas */}
        <mesh position={[DOOR_W / 2, DOOR_H * 0.73, 0.05]}>
          <cylinderGeometry args={[0.009, 0.009, 0.012, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[DOOR_W / 2, DOOR_H * 0.73, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.012, 0.002, 6, 10]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.15} />
        </mesh>

        {/* Kick plate */}
        <mesh position={[DOOR_W / 2, 0.06, 0.048]}>
          <boxGeometry args={[DOOR_W * 0.8, 0.12, 0.006]} />
          <meshStandardMaterial color="#4b5563" metalness={0.75} roughness={0.2} />
        </mesh>
      </group>

      {/* ══ LECTEUR DE CARTE ══ */}
      <group position={[DOOR_W / 2 + 0.12, DOOR_H * 0.5, 0.06]}>
        <mesh castShadow>
          <boxGeometry args={[0.065, 0.14, 0.028]} />
          <meshStandardMaterial color="#0a0a14" metalness={0.5} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0, 0.016]}>
          <boxGeometry args={[0.06, 0.135, 0.003]} />
          <meshStandardMaterial color="#121220" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Zone scan */}
        <mesh position={[0, -0.015, 0.018]} onClick={onAccess}>
          <boxGeometry args={[0.05, 0.06, 0.004]} />
          <meshStandardMaterial color="#0f172a" metalness={0.75} roughness={0.2} />
        </mesh>
        {/* Scan line */}
        <mesh ref={scanLineRef} position={[0, 0, 0.02]}>
          <boxGeometry args={[0.045, 0.003, 0.001]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.5} />
        </mesh>
        {/* LED */}
        <mesh ref={ledRef} position={[0, 0.055, 0.018]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
        </mesh>
        {/* Halo LED */}
        <pointLight position={[0, 0.055, 0.04]} intensity={door.isOpen ? 0.1 : 0.05} color={door.isOpen ? '#22c55e' : '#ef4444'} distance={0.5} decay={2} />
        {/* Fente carte */}
        <mesh position={[0, -0.055, 0.018]}>
          <boxGeometry args={[0.038, 0.003, 0.004]} />
          <meshStandardMaterial color="#050508" />
        </mesh>
        {/* Niveau d'accès requis */}
        <mesh position={[0, -0.062, 0.018]}>
          <boxGeometry args={[0.04, 0.008, 0.003]} />
          <meshStandardMaterial color={accessColor} emissive={accessColor} emissiveIntensity={0.2} />
        </mesh>
        {/* Vis */}
        {[[-0.025, 0.06], [0.025, 0.06], [-0.025, -0.06], [0.025, -0.06]].map(([x, y], i) => (
          <mesh key={`scr-${i}`} position={[x, y, 0.018]}><cylinderGeometry args={[0.003, 0.003, 0.003, 4]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} /></mesh>
        ))}
      </group>

      {/* ══ PLAQUE DE NUMÉRO ══ */}
      <group position={[0, DOOR_H * 0.85, 0.07]}>
        <mesh position={[0, 0, -0.002]}>
          <boxGeometry args={[0.22, 0.1, 0.006]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.88} roughness={0.1} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.2, 0.085, 0.008]} />
          <meshStandardMaterial color="#0a0a14" metalness={0.5} roughness={0.35} />
        </mesh>
        <Text position={[0, 0, 0.006]} fontSize={0.05} color="#fef3c7" anchorX="center" anchorY="middle">{room.number}</Text>
      </group>

      {/* ══ INDICATEUR LED OCCUPATION ══ */}
      <mesh position={[-DOOR_W / 2 + 0.08, DOOR_H * 0.85, 0.07]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshStandardMaterial
          color={room.isOccupied ? '#ef4444' : '#22c55e'}
          emissive={room.isOccupied ? '#ef4444' : '#22c55e'}
          emissiveIntensity={0.45}
        />
      </mesh>

      {/* ══ PAILLASSON ══ */}
      <mesh position={[0, 0.005, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial color="#1a1020" roughness={0.96} />
      </mesh>

      {/* ══ CHAMBRE DU JOUEUR ══ */}
      {isPlayerRoom && (
        <>
          <Text position={[0, -0.05, 0.07]} fontSize={0.035} color="#00e0ff" anchorX="center" anchorY="middle">★ VOTRE CHAMBRE</Text>
          <pointLight position={[0, DOOR_H / 2, 0.35]} intensity={0.2} color="#8b5cf6" distance={2.5} decay={2} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.5]}>
            <planeGeometry args={[0.06, 0.06]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.4} transparent opacity={0.4} />
          </mesh>
        </>
      )}

      {/* ══ FUITE DE LUMIÈRE ══ */}
      {room.lightOn && (
        <>
          <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[DOOR_W - 0.05, 0.03]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.2} transparent opacity={0.4} />
          </mesh>
          <pointLight position={[0, 0.1, -0.2]} intensity={0.1} color="#fef3c7" distance={0.8} />
        </>
      )}

      {/* ══ DO NOT DISTURB ══ */}
      {room.doNotDisturb && (
        <mesh position={[0, DOOR_H * 0.6, 0.07]}>
          <boxGeometry args={[0.2, 0.06, 0.005]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
})