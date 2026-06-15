// src/components/hotel/firebase/featureFlags.ts

/**
 * Feature flags pour l'hôtel.
 * Anti-casse #14: utiliser des feature flags pour les nouvelles fonctions.
 */

export interface HotelFeatureFlags {
  /** Système de serrure connectée actif */
  smartLocks: boolean;
  /** Coffre-fort avec code digital */
  digitalSafes: boolean;
  /** Interphone entre chambres */
  intercom: boolean;
  /** Système de réservation en ligne */
  reservations: boolean;
  /** Achat permanent de chambres */
  propertyPurchase: boolean;
  /** Caméras de sécurité avec flux */
  securityCameras: boolean;
  /** Thermostat connecté */
  smartThermostat: boolean;
  /** Système de housekeeping */
  housekeeping: boolean;
  /** Ascenseur animé */
  animatedElevator: boolean;
  /** Portes animées */
  animatedDoors: boolean;
  /** Éclairage dynamique jour/nuit */
  dynamicLighting: boolean;
  /** Balcons (futur) */
  balconies: boolean;
}

const DEFAULT_FLAGS: HotelFeatureFlags = {
  smartLocks: true,
  digitalSafes: true,
  intercom: false,
  reservations: true,
  propertyPurchase: true,
  securityCameras: false,
  smartThermostat: true,
  housekeeping: true,
  animatedElevator: true,
  animatedDoors: false,
  dynamicLighting: false,
  balconies: false,
};

let _flags: HotelFeatureFlags = { ...DEFAULT_FLAGS };

export function getFeatureFlags(): HotelFeatureFlags {
  return { ..._flags };
}

export function setFeatureFlags(flags: Partial<HotelFeatureFlags>): void {
  _flags = { ..._flags, ...flags };
}

export function isFeatureEnabled(flag: keyof HotelFeatureFlags): boolean {
  return _flags[flag] ?? false;
}

/**
 * Charge les feature flags depuis Firebase Remote Config ou Firestore.
 */
export async function loadFeatureFlags(): Promise<void> {
  try {
    const response = await fetch('/api/hotel/config/feature-flags');
    if (response.ok) {
      const flags = await response.json();
      _flags = { ...DEFAULT_FLAGS, ...flags };
    }
  } catch {
    console.warn('[FeatureFlags] Failed to load from server, using defaults');
  }
}