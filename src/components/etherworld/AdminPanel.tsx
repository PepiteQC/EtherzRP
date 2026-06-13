'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useStore, useGameState, addChat, addAdminEffect, toggleGod, toggleFly, setGlobal } from '@/lib/etherworld/game-store'
import { useHotelStore } from '@/components/hotel/HotelStore'
import { cn } from '@/lib/utils'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type AdminTab = 'console' | 'players' | 'world' | 'hotel' | 'items' | 'settings' | 'logs'

interface AdminCommand {
  name: string
  aliases: string[]
  description: string
  usage: string
  category: 'player' | 'world' | 'hotel' | 'admin' | 'fun' | 'debug'
  execute: (args: string[]) => { success: boolean; message: string }
}

interface ConsoleEntry {
  id: string
  type: 'input' | 'output' | 'error' | 'success' | 'warning' | 'system'
  content: string
  timestamp: number
}

interface QuickAction {
  id: string
  label: string
  icon: string
  color: string
  action: () => void
  category: string
  dangerous?: boolean
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES VISUELLES
// ════════════════════════════════════════════════════════════════════════════

const TAB_CONFIG: Record<AdminTab, { label: string; icon: string; color: string }> = {
  console:  { label: 'Console',     icon: '⌨️',  color: '#22c55e' },
  players:  { label: 'Joueurs',     icon: '👥',  color: '#3b82f6' },
  world:    { label: 'Monde',       icon: '🌍',  color: '#f59e0b' },
  hotel:    { label: 'Hôtel',       icon: '🏨',  color: '#a855f7' },
  items:    { label: 'Objets',      icon: '📦',  color: '#ec4899' },
  settings: { label: 'Paramètres',  icon: '⚙️',  color: '#6366f1' },
  logs:     { label: 'Logs',        icon: '📋',  color: '#14b8a6' },
}

const CATEGORY_COLORS: Record<string, string> = {
  player: '#3b82f6',
  world: '#f59e0b',
  hotel: '#a855f7',
  admin: '#ef4444',
  fun: '#ec4899',
  debug: '#6366f1',
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — AdminPanel
// ════════════════════════════════════════════════════════════════════════════

export function AdminPanel() {
  const { adminOpen } = useStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('console')
  const [consoleHistory, setConsoleHistory] = useState<ConsoleEntry[]>([
    { id: '0', type: 'system', content: '═══ ETHERWORLD ADMIN CONSOLE v3.0 ═══', timestamp: Date.now() },
    { id: '1', type: 'system', content: 'Tapez /help pour voir les commandes disponibles.', timestamp: Date.now() },
    { id: '2', type: 'system', content: `Session: ${new Date().toLocaleDateString('fr-CA')} ${new Date().toLocaleTimeString('fr-CA')}`, timestamp: Date.now() },
  ])

  // Raccourci clavier pour toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.ctrlKey && e.shiftKey && e.key === 'A')) {
        e.preventDefault()
        setGlobal({ adminOpen: !useStore.getState().adminOpen })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const addConsoleEntry = useCallback((type: ConsoleEntry['type'], content: string) => {
    setConsoleHistory(prev => [...prev.slice(-200), {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, content, timestamp: Date.now(),
    }])
  }, [])

  if (!adminOpen) return null

  return (
    <>
      {/* Animations CSS */}
      <style jsx global>{`
        @keyframes adminSlideIn { from { opacity: 0; transform: translateX(20px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes adminPulse { 0%, 100% { box-shadow: 0 0 15px rgba(239,68,68,0.15); } 50% { box-shadow: 0 0 25px rgba(239,68,68,0.25); } }
        @keyframes adminScanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        @keyframes typewriter { from { width: 0; } to { width: 100%; } }
        .admin-scrollbar::-webkit-scrollbar { width: 4px; }
        .admin-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .admin-scrollbar::-webkit-scrollbar-thumb { background: rgba(239,68,68,0.3); border-radius: 2px; }
        .admin-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(239,68,68,0.5); }
      `}</style>

      <div className="fixed inset-0 z-[300] pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[520px] h-full pointer-events-auto flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(8,6,14,0.97), rgba(12,10,22,0.98))',
            borderLeft: '1px solid rgba(239,68,68,0.15)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.05)',
            animation: 'adminSlideIn 0.25s ease-out, adminPulse 4s ease-in-out infinite',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* ══ HEADER ══ */}
          <AdminHeader onClose={() => setGlobal({ adminOpen: false })} />

          {/* ══ TABS ══ */}
          <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* ══ CONTENT ══ */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'console' && (
              <ConsoleTab
                history={consoleHistory}
                addEntry={addConsoleEntry}
              />
            )}
            {activeTab === 'players' && <PlayersTab addEntry={addConsoleEntry} />}
            {activeTab === 'world' && <WorldTab addEntry={addConsoleEntry} />}
            {activeTab === 'hotel' && <HotelTab addEntry={addConsoleEntry} />}
            {activeTab === 'items' && <ItemsTab addEntry={addConsoleEntry} />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'logs' && <LogsTab />}
          </div>

          {/* ══ FOOTER STATUS BAR ══ */}
          <AdminStatusBar />

          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.015]">
            <div className="w-full h-[2px] bg-red-500" style={{ animation: 'adminScanline 8s linear infinite' }} />
          </div>
        </div>
      </div>
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HEADER
// ════════════════════════════════════════════════════════════════════════════

function AdminHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'rgba(239,68,68,0.12)', background: 'linear-gradient(90deg, rgba(239,68,68,0.06), transparent)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 0 12px rgba(239,68,68,0.1)' }}>
          <span className="text-red-400 font-black text-sm">⚡</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-wide">ADMIN PANEL</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25 font-bold">v3.0</span>
          </div>
          <div className="text-[9px] text-zinc-500 font-mono mt-0.5">EtherWorld Québec — Contrôle Serveur</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-zinc-600 font-mono">F2</span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all">
          ✕
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TABS
// ════════════════════════════════════════════════════════════════════════════

function AdminTabs({ activeTab, onTabChange }: { activeTab: AdminTab; onTabChange: (tab: AdminTab) => void }) {
  return (
    <div className="flex px-3 py-1.5 gap-0.5 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
      {(Object.entries(TAB_CONFIG) as [AdminTab, typeof TAB_CONFIG[AdminTab]][]).map(([key, cfg]) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5"
          style={{
            background: activeTab === key ? `${cfg.color}15` : 'transparent',
            color: activeTab === key ? cfg.color : 'rgba(255,255,255,0.35)',
            border: `1px solid ${activeTab === key ? `${cfg.color}30` : 'transparent'}`,
            boxShadow: activeTab === key ? `0 0 8px ${cfg.color}10` : 'none',
          }}
        >
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
        </button>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// CONSOLE TAB — Terminal interactif
// ════════════════════════════════════════════════════════════════════════════

function ConsoleTab({ history, addEntry }: { history: ConsoleEntry[]; addEntry: (type: ConsoleEntry['type'], content: string) => void }) {
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useAdminCommands(addEntry)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Auto-complétion
  useEffect(() => {
    if (input.startsWith('/') && input.length > 1) {
      const search = input.slice(1).toLowerCase()
      const matches = commands
        .filter(cmd => cmd.name.startsWith(search) || cmd.aliases.some(a => a.startsWith(search)))
        .map(cmd => cmd.name)
        .slice(0, 5)
      setSuggestions(matches)
    } else {
      setSuggestions([])
    }
  }, [input, commands])

  const executeCommand = useCallback((cmdInput: string) => {
    if (!cmdInput.trim()) return

    addEntry('input', `> ${cmdInput}`)
    setCmdHistory(prev => [cmdInput, ...prev.slice(0, 49)])
    setHistoryIdx(-1)

    if (!cmdInput.startsWith('/')) {
      addChat('Admin', cmdInput, 'admin', 'admin')
      addEntry('success', `[Chat Admin] ${cmdInput}`)
      setInput('')
      return
    }

    const parts = cmdInput.slice(1).split(' ')
    const cmdName = parts[0].toLowerCase()
    const args = parts.slice(1)

    const cmd = commands.find(c => c.name === cmdName || c.aliases.includes(cmdName))
    if (!cmd) {
      addEntry('error', `Commande inconnue: /${cmdName}. Tapez /help pour la liste.`)
      setInput('')
      return
    }

    const result = cmd.execute(args)
    addEntry(result.success ? 'success' : 'error', result.message)
    setInput('')
  }, [commands, addEntry])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1)
        setHistoryIdx(newIdx)
        setInput(cmdHistory[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1
        setHistoryIdx(newIdx)
        setInput(cmdHistory[newIdx])
      } else {
        setHistoryIdx(-1)
        setInput('')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setInput(`/${suggestions[0]} `)
        setSuggestions([])
      }
    }
  }, [input, cmdHistory, historyIdx, suggestions, executeCommand])

  const getEntryColor = (type: ConsoleEntry['type']) => {
    switch (type) {
      case 'input': return '#93c5fd'
      case 'output': return '#d1d5db'
      case 'error': return '#fca5a5'
      case 'success': return '#86efac'
      case 'warning': return '#fcd34d'
      case 'system': return '#c4b5fd'
      default: return '#d1d5db'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Terminal output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 admin-scrollbar" style={{ background: 'rgba(0,0,0,0.25)' }}>
        {history.map(entry => (
          <div key={entry.id} className="mb-1 flex items-start gap-2 text-[11px] font-mono leading-relaxed">
            <span className="text-zinc-600 shrink-0 w-14 text-right">
              {new Date(entry.timestamp).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span style={{ color: getEntryColor(entry.type) }}>
              {entry.type === 'error' && '✗ '}
              {entry.type === 'success' && '✓ '}
              {entry.type === 'warning' && '⚠ '}
              {entry.type === 'system' && '◈ '}
              {entry.content}
            </span>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-1.5 border-t flex gap-1.5 flex-wrap" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.2)' }}>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => { setInput(`/${s} `); setSuggestions([]); inputRef.current?.focus() }}
              className="px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/50 text-[9px] text-zinc-400 font-mono hover:bg-zinc-700/50 hover:text-white transition-colors"
            >
              /{s}
            </button>
          ))}
          <span className="text-[8px] text-zinc-600 self-center ml-1">TAB pour compléter</span>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t flex items-center gap-2" style={{ borderColor: 'rgba(239,68,68,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        <span className="text-red-400 text-xs font-mono font-bold">❯</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="/commande ou message admin..."
          className="flex-1 bg-transparent text-white text-[11px] font-mono outline-none placeholder:text-zinc-600"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={() => executeCommand(input)}
          className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          EXEC
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMMANDES ADMIN
// ════════════════════════════════════════════════════════════════════════════

function useAdminCommands(addEntry: (type: ConsoleEntry['type'], content: string) => void): AdminCommand[] {
  return useMemo(() => [
    // ── HELP ──
    {
      name: 'help', aliases: ['h', '?'], description: 'Affiche la liste des commandes', usage: '/help [commande]', category: 'admin',
      execute: (args) => {
        if (args.length > 0) {
          const cmds = useAdminCommands(addEntry)
          const cmd = cmds.find(c => c.name === args[0])
          if (cmd) return { success: true, message: `/${cmd.name} — ${cmd.description}\nUsage: ${cmd.usage}\nAliases: ${cmd.aliases.join(', ')}` }
          return { success: false, message: `Commande /${args[0]} introuvable` }
        }
        const categories = ['player', 'world', 'hotel', 'admin', 'fun', 'debug']
        const lines = categories.map(cat => {
          const cmds = useAdminCommands(addEntry).filter(c => c.category === cat)
          if (cmds.length === 0) return ''
          return `\n═══ ${cat.toUpperCase()} ═══\n${cmds.map(c => `  /${c.name} — ${c.description}`).join('\n')}`
        }).filter(Boolean).join('')
        return { success: true, message: `Commandes disponibles:${lines}` }
      },
    },

    // ── PLAYER ──
    {
      name: 'tp', aliases: ['teleport'], description: 'Téléporter le joueur', usage: '/tp <x> <y> <z>', category: 'player',
      execute: (args) => {
        if (args.length < 3) return { success: false, message: 'Usage: /tp <x> <y> <z>' }
        const [x, y, z] = args.map(Number)
        if (isNaN(x) || isNaN(y) || isNaN(z)) return { success: false, message: 'Coordonnées invalides' }
        setGlobal({ playerPos: [x, y, z] })
        return { success: true, message: `Téléporté à [${x}, ${y}, ${z}]` }
      },
    },
    {
      name: 'god', aliases: ['godmode'], description: 'Toggle mode dieu', usage: '/god', category: 'player',
      execute: () => { toggleGod(); const gm = useStore.getState().isGodMode; return { success: true, message: `Mode Dieu: ${!gm ? 'ON' : 'OFF'}` } },
    },
    {
      name: 'fly', aliases: ['noclip'], description: 'Toggle mode vol', usage: '/fly', category: 'player',
      execute: () => { toggleFly(); const fm = useStore.getState().flyMode; return { success: true, message: `Vol: ${!fm ? 'ON' : 'OFF'}` } },
    },
    {
      name: 'heal', aliases: ['hp'], description: 'Soigner le joueur', usage: '/heal [amount]', category: 'player',
      execute: (args) => {
        const amount = args[0] ? parseInt(args[0]) : 100
        useStore.getState().updateStats?.({ health: Math.min(amount, 100) })
        return { success: true, message: `Santé restaurée à ${amount}` }
      },
    },
    {
      name: 'money', aliases: ['cash', '$'], description: 'Ajouter de l\'argent', usage: '/money <amount>', category: 'player',
      execute: (args) => {
        if (!args[0]) return { success: false, message: 'Usage: /money <amount>' }
        const amount = parseInt(args[0])
        if (isNaN(amount)) return { success: false, message: 'Montant invalide' }
        useStore.getState().addMoney?.(amount)
        return { success: true, message: `+${amount}$ ajouté` }
      },
    },
    {
      name: 'xp', aliases: ['exp'], description: 'Ajouter de l\'expérience', usage: '/xp <amount>', category: 'player',
      execute: (args) => {
        if (!args[0]) return { success: false, message: 'Usage: /xp <amount>' }
        const amount = parseInt(args[0])
        if (isNaN(amount)) return { success: false, message: 'Montant invalide' }
        useStore.getState().addXp?.(amount)
        return { success: true, message: `+${amount} XP ajouté` }
      },
    },
    {
      name: 'speed', aliases: ['spd'], description: 'Modifier la vitesse', usage: '/speed <1-10>', category: 'player',
      execute: (args) => {
        const spd = parseInt(args[0] || '5')
        return { success: true, message: `Vitesse: ${spd}x (note: implémenter dans PlayerCharacter)` }
      },
    },
    {
      name: 'feed', aliases: ['eat'], description: 'Restaurer faim et soif', usage: '/feed', category: 'player',
      execute: () => {
        useStore.getState().feed?.(100, 100)
        return { success: true, message: 'Faim et soif restaurées' }
      },
    },
    {
      name: 'rest', aliases: ['energy'], description: 'Restaurer l\'énergie', usage: '/rest', category: 'player',
      execute: () => {
        useStore.getState().rest?.(100)
        return { success: true, message: 'Énergie restaurée' }
      },
    },

    // ── WORLD ──
    {
      name: 'time', aliases: ['settime'], description: 'Changer l\'heure', usage: '/time <0-23>', category: 'world',
      execute: (args) => {
        if (!args[0]) return { success: false, message: 'Usage: /time <0-23>' }
        const h = parseInt(args[0])
        if (isNaN(h) || h < 0 || h > 23) return { success: false, message: 'Heure invalide (0-23)' }
        useStore.getState().setTimeOfDay?.(h)
        return { success: true, message: `Heure: ${h}h00` }
      },
    },
    {
      name: 'weather', aliases: ['meteo', 'w'], description: 'Changer la météo', usage: '/weather <clear|rain|snow|fog|storm>', category: 'world',
      execute: (args) => {
        const valid = ['clear', 'rain', 'snow', 'fog', 'storm', 'hail', 'blizzard']
        if (!args[0] || !valid.includes(args[0])) return { success: false, message: `Usage: /weather <${valid.join('|')}>` }
        useStore.getState().setWeather?.(args[0] as any)
        return { success: true, message: `Météo: ${args[0]}` }
      },
    },
    {
      name: 'season', aliases: ['saison'], description: 'Changer la saison', usage: '/season <spring|summer|autumn|winter>', category: 'world',
      execute: (args) => {
        const valid = ['spring', 'summer', 'autumn', 'winter']
        if (!args[0] || !valid.includes(args[0])) return { success: false, message: `Usage: /season <${valid.join('|')}>` }
        useStore.getState().setSeason?.(args[0] as any)
        return { success: true, message: `Saison: ${args[0]}` }
      },
    },

    // ── HOTEL ──
    {
      name: 'door', aliases: ['porte'], description: 'Contrôler une porte', usage: '/door <id> <open|close|lock|unlock>', category: 'hotel',
      execute: (args) => {
        if (args.length < 2) return { success: false, message: 'Usage: /door <id> <open|close|lock|unlock>' }
        const hotel = useHotelStore.getState()
        const [doorId, action] = args
        const door = hotel.doors[doorId]
        if (!door) return { success: false, message: `Porte "${doorId}" introuvable` }
        switch (action) {
          case 'open': hotel.tryAccessDoor?.(doorId); break
          case 'close': hotel.setDoorOpen?.(doorId as any, false); break
          case 'lock': hotel.lockDoor?.(doorId); break
          case 'unlock': hotel.unlockDoor?.(doorId); break
          default: return { success: false, message: 'Action: open|close|lock|unlock' }
        }
        return { success: true, message: `Porte ${doorId}: ${action}` }
      },
    },
    {
      name: 'alarm', aliases: ['alarme'], description: 'Déclencher/arrêter l\'alarme', usage: '/alarm <on|off|fire>', category: 'hotel',
      execute: (args) => {
        const hotel = useHotelStore.getState()
        switch (args[0]) {
          case 'on': hotel.triggerAlarm?.('system', 'Alarme admin'); return { success: true, message: '🚨 Alarme déclenchée' }
          case 'off': hotel.resetAlarm?.(); return { success: true, message: 'Alarme désactivée' }
          case 'fire': hotel.triggerFireAlarm?.(); return { success: true, message: '🔥 ALARME INCENDIE' }
          default: return { success: false, message: 'Usage: /alarm <on|off|fire>' }
        }
      },
    },
    {
      name: 'lockdown', aliases: ['confinement'], description: 'Activer/désactiver le confinement', usage: '/lockdown <on|off> [raison]', category: 'hotel',
      execute: (args) => {
        const hotel = useHotelStore.getState()
        if (args[0] === 'on') { hotel.activateLockdown?.(args.slice(1).join(' ') || 'Ordre admin'); return { success: true, message: '🔒 CONFINEMENT ACTIVÉ' } }
        if (args[0] === 'off') { hotel.deactivateLockdown?.(); return { success: true, message: 'Confinement levé' } }
        return { success: false, message: 'Usage: /lockdown <on|off> [raison]' }
      },
    },
    {
      name: 'elevator', aliases: ['elev', 'ascenseur'], description: 'Contrôler l\'ascenseur', usage: '/elevator <floor|stop|reset>', category: 'hotel',
      execute: (args) => {
        const hotel = useHotelStore.getState()
        if (args[0] === 'stop') { hotel.emergencyStopElevator?.(); return { success: true, message: 'Ascenseur: arrêt d\'urgence' } }
        if (args[0] === 'reset') { hotel.resetElevator?.(); return { success: true, message: 'Ascenseur réinitialisé' } }
        const floor = parseInt(args[0])
        if (!isNaN(floor)) { hotel.callElevator?.(floor); return { success: true, message: `Ascenseur appelé à l'étage ${floor}` } }
        return { success: false, message: 'Usage: /elevator <floor|stop|reset>' }
      },
    },
    {
      name: 'card', aliases: ['carte'], description: 'Changer le niveau de carte', usage: '/card <guest|resident|vip|admin>', category: 'hotel',
      execute: (args) => {
        const valid = ['none', 'guest', 'resident', 'vip', 'admin']
        if (!args[0] || !valid.includes(args[0])) return { success: false, message: `Usage: /card <${valid.join('|')}>` }
        const hotel = useHotelStore.getState()
        hotel.upgradeCard?.(args[0] as any)
        return { success: true, message: `Carte: ${args[0].toUpperCase()}` }
      },
    },

    // ── FUN ──
    {
      name: 'explosion', aliases: ['boom', 'explode'], description: 'Créer une explosion', usage: '/explosion [x] [y] [z]', category: 'fun',
      execute: (args) => {
        const pos = useStore.getState().playerPos
        const x = args[0] ? parseFloat(args[0]) : pos[0]
        const y = args[1] ? parseFloat(args[1]) : pos[1]
        const z = args[2] ? parseFloat(args[2]) : pos[2]
        addAdminEffect('explosion', [x, y, z], 'world', 3000, { intensity: 5, radius: 10, color: '#ff4400' })
        return { success: true, message: `💥 Explosion à [${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}]` }
      },
    },
    {
      name: 'spotlight', aliases: ['spot'], description: 'Spotlight sur une position', usage: '/spotlight [durée_sec]', category: 'fun',
      execute: (args) => {
        const dur = (parseInt(args[0] || '10')) * 1000
        const pos = useStore.getState().playerPos
        addAdminEffect('spotlight', [pos[0], pos[1] + 20, pos[2]], 'player', dur)
        return { success: true, message: `🔦 Spotlight: ${dur / 1000}s` }
      },
    },
    {
      name: 'storm', aliases: ['orage'], description: 'Déclencher un orage', usage: '/storm [durée_sec]', category: 'fun',
      execute: (args) => {
        const dur = (parseInt(args[0] || '30')) * 1000
        addAdminEffect('storm', [0, 50, 0], 'world', dur)
        useStore.getState().setWeather?.('storm')
        return { success: true, message: `⛈️ Orage: ${dur / 1000}s` }
      },
    },
    {
      name: 'say', aliases: ['announce', 'broadcast'], description: 'Message serveur', usage: '/say <message>', category: 'fun',
      execute: (args) => {
        if (!args.length) return { success: false, message: 'Usage: /say <message>' }
        const msg = args.join(' ')
        addChat('SERVEUR', msg, 'announcement', 'global')
        useStore.getState().setNotification?.(msg, 'warning', 8000, '📢')
        return { success: true, message: `📢 Annonce: ${msg}` }
      },
    },

    // ── DEBUG ──
    {
      name: 'pos', aliases: ['position', 'coords'], description: 'Position actuelle', usage: '/pos', category: 'debug',
      execute: () => {
        const pos = useStore.getState().playerPos
        return { success: true, message: `Position: [${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}, ${pos[2].toFixed(2)}]` }
      },
    },
    {
      name: 'stats', aliases: ['debug'], description: 'Infos de debug', usage: '/stats', category: 'debug',
      execute: () => {
        const state = useStore.getState()
        const hotel = useHotelStore.getState()
        const lines = [
          `Joueur: ${state.playerProfile?.name || 'N/A'}`,
          `Mode: ${state.gameMode || 'rp'}`,
          `Pos: [${state.playerPos.map(p => p.toFixed(1)).join(', ')}]`,
          `Heure: ${state.timeOfDay || 0}h`,
          `Météo: ${state.weather || 'clear'}`,
          `Objets builder: ${state.placedObjects?.length || 0}`,
          `Portes hôtel: ${Object.keys(hotel.doors || {}).length}`,
          `Chambres: ${hotel.rooms?.length || 0}`,
          `Alarme: ${hotel.masterAlarm ? 'OUI' : 'non'}`,
          `Inventaire: ${state.inventorySlots?.filter(s => s.item).length || 0}/40`,
        ]
        return { success: true, message: lines.join('\n') }
      },
    },
    {
      name: 'clear', aliases: ['cls'], description: 'Effacer la console', usage: '/clear', category: 'debug',
      execute: () => {
        addEntry('system', '═══ Console effacée ═══')
        return { success: true, message: '' }
      },
    },
    {
      name: 'reset', aliases: [], description: 'Réinitialiser un système', usage: '/reset <hotel|inventory|weather|all>', category: 'debug',
      execute: (args) => {
        switch (args[0]) {
          case 'hotel': useHotelStore.getState().resetAlarm?.(); return { success: true, message: 'Hôtel réinitialisé' }
          case 'inventory': useStore.getState().clearInventory?.(); return { success: true, message: 'Inventaire vidé' }
          case 'weather': useStore.getState().setWeather?.('clear'); return { success: true, message: 'Météo: clear' }
          case 'all': return { success: true, message: 'Reset total (implémenter localStorage.clear)' }
          default: return { success: false, message: 'Usage: /reset <hotel|inventory|weather|all>' }
        }
      },
    },
  ], [addEntry])
}

// ════════════════════════════════════════════════════════════════════════════
// PLAYERS TAB
// ════════════════════════════════════════════════════════════════════════════

function PlayersTab({ addEntry }: { addEntry: (type: ConsoleEntry['type'], content: string) => void }) {
  const profile = useStore(s => s.playerProfile)
  const stats = useStore(s => s.playerStats)
  const skills = useStore(s => s.playerSkills)

  return (
    <div className="p-4 overflow-y-auto h-full admin-scrollbar space-y-4">
      <SectionHeader title="PROFIL JOUEUR" icon="👤" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Santé" value={stats?.health ?? 100} max={100} color="#ef4444" icon="❤️" />
        <StatCard label="Faim" value={stats?.hunger ?? 80} max={100} color="#f59e0b" icon="🍔" />
        <StatCard label="Soif" value={stats?.thirst ?? 75} max={100} color="#3b82f6" icon="💧" />
        <StatCard label="Énergie" value={stats?.energy ?? 90} max={100} color="#22c55e" icon="⚡" />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <InfoCard label="Argent" value={`$${(stats?.money ?? 0).toLocaleString()}`} icon="💰" />
        <InfoCard label="Banque" value={`$${(stats?.bank ?? 0).toLocaleString()}`} icon="🏦" />
        <InfoCard label="Niveau" value={`${stats?.level ?? 1}`} icon="⭐" />
        <InfoCard label="XP" value={`${stats?.experience ?? 0}/${stats?.xpToNext ?? 100}`} icon="📊" />
      </div>

      <SectionHeader title="ACTIONS RAPIDES" icon="⚡" />

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Heal Max', icon: '❤️', color: '#ef4444', action: () => { useStore.getState().healPlayer?.(100); addEntry('success', 'Santé restaurée') } },
          { label: 'Feed Max', icon: '🍔', color: '#f59e0b', action: () => { useStore.getState().feed?.(100, 100); addEntry('success', 'Faim/soif restaurées') } },
          { label: 'Rest Max', icon: '⚡', color: '#22c55e', action: () => { useStore.getState().rest?.(100); addEntry('success', 'Énergie restaurée') } },
          { label: '+10000$', icon: '💰', color: '#3b82f6', action: () => { useStore.getState().addMoney?.(10000); addEntry('success', '+10000$ ajouté') } },
          { label: '+1000 XP', icon: '⭐', color: '#a855f7', action: () => { useStore.getState().addXp?.(1000); addEntry('success', '+1000 XP ajouté') } },
          { label: 'God Mode', icon: '🛡️', color: '#ec4899', action: () => { toggleGod(); addEntry('success', 'God mode toggle') } },
          { label: 'Fly Mode', icon: '✈️', color: '#14b8a6', action: () => { toggleFly(); addEntry('success', 'Fly mode toggle') } },
          { label: 'Tout Max', icon: '🌟', color: '#f59e0b', action: () => { const s = useStore.getState(); s.healPlayer?.(100); s.feed?.(100, 100); s.rest?.(100); addEntry('success', 'Tous les stats au max') } },
        ].map(qa => (
          <QuickActionButton key={qa.label} {...qa} />
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// WORLD TAB
// ════════════════════════════════════════════════════════════════════════════

function WorldTab({ addEntry }: { addEntry: (type: ConsoleEntry['type'], content: string) => void }) {
  const timeOfDay = useStore(s => s.timeOfDay)
  const weather = useStore(s => s.weather)

  return (
    <div className="p-4 overflow-y-auto h-full admin-scrollbar space-y-4">
      <SectionHeader title="TEMPS" icon="🕐" />

      <div className="flex items-center gap-2 flex-wrap">
        {[0, 4, 6, 8, 12, 16, 18, 20, 22].map(h => (
          <button
            key={h}
            onClick={() => { useStore.getState().setTimeOfDay?.(h); addEntry('success', `Heure: ${h}h`) }}
            className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all"
            style={{
              background: timeOfDay === h ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.02)',
              color: timeOfDay === h ? '#f59e0b' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${timeOfDay === h ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.04)'}`,
            }}
          >
            {h}h
          </button>
        ))}
      </div>

      <SectionHeader title="MÉTÉO" icon="🌤️" />

      <div className="grid grid-cols-3 gap-2">
        {(['clear', 'rain', 'snow', 'fog', 'storm', 'blizzard'] as const).map(w => (
          <button
            key={w}
            onClick={() => { useStore.getState().setWeather?.(w); addEntry('success', `Météo: ${w}`) }}
            className="px-2 py-2 rounded-xl text-[10px] font-bold transition-all text-center"
            style={{
              background: weather === w ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
              color: weather === w ? '#60a5fa' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${weather === w ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)'}`,
            }}
          >
            {({ clear: '☀️', rain: '🌧️', snow: '❄️', fog: '🌫️', storm: '⛈️', blizzard: '🌬️' })[w]}
            <div className="mt-0.5">{w}</div>
          </button>
        ))}
      </div>

      <SectionHeader title="EFFETS" icon="✨" />

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Explosion', icon: '💥', color: '#ef4444', action: () => { const p = useStore.getState().playerPos; addAdminEffect('explosion', p, 'world', 3000); addEntry('success', 'Explosion!') } },
          { label: 'Spotlight', icon: '🔦', color: '#fbbf24', action: () => { const p = useStore.getState().playerPos; addAdminEffect('spotlight', [p[0], p[1] + 20, p[2]], 'player', 10000); addEntry('success', 'Spotlight ON') } },
          { label: 'Orage', icon: '⛈️', color: '#6366f1', action: () => { addAdminEffect('storm', [0, 50, 0], 'world', 30000); useStore.getState().setWeather?.('storm'); addEntry('success', 'Orage déclenché') } },
          { label: 'Blackout', icon: '🌑', color: '#1f2937', action: () => { addAdminEffect('blackout', [0, 0, 0], 'world', 15000); addEntry('warning', 'Blackout!') } },
        ].map(qa => (
          <QuickActionButton key={qa.label} {...qa} />
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// HOTEL TAB
// ════════════════════════════════════════════════════════════════════════════

function HotelTab({ addEntry }: { addEntry: (type: ConsoleEntry['type'], content: string) => void }) {
  const hotel = useHotelStore()

  return (
    <div className="p-4 overflow-y-auto h-full admin-scrollbar space-y-4">
      <SectionHeader title="CONTRÔLE HÔTEL" icon="🏨" />

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-2">
        <InfoCard label="Chambres" value={`${hotel.rooms?.filter(r => r.isOccupied).length || 0}/${hotel.rooms?.length || 0}`} icon="🛏️" />
        <InfoCard label="Alarme" value={hotel.masterAlarm ? '🚨 ON' : '✓ OFF'} icon="🔔" color={hotel.masterAlarm ? '#ef4444' : '#22c55e'} />
        <InfoCard label="Ascenseur" value={`Ét. ${hotel.elevator?.currentFloor ?? 0}`} icon="🛗" />
      </div>

      <SectionHeader title="PORTES" icon="🚪" />

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Ouvrir tout', icon: '🔓', color: '#22c55e', action: () => { hotel.openAllDoors?.(); addEntry('success', 'Toutes les portes ouvertes') } },
          { label: 'Fermer tout', icon: '🔒', color: '#ef4444', action: () => { hotel.closeAllDoors?.(); addEntry('success', 'Toutes les portes fermées') } },
        ].map(qa => (<QuickActionButton key={qa.label} {...qa} />))}
      </div>

      <SectionHeader title="ALARMES" icon="🚨" />

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Alarme ON', icon: '🚨', color: '#ef4444', action: () => { hotel.triggerAlarm?.('system', 'Test admin'); addEntry('warning', 'Alarme déclenchée') }, dangerous: true },
          { label: 'Alarme OFF', icon: '✓', color: '#22c55e', action: () => { hotel.resetAlarm?.(); addEntry('success', 'Alarme réinitialisée') } },
          { label: 'Incendie', icon: '🔥', color: '#f97316', action: () => { hotel.triggerFireAlarm?.(); addEntry('warning', 'ALARME INCENDIE') }, dangerous: true },
          { label: 'Confinement', icon: '🔒', color: '#dc2626', action: () => { hotel.activateLockdown?.('Test admin'); addEntry('warning', 'CONFINEMENT') }, dangerous: true },
        ].map(qa => (<QuickActionButton key={qa.label} {...qa} />))}
      </div>

      <SectionHeader title="CARTE D'ACCÈS" icon="🪪" />

      <div className="flex flex-wrap gap-1.5">
        {(['guest', 'resident', 'vip', 'admin'] as const).map(level => {
          const colors = { guest: '#6b7280', resident: '#3b82f6', vip: '#f59e0b', admin: '#ef4444' }
          return (
            <button
              key={level}
              onClick={() => { hotel.upgradeCard?.(level); addEntry('success', `Carte: ${level}`) }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{
                background: `${colors[level]}12`,
                color: colors[level],
                border: `1px solid ${colors[level]}30`,
              }}
            >
              {level.toUpperCase()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ITEMS TAB
// ════════════════════════════════════════════════════════════════════════════

function ItemsTab({ addEntry }: { addEntry: (type: ConsoleEntry['type'], content: string) => void }) {
  const SPAWN_ITEMS = [
    { id: 'cash-1000', name: '+1000$', icon: '💵', cat: 'currency' as const, rarity: 'common' as const, value: 1000, quantity: 1000 },
    { id: 'keycard-vip', name: 'Carte VIP', icon: '🌟', cat: 'key' as const, rarity: 'epic' as const, value: 5000, quantity: 1 },
    { id: 'keycard-admin', name: 'Carte Admin', icon: '👑', cat: 'key' as const, rarity: 'legendary' as const, value: 50000, quantity: 1 },
    { id: 'medkit', name: 'Kit Médical', icon: '🩹', cat: 'consumable' as const, rarity: 'rare' as const, value: 250, quantity: 3 },
    { id: 'lockpick', name: 'Crochet', icon: '🔧', cat: 'tool' as const, rarity: 'rare' as const, value: 100, quantity: 5 },
    { id: 'diamond', name: 'Diamant', icon: '💎', cat: 'currency' as const, rarity: 'legendary' as const, value: 25000, quantity: 1 },
    { id: 'radio', name: 'Radio', icon: '📻', cat: 'misc' as const, rarity: 'uncommon' as const, value: 350, quantity: 1 },
    { id: 'mask-cyber', name: 'Masque Cyber', icon: '🎭', cat: 'clothing' as const, rarity: 'epic' as const, value: 2500, quantity: 1 },
  ]

  const RARITY_COLORS: Record<string, string> = { common: '#9ca3af', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' }

  return (
    <div className="p-4 overflow-y-auto h-full admin-scrollbar space-y-4">
      <SectionHeader title="SPAWN OBJETS" icon="📦" />

      <div className="grid grid-cols-2 gap-2">
        {SPAWN_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => {
              const success = useStore.getState().addItem?.({
                id: item.id, name: item.name, description: `Spawné par admin`, icon: item.icon,
                category: item.cat, rarity: item.rarity, stackable: item.cat === 'currency',
                maxStack: item.cat === 'currency' ? 99999 : 1, quantity: item.quantity,
                weight: 0.1, value: item.value, usable: true, tradeable: true,
                dropable: true, questItem: false,
              })
              addEntry(success ? 'success' : 'error', success ? `+${item.quantity} ${item.name}` : 'Inventaire plein')
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02]"
            style={{
              background: `${RARITY_COLORS[item.rarity]}08`,
              borderColor: `${RARITY_COLORS[item.rarity]}20`,
            }}
          >
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-white truncate">{item.name}</div>
              <div className="text-[8px] uppercase tracking-wider" style={{ color: RARITY_COLORS[item.rarity] }}>
                {item.rarity} × {item.quantity}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <QuickActionButton label="Vider Inventaire" icon="🗑️" color="#ef4444" action={() => { useStore.getState().clearInventory?.(); addEntry('success', 'Inventaire vidé') }} dangerous />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ════════════════════════════════════════════════════════════════════════════

function SettingsTab() {
  const state = useStore()

  const toggles = [
    { label: 'HUD Visible', key: 'hudVisible', value: state.hudVisible },
    { label: 'Crosshair', key: 'crosshairVisible', value: state.crosshairVisible },
    { label: 'FPS Counter', key: 'fpsVisible', value: state.fpsVisible },
    { label: 'Mini-carte', key: 'minimapVisible', value: state.minimapVisible },
    { label: 'Mode God', key: 'isGodMode', value: state.isGodMode },
    { label: 'Mode Vol', key: 'flyMode', value: state.flyMode },
    { label: 'Mode Builder', key: 'buildMode', value: state.buildMode },
    { label: 'Grid Snap', key: 'gridSnap', value: state.gridSnap },
  ]

  return (
    <div className="p-4 overflow-y-auto h-full admin-scrollbar space-y-4">
      <SectionHeader title="AFFICHAGE" icon="👁️" />

      <div className="space-y-1.5">
        {toggles.map(t => (
          <div key={t.key} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-[11px] text-zinc-300">{t.label}</span>
            <button
              onClick={() => setGlobal({ [t.key]: !t.value } as any)}
              className="w-10 h-5 rounded-full relative transition-all"
              style={{
                background: t.value ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${t.value ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                style={{
                  left: t.value ? '20px' : '2px',
                  background: t.value ? '#22c55e' : '#555',
                }}
              />
            </button>
          </div>
        ))}
      </div>

      <SectionHeader title="PERFORMANCE" icon="📊" />

      <div className="space-y-2">
        <SliderSetting label="Shadow Quality" value={2048} min={256} max={4096} step={256} onChange={() => {}} />
        <SliderSetting label="Draw Distance" value={200} min={50} max={500} step={25} onChange={() => {}} />
        <SliderSetting label="FOV" value={55} min={45} max={90} step={5} onChange={() => {}} />
      </div>

      <SectionHeader title="DANGER ZONE" icon="⚠️" />

      <div className="grid grid-cols-2 gap-2">
        <QuickActionButton label="Reset localStorage" icon="🗑️" color="#ef4444" action={() => { localStorage.clear(); location.reload() }} dangerous />
        <QuickActionButton label="Reload" icon="🔄" color="#f59e0b" action={() => location.reload()} />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// LOGS TAB
// ════════════════════════════════════════════════════════════════════════════

function LogsTab() {
  const hotelLogs = useHotelStore(s => s.securityLogs)
  const [filter, setFilter] = useState<string>('all')

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return hotelLogs?.slice(0, 50) || []
    return (hotelLogs || []).filter(l => l.event.includes(filter) || l.severity === filter).slice(0, 50)
  }, [hotelLogs, filter])

  const severityColors = { info: '#60a5fa', warning: '#fbbf24', critical: '#ef4444' }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="px-4 py-2 border-b flex gap-1 flex-wrap" style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
        {['all', 'info', 'warning', 'critical'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-2 py-1 rounded text-[9px] font-bold transition-all"
            style={{
              background: filter === f ? 'rgba(20,184,166,0.12)' : 'transparent',
              color: filter === f ? '#5eead4' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${filter === f ? 'rgba(20,184,166,0.25)' : 'transparent'}`,
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => useHotelStore.getState().clearSecurityLogs?.()}
          className="ml-auto px-2 py-1 rounded text-[9px] font-bold text-zinc-500 hover:text-red-400 transition-colors"
        >
          Effacer
        </button>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto p-3 admin-scrollbar space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-xs">Aucun log</div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span className="text-zinc-600 shrink-0 w-12 text-right">
                {new Date(log.timestamp).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: severityColors[log.severity] || '#666' }} />
              <div className="flex-1 min-w-0">
                <span style={{ color: severityColors[log.severity] || '#d1d5db' }}>{log.details}</span>
                {log.doorId && <span className="text-zinc-600 ml-1">({log.doorId})</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS BAR
// ════════════════════════════════════════════════════════════════════════════

function AdminStatusBar() {
  const pos = useStore(s => s.playerPos)
  const timeOfDay = useStore(s => s.timeOfDay)
  const weather = useStore(s => s.weather)
  const [fps, setFps] = useState(60)

  useEffect(() => {
    let frames = 0; let lastTime = performance.now()
    const loop = () => {
      frames++; const now = performance.now()
      if (now - lastTime >= 1000) { setFps(frames); frames = 0; lastTime = now }
      requestAnimationFrame(loop)
    }
    const id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t text-[9px] font-mono" style={{ borderColor: 'rgba(239,68,68,0.08)', background: 'rgba(0,0,0,0.2)' }}>
      <div className="flex items-center gap-3 text-zinc-500">
        <span className="text-zinc-400">{fps} FPS</span>
        <span>|</span>
        <span>{pos[0].toFixed(0)},{pos[1].toFixed(0)},{pos[2].toFixed(0)}</span>
        <span>|</span>
        <span>{timeOfDay ?? 0}h</span>
        <span>|</span>
        <span>{weather ?? 'clear'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-zinc-500">ADMIN</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANTS UTILITAIRES
// ════════════════════════════════════════════════════════════════════════════

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm">{icon}</span>
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{title}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  )
}

function StatCard({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="rounded-xl p-2.5" style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-zinc-400">{icon} {label}</span>
        <span className="text-[10px] font-mono font-bold" style={{ color }}>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color, boxShadow: pct < 25 ? `0 0 6px ${color}50` : 'none' }} />
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="text-[8px] text-zinc-500 uppercase tracking-wider">{icon} {label}</div>
      <div className="text-[11px] font-bold mt-0.5" style={{ color: color || '#ffffff' }}>{value}</div>
    </div>
  )
}

function QuickActionButton({ label, icon, color, action, dangerous }: { label: string; icon: string; color: string; action: () => void; dangerous?: boolean }) {
  const [confirm, setConfirm] = useState(false)

  const handleClick = () => {
    if (dangerous && !confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 3000); return }
    action()
    setConfirm(false)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all hover:scale-[1.02]"
      style={{
        background: confirm ? 'rgba(239,68,68,0.15)' : `${color}10`,
        color: confirm ? '#ef4444' : color,
        border: `1px solid ${confirm ? 'rgba(239,68,68,0.3)' : `${color}25`}`,
      }}
    >
      <span>{confirm ? '⚠️' : icon}</span>
      <span>{confirm ? 'Confirmer?' : label}</span>
    </button>
  )
}

function SliderSetting({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const [val, setVal] = useState(value)
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-[10px] text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max} step={step} value={val}
          onChange={e => { setVal(Number(e.target.value)); onChange(Number(e.target.value)) }}
          className="w-20 h-1 rounded-full appearance-none bg-zinc-800 accent-indigo-500"
        />
        <span className="text-[9px] font-mono text-zinc-400 w-8 text-right">{val}</span>
      </div>
    </div>
  )
}