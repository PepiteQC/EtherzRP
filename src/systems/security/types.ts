// src/systems/security/types.ts

export type ViolationType =
  | "speed_hack"
  | "teleport_hack"
  | "money_hack"
  | "weapon_hack"
  | "fly_hack"
  | "noclip"
  | "inventory_dupe"
  | "spam"
  | "exploit"
  | "modification";

export type Severity = "low" | "medium" | "high" | "critical";

export interface Violation {
  id: string;
  type: ViolationType;
  severity: Severity;
  playerUid: string;
  playerName: string;
  description: string;
  evidence: Record<string, any>;   // données factuelles
  timestamp: number;
  autoAction: "none" | "warn" | "kick" | "ban";
}

export interface PlayerSecurityProfile {
  uid: string;
  violations: Violation[];
  totalViolations: number;
  trustScore: number;              // 0-100 (100 = clean)
  isBanned: boolean;
  isWatched: boolean;              // surveillance manuelle
  lastPosition: { x: number; y: number; z: number };
  lastPositionTime: number;
  lastMoney: number;
  lastMoneyTime: number;
}

export interface RateLimit {
  maxActions: number;
  windowMs: number;
  actions: number[];               // timestamps des actions récentes
}