import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// Enriched Environment from Official-PC + Real-shit additions
// Includes: Ultra Hotel, Dépanneur, Gas Stations, Route 138 props, Signs, etc.

interface EnvironmentProps {
  quality?: number
}

export function Environment({ quality = 2 }: EnvironmentProps) {
  const groupRef = useRef<THREE.Group>(null!)

  // Hotel Ultra - Extremely detailed from original project
  const HotelUltra = ({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) => (
    <group position={position} rotation={rotation as any}>
      {/* Main building */}
      <mesh position={[0, 22, 0]} castShadow receiveShadow>
        <boxGeometry args={[38, 44, 28]} />
        <meshLambertMaterial color="#334455" />
      </mesh>
      
      {/* Glass facade */}
      <mesh position={[0, 22, 14.1]} castShadow>
        <boxGeometry args={[36, 42, 0.6]} />
        <meshLambertMaterial color="#88ccff" transparent opacity={0.6} metalness={0.8} />
      </mesh>
      
      {/* Neon sign */}
      <mesh position={[0, 46, 15]} rotation={[0, 0, 0]}>
        <boxGeometry args={[22, 3.2, 0.4]} />
        <meshBasicMaterial color="#00f5ff" />
      </mesh>
      <Html position={[0, 46.2, 15.3]} style={{ color: '#00f5ff', fontSize: '13px', fontWeight: 900, letterSpacing: '3px' }}>
        HOTEL ULTRA
      </Html>
      
      {/* Windows grid */}
      {Array.from({ length: 6 }).map((_, floor) =>
        Array.from({ length: 7 }).map((_, col) => (
          <mesh 
            key={`${floor}-${col}`} 
            position={[-15 + col * 5.2, 6 + floor * 6.8, 14.4]}
          >
            <planeGeometry args={[3.4, 4.8]} />
            <meshLambertMaterial color="#112244" emissive="#001122" emissiveIntensity={0.3} />
          </mesh>
        ))
      )}
      
      {/* Entrance canopy */}
      <mesh position={[0, 8, 16]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[14, 1.2, 9]} />
        <meshLambertMaterial color="#223344" />
      </mesh>
      
      {/* Valet parking sign */}
      <mesh position={[-22, 4, 19]}>
        <cylinderGeometry args={[0.3, 0.3, 8]} />
        <meshLambertMaterial color="#444" />
      </mesh>
      <Html position={[-22, 9.5, 19]} style={{ color: '#ffcc00', fontSize: '11px', fontWeight: 700 }}>
        VALET
      </Html>
    </group>
  )

  // Dépanneur (Quebec corner store) - Enriched
  const Depanneur = ({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) => (
    <group position={position} rotation={rotation as any}>
      {/* Building */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <boxGeometry args={[18, 13, 16]} />
        <meshLambertMaterial color="#c94e3f" />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 13.8, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[20, 1.4, 18]} />
        <meshLambertMaterial color="#222" />
      </mesh>
      
      {/* Sign */}
      <mesh position={[0, 16, 8.2]}>
        <boxGeometry args={[12, 4.5, 0.8]} />
        <meshLambertMaterial color="#ffdd44" />
      </mesh>
      <Html position={[0, 16.5, 8.6]} style={{ color: '#222', fontSize: '14px', fontWeight: 900 }}>
        DÉPANNEUR
      </Html>
      
      {/* Door */}
      <mesh position={[0, 5, 8.1]} castShadow>
        <planeGeometry args={[3.5, 7]} />
        <meshLambertMaterial color="#112233" />
      </mesh>
      
      {/* Windows with products */}
      <mesh position={[-6, 6.5, 8.1]}>
        <planeGeometry args={[4.5, 5]} />
        <meshLambertMaterial color="#334455" emissive="#112233" />
      </mesh>
      <mesh position={[6, 6.5, 8.1]}>
        <planeGeometry args={[4.5, 5]} />
        <meshLambertMaterial color="#334455" emissive="#112233" />
      </mesh>
      
      {/* Ice machine */}
      <mesh position={[-10, 3, 9]} castShadow>
        <boxGeometry args={[3, 5, 2.5]} />
        <meshLambertMaterial color="#4488cc" />
      </mesh>
    </group>
  )

  // Gas Station
  const GasStation = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      {/* Canopy */}
      <mesh position={[0, 11, 0]} castShadow>
        <boxGeometry args={[32, 1.2, 18]} />
        <meshLambertMaterial color="#223344" />
      </mesh>
      
      {/* Pumps */}
      {[-9, 0, 9].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 4, 0]} castShadow>
            <boxGeometry args={[2.8, 8, 1.6]} />
            <meshLambertMaterial color="#111" />
          </mesh>
          <mesh position={[0, 9, 0]}>
            <boxGeometry args={[3.2, 1.4, 2]} />
            <meshLambertMaterial color="#ffcc00" emissive="#664400" />
          </mesh>
        </group>
      ))}
      
      {/* Price sign */}
      <mesh position={[18, 14, -6]}>
        <planeGeometry args={[6, 8]} />
        <meshLambertMaterial color="#112200" />
      </mesh>
      <Html position={[18, 17, -5.5]} style={{ color: '#aaff00', fontSize: '15px', fontWeight: 900 }}>
        1.89$
      </Html>
    </group>
  )

  // Route 138 Road Signs & Props
  const Route138Sign = ({ position, text = "ROUTE 138" }: { position: [number, number, number]; text?: string }) => (
    <group position={position}>
      <mesh position={[0, 7, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 14]} />
        <meshLambertMaterial color="#444" />
      </mesh>
      <mesh position={[0, 15, 0]} rotation={[0, 0.3, 0]}>
        <planeGeometry args={[11, 3.8]} />
        <meshLambertMaterial color="#ffcc00" />
      </mesh>
      <Html position={[0, 15.3, 0.2]} style={{ color: '#111', fontSize: '13px', fontWeight: 900, letterSpacing: '1px' }}>
        {text}
      </Html>
    </group>
  )

  // Scattered props (rocks, trees, barrels, etc.)
  const ScatteredProps = () => {
    const props = useMemo(() => {
      const arr = []
      for (let i = 0; i < 38; i++) {
        const x = (Math.random() - 0.5) * 240
        const z = (Math.random() - 0.5) * 240
        const type = Math.random() > 0.6 ? 'rock' : Math.random() > 0.5 ? 'barrel' : 'sign'
        arr.push({ x, z, type, scale: 0.8 + Math.random() * 0.6 })
      }
      return arr
    }, [])

    return (
      <>
        {props.map((p, idx) => (
          <group key={idx} position={[p.x, 0, p.z]} scale={p.scale}>
            {p.type === 'rock' && (
              <mesh position={[0, 2.5, 0]} castShadow>
                <dodecahedronGeometry args={[3.5]} />
                <meshLambertMaterial color="#445544" />
              </mesh>
            )}
            {p.type === 'barrel' && (
              <mesh position={[0, 2.2, 0]} castShadow>
                <cylinderGeometry args={[1.4, 1.4, 4.2]} />
                <meshLambertMaterial color="#334455" />
              </mesh>
            )}
            {p.type === 'sign' && (
              <mesh position={[0, 5, 0]} rotation={[0, Math.random() * 2, 0]}>
                <planeGeometry args={[3, 2.2]} />
                <meshLambertMaterial color="#553322" />
              </mesh>
            )}
          </group>
        ))}
      </>
    )
  }

  return (
    <group ref={groupRef}>
      {/* Major Landmarks */}
      <HotelUltra position={[-68, 0, -92]} rotation={[0, 1.1, 0]} />
      <HotelUltra position={[92, 0, 68]} rotation={[0, -0.8, 0]} />
      
      <Depanneur position={[-38, 0, 42]} rotation={[0, -0.6, 0]} />
      <Depanneur position={[54, 0, -54]} rotation={[0, 2.2, 0]} />
      
      <GasStation position={[-112, 0, 18]} />
      <GasStation position={[78, 0, -88]} />
      
      {/* Route 138 Signs */}
      <Route138Sign position={[-42, 0, -18]} text="ROUTE 138 OUEST" />
      <Route138Sign position={[38, 0, 24]} text="ROUTE 138 EST" />
      <Route138Sign position={[-8, 0, 92]} text="SEPT-ÎLES 312 km" />
      
      {/* Scattered world props */}
      <ScatteredProps />
      
      {/* Distant mountains silhouette */}
      <group position={[0, 0, -280]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[-80 + i * 42, 48, -30 + i * 12]} rotation={[0, i * 0.3, 0]}>
            <coneGeometry args={[38, 96, 4]} />
            <meshLambertMaterial color="#112233" />
          </mesh>
        ))}
      </group>
      
      {/* Ambient world lighting accents */}
      <pointLight position={[-68, 48, -92]} color="#ffaa66" intensity={0.8} distance={80} />
      <pointLight position={[92, 48, 68]} color="#aaffff" intensity={0.6} distance={70} />
    </group>
  )
}
