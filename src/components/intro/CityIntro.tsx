// ============================================================
//  EtherWorld QC RP — City Intro Sequence
//  Cinématique d'introduction avec scènes + titre + lapin.
//  Overlay UI seulement: ne touche pas au personnage joueur.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RabbitScene from './RabbitScene'

const sceneGradients = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
]

const scenes = [
  { gradient: sceneGradients[0], caption: 'Bienvenue à etherzRP', icon: '🏙️' },
  { gradient: sceneGradients[1], caption: 'Les rues vivent la nuit', icon: '🌃' },
  { gradient: sceneGradients[2], caption: 'Un monde à explorer', icon: '🗺️' },
  { gradient: sceneGradients[3], caption: 'Protéger et servir', icon: '🚔' },
  { gradient: sceneGradients[4], caption: 'Sauver des vies', icon: '🚑' },
]

const kenBurns = [
  { scale: [1, 1.15], x: [0, -30], y: [0, -15] },
  { scale: [1.1, 1], x: [-20, 20], y: [10, -10] },
  { scale: [1, 1.12], x: [10, -10], y: [-10, 10] },
  { scale: [1.08, 1], x: [0, 15], y: [0, 10] },
  { scale: [1, 1.1], x: [-15, 0], y: [5, -5] },
]

interface CityIntroProps {
  onDone: () => void
}

export default function CityIntro({ onDone }: CityIntroProps) {
  const [current, setCurrent] = useState(0)
  const [phase, setPhase] = useState<'scenes' | 'title'>('scenes')

  const advance = useCallback(() => {
    if (current < scenes.length - 1) setCurrent(c => c + 1)
    else setPhase('title')
  }, [current])

  useEffect(() => {
    if (phase !== 'scenes') return
    const t = setTimeout(advance, 3400)
    return () => clearTimeout(t)
  }, [current, phase, advance])

  useEffect(() => {
    if (phase !== 'title') return
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [phase, onDone])

  const handleSkip = () => {
    if (phase === 'scenes') setPhase('title')
    else onDone()
  }

  const kb = kenBurns[current % kenBurns.length]

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {/* Film grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 40,
          pointerEvents: 'none',
          opacity: 0.05,
          mixBlendMode: 'overlay',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 40,
          pointerEvents: 'none',
          opacity: 0.02,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 30,
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 220px 80px rgba(0,0,0,0.75)',
        }}
      />

      {/* Scenes */}
      <AnimatePresence mode="wait">
        {phase === 'scenes' && (
          <motion.div
            key={`s-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <motion.div
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: scenes[current].gradient }}
              initial={{ scale: kb.scale[0], x: kb.x[0], y: kb.y[0] }}
              animate={{ scale: kb.scale[1], x: kb.x[1], y: kb.y[1] }}
              transition={{ duration: 3.4, ease: 'linear' }}
            >
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: 0.1 }}>
                <span style={{ fontSize: 'min(300px, 42vw)' }}>{scenes[current].icon}</span>
              </div>
            </motion.div>

            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.30)' }} />

            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'flex-end', padding: 'clamp(28px, 5vw, 56px)' }}>
              <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(167,139,250,0.62)', marginBottom: 8 }}>
                  Scène {current + 1} / {scenes.length}
                </p>
                <h2 style={{ fontSize: 'clamp(24px, 5vw, 48px)', fontWeight: 950, color: '#fff', letterSpacing: '-0.04em', margin: 0 }}>
                  {scenes[current].caption}
                </h2>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <AnimatePresence>
        {phase === 'title' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: 'absolute', inset: 0, zIndex: 20 }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15, filter: 'blur(6px)', transform: 'scale(1.1)', background: sceneGradients[0] }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.70)' }} />
            <RabbitScene />

            <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                  <div style={{
                    width: 78,
                    height: 78,
                    margin: '0 auto 28px',
                    borderRadius: 22,
                    background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 0 100px rgba(139,92,246,0.5)',
                  }}>
                    <span style={{ color: '#fff', fontWeight: 950, fontSize: 20 }}>EW</span>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.9 }}
                  style={{
                    margin: 0,
                    fontSize: 'clamp(52px, 10vw, 112px)',
                    fontWeight: 950,
                    letterSpacing: '-0.06em',
                    color: '#fff',
                    lineHeight: 0.92,
                  }}
                >
                  ETHER<span style={{ background: 'linear-gradient(90deg, #a78bfa, #e879f9, #22d3ee)', WebkitBackgroundClip: 'text', color: 'transparent' }}>WORLD</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.6 }}
                  style={{ marginTop: 14, fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: 750, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.24)' }}
                >
                  RP Québec
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0.5, 1] }}
                  transition={{ delay: 1.4, duration: 2, repeat: Infinity }}
                  style={{ marginTop: 48, fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.2em', textTransform: 'uppercase' }}
                >
                  Chargement du monde...
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      {phase === 'scenes' && (
        <>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50, height: 3, background: 'rgba(255,255,255,0.04)' }}>
            <motion.div key={current} style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)' }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3.4, ease: 'linear' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50, display: 'flex', gap: 8 }}>
            {scenes.map((_, i) => (
              <div key={i} style={{ height: 6, borderRadius: 99, transition: 'all 300ms', width: i === current ? 22 : 6, background: i === current ? '#fff' : i < current ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>
        </>
      )}

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 50,
          color: 'rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 999,
          padding: '7px 16px',
          fontSize: 10,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Passer ›
      </motion.button>
    </motion.div>
  )
}
