// src/components/hotel/ui/AdminHotelPanel.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { HOTEL } from '../constants/dimensions';
import { generateAllRoomIds, roomDisplayNumber } from '../constants/ids';

const font = "'JetBrains Mono','Courier New',monospace";

interface RoomStatus {
  roomId: string;
  displayNumber: string;
  floor: number;
  status: string;
  ownerUid: string | null;
  currentOccupantUid: string | null;
  lightOn: boolean;
  doNotDisturb: boolean;
  cleaningRequested: boolean;
  thermostatTemp: number;
}

interface LockStatus {
  lockId: string;
  roomId: string;
  locked: boolean;
  deadboltEngaged: boolean;
  batteryLevel: number;
}

export const AdminHotelPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [locks, setLocks] = useState<LockStatus[]>([]);
  const [tab, setTab] = useState<'rooms' | 'locks' | 'logs' | 'seed'>('rooms');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/admin/rooms');
      if (res.ok) setRooms(await res.json());
    } catch { /* */ }
  }, []);

  const fetchLocks = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/admin/locks');
      if (res.ok) setLocks(await res.json());
    } catch { /* */ }
  }, []);

  const seedHotel = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/hotel/admin/seed', { method: 'POST' });
      const data = await res.json();
      setMessage(data.success ? `✓ ${data.message}` : `✕ ${data.error}`);
    } catch (err) {
      setMessage('✕ Erreur de seed');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchLocks();
  }, [fetchRooms, fetchLocks]);

  const lowBatteryLocks = locks.filter((l) => l.batteryLevel < 20);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontFamily: font,
    }}>
      <div style={{
        background: '#0a0e1a', border: '1px solid rgba(125,211,252,0.2)',
        borderRadius: 16, width: '90vw', maxWidth: 900, maxHeight: '85vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid rgba(125,211,252,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#7dd3fc', fontSize: 10, letterSpacing: 3 }}>ADMINISTRATION</div>
            <div style={{ color: '#c9a84c', fontSize: 18, fontWeight: 700 }}>GESTION HÔTEL</div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#475569',
            cursor: 'pointer', fontSize: 20, fontFamily: font,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid rgba(125,211,252,0.1)',
        }}>
          {(['rooms', 'locks', 'logs', 'seed'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 16px',
                background: tab === t ? 'rgba(125,211,252,0.08)' : 'transparent',
                border: 'none',
                borderBottom: tab === t ? '2px solid #7dd3fc' : '2px solid transparent',
                color: tab === t ? '#7dd3fc' : '#475569',
                cursor: 'pointer', fontSize: 10, letterSpacing: 2,
                fontFamily: font, fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              {t === 'rooms' ? '🏠 CHAMBRES' :
               t === 'locks' ? '🔒 SERRURES' :
               t === 'logs' ? '📋 LOGS' : '🌱 SEED'}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {lowBatteryLocks.length > 0 && (
          <div style={{
            margin: '12px 24px 0', padding: '8px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, color: '#ef4444', fontSize: 10,
          }}>
            ⚠ {lowBatteryLocks.length} serrure(s) avec batterie faible :
            {lowBatteryLocks.map((l) => ` ${l.roomId} (${l.batteryLevel}%)`).join(',')}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {tab === 'rooms' && (
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 4, marginBottom: 16,
                color: '#334155', fontSize: 8, letterSpacing: 2,
                textTransform: 'uppercase',
              }}>
                <div>CHAMBRE</div>
                <div>STATUT</div>
                <div>OCCUPANT</div>
                <div>LUMIÈRE</div>
                <div>TEMP</div>
              </div>
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  style={{
                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 4, padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    fontSize: 10,
                  }}
                >
                  <div style={{ color: '#7dd3fc', fontWeight: 700 }}>
                    {room.displayNumber}
                    {room.doNotDisturb && ' 🔕'}
                    {room.cleaningRequested && ' 🧹'}
                  </div>
                  <div style={{
                    color:
                      room.status === 'vacant' ? '#22c55e' :
                      room.status === 'occupied' ? '#f59e0b' :
                      room.status === 'maintenance' ? '#ef4444' : '#7dd3fc',
                  }}>
                    {room.status.toUpperCase()}
                  </div>
                  <div style={{ color: '#475569' }}>
                    {room.currentOccupantUid ? room.currentOccupantUid.slice(0, 8) + '...' : '—'}
                  </div>
                  <div style={{ color: room.lightOn ? '#ffd580' : '#334155' }}>
                    {room.lightOn ? '● ON' : '○ OFF'}
                  </div>
                  <div style={{ color: '#475569' }}>{room.thermostatTemp}°C</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'locks' && (
            <div>
              {locks.map((lock) => (
                <div
                  key={lock.lockId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <div style={{ color: '#7dd3fc', fontSize: 11, fontWeight: 700, width: 120 }}>
                    {lock.roomId.replace('hotel_', '').replace(/_/g, ' ')}
                  </div>
                  <div style={{
                    color: lock.locked ? '#ef4444' : '#22c55e',
                    fontSize: 10, width: 80,
                  }}>
                    {lock.locked ? '🔒 LOCKED' : '🔓 OPEN'}
                  </div>
                  <div style={{
                    color: lock.deadboltEngaged ? '#f59e0b' : '#334155',
                    fontSize: 10, width: 80,
                  }}>
                    {lock.deadboltEngaged ? '⚡ BOLT' : '— —'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${lock.batteryLevel}%`,
                        background: lock.batteryLevel > 20
                          ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                          : 'linear-gradient(90deg,#ef4444,#f87171)',
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                  <div style={{ color: '#475569', fontSize: 9, width: 35 }}>
                    {lock.batteryLevel}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'logs' && (
            <div style={{ color: '#475569', fontSize: 11, textAlign: 'center', padding: 40 }}>
              Chargement des logs depuis hotel_access_logs...
              <br /><br />
              <span style={{ fontSize: 9, color: '#334155' }}>
                Filtres disponibles : action, chambre, utilisateur, date
              </span>
            </div>
          )}

          {tab === 'seed' && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ color: '#7dd3fc', fontSize: 12, marginBottom: 16 }}>
                Initialiser les 30 chambres, serrures et coffres-forts
              </div>
              <button
                onClick={seedHotel}
                disabled={loading}
                style={{
                  background: 'rgba(125,211,252,0.1)',
                  border: '1px solid rgba(125,211,252,0.3)',
                  borderRadius: 8, padding: '12px 24px',
                  color: '#7dd3fc', cursor: loading ? 'wait' : 'pointer',
                  fontSize: 12, fontFamily: font, fontWeight: 700,
                }}
              >
                {loading ? '⏳ EN COURS...' : '🌱 SEED HÔTEL'}
              </button>
              {message && (
                <div style={{
                  marginTop: 16, padding: '10px 16px',
                  background: message.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${message.startsWith('✓') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: 6,
                  color: message.startsWith('✓') ? '#22c55e' : '#ef4444',
                  fontSize: 11,
                }}>
                  {message}
                </div>
              )}
              <div style={{ marginTop: 24, color: '#334155', fontSize: 9, lineHeight: 1.8 }}>
                Cette opération :<br />
                • Crée 30 documents hotel_rooms<br />
                • Crée 30 documents hotel_locks<br />
                • Crée 30 documents hotel_safes<br />
                • Ne touche pas aux données existantes<br />
                • Peut être exécutée plusieurs fois sans risque
              </div>
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div style={{
          padding: '10px 24px', borderTop: '1px solid rgba(125,211,252,0.1)',
          display: 'flex', gap: 24, color: '#334155', fontSize: 8, letterSpacing: 2,
        }}>
          <span>CHAMBRES: {rooms.length}/30</span>
          <span>OCCUPÉES: {rooms.filter((r) => r.status === 'occupied').length}</span>
          <span>VACANTES: {rooms.filter((r) => r.status === 'vacant').length}</span>
          <span>NETTOYAGE: {rooms.filter((r) => r.cleaningRequested).length}</span>
          <span>BATTERIES FAIBLES: {lowBatteryLocks.length}</span>
        </div>
      </div>
    </div>
  );
};