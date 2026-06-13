import { CITY_CONFIG } from "../config/cityConfig";
import type { CityBuilding, CityDoor, CityStorage, CityJob, CityStateSnapshot } from "../types/city.types";

export class CityManager {
  private buildings = new Map<string, CityBuilding>();
  private doors = new Map<string, CityDoor>();
  private storages = new Map<string, CityStorage>();
  private jobs = new Map<string, CityJob>();

  registerBuilding(building: CityBuilding) {
    this.buildings.set(building.id, building);
    return building;
  }

  registerDoor(door: CityDoor) {
    this.doors.set(door.id, door);
    return door;
  }

  registerStorage(storage: CityStorage) {
    this.storages.set(storage.id, storage);
    return storage;
  }

  registerJob(job: CityJob) {
    this.jobs.set(job.id, job);
    return job;
  }

  getBuilding(id: string) {
    return this.buildings.get(id);
  }

  getDoor(id: string) {
    return this.doors.get(id);
  }

  getStorage(id: string) {
    return this.storages.get(id);
  }

  toggleDoor(id: string) {
    const door = this.doors.get(id);
    if (!door || door.isLocked) return door;

    const updated = {
      ...door,
      isOpen: !door.isOpen,
    };

    this.doors.set(id, updated);
    return updated;
  }

  lockDoor(id: string, locked: boolean) {
    const door = this.doors.get(id);
    if (!door) return door;

    const updated = {
      ...door,
      isLocked: locked,
      isOpen: locked ? false : door.isOpen,
    };

    this.doors.set(id, updated);
    return updated;
  }

  createSnapshot(): CityStateSnapshot {
    return {
      worldId: CITY_CONFIG.worldId,
      buildings: [...this.buildings.values()],
      doors: [...this.doors.values()],
      storages: [...this.storages.values()],
      jobs: [...this.jobs.values()],
      updatedAt: Date.now(),
    };
  }
}

export const cityManager = new CityManager();
