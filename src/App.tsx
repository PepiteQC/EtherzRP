/**
 * App.tsx — v3.5 Production
 * - Dashboard unifié et Agent IA connectés
 * - Phase unique de jeu : EtherWorld RP
 * - Raccourcis clavier (F12, F2, F3, Escape)
 * - Nettoyage des modes obsolètes (Kinect, V5 séparé)
 */

import { Game } from './components/etherworld'
import { HUD } from './components/HUD'
import CityIntro from './components/intro/CityIntro'
import IntroCinematicOverlay from './components/intro/CinematicOverlay'
import EtherworldDashboard from './components/dashboard/EtherworldDashboard'
import { loadCharacterProfile, type EtherworldCharacterProfile } from './components/dashboard/characterProfile'
import AdminConsole, { type AdminTool } from './admin/AdminConsole'
import { useStore } from '@/lib/etherworld/game-store'
import AuthContext from './context/AuthContext'
import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { loadSave, deleteSave, type SaveData } from './hooks/useSaveSystem'
import { getActiveJob, getState, subscribe, type ActiveJob } from './store/gameState'
import type { DoorZone } from './data/quebecBuildings'

// ─────────────────────────────────────────────
type Phase = 'menu' | 'game'

const OWNER_EMAILS = (import.meta.env.VITE_OWNER_EMAILS ?? 'pepiteqc@gmail.com,owner@etherworld.local')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean)

// Save chargée UNE SEULE FOIS au démarrage
const INITIAL_SAVE = loadSave()
// ─────────────────────────────────────────────

export default function App() {
  const auth = useContext(AuthContext)
  const playerProfile = useStore(s => s.playerProfile)
  const ownerId = auth.user?.uid ?? playerProfile?.id ?? 'local-player'
  const ownerEmail = auth.user?.email?.toLowerCase() ?? ''
  const isOwner = Boolean(
    auth.isAdmin ||
    playerProfile?.isAdmin ||
    playerProfile?.isModerator ||
    auth.user?.role === 'owner' ||
    auth.user?.role === 'admin' ||
    OWNER_EMAILS.includes(ownerEmail) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('etherzrp-owner') === 'true')
  )

  // ── UI State ──────────────────────────────────
  const [phase,          setPhase]          = useState<Phase>('menu')
  const [fade,           setFade]           = useState(false)
  const [siteIntroDone,  setSiteIntroDone]  = useState(() => {
    try { return sessionStorage.getItem('etherzrp-city-intro-seen') === '1' }
    catch { return false }
  })
  const [adminOpen,      setAdminOpen]      = useState(false)
  const [adminTool,      setAdminTool]      = useState<AdminTool | null>(null)

  // ── Game State ────────────────────────────────
  const [speed,          setSpeed]          = useState(0)
  const [zone,           setZone]           = useState('Québec — Route 138 Ouest')
  const [mode,           setMode]           = useState<'driving' | 'walking'>('driving')
  const [saveStatus,     setSaveStatus]     = useState<'saved' | 'saving' | 'idle'>('idle')
  const [money,          setMoney]          = useState(INITIAL_SAVE?.money ?? 2500)
  const [activeJob,      setActiveJob]      = useState<ActiveJob | null>(null)
  const [notification,   setNotification]   = useState<string | null>(null)
  const [nearBuilding,   setNearBuilding]   = useState<DoorZone | null>(null)
  const [interiorPrompt, setInteriorPrompt] = useState<string | null>(null)
  const [isInInterior,   setIsInInterior]   = useState(false)

  // ── Save State ────────────────────────────────
  const [activeSave,     setActiveSave]     = useState<SaveData | null>(null)
  const [isNewPlayer,    setIsNewPlayer]    = useState(false)
  const [characterProfile, setCharacterProfile] = useState<EtherworldCharacterProfile | null>(() => loadCharacterProfile(ownerId))
  const savedGame = INITIAL_SAVE

  // ── Refs ──────────────────────────────────────
  const prevMoneyRef = useRef(money)

  useEffect(() => {
    setCharacterProfile(loadCharacterProfile(ownerId))
  }, [ownerId])

  // ============================================================
  //  STORE SYNC
  // ============================================================
  useEffect(() => {
    const syncState = () => {
      const s = getState()
      setMoney(s.money)
      setActiveJob(getActiveJob())
    }
    syncState()
    return subscribe(syncState)
  }, [])

  // ── Notification fin de job ───────────────────
  useEffect(() => {
    if (!activeJob && money > prevMoneyRef.current) {
      const gained = money - prevMoneyRef.current
      setNotification(`+${gained.toLocaleString('fr-CA')}$ gagné !`)
      const t = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(t)
    }
    prevMoneyRef.current = money
  }, [activeJob, money])

  // ============================================================
  //  KEYBOARD SHORTCUTS
  // ============================================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'F12':
          e.preventDefault()
          setAdminOpen(prev => !prev)
          break
        case 'F2':
          e.preventDefault()
          setAdminOpen(true)
          setAdminTool('editor')
          break
        case 'F3':
          e.preventDefault()
          setAdminOpen(true)
          setAdminTool('agent')
          break
        case 'F4':
          e.preventDefault()
          setAdminOpen(true)
          setAdminTool('weather')
          break
        case 'Escape':
          if (adminOpen) setAdminOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [adminOpen])

  // ============================================================
  //  GLOBAL EVENTS
  // ============================================================
  useEffect(() => {
    const handleToggleAdmin = () => setAdminOpen(prev => !prev)
    const handleOpenEditor = () => {
      setAdminOpen(true)
      setAdminTool('editor')
    }
    const handleHudNotification = (e: CustomEvent) => {
      if (e.detail?.message) {
        setNotification(e.detail.message)
        setTimeout(() => setNotification(null), e.detail.duration || 4000)
      }
    }

    window.addEventListener('toggle-admin', handleToggleAdmin)
    window.addEventListener('open-editor', handleOpenEditor)
    window.addEventListener('hud-notification', handleHudNotification as EventListener)

    return () => {
      window.removeEventListener('toggle-admin', handleToggleAdmin)
      window.removeEventListener('open-editor', handleOpenEditor)
      window.removeEventListener('hud-notification', handleHudNotification as EventListener)
    }
  }, [])

  // ============================================================
  //  GAME START / TRANSITION
  // ============================================================
  const handleStart = useCallback((continueGame: boolean) => {
    if (continueGame && savedGame) {
      setActiveSave(savedGame)
      setIsNewPlayer(false)
      setZone(savedGame.zone ?? 'Québec — Route 138 Ouest')
      setMode(savedGame.mode ?? 'driving')
      setMoney(savedGame.money ?? 2500)
    } else {
      setActiveSave(null)
      setIsNewPlayer(true)
      setMoney(2500)
      setZone('Québec — Route 138 Ouest')
      setMode('driving')
    }

    setFade(true)
    setTimeout(() => setPhase('game'), 600)
    setTimeout(() => setFade(false), 900)
  }, [savedGame])

  const handleAdminClose = useCallback(() => {
    setAdminOpen(false)
    setAdminTool(null)
  }, [])

  const handleSiteIntroDone = useCallback(() => {
    try { sessionStorage.setItem('etherzrp-city-intro-seen', '1') } catch {}
    setSiteIntroDone(true)
  }, [])

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div style={{
      width:    '100vw',
      height:   '100vh',
      background: '#0a1628',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {!siteIntroDone && <CityIntro onDone={handleSiteIntroDone} />}

      {/* ── Fondu de transition ── */}
      <div style={{
        position:      'absolute',
        inset:         0,
        zIndex:        100,
        background:    '#000',
        opacity:       fade ? 1 : 0,
        transition:    'opacity 0.6s ease',
        pointerEvents: 'none',
      }} />

      {/* ════════════════════════════════════
          MENU PRINCIPAL (DASHBOARD)
          ════════════════════════════════════ */}
      {phase === 'menu' && (
        <EtherworldDashboard
          savedGame={savedGame}
          ownerId={ownerId}
          hasCharacter={Boolean(characterProfile)}
          isOwner={isOwner}
          onCharacterCreated={setCharacterProfile}
          onJoin={() => handleStart(Boolean(savedGame))}
          onOpenObjectCreator={() => {
            setAdminOpen(true)
            setAdminTool('objectCreator')
          }}
        />
      )}

      {/* ════════════════════════════════════
          JEU ETHERWORLD
          ════════════════════════════════════ */}
      {phase === 'game' && (
        <>
          {/* Canvas 3D */}
          <Game
            onSpeedChange={setSpeed}
            onZoneChange={setZone}
            onModeChange={setMode}
            onSaveStatus={setSaveStatus}
            onNearBuilding={setNearBuilding}
            onInteriorPrompt={setInteriorPrompt}
            onIsInInterior={setIsInInterior}
            initialSave={activeSave}
            isNewPlayer={isNewPlayer}
          />

          {/* HUD branché */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ pointerEvents: 'auto' }}>
              <HUD
                fps={60}
                entities={1247}
                mode={isInInterior ? 'spectator' : 'play'}
                weather="clear"
                health={100}
                armor={0}
                stamina={100}
                cash={money}
                bank={0}
                job={activeJob?.title ?? 'Citoyen'}
                rank={mode === 'driving' ? 'En véhicule' : 'À pied'}
                location={zone}
                sector={isInInterior ? 'Intérieur' : 'Extérieur'}
                destination={nearBuilding?.name ?? 'Route 138'}
                time={new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                vehicle={mode === 'driving' ? { name: 'Véhicule', speedKmh: Math.round(Math.abs(speed) * 180), fuel: 80, engineOn: true } : undefined}
                interaction={interiorPrompt ?? undefined}
                alerts={notification ? [notification] : []}
                isAdmin={isOwner || adminOpen}
              />
            </div>
          </div>

          {/* Cinématique d'introduction */}
          {isNewPlayer && <IntroCinematicOverlay />}
        </>
      )}

      {/* ════════════════════════════════════
          ADMIN CONSOLE (disponible partout)
          ════════════════════════════════════ */}
      <AdminConsole
        isOpen={adminOpen}
        onClose={handleAdminClose}
        activeTool={adminTool}
        onToolChange={(tool) => setAdminTool(tool)}
      />

    </div>
  )
}
