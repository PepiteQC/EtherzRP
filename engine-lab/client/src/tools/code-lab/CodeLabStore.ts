import { create } from 'zustand'

import {
  CODE_LAB_EVENTS,
} from './events'

import {
  executeCode,
} from './lib/executor'

import {
  loadExecutionHistory,
  loadSnippets,
  saveExecutionHistory,
  saveSnippets,
} from './lib/storage'

import type {
  CodeExecutionResult,
  CodeLanguage,
  CodeLabView,
  CodeSnippet,
} from './types'

interface CodeLabState {
  view: CodeLabView
  code: string
  language: CodeLanguage
  output: string
  isExecuting: boolean
  history: CodeExecutionResult[]
  snippets: CodeSnippet[]

  setView: (
    view: CodeLabView
  ) => void

  setCode: (
    code: string
  ) => void

  setLanguage: (
    language: CodeLanguage
  ) => void

  executeCurrentCode:
    () => Promise<CodeExecutionResult>

  saveSnippet: (
    title: string
  ) => CodeSnippet

  loadSnippet: (
    snippetId: string
  ) => void

  deleteSnippet: (
    snippetId: string
  ) => void

  clearHistory: () => void
}

const DEFAULT_CODE = `console.log('Bienvenue dans EtherWorld Code Lab');

const player = {
  name: 'Citoyen Québec',
  health: 100,
  position: { x: 0, y: 1, z: 0 },
};

console.table(player);

return {
  status: 'ready',
  player,
};`

function createId(
  prefix: string
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export const useCodeLabStore =
  create<CodeLabState>((set, get) => ({
    view: 'editor',
    code: DEFAULT_CODE,
    language: 'javascript',
    output: '> Code Lab prêt.',
    isExecuting: false,
    history: loadExecutionHistory(),
    snippets: loadSnippets(),

    setView(view) {
      set({ view })
    },

    setCode(code) {
      set({ code })
    },

    setLanguage(language) {
      set({ language })
    },

    async executeCurrentCode() {
      const {
        code,
        language,
        history,
      } = get()

      set({
        isExecuting: true,
        output: '> Exécution en cours...',
      })

      const result =
        await executeCode(
          code,
          language,
          5000
        )

      const nextHistory =
        [...history, result].slice(-100)

      saveExecutionHistory(
        nextHistory
      )

      set({
        isExecuting: false,
        history: nextHistory,
        output:
          result.output ||
          result.error ||
          '> Exécution terminée.',
      })

      window.dispatchEvent(
        new CustomEvent(
          result.success
            ? CODE_LAB_EVENTS.completed
            : CODE_LAB_EVENTS.error,
          {
            detail: result,
          }
        )
      )

      return result
    },

    saveSnippet(title) {
      const {
        code,
        language,
        snippets,
      } = get()

      const timestamp = Date.now()

      const snippet: CodeSnippet = {
        id: createId('snippet'),
        title:
          title.trim() ||
          'Séquence sans titre',
        code,
        language,
        tags: ['engine-lab'],
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      const nextSnippets =
        [snippet, ...snippets]

      saveSnippets(nextSnippets)

      set({
        snippets: nextSnippets,
      })

      return snippet
    },

    loadSnippet(snippetId) {
      const snippet =
        get().snippets.find(
          (item) =>
            item.id === snippetId
        )

      if (!snippet) {
        return
      }

      set({
        view: 'editor',
        code: snippet.code,
        language:
          snippet.language,
        output:
          `> Snippet chargé : ${snippet.title}`,
      })
    },

    deleteSnippet(snippetId) {
      const nextSnippets =
        get().snippets.filter(
          (snippet) =>
            snippet.id !== snippetId
        )

      saveSnippets(nextSnippets)

      set({
        snippets: nextSnippets,
      })
    },

    clearHistory() {
      saveExecutionHistory([])

      set({
        history: [],
        output:
          '> Historique effacé.',
      })
    },
  }))
