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
} as const;

export const PHYSICS_LAYERS = {
  ground: 1,
  road: 2,
  building: 4,
  vehicle: 8,
  player: 16,
  prop: 32,
} as const;

export const WORLD_COLLIDER = {
  groundSize: 2600,
  groundThickness: 0.22,
  groundY: -0.16,
  roadHeight: 0.12,
  buildingPadding: 0.65,
  buildingMinHeight: 2,
  propColliderHeight: 1.25,
} as const;

export type ColliderDebugMode = 'off' | 'buildings' | 'roads' | 'all';
