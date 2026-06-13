// src/systems/security/anticheat/MoneyValidator.ts

import { Violation } from "../types";
import { v4 as uuid } from "uuid";

export class MoneyValidator {
  private static readonly MAX_GAIN_PER_MINUTE = 5000;   // $ max légal/min
  private static readonly SUSPICION_THRESHOLD = 15000;   // gain suspect
  private static readonly MAX_SINGLE_TRANSACTION = 50000;

  static check(
    lastMoney: number,
    currentMoney: number,
    lastTime: number,
    uid: string
  ): Violation | null {
    const gain = currentMoney - lastMoney;
    const dtMin = (Date.now() - lastTime) / 60000;

    // Pas de gain = OK
    if (gain <= 0) return null;

    // Gain par minute
    const gainPerMin = dtMin > 0 ? gain / dtMin : gain;

    // Transaction unique trop grosse
    if (gain > this.MAX_SINGLE_TRANSACTION) {
      return {
        id: uuid(),
        type: "money_hack",
        severity: "critical",
        playerUid: uid,
        playerName: "",
        description: `Transaction suspecte: +$${gain.toLocaleString()} en une fois`,
        evidence: {
          gain,
          previousBalance: lastMoney,
          newBalance: currentMoney,
          timeWindow: dtMin.toFixed(2),
        },
        timestamp: Date.now(),
        autoAction: "none",
      };
    }

    // Gain trop rapide
    if (gainPerMin > this.SUSPICION_THRESHOLD) {
      return {
        id: uuid(),
        type: "money_hack",
        severity: "high",
        playerUid: uid,
        playerName: "",
        description: `Gain d'argent suspect: $${gainPerMin.toFixed(0)}/min`,
        evidence: {
          gainPerMinute: gainPerMin,
          totalGain: gain,
          timeWindow: dtMin.toFixed(2),
        },
        timestamp: Date.now(),
        autoAction: "none",
      };
    }

    return null;
  }
}