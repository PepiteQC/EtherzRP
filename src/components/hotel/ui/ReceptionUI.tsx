/**
 * ReceptionUI.tsx
 * Interface de réception — check-in, check-out, réservations
 */

import { useState, useCallback, memo } from 'react'
import { useReservationStore } from '../storage/reservationStore'
import { useRoomStore } from '../storage/roomStore'
import type { Reservation, RoomType } from '../storage/types'
import { ROOM_TYPE_LABELS, ROOM_PRICES } from '../storage/types'

type Tab = 'checkins' | 'checkouts' | 'available' | 'new'

interface ReceptionUIProps {
  isOpen:   boolean
  onClose:  () => void
}

export const ReceptionUI = memo(function ReceptionUI({
  isOpen,
  onClose,
}: ReceptionUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>('checkins')
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null)

  const todayCheckIns  = useReservationStore(s => s.getTodayCheckIns())
  const todayCheckOuts = useReservationStore(s => s.getTodayCheckOuts())
  const checkIn        = useReservationStore(s => s.checkIn)
  const checkOut       = useReservationStore(s => s.checkOut)
  const availableRooms = useRoomStore(s => s.getAvailable())

  if (!isOpen) return null

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'checkins',   label: '📥 Arrivées',  count: todayCheckIns.length },
    { id: 'checkouts',  label: '📤 Départs',   count: todayCheckOuts.length },
    { id: 'available',  label: '🛏️ Disponibles', count: availableRooms.length },
    { id: 'new',        label: '➕ Nouvelle Réservation' },
  ]

  return (
    <div style={{
      position:   'fixed',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)',
      border:     '1px solid rgba(200,168,75,0.3)',
      borderRadius: 14,
      padding:    0,
      width:      520,
      maxHeight:  600,
      overflow:   'hidden',
      color:      '#ffffff',
      fontFamily: 'monospace',
      zIndex:     500,
      boxShadow:  '0 25px 80px rgba(0,0,0,0.9)',
      display:    'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background:  'rgba(200,168,75,0.1)',
        borderBottom:'1px solid rgba(200,168,75,0.2)',
        padding:     '16px 20px',
        display:     'flex',
        justifyContent: 'space-between',
        alignItems:  'center',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#c8a84b' }}>
            🏨 RÉCEPTION — HÔTEL ETHERWORLD
          </div>
          <div style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>
            {new Date().toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background:   'transparent',
            border:       '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            color:        '#888888',
            cursor:       'pointer',
            padding:      '4px 10px',
            fontFamily:   'monospace',
            fontSize:     12,
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display:     'flex',
        borderBottom:'1px solid rgba(255,255,255,0.08)',
        background:  'rgba(0,0,0,0.3)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex:       1,
              background: activeTab === tab.id ? 'rgba(200,168,75,0.15)' : 'transparent',
              border:     'none',
              borderBottom: activeTab === tab.id ? '2px solid #c8a84b' : '2px solid transparent',
              color:      activeTab === tab.id ? '#c8a84b' : '#666666',
              padding:    '10px 6px',
              cursor:     'pointer',
              fontFamily: 'monospace',
              fontSize:   11,
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                marginLeft:   5,
                background:   activeTab === tab.id ? '#c8a84b' : '#444444',
                color:        activeTab === tab.id ? '#000' : '#888',
                borderRadius: 10,
                padding:      '1px 6px',
                fontSize:     10,
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {activeTab === 'checkins' && (
          <div>
            {todayCheckIns.length === 0 ? (
              <div style={{ color: '#555555', textAlign: 'center', padding: 30 }}>
                Aucune arrivée prévue aujourd'hui
              </div>
            ) : (
              todayCheckIns.map(res => (
                <div key={res.id} style={{
                  background:   'rgba(255,255,255,0.04)',
                  border:       '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding:      '12px 14px',
                  marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {res.guestInfo.firstName} {res.guestInfo.lastName}
                    </div>
                    <div style={{ color: '#c8a84b', fontSize: 12 }}>
                      #{res.confirmationNo}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#aaaaaa', marginBottom: 8 }}>
                    Chambre {res.roomId} — {ROOM_TYPE_LABELS[res.roomType]} — {res.nights} nuit{res.nights > 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#888888' }}>
                      Code: <span style={{ color: '#ffcc00', letterSpacing: 2 }}>{res.keyCardCode}</span>
                    </div>
                    <button
                      onClick={() => { checkIn(res.id) }}
                      style={{
                        background:   '#006600',
                        border:       'none',
                        borderRadius: 6,
                        color:        '#ffffff',
                        padding:      '6px 14px',
                        cursor:       'pointer',
                        fontFamily:   'monospace',
                        fontSize:     12,
                        fontWeight:   'bold',
                      }}
                    >
                      ✓ Check-In
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'checkouts' && (
          <div>
            {todayCheckOuts.length === 0 ? (
              <div style={{ color: '#555555', textAlign: 'center', padding: 30 }}>
                Aucun départ prévu aujourd'hui
              </div>
            ) : (
              todayCheckOuts.map(res => (
                <div key={res.id} style={{
                  background:   'rgba(255,255,255,0.04)',
                  border:       '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding:      '12px 14px',
                  marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {res.guestInfo.firstName} {res.guestInfo.lastName}
                    </div>
                    <div style={{ color: '#ff8888', fontSize: 12 }}>
                      Solde: ${res.balance.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#aaaaaa', marginBottom: 8 }}>
                    Chambre {res.roomId} — {res.roomServiceOrders.length} commandes room service
                  </div>
                  <button
                    onClick={() => { checkOut(res.id) }}
                    style={{
                      width:        '100%',
                      background:   '#004488',
                      border:       'none',
                      borderRadius: 6,
                      color:        '#ffffff',
                      padding:      '8px 0',
                      cursor:       'pointer',
                      fontFamily:   'monospace',
                      fontSize:     13,
                      fontWeight:   'bold',
                    }}
                  >
                    📤 Check-Out & Facturer ${res.total.toFixed(2)}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'available' && (
          <div>
            <div style={{ fontSize: 12, color: '#888888', marginBottom: 12 }}>
              {availableRooms.length} chambre{availableRooms.length > 1 ? 's' : ''} disponible{availableRooms.length > 1 ? 's' : ''}
            </div>
            {/* Grouper par type */}
            {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map(type => {
              const rooms = availableRooms.filter(r => r.type === type)
              if (rooms.length === 0) return null
              return (
                <div key={type} style={{ marginBottom: 12 }}>
                  <div style={{ color: '#c8a84b', fontSize: 12, marginBottom: 6 }}>
                    {ROOM_TYPE_LABELS[type]} — ${ROOM_PRICES[type]}/nuit
                    <span style={{ color: '#888888', marginLeft: 8 }}>
                      ({rooms.length} dispo)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {rooms.map(r => (
                      <span key={r.id} style={{
                        background:   'rgba(0,102,0,0.2)',
                        border:       '1px solid rgba(0,200,0,0.2)',
                        borderRadius: 4,
                        padding:      '2px 8px',
                        fontSize:     12,
                        color:        '#88dd88',
                      }}>
                        {r.number}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'new' && (
          <div style={{ color: '#888888', textAlign: 'center', padding: 20, fontSize: 13 }}>
            🔧 Interface de nouvelle réservation — En développement
            <br />
            <span style={{ fontSize: 11, color: '#555555' }}>
              Formulaire guest info + sélection chambre + dates
            </span>
          </div>
        )}
      </div>
    </div>
  )
})