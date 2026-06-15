/**
 * cartoonMaterials.ts — Matériaux flat-shaded pré-réglés (low-poly cartoon)
 * ------------------------------------------------------------------------
 * Des matériaux Three.js prêts à l'emploi, cohérents avec cartoonTokens.
 * Tous flat-shaded (low-poly) et MIS EN CACHE (réutilisés = perf++).
 *
 * Usage 3D vanilla :
 *   import { cartoonMat } from './cartoonMaterials'
 *   const mesh = new THREE.Mesh(geo, cartoonMat('grass'))
 *
 * Usage R3F :
 *   <mesh geometry={geo} material={cartoonMat('brick')} />
 *
 * À copier dans : src/lib/three/cartoonMaterials.ts
 */

import * as THREE from 'three'
import { HEX, RENDER } from './cartoonTokens'

type MatKey = keyof typeof HEX

const cache = new Map<string, THREE.MeshStandardMaterial>()

/**
 * Renvoie un MeshStandardMaterial flat-shaded mis en cache.
 * @param key   couleur depuis la palette (ex: 'grass', 'brick', 'primary')
 * @param opts  surcharges (emissive cartoon, rugosité, etc.)
 */
export function cartoonMat(
  key: MatKey,
  opts: { emissive?: MatKey; emissiveIntensity?: number; roughness?: number; metalness?: number } = {},
): THREE.MeshStandardMaterial {
  const id = `${key}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? ''}|${opts.roughness ?? ''}|${opts.metalness ?? ''}`
  const hit = cache.get(id)
  if (hit) return hit

  const mat = new THREE.MeshStandardMaterial({
    color: HEX[key],
    flatShading: true,          // ← signature low-poly
    roughness: opts.roughness ?? 0.85, // mat, peu de reflets = cartoon
    metalness: opts.metalness ?? 0.0,
  })
  if (opts.emissive) {
    mat.emissive = new THREE.Color(HEX[opts.emissive])
    mat.emissiveIntensity = opts.emissiveIntensity ?? 0.6 // pour le Bloom
  }
  cache.set(id, mat)
  return mat
}

/** Matériau "néon/glow" qui ressort avec le Bloom (enseignes, phares). */
export function glowMat(key: MatKey, intensity = 1.4): THREE.MeshStandardMaterial {
  return cartoonMat(key, { emissive: key, emissiveIntensity: intensity })
}

/** Configure un renderer pour le rendu cartoon (tone mapping doux + ombres douces). */
export function applyCartoonRenderer(renderer: THREE.WebGLRenderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = RENDER.toneMappingExposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap // ombres douces
}

/** Vide le cache (utile en hot-reload / tests). */
export function clearMaterialCache() {
  cache.forEach((m) => m.dispose())
  cache.clear()
}
