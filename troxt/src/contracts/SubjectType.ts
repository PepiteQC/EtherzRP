/**
 * SubjectType — ce que la reconnaissance visuelle a identifié dans la photo.
 * Aligné avec la valeur retournée par SubjectDetector.
 */
export type SubjectType =
  | 'portrait'
  | 'fullBody'
  | 'object'
  | 'product'
  | 'building'
  | 'room'
  | 'scene'
  | 'unknown';

/**
 * Mapping recommandé entre SubjectType et ReconstructionMode par défaut.
 * Le planneur peut surcharger selon la qualité des images.
 */
export const DEFAULT_MODE_BY_SUBJECT: Record<SubjectType, ReconstructionMode> = {
  portrait:    'parametricCharacter',
  fullBody:    'parametricCharacter',
  object:      'multiView',
  product:     'multiView',
  building:    'architectural',
  room:        'architectural',
  scene:       'relief',
  unknown:     'relief',
};

import type { ReconstructionMode } from './ReconstructionMode';
