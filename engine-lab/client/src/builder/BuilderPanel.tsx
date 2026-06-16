import type { WorldObject, WorldObjectType } from "../types";

const TYPES: WorldObjectType[] = [
  "platform",
  "wall",
  "floor",
  "ramp",
  "door",
  "trigger",
  "road",
  "prop",
  "building"
];

type Props = {
  createType: WorldObjectType;
  selectedObject: WorldObject | null;
  showPhysics: boolean;
  onSetCreateType: (type: WorldObjectType) => void;
  onTogglePhysics: () => void;
  onCreate: () => void;
  onUpdate: (patch: Partial<WorldObject>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export function BuilderPanel({
  createType,
  selectedObject,
  showPhysics,
  onSetCreateType,
  onTogglePhysics,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate
}: Props) {
  const disabled = !selectedObject || selectedObject.locked;

  return (
    <div className="builder-panel">
      <div className="panel-title">WORLDOBJECT CORE — SAFE PATCH</div>

      <label className="field">
        <span>Type</span>
        <select
          value={createType}
          onChange={(event) => onSetCreateType(event.target.value as WorldObjectType)}
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>

      <button onClick={onCreate}>Créer {createType}</button>

      <button onClick={onTogglePhysics}>
        Debug physique: {showPhysics ? "ON" : "OFF"}
      </button>

      <div className="panel-section">
        <div className="label">Sélection</div>
        <div className="selected-name">
          {selectedObject ? `${selectedObject.type} — ${selectedObject.id}` : "Aucune"}
        </div>
      </div>

      <div className="grid-2">
        <button disabled={disabled} onClick={() => selectedObject && onUpdate({ position: [selectedObject.position[0], selectedObject.position[1], selectedObject.position[2] - 0.5] })}>Avant</button>
        <button disabled={disabled} onClick={() => selectedObject && onUpdate({ position: [selectedObject.position[0], selectedObject.position[1], selectedObject.position[2] + 0.5] })}>Arrière</button>
        <button disabled={disabled} onClick={() => selectedObject && onUpdate({ position: [selectedObject.position[0] - 0.5, selectedObject.position[1], selectedObject.position[2]] })}>Gauche</button>
        <button disabled={disabled} onClick={() => selectedObject && onUpdate({ position: [selectedObject.position[0] + 0.5, selectedObject.position[1], selectedObject.position[2]] })}>Droite</button>
        <button disabled={disabled} onClick={() => selectedObject && onUpdate({ position: [selectedObject.position[0], selectedObject.position[1] + 0.5, selectedObject.position[2]] })}>Monter</button>
        <button disabled={disabled} onClick={() => selectedObject && onUpdate({ position: [selectedObject.position[0], Math.max(0.05, selectedObject.position[1] - 0.5), selectedObject.position[2]] })}>Descendre</button>
        <button disabled={disabled} onClick={() => selectedObject && onUpdate({ rotation: [selectedObject.rotation[0], selectedObject.rotation[1] + 0.15, selectedObject.rotation[2]] })}>Rotation</button>
        <button disabled={disabled} onClick={() => selectedObject && onUpdate({ size: [selectedObject.size[0] + 0.5, selectedObject.size[1], selectedObject.size[2] + 0.5] })}>Scale +</button>
      </div>

      <button disabled={disabled} onClick={onDuplicate}>Dupliquer</button>
      <button className="danger" disabled={disabled} onClick={onDelete}>Supprimer</button>
    </div>
  );
}
