import { create } from 'zustand'

export interface SceneObject {
  id: string
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  color: string
}

interface EditorState {
  objects: SceneObject[]
  selectedId: string | null
  addObject: (obj: Omit<SceneObject, 'id'>) => void
  removeObject: (id: string) => void
  updateObject: (id: string, updates: Partial<SceneObject>) => void
  selectObject: (id: string | null) => void
  clearScene: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  objects: [],
  selectedId: null,

  addObject: (obj) => {
    const id = `obj_${Date.now()}`
    set((state) => ({
      objects: [...state.objects, { ...obj, id }],
      selectedId: id
    }))
  },

  removeObject: (id) => {
    set((state) => ({
      objects: state.objects.filter(o => o.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    }))
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map(obj =>
        obj.id === id ? { ...obj, ...updates } : obj
      )
    }))
  },

  selectObject: (id) => set({ selectedId: id }),

  clearScene: () => set({ objects: [], selectedId: null })
}))
