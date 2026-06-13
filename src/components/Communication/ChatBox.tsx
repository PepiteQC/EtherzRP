// src/components/Communication/ChatBox.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, ChatChannel } from "@/systems/communication/types";
import styles from "./ChatBox.module.css";

const CHANNEL_COLORS: Record<ChatChannel, string> = {
  proximity: "#ffffff",
  shout: "#ff6b6b",
  whisper: "#aaa",
  faction: "#ff9f43",
  job: "#54a0ff",
  radio: "#5f27cd",
  phone: "#10ac84",
  megaphone: "#feca57",
  global: "#c8d6e5",
  admin: "#ee5a24",
};

const CHANNEL_LABELS: Record<ChatChannel, string> = {
  proximity: "",
  shout: "[CRIER]",
  whisper: "[Chuchoter]",
  faction: "[FACTION]",
  job: "[JOB]",
  radio: "[📻 RADIO]",
  phone: "[📱]",
  megaphone: "[📢 MÉGA]",
  global: "[OOC]",
  admin: "[ADMIN]",
};

interface Props {
  messages: ChatMessage[];
  onSend: (raw: string) => void;
  playerName: string;
}

export default function ChatBox({ messages, onSend, playerName }: Props) {
  const [input, setInput] = useState("");
  const [activeChannel, setActiveChannel] = useState<ChatChannel>("proximity");
  const [isExpanded, setIsExpanded] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-masquer après 10s sans activité
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 15000);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Ajouter le préfixe automatiquement selon le channel actif
    let fullMessage = input;
    if (activeChannel === "shout" && !input.startsWith("/s ")) {
      fullMessage = `/s ${input}`;
    }
    if (activeChannel === "whisper" && !input.startsWith("/w ")) {
      fullMessage = `/w ${input}`;
    }
    if (activeChannel === "faction" && !input.startsWith("/f ")) {
      fullMessage = `/f ${input}`;
    }
    if (activeChannel === "radio" && !input.startsWith("/r ")) {
      fullMessage = `/r ${input}`;
    }
    if (activeChannel === "global" && !input.startsWith("/ooc ")) {
      fullMessage = `/ooc ${input}`;
    }

    onSend(fullMessage);
    setInput("");
  };

  return (
    <div
      className={`${styles.chatbox} ${isVisible ? styles.visible : styles.faded}`}
      onMouseEnter={() => setIsVisible(true)}
    >
      {/* Channel selector */}
      <div className={styles.channels}>
        {(
          [
            "proximity",
            "shout",
            "whisper",
            "faction",
            "job",
            "radio",
            "global",
          ] as ChatChannel[]
        ).map((ch) => (
          <button
            key={ch}
            className={`${styles.channelBtn} ${activeChannel === ch ? styles.activeChannel : ""}`}
            style={{ color: CHANNEL_COLORS[ch] }}
            onClick={() => setActiveChannel(ch)}
          >
            {ch === "proximity"
              ? "Local"
              : ch.charAt(0).toUpperCase() + ch.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={styles.msgLine}
            style={{
              color: CHANNEL_COLORS[msg.channel],
              opacity: (msg as any).opacity ?? 1,
            }}
          >
            <span className={styles.label}>
              {CHANNEL_LABELS[msg.channel]}
            </span>{" "}
            <span className={styles.sender}>{msg.senderName}:</span>{" "}
            <span className={styles.content}>{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputRow}>
        <span
          className={styles.channelIndicator}
          style={{ color: CHANNEL_COLORS[activeChannel] }}
        >
          [{activeChannel}]
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Écrire un message..."
          className={styles.input}
        />
      </div>

      {/* Aide rapide */}
      <div className={styles.helpLine}>
        /me action • /s crier • /w chuchoter • /f faction • /r radio •
        /ooc global • /sms joueur msg
      </div>
    </div>
  );
}