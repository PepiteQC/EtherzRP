/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\TroxtVisualForgeBridge.tsx
 *
 * Pont entre TROXT et Visual Forge.
 */

import { useEffect } from 'react'

import {
  useVisualForgeStore,
} from '../visual-forge/VisualForgeStore'

import { TROXT_EVENTS } from './events'

import type {
  TroxtMessage,
} from './types'

function createId(): string {
  return `troxt-vf-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function emitTroxtMessage(
  text: string
): void {
  const message: TroxtMessage = {
    id: createId(),
    role: 'assistant',
    text,
    createdAt: Date.now(),
    project: 'lab',
  }

  window.dispatchEvent(
    new CustomEvent(
      TROXT_EVENTS.message,
      {
        detail: message,
      }
    )
  )
}

export function TroxtVisualForgeBridge() {
  useEffect(() => {
    const handleRunVisualForge =
      (): void => {
        const state =
          useVisualForgeStore.getState()

        if (!state.sourceFile) {
          emitTroxtMessage(
            'Visual Forge attend une image. Ouvre Visual Forge et ajoute un fichier PNG, JPG ou WEBP.'
          )

          return
        }

        void state.runPipeline()
      }

    const unsubscribe =
      useVisualForgeStore.subscribe(
        (state, previousState) => {
          if (
            state.stage === 'complete' &&
            previousState.stage !== 'complete'
          ) {
            const model = state.model

            emitTroxtMessage(
              model
                ? `Visual Forge a terminé le modèle ${model.name} : ${model.vertices} sommets et ${model.triangles} triangles.`
                : 'Visual Forge a terminé la génération.'
            )

            window.dispatchEvent(
              new CustomEvent(
                TROXT_EVENTS.visualForgeCompleted,
                {
                  detail: {
                    model,
                  },
                }
              )
            )
          }

          if (
            state.stage === 'error' &&
            previousState.stage !== 'error'
          ) {
            const message =
              state.error ??
              'Erreur inconnue dans Visual Forge.'

            emitTroxtMessage(
              `Erreur Visual Forge : ${message}`
            )

            window.dispatchEvent(
              new CustomEvent(
                TROXT_EVENTS.visualForgeError,
                {
                  detail: {
                    error: message,
                  },
                }
              )
            )
          }
        }
      )

    window.addEventListener(
      TROXT_EVENTS.visualForgeRun,
      handleRunVisualForge
    )

    return () => {
      window.removeEventListener(
        TROXT_EVENTS.visualForgeRun,
        handleRunVisualForge
      )

      unsubscribe()
    }
  }, [])

  return null
}
