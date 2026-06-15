import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Bot,
  Building2,
  ChevronRight,
  CircleDot,
  Compass,
  Cpu,
  DoorOpen,
  Gauge,
  Hotel,
  MapPin,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  Wallet,
  Wand2,
} from 'lucide-react'
import type { SaveData } from '../../hooks/useSaveSystem'
import { loadCharacterProfile, saveCharacterProfile, type EtherworldCharacterProfile } from './characterProfile'
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

const OPERATIONS = [
  {
    id: 'hotel',
    title: 'Hôtel EtherWorld',
    subtitle: '30 chambres · portes · locks · accès staff',
    icon: Hotel,
    tone: 'from-violet-500/20 to-cyan-500/10 border-violet-400/25',
  },
  {
    id: 'store',
    title: 'Dépanneur RP',
    subtitle: 'stockage · ventes · sécurité · livraisons',
    icon: Store,
    tone: 'from-emerald-500/20 to-cyan-500/10 border-emerald-400/25',
  },
  {
    id: 'security',
    title: 'Sécurité bâtiments',
    subtitle: 'journal immuable · permissions · statuts archivés',
    icon: ShieldCheck,
    tone: 'from-amber-500/20 to-rose-500/10 border-amber-400/25',
  },
]

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ElementType }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/20 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/50">{detail}</p>
    </div>
  )
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

  const { activeAgents, spawnAgent } = useAgentStore()

  const profile = useMemo(() => loadCharacterProfile(ownerId), [ownerId, creatorOpen, hasCharacter])
  const money = (savedGame?.money ?? 2500).toLocaleString('fr-CA')
  const lastZone = savedGame?.zone ?? 'Québec — Route 138 Ouest'

  const handleCreate = () => {
    const cleanName = name.trim() || 'Citoyen EtherWorld'
    const createdProfile = saveCharacterProfile(ownerId, { name: cleanName, origin, style })
    onCharacterCreated(createdProfile)
    setCreatorOpen(false)
  }

  const deployExpertAgent = () => {
    spawnAgent({
      type: 'explorer',
      position: [(Math.random() - 0.5) * 80, 5, 900 + (Math.random() - 0.5) * 80],
      status: 'exploring',
      energy: Math.floor(Math.random() * 30) + 70,
    })
  }

  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-[#040713] text-white font-sans selection:bg-cyan-400/30">
      <EtherworldDashboardScene />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_70%_0%,rgba(139,92,246,0.24),transparent_38%),linear-gradient(180deg,rgba(2,6,23,0.30),rgba(2,6,23,0.92))]" />

      <header className="relative z-20 flex h-20 items-center justify-between border-b border-white/10 bg-slate-950/45 px-6 backdrop-blur-xl lg:px-10">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
            <Building2 className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-[0.22em] text-white">ETHERWORLD</h1>
              <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-black text-violet-200">RP QC</span>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Centre expert · Agent · Bâtiments · Ville</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300 md:flex">
            <CircleDot className="h-3.5 w-3.5 animate-pulse" />
            Serveur actif
          </div>
          {isOwner && (
            <button
              onClick={onOpenObjectCreator}
              className="rounded-full border border-indigo-400/35 bg-indigo-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-200 transition hover:bg-indigo-400/20"
            >
              Éditeur d'objets
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 grid h-[calc(100vh-5rem)] gap-5 overflow-y-auto p-5 lg:grid-cols-[1.1fr_0.9fr] lg:p-8 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="flex min-h-0 flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[2rem] border border-white/10 bg-slate-950/62 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl lg:p-8"
          >
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Dashboard expert</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Inspiré SaaS / v0</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Sans Kinect Demo</span>
            </div>

            <h2 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white md:text-6xl xl:text-7xl">
              Centre de contrôle RP Québec pour lancer, surveiller et bâtir EtherWorld.
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/58 md:text-base">
              Une seule entrée propre : profil joueur, lancement ville, agent IA, bâtiments, hôtel, dépanneur et sécurité. L'ancien esprit “démo” est retiré; cette page devient la vraie base premium du projet.
            </p>

            <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Capital" value={`${money}$`} detail="État sauvegardé ou démarrage civil." icon={Wallet} />
              <StatCard label="Zone" value="Route 138" detail={lastZone} icon={MapPin} />
              <StatCard label="Agents" value={String(activeAgents.length)} detail="Agents IA terrain actifs." icon={Bot} />
              <StatCard label="Bâtiments" value="2+" detail="Hôtel + dépanneur prêts à brancher." icon={DoorOpen} />
            </div>
          </motion.div>

          <div className="grid gap-5 xl:grid-cols-3">
            {OPERATIONS.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.id} className={`rounded-[1.7rem] border bg-gradient-to-br ${item.tone} p-5 shadow-2xl shadow-black/20 backdrop-blur-xl`}>
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-black/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/30" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{item.subtitle}</p>
                </article>
              )
            })}
          </div>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/62 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Agents terrain</p>
                <h3 className="mt-1 text-xl font-black">Console IA opérationnelle</h3>
              </div>
              <button onClick={deployExpertAgent} className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-400/20">
                Déployer agent
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activeAgents.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/45 xl:col-span-3">
                  Aucun agent autonome déployé. Clique sur “Déployer agent” pour tester la couche EtherWorld-Agent dans le dashboard principal.
                </div>
              ) : (
                activeAgents.slice(0, 6).map((agent) => (
                  <div key={agent.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-mono text-xs text-cyan-300"><Cpu className="h-3.5 w-3.5" />{agent.id.slice(0, 10)}</span>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">{agent.energy}%</span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/40">{agent.status}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>

        <aside className="flex min-h-0 flex-col gap-5">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <AnimatePresence mode="wait">
              {creatorOpen ? (
                <motion.div key="creator" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Création citoyen</p>
                    <h3 className="mt-1 text-2xl font-black">Identité RP</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">Crée le profil avant d'entrer dans la ville.</p>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Nom</span>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Maxime Tremblay"
                      maxLength={32}
                    />
                  </label>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Origine</span>
                    <div className="flex flex-wrap gap-2">
                      {ORIGINS.map((item) => (
                        <button key={item} onClick={() => setOrigin(item)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${origin === item ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-white/55 hover:text-white'}`}>{item}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Métier d'origine</span>
                    <div className="flex flex-wrap gap-2">
                      {STYLES.map((item) => (
                        <button key={item.id} onClick={() => setStyle(item.id)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${style === item.id ? 'border-violet-300 bg-violet-400/15 text-violet-100' : 'border-white/10 bg-white/[0.04] text-white/55 hover:text-white'}`}>{item.label}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleCreate} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-cyan-500/15 transition hover:scale-[1.01]">
                    <Plus className="h-4 w-4" /> Enregistrer le personnage
                  </button>
                </motion.div>
              ) : (
                <motion.div key="player" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-2xl shadow-cyan-500/20">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Compte RP actif</p>
                        <h3 className="text-xl font-black">{profile?.name || 'Citoyen EtherWorld'}</h3>
                      </div>
                    </div>
                    <button onClick={() => setCreatorOpen(true)} className="text-xs font-bold text-white/35 transition hover:text-cyan-300">Modifier</button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <MapPin className="mb-2 h-4 w-4 text-cyan-300" />
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Origine</p>
                      <p className="mt-1 truncate text-xs font-bold">{profile?.origin || 'Non défini'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <Activity className="mb-2 h-4 w-4 text-violet-300" />
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Style</p>
                      <p className="mt-1 truncate text-xs font-bold capitalize">{profile?.style || 'civil'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <Gauge className="mb-2 h-4 w-4 text-emerald-300" />
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Save</p>
                      <p className="mt-1 truncate text-xs font-bold">{savedGame ? 'Active' : 'Nouvelle'}</p>
                    </div>
                  </div>

                  <button onClick={onJoin} className="group flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-600 px-5 py-5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-cyan-500/20 transition hover:scale-[1.01] hover:shadow-cyan-500/35">
                    <Play className="h-4 w-4 fill-current transition group-hover:translate-x-1" />
                    Rejoindre EtherWorld RP
                  </button>
                  {savedGame && <p className="text-center text-[10px] uppercase tracking-[0.18em] text-white/35">Reprendre · {savedGame.zone ?? 'Route 138'}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <Wand2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Mission IA</p>
                <h3 className="font-black">Plan de construction</h3>
              </div>
            </div>
            <div className="space-y-3 text-sm leading-6 text-white/55">
              <p>1. Garder cette page comme entrée unique du projet.</p>
              <p>2. Brancher les vrais registres hôtel/dépanneur dans les cartes.</p>
              <p>3. Garder les commandes sensibles côté serveur seulement.</p>
              <p>4. Remplacer les anciennes pages dashboard par des panneaux internes.</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex items-center gap-3 text-sm text-white/55">
              <Compass className="h-4 w-4 text-cyan-300" />
              <span>Québec · Portneuf · Route 138 · Hôtel · Dépanneur</span>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
