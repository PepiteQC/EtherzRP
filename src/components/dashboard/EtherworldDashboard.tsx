import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SaveData } from '../../hooks/useSaveSystem'
import { saveCharacterProfile, type EtherworldCharacterProfile } from './characterProfile'

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

export default function EtherworldDashboard({
  savedGame,
  ownerId,
  hasCharacter,
  isOwner,
  onCharacterCreated,
  onJoin,
  onOpenObjectCreator,
}: EtherworldDashboardProps) {
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState<EtherworldCharacterProfile['origin']>('Portneuf')
  const [style, setStyle] = useState<EtherworldCharacterProfile['style']>('civil')

  const particles = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: Math.random() * 2.5,
      duration: 2.5 + Math.random() * 3,
    }))
  }, [])

  const handleJoin = () => {
    if (!hasCharacter) {
      setCreatorOpen(true)
      return
    }
    onJoin()
  }

  const handleCreate = () => {
    const cleanName = name.trim() || 'Citoyen EtherWorld'
    const profile = saveCharacterProfile(ownerId, { name: cleanName, origin, style })
    onCharacterCreated(profile)
    setCreatorOpen(false)
  }

  return (
    <div style={styles.root}>
      <div style={styles.noise} />
      <div style={styles.vignette} />
      <div style={styles.grid} />

      {particles.map(p => (
        <motion.span
          key={p.id}
          style={{ ...styles.particle, left: p.left, top: p.top }}
          animate={{ opacity: [0.08, 0.55, 0.08], scale: [1, 1.8, 1] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity }}
        />
      ))}

      <header style={styles.header}>
        <div style={styles.miniLogo}>ETHERWORLD</div>
        {isOwner && (
          <button style={styles.ownerButton} onClick={onOpenObjectCreator}>
            ADMIN · OBJECT CREATOR
          </button>
        )}
      </header>

      <main style={styles.center}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={styles.hero}
        >
          <div style={styles.eyebrow}>QUÉBEC · ROUTE 138 · RP</div>
          <h1 style={styles.logo}>
            ETHER<span>WORLD</span>
          </h1>
          <div style={styles.subtitle}>Portneuf vers EtherWorld City</div>

          <button style={styles.joinButton} onClick={handleJoin}>
            Rejoindre EtherWorld
          </button>

          {!hasCharacter && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={styles.createButton}
              onClick={() => setCreatorOpen(true)}
            >
              Créer personnage
            </motion.button>
          )}

          {savedGame && (
            <div style={styles.saveHint}>
              Sauvegarde trouvée · {savedGame.zone ?? 'Route 138'} · {savedGame.mode === 'walking' ? 'À pied' : 'En voiture'}
            </div>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {creatorOpen && (
          <motion.div
            style={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={styles.modal}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <div style={styles.modalTop}>
                <div>
                  <div style={styles.modalEyebrow}>NOUVEAU CITOYEN</div>
                  <h2 style={styles.modalTitle}>Créer personnage</h2>
                </div>
                <button style={styles.close} onClick={() => setCreatorOpen(false)}>×</button>
              </div>

              <label style={styles.label}>Nom RP</label>
              <input
                style={styles.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Maxime Tremblay"
                maxLength={32}
              />

              <label style={styles.label}>Origine</label>
              <div style={styles.pills}>
                {ORIGINS.map(o => (
                  <button key={o} style={origin === o ? styles.pillActive : styles.pill} onClick={() => setOrigin(o)}>{o}</button>
                ))}
              </div>

              <label style={styles.label}>Style RP</label>
              <div style={styles.pills}>
                {STYLES.map(s => (
                  <button key={s.id} style={style === s.id ? styles.pillActive : styles.pill} onClick={() => setStyle(s.id)}>{s.label}</button>
                ))}
              </div>

              <button style={{ ...styles.joinButton, width: '100%', marginTop: 22 }} onClick={handleCreate}>
                Sauvegarder le personnage
              </button>
              <p style={styles.modalNote}>
                Le personnage est sauvegardé localement pour ton compte/session. Quand un personnage existe, cette section disparaît du dashboard.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden',
    background: 'radial-gradient(ellipse at 50% 32%, #13122a 0%, #080912 42%, #020207 100%)',
    color: '#fff', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  },
  noise: {
    position: 'absolute', inset: 0, opacity: 0.045, pointerEvents: 'none', mixBlendMode: 'overlay',
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  },
  vignette: { position: 'absolute', inset: 0, boxShadow: 'inset 0 0 240px 90px rgba(0,0,0,0.74)', pointerEvents: 'none' },
  grid: {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.13,
    backgroundImage: 'linear-gradient(rgba(139,92,246,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)',
    backgroundSize: '58px 58px', maskImage: 'radial-gradient(circle at 50% 45%, black 0%, transparent 68%)',
  },
  particle: { position: 'absolute', width: 2, height: 2, borderRadius: 999, background: '#a78bfa', boxShadow: '0 0 10px #8b5cf6' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.055)', zIndex: 2 },
  miniLogo: { color: '#a855f7', fontWeight: 950, letterSpacing: 1.5, fontSize: 22, textShadow: '0 0 18px rgba(168,85,247,0.45)' },
  ownerButton: { background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(168,85,247,0.35)', color: '#d8b4fe', borderRadius: 999, padding: '10px 16px', fontSize: 10, fontWeight: 800, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase' },
  center: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, zIndex: 1 },
  hero: { textAlign: 'center', width: 'min(760px, 100%)' },
  eyebrow: { fontSize: 11, color: 'rgba(103,232,249,0.68)', letterSpacing: 7, marginBottom: 12, fontWeight: 700 },
  logo: { margin: 0, fontSize: 'clamp(54px, 11vw, 128px)', lineHeight: 0.86, fontWeight: 950, letterSpacing: '-0.07em', textShadow: '0 0 35px rgba(139,92,246,0.36), 0 24px 80px rgba(0,0,0,0.85)' },
  subtitle: { marginTop: 18, color: 'rgba(255,255,255,0.32)', letterSpacing: 5, textTransform: 'uppercase', fontSize: 12 },
  joinButton: { marginTop: 42, padding: '18px 34px', minWidth: 300, borderRadius: 18, border: '1px solid rgba(34,211,238,0.42)', background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(34,211,238,0.82))', color: '#fff', fontWeight: 950, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 0 44px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.22)' },
  createButton: { display: 'block', margin: '14px auto 0', padding: '11px 22px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.11)', background: 'rgba(255,255,255,0.045)', color: 'rgba(255,255,255,0.62)', cursor: 'pointer', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', fontSize: 11 },
  saveHint: { marginTop: 18, color: 'rgba(255,255,255,0.22)', fontSize: 11, letterSpacing: 1.6 },
  modalBackdrop: { position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: 20, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' },
  modal: { width: 'min(560px, 100%)', borderRadius: 24, padding: 24, background: 'linear-gradient(180deg, rgba(10,12,24,0.98), rgba(8,8,16,0.96))', border: '1px solid rgba(168,85,247,0.28)', boxShadow: '0 30px 100px rgba(0,0,0,0.65)' },
  modalTop: { display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 18, marginBottom: 18 },
  modalEyebrow: { color: '#67e8f9', fontSize: 10, letterSpacing: 4, fontWeight: 800 },
  modalTitle: { margin: '4px 0 0', fontSize: 28 },
  close: { width: 34, height: 34, borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer', fontSize: 22 },
  label: { display: 'block', margin: '15px 0 8px', fontSize: 11, color: 'rgba(255,255,255,0.42)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800 },
  input: { width: '100%', boxSizing: 'border-box', borderRadius: 14, border: '1px solid rgba(255,255,255,0.11)', background: 'rgba(0,0,0,0.28)', color: '#fff', padding: '13px 14px', outline: 'none', fontSize: 15 },
  pills: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: { border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.035)', color: 'rgba(255,255,255,0.48)', borderRadius: 999, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 750 },
  pillActive: { border: '1px solid rgba(34,211,238,0.55)', background: 'rgba(34,211,238,0.12)', color: '#a5f3fc', borderRadius: 999, padding: '9px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 850 },
  modalNote: { color: 'rgba(255,255,255,0.26)', fontSize: 11, lineHeight: 1.55, marginBottom: 0 },
}
