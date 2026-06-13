/**
 * src/weapons/components/WeaponHUD.tsx
 * Emplacement exact : /home/user/etherworld/src/weapons/components/WeaponHUD.tsx
 * 
 * PHASE 3 — Interface HUD complète pour armes.
 * - Réticule dynamique (scale selon visée/recul/dispersion)
 * - État chargeur + chambre + réserve
 * - Mode de tir (SEMI/AUTO/BOLT)
 * - État (RANGÉE / SORTIE / VISÉE / TIR / RECUL / RECHARGEMENT / ... / SÉCURISÉE)
 * - Durabilité + enrayée
 * - Alertes (vide, enrayée)
 * - Non-intrusif, pointer-events-none
 */

import { useWeaponStore } from '../store/weaponStore';
import { getWeaponDefinition } from '../data/WeaponRegistry';

export function WeaponHUD() {
  const {
    selectedWeaponId,
    equippedSlots,
    currentState,
    isAiming,
    recoilAmount,
    dispersionModifier,
  } = useWeaponStore();

  const weapon = selectedWeaponId
    ? useWeaponStore.getState().getWeaponInstance(selectedWeaponId)
    : null;

  if (!weapon) return null;

  const def = getWeaponDefinition(weapon.definitionId);
  if (!def) return null;

  const isMelee = def.gameplay.isMelee;

  const ammoText = isMelee
    ? '—'
    : `${weapon.ammoInMag}${weapon.ammoInChamber > 0 ? `+${weapon.ammoInChamber}` : ''} / ${weapon.ammoReserve}`;

  const stateLabels: Record<string, string> = {
    'rangée': 'RANGÉE',
    'sortie': 'SORTIE',
    'visée': 'VISÉE',
    'tir': 'TIR',
    'recul': 'RECUL',
    'rechargement': 'RECHARGEMENT',
    'inspection': 'INSPECTION',
    'enrayée': 'ENRAYÉE',
    'vide': 'VIDE',
    'sécurisée': 'SÉCURISÉE',
  };
  const stateLabel = stateLabels[currentState] || currentState.toUpperCase();

  const fireModeLabel =
    def.gameplay.fireMode === 'bolt'
      ? 'BOLT'
      : weapon.fireModeIndex === 0
        ? 'SEMI'
        : 'AUTO';

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[90] font-mono text-[11px] text-white/90 select-none">
      {/* Réticule dynamique PHASE 3 */}
      <div className="absolute -top-[118px] left-1/2 -translate-x-1/2">
        <div
          className="w-3.5 h-3.5 border border-white/75 rounded-full flex items-center justify-center transition-transform"
          style={{
            transform: `scale(${isAiming ? 0.52 : 1 + recoilAmount * 0.65})`,
            opacity: isAiming ? 0.92 : 0.68,
            boxShadow: isAiming ? '0 0 0 1.5px rgba(255,255,255,0.25)' : 'none',
          }}
        >
          <div className="w-px h-px bg-white/85 rounded-full" />
        </div>

        {/* Indicateur dispersion */}
        <div
          className="absolute top-1/2 left-1/2 border border-white/25 rounded-full"
          style={{
            width: `${Math.max(7, 24 * (dispersionModifier || 1))}px`,
            height: `${Math.max(7, 24 * (dispersionModifier || 1))}px`,
            transform: 'translate(-50%, -50%)',
            opacity: 0.35,
          }}
        />
      </div>

      {/* Panneau info arme */}
      <div className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded border border-white/10 min-w-[182px]">
        <div className="flex items-center justify-between">
          <div className="font-bold tracking-[1.5px] text-[10px] text-cyan-400">
            {def.nomRP}
          </div>
          <div className="text-[8px] px-1.5 py-px rounded bg-white/10 text-white/55 font-medium">
            {def.category.toUpperCase()}
          </div>
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          <div className="text-[19px] font-mono tabular-nums tracking-[-1.5px] text-emerald-400">
            {ammoText}
          </div>
          <div className="text-[9px] text-white/50 mt-0.5">
            {def.gameplay.ammoType}
          </div>
        </div>

        <div className="mt-0.5 flex justify-between text-[9px]">
          <div>
            <span className="text-white/40">ÉTAT</span>{' '}
            <span className="text-amber-400 font-semibold">{stateLabel}</span>
          </div>
          {!isMelee && (
            <div>
              <span className="text-white/40">MODE</span>{' '}
              <span className="font-semibold">{fireModeLabel}</span>
            </div>
          )}
        </div>

        {/* Durabilité */}
        <div className="mt-1.5 h-[3px] bg-white/10 rounded overflow-hidden">
          <div
            className="h-[3px] bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400 transition-all duration-200"
            style={{ width: `${Math.max(3, weapon.currentDurability)}%` }}
          />
        </div>
        <div className="text-[7px] text-white/35 mt-px tabular-nums flex justify-between">
          <span>{weapon.currentDurability.toFixed(0)}% DURABILITÉ</span>
          {weapon.isSafetyOn && <span className="text-orange-400">SÉCURITÉ</span>}
          {weapon.isEnrayee && <span className="text-orange-400">ENRAYÉE</span>}
        </div>
      </div>

      {/* Alertes */}
      {currentState === 'vide' && (
        <div className="mt-1 text-center text-red-400 text-[9px] animate-pulse font-medium">
          CHARGEUR VIDE — APPUYEZ R
        </div>
      )}
      {weapon.isEnrayee && currentState !== 'vide' && (
        <div className="mt-0.5 text-center text-orange-400 text-[9px]">
          ARME ENRAYÉE
        </div>
      )}
    </div>
  );
}