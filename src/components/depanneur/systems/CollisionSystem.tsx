import type { ReactNode } from 'react'

export interface CollisionSystemProps {
  children?: ReactNode
  enabled?: boolean
}

export function CollisionSystem({ children }: CollisionSystemProps) {
  return <>{children}</>
}

export default CollisionSystem
