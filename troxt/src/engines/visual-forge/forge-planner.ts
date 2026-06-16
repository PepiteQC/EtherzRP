/**
 * ForgePlanner — choisit le mode de reconstruction et la stratégie
 * d'après les informations disponibles (nb de photos, sujet, qualité).
 */

import type { VisualForgeContract } from '@contracts/VisualForgeContract';
import { DEFAULT_MODE_BY_SUBJECT } from '@contracts/SubjectType';
import type { SubjectType } from '@contracts/SubjectType';
import type { ReconstructionMode, ModeConfidence } from '@contracts/ReconstructionMode';

export interface PlanInput {
  contract:    VisualForgeContract;
  imageCount:  number;
  subject:     SubjectType;
  observedRatio?: number;
}

export interface PlanOutput {
  mode:          ReconstructionMode;
  reasoning:     string[];
  recommended:   string[];
  confidence:    ModeConfidence;
  needsMore:     boolean;
  extraPhotos:   number;
}

export function planReconstruction(input: PlanInput): PlanOutput {
  const reasoning: string[] = [];
  const recommended: string[] = [];

  const defaultMode = DEFAULT_MODE_BY_SUBJECT[input.subject];
  let mode: ReconstructionMode = defaultMode;
  reasoning.push(
    `Sujet détecté: ${input.subject}. Mode par défaut: ${defaultMode}.`,
  );

  // Override selon le nombre d'images disponibles.
  if (input.imageCount === 1) {
    if (defaultMode === 'multiView') {
      mode = 'singleView';
      reasoning.push(
        '1 seule image disponible pour multiView → fallback singleView.',
      );
      recommended.push('Ajouter 12 à 30 photos (tour complet) pour multiView.');
    }
    if (defaultMode === 'architectural') {
      mode = 'relief';
      reasoning.push(
        '1 seule image pour architectural → fallback relief 2.5D.',
      );
      recommended.push('Ajouter 20+ photos de la pièce/bâtiment.');
    }
  } else if (input.imageCount >= 4 && input.subject === 'object') {
    mode = 'multiView';
    reasoning.push('4+ images d\'objet → multiView recommandé.');
  } else if (input.imageCount >= 12 && input.subject === 'building') {
    mode = 'architectural';
    reasoning.push('12+ images de bâtiment → architectural recommandé.');
  }

  // Calcul de confiance par mode.
  const observed = input.observedRatio ?? observedDefaultFor(mode);
  const inferred = 1 - observed;
  const overall  = observed * modeScoreFactor(mode);

  const needsMore = overall < 0.7;
  const extraPhotos = needsMore ? estimateExtraPhotos(mode, input.imageCount) : 0;
  if (needsMore) {
    recommended.push(
      `${extraPhotos} photos supplémentaires recommandées pour atteindre une confiance ≥ 0.7.`,
    );
  }

  return {
    mode,
    reasoning,
    recommended,
    confidence: {
      observed,
      inferred,
      unknown:    0,
      overall:    Math.max(0, Math.min(1, overall)),
      warnings:   [],
    },
    needsMore,
    extraPhotos,
  };
}

function observedDefaultFor(mode: ReconstructionMode): number {
  switch (mode) {
    case 'relief':               return 0.50;
    case 'singleView':           return 0.30;
    case 'parametricCharacter':  return 0.40;
    case 'multiView':            return 0.85;
    case 'architectural':        return 0.90;
  }
}

function modeScoreFactor(mode: ReconstructionMode): number {
  switch (mode) {
    case 'relief':               return 0.6;
    case 'singleView':           return 0.55;
    case 'parametricCharacter':  return 0.70;
    case 'multiView':            return 0.95;
    case 'architectural':        return 1.00;
  }
}

function estimateExtraPhotos(mode: ReconstructionMode, current: number): number {
  switch (mode) {
    case 'relief':               return 0;
    case 'singleView':           return 20;
    case 'parametricCharacter':  return 6;
    case 'multiView':            return Math.max(0, 25 - current);
    case 'architectural':        return Math.max(0, 40 - current);
  }
}
