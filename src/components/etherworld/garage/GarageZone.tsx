import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import BUILDINGS from '../../../data/quebecBuildings'
import { useGarageStore } from './garageStore'

interface GarageZoneProps {
  vehiclePosition: React.MutableRefObject<THREE.Vector3>
}

function notify(message: string, duration = 2400) {
  window.dispatchEvent(new CustomEvent('hud-notification', {
    detail: { message, duration },
  }))
}

export default function GarageZone({ vehiclePosition }: GarageZoneProps) {
  const zoneRef = useRef<THREE.Group>(null!)
  const wasInside = useRef(false)
  const garage = useMemo(() => BUILDINGS.find(b => b.id === 'garage'), [])

  const zone = useMemo(() => {
    const pos = garage?.pos ?? [0, 0, 20]
    const size = garage?.size ?? [12, 6, 10]
    return {
      id: garage?.id ?? 'garage',
      name: garage?.name ?? 'GARAGE PORTNEUF AUTO',
      position: [pos[0], 0.08, pos[2] + size[2] / 2 + 7] as [number, number, number],
      radius: 12,
    }
  }, [garage])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code !== 'KeyG') return
      const s = useGarageStore.getState()
      if (!s.inZone) return
      s.toggleMenu()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useFrame((_, delta) => {
    const vehiclePos = vehiclePosition.current
    const dist = Math.hypot(vehiclePos.x - zone.position[0], vehiclePos.z - zone.position[2])
    const inside = dist <= zone.radius
    const store = useGarageStore.getState()

    if (inside !== wasInside.current) {
      wasInside.current = inside
      store.setInZone(inside, zone.id, zone.name)
      notify(inside ? `Garage: appuie G pour ouvrir — ${zone.name}` : 'Sortie du garage')
    }

    if (zoneRef.current) {
      zoneRef.current.rotation.y += delta * 0.35
      zoneRef.current.visible = inside || dist < zone.radius * 2.2
    }
  })

  return (
    <group position={zone.position} name="GarageZone">
      <group ref={zoneRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[zone.radius - 0.25, zone.radius, 96]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.26} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[zone.radius * 0.55, 48]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.055} depthWrite={false} />
        </mesh>
      </group>
      <Html position={[0, 2.4, 0]} center distanceFactor={22}>
        <div style={{
          padding: '6px 12px',
          borderRadius: 8,
          background: 'rgba(2,8,16,0.86)',
          color: '#d8f3ff',
          border: '1px solid rgba(56,189,248,0.55)',
          fontFamily: 'monospace',
          fontSize: 11,
          letterSpacing: 1.4,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 0 18px rgba(0,0,0,0.45)',
        }}>
          GARAGE · G
        </div>
      </Html>
    </group>
  )
}
