'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ════════════════════════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES
// ════════════════════════════════════════════════════════════════════════════

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

// Carrelage blanc salle de bain
function useTileTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#eaeaea'
    ctx.fillRect(0, 0, w, h)
    const ts = w / 4
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = c * ts, y = r * ts
      const shade = 228 + Math.random() * 8
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`
      ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2)
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.fillRect(x + 2, y + 2, ts * 0.4, ts * 0.3)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1.5
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * ts, 0); ctx.lineTo(i * ts, h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * ts); ctx.lineTo(w, i * ts); ctx.stroke()
    }
  }, [2, 2]), [])
}

// Porcelaine / céramique
function usePorcelainTexture() {
  return useMemo(() => createCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 200; i++) {
      const s = 240 + Math.random() * 15
      ctx.fillStyle = `rgba(${s},${s},${s},0.03)`
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 4)
    }
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, 'rgba(255,255,255,0.05)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0)')
    grad.addColorStop(1, 'rgba(255,255,255,0.03)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }), [])
}

// Marbre pour comptoir
function useMarbleTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#e8e4de')
    grad.addColorStop(0.3, '#e0dcd6')
    grad.addColorStop(0.7, '#e4e0da')
    grad.addColorStop(1, '#dcd8d2')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${160 + Math.random() * 30},${150 + Math.random() * 25},${140 + Math.random() * 20},0.1)`
      ctx.lineWidth = 0.8
      ctx.beginPath()
      let x = Math.random() * w, y = Math.random() * h
      ctx.moveTo(x, y)
      for (let j = 0; j < 4; j++) {
        x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60
        ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, x, y)
      }
      ctx.stroke()
    }
  }), [])
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function BathroomFixtures({ position = [0, 0, 0] as [number, number, number] }) {
  const tileTex = useTileTexture()

  return (
    <group position={position}>
      {/* ══ SOL CARRELÉ ══ */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial map={tileTex} color="#e8e8e8" roughness={0.25} metalness={0.05} />
      </mesh>

      {/* ══ TOILETTE ══ */}
      <Toilet position={[0.8, 0, -0.5]} />

      {/* ══ LAVABO ══ */}
      <Sink position={[-0.5, 0, 0.3]} />

      {/* ══ DOUCHE ══ */}
      <Shower position={[-0.8, 0, -0.8]} />

      {/* ══ MIROIR ══ */}
      <BathroomMirror position={[-0.5, 1.4, 0.48]} />

      {/* ══ PORTE-SERVIETTES ══ */}
      <TowelRack position={[0.9, 1.1, 0.4]} />

      {/* ══ PORTE-PAPIER TOILETTE ══ */}
      <ToiletPaperHolder position={[1.05, 0.5, -0.3]} />

      {/* ══ TAPIS DE BAIN ══ */}
      <BathMat position={[-0.4, 0.01, -0.5]} />

      {/* ══ BROSSE WC ══ */}
      <ToiletBrush position={[1.05, 0, -0.7]} />

      {/* ══ POUBELLE ══ */}
      <TrashBin position={[0.3, 0, 0.35]} />

      {/* ══ DISTRIBUTEUR SAVON ══ */}
      <SoapDispenser position={[-0.28, 0.92, 0.25]} />

      {/* ══ BROSSE À DENTS + GOBELET ══ */}
      <ToothbrushHolder position={[-0.7, 0.92, 0.3]} />

      {/* ══ PORTE-PEIGNOIR ══ */}
      <RobeHook position={[1.15, 1.5, 0]} />

      {/* ══ VENTILATEUR / EXTRACTION ══ */}
      <ExhaustFan position={[0, 2.35, 0]} />

      {/* ══ ÉCLAIRAGE ══ */}
      <BathroomLighting />
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TOILETTE — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

const Toilet = memo(function Toilet({ position }: { position: [number, number, number] }) {
  const porcelainTex = usePorcelainTexture()

  return (
    <group position={position}>
      {/* Base / pied */}
      <mesh position={[0, 0.08, 0.05]} castShadow>
        <boxGeometry args={[0.32, 0.16, 0.42]} />
        <meshStandardMaterial map={porcelainTex} color="#f5f5f5" roughness={0.2} metalness={0.05} />
      </mesh>

      {/* Cuvette — corps principal */}
      <mesh position={[0, 0.2, 0.05]} castShadow>
        <boxGeometry args={[0.38, 0.12, 0.48]} />
        <meshStandardMaterial map={porcelainTex} color="#f5f5f5" roughness={0.2} metalness={0.05} />
      </mesh>

      {/* Cuvette — avant arrondi */}
      <mesh position={[0, 0.2, 0.28]} castShadow>
        <cylinderGeometry args={[0.18, 0.19, 0.12, 12, 1, false, 0, Math.PI]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial map={porcelainTex} color="#f5f5f5" roughness={0.2} metalness={0.05} />
      </mesh>

      {/* Intérieur cuvette (creux sombre) */}
      <mesh position={[0, 0.24, 0.05]}>
        <boxGeometry args={[0.28, 0.02, 0.35]} />
        <meshStandardMaterial color="#c8d8e8" roughness={0.1} metalness={0.1} />
      </mesh>

      {/* Eau dans la cuvette */}
      <mesh position={[0, 0.23, 0.05]}>
        <boxGeometry args={[0.26, 0.005, 0.3]} />
        <meshStandardMaterial color="#a8c8e8" roughness={0.05} metalness={0.2} transparent opacity={0.4} />
      </mesh>

      {/* Lunette / Seat */}
      <mesh position={[0, 0.28, 0.05]} castShadow>
        <boxGeometry args={[0.36, 0.025, 0.44]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Couvercle / Lid — légèrement ouvert */}
      <mesh position={[0, 0.31, -0.12]} rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.34, 0.02, 0.38]} />
        <meshStandardMaterial map={porcelainTex} color="#f0f0f0" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Réservoir */}
      <mesh position={[0, 0.42, -0.2]} castShadow>
        <boxGeometry args={[0.34, 0.32, 0.14]} />
        <meshStandardMaterial map={porcelainTex} color="#f5f5f5" roughness={0.2} metalness={0.05} />
      </mesh>

      {/* Couvercle du réservoir */}
      <mesh position={[0, 0.59, -0.2]} castShadow>
        <boxGeometry args={[0.36, 0.02, 0.16]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.25} metalness={0.08} />
      </mesh>

      {/* Bouton de chasse — double */}
      <group position={[0, 0.61, -0.2]}>
        <mesh position={[-0.03, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.015, 8]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[0.03, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.015, 8]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* Charnières */}
      {[-0.15, 0.15].map((x, i) => (
        <mesh key={`hinge-${i}`} position={[x, 0.29, -0.18]}>
          <cylinderGeometry args={[0.008, 0.008, 0.04, 6]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
        </mesh>
      ))}

      {/* Tuyau d'alimentation */}
      <mesh position={[-0.2, 0.2, -0.28]}>
        <cylinderGeometry args={[0.012, 0.012, 0.35, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Robinet d'arrêt */}
      <mesh position={[-0.2, 0.35, -0.28]}>
        <boxGeometry args={[0.04, 0.02, 0.03]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Boulons de fixation au sol */}
      {[-0.12, 0.12].map((x, i) => (
        <mesh key={`bolt-${i}`} position={[x, 0.01, 0.2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.02, 6]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// LAVABO — ENRICHI
// ════════════════════════════════════════════════════════════════════════════

const Sink = memo(function Sink({ position }: { position: [number, number, number] }) {
  const porcelainTex = usePorcelainTexture()
  const marbleTex = useMarbleTexture()

  return (
    <group position={position}>
      {/* ══ MEUBLE SOUS-LAVABO ══ */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.38]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Porte du meuble */}
      <mesh position={[0, 0.35, 0.195]}>
        <boxGeometry args={[0.5, 0.62, 0.015]} />
        <meshStandardMaterial color="#333348" roughness={0.55} metalness={0.08} />
      </mesh>

      {/* Poignée de la porte */}
      <mesh position={[0.15, 0.35, 0.21]}>
        <boxGeometry args={[0.06, 0.015, 0.02]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Pieds du meuble */}
      {[[-0.24, -0.16], [-0.24, 0.16], [0.24, -0.16], [0.24, 0.16]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.02, z]}>
          <boxGeometry args={[0.03, 0.04, 0.03]} />
          <meshStandardMaterial color="#222" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* ══ COMPTOIR EN MARBRE ══ */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.58, 0.025, 0.42]} />
        <meshStandardMaterial map={marbleTex} color="#e0dcd6" roughness={0.15} metalness={0.1} />
      </mesh>

      {/* ══ VASQUE ══ */}
      {/* Rebord vasque */}
      <mesh position={[0, 0.74, 0.02]} castShadow>
        <boxGeometry args={[0.42, 0.04, 0.32]} />
        <meshStandardMaterial map={porcelainTex} color="#f5f5f5" roughness={0.15} metalness={0.05} />
      </mesh>

      {/* Creux de la vasque */}
      <mesh position={[0, 0.73, 0.02]}>
        <boxGeometry args={[0.36, 0.03, 0.26]} />
        <meshStandardMaterial color="#dde4ea" roughness={0.1} metalness={0.05} />
      </mesh>

      {/* Eau résiduelle (subtil) */}
      <mesh position={[0, 0.72, 0.02]}>
        <boxGeometry args={[0.1, 0.002, 0.08]} />
        <meshStandardMaterial color="#b8d0e8" roughness={0.02} metalness={0.15} transparent opacity={0.25} />
      </mesh>

      {/* Drain */}
      <mesh position={[0, 0.715, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.015, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ══ ROBINETTERIE ══ */}
      {/* Base robinet */}
      <mesh position={[0, 0.78, -0.12]}>
        <cylinderGeometry args={[0.025, 0.03, 0.04, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Col du robinet */}
      <mesh position={[0, 0.82, -0.1]}>
        <boxGeometry args={[0.02, 0.06, 0.02]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Bec verseur — arrondi */}
      <mesh position={[0, 0.85, -0.04]} rotation={[0.6, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Sortie d'eau */}
      <mesh position={[0, 0.82, 0.02]}>
        <cylinderGeometry args={[0.01, 0.008, 0.02, 6]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Poignées eau chaude / froide */}
      {[-0.08, 0.08].map((x, i) => (
        <group key={`handle-${i}`} position={[x, 0.78, -0.12]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.025, 8]} />
            <meshStandardMaterial color={i === 0 ? '#4488cc' : '#cc4444'} metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Indicateur chaud/froid */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.005, 6]} />
            <meshStandardMaterial color={i === 0 ? '#2266aa' : '#aa2222'} />
          </mesh>
        </group>
      ))}

      {/* ══ TUYAUTERIE VISIBLE (si meuble ouvert) ══ */}
      <mesh position={[0, 0.4, -0.15]}>
        <cylinderGeometry args={[0.012, 0.012, 0.55, 6]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// DOUCHE — ENRICHIE
// ════════════════════════════════════════════════════════════════════════════

const Shower = memo(function Shower({ position }: { position: [number, number, number] }) {
  const tileTex = useTileTexture()

  return (
    <group position={position}>
      {/* ══ BAC DE DOUCHE ══ */}
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.05, 0.06, 1.05]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.2} metalness={0.05} />
      </mesh>

      {/* Rebord du bac */}
      {[[-0.52, 0, 0.07, 0.01, 1.05], [0.52, 0, 0.07, 0.01, 1.05], [0, 0, -0.52, 1.05, 0.01], [0, 0, 0.52, 1.05, 0.01]].map(([x, _y, z, w, d], i) => (
        <mesh key={`rim-${i}`} position={[x, 0.07, z]}>
          <boxGeometry args={[w as number, 0.02, d as number]} />
          <meshStandardMaterial color="#d8d8d8" roughness={0.3} metalness={0.08} />
        </mesh>
      ))}

      {/* Surface antidérapante (texture) */}
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.95, 0.95]} />
        <meshStandardMaterial map={tileTex} color="#e0e0e0" roughness={0.35} />
      </mesh>

      {/* Drain central */}
      <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 12]} />
        <meshStandardMaterial color="#999" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Grille du drain */}
      {[0, Math.PI / 4, Math.PI / 2, Math.PI * 0.75].map((rot, i) => (
        <mesh key={`drain-${i}`} position={[0, 0.066, 0]} rotation={[-Math.PI / 2, rot, 0]}>
          <planeGeometry args={[0.07, 0.003]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ══ PAROIS EN VERRE ══ */}
      {/* Paroi droite */}
      <mesh position={[0.5, 1.05, 0]} castShadow>
        <boxGeometry args={[0.02, 2, 1.02]} />
        <meshPhysicalMaterial color="#c8dce8" transmission={0.8} thickness={0.02} roughness={0.02} transparent opacity={0.2} metalness={0.1} ior={1.5} />
      </mesh>

      {/* Paroi fond */}
      <mesh position={[0, 1.05, -0.5]} castShadow>
        <boxGeometry args={[1.02, 2, 0.02]} />
        <meshPhysicalMaterial color="#c8dce8" transmission={0.8} thickness={0.02} roughness={0.02} transparent opacity={0.2} metalness={0.1} ior={1.5} />
      </mesh>

      {/* Porte vitrée (coulissante) */}
      <mesh position={[-0.25, 1.05, 0.5]}>
        <boxGeometry args={[0.52, 2, 0.015]} />
        <meshPhysicalMaterial color="#c8dce8" transmission={0.85} thickness={0.015} roughness={0.02} transparent opacity={0.18} metalness={0.1} ior={1.5} />
      </mesh>

      {/* Cadres des parois */}
      {/* Rail supérieur */}
      <mesh position={[0, 2.06, 0]}>
        <boxGeometry args={[1.06, 0.03, 1.06]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Rail inférieur */}
      <mesh position={[0, 0.08, 0.5]}>
        <boxGeometry args={[1.04, 0.02, 0.03]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Montants verticaux */}
      {[[0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]].map(([x, z], i) => (
        <mesh key={`frame-v-${i}`} position={[x, 1.05, z]}>
          <boxGeometry args={[0.02, 2.02, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
        </mesh>
      ))}

      {/* Poignée de porte */}
      <mesh position={[-0.02, 1.1, 0.52]}>
        <boxGeometry args={[0.12, 0.02, 0.03]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ══ POMMEAU DE DOUCHE ══ */}
      {/* Support mural / barre */}
      <mesh position={[0.45, 1.5, -0.45]} castShadow>
        <boxGeometry args={[0.03, 1.2, 0.03]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Curseur réglable */}
      <mesh position={[0.45, 1.8, -0.45]}>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Flexible */}
      <mesh position={[0.4, 1.75, -0.4]} rotation={[0.3, 0, 0.1]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 6]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Pommeau */}
      <group position={[0.3, 1.9, -0.3]} rotation={[0.5, 0, 0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.03, 12]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Face perforée */}
        <mesh position={[0, -0.018, 0]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[0.05, 12]} />
          <meshStandardMaterial color="#aaa" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Trous du pommeau */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.025, -0.02, Math.sin(a) * 0.025]}>
              <cylinderGeometry args={[0.003, 0.003, 0.01, 4]} />
              <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
            </mesh>
          )
        })}
      </group>

      {/* ══ MITIGEUR ══ */}
      <group position={[0.45, 1.1, -0.45]}>
        {/* Plaque */}
        <mesh>
          <boxGeometry args={[0.06, 0.12, 0.03]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
        </mesh>
        {/* Levier */}
        <mesh position={[0, 0.03, 0.03]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.04, 0.015, 0.06]} />
          <meshStandardMaterial color="#b0b0b0" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* ══ ÉTAGÈRE INTÉGRÉE ══ */}
      <mesh position={[0.2, 1.3, -0.47]} castShadow>
        <boxGeometry args={[0.3, 0.02, 0.08]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Bouteille de shampoing */}
      <mesh position={[0.15, 1.38, -0.47]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.14, 6]} />
        <meshStandardMaterial color="#2266aa" roughness={0.4} />
      </mesh>
      <mesh position={[0.15, 1.46, -0.47]}>
        <cylinderGeometry args={[0.01, 0.012, 0.02, 6]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>

      {/* Bouteille de gel douche */}
      <mesh position={[0.25, 1.36, -0.47]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.12, 6]} />
        <meshStandardMaterial color="#22aa44" roughness={0.4} />
      </mesh>

      {/* Savon */}
      <mesh position={[0.08, 1.32, -0.47]} castShadow>
        <boxGeometry args={[0.04, 0.02, 0.06]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.6} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MIROIR — ENRICHI
// ════════════════════════════════════════════════════════════════════════════

const BathroomMirror = memo(function BathroomMirror({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Cadre */}
      <mesh castShadow>
        <boxGeometry args={[0.68, 0.88, 0.025]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Surface miroir */}
      <mesh position={[0, 0, 0.015]}>
        <boxGeometry args={[0.62, 0.82, 0.005]} />
        <meshStandardMaterial
          color="#b8c8d8"
          metalness={1}
          roughness={0}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Reflet subtil */}
      <mesh position={[0, 0, 0.018]}>
        <boxGeometry args={[0.3, 0.5, 0.002]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.04} metalness={0.9} roughness={0} />
      </mesh>

      {/* Éclairage LED intégré — haut */}
      <mesh position={[0, 0.44, 0.02]}>
        <boxGeometry args={[0.55, 0.025, 0.015]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>

      {/* Éclairage LED — bas */}
      <mesh position={[0, -0.44, 0.02]}>
        <boxGeometry args={[0.55, 0.015, 0.01]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>

      {/* Lumière */}
      <pointLight position={[0, 0.3, 0.1]} intensity={0.4} color="#fff8f0" distance={1.5} decay={2} />
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PORTE-SERVIETTES — ENRICHI
// ════════════════════════════════════════════════════════════════════════════

const TowelRack = memo(function TowelRack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Supports muraux */}
      {[-0.18, 0.18].map((z, i) => (
        <mesh key={`sup-${i}`} position={[0, 0, z]}>
          <boxGeometry args={[0.03, 0.03, 0.06]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
        </mesh>
      ))}

      {/* Barre principale */}
      <mesh>
        <boxGeometry args={[0.015, 0.015, 0.42]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Barre secondaire (bas) */}
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[0.012, 0.012, 0.42]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Grande serviette */}
      <mesh position={[0.005, -0.12, 0]}>
        <boxGeometry args={[0.015, 0.28, 0.38]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.95} />
      </mesh>

      {/* Petite serviette (main) */}
      <mesh position={[0.005, -0.22, 0.12]}>
        <boxGeometry args={[0.012, 0.15, 0.2]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.95} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PORTE-PAPIER TOILETTE
// ════════════════════════════════════════════════════════════════════════════

const ToiletPaperHolder = memo(function ToiletPaperHolder({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Support mural */}
      <mesh>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Tige */}
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Rouleau de papier */}
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
        <meshStandardMaterial color="#f8f5f0" roughness={0.9} />
      </mesh>

      {/* Tube carton intérieur */}
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
        <meshStandardMaterial color="#c8b898" roughness={0.8} />
      </mesh>

      {/* Feuille qui pend */}
      <mesh position={[0, -0.05, 0.06]}>
        <boxGeometry args={[0.002, 0.06, 0.08]} />
        <meshStandardMaterial color="#f8f5f0" roughness={0.9} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// TAPIS DE BAIN
// ════════════════════════════════════════════════════════════════════════════

const BathMat = memo(function BathMat({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[0.6, 0.4]} />
      <meshStandardMaterial color="#e8e0d8" roughness={0.98} />
    </mesh>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// BROSSE WC
// ════════════════════════════════════════════════════════════════════════════

const ToiletBrush = memo(function ToiletBrush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Support */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.3, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Manche */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Poignée */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// POUBELLE
// ════════════════════════════════════════════════════════════════════════════

const TrashBin = memo(function TrashBin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.24, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Couvercle */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.015, 8]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Pédale */}
      <mesh position={[0, 0.02, 0.08]}>
        <boxGeometry args={[0.04, 0.01, 0.04]} />
        <meshStandardMaterial color="#999" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// DISTRIBUTEUR DE SAVON
// ════════════════════════════════════════════════════════════════════════════

const SoapDispenser = memo(function SoapDispenser({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Corps */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.04, 0.1, 0.04]} />
        <meshStandardMaterial color="#e0d8c8" roughness={0.4} />
      </mesh>
      {/* Pompe */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.012, 0.015, 0.02, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Bec */}
      <mesh position={[0, 0.12, 0.02]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.03, 4]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PORTE-BROSSE À DENTS + GOBELET
// ════════════════════════════════════════════════════════════════════════════

const ToothbrushHolder = memo(function ToothbrushHolder({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Gobelet */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.08, 8]} />
        <meshStandardMaterial color="#d8dce8" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Brosses à dents */}
      {[-0.008, 0.008].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]} rotation={[0, 0, (i - 0.5) * 0.15]}>
          <cylinderGeometry args={[0.004, 0.004, 0.12, 4]} />
          <meshStandardMaterial color={i === 0 ? '#3388cc' : '#cc3388'} roughness={0.5} />
        </mesh>
      ))}

      {/* Tube de dentifrice */}
      <mesh position={[0.04, 0.03, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.012, 0.008, 0.08, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0.04, 0.07, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.015, 4]} />
        <meshStandardMaterial color="#22aa44" roughness={0.4} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// PORTE-PEIGNOIR / CROCHET
// ════════════════════════════════════════════════════════════════════════════

const RobeHook = memo(function RobeHook({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Plaque murale */}
      <mesh>
        <boxGeometry args={[0.04, 0.04, 0.015]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Crochet */}
      <mesh position={[0, -0.02, 0.02]}>
        <boxGeometry args={[0.015, 0.04, 0.03]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Peignoir accroché */}
      <mesh position={[0, -0.2, 0.03]} castShadow>
        <boxGeometry args={[0.25, 0.35, 0.04]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.95} />
      </mesh>

      {/* Col du peignoir */}
      <mesh position={[0, -0.03, 0.04]}>
        <boxGeometry args={[0.12, 0.04, 0.05]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// VENTILATEUR D'EXTRACTION
// ════════════════════════════════════════════════════════════════════════════

const ExhaustFan = memo(function ExhaustFan({ position }: { position: [number, number, number] }) {
  const fanRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (fanRef.current) {
      fanRef.current.rotation.z += 0.02
    }
  })

  return (
    <group position={position}>
      {/* Boîtier */}
      <mesh>
        <boxGeometry args={[0.25, 0.04, 0.25]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Grille */}
      <mesh position={[0, -0.025, 0]}>
        <boxGeometry args={[0.22, 0.005, 0.22]} />
        <meshStandardMaterial color="#d0d0d0" roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Fentes de la grille */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, -0.025, -0.08 + i * 0.04]}>
          <boxGeometry args={[0.18, 0.003, 0.015]} />
          <meshStandardMaterial color="#bbb" roughness={0.4} metalness={0.2} />
        </mesh>
      ))}

      {/* Ventilateur (visible à travers la grille) */}
      <mesh ref={fanRef} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 4]} />
        <meshStandardMaterial color="#aaa" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* LED indicateur */}
      <mesh position={[0.1, -0.025, 0.1]}>
        <sphereGeometry args={[0.004, 6, 6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// ÉCLAIRAGE DE LA SALLE DE BAIN
// ════════════════════════════════════════════════════════════════════════════

const BathroomLighting = memo(function BathroomLighting() {
  return (
    <group>
      {/* Plafonnier principal */}
      <group position={[0, 2.35, 0]}>
        <mesh>
          <boxGeometry args={[0.35, 0.03, 0.35]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.015, 0]}>
          <boxGeometry args={[0.3, 0.01, 0.3]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>
        <pointLight position={[0, -0.1, 0]} intensity={0.8} color="#fff8f0" distance={4} decay={2} />
      </group>

      {/* Spots d'accentuation */}
      <spotLight position={[-0.5, 2.3, 0.3]} angle={Math.PI / 6} penumbra={0.7} intensity={0.4} color="#fff8f0" distance={2.5} />
      <spotLight position={[0.5, 2.3, -0.5]} angle={Math.PI / 6} penumbra={0.7} intensity={0.3} color="#fff8f0" distance={2.5} />

      {/* Ambiance */}
      <ambientLight intensity={0.15} color="#e8f0f8" />
    </group>
  )
})