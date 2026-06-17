const { EventEmitter } = require('events')
const { createId, nowISO } = require('./utils.cjs')

class TroxtEventBus extends EventEmitter {
  constructor(options = {}) {
    super()
    this.maxHistory = options.maxHistory || 200
    this.history = []
    this.setMaxListeners(100)
  }

  publish(type, payload = {}) {
    const event = {
      id: createId('evt'),
      type,
      payload,
      createdAt: nowISO(),
    }

    this.history.unshift(event)
    if (this.history.length > this.maxHistory) {
      this.history.length = this.maxHistory
    }

    this.emit(type, event)
    this.emit('*', event)

    return event
  }

  recent(limit = 50, type) {
    const events = type
      ? this.history.filter((event) => event.type === type)
      : this.history

    return events.slice(0, limit)
  }

  snapshot() {
    return {
      status: 'ready',
      recentEvents: this.history.length,
      maxHistory: this.maxHistory,
    }
  }
}

module.exports = {
  TroxtEventBus,
}
