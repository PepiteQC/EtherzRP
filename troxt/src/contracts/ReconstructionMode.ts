/**
 * ReconstructionMode — la stratégie choisie par ForgePlanner.
 *
 *  • relief               : plaque volumétrique 2.5D (1 photo)
 *  • singleView           : objet 3D approximatif depuis 1 photo
 *  • parametricCharacter  : enveloppe corporelle paramétrique
 *  • multiView            : reconstruction depuis N photos (SfM/MVS)
 *  • architectural        : reconstruction de pièce / bâtiment
 */
export type ReconstructionMode =
  | 'relief'
  | 'singleView'
  | 'parametricCharacter'
  | 'multiView'
  | 'architectural';

/**
 * Score de confiance géométrique par mode.
 * Utilisé par ForgePlanner pour recommander plus de photos ou changer de mode.
 */
export interface ModeConfidence {
  observed:   number; // ratio de la surface réellement vue (0..1)
  inferred:   number; // ratio de la surface inférée   (0..1)
  unknown:    number; // ratio non couvert             (0..1)
  overall:    number; // 0..1
  warnings:   string[];
}

export const MINIMUM_OBSERVED_RATIO: Record<ReconstructionMode, number> = {
  relief:               0.50,
  singleView:           0.30,
  parametricCharacter:  0.40,
  multiView:            0.85,
  architectural:        0.90,
};
