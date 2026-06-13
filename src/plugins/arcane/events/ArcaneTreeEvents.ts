import * as THREE from 'three'

export const ARCANE_TREE_EXPLODE_EVENT = 'etherworld:arcane-tree-explode'

export interface ArcaneTreeExplodePayload {
  id: string
  position: [number, number, number]
  radius: number
  intensity: number
  color?: string
  casterId?: string
  reason?: string
  createdAt: number
}

export function normalizeVec3(position: THREE.Vector3 | [number, number, number]): [number, number, number] {
  return Array.isArray(position) ? position : [position.x, position.y, position.z]
}

export function castArcaneTreeExplosion(params: {
  position: THREE.Vector3 | [number, number, number]
  radius?: number
  intensity?: number
  color?: string
  casterId?: string
  reason?: string
}) {
  const payload: ArcaneTreeExplodePayload = {
    id: `arcane_tree_explode_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    position: normalizeVec3(params.position),
    radius: params.radius ?? 10,
    intensity: params.intensity ?? 1,
    color: params.color ?? '#58e6ff',
    casterId: params.casterId ?? 'owner-local',
    reason: params.reason ?? 'arcane_tree_explosion',
    createdAt: Date.now(),
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ArcaneTreeExplodePayload>(ARCANE_TREE_EXPLODE_EVENT, { detail: payload }))
  }

  return payload
}

export function subscribeArcaneTreeExplosion(callback: (payload: ArcaneTreeExplodePayload) => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = (event: Event) => callback((event as CustomEvent<ArcaneTreeExplodePayload>).detail)
  window.addEventListener(ARCANE_TREE_EXPLODE_EVENT, handler)
  return () => window.removeEventListener(ARCANE_TREE_EXPLODE_EVENT, handler)
}

declare global {
  interface Window {
    etherworldArcane?: {
      treeExplode: typeof castArcaneTreeExplosion
      castAt?: (type: string, position: [number, number, number], options?: Record<string, unknown>) => unknown
    }
  }
}

export function installArcaneTreeWindowApi() {
  if (typeof window === 'undefined') return
  window.etherworldArcane = {
    ...(window.etherworldArcane ?? {}),
    treeExplode: castArcaneTreeExplosion,
    castAt: (type, position, options = {}) => {
      if (type === 'tree.explode' || type === 'trees.explode' || type === 'arcane.tree.explode') {
        return castArcaneTreeExplosion({
          position,
          radius: Number(options.radius ?? 10),
          intensity: Number(options.intensity ?? 1),
          color: String(options.color ?? '#58e6ff'),
          casterId: String(options.casterId ?? 'owner-local'),
          reason: String(options.reason ?? 'window_api'),
        })
      }
      throw new Error(`Unknown arcane cast type: ${type}`)
    },
  }
}
