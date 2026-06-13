import React from 'react'
import { motion } from 'framer-motion'
import { 
  Car, Users, ThermometerSun, Zap, 
  Shield, Target, Clock, MapPin 
} from 'lucide-react'

interface HUDProps {
  fps: number
  entities: number
  mode: 'play' | 'editor' | 'spectator'
  weather: string
}

export function HUD({ fps, entities, mode, weather }: HUDProps) {
  const weatherIcon = {
    clear: <ThermometerSun className="w-4 h-4" />,
    rain: <div className="text-blue-400">🌧</div>,
    snow: <div className="text-white">❄</div>,
    storm: <div className="text-purple-400">⛈</div>,
    fog: <div className="text-gray-400">🌫</div>,
  }[weather] || <ThermometerSun className="w-4 h-4" />

  return (
    <>
      {/* Top Center - Status Bar */}
      <div className="hud hud-top">
        <div className="glass-panel flex items-center gap-8 px-8 py-3">
          {/* FPS & Performance */}
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-emerald-400">{fps}</span>
            <span className="text-white/50">FPS</span>
          </div>

          {/* Entities */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-sky-400" />
            <span className="font-mono">{entities.toLocaleString()}</span>
            <span className="text-white/50">ENTITÉS</span>
          </div>

          {/* Weather */}
          <div className="flex items-center gap-2 text-sm border-l border-white/20 pl-6">
            {weatherIcon}
            <span className="uppercase tracking-widest text-xs text-white/70">{weather}</span>
          </div>

          {/* Mode */}
          <div className="flex items-center gap-2 text-sm border-l border-white/20 pl-6">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="font-medium tracking-wider text-amber-400">{mode.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Bottom Center - Controls */}
      <div className="hud hud-bottom">
        <div className="glass-panel flex items-center gap-3 px-5 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-white/70">
            <span className="font-mono bg-white/10 px-1.5 py-px rounded">WASD</span>
            <span>Move</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5 text-white/70">
            <span className="font-mono bg-white/10 px-1.5 py-px rounded">SPACE</span>
            <span>Jump</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5 text-white/70">
            <span className="font-mono bg-white/10 px-1.5 py-px rounded">E</span>
            <span>Interact</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5 text-white/70">
            <span className="font-mono bg-white/10 px-1.5 py-px rounded">`</span>
            <span>Admin</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="font-mono bg-rose-500/20 px-1.5 py-px rounded">F2</span>
            <span>Editor</span>
          </div>
        </div>
      </div>

      {/* Left Side - Player Status */}
      <div className="hud hud-left">
        <div className="glass-panel w-56 space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/60">SANTÉ</span>
              <span className="font-mono text-emerald-400">100</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-emerald-500" />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/60">ENDURANCE</span>
              <span className="font-mono text-amber-400">87</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-[87%] bg-gradient-to-r from-amber-400 to-yellow-500" />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-white/50">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> 
              <span>PROTÉGÉ</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> 
              <span>14:32</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Location & Quick Actions */}
      <div className="hud hud-right">
        <div className="glass-panel w-52 space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-rose-400" />
            <div>
              <div className="font-medium">Route 138 • Québec</div>
              <div className="text-[10px] text-white/50 -mt-0.5">Secteur Baie-Comeau</div>
            </div>
          </div>
          
          <div className="text-[10px] text-white/60 pl-6">
            Prochain arrêt : <span className="text-white">Hôtel Ultra</span>
          </div>
          
          <div className="pt-1 border-t border-white/10 flex gap-2 text-[10px]">
            <div className="px-3 py-1 bg-white/5 rounded flex-1 text-center">VÉHICULE DISPONIBLE</div>
          </div>
        </div>
      </div>

      {/* Bottom Right - Quick Admin Access */}
      <div className="fixed bottom-6 right-6 z-[150] flex flex-col gap-2 text-xs">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new CustomEvent('open-editor'))}
          className="glass-panel px-4 py-2 flex items-center gap-2 text-xs hover:border-[#ff00aa] hover:text-[#ff00aa] transition-all"
        >
          <Car className="w-3.5 h-3.5" /> EDITOR
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-admin'))}
          className="glass-panel px-4 py-2 flex items-center gap-2 text-xs hover:border-[#00f5ff] hover:text-[#00f5ff] transition-all"
        >
          <Target className="w-3.5 h-3.5" /> CONSOLE ADMIN
        </motion.button>
      </div>
    </>
  )
}
