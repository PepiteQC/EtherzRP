/**
 * HousekeepingJob.tsx
 * Job: entretien ménager des chambres d'hôtel
 * - Mini-jeu de nettoyage
 * - Checklist par chambre
 * - Gain d'argent + XP
 */

import {
  useState, useCallback, useEffect, useRef, memo,
} from 'react'
import { useRoomStore } from '../storage/roomStore'
import { useReservationStore } from '../storage/reservationStore'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface CleaningTask {
  id:         string
  label:      string
  completed:  boolean
  duration:   number    // secondes pour compléter
  reward:     number    // $ bonus si bien fait
}

interface HousekeepingJobState {
  isWorking:       boolean
  currentRoomId:   string | null
  tasks:           CleaningTask[]
  timeRemaining:   number
  earnings:        number
  completedRooms:  number
  quality:         number           // 0-100, affecte le tip
}

// ─────────────────────────────────────────────
// INITIAL TASKS
// ─────────────────────────────────────────────

const BASE_TASKS: Omit<CleaningTask, 'completed'>[] = [
  { id: 'make_bed',        label: '🛏️ Faire le lit',              duration: 15, reward: 2.00 },
  { id: 'clean_bathroom',  label: '🚿 Nettoyer la salle de bain',  duration: 20, reward: 3.00 },
  { id: 'vacuum',          label: '🧹 Aspirer le plancher',        duration: 12, reward: 1.50 },
  { id: 'empty_trash',     label: '🗑️ Vider les poubelles',       duration: 5,  reward: 0.50 },
  { id: 'replace_towels',  label: '🏨 Remplacer les serviettes',   duration: 8,  reward: 1.00 },
  { id: 'clean_mirror',    label: '🪟 Nettoyer les miroirs',       duration: 6,  reward: 0.75 },
  { id: 'stock_minibar',   label: '🍷 Réapprovisionner le minibar', duration: 10, reward: 1.50 },
  { id: 'replace_amenities', label: '🧴 Remplacer les articles de toilette', duration: 7, reward: 1.00 },
]

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useHousekeepingJob() {
  const [state, setState] = useState<HousekeepingJobState>({
    isWorking:      false,
    currentRoomId:  null,
    tasks:          [],
    timeRemaining:  0,
    earnings:       0,
    completedRooms: 0,
    quality:        100,
  })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleaningRooms = useRoomStore(s => s.getByStatus('cleaning'))
  const markCleaned   = useRoomStore(s => s.markCleaned)

  // Démarrer un job sur une chambre
  const startRoom = useCallback((roomId: string) => {
    const tasks: CleaningTask[] = BASE_TASKS.map(t => ({
      ...t,
      completed: false,
    }))

    const totalTime = tasks.reduce((s, t) => s + t.duration, 0)

    setState(prev => ({
      ...prev,
      isWorking:      true,
      currentRoomId:  roomId,
      tasks,
      timeRemaining:  totalTime,
      quality:        100,
    }))
  }, [])

  // Compléter une tâche
  const completeTask = useCallback((taskId: string) => {
    setState(prev => {
      const updatedTasks = prev.tasks.map(t =>
        t.id === taskId ? { ...t, completed: true } : t
      )

      // Bonus qualité si toutes les tâches faites en ordre
      const allDone = updatedTasks.every(t => t.completed)

      if (allDone && prev.currentRoomId) {
        const taskRewards = updatedTasks.reduce((s, t) => s + t.reward, 0)
        const qualityBonus = (prev.quality / 100) * 5
        const baseEarnings = 12.50 // salaire horaire partiel
        const totalEarnings = baseEarnings + taskRewards + qualityBonus

        markCleaned(prev.currentRoomId)

        return {
          ...prev,
          tasks:          updatedTasks,
          isWorking:      false,
          currentRoomId:  null,
          earnings:       prev.earnings + totalEarnings,
          completedRooms: prev.completedRooms + 1,
        }
      }

      return { ...prev, tasks: updatedTasks }
    })
  }, [markCleaned])

  // Skip une tâche (pénalité qualité)
  const skipTask = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      quality: Math.max(0, prev.quality - 15),
      tasks:   prev.tasks.map(t =>
        t.id === taskId ? { ...t, completed: true } : t
      ),
    }))
  }, [])

  // Abandon
  const stopJob = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setState(prev => ({
      ...prev,
      isWorking:     false,
      currentRoomId: null,
      tasks:         [],
    }))
  }, [])

  // Claim earnings
  const claimEarnings = useCallback(() => {
    const earned = state.earnings
    setState(prev => ({ ...prev, earnings: 0 }))
    return earned
  }, [state.earnings])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  return {
    state,
    cleaningRooms,
    startRoom,
    completeTask,
    skipTask,
    stopJob,
    claimEarnings,
  }
}

// ─────────────────────────────────────────────
// UI COMPONENT
// ─────────────────────────────────────────────

interface HousekeepingJobUIProps {
  isOpen:   boolean
  onClose:  () => void
}

export const HousekeepingJobUI = memo(function HousekeepingJobUI({
  isOpen,
  onClose,
}: HousekeepingJobUIProps) {
  const {
    state, cleaningRooms, startRoom, completeTask, skipTask, stopJob, claimEarnings,
  } = useHousekeepingJob()

  if (!isOpen) return null

  const completedCount = state.tasks.filter(t => t.completed).length
  const progress = state.tasks.length > 0
    ? (completedCount / state.tasks.length) * 100
    : 0

  return (
    <div style={{
      position:   'fixed',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #1a1a2a, #0a0a1a)',
      border:     '1px solid rgba(255,255,255,0.15)',
      borderRadius: 14,
      padding:    24,
      minWidth:   380,
      maxWidth:   440,
      color:      '#ffffff',
      fontFamily: 'monospace',
      zIndex:     500,
      boxShadow:  '0 20px 60px rgba(0,0,0,0.9)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#c8a84b' }}>
            🏨 SERVICE D'ENTRETIEN
          </div>
          <div style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>
            Chambres à nettoyer: {cleaningRooms.length} | Complétées: {state.completedRooms}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#00ff88', fontSize: 16, fontWeight: 'bold' }}>
            ${state.earnings.toFixed(2)}
          </div>
          <div style={{ fontSize: 10, color: '#666666' }}>gains accumulés</div>
        </div>
      </div>

      {!state.isWorking ? (
        <>
          {/* Sélection chambre */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: '#aaaaaa', fontSize: 12, marginBottom: 8 }}>
              CHAMBRES DISPONIBLES:
            </div>
            {cleaningRooms.length === 0 ? (
              <div style={{ color: '#555555', textAlign: 'center', padding: 20, fontSize: 13 }}>
                Aucune chambre à nettoyer pour l'instant
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cleaningRooms.slice(0, 5).map(room => (
                  <button
                    key={room.id}
                    onClick={() => startRoom(room.id)}
                    style={{
                      background:   'rgba(200,168,75,0.1)',
                      border:       '1px solid rgba(200,168,75,0.3)',
                      borderRadius: 8,
                      color:        '#ffffff',
                      padding:      '10px 14px',
                      cursor:       'pointer',
                      fontFamily:   'monospace',
                      fontSize:     13,
                      display:      'flex',
                      justifyContent: 'space-between',
                      alignItems:   'center',
                    }}
                  >
                    <span>Chambre {room.number} — Étage {room.floor}</span>
                    <span style={{ color: '#c8a84b', fontSize: 12 }}>
                      ~${BASE_TASKS.reduce((s, t) => s + t.reward, 0).toFixed(2)} bonus
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Claim earnings */}
          {state.earnings > 0 && (
            <button
              onClick={() => {
                claimEarnings()
                onClose()
              }}
              style={{
                width:        '100%',
                background:   '#006600',
                border:       'none',
                borderRadius: 8,
                color:        '#ffffff',
                padding:      '12px 0',
                cursor:       'pointer',
                fontFamily:   'monospace',
                fontSize:     14,
                fontWeight:   'bold',
              }}
            >
              💰 Encaisser ${state.earnings.toFixed(2)}
            </button>
          )}
        </>
      ) : (
        <>
          {/* Chambre en cours */}
          <div style={{
            background:   'rgba(255,255,255,0.05)',
            borderRadius: 8,
            padding:      '10px 14px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, color: '#aaaaaa' }}>
              Chambre {state.currentRoomId}
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginTop: 8 }}>
              <div style={{
                height:     '100%',
                width:      `${progress}%`,
                background: progress === 100 ? '#00ff88' : '#c8a84b',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: '#888888', marginTop: 4 }}>
              {completedCount}/{state.tasks.length} tâches • Qualité: {state.quality}%
            </div>
          </div>

          {/* Tasks list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
            {state.tasks.map(task => (
              <div
                key={task.id}
                style={{
                  display:      'flex',
                  justifyContent: 'space-between',
                  alignItems:   'center',
                  padding:      '8px 12px',
                  background:   task.completed
                    ? 'rgba(0,255,136,0.08)'
                    : 'rgba(255,255,255,0.04)',
                  borderRadius: 6,
                  opacity:      task.completed ? 0.6 : 1,
                }}
              >
                <span style={{ fontSize: 13, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#666666' : '#dddddd' }}>
                  {task.label}
                </span>
                {!task.completed && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => completeTask(task.id)}
                      style={{
                        background:   '#006600',
                        border:       'none',
                        borderRadius: 4,
                        color:        '#ffffff',
                        padding:      '4px 10px',
                        cursor:       'pointer',
                        fontFamily:   'monospace',
                        fontSize:     11,
                      }}
                    >
                      Faire
                    </button>
                    <button
                      onClick={() => skipTask(task.id)}
                      style={{
                        background:   '#441111',
                        border:       'none',
                        borderRadius: 4,
                        color:        '#888888',
                        padding:      '4px 8px',
                        cursor:       'pointer',
                        fontFamily:   'monospace',
                        fontSize:     11,
                      }}
                    >
                      Skip
                    </button>
                  </div>
                )}
                {task.completed && (
                  <span style={{ color: '#00ff88', fontSize: 12 }}>+${task.reward.toFixed(2)} ✓</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={stopJob}
            style={{
              width:        '100%',
              background:   '#330000',
              border:       '1px solid rgba(255,68,68,0.3)',
              borderRadius: 8,
              color:        '#ff4444',
              padding:      '10px 0',
              cursor:       'pointer',
              fontFamily:   'monospace',
              fontSize:     13,
            }}
          >
            Abandonner la chambre
          </button>
        </>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          width:        '100%',
          background:   'transparent',
          border:       '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          color:        '#666666',
          padding:      '8px 0',
          cursor:       'pointer',
          fontFamily:   'monospace',
          fontSize:     12,
          marginTop:    10,
        }}
      >
        Fermer
      </button>
    </div>
  )
})