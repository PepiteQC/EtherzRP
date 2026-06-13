/**
 * InteractionZone.tsx
 * Zone d'interaction générique — détecte proximité joueur
 * et expose callback onNear / onInteract
 */

import { useRef, useState, useCallback, memo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import type { InteractionType } from '../types'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface InteractionZoneProps {
  id:           string
  position:     [number, number, number]
  size:         [number, number, number]   // largeur, hauteur, profondeur
  type:         InteractionType
  label:        string
  labelFr:      string
  playerRef:    React.MutableRefObject<THREE.Vector3>
  onNear?:      (id: string, label: string) => void
  onLeave?:     (id: string) => void
  onInteract?:  (id: string, type: InteractionType) => void
  debug?:       boolean
  disabled?:    boolean
  cooldownMs?:  number
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export const InteractionZone = memo(function InteractionZone({
  id,
  position,
  size,
  type,
  label,
  labelFr,
  playerRef,
  onNear,
  onLeave,
  onInteract,
  debug = false,
  disabled = false,
  cooldownMs = 500,
}: InteractionZoneProps) {
  const isNearRef     = useRef(false)
  const lastInteractRef = useRef(0)
  const zoneBox = useRef(
    new THREE.Box3(
      new THREE.Vector3(
        position[0] - size[0] / 2,
        position[1] - size[1] / 2,
        position[2] - size[2] / 2
      ),
      new THREE.Vector3(
        position[0] + size[0] / 2,
        position[1] + size[1] / 2,
        position[2] + size[2] / 2
      )
    )
  )

  // Vérification proximité par frame
  useFrame(() => {
    if (disabled) return

    const playerPos = playerRef.current
    const isNow = zoneBox.current.containsPoint(playerPos)

    if (isNow && !isNearRef.current) {
      isNearRef.current = true
      onNear?.(id, labelFr)
    } else if (!isNow && isNearRef.current) {
      isNearRef.current = false
      onLeave?.(id)
    }
  })

  // Écoute touche E pour interagir
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code !== 'KeyE') return
      if (!isNearRef.current || disabled) return

      const now = Date.now()
      if (now - lastInteractRef.current < cooldownMs) return
      lastInteractRef.current = now

      onInteract?.(id, type)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [id, type, disabled, cooldownMs, onInteract])

  // Debug wireframe optionnel
  if (!debug) return null

  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color="#00ff00"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  )
})