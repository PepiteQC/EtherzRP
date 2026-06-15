/**
 * EtherworldDashboard.tsx — MENU PRINCIPAL (wrapper)
 * ------------------------------------------------------------------
 * Ce fichier manquait : App.tsx l'importe mais il n'existait pas
 * (seul EtherworldDashboardScene.tsx était présent), ce qui CASSAIT
 * le build complet du projet.
 *
 * Rôle : afficher la scène 3D de fond (EtherworldDashboardScene) +
 * un menu principal stylé (Jouer / Créer un personnage / Outils owner).
 *
 * Props : exactement celles passées par App.tsx.
 */

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, AnimatePresence } from 'framer-motion'
import EtherworldDashboardScene from './EtherworldDashboardScene'
import {
  saveCharacterProfile,
  type EtherworldCharacterProfile,
} from './characterProfile'
import type { SaveData } from '../../hooks/useSaveSystem'

// ── Props attendues par App.tsx ──────────────────────────────────
interface EtherworldDashboardProps {
  savedGame: SaveData | null
  ownerId: string
  hasCharacter: boolean
  isOwner: boolean
  onCharacterCreated: (profile: EtherworldCharacterProfile) => void
  onJoin: () => void
  onOpenObjectCreator: () => void
}

const ORIGINS: EtherworldCharacterProfile['origin'][] = [
  'Portneuf', 'Québec', 'Trois-Rivières', 'Côte-Nord', 'Montréal', 'Autre',
]
const STYLES: { id: EtherworldCharacterProfile['style']; label: string; icon: string }[] = [
  { id: 'civil',       label: 'Civil',       icon: '🧍' },
  { id: 'travailleur', label: 'Travailleur', icon: '👷' },
  { id: 'police',      label: 'Police',      icon: '🚔' },
  { id: 'medic',       label: 'EMS',         icon: '🚑' },
  { id: 'mecano',      label: 'Mécano',      icon: '🔧' },
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
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState<EtherworldCharacterProfile['origin']>('Portneuf')
  const [style, setStyle] = useState<EtherworldCharacterProfile['style']>('civil')

  const submitCharacter = () => {
    const cleanName = name.trim()
    if (cleanName.length < 3) return
    const profile = saveCharacterProfile(ownerId, { name: cleanName, origin, style })
    onCharacterCreated(profile)
    setCreating(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#060814' }}>
      {/* ── Fond 3D ─────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [0, 28, 1030], fov: 55, near: 0.1, far: 400 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <EtherworldDashboardScene />
          </Suspense>
        </Canvas>
      </div>

      {/* Voile sombre pour lisibilité */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(6,8,20,0.2) 0%, rgba(6,8,20,0.55) 60%, rgba(6,8,20,0.85) 100%)',
        }}
      />

      {/* ── UI ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: '#fff',
          padding: 24,
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            margin: 0,
            fontSize: 'clamp(2.2rem, 7vw, 5rem)',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textShadow: '0 0 18px rgba(0,229,255,0.8), 0 0 48px rgba(124,77,255,0.5)',
          }}
        >
          ETHERWORLD
        </motion.h1>
        <p
          style={{
            margin: '4px 0 36px',
            letterSpacing: '0.4em',
            color: '#ff2e93',
            textShadow: '0 0 12px rgba(255,46,147,0.7)',
            fontSize: 'clamp(0.8rem, 2.4vw, 1.2rem)',
          }}
        >
          QUÉBEC · RP
        </p>

        <AnimatePresence mode="wait">
          {!creating ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 'min(340px, 86vw)' }}
            >
              <MenuButton
                primary
                disabled={!hasCharacter}
                onClick={onJoin}
                label={savedGame ? '▶  CONTINUER' : '▶  JOUER'}
                hint={hasCharacter ? undefined : 'Crée un personnage d\u2019abord'}
              />
              <MenuButton
                onClick={() => setCreating(true)}
                label={hasCharacter ? '✎  MODIFIER LE PERSONNAGE' : '＋  CRÉER UN PERSONNAGE'}
              />
              {isOwner && (
                <MenuButton onClick={onOpenObjectCreator} label="🛠  OUTILS OWNER" subtle />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="creator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                width: 'min(440px, 92vw)',
                background: 'rgba(10,16,30,0.72)',
                border: '1px solid rgba(0,229,255,0.25)',
                borderRadius: 18,
                padding: 24,
                backdropFilter: 'blur(10px)',
              }}
            >
              <h2 style={{ marginTop: 0, letterSpacing: '0.06em' }}>Nouveau personnage</h2>

              <label style={labelStyle}>Nom complet (prénom + nom)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Alexandre Tremblay"
                style={inputStyle}
              />

              <label style={labelStyle}>Origine</label>
              <div style={chipRow}>
                {ORIGINS.map((o) => (
                  <Chip key={o} active={origin === o} onClick={() => setOrigin(o)} label={o} />
                ))}
              </div>

              <label style={labelStyle}>Style de jeu</label>
              <div style={chipRow}>
                {STYLES.map((s) => (
                  <Chip
                    key={s.id}
                    active={style === s.id}
                    onClick={() => setStyle(s.id)}
                    label={`${s.icon} ${s.label}`}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                <button style={{ ...ghostBtn, flex: 1 }} onClick={() => setCreating(false)}>
                  Annuler
                </button>
                <button
                  style={{ ...primaryBtn, flex: 1, opacity: name.trim().length < 3 ? 0.5 : 1 }}
                  disabled={name.trim().length < 3}
                  onClick={submitCharacter}
                >
                  Valider
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p style={{ position: 'absolute', bottom: 18, opacity: 0.5, fontSize: 12, letterSpacing: '0.2em' }}>
          ETHERWORLD RP QUÉBEC · v1.0
        </p>
      </div>
    </div>
  )
}

// ── Sous-composants ─────────────────────────────────────────────
function MenuButton({
  label, onClick, primary, subtle, disabled, hint,
}: {
  label: string
  onClick: () => void
  primary?: boolean
  subtle?: boolean
  disabled?: boolean
  hint?: string
}) {
  return (
    <div>
      <motion.button
        whileHover={disabled ? undefined : { scale: 1.04 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        onClick={disabled ? undefined : onClick}
        style={{
          width: '100%',
          padding: '15px 22px',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '0.12em',
          borderRadius: 999,
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: 'none',
          color: primary ? '#05080f' : '#cfeaff',
          background: primary
            ? 'linear-gradient(90deg,#00e5ff,#7c4dff)'
            : subtle
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,229,255,0.10)',
          boxShadow: primary ? '0 0 24px rgba(0,229,255,0.35)' : 'none',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {label}
      </motion.button>
      {hint && (
        <p style={{ margin: '6px 0 0', fontSize: 11, textAlign: 'center', color: '#ff8fb4' }}>{hint}</p>
      )}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        fontSize: 13,
        cursor: 'pointer',
        border: active ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.15)',
        background: active ? 'rgba(0,229,255,0.18)' : 'rgba(255,255,255,0.03)',
        color: active ? '#bdf0ff' : '#cbd5e1',
      }}
    >
      {label}
    </button>
  )
}

// ── Styles ──────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block', margin: '16px 0 6px', fontSize: 12,
  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7fb6d8',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,229,255,0.25)',
  color: '#fff', outline: 'none', boxSizing: 'border-box',
}
const chipRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const primaryBtn: React.CSSProperties = {
  padding: '12px', borderRadius: 999, border: 'none', fontWeight: 700, cursor: 'pointer',
  color: '#05080f', background: 'linear-gradient(90deg,#00e5ff,#7c4dff)',
}
const ghostBtn: React.CSSProperties = {
  padding: '12px', borderRadius: 999, cursor: 'pointer', fontWeight: 600,
  color: '#cfeaff', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
}
