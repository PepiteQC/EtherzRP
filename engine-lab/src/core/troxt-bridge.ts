// ═══════════════════════════════════════════════
// troxt-bridge.ts
// Pont neuronal entre TroxT et tous les outils Etherworld
// ═══════════════════════════════════════════════

import type { TroxTAgent } from '../agents/troxt/TroxT';
import type { EtherPrismEvent } from '../tools/ether-prism/types';
import type { EtherForgeEvent } from '../tools/ether-forge/types';
import type { EtherWeaveEvent } from '../tools/ether-weave/types';
import type { EtherLensEvent } from '../tools/ether-lens/types';

export interface EtherTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  lastResult?: unknown;
}

export interface TroxTBridge {
  troxt: TroxTAgent;
  tools: Map<string, EtherTool>;
  memory: EtherMemory;
  eventBus: EtherEventBus;

  // Actions
  registerTool(tool: EtherTool): void;
  unregisterTool(id: string): void;
  updateToolStatus(id: string, status: EtherTool['status'], result?: unknown): void;
  
  // Orchestration
  orchestrate(toolId: string, intent: string): Promise<void>;
  getToolContext(toolId: string): Promise<string>;
  syncMemory(toolId: string, data: unknown): void;
  
  // Utilitaires
  broadcast(event: EtherEvent): void;
  getStatus(): { troxt: string; tools: EtherTool[]; memory: EtherMemory };
}

export interface EtherMemory {
  sessionId: string;
  context: Map<string, unknown>;
  history: Array<{
    toolId: string;
    action: string;
    timestamp: number;
    result: unknown;
  }>;
  insights: string[];
}

export interface EtherEventBus {
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
  emit(event: string, data: unknown): void;
}

export interface EtherEvent {
  type: string;
  toolId: string;
  payload: unknown;
  timestamp: number;
  troxtSessionId: string;
}

// ═══ Implémentation ═══

class EtherEventBusImpl implements EtherEventBus {
  private handlers = new Map<string, Set<(data: unknown) => void>>();

  on(event: string, handler: (data: unknown) => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: unknown) => void) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach(h => h(data));
    // Aussi notifier TroxT
    this.handlers.get('*')?.forEach(h => h(data));
  }
}

export function createTroxTBridge(troxt: TroxTAgent): TroxTBridge {
  const eventBus = new EtherEventBusImpl();
  
  const bridge: TroxTBridge = {
    troxt,
    tools: new Map(),
    memory: {
      sessionId: crypto.randomUUID(),
      context: new Map(),
      history: [],
      insights: [],
    },
    eventBus,

    registerTool(tool) {
      bridge.tools.set(tool.id, tool);
      troxt.log('info', `Outil Etherworld enregistré: ${tool.name} (${tool.id})`);
      eventBus.emit('tool:registered', { toolId: tool.id, name: tool.name });
    },

    unregisterTool(id) {
      bridge.tools.delete(id);
      troxt.log('info', `Outil Etherworld dérégistré: ${id}`);
      eventBus.emit('tool:unregistered', { toolId: id });
    },

    updateToolStatus(id, status, result) {
      const tool = bridge.tools.get(id);
      if (tool) {
        tool.status = status;
        if (result !== undefined) tool.lastResult = result;
      }
      troxt.log('info', `Statut outil ${id}: ${status}`);
      eventBus.emit('tool:status', { toolId: id, status, result });
    },

    async orchestrate(toolId, intent) {
      troxt.log('info', `Orchestration TroxT → ${toolId}: ${intent}`);
      
      // TroxT décide quels modules activer
      const context = bridge.memory.context;
      const relevantData = Array.from(context.entries())
        .filter(([key]) => key.startsWith(toolId))
        .map(([, v]) => v);

      troxt.emit({ type: 'TROXT:orchestrate', toolId, intent, context: relevantData });
      
      // Attendre la décision de TroxT
      await new Promise<void>(resolve => {
        const handler = (data: unknown) => {
          if (data && typeof data === 'object' && 'orchestration' in data) {
            troxt.log('info', `Décision TroxT pour ${toolId}:`, data);
            eventBus.off('TROXT:decision', handler);
            resolve();
          }
        };
        eventBus.on('TROXT:decision', handler);
      });
    },

    async getToolContext(toolId) {
      const context = bridge.memory.context;
      const entries = Array.from(context.entries())
        .filter(([key]) => key.startsWith(toolId))
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join('\n');
      
      troxt.log('info', `Contexte récupéré pour ${toolId}`);
      return entries || 'Aucun contexte';
    },

    syncMemory(toolId, data) {
      bridge.memory.context.set(`${toolId}:lastResult`, data);
      bridge.memory.history.push({
        toolId,
        action: 'sync',
        timestamp: Date.now(),
        result: data,
      });
      troxt.log('info', `Mémoire synchronisée: ${toolId}`);
    },

    broadcast(event) {
      eventBus.emit(event.type, event);
      troxt.emit(event as never); // Type assertion pour compatibilité
    },

    getStatus() {
      return {
        troxt: troxt.sessionId,
        tools: Array.from(bridge.tools.values()),
        memory: { ...bridge.memory },
      };
    },
  };

  // Écouter TroxT
  troxt.emit = ((originalEmit: typeof troxt.emit) => {
    return (event: never) => {
      bridge.broadcast(event as EtherEvent);
      originalEmit(event);
    };
  })(troxt.emit);

  return bridge;
}