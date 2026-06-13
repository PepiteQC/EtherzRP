import React from 'react'

interface Props {
  onInput: (key: string) => void
}

export default function Keypad({ onInput }: Props) {
  const keys = ['7','8','9','4','5','6','1','2','3','0','.','ENT']
  return (
    <div className="keypad">
      {keys.map((k, i) => (
        <button key={i} onClick={() => onInput(k)} className="keypad-btn">{k}</button>
      ))}
    </div>
  )
}
