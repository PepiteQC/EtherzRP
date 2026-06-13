/**
 * src/weapons/systems/WeaponEquipper.ts
 * Emplacement exact: /home/user/etherworld/src/weapons/systems/WeaponEquipper.ts
 * 
 * PHASE 2 — Slots, equip/unequip/ranger/jeter/récupérer.
 * Emplacements exacts: holster, back, belt, hands, inventory.
 * Vérification serveur stub (à implémenter avec Firebase).
 * Empêche equip pendant animations.
 * Affiche sur perso quand rangée (via attachment).
 * Synchronise avec inventaire (non-intrusif).
 * Anti-duplication / anti-abus (cooldowns implicites via store).
 */

import type { WeaponInstance, WeaponSlot, WeaponState, EquipResult } from '../types/weapon';
import { getWeaponDefinition, createDefaultInstance } from '../data/WeaponRegistry';

export class WeaponEquipper {
  private equippedSlots: {
    holster: WeaponInstance | null;
    back: WeaponInstance | null;
    belt: WeaponInstance | null;
    hands: WeaponInstance | null;
    inventory: WeaponInstance[];
  } = {
    holster: null,
    back: null,
    belt: null,
    hands: null,
    inventory: [],
  };

  // État pour blocage rapide abusif (simple cooldown interne)
  private lastEquipTime = 0;
  private readonly EQUIP_COOLDOWN_MS = 180;

  /**
   * Équiper / ranger une arme dans un slot.
   * Retourne résultat pour store (qui gère l'état global).
   */
  equip(instanceId: string, targetSlot: WeaponSlot): EquipResult {
    const now = Date.now();
    if (now - this.lastEquipTime < this.EQUIP_COOLDOWN_MS) {
      return { success: false, reason: 'Changement trop rapide' };
    }

    // Chercher l'instance dans tous les slots
    let weapon: WeaponInstance | undefined;
    let sourceSlot: WeaponSlot | undefined;

    const slots = this.equippedSlots;
    if (slots.holster?.instanceId === instanceId) { weapon = slots.holster; sourceSlot = 'holster'; }
    else if (slots.back?.instanceId === instanceId) { weapon = slots.back; sourceSlot = 'back'; }
    else if (slots.belt?.instanceId === instanceId) { weapon = slots.belt; sourceSlot = 'belt'; }
    else if (slots.hands?.instanceId === instanceId) { weapon = slots.hands; sourceSlot = 'hands'; }
    else {
      weapon = slots.inventory.find(w => w.instanceId === instanceId);
      sourceSlot = 'inventory';
    }

    if (!weapon || !sourceSlot) {
      return { success: false, reason: 'Arme introuvable' };
    }

    const def = getWeaponDefinition(weapon.definitionId);
    if (!def) return { success: false, reason: 'Définition invalide' };

    // Blocages PHASE 2/3
    if (['rechargement', 'tir', 'recul'].includes(weapon.currentState)) {
      return { success: false, reason: 'Impossible pendant animation' };
    }
    if (def.etat === 'disabled' || def.etat === 'seized') {
      return { success: false, reason: 'Arme indisponible (désactivée/saisie)' };
    }

    // Vérif serveur stub (TODO: await serverVerifyEquip(weapon.instanceId, targetSlot, currentUser))
    // if (!await serverVerify...) { return {success:false, reason:'Vérification serveur échouée'} }

    this.lastEquipTime = now;

    // Retirer de l'ancien slot
    if (sourceSlot === 'holster') this.equippedSlots.holster = null;
    else if (sourceSlot === 'back') this.equippedSlots.back = null;
    else if (sourceSlot === 'belt') this.equippedSlots.belt = null;
    else if (sourceSlot === 'hands') this.equippedSlots.hands = null;
    else {
      this.equippedSlots.inventory = this.equippedSlots.inventory.filter(w => w.instanceId !== instanceId);
    }

    // Si slot cible occupé (sauf inventory), déplacer l'ancien vers inventory
    let displaced: WeaponInstance | null = null;
    const targetKey = targetSlot as Exclude<WeaponSlot, 'inventory'>;
    if (targetSlot !== 'inventory' && this.equippedSlots[targetKey]) {
      displaced = this.equippedSlots[targetKey]!;
      this.equippedSlots.inventory.push({ ...displaced, currentSlot: 'inventory', currentState: 'rangée' });
      this.equippedSlots[targetKey] = null;
    }

    // Placer dans nouveau slot + état correct
    const updated: WeaponInstance = {
      ...weapon,
      currentSlot: targetSlot,
      currentState: targetSlot === 'hands' ? 'sortie' : 'rangée',
    };

    if (targetSlot === 'holster') this.equippedSlots.holster = updated;
    else if (targetSlot === 'back') this.equippedSlots.back = updated;
    else if (targetSlot === 'belt') this.equippedSlots.belt = updated;
    else if (targetSlot === 'hands') this.equippedSlots.hands = updated;
    else this.equippedSlots.inventory.push(updated);

    return {
      success: true,
      newSlot: targetSlot,
      instance: updated,
    };
  }

  unequip(slot: WeaponSlot): EquipResult {
    const key = slot as Exclude<WeaponSlot, 'inventory'>;
    const weapon = this.equippedSlots[key];
    if (!weapon) return { success: false, reason: 'Slot vide' };

    if (['rechargement', 'tir'].includes(weapon.currentState)) {
      return { success: false, reason: 'Animation en cours' };
    }

    this.equippedSlots[key] = null;
    const toInventory: WeaponInstance = { ...weapon, currentSlot: 'inventory', currentState: 'rangée' };
    this.equippedSlots.inventory.push(toInventory);

    return { success: true, instance: toInventory };
  }

  // Ranger (holster/back/belt depuis hands)
  holsterCurrent(): EquipResult {
    const hands = this.equippedSlots.hands;
    if (!hands) return { success: false, reason: 'Aucune arme en main' };
    return this.equip(hands.instanceId, 'holster');
  }

  // Jeter (drop) — spawn au sol géré par le monde plus tard
  drop(instanceId: string): EquipResult {
    const all = [
      this.equippedSlots.holster,
      this.equippedSlots.back,
      this.equippedSlots.belt,
      this.equippedSlots.hands,
      ...this.equippedSlots.inventory,
    ].filter(Boolean) as WeaponInstance[];

    const weapon = all.find(w => w.instanceId === instanceId);
    if (!weapon) return { success: false, reason: 'Introuvable' };

    if (weapon.currentState === 'tir' || weapon.currentState === 'rechargement') {
      return { success: false, reason: 'Impossible de jeter pendant action' };
    }

    // Retirer de partout
    if (this.equippedSlots.holster?.instanceId === instanceId) this.equippedSlots.holster = null;
    if (this.equippedSlots.back?.instanceId === instanceId) this.equippedSlots.back = null;
    if (this.equippedSlots.belt?.instanceId === instanceId) this.equippedSlots.belt = null;
    if (this.equippedSlots.hands?.instanceId === instanceId) this.equippedSlots.hands = null;
    this.equippedSlots.inventory = this.equippedSlots.inventory.filter(w => w.instanceId !== instanceId);

    // TODO: spawn item physique au sol + sync serveur + collision Rapier
    console.log('[WeaponEquipper] Drop weapon', instanceId, '→ ground (stub)');

    return { success: true };
  }

  // Récupérer du sol (stub — à brancher avec world items + Rapier)
  retrieveFromGround(defId: string): EquipResult {
    const inst = createDefaultInstance(defId, 'inventory');
    if (!inst) return { success: false, reason: 'Définition inconnue' };

    this.equippedSlots.inventory.push(inst);
    return { success: true, instance: inst };
  }

  // Getters (utilisés par store et attachment)
  getInSlot(slot: WeaponSlot): WeaponInstance | null {
    if (slot === 'inventory') return null;
    return this.equippedSlots[slot as Exclude<WeaponSlot, 'inventory'>] ?? null;
  }

  getAllEquipped(): WeaponInstance[] {
    const s = this.equippedSlots;
    return [s.holster, s.back, s.belt, s.hands].filter(Boolean) as WeaponInstance[];
  }

  getInventory(): WeaponInstance[] {
    return [...this.equippedSlots.inventory];
  }

  getAll(): WeaponInstance[] {
    return [...this.getAllEquipped(), ...this.getInventory()];
  }

  // Pour sync externe (inventaire etherworld/depanneur)
  syncFromExternal(weaponInstanceIds: string[]) {
    // Ajoute seulement les manquantes (non-intrusif)
    const existing = new Set(this.getAll().map(w => w.definitionId));
    weaponInstanceIds.forEach(id => {
      if (!existing.has(id)) {
        const inst = createDefaultInstance(id, 'inventory');
        if (inst) this.equippedSlots.inventory.push(inst);
      }
    });
  }

  // Reset complet (pour respawn / debug)
  resetAll() {
    this.equippedSlots = { holster: null, back: null, belt: null, hands: null, inventory: [] };
  }
}

export const weaponEquipper = new WeaponEquipper();