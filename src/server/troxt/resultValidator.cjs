const { asObject, publicError } = require('./utils.cjs')

const LOCAL_URL_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?(\/|$)/i
const EXTERNAL_URL_PATTERN = /^https?:\/\//i

function findExternalReference(value, path = 'payload') {
  if (typeof value === 'string') {
    if (EXTERNAL_URL_PATTERN.test(value) && !LOCAL_URL_PATTERN.test(value)) {
      return {
        path,
        value,
        reason: 'external_url_not_allowed',
      }
    }
    return null
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findExternalReference(value[index], `${path}[${index}]`)
      if (found) return found
    }
    return null
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const lowerKey = key.toLowerCase()
      if (
        ['apikey', 'api_key', 'token', 'secret'].includes(lowerKey)
        || (lowerKey === 'provider' && typeof child === 'string' && child.toLowerCase() !== 'local')
        || (lowerKey === 'cloud' && child === true)
      ) {
        return {
          path: `${path}.${key}`,
          reason: 'cloud_or_secret_field_not_allowed',
        }
      }

      const found = findExternalReference(child, `${path}.${key}`)
      if (found) return found
    }
  }

  return null
}

class ResultValidator {
  validateCommand(input) {
    const command = asObject(input)

    if (!command.command && !command.intent && !command.target && !command.payload) {
      return {
        ok: false,
        error: {
          code: 'invalid_command',
          message: 'A TROXT command needs command, intent, target, or payload.',
        },
      }
    }

    const externalReference = findExternalReference(command)
    if (externalReference) {
      return {
        ok: false,
        error: {
          code: 'local_only_violation',
          message: 'TROXT is local-only and rejected an external/cloud reference.',
          details: externalReference,
        },
      }
    }

    return {
      ok: true,
      command: {
        ...command,
        payload: asObject(command.payload),
      },
    }
  }

  normalizeResult(job, incoming) {
    const body = asObject(incoming)

    if (!body || Object.keys(body).length === 0) {
      return {
        ok: false,
        status: 'failed',
        error: {
          code: 'empty_result',
          message: 'The target returned an empty result.',
        },
      }
    }

    if (body.jobId && job?.id && body.jobId !== job.id) {
      return {
        ok: false,
        status: 'failed',
        error: {
          code: 'job_id_mismatch',
          message: 'The result jobId does not match the tracked TROXT job.',
          details: {
            expected: job.id,
            received: body.jobId,
          },
        },
      }
    }

    const status = body.status || (body.ok === false ? 'failed' : 'succeeded')
    const hasErrorStatus = ['failed', 'failure', 'error', 'errored'].includes(String(status).toLowerCase())
    const hasErrorPayload = Boolean(body.error) || (Array.isArray(body.errors) && body.errors.length > 0)

    if (body.ok === false || hasErrorStatus || hasErrorPayload) {
      return {
        ok: false,
        status: 'failed',
        error: body.error
          ? publicError(body.error, 'target_error')
          : {
              code: 'target_error',
              message: 'The target reported an error.',
              details: body.errors || body,
            },
      }
    }

    return {
      ok: true,
      status: 'succeeded',
      result: Object.prototype.hasOwnProperty.call(body, 'result')
        ? body.result
        : body.data || body,
      metrics: body.metrics || null,
      artifacts: body.artifacts || [],
    }
  }
}

module.exports = {
  ResultValidator,
}
