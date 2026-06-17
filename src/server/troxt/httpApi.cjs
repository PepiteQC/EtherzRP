const express = require('express')

function createTroxtHttpRouter(troxtAgent) {
  const router = express.Router()
  troxtAgent.healthMonitor.setHttpReady(true)

  router.get('/health', (req, res) => {
    res.json(troxtAgent.health())
  })

  router.get('/registry', (req, res) => {
    res.json({
      ok: true,
      registry: troxtAgent.registry(),
    })
  })

  router.get('/events', (req, res) => {
    res.json({
      ok: true,
      events: troxtAgent.eventBus.recent(Number(req.query.limit || 50), req.query.type),
    })
  })

  router.get('/jobs', (req, res) => {
    res.json({
      ok: true,
      jobs: troxtAgent.jobQueue.list({
        status: req.query.status,
        limit: req.query.limit,
      }),
    })
  })

  router.get('/jobs/:jobId', (req, res) => {
    const job = troxtAgent.jobQueue.get(req.params.jobId)
    if (!job) {
      res.status(404).json({
        ok: false,
        error: {
          code: 'job_not_found',
          message: `Unknown TROXT job: ${req.params.jobId}`,
        },
      })
      return
    }

    res.json({
      ok: true,
      job,
    })
  })

  router.post('/commands', (req, res) => {
    const response = troxtAgent.submitCommand({
      ...req.body,
      source: req.body?.source || 'lab-engine:http',
    })

    if (!response.ok) {
      res.status(400).json(response)
      return
    }

    res.status(202).json(response)
  })

  router.post('/jobs/:jobId/result', (req, res) => {
    const response = troxtAgent.receiveResult(req.params.jobId, req.body)

    if (!response.ok) {
      res.status(response.statusCode || 400).json(response)
      return
    }

    res.json(response)
  })

  router.post('/jobs/:jobId/cancel', (req, res) => {
    const job = troxtAgent.jobQueue.cancel(req.params.jobId, req.body?.reason)
    if (!job) {
      res.status(404).json({
        ok: false,
        error: {
          code: 'job_not_found',
          message: `Unknown TROXT job: ${req.params.jobId}`,
        },
      })
      return
    }

    res.json({
      ok: true,
      job,
    })
  })

  return router
}

module.exports = {
  createTroxtHttpRouter,
}
