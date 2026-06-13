import { useEffect, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { GroupProps } from '@react-three/fiber'
import * as THREE from 'three'
import { useInteractionStore } from './interactionStore'
import {
  buildPrompt,
  dispatchInteractionDomEvent,
  INTERACTION_EVENT,
  type InteractionHandler,
  type InteractionTarget,
} from './interactionTypes'

interface Interactive3DProps extends Omit<GroupProps, 'onClick' | 'onPointerOver' | 'onPointerOut' | 'onContextMenu'> {
  target: InteractionTarget
  children: ReactNode
  disabled?: boolean
  showPrompt?: boolean
  promptOffset?: [number, number, number]
  onInteract?: InteractionHandler
  onContextInteract?: InteractionHandler
}

function notify(message: string, duration = 2200) {
  window.dispatchEvent(new CustomEvent('hud-notification', {
    detail: { message, duration },
  }))
}

function setCursor(cursor: string) {
  if (typeof document !== 'undefined') document.body.style.cursor = cursor
}

export default function Interactive3D({
  target,
  children,
  disabled = false,
  showPrompt = true,
  promptOffset = [0, 2.2, 0],
  onInteract,
  onContextInteract,
  ...groupProps
}: Interactive3DProps) {
  const registerTarget = useInteractionStore(s => s.registerTarget)
  const unregisterTarget = useInteractionStore(s => s.unregisterTarget)
  const hovered = useInteractionStore(s => s.hovered)
  const setHovered = useInteractionStore(s => s.setHovered)
  const setSelected = useInteractionStore(s => s.setSelected)
  const markAction = useInteractionStore(s => s.markAction)

  const enabled = !disabled && target.enabled !== false
  const isHovered = hovered?.target.id === target.id
  const runtimeTarget: InteractionTarget = { enabled: true, radius: 3.2, priority: 0, ...target, enabled }

  useEffect(() => {
    registerTarget(runtimeTarget)
    return () => {
      unregisterTarget(runtimeTarget.id)
      setCursor('auto')
    }
    // target changes should update registry; JSON handles nested data/tags for this simple registry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runtimeTarget.id, runtimeTarget.label, runtimeTarget.kind, runtimeTarget.verb, runtimeTarget.enabled])

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (!enabled) return
    event.stopPropagation()
    const distance = event.distance ?? 0
    const object = event.object as THREE.Object3D
    const hit = { target: runtimeTarget, distance, point: event.point?.clone(), object }
    setHovered(hit)
    setCursor('pointer')
    dispatchInteractionDomEvent(INTERACTION_EVENT.hover, { target: runtimeTarget, event })
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    if (!enabled) return
    event.stopPropagation()
    setHovered(null)
    setCursor('auto')
    dispatchInteractionDomEvent(INTERACTION_EVENT.blur, { target: runtimeTarget, event })
  }

  const handleClick = async (event: ThreeEvent<MouseEvent>) => {
    if (!enabled) return
    event.stopPropagation()
    setSelected(runtimeTarget)
    markAction(runtimeTarget)
    dispatchInteractionDomEvent(INTERACTION_EVENT.action, { target: runtimeTarget, source: 'pointer', event })

    const handled = await onInteract?.({ target: runtimeTarget, source: 'pointer', event })
    if (handled === false) return
    notify(buildPrompt(runtimeTarget))
  }

  const handleContextMenu = async (event: ThreeEvent<MouseEvent>) => {
    if (!enabled) return
    event.stopPropagation()
    setSelected(runtimeTarget)
    dispatchInteractionDomEvent(INTERACTION_EVENT.context, { target: runtimeTarget, source: 'pointer', event })
    await onContextInteract?.({ target: runtimeTarget, source: 'pointer', event })
  }

  return (
    <group
      {...groupProps}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      userData={{ ...(groupProps.userData ?? {}), interactionTarget: runtimeTarget }}
    >
      {children}
      {showPrompt && isHovered && (
        <Html position={promptOffset} center distanceFactor={18} occlude={false}>
          <div style={{
            padding: '5px 9px',
            borderRadius: 6,
            background: 'rgba(4,12,22,0.88)',
            color: '#d8f3ff',
            border: '1px solid rgba(94,205,255,0.45)',
            boxShadow: '0 0 18px rgba(0,0,0,0.45)',
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: 1.2,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            E / CLIC — {buildPrompt(runtimeTarget)}
          </div>
        </Html>
      )}
    </group>
  )
}
