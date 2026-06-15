const express = require('express')
const { getDb, isFirebaseReady } = require('../firebaseAdmin.cjs')
const { verifyFirebaseToken, requireAdmin } = require('../middleware/verifyFirebaseToken.cjs')

const router = express.Router()

function nowISO() {
  return new Date().toISOString()
}

const fallbackWorld = {
  weather: 'clear',
  time: '14:32',
  zone: 'Route 138 - Quebec',
  region: 'Portneuf',
  onlinePlayers: 0,
  serverMessage: 'Bienvenue sur EtherWorld RP Quebec',
}

router.get('/state', async (req, res) => {
  try {
    if (!isFirebaseReady()) {
      return res.json({
        ok: true,
        source: 'local_fallback',
        world: fallbackWorld,
      })
    }

    const db = getDb()
    const snap = await db.collection('worldState').doc('global').get()

    return res.json({
      ok: true,
      source: 'firestore',
      world: snap.exists ? snap.data() : fallbackWorld,
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'world_state_failed',
      message: error && error.message ? error.message : String(error),
    })
  }
})

router.post('/state', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const db = getDb()

    const payload = {
      weather: req.body.weather || 'clear',
      time: req.body.time || '14:32',
      zone: req.body.zone || 'Route 138 - Quebec',
      region: req.body.region || 'Portneuf',
      serverMessage: req.body.serverMessage || '',
      updatedBy: req.user.uid,
      updatedAt: nowISO(),
    }

    await db.collection('worldState').doc('global').set(payload, { merge: true })

    return res.json({
      ok: true,
      world: payload,
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'world_update_failed',
      message: error && error.message ? error.message : String(error),
    })
  }
})

module.exports = router
