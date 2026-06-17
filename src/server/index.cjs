try {
  require('dotenv').config()
} catch (error) {
  console.warn('[Server] dotenv not available, continuing with process env only.')
}

const express = require('express')
const http = require('http')

function createCorsMiddleware(options = {}) {
  try {
    const cors = require('cors')
    return cors(options)
  } catch (error) {
    const allowedOrigin = options.origin || '*'
    return (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')

      if (req.method === 'OPTIONS') {
        res.status(204).end()
        return
      }

      next()
    }
  }
}

const {
  initFirebaseAdmin,
  isFirebaseReady,
  getFirebaseError,
} = require('./firebaseAdmin.cjs')

const playerRoutes = require('./routes/player.routes.cjs')
const worldRoutes = require('./routes/world.routes.cjs')
const accessRoutes = require('./routes/access.routes.cjs')
const doorsRoutes = require('./routes/doors.routes.cjs')
const { registerSocketServer } = require('./socket/socketServer.cjs')
const { createTroxtAgent } = require('./troxt/index.cjs')

const PORT = Number(process.env.PORT || 4000)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

initFirebaseAdmin()

const app = express()
const server = http.createServer(app)
const troxtAgent = createTroxtAgent()

app.use(createCorsMiddleware({
  origin: CLIENT_ORIGIN,
  credentials: true,
}))

app.use(express.json({ limit: '2mb' }))

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'etherworld-rp-server',
    port: PORT,
    firebaseAdmin: isFirebaseReady(),
    firebaseError: getFirebaseError(),
    troxt: troxtAgent.health(),
    live: true,
    time: new Date().toISOString(),
  })
})

app.use('/api/player', playerRoutes)
app.use('/api/world', worldRoutes)
app.use('/api/access', accessRoutes)
app.use('/api/doors', doorsRoutes)
app.use('/api/troxt', troxtAgent.httpRouter)

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'route_not_found',
    path: req.path,
  })
})

const socketRuntime = registerSocketServer(server, {
  origin: CLIENT_ORIGIN,
})

troxtAgent.attachSocket(socketRuntime.io)

server.listen(PORT, () => {
  console.log('')
  console.log('======================================')
  console.log(' EtherWorld RP server online')
  console.log(` URL: http://localhost:${PORT}`)
  console.log(` Health: http://localhost:${PORT}/health`)
  console.log(` Firebase Admin: ${isFirebaseReady() ? 'READY' : 'OFF'}`)
  console.log('======================================')
  console.log('')
})
