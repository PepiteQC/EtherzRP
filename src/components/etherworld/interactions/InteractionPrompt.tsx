import { buildPrompt } from './interactionTypes'
import { useInteractionStore } from './interactionStore'

export default function InteractionPrompt() {
  const hovered = useInteractionStore(s => s.hovered)
  if (!hovered) return null

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      bottom: 96,
      transform: 'translateX(-50%)',
      padding: '8px 16px',
      borderRadius: 8,
      background: 'rgba(2,8,16,0.82)',
      color: '#d8f3ff',
      border: '1px solid rgba(94,205,255,0.45)',
      boxShadow: '0 0 22px rgba(0,0,0,0.45)',
      fontFamily: 'monospace',
      fontSize: 12,
      letterSpacing: 1.5,
      pointerEvents: 'none',
      zIndex: 35,
      backdropFilter: 'blur(6px)',
    }}>
      <span style={{ color: '#70d6ff', fontWeight: 800 }}>CLIC</span>
      {' ou '}
      <span style={{ color: '#70d6ff', fontWeight: 800 }}>E</span>
      {' — '}{buildPrompt(hovered.target)}
    </div>
  )
}
