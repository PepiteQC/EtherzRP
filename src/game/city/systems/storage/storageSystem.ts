import type { CityJobType, CityStorage } from "../../types/city.types";

export function canOpenStorage(storage: CityStorage, job: CityJobType) {
  if (!storage.allowedJobs || storage.allowedJobs.length === 0) return true;
  return storage.allowedJobs.includes(job);
}

export function getStorageLabel(storage: CityStorage) {
  return `${storage.label} (${storage.slots} slots / ${storage.maxWeight} kg)`;
}
