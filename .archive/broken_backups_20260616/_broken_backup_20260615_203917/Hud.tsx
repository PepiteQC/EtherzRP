import { EngineStats, PlatformObject, Vec3 } from "../types";

type Props = {
  connected: boolean;
  stats: EngineStats;
  playerPos: Vec3;
  platformCount: number;
  selectedPlatform: PlatformObject | null;
};

export function Hud({
  connected,
  stats,
  playerPos,
  platformCount,
  selectedPlatform
}: Props) {
  return (
    <div className="hud">
      <div className="hud-title">ETHERWORLD LOCAL ENGINE LAB</div>

      <div className="hud-line">
        Serveur: <span className={connected ? "ok" : "bad"}>{connected ? "LIVE" : "OFF"}</span>
      </div>

      <div className="hud-line">FPS: {stats.fps}</div>
      <div className="hud-line">Objets scène: {stats.objects}</div>
      <div className="hud-line">Triangles: {stats.triangles}</div>
      <div className="hud-line">Draw calls: {stats.calls}</div>
      <div className="hud-line">Plateformes: {platformCount}</div>

      <div className="hud-section">
        <div>Position joueur</div>
        <strong>
          {playerPos[0]}, {playerPos[1]}, {playerPos[2]}
        </strong>
      </div>

      <div className="hud-section">
        <div>Sélection</div>
        <strong>{selectedPlatform ? selectedPlatform.id : "aucune"}</strong>
      </div>

      <div className="controls">
        WASD bouger · SHIFT courir · SPACE sauter · clic plateforme sélectionner
      </div>
    </div>
  );
}
