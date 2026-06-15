/**
 * src/world/index.ts — Point d'entrée du module Monde EtherWorld RP Québec.
 */
export * from "./schema/WorldTypes";
export { REGIONS } from "./data/regions";
export { VILLAGES } from "./data/villages";
export { ROADS, FLEUVE_PATH } from "./data/roads";
export { POIS } from "./data/pois";
export { ACTIVITIES } from "./data/activities";
export { BIOME_ZONES } from "./data/biomeZones";
export { WORLD, default as world } from "./data/world";
export { validateWorld } from "./validateWorld";
export type { ValidationReport, ValidationIssue } from "./validateWorld";
export { GameWorldManager, default as GameScene } from "./scenes/GameScene";
export { OptimizedBuildingsRenderer, OptimizedBuildingsRenderer as BuildingsRenderer } from "./buildings/components/BuildingsRenderer";
export { InteriorManager, type InteriorSceneType } from "./interiors/InteriorManager";
export { DepanneurInterior } from "./interiors/DepanneurInterior";
export { GarageInterior } from "./interiors/GarageInterior";
export { SAPInterior } from "./interiors/SAPInterior";
export { MotelRoomInterior } from "./interiors/MotelRoomInterior";
export { PoliceStationInterior } from "./interiors/PoliceStationInterior";
