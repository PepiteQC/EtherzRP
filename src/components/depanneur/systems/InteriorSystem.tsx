/**
 * InteriorSystem.tsx
 * Structure intérieure: sol, plafond, murs, comptoir, anti-slip mat
 */

import { memo } from 'react'
import {
  useStoreTileTexture,
  useExteriorWallTexture,
  useCounterTexture,
} from './TextureSystem'
import { CashRegister, LotteryDisplay } from './EquipmentSystem'
import { CounterCandy } from './ProductSystem'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const STORE_W = 16
const STORE_D = 14
const STORE_H = 5.8
const FACADE_Z = 6.92

// ─────────────────────────────────────────────
// FLOOR
// ─────────────────────────────────────────────

const StoreFloor = memo(function StoreFloor() {
  const tileTex = useStoreTileTexture()

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[STORE_W, STORE_D]} />
        <meshStandardMaterial map={tileTex} color="#e8e4dc" roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Anti-slip mat at entrance */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 5.5]}>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial color="#333328" roughness={0.95} />
      </mesh>
    </>
  )
})

// ─────────────────────────────────────────────
// CEILING (suspended tiles + grid)
// ─────────────────────────────────────────────

const StoreCeiling = memo(function StoreCeiling() {
  return (
    <>
      {/* Ceiling plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, STORE_H, 0]}>
        <planeGeometry args={[STORE_W, STORE_D]} />
        <meshStandardMaterial color="#d0ccc4" roughness={0.9} />
      </mesh>

      {/* Suspended tiles */}
      {Array.from({ length: 5 }).map((_, i) =>
        Array.from({ length: 4 }).map((_, j) => (
          <mesh key={`ct-${i}-${j}`} position={[-6 + i * 3.2, STORE_H - 0.01, -5 + j * 3.5]}>
            <boxGeometry args={[3.0, 0.02, 3.3]} />
            <meshStandardMaterial
              color={`rgb(${200 + (i * j) % 10},${196 + (i + j) % 10},${188 + j % 10})`}
              roughness={0.9}
            />
          </mesh>
        ))
      )}

      {/* Grid rails X */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`gx-${i}`} position={[-7.5 + i * 3.2, STORE_H - 0.02, 0]}>
          <boxGeometry args={[0.03, 0.04, STORE_D]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Grid rails Z */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`gz-${i}`} position={[0, STORE_H - 0.02, -6.5 + i * 3.5]}>
          <boxGeometry args={[STORE_W, 0.04, 0.03]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </>
  )
})

// ─────────────────────────────────────────────
// WALLS
// ─────────────────────────────────────────────

const StoreWalls = memo(function StoreWalls() {
  const exteriorTex = useExteriorWallTexture()

  return (
    <>
      {/* Back wall */}
      <mesh position={[0, 2.9, -6.9]} castShadow>
        <boxGeometry args={[STORE_W, STORE_H, 0.15]} />
        <meshStandardMaterial map={exteriorTex} color="#f0ede6" roughness={0.85} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-7.9, 2.9, 0]} castShadow>
        <boxGeometry args={[0.15, STORE_H, STORE_D]} />
        <meshStandardMaterial map={exteriorTex} color="#eae7e0" roughness={0.85} />
      </mesh>

      {/* Right wall */}
      <mesh position={[7.9, 2.9, 0]} castShadow>
        <boxGeometry args={[0.15, STORE_H, STORE_D]} />
        <meshStandardMaterial map={exteriorTex} color="#eae7e0" roughness={0.85} />
      </mesh>

      {/* Front facade — left */}
      <mesh position={[-4.75, 2.9, FACADE_Z]} castShadow>
        <boxGeometry args={[5.5, STORE_H, 0.12]} />
        <meshStandardMaterial map={exteriorTex} color="#f5f2eb" roughness={0.8} />
      </mesh>

      {/* Front facade — right */}
      <mesh position={[4.75, 2.9, FACADE_Z]} castShadow>
        <boxGeometry args={[5.5, STORE_H, 0.12]} />
        <meshStandardMaterial map={exteriorTex} color="#f5f2eb" roughness={0.8} />
      </mesh>

      {/* Lintel */}
      <mesh position={[0, 5.1, FACADE_Z]} castShadow>
        <boxGeometry args={[3, 1.4, 0.12]} />
        <meshStandardMaterial map={exteriorTex} color="#f5f2eb" roughness={0.8} />
      </mesh>

      {/* Store windows */}
      {[-5.5, 5.5].map((x, i) => (
        <group key={`win-${i}`}>
          <mesh position={[x, 2.5, FACADE_Z + 0.07]}>
            <boxGeometry args={[2.5, 2.8, 0.02]} />
            <meshPhysicalMaterial
              color="#a8d8ff"
              transmission={0.7}
              thickness={0.02}
              roughness={0.05}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Window frames */}
          {[1.05, 2.5, 3.95].map(y => (
            <mesh key={`wf-${i}-${y}`} position={[x, y, FACADE_Z + 0.08]}>
              <boxGeometry args={[2.6, 0.06, 0.03]} />
              <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
})

// ─────────────────────────────────────────────
// COUNTER
// ─────────────────────────────────────────────

const StoreCounter = memo(function StoreCounter() {
  const counterTex = useCounterTexture()

  return (
    <group position={[0, 0, 4.5]}>
      {/* Counter body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[4, 1.1, 0.7]} />
        <meshStandardMaterial map={counterTex} color="#c0a060" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Counter top */}
      <mesh position={[0, 1.13, 0]}>
        <boxGeometry args={[4.1, 0.06, 0.75]} />
        <meshStandardMaterial color="#e0d8c8" roughness={0.25} metalness={0.15} />
      </mesh>

      {/* Counter front panel */}
      <mesh position={[0, 0.55, 0.36]}>
        <boxGeometry args={[4.0, 1.08, 0.02]} />
        <meshStandardMaterial color="#a8903a" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Cash registers */}
      <CashRegister position={[1.2, 1.16, 0]} />
      <CashRegister position={[-1.2, 1.16, 0]} />

      {/* Lottery display */}
      <LotteryDisplay position={[0, 1.5, 0.2]} />

      {/* Counter candy */}
      <CounterCandy />

      {/* Bag holder */}
      <mesh position={[1.8, 0.8, -0.2]}>
        <boxGeometry args={[0.3, 0.4, 0.15]} />
        <meshStandardMaterial color="#dddddd" roughness={0.7} transparent opacity={0.6} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// TRASH CANS
// ─────────────────────────────────────────────

const TrashCan = memo(function TrashCan({
  position,
  color = '#333333',
}: {
  position: [number, number, number]
  color?: string
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.5, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.17, 0.16, 0.04, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[0.1, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.02, 8]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// AISLE SIGNS
// ─────────────────────────────────────────────

const SIGNS = [
  { x: -4, label: 'CHIPS • SNACKS' },
  { x: 4, label: 'BOISSONS • DRINKS' },
  { x: 0, label: 'CONFISERIE • CANDY' },
] as const

const AisleSigns = memo(function AisleSigns() {
  return (
    <>
      {SIGNS.map((sign, i) => (
        <group key={`sign-${i}`} position={[sign.x, 4.8, 0]}>
          {/* Wires */}
          {[-0.4, 0.4].map(xOff => (
            <mesh key={`wire-${xOff}`} position={[xOff, 0.4, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.8, 4]} />
              <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          {/* Sign */}
          <mesh>
            <boxGeometry args={[1.2, 0.25, 0.03]} />
            <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <boxGeometry args={[1.1, 0.18, 0.005]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.08} />
          </mesh>
        </group>
      ))}
    </>
  )
})

// ─────────────────────────────────────────────
// WET FLOOR SIGN
// ─────────────────────────────────────────────

const WetFloorSign = memo(function WetFloorSign() {
  return (
    <group position={[2, 0, 2]}>
      <mesh position={[0, 0.35, 0]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.02, 0.6, 0.35]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.6} />
      </mesh>
      <mesh position={[0.01, 0.35, 0]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.02, 0.6, 0.35]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.6} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// SYSTEM EXPORT
// ─────────────────────────────────────────────

export const InteriorSystem = memo(function InteriorSystem() {
  return (
    <>
      <StoreFloor />
      <StoreCeiling />
      <StoreWalls />
      <StoreCounter />

      {/* Trash cans */}
      <TrashCan position={[-6.5, 0.25, 5]} color="#444444" />
      <TrashCan position={[6.5, 0.25, 5]} color="#444444" />
      <TrashCan position={[2.5, 0.25, 4.8]} color="#555555" />

      <AisleSigns />
      <WetFloorSign />
    </>
  )
})