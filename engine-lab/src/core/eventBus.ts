// ═══════════════════════════════════════════════
// eventBus.ts
// Bus d'événements global Etherworld
// ═══════════════════════════════════════════════

type EventHandler = (data: unknown) => void;

export class EtherEventBus {
  private handlers = new Map<string, EventHandler[]>();
  private wildcards = new Map<string, EventHandler[]>();

  on(event: string, handler: EventHandler) {
    if (event.endsWith('.*')) {
      const base = event.slice(0, -2);
      if (!this.wildcards.has(base)) this.wildcards.set(base, []);
      this.wildcards.get(base)!.push(handler);
    } else {
      if (!this.handlers.has(event)) this.handlers.set(event, []);
      this.handlers.get(event)!.push(handler);
    }
  }

  off(event: string, handler?: EventHandler) {
    if (handler) {
      this.handlers.get(event)?.splice(
        this.handlers.get(event)!.indexOf(handler), 1
      );
    } else {
      this.handlers.delete(event);
    }
  }

  emit(event: string, data: unknown) {
    // Handlers exacts
    this.handlers.get(event)?.forEach(h => h(data));
    
    // Wildcards
    this.wildcards.forEach((handlers, base) => {
      if (event.startsWith(base)) {
        handlers.forEach(h => h(data));
      }
    });
  }

  // Utilitaires
  once(event: string, handler: EventHandler) {
    const wrapper = (data: unknown) => {
      handler(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  getHandlers(event: string): EventHandler[] {
    return [
      ...(this.handlers.get(event) || []),
      ...(this.wildcards.get(event) || []),
    ];
  }
}

// Singleton global
export const etherBus = new EtherEventBus();

// Événements prédéfinis Etherworld
export const ETHER_EVENTS = {
  // TroxT
  TROXT_READY: 'TROXT:ready',
  TROXT_THINKING: 'TROXT:thinking',
  TROXT_DECISION: 'TROXT:decision',
  
  // Outils
  TOOL_REGISTERED: 'tool:registered',
  TOOL_STATUS: 'tool:status',
  TOOL_COMPLETE: 'tool:complete',
  TOOL_ERROR: 'tool:error',
  
  // Prism
  PRISM_ANALYZE: 'PRISM:analyze',
  PRISM_GENERATE: 'PRISM:generate',
  PRISM_COMPRESS: 'PRISM:compress',
  
  // Forge
  FORGE_BUILD: 'FORGE:build',
  FORGE_MATERIAL: 'FORGE:material',
  
  // Weave
  WEAVE_PATTERN: 'WEAVE:pattern',
  WEAVE_TILE: 'WEAVE:tile',
  
  // Lens
  LENS_DETECT: 'LENS:detect',
  LENS_MEASURE: 'LENS:measure',
  
  // Mémoire
  MEMORY_SYNC: 'memory:sync',
  MEMORY_RECALL: 'memory:recall',
  
  // Global
  ETHERWORLD_TICK: 'ETHERWORLD:tick',
} as const;