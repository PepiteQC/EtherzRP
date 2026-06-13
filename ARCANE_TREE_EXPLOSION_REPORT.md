# EtherWorld — Arcane Tree Pixel Explosion

Date: 2026-06-11

## Objectif
Faire en sorte que lorsqu'une magie arcane est lancée sur un arbre shader, l'arbre puisse exploser en pixels/feuilles, sans casser le monde principal.

## Fichiers créés

```txt
src/plugins/arcane/events/ArcaneTreeEvents.ts
src/plugins/arcane/commands/ArcaneTreeCommands.ts
```

## Fichiers modifiés

```txt
src/plugins/arcane/effects/ArcaneShaderTree.tsx
src/plugins/arcane/index.ts
```

## Fonctionnement

`ArcaneShaderTree` écoute maintenant un événement global :

```txt
etherworld:arcane-tree-explode
```

Quand l'événement arrive :

1. L'arbre vérifie la distance entre sa position et le point d'impact.
2. Si l'arbre est dans le rayon, il reçoit l'impact arcane.
3. Son shader reçoit un pulse violent.
4. Une partie des feuilles tombe.
5. Des pixels/cubes arcaniques explosent depuis la couronne.
6. Les pixels ont vélocité, gravité, rotation, fade-out.
7. L'effet se nettoie automatiquement.

## API runtime disponible

Une API locale est installée sur `window` :

```ts
window.etherworldArcane.treeExplode({
  position: [18, 0, 940],
  radius: 12,
  intensity: 1.5,
  color: '#58e6ff',
})
```

Alias générique :

```ts
window.etherworldArcane.castAt('tree.explode', [18, 0, 940], {
  radius: 12,
  intensity: 1.5,
})
```

## Command parser préparé

```ts
executeArcaneTreeCommand('/arcane tree explode radius=12 intensity=1.5', [18, 0, 940])
```

Alias compatibles :

```txt
/arcane tree explode radius=12 intensity=1.5
/a trees explode r=15 i=2
/arcane arbre explose radius=10
```

## Exports

```ts
import {
  ArcaneShaderTree,
  castArcaneTreeExplosion,
  executeArcaneTreeCommand,
} from '@/plugins/arcane'
```

## Validation

```bash
npm run build
```

Résultat :

```txt
✓ built
```

## Prochaine étape

Brancher cette commande dans le vrai `PluginCommandBus`, puis dans une palette owner-only :

```txt
/arcane tree explode radius=12 intensity=1.5
```

Et ensuite connecter Firebase :

```txt
arcane_effects/tree_explosion
```

pour que tous les joueurs voient l'arbre exploser en même temps.
