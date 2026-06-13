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
