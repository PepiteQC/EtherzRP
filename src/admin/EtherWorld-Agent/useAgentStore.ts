import { create } from 'zustand'

export interface Agent {
  id: string
  type: string
  position: [number, number, number]
  color: string
  status: string
  energy: number
}

interface AgentState {
  activeAgents: Agent[]
  spawnAgent: (config: Partial<Agent>) => void
  removeAgent: (id: string) => void
}

export const useAgentStore = create<AgentState>((set) => ({
  activeAgents: [],

  spawnAgent: (config) => {
    const id = `agent_${Date.now()}`
    set(state => ({
      activeAgents: [...state.activeAgents, {
        id,
        type: config.type || 'explorer',
        position: config.position || [0, 14, 0],
        color: config.color || '#22ff88',
        status: 'idle',
        energy: 90,
        ...config
      }]
    }))
  },

  removeAgent: (id) => {
    set(state => ({
      activeAgents: state.activeAgents.filter(a => a.id !== id)
    }))
  }
}))
