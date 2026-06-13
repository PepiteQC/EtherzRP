export type CityZoneType =
  | "downtown"
  | "residential"
  | "commercial"
  | "industrial"
  | "hotel"
  | "depanneur"
  | "admin"
  | "custom";

export type CityJobType =
  | "none"
  | "depanneur_clerk"
  | "police"
  | "ems"
  | "garage"
  | "security"
  | "delivery"
  | "admin";

export type CityAccessLevel =
  | "guest"
  | "citizen"
  | "employee"
  | "manager"
  | "security"
  | "admin"
  | "owner";

export type Vec3 = [number, number, number];

export interface CityEntity {
  id: string;
  name: string;
  type: string;
  position: Vec3;
  rotation?: Vec3;
  enabled?: boolean;
}

export interface CityBuilding extends CityEntity {
  buildingType: "house" | "apartment" | "shop" | "depanneur" | "hotel" | "garage" | "police" | "admin" | "custom";
  zone: CityZoneType;
  accessLevel: CityAccessLevel;
  hasInterior: boolean;
  hasStorage?: boolean;
  hasSecurity?: boolean;
}

export interface CityDoor {
  id: string;
  buildingId: string;
  label: string;
  position: Vec3;
  isOpen: boolean;
  isLocked: boolean;
  requiredAccess: CityAccessLevel;
}

export interface CityStorage {
  id: string;
  ownerId: string;
  label: string;
  slots: number;
  maxWeight: number;
  allowedJobs?: CityJobType[];
}

export interface CityJob {
  id: CityJobType;
  label: string;
  description: string;
  salary: number;
  enabled: boolean;
}

export interface CityStateSnapshot {
  worldId: string;
  buildings: CityBuilding[];
  doors: CityDoor[];
  storages: CityStorage[];
  jobs: CityJob[];
  updatedAt: number;
}
