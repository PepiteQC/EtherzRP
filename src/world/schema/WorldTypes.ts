/**
 * WorldTypes.ts
 * ----------------------------------------------------------------------------
 * Schéma de données du monde EtherWorld RP Québec.
 *
 * Tout le contenu (villages, routes, POI, biomes, activités) est décrit par ces
 * types et stocké en JSON/TS, indépendamment du moteur de rendu (ici Three.js,
 * mais réutilisable ailleurs). Coordonnées en mètres dans un plan local
 * (x = est/ouest, z = nord/sud), y = altitude.
 * ----------------------------------------------------------------------------
 */

/** Position 2D au sol (la carte est vue de dessus). y optionnel = altitude. */
export interface Coord {
  x: number;
  z: number;
  /** altitude en mètres (relief). */
  y?: number;
}

/** Biomes / environnements disponibles. */
export type Biome =
  | "fleuve" // bord du Saint-Laurent
  | "plage"
  | "foret"
  | "montagne"
  | "lac"
  | "camping"
  | "agricole"
  | "urbain"
  | "village"
  | "touristique"
  | "industriel"
  | "marais";

/** Classes de routes. */
export type RoadClass =
  | "nationale" // ex: route 138
  | "autoroute"
  | "regionale"
  | "locale"
  | "panoramique" // route des lacs, scénique
  | "chemin"; // terre/forestier

/** Catégories de points d'intérêt. */
export type POICategory =
  | "station_service"
  | "depanneur"
  | "restaurant"
  | "hotel"
  | "camping"
  | "plage"
  | "belvedere"
  | "parc"
  | "marina"
  | "garage"
  | "hopital"
  | "police"
  | "pompier"
  | "banque"
  | "magasin"
  | "ferme"
  | "usine"
  | "quai"
  | "phare"
  | "chalet"
  | "montagne"
  | "lac"
  | "cascade"
  | "eglise"
  | "ecole"
  | "mairie"
  | "attraction";

/** Type d'activité interactive jouable. */
export type ActivityType =
  | "peche"
  | "chasse"
  | "randonnee"
  | "baignade"
  | "ski"
  | "vtt"
  | "kayak"
  | "camping"
  | "livraison"
  | "taxi"
  | "minage"
  | "bucheron"
  | "agriculture"
  | "course"
  | "observation"
  | "collecte"
  | "commerce"
  | "secours";

/** Un village / une ville. */
export interface Village {
  id: string;
  name: string;
  /** sous-titre / surnom (ambiance). */
  tagline?: string;
  pos: Coord;
  /** population approximative (gameplay/économie). */
  population: number;
  /** rayon visuel sur la carte (m). */
  radius: number;
  biome: Biome;
  region: string;
  /** description RP. */
  description: string;
  /** services présents (résolus aussi via les POI mais utile en résumé). */
  services: POICategory[];
  /** point de spawn possible ? */
  spawn?: boolean;
}

/** Un segment routier reliant des points (polyligne). */
export interface Road {
  id: string;
  name: string;
  ref?: string; // "138", "A-40"...
  roadClass: RoadClass;
  /** suite de points formant le tracé. */
  path: Coord[];
  /** vitesse limite (km/h) pour le gameplay. */
  speedLimit: number;
  /** sens unique ? */
  oneway?: boolean;
  /** liste d'ids de villages/POI desservis. */
  serves?: string[];
  scenic?: boolean;
}

/** Un point d'intérêt. */
export interface POI {
  id: string;
  name: string;
  category: POICategory;
  pos: Coord;
  /** village/region de rattachement. */
  village?: string;
  region: string;
  biome: Biome;
  description: string;
  /** ouvert au public / interactif ? */
  interactive?: boolean;
  /** icône suggérée (emoji) pour la carte. */
  icon?: string;
}

/** Une zone de biome (polygone) pour colorer la carte / définir l'ambiance. */
export interface BiomeZone {
  id: string;
  name: string;
  biome: Biome;
  /** polygone fermé. */
  polygon: Coord[];
  region: string;
}

/** Une activité interactive ancrée à un lieu. */
export interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  pos: Coord;
  /** POI ou village d'ancrage. */
  anchor?: string;
  region: string;
  biome: Biome;
  description: string;
  /** récompense indicative (économie). */
  reward?: { min: number; max: number; currency?: string };
  /** niveau requis / difficulté. */
  difficulty?: "facile" | "moyen" | "difficile";
  /** durée estimée (minutes). */
  durationMin?: number;
}

/** Une région administrative/touristique. */
export interface Region {
  id: string;
  name: string;
  /** couleur d'accent (hex) pour la carte. */
  color: string;
  description: string;
}

/** Bornes de la carte (en mètres). */
export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Le monde complet. */
export interface World {
  meta: {
    name: string;
    version: string;
    subtitle: string;
    bounds: WorldBounds;
    /** échelle : 1 unité carte = N mètres réels (indicatif). */
    metersPerUnit: number;
    createdAt: string;
  };
  regions: Region[];
  biomeZones: BiomeZone[];
  villages: Village[];
  roads: Road[];
  pois: POI[];
  activities: Activity[];
}

/** Icônes par catégorie de POI (pour la carte). */
export const POI_ICONS: Record<POICategory, string> = {
  station_service: "⛽",
  depanneur: "🏪",
  restaurant: "🍽️",
  hotel: "🏨",
  camping: "🏕️",
  plage: "🏖️",
  belvedere: "🔭",
  parc: "🌳",
  marina: "⚓",
  garage: "🔧",
  hopital: "🏥",
  police: "🚓",
  pompier: "🚒",
  banque: "🏦",
  magasin: "🛒",
  ferme: "🚜",
  usine: "🏭",
  quai: "🛳️",
  phare: "🗼",
  chalet: "🛖",
  montagne: "⛰️",
  lac: "🏞️",
  cascade: "💧",
  eglise: "⛪",
  ecole: "🏫",
  mairie: "🏛️",
  attraction: "🎡",
};

/** Couleurs par biome (pour le rendu carte). */
export const BIOME_COLORS: Record<Biome, string> = {
  fleuve: "#1e6091",
  plage: "#e9c46a",
  foret: "#2d6a4f",
  montagne: "#6c757d",
  lac: "#48cae4",
  camping: "#52796f",
  agricole: "#a7c957",
  urbain: "#8d99ae",
  village: "#b08968",
  touristique: "#e76f51",
  industriel: "#5c5470",
  marais: "#7f8a4f",
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  peche: "🎣",
  chasse: "🏹",
  randonnee: "🥾",
  baignade: "🏊",
  ski: "⛷️",
  vtt: "🚵",
  kayak: "🛶",
  camping: "⛺",
  livraison: "📦",
  taxi: "🚕",
  minage: "⛏️",
  bucheron: "🪓",
  agriculture: "🌾",
  course: "🏁",
  observation: "🦌",
  collecte: "🧺",
  commerce: "💰",
  secours: "🚑",
};
