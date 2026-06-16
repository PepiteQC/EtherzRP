# TROXT Backend — `/api/troxt/*` pour engine-lab

Ensemble **drop-in** de fichiers à copier dans `engine-lab/server/` pour
exposer la couche HTTP du SDK TROXT côté serveur Express.

## Fichiers à copier

Tous dans `engine-lab/server/troxt/` (nouveau sous-dossier) :

```
engine-lab/server/
├── troxt/                      ← nouveau sous-dossier (copier ici)
│   ├── router.mjs              ← point d'entrée Express
│   ├── data-store.mjs          ← KV + manifest + job persistence (atomic writes)
│   ├── job-runner.mjs          ← exécuteur de jobs Visual Forge (sharp + three.js)
│   ├── mesh-builders/
│   │   ├── relief-mesh.mjs     ← port serveur de l'algorithme relief
│   │   ├── topology.mjs        ← manifold check côté serveur
│   │   └── subject-detect.mjs  ← détection sujet côté serveur
│   ├── ai.mjs                  ← endpoints AI (génération image, fond, profondeur)
│   ├── storage.mjs             ← upload / delete fichiers
│   ├── data.mjs                ← CRUD KV
│   ├── functions.mjs           ← dispatcher de fonctions
│   ├── manifests.mjs           ← CRUD asset manifests
│   ├── visual-forge.mjs        ← submit / status / approve / reject jobs
│   └── socket-events.mjs       ← pont Socket.IO pour progression temps réel
│
├── data/                       ← enrichi (voir "Arborescence" ci-dessous)
│   ├── kv.local.json           ← nouveau
│   ├── manifests/              ← nouveau
│   ├── jobs/                   ← nouveau
│   ├── uploads/                ← nouveau
│   └── generated/              ← nouveau
│
└── index.mjs                   ← ajouter 3 lignes (voir integration-snippet.mjs)
```

## Dépendances à ajouter

```bash
cd engine-lab
npm install sharp        # traitement d'image serveur
npm install busboy       # parser multipart sans multer
# three est déjà installé (peer dep de @react-three/fiber)
```

## Arborescence `data/` après déploiement

```
engine-lab/server/data/
├── world.local.json           (existant, géré par engine-lab/server/index.mjs)
├── platforms.local.json       (existant)
├── buildings.local.json       (existant)
├── kv.local.json              (TROXT KV : clé → JSON sérialisé)
├── manifests/
│   ├── asset_hotel_chair_001.json
│   └── ...
├── jobs/
│   ├── job_1234567890_abcd.json
│   └── ...
├── uploads/                   (fichiers uploadés, jamais auto-purgés)
│   ├── 01HX...
│   └── ...
└── generated/                 (GLB produits par Visual Forge)
    ├── hotel_chair_001.glb
    └── ...
```

## Endpoints exposés

| Méthode | Chemin | Description |
|---|---|---|
| POST   | `/api/troxt/ai/generate-image` | Génération d'image (stub par défaut, pluggable) |
| POST   | `/api/troxt/ai/remove-background` | Suppression de fond (stub par défaut) |
| POST   | `/api/troxt/ai/depth` | Estimation profondeur (stub par défaut) |
| POST   | `/api/troxt/storage/upload` | Upload fichier (multipart, retourne id) |
| DELETE | `/api/troxt/storage/:id` | Suppression fichier uploadé |
| GET    | `/api/troxt/data/:key` | Lecture KV |
| PUT    | `/api/troxt/data/:key` | Écriture KV |
| DELETE | `/api/troxt/data/:key` | Suppression KV |
| POST   | `/api/troxt/functions/:name` | Invocation fonction (echo, validate-manifest, …) |
| POST   | `/api/troxt/visual-forge/jobs` | Submit job Visual Forge |
| GET    | `/api/troxt/visual-forge/jobs/:id` | Status + progress |
| POST   | `/api/troxt/visual-forge/jobs/:id/approve` | Approve (USER_APPROVED) |
| POST   | `/api/troxt/visual-forge/jobs/:id/reject` | Reject (REJECTED) |
| PUT    | `/api/troxt/manifests/:id` | Upsert manifest |
| GET    | `/api/troxt/manifests/:id` | Lecture manifest |
| DELETE | `/api/troxt/manifests/:id` | Suppression manifest |

## Socket.IO events

| Event | Payload |
|---|---|
| `troxt:job:progress` | `{ jobId, stage, pct, note? }` |
| `troxt:job:done`     | `{ jobId, manifestId, glbFilename }` |
| `troxt:job:failed`   | `{ jobId, error }` |
| `troxt:manifest:updated` | `{ id, status }` |

## Démarrage rapide

```bash
cd engine-lab
npm install sharp busboy

# Copier les fichiers :
cp -r /home/user/troxt-server/troxt server/troxt

# Éditer server/index.mjs : ajouter l'import et le mount (3 lignes)
# Voir integration-snippet.mjs pour le code exact.

# Démarrer :
npm run server
```

Tester :

```bash
# Health check
curl http://localhost:4101/api/troxt/functions/health

# Submit job
curl -X POST http://localhost:4101/api/troxt/visual-forge/jobs \
  -H "Content-Type: application/json" \
  -d '{"contract":{...},"inputPaths":["server/data/uploads/test.png"]}'

# Status
curl http://localhost:4101/api/troxt/visual-forge/jobs/JOB_ID
```

## Notes

- **Aucun appel cloud** dans ce backend par défaut. Les endpoints AI
  retournent un placeholder et loggent un warning — branche ton propre
  modèle (ONNX, llama.cpp, etc.) dans `ai.mjs` si besoin.
- **Jobs en série** : un seul job à la fois par défaut. Modifiable dans
  `job-runner.mjs` (`MAX_CONCURRENCY`).
- **Persistance atomique** : chaque écriture passe par `.tmp` + `rename`
  pour éviter les fichiers corrompus en cas de crash.
- **Pas de migration du `engine-lab` actuel** : on n'a touché à aucun
  fichier existant dans `engine-lab/`, on ajoute juste `troxt/` + 3
  lignes dans `index.mjs`.
