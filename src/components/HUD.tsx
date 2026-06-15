import React, { useMemo, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Car,
  Clock,
  DoorOpen,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Mic,
  Navigation,
  Package,
  Radio,
  Shield,
  Target,
  ThermometerSun,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'

type HUDMode = 'play' | 'editor' | 'spectator'
type WeatherType = 'clear' | 'rain' | 'snow' | 'storm' | 'fog'
type VoiceMode = 'muet' | 'chuchoter' | 'normal' | 'crier' | 'radio'

interface HUDVehicle {
  name?: string
  speedKmh?: number
  fuel?: number
  locked?: boolean
  engineOn?: boolean
}

interface HUDWeapon {
  name?: string
  ammo?: number
  reserve?: number
}

interface HUDProps {
  fps: number
  entities: number
  mode: HUDMode
  weather: string

  health?: number
  armor?: number
  stamina?: number
  hunger?: number
  thirst?: number

  cash?: number
  bank?: number
  job?: string
  rank?: string

  location?: string
  sector?: string
  destination?: string
  time?: string

  wantedLevel?: number
  voiceMode?: VoiceMode
  radioChannel?: string

  vehicle?: HUDVehicle
  weapon?: HUDWeapon

  interaction?: string
  objective?: string
  alerts?: string[]

  isProtected?: boolean
  isAdmin?: boolean
}

function clampPercent(value = 0) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function formatMoney(value = 0) {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value)
}

function emitHUDEvent(name: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name))
}

function StatBar({
  label,
  value,
  colorClass,
  icon,
}: {
  label: string
  value: number
  colorClass: string
  icon?: ReactNode
}) {
  const percent = clampPercent(value)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-white/60">
          {icon}
          {label}
        </span>
        <span className={`font-mono ${colorClass}`}>{percent}</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function KeyHint({ keyName, label, danger }: { keyName: string; label: string; danger?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${danger ? 'text-rose-400' : 'text-white/70'}`}>
      <span className={`rounded px-1.5 py-px font-mono ${danger ? 'bg-rose-500/20' : 'bg-white/10'}`}>
        {keyName}
      </span>
      <span>{label}</span>
    </div>
  )
}

function WantedStars({ level = 0 }: { level?: number }) {
  const safeLevel = Math.max(0, Math.min(5, level))

  if (safeLevel <= 0) {
    return <span className="text-[10px] text-emerald-400">AUCUNE RECHERCHE</span>
  }

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={index < safeLevel ? 'text-rose-400' : 'text-white/15'}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export function HUD({
  fps,
  entities,
  mode,
  weather,

  health = 100,
  armor = 0,
  stamina = 87,
  hunger = 92,
  thirst = 88,

  cash = 420,
  bank = 18450,
  job = 'Citoyen',
  rank = 'Civil',

  location = 'Route 138 • Québec',
  sector = 'Secteur Baie-Comeau',
  destination = 'Hôtel Ultra',
  time = '14:32',

  wantedLevel = 0,
  voiceMode = 'normal',
  radioChannel = 'OFF',

  vehicle,
  weapon,

  interaction,
  objective = 'Explorer la ville et trouver une activité RP',
  alerts = [],

  isProtected = true,
  isAdmin = true,
}: HUDProps) {
  const weatherInfo = useMemo(() => {
    const map: Record<WeatherType, { icon: ReactNode; label: string; className: string }> = {
      clear: {
        icon: <ThermometerSun className="h-4 w-4" />,
        label: 'Dégagé',
        className: 'text-amber-300',
      },
      rain: {
        icon: <span>🌧</span>,
        label: 'Pluie',
        className: 'text-sky-400',
      },
      snow: {
        icon: <span>❄</span>,
        label: 'Neige',
        className: 'text-white',
      },
      storm: {
        icon: <span>⛈</span>,
        label: 'Orage',
        className: 'text-purple-400',
      },
      fog: {
        icon: <span>🌫</span>,
        label: 'Brouillard',
        className: 'text-gray-300',
      },
    }

    return map[weather as WeatherType] ?? map.clear
  }, [weather])

  const fpsColor =
    fps >= 55 ? 'text-emerald-400' : fps >= 35 ? 'text-amber-400' : 'text-rose-400'

  const modeLabel = {
    play: 'RP',
    editor: 'ÉDITEUR',
    spectator: 'SPECTATEUR',
  }[mode]

  return (
    <>
      {/* Barre principale */}
      <div className="hud hud-top">
        <motion.div
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel flex items-center gap-7 px-8 py-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <Zap className={`h-4 w-4 ${fpsColor}`} />
            <span className={`font-mono ${fpsColor}`}>{fps}</span>
            <span className="text-white/50">FPS</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-sky-400" />
            <span className="font-mono">{entities.toLocaleString('fr-CA')}</span>
            <span className="text-white/50">ENTITÉS</span>
          </div>

          <div className="flex items-center gap-2 border-l border-white/20 pl-6 text-sm">
            <span className={weatherInfo.className}>{weatherInfo.icon}</span>
            <span className="text-xs uppercase tracking-widest text-white/70">
              {weatherInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-white/20 pl-6 text-sm">
            <Target className="h-4 w-4 text-amber-400" />
            <span className="font-medium tracking-wider text-amber-400">{modeLabel}</span>
          </div>

          <div className="flex items-center gap-2 border-l border-white/20 pl-6 text-sm">
            <Clock className="h-4 w-4 text-white/50" />
            <span className="font-mono text-white/80">{time}</span>
          </div>
        </motion.div>
      </div>

      {/* Statut joueur */}
      <div className="hud hud-left">
        <motion.div
          initial={{ x: -18, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="glass-panel w-64 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <div className="text-sm font-semibold text-white">État du joueur</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">{rank}</div>
            </div>

            <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300">
              {isProtected ? 'SAFE' : 'RISQUE'}
            </div>
          </div>

          <StatBar
            label="SANTÉ"
            value={health}
            colorClass="text-emerald-400"
            icon={<Heart className="h-3.5 w-3.5" />}
          />

          <StatBar
            label="ARMURE"
            value={armor}
            colorClass="text-sky-400"
            icon={<Shield className="h-3.5 w-3.5" />}
          />

          <StatBar
            label="ENDURANCE"
            value={stamina}
            colorClass="text-amber-400"
            icon={<Activity className="h-3.5 w-3.5" />}
          />

          <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-white/60">
            <div className="rounded bg-white/5 px-2 py-1.5">
              FAIM <span className="float-right font-mono text-white">{clampPercent(hunger)}%</span>
            </div>
            <div className="rounded bg-white/5 px-2 py-1.5">
              SOIF <span className="float-right font-mono text-white">{clampPercent(thirst)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <Wallet className="h-3.5 w-3.5" />
              {formatMoney(cash)}
            </div>
            <div className="text-right font-mono text-white/60">
              Banque {formatMoney(bank)}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Localisation / RP */}
      <div className="hud hud-right">
        <motion.div
          initial={{ x: 18, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="glass-panel w-72 space-y-3"
        >
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-rose-400" />
            <div>
              <div className="text-sm font-medium">{location}</div>
              <div className="-mt-0.5 text-[10px] text-white/50">{sector}</div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70">
            <div className="mb-1 flex items-center gap-1.5 text-white">
              <Navigation className="h-3.5 w-3.5 text-sky-400" />
              Objectif RP
            </div>
            {objective}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded bg-white/5 px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-white/50">
                <Briefcase className="h-3.5 w-3.5" />
                JOB
              </div>
              <div className="truncate font-medium text-white">{job}</div>
            </div>

            <div className="rounded bg-white/5 px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-white/50">
                <Shield className="h-3.5 w-3.5" />
                POLICE
              </div>
              <WantedStars level={wantedLevel} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-white/60">
            <div className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              Voix : <span className="uppercase text-white">{voiceMode}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5" />
              Radio : <span className="text-white">{radioChannel}</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-2 text-[10px] text-white/60">
            Prochain arrêt : <span className="text-white">{destination}</span>
          </div>
        </motion.div>
      </div>

      {/* Véhicule */}
      {vehicle && (
        <div className="fixed bottom-24 left-6 z-[150]">
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel w-64 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-cyan-400" />
                <span className="font-medium">{vehicle.name ?? 'Véhicule'}</span>
              </div>

              <span className={vehicle.engineOn ? 'text-[10px] text-emerald-400' : 'text-[10px] text-rose-400'}>
                {vehicle.engineOn ? 'MOTEUR ON' : 'MOTEUR OFF'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded bg-white/5 px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-white/50">
                  <Gauge className="h-3.5 w-3.5" />
                  VITESSE
                </div>
                <div className="font-mono text-white">{Math.round(vehicle.speedKmh ?? 0)} KM/H</div>
              </div>

              <div className="rounded bg-white/5 px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-white/50">
                  <Fuel className="h-3.5 w-3.5" />
                  ESSENCE
                </div>
                <div className="font-mono text-white">{clampPercent(vehicle.fuel ?? 0)}%</div>
              </div>
            </div>

            <div className="text-[10px] text-white/50">
              Serrure :{' '}
              <span className={vehicle.locked ? 'text-rose-400' : 'text-emerald-400'}>
                {vehicle.locked ? 'Verrouillée' : 'Déverrouillée'}
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Arme / inventaire rapide */}
      {weapon && (
        <div className="fixed bottom-24 right-6 z-[150]">
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel w-52 space-y-2"
          >
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-amber-400" />
              <span className="font-medium">{weapon.name ?? 'Équipement'}</span>
            </div>

            <div className="rounded bg-white/5 px-3 py-2 text-xs">
              Munitions :{' '}
              <span className="font-mono text-white">
                {weapon.ammo ?? 0}/{weapon.reserve ?? 0}
              </span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Interaction contextuelle */}
      <AnimatePresence>
        {interaction && (
          <motion.div
            key="interaction"
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.96 }}
            className="fixed bottom-28 left-1/2 z-[160] -translate-x-1/2"
          >
            <div className="glass-panel flex items-center gap-3 px-5 py-3 text-sm">
              <span className="rounded bg-white/10 px-2 py-1 font-mono text-xs">E</span>
              <DoorOpen className="h-4 w-4 text-cyan-400" />
              <span>{interaction}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alertes RP */}
      <div className="fixed right-6 top-24 z-[170] flex w-80 flex-col gap-2">
        <AnimatePresence>
          {alerts.slice(0, 3).map((alert, index) => (
            <motion.div
              key={`${alert}-${index}`}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              className="glass-panel flex items-start gap-2 border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-white/80"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{alert}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Contrôles */}
      <div className="hud hud-bottom">
        <div className="glass-panel flex items-center gap-3 px-5 py-2.5 text-xs">
          <KeyHint keyName="WASD" label="Bouger" />
          <div className="h-3 w-px bg-white/20" />
          <KeyHint keyName="SPACE" label="Sauter" />
          <div className="h-3 w-px bg-white/20" />
          <KeyHint keyName="E" label="Interagir" />
          <div className="h-3 w-px bg-white/20" />
          <KeyHint keyName="F" label="Véhicule" />
          <div className="h-3 w-px bg-white/20" />
          <KeyHint keyName="M" label="Carte" />
          <div className="h-3 w-px bg-white/20" />
          <KeyHint keyName="`" label="Admin" />
          <div className="h-3 w-px bg-white/20" />
          <KeyHint keyName="F2" label="Éditeur" danger />
        </div>
      </div>

      {/* Accès admin */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-[180] flex flex-col gap-2 text-xs">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => emitHUDEvent('open-editor')}
            className="glass-panel flex items-center gap-2 px-4 py-2 text-xs transition-all hover:border-[#ff00aa] hover:text-[#ff00aa]"
          >
            <Car className="h-3.5 w-3.5" />
            ÉDITEUR
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => emitHUDEvent('toggle-admin')}
            className="glass-panel flex items-center gap-2 px-4 py-2 text-xs transition-all hover:border-[#00f5ff] hover:text-[#00f5ff]"
          >
            <Target className="h-3.5 w-3.5" />
            CONSOLE ADMIN
          </motion.button>
        </div>
      )}
    </>
  )
}