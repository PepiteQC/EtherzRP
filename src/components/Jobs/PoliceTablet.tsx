// src/components/Jobs/PoliceTablet.tsx
"use client";

import React, { useState, useEffect } from "react";
import { PoliceDuty } from "@/systems/jobs/duties/PoliceDuty";
import styles from "./PoliceTablet.module.css";

interface Props {
  officerUid: string;
  officerName: string;
  socket: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function PoliceTablet({
  officerUid,
  officerName,
  socket,
  isOpen,
  onClose,
}: Props) {
  const [tab, setTab] = useState<"wanted" | "crimes" | "dispatch">("wanted");
  const [wantedList, setWantedList] = useState(PoliceDuty.getAllWanted());

  useEffect(() => {
    const interval = setInterval(() => {
      setWantedList(PoliceDuty.getAllWanted());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.tablet}>
        {/* Header */}
        <div className={styles.header}>
          <span>🚔 SPVM — Tablette Police</span>
          <span className={styles.officerBadge}>
            Badge #{officerUid.slice(0, 6)} — {officerName}
          </span>
          <button onClick={onClose} className={styles.close}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {(["wanted", "crimes", "dispatch"] as const).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.activeTab : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "wanted" && "🔍 Recherchés"}
              {t === "crimes" && "📋 Code Criminel"}
              {t === "dispatch" && "📻 Dispatch"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {tab === "wanted" && (
            <div>
              <h3>Personnes recherchées</h3>
              {wantedList.length === 0 ? (
                <p className={styles.empty}>🟢 Aucun suspect recherché</p>
              ) : (
                wantedList.map((w) => (
                  <div key={w.uid} className={styles.wantedCard}>
                    <div className={styles.wantedHeader}>
                      <span className={styles.stars}>
                        {"⭐".repeat(w.stars)}
                      </span>
                      <span className={styles.wantedName}>
                        {w.displayName}
                      </span>
                      <span className={styles.fine}>
                        ${w.totalFines}
                      </span>
                    </div>
                    <ul className={styles.charges}>
                      {w.crimes.map((c, i) => (
                        <li key={i}>
                          🚫 {c.label} — ${c.fine} — {c.jailTime}min
                        </li>
                      ))}
                    </ul>
                    <div className={styles.actions}>
                      <button
                        onClick={() => {
                          socket.emit("admin:teleport", {
                            targetUid: officerUid,
                            near: w.uid,
                          });
                        }}
                      >
                        📍 Localiser
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "crimes" && (
            <div>
              <h3>Code criminel ETHERWORLD</h3>
              <table className={styles.crimeTable}>
                <thead>
                  <tr>
                    <th>Crime</th>
                    <th>Amende</th>
                    <th>Prison</th>
                    <th>Étoiles</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(PoliceDuty.getCrimeCatalog()).map((c) => (
                    <tr key={c.id}>
                      <td>{c.label}</td>
                      <td>${c.fine}</td>
                      <td>{c.jailTime}min</td>
                      <td>{"⭐".repeat(c.wantedStars)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "dispatch" && (
            <div>
              <h3>📻 Appels Dispatch</h3>
              <p className={styles.empty}>
                Les alertes 911 apparaîtront ici...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}