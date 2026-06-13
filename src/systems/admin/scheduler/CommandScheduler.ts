/**
 * CommandScheduler.ts
 * ----------------------------------------------------------------------------
 * Planificateur de commandes : différées (one-shot) et récurrentes (interval).
 *
 *  - schedule(after) : exécute une commande après un délai
 *  - scheduleAt(timestamp) : à une date précise
 *  - every(interval) : commande récurrente
 *  - tick(now) : moteur "pur" (pas de setInterval) -> testable & déterministe
 *  - start()/stop() : pilote un timer réel quand on veut l'autonomie
 *  - cancel(id), list(), pause/resume
 *
 * L'exécution réelle est déléguée à un callback `runner(raw, sender)`.
 * ----------------------------------------------------------------------------
 */

export interface ScheduledSender {
  id: string;
  name: string;
}

export interface ScheduledTask {
  id: string;
  raw: string;
  sender: ScheduledSender;
  /** Prochaine exécution (timestamp ms). */
  nextRun: number;
  /** Intervalle de répétition (ms) ou null = one-shot. */
  intervalMs: number | null;
  /** Nombre d'exécutions effectuées. */
  runCount: number;
  /** Nombre max d'exécutions (null = illimité pour les récurrentes). */
  maxRuns: number | null;
  paused: boolean;
  label?: string;
  createdAt: number;
}

export type TaskRunner = (
  raw: string,
  sender: ScheduledSender
) => void | Promise<void>;

export interface SchedulerOptions {
  runner: TaskRunner;
  /** Source de temps (injectable pour les tests). */
  now?: () => number;
  /** Fréquence du timer réel en ms (défaut 1000). */
  tickIntervalMs?: number;
}

export class CommandScheduler {
  private tasks = new Map<string, ScheduledTask>();
  private seq = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  private runner: TaskRunner;
  private now: () => number;
  private tickIntervalMs: number;

  constructor(options: SchedulerOptions) {
    this.runner = options.runner;
    this.now = options.now ?? (() => Date.now());
    this.tickIntervalMs = options.tickIntervalMs ?? 1000;
  }

  // --------------------------------------------------------------------- //
  //  Création de tâches
  // --------------------------------------------------------------------- //

  /** Exécute une commande après `afterMs`. */
  schedule(
    raw: string,
    sender: ScheduledSender,
    afterMs: number,
    label?: string
  ): ScheduledTask {
    return this.create(raw, sender, this.now() + afterMs, null, null, label);
  }

  /** Exécute une commande à un timestamp précis. */
  scheduleAt(
    raw: string,
    sender: ScheduledSender,
    timestamp: number,
    label?: string
  ): ScheduledTask {
    return this.create(raw, sender, timestamp, null, null, label);
  }

  /** Commande récurrente toutes les `intervalMs`. */
  every(
    raw: string,
    sender: ScheduledSender,
    intervalMs: number,
    options?: { startAfterMs?: number; maxRuns?: number; label?: string }
  ): ScheduledTask {
    const first = this.now() + (options?.startAfterMs ?? intervalMs);
    return this.create(
      raw,
      sender,
      first,
      intervalMs,
      options?.maxRuns ?? null,
      options?.label
    );
  }

  private create(
    raw: string,
    sender: ScheduledSender,
    nextRun: number,
    intervalMs: number | null,
    maxRuns: number | null,
    label?: string
  ): ScheduledTask {
    const task: ScheduledTask = {
      id: `task_${this.now()}_${this.seq++}`,
      raw,
      sender,
      nextRun,
      intervalMs,
      runCount: 0,
      maxRuns,
      paused: false,
      label,
      createdAt: this.now(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  // --------------------------------------------------------------------- //
  //  Moteur
  // --------------------------------------------------------------------- //

  /**
   * Exécute toutes les tâches dues à l'instant `at` (défaut: now()).
   * Retourne le nombre de tâches exécutées. Moteur pur => testable.
   */
  async tick(at: number = this.now()): Promise<number> {
    let executed = 0;
    for (const task of [...this.tasks.values()]) {
      if (task.paused) continue;
      if (task.nextRun > at) continue;

      // Rattrapage : si on a "sauté" plusieurs intervalles, on exécute une fois
      // et on recale la prochaine exécution dans le futur.
      try {
        await this.runner(task.raw, task.sender);
      } catch {
        /* l'erreur d'une tâche ne doit pas casser le scheduler */
      }
      task.runCount++;
      executed++;

      const reachedMax =
        task.maxRuns !== null && task.runCount >= task.maxRuns;

      if (task.intervalMs === null || reachedMax) {
        this.tasks.delete(task.id);
      } else {
        // recale au prochain créneau strictement futur
        let next = task.nextRun + task.intervalMs;
        while (next <= at) next += task.intervalMs;
        task.nextRun = next;
      }
    }
    return executed;
  }

  // --------------------------------------------------------------------- //
  //  Timer réel
  // --------------------------------------------------------------------- //

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.tickIntervalMs);
    // Ne pas bloquer la sortie du process Node si dispo.
    (this.timer as any)?.unref?.();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // --------------------------------------------------------------------- //
  //  Gestion
  // --------------------------------------------------------------------- //

  cancel(id: string): boolean {
    return this.tasks.delete(id);
  }

  pause(id: string): boolean {
    const t = this.tasks.get(id);
    if (!t) return false;
    t.paused = true;
    return true;
  }

  resume(id: string): boolean {
    const t = this.tasks.get(id);
    if (!t) return false;
    t.paused = false;
    return true;
  }

  get(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  list(): ScheduledTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => a.nextRun - b.nextRun);
  }

  clear(): void {
    this.tasks.clear();
  }
}

export default CommandScheduler;
