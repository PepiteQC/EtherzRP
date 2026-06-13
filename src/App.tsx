/**
 * App.tsx — v3.0 Production
 * - Nouveau HUD connecté
 * - Events système (toggle-admin, open-editor, hud-notification)
 * - Raccourcis clavier complets (F2, F3, F12, Escape)
 * - Transition de phase propre
 * - AdminConsole connectée au HUD
 */

import { Game } from './components/etherworld'
import { HUD } from './components/HUD'
import RayMarchingKinect from './components/kinect/RayMarchingKinect'
import AdminConsole from './admin/AdminConsole'
import { useState, useEffect, useRef, useCallback } from 'react'
import { loadSave, deleteSave, type SaveData } from './hooks/useSaveSystem'
import { getActiveJob, getState, subscribe, type ActiveJob } from './store/gameState'
import type { DoorZone } from './data/quebecBuildings'

// ─────────────────────────────────────────────
type Phase = 'menu' | 'game' | 'kinect'
type AdminTool = 'editor' | 'agent' | 'weather' | 'stats' | null

// Save chargée UNE SEULE FOIS au module load (synchrone garanti)
const INITIAL_SAVE = loadSave()
// ─────────────────────────────────────────────

export default function App() {

  // ── UI State ──────────────────────────────────
  const [phase,          setPhase]          = useState<Phase>('menu')
  const [fade,           setFade]           = useState(false)
  const [adminOpen,      setAdminOpen]      = useState(false)
  const [adminTool,      setAdminTool]      = useState<AdminTool>(null)

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
  const savedGame = INITIAL_SAVE

  // ── Refs ──────────────────────────────────────
  const prevMoneyRef = useRef(money)

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
      // Ignore si on tape dans un input
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
  //  GLOBAL EVENTS (depuis HUD, AdminConsole, Game, etc.)
  // ============================================================
  useEffect(() => {
    // Depuis le bouton CONSOLE dans le HUD
    const handleToggleAdmin = () => setAdminOpen(prev => !prev)

    // Depuis le bouton EDITOR dans le HUD
    const handleOpenEditor = () => {
      setAdminOpen(true)
      setAdminTool('editor')
    }

    // Depuis le HUD v3 — notifications
    const handleHudNotification = (e: CustomEvent) => {
      if (e.detail?.message) {
        setNotification(e.detail.message)
        setTimeout(() => setNotification(null), e.detail.duration || 4000)
      }
    }

    // Depuis le menu Kinect
    const handleSetPhase = (e: CustomEvent) => {
      if (e.detail?.phase) setPhase(e.detail.phase as Phase)
    }

    window.addEventListener('toggle-admin', handleToggleAdmin)
    window.addEventListener('open-editor', handleOpenEditor)
    window.addEventListener('hud-notification', handleHudNotification as EventListener)
    window.addEventListener('set-phase', handleSetPhase as EventListener)

    // Expose pour les boutons inline (menu Kinect)
    ;(window as any).setAppPhase = (p: Phase) => setPhase(p)

    return () => {
      window.removeEventListener('toggle-admin', handleToggleAdmin)
      window.removeEventListener('open-editor', handleOpenEditor)
      window.removeEventListener('hud-notification', handleHudNotification as EventListener)
      window.removeEventListener('set-phase', handleSetPhase as EventListener)
    }
  }, [])

  // ============================================================
  //  GAME START / TRANSITION
  // ============================================================
  const handleStart = useCallback((continueGame: boolean) => {
    // Décider de la save AVANT la transition
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

    // Fade out → game
    setFade(true)
    setTimeout(() => setPhase('game'), 600)
    setTimeout(() => setFade(false), 900)
  }, [savedGame])

  const handleDeleteSave = useCallback(() => {
    deleteSave()
    window.location.reload()
  }, [])

  const handleAdminClose = useCallback(() => {
    setAdminOpen(false)
    setAdminTool(null)
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
          MENU
          ════════════════════════════════════ */}
      {phase === 'menu' && (
        <MenuScreen
          savedGame={savedGame}
          onStart={handleStart}
          onDeleteSave={handleDeleteSave}
        />
      )}

      {/* ════════════════════════════════════
          KINECT
          ════════════════════════════════════ */}
      {phase === 'kinect' && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <RayMarchingKinect />
          <button
            onClick={() => setPhase('menu')}
            style={{
              position:    'absolute',
              top:         16,
              right:       16,
              zIndex:      100,
              padding:     '8px 20px',
              fontSize:    11,
              fontFamily:  'monospace',
              letterSpacing: 3,
              background:  'transparent',
              border:      '1px solid rgba(255,255,255,0.3)',
              color:       'rgba(255,255,255,0.7)',
              cursor:      'pointer',
            }}
          >
            ← MENU
          </button>
        </div>
      )}

      {/* ════════════════════════════════════
          JEU
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

          {/* HUD — version améliorée */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
            <div style={{ pointerEvents: 'auto' }}>
              <HUD
                fps={60}
                entities={1247}
                mode={isInInterior ? 'spectator' : 'play'}
                weather="clear"
                playerStats={{
                  health:    100,
                  maxHealth: 100,
                  stamina:   100,
                  maxStamina: 100,
                  armor:     0,
                  speed:     speed,
                  state:     mode === 'driving' ? 'sprinting' : 'walking',
                  grounded:  true,
                  position:  [0, 0, 0],
                }}
                worldInfo={{
                  location:    zone,
                  sector:      isInInterior ? 'Intérieur' : 'Extérieur',
                  nearestPOI:  nearBuilding?.name ?? 'Aucun',
                  distancePOI: 0,
                  time:        new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
                  day:         1,
                  temperature: 18,
                }}
                isAdminOpen={adminOpen}
                onToggleAdmin={() => setAdminOpen(prev => !prev)}
                onToggleEditor={() => {
                  setAdminOpen(true)
                  setAdminTool('editor')
                }}
              />
            </div>
          </div>

          {/* Cinématique nouveau joueur */}
          {isNewPlayer && <CinematicOverlay />}
        </>
      )}

      {/* ════════════════════════════════════
          ADMIN CONSOLE — disponible partout
          ════════════════════════════════════ */}
      <AdminConsole
        isOpen={adminOpen}
        onClose={handleAdminClose}
        activeTool={adminTool}
        onToolChange={setAdminTool}
      />

    </div>
  )
}

// ============================================================
//  MENU SCREEN
// ============================================================
interface MenuScreenProps {
  savedGame:    SaveData | null
  onStart:      (continueGame: boolean) => void
  onDeleteSave: () => void
}

function MenuScreen({ savedGame, onStart, onDeleteSave }: MenuScreenProps) {
  const saveDate = savedGame?.savedAt
    ? new Date(savedGame.savedAt).toLocaleDateString('fr-CA', {
        day:    '2-digit',
        month:  'short',
        hour:   '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div style={{
      position:       'absolute',
      inset:          0,
      zIndex:         10,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'linear-gradient(180deg, #0a1628 0%, #1a3a5c 50%, #0d2438 100%)',
      color:          'white',
      fontFamily:     'monospace',
    }}>

      {/* Titre */}
      <div style={{ fontSize: 11, letterSpacing: 8, color: '#4a9ede', marginBottom: 8 }}>
        BIENVENUE DANS
      </div>
      <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: 4, lineHeight: 1, marginBottom: 4 }}>
        ETHERWORLD
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 12, color: '#3a7ebd', marginBottom: 2 }}>
        QC RP
      </div>
      <div style={{ fontSize: 11, color: '#2a6aa0', letterSpacing: 4, marginBottom: 40 }}>
        QUÉBEC · PORTNEUF · TROIS-RIVIÈRES · ETHERWORLD CITY
      </div>

      {/* Info contrôles */}
      <div style={{
        fontSize: 10, color: '#4a8aaa', marginBottom: 36,
        textAlign: 'center', lineHeight: 1.9,
        border: '1px solid #1a4a6a', padding: '16px 28px', borderRadius: 4,
      }}>
        🚗 WASD / Flèches — Conduire · Espace — Freiner<br />
        🚪 E — Sortir / Entrer véhicule ou bâtiment<br />
        🚶 À pied : WASD marcher · A/D tourner<br />
        ⚙️ F12 — Console Admin · F2 — Éditeur · F3 — Agent IA<br />
        🌲 Route 138 · Québec → EtherWorld City
      </div>

      {/* Bouton Continuer */}
      {savedGame && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => onStart(true)}
            style={{
              background: 'rgba(20,60,20,0.6)', border: '2px solid #3acd6e',
              color: '#60ef90', padding: '14px 48px', fontSize: 14,
              letterSpacing: 6, cursor: 'pointer', fontFamily: 'monospace',
              textTransform: 'uppercase', transition: 'all 0.2s', width: 320,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,90,30,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(20,60,20,0.6)')}
          >
            ▶ Continuer
          </button>
          <div style={{ fontSize: 9, color: '#3a7a4a', letterSpacing: 2, textAlign: 'center' }}>
            {savedGame.zone ?? 'Route 138'} · {savedGame.mode === 'walking' ? 'À PIED' : 'EN VOITURE'}
            {' '}· {(savedGame.money ?? 0).toLocaleString('fr-CA')}$
            {saveDate && <span style={{ marginLeft: 10, color: '#2a5a3a' }}>{saveDate}</span>}
          </div>
        </div>
      )}

      {/* Bouton Nouvelle Partie */}
      <button
        onClick={() => onStart(false)}
        style={{
          background: 'transparent', border: '2px solid #3a8ede',
          color: '#5ab0ff', padding: '14px 48px', fontSize: 14,
          letterSpacing: 6, cursor: 'pointer', fontFamily: 'monospace',
          textTransform: 'uppercase', transition: 'all 0.2s',
          width: savedGame ? 320 : undefined,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#5ab0ff')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#3a8ede')}
      >
        {savedGame ? '✦ Nouvelle Partie' : '▶ Démarrer'}
      </button>

      {/* Kinect Demo */}
      <button
        onClick={() => (window as any).setAppPhase?.('kinect')}
        style={{
          marginTop: 28, background: 'transparent',
          border: '1px solid #67f6ff', color: '#67f6ff',
          padding: '10px 32px', fontSize: 12, letterSpacing: 3,
          cursor: 'pointer', fontFamily: 'monospace',
          textTransform: 'uppercase', transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(103,246,255,0.1)'
          e.currentTarget.style.borderColor = '#a5f3fc'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = '#67f6ff'
        }}
      >
        ▶ KINECT DEPTH · RAY MARCHING
      </button>
      <div style={{ fontSize: 9, color: '#4a8aaa', marginTop: 6, letterSpacing: 1 }}>
        React Three Fiber · Volumetric Ray Marching · Leva Controls
      </div>

      {/* Effacer save */}
      {savedGame && (
        <button
          onClick={onDeleteSave}
          style={{
            marginTop: 18, background: 'transparent', border: 'none',
            color: '#3a4a5a', fontSize: 9, cursor: 'pointer',
            fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#aa4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a4a5a')}
        >
          ✕ Effacer la sauvegarde
        </button>
      )}
    </div>
  )
}

// ============================================================
//  CINEMATIC OVERLAY
// ============================================================
function CinematicOverlay() {
  const [visible,   setVisible]   = useState(true)
  const [textPhase, setTextPhase] = useState(0)

  const lines = [
    { delay: 0.5,  text: 'Route 138 — Portneuf, Québec' },
    { delay: 2.5,  text: 'Un matin de novembre...' },
    { delay: 4.5,  text: 'EtherWorld City vous attend...' },
    { delay: 6.5,  text: '' },
  ]

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setTextPhase(i), line.delay * 1000)
    )
    const hideTimer = setTimeout(() => setVisible(false), 8000)
    return () => { timers.forEach(clearTimeout); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute', bottom: 100, left: '50%',
      transform: 'translateX(-50%)', zIndex: 20,
      textAlign: 'center', fontFamily: 'monospace', pointerEvents: 'none',
    }}>
      <div style={{
        color: '#d0e8ff', fontSize: 13, letterSpacing: 4,
        textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.9)',
        opacity: lines[textPhase]?.text ? 1 : 0,
        transition: 'opacity 0.8s ease', minHeight: 20,
      }}>
        {lines[textPhase]?.text ?? ''}
      </div>
    </div>
  )
}