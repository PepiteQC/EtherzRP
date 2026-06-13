/**
 * src/buildings/shared/featureFlags.ts
 * 
 * Feature flags for progressive, non-breaking integration of modular Hôtel + Dépanneur.
 * All new buildings logic is gated here.
 * Default: everything OFF to protect existing hotel-ultra / DepanneurCoucheTard / player-character / city-scene.
 * 
 * Anti-casse rules followed:
 * - Never test on occupied door (simulator only for now)
 * - Simulator before real hardware
 * - Separate collections, files, logic
 * - Feature flags for new functions
 */

export const BUILDINGS_FEATURES = {
  // Master switch — when false, BuildingsScene renders nothing.
  ENABLE_BUILDINGS: false,

  // Independent enable for each building (visual + logic separation)
  ENABLE_HOTEL: false,
  ENABLE_DEPANNEUR: false,

  // Access control layer (must stay on simulator until Phase 4-5)
  ACCESS_SIMULATOR_ONLY: true,   // Never allow browser → real lock
  ENABLE_PROPERTY_TITLES: false,
  ENABLE_TEMPORARY_ACCESS: false,

  // 3D details (architectural vs decorative)
  ENABLE_RECEPTION_VOLUME: false,
  ENABLE_STAIRWELLS: false,
  ENABLE_ELEVATOR_SHAFT: false,
  ENABLE_SAFES_IN_ROOMS: false,

  // Future real hardware path (locked behind flags + server)
  ENABLE_REAL_LOCK_HARDWARE: false,  // Never true until simulator + lab tests + rollback
  ENABLE_FIREBASE_SEPARATE_PROJECTS: false, // 3 projects: dev/staging/prod

  // Testing / rollback helpers
  ENABLE_TEST_NPC_IN_BUILDINGS: false,
  ENABLE_RAYCAST_DAMAGE_ON_HOTEL_DOORS: false, // J7 style, gated
} as const;

export type BuildingsFeature = keyof typeof BUILDINGS_FEATURES;

export function isFeatureEnabled(feature: BuildingsFeature): boolean {
  // In production this would read from env / remote config / Firestore flag doc.
  // For now: pure local constant (no uncontrolled auto-updates).
  return BUILDINGS_FEATURES[feature] === true;
}

// Convenience helpers (non-intrusive)
export const isBuildingsEnabled = () => isFeatureEnabled('ENABLE_BUILDINGS');
export const isHotelEnabled = () => isFeatureEnabled('ENABLE_HOTEL') && isBuildingsEnabled();
export const isDepanneurEnabled = () => isFeatureEnabled('ENABLE_DEPANNEUR') && isBuildingsEnabled();
export const isAccessSimulatorOnly = () => isFeatureEnabled('ACCESS_SIMULATOR_ONLY');

// Rollback helper (for future deployment notes)
export function getBuildingsRollbackNote(): string {
  return 'To rollback: set ENABLE_BUILDINGS=false in this file. Old hotel-ultra + DepanneurCoucheTard + city-scene remain 100% untouched.';
}
