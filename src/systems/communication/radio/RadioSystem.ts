// src/systems/communication/radio/RadioSystem.ts

import { RadioState } from "../types";

// Fréquences prédéfinies
export const PRESET_FREQUENCIES: Record<string, number> = {
  "Police SPVM":       100.1,
  "Ambulance":         102.5,
  "Pompiers":          103.0,
  "Mécano":            104.0,
  "Taxi":              105.0,
  "Civil":             106.0,
  "Pêcheurs":          107.0,
  "Bûcherons":         108.0,
  "Mineurs":           109.0,
  "Dispatch":          110.0,
  "Gang (illégal)":    66.6,
  "Marché Noir":       69.0,
};

export class RadioSystem {
  private static playerRadios: Map<string, RadioState> = new Map();

  // ─── Allumer la radio ─────────────────────────────────────
  static turnOn(
    uid: string,
    frequency: number,
    socket: any
  ): { success: boolean; message: string } {
    const state: RadioState = {
      isOn: true,
      frequency,
      volume: 1.0,
      isSpeaking: false,
    };

    this.playerRadios.set(uid, state);

    // Rejoindre la room Socket.io de cette fréquence
    socket.join(`radio:${frequency}`);

    const presetName = Object.entries(PRESET_FREQUENCIES).find(
      ([, f]) => f === frequency
    )?.[0];

    return {
      success: true,
      message: `📻 Radio ON — ${frequency} MHz ${presetName ? `(${presetName})` : ""}`,
    };
  }

  // ─── Éteindre la radio ────────────────────────────────────
  static turnOff(uid: string, socket: any): { success: boolean; message: string } {
    const state = this.playerRadios.get(uid);
    if (!state) return { success: false, message: "⚠️ Radio déjà éteinte" };

    socket.leave(`radio:${state.frequency}`);
    this.playerRadios.delete(uid);

    return { success: true, message: "📻 Radio OFF" };
  }

  // ─── Changer de fréquence ─────────────────────────────────
  static changeFrequency(
    uid: string,
    newFreq: number,
    socket: any
  ): { success: boolean; message: string } {
    const state = this.playerRadios.get(uid);
    if (!state || !state.isOn) {
      return { success: false, message: "❌ Allume ta radio d'abord!" };
    }

    socket.leave(`radio:${state.frequency}`);
    state.frequency = newFreq;
    socket.join(`radio:${newFreq}`);

    this.playerRadios.set(uid, state);

    return {
      success: true,
      message: `📻 Fréquence changée → ${newFreq} MHz`,
    };
  }

  // ─── Parler à la radio (PTT - Push To Talk) ──────────────
  static transmit(
    uid: string,
    senderName: string,
    message: string,
    socket: any
  ): void {
    const state = this.playerRadios.get(uid);
    if (!state || !state.isOn) return;

    socket.to(`radio:${state.frequency}`).emit("radio:message", {
      from: senderName,
      message,
      frequency: state.frequency,
      timestamp: Date.now(),
    });
  }

  static getState(uid: string): RadioState | undefined {
    return this.playerRadios.get(uid);
  }
}