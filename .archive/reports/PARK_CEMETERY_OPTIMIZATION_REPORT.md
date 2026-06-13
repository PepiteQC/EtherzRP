# EtherWorld — Parc + Cimetière Performance Optimized

Date: 2026-06-11

## Demande
Retirer l'arbre violet / la folie arcane visible du monde principal et créer plutôt une zone RP utile : parc + cimetière.

## Fichier modifié

```txt
src/components/etherworld/WorldBeef.tsx
```

## Retiré du monde principal

- Import `ArcaneShaderTree` retiré de `WorldBeef.tsx`.
- Bosquet arcane expérimental retiré.
- L'arbre violet visible dans la ville n'est plus rendu.

Les fichiers arcane restent disponibles pour un futur admin menu/plugin owner-only, mais ils ne sont plus affichés directement dans la ville.

## Ajouté

### Parc municipal

Composant ajouté dans `WorldBeef.tsx` :

```tsx
<CommunityPark position={[18, 0, 68]} />
```

Contenu :

- pelouse circulaire
- sentiers croisés
- fontaine centrale
- bancs
- arbres sobres
- label au sol `PARC MUNICIPAL`

### Cimetière Saint-Éther

Composant ajouté :

```tsx
<Cemetery position={[-26, 0, 78]} />
```

Contenu :

- terrain sombre
- clôture
- tombes
- croix
- mausolée / petite chapelle
- lumière d'ambiance discrète
- label au sol `CIMETIÈRE SAINT-ÉTHER`

## Performance optimized

Optimisations appliquées :

- Tombes en `InstancedMesh`.
- Croix principales en `InstancedMesh`.
- Feuillages du parc en `InstancedMesh`.
- Positions pré-calculées avec `useMemo`.
- Matrices d'instances placées une seule fois dans `useEffect`.
- Pas de shader lourd.
- Pas de texture externe.
- Pas de runtime arcane dans la ville principale.

## Validation

```bash
npm run build
```

Résultat :

```txt
✓ built
```
