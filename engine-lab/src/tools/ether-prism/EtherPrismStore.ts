// ═══════════════════════════════════════════════
// EtherPrismStore.ts
// State + Connexion TroxT + Utilitaires
// ═══════════════════════════════════════════════

import { create } from 'zustand';
import type {
  EtherPacket,
  EtherPrismConfig,
  EtherPrismEvent,
  EtherPrismMode,
  EtherPrismResult,
  EtherSource,
} from './types';
import { DEFAULT_PRISM_CONFIG } from './types';
import { analyzeEther } from './lib/etherAnalyzer';
import { generatePrism } from './lib/prismGenerator';
import { compressEther } from './lib/etherCompress';
import { enhanceWithAI } from './lib/etherEnhance';
import { getMemorySync } from './lib/etherSync';
import { etherBatch } from './lib/etherBatch';

export interface TroxTAgent {
  sessionId: string;
  emit: (event: EtherPrismEvent) => void;
  requestOrchestration: (packetId: string, intent: string) => Promise<{ decision: string; modules: string[] }>;
  log: (level: 'info' | 'warn' | 'error', msg: string) => void;
  getMemory: () => { context: Map<string, unknown>; history: unknown[]; insights: string[] };
}

interface EtherPrismState {
  troxt: TroxTAgent | null;
  mode: EtherPrismMode;
  packets: Map<string, EtherPacket>;
  results: Map<string, EtherPrismResult>;
  currentPacketId: string | null;
  config: EtherPrismConfig;
  isProcessing: boolean;
  batchMode: boolean;

  // Actions
  connectTroxT: (agent: TroxTAgent) => void;
  setMode: (mode: EtherPrismMode) => void;
  setConfig: (patch: Partial<EtherPrismConfig>) => void;
  submitSource: (source: EtherSource) => Promise<string>;
  submitBatch: (sources: EtherSource[]) => Promise<string[]>;
  getResult: (packetId: string) => EtherPrismResult | undefined;
  getAnalysis: (packetId: string) => EtherPrismResult['analysis'] | undefined;
  clearResults: () => void;
  cancelProcessing: () => void;
}

export const useEtherPrismStore = create<EtherPrismState>((set, get) => ({
  troxt: null,
  mode: 'analyze',
  packets: new Map(),
  results: new Map(),
  currentPacketId: null,
  config: { ...DEFAULT_PRISM_CONFIG },
  isProcessing: false,
  batchMode: false,

  connectTroxT(agent) {
    set({ troxt: agent });
    agent.log('info', '✅ EtherPrism connecté au cerveau TroxT');
    
    // Configurer le batch processor
    etherBatch.configure({
      onProgress: (info) => {
        agent.emit({ type: 'PRISM:batch_progress', info });
      },
      onComplete: (results) => {
        agent.emit({ type: 'PRISM:batch_complete', results });
      },
      onError: (err) => {
        agent.log('error', `Batch error: ${err.message}`);
        agent.emit({ type: 'PRISM:error', packetId: 'batch', error: { code: 'BATCH_ERROR', message: err.message } });
      },
    });
  },

  setMode(mode) {
    const { troxt } = get();
    troxt?.log('info', `EtherPrism mode → ${mode}`);
    troxt?.emit({ type: 'PRISM:mode_change', mode });
    set({ mode });
  },

  setConfig(patch) {
    set(state => ({ config: { ...state.config, ...patch } }));
  },

  async submitSource(source) {
    const { troxt, mode, config, packets, results } = get();
    if (!troxt) throw new Error('EtherPrism: TroxT non connecté');
    if (get().isProcessing) throw new Error('EtherPrism: déjà en traitement');

    const packetId = `prism_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const packet: EtherPacket = {
      id: packetId,
      source,
      mode,
      config,
      createdAt: Date.now(),
      troxtSessionId: troxt.sessionId,
      priority: config.autoOrchestrate ? 'high' : 'normal',
      tags: [],
    };

    packets.set(packetId, packet);
    results.set(packetId, { packetId, status: 'pending' });
    set({ currentPacketId: packetId, isProcessing: true, packets: new Map(packets), results: new Map(results) });

    troxt.emit({ type: 'PRISM:packet_created', packet });
    troxt.log('info', `📦 Paquet EtherPrism créé: ${packetId}`);

    try {
      // 1. Analyse
      troxt.emit({ type: 'PRISM:analysis_start', packetId });
      set({ results: new Map(results) });

      const analysis = await analyzeEther(packet);
      
      // 2. AI Enhancement
      let aiSuggestion;
      if (config.enhanceWithAI) {
        aiSuggestion = await enhanceWithAI(analysis);
        troxt.emit({ type: 'PRISM:ai_suggestion', packetId, suggestion: aiSuggestion });
      }

      const analysisWithAI = { ...analysis, aiEnhancement: aiSuggestion };
      results.set(packetId, { packetId, status: 'analyzing', analysis: analysisWithAI });
      set({ results: new Map(results) });
      troxt.emit({ type: 'PRISM:analysis_done', packetId, analysis: analysisWithAI });

      // 3. Orchestration TroxT
      if (config.autoOrchestrate) {
        const decision = await troxt.requestOrchestration(packetId, `Generate ${config.outputFormat}`);
        troxt.emit({ type: 'PRISM:troxt_decision', packetId, decision: decision.decision });
        troxt.log('info', `🧠 Décision TroxT: ${decision.decision}`);
      }

      // 4. Génération
      troxt.emit({ type: 'PRISM:generation_start', packetId });
      const result = await generatePrism(packet, analysisWithAI);
      results.set(packetId, { ...result, status: 'generating', analysis: analysisWithAI });
      set({ results: new Map(results) });

      // 5. Compression (optionnelle)
      if (config.compressOutput && result.output) {
        troxt.emit({ type: 'PRISM:compression_start', packetId });
        const { blob, stats } = await compressEther(
          result.output.url as Blob,
          config.outputFormat
        );
        result.output.url = URL.createObjectURL(blob);
        result.output.size = stats.compressedSize;
        result.metadata = { ...result.metadata, processingTime: stats.processingTime };
        
        troxt.emit({ type: 'PRISM:compression_done', packetId, stats });
        troxt.log('info', `📦 Compressé: ${stats.ratio.toFixed(1)}% réduction`);
      }

      // 6. Sync mémoire
      if (config.syncToMemory) {
        const memorySync = getMemorySync(troxt as never);
        await memorySync.saveAnalysis(packetId, analysisWithAI);
        await memorySync.saveResult(packetId, result);
        troxt.emit({ type: 'PRISM:memory_synced', packetId });
      }

      results.set(packetId, { ...result, status: 'complete' });
      set({ results: new Map(results), isProcessing: false });
      troxt.emit({ type: 'PRISM:generation_done', packetId, result });
      troxt.log('success', `✅ EtherPrism complet: ${packetId}`);

      return packetId;
    } catch (err) {
      const error = { code: 'PRISM_ERROR', message: (err as Error).message };
      results.set(packetId, { packetId, status: 'error', error });
      set({ results: new Map(results), isProcessing: false });
      troxt.emit({ type: 'PRISM:error', packetId, error });
      troxt.log('error', `❌ EtherPrism error: ${error.message}`);
      throw err;
    }
  },

  async submitBatch(sources) {
    const { troxt, config } = get();
    if (!troxt) throw new Error('TroxT non connecté');

    troxt.log('info', `📦 Batch EtherPrism: ${sources.length} items`);
    troxt.emit({ type: 'PRISM:batch_start', count: sources.length });

    const results: EtherPrismResult[] = [];
    for (const source of sources) {
      try {
        const packetId = await get().submitSource(source);
        const result = get().getResult(packetId);
        if (result) results.push(result);
      } catch (err) {
        results.push({
          packetId: `error_${Date.now()}`,
          status: 'error',
          error: { code: 'BATCH_ITEM_FAILED', message: (err as Error).message },
        });
      }
    }

    troxt.emit({ type: 'PRISM:batch_complete', results });
    return results.map(r => r.packetId);
  },

  getResult(packetId) {
    return get().results.get(packetId);
  },

  getAnalysis(packetId) {
    return get().results.get(packetId)?.analysis;
  },

  clearResults() {
    set({ packets: new Map(), results: new Map(), currentPacketId: null });
  },

  cancelProcessing() {
    set({ isProcessing: false });
    get().troxt?.log('warn', 'EtherPrism: traitement annulé');
  },
}));