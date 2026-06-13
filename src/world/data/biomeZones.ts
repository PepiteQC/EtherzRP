/**
 * biomeZones.ts — Zones de biome (polygones) pour colorer la carte et
 * définir l'ambiance/le gameplay régional.
 */
import { BiomeZone } from "../schema/WorldTypes";
import { FLEUVE_PATH } from "./roads";

/** Le fleuve : on épaissit le tracé en un polygone (bande). */
function riverPolygon(width = 380) {
  const top = FLEUVE_PATH.map((p) => ({ x: p.x, z: p.z - width / 2 }));
  const bottom = [...FLEUVE_PATH].reverse().map((p) => ({ x: p.x, z: p.z + width / 2 }));
  return [...top, ...bottom];
}

export const BIOME_ZONES: BiomeZone[] = [
  {
    id: "zone-fleuve",
    name: "Fleuve Saint-Laurent",
    biome: "fleuve",
    region: "capitale",
    polygon: riverPolygon(420),
  },
  {
    id: "zone-lacs",
    name: "Plateau des Lacs (Portneuf)",
    biome: "lac",
    region: "portneuf",
    polygon: [
      { x: -2200, z: -900 }, { x: -500, z: -1100 }, { x: -300, z: -2400 },
      { x: -900, z: -3400 }, { x: -2200, z: -3500 }, { x: -2400, z: -2000 },
    ],
  },
  {
    id: "zone-montagnes-charlevoix",
    name: "Massif de Charlevoix",
    biome: "montagne",
    region: "charlevoix",
    polygon: [
      { x: 2700, z: -700 }, { x: 3700, z: -1100 }, { x: 3900, z: -2000 },
      { x: 3100, z: -2200 }, { x: 2600, z: -1400 },
    ],
  },
  {
    id: "zone-montagnes-laurentides",
    name: "Hautes-Laurentides",
    biome: "montagne",
    region: "laurentides",
    polygon: [
      { x: 300, z: -2200 }, { x: 1400, z: -1300 }, { x: 1300, z: -2900 },
      { x: 800, z: -4100 }, { x: -300, z: -4000 }, { x: -100, z: -3000 },
    ],
  },
  {
    id: "zone-plage-cotenord",
    name: "Côte sablonneuse (Haute-Côte)",
    biome: "plage",
    region: "cote-nord",
    polygon: [
      { x: 3900, z: -2200 }, { x: 4350, z: -2350 }, { x: 4400, z: -3000 },
      { x: 3950, z: -3050 },
    ],
  },
  {
    id: "zone-agricole-sud",
    name: "Plaine agricole (Rive-Sud)",
    biome: "agricole",
    region: "rive-sud",
    polygon: [
      { x: -3800, z: 4100 }, { x: 0, z: 2200 }, { x: 2800, z: 600 },
      { x: 2900, z: 1100 }, { x: 200, z: 2700 }, { x: -3700, z: 4400 },
    ],
  },
  {
    id: "zone-foret-centre",
    name: "Forêt centrale",
    biome: "foret",
    region: "capitale",
    polygon: [
      { x: -2200, z: 900 }, { x: 100, z: 500 }, { x: 300, z: -900 },
      { x: -1900, z: -800 },
    ],
  },
];

export default BIOME_ZONES;
