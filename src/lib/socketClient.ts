import { io, type Socket } from 'socket.io-client'
import type {
  DoorEventPayload,
  OnlineSocketPlayer,
  RPAlertPayload,
  Vec3,
} from '../types/etherServer'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 700,
    })
  }

  return socket
}

export function connectSocket() {
  const s = getSocket()

  if (!s.connected) {
    s.connect()
  }

  return s
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}

export function joinWorld(payload: {
  uid?: string
  name?: string
  zone?: string
  position?: Vec3
  rotation?: Vec3
  vehicleId?: string | null
}) {
  const s = connectSocket()

  s.emit('player:join', {
    uid: payload.uid,
    name: payload.name || 'Citoyen',
    zone: payload.zone || 'Quebec',
    position: payload.position || { x: 0, y: 1, z: 0 },
    rotation: payload.rotation || { x: 0, y: 0, z: 0 },
    vehicleId: payload.vehicleId || null,
  })
}

export function sendPlayerMove(payload: {
  position: Vec3
  rotation?: Vec3
  zone?: string
  vehicleId?: string | null
}) {
  const s = getSocket()

  if (!s.connected) return

  s.emit('player:move', payload)
}

export function emitDoorEvent(payload: DoorEventPayload) {
  const s = getSocket()

  if (!s.connected) return

  s.emit('door:event', payload)
}

export function emitRPAlert(payload: RPAlertPayload) {
  const s = getSocket()

  if (!s.connected) return

  s.emit('rp:alert', payload)
}

export function onServerReady(callback: (payload: unknown) => void) {
  const s = getSocket()
  s.on('server:ready', callback)

  return () => {
    s.off('server:ready', callback)
  }
}

export function onPlayersOnline(
  callback: (payload: {
    count: number
    players: OnlineSocketPlayer[]
  }) => void
) {
  const s = getSocket()
  s.on('players:online', callback)

  return () => {
    s.off('players:online', callback)
  }
}

export function onPlayerMoved(callback: (player: OnlineSocketPlayer) => void) {
  const s = getSocket()
  s.on('player:moved', callback)

  return () => {
    s.off('player:moved', callback)
  }
}

export function onDoorEvent(callback: (payload: DoorEventPayload) => void) {
  const s = getSocket()
  s.on('door:event', callback)

  return () => {
    s.off('door:event', callback)
  }
}

export function onRPAlert(callback: (payload: RPAlertPayload) => void) {
  const s = getSocket()
  s.on('rp:alert', callback)

  return () => {
    s.off('rp:alert', callback)
  }
}
