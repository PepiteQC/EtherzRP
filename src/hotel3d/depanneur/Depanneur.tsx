// src/hotel3d/depanneur/Depanneur.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { DEPANNEUR } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

export const Depanneur: React.FC = React.memo(() => {
  const M = useMemo(() => getMaterialSet(), []);
  const W = DEPANNEUR.width;
  const D = DEPANNEUR.depth;
  const H = DEPANNEUR.height;
  const WT = DEPANNEUR.wallThickness;
  const px = DEPANNEUR.positionX;
  const pz = DEPANNEUR.positionZ;

  return (
    <group position={[px, 0, pz]}>
      {/* Foundation */}
      <mesh position={[0, -0.15, 0]} material={M.slab} receiveShadow>
        <boxGeometry args={[W + 0.6, 0.30, D + 0.6]} />
      </mesh>

      {/* Floor */}
      <mesh position={[0, 0.08, 0]} material={M.marbleFloor} receiveShadow>
        <boxGeometry args={[W, 0.15, D]} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, H / 2, -D / 2]} castShadow>
        <boxGeometry args={[W, H, WT]} />
        <meshStandardMaterial color={0xc8c4b8} roughness={0.8} metalness={0.03} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} castShadow>
        <boxGeometry args={[WT, H, D]} />
        <meshStandardMaterial color={0xc8c4b8} roughness={0.8} metalness={0.03} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} castShadow>
        <boxGeometry args={[WT, H, D]} />
        <meshStandardMaterial color={0xc8c4b8} roughness={0.8} metalness={0.03} />
      </mesh>

      {/* Storefront */}
      <mesh position={[0, H / 2, D / 2]}>
        <boxGeometry args={[W, H, 0.08]} />
        <meshStandardMaterial color={0x1a2535} roughness={0.2} metalness={0.8} />
      </mesh>
      {[-3.5, 0, 3.5].map((gx, i) => (
        <mesh key={`dg-${i}`} position={[gx, H * 0.45, D / 2 + 0.04]} material={M.glass}>
          <boxGeometry args={[2.8, H * 0.75, 0.06]} />
        </mesh>
      ))}

      {/* Entry door */}
      <mesh position={[-W / 4, H * 0.38, D / 2 + 0.06]} material={M.glass}>
        <boxGeometry args={[1.8, 2.3, 0.04]} />
      </mesh>
      <mesh position={[-W / 4 + 0.7, H * 0.38, D / 2 + 0.1]} material={M.gold}>
        <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
      </mesh>

      {/* Roof */}
      <mesh position={[0, H, 0]} material={M.slab} receiveShadow>
        <boxGeometry args={[W + 0.3, 0.20, D + 0.3]} />
      </mesh>

      {/* Signage */}
      <mesh position={[0, H - 0.3, D / 2 + 0.15]}>
        <boxGeometry args={[5.0, 0.7, 0.08]} />
        <meshStandardMaterial color={0xff4444} emissive={new THREE.Color(0xff4444)} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, H + 0.5, D / 2 + 0.1]}>
        <boxGeometry args={[2.0, 0.3, 0.04]} />
        <meshStandardMaterial color={0x00cc44} emissive={new THREE.Color(0x00cc44)} emissiveIntensity={0.5} />
      </mesh>

      {/* Shelving */}
      {Array.from({ length: 4 }, (_, row) => (
        <group key={`shelf-row-${row}`} position={[W / 2 - 2.5 - row * 2.8, 0, 0]}>
          <mesh position={[0, 1.0, 0]} material={M.metal} castShadow>
            <boxGeometry args={[0.8, 2.0, D * 0.55]} />
          </mesh>
          {[0.5, 1.0, 1.5].map((sh, si) => (
            <mesh key={`shelf-${row}-${si}`} position={[0, sh, 0]} material={M.metal}>
              <boxGeometry args={[0.82, 0.02, D * 0.56]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Checkout counter */}
      <mesh position={[-W / 2 + 2.5, 0.5, D / 2 - 2]} material={M.metal} castShadow>
        <boxGeometry args={[3.5, 1.0, 0.8]} />
      </mesh>
      <mesh position={[-W / 2 + 2.5, 1.04, D / 2 - 2]} material={M.marble}>
        <boxGeometry args={[3.6, 0.06, 0.9]} />
      </mesh>
      {/* Cash register */}
      <mesh position={[-W / 2 + 2.5, 1.25, D / 2 - 2]} material={M.metalDark}>
        <boxGeometry args={[0.4, 0.35, 0.35]} />
      </mesh>

      {/* Coolers (back wall) */}
      <mesh position={[0, 1.2, -D / 2 + 0.5]}>
        <boxGeometry args={[W - 1, 2.2, 0.8]} />
        <meshStandardMaterial color={0xf0f0f0} roughness={0.3} metalness={0.1} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`cooler-door-${i}`}
          position={[-W / 2 + 1.5 + i * ((W - 2) / 6), 1.2, -D / 2 + 0.92]}
          material={M.glassClear}
        >
          <boxGeometry args={[(W - 2) / 6 - 0.1, 2.0, 0.03]} />
        </mesh>
      ))}

      {/* Lighting */}
      {Array.from({ length: 4 }, (_, i) => (
        <group key={`dep-light-${i}`}>
          <mesh position={[(i - 1.5) * 3.5, H - 0.08, 0]}>
            <boxGeometry args={[0.8, 0.04, 0.2]} />
            <meshStandardMaterial color={0xfff5e0} emissive={new THREE.Color(0xfff5e0)} emissiveIntensity={0.8} />
          </mesh>
          <pointLight position={[(i - 1.5) * 3.5, H - 0.3, 0]} color={0xfff5e0} intensity={1.0} distance={8} />
        </group>
      ))}

      {/* Independent parking */}
      {Array.from({ length: 5 }, (_, i) => (
        <group key={`dep-spot-${i}`}>
          <mesh position={[(i - 2) * 3, 0.005, D / 2 + 4.5]} rotation={[-Math.PI / 2, 0, 0]} material={M.asphalt}>
            <planeGeometry args={[2.7, 5.5]} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={`dep-line-${i}`} position={[(i - 2.5) * 3, 0.01, D / 2 + 4.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 5.5]} />
          <meshStandardMaterial color={0xffffff} />
        </mesh>
      ))}

      {/* Delivery area (back) */}
      <mesh position={[W / 2 - 2.5, 0.005, -D / 2 - 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 7]} />
        <meshStandardMaterial color={0x333333} roughness={0.9} />
      </mesh>
      <mesh position={[W / 2 - 2.5, 0.6, -D / 2 - 0.3]} material={M.concreteDark}>
        <boxGeometry args={[4, 1.2, 0.3]} />
      </mesh>

      {/* Waste enclosure */}
      <mesh position={[-W / 2 - 2, 0.8, -D / 2 - 1.5]} material={M.concreteDark} castShadow>
        <boxGeometry args={[3.0, 1.6, 2.5]} />
      </mesh>

      {/* ATM */}
      <mesh position={[W / 2 - 0.3, 0.75, D / 2 - 1]} material={M.metalDark} castShadow>
        <boxGeometry args={[0.5, 1.5, 0.45]} />
      </mesh>
      <mesh position={[W / 2 - 0.25, 1.2, D / 2 - 1]}>
        <boxGeometry args={[0.01, 0.25, 0.2]} />
        <meshStandardMaterial color={0x2244aa} emissive={new THREE.Color(0x2244aa)} emissiveIntensity={0.5} />
      </mesh>

      {/* Independent security camera */}
      <mesh position={[-W / 2 + 0.5, H - 0.3, D / 2 - 0.5]} material={M.metalDark}>
        <boxGeometry args={[0.12, 0.1, 0.18]} />
      </mesh>
      <mesh position={[W / 2 - 0.5, H - 0.3, D / 2 - 0.5]} material={M.metalDark}>
        <boxGeometry args={[0.12, 0.1, 0.18]} />
      </mesh>
    </group>
  );
});

Depanneur.displayName = 'Depanneur';