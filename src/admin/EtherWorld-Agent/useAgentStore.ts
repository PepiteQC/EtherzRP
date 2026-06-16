import { create } from 'zustand'

export interface Agent {
  id: string
  type: string
  position: [number, number, number]
  color: string
  status: string
  energy: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  /** Résumés des actions exécutées dans le monde (côté agent). */
  actions?: string[]
  /** Origine de la réponse de l'agent. */
  source?: 'troxt' | 'local'
  at: number
}

interface AgentState {
  activeAgents: Agent[]
  messages: ChatMessage[]
  thinking: boolean
  spawnAgent: (config: Partial<Agent>) => void
  removeAgent: (id: string) => void
  clearAgents: () => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'at'>) => void
  setThinking: (thinking: boolean) => void
}

export const useAgentStore = create<AgentState>((set) => ({
  activeAgents: [],
  messages: [],
  thinking: false,

  spawnAgent: (config) => {
    const id = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
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
  },

  clearAgents: () => set({ activeAgents: [] }),

  addMessage: (msg) => set(state => ({
    messages: [
      ...state.messages,
      { ...msg, id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: Date.now() },
    ],
  })),

  setThinking: (thinking) => set({ thinking }),
}))
