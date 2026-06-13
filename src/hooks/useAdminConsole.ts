// src/hooks/useAdminConsole.ts

import { useState, useCallback, useRef, useEffect } from "react";
import { CommandParser }     from "@/systems/admin/CommandParser";
import { CommandRegistry }   from "@/systems/admin/CommandRegistry";
import { PermissionSystem }  from "@/systems/admin/PermissionSystem";
import type { ConsoleLog, EtherworldPlayer, CommandContext } from "@/systems/admin/types";
import { v4 as uuid } from "uuid";

export function useAdminConsole(
  currentPlayer: EtherworldPlayer | null,
  context: CommandContext
) {
  const [logs, setLogs]           = useState<ConsoleLog[]>([]);
  const [isOpen, setIsOpen]       = useState(false);
  const [history, setHistory]     = useState<string[]>([]);
  const [historyIdx, setHistIdx]  = useState(-1);
  const rateLimitRef = useRef<Map<string, number>>(new Map());

  // Raccourci clavier → ` ou F1
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "`" || e.key === "F1") {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const addLog = useCallback((message: string, type: ConsoleLog["type"] = "info") => {
    setLogs((prev) => [
      ...prev.slice(-199), // garde max 200 lignes
      { id: uuid(), timestamp: new Date(), message, type },
    ]);
  }, []);

  const executeCommand = useCallback(
    async (raw: string) => {
      if (!currentPlayer) return;

      const sanitized = CommandParser.sanitize(raw);
      addLog(`> ${sanitized}`, "input");

      // Rate limit (max 5 cmd / 3s)
      const now = Date.now();
      const last = rateLimitRef.current.get(currentPlayer.uid) ?? 0;
      if (now - last < 600) {
        addLog("⚠️ Trop vite! Attends un peu...", "warning");
        return;
      }
      rateLimitRef.current.set(currentPlayer.uid, now);

      const parsed = CommandParser.parse(sanitized);
      if (!parsed) return;

      // Permission check
      const role = await PermissionSystem.getPlayerRole(currentPlayer.uid);
      const cmd  = CommandRegistry.get(parsed.verb);

      if (!cmd) {
        addLog(`❌ Commande inconnue: "${parsed.verb}". Tape "help" pour la liste.`, "error");
        return;
      }

      if (!PermissionSystem.hasPermission(role, cmd.minRole)) {
        addLog(`🚫 Permission refusée. Rôle requis: ${cmd.minRole}`, "error");
        return;
      }

      // Exécution
      try {
        const result = await cmd.execute(parsed.args, currentPlayer, context);
        addLog(result.message, result.type);
      } catch (err: any) {
        addLog(`💥 Erreur inattendue: ${err.message}`, "error");
      }

      // Historique de navigation (↑ ↓)
      setHistory((h) => [sanitized, ...h.slice(0, 49)]);
      setHistIdx(-1);
    },
    [currentPlayer, context, addLog]
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      setHistIdx((idx) => {
        const next =
          direction === "up"
            ? Math.min(idx + 1, history.length - 1)
            : Math.max(idx - 1, -1);
        return next;
      });
      return direction === "up" ? history[historyIdx + 1] ?? "" : history[historyIdx - 1] ?? "";
    },
    [history, historyIdx]
  );

  return {
    logs,
    isOpen,
    setIsOpen,
    executeCommand,
    navigateHistory,
    clearLogs: () => setLogs([]),
  };
}