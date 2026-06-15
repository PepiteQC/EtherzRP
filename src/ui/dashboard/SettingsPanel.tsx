/**
 * src/ui/dashboard/SettingsPanel.tsx
 * 
 * Préférences Générales et Configuration du Portail Municipal.
 */

import React, { useState } from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import { useAuthStore } from '../../store/authStore';

export const SettingsPanel: React.FC = () => {
  const [notify, setNotify] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    graphics: 'high',
    volume: 85,
    showMinimap: true,
    autosaveInterval: 20, // 20 secondes
  });

  const handleSaveSettings = () => {
    // Synchronise avec le cache
    setNotify("✓ Nouvelles spécifications enregistrées avec succès au registre local.");
    setTimeout(() => setNotify(null), 3000);
  };

  return (
    <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '750px' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: CITY_TOKENS.colors.primary }}>
          ⚙️ Réglages Systèmes & Rendu
        </h3>
        <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, margin: 0 }}>
          Calibrez la fidélité de votre terminal Three.js et vos options de connectivité serveur.
        </p>
      </div>

      {notify && (
        <div style={{ background: CITY_TOKENS.colors.successBg, color: CITY_TOKENS.colors.success, padding: '12px', borderRadius: CITY_TOKENS.borderRadius.md, fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>
          {notify}
        </div>
      )}

      {/* Rendu Graphique */}
      <div>
        <label style={{ ...labelStyle, color: CITY_TOKENS.colors.primary }}>Qualité du Pipeline Shaders (Three.js)</label>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['low', 'medium', 'high'] as const).map(quality => (
            <button
              key={quality}
              onClick={() => setSettings(s => ({ ...s, graphics: quality }))}
              style={{
                ...qualityBtnStyle,
                background: settings.graphics === quality ? CITY_TOKENS.colors.primaryLight : 'transparent',
                borderColor: settings.graphics === quality ? CITY_TOKENS.colors.accentBlue : CITY_TOKENS.colors.border,
                color: settings.graphics === quality ? CITY_TOKENS.colors.accentBlue : CITY_TOKENS.colors.textSecondary,
                fontWeight: settings.graphics === quality ? 800 : 600,
              }}
            >
              {quality === 'high' ? "Haute Fidélité (ACESFilmic)" : quality === 'medium' ? "Équilibré (Standard)" : "Basse (Optimisée)"}
            </button>
          ))}
        </div>
      </div>

      {/* Fréquence Autosave */}
      <div>
        <label style={{ ...labelStyle, color: CITY_TOKENS.colors.primary }}>Fréquence de Synchronisation Spatiale (Autosave Node)</label>
        <div style={{ background: CITY_TOKENS.colors.bgRoot, padding: '14px', borderRadius: CITY_TOKENS.borderRadius.md, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Toutes les {settings.autosaveInterval} secondes</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[15, 20, 30].map(sec => (
              <button
                key={sec}
                onClick={() => setSettings(s => ({ ...s, autosaveInterval: sec }))}
                style={{
                  background: settings.autosaveInterval === sec ? CITY_TOKENS.colors.accentBlue : CITY_TOKENS.colors.bgCard,
                  color: settings.autosaveInterval === sec ? CITY_TOKENS.colors.textLight : CITY_TOKENS.colors.textMain,
                  border: `1px solid ${CITY_TOKENS.colors.border}`,
                  padding: '6px 12px',
                  borderRadius: CITY_TOKENS.borderRadius.sm,
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {sec} s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Volume Audio */}
      <div>
        <label style={{ ...labelStyle, color: CITY_TOKENS.colors.primary }}>Volume Master Municipal</label>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.volume}
          onChange={e => setSettings(s => ({ ...s, volume: Number(e.target.value) }))}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.textMuted, textAlign: 'right', marginTop: '4px' }}>
          {settings.volume} %
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        style={{
          background: CITY_TOKENS.colors.primary,
          color: CITY_TOKENS.colors.textLight,
          fontWeight: 800,
          fontSize: '14px',
          padding: '14px',
          border: 'none',
          borderRadius: CITY_TOKENS.borderRadius.md,
          cursor: 'pointer',
          marginTop: '12px',
          boxShadow: CITY_TOKENS.shadows.card,
        }}
      >
        Sauvegarder les Préférences au Registre
      </button>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 800,
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const qualityBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  border: '1px solid',
  borderRadius: CITY_TOKENS.borderRadius.sm,
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.1s ease',
};

export default SettingsPanel;
