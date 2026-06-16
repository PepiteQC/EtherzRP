/**
 * ManifestWriter — sérialisation d'un AssetManifest vers JSON + helpers
 * de validation des critères d'acceptation.
 */

import type { AssetManifest, AssetStatus } from '@contracts/AssetManifest';
import { createEmptyManifest } from '@contracts/AssetManifest';
import type { ReconstructionMode } from '@contracts/ReconstructionMode';
import type { SubjectType } from '@contracts/SubjectType';
import type { VisualForgeContract } from '@contracts/VisualForgeContract';

export interface ManifestValidationResult {
  ok:        boolean;
  violations: Array<{ rule: string; expected: string; actual: string }>;
}

export function validateManifest(
  manifest: AssetManifest,
  contract: VisualForgeContract,
  glbSizeBytes?: number,
): ManifestValidationResult {
  const violations: ManifestValidationResult['violations'] = [];

  // 1. Statut minimum.
  const allowedStatuses: AssetStatus[] = ['VALIDATING', 'PREVIEW_READY', 'USER_APPROVED', 'GAME_TESTED', 'ACTIVE'];
  if (!allowedStatuses.includes(manifest.status)) {
    violations.push({
      rule: 'status',
      expected: allowedStatuses.join('|'),
      actual: manifest.status,
    });
  }

  // 2. Open edges.
  if (manifest.geometry.openEdges > contract.acceptance.maximumOpenEdges) {
    violations.push({
      rule: 'geometry.openEdges',
      expected: `<= ${contract.acceptance.maximumOpenEdges}`,
      actual: String(manifest.geometry.openEdges),
    });
  }

  // 3. Matériaux.
  if (manifest.textures.materialCount > contract.acceptance.maximumMaterialCount) {
    violations.push({
      rule: 'textures.materialCount',
      expected: `<= ${contract.acceptance.maximumMaterialCount}`,
      actual: String(manifest.textures.materialCount),
    });
  }

  // 4. Confidence.
  if (manifest.confidence.overall < contract.acceptance.minimumConfidence) {
    violations.push({
      rule: 'confidence.overall',
      expected: `>= ${contract.acceptance.minimumConfidence}`,
      actual: String(manifest.confidence.overall),
    });
  }

  // 5. File size (vérifié si on a la taille).
  if (glbSizeBytes !== undefined) {
    const mb = glbSizeBytes / 1024 / 1024;
    if (mb > contract.acceptance.maximumFileSizeMb) {
      violations.push({
        rule: 'fileSize',
        expected: `<= ${contract.acceptance.maximumFileSizeMb} MB`,
        actual: `${mb.toFixed(2)} MB`,
      });
    }
  }

  // 6. polygonBudget.
  if (manifest.geometry.triangles > contract.target.polygonBudget * 1.1) {
    violations.push({
      rule: 'geometry.triangles',
      expected: `<= ${contract.target.polygonBudget}`,
      actual: String(manifest.geometry.triangles),
    });
  }

  return { ok: violations.length === 0, violations };
}

export function serializeManifest(manifest: AssetManifest): string {
  return JSON.stringify(manifest, null, 2);
}

export function deserializeManifest(json: string): AssetManifest {
  const obj = JSON.parse(json);
  // Validation très basique.
  if (!obj.id || !obj.filename || !obj.status) {
    throw new Error('Manifest invalide : champs id/filename/status requis');
  }
  return obj as AssetManifest;
}

export function newManifest(
  id: string,
  filename: string,
  mode: ReconstructionMode,
  subject: SubjectType,
): AssetManifest {
  return createEmptyManifest(id, filename, mode, subject);
}
