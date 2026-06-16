/**
 * troxt — entrée principale.
 *
 * Regroupe :
 *   - SDK client (troxt, TroxtClient, troxtEvents, ManifestWriter)
 *   - UI bridge (Card, Button, Slider, Progress, Badge, Toast)
 *   - Contracts (VisualForgeContract, AssetManifest, SubjectType, ReconstructionMode)
 *   - Engines (re-export groupé)
 */

export * from './troxt';
export * as contracts from './contracts';
export * as engines from './engines/index';
