import {
  Loader2,
  Play,
  Save,
  TerminalSquare,
} from 'lucide-react'

import {
  useCodeLabStore,
} from '../CodeLabStore'

import type {
  CodeLanguage,
} from '../types'

export function EditorPanel() {
  const code =
    useCodeLabStore(
      (state) => state.code
    )

  const language =
    useCodeLabStore(
      (state) => state.language
    )

  const output =
    useCodeLabStore(
      (state) => state.output
    )

  const isExecuting =
    useCodeLabStore(
      (state) => state.isExecuting
    )

  const setCode =
    useCodeLabStore(
      (state) => state.setCode
    )

  const setLanguage =
    useCodeLabStore(
      (state) => state.setLanguage
    )

  const executeCurrentCode =
    useCodeLabStore(
      (state) =>
        state.executeCurrentCode
    )

  const saveSnippet =
    useCodeLabStore(
      (state) =>
        state.saveSnippet
    )

  const handleSave = (): void => {
    const title =
      window.prompt(
        'Nom du snippet :',
        'Séquence EtherWorld'
      )

    if (!title) {
      return
    }

    const snippet =
      saveSnippet(title)

    window.alert(
      `Snippet sauvegardé : ${snippet.title}`
    )
  }

  return (
    <section className="code-editor">
      <header className="code-editor__toolbar">
        <select
          value={language}
          onChange={(event) =>
            setLanguage(
              event.target
                .value as CodeLanguage
            )
          }
        >
          <option value="javascript">
            JAVASCRIPT
          </option>

          <option value="typescript">
            TYPESCRIPT
          </option>
        </select>

        <div>
          <button
            type="button"
            className="is-secondary"
            onClick={handleSave}
          >
            <Save size={15} />
            Sauvegarder
          </button>

          <button
            type="button"
            onClick={() =>
              void executeCurrentCode()
            }
            disabled={isExecuting}
          >
            {isExecuting ? (
              <Loader2
                size={15}
                className="is-spinning"
              />
            ) : (
              <Play size={15} />
            )}

            Exécuter
          </button>
        </div>
      </header>

      <textarea
        className="code-editor__source"
        value={code}
        spellCheck={false}
        onChange={(event) =>
          setCode(
            event.target.value
          )
        }
      />

      <div className="code-editor__terminal">
        <header>
          <TerminalSquare size={14} />
          Terminal Output
        </header>

        <pre>
          {output}
        </pre>
      </div>
    </section>
  )
}
