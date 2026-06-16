/**
 * worldActions.ts — le contrat d'actions du monde EtherWorld.
 *
 * Ce sont les "mains" du cerveau : le modèle Troxt RAISONNE et renvoie une liste
 * d'actions parmi cette liste blanche. Le jeu les EXÉCUTE ici via les CustomEvent
 * existants + le store des agents.
 *
 * ⚠️ Le modèle (Troxt) n'est PAS ici. Ce fichier ne fait qu'exécuter en toute
 * sécurité ce que le cerveau décide. Toute action inconnue est ignorée.
 */

import type { useAgentStore } from './useAgentStore'

export type WeatherPreset = 'clear' | 'rain' | 'snow' | 'fog' | 'storm'

export type WorldAction =
  | { type: 'set_weather'; preset: WeatherPreset }
  | { type: 'spawn_agents'; count: number; agentType?: string; color?: string }
  | { type: 'remove_all_agents' }
  | { type: 'explosion' }
  | { type: 'say'; text: string }

/** Liste blanche des types d'action autorisés. */
const ALLOWED_TYPES = new Set<WorldAction['type']>([
  'set_weather',
  'spawn_agents',
  'remove_all_agents',
  'explosion',
  'say',
])

const VALID_WEATHER = new Set<WeatherPreset>(['clear', 'rain', 'snow', 'fog', 'storm'])

/**
 * Valide + normalise une action brute renvoyée par le cerveau.
 * Retourne null si l'action est invalide ou non autorisée.
 */
export function sanitizeAction(raw: unknown): WorldAction | null {
  if (!raw || typeof raw !== 'object') return null
  const a = raw as Record<string, unknown>
  const type = a.type as WorldAction['type']
  if (!ALLOWED_TYPES.has(type)) return null

  switch (type) {
    case 'set_weather': {
      const preset = a.preset as WeatherPreset
      return VALID_WEATHER.has(preset) ? { type, preset } : null
    }
    case 'spawn_agents': {
      const count = Math.max(1, Math.min(50, Math.floor(Number(a.count) || 1)))
      return {
        type,
        count,
        agentType: typeof a.agentType === 'string' ? a.agentType : 'explorer',
        color: typeof a.color === 'string' ? a.color : undefined,
      }
    }
    case 'remove_all_agents':
      return { type }
    case 'explosion':
      return { type }
    case 'say': {
      const text = typeof a.text === 'string' ? a.text : ''
      return text ? { type, text } : null
    }
    default:
      return null
  }
}

type Store = ReturnType<typeof useAgentStore.getState>

/**
 * Exécute une action validée dans le monde 3D.
 * Renvoie un résumé lisible de ce qui a été fait (pour le journal du chat).
 */
export function executeAction(action: WorldAction, store: Store): string {
  switch (action.type) {
    case 'set_weather':
      window.dispatchEvent(new CustomEvent('set-weather', { detail: { preset: action.preset } }))
      return `Météo réglée sur « ${action.preset} ».`

    case 'spawn_agents': {
      for (let i = 0; i < action.count; i++) {
        store.spawnAgent({
          type: action.agentType,
          color: action.color,
          position: [(Math.random() - 0.5) * 160, 14, (Math.random() - 0.5) * 160],
        })
      }
      return `${action.count} agent(s) « ${action.agentType ?? 'explorer'} » spawné(s).`
    }

    case 'remove_all_agents': {
      const n = store.activeAgents.length
      store.clearAgents()
      return `${n} agent(s) retiré(s).`
    }

    case 'explosion':
      window.dispatchEvent(new CustomEvent('arcane-tree-explosion'))
      return 'Explosion arcanique déclenchée.'

    case 'say':
      return action.text
  }
}

/**
 * Repli local (fallback) quand le cerveau Troxt n'est pas encore branché
 * ou injoignable. Matching de mots-clés basique pour que le jeu reste jouable.
 * Renvoie { reply, actions }.
 */
export function localInterpret(text: string): { reply: string; actions: WorldAction[] } {
  const lower = text.toLowerCase()
  const actions: WorldAction[] = []

  if (/(pluie|rain|pleu)/.test(lower)) actions.push({ type: 'set_weather', preset: 'rain' })
  else if (/(neige|snow)/.test(lower)) actions.push({ type: 'set_weather', preset: 'snow' })
  else if (/(brouillard|fog)/.test(lower)) actions.push({ type: 'set_weather', preset: 'fog' })
  else if (/(orage|storm|tempête)/.test(lower)) actions.push({ type: 'set_weather', preset: 'storm' })
  else if (/(beau temps|clair|clear|soleil)/.test(lower)) actions.push({ type: 'set_weather', preset: 'clear' })

  if (/(explosion|explose|boom)/.test(lower)) actions.push({ type: 'explosion' })

  if (/(retire|enlève|supprime|clear|nettoie).*(agent|monde)/.test(lower)) {
    actions.push({ type: 'remove_all_agents' })
  } else if (/(spawn|invoque|crée|ajoute).*(agent)|agent/.test(lower)) {
    const count = parseInt(lower.match(/\d+/)?.[0] || '3', 10)
    actions.push({ type: 'spawn_agents', count })
  }

  const reply = actions.length
    ? '(mode local) Commande interprétée localement.'
    : "(mode local) Je n'ai pas compris. Essaie : « fais pleuvoir », « spawn 5 agents », « explosion »."

  return { reply, actions }
}
