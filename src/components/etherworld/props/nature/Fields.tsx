export function CropField({ position = [0, 0, 0] as [number, number, number], width = 40, depth = 40, rotation = 0, crop = 'corn' }: { position?: [number, number, number]; width?: number; depth?: number; rotation?: number; crop?: string }) {
  const color = crop === 'wheat' ? '#ca8a04' : crop === 'hay' ? '#a16207' : '#166534'
  return <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]} receiveShadow><planeGeometry args={[width, depth]} /><meshStandardMaterial color={color} roughness={1} /></mesh>
}
