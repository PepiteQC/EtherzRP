/**
 * activities.ts — Activités interactives jouables (40+), ancrées aux lieux,
 * réparties sur tous les biomes. Avec récompenses, difficulté et durée.
 */
import { Activity, ActivityType } from "../schema/WorldTypes";

let _n = 0;
function act(
  name: string,
  type: ActivityType,
  x: number,
  z: number,
  region: string,
  biome: Activity["biome"],
  description: string,
  opts?: Partial<Activity>
): Activity {
  return {
    id: `act_${++_n}`,
    name,
    type,
    pos: { x, z },
    region,
    biome,
    description,
    difficulty: opts?.difficulty ?? "facile",
    durationMin: opts?.durationMin ?? 15,
    reward: opts?.reward ?? { min: 20, max: 80, currency: "$" },
    anchor: opts?.anchor,
  };
}

export const ACTIVITIES: Activity[] = [
  // ----- Eau / lacs / fleuve ----- //
  act("Pêche à la truite", "peche", -1250, -1850, "portneuf", "lac",
    "Lance ta ligne dans les lacs de Saint-Alban. Plus tu attends, plus c'est gros.",
    { anchor: "saint-alban", reward: { min: 30, max: 120, currency: "$" }, durationMin: 20 }),
  act("Pêche blanche", "peche", -1320, -3120, "portneuf", "lac",
    "Pêche sur glace au Lac-du-Loup (l'hiver). Patience requise.",
    { anchor: "lac-du-loup", difficulty: "moyen", reward: { min: 40, max: 150, currency: "$" } }),
  act("Kayak sur le Lac Miroir", "kayak", -1050, -2600, "portneuf", "lac",
    "Parcours guidé en kayak entre les îlots.", { anchor: "camping-azur", durationMin: 25 }),
  act("Kayak de mer", "kayak", 3520, -1720, "cote-nord", "fleuve",
    "Sortie en kayak de mer depuis Havre-du-Nord. Attention aux marées.",
    { anchor: "havre-du-nord", difficulty: "difficile", durationMin: 35 }),
  act("Baignade à Plage-Dorée", "baignade", 4120, -2430, "cote-nord", "plage",
    "Baignade et beach-volley sur la plus belle plage de la map.",
    { anchor: "plage-doree", reward: { min: 0, max: 0 } }),
  act("Observation des baleines", "observation", 3720, -2150, "cote-nord", "fleuve",
    "Croisière pour observer rorquals et bélugas.", { anchor: "anse-grise",
    difficulty: "facile", durationMin: 40, reward: { min: 0, max: 0 } }),

  // ----- Forêt / montagne ----- //
  act("Chasse au chevreuil", "chasse", -1830, -2420, "portneuf", "foret",
    "Chasse encadrée à la pourvoirie. Permis requis.",
    { anchor: "pourvoirie-orignal", difficulty: "difficile", durationMin: 45,
      reward: { min: 80, max: 300, currency: "$" } }),
  act("Randonnée du Belvédère de l'Aigle", "randonnee", -100, -3900, "laurentides", "montagne",
    "Sentier de 6 km jusqu'à un point de vue à 700 m.",
    { difficulty: "moyen", durationMin: 50, reward: { min: 0, max: 0 } }),
  act("Ski alpin au Mont-Charlevoix", "ski", 3320, -1560, "charlevoix", "montagne",
    "Dévale les pistes de la station 4 saisons.", { anchor: "mont-charlevoix",
    difficulty: "moyen", durationMin: 30, reward: { min: 0, max: 0 } }),
  act("Ski de la Station Nordique", "ski", 400, -3500, "laurentides", "montagne",
    "Grand domaine skiable avec vue sur les sommets.", { anchor: "station-nordique",
    difficulty: "difficile", durationMin: 35, reward: { min: 0, max: 0 } }),
  act("VTT de montagne", "vtt", 3300, -1500, "charlevoix", "montagne",
    "Pistes de descente et cross-country au Mont-Charlevoix.",
    { anchor: "mont-charlevoix", difficulty: "difficile", durationMin: 30 }),
  act("Coupe de bois", "bucheron", -1900, -2300, "portneuf", "foret",
    "Abats des arbres marqués et vends le bois au moulin.",
    { difficulty: "moyen", durationMin: 25, reward: { min: 50, max: 140, currency: "$" } }),
  act("Cueillette de petits fruits", "collecte", -600, -1700, "portneuf", "foret",
    "Ramasse bleuets et framboises en saison.",
    { reward: { min: 15, max: 60, currency: "$" } }),
  act("Soirée d'observation des étoiles", "observation", 350, -3580, "laurentides", "montagne",
    "À l'Observatoire Nordique, repère planètes et constellations.",
    { anchor: "station-nordique", durationMin: 40, reward: { min: 0, max: 0 } }),

  // ----- Camping / nature ----- //
  act("Montage de campement", "camping", -700, -2100, "portneuf", "camping",
    "Installe ta tente et allume un feu de camp à Anse-Azur.",
    { anchor: "camping-azur", reward: { min: 0, max: 0 } }),
  act("Nuit au Camping du Large", "camping", 4210, -2710, "cote-nord", "camping",
    "Camping face au fleuve, lever de soleil garanti.", { anchor: "camping-marin",
    reward: { min: 0, max: 0 } }),

  // ----- Agriculture / commerce ----- //
  act("Récolte aux champs", "agriculture", 1430, 1360, "rive-sud", "agricole",
    "Conduis le tracteur et récolte les champs de Saint-Labouré.",
    { anchor: "saint-laboure", difficulty: "moyen", durationMin: 25,
      reward: { min: 40, max: 130, currency: "$" } }),
  act("Autocueillette de pommes", "collecte", 2650, 470, "rive-sud", "agricole",
    "Cueille des pommes à la cidrerie du Sud.", { anchor: "marche-du-sud",
    reward: { min: 20, max: 70, currency: "$" } }),
  act("Tenue d'un étal au marché", "commerce", 1430, 1360, "rive-sud", "agricole",
    "Vends tes produits au marché public.", { anchor: "saint-laboure", durationMin: 20,
    reward: { min: 30, max: 110, currency: "$" } }),
  act("Traite à la ferme laitière", "agriculture", -1200, 2700, "rive-sud", "agricole",
    "Occupe-toi du troupeau à Grande-Prairie.", { anchor: "grande-prairie",
    reward: { min: 35, max: 90, currency: "$" } }),

  // ----- Transport / services (gameplay RP) ----- //
  act("Tournée de livraison (138)", "livraison", 1200, 750, "capitale", "urbain",
    "Livre des colis le long de la 138 entre les villages.",
    { anchor: "capitale-ville", difficulty: "moyen", durationMin: 30,
      reward: { min: 60, max: 200, currency: "$" } }),
  act("Service de taxi", "taxi", 1200, 750, "capitale", "urbain",
    "Transporte des PNJ d'un point à l'autre de Port-Réal.",
    { anchor: "capitale-ville", durationMin: 20, reward: { min: 40, max: 150, currency: "$" } }),
  act("Course sur la Route des Lacs", "course", -1000, 900, "portneuf", "village",
    "Contre-la-montre panoramique entre les lacs.", { difficulty: "difficile",
    durationMin: 8, reward: { min: 100, max: 250, currency: "$" } }),
  act("Course côtière de la 138", "course", 2400, -250, "charlevoix", "fleuve",
    "Course du fleuve, virages serrés et belvédères.", { anchor: "baie-tranquille",
    difficulty: "difficile", durationMin: 10, reward: { min: 120, max: 280, currency: "$" } }),
  act("Patrouille des secours", "secours", 1200, 750, "capitale", "urbain",
    "Réponds aux urgences médicales en ville (rôle ambulancier).",
    { anchor: "capitale-ville", difficulty: "moyen", durationMin: 25,
      reward: { min: 70, max: 220, currency: "$" } }),

  // ----- Mines / industrie ----- //
  act("Minage en montagne", "minage", 1100, -1600, "laurentides", "montagne",
    "Extrais du minerai dans les galeries du Mont-Cervin.", { anchor: "mont-cervin",
    difficulty: "moyen", durationMin: 30, reward: { min: 60, max: 180, currency: "$" } }),

  // ----- Tourisme / culture ----- //
  act("Visite du village d'artistes", "observation", 2900, -900, "charlevoix", "touristique",
    "Découvre galeries et ateliers de Pointe-aux-Peintres.", { anchor: "village-artistes",
    reward: { min: 0, max: 0 } }),
  act("Visite du phare", "observation", 4040, -2960, "cote-nord", "fleuve",
    "Monte au sommet du phare de la Pointe.", { anchor: "pointe-phare",
    durationMin: 15, reward: { min: 0, max: 0 } }),
  act("Photo à la Cascade des Trois-Saults", "observation", -1500, -1300, "portneuf", "lac",
    "Sentier court vers une triple chute spectaculaire.", { reward: { min: 0, max: 0 } }),
];

export default ACTIVITIES;
