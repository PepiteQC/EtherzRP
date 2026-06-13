import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import CartoonConnectionScene from './cartoon/CartoonConnectionScene'

interface EtherworldConnectionScreenProps {
  onComplete: () => void
}

const STEPS = [
  'Connexion en cours',
  'Ouverture du monde',
  'Préparation de la ville',
]

export default function EtherworldConnectionScreen({ onComplete }: EtherworldConnectionScreenProps) {
  const [step, setStep] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1300),
      setTimeout(() => setStep(2), 2600),
      setTimeout(() => setLeaving(true), 3900),
      setTimeout(onComplete, 4550),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <motion.div
      style={styles.root}
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.65 }}
    >
      <CartoonConnectionScene />

      <main style={styles.center}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={styles.hero}
        >
          <h1 style={styles.logo}>ETHER<span>WORLD</span></h1>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={styles.status}
          >
            {STEPS[step]}<span style={styles.dots}>...</span>
          </motion.div>
          <div style={styles.bar}>
            <motion.div
              style={styles.barFill}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 4.25, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </main>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    overflow: 'hidden',
    background: '#79c8f2',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  },
  center: {
    position: 'absolute', inset: 0, zIndex: 2,
    display: 'grid', placeItems: 'center', padding: 24,
  },
  hero: { textAlign: 'center', transform: 'translateY(-12px)' },
  logo: {
    margin: 0,
    fontSize: 'clamp(58px, 11vw, 132px)',
    lineHeight: 0.86,
    fontWeight: 950,
    letterSpacing: '-0.07em',
    color: '#fff7e8',
    textShadow: '0 5px 0 #5c2c22, 0 14px 0 rgba(217,93,43,0.22), 0 24px 44px rgba(92,44,34,0.32)',
  },
  status: {
    marginTop: 36,
    color: '#5c2c22',
    fontWeight: 950,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontSize: 'clamp(14px, 2vw, 19px)',
    textShadow: '0 2px 0 rgba(255,247,232,0.35)',
  },
  dots: { display: 'inline-block', minWidth: 24 },
  bar: {
    margin: '18px auto 0',
    width: 280,
    height: 14,
    borderRadius: 999,
    background: 'rgba(92,44,34,0.20)',
    border: '3px solid rgba(92,44,34,0.22)',
    overflow: 'hidden',
    boxShadow: '0 6px 0 rgba(92,44,34,0.10)',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #ff8a3d, #379351)',
  },
}
