import * as THREE from 'three'
import { castArcaneTreeExplosion } from '../events/ArcaneTreeEvents'

export interface ParsedArcaneCommandResult {
  ok: boolean
  message: string
  payload?: unknown
}

function readNumber(args: Record<string, string>, key: string, fallback: number) {
  const v = Number(args[key])
  return Number.isFinite(v) ? v : fallback
}

function parseArgs(tokens: string[]) {
  const args: Record<string, string> = {}
  for (const token of tokens) {
    const [key, ...rest] = token.split('=')
    if (!key || rest.length === 0) continue
    args[key.trim()] = rest.join('=').trim()
  }
  return args
}

export function executeArcaneTreeCommand(command: string, fallbackPosition: THREE.Vector3 | [number, number, number] = [0, 0, 0]): ParsedArcaneCommandResult {
  const clean = command.trim()
  const tokens = clean.split(/\s+/)
  const normalized = tokens.map((t) => t.toLowerCase())

  const isTreeExplode =
    normalized.includes('tree') && normalized.includes('explode') ||
    normalized.includes('trees') && normalized.includes('explode') ||
    normalized.includes('arbre') && normalized.includes('explose')

  if (!isTreeExplode) {
    return { ok: false, message: 'Commande arcane arbre inconnue.' }
  }

  const args = parseArgs(tokens)
  const position: [number, number, number] = Array.isArray(fallbackPosition)
    ? fallbackPosition
    : [fallbackPosition.x, fallbackPosition.y, fallbackPosition.z]

  if ('x' in args || 'y' in args || 'z' in args) {
    position[0] = readNumber(args, 'x', position[0])
    position[1] = readNumber(args, 'y', position[1])
    position[2] = readNumber(args, 'z', position[2])
  }

  const payload = castArcaneTreeExplosion({
    position,
    radius: readNumber(args, 'radius', readNumber(args, 'r', 12)),
    intensity: readNumber(args, 'intensity', readNumber(args, 'i', 1.25)),
    color: args.color ?? '#58e6ff',
    casterId: args.caster ?? 'owner-local',
    reason: 'command',
  })

  return { ok: true, message: `Explosion arcane envoyée radius=${payload.radius}`, payload }
}
