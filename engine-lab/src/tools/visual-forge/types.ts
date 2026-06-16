export type ForgeStage = 'idle' | 'ready' | 'running' | 'complete' | 'error'
export type ForgeNodeStatus = 'idle' | 'running' | 'complete' | 'error'

export interface HeightField {
  width: number
  height: number
  samples: number[]
}

export interface ImageAnalysis {
  width: number
  height: number
  aspectRatio: number
  averageColor: string
  brightness: number
  contrast: number
  edgeDensity: number
  heightField: HeightField
}

export interface GeneratedModel {
  id: string
  name: string
  sourceFileName: string
  createdAt: number
  width: number
  height: number
  depth: number
  vertices: number
  triangles: number
  heightField: HeightField
}

export interface ForgeNode {
  id: string
  label: string
  status: ForgeNodeStatus
  message: string
}

export interface ForgeLog {
  id: string
  createdAt: number
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}
