// src/lib/firebase/adminLogger.ts
// ============================================================
//  ETHERWORLD — Admin Logger v2.0
//  Features: Log types, Rate limiting, Batch logs,
//  Real-time listener, Discord webhook, Local cache
// ============================================================

import { db } from './config'
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  doc,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'

// ——— Types ———

export type LogAction =
  // Joueurs
  | 'player.kick'
  | 'player.ban'
  | 'player.unban'
  | 'player.warn'
  | 'player.teleport'
  | 'player.god'
  | 'player.freeze'
  | 'player.setmoney'
  | 'player.setjob'
  // Monde
  | 'world.spawn'
  | 'world.delete'
  | 'world.weather'
  | 'world.time'
  | 'world.save'
  // Sécurité
  | 'security.anticheat'
  | 'security.report'
  | 'security.flag'
  // Économie
  | 'economy.addmoney'
  | 'economy.removemoney'
  | 'economy.transaction'
  // Système
  | 'system.restart'
  | 'system.backup'
  | 'system.config'
  | 'admin.login'
  | 'admin.logout'

export type LogSeverity = 'info' | 'warning' | 'critical' | 'debug'

export interface LogEntry {
  action:      LogAction | string
  adminUid:    string
  adminName:   string
  severity?:   LogSeverity
  targetUid?:  string
  targetName?: string
  reason?:     string
  extra?:      Record<string, unknown>
  // Auto-remplis
  server?:     string
  createdAt?:  Timestamp
  id?:         string
}

export interface LogFilter {
  adminUid?:  string
  action?:    LogAction | string
  severity?:  LogSeverity
  targetUid?: string
  fromDate?:  Date
  toDate?:    Date
  limitCount?: number
}

// ——— Config ———

const SERVER_ID    = 'ETHERWORLD-QC-01'
const COLLECTION   = 'admin_logs'
const RATE_LIMIT   = 10   // max logs par seconde
const LOCAL_CACHE_MAX = 200

// ——— Rate Limiter ———

class RateLimiter {
  private timestamps: number[] = []

  isAllowed(): boolean {
    const now = Date.now()
    this.timestamps = this.timestamps.filter(t => now - t < 1000)
    if (this.timestamps.length >= RATE_LIMIT) return false
    this.timestamps.push(now)
    return true
  }
}

// ——— Local Cache (pour offline + performance) ———

class LocalLogCache {
  private logs: LogEntry[] = []

  push(entry: LogEntry): void {
    this.logs.unshift(entry)
    if (this.logs.length > LOCAL_CACHE_MAX) {
      this.logs = this.logs.slice(0, LOCAL_CACHE_MAX)
    }
  }

  getAll(): LogEntry[] {
    return [...this.logs]
  }

  clear(): void {
    this.logs = []
  }
}

// ============================================================
//  ADMIN LOGGER
// ============================================================

export class AdminLogger {
  private static rateLimiter = new RateLimiter()
  private static cache = new LocalLogCache()
  private static discordWebhook: string | null = null
  private static pendingBatch: LogEntry[] = []
  private static batchTimer: ReturnType<typeof setTimeout> | null = null

  // ——— Config ———

  static configure(options: {
    discordWebhook?: string
  }): void {
    if (options.discordWebhook) {
      this.discordWebhook = options.discordWebhook
    }
  }

  // ============================================================
  //  LOG — Principal
  // ============================================================

  static async log(entry: LogEntry): Promise<string | null> {
    // Rate limiting
    if (!this.rateLimiter.isAllowed()) {
      console.warn('[AdminLogger] Rate limit atteint')
      return null
    }

    const fullEntry: LogEntry = {
      ...entry,
      severity: entry.severity ?? this.inferSeverity(entry.action),
      server:   SERVER_ID,
    }

    // Cache local immédiat
    this.cache.push(fullEntry)

    // Console dev
    this.consoleLog(fullEntry)

    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...fullEntry,
        createdAt: serverTimestamp(),
      })

      // Discord webhook pour les actions critiques
      if (fullEntry.severity === 'critical' && this.discordWebhook) {
        this.sendDiscord(fullEntry).catch(console.error)
      }

      return docRef.id

    } catch (err) {
      console.error('[AdminLogger] Erreur Firestore:', err)

      // Retry via batch si offline
      this.addToBatch(fullEntry)
      return null
    }
  }

  // ——— Shortcuts ———

  static kick(admin: Pick<LogEntry, 'adminUid' | 'adminName'>, target: { uid: string; name: string }, reason: string) {
    return this.log({ ...admin, action: 'player.kick', targetUid: target.uid, targetName: target.name, reason, severity: 'warning' })
  }

  static ban(admin: Pick<LogEntry, 'adminUid' | 'adminName'>, target: { uid: string; name: string }, reason: string) {
    return this.log({ ...admin, action: 'player.ban', targetUid: target.uid, targetName: target.name, reason, severity: 'critical' })
  }

  static warn(admin: Pick<LogEntry, 'adminUid' | 'adminName'>, target: { uid: string; name: string }, reason: string) {
    return this.log({ ...admin, action: 'player.warn', targetUid: target.uid, targetName: target.name, reason, severity: 'warning' })
  }

  static teleport(admin: Pick<LogEntry, 'adminUid' | 'adminName'>, target: { uid: string; name: string }, coords: [number, number, number]) {
    return this.log({ ...admin, action: 'player.teleport', targetUid: target.uid, targetName: target.name, extra: { coords }, severity: 'info' })
  }

  static spawnObject(admin: Pick<LogEntry, 'adminUid' | 'adminName'>, objectType: string, position: [number, number, number]) {
    return this.log({ ...admin, action: 'world.spawn', extra: { objectType, position }, severity: 'info' })
  }

  static anticheat(targetUid: string, targetName: string, violation: string, data: Record<string, unknown>) {
    return this.log({
      adminUid:   'SYSTEM',
      adminName:  'AntiCheat',
      action:     'security.anticheat',
      targetUid,
      targetName,
      reason:     violation,
      extra:      data,
      severity:   'critical',
    })
  }

  static economy(admin: Pick<LogEntry, 'adminUid' | 'adminName'>, target: { uid: string; name: string }, amount: number, type: 'add' | 'remove') {
    return this.log({
      ...admin,
      action:     type === 'add' ? 'economy.addmoney' : 'economy.removemoney',
      targetUid:  target.uid,
      targetName: target.name,
      extra:      { amount },
      severity:   'warning',
    })
  }

  // ============================================================
  //  GET LOGS — Avec filtres
  // ============================================================

  static async getLogs(filter: LogFilter = {}): Promise<LogEntry[]> {
    const {
      adminUid,
      action,
      severity,
      targetUid,
      limitCount = 50,
    } = filter

    try {
      const ref = collection(db, COLLECTION)
      let constraints: any[] = [
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ]

      if (adminUid)   constraints.push(where('adminUid',   '==', adminUid))
      if (action)     constraints.push(where('action',     '==', action))
      if (severity)   constraints.push(where('severity',   '==', severity))
      if (targetUid)  constraints.push(where('targetUid',  '==', targetUid))

      const q = query(ref, ...constraints)
      const snap = await getDocs(q)

      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as LogEntry[]

    } catch (err) {
      console.error('[AdminLogger] getLogs erreur:', err)
      // Fallback sur le cache local
      return this.cache.getAll().slice(0, limitCount)
    }
  }

  // ============================================================
  //  REAL-TIME LISTENER
  // ============================================================

  static subscribe(
    callback: (logs: LogEntry[]) => void,
    filter: LogFilter = {}
  ): Unsubscribe {
    const ref = collection(db, COLLECTION)
    const q = query(
      ref,
      orderBy('createdAt', 'desc'),
      limit(filter.limitCount ?? 50)
    )

    return onSnapshot(q, (snap) => {
      const logs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as LogEntry[]
      callback(logs)
    }, (err) => {
      console.error('[AdminLogger] Listener erreur:', err)
      // Fallback cache
      callback(this.cache.getAll())
    })
  }

  // ============================================================
  //  STATS — Pour le dashboard
  // ============================================================

  static async getStats(): Promise<{
    total:    number
    byAction: Record<string, number>
    bySeverity: Record<LogSeverity, number>
    recentAdmins: { uid: string; name: string; count: number }[]
  }> {
    try {
      const logs = await this.getLogs({ limitCount: 500 })

      const byAction: Record<string, number> = {}
      const bySeverity: Record<string, number> = { info: 0, warning: 0, critical: 0, debug: 0 }
      const adminMap: Record<string, { name: string; count: number }> = {}

      for (const log of logs) {
        byAction[log.action] = (byAction[log.action] || 0) + 1
        if (log.severity) bySeverity[log.severity]++
        if (log.adminUid && log.adminUid !== 'SYSTEM') {
          if (!adminMap[log.adminUid]) {
            adminMap[log.adminUid] = { name: log.adminName, count: 0 }
          }
          adminMap[log.adminUid].count++
        }
      }

      const recentAdmins = Object.entries(adminMap)
        .map(([uid, data]) => ({ uid, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        total:    logs.length,
        byAction,
        bySeverity: bySeverity as Record<LogSeverity, number>,
        recentAdmins,
      }

    } catch (err) {
      console.error('[AdminLogger] getStats erreur:', err)
      return { total: 0, byAction: {}, bySeverity: { info: 0, warning: 0, critical: 0, debug: 0 }, recentAdmins: [] }
    }
  }

  // ============================================================
  //  BATCH — Pour offline / retry
  // ============================================================

  private static addToBatch(entry: LogEntry): void {
    this.pendingBatch.push(entry)

    if (this.batchTimer) clearTimeout(this.batchTimer)
    this.batchTimer = setTimeout(() => this.flushBatch(), 5000)
  }

  static async flushBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) return

    const toFlush = [...this.pendingBatch]
    this.pendingBatch = []

    try {
      const batch = writeBatch(db)
      for (const entry of toFlush) {
        const ref = doc(collection(db, COLLECTION))
        batch.set(ref, { ...entry, createdAt: serverTimestamp(), _retried: true })
      }
      await batch.commit()
      console.log(`[AdminLogger] Batch flush: ${toFlush.length} logs envoyés`)
    } catch (err) {
      console.error('[AdminLogger] Batch flush échoué:', err)
      // Remettre dans la queue
      this.pendingBatch = [...toFlush, ...this.pendingBatch]
    }
  }

  // ============================================================
  //  INTERNAL HELPERS
  // ============================================================

  private static inferSeverity(action: string): LogSeverity {
    if (['player.ban', 'security.anticheat', 'system.restart'].includes(action)) return 'critical'
    if (['player.kick', 'player.warn', 'economy.removemoney', 'player.freeze'].includes(action)) return 'warning'
    if (['admin.login', 'admin.logout'].includes(action)) return 'debug'
    return 'info'
  }

  private static consoleLog(entry: LogEntry): void {
    const colors: Record<LogSeverity, string> = {
      info:     'color:#4af',
      warning:  'color:#fa4',
      critical: 'color:#f44;font-weight:bold',
      debug:    'color:#888',
    }
    const sev = entry.severity ?? 'info'
    console.log(
      `%c[AdminLog] ${entry.action} | ${entry.adminName} → ${entry.targetName ?? 'Système'}`,
      colors[sev]
    )
  }

  private static async sendDiscord(entry: LogEntry): Promise<void> {
    if (!this.discordWebhook) return

    const severityEmoji: Record<LogSeverity, string> = {
      info:     '🔵',
      warning:  '🟡',
      critical: '🔴',
      debug:    '⚪',
    }

    await fetch(this.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title:  `${severityEmoji[entry.severity ?? 'info']} ${entry.action.toUpperCase()}`,
          color:  entry.severity === 'critical' ? 0xff4444 : entry.severity === 'warning' ? 0xffaa44 : 0x4488ff,
          fields: [
            { name: '👮 Admin',   value: entry.adminName,           inline: true },
            { name: '🎯 Cible',   value: entry.targetName ?? 'N/A', inline: true },
            { name: '📝 Raison',  value: entry.reason    ?? 'N/A',  inline: false },
            { name: '🖥️ Serveur', value: entry.server    ?? SERVER_ID, inline: true },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: 'EtherWorld QC — Admin Logger v2.0' },
        }],
      }),
    })
  }

  // Cache local accessible
  static getLocalCache(): LogEntry[] {
    return this.cache.getAll()
  }

  static clearLocalCache(): void {
    this.cache.clear()
  }
}