/**
 * JobQueue — file de jobs FIFO avec traitement sérialisé.
 *
 * Utilisé par AutonomousEngine pour traiter les photos détectées une par
 * une (évite de saturer la mémoire + garantit l'ordre).
 *
 * Chaque job passe par :
 *   queued → running → done | failed
 *
 * Les erreurs n'arrêtent PAS la queue (sauf si stopOnFailure=true).
 */

import { EventEmitter } from './event-emitter';

export type JobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export interface Job<T = unknown> {
  id:        string;
  payload:   T;
  status:    JobStatus;
  error?:    string;
  attempts:  number;
  maxAttempts: number;
  enqueuedAt: number;
  startedAt?:  number;
  finishedAt?: number;
}

export interface QueueEventMap {
  'enqueued': { job: Job };
  'started':  { job: Job };
  'progress': { job: Job; progress: number; note?: string };
  'done':     { job: Job; result: unknown };
  'failed':   { job: Job; error: string };
  'idle':     void;
}

export interface JobHandler<T> {
  (payload: T, ctx: JobContext): Promise<unknown>;
}

export interface JobContext {
  job:          Job<T>;
  reportProgress: (pct: number, note?: string) => void;
}

export interface QueueOptions {
  maxAttempts?:     number;
  stopOnFailure?:   boolean;
  /** Concurrency : 1 = strict serial. */
  concurrency?:     number;
}

export class JobQueue<T = unknown> extends EventEmitter<QueueEventMap> {
  private pending:   Job<T>[] = [];
  private inFlight:  Job<T>[] = [];
  private running = false;
  private handler:   JobHandler<T> | null = null;
  private readonly opts: Required<QueueOptions>;

  constructor(opts: QueueOptions = {}) {
    super();
    this.opts = {
      maxAttempts:   opts.maxAttempts   ?? 3,
      stopOnFailure: opts.stopOnFailure ?? false,
      concurrency:   opts.concurrency   ?? 1,
    };
  }

  setHandler(handler: JobHandler<T>): void {
    this.handler = handler;
  }

  enqueue(payload: T, id?: string): Job<T> {
    const job: Job<T> = {
      id:           id ?? this.generateId(),
      payload,
      status:       'queued',
      attempts:     0,
      maxAttempts:  this.opts.maxAttempts,
      enqueuedAt:   Date.now(),
    };
    this.pending.push(job);
    void this.emit('enqueued', { job });
    void this.tick();
    return job;
  }

  size(): number {
    return this.pending.length + this.inFlight.length;
  }

  isIdle(): boolean {
    return this.pending.length === 0 && this.inFlight.length === 0;
  }

  async drain(): Promise<void> {
    while (!this.isIdle()) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  cancel(jobId: string): boolean {
    const idx = this.pending.findIndex((j) => j.id === jobId);
    if (idx >= 0) {
      const [job] = this.pending.splice(idx, 1);
      job.status = 'cancelled';
      void this.emit('failed', { job, error: 'cancelled' });
      return true;
    }
    return false;
  }

  clear(): void {
    this.pending.length = 0;
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.inFlight.length < this.opts.concurrency && this.pending.length > 0) {
        const job = this.pending.shift()!;
        this.inFlight.push(job);
        job.status = 'running';
        job.startedAt = Date.now();
        job.attempts++;
        void this.emit('started', { job });
        // On traite en parallèle jusqu'à la limite, sans await ici pour
        // permettre la concurrence.
        void this.runJob(job);
      }
    } finally {
      this.running = false;
    }
    if (this.isIdle()) {
      void this.emit('idle', undefined);
    }
  }

  private async runJob(job: Job<T>): Promise<void> {
    if (!this.handler) {
      this.inFlight = this.inFlight.filter((j) => j.id !== job.id);
      return;
    }
    try {
      const ctx: JobContext = {
        job,
        reportProgress: (pct, note) => {
          void this.emit('progress', { job, progress: pct, note });
        },
      };
      const result = await this.handler(job.payload, ctx);
      job.status     = 'done';
      job.finishedAt = Date.now();
      void this.emit('done', { job, result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      job.error = msg;
      if (job.attempts < job.maxAttempts) {
        // Ré-enqueue pour retry.
        job.status = 'queued';
        this.pending.push(job);
      } else {
        job.status     = 'failed';
        job.finishedAt = Date.now();
        void this.emit('failed', { job, error: msg });
        if (this.opts.stopOnFailure) {
          this.pending.length = 0;
        }
      }
    } finally {
      this.inFlight = this.inFlight.filter((j) => j.id !== job.id);
      void this.tick();
    }
  }

  private generateId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
