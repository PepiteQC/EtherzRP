/**
 * src/weapons/types/weapon.ts
 * Types complets pour le système d'armes EtherWorld QC RP
 * Respecte exactement le spec "TODO ULTIME — SYSTÈME ARMES"
 * Catégories: pistol, carabine, fusil, arme_de_service, couteau, objet_improvise
 * Séparation stats visuelles / serveur / gameplay
 */

export type WeaponCategory =
  | 'pistol'
  | 'carabine'
  | 'fusil'
  | 'arme_de_service'
  | 'couteau'
  | 'objet_improvise';

export type WeaponRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type WeaponTier = 'legal' | 'restricted' | 'blackmarket' | 'admin_only';

export type WeaponSlot = 'holster' | 'back' | 'belt' | 'hands' | 'inventory';

export type WeaponState =
  | 'rangée'
  | 'sortie'
  | 'visée'
  | 'tir'
  | 'recul'
  | 'rechargement'
  | 'inspection'
  | 'enrayée'
  | 'vide'
  | 'sécurisée';

export type FireMode = 'semi' | 'auto' | 'bolt';

export type AimMode = 'hip' | 'aim';

export type WeaponEquipStatus = 'normal' | 'disabled' | 'seized' | 'stolen' | 'registered';

export type MaterialType = 'concrete' | 'wood' | 'metal' | 'glass' | 'ground' | 'flesh' | 'vehicle';

// ═══════════════════════════════════════════════════════════════
// STATS SÉPARÉES (visuel / serveur / gameplay)
// ═══════════════════════════════════════════════════════════════

export interface VisualStats {
  modelKey: string;           // clé pour modèle 3D (ex: 'glock19', 'rem700')
  scale: number;
  offset: [number, number, number]; // position relative sur perso
  rotation: [number, number, number];
  holsterOffset?: [number, number, number];
  backOffset?: [number, number, number];
}

export interface ServerStats {
  weight: number;             // kg
  durabilityMax: number;      // 0-100
  rarity: WeaponRarity;
  tier: WeaponTier;
  permissions: string[];      // ex: ['PPA-R', 'PAA']
  legalQuebec: boolean;
  value: number;              // prix légal ou blackmarket
}

export interface GameplayStats {
  damage: number;             // 1-200
  fireRate: number;           // rpm (0 = bolt)
  range: number;              // mètres fictifs
  recoil: number;             // 1-100
  dispersionBase: number;     // degrés
  magCapacity: number;
  chamberCapacity: number;    // 0 ou 1
  reloadTime: number;         // secondes
  ammoType: string;           // virtuel ex: '9mm', '12ga', 'none'
  fireMode: FireMode;
  penetration: number;        // %
  isMelee: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ARME COMPLÈTE (registry entry)
// ═══════════════════════════════════════════════════════════════

export interface WeaponDefinition {
  id: string;
  nomRP: string;
  category: WeaponCategory;
  visual: VisualStats;
  server: ServerStats;
  gameplay: GameplayStats;

  // RP / état
  etat: WeaponEquipStatus;
  durabilite: number;         // courant 0-100

  // Animations & Sons (clés pour loader)
  animations: {
    draw: string;
    holster: string;
    fire: string;
    reload: string;
    inspect: string;
    aimIn: string;
    aimOut: string;
  };
  sounds: {
    fire: string;
    dryFire: string;
    reload: string;
    bolt: string;
    impact?: Record<MaterialType, string>;
    alert?: string;           // alerte sécurité
  };

  // Flags spéciaux
  canBeRegistered: boolean;
  canBeSeized: boolean;
  requiresLicense?: string;
  tags: string[];
}

// ═══════════════════════════════════════════════════════════════
// INSTANCE D'ARME (dans inventaire / équipé)
// ═══════════════════════════════════════════════════════════════

export interface WeaponInstance {
  instanceId: string;         // unique par item (uuid ou timestamp)
  definitionId: string;       // référence vers WeaponDefinition.id
  currentDurability: number;
  currentState: WeaponState;
  currentSlot: WeaponSlot;
  ammoInMag: number;
  ammoInChamber: number;
  ammoReserve: number;
  fireModeIndex: number;      // pour cycle semi/auto/bolt
  isSafetyOn: boolean;
  lastFiredAt: number;
  lastReloadAt: number;
  isEnrayee: boolean;
  metadata?: Record<string, any>; // ex: registeredTo, serial
}

// ═══════════════════════════════════════════════════════════════
// SLOTS ÉQUIPEMENT (PHASE 2)
// ═══════════════════════════════════════════════════════════════

export interface EquipmentSlots {
  holster: WeaponInstance | null;
  back: WeaponInstance | null;
  belt: WeaponInstance | null;
  hands: WeaponInstance | null;
  inventory: WeaponInstance[];   // les armes rangées dans inventaire général
}

// ═══════════════════════════════════════════════════════════════
// ÉTAT COMPLET ARME (pour store)
// ═══════════════════════════════════════════════════════════════

export interface WeaponSystemState {
  equippedSlots: EquipmentSlots;
  selectedWeaponId: string | null;   // instanceId courant
  currentState: WeaponState;
  isAiming: boolean;
  currentAimMode: AimMode;
  isFiring: boolean;
  isReloading: boolean;
  recoilAmount: number;              // 0-1 pour caméra
  dispersionModifier: number;        // multiplicateur actuel
  lastShotTime: number;
  pendingReloadInterrupt: boolean;
  quickWheelOpen: boolean;
  keybinds: Record<string, string>;  // configurable
}

// ═══════════════════════════════════════════════════════════════
// RÉSULTATS D'ACTIONS
// ═══════════════════════════════════════════════════════════════

export interface EquipResult {
  success: boolean;
  reason?: string;
  newSlot?: WeaponSlot;
  instance?: WeaponInstance;
}

export interface FireResult {
  success: boolean;
  reason?: string;
  hit?: {
    targetId?: string;
    position: [number, number, number];
    material: MaterialType;
    damageDealt: number;
  };
  recoilApplied: number;
  newAmmoInMag: number;
  newAmmoInChamber: number;
}

export interface ReloadResult {
  success: boolean;
  reason?: string;
  ammoAdded: number;
  interrupted: boolean;
}

export interface ImpactData {
  position: [number, number, number];
  normal: [number, number, number];
  material: MaterialType;
  weaponId: string;
  damage: number;
  holeId?: string; // pour trous limités
}
