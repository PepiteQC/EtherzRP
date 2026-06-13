// Simplified in-memory store for EtherWorld
export const createGameStore = () => {
  let state = {
    sessionActive: false,
    playerPos: [0, 1, 0] as [number, number, number],
    buildings: [] as any[],
    placedObjects: [] as any[],
    timeOfDay: 12,
  }

  return {
    getState: () => state,
    setState: (partial: any) => { state = { ...state, ...partial } },
    subscribe: (cb: any) => () => {},
  }
}

const store = createGameStore()

export const useGameStore = (selector: (s: any) => any) => {
  return selector(store.getState())
}

export const WORLD_CONFIG = {
  WORLD_BOUNDS: { minX: -500, maxX: 600, minZ: -400, maxZ: 500 },
}
