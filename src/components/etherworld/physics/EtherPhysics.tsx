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
}
