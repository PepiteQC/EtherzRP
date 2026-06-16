```ts
/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\TroxtToolRegistry.ts
 *
 * Registre central des outils contrôlés par TROXT.
 */

import { TROXT_EVENTS } from './events'

import type {
  TroxtRequest,
  TroxtToolContext,
  TroxtToolDefinition,
  TroxtToolResult,
} from './types'

class TroxtToolRegistry {
  private readonly tools =
    new Map<string, TroxtToolDefinition>()

  register(tool: TroxtToolDefinition): void {
    this.tools.set(tool.id, tool)
  }

  unregister(toolId: string): void {
    this.tools.delete(toolId)
  }

  has(toolId: string): boolean {
    return this.tools.has(toolId)
  }

  get(
    toolId: string
  ): TroxtToolDefinition | undefined {
    return this.tools.get(toolId)
  }

  list(): TroxtToolDefinition[] {
    return Array.from(this.tools.values())
  }

  findForText(
    text: string
  ): TroxtToolDefinition | undefined {
    const normalizedText =
      text.trim().toLowerCase()

    return this.list().find((tool) =>
      tool.keywords.some((keyword) =>
        normalizedText.includes(
          keyword.toLowerCase()
        )
      )
    )
  }

  async execute(
    request: TroxtRequest,
    context: TroxtToolContext
  ): Promise<TroxtToolResult> {
    const tool =
      this.findForText(request.text)

    if (!tool) {
      return {
        ok: false,
        message:
          'Aucun outil TROXT ne correspond à cette demande.',
      }
    }

    try {
      return await tool.execute(
        request,
        context
      )
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? `Erreur outil TROXT : ${error.message}`
            : 'Erreur inconnue dans un outil TROXT.',
      }
    }
  }
}

export const troxtTools =
  new TroxtToolRegistry()

let defaultToolsRegistered = false

export function registerDefaultTroxtTools(): void {
  if (defaultToolsRegistered) {
    return
  }

  defaultToolsRegistered = true

  troxtTools.register({
    id: 'open-visual-forge',
    name: 'Ouvrir Visual Forge',
    description:
      'Ouvre Visual Forge dans Engine-Lab.',

    keywords: [
      'ouvre visual forge',
      'ouvrir visual forge',
      'visual forge',
      'modeleur 3d',
      'modéliseur 3d',
    ],

    execute() {
      window.dispatchEvent(
        new CustomEvent(
          TROXT_EVENTS.openTool,
          {
            detail: {
              toolId: 'visual-forge',
            },
          }
        )
      )

      return {
        ok: true,
        message:
          'Commande envoyée pour ouvrir Visual Forge.',
      }
    },
  })

  troxtTools.register({
    id: 'run-visual-forge',
    name: 'Lancer Visual Forge',
    description:
      'Lance le pipeline de génération de Visual Forge.',

    keywords: [
      'lance visual forge',
      'démarre visual forge',
      'demarre visual forge',
      'génère le modèle',
      'genere le modele',
      'crée le modèle',
      'cree le modele',
    ],

    execute() {
      window.dispatchEvent(
        new CustomEvent(
          TROXT_EVENTS.visualForgeRun
        )
      )

      return {
        ok: true,
        message:
          'Commande de génération envoyée à Visual Forge.',
      }
    },
  })

  troxtTools.register({
    id: 'list-tools',
    name: 'Lister les outils',
    description:
      'Affiche tous les outils connus de TROXT.',

    keywords: [
      'liste les outils',
      'lister les outils',
      'quels outils',
      'outils disponibles',
    ],

    execute() {
      const tools = troxtTools
        .list()
        .map((tool) => tool.name)

      return {
        ok: true,
        message:
          tools.length > 0
            ? `Outils TROXT disponibles : ${tools.join(', ')}.`
            : 'Aucun outil TROXT enregistré.',
        data: tools,
      }
    },
  })
}
```
