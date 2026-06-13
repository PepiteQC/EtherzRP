// src/weapons/data/weaponCatalog.ts

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type WeaponTier = 'legal' | 'restricted' | 'blackmarket' | 'admin_only'

export type WeaponCategory =
  | 'rifle_hunting'
  | 'shotgun'
  | 'pistol'
  | 'smg'
  | 'assault_rifle'
  | 'sniper'
  | 'melee'
  | 'throwable'
  | 'utility'
  | 'armor'

export type WeaponRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type AttachmentType = 'scope' | 'suppressor' | 'grip' | 'stock' | 'magazine' | 'light'

export type AmmoType =
  | '30-06' | '30-30' | '.308' | '.22LR' | '12ga' | '9mm'
  | '.45' | '5.56x45' | '5.45x39' | '7.62x39' | '7.62x51'
  | '7.62x54' | '5.7x28' | '9x18' | '.50AE' | '.50BMG'
  | 'flare' | 'fire' | 'smoke' | 'flash' | 'frag' | 'armor' | 'none'

// ═══════════════════════════════════════════════════════════════
//  INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface WeaponStats {
  /** Dégâts de base (1–100, sauf armes spéciales) */
  damage: number
  /** Portée efficace en mètres */
  range: number
  /** Cadence de tir en coups/minute (0 = bolt-action) */
  fireRate: number
  /** Précision (1–100) */
  accuracy: number
  /** Recul (1–100) */
  recoil: number
  /** Temps de rechargement en secondes */
  reloadTime: number
  /** Capacité du chargeur (0 = arme de mêlée) */
  magCapacity: number
  /** Poids en kg */
  weight: number
  /** Pénétration d'armure en % (optionnel) */
  armorPen?: number
  /** Rayon de souffle en mètres (explosifs) */
  blastRadius?: number
}

export interface WeaponAttachment {
  type: AttachmentType
  name: string
  /** Modificateurs additifs appliqués aux stats de base */
  modifier: Partial<WeaponStats>
  price: number
}

export interface Weapon {
  id: string
  name: string
  brand?: string
  category: WeaponCategory
  tier: WeaponTier
  description: string
  origin: string
  /** Histoire / contexte RP */
  lore?: string
  /** Prix légal en magasin (0 si non disponible légalement) */
  price: number
  /** Prix au marché noir */
  blackMarketPrice?: number
  /** Code de permis requis */
  requiresLicense?: string
  stats: WeaponStats
  ammoType: AmmoType
  emoji: string
  /** Clé pour WeaponModelFactory */
  modelKey: string
  legal_quebec: boolean
  tags: ReadonlyArray<string>
  availableAttachments?: WeaponAttachment[]
  rarity: WeaponRarity
}

// ═══════════════════════════════════════════════════════════════
//  CONSTANTES DE RÉFÉRENCE
// ═══════════════════════════════════════════════════════════════

export const RARITY_COLORS: Readonly<Record<WeaponRarity, string>> = {
  common:    '#9ca3af',
  uncommon:  '#22c55e',
  rare:      '#3b82f6',
  epic:      '#a855f7',
  legendary: '#f59e0b',
} as const

export const RARITY_LABELS: Readonly<Record<WeaponRarity, string>> = {
  common:    'Commun',
  uncommon:  'Peu commun',
  rare:      'Rare',
  epic:      'Épique',
  legendary: 'Légendaire',
} as const

export const TIER_LABELS: Readonly<Record<WeaponTier, string>> = {
  legal:       '🟢 Légal',
  restricted:  '🟡 Restreint',
  blackmarket: '🔴 Marché noir',
  admin_only:  '☠️ Admin seulement',
} as const

export const TIER_COLORS: Readonly<Record<WeaponTier, string>> = {
  legal:       '#22c55e',
  restricted:  '#f59e0b',
  blackmarket: '#ef4444',
  admin_only:  '#8b5cf6',
} as const

export const CATEGORY_LABELS: Readonly<Record<WeaponCategory, string>> = {
  rifle_hunting: 'Carabine de chasse',
  shotgun:       'Fusil à pompe / Shotgun',
  pistol:        'Pistolet',
  smg:           'Pistolet-mitrailleur',
  assault_rifle: "Fusil d'assaut",
  sniper:        'Fusil de précision',
  melee:         'Arme de mêlée',
  throwable:     'Arme à lancer',
  utility:       'Utilitaire',
  armor:         'Protection',
} as const

// ═══════════════════════════════════════════════════════════════
//  CATALOGUE
// ═══════════════════════════════════════════════════════════════

export const WEAPONS_CATALOG: Readonly<Weapon[]> = [

  // ════════════════════════════════════════════════════════════
  //  🟢 TIER 1 — LÉGAL (magasin chasse & pêche)
  // ════════════════════════════════════════════════════════════

  // ── Carabines de chasse ──────────────────────────────────────

  {
    id: 'rem700_30-06',
    name: 'Remington 700',
    brand: 'Remington Arms',
    category: 'rifle_hunting',
    tier: 'legal',
    description: "Carabine de chasse classique. La référence des chasseurs québécois depuis 1962.",
    lore: "Utilisée pour la chasse à l'orignal dans Charlevoix depuis des générations.",
    origin: '🇺🇸 USA',
    price: 850,
    requiresLicense: 'PAA',
    stats: {
      damage: 80, range: 400, fireRate: 0, accuracy: 88,
      recoil: 65, reloadTime: 2.5, magCapacity: 4, weight: 3.4, armorPen: 35,
    },
    ammoType: '30-06',
    emoji: '🎯',
    modelKey: 'bolt_rifle',
    legal_quebec: true,
    rarity: 'common',
    tags: ['chasse', 'précision', 'orignal', 'québec'],
    availableAttachments: [
      { type: 'scope', name: 'Lunette Leupold 3-9x40',  modifier: { accuracy: 12, range: 150 }, price: 420 },
      { type: 'stock', name: 'Crosse synthétique',       modifier: { recoil: -8, weight: -0.3 }, price: 180 },
    ],
  },

  {
    id: 'win94_30-30',
    name: 'Winchester Model 94',
    brand: 'Winchester',
    category: 'rifle_hunting',
    tier: 'legal',
    description: 'Carabine à levier légendaire. Maniable en forêt dense du Québec.',
    lore: 'La carabine des bûcherons et trappeurs de la Haute-Mauricie.',
    origin: '🇺🇸 USA',
    price: 720,
    requiresLicense: 'PAA',
    stats: {
      damage: 70, range: 200, fireRate: 60, accuracy: 75,
      recoil: 50, reloadTime: 3.0, magCapacity: 7, weight: 3.0, armorPen: 25,
    },
    ammoType: '30-30',
    emoji: '🤠',
    modelKey: 'lever_rifle',
    legal_quebec: true,
    rarity: 'common',
    tags: ['chasse', 'levier', 'classique', 'chevreuil'],
  },

  {
    id: 'savage_axis_308',
    name: 'Savage Axis II XP',
    brand: 'Savage Arms',
    category: 'rifle_hunting',
    tier: 'legal',
    description: 'Carabine .308 avec lunette Bushnell incluse. Rapport qualité/prix imbattable.',
    origin: '🇺🇸 USA',
    price: 650,
    requiresLicense: 'PAA',
    stats: {
      damage: 78, range: 500, fireRate: 0, accuracy: 90,
      recoil: 60, reloadTime: 2.8, magCapacity: 4, weight: 3.2, armorPen: 40,
    },
    ammoType: '.308',
    emoji: '🦌',
    modelKey: 'bolt_rifle',
    legal_quebec: true,
    rarity: 'common',
    tags: ['chasse', 'lunette', 'précision', 'longue portée'],
    availableAttachments: [
      { type: 'scope', name: 'Lunette Vortex 4-12x44', modifier: { accuracy: 10, range: 200 }, price: 580 },
    ],
  },

  {
    id: 'ruger_10_22',
    name: 'Ruger 10/22',
    brand: 'Ruger',
    category: 'rifle_hunting',
    tier: 'legal',
    description: 'Carabine .22 semi-automatique. Parfaite pour débuter et chasser le petit gibier.',
    lore: 'La première carabine de milliers de chasseurs québécois.',
    origin: '🇺🇸 USA',
    price: 380,
    requiresLicense: 'PAA',
    stats: {
      damage: 28, range: 150, fireRate: 120, accuracy: 82,
      recoil: 15, reloadTime: 2.0, magCapacity: 10, weight: 2.1, armorPen: 5,
    },
    ammoType: '.22LR',
    emoji: '🐿️',
    modelKey: 'semi_rifle',
    legal_quebec: true,
    rarity: 'common',
    tags: ['petit gibier', 'débutant', 'économique', '.22'],
  },

  {
    id: 'browning_bar_308',
    name: 'Browning BAR MK3',
    brand: 'Browning',
    category: 'rifle_hunting',
    tier: 'legal',
    description: 'Carabine semi-auto de chasse .308 belge. Légèreté et faible recul.',
    lore: "Préférée des guides de chasse en Charlevoix pour sa fiabilité en toutes conditions.",
    origin: '🇧🇪 Belgique',
    price: 1250,
    requiresLicense: 'PAA',
    stats: {
      damage: 75, range: 450, fireRate: 180, accuracy: 85,
      recoil: 45, reloadTime: 2.2, magCapacity: 4, weight: 3.1, armorPen: 38,
    },
    ammoType: '.308',
    emoji: '🦌',
    modelKey: 'semi_rifle',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['chasse', 'semi-auto', 'belge', 'confort'],
    availableAttachments: [
      { type: 'scope', name: 'Lunette Swarovski Z5 3-15x44', modifier: { accuracy: 15, range: 200 }, price: 1400 },
    ],
  },

  // ── Fusils à pompe ───────────────────────────────────────────

  {
    id: 'rem870_12ga',
    name: 'Remington 870 Express',
    brand: 'Remington Arms',
    category: 'shotgun',
    tier: 'legal',
    description: "Shotgun à pompe 12-gauge. Vendu à 11 millions d'exemplaires. La référence.",
    lore: "Présent dans presque chaque chalet du Québec depuis 1950.",
    origin: '🇺🇸 USA',
    price: 550,
    requiresLicense: 'PAA',
    stats: {
      damage: 90, range: 50, fireRate: 30, accuracy: 60,
      recoil: 80, reloadTime: 4.0, magCapacity: 5, weight: 3.6, armorPen: 15,
    },
    ammoType: '12ga',
    emoji: '🦆',
    modelKey: 'pump_shotgun',
    legal_quebec: true,
    rarity: 'common',
    tags: ['chasse', 'pompe', 'polyvalent', 'canard'],
    availableAttachments: [
      { type: 'stock', name: 'Crosse pistol-grip',       modifier: { accuracy: -5, recoil: -10 },  price: 95  },
      { type: 'light', name: 'Lampe tactique Surefire',  modifier: { accuracy: 5 },                price: 180 },
    ],
  },

  {
    id: 'mossberg_500',
    name: 'Mossberg 500 Field',
    brand: 'Mossberg',
    category: 'shotgun',
    tier: 'legal',
    description: 'Alternatif fiable au Remington 870. Moins cher, tout aussi efficace.',
    origin: '🇺🇸 USA',
    price: 480,
    requiresLicense: 'PAA',
    stats: {
      damage: 88, range: 45, fireRate: 30, accuracy: 58,
      recoil: 78, reloadTime: 4.5, magCapacity: 6, weight: 3.4, armorPen: 12,
    },
    ammoType: '12ga',
    emoji: '💥',
    modelKey: 'pump_shotgun',
    legal_quebec: true,
    rarity: 'common',
    tags: ['chasse', 'pompe', 'économique'],
  },

  {
    id: 'benelli_sbe3',
    name: 'Benelli Super Black Eagle 3',
    brand: 'Benelli',
    category: 'shotgun',
    tier: 'legal',
    description: "Le graal des chasseurs de sauvagine. Semi-automatique, inox, Inertia Drive.",
    lore: "Les amateurs de chasse à l'oie débourseront volontiers pour ce bijou italien.",
    origin: '🇮🇹 Italie',
    price: 2400,
    requiresLicense: 'PAA',
    stats: {
      damage: 92, range: 58, fireRate: 90, accuracy: 72,
      recoil: 65, reloadTime: 3.5, magCapacity: 4, weight: 3.3, armorPen: 18,
    },
    ammoType: '12ga',
    emoji: '🏆',
    modelKey: 'semi_shotgun',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['luxe', 'semi-auto', 'sauvagine', 'haut de gamme'],
  },

  // ── Couteaux légaux ──────────────────────────────────────────

  {
    id: 'buck_119',
    name: 'Buck 119 Special',
    brand: 'Buck Knives',
    category: 'melee',
    tier: 'legal',
    description: 'Couteau de chasse fixe inoxydable. Lame de 15 cm, manche phénolique.',
    origin: '🇺🇸 USA',
    price: 95,
    stats: {
      damage: 35, range: 1.2, fireRate: 60, accuracy: 100,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.3,
    },
    ammoType: 'none',
    emoji: '🔪',
    modelKey: 'hunting_knife',
    legal_quebec: true,
    rarity: 'common',
    tags: ['chasse', 'fixe', 'dépeçage'],
  },

  {
    id: 'mora_companion',
    name: 'Mora Companion',
    brand: 'Mora of Sweden',
    category: 'melee',
    tier: 'legal',
    description: 'Couteau scandinave robuste. Favori des guides de chasse et survivalistes.',
    origin: '🇸🇪 Suède',
    price: 28,
    stats: {
      damage: 28, range: 1.0, fireRate: 65, accuracy: 100,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.09,
    },
    ammoType: 'none',
    emoji: '🗡️',
    modelKey: 'hunting_knife',
    legal_quebec: true,
    rarity: 'common',
    tags: ['survie', 'économique', 'bushcraft'],
  },

  {
    id: 'opinel_no8',
    name: 'Opinel No.8',
    brand: 'Opinel',
    category: 'melee',
    tier: 'legal',
    description: 'Couteau pliant français traditionnel depuis 1890. Manche hêtre, lame inox.',
    origin: '🇫🇷 France',
    price: 35,
    stats: {
      damage: 25, range: 0.9, fireRate: 55, accuracy: 100,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.1,
    },
    ammoType: 'none',
    emoji: '🪒',
    modelKey: 'folding_knife',
    legal_quebec: true,
    rarity: 'common',
    tags: ['pliant', 'classique', 'français'],
  },

  {
    id: 'leatherman_wave',
    name: 'Leatherman Wave+',
    brand: 'Leatherman',
    category: 'melee',
    tier: 'legal',
    description: 'Multi-outils 18-en-1. Couteau + pinces + tournevis + scie + lime.',
    origin: '🇺🇸 USA',
    price: 180,
    stats: {
      damage: 20, range: 0.8, fireRate: 40, accuracy: 95,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.25,
    },
    ammoType: 'none',
    emoji: '🛠️',
    modelKey: 'multitool',
    legal_quebec: true,
    rarity: 'common',
    tags: ['multi-outils', 'survie', 'utilitaire'],
  },

  {
    id: 'gerber_strongarm',
    name: 'Gerber StrongArm',
    brand: 'Gerber Gear',
    category: 'melee',
    tier: 'legal',
    description: "Couteau fixe 420HC 12 cm avec poignée ergonomique. Idéal survie et camping.",
    origin: '🇺🇸 USA',
    price: 95,
    stats: {
      damage: 32, range: 1.1, fireRate: 58, accuracy: 100,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.22,
    },
    ammoType: 'none',
    emoji: '🔪',
    modelKey: 'hunting_knife',
    legal_quebec: true,
    rarity: 'common',
    tags: ['survie', 'camping', 'militaire', 'fixe'],
  },

  // ── Gilets légaux ────────────────────────────────────────────

  {
    id: 'vest_iia',
    name: 'Gilet pare-balles Niveau IIA',
    category: 'armor',
    tier: 'legal',
    description: 'Protection contre 9 mm FMJ et .40 S&W. Discret sous les vêtements.',
    origin: '🇺🇸 USA',
    price: 480,
    stats: {
      damage: 0, range: 0, fireRate: 0, accuracy: 0,
      recoil: 0, reloadTime: 0, magCapacity: 25, weight: 2.5,
    },
    ammoType: 'armor',
    emoji: '🦺',
    modelKey: 'soft_vest',
    legal_quebec: true,
    rarity: 'common',
    tags: ['protection', 'discret', 'légal'],
  },

  {
    id: 'vest_iiia',
    name: 'Gilet pare-balles Niveau IIIA',
    category: 'armor',
    tier: 'legal',
    description: "Protection .357 SIG et .44 Magnum. Standard forces de l'ordre.",
    origin: '🇺🇸 USA',
    price: 850,
    stats: {
      damage: 0, range: 0, fireRate: 0, accuracy: 0,
      recoil: 0, reloadTime: 0, magCapacity: 50, weight: 3.8,
    },
    ammoType: 'armor',
    emoji: '🛡️',
    modelKey: 'soft_vest',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['protection', 'police', 'iiia'],
  },

  // ── Utilitaires légaux ───────────────────────────────────────

  {
    id: 'bear_spray',
    name: 'Spray anti-ours Counter Assault',
    brand: 'Counter Assault',
    category: 'utility',
    tier: 'legal',
    description: 'Capsicine haute concentration. Portée 9 m. Obligatoire en forêt boréale.',
    lore: "Vendu à la SAQ et Canadian Tire. Aucun chasseur de l'Outaouais s'en passe.",
    origin: '🇨🇦 Canada',
    price: 65,
    stats: {
      damage: 10, range: 9, fireRate: 10, accuracy: 80,
      recoil: 5, reloadTime: 0, magCapacity: 35, weight: 0.32,
    },
    ammoType: 'none',
    emoji: '🐻',
    modelKey: 'spray',
    legal_quebec: true,
    rarity: 'common',
    tags: ['non-létal', 'ours', 'forêt', 'survie'],
  },

  {
    id: 'flare_gun',
    name: 'Pistolet de détresse Orion',
    brand: 'Orion Safety',
    category: 'utility',
    tier: 'legal',
    description: 'Lance fusées de signalisation 12 ga. Obligatoire en embarcation au Québec.',
    origin: '🇺🇸 USA',
    price: 85,
    stats: {
      damage: 15, range: 100, fireRate: 0, accuracy: 50,
      recoil: 30, reloadTime: 5.0, magCapacity: 1, weight: 0.4,
    },
    ammoType: 'flare',
    emoji: '🎆',
    modelKey: 'flare_gun',
    legal_quebec: true,
    rarity: 'common',
    tags: ['signalisation', 'nautique', 'survie'],
  },

  {
    id: 'taser_x26',
    name: 'Taser X26P',
    brand: 'Axon',
    category: 'utility',
    tier: 'legal',
    description: "Pistolet à impulsions électriques 50 000 V. Neutralise sans blesser à 10 m.",
    origin: '🇺🇸 USA',
    price: 1100,
    requiresLicense: 'PAA',
    stats: {
      damage: 5, range: 10, fireRate: 0, accuracy: 72,
      recoil: 5, reloadTime: 8.0, magCapacity: 1, weight: 0.3,
    },
    ammoType: 'none',
    emoji: '⚡',
    modelKey: 'taser',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['non-létal', 'police', 'électrique', 'défense'],
  },

  // ════════════════════════════════════════════════════════════
  //  🟡 TIER 2 — RESTREINT (permis spécial requis)
  // ════════════════════════════════════════════════════════════

  {
    id: 'glock19_gen5',
    name: 'Glock 19 Gen 5',
    brand: 'Glock',
    category: 'pistol',
    tier: 'restricted',
    description: 'Pistolet semi-auto polymère 9 mm. Standard police dans 48 pays.',
    lore: "L'arme de service de la Sûreté du Québec et du SPVM.",
    origin: '🇦🇹 Autriche',
    price: 880,
    requiresLicense: 'PPA-R',
    stats: {
      damage: 45, range: 50, fireRate: 350, accuracy: 75,
      recoil: 35, reloadTime: 2.0, magCapacity: 15, weight: 0.6, armorPen: 18,
    },
    ammoType: '9mm',
    emoji: '🔫',
    modelKey: 'compact_pistol',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['police', 'fiable', '9mm', 'service'],
    availableAttachments: [
      { type: 'light',    name: 'Lampe tactique TLR-1', modifier: { accuracy: 5 },       price: 220 },
      { type: 'magazine', name: 'Chargeur 21 coups',     modifier: { magCapacity: 6 },    price: 65  },
      { type: 'suppressor', name: 'Silencieux AAC TiRant', modifier: { recoil: -5, accuracy: 6 }, price: 750 },
    ],
  },

  {
    id: 'sig_p226',
    name: 'SIG Sauer P226 Legion',
    brand: 'SIG Sauer',
    category: 'pistol',
    tier: 'restricted',
    description: 'Le pistolet des Navy SEALs et du BEI québécois. Métal, précis, infaillible.',
    lore: 'Choisi par le Bureau des enquêtes indépendantes du Québec.',
    origin: '🇨🇭 Suisse',
    price: 1450,
    requiresLicense: 'PPA-R',
    stats: {
      damage: 50, range: 58, fireRate: 320, accuracy: 88,
      recoil: 38, reloadTime: 2.2, magCapacity: 15, weight: 0.94, armorPen: 22,
    },
    ammoType: '9mm',
    emoji: '🎖️',
    modelKey: 'full_pistol',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['élite', 'précis', 'suisse', 'forces spéciales'],
    availableAttachments: [
      { type: 'suppressor', name: 'Silencieux SIG SRD9', modifier: { recoil: -5, accuracy: 8 }, price: 680 },
    ],
  },

  {
    id: 'colt_1911',
    name: 'Colt 1911-A1',
    brand: 'Colt',
    category: 'pistol',
    tier: 'restricted',
    description: "Pistolet légendaire .45 ACP. En service de 1911 à aujourd'hui. Icône américaine.",
    lore: 'Porté par des millions de soldats américains durant deux guerres mondiales.',
    origin: '🇺🇸 USA',
    price: 1200,
    requiresLicense: 'PPA-R',
    stats: {
      damage: 55, range: 45, fireRate: 280, accuracy: 78,
      recoil: 50, reloadTime: 2.5, magCapacity: 7, weight: 1.1, armorPen: 15,
    },
    ammoType: '.45',
    emoji: '⚔️',
    modelKey: 'full_pistol',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['classique', 'américain', '.45', 'icône'],
  },

  {
    id: 'walther_ppq',
    name: 'Walther PPQ M2',
    brand: 'Walther Arms',
    category: 'pistol',
    tier: 'restricted',
    description: 'Pistolet 9 mm allemand avec détente quickDefense primée. Ergonomie exceptionnelle.',
    origin: '🇩🇪 Allemagne',
    price: 1050,
    requiresLicense: 'PPA-R',
    stats: {
      damage: 47, range: 52, fireRate: 340, accuracy: 86,
      recoil: 30, reloadTime: 2.0, magCapacity: 15, weight: 0.72, armorPen: 19,
    },
    ammoType: '9mm',
    emoji: '🎯',
    modelKey: 'compact_pistol',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['allemand', 'ergonomique', 'précis', 'service'],
  },

  {
    id: 'beretta_92fs',
    name: 'Beretta 92FS',
    brand: 'Beretta',
    category: 'pistol',
    tier: 'restricted',
    description: "Pistolet 9 mm semi-auto, standard armée US de 1985 à 2017. Fiabilité prouvée.",
    lore: "Immortalisé par Die Hard et Robocop. Standard M9 de l'US Army pendant 32 ans.",
    origin: '🇮🇹 Italie',
    price: 980,
    requiresLicense: 'PPA-R',
    stats: {
      damage: 46, range: 55, fireRate: 330, accuracy: 82,
      recoil: 36, reloadTime: 2.1, magCapacity: 15, weight: 0.95, armorPen: 18,
    },
    ammoType: '9mm',
    emoji: '🎬',
    modelKey: 'full_pistol',
    legal_quebec: true,
    rarity: 'uncommon',
    tags: ['militaire', 'américain', 'icône', 'film'],
  },

  // ════════════════════════════════════════════════════════════
  //  🔴 TIER 3 — MARCHÉ NOIR
  // ════════════════════════════════════════════════════════════

  // ── Pistolets illégaux ───────────────────────────────────────

  {
    id: 'desert_eagle_50',
    name: 'Desert Eagle .50 AE',
    brand: 'Magnum Research / IMI',
    category: 'pistol',
    tier: 'blackmarket',
    description: 'Le pistolet le plus puissant en production série. Recul de mule, dégâts catastrophiques.',
    lore: 'Préféré des caïds et des films depuis Pulp Fiction.',
    origin: '🇮🇱 Israël',
    price: 0,
    blackMarketPrice: 4500,
    stats: {
      damage: 95, range: 70, fireRate: 200, accuracy: 68,
      recoil: 95, reloadTime: 2.8, magCapacity: 7, weight: 2.05, armorPen: 55,
    },
    ammoType: '.50AE',
    emoji: '🦅',
    modelKey: 'deagle',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['puissant', 'iconique', 'cartel', 'film'],
  },

  {
    id: 'fn_fiveseven',
    name: 'FN Five-seveN MK3',
    brand: 'FN Herstal',
    category: 'pistol',
    tier: 'blackmarket',
    description: 'Pistolet 5.7×28 mm à haute vélocité. Perfore les gilets de niveau IIIA.',
    lore: 'Surnommé "cop killer" pour sa capacité à transpercer les gilets pare-balles.',
    origin: '🇧🇪 Belgique',
    price: 0,
    blackMarketPrice: 3800,
    stats: {
      damage: 52, range: 80, fireRate: 380, accuracy: 88,
      recoil: 22, reloadTime: 1.9, magCapacity: 20, weight: 0.61, armorPen: 90,
    },
    ammoType: '5.7x28',
    emoji: '🐍',
    modelKey: 'compact_pistol',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['perforant', 'rare', 'anti-gilet', 'belge'],
  },

  {
    id: 'makarov_pm',
    name: 'Makarov PM',
    brand: 'Izhmekh',
    category: 'pistol',
    tier: 'blackmarket',
    description: 'Pistolet soviétique 9×18 mm. Simple, robuste, introuvable au Canada légalement.',
    lore: "L'arme de poing standard du KGB et des polices est-européennes jusqu'en 1990.",
    origin: '🇷🇺 Russie',
    price: 0,
    blackMarketPrice: 1200,
    stats: {
      damage: 38, range: 38, fireRate: 300, accuracy: 62,
      recoil: 28, reloadTime: 2.5, magCapacity: 8, weight: 0.73, armorPen: 10,
    },
    ammoType: '9x18',
    emoji: '⭐',
    modelKey: 'compact_pistol',
    legal_quebec: false,
    rarity: 'uncommon',
    tags: ['soviétique', 'mafia est-européenne', 'compact', 'abordable'],
  },

  {
    id: 'beretta_93r',
    name: 'Beretta 93R',
    brand: 'Beretta',
    category: 'pistol',
    tier: 'blackmarket',
    description: 'Pistolet italien à rafales de 3 coups. Version de la 92FS en mode automatique.',
    lore: 'Développé pour le contre-terrorisme dans les années 1970. Très rare au marché noir.',
    origin: '🇮🇹 Italie',
    price: 0,
    blackMarketPrice: 5200,
    stats: {
      damage: 46, range: 55, fireRate: 1100, accuracy: 70,
      recoil: 55, reloadTime: 2.2, magCapacity: 20, weight: 1.12, armorPen: 22,
    },
    ammoType: '9mm',
    emoji: '🇮🇹',
    modelKey: 'full_pistol',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['rafale', '3 coups', 'italien', 'anti-terroriste'],
  },

  {
    id: 'tokarev_tt33',
    name: 'Tokarev TT-33',
    brand: 'Tula Arsenal',
    category: 'pistol',
    tier: 'blackmarket',
    description: "Pistolet soviétique 7.62×25 mm ultra pénétrant. Traverse les gilets légers.",
    lore: "Produit à 1,7 million d'exemplaires. Encore très répandu dans les réseaux criminels est-européens.",
    origin: '🇷🇺 Russie',
    price: 0,
    blackMarketPrice: 1600,
    stats: {
      damage: 42, range: 45, fireRate: 290, accuracy: 68,
      recoil: 38, reloadTime: 2.3, magCapacity: 8, weight: 0.85, armorPen: 55,
    },
    ammoType: '9x18',
    emoji: '⭐',
    modelKey: 'compact_pistol',
    legal_quebec: false,
    rarity: 'uncommon',
    tags: ['soviétique', 'pénétrant', 'abordable', 'est-européen'],
  },

  // ── Pistolets-mitrailleurs ───────────────────────────────────

  {
    id: 'mini_uzi',
    name: 'IMI Mini Uzi',
    brand: 'Israel Military Industries',
    category: 'smg',
    tier: 'blackmarket',
    description: 'Mini-mitraillette israélienne 9 mm. Compacte, full-auto, iconique.',
    lore: "Arme de prédilection des gardes du corps et des cartels latino-américains.",
    origin: '🇮🇱 Israël',
    price: 0,
    blackMarketPrice: 6500,
    stats: {
      damage: 42, range: 80, fireRate: 950, accuracy: 58,
      recoil: 58, reloadTime: 3.0, magCapacity: 32, weight: 2.7, armorPen: 20,
    },
    ammoType: '9mm',
    emoji: '⚡',
    modelKey: 'compact_smg',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['compact', 'rapide', 'israélien', 'gardes du corps'],
  },

  {
    id: 'hk_mp5a3',
    name: 'H&K MP5A3',
    brand: 'Heckler & Koch',
    category: 'smg',
    tier: 'blackmarket',
    description: 'Le PM le plus utilisé par les forces spéciales mondiales. Précision chirurgicale.',
    lore: "Utilisé lors de l'opération Nimrod (Iran 1980, SAS britannique).",
    origin: '🇩🇪 Allemagne',
    price: 0,
    blackMarketPrice: 8200,
    stats: {
      damage: 45, range: 100, fireRate: 800, accuracy: 82,
      recoil: 33, reloadTime: 2.8, magCapacity: 30, weight: 2.54, armorPen: 22,
    },
    ammoType: '9mm',
    emoji: '🎖️',
    modelKey: 'full_smg',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['SWAT', 'précis', 'forces spéciales', 'allemand'],
  },

  {
    id: 'mac10_ingram',
    name: 'Ingram MAC-10',
    brand: 'Military Armament Corp.',
    category: 'smg',
    tier: 'blackmarket',
    description: 'PM .45 full-auto ultra rapide. Peu précis mais intimidant.',
    lore: "Symbole du gang des années 80-90 à Los Angeles. Encore présent au Canada illégalement.",
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 4200,
    stats: {
      damage: 40, range: 55, fireRate: 1100, accuracy: 42,
      recoil: 78, reloadTime: 2.5, magCapacity: 30, weight: 2.84, armorPen: 14,
    },
    ammoType: '.45',
    emoji: '🎤',
    modelKey: 'compact_smg',
    legal_quebec: false,
    rarity: 'uncommon',
    tags: ['gangster', 'spray', 'américain', '80s'],
  },

  {
    id: 'skorpion_vz61',
    name: 'Škorpion vz. 61',
    brand: 'Česká Zbrojovka',
    category: 'smg',
    tier: 'blackmarket',
    description: 'PM tchécoslovaque ultra compact. Légendaire en Europe de l\'Est.',
    lore: 'Arme favorite des terroristes européens des années 70-80. Encore circulante.',
    origin: '🇨🇿 Tchéquie',
    price: 0,
    blackMarketPrice: 3500,
    stats: {
      damage: 30, range: 45, fireRate: 840, accuracy: 55,
      recoil: 40, reloadTime: 2.2, magCapacity: 20, weight: 1.28, armorPen: 8,
    },
    ammoType: '9mm',
    emoji: '🦂',
    modelKey: 'compact_smg',
    legal_quebec: false,
    rarity: 'uncommon',
    tags: ['compact', 'est-européen', 'dissimulable'],
  },

  {
    id: 'pp2000',
    name: 'KBP PP-2000',
    brand: 'KBP Instrument Design Bureau',
    category: 'smg',
    tier: 'blackmarket',
    description: 'PM russe moderne 9×19 mm. Compact, intègre son propre chargeur comme crosse.',
    lore: "Développé pour le FSB et les forces spéciales russes post-2000. Rare en dehors de Russie.",
    origin: '🇷🇺 Russie',
    price: 0,
    blackMarketPrice: 5800,
    stats: {
      damage: 43, range: 75, fireRate: 900, accuracy: 68,
      recoil: 38, reloadTime: 2.4, magCapacity: 44, weight: 1.4, armorPen: 25,
    },
    ammoType: '9mm',
    emoji: '🔱',
    modelKey: 'compact_smg',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['russe', 'FSB', 'compact', 'moderne'],
  },

  // ── Fusils d'assaut ──────────────────────────────────────────

  {
    id: 'ak47_kalashnikov',
    name: 'AK-47 Kalashnikov',
    brand: 'Kalashnikov Concern',
    category: 'assault_rifle',
    tier: 'blackmarket',
    description: "Fusil d'assaut le plus produit de l'histoire. 100 millions d'exemplaires dans 106 pays.",
    lore: "Conçu par Mikhail Kalashnikov en 1947. L'arme des révolutions, conflits et du crime organisé mondial.",
    origin: '🇷🇺 Russie',
    price: 0,
    blackMarketPrice: 7500,
    stats: {
      damage: 65, range: 350, fireRate: 600, accuracy: 68,
      recoil: 62, reloadTime: 3.0, magCapacity: 30, weight: 4.3, armorPen: 60,
    },
    ammoType: '7.62x39',
    emoji: '⚒️',
    modelKey: 'ak47',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['iconique', 'fiable', 'révolution', 'cartel'],
  },

  {
    id: 'aks74u_krinkov',
    name: 'AKS-74U "Krinkov"',
    brand: 'Kalashnikov Concern',
    category: 'assault_rifle',
    tier: 'blackmarket',
    description: 'Version ultra-compacte de l\'AK-74 avec crosse pliante. Parfait pour opérations urbaines.',
    lore: "Surnommé \"Krinkov\" par les moudjahidines afghans. Présent dans chaque conflit depuis 1979.",
    origin: '🇷🇺 Russie',
    price: 0,
    blackMarketPrice: 6800,
    stats: {
      damage: 55, range: 200, fireRate: 650, accuracy: 62,
      recoil: 72, reloadTime: 3.0, magCapacity: 30, weight: 2.7, armorPen: 65,
    },
    ammoType: '5.45x39',
    emoji: '🔱',
    modelKey: 'ak74u',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['compact', 'urbain', 'krinkov', 'afghan'],
  },

  {
    id: 'colt_m4a1',
    name: 'Colt M4A1 SOPMOD',
    brand: 'Colt Defense',
    category: 'assault_rifle',
    tier: 'blackmarket',
    description: 'Le fusil des forces spéciales US. Configuration SOPMOD avec rails Picatinny.',
    lore: 'Standard des Navy SEALs, Delta Force et Rangers. Sa présence au marché noir indique une fuite de stocks militaires.',
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 9500,
    stats: {
      damage: 58, range: 400, fireRate: 750, accuracy: 85,
      recoil: 38, reloadTime: 2.5, magCapacity: 30, weight: 3.5, armorPen: 70,
    },
    ammoType: '5.56x45',
    emoji: '🇺🇸',
    modelKey: 'm4a1',
    legal_quebec: false,
    rarity: 'epic',
    tags: ['militaire', 'modulaire', 'forces spéciales', 'SOPMOD'],
    availableAttachments: [
      { type: 'scope',      name: 'ACOG 4×32',                         modifier: { accuracy: 15, range: 100 },  price: 900  },
      { type: 'suppressor', name: "Suppresseur Knight's Armament",      modifier: { recoil: -8, accuracy: 10 }, price: 1200 },
      { type: 'grip',       name: 'Poignée verticale AFG',              modifier: { recoil: -10, accuracy: 8 }, price: 85   },
      { type: 'light',      name: 'Lampe PEQ-15',                       modifier: { accuracy: 5 },              price: 480  },
    ],
  },

  {
    id: 'fn_scar_h',
    name: 'FN SCAR-H MK17',
    brand: 'FN Herstal',
    category: 'assault_rifle',
    tier: 'blackmarket',
    description: 'Fusil de combat 7.62 mm des forces spéciales US SOCOM. Puissant et précis.',
    lore: "Développé spécifiquement pour l'USSOCOM post-11 septembre. Très rare sur le marché noir.",
    origin: '🇧🇪 Belgique',
    price: 0,
    blackMarketPrice: 11500,
    stats: {
      damage: 72, range: 500, fireRate: 600, accuracy: 88,
      recoil: 55, reloadTime: 2.8, magCapacity: 20, weight: 3.6, armorPen: 75,
    },
    ammoType: '7.62x51',
    emoji: '⚔️',
    modelKey: 'scar',
    legal_quebec: false,
    rarity: 'epic',
    tags: ['forces spéciales', 'SOCOM', 'puissant', 'belge'],
  },

  {
    id: 'hk_g36c',
    name: 'H&K G36C',
    brand: 'Heckler & Koch',
    category: 'assault_rifle',
    tier: 'blackmarket',
    description: 'Carabine compacte polymère allemande 5.56 mm. Utilisée par le GIGN français.',
    origin: '🇩🇪 Allemagne',
    price: 0,
    blackMarketPrice: 8800,
    stats: {
      damage: 55, range: 300, fireRate: 750, accuracy: 78,
      recoil: 42, reloadTime: 2.7, magCapacity: 30, weight: 2.82, armorPen: 68,
    },
    ammoType: '5.56x45',
    emoji: '🦅',
    modelKey: 'g36c',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['compact', 'GIGN', 'polymère', 'tactique'],
  },

  {
    id: 'steyr_aug',
    name: 'Steyr AUG A3',
    brand: 'Steyr Mannlicher',
    category: 'assault_rifle',
    tier: 'blackmarket',
    description: 'Fusil bullpup autrichien 5.56 mm avec lunette intégrée. Chargeur translucide.',
    lore: "L'arme nationale de l'armée autrichienne. Son design futuriste date de 1977.",
    origin: '🇦🇹 Autriche',
    price: 0,
    blackMarketPrice: 9200,
    stats: {
      damage: 57, range: 380, fireRate: 680, accuracy: 84,
      recoil: 40, reloadTime: 2.6, magCapacity: 30, weight: 3.6, armorPen: 66,
    },
    ammoType: '5.56x45',
    emoji: '🔭',
    modelKey: 'aug',
    legal_quebec: false,
    rarity: 'epic',
    tags: ['bullpup', 'autrichien', 'lunette intégrée', 'futuriste'],
  },

  // ── Shotguns illégaux ────────────────────────────────────────

  {
    id: 'spas12',
    name: 'Franchi SPAS-12',
    brand: 'Luigi Franchi',
    category: 'shotgun',
    tier: 'blackmarket',
    description: 'Fusil de combat 12 ga pompe/semi-auto. Interdit dans plusieurs pays.',
    lore: 'Rendu célèbre par Terminator et Jurassic Park. Interdit au Canada.',
    origin: '🇮🇹 Italie',
    price: 0,
    blackMarketPrice: 5500,
    stats: {
      damage: 92, range: 52, fireRate: 80, accuracy: 65,
      recoil: 75, reloadTime: 4.0, magCapacity: 8, weight: 4.4, armorPen: 18,
    },
    ammoType: '12ga',
    emoji: '💀',
    modelKey: 'combat_shotgun',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['tactique', 'iconique', 'film', 'combat'],
  },

  {
    id: 'saiga12',
    name: 'Saiga-12',
    brand: 'Izhmash',
    category: 'shotgun',
    tier: 'blackmarket',
    description: 'Shotgun semi-auto russe basé sur l\'AK. Chargeur boîte 10 cartouches.',
    lore: 'Populaire dans les forces russes et les milices. Se retrouve au Canada via les réseaux est-européens.',
    origin: '🇷🇺 Russie',
    price: 0,
    blackMarketPrice: 4800,
    stats: {
      damage: 90, range: 48, fireRate: 120, accuracy: 62,
      recoil: 70, reloadTime: 3.2, magCapacity: 10, weight: 3.8, armorPen: 15,
    },
    ammoType: '12ga',
    emoji: '🐻',
    modelKey: 'semi_shotgun',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['russe', 'chargeur', 'AK-style', 'semi-auto'],
  },

  // ── Fusils de précision illégaux ─────────────────────────────

  {
    id: 'dragunov_svd',
    name: 'Dragunov SVD',
    brand: 'Izhmash',
    category: 'sniper',
    tier: 'blackmarket',
    description: 'Fusil de précision semi-auto soviétique 7.62×54 mmR. 10 coups, lunette PSO-1.',
    lore: "Arme des tireurs d'élite soviétiques et russes depuis 1963.",
    origin: '🇷🇺 Russie',
    price: 0,
    blackMarketPrice: 12000,
    stats: {
      damage: 90, range: 800, fireRate: 30, accuracy: 95,
      recoil: 72, reloadTime: 3.5, magCapacity: 10, weight: 4.3, armorPen: 70,
    },
    ammoType: '7.62x54',
    emoji: '🎯',
    modelKey: 'dragunov',
    legal_quebec: false,
    rarity: 'epic',
    tags: ['sniper', 'soviétique', 'précision', 'longue portée'],
  },

  {
    id: 'psg1',
    name: 'H&K PSG-1',
    brand: 'Heckler & Koch',
    category: 'sniper',
    tier: 'blackmarket',
    description: 'Le fusil de précision semi-auto le plus cher jamais produit. Groupement sub-MOA garanti.',
    lore: "Développé après le drame des Jeux Olympiques de Munich 1972. Commandé par 50 pays.",
    origin: '🇩🇪 Allemagne',
    price: 0,
    blackMarketPrice: 18000,
    stats: {
      damage: 88, range: 900, fireRate: 25, accuracy: 99,
      recoil: 65, reloadTime: 3.8, magCapacity: 5, weight: 8.1, armorPen: 68,
    },
    ammoType: '7.62x51',
    emoji: '🔭',
    modelKey: 'bolt_sniper',
    legal_quebec: false,
    rarity: 'epic',
    tags: ['précision absolue', 'police', 'contre-terrorisme', 'allemand'],
  },

  {
    id: 'cheytac_m200',
    name: 'CheyTac M200 Intervention',
    brand: 'CheyTac LLC',
    category: 'sniper',
    tier: 'blackmarket',
    description: 'Fusil de précision extrême-longue portée. Record mondial de tir à 2530 m.',
    lore: 'Présenté dans le film Shooter. Utilisé par quelques unités d\'élite.',
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 28000,
    stats: {
      damage: 130, range: 2500, fireRate: 0, accuracy: 99,
      recoil: 88, reloadTime: 4.5, magCapacity: 7, weight: 12.3, armorPen: 95,
    },
    ammoType: '7.62x51',
    emoji: '☄️',
    modelKey: 'bolt_sniper',
    legal_quebec: false,
    rarity: 'legendary',
    tags: ['ultra longue portée', 'intervention', 'record', 'légendaire'],
  },

  // ── Armes blanches illégales ─────────────────────────────────

  {
    id: 'butterfly_knife',
    name: 'Couteau Balisong (Papillon)',
    category: 'melee',
    tier: 'blackmarket',
    description: 'Couteau pliant philippin à deux manches contra-rotatifs. Interdit au Canada.',
    lore: 'Utilisé dans les ruelles de Manille depuis le 19ème siècle.',
    origin: '🇵🇭 Philippines',
    price: 0,
    blackMarketPrice: 350,
    stats: {
      damage: 40, range: 1.0, fireRate: 80, accuracy: 95,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.15,
    },
    ammoType: 'none',
    emoji: '🦋',
    modelKey: 'butterfly_knife',
    legal_quebec: false,
    rarity: 'uncommon',
    tags: ['interdit', 'style', 'tricks', 'philippin'],
  },

  {
    id: 'switchblade_otf',
    name: 'Couteau OTF automatique',
    category: 'melee',
    tier: 'blackmarket',
    description: 'Lame qui sort automatiquement par le bout (Out-The-Front). Interdit au Canada.',
    origin: '🇮🇹 Italie',
    price: 0,
    blackMarketPrice: 280,
    stats: {
      damage: 38, range: 0.9, fireRate: 75, accuracy: 95,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.12,
    },
    ammoType: 'none',
    emoji: '⚡',
    modelKey: 'folding_knife',
    legal_quebec: false,
    rarity: 'common',
    tags: ['automatique', 'interdit', 'rapide', 'OTF'],
  },

  {
    id: 'machete_militaire',
    name: 'Machette militaire 18"',
    category: 'melee',
    tier: 'blackmarket',
    description: 'Machette 45 cm lame carbone. Entre jungle warfare et intimidation urbaine.',
    origin: '🇨🇴 Colombie',
    price: 0,
    blackMarketPrice: 180,
    stats: {
      damage: 60, range: 1.5, fireRate: 35, accuracy: 88,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.82,
    },
    ammoType: 'none',
    emoji: '🗡️',
    modelKey: 'machete',
    legal_quebec: false,
    rarity: 'common',
    tags: ['tranchant', 'intimidant', 'colombien'],
  },

  {
    id: 'kama_sickle',
    name: 'Kama de combat',
    category: 'melee',
    tier: 'blackmarket',
    description: "Faucille okinawaïenne traditionnelle adaptée au combat rapproché.",
    lore: "Arme des arts martiaux okinawaïens (kobudo). Importée et vendue illégalement comme arme de combat.",
    origin: '🇯🇵 Japon',
    price: 0,
    blackMarketPrice: 220,
    stats: {
      damage: 55, range: 1.3, fireRate: 45, accuracy: 85,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 0.35,
    },
    ammoType: 'none',
    emoji: '☪️',
    modelKey: 'kama',
    legal_quebec: false,
    rarity: 'uncommon',
    tags: ['arts martiaux', 'okinawa', 'exotique'],
  },

  // ── Explosifs ────────────────────────────────────────────────

  {
    id: 'cocktail_molotov',
    name: 'Cocktail Molotov',
    category: 'throwable',
    tier: 'blackmarket',
    description: 'Bouteille incendiaire. Brûle la zone d\'impact 12 secondes.',
    lore: 'Nommé ainsi par les soldats finlandais contre les chars soviétiques en 1939-1940.',
    origin: '🇫🇮 Finlande',
    price: 0,
    blackMarketPrice: 150,
    stats: {
      damage: 75, range: 25, fireRate: 0, accuracy: 60,
      recoil: 0, reloadTime: 0, magCapacity: 1, weight: 0.7, blastRadius: 4,
    },
    ammoType: 'fire',
    emoji: '🔥',
    modelKey: 'molotov',
    legal_quebec: false,
    rarity: 'common',
    tags: ['feu', 'émeute', 'zone', 'incendiaire'],
  },

  {
    id: 'smoke_grenade_m18',
    name: 'Grenade fumigène M18',
    category: 'throwable',
    tier: 'blackmarket',
    description: 'Crée un écran de fumée dense 8 m × 5 m pendant 30 secondes.',
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 250,
    stats: {
      damage: 0, range: 20, fireRate: 0, accuracy: 78,
      recoil: 0, reloadTime: 0, magCapacity: 1, weight: 0.52, blastRadius: 8,
    },
    ammoType: 'smoke',
    emoji: '💨',
    modelKey: 'smoke_grenade',
    legal_quebec: false,
    rarity: 'uncommon',
    tags: ['tactique', 'fuite', 'couverture', 'fumée'],
  },

  {
    id: 'stun_grenade_m84',
    name: 'Grenade aveuglante M84',
    category: 'throwable',
    tier: 'blackmarket',
    description: '170 dB + 8 millions de candelas. Désoriente toute personne dans 5 m pendant 5 secondes.',
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 400,
    stats: {
      damage: 5, range: 15, fireRate: 0, accuracy: 75,
      recoil: 0, reloadTime: 0, magCapacity: 1, weight: 0.31, blastRadius: 5,
    },
    ammoType: 'flash',
    emoji: '⚡',
    modelKey: 'flashbang',
    legal_quebec: false,
    rarity: 'uncommon',
    tags: ['SWAT', 'non-létal', 'aveuglant', 'tactique'],
  },

  {
    id: 'pipe_bomb',
    name: 'Bombe artisanale (pipe bomb)',
    category: 'throwable',
    tier: 'blackmarket',
    description: 'Engin explosif improvié en tuyau galvanisé et poudre noire. Imprévisible et dangereux pour le porteur.',
    lore: "Fabriquée avec des matériaux de quincaillerie. Arme des désespérés et des amateurs.",
    origin: '🇨🇦 Canada',
    price: 0,
    blackMarketPrice: 80,
    stats: {
      damage: 60, range: 10, fireRate: 0, accuracy: 40,
      recoil: 0, reloadTime: 0, magCapacity: 1, weight: 0.9, blastRadius: 6,
    },
    ammoType: 'frag',
    emoji: '💥',
    modelKey: 'pipe_bomb',
    legal_quebec: false,
    rarity: 'common',
    tags: ['artisanal', 'dangereux', 'imprévisible', 'zone'],
  },

  // ── Protections illégales ────────────────────────────────────

  {
    id: 'vest_iv_plates',
    name: 'Gilet Niveau IV Plaques Céramique',
    category: 'armor',
    tier: 'blackmarket',
    description: 'Plaques céramique alumine. Arrête les projectiles perforants M2 AP. 10 kg.',
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 3500,
    stats: {
      damage: 0, range: 0, fireRate: 0, accuracy: 0,
      recoil: 0, reloadTime: 0, magCapacity: 100, weight: 10,
    },
    ammoType: 'armor',
    emoji: '⛓️',
    modelKey: 'plate_carrier',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['militaire', 'plaques', 'lourd', 'protection totale'],
  },

  {
    id: 'fast_helmet',
    name: 'Casque FAST Maritime',
    category: 'armor',
    tier: 'blackmarket',
    description: 'Casque Kevlar avec rail NVG, passants ARC, protection IIIA tête.',
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 1800,
    stats: {
      damage: 0, range: 0, fireRate: 0, accuracy: 0,
      recoil: 0, reloadTime: 0, magCapacity: 30, weight: 1.5,
    },
    ammoType: 'armor',
    emoji: '⛑️',
    modelKey: 'tactical_helmet',
    legal_quebec: false,
    rarity: 'rare',
    tags: ['SWAT', 'Naval', 'NVG', 'Kevlar'],
  },

  // ════════════════════════════════════════════════════════════
  //  ☠️ TIER 4 — ADMIN UNIQUEMENT
  // ════════════════════════════════════════════════════════════

  {
    id: 'barrett_m82',
    name: 'Barrett M82A1 .50 BMG',
    brand: 'Barrett Firearms',
    category: 'sniper',
    tier: 'admin_only',
    description: 'Fusil anti-matériel .50 BMG. Détruit véhicules légèrement blindés. 2 km de portée.',
    lore: 'Utilisé par les snipers US en Iraq et Afghanistan pour neutraliser équipements à distance.',
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 50000,
    stats: {
      damage: 200, range: 2000, fireRate: 0, accuracy: 100,
      recoil: 98, reloadTime: 5.0, magCapacity: 10, weight: 14.0, armorPen: 100, blastRadius: 2,
    },
    ammoType: '.50BMG',
    emoji: '☠️',
    modelKey: 'barrett',
    legal_quebec: false,
    rarity: 'legendary',
    tags: ['admin', 'anti-matériel', 'véhicule', 'légendaire'],
  },

  {
    id: 'aa12_auto',
    name: 'AA-12 Atchisson Auto Assault',
    brand: 'Military Police Systems',
    category: 'shotgun',
    tier: 'admin_only',
    description: 'Le seul shotgun full-auto de combat en série. 300 cp/min en 12 ga. Apocalyptique.',
    lore: "Arme de guerre conçue pour maximiser la suppression. Aucune version civile n'existe légalement.",
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 25000,
    stats: {
      damage: 95, range: 60, fireRate: 300, accuracy: 58,
      recoil: 68, reloadTime: 5.0, magCapacity: 20, weight: 4.8, armorPen: 20,
    },
    ammoType: '12ga',
    emoji: '🚨',
    modelKey: 'aa12',
    legal_quebec: false,
    rarity: 'legendary',
    tags: ['admin', 'full-auto', 'guerre', 'apocalyptique'],
  },

  {
    id: 'katana_tamahagane',
    name: 'Katana Tamahagane',
    category: 'melee',
    tier: 'admin_only',
    description: "Katana forgé à la main en acier tamahagane. 400 ans d'art samouraï.",
    lore: 'Pièce de collection forgée par le maître Yoshindo Yoshihara, Tokyo. Valeur réelle : 35 000 $.',
    origin: '🇯🇵 Japon',
    price: 0,
    blackMarketPrice: 8500,
    stats: {
      damage: 85, range: 2.0, fireRate: 28, accuracy: 92,
      recoil: 0, reloadTime: 0, magCapacity: 0, weight: 1.22,
    },
    ammoType: 'none',
    emoji: '⚔️',
    modelKey: 'katana',
    legal_quebec: false,
    rarity: 'legendary',
    tags: ['admin', 'samouraï', 'art', 'légendaire', 'collection'],
  },

  {
    id: 'frag_grenade_m67',
    name: 'Grenade à fragmentation M67',
    category: 'throwable',
    tier: 'admin_only',
    description: 'Grenade militaire à 6 500 fragments. Zone létale 5 m, zone dangereuse 15 m.',
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 1500,
    stats: {
      damage: 100, range: 15, fireRate: 0, accuracy: 68,
      recoil: 0, reloadTime: 0, magCapacity: 1, weight: 0.4, armorPen: 40, blastRadius: 15,
    },
    ammoType: 'frag',
    emoji: '💣',
    modelKey: 'frag_grenade',
    legal_quebec: false,
    rarity: 'legendary',
    tags: ['admin', 'militaire', 'fragmentation', 'guerre'],
  },

  {
    id: 'minigun_m134',
    name: 'M134 Minigun',
    brand: 'General Electric',
    category: 'assault_rifle',
    tier: 'admin_only',
    description: 'Mitrailleuse rotative Gatling 7.62 mm. 6 000 coups/minute. Arme montée sur hélicoptère.',
    lore: "Rendu célèbre par Terminator 2 et Predator. Pèse 19 kg sans munitions. Strictement militaire.",
    origin: '🇺🇸 USA',
    price: 0,
    blackMarketPrice: 150000,
    stats: {
      damage: 80, range: 1000, fireRate: 6000, accuracy: 75,
      recoil: 100, reloadTime: 8.0, magCapacity: 4000, weight: 19.0, armorPen: 80,
    },
    ammoType: '7.62x51',
    emoji: '🌀',
    modelKey: 'minigun',
    legal_quebec: false,
    rarity: 'legendary',
    tags: ['admin', 'gatling', 'hélicoptère', 'apocalyptique', 'suppression'],
  },

] as const

// ═══════════════════════════════════════════════════════════════
//  HELPERS — fonctions de filtrage typées
// ═══════════════════════════════════════════════════════════════

export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS_CATALOG.find((w) => w.id === id)
}

export function getWeaponsByTier(tier: WeaponTier): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.tier === tier)
}

export function getWeaponsByCategory(category: WeaponCategory): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.category === category)
}

export function getWeaponsByRarity(rarity: WeaponRarity): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.rarity === rarity)
}

export function getLegalWeapons(): Weapon[] {
  return WEAPONS_CATALOG.filter(
    (w) => w.tier === 'legal' || w.tier === 'restricted'
  )
}

export function getShopWeapons(): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.tier === 'legal')
}

export function getRestrictedWeapons(): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.tier === 'restricted')
}

export function getBlackMarketWeapons(): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.tier === 'blackmarket')
}

export function getAdminWeapons(): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.tier === 'admin_only')
}

export function searchWeapons(query: string): Weapon[] {
  const q = query.toLowerCase().trim()
  if (!q) return [...WEAPONS_CATALOG]
  return WEAPONS_CATALOG.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q) ||
      w.tags.some((t) => t.toLowerCase().includes(q)) ||
      w.brand?.toLowerCase().includes(q) ||
      w.origin.toLowerCase().includes(q)
  )
}

export function getWeaponTotalPrice(
  weapon: Weapon,
  attachments: WeaponAttachment[] = []
): number {
  const basePrice = weapon.tier === 'blackmarket' || weapon.tier === 'admin_only'
    ? (weapon.blackMarketPrice ?? 0)
    : weapon.price
  const attachmentTotal = attachments.reduce((sum, a) => sum + a.price, 0)
  return basePrice + attachmentTotal
}

export function applyAttachments(
  baseStats: WeaponStats,
  attachments: WeaponAttachment[]
): WeaponStats {
  return attachments.reduce<WeaponStats>(
    (stats, attachment) => {
      const result = { ...stats }
      for (const [key, value] of Object.entries(attachment.modifier)) {
        if (value !== undefined && key in result) {
          (result as Record<string, number>)[key] =
            ((result as Record<string, number>)[key] ?? 0) + value
        }
      }
      return result
    },
    { ...baseStats }
  )
}

/** Retourne les armes triées par dommage décroissant */
export function getWeaponsByDamage(): Weapon[] {
  return [...WEAPONS_CATALOG].sort((a, b) => b.stats.damage - a.stats.damage)
}

/** Retourne les armes dans une fourchette de prix */
export function getWeaponsByPriceRange(
  min: number,
  max: number,
  useBlackMarket = false
): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => {
    const price = useBlackMarket
      ? (w.blackMarketPrice ?? w.price)
      : w.price
    return price >= min && price <= max
  })
}