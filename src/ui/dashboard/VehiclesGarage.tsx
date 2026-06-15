/**
 * src/ui/dashboard/VehiclesGarage.tsx
 * 
 * Registre Automobile Officiel et Flotte Motorisée.
 * Permet l'inspection S.A.A.Q., le verrouillage à distance et la demande d'immatriculation.
 */

import React, { useState } from 'react';
import CITY_TOKENS from '../theme/cityTokens';
import { useAuthStore } from '../../store/authStore';
import { EtherNodeApiClient } from '../../api/etherApi';
import type { VehicleDocument } from '../../lib/firebase/firestoreSchema';

export const VehiclesGarage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [notify, setNotify]   = useState<string | null>(null);

  const auth   = useAuthStore();
  const player = auth.player;

  const [fleet, setFleet] = useState<VehicleDocument[]>([
    {
      vehicleId: 'veh_pickup_1',
      ownerUid: player?.uid || 'citoyen',
      plate: 'QC-138-RP',
      model: 'Pickup Route 138',
      color: '#dc2626',
      fuel: 88,
      engineHealth: 95,
      bodyHealth: 90,
      locked: false,
      position: [10, 0.5, -50],
      rotationY: 0,
      impounded: false,
    },
    {
      vehicleId: 'veh_sedan_1',
      ownerUid: player?.uid || 'citoyen',
      plate: 'QC-892-SAA',
      model: 'Berline Citadine (Sedan)',
      color: '#0284c7',
      fuel: 100,
      engineHealth: 100,
      bodyHealth: 100,
      locked: true,
      position: [0, 0.5, 20],
      rotationY: 0,
      impounded: false,
    }
  ]);

  const handleSpawnRequest = async (modelName: string) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await EtherNodeApiClient.spawnVehicle(modelName, [0, 0.5, 10]);
      setFleet(prev => [res.vehicle, ...prev]);
      setNotify(`✓ Véhicule instancié avec la plaque : ${res.vehicle.plate} !`);
      setTimeout(() => setNotify(null), 3500);
    } catch (err: any) {
      setNotify(`⚠️ Erreur: ${err.message || "Échec d'immatriculation."}`);
    }
    setLoading(false);
  };

  const toggleDoorLock = async (vehId: string, currentLock: boolean) => {
    try {
      await EtherNodeApiClient.saveVehicleState(vehId, { locked: !currentLock });
      setFleet(fleet.map(v => v.vehicleId === vehId ? { ...v, locked: !currentLock } : v));
    } catch (err) {
      setNotify("Erreur de transmission clé.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. DEMANDE DE NOUVEAU VÉHICULE */}
      <div className="card-municipal" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: CITY_TOKENS.colors.primary }}>
          🏛️ Comptoir d'Instanciation Automobile
        </h3>
        <p style={{ fontSize: '13px', color: CITY_TOKENS.colors.textSecondary, margin: 0 }}>
          Sélectionnez un modèle certifié ci-dessous pour exiger son instanciation immédiate sur la voie publique.
        </p>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => handleSpawnRequest("Pickup Route 138")}
            disabled={loading}
            style={{ ...spawnBtnStyle, background: CITY_TOKENS.colors.primary, color: CITY_TOKENS.colors.textLight }}
          >
            🛻 Obtenir Pickup Route 138
          </button>
          <button
            onClick={() => handleSpawnRequest("Berline de Québec")}
            disabled={loading}
            style={{ ...spawnBtnStyle, background: CITY_TOKENS.colors.accentBlue, color: CITY_TOKENS.colors.textLight }}
          >
            🚗 Obtenir Berline Citadine
          </button>
          <button
            onClick={() => handleSpawnRequest("Croiseur de Police Sûreté")}
            disabled={loading}
            style={{ ...spawnBtnStyle, background: CITY_TOKENS.colors.textMain, color: CITY_TOKENS.colors.textLight }}
          >
            🚓 Obtenir Croiseur Police
          </button>
        </div>
      </div>

      {notify && (
        <div style={{ background: CITY_TOKENS.colors.successBg, color: CITY_TOKENS.colors.success, padding: '12px', borderRadius: CITY_TOKENS.borderRadius.md, fontWeight: 800, fontSize: '13px', textAlign: 'center' }}>
          {notify}
        </div>
      )}

      {/* 2. REGISTRE DES VÉHICULES POSSÉDÉS */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: CITY_TOKENS.colors.textMain, margin: '0 0 16px' }}>
          📋 Flotte Motorisée Possédée (S.A.A.Q.)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {fleet.map(veh => (
            <div
              key={veh.vehicleId}
              className="card-municipal"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: CITY_TOKENS.colors.primary }}>
                    {veh.model.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 900, background: CITY_TOKENS.colors.textMain, color: CITY_TOKENS.colors.textLight, padding: '4px 12px', borderRadius: CITY_TOKENS.borderRadius.sm }}>
                    {veh.plate}
                  </span>
                </div>

                {/* Statut Mécanique SAAQ */}
                <div style={{ background: CITY_TOKENS.colors.bgRoot, padding: '14px', borderRadius: CITY_TOKENS.borderRadius.md, display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: CITY_TOKENS.colors.textMuted, display: 'block' }}>Carburant</span>
                    <strong style={{ fontSize: '14px', color: veh.fuel > 30 ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.warning }}>{veh.fuel} %</strong>
                  </div>
                  <div>
                    <span style={{ color: CITY_TOKENS.colors.textMuted, display: 'block' }}>Santé Moteur</span>
                    <strong style={{ fontSize: '14px', color: CITY_TOKENS.colors.accentBlue }}>{veh.engineHealth} %</strong>
                  </div>
                  <div>
                    <span style={{ color: CITY_TOKENS.colors.textMuted, display: 'block' }}>Carrosserie</span>
                    <strong style={{ fontSize: '14px', color: CITY_TOKENS.colors.textSecondary }}>{veh.bodyHealth} %</strong>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: CITY_TOKENS.colors.textSecondary }}>
                  📍 Localisation actuelle : <strong style={{ color: CITY_TOKENS.colors.textMain }}>X: {veh.position[0]} · Z: {veh.position[2]}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => toggleDoorLock(veh.vehicleId, veh.locked)}
                  style={{
                    flex: 1,
                    background: veh.locked ? CITY_TOKENS.colors.successBg : CITY_TOKENS.colors.dangerBg,
                    color: veh.locked ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.danger,
                    fontWeight: 800,
                    fontSize: '12px',
                    padding: '12px',
                    border: `1px solid ${veh.locked ? CITY_TOKENS.colors.success : CITY_TOKENS.colors.danger}`,
                    borderRadius: CITY_TOKENS.borderRadius.sm,
                    cursor: 'pointer',
                  }}
                >
                  {veh.locked ? "🔒 Verrouillé (Cliquer pour Ouvrir)" : "🔓 Ouvert (Cliquer pour Verrouiller)"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const spawnBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  border: 'none',
  borderRadius: CITY_TOKENS.borderRadius.md,
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.1s ease',
  boxShadow: CITY_TOKENS.shadows.card,
};

export default VehiclesGarage;
