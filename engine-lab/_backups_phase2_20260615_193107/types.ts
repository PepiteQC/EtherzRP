export type Vec3 = [number, number, number];

export type EngineWorld = {
  id: string;
  name: string;
  version: number;
  mode: "local";
  gravity: Vec3;
  spawn: Vec3;
};

export type PlatformObject = {
  id: string;
  name: string;
  type: "platform";
  position: Vec3;
  rotation: Vec3;
  size: Vec3;
  color: string;
  material: string;
  collider: "cuboid";
  locked: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type EngineStats = {
  fps: number;
  objects: number;
  triangles: number;
  calls: number;
};
