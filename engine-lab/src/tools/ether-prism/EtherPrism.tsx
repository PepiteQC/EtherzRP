// ═══════════════════════════════════════════════
// EtherPrism.tsx
// Interface complète · Connectée à TroxT
// ═══════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from 'react';
import { useEtherPrismStore, type TroxTAgent } from './EtherPrismStore';
import type { EtherPrismEvent, EtherSource } from './types';
import { EtherDropZone } from './components/EtherDropZone';
import { PrismPreview } from './components/PrismPreview';
import { getMemorySync } from './lib/etherSync';
import { etherBatch } from './lib/etherBatch';
import './ether-prism.css';

interface EtherPrismProps {
  troxt: TroxTAgent;
  onEvent?: (event: EtherPrismEvent) => void;
}

export function EtherPrism({ troxt, onEvent }: EtherPrismProps) {
  const store = useEtherPrismStore();
  const {
    connectTroxT, mode, setMode, config, setConfig,
    submitSource, submitBatch, currentPacketId, getResult, getAnalysis,
    isProcessing, clearResults, cancelProcessing,
  } = store;

  const [showBatch, setShowBatch] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [memoryInsights, setMemoryInsights] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Connexion TroxT
  useEffect(() => {
    connectTroxT(troxt);
  }, [troxt, connectTroxT]);

  // Logs TroxT
  useEffect(() => {
    const handler = (data: unknown) => {
      if (data && typeof data === 'object' && 'type' in data) {
        const event = data as EtherPrismEvent;
        if (event.type.startsWith('TROXT:')) {
          addLog(`🧠 ${event.type.replace('TROXT:', '')}`);
        }
      }
    };
    troxt.emit = ((original: typeof troxt.emit) => {
      return (event: never) => {
        handler(event);
        original(event);
      };
    })(troxt.emit);
  }, [troxt]);

  const addLog = useCallback((msg: string) => {
    if (logRef.current) {
      const div = document.createElement('div');
      div.textContent = `[${new Date().toLocaleTimeString('fr-FR')}] ${msg}`;
      div.className = 'ether-prism__log-entry';
      logRef.current.appendChild(div);
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  // Charger les insights mémoire
  useEffect(() => {
    const loadInsights = async () => {
      const sync = getMemorySync(troxt as never);
      const insights = await sync.getInsights();
      setMemoryInsights(insights.slice(-10));
    };
    loadInsights();
  }, [troxt]);

  const handleDrop = async (files: FileList | File[]) => {
    const sources: EtherSource[] = Array.from(files).map(f => ({
      type: 'file',
      data: f,
      mimeType: f.type,
      name: f.name,
    }));

    if (sources.length === 1) {
      await submitSource(sources[0]);
    } else {
      setBatchFiles(Array.from(files));
      setShowBatch(true);
    }
  };

  const handleBatchSubmit = async () => {
    await submitBatch(batchFiles);
    setShowBatch(false);
    setBatchFiles([]);
  };

  const result = currentPacketId ? getResult(currentPacketId) : undefined;
  const analysis = currentPacketId ? getAnalysis(currentPacketId) : undefined;

  return (
    <div className="ether-prism">
      {/* ── HEADER ── */}
      <header className="ether-prism__header">
        <div className="ether-prism__brand">
          <div className="ether-prism__logo">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <path d="M12 2 L2 20 L22 20 Z" stroke="url(#prismGrad)" strokeWidth="2" fill="none"/>
              <path d="M12 8 L7 18 L17 18 Z" fill="url(#prismGrad)" opacity="0.4"/>
              <circle cx="12" cy="14" r="2" fill="#22d3ee"/>
              <defs>
                <linearGradient id="prismGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#22d3ee"/>
                  <stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="ether-prism__pulse"/>
          </div>
          <div>
            <h1 className="ether-prism__title">EtherPrism</h1>
            <p className="ether-prism__subtitle">Organe sensoriel · TroxT · Etherworld</p>
          </div>
        </div>

        <div className="ether-prism__actions">
          <div className="ether-prism__modes">
            {(['analyze', 'transform', 'generate', 'orchestrate'] as const).map(m => (
              <button
                key={m}
                className={`ether-prism__mode ${mode === m ? 'is-active' : ''}`}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="ether-prism__tools">
            <button 
              className="ether-prism__tool-btn"
              onClick={() => setShowBatch(!showBatch)}
              title="Traitement par lot"
            >
              📦 Batch
            </button>
            <button 
              className="ether-prism__tool-btn"
              onClick={async () => {
                const sync = getMemorySync(troxt as never);
                const insights = await sync.getInsights();
                setMemoryInsights(insights.slice(-10));
              }}
              title="Mémoire TroxT"
            >
              🧠 Mémoire
            </button>
            <button 
              className="ether-prism__tool-btn"
              onClick={clearResults}
              title="Réinitialiser"
            >
              🗑️
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="ether-prism__body">
        {/* Drop Zone */}
        <EtherDropZone onDrop={handleDrop} disabled={isProcessing} />

        {/* Batch Panel */}
        {showBatch && (
          <div className="ether-prism__batch">
            <h3>📦 Traitement par lot — {batchFiles.length} fichiers</h3>
            <div className="ether-prism__batch-list">
              {batchFiles.map((f, i) => (
                <div key={i} className="ether-prism__batch-item">
                  <span>{f.name}</span>
                  <span>{(f.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
            <button onClick={handleBatchSubmit} className="ether-prism__btn-primary" disabled={isProcessing}>
              {isProcessing ? 'Traitement…' : `Lancer le batch (${batchFiles.length})`}
            </button>
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="ether-prism__status">
            <div className="ether-prism__spinner"/>
            <span>TroxT analyse la matière visuelle…</span>
            <button onClick={cancelProcessing} className="ether-prism__cancel">Annuler</button>
          </div>
        )}

        {/* Error */}
        {result?.error && (
          <div className="ether-prism__error">
            <strong>❌ Erreur TroxT :</strong> {result.error.message}
            {result.error.troxtSuggestion && (
              <p className="ether-prism__suggestion">💡 Suggestion TroxT: {result.error.troxtSuggestion}</p>
            )}
          </div>
        )}

        {/* Analysis */}
        {analysis && (
          <div className="ether-prism__analysis">
            <h3>🔍 Insight TroxT</h3>
            <p className="ether-prism__insight">{analysis.troxtInsight}</p>

            {analysis.aiEnhancement && (
              <div className="ether-prism__ai">
                <h4>🤖 Suggestion AI</h4>
                <p className="ether-prism__ai-prompt">{analysis.aiEnhancement.prompt}</p>
                <div className="ether-prism__ai-variations">
                  {analysis.aiEnhancement.variations.map((v, i) => (
                    <span key={i} className="ether-prism__ai-var">{v}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="ether-prism__palette">
              {analysis.palette.map((c, i) => (
                <div key={i} className="ether-prism__swatch" style={{ background: c.hex }} title={`${c.name} (${c.hex})`}>
                  <span>{c.hex}</span>
                </div>
              ))}
            </div>

            <div className="ether-prism__meta">
              <span>Mood: <strong>{analysis.dominantMood}</strong></span>
              <span>Complexité: <strong>{(analysis.complexity * 100).toFixed(0)}%</strong></span>
              {analysis.compressionStats && (
                <span>Compression: <strong>{(analysis.compressionStats.ratio * 100).toFixed(0)}%</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Preview */}
        {result?.output && (
          <PrismPreview url={result.output.url} format={result.output.format} />
        )}

        {/* Memory Insights */}
        {memoryInsights.length > 0 && (
          <div className="ether-prism__memory">
            <h3>🧠 Mémoire TroxT</h3>
            {memoryInsights.map((insight, i) => (
              <div key={i} className="ether-prism__memory-item">{insight}</div>
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER — Config ── */}
      <footer className="ether-prism__footer">
        <div className="ether-prism__config-row">
          <label className="ether-prism__config">
            <span>Qualité</span>
            <select value={config.quality} onChange={e => setConfig({ quality: e.target.value as any })}>
              <option value="draft">Brouillon</option>
              <option value="standard">Standard</option>
              <option value="prism">Prism</option>
              <option value="ultra">Ultra (lent)</option>
            </select>
          </label>

          <label className="ether-prism__config">
            <span>Format</span>
            <select value={config.outputFormat} onChange={e => setConfig({ outputFormat: e.target.value as any })}>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
              <option value="svg">SVG</option>
              <option value="sprite-sheet">Sprite</option>
              <option value="gltf">3D GLTF</option>
              <option value="shader">Shader</option>
            </select>
          </label>

          <label className="ether-prism__config">
            <span>Profondeur</span>
            <input type="range" min="1" max="10" value={config.neuralDepth} 
              onChange={e => setConfig({ neuralDepth: +e.target.value })}/>
            <span>{config.neuralDepth}</span>
          </label>
        </div>

        <div className="ether-prism__toggles">
          <label className="ether-prism__toggle">
            <input type="checkbox" checked={config.compressOutput} onChange={e => setConfig({ compressOutput: e.target.checked })}/>
            <span>Compresser</span>
          </label>
          <label className="ether-prism__toggle">
            <input type="checkbox" checked={config.enhanceWithAI} onChange={e => setConfig({ enhanceWithAI: e.target.checked })}/>
            <span>AI Enhance</span>
          </label>
          <label className="ether-prism__toggle">
            <input type="checkbox" checked={config.autoOrchestrate} onChange={e => setConfig({ autoOrchestrate: e.target.checked })}/>
            <span>Orchestration TroxT</span>
          </label>
          <label className="ether-prism__toggle">
            <input type="checkbox" checked={config.syncToMemory} onChange={e => setConfig({ syncToMemory: e.target.checked })}/>
            <span>Sync Mémoire</span>
          </label>
        </div>
      </footer>

      {/* ── LOGS ── */}
      <div className="ether-prism__logs" ref={logRef}>
        <div className="ether-prism__log-header">📋 Journal TroxT</div>
      </div>
    </div>
  );
}