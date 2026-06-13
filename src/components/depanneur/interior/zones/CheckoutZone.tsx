/**
 * CheckoutZone.tsx
 * Zone de caisse — interagir avec le caissier, payer
 */

import { useRef, useState, useCallback, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTransactionStore } from '../../storage/transactionStore'
import { useInventoryStore } from '../../storage/inventoryStore'
import type { PlayerInventoryItem, InteractionResult } from '../types'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface CheckoutZoneProps {
  position:      [number, number, number]
  playerRef:     React.MutableRefObject<THREE.Vector3>
  playerItems:   PlayerInventoryItem[]
  playerMoney:   number
  onCheckout:    (result: InteractionResult) => void
  onNear?:       (near: boolean) => void
  cashierName?:  string
}

// ─────────────────────────────────────────────
// CHECKOUT ZONE
// ─────────────────────────────────────────────

export const CheckoutZone = memo(function CheckoutZone({
  position,
  playerRef,
  playerItems,
  playerMoney,
  onCheckout,
  onNear,
  cashierName = 'Marie-Ève',
}: CheckoutZoneProps) {
  const isNearRef = useRef(false)
  const zoneRadius = 2.5
  const posVec = useRef(new THREE.Vector3(...position))
  const tmpVec = useRef(new THREE.Vector3())

  const addToCart   = useTransactionStore(s => s.addToCart)
  const checkout    = useTransactionStore(s => s.checkout)
  const clearCart   = useTransactionStore(s => s.clearCart)
  const cartTotal   = useTransactionStore(s => s.cartTotal)
  const inventory   = useInventoryStore.getState

  // Détection proximité
  useFrame(() => {
    tmpVec.current.copy(playerRef.current)
    tmpVec.current.y = 0
    posVec.current.y = 0
    const dist = tmpVec.current.distanceTo(posVec.current)
    const isNow = dist < zoneRadius

    if (isNow !== isNearRef.current) {
      isNearRef.current = isNow
      onNear?.(isNow)
    }
  })

  // Démarrer checkout — ajoute tous les items du joueur au panier
  const startCheckout = useCallback(() => {
    if (playerItems.length === 0) {
      onCheckout({
        success: false,
        message: 'No items to purchase',
        messageFr: 'Aucun article à acheter',
      })
      return
    }

    clearCart()

    // Ajouter chaque item au panier
    playerItems.forEach(item => {
      const product = inventory().getProduct(item.product.id)
      if (product) addToCart(product, item.quantity)
    })

    // Vérifier si le joueur a assez d'argent
    if (playerMoney < cartTotal) {
      onCheckout({
        success:   false,
        message:   `Insufficient funds. Need $${cartTotal.toFixed(2)}`,
        messageFr: `Fonds insuffisants. Besoin de ${cartTotal.toFixed(2)}$`,
      })
      clearCart()
      return
    }

    // Payer en cash
    const tx = checkout('cash', playerMoney)

    if (!tx) {
      onCheckout({
        success:   false,
        message:   'Transaction failed',
        messageFr: 'Transaction échouée',
      })
      return
    }

    onCheckout({
      success:     true,
      message:     `Paid $${tx.total.toFixed(2)} — Change: $${(tx.changeDue ?? 0).toFixed(2)}`,
      messageFr:   `Payé ${tx.total.toFixed(2)}$ — Monnaie: ${(tx.changeDue ?? 0).toFixed(2)}$`,
      moneySpent:  tx.total,
      moneyGained: tx.changeDue,
    })
  }, [playerItems, playerMoney, cartTotal, addToCart, checkout, clearCart, inventory, onCheckout])

  return null // Logique pure, UI dans CheckoutUI
})