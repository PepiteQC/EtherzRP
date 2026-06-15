// ── types ─────────────────────────────────────────────────────────────────────

export type RecognitionCategory =
  | "shape" | "material" | "color" | "animation"
  | "mood" | "modifier" | "scene" | "count";

export interface Recognition {
  token: string;        // phrase matched in input
  label: string;        // canonical label
  category: RecognitionCategory;
  hex?: string;         // only for color category
}

export type GeometryType =
  | "sphere" | "box" | "torus" | "torusKnot" | "cone"
  | "cylinder" | "octahedron" | "icosahedron" | "dodecahedron"
  | "tetrahedron" | "capsule" | "circle";

export interface GeometryDef {
  type: GeometryType;
  args: number[];
}

export interface MaterialDef {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  wireframe: boolean;
  transparent: boolean;
  opacity: number;
  transmission?: number;
  iridescence?: number;
  thickness?: number;
  textureKey?: string;   // → renderer generates a procedural canvas texture for this material
}

export type AnimateType = "none" | "spin" | "float" | "orbit" | "pulse" | "wave" | "breathe";
export type SceneType = "single" | "cluster" | "orbital" | "ring" | "helix" | "grid" | "galaxy" | "vortex";
export type QualityLevel = "fast" | "balanced" | "high";

export interface ObjectDef {
  geometry: GeometryDef;
  material: MaterialDef;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  scaleXYZ?: [number, number, number];   // non-uniform override (for blueprint parts)
  animate: AnimateType;
  animSpeed: number;
}

export interface ParticleDef {
  count: number;
  color: string;
  size: number;
  spread: number;
  mode: "ambient" | "galaxy" | "vortex" | "rain";
}

export interface SceneConfig {
  sceneType: SceneType;
  objects: ObjectDef[];
  particles: ParticleDef | null;
  fogColor: string | null;
  ambientColor: string;
  lightColor: string;
  lightColor2: string;
  background: string;
  recognitions: Recognition[];
  isBlueprint?: boolean;        // true → renderer wraps all objects in a slow-rotating group
  blueprintLabel?: string;      // e.g. "House", "Rocket"
}

// ── helpers ───────────────────────────────────────────────────────────────────

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── lexicon ───────────────────────────────────────────────────────────────────
// Each entry: [pattern (regex source), canonical label]

const SHAPE_LEXICON: [string, string, GeometryDef][] = [
  ["sph[eè]re|ball|orb|globe|planète|boule|bubble|drop|ballon|balloon|balle|bulle",
    "sphere",      { type: "sphere",      args: [1.2, 64, 64] }],
  ["cube|box|block|bo[îi]te|crate|square|carré",
    "cube",        { type: "box",         args: [2, 2, 2] }],
  ["monolith|obelisk|pilier|pillar|column|col[o]nne",
    "monolith",    { type: "box",         args: [0.8, 3.5, 0.5] }],
  ["torus knot|nœud|twisted ring|celtic knot",
    "torusKnot",   { type: "torusKnot",   args: [0.9, 0.3, 256, 16] }],
  ["knot|pretzel|knotted|entrelac",
    "knot",        { type: "torusKnot",   args: [0.8, 0.28, 256, 16, 2, 3] }],
  ["torus|ring|donut|anneau|hoop|portal|loop|cercle|wheel",
    "torus",       { type: "torus",       args: [1.2, 0.38, 32, 128] }],
  ["halo|halo",
    "halo",        { type: "torus",       args: [1.6, 0.15, 32, 128] }],
  ["pyramid|pyramide",
    "pyramid",     { type: "cone",        args: [1.4, 2.5, 4] }],
  ["cone|pic|peak|spike|pointe",
    "cone",        { type: "cone",        args: [1, 2.8, 32] }],
  ["mountain|mont|volcano|volcan",
    "mountain",    { type: "cone",        args: [2, 3.5, 6] }],
  ["cylinder|cylindre|barrel|pipe|tube|drum|tonneau",
    "cylinder",    { type: "cylinder",    args: [0.8, 0.8, 2.5, 32] }],
  ["crystal|cristal|gem|joyau|jewel|gemstone|diamond|diamant|prism|prisme|shard|éclat",
    "crystal",     { type: "octahedron",  args: [1.3, 0] }],
  ["octahedron|octaèdre",
    "octahedron",  { type: "octahedron",  args: [1.4, 0] }],
  ["icosahedron|icosaèdre|polyhedron|geodesic|géodésique|faceted",
    "icosahedron", { type: "icosahedron", args: [1.3, 1] }],
  ["dodecahedron|dodécaèdre",
    "dodecahedron",{ type: "dodecahedron",args: [1.3, 0] }],
  ["tetrahedron|tétraèdre|triangular",
    "tetrahedron", { type: "tetrahedron", args: [1.5, 0] }],
  ["capsule|pill|pilule|oval|ellipse|œuf|egg",
    "capsule",     { type: "capsule",     args: [0.6, 1.2, 20, 32] }],
  ["disc|disk|disque|plate|assiette",
    "disc",        { type: "circle",      args: [1.6, 64] }],
];

type MaterialPreset = {
  metalness: number; roughness: number;
  emissiveMult: number; transparency?: boolean; transmission?: number;
  iridescence?: number; wireframe?: boolean;
  defaultColor?: string;   // inherent color when user doesn't specify one
};

const MATERIAL_LEXICON: [string, string, MaterialPreset][] = [
  // ── emissive / light-based ───────────────────────────────────────────────
  ["neon|néon|glow(ing)?|lumineux|fluorescent|luminous|radiant|emissive",
    "neon",        { metalness: 0.0, roughness: 0.4, emissiveMult: 1.2 }],
  ["plasma|energy|énergie|éthéré|ethereal|ghost|spectr(al|e)|spirit|esprit",
    "plasma",      { metalness: 0.0, roughness: 0.2, emissiveMult: 1.5, transparency: true, transmission: 0.3 }],
  ["hologram|holographique|wireframe|grille|grid|digital|matrix|cyber|numérique",
    "hologram",    { metalness: 0.0, roughness: 0.2, emissiveMult: 0.8, wireframe: true }],
  ["lava|lave|magma|molten|fondu|burning|brûlant|incandescent",
    "lava",        { metalness: 0.0, roughness: 0.6, emissiveMult: 1.4, defaultColor: "#ff3d00" }],
  ["ember|braise|brûlure|incandescent|charbon",
    "ember",       { metalness: 0.0, roughness: 0.7, emissiveMult: 1.8, defaultColor: "#ff6600" }],
  // ── transparent / refractive ─────────────────────────────────────────────
  ["glass|verre|transparent|translucent|translucide|clear|see-through|vitreux",
    "glass",       { metalness: 0.0, roughness: 0.05, emissiveMult: 0.1, transparency: true, transmission: 0.95 }],
  ["crystal(line)?|prismat|refract",
    "crystalline", { metalness: 0.1, roughness: 0.0, emissiveMult: 0.2, transparency: true, transmission: 0.7, iridescence: 0.8 }],
  ["ice|glace|frost|givre|frozen|gelé",
    "ice",         { metalness: 0.0, roughness: 0.08, emissiveMult: 0.05, transparency: true, transmission: 0.6, defaultColor: "#c8e8ff" }],
  ["water|eau|liquid|liquide",
    "water",       { metalness: 0.0, roughness: 0.02, emissiveMult: 0.0, transparency: true, transmission: 0.85, defaultColor: "#2080c0" }],
  ["wax|cire|bougie|candle",
    "wax",         { metalness: 0.0, roughness: 0.35, emissiveMult: 0.1, transparency: true, transmission: 0.18, defaultColor: "#f5e0a0" }],
  ["jade|jadéite|jadeite|nephrite|néphrite",
    "jade",        { metalness: 0.05, roughness: 0.12, emissiveMult: 0.0, transparency: true, transmission: 0.28, defaultColor: "#1a8a3a" }],
  // ── metallic ─────────────────────────────────────────────────────────────
  ["gold(en)?|doré|gilded|brass|laiton|bronze",
    "gold",        { metalness: 1.0, roughness: 0.2, emissiveMult: 0.0, defaultColor: "#ffd700" }],
  ["metal(lic)?|acier|steel|chrome|iron|fer|titanium|alumin|silver|argent",
    "metallic",    { metalness: 0.95, roughness: 0.08, emissiveMult: 0.0, defaultColor: "#b0c8d8" }],
  ["mirror|miroir|reflective|réfléchissant",
    "mirror",      { metalness: 1.0, roughness: 0.0, emissiveMult: 0.0, defaultColor: "#e8f0f8" }],
  ["mercury|mercure|quicksilver|vif-argent",
    "mercury",     { metalness: 1.0, roughness: 0.0, emissiveMult: 0.0, defaultColor: "#c8d8e0" }],
  ["obsidian|obsidienne|matte black|dark mirror|noir mat",
    "obsidian",    { metalness: 0.8, roughness: 0.1, emissiveMult: 0.15, defaultColor: "#0a0010" }],
  ["carbon.?fiber|fibre de carbone|carbone|kevlar",
    "carbon",      { metalness: 0.75, roughness: 0.22, emissiveMult: 0.0, defaultColor: "#1a1a1a" }],
  ["rust|rouille|rouillé|oxidized|oxydé|corrod",
    "rust",        { metalness: 0.3, roughness: 0.92, emissiveMult: 0.0, defaultColor: "#8b3a1a" }],
  // ── organic / natural ────────────────────────────────────────────────────
  ["stone|pierre|rock|rocher|marble|marbre|granite|granit|rough|rugueux|cobble",
    "stone",       { metalness: 0.0, roughness: 0.9, emissiveMult: 0.0, defaultColor: "#8a8070" }],
  ["wood|bois|wooden|timber|plank|planche|chêne|oak|pine|sapin",
    "wood",        { metalness: 0.0, roughness: 0.85, emissiveMult: 0.0, defaultColor: "#8b5a2b" }],
  ["brick|brique|maçonnerie|masonry",
    "brick",       { metalness: 0.0, roughness: 0.95, emissiveMult: 0.0, defaultColor: "#8b3a2a" }],
  ["concrete|béton|beton|cement|ciment|raw concrete|béton brut",
    "concrete",    { metalness: 0.0, roughness: 0.95, emissiveMult: 0.0, defaultColor: "#a0a090" }],
  ["terracotta|terre cuite|argile cuite|earthenware|céramique rouge",
    "terracotta",  { metalness: 0.0, roughness: 0.88, emissiveMult: 0.0, defaultColor: "#c2613a" }],
  ["clay|argile|mud|boue|earth|terre",
    "clay",        { metalness: 0.0, roughness: 0.90, emissiveMult: 0.0, defaultColor: "#9a7050" }],
  ["sand|sable|desert|dune",
    "sand",        { metalness: 0.0, roughness: 1.0, emissiveMult: 0.0, defaultColor: "#d4b878" }],
  ["bone|os|skull|crâne|ivory|ivoire",
    "bone",        { metalness: 0.0, roughness: 0.82, emissiveMult: 0.0, defaultColor: "#e8dcc0" }],
  ["leather|cuir|peau|hide|suede|daim",
    "leather",     { metalness: 0.0, roughness: 0.75, emissiveMult: 0.0, defaultColor: "#6b3a20" }],
  // ── manufactured ─────────────────────────────────────────────────────────
  ["plastic|plastique|polymer|résine|acrylic|acrylique",
    "plastic",     { metalness: 0.05, roughness: 0.3, emissiveMult: 0.0 }],
  ["rubber|caoutchouc|gomme|latex",
    "rubber",      { metalness: 0.0, roughness: 0.92, emissiveMult: 0.0, defaultColor: "#1a1a1a" }],
  ["ceramic|céramique|porcelain|porcelaine|faïence",
    "ceramic",     { metalness: 0.0, roughness: 0.15, emissiveMult: 0.0, defaultColor: "#f0ede8" }],
  ["chalk|craie|chalkboard|tableau",
    "chalk",       { metalness: 0.0, roughness: 1.0, emissiveMult: 0.0, defaultColor: "#f5f0e8" }],
  ["fabric|tissu|cloth|velvet|velours|silk|soie|cotton|coton|linen|lin",
    "fabric",      { metalness: 0.0, roughness: 0.98, emissiveMult: 0.0 }],
  // ── iridescent ───────────────────────────────────────────────────────────
  ["iridescent|iridé|pearl(escent)?|nacré|opalescent|opale|rainbow|arc-en-ciel|nacre",
    "iridescent",  { metalness: 0.2, roughness: 0.05, emissiveMult: 0.0, iridescence: 1.0 }],
];

const COLOR_LEXICON: [string, string, string][] = [
  ["red|rouge|crimson|cramoisi|scarlet|écarlate|ruby|rubis|blood|sang",  "red",       "#ff1e3c"],
  ["orange|sunset|couchant",                                              "orange",    "#ff6600"],
  ["yellow|jaune|sun|soleil|lemon|citron",                               "yellow",    "#ffe000"],
  ["gold|golden|doré|amber|ambre|brass",                                 "gold",      "#ffd700"],
  ["green|vert|emerald|émeraude|jade|lime|forest|forêt",                 "green",     "#00e676"],
  ["cyan|turquoise|aqua|teal|sarcelle|ice|glace",                        "cyan",      "#00e5ff"],
  ["blue|bleu|navy|marine|cobalt|sapphire|saphir|ocean|sky|ciel|azure",  "blue",      "#2979ff"],
  ["violet|purple|mauve|indigo|amethyst|améthyste|lavender|lavande",     "violet",    "#9c27b0"],
  ["pink|rose|magenta|fuchsia",                                           "pink",      "#f50057"],
  ["white|blanc|snow|neige|ivory|ivoire|pearl|perle|silver|argent",      "white",     "#e8e8ff"],
  ["black|noir|shadow|ombre|void|néant|abyss|abîme|midnight|minuit",     "black",     "#0a0015"],
  ["gray|grey|gris|slate|ardoise|ash|cendre",                            "gray",      "#9e9e9e"],
  ["neon|plasma",                                                         "neon-green","#39ff14"],
  ["lava|magma|fire|feu|flame|flamme",                                   "lava",      "#ff3d00"],
];

const ANIMATION_LEXICON: [string, AnimateType][] = [
  ["orbit(ing)?|revolv(ing)?|circling|tourne autour",  "orbit"],
  ["float(ing)?|hover(ing)?|levitat|flott|suspendu",   "float"],
  ["spin(ning)?|rotat(ing)?|whirl(ing)?|tourn",        "spin"],
  ["puls(ing|e)?|throb(bing)?|beat(ing)?|heart|cœur",  "pulse"],
  ["wav(ing|e)?|undulat|rippl|fluid|flow(ing)?|flot",  "wave"],
  ["breath(ing|e)?|expand|contract|inhale|exhale",     "breathe"],
];

const SCENE_LEXICON: [string, SceneType][] = [
  ["galaxy|galaxie|cosmos|nebul|milky way|voie lactée|star field|champ d'étoiles",  "galaxy"],
  ["vortex|tornado|tornade|whirlpool|tourbillon|spiral storm|tempête",              "vortex"],
  ["orbit|solar system|planètes|atom|électron|molecul",                             "orbital"],
  ["helix|hélice|dna|adn|spiral column|colonne",                                    "helix"],
  ["grid|grille|lattice|réseau|array|matrix|field",                                 "grid"],
  ["cluster|groupe|cave|cavern|caverne|field of|champ de|forest of|forêt de",      "cluster"],
  ["ring of|cercle de|halo of|circle of|orbit of",                                 "ring"],
];

const MODIFIER_LEXICON: [string, string][] = [
  ["giant|huge|enormous|massive|grand|gigantesque|immense|colossal",  "giant"],
  ["tiny|micro|mini|small|petit|minuscule|little|petite",            "tiny"],
  ["many|many|multiple|plusieurs|countless|innombrable|myriad|myriade|lots of|beaucoup", "many"],
  ["sharp|pointy|jagged|acéré|angulaire|épineux|spiky|spiked",      "sharp"],
  ["smooth|poli|soft|doux|sleek|lisse|polished",                    "smooth"],
  ["dark|sombre|obscur|ominous|sinister|evil|noir|shadowy",         "dark"],
  ["ancient|ancien|mystical|mystique|arcane|archaïque|ruined|ruines","ancient"],
  ["futuristic|futuriste|cyber|sci-fi|tech|digital|numérique",       "futuristic"],
  ["electric|électrique|lightning|foudre|storm|tempête|energy",     "electric"],
  ["magical|magique|enchanted|enchanté|ethereal|éthéré|mystical",   "magical"],
];

// ── blueprint system ──────────────────────────────────────────────────────────
// Each object is decomposed into parts; the renderer wraps them in a single
// slowly-rotating group so the whole object turns as one unit.

interface BpPart {
  geo: GeometryDef;
  matKey: string;              // preset used by makeBpMat()
  color?: string;              // override; if omitted uses makeBpMat's default
  pos: [number, number, number];
  rot?: [number, number, number];
  scl?: [number, number, number]; // non-uniform scale per-axis (applied as scaleXYZ)
  colorable?: boolean;         // true → tint with user's detected color
  emissive?: string;           // emissive color override
  minQuality?: "balanced" | "high"; // if set, hidden on lower qualities
}

interface Blueprint {
  label: string;
  parts: BpPart[];
  fastParts?: number;          // how many parts (from the start) to show in Fast mode
  lightColor?: string;
  lightColor2?: string;
  ambientColor?: string;
  background?: string;
}

// Build a MaterialDef from a named preset key + color
function makeBpMat(key: string, color: string, emissiveOverride?: string): MaterialDef {
  const e = emissiveOverride ?? color;
  const dark = "#000000";
  switch (key) {
    case "stone":     return { color, emissive: "#0d0c0a", emissiveIntensity: 0, metalness: 0,    roughness: 0.92, wireframe: false, transparent: false, opacity: 1 };
    case "brick":     return { color: "#8b3a2a", emissive: "#0d0400", emissiveIntensity: 0, metalness: 0, roughness: 0.95, wireframe: false, transparent: false, opacity: 1 };
    case "wood":      return { color, emissive: "#050200", emissiveIntensity: 0, metalness: 0,    roughness: 0.85, wireframe: false, transparent: false, opacity: 1 };
    case "glass":     return { color: "#a8d8f0", emissive: "#001020", emissiveIntensity: 0.05, metalness: 0, roughness: 0.05, wireframe: false, transparent: false, opacity: 1, transmission: 0.92, thickness: 1.5 };
    case "metal":     return { color, emissive: dark, emissiveIntensity: 0, metalness: 0.95, roughness: 0.08, wireframe: false, transparent: false, opacity: 1 };
    case "dark-metal":return { color: "#1a2030", emissive: dark, emissiveIntensity: 0, metalness: 0.95, roughness: 0.25, wireframe: false, transparent: false, opacity: 1 };
    case "gold":      return { color: "#ffd700", emissive: "#3d2800", emissiveIntensity: 0, metalness: 1.0, roughness: 0.2, wireframe: false, transparent: false, opacity: 1 };
    case "neon":      return { color: e, emissive: e, emissiveIntensity: 2.2, metalness: 0, roughness: 0.4, wireframe: false, transparent: true, opacity: 0.9 };
    case "fire":      return { color: "#ff4400", emissive: "#ff2200", emissiveIntensity: 2.5, metalness: 0, roughness: 0.5, wireframe: false, transparent: true, opacity: 0.8 };
    case "rubber":    return { color, emissive: dark, emissiveIntensity: 0, metalness: 0,    roughness: 0.92, wireframe: false, transparent: false, opacity: 1 };
    case "ceramic":   return { color, emissive: "#060606", emissiveIntensity: 0, metalness: 0,    roughness: 0.15, wireframe: false, transparent: false, opacity: 1 };
    case "leather":   return { color, emissive: "#040200", emissiveIntensity: 0, metalness: 0,    roughness: 0.75, wireframe: false, transparent: false, opacity: 1 };
    case "clay":      return { color: "#c2613a", emissive: "#080200", emissiveIntensity: 0, metalness: 0,    roughness: 0.88, wireframe: false, transparent: false, opacity: 1 };
    case "crystal":   return { color, emissive: e, emissiveIntensity: 0.35, metalness: 0.1, roughness: 0.0, wireframe: false, transparent: false, opacity: 1, transmission: 0.72, iridescence: 0.6, thickness: 1.0 };
    case "bone":      return { color: "#e8dcc0", emissive: "#0d0c08", emissiveIntensity: 0, metalness: 0,    roughness: 0.82, wireframe: false, transparent: false, opacity: 1 };
    case "void":      return { color: "#040008", emissive: dark, emissiveIntensity: 0, metalness: 0.0,  roughness: 0.95, wireframe: false, transparent: false, opacity: 1 };
    case "green":     return { color: "#1a7a20", emissive: "#011002", emissiveIntensity: 0, metalness: 0,    roughness: 0.72, wireframe: false, transparent: false, opacity: 1 };
    case "darkgreen": return { color: "#0d4a12", emissive: "#010802", emissiveIntensity: 0, metalness: 0,    roughness: 0.78, wireframe: false, transparent: false, opacity: 1 };
    case "red":       return { color: "#cc2200", emissive: "#200400", emissiveIntensity: 0, metalness: 0,    roughness: 0.7, wireframe: false, transparent: false, opacity: 1 };
    case "white":     return { color: "#f0f0f0", emissive: "#050505", emissiveIntensity: 0, metalness: 0,    roughness: 0.4, wireframe: false, transparent: false, opacity: 1 };
    default:          return { color, emissive: dark, emissiveIntensity: 0, metalness: 0.1, roughness: 0.6, wireframe: false, transparent: false, opacity: 1 };
  }
}

const BLUEPRINTS: Record<string, Blueprint> = {

  house: {
    label: "House",
    fastParts: 2,
    ambientColor: "#0a0500", lightColor: "#ff9933", lightColor2: "#4422ff", background: "#080005",
    parts: [
      // Main walls
      { geo: { type: "box", args: [2.0, 1.5, 1.6] },        matKey: "stone",   color: "#9a8878", pos: [0, 0, 0],          colorable: true },
      // Roof (4-sided cone = pyramid)
      { geo: { type: "cone", args: [1.38, 1.0, 4] },        matKey: "clay",                      pos: [0, 1.25, 0],       rot: [0, Math.PI/4, 0] },
      // Chimney
      { geo: { type: "cylinder", args: [0.12, 0.12, 0.65, 8] }, matKey: "stone", color: "#807060", pos: [0.52, 1.72, 0.25], minQuality: "balanced" },
      // Door
      { geo: { type: "box", args: [0.38, 0.58, 0.07] },     matKey: "wood",    color: "#6b3a18",  pos: [0, -0.46, 0.84],   minQuality: "balanced" },
      // Left window
      { geo: { type: "box", args: [0.32, 0.32, 0.05] },     matKey: "glass",                      pos: [-0.56, 0.12, 0.84], minQuality: "balanced" },
      // Right window
      { geo: { type: "box", args: [0.32, 0.32, 0.05] },     matKey: "glass",                      pos: [0.56, 0.12, 0.84],  minQuality: "balanced" },
      // Step
      { geo: { type: "box", args: [0.5, 0.1, 0.2] },        matKey: "stone",   color: "#807060",  pos: [0, -0.77, 0.97],   minQuality: "balanced" },
      // Window sill left (high-detail ledge)
      { geo: { type: "box", args: [0.38, 0.04, 0.09] },     matKey: "stone",   color: "#907868",  pos: [-0.56, -0.04, 0.89], minQuality: "high" },
      // Window sill right
      { geo: { type: "box", args: [0.38, 0.04, 0.09] },     matKey: "stone",   color: "#907868",  pos: [0.56, -0.04, 0.89],  minQuality: "high" },
      // Roof ridge
      { geo: { type: "cylinder", args: [0.04, 0.04, 1.72, 6] }, matKey: "clay", color: "#a26040", pos: [0, 1.79, 0] ,      rot: [0, 0, Math.PI/2], minQuality: "high" },
    ],
  },

  tree: {
    label: "Tree",
    fastParts: 2,
    ambientColor: "#010a02", lightColor: "#44ff88", lightColor2: "#2244ff", background: "#030908",
    parts: [
      // Trunk
      { geo: { type: "cylinder", args: [0.22, 0.28, 1.6, 12] }, matKey: "wood", color: "#5a3010", pos: [0, -1.0, 0] },
      // Lower foliage (large)
      { geo: { type: "sphere", args: [1.1, 32, 32] },        matKey: "green",                      pos: [0, 0.2, 0],        scl: [1.0, 0.85, 1.0] },
      // Mid foliage
      { geo: { type: "sphere", args: [0.85, 32, 32] },       matKey: "green",   color: "#1a8c20",  pos: [0, 1.0, 0],        minQuality: "balanced" },
      // Top foliage (darker, smaller)
      { geo: { type: "sphere", args: [0.55, 32, 32] },       matKey: "darkgreen",                  pos: [0, 1.65, 0],       minQuality: "balanced" },
      // Root bumps (high detail)
      { geo: { type: "sphere", args: [0.22, 12, 8] },        matKey: "wood",    color: "#4a2808",  pos: [0.3, -1.7, 0.1],   scl: [1, 0.5, 1],       minQuality: "high" },
      { geo: { type: "sphere", args: [0.18, 12, 8] },        matKey: "wood",    color: "#4a2808",  pos: [-0.28, -1.7, 0.2], scl: [1, 0.5, 1],       minQuality: "high" },
    ],
  },

  rocket: {
    label: "Rocket",
    fastParts: 2,
    ambientColor: "#000008", lightColor: "#ff6600", lightColor2: "#4488ff", background: "#020008",
    parts: [
      // Body
      { geo: { type: "cylinder", args: [0.5, 0.5, 2.6, 32] }, matKey: "metal", color: "#c0d0e0",  pos: [0, 0, 0],          colorable: true },
      // Nose cone
      { geo: { type: "cone", args: [0.5, 1.0, 32] },         matKey: "metal",  color: "#d0e0f0",  pos: [0, 1.8, 0] },
      // Fin left
      { geo: { type: "box", args: [0.6, 0.65, 0.06] },       matKey: "dark-metal",                pos: [-0.52, -1.05, 0],  rot: [0, 0, 0.22],  minQuality: "balanced" },
      // Fin right
      { geo: { type: "box", args: [0.6, 0.65, 0.06] },       matKey: "dark-metal",                pos: [0.52, -1.05, 0],   rot: [0, 0, -0.22], minQuality: "balanced" },
      // Fin front
      { geo: { type: "box", args: [0.06, 0.65, 0.6] },       matKey: "dark-metal",                pos: [0, -1.05, 0.52],   rot: [0.22, 0, 0],  minQuality: "balanced" },
      // Porthole
      { geo: { type: "sphere", args: [0.18, 32, 32] },       matKey: "glass",                      pos: [0, 0.4, 0.52],                         minQuality: "balanced" },
      // Exhaust ring
      { geo: { type: "torus", args: [0.38, 0.1, 16, 64] },   matKey: "fire",                       pos: [0, -1.5, 0],                           minQuality: "balanced" },
      // Panel rivet ring (high detail)
      { geo: { type: "torus", args: [0.52, 0.025, 8, 32] },  matKey: "metal",   color: "#909aaa",  pos: [0, 0.8, 0],                            minQuality: "high" },
      { geo: { type: "torus", args: [0.52, 0.025, 8, 32] },  matKey: "metal",   color: "#909aaa",  pos: [0, -0.6, 0],                           minQuality: "high" },
    ],
  },

  sword: {
    label: "Sword",
    fastParts: 2,
    ambientColor: "#050005", lightColor: "#aabbff", lightColor2: "#ffaa22", background: "#040008",
    parts: [
      // Blade
      { geo: { type: "box", args: [0.09, 2.55, 0.016] },    matKey: "metal",   color: "#c8d8e8",  pos: [0, 1.1, 0],        colorable: true },
      // Cross-guard
      { geo: { type: "box", args: [1.05, 0.1, 0.14] },      matKey: "gold",                       pos: [0, -0.16, 0] },
      // Blade edge highlight
      { geo: { type: "box", args: [0.015, 2.5, 0.008] },    matKey: "metal",   color: "#e8f4ff",  pos: [0.035, 1.1, 0],    minQuality: "balanced" },
      // Handle / grip
      { geo: { type: "cylinder", args: [0.07, 0.07, 0.95, 16] }, matKey: "leather", color: "#4a2510", pos: [0, -0.75, 0],  minQuality: "balanced" },
      // Pommel
      { geo: { type: "sphere", args: [0.18, 32, 32] },      matKey: "gold",                       pos: [0, -1.28, 0],      minQuality: "balanced" },
      // Pommel gem
      { geo: { type: "octahedron", args: [0.08, 0] },       matKey: "crystal", color: "#ff2266",   pos: [0, -1.28, 0],     emissive: "#ff0033", minQuality: "high" },
      // Blood groove (fine central channel)
      { geo: { type: "box", args: [0.012, 2.0, 0.025] },    matKey: "dark-metal", color: "#606878", pos: [0, 1.2, 0],      minQuality: "high" },
    ],
  },

  tower: {
    label: "Tower",
    fastParts: 3,
    ambientColor: "#02000a", lightColor: "#6644aa", lightColor2: "#224488", background: "#040008",
    parts: [
      // Lower section
      { geo: { type: "cylinder", args: [1.05, 1.05, 2.1, 10] }, matKey: "stone", color: "#7a7060", pos: [0, -1.2, 0] },
      // Upper section (slightly narrower)
      { geo: { type: "cylinder", args: [0.9, 1.05, 1.9, 10] },  matKey: "stone", color: "#706a58", pos: [0, 0.75, 0] },
      // Conical roof (moved here so fast mode gets roof too)
      { geo: { type: "cone", args: [0.96, 1.1, 10] },           matKey: "dark-metal",               pos: [0, 2.3, 0] },
      // Parapet rim
      { geo: { type: "torus", args: [0.95, 0.08, 16, 40] },    matKey: "stone",  color: "#807868", pos: [0, 1.75, 0],       minQuality: "balanced" },
      // 4 merlons (battlements)
      { geo: { type: "box", args: [0.22, 0.32, 0.22] }, matKey: "stone", color: "#706a58", pos: [ 0.78, 2.02,  0.0 ], minQuality: "balanced" },
      { geo: { type: "box", args: [0.22, 0.32, 0.22] }, matKey: "stone", color: "#706a58", pos: [-0.78, 2.02,  0.0 ], minQuality: "balanced" },
      { geo: { type: "box", args: [0.22, 0.32, 0.22] }, matKey: "stone", color: "#706a58", pos: [ 0.0,  2.02,  0.78], minQuality: "balanced" },
      { geo: { type: "box", args: [0.22, 0.32, 0.22] }, matKey: "stone", color: "#706a58", pos: [ 0.0,  2.02, -0.78], minQuality: "balanced" },
      // Arrow slit
      { geo: { type: "box", args: [0.08, 0.35, 0.05] },        matKey: "void",                      pos: [0, 0.2, 1.08],    minQuality: "balanced" },
      // Flag pole
      { geo: { type: "cylinder", args: [0.025, 0.025, 0.7, 8] }, matKey: "metal", color: "#c0a030", pos: [0, 3.15, 0],     minQuality: "balanced" },
      // Flag
      { geo: { type: "box", args: [0.38, 0.22, 0.01] },        matKey: "red",                       pos: [0.19, 3.42, 0],   colorable: true, minQuality: "balanced" },
      // Door arch (high detail)
      { geo: { type: "cylinder", args: [0.25, 0.25, 0.06, 8] }, matKey: "void",  color: "#020004", pos: [0, -1.5, 1.06],   rot: [Math.PI/2, 0, 0], minQuality: "high" },
      // Stone corner trim (high detail)
      { geo: { type: "box", args: [0.08, 2.1, 0.08] },          matKey: "stone", color: "#8a8070", pos: [ 1.06, -1.2, 0],  minQuality: "high" },
      { geo: { type: "box", args: [0.08, 2.1, 0.08] },          matKey: "stone", color: "#8a8070", pos: [-1.06, -1.2, 0],  minQuality: "high" },
    ],
  },

  mushroom: {
    label: "Mushroom",
    fastParts: 2,
    ambientColor: "#030a02", lightColor: "#88ffaa", lightColor2: "#ff44aa", background: "#040808",
    parts: [
      // Stem
      { geo: { type: "cylinder", args: [0.28, 0.36, 1.25, 16] }, matKey: "white",  color: "#f0ede8", pos: [0, -0.82, 0] },
      // Main cap
      { geo: { type: "sphere", args: [1.05, 32, 32] },           matKey: "red",                      pos: [0, 0.55, 0], scl: [1.3, 0.7, 1.3], colorable: true },
      // Underside of cap (gills)
      { geo: { type: "cylinder", args: [0.88, 0.28, 0.12, 32] }, matKey: "white",  color: "#e8e4de", pos: [0,  0.08, 0],   minQuality: "balanced" },
      // White spots on cap
      { geo: { type: "sphere", args: [0.14, 16, 16] }, matKey: "white", pos: [ 0.55,  0.82,  0.55], minQuality: "balanced" },
      { geo: { type: "sphere", args: [0.11, 16, 16] }, matKey: "white", pos: [-0.5,   0.9,   0.3 ], minQuality: "balanced" },
      { geo: { type: "sphere", args: [0.09, 16, 16] }, matKey: "white", pos: [ 0.1,   0.95, -0.6 ], minQuality: "balanced" },
      { geo: { type: "sphere", args: [0.10, 16, 16] }, matKey: "white", pos: [-0.3,   0.72, -0.65], minQuality: "balanced" },
      { geo: { type: "sphere", args: [0.13, 16, 16] }, matKey: "white", pos: [ 0.65,  0.68, -0.3 ], minQuality: "balanced" },
      // Tiny mycelium bumps at base (high detail)
      { geo: { type: "sphere", args: [0.09, 8, 6] }, matKey: "white", color: "#e4e0d8", pos: [ 0.38, -1.46,  0.2 ], minQuality: "high" },
      { geo: { type: "sphere", args: [0.07, 8, 6] }, matKey: "white", color: "#e4e0d8", pos: [-0.3,  -1.48, -0.3 ], minQuality: "high" },
    ],
  },

  robot: {
    label: "Robot",
    fastParts: 6,
    ambientColor: "#000508", lightColor: "#00ffcc", lightColor2: "#ff4400", background: "#020408",
    parts: [
      // Torso
      { geo: { type: "box", args: [0.9, 1.1, 0.6] },           matKey: "metal",   color: "#3a4a5a",  pos: [0, 0.4, 0],       colorable: true },
      // Head
      { geo: { type: "box", args: [0.62, 0.62, 0.62] },        matKey: "metal",   color: "#3a4a5a",  pos: [0, 1.62, 0] },
      // Left arm
      { geo: { type: "cylinder", args: [0.17, 0.17, 1.05, 16] },matKey: "metal",  color: "#2a3a4a",  pos: [-0.65, 0.38, 0] },
      // Right arm
      { geo: { type: "cylinder", args: [0.17, 0.17, 1.05, 16] },matKey: "metal",  color: "#2a3a4a",  pos: [0.65, 0.38, 0] },
      // Left leg
      { geo: { type: "cylinder", args: [0.2, 0.2, 1.12, 16] }, matKey: "metal",   color: "#2a3a4a",  pos: [-0.28, -0.85, 0] },
      // Right leg
      { geo: { type: "cylinder", args: [0.2, 0.2, 1.12, 16] }, matKey: "metal",   color: "#2a3a4a",  pos: [0.28, -0.85, 0] },
      // Neck
      { geo: { type: "cylinder", args: [0.14, 0.14, 0.2, 12] },matKey: "dark-metal",                 pos: [0, 1.12, 0],       minQuality: "balanced" },
      // Left hand
      { geo: { type: "sphere", args: [0.18, 16, 16] },         matKey: "metal",   color: "#1a2a3a",  pos: [-0.65, -0.18, 0],  minQuality: "balanced" },
      // Right hand
      { geo: { type: "sphere", args: [0.18, 16, 16] },         matKey: "metal",   color: "#1a2a3a",  pos: [0.65, -0.18, 0],   minQuality: "balanced" },
      // Left foot
      { geo: { type: "box", args: [0.28, 0.14, 0.38] },        matKey: "dark-metal",                 pos: [-0.28, -1.5, 0.05], minQuality: "balanced" },
      // Right foot
      { geo: { type: "box", args: [0.28, 0.14, 0.38] },        matKey: "dark-metal",                 pos: [0.28, -1.5, 0.05],  minQuality: "balanced" },
      // Left eye
      { geo: { type: "sphere", args: [0.085, 16, 16] },        matKey: "neon",    color: "#00ffcc",   pos: [-0.17, 1.66, 0.32], emissive: "#00ffcc", minQuality: "balanced" },
      // Right eye
      { geo: { type: "sphere", args: [0.085, 16, 16] },        matKey: "neon",    color: "#00ffcc",   pos: [0.17, 1.66, 0.32],  emissive: "#00ffcc", minQuality: "balanced" },
      // Chest indicator
      { geo: { type: "sphere", args: [0.1, 16, 16] },          matKey: "neon",    color: "#ff4400",   pos: [0, 0.62, 0.31],     emissive: "#ff4400", colorable: true, minQuality: "balanced" },
      // Antenna
      { geo: { type: "cylinder", args: [0.02, 0.02, 0.4, 8] },matKey: "metal",   color: "#90a0b0",   pos: [0, 2.03, 0],       minQuality: "high" },
      { geo: { type: "sphere", args: [0.05, 16, 16] },         matKey: "neon",    color: "#ff0088",   pos: [0, 2.26, 0],        emissive: "#ff0088", minQuality: "high" },
      // Visor (high-detail face bar)
      { geo: { type: "box", args: [0.52, 0.08, 0.06] },        matKey: "glass",                       pos: [0, 1.62, 0.32],    minQuality: "high" },
    ],
  },

  lamp: {
    label: "Lamp",
    fastParts: 4,
    ambientColor: "#060400", lightColor: "#ffcc44", lightColor2: "#4488ff", background: "#060402",
    parts: [
      // Heavy base
      { geo: { type: "cylinder", args: [0.52, 0.38, 0.18, 32] }, matKey: "metal", color: "#403020",  pos: [0, -1.82, 0] },
      // Pole
      { geo: { type: "cylinder", args: [0.045, 0.045, 3.1, 10] },matKey: "metal", color: "#504030",  pos: [0, 0.15, 0] },
      // Shade (inverted cone)
      { geo: { type: "cone", args: [0.72, 0.62, 32] },           matKey: "ceramic",color: "#f0ebe0",  pos: [0, 1.55, 0], rot: [Math.PI, 0, 0] },
      // Bulb
      { geo: { type: "sphere", args: [0.18, 32, 32] },           matKey: "neon",   color: "#ffe880",   pos: [0, 1.35, 0], emissive: "#ffe880" },
      // Shade rim (torus)
      { geo: { type: "torus", args: [0.7, 0.025, 16, 64] },      matKey: "metal",  color: "#806040",  pos: [0, 1.24, 0], minQuality: "balanced" },
      // Base detail ring (high)
      { geo: { type: "torus", args: [0.42, 0.03, 12, 32] },      matKey: "gold",   color: "#c09040",  pos: [0, -1.74, 0], minQuality: "high" },
    ],
  },

  car: {
    label: "Car",
    fastParts: 6,
    ambientColor: "#020005", lightColor: "#ffffff", lightColor2: "#4466ff", background: "#020005",
    parts: [
      // Lower body
      { geo: { type: "box", args: [2.1, 0.52, 1.0] },           matKey: "metal",   color: "#cc2200",  pos: [0, -0.06, 0],     colorable: true },
      // Upper cabin
      { geo: { type: "box", args: [1.28, 0.44, 0.92] },         matKey: "metal",   color: "#aa1a00",  pos: [0, 0.46, 0] },
      // Wheel FL
      { geo: { type: "torus", args: [0.27, 0.12, 16, 64] },     matKey: "rubber",  color: "#141414",  pos: [-0.74, -0.34, 0.52], rot: [Math.PI/2, 0, 0] },
      // Wheel FR
      { geo: { type: "torus", args: [0.27, 0.12, 16, 64] },     matKey: "rubber",  color: "#141414",  pos: [0.74, -0.34, 0.52],  rot: [Math.PI/2, 0, 0] },
      // Wheel BL
      { geo: { type: "torus", args: [0.27, 0.12, 16, 64] },     matKey: "rubber",  color: "#141414",  pos: [-0.74, -0.34, -0.52],rot: [Math.PI/2, 0, 0] },
      // Wheel BR
      { geo: { type: "torus", args: [0.27, 0.12, 16, 64] },     matKey: "rubber",  color: "#141414",  pos: [0.74, -0.34, -0.52], rot: [Math.PI/2, 0, 0] },
      // Windshield
      { geo: { type: "box", args: [1.2, 0.38, 0.04] },          matKey: "glass",                      pos: [0, 0.5, 0.48],       minQuality: "balanced" },
      // Headlights
      { geo: { type: "sphere", args: [0.1, 16, 16] },           matKey: "neon",    color: "#ffffff",   pos: [-0.68, -0.04, 0.52], emissive: "#ffffcc",  minQuality: "balanced" },
      { geo: { type: "sphere", args: [0.1, 16, 16] },           matKey: "neon",    color: "#ffffff",   pos: [0.68, -0.04, 0.52],  emissive: "#ffffcc",  minQuality: "balanced" },
      // Taillights
      { geo: { type: "sphere", args: [0.09, 16, 16] },          matKey: "neon",    color: "#ff2200",   pos: [-0.7, -0.04, -0.52], emissive: "#ff2200",  minQuality: "balanced" },
      { geo: { type: "sphere", args: [0.09, 16, 16] },          matKey: "neon",    color: "#ff2200",   pos: [0.7, -0.04, -0.52],  emissive: "#ff2200",  minQuality: "balanced" },
      // Rear window
      { geo: { type: "box", args: [1.2, 0.36, 0.04] },          matKey: "glass",                      pos: [0, 0.5, -0.48],      minQuality: "high" },
      // Side mirrors
      { geo: { type: "box", args: [0.06, 0.07, 0.14] },         matKey: "dark-metal",                  pos: [-1.08, 0.48, 0.35],  minQuality: "high" },
      { geo: { type: "box", args: [0.06, 0.07, 0.14] },         matKey: "dark-metal",                  pos: [ 1.08, 0.48, 0.35],  minQuality: "high" },
    ],
  },

  crystals: {
    label: "Crystal Formation",
    fastParts: 3,
    ambientColor: "#020010", lightColor: "#aa44ff", lightColor2: "#00ffcc", background: "#020010",
    parts: [
      { geo: { type: "octahedron", args: [0.9, 0] },  matKey: "crystal", color: "#c044ff",  pos: [0, 0.2, 0],       scl: [1, 1.6, 1],    emissive: "#8800ff" },
      { geo: { type: "octahedron", args: [0.55, 0] }, matKey: "crystal", color: "#44aaff",  pos: [0.92, -0.4, 0.3], scl: [0.7, 1.4, 0.7],emissive: "#0066ff" },
      { geo: { type: "octahedron", args: [0.45, 0] }, matKey: "crystal", color: "#ff44aa",  pos: [-0.8, -0.5, 0.5], scl: [0.6, 1.3, 0.6],emissive: "#cc0066" },
      { geo: { type: "octahedron", args: [0.38, 0] }, matKey: "crystal", color: "#00ffcc",  pos: [0.3, -0.6, -0.9], scl: [0.5, 1.2, 0.5],emissive: "#00cc88",  minQuality: "balanced" },
      { geo: { type: "octahedron", args: [0.3, 0] },  matKey: "crystal", color: "#ffcc00",  pos: [-0.5, -0.3, -0.8],scl: [0.4, 1.0, 0.4],emissive: "#aa8800",  minQuality: "balanced" },
      { geo: { type: "octahedron", args: [0.25, 0] }, matKey: "crystal", color: "#ff8800",  pos: [0.6, 0.1, 0.8],   scl: [0.4, 0.9, 0.4],emissive: "#cc5500",  minQuality: "balanced" },
      // Micro crystals (high detail)
      { geo: { type: "octahedron", args: [0.14, 0] }, matKey: "crystal", color: "#aa88ff",  pos: [0.5, -0.8, 0.2],  scl: [0.5, 1.4, 0.5],emissive: "#6600cc",  minQuality: "high" },
      { geo: { type: "octahedron", args: [0.12, 0] }, matKey: "crystal", color: "#ffaacc",  pos: [-0.6, -0.7, -0.5],scl: [0.4, 1.2, 0.4],emissive: "#cc0055",  minQuality: "high" },
    ],
  },

  lantern: {
    label: "Lantern",
    fastParts: 6,
    ambientColor: "#050300", lightColor: "#ffaa22", lightColor2: "#ff4400", background: "#060402",
    parts: [
      // Frame (4 vertical bars)
      { geo: { type: "cylinder", args: [0.025, 0.025, 0.85, 8] }, matKey: "metal", color: "#402a10", pos: [ 0.28, 0, 0.28] },
      { geo: { type: "cylinder", args: [0.025, 0.025, 0.85, 8] }, matKey: "metal", color: "#402a10", pos: [-0.28, 0, 0.28] },
      { geo: { type: "cylinder", args: [0.025, 0.025, 0.85, 8] }, matKey: "metal", color: "#402a10", pos: [ 0.28, 0,-0.28] },
      { geo: { type: "cylinder", args: [0.025, 0.025, 0.85, 8] }, matKey: "metal", color: "#402a10", pos: [-0.28, 0,-0.28] },
      // Roof
      { geo: { type: "cone", args: [0.38, 0.34, 4] },  matKey: "metal", color: "#402a10", pos: [0, 0.58, 0], rot: [0, Math.PI/4, 0] },
      // Flame / candle
      { geo: { type: "sphere", args: [0.12, 16, 16] }, matKey: "neon", color: "#ffaa22", pos: [0, -0.12, 0], emissive: "#ff8800" },
      // Glass panels
      { geo: { type: "box", args: [0.55, 0.8, 0.025] }, matKey: "glass", pos: [0, 0,  0.29],  minQuality: "balanced" },
      { geo: { type: "box", args: [0.55, 0.8, 0.025] }, matKey: "glass", pos: [0, 0, -0.29],  minQuality: "balanced" },
      { geo: { type: "box", args: [0.025, 0.8, 0.55] }, matKey: "glass", pos: [ 0.29, 0, 0],  minQuality: "balanced" },
      { geo: { type: "box", args: [0.025, 0.8, 0.55] }, matKey: "glass", pos: [-0.29, 0, 0],  minQuality: "balanced" },
      // Bottom plate
      { geo: { type: "cylinder", args: [0.3, 0.3, 0.05, 8] }, matKey: "metal", color: "#302010", pos: [0, -0.44, 0], minQuality: "balanced" },
      // Handle
      { geo: { type: "torus", args: [0.16, 0.02, 12, 32] }, matKey: "metal", color: "#402a10", pos: [0, 0.75, 0], rot: [Math.PI/2, 0, 0], minQuality: "high" },
      // Cross braces (high detail)
      { geo: { type: "cylinder", args: [0.012, 0.012, 0.56, 6] }, matKey: "metal", color: "#402a10", pos: [0, 0.42, 0], rot: [0, 0, 0],            minQuality: "high" },
      { geo: { type: "cylinder", args: [0.012, 0.012, 0.56, 6] }, matKey: "metal", color: "#402a10", pos: [0, 0.42, 0], rot: [Math.PI/2, 0, 0],     minQuality: "high" },
    ],
  },

  skull: {
    label: "Skull",
    fastParts: 4,
    ambientColor: "#050001", lightColor: "#aa4400", lightColor2: "#440088", background: "#050001",
    parts: [
      // Cranium
      { geo: { type: "sphere", args: [0.72, 32, 32] },           matKey: "bone",                       pos: [0, 0.18, 0],       scl: [1, 1.05, 0.95] },
      // Upper jaw / cheekbones
      { geo: { type: "sphere", args: [0.62, 32, 32] },           matKey: "bone",   color: "#ddd0b0",   pos: [0, -0.38, 0.1],    scl: [1.0, 0.5, 0.95] },
      // Left eye socket
      { geo: { type: "sphere", args: [0.2, 20, 20] },            matKey: "void",                       pos: [-0.28, 0.15, 0.6] },
      // Right eye socket
      { geo: { type: "sphere", args: [0.2, 20, 20] },            matKey: "void",                       pos: [0.28, 0.15, 0.6] },
      // Eye glow L
      { geo: { type: "sphere", args: [0.1, 16, 16] },            matKey: "neon",   color: "#ff0000",   pos: [-0.27, 0.15, 0.65], emissive: "#ff0000",  minQuality: "balanced" },
      // Eye glow R
      { geo: { type: "sphere", args: [0.1, 16, 16] },            matKey: "neon",   color: "#ff0000",   pos: [0.27, 0.15, 0.65],  emissive: "#ff0000",  minQuality: "balanced" },
      // Nose cavity
      { geo: { type: "sphere", args: [0.11, 16, 16] },           matKey: "void",                       pos: [0, -0.1, 0.65],    scl: [0.6, 0.8, 1],  minQuality: "balanced" },
      // Teeth (5 lower)
      ...([-0.28,-0.14,0,0.14,0.28] as number[]).map(x =>
        ({ geo: { type: "box", args: [0.1, 0.15, 0.08] } as GeometryDef, matKey: "bone", color: "#f0ede0", pos: [x, -0.55, 0.5] as [number,number,number], minQuality: "balanced" as const })
      ),
      // Crack detail (high)
      { geo: { type: "box", args: [0.012, 0.4, 0.015] },         matKey: "void",   color: "#050001",   pos: [0.18, 0.35, 0.62], rot: [0, 0, 0.3],     minQuality: "high" },
    ],
  },

};

// Keyword → blueprint key
const BLUEPRINT_LEXICON: [string, string][] = [
  ["maison|house|home|cottage|cabin|cabane|villa|chalet|manoir|manor|logis", "house"],
  ["arbre|tree|chêne|oak|pine|sapin|oak tree|pine tree|grand arbre",         "tree"],
  ["fus[eé]e|rocket|missile|navette|vaisseau|spacecraft|spaceship",          "rocket"],
  ["[eé]p[eé]e|sword|dagger|blade|lame|saber|sabre|glaive|katana",          "sword"],
  ["tour|tower|ch[aâ]teau|castle|fort|fortress|donjon|dungeon|bastion",      "tower"],
  ["champignon|mushroom|fungus|toadstool",                                    "mushroom"],
  ["robot|androïde|android|droid|mech|automate|cyborg",                      "robot"],
  ["lampe|lamp|lantern|light|lumière|chandelier|lustre|sconce",               "lamp"],
  ["voiture|car|auto|vehicle|automobile|f[eé]roce|sports car|berline",       "car"],
  ["cristaux?|crystals?|crystal formation|cluster de cristaux|geode|géode",  "crystals"],
  ["lanterne|lantern|fanal|lampion",                                          "lantern"],
  ["cr[aâ]ne|skull|death head|squelette skull|tête de mort",                 "skull"],
];

// ── quality helpers ───────────────────────────────────────────────────────────

const QUALITY_ORDER: Record<QualityLevel, number> = { fast: 0, balanced: 1, high: 2 };

/** Scale segment counts in a geometry based on the quality level. */
export function applyQualityToGeo(geo: GeometryDef, quality: QualityLevel): GeometryDef {
  if (quality === "balanced") return geo; // baseline — no change
  const factor = quality === "high" ? 2.0 : 0.28; // high = 2× segments, fast = 28%
  const sc = (n: number, min: number): number => Math.max(min, Math.round(n * factor));
  switch (geo.type) {
    case "sphere": {
      const [r, w, h] = geo.args as [number, number, number];
      return { type: "sphere", args: [r, sc(w, 8), sc(h, 6)] };
    }
    case "cylinder": {
      const [rt, rb, h, s] = geo.args as [number, number, number, number];
      return { type: "cylinder", args: [rt, rb, h, sc(s, 5)] };
    }
    case "cone": {
      const [r, h, s] = geo.args as [number, number, number];
      return { type: "cone", args: [r, h, Math.max(3, sc(s, 3))] };
    }
    case "torus": {
      const [r, t, s1, s2] = geo.args as [number, number, number, number];
      return { type: "torus", args: [r, t, sc(s1, 5), sc(s2, 12)] };
    }
    case "torusKnot": {
      const [r, t, s1, s2, p, q] = geo.args;
      return { type: "torusKnot", args: [r, t, sc(s1, 48), sc(s2, 6), p, q].filter(v => v !== undefined) };
    }
    case "capsule": {
      const [r, l, c, s] = geo.args as [number, number, number, number];
      return { type: "capsule", args: [r, l, sc(c, 3), sc(s, 8)] };
    }
    default:
      return geo;
  }
}

// Resolve a blueprint into ObjectDef[]
function resolveBlueprint(
  bp: Blueprint,
  userColor: string | null,
  matOverride: MaterialPreset | null,
  quality: QualityLevel,
): ObjectDef[] {
  const qv = QUALITY_ORDER[quality];

  // Fast: slice to fastParts count (default 2)
  let parts = bp.parts;
  if (quality === "fast") {
    const n = bp.fastParts ?? 2;
    parts = parts.filter(p => !p.minQuality); // only always-visible parts in fast
    parts = parts.slice(0, n);
  } else {
    // Balanced: drop "high" only parts. High: all parts.
    parts = parts.filter(p => {
      if (!p.minQuality) return true;
      return qv >= QUALITY_ORDER[p.minQuality];
    });
  }

  return parts.map((part): ObjectDef => {
    let partColor = part.color ?? "#aaaaaa";
    if (part.colorable && userColor) partColor = userColor;
    const mat = makeBpMat(part.matKey, partColor, part.emissive);
    if (matOverride && part.colorable) {
      mat.metalness        = matOverride.metalness;
      mat.roughness        = matOverride.roughness;
      mat.emissiveIntensity = matOverride.emissiveMult * 0.6;
      if (matOverride.transmission) {
        mat.transmission = matOverride.transmission;
        mat.transparent  = false;
      }
    }
    // High quality: attach texture hint for the renderer to generate a procedural map
    // Skip emissive-heavy / transparent / void matKeys that texture poorly
    if (quality === "high" && !["glass","crystal","neon","fire","void"].includes(part.matKey)) {
      mat.textureKey = part.matKey;
    }
    return {
      geometry:  applyQualityToGeo(part.geo, quality),
      material:  mat,
      position:  part.pos,
      rotation:  part.rot ?? [0, 0, 0],
      scale:     1,
      scaleXYZ:  part.scl,
      animate:   "none",
      animSpeed: 0,
    };
  });
}

// ── recognition engine ────────────────────────────────────────────────────────

function matchLexicon<T>(
  lower: string,
  lexicon: [string, string, T][],
  category: RecognitionCategory,
  recs: Recognition[],
): T | null {
  for (const [pattern, label, value] of lexicon) {
    const rx = new RegExp(`\\b(${pattern})\\b`, "i");
    const m = lower.match(rx);
    if (m) {
      recs.push({ token: m[1], label, category });
      return value;
    }
  }
  return null;
}

function matchFlag<T>(
  lower: string,
  lexicon: [string, T][],
  category: RecognitionCategory,
  recs: Recognition[],
): T | null {
  for (const [pattern, value] of lexicon) {
    const rx = new RegExp(`\\b(${pattern})\\b`, "i");
    const m = lower.match(rx);
    if (m) {
      recs.push({ token: m[1], label: String(value), category });
      return value;
    }
  }
  return null;
}

// ── main parser ───────────────────────────────────────────────────────────────

export function parsePrompt(prompt: string, quality: QualityLevel = "balanced"): SceneConfig {
  const lower = prompt.toLowerCase();
  const rng = seededRandom(hash(prompt));
  const recognitions: Recognition[] = [];

  // 0. Blueprint detection — runs BEFORE everything else
  let matchedBpKey: string | null = null;
  for (const [pattern, bpKey] of BLUEPRINT_LEXICON) {
    const rx = new RegExp(`\\b(${pattern})\\b`, "i");
    const m = lower.match(rx);
    if (m) {
      matchedBpKey = bpKey;
      recognitions.push({ token: m[1], label: bpKey, category: "shape" });
      break;
    }
  }

  // 1. Scene archetype
  const sceneTypeRaw = matchFlag(lower, SCENE_LEXICON, "scene", recognitions);

  // 2. Shape
  const geoDef = matchLexicon(lower, SHAPE_LEXICON, "shape", recognitions);

  // 3. Material
  const matPreset = matchLexicon(lower, MATERIAL_LEXICON, "material", recognitions);

  // 4. Color
  let detectedColor: string | null = null;
  for (const [pattern, label, hex] of COLOR_LEXICON) {
    const rx = new RegExp(`\\b(${pattern})\\b`, "i");
    const m = lower.match(rx);
    if (m) {
      recognitions.push({ token: m[1], label, category: "color", hex });
      detectedColor = hex;
      break;
    }
  }

  // 5. Animation
  const animType = matchFlag(lower, ANIMATION_LEXICON, "animation", recognitions) ?? "float";

  // 6. Modifiers (match all, not just first)
  const modifiers: string[] = [];
  for (const [pattern, label] of MODIFIER_LEXICON) {
    const rx = new RegExp(`\\b(${pattern})\\b`, "i");
    const m = lower.match(rx);
    if (m) {
      recognitions.push({ token: m[1], label, category: "modifier" });
      modifiers.push(label);
    }
  }

  // 7. Count modifier
  const isMany  = /\b(many|plusieurs|cluster|field of|group of|lots of|beaucoup|myriad|innombrable|countless)\b/i.test(lower);
  const isFew   = /\b(few|quelques|couple|pair|several)\b/i.test(lower);
  if (isMany)  recognitions.push({ token: "many", label: "many", category: "count" });
  if (isFew)   recognitions.push({ token: "few",  label: "few",  category: "count" });

  // ── derive semantic flags ─────────────────────────────────────────────────

  const isDark       = modifiers.includes("dark");
  const isFuturistic = modifiers.includes("futuristic");
  const isAncient    = modifiers.includes("ancient");
  const isElectric   = modifiers.includes("electric");
  const isMagical    = modifiers.includes("magical");
  const isGiant      = modifiers.includes("giant");
  const isTiny       = modifiers.includes("tiny");
  const isSharp      = modifiers.includes("sharp");
  const baseScale    = isGiant ? 1.7 : isTiny ? 0.5 : 1.0;

  // Material flags from preset
  const isNeon       = matPreset ? /neon|plasma|lava|ember/.test(recognitions.find(r=>r.category==="material")?.label ?? "") : false;
  const isGlass      = matPreset?.transmission != null && matPreset.transmission > 0.5;
  const isWireframe  = matPreset?.wireframe === true;
  const isMetallic   = (matPreset?.metalness ?? 0) > 0.7;

  // Fallback palette
  const PALETTE = ["#7c3aed","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#8b5cf6","#14b8a6"];
  const fallbackColor = PALETTE[hash(prompt) % PALETTE.length];
  const color = detectedColor ?? (
    matPreset?.defaultColor ??     // inherent color of the material (concrete gray, rust orange…)
    (isElectric   ? "#00e5ff" :
     isMagical    ? "#c026d3" :
     isFuturistic ? "#00e676" :
     isAncient    ? "#ffd700" :
     fallbackColor)
  );

  // Strong-color materials override (lava, ember…)
  const effectiveColor =
    recognitions.find(r => r.label === "lava")  ? "#ff3d00" :
    recognitions.find(r => r.label === "ember") ? "#ff6600" :
    color;

  // ── blueprint early return ─────────────────────────────────────────────────
  if (matchedBpKey && BLUEPRINTS[matchedBpKey]) {
    const bp = BLUEPRINTS[matchedBpKey];
    const bpObjects = resolveBlueprint(bp, detectedColor, matPreset, quality);

    const isWarm = /warm|chaud|sun|feu|lava|gold|amber|orange|rust|rouille/i.test(lower);
    const isCool = /cool|froid|ice|ocean|space|winter|frost|cold|void|bleu/i.test(lower);

    return {
      sceneType:      "single",
      objects:        bpObjects,
      particles:      null,
      fogColor:       null,
      ambientColor:   bp.ambientColor ?? (isDark ? "#0a0015" : isWarm ? "#2a0a00" : isCool ? "#000a1a" : "#0d001a"),
      lightColor:     bp.lightColor  ?? (isWarm ? "#ff8833" : isCool ? "#33aaff" : "#9955ff"),
      lightColor2:    bp.lightColor2 ?? (isWarm ? "#ff5500" : isCool ? "#0055ff" : "#4400cc"),
      background:     bp.background  ?? (isDark ? "#030008" : "#070010"),
      recognitions,
      isBlueprint:    true,
      blueprintLabel: bp.label,
    };
  }

  // ── build material ────────────────────────────────────────────────────────

  const emissiveBase = isDark ? "#1a0033" : effectiveColor;
  const emissiveIntensity = matPreset
    ? (isNeon || isElectric || isMagical ? matPreset.emissiveMult * 1.2 : matPreset.emissiveMult * 0.4)
    : (isElectric || isMagical ? 0.6 : 0.0);

  const _noTex = ["glass","crystal","neon","fire","void"];
  const _matLabel = recognitions.find(r => r.category === "material")?.label ?? "";
  const material: MaterialDef = {
    color:             isDark && !isWireframe ? "#0d0020" : effectiveColor,
    emissive:          emissiveBase,
    emissiveIntensity,
    metalness:         matPreset?.metalness ?? 0.15,
    roughness:         matPreset?.roughness ?? (isSharp ? 0.1 : 0.4),
    wireframe:         isWireframe,
    transparent:       (matPreset?.transparency ?? false) || isWireframe,
    opacity:           isWireframe ? 0.55 : (matPreset?.transparency ? 0.4 : 1.0),
    transmission:      matPreset?.transmission,
    iridescence:       matPreset?.iridescence,
    thickness:         matPreset?.transmission ? 1.5 : undefined,
    // High quality: attach procedural texture key if we have a named material
    textureKey: quality === "high" && matPreset && _matLabel && !_noTex.includes(_matLabel)
      ? _matLabel
      : undefined,
  };

  // Wireframe shell companion
  const shellMat: MaterialDef = {
    color:             effectiveColor,
    emissive:          effectiveColor,
    emissiveIntensity: 0.4,
    metalness:         0.0,
    roughness:         0.3,
    wireframe:         true,
    transparent:       true,
    opacity:           0.1,
  };

  // ── pick geometry ─────────────────────────────────────────────────────────

  const defaultGeos: GeometryDef[] = [
    { type: "icosahedron", args: [1.3, 0] },
    { type: "torusKnot",   args: [0.9, 0.3, 256, 16] },
    { type: "sphere",      args: [1.2, 64, 64] },
    { type: "octahedron",  args: [1.4, 0] },
    { type: "torus",       args: [1.2, 0.38, 32, 128] },
    { type: "dodecahedron",args: [1.3, 0] },
  ];
  const geo = applyQualityToGeo(geoDef ?? defaultGeos[hash(prompt) % defaultGeos.length], quality);

  // ── scene type resolution ─────────────────────────────────────────────────

  const sceneType: SceneType = sceneTypeRaw ?? (
    isMany && (geo.type === "sphere" || geo.type === "octahedron") ? "cluster" :
    isMany ? "cluster" :
    isFew  ? "ring"    :
    "single"
  );

  // ── build objects by scene type ───────────────────────────────────────────

  const objects: ObjectDef[] = [];
  const animSpeed = 0.35 + rng() * 0.5;
  const showShell = !isWireframe && !isGlass && rng() > 0.5;

  function makeObj(
    g: GeometryDef, m: MaterialDef,
    pos: [number,number,number],
    rot: [number,number,number],
    scale: number,
    anim: AnimateType,
    speed: number,
  ): ObjectDef {
    return { geometry: g, material: m, position: pos, rotation: rot, scale, animate: anim, animSpeed: speed };
  }

  switch (sceneType) {
    case "single": {
      objects.push(makeObj(geo, material, [0,0,0], [rng()*Math.PI, rng()*Math.PI, 0], baseScale, animType, animSpeed));
      if (showShell) {
        objects.push(makeObj(geo, shellMat, [0,0,0], [rng()*Math.PI, rng()*Math.PI, 0], baseScale * 1.04, "spin", -0.12));
      }
      break;
    }
    case "cluster": {
      const n = isMany ? 8 + Math.floor(rng()*6) : 5 + Math.floor(rng()*4);
      for (let i = 0; i < n; i++) {
        const r = 1.4 + rng() * 2.2;
        const theta = rng() * Math.PI * 2;
        const phi   = (rng() - 0.5) * Math.PI;
        objects.push(makeObj(
          geo, material,
          [r * Math.cos(theta) * Math.cos(phi), r * Math.sin(phi), r * Math.sin(theta) * Math.cos(phi)],
          [rng()*Math.PI, rng()*Math.PI, 0],
          baseScale * (0.3 + rng() * 0.5),
          animType, 0.2 + rng() * 0.6,
        ));
      }
      break;
    }
    case "orbital": {
      // Central body
      objects.push(makeObj(geo, material, [0,0,0], [rng()*Math.PI, 0, 0], baseScale, "spin", animSpeed));
      // Moons
      const moons = 3 + Math.floor(rng() * 4);
      const moonGeo: GeometryDef = { type: "sphere", args: [0.6, 32, 32] };
      for (let i = 0; i < moons; i++) {
        const radius = 2.2 + i * 0.9;
        const angle  = (i / moons) * Math.PI * 2;
        const yOff   = (rng() - 0.5) * 0.6;
        const moonMat: MaterialDef = { ...material, emissiveIntensity: material.emissiveIntensity * 0.6 };
        objects.push(makeObj(
          moonGeo, moonMat,
          [Math.cos(angle) * radius, yOff, Math.sin(angle) * radius],
          [0, 0, 0],
          baseScale * (0.2 + rng() * 0.2),
          "orbit", 0.15 + rng() * 0.25,
        ));
      }
      break;
    }
    case "ring": {
      const n = 5 + Math.floor(rng() * 5);
      for (let i = 0; i < n; i++) {
        const angle  = (i / n) * Math.PI * 2;
        const radius = 2.4;
        objects.push(makeObj(
          geo, material,
          [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
          [rng()*Math.PI, rng()*Math.PI, 0],
          baseScale * 0.55,
          "orbit", 0.2 + rng() * 0.25,
        ));
      }
      break;
    }
    case "helix": {
      const n = 10 + Math.floor(rng() * 6);
      for (let i = 0; i < n; i++) {
        const t      = (i / n) * Math.PI * 4; // 2 full turns
        const radius = 1.5;
        const yStep  = (i / n) * 4 - 2;
        const angle  = t;
        // Two strands (DNA-like)
        for (const flip of [1, -1]) {
          objects.push(makeObj(
            { type: "sphere", args: [0.18, 16, 16] },
            { ...material, emissiveIntensity: material.emissiveIntensity * 0.8 },
            [Math.cos(angle + flip * Math.PI) * radius, yStep, Math.sin(angle + flip * Math.PI) * radius],
            [0, 0, 0],
            baseScale * 0.35,
            "float", 0.15 + rng() * 0.15,
          ));
        }
      }
      // Connector axis
      objects.push(makeObj(
        { type: "cylinder", args: [0.04, 0.04, 4.2, 8] },
        { ...material, opacity: 0.3, transparent: true },
        [0, 0, 0], [0, 0, 0], 1, "spin", 0.08,
      ));
      break;
    }
    case "grid": {
      const dim = 3;
      const spacing = 1.5;
      for (let x = 0; x < dim; x++) for (let z = 0; z < dim; z++) {
        const px = (x - 1) * spacing;
        const pz = (z - 1) * spacing;
        const py = (rng() - 0.5) * 0.6;
        objects.push(makeObj(
          geo, material,
          [px, py, pz],
          [rng()*Math.PI, rng()*Math.PI, 0],
          baseScale * (0.4 + rng() * 0.3),
          animType, 0.25 + rng() * 0.35,
        ));
      }
      break;
    }
    case "vortex": {
      const n = 12 + Math.floor(rng() * 8);
      for (let i = 0; i < n; i++) {
        const t      = (i / n);
        const angle  = t * Math.PI * 6;
        const radius = 0.5 + t * 2.5;
        const yPos   = t * 4 - 2;
        objects.push(makeObj(
          geo, material,
          [Math.cos(angle) * radius, yPos, Math.sin(angle) * radius],
          [rng()*Math.PI, rng()*Math.PI, 0],
          baseScale * (0.15 + t * 0.35),
          "orbit", 0.4 - t * 0.25,
        ));
      }
      break;
    }
    case "galaxy": {
      // Just a few accent objects — real galaxy is the particle system
      const n = 4 + Math.floor(rng() * 4);
      for (let i = 0; i < n; i++) {
        const r = 1.5 + rng() * 3;
        const a = rng() * Math.PI * 2;
        objects.push(makeObj(
          { type: "sphere", args: [0.3 + rng()*0.4, 32, 32] },
          { ...material, emissiveIntensity: 0.8 + rng() * 0.6 },
          [Math.cos(a)*r, (rng()-0.5)*0.8, Math.sin(a)*r],
          [0, 0, 0],
          baseScale * (0.4 + rng() * 0.4),
          "float", 0.12 + rng() * 0.2,
        ));
      }
      break;
    }
  }

  // ── particles ─────────────────────────────────────────────────────────────

  const needsParticles =
    sceneType === "galaxy" || sceneType === "vortex" ||
    isNeon || isMagical || isElectric ||
    /star|space|cosmos|magic|dust|ether|fairy|sparkl|glitter|void|nébuleuse|poussière/i.test(lower);

  const particleMode: ParticleDef["mode"] =
    sceneType === "galaxy"  ? "galaxy"  :
    sceneType === "vortex"  ? "vortex"  :
    /rain|pluie|drop|fall/i.test(lower) ? "rain"    : "ambient";

  const particles: ParticleDef | null = needsParticles ? {
    count:  sceneType === "galaxy" ? 3000 : 1200,
    color:  effectiveColor,
    size:   sceneType === "galaxy" ? 0.018 : 0.025,
    spread: sceneType === "galaxy" ? 12 : 8,
    mode:   particleMode,
  } : null;

  // ── lighting & environment ────────────────────────────────────────────────

  const isWarm = /warm|chaud|sun|feu|lava|gold|amber|orange|rust|rouille/i.test(lower);
  const isCool = /cool|froid|ice|ocean|space|winter|frost|cold|void|bleu/i.test(lower);

  const ambientColor = isDark    ? "#0a0015"
                     : isWarm   ? "#2a0a00"
                     : isCool   ? "#000a1a"
                     : isMagical? "#160022"
                     : "#0d001a";

  const lightColor   = isWarm    ? "#ff8833"
                     : isCool    ? "#33aaff"
                     : isElectric? "#00ffff"
                     : isMagical ? "#cc00ff"
                     : "#9955ff";

  const lightColor2  = isWarm    ? "#ff5500"
                     : isCool    ? "#0055ff"
                     : isElectric? "#ffff00"
                     : isMagical ? "#00ffcc"
                     : "#4400cc";

  const background   = isDark ? "#030008" : "#070010";

  return {
    sceneType,
    objects,
    particles,
    fogColor: isDark || sceneType === "galaxy" ? background : null,
    ambientColor,
    lightColor,
    lightColor2,
    background,
    recognitions,
  };
}
