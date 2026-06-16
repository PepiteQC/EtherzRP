import {
  CheckCircle2,
  Circle,
  Download,
  Image,
  LoaderCircle,
  OctagonAlert,
  Play,
  RotateCcw,
  ScanLine,
  Sparkles,
} from 'lucide-react'
import { ModelPreview } from './components/ModelPreview'
import { SourceDropZone } from './components/SourceDropZone'
import { useVisualForgeStore } from './VisualForgeStore'
import './visual-forge.css'

export default function VisualForgeTool() {
  const stage = useVisualForgeStore((state) => state.stage)
  const progress = useVisualForgeStore((state) => state.progress)
  const nodes = useVisualForgeStore((state) => state.nodes)
  const sourceFile = useVisualForgeStore((state) => state.sourceFile)
  const analysis = useVisualForgeStore((state) => state.analysis)
  const model = useVisualForgeStore((state) => state.model)
  const logs = useVisualForgeStore((state) => state.logs)
  const runPipeline = useVisualForgeStore((state) => state.runPipeline)
  const exportObj = useVisualForgeStore((state) => state.exportObj)
  const reset = useVisualForgeStore((state) => state.reset)

  return (
    <main className="visual-forge">
      <header className="visual-forge__header">
        <div className="visual-forge__brand">
          <div><Sparkles size={21} /></div>
          <span>
            <strong>VISUAL FORGE</strong>
            <small>ENGINE-LAB · IMAGE VERS RELIEF 3D</small>
          </span>
        </div>
      </header>

      <div className="visual-forge__layout">
        <aside className="visual-forge__left">
          <SourceDropZone />

          <section className="vf-panel">
            <div className="vf-panel__title">
              <div>
                <strong>Pipeline</strong>
                <span>{progress}%</span>
              </div>

              <div className="vf-panel__actions">
                <button
                  type="button"
                  onClick={() => void runPipeline()}
                  disabled={!sourceFile || stage === 'running'}
                >
                  <Play size={15} />
                  Générer
                </button>

                <button type="button" className="is-secondary" onClick={reset}>
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            <div className="vf-progress">
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="vf-nodes">
              {nodes.map((node) => {
                const Icon =
                  node.status === 'complete'
                    ? CheckCircle2
                    : node.status === 'running'
                      ? LoaderCircle
                      : node.status === 'error'
                        ? OctagonAlert
                        : Circle

                return (
                  <article key={node.id} className={`is-${node.status}`}>
                    <Icon
                      size={17}
                      className={node.status === 'running' ? 'is-spinning' : ''}
                    />
                    <div>
                      <strong>{node.label}</strong>
                      <span>{node.message}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </aside>

        <ModelPreview />

        <aside className="visual-forge__right">
          <section className="vf-panel vf-inspector">
            <div className="vf-panel__title">
              <div>
                <strong>Inspecteur</strong>
                <span>Données Visual Forge</span>
              </div>

              <button type="button" onClick={exportObj} disabled={!model}>
                <Download size={15} />
                OBJ
              </button>
            </div>

            <div className="vf-inspector__section">
              <h3><Image size={15} /> Image</h3>
              <div className="vf-metrics">
                <Metric
                  label="Résolution"
                  value={analysis ? `${analysis.width} × ${analysis.height}` : '—'}
                />
                <Metric
                  label="Luminosité"
                  value={analysis ? `${Math.round(analysis.brightness * 100)}%` : '—'}
                />
                <Metric
                  label="Contraste"
                  value={analysis ? analysis.contrast.toFixed(3) : '—'}
                />
                <Metric
                  label="Contours"
                  value={analysis ? analysis.edgeDensity.toFixed(3) : '—'}
                />
              </div>
            </div>

            <div className="vf-inspector__section">
              <h3><ScanLine size={15} /> Modèle</h3>
              <div className="vf-metrics">
                <Metric label="Sommets" value={model?.vertices ?? '—'} />
                <Metric label="Triangles" value={model?.triangles ?? '—'} />
                <Metric
                  label="Dimensions"
                  value={
                    model
                      ? `${model.width.toFixed(1)} × ${model.height.toFixed(1)} × ${model.depth.toFixed(1)}`
                      : '—'
                  }
                />
                <Metric
                  label="Couleur"
                  value={analysis?.averageColor ?? '—'}
                />
              </div>
            </div>

            <div className="vf-inspector__section">
              <h3>Journal</h3>
              <div className="vf-logs">
                {logs.length === 0 ? (
                  <span>Aucune opération.</span>
                ) : (
                  logs.slice(0, 8).map((entry) => (
                    <article key={entry.id} className={`is-${entry.level}`}>
                      <time>
                        {new Date(entry.createdAt).toLocaleTimeString('fr-CA')}
                      </time>
                      <span>{entry.message}</span>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="vf-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
