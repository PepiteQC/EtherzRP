import type {
  DoorAccessRequest,
  DoorAccessResponse,
  DoorEventPayload,
  EtherPlayer,
  EtherWorldState,
  RPAlertPayload,
  ServerHealth,
} from '../types/etherServer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

type RequestOptions = RequestInit & {
  token?: string | null
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers = new Headers(fetchOptions.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.message || data?.error || `API error ${res.status}`)
  }

  return data as T
}

export async function getServerHealth() {
  return request<ServerHealth>('/health')
}

export async function getWorldState() {
  return request<{
    ok: boolean
    source: 'firestore' | 'local_fallback'
    world: EtherWorldState
  }>('/api/world/state')
}

export async function updateWorldState(
  firebaseToken: string,
  world: Partial<EtherWorldState>
) {
  return request<{
    ok: boolean
    world: EtherWorldState
  }>('/api/world/state', {
    method: 'POST',
    token: firebaseToken,
    body: JSON.stringify(world),
  })
}

export async function loadPlayer(firebaseToken: string) {
  return request<{
    ok: boolean
    exists: boolean
    player: EtherPlayer | null
  }>('/api/player/load', {
    method: 'GET',
    token: firebaseToken,
  })
}

export async function savePlayer(
  firebaseToken: string,
  playerData: Partial<EtherPlayer>
) {
  return request<{
    ok: boolean
    player: EtherPlayer
  }>('/api/player/save', {
    method: 'POST',
    token: firebaseToken,
    body: JSON.stringify(playerData),
  })
}

export async function checkDoorAccess(
  firebaseToken: string,
  payload: DoorAccessRequest
) {
  return request<DoorAccessResponse>('/api/doors/check', {
    method: 'POST',
    token: firebaseToken,
    body: JSON.stringify(payload),
  })
}

export async function sendDoorEvent(
  firebaseToken: string,
  payload: DoorEventPayload
) {
  return request<{
    ok: boolean
    id: string
    event: DoorEventPayload
  }>('/api/doors/event', {
    method: 'POST',
    token: firebaseToken,
    body: JSON.stringify(payload),
  })
}

export async function logAccess(
  firebaseToken: string,
  accessData: {
    type?: string
    target?: string
    granted?: boolean
    reason?: string | null
    zone?: string
  }
) {
  return request<{
    ok: boolean
    id: string
    log: unknown
  }>('/api/access/log', {
    method: 'POST',
    token: firebaseToken,
    body: JSON.stringify(accessData),
  })
}

export async function sendServerAlert(
  firebaseToken: string,
  payload: RPAlertPayload
) {
  return request<{
    ok: boolean
  }>('/api/alerts/send', {
    method: 'POST',
    token: firebaseToken,
    body: JSON.stringify(payload),
  })
}
