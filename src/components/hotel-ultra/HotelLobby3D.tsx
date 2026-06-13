import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useHotelStore } from './HotelStore'

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const LW = 22  // largeur lobby (agrandi)
const LD = 16  // profondeur lobby (agrandi)
const LH = 5.5 // hauteur lobby (agrandi)

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

function useMarbleFloorTexture() {
  return useMemo(() => createCanvasTexture(512, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#d4c8b0'); grad.addColorStop(0.3, '#c8bca4')
    grad.addColorStop(0.6, '#d0c4ac'); grad.addColorStop(1, '#c4b898')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
    // Veines
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = `rgba(180,165,140,${0.08 + Math.random() * 0.06})`
      ctx.lineWidth = 0.8; ctx.beginPath()
      let x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y)
      for (let j = 0; j < 5; j++) { x += (Math.random() - 0.5) * 80; y += (Math.random() - 0.5) * 80; ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, x, y) }
      ctx.stroke()
    }
    // Grille carrelage
    const ts = w / 4
    ctx.strokeStyle = 'rgba(160,140,110,0.18)'; ctx.lineWidth = 1.5
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * ts, 0); ctx.lineTo(i * ts, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * ts); ctx.lineTo(w, i * ts); ctx.stroke() }
    // Reflets
    for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; ctx.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 2 + Math.random() * 5) }
  }, [5.5, 4]), [])
}

function useWallTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d4c8a8'; ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 1200; i++) { const s = 200 + Math.random() * 18; ctx.fillStyle = `rgba(${s},${s - 3},${s - 10},0.03)`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2) }
    // Moulures horizontales subtiles
    ctx.fillStyle = 'rgba(180,160,130,0.06)'
    ctx.fillRect(0, h * 0.35, w, 2); ctx.fillRect(0, h * 0.65, w, 2)
  }, [2, 2]), [])
}

function useCarpetTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#14101a'; ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#1e1828'; ctx.lineWidth = 3; ctx.strokeRect(8, 8, w - 16, h - 16)
    ctx.strokeStyle = '#2a2038'; ctx.lineWidth = 1.5; ctx.strokeRect(14, 14, w - 28, h - 28)
    // Motifs
    for (let y = 20; y < h - 20; y += 30) {
      ctx.fillStyle = 'rgba(40,28,60,0.3)'; ctx.save(); ctx.translate(w / 2, y + 15); ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.restore()
    }
    ctx.strokeStyle = 'rgba(180,140,40,0.12)'; ctx.lineWidth = 0.6
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(w / 2, h / 2, 15 + i * 12, 0, Math.PI * 2); ctx.stroke() }
  }, [2, 1.5]), [])
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export function HotelLobby3D({ position = [0, 0, 0] as [number, number, number] }) {
  const { lobby, ringBell, playerCard } = useHotelStore()
  const chandelierRef = useRef<THREE.Group>(null)
  const bellRef = useRef<THREE.Mesh>(null)
  const fountainRef = useRef<THREE.Mesh>(null)

  const floorTex = useMarbleFloorTexture()
  const wallTex = useWallTexture()
  const carpetTex = useCarpetTexture()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (chandelierRef.current) chandelierRef.current.rotation.y = Math.sin(t * 0.15) * 0.03
    if (bellRef.current && lobby.receptionBellRung) bellRef.current.position.y = 1.12 + Math.sin(t * 30) * 0.02
    if (fountainRef.current && lobby.fountainOn) {
      const mat = fountainRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.45 + Math.sin(t * 2) * 0.05
    }
  })

  return (
    <group position={position}>
      {/* ═══════════════════════════════════════
          SOL MARBRE
         ═══════════════════════════════════════ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[LW, LD]} />
        <meshStandardMaterial map={floorTex} color="#c8b89a" roughness={0.1} metalness={0.15} />
      </mesh>

      {/* Carrelage en damier */}
      {Array.from({ length: Math.floor(LW / 2) }, (_, i) =>
        Array.from({ length: Math.floor(LD / 2) }, (_, j) => (
          <mesh key={`mt-${i}-${j}`} rotation={[-Math.PI / 2, 0, 0]} position={[-LW / 2 + 1 + i * 2, 0.015, -LD / 2 + 1 + j * 2]}>
            <planeGeometry args={[1.95, 1.95]} />
            <meshStandardMaterial color={(i + j) % 2 === 0 ? '#d4c4a4' : '#baa888'} roughness={0.08} metalness={0.12} />
          </mesh>
        ))
      )}

      {/* Médaillon central doré */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.017, 1]}>
        <circleGeometry args={[2.5, 24]} />
        <meshStandardMaterial color="#b8a878" roughness={0.1} metalness={0.25} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 1]}>
        <ringGeometry args={[2.3, 2.5, 24]} />
        <meshStandardMaterial color="#c9a84c" roughness={0.1} metalness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.019, 1]}>
        <ringGeometry args={[1.8, 1.85, 24]} />
        <meshStandardMaterial color="#c9a84c" roughness={0.15} metalness={0.6} />
      </mesh>

      {/* Bande réfléchissante centrale */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]}>
        <planeGeometry args={[0.8, LD - 2]} />
        <meshStandardMaterial color="#b0a080" roughness={0.05} metalness={0.35} />
      </mesh>

      {/* ═══════════════════════════════════════
          PLAFOND
         ═══════════════════════════════════════ */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, LH, 0]}>
        <planeGeometry args={[LW, LD]} />
        <meshStandardMaterial color="#f2ece0" roughness={0.7} />
      </mesh>

      {/* Caissons de plafond */}
      {Array.from({ length: 4 }).map((_, i) =>
        Array.from({ length: 3 }).map((_, j) => (
          <mesh key={`ceil-panel-${i}-${j}`} position={[-LW / 2 + 3 + i * 5.5, LH - 0.02, -LD / 2 + 3 + j * 5]}>
            <boxGeometry args={[4.8, 0.03, 4.3]} />
            <meshStandardMaterial color={`rgb(${238 + Math.random() * 5},${232 + Math.random() * 5},${220 + Math.random() * 5})`} roughness={0.7} />
          </mesh>
        ))
      )}

      {/* Corniche dorée périphérique */}
      {[
        [0, LH - 0.08, -LD / 2 + 0.15, LW, 0.15, 0.12],
        [0, LH - 0.08, LD / 2 - 0.15, LW, 0.15, 0.12],
        [-LW / 2 + 0.15, LH - 0.08, 0, 0.12, 0.15, LD],
        [LW / 2 - 0.15, LH - 0.08, 0, 0.12, 0.15, LD],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`crown-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.88} roughness={0.1} />
        </mesh>
      ))}

      {/* Corniche secondaire (bois sombre) */}
      {[
        [0, LH - 0.2, -LD / 2 + 0.18, LW - 0.3, 0.08, 0.08],
        [0, LH - 0.2, LD / 2 - 0.18, LW - 0.3, 0.08, 0.08],
        [-LW / 2 + 0.18, LH - 0.2, 0, 0.08, 0.08, LD - 0.3],
        [LW / 2 - 0.18, LH - 0.2, 0, 0.08, 0.08, LD - 0.3],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`crown2-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#3a2a1a" roughness={0.5} metalness={0.1} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════
          MURS
         ═══════════════════════════════════════ */}
      {/* Mur arrière */}
      <mesh position={[0, LH / 2, -LD / 2]}>
        <boxGeometry args={[LW, LH, 0.25]} />
        <meshStandardMaterial map={wallTex} color="#d4c8a8" roughness={0.3} />
      </mesh>
      {/* Mur gauche */}
      <mesh position={[-LW / 2, LH / 2, 0]}>
        <boxGeometry args={[0.25, LH, LD]} />
        <meshStandardMaterial map={wallTex} color="#d4c8a8" roughness={0.3} />
      </mesh>
      {/* Mur droit */}
      <mesh position={[LW / 2, LH / 2, 0]}>
        <boxGeometry args={[0.25, LH, LD]} />
        <meshStandardMaterial map={wallTex} color="#d4c8a8" roughness={0.3} />
      </mesh>
      {/* Mur avant — avec ouverture vitrée */}
      <mesh position={[-7.5, LH / 2, LD / 2]}>
        <boxGeometry args={[7, LH, 0.25]} />
        <meshStandardMaterial map={wallTex} color="#d4c8a8" roughness={0.3} />
      </mesh>
      <mesh position={[7.5, LH / 2, LD / 2]}>
        <boxGeometry args={[7, LH, 0.25]} />
        <meshStandardMaterial map={wallTex} color="#d4c8a8" roughness={0.3} />
      </mesh>
      <mesh position={[0, LH - 0.5, LD / 2]}>
        <boxGeometry args={[8, 1, 0.25]} />
        <meshStandardMaterial map={wallTex} color="#d4c8a8" roughness={0.3} />
      </mesh>

      {/* Façade vitrée */}
      <mesh position={[0, LH * 0.38, LD / 2 + 0.05]}>
        <boxGeometry args={[8, LH * 0.76, 0.06]} />
        <meshPhysicalMaterial color="#7dd3fc" transmission={0.7} thickness={0.02} roughness={0.03} transparent opacity={0.2} metalness={0.1} ior={1.5} />
      </mesh>

      {/* Plinthes murales */}
      {[
        [0, 0.06, -LD / 2 + 0.15, LW - 0.3, 0.12, 0.06],
        [-LW / 2 + 0.15, 0.06, 0, 0.06, 0.12, LD - 0.3],
        [LW / 2 - 0.15, 0.06, 0, 0.06, 0.12, LD - 0.3],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`baseboard-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#2a1a0e" roughness={0.5} metalness={0.1} />
        </mesh>
      ))}

      {/* Cimaise murale (ligne dorée à mi-hauteur) */}
      {[
        [0, LH * 0.45, -LD / 2 + 0.15, LW - 0.3, 0.03, 0.02],
        [-LW / 2 + 0.15, LH * 0.45, 0, 0.02, 0.03, LD - 0.3],
        [LW / 2 - 0.15, LH * 0.45, 0, 0.02, 0.03, LD - 0.3],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`rail-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#c9a84c" roughness={0.15} metalness={0.7} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════
          COLONNES — 8 colonnes marbre
         ═══════════════════════════════════════ */}
      {[[-8, -4], [8, -4], [-8, 1], [8, 1], [-8, 5], [8, 5], [-4, -4], [4, -4]].map(([cx, cz], i) => (
        <Column key={`col-${i}`} position={[cx, 0, cz]} height={LH} />
      ))}

      {/* ═══════════════════════════════════════
          LUSTRE PRINCIPAL
         ═══════════════════════════════════════ */}
      <Chandelier ref={chandelierRef} position={[0, LH, 1]} />

      {/* Lustres secondaires */}
      <SmallChandelier position={[-6, LH, -3]} />
      <SmallChandelier position={[6, LH, -3]} />

      {/* ═══════════════════════════════════════
          RÉCEPTION
         ═══════════════════════════════════════ */}
      <ReceptionDesk position={[-1, 0, -5]} bellRef={bellRef} onRingBell={ringBell} />

      {/* ═══════════════════════════════════════
          FONTAINE CENTRALE
         ═══════════════════════════════════════ */}
      {lobby.fountainOn && <LobbyFountain position={[0, 0, 1]} fountainRef={fountainRef} />}

      {/* ═══════════════════════════════════════
          ZONE DE REPOS
         ═══════════════════════════════════════ */}
      <SeatingArea position={[7, 0, 1.5]} />

      {/* Tapis persan sous la zone repos */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, 0.012, 1.5]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial map={carpetTex} color="#14101a" roughness={0.95} />
      </mesh>

      {/* ═══════════════════════════════════════
          PLANTES DÉCORATIVES
         ═══════════════════════════════════════ */}
      {[[-9.5, -5.5], [9.5, -5.5], [-9.5, 6], [9.5, 6], [-4, -5.5], [4, -5.5]].map(([x, z], i) => (
        <LobbyPlant key={`plant-${i}`} position={[x, 0, z]} variant={i} />
      ))}

      {/* ═══════════════════════════════════════
          APPLIQUES MURALES
         ═══════════════════════════════════════ */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <WallSconce key={`sconce-front-${i}`} position={[x, LH * 0.6, LD / 2 - 0.2]} />
      ))}
      {[-4, 0, 4].map((x, i) => (
        <WallSconce key={`sconce-back-${i}`} position={[x, LH * 0.6, -LD / 2 + 0.2]} rotation={[0, Math.PI, 0]} />
      ))}
      {[-4, 0, 4].map((z, i) => (
        <group key={`sconce-sides-${i}`}>
          <WallSconce position={[-LW / 2 + 0.2, LH * 0.6, z]} rotation={[0, Math.PI / 2, 0]} />
          <WallSconce position={[LW / 2 - 0.2, LH * 0.6, z]} rotation={[0, -Math.PI / 2, 0]} />
        </group>
      ))}

      {/* ═══════════════════════════════════════
          TABLEAUX MURAUX
         ═══════════════════════════════════════ */}
      {[[-6, -LD / 2 + 0.18], [6, -LD / 2 + 0.18]].map(([x, z], i) => (
        <WallPainting key={`painting-${i}`} position={[x, LH * 0.5, z]} variant={i} />
      ))}
      <WallPainting position={[-LW / 2 + 0.18, LH * 0.5, -2]} rotation={[0, Math.PI / 2, 0]} variant={2} />
      <WallPainting position={[LW / 2 - 0.18, LH * 0.5, 3]} rotation={[0, -Math.PI / 2, 0]} variant={3} />

      {/* ═══════════════════════════════════════
          AUVENT D'ENTRÉE
         ═══════════════════════════════════════ */}
      <EntranceCanopy position={[0, 0, LD / 2]} height={LH} />

      {/* ═══════════════════════════════════════
          PANNEAU DE BIENVENUE
         ═══════════════════════════════════════ */}
      <WelcomeSign position={[0, LH - 0.6, -LD / 2 + 0.2]} />

      {/* ═══════════════════════════════════════
          ZONE ASCENSEUR
         ═══════════════════════════════════════ */}
      <ElevatorArea position={[-9, 0, -2]} />

      {/* ═══════════════════════════════════════
          CONCIERGERIE / BAGAGES
         ═══════════════════════════════════════ */}
      <BaggageArea position={[-7, 0, 5]} />

      {/* ═══════════════════════════════════════
          ÉCLAIRAGE
         ═══════════════════════════════════════ */}
      {lobby.lightsOn && (
        <>
          <ambientLight intensity={0.2} color="#fef3c7" />
          <pointLight position={[-6, LH * 0.7, -3]} intensity={0.8} color="#ffeedd" distance={12} decay={2} />
          <pointLight position={[6, LH * 0.7, -3]} intensity={0.8} color="#ffeedd" distance={12} decay={2} />
          <pointLight position={[0, LH * 0.7, 5]} intensity={0.6} color="#ffeedd" distance={10} decay={2} />
          <hemisphereLight color="#fef3c7" groundColor="#2a1a0e" intensity={0.15} />
          {/* Spots d'accent sur les colonnes */}
          {[[-8, -4], [8, -4], [-8, 5], [8, 5]].map(([x, z], i) => (
            <spotLight key={`spot-${i}`} position={[x, LH - 0.5, z]} angle={Math.PI / 6} penumbra={0.8} intensity={0.3} color="#fef3c7" distance={6} />
          ))}
        </>
      )}

      {/* Éclairage de secours */}
      {lobby.emergencyLightsOn && (
        <>
          {[-8, 0, 8].map((x, i) => (
            <pointLight key={`emerg-${i}`} position={[x, LH - 0.3, 0]} intensity={0.5} color="#22c55e" distance={8} decay={2} />
          ))}
        </>
      )}

      {/* Alarme incendie (lumière rouge clignotante) */}
      {lobby.fireAlarmActive && <FireAlarmLights />}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════
// COLONNE MARBRE
// ═══════════════════════════════════════════════════════════════

const Column = memo(function Column({ position, height }: { position: [number, number, number]; height: number }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.55, 0.24, 0.55]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.85} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.26, 0]} castShadow>
        <boxGeometry args={[0.48, 0.04, 0.48]} />
        <meshStandardMaterial color="#b8a060" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Fût */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, height - 0.6, 12]} />
        <meshStandardMaterial color="#d4c8b0" roughness={0.35} metalness={0.12} />
      </mesh>
      {/* Cannelures */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.24, height / 2, Math.sin(a) * 0.24]}>
            <boxGeometry args={[0.015, height - 0.8, 0.012]} />
            <meshStandardMaterial color="#c4b8a0" roughness={0.4} />
          </mesh>
        )
      })}
      {/* Chapiteau */}
      <mesh position={[0, height - 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.12, 12]} />
        <meshStandardMaterial color="#d4c8b0" roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, height - 0.06, 0]}>
        <boxGeometry args={[0.55, 0.08, 0.55]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.85} roughness={0.1} />
      </mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// LUSTRE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const Chandelier = memo(function Chandelier({ position }: { position: [number, number, number]; ref?: any }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.03
  })

  return (
    <group ref={ref} position={position}>
      {/* Chaîne */}
      <mesh><cylinderGeometry args={[0.03, 0.03, 0.8, 6]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} /></mesh>
      {/* Rosace plafond */}
      <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.35, 0.35, 0.04, 12]} /><meshStandardMaterial color="#c9a84c" metalness={0.88} roughness={0.1} /></mesh>
      {/* Globe central */}
      <mesh position={[0, -0.5, 0]}><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#ffd580" emissive="#ffd060" emissiveIntensity={0.8} metalness={0.6} roughness={0.1} /></mesh>
      {/* Anneaux concentriques */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.025, 8, 32]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[0, -0.55, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.2, 0.02, 8, 40]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.6, 0.015, 6, 48]} /><meshStandardMaterial color="#b89840" metalness={0.85} roughness={0.12} /></mesh>
      {/* Bras + bougies + cristaux */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2
        const r1 = 0.7, r2 = 1.2, r3 = 1.6
        return (
          <group key={`arm-${i}`}>
            {/* Bras court */}
            <mesh position={[Math.cos(a) * r1, -0.55, Math.sin(a) * r1]} rotation={[0, -a, 0.3]}>
              <cylinderGeometry args={[0.012, 0.012, 0.4, 4]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Bougie courte */}
            <mesh position={[Math.cos(a) * r1, -0.65, Math.sin(a) * r1]}>
              <cylinderGeometry args={[0.015, 0.018, 0.1, 6]} /><meshStandardMaterial color="#f5f0e0" roughness={0.6} />
            </mesh>
            <mesh position={[Math.cos(a) * r1, -0.58, Math.sin(a) * r1]}>
              <coneGeometry args={[0.02, 0.04, 6]} /><meshStandardMaterial color="#ffd580" emissive="#ffd060" emissiveIntensity={1.2} transparent opacity={0.9} />
            </mesh>
            {/* Cristaux pendants anneau 2 */}
            {i % 2 === 0 && (
              <mesh position={[Math.cos(a) * r2, -0.7, Math.sin(a) * r2]}>
                <octahedronGeometry args={[0.025, 0]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={0.02} metalness={0.2} emissive="#fef3c7" emissiveIntensity={0.1} />
              </mesh>
            )}
            {/* Sphères lumineuses anneau 3 */}
            {i % 3 === 0 && (
              <mesh position={[Math.cos(a) * r3, -0.65, Math.sin(a) * r3]}>
                <sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#ffd580" emissive="#ffd060" emissiveIntensity={1.0} />
              </mesh>
            )}
          </group>
        )
      })}
      {/* Lumières */}
      <pointLight position={[0, -0.6, 0]} intensity={3} color="#ffd580" distance={16} decay={2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, -1.2, 0]} intensity={1.5} color="#ffeedd" distance={10} decay={2} />
    </group>
  )
})

// Petit lustre secondaire
const SmallChandelier = memo(function SmallChandelier({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.02, 0.02, 0.4, 4]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[0, -0.25, 0]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color="#ffd580" emissive="#ffd060" emissiveIntensity={0.6} metalness={0.5} roughness={0.15} /></mesh>
      <mesh position={[0, -0.25, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.35, 0.015, 6, 16]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} /></mesh>
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.35, -0.35, Math.sin(a) * 0.35]}>
            <coneGeometry args={[0.04, 0.08, 6]} /><meshStandardMaterial color="#ffd580" emissive="#ffd060" emissiveIntensity={0.8} transparent opacity={0.7} />
          </mesh>
        )
      })}
      <pointLight position={[0, -0.3, 0]} intensity={1} color="#ffd580" distance={8} decay={2} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// RÉCEPTION
// ═══════════════════════════════════════════════════════════════

const ReceptionDesk = memo(function ReceptionDesk({ position, bellRef, onRingBell }: { position: [number, number, number]; bellRef: any; onRingBell: () => void }) {
  return (
    <group position={position}>
      {/* Comptoir principal */}
      <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[7, 1.1, 1.1]} /><meshStandardMaterial color="#0e1520" roughness={0.2} metalness={0.6} /></mesh>
      {/* Dessus marbre */}
      <mesh position={[0, 1.12, 0]} castShadow><boxGeometry args={[7.15, 0.06, 1.2]} /><meshStandardMaterial color="#c8b89a" roughness={0.1} metalness={0.15} /></mesh>
      {/* Face avant — panneaux */}
      <mesh position={[0, 0.55, 0.56]}><boxGeometry args={[6.9, 1.05, 0.02]} /><meshStandardMaterial color="#1a1020" roughness={0.55} metalness={0.1} /></mesh>
      {/* Moulures dorées verticales */}
      {[-3, -2, -1, 0, 1, 2, 3].map((x, i) => (
        <mesh key={`gold-strip-${i}`} position={[x, 0.55, 0.58]}><boxGeometry args={[0.05, 0.9, 0.04]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} /></mesh>
      ))}
      {/* Moulure horizontale dorée */}
      <mesh position={[0, 1.08, 0.58]}><boxGeometry args={[7.1, 0.025, 0.01]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} /></mesh>
      <mesh position={[0, 0.04, 0.58]}><boxGeometry args={[7.1, 0.025, 0.01]} /><meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} /></mesh>

      {/* Moniteurs */}
      {[-2, 0, 2].map((x, i) => (
        <group key={`pc-${i}`} position={[x, 1.35, -0.15]}>
          <mesh><boxGeometry args={[0.55, 0.4, 0.03]} /><meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.3} /></mesh>
          <mesh position={[0, 0, 0.018]}><boxGeometry args={[0.48, 0.33, 0.005]} /><meshStandardMaterial color="#0a1628" emissive="#3b82f6" emissiveIntensity={0.35} /></mesh>
          <mesh position={[0, -0.28, 0.06]}><boxGeometry args={[0.06, 0.12, 0.06]} /><meshStandardMaterial color="#374151" metalness={0.5} roughness={0.4} /></mesh>
          <mesh position={[0, -0.35, 0.12]}><boxGeometry args={[0.3, 0.01, 0.1]} /><meshStandardMaterial color="#374151" metalness={0.4} roughness={0.5} /></mesh>
        </group>
      ))}

      {/* Clochette */}
      <mesh ref={bellRef} position={[1, 1.12, 0.35]} castShadow onClick={onRingBell}>
        <cylinderGeometry args={[0.06, 0.08, 0.06, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.08} />
      </mesh>
      <mesh position={[1, 1.16, 0.35]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.08} /></mesh>

      {/* Porte-stylos */}
      <mesh position={[-1.2, 1.16, 0.3]} castShadow><cylinderGeometry args={[0.035, 0.04, 0.08, 8]} /><meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.3} /></mesh>
      {[-0.005, 0.005].map((x, i) => (<mesh key={`pen-${i}`} position={[-1.2 + x, 1.24, 0.3]} rotation={[0, 0, (i - 0.5) * 0.1]}><cylinderGeometry args={[0.004, 0.004, 0.1, 4]} /><meshStandardMaterial color={i === 0 ? '#1a1a1a' : '#0044aa'} /></mesh>))}

      {/* Brochures */}
      <mesh position={[2, 1.14, 0.28]} rotation={[0, 0.1, 0]}><boxGeometry args={[0.14, 0.02, 0.2]} /><meshStandardMaterial color="#ffffff" roughness={0.8} /></mesh>
      <mesh position={[2, 1.16, 0.28]} rotation={[0, -0.1, 0]}><boxGeometry args={[0.14, 0.02, 0.2]} /><meshStandardMaterial color="#fbbf24" roughness={0.8} /></mesh>

      {/* Panneau RÉCEPTION */}
      <mesh position={[0, 1.65, 0.5]}><boxGeometry args={[1.6, 0.35, 0.04]} /><meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 1.65, 0.525]}><boxGeometry args={[1.5, 0.25, 0.005]} /><meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={0.3} /></mesh>
      <Text position={[0, 1.65, 0.54]} fontSize={0.12} color="#fef3c7" anchorX="center" anchorY="middle">RÉCEPTION</Text>

      {/* Panneau rétroéclairé mural */}
      <mesh position={[0, 2.5, -0.6]}><boxGeometry args={[6, 0.6, 0.06]} /><meshStandardMaterial color="#0a0a14" roughness={0.5} /></mesh>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`bl-${i}`} position={[-3 + i * 0.44, 2.5, -0.56]}><boxGeometry args={[0.28, 0.35, 0.03]} /><meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={0.5} metalness={0.75} /></mesh>
      ))}
      <pointLight position={[0, 2.8, -0.4]} intensity={0.8} color="#ffeedd" distance={6} decay={2} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// FONTAINE
// ═══════════════════════════════════════════════════════════════

const LobbyFountain = memo(function LobbyFountain({ position, fountainRef }: { position: [number, number, number]; fountainRef: any }) {
  return (
    <group position={position}>
      {/* Base octogonale */}
      <mesh position={[0, 0.12, 0]} castShadow><cylinderGeometry args={[1.2, 1.35, 0.24, 8]} /><meshStandardMaterial color="#8a8a9a" roughness={0.3} metalness={0.2} /></mesh>
      {/* Bassin */}
      <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[1.1, 1.2, 0.08, 8]} /><meshStandardMaterial color="#7a7a8a" roughness={0.25} metalness={0.25} /></mesh>
      {/* Eau */}
      <mesh ref={fountainRef} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.05, 16]} /><meshStandardMaterial color="#2a5a8a" roughness={0.03} metalness={0.3} transparent opacity={0.45} /></mesh>
      {/* Colonne centrale */}
      <mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.12, 0.16, 1, 8]} /><meshStandardMaterial color="#9a9aaa" roughness={0.25} metalness={0.3} /></mesh>
      {/* Vasque supérieure */}
      <mesh position={[0, 1.35, 0]} castShadow><cylinderGeometry args={[0.4, 0.15, 0.12, 8]} /><meshStandardMaterial color="#8a8a9a" roughness={0.25} metalness={0.3} /></mesh>
      {/* Jet */}
      <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.02, 0.008, 0.4, 6]} /><meshStandardMaterial color="#88ccff" transparent opacity={0.5} emissive="#4488cc" emissiveIntensity={0.15} /></mesh>
      <pointLight position={[0, 0.5, 0]} intensity={0.4} color="#4488cc" distance={4} decay={2} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// ZONE DE REPOS
// ═══════════════════════════════════════════════════════════════

const SeatingArea = memo(function SeatingArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Canapé 1 */}
      <group position={[0, 0, -1.5]}>
        <mesh position={[0, 0.22, 0]} castShadow><boxGeometry args={[2.8, 0.44, 0.9]} /><meshStandardMaterial color="#1c140e" roughness={0.82} /></mesh>
        <mesh position={[0, 0.5, -0.35]} castShadow><boxGeometry args={[2.8, 0.55, 0.18]} /><meshStandardMaterial color="#150d08" roughness={0.72} /></mesh>
        {[-0.9, 0.9].map((x, i) => (<mesh key={i} position={[x, 0.48, 0.05]}><boxGeometry args={[0.7, 0.16, 0.65]} /><meshStandardMaterial color="#2a1c14" roughness={0.88} /></mesh>))}
        {[-1.35, 1.35].map((x, i) => (<mesh key={`ar-${i}`} position={[x, 0.35, 0]}><boxGeometry args={[0.1, 0.48, 0.9]} /><meshStandardMaterial color="#150d08" roughness={0.72} /></mesh>))}
        {/* Coussin décoratif */}
        <mesh position={[0.8, 0.55, 0.1]} rotation={[0, 0, 0.15]} castShadow><boxGeometry args={[0.3, 0.28, 0.06]} /><meshStandardMaterial color="#c9a84c" roughness={0.8} /></mesh>
        {/* Pieds dorés */}
        {[[-1.2, -0.3], [-1.2, 0.3], [1.2, -0.3], [1.2, 0.3]].map(([x, z], i) => (
          <mesh key={`leg-${i}`} position={[x, 0.04, z]}><boxGeometry args={[0.04, 0.08, 0.04]} /><meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.15} /></mesh>
        ))}
      </group>

      {/* Canapé 2 (face) */}
      <group position={[0, 0, 1.5]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.22, 0]} castShadow><boxGeometry args={[2.8, 0.44, 0.9]} /><meshStandardMaterial color="#1c140e" roughness={0.82} /></mesh>
        <mesh position={[0, 0.5, -0.35]} castShadow><boxGeometry args={[2.8, 0.55, 0.18]} /><meshStandardMaterial color="#150d08" roughness={0.72} /></mesh>
        {[-1.35, 1.35].map((x, i) => (<mesh key={`ar2-${i}`} position={[x, 0.35, 0]}><boxGeometry args={[0.1, 0.48, 0.9]} /><meshStandardMaterial color="#150d08" roughness={0.72} /></mesh>))}
      </group>

      {/* Table basse — plateau verre */}
      <mesh position={[0, 0.38, 0]}><boxGeometry args={[1.5, 0.03, 0.9]} /><meshPhysicalMaterial color="#a8c8d8" transmission={0.3} thickness={0.015} roughness={0.02} transparent opacity={0.6} metalness={0.1} /></mesh>
      <mesh position={[0, 0.38, 0]}><boxGeometry args={[1.52, 0.035, 0.015]} /><meshStandardMaterial color="#c9a84c" roughness={0.15} metalness={0.7} /></mesh>
      {[[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].map(([x, z], i) => (
        <mesh key={`tleg-${i}`} position={[x, 0.19, z]}><cylinderGeometry args={[0.025, 0.025, 0.38, 6]} /><meshStandardMaterial color="#c9a84c" metalness={0.85} roughness={0.12} /></mesh>
      ))}

      {/* Vase sur table */}
      <mesh position={[-0.3, 0.48, 0]} castShadow><cylinderGeometry args={[0.05, 0.035, 0.16, 8]} /><meshStandardMaterial color="#2a4a6a" roughness={0.3} metalness={0.2} /></mesh>
      <mesh position={[-0.3, 0.6, 0]}><sphereGeometry args={[0.03, 6, 6]} /><meshStandardMaterial color="#ef4444" roughness={0.7} /></mesh>

      {/* Magazines */}
      <mesh position={[0.2, 0.41, 0.05]} rotation={[0, 0.2, 0]}><boxGeometry args={[0.16, 0.012, 0.22]} /><meshStandardMaterial color="#ef4444" roughness={0.7} /></mesh>
      <mesh position={[0.18, 0.425, 0.02]} rotation={[0, -0.1, 0]}><boxGeometry args={[0.16, 0.012, 0.22]} /><meshStandardMaterial color="#3b82f6" roughness={0.7} /></mesh>

      {/* Lampe d'appoint */}
      <group position={[2, 0, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow><cylinderGeometry args={[0.18, 0.18, 0.03, 8]} /><meshStandardMaterial color="#2a1a0e" roughness={0.4} metalness={0.1} /></mesh>
        <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.035, 0.035, 0.35, 6]} /><meshStandardMaterial color="#c9a84c" roughness={0.2} metalness={0.6} /></mesh>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.015, 0.015, 0.2, 6]} /><meshStandardMaterial color="#c9a84c" roughness={0.2} metalness={0.6} /></mesh>
        <mesh position={[0, 0.65, 0]} castShadow><coneGeometry args={[0.15, 0.2, 8, 1, true]} /><meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} side={THREE.DoubleSide} /></mesh>
        <pointLight position={[0, 0.6, 0]} intensity={0.3} color="#fef3c7" distance={3} decay={2} />
      </group>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PLANTE DÉCORATIVE
// ═══════════════════════════════════════════════════════════════

const LobbyPlant = memo(function LobbyPlant({ position, variant = 0 }: { position: [number, number, number]; variant?: number }) {
  const leavesRef = useRef<THREE.Group>(null)
  useFrame((state) => { if (leavesRef.current) leavesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + variant) * 0.012 })

  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.28, 0.22, 0.4, 8]} /><meshStandardMaterial color="#1a1612" roughness={0.45} metalness={0.35} /></mesh>
      <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.3, 0.3, 0.02, 8]} /><meshStandardMaterial color="#c9a84c" roughness={0.15} metalness={0.6} /></mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.22, 8]} /><meshStandardMaterial color="#2a1e14" roughness={0.95} /></mesh>
      <group ref={leavesRef}>
        <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.03, 0.04, 0.25, 6]} /><meshStandardMaterial color="#2a1a10" roughness={0.8} /></mesh>
        {[0, 50, 100, 150, 200, 260, 320].map((angle, i) => (
          <mesh key={i} position={[Math.sin((angle * Math.PI) / 180) * 0.05, 0.6 + i * 0.04, Math.cos((angle * Math.PI) / 180) * 0.05]} rotation={[0.35, (angle * Math.PI) / 180, 0.12]} castShadow>
            <boxGeometry args={[0.06, 0.2, 0.015]} /><meshStandardMaterial color={i % 2 === 0 ? '#166534' : '#15803d'} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// APPLIQUE MURALE
// ═══════════════════════════════════════════════════════════════

const WallSconce = memo(function WallSconce({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={[0.08, 0.3, 0.08]} /><meshStandardMaterial color="#c9a84c" metalness={0.88} roughness={0.1} /></mesh>
      <mesh position={[0, 0, 0.12]}><boxGeometry args={[0.4, 0.6, 0.03]} /><meshPhysicalMaterial color="#a8c0d8" transmission={0.5} thickness={0.015} roughness={0.02} transparent opacity={0.35} /></mesh>
      <mesh position={[0, 0, 0.08]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#ffd580" emissive="#ffd060" emissiveIntensity={1.0} /></mesh>
      <pointLight position={[0, 0, 0.15]} color="#ffd580" intensity={0.35} distance={4} decay={2} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// TABLEAU MURAL
// ═══════════════════════════════════════════════════════════════

const WallPainting = memo(function WallPainting({ position, rotation = [0, 0, 0], variant = 0 }: { position: [number, number, number]; rotation?: [number, number, number]; variant?: number }) {
  const tex = useMemo(() => createCanvasTexture(160, 120, (ctx, w, h) => {
    const bgs = ['#1a0a2e', '#1a2a4e', '#2a1a1e', '#0a1a2e']
    const accs = ['#8b5cf6', '#3b82f6', '#ef4444', '#22c55e']
    ctx.fillStyle = bgs[variant % bgs.length]; ctx.fillRect(0, 0, w, h)
    const acc = accs[variant % accs.length]
    for (let i = 0; i < 4; i++) { ctx.fillStyle = `${acc}25`; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 10 + Math.random() * 20, 0, Math.PI * 2); ctx.fill() }
    ctx.strokeStyle = `${acc}30`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, 0); ctx.stroke()
    ctx.fillStyle = '#fef3c7'; for (let i = 0; i < 15; i++) ctx.fillRect(Math.random() * w, Math.random() * h * 0.5, 1, 1)
  }), [variant])

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.005]} castShadow><boxGeometry args={[1.3, 0.95, 0.03]} /><meshStandardMaterial color="#8b6914" roughness={0.2} metalness={0.6} /></mesh>
      <mesh><boxGeometry args={[1.2, 0.85, 0.025]} /><meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 0, 0.015]}><boxGeometry args={[1.1, 0.75, 0.006]} /><meshStandardMaterial map={tex} /></mesh>
      <mesh position={[0, 0.5, 0.04]}><boxGeometry args={[0.35, 0.02, 0.04]} /><meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.3} /></mesh>
      <spotLight position={[0, 0.55, 0.15]} angle={Math.PI / 5} penumbra={0.7} intensity={0.25} color="#fef3c7" distance={1.5} />
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// AUVENT D'ENTRÉE
// ═══════════════════════════════════════════════════════════════

const EntranceCanopy = memo(function EntranceCanopy({ position, height }: { position: [number, number, number]; height: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height * 0.85, 2.5]} castShadow><boxGeometry args={[9, 0.15, 5]} /><meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.3} /></mesh>
      <mesh position={[0, height * 0.82, 2.5]}><boxGeometry args={[8.5, 0.02, 4.5]} /><meshStandardMaterial color="#fff8e0" emissive="#fff8e0" emissiveIntensity={0.12} /></mesh>
      {[-3.8, 3.8].map((x, i) => (
        <mesh key={i} position={[x, height * 0.42, 4.5]} castShadow><cylinderGeometry args={[0.1, 0.12, height * 0.85, 8]} /><meshStandardMaterial color="#8a8a9a" metalness={0.5} roughness={0.4} /></mesh>
      ))}
      {/* Marches */}
      {[0, 1, 2].map((s, i) => (
        <mesh key={`step-${i}`} position={[0, 0.05 + i * 0.06, 3.5 + i * 0.4]} castShadow>
          <boxGeometry args={[6, 0.06, 0.4]} /><meshStandardMaterial color="#a89880" roughness={0.5} metalness={0.1} />
        </mesh>
      ))}
      {/* Tapis d'entrée */}
      <mesh position={[0, 0.01, 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.5, 2]} /><meshStandardMaterial color="#1a1010" roughness={0.95} /></mesh>
      {/* Éclairage */}
      <spotLight position={[0, height * 0.8, 2.5]} angle={Math.PI / 3} penumbra={0.8} intensity={1.2} color="#fff8e0" castShadow shadow-mapSize={[512, 512]} />
      {[-3, 3].map((x, i) => (<pointLight key={i} position={[x, 2.5, 3]} intensity={0.4} color="#fef3c7" distance={5} decay={2} />))}
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PANNEAU DE BIENVENUE
// ═══════════════════════════════════════════════════════════════

const WelcomeSign = memo(function WelcomeSign({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh><boxGeometry args={[9, 0.9, 0.08]} /><meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 0, 0.045]}><boxGeometry args={[8.8, 0.8, 0.005]} /><meshStandardMaterial color="#0f0a18" roughness={0.6} /></mesh>
      {/* Bordures dorées */}
      <mesh position={[0, 0.42, 0.05]}><boxGeometry args={[8.9, 0.02, 0.003]} /><meshStandardMaterial color="#c9a84c" roughness={0.1} metalness={0.8} /></mesh>
      <mesh position={[0, -0.42, 0.05]}><boxGeometry args={[8.9, 0.02, 0.003]} /><meshStandardMaterial color="#c9a84c" roughness={0.1} metalness={0.8} /></mesh>
      <Text position={[0, 0.12, 0.06]} fontSize={0.32} color="#c9a84c" anchorX="center" anchorY="middle">BIENVENUE — HÔTEL ETHERWORLD</Text>
      <Text position={[0, -0.18, 0.06]} fontSize={0.12} color="#fef3c7" anchorX="center" anchorY="middle">WELCOME • BIENVENIDO • 欢迎</Text>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// ZONE ASCENSEUR
// ═══════════════════════════════════════════════════════════════

const ElevatorArea = memo(function ElevatorArea({ position }: { position: [number, number, number] }) {
  const indicatorRef = useRef<THREE.Mesh>(null)
  useFrame((state) => { if (indicatorRef.current) { const mat = indicatorRef.current.material as THREE.MeshStandardMaterial; mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.12 } })

  return (
    <group position={position}>
      {/* Portes métalliques */}
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, LH / 2 - 0.3, 0]} castShadow>
          <boxGeometry args={[1.05, LH - 0.8, 0.05]} /><meshStandardMaterial color="#5a5a6e" metalness={0.8} roughness={0.18} />
        </mesh>
      ))}
      <mesh position={[0, LH / 2 - 0.3, 0.03]}><boxGeometry args={[0.015, LH - 0.85, 0.008]} /><meshStandardMaterial color="#3a3a4e" /></mesh>
      {/* Cadre */}
      {[-1.15, 1.15].map((x, i) => (<mesh key={`f-${i}`} position={[x, LH / 2 - 0.3, 0]} castShadow><boxGeometry args={[0.12, LH - 0.6, 0.15]} /><meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} /></mesh>))}
      <mesh position={[0, LH - 0.7, 0]} castShadow><boxGeometry args={[2.4, 0.12, 0.15]} /><meshStandardMaterial color="#4a4a5e" metalness={0.6} roughness={0.3} /></mesh>
      {/* Indicateur */}
      <mesh position={[0, LH - 0.4, 0.08]}><boxGeometry args={[0.5, 0.22, 0.04]} /><meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.4} /></mesh>
      <mesh ref={indicatorRef} position={[0, LH - 0.4, 0.105]}><boxGeometry args={[0.4, 0.14, 0.005]} /><meshStandardMaterial color="#0a1410" emissive="#22c55e" emissiveIntensity={0.5} /></mesh>
      {/* Panneau d'appel */}
      <group position={[1.35, LH / 2 - 0.5, 0.08]}>
        <mesh><boxGeometry args={[0.12, 0.2, 0.03]} /><meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.4} /></mesh>
        <mesh position={[0, 0.04, 0.018]}><cylinderGeometry args={[0.025, 0.025, 0.01, 8]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.2} /></mesh>
        <mesh position={[0, -0.04, 0.018]}><cylinderGeometry args={[0.025, 0.025, 0.01, 8]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} metalness={0.7} roughness={0.2} /></mesh>
      </group>
      <Text position={[0, LH - 0.2, 0.1]} fontSize={0.1} color="#fef3c7" anchorX="center" anchorY="middle">ASCENSEUR</Text>
      {/* Sol devant ascenseur */}
      <mesh position={[0, 0.012, 0.8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.2, 1.6]} /><meshStandardMaterial color="#3a3a4e" roughness={0.2} metalness={0.3} /></mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// CONCIERGERIE / BAGAGES
// ═══════════════════════════════════════════════════════════════

const BaggageArea = memo(function BaggageArea({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Chariot à bagages */}
      <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.8, 0.04, 0.5]} /><meshStandardMaterial color="#c9a84c" metalness={0.7} roughness={0.2} /></mesh>
      {[[-0.35, -0.2], [-0.35, 0.2], [0.35, -0.2], [0.35, 0.2]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.14, z]}><cylinderGeometry args={[0.06, 0.06, 0.28, 6]} /><meshStandardMaterial color="#c9a84c" metalness={0.7} roughness={0.2} /></mesh>
      ))}
      {/* Roues */}
      {[[-0.35, -0.2], [-0.35, 0.2], [0.35, -0.2], [0.35, 0.2]].map(([x, z], i) => (
        <mesh key={`wheel-${i}`} position={[x, 0.04, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 0.03, 8]} /><meshStandardMaterial color="#333" roughness={0.8} /></mesh>
      ))}
      {/* Valises */}
      <mesh position={[-0.15, 0.42, 0]} rotation={[0, 0.1, 0]} castShadow><boxGeometry args={[0.35, 0.2, 0.22]} /><meshStandardMaterial color="#2a2a4a" roughness={0.5} /></mesh>
      <mesh position={[0.15, 0.45, 0.05]} rotation={[0, -0.15, 0]} castShadow><boxGeometry args={[0.25, 0.3, 0.18]} /><meshStandardMaterial color="#8a2222" roughness={0.5} /></mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// ALARME INCENDIE (clignotement)
// ═══════════════════════════════════════════════════════════════

const FireAlarmLights = memo(function FireAlarmLights() {
  const lightsRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (lightsRef.current) {
      const on = Math.sin(state.clock.elapsedTime * 8) > 0
      lightsRef.current.children.forEach(child => {
        if (child instanceof THREE.PointLight) child.intensity = on ? 2 : 0
      })
    }
  })

  return (
    <group ref={lightsRef}>
      {[[-8, 0], [0, 0], [8, 0], [-4, -5], [4, -5]].map(([x, z], i) => (
        <pointLight key={i} position={[x, LH - 0.3, z]} intensity={2} color="#ef4444" distance={8} decay={2} />
      ))}
    </group>
  )
})