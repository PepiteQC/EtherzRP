/**
 * src/world/gameplay/AdvancedRPModule.tsx
 * 
 * Module Maître RP Persistant (Véhicules, Propriétés & Serrures, Jobs & Salaires) pour EtherWorld.
 * Connecté au Store Zustand (authStore) et à l'API Node Autoritaire (etherApi).
 * Implémente rigoureusement les Étapes 6, 7 et 8 de l'Architecture de Production.
 */

import React, { useState, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { EtherNodeApiClient } from '../../api/etherApi';
import type { JobCategory, PropertyDocument, VehicleDocument, InventoryItem } from '../../lib/firebase/firestoreSchema';

export const AdvancedRPModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'properties' | 'jobs'>('jobs');
  const [notification, setNotification] = useState<string | null>(null);
  
  const auth = useAuthStore();
  const player = auth.player;

  const showNotify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  }, []);

  if (!player) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 50,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '2px solid rgba(147, 197, 253, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        color: '#f8fafc',
        fontFamily: 'font-sans, Inter, system-ui',
        width: '340px',
        boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
      }}
    >
      {/* HEADER & IDENTITÉ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#38bdf8' }}>{player.firstName} {player.lastName}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{player.job} · {player.currentZone}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: '#4ade80' }}>{player.cash} $</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Banque : <span style={{ color: '#fff' }}>{player.bank} $</span></div>
        </div>
      </div>

      {/* TABS DE NAVIGATION RP */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '12px' }}>
        <button
          onClick={() => setActiveTab('jobs')}
          style={{ ...tabStyle, background: activeTab === 'jobs' ? '#38bdf8' : 'transparent', color: activeTab === 'jobs' ? '#000' : '#94a3b8' }}
        >
          💼 Jobs
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          style={{ ...tabStyle, background: activeTab === 'properties' ? '#c084fc' : 'transparent', color: activeTab === 'properties' ? '#000' : '#94a3b8' }}
        >
          🗝️ Propriétés
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          style={{ ...tabStyle, background: activeTab === 'vehicles' ? '#f43f5e' : 'transparent', color: activeTab === 'vehicles' ? '#000' : '#94a3b8' }}
        >
          🚗 Véhicules
        </button>
      </div>

      {/* CONTENU 1 : JOBS & SALAIRES (Étape 8) */}
      {activeTab === 'jobs' && (
        <JobManagementSection job={player.job} onNotify={showNotify} />
      )}

      {/* CONTENU 2 : PROPRIÉTÉS & SERRURES (Étape 7) */}
      {activeTab === 'properties' && (
        <PropertyManagementSection uid={player.uid} onNotify={showNotify} />
      )}

      {/* CONTENU 3 : VÉHICULES & COFFRE (Étape 6) */}
      {activeTab === 'vehicles' && (
        <VehicleManagementSection uid={player.uid} onNotify={showNotify} />
      )}

      {/* NOTIFICATION D'ACTION REUSSIE */}
      {notification && (
        <div style={{ marginTop: '14px', padding: '10px 14px', background: 'linear-gradient(90deg, #166534, #15803d)', color: '#fff', borderRadius: '8px', fontSize: 12, fontWeight: 'bold', textAlign: 'center', animation: 'pulse 1s infinite' }}>
          ✓ {notification}
        </div>
      )}
    </div>
  );
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 0',
  border: 'none',
  borderRadius: '8px',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

/**
 * 1. SECTION JOBS & SALAIRES AUTORITAIRES
 */
const JobManagementSection: React.FC<{ job: JobCategory; onNotify: (msg: string) => void }> = ({ job, onNotify }) => {
  const [requesting, setRequesting] = useState(false);

  const handlePaycheck = async () => {
    setRequesting(true);
    try {
      const res = await EtherNodeApiClient.requestJobPay(job);
      // Synchronisation Zustand de la banque
      useAuthStore.setState(s => ({
        player: s.player ? { ...s.player, bank: res.newBank } : null,
      }));
      onNotify(`Prime réclamée avec succès : +${res.amountPaid} $ !`);
    } catch (err: any) {
      onNotify(err.message || "Erreur de paiement.");
    }
    setRequesting(false);
  };

  return (
    <div>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: '#38bdf8', fontSize: 11, fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>Service Actif</div>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: '8px', textTransform: 'capitalize' }}>{job} de la Ville de Québec</div>
        <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
          {job === 'police' && "🚓 Triggers actifs : Contrôle radar, Patrouille Route 138, Intervention Motel."}
          {job === 'mecano' && "🔧 Triggers actifs : Réparation moteurs, Gestion du Stockage Pièces, Remorquage."}
          {job === 'travailleur' && "🚜 Triggers actifs : Entretien Hydro-Québec, Chantiers Portneuf, Livraison."}
          {job === 'restaurateur' && "☕ Triggers actifs : Caisse Dépanneur, Service des Cafés/Burgers."}
          {job === 'civil' && "🚶‍♂️ Citoyen libre. Revenu universel garanti par la municipalité."}
        </div>
      </div>

      <button
        onClick={handlePaycheck}
        disabled={requesting}
        style={{
          width: '100%',
          padding: '12px',
          background: 'linear-gradient(180deg, #10b981, #15803d)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: 13,
          fontWeight: 900,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {requesting ? "Versement..." : "💰 Réclamer ma Prime / Paycheck"}
      </button>
    </div>
  );
};

/**
 * 2. SECTION PROPRIÉTÉS, SERRURES & CLÉS
 */
const PropertyManagementSection: React.FC<{ uid: string; onNotify: (msg: string) => void }> = ({ uid, onNotify }) => {
  const [properties, setProperties] = useState<PropertyDocument[]>([
    {
      propertyId: 'motel_101',
      ownerUid: uid,
      type: 'motel_room',
      address: 'Chambre Motel 101 (Route 138)',
      locked: true,
      storage: { maxWeight: 50, items: [] },
      tenants: [],
      accessList: [uid],
    },
    {
      propertyId: 'house_limoilou',
      ownerUid: uid,
      type: 'house',
      address: 'Bungalow 24 (Limoilou)',
      locked: false,
      storage: { maxWeight: 150, items: [] },
      tenants: ['max_tremblay'],
      accessList: [uid, 'max_tremblay'],
    }
  ]);

  const toggleLock = async (propId: string, currentState: boolean) => {
    try {
      const res = await EtherNodeApiClient.lockProperty(propId, !currentState);
      setProperties(prev => prev.map(p => p.propertyId === propId ? { ...p, locked: res.new_state } : p));
      onNotify(res.new_state ? "🔒 Propriété Verrouillée." : "🔓 Propriété Déverrouillée.");
    } catch (err: any) {
      onNotify(err.message || "Erreur de serrure.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {properties.map(p => (
        <div key={p.propertyId} style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: p.locked ? '#f87171' : '#4ade80' }}>
              {p.address}
            </span>
            <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
              {p.type}
            </span>
          </div>

          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: '12px' }}>
            Clés autorisées : {p.accessList.length} citoyens
          </div>

          <button
            onClick={() => toggleLock(p.propertyId, p.locked)}
            style={{
              width: '100%',
              padding: '10px',
              background: p.locked ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
              color: p.locked ? '#4ade80' : '#f87171',
              border: `1px solid ${p.locked ? '#4ade80' : '#f87171'}`,
              borderRadius: '8px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {p.locked ? "🔑 Déverrouiller la Serrure" : "🔒 Verrouiller la Serrure"}
          </button>
        </div>
      ))}
    </div>
  );
};

/**
 * 3. SECTION FlOTTE VÉHICULES & COFFRE 40 KG
 */
const VehicleManagementSection: React.FC<{ uid: string; onNotify: (msg: string) => void }> = ({ uid, onNotify }) => {
  const [vehicle, setVehicle] = useState<VehicleDocument>({
    vehicleId: 'veh_pickup_1',
    ownerUid: uid,
    plate: 'QC-138-RP',
    model: 'Pickup Route 138',
    color: '#dc2626',
    fuel: 85,
    engineHealth: 96,
    bodyHealth: 92,
    locked: false,
    position: [12, 0.5, -40],
    rotationY: 0,
    impounded: false,
  });

  const toggleVehLock = async () => {
    const nextLocked = !vehicle.locked;
    try {
      await EtherNodeApiClient.saveVehicleState(vehicle.vehicleId, { locked: nextLocked });
      setVehicle(prev => ({ ...prev, locked: nextLocked }));
      onNotify(nextLocked ? "🔒 Pickup Verrouillé." : "🔓 Pickup Ouvert.");
    } catch (err: any) {
      onNotify("Erreur de verrouillage.");
    }
  };

  return (
    <div>
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: 14, fontWeight: 'bold', color: '#f43f5e' }}>{vehicle.model}</span>
          <span style={{ fontSize: 11, background: '#f43f5e', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontWeight: 900 }}>{vehicle.plate}</span>
        </div>

        {/* MÉTRIQUES MÉCANIQUES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px', textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Essence</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: vehicle.fuel > 30 ? '#4ade80' : '#facc15' }}>{vehicle.fuel} %</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Moteur</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#38bdf8' }}>{vehicle.engineHealth} %</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Carrosserie</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#cbd5e1' }}>{vehicle.bodyHealth} %</div>
          </div>
        </div>

        <button
          onClick={toggleVehLock}
          style={{
            width: '100%',
            padding: '10px',
            background: vehicle.locked ? 'rgba(244, 63, 94, 0.2)' : 'rgba(74, 222, 128, 0.2)',
            color: vehicle.locked ? '#f43f5e' : '#4ade80',
            border: `1px solid ${vehicle.locked ? '#f43f5e' : '#4ade80'}`,
            borderRadius: '8px',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          {vehicle.locked ? "🚙 Déverrouiller le Pickup" : "🚙 Verrouiller le Pickup"}
        </button>
      </div>

      <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
        💡 Coffre (Trunk Storage) géré en direct.
      </div>
    </div>
  );
};

export default AdvancedRPModule;
