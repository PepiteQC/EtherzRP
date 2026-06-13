<<<<<<< HEAD
=======
<<<<<<< HEAD
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
=======
>>>>>>> 9cfcf813650b52c38febb2f6437efd1af52ab38c
export const ETHER_PHYSICS = {
  gravity: [0, -28, 0] as [number, number, number],
  timeStep: 1 / 60,
  maxVelocityIterations: 8,
  maxStabilizationIterations: 4,
  interpolation: true,
  updatePriority: -1,
} as const;

export const PHYSICS_ENGINE = {
  current: 'rapier',
  reason: 'Rapier est déjà dans le projet, WASM, activement maintenu et plus adapté long terme pour véhicules/personnages RP.',
  legacy: 'cannon reste disponible pour les anciens composants déjà présents dans le repo.',
<<<<<<< HEAD
=======
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
>>>>>>> 9cfcf813650b52c38febb2f6437efd1af52ab38c
} as const;

export const PHYSICS_LAYERS = {
  ground: 1,
  road: 2,
  building: 4,
  vehicle: 8,
  player: 16,
  prop: 32,
} as const;

<<<<<<< HEAD
=======
<<<<<<< HEAD
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
=======
>>>>>>> 9cfcf813650b52c38febb2f6437efd1af52ab38c
export const WORLD_COLLIDER = {
  groundSize: 2600,
  groundThickness: 0.22,
  groundY: -0.16,
<<<<<<< HEAD
=======
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
>>>>>>> 9cfcf813650b52c38febb2f6437efd1af52ab38c
  roadHeight: 0.12,
  buildingPadding: 0.65,
  buildingMinHeight: 2,
  propColliderHeight: 1.25,
} as const;

<<<<<<< HEAD
export type ColliderDebugMode = 'off' | 'buildings' | 'roads' | 'all';
=======
<<<<<<< HEAD
export type ColliderDebugMode = "off" | "buildings" | "roads" | "all";
=======
export type ColliderDebugMode = 'off' | 'buildings' | 'roads' | 'all';
>>>>>>> 57c10a0 (Add dashboard, world components, and project archive files)
>>>>>>> 9cfcf813650b52c38febb2f6437efd1af52ab38c
