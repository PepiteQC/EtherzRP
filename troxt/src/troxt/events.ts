/**
 * TroxtEventBus — bus d'événements typé pour la coordination client/serveur.
 *
 * Utilisé pour :
 *   - progression des jobs Visual Forge (mise à jour UI temps réel)
 *   - notifications de manifest mis à jour
 *   - erreurs remontées du worker
 */

import type { TroxtEventMap } from './types';

type Listener<T> = (payload: T) => void;

export class TroxtEventBus {
  private listeners = new Map<keyof TroxtEventMap, Set<Listener<any>>>();

  on<K extends keyof TroxtEventMap>(
    event: K,
    listener: Listener<TroxtEventMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof TroxtEventMap>(
    event: K,
    listener: Listener<TroxtEventMap[K]>,
  ): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit<K extends keyof TroxtEventMap>(event: K, payload: TroxtEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of [...set]) {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[troxt.events] listener for "${event}" threw:`, err);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const troxtEvents = new TroxtEventBus();
