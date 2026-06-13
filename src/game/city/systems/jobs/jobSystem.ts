import type { CityJob, CityJobType } from "../../types/city.types";

export function getJobById(jobs: CityJob[], id: CityJobType) {
  return jobs.find((job) => job.id === id);
}

export function canUseJobFeature(currentJob: CityJobType, allowedJobs: CityJobType[]) {
  return allowedJobs.includes(currentJob) || currentJob === "admin";
}
