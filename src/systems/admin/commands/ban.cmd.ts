// src/systems/admin/commands/ban.cmd.ts

import { IAdminCommand, CommandResult } from "../types";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { AdminLogger } from "@/lib/firebase/adminLogger";

export const banCommand: IAdminCommand = {
  verb: "ban",
  aliases: ["b"],
  description: "Bannir un joueur",
  usage: "ban <joueur> <durée|perm> [raison]",
  minRole: "admin",

  async execute(args, executor, context): Promise<CommandResult> {
    if (args.length < 2) {
      return {
        success: false,
        message: "❌ Usage: ban <joueur> <durée(min)|perm> [raison]",
        type: "error",
      };
    }

    const targetName = args[0];
    const duration = args[1]; // "perm" ou nombre en minutes
    const reason = args.slice(2).join(" ") || "Aucune raison";

    const target = findPlayer(targetName, context.players);
    if (!target) {
      return {
        success: false,
        message: `❌ Joueur "${targetName}" introuvable`,
        type: "error",
      };
    }

    const isPerm = duration === "perm" || duration === "permanent";
    const durationMin = isPerm ? null : parseInt(duration);
    const expiresAt = durationMin
      ? new Date(Date.now() + durationMin * 60 * 1000)
      : null;

    // Sauvegarde dans Firebase
    await setDoc(doc(db, "bans", target.uid), {
      uid: target.uid,
      displayName: target.displayName,
      reason,
      bannedBy: executor.uid,
      bannedByName: executor.displayName,
      isPermanent: isPerm,
      expiresAt: expiresAt,
      createdAt: serverTimestamp(),
    });

    // Kick + informe
    context.socket.to(target.uid).emit("admin:ban", {
      reason,
      duration: isPerm ? "Permanent" : `${durationMin} minutes`,
      bannedBy: executor.displayName,
    });

    context.broadcast(
      `🔨 ${target.displayName} a été banni ${isPerm ? "DÉFINITIVEMENT" : `pour ${durationMin} min`} par ${executor.displayName} | ${reason}`
    );

    await AdminLogger.log({
      action: "BAN",
      adminUid: executor.uid,
      adminName: executor.displayName,
      targetUid: target.uid,
      targetName: target.displayName,
      reason,
      extra: { duration: isPerm ? "perm" : durationMin },
    });

    return {
      success: true,
      message: `✅ Ban appliqué sur ${target.displayName} (${isPerm ? "Permanent" : `${durationMin}min`})`,
      type: "success",
    };
  },
};