'use client'

import React, { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { useStore } from '../lib/etherworld/game-store'
import * as FurnitureModels from './furniture'

// Un dictionnaire des composants React correspondants
const ModelComponents: Record<string, React.FC<any>> = {
  LuxuryBed: FurnitureModels.LuxuryBed,
  Nightstand: FurnitureModels.Nightstand,
  ModernSofa: FurnitureModels.ModernSofa,
  CoffeeTable: FurnitureModels.CoffeeTable,
  TVStand: FurnitureModels.TVStand,
  GamingDesk: FurnitureModels.GamingDesk,
  GamingChair: FurnitureModels.GamingChair,
  Bookshelf: FurnitureModels.Bookshelf,
  KitchenCounters: FurnitureModels.KitchenCounters,
  DiningSet: FurnitureModels.DiningSet,
  Refrigerator: FurnitureModels.Refrigerator,
  Wardrobe: FurnitureModels.Wardrobe,
  Safe: FurnitureModels.Safe,
  WallArt: FurnitureModels.WallArt,
  Plant: FurnitureModels.Plant,
  Rug: FurnitureModels.Rug,
  CeilingLight: FurnitureModels.CeilingLight,
  NeonSign: FurnitureModels.NeonSign,
}

export function FurniturePlacer() {
  const buildMode = useStore(s => s.buildMode)
  const selectedModelType = useStore(s => s.selectedModelType)
  const placedObjects = useStore(s => s.placedObjects)
  const placeObject = useStore(s => s.placeObject)
  const deletePlaced = useStore(s => s.deletePlaced)
  
  const { raycaster, camera, pointer } = useThree()
  
  const [ghostPos, setGhostPos] = useState<[number, number, number]>([0, 0, 0])
  const [ghostRot, setGhostRot] = useState<number>(0)
  
  const ghostRef = useRef<THREE.Group>(null)

  // Gérer la rotation avec la touche Maj
  useEffect(() => {
    if (!buildMode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setGhostRot(prev => (prev + Math.PI / 4) % (Math.PI * 2))
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [buildMode])

  // Raycaster pour le placement
  useFrame(() => {
    if (!buildMode || !selectedModelType) return
    
    raycaster.setFromCamera(pointer, camera)
    
    // Fallback mathématique simple sur le plan y=0 (ou y=0.1 pour être au dessus)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const target = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, target)
    
    if (target) {
      // Snap to grid (0.5m)
      const snap = 0.5
      const rx = Math.round(target.x / snap) * snap
      const rz = Math.round(target.z / snap) * snap
      setGhostPos([rx, 0, rz])
    }
  })

  // Gestion du clic pour placer
  const handlePointerDown = (e: any) => {
    if (!buildMode) return
    
    if (e.button === 0 && selectedModelType) {
      // Empeche la propagation pour ne pas bouger la caméra si on utilise OrbitControls
      e.stopPropagation()
      
      placeObject({
        type: selectedModelType,
        label: selectedModelType,
        position: ghostPos,
        rotation: [0, ghostRot, 0],
        scale: [1, 1, 1],
        color: '#ffffff',
        metalness: 0,
        roughness: 1,
        opacity: 1
      })
    }
  }

  return (
    <group onPointerDown={handlePointerDown}>
      {/* Invisible plane to catch clicks for placement */}
      {buildMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}

      {/* Rendu des objets placés */}
      {placedObjects.map(obj => {
        const Model = ModelComponents[obj.type]
        if (!Model) return null
        
        return (
          <group 
            key={obj.id} 
            position={obj.position} 
            rotation={obj.rotation}
            scale={obj.scale}
            onPointerDown={(e) => {
              if (buildMode && e.button === 2) { // Clic droit pour supprimer
                e.stopPropagation()
                deletePlaced(obj.id)
              }
            }}
          >
            <Model />
            {buildMode && (
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[1, 0.2, 1]} />
                <meshBasicMaterial color="#ef4444" wireframe transparent opacity={0.3} />
              </mesh>
            )}
          </group>
        )
      })}

      {/* Ghost (Fantôme de prévisualisation) */}
      {buildMode && selectedModelType && (
        <group ref={ghostRef} position={ghostPos} rotation={[0, ghostRot, 0]}>
          {ModelComponents[selectedModelType] && (() => {
            const GhostModel = ModelComponents[selectedModelType]
            return <GhostModel />
          })()}
          <mesh>
            <boxGeometry args={[1.1, 2, 1.1]} />
            <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  )
}
