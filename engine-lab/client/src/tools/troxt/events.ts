```ts
/**
 * C:\etherworldQC\engine-lab\client\src\tools\troxt\events.ts
 *
 * Événements globaux utilisés par TROXT et les outils Engine-Lab.
 */

export const TROXT_EVENTS = {
  request: 'etherworld-troxt-agent:request',
  message: 'etherworld-troxt-agent:message',
  status: 'etherworld-troxt-agent:status',
  clear: 'etherworld-troxt-agent:clear',

  openTool: 'engine-lab:open-tool',

  visualForgeRun:
    'engine-lab:visual-forge:run',

  visualForgeCompleted:
    'engine-lab:visual-forge:completed',

  visualForgeError:
    'engine-lab:visual-forge:error',
} as const

export type TroxtEventName =
  (typeof TROXT_EVENTS)[keyof typeof TROXT_EVENTS]
```
