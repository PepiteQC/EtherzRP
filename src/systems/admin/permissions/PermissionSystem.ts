/**
 * PermissionSystem.ts - Gestion des permissions et niveaux d'accès admin
 * @module AdminConsole
 * @version 2.0.0
 * @description Système hiérarchique de permissions avec niveaux, flags,
 *              matrice de droits et audit des accès.
 */

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

/**
 * Niveaux de permission hiérarchiques
 * Un niveau supérieur hérite des droits des niveaux inférieurs
 */
export enum PermissionLevel {
  USER      = 0,
  MODERATOR = 1,
  ADMIN     = 2,
  OWNER     = 3,
}

/**
 * Flags de permission granulaires
 * Permettent d'accorder des droits précis sans changer le niveau global
 */
export enum AdminFlag {
  // ── Modération ────────────────────────────────────────────
  KICK             = 'kick',
  BAN              = 'ban',
  MUTE             = 'mute',
  WARN             = 'warn',

  // ── Téléportation ─────────────────────────────────────────
  TELEPORT         = 'teleport',
  TELEPORT_TO_PLAYER = 'teleport_to_player',
  TELEPORT_PLAYER  = 'teleport_player',

  // ── Joueurs ───────────────────────────────────────────────
  FREEZE           = 'freeze',
  INVISIBLE        = 'invisible',
  GOD_MODE         = 'godmode',
  NO_CLIP          = 'noclip',
  HEAL             = 'heal',

  // ── Monde ─────────────────────────────────────────────────
  WEATHER          = 'weather',
  TIME             = 'time',
  SPAWN            = 'spawn',
  DELETE_OBJECTS   = 'delete_objects',

  // ── Économie ──────────────────────────────────────────────
  GIVE_MONEY       = 'give_money',
  SET_MONEY        = 'set_money',
  VIEW_MONEY       = 'view_money',
  ECONOMY_RESET    = 'economy_reset',

  // ── Inventaire ────────────────────────────────────────────
  GIVE_ITEM        = 'give_item',
  REMOVE_ITEM      = 'remove_item',
  CLEAR_INVENTORY  = 'clear_inventory',

  // ── Serveur ───────────────────────────────────────────────
  ANNOUNCE         = 'announce',
  CONFIG           = 'config',
  LOGS             = 'logs',
  STATUS           = 'status',
  MAINTENANCE      = 'maintenance',
  RESTART          = 'restart',

  // ── Administration ────────────────────────────────────────
  MANAGE_ADMINS    = 'manage_admins',

  /** Accès total — réservé Owner */
  ALL              = 'all',
}

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

/** Profil complet d'un administrateur */
export interface AdminUser {
  id:              string;
  name:            string;
  permissionLevel: PermissionLevel;
  /** Flags additionnels dépassant les droits du niveau */
  flags?:          AdminFlag[];
  /** Flags explicitement retirés (blacklist) */
  deniedFlags?:    AdminFlag[];
  lastActive?:     number;
  joinedAt?:       number;
  notes?:          string;
}

/** Options de création du système */
export interface PermissionSystemOptions {
  /** Si true, OWNER hérite automatiquement de tous les flags */
  ownerHasAll?: boolean;
  /** Matrice custom à fusionner avec la matrice par défaut */
  customMatrix?: Partial<Record<PermissionLevel, AdminFlag[]>>;
}

/** Résultat de vérification de permission avec détails */
export interface PermissionCheckResult {
  granted:   boolean;
  reason:    string;
  via:       'level' | 'flag' | 'owner' | 'denied' | 'not_found';
}

// ═══════════════════════════════════════════════════════════════
// MATRICE PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════

/** Flags accordés à chaque niveau par défaut */
const DEFAULT_PERMISSION_MATRIX: Record<PermissionLevel, AdminFlag[]> = {
  [PermissionLevel.USER]: [],

  [PermissionLevel.MODERATOR]: [
    AdminFlag.KICK,
    AdminFlag.WARN,
    AdminFlag.MUTE,
    AdminFlag.TELEPORT_TO_PLAYER,
    AdminFlag.LOGS,
    AdminFlag.STATUS,
  ],

  [PermissionLevel.ADMIN]: [
    AdminFlag.KICK,
    AdminFlag.BAN,
    AdminFlag.MUTE,
    AdminFlag.WARN,
    AdminFlag.TELEPORT,
    AdminFlag.TELEPORT_TO_PLAYER,
    AdminFlag.TELEPORT_PLAYER,
    AdminFlag.FREEZE,
    AdminFlag.INVISIBLE,
    AdminFlag.HEAL,
    AdminFlag.GOD_MODE,
    AdminFlag.WEATHER,
    AdminFlag.TIME,
    AdminFlag.ANNOUNCE,
    AdminFlag.GIVE_MONEY,
    AdminFlag.SET_MONEY,
    AdminFlag.VIEW_MONEY,
    AdminFlag.GIVE_ITEM,
    AdminFlag.CONFIG,
    AdminFlag.LOGS,
    AdminFlag.STATUS,
    AdminFlag.SPAWN,
  ],

  [PermissionLevel.OWNER]: [
    AdminFlag.ALL,
    AdminFlag.RESTART,
    AdminFlag.MAINTENANCE,
    AdminFlag.ECONOMY_RESET,
    AdminFlag.DELETE_OBJECTS,
    AdminFlag.NO_CLIP,
    AdminFlag.MANAGE_ADMINS,
    AdminFlag.CLEAR_INVENTORY,
    AdminFlag.REMOVE_ITEM,
  ],
};

// ═══════════════════════════════════════════════════════════════
// CLASSE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

/**
 * Système de gestion des permissions admin
 *
 * @example
 * ```typescript
 * const perms = new PermissionSystem();
 *
 * perms.registerAdmin({
 *   id: 'player_1',
 *   name: 'Jean',
 *   permissionLevel: PermissionLevel.MODERATOR,
 * });
 *
 * const canBan = perms.hasPermission('player_1', AdminFlag.BAN);
 * // → false (mod n'a pas BAN par défaut)
 *
 * perms.addFlag('player_1', AdminFlag.BAN);
 * const canBanNow = perms.hasPermission('player_1', AdminFlag.BAN);
 * // → true
 * ```
 */
export class PermissionSystem {
  private readonly admins           = new Map<string, AdminUser>();
  private readonly permissionMatrix = new Map<PermissionLevel, Set<AdminFlag>>();
  private readonly ownerHasAll:       boolean;

  constructor(options: PermissionSystemOptions = {}) {
    this.ownerHasAll = options.ownerHasAll ?? true;
    this.buildPermissionMatrix(options.customMatrix);
  }

  // ════════════════════════════════════════════════════════════
  // INITIALISATION
  // ════════════════════════════════════════════════════════════

  /** Construit la matrice interne depuis les tableaux par défaut + custom */
  private buildPermissionMatrix(
    custom?: Partial<Record<PermissionLevel, AdminFlag[]>>
  ): void {
    const levels: PermissionLevel[] = [
      PermissionLevel.USER,
      PermissionLevel.MODERATOR,
      PermissionLevel.ADMIN,
      PermissionLevel.OWNER,
    ];

    levels.forEach((level) => {
      const defaults = DEFAULT_PERMISSION_MATRIX[level] ?? [];
      const overrides = custom?.[level] ?? [];
      this.permissionMatrix.set(level, new Set([...defaults, ...overrides]));
    });
  }

  // ════════════════════════════════════════════════════════════
  // GESTION DES ADMINS
  // ════════════════════════════════════════════════════════════

  /**
   * Enregistre ou met à jour un administrateur
   */
  registerAdmin(user: AdminUser): void {
    const existing = this.admins.get(user.id);
    this.admins.set(user.id, {
      ...existing,
      ...user,
      joinedAt: user.joinedAt ?? existing?.joinedAt ?? Date.now(),
    });
  }

  /**
   * Supprime un administrateur du registre
   * @returns `true` si l'admin existait, `false` sinon
   */
  removeAdmin(userId: string): boolean {
    return this.admins.delete(userId);
  }

  /**
   * Retourne un administrateur par son ID
   */
  getAdmin(userId: string): AdminUser | null {
    return this.admins.get(userId) ?? null;
  }

  /**
   * Retourne tous les administrateurs enregistrés
   */
  getAllAdmins(): AdminUser[] {
    return Array.from(this.admins.values());
  }

  /**
   * Retourne les administrateurs d'un niveau précis
   */
  getAdminsByLevel(level: PermissionLevel): AdminUser[] {
    return this.getAllAdmins().filter((a) => a.permissionLevel === level);
  }

  /**
   * Met à jour la date de dernière activité d'un admin
   */
  updateLastActive(userId: string): void {
    const admin = this.admins.get(userId);
    if (admin) admin.lastActive = Date.now();
  }

  // ════════════════════════════════════════════════════════════
  // VÉRIFICATIONS DE PERMISSIONS
  // ════════════════════════════════════════════════════════════

  /**
   * Vérifie si un utilisateur possède un flag de permission
   * Retourne un objet détaillant le résultat
   */
  checkPermission(userId: string, flag: AdminFlag): PermissionCheckResult {
    const admin = this.admins.get(userId);

    if (!admin) {
      return {
        granted: false,
        reason:  `Utilisateur "${userId}" non trouvé dans le registre admin.`,
        via:     'not_found',
      };
    }

    // Flag explicitement refusé (blacklist individuelle)
    if (admin.deniedFlags?.includes(flag)) {
      return {
        granted: false,
        reason:  `Flag "${flag}" explicitement refusé pour "${admin.name}".`,
        via:     'denied',
      };
    }

    // Owner → accès total si ownerHasAll est activé
    if (this.ownerHasAll && admin.permissionLevel === PermissionLevel.OWNER) {
      return {
        granted: true,
        reason:  `"${admin.name}" est Owner (accès total).`,
        via:     'owner',
      };
    }

    // Flag ALL dans les flags explicites
    if (admin.flags?.includes(AdminFlag.ALL)) {
      return {
        granted: true,
        reason:  `"${admin.name}" possède le flag ALL.`,
        via:     'flag',
      };
    }

    // Flag explicite sur l'utilisateur
    if (admin.flags?.includes(flag)) {
      return {
        granted: true,
        reason:  `"${admin.name}" possède le flag "${flag}" explicitement.`,
        via:     'flag',
      };
    }

    // Matrice de niveau
    const levelFlags = this.permissionMatrix.get(admin.permissionLevel);
    if (levelFlags?.has(AdminFlag.ALL) || levelFlags?.has(flag)) {
      return {
        granted: true,
        reason:  `Accordé par la matrice niveau ${PermissionLevel[admin.permissionLevel]}.`,
        via:     'level',
      };
    }

    return {
      granted: false,
      reason:  `"${admin.name}" (niveau ${PermissionLevel[admin.permissionLevel]}) n'a pas le flag "${flag}".`,
      via:     'level',
    };
  }

  /**
   * Raccourci booléen de `checkPermission`
   */
  hasPermission(userId: string, flag: AdminFlag): boolean {
    return this.checkPermission(userId, flag).granted;
  }

  /**
   * Vérifie si un utilisateur a au minimum un certain niveau
   */
  hasPermissionLevel(userId: string, minimumLevel: PermissionLevel): boolean {
    const admin = this.admins.get(userId);
    if (!admin) return false;
    return admin.permissionLevel >= minimumLevel;
  }

  /**
   * Retourne tous les flags effectifs d'un utilisateur
   * (niveau + flags explicites, moins les refus)
   */
  getUserPermissions(userId: string): AdminFlag[] {
    const admin = this.admins.get(userId);
    if (!admin) return [];

    // Owner → tous les flags
    if (this.ownerHasAll && admin.permissionLevel === PermissionLevel.OWNER) {
      return Object.values(AdminFlag);
    }

    const flags = new Set<AdminFlag>();

    // Ajouter les flags du niveau
    const levelFlags = this.permissionMatrix.get(admin.permissionLevel);
    levelFlags?.forEach((f) => flags.add(f));

    // Ajouter les flags explicites
    admin.flags?.forEach((f) => flags.add(f));

    // Retirer les flags refusés
    admin.deniedFlags?.forEach((f) => flags.delete(f));

    // Étendre ALL si présent
    if (flags.has(AdminFlag.ALL)) {
      return Object.values(AdminFlag);
    }

    return Array.from(flags).sort();
  }

  // ════════════════════════════════════════════════════════════
  // MODIFICATION DES PERMISSIONS
  // ════════════════════════════════════════════════════════════

  /**
   * Modifie le niveau de permission d'un utilisateur
   * @returns `true` si l'admin existe et a été promu
   */
  promoteUser(userId: string, newLevel: PermissionLevel): boolean {
    const admin = this.admins.get(userId);
    if (!admin) return false;
    admin.permissionLevel = newLevel;
    return true;
  }

  /**
   * Ajoute un flag explicite à un utilisateur
   * @returns `true` si ajouté, `false` si l'admin n'existe pas ou a déjà le flag
   */
  addFlag(userId: string, flag: AdminFlag): boolean {
    const admin = this.admins.get(userId);
    if (!admin) return false;

    admin.flags ??= [];
    if (admin.flags.includes(flag)) return false;

    admin.flags.push(flag);

    // Retirer de la liste des refus si présent
    admin.deniedFlags = admin.deniedFlags?.filter((f) => f !== flag);

    return true;
  }

  /**
   * Retire un flag explicite d'un utilisateur
   * @returns `true` si retiré, `false` sinon
   */
  removeFlag(userId: string, flag: AdminFlag): boolean {
    const admin = this.admins.get(userId);
    if (!admin?.flags) return false;

    const index = admin.flags.indexOf(flag);
    if (index === -1) return false;

    admin.flags.splice(index, 1);
    return true;
  }

  /**
   * Refuse explicitement un flag à un utilisateur (même s'il est dans la matrice de niveau)
   */
  denyFlag(userId: string, flag: AdminFlag): boolean {
    const admin = this.admins.get(userId);
    if (!admin) return false;

    admin.deniedFlags ??= [];
    if (!admin.deniedFlags.includes(flag)) {
      admin.deniedFlags.push(flag);
    }

    // Retirer des flags explicites si présent
    admin.flags = admin.flags?.filter((f) => f !== flag);

    return true;
  }

  // ════════════════════════════════════════════════════════════
  // UTILITAIRES STATIQUES
  // ════════════════════════════════════════════════════════════

  /**
   * Retourne le nom lisible d'un niveau de permission
   *
   * @example
   * PermissionSystem.getLevelName(PermissionLevel.ADMIN) // → "Administrateur"
   */
  static getLevelName(level: PermissionLevel): string {
    const names: Record<PermissionLevel, string> = {
      [PermissionLevel.USER]:      'Utilisateur',
      [PermissionLevel.MODERATOR]: 'Modérateur',
      [PermissionLevel.ADMIN]:     'Administrateur',
      [PermissionLevel.OWNER]:     'Propriétaire',
    };
    return names[level] ?? `Niveau ${level}`;
  }

  /**
   * Retourne l'emoji associé à un niveau
   */
  static getLevelIcon(level: PermissionLevel): string {
    const icons: Record<PermissionLevel, string> = {
      [PermissionLevel.USER]:      '👤',
      [PermissionLevel.MODERATOR]: '🛡️',
      [PermissionLevel.ADMIN]:     '⚡',
      [PermissionLevel.OWNER]:     '👑',
    };
    return icons[level] ?? '❓';
  }

  /**
   * Retourne le nom lisible d'un flag
   *
   * @example
   * PermissionSystem.getPermissionName(AdminFlag.BAN) // → "Bannissement"
   */
  static getPermissionName(flag: AdminFlag): string {
    const names: Partial<Record<AdminFlag, string>> = {
      [AdminFlag.KICK]:               'Expulsion',
      [AdminFlag.BAN]:                'Bannissement',
      [AdminFlag.MUTE]:               'Réduction au silence',
      [AdminFlag.WARN]:               'Avertissement',
      [AdminFlag.TELEPORT]:           'Téléportation',
      [AdminFlag.TELEPORT_TO_PLAYER]: 'TP vers joueur',
      [AdminFlag.TELEPORT_PLAYER]:    'TP joueur vers soi',
      [AdminFlag.FREEZE]:             'Gel de joueur',
      [AdminFlag.INVISIBLE]:          'Invisibilité',
      [AdminFlag.GOD_MODE]:           'Mode dieu',
      [AdminFlag.NO_CLIP]:            'No-clip',
      [AdminFlag.HEAL]:               'Soigner',
      [AdminFlag.WEATHER]:            'Météo',
      [AdminFlag.TIME]:               'Heure du serveur',
      [AdminFlag.SPAWN]:              'Spawn d\'objets',
      [AdminFlag.DELETE_OBJECTS]:     'Suppression d\'objets',
      [AdminFlag.GIVE_MONEY]:         'Donner argent',
      [AdminFlag.SET_MONEY]:          'Définir argent',
      [AdminFlag.VIEW_MONEY]:         'Voir argent',
      [AdminFlag.ECONOMY_RESET]:      'Réinitialiser économie',
      [AdminFlag.GIVE_ITEM]:          'Donner item',
      [AdminFlag.REMOVE_ITEM]:        'Retirer item',
      [AdminFlag.CLEAR_INVENTORY]:    'Vider inventaire',
      [AdminFlag.ANNOUNCE]:           'Annonces serveur',
      [AdminFlag.CONFIG]:             'Configuration',
      [AdminFlag.LOGS]:               'Accès aux logs',
      [AdminFlag.STATUS]:             'Statut serveur',
      [AdminFlag.MAINTENANCE]:        'Mode maintenance',
      [AdminFlag.RESTART]:            'Redémarrage serveur',
      [AdminFlag.MANAGE_ADMINS]:      'Gestion des admins',
      [AdminFlag.ALL]:                'Accès total',
    };
    return names[flag] ?? flag.replace(/_/g, ' ');
  }

  /**
   * Retourne le nom lisible d'un niveau (instance ou statique)
   * Proxy de la méthode statique pour commodité
   */
  getPermissionName(flag: AdminFlag): string {
    return PermissionSystem.getPermissionName(flag);
  }

  // ════════════════════════════════════════════════════════════
  // DIAGNOSTIC
  // ════════════════════════════════════════════════════════════

  /** Retourne un résumé du système pour le débogage */
  getSystemInfo(): Record<string, unknown> {
    const byLevel = Object.values(PermissionLevel)
      .filter((v): v is PermissionLevel => typeof v === 'number')
      .reduce<Record<string, number>>((acc, level) => {
        acc[PermissionLevel[level]] = this.getAdminsByLevel(level).length;
        return acc;
      }, {});

    return {
      totalAdmins:  this.admins.size,
      byLevel,
      matrixLevels: this.permissionMatrix.size,
      ownerHasAll:  this.ownerHasAll,
    };
  }
}

export default PermissionSystem;