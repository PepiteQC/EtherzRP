/**
 * src/buildings/index.ts
 * 
 * Barrel export for the new modular buildings architecture.
 * 
 * Everything is feature-flag gated at usage site (BuildingsScene).
 * No side effects on import.
 */

export * from './shared/featureFlags';
export * from './shared/types';

export {
  HotelRegistry,
  HOTEL_ARCH,
  HOTEL_BUILDING,
  HOTEL_FLOORS,
  HOTEL_ROOMS,
  HOTEL_DOORS,
  HOTEL_LOCKS,
  HOTEL_RECEPTION,
  HOTEL_ELEVATOR_SHAFT,
  HOTEL_SECURITY_DEFAULTS,
} from './hotel/core/HotelRegistry';
export { HotelScene } from './hotel/scenes/HotelScene';
export { HotelFloorModule } from './hotel/modules/floor/HotelFloorModule';
export { HotelRoomModule } from './hotel/modules/room/HotelRoomModule';
export { HotelRoomArchitecture } from './hotel/modules/room/HotelRoomArchitecture';
export * from './hotel/security';
export {
  attemptRoomAccess,
  attemptRoomEntry,
  attemptRoomWithMagneticCard,
  attemptRoomWithNumpad,
  createHotelSecurityFirebaseSeed,
} from './hotel/services/HotelAccessService';

export {
  DepanneurRegistry,
  DEPANNEUR_BUILDING,
  DEPANNEUR_ZONES,
  DEPANNEUR_FIXTURES,
  DEPANNEUR_INVENTORY,
  DEPANNEUR_CAMERAS,
} from './depanneur/core/DepanneurRegistry';
export {
  DEPANNEUR_FIREBASE_PATHS,
  createDepanneurFirebaseSeed,
  createInventoryPatch,
  createSaleEvent,
} from './depanneur/core/DepanneurFirebase';
export { DepanneurScene } from './depanneur/scenes/DepanneurScene';
export { DepanneurInteriorScene } from './depanneur/scenes/DepanneurInteriorScene';

export { BuildingsScene } from './BuildingsScene';
