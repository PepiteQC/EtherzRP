// Builder mode helpers
export const OBJECT_PALETTE = [
  { id: 'cube', name: 'Cube', icon: '🟦' },
  { id: 'wall', name: 'Wall', icon: '🧱' },
  { id: 'floor', name: 'Floor', icon: '⬜' },
  { id: 'door', name: 'Door', icon: '🚪' },
  { id: 'window', name: 'Window', icon: '🪟' },
  { id: 'light', name: 'Light', icon: '💡' },
  { id: 'tree', name: 'Tree', icon: '🌲' },
  { id: 'bench', name: 'Bench', icon: '🪑' },
  { id: 'plant', name: 'Plant', icon: '🌿' },
  { id: 'lamp', name: 'Lamp Post', icon: '🕯️' },
  { id: 'fence', name: 'Fence', icon: '🚧' },
  { id: 'sign', name: 'Sign', icon: '🪧' },
]

export const COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dda15e',
  '#bc6c25',
  '#8b7355',
  '#a0826d',
  '#c49060',
]

export const placeBuilderObject = (
  type: string,
  position: [number, number, number],
  color: string = '#4a90e2',
  rotation: number = 0,
  scale: number = 1
) => {
  return {
    modelType: type,
    position,
    rotation,
    scale,
    color,
    category: 'structures',
    doorOpen: false,
    locked: false,
  }
}

export const calculateDistance = (p1: [number, number, number], p2: [number, number, number]) => {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]
  const dz = p2[2] - p1[2]
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export const clampPosition = (
  pos: [number, number, number],
  min: [number, number, number],
  max: [number, number, number]
): [number, number, number] => {
  return [
    Math.max(min[0], Math.min(max[0], pos[0])),
    Math.max(min[1], Math.min(max[1], pos[1])),
    Math.max(min[2], Math.min(max[2], pos[2])),
  ]
}
