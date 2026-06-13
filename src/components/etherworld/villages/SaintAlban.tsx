export function SaintAlban({ position = [0, 0, 0] as [number, number, number] }) {
  return (
    <group position={position}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[(i % 4) * 6 - 9, 1.5, Math.floor(i / 4) * 6 - 3]} castShadow receiveShadow>
          <boxGeometry args={[3.5, 3, 3.5]} />
          <meshStandardMaterial color={i % 2 ? '#b45309' : '#64748b'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
export default SaintAlban
