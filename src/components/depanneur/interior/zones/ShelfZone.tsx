/**
 * ShelfZone.tsx
 * Zone d'étagère — ramasser, examiner des produits
 */

import { useRef, useCallback, memo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useInventoryStore } from '../../storage/inventoryStore'
import type { PlayerInventoryItem, InteractionResult, InteractionType } from '../types'
import type { ProductLocation } from '../../storage/types'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface ShelfZoneProps {
  id:             string
  position:       [number, number, number]
  location:       ProductLocation
  playerRef:      React.MutableRefObject<THREE.Vector3>
  onNear?:        (near: boolean, label?: string) => void
  onPickup?:      (result: InteractionResult) => void
  interactRadius?: number
}

// ─────────────────────────────────────────────
// SHELF ZONE
// ─────────────────────────────────────────────

export const ShelfZone = memo(function ShelfZone({
  id,
  position,
  location,
  playerRef,
  onNear,
  onPickup,
  interactRadius = 2.0,
}: ShelfZoneProps) {
  const isNearRef    = useRef(false)
  const posVec       = useRef(new THREE.Vector3(...position))
  const tmpVec       = useRef(new THREE.Vector3())
  const lastPickup   = useRef(0)

  const getByLocation  = useInventoryStore(s => s.getByLocation)
  const decrementStock = useInventoryStore(s => s.decrementStock)

  // Détection proximité
  useFrame(() => {
    tmpVec.current.copy(playerRef.current)
    tmpVec.current.y = 0
    posVec.current.y = 0
    const dist = tmpVec.current.distanceTo(posVec.current)
    const isNow = dist < interactRadius

    if (isNow && !isNearRef.current) {
      isNearRef.current = true
      const products = getByLocation(location)
      const label = products.length > 0
        ? `[E] Prendre ${products[0].nameFr}`
        : `[E] Examiner étagère`
      onNear?.(true, label)
    } else if (!isNow && isNearRef.current) {
      isNearRef.current = false
      onNear?.(false)
    }
  })

  // Touche E — ramasser premier produit disponible
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code !== 'KeyE') return
      if (!isNearRef.current) return

      const now = Date.now()
      if (now - lastPickup.current < 800) return
      lastPickup.current = now

      const products = getByLocation(location)
      const available = products.find(p => p.stock > 0)

      if (!available) {
        onPickup?.({
          success:   false,
          message:   'Out of stock',
          messageFr: 'Rupture de stock',
        })
        return
      }

      const success = decrementStock(available.id)

      onPickup?.({
        success,
        product:   available,
        message:   `Picked up: ${available.name}`,
        messageFr: `Pris: ${available.nameFr}`,
      })
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [location, getByLocation, decrementStock, onPickup])

  return null
})