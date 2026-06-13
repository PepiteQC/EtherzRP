/**
 * HotelJobs3D.tsx
 * Système d'emplois interactifs de l'hôtel
 * Jobs: réceptionniste, ménage, room service, portier, chef, concierge
 */

import {
  useState, useCallback, useRef, memo, useMemo,
} from 'react'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type HotelJobId =
  | 'receptionist'
  | 'housekeeping'
  | 'room_service'
  | 'bellhop'
  | 'chef'
  | 'concierge'
  | 'pool_attendant'
  | 'security_officer'

export type JobStatus = 'available' | 'active' | 'completed' | 'failed'

export interface JobTask {
  id:          string
  description: string
  descFr:      string
  type:        'action' | 'deliver' | 'interact' | 'wait'
  duration:    number      // secondes
  reward:      number      // bonus $
  completed:   boolean
  skippable:   boolean
}

export interface HotelJob {
  id:           HotelJobId
  titleFr:      string
  descriptionFr: string
  baseWage:     number      // $/heure
  shiftDuration: number     // heures
  tasks:        JobTask[]
  status:       JobStatus
  startedAt:    number | null
  earnings:     number
  xpReward:     number
  uniform:      string      // couleur uniforme
  floor?:       number
  roomId?:      string
}

// ─────────────────────────────────────────────
// JOB DEFINITIONS
// ─────────────────────────────────────────────

function createReceptionistTasks(): JobTask[] {
  return [
    { id: 'greet',        description: 'Greet arriving guests',       descFr: 'Accueillir les clients à l\'arrivée',     type: 'interact', duration: 30, reward: 3.00, completed: false, skippable: false },
    { id: 'checkin',      description: 'Process check-in',            descFr: 'Effectuer un enregistrement',             type: 'action',   duration: 45, reward: 4.00, completed: false, skippable: false },
    { id: 'keys',         description: 'Prepare key cards',           descFr: 'Préparer les cartes d\'accès',            type: 'action',   duration: 15, reward: 1.50, completed: false, skippable: false },
    { id: 'phone',        description: 'Answer phone',                 descFr: 'Répondre au téléphone',                  type: 'interact', duration: 20, reward: 2.00, completed: false, skippable: true  },
    { id: 'info',         description: 'Provide local information',    descFr: 'Fournir des informations locales',        type: 'interact', duration: 25, reward: 2.50, completed: false, skippable: true  },
    { id: 'checkout',     description: 'Process check-out & billing',  descFr: 'Traiter le départ et la facturation',    type: 'action',   duration: 40, reward: 4.50, completed: false, skippable: false },
    { id: 'luggage',      description: 'Assist with luggage storage',  descFr: 'Aider avec la consigne de bagages',      type: 'deliver',  duration: 20, reward: 2.00, completed: false, skippable: true  },
    { id: 'complaint',    description: 'Handle guest complaint',       descFr: 'Gérer une plainte de client',            type: 'interact', duration: 35, reward: 5.00, completed: false, skippable: false },
  ]
}

function createHousekeepingTasks(floor: number): JobTask[] {
  return [
    { id: 'fetch_cart',   description: 'Get housekeeping cart',       descFr: 'Récupérer le chariot de ménage',          type: 'action',   duration: 5,  reward: 0.50, completed: false, skippable: false },
    { id: 'make_bed',     description: 'Make the bed',                descFr: 'Faire le lit',                           type: 'action',   duration: 15, reward: 2.00, completed: false, skippable: false },
    { id: 'clean_bath',   description: 'Clean bathroom',              descFr: 'Nettoyer la salle de bain',              type: 'action',   duration: 20, reward: 3.00, completed: false, skippable: false },
    { id: 'vacuum',       description: 'Vacuum floors',               descFr: 'Passer l\'aspirateur',                   type: 'action',   duration: 12, reward: 1.50, completed: false, skippable: false },
    { id: 'dust',         description: 'Dust furniture',              descFr: 'Dépoussiérer les meubles',               type: 'action',   duration: 8,  reward: 1.00, completed: false, skippable: true  },
    { id: 'trash',        description: 'Empty trash bins',            descFr: 'Vider les poubelles',                    type: 'action',   duration: 5,  reward: 0.50, completed: false, skippable: false },
    { id: 'towels',       description: 'Replace towels',              descFr: 'Remplacer les serviettes',               type: 'deliver',  duration: 8,  reward: 1.00, completed: false, skippable: false },
    { id: 'amenities',    description: 'Restock toiletries',          descFr: 'Réapprovisionner les articles de toilette', type: 'deliver', duration: 10, reward: 1.50, completed: false, skippable: false },
    { id: 'minibar',      description: 'Check and restock minibar',   descFr: 'Vérifier et réapprovisionner le minibar', type: 'action',  duration: 8,  reward: 1.50, completed: false, skippable: true  },
    { id: 'report',       description: 'Report room condition',       descFr: 'Rapporter l\'état de la chambre',         type: 'action',   duration: 5,  reward: 1.00, completed: false, skippable: false },
  ]
}

function createRoomServiceTasks(): JobTask[] {
  return [
    { id: 'take_order',   description: 'Take room service order',     descFr: 'Prendre la commande',                    type: 'interact', duration: 10, reward: 1.50, completed: false, skippable: false },
    { id: 'kitchen',      description: 'Coordinate with kitchen',     descFr: 'Coordonner avec la cuisine',             type: 'action',   duration: 5,  reward: 0.50, completed: false, skippable: false },
    { id: 'prepare_tray', description: 'Prepare service tray',        descFr: 'Préparer le plateau de service',         type: 'action',   duration: 8,  reward: 1.00, completed: false, skippable: false },
    { id: 'deliver',      description: 'Deliver to room',             descFr: 'Livrer à la chambre',                    type: 'deliver',  duration: 15, reward: 3.00, completed: false, skippable: false },
    { id: 'setup',        description: 'Set up table in room',        descFr: 'Dresser la table dans la chambre',       type: 'action',   duration: 10, reward: 2.00, completed: false, skippable: true  },
    { id: 'collect',      description: 'Collect empty trays',         descFr: 'Récupérer les plateaux vides',           type: 'action',   duration: 10, reward: 1.00, completed: false, skippable: true  },
  ]
}

function createBellhopTasks(): JobTask[] {
  return [
    { id: 'greet_door',   description: 'Greet guest at door',         descFr: 'Accueillir le client à la porte',        type: 'interact', duration: 5,  reward: 1.00, completed: false, skippable: false },
    { id: 'take_luggage', description: 'Take luggage from guest',     descFr: 'Prendre les bagages du client',          type: 'action',   duration: 8,  reward: 1.50, completed: false, skippable: false },
    { id: 'load_trolley', description: 'Load trolley',                descFr: 'Charger le chariot',                     type: 'action',   duration: 10, reward: 1.00, completed: false, skippable: false },
    { id: 'escort',       description: 'Escort to room',              descFr: 'Escorter jusqu\'à la chambre',           type: 'deliver',  duration: 20, reward: 3.00, completed: false, skippable: false },
    { id: 'unload',       description: 'Unload luggage in room',      descFr: 'Décharger les bagages en chambre',       type: 'action',   duration: 10, reward: 1.50, completed: false, skippable: false },
    { id: 'explain',      description: 'Explain room features',       descFr: 'Expliquer les fonctionnalités de la chambre', type: 'interact', duration: 8, reward: 2.00, completed: false, skippable: true },
    { id: 'tip_time',     description: 'Receive tip graciously',      descFr: 'Recevoir le pourboire',                  type: 'interact', duration: 3,  reward: 5.00, completed: false, skippable: false },
  ]
}

const JOB_DEFINITIONS: Record<HotelJobId, Omit<HotelJob, 'tasks' | 'status' | 'startedAt' | 'earnings'>> = {
  receptionist: {
    id: 'receptionist', titleFr: 'Réceptionniste',
    descriptionFr: 'Accueillir les clients, gérer les enregistrements et départs',
    baseWage: 19.50, shiftDuration: 8, xpReward: 150, uniform: '#002244', floor: 1,
  },
  housekeeping: {
    id: 'housekeeping', titleFr: 'Préposé(e) à l\'entretien',
    descriptionFr: 'Nettoyer et préparer les chambres pour les nouveaux clients',
    baseWage: 17.25, shiftDuration: 6, xpReward: 100, uniform: '#f0ede6', floor: 2,
  },
  room_service: {
    id: 'room_service', titleFr: 'Service aux Chambres',
    descriptionFr: 'Livrer repas et articles aux chambres des clients',
    baseWage: 16.75, shiftDuration: 6, xpReward: 80, uniform: '#1a1a2a', floor: 1,
  },
  bellhop: {
    id: 'bellhop', titleFr: 'Groom / Porteur',
    descriptionFr: 'Escorter les clients et transporter les bagages',
    baseWage: 15.50, shiftDuration: 8, xpReward: 75, uniform: '#1a1a2a', floor: 1,
  },
  chef: {
    id: 'chef', titleFr: 'Cuisinier',
    descriptionFr: 'Préparer les repas du restaurant et du room service',
    baseWage: 22.00, shiftDuration: 8, xpReward: 200, uniform: '#ffffff', floor: 1,
  },
  concierge: {
    id: 'concierge', titleFr: 'Concierge',
    descriptionFr: 'Aider les clients avec réservations et services spéciaux',
    baseWage: 21.00, shiftDuration: 8, xpReward: 175, uniform: '#1a1a2a', floor: 1,
  },
  pool_attendant: {
    id: 'pool_attendant', titleFr: 'Préposé(e) à la Piscine',
    descriptionFr: 'Surveiller la piscine et servir les clients au spa',
    baseWage: 16.00, shiftDuration: 8, xpReward: 60, uniform: '#ffffff', floor: -1,
  },
  security_officer: {
    id: 'security_officer', titleFr: 'Agent de Sécurité',
    descriptionFr: 'Assurer la sécurité de l\'hôtel et des clients',
    baseWage: 20.00, shiftDuration: 8, xpReward: 120, uniform: '#1a1a2a', floor: 1,
  },
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

interface JobSession {
  job:          HotelJob
  progress:     number      // 0-100
  timeWorked:   number      // secondes
  currentTask:  number      // index
  earnings:     number
}

export function useHotelJobs() {
  const [activeSession, setActiveSession] = useState<JobSession | null>(null)
  const [completedJobs, setCompletedJobs] = useState<HotelJobId[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const availableJobs = useMemo((): HotelJob[] => {
    return Object.entries(JOB_DEFINITIONS).map(([id, def]) => ({
      ...def,
      tasks: id === 'receptionist' ? createReceptionistTasks()
           : id === 'housekeeping' ? createHousekeepingTasks(2)
           : id === 'room_service' ? createRoomServiceTasks()
           : id === 'bellhop'      ? createBellhopTasks()
           : [],
      status:    'available' as JobStatus,
      startedAt: null,
      earnings:  0,
    }))
  }, [])

  const startJob = useCallback((jobId: HotelJobId) => {
    const jobDef = availableJobs.find(j => j.id === jobId)
    if (!jobDef || activeSession) return

    setActiveSession({
      job: { ...jobDef, status: 'active', startedAt: Date.now() },
      progress:    0,
      timeWorked:  0,
      currentTask: 0,
      earnings:    0,
    })
  }, [availableJobs, activeSession])

  const completeTask = useCallback((taskIndex: number) => {
    setActiveSession(prev => {
      if (!prev) return null
      const tasks = [...prev.job.tasks]
      if (taskIndex >= tasks.length) return prev

      tasks[taskIndex] = { ...tasks[taskIndex], completed: true }

      const completedCount = tasks.filter(t => t.completed).length
      const progress = (completedCount / tasks.length) * 100
      const taskReward = tasks[taskIndex].reward
      const newEarnings = prev.earnings + taskReward

      // Tout complété?
      if (completedCount === tasks.length) {
        const shiftWage = prev.job.baseWage * prev.job.shiftDuration
        const finalEarnings = shiftWage + newEarnings

        setCompletedJobs(c => [...c, prev.job.id])
        setTotalEarnings(t => t + finalEarnings)

        return null  // Terminer le job
      }

      return {
        ...prev,
        job:         { ...prev.job, tasks },
        progress,
        currentTask: completedCount,
        earnings:    newEarnings,
      }
    })
  }, [])

  const skipTask = useCallback((taskIndex: number) => {
    setActiveSession(prev => {
      if (!prev) return null
      const tasks = [...prev.job.tasks]
      if (!tasks[taskIndex]?.skippable) return prev
      tasks[taskIndex] = { ...tasks[taskIndex], completed: true }
      const completedCount = tasks.filter(t => t.completed).length
      return {
        ...prev,
        job:         { ...prev.job, tasks },
        progress:    (completedCount / tasks.length) * 100,
        currentTask: completedCount,
        // Pas de reward pour les skips
      }
    })
  }, [])

  const abandonJob = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    // Payer seulement les tâches complétées
    if (activeSession) {
      const partial = activeSession.earnings * 0.5  // 50% des gains partiels
      setTotalEarnings(t => t + partial)
    }
    setActiveSession(null)
  }, [activeSession])

  const claimEarnings = useCallback(() => {
    const amount = totalEarnings
    setTotalEarnings(0)
    return amount
  }, [totalEarnings])

  return {
    availableJobs,
    activeSession,
    completedJobs,
    totalEarnings,
    startJob,
    completeTask,
    skipTask,
    abandonJob,
    claimEarnings,
  }
}

// ─────────────────────────────────────────────
// UI COMPONENT
// ─────────────────────────────────────────────

interface HotelJobsUIProps {
  isOpen:  boolean
  onClose: () => void
  playerMoney: number
  onEarnMoney: (amount: number) => void
}

export const HotelJobsUI = memo(function HotelJobsUI({
  isOpen,
  onClose,
  playerMoney,
  onEarnMoney,
}: HotelJobsUIProps) {
  const {
    availableJobs, activeSession, totalEarnings,
    startJob, completeTask, skipTask, abandonJob, claimEarnings,
  } = useHotelJobs()

  const [view, setView] = useState<'list' | 'active'>('list')

  if (!isOpen) return null

  return (
    <div style={{
      position:   'fixed',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #0a0a14, #14141e)',
      border:     '1px solid rgba(200,168,75,0.4)',
      borderRadius: 16,
      width:      520,
      maxHeight:  620,
      overflow:   'hidden',
      color:      '#ffffff',
      fontFamily: 'monospace',
      zIndex:     600,
      boxShadow:  '0 30px 90px rgba(0,0,0,0.95)',
      display:    'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background:  'linear-gradient(90deg, rgba(200,168,75,0.15), rgba(200,168,75,0.05))',
        borderBottom:'1px solid rgba(200,168,75,0.25)',
        padding:     '18px 22px',
        display:     'flex',
        justifyContent: 'space-between',
        alignItems:  'center',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 'bold', color: '#c8a84b', letterSpacing: 1 }}>
            🏨 EMPLOIS — HÔTEL ETHERWORLD
          </div>
          <div style={{ fontSize: 11, color: '#888888', marginTop: 3 }}>
            💵 ${playerMoney.toFixed(2)} en main &nbsp;|&nbsp; Gains accumulés: ${totalEarnings.toFixed(2)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {totalEarnings > 0 && (
            <button
              onClick={() => { onEarnMoney(claimEarnings()) }}
              style={{
                background:   '#006600',
                border:       'none',
                borderRadius: 8,
                color:        '#ffffff',
                padding:      '6px 14px',
                cursor:       'pointer',
                fontFamily:   'monospace',
                fontSize:     12,
                fontWeight:   'bold',
              }}
            >
              💰 Encaisser
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background:   'transparent',
              border:       '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color:        '#666666',
              cursor:       'pointer',
              padding:      '6px 12px',
              fontFamily:   'monospace',
              fontSize:     12,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

        {/* Active session */}
        {activeSession ? (
          <div>
            <div style={{
              background:   'rgba(200,168,75,0.1)',
              border:       '1px solid rgba(200,168,75,0.25)',
              borderRadius: 10,
              padding:      '14px 16px',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 'bold', color: '#c8a84b', fontSize: 15 }}>
                  {activeSession.job.titleFr}
                </div>
                <div style={{ color: '#00ff88', fontSize: 13 }}>
                  +${activeSession.earnings.toFixed(2)} bonus
                </div>
              </div>

              {/* Progress */}
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }}>
                <div style={{
                  height:     '100%',
                  width:      `${activeSession.progress}%`,
                  background: activeSession.progress === 100 ? '#00ff88' : '#c8a84b',
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#888888' }}>
                {activeSession.job.tasks.filter(t => t.completed).length}/{activeSession.job.tasks.length} tâches complétées
              </div>
            </div>

            {/* Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {activeSession.job.tasks.map((task, i) => (
                <div key={task.id} style={{
                  display:      'flex',
                  justifyContent: 'space-between',
                  alignItems:   'center',
                  padding:      '10px 14px',
                  background:   task.completed
                    ? 'rgba(0,255,136,0.06)'
                    : i === activeSession.currentTask
                    ? 'rgba(200,168,75,0.1)'
                    : 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  border:       i === activeSession.currentTask
                    ? '1px solid rgba(200,168,75,0.3)'
                    : '1px solid transparent',
                  opacity:      task.completed ? 0.5 : 1,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13,
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color:    task.completed ? '#666666' : '#dddddd',
                    }}>
                      {task.descFr}
                    </div>
                    <div style={{ fontSize: 10, color: '#888888', marginTop: 2 }}>
                      {task.type} • {task.duration}s • +${task.reward.toFixed(2)}
                    </div>
                  </div>

                  {!task.completed && i === activeSession.currentTask && (
                    <div style={{ display: 'flex', gap: 6, marginLeft: 10 }}>
                      <button
                        onClick={() => completeTask(i)}
                        style={{
                          background:   '#006600',
                          border:       'none',
                          borderRadius: 6,
                          color:        '#ffffff',
                          padding:      '6px 12px',
                          cursor:       'pointer',
                          fontFamily:   'monospace',
                          fontSize:     12,
                          fontWeight:   'bold',
                        }}
                      >
                        ✓ Faire
                      </button>
                      {task.skippable && (
                        <button
                          onClick={() => skipTask(i)}
                          style={{
                            background:   '#330000',
                            border:       'none',
                            borderRadius: 6,
                            color:        '#888888',
                            padding:      '6px 8px',
                            cursor:       'pointer',
                            fontFamily:   'monospace',
                            fontSize:     11,
                          }}
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  )}

                  {task.completed && (
                    <div style={{ color: '#00ff88', fontSize: 12, marginLeft: 10 }}>
                      +${task.reward.toFixed(2)} ✓
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={abandonJob}
              style={{
                width:        '100%',
                background:   '#220000',
                border:       '1px solid rgba(255,68,68,0.3)',
                borderRadius: 8,
                color:        '#ff6666',
                padding:      '10px 0',
                cursor:       'pointer',
                fontFamily:   'monospace',
                fontSize:     13,
              }}
            >
              Abandonner le shift (50% des gains)
            </button>
          </div>
        ) : (
          <>
            {/* Job list */}
            <div style={{ fontSize: 12, color: '#888888', marginBottom: 14 }}>
              {availableJobs.length} postes disponibles — Sélectionnez un emploi pour commencer
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableJobs.map(job => (
                <div
                  key={job.id}
                  style={{
                    background:   'rgba(255,255,255,0.04)',
                    border:       '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    padding:      '14px 16px',
                    cursor:       'pointer',
                    transition:   'border-color 0.15s',
                  }}
                  onClick={() => startJob(job.id)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,168,75,0.4)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 'bold', color: '#dddddd', fontSize: 14 }}>
                      {job.titleFr}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#00ff88', fontSize: 13, fontWeight: 'bold' }}>
                        ${job.baseWage.toFixed(2)}/h
                      </div>
                      <div style={{ color: '#888888', fontSize: 10 }}>
                        shift {job.shiftDuration}h
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: '#aaaaaa', marginBottom: 8 }}>
                    {job.descriptionFr}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#666666' }}>
                      {job.tasks.length} tâches &nbsp;·&nbsp; +{job.xpReward} XP
                      {job.floor && ` &nbsp;·&nbsp; Étage ${job.floor}`}
                    </div>
                    <div style={{
                      background:   'rgba(200,168,75,0.15)',
                      border:       '1px solid rgba(200,168,75,0.3)',
                      borderRadius: 6,
                      padding:      '3px 10px',
                      fontSize:     11,
                      color:        '#c8a84b',
                    }}>
                      Commencer →
                    </div>
                  </div>

                  {/* Estimation gains */}
                  <div style={{
                    marginTop:   8,
                    paddingTop:  8,
                    borderTop:   '1px solid rgba(255,255,255,0.05)',
                    fontSize:    11,
                    color:       '#555555',
                  }}>
                    Salaire estimé: ${(job.baseWage * job.shiftDuration).toFixed(2)} + bonus tâches
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
})