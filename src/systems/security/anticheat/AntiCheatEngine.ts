// src/systems/security/anticheat/AntiCheatEngine.ts

import { Violation, ViolationType, Severity, PlayerSecurityProfile } from "../types";
import { PositionValidator } from "./PositionValidator";
import { SpeedValidator } from "./SpeedValidator";
import { MoneyValidator } from "./MoneyValidator";
import { WeaponValidator } from "./WeaponValidator";
import { InventoryValidator } from "./InventoryValidator";
import { ActionRateLimit } from "./ActionRateLimit";
import { AuditLogger } from "../audit/AuditLogger";
import { DiscordWebhook } from "../audit/DiscordWebhook";
import { v4 as uuid } from "uuid";

// Seuils d'auto-action
const AUTO_ACTION_THRESHOLDS = {
  warn: 3,     // 3 violations → avertissement
  kick: 7,     // 7 violations → kick
  ban: 15,     // 15 violations → ban auto
};

export class AntiCheatEngine {
  private static profiles: Map<string, PlayerSecurityProfile> = new Map();
  private static tickInterval: NodeJS.Timeout | null = null;

  // ─── Initialisation ───────────────────────────────────────
  static init(): void {
    // Tick toutes les 2 secondes
    this.tickInterval = setInterval(() => this.tick(), 2000);
    console.log("[ANTI-CHEAT] 🛡️ Engine démarré");
  }

  // ─── Enregistrer un joueur ────────────────────────────────
  static registerPlayer(uid: string, name: string): void {
    if (this.profiles.has(uid)) return;

    this.profiles.set(uid, {
      uid,
      violations: [],
      totalViolations: 0,
      trustScore: 100,
      isBanned: false,
      isWatched: false,
      lastPosition: { x: 0, y: 0, z: 0 },
      lastPositionTime: Date.now(),
      lastMoney: 0,
      lastMoneyTime: Date.now(),
    });
  }

  // ─── Tick principal ───────────────────────────────────────
  private static tick(): void {
    // Vérifications périodiques sur tous les joueurs
    for (const [uid, profile] of this.profiles) {
      // Vérifier le trust score et agir
      if (profile.trustScore < 20 && !profile.isBanned) {
        this.flagPlayer(uid, "Trust score critique");
      }
    }
  }

  // ─── Valider une position (appelé à chaque update joueur) ─
  static validatePosition(
    uid: string,
    newPos: { x: number; y: number; z: number },
    deltaTime: number,
    socket: any
  ): boolean {
    const profile = this.profiles.get(uid);
    if (!profile) return true;

    // Speed check
    const speedViolation = SpeedValidator.check(
      profile.lastPosition,
      newPos,
      deltaTime,
      uid
    );

    if (speedViolation) {
      this.addViolation(uid, speedViolation, socket);
      // Rejeter la position → renvoyer l'ancienne
      socket.to(uid).emit("anticheat:revert_position", {
        position: profile.lastPosition,
      });
      return false;
    }

    // Teleport check
    const tpViolation = PositionValidator.check(
      profile.lastPosition,
      newPos,
      profile.lastPositionTime,
      uid
    );

    if (tpViolation) {
      this.addViolation(uid, tpViolation, socket);
      socket.to(uid).emit("anticheat:revert_position", {
        position: profile.lastPosition,
      });
      return false;
    }

    // Position acceptée → mettre à jour
    profile.lastPosition = newPos;
    profile.lastPositionTime = Date.now();
    return true;
  }

  // ─── Valider une transaction d'argent ─────────────────────
  static validateMoney(
    uid: string,
    currentMoney: number,
    socket: any
  ): boolean {
    const profile = this.profiles.get(uid);
    if (!profile) return true;

    const violation = MoneyValidator.check(
      profile.lastMoney,
      currentMoney,
      profile.lastMoneyTime,
      uid
    );

    if (violation) {
      this.addViolation(uid, violation, socket);
      return false;
    }

    profile.lastMoney = currentMoney;
    profile.lastMoneyTime = Date.now();
    return true;
  }

  // ─── Valider un rate limit (actions) ──────────────────────
  static validateAction(
    uid: string,
    action: string,
    socket: any
  ): boolean {
    const violation = ActionRateLimit.check(uid, action);

    if (violation) {
      this.addViolation(uid, violation, socket);
      return false;
    }

    return true;
  }

  // ─── Ajouter une violation ────────────────────────────────
  private static async addViolation(
    uid: string,
    violation: Violation,
    socket: any
  ): Promise<void> {
    const profile = this.profiles.get(uid);
    if (!profile) return;

    profile.violations.push(violation);
    profile.totalViolations++;

    // Réduire le trust score
    const severityPenalty: Record<Severity, number> = {
      low: 2,
      medium: 5,
      high: 15,
      critical: 30,
    };
    profile.trustScore = Math.max(
      0,
      profile.trustScore - severityPenalty[violation.severity]
    );

    // Logger
    await AuditLogger.logViolation(violation);

    // Auto-actions
    const total = profile.totalViolations;

    if (total >= AUTO_ACTION_THRESHOLDS.ban) {
      violation.autoAction = "ban";
      await this.autoBan(uid, violation, socket);
    } else if (total >= AUTO_ACTION_THRESHOLDS.kick) {
      violation.autoAction = "kick";
      await this.autoKick(uid, violation, socket);
    } else if (total >= AUTO_ACTION_THRESHOLDS.warn) {
      violation.autoAction = "warn";
      socket.to(uid).emit("anticheat:warning", {
        message: `⚠️ AVERTISSEMENT: ${violation.description}`,
        violationCount: total,
      });
    }

    // Discord webhook si severity >= high
    if (
      violation.severity === "high" ||
      violation.severity === "critical"
    ) {
      await DiscordWebhook.sendAlert(violation);
    }
  }

  // ─── Auto-kick ────────────────────────────────────────────
  private static async autoKick(
    uid: string,
    violation: Violation,
    socket: any
  ): Promise<void> {
    socket.to(uid).emit("admin:kick", {
      reason: `[ANTI-CHEAT] ${violation.description}`,
      kickedBy: "🛡️ AntiCheat",
    });

    console.log(
      `[ANTI-CHEAT] 🦵 Auto-kick: ${uid} — ${violation.description}`
    );
  }

  // ─── Auto-ban ─────────────────────────────────────────────
  private static async autoBan(
    uid: string,
    violation: Violation,
    socket: any
  ): Promise<void> {
    const profile = this.profiles.get(uid);
    if (profile) profile.isBanned = true;

    socket.to(uid).emit("admin:ban", {
      reason: `[ANTI-CHEAT] Trop de violations: ${violation.description}`,
      duration: "7 jours",
      bannedBy: "🛡️ AntiCheat",
    });

    await DiscordWebhook.sendAlert({
      ...violation,
      description: `🔨 AUTO-BAN: ${violation.description}`,
    });

    console.log(
      `[ANTI-CHEAT] 🔨 Auto-ban: ${uid} — ${violation.description}`
    );
  }

  // ─── Flag manuel (admin watch) ────────────────────────────
  static flagPlayer(uid: string, reason: string): void {
    const profile = this.profiles.get(uid);
    if (profile) {
      profile.isWatched = true;
      console.log(`[ANTI-CHEAT] 👁️ ${uid} sous surveillance: ${reason}`);
    }
  }

  // ─── Stats pour admin console ─────────────────────────────
  static getProfile(uid: string): PlayerSecurityProfile | undefined {
    return this.profiles.get(uid);
  }

  static getAllProfiles(): PlayerSecurityProfile[] {
    return [...this.profiles.values()];
  }

  static getSuspects(): PlayerSecurityProfile[] {
    return [...this.profiles.values()].filter(
      (p) => p.trustScore < 60 || p.isWatched
    );
  }
}