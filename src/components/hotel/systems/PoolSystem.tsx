export interface PoolSystemProps {
  position?: [number, number, number]
  enabled?: boolean
}

export function PoolSystem({ position = [0, 0, 0] as [number, number, number] }: PoolSystemProps) {
  return <group position={position} name="PoolSystem" />
}

export default PoolSystem
