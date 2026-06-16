/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\chat\chatTypes.ts
 *
 * Types du chat TROXT.
 * Ils utilisent directement les types centraux.
 */

import type {
  TroxtMessage,
  TroxtProject,
  TroxtRequest,
  TroxtRole,
  TroxtStatus,
} from '../types'

export type ChatProject =
  TroxtProject

export type ChatRole =
  TroxtRole

export type AgentStatus =
  TroxtStatus

export type ChatMessage =
  TroxtMessage

export type AgentRequest =
  TroxtRequest
