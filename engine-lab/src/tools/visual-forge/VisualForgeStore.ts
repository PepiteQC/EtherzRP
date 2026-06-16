import { create } from 'zustand'
import { analyzeImageFile } from './lib/imageAnalyzer'
import {
  createGeneratedModel,
  downloadObj,
  smoothHeightField,
} from './lib/modelGenerator'
import type {
  ForgeLog,
  ForgeNode,
  ForgeStage,
  GeneratedModel,
  ImageAnalysis,
} from './types'

const createNodes = (): ForgeNode[] => [
  { id: 'source', label: 'Source', status: 'idle', message: 'Image en attente' },
  { id: 'analysis', label: 'Analyse', status: 'idle', message: 'Pixels et contours' },
  { id: 'relief', label: 'Relief', status: 'idle', message: 'Champ de hauteur' },
  { id: 'model', label: 'Modèle', status: 'idle', message: 'Maillage 3D' },
  { id: 'validation', label: 'Validation', status: 'idle', message: 'Contrôle final' },
]

interface VisualForgeState {
  sourceFile: File | null
  sourceUrl: string | null
  analysis: ImageAnalysis | null
  model: GeneratedModel | null
  stage: ForgeStage
  progress: number
  nodes: ForgeNode[]
  logs: ForgeLog[]
  error: string | null

  importFile: (file: File) => void
  runPipeline: () => Promise<void>
  exportObj: () => void
  reset: () => void
}

function log(message: string, level: ForgeLog['level'] = 'info'): ForgeLog {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    level,
    message,
  }
}

export const useVisualForgeStore = create<VisualForgeState>((set, get) => ({
  sourceFile: null,
  sourceUrl: null,
  analysis: null,
  model: null,
  stage: 'idle',
  progress: 0,
  nodes: createNodes(),
  logs: [],
  error: null,

  importFile(file) {
    if (!file.type.startsWith('image/')) {
      set((state) => ({
        stage: 'error',
        error: 'Le fichier doit être une image.',
        logs: [log('Import refusé : format invalide.', 'error'), ...state.logs],
      }))
      return
    }

    const previousUrl = get().sourceUrl
    if (previousUrl) URL.revokeObjectURL(previousUrl)

    set((state) => ({
      sourceFile: file,
      sourceUrl: URL.createObjectURL(file),
      analysis: null,
      model: null,
      stage: 'ready',
      progress: 0,
      nodes: createNodes(),
      error: null,
      logs: [log(`Image chargée : ${file.name}`, 'success'), ...state.logs],
    }))
  },

  async runPipeline() {
    const file = get().sourceFile

    if (!file) {
      set({
        stage: 'error',
        error: 'Ajoute une image avant de lancer Visual Forge.',
      })
      return
    }

    const updateNode = (
      id: string,
      status: ForgeNode['status'],
      message: string
    ) =>
      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === id ? { ...node, status, message } : node
        ),
      }))

    try {
      set({ stage: 'running', progress: 5, error: null, model: null })

      updateNode('source', 'running', 'Lecture du fichier')
      await Promise.resolve()
      updateNode('source', 'complete', 'Image valide')
      set({ progress: 18 })

      updateNode('analysis', 'running', 'Analyse des pixels')
      const analysis = await analyzeImageFile(file)
      updateNode('analysis', 'complete', 'Analyse terminée')
      set({ analysis, progress: 48 })

      updateNode('relief', 'running', 'Création du relief')
      const heightField = smoothHeightField(analysis.heightField)
      updateNode('relief', 'complete', 'Relief normalisé')
      set({ progress: 68 })

      updateNode('model', 'running', 'Construction du maillage')
      const model = createGeneratedModel(
        file.name,
        analysis.aspectRatio,
        heightField
      )
      updateNode('model', 'complete', 'Maillage prêt')
      set({ model, progress: 90 })

      updateNode('validation', 'running', 'Validation finale')

      if (!model.vertices || !model.triangles) {
        throw new Error('Le modèle généré est vide.')
      }

      updateNode('validation', 'complete', 'Modèle exportable')

      set((state) => ({
        stage: 'complete',
        progress: 100,
        logs: [
          log(
            `Modèle prêt : ${model.vertices} sommets, ${model.triangles} triangles.`,
            'success'
          ),
          ...state.logs,
        ],
      }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur Visual Forge.'

      set((state) => ({
        stage: 'error',
        error: message,
        nodes: state.nodes.map((node) =>
          node.status === 'running'
            ? { ...node, status: 'error', message }
            : node
        ),
        logs: [log(message, 'error'), ...state.logs],
      }))
    }
  },

  exportObj() {
    const model = get().model
    if (!model) return

    downloadObj(model)

    set((state) => ({
      logs: [log(`Export OBJ : ${model.name}.obj`, 'success'), ...state.logs],
    }))
  },

  reset() {
    const url = get().sourceUrl
    if (url) URL.revokeObjectURL(url)

    set({
      sourceFile: null,
      sourceUrl: null,
      analysis: null,
      model: null,
      stage: 'idle',
      progress: 0,
      nodes: createNodes(),
      logs: [],
      error: null,
    })
  },
}))
