'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useStore } from '@/lib/etherworld/game-store'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface ObjectAction {
  id: string
  label: string
  icon: string
  category?: 'primary' | 'secondary' | 'inspect' | 'social' | 'danger'
  description?: string
  requiresItem?: string
  cooldown?: number
  keybind?: string
  disabled?: boolean
  disabledReason?: string
}

interface ObjectConfig {
  displayName: string
  icon: string
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  description?: string
  actions: ObjectAction[]
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION COMPLÈTE DES OBJETS INTERACTIFS
// ════════════════════════════════════════════════════════════════════════════

const OBJECT_CONFIGS: Record<string, ObjectConfig> = {
  LuxuryBed: {
    displayName: 'Lit King Size',
    icon: '🛏️',
    rarity: 'epic',
    description: 'Lit de luxe avec matelas à mémoire de forme et literie premium.',
    actions: [
      { id: 'sit', label: "S'asseoir sur le bord", icon: '🪑', category: 'primary', description: 'Asseyez-vous sur le bord du lit.', keybind: '1' },
      { id: 'lie', label: 'Se coucher', icon: '😴', category: 'primary', description: 'Allongez-vous pour vous reposer. Restaure l\'énergie.', keybind: '2' },
      { id: 'sleep', label: 'Dormir', icon: '💤', category: 'primary', description: 'Dormez pour passer le temps et restaurer toute votre énergie.', keybind: '3' },
      { id: 'make_bed', label: 'Faire le lit', icon: '✨', category: 'secondary', description: 'Remettez les draps en ordre.' },
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect', description: 'Inspectez le mobilier de près.' },
    ],
  },
  ModernSofa: {
    displayName: 'Canapé Moderne',
    icon: '🛋️',
    rarity: 'rare',
    description: 'Canapé design en cuir italien avec accoudoirs rembourrés.',
    actions: [
      { id: 'sit', label: "S'asseoir confortablement", icon: '🪑', category: 'primary', description: 'Installez-vous confortablement.', keybind: '1' },
      { id: 'lean', label: "S'appuyer au dossier", icon: '😌', category: 'primary', description: 'Détendez-vous contre le dossier.', keybind: '2' },
      { id: 'nap', label: 'Faire une sieste', icon: '💤', category: 'primary', description: 'Une courte sieste sur le canapé.' },
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect' },
    ],
  },
  GamingChair: {
    displayName: 'Chaise Gaming',
    icon: '🎮',
    rarity: 'uncommon',
    description: 'Chaise ergonomique avec support lombaire et accoudoirs réglables.',
    actions: [
      { id: 'sit', label: "S'asseoir au bureau", icon: '💺', category: 'primary', description: 'Installez-vous devant l\'écran.', keybind: '1' },
      { id: 'spin', label: 'Faire pivoter', icon: '🔄', category: 'secondary', description: 'Tournez sur vous-même pour le fun !' },
      { id: 'adjust', label: 'Régler la hauteur', icon: '⬆️', category: 'secondary', description: 'Ajustez la chaise à votre taille.' },
      { id: 'recline', label: 'Incliner le dossier', icon: '↩️', category: 'secondary', description: 'Penchez-vous en arrière.' },
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect' },
    ],
  },
  TVStand: {
    displayName: 'Centre Multimédia',
    icon: '📺',
    rarity: 'rare',
    description: 'Écran 65" 4K OLED avec système audio surround intégré.',
    actions: [
      { id: 'toggle', label: 'Allumer / Éteindre', icon: '⚡', category: 'primary', description: 'Basculez l\'état de la TV.', keybind: '1' },
      { id: 'channel_up', label: 'Chaîne suivante', icon: '⬆️', category: 'secondary', description: 'Zappez vers la chaîne suivante.' },
      { id: 'channel_down', label: 'Chaîne précédente', icon: '⬇️', category: 'secondary', description: 'Revenez à la chaîne précédente.' },
      { id: 'volume', label: 'Régler le volume', icon: '🔊', category: 'secondary', description: 'Ajustez le niveau sonore.' },
      { id: 'stream', label: 'Lancer Netflix', icon: '🎬', category: 'primary', description: 'Ouvrez votre plateforme de streaming.' },
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect' },
    ],
  },
  MiniBar: {
    displayName: 'Mini-Bar',
    icon: '🍷',
    rarity: 'uncommon',
    description: 'Réfrigérateur compact avec sélection de boissons et snacks.',
    actions: [
      { id: 'open', label: 'Ouvrir les réserves', icon: '🚪', category: 'primary', description: 'Accédez au contenu du mini-bar.', keybind: '1' },
      { id: 'drink_water', label: 'Boire de l\'eau', icon: '💧', category: 'primary', description: 'Désaltérez-vous. +25 soif.' },
      { id: 'drink_beer', label: 'Prendre une bière', icon: '🍺', category: 'primary', description: 'Une bonne bière fraîche. +15 soif, -5 énergie.' },
      { id: 'eat_snack', label: 'Manger un snack', icon: '🍫', category: 'primary', description: 'Un en-cas rapide. +10 faim.' },
      { id: 'restock', label: 'Réapprovisionner', icon: '📦', category: 'secondary', description: 'Demandez un réapprovisionnement. -50$', requiresItem: 'cash' },
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect' },
    ],
  },
  Wardrobe: {
    displayName: 'Garde-Robe',
    icon: '👔',
    rarity: 'uncommon',
    description: 'Armoire spacieuse en bois noble avec miroir intérieur.',
    actions: [
      { id: 'open', label: 'Ouvrir les portes', icon: '🚪', category: 'primary', description: 'Accédez à vos vêtements.', keybind: '1' },
      { id: 'change_outfit', label: 'Changer de tenue', icon: '👕', category: 'primary', description: 'Sélectionnez une nouvelle tenue.' },
      { id: 'store', label: 'Ranger un vêtement', icon: '📥', category: 'secondary', description: 'Rangez un vêtement de l\'inventaire.' },
      { id: 'mirror', label: 'Se regarder', icon: '🪞', category: 'social', description: 'Vérifiez votre apparence dans le miroir.' },
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect' },
    ],
  },
  Nightstand: {
    displayName: 'Table de Chevet',
    icon: '🪔',
    rarity: 'common',
    description: 'Table de nuit avec tiroir de rangement et lampe intégrée.',
    actions: [
      { id: 'open', label: 'Ouvrir le tiroir', icon: '📂', category: 'primary', description: 'Fouilles le tiroir.', keybind: '1' },
      { id: 'toggle_lamp', label: 'Lampe on/off', icon: '💡', category: 'primary', description: 'Allumez ou éteignez la lampe de chevet.' },
      { id: 'place_item', label: 'Poser un objet', icon: '📌', category: 'secondary', description: 'Déposez un objet de votre inventaire.' },
      { id: 'set_alarm', label: 'Régler le réveil', icon: '⏰', category: 'secondary', description: 'Programmez une alarme RP.' },
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect' },
    ],
  },
  GamingDesk: {
    displayName: 'Bureau Gaming',
    icon: '🖥️',
    rarity: 'rare',
    description: 'Bureau ergonomique avec LED RGB, double moniteur et cable management.',
    actions: [
      { id: 'sit', label: "S'installer", icon: '💺', category: 'primary', description: 'Prenez place devant les écrans.', keybind: '1' },
      { id: 'use_pc', label: 'Utiliser le PC', icon: '💻', category: 'primary', description: 'Accédez à votre ordinateur.' },
      { id: 'toggle_rgb', label: 'Changer les LEDs', icon: '🌈', category: 'secondary', description: 'Changez la couleur de l\'éclairage RGB.' },
      { id: 'organize', label: 'Ranger le bureau', icon: '📋', category: 'secondary', description: 'Nettoyez et organisez votre espace.' },
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect' },
    ],
  },
  Bathroom: {
    displayName: 'Salle de Bain',
    icon: '🚿',
    rarity: 'common',
    description: 'Salle de bain moderne avec douche à l\'italienne et baignoire.',
    actions: [
      { id: 'shower', label: 'Prendre une douche', icon: '🚿', category: 'primary', description: 'Rafraîchissez-vous. +20 énergie.', keybind: '1' },
      { id: 'bath', label: 'Prendre un bain', icon: '🛁', category: 'primary', description: 'Relaxez-vous dans la baignoire. +30 énergie.' },
      { id: 'wash_hands', label: 'Se laver les mains', icon: '🧼', category: 'secondary', description: 'Hygiène de base.' },
      { id: 'mirror_check', label: 'Regarder le miroir', icon: '🪞', category: 'social', description: 'Vérifiez votre apparence.' },
      { id: 'use_toilet', label: 'Utiliser les toilettes', icon: '🚽', category: 'primary', description: 'Besoin naturel.' },
      { id: 'examine', label: 'Examiner', icon: '🔍', category: 'inspect' },
    ],
  },
  Kitchen: {
    displayName: 'Cuisine',
    icon: '🍳',
    rarity: 'uncommon',
    description: 'Kitchenette équipée avec plaques, micro-ondes et réfrigérateur.',
    actions: [
      { id: 'cook', label: 'Cuisiner un repas', icon: '🍳', category: 'primary', description: 'Préparez un plat. +40 faim.', keybind: '1' },
      { id: 'make_coffee', label: 'Faire du café', icon: '☕', category: 'primary', description: 'Un bon café. +15 énergie.' },
      { id: 'open_fridge', label: 'Ouvrir le frigo', icon: '🧊', category: 'primary', description: 'Consultez le contenu du réfrigérateur.' },
      { id: 'microwave', label: 'Utiliser le micro-ondes', icon: '📡', category: 'secondary', description: 'Réchauffez un plat rapidement.' },
      { id: 'wash_dishes', label: 'Faire la vaisselle', icon: '🧽', category: 'secondary', description: 'Nettoyez la cuisine.' },
      { id: 'examine', label: 'Examiner', icon: '🔍', category: 'inspect' },
    ],
  },
  Balcony: {
    displayName: 'Balcon',
    icon: '🌆',
    rarity: 'rare',
    description: 'Balcon avec vue panoramique sur la ville de Québec.',
    actions: [
      { id: 'lean_rail', label: 'S\'accouder à la rambarde', icon: '🌃', category: 'primary', description: 'Contemplez la vue.', keybind: '1' },
      { id: 'smoke', label: 'Fumer une cigarette', icon: '🚬', category: 'social', description: 'Prenez une pause clope. -2 santé.', requiresItem: 'cigarettes' },
      { id: 'phone_call', label: 'Passer un appel', icon: '📞', category: 'social', description: 'Appelez quelqu\'un avec vue.', requiresItem: 'phone-basic' },
      { id: 'photograph', label: 'Prendre une photo', icon: '📸', category: 'social', description: 'Capturez le paysage.', requiresItem: 'phone-basic' },
      { id: 'examine', label: 'Admirer la vue', icon: '🔍', category: 'inspect' },
    ],
  },
  Door: {
    displayName: 'Porte',
    icon: '🚪',
    rarity: 'common',
    description: 'Porte d\'accès sécurisée avec serrure électronique.',
    actions: [
      { id: 'open', label: 'Ouvrir', icon: '🚪', category: 'primary', description: 'Ouvrez la porte.', keybind: '1' },
      { id: 'close', label: 'Fermer', icon: '🔒', category: 'primary', description: 'Fermez la porte.' },
      { id: 'lock', label: 'Verrouiller', icon: '🔐', category: 'secondary', description: 'Verrouillez la serrure.', requiresItem: 'keycard-resident' },
      { id: 'knock', label: 'Frapper', icon: '✊', category: 'social', description: 'Toc toc toc !' },
      { id: 'peek', label: 'Regarder par le judas', icon: '👁️', category: 'inspect', description: 'Vérifiez qui est dehors.' },
      { id: 'examine', label: 'Examiner', icon: '🔍', category: 'inspect' },
    ],
  },
  Phone: {
    displayName: 'Téléphone Fixe',
    icon: '📞',
    rarity: 'common',
    description: 'Téléphone interne de l\'hôtel. Ligne directe avec la réception.',
    actions: [
      { id: 'call_reception', label: 'Appeler la réception', icon: '📞', category: 'primary', description: 'Contactez le personnel.', keybind: '1' },
      { id: 'room_service', label: 'Service d\'étage', icon: '🍽️', category: 'primary', description: 'Commandez un repas. Variable $.' },
      { id: 'call_taxi', label: 'Appeler un taxi', icon: '🚕', category: 'primary', description: 'Réservez un transport.' },
      { id: 'wake_up_call', label: 'Réveil automatique', icon: '⏰', category: 'secondary', description: 'Programmez un appel de réveil.' },
      { id: 'examine', label: 'Examiner', icon: '🔍', category: 'inspect' },
    ],
  },
  Safe: {
    displayName: 'Coffre-Fort',
    icon: '🔒',
    rarity: 'epic',
    description: 'Coffre-fort numérique haute sécurité. Code à 4 chiffres.',
    actions: [
      { id: 'open_safe', label: 'Entrer le code', icon: '🔓', category: 'primary', description: 'Déverrouillez le coffre avec votre code.', keybind: '1' },
      { id: 'store_valuables', label: 'Déposer des objets', icon: '📥', category: 'primary', description: 'Rangez des objets précieux.' },
      { id: 'retrieve', label: 'Retirer des objets', icon: '📤', category: 'primary', description: 'Récupérez vos affaires.' },
      { id: 'change_code', label: 'Changer le code', icon: '🔢', category: 'secondary', description: 'Modifiez votre code d\'accès.' },
      { id: 'examine', label: 'Examiner', icon: '🔍', category: 'inspect' },
    ],
  },
  default: {
    displayName: 'Objet',
    icon: '📦',
    description: 'Un objet du monde.',
    actions: [
      { id: 'examine', label: 'Examiner en détail', icon: '🔍', category: 'inspect', description: 'Inspectez l\'objet de plus près.' },
      { id: 'touch', label: 'Toucher', icon: '🤚', category: 'primary', description: 'Touchez l\'objet.' },
    ],
  },
}

// ════════════════════════════════════════════════════════════════════════════
// RARITY STYLING
// ════════════════════════════════════════════════════════════════════════════

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'rgba(6,182,212,0.08)', text: '#22d3ee', border: 'rgba(6,182,212,0.2)' },
  secondary: { bg: 'rgba(168,85,247,0.06)', text: '#c084fc', border: 'rgba(168,85,247,0.15)' },
  inspect: { bg: 'rgba(245,158,11,0.06)', text: '#fbbf24', border: 'rgba(245,158,11,0.15)' },
  social: { bg: 'rgba(236,72,153,0.06)', text: '#f472b6', border: 'rgba(236,72,153,0.15)' },
  danger: { bg: 'rgba(239,68,68,0.08)', text: '#f87171', border: 'rgba(239,68,68,0.2)' },
}

// ════════════════════════════════════════════════════════════════════════════
// ACTION RESULTS — Messages détaillés par action
// ════════════════════════════════════════════════════════════════════════════

const ACTION_RESULTS: Record<string, { message: string; type: 'success' | 'info' | 'warning'; playerAction?: string; statChange?: Record<string, number> }> = {
  sit: { message: 'Vous vous asseyez confortablement.', type: 'success', playerAction: 'sitting' },
  lie: { message: 'Vous vous allongez pour vous reposer.', type: 'success', playerAction: 'lying' },
  sleep: { message: 'Vous sombrez dans un sommeil réparateur... 💤', type: 'success', playerAction: 'sleeping', statChange: { energy: 50 } },
  lean: { message: 'Vous vous appuyez de manière décontractée.', type: 'success', playerAction: 'leaning' },
  nap: { message: 'Une courte sieste... zzz', type: 'success', playerAction: 'sleeping', statChange: { energy: 20 } },
  spin: { message: 'Le siège tourne sur son axe ! Wheeee! 🔄', type: 'info' },
  adjust: { message: 'Hauteur de la chaise ajustée à votre taille.', type: 'success' },
  recline: { message: 'Dossier incliné. Mode détente activé.', type: 'success', playerAction: 'leaning' },
  toggle: { message: 'Le système multimédia change d\'état. 📺', type: 'info' },
  channel_up: { message: 'Chaîne suivante... EtherWorld News.', type: 'info' },
  channel_down: { message: 'Chaîne précédente... Météo Québec.', type: 'info' },
  volume: { message: 'Volume ajusté.', type: 'info' },
  stream: { message: 'Ouverture de la plateforme de streaming...', type: 'success' },
  open: { message: 'Ouverture effectuée.', type: 'success' },
  drink_water: { message: 'Vous buvez un verre d\'eau fraîche. 💧 Soif restaurée.', type: 'success', statChange: { thirst: 25 } },
  drink_beer: { message: 'Vous ouvrez une bière bien froide. 🍺 Santé !', type: 'success', statChange: { thirst: 15, energy: -5 } },
  eat_snack: { message: 'Vous grignotez un snack. 🍫', type: 'success', statChange: { hunger: 10 } },
  restock: { message: 'Réapprovisionnement demandé. -50$ débités.', type: 'warning', statChange: { money: -50 } },
  change_outfit: { message: 'Sélection de tenue ouverte. 👕', type: 'success' },
  store: { message: 'Vêtement rangé dans l\'armoire.', type: 'success' },
  mirror: { message: 'Vous vous regardez dans le miroir. Pas mal ! 😏', type: 'info' },
  toggle_lamp: { message: 'Lampe de chevet basculée. 💡', type: 'info' },
  place_item: { message: 'Objet déposé sur la table de chevet.', type: 'success' },
  set_alarm: { message: 'Réveil programmé pour 7h00.', type: 'success' },
  use_pc: { message: 'Connexion au système... Bienvenue sur EtherOS.', type: 'success' },
  toggle_rgb: { message: 'LEDs RGB : nouvelle couleur appliquée ! 🌈', type: 'info' },
  organize: { message: 'Bureau nettoyé et organisé. ✨', type: 'success' },
  make_bed: { message: 'Le lit est fait. Impeccable ! ✨', type: 'success' },
  shower: { message: 'Douche prise. Vous vous sentez frais ! 🚿', type: 'success', statChange: { energy: 20 } },
  bath: { message: 'Bain chaud relaxant... Ahhh. 🛁', type: 'success', statChange: { energy: 30 } },
  wash_hands: { message: 'Mains propres. 🧼', type: 'info' },
  mirror_check: { message: 'Vous vérifiez votre look. Parfait !', type: 'info' },
  use_toilet: { message: '...', type: 'info' },
  cook: { message: 'Repas préparé ! Bon appétit ! 🍳', type: 'success', statChange: { hunger: 40 } },
  make_coffee: { message: 'Café prêt ! L\'arôme emplit la pièce. ☕', type: 'success', statChange: { energy: 15 } },
  open_fridge: { message: 'Contenu du frigo : eau, bière, fromage, légumes.', type: 'info' },
  microwave: { message: 'Plat réchauffé en 2 minutes. Bip bip ! 📡', type: 'success', statChange: { hunger: 20 } },
  wash_dishes: { message: 'Vaisselle propre et rangée. 🧽', type: 'success' },
  lean_rail: { message: 'Vous contemplez la vue sur Québec... 🌃', type: 'success', playerAction: 'leaning' },
  smoke: { message: 'Vous fumez une cigarette sur le balcon. 🚬', type: 'warning', statChange: { health: -2 } },
  phone_call: { message: 'Appel en cours... 📞', type: 'info' },
  photograph: { message: 'Photo prise ! Vue magnifique. 📸', type: 'success' },
  close: { message: 'Porte fermée.', type: 'success' },
  lock: { message: 'Porte verrouillée. 🔐', type: 'success' },
  knock: { message: 'Toc toc toc ! ✊', type: 'info' },
  peek: { message: 'Vous regardez par le judas... Personne.', type: 'info' },
  call_reception: { message: 'Réception : "Bonjour, comment puis-je vous aider ?"', type: 'info' },
  room_service: { message: 'Service d\'étage commandé. Livraison dans 15 min.', type: 'success', statChange: { money: -35 } },
  call_taxi: { message: 'Taxi réservé. Arrivée dans 5 minutes. 🚕', type: 'success' },
  wake_up_call: { message: 'Réveil automatique programmé.', type: 'success' },
  open_safe: { message: 'Code accepté. Coffre ouvert. 🔓', type: 'success' },
  store_valuables: { message: 'Objets déposés en sécurité.', type: 'success' },
  retrieve: { message: 'Objets récupérés du coffre.', type: 'success' },
  change_code: { message: 'Code du coffre modifié.', type: 'success' },
  touch: { message: 'Vous touchez l\'objet. Texture intéressante.', type: 'info' },
  examine: { message: 'Analyse détaillée...', type: 'info' },
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export function ContextMenu() {
  const contextMenu = useStore(s => s.contextMenu)
  const hideContextMenu = useStore(s => s.hideContextMenu)
  const setNotification = useStore(s => s.setNotification)
  const setPlayerAction = useStore(s => s.setPlayerAction)
  const menuRef = useRef<HTMLDivElement>(null)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)
  const [recentlyUsed, setRecentlyUsed] = useState<Set<string>>(new Set())
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})

  // Fermer le menu sur clic externe ou Escape
  useEffect(() => {
    if (!contextMenu?.visible) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) hideContextMenu()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideContextMenu()

      // Raccourcis numériques
      if (contextMenu?.objectType) {
        const config = OBJECT_CONFIGS[contextMenu.objectType] || OBJECT_CONFIGS.default
        const keyed = config.actions.find(a => a.keybind === e.key)
        if (keyed && !keyed.disabled) {
          e.preventDefault()
          handleAction(keyed.id, contextMenu.objectType)
        }
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [contextMenu, hideContextMenu])

  const handleAction = useCallback((actionId: string, objectType: string) => {
    const result = ACTION_RESULTS[actionId]
    const config = OBJECT_CONFIGS[objectType] || OBJECT_CONFIGS.default

    if (result) {
      // Message enrichi avec le nom de l'objet
      const message = actionId === 'examine'
        ? `Analyse détaillée : ${config.displayName} — ${config.description || 'Objet du monde.'}`
        : actionId === 'open'
          ? `${config.displayName} : accès libéré.`
          : result.message

      setNotification(message)

      if (result.playerAction) {
        setPlayerAction(result.playerAction)
      }
    } else {
      setNotification(`Action "${actionId}" effectuée sur ${config.displayName}.`)
    }

    // Marquer comme récemment utilisé
    setRecentlyUsed(prev => new Set(prev).add(actionId))
    setTimeout(() => {
      setRecentlyUsed(prev => {
        const next = new Set(prev)
        next.delete(actionId)
        return next
      })
    }, 3000)

    hideContextMenu()
  }, [setNotification, setPlayerAction, hideContextMenu])

  if (!contextMenu?.visible) return null

  const config = OBJECT_CONFIGS[contextMenu.objectType] || OBJECT_CONFIGS.default
  const rarity = config.rarity || 'common'
  const rarityColor = RARITY_COLORS[rarity]

  // Grouper les actions par catégorie
  const groupedActions = useMemo(() => {
    const groups: Record<string, ObjectAction[]> = {}
    config.actions.forEach(action => {
      const cat = action.category || 'primary'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(action)
    })
    return groups
  }, [config.actions])

  const categoryOrder = ['primary', 'secondary', 'social', 'inspect', 'danger']

  // Position du menu ajustée
  const estimatedHeight = config.actions.length * 44 + 120
  const mx = Math.min(contextMenu.x, window.innerWidth - 280)
  const my = Math.min(contextMenu.y, window.innerHeight - estimatedHeight)

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] pointer-events-auto"
      style={{
        left: mx,
        top: my,
        animation: 'contextMenuSlideIn 0.18s ease-out',
      }}
    >
      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes contextMenuSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes actionHighlight {
          0%, 100% { background: transparent; }
          50% { background: rgba(6,182,212,0.06); }
        }
      `}</style>

      <div
        className="min-w-[265px] max-w-[320px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(10,10,18,0.97), rgba(5,5,12,0.98))',
          border: `1px solid ${rarityColor}30`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), 0 0 30px ${rarityColor}10`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* ══ HEADER ══ */}
        <div
          className="px-4 py-3 border-b"
          style={{
            borderColor: `${rarityColor}15`,
            background: `linear-gradient(135deg, ${rarityColor}10, transparent 60%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{
                background: `${rarityColor}12`,
                border: `1px solid ${rarityColor}25`,
                boxShadow: `0 0 12px ${rarityColor}10`,
              }}
            >
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{config.displayName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: rarityColor,
                    background: `${rarityColor}12`,
                    border: `1px solid ${rarityColor}25`,
                  }}
                >
                  {RARITY_LABELS[rarity]}
                </span>
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">
                  Interactions RP
                </span>
              </div>
            </div>
          </div>

          {/* Description (si survolé ou toujours visible) */}
          {config.description && (
            <div className="mt-2.5 text-[10px] text-zinc-500 leading-relaxed italic">
              "{config.description}"
            </div>
          )}
        </div>

        {/* ══ ACTIONS ══ */}
        <div className="py-1.5">
          {categoryOrder.map(cat => {
            const actions = groupedActions[cat]
            if (!actions || actions.length === 0) return null

            const catConfig = CATEGORY_COLORS[cat] || CATEGORY_COLORS.primary

            return (
              <div key={cat}>
                {/* Séparateur de catégorie (sauf la première) */}
                {cat !== categoryOrder.find(c => groupedActions[c]?.length) && (
                  <div className="h-px mx-4 my-1" style={{ background: 'rgba(255,255,255,0.04)' }} />
                )}

                {actions.map(action => {
                  const isHovered = hoveredAction === action.id
                  const isRecent = recentlyUsed.has(action.id)
                  const isDisabled = action.disabled

                  return (
                    <div key={action.id} className="relative">
                      <button
                        onClick={() => !isDisabled && handleAction(action.id, contextMenu.objectType)}
                        onMouseEnter={() => setHoveredAction(action.id)}
                        onMouseLeave={() => setHoveredAction(null)}
                        disabled={isDisabled}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                        style={{
                          background: isHovered ? catConfig.bg : isRecent ? 'rgba(34,197,94,0.05)' : 'transparent',
                          color: isDisabled ? 'rgba(255,255,255,0.2)' : isHovered ? catConfig.text : '#ffffff',
                          paddingLeft: isHovered ? '20px' : '16px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {/* Icône */}
                        <span className="text-base w-6 text-center shrink-0">{action.icon}</span>

                        {/* Label + description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold truncate tracking-wide">
                              {action.label}
                            </span>
                            {isRecent && (
                              <span className="text-[8px] text-emerald-400 font-bold">✓</span>
                            )}
                          </div>
                          {isHovered && action.description && (
                            <div className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                              {action.description}
                            </div>
                          )}
                        </div>

                        {/* Keybind + badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {action.requiresItem && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              🔑
                            </span>
                          )}
                          {action.keybind && (
                            <kbd
                              className="min-w-[18px] px-1 py-0.5 text-[9px] font-mono font-bold text-center rounded"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.35)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              {action.keybind}
                            </kbd>
                          )}
                        </div>
                      </button>

                      {/* Disabled tooltip */}
                      {isDisabled && isHovered && action.disabledReason && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                          {action.disabledReason}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ══ FOOTER ══ */}
        <div
          className="border-t px-4 py-2.5 flex items-center justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}
        >
          <div className="text-[9px] text-zinc-600 font-mono flex items-center gap-2">
            <span>{config.actions.length} actions</span>
            <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
            <span>ESC fermer</span>
          </div>
          <button
            onClick={hideContextMenu}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-zinc-600 text-[10px] font-bold hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <span className="text-[8px]">✕</span>
            <span>FERMER</span>
          </button>
        </div>
      </div>
    </div>
  )
}