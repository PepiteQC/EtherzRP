// src/components/AdminConsole/AdminConsole.tsx
"use client";

import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useAdminConsole } from "@/hooks/useAdminConsole";
import styles from "./AdminConsole.module.css";
import type { EtherworldPlayer, CommandContext } from "@/systems/admin/types";

interface Props {
  player: EtherworldPlayer;
  context: CommandContext;
}

export default function AdminConsole({ player, context }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const { logs, isOpen, setIsOpen, executeCommand, navigateHistory, clearLogs } =
    useAdminConsole(player, context);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Focus auto quand ouvert
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(input);
      setInput("");
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = navigateHistory("up");
      setInput(prev);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = navigateHistory("down");
      setInput(next);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.console}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.logo}>
            🌌 ETHERWORLD RP — CONSOLE ADMIN
          </span>
          <span className={styles.badge}>
            {player.role.toUpperCase()} — {player.displayName}
          </span>
          <button
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Séparateur */}
        <div className={styles.separator} />

        {/* Output */}
        <div className={styles.output}>
          {logs.length === 0 && (
            <p className={styles.placeholder}>
              🎮 Bienvenue dans la Console Admin d'ETHERWORLD RP Québec!{"\n"}
              Tape{" "}
              <span className={styles.highlight}>"help"</span> pour voir
              les commandes disponibles.
            </p>
          )}
          {logs.map((log) => (
            <div key={log.id} className={`${styles.line} ${styles[log.type]}`}>
              <span className={styles.timestamp}>
                [{log.timestamp.toLocaleTimeString("fr-CA")}]
              </span>{" "}
              <span className={styles.message}>{log.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={styles.inputRow}>
          <span className={styles.prompt}>&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Tape une commande... (ex: help, kick joueur, ban joueur 60 spam)'
            className={styles.input}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className={styles.clearBtn}
            onClick={clearLogs}
            title="Effacer la console"
          >
            🗑️
          </button>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span>` ou F1 = Ouvrir/Fermer</span>
          <span>↑↓ = Historique</span>
          <span>ESC = Fermer</span>
          <span>ETHERWORLD RP 🍁 QUÉBEC</span>
        </div>
      </div>
    </div>
  );
}