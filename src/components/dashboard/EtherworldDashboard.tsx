import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, Send, User, Wallet, MapPin, Activity, 
  Sparkles, Play, ShieldAlert, Cloud, HelpCircle,
  Terminal, Server, CircleDot, Cpu, Compass
} from 'lucide-react'
import type { SaveData } from '../../hooks/useSaveSystem'
import { saveCharacterProfile, type EtherworldCharacterProfile } from './characterProfile'
import EtherworldDashboardScene from './EtherworldDashboardScene'
import { useAgentStore } from '@/admin/EtherWorld-Agent/useAgentStore'

interface EtherworldDashboardProps {
  savedGame: SaveData | null
  ownerId: string
  hasCharacter: boolean
  isOwner: boolean
  onCharacterCreated: (profile: EtherworldCharacterProfile) => void
  onJoin: () => void
  onOpenObjectCreator: () => void
}

const ORIGINS: EtherworldCharacterProfile['origin'][] = ['Portneuf', 'Québec', 'Trois-Rivières', 'Côte-Nord', 'Montréal', 'Autre']
const STYLES: Array<{ id: EtherworldCharacterProfile['style']; label: string }> = [
  { id: 'civil', label: 'Civil' },
  { id: 'travailleur', label: 'Travailleur' },
  { id: 'police', label: 'Police' },
  { id: 'medic', label: 'Medic' },
  { id: 'mecano', label: 'Mécano' },
]

interface Message {
  sender: 'ai' | 'user'
  text: string
  timestamp: string
}

export default function EtherworldDashboard({
  savedGame,
  ownerId,
  hasCharacter,
  isOwner,
  onCharacterCreated,
  onJoin,
  onOpenObjectCreator,
}: EtherworldDashboardProps) {
  const [creatorOpen, setCreatorOpen] = useState(!hasCharacter)
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState<EtherworldCharacterProfile['origin']>('Portneuf')
  const [style, setStyle] = useState<EtherworldCharacterProfile['style']>('civil')
  
  // Agent State
  const [chatInput, setChatInput] = useState('')
  const { activeAgents, spawnAgent } = useAgentStore()
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Console d\'Agent EtherWorld v2.5 opérationnelle. Je suis prêt à recevoir vos commandes de simulation (climat, anomalies, déploiement d\'agents).',
      timestamp: new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    }
  ])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleCreate = () => {
    const cleanName = name.trim() || 'Citoyen EtherWorld'
    const profile = saveCharacterProfile(ownerId, { name: cleanName, origin, style })
    onCharacterCreated(profile)
    setCreatorOpen(false)
  }

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return
    
    const timeStr = new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
    
    // Ajout du message utilisateur
    setMessages(prev => [...prev, { sender: 'user', text, timestamp: timeStr }])
    
    const cmd = text.toLowerCase()
    let reply = ''
    
    if (cmd.includes('pluie') || cmd.includes('rain')) {
      window.dispatchEvent(new CustomEvent('set-weather', { detail: { preset: 'rain' } }))
      reply = 'Modification climatique en cours : Activation de la pluie sur la ville. 🌧'
    } else if (cmd.includes('neige') || cmd.includes('snow')) {
      window.dispatchEvent(new CustomEvent('set-weather', { detail: { preset: 'snow' } }))
      reply = 'Modification climatique en cours : Déclenchement de la neige. ❄'
    } else if (cmd.includes('beau') || cmd.includes('clear') || cmd.includes('soleil') || cmd.includes('jour')) {
      window.dispatchEvent(new CustomEvent('set-weather', { detail: { preset: 'clear' } }))
      reply = 'Modification climatique en cours : Retour des conditions claires et ensoleillées. ☀'
    } else if (cmd.includes('brouillard') || cmd.includes('fog')) {
      window.dispatchEvent(new CustomEvent('set-weather', { detail: { preset: 'fog' } }))
      reply = 'Modification climatique en cours : Lancement du brouillard dense. 🌫'
    } else if (cmd.includes('spawn') || cmd.includes('agent')) {
      const match = cmd.match(/\d+/)
      const count = match ? parseInt(match[0]) : 1
      for (let i = 0; i < count; i++) {
        spawnAgent({
          type: 'explorer',
          position: [(Math.random() - 0.5) * 80, 5, 900 + (Math.random() - 0.5) * 80],
          status: 'exploring',
          energy: Math.floor(Math.random() * 30) + 70
        })
      }
      reply = `Déploiement réseau réussi : ${count} agent(s) explorateur(s) actif(s) sur le serveur. 🤖`
    } else if (cmd.includes('explosion') || cmd.includes('arcane')) {
      window.dispatchEvent(new CustomEvent('arcane-tree-explosion'))
      reply = 'ALERTE RÉSEAU : Onde d\'énergie libérée ! Déclenchement immédiat de l\'explosion de l\'arbre d\'arcane ! 💥'
    } else {
      reply = 'Commande non reconnue par le protocole. Essayez : "fais pleuvoir", "fais neiger", "beau temps", "spawn 3 agents" ou "arcane explosion".'
    }
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
      }])
    }, 500)
  }

  const submitChat = () => {
    if (!chatInput.trim()) return
    handleSendMessage(chatInput)
    setChatInput('')
  }

  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-[#050711] text-white flex flex-col font-sans select-none">
      {/* 3D Scene Background */}
      <EtherworldDashboardScene />
      
      {/* Top Header Menu */}
      <header className="relative w-full h-16 flex items-center justify-between px-8 z-20 bg-gradient-to-b from-[#050711]/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
            ETHERWORLD <span className="text-xs font-bold px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-950/40">V5.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs text-emerald-400">
            <CircleDot className="w-3.5 h-3.5 animate-pulse" />
            <span>Serveur Actif</span>
          </div>
          {isOwner && (
            <button 
              onClick={onOpenObjectCreator}
              className="px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-xs font-bold text-indigo-300 hover:bg-indigo-500/35 transition cursor-pointer"
            >
              ÉDITEUR D'OBJETS
            </button>
          )}
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="relative flex-1 flex flex-col lg:flex-row gap-6 p-6 lg:p-8 z-10 items-stretch justify-between overflow-hidden">
        
        {/* Left Info Panel */}
        <div className="flex flex-col gap-5 w-full lg:w-96 justify-between pointer-events-auto">
          {/* Server Info Card */}
          <div className="backdrop-blur-md bg-slate-950/65 border border-slate-800/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold tracking-wider uppercase">
              <Server className="w-4.5 h-4.5" />
              <span>Statistiques Live</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-white/40 text-[10px] uppercase tracking-wider">Citoyens RP</span>
                <span className="text-lg font-bold">12 847</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-white/40 text-[10px] uppercase tracking-wider">Agents Actifs</span>
                <span className="text-lg font-bold text-cyan-400">{activeAgents.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-white/40 text-[10px] uppercase tracking-wider">Zone principale</span>
                <span className="text-xs font-semibold text-white/90 truncate">Route 138 / Québec</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                <span className="text-white/40 text-[10px] uppercase tracking-wider">Statut</span>
                <span className="text-xs font-semibold text-emerald-400">15ms latency</span>
              </div>
            </div>

            {/* List of Simulated Agents */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-white/40 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Rapport des Agents sur le terrain</span>
              </span>
              <div className="max-h-28 overflow-y-auto pr-1 flex flex-col gap-1.5 text-xs font-mono text-white/70">
                {activeAgents.length === 0 ? (
                  <div className="text-white/30 italic p-1 bg-white/2 rounded">Aucun agent autonome déployé. Utilisez la console à droite pour en invoquer.</div>
                ) : (
                  activeAgents.map((agent) => (
                    <div key={agent.id} className="flex justify-between items-center bg-white/5 border border-white/5 p-2 rounded-xl">
                      <span className="text-cyan-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {agent.id.slice(0, 9)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-300">
                        {agent.status} ({agent.energy}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Info & Credits */}
          <div className="hidden lg:flex backdrop-blur-md bg-slate-950/40 border border-slate-900/60 rounded-3xl p-5 flex-col gap-2 text-xs text-white/50">
            <div className="font-bold text-white/70 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Projet Unique : EtherWorld RP
            </div>
            <p className="leading-relaxed">
              Explorez la ville d'EtherWorld et les tronçons de la Route 138 du Québec en voiture ou à pied. Contrôlez l'environnement à l'aide de l'Agent IA.
            </p>
          </div>
        </div>

        {/* Right Dashboard Container: Player + AI Agent Panel */}
        <div className="flex-1 max-w-2xl w-full flex flex-col gap-5 justify-between pointer-events-auto">
          
          {/* Identity & Launch Controls */}
          <div className="backdrop-blur-md bg-slate-950/65 border border-slate-800/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            
            <AnimatePresence mode="wait">
              {creatorOpen ? (
                // Character Creation Panel
                <motion.div 
                  key="char-creator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] tracking-wider text-cyan-400 font-bold uppercase">Création de Citoyen</span>
                      <h2 className="text-xl font-bold">Nouveau Personnage RP</h2>
                    </div>
                    {hasCharacter && (
                      <button onClick={() => setCreatorOpen(false)} className="text-white/40 hover:text-white text-xs">Annuler</button>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-3.5 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase text-white/50 tracking-wider font-bold">Nom et Prénom</label>
                      <input 
                        className="bg-slate-900/85 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-cyan-500/60 transition text-white" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ex: Maxime Tremblay"
                        maxLength={32}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase text-white/50 tracking-wider font-bold">Origine</label>
                      <div className="flex flex-wrap gap-2">
                        {ORIGINS.map(o => (
                          <button 
                            key={o} 
                            onClick={() => setOrigin(o)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                              origin === o 
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
                                : 'bg-slate-900/60 border-slate-800 text-white/60 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase text-white/50 tracking-wider font-bold">Métier d'origine</label>
                      <div className="flex flex-wrap gap-2">
                        {STYLES.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => setStyle(s.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                              style === s.id 
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' 
                                : 'bg-slate-900/60 border-slate-800 text-white/60 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleCreate}
                      className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold tracking-wider hover:opacity-90 transition cursor-pointer uppercase text-xs"
                    >
                      Enregistrer le personnage
                    </button>
                  </div>
                </motion.div>
              ) : (
                // Player Info Panel & Join Game
                <motion.div 
                  key="play-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/10">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-[10px] tracking-wider text-cyan-400 font-bold uppercase">Compte RP actif</div>
                        <h2 className="text-lg font-bold">{loadCharacterProfile(ownerId)?.name || 'Citoyen'}</h2>
                      </div>
                    </div>
                    <button 
                      onClick={() => setCreatorOpen(true)}
                      className="text-xs text-white/40 hover:text-cyan-400 transition cursor-pointer"
                    >
                      Modifier profil
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Origine
                      </span>
                      <span className="text-xs font-semibold text-white/90">{loadCharacterProfile(ownerId)?.origin || 'Non défini'}</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> Spécialité
                      </span>
                      <span className="text-xs font-semibold text-white/90 capitalize">{loadCharacterProfile(ownerId)?.style || 'Non défini'}</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-3 flex flex-col gap-1">
                      <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" /> Capital
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">{(savedGame?.money ?? 2500).toLocaleString('fr-CA')}$</span>
                    </div>
                  </div>

                  {/* Main Single Join Button */}
                  <div className="flex flex-col gap-2 mt-2">
                    <button 
                      onClick={onJoin}
                      className="group w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600 text-white font-black tracking-widest text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.01] transition duration-200 cursor-pointer flex items-center justify-center gap-2 uppercase shadow-lg shadow-cyan-500/10"
                    >
                      <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition" />
                      <span>Rejoindre la Ville RP (EtherWorld)</span>
                    </button>
                    {savedGame && (
                      <div className="text-center text-[10px] text-white/40 tracking-wider">
                        Reprendre la partie sauvegardée · {savedGame.zone ?? 'Route 138'}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Etherworld Agent AI Chat Console */}
          <div className="backdrop-blur-md bg-slate-950/65 border border-slate-800/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 flex-1 overflow-hidden min-h-[280px]">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-white">CONTRÔLEUR IA ETHERWORLD</h3>
                  <p className="text-[9px] text-white/40 uppercase">Assistance Réseau & Environnement</p>
                </div>
              </div>
              <div className="text-[10px] text-cyan-400/80 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                PROTOCLE EN LIGNE
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 text-xs p-2 rounded-2xl bg-slate-950/45 border border-slate-900/60 min-h-[120px]">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex gap-2.5 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-cyan-950 border border-cyan-500/30 text-cyan-400'
                  }`}>
                    {msg.sender === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className={`p-2.5 rounded-2xl ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600/20 border border-blue-500/20 text-blue-100 rounded-tr-none' 
                      : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <span className="block mt-1 text-[8px] text-white/30 text-right">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Predefined Action Chips */}
            <div className="flex flex-wrap gap-1.5 py-1">
              <button 
                onClick={() => handleSendMessage('Fais pleuvoir')}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 text-[10px] font-semibold text-white/60 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1"
              >
                🌧 Pluie
              </button>
              <button 
                onClick={() => handleSendMessage('Fais neiger')}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 text-[10px] font-semibold text-white/60 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1"
              >
                ❄ Neige
              </button>
              <button 
                onClick={() => handleSendMessage('Beau temps')}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 text-[10px] font-semibold text-white/60 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1"
              >
                ☀ Beau Temps
              </button>
              <button 
                onClick={() => handleSendMessage('Spawn 1 agent')}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 text-[10px] font-semibold text-white/60 hover:text-cyan-300 transition cursor-pointer flex items-center gap-1"
              >
                🤖 Déployer Agent
              </button>
              <button 
                onClick={() => handleSendMessage('Déclenche arcane explosion')}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-[10px] font-semibold text-white/60 hover:text-red-300 transition cursor-pointer flex items-center gap-1"
              >
                💥 Explosion d'Arcane
              </button>
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitChat()}
                placeholder="Discutez avec l'agent ou ordonnez une commande..."
                className="flex-1 bg-slate-950/85 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-cyan-500/50 transition text-white"
              />
              <button 
                onClick={submitChat}
                className="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-[#050711] flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
