import { create } from 'zustand'
import type { CreatorQuality, ObjectCreatorConfig, SavedObjectCreation } from './types'
import { createObjectFromPrompt } from './semanticObjectEngine'

const STORAGE_KEY = 'etherzrp-admin-object-creator-v1'

function loadSaved(): SavedObjectCreation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(saved: SavedObjectCreation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 80))) } catch {}
}

interface ObjectCreatorState {
  prompt: string
  quality: CreatorQuality
  current: ObjectCreatorConfig | null
  saved: SavedObjectCreation[]
  setPrompt: (prompt: string) => void
  setQuality: (quality: CreatorQuality) => void
  generate: (prompt?: string) => ObjectCreatorConfig
  saveCurrent: () => SavedObjectCreation | null
  removeSaved: (id: string) => void
  clearSaved: () => void
}

export const useObjectCreatorStore = create<ObjectCreatorState>((set, get) => ({
  prompt: '',
  quality: 'balanced',
  current: null,
  saved: loadSaved(),

  setPrompt: (prompt) => set({ prompt }),
  setQuality: (quality) => set({ quality }),

  generate: (prompt) => {
    const state = get()
    const config = createObjectFromPrompt(prompt ?? state.prompt, state.quality)
    set({ current: config, prompt: config.prompt })
    return config
  },

  saveCurrent: () => {
    const current = get().current
    if (!current) return null
    const item: SavedObjectCreation = {
      id: current.id,
      prompt: current.prompt,
      name: current.name,
      createdAt: Date.now(),
      config: current,
    }
    const next = [item, ...get().saved.filter(s => s.id !== item.id)].slice(0, 80)
    persist(next)
    set({ saved: next })
    return item
  },

  removeSaved: (id) => {
    const next = get().saved.filter(s => s.id !== id)
    persist(next)
    set({ saved: next })
  },

  clearSaved: () => {
    persist([])
    set({ saved: [] })
  },
}))
