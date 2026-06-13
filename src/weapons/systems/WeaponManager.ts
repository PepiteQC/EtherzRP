/**
 * src/weapons/systems/WeaponManager.ts
 * Emplacement exact: /home/user/etherworld/src/weapons/systems/WeaponManager.ts
 * 
 * PHASE 2/3 orchestrator.
 * Centralise equip/unequip/fire/reload via Equipper + FireSystem.
 * Gère slot courant, sync état, blocages.
 * Prêt pour Rapier (passe les callbacks de raycast).
 */

import { weaponEquipper } from './WeaponEquipper';
import { weaponFire } from './WeaponFire';
import type {
  WeaponSlot,
  WeaponState,
  EquipResult,
  FireResult,
  ReloadResult,
  WeaponInstance,
} from '../types/weapon';

export class WeaponManager {
  private currentSlot: WeaponSlot = 'hands';

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2 — ÉQUIPEMENT
  // ═══════════════════════════════════════════════════════════════

  equip(weaponInstanceId: string, targetSlot: WeaponSlot): EquipResult {
    return weaponEquipper.equip(weaponInstanceId, targetSlot);
  }

  unequip(slot: WeaponSlot): EquipResult {
    return weaponEquipper.unequip(slot);
  }

  holsterCurrent(): EquipResult {
    return weaponEquipper.holsterCurrent();
  }

  drop(instanceId: string): EquipResult {
    return weaponEquipper.drop(instanceId);
  }

  retrieveFromGround(defId: string): EquipResult {
    return weaponEquipper.retrieveFromGround(defId);
  }

  selectSlot(slot: WeaponSlot) {
    this.currentSlot = slot;
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3 — TIR / RECHARGEMENT / ÉTATS
  // ═══════════════════════════════════════════════════════════════

  fire(
    isAiming: boolean,
    movementSpeed: number,
    stamina: number,
    posture: string,
    isInInterface: boolean,
    rapierRaycastFn?: (opts: any) => any
  ): FireResult {
    const weapon = weaponEquipper.getInSlot(this.currentSlot);
    if (!weapon) {
      return { success: false, reason: 'aucune arme en main', recoilApplied: 0, newAmmoInMag: 0, newAmmoInChamber: 0 };
    }
    return weaponFire.tryFire(
      weapon,
      isAiming,
      movementSpeed,
      stamina,
      posture,
      isInInterface,
      rapierRaycastFn
    );
  }

  reload(): ReloadResult {
    const weapon = weaponEquipper.getInSlot(this.currentSlot);
    if (!weapon) return { success: false, reason: 'aucune arme', ammoAdded: 0, interrupted: false };
    return weaponFire.startReload(weapon);
  }

  interruptReload(): void {
    const weapon = weaponEquipper.getInSlot(this.currentSlot);
    if (weapon) weaponFire.interruptReload(weapon);
  }

  // États rapides
  setState(newState: WeaponState) {
    const w = weaponEquipper.getInSlot(this.currentSlot);
    if (w) w.currentState = newState;
  }

  toggleSafety() {
    const w = weaponEquipper.getInSlot(this.currentSlot);
    if (w) w.isSafetyOn = !w.isSafetyOn;
  }

  cycleFireMode() {
    const w = weaponEquipper.getInSlot(this.currentSlot);
    if (!w) return;
    const def = require('../data/WeaponRegistry').getWeaponDefinition(w.definitionId);
    if (!def || def.gameplay.isMelee) return;

    w.fireModeIndex = (w.fireModeIndex + 1) % 2; // semi / auto (bolt reste bolt)
    // Le vrai mode est lu depuis def + index dans HUD
  }

  // ═══════════════════════════════════════════════════════════════
  // GETTERS (pour store + UI + attachment)
  // ═══════════════════════════════════════════════════════════════

  getCurrentWeapon(): WeaponInstance | null {
    return weaponEquipper.getInSlot(this.currentSlot);
  }

  getEquippedWeapons(): WeaponInstance[] {
    return weaponEquipper.getAllEquipped();
  }

  getInventoryWeapons(): WeaponInstance[] {
    return weaponEquipper.getInventory();
  }

  getAllWeapons(): WeaponInstance[] {
    return weaponEquipper.getAll();
  }

  getCurrentSlot(): WeaponSlot {
    return this.currentSlot;
  }

  isReloading(): boolean {
    return weaponFire.isCurrentlyReloading();
  }

  // Sync externe (inventaire tiers)
  syncFromExternalInventory(weaponDefIds: string[]) {
    weaponEquipper.syncFromExternal(weaponDefIds);
  }

  reset() {
    weaponEquipper.resetAll();
    this.currentSlot = 'hands';
  }
}

export const weaponManager = new WeaponManager();