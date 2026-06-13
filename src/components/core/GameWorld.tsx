import React, { useRef, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/game-store-unified'

/**
 * GAME WORLD - Composant principal unifié
 * Fusionne toutes les versions précédentes
 * 
 * Features:
 * - GTA-style camera with smooth follow
 * - Raycasting for object selection
 * - Builder ghost preview
 * - Terrain/ground rendering
 * - Dynamic lighting
 */

export function GameWorld({ standalone = true }: { standalone?: boolean }) {
  const { camera } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  
  // Store
  const builderMode = useGameStore((s) => s.buildMode)
  const selectedModelType = useGameStore((s) => s.selectedModelType)
  const placedObjects = useGameStore((s) => s.placedObjects)
  const playerPos = useGameStore((s) => s.playerPos)
  const ghostPosition = useGameStore((s) => s.ghostPosition)
  const ghostScale = useGameStore((s) => s.ghostScale)
  const ghostRotation = useGameStore((s) => s.ghostRotation)
  
  const setGhostPosition = useGameStore((s) => s.setGhostPosition)
  const selectObject = useGameStore((s) => s.selectObject)
  const placeObject = useGameStore((s) => s.placeObject)
  
  // Ground ref for raycasting
  const groundRef = useRef<THREE.Mesh>(null)
  const gridRef = useRef<THREE.GridHelper>(null)
  
  // Camera follow player (GTA-style)
  useFrame(() => {
    if (standalone && !builderMode && groundRef.current) {
      // Smooth camera follow
      const targetPos = new THREE.Vector3(
        playerPos[0],
        playerPos[1] + 3,
        playerPos[2] + 8
      )
      
      camera.position.lerp(targetPos, 0.1)
      camera.lookAt(
        playerPos[0],
        playerPos[1] + 1,
        playerPos[2]
      )
    }
  })
  
  // Mouse move for builder ghost
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!builderMode || !groundRef.current) return
    
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    
    raycaster.current.setFromCamera(mouse.current, camera)
    const intersects = raycaster.current.intersectObject(groundRef.current)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      setGhostPosition([point.x, point.y, point.z])
    }
  }, [builderMode, camera, setGhostPosition])
  
  // Click to select/place
  const handleClick = useCallback((e: MouseEvent) => {
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    
    raycaster.current.setFromCamera(mouse.current, camera)
    
    if (builderMode && selectedModelType) {
      // Place object
      placeObject({
        modelType: selectedModelType,
        position: ghostPosition || [0, 0, 0],
        rotation: ghostRotation,
        scale: ghostScale,
        color: '#4a90e2',
        category: 'structures',
      })
    }
  }, [builderMode, selectedModelType, ghostPosition, ghostRotation, ghostScale, camera, placeObject])
  
  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [handleMouseMove, handleClick])
  
  return (
    <>
      {/* Orbit Controls for non-builder mode */}
      {standalone && !builderMode && <OrbitControls />}
      
      {/* Ground - invisible for raycasting */}
      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        userData={{ raycast: true }}
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      
      {/* Grid visualization */}
      {builderMode && (
        <gridHelper ref={gridRef} args={[500, 50, 0x444444, 0x888888]} />
      )}
      
      {/* Ambient light */}
      {standalone && <ambientLight intensity={0.5} color="#ffffff" />}
      
      {/* Sun */}
      {standalone && (
        <directionalLight
          position={[50, 50, 50]}
          intensity={1}
          color="#ffffcc"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
      )}
      
      {/* Placed objects */}
      {placedObjects.map((obj) => (
        <mesh
          key={obj.id}
          position={obj.position}
          rotation={[0, obj.rotation, 0]}
          scale={[obj.scale, obj.scale, obj.scale]}
          onClick={() => selectObject(obj.id)}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={obj.color || "#4a90e2"} />
        </mesh>
      ))}
      
      {/* Ghost preview in builder mode */}
      {builderMode && selectedModelType && (
        <mesh
          position={ghostPosition || [0, 0, 0]}
          rotation={[0, ghostRotation, 0]}
          scale={[ghostScale, ghostScale, ghostScale]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#00ff00"
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>
      )}
      
      {/* Player indicator */}
      {standalone && (
        <mesh position={playerPos}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
      )}
    </>
  )
}
