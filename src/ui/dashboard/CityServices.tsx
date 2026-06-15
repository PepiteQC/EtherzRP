/**
 * src/ui/dashboard/CityServices.tsx
 * 
 * Portail d'Accès Administratif aux 5 Grands Services Publics de la Ville de Québec.
 * Respecte strictement l'esthétique institutionnelle municipale moderne.
 */

import React, { useState } from 'react';
import CITY_TOKENS from '../theme/cityTokens';

export const CityServices: React.FC = () => {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [actionNotice, setActionNotice]   = useState<string | null>(null);

  const triggerServiceAction = (serviceTitle: string) => {
    setActionNotice(`✓ Accréditation transmise. Le service [${serviceTitle}] a enregistré votre requête In-Character.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const SERVICES_LIST = [
    {
      id: 'police', title: 'Sûreté du Québec · Bureau du Shérif', icon: '🚨',
      desc: 'Accès aux registres de casiers judiciaires, gestionnaire des grilles de détention et requêtes de libération de véhicules sous fourrière municipale.',
      badge: 'Sécurité Publique',
    },
    {
      id: 'hospital', title: 'Hôpital Régional Saint-Raymond', icon: '🚑',
      desc: 'Portail de soins de santé. Renseignements sur les couvertures d\'assurance-maladie, transferts de patients et réanimation de crise.',
      badge: 'Santé & Urgence',
    },
    {
      id: 'garage', title: 'Atelier Central Ti-Guy (Route 138)', icon: '🔧',
      desc: 'Gestion logistique du parc automobile. Demande d\'examen mécanique sur les ponts hydrauliques et commande certifiée d\'entrepôt de pièces.',
      badge: 'Maintenance',
    },
    {
      id: 'motel', title: 'Régie Immobilière des Laurentides', icon: '🛏️',
      desc: 'Administration du foncier et des locations de passage. Registre notarié des chambres de motel 101 et gestion des listes d\'accréditation clés.',
      badge: 'Immobilier Foncier',
    },
    {
      id: 'sap', title: 'Syndicat des Alcools (S.A.P.) & Dépanneurs', icon: '🏪',
      desc: 'Portail commercial unifié. Autorisations d\'exploitation de caisses de vente, droits d\'achats de grands crus locaux et réapprovisionnement.',
      badge: 'Commerce Local',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* EN-TÊTE DES SERVICES */}
      <div className="card-municipal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CITY_TOKENS.colors.primaryLight, borderColor: CITY_TOKENS.colors.accentBlue }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: CITY_TOKENS.colors.primary, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
            RÉPERTOIRE ADMINISTRATIF
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: CITY_TOKENS.colors.textMain, margin: '0 0 8px' }}>
            Services Municipaux en Ligne
          </h2>
          <p style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary, margin: 0, maxWidth: '650px' }}>
            Sélectionnez l'une des entités du service public ci-dessous pour transmettre une instruction prioritaire ou consulter les documents d'exploitation.
          </p>
        </div>
        <div style={{ fontSize: '48px' }}>🚨</div>
      </div>

      {actionNotice && (
        <div style={{ background: CITY_TOKENS.colors.successBg, color: CITY_TOKENS.colors.success, padding: '14px', borderRadius: CITY_TOKENS.borderRadius.md, fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>
          {actionNotice}
        </div>
      )}

      {/* GRILLE DES 5 SERVICES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {SERVICES_LIST.map((srv) => {
          const selected = activeService === srv.id;

          return (
            <div
              key={srv.id}
              className="card-municipal"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: selected ? CITY_TOKENS.colors.accentBlue : CITY_TOKENS.colors.border,
                background: selected ? CITY_TOKENS.colors.bgInput : CITY_TOKENS.colors.bgCard,
                gap: '20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontSize: '32px' }}>{srv.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 800, background: CITY_TOKENS.colors.primary, color: CITY_TOKENS.colors.textLight, padding: '4px 10px', borderRadius: CITY_TOKENS.borderRadius.full }}>
                    {srv.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px', color: CITY_TOKENS.colors.textMain }}>
                  {srv.title}
                </h3>
                
                <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
                  {srv.desc}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setActiveService(srv.id); triggerServiceAction(srv.title); }}
                  style={{
                    flex: 1,
                    background: CITY_TOKENS.colors.primary,
                    color: CITY_TOKENS.colors.textLight,
                    fontWeight: 700,
                    fontSize: '13px',
                    padding: '12px',
                    border: 'none',
                    borderRadius: CITY_TOKENS.borderRadius.sm,
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  → Accéder au Guichet du Service
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default CityServices;
