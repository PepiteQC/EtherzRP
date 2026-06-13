/**
 * InteractionPrompt.tsx
 * Prompt HTML overlay "[E] Interagir" — affiché quand le joueur
 * est près d'une zone d'interaction
 */

import { memo } from 'react'

interface InteractionPromptProps {
  label:    string | null
  visible:  boolean
}

export const InteractionPrompt = memo(function InteractionPrompt({
  label,
  visible,
}: InteractionPromptProps) {
  if (!visible || !label) return null

  return (
    <div
      style={{
        position:        'absolute',
        bottom:          '28%',
        left:            '50%',
        transform:       'translateX(-50%)',
        background:      'rgba(0,0,0,0.75)',
        border:          '1px solid rgba(255,255,255,0.25)',
        borderRadius:    8,
        padding:         '8px 18px',
        color:           '#ffffff',
        fontSize:        15,
        fontFamily:      'monospace',
        letterSpacing:   1,
        whiteSpace:      'nowrap',
        pointerEvents:   'none',
        backdropFilter:  'blur(4px)',
        boxShadow:       '0 2px 12px rgba(0,0,0,0.4)',
        animation:       'fadeIn 0.15s ease',
        zIndex:          100,
      }}
    >
      <span style={{ color: '#ffcc00', fontWeight: 'bold', marginRight: 8 }}>
        [E]
      </span>
      {label}
    </div>
  )
})