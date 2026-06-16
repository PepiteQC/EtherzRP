import {
  Code2,
  PlayCircle,
  Trash2,
} from 'lucide-react'

import {
  useCodeLabStore,
} from '../CodeLabStore'

export function SnippetLibrary() {
  const snippets =
    useCodeLabStore(
      (state) => state.snippets
    )

  const loadSnippet =
    useCodeLabStore(
      (state) =>
        state.loadSnippet
    )

  const deleteSnippet =
    useCodeLabStore(
      (state) =>
        state.deleteSnippet
    )

  if (snippets.length === 0) {
    return (
      <section className="snippet-library is-empty">
        <Code2 size={38} />

        <strong>
          Aucun snippet
        </strong>

        <span>
          Sauvegarde une séquence depuis
          l’éditeur Code Lab.
        </span>
      </section>
    )
  }

  return (
    <section className="snippet-library">
      <header>
        <div>
          <strong>
            DATA CORE / SNIPPETS
          </strong>

          <span>
            {snippets.length}
            {' '}
            séquence(s)
          </span>
        </div>
      </header>

      <div className="snippet-library__grid">
        {snippets.map(
          (snippet) => (
            <article
              key={snippet.id}
            >
              <header>
                <div>
                  <strong>
                    {snippet.title}
                  </strong>

                  <span>
                    {snippet.language}
                  </span>
                </div>

                <button
                  type="button"
                  title="Supprimer"
                  onClick={() => {
                    const accepted =
                      window.confirm(
                        `Supprimer ${snippet.title} ?`
                      )

                    if (accepted) {
                      deleteSnippet(
                        snippet.id
                      )
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </header>

              <pre>
                {snippet.code}
              </pre>

              <footer>
                <time>
                  {new Date(
                    snippet.updatedAt
                  ).toLocaleString(
                    'fr-CA'
                  )}
                </time>

                <button
                  type="button"
                  onClick={() =>
                    loadSnippet(
                      snippet.id
                    )
                  }
                >
                  <PlayCircle size={15} />
                  Charger
                </button>
              </footer>
            </article>
          )
        )}
      </div>
    </section>
  )
}
