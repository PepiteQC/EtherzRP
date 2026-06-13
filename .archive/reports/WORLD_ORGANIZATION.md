# Plan d'organisation du projet EtherWorld RP

## Structure finale

```
src/
├── App.tsx                    # Point d'entrée principal (stable)
├── main.tsx                   # Bootstrap React
├── index.css                  # Styles globaux
├── components/                # Composants React hérités (à conserver pour compatibilité)
│   ├── Game.tsx              # Moteur de jeu principal (utilisé par App.tsx)
│   ├── Buildings.tsx         # Rendu des bâtiments (utilisé par Game.tsx)
│   ├── HUD.tsx
│   └── ...autres composants
├── world/                     # ⭐ NOUVEAU - Système 3D optimisé
│   ├── buildings/
│   │   ├── BuildingSystem.ts  # ✅ Système polytexturé
│   │   └── components/
│   │       └── BuildingsRenderer.tsx  # ✅ Composant React optimisé
│   ├── roads/
│   │   └── RoadFactory.ts     # ✅ Générer routes/carrefours
│   ├── scenes/
│   │   ├── GameScene.tsx      # ✅ Gestionnaire world LOD+Chunking
│   │   └── ...autres scènes
│   ├── data/
│   │   └── WorldDataManager.ts # ✅ Données Québec/Route 138/Portneuf
│   ├── optimization/
│   │   ├── LODSystem.ts       # ✅ Level of Detail
│   │   └── ChunkManager.ts    # ✅ Chunking spatial
│   ├── interiors/
│   │   ├── corridor/
│   │   ├── rooms/
│   │   └── hotel/
│   ├── terrain/
│   ├── textures/
│   └── physics/
├── data/
│   └── quebecBuildings.ts     # Données legacy
├── game/
├── systems/
├── store/
├── lib/
├── hooks/
├── utils/
├── legacy/
│   └── old-root/              # Code Next.js ancien (archivé, non compilé)
└── ...autres dossiers

.archive/
├── config-backups/            # ✅ Fichiers de config en doublon archivés
│   ├── tsconfig (2).json
│   ├── tsconfig (3).json
│   ├── vite.config (2).ts
│   ├── vite.config (3).ts
│   ├── vite.config.backup.before-tailwind.ts
│   └── package.backup.before-vite.json
└── ...
```

## ✅ Actions complétées

1. **Retrait Supabase** - 100% complété, seul dans legacy/old-root
2. **LOD & Chunking System** - Créé et optimisé
3. **Building System polytexturé** - BuildingSystem.ts + MaterialLibrary
4. **Road Factory** - Routes/carrefours/giratoires complets
5. **World Data Manager** - Québec + Trois-Rivières + Route 138 + Portneuf villages
6. **Doublons archivés** - Tous les fichiers en doublon dans .archive/

## 📋 Fichiers à NE PAS supprimer (100% sûr)

- `src/components/Game.tsx` - Utilisé par App.tsx (point d'entrée jeu)
- `src/components/Buildings.tsx` - Utilisé par Game.tsx
- `src/App.tsx` - Point d'entrée principal
- `src/main.tsx` - Bootstrap
- `src/data/quebecBuildings.ts` - Données en cours d'utilisation
- Tous les fichiers dans `src/hooks/`, `src/store/`, `src/lib/`

## 🗑️ Fichiers qui PEUVENT être supprimés progressivement

1. **Dossier entier**: `src/legacy/old-root/` (pas compilé, aucune dépendance)
2. **Fichiers racine en doublon**: Tous archivés dans `.archive/`
3. **Anciens fichiers de config**: Bien gardés dans `.archive/config-backups/`

## 🚀 Prochaines étapes

1. Tester la nouvelle structure avec les composants optimisés
2. Migrer progressivement Game.tsx vers GameScene.tsx (compatibilité)
3. Optim: supprimer src/legacy/old-root/ une fois migration complète
4. Intégrer Firebase Firestore pour les données géospatiales

## Notes d'optimisation

- LOD distance: 50m (haute) → 150m (med) → 300m (basse) → 800m (culling)
- Chunk size: 256 unités (≈2.5 km réels)
- Max chunks en mémoire: 9 (grille 3x3)
- Matériaux partagés = moins de mémoire GPU
- Polytexture: Brick, Concrete, Wood, Metal, Glass, Stone + toits
