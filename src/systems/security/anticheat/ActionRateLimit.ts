// src/systems/security/anticheat/ActionRateLimit.ts

import { Violation } from "../types";
import { v4 as uuid } from "uuid";

interface RateLimitConfig {
  maxActions: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  chat:           { maxActions: 5,  windowMs: 5000   },
  move:           { maxActions: 60, windowMs: 1000   },
  interact:       { maxActions: 10, windowMs: 5000   },
  buy:            { maxActions: 5,  windowMs: 10000  },
  sell:           { maxActions: 5,  windowMs: 10000  },
  shoot:          { maxActions: 15, windowMs: 1000   },
  pickup:         { maxActions: 10, windowMs: 5000   },
  drop:           { maxActions: 10, windowMs: 5000   },
  phone_call:     { maxActions: 3,  windowMs: 30000  },
  admin_command:  { maxActions: 5,  windowMs: 3000   },
};

export class ActionRateLimit {
  private static buckets: Map<string, number[]> = new Map();

  static check(uid: string, action: string): Violation | null {
    const config = RATE_LIMITS[action];
    if (!config) return null;

    const key = `${uid}:${action}`;
    const now = Date.now();

    if (!this.buckets.has(key)) {
      this.buckets.set(key, []);
    }

    const timestamps = this.buckets.get(key)!;

    // Nettoyer les vieilles entrées
    const filtered = timestamps.filter(
      (t) => now - t < config.windowMs
    );
    filtered.push(now);
    this.buckets.set(key, filtered);

    if (filtered.length > config.maxActions) {
      return {
        id: uuid(),
        type: "spam",
        severity:
          filtered.length > config.maxActions * 3 ? "high" : "low",
        playerUid: uid,
        playerName: "",
        description: `Rate limit: ${action} — ${filtered.length}/${config.maxActions} en ${config.windowMs}ms`,
        evidence: {
          action,
          count: filtered.length,
          limit: config.maxActions,
          window: config.windowMs,
        },
        timestamp: now,
        autoAction: "none",
      };
    }

    return null;
  }

  // Nettoyer périodiquement la mémoire
  static cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.buckets) {
      const fresh = timestamps.filter((t) => now - t < 60000);
      if (fresh.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, fresh);
      }
    }
  }
}

// Nettoyage toutes les minutes
setInterval(() => ActionRateLimit.cleanup(), 60000);