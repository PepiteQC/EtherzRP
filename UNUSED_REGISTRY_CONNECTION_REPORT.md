# EtherWorld — Connexion des registries qui étaient morts

Date: 2026-06-11

## Problème constaté

Le repo avait plusieurs systèmes parallèles :

```txt
src/data/ObjectModels.ts
src/data/quebecBuildings.ts
src/data/city/buildings/cityBuildings.ts
src/data/city/jobs/cityJobs.ts
src/game/city/registry/cityRegistry.ts
src/components/world/city/CityRuntime.tsx
```

`ObjectModels.ts` contenait un gros registry de modèles Three.js (`MODEL_DEFS`) mais n'était importé nulle part.  
`CityRuntime.tsx` démarrait le city manager mais rendait seulement des `<group>` vides.  
Donc oui : il y avait bien des fichiers pas connectés.

## Correction faite

### 1. Correction import ObjectModels

Dans :

```txt
src/data/ObjectModels.ts
```

Correction :

```ts
import type { ObjectCategory } from '../lib/etherworld/store'
```

Avant il importait `../store`, ce qui aurait cassé si on l'utilisait vraiment.

---

### 2. Renderer de modèles ObjectModels

Créé :

```txt
src/components/etherworld/builders/ObjectModelRenderer.tsx
```

Il permet de rendre un modèle du registry par ID :

```tsx
<ObjectModelRenderer modelId="couche" />
<ObjectModelRenderer modelId="hotel" />
<ObjectModelRenderer modelId="tower" />
```

Il ajoute aussi du `userData` :

```ts
{
  type: 'object_model_renderer',
  modelId,
  modelName,
  category
}
```

Et il dispose les geometries/materials au démontage.

---

### 3. Registre unifié

Créé :

```txt
src/data/registry/EtherWorldUnifiedRegistry.ts
src/data/registry/index.ts
```

Il rassemble :

- `MODEL_DEFS`
- `CATEGORIES`
- `quebecBuildings`
- `getBuildingDoors()`
- `CITY_BUILDINGS`
- `CITY_JOBS`

Export principal :

```ts
ETHERWORLD_UNIFIED_REGISTRY
```

Stats disponibles :

```ts
registry.stats.objectModels
registry.stats.categories
registry.stats.interactiveBuildings
registry.stats.cityBuildings
registry.stats.jobs
registry.stats.doors
```

---

### 4. CityRuntime connecté

Réécrit :

```txt
src/components/world/city/CityRuntime.tsx
```

Avant : rendait seulement des groupes vides.

Maintenant :

- boot `cityRegistry`
- lit `CITY_BUILDINGS`
- choisit un `modelId` depuis `ObjectModels`
- rend le modèle 3D via `ObjectModelRenderer`
- ajoute un cercle de couleur selon access level
- ajoute label 3D du bâtiment
- ajoute `userData.registryStats`

Mapping actuel :

```txt
depanneur → couche
hotel     → hotel
garage    → garage
police    → station
admin     → tower
shop      → depan
apartment → apart
fallback  → cube
```

---

### 5. CityRuntime branché dans la scène principale

Dans :

```txt
src/components/etherworld/Game.tsx
```

Ajout :

```tsx
<group position={[0, 0, 900]}>
  <CityRuntime />
</group>
```

Donc les bâtiments définis dans `CITY_BUILDINGS` apparaissent maintenant dans EtherWorld City.

## Validation

```bash
npm run build
```

Résultat :

```txt
✓ built
```

## Résultat

`ObjectModels.ts` n'est plus mort.  
`CITY_BUILDINGS` n'est plus seulement un seed abstrait.  
`CityRuntime` rend maintenant des objets 3D.  
Le repo commence à avoir une vraie passerelle entre :

```txt
Data Registry → Runtime City → Three.js Scene
```

## Note importante

Il reste encore d'autres systèmes parallèles historiques à connecter/nettoyer progressivement, mais celui-ci est maintenant branché proprement sans casser le build.
