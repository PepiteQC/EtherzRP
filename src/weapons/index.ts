/**
 * src/weapons/index.ts
 * Emplacement exact: /home/user/etherworld/src/weapons/index.ts
 * 
 * Barrel export du système armes complet — PHASE 0/1/2/3.
 * Types, registry, systems, store, components, hooks, integration.
 * Non-intrusif, prêt à importer dans player-character.tsx, Walker, HUD global, etc.
 */

export * from './types/weapon';

export {
  WEAPON_REGISTRY,
  getWeaponDefinition,
  createDefaultInstance,
  getWeaponsByCategory,
  getWeaponsByTier,
  getLegalCarryWeapons,
  ALL_WEAPON_IDS,
} from './data/WeaponRegistry';

export { weaponEquipper } from './systems/WeaponEquipper';
export { weaponFire } from './systems/WeaponFire';
export { weaponManager } from './systems/WeaponManager';

export { useWeaponStore } from './store/weaponStore';

export { WeaponModel } from './components/WeaponModel';
export { WeaponHUD } from './components/WeaponHUD';

export { useWeaponInput } from './hooks/useWeaponInput';

export { WeaponPlayerAttachment } from './integration/WeaponPlayerAttachment';