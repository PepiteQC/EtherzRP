import { useMemo, useState } from "react";
import { BuilderExport, PlatformObject } from "../types";

type Props = {
  selectedPlatform: PlatformObject | null;
  showPhysics: boolean;
  gridSnap: boolean;
  snapStep: number;
  exportPayload: BuilderExport;
  onSetSnapStep: (value: number) => void;
  onToggleGridSnap: () => void;
  onTogglePhysics: () => void;
  onCreatePlatform: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onUpdateSelected: (patch: Partial<PlatformObject>) => void;
};

export function BuilderPanel({
  selectedPlatform,
  showPhysics,
  gridSnap,
  snapStep,
  exportPayload,
  onSetSnapStep,
  onToggleGridSnap,
  onTogglePhysics,
  onCreatePlatform,
  onDeleteSelected,
  onDuplicateSelected,
  onUpdateSelected
}: Props) {
  const [copied, setCopied] = useState(false);
  const disabled = !selectedPlatform || selectedPlatform.locked;

  const exportJson = useMemo(() => {
    return JSON.stringify(exportPayload, null, 2);
  }, [exportPayload]);

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      console.warn("Clipboard bloqué par le navigateur.");
    }
  }

  return (
    <div className="builder-panel">
      <div className="panel-title">WORLD BUILDER LOCAL — PHASE 2</div>

      <button onClick={onCreatePlatform}>Créer plateforme devant joueur</button>

      <div className="grid-2">
        <button onClick={onToggleGridSnap}>
          Grid snap: {gridSnap ? "ON" : "OFF"}
        </button>

        <button onClick={onTogglePhysics}>
          Physique: {showPhysics ? "ON" : "OFF"}
        </button>
      </div>

      <label className="field">
        <span>Snap step</span>
        <select
          value={snapStep}
          onChange={(event) => onSetSnapStep(Number(event.target.value))}
        >
          <option value={0.25}>0.25 m</option>
          <option value={0.5}>0.5 m</option>
          <option value={1}>1 m</option>
          <option value={2}>2 m</option>
        </select>
      </label>

      <div className="panel-section">
        <div className="label">Sélection</div>
        <div className="selected-name">
          {selectedPlatform ? selectedPlatform.name : "Aucune plateforme"}
        </div>

        {selectedPlatform && (
          <div className="mini-info">
            ID: {selectedPlatform.id}
            <br />
            Pos: {selectedPlatform.position.join(", ")}
            <br />
            Size: {selectedPlatform.size.join(", ")}
            <br />
            Locked: {selectedPlatform.locked ? "oui" : "non"}
          </div>
        )}
      </div>

      <div className="grid-2">
        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              position: [
                selectedPlatform.position[0],
                selectedPlatform.position[1],
                selectedPlatform.position[2] - snapStep
              ]
            });
          }}
        >
          Avancer
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              position: [
                selectedPlatform.position[0],
                selectedPlatform.position[1],
                selectedPlatform.position[2] + snapStep
              ]
            });
          }}
        >
          Reculer
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              position: [
                selectedPlatform.position[0] - snapStep,
                selectedPlatform.position[1],
                selectedPlatform.position[2]
              ]
            });
          }}
        >
          Gauche
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              position: [
                selectedPlatform.position[0] + snapStep,
                selectedPlatform.position[1],
                selectedPlatform.position[2]
              ]
            });
          }}
        >
          Droite
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              rotation: [
                selectedPlatform.rotation[0],
                selectedPlatform.rotation[1] - 0.15,
                selectedPlatform.rotation[2]
              ]
            });
          }}
        >
          Rot Q
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              rotation: [
                selectedPlatform.rotation[0],
                selectedPlatform.rotation[1] + 0.15,
                selectedPlatform.rotation[2]
              ]
            });
          }}
        >
          Rot E
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              size: [
                selectedPlatform.size[0] + snapStep,
                selectedPlatform.size[1],
                selectedPlatform.size[2] + snapStep
              ]
            });
          }}
        >
          Scale +
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              size: [
                Math.max(0.25, selectedPlatform.size[0] - snapStep),
                selectedPlatform.size[1],
                Math.max(0.25, selectedPlatform.size[2] - snapStep)
              ]
            });
          }}
        >
          Scale -
        </button>
      </div>

      <button disabled={disabled} onClick={onDuplicateSelected}>
        Dupliquer sélection
      </button>

      <button className="danger" disabled={disabled} onClick={onDeleteSelected}>
        Supprimer sélection
      </button>

      <div className="shortcuts">
        <strong>Raccourcis</strong>
        <br />
        Clic: sélectionner · G: grid snap · Flèches: déplacer · PageUp/PageDown: hauteur
        <br />
        Q/E: rotation · +/-: scale · [ ]: épaisseur · Ctrl+D: dupliquer · Delete: supprimer
        <br />
        Shift = plus vite · Alt = précision
      </div>

      <button onClick={copyExport}>
        {copied ? "JSON copié" : "Copier export EtherWorld JSON"}
      </button>

      <textarea readOnly value={exportJson} className="export-box" />
    </div>
  );
}
