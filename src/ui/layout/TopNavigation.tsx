/**
 * src/ui/layout/TopNavigation.tsx
 * 
 * En-tête (Header) Officiel du Portail Civil de la Ville de Québec.
 * Affiche l'identité certifiée du citoyen, ses fonds de subsistance et l'aiguillage Portail / Ville 3D.
 */

import React from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import { useAuthStore } from '../../store/authStore';

interface TopNavProps {
  onToggleWorld3D: () => void;
  isWorldActive: boolean;
}

export const TopNavigation: React.FC<TopNavProps> = ({ onToggleWorld3D, isWorldActive }) => {
  const auth   = useAuthStore();
  const player = auth.player;

  return (
    <header
      style={{
        background: CITY_TOKENS.colors.primary,
        color: CITY_TOKENS.colors.textLight,
        height: '64px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: CITY_TOKENS.shadows.header,
        borderBottom: `4px solid ${CITY_TOKENS.colors.accentBlue}`,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        userSelect: 'none',
      }}
    >
      {/* IDENTITÉ MUNICIPALE DE GAUCHE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Armoiries / Pavillon QC Simple */}
        <div
          style={{
            background: CITY_TOKENS.colors.textLight,
            color: CITY_TOKENS.colors.primary,
            width: '36px',
            height: '36px',
            borderRadius: CITY_TOKENS.borderRadius.md,
            fontWeight: 900,
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${CITY_TOKENS.colors.accentBlue}`,
          }}
        >
          ⚜️
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.5px' }}>
            VILLE DE QUÉBEC
          </div>
          <div style={{ fontSize: '11px', color: CITY_TOKENS.colors.primaryLight, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Portail Citoyen In-Character · EtherWorld
          </div>
        </div>
      </div>

      {/* COMPTEURS CITOYENS & AIGUILLAGE DE DROITE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {player && (
          <>
            <div style={{ background: CITY_TOKENS.colors.primaryHover, padding: '6px 14px', borderRadius: CITY_TOKENS.borderRadius.md, display: 'flex', alignItems: 'center', gap: '16px', border: `1px solid ${CITY_TOKENS.colors.accentBlue}` }}>
              <div>
                <div style={{ fontSize: '10px', color: CITY_TOKENS.colors.primaryLight, textTransform: 'uppercase' }}>Citoyen Actif</div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>{player.firstName} {player.lastName}</div>
              </div>
              <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: CITY_TOKENS.colors.successBg }}>{player.cash} $</div>
                <div style={{ fontSize: '9px', color: CITY_TOKENS.colors.primaryLight }}>Banque: {player.bank} $</div>
              </div>
            </div>
          </>
        )}

        <button
          onClick={onToggleWorld3D}
          style={{
            background: isWorldActive ? CITY_TOKENS.colors.bgCard : CITY_TOKENS.colors.accentBlue,
            color: isWorldActive ? CITY_TOKENS.colors.textMain : CITY_TOKENS.colors.textLight,
            fontWeight: 800,
            fontSize: '13px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: CITY_TOKENS.borderRadius.md,
            cursor: 'pointer',
            boxShadow: CITY_TOKENS.shadows.card,
            transition: 'all 0.15s ease',
          }}
        >
          {isWorldActive ? "🏛️ Retour au Portail Civil" : "🏛️ Lancer la Ville 3D (Mode V5)"}
        </button>
      </div>
    </header>
  );
};

export default TopNavigation;
