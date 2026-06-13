import React, { useState } from 'react'
import { useAgentStore } from './useAgentStore'
import { Bot, Send } from 'lucide-react'

interface Props {
  context?: { weather: string; entities: number }
}

export default function EtherWorldAgent({ context }: Props) {
  const [input, setInput] = useState('')
  const { activeAgents, spawnAgent } = useAgentStore()

  const handleCommand = (cmd: string) => {
    const lower = cmd.toLowerCase()
    
    if (lower.includes('pluie') || lower.includes('rain')) {
      window.dispatchEvent(new CustomEvent('set-weather', { detail: { preset: 'rain' } }))
    } 
    else if (lower.includes('neige') || lower.includes('snow')) {
      window.dispatchEvent(new CustomEvent('set-weather', { detail: { preset: 'snow' } }))
    } 
    else if (lower.includes('spawn') || lower.includes('agent')) {
      const count = parseInt(cmd.match(/\d+/)?.[0] || '3')
      for (let i = 0; i < count; i++) {
        spawnAgent({
          type: 'explorer',
          position: [(Math.random()-0.5)*160, 14, (Math.random()-0.5)*160]
        })
      }
    }
    else if (lower.includes('explosion')) {
      window.dispatchEvent(new CustomEvent('arcane-tree-explosion'))
    }
  }

  const submit = () => {
    if (!input.trim()) return
    handleCommand(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-6 h-6" />
        <div>
          <div className="font-bold">EtherWorld Agent v2.0</div>
          <div className="text-xs text-white/50">{activeAgents.length} agents actifs</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto mb-4 text-sm space-y-4">
        {activeAgents.length === 0 && (
          <div className="text-white/40">Aucun agent actif. Demandez-en via le chat.</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Ex: spawn 5 agents, fais pleuvoir, déclenche explosion..."
          className="flex-1 bg-white/5 border border-white/20 rounded-2xl px-5 py-3 text-sm"
        />
        <button onClick={submit} className="px-6 rounded-2xl bg-white text-black">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
