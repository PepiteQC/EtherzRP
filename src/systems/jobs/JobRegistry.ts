// src/systems/jobs/JobRegistry.ts

import { JobDefinition } from "./types";
import { Vector3 } from "three";

export const ALL_JOBS: JobDefinition[] = [
  // ─── LÉGAUX ───────────────────────────────────────────
  {
    id: "police",
    label: "Police SPVM",
    emoji: "👮",
    description: "Protéger les citoyens, arrêter les criminels",
    salaryBase: 450,
    salaryPerRank: 80,
    maxMembers: 15,
    isLegal: true,
    requiresWhitelist: true,
    dutyLocations: [
      new Vector3(120, 0, 340),     // Poste central Montréal
      new Vector3(-200, 0, 100),    // Poste Québec
    ],
    vehicleModels: [
      "police_charger",
      "police_suv",
      "police_moto",
      "police_heli",
    ],
    uniformModel: "uniform_police",
    radioFrequency: 100.1,
  },
  {
    id: "ambulance",
    label: "Ambulancier",
    emoji: "🚑",
    description: "Sauver des vies, soigner les blessés",
    salaryBase: 400,
    salaryPerRank: 70,
    maxMembers: 10,
    isLegal: true,
    requiresWhitelist: true,
    dutyLocations: [
      new Vector3(80, 0, -120),     // Hôpital Central
    ],
    vehicleModels: ["ambulance_01", "heli_medical"],
    uniformModel: "uniform_medic",
    radioFrequency: 102.5,
  },
  {
    id: "mechanic",
    label: "Mécanicien",
    emoji: "🔧",
    description: "Réparer et tuner les véhicules",
    salaryBase: 300,
    salaryPerRank: 50,
    maxMembers: 8,
    isLegal: true,
    requiresWhitelist: false,
    dutyLocations: [
      new Vector3(-50, 0, 200),     // Garage Central
    ],
    vehicleModels: ["tow_truck"],
    uniformModel: "uniform_mechanic",
    radioFrequency: 104.0,
  },
  {
    id: "taxi",
    label: "Chauffeur de Taxi",
    emoji: "🚕",
    description: "Transporter les citoyens partout en ville",
    salaryBase: 200,
    salaryPerRank: 30,
    maxMembers: 12,
    isLegal: true,
    requiresWhitelist: false,
    dutyLocations: [
      new Vector3(0, 0, 0),
    ],
    vehicleModels: ["taxi_sedan"],
    uniformModel: "uniform_taxi",
    radioFrequency: 105.0,
  },
  {
    id: "fisherman",
    label: "Pêcheur",
    emoji: "🎣",
    description: "Pêcher dans les rivières et lacs du Québec",
    salaryBase: 150,
    salaryPerRank: 25,
    maxMembers: 20,
    isLegal: true,
    requiresWhitelist: false,
    dutyLocations: [
      new Vector3(500, 0, -300),    // Lac Saint-Jean
      new Vector3(350, 0, -500),    // Rivière Saguenay
    ],
    vehicleModels: ["boat_fishing"],
    uniformModel: "uniform_fisherman",
    radioFrequency: 107.0,
  },
  {
    id: "lumberjack",
    label: "Bûcheron",
    emoji: "🪓",
    description: "Couper du bois dans les forêts québécoises",
    salaryBase: 200,
    salaryPerRank: 35,
    maxMembers: 15,
    isLegal: true,
    requiresWhitelist: false,
    dutyLocations: [
      new Vector3(-400, 0, 600),    // Forêt Laurentides
    ],
    vehicleModels: ["truck_lumber"],
    uniformModel: "uniform_lumber",
    radioFrequency: 108.0,
  },
  {
    id: "miner",
    label: "Mineur",
    emoji: "⛏️",
    description: "Extraire des minerais dans les mines du Nord",
    salaryBase: 250,
    salaryPerRank: 40,
    maxMembers: 12,
    isLegal: true,
    requiresWhitelist: false,
    dutyLocations: [
      new Vector3(-600, 0, 800),    // Mine Abitibi
    ],
    vehicleModels: ["truck_mine"],
    uniformModel: "uniform_miner",
    radioFrequency: 109.0,
  },
  {
    id: "delivery",
    label: "Livreur",
    emoji: "📦",
    description: "Livrer des colis partout en ville (job starter)",
    salaryBase: 100,
    salaryPerRank: 15,
    maxMembers: 30,
    isLegal: true,
    requiresWhitelist: false,
    dutyLocations: [
      new Vector3(30, 0, 50),       // Entrepôt Central
    ],
    vehicleModels: ["van_delivery"],
    uniformModel: "uniform_delivery",
    radioFrequency: 110.0,
  },
  {
    id: "lawyer",
    label: "Avocat",
    emoji: "👨‍⚖️",
    description: "Défendre les accusés au tribunal",
    salaryBase: 500,
    salaryPerRank: 100,
    maxMembers: 5,
    isLegal: true,
    requiresWhitelist: true,
    dutyLocations: [
      new Vector3(150, 0, 200),     // Palais de Justice
    ],
    vehicleModels: [],
    uniformModel: "uniform_lawyer",
    radioFrequency: 111.0,
  },

  // ─── ILLÉGAUX ─────────────────────────────────────────
  {
    id: "dealer",
    label: "Dealer",
    emoji: "🌿",
    description: "Produire et vendre des substances illégales",
    salaryBase: 0,              // Pas de salaire fixe — tout au noir
    salaryPerRank: 0,
    maxMembers: 20,
    isLegal: false,
    requiresWhitelist: false,
    dutyLocations: [
      new Vector3(-300, 0, -200),   // Ruelles cachées
    ],
    vehicleModels: ["car_tuned_black"],
    uniformModel: "outfit_street",
    radioFrequency: 66.6,
  },
  {
    id: "unemployed",
    label: "Sans emploi",
    emoji: "🏠",
    description: "Cherche un job! Va voir les points d'embauche.",
    salaryBase: 0,
    salaryPerRank: 0,
    maxMembers: 999,
    isLegal: true,
    requiresWhitelist: false,
    dutyLocations: [],
    vehicleModels: [],
    uniformModel: "",
    radioFrequency: 0,
  },
];

export class JobRegistry {
  private static map = new Map<string, JobDefinition>(
    ALL_JOBS.map((j) => [j.id, j])
  );

  static get(id: string): JobDefinition | undefined {
    return this.map.get(id);
  }

  static getAll(): JobDefinition[] {
    return ALL_JOBS;
  }

  static getLegal(): JobDefinition[] {
    return ALL_JOBS.filter((j) => j.isLegal && j.id !== "unemployed");
  }

  static getIllegal(): JobDefinition[] {
    return ALL_JOBS.filter((j) => !j.isLegal);
  }
}