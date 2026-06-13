/**
 * src/weapons/integration/WeaponPlayerAttachment.tsx
 * Emplacement exact: /home/user/etherworld/src/weapons/integration/WeaponPlayerAttachment.tsx
 * 
 * PHASE 2/3 — Intégration non-intrusive sur le personnage.
 * - Affiche l'arme en main (hands) avec visée/recul.
 * - Affiche armes rangées (holster/back/belt) sur le modèle du joueur.
 * - Gère inputs via useWeaponInput (passe l'état réel du joueur).
 * - Utilise Rapier (useRapier) pour raycasts de tir (collisionGroups pour filtrer players/decors/vehicles/ragdoll).
 * - Synchronise états avec character (sprint/fall/interaction block via props).
 * - À placer à l'intérieur du <group> du PlayerCharacter (déjà fait dans player-character.tsx).
 * - Prêt pour vrais skeletons + GLTF plus tard.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { useWeaponStore } from '../store/weaponStore';
import { WeaponModel } from '../components/WeaponModel';
import { weaponManager } from '../systems/WeaponManager';
import { useWeaponInput } from '../hooks/useWeaponInput';
import type { WeaponInstance } from '../types/weapon';

interface WeaponPlayerAttachmentProps {
  playerPosition: [number, number, number];
  cameraYaw: number;
  characterState: string;
  isSprinting: boolean;
  movementSpeed: number;
  stamina: number;
  posture: string; // 'stand' | 'crouch' | 'prone' | 'sprint' etc.
  isInInterface: boolean;
}

export function WeaponPlayerAttachment(props: WeaponPlayerAttachmentProps) {
  const {
    playerPosition,
    cameraYaw,
    characterState,
    isSprinting,
    movementSpeed,
    stamina,
    posture,
    isInInterface,
  } = props;

  const { world } = useRapier();
  const store = useWeaponStore();
  const groupRef = useRef<THREE.Group>(null!);

  // Hook inputs — passe l'état joueur réel (position, cam, stamina, posture, characterState)
  useWeaponInput(() => ({
    position: playerPosition,
    cameraYaw,
    isSprinting,
    movementSpeed,
    stamina,
    posture,
    characterState,
    isInInterface,
  }));

  // Mise à jour manager + sync recoil + blocages chaque frame
  useFrame((_, delta) => {
    // Sync avec character (blocages sprint/fall etc)
    store.syncWithCharacterState(characterState, isSprinting);

    // Manager update (pour futur logique continue)
    weaponManager['update']?.(delta, {
      characterState,
      isSprinting,
      movementSpeed,
      stamina,
      posture,
      isInInterface,
      position: playerPosition,
      cameraYaw,
    });

    // Recoil caméra léger (le vrai recoil est appliqué dans le PlayerCharacter via le store)
    const recoil = store.recoilAmount;
    if (recoil > 0.01 && groupRef.current) {
      // Optionnel: léger tilt du groupe arme
      groupRef.current.rotation.z = (Math.random() - 0.5) * recoil * 0.03;
    }
  });

  const handsWeapon: WeaponInstance | null = store.equippedSlots.hands;
  const holsterWeapon: WeaponInstance | null = store.equippedSlots.holster;
  const backWeapon: WeaponInstance | null = store.equippedSlots.back;
  const beltWeapon: WeaponInstance | null = store.equippedSlots.belt;

  const isAiming = store.isAiming();
  const isFiring = store.isFiring;

  // Fonction raycast Rapier pour le tir (passée à fire system via manager)
  const performRapierRaycast = (origin: [number, number, number], direction: [number, number, number], maxDistance: number) => {
    try {
      const ray = new (require('@react-three/rapier').Ray)(origin, direction);
      // Collision groups: player=1, decors=2, vehicle=4, ragdoll=8 (filtre projectiles)
      const collisionGroups = 0b0111; // player | decors | vehicle
      const hit = world.castRay(ray, maxDistance, true, undefined, undefined, collisionGroups);
      return hit;
    } catch {
      return null;
    }
  };

  return (
    <group ref={groupRef}>
      {/* ARME EN MAIN (visible quand sortie / visée / tir) */}
      {handsWeapon && (
        <group
          position={[0.12, 1.28, 0.08]}
          rotation={[0.18, -0.12, 0.78]}
        >
          <WeaponModel
            weapon={handsWeapon}
            slot="hands"
            isAiming={isAiming}
            isFiring={isFiring}
          />
        </group>
      )}

      {/* ARME AU HOLSTER (côté droit) — visible quand rangée et pas en main */}
      {holsterWeapon && !handsWeapon && (
        <group position={[0.22, 1.05, -0.18]} rotation={[0.6, 0.3, 1.9]}>
          <WeaponModel weapon={holsterWeapon} slot="holster" />
        </group>
      )}

      {/* ARME DANS LE DOS (carabines / fusils) */}
      {backWeapon && (
        <group position={[-0.35, 1.55, -0.45]} rotation={[-0.4, 0.1, 2.8]}>
          <WeaponModel weapon={backWeapon} slot="back" />
        </group>
      )}

      {/* ARME À LA CEINTURE (couteaux / objets) */}
      {beltWeapon && (
        <group position={[0.0, 1.05, 0.28]} rotation={[1.1, 0.2, 0.4]}>
          <WeaponModel weapon={beltWeapon} slot="belt" />
        </group>
      )}

      {/* TODO futur: vrais modèles GLTF + attachement bones du rig ragdoll */}
      {/* <primitive object={gltf.scene} ... attach to hand bone /> */}
    </group>
  );
}
