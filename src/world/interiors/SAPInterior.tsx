/**
 * src/world/interiors/SAPInterior.tsx
 * 
 * Scène Intérieure 3D Accessible pour la S.A.P. (Société des Alcools du Portneuf) de Production.
 * - Sol parquet sombre, murs bordeaux élégants et présentoirs boisés de spiritueux.
 * - Réfrigérateurs vitrés illuminés et Comptoir Sommelier RP.
 */

import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useAuthStore } from '../../store/authStore';

interface SAPInteriorProps {
  onExit: () => void;
  onNotify: (msg: string) => void;
}

export const SAPInterior: React.FC<SAPInteriorProps> = ({ onExit, onNotify }) => {
  const [prompt, setPrompt] = useState<string | null>(null);
  const player = useAuthStore(s => s.player);

  const handleAction = (itemKey: string, cost: number) => {
    if (!player) return;
    if (player.cash < cost) {
      onNotify("⚠️ Liquide insuffisant pour ce grand cru.");
    } else {
      useAuthStore.setState(s => ({
        player: s.player ? { ...s.player, cash: s.player.cash - cost } : null,
      }));
      onNotify(`✓ Vous avez acquis : ${itemKey} (-${cost} $) !`);
    }
  };

  return (
    <group name="SAPLiquorInteriorGroup">
      {/* ARCHITECTURE (18m x 5m x 20m) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color="#4a2511" roughness={0.4} /> {/* Parquet ciré */}
      </mesh>
      <mesh position={[0, 3.5, -10]} receiveShadow>
        <planeGeometry args={[18, 7]} />
        <meshStandardMaterial color="#311414" roughness={0.8} /> {/* Bordeaux luxueux */}
      </mesh>
      <pointLight position={[0, 6, 0]} intensity={2.2} distance={25} decay={2} color="#ffe4b5" />
      <ambientLight intensity={0.4} color="#ffe4b5" />

      {/* PRÉSENTOIRS DE VINS BOISÉS */}
      {[-4, 4].map((px, idx) => (
        <group key={idx} position={[px, 0, -2]}>
          <mesh position={[0, 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 4, 10]} />
            <meshStandardMaterial color="#3d1c06" roughness={0.7} />
          </mesh>
          <CuboidCollider
            args={[2.5, 2, 6]}
            position={[px > 0 ? -2 : 2, 1.5, 0]}
            sensor
            onIntersectionEnter={() => setPrompt("🍷 Grand Cru Québécois · [E] Acheter Bouteille de Vin (25 $)")}
            onIntersectionExit={() => setPrompt(null)}
          />
        </group>
      ))}

      {/* COMPTOIR SOMMELIER */}
      <group position={[0, 0, 6]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[5, 2.4, 1.8]} />
          <meshStandardMaterial color="#1a0b05" roughness={0.3} metalness={0.2} />
        </mesh>
        <CuboidCollider
          args={[3, 2, 2.5]}
          position={[0, 1.5, -2]}
          sensor
          onIntersectionEnter={() => setPrompt("🍾 Caisse Sommelier · [E] Acheter Spiritueux Prestige (60 $)")}
          onIntersectionExit={() => setPrompt(null)}
        />
      </group>

      {/* SORTIE */}
      <group position={[0, 0, 9.8]}>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[3, 4.4, 0.2]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.2} />
        </mesh>
        <CuboidCollider args={[2, 2, 1.5]} position={[0, 1.5, -1]} sensor onIntersectionEnter={onExit} />
      </group>

      {prompt && (
        <Html position={[0, 3, 0]} style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 40, pointerEvents: 'auto' }}>
          <div style={{ background: 'rgba(26, 11, 5, 0.95)', border: '2px solid #ffe4b5', padding: '16px 24px', borderRadius: '12px', color: '#ffe4b5', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <span>✨ {prompt}</span>
            <button
              onClick={() => handleAction(prompt.includes('Vin') ? 'Vin Rouge QC' : 'Spiritueux d\'Exception', prompt.includes('Vin') ? 25 : 60)}
              style={{ background: '#ffe4b5', color: '#311414', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
            >
              Acquérir [E]
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

export default SAPInterior;
