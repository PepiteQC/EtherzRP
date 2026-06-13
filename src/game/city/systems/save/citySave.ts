import type { CityStateSnapshot } from "../../types/city.types";

const STORAGE_KEY = "etherworld.city.snapshot";

export function saveCitySnapshot(snapshot: CityStateSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadCitySnapshot(): CityStateSnapshot | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CityStateSnapshot;
  } catch {
    return null;
  }
}
