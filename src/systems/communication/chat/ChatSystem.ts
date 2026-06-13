// src/systems/communication/chat/ChatSystem.ts

import { ChatMessage, ChatChannel } from "../types";
import { v4 as uuid } from "uuid";
import { ChatFilter } from "./ChatFilter";

// Distances par channel (unités Three.js)
const CHANNEL_RANGES: Record<ChatChannel, number> = {
  proximity: 15,
  shout: 50,
  whisper: 3,
  megaphone: 100,
  faction: Infinity,
  job: Infinity,
  radio: Infinity,
  phone: Infinity,
  global: Infinity,
  admin: Infinity,
};

// Préfixes de commandes chat
const CHAT_PREFIXES: Record<string, ChatChannel> = {
  "/me":       "proximity",     // action RP
  "/s":        "shout",         // crier
  "/w":        "whisper",       // chuchoter
  "/r":        "radio",         // radio
  "/f":        "faction",       // faction
  "/j":        "job",           // job
  "/ooc":      "global",        // hors-personnage
  "/mg":       "megaphone",     // mégaphone
  "/sms":      "phone",         // texto
};

export class ChatSystem {
  private static history: ChatMessage[] = [];
  private static readonly MAX_HISTORY = 500;

  // ─── Traiter un message ───────────────────────────────────
  static processMessage(
    raw: string,
    senderUid: string,
    senderName: string,
    senderPos: { x: number; y: number; z: number },
    senderJob: string,
    senderFaction: string | null,
    socket: any,
    allPlayers: Map<string, any>
  ): { success: boolean; message?: ChatMessage; error?: string } {
    // Filtrer le contenu
    const filtered = ChatFilter.filter(raw);
    if (filtered.blocked) {
      return { success: false, error: "🚫 Message bloqué (langage interdit)" };
    }

    // Détecter le channel
    const { channel, content, isAction, targetName } =
      this.parseChannel(filtered.clean);

    // Construire le message
    const msg: ChatMessage = {
      id: uuid(),
      channel,
      senderUid,
      senderName,
      senderJob,
      content,
      timestamp: Date.now(),
      position: senderPos,
      isRP: channel !== "global",
    };

    // Envoyer selon le channel
    switch (channel) {
      case "proximity":
      case "shout":
      case "whisper":
      case "megaphone":
        this.sendProximity(msg, allPlayers, socket);
        break;

      case "faction":
        this.sendFaction(msg, senderFaction, socket);
        break;

      case "job":
        this.sendJob(msg, senderJob, allPlayers, socket);
        break;

      case "radio":
        this.sendRadio(msg, socket);
        break;

      case "phone":
        this.sendPhone(msg, targetName ?? "", allPlayers, socket);
        break;

      case "global":
        this.sendGlobal(msg, socket);
        break;

      case "admin":
        // Géré par la console admin
        break;
    }

    // Historique
    this.history.push(msg);
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(-this.MAX_HISTORY);
    }

    return { success: true, message: msg };
  }

  // ─── Parser le channel depuis le préfixe ──────────────────
  private static parseChannel(raw: string): {
    channel: ChatChannel;
    content: string;
    isAction: boolean;
    targetName?: string;
  } {
    const trimmed = raw.trim();

    // /me action
    if (trimmed.startsWith("/me ")) {
      return {
        channel: "proximity",
        content: `*${trimmed.slice(4)}*`,       // italique RP
        isAction: true,
      };
    }

    // /sms joueur message
    if (trimmed.startsWith("/sms ")) {
      const parts = trimmed.slice(5).split(" ");
      const target = parts[0];
      const message = parts.slice(1).join(" ");
      return {
        channel: "phone",
        content: message,
        isAction: false,
        targetName: target,
      };
    }

    // Autres préfixes
    for (const [prefix, ch] of Object.entries(CHAT_PREFIXES)) {
      if (trimmed.startsWith(prefix + " ")) {
        return {
          channel: ch,
          content: trimmed.slice(prefix.length + 1),
          isAction: false,
        };
      }
    }

    // Par défaut → proximity
    return {
      channel: "proximity",
      content: trimmed,
      isAction: false,
    };
  }

  // ─── Envoi par proximité ──────────────────────────────────
  private static sendProximity(
    msg: ChatMessage,
    allPlayers: Map<string, any>,
    socket: any
  ): void {
    const range = CHANNEL_RANGES[msg.channel];
    const pos = msg.position!;

    for (const [uid, player] of allPlayers) {
      const pp = player.position;
      const dx = pp.x - pos.x;
      const dz = pp.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= range) {
        // Atténuation du son/texte basée sur la distance
        const opacity = Math.max(0.3, 1 - dist / range);
        socket.to(uid).emit("chat:message", {
          ...msg,
          opacity,
          distance: dist,
        });
      }
    }
  }

  // ─── Envoi faction ────────────────────────────────────────
  private static sendFaction(
    msg: ChatMessage,
    factionId: string | null,
    socket: any
  ): void {
    if (!factionId) return;
    socket.to(`faction:${factionId}`).emit("chat:message", {
      ...msg,
      channelLabel: "FACTION",
    });
  }

  // ─── Envoi job ────────────────────────────────────────────
  private static sendJob(
    msg: ChatMessage,
    jobId: string,
    allPlayers: Map<string, any>,
    socket: any
  ): void {
    socket.to(`job:${jobId}`).emit("chat:message", {
      ...msg,
      channelLabel: "JOB",
    });
  }

  // ─── Envoi radio ──────────────────────────────────────────
  private static sendRadio(msg: ChatMessage, socket: any): void {
    const freq = msg.radioFrequency ?? 100.0;
    socket.to(`radio:${freq}`).emit("chat:message", {
      ...msg,
      channelLabel: `📻 ${freq} MHz`,
    });
  }

  // ─── Envoi phone (privé) ──────────────────────────────────
  private static sendPhone(
    msg: ChatMessage,
    targetName: string,
    allPlayers: Map<string, any>,
    socket: any
  ): void {
    for (const [uid, player] of allPlayers) {
      if (
        player.displayName.toLowerCase() === targetName.toLowerCase()
      ) {
        socket.to(uid).emit("chat:message", {
          ...msg,
          channelLabel: "📱 SMS",
        });
        // Aussi envoyer au sender comme confirmation
        socket.to(msg.senderUid).emit("chat:message", {
          ...msg,
          content: `→ ${targetName}: ${msg.content}`,
          channelLabel: "📱 SMS envoyé",
        });
        return;
      }
    }
  }

  // ─── Envoi global (OOC) ───────────────────────────────────
  private static sendGlobal(msg: ChatMessage, socket: any): void {
    socket.emit("chat:message", {
      ...msg,
      channelLabel: "🌐 OOC",
    });
  }
}