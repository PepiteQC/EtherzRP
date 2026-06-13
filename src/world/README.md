# 🌍 EtherWorld RP - Système 3D Optimisé

## Vue d'ensemble

Le système `world/` contient une implémentation complètement optimisée du rendu 3D pour EtherWorld RP, avec support pour Québec, Trois-Rivières, Route 138 et les villages de Portneuf.

### Architecture clé

**LOD (Level of Detail)**
- Distances adaptatives : 50m → 150m → 300m → 800m
- Réduction géométrique automatique basée sur distance caméra
- Billboards pour objets très lointains

**Chunking Spatial**
- Tuiles de 256 unités (≈2.5 km réels)
- Grille max 3x3 en mémoire = 9 chunks
- Chargement/déchargement automatique

**Matériaux Partagés**
- 6 textures polymorphes : Brick, Concrete, Wood, Metal, Glass, Stone
- MaterialLibrary centralisée (GPU optimisé)

## Structure des dossiers

### `buildings/`
Système complet pour créer des bâtiments polymorphes.

**Fichiers:**
- `BuildingSystem.ts` - Core system
  - `Building3D` - Classe pour créer un bâtiment
  - `MaterialLibrary` - Matériaux réutilisables
  - `BuildingGeometryFactory` - Générateur de géométries
  - Types: `BuildingType` (RESIDENTIAL, COMMERCIAL, etc.), `TextureStyle`

- `components/BuildingsRenderer.tsx` - Composant React
  - Rendu optimisé pour React Three Fiber
  - Détection de distance automatique
  - Support callbacks de clic

**Exemple d'utilisation:**
```typescript
import { Building3D, MaterialLibrary, BuildingType, TextureStyle } from '../world/buildings/BuildingSystem';

const materialLib = new MaterialLibrary();
const building = new Building3D({
  id: 'building_001',
  type: BuildingType.RESIDENTIAL,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  height: 10,
  width: 15,
  depth: 20,
  textures: [TextureStyle.BRICK],
  roofType: 'pitched',
  windowCount: { x: 3, y: 2 },
  doorCount: 1,
}, materialLib);

const mesh = building.createMesh();
scene.add(mesh);
```

### `optimization/`
Systèmes de performance avancée.

**LODSystem.ts**
- `SimplificationEngine` - Réduit les vertices
- `LODInstanceManager` - Cache les géométries LOD
- `LODGeometry` interface

**ChunkManager.ts**
- `ChunkManager` - Gestionnaire principal
- Chargement/déchargement spatial
- Gestion mémoire automatique
- Stats en temps réel

**Exemple:**
```typescript
const chunkManager = new ChunkManager({}, materialLib);
chunkManager.registerBuildingData('chunk_0_0', [buildingConfig1, buildingConfig2]);
chunkManager.updateVisibility(cameraX, cameraZ); // Appeler chaque frame
```

### `data/`
Données géospatiales pour le monde.

**WorldDataManager.ts**
- Génère les chunks automatiquement
- Données pour : Québec, Trois-Rivières, Route 138, Portneuf
- Générateur procédural de bâtiments par district
- Interface `CityChunkData`

**Points géographiques (GEO_POINTS):**
```
QUEBEC_CENTER: (0, 0)
TROIS_RIVIERES_CENTER: (14, 140)
ROUTE_138: X=10, Z=-100 à 500
PORTNEUF villages: Saint-Raymond, Donnacona, etc.
```

**Exemple:**
```typescript
const worldData = new WorldDataManager();
const chunkData = worldData.getWorldData(camX, camZ);
// Retourne { chunkKey, buildings[], roads[] }
```

### `roads/`
Système complet de création de routes.

**RoadFactory.ts**
- Routes rectilignes et courbes (Bézier)
- Intersections et carrefours giratoires
- Marquages (lignes blanches/jaunes)
- Types: highway (4 voies), street (2 voies), road

**Exemple:**
```typescript
const roadFactory = new RoadFactory();
const roadData = roadFactory.createStraightRoad(
  0, 0, 0, 500, 20, 'highway'
);
scene.add(roadData.mesh);
```

### `scenes/`
Composants React pour scènes complètes.

**GameScene.tsx**
- `GameWorldManager` - Composant React principal
- Intègre Canvas Three.js
- Gère LOD, Chunking, Physique
- HUD de développement (stats)

**Exemple d'intégration:**
```typescript
import GameWorldManager from '../world/scenes/GameScene';

function App() {
  return (
    <GameWorldManager
      playerPosition={[0, 0.5, -100]}
      onPositionChange={(pos) => console.log(pos)}
    />
  );
}
```

### `interiors/`
(Réservé) Structures pour intérieurs:
- `corridor/` - Corridors d'appartements
- `rooms/` - Salles individuelles
- `hotel/` - Chambres d'hôtel

### `terrain/`
(Réservé) Systèmes de terrain:
- Génération de terrain
- Textures de sol
- Herbe, béton, chemins

### `physics/`
(Réservé) Physique Rapier:
- Collisions
- Corps rigides
- Constantes

### `textures/`
(Réservé) Assets de textures:
- Matériaux procéduraux
- Textures haute résolution
- Lightmaps

## Performance

### Optimisations clés

1. **Réutilisation des matériaux**
   - Tous les bâtiments d'un type partagent le même matériau
   - Réduit utilisation GPU de ~80%

2. **Géométrie simplifiée**
   - LOD réduit triangles de 75% à 1000+ mètres
   - Culling des objets à 800m+

3. **Chunking spatial**
   - Max 9 chunks en mémoire à la fois
   - Déchargement automatique = RAM stable
   - Charge préalable intelligente

### Benchmarks estimés

| Scène | Chunks | Buildings | FPS | Mémoire |
|-------|--------|-----------|-----|---------|
| Québec centre | 1 | 200 | 60+ | ~150MB |
| Trois-Rivières | 4 | 800 | 50+ | ~300MB |
| Route 138 seg | 2 | 100 | 60+ | ~200MB |
| Portneuf vill | 1 | 50 | 60+ | ~100MB |

## Intégration Firebase

(À venir) Fonctionnalités Firebase :
- Firestore pour data géospatiales
- Real-time sync positions joueurs
- Sauvegarde state du monde

## Roadmap

- [ ] Connexion Firebase Firestore
- [ ] Système multiplayer (positions joueurs)
- [ ] Physique Rapier complète
- [ ] Textures haute résolution
- [ ] Système jour/nuit
- [ ] Animations NPCs
- [ ] Son 3D spatial
- [ ] Système de véhicules optimisé

## Débogage

### Stats en temps réel
Le composant `GameScene` affiche un HUD avec:
- Nombre de chunks chargés
- Nombre total de bâtiments rendus
- FPS actuel

### Logs
```typescript
const stats = chunkManager.getStats();
console.log(stats); // { totalChunks, loadedChunks, visibleChunks, totalBuildings }
```

## Notes de développement

- 1 unité ≈ 10 mètres réels
- Coordonnées: X=Ouest/Est, Z=Sud/Nord
- Origine (0,0) = Centre Québec
- Tous les fichiers TypeScript stricts (tsconfig.json)
