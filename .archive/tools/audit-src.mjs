import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative, basename, extname } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')
const REPORT_DIR = join(ROOT, 'docs')
const REPORT = join(REPORT_DIR, 'SRC_AUDIT.md')

const codeExt = new Set(['.ts', '.tsx', '.js', '.jsx'])
const files = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const st = statSync(path)
    if (st.isDirectory()) walk(path)
    else files.push({ path, rel: relative(ROOT, path).replaceAll('\\', '/'), size: st.size, ext: extname(path) })
  }
}

walk(SRC)

const byTopDir = new Map()
for (const f of files) {
  const parts = f.rel.split('/')
  const key = parts.slice(0, 2).join('/')
  const item = byTopDir.get(key) ?? { files: 0, bytes: 0 }
  item.files += 1
  item.bytes += f.size
  byTopDir.set(key, item)
}

const byName = new Map()
for (const f of files) {
  const name = basename(f.rel)
  const list = byName.get(name) ?? []
  list.push(f.rel)
  byName.set(name, list)
}

const codeFiles = files.filter((f) => codeExt.has(f.ext))
let anyCount = 0
let consoleCount = 0
let todoCount = 0
let windowAnyCount = 0
let tsIgnoreCount = 0
const externalImports = new Map()

const importRe = /(?:import\s+(?:type\s+)?(?:[^'\"]+?\s+from\s+)?|export\s+[^'\"]+?\s+from\s+)['\"]([^'\"]+)['\"]/g

for (const f of codeFiles) {
  const text = readFileSync(f.path, 'utf8')
  anyCount += (text.match(/\bany\b/g) ?? []).length
  consoleCount += (text.match(/\bconsole\./g) ?? []).length
  todoCount += (text.match(/TODO|FIXME/g) ?? []).length
  windowAnyCount += (text.match(/window\s+as\s+any/g) ?? []).length
  tsIgnoreCount += (text.match(/@ts-ignore|@ts-expect-error/g) ?? []).length

  for (const m of text.matchAll(importRe)) {
    const spec = m[1]
    if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('@components') || spec.startsWith('@hooks') || spec.startsWith('@store') || spec.startsWith('@game') || spec.startsWith('@lib') || spec.startsWith('@utils') || spec.startsWith('@data') || spec.startsWith('@weapons') || spec.startsWith('@pages')) continue
    const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
    externalImports.set(pkg, (externalImports.get(pkg) ?? 0) + 1)
  }
}

const fmtKB = (n) => `${(n / 1024).toFixed(1)} KB`
const fmtMB = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`

const largeFiles = [...files].sort((a, b) => b.size - a.size).slice(0, 30)
const duplicateNames = [...byName.entries()].filter(([, list]) => list.length > 1).sort((a, b) => b[1].length - a[1].length).slice(0, 30)
const topDirs = [...byTopDir.entries()].sort((a, b) => b[1].bytes - a[1].bytes)
const imports = [...externalImports.entries()].sort((a, b) => b[1] - a[1])

const report = `# Audit initial de src/

Généré automatiquement par \`npm run audit:src\`.

## Résumé

- Fichiers dans \`src/\` : **${files.length}**
- Fichiers code TS/TSX/JS/JSX : **${codeFiles.length}**
- Taille totale de \`src/\` : **${fmtMB(files.reduce((s, f) => s + f.size, 0))}**
- Occurrences \`any\` : **${anyCount}**
- Occurrences \`window as any\` : **${windowAnyCount}**
- Occurrences \`console.*\` : **${consoleCount}**
- Occurrences \`TODO/FIXME\` : **${todoCount}**
- Occurrences \`@ts-ignore/@ts-expect-error\` : **${tsIgnoreCount}**

## Dossiers principaux

| Dossier | Fichiers | Taille |
|---|---:|---:|
${topDirs.map(([dir, v]) => `| \`${dir}\` | ${v.files} | ${fmtKB(v.bytes)} |`).join('\n')}

## Plus gros fichiers

| Fichier | Taille |
|---|---:|
${largeFiles.map((f) => `| \`${f.rel}\` | ${fmtKB(f.size)} |`).join('\n')}

## Noms de fichiers dupliqués

${duplicateNames.map(([name, list]) => `### \`${name}\`\n${list.map((p) => `- \`${p}\``).join('\n')}`).join('\n\n')}

## Imports externes détectés

| Package | Occurrences |
|---|---:|
${imports.map(([pkg, count]) => `| \`${pkg}\` | ${count} |`).join('\n')}

## Actions recommandées

1. Garder un seul HUD officiel et déplacer les doublons dans \`src/legacy/\`.
2. Garder un seul store officiel pour l'état jeu/UI/monde.
3. Sortir les archives \`.zip\` de \`src/\`.
4. Découper les fichiers > 50 KB en sous-composants.
5. Réduire progressivement les \`any\` avec des types de domaine.
6. Ajouter des tests unitaires sur sauvegarde, économie, jobs, armes et commandes admin.
`

mkdirSync(REPORT_DIR, { recursive: true })
writeFileSync(REPORT, report)
console.log(`Audit écrit: ${relative(ROOT, REPORT)}`)
