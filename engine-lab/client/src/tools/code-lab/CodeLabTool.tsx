import {
  Activity,
  Code2,
  Library,
} from 'lucide-react'

import {
  useEffect,
} from 'react'

import {
  EditorPanel,
} from './components/EditorPanel'

import {
  ExecutionScene,
} from './components/ExecutionScene'

import {
  LabStats,
} from './components/LabStats'

import {
  SnippetLibrary,
} from './components/SnippetLibrary'

import {
  useCodeLabStore,
} from './CodeLabStore'

import {
  CODE_LAB_EVENTS,
} from './events'

import {
  installCodeLabTroxtBridge,
  registerCodeLabTroxtTools,
} from './troxt/registerCodeLabTroxtTools'

import type {
  CodeLabView,
} from './types'

import './code-lab.css'

const views: Array<{
  id: CodeLabView
  label: string
  icon: typeof Code2
}> = [
  {
    id: 'editor',
    label: 'Code Lab',
    icon: Code2,
  },
  {
    id: 'snippets',
    label: 'Snippets',
    icon: Library,
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: Activity,
  },
]

export default function CodeLabTool() {
  const view =
    useCodeLabStore(
      (state) => state.view
    )

  const history =
    useCodeLabStore(
      (state) => state.history
    )

  const setView =
    useCodeLabStore(
      (state) => state.setView
    )

  const executeCurrentCode =
    useCodeLabStore(
      (state) =>
        state.executeCurrentCode
    )

  useEffect(() => {
    registerCodeLabTroxtTools()

    const uninstallBridge =
      installCodeLabTroxtBridge()

    const handleRun = (): void => {
      void executeCurrentCode()
    }

    const handleEditor = (): void => {
      setView('editor')
    }

    const handleSnippets = (): void => {
      setView('snippets')
    }

    const handleStats = (): void => {
      setView('stats')
    }

    window.addEventListener(
      CODE_LAB_EVENTS.run,
      handleRun
    )

    window.addEventListener(
      CODE_LAB_EVENTS.openEditor,
      handleEditor
    )

    window.addEventListener(
      CODE_LAB_EVENTS.openSnippets,
      handleSnippets
    )

    window.addEventListener(
      CODE_LAB_EVENTS.openStats,
      handleStats
    )

    return () => {
      uninstallBridge()

      window.removeEventListener(
        CODE_LAB_EVENTS.run,
        handleRun
      )

      window.removeEventListener(
        CODE_LAB_EVENTS.openEditor,
        handleEditor
      )

      window.removeEventListener(
        CODE_LAB_EVENTS.openSnippets,
        handleSnippets
      )

      window.removeEventListener(
        CODE_LAB_EVENTS.openStats,
        handleStats
      )
    }
  }, [
    executeCurrentCode,
    setView,
  ])

  return (
    <main className="code-lab">
      <header className="code-lab__header">
        <div className="code-lab__brand">
          <Code2 size={22} />

          <span>
            <strong>
              NODE.LAB_3D
            </strong>

            <small>
              ETHERWORLD ENGINE-LAB
            </small>
          </span>
        </div>

        <div className="code-lab__status">
          <span />
          LOCAL SANDBOX
        </div>
      </header>

      <nav className="code-lab__navigation">
        {views.map((item) => {
          const Icon =
            item.icon

          return (
            <button
              key={item.id}
              type="button"
              className={
                view === item.id
                  ? 'is-active'
                  : ''
              }
              onClick={() =>
                setView(item.id)
              }
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <section className="code-lab__content">
        {view === 'editor' && (
          <div className="code-lab__workspace">
            <EditorPanel />

            <ExecutionScene
              executions={
                history.slice(-20)
              }
            />
          </div>
        )}

        {view === 'snippets' && (
          <SnippetLibrary />
        )}

        {view === 'stats' && (
          <div className="code-lab__stats-layout">
            <LabStats />

            <ExecutionScene
              executions={
                history.slice(-20)
              }
            />
          </div>
        )}
      </section>
    </main>
  )
}
