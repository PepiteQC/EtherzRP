export function AdminHouse({ position = [0, 0, 0] as [number, number, number] }) {
  return <group position={position}><mesh position={[0, 2, 0]} castShadow receiveShadow><boxGeometry args={[8, 4, 6]} /><meshStandardMaterial color="#1e293b" /></mesh><mesh position={[0, 4.6, 0]} castShadow><coneGeometry args={[5.5, 2, 4]} /><meshStandardMaterial color="#7f1d1d" /></mesh></group>
}
export default AdminHouse
