'use client'

import { create } from 'zustand'

// Types de locations dans le monde
export type WorldLocation = 
  | 'city'           // Ville exterieure
  | 'hotel-lobby'    // Hall de l'hotel
  | 'hotel-corridor' // Corridor de l'hotel (etage)
  | 'hotel-room'     // Chambre d'hotel (ta chambre)
  | 'depanneur'      // Interieur du depanneur

// Interface pour les zones interactives
export interface InteractionZone {
  id: string
  type: 'door' | 'elevator' | 'portal'
  position: [number, number, number]
  targetLocation: WorldLocation
  targetPosition: [number, number, number]
  label: string
  requiresKey?: boolean
  isLocked?: boolean
}

// State du monde
interface WorldState {
  // Location actuelle
  currentLocation: WorldLocation
  previousLocation: WorldLocation | null
  
  // Position du joueur
  playerPosition: [number, number, number]
  playerRotation: number
  
  // Heure et meteo
  timeOfDay: number // 0-24
  weather: 'clear' | 'rain' | 'snow' | 'fog'
  
  // Transition
  isTransitioning: boolean
  transitionProgress: number
  
  // Hotel specifique
  currentFloor: number
  playerRoomNumber: string
  
  // UI
  showInteractionPrompt: boolean
  interactionPromptText: string
  nearbyZone: InteractionZone | null
  
  // Portes ouvertes (par ID)
  openDoors: Set<string>
  
  // Mode debug/god
  isGodMode: boolean
  flyMode: boolean
  buildMode: boolean
  
  // Actions
  setLocation: (location: WorldLocation) => void
  setPlayerPosition: (pos: [number, number, number]) => void
  setPlayerRotation: (rot: number) => void
  setTimeOfDay: (time: number) => void
  setWeather: (weather: WorldState['weather']) => void
  startTransition: (to: WorldLocation, targetPos: [number, number, number]) => void
  completeTransition: () => void
  setNearbyZone: (zone: InteractionZone | null) => void
  interact: () => void
  toggleDoor: (doorId: string) => void
  isDoorOpen: (doorId: string) => boolean
  toggleGodMode: () => void
  toggleFlyMode: () => void
  toggleBuildMode: () => void
}

export const useWorldStore = create<WorldState>((set, get) => ({
  // Initial state - commence dans la chambre d'hotel
  currentLocation: 'hotel-room',
  previousLocation: null,
  
  // Position dans la chambre (la chambre est a [-9, 0, 32.2] avec rotation 90deg)
  // Centre de la chambre dans le monde = [-9, 0, 32.2]
  playerPosition: [-12, 0, 32], // Au milieu de la chambre
  playerRotation: Math.PI / 2, // Face a la porte
  
  timeOfDay: 20, // Soir
  weather: 'clear',
  
  isTransitioning: false,
  transitionProgress: 0,
  
  currentFloor: 1,
  playerRoomNumber: 'A-1-09',
  
  showInteractionPrompt: false,
  interactionPromptText: '',
  nearbyZone: null,
  
  // Portes ouvertes
  openDoors: new Set<string>(),
  
  isGodMode: false,
  flyMode: false,
  buildMode: false,
  
  // Actions
  setLocation: (location) => set((state) => ({ 
    previousLocation: state.currentLocation,
    currentLocation: location 
  })),
  
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  
  setPlayerRotation: (rot) => set({ playerRotation: rot }),
  
  setTimeOfDay: (time) => set({ timeOfDay: time % 24 }),
  
  setWeather: (weather) => set({ weather }),
  
  startTransition: (to, targetPos) => set({
    isTransitioning: true,
    transitionProgress: 0,
  }),
  
  completeTransition: () => set((state) => ({
    isTransitioning: false,
    transitionProgress: 1,
    currentLocation: state.currentLocation,
  })),
  
  setNearbyZone: (zone) => set({
    nearbyZone: zone,
    showInteractionPrompt: zone !== null,
    interactionPromptText: zone ? `[E] ${zone.type === 'door' ? (get().openDoors.has(zone.id) ? 'Fermer' : 'Ouvrir') : ''} ${zone.label}` : '',
  }),
  
  interact: () => {
    const state = get()
    if (state.nearbyZone && !state.nearbyZone.isLocked) {
      const zone = state.nearbyZone
      
      // Pour les portes: ouvrir/fermer au lieu de teleporter
      if (zone.type === 'door') {
        const newOpenDoors = new Set(state.openDoors)
        if (newOpenDoors.has(zone.id)) {
          newOpenDoors.delete(zone.id)
        } else {
          newOpenDoors.add(zone.id)
        }
        set({ 
          openDoors: newOpenDoors,
          interactionPromptText: `[E] ${newOpenDoors.has(zone.id) ? 'Fermer' : 'Ouvrir'} ${zone.label}`,
        })
        return
      }
      
      // Pour les ascenseurs et portals: teleporter
      if (zone.type === 'elevator' || zone.type === 'portal') {
        set({
          isTransitioning: true,
          transitionProgress: 0,
        })
        
        setTimeout(() => {
          set({
            currentLocation: zone.targetLocation,
            playerPosition: zone.targetPosition,
            isTransitioning: false,
            transitionProgress: 1,
            nearbyZone: null,
            showInteractionPrompt: false,
          })
        }, 500)
      }
    }
  },
  
  toggleDoor: (doorId) => set((state) => {
    const newOpenDoors = new Set(state.openDoors)
    if (newOpenDoors.has(doorId)) {
      newOpenDoors.delete(doorId)
    } else {
      newOpenDoors.add(doorId)
    }
    return { openDoors: newOpenDoors }
  }),
  
  isDoorOpen: (doorId) => get().openDoors.has(doorId),
  
  toggleGodMode: () => set((state) => ({ isGodMode: !state.isGodMode })),
  toggleFlyMode: () => set((state) => ({ flyMode: !state.flyMode })),
  toggleBuildMode: () => set((state) => ({ buildMode: !state.buildMode })),
}))

// Zones d'interaction predefinies
export const INTERACTION_ZONES: Record<WorldLocation, InteractionZone[]> = {
  'city': [
    {
      id: 'hotel-entrance',
      type: 'door',
      position: [0, 0, -42], // Position de l'entree de l'hotel (l'hotel est a [0, 0.2, -SPACING] = [0, 0.2, -52])
      targetLocation: 'hotel-lobby',
      targetPosition: [0, 0, 5],
      label: 'Entrer dans l\'hotel',
    },
    {
      id: 'depanneur-entrance',
      type: 'door',
      position: [-52, 0, 7], // Position du depanneur (a [-SPACING, 0.2, 0], porte a z+7)
      targetLocation: 'depanneur',
      targetPosition: [0, 0, 4],
      label: 'Entrer dans le depanneur',
    },
  ],
  'hotel-lobby': [
    {
      id: 'lobby-exit',
      type: 'door',
      position: [0, 0, 10],
      targetLocation: 'city',
      targetPosition: [0, 0, -45], // Devant l'hotel dans la ville
      label: 'Sortir de l\'hotel',
    },
    {
      id: 'lobby-elevator',
      type: 'elevator',
      position: [0, 0, -8],
      targetLocation: 'hotel-corridor',
      targetPosition: [0, 0, 10], // Debut du corridor (pres de l'ascenseur)
      label: 'Prendre l\'ascenseur (Etage 1)',
    },
  ],
  'hotel-corridor': [
    {
      id: 'corridor-elevator-down',
      type: 'elevator',
      position: [0, 0, 39.5], // Position de l'ascenseur au bout du corridor
      targetLocation: 'hotel-lobby',
      targetPosition: [0, 0, 0], // Spawn dans le lobby
      label: 'Prendre l\'ascenseur - Descendre au lobby',
    },
    {
      id: 'player-room-door',
      type: 'door',
      position: [-2.5, 0, 32], // Position de la porte A-1-09 (cote gauche du corridor)
      targetLocation: 'hotel-room',
      targetPosition: [-12, 0, 32], // Spawn dans la chambre
      label: 'Entrer dans votre chambre (A-1-09)',
    },
  ],
  'hotel-room': [
    {
      id: 'room-exit',
      type: 'door',
      position: [-3, 0, 32], // Position pres de la porte (vers le corridor)
      targetLocation: 'hotel-corridor',
      targetPosition: [0, 0, 32],
      label: 'Sortir dans le corridor',
    },
  ],
  'depanneur': [
    {
      id: 'depanneur-exit',
      type: 'door',
      position: [0, 0, 7],
      targetLocation: 'city',
      targetPosition: [-52, 0, 9], // Devant le depanneur
      label: 'Sortir du depanneur',
    },
  ],
}
