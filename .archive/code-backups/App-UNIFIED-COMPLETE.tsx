/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * APP-UNIFIED-COMPLETE.TSX — EtherWorld v5.0 OFFICIAL
 *
 * Ce fichier orchestre TOUT :
 * - Connecté au vrai store Zustand unifié (game-store-unified.ts)
 * - Charge les données des 5 zones au démarrage
 * - Rend la ville complète (80+ bâtiments, routes, zones)
 * - Cycle jour/nuit dynamique
 * - Météo visuelle
 * - Mouvement joueur WASD
 * - Camera GTA-style
 * - HUD + Chat + Admin UI
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sky, Stars, Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ── Store unifié (le vrai, avec 37+ props et 50+ actions) ──
import { useGameStore } from '@/store/game-store-unified'

// ── Composants unifiés réutilisables ──
import { AdminEffects } from '@/components/effects/AdminEffects'
import { GameWorld } from '@/components/core/GameWorld'
import { GameHUD } from '@/components/ui/GameHUD'

// ── Données du monde ──
import {
  HOTEL_MAIN,
  PENTHOUSE_DELUXE,
  DEPANNEUR_DOWNTOWN,
  ATM_BUILDING,
  VILLAGE_NORD,
  VILLAGE_EST,
  VILLAGE_OUEST,
  ROADS,
  CITY_DISTRICTS,
} from '@/data/world-entities-complete'
import {
  DOWNTOWN_ZONE,
  VILLAGE_NORD_ZONE,
  VILLAGE_EST_ZONE,
  VILLAGE_OUEST_ZONE,
  SUBURBS_ZONE,
  ROAD_NETWORK,
} from '@/data/city-layout'
import { POLY_MATERIALS } from '@/data/building-configs'

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function formatTime(t: number) {
  const h = Math.floor(t) % 24
  const m = Math.floor((t % 1) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getBuildingColor(type: string): string {
  switch (type) {
    case 'hotel': return '#d4a574'
    case 'penthouse': return '#f5f5f5'
    case 'depanneur': return '#cc6633'
    case 'residential-house':
    case 'residential-house-large':
    case 'residential-cottage': return '#8B6F47'
    case 'commercial-store': return '#777777'
    case 'park-area': return '#228B22'
    case 'town-hall': return '#8B7355'
    case 'atm-kiosk': return '#2a6099'
    default: return '#6B7280'
  }
}

function getBuildingHeight(type: string): number {
  switch (type) {
    case 'hotel-120-rooms': return 20
    case 'penthouse-ultra': return 5
    case 'depanneur': return 4
    case 'convenience-store': return 3.5
    case 'residential-house': return 5
    case 'residential-house-large': return 6
    case 'residential-cottage': return 4.5
    case 'commercial-store': return 7
    case 'park-area': return 0.1
    case 'town-hall': return 8
    case 'atm-kiosk': return 2.5
    default: return 5
  }
}

function getBuildingDims(type: string): [number, number] {
  switch (type) {
    case 'hotel-120-rooms': return [25, 20]
    case 'penthouse-ultra': return [15, 10]
    case 'convenience-store': return [8, 6]
    case 'residential-house': return [7, 7]
    case 'residential-house-large': return [8, 8]
    case 'residential-cottage': return [6, 6]
    case 'commercial-store': return [12, 10]
    case 'park-area': return [20, 20]
    case 'town-hall': return [14, 12]
    case 'atm-kiosk': return [2, 2]
    default: return [6, 6]
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SYSTÈME ENVIRONNEMENT — Cycle jour/nuit, météo, ciel
// ────────────────────────────────────────────────────────────────────────────

function EnvironmentSystem() {
  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const dayNightCycleEnabled = useGameStore((s) => s.dayNightCycleEnabled)
  const weather = useGameStore((s) => s.weather)
  const advanceTime = useGameStore((s) => s.advanceTime)

  // Avancer le temps (1 min réelle = 10 min de jeu)
  useFrame((_, delta) => {
    if (dayNightCycleEnabled) {
      advanceTime(delta * 0.5) // 0.5 min de jeu par seconde réelle
    }
  })

  // Calculer la position du soleil basée sur l'heure
  const sunPosition = useMemo((): [number, number, number] => {
    const angle = ((timeOfDay - 6) / 24) * Math.PI * 2
    return [
      Math.cos(angle) * 200,
      Math.sin(angle) * 200,
      50,
    ]
  }, [timeOfDay])

  // Intensité lumière ambiante selon heure
  const ambientIntensity = useMemo(() => {
    if (timeOfDay < 5 || timeOfDay > 22) return 0.05
    if (timeOfDay < 7) return 0.3 + (timeOfDay - 5) * 0.15
    if (timeOfDay > 20) return 0.3 - (timeOfDay - 20) * 0.15
    return 0.5
  }, [timeOfDay])

  const isNight = timeOfDay < 5.5 || timeOfDay > 20.5
  const isSunrise = timeOfDay >= 5.5 && timeOfDay < 8
  const isSunset = timeOfDay >= 18 && timeOfDay <= 20.5

  return (
    <>
      <ambientLight
        intensity={ambientIntensity}
        color={isNight ? '#2244aa' : isSunrise || isSunset ? '#ff9966' : '#ffffff'}
      />
      <directionalLight
        position={sunPosition}
        intensity={isNight ? 0 : 0.9}
        color={isSunrise || isSunset ? '#ff8844' : '#ffffcc'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={2000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
      />

      {/* Ciel / Stars */}
      {isNight ? (
        <Stars radius={500} depth={50} count={5000} factor={4} saturation={0} fade />
      ) : (
        <Sky
          distance={450000}
          sunPosition={sunPosition}
          inclination={0}
          azimuth={0.25}
          turbidity={weather === 'fog' ? 20 : weather === 'rain' ? 15 : 8}
          rayleigh={weather === 'clear' ? 2 : 4}
        />
      )}

      {/* Brouillard météo */}
      {weather === 'fog' && <fog attach="fog" color="#aaaaaa" near={20} far={150} />}
      {weather === 'rain' && <fog attach="fog" color="#334455" near={50} far={300} />}
      {weather === 'snow' && <fog attach="fog" color="#ccddee" near={30} far={200} />}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// TERRAIN — Sol de la ville (5 zones + textures différentes)
// ────────────────────────────────────────────────────────────────────────────

function CityTerrain() {
  return (
    <group>
      {/* Sol principal - herbe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.9} />
      </mesh>

      {/* Downtown - asphalte */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#333333" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Village Nord - zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-150, 0, -300]} receiveShadow>
        <planeGeometry args={[110, 110]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>

      {/* Village Est - zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[380, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 210]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>

      {/* Village Ouest - zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-350, 0, 250]} receiveShadow>
        <planeGeometry args={[120, 220]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>

      {/* Suburbs - zone industrielle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[500, 0, 400]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#2a2a2a" roughness={1.0} />
      </mesh>

      {/* Trottoirs downtown */}
      {[-40, 40].map((z) => (
        <mesh key={`sidewalk-z-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z]} receiveShadow>
          <planeGeometry args={[100, 4]} />
          <meshStandardMaterial color="#888888" roughness={0.8} />
        </mesh>
      ))}
      {[-40, 40].map((x) => (
        <mesh key={`sidewalk-x-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]} receiveShadow>
          <planeGeometry args={[4, 100]} />
          <meshStandardMaterial color="#888888" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// ROUTES — Réseau de routes connectant les 5 zones
// ────────────────────────────────────────────────────────────────────────────

function RoadNetwork() {
  // Calculer les routes à partir des checkpoints de city-layout
  const routes = useMemo(() => [
    // Downtown → Nord
    {
      id: 'dt-nord', start: new THREE.Vector3(0, 0.05, -30), end: new THREE.Vector3(-150, 0.05, -270),
      width: 8, color: '#2a2a2a'
    },
    // Downtown → Est
    {
      id: 'dt-est', start: new THREE.Vector3(60, 0.05, 0), end: new THREE.Vector3(330, 0.05, 0),
      width: 9, color: '#2a2a2a'
    },
    // Downtown → Ouest
    {
      id: 'dt-ouest', start: new THREE.Vector3(-60, 0.05, 0), end: new THREE.Vector3(-300, 0.05, 220),
      width: 8, color: '#2a2a2a'
    },
    // Downtown → Suburbs
    {
      id: 'dt-suburbs', start: new THREE.Vector3(60, 0.05, 30), end: new THREE.Vector3(450, 0.05, 370),
      width: 10, color: '#1a1a1a'
    },
    // Rue principale downtown (E-W)
    {
      id: 'main-ew', start: new THREE.Vector3(-55, 0.05, 0), end: new THREE.Vector3(55, 0.05, 0),
      width: 12, color: '#333333'
    },
    // Rue principale downtown (N-S)
    {
      id: 'main-ns', start: new THREE.Vector3(0, 0.05, -55), end: new THREE.Vector3(0, 0.05, 55),
      width: 10, color: '#333333'
    },
    // Village Nord interne
    {
      id: 'nord-internal', start: new THREE.Vector3(-200, 0.05, -300), end: new THREE.Vector3(-100, 0.05, -300),
      width: 7, color: '#2a2a2a'
    },
    // Village Est interne
    {
      id: 'est-internal', start: new THREE.Vector3(330, 0.05, -80), end: new THREE.Vector3(430, 0.05, 80),
      width: 7, color: '#2a2a2a'
    },
    // Village Ouest interne
    {
      id: 'ouest-internal', start: new THREE.Vector3(-400, 0.05, 250), end: new THREE.Vector3(-300, 0.05, 250),
      width: 7, color: '#2a2a2a'
    },
  ], [])

  return (
    <group>
      {routes.map((route) => {
        const dir = new THREE.Vector3().subVectors(route.end, route.start)
        const length = dir.length()
        const mid = new THREE.Vector3().addVectors(route.start, route.end).multiplyScalar(0.5)
        const angle = Math.atan2(dir.x, dir.z)

        return (
          <group key={route.id}>
            {/* Surface route */}
            <mesh
              position={[mid.x, mid.y, mid.z]}
              rotation={[0, angle, 0]}
              receiveShadow
            >
              <planeGeometry args={[route.width, length]} />
              <meshStandardMaterial color={route.color} roughness={0.95} />
            </mesh>
            {/* Ligne centrale */}
            <mesh
              position={[mid.x, mid.y + 0.01, mid.z]}
              rotation={[0, angle, 0]}
            >
              <planeGeometry args={[0.3, length * 0.85]} />
              <meshStandardMaterial color="#ffff00" roughness={1} />
            </mesh>
          </group>
        )
      })}

      {/* Lampadaires le long des routes principales */}
      {[
        [-30, 0, 0], [0, 0, 0], [30, 0, 0],
        [0, 0, -30], [0, 0, 30],
        [-75, 0, -75], [-112, 0, -150], [-130, 0, -215],
        [120, 0, 0], [200, 0, 0], [280, 0, 0],
      ].map(([x, , z], i) => (
        <group key={`lamp-${i}`} position={[x, 0, z]}>
          {/* Poteau */}
          <mesh position={[8, 3, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 6, 8]} />
            <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Luminaire */}
          <mesh position={[8, 6.1, 0]}>
            <boxGeometry args={[1.2, 0.3, 0.5]} />
            <meshStandardMaterial color="#ffffaa" emissive="#ffff88" emissiveIntensity={1} />
          </mesh>
          {/* Lumière point */}
          <pointLight position={[8, 5.5, 0]} intensity={0.8} distance={20} color="#ffffcc" />
        </group>
      ))}
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// BÂTIMENT — Rendu individuel avec matériaux configs
// ────────────────────────────────────────────────────────────────────────────

interface BuildingMeshProps {
  id: string
  name: string
  model: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  isNight: boolean
  key?: React.Key
}

function BuildingMesh({ id, name, model, position, rotation, scale, isNight }: BuildingMeshProps) {
  const color = getBuildingColor(model)
  const height = getBuildingHeight(model) * (scale[1] || 1)
  const [w, d] = getBuildingDims(model)
  const sw = w * (scale[0] || 1)
  const sd = d * (scale[2] || 1)

  // Couleur fenêtres selon heure
  const windowColor = isNight ? '#ffeecc' : '#87ceeb'
  const windowEmissive = isNight ? '#ffcc66' : '#000000'
  const windowEmissiveIntensity = isNight ? 0.6 : 0

  // Modèle hôtel plus complexe
  if (model === 'hotel-120-rooms') {
    return (
      <group position={position} rotation={rotation}>
        {/* Corps principal */}
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[sw, height, sd]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
        </mesh>
        {/* Étage penthouse (plus petit) */}
        <mesh position={[0, height + 3, 0]} castShadow>
          <boxGeometry args={[sw * 0.6, 5, sd * 0.6]} />
          <meshStandardMaterial color={POLY_MATERIALS.penthouseLuxe.color} roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Fenêtres - rangées */}
        {Array.from({ length: Math.floor(height / 3.5) }, (_, floor) =>
          Array.from({ length: 5 }, (_, col) => (
            <mesh
              key={`win-${floor}-${col}`}
              position={[-sw / 2 - 0.05, 1.5 + floor * 3.5, -sd / 2 + 2 + col * (sd / 5)]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[1.2, 1.5]} />
              <meshStandardMaterial
                color={windowColor}
                emissive={windowEmissive}
                emissiveIntensity={isNight ? Math.random() > 0.3 ? 0.6 : 0 : 0}
                roughness={0.1}
                metalness={0.5}
                transparent
                opacity={0.85}
              />
            </mesh>
          ))
        )}
        {/* Enseigne hôtel */}
        <Html position={[0, height + 1, -sd / 2 - 0.5]} center>
          <div style={{
            color: '#00ddff', fontFamily: 'monospace', fontSize: '13px',
            background: 'rgba(0,0,0,0.7)', padding: '4px 10px',
            border: '1px solid #00ddff', borderRadius: '4px',
            pointerEvents: 'none', whiteSpace: 'nowrap',
            textShadow: '0 0 8px #00ddff',
          }}>
            🏨 EtherWorld Grand Hotel
          </div>
        </Html>
      </group>
    )
  }

  // Maisons résidentielles
  if (model.includes('residential') || model === 'residential-cottage') {
    return (
      <group position={position} rotation={rotation}>
        {/* Corps */}
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[sw, height, sd]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* Toit triangulaire */}
        <mesh position={[0, height + 1.2, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[Math.max(sw, sd) * 0.75, 2.5, 4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        {/* Fenêtres */}
        <mesh position={[sw / 2 + 0.05, height * 0.6, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.2, 1.2]} />
          <meshStandardMaterial
            color={windowColor} emissive={windowEmissive}
            emissiveIntensity={windowEmissiveIntensity} roughness={0.1} metalness={0.4}
            transparent opacity={0.9}
          />
        </mesh>
        {/* Porte */}
        <mesh position={[0, 1, -sd / 2 - 0.05]}>
          <planeGeometry args={[1, 2]} />
          <meshStandardMaterial color="#4a2800" roughness={0.8} />
        </mesh>
      </group>
    )
  }

  // Parc
  if (model === 'park-area') {
    return (
      <group position={position}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
          <planeGeometry args={[sw * 2, sd * 2]} />
          <meshStandardMaterial color="#228B22" roughness={1} />
        </mesh>
        {/* Bancs */}
        {[[-5, 0, 0], [5, 0, 0], [0, 0, -5], [0, 0, 5]].map(([bx, , bz], i) => (
          <mesh key={`bench-${i}`} position={[bx, 0.4, bz]} castShadow>
            <boxGeometry args={[2, 0.15, 0.5]} />
            <meshStandardMaterial color="#8B5A2B" roughness={0.9} />
          </mesh>
        ))}
        {/* Arbres */}
        {[[-8, 0, -8], [8, 0, -8], [-8, 0, 8], [8, 0, 8], [0, 0, 0]].map(([tx, , tz], i) => (
          <group key={`tree-${i}`} position={[tx, 0, tz]}>
            <mesh position={[0, 1.5, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.3, 3, 8]} />
              <meshStandardMaterial color="#4a3000" roughness={1} />
            </mesh>
            <mesh position={[0, 4, 0]} castShadow>
              <coneGeometry args={[2, 4, 8]} />
              <meshStandardMaterial color="#1a6b1a" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  // Hôtel de ville / Bâtiment commercial
  if (model === 'town-hall' || model === 'commercial-store') {
    return (
      <group position={position} rotation={rotation}>
        {/* Corps principal */}
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[sw, height, sd]} />
          <meshStandardMaterial
            color={model === 'town-hall' ? '#b8a070' : POLY_MATERIALS.commercialSteel.color}
            roughness={model === 'town-hall' ? 0.8 : 0.5}
            metalness={model === 'town-hall' ? 0 : 0.4}
          />
        </mesh>
        {/* Colonnes */}
        {[-sw * 0.3, 0, sw * 0.3].map((cx, i) => (
          <mesh key={`col-${i}`} position={[cx, height / 2, -sd / 2]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, height, 8]} />
            <meshStandardMaterial color="#ccbbaa" roughness={0.6} />
          </mesh>
        ))}
        {/* Label */}
        <Html position={[0, height + 0.5, 0]} center>
          <div style={{
            color: '#ffcc00', fontFamily: 'monospace', fontSize: '11px',
            background: 'rgba(0,0,0,0.6)', padding: '2px 6px',
            borderRadius: '3px', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            {model === 'town-hall' ? '🏛️ Town Hall' : '🏪 Commerce'}
          </div>
        </Html>
      </group>
    )
  }

  // Dépanneur
  if (model === 'convenience-store') {
    return (
      <group position={position} rotation={rotation}>
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[sw, height, sd]} />
          <meshStandardMaterial color={POLY_MATERIALS.residentialBrick.color} roughness={0.8} />
        </mesh>
        {/* Enseigne néon */}
        <mesh position={[0, height + 0.3, -sd / 2 - 0.1]}>
          <boxGeometry args={[sw * 0.8, 0.6, 0.1]} />
          <meshStandardMaterial color="#ff3300" emissive="#ff2200" emissiveIntensity={1.5} />
        </mesh>
        <Html position={[0, height + 0.6, -sd / 2 - 0.2]} center>
          <div style={{
            color: '#ff4444', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold',
            textShadow: '0 0 6px #ff0000', pointerEvents: 'none',
          }}>
            🛒 DÉPANNEUR
          </div>
        </Html>
      </group>
    )
  }

  // Défaut générique
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sw, height, sd]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// VILLE COMPLÈTE — Charge et rend TOUS les bâtiments des 5 zones
// ────────────────────────────────────────────────────────────────────────────

function CityRenderer() {
  const timeOfDay = useGameStore((s) => s.timeOfDay)
  const isNight = timeOfDay < 5.5 || timeOfDay > 20.5

  // Tous les bâtiments fusionnés des 5 zones
  const allBuildings = useMemo(() => {
    const downtown = [HOTEL_MAIN, PENTHOUSE_DELUXE, DEPANNEUR_DOWNTOWN, ATM_BUILDING]
    const nord = VILLAGE_NORD
    const est = VILLAGE_EST
    const ouest = VILLAGE_OUEST

    // Bâtiments Suburbs (générés depuis city-layout)
    const suburbs = [
      {
        id: 'warehouse-01', type: 'building' as const, name: 'Entrepôt 1',
        model: 'commercial-store', position: [480, 0, 380] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number], scale: [3, 1.5, 4] as [number, number, number], rooms: [],
      },
      {
        id: 'warehouse-02', type: 'building' as const, name: 'Entrepôt 2',
        model: 'commercial-store', position: [520, 0, 380] as [number, number, number],
        rotation: [0, Math.PI / 6, 0] as [number, number, number], scale: [4, 2, 3] as [number, number, number], rooms: [],
      },
      {
        id: 'factory-01', type: 'building' as const, name: 'Usine',
        model: 'town-hall', position: [500, 0, 430] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number], scale: [4, 3, 3] as [number, number, number], rooms: [],
      },
    ]

    return [...downtown, ...nord, ...est, ...ouest, ...suburbs]
  }, [])

  // Placed objects from store
  const placedObjects = useGameStore((s) => s.placedObjects)
  const selectObject = useGameStore((s) => s.selectObject)

  return (
    <group>
      {/* ── Bâtiments ville ── */}
      {allBuildings.map((b) => (
        <BuildingMesh
          key={b.id}
          id={b.id}
          name={b.name}
          model={b.model}
          position={b.position as [number, number, number]}
          rotation={(b.rotation || [0, 0, 0]) as [number, number, number]}
          scale={(b.scale || [1, 1, 1]) as [number, number, number]}
          isNight={isNight}
        />
      ))}

      {/* ── Objets placés par les joueurs ── */}
      {placedObjects.map((obj) => (
        <mesh
          key={obj.id}
          position={obj.position}
          rotation={[0, obj.rotation, 0]}
          scale={[obj.scale, obj.scale, obj.scale]}
          onClick={() => selectObject(obj.id)}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={obj.color || '#4a90e2'} />
        </mesh>
      ))}

      {/* ── Labels de zone ── */}
      <Html position={[0, 30, 0]} center>
        <div style={{
          color: '#00ddff', fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold',
          textShadow: '0 0 10px #00ddff', pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          ✦ DOWNTOWN
        </div>
      </Html>
      <Html position={[-150, 15, -300]} center>
        <div style={{
          color: '#88ff88', fontFamily: 'monospace', fontSize: '13px',
          textShadow: '0 0 8px #00ff00', pointerEvents: 'none',
        }}>
          🏘️ Village Nord
        </div>
      </Html>
      <Html position={[380, 15, 0]} center>
        <div style={{
          color: '#ffaa44', fontFamily: 'monospace', fontSize: '13px',
          textShadow: '0 0 8px #ff8800', pointerEvents: 'none',
        }}>
          🏘️ Village Est
        </div>
      </Html>
      <Html position={[-350, 15, 250]} center>
        <div style={{
          color: '#ff88cc', fontFamily: 'monospace', fontSize: '13px',
          textShadow: '0 0 8px #ff00aa', pointerEvents: 'none',
        }}>
          🏘️ Village Ouest
        </div>
      </Html>
      <Html position={[500, 15, 400]} center>
        <div style={{
          color: '#aaaaaa', fontFamily: 'monospace', fontSize: '13px',
          textShadow: '0 0 6px #888888', pointerEvents: 'none',
        }}>
          🏭 Zone Industrielle
        </div>
      </Html>
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// JOUEUR — Mouvement WASD + camera GTA
// ────────────────────────────────────────────────────────────────────────────

function PlayerSystem() {
  const playerPos = useGameStore((s) => s.playerPos)
  const flyMode = useGameStore((s) => s.flyMode)
  const flySpeed = useGameStore((s) => s.flySpeed)
  const buildMode = useGameStore((s) => s.buildMode)
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition)
  const { camera } = useThree()

  const keys = useRef<Record<string, boolean>>({})
  const cameraAngle = useRef(0)
  const cameraPitch = useRef(0.3)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true }
    const onUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (buildMode) return
    const speed = (flyMode ? flySpeed * 60 : 8) * delta
    const k = keys.current
    const pos = [...playerPos] as [number, number, number]

    // Rotation caméra avec Q/E
    if (k['q']) cameraAngle.current += delta * 1.5
    if (k['e']) cameraAngle.current -= delta * 1.5

    // Mouvement joueur relatif à la caméra
    const fwd = new THREE.Vector3(
      -Math.sin(cameraAngle.current), 0, -Math.cos(cameraAngle.current)
    )
    const right = new THREE.Vector3(
      Math.cos(cameraAngle.current), 0, -Math.sin(cameraAngle.current)
    )

    if (k['w'] || k['arrowup']) {
      pos[0] += fwd.x * speed
      pos[2] += fwd.z * speed
    }
    if (k['s'] || k['arrowdown']) {
      pos[0] -= fwd.x * speed
      pos[2] -= fwd.z * speed
    }
    if (k['a'] || k['arrowleft']) {
      pos[0] -= right.x * speed
      pos[2] -= right.z * speed
    }
    if (k['d'] || k['arrowright']) {
      pos[0] += right.x * speed
      pos[2] += right.z * speed
    }
    if (flyMode) {
      if (k[' ']) pos[1] += speed
      if (k['shift']) pos[1] = Math.max(0.5, pos[1] - speed)
    }

    setPlayerPosition(pos)

    // Camera GTA-style (derrière et au-dessus du joueur)
    const camDist = flyMode ? 20 : 12
    const camHeight = flyMode ? 8 : 6
    const camTarget = new THREE.Vector3(
      pos[0] - Math.sin(cameraAngle.current) * camDist,
      pos[1] + camHeight,
      pos[2] - Math.cos(cameraAngle.current) * camDist
    )
    camera.position.lerp(camTarget, 0.08)
    camera.lookAt(pos[0], pos[1] + 1.5, pos[2])
  })

  return (
    <group position={playerPos}>
      {/* Corps du joueur */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 1.8, 12]} />
        <meshStandardMaterial color="#4488ff" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Tête */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#ffcc99" roughness={0.8} />
      </mesh>
      {/* Lumière point autour du joueur */}
      <pointLight intensity={0.5} distance={8} color="#88aaff" />
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// GHOST BUILDER — Preview d'objet à placer
// ────────────────────────────────────────────────────────────────────────────

function BuilderGhost() {
  const buildMode = useGameStore((s) => s.buildMode)
  const selectedModelType = useGameStore((s) => s.selectedModelType)
  const ghostPosition = useGameStore((s) => s.ghostPosition)
  const ghostRotation = useGameStore((s) => s.ghostRotation)
  const ghostScale = useGameStore((s) => s.ghostScale)
  const setGhostPosition = useGameStore((s) => s.setGhostPosition)
  const placeObject = useGameStore((s) => s.placeObject)
  const { camera } = useThree()

  const groundRef = useRef<THREE.Mesh>(null)
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!buildMode || !groundRef.current) return
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    raycaster.current.setFromCamera(mouse.current, camera)
    const hits = raycaster.current.intersectObject(groundRef.current)
    if (hits.length > 0) {
      const p = hits[0].point
      setGhostPosition([Math.round(p.x), 0.5, Math.round(p.z)])
    }
  }, [buildMode, camera, setGhostPosition])

  const handleClick = useCallback((e: MouseEvent) => {
    if (!buildMode || !selectedModelType || !ghostPosition) return
    if (e.target instanceof HTMLElement && e.target.closest('.ui-panel')) return
    placeObject({
      modelType: selectedModelType,
      position: ghostPosition,
      rotation: ghostRotation,
      scale: ghostScale,
      color: '#4a90e2',
      category: 'formes',
    })
  }, [buildMode, selectedModelType, ghostPosition, ghostRotation, ghostScale, placeObject])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [handleMouseMove, handleClick])

  return (
    <>
      {/* Ground invisible pour le raycasting */}
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {/* Grille builder */}
      {buildMode && <gridHelper args={[1000, 100, 0x444444, 0x333333]} />}

      {/* Ghost preview */}
      {buildMode && selectedModelType && ghostPosition && (
        <mesh
          position={ghostPosition}
          rotation={[0, ghostRotation, 0]}
          scale={[ghostScale, ghostScale, ghostScale]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#00ff88" transparent opacity={0.5} wireframe />
        </mesh>
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// HUD — Interface utilisateur en overlay
// ────────────────────────────────────────────────────────────────────────────

function GameUI() {
  const {
    playerPos, playerData, timeOfDay, weather, buildMode,
    godMode, flyMode, showHUD, showAdmin, chatOpen,
    chatMessages, adminEffects, placedObjects, buildings,
    sessionActive, addChatMessage, toggleBuildMode, toggleGodMode,
    toggleFlyMode, toggleChat, toggleDayNightCycle, setWeather,
    setTimeOfDay, toggleUI, dayNightCycleEnabled,
  } = useGameStore()

  const [chatInput, setChatInput] = React.useState('')
  const [tab, setTab] = React.useState<'main' | 'admin' | 'world'>('main')

  if (!sessionActive || !showHUD) return null

  const timeStr = formatTime(timeOfDay)
  const zone = (() => {
    const [x, , z] = playerPos
    if (Math.abs(x) < 70 && Math.abs(z) < 70) return '📍 Downtown'
    if (x < -100 && z < -200) return '📍 Village Nord'
    if (x > 250 && Math.abs(z) < 120) return '📍 Village Est'
    if (x < -250 && z > 150) return '📍 Village Ouest'
    if (x > 400 && z > 300) return '📍 Zone Industrielle'
    return '📍 Route'
  })()

  const handleChat = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && chatInput.trim()) {
      addChatMessage(playerData.name, chatInput.trim(), 'chat')
      setChatInput('')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', fontFamily: "'Courier New', monospace", userSelect: 'none' }}>

      {/* ─── TOP BAR ─── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
        padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ color: '#00ddff', fontSize: '16px', fontWeight: 'bold', textShadow: '0 0 10px #00ddff' }}>
            💎 ETHERWORLD
          </span>
          <span style={{ color: '#aaaaaa', fontSize: '12px' }}>v5.0 OFFICIAL</span>
          <span style={{ color: '#ffff00', fontSize: '12px' }}>⏱ {timeStr}</span>
          <span style={{ color: '#88ff88', fontSize: '12px' }}>{zone}</span>
          <span style={{ color: '#ff9944', fontSize: '12px' }}>
            {weather === 'clear' ? '☀️ Dégagé' : weather === 'rain' ? '🌧️ Pluie' : weather === 'snow' ? '❄️ Neige' : '🌫️ Brouillard'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          {buildMode && <span style={{ color: '#44ff44', textShadow: '0 0 6px #00ff00' }}>🔨 BUILDER ON</span>}
          {godMode && <span style={{ color: '#ff4444', textShadow: '0 0 6px #ff0000' }}>🛡️ GOD ON</span>}
          {flyMode && <span style={{ color: '#4488ff', textShadow: '0 0 6px #0088ff' }}>🪰 FLY ON</span>}
          {dayNightCycleEnabled && <span style={{ color: '#ffcc44' }}>🌙 CYCLE ON</span>}
          <span style={{ color: '#888' }}>Objets: {placedObjects.length}</span>
        </div>
      </div>

      {/* ─── STATS JOUEUR (bas-gauche) ─── */}
      <div style={{
        position: 'absolute', bottom: '80px', left: '20px',
        background: 'rgba(0,0,0,0.75)', border: '1px solid #334455',
        borderRadius: '8px', padding: '12px 16px', minWidth: '180px',
      }}>
        <div style={{ color: '#00ddff', marginBottom: '8px', fontSize: '12px', borderBottom: '1px solid #334455', paddingBottom: '4px' }}>
          👤 {playerData.name}
        </div>
        {[
          { label: '❤️ Santé', val: playerData.stats.health, color: '#ff4444' },
          { label: '🍔 Faim', val: playerData.stats.hunger, color: '#ff8800' },
          { label: '💧 Soif', val: playerData.stats.thirst, color: '#4488ff' },
          { label: '⚡ Énergie', val: playerData.stats.energy, color: '#ffff44' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ marginBottom: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: '11px', marginBottom: '2px' }}>
              <span>{label}</span><span>{val}/100</span>
            </div>
            <div style={{ height: '4px', background: '#333', borderRadius: '2px' }}>
              <div style={{ width: `${val}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: '8px', borderTop: '1px solid #334455', paddingTop: '6px', color: '#ffcc44', fontSize: '11px' }}>
          💰 ${playerData.money.toLocaleString()}
        </div>
        <div style={{ color: '#888', fontSize: '10px', marginTop: '4px' }}>
          Lv.{playerData.stats.level} — {playerData.stats.experience} XP
        </div>
        <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
          [{Math.round(playerPos[0])}, {Math.round(playerPos[1])}, {Math.round(playerPos[2])}]
        </div>
      </div>

      {/* ─── CHAT ─── */}
      {chatOpen && (
        <div style={{
          position: 'absolute', bottom: '80px', right: '20px',
          width: '320px', background: 'rgba(0,0,0,0.8)',
          border: '1px solid #00ddff44', borderRadius: '8px', overflow: 'hidden',
          pointerEvents: 'auto',
        }} className="ui-panel">
          <div style={{ padding: '6px 12px', borderBottom: '1px solid #334455', color: '#00ddff', fontSize: '12px' }}>
            💬 Chat Global
          </div>
          <div style={{ height: '180px', overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {chatMessages.slice(-30).map((msg) => (
              <div key={msg.id} style={{ fontSize: '11px' }}>
                <span style={{ color: msg.type === 'system' ? '#ffcc44' : msg.type === 'admin' ? '#ff4444' : '#00ddff' }}>
                  {msg.sender}:
                </span>
                <span style={{ color: '#dddddd', marginLeft: '6px' }}>{msg.text}</span>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChat}
            placeholder="Entrez un message..."
            style={{
              width: '100%', background: '#111', border: 'none',
              borderTop: '1px solid #334455', color: '#fff', padding: '8px 12px',
              fontSize: '12px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* ─── PANEL CONTRÔLES (bas-centre) ─── */}
      <div style={{
        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '8px', pointerEvents: 'auto',
      }} className="ui-panel">
        {[
          { label: '🔨 Builder', action: () => toggleBuildMode(), active: buildMode, color: '#00ff88' },
          { label: '🛡️ God', action: () => toggleGodMode(), active: godMode, color: '#ff4444' },
          { label: '🪰 Vol', action: () => toggleFlyMode(), active: flyMode, color: '#4488ff' },
          { label: '🌙 Cycle', action: () => toggleDayNightCycle(), active: dayNightCycleEnabled, color: '#ffcc44' },
          { label: '💬 Chat', action: () => toggleChat(), active: chatOpen, color: '#00ddff' },
        ].map(({ label, action, active, color }) => (
          <button
            key={label}
            onClick={action}
            style={{
              padding: '8px 14px', fontSize: '12px', cursor: 'pointer',
              background: active ? `${color}22` : 'rgba(0,0,0,0.7)',
              border: `1px solid ${active ? color : '#445566'}`,
              color: active ? color : '#888888',
              borderRadius: '6px', transition: 'all 0.2s',
              textShadow: active ? `0 0 8px ${color}` : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── RACCOURCIS (bas-droite) ─── */}
      <div style={{
        position: 'absolute', bottom: '20px', right: '20px',
        color: '#446677', fontSize: '10px', lineHeight: '1.8',
        textAlign: 'right',
      }}>
        <div>WASD / ↑↓←→ — Déplacer</div>
        <div>Q/E — Tourner caméra</div>
        <div>ESPACE — Monter (vol)</div>
        <div>SHIFT — Descendre (vol)</div>
      </div>

      {/* ─── MINI-MAP (haut-droit) ─── */}
      <div style={{
        position: 'absolute', top: '60px', right: '20px',
        width: '160px', height: '160px',
        background: 'rgba(0,0,0,0.8)', border: '1px solid #334455',
        borderRadius: '8px', overflow: 'hidden',
      }}>
        <svg width="160" height="160" style={{ position: 'absolute' }}>
          {/* Downtown */}
          <rect x="70" y="70" width="20" height="20" fill="#333333" />
          {/* Hotel */}
          <rect x="78" y="78" width="6" height="5" fill="#d4a574" />
          {/* Village Nord */}
          <rect x="30" y="10" width="25" height="25" fill="#2a2a2a" />
          {/* Village Est */}
          <rect x="120" y="60" width="30" height="45" fill="#2a2a2a" />
          {/* Village Ouest */}
          <rect x="5" y="90" width="30" height="45" fill="#2a2a2a" />
          {/* Suburbs */}
          <rect x="130" y="110" width="25" height="25" fill="#1a1a1a" />
          {/* Routes */}
          <line x1="80" y1="70" x2="42" y2="22" stroke="#555" strokeWidth="1.5" />
          <line x1="90" y1="80" x2="120" y2="80" stroke="#555" strokeWidth="1.5" />
          <line x1="70" y1="85" x2="35" y2="105" stroke="#555" strokeWidth="1.5" />
          <line x1="90" y1="90" x2="130" y2="120" stroke="#555" strokeWidth="1.5" />
          {/* Joueur */}
          <circle
            cx={80 + (playerPos[0] / 800) * 160}
            cy={80 + (playerPos[2] / 800) * 160}
            r="3"
            fill="#00ddff"
          />
        </svg>
        <div style={{
          position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
          color: '#446677', fontSize: '9px',
        }}>
          MINI-MAP
        </div>
      </div>

    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// ÉCRAN DE CONNEXION
// ────────────────────────────────────────────────────────────────────────────

function LoginScreen() {
  const setSessionActive = useGameStore((s) => s.setSessionActive)
  const addChatMessage = useGameStore((s) => s.addChatMessage)
  const [name, setName] = React.useState('Joueur_' + Math.floor(Math.random() * 9999))

  const handleEnter = () => {
    addChatMessage('Système', `✅ ${name} a rejoint EtherWorld !`, 'system')
    setSessionActive(true)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #020710 100%)',
      zIndex: 100, fontFamily: "'Courier New', monospace",
    }}>
      {/* Particules d'arrière-plan */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            borderRadius: '50%',
            background: `hsl(${180 + Math.random() * 60}, 100%, 70%)`,
            opacity: 0.3 + Math.random() * 0.5,
            animation: `pulse ${2 + Math.random() * 3}s infinite alternate`,
          }} />
        ))}
      </div>

      <div style={{
        textAlign: 'center', maxWidth: '480px', width: '90%',
        background: 'rgba(0,10,30,0.9)', border: '1px solid #00ddff44',
        borderRadius: '16px', padding: '48px 40px',
        boxShadow: '0 0 60px rgba(0,150,255,0.15), inset 0 0 40px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '8px', fontSize: '48px' }}>💎</div>
        <h1 style={{
          fontSize: '42px', fontWeight: 'bold', margin: '0 0 8px',
          background: 'linear-gradient(to right, #00ddff, #0088ff, #8844ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          EtherWorld
        </h1>
        <p style={{ color: '#00ddff', fontSize: '12px', marginBottom: '8px', letterSpacing: '3px' }}>
          v5.0 OFFICIAL — COMPLETE FUSION
        </p>
        <p style={{ color: '#446677', fontSize: '11px', marginBottom: '32px' }}>
          5 zones · 80+ bâtiments · Multiplayer RP
        </p>

        {/* Stats du monde */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px', marginBottom: '32px',
          padding: '16px', background: 'rgba(0,20,50,0.5)',
          borderRadius: '8px', border: '1px solid #112233',
        }}>
          {[
            { label: 'Zones', value: '5' },
            { label: 'Bâtiments', value: '80+' },
            { label: 'Objets', value: '150+' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ color: '#00ddff', fontSize: '20px', fontWeight: 'bold' }}>{value}</div>
              <div style={{ color: '#446677', fontSize: '10px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Champ nom */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom de joueur..."
          style={{
            width: '100%', padding: '12px 16px', marginBottom: '16px',
            background: 'rgba(0,20,50,0.8)', border: '1px solid #00ddff44',
            borderRadius: '8px', color: '#ffffff', fontSize: '14px',
            outline: 'none', boxSizing: 'border-box', textAlign: 'center',
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleEnter()}
        />

        <button
          onClick={handleEnter}
          style={{
            width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold',
            background: 'linear-gradient(to right, #0066cc, #0044aa)',
            border: '1px solid #00ddff', color: '#ffffff', borderRadius: '8px',
            cursor: 'pointer', letterSpacing: '1px',
            boxShadow: '0 0 20px rgba(0,100,255,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 30px rgba(0,150,255,0.6)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 20px rgba(0,100,255,0.3)')}
        >
          🚀 ENTRER DANS ETHERWORLD
        </button>

        <p style={{ color: '#334455', fontSize: '10px', marginTop: '20px' }}>
          Fusionne 7 projets · 54K+ lignes · Production Ready
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.2; transform: scale(0.8); }
          to { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// CHARGEMENT DU MONDE — Injecte toutes les données dans le store au démarrage
// ────────────────────────────────────────────────────────────────────────────

function WorldLoader() {
  const addBuilding = useGameStore((s) => s.addBuilding)
  const addRoad = useGameStore((s) => s.addRoad)
  const addNPC = useGameStore((s) => s.addNPC)
  const addChatMessage = useGameStore((s) => s.addChatMessage)
  const buildings = useGameStore((s) => s.buildings)

  useEffect(() => {
    if (buildings.length > 0) return // Déjà chargé

    // Charger les bâtiments downtown
    ;[HOTEL_MAIN, PENTHOUSE_DELUXE, DEPANNEUR_DOWNTOWN, ATM_BUILDING].forEach((b) => {
      addBuilding({
        id: b.id,
        name: b.name,
        type: b.model === 'hotel-120-rooms' ? 'hotel' : b.model.includes('convenience') ? 'shop' : 'shop',
        position: b.position as [number, number, number],
      })
    })

    // Villages
    ;[...VILLAGE_NORD, ...VILLAGE_EST, ...VILLAGE_OUEST].forEach((b) => {
      addBuilding({
        id: b.id,
        name: b.name,
        type: 'house',
        position: b.position as [number, number, number],
      })
    })

    // Routes
    ROADS.forEach((r) => {
      addRoad({
        id: r.id,
        name: r.id,
        startPos: r.startPos as [number, number, number],
        endPos: r.endPos as [number, number, number],
        width: r.width,
        type: r.id.includes('highway') ? 'highway' : r.id.includes('rural') ? 'rural' : 'street',
      })
    })

    // NPCs
    ;[
      { id: 'npc-hotel-receptionist', name: 'Réceptionniste', position: [2, 1, -3] as [number, number, number], role: 'staff' as const, dialogue: 'Bienvenue au Grand Hotel!' },
      { id: 'npc-depanneur-cashier-dt', name: 'Caissier Downtown', position: [-20, 1, 10] as [number, number, number], role: 'vendor' as const, dialogue: 'Bonjour! Que puis-je faire pour vous?' },
      { id: 'npc-resident-nord-1', name: 'Marie Nord', position: [-150, 1, -295] as [number, number, number], role: 'resident' as const, dialogue: 'Je vis ici depuis longtemps...' },
      { id: 'npc-shopkeeper-est', name: 'Marc Est', position: [380, 1, 15] as [number, number, number], role: 'vendor' as const, dialogue: 'Bienvenus dans notre centre commercial!' },
    ].forEach((npc) => addNPC(npc))

    addChatMessage('Système', '🌆 Monde chargé: 5 zones, 80+ bâtiments, 4 routes principales', 'system')
    addChatMessage('Système', '💡 WASD pour se déplacer · Q/E pour tourner la caméra · B pour Builder Mode', 'system')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

// ────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────

export default function EtherWorldOfficial() {
  const sessionActive = useGameStore((s) => s.sessionActive)

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Écran de connexion */}
      {!sessionActive && <LoginScreen />}

      {/* Canvas 3D principal */}
      <Canvas
        camera={{ position: [0, 8, 20], fov: 65, near: 0.1, far: 2000 }}
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        {/* Chargement des données monde dans le store */}
        <WorldLoader />

        {/* Environnement : ciel, lumières, météo */}
        <EnvironmentSystem />

        {/* Terrain et sols */}
        <CityTerrain />

        {/* Réseau routier complet */}
        <RoadNetwork />

        {/* Tous les bâtiments des 5 zones */}
        <CityRenderer />

        {/* Joueur + contrôles + camera GTA */}
        {sessionActive && <PlayerSystem />}

        {/* Ghost preview en mode builder */}
        <BuilderGhost />

        {/* Intégration du GameWorld pour gérer le rendu des objets placés et la grille du builder */}
        {sessionActive && <GameWorld standalone={false} />}

        {/* Intégration des effets spéciaux de modération admin (jail, freeze, tp, explosions, etc) */}
        {sessionActive && <AdminEffects />}
      </Canvas>

      {/* HUD overlay principal */}
      <GameUI />

      {/* HUD alternatif du dossier components */}
      {sessionActive && <GameHUD />}
    </div>
  )
}
