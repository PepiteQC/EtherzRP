/**
 * world.ts — Assemble le monde complet EtherWorld RP Québec.
 * Calcule automatiquement les bornes de la carte à partir du contenu.
 */
import { World, WorldBounds, Coord } from "../schema/WorldTypes";
import { REGIONS } from "./regions";
import { VILLAGES } from "./villages";
import { ROADS } from "./roads";
import { POIS } from "./pois";
import { ACTIVITIES } from "./activities";
import { BIOME_ZONES } from "./biomeZones";

function computeBounds(): WorldBounds {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const eat = (c: Coord) => {
    minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
    minZ = Math.min(minZ, c.z); maxZ = Math.max(maxZ, c.z);
  };
  VILLAGES.forEach((v) => eat(v.pos));
  ROADS.forEach((r) => r.path.forEach(eat));
  POIS.forEach((p) => eat(p.pos));
  ACTIVITIES.forEach((a) => eat(a.pos));
  BIOME_ZONES.forEach((b) => b.polygon.forEach(eat));
  const pad = 400;
  return {
    minX: Math.floor(minX - pad),
    maxX: Math.ceil(maxX + pad),
    minZ: Math.floor(minZ - pad),
    maxZ: Math.ceil(maxZ + pad),
  };
}

export const WORLD: World = {
  meta: {
    name: "EtherWorld RP Québec",
    version: "1.0.0",
    subtitle: "La Route 138, les Lacs et tout le Québec — fini la ligne droite !",
    bounds: computeBounds(),
    metersPerUnit: 1,
    createdAt: new Date().toISOString(),
  },
  regions: REGIONS,
  biomeZones: BIOME_ZONES,
  villages: VILLAGES,
  roads: ROADS,
  pois: POIS,
  activities: ACTIVITIES,
};

export default WORLD;
