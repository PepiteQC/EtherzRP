import { useMemo } from 'react'
import { useStore as useGameStore, RARITY_COLORS, CATEGORY_ICONS, type InventoryItem, type InventorySlot } from '@/lib/etherworld/game-store'
import { useGarageStore } from '../garage'
import { useVehicleTrunkStore } from './vehicleTrunkStore'

function notify(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', icon = '📦') {
  const game = useGameStore.getState() as any
  if (game.addNotification) game.addNotification(message, type, 2800, icon)
  else if (game.setNotification) game.setNotification(message, type, 2800, icon)

  window.dispatchEvent(new CustomEvent('hud-notification', {
    detail: { message, duration: 2400 },
  }))
}

function canShowTrunk() {
  const garage = useGarageStore.getState()
  return garage.trunkOpen && !garage.vehicleLocked
}

export default function VehicleTrunkInventory() {
  const trunkOpen = useGarageStore(s => s.trunkOpen)
  const locked = useGarageStore(s => s.vehicleLocked)
  const plate = useGarageStore(s => s.vehiclePlate)

  const playerSlots = useGameStore(s => s.inventorySlots)
  const addItem = useGameStore(s => s.addItem)
  const removeItem = useGameStore(s => s.removeItem)

  const trunkSlots = useVehicleTrunkStore(s => s.slots)
  const addToTrunk = useVehicleTrunkStore(s => s.addToTrunk)
  const removeFromTrunk = useVehicleTrunkStore(s => s.removeFromTrunk)
  const trunkWeight = useVehicleTrunkStore(s => s.getTrunkWeight())
  const maxWeight = useVehicleTrunkStore(s => s.maxWeight)
  const usedSlots = useVehicleTrunkStore(s => s.getUsedSlots())

  const playerFilled = useMemo(() => playerSlots.filter(slot => slot.item !== null), [playerSlots])
  const trunkFilled = useMemo(() => trunkSlots.filter(slot => slot.item !== null), [trunkSlots])

  if (!trunkOpen) return null

  if (locked) {
    return (
      <PanelShell compact>
        <div style={{ color: '#fecaca', fontWeight: 900 }}>Coffre verrouillé</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Déverrouille le véhicule pour accéder au coffre.</div>
      </PanelShell>
    )
  }

  const depositOne = (slot: InventorySlot) => {
    if (!canShowTrunk() || !slot.item) return
    const item: InventoryItem = { ...slot.item, quantity: 1 }
    if (!addToTrunk(item)) {
      notify('Coffre plein ou trop lourd.', 'error', '⚖️')
      return
    }
    removeItem(slot.slotId, 1)
    notify(`Déposé: ${item.name}`, 'success', item.icon)
  }

  const depositAll = (slot: InventorySlot) => {
    if (!canShowTrunk() || !slot.item) return
    const item: InventoryItem = { ...slot.item }
    if (!addToTrunk(item)) {
      notify('Coffre plein ou trop lourd.', 'error', '⚖️')
      return
    }
    removeItem(slot.slotId, item.quantity)
    notify(`Déposé: ${item.quantity}x ${item.name}`, 'success', item.icon)
  }

  const withdrawOne = (slot: InventorySlot) => {
    if (!canShowTrunk() || !slot.item) return
    const removed = removeFromTrunk(slot.slotId, 1)
    if (!removed) return
    if (!addItem(removed)) {
      addToTrunk(removed)
      notify('Inventaire joueur plein ou trop lourd.', 'error', '🎒')
      return
    }
    notify(`Retiré: ${removed.name}`, 'success', removed.icon)
  }

  const withdrawAll = (slot: InventorySlot) => {
    if (!canShowTrunk() || !slot.item) return
    const removed = removeFromTrunk(slot.slotId, slot.item.quantity)
    if (!removed) return
    if (!addItem(removed)) {
      addToTrunk(removed)
      notify('Inventaire joueur plein ou trop lourd.', 'error', '🎒')
      return
    }
    notify(`Retiré: ${removed.quantity}x ${removed.name}`, 'success', removed.icon)
  }

  return (
    <PanelShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 14 }}>
        <div>
          <div style={{ color: '#67e8f9', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>Coffre véhicule</div>
          <h2 style={{ margin: '4px 0 0', fontSize: 19 }}>Plaque {plate}</h2>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 3 }}>
            {usedSlots}/24 slots · {trunkWeight.toFixed(1)}/{maxWeight} kg
          </div>
        </div>
        <div style={{ ...badge, color: trunkWeight > maxWeight * 0.85 ? '#fca5a5' : '#bae6fd' }}>
          {Math.round((trunkWeight / maxWeight) * 100)}%
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
        <Section title="Inventaire joueur" subtitle="Déposer dans le coffre">
          {playerFilled.length === 0 ? <Empty text="Aucun item à déposer" /> : playerFilled.map(slot => (
            <ItemRow
              key={`p-${slot.slotId}`}
              slot={slot}
              primary="Déposer 1"
              secondary="Tout"
              onPrimary={() => depositOne(slot)}
              onSecondary={() => depositAll(slot)}
            />
          ))}
        </Section>

        <Section title="Coffre" subtitle="Retirer vers joueur">
          {trunkFilled.length === 0 ? <Empty text="Coffre vide" /> : trunkFilled.map(slot => (
            <ItemRow
              key={`t-${slot.slotId}`}
              slot={slot}
              primary="Retirer 1"
              secondary="Tout"
              onPrimary={() => withdrawOne(slot)}
              onSecondary={() => withdrawAll(slot)}
            />
          ))}
        </Section>
      </div>
    </PanelShell>
  )
}

function PanelShell({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      bottom: compact ? 96 : 22,
      transform: 'translateX(-50%)',
      width: compact ? 360 : 820,
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: compact ? undefined : '42vh',
      overflow: 'hidden',
      padding: compact ? 16 : 18,
      borderRadius: 16,
      background: 'linear-gradient(180deg, rgba(5,12,24,0.96), rgba(8,18,34,0.93))',
      border: '1px solid rgba(56,189,248,0.35)',
      color: '#e5f7ff',
      zIndex: 44,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      backdropFilter: 'blur(10px)',
    }}>
      {children}
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'end', marginBottom: 8 }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ color: '#64748b', fontSize: 11 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'grid', gap: 8, maxHeight: '28vh', overflowY: 'auto', paddingRight: 4 }}>
        {children}
      </div>
    </div>
  )
}

function ItemRow({ slot, primary, secondary, onPrimary, onSecondary }: {
  slot: InventorySlot
  primary: string
  secondary: string
  onPrimary: () => void
  onSecondary: () => void
}) {
  const item = slot.item!
  const rarityColor = RARITY_COLORS[item.rarity] ?? '#94a3b8'
  const icon = item.icon || CATEGORY_ICONS[item.category] || '📦'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 8,
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      background: 'rgba(15,23,42,0.68)',
      border: `1px solid ${rarityColor}55`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>{icon}</span>
          <span style={{ fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          <span style={{ color: rarityColor, fontSize: 11 }}>x{item.quantity}</span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 3 }}>
          {item.category} · {(item.weight * item.quantity).toFixed(1)} kg · {item.value}$
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onPrimary} style={smallBtn}>{primary}</button>
        <button onClick={onSecondary} style={smallBtnSecondary}>{secondary}</button>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      padding: 18,
      borderRadius: 12,
      color: '#64748b',
      background: 'rgba(15,23,42,0.38)',
      border: '1px dashed rgba(148,163,184,0.22)',
      textAlign: 'center',
      fontSize: 13,
    }}>{text}</div>
  )
}

const badge: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(15,23,42,0.78)',
  border: '1px solid rgba(148,163,184,0.25)',
  fontWeight: 900,
}

const smallBtn: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid rgba(56,189,248,0.42)',
  background: 'rgba(8,47,73,0.72)',
  color: '#e0f2fe',
  padding: '7px 9px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 11,
  whiteSpace: 'nowrap',
}

const smallBtnSecondary: React.CSSProperties = {
  ...smallBtn,
  border: '1px solid rgba(148,163,184,0.28)',
  background: 'rgba(30,41,59,0.72)',
}
