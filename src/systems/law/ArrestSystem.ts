/**
 * ArrestSystem.ts
 * Procédure d'arrestation complète
 * Police → Ordre → Mains en l'air → Menottage → Escorte → Véhicule → Cellule
 */

import type { CharacterState } from '../character/CharacterStateMachine'
import { grabController, type GrabType } from '../character/GrabController'
import * as THREE from 'three'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ArrestPhase =
  | 'approaching'      // S'approche du suspect
  | 'order_to_stop'    // "Police! Ne bougez pas!"
  | 'hands_up'         // Mains en l'air
  | 'compliance'       // Suspect coopère
  | 'resistance'       // Suspect résiste
  | 'cuffing'          // Menottage en cours
  | 'cuffed'           // Menotté
  | 'escorting'        // Escorte vers véhicule
  | 'vehicle_loading'  // Placement dans véhicule
  | 'secured'          // Sécurisé (en cellule ou véhicule)

export type ResistanceLevel =
  | 'none'             // Pas de résistance
  | 'verbal'           // Verbal seulement
  | 'passive'          // Résistance passive (ne bouge pas)
  | 'active'           // Résistance active (se débat)
  | 'violent'          // Violent (frappe)
  | 'fleeing'          // Fuite

export interface ArrestSession {
  sessionId:      string
  officerId:      string
  suspectId:      string
  phase:          ArrestPhase
  resistance:     ResistanceLevel
  startTime:      number
  warrantNumber?: string
  charges:        string[]
  useOfForce:     UseOfForce[]
  isCuffed:       boolean
  officerBadge?:  string
}

export interface UseOfForce {
  timestamp: number
  type:      'verbal' | 'restraint' | 'baton' | 'taser' | 'physical'
  justified: boolean
  reason:    string
}

// ─────────────────────────────────────────────
// PROBABILITÉ DE COMPLIANCE
// ─────────────────────────────────────────────

function calcComplianceProbability(params: {
  wantedLevel:    number       // 0-5 étoiles
  suspectStamina: number
  suspectState:   CharacterState
  officerCount:   number
  hasWeaponDrawn: boolean
}): number {
  let prob = 0.5

  // Plus de policiers = plus de compliance
  prob += params.officerCount * 0.1

  // Arme sortie = moins de compliance mais plus d'intimidation
  if (params.hasWeaponDrawn) prob += 0.15

  // Faible stamina = plus de compliance
  if (params.suspectStamina < 30) prob += 0.2

  // Niveau recherché élevé = moins de compliance
  prob -= params.wantedLevel * 0.08

  // États vulnérables
  if (['TASED', 'KNOCKDOWN', 'UNCONSCIOUS'].includes(params.suspectState)) {
    prob = 0.95
  }
  if (params.suspectState === 'HANDS_UP') prob = 0.85

  return Math.max(0.05, Math.min(0.95, prob))
}

// ─────────────────────────────────────────────
// ARREST SYSTEM
// ─────────────────────────────────────────────

export class ArrestSystem {
  private activeSessions: Map<string, ArrestSession> = new Map() // suspectId → session

  // ── Initier une arrestation ───────────────────

  initiateArrest(params: {
    officerId:    string
    suspectId:    string
    charges:      string[]
    warrantNo?:   string
    officerBadge?: string
  }): ArrestSession {
    const session: ArrestSession = {
      sessionId:     `arrest_${Date.now()}_${params.suspectId.slice(0, 6)}`,
      officerId:     params.officerId,
      suspectId:     params.suspectId,
      phase:         'approaching',
      resistance:    'none',
      startTime:     Date.now(),
      warrantNumber: params.warrantNo,
      charges:       params.charges,
      useOfForce:    [],
      isCuffed:      false,
      officerBadge:  params.officerBadge,
    }

    this.activeSessions.set(params.suspectId, session)
    return session
  }

  // ── Donner ordre ──────────────────────────────

  issueOrderToStop(suspectId: string): {
    session:         ArrestSession | null
    complianceCheck: number
  } {
    const session = this.activeSessions.get(suspectId)
    if (!session) return { session: null, complianceCheck: 0 }

    this.updatePhase(suspectId, 'order_to_stop')

    return {
      session,
      complianceCheck: Math.random(),
    }
  }

  // ── Demander mains en l'air ───────────────────

  requestHandsUp(suspectId: string): boolean {
    const session = this.activeSessions.get(suspectId)
    if (!session) return false
    this.updatePhase(suspectId, 'hands_up')
    return true
  }

  // ── Résistance du suspect ──────────────────────

  handleResistance(
    suspectId: string,
    level: ResistanceLevel,
    suspectState: CharacterState
  ): {
    allowedForce:  UseOfForce['type'][]
    recommendation: string
  } {
    const session = this.activeSessions.get(suspectId)
    if (!session) return { allowedForce: [], recommendation: '' }

    this.activeSessions.set(suspectId, {
      ...session,
      phase:      'resistance',
      resistance: level,
    })

    // Force autorisée selon résistance
    const allowedForce: UseOfForce['type'][] = []
    let recommendation = ''

    switch (level) {
      case 'none':
      case 'verbal':
        allowedForce.push('verbal', 'restraint')
        recommendation = 'Verbal commands only. Proceed to cuffing.'
        break

      case 'passive':
        allowedForce.push('verbal', 'restraint', 'physical')
        recommendation = 'Guide suspect to compliant position.'
        break

      case 'active':
        allowedForce.push('verbal', 'restraint', 'physical', 'taser')
        recommendation = 'Physical restraint authorized. Taser if needed.'
        break

      case 'violent':
        allowedForce.push('verbal', 'restraint', 'physical', 'taser', 'baton')
        recommendation = 'All non-lethal force authorized.'
        break

      case 'fleeing':
        allowedForce.push('verbal', 'restraint', 'physical', 'taser')
        recommendation = 'Pursue and stop. No baton during pursuit.'
        break
    }

    return { allowedForce, recommendation }
  }

  // ── Menottage ─────────────────────────────────

  attemptCuffing(
    officerId:     string,
    suspectId:     string,
    officerPos:    THREE.Vector3,
    suspectPos:    THREE.Vector3,
    suspectState:  CharacterState
  ): { success: boolean; reason?: string } {
    const session = this.activeSessions.get(suspectId)
    if (!session || session.officerId !== officerId) {
      return { success: false, reason: 'No active arrest session' }
    }

    const dist = officerPos.distanceTo(suspectPos)
    if (dist > 1.5) {
      return { success: false, reason: 'Too far to cuff (max 1.5m)' }
    }

    // États permettant le menottage
    const cuffableStates: CharacterState[] = [
      'HANDS_UP', 'SURRENDERED', 'KNOCKDOWN', 'TASED',
      'UNCONSCIOUS', 'SOFT_RAGDOLL', 'FULL_RAGDOLL', 'GRABBED',
    ]

    if (!cuffableStates.includes(suspectState)) {
      return { success: false, reason: `Suspect must be vulnerable (current: ${suspectState})` }
    }

    // Menottage réussi
    this.activeSessions.set(suspectId, {
      ...session,
      phase:    'cuffed',
      isCuffed: true,
    })

    // Loguer utilisation de force minimale
    this.logUseOfForce(suspectId, {
      timestamp: Date.now(),
      type:      'restraint',
      justified: true,
      reason:    `Cuffed during ${session.phase} phase`,
    })

    return { success: true }
  }

  // ── Loguer usage de la force ──────────────────

  logUseOfForce(suspectId: string, force: UseOfForce): void {
    const session = this.activeSessions.get(suspectId)
    if (!session) return
    this.activeSessions.set(suspectId, {
      ...session,
      useOfForce: [...session.useOfForce, force],
    })
  }

  // ── Escorte ───────────────────────────────────

  startEscort(
    officerId:  string,
    suspectId:  string,
    officerPos: THREE.Vector3,
    suspectPos: THREE.Vector3
  ): boolean {
    const session = this.activeSessions.get(suspectId)
    if (!session?.isCuffed) return false

    const grabResult = grabController.attemptGrab({
      actorId:      officerId,
      targetId:     suspectId,
      actorPos:     officerPos,
      targetPos:    suspectPos,
      targetState:  'RESTRAINED',
      targetStamina: 0,
      actorStrength: 80,
      grabType:     'both_wrists',
      actorRole:    'police',
      hasHandcuffs:  true,
    })

    if (grabResult.success) {
      this.updatePhase(suspectId, 'escorting')
      grabController.startEscort(grabResult.session!.sessionId, 'escort_right')
    }

    return grabResult.success
  }

  // ── Placement véhicule ────────────────────────

  placeInVehicle(
    suspectId: string,
    vehicleId: string,
    seatIndex: number
  ): boolean {
    const session = this.activeSessions.get(suspectId)
    if (!session?.isCuffed) return false

    this.updatePhase(suspectId, 'vehicle_loading')

    // Relâcher le grab — le véhicule prend le relai
    grabController.releaseTarget(session.officerId)

    setTimeout(() => {
      this.updatePhase(suspectId, 'secured')
    }, 2000)

    return true
  }

  // ── Terminer arrestation ──────────────────────

  completeArrest(suspectId: string): ArrestSession | null {
    const session = this.activeSessions.get(suspectId)
    if (!session) return null
    this.activeSessions.delete(suspectId)
    return session
  }

  cancelArrest(suspectId: string, reason: string): void {
    this.activeSessions.delete(suspectId)
  }

  // ── Helpers ───────────────────────────────────

  getSession(suspectId: string): ArrestSession | undefined {
    return this.activeSessions.get(suspectId)
  }

  isUnderArrest(suspectId: string): boolean {
    return this.activeSessions.has(suspectId)
  }

  private updatePhase(suspectId: string, phase: ArrestPhase): void {
    const session = this.activeSessions.get(suspectId)
    if (!session) return
    this.activeSessions.set(suspectId, { ...session, phase })
  }
}

export const arrestSystem = new ArrestSystem()