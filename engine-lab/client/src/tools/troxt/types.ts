```ts
/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\types.ts
 *
 * Types centraux de TROXT pour Engine-Lab.
 */

export type TroxtStatus =
  | 'offline'
  | 'ready'
  | 'thinking'
  | 'working'
  | 'error'

export type TroxtProject =
  | 'lab'
  | 'etherworld'
  | 'troxt'

export type TroxtRole =
  | 'user'
  | 'assistant'
  | 'system'

export interface TroxtMessage {
  id: string
  role: TroxtRole
  text: string
  createdAt: number
  project: TroxtProject
  metadata?: Record<string, unknown>
}

export interface TroxtRequestContext {
  source: 'engine-lab'
  currentTool?: string
  sceneName?: string
  selection?: unknown
}

export interface TroxtRequest {
  id: string
  text: string
  project: TroxtProject
  createdAt: number
  context: TroxtRequestContext
}

export interface TroxtToolContext {
  project: TroxtProject
  currentTool?: string
  sceneName?: string
  selection?: unknown
}

export interface TroxtToolResult {
  ok: boolean
  message: string
  data?: unknown
}

export interface TroxtToolDefinition {
  id: string
  name: string
  description: string
  keywords: string[]

  execute: (
    request: TroxtRequest,
    context: TroxtToolContext
  ) => Promise<TroxtToolResult> | TroxtToolResult
}

export interface TroxtAgent {
  getStatus: () => TroxtStatus

  send: (
    request: TroxtRequest
  ) => Promise<TroxtMessage | string | void>
}
```
