/**
 * AdvancedCommands.ts
 * ----------------------------------------------------------------------------
 * Fabrique de commandes avancées (régions, world-edit, économie poussée).
 *
 * Ces commandes ont besoin d'instances des systèmes (RegionSystem,
 * EconomySystem, WorldEditManager). On expose une fabrique
 * `createAdvancedCommands(systems)` qui retourne le tableau de
 * CommandDefinition prêt à être enregistré dans le manager.
 *
 * Les systèmes lisent la position du joueur via ctx.game.getPosition(id).
 * ----------------------------------------------------------------------------
 */

import {
  CommandContext,
  CommandDefinition,
  CommandResult,
} from "../../console/CommandParser";
import { AdminFlag, PermissionLevel } from "../../permissions/PermissionSystem";
import { EconomySystem } from "./EconomySystem";
import { RegionFlag, RegionSystem, Vec3 } from "./RegionSystem";
import { WorldEditManager } from "./WorldEditSystem";

export interface AdvancedSystems {
  regions: RegionSystem;
  economy: EconomySystem;
  worldEdit: WorldEditManager;
}

function ok(message: string, extra?: Partial<CommandResult>): CommandResult {
  return { success: true, message, ...extra };
}
function fail(message: string): CommandResult {
  return { success: false, message };
}

/** Récupère la position du sender via l'adaptateur de jeu. */
function pos(ctx: CommandContext): Vec3 {
  const p = ctx.game?.getPosition?.(ctx.senderId);
  if (!p) throw new Error("Position du joueur indisponible (game.getPosition manquant).");
  return p;
}

export function createAdvancedCommands(systems: AdvancedSystems): CommandDefinition[] {
  const { regions, economy, worldEdit } = systems;

  // ===================================================================== //
  //  RÉGIONS
  // ===================================================================== //

  const region: CommandDefinition = {
    name: "region",
    description: "Gère les régions : create, remove, info, flag, addmember, list.",
    category: "Régions",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.MANAGE_ADMINS, // protégé (réutilise un flag fort)
    aliases: ["rg"],
    usage: "region <create|remove|info|flag|addmember|list> [...]",
    args: [
      { name: "action", type: "string", required: true },
      { name: "a", type: "string", required: false },
      { name: "b", type: "string", required: false },
      { name: "c", type: "string", required: false },
    ],
    handler: (args, ctx) => {
      const action = String(args.action).toLowerCase();
      switch (action) {
        case "create": {
          if (!args.a) return fail("Usage: region create <id> [priorité]");
          const p1 = ctx.game?.getSelectionPos1?.(ctx.senderId) ?? pos(ctx);
          const p2 = ctx.game?.getSelectionPos2?.(ctx.senderId) ?? pos(ctx);
          const r = regions.define(args.a, args.a, p1, p2, {
            priority: Number(args.b) || 0,
            owner: ctx.senderId,
          });
          return ok(`🗺️  Région "${r.id}" créée (${r.min.x},${r.min.y},${r.min.z} → ${r.max.x},${r.max.y},${r.max.z}).`, {
            target: r.id,
            data: { regionId: r.id },
          });
        }
        case "remove": {
          if (!args.a) return fail("Usage: region remove <id>");
          return regions.remove(args.a)
            ? ok(`🗑️  Région "${args.a}" supprimée.`, { target: args.a })
            : fail(`Région "${args.a}" introuvable.`);
        }
        case "info": {
          if (!args.a) return fail("Usage: region info <id>");
          const r = regions.get(args.a);
          if (!r) return fail(`Région "${args.a}" introuvable.`);
          const flags = Object.entries(r.flags)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ") || "(défauts)";
          return ok(
            `🗺️  ${r.name} [prio ${r.priority}]\n   owners: ${r.owners.join(", ") || "-"}\n   membres: ${r.members.join(", ") || "-"}\n   flags: ${flags}`
          );
        }
        case "flag": {
          if (!args.a || !args.b || args.c === undefined)
            return fail("Usage: region flag <id> <flag> <true|false>");
          const value = ["true", "1", "on", "oui"].includes(String(args.c).toLowerCase());
          return regions.setFlag(args.a, args.b as RegionFlag, value)
            ? ok(`🚩 Flag "${args.b}" = ${value} sur "${args.a}".`, { target: args.a })
            : fail(`Région "${args.a}" introuvable.`);
        }
        case "addmember": {
          if (!args.a || !args.b) return fail("Usage: region addmember <id> <userId>");
          return regions.addMember(args.a, args.b)
            ? ok(`👥 ${args.b} ajouté à "${args.a}".`, { target: args.a })
            : fail(`Région "${args.a}" introuvable.`);
        }
        case "list": {
          const list = regions.list();
          if (list.length === 0) return ok("Aucune région définie.");
          return ok(`🗺️  ${list.length} région(s) : ${list.map((r) => r.id).join(", ")}`);
        }
        default:
          return fail(`Action inconnue "${action}". (create|remove|info|flag|addmember|list)`);
      }
    },
  };

  // ===================================================================== //
  //  WORLD-EDIT
  // ===================================================================== //

  const pos1: CommandDefinition = {
    name: "pos1",
    description: "Définit la position 1 de sélection (position actuelle).",
    category: "WorldEdit",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.SET_TIME,
    handler: (_a, ctx) => {
      const p = pos(ctx);
      worldEdit.session(ctx.senderId).setPos1(p);
      return ok(`📐 pos1 = (${p.x}, ${p.y}, ${p.z}).`);
    },
  };

  const pos2: CommandDefinition = {
    name: "pos2",
    description: "Définit la position 2 de sélection (position actuelle).",
    category: "WorldEdit",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.SET_TIME,
    handler: (_a, ctx) => {
      const p = pos(ctx);
      worldEdit.session(ctx.senderId).setPos2(p);
      return ok(`📐 pos2 = (${p.x}, ${p.y}, ${p.z}).`);
    },
  };

  const setCmd: CommandDefinition = {
    name: "set",
    description: "Remplit la sélection avec un bloc.",
    category: "WorldEdit",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.SET_TIME,
    usage: "set <blockId>",
    args: [{ name: "block", type: "string", required: true }],
    handler: (a, ctx) => {
      try {
        const n = worldEdit.session(ctx.senderId).set(a.block);
        return ok(`🧱 ${n} bloc(s) changé(s) en "${a.block}".`, { data: { count: n } });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  };

  const fillCmd: CommandDefinition = {
    name: "fill",
    description: "Remplace un bloc par un autre dans la sélection.",
    category: "WorldEdit",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.SET_TIME,
    usage: "fill <from> <to>",
    args: [
      { name: "from", type: "string", required: true },
      { name: "to", type: "string", required: true },
    ],
    handler: (a, ctx) => {
      try {
        const n = worldEdit.session(ctx.senderId).fill(a.from, a.to);
        return ok(`🧱 ${n} bloc(s) "${a.from}" → "${a.to}".`, { data: { count: n } });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  };

  const copyCmd: CommandDefinition = {
    name: "copy",
    description: "Copie la sélection dans le presse-papier.",
    category: "WorldEdit",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.SET_TIME,
    handler: (_a, ctx) => {
      try {
        const n = worldEdit.session(ctx.senderId).copy();
        return ok(`📋 ${n} bloc(s) copié(s).`, { data: { count: n } });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  };

  const pasteCmd: CommandDefinition = {
    name: "paste",
    description: "Colle le presse-papier à la position actuelle.",
    category: "WorldEdit",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.SET_TIME,
    handler: (_a, ctx) => {
      try {
        const n = worldEdit.session(ctx.senderId).paste(pos(ctx));
        return ok(`📋 ${n} bloc(s) collé(s).`, { data: { count: n } });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  };

  const undoCmd: CommandDefinition = {
    name: "undo",
    description: "Annule la dernière opération world-edit.",
    category: "WorldEdit",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.SET_TIME,
    handler: (_a, ctx) => {
      const n = worldEdit.session(ctx.senderId).undo();
      return n > 0 ? ok(`↩️  ${n} bloc(s) restauré(s).`) : fail("Rien à annuler.");
    },
  };

  // ===================================================================== //
  //  ÉCONOMIE POUSSÉE
  // ===================================================================== //

  const bank: CommandDefinition = {
    name: "bank",
    description: "Banque : balance, deposit, withdraw.",
    category: "Économie+",
    level: PermissionLevel.USER,
    aliases: ["b"],
    usage: "bank <balance|deposit|withdraw> [montant]",
    args: [
      { name: "action", type: "string", required: true },
      { name: "amount", type: "number", required: false },
    ],
    handler: (a, ctx) => {
      const action = String(a.action).toLowerCase();
      try {
        if (action === "balance") {
          const b = economy.getBalance(ctx.senderId);
          return ok(`🏦 ${ctx.senderName} — Liquide: ${b.cash}$ | Banque: ${b.bank}$ | Total: ${b.total}$`);
        }
        if (action === "deposit") {
          const tx = economy.deposit(ctx.senderId, Number(a.amount));
          return ok(`🏦 Dépôt de ${tx.amount}$. Banque: ${tx.balanceAfter}$.`);
        }
        if (action === "withdraw") {
          const tx = economy.withdraw(ctx.senderId, Number(a.amount));
          return ok(`🏦 Retrait de ${tx.amount}$. Liquide: ${tx.balanceAfter}$.`);
        }
        return fail("Action inconnue (balance|deposit|withdraw).");
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  };

  const pay: CommandDefinition = {
    name: "pay",
    description: "Transfère de l'argent à un joueur (taxe appliquée).",
    category: "Économie+",
    level: PermissionLevel.USER,
    usage: "pay <joueur> <montant>",
    args: [
      { name: "player", type: "player", required: true },
      { name: "amount", type: "number", required: true },
    ],
    handler: (a, ctx) => {
      try {
        const { net, tax } = economy.transfer(ctx.senderId, a.player.id, a.amount);
        return ok(
          `💸 ${a.player.name} a reçu ${net}$ (taxe ${tax}$).`,
          { target: a.player.name, data: { net, tax } }
        );
      } catch (e) {
        return fail((e as Error).message);
      }
    },
  };

  const interest: CommandDefinition = {
    name: "interest",
    description: "Applique les intérêts bancaires à tous les comptes.",
    category: "Économie+",
    level: PermissionLevel.ADMIN,
    flag: AdminFlag.SET_MONEY,
    handler: () => {
      const r = economy.applyInterest();
      return ok(`📈 Intérêts versés : ${r.totalPaid}$ sur ${r.accounts} compte(s).`, {
        data: r,
      });
    },
  };

  const baltop: CommandDefinition = {
    name: "baltop",
    description: "Classement des joueurs les plus riches.",
    category: "Économie+",
    level: PermissionLevel.MODERATOR,
    flag: AdminFlag.VIEW_MONEY,
    args: [{ name: "n", type: "number", default: 10 }],
    handler: (a) => {
      const top = economy.leaderboard(Number(a.n) || 10);
      if (top.length === 0) return ok("Aucun compte.");
      const lines = top.map((t, i) => `  ${i + 1}. ${t.id} — ${t.total}$`);
      return ok(`🏆 Classement fortune :\n${lines.join("\n")}`);
    },
  };

  const txlog: CommandDefinition = {
    name: "txlog",
    description: "Historique des transactions (soi ou un joueur).",
    category: "Économie+",
    level: PermissionLevel.MODERATOR,
    flag: AdminFlag.VIEW_MONEY,
    usage: "txlog [joueur]",
    args: [{ name: "player", type: "player", required: false }],
    handler: (a, ctx) => {
      const id = a.player ? a.player.id : ctx.senderId;
      const txs = economy.getTransactions(id, 10);
      if (txs.length === 0) return ok("Aucune transaction.");
      const lines = txs.map(
        (t) => `  [${t.type}] ${t.amount}$ → solde ${t.balanceAfter}$`
      );
      return ok(`🧾 10 dernières transactions de ${id} :\n${lines.join("\n")}`);
    },
  };

  return [
    // Régions
    region,
    // World-edit
    pos1,
    pos2,
    setCmd,
    fillCmd,
    copyCmd,
    pasteCmd,
    undoCmd,
    // Économie+
    bank,
    pay,
    interest,
    baltop,
    txlog,
  ];
}

export default createAdvancedCommands;
