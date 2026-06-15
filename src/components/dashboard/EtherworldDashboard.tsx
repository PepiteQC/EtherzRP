import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SaveData } from '../../hooks/useSaveSystem'
import { saveCharacterProfile, type EtherworldCharacterProfile } from './characterProfile'
import { CartoonDashboardScene } from './cartoon'

interface EtherworldDashboardProps {
  savedGame: SaveData | null
  ownerId: string
  hasCharacter: boolean
  isOwner: boolean
  onCharacterCreated: (profile: EtherworldCharacterProfile) => void
  onJoin: () => void
  onJoinV5?: () => void
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
  onJoinV5,
  onOpenObjectCreator,
}: EtherworldDashboardProps) {
  const [creatorOpen, setCreatorOpen] = useState(false)
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState<EtherworldCharacterProfile['origin']>('Portneuf')
  const [style, setStyle] = useState<EtherworldCharacterProfile['style']>('civil')

  const handleJoin = () => {
    // Le créateur de personnage est optionnel pour l'instant.
    // Il ne doit jamais bloquer l'entrée en ville.
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
      <CartoonDashboardScene />
      <div style={styles.softVignette} />

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

          {onJoinV5 && (
            <button style={{ ...styles.joinButton, marginTop: 14, background: 'linear-gradient(180deg, #22d3ee, #0284c7)' }} onClick={onJoinV5}>
              🎮 Rejoindre Mode V5 (Chunks & LOD)
            </button>
          )}

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
    background: '#79c8f2',
    color: '#fff', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  },
  softVignette: { position: 'absolute', inset: 0, boxShadow: 'inset 0 0 140px 45px rgba(71,45,23,0.22)', pointerEvents: 'none', zIndex: 1 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 3 },
  miniLogo: { color: '#ffffff', fontWeight: 950, letterSpacing: 1.5, fontSize: 22, textShadow: '0 3px 0 rgba(75,50,28,0.35), 0 10px 22px rgba(75,50,28,0.25)' },
  ownerButton: { background: 'rgba(255,255,255,0.72)', border: '2px solid rgba(92,44,34,0.22)', color: '#5c2c22', borderRadius: 999, padding: '10px 16px', fontSize: 10, fontWeight: 900, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 8px 0 rgba(92,44,34,0.12)' },
  center: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, zIndex: 2 },
  hero: { textAlign: 'center', width: 'min(760px, 100%)', transform: 'translateY(-18px)' },
  eyebrow: { fontSize: 11, color: '#fff7e8', letterSpacing: 7, marginBottom: 12, fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  logo: { margin: 0, fontSize: 'clamp(58px, 11vw, 132px)', lineHeight: 0.86, fontWeight: 950, letterSpacing: '-0.07em', color: '#fff7e8', textShadow: '0 5px 0 #5c2c22, 0 14px 0 rgba(217,93,43,0.22), 0 24px 44px rgba(92,44,34,0.32)' },
  subtitle: { marginTop: 18, color: '#fff7e8', letterSpacing: 5, textTransform: 'uppercase', fontSize: 12, textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  joinButton: { marginTop: 42, padding: '18px 34px', minWidth: 300, borderRadius: 22, border: '3px solid rgba(92,44,34,0.24)', background: 'linear-gradient(180deg, #ff9a3d, #d95d2b)', color: '#fff7e8', fontWeight: 950, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 9px 0 #9f3f24, 0 22px 34px rgba(92,44,34,0.28)', textShadow: '0 2px 0 rgba(92,44,34,0.28)' },
  createButton: { display: 'block', margin: '18px auto 0', padding: '11px 22px', borderRadius: 999, border: '2px solid rgba(92,44,34,0.18)', background: 'rgba(255,247,232,0.76)', color: '#5c2c22', cursor: 'pointer', fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', fontSize: 11, boxShadow: '0 6px 0 rgba(92,44,34,0.10)' },
  saveHint: { marginTop: 18, color: 'rgba(255,255,255,0.8)', fontSize: 11, letterSpacing: 1.6, textShadow: '0 1px 2px rgba(0,0,0,0.5)' },
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
