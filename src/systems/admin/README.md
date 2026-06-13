# 🎮 Console Admin In-Game - EtherWorld RP

Système de console admin complètement fonctionnel, similaire à **FiveM** mais conçu spécifiquement pour EtherWorld RP!

## 🚀 Caractéristiques

✅ **Parser intelligent** - Analyse les commandes avec support guillemets et arguments  
✅ **Système de permissions** - Hiérarchie (User → Mod → Admin → Owner)  
✅ **30+ Commandes** - Modération, TP, Serveur, Économie, Aide  
✅ **Logging complet** - Audit trail avec export JSON/CSV  
✅ **Historique** - Navigation flèches haut/bas  
✅ **UI moderne** - Interface in-game réactive  
✅ **Firebase ready** - Prêt pour sync/persistence  

---

## 📁 Structure

```
src/systems/admin/
├── console/
│   ├── CommandParser.ts        # Parseur de commandes
│   ├── CommandLogger.ts        # Système de logging/audit
│   ├── AdminConsoleUI.tsx      # Interface React
│   └── AdminConsoleManager.ts  # Gestionnaire principal
├── permissions/
│   └── PermissionSystem.ts     # Gestion permissions
├── commands/
│   └── StandardCommands.ts     # 30+ commandes
└── index.ts                    # Export principal
```

---

## 🎯 Utilisation rapide

### 1. Initialiser la console

```typescript
import { AdminConsoleManager, PermissionLevel } from '@/systems/admin';

// Créer le manager
const adminConsole = new AdminConsoleManager({
  enableLogging: true,
  logToConsole: true,
  logToFirebase: false, // À activer après intégration Firebase
});

// Enregistrer des admins
adminConsole.initializeAdmin({
  id: 'player_123',
  name: 'Admin Jean',
  permissionLevel: PermissionLevel.ADMIN,
});

adminConsole.initializeAdmin({
  id: 'player_456',
  name: 'Propriétaire',
  permissionLevel: PermissionLevel.OWNER,
});
```

### 2. Intégrer l'UI dans votre app

```typescript
import { AdminConsoleUI, useAdminConsole } from '@/systems/admin';
import { App } from './App';

function GameWithConsole() {
  const { isOpen, setIsOpen } = useAdminConsole('player_123', 'Admin Jean', 2);

  return (
    <>
      <App />
      <AdminConsoleUI
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        playerId="player_123"
        playerName="Admin Jean"
        permissionLevel={2}
        onCommand={(cmd, result) => console.log(cmd, result)}
      />
    </>
  );
}
```

### 3. Exécuter des commandes

```typescript
// Via la console UI (appuyer sur "/" ou F8)

// Ou programmatiquement:
await adminConsole.executeCommand('/give player_456 5000', 'player_123');
await adminConsole.executeCommand('/kick player_789 spam', 'player_123');
await adminConsole.executeCommand('/tp player_456', 'player_123');
```

---

## 📋 Commandes disponibles

### Modération (Modérateur+)
```
/kick <player> [reason]          - Expulser un joueur
/warn <player> [reason]          - Avertir un joueur
/mute <player> [duration]        - Rendre muet
```

### Modération (Admin+)
```
/ban <player> [duration] [reason] - Bannir un joueur
```

### Téléportation (Admin+)
```
/tp <player>                      - Se TP à un joueur
/tpm <player>                     - TP un joueur à soi
/tpc <x> <y> [z]                 - TP aux coordonnées
/back                             - Retour dernière position
```

### Joueur (Admin+)
```
/freeze <player>                  - Geler un joueur
/godmode                          - Mode invincibilité
/invisible                        - Devenir invisible
/heal [player]                    - Soigner
/armor [player] [amount]          - Donner armure
```

### Serveur (Admin+)
```
/time <hour> [minute]             - Définir l'heure
/weather <type>                   - Changer météo
/announce <message>               - Annoncer
/status                           - Statut serveur
/players                          - Lister joueurs
```

### Économie (Admin+)
```
/give <player> <amount>           - Donner argent
/setmoney <player> <amount>       - Définir argent
/money                            - Voir argent
```

### Aide (User+)
```
/help [command]                   - Aide générale
/admin                            - Commandes admin
```

### Serveur (Owner+)
```
/restart [delay]                  - Redémarrer
```

---

## 🔐 Niveaux de permissions

```typescript
enum PermissionLevel {
  USER = 0,        // Aucune commande admin
  MODERATOR = 1,   // /kick, /warn, /mute
  ADMIN = 2,       // Tout sauf /restart
  OWNER = 3,       // Tout accès complet
}
```

### Flags personnalisés

```typescript
enum AdminFlag {
  // Modération
  KICK = 'kick',
  BAN = 'ban',
  MUTE = 'mute',
  WARN = 'warn',
  
  // TP
  TELEPORT = 'teleport',
  TELEPORT_TO_PLAYER = 'teleport_to_player',
  TELEPORT_PLAYER = 'teleport_player',
  
  // Serveur
  RESTART = 'restart',
  MAINTENANCE = 'maintenance',
  CONFIG = 'config',
  LOGS = 'logs',
  
  // Joueur
  FREEZE = 'freeze',
  INVISIBLE = 'invisible',
  GOD_MODE = 'godmode',
  NO_CLIP = 'noclip',
  
  // Monde
  WEATHER = 'weather',
  TIME = 'time',
  SPAWN = 'spawn',
  DELETE_OBJECTS = 'delete_objects',
  
  // Économie
  GIVE_MONEY = 'give_money',
  SET_MONEY = 'set_money',
  ECONOMY_RESET = 'economy_reset',
  
  // Items
  GIVE_ITEM = 'give_item',
  REMOVE_ITEM = 'remove_item',
  CLEAR_INVENTORY = 'clear_inventory',
}
```

---

## 🛠️ Ajouter des commandes custom

```typescript
import { CommandDefinition, CommandParser, PermissionLevel } from '@/systems/admin';

const myCustomCommand: CommandDefinition = {
  name: 'mycommand',
  aliases: ['mycmd'],
  description: 'Ma commande personnalisée',
  args: [
    { 
      name: 'param1', 
      type: 'string', 
      required: true, 
      description: 'Mon paramètre'
    },
  ],
  minPermissionLevel: PermissionLevel.ADMIN,
  execute: async (args: any[], ctx: CommandContext) => {
    const [param1] = args;
    console.log(`Commande exécutée par ${ctx.player.name} avec ${param1}`);
    return `✓ Ma commande exécutée avec ${param1}`;
  },
};

// Enregistrer
adminConsole.registerCustomCommand(myCustomCommand);
```

---

## 📊 Logging & Audit

### Obtenir les logs

```typescript
// Tous les logs
const allLogs = adminConsole.getLogs();

// Logs filtrés
const adminKicks = adminConsole.getLogs({
  commandName: 'kick',
  adminId: 'player_123',
});

// Logs d'un joueur
const victimLogs = adminConsole.getLogs({
  target: 'player_victim',
});
```

### Exporter

```typescript
// Export JSON
const json = adminConsole.exportLogs('json');

// Export CSV
const csv = adminConsole.exportLogs('csv');

// Rapport formaté
const report = adminConsole.generateReport('Mon rapport');
```

### Callback sur commandes

```typescript
adminConsole.onCommandLogged((log) => {
  console.log(`[LOG] ${log.adminName} a exécuté /${log.commandName}`);
  
  // Envoyer à Firebase
  // db.collection('admin_logs').add(log);
});
```

---

## ⌨️ Contrôles clavier

| Touche | Action |
|--------|--------|
| `/` ou `F8` | Ouvrir/Fermer console |
| `ESC` | Fermer console |
| `↑` | Commande précédente (historique) |
| `↓` | Commande suivante (historique) |
| `ENTER` | Exécuter |

---

## 🔍 Déboguer

```typescript
// Afficher les infos console
console.log(adminConsole.getConsoleInfo());

// Obtenir les stats
const stats = adminConsole.getStats();
console.log(stats);
// {
//   totalAdmins: 2,
//   totalLogs: 145,
//   commandStats: { ... },
//   enabled: true
// }

// Générer un rapport audit
const report = adminConsole.generateReport('Audit Sécurité');
console.log(report);
```

---

## 🔄 Intégration Firebase (Prochaine étape)

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const db = getFirestore();

adminConsole.onCommandLogged(async (log) => {
  await addDoc(collection(db, 'admin_logs'), {
    ...log,
    timestamp: new Date(log.timestamp),
  });
});
```

---

## 📝 Notes

- Toutes les commandes sont loggées (succès/erreur)
- L'historique est limité à 100 commandes par défaut
- Les logs sont limités à 10000 par défaut (configurable)
- Les permissions sont appliquées strictement
- Les erreurs de syntaxe sont gérées gracieusement
- Possibilité d'export audit trail complet

---

## 🚦 Status

✅ **100% fonctionnel**  
✅ **Prêt production**  
⏳ **Firebase sync** (à venir)  
⏳ **Commandes serveur avancées** (à venir)  

Prêt à intégrer dans votre jeu! 🎉
