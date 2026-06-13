type Vec3 = [number, number, number]

interface TerrainProps {
  position?: Vec3
  rotation?: Vec3
  size?: number | [number, number] | [number, number, number]
  count?: number
}

export function TerrainGround({ size = 200 }: TerrainProps) {
  const groundSize = typeof size === 'number' ? size : size[0]
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
      <planeGeometry args={[groundSize, groundSize]} />
      <meshStandardMaterial color="#0f2f1f" roughness={0.95} />
    </mesh>
  )
}

export function TerrainSky() {
  return <color attach="background" args={["#06101f"]} />
}

export function Clouds({ count = 8 }: TerrainProps) {
  return <group>{Array.from({ length: count }).map((_, i) => <mesh key={i} position={[(i - count / 2) * 8, 12 + (i % 3), -25 - i]}><sphereGeometry args={[1.5 + (i % 3) * 0.4, 12, 12]} /><meshStandardMaterial color="#dbeafe" transparent opacity={0.28} /></mesh>)}</group>
}

export function SunMoon() {
  return <directionalLight position={[12, 20, 8]} intensity={1.2} color="#fff4d6" castShadow />
}

export function Mountains({ count = 8 }: TerrainProps) {
  return <group>{Array.from({ length: count }).map((_, i) => <mesh key={i} position={[(i - count / 2) * 12, 2, -45]}><coneGeometry args={[5, 8 + (i % 3) * 2, 4]} /><meshStandardMaterial color="#172554" roughness={1} /></mesh>)}</group>
}

export function Vegetation() {
  return <group>{Array.from({ length: 18 }).map((_, i) => <mesh key={i} position={[(i % 9 - 4) * 4, 0.7, -12 - Math.floor(i / 9) * 6]}><coneGeometry args={[0.6, 1.4, 8]} /><meshStandardMaterial color="#166534" /></mesh>)}</group>
}

export function Water() {
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -30]}><planeGeometry args={[80, 18]} /><meshStandardMaterial color="#075985" transparent opacity={0.55} roughness={0.2} metalness={0.1} /></mesh>
}

export function Rocks() {
  return <group>{Array.from({ length: 8 }).map((_, i) => <mesh key={i} position={[(i - 4) * 2.8, 0.2, -10 - (i % 3)]}><dodecahedronGeometry args={[0.35, 0]} /><meshStandardMaterial color="#475569" roughness={0.9} /></mesh>)}</group>
}

export function Pathway() {
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -5]}><planeGeometry args={[3, 16]} /><meshStandardMaterial color="#57534e" roughness={1} /></mesh>
}

export function ExteriorLighting() {
  return <ambientLight intensity={0.35} />
}
