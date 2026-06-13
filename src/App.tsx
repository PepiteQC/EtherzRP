/**
 * App.tsx — CORRIGÉ
 * 
 * Fixes:
 * 1. Save chargée AVANT d'entrer dans le jeu (pas de race condition)
 * 2. isNewPlayer persisté correctement
 * 3. Cinématique uniquement si vraiment nouveau joueur
 * 4. Transition propre menu → jeu
 */

import { Game, HUD } from './components/etherworld'
import RayMarchingKinect from './components/kinect/RayMarchingKinect'
import { useState, useEffect, useRef, useCallback } from 'react'
import { loadSave, deleteSave, type SaveData } from './hooks/useSaveSystem'
import { getActiveJob, getState, subscribe, type ActiveJob } from './store/gameState'
import type { DoorZone } from './data/quebecBuildings'

type Phase = 'menu' | 'loading' | 'game' | 'kinect'

// ─────────────────────────────────────────────
// ✅ Chargement synchrone au module load
// La save est lue UNE SEULE FOIS avant tout rendu
// ─────────────────────────────────────────────
const INITIAL_SAVE = loadSave()  // ← hors du composant = synchrone garanti

export default function App() {
  const [speed,          setSpeed]          = useState(0)
  const [zone,           setZone]           = useState('Québec — Route 138 Ouest')
  const [mode,           setMode]           = useState<'driving' | 'walking'>('driving')
  const [saveStatus,     setSaveStatus]     = useState<'saved' | 'saving' | 'idle'>('idle')
  const [phase,          setPhase]          = useState<Phase>('menu')
  const [fade,           setFade]           = useState(false)
  const [nearBuilding,   setNearBuilding]   = useState<DoorZone | null>(null)
  const [interiorPrompt, setInteriorPrompt] = useState<string | null>(null)
  const [isInInterior,   setIsInInterior]   = useState(false)
  const [money,          setMoney]          = useState(INITIAL_SAVE?.money ?? 2500)
  const [activeJob,      setActiveJob]      = useState<ActiveJob | null>(null)
  const [notification,   setNotification]   = useState<string | null>(null)

  // ✅ La save utilisée pour lancer le jeu — jamais null si "Continuer"
  const [activeSave,  setActiveSave]  = useState<SaveData | null>(null)
  const [isNewPlayer, setIsNewPlayer] = useState(false)

  // Ref stable pour la save affichée dans le menu
  const savedGame = INITIAL_SAVE

  // ── Store sync ────────────────────────────────

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

  const prevMoneyRef = useRef(money)
  useEffect(() => {
    if (!activeJob && money > prevMoneyRef.current) {
      const gained = money - prevMoneyRef.current
      setNotification(`+${gained.toLocaleString('fr-CA')}$ gagné !`)
      const t = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(t)
    }
    prevMoneyRef.current = money
  }, [activeJob, money])

  // ── Lancer le jeu ─────────────────────────────

  // Expose phase setter for the Kinect demo button (menu → full-screen R3F ray marching)
  const setAppPhase = useCallback((newPhase: Phase) => {
    setPhase(newPhase)
  }, [])
  // Attach to window for the menu button (simple cross-component trigger)
  ;(window as any).setAppPhase = setAppPhase

  const handleStart = useCallback((continueGame: boolean) => {
    // ✅ FIX: décider de la save AVANT la transition
    if (continueGame && savedGame) {
      setActiveSave(savedGame)
      setIsNewPlayer(false)
      // Pré-charger les infos HUD depuis la save
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

    // Fade out → phase loading → phase game
    setFade(true)

    setTimeout(() => {
      setPhase('game')
    }, 600)

    setTimeout(() => {
      setFade(false)
    }, 900)
  }, [savedGame])

  // ── Effacer save ──────────────────────────────

  const handleDeleteSave = useCallback(() => {
    deleteSave()
    // Reload propre pour réinitialiser INITIAL_SAVE
    window.location.reload()
  }, [])

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div style={{
      width:      '100vw',
      height:     '100vh',
      background: '#0a1628',
      overflow:   'hidden',
    }}>

      {/* ── Fondu ── */}
      <div style={{
        position:       'absolute',
        inset:          0,
        zIndex:         50,
        background:     '#000',
        opacity:        fade ? 1 : 0,
        transition:     'opacity 0.6s ease',
        pointerEvents:  'none',
      }} />

      {/* ════════════════════════════════════
          MENU PRINCIPAL
          ════════════════════════════════════ */}
      {phase === 'menu' && (
        <MenuScreen
          savedGame={savedGame}
          onStart={handleStart}
          onDeleteSave={handleDeleteSave}
        />
      )}

      {/* ════════════════════════════════════
          KINECT RAY MARCHING DEMO (React Three Fiber)
          ════════════════════════════════════ */}
      {phase === 'kinect' && (
        <div className="relative w-full h-full">
          <RayMarchingKinect />
          
          {/* Back button */}
          <button
            onClick={() => setPhase('menu')}
            className="absolute top-4 right-4 z-[100] px-4 py-2 text-xs font-mono tracking-widest border border-white/30 hover:bg-white hover:text-black text-white/80 transition-colors"
          >
            ← BACK TO MENU
          </button>
        </div>
      )}

      {/* ════════════════════════════════════
          JEU
          ════════════════════════════════════ */}
      {phase === 'game' && (
        <>
          <Game
            onSpeedChange={setSpeed}
            onZoneChange={setZone}
            onModeChange={setMode}
            onSaveStatus={setSaveStatus}
            onNearBuilding={setNearBuilding}
            onInteriorPrompt={setInteriorPrompt}
            onIsInInterior={setIsInInterior}
            initialSave={activeSave}       // ✅ jamais de race condition
            isNewPlayer={isNewPlayer}
          />

          <HUD
            speed={speed}
            zone={zone}
            mode={mode}
            saveStatus={saveStatus}
            money={money}
            activeJob={activeJob}
            notification={notification}
            nearBuilding={nearBuilding}
            interiorPrompt={interiorPrompt}
            isInInterior={isInInterior}
          />

          {/* ✅ Cinématique seulement si VRAIMENT nouveau joueur */}
          {isNewPlayer && <CinematicOverlay />}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// MENU SCREEN — extrait pour clarté
// ═══════════════════════════════════════════

interface MenuScreenProps {
  savedGame:     SaveData | null
  onStart:       (continueGame: boolean) => void
  onDeleteSave:  () => void
}

function MenuScreen({ savedGame, onStart, onDeleteSave }: MenuScreenProps) {
  // ✅ Formater la date proprement — gérer savedAt optionnel
  const saveDate = savedGame?.savedAt
    ? new Date(savedGame.savedAt).toLocaleDateString('fr-CA', {
        day:   '2-digit',
        month: 'short',
        hour:  '2-digit',
        minute:'2-digit',
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
      <div style={{
        fontSize:       11,
        letterSpacing:  8,
        color:          '#4a9ede',
        marginBottom:   8,
        textTransform:  'uppercase',
      }}>
        Bienvenue dans
      </div>
      <div style={{
        fontSize:     52,
        fontWeight:   900,
        letterSpacing: 4,
        color:        '#ffffff',
        lineHeight:   1,
        marginBottom: 4,
      }}>
        ETHERWORLD
      </div>
      <div style={{
        fontSize:     28,
        fontWeight:   700,
        letterSpacing: 12,
        color:        '#3a7ebd',
        marginBottom: 2,
      }}>
        QC RP
      </div>
      <div style={{
        fontSize:     11,
        color:        '#2a6aa0',
        letterSpacing: 4,
        marginBottom: 40,
      }}>
        QUÉBEC · PORTNEUF · TROIS-RIVIÈRES · ETHERWORLD CITY
      </div>

      {/* Contrôles */}
      <div style={{
        fontSize:     10,
        color:        '#4a8aaa',
        marginBottom: 36,
        textAlign:    'center',
        lineHeight:   1.9,
        border:       '1px solid #1a4a6a',
        padding:      '16px 28px',
        borderRadius: 4,
      }}>
        🚗 &nbsp;WASD / Flèches — Conduire &nbsp;&nbsp;&nbsp; Espace — Freiner<br />
        🚪 &nbsp;E — Sortir / Entrer dans le véhicule ou bâtiment<br />
        🚶 &nbsp;À pied : WASD pour marcher, A/D pour tourner<br />
        🌲 &nbsp;Route 138 de Québec vers EtherWorld City<br />
        🏙️ &nbsp;Laurentides · Fleuve Saint-Laurent · A-40 · Ville complète
      </div>

      {/* Bouton Continuer */}
      {savedGame && (
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            10,
          marginBottom:   14,
        }}>
          <button
            onClick={() => onStart(true)}
            style={{
              background:      'rgba(20,60,20,0.6)',
              border:          '2px solid #3acd6e',
              color:           '#60ef90',
              padding:         '14px 48px',
              fontSize:        14,
              letterSpacing:   6,
              cursor:          'pointer',
              fontFamily:      'monospace',
              textTransform:   'uppercase',
              transition:      'all 0.2s',
              width:           320,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(30,90,30,0.8)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(20,60,20,0.6)'
            }}
          >
            ▶ Continuer
          </button>

          {/* Infos save */}
          <div style={{ fontSize: 9, color: '#3a7a4a', letterSpacing: 2, textAlign: 'center' }}>
            {savedGame.zone ?? 'Route 138'}
            &nbsp;·&nbsp;
            {savedGame.mode === 'walking' ? 'À PIED' : 'EN VOITURE'}
            &nbsp;·&nbsp;
            {(savedGame.money ?? 0).toLocaleString('fr-CA')}$
            {saveDate && (
              <span style={{ marginLeft: 10, color: '#2a5a3a' }}>
                {saveDate}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bouton Nouvelle Partie */}
      <button
        onClick={() => onStart(false)}
        style={{
          background:    'transparent',
          border:        '2px solid #3a8ede',
          color:         '#5ab0ff',
          padding:       '14px 48px',
          fontSize:      14,
          letterSpacing: 6,
          cursor:        'pointer',
          fontFamily:    'monospace',
          textTransform: 'uppercase',
          transition:    'all 0.2s',
          width:         savedGame ? 320 : undefined,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#5ab0ff'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#3a8ede'
        }}
      >
        {savedGame ? '✦ Nouvelle Partie' : '▶ Démarrer'}
      </button>

      {/* ════════════════════════════════════
          KINECT RAY MARCHING DEMO
          React Three Fiber + Volumetric Ray Marching
          (Depth visualization like the described Kinect app)
          ════════════════════════════════════ */}
      <button
        onClick={() => {
          // Switch to dedicated Kinect phase (full-screen canvas with Leva controls)
          // This launches the ray marching depth visualization
          (window as any).setAppPhase?.('kinect')
        }}
        style={{
          marginTop:     28,
          background:    'transparent',
          border:        '1px solid #67f6ff',
          color:         '#67f6ff',
          padding:       '10px 32px',
          fontSize:      12,
          letterSpacing: 3,
          cursor:        'pointer',
          fontFamily:    'monospace',
          textTransform: 'uppercase',
          transition:    'all 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(103, 246, 255, 0.1)'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#a5f3fc'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#67f6ff'
        }}
      >
        ▶ KINECT DEPTH • RAY MARCHING (R3F)
      </button>
      <div style={{ fontSize: 9, color: '#4a8aaa', marginTop: 6, letterSpacing: 1 }}>
        React Three Fiber • Volumetric Ray Marching • Leva Controls
      </div>

      {/* Effacer save */}
      {savedGame && (
        <button
          onClick={onDeleteSave}
          style={{
            marginTop:     18,
            background:    'transparent',
            border:        'none',
            color:         '#3a4a5a',
            fontSize:      9,
            cursor:        'pointer',
            fontFamily:    'monospace',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = '#aa4444'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = '#3a4a5a'
          }}
        >
          ✕ Effacer la sauvegarde
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// CINEMATIC OVERLAY
// ═══════════════════════════════════════════

function CinematicOverlay() {
  const [visible,   setVisible]   = useState(true)
  const [textPhase, setTextPhase] = useState(0)

  const lines = [
    { delay: 0.5, text: 'Route 138 — Portneuf, Québec' },
    { delay: 2.5, text: 'Un matin de novembre...' },
    { delay: 4.5, text: 'EtherWorld City vous attend...' },
    { delay: 6.5, text: '' },
  ]

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    lines.forEach((line, i) => {
      timers.push(setTimeout(() => setTextPhase(i), line.delay * 1000))
    })
    timers.push(setTimeout(() => setVisible(false), 8000))
    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line

  if (!visible) return null

  const currentText = lines[textPhase]?.text ?? ''

  return (
    <div style={{
      position:      'absolute',
      bottom:        100,
      left:          '50%',
      transform:     'translateX(-50%)',
      zIndex:        20,
      textAlign:     'center',
      fontFamily:    'monospace',
      pointerEvents: 'none',
    }}>
      <div style={{
        color:          '#d0e8ff',
        fontSize:       13,
        letterSpacing:  4,
        textTransform:  'uppercase',
        textShadow:     '0 2px 12px rgba(0,0,0,0.9)',
        opacity:        currentText ? 1 : 0,
        transition:     'opacity 0.8s ease',
        minHeight:      20,
      }}>
        {currentText}
      </div>
    </div>
  )
}