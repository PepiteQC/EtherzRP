/// <reference types="vite/client" />

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed with ${response.status}`)
  }

  return payload as T
}

export interface TroxtToolStatus {
  id: string
  name: string
  status: string
  connected: boolean
  capabilities: string[]
}

export interface TroxtAgentStatus {
  id: string
  name: string
  status: string
  toolId: string
  intents: string[]
}

export interface TroxtRegistryResponse {
  ok: boolean
  registry: {
    agents: TroxtAgentStatus[]
    tools: TroxtToolStatus[]
  }
}

export interface TroxtJob {
  id: string
  status: string
  dispatchId?: string | null
  route: {
    targetId: string
    targetKind: string
    intent: string
    confidence: number
    reason: string
  }
  command: {
    source: string
    command: string | null
    intent: string | null
    payload: Record<string, unknown>
  }
  result?: {
    result?: Record<string, unknown>
    metrics?: Record<string, unknown> | null
    artifacts?: unknown[]
  } | null
  error?: {
    code: string
    message: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface TroxtJobsResponse {
  ok: boolean
  jobs: TroxtJob[]
}

export interface TroxtHealthResponse {
  ok: boolean
  service: string
  status: string
  localOnly: boolean
  targets: {
    required: string[]
    offline: string[]
  }
  components: Record<string, { status: string }>
}

export interface TroxtCommandPayload {
  source?: string
  target?: string
  toolId?: string
  agentId?: string
  intent?: string
  command?: string
  payload?: Record<string, unknown>
}

export interface TroxtCommandResponse {
  ok: boolean
  status: string
  job?: TroxtJob
  route?: TroxtJob['route']
  error?: {
    code: string
    message: string
  }
}

export function getTroxtHealth() {
  return request<TroxtHealthResponse>('/api/troxt/health')
}

export function getTroxtRegistry() {
  return request<TroxtRegistryResponse>('/api/troxt/registry')
}

export function getTroxtJobs() {
  return request<TroxtJobsResponse>('/api/troxt/jobs')
}

export function submitTroxtCommand(body: TroxtCommandPayload) {
  return request<TroxtCommandResponse>('/api/troxt/commands', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
