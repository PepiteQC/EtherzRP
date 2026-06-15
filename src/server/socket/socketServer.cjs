const { Server } = require('socket.io')

function nowISO() {
  return new Date().toISOString()
}

function registerSocketServer(server, options = {}) {
  const io = new Server(server, {
    cors: {
      origin: options.origin || 'http://localhost:5173',
      credentials: true,
    },
  })

  const onlinePlayers = new Map()

  io.on('connection', (socket) => {
    console.log('[Socket] connected:', socket.id)

    socket.emit('server:ready', {
      ok: true,
      socketId: socket.id,
      time: nowISO(),
    })

    socket.on('player:join', (payload = {}) => {
      const player = {
        socketId: socket.id,
        uid: payload.uid || socket.id,
        name: payload.name || 'Citoyen',
        zone: payload.zone || 'Quebec',
        position: payload.position || { x: 0, y: 1, z: 0 },
        rotation: payload.rotation || { x: 0, y: 0, z: 0 },
        vehicleId: payload.vehicleId || null,
        joinedAt: nowISO(),
      }

      onlinePlayers.set(socket.id, player)

      io.emit('players:online', {
        count: onlinePlayers.size,
        players: Array.from(onlinePlayers.values()),
      })
    })

    socket.on('player:move', (payload = {}) => {
      const player = onlinePlayers.get(socket.id)

      if (!player) return

      player.position = payload.position || player.position
      player.rotation = payload.rotation || player.rotation
      player.zone = payload.zone || player.zone
      player.vehicleId = payload.vehicleId || null
      player.updatedAt = nowISO()

      socket.broadcast.emit('player:moved', player)
    })

    socket.on('door:event', (payload = {}) => {
      io.emit('door:event', {
        doorId: payload.doorId || 'unknown_door',
        zone: payload.zone || 'unknown',
        action: payload.action || 'unknown',
        open: Boolean(payload.open),
        locked: Boolean(payload.locked),
        createdAt: nowISO(),
      })
    })

    socket.on('rp:alert', (payload = {}) => {
      io.emit('rp:alert', {
        type: payload.type || 'info',
        message: payload.message || 'Alerte RP',
        zone: payload.zone || 'Quebec',
        createdAt: nowISO(),
      })
    })

    socket.on('disconnect', () => {
      onlinePlayers.delete(socket.id)

      io.emit('players:online', {
        count: onlinePlayers.size,
        players: Array.from(onlinePlayers.values()),
      })

      console.log('[Socket] disconnected:', socket.id)
    })
  })

  return {
    io,
    onlinePlayers,
  }
}

module.exports = {
  registerSocketServer,
}
