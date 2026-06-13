// src/systems/admin/commands/job.cmd.ts — à ajouter au CommandRegistry

import { IAdminCommand, CommandResult } from "../types";
import { JobManager } from "@/systems/jobs/JobManager";
import { PoliceDuty } from "@/systems/jobs/duties/PoliceDuty";
import { FactionSystem } from "@/systems/jobs/factions/FactionSystem";

export const jobCommand: IAdminCommand = {
  verb: "job",
  aliases: ["j"],
  description: "Gérer les jobs des joueurs",
  usage: "job set <joueur> <jobId> [rank] | job fire <joueur> | job list",
  minRole: "admin",

  async execute(args, executor, context): Promise<CommandResult> {
    const sub = args[0]?.toLowerCase();

    switch (sub) {
      case "set": {
        const [, target, jobId, rank] = args;
        if (!target || !jobId) {
          return {
            success: false,
            message: "❌ Usage: job set <joueur> <jobId> [rank]",
            type: "error",
          };
        }
        const player = findPlayer(target, context.players);
        if (!player) {
          return {
            success: false,
            message: `❌ Joueur "${target}" introuvable`,
            type: "error",
          };
        }
        const result = await JobManager.assignJob(
          player.uid,
          jobId as any,
          (rank as any) ?? "recruit"
        );
        return { ...result, type: result.success ? "success" : "error" };
      }

      case "fire": {
        const player = findPlayer(args[1], context.players);
        if (!player) {
          return {
            success: false,
            message: "❌ Joueur introuvable",
            type: "error",
          };
        }
        const result = await JobManager.assignJob(player.uid, "unemployed");
        return {
          success: true,
          message: `✅ ${player.displayName} a été viré!`,
          type: "success",
        };
      }

      case "list": {
        const all = context.players;
        const lines: string[] = ["📋 JOBS ACTIFS:"];
        for (const [, p] of all) {
          const pj = JobManager.getCache(p.uid);
          if (pj && pj.jobId !== "unemployed") {
            lines.push(
              `  ${pj.isOnDuty ? "🟢" : "🔴"} ${p.displayName} → ${pj.jobId} (${pj.rank})`
            );
          }
        }
        return { success: true, message: lines.join("\n"), type: "info" };
      }

      case "wanted": {
        const all = PoliceDuty.getAllWanted();
        if (all.length === 0) {
          return {
            success: true,
            message: "🟢 Aucun suspect recherché",
            type: "info",
          };
        }
        const lines = all.map(
          (w) =>
            `  ⭐${"⭐".repeat(w.stars)} ${w.displayName} | Amendes: $${w.totalFines} | Charges: ${w.crimes.length}`
        );
        return {
          success: true,
          message: `🚔 RECHERCHÉS:\n${lines.join("\n")}`,
          type: "info",
        };
      }

      default:
        return {
          success: false,
          message:
            "❌ Sous-commandes: set, fire, list, wanted",
          type: "error",
        };
    }
  },
};