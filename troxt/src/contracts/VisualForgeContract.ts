/**
 * VisualForgeContract — le contrat passé au ForgeRunner avant tout traitement.
 *
 * Tout job DOIT avoir un contrat. Pas de contrat = pas de job.
 */

import type { SubjectType } from './SubjectType';
import type { ReconstructionMode } from './ReconstructionMode';

export type QualityLevel = 'draft' | 'preview' | 'standard' | 'hd' | '4k';
export type TextureResolution = 512 | 1024 | 2048 | 4096;

export interface GenerationTarget {
  polygonBudget:    number;        // 1000..500000
  textureResolution: TextureResolution;
  rigRequired:      boolean;
  colliderRequired: boolean;
  lodRequired:      boolean;
  lodLevels:        number;       // si lodRequired
}

export interface AcceptanceCriteria {
  maximumFileSizeMb:    number;
  minimumConfidence:    number;   // 0..1
  maximumOpenEdges:     number;
  maximumMaterialCount: number;
  mustLoadInThreeJs:    boolean;
  mustExportGlb:        boolean;
}

export interface VisualForgeContract {
  jobId:          string;
  createdAt:      number;
  sourceCount:    number;
  subjectType:    SubjectType;
  reconstructionMode: ReconstructionMode;

  quality:        QualityLevel;
  symmetry:       boolean;
  detailLevel:    number;          // 0..100
  autoDetect:     boolean;

  target:         GenerationTarget;
  acceptance:     AcceptanceCriteria;

  metadata?:      Record<string, unknown>;
}

export function createDefaultContract(
  jobId: string,
  subjectType: SubjectType = 'unknown',
  mode: ReconstructionMode = 'relief',
): VisualForgeContract {
  return {
    jobId,
    createdAt: Date.now(),
    sourceCount: 0,
    subjectType,
    reconstructionMode: mode,
    quality: 'standard',
    symmetry: false,
    detailLevel: 70,
    autoDetect: true,
    target: {
      polygonBudget: 8000,
      textureResolution: 1024,
      rigRequired: false,
      colliderRequired: true,
      lodRequired: false,
      lodLevels: 1,
    },
    acceptance: {
      maximumFileSizeMb: 25,
      minimumConfidence: 0.6,
      maximumOpenEdges: 0,
      maximumMaterialCount: 4,
      mustLoadInThreeJs: true,
      mustExportGlb: true,
    },
  };
}

/**
 * Adapte un contrat vers une qualité donnée. Utilisé quand l'utilisateur
 * change de preset (draft / preview / standard / hd / 4k).
 */
export function applyQualityPreset(
  base: VisualForgeContract,
  quality: QualityLevel,
): VisualForgeContract {
  const presets: Record<QualityLevel, Partial<GenerationTarget>> = {
    draft:    { polygonBudget: 500,   textureResolution: 512  },
    preview:  { polygonBudget: 2000,  textureResolution: 1024 },
    standard: { polygonBudget: 8000,  textureResolution: 1024 },
    hd:       { polygonBudget: 25000, textureResolution: 2048 },
    '4k':     { polygonBudget: 100000,textureResolution: 4096 },
  };
  return {
    ...base,
    quality,
    target: { ...base.target, ...presets[quality] },
  };
}
