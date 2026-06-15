/**
 * src/world/interiors/GarageInterior.tsx
 * 
 * Scène Intérieure 3D Accessible pour le Garage Mécanique Ti-Guy (Production).
 * - Sol béton avec taches d'huile, baies de réparation avec ponts élévateurs hydrauliques.
 * - Établis d'outils, racks de pneus et zone de gestion du Stockage de Pièces.
 * - Totalement navigable en WASD ou vue caméra.
 */

import React, { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { EtherNodeApiClient } from '../../api/etherApi';
import { useAuthStore } from '../../store/authStore';

interface GarageInteriorProps {
  onExit: () => void;
  onNotify: (msg: string) => void;
}

export const GarageInterior: React.FC<GarageInteriorProps> = ({ onExit, onNotify }) => {
  const [activeBay, setActiveBay] = useState<string | null>(null);
  const [repairing, setRepairing] = useState(false);

  const player = useAuthStore(s => s.player);

  const handleSensorBay = (bayKey: string) => { BaySensor(bayKey); };
  
  function BaySensor(bayKey: string) {
    if (bayKey === 'lift_1') {
      setActiveBay("Pont Hydraulique 1 · [E] Réparer Moteur & Carrosserie (150 $)");
    } else if (bayBayParts(bayKey)) {
      setActiveBay("📦 Entrepôt de Pièces · [E] Commander Kit de Réparation RP (50 $)");
    } else {
      setActiveBay(null);
    }
  }

  function bayBayParts(k: string) { return k === 'storage_parts'; }

  const executeMechAction = async () => {
    if (!player || repairing || !activeBay) return;
    setRepairing(true);

    try {
      if (activeBay.includes('Moteur')) {
        await EtherNodeApiClient.updatePlayerSurvivalStatus({ stress: Math.max(0, player.stress - 10) });
        onNotify("✓ Réparations complètes effectuées sur le véhicule !");
      } else {
        // Commande de kit
        useAuthStore.setState(s => ({
          player: s.player ? { ...s.player, cash: s.player.cash - 50 } : null,
        }));
        onNotify("✓ Kit de réparation Mécanique ajouté à votre inventaire !");
      }
    } catch (err) {
      onNotify("Échec de l'action mécanique.");
    }
    setRepairing(false);
  };

  return (
    <group name="GarageMechInteriorGroup">
      {/* ARCHITECTURE (20m x 7m x 25m) */}
      <GarageArchitecture />

      {/* BAIE DE RÉPARATION 1 AVEC PONT HYDRAULIQUE */}
      <group position={[-6, 0, 0]}>
        {/* Colonnes du Lift */}
        {[-1.8, 1.8].map((lx, idx) => (
          <mesh key={idx} position={[lx, 3, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.3, 6, 12]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        ))}
        {/* Plateforme sous caisse */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[3.6, 0.2, 5.5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <spotLight position={[0, 0.2, 0]} angle={0.8} intensity={4} color="#38bdf8" />
        
        <CuboidCollider
          args={[3, 2, 4]}
          position={[0, 1.5, 0]}
          sensor
          onIntersectionEnter={() => handleSensorBay('lift_1')}
          onIntersectionExit={() => handleSensorBay('none')}
        />
      </group>

      {/* ENTREPÔT DE PIÈCES & ÉTABLI (STORAGE) */}
      <group position={[7, 0, -6]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 3, 8]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {/* Pneus empilés */}
        {[0, 0.5, 1.0, 1.5].map((py, pidx) => (
          <mesh key={pidx} position={[-0.5, 3.2 + py, 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.3, 16]} />
            <meshStandardMaterial color="#0b0f19" roughness={0.9} />
          </mesh>
        ))}
        <CuboidCollider
          args={[3, 2, 5]}
          position={[-2.5, 1.5, 0]}
          sensor
          onIntersectionEnter={() => handleSensorBay('storage_parts')}
          onIntersectionExit={() => handleSensorBay('none')}
        />
      </group>

      {/* SORTIE */}
      <group position={[0, 0, 12]}>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[5, 5, 0.2]} />
          <meshStandardMaterial color="#facc15" transparent opacity={0.2} />
        </mesh>
        <CuboidCollider args={[3, 2, 1.5]} position={[0, 1.5, -1]} sensor onIntersectionEnter={onExit} />
      </group>

      {/* INTERACTION OVERLAY */}
      {activeBay && (
        <Html position={[0, 3, 0]} style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 40, pointerEvents: 'auto' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '2px solid #ea580c', padding: '16px 24px', borderRadius: '12px', color: '#fff', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <span>✨ {activeBay}</span>
            <button
              onClick={executeMechAction}
              style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}
            >
              Exécuter [E]
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

const GarageArchitecture: React.FC = () => {
  return (
    <group name="GarageArchitecture">
      {/* Sol Béton d'Atelier */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 25]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
      {/* Murs Industriels */}
      <mesh position={[0, 4, -12.5]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.95} />
      </mesh>
      <mesh position={[-10, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[25, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.95} />
      </mesh>
      <mesh position={[10, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[25, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.95} />
      </mesh>
      {/* Éclairage halogène puissant */}
      <pointLight position={[0, 6.5, 0]} intensity={2.5} distance={30} decay={2} color="#fffbeb" />
      <ambientLight intensity={0.4} color="#94a3b8" />
    </group>
  );
};

export default GarageInterior;
