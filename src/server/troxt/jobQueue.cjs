const { createId, nowISO, publicError } = require('./utils.cjs')

class JobQueue {
  constructor(options = {}) {
    this.eventBus = options.eventBus
    this.executor = options.executor
    this.validator = options.validator
    this.concurrency = options.concurrency || 2
    this.jobTimeoutMs = options.jobTimeoutMs || 60000
    this.jobs = new Map()
    this.queue = []
    this.running = 0
  }

  enqueue(command, route) {
    const job = {
      id: createId('job'),
      requestId: command.requestId || createId('req'),
      command,
      route,
      status: 'queued',
      attempts: 0,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      startedAt: null,
      finishedAt: null,
      dispatchId: null,
      result: null,
      error: null,
      timeout: null,
    }

    this.jobs.set(job.id, job)
    this.queue.push(job.id)
    this.eventBus?.publish('troxt.job.queued', this.publicJob(job))
    this.process()

    return this.publicJob(job)
  }

  process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const jobId = this.queue.shift()
      const job = this.jobs.get(jobId)

      if (!job || job.status !== 'queued') continue

      this.run(job)
    }
  }

  async run(job) {
    this.running += 1
    job.status = 'running'
    job.attempts += 1
    job.startedAt = job.startedAt || nowISO()
    job.updatedAt = nowISO()
    this.eventBus?.publish('troxt.job.running', this.publicJob(job))

    try {
      const execution = await this.executor(job)

      if (execution?.pending) {
        job.status = 'waiting_result'
        job.dispatchId = execution.dispatchId || null
        job.updatedAt = nowISO()
        job.timeout = setTimeout(() => {
          this.fail(job.id, {
            code: 'target_timeout',
            message: 'The target did not return a result before the TROXT timeout.',
            details: {
              timeoutMs: this.jobTimeoutMs,
              targetId: job.route.targetId,
            },
          })
        }, this.jobTimeoutMs)
        this.eventBus?.publish('troxt.job.waiting_result', this.publicJob(job))
      } else {
        this.complete(job.id, execution)
      }
    } catch (error) {
      this.fail(job.id, publicError(error, 'job_execution_failed'))
    } finally {
      this.running -= 1
      this.process()
    }
  }

  complete(jobId, result) {
    const job = this.jobs.get(jobId)
    if (!job) {
      const error = new Error(`Unknown TROXT job: ${jobId}`)
      error.code = 'job_not_found'
      throw error
    }

    this.clearJobTimeout(job)
    const normalized = this.validator.normalizeResult(job, result)

    if (!normalized.ok) {
      return this.fail(jobId, normalized.error)
    }

    job.status = 'succeeded'
    job.result = {
      result: normalized.result,
      metrics: normalized.metrics,
      artifacts: normalized.artifacts,
    }
    job.error = null
    job.finishedAt = nowISO()
    job.updatedAt = nowISO()

    const publicJob = this.publicJob(job)
    this.eventBus?.publish('troxt.job.succeeded', publicJob)
    this.eventBus?.publish('troxt.job.result', publicJob)

    return publicJob
  }

  fail(jobId, error) {
    const job = this.jobs.get(jobId)
    if (!job) {
      return null
    }

    this.clearJobTimeout(job)
    job.status = 'failed'
    job.error = publicError(error, 'job_failed')
    job.finishedAt = nowISO()
    job.updatedAt = nowISO()

    const publicJob = this.publicJob(job)
    this.eventBus?.publish('troxt.job.failed', publicJob)
    this.eventBus?.publish('troxt.job.result', publicJob)

    return publicJob
  }

  cancel(jobId, reason = 'cancelled_by_lab') {
    const job = this.jobs.get(jobId)
    if (!job) return null

    if (['succeeded', 'failed', 'cancelled'].includes(job.status)) {
      return this.publicJob(job)
    }

    this.clearJobTimeout(job)
    this.queue = this.queue.filter((queuedId) => queuedId !== jobId)
    job.status = 'cancelled'
    job.error = {
      code: 'job_cancelled',
      message: reason,
    }
    job.finishedAt = nowISO()
    job.updatedAt = nowISO()

    const publicJob = this.publicJob(job)
    this.eventBus?.publish('troxt.job.cancelled', publicJob)

    return publicJob
  }

  get(jobId) {
    const job = this.jobs.get(jobId)
    return job ? this.publicJob(job) : null
  }

  list(options = {}) {
    const status = options.status
    const limit = Math.max(1, Math.min(Number(options.limit || 50), 200))

    return Array.from(this.jobs.values())
      .filter((job) => !status || job.status === status)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, limit)
      .map((job) => this.publicJob(job))
  }

  clearJobTimeout(job) {
    if (job.timeout) {
      clearTimeout(job.timeout)
      job.timeout = null
    }
  }

  publicJob(job) {
    return {
      id: job.id,
      requestId: job.requestId,
      status: job.status,
      route: job.route,
      command: {
        source: job.command.source || 'lab-engine',
        intent: job.command.intent || null,
        target: job.command.target || null,
        toolId: job.command.toolId || null,
        agentId: job.command.agentId || null,
        command: job.command.command || null,
        payload: job.command.payload || {},
      },
      attempts: job.attempts,
      dispatchId: job.dispatchId,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    }
  }

  snapshot() {
    const jobs = Array.from(this.jobs.values())
    const byStatus = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {})

    return {
      status: 'ready',
      queued: this.queue.length,
      running: this.running,
      total: jobs.length,
      byStatus,
      concurrency: this.concurrency,
      jobTimeoutMs: this.jobTimeoutMs,
    }
  }
}

module.exports = {
  JobQueue,
}
