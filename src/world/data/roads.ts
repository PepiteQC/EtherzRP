/**
 * roads.ts — Réseau routier d'EtherWorld RP Québec.
 *
 * ⚠️ FINI la ligne droite ! La 138 SERPENTE le long du fleuve (courbes,
 * caps, baies), les autoroutes coupent à l'intérieur des terres, et la Route
 * des Lacs zigzague entre les lacs de Portneuf/Saint-Alban.
 *
 * Le fleuve Saint-Laurent traverse la map en diagonale du sud-ouest vers le
 * nord-est ; la 138 le longe sur la rive nord.
 */
import { Coord, Road } from "../schema/WorldTypes";

/** Petit helper : génère une polyligne lissée (courbe de Catmull-Rom). */
function smooth(points: Coord[], segments = 8): Coord[] {
  if (points.length < 3) return points;
  const out: Coord[] = [];
  const p = points;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p[i + 1];
    for (let t = 0; t < segments; t++) {
      const s = t / segments;
      const s2 = s * s;
      const s3 = s2 * s;
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * s +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3);
      const z =
        0.5 *
        (2 * p1.z +
          (-p0.z + p2.z) * s +
          (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * s2 +
          (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * s3);
      out.push({ x: Math.round(x), z: Math.round(z) });
    }
  }
  out.push(p[p.length - 1]);
  return out;
}

// --------------------------------------------------------------------------- //
//  Tracé du fleuve (sert de guide visuel + biome). Diagonale sinueuse.
// --------------------------------------------------------------------------- //
export const FLEUVE_PATH: Coord[] = smooth([
  { x: -4200, z: 3600 },
  { x: -3000, z: 2900 },
  { x: -1800, z: 2400 },
  { x: -600, z: 1700 },
  { x: 700, z: 1100 },
  { x: 1900, z: 200 },
  { x: 2900, z: -800 },
  { x: 3700, z: -1900 },
  { x: 4300, z: -3200 },
], 10);

// --------------------------------------------------------------------------- //
//  ROUTE 138 — la colonne vertébrale, longe le fleuve côté nord (au-dessus).
//  Décalée ~450m au nord du fleuve, avec ses propres courbes (caps & baies).
// --------------------------------------------------------------------------- //
const ROUTE_138_CONTROL: Coord[] = [
  { x: -4000, z: 3050 },
  { x: -3300, z: 2700 }, // entrée ouest (Rive-Sud connecte ici via pont)
  { x: -2500, z: 2150 },
  { x: -1700, z: 2050 }, // baie
  { x: -900, z: 1450 },
  { x: -100, z: 1500 }, // cap (remonte)
  { x: 600, z: 800 },
  { x: 1200, z: 750 }, // Vieille-Capitale (carrefour central)
  { x: 1900, z: -100 },
  { x: 2400, z: -250 }, // baie de Charlevoix
  { x: 3000, z: -1100 },
  { x: 3300, z: -1000 }, // cap montagneux
  { x: 3700, z: -2100 },
  { x: 4000, z: -2900 }, // bout de la 138, Haute-Côte
];
export const ROUTE_138_PATH = smooth(ROUTE_138_CONTROL, 9);

// --------------------------------------------------------------------------- //
//  AUTOROUTES (coupent à l'intérieur des terres, plus rectilignes mais
//  jamais parfaitement droites).
// --------------------------------------------------------------------------- //

// A-40 "des Bâtisseurs" : double la 138 plus au nord (raccourci rapide ouest->centre)
const A40_CONTROL: Coord[] = [
  { x: -3300, z: 1900 },
  { x: -2200, z: 1500 },
  { x: -1000, z: 900 },
  { x: 200, z: 400 },
  { x: 1200, z: 350 }, // rejoint la Capitale
];
export const A40_PATH = smooth(A40_CONTROL, 7);

// A-73 "des Laurentides" : remonte vers les montagnes (centre -> nord intérieur)
const A73_CONTROL: Coord[] = [
  { x: 1200, z: 350 },
  { x: 1100, z: -600 },
  { x: 900, z: -1600 },
  { x: 600, z: -2600 },
  { x: 400, z: -3500 }, // stations de ski
];
export const A73_PATH = smooth(A73_CONTROL, 7);

// A-20 "des Pionniers" : rive-sud agricole, parallèle au fleuve côté sud
const A20_CONTROL: Coord[] = [
  { x: -3600, z: 3900 },
  { x: -2400, z: 3300 },
  { x: -1200, z: 2700 },
  { x: 0, z: 2000 },
  { x: 1400, z: 1300 },
  { x: 2600, z: 400 },
];
export const A20_PATH = smooth(A20_CONTROL, 8);

// --------------------------------------------------------------------------- //
//  ROUTE DES LACS (panoramique) — Saint-Alban / Portneuf. ZIGZAG entre lacs.
// --------------------------------------------------------------------------- //
const ROUTE_LACS_CONTROL: Coord[] = [
  { x: -1000, z: 900 }, // se détache de la 138
  { x: -1400, z: 200 },
  { x: -1100, z: -500 }, // contourne lac
  { x: -1600, z: -1100 },
  { x: -1200, z: -1800 }, // Saint-Alban
  { x: -1800, z: -2400 },
  { x: -1300, z: -3100 }, // lac du Loup
  { x: -2000, z: -3600 },
];
export const ROUTE_LACS_PATH = smooth(ROUTE_LACS_CONTROL, 9);

// --------------------------------------------------------------------------- //
//  ROUTES RÉGIONALES & LOCALES (connectent villages aux axes)
// --------------------------------------------------------------------------- //
const REG_CHARLEVOIX: Coord[] = smooth([
  { x: 2400, z: -250 },
  { x: 2800, z: -800 },
  { x: 3300, z: -1500 }, // station de ski Charlevoix
  { x: 3000, z: -2100 },
], 7);

const REG_PLAGE: Coord[] = smooth([
  { x: 3700, z: -2100 },
  { x: 4100, z: -2400 }, // plage / camping Haute-Côte
  { x: 4300, z: -2900 },
], 6);

const REG_CAMPING_LAC: Coord[] = smooth([
  { x: -1200, z: -1800 },
  { x: -700, z: -2100 }, // grand camping du lac
  { x: -300, z: -1700 },
], 6);

const REG_MONTAGNE: Coord[] = smooth([
  { x: 400, z: -3500 },
  { x: -100, z: -3900 }, // sommet / belvédère
  { x: 900, z: -4000 },
], 6);

// --------------------------------------------------------------------------- //
//  PONTS (relient rive-nord 138 et rive-sud A-20)
// --------------------------------------------------------------------------- //
const PONT_CAPITALE: Coord[] = [
  { x: 1200, z: 750 },
  { x: 1300, z: 1050 },
  { x: 1400, z: 1300 },
];
const PONT_OUEST: Coord[] = [
  { x: -3300, z: 2700 },
  { x: -3450, z: 3300 },
  { x: -3600, z: 3900 },
];

// --------------------------------------------------------------------------- //
//  EXPORT
// --------------------------------------------------------------------------- //
export const ROADS: Road[] = [
  {
    id: "rt138",
    name: "Route 138 — la Route du Fleuve",
    ref: "138",
    roadClass: "nationale",
    path: ROUTE_138_PATH,
    speedLimit: 90,
    scenic: true,
    serves: [
      "capitale-ville", "baie-tranquille", "cap-aux-pins", "anse-grise",
      "havre-du-nord", "pointe-phare",
    ],
  },
  {
    id: "a40",
    name: "Autoroute des Bâtisseurs",
    ref: "A-40",
    roadClass: "autoroute",
    path: A40_PATH,
    speedLimit: 110,
    serves: ["capitale-ville", "saint-elie", "val-boise"],
  },
  {
    id: "a73",
    name: "Autoroute des Laurentides",
    ref: "A-73",
    roadClass: "autoroute",
    path: A73_PATH,
    speedLimit: 110,
    serves: ["mont-cervin", "lac-perdu", "station-nordique"],
  },
  {
    id: "a20",
    name: "Autoroute des Pionniers",
    ref: "A-20",
    roadClass: "autoroute",
    path: A20_PATH,
    speedLimit: 110,
    serves: ["saint-laboure", "grande-prairie", "marche-du-sud"],
  },
  {
    id: "rt-lacs",
    name: "Route des Lacs (Saint-Alban)",
    ref: "RL",
    roadClass: "panoramique",
    path: ROUTE_LACS_PATH,
    speedLimit: 70,
    scenic: true,
    serves: ["saint-alban", "lac-du-loup", "camping-azur", "pourvoirie-orignal"],
  },
  {
    id: "reg-charlevoix",
    name: "Chemin des Sommets (Charlevoix)",
    roadClass: "regionale",
    path: REG_CHARLEVOIX,
    speedLimit: 70,
    scenic: true,
    serves: ["mont-charlevoix", "village-artistes"],
  },
  {
    id: "reg-plage",
    name: "Chemin de la Plage",
    roadClass: "regionale",
    path: REG_PLAGE,
    speedLimit: 50,
    scenic: true,
    serves: ["plage-doree", "camping-marin"],
  },
  {
    id: "reg-camping-lac",
    name: "Chemin du Camping",
    roadClass: "locale",
    path: REG_CAMPING_LAC,
    speedLimit: 50,
    serves: ["camping-azur"],
  },
  {
    id: "reg-montagne",
    name: "Chemin du Sommet",
    roadClass: "chemin",
    path: REG_MONTAGNE,
    speedLimit: 40,
    scenic: true,
    serves: ["station-nordique"],
  },
  {
    id: "pont-capitale",
    name: "Pont de la Capitale",
    roadClass: "autoroute",
    path: PONT_CAPITALE,
    speedLimit: 80,
    serves: ["capitale-ville", "saint-laboure"],
  },
  {
    id: "pont-ouest",
    name: "Pont de l'Ouest",
    roadClass: "regionale",
    path: PONT_OUEST,
    speedLimit: 70,
    serves: ["grande-prairie"],
  },
];

export default ROADS;
