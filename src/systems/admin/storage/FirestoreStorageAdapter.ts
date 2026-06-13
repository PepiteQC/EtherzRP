/**
 * FirestoreStorageAdapter.ts
 * ----------------------------------------------------------------------------
 * Implémentation Firestore de StorageAdapter.
 *
 * Pour éviter une dépendance dure au SDK `firebase` (et garder le module
 * testable), on définit une petite interface minimale (FirestoreLike) qui
 * correspond exactement à la surface du SDK modulaire `firebase/firestore`
 * dont nous avons besoin. Vous injectez l'instance + les fonctions.
 *
 * Branchement réel (firebase v9+ modulaire) :
 * ----------------------------------------------------------------------------
 *   import { initializeApp } from "firebase/app";
 *   import {
 *     getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs,
 *     deleteDoc, query, where, orderBy, limit as fbLimit, writeBatch,
 *   } from "firebase/firestore";
 *
 *   const app = initializeApp(firebaseConfig);
 *   const db = getFirestore(app);
 *
 *   const adapter = new FirestoreStorageAdapter(db, {
 *     collection, doc, addDoc, setDoc, getDoc, getDocs, deleteDoc,
 *     query, where, orderBy, limit: fbLimit, writeBatch,
 *   });
 * ----------------------------------------------------------------------------
 */

import { CommandLog, LogFilter } from "../console/CommandLogger";
import {
  BACKUP_VERSION,
  FullBackup,
  StateSnapshot,
  StorageAdapter,
} from "./StorageAdapter";

// --- Interfaces minimales miroir du SDK Firestore modulaire ---------------- //

export interface FirestoreDb {} // opaque (l'instance getFirestore)
export interface FsCollectionRef {}
export interface FsDocRef {}
export interface FsQuery {}
export interface FsQueryConstraint {}
export interface FsDocSnap {
  exists(): boolean;
  data(): any;
  id: string;
}
export interface FsQuerySnap {
  docs: FsDocSnap[];
}
export interface FsBatch {
  set(ref: FsDocRef, data: any): FsBatch;
  delete(ref: FsDocRef): FsBatch;
  commit(): Promise<void>;
}

/** Les fonctions du SDK modulaire dont nous avons besoin. */
export interface FirestoreFns {
  collection: (db: FirestoreDb, path: string) => FsCollectionRef;
  doc: (parent: FirestoreDb | FsCollectionRef, ...path: string[]) => FsDocRef;
  addDoc: (col: FsCollectionRef, data: any) => Promise<{ id: string }>;
  setDoc: (ref: FsDocRef, data: any) => Promise<void>;
  getDoc: (ref: FsDocRef) => Promise<FsDocSnap>;
  getDocs: (q: FsQuery | FsCollectionRef) => Promise<FsQuerySnap>;
  deleteDoc: (ref: FsDocRef) => Promise<void>;
  query: (col: FsCollectionRef, ...constraints: FsQueryConstraint[]) => FsQuery;
  where: (field: string, op: string, value: any) => FsQueryConstraint;
  orderBy: (field: string, dir?: "asc" | "desc") => FsQueryConstraint;
  limit: (n: number) => FsQueryConstraint;
  writeBatch: (db: FirestoreDb) => FsBatch;
}

export interface FirestoreAdapterOptions {
  /** Collection des logs (défaut: "admin_logs"). */
  logsCollection?: string;
  /** Collection des états (défaut: "admin_state"). */
  statesCollection?: string;
}

export class FirestoreStorageAdapter implements StorageAdapter {
  readonly name = "firestore";

  private logsCol: string;
  private statesCol: string;

  constructor(
    private db: FirestoreDb,
    private fns: FirestoreFns,
    options?: FirestoreAdapterOptions
  ) {
    this.logsCol = options?.logsCollection ?? "admin_logs";
    this.statesCol = options?.statesCollection ?? "admin_state";
  }

  // --- Logs --------------------------------------------------------------- //

  async appendLog(log: CommandLog): Promise<void> {
    const col = this.fns.collection(this.db, this.logsCol);
    // On utilise l'id du log comme id de document (évite les doublons).
    const ref = this.fns.doc(col, log.id);
    await this.fns.setDoc(ref, log);
  }

  async appendLogs(logs: CommandLog[]): Promise<void> {
    if (logs.length === 0) return;
    // Firestore limite un batch à 500 opérations -> on découpe.
    const col = this.fns.collection(this.db, this.logsCol);
    for (let i = 0; i < logs.length; i += 450) {
      const batch = this.fns.writeBatch(this.db);
      for (const log of logs.slice(i, i + 450)) {
        batch.set(this.fns.doc(col, log.id), log);
      }
      await batch.commit();
    }
  }

  async queryLogs(filter?: LogFilter, max = 1000): Promise<CommandLog[]> {
    const col = this.fns.collection(this.db, this.logsCol);
    const constraints: FsQueryConstraint[] = [];

    if (filter?.adminId) constraints.push(this.fns.where("adminId", "==", filter.adminId));
    if (filter?.commandName)
      constraints.push(this.fns.where("commandName", "==", filter.commandName));
    if (filter?.target) constraints.push(this.fns.where("target", "==", filter.target));
    if (filter?.success !== undefined)
      constraints.push(this.fns.where("success", "==", filter.success));
    if (filter?.from !== undefined)
      constraints.push(this.fns.where("timestamp", ">=", filter.from));
    if (filter?.to !== undefined)
      constraints.push(this.fns.where("timestamp", "<=", filter.to));

    constraints.push(this.fns.orderBy("timestamp", "asc"));
    constraints.push(this.fns.limit(max));

    const q = this.fns.query(col, ...constraints);
    const snap = await this.fns.getDocs(q);
    return snap.docs.map((d) => d.data() as CommandLog);
  }

  async clearLogs(): Promise<void> {
    const col = this.fns.collection(this.db, this.logsCol);
    const snap = await this.fns.getDocs(col);
    for (let i = 0; i < snap.docs.length; i += 450) {
      const batch = this.fns.writeBatch(this.db);
      for (const d of snap.docs.slice(i, i + 450)) {
        batch.delete(this.fns.doc(col, d.id));
      }
      await batch.commit();
    }
  }

  // --- États -------------------------------------------------------------- //

  async saveState(key: string, data: unknown): Promise<void> {
    const ref = this.fns.doc(this.fns.collection(this.db, this.statesCol), key);
    const existing = await this.fns.getDoc(ref);
    const prevVersion = existing.exists() ? (existing.data()?.version ?? 0) : 0;
    const snapshot: StateSnapshot = {
      key,
      data,
      updatedAt: Date.now(),
      version: prevVersion + 1,
    };
    await this.fns.setDoc(ref, snapshot);
  }

  async loadState<T = unknown>(key: string): Promise<T | undefined> {
    const ref = this.fns.doc(this.fns.collection(this.db, this.statesCol), key);
    const snap = await this.fns.getDoc(ref);
    if (!snap.exists()) return undefined;
    return (snap.data() as StateSnapshot).data as T;
  }

  async deleteState(key: string): Promise<void> {
    const ref = this.fns.doc(this.fns.collection(this.db, this.statesCol), key);
    await this.fns.deleteDoc(ref);
  }

  async listStateKeys(): Promise<string[]> {
    const col = this.fns.collection(this.db, this.statesCol);
    const snap = await this.fns.getDocs(col);
    return snap.docs.map((d) => d.id);
  }

  // --- Backup ------------------------------------------------------------- //

  async createBackup(): Promise<FullBackup> {
    const logs = await this.queryLogs(undefined, 100_000);
    const statesSnap = await this.fns.getDocs(
      this.fns.collection(this.db, this.statesCol)
    );
    const states = statesSnap.docs.map((d) => d.data() as StateSnapshot);
    return { createdAt: Date.now(), version: BACKUP_VERSION, logs, states };
  }

  async restoreBackup(backup: FullBackup): Promise<void> {
    await this.clearLogs();
    await this.appendLogs(backup.logs);
    for (const s of backup.states) {
      const ref = this.fns.doc(this.fns.collection(this.db, this.statesCol), s.key);
      await this.fns.setDoc(ref, s);
    }
  }
}

export default FirestoreStorageAdapter;
