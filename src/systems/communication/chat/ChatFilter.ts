// src/systems/communication/chat/ChatFilter.ts

const BANNED_WORDS = [
  // Mots interdits - ajouter selon vos règles
  // Pas de vrais mots ici, utilisez votre propre liste
  "cheat", "hack", "exploit", "ddos",
  "aimbot", "wallhack", "speedhack",
];

const SLUR_PATTERNS = [
  // Regex pour détecter les contournements
  /h[\W_]*a[\W_]*c[\W_]*k/i,
  /c[\W_]*h[\W_]*e[\W_]*a[\W_]*t/i,
];

export class ChatFilter {
  static filter(raw: string): { clean: string; blocked: boolean } {
    let clean = raw;
    let blocked = false;

    // Vérifier les mots interdits
    for (const word of BANNED_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      if (regex.test(clean)) {
        clean = clean.replace(regex, "***");
      }
    }

    // Vérifier les patterns de contournement
    for (const pattern of SLUR_PATTERNS) {
      if (pattern.test(clean)) {
        blocked = true;
        break;
      }
    }

    // Limiter longueur
    if (clean.length > 300) {
      clean = clean.substring(0, 300) + "...";
    }

    // Bloquer les liens
    const urlRegex =
      /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b\w+\.(com|net|org|io)\b)/gi;
    clean = clean.replace(urlRegex, "[lien bloqué]");

    return { clean, blocked };
  }
}