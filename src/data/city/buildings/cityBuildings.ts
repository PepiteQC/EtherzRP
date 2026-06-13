import type { CityBuilding } from "../../../game/city/types/city.types";

export const CITY_BUILDINGS: CityBuilding[] = [
  {
    id: "depanneur-qc-01",
    name: "Dépanneur Québec",
    type: "building",
    buildingType: "depanneur",
    zone: "commercial",
    position: [18, 0, -12],
    rotation: [0, 0, 0],
    accessLevel: "citizen",
    hasInterior: true,
    hasStorage: true,
    hasSecurity: true,
    enabled: true,
  },
  {
    id: "admin-penthouse-tower-01",
    name: "Tour Admin Owner",
    type: "building",
    buildingType: "admin",
    zone: "admin",
    position: [-28, 0, 20],
    rotation: [0, 0, 0],
    accessLevel: "admin",
    hasInterior: true,
    hasStorage: true,
    hasSecurity: true,
    enabled: true,
  },
];
