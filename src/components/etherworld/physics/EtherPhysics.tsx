import React, { ReactNode } from 'react'
import { Physics } from '@react-three/rapier'
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
