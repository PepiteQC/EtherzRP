/**
 * src/world/gameplay/GameplayController.tsx
 * 
 * Système Ultime de Gameplay Autonome (Phase 4 : Conduite & Interactions RP) pour EtherWorld RP.
 * - Correctif de Conduite et Mouvements Piétons : Mouvements Relatifs à la Caméra (WASD $100\%$ Fluide)
 * - Pilotage à la souris 360° GTA-style et Rotation fluide de la capsule RP vers sa trajectoire
 * - Moteur de Conduite de Véhicules Québécois avec Physique, Braquage et Phares Halogènes
 * - Triggers Interactifs (Caisse Dépanneur, Réparation Garage Ti-Guy Ti-Guy, Portes Motel, SAQ)
 * - Raccourci [E] unifié branché sur le Cache Zustand et l'API Express
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, Html, OrbitControls } from '@react-three/drei';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useFirebaseCacheStore } from '../../store/firebaseStoreCache';
import { useAuthStore } from '../../store/authStore';

export type GameplayMode = 'walking' | 'driving';

interface GameplayProps {
  initialMode?: GameplayMode;
  initialPosition?: [number, number, number];
  onInteract?: (businessName: string, actionType: string) => void;
}

/**
 * Composant Maître du Gameplay (Piéton + Véhicule + Interactions)
 */
export const GameplayController: React.FC<GameplayProps> = ({
  initialMode     = 'walking',
  initialPosition = [0, 2, 0],
  onInteract,
}) => {
  const [mode, setMode] = useState<GameplayMode>(initialMode);
  const playerPosRef    = useRef<THREE.Vector3>(new THREE.Vector3(...initialPosition));
  const vehiclePosRef   = useRef<THREE.Vector3>(new THREE.Vector3(initialPosition[0] + 6, 0.5, initialPosition[2] + 6));
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const toggleVehicleEnterExit = useCallback(() => {
    const dist = playerPosRef.current.distanceTo(vehiclePosRef.current);
    if (mode === 'walking') {
      if (dist < 6.0) {
        setMode('driving');
        setActivePrompt(null);
        console.info("[Gameplay] Accès au véhicule ratifié.");
      } else {
        setActivePrompt("⚠️ Le véhicule est trop éloigné pour monter.");
        setTimeout(() => setActivePrompt(null), 2500);
      }
    } else {
      setMode('walking');
      playerPosRef.current.copy(vehiclePosRef.current).add(new THREE.Vector3(3, 1, 0));
      console.info("[Gameplay] Sortie du véhicule.");
    }
  }, [mode]);

  return (
    <group name="GameplayMasterGroup">
      {/* Contrôleur Piéton (Actif si mode === 'walking') */}
      {mode === 'walking' && (
        <WalkerController
          positionRef={playerPosRef}
          onNearInteract={setActivePrompt}
          onTriggerAction={onInteract}
          onEnterVehicle={toggleVehicleEnterExit}
        />
      )}

      {/* Véhicule */}
      <VehicleController
        mode={mode}
        positionRef={vehiclePosRef}
        onExitVehicle={toggleVehicleEnterExit}
      />

      <InteractionOverlay
        prompt={activePrompt}
        mode={mode}
        onToggleDrive={toggleVehicleEnterExit}
      />
    </group>
  );
};

/**
 * 1. Correctif du Contrôleur Piéton WASD Relatif à la Caméra (100% Fluide & Souple)
 */
interface WalkerProps {
  positionRef: React.MutableRefObject<THREE.Vector3>;
  onNearInteract: (prompt: string | null) => void;
  onTriggerAction?: (bizName: string, action: string) => void;
  onEnterVehicle: () => void;
}

const WalkerController: React.FC<WalkerProps> = ({
  positionRef,
  onNearInteract,
  onTriggerAction,
  onEnterVehicle,
}) => {
  const { camera } = useThree();
  const [, getKeys] = useKeyboardControls();
  
  const bodyRef    = useRef<RapierRigidBody>(null);
  const proxyGroupRef = useRef<THREE.Group>(null);
  const targetRotationYRef = useRef(0);

  const interactStore = useFirebaseCacheStore();
  const authStore     = useAuthStore();
  const playerDoc     = authStore.player;

  // Calcul du mouvement fluide et de la rotation vers la trajectoire
  useFrame(() => {
    if (!bodyRef.current) return;
    const keys = getKeys();
    const pos  = bodyRef.current.translation();
    const vel  = bodyRef.current.linvel();
    positionRef.current.set(pos.x, pos.y, pos.z);

    // 1. Calcul des Directions Relatives à l'Angle Actuel de la Caméra
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0; // Contraint sur le plan XZ
    camDir.normalize();

    const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x); // Perpendiculaire

    const moveVector = new THREE.Vector3();

    if (keys.forward)  moveVector.add(camDir);
    if (keys.backward) moveVector.sub(camDir);
    if (keys.left)     moveVector.sub(camRight);
    if (keys.right)    moveVector.add(camRight);

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();

      // Rotation douce de la maille du joueur vers le vecteur de déplacement
      targetRotationYRef.current = Math.atan2(moveVector.x, moveVector.z);
      
      const isSprinting = keys.jump || (keys as any).sprint || (keys as any).run;
      const speed = isSprinting ? 14.0 : 7.0; // Vitesse fluide et agréable
      
      moveVector.multiplyScalar(speed);
      bodyRef.current.setLinvel({ x: moveVector.x, y: vel.y, z: moveVector.z }, true);
    } else {
      // Décélération instantanée pour un contrôle sec et net
      bodyRef.current.setLinvel({ x: vel.x * 0.5, y: vel.y, z: vel.z * 0.5 }, true);
    }

    // 2. Animation de Pivotement Graphique
    if (proxyGroupRef.current) {
      const currentRot = proxyGroupRef.current.rotation.y;
      // Rotation interpolée (lerp angle)
      let diff = targetRotationYRef.current - currentRot;
      // Normalisation entre -PI et PI pour éviter un tour complet par l'arrière
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      proxyGroupRef.current.rotation.y += diff * 0.25;
    }

    // 3. Détection RP de Proximité
    const px = pos.x; const pz = pos.z;
    let newPrompt: string | null = null;

    if (Math.abs(px - 0) < 15 && Math.abs(pz - 0) < 15) {
      newPrompt = "🏪 Dépanneur EtherWorld · [E] Ouvrir Caisse / Acheter";
    } else if (Math.abs(px - 30) < 15 && Math.abs(pz - 0) < 15) {
      newPrompt = "🍷 S.A.P. Vins & Alcools · [E] Interagir Rayons";
    } else if (Math.abs(px - -30) < 15 && Math.abs(pz - 0) < 15) {
      newPrompt = "🔧 Garage Ti-Guy · [E] Réparer Véhicule (150 $)";
    } else if (Math.abs(px - 0) < 20 && Math.abs(pz - -60) < 20) {
      newPrompt = "🛏️ Motel des Laurentides · [E] Louer Chambre / Verrou";
    }

    onNearInteract(newPrompt);

    // 4. Déclencheur du Raccourci [E]
    if ((keys as any).interact || (keys as any).action) {
      if (newPrompt && onTriggerAction) {
        if (newPrompt.includes('Dépanneur')) {
          onTriggerAction("Dépanneur", "buy_coffee");
          interactStore.useInventoryItem("coffee");
        } else if (newPrompt.includes('Garage')) {
          onTriggerAction("Garage Ti-Guy", "repair_mech");
        } else if (newPrompt.includes('Motel')) {
          onTriggerAction("Motel Laurentides", "toggle_lock");
          interactStore.interactDoor("room_101", "unlock", "Motel");
        }
      }
    }
  });

  return (
    <>
      {/* 🛡️ ORBITCONTROls (Permet le pilotage à la souris 360° et le braquage de caméra) */}
      <OrbitControls
        target={positionRef.current}
        enablePan={false}
        maxPolarAngle={Math.PI / 2 - 0.05} // Empêche de plonger sous la map
        minDistance={3.0}
        maxDistance={25.0}
        makeDefault
      />

      <RigidBody
        ref={bodyRef}
        type="dynamic"
        position={positionRef.current}
        enabledRotations={[false, false, false]} // Empêche le basculement ou la torsion physique
      >
        <CuboidCollider args={[0.5, 1.8, 0.5]} friction={0.0} restitution={0.0} />

        {/* PROXY GRAPHIQUE (Polymorphe selon les tenues et le Sac à dos) */}
        <group ref={proxyGroupRef}>
          {/* Tête */}
          <mesh position={[0, 3.2, 0]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.5} />
          </mesh>
          
          {/* Col en Fourrure si Veste d'Hiver */}
          {playerDoc?.clothingStyle === 'parka' && (
            <mesh position={[0, 2.8, 0]}>
              <torusGeometry args={[0.5, 0.2, 12, 24]} />
              <meshStandardMaterial color="#64748b" roughness={0.9} />
            </mesh>
          )}

          {/* Torse Veste */}
          <mesh position={[0, 1.9, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.45, 1.8, 16]} />
            <meshStandardMaterial
              color={
                playerDoc?.clothingStyle === 'parka'  ? "#0f172a" :
                playerDoc?.clothingStyle === 'worker' ? "#ea580c" :
                playerDoc?.clothingStyle === 'police' ? "#090d16" :
                playerDoc?.clothingStyle === 'mecano' ? "#334155" : "#0284c7"
              }
              roughness={0.7}
            />
          </mesh>

          {/* Bandes Réflectives si Worker High-Vis */}
          {playerDoc?.clothingStyle === 'worker' && [-0.4, 0.4].map((by, bidx) => (
            <mesh key={bidx} position={[0, 1.9 + by, 0]}>
              <cylinderGeometry args={[0.56, 0.56, 0.15, 16]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}

          {/* Jambes Trousers */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.28, 1.2, 16]} />
            <meshStandardMaterial color={playerDoc?.clothingStyle === 'worker' ? "#1e293b" : "#0f172a"} />
          </mesh>

          {/* SAC À DOS THREE.JS (Étape 6 Raccordée) */}
          {playerDoc?.equippedBackpack && (
            <group position={[0, 2.0, -0.65]}>
              {/* Main Bag */}
              <mesh castShadow>
                <boxGeometry args={[0.7, 0.9, 0.35]} />
                <meshStandardMaterial color="#10b981" roughness={0.8} /> {/* Vert SAAQ */}
              </mesh>
              {/* Sleeping Tent Roll */}
              <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.18, 0.18, 0.8, 16]} />
                <meshStandardMaterial color="#475569" />
              </mesh>
            </group>
          )}
        </group>
      </RigidBody>
    </>
  );
};

/**
 * 2. Moteur de Conduite de Véhicules (Phase 4)
 */
interface VehicleProps {
  mode: GameplayMode;
  positionRef: React.MutableRefObject<THREE.Vector3>;
  onExitVehicle: () => void;
}

const VehicleController: React.FC<VehicleProps> = ({ mode, positionRef, onExitVehicle }) => {
  const { camera }  = useThree();
  const [, getKeys] = useKeyboardControls();
  const vBodyRef    = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (!vBodyRef.current) return;
    const vPos = vBodyRef.current.translation();
    const vRot = vBodyRef.current.rotation();
    positionRef.current.set(vPos.x, vPos.y, vPos.z);

    if (mode === 'driving') {
      const keys = getKeys();
      const moveDir = new THREE.Vector3();
      let turnAngle = 0;

      if (keys.forward)  moveDir.z -= 1;
      if (keys.backward) moveDir.z += 1;
      if (keys.left)     turnAngle += 0.035;
      if (keys.right)    turnAngle -= 0.035;

      if (turnAngle !== 0) {
        const vQuat = new THREE.Quaternion(vRot.x, vRot.y, vRot.z, vRot.w);
        const currentEuler = new THREE.Euler().setFromQuaternion(vQuat);
        currentEuler.y += turnAngle;
        const nextQuat = new THREE.Quaternion().setFromEuler(currentEuler);
        vBodyRef.current.setRotation(nextQuat, true);
      }

      if (moveDir.z !== 0) {
        const vQuat = new THREE.Quaternion(vRot.x, vRot.y, vRot.z, vRot.w);
        const fwd = new THREE.Vector3(0, 0, moveDir.z).applyQuaternion(vQuat);
        const speed = keys.jump ? 38.0 : 25.0; // Vitesse de route plaisante
        fwd.multiplyScalar(speed);
        vBodyRef.current.setLinvel({ x: fwd.x, y: vBodyRef.current.linvel().y, z: fwd.z }, true);
      } else {
        const vel = vBodyRef.current.linvel();
        vBodyRef.current.setLinvel({ x: vel.x * 0.95, y: vel.y, z: vel.z * 0.95 }, true);
      }

      const vQuat = new THREE.Quaternion(vRot.x, vRot.y, vRot.z, vRot.w);
      const backwardOffset = new THREE.Vector3(0, 5.0, 14.0).applyQuaternion(vQuat);
      const targetCam = new THREE.Vector3().copy(positionRef.current).add(backwardOffset);
      camera.position.lerp(targetCam, 0.15);
      camera.lookAt(vPos.x, vPos.y + 1.5, vPos.z);
    }
  });

  return (
    <RigidBody ref={vBodyRef} type={mode === 'driving' ? "dynamic" : "fixed"} position={positionRef.current} enabledRotations={[false, true, false]}>
      <CuboidCollider args={[1.6, 1.2, 3.2]} friction={0.8} restitution={0.1} />
      <group>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[3.2, 1.2, 6.4]} />
          <meshStandardMaterial color={mode === 'driving' ? "#dc2626" : "#475569"} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.0, -0.5]} castShadow>
          <boxGeometry args={[2.8, 1.0, 3.5]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.7} roughness={0.1} />
        </mesh>
        {[-1.6, 1.6].map((wx, i) => (
          <group key={i}>
            {[-2.0, 2.0].map((wz, j) => (
              <mesh key={j} position={[wx, 0.5, wz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.6, 0.6, 0.4, 16]} />
                <meshStandardMaterial color="#111827" roughness={0.9} />
              </mesh>
            ))}
          </group>
        ))}
        {mode === 'driving' && [-1.2, 1.2].map((lx, idx) => (
          <spotLight
            key={idx}
            position={[lx, 1.2, -3.3]}
            angle={0.6}
            penumbra={0.4}
            intensity={3.5}
            distance={100}
            color="#fffaed"
            castShadow
          />
        ))}
      </group>
    </RigidBody>
  );
};

/**
 * 3. UI Overlay
 */
interface OverlayProps {
  prompt: string | null;
  mode: GameplayMode;
  onToggleDrive: () => void;
}

const InteractionOverlay: React.FC<OverlayProps> = ({ prompt, mode, onToggleDrive }) => {
  return (
    <Html position={[0, 0, 0]} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 30, userSelect: 'none' }}>
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', pointerEvents: 'auto' }}>
        
        {prompt && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              backdropFilter: 'blur(12px)',
              border: '2px solid #38bdf8',
              borderRadius: '16px',
              padding: '16px 28px',
              color: '#f8fafc',
              fontFamily: 'monospace',
              fontSize: 15,
              fontWeight: 'bold',
              letterSpacing: 1,
              boxShadow: '0 12px 35px rgba(0,0,0,0.8), 0 0 20px rgba(56, 189, 248, 0.4)',
              textAlign: 'center',
              animation: 'pulse 2s infinite',
            }}
          >
            ✨ {prompt}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={onToggleDrive}
            style={{
              background: mode === 'walking' ? '#22c55e' : '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}
          >
            {mode === 'walking' ? '🚙 Monter dans le Véhicule (Proche)' : '🚶 Sortir du Véhicule'}
          </button>
        </div>
      </div>
    </Html>
  );
};

export default GameplayController;
