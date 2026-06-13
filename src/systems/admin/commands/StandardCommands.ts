/**
 * StandardCommands.ts
 * ----------------------------------------------------------------------------
 * Bibliothèque de commandes admin prêtes à l'emploi (30+).
 *
 *  Modération  : kick, ban, mute, unmute, warn, unban
 *  Téléport    : tp, tpm, tpc, back
 *  Joueur      : freeze, unfreeze, godmode, invisible, heal, armor
 *  Serveur     : time, weather, announce, status, players
 *  Économie    : give, setmoney, money
 *  Aide        : help, admin, perms
 *  Owner       : restart
 *
 * Chaque commande valide ses arguments (via le parser) et porte un niveau +
 * un drapeau de permission. Les handlers appellent l'adaptateur `ctx.game`
 * lorsqu'il est disponible, sinon ils simulent l'effet (mode démo).
 * ----------------------------------------------------------------------------
 */

import {
  CommandContext,
  CommandDefinition,
  CommandResult,
  Player,
} from "../console/CommandParser";
import { AdminFlag, PermissionLevel } from "../permissions/PermissionSystem";

// Helper : appelle une méthode de l'adaptateur jeu si présente.
function game(ctx: CommandContext): Record<string, any> {
  return ctx.game ?? {};
}

function ok(message: string, extra?: Partial<CommandResult>): CommandResult {
  return { success: true, message, ...extra };
}

function fail(message: string, extra?: Partial<CommandResult>): CommandResult {
  return { success: false, message, ...extra };
}

function playerLabel(p: Player): string {
  return p.name ?? p.id;
}

// =========================================================================== //
//  MODÉRATION
// =========================================================================== //

const kick: CommandDefinition = {
  name: "kick",
  description: "Expulse un joueur du serveur.",
  category: "Modération",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.KICK_PLAYERS,
  usage: "kick <joueur> [raison]",
  args: [
    { name: "player", type: "player", required: true },
    { name: "reason", type: "string", rest: true, default: "Expulsé par un modérateur." },
  ],
  handler: (a, ctx) => {
    game(ctx).kickPlayer?.(a.player.id, a.reason);
    return ok(`👢 ${playerLabel(a.player)} a été expulsé. Raison : ${a.reason}`, {
      target: a.player.name,
      data: { targetId: a.player.id, targetName: a.player.name, reason: a.reason },
    });
  },
};

const ban: CommandDefinition = {
  name: "ban",
  description: "Bannit un joueur (durée optionnelle en minutes, 0 = permanent).",
  category: "Modération",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.BAN_PLAYERS,
  usage: "ban <joueur> [minutes] [raison]",
  args: [
    { name: "player", type: "player", required: true },
    { name: "minutes", type: "number", default: 0 },
    { name: "reason", type: "string", rest: true, default: "Banni." },
  ],
  handler: (a, ctx) => {
    game(ctx).banPlayer?.(a.player.id, a.minutes, a.reason);
    const dur = a.minutes > 0 ? `${a.minutes} min` : "permanent";
    return ok(`🔨 ${playerLabel(a.player)} banni (${dur}). Raison : ${a.reason}`, {
      target: a.player.name,
      data: { targetId: a.player.id, targetName: a.player.name, minutes: a.minutes, reason: a.reason },
    });
  },
};

const unban: CommandDefinition = {
  name: "unban",
  description: "Lève le bannissement d'un joueur (par nom/id).",
  category: "Modération",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.UNBAN_PLAYERS,
  usage: "unban <nom|id>",
  args: [{ name: "target", type: "string", required: true }],
  handler: (a, ctx) => {
    game(ctx).unbanPlayer?.(a.target);
    return ok(`✅ Bannissement levé pour "${a.target}".`, { target: a.target });
  },
};

const mute: CommandDefinition = {
  name: "mute",
  description: "Rend un joueur muet (durée en minutes, 0 = jusqu'à unmute).",
  category: "Modération",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.MUTE_PLAYERS,
  usage: "mute <joueur> [minutes]",
  args: [
    { name: "player", type: "player", required: true },
    { name: "minutes", type: "number", default: 0 },
  ],
  handler: (a, ctx) => {
    game(ctx).mutePlayer?.(a.player.id, a.minutes);
    const dur = a.minutes > 0 ? `${a.minutes} min` : "indéfini";
    return ok(`🔇 ${playerLabel(a.player)} rendu muet (${dur}).`, {
      target: a.player.name,
      data: { targetId: a.player.id, minutes: a.minutes },
    });
  },
};

const unmute: CommandDefinition = {
  name: "unmute",
  description: "Rend la parole à un joueur.",
  category: "Modération",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.MUTE_PLAYERS,
  usage: "unmute <joueur>",
  args: [{ name: "player", type: "player", required: true }],
  handler: (a, ctx) => {
    game(ctx).unmutePlayer?.(a.player.id);
    return ok(`🔊 ${playerLabel(a.player)} peut de nouveau parler.`, {
      target: a.player.name,
    });
  },
};

const warn: CommandDefinition = {
  name: "warn",
  description: "Avertit un joueur.",
  category: "Modération",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.WARN_PLAYERS,
  usage: "warn <joueur> <raison>",
  args: [
    { name: "player", type: "player", required: true },
    { name: "reason", type: "string", rest: true, required: true },
  ],
  handler: (a, ctx) => {
    game(ctx).warnPlayer?.(a.player.id, a.reason);
    return ok(`⚠️  ${playerLabel(a.player)} averti : ${a.reason}`, {
      target: a.player.name,
      data: { targetId: a.player.id, reason: a.reason },
    });
  },
};

// =========================================================================== //
//  TÉLÉPORTATION
// =========================================================================== //

const tp: CommandDefinition = {
  name: "tp",
  description: "Se téléporte vers un joueur.",
  category: "Téléportation",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.TELEPORT_SELF,
  aliases: ["teleport"],
  usage: "tp <joueur>",
  args: [{ name: "player", type: "player", required: true }],
  handler: (a, ctx) => {
    game(ctx).teleportToPlayer?.(ctx.senderId, a.player.id);
    return ok(`🚀 Téléporté vers ${playerLabel(a.player)}.`, { target: a.player.name });
  },
};

const tpm: CommandDefinition = {
  name: "tpm",
  description: "Téléporte un joueur vers soi.",
  category: "Téléportation",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.TELEPORT_OTHERS,
  usage: "tpm <joueur>",
  args: [{ name: "player", type: "player", required: true }],
  handler: (a, ctx) => {
    game(ctx).teleportPlayerTo?.(a.player.id, ctx.senderId);
    return ok(`🧲 ${playerLabel(a.player)} téléporté vers vous.`, {
      target: a.player.name,
    });
  },
};

const tpc: CommandDefinition = {
  name: "tpc",
  description: "Téléporte aux coordonnées indiquées.",
  category: "Téléportation",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.TELEPORT_COORDS,
  usage: "tpc <x> <y> <z>",
  args: [
    { name: "x", type: "number", required: true },
    { name: "y", type: "number", required: true },
    { name: "z", type: "number", required: true },
  ],
  handler: (a, ctx) => {
    game(ctx).teleportToCoords?.(ctx.senderId, a.x, a.y, a.z);
    return ok(`📍 Téléporté vers (${a.x}, ${a.y}, ${a.z}).`, {
      data: { x: a.x, y: a.y, z: a.z },
    });
  },
};

const back: CommandDefinition = {
  name: "back",
  description: "Retourne à la position précédente.",
  category: "Téléportation",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.TELEPORT_SELF,
  handler: (_a, ctx) => {
    const ok2 = game(ctx).teleportBack?.(ctx.senderId);
    return ok2 === false
      ? fail("Aucune position précédente enregistrée.")
      : ok("↩️  Retour à la position précédente.");
  },
};

// =========================================================================== //
//  JOUEUR
// =========================================================================== //

const freeze: CommandDefinition = {
  name: "freeze",
  description: "Gèle un joueur (l'empêche de bouger).",
  category: "Joueur",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.FREEZE_PLAYERS,
  usage: "freeze <joueur>",
  args: [{ name: "player", type: "player", required: true }],
  handler: (a, ctx) => {
    game(ctx).setFrozen?.(a.player.id, true);
    return ok(`🧊 ${playerLabel(a.player)} est gelé.`, { target: a.player.name });
  },
};

const unfreeze: CommandDefinition = {
  name: "unfreeze",
  description: "Dégèle un joueur.",
  category: "Joueur",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.FREEZE_PLAYERS,
  usage: "unfreeze <joueur>",
  args: [{ name: "player", type: "player", required: true }],
  handler: (a, ctx) => {
    game(ctx).setFrozen?.(a.player.id, false);
    return ok(`🔥 ${playerLabel(a.player)} est dégelé.`, { target: a.player.name });
  },
};

const godmode: CommandDefinition = {
  name: "godmode",
  description: "Active/désactive l'invincibilité (soi ou un joueur).",
  category: "Joueur",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.GODMODE,
  aliases: ["god"],
  usage: "godmode [on|off] [joueur]",
  args: [
    { name: "state", type: "boolean", default: true },
    { name: "player", type: "player", required: false },
  ],
  handler: (a, ctx) => {
    const targetId = a.player ? a.player.id : ctx.senderId;
    const targetName = a.player ? playerLabel(a.player) : ctx.senderName;
    game(ctx).setGodmode?.(targetId, a.state);
    return ok(`🛡️  Godmode ${a.state ? "ACTIVÉ" : "désactivé"} pour ${targetName}.`, {
      target: a.player?.name,
    });
  },
};

const invisible: CommandDefinition = {
  name: "invisible",
  description: "Active/désactive l'invisibilité.",
  category: "Joueur",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.INVISIBLE,
  aliases: ["invis", "vanish"],
  usage: "invisible [on|off]",
  args: [{ name: "state", type: "boolean", default: true }],
  handler: (a, ctx) => {
    game(ctx).setInvisible?.(ctx.senderId, a.state);
    return ok(`👻 Invisibilité ${a.state ? "ACTIVÉE" : "désactivée"}.`);
  },
};

const heal: CommandDefinition = {
  name: "heal",
  description: "Soigne complètement un joueur (ou soi).",
  category: "Joueur",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.HEAL_PLAYERS,
  usage: "heal [joueur]",
  args: [{ name: "player", type: "player", required: false }],
  handler: (a, ctx) => {
    const targetId = a.player ? a.player.id : ctx.senderId;
    const targetName = a.player ? playerLabel(a.player) : ctx.senderName;
    game(ctx).healPlayer?.(targetId);
    return ok(`❤️  ${targetName} a été soigné.`, { target: a.player?.name });
  },
};

const armor: CommandDefinition = {
  name: "armor",
  description: "Donne une armure (0-100) à un joueur (ou soi).",
  category: "Joueur",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.GIVE_ARMOR,
  usage: "armor [montant] [joueur]",
  args: [
    { name: "amount", type: "number", default: 100 },
    { name: "player", type: "player", required: false },
  ],
  handler: (a, ctx) => {
    const amount = Math.max(0, Math.min(100, a.amount));
    const targetId = a.player ? a.player.id : ctx.senderId;
    const targetName = a.player ? playerLabel(a.player) : ctx.senderName;
    game(ctx).setArmor?.(targetId, amount);
    return ok(`🦺 Armure de ${amount} donnée à ${targetName}.`, {
      target: a.player?.name,
    });
  },
};

// =========================================================================== //
//  SERVEUR
// =========================================================================== //

const time: CommandDefinition = {
  name: "time",
  description: "Définit l'heure du jeu (0-23).",
  category: "Serveur",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.SET_TIME,
  usage: "time <heure>",
  args: [{ name: "hour", type: "number", required: true }],
  handler: (a, ctx) => {
    const hour = ((a.hour % 24) + 24) % 24;
    game(ctx).setTime?.(hour);
    return ok(`🕐 Heure réglée à ${hour}h00.`, { data: { hour } });
  },
};

const weather: CommandDefinition = {
  name: "weather",
  description: "Change la météo (clear, rain, storm, snow, fog).",
  category: "Serveur",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.SET_WEATHER,
  usage: "weather <type>",
  args: [{ name: "type", type: "string", required: true }],
  handler: (a, ctx) => {
    const valid = ["clear", "rain", "storm", "snow", "fog"];
    const t = String(a.type).toLowerCase();
    if (!valid.includes(t)) {
      return fail(`Météo invalide. Choix : ${valid.join(", ")}.`);
    }
    game(ctx).setWeather?.(t);
    return ok(`🌦️  Météo : ${t}.`, { data: { weather: t } });
  },
};

const announce: CommandDefinition = {
  name: "announce",
  description: "Diffuse une annonce à tous les joueurs.",
  category: "Serveur",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.ANNOUNCE,
  aliases: ["broadcast", "say"],
  usage: "announce <message>",
  args: [{ name: "message", type: "string", rest: true, required: true }],
  handler: (a, ctx) => {
    game(ctx).broadcast?.(a.message, ctx.senderName);
    return ok(`📢 Annonce diffusée : "${a.message}"`, { data: { message: a.message } });
  },
};

const status: CommandDefinition = {
  name: "status",
  description: "Affiche le statut du serveur.",
  category: "Serveur",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.VIEW_STATUS,
  handler: (_a, ctx) => {
    const s = game(ctx).getServerStatus?.() ?? {
      players: 0,
      maxPlayers: 0,
      uptime: 0,
      tps: 20,
    };
    return ok(
      `🖥️  Statut — Joueurs : ${s.players}/${s.maxPlayers} | Uptime : ${Math.floor(
        (s.uptime ?? 0) / 60
      )} min | TPS : ${s.tps}`,
      { data: s }
    );
  },
};

const players: CommandDefinition = {
  name: "players",
  description: "Liste les joueurs connectés.",
  category: "Serveur",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.LIST_PLAYERS,
  aliases: ["list", "online"],
  handler: (_a, ctx) => {
    const list: Player[] = game(ctx).getOnlinePlayers?.() ?? [];
    if (list.length === 0) return ok("👥 Aucun joueur connecté.");
    const names = list.map((p) => p.name).join(", ");
    return ok(`👥 ${list.length} joueur(s) : ${names}`, { data: { players: list } });
  },
};

// =========================================================================== //
//  ÉCONOMIE
// =========================================================================== //

const give: CommandDefinition = {
  name: "give",
  description: "Donne de l'argent à un joueur.",
  category: "Économie",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.GIVE_MONEY,
  usage: "give <joueur> <montant>",
  args: [
    { name: "player", type: "player", required: true },
    { name: "amount", type: "number", required: true },
  ],
  handler: (a, ctx) => {
    if (a.amount <= 0) return fail("Le montant doit être positif.");
    game(ctx).giveMoney?.(a.player.id, a.amount);
    return ok(`💰 ${a.amount}$ donné à ${playerLabel(a.player)}.`, {
      target: a.player.name,
      data: { targetId: a.player.id, amount: a.amount },
    });
  },
};

const setmoney: CommandDefinition = {
  name: "setmoney",
  description: "Définit le solde d'un joueur.",
  category: "Économie",
  level: PermissionLevel.ADMIN,
  flag: AdminFlag.SET_MONEY,
  usage: "setmoney <joueur> <montant>",
  args: [
    { name: "player", type: "player", required: true },
    { name: "amount", type: "number", required: true },
  ],
  handler: (a, ctx) => {
    game(ctx).setMoney?.(a.player.id, a.amount);
    return ok(`💳 Solde de ${playerLabel(a.player)} fixé à ${a.amount}$.`, {
      target: a.player.name,
      data: { targetId: a.player.id, amount: a.amount },
    });
  },
};

const money: CommandDefinition = {
  name: "money",
  description: "Consulte le solde d'un joueur (ou soi).",
  category: "Économie",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.VIEW_MONEY,
  aliases: ["balance", "bal"],
  usage: "money [joueur]",
  args: [{ name: "player", type: "player", required: false }],
  handler: (a, ctx) => {
    const targetId = a.player ? a.player.id : ctx.senderId;
    const targetName = a.player ? playerLabel(a.player) : ctx.senderName;
    const bal = game(ctx).getMoney?.(targetId) ?? 0;
    return ok(`💵 Solde de ${targetName} : ${bal}$.`, { target: a.player?.name });
  },
};

// =========================================================================== //
//  AIDE
// =========================================================================== //

const help: CommandDefinition = {
  name: "help",
  description: "Affiche les commandes disponibles (ou l'aide d'une commande).",
  category: "Aide",
  level: PermissionLevel.USER,
  aliases: ["?", "h"],
  usage: "help [commande]",
  args: [{ name: "command", type: "string", required: false }],
  handler: (a, ctx) => {
    const registry: CommandDefinition[] = game(ctx).__commandRegistry ?? [];

    if (a.command) {
      const cmd = registry.find(
        (c) =>
          c.name === String(a.command).toLowerCase() ||
          c.aliases?.includes(String(a.command).toLowerCase())
      );
      if (!cmd) return fail(`Commande "${a.command}" introuvable.`);
      const lines = [
        `📖 ${cmd.name} — ${cmd.description}`,
        `   Catégorie : ${cmd.category}`,
        cmd.usage ? `   Usage     : ${cmd.usage}` : "",
        cmd.aliases?.length ? `   Alias     : ${cmd.aliases.join(", ")}` : "",
      ].filter(Boolean);
      return ok(lines.join("\n"));
    }

    // Liste groupée par catégorie.
    const byCat = new Map<string, string[]>();
    for (const c of registry) {
      if (!byCat.has(c.category)) byCat.set(c.category, []);
      byCat.get(c.category)!.push(c.name);
    }
    const lines = ["📚 Commandes disponibles :"];
    for (const [cat, names] of byCat) {
      lines.push(`  ${cat} : ${names.join(", ")}`);
    }
    lines.push('Tapez "help <commande>" pour le détail.');
    return ok(lines.join("\n"));
  },
};

const admin: CommandDefinition = {
  name: "admin",
  description: "Affiche les commandes admin et le niveau requis.",
  category: "Aide",
  level: PermissionLevel.MODERATOR,
  flag: AdminFlag.USE_CONSOLE,
  handler: (_a, ctx) => {
    const registry: CommandDefinition[] = game(ctx).__commandRegistry ?? [];
    const levelNames = ["USER", "MOD", "ADMIN", "OWNER"];
    const lines = ["🔑 Commandes admin :"];
    for (const c of registry.filter((c) => c.level > PermissionLevel.USER)) {
      lines.push(`  [${levelNames[c.level]}] ${c.name} — ${c.description}`);
    }
    return ok(lines.join("\n"));
  },
};

const perms: CommandDefinition = {
  name: "perms",
  description: "Affiche vos permissions effectives.",
  category: "Aide",
  level: PermissionLevel.USER,
  handler: (_a, ctx) => {
    const resolver = game(ctx).getUserPermissions;
    if (!resolver) return ok("Permissions indisponibles.");
    const p = resolver(ctx.senderId);
    return ok(
      `🪪 ${p.name} — Niveau : ${p.levelName}\n   Drapeaux : ${
        p.flags.length ? p.flags.join(", ") : "(aucun)"
      }`
    );
  },
};

// =========================================================================== //
//  OWNER
// =========================================================================== //

const restart: CommandDefinition = {
  name: "restart",
  description: "Redémarre le serveur (OWNER uniquement).",
  category: "Serveur",
  level: PermissionLevel.OWNER,
  flag: AdminFlag.RESTART_SERVER,
  usage: "restart [secondes]",
  args: [{ name: "delay", type: "number", default: 10 }],
  handler: (a, ctx) => {
    game(ctx).restartServer?.(a.delay);
    return ok(`♻️  Redémarrage du serveur dans ${a.delay}s...`, {
      data: { delay: a.delay },
    });
  },
};

// =========================================================================== //
//  EXPORT
// =========================================================================== //

export const AllCommands: CommandDefinition[] = [
  // Modération
  kick,
  ban,
  unban,
  mute,
  unmute,
  warn,
  // Téléport
  tp,
  tpm,
  tpc,
  back,
  // Joueur
  freeze,
  unfreeze,
  godmode,
  invisible,
  heal,
  armor,
  // Serveur
  time,
  weather,
  announce,
  status,
  players,
  restart,
  // Économie
  give,
  setmoney,
  money,
  // Aide
  help,
  admin,
  perms,
];

export {
  kick, ban, unban, mute, unmute, warn,
  tp, tpm, tpc, back,
  freeze, unfreeze, godmode, invisible, heal, armor,
  time, weather, announce, status, players, restart,
  give, setmoney, money,
  help, admin, perms,
};

export default AllCommands;
