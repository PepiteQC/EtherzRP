import { create } from 'zustand'

export interface GameState {
  sessionActive: boolean
  playerPos: [number, number, number]
  playerRotation: [number, number, number]
  buildMode: boolean
  selectedModelType: string | null
  placedObjects: any[]
  buildings: any[]
  roads: any[]
  weather: string
  timeOfDay: number
  chatMessages: any[]
  chatOpen: boolean
  showHUD: boolean
  godMode: boolean
  flyMode: boolean
  playerBalance: number
  
  // Actions
  setSessionActive: (active: boolean) => void
  setPlayerPosition: (pos: [number, number, number]) => void
  addChatMessage: (sender: string, text: string) => void
  toggleBuildMode: () => void
  toggleFlyMode: () => void
  toggleGodMode: () => void
  advanceTime: (minutes: number) => void
  setWeather: (w: string) => void
  addBuilding: (building: any) => void
  placeObject: (obj: any) => void
  setState: (partial: Partial<GameState>) => void
}

const useGameStore = create<GameState>((set, get) => ({
  // STATE
  sessionActive: false,
  playerPos: [0, 1, 0],
  playerRotation: [0, 0, 0],
  buildMode: false,
  selectedModelType: null,
  placedObjects: [],
  buildings: [],
  roads: [],
  weather: 'clear',
  timeOfDay: 12,
  chatMessages: [{ id: '0', sender: 'System', text: '💎 Welcome to EtherWorld v5.0!', timestamp: Date.now() }],
  chatOpen: false,
  showHUD: true,
  godMode: false,
  flyMode: false,
  playerBalance: 5000,

  // ACTIONS
  setSessionActive: (active) => set({ sessionActive: active }),
  
  setPlayerPosition: (pos) => set({ playerPos: pos }),
  
  addChatMessage: (sender, text) => set((state) => ({
    chatMessages: [...state.chatMessages, {
      id: `msg_${Date.now()}`,
      sender,
      text,
      timestamp: Date.now(),
    }],
  })),
  
  toggleBuildMode: () => set((state) => ({ buildMode: !state.buildMode })),
  
  toggleFlyMode: () => set((state) => ({ flyMode: !state.flyMode })),
  
  toggleGodMode: () => set((state) => ({ godMode: !state.godMode })),
  
  advanceTime: (minutes) => set((state) => ({
    timeOfDay: (state.timeOfDay + minutes / 60) % 24,
  })),
  
  setWeather: (w) => set({ weather: w }),
  
  addBuilding: (building) => set((state) => ({
    buildings: [...state.buildings, building],
  })),
  
  placeObject: (obj) => set((state) => ({
    placedObjects: [...state.placedObjects, { id: `obj_${Date.now()}`, ...obj }],
  })),
  
  setState: (partial) => set(partial),
}))

export default useGameStore
