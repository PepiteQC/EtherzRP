import type {
  AnimateType,
  CreatorQuality,
  GeometryDef,
  MaterialDef,
  ObjectCreatorConfig,
  ObjectPartDef,
  Recognition,
  RecognitionCategory,
  SceneLayout,
} from './types'

function uid() {
  return `oc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h >>> 0)
}

function rng(seed: number) {
  let s = seed || 1
  return () => {
    s = Math.imul(1664525, s) + 1013904223
    return ((s >>> 0) / 4294967296)
  }
}

function re(pattern: string) {
  return new RegExp(`\\b(${pattern})\\b`, 'i')
}

type Lex<T> = [pattern: string, label: string, value: T]

const COLORS: Lex<string>[] = [
  ['rouge|red|crimson|sang|blood|ruby|rubis', 'rouge', '#ef233c'],
  ['orange|feu|fire|flamme|flame|coucher|sunset', 'orange', '#ff6b00'],
  ['jaune|yellow|soleil|sun|citron|lemon', 'jaune', '#ffd60a'],
  ['or|gold|dor[eé]|laiton|brass', 'or', '#ffd166'],
  ['vert|green|sapin|forest|for[eê]t|emerald|[eé]meraude|jade', 'vert', '#22c55e'],
  ['cyan|turquoise|aqua|glace|ice|froid|cold', 'cyan', '#22d3ee'],
  ['bleu|blue|police|sapphire|saphir|navy|marine', 'bleu', '#3b82f6'],
  ['violet|purple|mauve|magenta|fuchsia|arcane|am[eé]thyste', 'violet', '#a855f7'],
  ['rose|pink', 'rose', '#ec4899'],
  ['blanc|white|neige|snow|ivoire|ivory', 'blanc', '#f8fafc'],
  ['noir|black|ombre|shadow|obsidian|minuit', 'noir', '#050510'],
  ['gris|gray|grey|argent|silver|acier|steel', 'gris', '#94a3b8'],
]

const MATERIALS: Lex<Partial<MaterialDef>>[] = [
  ['n[eé]on|glow|lumineux|emissive|plasma|[eé]nergie|energy', 'néon', { name: 'néon', emissiveIntensity: 1.8, roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.92 }],
  ['verre|glass|transparent|cristal|crystal|prism|prisme', 'verre/cristal', { name: 'verre/cristal', transmission: 0.78, thickness: 1.2, iridescence: 0.45, roughness: 0.02, metalness: 0.05, transparent: false, opacity: 1 }],
  ['m[eé]tal|metal|acier|steel|chrome|fer|iron|aluminium', 'métal', { name: 'métal', metalness: 0.92, roughness: 0.16, textureKey: 'metal' }],
  ['or|gold|dor[eé]|bronze|laiton|brass', 'or', { name: 'or', color: '#ffd166', metalness: 1, roughness: 0.18, textureKey: 'gold' }],
  ['bois|wood|sapin|pine|ch[eê]ne|oak|planche', 'bois', { name: 'bois', color: '#8b5a2b', metalness: 0, roughness: 0.84, textureKey: 'wood' }],
  ['pierre|stone|roche|rock|b[eé]ton|concrete|ciment|marbre|granite', 'pierre/béton', { name: 'pierre/béton', color: '#8a8070', metalness: 0, roughness: 0.92, textureKey: 'stone' }],
  ['brique|brick', 'brique', { name: 'brique', color: '#8b3a2a', metalness: 0, roughness: 0.95, textureKey: 'brick' }],
  ['cuir|leather|daim', 'cuir', { name: 'cuir', color: '#5c2c22', metalness: 0, roughness: 0.72, textureKey: 'leather' }],
  ['caoutchouc|rubber|pneu|tire', 'caoutchouc', { name: 'caoutchouc', color: '#101010', metalness: 0, roughness: 0.96, textureKey: 'rubber' }],
  ['neige|snow|glace|ice|givre', 'glace/neige', { name: 'glace/neige', color: '#d8f3ff', transmission: 0.45, roughness: 0.08, transparent: false, opacity: 1 }],
]

const SHAPES: Lex<GeometryDef>[] = [
  ['sph[eè]re|sphere|boule|orb|globe|ball', 'sphère', { type: 'sphere', args: [1, 48, 32] }],
  ['cube|box|bo[iî]te|block|bloc|crate', 'cube', { type: 'box', args: [1.8, 1.8, 1.8] }],
  ['cylindre|cylinder|tube|pipe|baril|tonneau', 'cylindre', { type: 'cylinder', args: [0.75, 0.75, 2.2, 32] }],
  ['cone|c[oô]ne|pointe|spike|pic|pyramide|pyramid', 'cône/pyramide', { type: 'cone', args: [1, 2.2, 4] }],
  ['anneau|ring|torus|donut|portal|portail|roue', 'anneau', { type: 'torus', args: [1.15, 0.28, 24, 96] }],
  ['noeud|nœud|knot|torus knot|entrelac', 'nœud', { type: 'torusKnot', args: [0.82, 0.23, 160, 16] }],
  ['cristal|crystal|diamant|diamond|gem|joyau', 'cristal', { type: 'octahedron', args: [1.2, 0] }],
  ['poly|icosa|geodesic|facette', 'polyèdre', { type: 'icosahedron', args: [1.2, 1] }],
  ['capsule|pilule|pill|ovale|egg|oeuf|œuf', 'capsule', { type: 'capsule', args: [0.55, 1.15, 16, 24] }],
]

const BLUEPRINTS: Lex<string>[] = [
  ['maison|house|chalet|cabane|cottage|villa|manoir', 'maison', 'house'],
  ['arbre|tree|sapin|pine|for[eê]t|forest', 'arbre', 'tree'],
  ['voiture|car|auto|v[eé]hicule|vehicle|berline|police car', 'voiture', 'car'],
  ['robot|andro[iï]de|android|droid|mech|cyborg', 'robot', 'robot'],
  ['[eé]p[eé]e|sword|katana|sabre|blade|lame', 'épée', 'sword'],
  ['lampe|lamp|lanterne|lantern|luminaire|light', 'lampe', 'lamp'],
  ['tour|tower|ch[aâ]teau|castle|donjon|fort', 'tour', 'tower'],
  ['champignon|mushroom|fungus', 'champignon', 'mushroom'],
  ['cr[aâ]ne|skull|squelette|t[eê]te de mort', 'crâne', 'skull'],
  ['d[eé]panneur|convenience|commerce|shop|store', 'dépanneur', 'depanneur'],
  ['garage|atelier|m[eé]cano|mechanic', 'garage', 'garage'],
  ['police|poste de police|sq|spvm|station police', 'police', 'police'],
  ['panneau|sign|route 138|arr[eê]t|stop', 'panneau', 'sign'],
]

const ANIMATIONS: Lex<AnimateType>[] = [
  ['tourne|spin|rotation|rotating', 'rotation', 'spin'],
  ['flotte|floating|hover|l[eé]vite|levitate', 'flottant', 'float'],
  ['orbite|orbit|autour|circling', 'orbite', 'orbit'],
  ['pulse|pulsation|battement|heart|coeur|cœur', 'pulsation', 'pulse'],
  ['vague|wave|ondulation|fluid|flow', 'vague', 'wave'],
  ['respire|breathe|breathing', 'respiration', 'breathe'],
]

const SCENES: Lex<SceneLayout>[] = [
  ['cluster|groupe|plusieurs|many|beaucoup|for[eê]t de|champ de', 'cluster', 'cluster'],
  ['anneau de|ring of|cercle de', 'anneau', 'ring'],
  ['orbital|syst[eè]me solaire|plan[eè]tes|atom|atome', 'orbital', 'orbital'],
  ['grille|grid|matrix|r[eé]seau', 'grille', 'grid'],
  ['h[eé]lice|helix|adn|dna', 'hélice', 'helix'],
  ['vortex|tourbillon|tornade|spirale', 'vortex', 'vortex'],
]

const MODIFIERS: Lex<string>[] = [
  ['g[eé]ant|giant|immense|massive|colossal|grand', 'géant', 'giant'],
  ['petit|tiny|mini|minuscule|small', 'petit', 'tiny'],
  ['ancien|ancient|ruine|ruined|mystique|arcane', 'ancien/arcane', 'ancient'],
  ['futuriste|futuristic|cyber|sci-fi|tech', 'futuriste', 'futuristic'],
  ['sombre|dark|evil|sinistre|ombre', 'sombre', 'dark'],
  ['magique|magic|enchanted|ether|[eé]th[eé]r[eé]', 'magique', 'magic'],
  ['[eé]lectrique|electric|foudre|lightning|storm', 'électrique', 'electric'],
  ['qu[eé]bec|qc|route 138|portneuf|trois-rivi[eè]res', 'québécois', 'quebec'],
]

function find<T>(lower: string, lex: Lex<T>[], category: RecognitionCategory, recs: Recognition[]): T | null {
  for (const [pattern, label, value] of lex) {
    const match = lower.match(re(pattern))
    if (match) {
      recs.push({ token: match[1], label, category, confidence: 0.88 })
      return value
    }
  }
  return null
}

function findAll<T>(lower: string, lex: Lex<T>[], category: RecognitionCategory, recs: Recognition[]): T[] {
  const out: T[] = []
  for (const [pattern, label, value] of lex) {
    const match = lower.match(re(pattern))
    if (match) {
      recs.push({ token: match[1], label, category, confidence: 0.78 })
      out.push(value)
    }
  }
  return out
}

function detectColor(lower: string, recs: Recognition[]) {
  for (const [pattern, label, hex] of COLORS) {
    const match = lower.match(re(pattern))
    if (match) {
      recs.push({ token: match[1], label, category: 'color', confidence: 0.9, hex })
      return hex
    }
  }
  return null
}

function materialFromPrompt(lower: string, color: string, recs: Recognition[]): MaterialDef {
  const found = find(lower, MATERIALS, 'material', recs) ?? {}
  const name = found.name ?? 'standard intelligent'
  const baseColor = found.color ?? color
  const emissive = found.emissive ?? (found.emissiveIntensity && found.emissiveIntensity > 0.8 ? baseColor : '#000000')
  return {
    name,
    color: baseColor,
    emissive,
    emissiveIntensity: found.emissiveIntensity ?? 0,
    metalness: found.metalness ?? 0.12,
    roughness: found.roughness ?? 0.55,
    transparent: found.transparent ?? false,
    opacity: found.opacity ?? 1,
    transmission: found.transmission,
    iridescence: found.iridescence,
    thickness: found.thickness,
    textureKey: found.textureKey,
    wireframe: found.wireframe,
  }
}

function qGeo(geo: GeometryDef, quality: CreatorQuality): GeometryDef {
  if (quality === 'balanced') return geo
  const factor = quality === 'high' ? 1.7 : 0.45
  const scale = (n: number, min: number) => Math.max(min, Math.round(n * factor))
  switch (geo.type) {
    case 'sphere': return { type: 'sphere', args: [geo.args[0], scale(geo.args[1] ?? 32, 8), scale(geo.args[2] ?? 16, 6)] }
    case 'cylinder': return { type: 'cylinder', args: [geo.args[0], geo.args[1], geo.args[2], scale(geo.args[3] ?? 16, 6)] }
    case 'cone': return { type: 'cone', args: [geo.args[0], geo.args[1], scale(geo.args[2] ?? 12, 4)] }
    case 'torus': return { type: 'torus', args: [geo.args[0], geo.args[1], scale(geo.args[2] ?? 16, 8), scale(geo.args[3] ?? 64, 16)] }
    case 'torusKnot': return { type: 'torusKnot', args: [geo.args[0], geo.args[1], scale(geo.args[2] ?? 96, 32), scale(geo.args[3] ?? 12, 6)] }
    default: return geo
  }
}

function part(id: string, geometry: GeometryDef, material: MaterialDef, position: [number, number, number], scale: [number, number, number] = [1, 1, 1], rotation: [number, number, number] = [0, 0, 0], animate: AnimateType = 'none', animSpeed = 0.35): ObjectPartDef {
  return { id, geometry, material, position, rotation, scale, animate, animSpeed }
}

function makeBlueprint(key: string, mat: MaterialDef, accent: string, quality: CreatorQuality): ObjectPartDef[] {
  const metal = { ...mat, name: 'métal blueprint', metalness: Math.max(0.75, mat.metalness), roughness: Math.min(0.3, mat.roughness), color: mat.color }
  const glass = { ...mat, name: 'verre blueprint', color: '#a8d8f0', transmission: 0.75, roughness: 0.03, metalness: 0, transparent: false, opacity: 1 }
  const rubber = { ...mat, name: 'caoutchouc', color: '#111111', metalness: 0, roughness: 0.95, textureKey: 'rubber' }
  const neon = { ...mat, name: 'néon accent', color: accent, emissive: accent, emissiveIntensity: 1.8, transparent: true, opacity: 0.9 }
  const wood = { ...mat, name: 'bois', color: '#8b5a2b', metalness: 0, roughness: 0.85, textureKey: 'wood' }
  const stone = { ...mat, name: 'pierre', color: '#8a8070', metalness: 0, roughness: 0.92, textureKey: 'stone' }
  const q = (g: GeometryDef) => qGeo(g, quality)

  switch (key) {
    case 'car': return [
      part('body', q({ type: 'box', args: [2.35, 0.62, 4.2] }), metal, [0, 0, 0]),
      part('cabin', q({ type: 'box', args: [1.55, 0.62, 1.65] }), metal, [0, 0.55, -0.25]),
      part('windshield', q({ type: 'box', args: [1.35, 0.35, 0.05] }), glass, [0, 0.63, -1.12], [1, 1, 1], [0.25, 0, 0]),
      part('rear-window', q({ type: 'box', args: [1.35, 0.32, 0.05] }), glass, [0, 0.6, 0.72], [1, 1, 1], [-0.22, 0, 0]),
      ...[-0.88, 0.88].flatMap(x => [
        part(`wheel-f-${x}`, q({ type: 'torus', args: [0.35, 0.13, 16, 48] }), rubber, [x, -0.42, -1.25], [1, 1, 1], [Math.PI / 2, 0, 0]),
        part(`wheel-r-${x}`, q({ type: 'torus', args: [0.35, 0.13, 16, 48] }), rubber, [x, -0.42, 1.25], [1, 1, 1], [Math.PI / 2, 0, 0]),
        part(`headlight-${x}`, q({ type: 'sphere', args: [0.12, 16, 12] }), neon, [x * 0.7, 0.02, -2.12]),
      ]),
    ]
    case 'robot': return [
      part('torso', q({ type: 'box', args: [1.05, 1.25, 0.6] }), metal, [0, 0.2, 0]),
      part('head', q({ type: 'box', args: [0.72, 0.72, 0.72] }), metal, [0, 1.25, 0]),
      part('neck', q({ type: 'cylinder', args: [0.13, 0.13, 0.25, 12] }), metal, [0, 0.82, 0]),
      ...[-0.72, 0.72].flatMap(x => [
        part(`arm-${x}`, q({ type: 'cylinder', args: [0.15, 0.15, 1.05, 16] }), metal, [x, 0.2, 0], [1, 1, 1], [0, 0, x > 0 ? -0.15 : 0.15]),
        part(`leg-${x}`, q({ type: 'cylinder', args: [0.18, 0.18, 1.05, 16] }), metal, [x * 0.35, -1.05, 0]),
        part(`eye-${x}`, q({ type: 'sphere', args: [0.08, 16, 12] }), neon, [x * 0.18, 1.32, -0.37]),
      ]),
      part('core', q({ type: 'sphere', args: [0.14, 20, 14] }), neon, [0, 0.35, -0.33], [1, 1, 1], [0, 0, 0], 'pulse', 0.8),
    ]
    case 'house': case 'depanneur': case 'garage': case 'police': return [
      part('walls', q({ type: 'box', args: [2.4, key === 'garage' ? 1.25 : 1.8, 1.8] }), key === 'depanneur' ? { ...stone, color: '#e8dfd0' } : stone, [0, 0, 0]),
      part('roof', q({ type: 'cone', args: [1.75, 0.9, 4] }), { ...mat, color: key === 'police' ? '#0f172a' : key === 'depanneur' ? '#cc0000' : '#4a2a1a', roughness: 0.75 }, [0, 1.35, 0], [1, 1, 1], [0, Math.PI / 4, 0]),
      part('door', q({ type: 'box', args: [0.42, 0.72, 0.08] }), wood, [0, -0.45, -0.94]),
      part('sign', q({ type: 'box', args: [1.35, 0.28, 0.06] }), { ...neon, color: accent, emissive: accent, emissiveIntensity: key === 'house' ? 0.25 : 1.2 }, [0, 0.45, -0.96]),
      part('window-l', q({ type: 'box', args: [0.34, 0.34, 0.05] }), glass, [-0.65, 0.22, -0.97]),
      part('window-r', q({ type: 'box', args: [0.34, 0.34, 0.05] }), glass, [0.65, 0.22, -0.97]),
    ]
    case 'tree': return [
      part('trunk', q({ type: 'cylinder', args: [0.18, 0.28, 1.5, 8] }), wood, [0, -0.8, 0]),
      part('foliage-low', q({ type: 'cone', args: [1.1, 1.5, 8] }), { ...mat, color: '#166534', roughness: 0.82, metalness: 0, textureKey: 'green' }, [0, 0.05, 0]),
      part('foliage-mid', q({ type: 'cone', args: [0.85, 1.3, 8] }), { ...mat, color: '#15803d', roughness: 0.82, metalness: 0, textureKey: 'green' }, [0, 0.75, 0]),
      part('foliage-top', q({ type: 'cone', args: [0.55, 1.0, 8] }), { ...mat, color: '#14532d', roughness: 0.82, metalness: 0, textureKey: 'green' }, [0, 1.32, 0]),
    ]
    case 'sword': return [
      part('blade', q({ type: 'box', args: [0.12, 2.7, 0.035] }), metal, [0, 0.7, 0]),
      part('edge', q({ type: 'box', args: [0.028, 2.55, 0.05] }), { ...metal, color: '#e8f4ff' }, [0.046, 0.74, 0]),
      part('guard', q({ type: 'box', args: [1.1, 0.12, 0.18] }), { ...metal, color: '#ffd166' }, [0, -0.72, 0]),
      part('grip', q({ type: 'cylinder', args: [0.08, 0.08, 0.85, 16] }), wood, [0, -1.18, 0]),
      part('gem', q({ type: 'octahedron', args: [0.12, 0] }), neon, [0, -1.65, 0], [1, 1, 1], [0, 0, 0], 'pulse', 1),
    ]
    case 'lamp': return [
      part('base', q({ type: 'cylinder', args: [0.48, 0.38, 0.18, 32] }), metal, [0, -1.1, 0]),
      part('pole', q({ type: 'cylinder', args: [0.045, 0.045, 2.2, 12] }), metal, [0, 0.05, 0]),
      part('shade', q({ type: 'cone', args: [0.72, 0.62, 32] }), { ...mat, color: '#f0ebe0', roughness: 0.22 }, [0, 1.25, 0], [1, 1, 1], [Math.PI, 0, 0]),
      part('bulb', q({ type: 'sphere', args: [0.18, 24, 16] }), { ...neon, color: '#ffe880', emissive: '#ffcc44', emissiveIntensity: 2.4 }, [0, 1.03, 0], [1, 1, 1], [0, 0, 0], 'pulse', 0.55),
    ]
    case 'tower': return [
      part('base', q({ type: 'cylinder', args: [1.0, 1.1, 2.3, 10] }), stone, [0, -0.55, 0]),
      part('top', q({ type: 'cylinder', args: [0.88, 1.0, 1.15, 10] }), stone, [0, 1.15, 0]),
      part('roof', q({ type: 'cone', args: [1.0, 1.1, 10] }), { ...mat, color: '#1f2937' }, [0, 2.25, 0]),
      part('flag', q({ type: 'box', args: [0.52, 0.28, 0.02] }), neon, [0.35, 3.08, 0]),
    ]
    case 'mushroom': return [
      part('stem', q({ type: 'cylinder', args: [0.28, 0.38, 1.25, 16] }), { ...mat, color: '#f0ede8', roughness: 0.55 }, [0, -0.65, 0]),
      part('cap', q({ type: 'sphere', args: [1.0, 32, 20] }), { ...mat, color: accent, roughness: 0.72 }, [0, 0.25, 0], [1.35, 0.62, 1.35]),
      ...[-0.45, 0.25, 0.62].map((x, i) => part(`spot-${i}`, q({ type: 'sphere', args: [0.11, 12, 8] }), { ...mat, color: '#fff', roughness: 0.9 }, [x, 0.72 + i * 0.05, i % 2 ? -0.28 : 0.38])),
    ]
    case 'skull': return [
      part('cranium', q({ type: 'sphere', args: [0.72, 32, 24] }), { ...stone, color: '#e8dcc0' }, [0, 0.22, 0], [1, 1.05, 0.95]),
      part('jaw', q({ type: 'sphere', args: [0.58, 24, 16] }), { ...stone, color: '#ddd0b0' }, [0, -0.38, -0.03], [1, 0.45, 0.9]),
      part('eye-l', q({ type: 'sphere', args: [0.18, 16, 12] }), { ...mat, color: '#020204' }, [-0.27, 0.16, -0.58]),
      part('eye-r', q({ type: 'sphere', args: [0.18, 16, 12] }), { ...mat, color: '#020204' }, [0.27, 0.16, -0.58]),
      part('glow-l', q({ type: 'sphere', args: [0.08, 12, 8] }), { ...neon, color: '#ff0000', emissive: '#ff0000' }, [-0.27, 0.16, -0.66]),
      part('glow-r', q({ type: 'sphere', args: [0.08, 12, 8] }), { ...neon, color: '#ff0000', emissive: '#ff0000' }, [0.27, 0.16, -0.66]),
    ]
    case 'sign': return [
      part('pole', q({ type: 'cylinder', args: [0.06, 0.06, 2.5, 8] }), metal, [0, -0.2, 0]),
      part('panel', q({ type: 'box', args: [2.2, 0.72, 0.08] }), { ...mat, color: '#1d6f3a', roughness: 0.35 }, [0, 1.25, 0]),
      part('text-glow', q({ type: 'box', args: [1.55, 0.08, 0.09] }), neon, [0, 1.25, -0.06]),
    ]
    default: return [part('core', q({ type: 'octahedron', args: [1.15, 0] }), mat, [0, 0, 0], [1, 1, 1], [0, 0, 0], 'float', 0.45)]
  }
}

function layoutParts(parts: ObjectPartDef[], layout: SceneLayout, random: () => number): ObjectPartDef[] {
  if (layout === 'single') return parts
  const clone = (p: ObjectPartDef, n: number, pos: [number, number, number]): ObjectPartDef => ({ ...p, id: `${p.id}_${n}`, position: [p.position[0] + pos[0], p.position[1] + pos[1], p.position[2] + pos[2]] })
  const out: ObjectPartDef[] = []
  const copies = layout === 'cluster' ? 5 : layout === 'grid' ? 9 : layout === 'ring' ? 6 : 4
  for (let i = 0; i < copies; i++) {
    let offset: [number, number, number]
    if (layout === 'grid') offset = [((i % 3) - 1) * 2.6, 0, (Math.floor(i / 3) - 1) * 2.6]
    else if (layout === 'ring' || layout === 'orbital') {
      const a = (i / copies) * Math.PI * 2
      offset = [Math.cos(a) * 3, 0, Math.sin(a) * 3]
    } else if (layout === 'helix' || layout === 'vortex') {
      const a = i * 1.4
      offset = [Math.cos(a) * (1.1 + i * 0.28), -1 + i * 0.55, Math.sin(a) * (1.1 + i * 0.28)]
    } else offset = [(random() - 0.5) * 5, (random() - 0.5) * 1.2, (random() - 0.5) * 5]
    parts.forEach(p => out.push(clone({ ...p, scale: p.scale.map(v => v * 0.45) as [number, number, number] }, i, offset)))
  }
  return out
}

export function createObjectFromPrompt(prompt: string, quality: CreatorQuality = 'balanced'): ObjectCreatorConfig {
  const text = prompt.trim() || 'cristal violet flottant'
  const lower = text.toLowerCase()
  const seed = hash(text + quality)
  const random = rng(seed)
  const recognitions: Recognition[] = []
  const reasoning: string[] = []

  const color = detectColor(lower, recognitions) ?? ['#8b5cf6', '#22d3ee', '#f59e0b', '#10b981'][seed % 4]
  const mat = materialFromPrompt(lower, color, recognitions)
  const blueprint = find(lower, BLUEPRINTS, 'blueprint', recognitions)
  const shape = find(lower, SHAPES, 'shape', recognitions)
  const anim = find(lower, ANIMATIONS, 'animation', recognitions) ?? (lower.includes('statique') ? 'none' : 'float')
  const layout = find(lower, SCENES, 'scene', recognitions) ?? (lower.match(/plusieurs|many|beaucoup|groupe/) ? 'cluster' : 'single')
  const modifiers = findAll(lower, MODIFIERS, 'modifier', recognitions)

  let parts: ObjectPartDef[]
  if (blueprint) {
    reasoning.push(`Blueprint reconnu: ${blueprint}. Création par sous-pièces spécialisées.`)
    parts = makeBlueprint(blueprint, mat, color, quality)
  } else {
    const geometry = qGeo(shape ?? { type: 'icosahedron', args: [1.25, quality === 'high' ? 2 : 1] }, quality)
    reasoning.push(shape ? 'Forme explicite détectée.' : 'Aucune forme exacte: choix d’un polyèdre robuste et lisible.')
    parts = [part('primary', geometry, mat, [0, 0, 0], [1, 1, 1], [random() * Math.PI, random() * Math.PI, 0], anim, 0.35 + random() * 0.55)]
    if (modifiers.includes('electric') || modifiers.includes('magic')) {
      parts.push(part('aura', qGeo({ type: 'torus', args: [1.6, 0.035, 16, 96] }, quality), { ...mat, name: 'aura énergétique', color, emissive: color, emissiveIntensity: 1.4, transparent: true, opacity: 0.42, metalness: 0, roughness: 0.2 }, [0, 0, 0], [1, 1, 1], [Math.PI / 2, 0, 0], 'spin', 0.35))
    }
  }

  if (modifiers.includes('giant')) parts = parts.map(p => ({ ...p, scale: p.scale.map(v => v * 1.55) as [number, number, number] }))
  if (modifiers.includes('tiny')) parts = parts.map(p => ({ ...p, scale: p.scale.map(v => v * 0.55) as [number, number, number] }))

  if (layout !== 'single') {
    reasoning.push(`Composition ${layout}: duplication organisée autour de l'objet principal.`)
    parts = layoutParts(parts, layout, random)
  }

  if (modifiers.includes('quebec')) reasoning.push('Contexte Québec détecté: accents Route 138 / RP priorisés.')
  if (mat.textureKey) reasoning.push(`Matériau procédural choisi: ${mat.name} (${mat.textureKey}).`)
  else reasoning.push(`Matériau PBR choisi: ${mat.name}.`)

  const estimatedPolygons = parts.reduce((sum, p) => {
    const g = p.geometry
    if (g.type === 'box') return sum + 12
    if (g.type === 'sphere') return sum + (g.args[1] ?? 24) * (g.args[2] ?? 16) * 2
    if (g.type === 'cylinder' || g.type === 'cone') return sum + (g.args[3] ?? g.args[2] ?? 16) * 4
    if (g.type === 'torus') return sum + (g.args[2] ?? 16) * (g.args[3] ?? 48) * 2
    if (g.type === 'torusKnot') return sum + (g.args[2] ?? 96) * (g.args[3] ?? 12) * 2
    return sum + 40
  }, 0)

  const materialCount = new Set(parts.map(p => `${p.material.name}:${p.material.color}:${p.material.textureKey ?? ''}`)).size
  const confidence = Math.min(0.98, 0.42 + recognitions.length * 0.09 + (blueprint ? 0.25 : 0) + (shape ? 0.1 : 0) + (mat ? 0.08 : 0))
  const complexity = parts.length > 14 || estimatedPolygons > 8000 ? 'advanced' : parts.length > 5 || estimatedPolygons > 2200 ? 'medium' : 'simple'

  const dark = modifiers.includes('dark') || lower.includes('nuit')
  const warm = lower.match(/feu|orange|or|gold|sun|soleil|chaud/)

  return {
    id: uid(),
    prompt: text,
    name: blueprint ? `${blueprint.toUpperCase()} · ${mat.name}` : `${recognitions.find(r => r.category === 'shape')?.label ?? 'Objet'} · ${mat.name}`,
    blueprint,
    layout,
    parts,
    recognitions,
    confidence,
    reasoning,
    tags: [...new Set(recognitions.map(r => r.label))],
    stats: { partCount: parts.length, estimatedPolygons, materialCount, complexity },
    lighting: {
      background: dark ? '#030008' : '#070010',
      ambient: dark ? '#12001f' : warm ? '#2a0a00' : '#0d001a',
      key: warm ? '#ff8833' : modifiers.includes('electric') ? '#00ffff' : '#9955ff',
      fill: warm ? '#ff5500' : '#22d3ee',
      fog: dark || modifiers.includes('magic') ? '#030008' : null,
    },
  }
}

export const EXAMPLE_PROMPTS = [
  'voiture police Québec néon bleu futuriste',
  'garage Route 138 en brique avec enseigne lumineuse',
  'robot cyber violet avec coeur énergétique',
  'épée ancienne en métal doré avec gemme rouge',
  'sapin québécois enneigé magique',
  'lanterne en verre et métal chaud',
  'cristal cyan iridescent flottant avec aura',
  'panneau Route 138 lumineux',
]
