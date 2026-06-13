/**
 * src/buildings/BuildingsScene.tsx
 * 
 * Non-intrusive entrypoint for the new modular Hôtel + Dépanneur architecture.
 * 
 * - Only renders when feature flags are enabled
 * - Keeps old hotel-ultra + DepanneurCoucheTard + city-scene 100% untouched
 * - Progressive integration (per user's plan)
 * - Uses stable registry + reusable modules
 * 
 * Anti-casse:
 * - Gated by featureFlags
 * - Separate from all prior buildings code
 * - No deletions
 * - Simulator-only access for now
 */

import { memo } from 'react';
import { isHotelEnabled, isDepanneurEnabled } from './shared/featureFlags';
import { HotelScene } from './hotel/scenes/HotelScene';
import { DepanneurScene } from './depanneur/scenes/DepanneurScene';

interface BuildingsSceneProps {
  onHotelRoomDoorClick?: (roomId: string) => void;
  onDepanneurEnter?: () => void;
}

export const BuildingsScene = memo(function BuildingsScene({
  onHotelRoomDoorClick,
  onDepanneurEnter,
}: BuildingsSceneProps) {
  const hotelOn = isHotelEnabled();
  const depanneurOn = isDepanneurEnabled();

  if (!hotelOn && !depanneurOn) {
    return null; // zero impact on existing scene
  }

  return (
    <group>
      {hotelOn && (
        <HotelScene
          onRoomDoorClick={onHotelRoomDoorClick}
          showRoof={true}
        />
      )}

      {depanneurOn && (
        <DepanneurScene
          onEnter={onDepanneurEnter}
        />
      )}
    </group>
  );
});
