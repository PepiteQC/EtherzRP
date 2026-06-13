/**
 * regions.ts — Régions touristiques/administratives d'EtherWorld RP Québec.
 * Inspirées du vrai Québec (Charlevoix, Portneuf, Côte-Nord...) avec une
 * géographie adaptée au gameplay.
 */
import { Region } from "../schema/WorldTypes";

export const REGIONS: Region[] = [
  {
    id: "capitale",
    name: "Vieille-Capitale",
    color: "#e76f51",
    description:
      "Le cœur urbain de la map : commerces, services, hôpital régional et grande gare routière. Point de départ de beaucoup de joueurs.",
  },
  {
    id: "portneuf",
    name: "Portneuf-des-Lacs",
    color: "#52b788",
    description:
      "Région des lacs et forêts. La fameuse Route des Lacs serpente entre les chalets, campings et pourvoiries de Saint-Alban.",
  },
  {
    id: "charlevoix",
    name: "Charlevoix",
    color: "#9d4edd",
    description:
      "Montagnes plongeant dans le fleuve, belvédères à couper le souffle, villages d'artistes et stations de ski.",
  },
  {
    id: "cote-nord",
    name: "Haute-Côte",
    color: "#1e6091",
    description:
      "Le bout de la 138 : phares, quais de pêche, plages sauvages et observation des baleines.",
  },
  {
    id: "rive-sud",
    name: "Rive-Sud agricole",
    color: "#a7c957",
    description:
      "De l'autre côté du fleuve : grandes fermes, marchés publics, villages tranquilles et l'autoroute des Pionniers.",
  },
  {
    id: "laurentides",
    name: "Hautes-Laurentides",
    color: "#6c757d",
    description:
      "Massif montagneux à l'intérieur des terres : ski, VTT, randonnée et grands espaces sauvages.",
  },
];

export default REGIONS;
