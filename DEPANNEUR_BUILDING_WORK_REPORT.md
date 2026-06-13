# EtherWorld-Official-PC — Travail dépanneur/buildings

Date: 2026-06-11

## Objectif
Travailler les dossiers :

```txt
src/buildings/depanneur/core
src/buildings/depanneur/scenes
```

avec une base propre pour :

- Three.js
- React Three Fiber
- Node.js / Firebase-ready
- Architecture indépendante de l'hôtel
- Données stables pour Firestore

## Fichiers créés

```txt
src/buildings/depanneur/core/DepanneurTypes.ts
src/buildings/depanneur/core/DepanneurFirebase.ts
src/buildings/depanneur/core/index.ts
src/buildings/depanneur/scenes/DepanneurInteriorScene.tsx
src/buildings/depanneur/scenes/index.ts
src/buildings/depanneur/index.ts
```

## Fichiers enrichis/réécrits

```txt
src/buildings/depanneur/core/DepanneurRegistry.ts
src/buildings/depanneur/scenes/DepanneurScene.tsx
src/buildings/index.ts
```

## Core ajouté

Le nouveau `DepanneurRegistry` contient maintenant :

- `DEPANNEUR_BUILDING`
- `DEPANNEUR_ZONES`
- `DEPANNEUR_FIXTURES`
- `DEPANNEUR_INVENTORY`
- `DEPANNEUR_CAMERAS`
- `DepanneurRegistry`
- helpers :
  - `getDepanneurBuilding()`
  - `getDepanneurZone(id)`
  - `getDepanneurFixture(id)`
  - `toFirebaseSeed()`

## Firebase-ready

Ajout de :

```txt
src/buildings/depanneur/core/DepanneurFirebase.ts
```

Avec :

- chemins collections dépanneur
- seed sérialisable Firebase
- patch inventaire
- event de vente
- politique anti-casse : pas d'écriture client sensible directe

## Scène 3D ajoutée

`DepanneurScene.tsx` est maintenant une scène 3D complète avec :

- bâtiment indépendant
- stationnement
- pompes à essence
- portes vitrées animées
- vitrines
- enseigne néon
- rayons produits
- frigos boissons
- comptoir caisse
- machines café/slush/hotdog/ATM/loto
- zone livraison
- déchets/recyclage
- caméras de sécurité animées
- lumières intérieures/extérieures
- zones debug optionnelles
- `userData` sur fixtures/zones pour IDs Firebase et interactions

## Scène intérieure

Ajout de :

```txt
DepanneurInteriorScene.tsx
```

Elle permet d'utiliser le dépanneur comme scène intérieure isolée pour les transitions RP.

## Vérifications

```bash
npm run build
```

Résultat :

```txt
✓ built
```

Vérification ciblée esbuild :

```bash
npx esbuild src/buildings/depanneur/scenes/DepanneurScene.tsx --bundle ...
npx esbuild src/buildings/depanneur/core/DepanneurFirebase.ts --bundle ...
```

Résultat : OK.
