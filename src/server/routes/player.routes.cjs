const express = require('express')
const { getDb } = require('../firebaseAdmin.cjs')
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken.cjs')

const router = express.Router()

function nowISO() {
  return new Date().toISOString()
}

function safeNumber(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function safePosition(position) {
  return {
    x: safeNumber(position && position.x, 0),
    y: safeNumber(position && position.y, 0),
    z: safeNumber(position && position.z, 0),
  }
}

router.get('/load', verifyFirebaseToken, async (req, res) => {
  try {
    const db = getDb()
    const uid = req.user.uid

    const snap = await db.collection('players').doc(uid).get()

    if (!snap.exists) {
      return res.json({
        ok: true,
        exists: false,
        player: {
          uid,
          name: req.user.name || 'Citoyen',
          email: req.user.email,
          health: 100,
          armor: 0,
          stamina: 100,
          hunger: 100,
          thirst: 100,
          cash: 500,
          bank: 0,
          job: 'Citoyen',
          rank: 'Civil',
          role: req.user.role || 'citizen',
          zone: 'Quebec',
          position: { x: 0, y: 1, z: 0 },
          createdAt: nowISO(),
        },
      })
    }

    return res.json({
      ok: true,
      exists: true,
      player: snap.data(),
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'player_load_failed',
      message: error && error.message ? error.message : String(error),
    })
  }
})

router.post('/save', verifyFirebaseToken, async (req, res) => {
  try {
    const db = getDb()
    const uid = req.user.uid

    const payload = {
      uid,
      email: req.user.email || null,
      name: req.body.name || req.user.name || 'Citoyen',

      position: safePosition(req.body.position),
      rotation: safePosition(req.body.rotation),

      health: safeNumber(req.body.health, 100),
      armor: safeNumber(req.body.armor, 0),
      stamina: safeNumber(req.body.stamina, 100),
      hunger: safeNumber(req.body.hunger, 100),
      thirst: safeNumber(req.body.thirst, 100),

      cash: safeNumber(req.body.cash, 0),
      bank: safeNumber(req.body.bank, 0),

      job: req.body.job || 'Citoyen',
      rank: req.body.rank || 'Civil',
      role: req.body.role || req.user.role || 'citizen',
      zone: req.body.zone || 'Quebec',

      updatedAt: nowISO(),
    }

    await db.collection('players').doc(uid).set(payload, { merge: true })

    return res.json({
      ok: true,
      player: payload,
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'player_save_failed',
      message: error && error.message ? error.message : String(error),
    })
  }
})

module.exports = router
