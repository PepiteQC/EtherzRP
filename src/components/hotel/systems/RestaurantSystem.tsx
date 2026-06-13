export interface RestaurantSystemProps {
  position?: [number, number, number]
  enabled?: boolean
}

export function RestaurantSystem({ position = [0, 0, 0] as [number, number, number] }: RestaurantSystemProps) {
  return <group position={position} name="RestaurantSystem" />
}

export default RestaurantSystem
