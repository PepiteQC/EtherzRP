/**
 * useTheftDetection.ts
 * Hook React — surveillance vol en temps réel
 * Utilisé dans le système 3D pour analyser le joueur/NPCs
 */

import { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { analyzeEntity, detectAndReport } from '../theftDetection'
import { useSecurityStore } from '../securityStore'
import type { TheftRisk, CameraId } from '../types'

interface TheftDetectionOptions {
  /** Interval d'analyse en secondes */
  analyzeInterval?: number
  /** Caméra associée */
  cameraId?:        CameraId
  /** Callback quand vol détecté */
  onTheftDetected?: (risk: TheftRisk) => void
}

interface TrackedEntity {
  id:            string
  enteredAt:     number
  position:      THREE.Vector3
  itemsViewed:   Set<string>
  itemsTaken:    Set<string>
  hasBag:        boolean
  lastAnalyzed:  number
  currentRisk:   TheftRisk
}

export function useTheftDetection(options: TheftDetectionOptions = {}) {
  const {
    analyzeInterval = 5,
    cameraId,
    onTheftDetected,
  } = options

  const entitiesRef = useRef<Map<string, TrackedEntity>>(new Map())
  const exitZoneRef = useRef<THREE.Box3>(new THREE.Box3(
    new THREE.Vector3(-2, 0, 6),
    new THREE.Vector3(2, 3, 8)
  ))

  // ── Enregistrer un entity (joueur/NPC) ──
  const trackEntity = useCallback((
    id: string,
    position: THREE.Vector3,
    hasBag = false
  ) => {
    if (!entitiesRef.current.has(id)) {
      entitiesRef.current.set(id, {
        id,
        enteredAt:    Date.now(),
        position:     position.clone(),
        itemsViewed:  new Set(),
        itemsTaken:   new Set(),
        hasBag,
        lastAnalyzed: 0,
        currentRisk:  'none',
      })
    } else {
      const entity = entitiesRef.current.get(id)!
      entity.position.copy(position)
      entity.hasBag = hasBag
    }
  }, [])

  // ── Enregistrer qu'un item a été regardé ──
  const entityViewedItem = useCallback((entityId: string, productId: string) => {
    const entity = entitiesRef.current.get(entityId)
    if (entity) entity.itemsViewed.add(productId)
  }, [])

  // ── Enregistrer qu'un item a été pris (non scanné) ──
  const entityTookItem = useCallback((entityId: string, productId: string) => {
    const entity = entitiesRef.current.get(entityId)
    if (entity) entity.itemsTaken.add(productId)
  }, [])

  // ── Retirer un entity (sorti du magasin ou transaction complétée) ──
  const untrackEntity = useCallback((id: string) => {
    entitiesRef.current.delete(id)
  }, [])

  // ── Analyse temps réel par frame ──
  useFrame((state) => {
    const now = state.clock.elapsedTime

    entitiesRef.current.forEach((entity) => {
      // Analyser seulement à intervalle
      if (now - entity.lastAnalyzed < analyzeInterval) return
      entity.lastAnalyzed = now

      const timeInStore = (Date.now() - entity.enteredAt) / 1000
      const nearExit = exitZoneRef.current.containsPoint(entity.position)
      const isRunning = false // TODO: connecter à la vélocité du joueur

      const result = analyzeEntity({
        entityId:    entity.id,
        position:    [entity.position.x, entity.position.y, entity.position.z],
        timeInStore,
        itemsViewed: Array.from(entity.itemsViewed),
        itemsTaken:  Array.from(entity.itemsTaken),
        hasBag:      entity.hasBag,
        isRunning,
        nearExit,
      })

      entity.currentRisk = result.risk

      if (result.shouldAlert && entity.itemsTaken.size > 0) {
        detectAndReport(
          {
            entityId:    entity.id,
            position:    [entity.position.x, entity.position.y, entity.position.z],
            timeInStore,
            itemsViewed: Array.from(entity.itemsViewed),
            itemsTaken:  Array.from(entity.itemsTaken),
            hasBag:      entity.hasBag,
            isRunning,
            nearExit,
          },
          cameraId
        )
        onTheftDetected?.(result.risk)
      }
    })
  })

  // ── Getters ──
  const getEntityRisk = useCallback((id: string): TheftRisk => {
    return entitiesRef.current.get(id)?.currentRisk ?? 'none'
  }, [])

  const getTrackedCount = useCallback((): number => {
    return entitiesRef.current.size
  }, [])

  return {
    trackEntity,
    untrackEntity,
    entityViewedItem,
    entityTookItem,
    getEntityRisk,
    getTrackedCount,
  }
}