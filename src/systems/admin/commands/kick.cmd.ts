// src/systems/admin/commands/kick.cmd.ts

import { IAdminCommand, CommandResult } from "../types";
import { AdminLogger } from "@/lib/firebase/adminLogger";

export const kickCommand: IAdminCommand = {
  verb: "kick",
  aliases: ["k"],
  description: "Expulser un joueur du serveur",
  usage: "kick <joueur> [raison]",
  minRole: "mod",

  async execute(args, executor, context): Promise<CommandResult> {
    if (args.length < 1) {
      return {
        success: false,
        message: "❌ Usage: kick <joueur> [raison]",
        type: "error",
      };
    }

    const targetName = args[0];
    const reason = args.slice(1).join(" ") || "Aucune raison fournie";

    // Cherche le joueur
    const target = findPlayer(targetName, context.players);
    if (!target) {
      return {
        success: false,
        message: `❌ Joueur "${targetName}" introuvable`,
        type: "error",
      };
    }

    // Empêche de kick un admin de rang supérieur
    if (target.role === "owner" || target.role === "admin") {
      return {
        success: false,
        message: `❌ Tu ne peux pas kick ${target.displayName} (rang supérieur)`,
        type: "error",
      };
    }

    // Envoie l'événement de kick via Socket.io
    context.socket.to(target.uid).emit("admin:kick", {
      reason,
      kickedBy: executor.displayName,
    });

    // Broadcast
    context.broadcast(
      `🦵 ${target.displayName} a été expulsé par ${executor.displayName} | Raison: ${reason}`
    );

    // Log Firebase
    await AdminLogger.log({
      action: "KICK",
      adminUid: executor.uid,
      adminName: executor.displayName,
      targetUid: target.uid,
      targetName: target.displayName,
      reason,
    });

    return {
      success: true,
      message: `✅ ${target.displayName} a été expulsé. Raison: ${reason}`,
      type: "success",
    };
  },
};