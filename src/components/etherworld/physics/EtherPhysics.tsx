<<<<<<< HEAD
=======
<<<<<<< HEAD
import { Debug, Physics } from "@react-three/cannon";
import type { ReactNode } from "react";
import { ETHER_PHYSICS } from "./physicsConfig";

interface EtherPhysicsProps {
  children: ReactNode;
  debug?: boolean;
}

/**
 * Wrapper Cannon global pour EtherzRP.
 *
 * Important:
 * - Ce composant n'enlève pas les systèmes existants.
 * - Il ajoute une couche physique Cannon par-dessus le monde React Three Fiber.
 * - Les systèmes manuels actuels (véhicule, walker, save, intérieurs) continuent de fonctionner.
 * - Les nouveaux colliders invisibles servent de base pour l'évolution: collisions, props physiques,
 *   véhicules plus réalistes, ragdoll, objets poussables, etc.
 */
export default function EtherPhysics({ children, debug = false }: EtherPhysicsProps) {
  const content = debug ? (
    <Debug color="hotpink" scale={1.01}>
      {children}
    </Debug>
  ) : children;

  return (
    <Physics
      gravity={ETHER_PHYSICS.gravity}
      broadphase={ETHER_PHYSICS.broadphase}
      iterations={ETHER_PHYSICS.iterations}
      tolerance={ETHER_PHYSICS.tolerance}
      allowSleep={ETHER_PHYSICS.allowSleep}
      stepSize={ETHER_PHYSICS.stepSize}
      maxSubSteps={ETHER_PHYSICS.maxSubSteps}
      defaultContactMaterial={ETHER_PHYSICS.defaultContactMaterial}
    >
      {content}
    </Physics>
  );
=======
>>>>>>> 9cfcf813650b52c38febb2f6437efd1af52ab38c
import { Physics } from '@react-three/rapier'
import type { ReactNode } from 'react'
import { ETHER_PHYSICS } from './physicsConfig'

interface EtherPhysicsProps {
  children: ReactNode
  debug?: boolean
}

/**
 * Wrapper physique principal pour EtherzRP.
 *
 * Choix actuel: Rapier.
 * - Le projet avait déjà @react-three/rapier.
 * - Rapier est activement maintenu et WASM.
 * - Cannon reste présent pour certains anciens composants du repo, mais les nouveaux systèmes
 *   EtherzRP doivent passer par ce wrapper afin d'éviter de mélanger les mondes physiques.
 *
 * Important:
 * - Ce wrapper ne touche pas au personnage existant.
 * - Il sert de fondation pour colliders monde, props physiques, véhicules futurs et zones RP.
 */
export default function EtherPhysics({ children, debug = false }: EtherPhysicsProps) {
  return (
    <Physics
      gravity={ETHER_PHYSICS.gravity}
      timeStep={ETHER_PHYSICS.timeStep}
      interpolation={ETHER_PHYSICS.interpolation}
      updatePriority={ETHER_PHYSICS.updatePriority}
      debug={debug}
    >
      {children}
    </Physics>
  )
<<<<<<< HEAD
=======
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
>>>>>>> 9cfcf813650b52c38febb2f6437efd1af52ab38c
}
