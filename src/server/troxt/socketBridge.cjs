const { asObject, nowISO, publicError } = require('./utils.cjs')

function acknowledge(ack, payload) {
  if (typeof ack === 'function') {
    ack(payload)
  }
}

function registerTroxtSocketBridge(io, troxtAgent) {
  troxtAgent.healthMonitor.setSocketReady(true)

  troxtAgent.toolRegistry.setTransport({
    dispatch: async (tool, command) => {
      const socketId = tool.connection?.socketId
      if (!socketId) {
        const error = new Error(`Tool ${tool.id} has no active Socket.IO connection`)
        error.code = 'target_unavailable'
        throw error
      }

      io.to(socketId).emit('troxt:dispatch', command)
      troxtAgent.eventBus.publish('troxt.dispatch.sent', {
        jobId: command.jobId,
        dispatchId: command.dispatchId,
        targetId: tool.id,
        socketId,
      })
    },
  })

  troxtAgent.eventBus.on('*', (event) => {
    if (event.type.startsWith('troxt.job.')) {
      io.emit('troxt:job:update', event)
    }

    if (
      event.type === 'troxt.tool.registered'
      || event.type === 'troxt.tool.connected'
      || event.type === 'troxt.tool.disconnected'
      || event.type === 'troxt.agent.registered'
    ) {
      io.emit('troxt:registry:update', {
        event,
        registry: troxtAgent.registry(),
      })
    }
  })

  io.on('connection', (socket) => {
    socket.emit('troxt:ready', {
      ok: true,
      socketId: socket.id,
      service: 'troxt-agent',
      localOnly: true,
      time: nowISO(),
      registry: troxtAgent.registry(),
    })

    socket.on('troxt:register-tool', (payload = {}, ack) => {
      try {
        const body = asObject(payload)
        if (!body.toolId && !body.id) {
          acknowledge(ack, {
            ok: false,
            error: {
              code: 'tool_id_required',
              message: 'troxt:register-tool requires toolId or id.',
            },
          })
          return
        }

        const toolId = body.toolId || body.id
        troxtAgent.toolRegistry.register({
          id: toolId,
          name: body.name || toolId,
          description: body.description || 'External local TROXT tool adapter.',
          intents: body.intents || [],
          capabilities: body.capabilities || [],
          localOnly: true,
        })

        const tool = troxtAgent.toolRegistry.markConnected(toolId, {
          socketId: socket.id,
          connectedAt: nowISO(),
        })

        acknowledge(ack, {
          ok: true,
          tool,
        })
      } catch (error) {
        acknowledge(ack, {
          ok: false,
          error: publicError(error, 'tool_registration_failed'),
        })
      }
    })

    socket.on('troxt:register-agent', (payload = {}, ack) => {
      try {
        const body = asObject(payload)
        const agent = troxtAgent.agentRegistry.register({
          id: body.agentId || body.id,
          name: body.name,
          description: body.description,
          toolId: body.toolId,
          intents: body.intents || [],
          localOnly: true,
        })

        acknowledge(ack, {
          ok: true,
          agent,
        })
      } catch (error) {
        acknowledge(ack, {
          ok: false,
          error: publicError(error, 'agent_registration_failed'),
        })
      }
    })

    socket.on('troxt:command', (payload = {}, ack) => {
      const response = troxtAgent.submitCommand({
        ...asObject(payload),
        source: payload.source || `lab-engine:socket:${socket.id}`,
      })

      acknowledge(ack, response)
    })

    socket.on('troxt:result', (payload = {}, ack) => {
      const body = asObject(payload)
      const response = troxtAgent.receiveResult(body.jobId, body)
      acknowledge(ack, response)
    })

    socket.on('troxt:health', (payload, ack) => {
      acknowledge(ack, {
        ok: true,
        health: troxtAgent.health(),
      })
    })

    socket.on('disconnect', () => {
      troxtAgent.toolRegistry.markDisconnectedBySocket(socket.id)
    })
  })
}

module.exports = {
  registerTroxtSocketBridge,
}
