import type { CityAccessLevel } from "../types/city.types";

export const CITY_CONFIG = {
  worldId: "etherworld-qc-main",
  name: "EtherWorld RP Québec",
  spawn: [0, 1, 0] as [number, number, number],
  maxRenderDistance: 260,
  interactionDistance: 4,
  autosaveMs: 15000,
  quebecTimezone: "America/Toronto",
  defaultAccess: "citizen" as CityAccessLevel,
};
