import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  DoorAccessRequest,
  DoorEventPayload,
  EtherPlayer,
  EtherWorldState,
  OnlineSocketPlayer,
  RPAlertPayload,
  ServerHealth,
  Vec3,
} from '../types/etherServer'
import {
  checkDoorAccess,
  getServerHealth,
  getWorldState,
  loadPlayer,
  savePlayer,
  sendDoorEvent,
} from '../lib/serverApi'
import {
  connectSocket,
  disconnectSocket,
  emitDoorEvent,
  emitRPAlert,
  joinWorld,
  onDoorEvent,
  onPlayerMoved,
  onPlayersOnline,
  onRPAlert,
  onServerReady,
  sendPlayerMove,
} from '../lib/socketClient'

type UseEtherServerOptions = {
  enabled?: boolean
  autoConnectSocket?: boolean
  autoLoadWorld?: boolean
  autoJoinWorld?: boolean
  autoLoadPlayer?: boolean
  autoSaveIntervalMs?: number

  getFirebaseToken?: () => Promise<string | null>
  playerName?: string
  uid?: string
  zone?: string
  initialPosition?: Vec3
}

type UseEtherServerState = {
  connected: boolean
  loading: boolean
  error: string | null

  health: ServerHealth | null
  world: EtherWorldState | null
  player: EtherPlayer | null

  onlineCount: number
  onlinePlayers: OnlineSocketPlayer[]

  lastAlert: RPAlertPayload | null
  lastDoorEvent: DoorEventPayload | null
  lastRemotePlayerMove: OnlineSocketPlayer | null
}

export function useEtherServer(options: UseEtherServerOptions = {}) {
  const {
    enabled = true,
    autoConnectSocket = true,
    autoLoadWorld = true,
    autoJoinWorld = true,
    autoLoadPlayer = false,
    autoSaveIntervalMs = 15000,

    getFirebaseToken,
    playerName = 'Citoyen',
    uid,
    zone = 'Quebec',
    initialPosition = { x: 0, y: 1, z: 0 },
  } = options

  const [state, setState] = useState<UseEtherServerState>({
    connected: false,
    loading: false,
    error: null,

    health: null,
    world: null,
    player: null,

    onlineCount: 0,
    onlinePlayers: [],

    lastAlert: null,
    lastDoorEvent: null,
    lastRemotePlayerMove: null,
  })

  const latestPlayerRef = useRef<Partial<EtherPlayer> | null>(null)

  const setError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)

    setState((prev) => ({
      ...prev,
      error: message,
      loading: false,
    }))
  }, [])

  const refreshHealth = useCallback(async () => {
    try {
      const health = await getServerHealth()

      setState((prev) => ({
        ...prev,
        health,
        connected: Boolean(health.ok && health.live),
        error: null,
      }))

      return health
    } catch (error) {
      setError(error)
      return null
    }
  }, [setError])

  const refreshWorld = useCallback(async () => {
    try {
      const result = await getWorldState()

      setState((prev) => ({
        ...prev,
        world: result.world,
        error: null,
      }))

      return result.world
    } catch (error) {
      setError(error)
      return null
    }
  }, [setError])

  const refreshPlayer = useCallback(async () => {
    try {
      if (!getFirebaseToken) return null

      const token = await getFirebaseToken()

      if (!token) return null

      const result = await loadPlayer(token)

      setState((prev) => ({
        ...prev,
        player: result.player,
        error: null,
      }))

      latestPlayerRef.current = result.player || null

      return result.player
    } catch (error) {
      setError(error)
      return null
    }
  }, [getFirebaseToken, setError])

  const saveCurrentPlayer = useCallback(
    async (playerPatch: Partial<EtherPlayer>) => {
      try {
        if (!getFirebaseToken) return null

        const token = await getFirebaseToken()

        if (!token) return null

        latestPlayerRef.current = {
          ...(latestPlayerRef.current || {}),
          ...playerPatch,
        }

        const result = await savePlayer(token, latestPlayerRef.current)

        setState((prev) => ({
          ...prev,
          player: result.player,
          error: null,
        }))

        return result.player
      } catch (error) {
        setError(error)
        return null
      }
    },
    [getFirebaseToken, setError]
  )

  const checkDoor = useCallback(
    async (payload: DoorAccessRequest) => {
      try {
        if (!getFirebaseToken) {
          return {
            ok: false,
            granted: false,
            doorId: payload.doorId,
            zone: payload.zone || zone,
            playerRole: 'guest',
            requiredRole: payload.requiredRole || 'resident',
            message: 'Firebase token missing',
          }
        }

        const token = await getFirebaseToken()

        if (!token) {
          return {
            ok: false,
            granted: false,
            doorId: payload.doorId,
            zone: payload.zone || zone,
            playerRole: 'guest',
            requiredRole: payload.requiredRole || 'resident',
            message: 'Firebase token missing',
          }
        }

        return await checkDoorAccess(token, payload)
      } catch (error) {
        setError(error)

        return {
          ok: false,
          granted: false,
          doorId: payload.doorId,
          zone: payload.zone || zone,
          playerRole: 'unknown',
          requiredRole: payload.requiredRole || 'resident',
          message: error instanceof Error ? error.message : String(error),
        }
      }
    },
    [getFirebaseToken, setError, zone]
  )

  const saveDoorEventToServer = useCallback(
    async (payload: DoorEventPayload) => {
      emitDoorEvent(payload)

      try {
        if (!getFirebaseToken) return null

        const token = await getFirebaseToken()

        if (!token) return null

        return await sendDoorEvent(token, payload)
      } catch (error) {
        setError(error)
        return null
      }
    },
    [getFirebaseToken, setError]
  )

  const join = useCallback(
    (payload?: {
      uid?: string
      name?: string
      zone?: string
      position?: Vec3
    }) => {
      joinWorld({
        uid: payload?.uid || uid,
        name: payload?.name || playerName,
        zone: payload?.zone || zone,
        position: payload?.position || initialPosition,
      })
    },
    [initialPosition, playerName, uid, zone]
  )

  const sendMove = useCallback(
    (payload: {
      position: Vec3
      rotation?: Vec3
      zone?: string
      vehicleId?: string | null
    }) => {
      sendPlayerMove({
        ...payload,
        zone: payload.zone || zone,
      })
    },
    [zone]
  )

  const alertRP = useCallback((payload: RPAlertPayload) => {
    emitRPAlert(payload)
  }, [])

  useEffect(() => {
    if (!enabled) return

    let alive = true

    async function boot() {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }))

      await refreshHealth()

      if (autoLoadWorld) {
        await refreshWorld()
      }

      if (autoLoadPlayer) {
        await refreshPlayer()
      }

      if (!alive) return

      if (autoConnectSocket) {
        connectSocket()

        if (autoJoinWorld) {
          join()
        }
      }

      setState((prev) => ({
        ...prev,
        loading: false,
      }))
    }

    boot().catch(setError)

    return () => {
      alive = false
    }
  }, [
    enabled,
    autoConnectSocket,
    autoJoinWorld,
    autoLoadPlayer,
    autoLoadWorld,
    join,
    refreshHealth,
    refreshPlayer,
    refreshWorld,
    setError,
  ])

  useEffect(() => {
    if (!enabled || !autoConnectSocket) return

    const offReady = onServerReady(() => {
      setState((prev) => ({
        ...prev,
        connected: true,
      }))
    })

    const offPlayers = onPlayersOnline((payload) => {
      setState((prev) => ({
        ...prev,
        onlineCount: payload.count,
        onlinePlayers: payload.players,
      }))
    })

    const offMoved = onPlayerMoved((player) => {
      setState((prev) => ({
        ...prev,
        lastRemotePlayerMove: player,
      }))
    })

    const offDoor = onDoorEvent((payload) => {
      setState((prev) => ({
        ...prev,
        lastDoorEvent: payload,
      }))
    })

    const offAlert = onRPAlert((payload) => {
      setState((prev) => ({
        ...prev,
        lastAlert: payload,
      }))
    })

    return () => {
      offReady()
      offPlayers()
      offMoved()
      offDoor()
      offAlert()
    }
  }, [enabled, autoConnectSocket])

  useEffect(() => {
    if (!enabled || !getFirebaseToken || autoSaveIntervalMs <= 0) return

    const interval = window.setInterval(() => {
      if (!latestPlayerRef.current) return
      saveCurrentPlayer(latestPlayerRef.current)
    }, autoSaveIntervalMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [autoSaveIntervalMs, enabled, getFirebaseToken, saveCurrentPlayer])

  useEffect(() => {
    return () => {
      disconnectSocket()
    }
  }, [])

  return {
    ...state,

    refreshHealth,
    refreshWorld,
    refreshPlayer,

    saveCurrentPlayer,
    checkDoor,
    saveDoorEventToServer,

    join,
    sendMove,
    alertRP,
  }
}
