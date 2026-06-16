import {
  Activity,
  Clock,
  Database,
  Percent,
  Trash2,
} from 'lucide-react'

import {
  useMemo,
} from 'react'

import {
  useCodeLabStore,
} from '../CodeLabStore'

function Metric({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <article className="lab-metric">
      <header>
        <span>
          {title}
        </span>

        {icon}
      </header>

      <strong>
        {value}
      </strong>
    </article>
  )
}

export function LabStats() {
  const snippets =
    useCodeLabStore(
      (state) => state.snippets
    )

  const history =
    useCodeLabStore(
      (state) => state.history
    )

  const clearHistory =
    useCodeLabStore(
      (state) =>
        state.clearHistory
    )

  const stats =
    useMemo(() => {
      const successes =
        history.filter(
          (item) => item.success
        ).length

      const failures =
        history.length - successes

      const averageDuration =
        history.length > 0
          ? history.reduce(
              (sum, item) =>
                sum + item.duration,
              0
            ) / history.length
          : 0

      return {
        successes,
        failures,
        averageDuration,
        successRate:
          history.length > 0
            ? successes /
              history.length *
              100
            : 0,
      }
    }, [history])

  return (
    <section className="lab-stats">
      <header className="lab-stats__header">
        <div>
          <strong>
            SYSTEM TELEMETRY
          </strong>

          <span>
            Métriques locales Code Lab
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            const accepted =
              window.confirm(
                'Effacer tout l’historique ?'
              )

            if (accepted) {
              clearHistory()
            }
          }}
        >
          <Trash2 size={15} />
          Effacer
        </button>
      </header>

      <div className="lab-stats__metrics">
        <Metric
          title="Snippets"
          value={snippets.length}
          icon={
            <Database size={16} />
          }
        />

        <Metric
          title="Exécutions"
          value={history.length}
          icon={
            <Activity size={16} />
          }
        />

        <Metric
          title="Réussite"
          value={
            `${stats.successRate.toFixed(1)}%`
          }
          icon={
            <Percent size={16} />
          }
        />

        <Metric
          title="Durée moyenne"
          value={
            `${Math.round(
              stats.averageDuration
            )} ms`
          }
          icon={
            <Clock size={16} />
          }
        />
      </div>

      <div className="lab-stats__history">
        <header>
          <strong>
            RECENT EXECUTION LOG
          </strong>

          <span>
            {stats.successes}
            {' '}
            succès ·
            {' '}
            {stats.failures}
            {' '}
            erreur(s)
          </span>
        </header>

        {history.length === 0 ? (
          <div className="lab-stats__empty">
            Aucune exécution récente.
          </div>
        ) : (
          history
            .slice()
            .reverse()
            .slice(0, 40)
            .map(
              (execution) => (
                <article
                  key={execution.id}
                  className={
                    execution.success
                      ? 'is-success'
                      : 'is-error'
                  }
                >
                  <span className="status-dot" />

                  <code>
                    {execution.id.slice(
                      0,
                      16
                    )}
                  </code>

                  <span>
                    {execution.language}
                  </span>

                  <span>
                    {execution.duration}
                    {' '}
                    ms
                  </span>

                  <strong>
                    {execution.success
                      ? 'SUCCESS'
                      : 'ERROR'}
                  </strong>
                </article>
              )
            )
        )}
      </div>
    </section>
  )
}
