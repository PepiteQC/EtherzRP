/**
 * src/world/interiors/MotelRoomInterior.tsx
 * 
 * Scène Intérieure 3D Accessible pour la Chambre de Motel 101 des Laurentides.
 * - Moquette feutrée, murs chaleureux, lit double et meuble télé rétro.
 * - Garde-robe agissant comme Coffre Immobilier Persistant (50 kg).
 */

import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useAuthStore } from '../../store/authStore';

interface MotelProps {
  onExit: () => void;
  onNotify: (msg: string) => void;
}

export const MotelRoomInterior: React.FC<MotelProps> = ({ onExit, onNotify }) => {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [storageOpen, setStorageOpen] = useState(false);

  return (
    <group name="MotelRoomInteriorGroup">
      {/* ARCHITECTURE (10m x 4m x 12m) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 12]} />
        <meshStandardMaterial color="#305040" roughness={0.9} /> {/* Moquette verte rétro */}
      </mesh>
      <mesh position={[0, 2, -6]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#f0ece1" roughness={0.95} /> {/* Murs beiges */}
      </mesh>
      <pointLight position={[0, 3.5, 0]} intensity={1.5} distance={15} decay={2} color="#fff1e8" />
      <ambientLight intensity={0.4} color="#fff1e8" />

      {/* LIT DOUBLE RÉTRO */}
      <group position={[-2.5, 0, -3]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 1.2, 4.5]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.7} /> {/* Structure bois */}
        </mesh>
        <mesh position={[0, 1.3, 0.5]}>
          <boxGeometry args={[3.6, 0.3, 3.5]} />
          <meshStandardMaterial color="#b44e3a" roughness={0.9} /> {/* Couvre-lit bordeaux */}
        </mesh>
        <CuboidCollider
          args={[2.5, 1.5, 3]}
          position={[2.5, 1, 0]}
          sensor
          onIntersectionEnter={() => setPrompt("🛏️ Lit Confortable · [E] Dormir / Sauvegarder (Regain Santé & Stress)")}
          onIntersectionExit={() => setPrompt(null)}
        />
      </group>

      {/* GARDE-ROBE (COFFRE DE PROPRIÉTÉ) */}
      <group position={[4.2, 0, -4]}>
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 3.6, 2.5]} />
          <meshStandardMaterial color="#5c3a21" roughness={0.6} />
        </mesh>
        <CuboidCollider
          args={[2, 2, 2]}
          position={[-1.5, 1.5, 0]}
          sensor
          onIntersectionEnter={() => setPrompt("📦 Coffre de Motel · [E] Inspecter Stockage RP (50 kg max)")}
          onIntersectionExit={() => setPrompt(null)}
        />
      </group>

      {/* SORTIE */}
      <group position={[0, 0, 5.8]}>
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[2.4, 4, 0.2]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <CuboidCollider args={[2, 2, 1.5]} position={[0, 1.5, -1]} sensor onIntersectionEnter={onExit} />
      </group>

      {prompt && (
        <Html position={[0, 2.5, 0]} style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 40, pointerEvents: 'auto' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '2px solid #c084fc', padding: '16px 24px', borderRadius: '12px', color: '#fff', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <span>✨ {prompt}</span>
            <button
              onClick={() => {
                if (prompt.includes('Dormir')) {
                  useAuthStore.setState(s => ({
                    player: s.player ? { ...s.player, health: 100, stress: 0, hunger: 100, thirst: 100 } : null,
                  }));
                  onNotify("✓ Nuit reposante. Vous êtes en pleine forme !");
                } else {
                  setStorageOpen(true);
                  onNotify("✓ Ouverture du coffre de la chambre.");
                }
              }}
              style={{ background: '#c084fc', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
            >
              Actionner [E]
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

export default MotelRoomInterior;
