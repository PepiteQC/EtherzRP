export interface RoomSystemProps {
  position?: [number, number, number]
  enabled?: boolean
}

export function RoomSystem({ position = [0, 0, 0] as [number, number, number] }: RoomSystemProps) {
  return <group position={position} name="RoomSystem" />
}

export default RoomSystem
