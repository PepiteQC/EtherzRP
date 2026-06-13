/**
 * src/weapons/hooks/useWeaponInput.ts
 * Emplacement exact: /home/user/etherworld/src/weapons/hooks/useWeaponInput.ts
 * 
 * PHASE 2/3 — Gestion des inputs clavier/souris pour le système armes.
 * Keybinds configurables (via store).
 * Quick wheel (Q), draw depuis slots (1/2/3), fire (souris gauche), aim (souris droite), reload (R), safety (F), cycle mode (B), drop (G), holster (H).
 * Bloque pendant typing / interfaces.
 * Passe l'état joueur au store (position, vitesse, stamina, posture, characterState).
 * Non-intrusif.
 */

import { useEffect, useRef } from 'react';
import { useWeaponStore } from '../store/weaponStore';
import { weaponManager } from '../systems/WeaponManager';

export function useWeaponInput(
  getPlayerState: () => {
    position: [number, number, number];
    cameraYaw: number;
    isSprinting: boolean;
    movementSpeed: number;
    stamina: number;
    posture: string;
    characterState: string;
    isInInterface: boolean;
  }
) {
  const store = useWeaponStore;
  const lastFireRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isTyping =
        active?.tagName === 'INPUT' ||
        active?.tagName === 'TEXTAREA' ||
        (active as any)?.isContentEditable;

      if (isTyping) return;

      const keybinds = store.getState().keybinds;
      const player = getPlayerState();

      // Quick wheel
      if (e.code === keybinds.quickWheel) {
        store.getState().toggleQuickWheel();
        return;
      }

      // Draw from holster / back / belt (PHASE 2)
      if (e.code === 'Key1') {
        const w = store.getState().equippedSlots.holster;
        if (w) store.getState().equipWeapon(w.instanceId, 'hands');
      }
      if (e.code === 'Key2') {
        const w = store.getState().equippedSlots.back;
        if (w) store.getState().equipWeapon(w.instanceId, 'hands');
      }
      if (e.code === 'Key3') {
        const w = store.getState().equippedSlots.belt;
        if (w) store.getState().equipWeapon(w.instanceId, 'hands');
      }

      // Holster current (ranger)
      if (e.code === 'KeyH') {
        const hands = store.getState().equippedSlots.hands;
        if (hands) store.getState().equipWeapon(hands.instanceId, 'holster');
      }

      // Reload
      if (e.code === keybinds.reload) {
        store.getState().reload();
      }

      // Safety
      if (e.code === keybinds.safety) {
        store.getState().toggleSafety();
      }

      // Cycle fire mode
      if (e.code === keybinds.cycleMode) {
        store.getState().cycleFireMode();
      }

      // Drop current
      if (e.code === keybinds.drop) {
        const hands = store.getState().equippedSlots.hands;
        if (hands) store.getState().dropWeapon(hands.instanceId);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const player = getPlayerState();
      const s = store.getState();

      if (e.button === 0) {
        // Left click = fire
        const now = Date.now();
        if (now - lastFireRef.current < 35) return;
        lastFireRef.current = now;

        const dir: [number, number, number] = [
          Math.sin(player.cameraYaw),
          0,
          Math.cos(player.cameraYaw),
        ];

        // Le vrai raycast Rapier est géré dans WeaponPlayerAttachment (useFrame + useRapier)
        const result = weaponManager.fire(
          s.isAiming,
          player.movementSpeed,
          player.stamina,
          player.isSprinting ? 'sprint' : player.posture,
          player.isInInterface
        );

        if (result.success) {
          // Sons / effets visuels (flash, douille, fumée) gérés dans WeaponModel / Attachment
        }
      }

      if (e.button === 2) {
        // Right click = aim
        s.startAiming();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        store.getState().stopAiming();
      }
    };

    const handleWheel = (_e: WheelEvent) => {
      // Optionnel: wheel pour cycle inventaire armes (futur)
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [getPlayerState]);
}