class HealthMonitor {
  constructor(options = {}) {
    this.router = options.router
    this.agentRegistry = options.agentRegistry
    this.toolRegistry = options.toolRegistry
    this.jobQueue = options.jobQueue
    this.eventBus = options.eventBus
    this.httpReady = false
    this.socketReady = false
  }

  setHttpReady(ready) {
    this.httpReady = Boolean(ready)
  }

  setSocketReady(ready) {
    this.socketReady = Boolean(ready)
  }

  snapshot() {
    const tools = this.toolRegistry?.list() || []
    const requiredTargets = ['builder', 'visual-forge', 'code-lab', 'ethervision']
    const offlineTargets = requiredTargets.filter((toolId) => {
      const tool = tools.find((candidate) => candidate.id === toolId)
      return !tool?.connected
    })

    return {
      ok: true,
      service: 'troxt-agent',
      role: 'local-orchestrator',
      status: offlineTargets.length === 0 ? 'ready' : 'degraded',
      localOnly: true,
      ownsScene3D: false,
      ownsBuilder: false,
      components: {
        commandRouter: this.router?.snapshot() || { status: 'unknown' },
        agentRegistry: this.agentRegistry?.snapshot() || { status: 'unknown' },
        toolRegistry: this.toolRegistry?.snapshot() || { status: 'unknown' },
        jobQueue: this.jobQueue?.snapshot() || { status: 'unknown' },
        eventBus: this.eventBus?.snapshot() || { status: 'unknown' },
        resultValidator: { status: 'ready' },
        httpApi: { status: this.httpReady ? 'ready' : 'not_attached' },
        socketBridge: { status: this.socketReady ? 'ready' : 'not_attached' },
      },
      targets: {
        required: requiredTargets,
        offline: offlineTargets,
      },
      boundaries: {
        labEngineOwns: [
          'scene_3d',
          'builder_implementation',
          'visual_forge_implementation',
          'mesh_engines',
          'recognition_engines',
          'exports',
          'react_interface',
        ],
        troxtOwns: [
          'command_router',
          'agent_registry',
          'tool_registry',
          'job_queue',
          'event_bus',
          'health_monitor',
          'result_validator',
          'http_api',
          'socket_io_bridge',
        ],
      },
    }
  }
}

module.exports = {
  HealthMonitor,
}
