const { asObject, createId, normalizeText, nowISO } = require('./utils.cjs')

const ROUTE_RULES = [
  {
    intent: 'troxt.health',
    targetId: 'troxt-diagnostics',
    targetKind: 'tool',
    keywords: ['health', 'status', 'ping', 'diagnostic', 'diagnostics'],
  },
  {
    intent: 'code_lab.command',
    targetId: 'code-lab-agent',
    targetKind: 'agent',
    keywords: ['code', 'script', 'test', 'tsx', 'typescript', 'execute', 'patch', 'fix', 'compile'],
  },
  {
    intent: 'ethervision.command',
    targetId: 'ethervision-agent',
    targetKind: 'agent',
    keywords: ['vision', 'recognize', 'recognition', 'detect', 'scan', 'classify', 'analyse image', 'analyze image'],
  },
  {
    intent: 'visual_forge.command',
    targetId: 'visual-forge-agent',
    targetKind: 'agent',
    keywords: ['visual forge', 'forge', 'image to 3d', 'photo', 'asset', 'model', 'texture', 'material'],
  },
  {
    intent: 'builder.command',
    targetId: 'builder-agent',
    targetKind: 'agent',
    keywords: ['builder', 'build', 'scene', 'place', 'spawn', 'object', 'room', 'wall', 'door'],
  },
]

class CommandRouter {
  constructor(options = {}) {
    this.agentRegistry = options.agentRegistry
    this.toolRegistry = options.toolRegistry
    this.eventBus = options.eventBus
  }

  route(input) {
    const command = asObject(input)
    const text = normalizeText([
      command.intent,
      command.target,
      command.toolId,
      command.agentId,
      command.command,
      JSON.stringify(command.payload || {}),
    ].filter(Boolean).join(' '))

    const explicit = this.resolveExplicitTarget(command)
    if (explicit) {
      return this.createRoute(command, {
        ...explicit,
        confidence: 1,
        reason: 'explicit_target',
      })
    }

    const rule = ROUTE_RULES.find((candidate) => (
      candidate.intent === command.intent
      || candidate.keywords.some((keyword) => text.includes(keyword))
    ))

    if (rule) {
      return this.createRoute(command, {
        targetKind: rule.targetKind,
        targetId: rule.targetId,
        intent: command.intent || rule.intent,
        confidence: 0.82,
        reason: `keyword:${rule.intent}`,
      })
    }

    const registryAgent = this.agentRegistry?.findByIntent(command.intent)
    if (registryAgent) {
      return this.createRoute(command, {
        targetKind: 'agent',
        targetId: registryAgent.id,
        intent: command.intent,
        confidence: 0.74,
        reason: 'agent_registry_intent',
      })
    }

    const registryTool = this.toolRegistry?.findByIntent(command.intent)
    if (registryTool) {
      return this.createRoute(command, {
        targetKind: 'tool',
        targetId: registryTool.id,
        intent: command.intent,
        confidence: 0.7,
        reason: 'tool_registry_intent',
      })
    }

    return this.createRoute(command, {
      targetKind: 'tool',
      targetId: 'troxt-diagnostics',
      intent: command.intent || 'troxt.diagnostics',
      confidence: 0.35,
      reason: 'fallback_diagnostics',
    })
  }

  resolveExplicitTarget(command) {
    if (command.agentId) {
      const agent = this.agentRegistry?.get(command.agentId)
      if (agent) {
        return {
          targetKind: 'agent',
          targetId: agent.id,
          intent: command.intent || agent.intents[0] || 'agent.command',
        }
      }
    }

    if (command.toolId) {
      const tool = this.toolRegistry?.get(command.toolId)
      if (tool) {
        return {
          targetKind: 'tool',
          targetId: tool.id,
          intent: command.intent || tool.intents[0] || 'tool.command',
        }
      }
    }

    const target = normalizeText(command.target)
    if (!target) return null

    const agent = this.agentRegistry?.get(target)
    if (agent) {
      return {
        targetKind: 'agent',
        targetId: agent.id,
        intent: command.intent || agent.intents[0] || 'agent.command',
      }
    }

    const tool = this.toolRegistry?.get(target)
    if (tool) {
      return {
        targetKind: 'tool',
        targetId: tool.id,
        intent: command.intent || tool.intents[0] || 'tool.command',
      }
    }

    return null
  }

  createRoute(command, route) {
    const routed = {
      id: createId('route'),
      source: command.source || 'lab-engine',
      targetKind: route.targetKind,
      targetId: route.targetId,
      intent: route.intent || 'generic.command',
      confidence: route.confidence,
      reason: route.reason,
      createdAt: nowISO(),
    }

    this.eventBus?.publish('troxt.command.routed', routed)

    return routed
  }

  createDispatch(job, resolvedTarget) {
    return {
      type: 'troxt.dispatch.v1',
      jobId: job.id,
      requestId: job.requestId,
      source: job.command.source || 'lab-engine',
      intent: job.route.intent,
      target: resolvedTarget,
      rawCommand: job.command.command || null,
      payload: job.command.payload || {},
      metadata: {
        routeId: job.route.id,
        routeReason: job.route.reason,
        routeConfidence: job.route.confidence,
        localOnly: true,
        createdAt: nowISO(),
      },
    }
  }

  snapshot() {
    return {
      status: 'ready',
      rules: ROUTE_RULES.map((rule) => ({
        intent: rule.intent,
        targetId: rule.targetId,
        targetKind: rule.targetKind,
        keywords: rule.keywords,
      })),
    }
  }
}

module.exports = {
  CommandRouter,
}
