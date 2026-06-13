/**
 * DiscordWebhook.ts
 * ----------------------------------------------------------------------------
 * Notifications temps réel vers Discord via webhook (fetch standard).
 *
 *  - Envoi d'embeds formatés pour chaque commande loggée
 *  - Filtrage configurable (n'envoyer que les échecs, ou les commandes
 *    sensibles : ban, restart, setmoney...)
 *  - File d'attente + rate-limit basique (Discord: ~30 req / min par webhook)
 *  - Couleurs par type (succès / échec / action sensible)
 *  - S'attache au logger via onCommandLogged()
 * ----------------------------------------------------------------------------
 */

import { CommandLog } from "../console/CommandLogger";

/** Couleurs Discord (entiers décimaux). */
const COLOR = {
  success: 0x22c55e,
  failure: 0xef4444,
  sensitive: 0xf59e0b,
  info: 0x3b82f6,
};

/** Commandes considérées comme "sensibles" (surlignées en orange). */
const DEFAULT_SENSITIVE = new Set([
  "ban",
  "unban",
  "restart",
  "setmoney",
  "give",
  "promote",
  "region",
  "fill",
  "set",
]);

export interface DiscordWebhookOptions {
  /** URL du webhook Discord. */
  url: string;
  /** Nom affiché du bot. */
  username?: string;
  /** Avatar du bot (URL). */
  avatarUrl?: string;
  /** N'envoyer que les commandes en échec. */
  onlyFailures?: boolean;
  /** N'envoyer que les commandes sensibles + échecs. */
  onlySensitive?: boolean;
  /** Liste personnalisée de commandes sensibles. */
  sensitiveCommands?: string[];
  /** Préfixe de message (ex: "[EtherWorld]"). */
  prefix?: string;
  /**
   * Transport réseau. Par défaut `fetch`. Injectable pour les tests.
   * Doit accepter (url, init) et retourner une promesse "ok".
   */
  transport?: (
    url: string,
    init: { method: string; headers: Record<string, string>; body: string }
  ) => Promise<{ ok: boolean; status: number }>;
  /** Délai minimal entre 2 envois (ms). Défaut 2200 (~27/min). */
  minIntervalMs?: number;
}

interface QueueItem {
  payload: unknown;
}

export class DiscordWebhook {
  private opts: Required<Omit<DiscordWebhookOptions, "avatarUrl" | "transport">> &
    Pick<DiscordWebhookOptions, "avatarUrl" | "transport">;
  private sensitive: Set<string>;
  private queue: QueueItem[] = [];
  private draining = false;
  private lastSent = 0;

  /** Compteurs utiles pour les tests / le monitoring. */
  stats = { sent: 0, failed: 0, skipped: 0, queued: 0 };

  constructor(options: DiscordWebhookOptions) {
    this.opts = {
      url: options.url,
      username: options.username ?? "EtherWorld Admin",
      avatarUrl: options.avatarUrl,
      onlyFailures: options.onlyFailures ?? false,
      onlySensitive: options.onlySensitive ?? false,
      sensitiveCommands: options.sensitiveCommands ?? [],
      prefix: options.prefix ?? "",
      transport: options.transport,
      minIntervalMs: options.minIntervalMs ?? 2200,
    };
    this.sensitive = new Set([
      ...DEFAULT_SENSITIVE,
      ...this.opts.sensitiveCommands.map((c) => c.toLowerCase()),
    ]);
  }

  private get transport() {
    return (
      this.opts.transport ??
      (async (url: string, init: any) => {
        const res = await fetch(url, init);
        return { ok: res.ok, status: res.status };
      })
    );
  }

  /** Décide si un log doit être notifié selon la configuration. */
  shouldNotify(log: CommandLog): boolean {
    const isSensitive = this.sensitive.has(log.commandName.toLowerCase());
    if (this.opts.onlyFailures) return !log.success;
    if (this.opts.onlySensitive) return isSensitive || !log.success;
    return true;
  }

  /** Construit un embed Discord à partir d'un log. */
  private buildEmbed(log: CommandLog) {
    const isSensitive = this.sensitive.has(log.commandName.toLowerCase());
    const color = !log.success
      ? COLOR.failure
      : isSensitive
        ? COLOR.sensitive
        : COLOR.success;

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: "Admin", value: log.adminName || log.adminId, inline: true },
      { name: "Commande", value: `\`${log.commandName}\``, inline: true },
      { name: "Statut", value: log.success ? "✅ Succès" : "❌ Échec", inline: true },
    ];
    if (log.target) fields.push({ name: "Cible", value: log.target, inline: true });

    return {
      title: `${this.opts.prefix} ${isSensitive ? "⚠️ Action sensible" : "Commande admin"}`.trim(),
      description: `> \`${log.rawCommand}\`\n${log.message}`.slice(0, 1900),
      color,
      fields,
      timestamp: new Date(log.timestamp).toISOString(),
      footer: { text: `EtherWorld • log ${log.id}` },
    };
  }

  /** Met un log en file pour notification (respecte le filtrage). */
  notify(log: CommandLog): void {
    if (!this.shouldNotify(log)) {
      this.stats.skipped++;
      return;
    }
    this.enqueue({
      username: this.opts.username,
      avatar_url: this.opts.avatarUrl,
      embeds: [this.buildEmbed(log)],
    });
  }

  /** Envoie un message texte libre (annonces, alertes système). */
  notifyText(content: string): void {
    this.enqueue({
      username: this.opts.username,
      avatar_url: this.opts.avatarUrl,
      content: content.slice(0, 1900),
    });
  }

  private enqueue(payload: unknown): void {
    this.queue.push({ payload });
    this.stats.queued++;
    void this.drain();
  }

  /** Vide la file en respectant le rate-limit. */
  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length > 0) {
        const wait = this.lastSent + this.opts.minIntervalMs - Date.now();
        if (wait > 0) await sleep(wait);

        const item = this.queue.shift()!;
        this.lastSent = Date.now();
        try {
          const res = await this.transport(this.opts.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          });
          if (res.ok) this.stats.sent++;
          else this.stats.failed++;
        } catch {
          this.stats.failed++;
        }
      }
    } finally {
      this.draining = false;
    }
  }

  /** Attend que la file soit vide (utile pour les tests / shutdown). */
  async flush(): Promise<void> {
    await this.drain();
    // Petite boucle de sécurité si des items ont été ajoutés entre-temps.
    while (this.queue.length > 0) {
      await sleep(10);
      await this.drain();
    }
  }

  /** Branche automatiquement sur un logger (retourne l'unsubscribe). */
  attachTo(onCommandLogged: (cb: (log: CommandLog) => void) => () => void): () => void {
    return onCommandLogged((log) => this.notify(log));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, Math.max(0, ms)));
}

export default DiscordWebhook;
