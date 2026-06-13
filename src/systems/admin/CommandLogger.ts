/**
 * CommandLogger.ts — Logging & Audit complet pour EtherWorld RP
 * Enregistrement, filtrage, export JSON/CSV, rapports
 */

import type { AdminProfile } from './PermissionSystem'

export interface CommandLog {
  id: string
  adminId: string
  adminName: string
  commandName: string
  args: (string | number | object)[]
  target?: string
  timestamp: number
  success: boolean
  result: string
}

export type LogFilter = {
  adminId?: string
  commandName?: string
  startDate?: number
  endDate?: number
  successOnly?: boolean
}

export class CommandLogger {
  private logs: CommandLog[] = []
  private maxLogs = 10000
  private listeners: Array<(log: CommandLog) => void> = []

  /**
   * Enregistrer un log de commande
   */
  logCommand(entry: Omit<CommandLog, 'id' | 'timestamp'>): CommandLog {
    const log: CommandLog = {
      ...entry,
      id: `${entry.adminId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    }

    this.logs.unshift(log)

    // Limiter la taille
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Notifier les écouteurs
    this.listeners.forEach(listener => listener(log))

    return log
  }

  /**
   * S'abonner aux nouveaux logs
   */
  onCommandLogged(listener: (log: CommandLog) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Obtenir tous les logs
   */
  getLogs(filter?: LogFilter): CommandLog[] {
    let results = this.logs

    if (filter?.adminId) {
      results = results.filter(log => log.adminId === filter.adminId)
    }

    if (filter?.commandName) {
      results = results.filter(log => log.commandName === filter.commandName)
    }

    if (filter?.startDate) {
      results = results.filter(log => log.timestamp >= filter.startDate!)
    }

    if (filter?.endDate) {
      results = results.filter(log => log.timestamp <= filter.endDate!)
    }

    if (filter?.successOnly) {
      results = results.filter(log => log.success)
    }

    return results
  }

  /**
   * Obtenir les logs récents (dernières N entrées)
   */
  getRecentLogs(count: number = 50): CommandLog[] {
    return this.logs.slice(0, count)
  }

  /**
   * Obtenir les logs d'un joueur spécifique (par target)
   */
  getPlayerLogs(playerId: string): CommandLog[] {
    return this.logs.filter(log => log.target === playerId)
  }

  /**
   * Obtenir les logs d'un admin spécifique
   */
  getAdminLogs(adminId: string): CommandLog[] {
    return this.logs.filter(log => log.adminId === adminId)
  }

  /**
   * Obtenir les logs d'une commande spécifique
   */
  getCommandLogs(commandName: string): CommandLog[] {
    return this.logs.filter(log => log.commandName === commandName)
  }

  /**
   * Statistiques des logs
   */
  getStats(): { totalLogs: number; totalAdmins: number; commandStats: Record<string, number>; successRate: number } {
    const commandStats: Record<string, number> = {}
    const adminIds = new Set<string>()
    let successCount = 0

    this.logs.forEach(log => {
      commandStats[log.commandName] = (commandStats[log.commandName] ?? 0) + 1
      adminIds.add(log.adminId)
      if (log.success) successCount++
    })

    return {
      totalLogs: this.logs.length,
      totalAdmins: adminIds.size,
      commandStats,
      successRate: this.logs.length > 0 ? successCount / this.logs.length : 0,
    }
  }

  /**
   * Exporter les logs en JSON
   */
  exportLogsJSON(filter?: LogFilter): string {
    return JSON.stringify(this.getLogs(filter), null, 2)
  }

  /**
   * Exporter les logs en CSV
   */
  exportLogsCSV(filter?: LogFilter): string {
    const logs = this.getLogs(filter)
    if (logs.length === 0) return ''

    const header = 'ID,AdminID,AdminName,Command,Args,Target,Timestamp,Success,Result'
    const rows = logs.map(log => {
      const argsStr = log.args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join('|')
      return `${log.id},${log.adminId},${log.adminName},${log.commandName},"${argsStr}",${log.target ?? ''},${log.timestamp},${log.success},"${log.result}"`
    })

    return [header, ...rows].join('\n')
  }

  /**
   * Générer un rapport formaté
   */
  generateReport(title: string, filter?: LogFilter): string {
    const logs = this.getLogs(filter)
    const stats = this.getStats()

    const lines = [
      `═══ ${title} ═══`,
      `Généré le: ${new Date().toLocaleString('fr-CA')}`,
      `Total logs: ${logs.length}`,
      `Admins actifs: ${stats.totalAdmins}`,
      `Taux de succès: ${(stats.successRate * 100).toFixed(1)}%`,
      '',
      'Commandes les plus utilisées:',
      ...Object.entries(stats.commandStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([cmd, count]) => `  - ${cmd}: ${count} fois`),
      '',
      'Dernières 20 commandes:',
      ...logs.slice(0, 20).map(log =>
        `  [${new Date(log.timestamp).toLocaleTimeString('fr-CA')}] ${log.adminName} → /${log.commandName} ${log.args.join(' ')} (${log.success ? '✓' : '✗'})`
      ),
    ]

    return lines.join('\n')
  }

  /**
   * Nettoyer les vieux logs
   */
  clearOldLogs(maxAgeMs: number): number {
    const cutoff = Date.now() - maxAgeMs
    const before = this.logs.length
    this.logs = this.logs.filter(log => log.timestamp > cutoff)
    return before - this.logs.length
  }

  /**
   * Effacer tous les logs
   */
  clearLogs(): void {
    this.logs = []
  }
}

export default CommandLogger
