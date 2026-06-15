const express = require('express')
const { getDb } = require('../firebaseAdmin.cjs')
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken.cjs')

const router = express.Router()

const ROLE_RANK = {
  banned: -1,
  guest: 0,
  citizen: 1,
  resident: 2,
  staff: 3,
  police: 4,
  security: 4,
  vip: 5,
  admin: 9,
  owner: 10,
}

function nowISO() {
  return new Date().toISOString()
}

async function resolvePlayerRole(uid, fallbackRole) {
  try {
    const db = getDb()
    const snap = await db.collection('players').doc(uid).get()

    if (!snap.exists) return fallbackRole || 'citizen'

    const data = snap.data()
    return data.role || data.jobRole || fallbackRole || 'citizen'
  } catch {
    return fallbackRole || 'citizen'
  }
}

router.post('/check', verifyFirebaseToken, async (req, res) => {
  try {
    const db = getDb()

    const doorId = req.body.doorId || 'unknown_door'
    const zone = req.body.zone || 'unknown'
    const requiredRole = req.body.requiredRole || 'resident'

    const playerRole = await resolvePlayerRole(req.user.uid, req.user.role)
    const playerRank = ROLE_RANK[playerRole] ?? 0
    const requiredRank = ROLE_RANK[requiredRole] ?? 0

    const granted = playerRank >= requiredRank

    const log = {
      uid: req.user.uid,
      email: req.user.email,
      type: 'door_check',
      target: doorId,
      zone,
      granted,
      playerRole,
      requiredRole,
      reason: granted ? 'access_granted' : 'insufficient_role',
      createdAt: nowISO(),
    }

    await db.collection('accessLogs').add(log)

    return res.json({
      ok: true,
      granted,
      doorId,
      zone,
      playerRole,
      requiredRole,
      message: granted
        ? 'Acces autorise'
        : 'Acces refuse',
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'door_check_failed',
      message: error && error.message ? error.message : String(error),
    })
  }
})

router.post('/event', verifyFirebaseToken, async (req, res) => {
  try {
    const db = getDb()

    const event = {
      uid: req.user.uid,
      email: req.user.email,
      doorId: req.body.doorId || 'unknown_door',
      zone: req.body.zone || 'unknown',
      action: req.body.action || 'unknown',
      locked: Boolean(req.body.locked),
      open: Boolean(req.body.open),
      createdAt: nowISO(),
    }

    const ref = await db.collection('doorEvents').add(event)

    return res.json({
      ok: true,
      id: ref.id,
      event,
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'door_event_failed',
      message: error && error.message ? error.message : String(error),
    })
  }
})

module.exports = router
