/**
 * Canonical EtherWorld Zustand store bridge.
 *
 * Le store complet/enrichi vit dans:
 *   src/components/lib/etherworld/game-store.ts
 *
 * Plusieurs anciens composants importaient encore:
 *   @/lib/etherworld/game-store
 *
 * Ce fichier évite d'avoir deux stores Zustand séparés en mémoire.
 * Tous les imports pointent maintenant vers la même instance `useStore`.
 */

export * from '../../components/lib/etherworld/game-store'
export { useStore as default } from '../../components/lib/etherworld/game-store'
