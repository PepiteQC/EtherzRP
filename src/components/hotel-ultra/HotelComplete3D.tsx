import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useHotelStore } from './HotelStore'
import { HotelLobby3D } from './HotelLobby3D'
import { HotelElevator3D } from './HotelElevator3D'
import { HotelCorridor3D } from './HotelCorridor3D'

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const FL = 4       // nombre d'étages
const FH = 4       // hauteur par étage
const W = 26       // largeur du bâtiment (agrandi)
const D = 18       // profondeur (agrandi)
const TH = FL * FH // hauteur totale
const WALL_T = 0.35 // épaisseur des murs

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

function useBuildingTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 2000; i++) { const s = 28 + Math.random() * 10; ctx.fillStyle = `rgba(${s},${s + 2},${s + 5},0.03)`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
    for (let y = 0; y < h; y += 48) { ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(0, y, w, 1.5) }
  }, [3, FL]), [])
}

function useParkingTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1a1a1e'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 3000; i++) { const s = 22 + Math.random() * 12; ctx.fillStyle = `rgb(${s},${s},${s + 2})`; ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2) }
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.6; ctx.beginPath(); let x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (Math.random() - 0.5) * 50; y += (Math.random() - 0.5) * 50; ctx.lineTo(x, y) }; ctx.stroke() }
  }, [4, 2]), [])
}

function useWindowTexture() {
  return useMemo(() => createCanvasTexture(64, 96, (ctx, w, h) => {
    ctx.fillStyle = '#1a2535'; ctx.fillRect(0, 0, w, h)
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#1a3050'); grad.addColorStop(0.5, '#1e3a5f'); grad.addColorStop(1, '#152a45')
    ctx.fillStyle = grad; ctx.fillRect(2, 2, w - 4, h - 4)
    ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(3, 3, w * 0.35, h * 0.5)
    ctx.fillStyle = '#1a2535'; ctx.fillRect(w / 2 - 1, 2, 2, h - 4); ctx.fillRect(2, h / 2 - 1, w - 4, 2)
  }), [])
}

function useConcreteTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c0b8a8'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 1500; i++) { const s = 175 + Math.random() * 25; ctx.fillStyle = `rgba(${s},${s - 2},${s - 6},0.03)`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
  }), [])
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export function HotelComplete3D({ position = [0, 0, 0] as [number, number, number] }) {
  const signRef = useRef<THREE.PointLight>(null)
  const buildingTex = useBuildingTexture()
  const parkingTex = useParkingTexture()
  const windowTex = useWindowTexture()
  const concreteTex = useConcreteTexture()

  useFrame((state) => {
    if (signRef.current) signRef.current.intensity = 1.8 + Math.sin(state.clock.elapsedTime * 2) * 0.5
  })

  return (
    <group position={position}>
      {/* ═══════════════════════════════════════
          FONDATION
         ═══════════════════════════════════════ */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[W + 1.5, 0.2, D + 1.5]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* ═══════════════════════════════════════
          COQUE EXTÉRIEURE — MURS
         ═══════════════════════════════════════ */}
      <BuildingShell
        buildingTex={buildingTex}
        windowTex={windowTex}
        concreteTex={concreteTex}
      />

      {/* ═══════════════════════════════════════
          DALLES D'ÉTAGE
         ═══════════════════════════════════════ */}
      {Array.from({ length: FL + 1 }, (_, f) => (
        <mesh key={`slab-${f}`} position={[0, f * FH, 0]} castShadow>
          <boxGeometry args={[W + 0.8, 0.2, D + 0.8]} />
          <meshStandardMaterial color="#1e2024" roughness={0.85} metalness={0.1} />
        </mesh>
      ))}

      {/* Bandes d'étage décoratives (orange) */}
      {Array.from({ length: FL }, (_, f) => (
        <mesh key={`trim-${f}`} position={[0, f * FH + 0.12, D / 2 + 0.2]}>
          <boxGeometry args={[W + 0.5, 0.05, 0.05]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.25} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════
          TOIT
         ═══════════════════════════════════════ */}
      <RoofStructure />

      {/* ═══════════════════════════════════════
          ENSEIGNE
         ═══════════════════════════════════════ */}
      <HotelSignage signRef={signRef} />

      {/* ═══════════════════════════════════════
          LOBBY — DEVANT LE BÂTIMENT
         ═══════════════════════════════════════ */}
      <HotelLobby3D position={[0, 0.2, D / 2 + 8]} />

      {/* ═══════════════════════════════════════
          ASCENSEUR — CÔTÉ DROIT
         ═══════════════════════════════════════ */}
      <HotelElevator3D position={[W / 2 - 2.5, 0.2, D / 2 + 3]} totalFloors={FL} />

      {/* ═══════════════════════════════════════
          CORRIDORS — UN PAR ÉTAGE
         ═══════════════════════════════════════ */}
      {Array.from({ length: FL }, (_, f) => (
        <HotelCorridor3D key={`corr-${f}`} floor={f + 1} position={[0, f * FH + 0.2, 0]} />
      ))}

      {/* ═══════════════════════════════════════
          PARKING
         ═══════════════════════════════════════ */}
      <HotelParking position={[0, 0, D / 2 + 24]} parkingTex={parkingTex} />

      {/* ═══════════════════════════════════════
          AMÉNAGEMENT EXTÉRIEUR
         ═══════════════════════════════════════ */}
      <ExteriorLandscaping />

      {/* ═══════════════════════════════════════
          ÉCLAIRAGE EXTÉRIEUR GLOBAL
         ═══════════════════════════════════════ */}
      <ExteriorLighting />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════
// COQUE DU BÂTIMENT
// ═══════════════════════════════════════════════════════════════

const BuildingShell = memo(function BuildingShell({
  buildingTex, windowTex, concreteTex,
}: {
  buildingTex: THREE.CanvasTexture; windowTex: THREE.CanvasTexture; concreteTex: THREE.CanvasTexture
}) {
  // Lumières fenêtres déterministes
  const windowLights = useMemo(() => {
    const lights: Array<{ floor: number; col: number; lit: boolean; color: string }> = []
    const colors = ['#ffd580', '#ffecb3', '#ffe0b2', '#80deea', '#fef3c7']
    for (let f = 0; f < FL; f++) {
      for (let c = 0; c < 5; c++) {
        const seed = f * 7 + c * 13
        const lit = (f + c) % 3 !== 0
        lights.push({ floor: f, col: c, lit, color: colors[(seed) % colors.length] })
      }
    }
    return lights
  }, [])

  const windowPositions = [-9, -4.5, 0, 4.5, 9]

  return (
    <group>
      {/* ══ MUR ARRIÈRE ══ */}
      <mesh position={[0, TH / 2, -D / 2]} castShadow>
        <boxGeometry args={[W, TH, WALL_T]} />
        <meshStandardMaterial map={buildingTex} color="#1f2937" roughness={0.82} />
      </mesh>

      {/* ══ MURS LATÉRAUX ══ */}
      {[-1, 1].map((side, i) => (
        <mesh key={`side-${i}`} position={[side * W / 2, TH / 2, 0]} castShadow>
          <boxGeometry args={[WALL_T, TH, D]} />
          <meshStandardMaterial map={buildingTex} color="#1a1e28" roughness={0.82} />
        </mesh>
      ))}

      {/* ══ FAÇADE AVANT — entre les fenêtres ══ */}
      {Array.from({ length: FL }, (_, f) => (
        <group key={`facade-${f}`}>
          {/* Bande basse */}
          <mesh position={[0, f * FH + 0.4, D / 2]}>
            <boxGeometry args={[W, 0.8, WALL_T]} />
            <meshStandardMaterial map={buildingTex} color="#1f2937" roughness={0.82} />
          </mesh>
          {/* Bande haute */}
          <mesh position={[0, f * FH + FH - 0.3, D / 2]}>
            <boxGeometry args={[W, 0.6, WALL_T]} />
            <meshStandardMaterial map={buildingTex} color="#1f2937" roughness={0.82} />
          </mesh>
          {/* Pilastres verticaux */}
          {[-W / 2 + 1.5, -6, -1, 4, 9, W / 2 - 1.5].map((x, ci) => (
            <mesh key={`pilaster-${f}-${ci}`} position={[x, f * FH + FH / 2, D / 2]}>
              <boxGeometry args={[1, FH, WALL_T]} />
              <meshStandardMaterial map={buildingTex} color="#1f2937" roughness={0.82} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ══ FAÇADE BÉTON (couche avant) ══ */}
      <mesh position={[0, TH / 2, D / 2 + 0.05]}>
        <boxGeometry args={[W - 2, TH - 1, 0.08]} />
        <meshStandardMaterial map={concreteTex} color="#b8b0a0" roughness={0.6} transparent opacity={0.08} />
      </mesh>

      {/* ══ PILASTRES DÉCORATIFS (nervures verticales) ══ */}
      {[-W / 2 - 0.05, -W / 4, 0, W / 4, W / 2 + 0.05].map((x, i) => (
        <mesh key={`rib-${i}`} position={[x, TH / 2, D / 2 + 0.12]} castShadow>
          <boxGeometry args={[0.3, TH + 0.5, 0.2]} />
          <meshStandardMaterial color="#5a6070" roughness={0.7} metalness={0.1} />
        </mesh>
      ))}

      {/* ══ CORNICHE SUPÉRIEURE ══ */}
      <mesh position={[0, TH - 0.05, D / 2 + 0.2]} castShadow>
        <boxGeometry args={[W + 0.6, 0.3, 0.4]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Liseré doré */}
      <mesh position={[0, TH + 0.12, D / 2 + 0.22]}>
        <boxGeometry args={[W + 0.5, 0.03, 0.03]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.88} roughness={0.1} />
      </mesh>

      {/* ══ FENÊTRES — FAÇADE AVANT (4 étages × 5 colonnes) ══ */}
      {windowLights.map(({ floor, col, lit, color }) => {
        const x = windowPositions[col]
        const y = floor * FH + FH / 2
        return (
          <group key={`win-${floor}-${col}`}>
            {/* Cadre */}
            <mesh position={[x, y, D / 2 + 0.22]}>
              <boxGeometry args={[3, FH * 0.42, 0.03]} />
              <meshStandardMaterial color="#1a2535" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Vitre */}
            <mesh position={[x, y, D / 2 + 0.24]}>
              <boxGeometry args={[2.8, FH * 0.38, 0.02]} />
              <meshStandardMaterial
                map={windowTex}
                color={lit ? color : '#0a0e1a'}
                emissive={lit ? color : '#000000'}
                emissiveIntensity={lit ? 0.45 : 0}
                transparent opacity={0.8}
                metalness={lit ? 0.15 : 0.8}
                roughness={0.1}
              />
            </mesh>
            {/* Rebord de fenêtre */}
            <mesh position={[x, y - FH * 0.21, D / 2 + 0.3]}>
              <boxGeometry args={[3.1, 0.06, 0.15]} />
              <meshStandardMaterial color="#6a7080" roughness={0.5} metalness={0.15} />
            </mesh>
            {/* Lumière intérieure */}
            {lit && <pointLight position={[x, y, D / 2 - 0.3]} intensity={0.3} color={color} distance={4} decay={2} />}
          </group>
        )
      })}

      {/* ══ FENÊTRES LATÉRALES ══ */}
      {[-1, 1].map((side) =>
        Array.from({ length: FL }, (_, f) =>
          [-5, -1, 3, 7].map((z, i) => {
            const lit = (f + i + (side === 1 ? 1 : 0)) % 3 !== 0
            return (
              <mesh key={`sidewin-${side}-${f}-${i}`} position={[side * (W / 2 + 0.02), f * FH + FH / 2, z]} rotation={[0, side * Math.PI / 2, 0]}>
                <boxGeometry args={[2, FH * 0.35, 0.04]} />
                <meshStandardMaterial
                  color={lit ? '#fef3c7' : '#0a0e1a'}
                  emissive={lit ? '#fef3c7' : '#000'}
                  emissiveIntensity={lit ? 0.3 : 0}
                  transparent opacity={0.6}
                  metalness={0.7} roughness={0.1}
                />
              </mesh>
            )
          })
        )
      )}

      {/* ══ FENÊTRES ARRIÈRE ══ */}
      {Array.from({ length: FL }, (_, f) =>
        [-7, -2, 3, 8].map((x, i) => (
          <mesh key={`backwin-${f}-${i}`} position={[x, f * FH + FH / 2, -D / 2 - 0.02]}>
            <boxGeometry args={[2.2, FH * 0.3, 0.04]} />
            <meshStandardMaterial color="#0a0e1a" transparent opacity={0.5} metalness={0.7} roughness={0.1} />
          </mesh>
        ))
      )}

      {/* ══ PILASTRES LATÉRAUX ROUGES ══ */}
      {[-W / 2 - 0.08, W / 2 + 0.08].map((x, i) => (
        <mesh key={`red-pilaster-${i}`} position={[x, TH / 2, 0]} castShadow>
          <boxGeometry args={[0.25, TH + 0.3, D + 0.1]} />
          <meshStandardMaterial color="#6b2018" roughness={0.7} metalness={0.08} />
        </mesh>
      ))}
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// STRUCTURE DU TOIT
// ═══════════════════════════════════════════════════════════════

const RoofStructure = memo(function RoofStructure() {
  return (
    <group>
      {/* Dalle de toit */}
      <mesh position={[0, TH + 0.15, 0]} castShadow>
        <boxGeometry args={[W + 1.5, 0.3, D + 1.5]} />
        <meshStandardMaterial color="#0f1419" roughness={0.75} metalness={0.12} />
      </mesh>

      {/* Corniche dorée du toit */}
      <mesh position={[0, TH + 0.32, 0]}>
        <boxGeometry args={[W + 1.3, 0.03, D + 1.3]} />
        <meshStandardMaterial color="#c9a84c" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* Garde-corps toit */}
      {[
        [0, TH + 0.55, -D / 2 - 0.5, W + 1.3, 0.5, 0.08],
        [0, TH + 0.55, D / 2 + 0.5, W + 1.3, 0.5, 0.08],
        [-W / 2 - 0.5, TH + 0.55, 0, 0.08, 0.5, D + 1],
        [W / 2 + 0.5, TH + 0.55, 0, 0.08, 0.5, D + 1],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`railing-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Unités AC */}
      {[-6, 0, 6].map((x, i) => (
        <group key={`ac-${i}`} position={[x, TH + 0.7, -4]}>
          <mesh castShadow>
            <boxGeometry args={[3.2, 1.2, 2.2]} />
            <meshStandardMaterial color="#4a4a55" metalness={0.4} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.12, 10]} />
            <meshStandardMaterial color="#3a3a45" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Grille latérale */}
          <mesh position={[0, 0, 1.12]}>
            <boxGeometry args={[3, 1, 0.02]} />
            <meshStandardMaterial color="#555" metalness={0.4} roughness={0.5} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Antenne */}
      <group position={[W / 2 - 3, TH + 2.5, -D / 2 + 3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.08, 4.5, 6]} />
          <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -1.8, 0]}>
          <boxGeometry args={[0.35, 0.35, 0.35]} />
          <meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* LED clignotante */}
        <AntennaLight position={[0, 2.3, 0]} />
      </group>

      {/* Conduits de ventilation */}
      {[-3, 4].map((x, i) => (
        <mesh key={`duct-${i}`} position={[x, TH + 0.5, 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.8, 8]} />
          <meshStandardMaterial color="#555" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
})

// LED d'antenne clignotante
const AntennaLight = memo(function AntennaLight({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = Math.sin(state.clock.elapsedTime * 3) > 0.85 ? 1.5 : 0.08
    }
  })
  return (
    <group position={position}>
      <mesh ref={ref}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.08} /></mesh>
      <pointLight position={[0, 0, 0]} color="#ff0000" intensity={0.2} distance={6} decay={2} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// ENSEIGNE HÔTEL
// ═══════════════════════════════════════════════════════════════

const HotelSignage = memo(function HotelSignage({ signRef }: { signRef: React.RefObject<THREE.PointLight | null> }) {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.25 + Math.sin(state.clock.elapsedTime * 1.5) * 0.06
    }
  })

  return (
    <group position={[0, TH + 1.2, D / 2 + 0.2]}>
      {/* Panneau fond */}
      <mesh castShadow>
        <boxGeometry args={[12, 1.8, 0.18]} />
        <meshStandardMaterial color="#0f1419" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Bordure dorée */}
      <mesh position={[0, 0, 0.095]}>
        <boxGeometry args={[11.8, 1.6, 0.005]} />
        <meshStandardMaterial color="#c9a84c" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* Surface texto */}
      <mesh ref={glowRef} position={[0, 0, 0.1]}>
        <boxGeometry args={[11.5, 1.3, 0.008]} />
        <meshStandardMaterial color="#0a0e14" emissive="#ff4422" emissiveIntensity={0.25} />
      </mesh>

      {/* Texte */}
      <Text position={[0, 0.15, 0.12]} fontSize={0.65} color="#f97316" anchorX="center" anchorY="middle">
        HÔTEL ETHERWORLD
      </Text>

      {/* Étoiles */}
      <Text position={[0, -0.35, 0.12]} fontSize={0.2} color="#fef3c7" anchorX="center" anchorY="middle">
        ★ ★ ★ ★ ★
      </Text>

      {/* Support structural */}
      {[-4.5, 4.5].map((x, i) => (
        <mesh key={`sign-sup-${i}`} position={[x, -1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 4]} />
          <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Lumières */}
      <pointLight ref={signRef} position={[0, 0, 1.5]} color="#f97316" intensity={1.8} distance={14} decay={2} />
      <spotLight position={[0, 1.2, 0.5]} angle={Math.PI / 4} penumbra={0.5} intensity={0.5} color="#ff6644" distance={8} />

      {/* Éclairage bas du panneau */}
      {[-4, -2, 0, 2, 4].map((x, i) => (
        <mesh key={`sign-light-${i}`} position={[x, -0.92, 0.12]}>
          <boxGeometry args={[0.3, 0.02, 0.04]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PARKING
// ═══════════════════════════════════════════════════════════════

const HotelParking = memo(function HotelParking({ position, parkingTex }: { position: [number, number, number]; parkingTex: THREE.CanvasTexture }) {
  const cars = useMemo(() => [
    { x: -9, z: 4, ry: 0, color: '#c0c0c0' },
    { x: -4.5, z: 4.3, ry: 0.04, color: '#1a1a1a' },
    { x: 0, z: 4, ry: 0, color: '#8b0000' },
    { x: 4.5, z: 4.2, ry: -0.03, color: '#1e40af' },
    { x: 9, z: 3.8, ry: 0.02, color: '#1a5c2a' },
    { x: -7, z: 9, ry: 0, color: '#4a4a5a' },
  ], [])

  return (
    <group position={position}>
      {/* Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[32, 14]} />
        <meshStandardMaterial map={parkingTex} color="#1a1a1e" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Lignes de stationnement */}
      {[-12, -7.5, -3, 1.5, 6, 10.5].map((x, i) => (
        <mesh key={`pl-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 2]}>
          <planeGeometry args={[0.08, 5.5]} />
          <meshStandardMaterial color="#fbbf24" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Numéros de place */}
      {[-10, -5.5, -1, 3.5, 8].map((x, i) => (
        <Text key={`pn-${i}`} position={[x, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.4} color="rgba(255,255,255,0.12)">
          P{i + 1}
        </Text>
      ))}

      {/* Place handicapée */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-14, 0.015, 2]}>
        <planeGeometry args={[3.5, 5.5]} />
        <meshStandardMaterial color="#2244aa" transparent opacity={0.12} roughness={0.9} />
      </mesh>

      {/* Butoirs */}
      {[-12, -7.5, -3, 1.5, 6, 10.5].map((x, i) => (
        <mesh key={`bump-${i}`} position={[x + 2.2, 0.05, -0.5]} castShadow>
          <boxGeometry args={[2.2, 0.08, 0.1]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.6} />
        </mesh>
      ))}

      {/* Lampadaires */}
      {[-14, 14].map((x, i) => (
        <ParkingLamp key={`plamp-${i}`} position={[x, 0, 6]} />
      ))}

      {/* Bollards */}
      {[-15, -14, 14, 15].map((x, i) => (
        <group key={`bollard-${i}`} position={[x, 0, -4]}>
          <mesh castShadow><cylinderGeometry args={[0.06, 0.06, 0.7, 8]} /><meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.3} /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.065, 0.065, 0.06, 8]} /><meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.5} /></mesh>
        </group>
      ))}

      {/* Voitures */}
      {cars.map((car, i) => (
        <ParkingCar key={`car-${i}`} position={[car.x, 0, car.z]} rotation={car.ry} color={car.color} />
      ))}
    </group>
  )
})

// Lampadaire de parking
const ParkingLamp = memo(function ParkingLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 3.5, 0]} castShadow><cylinderGeometry args={[0.06, 0.1, 7, 8]} /><meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.35} /></mesh>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.3, 0.08, 0.3]} /><meshStandardMaterial color="#555" metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[0, 7.1, -0.4]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.3, 0.12, 1.2]} /><meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0, 7.0, -0.4]}><boxGeometry args={[0.26, 0.02, 0.9]} /><meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.4} /></mesh>
      <pointLight position={[0, 6.8, -0.4]} color="#fff0d0" intensity={0.6} distance={15} decay={2} />
    </group>
  )
})

// Voiture de parking
const ParkingCar = memo(function ParkingCar({ position, rotation = 0, color }: { position: [number, number, number]; rotation?: number; color: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.8, 0.7, 4]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.88, -0.15]} castShadow>
        <boxGeometry args={[1.65, 0.5, 2.3]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.35} />
      </mesh>
      {/* Pare-brise */}
      <mesh position={[0, 0.85, 0.85]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[1.45, 0.5, 0.03]} />
        <meshStandardMaterial color="#1a2a3a" transparent opacity={0.5} metalness={0.8} roughness={0.05} />
      </mesh>
      {/* Phares */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.4, 2.02]}>
          <boxGeometry args={[0.28, 0.1, 0.02]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.04} roughness={0.1} metalness={0.5} />
        </mesh>
      ))}
      {/* Feux arrière */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={`tail-${i}`} position={[x, 0.4, -2.02]}>
          <boxGeometry args={[0.22, 0.08, 0.02]} />
          <meshStandardMaterial color="#cc2222" emissive="#cc2222" emissiveIntensity={0.04} />
        </mesh>
      ))}
      {/* Roues */}
      {[[-0.92, 1.1], [0.92, 1.1], [-0.92, -1.1], [0.92, -1.1]].map(([x, z], i) => (
        <group key={`wheel-${i}`} position={[x, 0.25, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.25, 0.25, 0.15, 8]} /><meshStandardMaterial color="#1a1a1a" roughness={0.85} /></mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 0.16, 6]} /><meshStandardMaterial color="#888" metalness={0.7} roughness={0.2} /></mesh>
        </group>
      ))}
      {/* Rétroviseurs */}
      {[-0.95, 0.95].map((x, i) => (
        <mesh key={`mirror-${i}`} position={[x, 0.82, 0.6]}>
          <boxGeometry args={[0.1, 0.06, 0.05]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// AMÉNAGEMENT EXTÉRIEUR
// ═══════════════════════════════════════════════════════════════

const ExteriorLandscaping = memo(function ExteriorLandscaping() {
  return (
    <group>
      {/* ══ TROTTOIR AVANT ══ */}
      <mesh position={[0, 0.08, D / 2 + 3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W + 4, 6]} />
        <meshStandardMaterial color="#8a8a9a" roughness={0.7} />
      </mesh>
      {/* Bordure trottoir */}
      <mesh position={[0, 0.1, D / 2 + 6.1]}>
        <boxGeometry args={[W + 4, 0.2, 0.15]} />
        <meshStandardMaterial color="#6a6a7a" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* ══ DRAPEAUX ══ */}
      {[-9, -6, 6, 9].map((x, i) => (
        <group key={`flag-${i}`} position={[x, 0.2, D / 2 + 8]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.025, 5, 6]} />
            <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.22, 2.3, 0]}>
            <boxGeometry args={[0.45, 0.3, 0.008]} />
            <meshStandardMaterial color={['#cc0000', '#0044aa', '#ffffff', '#cc0000'][i]} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ══ PLANTES D'ENTRÉE ══ */}
      {[-5, 5].map((x, i) => (
        <group key={`entry-plant-${i}`} position={[x, 0.2, D / 2 + 5]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.3, 0.5, 8]} />
            <meshStandardMaterial color="#4a4a5a" roughness={0.5} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.37, 0.37, 0.025, 8]} />
            <meshStandardMaterial color="#c9a84c" roughness={0.15} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <sphereGeometry args={[0.45, 6, 6]} />
            <meshStandardMaterial color="#2d6a1e" roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* ══ BANC EXTÉRIEUR ══ */}
      <group position={[-W / 2 - 2, 0.2, D / 2 + 4]}>
        {[-0.1, 0, 0.1].map((z, i) => (
          <mesh key={i} position={[0, 0.4, z]} castShadow>
            <boxGeometry args={[1.5, 0.04, 0.1]} />
            <meshStandardMaterial color="#6b4423" roughness={0.7} />
          </mesh>
        ))}
        {[-0.6, 0.6].map((x, i) => (
          <mesh key={`leg-${i}`} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.05, 0.4, 0.3]} />
            <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ══ POUBELLE EXTÉRIEURE ══ */}
      <group position={[W / 2 + 2, 0.2, D / 2 + 5]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.22, 0.6, 8]} />
          <meshStandardMaterial color="#333" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.22, 0.2, 0.04, 8]} />
          <meshStandardMaterial color="#444" roughness={0.5} metalness={0.4} />
        </mesh>
      </group>

      {/* ══ AUVENT D'ENTRÉE ══ */}
      <mesh position={[0, FH - 0.3, D / 2 + 6]} castShadow>
        <boxGeometry args={[8, 0.12, 5]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, FH - 0.38, D / 2 + 6]}>
        <boxGeometry args={[7.5, 0.02, 4.5]} />
        <meshStandardMaterial color="#fff8e0" emissive="#fff8e0" emissiveIntensity={0.1} />
      </mesh>
      {[-3.5, 3.5].map((x, i) => (
        <mesh key={`canopy-col-${i}`} position={[x, FH / 2 - 0.2, D / 2 + 8]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, FH - 0.4, 8]} />
          <meshStandardMaterial color="#8a8a9a" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Marches d'entrée */}
      {[0, 1, 2].map((s, i) => (
        <mesh key={`step-${i}`} position={[0, 0.1 + i * 0.06, D / 2 + 8 + i * 0.35]} castShadow>
          <boxGeometry args={[5.5, 0.06, 0.35]} />
          <meshStandardMaterial color="#8a8078" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}

      {/* Tapis d'entrée */}
      <mesh position={[0, 0.22, D / 2 + 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 2]} />
        <meshStandardMaterial color="#1a1010" roughness={0.95} />
      </mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// ÉCLAIRAGE EXTÉRIEUR
// ═══════════════════════════════════════════════════════════════

const ExteriorLighting = memo(function ExteriorLighting() {
  return (
    <group>
      {/* Spots sur la façade */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <spotLight
          key={`facade-spot-${i}`}
          position={[x, 0.5, D / 2 + 2]}
          target-position={[x, TH / 2, D / 2]}
          angle={Math.PI / 6}
          penumbra={0.5}
          intensity={0.4}
          color="#fef3c7"
          distance={TH + 2}
        />
      ))}

      {/* Éclairage de l'entrée */}
      <spotLight
        position={[0, FH - 0.5, D / 2 + 6]}
        angle={Math.PI / 3}
        penumbra={0.8}
        intensity={1.2}
        color="#fff8e0"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      {[-3, 3].map((x, i) => (
        <pointLight key={`entry-pl-${i}`} position={[x, 2, D / 2 + 6]} intensity={0.4} color="#fef3c7" distance={6} decay={2} />
      ))}

      {/* Éclairage d'accent du sol */}
      {[-10, -5, 0, 5, 10].map((x, i) => (
        <pointLight key={`ground-pl-${i}`} position={[x, 0.1, D / 2 + 4]} intensity={0.15} color="#fef3c7" distance={4} decay={2} />
      ))}
    </group>
  )
})