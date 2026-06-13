// src/systems/jobs/PayrollSystem.ts

import { db } from "@/lib/firebase/config";
import { doc, updateDoc, increment } from "firebase/firestore";
import { JobManager } from "./JobManager";

export class PayrollSystem {
  private static intervals: Map<string, NodeJS.Timeout> = new Map();
  private static readonly PAY_INTERVAL = 10 * 60 * 1000; // Paye toutes les 10 min RP

  // ─── Démarrer le payroll pour un joueur ───────────────────
  static start(uid: string): void {
    if (this.intervals.has(uid)) return;

    const interval = setInterval(async () => {
      const pj = JobManager.getCache(uid);
      if (!pj || !pj.isOnDuty || pj.salary <= 0) return;

      // Salaire proportionnel (10min = 1/6 du salaire horaire)
      const pay = Math.floor(pj.salary / 6);

      // Ajouter au compte bancaire Firebase
      await updateDoc(doc(db, "players", uid), {
        bankBalance: increment(pay),
      });

      console.log(
        `[PAYROLL] 💰 ${uid} a reçu $${pay} (${pj.jobId})`
      );
    }, this.PAY_INTERVAL);

    this.intervals.set(uid, interval);
  }

  // ─── Arrêter le payroll ───────────────────────────────────
  static stop(uid: string): void {
    const interval = this.intervals.get(uid);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(uid);
    }
  }

  // ─── Tout stopper (shutdown serveur) ──────────────────────
  static stopAll(): void {
    this.intervals.forEach((i) => clearInterval(i));
    this.intervals.clear();
  }
}