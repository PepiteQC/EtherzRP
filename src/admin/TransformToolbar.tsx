import React from 'react'
import { Move, RotateCw, Scale } from 'lucide-react'

interface Props {
  onModeChange: (mode: string) => void
  active: boolean
  currentMode?: string
}

export default function TransformToolbar({ onModeChange, active, currentMode = 'translate' }: Props) {
  if (!active) return null

  return (
    <div className="transform-toolbar">
      {[
        { mode: 'translate', icon: Move, label: 'Move' },
        { mode: 'rotate', icon: RotateCw, label: 'Rotate' },
        { mode: 'scale', icon: Scale, label: 'Scale' }
      ].map(tool => {
        const Icon = tool.icon
        return (
          <button key={tool.mode} onClick={() => onModeChange(tool.mode)}
            className={`transform-btn ${currentMode === tool.mode ? 'active' : ''}`}>
            <Icon className="w-4 h-4 mr-2" /> {tool.label}
          </button>
        )
      })}
    </div>
  )
}
