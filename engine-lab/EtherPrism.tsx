// ═══════════════════════════════════════
// EtherPrism.tsx
// Interface visuelle · Connectée à TroxT
// ═══════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useEtherPrismStore, type TroxTAgent } from './EtherPrismStore';
import type { EtherPrismEvent, EtherSource } from './types';
import { EtherDropZone } from './components/EtherDropZone';
import { PrismPreview } from './components/PrismPreview';
import './ether-prism.css';

interface EtherPrismProps {
  troxt: TroxTAgent;
  onEvent?: (event: EtherPrismEvent) => void;
}

export function EtherPrism({ troxt, onEvent }: EtherPrismProps) {
  const {
    connectTroxT, mode, setMode,
    submitSource, currentPacketId, getResult,
    defaultConfig, updateConfig,
  } = useEtherPrismStore();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventLogRef = useRef<EtherPrismEvent[]>([]);

  // Connexion à TroxT au montage
  useEffect(() => {
    connectTroxT(troxt);
  }, [troxt, connectTroxT]);

  // Écoute des événements TroxT
  useEffect(() => {
    const originalEmit = troxt.emit;
    troxt.emit = (event) => {
      eventLogRef.current.push(event);
      onEvent?.(event);
      originalEmit(event);
    };
    return () => { troxt.emit = originalEmit; };
  }, [troxt, onEvent]);

  const handleDrop = async (source: EtherSource) => {
    setProcessing(true);
    setError(null);
    try {
      await submitSource(source);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const result = currentPacketId ? getResult(currentPacketId) : undefined;

  return (
    <div className="ether-prism">
      <header className="ether-prism__header">
        <div className="ether-prism__brand">
          <div className="ether-prism__logo">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M12 2 L2 20 L22 20 Z" stroke="url(#prismGrad)" strokeWidth="2" fill="none"/>
              <path d="M12 8 L7 18 L17 18 Z" fill="url(#prismGrad)" opacity="0.4"/>
              <defs>
                <linearGradient id="prismGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#22d3ee"/>
                  <stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="ether-prism__title">EtherPrism</h1>
            <p className="ether-prism__subtitle">Organe sensoriel · TroxT · Etherworld</p>
          </div>
        </div>

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
      </header>

      <main className="ether-prism__body">
        <EtherDropZone onDrop={handleDrop} disabled={processing} />

        {processing && (
          <div className="ether-prism__status">
            <div className="ether-prism__spinner"/>
            <span>TroxT analyse la matière visuelle…</span>
          </div>
        )}

        {error && (
          <div className="ether-prism__error">
            <strong>Erreur TroxT :</strong> {error}
          </div>
        )}

        {result?.analysis && (
          <div className="ether-prism__analysis">
            <h3>Insight TroxT</h3>
            <p className="ether-prism__insight">{result.analysis.troxtInsight}</p>

            <div className="ether-prism__palette">
              {result.analysis.palette.map((c, i) => (
                <div key={i} className="ether-prism__swatch" style={{ background: c.hex }} title={c.hex}/>
              ))}
            </div>

            <div className="ether-prism__meta">
              <span>Mood: <strong>{result.analysis.dominantMood}</strong></span>
              <span>Complexité: <strong>{(result.analysis.complexity * 100).toFixed(0)}%</strong></span>
            </div>
          </div>
        )}

        {result?.output && (
          <PrismPreview url={result.output.url} format={result.output.format}/>
        )}
      </main>

      <footer className="ether-prism__footer">
        <label className="ether-prism__config">
          <span>Qualité</span>
          <select
            value={defaultConfig.quality}
            onChange={e => updateConfig({ quality: e.target.value as any })}
          >
            <option value="draft">Brouillon</option>
            <option value="standard">Standard</option>
            <option value="prism">Prism (max)</option>
          </select>
        </label>

        <label className="ether-prism__config">
          <span>Format</span>
          <select
            value={defaultConfig.outputFormat}
            onChange={e => updateConfig({ outputFormat: e.target.value as any })}
          >
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="svg">SVG</option>
            <option value="sprite-sheet">Sprite Sheet</option>
            <option value="texture-atlas">Texture Atlas</option>
            <option value="gltf">GLTF (3D)</option>
          </select>
        </label>

        <label className="ether-prism__config">
          <input
            type="checkbox"
            checked={defaultConfig.autoOrchestrate}
            onChange={e => updateConfig({ autoOrchestrate: e.target.checked })}
          />
          <span>Orchestration TroxT</span>
        </label>
      </footer>
    </div>
  );
}