import type { ThreeEvent } from '@react-three/fiber'
import type * as THREE from 'three'

export type InteractionKind =
  | 'building'
  | 'door'
  | 'vehicle'
  | 'npc'
  | 'shop'
  | 'terminal'
  | 'prop'
  | 'loot'
  | 'job'
  | 'garage'
  | 'police'
  | 'hotel'
  | 'custom'

export type InteractionVerb =
  | 'use'
  | 'enter'
  | 'talk'
  | 'buy'
  | 'inspect'
  | 'open'
  | 'repair'
  | 'refuel'
  | 'pickup'
  | 'startJob'
  | 'custom'

export interface InteractionTarget {
  id: string
  kind: InteractionKind
  verb: InteractionVerb
  label: string
  prompt?: string
  position?: [number, number, number]
  radius?: number
  enabled?: boolean
  priority?: number
  tags?: string[]
  data?: Record<string, unknown>
}

export interface InteractionHit {
  target: InteractionTarget
  distance: number
  point?: THREE.Vector3
  object?: THREE.Object3D
}

export interface InteractionPointerPayload {
  target: InteractionTarget
  event: ThreeEvent<PointerEvent>
}

export interface InteractionActionPayload {
  target: InteractionTarget
  source: 'pointer' | 'keyboard' | 'script'
  event?: ThreeEvent<MouseEvent> | ThreeEvent<PointerEvent>
}

export type InteractionHandler = (payload: InteractionActionPayload) => void | boolean | Promise<void | boolean>

export const INTERACTION_EVENT = {
  hover: 'ether-interaction-hover',
  blur: 'ether-interaction-blur',
  action: 'ether-interaction-action',
  context: 'ether-interaction-context',
} as const

export function buildPrompt(target: InteractionTarget) {
  if (target.prompt) return target.prompt

  const verbLabel: Record<InteractionVerb, string> = {
    use: 'Utiliser',
    enter: 'Entrer',
    talk: 'Parler',
    buy: 'Acheter',
    inspect: 'Inspecter',
    open: 'Ouvrir',
    repair: 'Réparer',
    refuel: 'Faire le plein',
    pickup: 'Ramasser',
    startJob: 'Commencer',
    custom: 'Interagir',
  }

  return `${verbLabel[target.verb] ?? 'Interagir'} — ${target.label}`
}

export function dispatchInteractionDomEvent<T>(name: string, detail: T) {
  window.dispatchEvent(new CustomEvent(name, { detail }))
}
