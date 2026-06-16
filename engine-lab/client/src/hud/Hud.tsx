import type { EngineStats, Vec3, WorldObject } from "../types";

type Props = {
  stats: EngineStats;
  playerPos: Vec3;
  objectCount: number;
  selectedObject: WorldObject | null;
};

export function Hud({ stats, playerPos, objectCount, selectedObject }: Props) {
  return (
    <div className="hud">
      <div className="hud-title">ETHERWORLD ENGINE LAB</div>
      <div className="hud-line">Mode: SAFE WORLDOBJECT PATCH</div>
      <div className="hud-line">FPS: {stats.fps}</div>
      <div className="hud-line">Objets: {objectCount}</div>
      <div className="hud-line">Triangles: {stats.triangles}</div>
      <div className="hud-line">Draw calls: {stats.calls}</div>

      <div className="hud-section">
        <div>Position joueur</div>
        <strong>{playerPos[0]}, {playerPos[1]}, {playerPos[2]}</strong>
      </div>

      <div className="hud-section">
        <div>Sélection</div>
        <strong>{selectedObject ? selectedObject.id : "aucune"}</strong>
      </div>

      <div className="controls">
        WASD bouger · SHIFT courir · SPACE sauter · clic objet sélectionner
      </div>
    </div>
  );
}
