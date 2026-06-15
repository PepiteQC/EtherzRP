/**
 * src/world/interiors/PoliceStationInterior.tsx
 * 
 * Scène Intérieure 3D Accessible pour le Poste de Police (Route 138).
 * - Sol ardoise, murs civiques bleutés, comptoir d'accueil et Bureau du Shérif.
 * - Cellules de détention avec grilles électroniques et Armurerie de Sécurité.
 */

import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useAuthStore } from '../../store/authStore';

interface PoliceProps {
  onExit: () => void;
  onNotify: (msg: string) => void;
}

export const PoliceStationInterior: React.FC<PoliceProps> = ({ onExit, onNotify }) => {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [cellsLocked, setCellsLocked] = useState(true);

  return (
    <group name="PoliceStationInteriorGroup">
      {/* ARCHITECTURE (22m x 6m x 25m) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 25]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} /> {/* Ardoise civique */}
      </mesh>
      <mesh position={[0, 4, -12.5]} receiveShadow>
        <planeGeometry args={[22, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} /> {/* Bleu marine institutionnel */}
      </mesh>
      <pointLight position={[0, 6, 0]} intensity={2.5} distance={30} decay={2} color="#f8fafc" />
      <ambientLight intensity={0.5} color="#e2e8f0" />

      {/* CELLULES DE DÉTENTION (HOLDING CELLS) */}
      <group position={[-7, 0, -6]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[6, 5, 0.2]} />
          <meshStandardMaterial color={cellsLocked ? "#ef4444" : "#22c55e"} metalness={0.9} roughness={0.2} wireframe /> {/* Grilles en fil de fer */}
        </mesh>
        <CuboidCollider
          args={[3, 2, 3]}
          position={[3, 1.5, 2]}
          sensor
          onIntersectionEnter={() => setPrompt("🔒 Cellules de Détention · [E] Verrouiller / Libérer Détenus")}
          onIntersectionExit={() => setPrompt(null)}
        />
      </group>

      {/* ARMURERIE MUNICIPALE (ARMORY) */}
      <group position={[8, 0, -6]}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 4, 1.5]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
        </mesh>
        <CuboidCollider
          args={[2.5, 2, 3]}
          position={[-2, 1.5, 2]}
          sensor
          onIntersectionEnter={() => setPrompt("🛡️ Armurerie Police · [E] Équiper Gilet Pare-Balles & Arme de Service")}
          onIntersectionExit={() => setPrompt(null)}
        />
      </group>

      {/* SORTIE */}
      <group position={[0, 0, 12]}>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[4, 5, 0.2]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.2} />
        </mesh>
        <CuboidCollider args={[3, 2, 1.5]} position={[0, 1.5, -1]} sensor onIntersectionEnter={onExit} />
      </group>

      {prompt && (
        <Html position={[0, 3, 0]} style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 40, pointerEvents: 'auto' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '2px solid #38bdf8', padding: '16px 24px', borderRadius: '12px', color: '#fff', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <span>✨ {prompt}</span>
            <button
              onClick={() => {
                if (prompt.includes('Armurerie')) {
                  useAuthStore.setState(s => ({
                    player: s.player ? { ...s.player, armor: 100 } : null,
                  }));
                  onNotify("✓ Gilet Tactique de la Sûreté du Québec équipé (Armor 100 %) !");
                } else {
                  setCellsLocked(prev => !prev);
                  onNotify(cellsLocked ? "🔓 Grilles des cellules déverrouillées." : "🔒 Grilles fermées sous haute sécurité.");
                }
              }}
              style={{ background: '#38bdf8', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
            >
              Exécuter [E]
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

export default PoliceStationInterior;
