/**
 * src/ui/dashboard/PropertiesPanel.tsx
 * 
 * Cadastre Municipal et Registre Immobilier.
 * Permet l'acquisition de propriétés, la gestion de serrures et l'administration des locataires.
 */

import React, { useState } from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import { useAuthStore } from '../../store/authStore';
import { EtherNodeApiClient } from '../../api/etherApi';
import type { PropertyDocument } from '../../lib/firebase/firestoreSchema';

export const PropertiesPanel: React.FC = () => {
  const [notify, setNotify] = useState<string | null>(null);
  const player = useAuthStore(s => s.player);

  const [properties, setProperties] = useState<PropertyDocument[]>([
    {
      propertyId: 'motel_101',
      ownerUid: player?.uid || 'citoyen',
      type: 'motel_room',
      address: 'Chambre de Motel 101 (Route 138)',
      locked: true,
      storage: { maxWeight: 50.0, items: [] },
      tenants: [],
      accessList: [player?.uid || 'citoyen'],
    },
    {
      propertyId: 'house_24',
      ownerUid: player?.uid || 'citoyen',
      type: 'house',
      address: 'Bungalow Municipal 24 (Limoilou)',
      locked: false,
      storage: { maxWeight: 150.0, items: [] },
      tenants: ['maxime_tremblay'],
      accessList: [player?.uid || 'citoyen', 'maxime_tremblay'],
    },
    {
      propertyId: 'warehouse_downtown',
      ownerUid: player?.uid || 'citoyen',
      type: 'warehouse',
      address: 'Entrepôt Logistique Municipal (Charest)',
      locked: true,
      storage: { maxWeight: 500.0, items: [] },
      tenants: ['entreprise_ti_guy'],
      accessList: [player?.uid || 'citoyen', 'entreprise_ti_guy'],
    }
  ]);

  const toggleLock = async (propId: string, currentLocked: boolean) => {
    try {
      const res = await EtherNodeApiClient.lockProperty(propId, !currentLocked);
      setProperties(properties.map(p => p.propertyId === propId ? { ...p, locked: res.new_state } : p));
      setNotify(`✓ Serrure de la propriété basculée en mode : ${res.new_state ? "Verrouillé" : "Ouvert"} !`);
      setTimeout(() => setNotify(null), 3000);
    } catch (err: any) {
      setNotify(`⚠️ Erreur: ${err.message || "Impossible d'actionner la serrure."}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. EN-TÊTE DU CADASTRE MUNICIPAL */}
      <div className="card-municipal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CITY_TOKENS.colors.primary, color: CITY_TOKENS.colors.textLight }}>
        <div>
          <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.primaryLight, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
            REGISTRE DES ACTES NOTARIÉS
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '0 0 8px' }}>
            Immobilier & Foncier Fédéral
          </h2>
          <p style={{ fontSize: '14px', color: CITY_TOKENS.colors.primaryLight, margin: 0 }}>
            L'ensemble de vos serrures électroniques In-Character sont raccordées en temps réel au serveur Node.
          </p>
        </div>
        <div style={{ fontSize: '48px' }}>📜</div>
      </div>

      {notify && (
        <div style={{ background: CITY_TOKENS.colors.accentBlue, color: CITY_TOKENS.colors.textLight, padding: '12px', borderRadius: CITY_TOKENS.borderRadius.md, fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>
          {notify}
        </div>
      )}

      {/* 2. LISTE DES BIENS ACQUIS */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: CITY_TOKENS.colors.textMain, margin: '0 0 16px' }}>
          🏡 Biens Immobiliers Possédés
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {properties.map(prop => (
            <div
              key={prop.propertyId}
              className="card-municipal"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 900, background: CITY_TOKENS.colors.primaryLight, color: CITY_TOKENS.colors.primary, padding: '4px 10px', borderRadius: CITY_TOKENS.borderRadius.sm, textTransform: 'uppercase' }}>
                    {prop.type}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: prop.locked ? CITY_TOKENS.colors.danger : CITY_TOKENS.colors.success }}>
                    {prop.locked ? "🔒 SERRURE FERMÉE" : "🔓 ACCÈS LIBRE"}
                  </span>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 800, color: CITY_TOKENS.colors.textMain, margin: '0 0 8px' }}>
                  {prop.address}
                </h4>
                
                <div style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, marginBottom: '16px' }}>
                  Capacité du coffre immobilier : <strong style={{ color: CITY_TOKENS.colors.textMain }}>{prop.storage.maxWeight} kg</strong>
                </div>

                <div style={{ background: CITY_TOKENS.colors.bgRoot, padding: '12px', borderRadius: CITY_TOKENS.borderRadius.sm, fontSize: '12px' }}>
                  <span style={{ color: CITY_TOKENS.colors.textSecondary, display: 'block', marginBottom: '4px' }}>Citoyens accrédités :</span>
                  <strong style={{ color: CITY_TOKENS.colors.accentBlue }}>{prop.accessList.join(", ")}</strong>
                </div>
              </div>

              <button
                onClick={() => toggleLock(prop.propertyId, prop.locked)}
                style={{
                  width: '100%',
                  background: prop.locked ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.primary,
                  color: CITY_TOKENS.colors.textLight,
                  fontWeight: 800,
                  fontSize: '13px',
                  padding: '12px',
                  border: 'none',
                  borderRadius: CITY_TOKENS.borderRadius.sm,
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                {prop.locked ? "🔑 Déverrouiller la Porte (Réseau)" : "🔒 Verrouiller la Porte (Réseau)"}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default PropertiesPanel;
