/**
 * AuditDashboard.tsx
 * ----------------------------------------------------------------------------
 * Dashboard d'audit ADMIN IN-GAME (React + Tailwind), cohérent avec la console.
 *
 *  - Cartes de stats (total, succès, échecs, taux)
 *  - Filtres (admin, commande, statut, recherche)
 *  - Tableau des logs avec coloration
 *  - Mini-graphe d'activité par commande (barres en SVG inline)
 *  - Boutons d'export (JSON / CSV) et de rapport
 *
 * Ce dashboard se branche sur un AdminConsoleManager (ou n'importe quelle
 * source qui fournit getLogs/getStats/export...). Il NE gère PAS le login :
 * c'est un panneau d'administration interne à EtherWorld RP.
 * ----------------------------------------------------------------------------
 */

import React, { useMemo, useState } from "react";
import type { CommandLog, LogStats } from "../console/CommandLogger";

/** Source de données minimale attendue (le manager l'implémente). */
export interface AuditDataSource {
  getLogs: (filter?: any) => CommandLog[];
  getStats: (filter?: any) => LogStats;
  exportLogs: () => string;
  exportLogsCSV: () => string;
  generateReport: () => string;
}

export interface AuditDashboardProps {
  source: AuditDataSource;
  /** Rafraîchissement manuel (clé qui change pour re-render). */
  refreshKey?: number;
}

/** Hook : dérive les données filtrées + listes d'options. */
export function useAuditData(source: AuditDataSource, refreshKey = 0) {
  const all = useMemo(() => source.getLogs(), [source, refreshKey]);
  const stats = useMemo(() => source.getStats(), [source, refreshKey]);
  const admins = useMemo(
    () => Array.from(new Set(all.map((l) => l.adminName))).sort(),
    [all]
  );
  const commands = useMemo(
    () => Array.from(new Set(all.map((l) => l.commandName))).sort(),
    [all]
  );
  return { all, stats, admins, commands };
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const StatCard: React.FC<{ label: string; value: string; accent: string }> = ({
  label,
  value,
  accent,
}) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
    <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
    <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
  </div>
);

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  source,
  refreshKey = 0,
}) => {
  const { all, stats, admins, commands } = useAuditData(source, refreshKey);

  const [admin, setAdmin] = useState("");
  const [command, setCommand] = useState("");
  const [status, setStatus] = useState<"" | "success" | "fail">("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return all
      .filter((l) => (admin ? l.adminName === admin : true))
      .filter((l) => (command ? l.commandName === command : true))
      .filter((l) =>
        status === "" ? true : status === "success" ? l.success : !l.success
      )
      .filter((l) =>
        search
          ? (l.rawCommand + " " + l.message + " " + (l.target ?? ""))
              .toLowerCase()
              .includes(search.toLowerCase())
          : true
      )
      .slice()
      .reverse();
  }, [all, admin, command, status, search]);

  // Top commandes pour le mini-graphe.
  const topCommands = useMemo(() => {
    const entries = Object.entries(stats.byCommand).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 8);
  }, [stats]);
  const maxCount = topCommands[0]?.[1] ?? 1;

  return (
    <div className="min-h-screen bg-zinc-950 p-6 font-sans text-zinc-200">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* En-tête */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              🛡️ EtherWorld — Audit Admin
            </h1>
            <p className="text-sm text-zinc-500">
              Journal des actions administrateur · {all.length} entrées
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => download("admin_logs.json", source.exportLogs(), "application/json")}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
            >
              ⬇ JSON
            </button>
            <button
              onClick={() => download("admin_logs.csv", source.exportLogsCSV(), "text/csv")}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
            >
              ⬇ CSV
            </button>
            <button
              onClick={() => download("audit_report.txt", source.generateReport(), "text/plain")}
              className="rounded-lg border border-emerald-700 bg-emerald-700/30 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-700/50"
            >
              📄 Rapport
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={String(stats.total)} accent="text-zinc-100" />
          <StatCard label="Succès" value={String(stats.successCount)} accent="text-emerald-400" />
          <StatCard label="Échecs" value={String(stats.failureCount)} accent="text-red-400" />
          <StatCard
            label="Taux succès"
            value={`${(stats.successRate * 100).toFixed(0)}%`}
            accent="text-sky-400"
          />
        </section>

        {/* Graphe + Filtres */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Commandes les plus utilisées
            </h2>
            <div className="space-y-2">
              {topCommands.map(([name, count]) => (
                <div key={name} className="flex items-center gap-2 text-sm">
                  <span className="w-24 truncate text-zinc-400">{name}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-zinc-800">
                    <div
                      className="h-full rounded bg-gradient-to-r from-sky-500 to-emerald-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-zinc-400">{count}</span>
                </div>
              ))}
              {topCommands.length === 0 && (
                <p className="text-sm text-zinc-600">Aucune donnée.</p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Filtres
            </h2>
            <select
              value={admin}
              onChange={(e) => setAdmin(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm"
            >
              <option value="">Tous les admins</option>
              {admins.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm"
            >
              <option value="">Toutes les commandes</option>
              {commands.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="success">Succès</option>
              <option value="fail">Échec</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm outline-none placeholder-zinc-600"
            />
          </div>
        </section>

        {/* Tableau */}
        <section className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-3 py-2">Heure</th>
                <th className="px-3 py-2">Admin</th>
                <th className="px-3 py-2">Commande</th>
                <th className="px-3 py-2">Cible</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                    {new Date(l.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{l.adminName}</td>
                  <td className="px-3 py-2 font-mono text-sky-300">{l.commandName}</td>
                  <td className="px-3 py-2 text-zinc-400">{l.target ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        l.success
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {l.success ? "OK" : "FAIL"}
                    </span>
                  </td>
                  <td className="max-w-md truncate px-3 py-2 text-zinc-400" title={l.message}>
                    {l.message}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-600">
                    Aucun log ne correspond aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default AuditDashboard;
