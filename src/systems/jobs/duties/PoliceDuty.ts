// src/systems/jobs/duties/PoliceDuty.ts

import { db } from "@/lib/firebase/config";
import {
  doc, setDoc, updateDoc, getDoc,
  collection, addDoc, serverTimestamp, increment,
} from "firebase/firestore";
import {
  CrimeType, CrimeRecord, WantedLevel,
  ArrestRecord, EtherworldPlayer,
} from "../types";
import { AdminLogger } from "@/lib/firebase/adminLogger";

// ─── Catalogue des crimes ─────────────────────────────────
const CRIME_CATALOG: Record<CrimeType, CrimeRecord> = {
  speeding: {
    id: "speeding",
    crimeType: "speeding",
    label: "Excès de vitesse",
    fine: 250,
    jailTime: 0,
    wantedStars: 1,
  },
  reckless_driving: {
    id: "reckless_driving",
    crimeType: "reckless_driving",
    label: "Conduite dangereuse",
    fine: 500,
    jailTime: 5,
    wantedStars: 1,
  },
  assault: {
    id: "assault",
    crimeType: "assault",
    label: "Voies de fait",
    fine: 1000,
    jailTime: 15,
    wantedStars: 2,
  },
  murder: {
    id: "murder",
    crimeType: "murder",
    label: "Meurtre",
    fine: 5000,
    jailTime: 60,
    wantedStars: 4,
  },
  robbery: {
    id: "robbery",
    crimeType: "robbery",
    label: "Vol qualifié",
    fine: 3000,
    jailTime: 30,
    wantedStars: 3,
  },
  drug_possession: {
    id: "drug_possession",
    crimeType: "drug_possession",
    label: "Possession de drogue",
    fine: 1500,
    jailTime: 10,
    wantedStars: 2,
  },
  drug_trafficking: {
    id: "drug_trafficking",
    crimeType: "drug_trafficking",
    label: "Trafic de drogue",
    fine: 5000,
    jailTime: 45,
    wantedStars: 3,
  },
  weapon_illegal: {
    id: "weapon_illegal",
    crimeType: "weapon_illegal",
    label: "Port d'arme illégal",
    fine: 2000,
    jailTime: 20,
    wantedStars: 2,
  },
  trespassing: {
    id: "trespassing",
    crimeType: "trespassing",
    label: "Intrusion",
    fine: 500,
    jailTime: 5,
    wantedStars: 1,
  },
  resisting_arrest: {
    id: "resisting_arrest",
    crimeType: "resisting_arrest",
    label: "Résistance à l'arrestation",
    fine: 2000,
    jailTime: 15,
    wantedStars: 2,
  },
  jailbreak: {
    id: "jailbreak",
    crimeType: "jailbreak",
    label: "Évasion de prison",
    fine: 10000,
    jailTime: 120,
    wantedStars: 5,
  },
  fraud: {
    id: "fraud",
    crimeType: "fraud",
    label: "Fraude",
    fine: 3000,
    jailTime: 20,
    wantedStars: 2,
  },
};

export class PoliceDuty {
  // ─── Wanted system local ──────────────────────────────────
  private static wantedPlayers: Map<string, WantedLevel> = new Map();

  // ─── Ajouter une infraction ───────────────────────────────
  static async addCharge(
    officerUid: string,
    officerName: string,
    suspectUid: string,
    suspectName: string,
    crimeType: CrimeType,
    socket: any
  ): Promise<{ success: boolean; message: string }> {
    const crime = CRIME_CATALOG[crimeType];
    if (!crime) {
      return { success: false, message: `❌ Crime "${crimeType}" inconnu` };
    }

    // Charge le wanted actuel ou crée
    let wanted = this.wantedPlayers.get(suspectUid) ?? {
      uid: suspectUid,
      displayName: suspectName,
      stars: 0,
      crimes: [],
      totalFines: 0,
      isArrested: false,
      isPrisoner: false,
      prisonReleaseAt: null,
    };

    // Ajouter le crime
    wanted.crimes.push(crime);
    wanted.totalFines += crime.fine;
    wanted.stars = Math.min(5, Math.max(wanted.stars, crime.wantedStars));

    this.wantedPlayers.set(suspectUid, wanted);

    // Firebase
    await setDoc(doc(db, "wanted", suspectUid), wanted);

    // Notifier le suspect
    socket.to(suspectUid).emit("police:charged", {
      crime: crime.label,
      fine: crime.fine,
      stars: wanted.stars,
      officer: officerName,
    });

    // Broadcast radio police
    socket.to("radio:100.1").emit("radio:message", {
      from: officerName,
      message: `📋 Infraction: ${crime.label} contre ${suspectName} | ⭐${wanted.stars}`,
      frequency: 100.1,
    });

    return {
      success: true,
      message: `📋 ${crime.label} ajouté à ${suspectName} | Amende: $${crime.fine} | ⭐${wanted.stars}`,
    };
  }

  // ─── Menottage ────────────────────────────────────────────
  static async handcuff(
    officerUid: string,
    suspectUid: string,
    suspectPos: { x: number; y: number; z: number },
    officerPos: { x: number; y: number; z: number },
    socket: any
  ): Promise<{ success: boolean; message: string }> {
    // Vérifier distance (doit être proche)
    const dx = suspectPos.x - officerPos.x;
    const dz = suspectPos.z - officerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 5) {
      return {
        success: false,
        message: "❌ Trop loin pour menotter! Rapproche-toi.",
      };
    }

    // Notifier le suspect → bloquer ses mouvements
    socket.to(suspectUid).emit("police:handcuffed", {
      officerUid,
      locked: true,
    });

    return {
      success: true,
      message: "🔗 Suspect menotté!",
    };
  }

  // ─── Arrestation complète ─────────────────────────────────
  static async arrest(
    officerUid: string,
    officerName: string,
    suspectUid: string,
    suspectName: string,
    socket: any
  ): Promise<{ success: boolean; message: string }> {
    const wanted = this.wantedPlayers.get(suspectUid);
    if (!wanted || wanted.crimes.length === 0) {
      return {
        success: false,
        message: "❌ Aucune charge contre ce suspect",
      };
    }

    // Calculer peine totale
    const totalJail = wanted.crimes.reduce((sum, c) => sum + c.jailTime, 0);
    const totalFine = wanted.totalFines;

    wanted.isArrested = true;
    wanted.isPrisoner = true;
    wanted.prisonReleaseAt = Date.now() + totalJail * 60 * 1000;

    // Firebase — dossier d'arrestation
    const record: ArrestRecord = {
      id: `arrest_${Date.now()}`,
      suspectUid,
      suspectName,
      officerUid,
      officerName,
      charges: wanted.crimes,
      totalFine,
      jailTime: totalJail,
      timestamp: Date.now(),
    };

    await addDoc(collection(db, "arrests"), record);
    await setDoc(doc(db, "wanted", suspectUid), wanted);

    // Déduire l'amende du compte du suspect
    await updateDoc(doc(db, "players", suspectUid), {
      bankBalance: increment(-totalFine),
    });

    // Téléporter en prison
    const PRISON_POS = { x: -500, y: 0, z: -500 };
    socket.to(suspectUid).emit("admin:teleport", { position: PRISON_POS });
    socket.to(suspectUid).emit("police:arrested", {
      jailTime: totalJail,
      fine: totalFine,
      charges: wanted.crimes.map((c) => c.label),
      releaseAt: wanted.prisonReleaseAt,
    });

    // Broadcast
    socket.emit("chat:broadcast", {
      msg: `🚔 ${suspectName} a été arrêté par ${officerName} | ${totalJail}min de prison | $${totalFine} d'amendes`,
      system: true,
    });

    // Compteur d'arrestations pour l'officier
    await updateDoc(doc(db, "player_jobs", officerUid), {
      arrestCount: increment(1),
    });

    // Programmer la libération automatique
    setTimeout(async () => {
      await this.releaseFromPrison(suspectUid, socket);
    }, totalJail * 60 * 1000);

    // Reset wanted
    this.wantedPlayers.delete(suspectUid);

    return {
      success: true,
      message: `🚔 ${suspectName} arrêté! Prison: ${totalJail}min | Amendes: $${totalFine}`,
    };
  }

  // ─── Libération de prison ─────────────────────────────────
  static async releaseFromPrison(uid: string, socket: any): Promise<void> {
    await updateDoc(doc(db, "wanted", uid), {
      isArrested: false,
      isPrisoner: false,
      prisonReleaseAt: null,
      crimes: [],
      totalFines: 0,
      stars: 0,
    });

    const RELEASE_POS = { x: -490, y: 0, z: -490 }; // Devant la prison
    socket.to(uid).emit("admin:teleport", { position: RELEASE_POS });
    socket.to(uid).emit("police:released", {
      message: "🆓 Tu as été libéré de prison!",
    });
  }

  // ─── Fouille ──────────────────────────────────────────────
  static async frisk(
    officerUid: string,
    suspectUid: string,
    socket: any
  ): Promise<{ success: boolean; message: string; illegalItems: string[] }> {
    // Lire l'inventaire du suspect depuis Firebase
    const invRef = doc(db, "inventories", suspectUid);
    const invSnap = await getDoc(invRef);
    const inventory = invSnap.exists() ? invSnap.data() : { items: [] };

    const illegalItems = (inventory.items || []).filter(
      (item: any) => item.isIllegal
    );

    if (illegalItems.length === 0) {
      return {
        success: true,
        message: "🔍 Fouille: aucun objet illégal trouvé",
        illegalItems: [],
      };
    }

    const itemNames = illegalItems.map((i: any) => i.name);
    return {
      success: true,
      message: `🔍 OBJETS ILLÉGAUX TROUVÉS:\n${itemNames.map((n: string) => `  🚫 ${n}`).join("\n")}`,
      illegalItems: itemNames,
    };
  }

  // ─── Getter wanted ────────────────────────────────────────
  static getWanted(uid: string): WantedLevel | undefined {
    return this.wantedPlayers.get(uid);
  }

  static getAllWanted(): WantedLevel[] {
    return [...this.wantedPlayers.values()].filter((w) => w.stars > 0);
  }

  static getCrimeCatalog(): Record<string, CrimeRecord> {
    return CRIME_CATALOG;
  }
}