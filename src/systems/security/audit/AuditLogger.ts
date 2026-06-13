// src/systems/security/audit/AuditLogger.ts

import { db } from "@/lib/firebase/config";
import {
  collection, addDoc, serverTimestamp,
  query, where, getDocs, orderBy, limit,
} from "firebase/firestore";
import { Violation } from "../types";

export class AuditLogger {
  // ─── Logger une violation ─────────────────────────────────
  static async logViolation(violation: Violation): Promise<void> {
    try {
      await addDoc(collection(db, "security_violations"), {
        ...violation,
        server: "ETHERWORLD-QC-01",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[AUDIT] ❌ Log error:", err);
    }
  }

  // ─── Logger une action admin ──────────────────────────────
  static async logAdminAction(data: {
    adminUid: string;
    adminName: string;
    action: string;
    target?: string;
    details?: string;
  }): Promise<void> {
    try {
      await addDoc(collection(db, "audit_log"), {
        ...data,
        server: "ETHERWORLD-QC-01",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[AUDIT] ❌ Admin log error:", err);
    }
  }

  // ─── Récupérer les violations récentes ────────────────────
  static async getRecentViolations(
    limitCount = 100
  ): Promise<Violation[]> {
    const q = query(
      collection(db, "security_violations"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Violation);
  }

  // ─── Violations par joueur ────────────────────────────────
  static async getPlayerViolations(uid: string): Promise<Violation[]> {
    const q = query(
      collection(db, "security_violations"),
      where("playerUid", "==", uid),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Violation);
  }
}