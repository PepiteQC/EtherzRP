import { canStartJob, getJobCooldownSec, type ActiveJob } from "../../store/gameState";
import type { DoorZone } from "../../data/quebecBuildings";

interface HUDProps {
  speed: number;
  zone: string;
  mode: "driving" | "walking";
  saveStatus: "saved" | "saving" | "idle";
  money: number;
  activeJob: ActiveJob | null;
  notification: string | null;
  nearBuilding: DoorZone | null;
  interiorPrompt: string | null;
  isInInterior: boolean;
}

export default function HUD({
  speed, zone, mode, saveStatus,
  money, activeJob, notification,
  nearBuilding, interiorPrompt, isInInterior,
}: HUDProps) {
  const kmh = mode === "driving"
    ? Math.round(Math.abs(speed) * 180)
    : Math.round(Math.abs(speed) * 20);

  // Compute building interaction prompt
  let buildingPrompt: string | null = null;
  if (nearBuilding && !isInInterior) {
    if (nearBuilding.hasInterior && nearBuilding.interiorId) {
      buildingPrompt = `E — Entrer dans ${nearBuilding.name}`;
    } else if (nearBuilding.job) {
      const cd = getJobCooldownSec(nearBuilding.job.id);
      if (canStartJob(nearBuilding.job.id)) {
        buildingPrompt = `E — ${nearBuilding.job.title}  +${nearBuilding.job.reward}$ ${nearBuilding.job.emoji}`;
      } else {
        buildingPrompt = `⏳ Disponible dans ${cd}s`;
      }
    }
  }

  const activePrompt = interiorPrompt ?? buildingPrompt;

  return (
    <>
      {/* Top zone indicator */}
      <div style={{
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
        background: "rgba(0,10,20,0.75)", border: "1px solid rgba(60,140,220,0.4)",
        color: "#8ad0ff", padding: "6px 20px", borderRadius: 2,
        fontFamily: "monospace", fontSize: 11, letterSpacing: 4, textTransform: "uppercase",
        backdropFilter: "blur(4px)", whiteSpace: "nowrap",
      }}>
        {isInInterior ? "🏢 INTÉRIEUR" : zone}
      </div>

      {/* Mode badge */}
      <div style={{
        position: "absolute", top: 58, left: "50%", transform: "translateX(-50%)",
        background: isInInterior ? "rgba(40,20,60,0.85)"
          : mode === "walking" ? "rgba(20,80,20,0.8)" : "rgba(10,30,60,0.8)",
        border: `1px solid ${isInInterior ? "rgba(140,60,220,0.5)"
          : mode === "walking" ? "rgba(60,180,60,0.5)" : "rgba(40,100,200,0.4)"}`,
        color: isInInterior ? "#d090ff"
          : mode === "walking" ? "#80ff90" : "#5ab0ff",
        padding: "3px 14px", borderRadius: 2,
        fontFamily: "monospace", fontSize: 9, letterSpacing: 3,
        backdropFilter: "blur(4px)",
      }}>
        {isInInterior ? "🏢 INTÉRIEUR" : mode === "walking" ? "🚶 À PIED" : "🚗 EN VOITURE"}
      </div>

      {/* Building / interior interaction prompt */}
      {activePrompt && (
        <div style={{
          position: "absolute", top: 90, left: "50%", transform: "translateX(-50%)",
          background: "rgba(20,40,20,0.88)", border: "1px solid rgba(80,200,80,0.5)",
          color: "#80ff90", padding: "5px 18px", borderRadius: 2,
          fontFamily: "monospace", fontSize: 10, letterSpacing: 2,
          backdropFilter: "blur(4px)", whiteSpace: "nowrap",
          animation: "fadeIn 0.2s ease",
        }}>
          {activePrompt}
        </div>
      )}

      {/* Money — top right */}
      <div style={{
        position: "absolute", top: 20, right: 20,
        background: "rgba(0,8,18,0.85)", border: "1px solid rgba(200,180,40,0.5)",
        borderRadius: 4, padding: "10px 16px", fontFamily: "monospace",
        backdropFilter: "blur(6px)", textAlign: "center", minWidth: 90,
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#ffd700", lineHeight: 1 }}>
          {money.toLocaleString("fr-CA")}$
        </div>
        <div style={{ fontSize: 8, color: "#aa8a20", letterSpacing: 2, marginTop: 2 }}>
          PORTEFEUILLE
        </div>
      </div>

      {/* Job progress bar — bottom center */}
      {activeJob && (
        <div style={{
          position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,8,18,0.9)", border: "1px solid rgba(80,160,80,0.6)",
          borderRadius: 4, padding: "10px 20px", fontFamily: "monospace",
          backdropFilter: "blur(6px)", minWidth: 220, textAlign: "center",
        }}>
          <div style={{ fontSize: 10, color: "#80d080", letterSpacing: 2, marginBottom: 6 }}>
            {activeJob.emoji} {activeJob.title.toUpperCase()} · +{activeJob.reward}$
          </div>
          <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${Math.round(activeJob.progress * 100)}%`,
              height: "100%",
              background: "linear-gradient(90deg, #30aa40, #80ff80)",
              borderRadius: 3,
              transition: "width 0.1s linear",
            }} />
          </div>
          <div style={{ fontSize: 8, color: "#508050", letterSpacing: 1, marginTop: 4 }}>
            {Math.round(activeJob.progress * 100)}%
          </div>
        </div>
      )}

      {/* Notification toast — center top */}
      {notification && (
        <div style={{
          position: "absolute", top: "35%", left: "50%", transform: "translateX(-50%)",
          background: "rgba(20,60,20,0.92)", border: "1px solid rgba(100,220,100,0.6)",
          color: "#80ff80", padding: "12px 28px", borderRadius: 4,
          fontFamily: "monospace", fontSize: 16, fontWeight: 700, letterSpacing: 3,
          backdropFilter: "blur(8px)", textAlign: "center",
          animation: "fadeIn 0.3s ease",
          pointerEvents: "none",
        }}>
          {notification}
        </div>
      )}

      {/* Speedometer — bottom right */}
      {!isInInterior && (
        <div style={{
          position: "absolute", bottom: 24, right: 24,
          background: "rgba(0,8,18,0.85)", border: "1px solid rgba(40,120,200,0.5)",
          borderRadius: 4, padding: "12px 20px", fontFamily: "monospace",
          backdropFilter: "blur(6px)", textAlign: "center", minWidth: 100,
        }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
            {kmh}
          </div>
          <div style={{ fontSize: 9, color: "#4a8aaa", letterSpacing: 3, marginTop: 2 }}>
            KM/H
          </div>
        </div>
      )}

      {/* Route mini-map — bottom left */}
      {!isInInterior && (
        <div style={{
          position: "absolute", bottom: 24, left: 24,
          background: "rgba(0,8,18,0.85)", border: "1px solid rgba(40,120,200,0.5)",
          borderRadius: 4, padding: "10px 16px", fontFamily: "monospace",
          backdropFilter: "blur(6px)",
        }}>
          <div style={{ fontSize: 9, color: "#4a8aaa", letterSpacing: 2, marginBottom: 4 }}>ROUTE 138</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 9, color: "#3a7aaa" }}>QC</div>
            <div style={{ width: 60, height: 3, background: "linear-gradient(90deg, #2a6aaa, #5aadee)", borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", top: -3, left: "30%", width: 8, height: 8, borderRadius: "50%", background: mode === "walking" ? "#5aff5a" : "#5aff8a", border: "1px solid #2a8a4a" }} />
            </div>
            <div style={{ fontSize: 9, color: "#3a7aaa" }}>T-R</div>
          </div>
        </div>
      )}

      {/* Save status */}
      {saveStatus !== "idle" && (
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(0,10,20,0.8)",
          border: `1px solid ${saveStatus === "saved" ? "rgba(50,180,80,0.5)" : "rgba(200,180,40,0.4)"}`,
          color: saveStatus === "saved" ? "#60e880" : "#e8d060",
          padding: "4px 16px", borderRadius: 2,
          fontFamily: "monospace", fontSize: 9, letterSpacing: 3,
          backdropFilter: "blur(4px)",
        }}>
          {saveStatus === "saving" ? "⏳ SAUVEGARDE..." : "💾 SAUVEGARDÉ"}
        </div>
      )}

      {/* Controls hint — top left */}
      <div style={{
        position: "absolute", top: 20, left: 20,
        background: "rgba(0,8,18,0.7)", border: "1px solid rgba(40,100,160,0.3)",
        borderRadius: 2, padding: "8px 12px", fontFamily: "monospace",
        color: "#3a6a8a", fontSize: 9, letterSpacing: 1, lineHeight: 1.9,
      }}>
        {isInInterior ? (
          <>
            W/S/A/D — Marcher<br />
            <span style={{ color: "#5aaa5a" }}>E — Interagir / Sortir</span>
          </>
        ) : mode === "driving" ? (
          <>
            W/S — Accélérer/Reculer<br />
            A/D — Tourner<br />
            Espace — Freiner<br />
            <span style={{ color: "#5aaa5a" }}>E — Sortir du véhicule</span>
          </>
        ) : (
          <>
            W — Avancer &nbsp; S — Reculer<br />
            A/D — Tourner<br />
            <span style={{ color: "#5aaa5a" }}>E — Entrer / Interagir</span>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </>
  );
}
