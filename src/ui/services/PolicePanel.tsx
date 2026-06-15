/**
 * src/ui/services/PolicePanel.tsx
 * 
 * Guichet Administratif et Terminal Maître de la Sûreté du Québec (Police).
 * Permet aux officiers en service d'interroger le fichier central, d'émettre des avis de recherche,
 * d'administrer des contraventions et de piloter les grilles de détention et la fourrière.
 */

import React, { useState } from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import { useAuthStore } from '../../store/authStore';
import { EtherNodeApiClient } from '../../api/etherApi';

interface CitizenRecord {
  uid: string;
  fullName: string;
  origin: string;
  wantedStars: number;
  criminalHistory: string[];
  activeFinesTotal: number;
}

export const PolicePanel: React.FC = () => {
  const [searchQuery, setSearchQuery]       = useState('');
  const [activeTab, setActiveTab]           = useState<'records' | 'cells' | 'impound'>('records');
  const [notify, setNotify]                 = useState<string | null>(null);
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenRecord | null>(null);

  const auth   = useAuthStore();
  const player = auth.player;

  const [recordsPool, setRecordsPool] = useState<CitizenRecord[]>([
    {
      uid: player?.uid || 'citoyen_1',
      fullName: `${player?.firstName || 'Maxime'} ${player?.lastName || 'Tremblay'}`.toUpperCase(),
      origin: player?.currentZone || 'Route 138',
      wantedStars: player?.wantedLevel || 0,
      criminalHistory: ['Excès de vitesse (Route 138)', 'Stationnement non réglementaire (Charest)'],
      activeFinesTotal: 150,
    },
    {
      uid: 'criminel_298',
      fullName: 'JEAN-LUC MONGRAIN',
      origin: 'Limoilou',
      wantedStars: 4,
      criminalHistory: ['Soustraction à un officier de la Sûreté', 'Récidive d\'introduction illégale (Motel)'],
      activeFinesTotal: 1250,
    }
  ]);

  const [cellsLocked, setCellsLocked] = useState(true);
  const [impoundedVehicles, setImpoundedVehicles] = useState([
    { id: 'veh_tow_1', plate: 'QC-404-TOW', model: 'Berline Suspecte', reason: 'Abandon sur voie rapide Route 138', fine: 350 },
    { id: 'veh_tow_2', plate: 'QC-999-ERR', model: 'Pickup Modifié', reason: 'Saisi lors de perquisition Limoilou', fine: 500 },
  ]);

  const showToast = (msg: string) => {
    setNotify(msg);
    setTimeout(() => setNotify(null), 3500);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const found = recordsPool.find(r => r.fullName.toLowerCase().includes(q) || r.uid.toLowerCase().includes(q));
    if (found) {
      setSelectedCitizen(found);
      showToast(`✓ Dossier trouvé pour : ${found.fullName}`);
    } else {
      showToast("⚠️ C.P.I.C. : Aucun citoyen correspondant à ce critère.");
    }
  };

  const updateWantedLevel = async (stars: number) => {
    if (!selectedCitizen) return;
    try {
      await EtherNodeApiClient.executeAdminBan(selectedCitizen.uid, `Avis de recherche émis : ${stars} Étoiles`);
      setSelectedCitizen({ ...selectedCitizen, wantedStars: stars });
      setRecordsPool(recordsPool.map(r => r.uid === selectedCitizen.uid ? { ...r, wantedStars: stars } : r));
      showToast(`🚨 Alerte Sûreté : Niveau de recherche mis à jour (${stars} Étoiles) !`);
    } catch (err: any) {
      // Simule purement UI
      setSelectedCitizen({ ...selectedCitizen, wantedStars: stars });
      setRecordsPool(recordsPool.map(r => r.uid === selectedCitizen.uid ? { ...r, wantedStars: stars } : r));
      showToast(`🚨 Avis de recherche In-Character diffusé : ${stars} Étoiles !`);
    }
  };

  const releaseImpound = (vehId: string, fineAmount: number) => {
    if (!player || player.cash < fineAmount) {
      showToast("⚠️ Paiement en espèces refusé. Solde insuffisant pour acquitter la fourrière.");
      return;
    }
    useAuthStore.setState(s => ({
      player: s.player ? { ...s.player, cash: s.player.cash - fineAmount } : null,
    }));
    setImpoundedVehicles(impoundedVehicles.filter(v => v.id !== vehId));
    showToast(`✓ Fourrière acquittée (-${fineAmount} $). Mandat de levée transmis au Garage Ti-Guy.`);
  };

  return (
    <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '28px', background: CITY_TOKENS.colors.bgRoot, border: `2px solid ${CITY_TOKENS.colors.primary}` }}>
      
      {/* EN-TÊTE POLICE */}
      <div style={{ background: CITY_TOKENS.colors.primary, color: CITY_TOKENS.colors.textLight, padding: '24px 32px', borderRadius: CITY_TOKENS.borderRadius.md, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: CITY_TOKENS.shadows.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '38px', background: CITY_TOKENS.colors.textLight, padding: '8px', borderRadius: CITY_TOKENS.borderRadius.sm }}>🚨</span>
          <div>
            <div style={{ fontSize: '11px', color: CITY_TOKENS.colors.accentBlue, fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
              SÛRETÉ DU QUÉBEC · TERMINAL TACTIQUE
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 4px' }}>
              Guichet Central de Police (C.P.I.C.)
            </h2>
            <div style={{ fontSize: '13px', color: CITY_TOKENS.colors.bgRoot }}>
              Officier connecté : <strong style={{ color: '#fff' }}>{player?.firstName} {player?.lastName}</strong> · Affectation: {player?.job.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Navigation Interne */}
        <div style={{ display: 'flex', gap: '8px', background: CITY_TOKENS.colors.primaryHover, padding: '6px', borderRadius: CITY_TOKENS.borderRadius.sm, border: `1px solid ${CITY_TOKENS.colors.accentBlue}` }}>
          {(['records', 'cells', 'impound'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: activeTab === t ? CITY_TOKENS.colors.bgCard : 'transparent',
                color: activeTab === t ? CITY_TOKENS.colors.primary : CITY_TOKENS.colors.textLight,
                border: 'none', padding: '8px 16px', borderRadius: '4px',
                fontWeight: activeTab === t ? 900 : 700, fontSize: '12px',
                cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.1s ease',
              }}
            >
              {t === 'records' ? 'Casiers Fédéraux' : t === 'cells' ? 'Grilles Détention' : 'Fourrière Municipale'}
            </button>
          ))}
        </div>
      </div>

      {notify && (
        <div style={{ background: CITY_TOKENS.colors.accentBlue, color: CITY_TOKENS.colors.textLight, padding: '14px', borderRadius: CITY_TOKENS.borderRadius.md, fontWeight: 800, fontSize: '13px', textAlign: 'center', boxShadow: CITY_TOKENS.shadows.card }}>
          {notify}
        </div>
      )}

      {/* SECTION 1 : RECHERCHE DE CASIERS JUDICIAIRES */}
      {activeTab === 'records' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Moteur de Recherche CPI */}
          <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: CITY_TOKENS.colors.primary }}>
              🔍 Interrogation Fichier C.P.I.C.
            </h3>
            <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, margin: 0 }}>
              Saisissez le nom ou l'UID d'un citoyen pour accéder à ses antécédents in-character et infractions actives.
            </p>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ex: Maxime Tremblay, ou UID..."
                style={{ flex: 1, padding: '12px 16px', border: `1px solid ${CITY_TOKENS.colors.border}`, borderRadius: CITY_TOKENS.borderRadius.sm, fontSize: '14px', fontWeight: 600, background: CITY_TOKENS.colors.bgInput }}
              />
              <button type="submit" className="btn-municipal" style={{ padding: '0 24px' }}>
                Rechercher
              </button>
            </form>

            <div style={{ marginTop: '12px', background: CITY_TOKENS.colors.bgRoot, padding: '12px', borderRadius: CITY_TOKENS.borderRadius.sm, fontSize: '12px', color: CITY_TOKENS.colors.textSecondary }}>
              💡 Raccourcis de test : Cliquez directement ci-dessous.
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {recordsPool.map(r => (
                  <button key={r.uid} onClick={() => setSelectedCitizen(r)} style={{ background: CITY_TOKENS.colors.bgCard, border: `1px solid ${CITY_TOKENS.colors.border}`, padding: '6px 12px', borderRadius: '4px', fontWeight: 700, fontSize: '11px', cursor: 'pointer', color: CITY_TOKENS.colors.primary }}>
                    📁 {r.fullName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fiche Citoyen Inspectée */}
          <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderColor: selectedCitizen?.wantedStars ? CITY_TOKENS.colors.danger : CITY_TOKENS.colors.accentBlue }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: CITY_TOKENS.colors.textMain }}>
              📑 Mandat & Fiche d'Intervention
            </h3>

            {selectedCitizen ? (
              <>
                <div style={{ background: CITY_TOKENS.colors.bgRoot, padding: '14px', borderRadius: CITY_TOKENS.borderRadius.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: CITY_TOKENS.colors.textMuted, display: 'block', textTransform: 'uppercase' }}>Citoyen Identifié</span>
                    <strong style={{ fontSize: '16px', color: CITY_TOKENS.colors.primary }}>{selectedCitizen.fullName}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: CITY_TOKENS.colors.textMuted, display: 'block', textTransform: 'uppercase' }}>Secteur</span>
                    <strong style={{ color: CITY_TOKENS.colors.accentBlue }}>{selectedCitizen.origin}</strong>
                  </div>
                </div>

                {/* Niveau de Recherche (Wanted Stars) */}
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: CITY_TOKENS.colors.textSecondary, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Avis de Recherche (Wanted Stars Fédéral)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[0, 1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => updateWantedLevel(star)}
                        style={{
                          flex: 1, padding: '10px',
                          background: selectedCitizen.wantedStars === star ? (star > 0 ? CITY_TOKENS.colors.danger : CITY_TOKENS.colors.success) : CITY_TOKENS.colors.bgInput,
                          color: selectedCitizen.wantedStars === star ? '#fff' : CITY_TOKENS.colors.textSecondary,
                          border: `1px solid ${selectedCitizen.wantedStars === star ? 'transparent' : CITY_TOKENS.colors.border}`,
                          borderRadius: '6px', fontWeight: 900, fontSize: '14px', cursor: 'pointer',
                        }}
                      >
                        {star > 0 ? `${star} ⭐` : "0 (Sain)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Historique Infractions */}
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: CITY_TOKENS.colors.textSecondary, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Antécédents & Remarques (C.P.I.C.)</span>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '13px', color: CITY_TOKENS.colors.textMain, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedCitizen.criminalHistory.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>

                <div style={{ marginTop: 'auto', background: CITY_TOKENS.colors.warningBg, color: CITY_TOKENS.colors.warning, padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Cumul des amendes impayées :</span>
                  <strong style={{ fontSize: '16px' }}>{selectedCitizen.activeFinesTotal} $</strong>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: CITY_TOKENS.colors.textMuted, fontSize: '14px' }}>
                Aucun dossier sélectionné. Lancez une recherche pour afficher une fiche.
              </div>
            )}
          </div>

        </div>
      )}

      {/* SECTION 2 : CONTRÔLE DES GRIlLES DE DÉTENTION */}
      {activeTab === 'cells' && (
        <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px', color: CITY_TOKENS.colors.primary }}>
                🔒 Verrouillage Tactique des Cellules de Détention
              </h3>
              <p style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary, margin: 0 }}>
                Pilotage électronique instantané des deux grilles de confinement en fil de fer du Commissariat Route 138.
              </p>
            </div>
            <span style={{ fontSize: '32px' }}>🔒</span>
          </div>

          <div style={{ background: CITY_TOKENS.colors.bgRoot, padding: '24px', borderRadius: CITY_TOKENS.borderRadius.md, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${CITY_TOKENS.colors.border}` }}>
            <div>
              <span style={{ fontSize: '12px', color: CITY_TOKENS.colors.textMuted, textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '4px' }}>Statut de Sécurité Courant</span>
              <strong style={{ fontSize: '22px', color: cellsLocked ? CITY_TOKENS.colors.danger : CITY_TOKENS.colors.success }}>
                {cellsLocked ? "🚨 CONFINEMENT MAXIMAL FERMÉ" : "🔓 GRILLES OUVERTES EN VISITE"}
              </strong>
            </div>

            <button
              onClick={() => {
                setCellsLocked(prev => !prev);
                showToast(cellsLocked ? "🔓 Mandat d'ouverture accordé. Grilles déverrouillées." : "🚨 Confinement d'urgence scellé sous haute sécurité.");
              }}
              style={{
                background: cellsLocked ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.danger,
                color: '#fff', border: 'none', padding: '16px 32px', borderRadius: CITY_TOKENS.borderRadius.md,
                fontWeight: 900, fontSize: '14px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: CITY_TOKENS.shadows.card,
              }}
            >
              {cellsLocked ? "🔑 Basculer en Mode Visite Libre" : "🚨 Basculer en Mode Confinement"}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3 : FOURRIÈRE MUNICIPALE TO TOW VEHICLES */}
      {activeTab === 'impound' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 6px', color: CITY_TOKENS.colors.primary }}>
                🚙 Fourrière Municipale et Véhicules Confisqués
              </h3>
              <p style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary, margin: 0 }}>
                La levée de mise en fourrière exige l'acquittement immédiat des frais de remorquage S.A.A.Q. au Trésor Public.
              </p>
            </div>
            <span style={{ fontSize: '32px' }}>🛻</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {impoundedVehicles.map(veh => (
              <div key={veh.id} className="card-municipal" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px', border: `2px solid ${CITY_TOKENS.colors.border}` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: CITY_TOKENS.colors.textMain }}>{veh.model}</span>
                    <span style={{ background: CITY_TOKENS.colors.textMain, color: '#fff', fontSize: '12px', fontWeight: 900, padding: '4px 10px', borderRadius: '4px' }}>{veh.plate}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.danger, fontWeight: 700, margin: '0 0 16px', background: CITY_TOKENS.colors.dangerBg, padding: '8px 12px', borderRadius: '6px' }}>
                    Motif de saisie : {veh.reason}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: CITY_TOKENS.colors.textSecondary }}>
                    <span>Frais de déblocage SAAQ :</span>
                    <strong style={{ fontSize: '18px', color: CITY_TOKENS.colors.primary }}>{veh.fine} $</strong>
                  </div>
                </div>

                <button
                  onClick={() => releaseImpound(veh.id, veh.fine)}
                  style={{
                    width: '100%', background: CITY_TOKENS.colors.primary, color: '#fff',
                    border: 'none', padding: '14px', borderRadius: CITY_TOKENS.borderRadius.sm,
                    fontWeight: 900, fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase', boxShadow: CITY_TOKENS.shadows.card,
                  }}
                >
                  Acquitter la Prime ({veh.fine} $) et Libérer
                </button>
              </div>
            ))}
            {impoundedVehicles.length === 0 && (
              <div className="card-municipal" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px 20px', color: CITY_TOKENS.colors.textMuted, fontSize: '14px' }}>
                ✓ Aucun véhicule actuellement consigné dans la fourrière municipale.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default PolicePanel;
