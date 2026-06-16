# Architecture TROXT — Personal Agent for EtherWorld

## Vision

TROXT remplace entièrement le SDK `@blinkdotnew/*` dans `engine-lab`. Il devient **ton** agent
personnel : client HTTP vers ton propre backend Express, plus tous les moteurs 3D nécessaires
à Visual Forge.

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT  (engine-lab/client/src/)                               │
│                                                                 │
│  Composants React ──import──▶ troxt (SDK)                       │
│                              │                                  │
│                              ├── UI Bridge (Card, Button, …)    │
│                              ├── Client HTTP                    │
│                              └── Engines 3D                     │
│                                       │                          │
│                                       ├── Recognition (TF.js)    │
│                                       ├── Mesh (relief, sym…)   │
│                                       ├── Export (GLB/OBJ)      │
│                                       └── Visual Forge runner   │
└─────────────────────────────────────┬───────────────────────────┘
                                      │ HTTP / Socket.IO
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVER  (engine-lab/server/)                                   │
│                                                                 │
│  Express + Socket.IO ──▶ endpoints /api/troxt/*                 │
│                     ──▶ worker pool pour jobs longs              │
│                     ──▶ écriture manifest + assets              │
└─────────────────────────────────────────────────────────────────┘
```

## Règles

1. **Aucun import de `@blinkdotnew/*` n'est toléré** dans `engine-lab` après migration.
2. **Les engines ne dépendent pas de TROXT**. Ils sont purs : `three`, `@tensorflow/tfjs`.
3. **Tout traitement lourd** (TF.js > 50 ms, mesh > 100k tri) doit passer par un Web Worker
   côté client ou par le worker Node côté serveur.
4. **TROXT ne ré-invente pas three.js**. Il expose des helpers fins, pas une surcouche inutile.
5. **Aucune dépendance cloud** dans le `package.json` de `engine-lab`. Tout est local.

## Mapping Blink → TROXT

| Blink                                            | TROXT                                  |
|--------------------------------------------------|----------------------------------------|
| `import { Button, Card, … } from '@blinkdotnew/ui'` | `import { Button, Card, … } from 'troxt/ui'` |
| `import { blink } from '@blinkdotnew/sdk'`           | `import { troxt } from 'troxt'`        |
| `blink.ai.generateImage(...)`                       | `troxt.ai.generateImage(...)`          |
| `blink.storage.uploadFile(...)`                     | `troxt.storage.uploadFile(...)`        |
| `blink.data.set(...)`                               | `troxt.data.set(...)`                  |
| `blink.functions.invoke(...)`                       | `troxt.functions.invoke(...)`          |
| (absent chez Blink)                                 | `troxt.manifest.write(...)`            |
| (absent chez Blink)                                 | `troxt.events` (EventBus)              |

## Hiérarchie des engines

```
engines/
├── recognition/        ← TF.js : sujet, profondeur, pose, matériaux
│   ├── visual-recognition-engine.ts   (orchestrateur)
│   ├── subject-detector.ts            (peau, ciel, ratio, edges)
│   ├── depth-estimator.ts             (brightness + MiDaS-ready)
│   └── material-analyzer.ts           (PBR par région)
│
├── mesh/               ← génération géométrique
│   ├── geometry-helpers.ts            (UV, normals, bounds)
│   ├── relief-mesh-builder.ts         (mode 1 — corrigé, grille stable)
│   ├── symmetry-mesh-builder.ts       (mode 2 — mono-image)
│   ├── intelligent-mesh-builder.ts    (mode 3 — depuis analyse)
│   └── topology-fixer.ts              (open edges, manifold check)
│
├── export/             ← sérialisation
│   ├── gltf-exporter.ts               (wrapper GLTFExporter)
│   ├── obj-exporter.ts                (wrapper OBJExporter)
│   └── manifest-writer.ts             (asset-manifest conforme)
│
├── autonomous/         ← surveillance de dossiers
│   ├── event-emitter.ts               (classe de base)
│   ├── job-queue.ts                   (FIFO sérialisable)
│   └── autonomous-engine.ts           (fs.watch + queue)
│
└── visual-forge/       ← orchestrateur global
    ├── forge-validator.ts             (contrat d'acceptation)
    ├── forge-planner.ts               (choix du mode reconstruction)
    └── forge-runner.ts                (pipeline complet)
```

## Cycle de vie d'un asset généré

```
GENERATED  ──ok──▶  VALIDATING  ──ok──▶  PREVIEW_READY
                       │
                       └──fail──▶  REJECTED

PREVIEW_READY  ──user approve──▶  USER_APPROVED  ──▶  QUARANTINE
                                                  │
                                                  ▼
                            GAME_TESTED  ──ok──▶  ACTIVE
                                              │
                                              └──fail──▶  QUARANTINE
```

Aucun asset ne saute directement à ACTIVE. Toujours quarantaine + test.
