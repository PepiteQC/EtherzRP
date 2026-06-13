import type { Vec3 } from "../../types/city.types";

export type CityInteractionType =
  | "open_door"
  | "lock_door"
  | "open_storage"
  | "start_job"
  | "buy_item"
  | "enter_building"
  | "exit_building"
  | "use_vehicle";

export interface CityInteraction {
  id: string;
  type: CityInteractionType;
  label: string;
  position: Vec3;
  distance?: number;
  targetId?: string;
}

export function isInteractionInRange(playerPosition: Vec3, interaction: CityInteraction, maxDistance = 4) {
  const dx = playerPosition[0] - interaction.position[0];
  const dy = playerPosition[1] - interaction.position[1];
  const dz = playerPosition[2] - interaction.position[2];
  const distSq = dx * dx + dy * dy + dz * dz;

  return distSq <= maxDistance * maxDistance;
}
