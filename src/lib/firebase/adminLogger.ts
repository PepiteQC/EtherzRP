// src/lib/firebase/adminLogger.ts

import { db } from "./config";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

interface LogEntry {
  action: string;
  adminUid: string;
  adminName: string;
  targetUid?: string;
  targetName?: string;
  reason?: string;
  extra?: Record<string, any>;
}

export class AdminLogger {
  static async log(entry: LogEntry): Promise<void> {
    try {
      await addDoc(collection(db, "admin_logs"), {
        ...entry,
        server: "ETHERWORLD-QC-01",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("[AdminLogger] Erreur:", err);
    }
  }

  static async getLogs(adminUid?: string, limitCount = 50) {
    const ref = collection(db, "admin_logs");
    const q = adminUid
      ? query(
          ref,
          where("adminUid", "==", adminUid),
          orderBy("createdAt", "desc"),
          limit(limitCount)
        )
      : query(ref, orderBy("createdAt", "desc"), limit(limitCount));

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}