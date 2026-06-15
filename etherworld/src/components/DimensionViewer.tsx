
import { X } from 'lucide-react';
import IsometricCanvas from './IsometricCanvas';

interface DimensionViewerProps {
  activeDim: string;
  onClose: () => void;
}

export default function DimensionViewer({ activeDim, onClose }: DimensionViewerProps) {
  const DIM_DATA: Record<string, { color: string; desc: string; formula: string }> = {
    X: { color: '#f5a623', desc: 'Horizontal Spatial Axis', formula: 'f(x) = Σ(position · weight)' },
    Y: { color: '#00d4ff', desc: 'Vertical Spatial Axis', formula: 'f(y) = ∫(height · density)dy' },
    Z: { color: '#00ff88', desc: 'Depth / Layer Stack', formula: 'f(z) = layer₀ + Σ(zₙ · opacity)' },
    T: { color: '#ff3b3b', desc: 'Temporal Sequence', formula: 'f(t) = keyframe·lerp(t₀, t₁)' },
    C: { color: '#b464ff', desc: 'Conceptual Dimension', formula: 'f(c) = ∇semantic·context⁻¹' },
  };

  const dim = DIM_DATA[activeDim] || DIM_DATA['X'];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(8, 10, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
      onClick={onClose}
    >
      <div
        style={{
          width: 600,
          height: 500,
          background: 'var(--surface)',
          border: `1px solid ${dim.color}40`,
          borderRadius: 4,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 0 60px ${dim.color}20, 0 40px 80px rgba(0,0,0,0.6)`,
          animation: 'slide-in-up 0.3s cubic-bezier(0.2,0,0,1) both',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Corner decorators */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTop: `2px solid ${dim.color}`, borderLeft: `2px solid ${dim.color}` }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTop: `2px solid ${dim.color}`, borderRight: `2px solid ${dim.color}` }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottom: `2px solid ${dim.color}`, borderLeft: `2px solid ${dim.color}` }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottom: `2px solid ${dim.color}`, borderRight: `2px solid ${dim.color}` }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: `1px solid ${dim.color}20`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              color: dim.color,
              lineHeight: 1,
              textShadow: `0 0 20px ${dim.color}60`,
            }}>
              {activeDim}
            </span>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Dimension {activeDim}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                {dim.desc}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 3,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <IsometricCanvas dimension={activeDim} />
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px',
          borderTop: `1px solid ${dim.color}20`,
          background: 'var(--abyss)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: dim.color,
            opacity: 0.6,
          }}>
            {dim.formula}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['X','Y','Z','T','C'].map(d => (
              <div key={d} style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: d === activeDim ? DIM_DATA[d]?.color : 'var(--border-bright)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
