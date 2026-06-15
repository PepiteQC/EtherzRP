/**
 * src/ui/layout/SideMenu.tsx
 * 
 * Panneau de Navigation Latérale (Sidebar) du Portail Municipal.
 * Propose une navigation nette, claire et ordonnée entre les 8 services administratifs.
 */

import React from 'react';
import CITY_TOKENS from '../theme/cityTokens';

export type PortalTab = 'home' | 'profile' | 'jobs' | 'garage' | 'properties' | 'services' | 'inventory' | 'settings';

interface SideMenuProps {
  currentTab: PortalTab;
  onTabChange: (tab: PortalTab) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ currentTab, onTabChange }) => {
  const MENU_ITEMS: Array<{ id: PortalTab; label: string; icon: string; badge?: string }> = [
    { id: 'home',       label: 'Accueil Municipal',    icon: '🏛️' },
    { id: 'profile',    label: 'Dossier Citoyen',      icon: '📁' },
    { id: 'jobs',       label: 'Centre d\'Emplois',    icon: '💼' },
    { id: 'garage',     label: 'Registre Automobile',  icon: '🚙' },
    { id: 'properties', label: 'Immobilier & Verrous', icon: '🗝️' },
    { id: 'inventory',  label: 'Inventaire Personnel', icon: '📦' },
    { id: 'services',   label: 'Services Publics',     icon: '🚨' },
    { id: 'settings',   label: 'Paramètres du Poste',  icon: '⚙️' },
  ];

  return (
    <aside
      style={{
        background: CITY_TOKENS.colors.bgSidebar,
        width: '260px',
        borderRight: `1px solid ${CITY_TOKENS.colors.border}`,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 800, color: CITY_TOKENS.colors.textMuted, padding: '0 12px 8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
        SERVICES EN LIGNE
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {MENU_ITEMS.map((item) => {
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                background: active ? CITY_TOKENS.colors.primaryLight : 'transparent',
                color: active ? CITY_TOKENS.colors.primary : CITY_TOKENS.colors.textSecondary,
                fontWeight: active ? 800 : 600,
                fontSize: '14px',
                padding: '12px 16px',
                border: 'none',
                borderRadius: CITY_TOKENS.borderRadius.md,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: CITY_TOKENS.colors.success, color: CITY_TOKENS.colors.textLight, fontSize: '10px', padding: '2px 6px', borderRadius: CITY_TOKENS.borderRadius.full, fontWeight: 900 }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: `1px solid ${CITY_TOKENS.colors.border}`, fontSize: '11px', color: CITY_TOKENS.colors.textMuted, textAlign: 'center', lineHeight: 1.5 }}>
        <div>Ville de Québec © 2026</div>
        <div>Système Connecté 100% Sécurisé</div>
      </div>
    </aside>
  );
};

export default SideMenu;
