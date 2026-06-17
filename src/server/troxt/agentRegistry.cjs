const { asObject, normalizeText, nowISO, toArray } = require('./utils.cjs')

const DEFAULT_AGENTS = [
  {
    id: 'builder-agent',
    name: 'Builder Agent',
    description: 'Routes scene and object build requests to the external builder.',
    toolId: 'builder',
    intents: ['builder.command', 'scene.build', 'asset.place'],
    localOnly: true,
  },
  {
    id: 'visual-forge-agent',
    name: 'Visual Forge Agent',
    description: 'Routes visual asset generation requests to Visual Forge.',
    toolId: 'visual-forge',
    intents: ['visual_forge.command', 'asset.generate', 'image.to_3d'],
    localOnly: true,
  },
  {
    id: 'code-lab-agent',
    name: 'Code Lab Agent',
    description: 'Routes code execution and patch requests to Code Lab.',
    toolId: 'code-lab',
    intents: ['code_lab.command', 'code.execute', 'code.patch'],
    localOnly: true,
  },
  {
    id: 'ethervision-agent',
    name: 'EtherVision Agent',
    description: 'Routes recognition and analysis requests to EtherVision.',
    toolId: 'ethervision',
    intents: ['ethervision.command', 'vision.analyze', 'subject.detect'],
    localOnly: true,
  },
]

class AgentRegistry {
  constructor(options = {}) {
    this.eventBus = options.eventBus
    this.agents = new Map()

    DEFAULT_AGENTS.forEach((agent) => this.register(agent))
  }

  register(agentDefinition) {
    const agent = {
      ...asObject(agentDefinition),
      intents: toArray(agentDefinition.intents),
      status: agentDefinition.status || 'available',
      registeredAt: agentDefinition.registeredAt || nowISO(),
      updatedAt: nowISO(),
    }

    if (!agent.id) {
      throw new Error('agent_registry_missing_id')
    }

    this.agents.set(agent.id, agent)
    this.eventBus?.publish('troxt.agent.registered', {
      agentId: agent.id,
      toolId: agent.toolId,
    })

    return agent
  }

  get(agentId) {
    return this.agents.get(agentId) || null
  }

  list() {
    return Array.from(this.agents.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      toolId: agent.toolId,
      intents: agent.intents,
      status: agent.status,
      localOnly: Boolean(agent.localOnly),
      registeredAt: agent.registeredAt,
      updatedAt: agent.updatedAt,
    }))
  }

  findByIntent(intent) {
    const normalizedIntent = normalizeText(intent)
    if (!normalizedIntent) return null

    return Array.from(this.agents.values()).find((agent) => (
      agent.intents.some((candidate) => (
        normalizedIntent === normalizeText(candidate)
        || normalizedIntent.startsWith(`${normalizeText(candidate)}.`)
        || normalizeText(candidate).startsWith(`${normalizedIntent}.`)
      ))
    )) || null
  }

  snapshot() {
    return {
      status: 'ready',
      count: this.agents.size,
      agents: this.list(),
    }
  }
}

module.exports = {
  AgentRegistry,
}
