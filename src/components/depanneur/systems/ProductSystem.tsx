/**
 * ProductSystem.tsx
 * Produits sur étagères, boissons frigo, magazines, bonbons comptoir
 */

import { useMemo, memo } from 'react'

type Vec3 = [number, number, number]

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PRODUCT_COLORS = [
  '#cc2222', '#2255cc', '#22aa44', '#dd8800',
  '#8822cc', '#cc2288', '#228888', '#ddcc22',
  '#ff5544', '#4488ff', '#44cc66', '#ffaa22',
]

const DRINK_COLORS = [
  '#cc0000', '#0044cc', '#00aa00', '#ff8800',
  '#880088', '#cc4400', '#006688', '#884400',
]

const MAGAZINE_COLORS = [
  '#cc2222', '#2244aa', '#cc8800', '#228844',
  '#882288', '#cc4466', '#446688', '#888822',
]

const SHELF_LEVELS = [0, 0.5, 1.0, 1.5, 2.0] as const
const PRODUCTS_PER_SHELF = 8
const FRIDGE_SHELF_HEIGHTS = [0.4, 0.9, 1.4] as const

// Pseudo-random déterministe
function seededVal(seed: number): number {
  return ((Math.sin(seed * 9301 + 49297) * 233280) % 1 + 1) % 1
}

// ─────────────────────────────────────────────
// SHELF UNIT — étagère avec produits
// ─────────────────────────────────────────────

export const ShelfUnit = memo(function ShelfUnit({ x }: { x: number }) {
  const products = useMemo(() =>
    SHELF_LEVELS.flatMap((y, si) =>
      Array.from({ length: PRODUCTS_PER_SHELF }, (_, j) => {
        const seed = si * PRODUCTS_PER_SHELF + j + Math.abs(x) * 100
        const colorIdx = Math.floor(seededVal(seed) * PRODUCT_COLORS.length)
        const height = 0.2 + (seed % 5) * 0.04
        const width = 0.15 + (seed % 3) * 0.03
        const isBottle = seed % 7 === 0
        return { id: `${si}-${j}`, y: y + 0.04 + height / 2, z: -1.5 + j * 0.4, color: PRODUCT_COLORS[colorIdx], height, width, isBottle }
      })
    ), [x]
  )

  return (
    <group position={[x, 0, 0]}>
      {/* Back panel */}
      <mesh position={[x > 0 ? -0.22 : 0.22, 1.1, 0]} castShadow>
        <boxGeometry args={[0.04, 2.3, 3.6]} />
        <meshStandardMaterial color="#6b6050" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Side panels */}
      {[-1.78, 1.78].map(z => (
        <mesh key={`side-${z}`} position={[0, 1.1, z]} castShadow>
          <boxGeometry args={[0.45, 2.3, 0.04]} />
          <meshStandardMaterial color="#7a6a58" roughness={0.65} metalness={0.1} />
        </mesh>
      ))}

      {/* Shelves */}
      {SHELF_LEVELS.map(y => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[0.42, 0.06, 3.55]} />
          <meshStandardMaterial color="#8a7a6a" roughness={0.6} metalness={0.05} />
        </mesh>
      ))}

      {/* Price tag strips */}
      {SHELF_LEVELS.map(y => (
        <mesh key={`tag-${y}`} position={[x > 0 ? 0.22 : -0.22, y + 0.04, 0]}>
          <boxGeometry args={[0.005, 0.03, 3.5]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.8} />
        </mesh>
      ))}

      {/* Products */}
      {products.map(({ id, y, z, color, height, width, isBottle }) => (
        <group key={id} position={[0, y, z]}>
          {isBottle ? (
            <>
              <mesh castShadow>
                <cylinderGeometry args={[width * 0.35, width * 0.4, height, 8]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
              </mesh>
              <mesh position={[0, height * 0.45, 0]}>
                <cylinderGeometry args={[width * 0.15, width * 0.2, height * 0.3, 6]} />
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
              </mesh>
              <mesh position={[0, height * 0.62, 0]}>
                <cylinderGeometry args={[width * 0.18, width * 0.18, 0.03, 6]} />
                <meshStandardMaterial color="#dddddd" metalness={0.6} roughness={0.3} />
              </mesh>
            </>
          ) : (
            <>
              <mesh castShadow>
                <boxGeometry args={[width, height, width * 0.7]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} />
              </mesh>
              <mesh position={[width * 0.51, 0, 0]}>
                <boxGeometry args={[0.002, height * 0.6, width * 0.5]} />
                <meshStandardMaterial color="#ffffff" roughness={0.8} transparent opacity={0.6} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </group>
  )
})

// ─────────────────────────────────────────────
// FRIDGE UNIT — Réfrigérateur vitré
// ─────────────────────────────────────────────

export const FridgeUnit = memo(function FridgeUnit({ x }: { x: number }) {
  const drinks = useMemo(() => {
    const items: Array<{ id: string; pos: Vec3; color: string; isCan: boolean }> = []
    FRIDGE_SHELF_HEIGHTS.forEach((y, si) => {
      for (let j = 0; j < 6; j++) {
        const seed = si * 6 + j + Math.abs(x) * 50
        items.push({
          id: `drink-${si}-${j}`,
          pos: [-0.8 + j * 0.32, y + 0.15, 0],
          color: DRINK_COLORS[seed % DRINK_COLORS.length],
          isCan: seed % 3 === 0,
        })
      }
    })
    return items
  }, [x])

  return (
    <group position={[x, 0, 0]}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[2.2, 2.2, 0.8]} />
        <meshStandardMaterial color="#d8e0e8" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Interior */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[2.05, 2.05, 0.55]} />
        <meshStandardMaterial color="#1a2030" roughness={0.9} />
      </mesh>

      {/* Glass door */}
      <mesh position={[0, 0, 0.41]}>
        <boxGeometry args={[2.1, 2.1, 0.02]} />
        <meshPhysicalMaterial
          color="#a8d8ff"
          transmission={0.75}
          thickness={0.02}
          roughness={0.05}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Door handle */}
      <mesh position={[1.0, 0, 0.45]}>
        <boxGeometry args={[0.04, 0.8, 0.03]} />
        <meshStandardMaterial color="#888899" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Door frame */}
      <mesh position={[0, 0, 0.43]}>
        <boxGeometry args={[2.15, 2.15, 0.01]} />
        <meshStandardMaterial color="#778899" metalness={0.7} roughness={0.2} transparent opacity={0.3} />
      </mesh>

      {/* Shelves */}
      {FRIDGE_SHELF_HEIGHTS.map(y => (
        <mesh key={y} position={[0, y, 0.1]}>
          <boxGeometry args={[2.0, 0.03, 0.65]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Interior light */}
      <pointLight position={[0, 1.0, 0.2]} intensity={0.4} color="#ccddff" distance={2} decay={2} />

      {/* Temperature display */}
      <mesh position={[0, 1.65, 0.42]}>
        <boxGeometry args={[0.3, 0.06, 0.005]} />
        <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={0.5} />
      </mesh>

      {/* Drinks */}
      {drinks.map(({ id, pos, color, isCan }) => (
        <group key={id} position={pos}>
          <mesh castShadow>
            <cylinderGeometry args={isCan ? [0.04, 0.04, 0.15, 8] : [0.035, 0.035, 0.22, 8]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={isCan ? 0.5 : 0.1} />
          </mesh>
        </group>
      ))}

      {/* Brand sticker */}
      <mesh position={[0, -0.6, 0.43]}>
        <boxGeometry args={[1.2, 0.2, 0.003]} />
        <meshStandardMaterial color="#cc0000" emissive="#cc0000" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// MAGAZINE RACK
// ─────────────────────────────────────────────

export const MagazineRack = memo(function MagazineRack({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh castShadow>
        <boxGeometry args={[0.55, 1.6, 0.15]} />
        <meshStandardMaterial color="#5a5040" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Shelves + magazines */}
      {[0, 0.35, 0.7, 1.05].map((y, i) => (
        <group key={`mag-shelf-${i}`}>
          <mesh position={[0, y - 0.4, 0.08]}>
            <boxGeometry args={[0.52, 0.03, 0.06]} />
            <meshStandardMaterial color="#6a5a48" roughness={0.6} />
          </mesh>
          {Array.from({ length: 3 }).map((_, j) => (
            <mesh
              key={`mag-${i}-${j}`}
              position={[-0.15 + j * 0.15, y - 0.25, 0.1]}
              rotation={[0.15, 0, (j - 1) * 0.02]}
            >
              <boxGeometry args={[0.12, 0.16, 0.008]} />
              <meshStandardMaterial
                color={MAGAZINE_COLORS[(i * 3 + j) % MAGAZINE_COLORS.length]}
                roughness={0.5}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Newspaper stand */}
      <mesh position={[0, -0.7, 0.15]}>
        <boxGeometry args={[0.5, 0.15, 0.2]} />
        <meshStandardMaterial color="#f5f0e5" roughness={0.8} />
      </mesh>
    </group>
  )
})

// ─────────────────────────────────────────────
// COUNTER CANDY
// ─────────────────────────────────────────────

const CANDY_COLORS = ['#ff4444', '#ffaa00', '#44aa44', '#4444ff', '#ff44ff', '#884400']

export const CounterCandy = memo(function CounterCandy() {
  return (
    <>
      {CANDY_COLORS.map((color, i) => (
        <mesh key={`candy-${i}`} position={[-1.5 + i * 0.3, 1.18, 0.25]} castShadow>
          <boxGeometry args={[0.2, 0.08, 0.12]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
    </>
  )
})

// ─────────────────────────────────────────────
// CENTER AISLE DISPLAY
// ─────────────────────────────────────────────

export const CenterDisplay = memo(function CenterDisplay() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.5, 0.7, 3]} />
        <meshStandardMaterial color="#7a6a58" roughness={0.65} metalness={0.1} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`cp-${i}`}
          position={[-0.4 + (i % 4) * 0.28, 0.75, -1 + Math.floor(i / 4) * 0.8]}
          castShadow
        >
          <boxGeometry args={[0.2, 0.15, 0.2]} />
          <meshStandardMaterial color={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
})

// ─────────────────────────────────────────────
// SYSTEM EXPORT
// ─────────────────────────────────────────────

const SHELF_POSITIONS = [-4, 4] as const
const FRIDGE_X = [-3, 0, 3] as const

export const ProductSystem = memo(function ProductSystem() {
  return (
    <>
      {/* Étagères */}
      {SHELF_POSITIONS.map(x => (
        <ShelfUnit key={`shelf-${x}`} x={x} />
      ))}

      {/* Frigos arrière */}
      <group position={[0, 0, -6.5]}>
        {FRIDGE_X.map(x => (
          <FridgeUnit key={`fridge-${x}`} x={x} />
        ))}
      </group>

      {/* Magazine rack */}
      <MagazineRack position={[5.5, 0.8, 0]} />

      {/* Présentoir centre */}
      <CenterDisplay />
    </>
  )
})