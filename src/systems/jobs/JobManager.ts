import { JobRegistry } from "./JobRegistry";
import type { JobId, JobRank, PlayerJob } from "./types";

interface CommandResultLike {
  success: boolean;
  message: string;
}

const rankOrder: JobRank[] = ["recruit", "junior", "senior", "chief", "boss"];

function salaryFor(jobId: JobId, rank: JobRank): number {
  const job = JobRegistry.get(jobId);
  if (!job) return 0;

  const rankIndex = Math.max(0, rankOrder.indexOf(rank));
  return job.salaryBase + job.salaryPerRank * rankIndex;
}

function createDefaultJob(uid: string): PlayerJob {
  return {
    uid,
    jobId: "unemployed",
    rank: "recruit",
    isOnDuty: false,
    dutyStartTime: null,
    totalDutyTime: 0,
    salary: 0,
  };
}

export class JobManager {
  private static dutyCache = new Map<string, PlayerJob>();

  static getCache(uid?: string): PlayerJob | undefined {
    if (!uid) {
      return undefined;
    }

    return JobManager.dutyCache.get(uid);
  }

  static setCache(uid: string, entry: Partial<Omit<PlayerJob, "uid">> = {}): PlayerJob {
    const current = JobManager.dutyCache.get(uid) ?? createDefaultJob(uid);
    const jobId = entry.jobId ?? current.jobId;
    const rank = entry.rank ?? current.rank;
    const next: PlayerJob = {
      ...current,
      uid,
      ...entry,
      jobId,
      rank,
      salary: entry.salary ?? salaryFor(jobId, rank),
    };

    JobManager.dutyCache.set(uid, next);
    return next;
  }

  static async assignJob(uid: string, jobId: JobId, rank: JobRank = "recruit"): Promise<CommandResultLike> {
    const job = JobRegistry.get(jobId);
    if (!job) {
      return {
        success: false,
        message: `Job "${jobId}" introuvable`,
      };
    }

    JobManager.setCache(uid, {
      jobId,
      rank,
      isOnDuty: false,
      dutyStartTime: null,
      salary: salaryFor(jobId, rank),
    });

    return {
      success: true,
      message: `${uid} est maintenant ${job.label} (${rank})`,
    };
  }

  static startDuty(uid: string, jobId?: JobId, rank?: JobRank): PlayerJob {
    const current = JobManager.dutyCache.get(uid) ?? createDefaultJob(uid);
    const nextJobId = jobId ?? current.jobId;
    const nextRank = rank ?? current.rank;

    return JobManager.setCache(uid, {
      jobId: nextJobId,
      rank: nextRank,
      isOnDuty: true,
      dutyStartTime: Date.now(),
      salary: salaryFor(nextJobId, nextRank),
    });
  }

  static endDuty(uid: string): PlayerJob | undefined {
    const current = JobManager.dutyCache.get(uid);
    if (!current) return undefined;

    const dutyMinutes =
      current.dutyStartTime === null ? 0 : Math.floor((Date.now() - current.dutyStartTime) / 60000);

    return JobManager.setCache(uid, {
      isOnDuty: false,
      dutyStartTime: null,
      totalDutyTime: current.totalDutyTime + dutyMinutes,
    });
  }

  static clearCache(uid?: string): void {
    if (uid) {
      JobManager.dutyCache.delete(uid);
      return;
    }

    JobManager.dutyCache.clear();
  }

  static getAll(): PlayerJob[] {
    return Array.from(JobManager.dutyCache.values());
  }
}

export default JobManager;
