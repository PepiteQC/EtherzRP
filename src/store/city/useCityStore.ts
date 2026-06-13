// src/store/city/useCityStore.ts
// ============================================================
//  ETHERWORLD — City Store v3.0
//  Features: Zustand + subscribeWithSelector, Districts,
//  Population, Events, Weather, Economy, Firebase sync
// ============================================================

import { create } from 'zustand'
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware'
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../lib/firebase/config'
import type {
  CityAccessLevel,
  CityJobType,
  CityStateSnapshot,
} from '../../game/city/types/city.types'

// ============================================================
//  TYPES ENRICHIS
// ============================================================

export type DistrictName =
  | 'centre_ville'
  | 'route_138'
  | 'zone_industrielle'
  | 'quartier_residentiel'
  | 'port'
  | 'foret_portneuf'
  | 'hotel_district'
  | 'commerce_district'

export type CityWeather =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'blizzard'
  | 'fog'
  | 'storm'
  | 'night_clear'

export type CityTimeOfDay =
  | 'dawn'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'midnight'

export type CityAlertLevel =
  | 'green'    // Calme
  | 'yellow'   // Agitation
  | 'orange'   // Incident majeur
  | 'red'      // Urgence

export type CityEvent =
  | 'police_chase'
  | 'robbery'
  | 'accident'
  | 'festival'
  | 'protest'
  | 'fire'
  | 'medical_emergency'
  | 'drug_bust'
  | 'concert'

export interface District {
  id:            DistrictName
  name:          string
  population:    number
  crimeRate:     number          // 0-100
  wealthIndex:   number          // 0-100
  policePresence: number         // 0-10 officers
  isLocked:      boolean
  requiredAccess: CityAccessLevel
  activeEvents:  CityEvent[]
  businesses:    number
  unemployed:    number
}

export interface CityEconomy {
  totalMoney:     number         // $ en circulation
  taxRate:        number         // % tax
  gdp:            number
  inflation:      number
  jobMarket:      number         // 0-100 (100 = plein emploi)
  crimeImpact:    number         // -% sur économie
}

export interface ActiveCityEvent {
  id:            string
  type:          CityEvent
  district:      DistrictName
  severity:      1 | 2 | 3      // 1=mineur, 2=moyen, 3=majeur
  startedAt:     number
  endsAt:        number
  involvedPlayers: string[]
  description:   string
  reward?:       number          // Si résolu par joueur
}

export interface CityPlayer {
  uid:           string
  name:          string
  job:           CityJobType
  access:        CityAccessLevel
  district:      DistrictName
  position:      [number, number, number]
  online:        boolean
  lastSeen:      number
}

export interface CityStats {
  totalPlayers:  number
  onlinePlayers: number
  totalJobs:     number
  crimesThisHour: number
  arrestsThisHour: number
  totalRevenue:  number
  serverUptime:  number
}

// ============================================================
//  DISTRICTS PAR DÉFAUT
// ============================================================

const DEFAULT_DISTRICTS: Record<DistrictName, District> = {
  centre_ville: {
    id: 'centre_ville', name: 'Centre-Ville EtherWorld',
    population: 8500, crimeRate: 35, wealthIndex: 65,
    policePresence: 6, isLocked: false, requiredAccess: 'public',
    activeEvents: [], businesses: 120, unemployed: 850,
  },
  route_138: {
    id: 'route_138', name: 'Route 138 — Portneuf',
    population: 3200, crimeRate: 20, wealthIndex: 45,
    policePresence: 3, isLocked: false, requiredAccess: 'public',
    activeEvents: [], businesses: 45, unemployed: 480,
  },
  zone_industrielle: {
    id: 'zone_industrielle', name: 'Zone Industrielle',
    population: 1200, crimeRate: 55, wealthIndex: 30,
    policePresence: 2, isLocked: false, requiredAccess: 'public',
    activeEvents: [], businesses: 35, unemployed: 200,
  },
  quartier_residentiel: {
    id: 'quartier_residentiel', name: 'Quartier Résidentiel',
    population: 12000, crimeRate: 15, wealthIndex: 55,
    policePresence: 4, isLocked: false, requiredAccess: 'public',
    activeEvents: [], businesses: 80, unemployed: 1200,
  },
  port: {
    id: 'port', name: 'Port du Fleuve',
    population: 600, crimeRate: 70, wealthIndex: 40,
    policePresence: 2, isLocked: false, requiredAccess: 'public',
    activeEvents: [], businesses: 20, unemployed: 90,
  },
  foret_portneuf: {
    id: 'foret_portneuf', name: 'Forêt de Portneuf',
    population: 200, crimeRate: 10, wealthIndex: 35,
    policePresence: 1, isLocked: false, requiredAccess: 'public',
    activeEvents: [], businesses: 8, unemployed: 30,
  },
  hotel_district: {
    id: 'hotel_district', name: 'District Hôtelier',
    population: 400, crimeRate: 25, wealthIndex: 80,
    policePresence: 3, isLocked: false, requiredAccess: 'public',
    activeEvents: [], businesses: 15, unemployed: 40,
  },
  commerce_district: {
    id: 'commerce_district', name: 'District Commercial',
    population: 2000, crimeRate: 30, wealthIndex: 70,
    policePresence: 4, isLocked: false, requiredAccess: 'public',
    activeEvents: [], businesses: 95, unemployed: 200,
  },
}

// ============================================================
//  STORE INTERFACE
// ============================================================

interface CityStore {
  // ── Joueur ──
  playerAccess:    CityAccessLevel
  currentJob:      CityJobType
  currentDistrict: DistrictName
  playerPosition:  [number, number, number]

  // ── Monde ──
  snapshot:        CityStateSnapshot | null
  districts:       Record<DistrictName, District>
  activePlayers:   Map<string, CityPlayer>
  activeEvents:    ActiveCityEvent[]

  // ── Temps & Météo ──
  timeOfDay:       CityTimeOfDay
  weather:         CityWeather
  gameHour:        number        // 0-23
  gameDay:         number
  weatherDuration: number        // ms restant météo actuelle

  // ── Économie ──
  economy:         CityEconomy
  cityBudget:      number
  taxRevenue:      number

  // ── Sécurité ──
  alertLevel:      CityAlertLevel
  wantedPlayers:   string[]
  activePursuit:   boolean
  policeOnDuty:    number

  // ── Stats ──
  stats:           CityStats

  // ── Firebase ──
  firebaseUnsub:   Unsubscribe | null
  lastSync:        number

  // ────────────────────────────────────────
  //  ACTIONS — Joueur
  // ────────────────────────────────────────
  setPlayerAccess:    (access: CityAccessLevel) => void
  setCurrentJob:      (job: CityJobType) => void
  setCurrentDistrict: (district: DistrictName) => void
  setPlayerPosition:  (pos: [number, number, number]) => void

  // ── Monde ──
  setSnapshot:        (snapshot: CityStateSnapshot) => void
  updateDistrict:     (id: DistrictName, updates: Partial<District>) => void
  registerPlayer:     (player: CityPlayer) => void
  removePlayer:       (uid: string) => void
  updatePlayer:       (uid: string, updates: Partial<CityPlayer>) => void

  // ── Events ──
  addCityEvent:       (event: Omit<ActiveCityEvent, 'id' | 'startedAt'>) => string
  removeCityEvent:    (id: string) => void
  resolveEvent:       (id: string, resolvedBy: string) => void

  // ── Temps & Météo ──
  setWeather:         (weather: CityWeather, durationMs?: number) => void
  tickTime:           (deltaMs: number) => void

  // ── Économie ──
  updateEconomy:      (updates: Partial<CityEconomy>) => void
  collectTax:         (amount: number) => void
  spendBudget:        (amount: number, reason: string) => boolean

  // ── Sécurité ──
  setAlertLevel:      (level: CityAlertLevel) => void
  addWantedPlayer:    (uid: string) => void
  removeWantedPlayer: (uid: string) => void
  setActivePursuit:   (active: boolean) => void

  // ── Queries ──
  getDistrict:        (id: DistrictName) => District
  getPlayersInDistrict: (district: DistrictName) => CityPlayer[]
  getOnlinePlayers:   () => CityPlayer[]
  getActiveEventsByDistrict: (district: DistrictName) => ActiveCityEvent[]
  canAccessDistrict:  (district: DistrictName) => boolean

  // ── Firebase ──
  startSync:          (sessionId: string) => void
  stopSync:           () => void
  pushToFirebase:     () => Promise<void>
}

// ============================================================
//  HELPERS
// ============================================================

function getTimeOfDay(hour: number): CityTimeOfDay {
  if (hour >= 5  && hour < 8)  return 'dawn'
  if (hour >= 8  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  if (hour >= 21 && hour < 24) return 'night'
  return 'midnight'
}

function calcAlertLevel(events: ActiveCityEvent[]): CityAlertLevel {
  const maxSeverity = Math.max(0, ...events.map(e => e.severity))
  if (maxSeverity >= 3) return 'red'
  if (maxSeverity === 2) return 'orange'
  if (events.length > 0) return 'yellow'
  return 'green'
}

const ACCESS_RANK: Record<CityAccessLevel, number> = {
  public: 0,
  civilian: 1,
  employee: 2,
  manager: 3,
  police: 4,
  admin: 5,
}

// ============================================================
//  STORE
// ============================================================

export const useCityStore = create<CityStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({

        // ── État initial ──
        playerAccess:    'civilian',
        currentJob:      'civilian',
        currentDistrict: 'centre_ville',
        playerPosition:  [0, 0, 0],
        snapshot:        null,
        districts:       { ...DEFAULT_DISTRICTS },
        activePlayers:   new Map(),
        activeEvents:    [],
        timeOfDay:       'evening',
        weather:         'clear',
        gameHour:        20,
        gameDay:         1,
        weatherDuration: 600000,   // 10 min par défaut
        economy: {
          totalMoney:  2500000,
          taxRate:     12,
          gdp:         8500000,
          inflation:   2.3,
          jobMarket:   72,
          crimeImpact: -8,
        },
        cityBudget:    500000,
        taxRevenue:    0,
        alertLevel:    'green',
        wantedPlayers: [],
        activePursuit: false,
        policeOnDuty:  0,
        stats: {
          totalPlayers:    0,
          onlinePlayers:   0,
          totalJobs:       0,
          crimesThisHour:  0,
          arrestsThisHour: 0,
          totalRevenue:    0,
          serverUptime:    Date.now(),
        },
        firebaseUnsub: null,
        lastSync:      0,

        // ────────────────────────────────────
        //  JOUEUR
        // ────────────────────────────────────

        setPlayerAccess: (access) => set({ playerAccess: access }),
        setCurrentJob:   (job)    => set({ currentJob: job }),

        setCurrentDistrict: (district) => {
          const d = get().districts[district]
          if (!d || !get().canAccessDistrict(district)) return
          set({ currentDistrict: district })
        },

        setPlayerPosition: (pos) => set({ playerPosition: pos }),

        // ────────────────────────────────────
        //  MONDE
        // ────────────────────────────────────

        setSnapshot: (snapshot) => set({ snapshot }),

        updateDistrict: (id, updates) => {
          const districts = { ...get().districts }
          districts[id]   = { ...districts[id], ...updates }
          set({ districts })
        },

        registerPlayer: (player) => {
          const map = new Map(get().activePlayers)
          map.set(player.uid, player)
          set({
            activePlayers: map,
            stats: {
              ...get().stats,
              totalPlayers:  Math.max(get().stats.totalPlayers, map.size),
              onlinePlayers: Array.from(map.values()).filter(p => p.online).length,
            },
          })
        },

        removePlayer: (uid) => {
          const map = new Map(get().activePlayers)
          map.delete(uid)
          set({ activePlayers: map })
        },

        updatePlayer: (uid, updates) => {
          const map = new Map(get().activePlayers)
          const p   = map.get(uid)
          if (!p) return
          map.set(uid, { ...p, ...updates })
          set({ activePlayers: map })
        },

        // ────────────────────────────────────
        //  EVENTS
        // ────────────────────────────────────

        addCityEvent: (event) => {
          const id       = `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`
          const newEvent: ActiveCityEvent = {
            ...event,
            id,
            startedAt: Date.now(),
          }

          const events   = [...get().activeEvents, newEvent]
          const alert    = calcAlertLevel(events)

          // Ajouter au district
          const districts = { ...get().districts }
          const d = districts[event.district]
          if (d) {
            districts[event.district] = {
              ...d,
              activeEvents: [...d.activeEvents, event.type],
            }
          }

          set({ activeEvents: events, alertLevel: alert, districts })

          // Auto-cleanup à l'expiration
          const duration = event.endsAt - Date.now()
          if (duration > 0) {
            setTimeout(() => get().removeCityEvent(id), duration)
          }

          window.dispatchEvent(new CustomEvent('city-event', {
            detail: { ...newEvent }
          }))

          return id
        },

        removeCityEvent: (id) => {
          const events = get().activeEvents.filter(e => e.id !== id)
          set({ activeEvents: events, alertLevel: calcAlertLevel(events) })
        },

        resolveEvent: (id, resolvedBy) => {
          const event = get().activeEvents.find(e => e.id === id)
          if (!event) return

          // Récompense si résolu par joueur
          if (event.reward) {
            window.dispatchEvent(new CustomEvent('city-reward', {
              detail: { uid: resolvedBy, amount: event.reward, reason: `Événement résolu: ${event.type}` }
            }))
          }

          get().removeCityEvent(id)
        },

        // ────────────────────────────────────
        //  TEMPS & MÉTÉO
        // ────────────────────────────────────

        setWeather: (weather, durationMs = 600000) => {
          set({ weather, weatherDuration: durationMs })
          window.dispatchEvent(new CustomEvent('city-weather', { detail: { weather } }))
        },

        tickTime: (deltaMs) => {
          const { gameHour, gameDay, weatherDuration, weather } = get()

          // Avance l'heure (1 min réelle = 1h jeu)
          const newHourRaw    = gameHour + deltaMs / 60000
          const newHour       = newHourRaw % 24
          const dayPassed     = Math.floor(newHourRaw / 24)
          const newTimeOfDay  = getTimeOfDay(Math.floor(newHour))

          // Météo
          const newWeatherDur = Math.max(0, weatherDuration - deltaMs)
          let newWeather      = weather

          // Change météo si expirée
          if (newWeatherDur <= 0) {
            const weathers: CityWeather[] = ['clear', 'cloudy', 'rain', 'fog', 'snow']
            newWeather = weathers[Math.floor(Math.random() * weathers.length)]
          }

          set({
            gameHour:        newHour,
            gameDay:         gameDay + dayPassed,
            timeOfDay:       newTimeOfDay,
            weather:         newWeather,
            weatherDuration: newWeatherDur <= 0 ? 600000 : newWeatherDur,
          })
        },

        // ────────────────────────────────────
        //  ÉCONOMIE
        // ────────────────────────────────────

        updateEconomy: (updates) => {
          set({ economy: { ...get().economy, ...updates } })
        },

        collectTax: (amount) => {
          const tax = Math.floor(amount * get().economy.taxRate / 100)
          set({
            taxRevenue: get().taxRevenue + tax,
            cityBudget: get().cityBudget + tax,
          })
        },

        spendBudget: (amount, reason) => {
          if (get().cityBudget < amount) {
            console.warn(`[CityStore] Budget insuffisant pour: ${reason}`)
            return false
          }
          set({ cityBudget: get().cityBudget - amount })
          console.log(`[CityStore] Budget -${amount}$ : ${reason}`)
          return true
        },

        // ────────────────────────────────────
        //  SÉCURITÉ
        // ────────────────────────────────────

        setAlertLevel:   (level)  => set({ alertLevel: level }),
        setActivePursuit: (active) => set({ activePursuit: active }),

        addWantedPlayer: (uid) => {
          if (get().wantedPlayers.includes(uid)) return
          set({ wantedPlayers: [...get().wantedPlayers, uid] })
        },

        removeWantedPlayer: (uid) => {
          set({ wantedPlayers: get().wantedPlayers.filter(id => id !== uid) })
        },

        // ────────────────────────────────────
        //  QUERIES
        // ────────────────────────────────────

        getDistrict: (id) => get().districts[id],

        getPlayersInDistrict: (district) =>
          Array.from(get().activePlayers.values())
            .filter(p => p.district === district),

        getOnlinePlayers: () =>
          Array.from(get().activePlayers.values())
            .filter(p => p.online),

        getActiveEventsByDistrict: (district) =>
          get().activeEvents.filter(e => e.district === district),

        canAccessDistrict: (district) => {
          const d = get().districts[district]
          if (!d) return false
          return ACCESS_RANK[get().playerAccess] >= ACCESS_RANK[d.requiredAccess]
        },

        // ────────────────────────────────────
        //  FIREBASE SYNC
        // ────────────────────────────────────

        startSync: (sessionId) => {
          if (!db) return

          const ref    = doc(db, 'sessions', sessionId, 'cityState', 'current')
          const unsub  = onSnapshot(ref, (snap) => {
            if (!snap.exists()) return
            const data = snap.data()

            // Merge les données Firebase (sans écraser le local)
            if (data.weather)    get().setWeather(data.weather)
            if (data.gameHour)   set({ gameHour: data.gameHour })
            if (data.alertLevel) set({ alertLevel: data.alertLevel })
          })

          set({ firebaseUnsub: unsub })
        },

        stopSync: () => {
          const unsub = get().firebaseUnsub
          if (unsub) {
            unsub()
            set({ firebaseUnsub: null })
          }
        },

        pushToFirebase: async () => {
          if (!db) return
          const s = get()

          try {
            await setDoc(
              doc(db, 'cityState', 'current'),
              {
                weather:      s.weather,
                gameHour:     s.gameHour,
                gameDay:      s.gameDay,
                alertLevel:   s.alertLevel,
                activeEvents: s.activeEvents.length,
                onlinePlayers: s.getOnlinePlayers().length,
                lastUpdated:  serverTimestamp(),
              },
              { merge: true }
            )
            set({ lastSync: Date.now() })
          } catch (err) {
            console.error('[CityStore] Firebase push erreur:', err)
          }
        },
      }),

      // ── Persist config ──
      {
        name:    'etherworld-city-store',
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({
          // Seulement ces champs sont sauvegardés
          playerAccess:    s.playerAccess,
          currentJob:      s.currentJob,
          currentDistrict: s.currentDistrict,
          gameDay:         s.gameDay,
          economy:         s.economy,
          cityBudget:      s.cityBudget,
        }),
      }
    )
  )
)

// ============================================================
//  SELECTORS OPTIMISÉS
// ============================================================

export const selectPlayerAccess    = (s: CityStore) => s.playerAccess
export const selectCurrentDistrict = (s: CityStore) => s.currentDistrict
export const selectWeather         = (s: CityStore) => s.weather
export const selectTimeOfDay       = (s: CityStore) => s.timeOfDay
export const selectAlertLevel      = (s: CityStore) => s.alertLevel
export const selectActiveEvents    = (s: CityStore) => s.activeEvents
export const selectEconomy         = (s: CityStore) => s.economy
export const selectOnlinePlayers   = (s: CityStore) => Array.from(s.activePlayers.values()).filter(p => p.online)
export const selectDistricts       = (s: CityStore) => s.districts
export const selectStats           = (s: CityStore) => s.stats
export const selectWantedPlayers   = (s: CityStore) => s.wantedPlayers