import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Car, Users, ThermometerSun, Zap, Shield, Target, 
  Clock, MapPin, Heart, Wind, Eye, Volume2, VolumeX,
  Crosshair, AlertTriangle, ChevronUp, Gauge,
  Compass, Navigation, Radio, Battery, Wifi,
  Moon, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog
} from 'lucide-react'

// ============================================================
//  ETHERWORLD HUD v3.0 — Production Grade
//  Features: Live Stats, Minimap Ready, Notifications,
//  Dynamic Indicators, Damage Flash, Connected to Player
// ============================================================

// ——— Types ———
type GameMode = 'play' | 'editor' | 'spectator' | 'photo' | 'cinematic'
type WeatherType = 'clear' | 'rain' | 'snow' | 'storm' | 'fog' | 'night'
type NotificationType = 'info' | 'warning' | 'success' | 'danger' | 'quest'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  icon?: React.ReactNode
}

interface PlayerStats {
  health: number
  maxHealth: number
  stamina: number
  maxStamina: number
  armor: number
  speed: number
  state: string
  grounded: boolean
  position: [number, number, number]
}

interface WorldInfo {
  location: string
  sector: string
  nearestPOI: string
  distancePOI: number
  time: string
  day: number
  temperature: number
}

interface HUDProps {
  fps: number
  entities: number
  mode: GameMode
  weather: WeatherType
  playerStats?: PlayerStats
  worldInfo?: WorldInfo
  isAdminOpen?: boolean
  showMinimap?: boolean
  onToggleAdmin?: () => void
  onToggleEditor?: () => void
  onToggleMinimap?: () => void
}

// ——— Notification System ———
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  const push = useCallback((notif: Omit<Notification, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setNotifications(prev => [...prev.slice(-4), { ...notif, id }])
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, notif.duration || 4000)
  }, [])

  return { notifications, push }
}

// ——— Subcomponents ———

function HealthBar({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100
  const critical = pct < 25
  const low = pct < 50

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5">
          <Heart className={`w-3.5 h-3.5 ${critical ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
          <span className="text-white/60 tracking-wider">SANTÉ</span>
        </div>
        <span className={`font-mono text-sm ${critical ? 'text-red-400' : low ? 'text-amber-400' : 'text-emerald-400'}`}>
          {Math.round(current)}
        </span>
      </div>
      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="h-full rounded-full"
          style={{
            background: critical 
              ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
              : low 
                ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                : 'linear-gradient(90deg, #10b981, #34d399)',
            boxShadow: critical 
              ? '0 0 12px #ef4444' 
              : '0 0 8px rgba(16,185,129,0.4)',
          }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
      </div>
    </div>
  )
}

function StaminaBar({ current, max }: { current: number; max: number }) {
  const pct = (current / max) * 100
  const depleted = pct < 15

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5">
          <Zap className={`w-3.5 h-3.5 ${depleted ? 'text-red-400' : 'text-amber-400'}`} />
          <span className="text-white/60 tracking-wider">ENDURANCE</span>
        </div>
        <span className={`font-mono text-sm ${depleted ? 'text-red-400' : 'text-amber-400'}`}>
          {Math.round(current)}
        </span>
      </div>
      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="h-full rounded-full"
          style={{
            background: depleted 
              ? 'linear-gradient(90deg, #ef4444, #f87171)' 
              : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            boxShadow: depleted ? '0 0 8px #ef4444' : '0 0 6px rgba(245,158,11,0.3)',
          }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  )
}

function ArmorIndicator({ value }: { value: number }) {
  if (value <= 0) return null
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Shield className="w-3.5 h-3.5 text-sky-400" />
      <span className="text-white/60">ARMURE</span>
      <span className="font-mono text-sky-400 ml-auto">{value}</span>
    </div>
  )
}

function WeatherWidget({ weather, temperature }: { weather: WeatherType; temperature: number }) {
  const weatherData: Record<WeatherType, { icon: React.ReactNode; label: string; color: string }> = {
    clear:  { icon: <Sun className="w-4 h-4" />,             label: 'DÉGAGÉ',   color: '#fbbf24' },
    rain:   { icon: <CloudRain className="w-4 h-4" />,       label: 'PLUIE',    color: '#60a5fa' },
    snow:   { icon: <CloudSnow className="w-4 h-4" />,       label: 'NEIGE',    color: '#e2e8f0' },
    storm:  { icon: <CloudLightning className="w-4 h-4" />,  label: 'ORAGE',    color: '#a78bfa' },
    fog:    { icon: <CloudFog className="w-4 h-4" />,        label: 'BROUILLARD', color: '#94a3b8' },
    night:  { icon: <Moon className="w-4 h-4" />,            label: 'NUIT',     color: '#818cf8' },
  }

  const data = weatherData[weather] || weatherData.clear

  return (
    <div className="flex items-center gap-3">
      <div style={{ color: data.color }}>{data.icon}</div>
      <div>
        <div className="text-[10px] tracking-widest text-white/50">{data.label}</div>
        <div className="font-mono text-sm" style={{ color: data.color }}>
          {temperature}°C
        </div>
      </div>
    </div>
  )
}

function SpeedIndicator({ speed, state }: { speed: number; state: string }) {
  const stateColors: Record<string, string> = {
    idle: '#6b7280',
    walking: '#10b981',
    sprinting: '#f59e0b',
    jumping: '#3b82f6',
    falling: '#ef4444',
    crouching: '#8b5cf6',
    sliding: '#ec4899',
    landing: '#f97316',
  }

  return (
    <div className="flex items-center gap-2">
      <Gauge className="w-4 h-4" style={{ color: stateColors[state] || '#6b7280' }} />
      <div>
        <div className="font-mono text-lg leading-none" style={{ color: stateColors[state] || '#6b7280' }}>
          {speed.toFixed(1)}
        </div>
        <div className="text-[9px] tracking-widest text-white/40">M/S</div>
      </div>
      <div 
        className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium"
        style={{ 
          backgroundColor: `${stateColors[state] || '#6b7280'}20`,
          color: stateColors[state] || '#6b7280',
          border: `1px solid ${stateColors[state] || '#6b7280'}40`,
        }}
      >
        {state}
      </div>
    </div>
  )
}

function CompassBar({ rotation }: { rotation: number }) {
  const directions = [
    { deg: 0, label: 'N' },
    { deg: 45, label: 'NE' },
    { deg: 90, label: 'E' },
    { deg: 135, label: 'SE' },
    { deg: 180, label: 'S' },
    { deg: 225, label: 'SO' },
    { deg: 270, label: 'O' },
    { deg: 315, label: 'NO' },
  ]

  return (
    <div className="relative w-full h-6 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <Navigation className="w-3 h-3 text-red-400" style={{ transform: `rotate(${rotation}deg)` }} />
      </div>
      <div 
        className="absolute inset-0 flex items-center gap-8 text-[10px] text-white/40"
        style={{ transform: `translateX(${-rotation * 1.5}px)` }}
      >
        {[...directions, ...directions, ...directions].map((d, i) => (
          <span 
            key={i} 
            className={`font-mono ${d.label === 'N' ? 'text-red-400 font-bold' : ''}`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function NotificationToast({ notification }: { notification: Notification }) {
  const typeStyles: Record<NotificationType, { bg: string; border: string; icon: React.ReactNode }> = {
    info:    { bg: 'bg-sky-500/10',    border: 'border-sky-500/30',    icon: <Radio className="w-4 h-4 text-sky-400" /> },
    warning: { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: <ChevronUp className="w-4 h-4 text-emerald-400" /> },
    danger:  { bg: 'bg-red-500/10',    border: 'border-red-500/30',    icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
    quest:   { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  icon: <Target className="w-4 h-4 text-purple-400" /> },
  }

  const style = typeStyles[notification.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`${style.bg} ${style.border} border backdrop-blur-xl rounded-xl px-4 py-3 min-w-[220px] max-w-[300px]`}
    >
      <div className="flex items-start gap-3">
        {notification.icon || style.icon}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white">{notification.title}</div>
          {notification.message && (
            <div className="text-xs text-white/50 mt-0.5">{notification.message}</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
//  MAIN HUD COMPONENT
// ============================================================

export function HUD({ 
  fps, 
  entities, 
  mode, 
  weather,
  playerStats = {
    health: 100,
    maxHealth: 100,
    stamina: 87,
    maxStamina: 100,
    armor: 0,
    speed: 0,
    state: 'idle',
    grounded: true,
    position: [0, 0, 0],
  },
  worldInfo = {
    location: 'Route 138 • Québec',
    sector: 'Secteur Baie-Comeau',
    nearestPOI: 'Hôtel Ultra',
    distancePOI: 340,
    time: '14:32',
    day: 1,
    temperature: 22,
  },
  isAdminOpen = false,
  onToggleAdmin,
  onToggleEditor,
}: HUDProps) {

  const { notifications, push } = useNotifications()
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [damageFlash, setDamageFlash] = useState(false)
  const [compassRotation, setCompassRotation] = useState(0)
  const prevHealth = useRef(playerStats.health)

  // ——— Game clock ———
  const [gameTime, setGameTime] = useState(worldInfo.time)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setGameTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // ——— Damage flash ———
  useEffect(() => {
    if (playerStats.health < prevHealth.current) {
      setDamageFlash(true)
      setTimeout(() => setDamageFlash(false), 300)
      
      if (playerStats.health < 25) {
        push({ type: 'danger', title: 'SANTÉ CRITIQUE', message: 'Trouvez un point de soin' })
      }
    }
    prevHealth.current = playerStats.health
  }, [playerStats.health, push])

  // ——— Compass (simulated from player position) ———
  useEffect(() => {
    const interval = setInterval(() => {
      setCompassRotation(prev => (prev + 0.3) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // ——— Listen for game events ———
  useEffect(() => {
    const handleNotif = (e: CustomEvent) => push(e.detail)
    window.addEventListener('hud-notification', handleNotif as EventListener)
    return () => window.removeEventListener('hud-notification', handleNotif as EventListener)
  }, [push])

  // ——— Hide controls after 10s ———
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 10000)
    return () => clearTimeout(timer)
  }, [])

  // ——— Performance color ———
  const fpsColor = fps >= 55 ? '#10b981' : fps >= 30 ? '#f59e0b' : '#ef4444'

  // Don't render HUD in cinematic mode
  if (mode === 'cinematic') return null

  return (
    <>
      {/* ——— DAMAGE FLASH OVERLAY ——— */}
      <AnimatePresence>
        {damageFlash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[999] pointer-events-none"
            style={{ 
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(239,68,68,0.4) 100%)',
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>

      {/* ——— LOW HEALTH VIGNETTE ——— */}
      {playerStats.health < 30 && (
        <div 
          className="fixed inset-0 z-[998] pointer-events-none animate-pulse"
          style={{ 
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(239,68,68,0.15) 100%)',
            animationDuration: '2s',
          }}
        />
      )}

      {/* ============================================================ */}
      {/*  TOP — Status Bar + Compass                                   */}
      {/* ============================================================ */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] pt-4">
        {/* Compass */}
        <div className="glass-panel px-6 py-1 mb-2 w-[300px]">
          <CompassBar rotation={compassRotation} />
        </div>

        {/* Main Status */}
        <div className="glass-panel flex items-center gap-6 px-6 py-3">
          {/* FPS */}
          <div className="flex items-center gap-2 text-sm">
            <div className="relative">
              <Zap className="w-4 h-4" style={{ color: fpsColor }} />
              {fps < 30 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <span className="font-mono text-lg" style={{ color: fpsColor }}>{fps}</span>
            <span className="text-white/40 text-xs">FPS</span>
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Entities */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="font-mono">{entities.toLocaleString()}</span>
            <span className="text-white/40 text-xs">OBJ</span>
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Weather */}
          <WeatherWidget weather={weather} temperature={worldInfo.temperature} />

          <div className="w-px h-5 bg-white/10" />

          {/* Mode Badge */}
          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold tracking-wider"
            style={{
              background: mode === 'editor' ? 'rgba(236,72,153,0.15)' : 
                          mode === 'spectator' ? 'rgba(168,85,247,0.15)' :
                          mode === 'photo' ? 'rgba(59,130,246,0.15)' :
                          'rgba(245,158,11,0.15)',
              border: `1px solid ${
                mode === 'editor' ? 'rgba(236,72,153,0.3)' : 
                mode === 'spectator' ? 'rgba(168,85,247,0.3)' :
                mode === 'photo' ? 'rgba(59,130,246,0.3)' :
                'rgba(245,158,11,0.3)'
              }`,
              color: mode === 'editor' ? '#ec4899' : 
                     mode === 'spectator' ? '#a855f7' :
                     mode === 'photo' ? '#3b82f6' :
                     '#f59e0b',
            }}
          >
            <Eye className="w-3.5 h-3.5" />
            {mode.toUpperCase()}
          </div>

          {/* Mute Toggle */}
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="text-white/30 hover:text-white/70 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  LEFT — Player Stats                                          */}
      {/* ============================================================ */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[200]">
        <div className="glass-panel w-60 space-y-3 p-4">
          {/* Health */}
          <HealthBar current={playerStats.health} max={playerStats.maxHealth} />
          
          {/* Stamina */}
          <StaminaBar current={playerStats.stamina} max={playerStats.maxStamina} />
          
          {/* Armor */}
          <ArmorIndicator value={playerStats.armor} />

          {/* Separator */}
          <div className="border-t border-white/5 pt-2" />

          {/* Speed & State */}
          <SpeedIndicator speed={playerStats.speed} state={playerStats.state} />
          
          {/* Position */}
          <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
            <Crosshair className="w-3 h-3" />
            <span>
              {playerStats.position[0].toFixed(0)}, {playerStats.position[1].toFixed(0)}, {playerStats.position[2].toFixed(0)}
            </span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>28ms</span>
            </div>
            <div className="flex items-center gap-1">
              <Battery className="w-3 h-3" />
              <span>GPU 62%</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{gameTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  RIGHT — Location & World Info                                */}
      {/* ============================================================ */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-[200]">
        <div className="glass-panel w-56 space-y-3 p-4">
          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">{worldInfo.location}</div>
              <div className="text-[10px] text-white/40">{worldInfo.sector}</div>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* Nearest POI */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/60">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>{worldInfo.nearestPOI}</span>
            </div>
            <span className="font-mono text-cyan-400">{worldInfo.distancePOI}m</span>
          </div>

          {/* Day */}
          <div className="flex items-center gap-1.5 text-[10px] text-white/40">
            <Sun className="w-3 h-3" />
            <span>Jour {worldInfo.day} • {gameTime}</span>
          </div>

          <div className="border-t border-white/5" />

          {/* Quick Status */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center">
              <div className="text-white/40">VÉHICULE</div>
              <div className="text-emerald-400 font-medium">DISPO</div>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-1.5 text-center">
              <div className="text-white/40">RÉSEAU</div>
              <div className="text-emerald-400 font-medium">ACTIF</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  BOTTOM — Controls Help (auto-hide)                           */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className="glass-panel flex items-center gap-3 px-5 py-2.5 text-xs">
              {[
                { key: 'WASD', action: 'Mouvement' },
                { key: 'ESPACE', action: 'Saut' },
                { key: 'SHIFT', action: 'Sprint' },
                { key: 'CTRL', action: 'Accroupir' },
                { key: 'E', action: 'Interagir' },
                { key: '`', action: 'Admin' },
                { key: 'F2', action: 'Éditeur', special: true },
              ].map((ctrl, i) => (
                <React.Fragment key={ctrl.key}>
                  {i > 0 && <div className="w-px h-3 bg-white/10" />}
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${
                      ctrl.special 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {ctrl.key}
                    </span>
                    <span className="text-white/50">{ctrl.action}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/*  BOTTOM RIGHT — Quick Actions                                 */}
      {/* ============================================================ */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        <motion.button 
          whileHover={{ scale: 1.05, x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleEditor}
          className="glass-panel px-4 py-2.5 flex items-center gap-2 text-xs tracking-wider
                     hover:border-[#ff00aa]/50 hover:text-[#ff00aa] transition-all group"
        >
          <Car className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" /> 
          EDITOR
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.05, x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleAdmin}
          className={`glass-panel px-4 py-2.5 flex items-center gap-2 text-xs tracking-wider transition-all group ${
            isAdminOpen 
              ? 'border-[#00f5ff]/50 text-[#00f5ff]' 
              : 'hover:border-[#00f5ff]/50 hover:text-[#00f5ff]'
          }`}
        >
          <Target className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" /> 
          CONSOLE
          {isAdminOpen && <div className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse" />}
        </motion.button>
      </div>

      {/* ============================================================ */}
      {/*  NOTIFICATIONS (top right)                                    */}
      {/* ============================================================ */}
      <div className="fixed top-24 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map(notif => (
            <NotificationToast key={notif.id} notification={notif} />
          ))}
        </AnimatePresence>
      </div>

      {/* ============================================================ */}
      {/*  CROSSHAIR (center)                                           */}
      {/* ============================================================ */}
      {mode === 'play' && (
        <div className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center">
          <div className="relative w-6 h-6">
            {/* Center dot */}
            <div className="absolute inset-[10px] rounded-full bg-white/60" />
            {/* Lines */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-1.5 bg-white/40" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1px] h-1.5 bg-white/40" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-[1px] bg-white/40" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-[1px] bg-white/40" />
          </div>
        </div>
      )}
    </>
  )
}