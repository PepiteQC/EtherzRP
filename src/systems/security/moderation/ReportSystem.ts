// src/systems/security/moderation/ReportSystem.ts

import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { DiscordWebhook } from "../audit/DiscordWebhook";

interface Report {
  id: string;
  reporterUid: string;
  reporterName: string;
  targetUid: string;
  targetName: string;
  reason: string;
  category: "cheat" | "toxicity" | "rdm" | "vdm" | "metagame" | "powergame" | "other";
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  adminNote?: string;
  timestamp: number;
}

export class ReportSystem {
  static async submit(
    reporterUid: string,
    reporterName: string,
    targetUid: string,
    targetName: string,
    reason: string,
    category: Report["category"],
    socket: any
  ): Promise<{ success: boolean; message: string }> {
    const report: Report = {
      id: `report_${Date.now()}`,
      reporterUid,
      reporterName,
      targetUid,
      targetName,
      reason,
      category,
      status: "pending",
      timestamp: Date.now(),
    };

    // Firebase
    await addDoc(collection(db, "reports"), {
      ...report,
      createdAt: serverTimestamp(),
    });

    // Alerter les admins en ligne
    socket.to("room:admins").emit("admin:new_report", report);

    // Discord
    await DiscordWebhook.sendAdminAlert({
      action: `📋 SIGNALEMENT (${category})`,
      adminName: reporterName,
      targetName,
      reason,
    });

    return {
      success: true,
      message: `✅ Signalement envoyé. Un admin va examiner ta plainte.`,
    };
  }
}