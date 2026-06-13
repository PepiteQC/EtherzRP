import { create } from "zustand";
import type { CityAccessLevel, CityJobType, CityStateSnapshot } from "../../game/city/types/city.types";

type CityStore = {
  playerAccess: CityAccessLevel;
  currentJob: CityJobType;
  snapshot: CityStateSnapshot | null;

  setPlayerAccess: (access: CityAccessLevel) => void;
  setCurrentJob: (job: CityJobType) => void;
  setSnapshot: (snapshot: CityStateSnapshot) => void;
};

export const useCityStore = create<CityStore>((set) => ({
  playerAccess: "admin",
  currentJob: "admin",
  snapshot: null,

  setPlayerAccess: (access) => set({ playerAccess: access }),
  setCurrentJob: (job) => set({ currentJob: job }),
  setSnapshot: (snapshot) => set({ snapshot }),
}));
