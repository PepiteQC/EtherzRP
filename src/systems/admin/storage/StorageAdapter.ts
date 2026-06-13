/**
 * StorageAdapter.ts
 * ----------------------------------------------------------------------------
 * Abstraction de persistance pour la console admin.
 *
 * L'idée : le reste du système ne connaît qu'une interface (StorageAdapter).
 * On peut donc brancher Firestore, un fichier JSON, LocalStorage, ou une
 * implémentation mémoire (tests) sans rien changer ailleurs.
 *
 *  - Persistance des logs d'audit (append + query)
 *  - Persistance d'état clé/valeur (snapshots, régions, économie...)
 *  - Sauvegarde / restauration globale
 * ----------------------------------------------------------------------------
 */

import { CommandLog, LogFilter } from "../console/CommandLogger";

/** Instantané complet d'un sous-système (sérialisable JSON). */
export interface StateSnapshot {
  key: string;
  /** Données arbitraires sérialisables. */
  data: unknown;
  updatedAt: number;
  version: number;
}

/** Sauvegarde complète (logs + états). */
export interface FullBackup {
  createdAt: number;
  version: string;
  logs: CommandLog[];
  states: StateSnapshot[];
}

/**
 * Contrat de persistance. Toutes les méthodes sont asynchrones pour rester
 * compatibles avec Firestore / réseau.
 */
export interface StorageAdapter {
  readonly name: string;

  // --- Logs d'audit ---
  appendLog(log: CommandLog): Promise<void>;
  /** Insertion en lot (flush de buffer). */
  appendLogs(logs: CommandLog[]): Promise<void>;
  queryLogs(filter?: LogFilter, limit?: number): Promise<CommandLog[]>;
  clearLogs(): Promise<void>;

  // --- État clé/valeur ---
  saveState(key: string, data: unknown): Promise<void>;
  loadState<T = unknown>(key: string): Promise<T | undefined>;
  deleteState(key: string): Promise<void>;
  listStateKeys(): Promise<string[]>;

  // --- Sauvegarde / restauration globale ---
  createBackup(): Promise<FullBackup>;
  restoreBackup(backup: FullBackup): Promise<void>;
}

/** Applique un LogFilter à une liste en mémoire (réutilisé par plusieurs adapters). */
export function filterLogsInMemory(
  logs: CommandLog[],
  filter?: LogFilter
): CommandLog[] {
  if (!filter) return logs;
  return logs.filter((l) => {
    if (filter.adminId && l.adminId !== filter.adminId) return false;
    if (
      filter.commandName &&
      l.commandName.toLowerCase() !== filter.commandName.toLowerCase()
    )
      return false;
    if (filter.target && l.target !== filter.target) return false;
    if (filter.success !== undefined && l.success !== filter.success) return false;
    if (filter.from !== undefined && l.timestamp < filter.from) return false;
    if (filter.to !== undefined && l.timestamp > filter.to) return false;
    return true;
  });
}

export const BACKUP_VERSION = "1.0.0";
