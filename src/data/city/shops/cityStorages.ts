import type { CityStorage } from "../../../game/city/types/city.types";

export const CITY_STORAGES: CityStorage[] = [
  {
    id: "storage-depanneur-main",
    ownerId: "depanneur-qc-01",
    label: "Stockage dépanneur",
    slots: 48,
    maxWeight: 350,
    allowedJobs: ["depanneur_clerk", "manager", "admin"],
  },
  {
    id: "storage-admin-private",
    ownerId: "admin-penthouse-tower-01",
    label: "Coffre privé Admin Owner",
    slots: 120,
    maxWeight: 1200,
    allowedJobs: ["admin"],
  },
];
