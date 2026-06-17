const { AgentRegistry } = require('./agentRegistry.cjs')
const { CommandRouter } = require('./commandRouter.cjs')
const { TroxtEventBus } = require('./eventBus.cjs')
const { HealthMonitor } = require('./healthMonitor.cjs')
const { createTroxtHttpRouter } = require('./httpApi.cjs')
const { JobQueue } = require('./jobQueue.cjs')
const { ResultValidator } = require('./resultValidator.cjs')
const { registerTroxtSocketBridge } = require('./socketBridge.cjs')
const { publicError } = require('./utils.cjs')
const { ToolRegistry } = require('./toolRegistry.cjs')

class TroxtAgent {
  constructor(options = {}) {
    this.eventBus = new TroxtEventBus({ maxHistory: options.maxHistory })
    this.resultValidator = new ResultValidator()
    this.agentRegistry = new AgentRegistry({ eventBus: this.eventBus })
    this.toolRegistry = new ToolRegistry({ eventBus: this.eventBus })
    this.commandRouter = new CommandRouter({
      agentRegistry: this.agentRegistry,
      toolRegistry: this.toolRegistry,
      eventBus: this.eventBus,
    })
    this.jobQueue = new JobQueue({
      eventBus: this.eventBus,
      validator: this.resultValidator,
      executor: (job) => this.executeJob(job),
      concurrency: options.concurrency || 2,
      jobTimeoutMs: options.jobTimeoutMs || 60000,
    })
    this.healthMonitor = new HealthMonitor({
      router: this.commandRouter,
      agentRegistry: this.agentRegistry,
      toolRegistry: this.toolRegistry,
      jobQueue: this.jobQueue,
      eventBus: this.eventBus,
    })
    this.httpRouter = createTroxtHttpRouter(this)
    this.socketAttached = false
  }

  submitCommand(input) {
    const validation = this.resultValidator.validateCommand(input)

    if (!validation.ok) {
      this.eventBus.publish('troxt.command.rejected', validation.error)
      return {
        ok: false,
        status: 'rejected',
        error: validation.error,
      }
    }

    const route = this.commandRouter.route(validation.command)
    const job = this.jobQueue.enqueue(validation.command, route)

    return {
      ok: true,
      status: 'accepted',
      job,
      route,
    }
  }

  async executeJob(job) {
    const route = job.route
    let targetToolId = route.targetId
    let dispatchTarget = {
      kind: route.targetKind,
      id: route.targetId,
    }

    if (route.targetKind === 'agent') {
      const agent = this.agentRegistry.get(route.targetId)
      if (!agent) {
        const error = new Error(`Unknown TROXT agent: ${route.targetId}`)
        error.code = 'agent_unknown'
        throw error
      }

      targetToolId = agent.toolId
      dispatchTarget = {
        kind: 'agent',
        id: agent.id,
        toolId: agent.toolId,
      }
    }

    const dispatch = this.commandRouter.createDispatch(job, dispatchTarget)
    this.eventBus.publish('troxt.dispatch.created', {
      jobId: job.id,
      target: dispatchTarget,
      intent: dispatch.intent,
    })

    return this.toolRegistry.execute(targetToolId, dispatch)
  }

  receiveResult(jobId, result) {
    if (!jobId) {
      return {
        ok: false,
        statusCode: 400,
        error: {
          code: 'job_id_required',
          message: 'A TROXT result must include a jobId.',
        },
      }
    }

    if (result?.jobId && result.jobId !== jobId) {
      return {
        ok: false,
        statusCode: 400,
        error: {
          code: 'job_id_mismatch',
          message: 'The result jobId does not match the TROXT job path.',
          details: {
            expected: jobId,
            received: result.jobId,
          },
        },
      }
    }

    const existing = this.jobQueue.get(jobId)
    if (!existing) {
      return {
        ok: false,
        statusCode: 404,
        error: {
          code: 'job_not_found',
          message: `Unknown TROXT job: ${jobId}`,
        },
      }
    }

    try {
      const job = this.jobQueue.complete(jobId, {
        ...result,
        jobId,
      })

      return {
        ok: true,
        status: 'recorded',
        job,
      }
    } catch (error) {
      return {
        ok: false,
        statusCode: 400,
        error: publicError(error, 'result_rejected'),
      }
    }
  }

  attachSocket(io) {
    if (this.socketAttached) return
    registerTroxtSocketBridge(io, this)
    this.socketAttached = true
  }

  registry() {
    return {
      agents: this.agentRegistry.list(),
      tools: this.toolRegistry.list(),
    }
  }

  health() {
    return this.healthMonitor.snapshot()
  }
}

module.exports = {
  TroxtAgent,
}
