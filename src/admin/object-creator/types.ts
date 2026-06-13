export type CreatorQuality = 'fast' | 'balanced' | 'high'
export type GeometryType = 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus' | 'torusKnot' | 'octahedron' | 'icosahedron' | 'dodecahedron' | 'capsule'
export type AnimateType = 'none' | 'spin' | 'float' | 'orbit' | 'pulse' | 'wave' | 'breathe'
export type SceneLayout = 'single' | 'cluster' | 'ring' | 'orbital' | 'grid' | 'helix' | 'vortex'
export type RecognitionCategory = 'blueprint' | 'shape' | 'material' | 'color' | 'animation' | 'scene' | 'modifier' | 'function' | 'mood'

export interface Recognition {
  token: string
  label: string
  category: RecognitionCategory
  confidence: number
  hex?: string
}

export interface GeometryDef {
  type: GeometryType
  args: number[]
}

export interface MaterialDef {
  name: string
  color: string
  emissive: string
  emissiveIntensity: number
  metalness: number
  roughness: number
  transparent: boolean
  opacity: number
  transmission?: number
  iridescence?: number
  thickness?: number
  textureKey?: string
  wireframe?: boolean
}

export interface ObjectPartDef {
  id: string
  geometry: GeometryDef
  material: MaterialDef
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  animate: AnimateType
  animSpeed: number
}

export interface ObjectCreatorConfig {
  id: string
  prompt: string
  name: string
  blueprint: string | null
  layout: SceneLayout
  parts: ObjectPartDef[]
  recognitions: Recognition[]
  confidence: number
  reasoning: string[]
  tags: string[]
  stats: {
    partCount: number
    estimatedPolygons: number
    materialCount: number
    complexity: 'simple' | 'medium' | 'advanced'
  }
  lighting: {
    background: string
    ambient: string
    key: string
    fill: string
    fog: string | null
  }
}

export interface SavedObjectCreation {
  id: string
  prompt: string
  name: string
  createdAt: number
  config: ObjectCreatorConfig
}
