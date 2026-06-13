// src/systems/jobs/factions/FactionSystem.ts

import { db } from "@/lib/firebase/config";
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs,
  serverTimestamp, arrayUnion, arrayRemove, increment,
} from "firebase/firestore";
import { Faction, FactionMember, TerritoryZone, FactionId } from "../types";
import { v4 as uuid } from "uuid";

export class FactionSystem {
  private static factions: Map<FactionId, Faction> = new Map();

  // ─── Charger toutes les factions ──────────────────────────
  static async loadAll(): Promise<void> {
    const snap = await getDocs(collection(db, "factions"));
    snap.forEach((d) => {
      const faction = d.data() as Faction;
      this.factions.set(d.id, faction);
    });
    console.log(`[FACTIONS] ✅ ${this.factions.size} faction(s) chargées`);
  }

  // ─── Créer une faction ────────────────────────────────────
  static async create(
    leaderUid: string,
    leaderName: string,
    name: string,
    tag: string,
    color: string
  ): Promise<{ success: boolean; message: string }> {
    // Vérifier que le joueur n'a pas déjà une faction
    const existing = this.getPlayerFaction(leaderUid);
    if (existing) {
      return {
        success: false,
        message: `❌ Tu es déjà dans la faction "${existing.name}"`,
      };
    }

    // Vérifier nom unique
    const nameExists = [...this.factions.values()].some(
      (f) => f.name.toLowerCase() === name.toLowerCase()
    );
    if (nameExists) {
      return { success: false, message: `❌ Le nom "${name}" est déjà pris` };
    }

    const id = uuid();
    const faction: Faction = {
      id,
      name,
      tag,
      color,
      leaderUid,
      coLeaders: [],
      members: [
        {
          uid: leaderUid,
          displayName: leaderName,
          rank: "boss",
          joinedAt: Date.now(),
        },
      ],
      bankBalance: 0,
      territories: [],
      allies: [],
      enemies: [],
      isLegal: false,
      createdAt: Date.now(),
    };

    await setDoc(doc(db, "factions", id), faction);
    this.factions.set(id, faction);

    return {
      success: true,
      message: `🏴 Faction "${name}" [${tag}] créée! Tu es le Boss.`,
    };
  }

  // ─── Inviter un membre ────────────────────────────────────
  static async invite(
    factionId: FactionId,
    inviterUid: string,
    targetUid: string,
    targetName: string
  ): Promise<{ success: boolean; message: string }> {
    const faction = this.factions.get(factionId);
    if (!faction) return { success: false, message: "❌ Faction introuvable" };

    // Vérifier rang
    const inviter = faction.members.find((m) => m.uid === inviterUid);
    if (
      !inviter ||
      !["boss", "underboss", "captain"].includes(inviter.rank)
    ) {
      return {
        success: false,
        message: "❌ Tu n'as pas le rang pour inviter",
      };
    }

    // Vérifier que le target n'est pas déjà dans une faction
    if (this.getPlayerFaction(targetUid)) {
      return {
        success: false,
        message: "❌ Ce joueur est déjà dans une faction",
      };
    }

    const member: FactionMember = {
      uid: targetUid,
      displayName: targetName,
      rank: "recruit",
      joinedAt: Date.now(),
    };

    faction.members.push(member);
    await updateDoc(doc(db, "factions", factionId), {
      members: faction.members,
    });

    return {
      success: true,
      message: `✅ ${targetName} rejoint ${faction.name} [${faction.tag}]!`,
    };
  }

  // ─── Promouvoir ───────────────────────────────────────────
  static async promote(
    factionId: FactionId,
    promoterUid: string,
    targetUid: string
  ): Promise<{ success: boolean; message: string }> {
    const faction = this.factions.get(factionId);
    if (!faction) return { success: false, message: "❌ Faction introuvable" };

    const rankOrder = ["recruit", "soldier", "captain", "underboss", "boss"];
    const target = faction.members.find((m) => m.uid === targetUid);
    if (!target) return { success: false, message: "❌ Membre introuvable" };

    const currentIdx = rankOrder.indexOf(target.rank);
    if (currentIdx >= rankOrder.length - 2) {
      return { success: false, message: "❌ Rang maximum atteint" };
    }

    target.rank = rankOrder[currentIdx + 1] as FactionMember["rank"];
    await updateDoc(doc(db, "factions", factionId), {
      members: faction.members,
    });

    return {
      success: true,
      message: `⬆️ ${target.displayName} promu: ${target.rank}`,
    };
  }

  // ─── Capturer un territoire ───────────────────────────────
  static async captureTerritory(
    factionId: FactionId,
    territoryId: string,
    attackingMembers: string[]
  ): Promise<{ success: boolean; message: string }> {
    const faction = this.factions.get(factionId);
    if (!faction) return { success: false, message: "❌ Faction introuvable" };

    if (attackingMembers.length < 3) {
      return {
        success: false,
        message: "❌ Minimum 3 membres pour capturer un territoire!",
      };
    }

    // Trouver le territoire
    let territory: TerritoryZone | undefined;
    let ownerFaction: Faction | undefined;

    for (const [, f] of this.factions) {
      const t = f.territories.find((t) => t.id === territoryId);
      if (t) {
        territory = t;
        ownerFaction = f;
        break;
      }
    }

    if (!territory) {
      return { success: false, message: "❌ Territoire inconnu" };
    }

    if (territory.controlledBy === factionId) {
      return { success: false, message: "❌ Tu contrôles déjà ce territoire!" };
    }

    // Début capture (progress → 0 à 100)
    territory.isContested = true;
    territory.captureProgress = 0;

    return {
      success: true,
      message: `⚔️ GUERRE DE TERRITOIRE: ${faction.name} attaque ${territory.name}! Restez dans la zone!`,
    };
  }

  // ─── Getters ──────────────────────────────────────────────
  static getPlayerFaction(uid: string): Faction | undefined {
    for (const [, f] of this.factions) {
      if (f.members.some((m) => m.uid === uid)) return f;
    }
    return undefined;
  }

  static getAll(): Faction[] {
    return [...this.factions.values()];
  }

  static get(id: FactionId): Faction | undefined {
    return this.factions.get(id);
  }
}