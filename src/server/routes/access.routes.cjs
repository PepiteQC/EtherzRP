const express = require('express')
const { getDb } = require('../firebaseAdmin.cjs')
const { verifyFirebaseToken, requireAdmin } = require('../middleware/verifyFirebaseToken.cjs')

const router = express.Router()

function nowISO() {
  return new Date().toISOString()
}

router.post('/log', verifyFirebaseToken, async (req, res) => {
  try {
    const db = getDb()

    const log = {
      uid: req.user.uid,
      email: req.user.email,
      type: req.body.type || 'unknown',
      target: req.body.target || 'unknown',
      granted: Boolean(req.body.granted),
      reason: req.body.reason || null,
      zone: req.body.zone || 'unknown',
      createdAt: nowISO(),
    }

    const ref = await db.collection('accessLogs').add(log)

    return res.json({
      ok: true,
      id: ref.id,
      log,
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'access_log_failed',
      message: error && error.message ? error.message : String(error),
    })
  }
})

router.get('/logs', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    const db = getDb()
    const limit = Math.min(Number(req.query.limit || 50), 100)

    const snap = await db
      .collection('accessLogs')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const logs = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return res.json({
      ok: true,
      logs,
    })
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'access_logs_failed',
      message: error && error.message ? error.message : String(error),
    })
  }
})

module.exports = router
