import { useEffect } from 'react'
import { Interactive3D, INTERACTION_EVENT, type InteractionActionPayload } from '../interactions'
import { useGarageStore } from '../garage'
import { ensureStarterVehicleKey, hasVehicleKey, notifyKeyRequired } from './VehicleKeys'

function notify(message: string, duration = 2400) {
  window.dispatchEvent(new CustomEvent('hud-notification', {
    detail: { message, duration },
  }))
}

function getStatusMessage() {
  const s = useGarageStore.getState()
  return `Véhicule · Essence ${Math.round(s.vehicleFuel)}% · Dégâts ${Math.round(s.vehicleDamage)}% · Plaque ${s.vehiclePlate}`
}

function toggleLock() {
  const s = useGarageStore.getState()
  if (!hasVehicleKey(s.vehiclePlate)) {
    notifyKeyRequired()
    return
  }
  s.toggleVehicleLock()
  const locked = useGarageStore.getState().vehicleLocked
  notify(locked ? 'Véhicule verrouillé' : 'Véhicule déverrouillé')
}

function toggleTrunk() {
  const s = useGarageStore.getState()
  if (!hasVehicleKey(s.vehiclePlate)) {
    notifyKeyRequired()
    return
  }
  if (s.vehicleLocked) {
    notify('Coffre verrouillé — déverrouille le véhicule')
    return
  }
  s.toggleTrunk()
  const open = useGarageStore.getState().trunkOpen
  notify(open ? 'Coffre ouvert' : 'Coffre fermé')
}

function inspectVehicle() {
  notify(getStatusMessage(), 3400)
}

function handleInteractionTarget(id: string) {
  if (id === 'vehicle:inspect') inspectVehicle()
  if (id === 'vehicle:lock') toggleLock()
  if (id === 'vehicle:trunk') toggleTrunk()
}

/**
 * Zones interactives attachées au véhicule.
 * Inspiré de THREE.Interactive: hover/click/context sur des meshes 3D,
 * mais adapté à React Three Fiber et à notre store EtherzRP.
 */
export default function VehicleInteractionTargets() {
  const locked = useGarageStore(s => s.vehicleLocked)
  const trunkOpen = useGarageStore(s => s.trunkOpen)

  useEffect(() => {
    ensureStarterVehicleKey()

    const onAction = (event: Event) => {
      const detail = (event as CustomEvent<InteractionActionPayload>).detail
      const id = detail?.target?.id
      if (!id?.startsWith('vehicle:')) return
      handleInteractionTarget(id)
    }

    window.addEventListener(INTERACTION_EVENT.action, onAction)
    return () => window.removeEventListener(INTERACTION_EVENT.action, onAction)
  }, [])

  return (
    <group name="VehicleInteractionTargets">
      <Interactive3D
        target={{
          id: 'vehicle:inspect',
          kind: 'vehicle',
          verb: 'inspect',
          label: 'Véhicule personnel',
          prompt: 'Inspecter le véhicule',
          tags: ['vehicle', 'inspect'],
        }}
        promptOffset={[0, 2.3, 0]}
        onInteract={() => {
          inspectVehicle()
          return false
        }}
      >
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[2.45, 1.6, 4.85]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.025} depthWrite={false} />
        </mesh>
      </Interactive3D>

      <Interactive3D
        target={{
          id: 'vehicle:lock',
          kind: 'vehicle',
          verb: 'custom',
          label: locked ? 'Déverrouiller' : 'Verrouiller',
          prompt: locked ? 'Déverrouiller le véhicule' : 'Verrouiller le véhicule',
          tags: ['vehicle', 'door', 'lock'],
          data: { locked },
        }}
        promptOffset={[0, 1.75, -0.7]}
        onInteract={() => {
          toggleLock()
          return false
        }}
      >
        <mesh position={[1.28, 0.95, -0.35]}>
          <boxGeometry args={[0.36, 1.25, 1.7]} />
          <meshBasicMaterial color={locked ? '#ef4444' : '#22c55e'} transparent opacity={0.035} depthWrite={false} />
        </mesh>
      </Interactive3D>

      <Interactive3D
        target={{
          id: 'vehicle:trunk',
          kind: 'vehicle',
          verb: 'open',
          label: trunkOpen ? 'Fermer coffre' : 'Ouvrir coffre',
          prompt: trunkOpen ? 'Fermer le coffre' : 'Ouvrir le coffre',
          tags: ['vehicle', 'trunk'],
          data: { trunkOpen },
        }}
        promptOffset={[0, 1.65, 2.2]}
        onInteract={() => {
          toggleTrunk()
          return false
        }}
      >
        <mesh position={[0, 0.9, 2.26]}>
          <boxGeometry args={[1.75, 0.75, 0.48]} />
          <meshBasicMaterial color={trunkOpen ? '#f59e0b' : '#60a5fa'} transparent opacity={0.045} depthWrite={false} />
        </mesh>
      </Interactive3D>

      {/* Indicateur visuel subtil du coffre ouvert */}
      {trunkOpen && (
        <mesh position={[0, 1.28, 2.15]} rotation={[-0.55, 0, 0]} castShadow>
          <boxGeometry args={[1.72, 0.08, 0.92]} />
          <meshStandardMaterial color="#123e83" roughness={0.35} metalness={0.2} />
        </mesh>
      )}
    </group>
  )
}
