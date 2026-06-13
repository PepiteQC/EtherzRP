import type { CityAccessLevel, CityDoor } from "../../types/city.types";

const ACCESS_RANK: Record<CityAccessLevel, number> = {
  guest: 0,
  citizen: 1,
  employee: 2,
  manager: 3,
  security: 4,
  admin: 5,
  owner: 6,
};

export function canAccessDoor(playerAccess: CityAccessLevel, door: CityDoor) {
  return ACCESS_RANK[playerAccess] >= ACCESS_RANK[door.requiredAccess];
}

export function requestDoorUse(playerAccess: CityAccessLevel, door: CityDoor) {
  if (door.isLocked && !canAccessDoor(playerAccess, door)) {
    return {
      ok: false,
      reason: "LOCKED",
      message: "Accès refusé.",
    };
  }

  return {
    ok: true,
    reason: "ACCESS_GRANTED",
    message: door.isOpen ? "Porte fermée." : "Porte ouverte.",
  };
}
