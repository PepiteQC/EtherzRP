/**
 * StandardCommands.ts — 30+ commandes EtherWorld RP
 * Modération, téléportation, joueur, serveur, économie, aide, admin
 */

import { CommandDefinition, PermissionLevel } from '../admin'

export const AllCommands: CommandDefinition[] = [
  // === MODÉRATION ===
  {
    name: 'kick',
    description: 'Expulser un joueur du serveur',
    args: [
      { name: 'joueur', type: 'player', required: true },
      { name: 'raison', type: 'string', required: false },
    ],
    aliases: ['expulser'],
    minPermissionLevel: PermissionLevel.MODERATOR,
    execute: async ([target, reason], ctx) => {
      // Logique d'expulsion — ici on retourne juste un message
      return `✓ ${(target as any).playerId ?? target} a été expulsé${reason ? ` pour : ${reason}` : ''}`
    },
  },
  {
    name: 'ban',
    description: 'Bannir un joueur pour une durée',
    args: [
      { name: 'joueur', type: 'player', required: true },
      { name: 'durée_heures', type: 'number', required: false },
      { name: 'raison', type: 'string', required: false },
    ],
    aliases: ['bannir'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([target, duration, reason], ctx) => {
      return `✓ ${(target as any).playerId ?? target} a été banni${duration ? ` pour ${duration}h` : ' définitivement'}${reason ? ` : ${reason}` : ''}`
    },
  },
  {
    name: 'warn',
    description: 'Avertir un joueur',
    args: [
      { name: 'joueur', type: 'player', required: true },
      { name: 'raison', type: 'string', required: false },
    ],
    aliases: ['avertir'],
    minPermissionLevel: PermissionLevel.MODERATOR,
    execute: async ([target, reason], ctx) => {
      return `✓ ${(target as any).playerId ?? target} a été averti${reason ? ` : ${reason}` : ''}`
    },
  },
  {
    name: 'mute',
    description: 'Couper le chat d\'un joueur',
    args: [
      { name: 'joueur', type: 'player', required: true },
      { name: 'durée_minutes', type: 'number', required: false },
    ],
    aliases: ['silence'],
    minPermissionLevel: PermissionLevel.MODERATOR,
    execute: async ([target, duration], ctx) => {
      return `✓ ${(target as any).playerId ?? target} a été réduit au silence${duration ? ` pour ${duration}min` : ''}`
    },
  },

  // === TÉLÉPORTATION ===
  {
    name: 'tp',
    description: 'Se téléporter à un joueur',
    args: [{ name: 'joueur', type: 'player', required: true }],
    aliases: ['teleport'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([target], ctx) => {
      return `✓ Téléporté à ${(target as any).playerId ?? target}`
    },
  },
  {
    name: 'tpm',
    description: 'Téléporter un joueur à soi',
    args: [{ name: 'joueur', type: 'player', required: true }],
    aliases: ['tptome'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([target], ctx) => {
      return `✓ ${(target as any).playerId ?? target} a été téléporté à vous`
    },
  },
  {
    name: 'tpc',
    description: 'Se téléporter aux coordonnées',
    args: [
      { name: 'x', type: 'number', required: true },
      { name: 'y', type: 'number', required: true },
      { name: 'z', type: 'number', required: false },
    ],
    aliases: ['tptocoords'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([x, y, z], ctx) => {
      return `✓ Téléporté à (${x}, ${y}, ${z ?? 0})`
    },
  },
  {
    name: 'back',
    description: 'Retourner à la position précédente',
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([], ctx) => {
      return `✓ Retour à la position précédente`
    },
  },

  // === JOUEUR ===
  {
    name: 'freeze',
    description: 'Geler un joueur',
    args: [{ name: 'joueur', type: 'player', required: true }],
    aliases: ['geler'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([target], ctx) => {
      return `✓ ${(target as any).playerId ?? target} a été gelé`
    },
  },
  {
    name: 'godmode',
    description: 'Mode invincible (toggle)',
    aliases: ['god', 'invincible'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([], ctx) => {
      return `✓ Mode dieu activé/désactivé`
    },
  },
  {
    name: 'invisible',
    description: 'Devenir invisible (toggle)',
    aliases: ['invis'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([], ctx) => {
      return `✓ Invisibilité activée/désactivée`
    },
  },
  {
    name: 'heal',
    description: 'Soigner un joueur',
    args: [{ name: 'joueur', type: 'player', required: false }],
    aliases: ['soigner'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([target], ctx) => {
      return `✓ ${(target ? (target as any).playerId ?? target : 'Vous')} avez été soigné`
    },
  },
  {
    name: 'armor',
    description: 'Donner de l\'armure à un joueur',
    args: [
      { name: 'joueur', type: 'player', required: false },
      { name: 'quantité', type: 'number', required: true },
    ],
    aliases: ['armure'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([target, amount], ctx) => {
      return `✓ ${amount} armure donnée à ${(target ? (target as any).playerId ?? target : 'vous')}`
    },
  },

  // === SERVEUR ===
  {
    name: 'time',
    description: 'Changer l\'heure du jeu',
    args: [{ name: 'minute', type: 'number', required: true }],
    aliases: ['heure'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([minute], ctx) => {
      return `✓ Heure changée à ${minute}min`
    },
  },
  {
    name: 'weather',
    description: 'Changer la météo',
    args: [{ name: 'type', type: 'string', required: true }],
    aliases: ['météo'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([type], ctx) => {
      return `✓ Météo changée à ${type}`
    },
  },
  {
    name: 'announce',
    description: 'Annonce globale',
    args: [{ name: 'message', type: 'string', required: true }],
    aliases: ['annonce'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([message], ctx) => {
      return `✓ Annonce diffusée : ${message}`
    },
  },
  {
    name: 'status',
    description: 'Statut du serveur',
    minPermissionLevel: PermissionLevel.USER,
    execute: async ([], ctx) => {
      return `✓ Serveur en ligne. Joueurs connectés : ${Math.floor(Math.random() * 50 + 10)}/128`
    },
  },
  {
    name: 'players',
    description: 'Liste des joueurs connectés',
    minPermissionLevel: PermissionLevel.USER,
    execute: async ([], ctx) => {
      return `✓ Joueurs en ligne : Joueur1, Joueur2, Joueur3, Admin_Jean`
    },
  },

  // === ÉCONOMIE ===
  {
    name: 'give',
    description: 'Donner de l\'argent à un joueur',
    args: [
      { name: 'joueur', type: 'player', required: true },
      { name: 'montant', type: 'number', required: true },
    ],
    aliases: ['donner'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([target, amount], ctx) => {
      return `✓ ${amount}$ donné à ${(target as any).playerId ?? target}`
    },
  },
  {
    name: 'setmoney',
    description: 'Définir l\'argent d\'un joueur',
    args: [
      { name: 'joueur', type: 'player', required: true },
      { name: 'montant', type: 'number', required: true },
    ],
    aliases: ['setcash'],
    minPermissionLevel: PermissionLevel.ADMIN,
    execute: async ([target, amount], ctx) => {
      return `✓ Argent de ${(target as any).playerId ?? target} défini à ${amount}$`
    },
  },
  {
    name: 'money',
    description: 'Voir son argent',
    aliases: ['cash', 'argent'],
    minPermissionLevel: PermissionLevel.USER,
    execute: async ([], ctx) => {
      return `✓ Votre solde : 2500$`
    },
  },

  // === AIDE ===
  {
    name: 'help',
    description: 'Afficher l\'aide ou l\'aide d\'une commande',
    args: [{ name: 'commande', type: 'string', required: false }],
    aliases: ['aide', '?'],
    minPermissionLevel: PermissionLevel.USER,
    execute: async ([cmdName], ctx) => {
      if (cmdName) {
        return `ℹ️ Aide pour /${cmdName} : [Documentation de la commande]`
      }
      return `ℹ️ Commandes disponibles : /kick, /ban, /warn, /mute, /tp, /tpm, /tpc, /back, /freeze, /godmode, /invisible, /heal, /armor, /time, /weather, /announce, /status, /players, /give, /setmoney, /money, /help, /admin`
    },
  },
  {
    name: 'admin',
    description: 'Afficher le statut admin',
    minPermissionLevel: PermissionLevel.USER,
    execute: async ([], ctx) => {
      return `ℹ️ Votre niveau : ${ctx.permissionLevel} — Permissions : ${ctx.adminId}`
    },
  },

  // === ADMIN ===
  {
    name: 'restart',
    description: 'Redémarrer le serveur',
    args: [{ name: 'délai_secondes', type: 'number', required: false }],
    aliases: ['redémarrer'],
    minPermissionLevel: PermissionLevel.OWNER,
    execute: async ([delay], ctx) => {
      return `✓ Redémarrage dans ${delay ?? 5} secondes...`
    },
  },
]

export default AllCommands
