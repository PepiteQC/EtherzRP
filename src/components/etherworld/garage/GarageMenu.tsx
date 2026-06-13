import { useMemo, useState } from 'react'
import { changePlate, getGaragePalette, getRefuelCost, getRepairCost, makeVehicleKey, refuelVehicle, repaintVehicle, repairVehicle } from './garageActions'
import { useGarageStore } from './garageStore'

export default function GarageMenu() {
  const menuOpen = useGarageStore(s => s.menuOpen)
  const inZone = useGarageStore(s => s.inZone)
  const garageName = useGarageStore(s => s.activeGarageName)
  const fuel = useGarageStore(s => s.vehicleFuel)
  const damage = useGarageStore(s => s.vehicleDamage)
  const paint = useGarageStore(s => s.vehiclePaintColor)
  const plate = useGarageStore(s => s.vehiclePlate)
  const closeMenu = useGarageStore(s => s.closeMenu)
  const [plateInput, setPlateInput] = useState(plate)

  const repairCost = useMemo(() => getRepairCost(), [damage])
  const refuelCost = useMemo(() => getRefuelCost(), [fuel])
  const palette = getGaragePalette()

  if (!menuOpen || !inZone) return null

  const fuelColor = fuel > 55 ? '#22c55e' : fuel > 20 ? '#f59e0b' : '#ef4444'
  const damageColor = damage < 25 ? '#22c55e' : damage < 65 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{
      position: 'absolute',
      right: 24,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 360,
      maxWidth: 'calc(100vw - 48px)',
      padding: 18,
      borderRadius: 16,
      background: 'linear-gradient(180deg, rgba(5,12,24,0.96), rgba(8,18,34,0.93))',
      border: '1px solid rgba(56,189,248,0.35)',
      color: '#e5f7ff',
      zIndex: 42,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#67e8f9', textTransform: 'uppercase' }}>Garage RP</div>
          <h2 style={{ margin: '4px 0 2px', fontSize: 20 }}>{garageName ?? 'Garage'}</h2>
          <div style={{ color: '#94a3b8', fontSize: 12 }}>Réparation · Essence · Personnalisation</div>
        </div>
        <button onClick={closeMenu} style={closeBtn}>×</button>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Stat label="Essence" value={`${Math.round(fuel)}%`} color={fuelColor} />
        <Stat label="Dégâts" value={`${Math.round(damage)}%`} color={damageColor} />
        <Stat label="Plaque" value={plate} color="#bae6fd" />
        <Stat label="Peinture" value={paint.toUpperCase()} color={paint} />
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <ActionButton
          title="Réparer le véhicule"
          subtitle={repairCost > 0 ? `${repairCost}$ · carrosserie/moteur` : 'Aucune réparation nécessaire'}
          disabled={repairCost <= 0}
          color="#38bdf8"
          onClick={() => repairVehicle()}
        />
        <ActionButton
          title="Faire le plein"
          subtitle={refuelCost > 0 ? `${refuelCost}$ · réservoir à 100%` : 'Réservoir déjà plein'}
          disabled={refuelCost <= 0}
          color="#22c55e"
          onClick={() => refuelVehicle()}
        />
        <ActionButton
          title="Refaire une clé"
          subtitle="75$ · clé liée à la plaque actuelle"
          color="#f59e0b"
          onClick={() => makeVehicleKey()}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, letterSpacing: 1.2 }}>Peinture</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {palette.map(c => (
            <button
              key={c}
              title={`Peinture ${c}`}
              onClick={() => repaintVehicle(c)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                border: c === paint ? '3px solid #e0f2fe' : '1px solid rgba(255,255,255,0.25)',
                background: c,
                cursor: 'pointer',
                boxShadow: c === paint ? '0 0 18px rgba(125,211,252,0.75)' : 'none',
              }}
            />
          ))}
          <button onClick={() => repaintVehicle()} style={smallBtn}>Couleur suivante · 450$</button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, letterSpacing: 1.2 }}>Plaque</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={plateInput}
            onChange={e => setPlateInput(e.target.value.toUpperCase().slice(0, 10))}
            placeholder="QC-RP-138"
            style={inputStyle}
          />
          <button onClick={() => changePlate(plateInput)} style={smallBtn}>Changer · 180$</button>
        </div>
      </div>

      <div style={{ marginTop: 14, color: '#64748b', fontSize: 11, lineHeight: 1.45 }}>
        Astuce: conduis dans le cercle bleu du garage et appuie <b>G</b>. Les valeurs sont synchronisées avec le véhicule actuel.
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 10, borderRadius: 10, background: 'rgba(15,23,42,0.68)', border: '1px solid rgba(148,163,184,0.16)' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color, marginTop: 3 }}>{value}</div>
    </div>
  )
}

function ActionButton({ title, subtitle, color, disabled, onClick }: { title: string; subtitle: string; color: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 13px',
        borderRadius: 12,
        background: disabled ? 'rgba(30,41,59,0.48)' : `linear-gradient(90deg, ${color}28, rgba(15,23,42,0.72))`,
        color: disabled ? '#64748b' : '#e5f7ff',
        border: `1px solid ${disabled ? 'rgba(100,116,139,0.22)' : `${color}66`}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 12, color: disabled ? '#64748b' : '#a6d8e8', marginTop: 2 }}>{subtitle}</div>
    </button>
  )
}

const closeBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.75)',
  color: '#e2e8f0',
  cursor: 'pointer',
  fontSize: 22,
  lineHeight: '26px',
}

const smallBtn: React.CSSProperties = {
  borderRadius: 9,
  border: '1px solid rgba(56,189,248,0.42)',
  background: 'rgba(8,47,73,0.72)',
  color: '#e0f2fe',
  padding: '8px 10px',
  cursor: 'pointer',
  fontWeight: 700,
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  borderRadius: 9,
  border: '1px solid rgba(148,163,184,0.28)',
  background: 'rgba(15,23,42,0.78)',
  color: '#e0f2fe',
  padding: '8px 10px',
  outline: 'none',
  fontWeight: 800,
  letterSpacing: 1.2,
}
