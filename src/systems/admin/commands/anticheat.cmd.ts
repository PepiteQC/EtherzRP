// src/systems/admin/commands/anticheat.cmd.ts

import { IAdminCommand, CommandResult } from "../types";
import { AntiCheatEngine } from "@/systems/security/anticheat/AntiCheatEngine";

export const anticheatCommand: IAdminCommand = {
  verb: "ac",
  aliases: ["anticheat"],
  description: "Gérer l'anti-cheat",
  usage: "ac status | ac suspects | ac profile <joueur> | ac watch <joueur>",
  minRole: "admin",

  async execute(args, executor, context): Promise<CommandResult> {
    const sub = args[0]?.toLowerCase();

    switch (sub) {
      case "status": {
        const all = AntiCheatEngine.getAllProfiles();
        const suspects = AntiCheatEngine.getSuspects();
        return {
          success: true,
          message: [
            "🛡️ ANTI-CHEAT STATUS",
            `Joueurs surveillés: ${all.length}`,
            `Suspects: ${suspects.length}`,
            `Trust moyen: ${(all.reduce((s, p) => s + p.trustScore, 0) / all.length || 0).toFixed(0)}%`,
          ].join("\n"),
          type: "info",
        };
      }

      case "suspects": {
        const suspects = AntiCheatEngine.getSuspects();
        if (suspects.length === 0) {
          return {
            success: true,
            message: "🟢 Aucun suspect détecté",
            type: "info",
          };
        }
        const lines = suspects.map(
          (s) =>
            `  ⚠️ ${s.uid.slice(0, 8)} | Trust: ${s.trustScore}% | Violations: ${s.totalViolations} | ${s.isWatched ? "👁️ WATCH" : ""}`
        );
        return {
          success: true,
          message: `🔍 SUSPECTS:\n${lines.join("\n")}`,
          type: "warning",
        };
      }

      case "profile": {
        const targetName = args[1];
        if (!targetName) {
          return {
            success: false,
            message: "❌ Usage: ac profile <joueur>",
            type: "error",
          };
        }
        const player = findPlayer(targetName, context.players);
        if (!player) {
          return {
            success: false,
            message: "❌ Joueur introuvable",
            type: "error",
          };
        }
        const profile = AntiCheatEngine.getProfile(player.uid);
        if (!profile) {
          return {
            success: true,
            message: "ℹ️ Aucun profil de sécurité",
            type: "info",
          };
        }
        return {
          success: true,
          message: [
            `🛡️ Profil: ${player.displayName}`,
            `Trust Score: ${profile.trustScore}%`,
            `Violations: ${profile.totalViolations}`,
            `Banni: ${profile.isBanned ? "OUI" : "NON"}`,
            `Sous surveillance: ${profile.isWatched ? "OUI" : "NON"}`,
            `Dernières violations:`,
            ...profile.violations.slice(-5).map(
              (v) =>
                `  - ${v.type}: ${v.description} (${v.severity})`
            ),
          ].join("\n"),
          type: "info",
        };
      }

      case "watch": {
        const player = findPlayer(args[1], context.players);
        if (!player) {
          return {
            success: false,
            message: "❌ Joueur introuvable",
            type: "error",
          };
        }
        AntiCheatEngine.flagPlayer(player.uid, `Watch par ${executor.displayName}`);
        return {
          success: true,
          message: `👁️ ${player.displayName} est maintenant sous surveillance`,
          type: "success",
        };
      }

      default:
        return {
          success: false,
          message: "❌ Sous-commandes: status, suspects, profile, watch",
          type: "error",
        };
    }
  },
};