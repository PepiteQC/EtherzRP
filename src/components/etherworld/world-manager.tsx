'use client'

import { Suspense, useCallback, useEffect, useState, memo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Html } from '@react-three/drei'
import { ACESFilmicToneMapping } from 'three'
import * as THREE from 'three'

// World components
import { CityScene } from './city-scene'
import { HotelLobby, HotelCorridorScene } from './hotel-interiors'
import { useWorldStore, type WorldLocation, INTERACTION_ZONES } from './world-store'
import { PlayerCharacter } from './player-character'

// Existing room components
import { RoomArchitecture, RoomLighting, SpawnParticles } from './room-architecture'
import { HotelCorridor3D, PLAYER_DOOR_Z } from './corridor-3d'
import { 
  LuxuryBed, 
  Nightstand, 
  ModernSofa, 
  CoffeeTable, 
  TVStand, 
  GamingDesk, 
  GamingChair, 
  ArcadeMachine, 
  MiniBar, 
  Wardrobe, 
  Safe, 
  Plant, 
  WallArt, 
  Rug, 
  NeonSign, 
  CeilingLight,
} from './furniture'
import { WindowWithCurtains } from './door-system'

// ════════════════════════════════════════════════════════════════════════════
//  ANIMATED DOOR COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface AnimatedDoorProps {
  doorId: string
  position: [number, number, number]
  rotation?: [number, number, number]
  isPlayerRoom?: boolean
}

function AnimatedDoor({ doorId, position, rotation = [0, 0, 0], isPlayerRoom = false }: AnimatedDoorProps) {
  const doorRef = useRef<THREE.Group>(null)
  const { openDoors } = useWorldStore()
  const isOpen = openDoors.has(doorId)
  const targetRotation = useRef(0)
  
  useFrame((_, delta) => {
    if (doorRef.current) {
      // Animation d'ouverture/fermeture de la porte (rotation sur Y)
      targetRotation.current = isOpen ? -Math.PI / 2 : 0
      doorRef.current.rotation.y = THREE.MathUtils.lerp(
        doorRef.current.rotation.y,
        targetRotation.current,
        delta * 5
      )
    }
  })
  
  return (
    <group position={position} rotation={rotation}>
      {/* Door frame */}
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[1.8, 3.9, 0.15]} />
        <meshStandardMaterial color="#0a0a0f" roughness={0.9} />
      </mesh>
      
      {/* Animated door panel - pivote sur le cote gauche */}
      <group ref={doorRef} position={[-0.75, 0, 0]}>
        <mesh position={[0.75, 1.9, 0.02]} castShadow>
          <boxGeometry args={[1.5, 3.7, 0.1]} />
          <meshStandardMaterial 
            color={isPlayerRoom ? "#1a1a3e" : "#1f1f2e"} 
            metalness={0.2} 
            roughness={0.7} 
          />
        </mesh>
        
        {/* Door handle */}
        <mesh position={[1.35, 1.6, 0.1]}>
          <boxGeometry args={[0.06, 0.18, 0.06]} />
          <meshStandardMaterial color="#6b7280" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Door detail lines */}
        <mesh position={[0.75, 2.8, 0.08]}>
          <boxGeometry args={[1.2, 0.03, 0.01]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.3} />
        </mesh>
        <mesh position={[0.75, 1.0, 0.08]}>
          <boxGeometry args={[1.2, 0.03, 0.01]} />
          <meshStandardMaterial color="#2a2a3e" metalness={0.3} />
        </mesh>
        
        {/* Peephole */}
        <mesh position={[0.75, 2.6, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
      
      {/* Room number plate */}
      {isPlayerRoom && (
        <>
          <mesh position={[0, 3.5, 0.08]}>
            <boxGeometry args={[0.4, 0.15, 0.015]} />
            <meshStandardMaterial 
              color="#8b5cf6" 
              emissive="#8b5cf6"
              emissiveIntensity={0.5}
              metalness={0.5} 
            />
          </mesh>
          <pointLight position={[0, 1.9, 0.3]} intensity={0.5} color="#8b5cf6" distance={3} />
        </>
      )}
    </group>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  TRANSITION OVERLAY
// ════════════════════════════════════════════════════════════════════════════

interface TransitionOverlayProps {
  isVisible: boolean
  locationName: string
}

function TransitionOverlay({ isVisible, locationName }: TransitionOverlayProps) {
  if (!isVisible) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 transition-opacity duration-300">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-medium">Chargement...</p>
        <p className="text-zinc-400 text-sm mt-2">{locationName}</p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  INTERACTION PROMPT
// ════════════════════════════════════════════════════════════════════════════

function InteractionPrompt() {
  const { showInteractionPrompt, interactionPromptText } = useWorldStore()
  
  if (!showInteractionPrompt) return null
  
  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40">
      <div className="px-6 py-3 rounded-xl bg-black/80 border border-orange-500/50 backdrop-blur-sm">
        <p className="text-white text-center">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-orange-500 text-black font-bold mr-2">
            E
          </span>
          {interactionPromptText}
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  LOCATION INDICATOR
// ════════════════════════════════════════════════════════════════════════════

const LOCATION_NAMES: Record<WorldLocation, string> = {
  'city': 'Ville de Quebec',
  'hotel-lobby': 'Hotel Etherworld - Lobby',
  'hotel-corridor': 'Hotel Etherworld - Corridor',
  'hotel-room': 'Votre Chambre',
  'depanneur': 'Depanneur',
}

function LocationIndicator() {
  const { currentLocation, timeOfDay, weather } = useWorldStore()
  
  return (
    <div className="fixed top-4 left-4 z-40">
      <div className="px-4 py-2 rounded-lg bg-black/70 border border-zinc-700 backdrop-blur-sm">
        <p className="text-white font-medium">{LOCATION_NAMES[currentLocation]}</p>
        <p className="text-zinc-400 text-sm">
          {String(Math.floor(timeOfDay)).padStart(2, '0')}:00 | {weather}
        </p>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  MINI MAP
// ════════════════════════════════════════════════════════════════════════════

function MiniMap() {
  const { currentLocation, playerPosition } = useWorldStore()
  
  // Only show in city
  if (currentLocation !== 'city') return null
  
  const scale = 0.8 // pixels per world unit
  const mapSize = 150
  
  return (
    <div className="fixed top-4 right-4 z-40">
      <div 
        className="rounded-lg overflow-hidden border-2 border-zinc-600 bg-zinc-900/80"
        style={{ width: mapSize, height: mapSize }}
      >
        <div className="relative w-full h-full">
          {/* Grid */}
          <svg width={mapSize} height={mapSize} className="absolute inset-0">
            {/* Roads */}
            <line x1="0" y1={mapSize/2} x2={mapSize} y2={mapSize/2} stroke="#333" strokeWidth="2" />
            <line x1={mapSize/2} y1="0" x2={mapSize/2} y2={mapSize} stroke="#333" strokeWidth="2" />
            
            {/* Buildings */}
            <rect x={mapSize/2-15} y={mapSize/2-40} width="30" height="20" fill="#f97316" opacity="0.6" /> {/* Hotel */}
            <rect x={mapSize/2-50} y={mapSize/2-10} width="20" height="20" fill="#ef4444" opacity="0.6" /> {/* Depanneur */}
            <rect x={mapSize/2+30} y={mapSize/2-10} width="20" height="20" fill="#3b82f6" opacity="0.6" /> {/* Hospital */}
            
            {/* Player marker */}
            <circle 
              cx={mapSize/2 + playerPosition[0] * scale} 
              cy={mapSize/2 - playerPosition[2] * scale} 
              r="4" 
              fill="#22c55e" 
            />
          </svg>
          
          {/* Legend */}
          <div className="absolute bottom-1 left-1 text-[8px] text-zinc-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Vous</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  PLAYER ROOM SCENE (Your original detailed room)
// ════════════════════════════════════════════════════════════════════════════

const PlayerRoomScene = memo(function PlayerRoomScene() {
  const [showSpawnParticles, setShowSpawnParticles] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => setShowSpawnParticles(false), 5000)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <group>
      <Environment preset="night" />
      <RoomLighting />
      <fog attach="fog" args={['#0a0a0f', 10, 35]} />
      
      <RoomArchitecture />
      <SpawnParticles active={showSpawnParticles} />
      
      {/* Hotel corridor visible from room */}
      <HotelCorridor3D />
      
      {/* === PORTE ANIMEE entre chambre et corridor === */}
      {/* La porte est positionnee sur le mur du corridor, cote chambre */}
      <AnimatedDoor 
        doorId="room-exit"
        position={[-3, 0, PLAYER_DOOR_Z]}
        rotation={[0, Math.PI / 2, 0]}
        isPlayerRoom={true}
      />
      
      {/* Player room - AVEC MEUBLES - 12x14m, 5m hauteur */}
      <group position={[-9, 0, PLAYER_DOOR_Z]} rotation={[0, Math.PI / 2, 0]}>
        {/* Room walls - hauteur 5m */}
        {/* Back wall */}
        <mesh position={[0, 2.5, -7]} castShadow receiveShadow>
          <boxGeometry args={[12, 5, 0.15]} />
          <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
        </mesh>
        {/* Front wall */}
        <mesh position={[0, 2.5, 7]} castShadow receiveShadow>
          <boxGeometry args={[12, 5, 0.15]} />
          <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
        </mesh>
        {/* Left wall (window side) */}
        <mesh position={[-6, 2.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 5, 14]} />
          <meshStandardMaterial color="#3a3a5e" roughness={0.9} />
        </mesh>
        {/* Right wall - REMOVED to allow door passage (wall is part of corridor) */}
        
        {/* Room floor */}
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 14]} />
          <meshStandardMaterial color="#3d3530" roughness={0.7} />
        </mesh>
        
        {/* Room ceiling */}
        <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 14]} />
          <meshStandardMaterial color="#2a2a3e" roughness={0.9} />
        </mesh>
        
        {/* === BEDROOM AREA (back of room, Z negative) === */}
        <LuxuryBed position={[0, 0, -4]} />
        <Nightstand position={[-2, 0, -5]} side="left" />
        <Nightstand position={[2, 0, -5]} side="right" />
        
        {/* === LIVING AREA (middle of room) === */}
        <ModernSofa position={[-3, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        <CoffeeTable position={[0, 0, 0]} />
        <TVStand position={[4, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
        
        {/* === GAMING/WORK AREA (front of room, Z positive) === */}
        <GamingDesk position={[-4, 0, 5]} rotation={[0, Math.PI / 2, 0]} />
        <GamingChair position={[-2.5, 0, 5]} rotation={[0, -Math.PI / 2, 0]} />
        <ArcadeMachine position={[4, 0, 5]} rotation={[0, Math.PI, 0]} />
        
        {/* === MINI BAR (side) === */}
        <MiniBar position={[5, 0, 4]} rotation={[0, -Math.PI / 2, 0]} />
        
        {/* === STORAGE === */}
        <Wardrobe position={[5, 0, -5]} rotation={[0, -Math.PI / 2, 0]} />
        <Safe position={[-5, 0, -6]} />
        
        {/* === DECORATIVE ELEMENTS === */}
        <WallArt position={[-5.9, 2.5, -3]} size={[1, 0.7]} />
        <WallArt position={[0, 2.5, -6.85]} size={[1.5, 0.9]} />
        <Plant position={[-5, 0, 6]} size={1.5} />
        <Plant position={[5, 0, -3]} size={1} />
        <Rug position={[0, 0.01, 0]} size={[4, 3]} />
        <Rug position={[0, 0.01, -4]} size={[4, 2.5]} />
        <NeonSign position={[-5.85, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} />
        <CeilingLight position={[0, 4.95, 0]} />
        <CeilingLight position={[0, 4.95, -4]} />
        <CeilingLight position={[0, 4.95, 4]} />
        
        {/* Room lights */}
        <pointLight position={[0, 4, 0]} intensity={4} color="#fef3c7" distance={12} />
        <pointLight position={[0, 4, -4]} intensity={3} color="#fef3c7" distance={10} />
        <pointLight position={[0, 4, 4]} intensity={3} color="#fef3c7" distance={10} />
        
        {/* Neon accent light */}
        <pointLight position={[-5.5, 3, 0]} intensity={3} color="#8b5cf6" distance={8} />
        
        {/* === WINDOW on left wall === */}
        <WindowWithCurtains 
          position={[-5.9, 2.5, -3]} 
          rotation={[0, Math.PI / 2, 0]}
          size={[4, 2.5]}
        />
      </group>
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
//  DEPANNEUR INTERIOR
// ════════════════════════════════════════════════════════════════════════════

const DepanneurInterior = memo(function DepanneurInterior() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
      </mesh>
      
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.8, 0]}>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial color="#d0ccc4" roughness={0.9} />
      </mesh>
      
      {/* Walls */}
      <mesh position={[0, 2.9, -6.9]} castShadow>
        <boxGeometry args={[16, 5.8, 0.15]} />
        <meshStandardMaterial color="#f0ede6" roughness={0.85} />
      </mesh>
      <mesh position={[-7.9, 2.9, 0]} castShadow>
        <boxGeometry args={[0.15, 5.8, 14]} />
        <meshStandardMaterial color="#eae7e0" roughness={0.85} />
      </mesh>
      <mesh position={[7.9, 2.9, 0]} castShadow>
        <boxGeometry args={[0.15, 5.8, 14]} />
        <meshStandardMaterial color="#eae7e0" roughness={0.85} />
      </mesh>
      
      {/* Front wall with door opening */}
      <mesh position={[-4.75, 2.9, 6.92]} castShadow>
        <boxGeometry args={[5.5, 5.8, 0.12]} />
        <meshStandardMaterial color="#f5f2eb" roughness={0.8} />
      </mesh>
      <mesh position={[4.75, 2.9, 6.92]} castShadow>
        <boxGeometry args={[5.5, 5.8, 0.12]} />
        <meshStandardMaterial color="#f5f2eb" roughness={0.8} />
      </mesh>
      
      {/* Counter */}
      <group position={[0, 0, 4.5]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[4, 1.1, 0.6]} />
          <meshStandardMaterial color="#c0a060" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.13, 0]}>
          <boxGeometry args={[4.1, 0.06, 0.7]} />
          <meshStandardMaterial color="#e0d8c8" roughness={0.3} />
        </mesh>
        {/* Cash register */}
        <mesh position={[1.2, 1.3, 0]}>
          <boxGeometry args={[0.3, 0.2, 0.25]} />
          <meshStandardMaterial color="#333344" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
      
      {/* Shelving units */}
      {[-4, 4].map((x, i) => (
        <group key={`shelf-${i}`} position={[x, 0, 0]}>
          {[0.5, 1.0, 1.5, 2.0].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <boxGeometry args={[0.4, 0.08, 3.5]} />
              <meshStandardMaterial color="#8a7a6a" roughness={0.6} />
            </mesh>
          ))}
          {/* Products on shelves */}
          {[0.5, 1.0, 1.5, 2.0].map((y) =>
            Array.from({ length: 6 }).map((_, j) => (
              <mesh key={`prod-${y}-${j}`} position={[0, y + 0.2, -1.2 + j * 0.5]} castShadow>
                <boxGeometry args={[0.2, 0.3, 0.2]} />
                <meshStandardMaterial color={`hsl(${(j * 50) % 360}, 60%, 55%)`} />
              </mesh>
            ))
          )}
        </group>
      ))}
      
      {/* Refrigerators in back */}
      {[-3, 0, 3].map((x, i) => (
        <group key={`fridge-${i}`} position={[x, 0, -6.5]}>
          <mesh castShadow>
            <boxGeometry args={[2.2, 2.2, 0.8]} />
            <meshStandardMaterial color="#e0e8ec" roughness={0.3} metalness={0.8} />
          </mesh>
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
        </group>
      ))}
      
      {/* Lighting */}
      <ambientLight intensity={0.4} color="#fff8e0" />
      {[-3, 0, 3].map((x) => (
        <group key={`light-${x}`} position={[x, 5.6, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.08, 0.3]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff8e0" emissiveIntensity={0.8} />
          </mesh>
          <pointLight position={[0, -0.2, 0]} color="#fff8e0" intensity={1.5} distance={8} />
        </group>
      ))}
    </group>
  )
})

// ════════════════════════════════════════════════════════════════════════════
//  SCENE RENDERER (renders the correct scene based on location)
// ════════════════════════════════════════════════════════════════════════════

function SceneRenderer() {
  const { 
    currentLocation, 
    timeOfDay, 
    setLocation, 
    setPlayerPosition,
    startTransition,
  } = useWorldStore()
  
  const handleEnterHotel = useCallback(() => {
    startTransition('hotel-lobby', [0, 0, 5])
    setTimeout(() => {
      setLocation('hotel-lobby')
      setPlayerPosition([0, 0, 5])
      useWorldStore.setState({ isTransitioning: false })
    }, 500)
  }, [setLocation, setPlayerPosition, startTransition])
  
  const handleExitHotel = useCallback(() => {
    startTransition('city', [0, 0, -45])
    setTimeout(() => {
      setLocation('city')
      setPlayerPosition([0, 0, -45])
      useWorldStore.setState({ isTransitioning: false })
    }, 500)
  }, [setLocation, setPlayerPosition, startTransition])
  
  const handleGoToFloor = useCallback((floor: number) => {
    startTransition('hotel-corridor', [0, 0, -8])
    setTimeout(() => {
      setLocation('hotel-corridor')
      setPlayerPosition([0, 0, -8])
      useWorldStore.setState({ isTransitioning: false })
    }, 500)
  }, [setLocation, setPlayerPosition, startTransition])
  
  const handleEnterRoom = useCallback((roomId: string) => {
    startTransition('hotel-room', [0, 0, 0])
    setTimeout(() => {
      setLocation('hotel-room')
      setPlayerPosition([0, 0, 0])
      useWorldStore.setState({ isTransitioning: false })
    }, 500)
  }, [setLocation, setPlayerPosition, startTransition])
  
  const handleGoToLobby = useCallback(() => {
    startTransition('hotel-lobby', [0, 0, 0])
    setTimeout(() => {
      setLocation('hotel-lobby')
      setPlayerPosition([0, 0, 0])
      useWorldStore.setState({ isTransitioning: false })
    }, 500)
  }, [setLocation, setPlayerPosition, startTransition])
  
  const handleEnterDepanneur = useCallback(() => {
    startTransition('depanneur', [0, 0, 4])
    setTimeout(() => {
      setLocation('depanneur')
      setPlayerPosition([0, 0, 4])
      useWorldStore.setState({ isTransitioning: false })
    }, 500)
  }, [setLocation, setPlayerPosition, startTransition])
  
  switch (currentLocation) {
    case 'city':
      return (
        <CityScene 
          timeOfDay={timeOfDay}
          onEnterHotel={handleEnterHotel}
          onEnterDepanneur={handleEnterDepanneur}
        />
      )
    case 'hotel-lobby':
      return (
        <HotelLobby 
          onExitToCity={handleExitHotel}
          onGoToFloor={handleGoToFloor}
        />
      )
    case 'hotel-corridor':
      return (
        <HotelCorridorScene 
          floor={1}
          onEnterRoom={handleEnterRoom}
          onGoToLobby={handleGoToLobby}
        />
      )
    case 'hotel-room':
      return <PlayerRoomScene />
    case 'depanneur':
      return <DepanneurInterior />
    default:
      return <PlayerRoomScene />
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN WORLD MANAGER COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export function WorldManager() {
  const { isTransitioning, currentLocation } = useWorldStore()
  
  return (
    <div className="w-full h-screen bg-background">
      <Canvas
        shadows
        camera={{ position: [0, 8, 20], fov: 55 }}
        gl={{ 
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.8,
        }}
      >
        <Suspense fallback={null}>
          <SceneRenderer />
          <PlayerCharacter />
        </Suspense>
      </Canvas>
      
      {/* UI Overlays */}
      <LocationIndicator />
      <MiniMap />
      <InteractionPrompt />
      <TransitionOverlay 
        isVisible={isTransitioning} 
        locationName={LOCATION_NAMES[currentLocation]}
      />
      
      {/* Controls help */}
      <div className="fixed bottom-4 right-4 z-40 text-xs text-zinc-500 bg-black/50 px-3 py-2 rounded-lg">
        <p>WASD = Deplacer | Clic droit = Camera | E = Interagir</p>
      </div>
    </div>
  )
}
