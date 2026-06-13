// src/systems/communication/phone/PhoneSystem.ts

import { db } from "@/lib/firebase/config";
import {
  doc, setDoc, getDoc, updateDoc,
  collection, addDoc, query, where,
  getDocs, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { PhoneContact, PhoneMessage, PhoneState } from "../types";
import { v4 as uuid } from "uuid";

export class PhoneSystem {
  private static phones: Map<string, PhoneState> = new Map();

  // ─── Générer un numéro de téléphone RP ────────────────────
  static generateNumber(): string {
    const area = ["514", "418", "450", "819", "438"][
      Math.floor(Math.random() * 5)
    ];
    const mid = String(Math.floor(Math.random() * 900) + 100);
    const end = String(Math.floor(Math.random() * 9000) + 1000);
    return `${area}-${mid}-${end}`;
  }

  // ─── Initialiser le téléphone d'un joueur ─────────────────
  static async initPhone(uid: string): Promise<PhoneState> {
    const ref = doc(db, "phones", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const state = snap.data() as PhoneState;
      this.phones.set(uid, state);
      return state;
    }

    const state: PhoneState = {
      isOpen: false,
      inCall: false,
      callingUid: null,
      callStartTime: null,
      contacts: [
        { uid: "911", name: "🚨 911", number: "911", isFavorite: true },
        { uid: "taxi", name: "🚕 Taxi", number: "555-TAXI", isFavorite: true },
        { uid: "mechanic", name: "🔧 Mécano", number: "555-AUTO", isFavorite: true },
      ],
      messages: [],
    };

    await setDoc(ref, state);
    this.phones.set(uid, state);
    return state;
  }

  // ─── Appeler quelqu'un ────────────────────────────────────
  static async call(
    callerUid: string,
    callerName: string,
    targetNumber: string,
    allPlayers: Map<string, any>,
    socket: any
  ): Promise<{ success: boolean; message: string }> {
    // Trouver le joueur par numéro de téléphone
    let targetUid: string | null = null;
    let targetName: string | null = null;

    // Services spéciaux
    if (targetNumber === "911") {
      socket.to("job:police").emit("dispatch:call", {
        type: "911",
        callerName,
        callerUid,
        timestamp: Date.now(),
      });
      socket.to("job:ambulance").emit("dispatch:call", {
        type: "911",
        callerName,
        callerUid,
        timestamp: Date.now(),
      });
      return {
        success: true,
        message: "📞 Appel 911 envoyé — Police et Ambulance alertées!",
      };
    }

    // Chercher par numéro dans Firebase
    const q = query(
      collection(db, "phones"),
      where("number", "==", targetNumber)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      targetUid = snap.docs[0].id;
    }

    if (!targetUid) {
      return { success: false, message: "❌ Numéro introuvable" };
    }

    // Mettre les deux en appel
    const callerState = this.phones.get(callerUid);
    const targetState = this.phones.get(targetUid);

    if (callerState) {
      callerState.inCall = true;
      callerState.callingUid = targetUid;
      callerState.callStartTime = Date.now();
    }

    // Notifier le destinataire
    socket.to(targetUid).emit("phone:incoming", {
      callerUid,
      callerName,
      callerNumber: callerState ? "Inconnu" : "Inconnu",
    });

    return {
      success: true,
      message: `📞 Appel en cours...`,
    };
  }

  // ─── Envoyer un SMS ───────────────────────────────────────
  static async sendSMS(
    fromUid: string,
    fromName: string,
    toUid: string,
    content: string,
    socket: any
  ): Promise<{ success: boolean; message: string }> {
    const sms: PhoneMessage = {
      id: uuid(),
      fromUid,
      fromName,
      toUid,
      content,
      timestamp: Date.now(),
      isRead: false,
    };

    // Sauvegarder Firebase
    await addDoc(collection(db, "sms"), sms);

    // Notifier le destinataire
    socket.to(toUid).emit("phone:sms", sms);

    return {
      success: true,
      message: `📱 SMS envoyé à ${toUid}`,
    };
  }

  // ─── Raccrocher ───────────────────────────────────────────
  static hangup(uid: string, socket: any): void {
    const state = this.phones.get(uid);
    if (!state || !state.inCall) return;

    const otherUid = state.callingUid;

    // Reset les deux
    state.inCall = false;
    state.callingUid = null;
    state.callStartTime = null;

    if (otherUid) {
      const otherState = this.phones.get(otherUid);
      if (otherState) {
        otherState.inCall = false;
        otherState.callingUid = null;
        otherState.callStartTime = null;
      }
      socket.to(otherUid).emit("phone:hangup", { by: uid });
    }
  }
}