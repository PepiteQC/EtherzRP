import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { memo, useRef } from 'react'
import * as THREE from 'three'
import EtherWorldCity from '../etherworld/EtherWorldCity'

// Contrôleur de caméra cinématique lente
function DashboardCameraController() {
  useFrame((state) => {
    const time = state.clock.getElapsedTime() * 0.04 // Rotation cinématique lente
    const radius = 130
    
    // Orbite autour du centre de la ville [0, 5, 900]
    state.camera.position.x = Math.sin(time) * radius
    state.camera.position.z = 900 + Math.cos(time) * radius
    state.camera.position.y = 28 + Math.sin(time * 0.5) * 8
    
    state.camera.lookAt(0, 5, 900)
  })
  return null
}

const Scene = memo(function Scene() {
  return (
    <>
      <color attach="background" args={['#060814']} />
      
      {/* Brouillard atmosphérique sombre */}
      <fog attach="fog" color="#060814" near={40} far={200} />
      
      {/* Ciel étoilé */}
      <Stars radius={200} depth={50} count={4000} factor={6} saturation={0.5} fade speed={1} />
      
      {/* Éclairages de la ville */}
      <ambientLight intensity={0.3} color="#0a122c" />
      
      {/* Lumière lunaire bleue / néon */}
      <directionalLight 
        position={[-60, 80, 840]} 
        intensity={2.2} 
        color="#3b82f6" 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      <directionalLight 
        position={[60, 40, 960]} 
        intensity={1.2} 
        color="#a855f7" 
      />

      {/* Point lumineux central au-dessus du parc */}
      <pointLight position={[0, 25, 960]} intensity={1.5} color="#06b6d4" distance={150} />

      {/* Rendu de la ville 3D réelle */}
      <EtherWorldCity />
      
      {/* Contrôle automatique de la caméra */}
      <DashboardCameraController />
    </>
  )
})

export default function EtherworldDashboardScene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 20, 1020], fov: 55, near: 0.5, far: 500 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Scene />
      </Canvas>
      {/* Gradient d'ambiance superposé pour le look néon/sombre */}
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to bottom, rgba(6, 8, 20, 0.2) 0%, rgba(6, 8, 20, 0.4) 60%, rgba(6, 8, 20, 0.85) 100%)',
          pointerEvents: 'none'
        }} 
      />
    </div>
  )
}
