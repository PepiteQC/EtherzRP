/**
 * Événements publics du Code Lab.
 */

export const CODE_LAB_EVENTS = {
  run: 'engine-lab:code-lab:run',
  openEditor: 'engine-lab:code-lab:open-editor',
  openSnippets: 'engine-lab:code-lab:open-snippets',
  openStats: 'engine-lab:code-lab:open-stats',
  completed: 'engine-lab:code-lab:completed',
  error: 'engine-lab:code-lab:error',
} as const

export type CodeLabEventName =
  (typeof CODE_LAB_EVENTS)[keyof typeof CODE_LAB_EVENTS]
