// ════════════════════════════════════════════════════════════════
// GAME STATE — Système de jobs & argent
// ════════════════════════════════════════════════════════════════

export interface ActiveJob {
  id: string
  title: string
  emoji: string
  reward: number
  progress: number       // 0 → 1
  startedAt: number
  durationMs: number
}

interface GameStateInternal {
  money: number
  activeJob: ActiveJob | null
  jobCooldowns: Record<string, number>  // id → timestamp fin cooldown
}

const state: GameStateInternal = {
  money: 2500,
  activeJob: null,
  jobCooldowns: {},
}

const listeners: Array<() => void> = []

function notify() {
  listeners.forEach(fn => fn())
}

export function getState() {
  return { ...state }
}

export function subscribe(fn: () => void) {
  listeners.push(fn)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx !== -1) listeners.splice(idx, 1)
  }
}

// ── ARGENT ──

export function addMoney(amount: number) {
  state.money += amount
  notify()
}

// ── JOBS ──

export interface JobDef {
  id: string
  title: string
  emoji: string
  reward: number
  durationMs?: number
  cooldownMs?: number
}

export function canStartJob(jobId: string): boolean {
  if (state.activeJob) return false
  const cd = state.jobCooldowns[jobId]
  if (!cd) return true
  return Date.now() >= cd
}

export function getJobCooldownSec(jobId: string): number {
  const cd = state.jobCooldowns[jobId]
  if (!cd) return 0
  const remaining = Math.ceil((cd - Date.now()) / 1000)
  return Math.max(0, remaining)
}

export function startJob(job: JobDef) {
  if (!canStartJob(job.id)) return

  const duration = job.durationMs ?? 8000

  state.activeJob = {
    id: job.id,
    title: job.title,
    emoji: job.emoji,
    reward: job.reward,
    progress: 0,
    startedAt: Date.now(),
    durationMs: duration,
  }

  notify()

  // Progression automatique
  const interval = setInterval(() => {
    if (!state.activeJob || state.activeJob.id !== job.id) {
      clearInterval(interval)
      return
    }

    const elapsed = Date.now() - state.activeJob.startedAt
    const progress = Math.min(elapsed / duration, 1)
    state.activeJob.progress = progress

    if (progress >= 1) {
      clearInterval(interval)
      completeJob(job)
    } else {
      notify()
    }
  }, 100)
}

function completeJob(job: JobDef) {
  state.money += job.reward
  state.activeJob = null
  // Cooldown de 60 secondes par défaut
  state.jobCooldowns[job.id] = Date.now() + (job.cooldownMs ?? 60000)
  notify()
}

export function getActiveJob(): ActiveJob | null {
  return state.activeJob
}