'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useStore, RARITY_COLORS, CATEGORY_ICONS, type InventoryItem, type ItemCategory } from '@/lib/etherworld/game-store'
import {
  Package, Plus, Trash2, Search, Weight, ArrowUpDown, Sparkles, X,
  Star, Shield, Zap, Eye, EyeOff, ChevronDown, ChevronUp,
  RotateCcw, Layers, Info, Heart, ArrowRight, Check, AlertTriangle,
  Shirt, Key, Coins, Pill, Wrench, Crown, Gem, Swords
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const MAX_WEIGHT = 50
const MAX_SLOTS = 32
const GRID_COLUMNS = 8

const STARTER_ITEMS: InventoryItem[] = [
  { id: 'keycard-resident', name: 'Carte Résident', description: "Carte d'accès niveau résident. Permet l'ouverture des portes de votre étage.", icon: '🔑', category: 'key', rarity: 'rare', stackable: false, maxStack: 1, quantity: 1, weight: 0.1, value: 0, usable: true, tradeable: false },
  { id: 'phone-basic', name: 'Téléphone', description: 'Smartphone basique EtherWorld™. Accès aux contacts, carte et messagerie.', icon: '📱', category: 'misc', rarity: 'common', stackable: false, maxStack: 1, quantity: 1, weight: 0.2, value: 500, usable: true, tradeable: true },
  { id: 'wallet', name: 'Portefeuille', description: 'Contient vos documents d\'identité et quelques billets.', icon: '👛', category: 'misc', rarity: 'common', stackable: false, maxStack: 1, quantity: 1, weight: 0.1, value: 50, usable: true, tradeable: false },
  { id: 'cash', name: 'Argent Liquide', description: 'Billets EtherWorld en coupures variées. Monnaie universelle du serveur.', icon: '💵', category: 'currency', rarity: 'common', stackable: true, maxStack: 99999, quantity: 2500, weight: 0, value: 1, usable: false, tradeable: true },
  { id: 'water-bottle', name: "Bouteille d'eau", description: 'Eau minérale fraîche des sources d\'EtherWorld. Restaure la soif.', icon: '💧', category: 'consumable', rarity: 'common', stackable: true, maxStack: 10, quantity: 3, weight: 0.5, value: 5, usable: true, tradeable: true },
  { id: 'energy-bar', name: 'Barre Énergétique', description: 'Snack nutritif haute performance. +15 énergie.', icon: '🍫', category: 'consumable', rarity: 'common', stackable: true, maxStack: 20, quantity: 5, weight: 0.1, value: 10, usable: true, tradeable: true },
]

const AVAILABLE_ITEMS: InventoryItem[] = [
  ...STARTER_ITEMS,
  { id: 'keycard-vip', name: 'Carte VIP', description: 'Accès premium aux zones exclusives et services prioritaires.', icon: '🌟', category: 'key', rarity: 'epic', stackable: false, maxStack: 1, quantity: 1, weight: 0.1, value: 5000, usable: true, tradeable: false },
  { id: 'keycard-admin', name: 'Carte Admin', description: 'Accès total à toutes les zones. Privilèges administrateur.', icon: '👑', category: 'key', rarity: 'legendary', stackable: false, maxStack: 1, quantity: 1, weight: 0.1, value: 50000, usable: true, tradeable: false },
  { id: 'medkit', name: 'Kit Médical', description: 'Trousse de premiers soins professionnelle. Restaure 50 PV.', icon: '🩹', category: 'consumable', rarity: 'uncommon', stackable: true, maxStack: 5, quantity: 1, weight: 1, value: 250, usable: true, tradeable: true },
  { id: 'lockpick', name: 'Crochet', description: 'Outil d\'ouverture discrète. Efficacité variable selon la serrure.', icon: '🔧', category: 'misc', rarity: 'rare', stackable: true, maxStack: 10, quantity: 1, weight: 0.05, value: 100, usable: true, tradeable: true },
  { id: 'radio', name: 'Radio', description: 'Talkie-walkie longue portée. Fréquence sécurisée.', icon: '📻', category: 'misc', rarity: 'uncommon', stackable: false, maxStack: 1, quantity: 1, weight: 0.5, value: 350, usable: true, tradeable: true },
  { id: 'flashlight', name: 'Lampe Torche', description: 'Éclairage LED haute puissance. Batterie rechargeable.', icon: '🔦', category: 'misc', rarity: 'common', stackable: false, maxStack: 1, quantity: 1, weight: 0.3, value: 75, usable: true, tradeable: true },
  { id: 'crypto-wallet', name: 'Wallet Crypto', description: 'Portefeuille numérique sécurisé. Blockchain EtherWorld.', icon: '💎', category: 'currency', rarity: 'epic', stackable: false, maxStack: 1, quantity: 1, weight: 0, value: 10000, usable: true, tradeable: false },
  { id: 'hoodie-black', name: 'Hoodie Noir', description: 'Sweat à capuche urbain. +5 style, +2 discrétion.', icon: '🧥', category: 'clothing', rarity: 'common', stackable: false, maxStack: 1, quantity: 1, weight: 0.5, value: 150, usable: true, tradeable: true },
  { id: 'sneakers-white', name: 'Sneakers', description: 'Baskets confortables premium. +3 vitesse de déplacement.', icon: '👟', category: 'clothing', rarity: 'uncommon', stackable: false, maxStack: 1, quantity: 1, weight: 0.8, value: 300, usable: true, tradeable: true },
  { id: 'sunglasses', name: 'Lunettes Noires', description: 'Look mystérieux. Protection UV. +10 charisme.', icon: '🕶️', category: 'clothing', rarity: 'rare', stackable: false, maxStack: 1, quantity: 1, weight: 0.1, value: 500, usable: true, tradeable: true },
  { id: 'coffee', name: 'Café Chaud', description: 'Double expresso fumant. +20 énergie, +5 focus pendant 5min.', icon: '☕', category: 'consumable', rarity: 'common', stackable: true, maxStack: 5, quantity: 1, weight: 0.3, value: 8, usable: true, tradeable: true },
  { id: 'bandage', name: 'Bandage', description: 'Pansement stérile. Restaure 15 PV sur 10 secondes.', icon: '🩹', category: 'consumable', rarity: 'common', stackable: true, maxStack: 15, quantity: 3, weight: 0.05, value: 15, usable: true, tradeable: true },
  { id: 'mask-cyber', name: 'Masque Cyber', description: 'Masque facial LED programmable. +15 charisme, anonymat.', icon: '🎭', category: 'clothing', rarity: 'epic', stackable: false, maxStack: 1, quantity: 1, weight: 0.2, value: 2500, usable: true, tradeable: true },
  { id: 'usb-drive', name: 'Clé USB', description: 'Données chiffrées. Contenu inconnu. Usage unique.', icon: '💾', category: 'misc', rarity: 'rare', stackable: false, maxStack: 1, quantity: 1, weight: 0.02, value: 1000, usable: true, tradeable: true },
  { id: 'spray-paint', name: 'Bombe de Peinture', description: 'Peinture en spray. Personnalisation et marquage territorial.', icon: '🎨', category: 'misc', rarity: 'common', stackable: true, maxStack: 10, quantity: 2, weight: 0.4, value: 25, usable: true, tradeable: true },
  { id: 'cigarettes', name: 'Cigarettes', description: 'Paquet de cigarettes. Objet social. -2 santé/min.', icon: '🚬', category: 'consumable', rarity: 'common', stackable: true, maxStack: 20, quantity: 10, weight: 0.05, value: 12, usable: true, tradeable: true },
  { id: 'diamond', name: 'Diamant Brut', description: 'Pierre précieuse non taillée. Très haute valeur marchande.', icon: '💠', category: 'currency', rarity: 'legendary', stackable: true, maxStack: 10, quantity: 1, weight: 0.01, value: 25000, usable: false, tradeable: true },
  { id: 'gps-tracker', name: 'Traceur GPS', description: 'Dispositif de suivi miniature. Portée: 5km.', icon: '📡', category: 'misc', rarity: 'rare', stackable: true, maxStack: 3, quantity: 1, weight: 0.05, value: 800, usable: true, tradeable: true },
]

// ═══════════════════════════════════════════════════════════
// RARITY CONFIG
// ═══════════════════════════════════════════════════════════

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const

const RARITY_LABELS: Record<string, string> = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

const RARITY_BG: Record<string, string> = {
  common: 'rgba(160,160,160,0.06)',
  uncommon: 'rgba(80,200,120,0.08)',
  rare: 'rgba(60,130,246,0.1)',
  epic: 'rgba(168,85,247,0.12)',
  legendary: 'rgba(255,165,0,0.15)',
}

const RARITY_GLOW: Record<string, string> = {
  common: 'none',
  uncommon: '0 0 8px rgba(80,200,120,0.15)',
  rare: '0 0 12px rgba(60,130,246,0.2)',
  epic: '0 0 16px rgba(168,85,247,0.25)',
  legendary: '0 0 20px rgba(255,165,0,0.3), 0 0 40px rgba(255,165,0,0.1)',
}

const CATEGORY_LABELS: Record<string, string> = {
  weapon: 'Arme',
  clothing: 'Vêtement',
  consumable: 'Consommable',
  key: 'Clé / Accès',
  furniture: 'Mobilier',
  misc: 'Divers',
  currency: 'Monnaie',
}

const CATEGORY_ICONS_EXTENDED: Record<string, React.ReactNode> = {
  weapon: <Swords size={12} />,
  clothing: <Shirt size={12} />,
  consumable: <Pill size={12} />,
  key: <Key size={12} />,
  furniture: <Package size={12} />,
  misc: <Wrench size={12} />,
  currency: <Coins size={12} />,
}

// ═══════════════════════════════════════════════════════════
// UTILITY HOOKS
// ═══════════════════════════════════════════════════════════

export function useInitializeInventory() {
  const { addItem, inventorySlots } = useStore()
  if (inventorySlots.every(s => s.item === null)) {
    STARTER_ITEMS.forEach(item => addItem({ ...item }))
  }
}

function useItemStats() {
  const { inventorySlots } = useStore()

  return useMemo(() => {
    const items = inventorySlots.filter(s => s.item !== null).map(s => s.item!)
    const totalValue = items.reduce((sum, item) => sum + item.value * item.quantity, 0)
    const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0)
    const totalItems = items.length
    const byCategory: Record<string, number> = {}
    const byRarity: Record<string, number> = {}

    items.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1
      byRarity[item.rarity] = (byRarity[item.rarity] || 0) + 1
    })

    return { totalValue, totalWeight, totalItems, byCategory, byRarity }
  }, [inventorySlots])
}

// ═══════════════════════════════════════════════════════════
// TOOLTIP COMPONENT
// ═══════════════════════════════════════════════════════════

function ItemTooltip({ item, position }: { item: InventoryItem; position: { x: number; y: number } }) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [adjustedPos, setAdjustedPos] = useState(position)

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      let x = position.x + 16
      let y = position.y - 10

      if (x + rect.width > window.innerWidth - 20) {
        x = position.x - rect.width - 16
      }
      if (y + rect.height > window.innerHeight - 20) {
        y = window.innerHeight - rect.height - 20
      }
      if (y < 20) y = 20

      setAdjustedPos({ x, y })
    }
  }, [position])

  const rarityColor = RARITY_COLORS[item.rarity]

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[200] pointer-events-none"
      style={{
        left: adjustedPos.x,
        top: adjustedPos.y,
        animation: 'tooltipFadeIn 0.15s ease-out',
      }}
    >
      <div
        className="w-64 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,30,0.97), rgba(10,10,18,0.98))',
          border: `1px solid ${rarityColor}40`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), ${RARITY_GLOW[item.rarity]}`,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Header gradient */}
        <div
          className="px-4 pt-3 pb-2"
          style={{
            background: `linear-gradient(135deg, ${rarityColor}15, transparent)`,
            borderBottom: `1px solid ${rarityColor}20`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{item.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: rarityColor,
                    background: `${rarityColor}15`,
                    border: `1px solid ${rarityColor}30`,
                  }}
                >
                  {RARITY_LABELS[item.rarity]}
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider flex items-center gap-0.5">
                  {CATEGORY_ICONS_EXTENDED[item.category]}
                  {CATEGORY_LABELS[item.category]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-2.5">
          <p className="text-[11px] text-zinc-400 leading-relaxed italic">
            "{item.description}"
          </p>
        </div>

        {/* Stats */}
        <div className="px-4 pb-3 flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500 flex items-center gap-1">
              <Layers size={10} /> Quantité
            </span>
            <span className="text-white font-mono font-bold">
              {item.quantity}{item.stackable ? `/${item.maxStack}` : ''}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500 flex items-center gap-1">
              <Weight size={10} /> Poids
            </span>
            <span className="text-white font-mono font-bold">{(item.weight * item.quantity).toFixed(1)} kg</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500 flex items-center gap-1">
              <Coins size={10} /> Valeur
            </span>
            <span className="text-emerald-400 font-mono font-bold">${(item.value * item.quantity).toLocaleString()}</span>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {item.usable && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase tracking-wider">
                Utilisable
              </span>
            )}
            {item.tradeable && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                Échangeable
              </span>
            )}
            {!item.tradeable && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider">
                Lié au compte
              </span>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-zinc-800/50 bg-zinc-900/50">
          <div className="text-[9px] text-zinc-600 text-center font-mono">
            Clic gauche: sélectionner • Clic droit: actions rapides
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// CONTEXT MENU
// ═══════════════════════════════════════════════════════════

interface ContextMenuProps {
  item: InventoryItem
  slotId: number
  position: { x: number; y: number }
  onClose: () => void
  onUse: () => void
  onDrop: () => void
  onFavorite: () => void
  isFavorite: boolean
}

function ContextMenu({ item, position, onClose, onUse, onDrop, onFavorite, isFavorite }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const actions = [
    ...(item.usable ? [{ label: 'Utiliser', icon: <Zap size={13} />, action: onUse, color: 'text-cyan-400' }] : []),
    { label: isFavorite ? 'Retirer favori' : 'Favori', icon: <Star size={13} />, action: onFavorite, color: isFavorite ? 'text-yellow-400' : 'text-zinc-400' },
    { label: 'Inspecter', icon: <Eye size={13} />, action: onClose, color: 'text-zinc-400' },
    ...(item.tradeable ? [{ label: 'Échanger', icon: <ArrowRight size={13} />, action: onClose, color: 'text-emerald-400' }] : []),
    { divider: true } as any,
    { label: 'Jeter', icon: <Trash2 size={13} />, action: onDrop, color: 'text-red-400', danger: true },
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-[200]"
      style={{
        left: Math.min(position.x, window.innerWidth - 200),
        top: Math.min(position.y, window.innerHeight - 300),
        animation: 'contextMenuPop 0.12s ease-out',
      }}
    >
      <div
        className="w-48 rounded-xl overflow-hidden py-1"
        style={{
          background: 'rgba(15,15,25,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Item header */}
        <div className="px-3 py-2 border-b border-zinc-800/50 flex items-center gap-2">
          <span className="text-sm">{item.icon}</span>
          <span className="text-xs font-bold text-white truncate">{item.name}</span>
        </div>

        {actions.map((action, i) => {
          if (action.divider) {
            return <div key={`div-${i}`} className="h-px bg-zinc-800/50 my-1" />
          }
          return (
            <button
              key={action.label}
              onClick={() => { action.action(); onClose() }}
              className={`w-full px-3 py-2 flex items-center gap-2.5 text-xs font-medium transition-all ${
                action.danger
                  ? 'hover:bg-red-500/10 text-red-400'
                  : 'hover:bg-zinc-800/50 text-zinc-300'
              }`}
            >
              <span className={action.color}>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// WEIGHT BAR COMPONENT
// ═══════════════════════════════════════════════════════════

function WeightBar({ current, max }: { current: number; max: number }) {
  const percentage = Math.min((current / max) * 100, 100)
  const isOverweight = percentage > 90
  const isWarning = percentage > 70

  const barColor = isOverweight
    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
    : isWarning
      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
      : 'linear-gradient(90deg, #06b6d4, #0891b2)'

  return (
    <div className="flex items-center gap-2">
      <Weight size={12} className={isOverweight ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-cyan-400'} />
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: barColor,
            boxShadow: isOverweight ? '0 0 8px rgba(239,68,68,0.4)' : 'none',
          }}
        />
      </div>
      <span className={`text-[10px] font-mono font-bold ${isOverweight ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-zinc-400'}`}>
        {current.toFixed(1)}/{max}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// INVENTORY SLOT COMPONENT
// ═══════════════════════════════════════════════════════════

interface InventorySlotProps {
  slotId: number
  item: InventoryItem | null
  isSelected: boolean
  isFavorite: boolean
  isDragOver: boolean
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: () => void
  onMouseEnter: (e: React.MouseEvent) => void
  onMouseLeave: () => void
  onMouseMove: (e: React.MouseEvent) => void
}

function InventorySlot({
  slotId, item, isSelected, isFavorite, isDragOver,
  onClick, onContextMenu, onDragStart, onDragOver, onDragLeave, onDrop,
  onMouseEnter, onMouseLeave, onMouseMove,
}: InventorySlotProps) {
  const rarityColor = item ? RARITY_COLORS[item.rarity] : 'rgba(255,255,255,0.05)'
  const rarityBg = item ? RARITY_BG[item.rarity] : 'transparent'
  const rarityGlow = item ? RARITY_GLOW[item.rarity] : 'none'

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      draggable={!!item}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      className="aspect-square rounded-xl cursor-pointer flex flex-col items-center justify-center relative group"
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: isSelected ? '#00d4ff' : isDragOver ? '#22c55e' : item ? `${rarityColor}40` : 'rgba(255,255,255,0.04)',
        background: isSelected
          ? 'rgba(0,212,255,0.08)'
          : isDragOver
            ? 'rgba(34,197,94,0.08)'
            : item
              ? rarityBg
              : 'rgba(30,30,40,0.3)',
        boxShadow: isSelected
          ? '0 0 16px rgba(0,212,255,0.15), inset 0 0 8px rgba(0,212,255,0.05)'
          : isDragOver
            ? '0 0 12px rgba(34,197,94,0.2)'
            : item
              ? rarityGlow
              : 'none',
        transition: 'all 0.2s ease',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Empty slot number */}
      {!item && (
        <span className="text-[8px] text-zinc-700 font-mono absolute top-1 left-1.5">
          {slotId + 1}
        </span>
      )}

      {/* Item content */}
      {item && (
        <>
          {/* Rarity corner indicator */}
          <div
            className="absolute top-0 right-0 w-2.5 h-2.5 rounded-bl-lg rounded-tr-lg"
            style={{ background: rarityColor }}
          />

          {/* Favorite star */}
          {isFavorite && (
            <Star
              size={10}
              className="absolute top-0.5 left-0.5 text-yellow-400 fill-yellow-400"
            />
          )}

          {/* Item icon */}
          <span
            className="text-2xl transition-transform group-hover:scale-110"
            style={{
              filter: isSelected ? 'drop-shadow(0 0 4px rgba(0,212,255,0.5))' : 'none',
            }}
          >
            {item.icon}
          </span>

          {/* Quantity badge */}
          {item.quantity > 1 && (
            <span
              className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-white font-mono px-1 py-px rounded"
              style={{
                background: 'rgba(0,0,0,0.85)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              {item.quantity > 999 ? `${Math.floor(item.quantity / 1000)}k` : item.quantity}
            </span>
          )}

          {/* Tradeable indicator */}
          {!item.tradeable && (
            <div className="absolute bottom-0.5 left-0.5">
              <EyeOff size={8} className="text-red-400/50" />
            </div>
          )}

          {/* Hover highlight */}
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${rarityColor}08, transparent)`,
            }}
          />
        </>
      )}

      {/* Drag over indicator */}
      {isDragOver && (
        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-emerald-400/50 pointer-events-none flex items-center justify-center">
          <ArrowRight size={16} className="text-emerald-400/60" />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// STATS PANEL
// ═══════════════════════════════════════════════════════════

function StatsPanel() {
  const stats = useItemStats()

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-1.5">
        <Info size={10} />
        Statistiques
      </div>

      {/* Value */}
      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-zinc-500 font-mono">VALEUR TOTALE</span>
          <span className="text-sm font-bold text-emerald-400 font-mono">
            ${stats.totalValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* By category */}
      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
        <div className="text-[9px] text-zinc-600 font-mono mb-2 uppercase tracking-wider">Par catégorie</div>
        <div className="flex flex-col gap-1.5">
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <div key={cat} className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 flex items-center gap-1.5">
                {CATEGORY_ICONS_EXTENDED[cat]}
                <span className="capitalize">{CATEGORY_LABELS[cat]}</span>
              </span>
              <span className="text-white font-mono font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By rarity */}
      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
        <div className="text-[9px] text-zinc-600 font-mono mb-2 uppercase tracking-wider">Par rareté</div>
        <div className="flex flex-col gap-1.5">
          {RARITY_ORDER.map(rarity => {
            const count = stats.byRarity[rarity] || 0
            if (count === 0) return null
            return (
              <div key={rarity} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: RARITY_COLORS[rarity] }}
                  />
                  <span style={{ color: RARITY_COLORS[rarity] }}>{RARITY_LABELS[rarity]}</span>
                </span>
                <span className="text-white font-mono font-bold">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ADD ITEM PANEL — ENRICHI
// ═══════════════════════════════════════════════════════════

function AddItemPanel({ onAdd }: { onAdd: (item: InventoryItem) => void }) {
  const [addSearch, setAddSearch] = useState('')
  const [addCategory, setAddCategory] = useState<ItemCategory | 'all'>('all')
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  const filteredItems = AVAILABLE_ITEMS.filter(item => {
    if (addCategory !== 'all' && item.category !== addCategory) return false
    if (addSearch && !item.name.toLowerCase().includes(addSearch.toLowerCase())) return false
    return true
  })

  const handleAdd = useCallback((item: InventoryItem) => {
    onAdd({ ...item })
    setAddedItems(prev => new Set(prev).add(item.id))
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }, 1500)
  }, [onAdd])

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-1.5">
        <Plus size={10} />
        Ajouter un objet
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          type="text"
          placeholder="Filtrer..."
          value={addSearch}
          onChange={e => setAddSearch(e.target.value)}
          className="w-full py-1.5 pl-7 pr-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-[10px] font-sans outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1">
        {(['all', 'consumable', 'key', 'clothing', 'misc', 'currency'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setAddCategory(cat)}
            className={`px-1.5 py-0.5 text-[9px] rounded font-bold transition-all ${
              addCategory === cat
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'bg-zinc-800 text-zinc-500 border border-transparent hover:text-zinc-300'
            }`}
          >
            {cat === 'all' ? 'Tout' : (CATEGORY_LABELS[cat] || cat)}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto pr-1" style={{ maxHeight: '400px' }}>
        {filteredItems.map(item => {
          const justAdded = addedItems.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => handleAdd(item)}
              className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                justAdded
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-zinc-800/40 border-zinc-700/50 hover:border-cyan-500/40 hover:bg-zinc-800/70'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-white truncate">{item.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider"
                    style={{ color: RARITY_COLORS[item.rarity] }}
                  >
                    {RARITY_LABELS[item.rarity]}
                  </span>
                  <span className="text-[8px] text-zinc-600">•</span>
                  <span className="text-[8px] text-emerald-400 font-mono">${item.value}</span>
                </div>
              </div>
              {justAdded ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Plus size={14} className="text-cyan-400 opacity-0 group-hover:opacity-100" />
              )}
            </button>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-xs font-mono">
            Aucun objet trouvé
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ITEM DETAIL PANEL
// ═══════════════════════════════════════════════════════════

function ItemDetailPanel({
  item,
  slotId,
  onUse,
  onDrop,
  onClose,
}: {
  item: InventoryItem
  slotId: number
  onUse: () => void
  onDrop: () => void
  onClose: () => void
}) {
  const [confirmDrop, setConfirmDrop] = useState(false)
  const [dropQuantity, setDropQuantity] = useState(1)

  const rarityColor = RARITY_COLORS[item.rarity]
  const totalWeight = item.weight * item.quantity
  const totalValue = item.value * item.quantity

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Item showcase */}
      <div className="text-center py-2">
        <div
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${rarityColor}15, ${rarityColor}05)`,
            border: `1px solid ${rarityColor}40`,
            boxShadow: `0 0 30px ${rarityColor}15, inset 0 0 20px ${rarityColor}05`,
          }}
        >
          {/* Animated shine for rare+ items */}
          {RARITY_ORDER.indexOf(item.rarity as any) >= 2 && (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, transparent 30%, ${rarityColor}08 50%, transparent 70%)`,
                animation: 'shimmer 3s ease-in-out infinite',
              }}
            />
          )}
          <span className="relative z-10">{item.icon}</span>
        </div>

        <div className="mt-3 text-sm font-bold tracking-wide" style={{ color: rarityColor }}>
          {item.name}
        </div>

        <div className="flex items-center justify-center gap-2 mt-1.5">
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              color: rarityColor,
              background: `${rarityColor}12`,
              border: `1px solid ${rarityColor}25`,
            }}
          >
            {RARITY_LABELS[item.rarity]}
          </span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider flex items-center gap-1">
            {CATEGORY_ICONS_EXTENDED[item.category]}
            {CATEGORY_LABELS[item.category]}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
        <p className="text-[11px] text-zinc-400 leading-relaxed">{item.description}</p>
      </div>

      {/* Detailed stats */}
      <div className="flex flex-col gap-2 text-[10px] font-mono">
        <div className="flex justify-between text-zinc-600">
          <span className="flex items-center gap-1"><Layers size={10} /> QUANTITÉ</span>
          <span className="text-white font-bold">{item.quantity}{item.stackable ? ` / ${item.maxStack}` : ''}</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span className="flex items-center gap-1"><Weight size={10} /> POIDS UNITAIRE</span>
          <span className="text-white font-bold">{item.weight} kg</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span className="flex items-center gap-1"><Weight size={10} /> POIDS TOTAL</span>
          <span className="text-white font-bold">{totalWeight.toFixed(1)} kg</span>
        </div>
        <div className="h-px bg-zinc-800 my-1" />
        <div className="flex justify-between text-zinc-600">
          <span className="flex items-center gap-1"><Coins size={10} /> VALEUR UNIT.</span>
          <span className="text-emerald-400 font-bold">${item.value.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span className="flex items-center gap-1"><Coins size={10} /> VALEUR TOTALE</span>
          <span className="text-emerald-400 font-bold">${totalValue.toLocaleString()}</span>
        </div>
      </div>

      {/* Properties */}
      <div className="flex flex-wrap gap-1.5">
        {item.usable && (
          <span className="text-[8px] px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
            <Zap size={8} /> Utilisable
          </span>
        )}
        {item.tradeable ? (
          <span className="text-[8px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
            <ArrowRight size={8} /> Échangeable
          </span>
        ) : (
          <span className="text-[8px] px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
            <EyeOff size={8} /> Lié
          </span>
        )}
        {item.stackable && (
          <span className="text-[8px] px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider flex items-center gap-1">
            <Layers size={8} /> Empilable
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-zinc-800/50">
        {item.usable && (
          <button
            onClick={onUse}
            className="py-2.5 rounded-lg font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: '#042f2e',
              boxShadow: '0 0 16px rgba(6,182,212,0.3)',
            }}
          >
            <Zap size={13} />
            UTILISER
          </button>
        )}

        {!confirmDrop ? (
          <button
            onClick={() => setConfirmDrop(true)}
            className="py-2.5 rounded-lg border border-red-500/30 bg-red-500/8 text-red-400 font-bold text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-red-500/15 transition-colors"
          >
            <Trash2 size={12} />
            JETER
          </button>
        ) : (
          <div className="flex flex-col gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold">
              <AlertTriangle size={12} />
              Confirmer la suppression ?
            </div>
            {item.stackable && item.quantity > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-500">Quantité:</span>
                <input
                  type="number"
                  min={1}
                  max={item.quantity}
                  value={dropQuantity}
                  onChange={e => setDropQuantity(Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1)))}
                  className="w-16 py-1 px-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs font-mono text-center outline-none focus:border-red-500/50"
                />
                <button
                  onClick={() => setDropQuantity(item.quantity)}
                  className="text-[9px] text-red-400 hover:text-red-300 font-mono"
                >
                  Tout
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { onDrop(); setConfirmDrop(false) }}
                className="flex-1 py-1.5 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors"
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirmDrop(false)}
                className="flex-1 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold hover:bg-zinc-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN INVENTORY PANEL
// ═══════════════════════════════════════════════════════════

export function InventoryPanel() {
  const {
    inventorySlots, inventoryOpen, setInventoryOpen,
    selectedSlot, selectSlot, addItem, removeItem, moveItem, useItem,
    getTotalWeight, sortInventory,
  } = useStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<ItemCategory | 'all'>('all')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Drag & drop state
  const [dragSlot, setDragSlot] = useState<number | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)

  // Tooltip state
  const [tooltipItem, setTooltipItem] = useState<InventoryItem | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    item: InventoryItem
    slotId: number
    position: { x: number; y: number }
  } | null>(null)

  // Sort state
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'value' | 'weight'>('name')

  const filteredSlots = useMemo(() => {
    return inventorySlots.filter(sl => {
      if (!sl.item) return true
      if (filterCategory !== 'all' && sl.item.category !== filterCategory) return false
      if (searchQuery && !sl.item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [inventorySlots, filterCategory, searchQuery])

  const handleSlotClick = useCallback((slotId: number) => {
    if (selectedSlot !== null && selectedSlot !== slotId) {
      moveItem(selectedSlot, slotId)
      selectSlot(null)
    } else if (inventorySlots.find(s => s.slotId === slotId)?.item) {
      selectSlot(slotId)
    } else {
      selectSlot(null)
    }
    setContextMenu(null)
  }, [selectedSlot, moveItem, selectSlot, inventorySlots])

  const handleContextMenu = useCallback((e: React.MouseEvent, slotId: number) => {
    e.preventDefault()
    const item = inventorySlots.find(s => s.slotId === slotId)?.item
    if (item) {
      setContextMenu({
        item,
        slotId,
        position: { x: e.clientX, y: e.clientY },
      })
    }
  }, [inventorySlots])

  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }, [])

  const handleSort = useCallback((by: typeof sortBy) => {
    setSortBy(by)
    sortInventory(by)
  }, [sortInventory])

  const selectedItem = selectedSlot !== null
    ? inventorySlots.find(s => s.slotId === selectedSlot)?.item
    : null

  const totalWeight = getTotalWeight()
  const itemCount = inventorySlots.filter(s => s.item !== null).length
  const stats = useItemStats()

  // ─── CLOSED STATE ───
  if (!inventoryOpen) {
    return (
      <button
        onClick={() => setInventoryOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-5 py-3 cursor-pointer text-white font-semibold text-sm transition-all hover:-translate-y-0.5 group"
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,30,0.95), rgba(10,10,18,0.98))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,255,0.05)',
        }}
      >
        <div className="relative">
          <Package size={18} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          {/* Notification dot if has items */}
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full" />
          )}
        </div>
        <span className="tracking-wide">INVENTAIRE</span>
        <span
          className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: itemCount >= MAX_SLOTS ? '#ef4444' : 'rgba(255,255,255,0.4)',
          }}
        >
          {itemCount}/{MAX_SLOTS}
        </span>
      </button>
    )
  }

  // ─── OPEN STATE ───
  return (
    <>
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes contextMenuPop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes inventorySlideIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center select-none"
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          animation: 'overlayFadeIn 0.2s ease-out',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setInventoryOpen(false)
            setShowAddPanel(false)
            setShowStats(false)
            setContextMenu(null)
          }
        }}
      >
        <div
          className="w-full max-w-5xl max-h-[88vh] overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(12,12,20,0.98), rgba(8,8,14,0.99))',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,212,255,0.03), inset 0 1px 0 rgba(255,255,255,0.03)',
            animation: 'inventorySlideIn 0.25s ease-out',
          }}
        >
          {/* ════════ HEADER ════════ */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{
              borderColor: 'rgba(255,255,255,0.05)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))',
                  border: '1px solid rgba(6,182,212,0.2)',
                  boxShadow: '0 0 16px rgba(6,182,212,0.1)',
                }}
              >
                <Package size={20} className="text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  INVENTAIRE DU JOUEUR
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: 'rgba(6,182,212,0.1)',
                      color: 'rgba(6,182,212,0.6)',
                      border: '1px solid rgba(6,182,212,0.15)',
                    }}
                  >
                    v2.0
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    EMPLACEMENTS: <span className={`font-bold ${itemCount >= MAX_SLOTS ? 'text-red-400' : 'text-white'}`}>{itemCount}/{MAX_SLOTS}</span>
                  </span>
                  <div className="w-40">
                    <WeightBar current={totalWeight} max={MAX_WEIGHT} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowStats(!showStats); setShowAddPanel(false) }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  showStats ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                }`}
                style={{ borderWidth: 1 }}
                title="Statistiques"
              >
                <Info size={14} />
              </button>
              <button
                onClick={() => { setInventoryOpen(false); setShowAddPanel(false); setShowStats(false); setContextMenu(null) }}
                className="w-8 h-8 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ════════ TOOLBAR ════════ */}
          <div
            className="flex gap-3 px-6 py-2.5 items-center"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            {/* Search */}
            <div className="relative flex-1 max-w-[240px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="text"
                placeholder="Rechercher un objet..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full py-1.5 pl-8 pr-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-xs font-sans outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Category filters */}
            <div className="flex gap-1">
              {(['all', 'weapon', 'clothing', 'consumable', 'key', 'furniture', 'misc', 'currency'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-2 py-1 text-[10px] rounded-md font-bold transition-all flex items-center gap-1"
                  style={{
                    background: filterCategory === cat ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.02)',
                    color: filterCategory === cat ? '#22d3ee' : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${filterCategory === cat ? 'rgba(6,182,212,0.3)' : 'transparent'}`,
                    boxShadow: filterCategory === cat ? '0 0 8px rgba(6,182,212,0.1)' : 'none',
                  }}
                  title={cat === 'all' ? 'Tous' : CATEGORY_LABELS[cat]}
                >
                  {cat === 'all' ? 'Tout' : CATEGORY_ICONS_EXTENDED[cat] || CATEGORY_ICONS[cat]}
                </button>
              ))}
            </div>

            {/* Sorting & Actions */}
            <div className="ml-auto flex gap-1.5">
              {(['name', 'rarity', 'value', 'weight'] as const).map(by => (
                <button
                  key={by}
                  onClick={() => handleSort(by)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all"
                  style={{
                    background: sortBy === by ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.02)',
                    color: sortBy === by ? '#22d3ee' : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${sortBy === by ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)'}`,
                  }}
                >
                  <ArrowUpDown size={10} />
                  {by === 'name' ? 'Nom' : by === 'rarity' ? 'Rareté' : by === 'value' ? 'Valeur' : 'Poids'}
                </button>
              ))}

              <div className="w-px bg-zinc-800 mx-1" />

              <button
                onClick={() => { setShowAddPanel(!showAddPanel); setShowStats(false) }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all"
                style={{
                  background: showAddPanel ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
                  color: '#4ade80',
                  border: `1px solid ${showAddPanel ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.2)'}`,
                }}
              >
                <Plus size={12} />
                Ajouter
              </button>
            </div>
          </div>

          {/* ════════ BODY ════════ */}
          <div className="flex flex-1 overflow-hidden">
            {/* ─── GRID AREA ─── */}
            <div className="flex-1 p-5 overflow-y-auto">
              {/* Quick stats bar */}
              <div className="flex items-center gap-4 mb-4 text-[10px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1">
                  <Package size={10} className="text-cyan-400/50" />
                  {filteredSlots.filter(s => s.item).length} objets affichés
                </span>
                <span className="flex items-center gap-1">
                  <Coins size={10} className="text-emerald-400/50" />
                  Valeur: ${stats.totalValue.toLocaleString()}
                </span>
                {filterCategory !== 'all' && (
                  <button
                    onClick={() => setFilterCategory('all')}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <RotateCcw size={10} />
                    Réinitialiser filtres
                  </button>
                )}
              </div>

              {/* Inventory grid */}
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)` }}>
                {filteredSlots.map(sl => (
                  <InventorySlot
                    key={sl.slotId}
                    slotId={sl.slotId}
                    item={sl.item}
                    isSelected={selectedSlot === sl.slotId}
                    isFavorite={sl.item ? favorites.has(sl.item.id) : false}
                    isDragOver={dragOverSlot === sl.slotId}
                    onClick={() => handleSlotClick(sl.slotId)}
                    onContextMenu={(e) => handleContextMenu(e, sl.slotId)}
                    onDragStart={() => setDragSlot(sl.slotId)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverSlot(sl.slotId) }}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={() => {
                      if (dragSlot !== null && dragSlot !== sl.slotId) {
                        moveItem(dragSlot, sl.slotId)
                      }
                      setDragSlot(null)
                      setDragOverSlot(null)
                    }}
                    onMouseEnter={(e) => {
                      if (sl.item && !contextMenu) {
                        setTooltipItem(sl.item)
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }
                    }}
                    onMouseLeave={() => setTooltipItem(null)}
                    onMouseMove={(e) => {
                      if (tooltipItem) {
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }
                    }}
                  />
                ))}
              </div>

              {/* Empty state message */}
              {filteredSlots.every(s => !s.item) && searchQuery && (
                <div className="text-center py-12">
                  <Search size={32} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-600">Aucun objet trouvé pour "{searchQuery}"</p>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterCategory('all') }}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    Réinitialiser la recherche
                  </button>
                </div>
              )}
            </div>

            {/* ─── SIDE PANEL ─── */}
            <div
              className="w-[280px] border-l p-5 overflow-y-auto flex flex-col"
              style={{
                borderColor: 'rgba(255,255,255,0.04)',
                background: 'rgba(255,255,255,0.01)',
              }}
            >
              {selectedItem ? (
                <ItemDetailPanel
                  item={selectedItem}
                  slotId={selectedSlot!}
                  onUse={() => useItem(selectedSlot!)}
                  onDrop={() => { removeItem(selectedSlot!); selectSlot(null) }}
                  onClose={() => selectSlot(null)}
                />
              ) : showAddPanel ? (
                <AddItemPanel onAdd={addItem} />
              ) : showStats ? (
                <StatsPanel />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      border: '2px dashed rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.01)',
                    }}
                  >
                    <Package size={24} className="text-zinc-700" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-600 font-mono tracking-wide">SÉLECTIONNER</p>
                    <p className="text-xs text-zinc-600 font-mono tracking-wide">UN OBJET</p>
                  </div>
                  <div className="text-center mt-2 space-y-1">
                    <p className="text-[9px] text-zinc-700 font-mono">Clic gauche: Sélectionner</p>
                    <p className="text-[9px] text-zinc-700 font-mono">Clic droit: Menu contextuel</p>
                    <p className="text-[9px] text-zinc-700 font-mono">Glisser: Déplacer</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ════════ FOOTER ════════ */}
          <div
            className="flex items-center justify-between px-6 py-2.5"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.04)',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <div className="flex items-center gap-4 text-[9px] text-zinc-600 font-mono">
              <span>ETHERWORLD QUÉBEC</span>
              <span>•</span>
              <span>INVENTORY SYSTEM v2.0</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-[9px] text-zinc-500 font-mono">I</kbd>
              <span className="text-[9px] text-zinc-600 font-mono">Fermer</span>
              <span className="text-zinc-700 mx-1">|</span>
              <kbd className="px-1.5 py-0.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-[9px] text-zinc-500 font-mono">ESC</kbd>
              <span className="text-[9px] text-zinc-600 font-mono">Quitter</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════ TOOLTIP ════════ */}
      {tooltipItem && !contextMenu && (
        <ItemTooltip item={tooltipItem} position={tooltipPos} />
      )}

      {/* ════════ CONTEXT MENU ════════ */}
      {contextMenu && (
        <ContextMenu
          item={contextMenu.item}
          slotId={contextMenu.slotId}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onUse={() => { useItem(contextMenu.slotId); selectSlot(null) }}
          onDrop={() => { removeItem(contextMenu.slotId); selectSlot(null) }}
          onFavorite={() => toggleFavorite(contextMenu.item.id)}
          isFavorite={favorites.has(contextMenu.item.id)}
        />
      )}
    </>
  )
}