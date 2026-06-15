// src/hotel3d/environment/Environment.tsx

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDING, LOBBY, DEPANNEUR } from '../constants/dimensions';
import { getMaterialSet } from '../constants/materials';

export const Environment: React.FC = React.memo(() => {
  const M = useMemo(() => getMaterialSet(), []);

  return (
    <group>
      {/* ─── GROUND PLANE ──────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={M.asphalt}>
        <planeGeometry args={[200, 200, 8, 8]} />
      </mesh>

      {/* ─── SIDEWALK ──────────────────────── */}
      <mesh
        position={[0, 0.06, BUILDING.width / 2 + 5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 10]} />
        <meshStandardMaterial color={0xb0ada8} roughness={0.88} />
      </mesh>

      {/* ─── ROAD ──────────────────────────── */}
      <mesh
        position={[0, 0.01, BUILDING.width / 2 + 15]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        material={M.asphalt}
      >
        <planeGeometry args={[80, 12]} />
      </mesh>

      {/* ─── ROAD MARKINGS ─────────────────── */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={`dash-${i}`}
          position={[-22 + i * 4, 0.02, BUILDING.width / 2 + 15]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.15, 1.5]} />
          <meshStandardMaterial
            color={0xffd060}
            emissive={0xffd060}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* ─── PEDESTRIAN PATH between hotel and depanneur ── */}
      <mesh
        position={[DEPANNEUR.positionX / 2, 0.04, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[DEPANNEUR.separationFromHotel, 2]} />
        <meshStandardMaterial color={0xa0a098} roughness={0.9} />
      </mesh>

      {/* ─── STREET LAMPS ──────────────────── */}
      {[[-12, 18], [12, 18], [-12, 6], [12, 6]].map(([lx, lz], i) => (
        <group key={`lamp-${i}`}>
          <mesh position={[lx, 3.25, lz]}>
            <cylinderGeometry args={[0.05, 0.08, 6.5, 10]} />
            <meshStandardMaterial color={0x1a2030} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[lx + 1.5, 6.5, lz]}>
            <boxGeometry args={[2, 0.06, 0.06]} />
            <meshStandardMaterial color={0x1a2030} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[lx + 2.5, 6.35, lz]}>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshStandardMaterial
              color={0xffd580}
              emissive={0xffd580}
              emissiveIntensity={1.2}
            />
          </mesh>
          <pointLight
            position={[lx + 2.5, 6.2, lz]}
            color={0xffd580}
            intensity={1.8}
            distance={18}
          />
        </group>
      ))}

      {/* ─── BENCHES ───────────────────────── */}
      {[[-14, 14], [14, 14]].map(([bx, bz], i) => (
        <group key={`bench-${i}`}>
          <mesh position={[bx, 0.5, bz]}>
            <boxGeometry args={[2.0, 0.08, 0.4]} />
            <meshStandardMaterial color={0x1a1510} roughness={0.8} />
          </mesh>
          {[[-0.7, -0.15], [0.7, -0.15], [-0.7, 0.15], [0.7, 0.15]].map(([ox, oz], j) => (
            <mesh key={`bench-leg-${i}-${j}`} position={[bx + ox, 0.25, bz + oz]}>
              <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
              <meshStandardMaterial color={0xc9a84c} metalness={0.9} roughness={0.12} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ─── STARS ─────────────────────────── */}
      <StarField />
    </group>
  );
});

Environment.displayName = 'Environment';

const StarField: React.FC = React.memo(() => {
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 280;
      arr[i * 3 + 1] = Math.random() * 100 + 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 280;
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={600}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color={0xffffff} size={0.18} sizeAttenuation />
    </points>
  );
});

StarField.displayName = 'StarField';