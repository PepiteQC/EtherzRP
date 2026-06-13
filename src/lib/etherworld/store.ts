import { create } from 'zustand';

export type ObjectCategory = 
  | 'meubles' 
  | 'cuisine' 
  | 'sdb' 
  | 'structures' 
  | 'exterieur' 
  | 'routes' 
  | 'deco' 
  | 'eclairage' 
  | 'formes' 
  | 'prison' 
  | 'hotel' 
  | 'commerce' 
  | 'electronique' 
  | 'special';

export interface PlacedObject {
  id: string;
  modelType: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
  color: string;
  category: ObjectCategory;
  doorOpen?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  type: 'chat' | 'system' | 'admin';
}

export interface GameState {
  sessionActive: boolean;
  isAdmin: boolean;
  isGodMode: boolean;
  buildMode: boolean;
  selectedModelType: string | null;
  selectedCategory: ObjectCategory | null;
  placedObjects: PlacedObject[];
  selectedPlacedId: string | null;
  ghostPosition: [number, number, number] | null;
  ghostRotation: number;
  ghostScale: number;
  playerPos: [number, number, number];
  flyMode: boolean;
  chatOpen: boolean;
  chatMessages: ChatMessage[];
  adminOpen: boolean;
  timeOfDay: number;
  weather: 'clear' | 'rain' | 'snow' | 'fog';
  animatingDoors: Record<string, number>;
  
  // Corridor/Room states
  currentView: 'building' | 'corridor' | 'room';
  corridorApartments: any[];
  lights: Record<string, boolean>;
}

interface GameActions {
  set: (partial: Partial<GameState>) => void;
  addPlacedObject: (obj: Omit<PlacedObject, 'id'>) => void;
  removePlacedObject: (id: string) => void;
  updatePlacedObject: (id: string, updates: Partial<PlacedObject>) => void;
  toggleDoor: (id: string) => void;
  selectPlacedObject: (id: string | null) => void;
  setGhostPosition: (pos: [number, number, number] | null) => void;
  setGhostRotation: (rot: number) => void;
  rotateGhost: () => void;
  addChatMessage: (sender: string, text: string, type?: ChatMessage['type']) => void;
  toggleBuildMode: () => void;
  setSelectedModelType: (type: string | null, category?: ObjectCategory) => void;
  setSessionActive: (active: boolean) => void;
  toggleGodMode: () => void;
  toggleFlyMode: () => void;
  setPlayerPos: (pos: [number, number, number]) => void;
  setTimeOfDay: (h: number) => void;
  setWeather: (w: 'clear' | 'rain' | 'snow' | 'fog') => void;
  setAnimatingDoor: (id: string, progress: number) => void;
  setCurrentView: (view: 'building' | 'corridor' | 'room') => void;
}

const uid = () => `obj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useGameState = create<GameState & GameActions>((set, get) => ({
  sessionActive: false,
  isAdmin: true,
  isGodMode: false,
  buildMode: false,
  selectedModelType: null,
  selectedCategory: null,
  placedObjects: [],
  selectedPlacedId: null,
  ghostPosition: null,
  ghostRotation: 0,
  ghostScale: 1,
  playerPos: [0, 0, 0],
  flyMode: false,
  chatOpen: false,
  chatMessages: [{
    id: 'w1',
    sender: 'System',
    text: '💎 EtherWorld RP — Builder Mode. Cliquez B pour construire.',
    timestamp: Date.now(),
    type: 'system'
  }],
  adminOpen: false,
  timeOfDay: 22,
  weather: 'clear',
  animatingDoors: {},
  currentView: 'building',
  corridorApartments: [],
  lights: {},

  set: (p) => set(p),
  
  addPlacedObject: (obj) => set((s) => ({
    placedObjects: [...s.placedObjects, { ...obj, id: uid() }]
  })),
  
  removePlacedObject: (id) => set((s) => ({
    placedObjects: s.placedObjects.filter((o) => o.id !== id),
    selectedPlacedId: s.selectedPlacedId === id ? null : s.selectedPlacedId
  })),
  
  updatePlacedObject: (id, updates) => set((s) => ({
    placedObjects: s.placedObjects.map((o) => (o.id === id ? { ...o, ...updates } : o))
  })),
  
  toggleDoor: (id) => set((s) => ({
    placedObjects: s.placedObjects.map((o) =>
      o.id === id ? { ...o, doorOpen: !o.doorOpen } : o
    )
  })),
  
  selectPlacedObject: (id) => set({ selectedPlacedId: id }),
  setGhostPosition: (pos) => set({ ghostPosition: pos }),
  setGhostRotation: (rot) => set({ ghostRotation: rot }),
  rotateGhost: () => set((s) => ({ ghostRotation: s.ghostRotation + Math.PI / 4 })),
  
  addChatMessage: (sender, text, type = 'chat') => set((s) => ({
    chatMessages: [...s.chatMessages.slice(-200), {
      id: uid(),
      sender,
      text,
      timestamp: Date.now(),
      type
    }]
  })),
  
  toggleBuildMode: () => {
    const s = get();
    set({
      buildMode: !s.buildMode,
      selectedModelType: null,
      ghostPosition: null,
      selectedPlacedId: null
    });
  },
  
  setSelectedModelType: (type, category) => set({
    selectedModelType: type,
    selectedCategory: category || null
  }),
  
  setSessionActive: (active) => set({ sessionActive: active }),
  
  toggleGodMode: () => {
    const n = !get().isGodMode;
    set({ isGodMode: n });
    get().addChatMessage('Admin', n ? '🛡️ God Mode ON' : '🛡️ God Mode OFF', 'system');
  },
  
  toggleFlyMode: () => {
    const n = !get().flyMode;
    set({ flyMode: n });
    get().addChatMessage('Admin', n ? '🪰 Fly Mode ON' : '🪰 Fly Mode OFF', 'system');
  },
  
  setPlayerPos: (pos) => set({ playerPos: pos }),
  setTimeOfDay: (h) => set({ timeOfDay: h }),
  setWeather: (w) => set({ weather: w }),
  setAnimatingDoor: (id, progress) => set((s) => ({
    animatingDoors: { ...s.animatingDoors, [id]: progress }
  })),
  
  setCurrentView: (view) => set({ currentView: view }),
}));

// Helper functions for external use
export const setGlobal = (p: Partial<GameState>) => useGameState.getState().set(p);
export const addPlaced = (o: Omit<PlacedObject, 'id'>) => useGameState.getState().addPlacedObject(o);
export const removePlaced = (id: string) => useGameState.getState().removePlacedObject(id);
export const updatePlaced = (id: string, u: Partial<PlacedObject>) => useGameState.getState().updatePlacedObject(id, u);
export const toggleDoor = (id: string) => useGameState.getState().toggleDoor(id);
export const selectPlaced = (id: string | null) => useGameState.getState().selectPlacedObject(id);
export const toggleBuild = () => useGameState.getState().toggleBuildMode();
export const toggleGod = () => useGameState.getState().toggleGodMode();
export const toggleFly = () => useGameState.getState().toggleFlyMode();
export const setChatOpen = (o: boolean) => useGameState.getState().set({ chatOpen: o });
export const setAdminOpen = (o: boolean) => useGameState.getState().set({ adminOpen: o });
export const selectModel = (t: string | null, c?: ObjectCategory) => useGameState.getState().setSelectedModelType(t, c);
export const rotateGhost = () => useGameState.getState().rotateGhost();
export const addChat = (s: string, t: string, ty?: ChatMessage['type']) => useGameState.getState().addChatMessage(s, t, ty);

// Compatibility aliases for the newer EtherWorld room/corridor imports.
export const useEtherWorldStore: any = useGameState as any;
export const useStore: any = useGameState as any;
