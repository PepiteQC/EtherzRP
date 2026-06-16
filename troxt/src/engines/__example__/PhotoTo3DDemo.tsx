/**
 * Exemple d'intégration complète dans un composant React.
 *
 * Démontre :
 *   - ToastProvider + toast
 *   - Card + Button + Slider + Progress
 *   - ForgeRunner (pipeline complet)
 *   - applyQualityPreset (changement de qualité)
 *   - ManifestWriter + tri du manifest
 *
 * Copier ce fichier dans engine-lab/client/src/components/VisualForgeDemo.tsx
 * et adapter les chemins d'import à `troxt/...`.
 */

import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Slider,
  Progress,
  Badge,
  ToastProvider,
  useToast,
} from 'troxt/ui';
import { troxt } from 'troxt';
import { troxtEvents, ManifestWriter } from 'troxt';
import { ForgeRunner } from 'troxt/engines';
import {
  createDefaultContract,
  applyQualityPreset,
  type VisualForgeContract,
  type QualityLevel,
} from 'troxt/contracts';

const QUALITY_PRESETS: QualityLevel[] = ['draft', 'preview', 'standard', 'hd', '4k'];

export function VisualForgeDemo() {
  const toast = useToast();
  const [contract, setContract] = useState<VisualForgeContract>(() =>
    createDefaultContract('demo_job', 'unknown', 'relief'),
  );
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('idle');
  const [manifest, setManifest] = useState<any>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>(null);

  const handleUpload = useCallback(async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await img.decode();

      const runner = new ForgeRunner();
      runner.on('stage', (e) => {
        setProgress(e.pct);
        setStage(e.stage);
      });
      runner.on('plan', (plan) => {
        toast.info(`Mode sélectionné: ${plan.mode}`);
        if (plan.recommended.length > 0) {
          toast.warn(plan.recommended[0] ?? '');
        }
      });
      runner.on('manifest', (m) => setManifest(m));
      runner.on('done', (v) => {
        setValidation(v);
        if (v.ok) {
          toast.success(`✓ Validation passée (score ${v.score.toFixed(2)})`);
        } else {
          toast.error(`${v.violations.length} violation(s)`);
        }
      });

      const out = await runner.run({
        contract,
        jobId: 'demo_job',
        manifestId: `demo_${Date.now()}`,
        filename: `model_${Date.now()}.glb`,
        images: [img],
      });

      const blobUrl = URL.createObjectURL(out.glb.blob);
      setGlbUrl(blobUrl);

      // Push le manifest au backend TROXT.
      await ManifestWriter.push(out.manifest);
      toast.success('Manifest poussé au backend.');
    } catch (err: any) {
      toast.error(err.message ?? String(err));
    }
  }, [contract, toast]);

  return (
    <ToastProvider>
      <Card title="🎨 Visual Forge" style={{ maxWidth: 720 }}>
        {/* Quality presets */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUALITY_PRESETS.map((q) => (
            <Button
              key={q}
              size="sm"
              variant={contract.quality === q ? 'default' : 'outline'}
              onClick={() => setContract(applyQualityPreset(contract, q))}
            >{q.toUpperCase()}</Button>
          ))}
        </div>

        {/* Detail slider */}
        <div style={{ marginTop: 16 }}>
          <Slider
            label={`Détail : ${contract.detailLevel}%`}
            value={contract.detailLevel}
            min={10}
            max={100}
            onChange={(v) => setContract({ ...contract, detailLevel: v })}
          />
        </div>

        {/* Symmetry toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <label>Symétrie :</label>
          <Button
            size="sm"
            variant={contract.symmetry ? 'default' : 'outline'}
            onClick={() => setContract({ ...contract, symmetry: !contract.symmetry })}
          >
            {contract.symmetry ? 'ON' : 'OFF'}
          </Button>
        </div>

        {/* File input */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          style={{ marginTop: 16, color: 'var(--t-text)' }}
        />

        {/* Progress */}
        {stage !== 'idle' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--t-muted)', marginBottom: 4 }}>
              Stage : <code>{stage}</code>
            </div>
            <Progress value={progress} showLabel />
          </div>
        )}

        {/* Validation */}
        {validation && (
          <div style={{ marginTop: 12 }}>
            <Badge variant={validation.ok ? 'ok' : 'danger'}>
              Score : {validation.score.toFixed(2)}
            </Badge>
            {validation.violations.map((v: string) => (
              <div key={v} style={{ fontSize: 11, color: 'var(--t-danger)', marginTop: 4 }}>
                ⚠ {v}
              </div>
            ))}
          </div>
        )}

        {/* Download */}
        {glbUrl && (
          <a
            href={glbUrl}
            download="model.glb"
            style={{
              display: 'inline-block',
              marginTop: 16,
              padding: '8px 14px',
              background: 'var(--t-primary)',
              color: '#0a0d12',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >⬇ Télécharger .glb</a>
        )}

        {/* Manifest preview */}
        {manifest && (
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--t-muted)' }}>
              Manifest ({manifest.geometry.triangles} tri, {manifest.textures.materialCount} mat)
            </summary>
            <pre style={{
              fontSize: 10,
              background: 'var(--t-panel2)',
              padding: 8,
              borderRadius: 6,
              overflow: 'auto',
              maxHeight: 200,
            }}>{JSON.stringify(manifest, null, 2)}</pre>
          </details>
        )}
      </Card>
    </ToastProvider>
  );
}
