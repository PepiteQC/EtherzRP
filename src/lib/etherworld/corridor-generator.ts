import type { ApartmentDoorConfig, CorridorLightConfig, DecorItem } from './types'

export const CORRIDOR_WIDTH = 4
export const CORRIDOR_LENGTH = 40
export const DOOR_SPACING = 4
export const FLOOR_HEIGHT = 3.2

export const CORRIDOR_DEFAULTS = {
  width: CORRIDOR_WIDTH,
  length: CORRIDOR_LENGTH,
  height: FLOOR_HEIGHT,
} as const

export interface CorridorGeometry {
  floor: { position: [number, number, number]; width: number; depth: number }
  ceiling: { position: [number, number, number]; width: number; depth: number }
  leftWall: { position: [number, number, number]; width: number; height: number; depth: number }
  rightWall: { position: [number, number, number]; width: number; height: number; depth: number }
  backWall: { position: [number, number, number]; width: number; height: number; depth: number }
}

export function generateCorridorGeometry(): CorridorGeometry {
  return {
    floor: {
      position: [0, 0, CORRIDOR_LENGTH / 2],
      width: CORRIDOR_WIDTH + 1,
      depth: CORRIDOR_LENGTH,
    },
    ceiling: {
      position: [0, FLOOR_HEIGHT, CORRIDOR_LENGTH / 2],
      width: CORRIDOR_WIDTH + 1,
      depth: CORRIDOR_LENGTH,
    },
    leftWall: {
      position: [-CORRIDOR_WIDTH / 2, FLOOR_HEIGHT / 2, CORRIDOR_LENGTH / 2],
      width: CORRIDOR_WIDTH / 2,
      height: FLOOR_HEIGHT,
      depth: CORRIDOR_LENGTH,
    },
    rightWall: {
      position: [CORRIDOR_WIDTH / 2, FLOOR_HEIGHT / 2, CORRIDOR_LENGTH / 2],
      width: CORRIDOR_WIDTH / 2,
      height: FLOOR_HEIGHT,
      depth: CORRIDOR_LENGTH,
    },
    backWall: {
      position: [0, FLOOR_HEIGHT / 2, -0.5],
      width: CORRIDOR_WIDTH + 0.5,
      height: FLOOR_HEIGHT,
      depth: 0.2,
    },
  }
}

export function generateApartmentDoors(
  apartments: ApartmentDoorConfig[]
): ApartmentDoorConfig[] {
  return apartments.map((apt) => ({
    id: apt.id,
    position: apt.position,
    rotation: apt.rotation,
    isLocked: apt.isLocked,
    lightOn: apt.lightOn,
    occupied: apt.occupied,
    number: apt.number,
    doorColor: apt.doorColor,
  }))
}

export function generateCorridorLights(): CorridorLightConfig[] {
  const lights: CorridorLightConfig[] = []
  const numLights = Math.floor(CORRIDOR_LENGTH / DOOR_SPACING)

  for (let i = 0; i < numLights; i++) {
    const zPos = -CORRIDOR_LENGTH / 2 + (i + 1) * DOOR_SPACING
    const side = i % 2 === 0 ? 'left' : 'right'

    lights.push({
      id: `light-${i}`,
      position: [
        side === 'left' ? -CORRIDOR_WIDTH / 2 + 0.8 : CORRIDOR_WIDTH / 2 - 0.8,
        FLOOR_HEIGHT - 0.2,
        zPos,
      ] as [number, number, number],
      intensity: 0.8 + Math.random() * 0.4,
      color: '#fef3c7',
    })
  }

  return lights
}

export function generateCorridorDecor(): DecorItem[] {
  const decor: DecorItem[] = []
  
  // Add plants near doors at regular intervals
  for (let i = 0; i < 4; i++) {
    const zPos = -CORRIDOR_LENGTH / 2 + 2 + i * 8
    decor.push({
      id: `plant-${i}`,
      type: 'plant',
      position: [-CORRIDOR_WIDTH / 2 + 0.5, 0, zPos] as [number, number, number],
    })
  }

  // Add benches in middle of corridor
  decor.push({
    id: 'bench-1',
    type: 'bench',
    position: [0, 0, 10] as [number, number, number],
  })

  decor.push({
    id: 'bench-2',
    type: 'bench',
    position: [0, 0, -10] as [number, number, number],
  })

  return decor
}

import type { CorridorApartment } from './types'

const generatedDoorStates = new Map<string, boolean>()

export const corridorGenerator = {
  generateApartments(floor = 1, count = 20): CorridorApartment[] {
    return Array.from({ length: count }, (_, i) => {
      const side: 'left' | 'right' = i % 2 === 0 ? 'left' : 'right'
      const z = -CORRIDOR_LENGTH / 2 + 2 + i * (DOOR_SPACING / 1.2)
      const id = `apt-${floor}-${String(i + 1).padStart(2, '0')}`
      const open = generatedDoorStates.get(id) ?? false
      return {
        id,
        number: `${floor}${String(i + 1).padStart(2, '0')}`,
        floor,
        side,
        position: [side === 'left' ? -CORRIDOR_WIDTH / 2 : CORRIDOR_WIDTH / 2, 0, z],
        rotation: [0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0],
        accessLevel: i % 7 === 0 ? 'staff' : 'resident',
        doorState: open ? 'open' : 'closed',
        isLocked: false,
        occupied: i % 3 !== 0,
        forRent: i % 3 === 0,
        rent: 950 + floor * 50 + i * 15,
        doorColor: side === 'left' ? '#1e3a5f' : '#22345c',
        lightOn: i % 2 === 0,
      }
    })
  },
  updateDoorState(id: string, open: boolean) {
    generatedDoorStates.set(id, open)
  },
  getFloorStats(floor = 1) {
    const apartments = this.generateApartments(floor, 20)
    const occupied = apartments.filter((a) => a.occupied).length
    const forRent = apartments.filter((a) => a.forRent).length
    return {
      floor,
      total: apartments.length,
      occupied,
      forRent,
      available: forRent,
      locked: apartments.filter((a) => a.isLocked).length,
    }
  },
}
