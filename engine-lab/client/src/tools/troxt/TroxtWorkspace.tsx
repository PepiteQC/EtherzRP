/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\TroxtWorkspace.tsx
 *
 * Espace de test complet TROXT + Visual Forge.
 */

import {
  useEffect,
  useState,
} from 'react'

import {
  Bot,
  Hammer,
} from 'lucide-react'

import VisualForgeTool from
  '../visual-forge/VisualForgeTool'

import { TROXT_EVENTS } from './events'

import {
  TroxtProvider,
  useTroxt,
} from './TroxtContext'

import TroxtPanel from './TroxtPanel'

import {
  TroxtVisualForgeBridge,
} from './TroxtVisualForgeBridge'

import './troxt-workspace.css'

type ActiveLabTool =
  | 'troxt'
  | 'visual-forge'

function TroxtWorkspaceContent() {
  const [
    activeTool,
    setActiveTool,
  ] = useState<ActiveLabTool>(
    'troxt'
  )

  const {
    status,
    statusLabel,
  } = useTroxt()

  useEffect(() => {
    const handleOpenTool = (
      event: Event
    ): void => {
      const customEvent =
        event as CustomEvent<{
          toolId?: string
        }>

      if (
        customEvent.detail?.toolId ===
        'visual-forge'
      ) {
        setActiveTool(
          'visual-forge'
        )
      }

      if (
        customEvent.detail?.toolId ===
        'troxt'
      ) {
        setActiveTool('troxt')
      }
    }

    window.addEventListener(
      TROXT_EVENTS.openTool,
      handleOpenTool
    )

    return () => {
      window.removeEventListener(
        TROXT_EVENTS.openTool,
        handleOpenTool
      )
    }
  }, [])

  return (
    <main className="troxt-workspace">
      <header className="troxt-workspace__header">
        <div>
          <strong>
            TROXT WORKSPACE
          </strong>

          <span>
            ENGINE-LAB ·
            {statusLabel}
          </span>
        </div>

        <div
          className={
            `troxt-workspace__state is-${status}`
          }
        >
          {status}
        </div>
      </header>

      <nav className="troxt-workspace__nav">
        <button
          type="button"
          className={
            activeTool === 'troxt'
              ? 'is-active'
              : ''
          }
          onClick={() =>
            setActiveTool('troxt')
          }
        >
          <Bot size={16} />
          TROXT
        </button>

        <button
          type="button"
          className={
            activeTool === 'visual-forge'
              ? 'is-active'
              : ''
          }
          onClick={() =>
            setActiveTool(
              'visual-forge'
            )
          }
        >
          <Hammer size={16} />
          Visual Forge
        </button>
      </nav>

      <section className="troxt-workspace__content">
        {activeTool === 'troxt'
          ? <TroxtPanel />
          : <VisualForgeTool />}
      </section>
    </main>
  )
}

export default function TroxtWorkspace() {
  return (
    <TroxtProvider>
      <TroxtVisualForgeBridge />

      <TroxtWorkspaceContent />
    </TroxtProvider>
  )
}
