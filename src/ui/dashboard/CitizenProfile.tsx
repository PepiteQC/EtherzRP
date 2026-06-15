/**
 * src/ui/dashboard/CitizenProfile.tsx
 * 
 * Dossier Citoyen Officiel (Identité, Permis & Métriques de Survie).
 * Remplante tout affichage copié de FiveM par une carte d'identité québécoise légitime.
 */

import React from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import { useAuthStore } from '../../store/authStore';

export const CitizenProfile: React.FC = () => {
  const auth   = useAuthStore();
  const player = auth.player;

  if (!player) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      
      {/* 1. CARTE D'IDENTITÉ QUÉBÉCOISE (IC) */}
      <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${CITY_TOKENS.colors.primary}`, paddingBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: CITY_TOKENS.colors.primary }}>RÉPUBLIQUE DU QUÉBEC</div>
            <div style={{ fontSize: '11px', color: CITY_TOKENS.colors.textSecondary, letterSpacing: '1px' }}>CERTIFICAT DE CITOYENNETÉ IN-CHARACTER</div>
          </div>
          <div style={{ fontSize: '32px' }}>⚜️</div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Photo Identité Fictive */}
          <div
            style={{
              width: '100px',
              height: '130px',
              background: CITY_TOKENS.colors.bgRoot,
              border: `1px solid ${CITY_TOKENS.colors.border}`,
              borderRadius: CITY_TOKENS.borderRadius.md,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: CITY_TOKENS.colors.textMuted,
              fontSize: '36px',
            }}
          >
            👤
            <span style={{ fontSize: '10px', marginTop: '8px' }}>ID: {player.uid.slice(0, 6)}</span>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <div>
              <span style={{ color: CITY_TOKENS.colors.textMuted, fontSize: '11px', display: 'block' }}>Nom de Famille</span>
              <strong style={{ fontSize: '16px', color: CITY_TOKENS.colors.textMain }}>{player.lastName.toUpperCase()}</strong>
            </div>
            <div>
              <span style={{ color: CITY_TOKENS.colors.textMuted, fontSize: '11px', display: 'block' }}>Prénom Civil</span>
              <strong style={{ fontSize: '16px', color: CITY_TOKENS.colors.textMain }}>{player.firstName}</strong>
            </div>
            <div>
              <span style={{ color: CITY_TOKENS.colors.textMuted, fontSize: '11px', display: 'block' }}>Origine / Résidence</span>
              <strong style={{ color: CITY_TOKENS.colors.accentBlue }}>{player.currentZone}</strong>
            </div>
          </div>
        </div>

        {/* Affiliation / Gang / Entreprise */}
        <div style={{ background: CITY_TOKENS.colors.bgRoot, padding: '12px 16px', borderRadius: CITY_TOKENS.borderRadius.md, fontSize: '13px' }}>
          <span style={{ color: CITY_TOKENS.colors.textSecondary, marginRight: '8px' }}>Affiliation Légale ou Privée :</span>
          <strong style={{ color: CITY_TOKENS.colors.primary }}>{player.gang || "Aucune (Citoyen Indépendant)"}</strong>
        </div>
      </div>

      {/* 2. REGISTRE DES PERMIS & ACCRÉDITATIONS */}
      <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: CITY_TOKENS.colors.primary }}>
          📋 Registre des Permis (S.A.A.Q.)
        </h3>
        <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, margin: '0 0 12px' }}>
          L'ensemble des documents in-character ci-dessous font foi lors d'un contrôle de la Sûreté du Québec.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ ...permisCardStyle, borderColor: player.licenses.driver ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.danger }}>
            <span style={{ fontSize: '20px' }}>🚗</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>Permis de Conduire Classe 5 (QC)</div>
              <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.textSecondary }}>Autorise le pilotage de véhicules de promenade et pickups.</div>
            </div>
            <span style={{ ...badgeStyle, background: player.licenses.driver ? CITY_TOKENS.colors.successBg : CITY_TOKENS.colors.dangerBg, color: player.licenses.driver ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.danger }}>
              {player.licenses.driver ? "✓ CONFORME" : "❌ RÉVOQUÉ"}
            </span>
          </div>

          <div style={{ ...permisCardStyle, borderColor: player.licenses.weapon ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.border }}>
            <span style={{ fontSize: '20px' }}>🛡️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>Permis de Port d'Arme Fédéral</div>
              <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.textSecondary }}>Délivré pour tir sportif, chasse ou fonctions policières.</div>
            </div>
            <span style={{ ...badgeStyle, background: player.licenses.weapon ? CITY_TOKENS.colors.successBg : CITY_TOKENS.colors.bgRoot, color: player.licenses.weapon ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.textSecondary }}>
              {player.licenses.weapon ? "✓ VALIDÉ" : "NON ACQUIS"}
            </span>
          </div>

          <div style={{ ...permisCardStyle, borderColor: player.licenses.business ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.border }}>
            <span style={{ fontSize: '20px' }}>🏢</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '14px' }}>Licence de Commerce Municipal</div>
              <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.textSecondary }}>Requise pour la gestion de caisse ou d'un entrepôt de pièces.</div>
            </div>
            <span style={{ ...badgeStyle, background: player.licenses.business ? CITY_TOKENS.colors.successBg : CITY_TOKENS.colors.bgRoot, color: player.licenses.business ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.textSecondary }}>
              {player.licenses.business ? "✓ VALIDÉ" : "NON ACQUIS"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. MÉTRIQUES DE SURVIE MUNICIPALES EN DIRECT (Health, Stress, Faim, Soif) */}
      <div className="card-municipal" style={{ gridColumn: 'span 2' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px', color: CITY_TOKENS.colors.primary }}>
          🩺 Constantes Biologiques (Survie In-Character)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <span>Santé Civile</span>
              <span style={{ color: CITY_TOKENS.colors.success }}>{player.health} %</span>
            </div>
            <div style={{ background: CITY_TOKENS.colors.bgRoot, height: '10px', borderRadius: CITY_TOKENS.borderRadius.full, overflow: 'hidden' }}>
              <div style={{ background: CITY_TOKENS.colors.success, width: `${player.health}%`, height: '100%' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <span>Hydratation (Soif)</span>
              <span style={{ color: CITY_TOKENS.colors.accentBlue }}>Math.round({player.thirst}) %</span>
            </div>
            <div style={{ background: CITY_TOKENS.colors.bgRoot, height: '10px', borderRadius: CITY_TOKENS.borderRadius.full, overflow: 'hidden' }}>
              <div style={{ background: CITY_TOKENS.colors.accentBlue, width: `${player.thirst}%`, height: '100%' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <span>Satiété (Faim)</span>
              <span style={{ color: CITY_TOKENS.colors.warning }}>Math.round({player.hunger}) %</span>
            </div>
            <div style={{ background: CITY_TOKENS.colors.bgRoot, height: '10px', borderRadius: CITY_TOKENS.borderRadius.full, overflow: 'hidden' }}>
              <div style={{ background: CITY_TOKENS.colors.warning, width: `${player.hunger}%`, height: '100%' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <span>Indice de Stress</span>
              <span style={{ color: player.stress > 50 ? CITY_TOKENS.colors.danger : CITY_TOKENS.colors.textSecondary }}>Math.round({player.stress}) %</span>
            </div>
            <div style={{ background: CITY_TOKENS.colors.bgRoot, height: '10px', borderRadius: CITY_TOKENS.borderRadius.full, overflow: 'hidden' }}>
              <div style={{ background: player.stress > 50 ? CITY_TOKENS.colors.danger : CITY_TOKENS.colors.textSecondary, width: `${player.stress}%`, height: '100%' }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

const permisCardStyle: React.CSSProperties = {
  background: CITY_TOKENS.colors.bgCard,
  border: '2px solid',
  borderRadius: CITY_TOKENS.borderRadius.md,
  padding: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 900,
  padding: '4px 10px',
  borderRadius: CITY_TOKENS.borderRadius.full,
};

export default CitizenProfile;
