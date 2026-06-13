import type { CityDoor } from "../../../game/city/types/city.types";

export const CITY_DOORS: CityDoor[] = [
  {
    id: "door-depanneur-main",
    buildingId: "depanneur-qc-01",
    label: "Porte principale",
    position: [18, 1, -7],
    isOpen: false,
    isLocked: false,
    requiredAccess: "citizen",
  },
  {
    id: "door-depanneur-stockage",
    buildingId: "depanneur-qc-01",
    label: "Stockage employé",
    position: [22, 1, -13],
    isOpen: false,
    isLocked: true,
    requiredAccess: "employee",
  },
  {
    id: "door-admin-penthouse",
    buildingId: "admin-penthouse-tower-01",
    label: "Ascenseur privé Admin",
    position: [-28, 1, 15],
    isOpen: false,
    isLocked: true,
    requiredAccess: "admin",
  },
];
