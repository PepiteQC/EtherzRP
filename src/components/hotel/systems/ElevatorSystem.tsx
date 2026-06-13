export interface ElevatorSystemProps {
  position?: [number, number, number]
  enabled?: boolean
}

export function ElevatorSystem({ position = [0, 0, 0] as [number, number, number] }: ElevatorSystemProps) {
  return <group position={position} name="ElevatorSystem" />
}

export default ElevatorSystem
