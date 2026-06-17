export type Vec3 = [number, number, number];

export type EngineWorld = {
  id: string;
  name: string;
  version: number;
  mode: "local";
  gravity: Vec3;
  spawn: Vec3;
};

export type WorldObjectKind =
  | "platform"
  | "building"
  | "prop"
  | "door"
  | "trigger"
  | "spawn"
  | "road";

export type WorldObjectBase = {
  id: string;
  name: string;
  type: WorldObjectKind;
  position: Vec3;
  rotation: Vec3;
  size: Vec3;
  color: string;
  material: string;
  collider: "cuboid" | "none";
  locked: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PlatformObject = WorldObjectBase & {
  type: "platform";
  collider: "cuboid";
};

export type EngineStats = {
  fps: number;
  objects: number;
  triangles: number;
  calls: number;
};

export type BuilderExport = {
  exportType: "etherworld-local-engine-lab";
  version: 2;
  generatedAt: string;
  platformCount: number;
  platforms: PlatformObject[];
};
