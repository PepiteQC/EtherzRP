/**
 * src/ui/dashboard/JobsCenter.tsx
 * 
 * Centre d'Emplois et de Développement Économique de la Ville de Québec.
 * Permet d'adhérer à une convention collective et de percevoir son salaire via Node.
 */

import React, { useState } from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import { useAuthStore } from '../../store/authStore';
import { EtherNodeApiClient } from '../../api/etherApi';
import type { JobCategory } from '../../lib/firebase/firestoreSchema';

export const JobsCenter: React.FC = () => {
  const [claiming, setClaiming] = useState(false);
  const [notice, setNotice]     = useState<string | null>(null);

  const auth   = useAuthStore();
  const player = auth.player;

  if (!player) return null;

  const CAREER_OPTIONS: Array<{ id: JobCategory; title: string; salary: string; icon: string; desc: string; sector: string }> = [
    {
      id: 'police', title: 'Agent de la Sûreté du Québec', salary: '350 $ / versement', icon: '🚓',
      desc: 'Veille à la sécurité des biens et des personnes. Contrôle radar sur la Route 138 et gestion de fourrière.',
      sector: 'Sécurité Publique',
    },
    {
      id: 'medic', title: 'Paramédic Urgences-Santé', salary: '320 $ / versement', icon: '🚑',
      desc: 'Intervention d\'urgence sur les accidents routiers. Ranimation et transfert vers l\'hôpital Saint-Raymond.',
      sector: 'Santé Publique',
    },
    {
      id: 'mecano', title: 'Mécanicien Spécialisé Ti-Guy', salary: '280 $ / versement', icon: '🔧',
      desc: 'Entretien de la flotte automobile. Opération des ponts hydrauliques et commande d\'entrepôt de pièces.',
      sector: 'Secteur Privé',
    },
    {
      id: 'travailleur', title: 'Travailleur de Chantier (Hydro-QC)', salary: '250 $ / versement', icon: '🚜',
      desc: 'Maintenance du réseau électrique laurentien et transport de machinerie lourde dans le Portneuf.',
      sector: 'Secteur Industriel',
    },
    {
      id: 'restaurateur', title: 'Gérant de Commerce / Dépanneur', salary: '220 $ / versement', icon: '🏪',
      desc: 'Opération de la caisse enregistreuse lumineuse. Réapprovisionnement des étagères de snacks et boissons.',
      sector: 'Secteur Commercial',
    },
    {
      id: 'civil', title: 'Citoyen Libre / Indépendant', salary: '150 $ / versement', icon: '🚶‍♂️',
      desc: 'Citoyen sans affectation municipale fixe. Reçoit l\'allocation universelle garantie de la métropole.',
      sector: 'Indépendant',
    },
  ];

  const handleJobSelect = async (jobId: JobCategory) => {
    try {
      EtherNodeApiClient.updatePlayerSurvivalStatus({ }); // Ping server
      useAuthStore.setState(s => ({
        player: s.player ? { ...s.player, job: jobId } : null,
      }));
      setNotice(`✓ Contrat ratifié. Vous êtes maintenant : ${jobId.toUpperCase()} !`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setNotice("⚠️ Impossible de changer d'affectation.");
    }
  };

  const handleSalaryClaim = async () => {
    if (claiming) return;
    setClaiming(true);

    try {
      const res = await EtherNodeApiClient.requestJobPay(player.job);
      useAuthStore.setState(s => ({
        player: s.player ? { ...s.player, bank: res.newBank } : null,
      }));
      setNotice(`✓ Versement de ${res.amountPaid} $ effectué sur votre compte bancaire protégé !`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(`⚠️ ${err.message || "Erreur de paiement."}`);
    }
    setClaiming(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. EN-TÊTE CONTRAT & SALAIRE */}
      <div className="card-municipal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CITY_TOKENS.colors.primaryLight, borderColor: CITY_TOKENS.colors.accentBlue }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: CITY_TOKENS.colors.primary, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
            CONTRAT PROFESSIONNEL EN COURS
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: CITY_TOKENS.colors.textMain, margin: '0 0 8px', textTransform: 'capitalize' }}>
            {player.job} de Québec
          </h2>
          <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, margin: 0 }}>
            Les versements salariaux sont débloqués périodiquement sur demande au Trésor Municipal.
          </p>
        </div>

        <button
          onClick={handleSalaryClaim}
          disabled={claiming}
          style={{
            background: CITY_TOKENS.colors.success,
            color: CITY_TOKENS.colors.textLight,
            fontWeight: 800,
            fontSize: '14px',
            padding: '14px 28px',
            border: 'none',
            borderRadius: CITY_TOKENS.borderRadius.md,
            cursor: 'pointer',
            boxShadow: CITY_TOKENS.shadows.card,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>💰</span>
          <span>{claiming ? "Vérification Trésor..." : "Réclamer mon Salaire Municipal"}</span>
        </button>
      </div>

      {notice && (
        <div style={{ background: CITY_TOKENS.colors.primary, color: CITY_TOKENS.colors.textLight, padding: '12px 20px', borderRadius: CITY_TOKENS.borderRadius.md, fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>
          {notice}
        </div>
      )}

      {/* 2. OFFRES D'EMPLOIS MUNICIPALES */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: CITY_TOKENS.colors.textMain, margin: '0 0 16px' }}>
          🏢 Offres de Carrières (Affection Libre)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {CAREER_OPTIONS.map((item) => {
            const active = player.job === item.id;
            return (
              <div
                key={item.id}
                className="card-municipal"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: active ? `2px solid ${CITY_TOKENS.colors.accentBlue}` : `1px solid ${CITY_TOKENS.colors.border}`,
                  background: active ? CITY_TOKENS.colors.bgInput : CITY_TOKENS.colors.bgCard,
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{item.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: CITY_TOKENS.colors.primaryLight, color: CITY_TOKENS.colors.primary, padding: '4px 10px', borderRadius: CITY_TOKENS.borderRadius.full }}>
                      {item.sector}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px', color: CITY_TOKENS.colors.textMain }}>
                    {item.title}
                  </h4>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: CITY_TOKENS.colors.success, marginBottom: '10px' }}>
                    {item.salary}
                  </div>
                  <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleJobSelect(item.id)}
                  disabled={active}
                  style={{
                    background: active ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.primary,
                    color: CITY_TOKENS.colors.textLight,
                    fontWeight: 700,
                    fontSize: '13px',
                    padding: '10px',
                    border: 'none',
                    borderRadius: CITY_TOKENS.borderRadius.sm,
                    cursor: active ? 'default' : 'pointer',
                  }}
                >
                  {active ? "✓ POSTE OCCUPÉ ACTUELLEMENT" : "→ Soumettre ma Candidature"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default JobsCenter;
