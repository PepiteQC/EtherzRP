/**
 * EtherWorld Engine-Lab
 * Code Lab — types centraux.
 */

export type CodeLanguage =
  | 'javascript'
  | 'typescript'

export type CodeLabView =
  | 'editor'
  | 'snippets'
  | 'stats'

export interface CodeExecutionResult {
  id: string
  code: string
  language: CodeLanguage
  success: boolean
  output: string
  error?: string
  duration: number
  createdAt: number
}

export interface CodeSnippet {
  id: string
  title: string
  code: string
  language: CodeLanguage
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface CodeLabStats {
  totalSnippets: number
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  successRate: number
  averageDuration: number
  recentExecutions: CodeExecutionResult[]
}
