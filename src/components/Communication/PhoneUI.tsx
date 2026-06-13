// src/components/Communication/PhoneUI.tsx
"use client";

import React, { useState } from "react";
import { PhoneSystem } from "@/systems/communication/phone/PhoneSystem";
import styles from "./PhoneUI.module.css";

type PhoneApp = "home" | "contacts" | "messages" | "dialer" | "bank" | "maps";

interface Props {
  playerUid: string;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
  socket: any;
  allPlayers: Map<string, any>;
}

export default function PhoneUI({
  playerUid,
  playerName,
  isOpen,
  onClose,
  socket,
  allPlayers,
}: Props) {
  const [app, setApp] = useState<PhoneApp>("home");
  const [dialNumber, setDialNumber] = useState("");
  const [smsTo, setSmsTo] = useState("");
  const [smsContent, setSmsContent] = useState("");

  if (!isOpen) return null;

  return (
    <div className={styles.phoneOverlay}>
      <div className={styles.phone}>
        {/* Notch */}
        <div className={styles.notch}>
          <span className={styles.time}>
            {new Date().toLocaleTimeString("fr-CA", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className={styles.carrier}>ETHER•MOBILE</span>
          <span className={styles.battery}>🔋 87%</span>
        </div>

        {/* Screen */}
        <div className={styles.screen}>
          {/* ── HOME ── */}
          {app === "home" && (
            <div className={styles.homeGrid}>
              <button onClick={() => setApp("dialer")} className={styles.appIcon}>
                📞<br />Téléphone
              </button>
              <button onClick={() => setApp("contacts")} className={styles.appIcon}>
                👥<br />Contacts
              </button>
              <button onClick={() => setApp("messages")} className={styles.appIcon}>
                💬<br />Messages
              </button>
              <button onClick={() => setApp("bank")} className={styles.appIcon}>
                🏦<br />Banque
              </button>
              <button onClick={() => setApp("maps")} className={styles.appIcon}>
                🗺️<br />Maps
              </button>
              <button
                onClick={() => {
                  PhoneSystem.call(
                    playerUid,
                    playerName,
                    "911",
                    allPlayers,
                    socket
                  );
                }}
                className={`${styles.appIcon} ${styles.emergency}`}
              >
                🚨<br />911
              </button>
            </div>
          )}

          {/* ── DIALER ── */}
          {app === "dialer" && (
            <div className={styles.dialer}>
              <input
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                placeholder="514-xxx-xxxx"
                className={styles.dialInput}
              />
              <div className={styles.numpad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((n) => (
                  <button
                    key={n}
                    className={styles.numKey}
                    onClick={() => setDialNumber((p) => p + n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                className={styles.callBtn}
                onClick={async () => {
                  await PhoneSystem.call(
                    playerUid,
                    playerName,
                    dialNumber,
                    allPlayers,
                    socket
                  );
                }}
              >
                📞 Appeler
              </button>
            </div>
          )}

          {/* ── MESSAGES ── */}
          {app === "messages" && (
            <div className={styles.smsApp}>
              <input
                value={smsTo}
                onChange={(e) => setSmsTo(e.target.value)}
                placeholder="Nom du joueur"
                className={styles.smsInput}
              />
              <textarea
                value={smsContent}
                onChange={(e) => setSmsContent(e.target.value)}
                placeholder="Message..."
                className={styles.smsTextarea}
              />
              <button
                className={styles.sendBtn}
                onClick={async () => {
                  // Trouver le uid du joueur par son nom
                  for (const [uid, p] of allPlayers) {
                    if (
                      p.displayName.toLowerCase() ===
                      smsTo.toLowerCase()
                    ) {
                      await PhoneSystem.sendSMS(
                        playerUid,
                        playerName,
                        uid,
                        smsContent,
                        socket
                      );
                      setSmsContent("");
                      break;
                    }
                  }
                }}
              >
                📤 Envoyer
              </button>
            </div>
          )}

          {/* ── BANK ── */}
          {app === "bank" && (
            <div className={styles.bankApp}>
              <h3>🏦 Banque ETHERWORLD</h3>
              <p>Solde: $12,450.00</p>
              <button className={styles.bankBtn}>Retirer</button>
              <button className={styles.bankBtn}>Déposer</button>
              <button className={styles.bankBtn}>Transférer</button>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          <button onClick={() => setApp("home")} className={styles.homeBtn}>
            ⬛
          </button>
          <button onClick={onClose} className={styles.homeBtn}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}