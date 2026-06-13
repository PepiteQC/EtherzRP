import { useRef } from 'react'
import * as THREE from 'three'
import { useInteriorController } from './InteriorController'
import type { PlayerInteriorState, WeatherOutside } from './types'

export interface InteriorSceneProps {
  initialMoney?: number
  weather?: WeatherOutside
  onExit?: () => void
  onPrompt?: (label: string | null) => void
  onPlayerState?: (state: PlayerInteriorState) => void
}

export function InteriorScene(props: InteriorSceneProps) {
  const playerWorldRef = useRef(new THREE.Vector3())
  useInteriorController({ playerWorldRef, ...props })

  return (
    <group name="DepanneurInteriorScene">
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[12, 0.04, 18]} />
        <meshStandardMaterial color="#2b2b31" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.5, -8.5]} receiveShadow>
        <boxGeometry args={[12, 3, 0.2]} />
        <meshStandardMaterial color="#f7f1df" />
      </mesh>
      <mesh position={[0, 0.6, -4]}>
        <boxGeometry args={[4, 1.2, 1]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
      <ambientLight intensity={0.65} />
      <pointLight position={[0, 4, 0]} intensity={1.2} />
    </group>
  )
}

export default InteriorScene
