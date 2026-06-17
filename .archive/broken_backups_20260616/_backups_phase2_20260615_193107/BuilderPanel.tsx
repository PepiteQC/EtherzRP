import { PlatformObject } from "../types";

type Props = {
  selectedPlatform: PlatformObject | null;
  showPhysics: boolean;
  onTogglePhysics: () => void;
  onCreatePlatform: () => void;
  onDeleteSelected: () => void;
  onUpdateSelected: (patch: Partial<PlatformObject>) => void;
};

export function BuilderPanel({
  selectedPlatform,
  showPhysics,
  onTogglePhysics,
  onCreatePlatform,
  onDeleteSelected,
  onUpdateSelected
}: Props) {
  const disabled = !selectedPlatform || selectedPlatform.locked;

  return (
    <div className="builder-panel">
      <div className="panel-title">WORLD BUILDER LOCAL</div>

      <button onClick={onCreatePlatform}>Créer plateforme devant joueur</button>

      <button onClick={onTogglePhysics}>
        Debug physique: {showPhysics ? "ON" : "OFF"}
      </button>

      <div className="panel-section">
        <div className="label">Sélection</div>
        <div className="selected-name">
          {selectedPlatform ? selectedPlatform.name : "Aucune plateforme"}
        </div>
      </div>

      <div className="grid-2">
        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              position: [
                selectedPlatform.position[0],
                selectedPlatform.position[1] + 0.25,
                selectedPlatform.position[2]
              ]
            });
          }}
        >
          Monter
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              position: [
                selectedPlatform.position[0],
                selectedPlatform.position[1] - 0.25,
                selectedPlatform.position[2]
              ]
            });
          }}
        >
          Descendre
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              size: [
                selectedPlatform.size[0] + 0.5,
                selectedPlatform.size[1],
                selectedPlatform.size[2] + 0.5
              ]
            });
          }}
        >
          Agrandir
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            if (!selectedPlatform) return;
            onUpdateSelected({
              size: [
                Math.max(0.5, selectedPlatform.size[0] - 0.5),
                selectedPlatform.size[1],
                Math.max(0.5, selectedPlatform.size[2] - 0.5)
              ]
            });
          }}
        >
          Réduire
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
          Rotation
        </button>

        <button
          disabled={disabled}
          onClick={() => {
            const colors = ["#00aaff", "#ffcc00", "#7cff6b", "#ff4d6d", "#9b5cff"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            onUpdateSelected({ color });
          }}
        >
          Couleur
        </button>
      </div>

      <button className="danger" disabled={disabled} onClick={onDeleteSelected}>
        Supprimer sélection
      </button>
    </div>
  );
}
