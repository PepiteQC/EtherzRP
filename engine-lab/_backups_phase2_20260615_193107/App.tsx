import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useEffect, useMemo, useState } from "react";
import { socket } from "./network/socketClient";
import { WorldScene } from "./world/WorldScene";
import { PlayerController } from "./player/PlayerController";
import { BuilderPanel } from "./builder/BuilderPanel";
import { Hud } from "./hud/Hud";
import { EngineStats, PlatformObject, Vec3 } from "./types";

export function App() {
  const [connected, setConnected] = useState(false);
  const [platforms, setPlatforms] = useState<PlatformObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playerPos, setPlayerPos] = useState<Vec3>([0, 3, 8]);
  const [showPhysics, setShowPhysics] = useState(false);
  const [stats, setStats] = useState<EngineStats>({
    fps: 0,
    objects: 0,
    triangles: 0,
    calls: 0
  });

  const selectedPlatform = useMemo(() => {
    return platforms.find((p) => p.id === selectedId) ?? null;
  }, [platforms, selectedId]);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onInit = (payload: { platforms: PlatformObject[] }) => {
      setPlatforms(payload.platforms ?? []);
    };

    const onCreated = (platform: PlatformObject) => {
      setPlatforms((current) => {
        if (current.some((p) => p.id === platform.id)) return current;
        return [...current, platform];
      });
    };

    const onUpdated = (platform: PlatformObject) => {
      setPlatforms((current) => {
        return current.map((p) => (p.id === platform.id ? platform : p));
      });
    };

    const onDeleted = (id: string) => {
      setPlatforms((current) => current.filter((p) => p.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("world:init", onInit);
    socket.on("platform:created", onCreated);
    socket.on("platform:updated", onUpdated);
    socket.on("platform:deleted", onDeleted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("world:init", onInit);
      socket.off("platform:created", onCreated);
      socket.off("platform:updated", onUpdated);
      socket.off("platform:deleted", onDeleted);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      socket.emit("performance:sample", stats);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [stats]);

  function createPlatformNearPlayer() {
    const id = `platform_${Date.now()}`;

    const draft: PlatformObject = {
      id,
      name: `Plateforme ${platforms.length + 1}`,
      type: "platform",
      position: [
        Math.round((playerPos[0] + 4) * 10) / 10,
        0.25,
        Math.round(playerPos[2] * 10) / 10
      ],
      rotation: [0, 0, 0],
      size: [4, 0.5, 4],
      color: "#00aaff",
      material: "painted",
      collider: "cuboid",
      locked: false
    };

    socket.emit("platform:create", draft, (response: { ok: boolean; error?: string }) => {
      if (!response?.ok) {
        console.error("[CREATE_PLATFORM_FAILED]", response?.error);
      }
    });
  }

  function updateSelectedPlatform(patch: Partial<PlatformObject>) {
    if (!selectedPlatform) return;

    socket.emit(
      "platform:update",
      {
        id: selectedPlatform.id,
        patch
      },
      (response: { ok: boolean; error?: string }) => {
        if (!response?.ok) {
          console.error("[UPDATE_PLATFORM_FAILED]", response?.error);
        }
      }
    );
  }

  function deleteSelectedPlatform() {
    if (!selectedPlatform) return;

    socket.emit("platform:delete", selectedPlatform.id, (response: { ok: boolean; error?: string }) => {
      if (!response?.ok) {
        console.error("[DELETE_PLATFORM_FAILED]", response?.error);
      }
    });
  }

  return (
    <div className="app">
      <Canvas
        shadows
        camera={{
          position: [8, 6, 10],
          fov: 60,
          near: 0.1,
          far: 500
        }}
      >
        <Physics gravity={[0, -24, 0]} debug={showPhysics}>
          <WorldScene
            platforms={platforms}
            selectedId={selectedId}
            onSelectPlatform={setSelectedId}
            onStats={setStats}
          />

          <PlayerController onPosition={setPlayerPos} />
        </Physics>
      </Canvas>

      <Hud
        connected={connected}
        stats={stats}
        playerPos={playerPos}
        platformCount={platforms.length}
        selectedPlatform={selectedPlatform}
      />

      <BuilderPanel
        selectedPlatform={selectedPlatform}
        showPhysics={showPhysics}
        onTogglePhysics={() => setShowPhysics((v) => !v)}
        onCreatePlatform={createPlatformNearPlayer}
        onDeleteSelected={deleteSelectedPlatform}
        onUpdateSelected={updateSelectedPlatform}
      />
    </div>
  );
}
