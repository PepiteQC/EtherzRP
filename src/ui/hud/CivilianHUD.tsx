/**
 * src/ui/hud/CivilianHUD.tsx
 * 
 * Affichage Tête Haute (HUD) Discret et Minimaliste pour la Ville 3D.
 * Connecte le StreetMinimap, le solde bancaire et l'InteractionPrompt avec une élégance sobre.
 */

import React from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import StreetMinimap from './StreetMinimap';
import { useAuthStore } from '../../store/authStore';

export const CivilianHUD: React.FC = () => {
  const auth   = useAuthStore();
  const player = auth.player;

  if (!player) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        fontFamily: CITY_TOKENS.typography.fontFamily,
      }}
    >
      {/* 1. TOP SECTION : GPS MINIMAP (Accrochée en haut à droite) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
        <StreetMinimap
          playerX={player.position[0]}
          playerZ={player.position[2]}
          zoneName={player.currentZone}
        />
      </div>

      {/* 2. BOTTOM SECTION : MÉTRIQUES VITALES & FINANCIÈRES SOBRES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'auto' }}>
        
        {/* Constantes Civiles de gauche */}
        <div style={{ background: CITY_TOKENS.colors.bgCard, border: `1px solid ${CITY_TOKENS.colors.border}`, padding: '12px 18px', borderRadius: CITY_TOKENS.borderRadius.lg, display: 'flex', alignItems: 'center', gap: '20px', boxShadow: CITY_TOKENS.shadows.card }}>
          <div>
            <span style={{ fontSize: '10px', color: CITY_TOKENS.colors.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Santé & Survie</span>
            <strong style={{ fontSize: '15px', fontWeight: 900, color: CITY_TOKENS.colors.success }}>{player.health} %</strong>
          </div>

          <div style={{ width: '1px', height: '24px', background: CITY_TOKENS.colors.border }} />

          <div>
            <span style={{ fontSize: '10px', color: CITY_TOKENS.colors.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Hydratation</span>
            <strong style={{ fontSize: '15px', fontWeight: 900, color: CITY_TOKENS.colors.accentBlue }}>Math.round({player.thirst}) %</strong>
          </div>

          <div style={{ width: '1px', height: '24px', background: CITY_TOKENS.colors.border }} />

          <div>
            <span style={{ fontSize: '10px', color: CITY_TOKENS.colors.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Stress Civil</span>
            <strong style={{ fontSize: '15px', fontWeight: 900, color: player.stress > 50 ? CITY_TOKENS.colors.danger : CITY_TOKENS.colors.textSecondary }}>Math.round({player.stress}) %</strong>
          </div>
        </div>

        {/* Compte en Banque & Espèces de droite */}
        <div style={{ background: CITY_TOKENS.colors.primary, color: CITY_TOKENS.colors.textLight, padding: '14px 20px', borderRadius: CITY_TOKENS.borderRadius.lg, display: 'flex', alignItems: 'center', gap: '20px', boxShadow: CITY_TOKENS.shadows.card, border: `2px solid ${CITY_TOKENS.colors.accentBlue}` }}>
          <div>
            <span style={{ fontSize: '10px', color: CITY_TOKENS.colors.primaryLight, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Argent Liquide</span>
            <strong style={{ fontSize: '18px', fontWeight: 900, color: CITY_TOKENS.colors.successBg }}>{player.cash} $</strong>
          </div>
          
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.2)' }} />

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: CITY_TOKENS.colors.primaryLight, display: 'block', textTransform: 'uppercase', fontWeight: 800 }}>Banque Fédérale</span>
            <strong style={{ fontSize: '16px', fontWeight: 900 }}>{player.bank} $</strong>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CivilianHUD;
