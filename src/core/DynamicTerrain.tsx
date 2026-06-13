import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { usePlane } from '@react-three/cannon'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'

interface DynamicTerrainProps {
  seed: number
  size: number
  segments: number
  heightScale: number
  quality: number
}

export function DynamicTerrain({ 
  seed = 424242, 
  size = 280, 
  segments = 128, 
  heightScale = 22,
  quality = 2 
}: DynamicTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI * 0.5, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
    material: { friction: 0.8, restitution: 0.1 }
  }))

  // Generate high-quality procedural terrain using simplex noise (enriched)
  const { geometry, material } = useMemo(() => {
    const noise2D = createNoise2D(() => seed * 0.0001)
    
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const positions = posAttr.array as Float32Array
    
    // Multiple octaves for rich terrain (mountains, valleys, roads)
    const octaves = quality >= 2 ? 7 : 5
    const persistence = 0.48
    const lacunarity = 2.1
    
    let minH = Infinity
    let maxH = -Infinity
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]
      
      let height = 0
      let amplitude = 1
      let frequency = 0.8
      
      for (let o = 0; o < octaves; o++) {
        const nx = x * frequency / size
        const nz = z * frequency / size
        
        let n = noise2D(nx, nz) * amplitude
        
        // Add ridge noise for mountains
        if (o > 2) {
          n = 1 - Math.abs(n)
          n = n * n * n
        }
        
        height += n
        amplitude *= persistence
        frequency *= lacunarity
      }
      
      // Add large scale features (plateaus, valleys)
      const largeScale = noise2D(x * 0.003, z * 0.003) * 6
      height += largeScale
      
      // Create road-like flat areas (Route 138 style)
      const distToRoad = Math.abs(z)
      if (distToRoad < 18) {
        height *= 0.15 + (distToRoad / 18) * 0.85
      }
      
      // Apply height scale
      const finalHeight = height * heightScale * 0.6
      
      positions[i + 1] = finalHeight
      
      minH = Math.min(minH, finalHeight)
      maxH = Math.max(maxH, finalHeight)
    }
    
    posAttr.needsUpdate = true
    geo.computeVertexNormals()
    
    // Rich material with multiple layers
    const mat = new THREE.MeshLambertMaterial({
      color: 0x2a3a2a,
      flatShading: quality < 2,
      wireframe: false,
    })
    
    // Vertex colors for biome variation
    const colors = new Float32Array(positions.length)
    for (let i = 0; i < positions.length; i += 3) {
      const h = positions[i + 1]
      const normalized = (h - minH) / (maxH - minH)
      
      let r = 0.16, g = 0.24, b = 0.16
      
      // Snow on peaks
      if (normalized > 0.82) {
        r = g = b = 0.95
      } 
      // Grass / forest
      else if (normalized > 0.35) {
        r = 0.12 + normalized * 0.1
        g = 0.32 + normalized * 0.15
        b = 0.14
      } 
      // Dirt / road
      else {
        r = 0.28
        g = 0.24
        b = 0.18
      }
      
      colors[i] = r
      colors[i + 1] = g
      colors[i + 2] = b
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    mat.vertexColors = true
    
    return { geometry: geo, material: mat }
  }, [seed, size, segments, heightScale, quality])

  // Subtle terrain animation (wind on grass, etc.)
  useFrame((state) => {
    if (meshRef.current && quality >= 2) {
      const time = state.clock.elapsedTime * 0.4
      // Could add vertex displacement here for wind effect
    }
  })

  return (
    <group>
      <mesh 
        ref={meshRef} 
        geometry={geometry} 
        material={material} 
        receiveShadow 
        castShadow 
        position={[0, 0, 0]} 
        rotation={[-Math.PI * 0.5, 0, 0]} 
      />
      
      {/* Road markings - Route 138 style */}
      <RoadMarkings size={size} />
    </group>
  )
}

// Road markings component (enriched from Real-shit route-138-quebec)
function RoadMarkings({ size }: { size: number }) {
  const lines = useMemo(() => {
    const arr = []
    const count = 28
    for (let i = 0; i < count; i++) {
      const z = (i - count / 2) * 9.2
      arr.push(
        <mesh key={i} position={[0, 0.12, z]} rotation={[-Math.PI * 0.5, 0, 0]}>
          <planeGeometry args={[2.8, 1.1]} />
          <meshBasicMaterial color="#f4e9c8" transparent opacity={0.95} />
        </mesh>
      )
    }
    return arr
  }, [size])

  return <group>{lines}</group>
}
