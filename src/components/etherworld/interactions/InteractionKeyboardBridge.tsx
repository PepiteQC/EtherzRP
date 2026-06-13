import { useEffect } from 'react'
import { buildPrompt, dispatchInteractionDomEvent, INTERACTION_EVENT } from './interactionTypes'
import { useInteractionStore } from './interactionStore'

function notify(message: string, duration = 2200) {
  window.dispatchEvent(new CustomEvent('hud-notification', {
    detail: { message, duration },
  }))
}

/**
 * Pont clavier global pour les objets 3D interactifs.
 *
 * Le Walker garde priorité pour les bâtiments/portes par proximité.
 * Ici on vise surtout les objets cliquables: panneaux, props, terminaux, objets de décor.
 */
export default function InteractionKeyboardBridge() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code !== 'KeyE') return

      const state = useInteractionStore.getState()
      const target = state.hovered?.target
      if (!target || target.enabled === false) return

      state.markAction(target)
      dispatchInteractionDomEvent(INTERACTION_EVENT.action, { target, source: 'keyboard' })
      notify(buildPrompt(target))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}
