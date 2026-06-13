import type { Triplet } from "@react-three/cannon";

export const ETHER_PHYSICS = {
  gravity: [0, -28, 0] as Triplet,
  broadphase: "SAP" as const,
  iterations: 12,
  tolerance: 0.001,
  allowSleep: true,
  stepSize: 1 / 60,
  maxSubSteps: 4,
  defaultContactMaterial: {
    friction: 0.82,
    restitution: 0.04,
    contactEquationStiffness: 1e7,
    contactEquationRelaxation: 4,
    frictionEquationStiffness: 1e7,
    frictionEquationRelaxation: 4,
  },
} as const;

export const PHYSICS_LAYERS = {
  ground: 1,
  road: 2,
  building: 4,
  vehicle: 8,
  player: 16,
  prop: 32,
} as const;

export const COLLIDER_MATERIAL = {
  ground: "groundMaterial",
  road: "roadMaterial",
  asphalt: "asphaltMaterial",
  concrete: "concreteMaterial",
  building: "buildingMaterial",
  vehicle: "vehicleMaterial",
} as const;

export const WORLD_COLLIDER = {
  groundSize: 2600,
  groundY: -0.12,
  roadHeight: 0.12,
  buildingPadding: 0.65,
  buildingMinHeight: 2,
  propColliderHeight: 1.25,
} as const;

export type ColliderDebugMode = "off" | "buildings" | "roads" | "all";
