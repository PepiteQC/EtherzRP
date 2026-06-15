const path = require('path')
const fs = require('fs')
const admin = require('firebase-admin')

let firebaseReady = false
let firebaseError = null
let db = null

function initFirebaseAdmin() {
  try {
    if (admin.apps.length === 0) {
      const servicePath =
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS

      if (servicePath && fs.existsSync(path.resolve(servicePath))) {
        const absolutePath = path.resolve(servicePath)
        const serviceAccount = require(absolutePath)

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        })
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        })
      }
    }

    db = admin.firestore()
    firebaseReady = true
    firebaseError = null
  } catch (error) {
    firebaseReady = false
    firebaseError = error && error.message ? error.message : String(error)
    console.warn('[FirebaseAdmin] inactive:', firebaseError)
  }

  return {
    admin,
    db,
    firebaseReady,
    firebaseError,
  }
}

function getDb() {
  return db
}

function isFirebaseReady() {
  return firebaseReady
}

function getFirebaseError() {
  return firebaseError
}

initFirebaseAdmin()

module.exports = {
  admin,
  initFirebaseAdmin,
  getDb,
  isFirebaseReady,
  getFirebaseError,
}
