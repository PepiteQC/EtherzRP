/* ═══════════════════════════════════════════════════════════════════════════
   AgentEngine.ts — Moteur d'IA Multi-Agent Niveau NINJA/Gemini/Devin
   ═══════════════════════════════════════════════════════════════════════════
   
   Architecture:
   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
   │  Planner     │────▶│  Executor    │────▶│  Reviewer   │
   │  (stratégie) │     │  (code/outils)│     │  (critique) │
   └─────────────┘     └──────────────┘     └─────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
   ┌─────────────────────────────────────────────────────┐
   │               Memory Store (Vector DB)              │
   └─────────────────────────────────────────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
   ┌─────────────────────────────────────────────────────┐
   │               Tool Registry (20+ outils)            │
   └─────────────────────────────────────────────────────┘
   ═══════════════════════════════════════════════════════ */

// ── Types fondamentaux ────────────────────────────────────────────

export type AgentRole = 'planner' | 'coder' | 'reviewer' | 'debugger' | 'memory'

export type ToolName =
  | 'read_file' | 'write_file' | 'edit_file' | 'patch_file'
  | 'search_code' | 'grep' | 'find' | 'list_dir'
  | 'run_command' | 'run_background' | 'kill_process'
  | 'install_package'
  | 'start_server' | 'stop_server'
  | 'web_search' | 'web_fetch'
  | 'git_status' | 'git_commit' | 'git_diff' | 'git_push'
  | 'db_query' | 'db_schema'
  | 'memory_store' | 'memory_recall' | 'memory_forget'
  | 'think' | 'reflect' | 'plan'

export type ToolStatus = 'pending' | 'running' | 'success' | 'error'

export interface ToolDefinition {
  name: ToolName
  description: string
  parameters: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required: boolean
    description: string
    enum?: string[]
  }>
  timeout: number // ms
  dangerous: boolean // nécessite confirmation
}

export interface ToolCall {
  id: string
  name: ToolName
  args: Record<string, unknown>
  result?: unknown
  error?: string
  status: ToolStatus
  startedAt: number
  finishedAt?: number
  duration?: number
  tokenCost: number
}

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'planner' | 'reviewer'
  content: string
  toolCalls: ToolCall[]
  agentId?: string
  parentId?: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface AgentPlan {
  id: string
  goal: string
  steps: AgentStep[]
  status: 'draft' | 'active' | 'completed' | 'failed'
  createdAt: number
  completedAt?: number
  score?: number
}

export interface AgentStep {
  id: string
  description: string
  tool: ToolName
  args: Record<string, unknown>
  expectedOutcome: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  result?: unknown
  error?: string
  duration?: number
}

export interface AgentContext {
  projectId: string
  userId: string
  sessionId: string
  workingDirectory: string
  maxSteps: number
  currentStep: number
  startTime: number
  tokensUsed: number
  tokensLimit: number
  plan?: AgentPlan
  messages: AgentMessage[]
  errors: string[]
  state: Record<string, unknown>
}

export interface AgentConfig {
  name: string
  role: AgentRole
  model: string
  temperature: number
  maxTokens: number
  tools: ToolName[]
  systemPrompt: string
}

export interface AgentEvent {
  type: 'plan' | 'step' | 'tool_call' | 'tool_result' | 'message' | 'error' | 'complete' | 'reflect'
  data: unknown
  timestamp: number
}

export type AgentEventHandler = (event: AgentEvent) => void

// ── Tool Registry (20 outils complets) ────────────────────────────

export class ToolRegistry {
  private tools: Map<ToolName, ToolDefinition> = new Map()

  constructor() {
    this.registerAll()
  }

  private registerAll(): void {
    const defs: ToolDefinition[] = [
      // ── Fichiers ──
      {
        name: 'read_file',
        description: 'Read the full contents of a file',
        parameters: { path: { type: 'string', required: true, description: 'Absolute or relative file path' } },
        timeout: 5000, dangerous: false,
      },
      {
        name: 'write_file',
        description: 'Write content to a file (creates or overwrites)',
        parameters: {
          path: { type: 'string', required: true, description: 'File path' },
          content: { type: 'string', required: true, description: 'File content' },
        },
        timeout: 10000, dangerous: false,
      },
      {
        name: 'edit_file',
        description: 'Apply a targeted edit to an existing file (find & replace)',
        parameters: {
          path: { type: 'string', required: true, description: 'File path' },
          search: { type: 'string', required: true, description: 'Text to search for' },
          replace: { type: 'string', required: true, description: 'Replacement text' },
        },
        timeout: 8000, dangerous: false,
      },
      {
        name: 'patch_file',
        description: 'Apply a unified diff patch to a file',
        parameters: { patch: { type: 'string', required: true, description: 'Unified diff content' } },
        timeout: 10000, dangerous: true,
      },

      // ── Recherche ──
      {
        name: 'search_code',
        description: 'Semantic code search across the project',
        parameters: {
          query: { type: 'string', required: true, description: 'Search query (semantic or literal)' },
          maxResults: { type: 'number', required: false, description: 'Max results (default 10)' },
        },
        timeout: 10000, dangerous: false,
      },
      {
        name: 'grep',
        description: 'Regex search in files',
        parameters: {
          pattern: { type: 'string', required: true, description: 'Regex pattern' },
          glob: { type: 'string', required: false, description: 'File glob pattern (e.g. **/*.tsx)' },
        },
        timeout: 15000, dangerous: false,
      },
      {
        name: 'find',
        description: 'Find files by name pattern',
        parameters: {
          name: { type: 'string', required: true, description: 'Filename pattern (can include wildcards)' },
          maxDepth: { type: 'number', required: false, description: 'Max directory depth' },
        },
        timeout: 10000, dangerous: false,
      },
      {
        name: 'list_dir',
        description: 'List directory contents',