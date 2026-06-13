export type Vec3 = [number, number, number]
export type Vec2 = [number, number]

export interface Light {
  id?: string
  type?: 'ambient' | 'directional' | 'point' | 'spot'
  position?: Vec3
  color?: string
  intensity?: number
  distance?: number
}

export interface PolyTexture {
  color?: string
  roughness?: number
  metalness?: number
  map?: string
  normalMap?: string
  repeat?: Vec2
}

export interface Building {
  id: string
  name?: string
  type?: string
  position: Vec3
  rotation?: Vec3
  scale?: Vec3
  size?: Vec3
  floors?: number
  metadata?: Record<string, unknown>
}

export interface RoadSegment {
  id: string
  name?: string
  from?: Vec3
  to?: Vec3
  start?: Vec3
  end?: Vec3
  points?: Vec3[]
  width?: number
  type?: string
}

export interface Intersection {
  id: string
  position: Vec3
  connectedRoads?: string[]
  type?: string
}
