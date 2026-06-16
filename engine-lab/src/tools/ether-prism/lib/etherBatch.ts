// ═══════════════════════════════════════════════
// etherBatch.ts
// Traitement par lot · EtherPrism
// ═══════════════════════════════════════════════

import type { EtherSource, EtherPrismConfig, EtherPrismResult, BatchInfo } from '../types';
import { submitSource } from '../EtherPrismStore';

export class EtherBatchProcessor {
  private queue: EtherSource[] = [];
  private processing = false;
  private onProgress?: (info: BatchInfo) => void;
  private onComplete?: (results: EtherPrismResult[]) => void;
  private onError?: (error: Error) => void;

  configure(config: {
    onProgress?: (info: BatchInfo) => void;
    onComplete?: (results: EtherPrismResult[]) => void;
    onError?: (error: Error) => void;
  }) {
    this.onProgress = config.onProgress;
    this.onComplete = config.onComplete;
    this.onError = config.onError;
  }

  add(source: EtherSource) {
    this.queue.push(source);
  }

  addMany(sources: EtherSource[]) {
    this.queue.push(...sources);
  }

  clear() {
    this.queue = [];
  }

  async process(config: EtherPrismConfig) {
    if (this.processing) throw new Error('Batch déjà en cours');
    this.processing = true;

    const results: EtherPrismResult[] = [];
    const total = this.queue.length;

    this.onProgress?.({
      total,
      processed: 0,
      failed: 0,
      estimatedTime: total * 2000, // 2s par item estimé
    });

    try {
      for (let i = 0; i < this.queue.length; i++) {
        const source = this.queue[i];
        try {
          const packetId = await submitSource(source);
          // Attendre le résultat (simplifié)
          const result = await waitForResult(packetId, 5000);
          results.push(result);
        } catch (err) {
          results.push({
            packetId: `error_${i}`,
            status: 'error',
            error: { code: 'BATCH_ITEM_FAILED', message: (err as Error).message },
          });
        }

        this.onProgress?.({
          total,
          processed: i + 1,
          failed: results.filter(r => r.status === 'error').length,
          estimatedTime: (total - i - 1) * 2000,
        });
      }

      this.onComplete?.(results);
    } catch (err) {
      this.onError?.(err as Error);
    } finally {
      this.processing = false;
      this.queue = [];
    }
  }

  get queueSize() {
    return this.queue.length;
  }

  get isProcessing() {
    return this.processing;
  }
}

async function waitForResult(packetId: string, timeout: number): Promise<EtherPrismResult> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      // Vérifier si le résultat est prêt (à connecter au store)
      if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout'));
      }
    }, 100);
  });
}

// Singleton
export const etherBatch = new EtherBatchProcessor();