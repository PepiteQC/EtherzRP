function nowISO() {
  return new Date().toISOString()
}

function createId(prefix) {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {}
}

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function publicError(error, fallbackCode = 'troxt_error') {
  if (!error) {
    return {
      code: fallbackCode,
      message: 'Unknown TROXT error',
    }
  }

  if (error.code && error.message) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    }
  }

  return {
    code: fallbackCode,
    message: error.message || String(error),
  }
}

module.exports = {
  asObject,
  createId,
  normalizeText,
  nowISO,
  publicError,
  toArray,
}
