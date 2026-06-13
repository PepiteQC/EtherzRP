/**
 * src/weapons/data/WeaponRegistry.ts
 * Emplacement exact : /home/user/etherworld/src/weapons/data/WeaponRegistry.ts
 * 
 * PHASE 1 — Registre central des armes (complet).
 * Catégories exactes: pistol, carabine, fusil, arme_de_service, couteau, objet_improvise
 * Chaque arme: id, nom RP, modèle 3D key, poids, emplacement, état, durabilité, rareté, permissions, animations, sons, dégâts, cadence, portée, recul, dispersion, capacité, munition virtuelle.
 * Séparation visuel/serveur/gameplay.
 * Flags: disabled/seized/stolen/registered.
 * Construit side-by-side avec l'original weaponCatalog.ts (ne pas écraser).
 */

import type {
  WeaponDefinition,
  WeaponCategory,
  WeaponSlot,
  WeaponEquipStatus,
  FireMode,
  VisualStats,
  ServerStats,
  GameplayStats,
} from '../types/weapon';

// ═══════════════════════════════════════════════════════════════
// EXEMPLES COMPLETS PAR CATÉGORIE (équilibrés RP Québec — 2026)
// ═══════════════════════════════════════════════════════════════

export const WEAPON_REGISTRY: Record<string, WeaponDefinition> = {
  // ────────────────────────────────────────────────────────────
  // PISTOLET (pistol)
  // ────────────────────────────────────────────────────────────
  'glock19': {
    id: 'glock19',
    nomRP: 'Glock 19 Gen5',
    category: 'pistol',
    visual: {
      modelKey: 'glock19_compact',
      scale: 0.9,
      offset: [0.12, 1.28, 0.08],
      rotation: [0.2, -0.1, 0.8],
      holsterOffset: [0.22, 1.05, -0.18],
    },
    server: {
      weight: 0.62,
      durabilityMax: 100,
      rarity: 'uncommon',
      tier: 'restricted',
      permissions: ['PPA-R'],
      legalQuebec: true,
      value: 880,
    },
    gameplay: {
      damage: 42,
      fireRate: 340,
      range: 55,
      recoil: 32,
      dispersionBase: 1.8,
      magCapacity: 15,
      chamberCapacity: 1,
      reloadTime: 1.9,
      ammoType: '9mm',
      fireMode: 'semi',
      penetration: 18,
      isMelee: false,
    },
    etat: 'normal',
    durabilite: 100,
    animations: {
      draw: 'pistol_draw',
      holster: 'pistol_holster',
      fire: 'pistol_fire',
      reload: 'pistol_reload',
      inspect: 'pistol_inspect',
      aimIn: 'pistol_aim_in',
      aimOut: 'pistol_aim_out',
    },
    sounds: {
      fire: 'glock_fire',
      dryFire: 'pistol_dry',
      reload: 'pistol_reload',
      bolt: 'pistol_slide',
      impact: {
        concrete: 'bullet_concrete',
        wood: 'bullet_wood',
        metal: 'bullet_metal',
        glass: 'bullet_glass',
        ground: 'bullet_dirt',
        flesh: 'bullet_flesh',
        vehicle: 'bullet_vehicle',
      },
      alert: 'gunshot_alert',
    },
    canBeRegistered: true,
    canBeSeized: true,
    requiresLicense: 'PPA-R',
    tags: ['pistol', 'service', '9mm'],
  },

  // ────────────────────────────────────────────────────────────
  // CARABINE (carabine)
  // ────────────────────────────────────────────────────────────
  'remington_700': {
    id: 'remington_700',
    nomRP: 'Remington 700 SPS',
    category: 'carabine',
    visual: {
      modelKey: 'rem700',
      scale: 1.05,
      offset: [0.05, 1.35, 0.55],
      rotation: [0.1, -0.15, 0.6],
      backOffset: [-0.38, 1.62, -0.52],
    },
    server: {
      weight: 3.6,
      durabilityMax: 95,
      rarity: 'common',
      tier: 'legal',
      permissions: [],
      legalQuebec: true,
      value: 1250,
    },
    gameplay: {
      damage: 92,
      fireRate: 0,
      range: 320,
      recoil: 68,
      dispersionBase: 0.6,
      magCapacity: 5,
      chamberCapacity: 1,
      reloadTime: 3.8,
      ammoType: '.308',
      fireMode: 'bolt',
      penetration: 65,
      isMelee: false,
    },
    etat: 'normal',
    durabilite: 95,
    animations: {
      draw: 'rifle_draw',
      holster: 'rifle_back',
      fire: 'rifle_bolt_fire',
      reload: 'rifle_reload',
      inspect: 'rifle_inspect',
      aimIn: 'rifle_aim_in',
      aimOut: 'rifle_aim_out',
    },
    sounds: {
      fire: 'rem700_fire',
      dryFire: 'rifle_dry',
      reload: 'rifle_bolt',
      bolt: 'rifle_bolt',
      impact: {
        concrete: 'bullet_concrete',
        wood: 'bullet_wood',
        metal: 'bullet_metal',
        glass: 'bullet_glass',
        ground: 'bullet_dirt',
        flesh: 'bullet_flesh',
        vehicle: 'bullet_vehicle',
      },
      alert: 'gunshot_alert',
    },
    canBeRegistered: true,
    canBeSeized: true,
    tags: ['carabine', 'hunting', 'bolt'],
  },

  // ────────────────────────────────────────────────────────────
  // FUSIL (fusil)
  // ────────────────────────────────────────────────────────────
  'mossberg_500': {
    id: 'mossberg_500',
    nomRP: 'Mossberg 500 Tactical',
    category: 'fusil',
    visual: {
      modelKey: 'mossberg500',
      scale: 1.0,
      offset: [0.08, 1.32, 0.48],
      rotation: [0.15, -0.1, 0.7],
      backOffset: [-0.32, 1.58, -0.48],
    },
    server: {
      weight: 3.1,
      durabilityMax: 82,
      rarity: 'uncommon',
      tier: 'restricted',
      permissions: ['permis_fusil'],
      legalQuebec: false,
      value: 980,
    },
    gameplay: {
      damage: 78,
      fireRate: 55,
      range: 42,
      recoil: 85,
      dispersionBase: 4.2,
      magCapacity: 6,
      chamberCapacity: 1,
      reloadTime: 2.6,
      ammoType: '12ga',
      fireMode: 'semi',
      penetration: 22,
      isMelee: false,
    },
    etat: 'normal',
    durabilite: 82,
    animations: {
      draw: 'shotgun_draw',
      holster: 'shotgun_back',
      fire: 'shotgun_pump_fire',
      reload: 'shotgun_reload',
      inspect: 'shotgun_inspect',
      aimIn: 'shotgun_aim_in',
      aimOut: 'shotgun_aim_out',
    },
    sounds: {
      fire: 'mossberg_fire',
      dryFire: 'shotgun_dry',
      reload: 'shotgun_pump',
      bolt: 'shotgun_pump',
      impact: {
        concrete: 'shotgun_concrete',
        wood: 'shotgun_wood',
        metal: 'shotgun_metal',
        glass: 'shotgun_glass',
        ground: 'shotgun_dirt',
        flesh: 'shotgun_flesh',
        vehicle: 'shotgun_vehicle',
      },
      alert: 'gunshot_alert',
    },
    canBeRegistered: false,
    canBeSeized: true,
    tags: ['fusil', 'pump', '12ga'],
  },

  // ────────────────────────────────────────────────────────────
  // ARME DE SERVICE (arme_de_service)
  // ────────────────────────────────────────────────────────────
  'colt_c8': {
    id: 'colt_c8',
    nomRP: 'Colt C8 CQB',
    category: 'arme_de_service',
    visual: {
      modelKey: 'coltc8',
      scale: 0.98,
      offset: [0.06, 1.38, 0.52],
      rotation: [0.12, -0.08, 0.65],
      backOffset: [-0.36, 1.55, -0.5],
      holsterOffset: [0.18, 1.12, -0.22],
    },
    server: {
      weight: 2.85,
      durabilityMax: 100,
      rarity: 'rare',
      tier: 'arme_de_service',
      permissions: ['PAA', 'SPVM'],
      legalQuebec: true,
      value: 0,
    },
    gameplay: {
      damage: 52,
      fireRate: 780,
      range: 165,
      recoil: 38,
      dispersionBase: 2.1,
      magCapacity: 30,
      chamberCapacity: 1,
      reloadTime: 2.1,
      ammoType: '5.56x45',
      fireMode: 'auto',
      penetration: 32,
      isMelee: false,
    },
    etat: 'normal',
    durabilite: 100,
    animations: {
      draw: 'carbine_draw',
      holster: 'carbine_back',
      fire: 'carbine_fire',
      reload: 'carbine_reload',
      inspect: 'carbine_inspect',
      aimIn: 'carbine_aim_in',
      aimOut: 'carbine_aim_out',
    },
    sounds: {
      fire: 'c8_fire',
      dryFire: 'rifle_dry',
      reload: 'carbine_reload',
      bolt: 'carbine_bolt',
      impact: {
        concrete: 'bullet_concrete',
        wood: 'bullet_wood',
        metal: 'bullet_metal',
        glass: 'bullet_glass',
        ground: 'bullet_dirt',
        flesh: 'bullet_flesh',
        vehicle: 'bullet_vehicle',
      },
      alert: 'gunshot_alert',
    },
    canBeRegistered: true,
    canBeSeized: true,
    requiresLicense: 'PAA',
    tags: ['service', 'assault', 'auto', 'SPVM'],
  },

  // ────────────────────────────────────────────────────────────
  // COUTEAU (couteau)
  // ────────────────────────────────────────────────────────────
  'kabar': {
    id: 'kabar',
    nomRP: 'KA-BAR Fighting Knife',
    category: 'couteau',
    visual: {
      modelKey: 'kabar_knife',
      scale: 0.85,
      offset: [0.18, 1.15, 0.22],
      rotation: [0.6, 1.8, 0.4],
      beltOffset: [0.02, 1.08, 0.32],
    },
    server: {
      weight: 0.38,
      durabilityMax: 70,
      rarity: 'uncommon',
      tier: 'blackmarket',
      permissions: [],
      legalQuebec: false,
      value: 185,
    },
    gameplay: {
      damage: 48,
      fireRate: 120,
      range: 1.6,
      recoil: 0,
      dispersionBase: 0,
      magCapacity: 0,
      chamberCapacity: 0,
      reloadTime: 0,
      ammoType: 'none',
      fireMode: 'semi',
      penetration: 45,
      isMelee: true,
    },
    etat: 'normal',
    durabilite: 70,
    animations: {
      draw: 'knife_draw',
      holster: 'knife_belt',
      fire: 'knife_stab',
      reload: 'knife_inspect',
      inspect: 'knife_inspect',
      aimIn: 'knife_aim',
      aimOut: 'knife_aim_out',
    },
    sounds: {
      fire: 'knife_stab',
      dryFire: 'knife_whoosh',
      reload: 'knife_sheath',
      bolt: '',
      impact: {
        concrete: 'knife_concrete',
        wood: 'knife_wood',
        metal: 'knife_metal',
        glass: 'knife_glass',
        ground: 'knife_dirt',
        flesh: 'knife_flesh',
        vehicle: 'knife_metal',
      },
      alert: '',
    },
    canBeRegistered: false,
    canBeSeized: true,
    tags: ['melee', 'knife', 'silent'],
  },

  // ────────────────────────────────────────────────────────────
  // OBJET IMPROVISÉ (objet_improvise)
  // ────────────────────────────────────────────────────────────
  'baseball_bat': {
    id: 'baseball_bat',
    nomRP: 'Batte de baseball en bois',
    category: 'objet_improvise',
    visual: {
      modelKey: 'baseball_bat',
      scale: 1.0,
      offset: [0.25, 1.05, -0.12],
      rotation: [-1.2, 0.3, 2.1],
      beltOffset: [0.0, 0.95, 0.35],
    },
    server: {
      weight: 0.95,
      durabilityMax: 65,
      rarity: 'common',
      tier: 'legal',
      permissions: [],
      legalQuebec: true,
      value: 35,
    },
    gameplay: {
      damage: 48,
      fireRate: 35,
      range: 1.8,
      recoil: 0,
      dispersionBase: 0,
      magCapacity: 0,
      chamberCapacity: 0,
      reloadTime: 0,
      ammoType: 'none',
      fireMode: 'semi',
      penetration: 8,
      isMelee: true,
    },
    etat: 'normal',
    durabilite: 65,
    animations: {
      draw: 'bat_draw',
      holster: 'bat_holster',
      fire: 'bat_swing',
      reload: 'bat_inspect',
      inspect: 'bat_inspect',
      aimIn: 'bat_aim',
      aimOut: 'bat_aim_out',
    },
    sounds: {
      fire: 'bat_swing',
      dryFire: 'bat_whoosh',
      reload: 'bat_impact',
      bolt: '',
      impact: { concrete: 'bat_concrete', wood: 'bat_wood', metal: 'bat_metal', glass: 'bat_glass', ground: 'bat_dirt', flesh: 'bat_flesh', vehicle: 'bat_metal' },
      alert: '',
    },
    canBeRegistered: false,
    canBeSeized: true,
    tags: ['improvisé', 'blunt', 'baseball'],
  },
};

// ═══════════════════════════════════════════════════════════════
// HELPERS PHASE 1 (utilisés par store / equipper / fire)
// ═══════════════════════════════════════════════════════════════

export function getWeaponDefinition(id: string): WeaponDefinition | undefined {
  return WEAPON_REGISTRY[id];
}

export function getWeaponsByCategory(cat: WeaponCategory): WeaponDefinition[] {
  return Object.values(WEAPON_REGISTRY).filter(w => w.category === cat);
}

export function getWeaponsByTier(tier: 'legal' | 'restricted' | 'blackmarket' | 'admin_only'): WeaponDefinition[] {
  return Object.values(WEAPON_REGISTRY).filter(w => w.server.tier === tier);
}

export function getLegalCarryWeapons(): WeaponDefinition[] {
  return Object.values(WEAPON_REGISTRY).filter(w =>
    w.server.tier === 'legal' || w.server.tier === 'restricted'
  );
}

export function createDefaultInstance(defId: string, slot: WeaponSlot = 'inventory'): import('../types/weapon').WeaponInstance | null {
  const def = getWeaponDefinition(defId);
  if (!def) return null;

  return {
    instanceId: `wi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    definitionId: defId,
    currentDurability: def.durabilite,
    currentState: 'rangée',
    currentSlot: slot,
    ammoInMag: def.gameplay.magCapacity,
    ammoInChamber: def.gameplay.chamberCapacity,
    ammoReserve: def.category === 'couteau' || def.category === 'objet_improvise' ? 0 : Math.floor(def.gameplay.magCapacity * 2.5),
    fireModeIndex: 0,
    isSafetyOn: false,
    lastFiredAt: 0,
    lastReloadAt: 0,
    isEnrayee: false,
  };
}

export const ALL_WEAPON_IDS = Object.keys(WEAPON_REGISTRY);