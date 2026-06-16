/**
 * ForgeRunner — orchestrateur du pipeline complet Visual Forge.
 *
 * Étapes (toutes instrumentées avec reportProgress) :
 *   1. Ingestion des images
 *   2. Reconnaissance visuelle (SubjectDetector + Depth + Materials)
 *   3. Planification du mode de reconstruction
 *   4. Génération du mesh (selon mode)
 *   5. Inspection topologique + réparation
 *   6. Application des matériaux PBR
 *   7. Export GLB + Manifest
 *   8. Validation finale
 *
 * Le runner expose des événements via EventEmitter pour mise à jour UI.
 */

import * as THREE from 'three';
import { EventEmitter } from '../autonomous/event-emitter';
import type { VisualForgeContract } from '@contracts/VisualForgeContract';
import type { AssetManifest } from '@contracts/AssetManifest';
import { ManifestWriter } from 'troxt/manifest';
import { VisualRecognitionEngine } from '../recognition/visual-recognition-engine';
import { buildReliefMesh } from '../mesh/relief-mesh-builder';
import { buildSymmetryMesh } from '../mesh/symmetry-mesh-builder';
import { buildIntelligentMesh } from '../mesh/intelligent-mesh-builder';
import { inspectTopology, repairTopology } from '../mesh/topology-fixer';
import { exportGltf, type GltfExportOutput } from '../export/gltf-exporter';
import { validateForgeResult, type ValidationResult } from './forge-validator';
import { planReconstruction, type PlanOutput } from './forge-planner';
import { validateManifest } from '../export/manifest-writer';

export interface ForgeRunnerEventMap {
  'stage':     { stage: string; pct: number; note?: string };
  'plan':      PlanOutput;
  'mesh':      { triangleCount: number; openEdges: number };
  'export':    { sizeBytes: number; filename: string };
  'manifest':  AssetManifest;
  'done':      ValidationResult;
  'error':     { stage: string; message: string };
}

export interface ForgeRunnerInput {
  contract:  VisualForgeContract;
  jobId:     string;
  images:    Array<HTMLImageElement | HTMLCanvasElement | Blob>;
  manifestId: string;
  filename:   string;
}

export interface ForgeRunnerOutput {
  manifest:    AssetManifest;
  glb:         GltfExportOutput;
  validation:  ValidationResult;
  plan:        PlanOutput;
}

export class ForgeRunner extends EventEmitter<ForgeRunnerEventMap> {
  private readonly recognition = new VisualRecognitionEngine();

  async run(input: ForgeRunnerInput): Promise<ForgeRunnerOutput> {
    const { contract, jobId } = input;

    try {
      // ─────────────────────────────────────────
      // Stage 1 : ingestion images
      // ─────────────────────────────────────────
      this.reportStage('ingest', 5);
      const sources = await this.loadImages(input.images);

      // ─────────────────────────────────────────
      // Stage 2 : reconnaissance visuelle
      // ─────────────────────────────────────────
      this.reportStage('recognize', 20);
      const analysis = await this.recognition.analyze(sources[0], {
        enablePoseModel: false,        // opt-in (TF.js optionnel)
        enableSegmentation: false,
        onProgress: (s, p) => this.reportStage(`recognize:${s}`, 20 + p * 0.2),
      });

      // ─────────────────────────────────────────
      // Stage 3 : planification
      // ─────────────────────────────────────────
      this.reportStage('plan', 45);
      const plan = planReconstruction({
        contract,
        imageCount: sources.length,
        subject:    analysis.subject.type,
      });
      await this.emit('plan', plan);

      // ─────────────────────────────────────────
      // Stage 4 : génération du mesh
      // ─────────────────────────────────────────
      this.reportStage('mesh', 55);
      const mesh = await this.buildMesh(analysis, sources, contract, plan.mode);

      // ─────────────────────────────────────────
      // Stage 5 : inspection topologique
      // ─────────────────────────────────────────
      this.reportStage('topology', 70);
      const repaired = repairTopology(mesh.geometry);
      const topology = inspectTopology(repaired);
      await this.emit('mesh', {
        triangleCount: topology.totalTriangles,
        openEdges:     topology.openEdges,
      });

      // ─────────────────────────────────────────
      // Stage 6 : matériaux
      // ─────────────────────────────────────────
      this.reportStage('materials', 78);
      const matGroup = new THREE.Group();
      const meshObj = new THREE.Mesh(repaired, mesh.material);
      matGroup.add(meshObj);

      // ─────────────────────────────────────────
      // Stage 7 : export GLB + manifest
      // ─────────────────────────────────────────
      this.reportStage('export', 85);
      const glb = await exportGltf({
        object:   matGroup,
        filename: input.filename,
        format:   'glb',
      });
      await this.emit('export', { sizeBytes: glb.sizeBytes, filename: glb.filename });

      // Construction du manifest.
      const bbox = topology.bbox;
      const manifest = ManifestWriter.create(
        input.manifestId,
        input.filename,
        plan.mode,
        analysis.subject.type,
      );
      const withGeometry = ManifestWriter.setGeometry(manifest, {
        triangles: topology.totalTriangles,
        vertices:  topology.totalVertices,
        openEdges: topology.openEdges,
        hasCollider: contract.target.colliderRequired,
        bboxMin: [bbox.min.x, bbox.min.y, bbox.min.z],
        bboxMax: [bbox.max.x, bbox.max.y, bbox.max.z],
      });
      const finalManifest = ManifestWriter.setTextures(withGeometry, {
        resolution: contract.target.textureResolution,
        materialCount: analysis.materials.length,
      });

      // Mark status PREVIEW_READY.
      const advancedManifest = ManifestWriter.transition(
        finalManifest,
        'PREVIEW_READY',
        'forge-runner',
        `Job ${jobId} terminé`,
      );

      // ─────────────────────────────────────────
      // Stage 8 : validation finale
      // ─────────────────────────────────────────
      this.reportStage('validate', 95);
      const validation = validateForgeResult({
        contract,
        manifest: advancedManifest,
        topology,
        glbSize: glb.sizeBytes,
      });
      const contractCheck = validateManifest(
        advancedManifest,
        contract,
        glb.sizeBytes,
      );
      if (!contractCheck.ok) {
        validation.violations.push(...contractCheck.violations.map((v) => v.rule));
        validation.ok = validation.violations.length === 0;
      }
      await this.emit('manifest', advancedManifest);
      await this.emit('done', validation);

      return {
        manifest:   advancedManifest,
        glb,
        validation,
        plan,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.emit('error', { stage: 'unknown', message: msg });
      throw err;
    }
  }

  private reportStage(stage: string, pct: number, note?: string): void {
    void this.emit('stage', { stage, pct, note });
  }

  private async loadImages(
  images: ForgeRunnerInput['images'],
): Promise<HTMLImageElement[]> {
    const out: HTMLImageElement[] = [];
    for (const src of images) {
      if (src instanceof HTMLImageElement) {
        out.push(src);
        continue;
      }
      if (src instanceof HTMLCanvasElement) {
        out.push(await canvasToImage(src));
        continue;
      }
      if (typeof Blob !== 'undefined' && src instanceof Blob) {
        out.push(await blobToImage(src));
        continue;
      }
      throw new Error('Format d\'image non supporté');
    }
    return out;
  }

  private async buildMesh(
    analysis: Awaited<ReturnType<VisualRecognitionEngine['analyze']>>,
    sources: HTMLImageElement[],
    contract: VisualForgeContract,
    mode: PlanOutput['mode'],
  ): Promise<{ geometry: THREE.BufferGeometry; material: THREE.Material }> {
    if (sources.length === 0) throw new Error('Aucune image fournie');

    const first = sources[0];
    const ctx = this.ensureContext(first);
    const imageData = ctx.getImageData(0, 0, analysis.width, analysis.height);

    switch (mode) {
      case 'relief': {
        const out = buildReliefMesh({ imageData, contract });
        return { geometry: out.geometry, material: out.material };
      }
      case 'singleView': {
        const out = buildSymmetryMesh(imageData, contract);
        return { geometry: out.geometry, material: this.basicMaterial(analysis) };
      }
      case 'parametricCharacter':
      case 'multiView':
      case 'architectural': {
        const out = buildIntelligentMesh(analysis, first, contract);
        return { geometry: out.geometry, material: out.materials[0] ?? this.basicMaterial(analysis) };
      }
    }
  }

  private basicMaterial(analysis: { materials: { color: string; roughness: number; metalness: number }[] }) {
    const m = analysis.materials[0];
    return new THREE.MeshStandardMaterial({
      color:     m?.color ?? '#cccccc',
      roughness: m?.roughness ?? 0.7,
      metalness: m?.metalness ?? 0.0,
      vertexColors: true,
      side: THREE.DoubleSide,
    });
  }

  private ensureContext(source: HTMLImageElement | HTMLCanvasElement): CanvasRenderingContext2D {
    if (source instanceof HTMLCanvasElement) {
      const ctx = source.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D indisponible');
      return ctx;
    }
    const canvas = document.createElement('canvas');
    canvas.width  = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible');
    ctx.drawImage(source, 0, 0);
    return ctx;
  }
}

async function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL('image/png');
  });
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
