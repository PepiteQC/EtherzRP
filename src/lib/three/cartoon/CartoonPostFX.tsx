/**
 * CartoonPostFX.tsx — Post-processing optimisé + qualité adaptative
 * ------------------------------------------------------------------
 * Couche d'effets pour le look "low-poly cartoon" :
 *   • Bloom doux (fait briller les emissive : néons, phares, accents)
 *   • Anti-aliasing SMAA (léger, propre sur les arêtes low-poly)
 *   • Tone mapping géré par le renderer (voir applyCartoonRenderer)
 *
 * ⚡ ULTRA-OPTIMISÉ :
 *   • Qualité ADAPTATIVE : si le FPS chute, le Bloom se simplifie tout seul.
 *   • DPR adaptatif (drei) : baisse la résolution en cas de surcharge.
 *   • Désactivable d'un flag (quality='off') pour les machines faibles.
 *
 * Dépendances : three, three-stdlib, @react-three/fiber, @react-three/drei
 *   (toutes déjà présentes — AUCUNE installation requise)
 *
 * À copier dans : src/lib/three/CartoonPostFX.tsx
 *
 * Usage :
 *   <Canvas>
 *     <Scene />
 *     <CartoonPostFX />        // qualité auto par défaut
 *   </Canvas>
 *   // + en parallèle, dans le Canvas :
 *   <AdaptiveDpr pixelated />
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer } from 'three-stdlib'
import { RenderPass } from 'three-stdlib'
import { UnrealBloomPass } from 'three-stdlib'
import { SMAAPass } from 'three-stdlib'

export type FXQuality = 'off' | 'low' | 'auto' | 'high'

interface CartoonPostFXProps {
  quality?: FXQuality
  /** Force du Bloom (0.4 doux → 1.2 intense). */
  bloomStrength?: number
  /** Seuil de luminance à partir duquel ça "brille" (0.6 par défaut). */
  bloomThreshold?: number
  bloomRadius?: number
}

export default function CartoonPostFX({
  quality = 'auto',
  bloomStrength = 0.6,
  bloomThreshold = 0.65,
  bloomRadius = 0.5,
}: CartoonPostFXProps) {
  const { gl, scene, camera, size } = useThree()
  const composer = useRef<EffectComposer | null>(null)
  const bloom = useRef<UnrealBloomPass | null>(null)

  // Niveau effectif (peut être abaissé par l'adaptatif)
  const [level, setLevel] = useState<'low' | 'high'>(quality === 'high' ? 'high' : 'low')

  // ── Construction du composer ────────────────────────────────────
  useEffect(() => {
    if (quality === 'off') return

    const c = new EffectComposer(gl)
    c.addPass(new RenderPass(scene, camera))

    const useHigh = quality === 'high' || (quality === 'auto' && level === 'high')

    const bp = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      useHigh ? bloomStrength : bloomStrength * 0.7, // strength
      bloomRadius,
      bloomThreshold,
    )
    c.addPass(bp)
    bloom.current = bp

    // SMAA seulement en qualité haute (sinon on laisse le MSAA du Canvas)
    if (useHigh) {
      c.addPass(new SMAAPass(size.width, size.height))
    }

    composer.current = c
    return () => {
      c.dispose?.()
      composer.current = null
      bloom.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera, quality, level])

  // ── Redimensionnement ───────────────────────────────────────────
  useEffect(() => {
    composer.current?.setSize(size.width, size.height)
  }, [size])

  // ── Qualité ADAPTATIVE : surveille le FPS et descend si besoin ───
  const frames = useRef<number[]>([])
  useFrame((_, dt) => {
    if (quality !== 'auto') return
    const fps = 1 / Math.max(dt, 0.0001)
    const buf = frames.current
    buf.push(fps)
    if (buf.length > 90) buf.shift()
    if (buf.length === 90) {
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length
      if (avg < 45 && level === 'high') setLevel('low')   // ça rame → on allège
      else if (avg > 58 && level === 'low') setLevel('high') // ça respire → on enrichit
      buf.length = 0
    }
  })

  // ── Rendu via le composer (remplace le rendu par défaut) ─────────
  useFrame(() => {
    if (quality === 'off' || !composer.current) {
      gl.render(scene, camera)
      return
    }
    composer.current.render()
  }, 1) // priorité 1 = après les autres useFrame

  return null
}
