/**
 * src/buildings/depanneur/scenes/DepanneurInteriorScene.tsx
 *
 * Scène intérieure isolée du dépanneur pour transitions RP:
 * - Peut être rendue seule dans un Canvas intérieur.
 * - Utilise le même registry que la scène extérieure.
 * - Aucun Rapier requis, compatible Three.js/React direct.
 */

import { memo } from 'react'
import { Text } from '@react-three/drei'
import { DepanneurScene } from './DepanneurScene'
import type { DepanneurFixture, DepanneurZone } from '../core/DepanneurTypes'

interface DepanneurInteriorSceneProps {
  onExit?: () => void
  onFixtureClick?: (fixture: DepanneurFixture) => void
  onZoneClick?: (zone: DepanneurZone) => void
  debug?: boolean
}

export const DepanneurInteriorScene = memo(function DepanneurInteriorScene({
  onExit,
  onFixtureClick,
  onZoneClick,
  debug = false,
}: DepanneurInteriorSceneProps) {
  return (
    <group position={[-80, 0, 60]}>
      <DepanneurScene
        onEnter={onExit}
        onFixtureClick={onFixtureClick}
        onZoneClick={onZoneClick}
        showDebugZones={debug}
      />

      <Text position={[80, 2.2, 69.4]} fontSize={0.22} color="#86efac" anchorX="center">
        E — Sortir du dépanneur
      </Text>
    </group>
  )
})
