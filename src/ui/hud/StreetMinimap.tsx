/**
 * src/ui/hud/StreetMinimap.tsx
 * 
 * Mini-carte de Style GPS Propre (S.A.A.Q. / Sûreté QC).
 * Remplace toute minimap ronde FiveM ou hacky par une carte vectorielle sobre institutionnelle.
 */

import React from 'react';
import CITY_TOKENS from '../theme/cityTokens';

interface MinimapProps {
  playerX: number;
  playerZ: number;
  zoneName: string;
}

export const StreetMinimap: React.FC<MinimapProps> = ({ playerX, playerZ, zoneName }) => {
  return (
    <div
      style={{
        background: CITY_TOKENS.colors.bgCard,
        border: `2px solid ${CITY_TOKENS.colors.border}`,
        borderRadius: CITY_TOKENS.borderRadius.lg,
        padding: '12px',
        width: '210px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: CITY_TOKENS.shadows.card,
        userSelect: 'none',
      }}
    >
      {/* SECTEUR GPS EN-TÊTE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${CITY_TOKENS.colors.border}`, paddingBottom: '6px' }}>
        <span style={{ fontSize: '10px', fontWeight: 900, color: CITY_TOKENS.colors.primary, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          📍 {zoneName}
        </span>
        <span style={{ background: CITY_TOKENS.colors.successBg, color: CITY_TOKENS.colors.success, fontSize: '9px', padding: '1px 6px', borderRadius: CITY_TOKENS.borderRadius.full, fontWeight: 900 }}>
          GPS ACTIF
        </span>
      </div>

      {/* REPRÉSENTATION VECTORIElLE SIMPLE (S.A.A.Q.) */}
      <div
        style={{
          background: CITY_TOKENS.colors.bgRoot,
          height: '130px',
          borderRadius: CITY_TOKENS.borderRadius.md,
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${CITY_TOKENS.colors.border}`,
        }}
      >
        {/* Grille de Routes Sobres */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '14px', background: CITY_TOKENS.colors.bgCard, borderTop: `2px solid ${CITY_TOKENS.colors.warning}`, borderBottom: `2px solid ${CITY_TOKENS.colors.warning}` }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '12px', background: CITY_TOKENS.colors.bgCard, borderLeft: `1px solid ${CITY_TOKENS.colors.textSecondary}`, borderRight: `1px solid ${CITY_TOKENS.colors.textSecondary}` }} />

        {/* Marqueur du Citoyen / Shérif */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px',
            height: '12px',
            background: CITY_TOKENS.colors.accentBlue,
            border: `2px solid ${CITY_TOKENS.colors.textLight}`,
            borderRadius: CITY_TOKENS.borderRadius.full,
            boxShadow: '0 0 8px rgba(2, 132, 199, 0.8)',
            animation: 'pulse 2s infinite',
          }}
        />
      </div>

      {/* COORDONNÉES EXACTES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: CITY_TOKENS.colors.textSecondary, fontWeight: 700 }}>
        <span>LAT: {Math.round(playerX)}</span>
        <span>LONG: {Math.round(playerZ)}</span>
      </div>
    </div>
  );
};

export default StreetMinimap;
