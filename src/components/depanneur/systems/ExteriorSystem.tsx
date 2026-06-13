/**
 * ExteriorSystem.tsx
 * Parking, trottoir, auvent, mobilier extérieur, cage à glace
 */

import { memo } from 'react'
import { useAsphaltTexture } from './TextureSystem'

type Vec3 = [number, number, number]

const STORE_W = 16
const FACADE_Z = 6.92

// ─────────────────────────────────────────────
// SIDEWALK
// ─────────────────────────────────────────────

const Sidewalk = memo(function Sidewalk() {
  return (
    <group>
      <mesh position={[0, 0.08, 7.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 2.5]} />
        <meshStandardMaterial color="#b0a898" roughness={0.85} />
      </mesh>

      {/* Curb */}
      <mesh position={[0, 0.1, 8.75]} castShadow>
        <boxGeometry args={[18, 0.2, 0.15]} />
        <meshStandardMaterial color="#999088" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Joints */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`sj-${i}`} position={[-7 + i * 2.2, 0.085, 7.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.02, 2.5]} />
          <meshStandardMaterial color="#9a9080" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
})

// ─────────────────────────────────────────────
// OUTDOOR BIN
// ─────────────────────────────────────────────

const OutdoorBin = memo(function OutdoorBin({
  position,
  color,
}: {
  position: Vec3
  color: string
  label?: string
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.8, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.52, 0.04, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.42, 0.15]}>
        <boxGeometry args={[0.2, 0.005, 0.08]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0, 0.15, 0.21]}>
        <boxGeometry args={[0.2, 0.15, 0.005]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// ICE CAGE
// ─────────────────────────────────────────────

const IceCage = memo(function IceCage({ position }: { position: Vec3 }) {
  const wireProps = { color: '#aaaaaa', roughness: 0.4, metalness: 0.7, transparent: true, opacity: 0.5 } as const

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.05, 0.8]} />
        <meshStandardMaterial color="#cccccc" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Wire walls */}
      <mesh position={[0, 0.5, -0.38]}>
        <boxGeometry args={[1.18, 1.0, 0.04]} />
        <meshStandardMaterial {...wireProps} />
      </mesh>
      <mesh position={[-0.58, 0.5, 0]}>
        <boxGeometry args={[0.04, 1.0, 0.76]} />
        <meshStandardMaterial {...wireProps} />
      </mesh>
      <mesh position={[0.58, 0.5, 0]}>
        <boxGeometry args={[0.04, 1.0, 0.76]} />
        <meshStandardMaterial {...wireProps} />
      </mesh>

      {/* Top */}
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.2, 0.04, 0.8]} />
        <meshStandardMaterial color="#bbbbbb" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.5, 0.38]}>
        <boxGeometry args={[1.18, 1.0, 0.03]} />
        <meshStandardMaterial color="#999999" roughness={0.4} metalness={0.7} transparent opacity={0.4} />
      </mesh>

      {/* Lock */}
      <mesh position={[0.5, 0.4, 0.4]}>
        <boxGeometry args={[0.06, 0.04, 0.04]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Ice bags */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`ice-${i}`} position={[-0.3 + i * 0.22, 0.25, 0]}>
          <boxGeometry args={[0.18, 0.35, 0.25]} />
          <meshStandardMaterial color="#ddeeff" roughness={0.6} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Sign */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.02]} />
        <meshStandardMaterial color="#0066cc" emissive="#0066cc" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// PARKING LOT
// ─────────────────────────────────────────────

const PARKING_LINE_X = [-4, -2, 0, 2, 4] as const
const PARKING_LIGHT_X = [-4, 0, 4] as const

const ParkingLot = memo(function ParkingLot() {
  const asphaltTex = useAsphaltTexture()

  return (
    <group position={[0, 0, 10]}>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial map={asphaltTex} color="#2a2a2e" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Parking lines */}
      {PARKING_LINE_X.map(x => (
        <mesh key={`ln-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
          <planeGeometry args={[0.1, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Handicap spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.02, 0]}>
        <planeGeometry args={[0.1, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.5, 0.02, 0]}>
        <planeGeometry args={[1.8, 3]} />
        <meshStandardMaterial color="#2244aa" roughness={0.8} transparent opacity={0.3} />
      </mesh>

      {/* Bumpers */}
      {PARKING_LINE_X.map((x, i) => (
        <mesh key={`bump-${i}`} position={[x + 1, 0.08, -2.5]} castShadow>
          <boxGeometry args={[1.5, 0.12, 0.15]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.7} />
        </mesh>
      ))}

      {/* Lamp posts */}
      {PARKING_LIGHT_X.map(x => (
        <group key={`lamp-${x}`} position={[x, 0, 4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
            <meshStandardMaterial color="#444455" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -2.9, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.4]} />
            <meshStandardMaterial color="#555566" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0.3, 3.1, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.8, 0.06, 0.06]} />
            <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.6, 3.0, 0]}>
            <boxGeometry args={[0.5, 0.06, 0.25]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={0.9} />
          </mesh>
          <mesh position={[0.6, 2.96, 0]}>
            <boxGeometry args={[0.45, 0.02, 0.2]} />
            <meshStandardMaterial color="#ffffee" emissive="#fff8e0" emissiveIntensity={1.2} transparent opacity={0.9} />
          </mesh>
          <pointLight
            position={[0.6, 2.5, 0]}
            color="#fff8e0"
            intensity={1.5}
            distance={14}
            decay={2}
            castShadow
            shadow-mapSize={[512, 512]}
          />
        </group>
      ))}

      {/* Bins */}
      <OutdoorBin position={[-6, 0.4, -3]} color="#333333" />
      <OutdoorBin position={[-6, 0.4, -2]} color="#0066cc" />

      {/* Ice cage */}
      <IceCage position={[6, 0, -3]} />

      {/* Bench */}
      <group position={[-6, 0, 2]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.2, 0.06, 0.4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.8, -0.18]} castShadow>
          <boxGeometry args={[1.2, 0.5, 0.04]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
        {[-0.5, 0.5].map(xOff => (
          <mesh key={`bl-${xOff}`} position={[xOff, 0.22, 0]}>
            <boxGeometry args={[0.06, 0.44, 0.35]} />
            <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Bollards */}
      {[-6.5, -5.5, 5.5, 6.5].map((x, i) => (
        <group key={`boll-${i}`} position={[x, 0, -4.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
            <meshStandardMaterial color="#ffcc00" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.1, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.1} metalness={0.8} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Drain grate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 3]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// FACADE AWNING
// ─────────────────────────────────────────────

const FacadeAwning = memo(function FacadeAwning() {
  return (
    <group position={[0, 4.8, FACADE_Z + 1.5]}>
      <mesh castShadow>
        <boxGeometry args={[STORE_W + 1, 0.08, 3]} />
        <meshStandardMaterial color="#cc0000" roughness={0.5} metalness={0.2} />
      </mesh>

      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[STORE_W + 0.8, 0.02, 2.8]} />
        <meshStandardMaterial color="#aa0000" roughness={0.6} />
      </mesh>

      {/* Brackets */}
      {[-6, -2, 2, 6].map((x, i) => (
        <mesh key={`br-${i}`} position={[x, -0.5, -1.3]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.08, 1.0, 0.08]} />
          <meshStandardMaterial color="#555566" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Fascia */}
      <mesh position={[0, -0.06, 1.45]}>
        <boxGeometry args={[STORE_W + 1, 0.5, 0.05]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.2} />
      </mesh>

      {/* White stripe */}
      <mesh position={[0, -0.2, 1.47]}>
        <boxGeometry args={[STORE_W + 0.5, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>

      {/* Under-awning lights */}
      {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
        <group key={`awl-${i}`} position={[x, -0.1, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.03, 0.15]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={0.6} />
          </mesh>
          <pointLight position={[0, -0.1, 0]} intensity={0.6} color="#fff8e0" distance={4} decay={2} />
        </group>
      ))}
    </group>
  )
})

// ─────────────────────────────────────────────
// SYSTEM EXPORT
// ─────────────────────────────────────────────

export const ExteriorSystem = memo(function ExteriorSystem() {
  return (
    <>
      <ParkingLot />
      <Sidewalk />
      <FacadeAwning />
    </>
  )
})