/**
 * MemoryStorageAdapter.ts
 * ----------------------------------------------------------------------------
 * Implémentation en mémoire de StorageAdapter.
 * Sert de référence, de fallback et de base pour les tests (aucune dépendance).
 * ----------------------------------------------------------------------------
 */

import { CommandLog, LogFilter } from "../console/CommandLogger";
import {
  BACKUP_VERSION,
  FullBackup,
  StateSnapshot,
  StorageAdapter,
  filterLogsInMemory,
} from "./StorageAdapter";

export class MemoryStorageAdapter implements StorageAdapter {
  readonly name = "memory";

  private logs: CommandLog[] = [];
  private states = new Map<string, StateSnapshot>();

  async appendLog(log: CommandLog): Promise<void> {
    this.logs.push(log);
  }

  async appendLogs(logs: CommandLog[]): Promise<void> {
    this.logs.push(...logs);
  }

  async queryLogs(filter?: LogFilter, limit?: number): Promise<CommandLog[]> {
    const filtered = filterLogsInMemory(this.logs, filter);
    return limit ? filtered.slice(-limit) : [...filtered];
  }

  async clearLogs(): Promise<void> {
    this.logs = [];
  }

  async saveState(key: string, data: unknown): Promise<void> {
    const prev = this.states.get(key);
    this.states.set(key, {
      key,
      data,
      updatedAt: Date.now(),
      version: (prev?.version ?? 0) + 1,
    });
  }

  async loadState<T = unknown>(key: string): Promise<T | undefined> {
    return this.states.get(key)?.data as T | undefined;
  }

  async deleteState(key: string): Promise<void> {
    this.states.delete(key);
  }

  async listStateKeys(): Promise<string[]> {
    return Array.from(this.states.keys());
  }

  async createBackup(): Promise<FullBackup> {
    return {
      createdAt: Date.now(),
      version: BACKUP_VERSION,
      logs: [...this.logs],
      states: Array.from(this.states.values()).map((s) => ({ ...s })),
    };
  }

  async restoreBackup(backup: FullBackup): Promise<void> {
    this.logs = [...backup.logs];
    this.states = new Map(backup.states.map((s) => [s.key, { ...s }]));
  }
}

export default MemoryStorageAdapter;
