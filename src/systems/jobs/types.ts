// src/systems/jobs/types.ts

import { Vector3 } from "three";

// ─── Tous les jobs du serveur ───────────────────────────────
export type JobId =
  | "police"
  | "ambulance"
  | "mechanic"
  | "taxi"
  | "dealer"
  | "fisherman"
  | "lumberjack"
  | "miner"
  | "lawyer"
  | "delivery"
  | "unemployed";

export type JobRank = "recruit" | "junior" | "senior" | "chief" | "boss";

export interface JobDefinition {
  id: JobId;
  label: string;
  emoji: string;
  description: string;
  salaryBase: number;           // $/heure RP
  salaryPerRank: number;        // bonus par rang
  maxMembers: number;           // max joueurs dans ce job
  isLegal: boolean;
  requiresWhitelist: boolean;   // job RP — faut postuler
  dutyLocations: Vector3[];     // où prendre service
  vehicleModels: string[];      // véhicules associés
  uniformModel: string;         // modèle Three.js uniforme
  radioFrequency: number;       // fréquence radio par défaut
}

export interface PlayerJob {
  uid: string;
  jobId: JobId;
  rank: JobRank;
  isOnDuty: boolean;
  dutyStartTime: number | null;
  totalDutyTime: number;        // minutes totales
  salary: number;
  arrestCount?: number;         // police
  healCount?: number;           // ambulance
  repairCount?: number;         // mechanic
  deliveryCount?: number;       // delivery
}

// ─── Système de justice ─────────────────────────────────────
export type CrimeType =
  | "speeding"
  | "reckless_driving"
  | "assault"
  | "murder"
  | "robbery"
  | "drug_possession"
  | "drug_trafficking"
  | "weapon_illegal"
  | "trespassing"
  | "resisting_arrest"
  | "jailbreak"
  | "fraud";

export interface CrimeRecord {
  id: string;
  crimeType: CrimeType;
  label: string;
  fine: number;                 // amende $
  jailTime: number;             // minutes de prison
  wantedStars: number;          // 1-5 étoiles
}

export interface WantedLevel {
  uid: string;
  displayName: string;
  stars: number;                // 1-5
  crimes: CrimeRecord[];
  totalFines: number;
  isArrested: boolean;
  isPrisoner: boolean;
  prisonReleaseAt: number | null;
}

export interface ArrestRecord {
  id: string;
  suspectUid: string;
  suspectName: string;
  officerUid: string;
  officerName: string;
  charges: CrimeRecord[];
  totalFine: number;
  jailTime: number;
  timestamp: number;
}

// ─── Factions ───────────────────────────────────────────────
export type FactionId = string;

export interface Faction {
  id: FactionId;
  name: string;                 // "Les Loups de Montréal"
  tag: string;                  // "[LDM]"
  color: string;                // Couleur hex
  leaderUid: string;
  coLeaders: string[];
  members: FactionMember[];
  bankBalance: number;
  territories: TerritoryZone[];
  allies: FactionId[];
  enemies: FactionId[];
  isLegal: boolean;
  createdAt: number;
}

export interface FactionMember {
  uid: string;
  displayName: string;
  rank: "boss" | "underboss" | "captain" | "soldier" | "recruit";
  joinedAt: number;
}

export interface TerritoryZone {
  id: string;
  name: string;                 // "Quartier Latin"
  center: Vector3;
  radius: number;               // Rapier sensor radius
  controlledBy: FactionId | null;
  captureProgress: number;      // 0-100
  isContested: boolean;
}