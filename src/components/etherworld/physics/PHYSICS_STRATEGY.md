# EtherzRP — Stratégie physique

But: garder une physique stable et évolutive sans casser le personnage, le véhicule et les systèmes déjà en place.

## Choix moteur

### Nouveau code EtherzRP

Utiliser **Rapier** via `@react-three/rapier`.

Raisons:

- déjà présent dans `package.json` du projet;
- moteur WASM performant;
- activement maintenu;
- adapté aux rigid bodies, colliders, sensors, triggers, véhicules futurs et personnages;
- meilleure fondation long terme que Cannon pour un jeu RP.

### Ancien code / compatibilité

Le repo contient encore des composants qui importent `@react-three/cannon`:

- `src/core/GameScene.tsx`
- `src/core/DynamicTerrain.tsx`
- `src/components/PlayerController.tsx`

On ne les supprime pas maintenant pour éviter de casser du legacy. Par contre, les nouveaux systèmes doivent passer par:

```txt
src/components/etherworld/physics/EtherPhysics.tsx
src/components/etherworld/physics/WorldPhysicsColliders.tsx
```

## Règle importante

Ne pas mélanger deux mondes physiques dans la même scène gameplay active.

- Le monde principal EtherWorld utilise `EtherPhysics` → Rapier.
- Les anciens composants Cannon restent legacy tant qu'ils ne sont pas migrés.

## Approche technique

1. Colliders fixes du monde:
   - sol;
   - routes;
   - bâtiments interactifs;
   - props statiques.

2. Véhicule actuel:
   - garde le contrôleur arcade existant;
   - collisions gameplay simples déjà en place;
   - sera migré plus tard vers un body Rapier hybride.

3. Personnage:
   - ne pas modifier sans demande explicite;
   - le système gait/blessures existe, mais le personnage visuel actuel doit rester respecté.

4. Future évolution:
   - sensors de garage/portes;
   - véhicule Rapier hybride;
   - objets poussables;
   - coffre/loot physique;
   - zones trigger police/jobs.

## Pourquoi pas les addons Three.js directement?

Les addons Three.js (`AmmoPhysics`, `JoltPhysics`, `RapierPhysics`) sont bons pour prototypes rapides, mais dans React Three Fiber, `@react-three/rapier` donne une intégration plus naturelle et maintenable.
