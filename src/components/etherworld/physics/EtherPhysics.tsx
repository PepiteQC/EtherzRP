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
}
