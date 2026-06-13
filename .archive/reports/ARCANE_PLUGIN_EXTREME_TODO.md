# EtherWorld Arcane Plugin System — TODO Extrême

Date: 2026-06-11  
Stack: Three.js · React · Node.js · Firebase · EtherWorld-Official-PC

## Vision
Créer un système de plugins inventé de toute pièce pour EtherWorld, réservé au propriétaire/creator/admin principal, permettant de lancer des commandes incroyables en jeu : magie arcane, manipulation de l'environnement, terre vivante, arbres réactifs, glyphes, rituels, effets persistants synchronisés Firebase temps réel.

But: transformer le monde en un terrain vivant contrôlable par commandes dédiées.

---

# 0. Principes intouchables

## 0.1 Owner-only
Toutes les commandes arcaniques doivent être réservées au propriétaire.

- Pas accessibles aux joueurs normaux.
- Pas accessibles par simple client spoof.
- Validation côté Node.js/Firebase Functions.
- Les effets critiques passent par Cloud Functions ou serveur Node.
- Le client React/Three.js ne fait que rendre/visualiser et demander.

## 0.2 Anti-casse
Aucun plugin ne doit casser le monde principal.

- Feature flags.
- Isolation par namespaces.
- Fallback si Firebase offline.
- Nettoyage mémoire Three.js.
- Aucun effet permanent sans journal.
- Toutes les commandes doivent être auditables.

## 0.3 Monde vivant
La magie ne doit pas être juste des particules : elle doit modifier le comportement visuel et logique du monde.

Exemples :

- Arbres qui plient vers le joueur.
- Racines qui sortent du sol.
- Terre qui se fissure.
- Roches qui montent.
- Cercles runiques qui restent quelques minutes.
- Portails qui changent la lumière locale.
- Brouillard arcane qui suit une zone.
- Sol qui garde une trace d'énergie.

---

# 1. Architecture globale plugins

Créer :

```txt
src/plugins/
  index.ts
  types.ts
  PluginRegistry.ts
  PluginRuntime.ts
  PluginCommandBus.ts
  PluginPermissions.ts
  PluginAudit.ts
  arcane/
    ArcanePlugin.ts
    ArcaneTypes.ts
    ArcaneCommands.ts
    ArcaneRuntime.ts
    ArcaneFirebase.ts
    ArcaneMaterials.ts
    ArcaneShaders.ts
    effects/
      EarthRiseEffect.tsx
      TreeBendEffect.tsx
      RootSnareEffect.tsx
      ArcaneGlyphEffect.tsx
      StoneCircleEffect.tsx
      NaturePulseEffect.tsx
      TerrainCrackEffect.tsx
      ForestAwakeningEffect.tsx
    systems/
      EarthMagicSystem.ts
      TreeMagicSystem.ts
      RitualSystem.ts
      ArcaneWeatherSystem.ts
      EnvironmentMutationSystem.ts
```

## 1.1 Types principaux

Créer un type plugin :

```ts
interface EtherWorldPlugin {
  id: string
  name: string
  version: string
  ownerOnly: boolean
  commands: PluginCommand[]
  install(runtime: PluginRuntime): void
  uninstall(runtime: PluginRuntime): void
}
```

Créer un type commande :

```ts
interface PluginCommand {
  id: string
  aliases: string[]
  description: string
  ownerOnly: boolean
  argsSchema: unknown
  execute(ctx: PluginCommandContext): Promise<PluginCommandResult>
}
```

## 1.2 Runtime côté client

Le runtime client doit :

- Recevoir les effets Firebase temps réel.
- Monter/démonter les effets Three.js.
- Pooler les particules.
- Nettoyer geometries/materials/textures.
- Prioriser les effets proches du joueur.
- Dégrader les effets sur low-end device.

## 1.3 Runtime côté serveur Node/Firebase

Le runtime serveur doit :

- Valider owner UID.
- Valider arguments.
- Enregistrer audit logs.
- Publier effets dans Firestore/Realtime Database.
- Appliquer TTL.
- Nettoyer effets expirés.

---

# 2. Firebase collections

Créer collections dédiées :

```txt
arcane_commands
arcane_effects
arcane_rituals
arcane_audit_logs
arcane_owner_permissions
arcane_world_mutations
arcane_environment_snapshots
```

## 2.1 arcane_effects

Document type :

```ts
interface ArcaneEffectDoc {
  id: string
  type: ArcaneEffectType
  casterUid: string
  casterName: string
  position: [number, number, number]
  radius: number
  intensity: number
  durationMs: number
  createdAt: Timestamp
  expiresAt: Timestamp
  payload: Record<string, unknown>
  status: 'active' | 'expired' | 'cancelled'
}
```

## 2.2 arcane_audit_logs

Append-only :

```ts
interface ArcaneAuditLog {
  id: string
  command: string
  casterUid: string
  args: Record<string, unknown>
  accepted: boolean
  reason?: string
  createdAt: Timestamp
  serverTimeMs: number
}
```

---

# 3. Commandes owner-only inventées

Préfixe principal :

```txt
/arcane
```

Alias rapide :

```txt
/a
```

## 3.1 Commandes terre

### `/arcane earth rise`
Fait monter des piliers de terre autour du joueur.

Args :

```txt
radius: number
height: number
count: number
duration: number
```

Effet :

- cylindres/rochers procéduraux sortent du sol.
- poussière volumétrique.
- onde de choc au sol.
- légère vibration caméra.

### `/arcane earth wall`
Crée un mur de terre temporaire.

Args :

```txt
length
height
curve
```

Effet :

- mur segmenté suivant la direction du joueur.
- collision future possible.
- shader sol boueux.

### `/arcane earth crack`
Fissure le sol devant le joueur.

Effet :

- texture decal procédurale.
- lignes rouges/or arcane dans les fissures.
- petites pierres projetées.

### `/arcane earth sink`
Affaisse une zone.

Effet :

- anneaux concentriques.
- terrain visuellement abaissé via mesh overlay.
- poussière.

---

# 4. Commandes arbres / nature

## 4.1 `/arcane trees awaken`
Réveille tous les arbres autour.

Effet :

- arbres qui se penchent vers le caster.
- feuillage lumineux.
- particules pollen arcane.
- son futur : grondement forêt.

## 4.2 `/arcane trees bend`
Force les arbres à se courber dans une direction.

Args :

```txt
direction: north/east/south/west/player
radius
strength
```

Effet :

- animation sur groupes arbres existants.
- shader vent magique.

## 4.3 `/arcane roots snare`
Fait sortir des racines du sol.

Effet :

- courbes TubeGeometry.
- racines qui poussent vers une cible.
- aura verte/noire.

## 4.4 `/arcane forest circle`
Crée un cercle rituel avec arbres.

Effet :

- apparition d'arbres en cercle.
- runes au sol.
- lumière centrale.
- portail possible phase future.

---

# 5. Commandes environnement

## 5.1 `/arcane weather mist`
Crée un brouillard local.

Effet :

- particules alpha.
- fog local fake.
- couleur configurable.

## 5.2 `/arcane sky omen`
Change le ciel localement.

Effet :

- lune arcane.
- ciel violet.
- éclairs silencieux.

## 5.3 `/arcane gravity pulse`
Onde gravitationnelle.

Effet :

- props qui flottent visuellement.
- arbres/objets qui oscillent.
- particules en spirale.

---

# 6. Commandes rituels complexes

## 6.1 `/arcane ritual begin`
Commence un rituel persistant.

Args :

```txt
ritualType: forest_gate | earth_crown | storm_seed
radius
```

Étapes :

1. Créer cercle runique.
2. Enregistrer rituel Firebase.
3. Synchroniser avec tous les clients.
4. Attendre canalisations successives.
5. Déclencher effet final.

## 6.2 `/arcane ritual channel`
Ajoute de l'énergie au rituel.

## 6.3 `/arcane ritual release`
Déclenche l'effet final.

Exemples finaux :

- forêt qui pousse instantanément.
- portail de racines.
- couronne de pierres flottantes.
- tempête arcane.

---

# 7. Effets Three.js requis

## 7.1 EarthRiseEffect

Techniques :

- InstancedMesh pour roches.
- Animation scale Y.
- Perlin/simple noise pour positions.
- Particules poussière.
- Material terre procédural.

## 7.2 TreeBendEffect

Techniques :

- Identifier arbres existants dans scene graph via `userData.type = 'tree'`.
- Animation rotation quaternion.
- Retour progressif.
- Option shader leaf glow.

## 7.3 RootSnareEffect

Techniques :

- CatmullRomCurve3.
- TubeGeometry.
- Croissance via drawRange ou mesh scale.
- Petites branches secondaires.

## 7.4 ArcaneGlyphEffect

Techniques :

- CanvasTexture rune.
- Plane au sol.
- Rotation lente.
- Additive blending.
- Pulsation opacity.

## 7.5 TerrainCrackEffect

Techniques :

- Decal-like plane transparent.
- Texture canvas fissure générée.
- Emissive cracks.
- Durée + fade-out.

---

# 8. Intégration au monde existant

## 8.1 Marquer les arbres existants

Dans :

```txt
src/components/etherworld/Trees.tsx
```

Ajouter `userData` :

```tsx
<group userData={{ type: 'tree', treeId }}>
```

## 8.2 Marquer le terrain

Dans :

```txt
src/components/etherworld/Terrain.tsx
```

Ajouter :

```tsx
userData={{ type: 'terrain', mutableByArcane: true }}
```

## 8.3 Ajouter ArcaneRuntime dans Game.tsx

Dans :

```txt
src/components/etherworld/Game.tsx
```

Ajouter dans Canvas :

```tsx
<ArcaneRuntime />
```

## 8.4 HUD commandes owner

Créer :

```txt
src/plugins/arcane/ui/ArcaneCommandPalette.tsx
```

Ouvrir avec :

```txt
F8 ou / dans chat admin
```

---

# 9. Node.js / Firebase Functions

Créer :

```txt
functions/src/arcane/arcaneCommands.ts
functions/src/arcane/arcanePermissions.ts
functions/src/arcane/arcaneCleanup.ts
functions/src/arcane/index.ts
```

## 9.1 Callable function

```ts
export const castArcaneCommand = onCall(async (request) => {
  // validate auth
  // validate owner UID
  // validate command schema
  // write audit
  // write arcane_effects
})
```

## 9.2 Cleanup scheduled function

```ts
export const cleanupExpiredArcaneEffects = onSchedule('every 5 minutes', async () => {})
```

## 9.3 Sécurité

- Owner UID dans env/config.
- Jamais faire confiance au client.
- Rate limit.
- Audit append-only.
- TTL effets.

---

# 10. Command parser

Créer :

```txt
src/plugins/PluginCommandBus.ts
```

Features :

- parsing strings
- aliases
- permissions
- suggestions
- history
- autocomplete

Exemple :

```txt
/arcane earth rise radius=12 height=4 count=18 duration=9000
/a trees awaken r=45 strength=0.8
/a roots snare target=nearest radius=25
```

---

# 11. UI propriétaire

Créer :

```txt
src/plugins/arcane/ui/ArcaneOwnerPanel.tsx
```

Sections :

- Command line
- Presets
- Active effects
- Rituals
- Audit logs
- Performance meter
- Emergency cleanup

Boutons :

```txt
Éteindre tous les effets
Nettoyer particules
Annuler rituel
Reset environnement local
Synchroniser Firebase
```

---

# 12. Presets magiques

## Preset 1 — La Forêt se Réveille

Commande :

```txt
/a preset forest_awaken
```

Effets combinés :

- trees awaken
- roots snare light
- green mist
- glyph circle

## Preset 2 — Couronne de Terre

```txt
/a preset earth_crown
```

Effets :

- earth rise en cercle
- stone circle flottant
- terrain crack léger

## Preset 3 — Jugement Ancien

```txt
/a preset ancient_judgement
```

Effets :

- ciel violet
- fissures rouges
- arbres courbés
- onde gravité

---

# 13. Performance extrême

À faire :

- InstancedMesh pour roches/feuilles.
- Object pooling particules.
- LOD selon distance caméra.
- Max effects simultanés.
- Auto cleanup.
- GPU-friendly materials.
- Pas de nouvelles textures chaque frame.
- Dispose obligatoire.

---

# 14. Tests

## Client

- lancer 1 effet
- lancer 10 effets
- cleanup
- refresh page et restore Firebase
- multi-tab sync
- low-end mode

## Serveur

- owner accepted
- non-owner denied
- malformed args denied
- audit created
- expired effects cleanup

## Gameplay

- arbres existants réagissent
- terrain reçoit glyphes/fissures
- effets ne bloquent pas conduite/marche
- pas de crash si arbre/terrain absent

---

# 15. Phases de développement

## Phase 1 — Fondation plugin

- `src/plugins/types.ts`
- `PluginRegistry`
- `PluginRuntime`
- `PluginCommandBus`
- `PluginPermissions`

## Phase 2 — ArcaneRuntime client

- écoute Firebase/mock local
- monte effets actifs
- cleanup
- debug overlay

## Phase 3 — Premiers effets

- ArcaneGlyphEffect
- EarthRiseEffect
- TreeBendEffect

## Phase 4 — Commandes owner

- `/arcane earth rise`
- `/arcane trees awaken`
- `/arcane roots snare`

## Phase 5 — Firebase Functions

- callable command
- audit logs
- effect writes
- cleanup scheduled

## Phase 6 — Rituels

- begin/channel/release
- effects combinés
- persistence

## Phase 7 — UI propriétaire

- command palette
- active effects list
- emergency cleanup

## Phase 8 — Polish fou

- shaders
- sounds hooks
- caméra shake
- presets
- cinematic mode

---

# 16. Première commande à coder

Priorité :

```txt
/arcane earth rise radius=12 height=4 count=18 duration=9000
```

Pourquoi :

- Elle valide PluginCommandBus.
- Elle valide ArcaneRuntime.
- Elle valide effet Three.js.
- Elle valide cleanup.
- Elle donne un résultat visuel immédiat.

Ensuite :

```txt
/arcane trees awaken radius=50 strength=0.8 duration=12000
```

---

# 17. Définition de réussite

Le système est réussi quand :

1. Le propriétaire tape une commande.
2. Le serveur valide owner-only.
3. Firebase publie un effet.
4. Tous les clients voient la magie.
5. Les arbres/terrain réagissent vraiment.
6. L'effet expire proprement.
7. Le journal garde la trace.
8. Aucun joueur normal ne peut lancer la commande.
9. Le build reste valide.
10. Les effets sont beaux, violents, propres, uniques à EtherWorld.

---

# 18. Mantra de développement

On ne colle pas un mini-jeu à côté.  
On forge un système magique propriétaire directement branché au monde EtherWorld.

Chaque effet doit être :

- beau
- contrôlable
- synchronisé
- nettoyable
- sécurisé
- extensible
- digne d'un monde RP vivant
