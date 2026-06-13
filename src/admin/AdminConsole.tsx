import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Edit3, Bot, Cloud, Target, Database, 
  Users, Shield, Zap, Play, Pause 
} from 'lucide-react'

// Sub Admin Tools (from Real-shit - enriched)
import EtherWorldEditor from './EtherWorld-Editor/EtherWorldEditor'
import EtherWorldAgent from './EtherWorld-Agent/EtherWorldAgent'
import WeatherSystemComplex from './Weather-System-Complex/WeatherSystemComplex'
import TransformToolbar from './TransformToolbar'
import Crosshair from './Crosshair'
import Keypad from './Keypad'
import StartupScreen from './StartupScreen'

// Types
export type AdminTool = 
  | 'editor' 
  | 'agent' 
  | 'weather' 
  | 'transform' 
  | 'catalog' 
  | 'client' 
  | 'core' 
  | 'stats'

interface AdminConsoleProps {
  isOpen: boolean
  onClose: () => void
  activeTool?: AdminTool | null
  onToolChange?: (tool: AdminTool | null) => void
}

export default function AdminConsole({ 
  isOpen, 
  onClose, 
  activeTool = null,
  onToolChange 
}: AdminConsoleProps) {
  const [currentTab, setCurrentTab] = useState<AdminTool>(activeTool || 'stats')
  const [isPaused, setIsPaused] = useState(false)
  const [sceneStats, setSceneStats] = useState({
    objects: 1247,
    vehicles: 18,
    agents: 7,
    particles: 2840,
    drawCalls: 312,
    memory: 184
  })

  // Sync with parent
  useEffect(() => {
    if (activeTool) setCurrentTab(activeTool)
  }, [activeTool])

  // Live stats (enriched simulation)
  useEffect(() => {
    if (!isOpen || isPaused) return

    const interval = setInterval(() => {
      setSceneStats(prev => ({
        objects: Math.max(800, Math.min(2800, prev.objects + Math.floor((Math.random() - 0.5) * 14))),
        vehicles: Math.max(4, Math.min(42, prev.vehicles + Math.floor((Math.random() - 0.5) * 2))),
        agents: Math.max(1, Math.min(23, prev.agents + (Math.random() > 0.85 ? 1 : 0))),
        particles: Math.max(1200, Math.min(5200, prev.particles + Math.floor((Math.random() - 0.5) * 90))),
        drawCalls: Math.max(180, Math.min(480, prev.drawCalls + Math.floor((Math.random() - 0.5) * 9))),
        memory: Math.max(120, Math.min(290, prev.memory + Math.floor((Math.random() - 0.5) * 5)))
      }))
    }, 900)

    return () => clearInterval(interval)
  }, [isOpen, isPaused])

  const tabs: { id: AdminTool; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'stats', label: 'STATISTIQUES', icon: <Target className="w-4 h-4" />, color: '#00f5ff' },
    { id: 'editor', label: 'ÉDITEUR 3D', icon: <Edit3 className="w-4 h-4" />, color: '#ff00aa' },
    { id: 'agent', label: 'AGENT IA', icon: <Bot className="w-4 h-4" />, color: '#a855f7' },
    { id: 'weather', label: 'MÉTÉO COMPLEXE', icon: <Cloud className="w-4 h-4" />, color: '#3b82f6' },
    { id: 'transform', label: 'TRANSFORM', icon: <Zap className="w-4 h-4" />, color: '#f59e0b' },
    { id: 'catalog', label: 'CATALOGUE', icon: <Database className="w-4 h-4" />, color: '#10b981' },
    { id: 'client', label: 'CLIENT', icon: <Users className="w-4 h-4" />, color: '#ec4899' },
    { id: 'core', label: 'CORE', icon: <Shield className="w-4 h-4" />, color: '#8b5cf6' },
  ]

  const handleTabClick = (tab: AdminTool) => {
    setCurrentTab(tab)
    onToolChange?.(tab)
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'editor':
        return <EtherWorldEditor />
      
      case 'agent':
        return <EtherWorldAgent context={{ weather: 'clear', entities: sceneStats.objects }} />
      
      case 'weather':
        return <WeatherSystemComplex preset="clear" advancedControls />
      
      case 'transform':
        return <div className="p-8 text-center text-white/60">Transform Toolbar actif. Sélectionnez un objet dans la scène 3D.</div>
      
      case 'catalog':
        return (
          <div className="grid grid-cols-3 gap-4 p-6">
            {['Hôtel Ultra', 'Dépanneur', 'Station Essence', 'Police Car', 'Arbre Arcane', 'Route 138 Sign'].map((item, i) => (
              <div key={i} className="glass-panel p-4 hover:border-white/40 cursor-pointer transition-all text-sm"
                   onClick={() => window.dispatchEvent(new CustomEvent('spawn-object', { detail: { type: item }}))}>
                {item}
              </div>
            ))}
          </div>
        )
      
      case 'client':
        return <div className="p-8">Client Multiplayer • 14 connexions • Ping: 28ms</div>
      
      case 'core':
        return <div className="p-8">Core Systems Status: Physics, Rendering, AI, Audio → Tous OK</div>
      
      default:
        return (
          <div className="p-8">
            <div className="flex justify-between mb-8">
              <div>
                <div className="text-3xl font-bold tracking-tighter">ETHERWORLD v2.0</div>
                <div className="text-white/50">Fusion Real-shit × Official PC</div>
              </div>
              <button onClick={() => setIsPaused(!isPaused)} className="flex items-center gap-2 px-4 py-2 rounded bg-white/10">
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Reprendre' : 'Pause'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {Object.entries(sceneStats).map(([key, value]) => (
                <div key={key} className="glass-panel p-5">
                  <div className="text-xs text-white/60 uppercase tracking-widest mb-1">{key}</div>
                  <div className="text-4xl font-mono font-bold">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="admin-console w-full max-w-[1280px] h-[88vh] flex flex-col bg-[#0a001f] border-2 border-[#ff00aa] rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#1a0033] border-b border-[#ff00aa]/50">
            <div className="flex items-center gap-3">
              <div className="font-black text-2xl tracking-[-1.5px]">ETHERWORLD</div>
              <div className="text-xs px-3 py-0.5 rounded-full bg-white/10">v2.0 FUSION</div>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-3 py-2 bg-[#0f001f] border-b border-white/10 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${currentTab === tab.id ? 'bg-white text-black' : 'hover:bg-white/10'}`}
                style={currentTab === tab.id ? { backgroundColor: tab.color, color: 'white' } : {}}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-2">
            {renderContent()}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 text-xs border-t border-white/10 bg-[#0f001f] flex justify-between text-white/50">
            <div>Real-shit tools intégrés • EtherWorld v2.0</div>
            <div>ESC pour fermer • F2 = Editor • F3 = Agent • F4 = Weather</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
