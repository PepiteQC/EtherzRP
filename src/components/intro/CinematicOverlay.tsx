// ============================================================
//  EtherWorld QC RP — Cinematic Overlay nouveau joueur
//  Overlay UI seulement: ne touche pas au personnage ni au gameplay.
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LINES = [
  { delay: 0.5, text: 'Route 138 — Portneuf, Québec' },
  { delay: 2.5, text: 'Un matin de novembre...' },
  { delay: 4.5, text: 'etherzRP vous attend...' },
  { delay: 6.5, text: '' },
]

export default function CinematicOverlay() {
  const [visible, setVisible] = useState(true)
  const [textPhase, setTextPhase] = useState(0)

  useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(() => setTextPhase(i), line.delay * 1000)
    )
    const hideTimer = setTimeout(() => setVisible(false), 8000)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 96,
            background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.8))',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={textPhase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: LINES[textPhase]?.text ? 1 : 0, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.55 }}
              style={{
                color: 'white',
                fontSize: 'clamp(18px, 3vw, 28px)',
                fontWeight: 300,
                letterSpacing: '0.08em',
                textAlign: 'center',
                fontFamily: 'monospace',
                textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              }}
            >
              {LINES[textPhase]?.text ?? ''}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
