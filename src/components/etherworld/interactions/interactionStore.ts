import { create } from 'zustand'
import type { InteractionHit, InteractionTarget } from './interactionTypes'

interface InteractionState {
  targets: Record<string, InteractionTarget>
  hovered: InteractionHit | null
  selected: InteractionTarget | null
  lastAction: { target: InteractionTarget; timestamp: number } | null
  registerTarget: (target: InteractionTarget) => void
  unregisterTarget: (id: string) => void
  setHovered: (hit: InteractionHit | null) => void
  setSelected: (target: InteractionTarget | null) => void
  markAction: (target: InteractionTarget) => void
  getTarget: (id: string) => InteractionTarget | undefined
  getTargetsByTag: (tag: string) => InteractionTarget[]
  clear: () => void
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  targets: {},
  hovered: null,
  selected: null,
  lastAction: null,

  registerTarget: (target) => set((s) => ({
    targets: { ...s.targets, [target.id]: { enabled: true, radius: 3.2, priority: 0, ...target } },
  })),

  unregisterTarget: (id) => set((s) => {
    const next = { ...s.targets }
    delete next[id]
    return {
      targets: next,
      hovered: s.hovered?.target.id === id ? null : s.hovered,
      selected: s.selected?.id === id ? null : s.selected,
    }
  }),

  setHovered: (hit) => set({ hovered: hit }),
  setSelected: (target) => set({ selected: target }),
  markAction: (target) => set({ lastAction: { target, timestamp: Date.now() } }),
  getTarget: (id) => get().targets[id],
  getTargetsByTag: (tag) => Object.values(get().targets).filter(t => t.tags?.includes(tag)),
  clear: () => set({ targets: {}, hovered: null, selected: null, lastAction: null }),
}))
