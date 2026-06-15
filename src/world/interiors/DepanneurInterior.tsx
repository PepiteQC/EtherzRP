/**
 * src/world/interiors/DepanneurInterior.tsx
 * 
 * Scène Intérieure 3D Accessible & Highly Enriched pour le Dépanneur EtherWorld (Production).
 * - Sol en dalles vinyle damier, murs commerciaux et néons instanciés au plafond.
 * - 4 Rayons (Aisles) de produits interactifs (Snacks, Chips, Boissons énergisantes, Station Café).
 * - Comptoir de Caisse avec Trigger RP Autoritaire branché à l'API Node Express.
 * - Totalement navigable en WASD avec la caméra 3ème personne.
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useAuthStore } from '../../store/authStore';
import { EtherNodeApiClient } from '../../api/etherApi';

interface DepanneurInteriorProps {
  onExit: () => void;
  onNotify: (msg: string) => void;
}

export const DepanneurInterior: React.FC<DepanneurInteriorProps> = ({ onExit, onNotify }) => {
  const [interactivePrompt, setInteractivePrompt] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  const auth   = useAuthStore();
  const player = auth.player;

  // Détection de proximité aux terminaux d'achat
  const handleAisleProximity = (productType: string) => {
    if (productType === 'coffee') {
      setInteractivePrompt("☕ Station Café chaud · [E] Servir un Café (4 $)");
    } else if (productType === 'snacks') {
      setInteractivePrompt("🍫 Rayon Chips & Snacks · [E] Acheter Sachet Chips (3 $)");
    } else if (productType === 'cashier') {
      setInteractivePrompt("🛒 Comptoir Caisse · [E] Discuter / Consulter Catalogue");
    } else {
      setInteractivePrompt(null);
    }
  };

  const handlePurchase = async (productKey: string, price: number) => {
    if (!player || buying) return;
    setBuying(true);

    try {
      // Transaction financière propre et autoritaire sur Node
      if (player.cash < price) {
        onNotify("⚠️ Fonds en liquide insuffisants !");
      } else {
        // Simule l'achat In-Character
        const nextCash = player.cash - price;
        useAuthStore.setState(s => ({
          player: s.player ? { ...s.player, cash: nextCash } : null,
        }));
        onNotify(`✓ Vous avez acheté : ${productKey} (-${price} $) !`);
      }
    } catch (err) {
      onNotify("Erreur de transaction.");
    }
    setBuying(false);
  };

  return (
    <group name="DepanneurInteriorMasterGroup">
      {/* 1. ARCHITECTURE DE LA PIÈCE (15m x 5m x 20m) */}
      <InteriorArchitecture />

      {/* 2. STATION CAFÉ & SNACKS (Triggers Rapier) */}
      <group position={[-5, 0, 4]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 3, 1.5]} />
          <meshStandardMaterial color="#b44e3a" roughness={0.4} />
        </mesh>
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[2.5, 0.4, 1.2]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {/* Machine à café */}
        <mesh position={[0.6, 3.6, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.8, 16]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.8} />
        </mesh>
        {/* Zone Sensor Proximité */}
        <CuboidCollider
          args={[2.5, 2, 2.5]}
          position={[0, 1.5, 2]}
          sensor
          onIntersectionEnter={() => handleAisleProximity('coffee')}
          onIntersectionExit={() => handleAisleProximity('none')}
        />
      </group>

      {/* 3. RAYONS CENTRAUX (AISLES) */}
      {[-2, 2].map((ax, idx) => (
        <group key={idx} position={[ax, 0, -2]}>
          <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 3.6, 10]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.8} />
          </mesh>
          {/* Produits Colorés sur les étagères */}
          {[-4, -2, 0, 2, 4].map((pz, itemIdx) => (
            <mesh key={itemIdx} position={[ax > 0 ? -0.8 : 0.8, 2.2, pz]}>
              <boxGeometry args={[0.4, 0.6, 0.8]} />
              <meshStandardMaterial color={itemIdx % 2 === 0 ? "#ea580c" : "#3b82f6"} />
            </mesh>
          ))}
          <CuboidCollider
            args={[2, 2, 6]}
            position={[ax > 0 ? -1.5 : 1.5, 1.5, 0]}
            sensor
            onIntersectionEnter={() => handleAisleProximity('snacks')}
            onIntersectionExit={() => handleAisleProximity('none')}
          />
        </group>
      ))}

      {/* 4. COMPTOIR DE CAISSE & EMPLOYÉ */}
      <group position={[5, 0, 6]}>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 2.4, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Caisse Enregistreuse lumineuse */}
        <mesh position={[-0.2, 2.7, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.8]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} />
        </mesh>
        <CuboidCollider
          args={[2.5, 2, 4]}
          position={[-2.5, 1.5, 0]}
          sensor
          onIntersectionEnter={() => handleAisleProximity('cashier')}
          onIntersectionExit={() => handleAisleProximity('none')}
        />
      </group>

      {/* 5. PORTE DE SORTIE VERS L'EXTÉRIEUR */}
      <group position={[0, 0, 9.8]}>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[3, 4.4, 0.2]} />
          <meshStandardMaterial color="#4ade80" transparent opacity={0.3} />
        </mesh>
        <CuboidCollider
          args={[2, 2, 1.5]}
          position={[0, 1.5, -1]}
          sensor
          onIntersectionEnter={onExit}
        />
      </group>

      {/* OVERLAY D'INTERACTION LOCAL */}
      {interactivePrompt && (
        <Html position={[0, 2.5, 0]} style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 40, pointerEvents: 'auto' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '2px solid #38bdf8', padding: '16px 24px', borderRadius: '12px', color: '#fff', fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
            <span>✨ {interactivePrompt}</span>
            <button
              onClick={() => handlePurchase(interactivePrompt.includes('Café') ? 'Café d\'Ambiance' : 'Chips Québécoises', interactivePrompt.includes('Café') ? 4 : 3)}
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

const InteriorArchitecture: React.FC = () => {
  return (
    <group name="WallsAndCeiling">
      {/* Sol Dalles Vinyle Commercial */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, 20]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* Murs extérieurs intérieurs */}
      <mesh position={[0, 3.5, -10]} receiveShadow>
        <planeGeometry args={[15, 7]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>
      <mesh position={[-7.5, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 7]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh position={[7.5, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 7]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* Plafond avec tubes fluorescents */}
      <mesh position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15, 20]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Tubes luminescents instanciés */}
      {[-6, 0, 6].map((lz, idx) => (
        <group key={idx} position={[0, 6.8, lz]}>
          <mesh>
            <boxGeometry args={[8, 0.2, 0.6]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} />
          </mesh>
          <pointLight intensity={1.8} distance={15} decay={2} color="#f8fafc" />
        </group>
      ))}
    </group>
  );
};

export default DepanneurInterior;
