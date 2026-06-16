/**
 * AutonomousEngine — surveillance d'un dossier source + traitement auto.
 *
 * Deux modes :
 *   - mode "Node" : fs.watch sur un dossier (côté serveur uniquement)
 *   - mode "Browser" : File System Access API (Chrome/Edge) ou polling
 *
 * Pour chaque nouvelle image détectée :
 *   1. on enqueue un job dans la JobQueue
 *   2. le job est traité (handler fourni)
 *   3. le manifest est mis à jour
 *
 * Hérite de EventEmitter pour la coordination UI.
 */

import { EventEmitter } from './event-emitter';
import { JobQueue } from './job-queue';

export interface AutonomousConfig {
  watchFolder:     string;        // chemin du dossier à surveiller (mode Node)
                                 // ou nom du dossier (mode Browser)
  gameAssetsFolder: string;
  backupFolder?:   string;
  rules: {
    autoProcess:    boolean;
    autoExport:     boolean;
    autoBackup:     boolean;
    autoNotifyGame: boolean;
    namingPattern:  string;       // 'model_{date}_{type}'
  };
  gameIntegration: {
    type:     'fileSystem' | 'websocket' | 'api';
    endpoint?: string;
  };
  pollingMs?: number;             // pour mode Browser fallback
}

export type ImageFile = File;

export interface ImageDetectedEvent {
  filename: string;
  file:     ImageFile;
}

export interface JobStartedEvent {
  jobId: string;
  filename: string;
}

export interface JobFinishedEvent {
  jobId:    string;
  filename: string;
  ok:       boolean;
  error?:   string;
}

export interface AutonomousEventMap {
  'image:detected': ImageDetectedEvent;
  'job:started':    JobStartedEvent;
  'job:finished':   JobFinishedEvent;
  'started':        void;
  'stopped':        void;
  'error':          { message: string };
}

export type JobHandler = (file: ImageFile) => Promise<void>;

export class AutonomousEngine extends EventEmitter<AutonomousEventMap> {
  private readonly config: AutonomousConfig;
  private readonly queue: JobQueue<ImageFile>;
  private handler: JobHandler | null = null;
  private isRunning = false;
  private fsHandle: any = null;
  private nodeWatcher: { close: () => void } | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private processed = new Set<string>();

  constructor(config: AutonomousConfig) {
    super();
    this.config = config;
    this.queue  = new JobQueue<ImageFile>({ maxAttempts: 2, stopOnFailure: false });
    this.queue.setHandler(async (file) => {
      await this.invokeHandler(file);
    });
  }

  /**
   * Définit le handler appliqué à chaque image détectée.
   */
  setHandler(handler: JobHandler): void {
    this.handler = handler;
  }

  /**
   * Démarre la surveillance. Selon l'environnement, on bascule auto
   * entre Node (fs.watch) et Browser (File System Access API ou polling).
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      if (typeof window === 'undefined' && typeof process !== 'undefined') {
        await this.startNodeWatcher();
      } else {
        await this.startBrowserWatcher();
      }
      await this.emit('started', undefined);
    } catch (err) {
      this.isRunning = false;
      const message = err instanceof Error ? err.message : String(err);
      await this.emit('error', { message });
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.nodeWatcher) {
      this.nodeWatcher.close();
      this.nodeWatcher = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    await this.queue.drain();
    await this.emit('stopped', undefined);
  }

  /**
   * Injecte manuellement un fichier (utile pour tests ou drag-drop UI).
   */
  submitFile(file: ImageFile, filename?: string): void {
    const fn = filename ?? file.name;
    this.queue.enqueue(file, `manual_${Date.now()}_${fn}`);
    void this.emit('image:detected', { filename: fn, file });
  }

  // ─────────────────────────────────────────────────────────
  //  Mode Node (côté serveur uniquement).
  // ─────────────────────────────────────────────────────────
  private async startNodeWatcher(): Promise<void> {
    if (typeof process === 'undefined' || !process.versions?.node) {
      throw new Error('startNodeWatcher requiert Node.js');
    }
    const fs = await import('node:fs/promises');
    // fs.watch est event-based, pas watcher.
    const { default: fsSync } = await import('node:fs');
    void this.scanExistingFiles(fs); // best-effort

    const watcher = fsSync.watch(this.config.watchFolder, { recursive: false });
    const closeIt = () => watcher.close();
    this.nodeWatcher = { close: closeIt };

    (async () => {
      for await (const event of watcher) {
        if (!this.isRunning) break;
        const filename = (event as any).filename as string | null;
        if (!filename) continue;
        if (!this.isImage(filename)) continue;
        if (this.processed.has(filename)) continue;
        await this.processDetectedFile(filename, fs);
      }
    })().catch((err) => {
      void this.emit('error', { message: String(err) });
    });
  }

  private async scanExistingFiles(fs: typeof import('node:fs/promises')): Promise<void> {
    try {
      const entries = await fs.readdir(this.config.watchFolder);
      for (const e of entries) {
        if (this.isImage(e) && !this.processed.has(e)) {
          await this.processDetectedFile(e, fs);
        }
      }
    } catch {
      // dossier vide ou inaccessible : OK.
    }
  }

  private async processDetectedFile(
    filename: string,
    fs: typeof import('node:fs/promises'),
  ): Promise<void> {
    this.processed.add(filename);
    const fullPath = `${this.config.watchFolder}/${filename}`;
    try {
      const buf = await fs.readFile(fullPath);
      const file = new File([buf], filename, { type: this.guessMime(filename) });
      this.queue.enqueue(file, `auto_${Date.now()}_${filename}`);
      await this.emit('image:detected', { filename, file });
    } catch (err) {
      await this.emit('error', {
        message: `lecture ${filename} échouée: ${String(err)}`,
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  //  Mode Browser.
  // ─────────────────────────────────────────────────────────
  private async startBrowserWatcher(): Promise<void> {
    // 1. Tenter File System Access API.
    if (typeof window !== 'undefined' && (window as any).showDirectoryPicker) {
      try {
        const handle = await (window as any).showDirectoryPicker({ mode: 'read' });
        this.fsHandle = handle;
        this.startBrowserPolling(handle);
        return;
      } catch {
        // L'utilisateur a annulé : on tombe sur polling sans handle.
      }
    }
    // 2. Fallback : polling sans handle (l'utilisateur uploadera via UI).
    const ms = this.config.pollingMs ?? 2000;
    this.pollTimer = setInterval(() => {
      // En mode polling sans handle, on ne peut pas lister. Le mode manuel
      // (submitFile) reste fonctionnel.
    }, ms);
  }

  private startBrowserPolling(handle: any): void {
    const ms = this.config.pollingMs ?? 2000;
    this.pollTimer = setInterval(async () => {
      try {
        for await (const entry of handle.values()) {
          if (entry.kind !== 'file') continue;
          if (!this.isImage(entry.name)) continue;
          if (this.processed.has(entry.name)) continue;
          this.processed.add(entry.name);
          const file: File = await entry.getFile();
          this.queue.enqueue(file, `poll_${Date.now()}_${entry.name}`);
          await this.emit('image:detected', { filename: entry.name, file });
        }
      } catch (err) {
        await this.emit('error', { message: String(err) });
      }
    }, ms);
  }

  private async invokeHandler(file: ImageFile): Promise<void> {
    const filename = file.name;
    await this.emit('job:started', {
      jobId: `processing_${filename}`,
      filename,
    });
    try {
      if (this.handler) {
        await this.handler(file);
      }
      await this.emit('job:finished', {
        jobId: `processing_${filename}`,
        filename,
        ok: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.emit('job:finished', {
        jobId: `processing_${filename}`,
        filename,
        ok: false,
        error: msg,
      });
      throw err;
    }
  }

  private isImage(filename: string): boolean {
    return /\.(jpg|jpeg|png|webp|bmp)$/i.test(filename);
  }

  private guessMime(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() ?? '';
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg',
      png: 'image/png',  webp: 'image/webp',
      bmp: 'image/bmp',
    };
    return map[ext] ?? 'application/octet-stream';
  }
}
