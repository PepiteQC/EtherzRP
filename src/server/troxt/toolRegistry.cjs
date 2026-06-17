const {
  asObject,
  createId,
  normalizeText,
  nowISO,
  publicError,
  toArray,
} = require('./utils.cjs')

const DEFAULT_TOOLS = [
  {
    id: 'builder',
    name: 'Builder',
    description: 'External lab builder adapter. TROXT only dispatches commands to it.',
    intents: ['builder.command', 'scene.build', 'asset.place'],
    capabilities: ['build_scene', 'place_object', 'update_object', 'remove_object'],
    localOnly: true,
  },
  {
    id: 'visual-forge',
    name: 'Visual Forge',
    description: 'External visual asset generation adapter.',
    intents: ['visual_forge.command', 'asset.generate', 'image.to_3d'],
    capabilities: ['analyze_source', 'generate_asset', 'prepare_model_request'],
    localOnly: true,
  },
  {
    id: 'code-lab',
    name: 'Code Lab',
    description: 'External local code lab adapter.',
    intents: ['code_lab.command', 'code.execute', 'code.patch'],
    capabilities: ['run_code', 'test_code', 'inspect_workspace'],
    localOnly: true,
  },
  {
    id: 'ethervision',
    name: 'EtherVision',
    description: 'External local recognition adapter.',
    intents: ['ethervision.command', 'vision.analyze', 'subject.detect'],
    capabilities: ['detect_subject', 'classify_image', 'validate_visual_result'],
    localOnly: true,
  },
  {
    id: 'troxt-prisma',
    name: 'TroxTPrisma',
    description: 'External local scene styling and composition adapter.',
    intents: ['troxt_prisma.command', 'scene.refine', 'palette.compose'],
    capabilities: ['compose_palette', 'refine_scene', 'suggest_material_pass'],
    localOnly: true,
  },
  {
    id: 'troxt-diagnostics',
    name: 'TROXT Diagnostics',
    description: 'Built-in local diagnostics tool for smoke tests and health checks.',
    intents: ['troxt.health', 'troxt.diagnostics'],
    capabilities: ['health_check', 'echo_command'],
    localOnly: true,
    handler: async (command) => ({
      ok: true,
      status: 'succeeded',
      result: {
        echo: command.payload || {},
        message: 'TROXT diagnostics completed locally.',
      },
    }),
  },
]

class ToolRegistry {
  constructor(options = {}) {
    this.eventBus = options.eventBus
    this.tools = new Map()
    this.transport = null

    DEFAULT_TOOLS.forEach((tool) => this.register(tool))
  }

  setTransport(transport) {
    this.transport = transport
  }

  register(toolDefinition) {
    const tool = {
      ...asObject(toolDefinition),
      intents: toArray(toolDefinition.intents),
      capabilities: toArray(toolDefinition.capabilities),
      status: toolDefinition.status || 'registered',
      connection: toolDefinition.connection || null,
      registeredAt: toolDefinition.registeredAt || nowISO(),
      updatedAt: nowISO(),
    }

    if (!tool.id) {
      throw new Error('tool_registry_missing_id')
    }

    const previous = this.tools.get(tool.id)
    if (previous?.handler && !tool.handler) {
      tool.handler = previous.handler
    }
    if (previous?.connection && !tool.connection) {
      tool.connection = previous.connection
    }

    this.tools.set(tool.id, tool)
    this.eventBus?.publish('troxt.tool.registered', {
      toolId: tool.id,
      capabilities: tool.capabilities,
    })

    return this.publicTool(tool)
  }

  get(toolId) {
    return this.tools.get(toolId) || null
  }

  list() {
    return Array.from(this.tools.values()).map((tool) => this.publicTool(tool))
  }

  publicTool(tool) {
    return {
      id: tool.id,
      name: tool.name,
      description: tool.description,
      intents: tool.intents,
      capabilities: tool.capabilities,
      status: tool.status,
      connected: Boolean(tool.connection || tool.handler),
      connection: tool.connection
        ? {
            socketId: tool.connection.socketId,
            connectedAt: tool.connection.connectedAt,
            lastSeenAt: tool.connection.lastSeenAt,
          }
        : null,
      localOnly: Boolean(tool.localOnly),
      registeredAt: tool.registeredAt,
      updatedAt: tool.updatedAt,
    }
  }

  findByIntent(intent) {
    const normalizedIntent = normalizeText(intent)
    if (!normalizedIntent) return null

    return Array.from(this.tools.values()).find((tool) => (
      tool.intents.some((candidate) => (
        normalizedIntent === normalizeText(candidate)
        || normalizedIntent.startsWith(`${normalizeText(candidate)}.`)
        || normalizeText(candidate).startsWith(`${normalizedIntent}.`)
      ))
    )) || null
  }

  markConnected(toolId, connection) {
    const existing = this.get(toolId)
    const tool = existing || this.register({
      id: toolId,
      name: toolId,
      intents: [],
      capabilities: [],
      localOnly: true,
    })

    const nextTool = this.tools.get(tool.id || toolId)
    nextTool.status = 'connected'
    nextTool.connection = {
      socketId: connection.socketId,
      connectedAt: connection.connectedAt || nowISO(),
      lastSeenAt: nowISO(),
    }
    nextTool.updatedAt = nowISO()

    this.eventBus?.publish('troxt.tool.connected', {
      toolId,
      socketId: nextTool.connection.socketId,
    })

    return this.publicTool(nextTool)
  }

  markDisconnectedBySocket(socketId) {
    const disconnected = []

    this.tools.forEach((tool) => {
      if (tool.connection?.socketId === socketId) {
        tool.connection = null
        tool.status = 'registered'
        tool.updatedAt = nowISO()
        disconnected.push(tool.id)
      }
    })

    if (disconnected.length > 0) {
      this.eventBus?.publish('troxt.tool.disconnected', {
        socketId,
        toolIds: disconnected,
      })
    }

    return disconnected
  }

  async execute(toolId, command) {
    const tool = this.get(toolId)

    if (!tool) {
      const error = new Error(`Unknown TROXT tool: ${toolId}`)
      error.code = 'target_unknown'
      throw error
    }

    if (tool.handler) {
      try {
        return await tool.handler(command)
      } catch (error) {
        return {
          ok: false,
          status: 'failed',
          error: publicError(error, 'tool_handler_failed'),
        }
      }
    }

    if (!tool.connection || !this.transport?.dispatch) {
      const error = new Error(`Tool ${toolId} is not connected to TROXT`)
      error.code = 'target_unavailable'
      error.details = {
        toolId,
        expected: 'socket tool adapter or local handler',
      }
      throw error
    }

    const dispatchId = createId('dispatch')
    await this.transport.dispatch(tool, {
      ...command,
      dispatchId,
    })

    tool.connection.lastSeenAt = nowISO()
    tool.updatedAt = nowISO()

    return {
      ok: true,
      status: 'waiting_result',
      pending: true,
      dispatchId,
      targetId: tool.id,
    }
  }

  snapshot() {
    return {
      status: 'ready',
      count: this.tools.size,
      tools: this.list(),
    }
  }
}

module.exports = {
  ToolRegistry,
}
