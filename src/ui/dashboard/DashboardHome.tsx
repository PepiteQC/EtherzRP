/**
 * src/ui/dashboard/DashboardHome.tsx
 * 
 * Page d'Accueil Principale du Citoyen.
 * Fournit un tableau de bord exécutif récapitulant sa vie dans la municipalité de Québec.
 */

import React from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import { useAuthStore } from '../../store/authStore';

export const DashboardHome: React.FC = () => {
  const auth   = useAuthStore();
  const player = auth.player;

  if (!player) {
    return (
      <div className="card-municipal" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Veuillez vous authentifier</h2>
        <p>Connectez-vous pour accéder à vos services municipaux.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      
      {/* COLONNE PRINCIPALE DE GAUCHE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* CARTE DE BIENVENUE MUNICIPALE */}
        <div
          style={{
            background: `linear-gradient(135deg, ${CITY_TOKENS.colors.primary}, ${CITY_TOKENS.colors.primaryHover})`,
            color: CITY_TOKENS.colors.textLight,
            borderRadius: CITY_TOKENS.borderRadius.lg,
            padding: '32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '140px', opacity: 0.1, pointerEvents: 'none' }}>
            ⚜️
          </div>
          <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.primaryLight, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
            STATUT CITOYEN · EN RÈGLE
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 12px' }}>
            Bonjour, {player.firstName} {player.lastName}
          </h2>
          <p style={{ fontSize: '15px', color: CITY_TOKENS.colors.primaryLight, margin: 0, maxWidth: '500px', lineHeight: 1.6 }}>
            Bienvenue sur votre portail municipal en ligne. L'ensemble de vos autorisations, permis de conduire et allocations de subsistance sont à jour pour la session d'aujourd'hui.
          </p>
        </div>

        {/* GRILLE D'ACCÈS RAPIDES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card-municipal">
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>💼</div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px' }}>Emploi Actif</h3>
            <p style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary, margin: '0 0 16px', textTransform: 'capitalize' }}>
              {player.job} de la Ville de Québec
            </p>
            <div style={{ fontSize: '12px', fontWeight: 700, color: CITY_TOKENS.colors.accentBlue }}>
              → Voir la convention collective en ligne
            </div>
          </div>

          <div className="card-municipal">
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🚗</div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px' }}>Immatriculation</h3>
            <p style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary, margin: '0 0 16px' }}>
              Flotte inspectée conforme sous la S.A.A.Q.
            </p>
            <div style={{ fontSize: '12px', fontWeight: 700, color: CITY_TOKENS.colors.success }}>
              → Vignette valide · Route 138
            </div>
          </div>
        </div>
      </div>

      {/* COLONNE SECONDAIRE DE DROITE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SOLDES MUNICIPAUX */}
        <div className="card-municipal">
          <div style={{ fontSize: '11px', fontWeight: 800, color: CITY_TOKENS.colors.textMuted, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
            RELEVÉ COMPTABLE
          </div>

          <div style={{ background: CITY_TOKENS.colors.bgRoot, padding: '16px', borderRadius: CITY_TOKENS.borderRadius.md, marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.textSecondary }}>Fonds Bancaires Protégés</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: CITY_TOKENS.colors.primary }}>
              {player.bank} $
            </div>
          </div>

          <div style={{ background: CITY_TOKENS.colors.successBg, padding: '16px', borderRadius: CITY_TOKENS.borderRadius.md }}>
            <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.success }}>Argent Liquide Immeuble</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: CITY_TOKENS.colors.success }}>
              {player.cash} $
            </div>
          </div>
        </div>

        {/* METEO & SECTEUR */}
        <div className="card-municipal" style={{ background: CITY_TOKENS.colors.primaryLight, borderColor: CITY_TOKENS.colors.borderActive }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: CITY_TOKENS.colors.primary }}>Secteur Spatial</span>
            <span style={{ fontSize: '20px' }}>☀️</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: CITY_TOKENS.colors.primary, marginBottom: '4px' }}>
            {player.currentZone}
          </div>
          <div style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary }}>
            Conditions atmosphériques stables · 18°C
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardHome;
