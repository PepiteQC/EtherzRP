export function SaintLaurentRiver({ position = [0, 0, 0] as [number, number, number], length = 1000, width = 200 }: { position?: [number, number, number]; length?: number; width?: number }) {
  return <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[length, width]} /><meshStandardMaterial color="#075985" transparent opacity={0.72} roughness={0.2} /></mesh>
}
export function SmallRiver({ startX = 0, startZ = 0, endX = 0, endZ = 100, width = 6 }: { startX?: number | number[]; startZ?: number; endX?: number; endZ?: number; width?: number }) {
  const sx = Array.isArray(startX) ? Number(startX[0] ?? 0) : startX
  const mx = (sx + endX) / 2
  const mz = (startZ + endZ) / 2
  const len = Math.hypot(endX - sx, endZ - startZ)
  const angle = Math.atan2(endZ - startZ, endX - sx)
  return <mesh position={[mx, -0.01, mz]} rotation={[-Math.PI / 2, 0, angle]}><planeGeometry args={[len, width]} /><meshStandardMaterial color="#0ea5e9" transparent opacity={0.65} /></mesh>
}
