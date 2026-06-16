/**
 * ForgeValidator — valide qu'un job et son résultat respectent le contrat.
 */

import type { VisualForgeContract } from '@contracts/VisualForgeContract';
import type { AssetManifest } from '@contracts/AssetManifest';
import type { TopologyReport } from '../mesh/topology-fixer';

export interface ValidationInput {
  contract:  VisualForgeContract;
  manifest:  AssetManifest;
  topology:  TopologyReport;
  glbSize?:  number;
}

export interface ValidationResult {
  ok:         boolean;
  score:      number;       // 0..1
  violations: string[];
  warnings:   string[];
}

export function validateForgeResult(input: ValidationInput): ValidationResult {
  const violations: string[] = [];
  const warnings:   string[] = [];

  // ── Contrat
  if (input.manifest.geometry.triangles > input.contract.target.polygonBudget) {
    violations.push(
      `triangles ${input.manifest.geometry.triangles} > budget ${input.contract.target.polygonBudget}`,
    );
  }
  if (input.topology.openEdges > input.contract.acceptance.maximumOpenEdges) {
    violations.push(
      `openEdges ${input.topology.openEdges} > max ${input.contract.acceptance.maximumOpenEdges}`,
    );
  }
  if (input.manifest.textures.materialCount > input.contract.acceptance.maximumMaterialCount) {
    violations.push(
      `materials ${input.manifest.textures.materialCount} > max ${input.contract.acceptance.maximumMaterialCount}`,
    );
  }
  if (input.manifest.confidence.overall < input.contract.acceptance.minimumConfidence) {
    violations.push(
      `confidence.overall ${input.manifest.confidence.overall.toFixed(2)} < min ${input.contract.acceptance.minimumConfidence}`,
    );
  }
  if (input.glbSize !== undefined) {
    const mb = input.glbSize / 1024 / 1024;
    if (mb > input.contract.acceptance.maximumFileSizeMb) {
      violations.push(
        `fileSize ${mb.toFixed(2)}MB > max ${input.contract.acceptance.maximumFileSizeMb}MB`,
      );
    }
  }

  // ── Avertissements (n'empêchent pas l'acceptance mais on les remonte)
  if (input.topology.duplicateVerts > 0) {
    warnings.push(`${input.topology.duplicateVerts} vertices dupliqués`);
  }
  if (input.topology.degenerateTris > 0) {
    warnings.push(`${input.topology.degenerateTris} triangles dégénérés`);
  }
  if (input.manifest.geometry.lodCount < 2 && input.contract.target.lodRequired) {
    warnings.push('LOD requis mais seulement 1 niveau généré');
  }

  // Score : base 1.0, pénalité par violation.
  let score = 1.0;
  for (const v of violations) score -= 0.15;
  for (const w of warnings)   score -= 0.03;
  score = Math.max(0, score);

  return { ok: violations.length === 0, score, violations, warnings };
}
