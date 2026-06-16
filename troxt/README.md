# TROXT — Personal Agent for EtherWorld

Remplace **complètement** `@blinkdotnew/*` dans `engine-lab/`. Aucune
dépendance cloud, 100% local.

## Quick start

```ts
// 1. Importer TROXT (le SDK)
import { troxt, troxtEvents, ManifestWriter } from 'troxt';

// 2. Importer les engines (logique 3D)
import {
  VisualRecognitionEngine,
  buildReliefMesh,
  buildSymmetryMesh,
  buildIntelligentMesh,
  inspectTopology,
  repairTopology,
  exportGltf,
  validateForgeResult,
  planReconstruction,
  ForgeRunner,
  AutonomousEngine,
} from 'troxt/engines';

// 3. Importer les types
import type { VisualForgeContract } from 'troxt/contracts';
import { createDefaultContract, applyQualityPreset } from 'troxt/contracts';

// 4. Importer l'UI bridge (remplace @blinkdotnew/ui)
import { Button, Card, Slider, Progress, Badge, ToastProvider, toast } from 'troxt/ui';
```

## Architecture

```
troxt/
├── ARCHITECTURE.md          ← architecture globale
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts             ← entrée principale
    │
    ├── troxt/               ← SDK agent personnel
    │   ├── client.ts        (HTTP, ai, storage, data, functions, visualForge)
    │   ├── types.ts
    │   ├── events.ts        (TroxtEventBus)
    │   ├── manifest.ts      (ManifestWriter helpers)
    │   ├── ui-bridge.tsx    (Button, Card, Slider, Progress, Badge, Toast)
    │   └── index.ts
    │
    ├── contracts/           ← types et contrats
    │   ├── SubjectType.ts
    │   ├── ReconstructionMode.ts
    │   ├── AssetManifest.ts
    │   ├── VisualForgeContract.ts
    │   └── index.ts
    │
    └── engines/             ← tous les moteurs 3D
        ├── recognition/
        │   ├── subject-detector.ts
        │   ├── depth-estimator.ts
        │   ├── material-analyzer.ts
        │   └── visual-recognition-engine.ts
        ├── mesh/
        │   ├── geometry-helpers.ts
        │   ├── relief-mesh-builder.ts   (mode relief — corrigé)
        │   ├── symmetry-mesh-builder.ts (mode singleView)
        │   ├── intelligent-mesh-builder.ts (modes avancés)
        │   └── topology-fixer.ts
        ├── export/
        │   ├── gltf-exporter.ts
        │   ├── obj-exporter.ts
        │   └── manifest-writer.ts
        ├── autonomous/
        │   ├── event-emitter.ts
        │   ├── job-queue.ts
        │   └── autonomous-engine.ts
        └── visual-forge/
            ├── forge-planner.ts
            ├── forge-validator.ts
            └── forge-runner.ts
```

## Exemple complet

```tsx
import { useState } from 'react';
import {
  ForgeRunner,
  VisualRecognitionEngine,
  buildReliefMesh,
  inspectTopology,
  exportGltf,
  validateForgeResult,
} from 'troxt/engines';
import { Card, Button, Slider, Progress, ToastProvider, toast } from 'troxt/ui';
import { createDefaultContract, applyQualityPreset } from 'troxt/contracts';

export function PhotoTo3DDemo() {
  const [contract, setContract] = useState(createDefaultContract('demo'));
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [manifest, setManifest] = useState<any>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();

    const runner = new ForgeRunner();
    runner.on('stage', (e) => {
      setProgress(e.pct);
      setStage(e.stage);
    });
    runner.on('manifest', (m) => setManifest(m));
    runner.on('done', (v) => {
      if (v.ok) toast.success('Forge validé !');
      else toast.error(`${v.violations.length} violation(s)`);
    });

    try {
      const out = await runner.run({
        contract,
        jobId: 'demo',
        manifestId: 'demo_001',
        filename: 'demo.glb',
        images: [img],
      });
      const blobUrl = URL.createObjectURL(out.glb.blob);
      setGlbUrl(blobUrl);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <ToastProvider>
      <Card title="Visual Forge Demo">
        <Slider
          label="Niveau de détail"
          value={contract.detailLevel}
          onChange={(v) => setContract({ ...contract, detailLevel: v })}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {(['draft','preview','standard','hd','4k'] as const).map((q) => (
            <Button
              key={q}
              variant={contract.quality === q ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContract(applyQualityPreset(contract, q))}
            >{q.toUpperCase()}</Button>
          ))}
        </div>
        <Progress value={progress} showLabel />
        {stage && <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
          Stage: {stage}
        </div>}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          style={{ marginTop: 12 }}
        />
        {glbUrl && (
          <a href={glbUrl} download="model.glb" style={{ display: 'block', marginTop: 12 }}>
            Télécharger .glb
          </a>
        )}
        {manifest && (
          <pre style={{ fontSize: 11, marginTop: 12, color: '#888' }}>
            {JSON.stringify(manifest.geometry, null, 2)}
          </pre>
        )}
      </Card>
    </ToastProvider>
  );
}
```

## Intégration dans engine-lab

1. Copier `troxt/src/` → `engine-lab/client/src/troxt/`
2. Dans `engine-lab/package.json`, ajouter :
   ```json
   "troxt": "file:./client/src/troxt"
   ```
3. Remplacer tous les imports `@blinkdotnew/ui` → `troxt/ui`
4. Remplacer tous les imports `from '@blinkdotnew/sdk'` → `from 'troxt'`
5. Ajouter un endpoint `/api/troxt/*` dans `engine-lab/server/index.mjs`
   qui sert les routes documentées dans `troxt/src/troxt/client.ts`.

Voir `ARCHITECTURE.md` pour le détail.
