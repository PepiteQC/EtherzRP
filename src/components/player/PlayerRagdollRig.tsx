/**
 * PlayerRagdollRig.tsx
 * Rig physique Rapier pour le ragdoll
 * - 12 parties du corps reliées par joints
 * - Activation/désactivation selon l'état du personnage
 * - Synchronisation bones → rigid bodies
 */

import { useRef, useEffect, useCallback, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  RigidBody, CuboidCollider, BallCollider,
  useRevoluteJoint, useSphericalJoint, useFixedJoint,
} from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import type { CharacterState } from '../../systems/character/CharacterStateMachine'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Vec3 = [number, number, number]

interface BodyPart {
  name:     string
  ref:      React.RefObject<RapierRigidBody>
  position: Vec3     // Position relative au pelvis
  size:     Vec3     // Taille du collider
  mass:     number
}

interface RagdollRigProps {
  characterId:  string
  position:     THREE.Vector3
  characterState: CharacterState
  isActive:     boolean
  onPartContact?: (partName: string, force: number) => void
}

// ─────────────────────────────────────────────
// PARTIES DU CORPS
// ─────────────────────────────────────────────

// Les refs sont créés dynamiquement
function createBodyPartRefs() {
  return {
    pelvis:    { current: null } as React.RefObject<RapierRigidBody>,
    spine:     { current: null } as React.RefObject<RapierRigidBody>,
    chest:     { current: null } as React.RefObject<RapierRigidBody>,
    head:      { current: null } as React.RefObject<RapierRigidBody>,
    upperArmL: { current: null } as React.RefObject<RapierRigidBody>,
    lowerArmL: { current: null } as React.RefObject<RapierRigidBody>,
    upperArmR: { current: null } as React.RefObject<RapierRigidBody>,
    lowerArmR: { current: null } as React.RefObject<RapierRigidBody>,
    upperLegL: { current: null } as React.RefObject<RapierRigidBody>,
    lowerLegL: { current: null } as React.RefObject<RapierRigidBody>,
    upperLegR: { current: null } as React.RefObject<RapierRigidBody>,
    lowerLegR: { current: null } as React.RefObject<RapierRigidBody>,
  }
}

// ─────────────────────────────────────────────
// RAGDOLL RIG
// ─────────────────────────────────────────────

export const PlayerRagdollRig = memo(function PlayerRagdollRig({
  characterId,
  position,
  characterState,
  isActive,
  onPartContact,
}: RagdollRigProps) {
  const refs = useRef(createBodyPartRefs())

  // Activation / désactivation des corps physiques
  useEffect(() => {
    const allRefs = Object.values(refs.current)
    allRefs.forEach(ref => {
      if (ref.current) {
        ref.current.setEnabled(isActive)
        if (!isActive) {
          // Reset velocity quand désactivé
          ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
          ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
        }
      }
    })
  }, [isActive])

  // Appliquer force de ragdoll
  const applyImpulse = useCallback((
    partName: keyof ReturnType<typeof createBodyPartRefs>,
    force: [number, number, number],
    point?: [number, number, number]
  ) => {
    const ref = refs.current[partName]
    if (!ref.current || !isActive) return
    ref.current.applyImpulse(
      { x: force[0], y: force[1], z: force[2] },
      true
    )
  }, [isActive])

  if (!isActive) return null

  const px = position.x
  const py = position.y
  const pz = position.z

  return (
    <group>
      {/* ── PELVIS (ancre principale) ── */}
      <RigidBody
        ref={refs.current.pelvis}
        position={[px, py + 0.95, pz]}
        mass={12}
        colliders={false}
        linearDamping={0.5}
        angularDamping={0.6}
        name={`${characterId}-pelvis`}
      >
        <CuboidCollider args={[0.18, 0.12, 0.12]} />
      </RigidBody>

      {/* ── SPINE ── */}
      <RigidBody
        ref={refs.current.spine}
        position={[px, py + 1.15, pz]}
        mass={8}
        colliders={false}
        linearDamping={0.5}
        angularDamping={0.6}
        name={`${characterId}-spine`}
      >
        <CuboidCollider args={[0.12, 0.12, 0.10]} />
      </RigidBody>

      {/* ── CHEST ── */}
      <RigidBody
        ref={refs.current.chest}
        position={[px, py + 1.38, pz]}
        mass={15}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-chest`}
      >
        <CuboidCollider args={[0.2, 0.16, 0.12]} />
      </RigidBody>

      {/* ── HEAD ── */}
      <RigidBody
        ref={refs.current.head}
        position={[px, py + 1.7, pz]}
        mass={6}
        colliders={false}
        linearDamping={0.3}
        angularDamping={0.4}
        name={`${characterId}-head`}
      >
        <BallCollider args={[0.12]} />
      </RigidBody>

      {/* ── UPPER ARM LEFT ── */}
      <RigidBody
        ref={refs.current.upperArmL}
        position={[px - 0.32, py + 1.38, pz]}
        mass={4}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-upperArmL`}
      >
        <CuboidCollider args={[0.08, 0.16, 0.08]} />
      </RigidBody>

      {/* ── LOWER ARM LEFT ── */}
      <RigidBody
        ref={refs.current.lowerArmL}
        position={[px - 0.32, py + 1.08, pz]}
        mass={3}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-lowerArmL`}
      >
        <CuboidCollider args={[0.07, 0.15, 0.07]} />
      </RigidBody>

      {/* ── UPPER ARM RIGHT ── */}
      <RigidBody
        ref={refs.current.upperArmR}
        position={[px + 0.32, py + 1.38, pz]}
        mass={4}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-upperArmR`}
      >
        <CuboidCollider args={[0.08, 0.16, 0.08]} />
      </RigidBody>

      {/* ── LOWER ARM RIGHT ── */}
      <RigidBody
        ref={refs.current.lowerArmR}
        position={[px + 0.32, py + 1.08, pz]}
        mass={3}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-lowerArmR`}
      >
        <CuboidCollider args={[0.07, 0.15, 0.07]} />
      </RigidBody>

      {/* ── UPPER LEG LEFT ── */}
      <RigidBody
        ref={refs.current.upperLegL}
        position={[px - 0.1, py + 0.65, pz]}
        mass={8}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-upperLegL`}
      >
        <CuboidCollider args={[0.1, 0.22, 0.1]} />
      </RigidBody>

      {/* ── LOWER LEG LEFT ── */}
      <RigidBody
        ref={refs.current.lowerLegL}
        position={[px - 0.1, py + 0.28, pz]}
        mass={5}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-lowerLegL`}
      >
        <CuboidCollider args={[0.08, 0.2, 0.09]} />
      </RigidBody>

      {/* ── UPPER LEG RIGHT ── */}
      <RigidBody
        ref={refs.current.upperLegR}
        position={[px + 0.1, py + 0.65, pz]}
        mass={8}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-upperLegR`}
      >
        <CuboidCollider args={[0.1, 0.22, 0.1]} />
      </RigidBody>

      {/* ── LOWER LEG RIGHT ── */}
      <RigidBody
        ref={refs.current.lowerLegR}
        position={[px + 0.1, py + 0.28, pz]}
        mass={5}
        colliders={false}
        linearDamping={0.4}
        angularDamping={0.5}
        name={`${characterId}-lowerLegR`}
      >
        <CuboidCollider args={[0.08, 0.2, 0.09]} />
      </RigidBody>

      {/* ── JOINTS ── */}
      {/* Note: les joints sont déclarés comme hooks dans des sous-composants */}
      <RagdollJoints refs={refs.current} />
    </group>
  )
})

// ─────────────────────────────────────────────
// RAGDOLL JOINTS — composant séparé pour les hooks
// ─────────────────────────────────────────────

interface JointsProps {
  refs: ReturnType<typeof createBodyPartRefs>
}

const RagdollJoints = memo(function RagdollJoints({ refs }: JointsProps) {
  // Hanche — pelvis ↔ spine (sphérique, liberté limitée)
  useSphericalJoint(refs.pelvis, refs.spine, [
    [0, 0.12, 0],   // point sur pelvis
    [0, -0.12, 0],  // point sur spine
  ])

  // Colonne — spine ↔ chest
  useSphericalJoint(refs.spine, refs.chest, [
    [0, 0.12, 0],
    [0, -0.16, 0],
  ])

  // Cou — chest ↔ head
  useSphericalJoint(refs.chest, refs.head, [
    [0, 0.16, 0],
    [0, -0.12, 0],
  ])

  // Épaule gauche — chest ↔ upperArmL
  useSphericalJoint(refs.chest, refs.upperArmL, [
    [-0.2, 0.08, 0],
    [0.08, 0.16, 0],
  ])

  // Coude gauche — upperArmL ↔ lowerArmL (révolution)
  useRevoluteJoint(refs.upperArmL, refs.lowerArmL, [
    [0, -0.16, 0],
    [0, 0.15, 0],
    [1, 0, 0],  // axe de rotation
  ])

  // Épaule droite
  useSphericalJoint(refs.chest, refs.upperArmR, [
    [0.2, 0.08, 0],
    [-0.08, 0.16, 0],
  ])

  // Coude droit
  useRevoluteJoint(refs.upperArmR, refs.lowerArmR, [
    [0, -0.16, 0],
    [0, 0.15, 0],
    [1, 0, 0],
  ])

  // Hanche gauche — pelvis ↔ upperLegL
  useSphericalJoint(refs.pelvis, refs.upperLegL, [
    [-0.1, -0.12, 0],
    [0, 0.22, 0],
  ])

  // Genou gauche — upperLegL ↔ lowerLegL (révolution)
  useRevoluteJoint(refs.upperLegL, refs.lowerLegL, [
    [0, -0.22, 0],
    [0, 0.2, 0],
    [1, 0, 0],
  ])

  // Hanche droite
  useSphericalJoint(refs.pelvis, refs.upperLegR, [
    [0.1, -0.12, 0],
    [0, 0.22, 0],
  ])

  // Genou droit
  useRevoluteJoint(refs.upperLegR, refs.lowerLegR, [
    [0, -0.22, 0],
    [0, 0.2, 0],
    [1, 0, 0],
  ])

  return null
})