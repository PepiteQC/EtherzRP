/// <reference types="vite/client" />

import { useEffect, useRef, useState, type ReactNode } from 'react'
import socketClient from 'socket.io-client'
import {
  Bot,
  Boxes,
  BrainCircuit,
  Cpu,
  Grid2x2,
  Move3D,
  Orbit,
  Sparkles,
  SquareDashedMousePointer,
  TreePine,
} from 'lucide-react'
import { LabScene, SCENE_TEMPLATES, type LabObject, type LabToolId } from './LabScene'
import {
  getTroxtHealth,
  getTroxtJobs,
  getTroxtRegistry,
  submitTroxtCommand,
  type TroxtCommandPayload,
  type TroxtHealthResponse,
  type TroxtJob,
  type TroxtRegistryResponse,
} from './troxtClient'
import './lab-test.css'

type ScenePreset = {
  id: string
  type: Exclude<LabToolId, 'select'>
  position: [number, number, number]
  rotationY?: number
  scale?: number
  createdFrom?: 'manual' | 'troxt'
}

type LabLog = {
  id: string
  title: string
  body: string
  tone: 'info' | 'success' | 'warn'
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const TOOL_ORDER: Array<{
  id: LabToolId
  label: string
  icon: ReactNode
  helper: string
}> = [
  { id: 'select', label: 'Select', icon: <SquareDashedMousePointer size={15} />, helper: 'Pick and inspect' },
  { id: 'cube', label: 'Cube', icon: <Boxes size={15} />, helper: 'Anchor props fast' },
  { id: 'wall', label: 'Wall', icon: <Grid2x2 size={15} />, helper: 'Block out rooms' },
  { id: 'floor', label: 'Floor', icon: <Grid2x2 size={15} />, helper: 'Plate and runway' },
  { id: 'door', label: 'Door', icon: <Move3D size={15} />, helper: 'Access marker' },
  { id: 'light', label: 'Light', icon: <Sparkles size={15} />, helper: 'Read the volume' },
  { id: 'tree', label: 'Tree', icon: <TreePine size={15} />, helper: 'Outdoor scale' },
  { id: 'column', label: 'Column', icon: <Orbit size={15} />, helper: 'Vertical test' },
  { id: 'platform', label: 'Platform', icon: <Boxes size={15} />, helper: 'Raised surface' },
]

const STARTER_SCENE: ScenePreset[] = [
  { id: 'starter-floor-a', type: 'floor', position: [0, 0, 0], scale: 1.2 },
  { id: 'starter-floor-b', type: 'floor', position: [2.5, 0, 0], scale: 1.2 },
  { id: 'starter-wall-a', type: 'wall', position: [0, 0, -2.3] },
  { id: 'starter-door-a', type: 'door', position: [1.4, 0, -2.3] },
  { id: 'starter-column-a', type: 'column', position: [-2.4, 0, 2.6], scale: 1.1 },
  { id: 'starter-light-a', type: 'light', position: [0, 0, 3.6] },
  { id: 'starter-tree-a', type: 'tree', position: [6, 0, -4], scale: 1.1 },
]

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function snapValue(value: number, step: number) {
  return Math.round(value / step) * step
}

function makeSceneObject(preset: ScenePreset): LabObject {
  const template = SCENE_TEMPLATES[preset.type]
  return {
    id: preset.id,
    type: preset.type,
    label: template.label,
    color: template.color,
    position: preset.position,
    rotationY: preset.rotationY || 0,
    scale: preset.scale || 1,
    createdFrom: preset.createdFrom || 'manual',
  }
}

function seedScene() {
  return STARTER_SCENE.map(makeSceneObject)
}

function deriveBuilderType(command: {
  rawCommand?: string | null
  payload?: Record<string, unknown>
}) {
  const payloadType = typeof command.payload?.objectType === 'string' ? command.payload.objectType.toLowerCase() : ''
  const text = `${command.rawCommand || ''} ${payloadType}`.toLowerCase()

  if (text.includes('door')) return 'door'
  if (text.includes('wall')) return 'wall'
  if (text.includes('light')) return 'light'
  if (text.includes('tree')) return 'tree'
  if (text.includes('column')) return 'column'
  if (text.includes('platform')) return 'platform'
  if (text.includes('floor')) return 'floor'
  return 'cube'
}

function resolvePlacementY(type: Exclude<LabToolId, 'select'>, scale: number) {
  return (SCENE_TEMPLATES[type].size[1] * scale) / 2
}

export default function LabTestApp() {
  const [objects, setObjects] = useState<LabObject[]>(() => seedScene())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<LabToolId>('cube')
  const [showGrid, setShowGrid] = useState(true)
  const [showAxes, setShowAxes] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [snapSize, setSnapSize] = useState(1)
  const [ghostRotationY, setGhostRotationY] = useState(0)
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>([0, 0, 0])
  const [mockTargetsEnabled, setMockTargetsEnabled] = useState(true)
  const [health, setHealth] = useState<TroxtHealthResponse | null>(null)
  const [registry, setRegistry] = useState<TroxtRegistryResponse['registry'] | null>(null)
  const [jobs, setJobs] = useState<TroxtJob[]>([])
  const [commandText, setCommandText] = useState('builder place a door on the grid')
  const [commandTarget, setCommandTarget] = useState('builder')
  const [logs, setLogs] = useState<LabLog[]>([])
  const [socketStatus, setSocketStatus] = useState<'offline' | 'connecting' | 'connected'>('offline')
  const [busy, setBusy] = useState(false)
  const objectsRef = useRef(objects)
  const selectedIdRef = useRef(selectedId)
  const socketRef = useRef<SocketIOClient.Socket | null>(null)
  const pollFailedRef = useRef(false)

  useEffect(() => {
    objectsRef.current = objects
  }, [objects])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  function pushLog(title: string, body: string, tone: LabLog['tone'] = 'info') {
    setLogs((current) => [
      {
        id: createId('log'),
        title,
        body,
        tone,
      },
      ...current,
    ].slice(0, 12))
  }

  function placeObject(type: Exclude<LabToolId, 'select'>, point: [number, number, number], source: 'manual' | 'troxt') {
    const template = SCENE_TEMPLATES[type]
    const scale = 1
    const object: LabObject = {
      id: createId(type),
      type,
      label: template.label,
      color: template.color,
      position: [point[0], resolvePlacementY(type, scale), point[2]],
      rotationY: ghostRotationY,
      scale,
      createdFrom: source,
    }

    setObjects((current) => [...current, object])
    setSelectedId(object.id)
    return object
  }

  function updateSelected(partial: Partial<LabObject>) {
    if (!selectedIdRef.current) return
    setObjects((current) => current.map((object) => (
      object.id === selectedIdRef.current ? { ...object, ...partial } : object
    )))
  }

  function nudgeSelected(axis: 'x' | 'z', delta: number) {
    const selected = objectsRef.current.find((object) => object.id === selectedIdRef.current)
    if (!selected) return
    const next = [...selected.position] as [number, number, number]
    if (axis === 'x') next[0] += delta
    if (axis === 'z') next[2] += delta
    updateSelected({ position: next })
  }

  function duplicateSelected() {
    const selected = objectsRef.current.find((object) => object.id === selectedIdRef.current)
    if (!selected) return
    const copy: LabObject = {
      ...selected,
      id: createId(selected.type),
      position: [selected.position[0] + snapSize, selected.position[1], selected.position[2] + snapSize],
    }
    setObjects((current) => [...current, copy])
    setSelectedId(copy.id)
  }

  function removeSelected() {
    if (!selectedIdRef.current) return
    setObjects((current) => current.filter((object) => object.id !== selectedIdRef.current))
    setSelectedId(null)
  }

  async function refreshTroxt() {
    try {
      const [nextHealth, nextRegistry, nextJobs] = await Promise.all([
        getTroxtHealth(),
        getTroxtRegistry(),
        getTroxtJobs(),
      ])
      pollFailedRef.current = false
      setHealth(nextHealth)
      setRegistry(nextRegistry.registry)
      setJobs(nextJobs.jobs.slice(0, 8))
    } catch (error) {
      setHealth(null)
      setRegistry(null)
      setJobs([])
      if (!pollFailedRef.current) {
        pushLog('TROXT poll', error instanceof Error ? error.message : 'Unable to reach local server.', 'warn')
      }
      pollFailedRef.current = true
    }
  }

  useEffect(() => {
    refreshTroxt()
    const timer = window.setInterval(refreshTroxt, 3500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!mockTargetsEnabled) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setSocketStatus('offline')
      return
    }

    setSocketStatus('connecting')
    const socket = socketClient(API_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    socketRef.current = socket

    const registerTargets = () => {
      const tools = [
        {
          toolId: 'builder',
          name: 'Builder',
          intents: ['builder.command', 'scene.build', 'asset.place'],
          capabilities: ['build_scene', 'place_object', 'remove_object'],
        },
        {
          toolId: 'visual-forge',
          name: 'Visual Forge',
          intents: ['visual_forge.command', 'asset.generate', 'image.to_3d'],
          capabilities: ['generate_asset', 'prepare_manifest'],
        },
        {
          toolId: 'code-lab',
          name: 'Code Lab',
          intents: ['code_lab.command', 'code.execute'],
          capabilities: ['run_code', 'inspect_workspace'],
        },
        {
          toolId: 'ethervision',
          name: 'EtherVision',
          intents: ['ethervision.command', 'vision.analyze'],
          capabilities: ['detect_subject', 'scene_analysis'],
        },
        {
          toolId: 'troxt-prisma',
          name: 'TroxTPrisma',
          intents: ['troxt_prisma.command', 'scene.refine', 'palette.compose'],
          capabilities: ['compose_palette', 'refine_scene', 'suggest_material_pass'],
        },
      ]

      tools.forEach((tool) => {
        socket.emit('troxt:register-tool', tool, (response: { ok: boolean; error?: { message: string } }) => {
          pushLog(
            `Adapter ${tool.toolId}`,
            response.ok ? 'Registered on local Socket.IO bridge.' : response.error?.message || 'Registration failed.',
            response.ok ? 'success' : 'warn'
          )
        })
      })
    }

    socket.on('connect', () => {
      setSocketStatus('connected')
      pushLog('Socket bridge', 'Mock lab targets connected to TROXT.', 'success')
      registerTargets()
      refreshTroxt()
    })

    socket.on('disconnect', () => {
      setSocketStatus('offline')
      pushLog('Socket bridge', 'Mock lab targets disconnected.', 'warn')
    })

    socket.on('troxt:dispatch', (command: {
      jobId: string
      intent: string
      rawCommand?: string | null
      target?: { id?: string; toolId?: string }
      payload?: Record<string, unknown>
    }) => {
      const targetId = command.target?.toolId || command.target?.id

      if (targetId === 'builder') {
        const type = deriveBuilderType(command)
        const placed = placeObject(
          type,
          [
            snapValue((Math.random() - 0.5) * 10, snapSize),
            0,
            snapValue((Math.random() - 0.5) * 10, snapSize),
          ],
          'troxt'
        )

        socket.emit('troxt:result', {
          jobId: command.jobId,
          ok: true,
          status: 'succeeded',
          result: {
            tool: 'builder',
            action: 'place_object',
            objectId: placed.id,
            objectType: placed.type,
            sceneObjectCount: objectsRef.current.length + 1,
          },
        })
        return
      }

      if (targetId === 'visual-forge') {
        socket.emit('troxt:result', {
          jobId: command.jobId,
          ok: true,
          status: 'succeeded',
          result: {
            tool: 'visual-forge',
            manifestId: createId('vf'),
            summary: 'Prepared local mock visual asset request.',
            request: command.payload || {},
          },
        })
        return
      }

      if (targetId === 'code-lab') {
        socket.emit('troxt:result', {
          jobId: command.jobId,
          ok: true,
          status: 'succeeded',
          result: {
            tool: 'code-lab',
            stdout: 'Local lab command inspected successfully.',
            objectCount: objectsRef.current.length,
          },
        })
        return
      }

      if (targetId === 'ethervision') {
        const counts = objectsRef.current.reduce<Record<string, number>>((acc, object) => {
          acc[object.type] = (acc[object.type] || 0) + 1
          return acc
        }, {})

        socket.emit('troxt:result', {
          jobId: command.jobId,
          ok: true,
          status: 'succeeded',
          result: {
            tool: 'ethervision',
            summary: 'Local scene scan completed.',
            counts,
            selectedObjectId: selectedIdRef.current,
          },
        })
        return
      }

      if (targetId === 'troxt-prisma') {
        const palette = Array.from(new Set(objectsRef.current.map((object) => object.color))).slice(0, 6)
        const composition = {
          totalObjects: objectsRef.current.length,
          verticalAnchors: objectsRef.current.filter((object) => ['column', 'tree', 'light'].includes(object.type)).length,
          structuralMass: objectsRef.current.filter((object) => ['wall', 'floor', 'platform', 'door'].includes(object.type)).length,
        }

        socket.emit('troxt:result', {
          jobId: command.jobId,
          ok: true,
          status: 'succeeded',
          result: {
            tool: 'troxt-prisma',
            summary: 'Local lookdev and composition pass completed.',
            palette,
            composition,
            recommendations: [
              'Accentuer le contraste entre surfaces structurelles et props lumineux.',
              'Regrouper les couleurs chaudes autour des points d acces.',
              'Garder les elements verticaux comme repere de lecture de scene.',
            ],
          },
        })
      }
    })

    socket.on('troxt:job:update', (event: { type: string; payload: TroxtJob }) => {
      pushLog('Job update', `${event.type} -> ${event.payload.status}`, event.payload.status === 'failed' ? 'warn' : 'info')
      refreshTroxt()
    })

    socket.on('troxt:registry:update', () => {
      refreshTroxt()
    })

    return () => {
      socket.disconnect()
    }
  }, [mockTargetsEnabled, snapSize])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        removeSelected()
      }

      if (event.key.toLowerCase() === 'r') {
        setGhostRotationY((current) => current + Math.PI / 2)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const selectedObject = objects.find((object) => object.id === selectedId) || null
  const connectedTools = registry?.tools.filter((tool) => tool.connected) || []

  async function runQuickCommand(payload: TroxtCommandPayload) {
    setBusy(true)
    try {
      const response = await submitTroxtCommand(payload)
      if (!response.ok || !response.job) {
        throw new Error(response.error?.message || 'TROXT command was rejected.')
      }

      pushLog(
        'Command accepted',
        `${response.job.route.targetId} -> ${response.job.status} (${response.job.route.reason})`,
        'success'
      )
      setCommandText(payload.command || commandText)
      refreshTroxt()
    } catch (error) {
      pushLog('Command failed', error instanceof Error ? error.message : 'Unable to send TROXT command.', 'warn')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lab-shell">
      <div className="lab-layout">
        <aside className="lab-panel">
          <section className="lab-section">
            <p className="lab-eyebrow">Lab engine</p>
            <h1 className="lab-title">Test scene</h1>
            <p className="lab-copy">
              Grid, builder, mock adapters, and TROXT flow live here. The RP game stays untouched.
            </p>
            <div className="lab-toolbar">
              {TOOL_ORDER.map((tool) => (
                <button
                  key={tool.id}
                  className={`lab-tool${activeTool === tool.id ? ' is-active' : ''}`}
                  onClick={() => setActiveTool(tool.id)}
                  type="button"
                >
                  {tool.icon}
                  <strong>{tool.label}</strong>
                  <span>{tool.helper}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="lab-section">
            <p className="lab-eyebrow">Scene controls</p>
            <div className="lab-grid two">
              <button className={`lab-toggle${showGrid ? ' is-active' : ''}`} onClick={() => setShowGrid((value) => !value)} type="button">
                <span>Grid</span>
                <strong>{showGrid ? 'ON' : 'OFF'}</strong>
              </button>
              <button className={`lab-toggle${showAxes ? ' is-active' : ''}`} onClick={() => setShowAxes((value) => !value)} type="button">
                <span>Axes</span>
                <strong>{showAxes ? 'ON' : 'OFF'}</strong>
              </button>
              <button className={`lab-toggle${showLabels ? ' is-active' : ''}`} onClick={() => setShowLabels((value) => !value)} type="button">
                <span>Labels</span>
                <strong>{showLabels ? 'ON' : 'OFF'}</strong>
              </button>
              <button className={`lab-toggle${mockTargetsEnabled ? ' is-active' : ''}`} onClick={() => setMockTargetsEnabled((value) => !value)} type="button">
                <span>Mock adapters</span>
                <strong>{mockTargetsEnabled ? 'LIVE' : 'OFF'}</strong>
              </button>
            </div>

            <div className="lab-grid two" style={{ marginTop: 10 }}>
              <label>
                <div className="lab-label">Snap size</div>
                <select className="lab-select" value={snapSize} onChange={(event) => setSnapSize(Number(event.target.value))}>
                  <option value={0.5}>0.5m</option>
                  <option value={1}>1m</option>
                  <option value={2}>2m</option>
                </select>
              </label>
              <label>
                <div className="lab-label">Ghost rotation</div>
                <button className="lab-action" type="button" onClick={() => setGhostRotationY((value) => value + Math.PI / 2)}>
                  <strong>Rotate 90</strong>
                  <span>Current {Math.round((ghostRotationY * 180) / Math.PI)} deg</span>
                </button>
              </label>
            </div>

            <div className="lab-actions" style={{ marginTop: 10 }}>
              <button className="lab-action" type="button" onClick={() => setObjects(seedScene())}>
                <strong>Reset scene</strong>
                <span>Restore starter blockout</span>
              </button>
              <button className="lab-action" type="button" onClick={() => setObjects([])}>
                <strong>Clear all</strong>
                <span>Blank canvas for tests</span>
              </button>
            </div>

            <div className="lab-note">
              Click the ground to place the active tool. Use <code>R</code> to rotate the ghost and <code>Delete</code> to remove the selected object.
            </div>
          </section>

          <section className="lab-section">
            <p className="lab-eyebrow">Scene objects</p>
            {objects.length === 0 ? <div className="lab-empty">No objects in the scene yet.</div> : null}
            {objects.length > 0 ? (
              <div className="lab-object-list">
                {objects.slice(-10).reverse().map((object) => (
                  <button
                    key={object.id}
                    className={`lab-object${object.id === selectedId ? ' is-selected' : ''}`}
                    type="button"
                    onClick={() => setSelectedId(object.id)}
                  >
                    <div className="lab-object-head">
                      <strong>{object.label}</strong>
                      <span className="lab-mini">{object.createdFrom}</span>
                    </div>
                    <div className="lab-mini">
                      x {object.position[0].toFixed(1)} z {object.position[2].toFixed(1)} rot {Math.round((object.rotationY * 180) / Math.PI)}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </aside>

        <main className="lab-scene">
          <div className="lab-topbar">
            <div className="lab-chip-row">
              <div className={`lab-chip ${socketStatus === 'connected' ? 'ok' : socketStatus === 'connecting' ? 'warn' : 'danger'}`}>
                <strong>Socket bridge</strong>
                <span>{socketStatus}</span>
              </div>
              <div className={`lab-chip ${health?.status === 'ready' ? 'ok' : 'warn'}`}>
                <strong>TROXT</strong>
                <span>{health?.status || 'polling'}</span>
              </div>
              <div className="lab-chip">
                <strong>Connected targets</strong>
                <span>{connectedTools.length} / 5</span>
              </div>
            </div>

            <div className="lab-chip-row">
              <div className="lab-chip">
                <strong>Mode</strong>
                <span>{activeTool === 'select' ? 'inspect' : `place ${activeTool}`}</span>
              </div>
              <div className="lab-chip">
                <strong>Objects</strong>
                <span>{objects.length}</span>
              </div>
            </div>
          </div>

          <div className="lab-canvas">
            <LabScene
              objects={objects}
              selectedId={selectedId}
              showGrid={showGrid}
              showAxes={showAxes}
              showLabels={showLabels}
              activeTool={activeTool}
              ghostPosition={ghostPosition}
              ghostRotationY={ghostRotationY}
              onHoverGround={(point) => {
                setGhostPosition([snapValue(point[0], snapSize), 0, snapValue(point[2], snapSize)])
              }}
              onPlaceAtPoint={(point) => {
                const snapped: [number, number, number] = [snapValue(point[0], snapSize), 0, snapValue(point[2], snapSize)]
                if (activeTool === 'select') {
                  setSelectedId(null)
                  return
                }

                placeObject(activeTool, snapped, 'manual')
              }}
              onSelectObject={setSelectedId}
            />
          </div>

          <div className="lab-footer">
            <div className="lab-chip-row">
              <div className="lab-chip">
                <strong>API</strong>
                <span>{API_URL}</span>
              </div>
              <div className="lab-chip">
                <strong>Route</strong>
                <span>?lab=test</span>
              </div>
            </div>

            <button
              className="lab-action"
              type="button"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(objects, null, 2))}
            >
              <strong>Copy scene JSON</strong>
              <span>Quick export for the builder team</span>
            </button>
          </div>
        </main>

        <aside className="lab-panel">
          <section className="lab-section">
            <p className="lab-eyebrow">Selection</p>
            {!selectedObject ? <div className="lab-empty">Pick an object to move, rotate, duplicate, or delete it.</div> : null}
            {selectedObject ? (
              <>
                <div className="lab-stat-grid">
                  <div className="lab-stat">
                    <div className="lab-mini">Type</div>
                    <div className="lab-value">{selectedObject.label}</div>
                  </div>
                  <div className="lab-stat">
                    <div className="lab-mini">Source</div>
                    <div className="lab-value">{selectedObject.createdFrom}</div>
                  </div>
                </div>

                <div className="lab-actions" style={{ marginTop: 10 }}>
                  <button className="lab-action" type="button" onClick={() => nudgeSelected('x', -snapSize)}>
                    <strong>Move X-</strong>
                    <span>{snapSize}m step</span>
                  </button>
                  <button className="lab-action" type="button" onClick={() => nudgeSelected('x', snapSize)}>
                    <strong>Move X+</strong>
                    <span>{snapSize}m step</span>
                  </button>
                  <button className="lab-action" type="button" onClick={() => nudgeSelected('z', -snapSize)}>
                    <strong>Move Z-</strong>
                    <span>{snapSize}m step</span>
                  </button>
                  <button className="lab-action" type="button" onClick={() => nudgeSelected('z', snapSize)}>
                    <strong>Move Z+</strong>
                    <span>{snapSize}m step</span>
                  </button>
                  <button
                    className="lab-action"
                    type="button"
                    onClick={() => updateSelected({ rotationY: selectedObject.rotationY + Math.PI / 2 })}
                  >
                    <strong>Rotate</strong>
                    <span>+90 deg</span>
                  </button>
                  <button className="lab-action" type="button" onClick={() => duplicateSelected()}>
                    <strong>Duplicate</strong>
                    <span>Offset copy</span>
                  </button>
                </div>

                <div className="lab-actions" style={{ marginTop: 10 }}>
                  <button className="lab-action" type="button" onClick={() => updateSelected({ scale: Number((selectedObject.scale + 0.1).toFixed(2)) })}>
                    <strong>Scale up</strong>
                    <span>{selectedObject.scale.toFixed(2)}</span>
                  </button>
                  <button className="lab-action" type="button" onClick={() => updateSelected({ scale: Math.max(0.4, Number((selectedObject.scale - 0.1).toFixed(2))) })}>
                    <strong>Scale down</strong>
                    <span>{selectedObject.scale.toFixed(2)}</span>
                  </button>
                  <button className="lab-action" type="button" onClick={() => removeSelected()}>
                    <strong>Delete</strong>
                    <span>Remove object</span>
                  </button>
                </div>

                <div className="lab-code">
                  {JSON.stringify(
                    {
                      id: selectedObject.id,
                      type: selectedObject.type,
                      position: selectedObject.position,
                      rotationY: selectedObject.rotationY,
                      scale: selectedObject.scale,
                    },
                    null,
                    2
                  )}
                </div>
              </>
            ) : null}
          </section>

          <section className="lab-section">
            <p className="lab-eyebrow">TROXT quick commands</p>
            <div className="lab-actions">
              <button
                className="lab-action"
                type="button"
                onClick={() => runQuickCommand({
                  source: 'lab-test-ui',
                  toolId: 'builder',
                  intent: 'builder.command',
                  command: 'builder place a door on the grid',
                  payload: { action: 'place_object', objectType: 'door' },
                })}
              >
                <strong>Builder job</strong>
                <span>Place a door via TROXT</span>
              </button>
              <button
                className="lab-action"
                type="button"
                onClick={() => runQuickCommand({
                  source: 'lab-test-ui',
                  toolId: 'visual-forge',
                  intent: 'visual_forge.command',
                  command: 'visual forge generate local asset',
                  payload: { action: 'generate_asset', subject: 'signage panel' },
                })}
              >
                <strong>Visual Forge</strong>
                <span>Mock asset manifest</span>
              </button>
              <button
                className="lab-action"
                type="button"
                onClick={() => runQuickCommand({
                  source: 'lab-test-ui',
                  toolId: 'code-lab',
                  intent: 'code_lab.command',
                  command: 'code lab inspect the scene',
                  payload: { action: 'inspect_workspace' },
                })}
              >
                <strong>Code Lab</strong>
                <span>Local diagnostics</span>
              </button>
              <button
                className="lab-action"
                type="button"
                onClick={() => runQuickCommand({
                  source: 'lab-test-ui',
                  toolId: 'ethervision',
                  intent: 'ethervision.command',
                  command: 'ethervision analyze scene objects',
                  payload: { action: 'scene_analysis' },
                })}
              >
                <strong>EtherVision</strong>
                <span>Object scan summary</span>
              </button>
              <button
                className="lab-action"
                type="button"
                onClick={() => runQuickCommand({
                  source: 'lab-test-ui',
                  toolId: 'troxt-prisma',
                  intent: 'troxt_prisma.command',
                  command: 'troxtprisma refine scene palette and composition',
                  payload: { action: 'refine_scene', focus: 'palette_and_composition' },
                })}
              >
                <strong>TroxTPrisma</strong>
                <span>Palette and lookdev pass</span>
              </button>
            </div>

            <div className="lab-grid two" style={{ marginTop: 10 }}>
              <label>
                <div className="lab-label">Target</div>
                <select className="lab-select" value={commandTarget} onChange={(event) => setCommandTarget(event.target.value)}>
                  <option value="builder">builder</option>
                  <option value="visual-forge">visual-forge</option>
                  <option value="code-lab">code-lab</option>
                  <option value="ethervision">ethervision</option>
                  <option value="troxt-prisma">troxt-prisma</option>
                </select>
              </label>
              <label>
                <div className="lab-label">Status</div>
                <div className="lab-chip-row">
                  <div className={`lab-chip ${busy ? 'warn' : 'ok'}`}>
                    <strong>Queue</strong>
                    <span>{busy ? 'sending' : 'ready'}</span>
                  </div>
                </div>
              </label>
            </div>

            <div style={{ marginTop: 10 }}>
              <div className="lab-label">Command text</div>
              <div className="lab-input-row">
                <input className="lab-input" value={commandText} onChange={(event) => setCommandText(event.target.value)} />
                <button
                  className="lab-action"
                  type="button"
                  onClick={() => runQuickCommand({
                    source: 'lab-test-ui',
                    toolId: commandTarget,
                    command: commandText,
                    payload: { action: 'custom', objectType: commandTarget === 'builder' ? 'cube' : undefined },
                  })}
                >
                  <strong>Send</strong>
                  <span>HTTP API</span>
                </button>
              </div>
            </div>
          </section>

          <section className="lab-section">
            <p className="lab-eyebrow">Server state</p>
            <div className="lab-stat-grid">
              <div className="lab-stat">
                <div className="lab-mini">TROXT status</div>
                <div className="lab-value">{health?.status || 'offline'}</div>
              </div>
              <div className="lab-stat">
                <div className="lab-mini">Offline targets</div>
                <div className="lab-value">{health?.targets.offline.length || 0}</div>
              </div>
              <div className="lab-stat">
                <div className="lab-mini">Agents</div>
                <div className="lab-value">{registry?.agents.length || 0}</div>
              </div>
              <div className="lab-stat">
                <div className="lab-mini">Tools</div>
                <div className="lab-value">{registry?.tools.length || 0}</div>
              </div>
            </div>

            <div className="lab-object-list">
              {(registry?.tools || []).map((tool) => (
                <div className="lab-object" key={tool.id}>
                  <div className="lab-object-head">
                    <strong>{tool.name}</strong>
                    <span className="lab-mini">{tool.connected ? 'connected' : tool.status}</span>
                  </div>
                  <div className="lab-mini">{tool.capabilities.join(', ') || 'No capabilities yet.'}</div>
                </div>
              ))}
            </div>
            <div className="lab-note">
              TroxTPrisma sert ici de passe lookdev locale pour palettes, materiaux et composition de scene, toujours orchestree par TROXT.
            </div>
          </section>

          <section className="lab-section">
            <p className="lab-eyebrow">Jobs and logs</p>
            {jobs.length === 0 ? <div className="lab-empty">No TROXT jobs recorded yet.</div> : null}
            {jobs.length > 0 ? (
              <div className="lab-log-list">
                {jobs.map((job) => (
                  <div className="lab-log" key={job.id}>
                    <div className="lab-log-head">
                      <strong>{job.route.targetId}</strong>
                      <span className="lab-mini">{job.status}</span>
                    </div>
                    <div className="lab-mini">{job.command.command || job.route.intent}</div>
                    {job.error ? <div className="lab-code">{job.error.code}: {job.error.message}</div> : null}
                    {job.result?.result ? <div className="lab-code">{JSON.stringify(job.result.result, null, 2)}</div> : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="lab-log-list" style={{ marginTop: 12 }}>
              {logs.map((log) => (
                <div className="lab-log" key={log.id}>
                  <div className="lab-log-head">
                    <strong>{log.title}</strong>
                    <span className="lab-mini">{log.tone}</span>
                  </div>
                  <div className="lab-mini">{log.body}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
