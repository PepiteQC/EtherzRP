import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createTroxtAgent } = require('../src/server/troxt/index.cjs')

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

const agent = createTroxtAgent({
  jobTimeoutMs: 200,
})

const diagnostics = agent.submitCommand({
  source: 'smoke-test',
  command: 'health ping',
  payload: {
    check: 'local-only',
  },
})

if (!diagnostics.ok) {
  throw new Error(`Diagnostics command was rejected: ${JSON.stringify(diagnostics.error)}`)
}

await wait(25)

const diagnosticsJob = agent.jobQueue.get(diagnostics.job.id)
if (diagnosticsJob.status !== 'succeeded') {
  throw new Error(`Diagnostics job did not succeed: ${JSON.stringify(diagnosticsJob)}`)
}

const cloudCommand = agent.submitCommand({
  source: 'smoke-test',
  command: 'analyze external image',
  payload: {
    url: 'https://example.com/image.png',
  },
})

if (cloudCommand.ok || cloudCommand.error?.code !== 'local_only_violation') {
  throw new Error(`Cloud-only guard did not reject external URL: ${JSON.stringify(cloudCommand)}`)
}

const builder = agent.submitCommand({
  source: 'smoke-test',
  command: 'builder place a test door',
})

if (!builder.ok) {
  throw new Error(`Builder command should be accepted into the queue: ${JSON.stringify(builder)}`)
}

await wait(25)

const builderJob = agent.jobQueue.get(builder.job.id)
if (builderJob.status !== 'failed' || builderJob.error?.code !== 'target_unavailable') {
  throw new Error(`Disconnected builder should fail clearly: ${JSON.stringify(builderJob)}`)
}

console.log(JSON.stringify({
  ok: true,
  diagnosticsJob: diagnosticsJob.status,
  cloudGuard: cloudCommand.error.code,
  disconnectedTarget: builderJob.error.code,
}, null, 2))
