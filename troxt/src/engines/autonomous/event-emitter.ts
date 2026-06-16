/**
 * EventEmitter — base class pour AutonomousEngine, JobQueue, etc.
 *
 * Implémentation minimaliste (sans dépendance). Compatible avec le pattern
 * .on()/.off()/.emit() de Node.js, mais typé strict.
 */

export type Listener<T> = (payload: T) => void | Promise<void>;

export class EventEmitter<EventMap extends Record<string, any>> {
  private listeners = new Map<keyof EventMap, Set<Listener<any>>>();

  on<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  once<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): () => void {
    const wrap = ((payload: EventMap[K]) => {
      this.off(event, wrap);
      return listener(payload);
    }) as Listener<EventMap[K]>;
    return this.on(event, wrap);
  }

  off<K extends keyof EventMap>(
    event: K,
    listener: Listener<EventMap[K]>,
  ): void {
    this.listeners.get(event)?.delete(listener);
  }

  async emit<K extends keyof EventMap>(
    event: K,
    payload: EventMap[K],
  ): Promise<void> {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of [...set]) {
      try {
        await listener(payload);
      } catch (err) {
        console.error(
          `[EventEmitter] listener for "${String(event)}" threw:`,
          err,
        );
      }
    }
  }

  removeAllListeners(event?: keyof EventMap): void {
    if (event === undefined) {
      this.listeners.clear();
    } else {
      this.listeners.delete(event);
    }
  }

  listenerCount<K extends keyof EventMap>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
