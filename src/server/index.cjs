require('dotenv').config()

const express = require('express')
const cors = require('cors')
const http = require('http')

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

const PORT = Number(process.env.PORT || 4000)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

initFirebaseAdmin()

const app = express()
const server = http.createServer(app)

app.use(cors({
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
    live: true,
    time: new Date().toISOString(),
  })
})

app.use('/api/player', playerRoutes)
app.use('/api/world', worldRoutes)
app.use('/api/access', accessRoutes)
app.use('/api/doors', doorsRoutes)

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'route_not_found',
    path: req.path,
  })
})

registerSocketServer(server, {
  origin: CLIENT_ORIGIN,
})

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
