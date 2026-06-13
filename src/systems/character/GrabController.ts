/**
 * GrabController.ts
 * Système de prise, escorte, transport de personnages
 * Police, gangs, joueurs
 */

import * as THREE from 'three'
import type { CharacterState } from './CharacterStateMachine'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type GrabType =
  | 'wrist_right'     // Poignet droit
  | 'wrist_left'      // Poignet gauche
  | 'collar'          // Collet
  | 'shoulder'        // Épaule
  | 'both_wrists'     // Les deux poignets (menotté)
  | 'body_tackle'     // Plaquage complet
  | 'bear_hug'        // Prise en ours
  | 'choke_hold'      // Prise au cou

export type CarryType =
  | 'fireman_carry'   // Sur l'épaule (pompier)
  | 'princess_carry'  // Dans les bras
  | 'drag_ground'     // Traîner au sol
  | 'drag_standing'   // Traîner debout
  | 'escort_right'    // Escorter à droite
  | 'escort_left'     // Escorter à gauche

export interface GrabSession {
  sessionId:    string
  actorId:      string        // Qui tient
  targetId:     string        // Qui est tenu
  grabType:     GrabType
  carryType?:   CarryType
  startTime:    number
  attachOffset: THREE.Vector3 // Offset relatif à l'acteur
  maxDuration?: number        // ms max de la prise
}

// ─────────────────────────────────────────────
// CONDITIONS DE GRAB
// ─────────────────────────────────────────────

interface GrabAttemptParams {
  actorId:      string
  targetId:     string
  actorPos:     THREE.Vector3
  targetPos:    THREE.Vector3
  targetState:  CharacterState
  targetStamina: number
  actorStrength: number       // 0-100
  grabType:     GrabType
  actorRole?:   'police' | 'gang' | 'civilian'
  hasHandcuffs?: boolean
}

interface GrabAttemptResult {
  success:     boolean
  reason?:     string
  session?:    GrabSession
  targetNewState: CharacterState
}

// ─────────────────────────────────────────────
// GRAB CONTROLLER
// ─────────────────────────────────────────────

export class GrabController {
  private activeSessions: Map<string, GrabSession> = new Map() // targetId → session
  private cooldowns: Map<string, number> = new Map()           // actorId → timestamp

  // ── Tentative de prise ────────────────────────

  attemptGrab(params: GrabAttemptParams): GrabAttemptResult {
    const {
      actorId, targetId, actorPos, targetPos,
      targetState, targetStamina, grabType, actorRole,
    } = params

    // Cooldown acteur
    const lastGrab = this.cooldowns.get(actorId) ?? 0
    if (Date.now() - lastGrab < 3000) {
      return { success: false, reason: 'Grab cooldown active', targetNewState: targetState }
    }

    // Distance
    const dist = actorPos.distanceTo(targetPos)
    const maxDist = grabType === 'body_tackle' ? 3.0 : 1.5
    if (dist > maxDist) {
      return { success: false, reason: `Too far (${dist.toFixed(1)}m, max ${maxDist}m)`, targetNewState: targetState }
    }

    // Cible déjà tenue?
    if (this.activeSessions.has(targetId)) {
      return { success: false, reason: 'Target already grabbed', targetNewState: targetState }
    }

    // Vérifier vulnérabilité de la cible
    const isVulnerable = this.isTargetVulnerable(targetState, targetStamina, grabType)
    if (!isVulnerable.ok) {
      return { success: false, reason: isVulnerable.reason, targetNewState: targetState }
    }

    // Autorisation par rôle
    const choke_restricted = grabType === 'choke_hold' && actorRole === 'police'
    if (choke_restricted) {
      return { success: false, reason: 'Police cannot use choke hold', targetNewState: targetState }
    }

    // Créer la session
    const session: GrabSession = {
      sessionId:    `grab_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      actorId,
      targetId,
      grabType,
      startTime:    Date.now(),
      attachOffset: this.getAttachOffset(grabType),
      maxDuration:  grabType === 'choke_hold' ? 8000 : undefined,
    }

    this.activeSessions.set(targetId, session)
    this.cooldowns.set(actorId, Date.now())

    const targetNewState: CharacterState =
      grabType === 'body_tackle' ? 'FULL_RAGDOLL'
      : grabType === 'bear_hug' || grabType === 'choke_hold' ? 'RESTRAINED'
      : 'GRABBED'

    return { success: true, session, targetNewState }
  }

  // ── Démarrer escort ──────────────────────────

  startEscort(
    sessionId: string,
    carryType: CarryType
  ): boolean {
    // Trouver la session
    for (const [targetId, session] of this.activeSessions) {
      if (session.sessionId === sessionId) {
        this.activeSessions.set(targetId, { ...session, carryType })
        return true
      }
    }
    return false
  }

  // ── Relâcher ────────────────────────────────

  releaseTarget(actorId: string): {
    released: boolean
    targetId?: string
    newTargetState: CharacterState
  } {
    for (const [targetId, session] of this.activeSessions) {
      if (session.actorId === actorId) {
        this.activeSessions.delete(targetId)

        const newState: CharacterState =
          session.grabType === 'body_tackle' ? 'KNOCKDOWN'
          : session.carryType === 'drag_ground' ? 'KNOCKDOWN'
          : 'STAGGER'

        return { released: true, targetId, newTargetState: newState }
      }
    }
    return { released: false, newTargetState: 'NORMAL' }
  }

  // ── Calculer position cible ──────────────────

  computeTargetPosition(
    session: GrabSession,
    actorPosition: THREE.Vector3,
    actorRotation: THREE.Euler
  ): THREE.Vector3 {
    const worldOffset = session.attachOffset.clone()
    worldOffset.applyEuler(actorRotation)
    return actorPosition.clone().add(worldOffset)
  }

  // ── Helpers ───────────────────────────────────

  getSession(targetId: string): GrabSession | undefined {
    return this.activeSessions.get(targetId)
  }

  getSessionByActor(actorId: string): GrabSession | undefined {
    for (const session of this.activeSessions.values()) {
      if (session.actorId === actorId) return session
    }
    return undefined
  }

  isGrabbed(targetId: string): boolean {
    return this.activeSessions.has(targetId)
  }

  private isTargetVulnerable(
    state: CharacterState,
    stamina: number,
    grabType: GrabType
  ): { ok: boolean; reason?: string } {
    // États toujours vulnérables
    const alwaysVulnerable: CharacterState[] = [
      'STAGGER', 'STUMBLE', 'KNOCKDOWN', 'SOFT_RAGDOLL',
      'FULL_RAGDOLL', 'TASED', 'UNCONSCIOUS', 'HANDS_UP', 'SURRENDERED',
    ]
    if (alwaysVulnerable.includes(state)) return { ok: true }

    // Plaquage — toujours possible à courte portée
    if (grabType === 'body_tackle') return { ok: true }

    // En état normal — stamina doit être basse
    if (state === 'NORMAL' && stamina > 25) {
      return { ok: false, reason: `Target too alert (stamina: ${stamina})` }
    }

    return { ok: true }
  }

  private getAttachOffset(grabType: GrabType): THREE.Vector3 {
    const offsets: Record<GrabType, [number, number, number]> = {
      wrist_right:  [0.6, 0.8, 0.3],
      wrist_left:   [-0.6, 0.8, 0.3],
      collar:       [0, 1.4, 0.4],
      shoulder:     [0.4, 1.2, 0.3],
      both_wrists:  [0, 0.8, 0.4],
      body_tackle:  [0, 0.8, 0],
      bear_hug:     [0, 0.9, 0.1],
      choke_hold:   [0, 1.3, 0.2],
    }
    return new THREE.Vector3(...offsets[grabType])
  }
}

export const grabController = new GrabController()