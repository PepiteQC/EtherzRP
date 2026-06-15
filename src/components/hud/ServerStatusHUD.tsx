import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CloudSun,
  DoorOpen,
  RadioTower,
  RefreshCw,
  Server,
  ShieldCheck,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import { useEtherServerContext } from '../../context/EtherServerContext'

type ServerStatusHUDProps = {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  compact?: boolean
  showActions?: boolean
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function positionClass(position: NonNullable<ServerStatusHUDProps['position']>) {
  if (position === 'top-left') return 'top-6 left-6'
  if (position === 'top-right') return 'top-6 right-6'
  if (position === 'bottom-left') return 'bottom-6 left-6'
  return 'bottom-6 right-6'
}

function Dot({ active, danger }: { active: boolean; danger?: boolean }) {
  return (
    <span
      className={cx(
        'h-2 w-2 rounded-full',
        active && !danger && 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]',
        active && danger && 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.9)]',
        !active && 'bg-white/20'
      )}
    />
  )
}

export function ServerStatusHUD({
  position = 'top-left',
  compact = false,
  showActions = true,
}: ServerStatusHUDProps) {
  const ether = useEtherServerContext()

  const online = Boolean(ether.connected && ether.health?.ok)
  const firebaseReady = Boolean(ether.health?.firebaseAdmin)
  const world = ether.world
  const lastAlert = ether.lastAlert
  const lastDoorEvent = ether.lastDoorEvent

  return (
    <div className={cx('fixed z-[190]', positionClass(position))}>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-panel w-80 space-y-3 border-white/10 bg-black/35 p-4 text-white"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            {online ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-400" />
            )}

            <div>
              <div className="text-sm font-semibold tracking-wide">
                EtherWorld Server
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
                RP Quebec Runtime
              </div>
            </div>
          </div>

          <div
            className={cx(
              'rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-wider',
              online
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border-rose-400/30 bg-rose-400/10 text-rose-300'
            )}
          >
            {online ? 'LIVE' : 'OFF'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-white/45">
              <Server className="h-3.5 w-3.5" />
              API
            </div>
            <div className="flex items-center gap-2">
              <Dot active={online} />
              <span className={online ? 'text-emerald-300' : 'text-rose-300'}>
                {online ? 'Connectée' : 'Déconnectée'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-white/45">
              <ShieldCheck className="h-3.5 w-3.5" />
              Firebase
            </div>
            <div className="flex items-center gap-2">
              <Dot active={firebaseReady} danger={!firebaseReady} />
              <span className={firebaseReady ? 'text-emerald-300' : 'text-amber-300'}>
                {firebaseReady ? 'Admin OK' : 'Fallback'}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-white/45">
              <Users className="h-3.5 w-3.5" />
              Joueurs
            </div>
            <div className="font-mono text-white">
              {ether.onlineCount}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-white/45">
              <CloudSun className="h-3.5 w-3.5" />
              Météo
            </div>
            <div className="truncate uppercase text-white">
              {world?.weather || 'clear'}
            </div>
          </div>
        </div>

        {!compact && (
          <>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px]">
              <div className="mb-1 flex items-center gap-1.5 text-white/45">
                <RadioTower className="h-3.5 w-3.5" />
                Zone serveur
              </div>
              <div className="truncate text-white">
                {world?.zone || 'Quebec'}
              </div>
              <div className="truncate text-white/45">
                {world?.serverMessage || 'Aucun message serveur'}
              </div>
            </div>

            <AnimatePresence>
              {lastAlert?.message && (
                <motion.div
                  key={lastAlert.message}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px]"
                >
                  <div className="mb-1 flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Alerte RP
                  </div>
                  <div className="text-white/80">{lastAlert.message}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {lastDoorEvent?.doorId && (
                <motion.div
                  key={`${lastDoorEvent.doorId}-${lastDoorEvent.action}`}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-[11px]"
                >
                  <div className="mb-1 flex items-center gap-1.5 text-cyan-300">
                    <DoorOpen className="h-3.5 w-3.5" />
                    Porte synchronisée
                  </div>
                  <div className="truncate text-white/80">
                    {lastDoorEvent.doorId} • {lastDoorEvent.action}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {ether.error && (
          <div className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
            {ether.error}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => ether.refreshHealth()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70 transition hover:border-cyan-400/40 hover:text-cyan-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Health
            </button>

            <button
              type="button"
              onClick={() => ether.refreshWorld()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70 transition hover:border-emerald-400/40 hover:text-emerald-300"
            >
              <Zap className="h-3.5 w-3.5" />
              World
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
