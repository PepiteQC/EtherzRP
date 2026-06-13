/**
 * Game.tsx — CORRIGÉ
 * Fix: spawn position, cinématique, rideau bleu fog
 */

import { Canvas, useThree } from '@react-three/fiber'
import { KeyboardControls, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { useRef, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import Terrain from './Terrain'
import Road from './Road'
import Trees from './Trees'
import Buildings from './Buildings'
import QuebecCity from './QuebecCity'
import Vehicle from './Vehicle'
import Walker from './Walker'
import Sky from './Sky'
import CinematicIntro from './CinematicIntro'
import InteriorScene from './InteriorScene'
import EtherWorldCity from './EtherWorldCity'
import WorldBeef from './WorldBeef'
import { CityRuntime } from '../world/city/CityRuntime'
import { writeSave, type SaveData } from '../../hooks/useSaveSystem'
import { getBuildingDoors, type DoorZone, type BuildingDef } from '../../data/quebecBuildings'
import { startJob, getState as getGameState } from '../../store/gameState'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const CAMERA_FAR       = 900   // ← augmenté pour éviter le rideau
const FOG_NEAR         = 120   // ← repoussé
const FOG_FAR          = 800   // ← légèrement avant le far clip
                               //   pour fondu doux sans rideau brutal
const CITY_ENTRY_Z     = 800
const AUTO_SAVE_INTERVAL      = 30_000
const SAVE_STATUS_RESET_DELAY = 2_500

const DEFAULT_SPAWN: [number, number, number] = [0, 0.5, -700]

const IS_LOW_END =
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad/i.test(navigator.userAgent)

// ─────────────────────────────────────────────
// CONTROLS
// ─────────────────────────────────────────────

enum Controls {
  forward = 'forward',
  back    = 'back',
  left    = 'left',
  right   = 'right',
  brake   = 'brake',
}

const keyMap = [
  { name: Controls.forward, keys: ['ArrowUp',    'KeyW'] },
  { name: Controls.back,    keys: ['ArrowDown',  'KeyS'] },
  { name: Controls.left,    keys: ['ArrowLeft',  'KeyA'] },
  { name: Controls.right,   keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.brake,   keys: ['Space'] },
]

// ─────────────────────────────────────────────
// ZONES
// ─────────────────────────────────────────────

export const ALL_ZONES = [
  { zMin: -950, zMax: -750, name: 'Québec — Autoroute 40 / Sortie Portneuf' },
  { zMin: -750, zMax: -600, name: 'Neuville — Bord du Fleuve' },
  { zMin: -600, zMax: -480, name: 'Donnacona — Village' },
  { zMin: -480, zMax: -350, name: 'Cap-Santé — Centre' },
  { zMin: -350, zMax: -220, name: 'Deschambault-Grondines — Village' },
  { zMin: -220, zMax: -100, name: 'Portneuf — Village' },
  { zMin: -100, zMax:   50, name: 'Saint-Alban · Saint-Ubalde' },
  { zMin:   50, zMax:  180, name: 'Saint-Casimir — Village' },
  { zMin:  180, zMax:  320, name: 'Batiscan — Bord du Fleuve' },
  { zMin:  320, zMax:  460, name: 'Champlain — Village' },
  { zMin:  460, zMax:  600, name: 'Sainte-Geneviève-de-Batiscan' },
  { zMin:  600, zMax:  750, name: 'Trois-Rivières — Approche Route 138' },
  { zMin:  750, zMax:  800, name: 'Trois-Rivières — Centre' },
  { zMin:  800, zMax:  950, name: '🏙️ EtherWorld — Centre-Ville' },
] as const

function resolveZone(z: number): string {
  if (z > CITY_ENTRY_Z) return '🏙️ EtherWorld — Centre-Ville'
  for (const zone of ALL_ZONES) {
    if (z >= zone.zMin && z < zone.zMax) return zone.name
  }
  return 'Route 138'
}

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface InteriorState {
  id:         string
  interiorId: string
  doorPos:    [number, number, number]
  job?:       BuildingDef['job']
}

interface GameProps {
  onSpeedChange:     (speed: number) => void
  onZoneChange:      (zone: string) => void
  onModeChange:      (mode: 'driving' | 'walking') => void
  onSaveStatus:      (status: 'saved' | 'saving' | 'idle') => void
  onNearBuilding?:   (zone: DoorZone | null) => void
  onInteriorPrompt?: (label: string | null) => void
  onIsInInterior?:   (v: boolean) => void
  initialSave?:      SaveData | null
  isNewPlayer?:      boolean
}

interface SceneProps extends GameProps {
  cinematicDone:       boolean
  onCinematicComplete: () => void
}

// ─────────────────────────────────────────────
// BUILDING ZONES SINGLETON
// ─────────────────────────────────────────────

const BUILDING_ZONES = getBuildingDoors()

// ─────────────────────────────────────────────
// SAVE PAYLOAD BUILDER
// ─────────────────────────────────────────────

function buildSavePayload(params: {
  mode:       'driving' | 'walking'
  vehicleRef: React.MutableRefObject<{ pos: THREE.Vector3; rotY: number }>
  walkerRef:  React.MutableRefObject<THREE.Vector3>
  zone:       string
}): SaveData {
  const { mode, vehicleRef, walkerRef, zone } = params
  return {
    version:     1,
    mode,
    vehiclePos:  [vehicleRef.current.pos.x, vehicleRef.current.pos.y, vehicleRef.current.pos.z],
    vehicleRotY: vehicleRef.current.rotY,
    walkerPos:   mode === 'walking'
      ? [walkerRef.current.x, walkerRef.current.y, walkerRef.current.z]
      : undefined,
    zone,
    money:       getGameState().money,
    // ✅ FIX: sauvegarder que ce n'est plus un nouveau joueur
    isNewPlayer: false,
  }
}

// ─────────────────────────────────────────────
// ✅ FIX: CameraInitializer — positionne la caméra
// APRÈS que la save soit disponible
// ─────────────────────────────────────────────

function CameraInitializer({
  targetZ,
  ready,
}: {
  targetZ: number
  ready:   boolean
}) {
  const { camera } = useThree()
  const initialized = useRef(false)

  useEffect(() => {
    // Attendre que la save soit chargée ET que le composant soit monté
    if (!ready || initialized.current) return
    initialized.current = true

    // Positionner la caméra sur la bonne position de spawn
    camera.position.set(0, 5, targetZ + 15)
    camera.near = 0.5
    camera.far  = CAMERA_FAR
    camera.updateProjectionMatrix()
  }, [camera, targetZ, ready])

  return null
}

// ════════════════════════════════════════════════════════════════
// SCÈNE PRINCIPALE
// ════════════════════════════════════════════════════════════════

function Scene({
  onSpeedChange,
  onZoneChange,
  onModeChange,
  onSaveStatus,
  onNearBuilding,
  onInteriorPrompt,
  onIsInInterior,
  initialSave,
  cinematicDone,
  onCinematicComplete,
}: SceneProps) {
  const [mode, setMode] = useState<'driving' | 'walking'>(
    initialSave?.mode ?? 'driving'
  )
  const [interior, setInterior] = useState<InteriorState | null>(null)

  // ✅ FIX: initialisation correcte du walkerStart depuis la save
  const [walkerStart, setWalkerStart] = useState<THREE.Vector3>(() => {
    if (initialSave?.mode === 'walking' && initialSave.walkerPos) {
      return new THREE.Vector3(...initialSave.walkerPos)
    }
    return new THREE.Vector3(
      ...(initialSave?.vehiclePos ?? DEFAULT_SPAWN)
    )
  })

  // Refs stables
  const modeRef         = useRef<'driving' | 'walking'>(initialSave?.mode ?? 'driving')
  const zoneRef         = useRef<string>(initialSave?.zone ?? ALL_ZONES[0].name)
  const vehicleWorldPos = useRef(new THREE.Vector3(...(initialSave?.vehiclePos ?? DEFAULT_SPAWN)))

  const vehicleSaveRef = useRef({
    pos:  new THREE.Vector3(...(initialSave?.vehiclePos ?? DEFAULT_SPAWN)),
    rotY: initialSave?.vehicleRotY ?? 0,
  })
  const walkerSaveRef = useRef<THREE.Vector3>(
    initialSave?.walkerPos
      ? new THREE.Vector3(...initialSave.walkerPos)
      : new THREE.Vector3(...(initialSave?.vehiclePos ?? DEFAULT_SPAWN))
  )

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── triggerSave ──────────────────────────────

  const triggerSave = useCallback((currentMode: 'driving' | 'walking') => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    onSaveStatus('saving')
    writeSave(buildSavePayload({
      mode:       currentMode,
      vehicleRef: vehicleSaveRef,
      walkerRef:  walkerSaveRef,
      zone:       zoneRef.current,
    }))
    onSaveStatus('saved')
    saveTimeoutRef.current = setTimeout(
      () => onSaveStatus('idle'),
      SAVE_STATUS_RESET_DELAY
    )
  }, [onSaveStatus])

  // ── Auto-save ────────────────────────────────

  useEffect(() => {
    const interval = setInterval(
      () => triggerSave(modeRef.current),
      AUTO_SAVE_INTERVAL
    )
    return () => {
      clearInterval(interval)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [triggerSave])

  // ── Zone change ──────────────────────────────

  const handleZoneChange = useCallback((z: number) => {
    const zone = resolveZone(z)
    if (zone === zoneRef.current) return
    zoneRef.current = zone
    onZoneChange(zone)
  }, [onZoneChange])

  // ── Exit véhicule ────────────────────────────

  const handleExitVehicle = useCallback((pos: THREE.Vector3) => {
    const walkerPos = new THREE.Vector3(pos.x + 3, 1, pos.z)
    walkerSaveRef.current.copy(walkerPos)
    setWalkerStart(walkerPos.clone())
    setMode('walking')
    modeRef.current = 'walking'
    onModeChange('walking')
    triggerSave('walking')
  }, [onModeChange, triggerSave])

  // ── Enter véhicule ───────────────────────────

  const handleEnterVehicle = useCallback(() => {
    setMode('driving')
    modeRef.current = 'driving'
    onModeChange('driving')
    onSpeedChange(0)
    triggerSave('driving')
  }, [onModeChange, onSpeedChange, triggerSave])

  // ── Bâtiment ─────────────────────────────────

  const handleInteractBuilding = useCallback((zone: DoorZone) => {
    if (zone.hasInterior && zone.interiorId) {
      setInterior({
        id:         zone.id,
        interiorId: zone.interiorId,
        doorPos:    zone.pos,
        job:        zone.job,
      })
      onIsInInterior?.(true)
    } else if (zone.job) {
      startJob(zone.job)
    }
  }, [onIsInInterior])

  const handleExitInterior = useCallback(() => {
    if (interior) setWalkerStart(new THREE.Vector3(...interior.doorPos))
    setInterior(null)
    onIsInInterior?.(false)
    onInteriorPrompt?.(null)
  }, [interior, onIsInInterior, onInteriorPrompt])

  const handleInteriorPrompt = useCallback(
    (_type: string | null, label: string | null) => onInteriorPrompt?.(label),
    [onInteriorPrompt]
  )

  const initVehiclePos  = (initialSave?.vehiclePos  ?? DEFAULT_SPAWN) as [number, number, number]
  const initVehicleRotY =  initialSave?.vehicleRotY ?? 0

  return (
    <>
      {/* ✅ FIX caméra: positionne APRÈS chargement save */}
      <CameraInitializer
        targetZ={initVehiclePos[2]}
        ready={true}
      />

      {/* ── Éclairage ── */}
      <ambientLight intensity={0.55} color="#b0c8e8" />
      <directionalLight
        position={[80, 120, -200]}
        intensity={1.4}
        color="#fff8e0"
        castShadow={!IS_LOW_END}
        shadow-mapSize-width={IS_LOW_END ? 512 : 1024}
        shadow-mapSize-height={IS_LOW_END ? 512 : 1024}
        shadow-camera-near={1}
        shadow-camera-far={400}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0003}
      />
      <hemisphereLight args={['#87ceeb', '#3a5a2a', 0.4]} />

      {/* ✅ FIX brouillard: FOG_FAR < CAMERA_FAR = fondu doux */}
      <fog attach="fog" args={['#7aadda', FOG_NEAR, FOG_FAR]} />

      {/* ── Environnement ── */}
      <Sky />
      <Terrain />
      <Road />
      <Trees />
      <Buildings />
      <QuebecCity />

      {/* ✅ FIX sol: plus large + plus long pour pas voir les bords */}
      <mesh
        position={[0, -0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        frustumCulled
      >
        <planeGeometry args={[1200, 2200]} />
        <meshLambertMaterial color="#2a4a2a" />
      </mesh>

      {/* ── EtherWorld City ── */}
      <EtherWorldCity />

      {/* ── BEEF CONNECTÉ: composants 3D secondaires branchés au monde principal */}
      <WorldBeef />

      {/* ── Runtime ville: branche CITY_BUILDINGS + MODEL_DEFS au monde EtherWorld */}
      <group position={[0, 0, 900]}>
        <CityRuntime />
      </group>

      {/* ── Cinématique ── */}
      {!cinematicDone && <CinematicIntro onComplete={onCinematicComplete} />}

      {/* ── Véhicule ── */}
      <Vehicle
        active={mode === 'driving' && cinematicDone && !interior}
        onSpeedChange={onSpeedChange}
        onZoneChange={(_, pos) => handleZoneChange(pos?.z ?? vehicleWorldPos.current.z)}
        onExitVehicle={handleExitVehicle}
        worldPositionRef={vehicleWorldPos}
        initialPosition={initVehiclePos}
        initialRotationY={initVehicleRotY}
        saveRef={vehicleSaveRef}
      />

      {/* ── Piéton ── */}
      {mode === 'walking' && cinematicDone && !interior && (
        <Walker
          startPosition={walkerStart}
          onSpeedChange={onSpeedChange}
          onZoneChange={(_, pos) => handleZoneChange(pos?.z ?? walkerSaveRef.current.z)}
          onEnterVehicle={handleEnterVehicle}
          vehiclePosition={vehicleWorldPos}
          saveRef={walkerSaveRef}
          buildingZones={BUILDING_ZONES}
          onNearBuilding={onNearBuilding}
          onInteractBuilding={handleInteractBuilding}
        />
      )}

      {/* ── Intérieur ── */}
      {interior && (
        <InteriorScene
          interiorId={interior.interiorId}
          buildingJob={interior.job}
          onExit={handleExitInterior}
          onNearInteraction={handleInteriorPrompt}
        />
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════════
// EXPORT PRINCIPAL
// ════════════════════════════════════════════════════════════════

export default function Game({
  onSpeedChange,
  onZoneChange,
  onModeChange,
  onSaveStatus,
  onNearBuilding,
  onInteriorPrompt,
  onIsInInterior,
  initialSave,
  isNewPlayer = false,
}: GameProps) {
  // ✅ FIX cinématique: useEffect pour re-sync si isNewPlayer change
  const [cinematicDone, setCinematicDone] = useState(!isNewPlayer)

  useEffect(() => {
    // Si la save arrive après le montage et dit que ce n'est pas
    // un nouveau joueur → marquer la cinématique comme terminée
    if (!isNewPlayer) {
      setCinematicDone(true)
    }
  }, [isNewPlayer])

  const handleCinematicComplete = useCallback(() => {
    setCinematicDone(true)
    // Sauvegarder immédiatement que la cinématique est vue
    // pour ne plus la rejouer
    writeSave({
      version:     1,
      mode:        'driving',
      vehiclePos:  DEFAULT_SPAWN,
      vehicleRotY: 0,
      zone:        ALL_ZONES[0].name,
      money:       0,
      isNewPlayer: false,   // ✅ flag persisté
    })
  }, [])

  // ✅ FIX: canvas créé avec position par défaut seulement
  // La vraie position est gérée par CameraInitializer à l'intérieur
  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        camera={{
          position: [0, 5, DEFAULT_SPAWN[2] + 15],
          fov:      65,
          near:     0.5,
          far:      CAMERA_FAR,
        }}
        shadows={IS_LOW_END ? false : { type: THREE.PCFSoftShadowMap }}
        gl={{
          antialias:           !IS_LOW_END,
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          powerPreference:     'high-performance',
        }}
        dpr={IS_LOW_END ? [0.8, 1] : [1, 1.5]}
        style={{ width: '100%', height: '100%' }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        <Scene
          onSpeedChange={onSpeedChange}
          onZoneChange={onZoneChange}
          onModeChange={onModeChange}
          onSaveStatus={onSaveStatus}
          onNearBuilding={onNearBuilding}
          onInteriorPrompt={onInteriorPrompt}
          onIsInInterior={onIsInInterior}
          initialSave={initialSave}
          cinematicDone={cinematicDone}
          onCinematicComplete={handleCinematicComplete}
        />
      </Canvas>
    </KeyboardControls>
  )
}