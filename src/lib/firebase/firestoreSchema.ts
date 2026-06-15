/**
 * src/lib/firebase/firestoreSchema.ts
 * 
 * Schéma de données Exhaustif et Enrichi pour EtherWorld RP (Production).
 * Spécifie la structure immuable des entités RP persistantes réparties en 7 collections maîtresses.
 * Sert de contrat strict entre le Store Zustand (authStore, playerSaveStore) et le Serveur Node Autoritaire.
 */

export type Role = 'player' | 'moderator' | 'admin' | 'owner';
export type JobCategory = 'civil' | 'police' | 'medic' | 'mecano' | 'travailleur' | 'restaurateur' | 'chauffeur';
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
export type SeasonType  = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * 1. users/{uid} — Compte & Identité de Base
 */
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  lastLogin: number;
  banned: boolean;
  banReason?: string;
  role: Role;
  clientPreferences?: {
    graphicsQuality: 'low' | 'medium' | 'high';
    audioVolume: number;
    showDebugHUD: boolean;
  };
}

/**
 * 2. players/{uid} — Avatar In-Character (IC) et Métriques RP Enrichies
 */
export interface PlayerDocument {
  uid: string;
  firstName: string;
  lastName: string;
  cash: number;       // Liquide sur le joueur
  bank: number;       // Compte en banque (non modifiable en direct par le client)
  health: number;     // 0 - 100
  armor: number;      // 0 - 100
  hunger: number;     // 0 - 100
  thirst: number;     // 0 - 100
  stamina: number;    // 0 - 100
  stress: number;     // 0 - 100
  wantedLevel: number;// 0 - 5 (Étoiles de recherche Police)
  job: JobCategory;
  gang?: string;      // Affiliation criminelle ou entreprise privée
  licenses: {
    driver: boolean;
    weapon: boolean;
    hunting: boolean;
    business: boolean;
  };
  position: [number, number, number]; // [x, y, z]
  rotation: [number, number, number]; // [x, y, z] en Euler ou Quaternion
  currentZone: string;// Route 138, Portneuf, Limoilou, Centre-Ville...
  spawnPoint: string; // 'last_position' | 'hospital' | 'motel' | 'police_station'
  equippedBackpack: boolean; // Affichage visuel du sac à dos 3D
  clothingStyle?: string;    // Affichage visuel de la tenue 3D
  lastSeen: number;   // Timestamp du dernier autosave/ping
}

/**
 * 3. inventories/{uid} — Stockage & Encombrement RP
 */
export interface InventoryItem {
  id: string;
  definitionId: string; // 'coffee', 'burger', 'service_pistol', 'motel_key', 'repair_kit'
  name: string;
  quantity: number;
  weight: number;       // Poids unitaire en kg
  metadata?: Record<string, any>;
}

export interface InventoryDocument {
  uid: string;
  slots: Array<InventoryItem | null>;   // 40 emplacements exacts
  hotbar: Array<InventoryItem | null>;  // 6 emplacements raccourcis (1-6)
  maxWeight: number;                    // Ex: 35.0 kg
  currentWeight: number;                // Calculé en direct
  hasBackpack: boolean;                 // Règle du sac à dos 3D
  updatedAt: number;
}

/**
 * 4. vehicles/{vehicleId} — Flotte Automobile
 */
export interface VehicleDocument {
  vehicleId: string;
  ownerUid: string;
  plate: string;      // Plaque d'immatriculation QC (ex: 'QC-138-RP')
  model: string;      // 'sedan_qc', 'pickup_138', 'police_cruiser'
  color: string;      // Hex ou nom
  fuel: number;       // 0 - 100
  engineHealth: number;// 0 - 100
  bodyHealth: number;  // 0 - 100
  locked: boolean;
  position: [number, number, number];
  rotationY: number;
  garageId?: string;  // ID du garage si stationné
  impounded: boolean; // Saisi par la police
}

/**
 * 5. properties/{propertyId} — Immobilier, Maisons et Motels
 */
export interface PropertyDocument {
  propertyId: string;
  ownerUid: string;     // 'server_admin' ou UID d'un joueur
  type: 'house' | 'apartment' | 'motel_room' | 'business' | 'warehouse';
  address: string;
  locked: boolean;
  storage: {
    maxWeight: number;
    items: InventoryItem[];
  };
  tenants: string[];    // Liste des colocataires/locataires
  accessList: string[]; // UIDs autorisés à déverrouiller
}

/**
 * 6. worldState/global — Météo, Économie & Événements
 */
export interface WorldStateDocument {
  weather: WeatherType;
  timeOfDay: number;    // Heure en décimal (ex: 14.5 = 14h30)
  season: SeasonType;
  activeEvents: string[];// ['storm_alert', 'market_boom', 'route_construction']
  economyState: {
    taxRate: number;
    inflation: number;
    gasPrice: number;
  };
  updatedAt: number;
}

/**
 * 7. accessLogs/{logId} — Traces d'Interaction de Sécurité
 */
export interface AccessLogDocument {
  logId: string;
  uid: string;
  action: 'unlock_door' | 'lock_door' | 'open_safe' | 'buy_item' | 'atm_withdraw' | 'duty_change';
  target: string;       // ID de la porte, coffre, ou objet
  result: 'success' | 'denied' | 'unauthorized';
  createdAt: number;
  ipHash: string;
  zone: string;
}
