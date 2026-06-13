// src/store/gameState.ts
// ============================================================
//  ETHERWORLD — Game State & Job System v4.0
//  Features: 25+ jobs, Factions, Niveaux, Compétences,
//  Syndicat, Paie horaire, Firebase sync, Anti-exploit
// ============================================================

import { db } from '../lib/firebase/config'
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'

// ============================================================
//  TYPES
// ============================================================

export type JobCategory =
  | 'transport'
  | 'commerce'
  | 'securite'
  | 'sante'
  | 'construction'
  | 'restauration'
  | 'illegal'
  | 'gouvernement'
  | 'media'

export type JobLevel = 1 | 2 | 3 | 4 | 5

export type SkillType =
  | 'conduite'
  | 'force'
  | 'endurance'
  | 'charisme'
  | 'technique'
  | 'discretion'
  | 'medecine'
  | 'cuisine'

export interface JobDef {
  id:            string
  title:         string
  emoji:         string
  category:      JobCategory
  description:   string
  // Récompenses
  reward:        number          // $ de base
  bonusPerLevel: number          // $ par niveau de compétence
  xpReward:      number          // XP gagné
  // Timing
  durationMs:    number
  cooldownMs:    number
  // Conditions
  levelRequired: JobLevel
  skillRequired?: { skill: SkillType; level: number }
  licenseRequired?: string
  // Gameplay
  steps:         JobStep[]
  location:      string
  locationCoords?: [number, number, number]
  // Légalité
  isIllegal:     boolean
  wantedOnCatch?: number         // wanted level si attrapé
  // Faction
  factionId?:    string
  factionBonus?: number          // % bonus si dans la faction
}

export interface JobStep {
  id:          string
  description: string
  duration:    number            // ms pour cette étape
  skillCheck?: { skill: SkillType; difficulty: number }
  canFail?:    boolean
  failPenalty?: number           // $ perdu si échoue
}

export interface ActiveJob {
  id:          string
  title:       string
  emoji:       string
  category:    JobCategory
  reward:      number            // récompense finale calculée
  progress:    number            // 0 → 1 global
  currentStep: number
  steps:       JobStep[]
  startedAt:   number
  durationMs:  number
  location:    string
  isIllegal:   boolean
  bonusMultiplier: number
  stepProgress: number           // 0 → 1 étape courante
}

export interface PlayerSkills {
  conduite:   number             // 0-100
  force:      number
  endurance:  number
  charisme:   number
  technique:  number
  discretion: number
  medecine:   number
  cuisine:    number
}

export interface PlayerLicense {
  id:         string
  name:       string
  obtainedAt: number
  expiresAt?: number
}

export interface JobHistory {
  jobId:       string
  title:       string
  emoji:       string
  reward:      number
  completedAt: number
  success:     boolean
  duration:    number
}

export interface FactionMembership {
  factionId:   string
  name:        string
  rank:        number            // 0-5
  joinedAt:    number
  contribution: number
}

// ============================================================
//  CATALOGUE DE JOBS — 25+ jobs
// ============================================================

export const JOB_CATALOG: Record<string, JobDef> = {

  // ── TRANSPORT ──────────────────────────────────────────────

  taxi: {
    id: 'taxi', title: 'Chauffeur Taxi', emoji: '🚕',
    category: 'transport', description: 'Transporte des clients dans la ville',
    reward: 180, bonusPerLevel: 30, xpReward: 15,
    durationMs: 12000, cooldownMs: 20000,
    levelRequired: 1,
    location: 'Centre-Ville', locationCoords: [10, 0, 10],
    isIllegal: false,
    steps: [
      { id: 'pickup',  description: 'Récupérer le client',     duration: 3000 },
      { id: 'drive',   description: 'Conduire à destination',  duration: 6000, skillCheck: { skill: 'conduite', difficulty: 20 } },
      { id: 'payment', description: 'Encaisser le paiement',   duration: 3000 },
    ],
  },

  livreur: {
    id: 'livreur', title: 'Livreur Express', emoji: '📦',
    category: 'transport', description: 'Livre des colis urgents à travers la ville',
    reward: 220, bonusPerLevel: 35, xpReward: 20,
    durationMs: 15000, cooldownMs: 25000,
    levelRequired: 1,
    location: 'Entrepôt', locationCoords: [-20, 0, 30],
    isIllegal: false,
    steps: [
      { id: 'collect',  description: 'Récupérer les colis',       duration: 2000 },
      { id: 'route1',   description: 'Livraison secteur A',        duration: 5000, skillCheck: { skill: 'conduite', difficulty: 15 } },
      { id: 'route2',   description: 'Livraison secteur B',        duration: 5000 },
      { id: 'confirm',  description: 'Confirmation livraisons',    duration: 3000 },
    ],
  },

  camionneur: {
    id: 'camionneur', title: 'Camionneur', emoji: '🚛',
    category: 'transport', description: 'Transporte des marchandises lourdes sur la Route 138',
    reward: 450, bonusPerLevel: 60, xpReward: 40,
    durationMs: 30000, cooldownMs: 60000,
    levelRequired: 2,
    skillRequired: { skill: 'conduite', level: 25 },
    licenseRequired: 'permis_c',
    location: 'Terminal Routier',
    isIllegal: false,
    steps: [
      { id: 'chargement', description: 'Charger la marchandise',   duration: 5000 },
      { id: 'route',      description: 'Conduire Route 138',       duration: 18000, skillCheck: { skill: 'conduite', difficulty: 35 } },
      { id: 'livraison',  description: 'Décharger à destination',  duration: 5000 },
      { id: 'rapport',    description: 'Rapport de livraison',     duration: 2000 },
    ],
  },

  ambulancier: {
    id: 'ambulancier', title: 'Ambulancier', emoji: '🚑',
    category: 'sante', description: 'Répond aux urgences médicales',
    reward: 520, bonusPerLevel: 80, xpReward: 55,
    durationMs: 20000, cooldownMs: 30000,
    levelRequired: 2,
    skillRequired: { skill: 'medecine', level: 30 },
    licenseRequired: 'diplome_sante',
    location: 'Hôpital',
    isIllegal: false,
    factionId: 'sante_publique',
    factionBonus: 20,
    steps: [
      { id: 'alerte',    description: 'Répondre à l\'appel',       duration: 2000 },
      { id: 'transport', description: 'Se rendre sur les lieux',   duration: 5000, skillCheck: { skill: 'conduite', difficulty: 40 } },
      { id: 'soin',      description: 'Prodiguer les premiers soins', duration: 8000, skillCheck: { skill: 'medecine', difficulty: 45 } },
      { id: 'hopital',   description: 'Transport à l\'hôpital',    duration: 5000 },
    ],
  },

  // ── COMMERCE ───────────────────────────────────────────────

  caissier_dep: {
    id: 'caissier_dep', title: 'Caissier Dépanneur', emoji: '🏪',
    category: 'commerce', description: 'Sers les clients au Dépanneur',
    reward: 120, bonusPerLevel: 15, xpReward: 10,
    durationMs: 8000, cooldownMs: 15000,
    levelRequired: 1,
    location: 'Dépanneur',
    isIllegal: false,
    steps: [
      { id: 'ouverture', description: 'Ouvrir la caisse',          duration: 1000 },
      { id: 'service',   description: 'Servir les clients',        duration: 5000, skillCheck: { skill: 'charisme', difficulty: 10 } },
      { id: 'fermeture', description: 'Fermer la caisse',          duration: 2000 },
    ],
  },

  cuisinier: {
    id: 'cuisinier', title: 'Cuisinier', emoji: '👨‍🍳',
    category: 'restauration', description: 'Prépare les repas au restaurant',
    reward: 280, bonusPerLevel: 40, xpReward: 25,
    durationMs: 14000, cooldownMs: 20000,
    levelRequired: 1,
    skillRequired: { skill: 'cuisine', level: 10 },
    location: 'Restaurant Route 138',
    isIllegal: false,
    steps: [
      { id: 'prep',       description: 'Préparer les ingrédients',  duration: 3000 },
      { id: 'cuisson',    description: 'Cuisson des plats',         duration: 6000, skillCheck: { skill: 'cuisine', difficulty: 30 } },
      { id: 'dressage',   description: 'Dresser les assiettes',     duration: 3000, skillCheck: { skill: 'cuisine', difficulty: 20 } },
      { id: 'service',    description: 'Envoyer en salle',          duration: 2000 },
    ],
  },

  hotelier: {
    id: 'hotelier', title: 'Réceptionniste Hôtel', emoji: '🏨',
    category: 'commerce', description: 'Accueille les clients à l\'Hôtel EtherWorld',
    reward: 200, bonusPerLevel: 25, xpReward: 18,
    durationMs: 10000, cooldownMs: 18000,
    levelRequired: 1,
    skillRequired: { skill: 'charisme', level: 15 },
    location: 'Hôtel EtherWorld',
    isIllegal: false,
    steps: [
      { id: 'accueil',   description: 'Accueillir le client',       duration: 2000, skillCheck: { skill: 'charisme', difficulty: 15 } },
      { id: 'checkin',   description: 'Procéder au check-in',       duration: 4000 },
      { id: 'cle',       description: 'Remettre la clé de chambre', duration: 2000 },
      { id: 'info',      description: 'Informer des services',      duration: 2000 },
    ],
  },

  femme_chambre: {
    id: 'femme_chambre', title: 'Femme de Chambre', emoji: '🛎️',
    category: 'commerce', description: 'Nettoie les chambres de l\'hôtel',
    reward: 160, bonusPerLevel: 20, xpReward: 12,
    durationMs: 12000, cooldownMs: 20000,
    levelRequired: 1,
    location: 'Hôtel EtherWorld',
    isIllegal: false,
    steps: [
      { id: 'chariot',   description: 'Préparer le chariot',        duration: 2000 },
      { id: 'nettoyage', description: 'Nettoyer les chambres',      duration: 6000 },
      { id: 'linge',     description: 'Changer le linge',           duration: 3000 },
      { id: 'rapport',   description: 'Signaler les anomalies',     duration: 1000 },
    ],
  },

  // ── SÉCURITÉ ───────────────────────────────────────────────

  agent_securite: {
    id: 'agent_securite', title: 'Agent de Sécurité', emoji: '💂',
    category: 'securite', description: 'Surveille les bâtiments commerciaux',
    reward: 310, bonusPerLevel: 45, xpReward: 28,
    durationMs: 16000, cooldownMs: 30000,
    levelRequired: 2,
    skillRequired: { skill: 'force', level: 20 },
    location: 'Centre Commercial',
    isIllegal: false,
    steps: [
      { id: 'briefing',  description: 'Briefing de début de quart', duration: 2000 },
      { id: 'ronde_1',   description: 'Première ronde de surveillance', duration: 5000 },
      { id: 'incident',  description: 'Gérer un incident',          duration: 5000, skillCheck: { skill: 'force', difficulty: 30 }, canFail: true, failPenalty: 50 },
      { id: 'rapport',   description: 'Rapport de fin de quart',    duration: 4000 },
    ],
  },

  policier: {
    id: 'policier', title: 'Policier SPVQ', emoji: '👮',
    category: 'securite', description: 'Maintien de l\'ordre sur la Route 138',
    reward: 480, bonusPerLevel: 70, xpReward: 50,
    durationMs: 25000, cooldownMs: 45000,
    levelRequired: 3,
    skillRequired: { skill: 'force', level: 40 },
    licenseRequired: 'badge_police',
    location: 'Poste de Police',
    isIllegal: false,
    factionId: 'spvq',
    factionBonus: 25,
    steps: [
      { id: 'briefing',  description: 'Briefing au poste',          duration: 3000 },
      { id: 'patrouille', description: 'Patrouille Route 138',      duration: 10000, skillCheck: { skill: 'conduite', difficulty: 25 } },
      { id: 'arrestation', description: 'Interpeller un suspect',   duration: 7000, skillCheck: { skill: 'force', difficulty: 45 }, canFail: true },
      { id: 'rapport',   description: 'Rédiger le rapport',         duration: 5000, skillCheck: { skill: 'technique', difficulty: 20 } },
    ],
  },

  // ── CONSTRUCTION ───────────────────────────────────────────

  ouvrier: {
    id: 'ouvrier', title: 'Ouvrier Construction', emoji: '👷',
    category: 'construction', description: 'Travaille sur les chantiers de la région',
    reward: 260, bonusPerLevel: 35, xpReward: 22,
    durationMs: 18000, cooldownMs: 35000,
    levelRequired: 1,
    skillRequired: { skill: 'force', level: 15 },
    location: 'Chantier Route 138',
    isIllegal: false,
    steps: [
      { id: 'equip',     description: 'Enfiler l\'équipement',      duration: 2000 },
      { id: 'material',  description: 'Décharger les matériaux',    duration: 5000, skillCheck: { skill: 'force', difficulty: 25 } },
      { id: 'travail',   description: 'Travailler sur le chantier', duration: 8000, skillCheck: { skill: 'endurance', difficulty: 30 } },
      { id: 'nettoyage', description: 'Nettoyer le chantier',       duration: 3000 },
    ],
  },

  electricien: {
    id: 'electricien', title: 'Électricien', emoji: '⚡',
    category: 'construction', description: 'Répare les installations électriques',
    reward: 380, bonusPerLevel: 55, xpReward: 35,
    durationMs: 20000, cooldownMs: 40000,
    levelRequired: 2,
    skillRequired: { skill: 'technique', level: 35 },
    location: 'Entrepôt Électrique',
    isIllegal: false,
    steps: [
      { id: 'diagnostic', description: 'Diagnostic du problème',    duration: 4000, skillCheck: { skill: 'technique', difficulty: 30 } },
      { id: 'materiel',  description: 'Récupérer le matériel',      duration: 3000 },
      { id: 'reparation', description: 'Effectuer la réparation',   duration: 10000, skillCheck: { skill: 'technique', difficulty: 45 }, canFail: true, failPenalty: 100 },
      { id: 'test',      description: 'Tester l\'installation',     duration: 3000 },
    ],
  },

  // ── GOUVERNEMENT ───────────────────────────────────────────

  fonctionnaire: {
    id: 'fonctionnaire', title: 'Fonctionnaire Municipal', emoji: '🏛️',
    category: 'gouvernement', description: 'Traite les dossiers de la mairie',
    reward: 290, bonusPerLevel: 40, xpReward: 24,
    durationMs: 12000, cooldownMs: 25000,
    levelRequired: 2,
    skillRequired: { skill: 'technique', level: 20 },
    location: 'Hôtel de Ville',
    isIllegal: false,
    factionId: 'municipalite',
    factionBonus: 15,
    steps: [
      { id: 'tri',       description: 'Trier les dossiers',         duration: 3000 },
      { id: 'traitement', description: 'Traiter les demandes',      duration: 6000, skillCheck: { skill: 'technique', difficulty: 25 } },
      { id: 'signature', description: 'Signer et archiver',         duration: 3000 },
    ],
  },

  // ── MEDIA ──────────────────────────────────────────────────

  journaliste: {
    id: 'journaliste', title: 'Journaliste', emoji: '📰',
    category: 'media', description: 'Couvre les événements locaux',
    reward: 340, bonusPerLevel: 50, xpReward: 30,
    durationMs: 18000, cooldownMs: 35000,
    levelRequired: 2,
    skillRequired: { skill: 'charisme', level: 30 },
    location: 'Journal Local',
    isIllegal: false,
    steps: [
      { id: 'sujet',     description: 'Trouver un sujet',           duration: 3000, skillCheck: { skill: 'charisme', difficulty: 20 } },
      { id: 'terrain',   description: 'Reportage sur le terrain',   duration: 8000, skillCheck: { skill: 'discretion', difficulty: 25 } },
      { id: 'redaction', description: 'Rédiger l\'article',         duration: 5000, skillCheck: { skill: 'technique', difficulty: 30 } },
      { id: 'publication', description: 'Publier l\'article',       duration: 2000 },
    ],
  },

  // ── ILLÉGAL ────────────────────────────────────────────────

  contrebandier: {
    id: 'contrebandier', title: 'Contrebandier', emoji: '📦',
    category: 'illegal', description: 'Transporte des marchandises interdites',
    reward: 800, bonusPerLevel: 120, xpReward: 60,
    durationMs: 25000, cooldownMs: 90000,
    levelRequired: 3,
    skillRequired: { skill: 'discretion', level: 40 },
    location: 'Quai Abandonné',
    isIllegal: true,
    wantedOnCatch: 3,
    steps: [
      { id: 'contact',   description: 'Contacter le fournisseur',   duration: 3000, skillCheck: { skill: 'charisme', difficulty: 35 } },
      { id: 'chargement', description: 'Charger la marchandise',    duration: 5000, skillCheck: { skill: 'discretion', difficulty: 40 } },
      { id: 'transport', description: 'Transport risqué',           duration: 12000, skillCheck: { skill: 'conduite', difficulty: 50 }, canFail: true, failPenalty: 300 },
      { id: 'livraison', description: 'Livrer discrètement',        duration: 5000, skillCheck: { skill: 'discretion', difficulty: 45 } },
    ],
  },

  pickpocket: {
    id: 'pickpocket', title: 'Pickpocket', emoji: '🤏',
    category: 'illegal', description: 'Vole les passants dans la rue',
    reward: 150, bonusPerLevel: 30, xpReward: 20,
    durationMs: 8000, cooldownMs: 30000,
    levelRequired: 2,
    skillRequired: { skill: 'discretion', level: 25 },
    location: 'Marché Public',
    isIllegal: true,
    wantedOnCatch: 1,
    steps: [
      { id: 'cible',     description: 'Identifier une cible',       duration: 2000, skillCheck: { skill: 'discretion', difficulty: 30 } },
      { id: 'approche',  description: 'S\'approcher naturellement', duration: 3000, skillCheck: { skill: 'charisme', difficulty: 25 } },
      { id: 'vol',       description: 'Effectuer le vol',           duration: 3000, skillCheck: { skill: 'discretion', difficulty: 50 }, canFail: true, failPenalty: 200 },
    ],
  },

  hacker: {
    id: 'hacker', title: 'Hacker', emoji: '💻',
    category: 'illegal', description: 'Pirate les systèmes informatiques',
    reward: 1200, bonusPerLevel: 180, xpReward: 80,
    durationMs: 35000, cooldownMs: 120000,
    levelRequired: 4,
    skillRequired: { skill: 'technique', level: 60 },
    location: 'Cybercafé Abandonné',
    isIllegal: true,
    wantedOnCatch: 4,
    steps: [
      { id: 'setup',     description: 'Configurer le matériel',     duration: 5000, skillCheck: { skill: 'technique', difficulty: 40 } },
      { id: 'intrusion', description: 'Pénétrer le système',        duration: 10000, skillCheck: { skill: 'technique', difficulty: 65 }, canFail: true, failPenalty: 0 },
      { id: 'extraction', description: 'Extraire les données',      duration: 12000, skillCheck: { skill: 'technique', difficulty: 70 }, canFail: true, failPenalty: 0 },
      { id: 'effacement', description: 'Effacer les traces',        duration: 8000, skillCheck: { skill: 'discretion', difficulty: 55 } },
    ],
  },

  braqueur: {
    id: 'braqueur', title: 'Braqueur Dépanneur', emoji: '🔫',
    category: 'illegal', description: 'Braque le dépanneur de nuit',
    reward: 600, bonusPerLevel: 100, xpReward: 50,
    durationMs: 20000, cooldownMs: 180000,
    levelRequired: 3,
    skillRequired: { skill: 'force', level: 45 },
    location: 'Dépanneur',
    isIllegal: true,
    wantedOnCatch: 5,
    steps: [
      { id: 'reconnaissance', description: 'Reconnaître les lieux', duration: 4000, skillCheck: { skill: 'discretion', difficulty: 35 } },
      { id: 'entree',    description: 'Forcer l\'entrée',           duration: 3000, skillCheck: { skill: 'force', difficulty: 40 } },
      { id: 'caisse',    description: 'Vider la caisse',            duration: 8000, skillCheck: { skill: 'force', difficulty: 30 } },
      { id: 'fuite',     description: 'Prendre la fuite',           duration: 5000, skillCheck: { skill: 'conduite', difficulty: 55 }, canFail: true, failPenalty: 0 },
    ],
  },

  dealer: {
    id: 'dealer', title: 'Dealer', emoji: '💊',
    category: 'illegal', description: 'Vend des substances dans les rues',
    reward: 400, bonusPerLevel: 70, xpReward: 35,
    durationMs: 15000, cooldownMs: 60000,
    levelRequired: 2,
    skillRequired: { skill: 'charisme', level: 30 },
    location: 'Ruelle Sombre',
    isIllegal: true,
    wantedOnCatch: 3,
    steps: [
      { id: 'stock',     description: 'Préparer le stock',          duration: 2000 },
      { id: 'client',    description: 'Trouver un acheteur',        duration: 5000, skillCheck: { skill: 'charisme', difficulty: 40 } },
      { id: 'transaction', description: 'Effectuer la transaction', duration: 5000, skillCheck: { skill: 'discretion', difficulty: 45 }, canFail: true, failPenalty: 150 },
      { id: 'disparaitre', description: 'Disparaître rapidement',   duration: 3000, skillCheck: { skill: 'discretion', difficulty: 30 } },
    ],
  },
}

// ============================================================
//  STATE
// ============================================================

export interface ActiveJob {
  id:              string
  title:           string
  emoji:           string
  category:        JobCategory
  reward:          number
  progress:        number         // 0-1 global
  stepProgress:    number         // 0-1 étape courante
  currentStep:     number
  steps:           JobStep[]
  startedAt:       number
  durationMs:      number
  location:        string
  isIllegal:       boolean
  bonusMultiplier: number
  failed:          boolean
}

export interface GameStateInternal {
  // Argent
  money:           number
  totalEarned:     number
  totalSpent:      number
  // Job actif
  activeJob:       ActiveJob | null
  jobCooldowns:    Record<string, number>
  jobHistory:      JobHistory[]
  // Joueur
  level:           number
  xp:              number
  xpToNextLevel:   number
  skills:          PlayerSkills
  licenses:        PlayerLicense[]
  // Faction
  faction:         FactionMembership | null
  // Stats
  jobsCompleted:   number
  jobsFailed:      number
  totalPlaytime:   number
  sessionStart:    number
  // Paie horaire
  hourlyJob:       string | null
  hourlyRate:      number
  lastHourlyPay:   number
}

// ============================================================
//  STATE INITIAL
// ============================================================

const DEFAULT_SKILLS: PlayerSkills = {
  conduite:   10,
  force:      10,
  endurance:  10,
  charisme:   10,
  technique:  10,
  discretion: 10,
  medecine:   10,
  cuisine:    10,
}

function calcXpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

const state: GameStateInternal = {
  money:          2500,
  totalEarned:    0,
  totalSpent:     0,
  activeJob:      null,
  jobCooldowns:   {},
  jobHistory:     [],
  level:          1,
  xp:             0,
  xpToNextLevel:  calcXpToNextLevel(1),
  skills:         { ...DEFAULT_SKILLS },
  licenses:       [],
  faction:        null,
  jobsCompleted:  0,
  jobsFailed:     0,
  totalPlaytime:  0,
  sessionStart:   Date.now(),
  hourlyJob:      null,
  hourlyRate:     0,
  lastHourlyPay:  Date.now(),
}

// ============================================================
//  LISTENERS
// ============================================================

const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach(fn => fn())
}

export function getState(): Readonly<GameStateInternal> {
  return { ...state }
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ============================================================
//  ARGENT
// ============================================================

export function addMoney(amount: number, reason = 'unknown'): void {
  if (amount <= 0) return
  state.money       += amount
  state.totalEarned += amount
  notify()
  console.log(`%c[Economy] +${amount}$ (${reason}) → Total: ${state.money}$`, 'color:#4f4')
}

export function removeMoney(amount: number, reason = 'unknown'): boolean {
  if (amount > state.money) return false
  state.money      -= amount
  state.totalSpent += amount
  notify()
  return true
}

// ============================================================
//  XP & NIVEAUX
// ============================================================

export function addXP(amount: number): void {
  state.xp += amount

  // Level up
  while (state.xp >= state.xpToNextLevel) {
    state.xp          -= state.xpToNextLevel
    state.level        += 1
    state.xpToNextLevel = calcXpToNextLevel(state.level)

    console.log(`%c[Level Up] Niveau ${state.level} atteint!`, 'color:#ff0;font-weight:bold')

    window.dispatchEvent(new CustomEvent('player-levelup', {
      detail: { level: state.level }
    }))
  }

  notify()
}

// ============================================================
//  COMPÉTENCES
// ============================================================

export function improveSkill(skill: SkillType, amount = 1): void {
  const current = state.skills[skill]
  state.skills[skill] = Math.min(100, current + amount)
  notify()
}

export function getSkillLevel(skill: SkillType): number {
  return state.skills[skill]
}

// ============================================================
//  LICENCES
// ============================================================

export function addLicense(id: string, name: string, expiresInDays?: number): void {
  const existing = state.licenses.find(l => l.id === id)
  if (existing) return

  state.licenses.push({
    id,
    name,
    obtainedAt: Date.now(),
    expiresAt:  expiresInDays
      ? Date.now() + expiresInDays * 86400000
      : undefined,
  })
  notify()
}

export function hasLicense(id: string): boolean {
  const lic = state.licenses.find(l => l.id === id)
  if (!lic) return false
  if (lic.expiresAt && lic.expiresAt < Date.now()) return false
  return true
}

// ============================================================
//  FACTION
// ============================================================

export function joinFaction(id: string, name: string): void {
  state.faction = { factionId: id, name, rank: 0, joinedAt: Date.now(), contribution: 0 }
  notify()
}

export function leaveFaction(): void {
  state.faction = null
  notify()
}

export function addFactionContribution(amount: number): void {
  if (!state.faction) return
  state.faction.contribution += amount

  // Promotion automatique
  const thresholds = [0, 100, 300, 600, 1000, 2000]
  const newRank = thresholds.filter(t => state.faction!.contribution >= t).length - 1
  state.faction.rank = Math.min(5, newRank) as JobLevel
  notify()
}

// ============================================================
//  JOB SYSTEM
// ============================================================

export function canStartJob(jobId: string): boolean {
  if (state.activeJob) return false

  const cd = state.jobCooldowns[jobId]
  if (cd && Date.now() < cd) return false

  const def = JOB_CATALOG[jobId]
  if (!def) return true

  // Vérif niveau
  if (state.level < def.levelRequired) return false

  // Vérif compétence
  if (def.skillRequired && state.skills[def.skillRequired.skill] < def.skillRequired.level) return false

  // Vérif licence
  if (def.licenseRequired && !hasLicense(def.licenseRequired)) return false

  return true
}

export function getJobCooldownSec(jobId: string): number {
  const cd = state.jobCooldowns[jobId]
  if (!cd) return 0
  return Math.max(0, Math.ceil((cd - Date.now()) / 1000))
}

export function getCannotStartReason(jobId: string): string | null {
  if (state.activeJob) return 'Un job est déjà en cours'

  const cd = state.jobCooldowns[jobId]
  if (cd && Date.now() < cd) return `Disponible dans ${getJobCooldownSec(jobId)}s`

  const def = JOB_CATALOG[jobId]
  if (!def) return null

  if (state.level < def.levelRequired)
    return `Niveau ${def.levelRequired} requis (vous êtes niveau ${state.level})`

  if (def.skillRequired && state.skills[def.skillRequired.skill] < def.skillRequired.level)
    return `${def.skillRequired.skill} ${def.skillRequired.level} requis`

  if (def.licenseRequired && !hasLicense(def.licenseRequired))
    return `Licence "${def.licenseRequired}" requise`

  return null
}

export function startJob(jobDefOrId: JobDef | string): void {
  const def = typeof jobDefOrId === 'string'
    ? JOB_CATALOG[jobDefOrId]
    : jobDefOrId

  if (!def || !canStartJob(def.id)) return

  // Calcul récompense avec bonus
  let bonus = 1.0
  if (state.faction?.factionId === def.factionId && def.factionBonus) {
    bonus += def.factionBonus / 100
  }
  bonus += (state.level - 1) * 0.05  // +5% par niveau

  const finalReward = Math.round(
    def.reward + (def.bonusPerLevel * (state.skills[def.skillRequired?.skill ?? 'endurance'] / 10))
  ) * bonus

  state.activeJob = {
    id:              def.id,
    title:           def.title,
    emoji:           def.emoji,
    category:        def.category,
    reward:          Math.round(finalReward),
    progress:        0,
    stepProgress:    0,
    currentStep:     0,
    steps:           def.steps,
    startedAt:       Date.now(),
    durationMs:      def.durationMs,
    location:        def.location,
    isIllegal:       def.isIllegal,
    bonusMultiplier: bonus,
    failed:          false,
  }

  notify()
  console.log(`%c[Job] Démarré: ${def.emoji} ${def.title} → ${Math.round(finalReward)}$`, 'color:#4af')
  startJobLoop(def)
}

// ── Boucle principale du job ──────────────────────────────────

function startJobLoop(def: JobDef): void {
  const jobId    = def.id
  const stepCount = def.steps.length
  let   stepIdx  = 0
  let   stepStart = Date.now()

  const loop = setInterval(() => {
    const job = state.activeJob
    if (!job || job.id !== jobId) {
      clearInterval(loop)
      return
    }

    const now         = Date.now()
    const totalElapsed = now - job.startedAt
    const step        = def.steps[stepIdx]
    const stepElapsed = now - stepStart

    // Progression étape courante
    job.stepProgress = Math.min(1, stepElapsed / step.duration)

    // Progression globale
    job.progress = Math.min(1, totalElapsed / def.durationMs)

    // Fin de l'étape
    if (stepElapsed >= step.duration) {
      // Skill check
      if (step.skillCheck) {
        const playerSkill = state.skills[step.skillCheck.skill]
        const chance      = Math.min(95, playerSkill / step.skillCheck.difficulty * 80)
        const success     = Math.random() * 100 <= chance

        if (!success && step.canFail) {
          // Échec de l'étape
          if (step.failPenalty && step.failPenalty > 0) {
            removeMoney(step.failPenalty, `Pénalité job ${def.title}`)
          }
          // Améliore quand même un peu la compétence
          improveSkill(step.skillCheck.skill, 0.5)

          if (def.isIllegal) {
            // Job illégal échoué → wanted
            window.dispatchEvent(new CustomEvent('job-caught', {
              detail: { jobId, wantedLevel: def.wantedOnCatch ?? 1 }
            }))
            failJob(def)
            clearInterval(loop)
            return
          }
        } else {
          // Succès → améliore compétence
          improveSkill(step.skillCheck.skill, 1)
        }
      }

      stepIdx++
      stepStart = now

      // Toutes les étapes terminées
      if (stepIdx >= stepCount) {
        clearInterval(loop)
        completeJob(def)
      }
    }

    notify()
  }, 100)
}

// ── Complétion ────────────────────────────────────────────────

function completeJob(def: JobDef): void {
  const job = state.activeJob
  if (!job) return

  const reward = job.reward

  addMoney(reward, `Job: ${def.title}`)
  addXP(def.xpReward)
  addFactionContribution(Math.floor(reward / 10))

  // Amélioration compétences liées
  if (def.skillRequired) improveSkill(def.skillRequired.skill, 2)
  improveSkill('endurance', 1)

  // Historique
  state.jobHistory.unshift({
    jobId:       def.id,
    title:       def.title,
    emoji:       def.emoji,
    reward,
    completedAt: Date.now(),
    success:     true,
    duration:    def.durationMs,
  })
  if (state.jobHistory.length > 50) state.jobHistory.pop()

  state.jobsCompleted += 1
  state.activeJob      = null
  state.jobCooldowns[def.id] = Date.now() + def.cooldownMs

  notify()

  console.log(`%c[Job] ✅ Complété: ${def.emoji} ${def.title} +${reward}$`, 'color:#4f4;font-weight:bold')

  window.dispatchEvent(new CustomEvent('job-completed', {
    detail: { jobId: def.id, reward, title: def.title }
  }))
}

// ── Échec ─────────────────────────────────────────────────────

function failJob(def: JobDef): void {
  state.jobHistory.unshift({
    jobId:       def.id,
    title:       def.title,
    emoji:       def.emoji,
    reward:      0,
    completedAt: Date.now(),
    success:     false,
    duration:    def.durationMs,
  })

  state.jobsFailed  += 1
  state.activeJob    = null
  state.jobCooldowns[def.id] = Date.now() + def.cooldownMs * 2  // Cooldown doublé si échoue

  notify()

  window.dispatchEvent(new CustomEvent('job-failed', {
    detail: { jobId: def.id, title: def.title }
  }))
}

export function cancelJob(): void {
  if (!state.activeJob) return
  const id = state.activeJob.id
  state.activeJob = null
  state.jobCooldowns[id] = Date.now() + 30000  // 30s cooldown si annulé
  notify()
}

export function getActiveJob(): ActiveJob | null {
  return state.activeJob
}

// ============================================================
//  PAIE HORAIRE (pour jobs permanents)
// ============================================================

export function setHourlyJob(jobId: string | null, ratePerMinute = 0): void {
  state.hourlyJob    = jobId
  state.hourlyRate   = ratePerMinute
  state.lastHourlyPay = Date.now()
  notify()
}

export function tickHourlyPay(): void {
  if (!state.hourlyJob || state.hourlyRate <= 0) return

  const now      = Date.now()
  const elapsed  = (now - state.lastHourlyPay) / 60000  // en minutes
  const earned   = Math.floor(elapsed * state.hourlyRate)

  if (earned > 0) {
    addMoney(earned, `Salaire: ${state.hourlyJob}`)
    state.lastHourlyPay = now
  }
}

// ============================================================
//  FIREBASE SYNC
// ============================================================

let firebaseUnsub: Unsubscribe | null = null

export function startFirebaseSync(playerId: string): void {
  if (!db || !playerId) return

  // Push local → Firebase toutes les 10s
  const pushInterval = setInterval(() => {
    pushStateToFirebase(playerId)
  }, 10000)

  // Listen Firebase → local (pour multi-device)
  const ref = doc(db, 'players', playerId, 'gameState', 'current')
  firebaseUnsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return
    const data = snap.data()
    if (data.money !== undefined && data.money !== state.money) {
      state.money = data.money
      notify()
    }
  })

  // Cleanup
  window.addEventListener('beforeunload', () => {
    clearInterval(pushInterval)
    pushStateToFirebase(playerId)
  })
}

async function pushStateToFirebase(playerId: string): Promise<void> {
  if (!db) return
  try {
    await setDoc(
      doc(db, 'players', playerId, 'gameState', 'current'),
      {
        money:          state.money,
        level:          state.level,
        xp:             state.xp,
        skills:         state.skills,
        jobsCompleted:  state.jobsCompleted,
        lastUpdated:    serverTimestamp(),
      },
      { merge: true }
    )
  } catch (err) {
    console.error('[GameState] Firebase push erreur:', err)
  }
}

export function stopFirebaseSync(): void {
  if (firebaseUnsub) {
    firebaseUnsub()
    firebaseUnsub = null
  }
}

// ============================================================
//  QUERIES UTILES
// ============================================================

export function getAvailableJobs(): JobDef[] {
  return Object.values(JOB_CATALOG).filter(job => {
    if (state.activeJob) return false
    const cd = state.jobCooldowns[job.id]
    if (cd && Date.now() < cd) return false
    if (state.level < job.levelRequired) return false
    if (job.skillRequired && state.skills[job.skillRequired.skill] < job.skillRequired.level) return false
    if (job.licenseRequired && !hasLicense(job.licenseRequired)) return false
    return true
  })
}

export function getJobsByCategory(category: JobCategory): JobDef[] {
  return Object.values(JOB_CATALOG).filter(j => j.category === category)
}

export function getJobStats(): {
  completed:   number
  failed:      number
  successRate: number
  totalEarned: number
  bestJob:     string | null
} {
  const successRate = state.jobsCompleted + state.jobsFailed > 0
    ? Math.round(state.jobsCompleted / (state.jobsCompleted + state.jobsFailed) * 100)
    : 0

  const jobEarnings: Record<string, number> = {}
  for (const h of state.jobHistory) {
    if (h.success) jobEarnings[h.title] = (jobEarnings[h.title] || 0) + h.reward
  }

  const bestJob = Object.entries(jobEarnings)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    completed:   state.jobsCompleted,
    failed:      state.jobsFailed,
    successRate,
    totalEarned: state.totalEarned,
    bestJob,
  }
}