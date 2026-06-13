import { create } from 'zustand'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

interface SeasonState {
  currentSeason: Season
  weather: string
  setSeason: (season: Season) => void
  setWeather: (weather: string) => void
}

export const useSeasonStore = create<SeasonState>((set) => ({
  currentSeason: 'summer',
  weather: 'clear',
  setSeason: (currentSeason) => set({ currentSeason }),
  setWeather: (weather) => set({ weather }),
}))
