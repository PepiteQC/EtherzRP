'use client'

import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface WindowWithCurtainsProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  size?: [number, number]
  curtainColor?: string
  curtainOpen?: number // 0 = fermé, 1 = complètement ouvert
  frameColor?: string
  isNight?: boolean
  hasBlind?: boolean
  blindOpen?: number // 0 = fermé, 1 = ouvert
  hasCondensation?: boolean
  windowStyle?: 'single' | 'double' | 'triple' | 'french'
}

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

// Texture tissu rideau — plis verticaux
function useCurtainTexture(color: string) {
  return useMemo(() => createCanvasTexture(128, 256, (ctx, w, h) => {
    // Base
    ctx.fillStyle = color
    ctx.fillRect(0, 0, w, h)

    // Plis verticaux (ombres + reflets)
    const foldW = w / 6
    for (let i = 0; i < 6; i++) {
      const x = i * foldW
      // Ombre du pli
      const shadowGrad = ctx.createLinearGradient(x, 0, x + foldW, 0)
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.15)')
      shadowGrad.addColorStop(0.3, 'rgba(0,0,0,0)')
      shadowGrad.addColorStop(0.7, 'rgba(255,255,255,0.05)')
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0.12)')
      ctx.fillStyle = shadowGrad
      ctx.fillRect(x, 0, foldW, h)
    }

    // Texture tissu (fibres)
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.015})`
      ctx.fillRect(0, y, w, 1)
    }
    for (let x = 0; x < w; x += 3) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.01})`
      ctx.fillRect(x, 0, 1, h)
    }

    // Ourlet du bas
    ctx.fillStyle = 'rgba(0,0,0,0.06)'
    ctx.fillRect(0, h - 8, w, 8)
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.fillRect(0, h - 10, w, 2)
  }), [color])
}

// Texture vitre avec reflets
function useGlassTexture() {
  return useMemo(() => createCanvasTexture(128, 128, (ctx, w, h) => {
    // Base transparente bleutée
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, 'rgba(30,58,95,0.3)')
    grad.addColorStop(0.4, 'rgba(25,50,85,0.25)')
    grad.addColorStop(1, 'rgba(20,42,75,0.35)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Reflet principal (diagonale lumineuse)
    const reflectGrad = ctx.createLinearGradient(0, 0, w * 0.6, h * 0.6)
    reflectGrad.addColorStop(0, 'rgba(255,255,255,0.08)')
    reflectGrad.addColorStop(0.5, 'rgba(255,255,255,0.02)')
    reflectGrad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = reflectGrad
    ctx.fillRect(0, 0, w, h)

    // Petit reflet secondaire
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.beginPath()
    ctx.ellipse(w * 0.7, h * 0.3, w * 0.15, h * 0.25, -0.3, 0, Math.PI * 2)
    ctx.fill()
  }), [])
}

// Texture bois pour cadre
function useFrameTexture() {
  return useMemo(() => createCanvasTexture(64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, w, h)
    // Grain bois
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.008})`
      ctx.fillRect(0, y, w, 1)
    }
    // Variation de teinte
    for (let i = 0; i < 100; i++) {
      const s = 28 + Math.random() * 10
      ctx.fillStyle = `rgba(${s},${s + 5},${s + 12},0.03)`
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3)
    }
  }), [])
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export const WindowWithCurtains = memo(function WindowWithCurtains({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  size = [3, 2.2],
  curtainColor = '#1e293b',
  curtainOpen = 0.6,
  frameColor = '#1f2937',
  isNight = true,
  hasBlind = false,
  blindOpen = 0.8,
  hasCondensation = false,
  windowStyle = 'double',
}: WindowWithCurtainsProps) {
  const curtainTex = useCurtainTexture(curtainColor)
  const glassTex = useGlassTexture()
  const frameTex = useFrameTexture()

  const curtainW = size[0] * (1 - curtainOpen) * 0.45
  const curtainSpread = size[0] * curtainOpen * 0.25

  // Panes selon le style
  const panes = useMemo(() => {
    switch (windowStyle) {
      case 'single': return [{ x: 0, w: size[0] - 0.1 }]
      case 'triple': return [
        { x: -(size[0] / 3), w: size[0] / 3 - 0.05 },
        { x: 0, w: size[0] / 3 - 0.05 },
        { x: size[0] / 3, w: size[0] / 3 - 0.05 },
      ]
      case 'french': return [
        { x: -size[0] / 4, w: size[0] / 2 - 0.05 },
        { x: size[0] / 4, w: size[0] / 2 - 0.05 },
      ]
      default: return [ // double
        { x: -size[0] / 4, w: size[0] / 2 - 0.04 },
        { x: size[0] / 4, w: size[0] / 2 - 0.04 },
      ]
    }
  }, [windowStyle, size])

  return (
    <group position={position} rotation={rotation}>
      {/* ══ CADRE EXTÉRIEUR ══ */}
      <WindowFrame size={size} color={frameColor} texture={frameTex} />

      {/* ══ VITRES ══ */}
      {panes.map((pane, i) => (
        <WindowPane
          key={`pane-${i}`}
          position={[pane.x, 0, 0.02]}
          width={pane.w}
          height={size[1] - 0.12}
          glassTex={glassTex}
          hasCondensation={hasCondensation}
          isNight={isNight}
        />
      ))}

      {/* Croisillons entre les vitres */}
      {windowStyle !== 'single' && panes.slice(0, -1).map((_, i) => {
        const nextPane = panes[i + 1]
        const midX = (panes[i].x + nextPane.x) / 2
        return (
          <mesh key={`mullion-${i}`} position={[midX, 0, 0.03]}>
            <boxGeometry args={[0.04, size[1] - 0.08, 0.06]} />
            <meshStandardMaterial color={frameColor} metalness={0.3} roughness={0.65} />
          </mesh>
        )
      })}

      {/* Traverse horizontale (milieu) */}
      {windowStyle === 'double' && (
        <mesh position={[0, 0.1, 0.03]}>
          <boxGeometry args={[size[0] - 0.08, 0.03, 0.05]} />
          <meshStandardMaterial color={frameColor} metalness={0.3} roughness={0.65} />
        </mesh>
      )}

      {/* ══ VUE EXTÉRIEURE (lumières de la ville la nuit) ══ */}
      <CityView size={size} isNight={isNight} />

      {/* ══ STORE VÉNITIEN (optionnel) ══ */}
      {hasBlind && (
        <VenetianBlind
          size={size}
          openAmount={blindOpen}
          position={[0, 0, 0.06]}
        />
      )}

      {/* ══ TRINGLE À RIDEAUX ══ */}
      <CurtainRod size={size} />

      {/* ══ RIDEAUX ══ */}
      <Curtain
        position={[-(size[0] / 2) + curtainW / 2 - curtainSpread, 0, 0.1]}
        width={curtainW}
        height={size[1] + 0.15}
        texture={curtainTex}
        side="left"
        openAmount={curtainOpen}
      />
      <Curtain
        position={[(size[0] / 2) - curtainW / 2 + curtainSpread, 0, 0.1]}
        width={curtainW}
        height={size[1] + 0.15}
        texture={curtainTex}
        side="right"
        openAmount={curtainOpen}
      />

      {/* ══ REBORD DE FENÊTRE ══ */}
      <WindowSill size={size} />

      {/* ══ CONDENSATION (optionnelle) ══ */}
      {hasCondensation && <CondensationEffect size={size} />}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// CADRE DE FENÊTRE
// ════════════════════════════════════════════════════════════════════════════

const WindowFrame = memo(function WindowFrame({
  size, color, texture,
}: {
  size: [number, number]; color: string; texture: THREE.CanvasTexture
}) {
  const frameW = 0.06
  const totalW = size[0] + frameW * 2
  const totalH = size[1] + frameW * 2

  return (
    <group>
      {/* Cadre extérieur complet */}
      {/* Haut */}
      <mesh position={[0, size[1] / 2 + frameW / 2, 0]} castShadow>
        <boxGeometry args={[totalW, frameW, 0.1]} />
        <meshStandardMaterial map={texture} color={color} metalness={0.3} roughness={0.65} />
      </mesh>
      {/* Bas */}
      <mesh position={[0, -size[1] / 2 - frameW / 2, 0]} castShadow>
        <boxGeometry args={[totalW, frameW, 0.1]} />
        <meshStandardMaterial map={texture} color={color} metalness={0.3} roughness={0.65} />
      </mesh>
      {/* Gauche */}
      <mesh position={[-size[0] / 2 - frameW / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameW, size[1], 0.1]} />
        <meshStandardMaterial map={texture} color={color} metalness={0.3} roughness={0.65} />
      </mesh>
      {/* Droit */}
      <mesh position={[size[0] / 2 + frameW / 2, 0, 0]} castShadow>
        <boxGeometry args={[frameW, size[1], 0.1]} />
        <meshStandardMaterial map={texture} color={color} metalness={0.3} roughness={0.65} />
      </mesh>

      {/* Moulure intérieure (plus fine) */}
      {/* Haut */}
      <mesh position={[0, size[1] / 2 - 0.01, 0.04]}>
        <boxGeometry args={[size[0] + 0.02, 0.02, 0.015]} />
        <meshStandardMaterial color="#2a3040" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Bas */}
      <mesh position={[0, -size[1] / 2 + 0.01, 0.04]}>
        <boxGeometry args={[size[0] + 0.02, 0.02, 0.015]} />
        <meshStandardMaterial color="#2a3040" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Joint d'étanchéité (ligne noire fine) */}
      <mesh position={[0, size[1] / 2 - 0.005, 0.05]}>
        <boxGeometry args={[size[0] - 0.02, 0.005, 0.005]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      <mesh position={[0, -size[1] / 2 + 0.005, 0.05]}>
        <boxGeometry args={[size[0] - 0.02, 0.005, 0.005]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>

      {/* Poignée / crémone de fenêtre */}
      <mesh position={[size[0] / 4 + 0.02, -0.1, 0.06]}>
        <boxGeometry args={[0.06, 0.02, 0.025]} />
        <meshStandardMaterial color="#888" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[size[0] / 4 + 0.02, -0.1, 0.08]}>
        <boxGeometry args={[0.04, 0.01, 0.015]} />
        <meshStandardMaterial color="#999" metalness={0.85} roughness={0.15} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// VITRE INDIVIDUELLE
// ════════════════════════════════════════════════════════════════════════════

const WindowPane = memo(function WindowPane({
  position, width, height, glassTex, hasCondensation, isNight,
}: {
  position: [number, number, number]
  width: number; height: number
  glassTex: THREE.CanvasTexture
  hasCondensation: boolean
  isNight: boolean
}) {
  return (
    <group position={position}>
      {/* Vitre */}
      <mesh>
        <boxGeometry args={[width, height, 0.015]} />
        <meshPhysicalMaterial
          map={glassTex}
          color={isNight ? '#1e3a5f' : '#4a7a9f'}
          transparent
          opacity={isNight ? 0.35 : 0.25}
          metalness={0.85}
          roughness={0.05}
          ior={1.5}
          transmission={isNight ? 0 : 0.3}
          thickness={0.015}
        />
      </mesh>

      {/* Reflet lumineux (bande diagonale) */}
      <mesh position={[-width * 0.15, height * 0.1, 0.01]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[width * 0.08, height * 0.6, 0.001]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={isNight ? 0.025 : 0.05}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// VUE EXTÉRIEURE — Lumières de la ville
// ════════════════════════════════════════════════════════════════════════════

const CityView = memo(function CityView({ size, isNight }: { size: [number, number]; isNight: boolean }) {
  const lights = useMemo(() => {
    const arr: Array<{
      x: number; y: number
      color: string; size: [number, number]
      intensity: number; type: 'window' | 'sign' | 'street'
    }> = []

    if (!isNight) return arr

    // Fenêtres de bâtiments lointains
    for (let i = 0; i < 30; i++) {
      const colors = ['#fef3c7', '#fde68a', '#fbbf24', '#f59e0b', '#80deea', '#ffe0b2']
      arr.push({
        x: (Math.random() - 0.5) * size[0] * 0.85,
        y: (Math.random() - 0.5) * size[1] * 0.7 - size[1] * 0.05,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: [0.02 + Math.random() * 0.03, 0.015 + Math.random() * 0.02],
        intensity: 0.4 + Math.random() * 0.5,
        type: 'window',
      })
    }

    // Enseignes lumineuses
    for (let i = 0; i < 4; i++) {
      const signColors = ['#ff4444', '#4488ff', '#44ff44', '#ff8800']
      arr.push({
        x: (Math.random() - 0.5) * size[0] * 0.7,
        y: (Math.random() - 0.3) * size[1] * 0.3,
        color: signColors[i],
        size: [0.08 + Math.random() * 0.06, 0.02],
        intensity: 0.6 + Math.random() * 0.3,
        type: 'sign',
      })
    }

    // Lampadaires (en bas)
    for (let i = 0; i < 6; i++) {
      arr.push({
        x: -size[0] * 0.4 + i * (size[0] * 0.8 / 5),
        y: -size[1] * 0.42,
        color: '#fef3c7',
        size: [0.015, 0.025],
        intensity: 0.7,
        type: 'street',
      })
    }

    return arr
  }, [size, isNight])

  // Skyline silhouette
  const skyline = useMemo(() => {
    if (!isNight) return []
    const buildings: Array<{ x: number; w: number; h: number }> = []
    let x = -size[0] * 0.45
    while (x < size[0] * 0.45) {
      const w = 0.05 + Math.random() * 0.15
      const h = 0.1 + Math.random() * size[1] * 0.5
      buildings.push({ x, w, h })
      x += w + 0.01 + Math.random() * 0.03
    }
    return buildings
  }, [size, isNight])

  if (!isNight) {
    // Vue de jour — ciel bleu + nuages
    return (
      <group>
        {/* Ciel */}
        <mesh position={[0, size[1] * 0.15, -0.05]}>
          <boxGeometry args={[size[0] - 0.1, size[1] - 0.1, 0.01]} />
          <meshStandardMaterial color="#6aacde" roughness={0.9} />
        </mesh>
        {/* Nuages */}
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={i} position={[(Math.random() - 0.5) * size[0] * 0.6, size[1] * 0.2 + Math.random() * size[1] * 0.15, -0.04]}>
            <boxGeometry args={[0.15 + Math.random() * 0.2, 0.04 + Math.random() * 0.03, 0.005]} />
            <meshStandardMaterial color="#e8e8f0" roughness={0.95} transparent opacity={0.6} />
          </mesh>
        ))}
        {/* Sol/horizon */}
        <mesh position={[0, -size[1] * 0.35, -0.05]}>
          <boxGeometry args={[size[0] - 0.1, size[1] * 0.3, 0.01]} />
          <meshStandardMaterial color="#4a6a3a" roughness={0.9} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      {/* Fond ciel nocturne */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[size[0] - 0.1, size[1] - 0.1, 0.01]} />
        <meshStandardMaterial color="#050510" roughness={0.95} />
      </mesh>

      {/* Gradient horizon */}
      <mesh position={[0, -size[1] * 0.3, -0.055]}>
        <boxGeometry args={[size[0] - 0.1, size[1] * 0.15, 0.005]} />
        <meshStandardMaterial color="#0a1525" roughness={0.9} />
      </mesh>

      {/* Étoiles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`star-${i}`} position={[(Math.random() - 0.5) * size[0] * 0.7, size[1] * 0.15 + Math.random() * size[1] * 0.25, -0.04]}>
          <boxGeometry args={[0.008, 0.008, 0.002]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3 + Math.random() * 0.3} />
        </mesh>
      ))}

      {/* Silhouette des bâtiments */}
      {skyline.map((bldg, i) => (
        <mesh key={`bldg-${i}`} position={[bldg.x, -size[1] * 0.45 + bldg.h / 2, -0.045]}>
          <boxGeometry args={[bldg.w, bldg.h, 0.005]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.9} />
        </mesh>
      ))}

      {/* Lumières */}
      {lights.map((light, i) => (
        <mesh key={i} position={[light.x, light.y, -0.03]}>
          <boxGeometry args={[light.size[0], light.size[1], 0.005]} />
          <meshStandardMaterial
            color={light.color}
            emissive={light.color}
            emissiveIntensity={light.intensity}
          />
        </mesh>
      ))}

      {/* Lune (si visible) */}
      <mesh position={[size[0] * 0.3, size[1] * 0.3, -0.04]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial color="#f0e8d0" emissive="#f0e8d0" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// STORE VÉNITIEN
// ════════════════════════════════════════════════════════════════════════════

const VenetianBlind = memo(function VenetianBlind({
  size, openAmount, position,
}: {
  size: [number, number]; openAmount: number; position: [number, number, number]
}) {
  const slats = Math.floor(size[1] / 0.04)
  const slatAngle = openAmount * (Math.PI / 3)

  return (
    <group position={position}>
      {/* Boîtier haut */}
      <mesh position={[0, size[1] / 2 + 0.02, 0]}>
        <boxGeometry args={[size[0] - 0.08, 0.04, 0.03]} />
        <meshStandardMaterial color="#e0dcd4" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Lamelles */}
      {Array.from({ length: Math.min(slats, 50) }).map((_, i) => {
        const y = size[1] / 2 - 0.03 - i * (size[1] / slats)
        const visibleH = size[1] * (1 - openAmount * 0.4)
        if (y < -size[1] / 2 + 0.02) return null
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[slatAngle, 0, 0]}>
            <boxGeometry args={[size[0] - 0.12, 0.008, 0.025]} />
            <meshStandardMaterial color="#ddd8d0" roughness={0.5} metalness={0.05} side={THREE.DoubleSide} />
          </mesh>
        )
      })}

      {/* Cordons */}
      {[-size[0] / 2 + 0.15, size[0] / 2 - 0.15].map((x, i) => (
        <mesh key={`cord-${i}`} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, size[1], 4]} />
          <meshStandardMaterial color="#c8c0b8" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// TRINGLE À RIDEAUX
// ════════════════════════════════════════════════════════════════════════════

const CurtainRod = memo(function CurtainRod({ size }: { size: [number, number] }) {
  const rodLen = size[0] + 0.5

  return (
    <group position={[0, size[1] / 2 + 0.18, 0.08]}>
      {/* Tringle principale */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, rodLen, 8]} />
        <meshStandardMaterial color="#4a4a5a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Embouts décoratifs */}
      {[-rodLen / 2 - 0.02, rodLen / 2 + 0.02].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#3a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Supports muraux */}
      {[-rodLen / 2 + 0.1, 0, rodLen / 2 - 0.1].map((x, i) => (
        <group key={`bracket-${i}`} position={[x, 0, -0.04]}>
          <mesh>
            <boxGeometry args={[0.04, 0.04, 0.08]} />
            <meshStandardMaterial color="#4a4a5a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Vis */}
          <mesh position={[0, 0, -0.04]}>
            <cylinderGeometry args={[0.005, 0.005, 0.01, 4]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Anneaux de rideau */}
      {Array.from({ length: Math.floor(rodLen / 0.08) }).map((_, i) => (
        <mesh key={`ring-${i}`} position={[-rodLen / 2 + 0.08 + i * 0.08, 0, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.018, 0.003, 6, 8]} />
          <meshStandardMaterial color="#5a5a6a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// RIDEAU INDIVIDUEL
// ════════════════════════════════════════════════════════════════════════════

const Curtain = memo(function Curtain({
  position, width, height, texture, side, openAmount,
}: {
  position: [number, number, number]
  width: number; height: number
  texture: THREE.CanvasTexture
  side: 'left' | 'right'
  openAmount: number
}) {
  const curtainRef = useRef<THREE.Group>(null)

  // Ondulation subtile
  useFrame((state) => {
    if (curtainRef.current) {
      curtainRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + (side === 'left' ? 0 : 1.5)) * 0.008
    }
  })

  if (width < 0.02) return null

  // Nombre de plis
  const folds = Math.max(2, Math.floor(width / 0.08))
  const foldW = width / folds

  return (
    <group position={position} ref={curtainRef}>
      {/* Tissu principal avec plis */}
      {Array.from({ length: folds }).map((_, i) => {
        const x = -width / 2 + foldW / 2 + i * foldW
        const zOffset = Math.sin(i * 0.8) * 0.012
        const shade = 0.92 + Math.sin(i * 1.2) * 0.08

        return (
          <mesh key={i} position={[x, 0, zOffset]} castShadow>
            <boxGeometry args={[foldW, height, 0.015]} />
            <meshStandardMaterial
              map={texture}
              color={new THREE.Color(shade, shade, shade)}
              roughness={0.88}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}

      {/* Ourlet du bas (plus épais) */}
      <mesh position={[0, -height / 2 + 0.02, 0]}>
        <boxGeometry args={[width, 0.04, 0.02]} />
        <meshStandardMaterial map={texture} color="#888" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Embrasse (lien latéral si partiellement ouvert) */}
      {openAmount > 0.3 && openAmount < 0.9 && (
        <group position={[side === 'left' ? width / 2 : -width / 2, -height * 0.15, 0.02]}>
          <mesh>
            <torusGeometry args={[0.03, 0.005, 6, 8]} />
            <meshStandardMaterial color="#8b6914" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Cordon */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.1, 4]} />
            <meshStandardMaterial color="#8b6914" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Pompon */}
          <mesh position={[0, -0.12, 0]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshStandardMaterial color="#6b4914" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// REBORD DE FENÊTRE
// ════════════════════════════════════════════════════════════════════════════

const WindowSill = memo(function WindowSill({ size }: { size: [number, number] }) {
  return (
    <group position={[0, -size[1] / 2 - 0.04, 0.06]}>
      {/* Rebord principal */}
      <mesh castShadow>
        <boxGeometry args={[size[0] + 0.15, 0.03, 0.15]} />
        <meshStandardMaterial color="#d0ccc4" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Nez du rebord (arrondi simulé) */}
      <mesh position={[0, -0.01, 0.075]}>
        <boxGeometry args={[size[0] + 0.15, 0.015, 0.02]} />
        <meshStandardMaterial color="#c8c4bc" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* Sous-rebord */}
      <mesh position={[0, -0.025, 0.04]}>
        <boxGeometry args={[size[0] + 0.1, 0.01, 0.1]} />
        <meshStandardMaterial color="#bab6ae" roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EFFET DE CONDENSATION
// ════════════════════════════════════════════════════════════════════════════

const CondensationEffect = memo(function CondensationEffect({ size }: { size: [number, number] }) {
  const drops = useMemo(() => {
    const arr: Array<{ x: number; y: number; r: number }> = []
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: (Math.random() - 0.5) * size[0] * 0.8,
        y: -size[1] * 0.1 + Math.random() * size[1] * 0.5,
        r: 0.003 + Math.random() * 0.008,
      })
    }
    return arr
  }, [size])

  return (
    <group position={[0, 0, 0.035]}>
      {/* Voile de buée */}
      <mesh position={[0, -size[1] * 0.2, 0]}>
        <boxGeometry args={[size[0] * 0.9, size[1] * 0.5, 0.002]} />
        <meshStandardMaterial color="#a8c8e0" transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* Gouttelettes */}
      {drops.map((drop, i) => (
        <mesh key={i} position={[drop.x, drop.y, 0]}>
          <sphereGeometry args={[drop.r, 6, 6]} />
          <meshStandardMaterial color="#c8dce8" transparent opacity={0.15} roughness={0.05} metalness={0.3} />
        </mesh>
      ))}

      {/* Traces de coulures */}
      {Array.from({ length: 5 }).map((_, i) => {
        const x = (Math.random() - 0.5) * size[0] * 0.6
        const startY = Math.random() * size[1] * 0.2
        return (
          <mesh key={`trail-${i}`} position={[x, startY - 0.15, 0]}>
            <boxGeometry args={[0.003, 0.15 + Math.random() * 0.1, 0.001]} />
            <meshStandardMaterial color="#b8d0e0" transparent opacity={0.08} depthWrite={false} />
          </mesh>
        )
      })}
    </group>
  )
})