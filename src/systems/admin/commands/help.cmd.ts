// src/systems/admin/commands/help.cmd.ts

import { IAdminCommand, CommandResult } from "../types";
import { CommandRegistry } from "../CommandRegistry";

export const helpCommand: IAdminCommand = {
  verb: "help",
  aliases: ["h", "?"],
  description: "Afficher la liste des commandes disponibles",
  usage: "help [commande]",
  minRole: "mod",

  async execute(args, executor, context): Promise<CommandResult> {
    const all = CommandRegistry.getAll();

    if (args.length > 0) {
      // Aide spécifique
      const cmd = CommandRegistry.get(args[0]);
      if (!cmd) {
        return {
          success: false,
          message: `❌ Commande "${args[0]}" inconnue`,
          type: "error",
        };
      }
      return {
        success: true,
        message: [
          `📖 ${cmd.verb.toUpperCase()}`,
          `Description: ${cmd.description}`,
          `Usage: ${cmd.usage}`,
          `Permission: ${cmd.minRole}`,
          `Alias: ${cmd.aliases?.join(", ") ?? "Aucun"}`,
        ].join("\n"),
        type: "info",
      };
    }

    // Liste complète
    const lines = [
      "┌─────────────────────────────────────┐",
      "│  🎮  ETHERWORLD RP - COMMANDES ADMIN │",
      "├─────────────────────────────────────┤",
      ...all.map(
        (c) =>
          `│  /${c.verb.padEnd(12)} - ${c.description.substring(0, 22).padEnd(22)} │`
      ),
      "└─────────────────────────────────────┘",
      'ℹ️  Tape "help <commande>" pour plus de détails',
    ];

    return {
      success: true,
      message: lines.join("\n"),
      type: "info",
    };
  },
};