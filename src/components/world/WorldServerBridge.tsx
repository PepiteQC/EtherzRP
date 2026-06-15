import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type {
  DoorEventPayload,
  EtherPlayer,
  OnlineSocketPlayer,
  RPAlertPayload,
  Vec3,
} from '../../types/etherServer'
import { useEtherServerContext } from '../../context/EtherServerContext'

export type PlayerServerSnapshot = {
  uid?: string
  name?: string
  position: Vec3
  rotation?: Vec3
  zone?: string
  vehicleId?: string | null

  health?: number
  armor?: number
  stamina?: number
  hunger?: number
  thirst?: number

  cash?: number
  bank?: number
  job?: string
  rank?: string
  role?: string
}

type WorldServerBridgeProps = {
  enabled?: boolean

  zone?: string
  playerName?: string

  sendMoveEveryMs?: number
  savePlayerEveryMs?: number

  getPlayerSnapshot?: () => PlayerServerSnapshot | null

  onRemotePlayerMove?: (player: OnlineSocketPlayer) => void
  onDoorEvent?: (payload: DoorEventPayload) => void
  onAlert?: (payload: RPAlertPayload) => void
}

function toEtherPlayerPatch(snapshot: PlayerServerSnapshot): Partial<EtherPlayer> {
  return {
    uid: snapshot.uid || 'local',
    name: snapshot.name || 'Citoyen',

    position: snapshot.position,
    rotation: snapshot.rotation || { x: 0, y: 0, z: 0 },

    health: snapshot.health ?? 100,
    armor: snapshot.armor ?? 0,
    stamina: snapshot.stamina ?? 100,
    hunger: snapshot.hunger ?? 100,
    thirst: snapshot.thirst ?? 100,

    cash: snapshot.cash ?? 0,
    bank: snapshot.bank ?? 0,

    job: snapshot.job || 'Citoyen',
    rank: snapshot.rank || 'Civil',
    role: snapshot.role || 'citizen',
    zone: snapshot.zone || 'Quebec',
  }
}

export function WorldServerBridge({
  enabled = true,

  zone = 'Quebec',
  playerName = 'Citoyen',

  sendMoveEveryMs = 120,
  savePlayerEveryMs = 15000,

  getPlayerSnapshot,

  onRemotePlayerMove,
  onDoorEvent,
  onAlert,
}: WorldServerBridgeProps) {
  const ether = useEtherServerContext()

  const lastMoveAtRef = useRef(0)
  const latestSnapshotRef = useRef<PlayerServerSnapshot | null>(null)
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (joinedRef.current) return

    const snapshot = getPlayerSnapshot?.()

    ether.join({
      uid: snapshot?.uid,
      name: snapshot?.name || playerName,
      zone: snapshot?.zone || zone,
      position: snapshot?.position || { x: 0, y: 1, z: 0 },
    })

    joinedRef.current = true
  }, [enabled, ether, getPlayerSnapshot, playerName, zone])

  useFrame(() => {
    if (!enabled) return
    if (!getPlayerSnapshot) return

    const now = performance.now()

    if (now - lastMoveAtRef.current < sendMoveEveryMs) return

    const snapshot = getPlayerSnapshot()

    if (!snapshot?.position) return

    latestSnapshotRef.current = snapshot
    lastMoveAtRef.current = now

    ether.sendMove({
      position: snapshot.position,
      rotation: snapshot.rotation,
      zone: snapshot.zone || zone,
      vehicleId: snapshot.vehicleId || null,
    })
  })

  useEffect(() => {
    if (!enabled) return
    if (!getPlayerSnapshot) return
    if (savePlayerEveryMs <= 0) return

    const interval = window.setInterval(() => {
      const snapshot = getPlayerSnapshot()

      if (!snapshot?.position) return

      latestSnapshotRef.current = snapshot

      ether.saveCurrentPlayer(toEtherPlayerPatch(snapshot))
    }, savePlayerEveryMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [enabled, ether, getPlayerSnapshot, savePlayerEveryMs])

  useEffect(() => {
    if (!enabled) return
    if (!ether.lastRemotePlayerMove) return

    onRemotePlayerMove?.(ether.lastRemotePlayerMove)
  }, [enabled, ether.lastRemotePlayerMove, onRemotePlayerMove])

  useEffect(() => {
    if (!enabled) return
    if (!ether.lastDoorEvent) return

    onDoorEvent?.(ether.lastDoorEvent)
  }, [enabled, ether.lastDoorEvent, onDoorEvent])

  useEffect(() => {
    if (!enabled) return
    if (!ether.lastAlert) return

    onAlert?.(ether.lastAlert)
  }, [enabled, ether.lastAlert, onAlert])

  return null
}
