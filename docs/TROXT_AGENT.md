# TROXT Agent

TROXT is a local orchestration agent for the lab engine. It does not own the
3D scene, Three.js runtime, builder implementation, Visual Forge engine, mesh
engines, recognition engines, exports, or React interface.

## Runtime Boundary

Lab Engine owns:

- 3D scene
- builder implementation
- Visual Forge implementation
- mesh engines
- recognition engines
- exports
- React interface

TROXT owns:

- command router
- agent registry
- tool registry
- job queue
- event bus
- health monitor
- result validator
- HTTP API
- Socket.IO bridge

## HTTP API

Base path: `/api/troxt`

- `GET /health`
- `GET /registry`
- `GET /events?limit=50`
- `GET /jobs`
- `GET /jobs/:jobId`
- `POST /commands`
- `POST /jobs/:jobId/result`
- `POST /jobs/:jobId/cancel`

Command shape:

```json
{
  "source": "lab-engine",
  "command": "builder place a door",
  "intent": "builder.command",
  "target": "builder",
  "payload": {
    "objectType": "door"
  }
}
```

TROXT returns `202 Accepted` with a tracked job. If the target tool is
connected over Socket.IO, TROXT dispatches a structured command and waits for a
result. If the target is offline, the job fails with `target_unavailable`.

## Socket.IO Bridge

Tool adapters connect to the existing local Socket.IO server and register:

```js
socket.emit('troxt:register-tool', {
  toolId: 'builder',
  capabilities: ['build_scene', 'place_object'],
  intents: ['builder.command']
})
```

TROXT dispatches work:

```js
socket.on('troxt:dispatch', async (command) => {
  socket.emit('troxt:result', {
    jobId: command.jobId,
    ok: true,
    status: 'succeeded',
    result: {
      received: command.payload
    }
  })
})
```

The lab can also submit commands through Socket.IO:

```js
socket.emit('troxt:command', {
  command: 'visual forge generate local asset',
  payload: { assetId: 'chair_01' }
}, (response) => {
  console.log(response.job.id)
})
```

## Local-Only Guard

The result validator rejects external URLs, cloud provider fields, API keys,
tokens, and secret fields. Localhost URLs are allowed for adapters running on
the same machine.
