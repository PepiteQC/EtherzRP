/**
 * TextureSystem.ts
 * Textures procédurales canvas — singleton par type, réutilisables
 * Toutes les textures sont créées une seule fois via useMemo
 */

import { useMemo } from 'react'
import * as THREE from 'three'

// ─────────────────────────────────────────────
// FACTORY
// ─────────────────────────────────────────────

function createCanvasTexture(
  w: number,
  h: number,
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

// ─────────────────────────────────────────────
// STORE TILE — Sol carrelé intérieur
// ─────────────────────────────────────────────

export function useStoreTileTexture() {
  return useMemo(
    () =>
      createCanvasTexture(
        512,
        512,
        (ctx, w, h) => {
          ctx.fillStyle = '#e2ddd4'
          ctx.fillRect(0, 0, w, h)

          const cols = 8
          const rows = 8
          const tw = w / cols
          const th = h / rows

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const x = c * tw
              const y = r * th
              const base = 210 + Math.random() * 20
              const tint = (r + c) % 2 === 0 ? 5 : -5
              ctx.fillStyle = `rgb(${base + tint},${base + tint - 3},${base + tint - 8})`
              ctx.fillRect(x + 1, y + 1, tw - 2, th - 2)

              // Jointures
              ctx.fillStyle = 'rgba(0,0,0,0.08)'
              ctx.fillRect(x, y, tw, 1)
              ctx.fillRect(x, y, 1, th)
            }
          }

          // Traces de pas subtiles
          ctx.fillStyle = 'rgba(0,0,0,0.02)'
          for (let i = 0; i < 15; i++) {
            ctx.beginPath()
            ctx.ellipse(
              Math.random() * w,
              Math.random() * h,
              8 + Math.random() * 6,
              12 + Math.random() * 8,
              Math.random() * Math.PI,
              0,
              Math.PI * 2
            )
            ctx.fill()
          }
        },
        [4, 4]
      ),
    []
  )
}

// ─────────────────────────────────────────────
// ASPHALT — Parking
// ─────────────────────────────────────────────

export function useAsphaltTexture() {
  return useMemo(
    () =>
      createCanvasTexture(
        512,
        512,
        (ctx, w, h) => {
          ctx.fillStyle = '#2a2a2e'
          ctx.fillRect(0, 0, w, h)

          // Granularité
          for (let i = 0; i < 3000; i++) {
            const shade = 30 + Math.random() * 25
            ctx.fillStyle = `rgb(${shade},${shade},${shade + 2})`
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
          }

          // Fissures
          ctx.strokeStyle = 'rgba(0,0,0,0.15)'
          ctx.lineWidth = 1
          for (let i = 0; i < 5; i++) {
            ctx.beginPath()
            let x = Math.random() * w
            let y = Math.random() * h
            ctx.moveTo(x, y)
            for (let j = 0; j < 8; j++) {
              x += (Math.random() - 0.5) * 60
              y += (Math.random() - 0.5) * 60
              ctx.lineTo(x, y)
            }
            ctx.stroke()
          }

          // Taches d'huile
          for (let i = 0; i < 3; i++) {
            const cx = Math.random() * w
            const cy = Math.random() * h
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20 + Math.random() * 15)
            grad.addColorStop(0, 'rgba(20,18,15,0.2)')
            grad.addColorStop(1, 'rgba(20,18,15,0)')
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, w, h)
          }
        },
        [3, 3]
      ),
    []
  )
}

// ─────────────────────────────────────────────
// EXTERIOR WALL — Stucco / brique
// ─────────────────────────────────────────────

export function useExteriorWallTexture() {
  return useMemo(
    () =>
      createCanvasTexture(
        512,
        256,
        (ctx, w, h) => {
          ctx.fillStyle = '#e8e2d8'
          ctx.fillRect(0, 0, w, h)

          for (let i = 0; i < 2000; i++) {
            const shade = 220 + Math.random() * 20
            ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`
            ctx.fillRect(
              Math.random() * w,
              Math.random() * h,
              1 + Math.random() * 3,
              1 + Math.random() * 3
            )
          }

          for (let y = 0; y < h; y += 32) {
            ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.02})`
            ctx.fillRect(0, y, w, 1)
          }
        },
        [2, 2]
      ),
    []
  )
}

// ─────────────────────────────────────────────
// COUNTER — Bois stratifié
// ─────────────────────────────────────────────

export function useCounterTexture() {
  return useMemo(
    () =>
      createCanvasTexture(256, 256, (ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, 0, w, 0)
        grad.addColorStop(0, '#b8944a')
        grad.addColorStop(0.3, '#c4a050')
        grad.addColorStop(0.6, '#b08838')
        grad.addColorStop(1, '#c0a048')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        // Grain du bois
        for (let y = 0; y < h; y += 3) {
          ctx.fillStyle = `rgba(${80 + Math.random() * 30},${60 + Math.random() * 20},${20 + Math.random() * 15},${0.05 + Math.random() * 0.08})`
          ctx.fillRect(0, y, w, 2)
        }

        // Nœuds
        for (let i = 0; i < 2; i++) {
          ctx.fillStyle = 'rgba(100,70,30,0.12)'
          ctx.beginPath()
          ctx.ellipse(
            Math.random() * w,
            Math.random() * h,
            10 + Math.random() * 8,
            6 + Math.random() * 4,
            Math.random(),
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
      }),
    []
  )
}