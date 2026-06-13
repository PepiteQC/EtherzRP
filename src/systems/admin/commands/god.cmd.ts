// src/systems/admin/commands/god.cmd.ts

import { IAdminCommand, CommandResult } from "../types";

export const godCommand: IAdminCommand = {
  verb: "god",
  aliases: ["godmode"],
  description: "Activer/désactiver le mode god pour un joueur",
  usage: "god <joueur>",
  minRole: "admin",

  async execute(args, executor, context): Promise<CommandResult> {
    const targetName = args[0] ?? executor.displayName;
    const target = findPlayer(targetName, context.players);

    if (!target) {
      return {
        success: false,
        message: `❌ Joueur "${targetName}" introuvable`,
        type: "error",
      };
    }

    target.isGod = !target.isGod;

    context.socket.to(target.uid).emit("admin:god", {
      enabled: target.isGod,
    });

    return {
      success: true,
      message: `✅ God Mode ${target.isGod ? "ACTIVÉ 🌟" : "DÉSACTIVÉ 💀"} pour ${target.displayName}`,
      type: "success",
    };
  },
};