/**
 * troxtBridge.ts — pont entre l'agent en jeu et TON cerveau Troxt.
 *
 * On n'embarque PAS le modèle ici. On appelle simplement la fonction serveur
 * Troxt « agent-command » via le même contrat que troxt.functions.invoke() :
 *
 *   POST {base}/troxt/functions/agent-command   body: { text, context }
 *   → { ok: true, data: { reply: string, actions: WorldAction[] } }
 *
 * C'est à toi (côté troxt-server) d'enregistrer cette fonction :
 *
 *   register('agent-command', async ({ text, context }) => {
 *     // ... ton cerveau Troxt raisonne ...
 *     return { reply: '...', actions: [{ type: 'set_weather', preset: 'rain' }] }
 *   })
 *
 * Tant que ce handler n'existe pas (404) ou que le réseau échoue, on bascule
 * automatiquement sur l'interpréteur local pour que le jeu reste jouable.
 */

import { sanitizeAction, localInterpret, type WorldAction } from './worldActions'

const BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TROXT_URL) || '/api'

const FUNCTION_NAME = 'agent-command'
const TIMEOUT_MS = 30_000

export interface BrainContext {
  weather?: string
  entities?: number
  activeAgents?: number
}

export interface BrainResult {
  reply: string
  actions: WorldAction[]
  /** D'où vient la réponse : le cerveau Troxt ou le repli local. */
  source: 'troxt' | 'local'
}

/**
 * Envoie une commande en langage naturel au cerveau Troxt.
 * Retombe sur l'interprétation locale en cas d'indisponibilité.
 */
export async function sendToBrain(text: string, context: BrainContext = {}): Promise<BrainResult> {
  const url = `${String(BASE).replace(/\/+$/, '')}/troxt/functions/${FUNCTION_NAME}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
      signal: controller.signal,
    })

    if (!res.ok) {
      // 404 = handler pas encore branché côté Troxt → repli local silencieux.
      return { ...localInterpret(text), source: 'local' }
    }

    const json = await res.json()
    const data = json?.data ?? json
    const rawActions: unknown[] = Array.isArray(data?.actions) ? data.actions : []
    const actions = rawActions
      .map(sanitizeAction)
      .filter((a): a is WorldAction => a !== null)

    const reply =
      typeof data?.reply === 'string' && data.reply.trim()
        ? data.reply
        : actions.length
          ? 'Commande exécutée.'
          : "Le cerveau n'a renvoyé aucune action."

    return { reply, actions, source: 'troxt' }
  } catch {
    // Réseau coupé / timeout / serveur Troxt absent → repli local.
    return { ...localInterpret(text), source: 'local' }
  } finally {
    clearTimeout(timer)
  }
}
