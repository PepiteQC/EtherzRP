export function PlayerCharacter({ spawnPos = [0, 0, 0] as [number, number, number] }) {
  return <mesh position={[spawnPos[0], spawnPos[1] + 0.9, spawnPos[2]]} castShadow><capsuleGeometry args={[0.35, 1.2, 8, 16]} /><meshStandardMaterial color="#2563eb" /></mesh>
}
export default PlayerCharacter
