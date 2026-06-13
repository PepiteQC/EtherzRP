# EtherWorld — Arcane Shader Tree / Baked Room Preview

Date: 2026-06-11

## Objectif
Adapter les idées envoyées :

- Tree shader avec feuilles instanciées, bruit triplanar, interaction raycast/pointeur, feuilles qui tombent.
- Baked room GLTF + baked texture, mais en version React Three Fiber compatible EtherWorld.

## Fichiers créés

```txt
src/plugins/arcane/effects/ArcaneShaderTree.tsx
src/plugins/arcane/loaders/BakedRoomPreview.tsx
src/plugins/arcane/index.ts
```

## Fichier modifié

```txt
src/components/etherworld/WorldBeef.tsx
```

## ArcaneShaderTree

Version propre React Three Fiber du shader d'arbre.

Caractéristiques :

- `InstancedMesh` pour les feuilles.
- Géométrie de feuille procédurale.
- Texture noise procédurale locale, pas besoin d'URL externe.
- Shader GLSL corrigé et compatible Three/R3F.
- Uniforms :
  - `uTime`
  - `uRaycast`
  - `uNoiseMap`
  - `uColorA/B/C`
  - `uArcaneColor`
  - `uArcanePulse`
  - `uPointerStrength`
- Interaction pointeur : les feuilles proches sont poussées/illuminées.
- Feuilles qui tombent avec animation individuelle.
- `userData` :

```ts
{ type: 'arcane_shader_tree', mutableByArcane: true }
```

## Bosquet arcane intégré

Dans `WorldBeef.tsx`, ajout d'un bosquet arcane dans EtherWorld City :

```txt
ArcaneShaderTree x3
```

Avec couleurs différentes :

- cyan arcane
- violet arcane
- vert nature

## BakedRoomPreview

Composant préparé pour charger une scène GLTF baked :

```tsx
<BakedRoomPreview modelUrl="..." textureUrl="..." />
```

Mais avec fallback local si les URLs ne chargent pas, car la preview Arena peut bloquer le réseau.

Caractéristiques :

- GLTFLoader via `three/addons/loaders/GLTFLoader.js`
- Texture baked avec `SRGBColorSpace`
- `MeshBasicMaterial` double side
- fallback room procédurale si pas d'asset

## Vérification

```bash
npm run build
```

Résultat :

```txt
✓ built
```

Vérifications ciblées :

```bash
npx esbuild src/plugins/arcane/effects/ArcaneShaderTree.tsx --bundle ...
npx esbuild src/plugins/arcane/loaders/BakedRoomPreview.tsx --bundle ...
```

Résultat : OK.

## Notes importantes

Le code original contenait des artefacts Markdown comme :

```txt
[combined.xyz](http://combined.xyz)
```

et dépendait d'assets distants. J'ai donc converti l'idée en composant natif EtherWorld, sans dépendance obligatoire aux URLs externes.
