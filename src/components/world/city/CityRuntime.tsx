import { useMemo } from "react";
import { Text } from "@react-three/drei";
import { useCityBoot } from "../../../hooks/city/useCityBoot";
import { useCityStore } from "../../../store/city/useCityStore";
import { ObjectModelRenderer } from "../../etherworld/builders/ObjectModelRenderer";
import type { CityBuilding } from "../../../game/city/types/city.types";
import { ETHERWORLD_UNIFIED_REGISTRY } from "../../../data/registry";

function modelIdForBuilding(building: CityBuilding): string {
  if (building.buildingType === "depanneur") return "couche";
  if (building.buildingType === "hotel") return "hotel";
  if (building.buildingType === "garage") return "garage";
  if (building.buildingType === "police") return "station";
  if (building.buildingType === "admin") return "tower";
  if (building.buildingType === "shop") return "depan";
  if (building.buildingType === "apartment") return "apart";
  return "cube";
}

function accentForAccess(access: string) {
  if (access === "owner") return "#facc15";
  if (access === "admin") return "#a855f7";
  if (access === "security") return "#38bdf8";
  if (access === "employee") return "#22c55e";
  return "#94a3b8";
}

export function CityRuntime() {
  useCityBoot();

  const snapshot = useCityStore((state) => state.snapshot);

  const enabledBuildings = useMemo(
    () => snapshot?.buildings.filter((building) => building.enabled !== false) ?? [],
    [snapshot?.buildings]
  );

  return (
    <group
      name="etherworld-city-runtime"
      userData={{
        type: "city_runtime",
        connected: true,
        registryStats: ETHERWORLD_UNIFIED_REGISTRY.stats,
      }}
    >
      {enabledBuildings.map((building) => {
        const modelId = modelIdForBuilding(building);
        const accent = accentForAccess(building.accessLevel);
        return (
          <group
            key={building.id}
            name={building.id}
            position={building.position}
            rotation={building.rotation}
            userData={{
              type: "city_building_runtime",
              buildingId: building.id,
              buildingType: building.buildingType,
              accessLevel: building.accessLevel,
              hasInterior: building.hasInterior,
              hasStorage: building.hasStorage,
              hasSecurity: building.hasSecurity,
              source: "CITY_BUILDINGS + MODEL_DEFS",
            }}
          >
            <ObjectModelRenderer modelId={modelId} scale={building.buildingType === "admin" ? 0.8 : 0.55} />
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[2.8, 3.1, 32]} />
              <meshBasicMaterial color={accent} transparent opacity={0.28} />
            </mesh>
            <Text position={[0, 3.2, 0]} fontSize={0.42} color={accent} anchorX="center">
              {building.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
