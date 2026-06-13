// src/game/combat/CombatSystem.ts

import * as THREE from 'three';
import { create } from 'zustand';
import { EnvironmentEffects } from '../physics/AdvancedPhysics';

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type WeaponType =
  | 'pistol'
  | 'revolver'
  | 'smg'
  | 'shotgun'
  | 'rifle'
  | 'sniper'
  | 'grenade'
  | 'molotov'
  | 'knife'
  | 'bat'
  | 'taser'
  | 'pepper_spray'
  | 'flashbang';

export type AttachmentType =
  | 'scope'
  | 'silencer'
  | 'grip'
  | 'extended_mag'
  | 'laser'
  | 'flashlight';

export type DamageType = 'bullet' | 'melee' | 'explosion' | 'fire' | 'electric' | 'gas';

export type CoverQuality = 'none' | 'partial' | 'full';

// ═══════════════════════════════════════════════════════════════
//  INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface AttachmentStats {
  accuracy?:     number;
  damage?:       number;
  range?:        number;
  recoil?:       number;
  magazineSize?: number;
  noise?:        number;
}

export interface WeaponAttachment {
  id:    string;
  name:  string;
  type:  AttachmentType;
  stats: AttachmentStats;
  price: number;
}

export interface WeaponConfig {
  id:            string;
  name:          string;
  type:          WeaponType;
  damage:        number;
  range:         number;
  accuracy:      number;
  /** Coups par seconde */
  fireRate:      number;
  magazineSize:  number;
  currentAmmo:   number;
  reserveAmmo:   number;
  /** Secondes */
  reloadTime:    number;
  recoil:        number;
  bulletSpread:  number;
  attachments:   WeaponAttachment[];
  price:         number;
  illegal:       boolean;
}

export interface CombatState {
  isAiming:      boolean;
  isReloading:   boolean;
  isShooting:    boolean;
  isCovered:     boolean;
  coverQuality:  CoverQuality;
  health:        number;
  maxHealth:     number;
  armor:         number;
  maxArmor:      number;
  weaponDrawn:   boolean;
  currentWeapon: string | null;
  lastDamageTime: number;
  lastDamageType: DamageType | null;
}

export interface ShootResult {
  fired:       boolean;
  reason?:     'no_weapon' | 'no_ammo' | 'reloading' | 'on_cooldown';
  ammoLeft:    number;
  autoReloading: boolean;
}

export interface DamageResult {
  healthLost:  number;
  armorLost:   number;
  isDead:      boolean;
  armorBlocked: number;
}

export interface CoverPoint {
  position:    THREE.Vector3;
  quality:     CoverQuality;
  capacity:    number;
  occupied:    number;
}

// ═══════════════════════════════════════════════════════════════
//  STORE
// ═══════════════════════════════════════════════════════════════

interface CombatStore {
  weapons:        Record<string, WeaponConfig>;
  activeWeaponId: string | null;
  combat:         CombatState;
  fireCooldowns:  Record<string, number>; // weaponId → last fire timestamp

  // ── Weapon management ──────────────────────────────────────
  addWeapon:         (weapon: WeaponConfig) => void;
  removeWeapon:      (id: string) => void;
  equipWeapon:       (id: string) => boolean;
  holsterWeapon:     () => void;

  // ── Combat actions ─────────────────────────────────────────
  shoot:             () => ShootResult;
  reload:            () => boolean;
  aim:               (aiming: boolean) => void;
  setCovered:        (covered: boolean, quality?: CoverQuality) => void;

  // ── Health / Armor ─────────────────────────────────────────
  takeDamage:        (amount: number, type: DamageType) => DamageResult;
  heal:              (amount: number) => number;
  repairArmor:       (amount: number) => number;
  revive:            () => void;

  // ── Attachments ────────────────────────────────────────────
  addAttachment:     (weaponId: string, attachment: WeaponAttachment) => boolean;
  removeAttachment:  (weaponId: string, attachmentId: string) => boolean;

  // ── Queries ────────────────────────────────────────────────
  getActiveWeapon:   () => WeaponConfig | null;
  getEffectiveStats: (weaponId: string) => Omit<WeaponConfig, 'attachments'> | null;
  isDead:            () => boolean;
  canShoot:          () => boolean;
}

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Pourcentage de dégâts absorbé par l'armure */
const ARMOR_ABSORB_RATIO = 0.65;

/** Multiplicateurs de dégâts par type */
const DAMAGE_MULTIPLIERS: Record<DamageType, number> = {
  bullet:    1.0,
  melee:     0.9,
  explosion: 1.2,
  fire:      0.8,  // DoT — appliqué en plusieurs fois
  electric:  0.5,  // Taser
  gas:       0.3,  // Gaz poivré
};

const SHOOT_STATE_RESET_MS = 100;

// ═══════════════════════════════════════════════════════════════
//  PURE HELPERS
// ═══════════════════════════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calcule les stats effectives d'une arme en tenant compte
 * de tous ses accessoires (additions cumulatives).
 */
function computeEffectiveStats(weapon: WeaponConfig): WeaponConfig {
  const result = { ...weapon };

  for (const att of weapon.attachments) {
    const s = att.stats;
    if (s.accuracy     != null) result.accuracy     += s.accuracy;
    if (s.damage       != null) result.damage        += s.damage;
    if (s.range        != null) result.range         += s.range;
    if (s.recoil       != null) result.recoil        += s.recoil;
    if (s.magazineSize != null) result.magazineSize  += s.magazineSize;
  }

  // Clamp logical bounds
  result.accuracy    = clamp(result.accuracy,    0, 100);
  result.damage      = Math.max(0, result.damage);
  result.range       = Math.max(0, result.range);
  result.recoil      = Math.max(0, result.recoil);
  result.magazineSize = Math.max(1, result.magazineSize);

  return result;
}

/**
 * Calcule les dégâts réels infligés en tenant compte
 * de l'armure et du type de dégât.
 */
function computeDamage(
  rawAmount: number,
  type: DamageType,
  currentArmor: number
): { healthLost: number; armorLost: number; armorBlocked: number } {
  const multiplied = rawAmount * (DAMAGE_MULTIPLIERS[type] ?? 1.0);
  let remaining = multiplied;
  let armorLost = 0;
  let armorBlocked = 0;

  if (currentArmor > 0) {
    const maxAbsorb = multiplied * ARMOR_ABSORB_RATIO;
    armorBlocked = Math.min(maxAbsorb, currentArmor);
    armorLost    = armorBlocked;
    remaining   -= armorBlocked;
  }

  return {
    healthLost:   Math.max(0, remaining),
    armorLost,
    armorBlocked,
  };
}

// ═══════════════════════════════════════════════════════════════
//  STORE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_COMBAT_STATE: CombatState = {
  isAiming:       false,
  isReloading:    false,
  isShooting:     false,
  isCovered:      false,
  coverQuality:   'none',
  health:         100,
  maxHealth:      100,
  armor:          0,
  maxArmor:       100,
  weaponDrawn:    false,
  currentWeapon:  null,
  lastDamageTime: 0,
  lastDamageType: null,
};

export const useCombatStore = create<CombatStore>((set, get) => ({
  weapons:        {},
  activeWeaponId: null,
  combat:         { ...DEFAULT_COMBAT_STATE },
  fireCooldowns:  {},

  // ── Weapon management ──────────────────────────────────────

  addWeapon: (weapon) => {
    set((state) => ({
      weapons: { ...state.weapons, [weapon.id]: weapon },
    }));
  },

  removeWeapon: (id) => {
    set((state) => {
      const { [id]: _removed, ...rest } = state.weapons;
      const wasActive = state.activeWeaponId === id;
      return {
        weapons: rest,
        activeWeaponId: wasActive ? null : state.activeWeaponId,
        combat: wasActive
          ? { ...state.combat, weaponDrawn: false, currentWeapon: null }
          : state.combat,
      };
    });
  },

  equipWeapon: (id) => {
    const { weapons, combat } = get();
    if (!weapons[id]) return false;

    set({
      activeWeaponId: id,
      combat: { ...combat, weaponDrawn: true, currentWeapon: id },
    });
    return true;
  },

  holsterWeapon: () => {
    set((state) => ({
      activeWeaponId: null,
      combat: { ...state.combat, weaponDrawn: false, currentWeapon: null, isAiming: false },
    }));
  },

  // ── Combat actions ─────────────────────────────────────────

  shoot: () => {
    const state = get();
    const weapon = state.weapons[state.activeWeaponId ?? ''];

    if (!weapon) {
      return { fired: false, reason: 'no_weapon', ammoLeft: 0, autoReloading: false };
    }

    // Melee weapons don't use ammo
    const isMelee = weapon.type === 'knife' || weapon.type === 'bat';

    if (!isMelee && weapon.currentAmmo <= 0) {
      const autoReloading = weapon.reserveAmmo > 0;
      if (autoReloading) get().reload();
      return { fired: false, reason: 'no_ammo', ammoLeft: 0, autoReloading };
    }

    if (state.combat.isReloading) {
      return { fired: false, reason: 'reloading', ammoLeft: weapon.currentAmmo, autoReloading: false };
    }

    // Fire rate cooldown
    const now = Date.now();
    const lastFire = state.fireCooldowns[weapon.id] ?? 0;
    const cooldownMs = weapon.fireRate > 0 ? (1000 / weapon.fireRate) : 0;
    if (now - lastFire < cooldownMs) {
      return { fired: false, reason: 'on_cooldown', ammoLeft: weapon.currentAmmo, autoReloading: false };
    }

    // Consume ammo
    const newAmmo = isMelee ? 0 : weapon.currentAmmo - 1;
    const updatedWeapon: WeaponConfig = { ...weapon, currentAmmo: newAmmo };

    set((s) => ({
      weapons:       { ...s.weapons, [weapon.id]: updatedWeapon },
      fireCooldowns: { ...s.fireCooldowns, [weapon.id]: now },
      combat:        { ...s.combat, isShooting: true },
    }));

    // Reset shooting state after animation frame
    const resetTimer = setTimeout(() => {
      set((s) => ({ combat: { ...s.combat, isShooting: false } }));
    }, SHOOT_STATE_RESET_MS);

    // Prevent timer leak if component unmounts
    if (typeof window !== 'undefined') {
      (window as any).__combatTimers ??= [];
      (window as any).__combatTimers.push(resetTimer);
    }

    // Auto-reload on empty
    const autoReloading = !isMelee && newAmmo === 0 && updatedWeapon.reserveAmmo > 0;
    if (autoReloading) get().reload();

    return { fired: true, ammoLeft: newAmmo, autoReloading };
  },

  reload: () => {
    const state = get();
    const weapon = state.weapons[state.activeWeaponId ?? ''];

    if (!weapon) return false;

    // Melee weapons or throwables don't reload
    if (['knife', 'bat'].includes(weapon.type)) return false;
    if (weapon.reserveAmmo <= 0) return false;
    if (state.combat.isReloading) return false;
    if (weapon.currentAmmo >= weapon.magazineSize) return false;

    set((s) => ({ combat: { ...s.combat, isReloading: true } }));

    const timer = setTimeout(() => {
      const fresh = get();
      const freshWeapon = fresh.weapons[fresh.activeWeaponId ?? ''];
      if (!freshWeapon) {
        set((s) => ({ combat: { ...s.combat, isReloading: false } }));
        return;
      }

      const needed    = freshWeapon.magazineSize - freshWeapon.currentAmmo;
      const available = Math.min(needed, freshWeapon.reserveAmmo);

      const reloaded: WeaponConfig = {
        ...freshWeapon,
        currentAmmo:  freshWeapon.currentAmmo + available,
        reserveAmmo:  freshWeapon.reserveAmmo - available,
      };

      set((s) => ({
        weapons: { ...s.weapons, [freshWeapon.id]: reloaded },
        combat:  { ...s.combat, isReloading: false },
      }));
    }, weapon.reloadTime * 1000);

    if (typeof window !== 'undefined') {
      (window as any).__combatTimers ??= [];
      (window as any).__combatTimers.push(timer);
    }

    return true;
  },

  aim: (aiming) => {
    set((s) => ({ combat: { ...s.combat, isAiming: aiming } }));
  },

  setCovered: (covered, quality = covered ? 'partial' : 'none') => {
    set((s) => ({
      combat: { ...s.combat, isCovered: covered, coverQuality: quality },
    }));
  },

  // ── Health / Armor ─────────────────────────────────────────

  takeDamage: (amount, type) => {
    const state = get();
    const { health, armor } = state.combat;

    const { healthLost, armorLost, armorBlocked } = computeDamage(amount, type, armor);

    const newHealth = clamp(health - healthLost, 0, state.combat.maxHealth);
    const newArmor  = clamp(armor  - armorLost,  0, state.combat.maxArmor);
    const isDead    = newHealth <= 0;

    set((s) => ({
      combat: {
        ...s.combat,
        health:         newHealth,
        armor:          newArmor,
        isCovered:      false,
        coverQuality:   'none',
        lastDamageTime: Date.now(),
        lastDamageType: type,
      },
    }));

    return { healthLost, armorLost, isDead, armorBlocked };
  },

  heal: (amount) => {
    let healed = 0;
    set((s) => {
      const newHealth = clamp(
        s.combat.health + amount,
        0,
        s.combat.maxHealth
      );
      healed = newHealth - s.combat.health;
      return { combat: { ...s.combat, health: newHealth } };
    });
    return healed;
  },

  repairArmor: (amount) => {
    let repaired = 0;
    set((s) => {
      const newArmor = clamp(
        s.combat.armor + amount,
        0,
        s.combat.maxArmor
      );
      repaired = newArmor - s.combat.armor;
      return { combat: { ...s.combat, armor: newArmor } };
    });
    return repaired;
  },

  revive: () => {
    set((s) => ({
      combat: {
        ...s.combat,
        health:         s.combat.maxHealth * 0.25, // 25% HP on revive
        isReloading:    false,
        isShooting:     false,
        lastDamageTime: 0,
        lastDamageType: null,
      },
    }));
  },

  // ── Attachments ────────────────────────────────────────────

  addAttachment: (weaponId, attachment) => {
    const { weapons } = get();
    const weapon = weapons[weaponId];
    if (!weapon) return false;

    // Prevent duplicate attachment type
    const alreadyHasType = weapon.attachments.some((a) => a.type === attachment.type);
    if (alreadyHasType) return false;

    set((s) => ({
      weapons: {
        ...s.weapons,
        [weaponId]: {
          ...s.weapons[weaponId],
          attachments: [...s.weapons[weaponId].attachments, attachment],
        },
      },
    }));

    return true;
  },

  removeAttachment: (weaponId, attachmentId) => {
    const { weapons } = get();
    const weapon = weapons[weaponId];
    if (!weapon) return false;

    const exists = weapon.attachments.some((a) => a.id === attachmentId);
    if (!exists) return false;

    set((s) => ({
      weapons: {
        ...s.weapons,
        [weaponId]: {
          ...s.weapons[weaponId],
          attachments: s.weapons[weaponId].attachments.filter(
            (a) => a.id !== attachmentId
          ),
        },
      },
    }));

    return true;
  },

  // ── Queries ────────────────────────────────────────────────

  getActiveWeapon: () => {
    const { weapons, activeWeaponId } = get();
    return activeWeaponId ? (weapons[activeWeaponId] ?? null) : null;
  },

  getEffectiveStats: (weaponId) => {
    const weapon = get().weapons[weaponId];
    if (!weapon) return null;
    return computeEffectiveStats(weapon);
  },

  isDead: () => get().combat.health <= 0,

  canShoot: () => {
    const { combat, weapons, activeWeaponId, fireCooldowns } = get();
    if (!activeWeaponId) return false;
    if (combat.isReloading) return false;
    if (combat.health <= 0) return false;

    const weapon = weapons[activeWeaponId];
    if (!weapon) return false;

    const isMelee = weapon.type === 'knife' || weapon.type === 'bat';
    if (!isMelee && weapon.currentAmmo <= 0) return false;

    const now = Date.now();
    const lastFire = fireCooldowns[activeWeaponId] ?? 0;
    const cooldownMs = weapon.fireRate > 0 ? 1000 / weapon.fireRate : 0;
    if (now - lastFire < cooldownMs) return false;

    return true;
  },
}));

// ═══════════════════════════════════════════════════════════════
//  WEAPON CATALOG
// ═══════════════════════════════════════════════════════════════

/** Catalogue des armes disponibles — sans `id` (généré à l'instanciation) */
export const WEAPON_CATALOG: Readonly<Omit<WeaponConfig, 'id'>[]> = [
  {
    name:         'Pistolet 9mm',
    type:         'pistol',
    damage:       25,
    range:        50,
    accuracy:     70,
    fireRate:     3,
    magazineSize: 15,
    currentAmmo:  15,
    reserveAmmo:  60,
    reloadTime:   1.5,
    recoil:       15,
    bulletSpread: 5,
    attachments:  [],
    price:        500,
    illegal:      false,
  },
  {
    name:         'Revolver .357',
    type:         'revolver',
    damage:       60,
    range:        60,
    accuracy:     75,
    fireRate:     1.5,
    magazineSize: 6,
    currentAmmo:  6,
    reserveAmmo:  24,
    reloadTime:   2.0,
    recoil:       35,
    bulletSpread: 3,
    attachments:  [],
    price:        800,
    illegal:      false,
  },
  {
    name:         'SMG Tactique',
    type:         'smg',
    damage:       20,
    range:        40,
    accuracy:     50,
    fireRate:     10,
    magazineSize: 30,
    currentAmmo:  30,
    reserveAmmo:  120,
    reloadTime:   2.0,
    recoil:       20,
    bulletSpread: 15,
    attachments:  [],
    price:        2500,
    illegal:      true,
  },
  {
    name:         'Fusil à Pompe',
    type:         'shotgun',
    damage:       80,
    range:        20,
    accuracy:     40,
    fireRate:     1,
    magazineSize: 8,
    currentAmmo:  8,
    reserveAmmo:  32,
    reloadTime:   3.0,
    recoil:       50,
    bulletSpread: 30,
    attachments:  [],
    price:        1500,
    illegal:      false,
  },
  {
    name:         "Fusil d'Assaut",
    type:         'rifle',
    damage:       30,
    range:        80,
    accuracy:     65,
    fireRate:     8,
    magazineSize: 30,
    currentAmmo:  30,
    reserveAmmo:  120,
    reloadTime:   2.5,
    recoil:       25,
    bulletSpread: 10,
    attachments:  [],
    price:        5000,
    illegal:      true,
  },
  {
    name:         'Fusil de Précision',
    type:         'sniper',
    damage:       150,
    range:        200,
    accuracy:     95,
    fireRate:     0.5,
    magazineSize: 5,
    currentAmmo:  5,
    reserveAmmo:  20,
    reloadTime:   3.5,
    recoil:       60,
    bulletSpread: 1,
    attachments:  [],
    price:        10000,
    illegal:      true,
  },
  {
    name:         'Grenade Fragmentation',
    type:         'grenade',
    damage:       200,
    range:        30,
    accuracy:     50,
    fireRate:     0.5,
    magazineSize: 1,
    currentAmmo:  1,
    reserveAmmo:  3,
    reloadTime:   0,
    recoil:       0,
    bulletSpread: 0,
    attachments:  [],
    price:        300,
    illegal:      true,
  },
  {
    name:         'Cocktail Molotov',
    type:         'molotov',
    damage:       100,
    range:        25,
    accuracy:     60,
    fireRate:     0.5,
    magazineSize: 1,
    currentAmmo:  1,
    reserveAmmo:  2,
    reloadTime:   0,
    recoil:       0,
    bulletSpread: 0,
    attachments:  [],
    price:        100,
    illegal:      true,
  },
  {
    name:         'Couteau de Combat',
    type:         'knife',
    damage:       35,
    range:        2,
    accuracy:     100,
    fireRate:     3,
    magazineSize: 0,
    currentAmmo:  0,
    reserveAmmo:  0,
    reloadTime:   0,
    recoil:       0,
    bulletSpread: 0,
    attachments:  [],
    price:        200,
    illegal:      false,
  },
  {
    name:         'Batte de Baseball',
    type:         'bat',
    damage:       25,
    range:        2.5,
    accuracy:     90,
    fireRate:     1.5,
    magazineSize: 0,
    currentAmmo:  0,
    reserveAmmo:  0,
    reloadTime:   0,
    recoil:       0,
    bulletSpread: 0,
    attachments:  [],
    price:        50,
    illegal:      false,
  },
  {
    name:         'Taser X26',
    type:         'taser',
    damage:       0,
    range:        7,
    accuracy:     80,
    fireRate:     0.5,
    magazineSize: 1,
    currentAmmo:  1,
    reserveAmmo:  3,
    reloadTime:   2.0,
    recoil:       5,
    bulletSpread: 3,
    attachments:  [],
    price:        300,
    illegal:      false,
  },
  {
    name:         'Spray Poivré',
    type:         'pepper_spray',
    damage:       0,
    range:        3,
    accuracy:     90,
    fireRate:     4,
    magazineSize: 20,
    currentAmmo:  20,
    reserveAmmo:  0,
    reloadTime:   0,
    recoil:       0,
    bulletSpread: 15,
    attachments:  [],
    price:        30,
    illegal:      false,
  },
  {
    name:         'Grenade Aveuglante',
    type:         'flashbang',
    damage:       5,
    range:        10,
    accuracy:     70,
    fireRate:     0.5,
    magazineSize: 1,
    currentAmmo:  1,
    reserveAmmo:  2,
    reloadTime:   0,
    recoil:       0,
    bulletSpread: 0,
    attachments:  [],
    price:        200,
    illegal:      true,
  },
] as const;

/** Crée une WeaponConfig complète depuis le catalogue avec un ID unique */
export function createWeaponFromCatalog(
  catalogIndex: number,
  idOverride?: string
): WeaponConfig {
  const base = WEAPON_CATALOG[catalogIndex];
  if (!base) throw new Error(`Weapon catalog index ${catalogIndex} out of bounds`);

  return {
    ...base,
    id: idOverride ?? `${base.type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    attachments: [],
    currentAmmo: base.magazineSize,
    reserveAmmo: base.reserveAmmo,
  };
}

// ═══════════════════════════════════════════════════════════════
//  COVER SYSTEM
// ═══════════════════════════════════════════════════════════════

export class CoverSystem {
  private coverPoints: CoverPoint[] = [];

  addCoverPoint(position: THREE.Vector3, quality: CoverQuality = 'partial', capacity = 1): void {
    this.coverPoints.push({ position, quality, capacity, occupied: 0 });
  }

  removeCoverPoint(position: THREE.Vector3, threshold = 0.5): void {
    this.coverPoints = this.coverPoints.filter(
      (c) => c.position.distanceTo(position) > threshold
    );
  }

  /**
   * Trouve le meilleur point de couverture pour un joueur face à une menace.
   * Critères: distance < maxDist, entre le joueur et la menace, qualité, place disponible.
   */
  findCover(
    playerPos: THREE.Vector3,
    threatPos: THREE.Vector3,
    maxDist = 10
  ): CoverPoint | null {
    let best: CoverPoint | null = null;
    let bestScore = -Infinity;

    for (const cover of this.coverPoints) {
      // Doit avoir de la place
      if (cover.occupied >= cover.capacity) continue;

      const distance = playerPos.distanceTo(cover.position);
      if (distance > maxDist) continue;

      // Score: le couvert doit être entre le joueur et la menace
      const threatDir  = threatPos.clone().sub(cover.position).normalize();
      const playerDir  = cover.position.clone().sub(playerPos).normalize();
      const alignment  = threatDir.dot(playerDir);

      // Bonus de qualité
      const qualityBonus =
        cover.quality === 'full' ? 2 : cover.quality === 'partial' ? 1 : 0;

      // Préférer les couverts proches
      const distancePenalty = distance / maxDist;

      const score = alignment + qualityBonus - distancePenalty;

      if (score > bestScore) {
        bestScore = score;
        best = cover;
      }
    }

    return best;
  }

  /** Marque un point de couverture comme occupé */
  occupyCover(position: THREE.Vector3, threshold = 0.5): boolean {
    const cp = this.coverPoints.find(
      (c) => c.position.distanceTo(position) <= threshold
    );
    if (!cp || cp.occupied >= cp.capacity) return false;
    cp.occupied++;
    return true;
  }

  /** Libère un point de couverture */
  releaseCover(position: THREE.Vector3, threshold = 0.5): void {
    const cp = this.coverPoints.find(
      (c) => c.position.distanceTo(position) <= threshold
    );
    if (cp) cp.occupied = Math.max(0, cp.occupied - 1);
  }

  getCoverPoints(): Readonly<CoverPoint[]> {
    return this.coverPoints;
  }

  clearAll(): void {
    this.coverPoints = [];
  }
}

// ═══════════════════════════════════════════════════════════════
//  COMBAT EFFECTS
// ═══════════════════════════════════════════════════════════════

export interface EffectOptions {
  duration?: number;
  intensity?: number;
  color?: THREE.Color;
}

export class CombatEffects {
  private readonly env: EnvironmentEffects;
  private readonly activeEffects: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(private readonly scene: THREE.Scene) {
    this.env = new EnvironmentEffects(scene);
  }

  // ── Public API ─────────────────────────────────────────────

  bulletImpact(position: THREE.Vector3, normal: THREE.Vector3, material: 'concrete' | 'wood' | 'metal' | 'dirt' = 'concrete'): void {
    const dustColors: Record<typeof material, THREE.Color> = {
      concrete: new THREE.Color(0xaaaaaa),
      wood:     new THREE.Color(0x8b6914),
      metal:    new THREE.Color(0x888888),
      dirt:     new THREE.Color(0x8b6914),
    };

    this.env.startDust(position, 0.3);

    const sparkId = this.createEffect('sparks', position, {
      color:     new THREE.Color(0xffaa00),
      duration:  500,
      intensity: 20,
    });

    // Decal marker (would be a texture in production)
    void normal; // Used for decal orientation in full implementation

    this.scheduleCleanup(sparkId, 500);
  }

  explosion(position: THREE.Vector3, radius: number, opts: EffectOptions = {}): void {
    const { duration = 2000 } = opts;

    this.env.startFire(position, Math.min(radius, 5));

    const shockwaveId = this.createEffect('shockwave', position, {
      color:     new THREE.Color(0xff6600),
      duration,
      intensity: radius * 10,
    });

    // Secondary debris particles
    for (let i = 0; i < 3; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * radius * 0.5,
        0,
        (Math.random() - 0.5) * radius * 0.5
      );
      this.env.startDust(position.clone().add(offset), radius * 0.3);
    }

    this.scheduleCleanup(shockwaveId, duration);
  }

  bloodSplatter(position: THREE.Vector3, severity: 'minor' | 'major' = 'minor'): void {
    const rate     = severity === 'major' ? 60 : 30;
    const lifetime = severity === 'major' ? 1.0 : 0.5;

    this.createEffect('blood', position, {
      color:     new THREE.Color(0x8b0000),
      duration:  Math.floor(lifetime * 1000),
      intensity: rate,
    });
  }

  muzzleFlash(position: THREE.Vector3, direction: THREE.Vector3): void {
    void direction; // Used for orientation in full implementation
    const flashId = this.createEffect('flash', position, {
      color:     new THREE.Color(0xffdd88),
      duration:  80,
      intensity: 5,
    });
    this.scheduleCleanup(flashId, 80);
  }

  electricArc(position: THREE.Vector3): void {
    const arcId = this.createEffect('electric', position, {
      color:     new THREE.Color(0x88aaff),
      duration:  500,
      intensity: 15,
    });
    this.scheduleCleanup(arcId, 500);
  }

  tearGasCloud(position: THREE.Vector3, radius: number): void {
    const gasId = this.createEffect('gas', position, {
      color:     new THREE.Color(0x88cc88),
      duration:  8000,
      intensity: radius * 5,
    });
    this.scheduleCleanup(gasId, 8000);
  }

  dispose(): void {
    for (const timer of this.activeEffects.values()) {
      clearTimeout(timer);
    }
    this.activeEffects.clear();
  }

  // ── Private ─────────────────────────────────────────────────

  private createEffect(
    type: string,
    position: THREE.Vector3,
    opts: Required<EffectOptions> & { color: THREE.Color }
  ): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // In a full implementation this would call particleSystem.createEmitter(...)
    // For now, we log and use the dust/fire primitives available
    if (type === 'sparks' || type === 'shockwave') {
      this.env.startDust(position, opts.intensity * 0.01);
    }

    return id;
  }

  private scheduleCleanup(effectId: string, delayMs: number): void {
    const timer = setTimeout(() => {
      this.activeEffects.delete(effectId);
      // In full impl: particleSystem.removeEmitter(effectId)
    }, delayMs);

    this.activeEffects.set(effectId, timer);
  }
}

// ═══════════════════════════════════════════════════════════════
//  WEAPON FACTORY HELPERS
// ═══════════════════════════════════════════════════════════════

/** Catalogue d'accessoires prédéfinis */
export const ATTACHMENT_CATALOG: Readonly<Omit<WeaponAttachment, 'id'>[]> = [
  {
    name:  'Silencieux tactique',
    type:  'silencer',
    price: 800,
    stats: { noise: -70, accuracy: 3, range: -5 },
  },
  {
    name:  'Lunette 4×',
    type:  'scope',
    price: 600,
    stats: { accuracy: 20, range: 80 },
  },
  {
    name:  'Lunette ACOG',
    type:  'scope',
    price: 1200,
    stats: { accuracy: 30, range: 120 },
  },
  {
    name:  'Poignée verticale',
    type:  'grip',
    price: 200,
    stats: { recoil: -15, accuracy: 8 },
  },
  {
    name:  'Chargeur étendu',
    type:  'extended_mag',
    price: 300,
    stats: { magazineSize: 10 },
  },
  {
    name:  'Pointeur laser',
    type:  'laser',
    price: 150,
    stats: { accuracy: 12 },
  },
  {
    name:  'Lampe tactique',
    type:  'flashlight',
    price: 100,
    stats: { accuracy: 5 },
  },
] as const;

/** Crée un accessoire depuis le catalogue avec un ID unique */
export function createAttachmentFromCatalog(index: number): WeaponAttachment {
  const base = ATTACHMENT_CATALOG[index];
  if (!base) throw new Error(`Attachment catalog index ${index} out of bounds`);
  return {
    ...base,
    id: `att_${base.type}_${Date.now()}`,
  };
}