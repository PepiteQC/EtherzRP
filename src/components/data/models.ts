/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MODELS.TS — 770+ Modèles 3D EtherWorld
 *
 * Source originale: C:\etherworldQC\src\models.ts (fusionné ici)
 * Référencé par: world-complete-index.ts
 *
 * Chaque export est un identifiant de modèle utilisé par :
 *  - Le Builder Mode (placement d'objets)
 *  - Le CityRenderer (rendu ville)
 *  - Les configs de bâtiments
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─── STRUCTURES — Murs ────────────────────────────────────────────────────────
export const w1 = 'w1'        // Mur simple 1x1
export const w2 = 'w2'        // Mur simple 2x1
export const w3 = 'w3'        // Mur simple 3x1
export const w4 = 'w4'        // Mur simple 4x1
export const w5 = 'w5'        // Mur simple 5x1
export const w6 = 'w6'        // Mur simple 6x1
export const w7 = 'w7'        // Mur simple 7x1
export const w8 = 'w8'        // Mur simple 8x1
export const wb1 = 'wb1'      // Mur avec fenêtre basse 1x1
export const wb2 = 'wb2'      // Mur avec fenêtre basse 2x1
export const wb3 = 'wb3'      // Mur avec fenêtre basse 3x1
export const wb4 = 'wb4'      // Mur avec fenêtre basse 4x1
export const wb5 = 'wb5'      // Mur avec fenêtre basse 5x1
export const wb6 = 'wb6'      // Mur avec fenêtre basse 6x1
export const wb7 = 'wb7'      // Mur avec fenêtre basse 7x1
export const wb8 = 'wb8'      // Mur avec fenêtre basse 8x1
export const wg1 = 'wg1'      // Mur avec fenêtre grande 1x1
export const wg2 = 'wg2'      // Mur avec fenêtre grande 2x1
export const wg3 = 'wg3'      // Mur avec fenêtre grande 3x1
export const wg4 = 'wg4'      // Mur avec fenêtre grande 4x1
export const wg5 = 'wg5'      // Mur avec fenêtre grande 5x1
export const wg6 = 'wg6'      // Mur avec fenêtre grande 6x1
export const wg7 = 'wg7'      // Mur avec fenêtre grande 7x1
export const wg8 = 'wg8'      // Mur avec fenêtre grande 8x1
export const wd3 = 'wd3'      // Mur avec porte 3x1
export const wd4 = 'wd4'      // Mur avec porte 4x1
export const ww3 = 'ww3'      // Mur avec fenêtre 3x1
export const ww4 = 'ww4'      // Mur avec fenêtre 4x1
export const wt3 = 'wt3'      // Mur transparent 3x1
export const wh2 = 'wh2'      // Demi-mur 2x1
export const corner = 'corner' // Coin de mur

// ─── STRUCTURES — Planchers ───────────────────────────────────────────────────
export const ft = 'ft'          // Plancher bois
export const fw = 'fw'          // Plancher bois 2
export const fc = 'fc'          // Plancher béton
export const fmar = 'fmar'      // Plancher marbre
export const fgrass = 'fgrass'  // Plancher herbe / gazon
export const f2x2 = 'f2x2'     // Plancher 2x2
export const f4x4 = 'f4x4'     // Plancher 4x4
export const f6x6 = 'f6x6'     // Plancher 6x6
export const f8x8 = 'f8x8'     // Plancher 8x8
export const fcar2 = 'fcar2'   // Plancher carrelage 2x2
export const fcar4 = 'fcar4'   // Plancher carrelage 4x4
export const fcar6 = 'fcar6'   // Plancher carrelage 6x6
export const fcar8 = 'fcar8'   // Plancher carrelage 8x8

// ─── STRUCTURES — Escaliers ───────────────────────────────────────────────────
export const st = 'st'      // Escalier droit
export const stw = 'stw'    // Escalier large
export const stp = 'stp'    // Escalier palier
export const stsp = 'stsp'  // Escalier spiral

// ─── STRUCTURES — Toits ───────────────────────────────────────────────────────
export const rflat = 'rflat'    // Toit plat
export const rpitch = 'rpitch'  // Toit en pente
export const rgar = 'rgar'      // Toit garage

// ─── STRUCTURES — Portes ──────────────────────────────────────────────────────
export const dwood = 'dwood'      // Porte bois
export const dglass = 'dglass'    // Porte vitrée
export const ddouble = 'ddouble'  // Double porte
export const dgar = 'dgar'        // Porte garage

// ─── STRUCTURES — Fenêtres ────────────────────────────────────────────────────
export const wins = 'wins'  // Fenêtre simple
export const winl = 'winl'  // Fenêtre large
export const winb = 'winb'  // Fenêtre en baie

// ─── STRUCTURES — Piliers ─────────────────────────────────────────────────────
export const pil = 'pil'      // Pilier simple
export const pilor = 'pilor'  // Pilier ornemental
export const pilw = 'pilw'    // Pilier large
export const pilm = 'pilm'    // Pilier métal

// ─── STRUCTURES — Plafonds ────────────────────────────────────────────────────
export const ceil4 = 'ceil4'  // Plafond 4x4
export const ceil6 = 'ceil6'  // Plafond 6x6
export const ceil8 = 'ceil8'  // Plafond 8x8

// ─── SALLE DE BAIN ───────────────────────────────────────────────────────────
export const toilet = 'toilet'      // Toilettes
export const batht = 'batht'        // Baignoire
export const showr = 'showr'        // Douche
export const bsink = 'bsink'        // Lavabo salle de bain
export const bidet = 'bidet'        // Bidet
export const washmach = 'washmach'  // Machine à laver
export const towel = 'towel'        // Porte-serviettes

// ─── SALON / CHAMBRE ─────────────────────────────────────────────────────────
export const sofa = 'sofa'      // Sofa 3 places
export const sofaL = 'sofaL'    // Sofa en L
export const sofa2 = 'sofa2'    // Sofa 2 places
export const armch = 'armch'    // Fauteuil
export const ottom = 'ottom'    // Ottoman / repose-pieds
export const ctblw = 'ctblw'    // Table basse large
export const ctbl = 'ctbl'      // Table basse
export const dintbl = 'dintbl'  // Table à manger
export const tabrnd = 'tabrnd'  // Table ronde
export const chair = 'chair'    // Chaise
export const chair2 = 'chair2'  // Chaise 2
export const bstool = 'bstool'  // Tabouret de bar
export const bench = 'bench'    // Banc
export const bed = 'bed'        // Lit double
export const beds = 'beds'      // Lit simple
export const ward = 'ward'      // Armoire / garde-robe
export const dress = 'dress'    // Commode / dresser
export const night = 'night'    // Table de nuit
export const book = 'book'      // Bibliothèque
export const shelf = 'shelf'    // Étagère
export const filecab = 'filecab' // Classeur

// ─── BUREAU ───────────────────────────────────────────────────────────────────
export const desk = 'desk'    // Bureau simple
export const deskL = 'deskL'  // Bureau en L

// ─── CUISINE ──────────────────────────────────────────────────────────────────
export const kcnt = 'kcnt'      // Comptoir cuisine
export const stove = 'stove'    // Cuisinière
export const fridge = 'fridge'  // Réfrigérateur
export const sink = 'sink'      // Évier cuisine
export const micro = 'micro'    // Micro-ondes
export const dishw = 'dishw'    // Lave-vaisselle
export const kisland = 'kisland' // Îlot de cuisine
export const barc = 'barc'      // Comptoir de bar
export const cabh = 'cabh'      // Armoire haute cuisine

// ─── EXTÉRIEUR ────────────────────────────────────────────────────────────────
export const tree = 'tree'          // Arbre feuillu
export const pine = 'pine'          // Pin
export const palm = 'palm'          // Palmier
export const bush = 'bush'          // Buisson
export const flower = 'flower'      // Fleurs
export const lpost = 'lpost'        // Lampadaire
export const fence = 'fence'        // Clôture bois
export const fencem = 'fencem'      // Clôture métal
export const trash = 'trash'        // Poubelle
export const hydr = 'hydr'          // Bouche d'incendie
export const rock = 'rock'          // Rocher
export const cone = 'cone'          // Cône de chantier
export const barr = 'barr'          // Barrière
export const dump = 'dump'          // Conteneur à déchets
export const mailb = 'mailb'        // Boîte aux lettres
export const utpole = 'utpole'      // Poteau électrique
export const transf = 'transf'      // Transformateur
export const ac = 'ac'              // Unité climatisation extérieure
export const scaf = 'scaf'          // Échafaudage

// ─── VÉGÉTATION QUÉBEC ────────────────────────────────────────────────────────
export const qc_spruce = 'qc-spruce'                 // Épinette
export const qc_maple = 'qc-maple'                   // Érable
export const qc_maple_autumn = 'qc-maple-autumn'     // Érable automne
export const qc_maple_winter = 'qc-maple-winter'     // Érable hiver
export const qc_birch = 'qc-birch'                   // Bouleau
export const qc_forest_patch = 'qc-forest-patch'     // Patch de forêt
export const qc_corn_field = 'qc-corn-field'         // Champ de maïs
export const qc_wheat_field = 'qc-wheat-field'       // Champ de blé
export const qc_plowed_field = 'qc-plowed-field'     // Champ labouré
export const qc_small_river = 'qc-small-river'       // Petite rivière
export const qc_saint_laurent = 'qc-saint-laurent'   // Saint-Laurent
export const qc_rock = 'qc-rock'                     // Roche québécoise
export const qc_snow_cover = 'qc-snow-cover'         // Couverture de neige

// ─── ROUTES ───────────────────────────────────────────────────────────────────
export const road = 'road'    // Route droite
export const roadi = 'roadi'  // Intersection
export const swalk = 'swalk'  // Trottoir
export const cross = 'cross'  // Passage piéton
export const park = 'park'    // Marquage parking
export const tlight = 'tlight' // Feu de circulation
export const ssign = 'ssign'  // Panneau de rue
export const stop = 'stop'    // Panneau stop

// ─── DÉCORATION ───────────────────────────────────────────────────────────────
export const plant = 'plant'      // Plante intérieure
export const lplant = 'lplant'    // Grande plante
export const fpot = 'fpot'        // Pot de fleurs
export const neon = 'neon'        // Néon bleu
export const neongreen = 'neongreen' // Néon vert
export const neonred = 'neonred'  // Néon rouge
export const paint = 'paint'      // Tableau
export const mirr = 'mirr'        // Miroir
export const candle = 'candle'    // Bougie
export const vase = 'vase'        // Vase
export const clock = 'clock'      // Horloge murale
export const cbox = 'cbox'        // Boîte cadeau
export const barrel = 'barrel'    // Tonneau
export const crate = 'crate'      // Caisse en bois
export const ladder = 'ladder'    // Échelle
export const rug = 'rug'          // Tapis
export const curtain = 'curtain'  // Rideaux
export const picframe = 'picframe' // Cadre photo
export const tvwall = 'tvwall'    // TV murale
export const tvst = 'tvst'        // TV sur pied
export const lamp = 'lamp'        // Lampe de sol
export const dlamp = 'dlamp'      // Lampe de bureau
export const piano = 'piano'      // Piano
export const guitar = 'guitar'    // Guitare
export const trophy = 'trophy'    // Trophée

// ─── ÉCLAIRAGE ────────────────────────────────────────────────────────────────
export const ceillamp = 'ceillamp'      // Plafonnier
export const chandelier = 'chandelier'  // Lustre
export const neonsign = 'neonsign'      // Enseigne néon
export const spotlamp = 'spotlamp'      // Spot
export const walllamp = 'walllamp'      // Applique murale
export const ledstrip = 'ledstrip'      // Bande LED

// ─── BÂTIMENTS ────────────────────────────────────────────────────────────────
export const couche = 'couche'      // Couche-Tard / Dépanneur
export const hotel = 'hotel'        // Hôtel
export const pharm = 'pharm'        // Pharmacie
export const depan = 'depan'        // Dépanneur générique
export const restau = 'restau'      // Restaurant
export const garage = 'garage'      // Garage / bâtisse
export const church = 'church'      // Église
export const station = 'station'    // Station service
export const hospital = 'hospital'  // Hôpital
export const bar = 'bar'            // Bar
export const gym = 'gym'            // Gym
export const warehouse = 'warehouse' // Entrepôt

// ─── FORMES PRIMITIVES ────────────────────────────────────────────────────────
export const cube = 'cube'          // Cube
export const sphere = 'sphere'      // Sphère
export const cylinder = 'cylinder'  // Cylindre
export const coneShape = 'coneShape' // Cône
export const torusShape = 'torusShape' // Tore
export const planeShape = 'planeShape' // Plan
export const ramp = 'ramp'          // Rampe
export const arch = 'arch'          // Arche

// ─── PRISON ───────────────────────────────────────────────────────────────────
export const bunkprison = 'bunkprison'      // Lit superposé prison
export const metaltoilet = 'metaltoilet'    // Toilettes métal
export const celldoor = 'celldoor'          // Porte cellule
export const benchpress = 'benchpress'      // Banc de musculation
export const cctvscreen = 'cctvscreen'      // Écran surveillance
export const ctrlpanel = 'ctrlpanel'        // Panneau de contrôle
export const exerciseyard = 'exerciseyard'  // Cour de récréation
export const prisonwall = 'prisonwall'      // Mur de prison
export const barbed = 'barbed'              // Fil barbelé
export const watchtower = 'watchtower'      // Tour de garde

// ─── HÔTEL ────────────────────────────────────────────────────────────────────
export const hoteldoor = 'hoteldoor'        // Porte d'hôtel
export const hotelbed = 'hotelbed'          // Lit d'hôtel
export const reception = 'reception'        // Réception
export const minibar = 'minibar'            // Mini-bar
export const safebox = 'safebox'            // Coffre-fort
export const hotelluggage = 'hotelluggage'  // Porte-bagages
export const hotelsign = 'hotelsign'        // Enseigne hôtel
export const bellhop = 'bellhop'            // Chariot bagagiste
export const hotelcarpet = 'hotelcarpet'    // Tapis hôtel
export const apt_door = 'apt-door'        // Porte d'appartement
export const corridor_light = 'corridor-light' // Lumière couloir
export const corridor_plant = 'corridor-plant'  // Plante couloir
export const corridor_bench = 'corridor-bench'  // Banc couloir
export const apt_building = 'apt-building'       // Bâtiment appartements
export const apartment = 'apartment'        // Appartement

// ─── COMMERCE ─────────────────────────────────────────────────────────────────
export const atm = 'atm'                // Guichet ATM
export const cashregister = 'cashregister' // Caisse enregistreuse
export const shopshelf = 'shopshelf'    // Étagère de magasin
export const vending = 'vending'        // Distributeur automatique
export const gaspump = 'gaspump'        // Pompe à essence
export const busstop = 'busstop'        // Arrêt de bus
export const neonopen = 'neonopen'      // Enseigne OPEN néon
export const shopsign = 'shopsign'      // Enseigne de magasin
export const cart = 'cart'              // Chariot de supermarché
export const icecream = 'icecream'      // Stand crème glacée

// ─── NOURRITURE ───────────────────────────────────────────────────────────────
export const pizzabox = 'pizzabox'      // Boîte de pizza
export const burger = 'burger'          // Burger
export const coffeecup = 'coffeecup'    // Tasse de café
export const beerbottle = 'beerbottle'  // Bouteille de bière
export const donuts = 'donuts'          // Donuts
export const hotdog = 'hotdog'          // Hot-dog
export const fries = 'fries'            // Frites

// ─── ÉLECTRONIQUE ─────────────────────────────────────────────────────────────
export const tv65 = 'tv65'          // Télévision 65"
export const gamingpc = 'gamingpc'  // PC Gaming
export const speaker = 'speaker'    // Haut-parleur
export const laptop = 'laptop'      // Laptop
export const phone = 'phone'        // Téléphone
export const printer = 'printer'    // Imprimante
export const router = 'router'      // Routeur Wi-Fi
export const camera = 'camera'      // Caméra

// ─── SPÉCIAL / GAMEPLAY ───────────────────────────────────────────────────────
export const spawnpoint = 'spawnpoint'  // Point de spawn joueur
export const teleporter = 'teleporter'  // Téléporteur
export const jobmarker = 'jobmarker'    // Marqueur d'emploi
export const shopmarker = 'shopmarker'  // Marqueur de shop
export const campfire = 'campfire'      // Feu de camp
export const flag = 'flag'              // Drapeau
export const flagcanada = 'flagcanada'  // Drapeau canadien
export const tent = 'tent'              // Tente
export const barrel2 = 'barrel2'        // Tonneau métal
export const toolbox = 'toolbox'        // Boîte à outils
export const medkit = 'medkit'          // Kit médical

// ════════════════════════════════════════════════════════════════════════════════
// CATALOGUE COMPLET — Map model ID → metadata pour le Builder
// ════════════════════════════════════════════════════════════════════════════════

export interface ModelMeta {
  id: string
  label: string
  category: string
  dims: [number, number, number]   // width, height, depth
  color: string
  placeable: boolean
}

export const MODEL_CATALOG: Record<string, ModelMeta> = {
  // Structures
  w1:  { id: 'w1',  label: 'Mur 1m',        category: 'structures', dims: [1, 3, 0.2],  color: '#ccbbaa', placeable: true },
  w2:  { id: 'w2',  label: 'Mur 2m',        category: 'structures', dims: [2, 3, 0.2],  color: '#ccbbaa', placeable: true },
  w3:  { id: 'w3',  label: 'Mur 3m',        category: 'structures', dims: [3, 3, 0.2],  color: '#ccbbaa', placeable: true },
  w4:  { id: 'w4',  label: 'Mur 4m',        category: 'structures', dims: [4, 3, 0.2],  color: '#ccbbaa', placeable: true },
  ft:  { id: 'ft',  label: 'Plancher Bois',  category: 'structures', dims: [1, 0.1, 1],  color: '#8B6F47', placeable: true },
  fw:  { id: 'fw',  label: 'Plancher Bois2', category: 'structures', dims: [1, 0.1, 1],  color: '#9B7F57', placeable: true },
  st:  { id: 'st',  label: 'Escalier',       category: 'structures', dims: [1, 2, 2],    color: '#888888', placeable: true },
  dwood: { id: 'dwood', label: 'Porte Bois', category: 'structures', dims: [1, 2.2, 0.1], color: '#704214', placeable: true },
  dglass: { id: 'dglass', label: 'Porte Vitre', category: 'structures', dims: [1.2, 2.2, 0.1], color: '#87ceeb', placeable: true },
  // Salle de bain
  toilet: { id: 'toilet', label: 'Toilettes',      category: 'sdb', dims: [0.6, 0.8, 0.7], color: '#ffffff', placeable: true },
  batht:  { id: 'batht',  label: 'Baignoire',      category: 'sdb', dims: [1.7, 0.6, 0.8], color: '#e8e8e8', placeable: true },
  showr:  { id: 'showr',  label: 'Douche',          category: 'sdb', dims: [1, 2.2, 1],    color: '#ccddee', placeable: true },
  bsink:  { id: 'bsink',  label: 'Lavabo',          category: 'sdb', dims: [0.5, 0.9, 0.4], color: '#ffffff', placeable: true },
  bidet:  { id: 'bidet',  label: 'Bidet',           category: 'sdb', dims: [0.4, 0.4, 0.6], color: '#ffffff', placeable: true },
  // Salon
  sofa:   { id: 'sofa',   label: 'Sofa 3 places',  category: 'meubles', dims: [2.2, 0.9, 0.9], color: '#4a4a6a', placeable: true },
  sofaL:  { id: 'sofaL',  label: 'Sofa L',          category: 'meubles', dims: [3, 0.9, 2.5],   color: '#5a5a7a', placeable: true },
  armch:  { id: 'armch',  label: 'Fauteuil',        category: 'meubles', dims: [0.9, 1, 0.9],   color: '#6a4a2a', placeable: true },
  ctbl:   { id: 'ctbl',   label: 'Table basse',     category: 'meubles', dims: [1.2, 0.4, 0.7], color: '#704214', placeable: true },
  dintbl: { id: 'dintbl', label: 'Table à manger',  category: 'meubles', dims: [1.8, 0.8, 0.9], color: '#8B6F47', placeable: true },
  chair:  { id: 'chair',  label: 'Chaise',           category: 'meubles', dims: [0.5, 1, 0.5],   color: '#333333', placeable: true },
  bench:  { id: 'bench',  label: 'Banc',             category: 'meubles', dims: [2, 0.5, 0.4],   color: '#8B5A2B', placeable: true },
  bed:    { id: 'bed',    label: 'Lit double',       category: 'meubles', dims: [1.6, 0.6, 2.1], color: '#2a2a4a', placeable: true },
  beds:   { id: 'beds',   label: 'Lit simple',       category: 'meubles', dims: [1, 0.6, 2],     color: '#3a3a5a', placeable: true },
  ward:   { id: 'ward',   label: 'Armoire',          category: 'meubles', dims: [1.5, 2.2, 0.6], color: '#8B6F47', placeable: true },
  desk:   { id: 'desk',   label: 'Bureau',           category: 'meubles', dims: [1.5, 0.8, 0.7], color: '#704214', placeable: true },
  // Cuisine
  kcnt:   { id: 'kcnt',   label: 'Comptoir',         category: 'cuisine', dims: [2, 0.9, 0.6],   color: '#bbbbbb', placeable: true },
  stove:  { id: 'stove',  label: 'Cuisinière',       category: 'cuisine', dims: [0.6, 0.9, 0.6], color: '#555555', placeable: true },
  fridge: { id: 'fridge', label: 'Réfrigérateur',    category: 'cuisine', dims: [0.7, 1.8, 0.7], color: '#dddddd', placeable: true },
  sink:   { id: 'sink',   label: 'Évier',            category: 'cuisine', dims: [0.8, 0.9, 0.6], color: '#aaaaaa', placeable: true },
  // Extérieur
  tree:   { id: 'tree',   label: 'Arbre feuillu',    category: 'exterieur', dims: [3, 6, 3],     color: '#1a6b1a', placeable: true },
  pine:   { id: 'pine',   label: 'Pin',              category: 'exterieur', dims: [2, 8, 2],     color: '#0a5a0a', placeable: true },
  palm:   { id: 'palm',   label: 'Palmier',          category: 'exterieur', dims: [1, 7, 1],     color: '#2a8a2a', placeable: true },
  bush:   { id: 'bush',   label: 'Buisson',          category: 'exterieur', dims: [1, 1, 1],     color: '#2a7a2a', placeable: true },
  lpost:  { id: 'lpost',  label: 'Lampadaire',       category: 'exterieur', dims: [0.2, 5, 0.2], color: '#555555', placeable: true },
  fence:  { id: 'fence',  label: 'Clôture bois',     category: 'exterieur', dims: [2, 1.2, 0.1], color: '#8B5A2B', placeable: true },
  trash:  { id: 'trash',  label: 'Poubelle',         category: 'exterieur', dims: [0.4, 0.9, 0.4], color: '#333333', placeable: true },
  rock:   { id: 'rock',   label: 'Rocher',           category: 'exterieur', dims: [1, 0.7, 0.8], color: '#888888', placeable: true },
  // Routes
  road:   { id: 'road',   label: 'Route',            category: 'routes', dims: [4, 0.1, 8],    color: '#333333', placeable: true },
  roadi:  { id: 'roadi',  label: 'Intersection',     category: 'routes', dims: [8, 0.1, 8],    color: '#333333', placeable: true },
  swalk:  { id: 'swalk',  label: 'Trottoir',         category: 'routes', dims: [2, 0.15, 4],   color: '#888888', placeable: true },
  tlight: { id: 'tlight', label: 'Feu circulation',  category: 'routes', dims: [0.2, 5, 0.2],  color: '#444444', placeable: true },
  // Éclairage
  ceillamp:  { id: 'ceillamp',   label: 'Plafonnier',   category: 'eclairage', dims: [0.5, 0.2, 0.5], color: '#ffffcc', placeable: true },
  chandelier:{ id: 'chandelier', label: 'Lustre',        category: 'eclairage', dims: [1, 0.8, 1],     color: '#ffeeaa', placeable: true },
  walllamp:  { id: 'walllamp',   label: 'Applique',      category: 'eclairage', dims: [0.3, 0.3, 0.2], color: '#ffddaa', placeable: true },
  ledstrip:  { id: 'ledstrip',   label: 'Bande LED',     category: 'eclairage', dims: [2, 0.05, 0.05], color: '#00ffff', placeable: true },
  // Bâtiments
  hotel:    { id: 'hotel',    label: 'Hôtel',        category: 'batiments', dims: [25, 20, 20], color: '#d4a574', placeable: false },
  depan:    { id: 'depan',    label: 'Dépanneur',    category: 'batiments', dims: [8, 4, 6],    color: '#cc6633', placeable: false },
  restau:   { id: 'restau',   label: 'Restaurant',   category: 'batiments', dims: [12, 6, 10],  color: '#4a6a8a', placeable: false },
  warehouse:{ id: 'warehouse',label: 'Entrepôt',     category: 'batiments', dims: [20, 8, 15],  color: '#777777', placeable: false },
  church:   { id: 'church',   label: 'Église',       category: 'batiments', dims: [15, 12, 20], color: '#aaaaaa', placeable: false },
  hospital: { id: 'hospital', label: 'Hôpital',      category: 'batiments', dims: [20, 15, 20], color: '#ffffff', placeable: false },
  // Formes primitives
  cube:     { id: 'cube',     label: 'Cube',         category: 'formes', dims: [1, 1, 1],    color: '#6688aa', placeable: true },
  sphere:   { id: 'sphere',   label: 'Sphère',       category: 'formes', dims: [1, 1, 1],    color: '#8866aa', placeable: true },
  cylinder: { id: 'cylinder', label: 'Cylindre',     category: 'formes', dims: [1, 2, 1],    color: '#668866', placeable: true },
  ramp:     { id: 'ramp',     label: 'Rampe',        category: 'formes', dims: [2, 1, 2],    color: '#886644', placeable: true },
  // Prison
  celldoor: { id: 'celldoor', label: 'Porte cellule',category: 'prison', dims: [1, 2.5, 0.1], color: '#888888', placeable: true },
  // Hôtel items
  reception:{ id: 'reception', label: 'Réception',   category: 'hotel', dims: [3, 1.1, 1],   color: '#8B6F47', placeable: true },
  minibar:  { id: 'minibar',   label: 'Mini-bar',    category: 'hotel', dims: [0.8, 0.9, 0.5], color: '#333333', placeable: true },
  hotelbed: { id: 'hotelbed',  label: 'Lit hôtel',   category: 'hotel', dims: [1.8, 0.6, 2.2], color: '#ffffff', placeable: true },
  // Commerce
  atm:          { id: 'atm',          label: 'ATM',          category: 'commerce', dims: [0.5, 1.8, 0.4], color: '#2a6099', placeable: true },
  cashregister: { id: 'cashregister', label: 'Caisse',       category: 'commerce', dims: [0.4, 0.4, 0.4], color: '#333333', placeable: true },
  shopshelf:    { id: 'shopshelf',    label: 'Étagère shop', category: 'commerce', dims: [1, 2, 0.4],     color: '#888888', placeable: true },
  vending:      { id: 'vending',      label: 'Distributeur', category: 'commerce', dims: [0.7, 1.8, 0.5], color: '#cc4444', placeable: true },
  gaspump:      { id: 'gaspump',      label: 'Pompe essence',category: 'commerce', dims: [0.5, 2, 0.5],   color: '#ff6600', placeable: true },
  // Électronique
  tv65:     { id: 'tv65',     label: 'TV 65"',       category: 'electronique', dims: [1.6, 1, 0.1], color: '#111111', placeable: true },
  gamingpc: { id: 'gamingpc', label: 'PC Gaming',    category: 'electronique', dims: [0.5, 0.5, 0.5], color: '#1a1a2a', placeable: true },
  // Spécial
  spawnpoint:{ id: 'spawnpoint', label: 'Spawn',       category: 'special', dims: [1, 0.1, 1], color: '#00ff00', placeable: true },
  teleporter:{ id: 'teleporter', label: 'Téléporteur', category: 'special', dims: [2, 3, 2],   color: '#8800ff', placeable: true },
  campfire:  { id: 'campfire',   label: 'Feu de camp', category: 'special', dims: [1, 1, 1],   color: '#ff6600', placeable: true },
  medkit:    { id: 'medkit',     label: 'Kit médical', category: 'special', dims: [0.4, 0.3, 0.3], color: '#ff0000', placeable: true },
}

// ════════════════════════════════════════════════════════════════════════════════
// CATÉGORIES POUR LE BUILDER MODE
// ════════════════════════════════════════════════════════════════════════════════

export const MODEL_CATEGORIES = [
  { id: 'structures',  label: '🏗️ Structures',    icon: '🏗️' },
  { id: 'meubles',     label: '🛋️ Meubles',        icon: '🛋️' },
  { id: 'cuisine',     label: '🍳 Cuisine',         icon: '🍳' },
  { id: 'sdb',         label: '🚿 Salle de bain',   icon: '🚿' },
  { id: 'exterieur',   label: '🌳 Extérieur',       icon: '🌳' },
  { id: 'routes',      label: '🛣️ Routes',          icon: '🛣️' },
  { id: 'eclairage',   label: '💡 Éclairage',       icon: '💡' },
  { id: 'deco',        label: '🎨 Décoration',      icon: '🎨' },
  { id: 'formes',      label: '⬡ Formes',          icon: '⬡' },
  { id: 'prison',      label: '🔒 Prison',          icon: '🔒' },
  { id: 'hotel',       label: '🏨 Hôtel',           icon: '🏨' },
  { id: 'commerce',    label: '🏪 Commerce',        icon: '🏪' },
  { id: 'electronique',label: '💻 Électronique',   icon: '💻' },
  { id: 'special',     label: '⭐ Spécial',        icon: '⭐' },
]

export const TOTAL_MODELS = Object.keys(MODEL_CATALOG).length
