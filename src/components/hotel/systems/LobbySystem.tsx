export interface LobbySystemProps {
  position?: [number, number, number]
  enabled?: boolean
}

export function LobbySystem({ position = [0, 0, 0] as [number, number, number] }: LobbySystemProps) {
  return <group position={position} name="LobbySystem" />
}

export default LobbySystem
