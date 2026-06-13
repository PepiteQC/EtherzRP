# EtherWorld-Official-PC — Réorganisation `src/components`

## Correction effectuée

Les fichiers principaux qui étaient directement dans `src/components` ont été déplacés dans `src/components/etherworld`, parce qu'ils représentent le cœur du monde EtherWorld et ne doivent pas rester éparpillés à la racine du dossier components.

## Fichiers déplacés vers `src/components/etherworld`

```txt
Buildings.tsx
CinematicIntro.tsx
EtherWorldCity.tsx
Game.tsx
HUD.tsx
InteriorScene.tsx
QuebecCity.tsx
Road.tsx
Sky.tsx
Terrain.tsx
Trees.tsx
Vehicle.tsx
Walker.tsx
WorldBeef.tsx
```

## Fichier UI déplacé

```txt
src/components/hud/GameHUD.tsx
→ src/components/etherworld/ui/GameHUD.tsx

`GameHUD` a aussi été adapté pour utiliser `src/components/etherworld/world-store.ts` au lieu d'un store incompatible.
```

## Barrel créé

```txt
src/components/etherworld/index.ts
```

Shim utilitaire ajouté pour les imports UI existants :

```txt
src/lib/utils.ts
```

Il exporte les composants principaux du monde EtherWorld :

```ts
Game
HUD
Terrain
Road
Trees
Buildings
QuebecCity
EtherWorldCity
Vehicle
Walker
Sky
CinematicIntro
InteriorScene
WorldBeef
GameHUD
```

## Imports corrigés

`src/App.tsx` utilise maintenant le barrel EtherWorld :

```ts
import { Game, HUD } from './components/etherworld'
```

Les imports internes ont été corrigés après le déplacement :

```txt
../hooks        → ../../hooks
../data         → ../../data
../store        → ../../store
../utils        → ../../utils
./hotel         → ../hotel
./roads         → ../roads
```

## Fichiers encore organisés par domaine

Les dossiers spécialisés restent séparés parce qu'ils sont des modules/domaines :

```txt
src/components/AdminConsole
src/components/Communication
src/components/Jobs
src/components/corridor
src/components/depanneur
src/components/hotel
src/components/hotel-ultra
src/components/kinect
src/components/player
src/components/roads
src/components/world
```

Ceux qui ont affaire directement à EtherWorld peuvent ensuite être migrés progressivement sous :

```txt
src/components/etherworld/admin
src/components/etherworld/communication
src/components/etherworld/jobs
src/components/etherworld/hotel
src/components/etherworld/world
```

mais seulement après correction de leurs imports et dépendances pour ne pas casser le build.

## Vérification

Commande exécutée :

```bash
npm run build
```

Résultat :

```txt
✓ built
```

Le build production Vite passe après la réorganisation.
