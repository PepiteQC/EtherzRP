const { admin, isFirebaseReady } = require('../firebaseAdmin.cjs')

async function verifyFirebaseToken(req, res, next) {
  try {
    if (!isFirebaseReady()) {
      return res.status(503).json({
        ok: false,
        error: 'firebase_admin_not_ready',
      })
    }

    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'missing_firebase_token',
      })
    }

    const decoded = await admin.auth().verifyIdToken(token)

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
      role: decoded.role || decoded.admin ? 'admin' : 'citizen',
      claims: decoded,
    }

    next()
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: 'invalid_firebase_token',
      message: error && error.message ? error.message : String(error),
    })
  }
}

function requireAdmin(req, res, next) {
  const role = req.user && req.user.role

  if (role === 'admin' || role === 'owner') {
    return next()
  }

  return res.status(403).json({
    ok: false,
    error: 'admin_required',
  })
}

module.exports = {
  verifyFirebaseToken,
  requireAdmin,
}
