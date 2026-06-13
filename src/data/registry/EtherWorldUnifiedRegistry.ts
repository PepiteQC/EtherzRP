import BUILDINGS, { getBuildingDoors, type BuildingDef, type DoorZone, type JobDef } from '../quebecBuildings'
import { MODEL_DEFS, CATEGORIES, type ModelDef } from '../ObjectModels'
import { CITY_BUILDINGS } from '../city/buildings/cityBuildings'
import { CITY_JOBS } from '../city/jobs/cityJobs'
import type { CityBuilding, CityJob } from '../../game/city/types/city.types'

export interface UnifiedRegistrySnapshot {
  objectModels: ModelDef[]
  objectCategories: typeof CATEGORIES
  interactiveBuildings: BuildingDef[]
  buildingDoors: DoorZone[]
  jobs: Array<JobDef | CityJob>
  cityBuildings: CityBuilding[]
  stats: {
    objectModels: number
    categories: number
    interactiveBuildings: number
    cityBuildings: number
    jobs: number
    doors: number
  }
}

export function createEtherWorldUnifiedRegistry(): UnifiedRegistrySnapshot {
  const buildingDoors = getBuildingDoors()
  const interactiveJobs = BUILDINGS.map((b) => b.job).filter(Boolean) as JobDef[]
  const jobs = [...interactiveJobs, ...CITY_JOBS]

  return {
    objectModels: MODEL_DEFS,
    objectCategories: CATEGORIES,
    interactiveBuildings: BUILDINGS,
    buildingDoors,
    jobs,
    cityBuildings: CITY_BUILDINGS,
    stats: {
      objectModels: MODEL_DEFS.length,
      categories: CATEGORIES.length,
      interactiveBuildings: BUILDINGS.length,
      cityBuildings: CITY_BUILDINGS.length,
      jobs: jobs.length,
      doors: buildingDoors.length,
    },
  }
}

export const ETHERWORLD_UNIFIED_REGISTRY = createEtherWorldUnifiedRegistry()

export function findObjectModel(id: string) {
  return MODEL_DEFS.find((model) => model.id === id)
}

export function findUnifiedBuilding(id: string) {
  return CITY_BUILDINGS.find((b) => b.id === id) ?? BUILDINGS.find((b) => b.id === id)
}

export function findUnifiedJob(id: string) {
  return ETHERWORLD_UNIFIED_REGISTRY.jobs.find((job) => job.id === id)
}
