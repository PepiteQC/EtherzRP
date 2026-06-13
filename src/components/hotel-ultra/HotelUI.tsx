/**
 * HotelUI.tsx
 * HUD et interfaces overlay de l'hôtel
 * - HUD: argent, étage, zone, heure
 * - Carte de l'hôtel
 * - Notifications
 * - Menu Services
 */

import {
  useState, useCallback, useEffect, useRef, memo,
} from 'react'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface HotelHUDProps {
  playerMoney:  number
  currentFloor: number
  currentZone:  string
  speed:        number
  notifications: Notification[]
  onDismiss:   (id: string) => void
}

interface Notification {
  id:      string
  message: string
  type:    'info' | 'success' | 'warning' | 'tip'
  expiry:  number
}

// ─────────────────────────────────────────────
// FLOOR INDICATOR
// ─────────────────────────────────────────────

const FloorIndicator = memo(function FloorIndicator({
  floor, zone,
}: {
  floor: number; zone: string
}) {
  const floorLabels: Record<number, string> = {
    '-1': 'Sous-sol — Stationnement',
     '0': 'Rez-de-chaussée — Lobby',
     '1': '1er — Lobby & Services',
     '2': '2e — Chambres Standard',
     '3': '3e — Chambres Supérieures',
     '4': '4e — Chambres King',
     '5': '5e — Suites Junior',
     '6': '6e — Suites',
     '7': '7e — Suites Deluxe',
     '8': '8e — Penthouse',
  }

  return (
    <div style={{
      position:   'absolute',
      top:        16,
      left:       '50%',
      transform:  'translateX(-50%)',
      background: 'rgba(0,0,0,0.75)',
      border:     '1px solid rgba(200,168,75,0.3)',
      borderRadius: 8,
      padding:    '6px 18px',
      color:      '#ffffff',
      fontFamily: 'monospace',
      fontSize:   13,
      textAlign:  'center',
      backdropFilter: 'blur(4px)',
      pointerEvents: 'none',
    }}>
      <span style={{ color: '#c8a84b', fontWeight: 'bold' }}>
        {floorLabels[floor] ?? `Étage ${floor}`}
      </span>
      {zone && (
        <span style={{ color: '#888888', marginLeft: 8, fontSize: 11 }}>
          · {zone}
        </span>
      )}
    </div>
  )
})

// ─────────────────────────────────────────────
// HOTEL MAP
// ─────────────────────────────────────────────

const HotelMap = memo(function HotelMap({
  currentFloor,
  isOpen,
  onClose,
}: {
  currentFloor: number
  isOpen:       boolean
  onClose:      () => void
}) {
  if (!isOpen) return null

  const floors = [8, 7, 6, 5, 4, 3, 2, 1, 0, -1]
  const floorData: Record<number, { label: string; color: string; rooms?: number }> = {
    8:  { label: 'Penthouse',           color: '#d4af37', rooms: 2 },
    7:  { label: 'Suites Deluxe',       color: '#c8a84b', rooms: 10 },
    6:  { label: 'Suites',              color: '#b89040', rooms: 10 },
    5:  { label: 'Suites Junior',       color: '#4a5a6a', rooms: 10 },
    4:  { label: 'Chambres King',       color: '#3a4a5a', rooms: 10 },
    3:  { label: 'Chambres Queen',      color: '#2a3a4a', rooms: 10 },
    2:  { label: 'Chambres Standard',   color: '#2a2a3a', rooms: 10 },
    1:  { label: 'Lobby & Services',    color: '#cc0000' },
    0:  { label: 'Restaurants & Piscine', color: '#226622' },
    '-1': { label: 'Stationnement',     color: '#2a2a2a' },
  }

  return (
    <div style={{
      position:   'fixed',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%, -50%)',
      background: 'rgba(8,8,14,0.97)',
      border:     '1px solid rgba(200,168,75,0.35)',
      borderRadius: 14,
      padding:    24,
      width:      380,
      color:      '#ffffff',
      fontFamily: 'monospace',
      zIndex:     700,
      boxShadow:  '0 30px 90px rgba(0,0,0,0.9)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#c8a84b' }}>
          🏨 PLAN DE L'HÔTEL
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#666666', cursor: 'pointer', fontFamily: 'monospace', fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      {floors.map(floor => {
        const data = floorData[floor]
        const isCurrent = floor === currentFloor
        return (
          <div key={floor} style={{
            display:      'flex',
            alignItems:   'center',
            padding:      '8px 12px',
            marginBottom: 4,
            background:   isCurrent ? 'rgba(200,168,75,0.15)' : 'rgba(255,255,255,0.03)',
            border:       isCurrent ? '1px solid rgba(200,168,75,0.4)' : '1px solid transparent',
            borderRadius: 6,
          }}>
            {/* Indicateur étage */}
            <div style={{
              width:        36,
              height:       36,
              background:   data.color,
              borderRadius: 6,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              marginRight:  12,
              fontSize:     11,
              fontWeight:   'bold',
              color:        '#ffffff',
              flexShrink:   0,
            }}>
              {floor < 0 ? 'B1' : floor === 0 ? 'RDC' : `${floor}`}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: isCurrent ? '#c8a84b' : '#cccccc' }}>
                {data.label}
              </div>
              {data.rooms && (
                <div style={{ fontSize: 10, color: '#666666' }}>
                  {data.rooms} chambres
                </div>
              )}
            </div>
            {isCurrent && (
              <div style={{ fontSize: 11, color: '#c8a84b', fontWeight: 'bold' }}>
                ← Vous êtes ici
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 14, fontSize: 11, color: '#555555', textAlign: 'center' }}>
        [M] Fermer la carte &nbsp;|&nbsp; [E] Utiliser l'ascenseur
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────
// NOTIFICATION SYSTEM
// ─────────────────────────────────────────────

const NotificationCenter = memo(function NotificationCenter({
  notifications,
  onDismiss,
}: {
  notifications: Notification[]
  onDismiss:    (id: string) => void
}) {
  const now = Date.now()
  const active = notifications.filter(n => n.expiry > now)

  return (
    <div style={{
      position:   'absolute',
      top:        60,
      right:      16,
      width:      280,
      pointerEvents: 'none',
      display:    'flex',
      flexDirection: 'column',
      gap:        6,
    }}>
      {active.map(notif => {
        const colors = {
          info:    { bg: 'rgba(34,68,136,0.9)', border: 'rgba(68,102,204,0.5)', icon: 'ℹ️' },
          success: { bg: 'rgba(0,80,0,0.9)',    border: 'rgba(0,180,0,0.5)',    icon: '✓'  },
          warning: { bg: 'rgba(100,60,0,0.9)',  border: 'rgba(204,136,0,0.5)', icon: '⚠️' },
          tip:     { bg: 'rgba(60,40,0,0.9)',   border: 'rgba(200,168,75,0.5)', icon: '💡' },
        }[notif.type]

        return (
          <div
            key={notif.id}
            style={{
              background:   colors.bg,
              border:       `1px solid ${colors.border}`,
              borderRadius: 8,
              padding:      '8px 12px',
              color:        '#ffffff',
              fontFamily:   'monospace',
              fontSize:     12,
              display:      'flex',
              alignItems:   'center',
              gap:          8,
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
            }}
          >
            <span>{colors.icon}</span>
            <span style={{ flex: 1 }}>{notif.message}</span>
            <button
              onClick={() => onDismiss(notif.id)}
              style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', fontSize: 11 }}
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
})

// ─────────────────────────────────────────────
// SERVICES MENU
// ─────────────────────────────────────────────

const ServicesMenu = memo(function ServicesMenu({
  isOpen,
  onClose,
  onSelectService,
}: {
  isOpen:          boolean
  onClose:         () => void
  onSelectService: (service: string) => void
}) {
  if (!isOpen) return null

  const services = [
    { id: 'room_service',  icon: '🍽️', label: 'Room Service',         desc: 'Commander repas & boissons' },
    { id: 'housekeeping',  icon: '🛏️', label: 'Entretien',             desc: 'Nettoyage & serviettes supplémentaires' },
    { id: 'concierge',     icon: '🎫', label: 'Concierge',             desc: 'Réservations & activités locales' },
    { id: 'spa',           icon: '♨️', label: 'Spa & Bien-être',       desc: 'Massages, soins, piscine' },
    { id: 'transport',     icon: '🚗', label: 'Transport',             desc: 'Navette aéroport, taxi' },
    { id: 'laundry',       icon: '👕', label: 'Blanchisserie',          desc: 'Nettoyage de vêtements' },
    { id: 'wake_up',       icon: '⏰', label: 'Réveil',                desc: 'Service de réveil personnalisé' },
    { id: 'late_checkout', icon: '🔑', label: 'Départ Tardif',         desc: 'Rester jusqu\'à 14h — 35$' },
  ]

  return (
    <div style={{
      position:   'fixed',
      top:        '50%',
      right:      20,
      transform:  'translateY(-50%)',
      background: 'rgba(8,8,14,0.96)',
      border:     '1px solid rgba(200,168,75,0.35)',
      borderRadius: 14,
      padding:    20,
      width:      280,
      color:      '#ffffff',
      fontFamily: 'monospace',
      zIndex:     600,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#c8a84b' }}>
          Services Hôteliers
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#666666', cursor: 'pointer', fontSize: 13 }}>
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {services.map(s => (
          <button
            key={s.id}
            onClick={() => { onSelectService(s.id); onClose() }}
            style={{
              background:    'rgba(255,255,255,0.04)',
              border:        '1px solid rgba(255,255,255,0.06)',
              borderRadius:  8,
              color:         '#ffffff',
              padding:       '10px 12px',
              cursor:        'pointer',
              fontFamily:    'monospace',
              display:       'flex',
              alignItems:    'center',
              gap:           10,
              textAlign:     'left',
              transition:    'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,168,75,0.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
          >
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 'bold' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: '#888888' }}>{s.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────
// HOTEL HUD ROOT
// ─────────────────────────────────────────────

export const HotelHUD = memo(function HotelHUD({
  playerMoney,
  currentFloor,
  currentZone,
  speed,
  notifications,
  onDismiss,
}: HotelHUDProps) {
  const [mapOpen,      setMapOpen]      = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === 'KeyM') setMapOpen(p => !p)
      if (e.code === 'KeyT') setServicesOpen(p => !p)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Argent */}
      <div style={{
        position:   'absolute',
        top:        16,
        left:       16,
        background: 'rgba(0,0,0,0.75)',
        border:     '1px solid rgba(200,168,75,0.3)',
        borderRadius: 8,
        padding:    '7px 14px',
        color:      '#00ff88',
        fontFamily: 'monospace',
        fontSize:   17,
        fontWeight: 'bold',
        letterSpacing: 1,
        backdropFilter: 'blur(4px)',
      }}>
        💵 ${playerMoney.toFixed(2)}
      </div>

      {/* Floor indicator */}
      <FloorIndicator floor={currentFloor} zone={currentZone} />

      {/* Notifications */}
      <NotificationCenter notifications={notifications} onDismiss={onDismiss} />

      {/* Boutons raccourcis */}
      <div style={{
        position:   'absolute',
        bottom:     16,
        right:      16,
        display:    'flex',
        flexDirection: 'column',
        gap:        6,
        pointerEvents: 'auto',
      }}>
        {[
          { label: '[M] Carte',     action: () => setMapOpen(p => !p)      },
          { label: '[T] Services',  action: () => setServicesOpen(p => !p) },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            background:   'rgba(0,0,0,0.75)',
            border:       '1px solid rgba(200,168,75,0.3)',
            borderRadius: 6,
            color:        '#c8a84b',
            padding:      '6px 14px',
            cursor:       'pointer',
            fontFamily:   'monospace',
            fontSize:     11,
            backdropFilter: 'blur(4px)',
          }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* Hint bas */}
      <div style={{
        position:   'absolute',
        bottom:     16,
        left:       '50%',
        transform:  'translateX(-50%)',
        color:      '#444444',
        fontFamily: 'monospace',
        fontSize:   11,
        pointerEvents: 'none',
      }}>
        [F] Sortir de l'hôtel &nbsp;·&nbsp; [E] Interagir &nbsp;·&nbsp; [M] Carte
      </div>

      {/* Map */}
      <HotelMap
        currentFloor={currentFloor}
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
      />

      {/* Services */}
      <ServicesMenu
        isOpen={servicesOpen}
        onClose={() => setServicesOpen(false)}
        onSelectService={(s) => console.log('Service:', s)}
      />
    </div>
  )
})

// ─────────────────────────────────────────────
// HOOK — Notifications manager
// ─────────────────────────────────────────────

export function useHotelNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const push = useCallback((message: string, type: Notification['type'] = 'info', duration = 4000) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
    const notif: Notification = { id, message, type, expiry: Date.now() + duration }
    setNotifications(prev => [...prev.slice(-4), notif])

    // Auto-remove
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, duration + 500)
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return { notifications, push, dismiss }
}