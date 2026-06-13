// src/systems/security/audit/DiscordWebhook.ts

import { Violation } from "../types";

export class DiscordWebhook {
  private static readonly WEBHOOK_URL =
    process.env.DISCORD_WEBHOOK_URL ?? "";

  private static readonly SEVERITY_COLORS: Record<string, number> = {
    low:      0x2ecc71,  // vert
    medium:   0xf39c12,  // orange
    high:     0xe74c3c,  // rouge
    critical: 0x8e44ad,  // violet
  };

  // ─── Envoyer une alerte ───────────────────────────────────
  static async sendAlert(violation: Violation): Promise<void> {
    if (!this.WEBHOOK_URL) return;

    const embed = {
      title: `🛡️ ANTI-CHEAT — ${violation.type.toUpperCase()}`,
      description: violation.description,
      color: this.SEVERITY_COLORS[violation.severity] ?? 0xffffff,
      fields: [
        {
          name: "👤 Joueur",
          value: `${violation.playerName || violation.playerUid}`,
          inline: true,
        },
        {
          name: "⚠️ Sévérité",
          value: violation.severity.toUpperCase(),
          inline: true,
        },
        {
          name: "🤖 Action Auto",
          value: violation.autoAction,
          inline: true,
        },
        {
          name: "📋 Preuves",
          value: `\`\`\`json\n${JSON.stringify(violation.evidence, null, 2).substring(0, 500)}\n\`\`\``,
          inline: false,
        },
      ],
      footer: {
        text: `ETHERWORLD RP QUÉBEC 🍁 | ${new Date().toLocaleString("fr-CA")}`,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      await fetch(this.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "🛡️ ETHERWORLD AntiCheat",
          avatar_url: "https://i.imgur.com/your-logo.png",
          embeds: [embed],
        }),
      });
    } catch (err) {
      console.error("[DISCORD] ❌ Webhook error:", err);
    }
  }

  // ─── Alerte admin (ban, kick, etc.) ───────────────────────
  static async sendAdminAlert(data: {
    action: string;
    adminName: string;
    targetName: string;
    reason: string;
  }): Promise<void> {
    if (!this.WEBHOOK_URL) return;

    try {
      await fetch(this.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "👮 ETHERWORLD Admin",
          content: `**${data.action}** — ${data.adminName} → ${data.targetName}\n📝 Raison: ${data.reason}`,
        }),
      });
    } catch {}
  }

  // ─── Alerte serveur (crash, haute charge, etc.) ───────────
  static async sendServerAlert(
    title: string,
    message: string
  ): Promise<void> {
    if (!this.WEBHOOK_URL) return;

    try {
      await fetch(this.WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "🖥️ ETHERWORLD Server",
          embeds: [
            {
              title: `🖥️ ${title}`,
              description: message,
              color: 0xe74c3c,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    } catch {}
  }
}