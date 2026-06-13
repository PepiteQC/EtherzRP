/**
 * PunishmentSystem.ts
 * ----------------------------------------------------------------------------
 * Gestion centralisée des sanctions (bans, mutes, warns, kicks) avec :
 *
 *  - Durées temporisées + expiration automatique (isBanned / isMuted)
 *  - Casier judiciaire par joueur (getHistory)
 *  - Annulation (pardon) d'une sanction active
 *  - Comptage des avertissements + escalade automatique configurable
 *  - Sérialisable (sauvegarde via StorageAdapter / backups)
 * ----------------------------------------------------------------------------
 */

export type PunishmentType = "ban" | "mute" | "warn" | "kick";

export interface Punishment {
  id: string;
  type: PunishmentType;
  /** id du joueur sanctionné. */
  targetId: string;
  /** nom au moment de la sanction (pour l'audit même si le joueur change). */
  targetName: string;
  /** id de l'admin qui a sanctionné. */
  byId: string;
  byName: string;
  reason: string;
  createdAt: number;
  /** timestamp d'expiration, ou null = permanent / instantané (kick/warn). */
  expiresAt: number | null;
  /** sanction levée manuellement ? */
  pardoned: boolean;
  pardonedBy?: string;
  pardonedAt?: number;
}

export interface PunishmentState {
  punishments: Punishment[];
}

export interface EscalationRule {
  /** Au n-ième warn... */
  warnCount: number;
  /** ...applique cette sanction. */
  apply: PunishmentType;
  /** durée en ms (null = permanent). */
  durationMs: number | null;
  reason: string;
}

export interface PunishmentOptions {
  /** Limite de l'historique total. */
  limit?: number;
  /** Règles d'escalade sur warns (triées par warnCount croissant). */
  escalation?: EscalationRule[];
  /** Source de temps (injectable pour les tests). */
  now?: () => number;
}

export class PunishmentSystem {
  private list: Punishment[] = [];
  private seq = 0;
  private limit: number;
  private escalation: EscalationRule[];
  private now: () => number;

  constructor(options?: PunishmentOptions) {
    this.limit = options?.limit ?? 50_000;
    this.escalation = (options?.escalation ?? []).sort(
      (a, b) => a.warnCount - b.warnCount
    );
    this.now = options?.now ?? (() => Date.now());
  }

  // --------------------------------------------------------------------- //
  //  Application de sanctions
  // --------------------------------------------------------------------- //

  private add(p: Omit<Punishment, "id" | "createdAt" | "pardoned">): Punishment {
    const full: Punishment = {
      ...p,
      id: `pun_${this.now()}_${this.seq++}`,
      createdAt: this.now(),
      pardoned: false,
    };
    this.list.push(full);
    if (this.list.length > this.limit) {
      this.list.splice(0, this.list.length - this.limit);
    }
    return full;
  }

  ban(
    target: { id: string; name: string },
    by: { id: string; name: string },
    reason: string,
    durationMs: number | null = null
  ): Punishment {
    return this.add({
      type: "ban",
      targetId: target.id,
      targetName: target.name,
      byId: by.id,
      byName: by.name,
      reason,
      expiresAt: durationMs ? this.now() + durationMs : null,
    });
  }

  mute(
    target: { id: string; name: string },
    by: { id: string; name: string },
    reason: string,
    durationMs: number | null = null
  ): Punishment {
    return this.add({
      type: "mute",
      targetId: target.id,
      targetName: target.name,
      byId: by.id,
      byName: by.name,
      reason,
      expiresAt: durationMs ? this.now() + durationMs : null,
    });
  }

  kick(
    target: { id: string; name: string },
    by: { id: string; name: string },
    reason: string
  ): Punishment {
    return this.add({
      type: "kick",
      targetId: target.id,
      targetName: target.name,
      byId: by.id,
      byName: by.name,
      reason,
      expiresAt: this.now(), // instantané
    });
  }

  /**
   * Avertit un joueur. Retourne l'avertissement + une éventuelle sanction
   * d'escalade déclenchée automatiquement.
   */
  warn(
    target: { id: string; name: string },
    by: { id: string; name: string },
    reason: string
  ): { warning: Punishment; escalation?: Punishment } {
    const warning = this.add({
      type: "warn",
      targetId: target.id,
      targetName: target.name,
      byId: by.id,
      byName: by.name,
      reason,
      expiresAt: null,
    });

    const count = this.getWarnCount(target.id);
    const rule = this.escalation.find((r) => r.warnCount === count);
    if (rule) {
      const system = { id: "SYSTEM", name: "Escalade auto" };
      const escalation =
        rule.apply === "ban"
          ? this.ban(target, system, rule.reason, rule.durationMs)
          : rule.apply === "mute"
            ? this.mute(target, system, rule.reason, rule.durationMs)
            : rule.apply === "kick"
              ? this.kick(target, system, rule.reason)
              : undefined;
      return { warning, escalation };
    }
    return { warning };
  }

  // --------------------------------------------------------------------- //
  //  État actif (avec expiration auto)
  // --------------------------------------------------------------------- //

  private isActive(p: Punishment): boolean {
    if (p.pardoned) return false;
    if (p.expiresAt === null) return true; // permanent
    return p.expiresAt > this.now();
  }

  /** Sanction active d'un type pour un joueur (la plus récente). */
  private activeOf(targetId: string, type: PunishmentType): Punishment | undefined {
    return this.list
      .filter((p) => p.targetId === targetId && p.type === type && this.isActive(p))
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  isBanned(targetId: string): boolean {
    return !!this.activeOf(targetId, "ban");
  }

  isMuted(targetId: string): boolean {
    return !!this.activeOf(targetId, "mute");
  }

  /** Détail de la sanction active (utile pour les messages "il vous reste X"). */
  getActiveBan(targetId: string): Punishment | undefined {
    return this.activeOf(targetId, "ban");
  }

  getActiveMute(targetId: string): Punishment | undefined {
    return this.activeOf(targetId, "mute");
  }

  /** Millisecondes restantes avant expiration (Infinity si permanent, 0 si inactif). */
  remainingMs(p: Punishment | undefined): number {
    if (!p || !this.isActive(p)) return 0;
    if (p.expiresAt === null) return Infinity;
    return Math.max(0, p.expiresAt - this.now());
  }

  // --------------------------------------------------------------------- //
  //  Annulation
  // --------------------------------------------------------------------- //

  /** Lève toutes les sanctions actives d'un type pour un joueur. Retourne le nb levé. */
  pardon(
    targetId: string,
    type: PunishmentType,
    by: { id: string; name: string }
  ): number {
    let count = 0;
    for (const p of this.list) {
      if (p.targetId === targetId && p.type === type && this.isActive(p)) {
        p.pardoned = true;
        p.pardonedBy = by.id;
        p.pardonedAt = this.now();
        count++;
      }
    }
    return count;
  }

  unban(targetId: string, by: { id: string; name: string }): number {
    return this.pardon(targetId, "ban", by);
  }

  unmute(targetId: string, by: { id: string; name: string }): number {
    return this.pardon(targetId, "mute", by);
  }

  // --------------------------------------------------------------------- //
  //  Consultation
  // --------------------------------------------------------------------- //

  getWarnCount(targetId: string): number {
    return this.list.filter((p) => p.type === "warn" && p.targetId === targetId && !p.pardoned).length;
  }

  /** Casier complet d'un joueur (le plus récent en premier). */
  getHistory(targetId: string): Punishment[] {
    return this.list
      .filter((p) => p.targetId === targetId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /** Toutes les sanctions actives (tous joueurs). */
  getActivePunishments(): Punishment[] {
    return this.list.filter((p) => this.isActive(p));
  }

  getAll(): Punishment[] {
    return [...this.list];
  }

  // --------------------------------------------------------------------- //
  //  Sérialisation
  // --------------------------------------------------------------------- //

  toState(): PunishmentState {
    return { punishments: this.list.map((p) => ({ ...p })) };
  }

  loadState(state: PunishmentState): void {
    this.list = (state.punishments ?? []).map((p) => ({ ...p }));
  }
}

export default PunishmentSystem;
