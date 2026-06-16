/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\TroxtAgent.ts
 *
 * Agent local TROXT pour Engine-Lab.
 */

import { TROXT_EVENTS } from './events'

import {
  registerDefaultTroxtTools,
  troxtTools,
} from './TroxtToolRegistry'

import type {
  TroxtAgent,
  TroxtMessage,
  TroxtRequest,
  TroxtStatus,
  TroxtToolContext,
} from './types'

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

function createAssistantMessage(
  text: string,
  request: TroxtRequest
): TroxtMessage {
  return {
    id: createId('troxt-message'),
    role: 'assistant',
    text,
    createdAt: Date.now(),
    project: request.project,
  }
}

function emitTroxtStatus(
  status: TroxtStatus,
  label: string
): void {
  window.dispatchEvent(
    new CustomEvent(TROXT_EVENTS.status, {
      detail: {
        status,
        label,
      },
    })
  )
}

class LocalTroxtAgent implements TroxtAgent {
  private status: TroxtStatus = 'ready'

  constructor() {
    registerDefaultTroxtTools()
  }

  getStatus(): TroxtStatus {
    return this.status
  }

  async send(
    request: TroxtRequest
  ): Promise<TroxtMessage> {
    this.status = 'thinking'

    emitTroxtStatus(
      'thinking',
      'Analyse de la demande'
    )

    const context: TroxtToolContext = {
      project: request.project,
      currentTool:
        request.context.currentTool,
      sceneName:
        request.context.sceneName,
      selection:
        request.context.selection,
    }

    try {
      this.status = 'working'

      emitTroxtStatus(
        'working',
        'Exécution de la commande'
      )

      const result =
        await troxtTools.execute(
          request,
          context
        )

      this.status =
        result.ok
          ? 'ready'
          : 'error'

      emitTroxtStatus(
        this.status,
        result.ok
          ? 'TROXT prêt'
          : 'Commande non reconnue'
      )

      return createAssistantMessage(
        result.message,
        request
      )
    } catch (error) {
      this.status = 'error'

      emitTroxtStatus(
        'error',
        'Erreur TROXT'
      )

      return createAssistantMessage(
        error instanceof Error
          ? `Erreur TROXT : ${error.message}`
          : 'Erreur TROXT inconnue.',
        request
      )
    }
  }
}

export const troxtAgent =
  new LocalTroxtAgent()

export function installTroxtAgent(): () => void {
  window.__ETHERWORLD_TROXT_AGENT__ =
    troxtAgent

  const handleRequest = async (
    event: Event
  ): Promise<void> => {
    const customEvent =
      event as CustomEvent<TroxtRequest>

    const request =
      customEvent.detail

    if (!request) {
      return
    }

    const message =
      await troxtAgent.send(request)

    window.dispatchEvent(
      new CustomEvent(
        TROXT_EVENTS.message,
        {
          detail: message,
        }
      )
    )
  }

  window.addEventListener(
    TROXT_EVENTS.request,
    handleRequest
  )

  emitTroxtStatus(
    'ready',
    'TROXT prêt'
  )

  return () => {
    window.removeEventListener(
      TROXT_EVENTS.request,
      handleRequest
    )

    if (
      window.__ETHERWORLD_TROXT_AGENT__ ===
      troxtAgent
    ) {
      delete window
        .__ETHERWORLD_TROXT_AGENT__
    }
  }
}

declare global {
  interface Window {
    __ETHERWORLD_TROXT_AGENT__?:
      TroxtAgent
  }
}
