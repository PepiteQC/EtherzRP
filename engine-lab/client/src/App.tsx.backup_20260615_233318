import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useCallback, useEffect, useMemo, useState } from "react";
import { socket } from "./network/socketClient";
import { WorldScene } from "./world/WorldScene";
import { PlayerController } from "./player/PlayerController";
import { BuilderPanel } from "./builder/BuilderPanel";
import { useBuilderHotkeys } from "./builder/useBuilderHotkeys";
import { Hud } from "./hud/Hud";
import { BuilderExport, EngineStats, PlatformObject, Vec3 } from "./types";

function round3(value: number) {
  return Number(value.toFixed(3));
}

export function App() {
  const [connected, setConnected] = useState(false);
  const [platforms, setPlatforms] = useState<PlatformObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playerPos, setPlayerPos] = useState<Vec3>([0, 3, 8]);
  const [showPhysics, setShowPhysics] = useState(false);
  const [gridSnap, setGridSnap] = useState(true);
  const [snapStep, setSnapStep] = useState(0.5);

  const [stats, setStats] = useState<EngineStats>({
    fps: 0,
    objects: 0,
    triangles: 0,
    calls: 0
  });

  const selectedPlatform = useMemo(() => {
    return platforms.find((p) => p.id === selectedId) ?? null;
  }, [platforms, selectedId]);

  const exportPayload = useMemo<BuilderExport>(() => {
    return {
      exportType: "etherworld-local-engine-lab",
      version: 2,
      generatedAt: new Date().toISOString(),
      platformCount: platforms.length,
      platforms
    };
  }, [platforms]);

  const snapNumber = useCallback(
    (value: number) => {
      if (!gridSnap) return round3(value);
      return round3(Math.round(value / snapStep) * snapStep);
    },
    [gridSnap, snapStep]
  );

  const snapVec3 = useCallback(
    (value: Vec3): Vec3 => {
      return [snapNumber(value[0]), snapNumber(value[1]), snapNumber(value[2])];
    },
    [snapNumber]
  );

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

  const emitCreatePlatform = useCallback((draft: PlatformObject) => {
    socket.emit("platform:create", draft, (response: { ok: boolean; error?: string; platform?: PlatformObject }) => {
      if (!response?.ok) {
        console.error("[CREATE_PLATFORM_FAILED]", response?.error);
        return;
      }

      if (response.platform?.id) {
        setSelectedId(response.platform.id);
      }
    });
  }, []);

  const createPlatformNearPlayer = useCallback(() => {
    const id = `platform_${Date.now()}`;

    const draft: PlatformObject = {
      id,
      name: `Plateforme ${platforms.length + 1}`,
      type: "platform",
      position: snapVec3([
        playerPos[0] + 4,
        0.25,
        playerPos[2]
      ]),
      rotation: [0, 0, 0],
      size: snapVec3([4, 0.5, 4]),
      color: "#00aaff",
      material: "painted",
      collider: "cuboid",
      locked: false
    };

    emitCreatePlatform(draft);
  }, [emitCreatePlatform, platforms.length, playerPos, snapVec3]);

  const updateSelectedPlatform = useCallback(
    (patch: Partial<PlatformObject>) => {
      if (!selectedPlatform) return;

      const cleanPatch: Partial<PlatformObject> = {
        ...patch
      };

      if (patch.position) {
        cleanPatch.position = snapVec3(patch.position);
      }

      if (patch.size) {
        const snapped = snapVec3(patch.size);
        cleanPatch.size = [
          Math.max(0.25, snapped[0]),
          Math.max(0.1, snapped[1]),
          Math.max(0.25, snapped[2])
        ];
      }

      if (patch.rotation) {
        cleanPatch.rotation = [
          round3(patch.rotation[0]),
          round3(patch.rotation[1]),
          round3(patch.rotation[2])
        ];
      }

      socket.emit(
        "platform:update",
        {
          id: selectedPlatform.id,
          patch: cleanPatch
        },
        (response: { ok: boolean; error?: string }) => {
          if (!response?.ok) {
            console.error("[UPDATE_PLATFORM_FAILED]", response?.error);
          }
        }
      );
    },
    [selectedPlatform, snapVec3]
  );

  const deleteSelectedPlatform = useCallback(() => {
    if (!selectedPlatform) return;

    socket.emit("platform:delete", selectedPlatform.id, (response: { ok: boolean; error?: string }) => {
      if (!response?.ok) {
        console.error("[DELETE_PLATFORM_FAILED]", response?.error);
      }
    });
  }, [selectedPlatform]);

  const duplicateSelectedPlatform = useCallback(() => {
    if (!selectedPlatform || selectedPlatform.locked) return;

    const draft: PlatformObject = {
      ...selectedPlatform,
      id: `${selectedPlatform.id}_copy_${Date.now()}`,
      name: `${selectedPlatform.name} Copy`,
      position: snapVec3([
        selectedPlatform.position[0] + selectedPlatform.size[0] + snapStep,
        selectedPlatform.position[1],
        selectedPlatform.position[2] + snapStep
      ]),
      locked: false,
      createdAt: undefined,
      updatedAt: undefined
    };

    emitCreatePlatform(draft);
  }, [emitCreatePlatform, selectedPlatform, snapStep, snapVec3]);

  useBuilderHotkeys({
    enabled: true,
    selectedPlatform,
    snapStep,
    onToggleGridSnap: () => setGridSnap((v) => !v),
    onDuplicateSelected: duplicateSelectedPlatform,
    onDeleteSelected: deleteSelectedPlatform,
    onUpdateSelected: updateSelectedPlatform
  });

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
        gridSnap={gridSnap}
        snapStep={snapStep}
        exportPayload={exportPayload}
        onSetSnapStep={setSnapStep}
        onToggleGridSnap={() => setGridSnap((v) => !v)}
        onTogglePhysics={() => setShowPhysics((v) => !v)}
        onCreatePlatform={createPlatformNearPlayer}
        onDeleteSelected={deleteSelectedPlatform}
        onDuplicateSelected={duplicateSelectedPlatform}
        onUpdateSelected={updateSelectedPlatform}
      />

      <DeveloperConsole
        connected={connected}
        stats={stats}
        platforms={platforms}
        selectedPlatform={selectedPlatform}
        gridSnap={gridSnap}
        snapStep={snapStep}
        showPhysics={showPhysics}
        exportPayload={exportPayload}
        onSelectPlatform={setSelectedId}
        onSetSnapStep={setSnapStep}
        onToggleGridSnap={() => setGridSnap((v) => !v)}
        onTogglePhysics={() => setShowPhysics((v) => !v)}
        onCreatePlatform={createPlatformNearPlayer}
        onDeleteSelected={deleteSelectedPlatform}
        onDuplicateSelected={duplicateSelectedPlatform}
        onUpdateSelected={updateSelectedPlatform}
      />
    </div>
  );
}

