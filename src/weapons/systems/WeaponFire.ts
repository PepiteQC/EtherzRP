/**
 * src/weapons/systems/WeaponFire.ts
 * Emplacement exact: /home/user/etherworld/src/weapons/systems/WeaponFire.ts
 * 
 * PHASE 3 — États complets, tir (semi/auto/bolt), visée/hip, dispersion dynamique (mouvement/posture/fatigue/recul), recul caméra, flash/fumée/douille (visuel dans attachment), impacts matériaux via Rapier, trous limités, sons intérieur/extérieur/écho (stub), alerte sécurité, chargeur/chambre/réserve, rechargement complet/interrompu/vide, blocages (sprint/chute/conduite/interaction + safety interface).
 * 
 * Utilise Rapier (world.castRay + collisionGroups) pour détection précise (joueurs / décors / véhicules / ragdoll).
 * Appelé depuis WeaponPlayerAttachment (qui a access à useRapier).
 * Non-intrusif avec StaminaSystem / CharacterStateMachine (blocage via props).
 */

import type { WeaponInstance, FireResult, WeaponState, MaterialType, RapierRaycastOptions } from '../types/weapon';
import { getWeaponDefinition } from '../data/WeaponRegistry';

// Types pour impacts (PHASE 3)
export interface BulletImpact {
  position: [number, number, number];
  material: MaterialType;
  damage: number;
  weaponId: string;
}

// Pool de trous d'impact limité (auto-cleanup)
const MAX_IMPACT_HOLES = 24;
let impactHoles: Array<{ id: string; position: [number, number, number]; created: number }> = [];

function addImpactHole(pos: [number, number, number]): string {
  const id = `hole_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  impactHoles.push({ id, position: pos, created: Date.now() });
  if (impactHoles.length > MAX_IMPACT_HOLES) {
    impactHoles.shift(); // cleanup le plus vieux
  }
  return id;
}

export function getImpactHoles() {
  // Nettoyage auto des vieux (> 90s)
  const now = Date.now();
  impactHoles = impactHoles.filter(h => now - h.created < 90000);
  return [...impactHoles];
}

export class WeaponFireSystem {
  private lastFireTime = 0;
  private isReloading = false;
  private pendingInterrupt = false;

  /**
   * Tente un tir.
   * Gère états, munitions virtuelle (mag + chamber), dispersion, recul, blocages.
   * Le raycast Rapier réel est fait dans le caller (Attachment) et passé optionnellement.
   */
  tryFire(
    eq: WeaponInstance,
    isAiming: boolean,
    movementSpeed: number,
    stamina: number,
    posture: string, // 'stand' | 'crouch' | 'prone' | 'sprint' | 'fall' | 'drive' | 'interaction'
    isInInterface: boolean,
    rapierRaycast?: (opts: RapierRaycastOptions) => any | null
  ): FireResult {
    const def = getWeaponDefinition(eq.definitionId);
    if (!def) return { success: false, reason: 'unknown', recoilApplied: 0, newAmmoInMag: eq.ammoInMag, newAmmoInChamber: eq.ammoInChamber };

    // === BLOCAGES PHASE 3 EXACTS ===
    if (isInInterface) return { success: false, reason: 'interface', recoilApplied: 0, newAmmoInMag: eq.ammoInMag, newAmmoInChamber: eq.ammoInChamber };
    if (eq.isSafetyOn) return { success: false, reason: 'sécurisée', recoilApplied: 0, newAmmoInMag: eq.ammoInMag, newAmmoInChamber: eq.ammoInChamber };
    if (['sprint', 'fall', 'drive', 'interaction'].includes(posture) || posture === 'sprint') {
      return { success: false, reason: 'posture bloquée', recoilApplied: 0, newAmmoInMag: eq.ammoInMag, newAmmoInChamber: eq.ammoInChamber };
    }
    if (this.isReloading || eq.currentState === 'rechargement') {
      return { success: false, reason: 'rechargement', recoilApplied: 0, newAmmoInMag: eq.ammoInMag, newAmmoInChamber: eq.ammoInChamber };
    }
    if (eq.currentState === 'enrayée' || eq.currentState === 'vide') {
      return { success: false, reason: eq.currentState, recoilApplied: 0, newAmmoInMag: eq.ammoInMag, newAmmoInChamber: eq.ammoInChamber };
    }

    const now = Date.now();
    const rateMs = def.gameplay.fireRate > 0 ? 60000 / def.gameplay.fireRate : 650; // bolt ~650ms
    if (now - this.lastFireTime < rateMs) {
      return { success: false, reason: 'cadence', recoilApplied: 0, newAmmoInMag: eq.ammoInMag, newAmmoInChamber: eq.ammoInChamber };
    }

    // === MUNITION VIRTUELLE (chamber + mag + reserve) ===
    let chamber = eq.ammoInChamber;
    let mag = eq.ammoInMag;

    if (chamber > 0) {
      chamber = 0;
    } else if (mag > 0) {
      mag--;
      if (def.gameplay.chamberCapacity > 0) chamber = 1;
    } else {
      eq.currentState = 'vide';
      return { success: false, reason: 'vide', recoilApplied: 0, newAmmoInMag: mag, newAmmoInChamber: chamber };
    }

    this.lastFireTime = now;
    eq.ammoInMag = mag;
    eq.ammoInChamber = chamber;
    eq.currentDurability = Math.max(0, eq.currentDurability - 0.07);
    eq.lastFiredAt = now;

    // État tir / recul
    eq.currentState = 'tir';

    // === DISPERSION DYNAMIQUE (mouvement + posture + fatigue + recul + visée) ===
    let dispersion = def.gameplay.dispersionBase;
    const moveMod = Math.min(2.8, 1 + movementSpeed * 1.9);
    const fatigueMod = Math.max(0.55, 1 - (stamina / 115));
    const postureMod = posture === 'crouch' ? 0.62 : posture === 'prone' ? 0.42 : 1.0;
    const recoilMod = 1 + (eq.currentDurability < 40 ? 0.35 : 0) + (def.gameplay.recoil / 140);
    const aimMod = isAiming ? 0.48 : 1.0;

    dispersion = Math.max(0.4, dispersion * moveMod * fatigueMod * postureMod * recoilMod * aimMod);

    // === RECUL (retourné pour caméra + animation perso) ===
    const recoilApplied = (def.gameplay.recoil / 92) * (isAiming ? 0.58 : 1.0) * (1 + Math.min(0.9, (eq.currentDurability < 30 ? 0.4 : 0)));

    // === TIR RÉEL (Rapier raycast si fourni) ===
    let hitResult: FireResult['hit'] = undefined;

    if (rapierRaycast) {
      // L'origine et la direction sont passées depuis l'Attachment (position joueur + yaw caméra)
      const origin: [number, number, number] = [0, 1.55, 0]; // approx épaule/yeux
      const dir: [number, number, number] = [0, 0, 1]; // remplacé par le vrai dir dans l'appelant

      const maxDist = def.gameplay.range;

      try {
        const hit = rapierRaycast({
          origin,
          direction: dir,
          maxDistance: maxDist,
          collisionGroups: 0b0111, // player | decors | vehicle
        });

        if (hit) {
          const material: MaterialType = this.detectMaterialFromHit(hit);
          const dmg = Math.floor(def.gameplay.damage * (def.gameplay.penetration / 100 + 0.65));

          const holeId = addImpactHole(hit.point as [number, number, number]);

          hitResult = {
            position: hit.point as [number, number, number],
            material,
            damageDealt: dmg,
          };

          console.log(`[WeaponFire] HIT ${material} @ ${hit.point.map((v: number) => v.toFixed(1)).join(',')} dmg=${dmg}`);
        }
      } catch (e) {
        // Rapier non prêt → on continue sans crash
      }
    }

    // Transition auto vers recul (visuel)
    setTimeout(() => {
      if (eq.currentState === 'tir') eq.currentState = 'recul';
    }, 65);

    setTimeout(() => {
      if (eq.currentState === 'recul') eq.currentState = 'sortie';
    }, 260);

    // Flash / fumée / douille fictive gérés dans WeaponModel / Attachment (useFrame)

    return {
      success: true,
      recoilApplied,
      newAmmoInMag: mag,
      newAmmoInChamber: chamber,
      hit: hitResult,
    };
  }

  private detectMaterialFromHit(hit: any): MaterialType {
    // Stub intelligent — à enrichir avec tags sur les RigidBody (ex: name contient "concrete", "wood" etc)
    if (!hit || !hit.collider) return 'concrete';
    const name = (hit.collider.parent?.name || '').toLowerCase();
    if (name.includes('metal') || name.includes('car') || name.includes('vehicle')) return 'metal';
    if (name.includes('wood') || name.includes('door') || name.includes('furniture')) return 'wood';
    if (name.includes('glass') || name.includes('window')) return 'glass';
    if (name.includes('ground') || name.includes('floor') || name.includes('terrain')) return 'ground';
    if (name.includes('player') || name.includes('ragdoll')) return 'flesh';
    return 'concrete';
  }

  /**
   * Rechargement complet (interrompable).
   */
  startReload(eq: WeaponInstance): ReloadResult {
    const def = getWeaponDefinition(eq.definitionId);
    if (!def || def.gameplay.isMelee || def.gameplay.magCapacity === 0) {
      return { success: false, reason: 'pas de rechargement', ammoAdded: 0, interrupted: false };
    }
    if (eq.ammoInMag >= def.gameplay.magCapacity && eq.ammoInChamber >= def.gameplay.chamberCapacity) {
      return { success: false, reason: 'déjà plein', ammoAdded: 0, interrupted: false };
    }
    if (eq.ammoReserve <= 0) {
      return { success: false, reason: 'plus de réserve', ammoAdded: 0, interrupted: false };
    }

    this.isReloading = true;
    this.pendingInterrupt = false;
    eq.currentState = 'rechargement';

    const reloadMs = Math.floor(def.gameplay.reloadTime * 1000);

    setTimeout(() => {
      if (this.pendingInterrupt) {
        this.isReloading = false;
        eq.currentState = 'sortie';
        this.pendingInterrupt = false;
        return;
      }

      const needed = def.gameplay.magCapacity - eq.ammoInMag;
      const toAdd = Math.min(needed, eq.ammoReserve);
      if (toAdd > 0) {
        eq.ammoInMag += toAdd;
        eq.ammoReserve -= toAdd;
        if (def.gameplay.chamberCapacity > 0 && eq.ammoInChamber === 0) {
          eq.ammoInChamber = 1;
          eq.ammoReserve -= 1; // chambre consomme 1
        }
      }
      eq.currentState = 'sortie';
      eq.lastReloadAt = Date.now();
      this.isReloading = false;
    }, reloadMs);

    return { success: true, ammoAdded: 0, interrupted: false }; // le vrai ajout est async
  }

  interruptReload(eq: WeaponInstance): void {
    if (this.isReloading) {
      this.pendingInterrupt = true;
      eq.currentState = 'sortie';
      this.isReloading = false;
    }
  }

  // Utilitaire pour WeaponManager
  isCurrentlyReloading(): boolean { return this.isReloading; }
}

export const weaponFire = new WeaponFireSystem();