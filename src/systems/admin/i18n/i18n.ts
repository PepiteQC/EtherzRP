/**
 * i18n.ts
 * ----------------------------------------------------------------------------
 * Internationalisation légère (sans dépendance) pour la console admin.
 *
 *  - Locales FR / EN (extensible)
 *  - Interpolation {var}
 *  - Fallback automatique vers la locale par défaut puis vers la clé brute
 *  - Helper de formatage de durée (ms -> "1h 30m") localisé
 * ----------------------------------------------------------------------------
 */

export type Locale = "fr" | "en";

export type Messages = Record<string, string>;

const DICT: Record<Locale, Messages> = {
  fr: {
    "error.command_not_found": 'Commande inconnue : "{name}". Tapez "help".',
    "error.insufficient": 'Permissions insuffisantes pour "{name}".',
    "error.invalid_arg": 'Argument invalide "{arg}" : {reason}',
    "error.missing_arg": 'Argument manquant : "{arg}".',
    "error.disabled": "⛔ La console admin est désactivée.",
    "punish.banned": "🔨 {target} banni ({duration}). Raison : {reason}",
    "punish.muted": "🔇 {target} rendu muet ({duration}). Raison : {reason}",
    "punish.warned": "⚠️ {target} averti : {reason}",
    "punish.kicked": "👢 {target} expulsé. Raison : {reason}",
    "punish.unbanned": "✅ {count} bannissement(s) levé(s) pour {target}.",
    "punish.escalation": "⚡ Escalade automatique : {action} appliquée à {target}.",
    "time.permanent": "permanent",
    "time.expired": "expiré",
  },
  en: {
    "error.command_not_found": 'Unknown command: "{name}". Type "help".',
    "error.insufficient": 'Insufficient permissions for "{name}".',
    "error.invalid_arg": 'Invalid argument "{arg}": {reason}',
    "error.missing_arg": 'Missing argument: "{arg}".',
    "error.disabled": "⛔ The admin console is disabled.",
    "punish.banned": "🔨 {target} banned ({duration}). Reason: {reason}",
    "punish.muted": "🔇 {target} muted ({duration}). Reason: {reason}",
    "punish.warned": "⚠️ {target} warned: {reason}",
    "punish.kicked": "👢 {target} kicked. Reason: {reason}",
    "punish.unbanned": "✅ {count} ban(s) lifted for {target}.",
    "punish.escalation": "⚡ Auto escalation: {action} applied to {target}.",
    "time.permanent": "permanent",
    "time.expired": "expired",
  },
};

export class I18n {
  private locale: Locale;
  private fallback: Locale = "fr";
  private custom: Partial<Record<Locale, Messages>> = {};

  constructor(locale: Locale = "fr") {
    this.locale = locale;
  }

  setLocale(locale: Locale): void {
    this.locale = locale;
  }

  getLocale(): Locale {
    return this.locale;
  }

  /** Ajoute/écrase des messages pour une locale. */
  extend(locale: Locale, messages: Messages): void {
    this.custom[locale] = { ...(this.custom[locale] ?? {}), ...messages };
  }

  private lookup(locale: Locale, key: string): string | undefined {
    return this.custom[locale]?.[key] ?? DICT[locale]?.[key];
  }

  /** Traduit une clé avec interpolation {var}. */
  t(key: string, vars?: Record<string, string | number>): string {
    const template =
      this.lookup(this.locale, key) ?? this.lookup(this.fallback, key) ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, name) =>
      name in vars ? String(vars[name]) : `{${name}}`
    );
  }

  /** Formate une durée (ms) en texte localisé court. */
  formatDuration(ms: number | null): string {
    if (ms === null) return this.t("time.permanent");
    if (ms <= 0) return this.t("time.expired");
    const units: [number, string, string][] = [
      [86_400_000, "j", "d"],
      [3_600_000, "h", "h"],
      [60_000, "m", "m"],
      [1_000, "s", "s"],
    ];
    const parts: string[] = [];
    let rest = ms;
    for (const [size, fr, en] of units) {
      const v = Math.floor(rest / size);
      if (v > 0) {
        parts.push(`${v}${this.locale === "fr" ? fr : en}`);
        rest -= v * size;
      }
      if (parts.length >= 2) break;
    }
    return parts.length ? parts.join(" ") : "0s";
  }
}

/** Instance partagée par défaut. */
export const i18n = new I18n("fr");

export default I18n;
