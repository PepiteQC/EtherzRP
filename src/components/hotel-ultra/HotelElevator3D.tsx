import { useRef, useMemo, memo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useHotelStore } from './HotelStore'

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const FH = 4
const SHAFT_W = 3.2
const SHAFT_D = 3.2
const DOOR_SPEED = 4
const MOVE_SPEED = 2.5
const DOOR_OPEN_OFFSET = 0.58

// ═══════════════════════════════════════════════════════════════
// TEXTURES PROCÉDURALES
// ═══════════════════════════════════════════════════════════════

function createCanvasTexture(
  w: number, h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping
  if (repeat) tex.repeat.set(repeat[0], repeat[1])
  tex.needsUpdate = true
  return tex
}

function useCabinFloorTexture() {
  return useMemo(() => createCanvasTexture(256, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#c8b89a'); grad.addColorStop(0.5, '#c0b090'); grad.addColorStop(1, '#c8b89a')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
    const ts = w / 4
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = c * ts, y = r * ts
      const shade = 190 + Math.random() * 15
      ctx.fillStyle = `rgb(${shade},${shade - 5},${shade - 14})`
      ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2)
      ctx.strokeStyle = 'rgba(150,130,100,0.15)'; ctx.lineWidth = 1
      ctx.strokeRect(x, y, ts, ts)
    }
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(170,150,120,0.08)`; ctx.lineWidth = 0.6
      ctx.beginPath(); let x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y)
      for (let j = 0; j < 3; j++) { x += (Math.random() - 0.5) * 50; y += (Math.random() - 0.5) * 50; ctx.lineTo(x, y) }
      ctx.stroke()
    }
  }), [])
}

function useCabinWallTexture() {
  return useMemo(() => createCanvasTexture(128, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#141c28'); grad.addColorStop(0.5, '#121820'); grad.addColorStop(1, '#0e1418')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 2) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.008})`; ctx.fillRect(0, y, w, 1) }
    // Panneaux
    ctx.strokeStyle = 'rgba(80,100,140,0.06)'; ctx.lineWidth = 0.8
    ctx.strokeRect(8, 12, w - 16, h * 0.35); ctx.strokeRect(8, h * 0.42, w - 16, h * 0.35)
  }), [])
}

function useDoorTexture() {
  return useMemo(() => createCanvasTexture(64, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2a3040'; ctx.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 2) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.006})`; ctx.fillRect(0, y, w, 1) }
    // Reflet vertical
    ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(w * 0.3, 0, w * 0.15, h)
  }), [])
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export function HotelElevator3D({
  position = [0, 0, 0] as [number, number, number],
  totalFloors = 4,
}) {
  const { elevator, callElevator, moveElevator } = useHotelStore()
  const cabinRef = useRef<THREE.Group>(null)
  const doorLRef = useRef<THREE.Mesh>(null)
  const doorRRef = useRef<THREE.Mesh>(null)
  const indicatorRef = useRef<THREE.Mesh>(null)
  const cableRef = useRef<THREE.Mesh>(null)
  const counterweightRef = useRef<THREE.Mesh>(null)

  const totalH = totalFloors * FH
  const cabinFloorTex = useCabinFloorTexture()
  const cabinWallTex = useCabinWallTexture()
  const doorTex = useDoorTexture()

  const handleCallElevator = useCallback((floor: number) => {
    callElevator(floor)
  }, [callElevator])

  useFrame((state, dt) => {
    if (!cabinRef.current) return
    const targetY = elevator.targetFloor * FH + 0.15
    const currentY = cabinRef.current.position.y
    const diff = targetY - currentY

    // Mouvement doux de la cabine
    if (Math.abs(diff) > 0.03) {
      const speed = Math.min(MOVE_SPEED * dt, Math.abs(diff) * 0.8)
      cabinRef.current.position.y += Math.sign(diff) * speed * (1 + Math.abs(diff) * 0.5)
      moveElevator(cabinRef.current.position.y / FH)
    } else {
      cabinRef.current.position.y = targetY
      if (elevator.isMoving) {
        useHotelStore.setState(s => ({
          elevator: { ...s.elevator, isMoving: false, currentFloor: s.elevator.targetFloor, doorsOpen: true, direction: 'idle' },
        }))
      }
    }

    // Animation des portes
    const doorTarget = elevator.doorsOpen ? DOOR_OPEN_OFFSET : 0
    if (doorLRef.current) doorLRef.current.position.x += ((-doorTarget) - doorLRef.current.position.x) * DOOR_SPEED * dt
    if (doorRRef.current) doorRRef.current.position.x += (doorTarget - doorRRef.current.position.x) * DOOR_SPEED * dt

    // Indicateur d'étage
    if (indicatorRef.current) {
      const mat = indicatorRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = elevator.isMoving ? 0.5 + Math.sin(state.clock.elapsedTime * 6) * 0.3 : 0.7
    }

    // Câble (suit la cabine)
    if (cableRef.current) {
      const cabY = cabinRef.current.position.y + FH
      cableRef.current.position.y = cabY + (totalH - cabY) / 2
      cableRef.current.scale.y = (totalH - cabY + 2) / 2
    }

    // Contrepoids (inverse de la cabine)
    if (counterweightRef.current) {
      counterweightRef.current.position.y = totalH - cabinRef.current.position.y + 0.5
    }
  })

  return (
    <group position={position}>
      {/* ═══════════════════════════════════════
          CAGE D'ASCENSEUR
         ═══════════════════════════════════════ */}
      <ElevatorShaft totalH={totalH} />

      {/* ═══════════════════════════════════════
          CADRES ET BOUTONS PAR ÉTAGE
         ═══════════════════════════════════════ */}
      {Array.from({ length: totalFloors }, (_, f) => (
        <FloorDoorFrame
          key={`floor-${f}`}
          floor={f}
          totalFloors={totalFloors}
          currentFloor={elevator.currentFloor}
          targetFloor={elevator.targetFloor}
          isMoving={elevator.isMoving}
          onCall={handleCallElevator}
        />
      ))}

      {/* ═══════════════════════════════════════
          CÂBLES ET CONTREPOIDS
         ═══════════════════════════════════════ */}
      {/* Câble principal */}
      <mesh ref={cableRef} position={[0, totalH / 2, -SHAFT_D / 2 + 0.3]}>
        <cylinderGeometry args={[0.015, 0.015, totalH, 6]} />
        <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Câbles secondaires */}
      {[-0.15, 0.15].map((x, i) => (
        <mesh key={`cable-${i}`} position={[x, totalH / 2, -SHAFT_D / 2 + 0.3]}>
          <cylinderGeometry args={[0.008, 0.008, totalH, 4]} />
          <meshStandardMaterial color="#666" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}

      {/* Contrepoids */}
      <group ref={counterweightRef} position={[SHAFT_W / 2 - 0.3, totalH / 2, -SHAFT_D / 2 + 0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 1.5, 0.25]} />
          <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Rails du contrepoids */}
        <mesh position={[0.2, 0, 0]}>
          <boxGeometry args={[0.04, 1.6, 0.04]} />
          <meshStandardMaterial color="#555" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* Poulie en haut */}
      <group position={[0, totalH + 0.5, -SHAFT_D / 2 + 0.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
          <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Support poulie */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.15]} />
          <meshStandardMaterial color="#444" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════
          CABINE D'ASCENSEUR
         ═══════════════════════════════════════ */}
      <group ref={cabinRef} position={[0, 0.15, 0]}>
        <ElevatorCabin
          totalFloors={totalFloors}
          elevator={elevator}
          doorLRef={doorLRef}
          doorRRef={doorRRef}
          indicatorRef={indicatorRef}
          floorTex={cabinFloorTex}
          wallTex={cabinWallTex}
          doorTex={doorTex}
          onCallFloor={handleCallElevator}
        />
      </group>

      {/* ═══════════════════════════════════════
          MACHINERIE EN HAUT
         ═══════════════════════════════════════ */}
      <ElevatorMachinery position={[0, totalH + 0.5, 0]} />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════
// CAGE D'ASCENSEUR
// ═══════════════════════════════════════════════════════════════

const ElevatorShaft = memo(function ElevatorShaft({ totalH }: { totalH: number }) {
  return (
    <group>
      {/* Mur arrière — métal sombre */}
      <mesh position={[0, totalH / 2, -SHAFT_D / 2]} castShadow>
        <boxGeometry args={[SHAFT_W, totalH, 0.15]} />
        <meshStandardMaterial color="#0a0f18" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Parois latérales — verre */}
      {[-1, 1].map((side, i) => (
        <group key={`shaft-side-${i}`}>
          <mesh position={[side * SHAFT_W / 2, totalH / 2, 0]}>
            <boxGeometry args={[0.06, totalH, SHAFT_D]} />
            <meshPhysicalMaterial
              color="#7dd3fc"
              transmission={0.75}
              thickness={0.02}
              roughness={0.02}
              transparent opacity={0.12}
              metalness={0.08}
              ior={1.5}
            />
          </mesh>

          {/* Montants verticaux du cadre */}
          {[-SHAFT_D / 2, 0, SHAFT_D / 2].map((z, j) => (
            <mesh key={`vert-${i}-${j}`} position={[side * (SHAFT_W / 2 + 0.035), totalH / 2, z]}>
              <boxGeometry args={[0.04, totalH, 0.04]} />
              <meshStandardMaterial color="#2a2a3e" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Rails dorés d'angle avant */}
      {[-SHAFT_W / 2 - 0.04, SHAFT_W / 2 + 0.04].map((x, i) => (
        <mesh key={`gold-rail-${i}`} position={[x, totalH / 2, SHAFT_D / 2]}>
          <boxGeometry args={[0.05, totalH, 0.05]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.92} roughness={0.08} />
        </mesh>
      ))}

      {/* Rails de guidage intérieurs (pour la cabine) */}
      {[-SHAFT_W / 2 + 0.08, SHAFT_W / 2 - 0.08].map((x, i) => (
        <mesh key={`guide-${i}`} position={[x, totalH / 2, -SHAFT_D / 2 + 0.12]}>
          <boxGeometry args={[0.04, totalH, 0.04]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Traverses horizontales tous les 2 étages */}
      {Array.from({ length: Math.floor(totalH / (FH * 2)) + 1 }).map((_, i) => (
        <mesh key={`traverse-${i}`} position={[0, i * FH * 2 + FH, -SHAFT_D / 2 + 0.04]}>
          <boxGeometry args={[SHAFT_W - 0.1, 0.04, 0.04]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Fond de la cage (fosse) */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <boxGeometry args={[SHAFT_W - 0.1, 0.1, SHAFT_D - 0.1]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>

      {/* Amortisseurs de fosse */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={`buffer-${i}`} position={[x, -0.15, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.2, 8]} />
          <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* Éclairage de la cage */}
      {Array.from({ length: Math.floor(totalH / FH) }).map((_, i) => (
        <pointLight
          key={`shaft-light-${i}`}
          position={[0, i * FH + FH / 2, SHAFT_D / 2 - 0.3]}
          intensity={0.08}
          color="#4488aa"
          distance={FH}
          decay={2}
        />
      ))}
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// CADRE DE PORTE PAR ÉTAGE
// ═══════════════════════════════════════════════════════════════

const FloorDoorFrame = memo(function FloorDoorFrame({
  floor, totalFloors, currentFloor, targetFloor, isMoving, onCall,
}: {
  floor: number; totalFloors: number; currentFloor: number; targetFloor: number
  isMoving: boolean; onCall: (floor: number) => void
}) {
  const isCurrentFloor = Math.round(currentFloor) === floor
  const isTarget = targetFloor === floor
  const callBtnRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (callBtnRef.current) {
      const mat = callBtnRef.current.material as THREE.MeshStandardMaterial
      if (isTarget && isMoving) {
        mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.3
      } else if (isCurrentFloor) {
        mat.emissiveIntensity = 0.7
      } else {
        mat.emissiveIntensity = 0.08
      }
    }
  })

  const floorLabel = floor === 0 ? 'RDC' : `${floor}`

  return (
    <group position={[0, floor * FH, SHAFT_D / 2]}>
      {/* ══ CADRE DE PORTE ══ */}
      {/* Montants */}
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={`jamb-${i}`} position={[x, FH / 2, 0]} castShadow>
          <boxGeometry args={[0.1, FH * 0.88, 0.14]} />
          <meshStandardMaterial color="#374151" metalness={0.55} roughness={0.35} />
        </mesh>
      ))}
      {/* Linteau */}
      <mesh position={[0, FH * 0.94, 0]}>
        <boxGeometry args={[1.85, 0.1, 0.14]} />
        <meshStandardMaterial color="#374151" metalness={0.55} roughness={0.35} />
      </mesh>

      {/* Moulure dorée du cadre */}
      {[-0.78, 0.78].map((x, i) => (
        <mesh key={`gold-jamb-${i}`} position={[x, FH / 2, 0.07]}>
          <boxGeometry args={[0.012, FH * 0.85, 0.01]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      <mesh position={[0, FH * 0.88, 0.07]}>
        <boxGeometry args={[1.58, 0.012, 0.01]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Seuil doré */}
      <mesh position={[0, 0.01, 0.04]}>
        <boxGeometry args={[SHAFT_W + 0.1, 0.02, 0.12]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.88} roughness={0.1} />
      </mesh>

      {/* ══ INDICATEUR D'ÉTAGE AU-DESSUS ══ */}
      <group position={[0, FH * 0.95 + 0.15, 0.08]}>
        {/* Boîtier */}
        <mesh>
          <boxGeometry args={[0.55, 0.28, 0.04]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Écran */}
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[0.45, 0.18, 0.005]} />
          <meshStandardMaterial
            color={isCurrentFloor ? '#0a1a10' : '#0a0a14'}
            emissive={isCurrentFloor ? '#22c55e' : '#333'}
            emissiveIntensity={isCurrentFloor ? 0.6 : 0.05}
          />
        </mesh>
        {/* Texte étage */}
        <Text position={[0, 0, 0.03]} fontSize={0.1} color={isCurrentFloor ? '#22c55e' : '#555'} anchorX="center" anchorY="middle">
          {floorLabel}
        </Text>

        {/* Flèches direction */}
        {isMoving && isTarget && (
          <group position={[0.2, 0, 0.03]}>
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.03, 0.04, 0.002]} />
              <meshStandardMaterial
                color={targetFloor > currentFloor ? '#22c55e' : '#333'}
                emissive={targetFloor > currentFloor ? '#22c55e' : '#000'}
                emissiveIntensity={targetFloor > currentFloor ? 0.5 : 0}
              />
            </mesh>
            <mesh position={[0, -0.03, 0]}>
              <boxGeometry args={[0.03, 0.04, 0.002]} />
              <meshStandardMaterial
                color={targetFloor < currentFloor ? '#22c55e' : '#333'}
                emissive={targetFloor < currentFloor ? '#22c55e' : '#000'}
                emissiveIntensity={targetFloor < currentFloor ? 0.5 : 0}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* ══ PANNEAU D'APPEL ══ */}
      <group position={[1.1, FH / 2, 0.08]}>
        {/* Boîtier */}
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.28, 0.04]} />
          <meshStandardMaterial color="#1a1a22" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Cadre */}
        <mesh position={[0, 0, 0.022]}>
          <boxGeometry args={[0.12, 0.26, 0.003]} />
          <meshStandardMaterial color="#222230" roughness={0.5} metalness={0.4} />
        </mesh>

        {/* Bouton HAUT */}
        <mesh
          position={[0, 0.06, 0.025]}
          onClick={() => onCall(floor)}
        >
          <cylinderGeometry args={[0.028, 0.028, 0.015, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Flèche haut */}
        <mesh position={[0, 0.06, 0.035]}>
          <boxGeometry args={[0.015, 0.02, 0.002]} />
          <meshStandardMaterial
            color={isTarget && targetFloor > currentFloor ? '#c9a84c' : '#444'}
            emissive={isTarget && targetFloor > currentFloor ? '#ffd060' : '#000'}
            emissiveIntensity={isTarget && targetFloor > currentFloor ? 0.6 : 0}
          />
        </mesh>

        {/* Bouton BAS */}
        <mesh
          ref={callBtnRef}
          position={[0, -0.06, 0.025]}
          onClick={() => onCall(floor)}
        >
          <cylinderGeometry args={[0.028, 0.028, 0.015, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial
            color={isCurrentFloor ? '#c9a84c' : '#6b7280'}
            emissive={isCurrentFloor ? '#ffd060' : '#000'}
            emissiveIntensity={isCurrentFloor ? 0.7 : 0.08}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Vis */}
        {[[-0.05, 0.12], [0.05, 0.12], [-0.05, -0.12], [0.05, -0.12]].map(([x, y], i) => (
          <mesh key={`screw-${i}`} position={[x, y, 0.025]}>
            <cylinderGeometry args={[0.004, 0.004, 0.005, 4]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Label étage à côté */}
      <Text position={[1.1, FH / 2 + 0.22, 0.1]} fontSize={0.06} color="#888" anchorX="center" anchorY="middle">
        ÉTAGE {floorLabel}
      </Text>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// CABINE D'ASCENSEUR — ENRICHIE
// ═══════════════════════════════════════════════════════════════

const ElevatorCabin = memo(function ElevatorCabin({
  totalFloors, elevator, doorLRef, doorRRef, indicatorRef,
  floorTex, wallTex, doorTex, onCallFloor,
}: {
  totalFloors: number; elevator: any
  doorLRef: any; doorRRef: any; indicatorRef: any
  floorTex: THREE.CanvasTexture; wallTex: THREE.CanvasTexture; doorTex: THREE.CanvasTexture
  onCallFloor: (floor: number) => void
}) {
  const cabinW = SHAFT_W - 0.35
  const cabinD = SHAFT_D - 0.35
  const cabinH = FH - 0.25

  return (
    <group>
      {/* ══ SOL — MARBRE ══ */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[cabinW, 0.08, cabinD]} />
        <meshStandardMaterial map={floorTex} color="#c8b89a" roughness={0.1} metalness={0.15} />
      </mesh>
      {/* Bordure de sol dorée */}
      <mesh position={[0, 0.085, 0]}>
        <boxGeometry args={[cabinW + 0.01, 0.01, cabinD + 0.01]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.85} roughness={0.1} />
      </mesh>

      {/* ══ PLAFOND ══ */}
      <mesh position={[0, cabinH, 0]}>
        <boxGeometry args={[cabinW, 0.08, cabinD]} />
        <meshStandardMaterial color="#1a2030" metalness={0.8} roughness={0.15} />
      </mesh>

      {/* Éclairage LED du plafond */}
      <mesh position={[0, cabinH - 0.06, 0]}>
        <boxGeometry args={[1.4, 0.02, 1.4]} />
        <meshStandardMaterial color="#fff0d0" emissive="#fff0d0" emissiveIntensity={0.7} />
      </mesh>
      {/* Ring LED */}
      <mesh position={[0, cabinH - 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.65, 16]} />
        <meshStandardMaterial color="#fff0d0" emissive="#fff0d0" emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, cabinH - 0.2, 0]} intensity={0.8} color="#fff0d0" distance={5} decay={2} />
      {/* Spots d'angle */}
      {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => (
        <group key={`spot-${i}`} position={[x, cabinH - 0.06, z]}>
          <mesh><cylinderGeometry args={[0.04, 0.04, 0.02, 8]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} /></mesh>
          <mesh position={[0, -0.015, 0]}><cylinderGeometry args={[0.03, 0.03, 0.01, 8]} /><meshStandardMaterial color="#ffd580" emissive="#ffd580" emissiveIntensity={0.4} /></mesh>
          <spotLight position={[0, -0.05, 0]} angle={Math.PI / 6} penumbra={0.8} intensity={0.15} color="#ffd580" distance={3} />
        </group>
      ))}

      {/* ══ MURS INTÉRIEURS ══ */}
      {/* Arrière */}
      <mesh position={[0, cabinH / 2, -cabinD / 2 + 0.04]}>
        <boxGeometry args={[cabinW - 0.08, cabinH - 0.1, 0.06]} />
        <meshStandardMaterial map={wallTex} color="#121820" roughness={0.12} metalness={0.85} />
      </mesh>
      {/* Côtés */}
      {[-1, 1].map((side, i) => (
        <mesh key={`wall-${i}`} position={[side * (cabinW / 2 - 0.04), cabinH / 2, 0]}>
          <boxGeometry args={[0.06, cabinH - 0.1, cabinD - 0.08]} />
          <meshStandardMaterial map={wallTex} color="#121820" roughness={0.12} metalness={0.85} />
        </mesh>
      ))}

      {/* Panneaux décoratifs gravés (mur arrière) */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={`panel-${i}`} position={[x, cabinH / 2, -cabinD / 2 + 0.08]}>
          <boxGeometry args={[0.6, cabinH * 0.65, 0.005]} />
          <meshStandardMaterial color="#0e1418" roughness={0.2} metalness={0.8} />
        </mesh>
      ))}

      {/* ══ MAIN COURANTES DORÉES ══ */}
      {/* Arrière */}
      <mesh position={[0, cabinH * 0.38, -cabinD / 2 + 0.1]}>
        <boxGeometry args={[cabinW - 0.5, 0.035, 0.035]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.93} roughness={0.08} />
      </mesh>
      {/* Supports de main courante */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <mesh key={`rail-sup-${i}`} position={[x, cabinH * 0.38, -cabinD / 2 + 0.08]}>
          <boxGeometry args={[0.03, 0.03, 0.06]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* Côtés */}
      {[-1, 1].map((side, i) => (
        <group key={`side-rail-${i}`}>
          <mesh position={[side * (cabinW / 2 - 0.1), cabinH * 0.38, 0]}>
            <boxGeometry args={[0.035, 0.035, cabinD - 0.5]} />
            <meshStandardMaterial color="#c9a84c" metalness={0.93} roughness={0.08} />
          </mesh>
          {[-0.4, 0.4].map((z, j) => (
            <mesh key={`rsup-${i}-${j}`} position={[side * (cabinW / 2 - 0.08), cabinH * 0.38, z]}>
              <boxGeometry args={[0.06, 0.03, 0.03]} />
              <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ══ MIROIR ARRIÈRE ══ */}
      <mesh position={[0, cabinH * 0.6, -cabinD / 2 + 0.09]}>
        <boxGeometry args={[cabinW * 0.6, cabinH * 0.35, 0.008]} />
        <meshStandardMaterial color="#b8c8d8" metalness={1} roughness={0} envMapIntensity={1.2} />
      </mesh>
      {/* Cadre miroir */}
      <mesh position={[0, cabinH * 0.6, -cabinD / 2 + 0.085]}>
        <boxGeometry args={[cabinW * 0.62, cabinH * 0.37, 0.005]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.88} roughness={0.1} />
      </mesh>

      {/* ══ PORTES COULISSANTES ══ */}
      {/* Vitre au-dessus des portes */}
      <mesh position={[0, cabinH * 0.85, cabinD / 2 - 0.08]}>
        <boxGeometry args={[cabinW - 0.3, cabinH * 0.2, 0.04]} />
        <meshPhysicalMaterial color="#7dd3fc" transmission={0.6} thickness={0.015} roughness={0.02} transparent opacity={0.15} />
      </mesh>

      {/* Porte gauche */}
      <mesh ref={doorLRef} position={[-DOOR_OPEN_OFFSET, cabinH * 0.38, cabinD / 2 - 0.08]}>
        <boxGeometry args={[1.05, cabinH * 0.68, 0.05]} />
        <meshStandardMaterial map={doorTex} color="#2a3040" metalness={0.78} roughness={0.18} />
      </mesh>
      {/* Porte droite */}
      <mesh ref={doorRRef} position={[DOOR_OPEN_OFFSET, cabinH * 0.38, cabinD / 2 - 0.08]}>
        <boxGeometry args={[1.05, cabinH * 0.68, 0.05]} />
        <meshStandardMaterial map={doorTex} color="#2a3040" metalness={0.78} roughness={0.18} />
      </mesh>

      {/* Ligne de jonction des portes */}
      <mesh position={[0, cabinH * 0.38, cabinD / 2 - 0.05]}>
        <boxGeometry args={[0.012, cabinH * 0.66, 0.008]} />
        <meshStandardMaterial color="#1a1a2a" />
      </mesh>

      {/* Capteur de porte (infrarouge) */}
      {[-0.02, 0.02].map((x, i) => (
        <mesh key={`sensor-${i}`} position={[x, cabinH * 0.35, cabinD / 2 - 0.04]}>
          <boxGeometry args={[0.015, 0.03, 0.01]} />
          <meshStandardMaterial color="#333" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}

      {/* ══ PANNEAU DE BOUTONS INTÉRIEUR ══ */}
      <CabinButtonPanel
        position={[cabinW / 2 - 0.08, cabinH / 2, 0.2]}
        totalFloors={totalFloors}
        elevator={elevator}
        onCallFloor={onCallFloor}
      />

      {/* ══ INDICATEUR D'ÉTAGE INTÉRIEUR ══ */}
      <group position={[0, cabinH - 0.2, cabinD / 2 - 0.06]}>
        <mesh>
          <boxGeometry args={[0.45, 0.2, 0.03]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh ref={indicatorRef} position={[0, 0, 0.018]}>
          <boxGeometry args={[0.38, 0.14, 0.005]} />
          <meshStandardMaterial color="#0a1410" emissive="#22c55e" emissiveIntensity={0.7} />
        </mesh>
        {/* Flèches */}
        <mesh position={[-0.16, 0.03, 0.02]}>
          <boxGeometry args={[0.02, 0.03, 0.002]} />
          <meshStandardMaterial
            color={elevator.direction === 'up' ? '#22c55e' : '#333'}
            emissive={elevator.direction === 'up' ? '#22c55e' : '#000'}
            emissiveIntensity={elevator.direction === 'up' ? 0.5 : 0}
          />
        </mesh>
        <mesh position={[-0.16, -0.03, 0.02]}>
          <boxGeometry args={[0.02, 0.03, 0.002]} />
          <meshStandardMaterial
            color={elevator.direction === 'down' ? '#22c55e' : '#333'}
            emissive={elevator.direction === 'down' ? '#22c55e' : '#000'}
            emissiveIntensity={elevator.direction === 'down' ? 0.5 : 0}
          />
        </mesh>
      </group>

      {/* ══ VENTILATEUR DE PLAFOND ══ */}
      <CabinFan position={[0, cabinH - 0.04, -0.4]} />

      {/* ══ CAMÉRA DE SURVEILLANCE ══ */}
      <CabinCamera position={[cabinW / 2 - 0.15, cabinH - 0.1, -cabinD / 2 + 0.15]} />

      {/* ══ TÉLÉPHONE D'URGENCE ══ */}
      <group position={[-cabinW / 2 + 0.1, cabinH * 0.4, 0.3]}>
        <mesh><boxGeometry args={[0.06, 0.1, 0.04]} /><meshStandardMaterial color="#cc2222" roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[0, -0.06, 0]}><boxGeometry args={[0.04, 0.02, 0.03]} /><meshStandardMaterial color="#aa1818" roughness={0.5} /></mesh>
      </group>

      {/* ══ PLAQUE DE CAPACITÉ ══ */}
      <group position={[-cabinW / 2 + 0.08, cabinH * 0.2, cabinD / 2 - 0.06]}>
        <mesh><boxGeometry args={[0.04, 0.15, 0.008]} /><meshStandardMaterial color="#c9a84c" metalness={0.85} roughness={0.12} /></mesh>
      </group>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// PANNEAU DE BOUTONS INTÉRIEUR
// ═══════════════════════════════════════════════════════════════

const CabinButtonPanel = memo(function CabinButtonPanel({
  position, totalFloors, elevator, onCallFloor,
}: {
  position: [number, number, number]; totalFloors: number; elevator: any; onCallFloor: (f: number) => void
}) {
  return (
    <group position={position}>
      {/* Boîtier */}
      <mesh>
        <boxGeometry args={[0.04, 1.2, 0.2]} />
        <meshStandardMaterial color="#0a0a14" roughness={0.15} metalness={0.7} />
      </mesh>

      {/* Cadre doré */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[0.005, 1.15, 0.18]} />
        <meshStandardMaterial color="#c9a84c" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Boutons d'étage */}
      {Array.from({ length: totalFloors }, (_, f) => {
        const isTarget = elevator.targetFloor === f
        const y = -0.35 + f * 0.2
        return (
          <group key={`btn-${f}`} position={[0.025, y, 0.05]}>
            <mesh onClick={() => onCallFloor(f)}>
              <cylinderGeometry args={[0.022, 0.022, 0.015, 12]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial
                color={isTarget ? '#c9a84c' : '#6b7280'}
                emissive={isTarget ? '#ffd060' : '#000'}
                emissiveIntensity={isTarget ? 0.8 : 0}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Numéro à côté du bouton */}
            <Text position={[0, 0, 0.04]} fontSize={0.04} color={isTarget ? '#ffd060' : '#888'} anchorX="center" anchorY="middle">
              {f === 0 ? 'RC' : `${f}`}
            </Text>
          </group>
        )
      })}

      {/* Bouton ouverture portes */}
      <mesh position={[0.025, -0.5, 0.05]}>
        <cylinderGeometry args={[0.018, 0.018, 0.012, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Bouton fermeture portes */}
      <mesh position={[0.025, -0.55, 0.05]}>
        <cylinderGeometry args={[0.018, 0.018, 0.012, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.15} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Bouton alarme */}
      <mesh position={[0.025, -0.48, 0.12]}>
        <cylinderGeometry args={[0.02, 0.02, 0.015, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.15} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Interrupteur clé (pompiers) */}
      <mesh position={[0.025, 0.45, 0.05]}>
        <cylinderGeometry args={[0.012, 0.012, 0.01, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Labels */}
      <Text position={[0.03, -0.5, 0.08]} fontSize={0.02} color="#22c55e" anchorX="center" anchorY="middle">◄►</Text>
      <Text position={[0.03, -0.55, 0.08]} fontSize={0.02} color="#ef4444" anchorX="center" anchorY="middle">►◄</Text>
      <Text position={[0.03, -0.48, 0.15]} fontSize={0.02} color="#fbbf24" anchorX="center" anchorY="middle">🔔</Text>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// VENTILATEUR DE CABINE
// ═══════════════════════════════════════════════════════════════

const CabinFan = memo(function CabinFan({ position }: { position: [number, number, number] }) {
  const fanRef = useRef<THREE.Mesh>(null)
  useFrame(() => { if (fanRef.current) fanRef.current.rotation.z += 0.015 })

  return (
    <group position={position}>
      <mesh><boxGeometry args={[0.2, 0.02, 0.2]} /><meshStandardMaterial color="#1a1a2a" roughness={0.5} metalness={0.4} /></mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0, -0.015, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.15, 0.003, 0.012]} />
          <meshStandardMaterial color="#333" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <mesh ref={fanRef} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.06, 3]} />
        <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// CAMÉRA DE SURVEILLANCE CABINE
// ═══════════════════════════════════════════════════════════════

const CabinCamera = memo(function CabinCamera({ position }: { position: [number, number, number] }) {
  const ledRef = useRef<THREE.Mesh>(null)
  useFrame((state) => { if (ledRef.current) { const mat = ledRef.current.material as THREE.MeshStandardMaterial; mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.2 } })

  return (
    <group position={position}>
      <mesh><boxGeometry args={[0.04, 0.03, 0.06]} /><meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} /></mesh>
      <mesh position={[0, 0, 0.035]}><cylinderGeometry args={[0.01, 0.012, 0.02, 6]} rotation={[Math.PI / 2, 0, 0]} /><meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.9} /></mesh>
      <mesh ref={ledRef} position={[0.018, 0.01, 0.03]}><sphereGeometry args={[0.003, 4, 4]} /><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} /></mesh>
    </group>
  )
})

// ═══════════════════════════════════════════════════════════════
// MACHINERIE EN HAUT
// ═══════════════════════════════════════════════════════════════

const ElevatorMachinery = memo(function ElevatorMachinery({ position }: { position: [number, number, number] }) {
  const motorRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (motorRef.current) {
      const { elevator } = useHotelStore.getState()
      if (elevator.isMoving) motorRef.current.rotation.x += 0.05
    }
  })

  return (
    <group position={position}>
      {/* Boîtier de machinerie */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[SHAFT_W - 0.2, 0.8, SHAFT_D - 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Moteur (cylindre avec rotation) */}
      <mesh ref={motorRef} position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 12]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Grille de ventilation */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[-0.6 + i * 0.4, 0.82, SHAFT_D / 2 - 0.15]}>
          <boxGeometry args={[0.3, 0.005, 0.2]} />
          <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Contrôleur électronique */}
      <mesh position={[-0.8, 0.5, SHAFT_D / 2 - 0.2]}>
        <boxGeometry args={[0.3, 0.4, 0.08]} />
        <meshStandardMaterial color="#222" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* LED du contrôleur */}
      <mesh position={[-0.8, 0.6, SHAFT_D / 2 - 0.15]}>
        <sphereGeometry args={[0.008, 6, 6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
})