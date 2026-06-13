/**
 * CommandParser.ts - Parseur de commandes admin
 * @module AdminConsole
 * @version 2.0.0
 * @description Système de parsing de commandes inspiré de FiveM/ESX
 *              avec support complet des types, permissions, historique et autocomplétion
 */

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

/** Types d'arguments supportés par le parseur */
export type ArgumentType = 'string' | 'number' | 'boolean' | 'player';

/** Codes d'erreur standardisés */
export type CommandErrorCode =
  | 'COMMAND_NOT_FOUND'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'INVALID_ARGUMENTS'
  | 'MISSING_ARGUMENTS'
  | 'EXECUTION_ERROR'
  | 'INVALID_INPUT';

/** Résultat d'une exécution de commande */
export interface CommandResult {
  success: boolean;
  message: string;
  code?: CommandErrorCode;
  data?: unknown;
}

/** Définition d'un argument de commande */
export interface CommandArgument {
  name: string;
  type: ArgumentType;
  required: boolean;
  description?: string;
  defaultValue?: string | number | boolean;
  validate?: (value: unknown) => boolean;
}

/** Définition complète d'une commande */
export interface CommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  category?: string;
  args?: CommandArgument[];
  /** Niveau minimum requis: 0=user 1=mod 2=admin 3=owner */
  minPermissionLevel?: number;
  execute: (args: unknown[], context: CommandContext) => Promise<string | void>;
}

/** Contexte d'exécution d'une commande */
export interface CommandContext {
  player: {
    id: string;
    name: string;
    permissionLevel: number;
  };
  timestamp: number;
  source: 'console' | 'in-game' | 'api';
}

/** Commande parsée prête à l'exécution */
export interface ParsedCommand {
  name: string;
  args: string[];
  raw: string;
}

/** Suggestion d'autocomplétion */
export interface AutocompleteSuggestion {
  command: CommandDefinition;
  match: string;
  score: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

const DEFAULT_MAX_HISTORY = 100;
const COMMAND_TIMEOUT_MS   = 10_000;

// ═══════════════════════════════════════════════════════════════
// CLASSE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

/**
 * Parseur et exécuteur de commandes admin
 *
 * @example
 * ```typescript
 * const parser = new CommandParser();
 *
 * parser.registerCommand({
 *   name: 'kick',
 *   description: 'Expulser un joueur',
 *   minPermissionLevel: 1,
 *   args: [{ name: 'player', type: 'player', required: true }],
 *   execute: async ([playerId], ctx) => {
 *     // logique kick...
 *     return `Joueur ${playerId} expulsé`;
 *   },
 * });
 *
 * const result = await parser.executeCommand('kick 123', context);
 * ```
 */
export class CommandParser {
  // ── État interne ─────────────────────────────────────────────
  private readonly commands      = new Map<string, CommandDefinition>();
  private readonly history:        string[] = [];
  private          historyIndex  = -1;
  private readonly maxHistory:     number;

  constructor(options: { maxHistory?: number } = {}) {
    this.maxHistory = options.maxHistory ?? DEFAULT_MAX_HISTORY;
  }

  // ════════════════════════════════════════════════════════════
  // ENREGISTREMENT DES COMMANDES
  // ════════════════════════════════════════════════════════════

  /**
   * Enregistre une commande (et ses alias)
   * @throws {Error} Si une commande du même nom est déjà enregistrée
   */
  registerCommand(command: CommandDefinition): void {
    const key = command.name.toLowerCase();

    if (this.commands.has(key)) {
      console.warn(
        `[CommandParser] Écrasement de la commande existante: "${key}"`
      );
    }

    this.commands.set(key, command);

    command.aliases?.forEach((alias) => {
      const aliasKey = alias.toLowerCase();
      if (!this.commands.has(aliasKey)) {
        this.commands.set(aliasKey, command);
      }
    });
  }

  /**
   * Enregistre un tableau de commandes
   */
  registerCommands(commands: CommandDefinition[]): void {
    commands.forEach((cmd) => this.registerCommand(cmd));
  }

  /**
   * Désinscrire une commande et ses alias
   */
  unregisterCommand(name: string): boolean {
    const key = name.toLowerCase();
    const command = this.commands.get(key);
    if (!command) return false;

    // Supprimer le nom principal
    this.commands.delete(key);

    // Supprimer les alias qui pointent vers cette commande
    command.aliases?.forEach((alias) => {
      if (this.commands.get(alias.toLowerCase()) === command) {
        this.commands.delete(alias.toLowerCase());
      }
    });

    return true;
  }

  // ════════════════════════════════════════════════════════════
  // PARSING
  // ════════════════════════════════════════════════════════════

  /**
   * Parse une ligne de commande en tokens
   * Supporte les guillemets simples/doubles et l'échappement
   *
   * @example
   * parseCommand('kick "Jean Dupont" raison')
   * // → { name: 'kick', args: ['Jean Dupont', 'raison'], raw: '...' }
   */
  parseCommand(input: string): ParsedCommand | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Supprimer le "/" préfixe optionnel
    const normalized = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

    const tokens = this.tokenize(normalized);
    if (tokens.length === 0) return null;

    return {
      name: tokens[0].toLowerCase(),
      args: tokens.slice(1),
      raw:  trimmed,
    };
  }

  /**
   * Tokenise une ligne de commande
   * - Supporte guillemets simples `'` et doubles `"`
   * - Supporte l'échappement avec `\"`
   * - Gère les espaces multiples
   */
  private tokenize(input: string): string[] {
    const tokens:    string[] = [];
    let   current  = '';
    let   inQuotes = false;
    let   quoteChar  = '';

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const prev = i > 0 ? input[i - 1] : '';

      // Caractère d'échappement
      if (char === '\\' && i + 1 < input.length) {
        const next = input[i + 1];
        if (next === '"' || next === "'") {
          current += next;
          i++; // Sauter le prochain caractère
          continue;
        }
      }

      // Ouverture/fermeture de guillemets
      if ((char === '"' || char === "'") && prev !== '\\') {
        if (!inQuotes) {
          inQuotes  = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes  = false;
          quoteChar = '';
        } else {
          // Guillemet différent à l'intérieur → littéral
          current += char;
        }
        continue;
      }

      // Séparateur espace
      if (char === ' ' && !inQuotes) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current.length > 0) tokens.push(current);

    return tokens;
  }

  // ════════════════════════════════════════════════════════════
  // CONVERSION DES ARGUMENTS
  // ════════════════════════════════════════════════════════════

  /**
   * Convertit les arguments bruts (string[]) selon les types définis
   * Retourne null si la validation échoue
   */
  private convertArgs(
    rawArgs: string[],
    definition: CommandDefinition
  ): { converted: unknown[]; error?: string } {
    if (!definition.args || definition.args.length === 0) {
      return { converted: rawArgs };
    }

    const converted: unknown[] = [];

    for (let i = 0; i < definition.args.length; i++) {
      const argDef   = definition.args[i];
      const rawValue = rawArgs[i] ?? '';

      // Argument requis manquant
      if (!rawValue && argDef.required) {
        return {
          converted: [],
          error: `Argument manquant: <${argDef.name}>`,
        };
      }

      // Argument optionnel absent → valeur par défaut
      if (!rawValue) {
        converted.push(argDef.defaultValue ?? null);
        continue;
      }

      // Conversion selon le type
      const result = this.convertSingleArg(rawValue, argDef);
      if (result.error) {
        return {
          converted: [],
          error: `Argument invalide "${argDef.name}": ${result.error}`,
        };
      }

      // Validation personnalisée
      if (argDef.validate && !argDef.validate(result.value)) {
        return {
          converted: [],
          error: `Validation échouée pour l'argument "${argDef.name}"`,
        };
      }

      converted.push(result.value);
    }

    return { converted };
  }

  /** Convertit un seul argument vers son type cible */
  private convertSingleArg(
    raw: string,
    argDef: CommandArgument
  ): { value?: unknown; error?: string } {
    try {
      switch (argDef.type) {
        case 'number': {
          const num = Number(raw);
          if (isNaN(num)) return { error: `"${raw}" n'est pas un nombre valide` };
          return { value: num };
        }

        case 'boolean': {
          const lower = raw.toLowerCase();
          if (['true', '1', 'yes', 'oui', 'on'].includes(lower))  return { value: true };
          if (['false', '0', 'no', 'non', 'off'].includes(lower)) return { value: false };
          return { error: `"${raw}" n'est pas un booléen valide (true/false)` };
        }

        case 'player':
          // L'ID joueur est validé à l'exécution par la commande elle-même
          return { value: raw };

        case 'string':
        default:
          return { value: raw };
      }
    } catch (err) {
      return { error: `Erreur de conversion: ${String(err)}` };
    }
  }

  // ════════════════════════════════════════════════════════════
  // EXÉCUTION
  // ════════════════════════════════════════════════════════════

  /**
   * Exécute une commande complète depuis une saisie brute
   *
   * @param input   - Ligne de commande (ex: "kick 123 triche")
   * @param context - Contexte du joueur exécutant
   * @returns Résultat structuré avec succès/erreur/message
   */
  async executeCommand(
    input:   string,
    context: CommandContext
  ): Promise<CommandResult> {
    // ── 1. Parse ─────────────────────────────────────────────
    const parsed = this.parseCommand(input);
    if (!parsed) {
      return {
        success: false,
        message: 'Entrée invalide ou vide.',
        code:    'INVALID_INPUT',
      };
    }

    // Ajouter à l'historique avant toute vérification
    this.addToHistory(parsed.raw);

    // ── 2. Recherche de la commande ──────────────────────────
    const command = this.commands.get(parsed.name);
    if (!command) {
      // Proposer des suggestions proches
      const suggestions = this.getSuggestions(parsed.name, 3);
      const hint = suggestions.length > 0
        ? ` Vouliez-vous dire: ${suggestions.map((s) => `"${s.command.name}"`).join(', ')} ?`
        : ' Tapez "help" pour voir les commandes disponibles.';

      return {
        success: false,
        message: `CommandNotFound: La commande "${parsed.name}" est introuvable.${hint}`,
        code:    'COMMAND_NOT_FOUND',
      };
    }

    // ── 3. Vérification des permissions ──────────────────────
    const requiredLevel = command.minPermissionLevel ?? 0;
    if (context.player.permissionLevel < requiredLevel) {
      return {
        success: false,
        message: `InsufficientPermissions: Vous n'avez pas les droits pour exécuter "/${command.name}". `
                + `Niveau requis: ${requiredLevel}, votre niveau: ${context.player.permissionLevel}.`,
        code:    'INSUFFICIENT_PERMISSIONS',
      };
    }

    // ── 4. Conversion & validation des arguments ─────────────
    const { converted, error: argError } = this.convertArgs(parsed.args, command);
    if (argError) {
      const usage = this.buildUsage(command);
      return {
        success: false,
        message: `${argError}\nUsage: ${usage}`,
        code:    'INVALID_ARGUMENTS',
      };
    }

    // ── 5. Exécution avec timeout ─────────────────────────────
    try {
      const executePromise = command.execute(converted, context);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: commande trop longue')), COMMAND_TIMEOUT_MS)
      );

      const result = await Promise.race([executePromise, timeoutPromise]);

      return {
        success: true,
        message: (typeof result === 'string' && result)
          ? result
          : `Commande "/${command.name}" exécutée avec succès.`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[CommandParser] Erreur exécution "/${command.name}":`, err);

      return {
        success: false,
        message: `ExecutionError: ${message}`,
        code:    'EXECUTION_ERROR',
      };
    }
  }

  // ════════════════════════════════════════════════════════════
  // UTILITAIRES DE COMMANDES
  // ════════════════════════════════════════════════════════════

  /**
   * Retourne les commandes accessibles selon le niveau
   */
  getAvailableCommands(permissionLevel: number): CommandDefinition[] {
    const seen    = new Set<string>();
    const result: CommandDefinition[] = [];

    this.commands.forEach((cmd) => {
      if (seen.has(cmd.name)) return;
      if ((cmd.minPermissionLevel ?? 0) <= permissionLevel) {
        result.push(cmd);
        seen.add(cmd.name);
      }
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Retourne une commande par son nom (ou alias)
   */
  getCommand(name: string): CommandDefinition | null {
    return this.commands.get(name.toLowerCase()) ?? null;
  }

  /**
   * Suggestions d'autocomplétion classées par pertinence
   */
  autocomplete(
    input:           string,
    permissionLevel: number,
    limit = 5
  ): AutocompleteSuggestion[] {
    if (!input.trim()) return [];

    const prefix = input.toLowerCase().replace(/^\//, '');
    return this.getSuggestions(prefix, limit, permissionLevel);
  }

  /** Recherche des commandes similaires (distance de Levenshtein simplifiée) */
  private getSuggestions(
    prefix:          string,
    limit:           number,
    permissionLevel = Infinity
  ): AutocompleteSuggestion[] {
    const suggestions: AutocompleteSuggestion[] = [];
    const seen = new Set<string>();

    this.commands.forEach((cmd) => {
      if (seen.has(cmd.name)) return;
      if ((cmd.minPermissionLevel ?? 0) > permissionLevel) return;

      seen.add(cmd.name);

      if (cmd.name.startsWith(prefix)) {
        suggestions.push({ command: cmd, match: cmd.name, score: 100 });
        return;
      }

      // Score par similarité
      if (cmd.name.includes(prefix)) {
        suggestions.push({ command: cmd, match: cmd.name, score: 50 });
      }
    });

    return suggestions
      .sort((a, b) => b.score - a.score || a.match.localeCompare(b.match))
      .slice(0, limit);
  }

  /** Génère la chaîne Usage d'une commande */
  buildUsage(command: CommandDefinition): string {
    const argsStr = command.args
      ?.map((a) => a.required ? `<${a.name}>` : `[${a.name}]`)
      .join(' ') ?? '';

    return `/${command.name}${argsStr ? ' ' + argsStr : ''}`;
  }

  // ════════════════════════════════════════════════════════════
  // HISTORIQUE
  // ════════════════════════════════════════════════════════════

  /** Ajoute une entrée à l'historique (dédupliquée consécutivement) */
  private addToHistory(raw: string): void {
    const last = this.history[this.history.length - 1];
    if (last === raw) return; // Pas de doublons consécutifs

    this.history.push(raw);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = -1;
  }

  /**
   * Navigue vers la commande précédente dans l'historique (flèche ↑)
   * @returns La commande précédente, ou `null` si déjà au début
   */
  getHistoryPrevious(): string | null {
    if (this.history.length === 0) return null;

    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
    }

    return this.history[this.history.length - 1 - this.historyIndex] ?? null;
  }

  /**
   * Navigue vers la commande suivante dans l'historique (flèche ↓)
   * @returns La commande suivante, ou `''` si de retour à la saisie vide
   */
  getHistoryNext(): string {
    if (this.historyIndex <= 0) {
      this.historyIndex = -1;
      return '';
    }

    this.historyIndex--;
    return this.history[this.history.length - 1 - this.historyIndex] ?? '';
  }

  /** Réinitialise le curseur d'historique (ex: après validation) */
  resetHistoryIndex(): void {
    this.historyIndex = -1;
  }

  /** Retourne une copie de l'historique complet */
  getHistory(): readonly string[] {
    return Object.freeze([...this.history]);
  }

  /** Vide l'historique */
  clearHistory(): void {
    this.history.length = 0;
    this.historyIndex   = -1;
  }

  // ════════════════════════════════════════════════════════════
  // INFORMATIONS
  // ════════════════════════════════════════════════════════════

  /** Nombre de commandes enregistrées (alias compris) */
  get size(): number { return this.commands.size; }

  /** Retourne des infos de diagnostic */
  getInfo(): Record<string, unknown> {
    const unique = new Set<string>();
    this.commands.forEach((cmd) => unique.add(cmd.name));

    return {
      uniqueCommands: unique.size,
      totalKeys:      this.commands.size,
      historyLength:  this.history.length,
      maxHistory:     this.maxHistory,
    };
  }
}

export default CommandParser;