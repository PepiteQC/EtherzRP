/**
 * InteriorController.tsx
 * Logique principale de la scène intérieure
 * Coordonne: joueur, NPCs, zones, UI, ambiance
 */

import {
  useRef, useState, useCallback,
  useEffect, memo,
} from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useNPCStore } from './npc/npcStore'
import { useSecurityStore } from '../security/securityStore'
import { useTransactionStore } from '../storage/transactionStore'
import { useInventoryStore } from '../storage/inventoryStore'
import { detectAndReport } from '../security/theftDetection'
import type {
  PlayerInteriorState,
  PlayerInventoryItem,
  InteractionResult,
  AmbientConfig,
  TimeOfDay,
  WeatherOutside,
} from './types'
import type { PaymentMethod } from '../storage/types'

// ─────────────────────────────────────────────
// DÉTERMINER HEURE DU JOUR
// ─────────────────────────────────────────────

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 22) return 'evening'
  return 'night'
}

// ─────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────

interface InteriorControllerProps {
  playerWorldRef:  React.MutableRefObject<THREE.Vector3>
  initialMoney?:   number
  weather?:        WeatherOutside
  onExit?:         () => void
  onPrompt?:       (label: string | null) => void
  onPlayerState?:  (state: PlayerInteriorState) => void
}

// ─────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────

export function useInteriorController({
  playerWorldRef,
  initialMoney = 50,
  weather = 'cloudy',
  onExit,
  onPrompt,
  onPlayerState,
}: InteriorControllerProps) {
  // ── Stores ──
  const spawnCashier   = useNPCStore(s => s.spawnCashier)
  const spawnCustomer  = useNPCStore(s => s.spawnCustomer)
  const tickNPCs       = useNPCStore(s => s.tick)
  const npcs           = useNPCStore(s => s.getAllNPCs())
  const suspectPlayer  = useNPCStore(s => s.suspectPlayer)
  const logEvent       = useSecurityStore(s => s.logEvent)
  const addToCart      = useTransactionStore(s => s.addToCart)
  const checkout       = useTransactionStore(s => s.checkout)
  const clearCart      = useTransactionStore(s => s.clearCart)

  // ── Joueur ──
  const [playerState, setPlayerState] = useState<PlayerInteriorState>({
    inventory:          [],
    money:              initialMoney,
    nearInteraction:    null,
    activeInteraction:  null,
    isAtCounter:        false,
    isInRestrictedZone: false,
    suspicion:          0,
    lastPurchaseTime:   null,
  })

  const playerStateRef = useRef(playerState)
  playerStateRef.current = playerState

  // ── Ambiance ──
  const [ambientConfig] = useState<AmbientConfig>({
    timeOfDay:     getTimeOfDay(),
    weather,
    musicVolume:   0.35,
    sfxVolume:     0.5,
    lightIntensity: 1.0,
    customerCount: 2,
  })

  // ── Checkout UI ──
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [nearLabel, setNearLabel] = useState<string | null>(null)

  // ── Init NPCs ──
  useEffect(() => {
    spawnCashier()

    // Spawn clients avec délai
    const timers = [
      setTimeout(() => spawnCustomer(), 2000),
      setTimeout(() => spawnCustomer(), 5000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [spawnCashier, spawnCustomer])

  // ── Tick NPCs ──
  useFrame((_, dt) => {
    tickNPCs(dt)
  })

  // ── Update prompt ──
  const updatePrompt = useCallback((label: string | null) => {
    setNearLabel(label)
    onPrompt?.(label)
  }, [onPrompt])

  // ── Pickup item ──
  const handlePickup = useCallback((result: InteractionResult) => {
    if (!result.success || !result.product) return

    setPlayerState(prev => {
      const existing = prev.inventory.find(i => i.product.id === result.product!.id)
      const newInventory: PlayerInventoryItem[] = existing
        ? prev.inventory.map(i =>
            i.product.id === result.product!.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        : [...prev.inventory, { product: result.product!, quantity: 1, pickedAt: Date.now() }]

      // Monter la suspicion légèrement
      const newSuspicion = Math.min(100, prev.suspicion + 2)

      return {
        ...prev,
        inventory:  newInventory,
        suspicion:  newSuspicion,
      }
    })
  }, [])

  // ── Checkout ──
  const handleOpenCheckout = useCallback(() => {
    if (playerStateRef.current.inventory.length === 0) {
      updatePrompt('Aucun article à payer')
      return
    }

    // Préparer le panier
    clearCart()
    playerStateRef.current.inventory.forEach(item => {
      addToCart(item.product, item.quantity)
    })

    setCheckoutOpen(true)
    updatePrompt(null)
  }, [clearCart, addToCart, updatePrompt])

  // ── Paiement ──
  const handlePay = useCallback((method: PaymentMethod) => {
    const { money, inventory } = playerStateRef.current
    const cartTotal = useTransactionStore.getState().cartTotal

    if (money < cartTotal) {
      setCheckoutOpen(false)
      return
    }

    const tx = checkout(method, money)
    if (!tx) {
      setCheckoutOpen(false)
      return
    }

    logEvent(
      'shift_end', // reuse as transaction log
      `Purchase: $${tx.total.toFixed(2)} via ${method}`,
      `Achat: ${tx.total.toFixed(2)}$ via ${method}`,
      { receiptNo: tx.receiptNo, items: inventory.length }
    )

    setPlayerState(prev => ({
      ...prev,
      inventory:         [],
      money:             Math.max(0, prev.money - tx.total + (tx.changeDue ?? 0)),
      suspicion:         Math.max(0, prev.suspicion - 30),
      lastPurchaseTime:  Date.now(),
    }))

    setCheckoutOpen(false)
  }, [checkout, logEvent])

  // ── Annuler checkout ──
  const handleCancelCheckout = useCallback(() => {
    clearCart()
    setCheckoutOpen(false)
  }, [clearCart])

  // ── Suspicion montante avec le temps ──
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerState(prev => {
        const { inventory, suspicion, lastPurchaseTime } = prev
        if (inventory.length === 0) return prev

        // Plus longtemps sans payer, plus la suspicion monte
        const timeSincePickup = Math.min(
          ...inventory.map(i => Date.now() - i.pickedAt)
        )
        const increase = timeSincePickup > 30000 ? 3 : 0

        // Alerter le caissier si suspicion haute
        if (suspicion + increase >= 70) {
          const cashier = useNPCStore.getState().getCashier()
          if (cashier) suspectPlayer(cashier.id, 'player')
        }

        return {
          ...prev,
          suspicion: Math.min(100, suspicion + increase),
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [suspectPlayer])

  // ── Notifier parent du state ──
  useEffect(() => {
    onPlayerState?.(playerState)
  }, [playerState, onPlayerState])

  // ── Touche F pour sortir ──
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === 'KeyF') onExit?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onExit])

  return {
    playerState,
    ambientConfig,
    npcs,
    nearLabel,
    checkoutOpen,
    handlePickup,
    handleOpenCheckout,
    handlePay,
    handleCancelCheckout,
    updatePrompt,
  }
}