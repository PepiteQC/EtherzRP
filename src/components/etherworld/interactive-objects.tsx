type Vec3 = [number, number, number]

interface InteractiveProps {
  position?: Vec3
  rotation?: Vec3
  color?: string
}

function InteractiveBox({ position = [0, 0, 0], rotation = [0, 0, 0], color = '#0f172a' }: InteractiveProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.75, 0.18]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.2} />
      </mesh>
    </group>
  )
}

export const HackingTerminal = (props: InteractiveProps) => <InteractiveBox {...props} color="#0c4a6e" />
export const HotelPhone = (props: InteractiveProps) => <InteractiveBox {...props} color="#111827" />
export const Jacuzzi = (props: InteractiveProps) => <group position={props.position ?? [0,0,0]}><mesh position={[0,0.35,0]}><cylinderGeometry args={[0.75,0.75,0.45,32]} /><meshStandardMaterial color="#155e75" /></mesh><pointLight position={[0,0.7,0]} color="#67e8f9" intensity={0.5} /></group>
export const MusicSystem = (props: InteractiveProps) => <InteractiveBox {...props} color="#312e81" />
export const SmartMirror = (props: InteractiveProps) => <InteractiveBox {...props} color="#7dd3fc" />
export const VendingMachine = (props: InteractiveProps) => <InteractiveBox {...props} color="#b91c1c" />
export const SmartHomePad = (props: InteractiveProps) => <InteractiveBox {...props} color="#1d4ed8" />
export const Fireplace = (props: InteractiveProps) => <group position={props.position ?? [0,0,0]} rotation={props.rotation ?? [0,0,0]}><mesh><boxGeometry args={[0.9,0.65,0.18]} /><meshStandardMaterial color="#292524" /></mesh><pointLight position={[0,0.2,0.2]} color="#fb923c" intensity={0.7} /></group>
export const TrophyCabinet = (props: InteractiveProps) => <InteractiveBox {...props} color="#78350f" />
export const RoomServicePanel = (props: InteractiveProps) => <InteractiveBox {...props} color="#064e3b" />
export const SecurityPanel = (props: InteractiveProps) => <InteractiveBox {...props} color="#7f1d1d" />
export const CoffeeMachine = (props: InteractiveProps) => <InteractiveBox {...props} color="#3f3f46" />
export const NewsTablet = (props: InteractiveProps) => <InteractiveBox {...props} color="#020617" />
