/**
 * CommandParser.ts
 * ----------------------------------------------------------------------------
 * Analyseur de commandes pour la console admin.
 *
 *  - Tokenizer avec support des guillemets ("..." et '...')
 *  - Support de l'échappement (\" \' \\ \n \t)
 *  - Historique des commandes (getHistory / Next / Previous)
 *  - parseCommand() -> ParsedCommand
 *  - executeCommand() -> valide les permissions puis exécute
 *  - getAvailableCommands() par niveau
 *  - registerCommand() / registerCommands()
 *  - Gestion d'arguments typés (string, number, boolean, player)
 *  - Conversions de types automatiques
 *  - Erreurs appropriées (CommandNotFound, InsufficientPermissions, ...)
 * ----------------------------------------------------------------------------
 */

import {
  AdminFlag,
  PermissionLevel,
  PermissionSystem,
} from "../permissions/PermissionSystem";

// --------------------------------------------------------------------------- //
//  Types d'arguments
// --------------------------------------------------------------------------- //

export type ArgType = "string" | "number" | "boolean" | "player";

export interface ArgDefinition {
  name: string;
  type: ArgType;
  required?: boolean;
  /** Valeur par défaut si l'argument est absent et non requis. */
  default?: string | number | boolean;
  description?: string;
  /** Capture tout le reste de la ligne (utile pour les messages). */
  rest?: boolean;
}

/** Représente un joueur dans le contexte de jeu. */
export interface Player {
  id: string;
  name: string;
  online?: boolean;
}

/** Contexte fourni à chaque exécution de commande. */
export interface CommandContext {
  /** id de l'admin exécutant. */
  senderId: string;
  /** nom affiché de l'admin. */
  senderName: string;
  /** Résolveur de joueur (par nom ou id) fourni par le jeu. */
  resolvePlayer?: (query: string) => Player | undefined;
  /** Adaptateur de jeu arbitraire (monde, serveur, économie...). */
  game?: Record<string, any>;
}

/** Valeur retournée par un handler de commande. */
export interface CommandResult {
  success: boolean;
  message: string;
  /** Données structurées optionnelles (pour l'audit / l'UI). */
  data?: Record<string, any>;
  /** Cible affectée (pour le logging). */
  target?: string;
}

export type CommandHandler = (
  args: Record<string, any>,
  ctx: CommandContext
) => CommandResult | Promise<CommandResult>;

/** Définition complète d'une commande. */
export interface CommandDefinition {
  name: string;
  description: string;
  /** Catégorie pour l'aide (moderation, teleport, ...). */
  category: string;
  /** Niveau minimal requis. */
  level: PermissionLevel;
  /** Drapeau requis (en plus du niveau). */
  flag?: AdminFlag;
  /** Alias alternatifs. */
  aliases?: string[];
  args?: ArgDefinition[];
  handler: CommandHandler;
  usage?: string;
}

/** Résultat de l'analyse syntaxique d'une ligne. */
export interface ParsedCommand {
  raw: string;
  name: string;
  rawArgs: string[];
}

// --------------------------------------------------------------------------- //
//  Erreurs
// --------------------------------------------------------------------------- //

export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandError";
  }
}

export class CommandNotFoundError extends CommandError {
  constructor(public commandName: string) {
    super(`Commande inconnue : "${commandName}". Tapez "help".`);
    this.name = "CommandNotFoundError";
  }
}

export class InsufficientPermissionsError extends CommandError {
  constructor(public commandName: string) {
    super(`Permissions insuffisantes pour "${commandName}".`);
    this.name = "InsufficientPermissionsError";
  }
}

export class InvalidArgumentError extends CommandError {
  constructor(public argName: string, reason: string) {
    super(`Argument invalide "${argName}" : ${reason}`);
    this.name = "InvalidArgumentError";
  }
}

export class MissingArgumentError extends CommandError {
  constructor(public argName: string) {
    super(`Argument manquant : "${argName}".`);
    this.name = "MissingArgumentError";
  }
}

// --------------------------------------------------------------------------- //
//  Tokenizer (avec guillemets + échappement)
// --------------------------------------------------------------------------- //

/**
 * Découpe une ligne en tokens. Gère :
 *   - les espaces multiples
 *   - les guillemets doubles et simples
 *   - les séquences d'échappement \" \' \\ \n \t \space
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote: '"' | "'" | null = null;
  let hasContent = false; // distingue "" d'un vide réel

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === "\\") {
      const next = input[i + 1];
      switch (next) {
        case '"':
          current += '"';
          break;
        case "'":
          current += "'";
          break;
        case "\\":
          current += "\\";
          break;
        case "n":
          current += "\n";
          break;
        case "t":
          current += "\t";
          break;
        case " ":
          current += " ";
          break;
        default:
          current += next ?? "\\";
      }
      hasContent = true;
      i++; // consomme le caractère échappé
      continue;
    }

    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null;
      } else {
        current += ch;
      }
      hasContent = true;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inQuote = ch;
      hasContent = true;
      continue;
    }

    if (ch === " " || ch === "\t") {
      if (hasContent) {
        tokens.push(current);
        current = "";
        hasContent = false;
      }
      continue;
    }

    current += ch;
    hasContent = true;
  }

  if (inQuote) {
    throw new CommandError("Guillemet non fermé dans la commande.");
  }
  if (hasContent) tokens.push(current);

  return tokens;
}

// --------------------------------------------------------------------------- //
//  CommandParser
// --------------------------------------------------------------------------- //

export class CommandParser {
  private commands = new Map<string, CommandDefinition>();
  private aliases = new Map<string, string>();

  private history: string[] = [];
  private historyIndex = -1; // -1 = pas en navigation
  private readonly historyLimit: number;

  constructor(
    private permissions: PermissionSystem,
    options?: { historyLimit?: number }
  ) {
    this.historyLimit = options?.historyLimit ?? 100;
  }

  // --------------------------------------------------------------------- //
  //  Enregistrement
  // --------------------------------------------------------------------- //

  registerCommand(def: CommandDefinition): void {
    const key = def.name.toLowerCase();
    this.commands.set(key, def);
    for (const alias of def.aliases ?? []) {
      this.aliases.set(alias.toLowerCase(), key);
    }
  }

  registerCommands(defs: CommandDefinition[]): void {
    for (const d of defs) this.registerCommand(d);
  }

  getCommand(name: string): CommandDefinition | undefined {
    const key = name.toLowerCase();
    return this.commands.get(key) ?? this.commands.get(this.aliases.get(key) ?? "");
  }

  /** Toutes les commandes accessibles à un utilisateur donné. */
  getAvailableCommands(userId: string): CommandDefinition[] {
    return Array.from(this.commands.values()).filter((cmd) =>
      this.userCanRun(userId, cmd)
    );
  }

  /** Toutes les commandes (sans filtre). */
  getAllCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  private userCanRun(userId: string, cmd: CommandDefinition): boolean {
    if (!this.permissions.hasPermissionLevel(userId, cmd.level)) return false;
    if (cmd.flag && !this.permissions.hasPermission(userId, cmd.flag)) return false;
    return true;
  }

  // --------------------------------------------------------------------- //
  //  Parsing
  // --------------------------------------------------------------------- //

  /** Analyse une ligne brute (avec ou sans "/" en préfixe). */
  parseCommand(raw: string): ParsedCommand {
    const trimmed = raw.trim().replace(/^\//, "");
    const tokens = tokenize(trimmed);
    if (tokens.length === 0) {
      throw new CommandError("Commande vide.");
    }
    const [name, ...rawArgs] = tokens;
    return { raw, name: name.toLowerCase(), rawArgs };
  }

  /** Convertit les tokens en arguments typés selon la définition. */
  private buildArgs(
    def: CommandDefinition,
    rawArgs: string[],
    ctx: CommandContext
  ): Record<string, any> {
    const result: Record<string, any> = {};
    const argDefs = def.args ?? [];

    for (let i = 0; i < argDefs.length; i++) {
      const argDef = argDefs[i];

      // Argument "rest" : capture tout le reste.
      if (argDef.rest) {
        const rest = rawArgs.slice(i).join(" ");
        if (!rest && argDef.required) throw new MissingArgumentError(argDef.name);
        result[argDef.name] = rest || (argDef.default ?? "");
        break;
      }

      const token = rawArgs[i];

      if (token === undefined) {
        if (argDef.required) throw new MissingArgumentError(argDef.name);
        if (argDef.default !== undefined) result[argDef.name] = argDef.default;
        continue;
      }

      result[argDef.name] = this.convert(argDef, token, ctx);
    }

    return result;
  }

  /** Conversion automatique d'un token vers le type attendu. */
  private convert(argDef: ArgDefinition, token: string, ctx: CommandContext): any {
    switch (argDef.type) {
      case "string":
        return token;

      case "number": {
        const n = Number(token);
        if (Number.isNaN(n)) {
          throw new InvalidArgumentError(argDef.name, `"${token}" n'est pas un nombre.`);
        }
        return n;
      }

      case "boolean": {
        const t = token.toLowerCase();
        if (["true", "1", "yes", "on", "oui"].includes(t)) return true;
        if (["false", "0", "no", "off", "non"].includes(t)) return false;
        throw new InvalidArgumentError(argDef.name, `"${token}" n'est pas un booléen.`);
      }

      case "player": {
        const player = ctx.resolvePlayer?.(token);
        if (!player) {
          throw new InvalidArgumentError(
            argDef.name,
            `joueur introuvable : "${token}".`
          );
        }
        return player;
      }

      default:
        return token;
    }
  }

  // --------------------------------------------------------------------- //
  //  Exécution
  // --------------------------------------------------------------------- //

  /**
   * Analyse + valide les permissions + exécute la commande.
   * Lève une erreur typée en cas de problème.
   */
  async executeCommand(raw: string, ctx: CommandContext): Promise<CommandResult> {
    this.pushHistory(raw);

    const parsed = this.parseCommand(raw);
    const cmd = this.getCommand(parsed.name);
    if (!cmd) throw new CommandNotFoundError(parsed.name);

    // Validation des permissions (niveau + drapeau).
    if (!this.permissions.hasPermissionLevel(ctx.senderId, cmd.level)) {
      throw new InsufficientPermissionsError(cmd.name);
    }
    if (cmd.flag && !this.permissions.hasPermission(ctx.senderId, cmd.flag)) {
      throw new InsufficientPermissionsError(cmd.name);
    }

    const args = this.buildArgs(cmd, parsed.rawArgs, ctx);
    return await cmd.handler(args, ctx);
  }

  // --------------------------------------------------------------------- //
  //  Historique
  // --------------------------------------------------------------------- //

  private pushHistory(raw: string): void {
    const value = raw.trim();
    if (!value) return;
    // Évite les doublons consécutifs.
    if (this.history[this.history.length - 1] !== value) {
      this.history.push(value);
      if (this.history.length > this.historyLimit) this.history.shift();
    }
    this.historyIndex = this.history.length; // reset navigation
  }

  getHistory(): string[] {
    return [...this.history];
  }

  /** Navigue vers la commande précédente (flèche haut). */
  getHistoryPrevious(): string | null {
    if (this.history.length === 0) return null;
    if (this.historyIndex > 0) this.historyIndex--;
    else this.historyIndex = 0;
    return this.history[this.historyIndex] ?? null;
  }

  /** Navigue vers la commande suivante (flèche bas). */
  getHistoryNext(): string | null {
    if (this.history.length === 0) return null;
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex] ?? null;
    }
    // En bout de liste -> ligne vide (nouvelle saisie).
    this.historyIndex = this.history.length;
    return "";
  }

  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
  }
}

export default CommandParser;
