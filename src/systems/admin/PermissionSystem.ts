/**
 * PermissionSystem.ts
 * ----------------------------------------------------------------------------
 * Système de permissions hiérarchique pour la console admin.
 *
 *  - 4 niveaux : USER, MODERATOR, ADMIN, OWNER
 *  - 20+ AdminFlags granulaires
 *  - Gestion des admins (register / get / getAll)
 *  - hasPermission() (flags + niveaux), hasPermissionLevel()
 *  - promoteUser, addFlag, removeFlag
 *  - getUserPermissions(), matrice de permissions par niveau
 *  - getPermissionName() pour le debug
 * ----------------------------------------------------------------------------
 */

/** Niveaux hiérarchiques. Les valeurs numériques permettent les comparaisons >=. */
export enum PermissionLevel {
  USER = 0,
  MODERATOR = 1,
  ADMIN = 2,
  OWNER = 3,
}

/** Drapeaux de permission granulaires (20+). */
export enum AdminFlag {
  // --- Modération ---
  KICK_PLAYERS = "kick_players",
  BAN_PLAYERS = "ban_players",
  MUTE_PLAYERS = "mute_players",
  WARN_PLAYERS = "warn_players",
  UNBAN_PLAYERS = "unban_players",

  // --- Téléportation ---
  TELEPORT_SELF = "teleport_self",
  TELEPORT_OTHERS = "teleport_others",
  TELEPORT_COORDS = "teleport_coords",

  // --- Joueur ---
  FREEZE_PLAYERS = "freeze_players",
  GODMODE = "godmode",
  INVISIBLE = "invisible",
  HEAL_PLAYERS = "heal_players",
  GIVE_ARMOR = "give_armor",

  // --- Serveur ---
  SET_TIME = "set_time",
  SET_WEATHER = "set_weather",
  ANNOUNCE = "announce",
  VIEW_STATUS = "view_status",
  LIST_PLAYERS = "list_players",
  RESTART_SERVER = "restart_server",

  // --- Économie ---
  GIVE_MONEY = "give_money",
  SET_MONEY = "set_money",
  VIEW_MONEY = "view_money",

  // --- Système / Admin ---
  MANAGE_ADMINS = "manage_admins",
  VIEW_LOGS = "view_logs",
  EXPORT_LOGS = "export_logs",
  USE_CONSOLE = "use_console",
}

/** Représentation d'un administrateur enregistré. */
export interface Admin {
  id: string;
  name: string;
  level: PermissionLevel;
  /** Drapeaux additionnels accordés explicitement (au-delà du niveau). */
  flags: Set<AdminFlag>;
  /** Drapeaux explicitement révoqués même si le niveau les accorderait. */
  revokedFlags: Set<AdminFlag>;
  addedAt: number;
  addedBy?: string;
}

/** Permissions résolues pour un utilisateur. */
export interface ResolvedPermissions {
  id: string;
  name: string;
  level: PermissionLevel;
  levelName: string;
  flags: AdminFlag[];
}

/**
 * Matrice : quels drapeaux sont accordés par défaut à chaque niveau.
 * Un niveau hérite implicitement de tous les drapeaux des niveaux inférieurs.
 */
const LEVEL_FLAGS: Record<PermissionLevel, AdminFlag[]> = {
  [PermissionLevel.USER]: [
    // Un USER standard n'a aucun drapeau admin.
  ],
  [PermissionLevel.MODERATOR]: [
    AdminFlag.USE_CONSOLE,
    AdminFlag.KICK_PLAYERS,
    AdminFlag.MUTE_PLAYERS,
    AdminFlag.WARN_PLAYERS,
    AdminFlag.TELEPORT_SELF,
    AdminFlag.TELEPORT_OTHERS,
    AdminFlag.TELEPORT_COORDS,
    AdminFlag.FREEZE_PLAYERS,
    AdminFlag.VIEW_STATUS,
    AdminFlag.LIST_PLAYERS,
    AdminFlag.VIEW_MONEY,
    AdminFlag.ANNOUNCE,
    AdminFlag.VIEW_LOGS,
  ],
  [PermissionLevel.ADMIN]: [
    AdminFlag.BAN_PLAYERS,
    AdminFlag.UNBAN_PLAYERS,
    AdminFlag.GODMODE,
    AdminFlag.INVISIBLE,
    AdminFlag.HEAL_PLAYERS,
    AdminFlag.GIVE_ARMOR,
    AdminFlag.SET_TIME,
    AdminFlag.SET_WEATHER,
    AdminFlag.GIVE_MONEY,
    AdminFlag.SET_MONEY,
    AdminFlag.EXPORT_LOGS,
  ],
  [PermissionLevel.OWNER]: [
    AdminFlag.RESTART_SERVER,
    AdminFlag.MANAGE_ADMINS,
  ],
};

/** Noms lisibles des niveaux pour le debug / l'UI. */
const LEVEL_NAMES: Record<PermissionLevel, string> = {
  [PermissionLevel.USER]: "USER",
  [PermissionLevel.MODERATOR]: "MODERATOR",
  [PermissionLevel.ADMIN]: "ADMIN",
  [PermissionLevel.OWNER]: "OWNER",
};

export class PermissionSystem {
  private admins = new Map<string, Admin>();

  // ----------------------------------------------------------------------- //
  //  Gestion des admins
  // ----------------------------------------------------------------------- //

  /** Enregistre (ou met à jour) un administrateur. */
  registerAdmin(
    id: string,
    name: string,
    level: PermissionLevel,
    options?: { flags?: AdminFlag[]; addedBy?: string }
  ): Admin {
    const admin: Admin = {
      id,
      name,
      level,
      flags: new Set(options?.flags ?? []),
      revokedFlags: new Set(),
      addedAt: Date.now(),
      addedBy: options?.addedBy,
    };
    this.admins.set(id, admin);
    return admin;
  }

  /** Récupère un admin par id, ou undefined. */
  getAdmin(id: string): Admin | undefined {
    return this.admins.get(id);
  }

  /** Liste tous les admins enregistrés. */
  getAllAdmins(): Admin[] {
    return Array.from(this.admins.values());
  }

  /** Supprime un admin. */
  removeAdmin(id: string): boolean {
    return this.admins.delete(id);
  }

  // ----------------------------------------------------------------------- //
  //  Résolution des permissions
  // ----------------------------------------------------------------------- //

  /** Retourne l'ensemble effectif des drapeaux pour un niveau (avec héritage). */
  getFlagsForLevel(level: PermissionLevel): Set<AdminFlag> {
    const result = new Set<AdminFlag>();
    for (let l = PermissionLevel.USER; l <= level; l++) {
      for (const flag of LEVEL_FLAGS[l as PermissionLevel]) result.add(flag);
    }
    return result;
  }

  /** Résout toutes les permissions d'un utilisateur (drapeaux effectifs). */
  getUserPermissions(id: string): ResolvedPermissions {
    const admin = this.admins.get(id);
    if (!admin) {
      return {
        id,
        name: id,
        level: PermissionLevel.USER,
        levelName: LEVEL_NAMES[PermissionLevel.USER],
        flags: [],
      };
    }

    const effective = this.getFlagsForLevel(admin.level);
    for (const f of admin.flags) effective.add(f); // ajouts explicites
    for (const f of admin.revokedFlags) effective.delete(f); // révocations

    return {
      id: admin.id,
      name: admin.name,
      level: admin.level,
      levelName: LEVEL_NAMES[admin.level],
      flags: Array.from(effective),
    };
  }

  // ----------------------------------------------------------------------- //
  //  Vérifications
  // ----------------------------------------------------------------------- //

  /** Vérifie qu'un utilisateur possède un drapeau donné. */
  hasPermission(id: string, flag: AdminFlag): boolean {
    const admin = this.admins.get(id);
    if (!admin) return false;

    // Une révocation explicite prime toujours.
    if (admin.revokedFlags.has(flag)) return false;
    // OWNER possède implicitement tout (sauf révocation explicite).
    if (admin.level === PermissionLevel.OWNER) return true;
    // Drapeau accordé explicitement ?
    if (admin.flags.has(flag)) return true;
    // Drapeau accordé par le niveau ?
    return this.getFlagsForLevel(admin.level).has(flag);
  }

  /** Vérifie qu'un utilisateur atteint au moins un niveau donné. */
  hasPermissionLevel(id: string, level: PermissionLevel): boolean {
    const admin = this.admins.get(id);
    if (!admin) return level === PermissionLevel.USER;
    return admin.level >= level;
  }

  // ----------------------------------------------------------------------- //
  //  Mutations
  // ----------------------------------------------------------------------- //

  /** Promeut (ou rétrograde) un utilisateur à un nouveau niveau. */
  promoteUser(id: string, level: PermissionLevel): boolean {
    const admin = this.admins.get(id);
    if (!admin) return false;
    admin.level = level;
    return true;
  }

  /** Ajoute un drapeau explicite à un admin. */
  addFlag(id: string, flag: AdminFlag): boolean {
    const admin = this.admins.get(id);
    if (!admin) return false;
    admin.flags.add(flag);
    admin.revokedFlags.delete(flag);
    return true;
  }

  /** Retire un drapeau (le révoque explicitement). */
  removeFlag(id: string, flag: AdminFlag): boolean {
    const admin = this.admins.get(id);
    if (!admin) return false;
    admin.flags.delete(flag);
    admin.revokedFlags.add(flag);
    return true;
  }

  // ----------------------------------------------------------------------- //
  //  Debug / utilitaires
  // ----------------------------------------------------------------------- //

  /** Nom lisible d'un niveau. */
  getPermissionName(level: PermissionLevel): string {
    return LEVEL_NAMES[level] ?? "UNKNOWN";
  }

  /** Nom lisible d'un drapeau (utile pour les logs). */
  getFlagName(flag: AdminFlag): string {
    return String(flag);
  }

  /** Convertit une chaîne en PermissionLevel (sécurisé). */
  static parseLevel(input: string): PermissionLevel | undefined {
    const key = input.toUpperCase() as keyof typeof PermissionLevel;
    const value = PermissionLevel[key];
    return typeof value === "number" ? value : undefined;
  }
}

export default PermissionSystem;
