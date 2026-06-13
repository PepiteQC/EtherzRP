export interface ParkingSystemProps {
  position?: [number, number, number]
  enabled?: boolean
}

export function ParkingSystem({ position = [0, 0, 0] as [number, number, number] }: ParkingSystemProps) {
  return <group position={position} name="ParkingSystem" />
}

export default ParkingSystem
