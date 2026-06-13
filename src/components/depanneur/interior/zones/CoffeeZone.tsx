/**
 * CoffeeZone.tsx
 * Zone café / slurpee — se servir, payer ensuite
 */

import { useRef, useCallback, memo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useInventoryStore } from '../../storage/inventoryStore'
import type { InteractionResult } from '../types'

// ─────────────────────────────────────────────
// COFFEE ZONE
// ─────────────────────────────────────────────

type DrinkType = 'coffee_small' | 'coffee_large' | 'slurpee_small' | 'slurpee_large'

interface DrinkOption {
  id:      DrinkType
  label:   string
  labelFr: string
  price:   number
  productId: string
}

const DRINK_OPTIONS: DrinkOption[] = [
  { id: 'coffee_small', label: 'Small Coffee (8oz)',     labelFr: 'Café Petit (8oz)',     price: 1.99, productId: 'cafe-petit' },
  { id: 'coffee_large', label: 'Large Coffee (16oz)',    labelFr: 'Café Grand (16oz)',     price: 2.79, productId: 'cafe-grand' },
  { id: 'slurpee_small',label: 'Slurpee Small',         labelFr: 'Sloche Petit',          price: 1.89, productId: 'slurpee-small' },
  { id: 'slurpee_large',label: 'Slurpee Large',         labelFr: 'Sloche Grand',          price: 2.49, productId: 'slurpee-small' },
]

interface CoffeeZoneProps {
  position:    [number, number, number]
  playerRef:   React.MutableRefObject<THREE.Vector3>
  onNear?:     (near: boolean, label?: string) => void
  onServeDrink?: (result: InteractionResult, drink: DrinkOption) => void
}

export const CoffeeZone = memo(function CoffeeZone({
  position,
  playerRef,
  onNear,
  onServeDrink,
}: CoffeeZoneProps) {
  const isNearRef   = useRef(false)
  const posVec      = useRef(new THREE.Vector3(...position))
  const tmpVec      = useRef(new THREE.Vector3())
  const [menuOpen, setMenuOpen] = useState(false)
  const getProduct  = useInventoryStore(s => s.getProduct)

  useFrame(() => {
    tmpVec.current.copy(playerRef.current)
    tmpVec.current.y = 0
    posVec.current.y = 0
    const dist = tmpVec.current.distanceTo(posVec.current)
    const isNow = dist < 2.0

    if (isNow !== isNearRef.current) {
      isNearRef.current = isNow
      onNear?.(isNow, isNow ? '[E] Se servir un café / sloche' : undefined)
      if (!isNow) setMenuOpen(false)
    }
  })

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code !== 'KeyE' || !isNearRef.current) return
      setMenuOpen(prev => !prev)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleSelectDrink = useCallback((drink: DrinkOption) => {
    const product = getProduct(drink.productId)
    setMenuOpen(false)

    onServeDrink?.({
      success:   true,
      product:   product ?? undefined,
      message:   `Got: ${drink.label} — Pay at counter`,
      messageFr: `Servi: ${drink.labelFr} — Payer au comptoir`,
      moneySpent: drink.price,
    }, drink)
  }, [getProduct, onServeDrink])

  // Le menu est rendu dans l'UI (InteriorHUD), on expose juste l'état
  return null
})