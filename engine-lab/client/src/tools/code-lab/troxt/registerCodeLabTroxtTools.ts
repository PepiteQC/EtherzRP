import {
  CODE_LAB_EVENTS,
} from '../events'

import {
  troxtTools,
} from '../../troxt/TroxtToolRegistry'

import {
  TROXT_EVENTS,
} from '../../troxt/events'

import type {
  TroxtMessage,
} from '../../troxt/types'

let toolsRegistered = false

function createTroxtMessage(
  text: string
): TroxtMessage {
  return {
    id:
      `troxt-code-lab-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    role: 'assistant',
    text,
    createdAt: Date.now(),
    project: 'lab',
  }
}

function emitTroxtMessage(
  text: string
): void {
  window.dispatchEvent(
    new CustomEvent(
      TROXT_EVENTS.message,
      {
        detail:
          createTroxtMessage(text),
      }
    )
  )
}

export function registerCodeLabTroxtTools():
  void {
  if (toolsRegistered) {
    return
  }

  toolsRegistered = true

  troxtTools.register({
    id: 'open-code-lab',
    name: 'Ouvrir Code Lab',
    description:
      'Ouvre l’éditeur JavaScript et TypeScript.',

    keywords: [
      'ouvre code lab',
      'ouvrir code lab',
      'code lab',
      'nodes js',
      'éditeur javascript',
      'editeur javascript',
    ],

    execute() {
      window.dispatchEvent(
        new CustomEvent(
          TROXT_EVENTS.openTool,
          {
            detail: {
              toolId: 'code-lab',
            },
          }
        )
      )

      window.dispatchEvent(
        new CustomEvent(
          CODE_LAB_EVENTS.openEditor
        )
      )

      return {
        ok: true,
        message:
          'Commande envoyée pour ouvrir Code Lab.',
      }
    },
  })

  troxtTools.register({
    id: 'run-code-lab',
    name: 'Exécuter Code Lab',
    description:
      'Exécute le code présent dans l’éditeur.',

    keywords: [
      'exécute le code',
      'execute le code',
      'lance le code',
      'run code',
      'lance code lab',
    ],

    execute() {
      window.dispatchEvent(
        new CustomEvent(
          CODE_LAB_EVENTS.run
        )
      )

      return {
        ok: true,
        message:
          'Commande d’exécution envoyée à Code Lab.',
      }
    },
  })

  troxtTools.register({
    id: 'open-code-lab-snippets',
    name: 'Ouvrir les snippets',
    description:
      'Affiche la bibliothèque de snippets.',

    keywords: [
      'ouvre les snippets',
      'liste les snippets',
      'affiche les snippets',
      'bibliothèque de code',
      'bibliotheque de code',
    ],

    execute() {
      window.dispatchEvent(
        new CustomEvent(
          CODE_LAB_EVENTS.openSnippets
        )
      )

      return {
        ok: true,
        message:
          'Bibliothèque de snippets demandée.',
      }
    },
  })

  troxtTools.register({
    id: 'open-code-lab-stats',
    name: 'Ouvrir les statistiques',
    description:
      'Affiche la télémétrie du Code Lab.',

    keywords: [
      'ouvre les statistiques',
      'affiche les statistiques',
      'statistiques code lab',
      'métriques code lab',
      'metriques code lab',
    ],

    execute() {
      window.dispatchEvent(
        new CustomEvent(
          CODE_LAB_EVENTS.openStats
        )
      )

      return {
        ok: true,
        message:
          'Statistiques Code Lab demandées.',
      }
    },
  })
}

export function installCodeLabTroxtBridge():
  () => void {
  const handleCompleted = (
    event: Event
  ): void => {
    const customEvent =
      event as CustomEvent<{
        duration?: number
        output?: string
      }>

    const duration =
      customEvent.detail?.duration ?? 0

    emitTroxtMessage(
      `Code Lab a terminé l’exécution en ${duration} ms.`
    )
  }

  const handleError = (
    event: Event
  ): void => {
    const customEvent =
      event as CustomEvent<{
        error?: string
        output?: string
      }>

    const message =
      customEvent.detail?.error ||
      customEvent.detail?.output ||
      'Erreur Code Lab inconnue.'

    emitTroxtMessage(
      `Erreur Code Lab : ${message}`
    )
  }

  window.addEventListener(
    CODE_LAB_EVENTS.completed,
    handleCompleted
  )

  window.addEventListener(
    CODE_LAB_EVENTS.error,
    handleError
  )

  return () => {
    window.removeEventListener(
      CODE_LAB_EVENTS.completed,
      handleCompleted
    )

    window.removeEventListener(
      CODE_LAB_EVENTS.error,
      handleError
    )
  }
}
