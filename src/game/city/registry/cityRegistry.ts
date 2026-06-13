import { cityManager } from "../core/CityManager";
import { CITY_BUILDINGS } from "../../../data/city/buildings/cityBuildings";
import { CITY_DOORS } from "../../../data/city/security/cityDoors";
import { CITY_JOBS } from "../../../data/city/jobs/cityJobs";
import { CITY_STORAGES } from "../../../data/city/shops/cityStorages";

export function registerCityDefaults() {
  CITY_BUILDINGS.forEach((building) => cityManager.registerBuilding(building));
  CITY_DOORS.forEach((door) => cityManager.registerDoor(door));
  CITY_JOBS.forEach((job) => cityManager.registerJob(job));
  CITY_STORAGES.forEach((storage) => cityManager.registerStorage(storage));

  return cityManager.createSnapshot();
}
