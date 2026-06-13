/**
 * InteriorHUD.tsx
 * HUD principal de l'intérieur — argent, inventaire rapide,
 * état suspicion, prompt interaction
 */

import { memo } from 'react'
import type { PlayerInteriorState, AmbientConfig } from '../types'

// ─────────────────────────────────────────────
// SUSPICION BAR
// ─────────────────────────────────────────────

const SuspicionBar = memo(function SuspicionBar({ value }: { value: number }) {
  const color =
    value < 30 ? '#00cc44' :
    value < 60 ? '#ffaa00' :
    value < 85 ? '#ff6600' :
                 '#ff0000'

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      width: 140,
      background: 'rgba(0,0,0,0.7)',
      borderRadius: 8,
      padding: '8px 12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: 12,
    }}>
      <div style={{ marginBottom: 4, color: '#aaaaaa', fontSize: 11 }}>
        SUSPICION
      </div>
      <div style={{
        height: 6,
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.3s ease, background 0.3s ease',
        }} />
      </div>
      {value >= 85 && (
        <div style={{ marginTop: 4, color: '#ff4444', fontSize: 10, fontWeight: 'bold' }}>
          ⚠ LE CAISSIER VOUS SURVEILLE
        </div>
      )}
    </div>
  )
})

// ─────────────────────────────────────────────
// MONEY DISPLAY
// ─────────────────────────────────────────────

const MoneyDisplay = memo(function MoneyDisplay({ amount }: { amount: number }) {
  return (
    <div style={{
      position:   'absolute',
      top:        16,
      left:       16,
      background: 'rgba(0,0,0,0.7)',
      borderRadius: 8,
      padding:    '8px 14px',
      color:      '#00ff88',
      fontFamily: 'monospace',
      fontSize:   18,
      fontWeight: 'bold',
      letterSpacing: 1,
    }}>
      💵 ${amount.toFixed(2)}
    </div>
  )
})

// ─────────────────────────────────────────────
// QUICK INVENTORY
// ─────────────────────────────────────────────

const QuickInventory = memo(function QuickInventory({
  player,
}: {
  player: PlayerInteriorState
}) {
  if (player.inventory.length === 0) return null

  return (
    <div style={{
      position:   'absolute',
      bottom:     60,
      left:       16,
      background: 'rgba(0,0,0,0.75)',
      borderRadius: 8,
      padding:    '10px 14px',
      color:      '#ffffff',
      fontFamily: 'monospace',
      fontSize:   12,
      maxWidth:   220,
    }}>
      <div style={{ color: '#ffcc00', marginBottom: 6, fontSize: 11 }}>
        🛒 ITEMS ({player.inventory.length})
      </div>
      {player.inventory.slice(0, 6).map((item, i) => (
        <div key={i} style={{
          display:        'flex',
          justifyContent: 'space-between',
          marginBottom:   2,
          color:          '#dddddd',
        }}>
          <span>{item.product.nameFr}</span>
          <span style={{ color: '#aaaaaa', marginLeft: 8 }}>
            x{item.quantity} — ${(item.product.price * item.quantity).toFixed(2)}
          </span>
        </div>
      ))}
      {player.inventory.length > 6 && (
        <div style={{ color: '#888888', fontSize: 10, marginTop: 4 }}>
          +{player.inventory.length - 6} autres...
        </div>
      )}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.15)',
        marginTop: 6,
        paddingTop: 4,
        color: '#00ff88',
        fontWeight: 'bold',
      }}>
        Total: ${player.inventory.reduce((s, i) => s + i.product.price * i.quantity, 0).toFixed(2)}
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────
// AMBIENT INFO
// ─────────────────────────────────────────────

const AmbientInfo = memo(function AmbientInfo({ config }: { config: AmbientConfig }) {
  const timeLabel = {
    morning:   '🌅 Matin',
    afternoon: '☀️ Après-midi',
    evening:   '🌆 Soirée',
    night:     '🌙 Nuit',
  }[config.timeOfDay]

  const weatherLabel = {
    sunny:   '☀️',
    cloudy:  '☁️',
    raining: '🌧️',
    snowing: '❄️',
    foggy:   '🌫️',
  }[config.weather]

  return (
    <div style={{
      position:   'absolute',
      bottom:     16,
      right:      16,
      background: 'rgba(0,0,0,0.6)',
      borderRadius: 6,
      padding:    '5px 10px',
      color:      '#aaaaaa',
      fontFamily: 'monospace',
      fontSize:   11,
    }}>
      {timeLabel} {weatherLabel}
    </div>
  )
})

// ─────────────────────────────────────────────
// HUD ROOT
// ─────────────────────────────────────────────

interface InteriorHUDProps {
  player:        PlayerInteriorState
  ambientConfig: AmbientConfig
  nearLabel?:    string | null
}

export const InteriorHUD = memo(function InteriorHUD({
  player,
  ambientConfig,
  nearLabel,
}: InteriorHUDProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <MoneyDisplay amount={player.money} />
      <SuspicionBar value={player.suspicion} />
      <QuickInventory player={player} />
      <AmbientInfo config={ambientConfig} />

      {/* Prompt interaction */}
      {nearLabel && (
        <div style={{
          position:   'absolute',
          bottom:     '28%',
          left:       '50%',
          transform:  'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)',
          border:     '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8,
          padding:    '8px 18px',
          color:      '#ffffff',
          fontFamily: 'monospace',
          fontSize:   14,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ color: '#ffcc00', fontWeight: 'bold', marginRight: 8 }}>
            [E]
          </span>
          {nearLabel}
        </div>
      )}

      {/* Zone restreinte warning */}
      {player.isInRestrictedZone && (
        <div style={{
          position:   'absolute',
          top:        '40%',
          left:       '50%',
          transform:  'translateX(-50%)',
          background: 'rgba(180,0,0,0.8)',
          borderRadius: 8,
          padding:    '10px 20px',
          color:      '#ffffff',
          fontFamily: 'monospace',
          fontSize:   14,
          fontWeight: 'bold',
          border:     '1px solid #ff4444',
        }}>
          🚫 ZONE RÉSERVÉE AU PERSONNEL
        </div>
      )}
    </div>
  )
})