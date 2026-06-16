import type {
  CodeExecutionResult,
  CodeSnippet,
} from '../types'

const SNIPPETS_KEY =
  'engine-lab:code-lab:snippets:v1'

const HISTORY_KEY =
  'engine-lab:code-lab:history:v1'

function canUseStorage(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
}

function readArray<T>(
  key: string
): T[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw =
      window.localStorage.getItem(key)

    if (!raw) {
      return []
    }

    const parsed =
      JSON.parse(raw)

    return Array.isArray(parsed)
      ? parsed
      : []
  } catch {
    return []
  }
}

function writeArray<T>(
  key: string,
  value: T[]
): void {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    key,
    JSON.stringify(value)
  )
}

export function loadSnippets(): CodeSnippet[] {
  return readArray<CodeSnippet>(
    SNIPPETS_KEY
  )
}

export function saveSnippets(
  snippets: CodeSnippet[]
): void {
  writeArray(
    SNIPPETS_KEY,
    snippets
  )
}

export function loadExecutionHistory():
  CodeExecutionResult[] {
  return readArray<CodeExecutionResult>(
    HISTORY_KEY
  )
}

export function saveExecutionHistory(
  history: CodeExecutionResult[]
): void {
  writeArray(
    HISTORY_KEY,
    history.slice(-100)
  )
}
