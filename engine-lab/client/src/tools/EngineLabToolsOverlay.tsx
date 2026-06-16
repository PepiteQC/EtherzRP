import {
  useEffect,
  useState,
} from 'react'

import {
  Bot,
  Braces,
  Hammer,
  Wrench,
  X,
} from 'lucide-react'

import CodeLabTool from './code-lab/CodeLabTool'

import {
  CODE_LAB_EVENTS,
} from './code-lab/events'

import {
  registerCodeLabTroxtTools,
} from './code-lab/troxt/registerCodeLabTroxtTools'

import {
  TROXT_EVENTS,
} from './troxt/events'

import {
  TroxtProvider,
} from './troxt/TroxtContext'

import TroxtPanel from './troxt/TroxtPanel'

import {
  TroxtVisualForgeBridge,
} from './troxt/TroxtVisualForgeBridge'

import {
  troxtTools,
} from './troxt/TroxtToolRegistry'

import VisualForgeTool from './visual-forge/VisualForgeTool'

import './engine-lab-tools-overlay.css'

type EngineLabToolId =
  | 'troxt'
  | 'visual-forge'
  | 'code-lab'

const TOOL_LABELS: Record<
  EngineLabToolId,
  string
> = {
  troxt: 'TROXT',
  'visual-forge': 'VISUAL FORGE',
  'code-lab': 'CODE LAB',
}

function dispatchOpenTool(
  toolId: EngineLabToolId
): void {
  window.dispatchEvent(
    new CustomEvent(
      TROXT_EVENTS.openTool,
      {
        detail: {
          toolId,
        },
      }
    )
  )
}

function registerIntegratedTroxtTools(): void {
  registerCodeLabTroxtTools()

  /*
   * Ces enregistrements remplacent seulement les commandes
   * Code Lab du registre TROXT. Ils ouvrent l’outil avant
   * d’envoyer l’action demandée.
   */

  troxtTools.register({
    id: 'open-code-lab',
    name: 'Ouvrir Code Lab',
    description:
      'Ouvre le laboratoire JavaScript et TypeScript.',

    keywords: [
      'ouvre code lab',
      'ouvrir code lab',
      'code lab',
      'nodes js',
      'éditeur javascript',
      'editeur javascript',
    ],

    execute() {
      dispatchOpenTool('code-lab')

      return {
        ok: true,
        message:
          'Code Lab est maintenant ouvert.',
      }
    },
  })

  troxtTools.register({
    id: 'run-code-lab',
    name: 'Exécuter Code Lab',
    description:
      'Ouvre Code Lab puis exécute son code actuel.',

    keywords: [
      'exécute le code',
      'execute le code',
      'lance le code',
      'run code',
      'lance code lab',
    ],

    execute() {
      dispatchOpenTool('code-lab')

      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(
            CODE_LAB_EVENTS.run
          )
        )
      }, 150)

      return {
        ok: true,
        message:
          'Code Lab est ouvert et l’exécution a été demandée.',
      }
    },
  })

  troxtTools.register({
    id: 'open-code-lab-snippets',
    name: 'Ouvrir les snippets',
    description:
      'Ouvre la bibliothèque de snippets Code Lab.',

    keywords: [
      'ouvre les snippets',
      'ouvrir les snippets',
      'liste les snippets',
      'affiche les snippets',
      'bibliothèque de code',
      'bibliotheque de code',
    ],

    execute() {
      dispatchOpenTool('code-lab')

      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(
            CODE_LAB_EVENTS.openSnippets
          )
        )
      }, 150)

      return {
        ok: true,
        message:
          'La bibliothèque de snippets est ouverte.',
      }
    },
  })

  troxtTools.register({
    id: 'open-code-lab-stats',
    name: 'Ouvrir les statistiques Code Lab',
    description:
      'Ouvre la télémétrie locale du Code Lab.',

    keywords: [
      'ouvre les statistiques',
      'ouvrir les statistiques',
      'affiche les statistiques',
      'statistiques code lab',
      'métriques code lab',
      'metriques code lab',
    ],

    execute() {
      dispatchOpenTool('code-lab')

      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(
            CODE_LAB_EVENTS.openStats
          )
        )
      }, 150)

      return {
        ok: true,
        message:
          'Les statistiques Code Lab sont ouvertes.',
      }
    },
  })
}

function EngineLabToolsContent() {
  const [
    activeTool,
    setActiveTool,
  ] = useState<EngineLabToolId | null>(
    null
  )

  useEffect(() => {
    registerIntegratedTroxtTools()

    const handleOpenTool = (
      event: Event
    ): void => {
      const customEvent =
        event as CustomEvent<{
          toolId?: string
        }>

      const toolId =
        customEvent.detail?.toolId

      if (
        toolId === 'troxt' ||
        toolId === 'visual-forge' ||
        toolId === 'code-lab'
      ) {
        setActiveTool(toolId)
      }
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ): void => {
      if (event.key === 'Escape') {
        setActiveTool(null)
      }

      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === 't'
      ) {
        event.preventDefault()
        setActiveTool('troxt')
      }
    }

    window.addEventListener(
      TROXT_EVENTS.openTool,
      handleOpenTool
    )

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        TROXT_EVENTS.openTool,
        handleOpenTool
      )

      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [])

  return (
    <>
      <TroxtVisualForgeBridge />

      <aside className="engine-lab-tools-launcher">
        <button
          type="button"
          title="Ouvrir TROXT"
          onClick={() =>
            setActiveTool('troxt')
          }
        >
          <Bot size={17} />
          <span>TROXT</span>
        </button>

        <button
          type="button"
          title="Ouvrir Visual Forge"
          onClick={() =>
            setActiveTool(
              'visual-forge'
            )
          }
        >
          <Hammer size={17} />
          <span>FORGE</span>
        </button>

        <button
          type="button"
          title="Ouvrir Code Lab"
          onClick={() =>
            setActiveTool('code-lab')
          }
        >
          <Braces size={17} />
          <span>CODE</span>
        </button>
      </aside>

      {activeTool && (
        <section
          className="engine-lab-tools-overlay"
          aria-label={
            TOOL_LABELS[activeTool]
          }
        >
          <header className="engine-lab-tools-overlay__header">
            <div>
              <Wrench size={18} />

              <span>
                <strong>
                  {
                    TOOL_LABELS[
                      activeTool
                    ]
                  }
                </strong>

                <small>
                  ETHERWORLD ENGINE-LAB
                </small>
              </span>
            </div>

            <button
              type="button"
              title="Fermer l’outil"
              onClick={() =>
                setActiveTool(null)
              }
            >
              <X size={18} />
            </button>
          </header>

          <div className="engine-lab-tools-overlay__content">
            {activeTool === 'troxt' && (
              <div className="engine-lab-tools-overlay__troxt">
                <TroxtPanel />
              </div>
            )}

            {activeTool ===
              'visual-forge' && (
              <VisualForgeTool />
            )}

            {activeTool ===
              'code-lab' && (
              <CodeLabTool />
            )}
          </div>
        </section>
      )}
    </>
  )
}

export function EngineLabToolsOverlay() {
  return (
    <TroxtProvider>
      <EngineLabToolsContent />
    </TroxtProvider>
  )
}
