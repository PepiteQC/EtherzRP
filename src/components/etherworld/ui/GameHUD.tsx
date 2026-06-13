'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useWorldStore, type WorldLocation, INTERACTION_ZONES } from '../world-store'
import { CARD_COLORS, type CardAccessLevel } from '@/lib/etherworld/types'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES & CONFIGURATION MONDE
// ════════════════════════════════════════════════════════════════════════════

type NotificationKind = 'success' | 'error' | 'info' | 'warning'

interface WorldZone {
  id: WorldLocation
  label: string
  shortLabel: string
  icon: string
  accent: string
  description: string
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
  subZones?: Array<{ label: string; bounds: { minX: number; maxX: number; minZ: number; maxZ: number } }>
}

// Zones du monde — détectées automatiquement par position
const WORLD_ZONES: WorldZone[] = [
  {
    id: 'hotel-room',
    label: 'Votre Chambre',
    shortLabel: 'Chambre',
    icon: '🛏️',
    accent: '#22c55e',
    description: 'Espace privé et sécurisé',
    bounds: { minX: -6, maxX: 6, minZ: -8, maxZ: 5 },
    subZones: [
      { label: 'Salon', bounds: { minX: -6, maxX: 0, minZ: -4, maxZ: 2 } },
      { label: 'Chambre', bounds: { minX: 0, maxX: 6, minZ: -4, maxZ: 2 } },
      { label: 'Salle de bain', bounds: { minX: -6, maxX: -2, minZ: -8, maxZ: -4 } },
      { label: 'Cuisine', bounds: { minX: 2, maxX: 6, minZ: -8, maxZ: -4 } },
    ],
  },
  {
    id: 'hotel-corridor',
    label: 'Corridor de l\'Hôtel',
    shortLabel: 'Corridor',
    icon: '🚪',
    accent: '#8b5cf6',
    description: 'Couloir résidentiel',
    bounds: { minX: -4, maxX: 4, minZ: 5, maxZ: 28 },
  },
  {
    id: 'hotel-lobby',
    label: 'Lobby de l\'Hôtel',
    shortLabel: 'Lobby',
    icon: '🏨',
    accent: '#a855f7',
    description: 'Hall principal',
    bounds: { minX: -14, maxX: 14, minZ: 28, maxZ: 48 },
    subZones: [
      { label: 'Réception', bounds: { minX: -4, maxX: 4, minZ: 30, maxZ: 36 } },
      { label: 'Salon d\'attente', bounds: { minX: 4, maxX: 12, minZ: 34, maxZ: 42 } },
      { label: 'Ascenseurs', bounds: { minX: -12, maxX: -8, minZ: 34, maxZ: 40 } },
      { label: 'Entrée', bounds: { minX: -4, maxX: 4, minZ: 44, maxZ: 48 } },
    ],
  },
  {
    id: 'city',
    label: 'Ville de Québec',
    shortLabel: 'Ville',
    icon: '🏙️',
    accent: '#38bdf8',
    description: 'Zone urbaine principale',
    bounds: { minX: -100, maxX: 100, minZ: 48, maxZ: 200 },
    subZones: [
      { label: 'Rue Principale', bounds: { minX: -15, maxX: 15, minZ: 48, maxZ: 70 } },
      { label: 'Place Centrale', bounds: { minX: -20, maxX: 20, minZ: 70, maxZ: 90 } },
      { label: 'Quartier Commercial', bounds: { minX: 20, maxX: 60, minZ: 50, maxZ: 90 } },
      { label: 'Quartier Résidentiel', bounds: { minX: -60, maxX: -20, minZ: 50, maxZ: 90 } },
      { label: 'Parc', bounds: { minX: -30, maxX: 30, minZ: 90, maxZ: 130 } },
    ],
  },
  {
    id: 'depanneur',
    label: 'Dépanneur Couche-Tard',
    shortLabel: 'Dépanneur',
    icon: '🏪',
    accent: '#f97316',
    description: 'Commerce de proximité',
    bounds: { minX: 25, maxX: 42, minZ: 55, maxZ: 72 },
    subZones: [
      { label: 'Caisse', bounds: { minX: 28, maxX: 35, minZ: 62, maxZ: 68 } },
      { label: 'Rayons', bounds: { minX: 28, maxX: 40, minZ: 56, maxZ: 62 } },
      { label: 'Parking', bounds: { minX: 25, maxX: 42, minZ: 68, maxZ: 76 } },
    ],
  },
]

const ACCESS_LABELS: Record<CardAccessLevel, string> = {
  guest: 'Invité',
  resident: 'Résident',
  vip: 'VIP',
  admin: 'Admin',
}

const ACCESS_DESCRIPTIONS: Record<CardAccessLevel, string> = {
  guest: 'Zones publiques uniquement',
  resident: 'Accès résidentiel complet',
  vip: 'Accès premium et exclusif',
  admin: 'Accès total au serveur',
}

const WEATHER_STATES = ['☀️ Ensoleillé', '⛅ Nuageux', '🌧️ Pluie', '🌨️ Neige', '🌫️ Brouillard', '🌙 Nuit claire'] as const

// ════════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ════════════════════════════════════════════════════════════════════════════

function getDayPeriod(hours: number): { label: string; icon: string; color: string } {
  if (hours >= 5 && hours < 8) return { label: 'Aube', icon: '🌅', color: '#f59e0b' }
  if (hours >= 8 && hours < 12) return { label: 'Matin', icon: '☀️', color: '#fbbf24' }
  if (hours >= 12 && hours < 14) return { label: 'Midi', icon: '🌤️', color: '#f97316' }
  if (hours >= 14 && hours < 18) return { label: 'Après-midi', icon: '⛅', color: '#fb923c' }
  if (hours >= 18 && hours < 21) return { label: 'Soir', icon: '🌆', color: '#a855f7' }
  if (hours >= 21 && hours < 24) return { label: 'Nuit', icon: '🌙', color: '#6366f1' }
  return { label: 'Nuit profonde', icon: '🌑', color: '#4338ca' }
}

function detectZone(x: number, z: number): { zone: WorldZone | null; subZone: string | null } {
  for (const zone of WORLD_ZONES) {
    if (x >= zone.bounds.minX && x <= zone.bounds.maxX && z >= zone.bounds.minZ && z <= zone.bounds.maxZ) {
      let subZone: string | null = null
      if (zone.subZones) {
        for (const sub of zone.subZones) {
          if (x >= sub.bounds.minX && x <= sub.bounds.maxX && z >= sub.bounds.minZ && z <= sub.bounds.maxZ) {
            subZone = sub.label
            break
          }
        }
      }
      return { zone, subZone }
    }
  }
  return { zone: null, subZone: null }
}

function getCardinalDirection(yaw: number): string {
  const normalized = ((yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  const deg = (normalized * 180) / Math.PI
  if (deg >= 337.5 || deg < 22.5) return 'N'
  if (deg >= 22.5 && deg < 67.5) return 'NE'
  if (deg >= 67.5 && deg < 112.5) return 'E'
  if (deg >= 112.5 && deg < 157.5) return 'SE'
  if (deg >= 157.5 && deg < 202.5) return 'S'
  if (deg >= 202.5 && deg < 247.5) return 'SO'
  if (deg >= 247.5 && deg < 292.5) return 'O'
  return 'NO'
}

function resolveNotification(store: any): { message: string | null; type: NotificationKind } {
  const rawMessage =
    store?.notificationMessage ??
    store?.currentNotification ??
    store?.notification ??
    store?.toastMessage ??
    (typeof store?.showNotification === 'string' ? store.showNotification : null)
  const rawType = store?.notificationType ?? store?.currentNotificationType ?? store?.toastType ?? 'info'
  const type: NotificationKind = ['success', 'error', 'warning'].includes(rawType) ? rawType : 'info'
  return { message: typeof rawMessage === 'string' && rawMessage.trim().length > 0 ? rawMessage : null, type }
}

function formatDistance(meters: number): string {
  if (meters < 1) return '<1m'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK — PLAYER STATS RP
// ════════════════════════════════════════════════════════════════════════════

function usePlayerStats() {
  const [stats, setStats] = useState({
    health: 100,
    hunger: 85,
    thirst: 72,
    energy: 90,
    money: 2500,
  })

  // Decay naturel lent
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 0.15),
        thirst: Math.max(0, prev.thirst - 0.22),
        energy: Math.max(0, prev.energy - 0.08),
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return stats
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK — WEATHER RP
// ════════════════════════════════════════════════════════════════════════════

function useWeather() {
  const [weather, setWeather] = useState(WEATHER_STATES[0])
  const [temperature, setTemperature] = useState(-5)

  useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * WEATHER_STATES.length)
      setWeather(WEATHER_STATES[idx])
      setTemperature(Math.round(-15 + Math.random() * 30))
    }, 60000) // Change toutes les 60s
    return () => clearInterval(interval)
  }, [])

  return { weather, temperature }
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK — NEARBY POINTS OF INTEREST
// ════════════════════════════════════════════════════════════════════════════

function useNearbyPOI(playerPos: [number, number, number]) {
  return useMemo(() => {
    const pois: Array<{ label: string; icon: string; distance: number; direction: string }> = []

    const POI_LIST = [
      { label: 'Hôtel EtherWorld', icon: '🏨', pos: [0, 0, 38] },
      { label: 'Dépanneur', icon: '🏪', pos: [33, 0, 63] },
      { label: 'Parc Central', icon: '🌳', pos: [0, 0, 110] },
      { label: 'Place du Marché', icon: '🏛️', pos: [0, 0, 80] },
      { label: 'Station-Service', icon: '⛽', pos: [-40, 0, 65] },
      { label: 'Poste de Police', icon: '🚔', pos: [45, 0, 85] },
      { label: 'Hôpital', icon: '🏥', pos: [-50, 0, 95] },
    ]

    for (const poi of POI_LIST) {
      const dx = poi.pos[0] - playerPos[0]
      const dz = poi.pos[2] - playerPos[2]
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < 150) {
        const angle = Math.atan2(dx, dz)
        pois.push({
          label: poi.label,
          icon: poi.icon,
          distance: dist,
          direction: getCardinalDirection(angle),
        })
      }
    }

    return pois.sort((a, b) => a.distance - b.distance).slice(0, 5)
  }, [playerPos])
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN HUD
// ════════════════════════════════════════════════════════════════════════════

export function GameHUD() {
  const worldStore = useWorldStore()

  const { currentLocation, playerPosition, nearbyZone } = worldStore
  const roomConfig = useMemo(() => ({
    roomNumber: worldStore.playerRoomNumber,
    floor: worldStore.currentFloor,
    type: 'standard',
  }), [worldStore.playerRoomNumber, worldStore.currentFloor])
  const playerCard = useMemo(() => ({
    level: 'resident' as CardAccessLevel,
    name: 'Citoyen EtherWorld',
  }), [])
  const gameTime = useMemo(() => {
    const d = new Date()
    d.setHours(Math.floor(worldStore.timeOfDay), Math.round((worldStore.timeOfDay % 1) * 60), 0, 0)
    return d
  }, [worldStore.timeOfDay])
  const setGameTime = useCallback((date: Date) => {
    worldStore.setTimeOfDay(date.getHours() + date.getMinutes() / 60)
  }, [worldStore])

  const playerStats = usePlayerStats()
  const { weather, temperature } = useWeather()

  const [currentTime, setCurrentTime] = useState(gameTime)
  const [showControls, setShowControls] = useState(false)
  const [showNearby, setShowNearby] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)

  const nearbyPOI = useNearbyPOI(playerPosition)

  // Détection automatique de la zone
  const { zone: detectedZone, subZone } = useMemo(
    () => detectZone(playerPosition[0], playerPosition[2]),
    [playerPosition]
  )

  // Temps RP accéléré
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = new Date(prev)
        newTime.setMinutes(newTime.getMinutes() + 1)
        return newTime
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { setGameTime(currentTime) }, [currentTime, setGameTime])

  // Raccourcis clavier
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const el = document.activeElement
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.getAttribute('contenteditable') === 'true') return
      if (event.code === 'KeyH') { event.preventDefault(); setShowControls(v => !v) }
      if (event.code === 'KeyN') { event.preventDefault(); setShowNearby(v => !v) }
      if (event.code === 'KeyM') { event.preventDefault(); setShowMiniMap(v => !v) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const notification = useMemo(() => resolveNotification(null), [])
  const dayPeriod = getDayPeriod(currentTime.getHours())

  const formatTime = useCallback((date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }), [])
  const formatDate = useCallback((date: Date) => date.toLocaleDateString('fr-CA', { weekday: 'short', day: '2-digit', month: 'short' }), [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">

      {/* ════ TOP LEFT — Zone / Location ════ */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <ZoneIndicator
          zone={detectedZone}
          subZone={subZone}
          roomNumber={roomConfig.roomNumber}
          floor={roomConfig.floor}
          roomType={roomConfig.type}
          currentLocation={currentLocation}
          nearbyZone={nearbyZone}
        />
      </div>

      {/* ════ TOP CENTER — Logo / Monde ════ */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <Logo zone={detectedZone} />
      </div>

      {/* ════ TOP RIGHT — Temps / Météo / Carte ════ */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2.5 pointer-events-auto">
        <TimeWeatherDisplay
          time={formatTime(currentTime)}
          dateLabel={formatDate(currentTime)}
          period={dayPeriod}
          weather={weather}
          temperature={temperature}
        />

        {playerCard && (
          <KeyCardDisplay level={playerCard.level} name={playerCard.name} />
        )}
      </div>

      {/* ════ LEFT — Stats joueur ════ */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <PlayerStatsBar stats={playerStats} />
      </div>

      {/* ════ RIGHT — Boussole + Mini-map ════ */}
      {showMiniMap && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
          <MiniMapCompass
            playerPosition={playerPosition}
            nearbyPOI={nearbyPOI}
            zone={detectedZone}
          />
        </div>
      )}

      {/* ════ BOTTOM LEFT — Statut rapide ════ */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <StatusStrip
          zone={detectedZone}
          subZone={subZone}
          playerPosition={playerPosition}
          currentTime={formatTime(currentTime)}
          money={playerStats.money}
        />
      </div>

      {/* ════ BOTTOM CENTER — Zone d'interaction ════ */}
      {nearbyZone && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none">
          <InteractionPrompt zone={nearbyZone} />
        </div>
      )}

      {/* ════ BOTTOM RIGHT — Actions ════ */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex gap-2">
          <HudToggleButton
            label="N"
            tooltip="Points d'intérêt"
            active={showNearby}
            onClick={() => setShowNearby(v => !v)}
            accent="#f59e0b"
          />
          <HudToggleButton
            label="M"
            tooltip="Mini-carte"
            active={showMiniMap}
            onClick={() => setShowMiniMap(v => !v)}
            accent="#3b82f6"
          />
          <HudToggleButton
            label="H"
            tooltip="Aide"
            active={showControls}
            onClick={() => setShowControls(v => !v)}
            accent="#22d3ee"
          />
        </div>

        {showControls && <ControlsHint />}
      </div>

      {/* ════ NEARBY POI PANEL ════ */}
      {showNearby && (
        <div className="absolute bottom-16 left-4 pointer-events-auto">
          <NearbyPanel pois={nearbyPOI} onClose={() => setShowNearby(false)} />
        </div>
      )}

      {/* ════ CENTER — Notification ════ */}
      {notification.message && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Notification message={notification.message} type={notification.type} />
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ZONE INDICATOR
// ════════════════════════════════════════════════════════════════════════════

function ZoneIndicator({
  zone, subZone, roomNumber, floor, roomType, currentLocation, nearbyZone,
}: {
  zone: WorldZone | null
  subZone: string | null
  roomNumber: string
  floor: number
  roomType: string
  currentLocation: WorldLocation
  nearbyZone: any
}) {
  const accent = zone?.accent || '#64748b'
  const isRoom = zone?.id === 'hotel-room' || currentLocation === 'hotel-room'

  return (
    <div
      className="min-w-[240px] rounded-2xl overflow-hidden backdrop-blur-xl border shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${accent}12, rgba(10,10,18,0.92))`,
        borderColor: `${accent}30`,
      }}
    >
      {/* Zone header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: `${accent}15` }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
          >
            {zone?.icon || '📍'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
              {isRoom ? 'Chambre' : 'Zone Active'}
            </div>
            <div className="text-sm font-bold text-white truncate mt-0.5">
              {isRoom ? `Chambre ${roomNumber}` : zone?.label || 'Zone Inconnue'}
            </div>
          </div>
        </div>
      </div>

      {/* Zone body */}
      <div className="px-4 py-3">
        {isRoom ? (
          <div className="space-y-2">
            <div className="text-3xl font-black tracking-tight text-white">{roomNumber}</div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
                Étage {floor}
              </span>
              <span
                className="text-[10px] px-2 py-1 rounded-lg font-mono uppercase"
                style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}28` }}
              >
                {roomType}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {subZone && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-400">📌</span>
                <span className="text-xs font-semibold" style={{ color: accent }}>{subZone}</span>
              </div>
            )}
            <div className="text-[11px] text-zinc-500 leading-relaxed">
              {zone?.description || 'Explorez le monde d\'EtherWorld Québec.'}
            </div>
          </div>
        )}

        {/* Interaction hint */}
        {nearbyZone && (
          <div
            className="mt-3 flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg"
            style={{ background: `${accent}10`, border: `1px solid ${accent}20`, color: accent }}
          >
            <kbd className="px-1.5 py-0.5 rounded bg-black/30 text-[9px] font-bold">E</kbd>
            <span>{nearbyZone.label || 'Interagir'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TIME + WEATHER
// ════════════════════════════════════════════════════════════════════════════

function TimeWeatherDisplay({
  time, dateLabel, period, weather, temperature,
}: {
  time: string
  dateLabel: string
  period: { label: string; icon: string; color: string }
  weather: string
  temperature: number
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-950/85 backdrop-blur-xl border border-zinc-800 shadow-xl min-w-[200px]">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-black text-white tracking-[0.1em]">{time}</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{dateLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-lg">{period.icon}</div>
            <div className="text-[10px] font-semibold" style={{ color: period.color }}>{period.label}</div>
          </div>
        </div>

        {/* Barre de progression journée */}
        <div className="mt-2.5 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${(new Date().getHours() / 24) * 100}%`,
              background: `linear-gradient(90deg, #4338ca, ${period.color}, #f59e0b)`,
            }}
          />
        </div>

        {/* Météo */}
        <div className="mt-2.5 flex items-center justify-between text-[10px]">
          <span className="text-zinc-400">{weather}</span>
          <span className="font-mono font-bold text-zinc-300">{temperature > 0 ? '+' : ''}{temperature}°C</span>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// KEY CARD
// ════════════════════════════════════════════════════════════════════════════

function KeyCardDisplay({ level, name }: { level: CardAccessLevel; name: string }) {
  const color = CARD_COLORS[level]

  return (
    <div
      className="w-[220px] rounded-2xl overflow-hidden border shadow-xl backdrop-blur-xl"
      style={{
        background: `linear-gradient(135deg, ${color}15, rgba(10,10,20,0.92))`,
        borderColor: `${color}35`,
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-[0.18em]">Carte d'accès</div>
            <div className="text-sm font-bold mt-0.5" style={{ color }}>{ACCESS_LABELS[level]}</div>
          </div>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${color}12`, border: `1px solid ${color}28` }}
          >
            <span className="text-sm">🪪</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2.5">
          {/* Puce carte */}
          <div className="w-8 h-6 rounded bg-yellow-500/20 border border-yellow-500/25 relative overflow-hidden shrink-0">
            <div className="absolute inset-x-0.5 top-0.5 h-px bg-yellow-300/30" />
            <div className="absolute inset-x-0.5 bottom-0.5 h-px bg-yellow-300/30" />
            <div className="absolute inset-y-0.5 left-0.5 w-px bg-yellow-300/30" />
            <div className="absolute inset-y-0.5 right-0.5 w-px bg-yellow-300/30" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{name}</div>
            <div className="text-[10px] text-zinc-500">{ACCESS_DESCRIPTIONS[level]}</div>
          </div>
        </div>

        {/* Barre d'accès */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: level === 'guest' ? '25%' : level === 'resident' ? '55%' : level === 'vip' ? '82%' : '100%',
                background: `linear-gradient(90deg, ${color}, ${color}aa)`,
              }}
            />
          </div>
          <span className="text-[9px] font-mono text-zinc-500">{level.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PLAYER STATS BAR (vertical, left side)
// ════════════════════════════════════════════════════════════════════════════

function PlayerStatsBar({ stats }: { stats: { health: number; hunger: number; thirst: number; energy: number } }) {
  const bars = [
    { key: 'health', label: '❤️', value: stats.health, color: '#ef4444', warn: 25 },
    { key: 'hunger', label: '🍔', value: stats.hunger, color: '#f59e0b', warn: 20 },
    { key: 'thirst', label: '💧', value: stats.thirst, color: '#3b82f6', warn: 20 },
    { key: 'energy', label: '⚡', value: stats.energy, color: '#22c55e', warn: 15 },
  ]

  return (
    <div className="flex flex-col gap-2">
      {bars.map(bar => (
        <div
          key={bar.key}
          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 backdrop-blur-lg"
          style={{
            background: bar.value < bar.warn ? `${bar.color}18` : 'rgba(10,10,18,0.6)',
            border: `1px solid ${bar.value < bar.warn ? `${bar.color}40` : 'rgba(63,63,70,0.25)'}`,
          }}
        >
          <span className="text-xs">{bar.label}</span>
          <div className="w-16 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${bar.value}%`,
                background: bar.value < bar.warn
                  ? `${bar.color}`
                  : `linear-gradient(90deg, ${bar.color}cc, ${bar.color})`,
                boxShadow: bar.value < bar.warn ? `0 0 6px ${bar.color}50` : 'none',
              }}
            />
          </div>
          <span className="text-[9px] font-mono text-zinc-400 w-7 text-right">{Math.round(bar.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MINI MAP + COMPASS
// ════════════════════════════════════════════════════════════════════════════

function MiniMapCompass({
  playerPosition,
  nearbyPOI,
  zone,
}: {
  playerPosition: [number, number, number]
  nearbyPOI: Array<{ label: string; icon: string; distance: number; direction: string }>
  zone: WorldZone | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const accent = zone?.accent || '#64748b'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const radius = w / 2 - 8

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Background circle
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(10,10,18,0.85)'
    ctx.fill()
    ctx.strokeStyle = `${accent}40`
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy)
    ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius)
    ctx.stroke()

    // Range circles
    for (const r of [radius * 0.33, radius * 0.66]) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.stroke()
    }

    // Cardinal labels
    ctx.font = '9px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.textAlign = 'center'
    ctx.fillText('N', cx, cy - radius + 12)
    ctx.fillText('S', cx, cy + radius - 5)
    ctx.fillText('E', cx + radius - 8, cy + 3)
    ctx.fillText('O', cx - radius + 8, cy + 3)

    // Player dot
    ctx.beginPath()
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2)
    ctx.fillStyle = accent
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.strokeStyle = `${accent}40`
    ctx.lineWidth = 1
    ctx.stroke()

    // POIs
    const scale = radius / 80
    nearbyPOI.forEach((poi) => {
      // Approximate angle from direction
      const dirAngles: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SO: 225, O: 270, NO: 315 }
      const angle = ((dirAngles[poi.direction] || 0) - 90) * (Math.PI / 180)
      const dist = Math.min(poi.distance * scale, radius - 15)
      const px = cx + Math.cos(angle) * dist
      const py = cy + Math.sin(angle) * dist

      ctx.beginPath()
      ctx.arc(px, py, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fill()

      ctx.font = '7px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.textAlign = 'center'
      ctx.fillText(poi.icon, px, py - 6)
    })
  }, [playerPosition, nearbyPOI, accent])

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-full overflow-hidden shadow-xl"
        style={{ border: `2px solid ${accent}30` }}
      >
        <canvas ref={canvasRef} width={130} height={130} className="block" />
      </div>
      <div className="text-[9px] text-zinc-500 font-mono text-center">
        {Math.round(playerPosition[0])}, {Math.round(playerPosition[2])}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NEARBY POI PANEL
// ════════════════════════════════════════════════════════════════════════════

function NearbyPanel({ pois, onClose }: { pois: Array<{ label: string; icon: string; distance: number; direction: string }>; onClose: () => void }) {
  return (
    <div className="w-64 rounded-2xl overflow-hidden bg-zinc-950/92 backdrop-blur-xl border border-zinc-800 shadow-xl">
      <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">À proximité</div>
        <button onClick={onClose} className="text-zinc-600 hover:text-white text-xs">✕</button>
      </div>
      <div className="p-3 space-y-1.5">
        {pois.length === 0 ? (
          <div className="text-center py-4 text-[11px] text-zinc-600">Aucun point d'intérêt proche</div>
        ) : (
          pois.map((poi, i) => (
            <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
              <span className="text-base">{poi.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">{poi.label}</div>
                <div className="text-[10px] text-zinc-500">{formatDistance(poi.distance)} · {poi.direction}</div>
              </div>
              <span className="text-[9px] text-zinc-600 font-mono">{poi.direction}</span>
            </div>
          ))
        )}
      </div>
      <div className="px-4 py-2 border-t border-zinc-800/50 text-center">
        <span className="text-[9px] text-zinc-600 font-mono">N pour fermer</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// INTERACTION PROMPT
// ════════════════════════════════════════════════════════════════════════════

function InteractionPrompt({ zone }: { zone: any }) {
  return (
    <div className="rounded-2xl bg-zinc-950/80 backdrop-blur-xl border border-violet-500/30 shadow-xl px-5 py-3 flex items-center gap-3">
      <kbd className="px-2.5 py-1.5 bg-violet-500/15 border border-violet-500/30 rounded-lg text-violet-300 text-sm font-mono font-bold">
        E
      </kbd>
      <div>
        <div className="text-sm font-semibold text-white">{zone.label || 'Interagir'}</div>
        {zone.description && (
          <div className="text-[10px] text-zinc-400 mt-0.5">{zone.description}</div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS STRIP (bottom left)
// ════════════════════════════════════════════════════════════════════════════

function StatusStrip({
  zone, subZone, playerPosition, currentTime, money,
}: {
  zone: WorldZone | null
  subZone: string | null
  playerPosition: [number, number, number]
  currentTime: string
  money: number
}) {
  return (
    <div className="rounded-2xl bg-zinc-950/70 backdrop-blur-lg border border-zinc-800 px-4 py-2 shadow-lg">
      <div className="flex items-center gap-3 text-[10px] font-mono">
        <span className="flex items-center gap-1 text-zinc-300">
          <span>{zone?.icon || '📍'}</span>
          <span>{zone?.shortLabel || '???'}</span>
        </span>
        {subZone && (
          <>
            <span className="text-zinc-700">›</span>
            <span className="text-zinc-400">{subZone}</span>
          </>
        )}
        <span className="text-zinc-800">|</span>
        <span className="text-zinc-500">
          {Math.round(playerPosition[0])},{Math.round(playerPosition[2])}
        </span>
        <span className="text-zinc-800">|</span>
        <span className="text-zinc-400">{currentTime}</span>
        <span className="text-zinc-800">|</span>
        <span className="text-emerald-400 font-bold">${money.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HUD TOGGLE BUTTON
// ════════════════════════════════════════════════════════════════════════════

function HudToggleButton({
  label, tooltip, active, onClick, accent,
}: {
  label: string; tooltip: string; active: boolean; onClick: () => void; accent: string
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all backdrop-blur-lg border shadow-lg"
      style={{
        background: active ? `${accent}18` : 'rgba(10,10,18,0.7)',
        borderColor: active ? `${accent}40` : 'rgba(63,63,70,0.3)',
        color: active ? accent : 'rgba(255,255,255,0.4)',
      }}
    >
      <span className="text-[10px] font-mono font-bold">{label}</span>
    </button>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CONTROLS HINT
// ════════════════════════════════════════════════════════════════════════════

function ControlsHint() {
  const controls = [
    { key: 'WASD', label: 'Se déplacer', accent: '#ffffff' },
    { key: 'SHIFT', label: 'Courir', accent: '#f59e0b' },
    { key: 'SPACE', label: 'Sauter', accent: '#38bdf8' },
    { key: 'E', label: 'Interagir', accent: '#a855f7' },
    { key: 'RMB', label: 'Tourner caméra', accent: '#22c55e' },
    { key: 'SCROLL', label: 'Zoom', accent: '#64748b' },
    { key: 'I', label: 'Inventaire', accent: '#06b6d4' },
    { key: 'H', label: 'Aide', accent: '#22d3ee' },
    { key: 'N', label: 'Nearby', accent: '#f59e0b' },
    { key: 'M', label: 'Mini-carte', accent: '#3b82f6' },
  ]

  return (
    <div className="w-[230px] rounded-2xl overflow-hidden bg-zinc-950/88 backdrop-blur-xl border border-zinc-800 shadow-xl">
      <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/30">
        <div className="text-[10px] text-zinc-500 uppercase tracking-[0.18em]">Commandes</div>
      </div>
      <div className="p-2.5 grid grid-cols-2 gap-1.5">
        {controls.map(c => (
          <div key={c.key} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900/40">
            <kbd
              className="min-w-[36px] px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[9px] text-white font-mono text-center"
            >
              {c.key}
            </kbd>
            <span className="text-[9px] truncate" style={{ color: c.accent }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATION
// ════════════════════════════════════════════════════════════════════════════

function Notification({ message, type = 'info' }: { message: string; type?: NotificationKind }) {
  const cfg = {
    success: { bg: 'bg-green-500/15', border: 'border-green-500/40', text: 'text-green-300', bar: 'bg-green-400', icon: '✓' },
    error: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-300', bar: 'bg-red-400', icon: '✕' },
    warning: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-300', bar: 'bg-amber-400', icon: '⚠' },
    info: { bg: 'bg-zinc-900/90', border: 'border-zinc-700', text: 'text-white', bar: 'bg-cyan-400', icon: 'ℹ' },
  }[type]

  return (
    <div className={cn('min-w-[280px] max-w-[520px] px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl', cfg.bg, cfg.border)}>
      <div className="flex items-center gap-3">
        <span className={cn('text-lg', cfg.text)}>{cfg.icon}</span>
        <div className="flex-1">
          <div className={cn('font-semibold text-sm', cfg.text)}>{message}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">EtherWorld QC</div>
        </div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-black/20 overflow-hidden">
        <div className={cn('h-full rounded-full', cfg.bar)} style={{ width: '100%' }} />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LOGO
// ════════════════════════════════════════════════════════════════════════════

function Logo({ zone }: { zone: WorldZone | null }) {
  const accent = zone?.accent || '#8b5cf6'

  return (
    <div className="rounded-2xl bg-zinc-950/70 backdrop-blur-xl border border-zinc-800 shadow-xl px-4 py-2">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #4f46e5)',
            boxShadow: '0 0 16px rgba(139,92,246,0.2)',
          }}
        >
          <span className="text-white font-black text-sm">E</span>
        </div>
        <div>
          <div className="text-sm font-black text-white tracking-tight leading-none">ETHERWORLD</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.22em]">Québec RP</span>
            <span className="w-1 h-1 rounded-full" style={{ background: accent }} />
            <span className="text-[10px] font-semibold" style={{ color: accent }}>
              {zone?.shortLabel || 'Monde'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}